"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneLighting } from "../three/SceneLighting";
import { CardRevealThree } from "../three/CardRevealThree";
import { BurstParticles, GodPackRing } from "../three/ParticleSystem";
import { Starfield } from "../three/Starfield";
import { MuteButton } from "./MuteButton";
import { Card as CardType } from "../../data/types";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface PackRipOverlay3DProps {
  isOpen: boolean;
  season: string;
  cards: CardType[];
  onClose: () => void;
  onRipComplete: () => void;
}

type Phase = "idle" | "cutscene" | "burst" | "cards" | "done";

export const PackRipOverlay3D: React.FC<PackRipOverlay3DProps> = ({
  isOpen,
  season,
  cards,
  onClose,
  onRipComplete,
}) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [burst, setBurst] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const { playSFX, startBGM, stopBGM } = useAudio();
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
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

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      stopBGM();
      // Defer state resets to avoid setting state synchronously in effect
      const t = setTimeout(() => {
        setPhase("idle");
        setShowCards(false);
        setBurst(false);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, clearTimers, stopBGM]);

  // Called when cutscene finishes → trigger burst → show 3D cards
  const handleCutsceneComplete = useCallback(() => {
    onRipComplete();
    setBurst(true);
    setPhase("burst");
    playSFX(AUDIO_URLS.TEAR_PACK, 0.2);

    const t1 = setTimeout(() => {
      setBurst(false);
      setShowCards(true);
      setPhase("cards");
    }, 700);

    const t2 = setTimeout(() => {
      setPhase("done");
    }, 5500);

    timersRef.current = [t1, t2];
  }, [onRipComplete, playSFX]);

  // Start opening flow immediately when opened with cards
  useEffect(() => {
    if (!isOpen || cards.length === 0) return;

    if (isGodPack) {
      startBGM(AUDIO_URLS.BGM_GOD, 0.4);
    }
    const t = setTimeout(() => {
      handleCutsceneComplete();
    }, 0);
    return () => {
      clearTimeout(t);
      clearTimers();
      stopBGM();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cards.length]);

  const handleClose = () => {
    if (phase === "cards" || phase === "done") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isHighRarity = cards.some((c) =>
    ["LEG", "SEC", "UR", "SSR"].includes(c.rarity)
  );

  const burstColor = isGodPack
    ? "#ffd700"
    : isHighRarity
    ? "#aa66ff"
    : "#44aaff";

  return (
    <div
      className="pack-rip-3d-overlay"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: phase === "cards" || phase === "done" ? "pointer" : "default",
      }}
    >


      {/* ── 3D SCENE (burst + cards phases) ── */}
      {(phase === "burst" || phase === "cards" || phase === "done") && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Canvas
            camera={{ position: [0, 0.5, 6], fov: 50 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            style={{ background: "transparent" }}
            dpr={[1, 2]}
          >
            <fog attach="fog" args={["#000010", 12, 40]} />
            <SceneLighting />
            <Starfield count={150} />

            {/* Burst particles */}
            <BurstParticles
              active={burst}
              color={burstColor}
              count={isGodPack ? 200 : 100}
            />

            {/* God pack ring */}
            {isGodPack && <GodPackRing active={burst} />}

            {/* 3D card fan */}
            {showCards && cards.length > 0 && (
              <CardRevealThree cards={cards} season={season} />
            )}
          </Canvas>
        </div>
      )}

      {/* Burst flash overlay */}
      {phase === "burst" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isGodPack
              ? "radial-gradient(circle at center, rgba(255,215,0,0.35) 0%, transparent 60%)"
              : "radial-gradient(circle at center, rgba(100,150,255,0.25) 0%, transparent 60%)",
            animation: "burstFlash 0.7s ease-out forwards",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
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

      {/* Close button for cards phase */}
      {(phase === "cards" || phase === "done") && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            position: "absolute",
            bottom: "4%",
            right: "50%",
            transform: "translateX(50%)",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "10px 32px",
            borderRadius: "30px",
            fontFamily: "Kanit, sans-serif",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            zIndex: 30,
            letterSpacing: "0.05em",
            marginBottom: "3rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          BACK TO BOX
        </button>
      )}

      {/* Mute button */}
      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 30 }}>
        <MuteButton />
      </div>

      <style jsx>{`
        @keyframes burstFlash {
          0% { opacity: 1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
