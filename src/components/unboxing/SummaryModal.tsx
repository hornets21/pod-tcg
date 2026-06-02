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
  godPackIndices?: number[];
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  packContents,
  packOrder,
  season,
  godPackIndices = [],
  onClose,
}) => {
  if (!isOpen) return null;

  const CardComponent = season === "season2" ? FullArtCard : Card;
  const totalCards = packOrder.reduce((sum, idx) => sum + (packContents[idx]?.length || 0), 0);

  return (
    <div className="summary-overlay" role="dialog" aria-modal="true" aria-label="สรุปผลการเปิดกล่อง">
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
                  {godPackIndices.includes(packIdx) && (
                    <span className="godpack-badge">⚡ GODPACK</span>
                  )}
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
          gap: 16px;
          padding: 24px 30px;
          overflow: hidden;
        }

        .summary-header {
          text-align: center;
          color: white;
          font-family: 'Kanit', sans-serif;
          flex-shrink: 0;
        }

        .summary-header h2 {
          font-size: 2rem;
          margin-bottom: 5px;
          color: #ffcb05;
        }

        .summary-header p {
          opacity: 0.7;
          font-size: 1.1rem;
        }

        .cards-grid-container {
          flex: 1;
          width: 100%;
          overflow-y: auto;
          padding: 16px;
          scrollbar-width: thin;
          scrollbar-color: #3b4cca transparent;
          -webkit-overflow-scrolling: touch;
        }

        .cards-grid-container::-webkit-scrollbar {
          width: 6px;
        }

        .cards-grid-container::-webkit-scrollbar-thumb {
          background: #3b4cca;
          border-radius: 10px;
        }

        .pack-row {
          margin-bottom: 24px;
        }

        .pack-label {
          color: #ffcb05;
          font-family: 'Kanit', sans-serif;
          font-size: 1.1rem;
          margin-bottom: 10px;
          padding-left: 0;
          border-bottom: 2px solid #ffcb05;
          padding-bottom: 6px;
        }

        .pack-order {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          margin-left: 8px;
        }

        .godpack-badge {
          display: inline-block;
          margin-left: 10px;
          padding: 2px 10px;
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          color: #1a1a2e;
          font-size: 0.78rem;
          font-weight: bold;
          border-radius: 12px;
          letter-spacing: 0.5px;
          animation: godpackPulse 1.5s ease-in-out infinite;
        }

        @keyframes godpackPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          justify-items: center;
        }

        .grid-card-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .grid-card-wrapper :global(.card) {
          width: 180px;
          height: 257px;
        }

        .grid-card-wrapper :global(.full-art-card-wrapper) {
          width: 180px;
          height: 257px;
          --card-scale: 0.514;
        }

        .grid-card-wrapper:hover {
          transform: scale(1.05);
          z-index: 10;
        }

        .summary-actions {
          flex-shrink: 0;
          margin-top: 8px;
          padding-bottom: 16px;
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
          .summary-container {
            gap: 10px;
            padding: 16px 12px;
          }

          .summary-header h2 {
            font-size: 1.5rem;
          }

          .cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .grid-card-wrapper :global(.card) {
            width: 140px;
            height: 200px;
          }

          .grid-card-wrapper :global(.full-art-card-wrapper) {
            width: 140px;
            height: 200px;
            --card-scale: 0.4;
          }

          .pack-label {
            font-size: 0.9rem;
          }

          .pack-row {
            margin-bottom: 16px;
          }
        }

        @media (max-width: 480px) {
          .summary-container {
            gap: 8px;
            padding: 12px 8px;
          }

          .summary-header h2 {
            font-size: 1.2rem;
          }

          .summary-header p {
            font-size: 0.9rem;
          }

          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .grid-card-wrapper :global(.card) {
            width: 130px;
            height: 186px;
          }

          .grid-card-wrapper :global(.full-art-card-wrapper) {
            width: 130px;
            height: 186px;
            --card-scale: 0.371;
          }

          .pack-label {
            font-size: 0.85rem;
            margin-bottom: 8px;
            padding-left: 8px;
          }

          .pack-order {
            font-size: 0.75rem;
          }

          .back-btn {
            padding: 10px 28px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};
