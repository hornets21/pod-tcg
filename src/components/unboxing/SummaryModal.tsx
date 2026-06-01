"use client";

import React from "react";
import { Card as CardType } from "../../data/types";
import { Card } from "../Card";
import { FullArtCard } from "../FullArtCard";

interface SummaryModalProps {
  isOpen: boolean;
  packContents: Record<number, CardType[]>;
  packOrder: number[];
  season: string;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  packContents,
  packOrder,
  season,
  onClose,
}) => {
  if (!isOpen) return null;

  const CardComponent = season === "season2" ? FullArtCard : Card;
  const totalCards = packOrder.reduce((sum, idx) => sum + (packContents[idx]?.length || 0), 0);

  return (
    <div className="summary-overlay">
      <div className="summary-container">
        <header className="summary-header">
          <h2>สรุปการเปิดกล่อง (BOX SUMMARY)</h2>
          <p>คุณได้รับทั้งหมด {totalCards} ใบ</p>
        </header>

        <div className="cards-grid-container">
          {packOrder.map((packIdx, orderIdx) => {
            const cards = packContents[packIdx] || [];
            return (
              <div key={packIdx} className="pack-row">
                <div className="pack-label">
                  ซองที่ {packIdx + 1} <span className="pack-order">เปิดลำดับที่ {orderIdx + 1}</span>
                </div>
              <div className="cards-grid">
                  {cards.map((card, idx) => (
                    <div key={`${card.role_id}-${idx}`} className="grid-card-wrapper">
                      <CardComponent card={card} isRevealed={true} enableHolo={true} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="summary-actions">
          <button className="back-btn" onClick={onClose}>
            BACK TO BOX
          </button>
        </div>
      </div>

      <style jsx>{`
        .summary-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(15px);
          animation: fadeIn 0.3s ease-out;
        }

        .summary-container {
          width: 100%;
          max-width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 30px 40px;
        }

        .summary-header {
          text-align: center;
          color: white;
          font-family: 'Kanit', sans-serif;
        }

        .summary-header h2 {
          font-size: 2rem;
          margin-bottom: 5px;
          background: linear-gradient(90deg, #ffcb05, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .summary-header p {
          opacity: 0.7;
          font-size: 1.1rem;
        }

        .cards-grid-container {
          flex: 1;
          width: 100%;
          overflow-y: auto;
          padding: 20px;
          scrollbar-width: thin;
          scrollbar-color: #3b4cca transparent;
        }

        .cards-grid-container::-webkit-scrollbar {
          width: 6px;
        }

        .cards-grid-container::-webkit-scrollbar-thumb {
          background: #3b4cca;
          border-radius: 10px;
        }

        .pack-row {
          margin-bottom: 30px;
        }

        .pack-label {
          color: #ffcb05;
          font-family: 'Kanit', sans-serif;
          font-size: 1.1rem;
          margin-bottom: 10px;
          padding-left: 10px;
          border-left: 3px solid #ffcb05;
        }

        .pack-order {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          margin-left: 8px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          justify-items: center;
        }

        .grid-card-wrapper {
          width: 100%;
          max-width: 200px;
          transition: transform 0.3s ease;
        }

        .grid-card-wrapper:hover {
          transform: scale(1.05);
          z-index: 10;
        }

        .summary-actions {
          margin-top: 20px;
        }

        .back-btn {
          background: #3b4cca;
          color: white;
          border: none;
          padding: 12px 40px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          font-family: 'Kanit', sans-serif;
          box-shadow: 0 4px 15px rgba(59, 76, 202, 0.4);
        }

        .back-btn:hover {
          transform: scale(1.05);
          background: #4b5cda;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .grid-card-wrapper {
            max-width: none;
          }
          .pack-label {
            font-size: 0.9rem;
          }
          .summary-header h2 {
            font-size: 1.5rem;
          }
          .summary-container {
            padding: 20px 16px;
          }
        }

        @media (max-width: 480px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .summary-header h2 {
            font-size: 1.2rem;
          }
          .summary-header p {
            font-size: 0.9rem;
          }
          .summary-container {
            padding: 16px 12px;
          }
        }
      `}</style>
    </div>
  );
};
