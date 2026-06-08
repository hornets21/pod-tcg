"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card as CardType } from "../../../data/types";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";

interface CutsceneProps {
  cards: CardType[];
  onComplete: () => void;
}

export const CutsceneFoilRip: React.FC<CutsceneProps> = ({ cards, onComplete }) => {
  const { playSFX } = useAudio();
  const [phase, setPhase] = useState<"tension" | "ripping" | "reveal">("tension");

  const rarityConfig = useMemo(() => {
    const rarities = cards.map((c) => c.rarity);
    if (rarities.some((r) => ["LEG", "SEC", "UR"].includes(r))) {
      return { class: "gold", color: "#ffd700", rgb: "255, 215, 0" };
    }
    if (rarities.some((r) => ["SSR", "SR"].includes(r))) {
      return { class: "purple", color: "#a335ee", rgb: "163, 53, 238" };
    }
    return { class: "blue", color: "#0070dd", rgb: "0, 112, 221" };
  }, [cards]);

  useEffect(() => {
    // Phase 1: Tension (Shaking)
    const t1 = setTimeout(() => {
       setPhase("ripping");
       playSFX(AUDIO_URLS.TEAR_PACK, 1.0);
    }, 800);

    // Phase 2: The actual rip
    const t2 = setTimeout(() => {
       setPhase("reveal");
       playSFX(AUDIO_URLS.ELECTRONIC_BEAM, 0.8);
    }, 1600);

    // Phase 3: Completion
    const t3 = setTimeout(() => {
       onComplete();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, playSFX]);

  // Sparkles for the rip effect
  const sparkles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      id: i,
      tx: (Math.random() - 0.5) * 800,
      ty: (Math.random() - 0.5) * 800,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 0.2
    }));
  }, []);

  return (
    <div className={`foil-cutscene-root ${rarityConfig.class} phase-${phase}`}>
      <div className="vignette"></div>
      
      <div className="pack-wrapper">
         <div className="foil-half left">
            <div className="pack-texture"></div>
            <div className="pack-shine"></div>
         </div>
         <div className="foil-half right">
            <div className="pack-texture"></div>
            <div className="pack-shine"></div>
         </div>

         {/* Energy Core behind the rip */}
         <div className="energy-core"></div>
         
         {/* Rip Line Effect */}
         <div className="rip-indicator">
            <div className="glow-bar"></div>
         </div>
      </div>

      {/* Burst Particles */}
      {phase === "reveal" && (
        <div className="burst-container">
           {sparkles.map((s) => (
             <div key={s.id} className="foil-sparkle" style={{
                "--tx": `${s.tx}px`,
                "--ty": `${s.ty}px`,
                "--size": `${s.size}px`,
                animationDelay: `${s.delay}s`
             } as React.CSSProperties}></div>
           ))}
        </div>
      )}

      {/* Impact Flash */}
      <div className="flash-layer"></div>

      <style jsx>{`
        .foil-cutscene-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .gold { --ac: #ffd700; --ac-rgb: 255, 215, 0; }
        .purple { --ac: #a335ee; --ac-rgb: 163, 53, 238; }
        .blue { --ac: #0070dd; --ac-rgb: 0, 112, 221; }

        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.9) 100%);
          z-index: 5;
        }

        .pack-wrapper {
          position: relative;
          width: 340px;
          height: 500px;
          display: flex;
          z-index: 10;
        }

        .phase-tension .pack-wrapper {
          animation: tension-shake 0.1s infinite;
        }

        @keyframes tension-shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 2px); }
          75% { transform: translate(2px, -2px); }
        }

        .foil-half {
          flex: 1;
          background: linear-gradient(145deg, #111 0%, #222 50%, #111 100%);
          position: relative;
          overflow: hidden;
          transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
        }

        .left {
          border-radius: 20px 0 0 20px;
          clip-path: polygon(0 0, 100% 0, 96% 10%, 100% 20%, 96% 30%, 100% 40%, 96% 50%, 100% 60%, 96% 70%, 100% 80%, 96% 90%, 100% 100%, 0 100%);
        }

        .right {
          border-radius: 0 20px 20px 0;
          margin-left: -4px;
          clip-path: polygon(4% 0, 100% 0, 100% 100%, 4% 100%, 0 90%, 4% 80%, 0 70%, 4% 60%, 0 50%, 4% 40%, 0 30%, 4% 20%, 0 10%);
        }

        .pack-texture {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, var(--ac) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.1;
        }

        .pack-shine {
          position: absolute;
          inset: -100% -100%;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
          animation: shine-sweep 3s infinite linear;
        }

        @keyframes shine-sweep {
          from { transform: translateX(-50%) translateY(-50%) rotate(0deg); }
          to { transform: translateX(50%) translateY(50%) rotate(0deg); }
        }

        .energy-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 200px;
          height: 300px;
          background: var(--ac);
          filter: blur(60px);
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
          z-index: -1;
          transition: all 0.5s ease;
        }

        .phase-ripping .energy-core { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
        .phase-reveal .energy-core { opacity: 0.8; transform: translate(-50%, -50%) scale(1.5); }

        .rip-indicator {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255,255,255,0.3);
          transform: translateX(-50%);
          z-index: 20;
          transition: opacity 0.3s;
        }

        .glow-bar {
          position: absolute;
          inset: -20px -10px;
          background: #fff;
          filter: blur(15px);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .phase-tension .glow-bar { opacity: 0.4; animation: glow-pulse 0.2s infinite alternate; }

        @keyframes glow-pulse {
          from { opacity: 0.2; transform: scaleX(0.8); }
          to { opacity: 0.6; transform: scaleX(1.2); }
        }

        /* Animation States */
        .phase-reveal .left { transform: translateX(-150%) rotate(-20deg); opacity: 0; }
        .phase-reveal .right { transform: translateX(150%) rotate(20deg); opacity: 0; }
        .phase-reveal .rip-indicator { opacity: 0; }

        /* --- Sparkles --- */
        .burst-container {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;
        }

        .foil-sparkle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--size);
          height: var(--size);
          background: #fff;
          box-shadow: 0 0 10px var(--ac);
          border-radius: 50%;
          animation: particle-burst 1s ease-out forwards;
        }

        @keyframes particle-burst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        /* --- Flash --- */
        .flash-layer {
          position: absolute;
          inset: 0;
          background: #fff;
          z-index: 100;
          opacity: 0;
          pointer-events: none;
        }

        .phase-reveal .flash-layer {
          animation: final-flash 1.2s ease-out forwards;
        }

        @keyframes final-flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }

        .foil-cutscene-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--ac) 0%, #000 80%);
          z-index: 1;
          opacity: 0;
          transition: opacity 1.5s ease;
        }

        .phase-reveal::after {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
};
