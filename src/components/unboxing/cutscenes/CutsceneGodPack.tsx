"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";

interface CutsceneGodPackProps {
  onComplete: () => void;
}

export const CutsceneGodPack: React.FC<CutsceneGodPackProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"accumulation" | "explosion" | "celebration" | "dismiss">("accumulation");
  const { playSFX } = useAudio();

  useEffect(() => {
    // 1. Divine Accumulation (Suspense)
    const timer1 = setTimeout(() => {
      setPhase("explosion");
      playSFX(AUDIO_URLS.HEAVENLY, 0.2);
    }, 1500);

    // 2. Celebration (Jackpot state)
    const timer2 = setTimeout(() => {
      setPhase("celebration");
      playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.2);
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [playSFX]);

  // Generate gold rain particles
  const goldRain = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2,
      opacity: 0.4 + Math.random() * 0.6
    }));
  }, []);

  // Generate energy rays
  const rays = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      rotation: i * 30,
      delay: i * 0.05
    }));
  }, []);

  return (
    <div className={`godpack-cinematic-root phase-${phase}`}>
      <div className="vignette"></div>
      
      {/* Divine Core / Accumulation */}
      <div className="divine-core-container">
        <div className="divine-light"></div>
        <div className="core-shimmer"></div>
      </div>

      {/* Explosive Rays */}
      <div className="rays-container">
        {rays.map(ray => (
          <div key={ray.id} className="energy-ray" style={{
            transform: `rotate(${ray.rotation}deg)`,
            transitionDelay: `${ray.delay}s`
          }}></div>
        ))}
      </div>

      {/* Gold Rain (Jackpot Celebration) */}
      <div className="gold-rain-container">
        {goldRain.map(p => (
          <div key={p.id} className="gold-flake" style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity
          }}></div>
        ))}
      </div>

      {/* Text Reveal */}
      <div className="jackpot-text-box">
        <div className="jackpot-label">UNBELIEVABLE!</div>
        <h1 className="main-title" data-text="GOD PACK">GOD PACK</h1>
        <div className="jackpot-sub">THE HEAVENS HAVE OPENED</div>
      </div>

      {/* Interaction Layer */}
      <div className="action-layer">
        <button className="destiny-btn" onClick={() => {
           setPhase("dismiss");
           setTimeout(onComplete, 800);
        }}>
          CLAIM YOUR DESTINY
        </button>
      </div>

      <style jsx>{`
        .godpack-cinematic-root {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Kanit', sans-serif;
        }

        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 20%, #000 100%);
          z-index: 5;
        }

        /* --- Divine Accumulation --- */
        .divine-core-container {
          position: absolute;
          z-index: 10;
        }

        .divine-light {
          width: 100px;
          height: 100px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 100px #ffcb05, 0 0 200px #ffcb05;
          filter: blur(20px);
          animation: core-breathe 1.5s ease-in-out forwards;
        }

        @keyframes core-breathe {
          0% { transform: scale(0.1); opacity: 0; }
          80% { transform: scale(2); opacity: 1; }
          100% { transform: scale(50); opacity: 0; }
        }

        .phase-explosion .divine-light {
          animation: none;
          transform: scale(100);
          opacity: 0;
          transition: transform 0.5s ease-in, opacity 0.5s ease-in;
        }

        /* --- Energy Rays --- */
        .rays-container {
          position: absolute;
          inset: -100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          z-index: 8;
        }

        .phase-celebration .rays-container {
          opacity: 1;
          transition: opacity 1s ease;
          animation: rays-spin 20s linear infinite;
        }

        @keyframes rays-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .energy-ray {
          position: absolute;
          width: 2px;
          height: 300%;
          background: linear-gradient(to top, transparent, #ffcb05, transparent);
          opacity: 0.3;
        }

        /* --- Jackpot Text --- */
        .jackpot-text-box {
          position: relative;
          z-index: 100;
          text-align: center;
          opacity: 0;
          transform: scale(0.5);
          filter: blur(20px);
        }

        .phase-celebration .jackpot-text-box {
          opacity: 1;
          transform: scale(1);
          filter: blur(0);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .jackpot-label {
          color: #ffcb05;
          letter-spacing: 0.5em;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .main-title {
          font-size: 8rem;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 0 30px #ffcb05, 0 0 60px #ffcb05;
          margin: 0;
          line-height: 1;
          position: relative;
        }

        .jackpot-sub {
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 1em;
          font-size: 1rem;
          margin-top: 1rem;
          text-transform: uppercase;
        }

        /* --- Gold Rain --- */
        .gold-rain-container {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          opacity: 0;
        }

        .phase-celebration .gold-rain-container {
          opacity: 1;
        }

        .gold-flake {
          position: absolute;
          top: -20px;
          background: linear-gradient(135deg, #ffcb05, #ff8800);
          border-radius: 2px;
          animation: flake-fall linear infinite;
          box-shadow: 0 0 10px rgba(255, 203, 5, 0.5);
        }

        @keyframes flake-fall {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(720deg); }
        }

        /* --- Actions --- */
        .action-layer {
          position: absolute;
          bottom: 10%;
          z-index: 200;
          opacity: 0;
          transform: translateY(20px);
        }

        .phase-celebration .action-layer {
          opacity: 1;
          transform: translateY(0);
          transition: all 1s ease 1.5s;
        }

        .destiny-btn {
          background: #ffcb05;
          color: #000;
          border: none;
          padding: 1.2rem 4rem;
          font-size: 1.4rem;
          font-weight: 900;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 10px 40px rgba(255, 203, 5, 0.4);
          transition: all 0.3s ease;
        }

        .destiny-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 15px 60px rgba(255, 203, 5, 0.7);
        }

        /* --- Dismiss Phase --- */
        .phase-dismiss {
          opacity: 0;
          transition: opacity 0.8s ease;
        }

        @media (max-width: 768px) {
          .main-title { font-size: 4rem; }
          .jackpot-label { font-size: 0.8rem; }
          .jackpot-sub { font-size: 0.7rem; letter-spacing: 0.4em; }
          .destiny-btn { padding: 1rem 2.5rem; font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
};
