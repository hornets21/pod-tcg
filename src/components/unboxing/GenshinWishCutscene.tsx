"use client";

import React, { useEffect, useState } from "react";
import { Card as CardType } from "../../data/types";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface GenshinWishCutsceneProps {
  cards: CardType[];
  onComplete: () => void;
}

export const GenshinWishCutscene: React.FC<GenshinWishCutsceneProps> = ({
  cards,
  onComplete,
}) => {
  const { playSFX } = useAudio();
  const [isImpacted, setIsImpacted] = useState(false);

  // Determine highest rarity color
  const getHighestRarityColor = () => {
    const rarities = cards.map((c) => c.rarity);
    const isSpecial = cards.some((c) => c.role_id === "1356458345812459611");

    if (isSpecial || rarities.some((r) => ["LEG", "SEC", "UR", "SSR"].includes(r))) return "gold";
    if (rarities.some((r) => r === "SR")) return "purple";
    return "blue";
  };

  const color = getHighestRarityColor();

  useEffect(() => {
    // Play meteor sound
    playSFX(AUDIO_URLS.METEOR_FLYBY, 0.15);

    // Impact timing (matches animation duration)
    const impactTimer = setTimeout(() => {
      setIsImpacted(true);
      playSFX(AUDIO_URLS.METEOR_IMPACT, 0.2);
    }, 1800);

    // Complete timing
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, playSFX]);

  return (
    <div className={`wish-cutscene-overlay ${color}`}>
      {!isImpacted && (
        <div className="meteor-container">
          <div className="meteor">
            <div className="meteor-head"></div>
            <div className="meteor-tail"></div>
          </div>
        </div>
      )}

      {isImpacted && <div className="impact-flash"></div>}

      <style jsx>{`
        .wish-cutscene-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .meteor-container {
          position: absolute;
          top: -20%;
          right: -20%;
          width: 150%;
          height: 150%;
          transform: rotate(-35deg);
        }

        .meteor {
          position: absolute;
          top: 0;
          right: 0;
          width: 10px;
          height: 10px;
          animation: meteor-move 2s linear forwards;
        }

        .meteor-head {
          width: 30px;
          height: 30px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 40px 10px #fff;
          position: relative;
          z-index: 2;
        }

        .meteor-tail {
          position: absolute;
          top: 50%;
          right: 0;
          width: 800px;
          height: 4px;
          transform: translateY(-50%);
          background: linear-gradient(to left, rgba(255, 255, 255, 0.8), transparent);
          z-index: 1;
        }

        /* Color Overrides */
        .gold .meteor-head { box-shadow: 0 0 60px 20px #ffd700; }
        .gold .meteor-tail { background: linear-gradient(to left, #ffd700, transparent); }
        
        .purple .meteor-head { box-shadow: 0 0 50px 15px #a335ee; }
        .purple .meteor-tail { background: linear-gradient(to left, #a335ee, transparent); }
        
        .blue .meteor-head { box-shadow: 0 0 40px 10px #0070dd; }
        .blue .meteor-tail { background: linear-gradient(to left, #0070dd, transparent); }

        @keyframes meteor-move {
          0% { transform: translate(0, 0); }
          80% { transform: translate(-120vw, 120vh); }
          100% { transform: translate(-150vw, 150vh); }
        }

        .impact-flash {
          position: absolute;
          inset: 0;
          background: #fff;
          animation: flash-fade 1s ease-out forwards;
          z-index: 10;
        }

        .gold .impact-flash { background: radial-gradient(circle, #fff 0%, #ffd700 100%); }
        .purple .impact-flash { background: radial-gradient(circle, #fff 0%, #a335ee 100%); }
        .blue .impact-flash { background: radial-gradient(circle, #fff 0%, #0070dd 100%); }

        @keyframes flash-fade {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
