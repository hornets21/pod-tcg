"use client";

import React, { useState, useEffect } from "react";
import { Card as CardType } from "../../data/types";
import { Card } from "../Card";
import { FullArtCard } from "../FullArtCard";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface CardRevealProps {
  cards: CardType[];
  season: string;
}

export const CardReveal: React.FC<CardRevealProps> = ({ cards, season }) => {
  const [revealedStates, setRevealedStates] = useState<boolean[]>(() => 
    new Array(cards.length).fill(false)
  );
  const [showHighRarityFlash, setShowHighRarityFlash] = useState(false);
  const { playSFX } = useAudio();

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

          // Play SFX based on rarity
          const isHighRarity = ["LEG", "SEC", "UR", "SSR"].includes(card.rarity);
          if (isHighRarity) {
            playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.6);
            setShowHighRarityFlash(true);
            setTimeout(() => setShowHighRarityFlash(false), 500);
          } else {
            playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.4);
          }
        }, flipDelay);
        timers.push(timer);
      });

      return () => timers.forEach(clearTimeout);
    }
  }, [cards, playSFX]);

  const CardComponent = season === "season2" ? FullArtCard : Card;

  return (
    <div className={`card-reveal-fan ${showHighRarityFlash ? "high-rarity-shake" : ""}`}>
      {showHighRarityFlash && <div className="gold-flash-overlay" />}
      
      <div className="pack-glow"></div>

      {cards.map((card, index) => {
        const delay = cardDelays[index % cardDelays.length];
        const isRevealed = revealedStates[index] || false;

        return (
          <div
            key={`${card.role_id}-${index}`}
            className="fan-card-wrapper"
            style={
              {
                "--delay": `${delay}ms`,
              } as React.CSSProperties
            }
          >
            <CardComponent
              card={card}
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
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        .gold-flash-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255, 215, 0, 0.2);
          box-shadow: inset 0 0 100px rgba(255, 215, 0, 0.5);
          pointer-events: none;
          z-index: 500;
          animation: flash-out 0.5s ease-out forwards;
        }

        @keyframes flash-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
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
      `}</style>
    </div>
  );
};
