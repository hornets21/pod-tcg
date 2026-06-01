"use client";

import React, { useEffect } from "react";
import { Card as CardType } from "../../data/types";
import { CardReveal } from "./CardReveal";

interface PackRipOverlayProps {
  isOpen: boolean;
  season: string;
  cards: CardType[];
  onClose: () => void;
  onRipComplete: () => void;
}

export const PackRipOverlay: React.FC<PackRipOverlayProps> = ({
  isOpen,
  season,
  cards,
  onClose,
  onRipComplete,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onRipComplete();
      }, 100);
      return () => clearTimeout(timer);
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="rip-overlay" role="dialog" aria-modal="true" aria-label="แสดงผลการเปิดซอง">
      <div className="revealed-container">
        <CardReveal cards={cards} season={season} />
        
        <div className="overlay-actions">
          <button className="back-btn" onClick={onClose}>
            BACK TO BOX
          </button>
        </div>
      </div>

      <style jsx>{`
        .rip-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .revealed-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 1rem 0;
        }

        .overlay-actions {
          position: relative;
          z-index: 20;
          flex-shrink: 0;
          margin-top: 30px;
          padding-bottom: 2rem;
          animation: fadeIn 0.5s ease 1s forwards;
          opacity: 0;
        }

        .back-btn {
          background: #3b4cca;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          font-family: 'Kanit', sans-serif;
          box-shadow: 0 4px 15px rgba(59, 76, 202, 0.4);
        }

        .back-btn:hover {
          transform: scale(1.05);
          background: #4b5cda;
        }

        @media (max-width: 768px) {
          .revealed-container {
            justify-content: flex-start;
            padding-top: 1.5rem;
          }
          .overlay-actions {
            margin-top: 16px;
            padding-bottom: 2rem;
          }
          .back-btn {
            padding: 10px 24px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .revealed-container {
            padding-top: 1rem;
          }
          .overlay-actions {
            margin-top: 12px;
            padding-bottom: 2rem;
          }
          .back-btn {
            padding: 10px 24px;
            font-size: 13px;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
