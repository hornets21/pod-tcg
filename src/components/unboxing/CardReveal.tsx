"use client";

import React, { useState, useEffect } from "react";
import { Card as CardType, Rarity } from "../../data/types";
import { Card } from "../Card";
import { FullArtCard } from "../FullArtCard";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface CardRevealProps {
  cards: CardType[];
  season: string;
}

export const CardReveal: React.FC<CardRevealProps> = ({ cards, season }) => {
  const [revealedStates, setRevealedStates] = useState<boolean[]>(() =>
    new Array(cards.length).fill(false),
  );
  const [showHighRarityFlash, setShowHighRarityFlash] = useState(false);
  const [showSpecialImpact, setShowSpecialImpact] = useState(false);
  const { playSFX } = useAudio();

  const SPECIAL_ROLE_ID = "1513261078321172833";
  const ALL_RARITIES: Rarity[] = ["C", "R", "SR", "SSR", "UR", "SEC", "LEG"];

  // Pre-calculate fake rarities for the special card
  const [fakeRarities] = useState<Rarity[]>(() =>
    cards.map((card) => {
      if (card.role_id === SPECIAL_ROLE_ID) {
        return ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)];
      }
      return card.rarity;
    }),
  );

  const cardDelays = [200, 600, 1100, 1700, 2400];

  useEffect(() => {
    if (cards.length > 0) {
      const timers: NodeJS.Timeout[] = [];
      cards.forEach((card, index) => {
        const delay = cardDelays[index % cardDelays.length];
        const flipDelay = delay + 1200; // Adjusted for punchier feel

        const timer = setTimeout(() => {
          setRevealedStates((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });

          // Play SFX based on rarity or special role_id
          const isHighRarity = ["LEG", "SEC", "UR", "SSR"].includes(
            card.rarity,
          );
          const isSpecialCard = card.role_id === SPECIAL_ROLE_ID;

          if (isSpecialCard) {
            playSFX(AUDIO_URLS.IMPACT_HEAVY, 0.2);
            setShowSpecialImpact(true);
            setTimeout(() => setShowSpecialImpact(false), 800);
          } else if (isHighRarity) {
            playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.15);
            setShowHighRarityFlash(true);
            setTimeout(() => setShowHighRarityFlash(false), 500);
          } else {
            playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.1);
          }
        }, flipDelay);
        timers.push(timer);
      });

      return () => timers.forEach(clearTimeout);
    }
  }, [cards, playSFX]);

  const CardComponent = season === "season2" ? FullArtCard : Card;

  const containerClassName = `card-reveal-fan ${
    showHighRarityFlash ? "high-rarity-shake" : ""
  } ${showSpecialImpact ? "special-impact-shake" : ""}`;

  return (
    <div className={containerClassName}>
      {(showHighRarityFlash || showSpecialImpact) && (
        <div
          className={`flash-overlay ${showSpecialImpact ? "special-flash" : "gold-flash"}`}
        />
      )}

      <div className="pack-glow"></div>

      {cards.map((card, index) => {
        const delay = cardDelays[index % cardDelays.length];
        const isRevealed = revealedStates[index] || false;
        const isSpecialCard = card.role_id === SPECIAL_ROLE_ID;
        const fakeRarity = fakeRarities[index];

        // Clone card with fake rarity for visual rendering
        const displayCard = { ...card, rarity: fakeRarity };

        return (
          <div
            key={`${card.role_id}-${index}`}
            className={`fan-card-wrapper ${isSpecialCard && isRevealed ? "magnificent-wrapper" : ""}`}
            style={
              {
                "--delay": `${delay}ms`,
              } as React.CSSProperties
            }
          >
            {isSpecialCard && isRevealed && (
              <>
                <div className="magnificent-aura"></div>
                <div className="sparkles-container">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="magnificent-sparkle"
                      style={
                        {
                          "--tx": `${(Math.random() - 0.5) * 200}px`,
                          "--ty": `${-150 - Math.random() * 200}px`,
                          "--delay": `${Math.random() * 2}s`,
                          "--size": `${2 + Math.random() * 4}px`,
                        } as React.CSSProperties
                      }
                    ></div>
                  ))}
                </div>
              </>
            )}
            <CardComponent
              card={displayCard}
              isRevealed={isRevealed}
              enableHolo={true}
            />
          </div>
        );
      })}

      <style jsx>{`
        .card-reveal-fan {
          position: relative;
          width: 100%;
          height: 550px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: -50px;
          transition: transform 0.1s ease;
        }

        .high-rarity-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .special-impact-shake {
          animation: slam 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .flash-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 500;
          animation: flash-out 0.8s ease-out forwards;
        }

        .gold-flash {
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 100px rgba(255, 215, 0, 0.5);
        }

        .special-flash {
          background: rgba(255, 255, 255, 0.4);
          box-shadow: inset 0 0 150px rgba(255, 255, 255, 0.7);
        }

        @keyframes flash-out {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes shake {
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

        @keyframes slam {
          0% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.1) translate3d(0, -10px, 0);
          }
          40% {
            transform: scale(0.95) translate3d(0, 5px, 0);
          }
          50% {
            transform: translate3d(-8px, 0, 0);
          }
          60% {
            transform: translate3d(8px, 0, 0);
          }
          70% {
            transform: translate3d(-8px, 0, 0);
          }
          80% {
            transform: translate3d(8px, 0, 0);
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
          }
        }

        @media (max-width: 768px) {
          .card-reveal-fan {
            height: auto;
            min-height: 350px;
            gap: 10px;
            margin-top: 0;
            flex-wrap: wrap;
            padding: 1rem;
            overflow: visible;
            justify-content: center;
          }

          .fan-card-wrapper :global(.card) {
            width: 110px;
            height: 157px;
          }

          .fan-card-wrapper :global(.full-art-card-wrapper) {
            width: 110px !important;
            height: 157px !important;
            --card-scale: 0.314;
          }

          .pack-glow {
            width: 400px;
            height: 400px;
          }
        }

        @media (max-width: 480px) {
          .card-reveal-fan {
            height: auto;
            min-height: 280px;
            gap: 6px;
            margin-top: 0;
            flex-wrap: wrap;
            padding: 0.5rem;
            overflow: visible;
            justify-content: center;
            align-content: flex-start;
          }

          .fan-card-wrapper {
            flex: 0 0 auto;
          }

          .fan-card-wrapper :global(.card) {
            width: 100px;
            height: 143px;
          }

          .fan-card-wrapper :global(.full-art-card-wrapper) {
            width: 100px !important;
            height: 143px !important;
            --card-scale: 0.286;
          }

          .pack-glow {
            width: 300px;
            height: 300px;
          }
        }

        .pack-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.2) 0%,
            transparent 70%
          );
          z-index: 1;
          animation: pulse-glow 3s infinite;
          opacity: 0.6;
          pointer-events: none;
        }

        @keyframes pulse-glow {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.7;
          }
        }

        .fan-card-wrapper {
          opacity: 0;
          transform: translateY(100px) scale(0.5);
          animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            var(--delay) forwards;
          z-index: 10;
        }

        .fan-card-wrapper:hover {
          z-index: 100;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.5);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Magnificent Special Card Effects */
        .magnificent-wrapper {
          z-index: 50;
        }

        .magnificent-aura {
          position: absolute;
          inset: -10px;
          background: conic-gradient(
            from 0deg,
            #ff0000,
            #ff7f00,
            #ffff00,
            #00ff00,
            #0000ff,
            #4b0082,
            #8b00ff,
            #ff0000
          );
          border-radius: 12px;
          filter: blur(15px);
          opacity: 0.6;
          animation: aura-pulse 2s ease-in-out infinite alternate;
          z-index: -1;
        }

        @keyframes aura-pulse {
          from {
            opacity: 0.4;
            transform: scale(0.98);
          }
          to {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }

        .sparkles-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
        }

        .magnificent-sparkle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--size);
          height: var(--size);
          background: #fff;
          border-radius: 50%;
          box-shadow:
            0 0 10px #fff,
            0 0 20px #ff00ff;
          opacity: 0;
          animation: sparkle-fly 2s ease-out var(--delay) infinite;
        }

        @keyframes sparkle-fly {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
