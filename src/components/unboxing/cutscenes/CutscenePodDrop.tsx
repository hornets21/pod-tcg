"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card as CardType } from "../../../data/types";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";

interface CutsceneProps {
  cards: CardType[];
  onComplete: () => void;
}

export const CutscenePodDrop: React.FC<CutsceneProps> = ({ cards, onComplete }) => {
  const { playSFX } = useAudio();
  const [phase, setPhase] = useState<"descending" | "impact" | "aftermath">("descending");

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
    // Stage 1: Descent
    playSFX(AUDIO_URLS.METEOR_FLYBY, 0.8);

    const t1 = setTimeout(() => {
       setPhase("impact");
       playSFX(AUDIO_URLS.IMPACT_HEAVY, 1.0);
    }, 800);

    const t2 = setTimeout(() => {
       setPhase("aftermath");
    }, 1600);

    const t3 = setTimeout(() => {
       onComplete();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, playSFX]);

  // Particles for the impact
  const debris = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      angle: Math.random() * 360,
      dist: 200 + Math.random() * 800,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 0.2
    }));
  }, []);

  return (
    <div className={`pod-cutscene-root ${rarityConfig.class} phase-${phase}`}>
      <div className="starfield"></div>
      
      {/* The Meteor / Pod */}
      <div className="meteor-container">
         <div className="meteor-trail"></div>
         <div className="meteor-core">
            <div className="pod-inner-logo">POD</div>
         </div>
         <div className="meteor-glow"></div>
      </div>

      {/* Impact Shockwaves */}
      {phase !== "descending" && (
        <div className="shockwave-container">
           <div className="shockwave ring-1"></div>
           <div className="shockwave ring-2"></div>
           <div className="shockwave ring-3"></div>
        </div>
      )}

      {/* Burst Debris */}
      {phase !== "descending" && (
        <div className="debris-layer">
           {debris.map((d) => (
             <div key={d.id} className="debris-bit" style={{
                "--angle": `${d.angle}deg`,
                "--dist": `${d.dist}px`,
                "--size": `${d.size}px`,
                animationDelay: `${d.delay}s`
             } as React.CSSProperties}></div>
           ))}
        </div>
      )}

      {/* Flash & Shake Overlay */}
      <div className="impact-flash"></div>

      <style jsx>{`
        .pod-cutscene-root {
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

        .starfield {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(1px 1px at 20% 30%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 50% 70%, #fff, transparent),
            radial-gradient(1px 1px at 80% 40%, #fff, transparent),
            radial-gradient(2px 2px at 10% 90%, #fff, transparent),
            radial-gradient(1px 1px at 90% 10%, #fff, transparent);
          background-size: 200px 200px;
          opacity: 0.3;
        }

        /* --- Meteor Descent --- */
        .meteor-container {
          position: absolute;
          width: 120px;
          height: 120px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(300%, -300%) rotate(45deg);
        }

        .phase-descending .meteor-container {
          animation: meteor-plummet 0.8s cubic-bezier(0.6, 0.04, 0.98, 0.335) forwards;
        }

        @keyframes meteor-plummet {
          0% { transform: translate(300%, -300%) rotate(45deg) scale(0.5); }
          100% { transform: translate(0, 0) rotate(45deg) scale(1.2); }
        }

        .meteor-core {
          width: 100%;
          height: 100%;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 40px var(--ac);
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: 900;
          font-size: 1.5rem;
          font-family: 'Kanit', sans-serif;
        }

        .meteor-trail {
          position: absolute;
          top: -300px;
          width: 80px;
          height: 350px;
          background: linear-gradient(to bottom, transparent, var(--ac), #fff);
          filter: blur(10px);
          opacity: 0.8;
          z-index: 1;
        }

        .meteor-glow {
          position: absolute;
          inset: -40px;
          background: var(--ac);
          filter: blur(40px);
          opacity: 0.6;
          border-radius: 50%;
        }

        .phase-impact .meteor-container,
        .phase-aftermath .meteor-container {
           opacity: 0;
           transform: scale(3);
           transition: all 0.3s ease-out;
        }

        /* --- Impact --- */
        .phase-impact {
           animation: screen-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes screen-shake {
          10%, 90% { transform: translate3d(-2px, -4px, 0); }
          20%, 80% { transform: translate3d(4px, 8px, 0); }
          30%, 50%, 70% { transform: translate3d(-8px, -12px, 0); }
          40%, 60% { transform: translate3d(8px, 12px, 0); }
        }

        .impact-flash {
          position: absolute;
          inset: 0;
          background: #fff;
          z-index: 100;
          opacity: 0;
          pointer-events: none;
        }

        .phase-impact .impact-flash {
          animation: flash-out 0.8s ease-out forwards;
        }

        @keyframes flash-out {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }

        .shockwave-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .shockwave {
          position: absolute;
          border: 4px solid #fff;
          border-radius: 50%;
          opacity: 0;
          box-shadow: 0 0 30px var(--ac);
        }

        .ring-1 { animation: expand 1s ease-out forwards; }
        .ring-2 { animation: expand 1.2s ease-out 0.1s forwards; }
        .ring-3 { animation: expand 1.4s ease-out 0.2s forwards; }

        @keyframes expand {
          0% { width: 0; height: 0; opacity: 1; border-width: 50px; }
          100% { width: 300vw; height: 300vw; opacity: 0; border-width: 0px; }
        }

        /* --- Debris --- */
        .debris-layer {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;
        }

        .debris-bit {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--size);
          height: var(--size);
          background: #fff;
          box-shadow: 0 0 10px var(--ac);
          border-radius: 2px;
          animation: debris-fly 1.2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }

        @keyframes debris-fly {
          0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateY(calc(-1 * var(--dist))) scale(0); opacity: 0; }
        }

        .pod-cutscene-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--ac) 0%, #000 85%);
          z-index: 1;
          opacity: 0;
          transition: opacity 2s ease;
        }

        .phase-aftermath::after {
          opacity: 0.2;
        }
      `}</style>
    </div>
  );
};
