"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "@react-spring/web";
import { SceneLighting } from "../three/SceneLighting";
import { CardRevealThree } from "../three/CardRevealThree";
import { TearingPackThree } from "../three/TearingPackThree";
import { MuteButton } from "./MuteButton";
import { Card as CardType } from "../../data/types";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";
import * as THREE from "three";

interface PackRipOverlay3DProps {
  isOpen: boolean;
  isClosing?: boolean;
  season: string;
  cards: CardType[];
  onClose: () => void;
  onRipComplete: () => void;
  mode?: "single" | "box";
  // Skips the manual drag gestures and drives both the tear and the card
  // reveals automatically. Useful when gestures are inconvenient/awkward on
  // the device or for accessibility.
  autoOpen?: boolean;
  isGod?: boolean;
}

type Phase = "idle" | "tear" | "burst" | "stream" | "cards" | "done";
type CinematicMode = "idle" | "suspense" | "reveal";

// Silhouette stream: 10 cards dash across the backdrop; the final 5 settle
// into a row. The extra pass-through cards build suspense before the reveal.
const STREAM_CARD_COUNT = 10;
const STREAM_CARD_STAGGER = 190;
const STREAM_CARD_TRAVEL_TIME = 1400;
// How long the final 5 silhouettes hold their row before the real cards
// fly in. A longer hold makes the player anticipate the reveal.
const STREAM_SETTLE_HOLD = 700;
const STREAM_DURATION =
  (STREAM_CARD_COUNT - 1) * STREAM_CARD_STAGGER + STREAM_CARD_TRAVEL_TIME;
// Five final cards land at these x offsets (left→right) so they read as a
// tidy silhouette row behind the real cards.
const FINAL_STREAM_OFFSETS = [
  "max(-496px, -40vw)",
  "max(-248px, -20vw)",
  "0px",
  "min(20vw, 248px)",
  "min(40vw, 496px)",
];

function CinematicCamera({
  mode,
  prefersReducedMotion,
  tearProgressRef,
}: {
  mode: CinematicMode;
  prefersReducedMotion: boolean;
  tearProgressRef: { current: number };
}) {
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const targetX = 0;
    let targetY = 0.08;
    let targetZ = 6.7;

    if (mode === "idle") {
      targetY += tearProgressRef.current * 0.06;
      targetZ -= tearProgressRef.current * 0.45;
    } else if (mode === "suspense") {
      targetY = 0.48 + (prefersReducedMotion ? 0 : Math.cos(t * 0.8) * 0.025);
      targetZ = 5.75 + (prefersReducedMotion ? 0 : Math.sin(t * 1.2) * 0.05);
    } else if (mode === "reveal") {
      targetY = 0.5;
      targetZ = 6;
    }

    // Frame-rate independent lerp (exponential decay) using delta time
    const speed = 2.8;
    const smoothing = prefersReducedMotion ? 1 : 1 - Math.exp(-speed * delta);

    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      targetX,
      smoothing,
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      targetY,
      smoothing,
    );
    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z,
      targetZ,
      smoothing,
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export const PackRipOverlay3D: React.FC<PackRipOverlay3DProps> = ({
  isOpen,
  isClosing = false,
  season,
  cards,
  onClose,
  onRipComplete,
  mode = "single",
  autoOpen = false,
  isGod,
}) => {
  const [phase, setPhase] = useState<Phase>(isOpen ? "tear" : "idle");
  const [showStream, setShowStream] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [cinematicMode, setCinematicMode] = useState<CinematicMode>("idle");
  const [showHighRarityImpact, setShowHighRarityImpact] = useState(false);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { playSFX, startBGM, stopBGM } = useAudio();
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const impactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const impactFrameRef = useRef<number | null>(null);
  const tearProgressRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (impactTimerRef.current) {
      clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }
    if (impactFrameRef.current !== null) {
      cancelAnimationFrame(impactFrameRef.current);
      impactFrameRef.current = null;
    }
  }, []);

  const isGodPack =
    isGod !== undefined
      ? isGod
      : cards.length === 5 &&
        cards.every((c) => ["SSR", "UR", "SEC", "LEG"].includes(c.rarity));

  // Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (phase === "cards" || phase === "done")) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, phase, onClose]);

  // Move focus into the modal and restore it when the overlay closes.
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => overlayRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen]);

  // Toggle body class to hide navigation header
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("pack-rip-overlay-active");
    } else {
      document.body.classList.remove("pack-rip-overlay-active");
    }
    return () => {
      document.body.classList.remove("pack-rip-overlay-active");
    };
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      stopBGM();
      // Defer state resets to avoid setting state synchronously in effect
      const t = setTimeout(() => {
        setPhase("idle");
        setShowStream(false);
        setShowCards(false);
        setCinematicMode("idle");
        setShowHighRarityImpact(false);
        tearProgressRef.current = 0;
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, clearTimers, stopBGM]);

  // Mount the pack and wait for the player to tear it. The rest of the flow is
  // released by the tear callbacks instead of a fixed cutscene timer.
  useEffect(() => {
    if (!isOpen || cards.length === 0) return;

    const t_init = setTimeout(() => {
      setPhase("tear");
    }, 0);
    startBGM(AUDIO_URLS.BGM_GOD, 0.02);
    timersRef.current = [t_init];

    return () => {
      clearTimers();
      stopBGM();
    };
  }, [isOpen, cards.length, startBGM, clearTimers, stopBGM]);

  const handleTearThreshold = useCallback(() => {
    playSFX(AUDIO_URLS.TEAR_PACK, 0.25);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  }, [playSFX]);

  const handleTearComplete = useCallback(() => {
    // Core gameplay: always play the full stream animation regardless of
    // reduced-motion preference — it's part of the pack opening experience.
    const streamDuration = STREAM_DURATION + STREAM_SETTLE_HOLD;
    onRipComplete();
    setPhase("burst");

    // Silhouettes dash across the stage first…
    const streamTimer = setTimeout(() => {
      setShowStream(true);
      setCinematicMode("suspense");
      setPhase("stream");
    }, 220);

    // …after the stream settles, the real cards fly into the row and start
    // their sequential flip reveal.
    const cardsTimer = setTimeout(() => {
      setShowCards(true);
      setPhase("cards");
      setCinematicMode("reveal");

      // Defer hiding the CSS stream slightly so that it can fade out smoothly
      // using the .card-stream.settling transition while the 3D cards mount.
      const cleanupStreamTimer = setTimeout(() => {
        setShowStream(false);
      }, 400);
      timersRef.current.push(cleanupStreamTimer);
    }, 220 + streamDuration);

    timersRef.current.push(streamTimer, cardsTimer);
  }, [onRipComplete]);

  const handleHighRarityImpact = useCallback(() => {
    console.log(
      "[PackRipOverlay3D] handleHighRarityImpact triggered. isGodPack =",
      isGodPack,
    );
    if (impactTimerRef.current) clearTimeout(impactTimerRef.current);
    if (impactFrameRef.current !== null) {
      cancelAnimationFrame(impactFrameRef.current);
      impactFrameRef.current = null;
    }
    setShowHighRarityImpact(false);

    // Using a short setTimeout to allow the browser to process the removal of the class
    // and correctly restart the CSS keyframe animation in the next event loop tick.
    impactTimerRef.current = setTimeout(() => {
      console.log("[PackRipOverlay3D] Setting showHighRarityImpact = true");
      setShowHighRarityImpact(true);
      const duration = isGodPack ? 900 : 520;
      impactTimerRef.current = setTimeout(() => {
        console.log(
          "[PackRipOverlay3D] Resetting showHighRarityImpact = false",
        );
        setShowHighRarityImpact(false);
        impactTimerRef.current = null;
      }, duration);
    }, 25);
  }, [isGodPack]);

  const handleRevealComplete = useCallback(() => {
    setPhase("done");
  }, []);

  // Play exciting sound effects when GOD PACK title slams down
  useEffect(() => {
    if (phase === "done" && isGodPack) {
      // Play sword slash sound effect matching the diagonal blade slash (approx 200ms)
      const t_slash = setTimeout(() => {
        playSFX(AUDIO_URLS.SHONEN_SLASH, 0.24);
      }, 200);

      // Play a delayed heavy impact to match the visual text slam (approx 250ms)
      const t1 = setTimeout(() => {
        playSFX(AUDIO_URLS.IMPACT_HEAVY, 0.25);
        handleHighRarityImpact();
      }, 250);

      // Play aura power-up whoosh immediately on transition
      playSFX(AUDIO_URLS.HEAVENLY, 0.24);

      return () => {
        clearTimeout(t_slash);
        clearTimeout(t1);
      };
    }
  }, [phase, isGodPack, playSFX, handleHighRarityImpact]);

  const handleClose = () => {
    if (phase === "done") {
      onClose();
    }
  };

  const handleCloseButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className={`pack-rip-3d-overlay phase-${phase} ${isGodPack ? "is-god-pack" : "is-standard-pack"} ${isClosing ? "is-exiting" : ""} ${!isOpen ? "is-hidden" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="เปิดซองการ์ด"
      aria-describedby="pack-rip-status"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "#050308",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: phase === "done" ? "pointer" : "default",
      }}
    >
      <div
        id="pack-rip-status"
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {phase === "done" ? "เปิดซองสำเร็จแล้ว" : "กำลังเปิดซองการ์ด"}
      </div>

      {/* Screen Shake Wrapper: shakes everything inside the overlay on high-rarity card reveal */}
      <div
        className={
          showHighRarityImpact
            ? isGodPack
              ? "god-rarity-impact-global"
              : "high-rarity-impact-global"
            : ""
        }
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          className={`modern-stage-background ${isGodPack ? "god-stage" : ""}`}
          aria-hidden="true"
        >
          {/* Cinematic Volumetric Nebula Glows */}
          <div className="aurora-glow aurora-1" />
          <div className="aurora-glow aurora-2" />

          {/* Film Grain overlay */}
          <div className="film-grain" />

          {/* Silhouette stream: cards dash across left↔right during the burst/stream
             phase. The last cards.length land in a row to foreshadow the reveal. */}
          {showStream && (
            <div
              className={`card-stream ${phase === "cards" ? "settling" : ""}`}
            >
              {Array.from({ length: STREAM_CARD_COUNT }, (_, index) => {
                const isFinal = index >= STREAM_CARD_COUNT - cards.length;
                const isLeftToRight = index % 2 === 1;

                let cardClass = "";
                if (isFinal) {
                  cardClass = isLeftToRight
                    ? "stream-card-final-left"
                    : "stream-card-final-right";
                } else {
                  cardClass = isLeftToRight
                    ? "stream-card-left-to-right"
                    : "stream-card-right-to-left";
                }

                return (
                  <div
                    key={index}
                    className={`stream-card ${cardClass}`}
                    style={
                      {
                        "--stream-y": "50%",
                        "--stream-delay": `${index * STREAM_CARD_STAGGER}ms`,
                        "--stream-tilt": `${(index % 3) * 1.5 - 1.5}deg`,
                        "--stream-mid-tilt": `${((index % 3) * 1.5 - 1.5) * -0.25}deg`,
                        "--stream-end-tilt": `${((index % 3) * 1.5 - 1.5) * -1}deg`,
                        "--stream-final-x": isFinal
                          ? cards.length === 1
                            ? "0px"
                            : FINAL_STREAM_OFFSETS[
                                index - (STREAM_CARD_COUNT - cards.length)
                              ]
                          : "0px",
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </div>
          )}

          {/* Cinematic Vignette */}
          <div className="modern-vignette" />
        </div>

        {/* ── 3D SCENE (burst + cards phases) ── */}
        <div
          className=""
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            visibility: phase === "idle" ? "hidden" : "visible",
            pointerEvents: phase === "idle" ? "none" : "auto",
          }}
        >
          <Canvas
            camera={{ position: [0, 0.08, 6.7], fov: 50 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ background: "transparent" }}
            dpr={[1, 1.5]}
          >
            {phase !== "idle" && (
              <>
                <fog attach="fog" args={["#07060a", 12, 40]} />
                <CinematicCamera
                  mode={cinematicMode}
                  prefersReducedMotion={prefersReducedMotion}
                  tearProgressRef={tearProgressRef}
                />
                <SceneLighting />

                {/* 3D Tearing pack */}
                {phase === "tear" && (
                  <TearingPackThree
                    season={season}
                    mode={mode}
                    prefersReducedMotion={prefersReducedMotion}
                    onTearThreshold={handleTearThreshold}
                    onTearComplete={handleTearComplete}
                    sharedProgressRef={tearProgressRef}
                    autoStart={autoOpen}
                    packSize={cards.length}
                  />
                )}

                {/* 3D card row */}
                {showCards && cards.length > 0 && (
                  <CardRevealThree
                    cards={cards}
                    season={season}
                    isInteractive={phase === "cards" || phase === "done"}
                    onHighRarityImpact={handleHighRarityImpact}
                    onComplete={handleRevealComplete}
                  />
                )}
              </>
            )}
          </Canvas>
        </div>

        {/* Cinematic overlay: letterbox bars + suspense scan lines + center
          focus glow. Shown from the stream phase onward so the silhouette
          dash is framed as a build-up to the reveal, not just decoration
          that tunnels through and vanishes. */}
        {(phase === "stream" || phase === "cards" || phase === "done") && (
          <div
            className={`cinematic-overlay ${cinematicMode}`}
            aria-hidden="true"
          >
            <div className="cinematic-vignette" />
            <div className="suspense-lines" />
            <div className="center-focus" />
            <div className="cinematic-bar cinematic-bar-top" />
            <div className="cinematic-bar cinematic-bar-bottom" />
            <div className="brake-flash" />
          </div>
        )}

        {showHighRarityImpact && (
          <div
            className={isGodPack ? "god-rarity-flash" : "high-rarity-flash"}
            aria-hidden="true"
          />
        )}

        {isGodPack && phase === "done" && (
          <div className="god-pack-shonen">
            {/* Manga Speed Lines radiating from center */}
            <div className="manga-speed-lines" />

            {/* Heavy comic brush impact borders */}
            <div className="shonen-impact-vignette" />

            {/* Jagged anime lightning sparks */}
            <div className="shonen-lightning-container">
              <div className="shonen-lightning bolt-1" />
              <div className="shonen-lightning bolt-2" />
              <div className="shonen-lightning bolt-3" />
            </div>

            {/* Hand-drawn action shockwaves */}
            <div className="shonen-energy-burst">
              <div className="energy-ring ring-1" />
              <div className="energy-ring ring-2" />
              <div className="energy-ring ring-3" />
            </div>

            {/* Diagonal Screen slash slice */}
            <div className="shonen-slash" />

            {/* Title Container */}
            <div className="shonen-title-wrapper">
              <div className="shonen-title" data-text="GOD PACK">
                GOD PACK
              </div>
              <div className="shonen-subtitle">
                🔥 LIMIT BREAK: ALL SSR+ UNLOCKED 🔥
              </div>
            </div>
          </div>
        )}

        {phase === "cards" && (
          <div className="reveal-gesture-hint" aria-hidden="true">
            <span className="gesture-line" />
            แตะหรือปัดการ์ดเพื่อเปิด
          </div>
        )}

        {phase === "tear" && (
          <div className="tear-gesture-hint" aria-hidden="true">
            <span className="tear-direction">↔</span>
            {prefersReducedMotion ? "แตะซองเพื่อเปิด" : "ลากผ่านขอบซองเพื่อฉีก"}
          </div>
        )}

        {/* Tap to close hint */}
        {phase === "done" && (
          <button
            className="close-hint"
            type="button"
            onClick={handleCloseButton}
          >
            แตะเพื่อปิด
          </button>
        )}

        {/* Mute button */}
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 30,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <MuteButton />
        </div>
      </div>

      <style jsx>{`
        @keyframes overlayFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .pack-rip-3d-overlay {
          --reveal-primary: #ffd34e;
          --reveal-secondary: #ff356f;
          --reveal-primary-rgb: 255, 211, 78;
          --reveal-secondary-rgb: 255, 53, 111;
          isolation: isolate;
          overflow: hidden;
          animation: overlayFadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          transition:
            opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          opacity: 1;
          transform: scale(1);
        }

        .reveal-gesture-hint,
        .tear-gesture-hint {
          position: absolute;
          bottom: max(1.5rem, env(safe-area-inset-bottom));
          left: 50%;
          z-index: 12;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: rgba(255, 255, 255, 0.72);
          font:
            400 0.82rem var(--font-kanit),
            sans-serif;
          transform: translateX(-50%);
          animation: gesture-hint-enter 240ms cubic-bezier(0.25, 1, 0.5, 1) both;
          pointer-events: none;
          white-space: nowrap;
        }

        .tear-gesture-hint {
          bottom: max(2rem, env(safe-area-inset-bottom));
        }

        .tear-direction {
          min-width: 2.25rem;
          color: rgba(255, 255, 255, 0.92);
          font:
            500 1.2rem var(--font-chakra),
            sans-serif;
          letter-spacing: 0.12em;
          text-align: center;
        }

        .gesture-line {
          width: 1.75rem;
          height: 1px;
          background: rgba(255, 255, 255, 0.48);
          transform-origin: right center;
          animation: gesture-line-draw 900ms cubic-bezier(0.25, 1, 0.5, 1) 180ms
            both;
        }

        @keyframes gesture-hint-enter {
          from {
            opacity: 0;
            transform: translate(-50%, 6px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes gesture-line-draw {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        .pack-rip-3d-overlay.is-exiting {
          opacity: 0;
          transform: scale(0.94);
          pointer-events: none;
        }

        .pack-rip-3d-overlay.is-hidden {
          opacity: 0;
          transform: scale(0.94);
          pointer-events: none;
          visibility: hidden;
          transition:
            visibility 0s linear 0.4s,
            opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .pack-rip-3d-overlay.is-god-pack {
          --reveal-primary: #ffd54a;
          --reveal-secondary: #ff4d00;
          --reveal-primary-rgb: 255, 213, 74;
          --reveal-secondary-rgb: 255, 77, 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .close-hint {
          position: absolute;
          bottom: max(8%, env(safe-area-inset-bottom));
          left: 50%;
          z-index: 30;
          min-width: 144px;
          min-height: 48px;
          padding: 0.75rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.82);
          background: rgba(8, 5, 14, 0.68);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px) saturate(140%);
          transform: translateX(-50%);
          font-family: Kanit, sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          white-space: nowrap;
          cursor: pointer;
          touch-action: manipulation;
          animation: gesture-hint-enter 220ms cubic-bezier(0.25, 1, 0.5, 1) both;
          transition:
            color 180ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
            background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .close-hint:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.52);
          background: rgba(20, 12, 30, 0.84);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
        }

        .close-hint:focus-visible {
          outline: 3px solid #ffd54a;
          outline-offset: 4px;
        }

        .modern-stage-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          background: #030105;
          transition: background 1.5s ease;
        }

        .modern-stage-background.god-stage {
          background: #060100;
        }

        .aurora-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(190px);
          opacity: 0.13;
          mix-blend-mode: screen;
          will-change: transform, opacity;
          pointer-events: none;
        }

        .aurora-1 {
          top: -10%;
          left: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, #5b21b6, transparent 70%);
          transform: translate3d(3%, 4%, 0);
        }

        .aurora-2 {
          bottom: -15%;
          right: -10%;
          width: 70vw;
          height: 70vw;
          background: radial-gradient(circle, #0891b2, transparent 70%);
          transform: translate3d(-3%, -2%, 0);
        }

        .aurora-3 {
          top: 30%;
          right: 15%;
          width: 45vw;
          height: 45vw;
          background: radial-gradient(circle, #db2777, transparent 70%);
          animation: aurora-drift-3 22s ease-in-out infinite alternate;
        }

        .aurora-4 {
          bottom: 10%;
          left: 10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, #4f46e5, transparent 70%);
          animation: aurora-drift-4 32s ease-in-out infinite alternate;
        }

        .god-stage .aurora-1 {
          background: radial-gradient(circle, #b91c1c, transparent 70%);
          opacity: 0.22;
        }
        .god-stage .aurora-2 {
          background: radial-gradient(circle, #ea580c, transparent 70%);
          opacity: 0.2;
        }
        .god-stage .aurora-3 {
          background: radial-gradient(circle, #eab308, transparent 70%);
          opacity: 0.24;
        }
        .god-stage .aurora-4 {
          background: radial-gradient(circle, #7f1d1d, transparent 70%);
          opacity: 0.18;
        }

        @keyframes aurora-drift-1 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(8%, 12%) scale(1.1);
          }
          100% {
            transform: translate(-5%, 5%) scale(0.95);
          }
        }
        @keyframes aurora-drift-2 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-10%, -8%) scale(0.9);
          }
          100% {
            transform: translate(6%, 10%) scale(1.15);
          }
        }
        @keyframes aurora-drift-3 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(12%, -10%) scale(1.1);
          }
          100% {
            transform: translate(-8%, 8%) scale(0.9);
          }
        }
        @keyframes aurora-drift-4 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-6%, 15%) scale(1.05);
          }
          100% {
            transform: translate(10%, -5%) scale(0.95);
          }
        }

        .film-grain {
          position: absolute;
          inset: 0;
          opacity: 0.012;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          z-index: 2;
        }

        .ambient-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .ambient-particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
          opacity: 0;
          animation: float-particle linear infinite;
        }

        .god-stage .ambient-particle {
          background: rgba(255, 180, 0, 0.28);
          box-shadow: 0 0 8px rgba(255, 140, 0, 0.5);
        }

        @keyframes float-particle {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translate3d(
                var(--particle-drift-x),
                var(--particle-drift-y),
                0
              )
              scale(1.1);
            opacity: 0;
          }
        }

        .modern-vignette {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          background: radial-gradient(
            circle at center,
            transparent 25%,
            rgba(3, 1, 6, 0.3) 60%,
            rgba(3, 1, 6, 0.85) 100%
          );
        }

        .god-stage .modern-vignette {
          background: radial-gradient(
            circle at center,
            transparent 25%,
            rgba(8, 2, 0, 0.35) 60%,
            rgba(8, 2, 0, 0.9) 100%
          );
        }

        /* Silhouette card stream — restored original animation. Cards fly across
           the stage left↔right with alternating directions; the last five
           settle into a fan row behind the real cards. */
        .card-stream {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
        }

        .card-stream.settling {
          animation: stream-crossfade 0.32s ease-out both;
        }

        .stream-card {
          position: absolute;
          top: var(--stream-y);
          left: 0;
          width: min(230px, 26vw);
          aspect-ratio: 230 / 330;
          border: 2px solid rgba(214, 227, 255, 0.8);
          border-radius: clamp(5px, 0.7vw, 9px);
          opacity: 0;
          background:
            linear-gradient(
              135deg,
              rgba(190, 255, 42, 0.12),
              rgba(198, 44, 255, 0.18)
            ),
            url("https://img.lucky-pod.fun/back-card.png") center / cover
              no-repeat;
          box-shadow:
            0 0 8px rgba(193, 43, 255, 0.24),
            0 0 14px rgba(184, 255, 38, 0.08);
          transform: translate3d(-180px, -50%, 0) rotate(0deg);
        }

        .god-stage .stream-card {
          border-color: rgba(255, 213, 74, 0.85);
          background:
            linear-gradient(
              135deg,
              rgba(255, 140, 0, 0.16),
              rgba(255, 60, 0, 0.22)
            ),
            url("https://img.lucky-pod.fun/back-card.png") center / cover
              no-repeat;
          box-shadow:
            0 0 10px rgba(255, 120, 0, 0.32),
            0 0 18px rgba(255, 60, 0, 0.16);
        }

        .stream-card-left-to-right {
          animation: card-stream-flight-lr var(--stream-travel-time, 1400ms)
            cubic-bezier(0.25, 1, 0.5, 1) var(--stream-delay) both;
        }

        .stream-card-right-to-left {
          animation: card-stream-flight-rl var(--stream-travel-time, 1400ms)
            cubic-bezier(0.25, 1, 0.5, 1) var(--stream-delay) both;
        }

        .stream-card-final-left {
          animation: final-card-flight-left var(--stream-travel-time, 1400ms)
            cubic-bezier(0.16, 1, 0.3, 1) var(--stream-delay) both;
        }

        .stream-card-final-right {
          animation: final-card-flight-right var(--stream-travel-time, 1400ms)
            cubic-bezier(0.16, 1, 0.3, 1) var(--stream-delay) both;
        }

        @keyframes card-stream-flight-lr {
          0% {
            opacity: 0;
            transform: translate3d(-180px, -50%, 0) rotate(var(--stream-tilt));
          }
          10%,
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(100vw + 150px), -50%, 0)
              rotate(var(--stream-end-tilt));
          }
        }

        @keyframes card-stream-flight-rl {
          0% {
            opacity: 0;
            transform: translate3d(calc(100vw + 150px), -50%, 0)
              rotate(var(--stream-tilt));
          }
          10%,
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(-180px, -50%, 0)
              rotate(var(--stream-end-tilt));
          }
        }

        @keyframes final-card-flight-right {
          0% {
            opacity: 0;
            transform: translate3d(calc(100vw + 150px), -50%, 0)
              rotate(var(--stream-tilt));
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate3d(
                calc(50vw - 50% + var(--stream-final-x)),
                -50%,
                0
              )
              rotate(0deg);
          }
        }

        @keyframes final-card-flight-left {
          0% {
            opacity: 0;
            transform: translate3d(-180px, -50%, 0) rotate(var(--stream-tilt));
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate3d(
                calc(50vw - 50% + var(--stream-final-x)),
                -50%,
                0
              )
              rotate(0deg);
          }
        }

        @keyframes stream-crossfade {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .cinematic-overlay {
          position: absolute;
          inset: 0;
          z-index: 12;
          overflow: hidden;
          pointer-events: none;
        }

        .high-rarity-impact {
          animation: rarity-shake 0.52s cubic-bezier(0.36, 0.07, 0.19, 0.97)
            both;
          will-change: transform;
        }

        .high-rarity-flash {
          position: absolute;
          inset: 0;
          z-index: 18;
          pointer-events: none;
          background: rgba(255, 215, 0, 0.16);
          box-shadow: inset 0 0 120px rgba(255, 196, 60, 0.42);
          animation: rarity-flash-out 0.52s ease-out both;
        }

        @keyframes rarity-shake {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          10% {
            transform: translate3d(-14px, 11px, 0) scale(1.05) rotate(-1.2deg);
          }
          20% {
            transform: translate3d(13px, -11px, 0) scale(0.96) rotate(1.2deg);
          }
          30% {
            transform: translate3d(-18px, -5px, 0) scale(1.07) rotate(-1.8deg);
          }
          40% {
            transform: translate3d(18px, 5px, 0) scale(0.95) rotate(1.8deg);
          }
          50% {
            transform: translate3d(-11px, 11px, 0) scale(1.04) rotate(-1.2deg);
          }
          60% {
            transform: translate3d(11px, -7px, 0) scale(0.98) rotate(1deg);
          }
          70% {
            transform: translate3d(-6px, 6px, 0) scale(1.03) rotate(-0.6deg);
          }
          80% {
            transform: translate3d(6px, -4px, 0) scale(1.008) rotate(0.6deg);
          }
          90% {
            transform: translate3d(-2px, 2px, 0) scale(1.003) rotate(-0.3deg);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0);
          }
        }

        @keyframes rarity-flash-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .cinematic-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            transparent 38%,
            rgba(0, 0, 0, 0.72) 100%
          );
        }

        .suspense-lines {
          position: absolute;
          inset: -15%;
          opacity: 0;
          background: repeating-linear-gradient(
            118deg,
            transparent 0 42px,
            rgba(196, 44, 255, 0.3) 43px 45px,
            transparent 46px 88px,
            rgba(186, 255, 39, 0.22) 89px 91px
          );
          mask-image: radial-gradient(
            circle,
            transparent 0 28%,
            #000 58%,
            transparent 82%
          );
          animation: suspense-flow 0.75s linear infinite;
          transition: opacity 0.35s ease;
        }

        .cinematic-overlay.suspense .suspense-lines {
          opacity: 0.75;
        }

        .center-focus {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: radial-gradient(
            circle at center,
            rgba(190, 255, 45, 0.26),
            rgba(196, 44, 255, 0.2) 22%,
            transparent 44%
          );
          transition: opacity 0.4s ease;
        }

        .cinematic-overlay.suspense .center-focus {
          opacity: 1;
          animation: focus-breathe 1.2s ease-in-out infinite;
        }

        .cinematic-bar {
          position: absolute;
          left: 0;
          width: 100%;
          height: clamp(36px, 9.5vh, 92px);
          background: #000;
          transform: scaleY(0);
          transition: transform 0.45s ease;
        }

        .cinematic-bar-top {
          top: 0;
          transform-origin: top;
        }
        .cinematic-bar-bottom {
          bottom: 0;
          transform-origin: bottom;
        }
        .cinematic-overlay.suspense .cinematic-bar {
          animation: cinematic-squeeze 5.2s cubic-bezier(0.25, 1, 0.5, 1) both;
        }

        .brake-flash {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: radial-gradient(
            circle at center,
            rgba(225, 255, 180, 0.38),
            rgba(204, 49, 255, 0.18) 28%,
            transparent 58%
          );
        }

        .cinematic-overlay.reveal .brake-flash {
          animation: brake-impact 0.65s ease-out both;
        }

        @keyframes cinematic-squeeze {
          0% {
            transform: scaleY(0);
          }
          15% {
            transform: scaleY(1.4);
          }
          30% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.15);
          }
          70% {
            transform: scaleY(1);
          }
          85% {
            transform: scaleY(1.08);
          }
          100% {
            transform: scaleY(1);
          }
        }

        @keyframes suspense-flow {
          to {
            transform: translate3d(180px, -90px, 0);
          }
        }

        @keyframes focus-breathe {
          50% {
            opacity: 0.55;
            transform: scale(1.08);
          }
        }

        @keyframes brake-impact {
          0% {
            opacity: 0.75;
            transform: scale(0.82);
          }
          100% {
            opacity: 0;
            transform: scale(1.25);
          }
        }

        @keyframes pulseText {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        .god-pack-shonen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }

        .manga-speed-lines {
          position: absolute;
          inset: -100px;
          pointer-events: none;
          background: repeating-conic-gradient(
            from 0deg,
            rgba(255, 215, 0, 0.09) 0deg 2deg,
            transparent 2deg 6deg,
            rgba(255, 60, 0, 0.12) 6deg 8deg,
            transparent 8deg 14deg
          );
          mask-image: radial-gradient(circle, transparent 25%, black 75%);
          animation: speed-lines-spin 0.12s linear infinite;
        }

        @keyframes speed-lines-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .shonen-impact-vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          box-shadow:
            inset 0 0 100px rgba(0, 0, 0, 0.95),
            inset 0 0 40px rgba(255, 60, 0, 0.35);
          border: clamp(4px, 1.2vh, 10px) solid #000;
          animation: vignette-pulse 0.18s ease infinite alternate;
        }

        @keyframes vignette-pulse {
          0% {
            border-color: #000;
            box-shadow:
              inset 0 0 100px rgba(0, 0, 0, 0.95),
              inset 0 0 40px rgba(255, 60, 0, 0.3);
          }
          100% {
            border-color: #ff3c00;
            box-shadow:
              inset 0 0 120px rgba(0, 0, 0, 0.98),
              inset 0 0 60px rgba(255, 140, 0, 0.5);
          }
        }

        .shonen-lightning-container {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }

        .shonen-lightning {
          position: absolute;
          width: 4px;
          height: 140px;
          background: #fff;
          box-shadow:
            0 0 20px #ffd700,
            0 0 6px #fff;
          opacity: 0;
          will-change: transform, opacity;
        }

        .bolt-1 {
          top: 15%;
          left: 20%;
          transform: rotate(15deg) skewX(20deg);
          animation: lightning-strike 0.28s steps(2) 0.3s infinite;
        }

        .bolt-2 {
          bottom: 15%;
          right: 15%;
          transform: rotate(-25deg) skewX(-15deg);
          animation: lightning-strike 0.32s steps(2) 0.1s infinite;
        }

        .bolt-3 {
          top: 35%;
          right: 30%;
          transform: rotate(45deg) skewY(10deg);
          animation: lightning-strike 0.24s steps(2) 0.4s infinite;
        }

        @keyframes lightning-strike {
          0%,
          100% {
            opacity: 0;
            transform: scaleY(0.8);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.2);
          }
        }

        .shonen-energy-burst {
          position: absolute;
          top: 35%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .energy-ring {
          position: absolute;
          background: transparent;
          border: 4px solid #fff;
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
          opacity: 0;
          will-change: transform, opacity;
        }

        .ring-1 {
          border-color: #fff;
          filter: drop-shadow(0 0 12px #ff3c00);
          width: 80px;
          height: 80px;
          animation: shonen-ring-expand-1 1s cubic-bezier(0.1, 0.8, 0.3, 1)
            0.25s both;
        }

        .ring-2 {
          border-color: #ffd700;
          filter: drop-shadow(0 0 16px #ff8c00);
          width: 140px;
          height: 140px;
          animation: shonen-ring-expand-2 1.1s cubic-bezier(0.1, 0.8, 0.3, 1)
            0.3s both;
        }

        .ring-3 {
          border-color: #ff3c00;
          filter: drop-shadow(0 0 20px #ff3c00);
          width: 200px;
          height: 200px;
          animation: shonen-ring-expand-3 1.2s cubic-bezier(0.1, 0.8, 0.3, 1)
            0.35s both;
        }

        @keyframes shonen-ring-expand-1 {
          0% {
            transform: scale(0.1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(4) rotate(120deg);
            opacity: 0;
          }
        }

        @keyframes shonen-ring-expand-2 {
          0% {
            transform: scale(0.1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(3.2) rotate(-90deg);
            opacity: 0;
          }
        }

        @keyframes shonen-ring-expand-3 {
          0% {
            transform: scale(0.1) rotate(0deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.6) rotate(180deg);
            opacity: 0;
          }
        }

        .shonen-slash {
          position: absolute;
          top: 50%;
          left: -20%;
          width: 140%;
          height: 16px;
          background: #fff;
          box-shadow:
            0 0 30px #ff3c00,
            0 0 60px #fff;
          transform: translateY(-50%) rotate(-22deg) scaleX(0);
          transform-origin: left;
          z-index: 3;
          pointer-events: none;
          animation: slash-slice 0.45s cubic-bezier(0.15, 0.85, 0.3, 1) 0.2s
            both;
        }

        @keyframes slash-slice {
          0% {
            transform: translateY(-50%) rotate(-22deg) scaleX(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-50%) rotate(-22deg) scaleX(1);
            opacity: 1;
            filter: brightness(3.5);
          }
          100% {
            transform: translateY(-50%) rotate(-22deg) scaleX(1);
            opacity: 0;
            filter: brightness(1);
          }
        }

        .shonen-title-wrapper {
          position: absolute;
          top: clamp(60px, 9vh, 90px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 3;
          pointer-events: none;
        }

        .shonen-title {
          position: relative;
          font-family: var(--font-outfit, "Outfit"), "Impact", sans-serif;
          font-size: clamp(3.2rem, 7.8vw, 6.8rem);
          font-weight: 950;
          letter-spacing: 0.1em;
          line-height: 1;
          text-transform: uppercase;
          text-align: center;
          background: linear-gradient(
            180deg,
            #ffffff 10%,
            #ffd700 45%,
            #ff3c00 80%,
            #000000 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(4px 4px 0px #000) drop-shadow(-4px -4px 0px #000)
            drop-shadow(4px -4px 0px #000) drop-shadow(-4px 4px 0px #000)
            drop-shadow(0px 10px 20px rgba(255, 60, 0, 0.75));
          animation: shonen-title-slam 1.4s
            cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        .shonen-subtitle {
          font-family: var(--font-kanit, "Kanit"), sans-serif;
          font-size: clamp(0.85rem, 1.8vw, 1.2rem);
          font-weight: 900;
          letter-spacing: 0.2em;
          color: #fff;
          text-transform: uppercase;
          filter: drop-shadow(2px 2px 0px #000) drop-shadow(-2px -2px 0px #000)
            drop-shadow(2px -2px 0px #000) drop-shadow(-2px 2px 0px #000);
          opacity: 0;
          animation: shonen-sub-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.8s
            both;
        }

        @keyframes shonen-sub-appear {
          0% {
            opacity: 0;
            transform: translateY(15px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .god-rarity-impact {
          animation: shonen-earthquake 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97)
            both;
          will-change: transform;
        }

        .god-rarity-flash {
          position: absolute;
          inset: 0;
          z-index: 18;
          pointer-events: none;
          background: #ffffff;
          box-shadow:
            inset 0 0 120px #ff3c00,
            0 0 100px #ffd700;
          animation: shonen-flash-out 0.85s cubic-bezier(0.1, 0.8, 0.3, 1) both;
        }

        @keyframes shonen-flash-out {
          0% {
            opacity: 1;
            filter: brightness(3.5);
          }
          20% {
            opacity: 1;
            filter: brightness(2);
          }
          100% {
            opacity: 0;
            filter: brightness(1);
          }
        }

        @keyframes shonen-title-slam {
          0% {
            opacity: 0;
            transform: scale(10) rotate(-15deg);
            filter: brightness(8);
          }
          18% {
            opacity: 1;
            transform: scale(0.8) rotate(5deg);
            filter: brightness(2.2);
          }
          26% {
            transform: scale(1.3) rotate(-3deg);
          }
          34% {
            transform: scale(0.9) rotate(2deg);
          }
          42% {
            transform: scale(1.1) rotate(-1deg);
          }
          50% {
            transform: scale(0.97) rotate(0.5deg);
          }
          60% {
            transform: scale(1) rotate(0deg);
            filter: brightness(1);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: brightness(1);
          }
        }

        @keyframes shonen-earthquake {
          0% {
            transform: translate3d(0, 0, 0) scale(1.05) rotate(0deg);
          }
          10% {
            transform: translate3d(-24px, 18px, 0) scale(1.15) rotate(-3.5deg);
          }
          20% {
            transform: translate3d(20px, -18px, 0) scale(0.92) rotate(3.5deg);
          }
          30% {
            transform: translate3d(-30px, -12px, 0) scale(1.18) rotate(-5deg);
          }
          40% {
            transform: translate3d(30px, 12px, 0) scale(0.93) rotate(5deg);
          }
          50% {
            transform: translate3d(-18px, 24px, 0) scale(1.12) rotate(-3deg);
          }
          60% {
            transform: translate3d(18px, -18px, 0) scale(0.96) rotate(3deg);
          }
          70% {
            transform: translate3d(-12px, 12px, 0) scale(1.08) rotate(-1.5deg);
          }
          80% {
            transform: translate3d(12px, -8px, 0) scale(1.03) rotate(1.5deg);
          }
          90% {
            transform: translate3d(-4px, 4px, 0) scale(1.01) rotate(-0.5deg);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-glow,
          .ambient-particle,
          .close-hint,
          .shonen-title,
          .shonen-subtitle {
            animation: none !important;
            transition: none !important;
          }

          .high-rarity-flash,
          .god-rarity-flash,
          .manga-speed-lines,
          .shonen-impact-vignette,
          .shonen-lightning-container,
          .shonen-energy-burst,
          .shonen-slash {
            display: none;
          }

          .shonen-title,
          .shonen-subtitle {
            opacity: 1;
            transform: none;
          }

          .close-hint {
            opacity: 0.82;
          }
        }
      `}</style>
    </div>
  );
};
