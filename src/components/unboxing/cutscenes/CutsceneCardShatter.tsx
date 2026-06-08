"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card as CardType } from "../../../data/types";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";

interface CutsceneProps {
  cards: CardType[];
  onComplete: () => void;
}

export const CutsceneCardShatter: React.FC<CutsceneProps> = ({ cards, onComplete }) => {
  const { playSFX } = useAudio();
  const [phase, setPhase] = useState<"charging" | "slash" | "shatter" | "dissolve">("charging");

  // Determine accent color based on highest rarity
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
    // Stage 1: Charging (Wait for suspense)
    const t1 = setTimeout(() => {
      setPhase("slash");
      playSFX(AUDIO_URLS.SLASH, 0.8);
    }, 1000);

    // Stage 2: Shatter
    const t2 = setTimeout(() => {
      setPhase("shatter");
      playSFX(AUDIO_URLS.SHATTER, 1.0);
    }, 1800);

    // Stage 3: Dissolve
    const t3 = setTimeout(() => {
      setPhase("dissolve");
    }, 3000);

    // Stage 4: Finish
    const t4 = setTimeout(() => onComplete(), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete, playSFX]);

  // Generate random shard data once
  const shards = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      size: 60 + Math.random() * 120,
      left: 20 + Math.random() * 60,
      top: 20 + Math.random() * 60,
      tx: (Math.random() - 0.5) * 2500,
      ty: (Math.random() - 0.5) * 2500,
      tz: 400 + Math.random() * 800,
      tr: (Math.random() - 0.5) * 1080,
      delay: Math.random() * 0.2,
      clip: `polygon(${Math.random()*100}% ${Math.random()*100}%, ${Math.random()*100}% ${Math.random()*100}%, ${Math.random()*100}% ${Math.random()*100}%)`,
    }));
  }, []);

  // Generate random particles
  const particles = useMemo(() => {
     return [...Array(30)].map((_, i) => ({
        id: i,
        tx: (Math.random() - 0.5) * 1200,
        ty: (Math.random() - 0.5) * 1200,
        size: 3 + Math.random() * 5,
        delay: Math.random() * 0.3
     }));
  }, []);

  // Charging orbs data
  const orbs = useMemo(() => {
    return [...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 400 + Math.random() * 300;
        return {
            id: i,
            rx: Math.cos(angle) * dist,
            ry: Math.sin(angle) * dist,
            delay: Math.random() * 0.5
        };
    });
  }, []);

  return (
    <div className={`shatter-cutscene-root ${rarityConfig.class} ${phase}`}>
      {/* Background Ambience */}
      <div className="vignette"></div>
      <div className="focal-glow"></div>

      {/* Charging Particles - only show during charging phase */}
      {phase === "charging" && (
        <div className="charging-container">
            {orbs.map(orb => (
                <div key={orb.id} className="charge-orb" style={{
                    "--rx": `${orb.rx}px`,
                    "--ry": `${orb.ry}px`,
                    animationDelay: `${orb.delay}s`
                } as React.CSSProperties}></div>
            ))}
        </div>
      )}

      {/* The Slash Energy - show during slash and briefly into shatter */}
      {(phase === "slash" || phase === "shatter") && (
        <div className="slash-wrapper">
            <div className="slash-line main"></div>
            <div className="slash-line ghost-1"></div>
            <div className="slash-line ghost-2"></div>
        </div>
      )}

      {/* Impact Particles & Shards */}
      {(phase === "shatter" || phase === "dissolve") && (
        <>
            <div className="impact-particles">
                {particles.map((p) => (
                    <div key={p.id} className="spark" style={{
                        "--tx": `${p.tx}px`,
                        "--ty": `${p.ty}px`,
                        "--size": `${p.size}px`,
                        animationDelay: `${p.delay}s`
                    } as React.CSSProperties}></div>
                ))}
            </div>

            <div className="shards-container">
                {shards.map((s) => (
                    <div key={s.id} className="shard" style={{
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        "--tx": `${s.tx}px`,
                        "--ty": `${s.ty}px`,
                        "--tz": `${s.tz}px`,
                        "--tr": `${s.tr}deg`,
                        clipPath: s.clip,
                        animationDelay: `${s.delay}s`
                    } as React.CSSProperties}></div>
                ))}
            </div>
        </>
      )}

      {/* Final Flash */}
      <div className="whiteout"></div>

      <style jsx>{`
        .shatter-cutscene-root {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: #000;
          overflow: hidden;
          perspective: 1500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gold { --ac: #ffd700; --ac-rgb: 255, 215, 0; }
        .purple { --ac: #a335ee; --ac-rgb: 163, 53, 238; }
        .blue { --ac: #0070dd; --ac-rgb: 0, 112, 221; }

        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%);
          z-index: 5;
        }

        .focal-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          background: var(--ac);
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0;
          z-index: 2;
          transition: opacity 0.5s ease;
        }

        .charging .focal-glow {
          opacity: 0.4;
          animation: focal-pulse 1s infinite alternate;
        }

        @keyframes focal-pulse {
          from { transform: scale(1); opacity: 0.2; }
          to { transform: scale(1.4); opacity: 0.5; }
        }

        /* --- Charging --- */
        .charging-container {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .charge-orb {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 15px var(--ac);
          animation: charge-in 1s ease-in forwards;
        }

        @keyframes charge-in {
          0% { transform: translate(var(--rx), var(--ry)) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(0, 0) scale(1.5); opacity: 0; }
        }

        /* --- Slash --- */
        .slash-wrapper {
          position: absolute;
          width: 200%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          transform: rotate(-30deg);
          pointer-events: none;
        }

        .slash-line {
          position: absolute;
          width: 100%;
          background: #fff;
          box-shadow: 0 0 30px #fff, 0 0 60px var(--ac);
        }

        .slash-line.main { height: 15px; z-index: 3; }
        .slash-line.ghost-1 { height: 50px; opacity: 0.4; filter: blur(10px); z-index: 2; }
        .slash-line.ghost-2 { height: 100px; opacity: 0.2; filter: blur(25px); z-index: 1; }

        .slash .slash-wrapper {
          animation: slash-move 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        @keyframes slash-move {
          0% { transform: rotate(-30deg) translateX(100%); }
          100% { transform: rotate(-30deg) translateX(-100%); }
        }

        /* --- Shatter --- */
        .shards-container {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          transform-style: preserve-3d;
        }

        .shard {
          position: absolute;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          animation: shard-explode 1.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          box-shadow: inset 0 0 30px rgba(var(--ac-rgb), 0.3);
        }

        @keyframes shard-explode {
          0% { transform: translate3d(0, 0, 0) rotate(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--tx), var(--ty), var(--tz)) rotate(var(--tr)); opacity: 0; }
        }

        /* --- Particles --- */
        .impact-particles {
          position: absolute;
          inset: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .spark {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 15px var(--ac);
          animation: spark-fly 1s ease-out forwards;
        }

        @keyframes spark-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        /* --- Whiteout --- */
        .whiteout {
          position: absolute;
          inset: 0;
          background: #fff;
          z-index: 200;
          opacity: 0;
          pointer-events: none;
        }

        .shatter .whiteout {
          animation: whiteout-flash 1s ease-out forwards;
        }

        @keyframes whiteout-flash {
          0% { opacity: 0; }
          5% { opacity: 1; }
          100% { opacity: 0; }
        }

        .shatter-cutscene-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--ac) 0%, #000 80%);
          z-index: 1;
          opacity: 0;
          transition: opacity 1.5s ease;
        }

        .shatter::after, .dissolve::after {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
};
