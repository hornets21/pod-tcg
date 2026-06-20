"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { SceneLighting } from "../three/SceneLighting";
import { CardRevealThree } from "../three/CardRevealThree";
import { GodPackRing, StandardPackRing } from "../three/ParticleSystem";
import { TearingPackThree } from "../three/TearingPackThree";
import { MuteButton } from "./MuteButton";
import { Card as CardType } from "../../data/types";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";
import * as THREE from "three";

interface PackRipOverlay3DProps {
  isOpen: boolean;
  season: string;
  cards: CardType[];
  onClose: () => void;
  onRipComplete: () => void;
  mode?: "single" | "box";
}

type Phase = "idle" | "tear" | "burst" | "stream" | "cards" | "done";
type CinematicMode = "idle" | "suspense" | "reveal";

const STREAM_CARD_COUNT = 10;
const STREAM_CARD_STAGGER = 190;
const STREAM_CARD_TRAVEL_TIME = 1900;
const STREAM_SETTLE_HOLD = 180;
const STREAM_DURATION =
  (STREAM_CARD_COUNT - 1) * STREAM_CARD_STAGGER + STREAM_CARD_TRAVEL_TIME;
const FINAL_STREAM_OFFSETS = [
  "max(-496px, -40vw)",
  "max(-248px, -20vw)",
  "0px",
  "min(20vw, 248px)",
  "min(40vw, 496px)",
];

function CinematicCamera({ mode }: { mode: CinematicMode }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const targetX = 0;
    let targetY = 0.08;
    let targetZ = 6.7;

    if (mode === "suspense") {
      targetY = 0.48 + Math.cos(t * 0.8) * 0.025;
      targetZ = 5.75 + Math.sin(t * 1.2) * 0.05;
    } else if (mode === "reveal") {
      targetY = 0.5;
      targetZ = 6;
    }

    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      targetX,
      0.045,
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      targetY,
      0.045,
    );
    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z,
      targetZ,
      0.045,
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export const PackRipOverlay3D: React.FC<PackRipOverlay3DProps> = ({
  isOpen,
  season,
  cards,
  onClose,
  onRipComplete,
  mode = "single",
}) => {
  const [phase, setPhase] = useState<Phase>(isOpen ? "tear" : "idle");
  const [burst, setBurst] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [cinematicMode, setCinematicMode] = useState<CinematicMode>("idle");
  const [showHighRarityImpact, setShowHighRarityImpact] = useState(false);
  const { playSFX, startBGM, stopBGM } = useAudio();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const impactTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (impactTimerRef.current) {
      clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }
  }, []);

  const isGodPack =
    cards.length === 5 &&
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
        setBurst(false);
        setCinematicMode("idle");
        setShowHighRarityImpact(false);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, clearTimers, stopBGM]);

  // Start opening flow immediately when opened with cards
  useEffect(() => {
    if (!isOpen || cards.length === 0) return;

    startBGM(AUDIO_URLS.BGM_GOD, 0.02);

    const t1 = setTimeout(() => {
      onRipComplete();
      setBurst(true);
      setPhase("burst");
    }, 1000);

    const t2 = setTimeout(() => {
      setBurst(false);
      setShowStream(true);
      setCinematicMode("suspense");
      setPhase("stream");
    }, 1000 + 700);

    const t3 = setTimeout(
      () => {
        setShowCards(true);
        setPhase("cards");
      },
      1000 + 700 + STREAM_DURATION + STREAM_SETTLE_HOLD,
    );

    const t4 = setTimeout(
      () => {
        setShowStream(false);
      },
      1000 + 700 + STREAM_DURATION + STREAM_SETTLE_HOLD + 320,
    );

    const t5 = setTimeout(
      () => {
        setCinematicMode("reveal");
      },
      1000 + 700 + STREAM_DURATION + STREAM_SETTLE_HOLD + 900,
    );

    const t6 = setTimeout(
      () => {
        setPhase("done");
      },
      1000 + 700 + STREAM_DURATION + STREAM_SETTLE_HOLD + 5000,
    );

    timersRef.current = [t1, t2, t3, t4, t5, t6];

    return () => {
      clearTimers();
      stopBGM();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cards.length]);

  const handleHighRarityImpact = useCallback(() => {
    if (impactTimerRef.current) clearTimeout(impactTimerRef.current);
    setShowHighRarityImpact(false);

    requestAnimationFrame(() => {
      setShowHighRarityImpact(true);
      const duration = isGodPack ? 900 : 520;
      impactTimerRef.current = setTimeout(() => {
        setShowHighRarityImpact(false);
        impactTimerRef.current = null;
      }, duration);
    });
  }, [isGodPack]);

  // Play exciting sound effects when GOD PACK title slams down
  useEffect(() => {
    if (phase === "cards" && isGodPack) {
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
    if (phase === "cards" || phase === "done") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`pack-rip-3d-overlay phase-${phase}`}
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "#050308",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: phase === "cards" || phase === "done" ? "pointer" : "default",
      }}
    >
      <div className={`neon-stage-background ${isGodPack ? "god-stage" : ""}`} aria-hidden="true">
        <div className="neon-stage-grid" />
        <div className="neon-stage-halftone" />
        <div className="neon-stage-shape shape-left" />
        <div className="neon-stage-shape shape-right" />
        <div className="neon-stage-scan" />
      </div>

      {showStream && (
        <div
          className={`card-stream ${phase === "cards" ? "settling" : ""}`}
          aria-hidden="true"
        >
          {Array.from({ length: STREAM_CARD_COUNT }, (_, index) => {
            const isFinal = index >= STREAM_CARD_COUNT - 5;
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
                      ? FINAL_STREAM_OFFSETS[index - (STREAM_CARD_COUNT - 5)]
                      : "0px",
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}

      {/* ── 3D SCENE (burst + cards phases) ── */}
      {(phase === "tear" ||
        phase === "burst" ||
        phase === "cards" ||
        phase === "done") && (
        <div
          className={showHighRarityImpact ? (isGodPack ? "god-rarity-impact" : "high-rarity-impact") : ""}
          style={{ position: "absolute", inset: 0, zIndex: 2 }}
        >
          <Canvas
            camera={{ position: [0, 0.08, 6.7], fov: 50 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ background: "transparent" }}
            dpr={[1, 2]}
          >
            <fog attach="fog" args={["#07060a", 12, 40]} />
            <CinematicCamera mode={cinematicMode} />
            <SceneLighting />
            {/* God pack ring */}
            {isGodPack && <GodPackRing active={burst} />}
            {/* Standard pack ring/burst */}
            {!isGodPack && <StandardPackRing active={burst} />}

            {/* 3D Tearing pack */}
            {phase === "tear" && (
              <TearingPackThree season={season} mode={mode} />
            )}

            {/* 3D card row */}
            {showCards && cards.length > 0 && (
              <CardRevealThree
                cards={cards}
                season={season}
                onHighRarityImpact={handleHighRarityImpact}
              />
            )}
          </Canvas>
        </div>
      )}

      {showHighRarityImpact && (
        <div className={isGodPack ? "god-rarity-flash" : "high-rarity-flash"} aria-hidden="true" />
      )}

      {(phase === "cards" || phase === "done") && (
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

      {isGodPack && (phase === "cards" || phase === "done") && (
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
            <div className="shonen-title" data-text="GOD PACK">GOD PACK</div>
            <div className="shonen-subtitle">🔥 LIMIT BREAK: ALL SR+ UNLOCKED 🔥</div>
          </div>
        </div>
      )}

      {/* Tap to close hint */}
      {phase === "done" && (
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.9rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "Kanit, sans-serif",
            animation: "pulseText 1.5s ease-in-out infinite",
            zIndex: 20,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          แตะเพื่อปิด
        </div>
      )}

      {/* Mute button */}
      <div
        style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 30 }}
      >
        <MuteButton />
      </div>

      <style jsx>{`
        .neon-stage-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          background:
            radial-gradient(
              circle at center,
              rgba(255, 60, 0, 0.1),
              transparent 34%
            ),
            linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
        }

        .neon-stage-grid {
          position: absolute;
          right: -18%;
          bottom: -36%;
          left: -18%;
          height: 72%;
          opacity: 0.11;
          background-image:
            linear-gradient(rgba(255, 60, 0, 0.5) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 140, 0, 0.5) 1px,
              transparent 1px
            );
          background-size: 72px 44px;
          transform: perspective(430px) rotateX(59deg);
          transform-origin: 50% 100%;
          animation: neon-grid-run 6s linear infinite;
        }

        .neon-stage-halftone {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image:
            radial-gradient(
              circle,
              rgba(255, 60, 0, 0.7) 0 1.2px,
              transparent 1.8px
            ),
            radial-gradient(
              circle,
              rgba(255, 140, 0, 0.6) 0 1px,
              transparent 1.6px
            );
          background-position:
            0 0,
            12px 12px;
          background-size: 24px 24px;
          mask-image: linear-gradient(
            90deg,
            #000,
            transparent 36%,
            transparent 64%,
            #000
          );
          animation: neon-dots-drift 22s linear infinite;
        }

        .neon-stage-shape {
          position: absolute;
          opacity: 0.28;
          filter: drop-shadow(0 0 7px currentColor);
          animation: neon-shape-float 10s ease-in-out infinite alternate;
        }

        .shape-left {
          top: 12%;
          left: -6%;
          width: min(31vw, 430px);
          aspect-ratio: 1.5;
          color: #ff3c00;
          border: 2px solid currentColor;
          background: linear-gradient(
            135deg,
            rgba(255, 60, 0, 0.18),
            transparent 64%
          );
          clip-path: polygon(0 18%, 100% 0, 73% 100%, 17% 76%);
          transform: rotate(-11deg);
        }

        .shape-right {
          right: -7%;
          bottom: 7%;
          width: min(34vw, 470px);
          aspect-ratio: 1.6;
          color: #ff8c00;
          border: 2px solid currentColor;
          background: linear-gradient(
            145deg,
            rgba(255, 140, 0, 0.16),
            transparent 66%
          );
          clip-path: polygon(22% 0, 100% 28%, 76% 100%, 0 72%);
          transform: rotate(8deg);
          animation-delay: -5s;
          animation-duration: 13s;
        }

        .neon-stage-scan {
          position: absolute;
          inset: -25% 0;
          opacity: 0.06;
          background: linear-gradient(
            transparent 44%,
            rgba(189, 255, 40, 0.25) 49%,
            rgba(198, 43, 255, 0.24) 51%,
            transparent 56%
          );
          animation: neon-scan-pass 8s ease-in-out infinite;
        }

        .phase-stream .neon-stage-grid,
        .phase-stream .neon-stage-halftone,
        .phase-stream .neon-stage-shape,
        .phase-stream .neon-stage-scan {
          animation-play-state: paused;
        }

        .phase-stream .neon-stage-grid {
          opacity: 0.06;
        }
        .phase-stream .neon-stage-halftone {
          opacity: 0.045;
        }
        .phase-stream .neon-stage-shape {
          opacity: 0.18;
        }
        .phase-stream .neon-stage-scan {
          opacity: 0;
        }

        .card-stream {
          position: absolute;
          inset: 0;
          z-index: 8;
          overflow: hidden;
          pointer-events: none;
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
          will-change: transform, opacity;
        }

        .stream-card-left-to-right {
          animation: card-stream-flight-lr 1900ms cubic-bezier(0.25, 1, 0.5, 1)
            var(--stream-delay) both;
        }

        .stream-card-right-to-left {
          animation: card-stream-flight-rl 1900ms cubic-bezier(0.25, 1, 0.5, 1)
            var(--stream-delay) both;
        }

        .stream-card-final-left {
          animation: final-card-flight-left 1900ms cubic-bezier(0.16, 1, 0.3, 1)
            var(--stream-delay) both;
        }

        .stream-card-final-right {
          animation: final-card-flight-right 1900ms
            cubic-bezier(0.16, 1, 0.3, 1) var(--stream-delay) both;
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
          10%,
          90% {
            transform: translate3d(-1px, 0, 0);
          }
          20%,
          80% {
            transform: translate3d(2px, 0, 0);
          }
          30%,
          50%,
          70% {
            transform: translate3d(-4px, 0, 0);
          }
          40%,
          60% {
            transform: translate3d(4px, 0, 0);
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
            rgba(196, 44, 255, 0.14) 43px 45px,
            transparent 46px 88px,
            rgba(186, 255, 39, 0.1) 89px 91px
          );
          mask-image: radial-gradient(
            circle,
            transparent 0 28%,
            #000 58%,
            transparent 82%
          );
          animation: suspense-flow 1.6s linear infinite;
          transition: opacity 0.35s ease;
        }

        .cinematic-overlay.suspense .suspense-lines {
          opacity: 0.3;
        }

        .center-focus {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: radial-gradient(
            circle at center,
            rgba(190, 255, 45, 0.08),
            rgba(196, 44, 255, 0.08) 22%,
            transparent 44%
          );
          transition: opacity 0.4s ease;
        }

        .cinematic-overlay.suspense .center-focus {
          opacity: 1;
          animation: focus-breathe 1.5s ease-in-out infinite;
        }

        .cinematic-bar {
          position: absolute;
          left: 0;
          width: 100%;
          height: clamp(12px, 3.5vh, 34px);
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
          transform: scaleY(1);
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

        @keyframes suspense-flow {
          to {
            transform: translate3d(180px, -90px, 0);
          }
        }

        @keyframes neon-grid-run {
          to {
            background-position:
              0 88px,
              72px 0;
          }
        }

        @keyframes neon-dots-drift {
          to {
            background-position:
              96px 48px,
              108px 60px;
          }
        }

        @keyframes neon-shape-float {
          to {
            translate: 18px 12px;
            scale: 1.025;
            opacity: 0.4;
          }
        }

        @keyframes neon-scan-pass {
          0%,
          20% {
            transform: translateY(-45%);
          }
          75%,
          100% {
            transform: translateY(45%);
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
          z-index: 25;
          overflow: hidden;
        }

        .manga-speed-lines {
          position: absolute;
          inset: -100px;
          z-index: 23;
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
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .shonen-impact-vignette {
          position: absolute;
          inset: 0;
          z-index: 24;
          pointer-events: none;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.95), inset 0 0 40px rgba(255, 60, 0, 0.35);
          border: clamp(4px, 1.2vh, 10px) solid #000;
          animation: vignette-pulse 0.18s ease infinite alternate;
        }

        @keyframes vignette-pulse {
          0% { border-color: #000; box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.95), inset 0 0 40px rgba(255, 60, 0, 0.3); }
          100% { border-color: #ff3c00; box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.98), inset 0 0 60px rgba(255, 140, 0, 0.5); }
        }

        .shonen-lightning-container {
          position: absolute;
          inset: 0;
          z-index: 24;
          pointer-events: none;
        }

        .shonen-lightning {
          position: absolute;
          width: 4px;
          height: 140px;
          background: #fff;
          box-shadow: 0 0 20px #ffd700, 0 0 6px #fff;
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
          0%, 100% { opacity: 0; transform: scaleY(0.8); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }

        .shonen-energy-burst {
          position: absolute;
          top: 35%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          pointer-events: none;
          z-index: 24;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .energy-ring {
          position: absolute;
          background: transparent;
          border: 4px solid #fff;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          opacity: 0;
          will-change: transform, opacity;
        }

        .ring-1 {
          border-color: #fff;
          filter: drop-shadow(0 0 12px #ff3c00);
          width: 80px;
          height: 80px;
          animation: shonen-ring-expand-1 1s cubic-bezier(0.1, 0.8, 0.3, 1) 0.25s both;
        }

        .ring-2 {
          border-color: #ffd700;
          filter: drop-shadow(0 0 16px #ff8c00);
          width: 140px;
          height: 140px;
          animation: shonen-ring-expand-2 1.1s cubic-bezier(0.1, 0.8, 0.3, 1) 0.3s both;
        }

        .ring-3 {
          border-color: #ff3c00;
          filter: drop-shadow(0 0 20px #ff3c00);
          width: 200px;
          height: 200px;
          animation: shonen-ring-expand-3 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) 0.35s both;
        }

        @keyframes shonen-ring-expand-1 {
          0% { transform: scale(0.1) rotate(0deg); opacity: 1; }
          100% { transform: scale(4) rotate(120deg); opacity: 0; }
        }

        @keyframes shonen-ring-expand-2 {
          0% { transform: scale(0.1) rotate(0deg); opacity: 1; }
          100% { transform: scale(3.2) rotate(-90deg); opacity: 0; }
        }

        @keyframes shonen-ring-expand-3 {
          0% { transform: scale(0.1) rotate(0deg); opacity: 0.8; }
          100% { transform: scale(2.6) rotate(180deg); opacity: 0; }
        }

        .shonen-slash {
          position: absolute;
          top: 50%;
          left: -20%;
          width: 140%;
          height: 16px;
          background: #fff;
          box-shadow: 0 0 30px #ff3c00, 0 0 60px #fff;
          transform: translateY(-50%) rotate(-22deg) scaleX(0);
          transform-origin: left;
          z-index: 26;
          pointer-events: none;
          animation: slash-slice 0.45s cubic-bezier(0.15, 0.85, 0.3, 1) 0.2s both;
        }

        @keyframes slash-slice {
          0% { transform: translateY(-50%) rotate(-22deg) scaleX(0); opacity: 1; }
          40% { transform: translateY(-50%) rotate(-22deg) scaleX(1); opacity: 1; filter: brightness(3.5); }
          100% { transform: translateY(-50%) rotate(-22deg) scaleX(1); opacity: 0; filter: brightness(1); }
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
          z-index: 25;
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
          background: linear-gradient(180deg, #ffffff 10%, #ffd700 45%, #ff3c00 80%, #000000 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(4px 4px 0px #000) drop-shadow(-4px -4px 0px #000) drop-shadow(4px -4px 0px #000) drop-shadow(-4px 4px 0px #000) drop-shadow(0px 10px 20px rgba(255, 60, 0, 0.75));
          animation: shonen-title-slam 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        .shonen-subtitle {
          font-family: var(--font-kanit, "Kanit"), sans-serif;
          font-size: clamp(0.85rem, 1.8vw, 1.2rem);
          font-weight: 900;
          letter-spacing: 0.2em;
          color: #fff;
          text-transform: uppercase;
          filter: drop-shadow(2px 2px 0px #000) drop-shadow(-2px -2px 0px #000) drop-shadow(2px -2px 0px #000) drop-shadow(-2px 2px 0px #000);
          opacity: 0;
          animation: shonen-sub-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
        }

        @keyframes shonen-sub-appear {
          0% { opacity: 0; transform: translateY(15px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .god-rarity-impact {
          animation: shonen-earthquake 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .god-rarity-flash {
          position: absolute;
          inset: 0;
          z-index: 18;
          pointer-events: none;
          background: #ffffff;
          box-shadow: inset 0 0 120px #ff3c00, 0 0 100px #ffd700;
          animation: shonen-flash-out 0.85s cubic-bezier(0.1, 0.8, 0.3, 1) both;
        }

        @keyframes shonen-flash-out {
          0% { opacity: 1; filter: brightness(3.5); }
          20% { opacity: 1; filter: brightness(2); }
          100% { opacity: 0; filter: brightness(1); }
        }

        .neon-stage-background.god-stage {
          background:
            radial-gradient(
              circle at center,
              rgba(255, 60, 0, 0.16),
              transparent 45%
            ),
            linear-gradient(145deg, #0e0300 0%, #050100 50%, #150500 100%);
        }

        .god-stage .neon-stage-grid {
          opacity: 0.22;
          background-image:
            linear-gradient(rgba(255, 60, 0, 0.6) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 140, 0, 0.55) 1px,
              transparent 1px
            );
        }

        .god-stage .shape-left {
          color: #ff3c00;
          background: linear-gradient(
            135deg,
            rgba(255, 60, 0, 0.25),
            transparent 64%
          );
        }

        .god-stage .shape-right {
          color: #ffd700;
          background: linear-gradient(
            145deg,
            rgba(255, 215, 0, 0.22),
            transparent 66%
          );
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
          0% { transform: translate3d(0, 0, 0) scale(1.05); }
          10% { transform: translate3d(-10px, 8px, 0) scale(1.08) rotate(-1.5deg); }
          20% { transform: translate3d(8px, -8px, 0) scale(1.02) rotate(1.5deg); }
          30% { transform: translate3d(-15px, -6px, 0) scale(1.1) rotate(-3deg); }
          40% { transform: translate3d(15px, 6px, 0) scale(1.05) rotate(3deg); }
          50% { transform: translate3d(-8px, 10px, 0) scale(1.07) rotate(-1.5deg); }
          60% { transform: translate3d(8px, -8px, 0) scale(1.03) rotate(1.5deg); }
          70% { transform: translate3d(-5px, 5px, 0) scale(1.04) rotate(-0.5deg); }
          80% { transform: translate3d(5px, -3px, 0) scale(1.02) rotate(0.5deg); }
          90% { transform: translate3d(-2px, 2px, 0) scale(1.01) rotate(-0.2deg); }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .neon-stage-grid,
          .neon-stage-halftone,
          .neon-stage-shape,
          .neon-stage-scan,
          .suspense-lines,
          .center-focus,
          .brake-flash {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
