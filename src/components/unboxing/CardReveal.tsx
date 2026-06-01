"use client";

import React from "react";
import { Card as CardType } from "../../data/types";
import { Card } from "../Card";
import { FullArtCard } from "../FullArtCard";

interface CardRevealProps {
  cards: CardType[];
  season: string;
}

export const CardReveal: React.FC<CardRevealProps> = ({ cards, season }) => {
  const [revealedStates, setRevealedStates] = React.useState<boolean[]>([]);

  const cardDelays = [400, 600, 900, 1300, 1800];

  React.useEffect(() => {
    if (cards.length > 0) {
      // Start with all cards hidden (showing back)
      setRevealedStates(new Array(cards.length).fill(false));

      // Flip them one by one after they fan in
      const timers: NodeJS.Timeout[] = [];
      cards.forEach((_, index) => {
        const delay = cardDelays[index % cardDelays.length];
        const flipDelay = delay + 800;

        const timer = setTimeout(() => {
          setRevealedStates((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });
        }, flipDelay);
        timers.push(timer);
      });

      return () => timers.forEach(clearTimeout);
    }
  }, [cards]);

  const CardComponent = season === "season2" ? FullArtCard : Card;

  const packImgMap: Record<string, string> = {
    season1: "https://img.lucky-pod.fun/pack_tcg_op_1.png",
    season2: "https://img.lucky-pod.fun/pack_tcg_op_2.png",
  };

  const packImg = packImgMap[season] || packImgMap["season1"];

  return (
    <div className="card-reveal-fan">
      <div className="pack-glow"></div>

      {/* Torn Pack Animation */}
      <div className="pack-visual-tear">
        <div className="pack-shaker">
          <div
            className="pack-half top"
            style={{ backgroundImage: `url(${packImg})` }}
          ></div>
          <div
            className="pack-half bottom"
            style={{ backgroundImage: `url(${packImg})` }}
          ></div>
        </div>
      </div>

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

          .pack-visual-tear {
            width: 150px;
            height: 225px;
          }

          .pack-visual-tear .pack-half {
            background-size: 100% 225px !important;
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

          .pack-visual-tear {
            width: 120px;
            height: 180px;
          }

          .pack-visual-tear .pack-half {
            background-size: 100% 180px !important;
          }

          .pack-glow {
            width: 300px;
            height: 300px;
          }
        }

        .pack-visual-tear {
          position: absolute;
          width: 200px;
          height: 300px;
          z-index: 50;
          pointer-events: none;
        }

        .pack-shaker {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .pack-half {
          position: absolute;
          width: 100%;
          height: 50.5%;
          overflow: hidden;
          transition: all 0.5s ease-in;
          background-size: 100% 300px;
          background-repeat: no-repeat;
        }

        .pack-half.top {
          top: 0;
          background-position: top center;
          animation: tear-off-top 0.8s cubic-bezier(0.15, 0.85, 0.35, 1.2)
            forwards;
        }

        .pack-half.bottom {
          bottom: 0;
          background-position: bottom center;
          animation: tear-off-bottom 0.8s cubic-bezier(0.15, 0.85, 0.35, 1.2)
            forwards;
        }

        @keyframes tear-off-top {
          0% {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-180px) rotate(-20deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes tear-off-bottom {
          0% {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
          100% {
            transform: translateY(180px) rotate(20deg) scale(0.8);
            opacity: 0;
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
            var(--accent-glow) 0%,
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
