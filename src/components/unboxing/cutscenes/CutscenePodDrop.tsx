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
  const [phase, setPhase] = useState<"entry" | "plummet" | "impact" | "aftermath">("entry");

  const rarityConfig = useMemo(() => {
    const rarities = cards.map((c) => c.rarity);
    const isSpecial = cards.some((c) => c.role_id === "1356458345812459611");

    if (isSpecial || rarities.some((r) => ["LEG", "SEC", "UR"].includes(r))) {
      return { class: "gold", color: "#ffd700", rgb: "255, 215, 0" };
    }
    if (rarities.some((r) => ["SSR", "SR"].includes(r))) {
      return { class: "purple", color: "#a335ee", rgb: "163, 53, 238" };
    }
    return { class: "blue", color: "#0070dd", rgb: "0, 112, 221" };
  }, [cards]);

  useEffect(() => {
    // Stage 1: Entry (Zoom In at center)
    // Small whoosh or anticipation sound could go here
    
    const t1 = setTimeout(() => {
       setPhase("plummet");
       playSFX(AUDIO_URLS.METEOR_FLYBY, 0.2);
    }, 1800); // Wait 1.8s for zoom and hold

    const t2 = setTimeout(() => {
       setPhase("impact");
       playSFX(AUDIO_URLS.IMPACT_HEAVY, 0.25);
    }, 2400); // 0.6s for the high-speed strike

    const t3 = setTimeout(() => {
       setPhase("aftermath");
    }, 3200);

    const t4 = setTimeout(() => {
       onComplete();
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete, playSFX]);

  // Particles for the impact
  const debris = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      angle: Math.random() * 360,
      dist: 200 + Math.random() * 1000,
      size: 3 + Math.random() * 10,
      delay: Math.random() * 0.2
    }));
  }, []);

  // Shards for the pod shattering
  const podShards = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      tx: (Math.random() - 0.5) * 800,
      ty: (Math.random() - 0.5) * 800,
      tr: (Math.random() - 0.5) * 720,
      size: 40 + Math.random() * 60,
      delay: Math.random() * 0.1,
      clip: `polygon(${Math.random() * 100}% ${Math.random() * 100}%, ${Math.random() * 100}% ${Math.random() * 100}%, ${Math.random() * 100}% ${Math.random() * 100}%)`
    }));
  }, []);

  return (
    <div className={`pod-cutscene-root ${rarityConfig.class} phase-${phase}`}>
      <div className="starfield"></div>
      
      {/* The Meteor / Pod */}
      <div className="meteor-container">
         <div className="meteor-trail"></div>
         <div className="meteor-core"></div>
         <div className="meteor-glow"></div>
         <div className="entry-flare"></div>
      </div>

      {/* Impact Visuals */}
      {(phase === "impact" || phase === "aftermath") && (
        <>
          <div className="smoke-impact"></div>
          <div className="shockwave-container">
             <div className="shockwave ring-1"></div>
             <div className="shockwave ring-2"></div>
             <div className="shockwave ring-3"></div>
          </div>

          {/* Pod Shattering Effect */}
          <div className="pod-shards-container">
             {podShards.map((s) => (
               <div key={s.id} className="pod-shard" style={{
                  "--tx": `${s.tx}px`,
                  "--ty": `${s.ty}px`,
                  "--tr": `${s.tr}deg`,
                  "--size": `${s.size}px`,
                  "--delay": `${s.delay}s`,
                  clipPath: s.clip
               } as React.CSSProperties}></div>
             ))}
          </div>
        </>
      )}

      {/* Burst Debris */}
      {(phase === "impact" || phase === "aftermath") && (
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

        /* --- Animations & Phases --- */
        .meteor-container {
          position: absolute;
          width: 180px;
          height: 180px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
        }

        /* Entry Phase: Cinematic zoom and show-off */
        .phase-entry .meteor-container {
          animation: meteor-entry 1.8s ease-in-out forwards;
        }

        @keyframes meteor-entry {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          40% { transform: scale(1.8) rotate(5deg); opacity: 1; }
          85% { transform: scale(1.6) rotate(0deg); opacity: 1; }
          100% { transform: scale(0) rotate(0deg); opacity: 0; } /* Disappear to prepare for strike */
        }

        /* Plummet Phase: Strike from Top-Left to Center */
        .phase-plummet .meteor-container {
          animation: meteor-strike 0.6s cubic-bezier(0.6, 0.04, 0.98, 0.335) forwards;
        }

        .phase-impact .meteor-container, .phase-aftermath .meteor-container {
          display: none;
        }

        @keyframes meteor-strike {
          0% { transform: translate(-300%, -300%) rotate(135deg) scale(1); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate(0, 0) rotate(135deg) scale(2.5); opacity: 1; }
        }

        .meteor-core {
          position: absolute;
          inset: 0;
          background: url('/gacha-pod.png') no-repeat center/contain;
          z-index: 2;
        }

        /* --- Pod Shattering --- */
        .pod-shards-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 25;
          pointer-events: none;
        }

        .pod-shard {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: url('/gacha-pod.png') no-repeat center/contain;
          animation: pod-shatter 1.5s cubic-bezier(0.1, 0.8, 0.2, 1) var(--delay) forwards;
          opacity: 0;
        }

        @keyframes pod-shatter {
          0% { transform: translate(0, 0) rotate(0) scale(1.5); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--tr)) scale(0); opacity: 0; }
        }

        .meteor-trail {
          position: absolute;
          bottom: 50%;
          left: 50%;
          transform: translateX(-50%);
          width: 140px;
          height: 700px;
          background: url('/fire-trail.png') no-repeat bottom center/contain;
          filter: drop-shadow(0 0 30px var(--ac));
          opacity: 0;
          z-index: 1;
        }

        .phase-plummet .meteor-trail {
          opacity: 1;
          animation: fire-flicker 0.1s infinite alternate;
        }

        @keyframes fire-flicker {
          from { opacity: 0.8; transform: translateX(-50%) scaleX(1); }
          to { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
        }

        .entry-flare {
           position: absolute;
           inset: -80px;
           background: radial-gradient(circle, #fff 0%, transparent 70%);
           opacity: 0;
           z-index: 3;
        }

        .phase-entry .entry-flare {
           animation: flare-pulse 1.2s ease-out forwards;
        }

        @keyframes flare-pulse {
           0% { transform: scale(0); opacity: 0; }
           30% { transform: scale(1.5); opacity: 1; }
           100% { transform: scale(1); opacity: 0; }
        }

        .meteor-glow {
          position: absolute;
          inset: -40px;
          background: var(--ac);
          filter: blur(50px);
          opacity: 0.6;
          border-radius: 50%;
        }

        /* --- Impact --- */
        .phase-impact {
           animation: screen-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes screen-shake {
          10%, 90% { transform: translate3d(-6px, -12px, 0); }
          20%, 80% { transform: translate3d(12px, 24px, 0); }
          30%, 50%, 70% { transform: translate3d(-18px, -36px, 0); }
          40%, 60% { transform: translate3d(18px, 36px, 0); }
        }

        .smoke-impact {
          position: absolute;
          width: 900px;
          height: 900px;
          background: url('/smoke-impact.png') no-repeat center/contain;
          z-index: 15;
          animation: smoke-fade 2s ease-out forwards;
        }

        @keyframes smoke-fade {
          0% { transform: scale(0.2); opacity: 0; }
          10% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
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
          20% { opacity: 1; }
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
          border: 0px solid #fff;
          border-radius: 50%;
          opacity: 0;
          box-shadow: 0 0 50px var(--ac);
        }

        .ring-1 { animation: expand 1.4s ease-out forwards; }
        .ring-2 { animation: expand 1.6s ease-out 0.1s forwards; }
        .ring-3 { animation: expand 1.8s ease-out 0.2s forwards; }

        @keyframes expand {
          0% { width: 0; height: 0; opacity: 1; border-width: 5px; }
          100% { width: 500vw; height: 500vw; opacity: 0; border-width: 0px; }
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
          box-shadow: 0 0 20px var(--ac);
          border-radius: 3px;
          animation: debris-fly 1.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }

        @keyframes debris-fly {
          0% { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateY(calc(-1 * var(--dist))) scale(0); opacity: 0; }
        }

        .pod-cutscene-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--ac) 0%, #000 95%);
          z-index: 1;
          opacity: 0;
          transition: opacity 2s ease;
        }

        .phase-aftermath::after {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
};
