"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card as CardType } from "../../../data/types";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";

interface CutsceneProps {
  cards: CardType[];
  onComplete: () => void;
}

const hashString = (input: string) => {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRng = (seed: number) => {
  let state = seed || 1;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const CutscenePodDrop: React.FC<CutsceneProps> = ({
  cards,
  onComplete,
}) => {
  const { playSFX } = useAudio();
  const [phase, setPhase] = useState<
    "entry" | "plummet" | "impact" | "aftermath"
  >("entry");
  const [isLiteMode, setIsLiteMode] = useState(true);

  const cardSeed = useMemo(() => {
    return cards.map((c) => `${c.name}:${c.rarity}:${c.role_id}`).join("|");
  }, [cards]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 768px), (prefers-reduced-motion: reduce)",
    );

    const updateMode = () => setIsLiteMode(mediaQuery.matches);
    updateMode();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMode);
      return () => mediaQuery.removeEventListener("change", updateMode);
    }

    mediaQuery.addListener(updateMode);
    return () => mediaQuery.removeListener(updateMode);
  }, []);

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
    const count = isLiteMode ? 18 : 44;
    const rng = createRng(
      hashString(`debris:${cardSeed}:${isLiteMode ? "lite" : "full"}`),
    );

    return [...Array(count)].map((_, i) => ({
      id: i,
      angle: rng() * 360,
      dist: isLiteMode ? 140 + rng() * 340 : 220 + rng() * 860,
      size: isLiteMode ? 2 + rng() * 5 : 3 + rng() * 9,
      delay: rng() * 0.2,
    }));
  }, [cardSeed, isLiteMode]);

  // Shards for the pod shattering
  const podShards = useMemo(() => {
    const count = isLiteMode ? 8 : 14;
    const rng = createRng(
      hashString(`shards:${cardSeed}:${isLiteMode ? "lite" : "full"}`),
    );

    return [...Array(count)].map((_, i) => {
      const toneRoll = rng();

      return {
        id: i,
        tx: (rng() - 0.5) * (isLiteMode ? 340 : 760),
        ty: (rng() - 0.5) * (isLiteMode ? 360 : 760),
        tr: (rng() - 0.5) * (isLiteMode ? 360 : 720),
        width: isLiteMode ? 18 + rng() * 26 : 28 + rng() * 54,
        height: isLiteMode ? 8 + rng() * 20 : 12 + rng() * 38,
        delay: rng() * 0.1,
        tone: toneRoll > 0.74 ? "crystal" : toneRoll > 0.46 ? "gold" : "metal",
        clip: isLiteMode
          ? "polygon(8% 0%, 100% 18%, 76% 100%, 0% 68%)"
          : `polygon(${rng() * 100}% ${rng() * 100}%, ${rng() * 100}% ${rng() * 100}%, ${rng() * 100}% ${rng() * 100}%)`,
      };
    });
  }, [cardSeed, isLiteMode]);

  return (
    <div
      className={`pod-cutscene-root ${isLiteMode ? "lite-mode" : "full-mode"} phase-${phase}`}
    >
      <div className="starfield"></div>
      <div className="speed-lines"></div>

      {/* The Meteor / Pod */}
      <div className="meteor-container">
        <div className="meteor-trail"></div>
        <div className="meteor-core"></div>
        <div className="meteor-glow"></div>
      </div>

      {/* Impact Visuals */}
      {(phase === "impact" || phase === "aftermath") && (
        <>
          <div className={`smoke-impact ${isLiteMode ? "lite" : ""}`}></div>
          <div className="impact-radiance"></div>
          <div className="shockwave-container">
            <div className="shockwave ring-1"></div>
            {!isLiteMode && <div className="shockwave ring-2"></div>}
            {!isLiteMode && <div className="shockwave ring-3"></div>}
          </div>

          {/* Pod Shattering Effect */}
          <div className="pod-shards-container">
            {podShards.map((s) => (
              <div
                key={s.id}
                className="pod-shard"
                style={
                  {
                    "--tx": `${s.tx}px`,
                    "--ty": `${s.ty}px`,
                    "--tr": `${s.tr}deg`,
                    "--shard-width": `${s.width}px`,
                    "--shard-height": `${s.height}px`,
                    "--delay": `${s.delay}s`,
                    clipPath: s.clip,
                  } as React.CSSProperties
                }
                data-tone={s.tone}
              ></div>
            ))}
          </div>
        </>
      )}

      {/* Burst Debris */}
      {(phase === "impact" || phase === "aftermath") && (
        <div className="debris-layer">
          {debris.map((d) => (
            <div
              key={d.id}
              className="debris-bit"
              style={
                {
                  "--angle": `${d.angle}deg`,
                  "--dist": `${d.dist}px`,
                  "--size": `${d.size}px`,
                  animationDelay: `${d.delay}s`,
                } as React.CSSProperties
              }
            ></div>
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
          contain: layout paint style;
        }

        .gold {
          --ac: #ffd700;
          --ac-rgb: 255, 215, 0;
        }
        .purple {
          --ac: #a335ee;
          --ac-rgb: 163, 53, 238;
        }
        .blue {
          --ac: #0070dd;
          --ac-rgb: 0, 112, 221;
        }

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
          will-change: opacity;
        }

        .lite-mode .starfield {
          background-image: none;
          opacity: 0;
        }

        .speed-lines {
          position: absolute;
          inset: -15%;
          z-index: 4;
          opacity: 0;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              transparent 0 42%,
              rgba(255, 255, 255, 0.22) 43%,
              transparent 44% 100%
            ),
            linear-gradient(
              135deg,
              transparent 0 58%,
              rgba(var(--ac-rgb), 0.28) 59%,
              transparent 60% 100%
            );
          background-size:
            160px 160px,
            220px 220px;
          transform: translate3d(-12%, -12%, 0);
        }

        .phase-plummet .speed-lines {
          animation: speed-lines 0.6s ease-in forwards;
        }

        @keyframes speed-lines {
          0% {
            opacity: 0;
            transform: translate3d(-12%, -12%, 0);
          }
          20% {
            opacity: 0.55;
          }
          100% {
            opacity: 0;
            transform: translate3d(16%, 16%, 0);
          }
        }

        /* --- Animations & Phases --- */
        .meteor-container {
          position: absolute;
          width: 170px;
          height: 270px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          contain: style;
          will-change: transform, opacity;
        }

        /* Entry Phase: Cinematic zoom and show-off */
        .phase-entry .meteor-container {
          animation: meteor-entry 1.8s ease-in-out forwards;
        }

        @keyframes meteor-entry {
          0% {
            transform: scale(0) rotate(-20deg);
            opacity: 0;
          }
          40% {
            transform: scale(1.8) rotate(5deg);
            opacity: 1;
          }
          85% {
            transform: scale(1.6) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          } /* Disappear to prepare for strike */
        }

        /* Plummet Phase: Strike from Top-Left to Center */
        .phase-plummet .meteor-container {
          animation: meteor-strike 0.6s cubic-bezier(0.6, 0.04, 0.98, 0.335)
            forwards;
        }

        .phase-impact .meteor-container,
        .phase-aftermath .meteor-container {
          display: none;
        }

        @keyframes meteor-strike {
          0% {
            transform: translate(-300%, -300%) rotate(135deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) rotate(135deg) scale(2.5);
            opacity: 1;
          }
        }

        .meteor-core {
          position: absolute;
          inset: 0;
          background: url("/pod-drop-capsule.png") no-repeat center/contain;
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
          width: var(--shard-width);
          height: var(--shard-height);
          overflow: hidden;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.82),
              rgba(93, 102, 113, 0.42) 18%,
              rgba(8, 11, 16, 0.95) 58%,
              rgba(0, 220, 255, 0.65)
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.36),
              transparent 34% 72%,
              rgba(var(--ac-rgb), 0.52)
            );
          animation: pod-shatter 1.5s cubic-bezier(0.1, 0.8, 0.2, 1)
            var(--delay) forwards;
          border: 1px solid rgba(215, 234, 255, 0.55);
          box-shadow: 0 0 12px rgba(var(--ac-rgb), 0.32);
          opacity: 0;
          will-change: transform, opacity;
        }

        .pod-shard::after {
          content: "";
          position: absolute;
          inset: 1px 18% auto 8%;
          height: 1px;
          background: rgba(255, 255, 255, 0.75);
          opacity: 0.72;
        }

        .pod-shard[data-tone="gold"] {
          background:
            linear-gradient(
              135deg,
              rgba(255, 245, 196, 0.9),
              rgba(168, 112, 33, 0.8) 34%,
              rgba(26, 19, 12, 0.95) 68%,
              rgba(255, 195, 69, 0.62)
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.32),
              transparent 42% 78%,
              rgba(255, 215, 0, 0.45)
            );
          border-color: rgba(255, 216, 111, 0.62);
          box-shadow: 0 0 10px rgba(255, 194, 57, 0.26);
        }

        .pod-shard[data-tone="crystal"] {
          background:
            linear-gradient(
              135deg,
              rgba(211, 252, 255, 0.92),
              rgba(0, 188, 255, 0.58) 38%,
              rgba(4, 26, 51, 0.92) 72%,
              rgba(125, 244, 255, 0.75)
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.55),
              transparent 40% 70%,
              rgba(0, 236, 255, 0.64)
            );
          border-color: rgba(143, 241, 255, 0.75);
          box-shadow: 0 0 14px rgba(0, 218, 255, 0.42);
        }

        @keyframes pod-shatter {
          0% {
            transform: translate(0, 0) rotate(0) scale(1.25);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) rotate(var(--tr))
              scale(0);
            opacity: 0;
          }
        }

        .meteor-trail {
          position: absolute;
          top: 38%;
          left: 50%;
          transform: translate3d(-50%, 0, 0) rotate(180deg);
          width: 220px;
          height: 760px;
          background: url("/pod-drop-trail.png") no-repeat bottom center/contain;
          filter: drop-shadow(0 0 30px var(--ac));
          opacity: 0;
          z-index: 1;
          will-change: opacity, transform;
        }

        .phase-plummet .meteor-trail {
          opacity: 1;
          animation: fire-flicker 0.1s infinite alternate;
        }

        @keyframes fire-flicker {
          from {
            opacity: 0.8;
            transform: translate3d(-50%, 0, 0) rotate(180deg) scaleX(1);
          }
          to {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) rotate(180deg) scaleX(1.15);
          }
        }

        .meteor-glow {
          position: absolute;
          inset: -40px;
          background: var(--ac);
          filter: blur(50px);
          opacity: 0;
          border-radius: 50%;
          will-change: transform, opacity;
        }

        .phase-plummet .meteor-glow {
          opacity: 0.32;
        }

        /* --- Impact --- */
        .phase-impact {
          animation: screen-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes screen-shake {
          10%,
          90% {
            transform: translate3d(-6px, -12px, 0);
          }
          20%,
          80% {
            transform: translate3d(12px, 24px, 0);
          }
          30%,
          50%,
          70% {
            transform: translate3d(-18px, -36px, 0);
          }
          40%,
          60% {
            transform: translate3d(18px, 36px, 0);
          }
        }

        .smoke-impact {
          position: absolute;
          width: min(980px, 112vw);
          height: min(660px, 76vw);
          background: url("/pod-drop-impact.png") no-repeat center/contain;
          z-index: 15;
          animation: smoke-fade 2s ease-out forwards;
          will-change: transform, opacity;
        }

        .smoke-impact.lite {
          width: min(680px, 142vw);
          height: min(454px, 95vw);
          filter: none;
        }

        .impact-radiance {
          position: absolute;
          width: min(720px, 160vmax);
          height: min(720px, 160vmax);
          z-index: 12;
          border-radius: 50%;
          pointer-events: none;
          background:
            radial-gradient(
              circle,
              rgba(255, 255, 255, 0.85) 0 4%,
              rgba(var(--ac-rgb), 0.55) 5% 18%,
              transparent 56%
            ),
            conic-gradient(
              from 0deg,
              transparent,
              rgba(var(--ac-rgb), 0.35),
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
          mix-blend-mode: screen;
          opacity: 0;
          animation: radiance-burst 1.1s ease-out forwards;
        }

        @keyframes radiance-burst {
          0% {
            transform: scale(0.05) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.9;
          }
          100% {
            transform: scale(1.2) rotate(28deg);
            opacity: 0;
          }
        }

        @keyframes smoke-fade {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          10% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
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
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
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
          width: min(720px, 130vmax);
          height: min(720px, 130vmax);
          border: 5px solid #fff;
          border-radius: 50%;
          opacity: 0;
          box-shadow: 0 0 50px var(--ac);
          transform: scale(0);
          will-change: transform, opacity;
        }

        .ring-1 {
          animation: expand 1.4s ease-out forwards;
        }
        .ring-2 {
          animation: expand 1.6s ease-out 0.1s forwards;
        }
        .ring-3 {
          animation: expand 1.8s ease-out 0.2s forwards;
        }

        @keyframes expand {
          0% {
            transform: scale(0);
            opacity: 0;
            border-width: 5px;
          }
          12% {
            opacity: 1;
          }
          100% {
            transform: scale(4.8);
            opacity: 0;
            border-width: 0px;
          }
        }

        @media (max-width: 768px), (prefers-reduced-motion: reduce) {
          .meteor-container {
            width: 128px;
            height: 206px;
          }

          .meteor-trail {
            width: 156px;
            height: 540px;
            filter: none;
          }

          .meteor-glow {
            inset: -20px;
            filter: blur(28px);
            opacity: 0.45;
          }

          .smoke-impact {
            width: min(680px, 142vw);
            height: min(454px, 95vw);
          }

          .shockwave {
            width: min(420px, 115vmax);
            height: min(420px, 115vmax);
            box-shadow: 0 0 24px var(--ac);
          }

          .ring-1 {
            animation-duration: 1s;
          }

          @keyframes expand {
            0% {
              transform: scale(0);
              opacity: 0;
              border-width: 4px;
            }
            14% {
              opacity: 0.95;
            }
            100% {
              transform: scale(3.2);
              opacity: 0;
              border-width: 0px;
            }
          }

          @keyframes fire-flicker {
            from {
              opacity: 0.9;
              transform: translate3d(-50%, 0, 0) rotate(180deg) scaleX(1);
            }
            to {
              opacity: 1;
              transform: translate3d(-50%, 0, 0) rotate(180deg) scaleX(1.04);
            }
          }

          @keyframes smoke-fade {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            10% {
              transform: scale(0.9);
              opacity: 1;
            }
            100% {
              transform: scale(1.4);
              opacity: 0;
            }
          }

          @keyframes screen-shake {
            10%,
            90% {
              transform: translate3d(-3px, -6px, 0);
            }
            20%,
            80% {
              transform: translate3d(6px, 10px, 0);
            }
            30%,
            50%,
            70% {
              transform: translate3d(-8px, -14px, 0);
            }
            40%,
            60% {
              transform: translate3d(8px, 14px, 0);
            }
          }
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
          will-change: transform, opacity;
        }

        .lite-mode .debris-bit {
          box-shadow: 0 0 10px var(--ac);
        }

        @keyframes debris-fly {
          0% {
            transform: rotate(var(--angle)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--angle)) translateY(calc(-1 * var(--dist)))
              scale(0);
            opacity: 0;
          }
        }

        .pod-cutscene-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--ac) 0%, #000 95%);
          z-index: 1;
          opacity: 0;
          transition: opacity 2s ease;
          will-change: opacity;
        }

        .phase-aftermath::after {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
};
