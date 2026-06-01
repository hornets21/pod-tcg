"use client";

import React from "react";
import { PackVisual } from "../PackVisual";

interface BoosterPackProps {
  index: number;
  season: string;
  isEjected: boolean;
  isOpened: boolean;
  isFadingOut?: boolean;
  onClick: () => void;
  shouldAnimate?: boolean;
}

export const BoosterPack: React.FC<BoosterPackProps> = ({
  index,
  season,
  isEjected,
  isOpened,
  isFadingOut = false,
  onClick,
  shouldAnimate = true,
}) => {
  const delay = index * 150;

  return (
    <div
      className={`booster-pack-wrapper ${isEjected ? "ejected" : ""} ${isOpened ? "opened" : ""} ${isFadingOut ? "fading-out" : ""} ${!shouldAnimate ? "no-transition" : ""}`}
      style={{
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
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .booster-pack-wrapper.ejected {
          animation: ejectPack 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay) both;
          pointer-events: auto;
        }

        .booster-pack-wrapper.no-transition.ejected {
          animation: none !important;
        }

        .booster-pack-wrapper.ejected:hover {
          filter: brightness(1.2);
          transform: scale(1.06) translateY(-4px);
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease;
        }

        .booster-pack-wrapper.opened {
          animation: none !important;
          opacity: 0.3;
          filter: grayscale(1);
          pointer-events: none;
          transform: scale(0.9);
        }

        .booster-pack-wrapper.fading-out {
          animation: none !important;
          opacity: 0 !important;
          filter: grayscale(1) blur(4px) !important;
          pointer-events: none;
          transform: scale(0.5) translateY(30px) !important;
          transition: transform 0.5s ease-in,
                      opacity 0.5s ease-in,
                      filter 0.5s ease-in !important;
        }

        @keyframes ejectPack {
          from {
            transform: scale(0) translateY(80px) rotate(-20deg);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0) rotate(0deg);
            opacity: 1;
          }
        }

        .pack-inner {
          width: 160px;
          height: 240px;
        }

        @media (max-width: 768px) {
          .pack-inner {
            width: 110px;
            height: 165px;
          }
          @keyframes ejectPack {
            from {
              transform: scale(0) translateY(50px) rotate(-20deg);
              opacity: 0;
            }
            to {
              transform: scale(1) translateY(0) rotate(0deg);
              opacity: 1;
            }
          }
        }

        @media (max-width: 480px) {
          .pack-inner {
            width: 80px;
            height: 120px;
          }
          @keyframes ejectPack {
            from {
              transform: scale(0) translateY(40px) rotate(-20deg);
              opacity: 0;
            }
            to {
              transform: scale(1) translateY(0) rotate(0deg);
              opacity: 1;
            }
          }
        }

        :global(.booster-pack-wrapper .pack-visual) {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
        }
        :global(.booster-pack-wrapper .pack-half img) {
          width: 100% !important;
          height: 240px !important;
          object-fit: cover;
          border-radius: 12px;
        }
        :global(.booster-pack-wrapper .pack-half.bottom img) {
          margin-top: -120px !important;
        }

        @media (max-width: 768px) {
          :global(.booster-pack-wrapper .pack-half img) {
            height: 165px !important;
          }
          :global(.booster-pack-wrapper .pack-half.bottom img) {
            margin-top: -82.5px !important;
          }
        }

        @media (max-width: 480px) {
          :global(.booster-pack-wrapper .pack-half img) {
            height: 120px !important;
          }
          :global(.booster-pack-wrapper .pack-half.bottom img) {
            margin-top: -60px !important;
          }
        }
      `}</style>
    </div>
  );
};
