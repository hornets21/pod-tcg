"use client";

import React from "react";
import { PackVisual } from "../PackVisual";

interface BoosterPackProps {
  index: number;
  season: string;
  isEjected: boolean;
  isOpened: boolean;
  onClick: () => void;
}

export const BoosterPack: React.FC<BoosterPackProps> = ({
  index,
  season,
  isEjected,
  isOpened,
  onClick,
}) => {
  // Define positions for 6 packs (balanced fan)
  const positions = [
    { x: -350, y: -100, rotate: -15 },
    { x: -210, y: -190, rotate: -9 },
    { x: -70, y: -230, rotate: -3 },
    { x: 70, y: -230, rotate: 3 },
    { x: 210, y: -190, rotate: 9 },
    { x: 350, y: -100, rotate: 15 },
  ];

  const pos = positions[index % positions.length];
  const delay = 500 + index * 150;

  return (
    <div
      className={`booster-pack-wrapper ${isEjected ? "ejected" : ""} ${isOpened ? "opened" : ""}`}
      style={{
        "--target-x": `${pos.x}px`,
        "--target-y": `${pos.y}px`,
        "--target-rotate": `${pos.rotate}deg`,
        "--delay": `${delay}ms`,
      } as React.CSSProperties}
      onClick={isEjected && !isOpened ? onClick : undefined}
    >
      <div className="pack-inner">
        <PackVisual
          isTearing={false}
          isTorn={false}
          season={season}
          onClick={() => {}}
        />
      </div>

      <style jsx>{`
        .booster-pack-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.2) translateZ(20px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.4s ease,
                      filter 0.3s ease;
          z-index: 100;
        }

        .booster-pack-wrapper.ejected {
          opacity: 1;
          pointer-events: auto;
          transform: translate(calc(-50% + var(--target-x)), calc(-50% + var(--target-y))) 
                     rotate(var(--target-rotate)) 
                     scale(1);
          transition-delay: var(--delay);
        }

        .booster-pack-wrapper.ejected:hover {
          filter: brightness(1.2);
          transform: translate(calc(-50% + var(--target-x)), calc(-50% + var(--target-y) - 10px)) 
                     rotate(var(--target-rotate)) 
                     scale(1.05);
          cursor: pointer;
        }

        .booster-pack-wrapper.opened {
          opacity: 0.3;
          filter: grayscale(1);
          pointer-events: none;
          transform: translate(calc(-50% + var(--target-x)), calc(-50% + var(--target-y))) 
                     rotate(var(--target-rotate)) 
                     scale(0.9) !important;
        }

        .pack-inner {
          width: 150px;
          height: 225px;
        }

        /* Adjusting the existing PackVisual size within this context */
        :global(.booster-pack-wrapper .pack-visual) {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
        }
        :global(.booster-pack-wrapper .pack-half img) {
          height: 225px !important;
        }
        :global(.booster-pack-wrapper .pack-half.bottom img) {
          margin-top: -112.5px !important;
        }
      `}</style>
    </div>
  );
};
