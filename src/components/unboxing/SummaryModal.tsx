"use client";

import React, { useMemo } from "react";
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
  const hasHighRarity = useMemo(() => {
    return Object.values(packContents).some((pack) =>
      pack.some((c) => ["LEG", "SEC", "UR"].includes(c.rarity))
    );
  }, [packContents]);

  const totalCards = useMemo(() => {
    return packOrder.reduce((sum, idx) => sum + (packContents[idx]?.length || 0), 0);
  }, [packContents, packOrder]);

  if (!isOpen) return null;

  const CardComponent = season === "season2" ? FullArtCard : Card;

  return (
    <div className={`summary-overlay ${hasHighRarity ? "premium" : ""}`} role="dialog" aria-modal="true" aria-label="สรุปผลการเปิดกล่อง">
      {hasHighRarity && <div className="premium-glow"></div>}
      
      <div className="summary-container">
        <header className="summary-header">
          <div className="summary-header-badge">BOX SUMMARY</div>
          <h2>สรุปการเปิดกล่อง</h2>
          <p>คุณได้รับทั้งหมด {totalCards} ใบ</p>
        </header>

        <div className="cards-grid-container">
          {packOrder.map((packIdx, orderIdx) => {
            const cards = packContents[packIdx] || [];
            return (
              <div key={packIdx} className="pack-row">
                <div className="pack-label">
                  <div className="pack-label-main">
                    ซองที่ {packIdx + 1} <span className="pack-order">เปิดลำดับที่ {orderIdx + 1}</span>
                  </div>
                  {godPackIndices.includes(packIdx) && (
                    <span className="godpack-badge">GODPACK</span>
                  )}
                </div>
                <div className="cards-grid">
                  {cards.map((card, idx) => {
                    const isHighRarity = ["LEG", "SEC", "UR", "SSR"].includes(card.rarity);
                    return (
                      <div 
                        key={`${card.role_id}-${idx}`} 
                        className={`grid-card-wrapper ${isHighRarity ? "high-rarity" : ""}`}
                        style={{ animationDelay: `${(orderIdx * 5 + idx) * 0.05}s` }}
                      >
                        <CardComponent card={card} isRevealed={true} enableHolo={true} />
                        {isHighRarity && <div className="card-impact-glow"></div>}
                      </div>
                    );
                  })}
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
          background: rgba(10, 8, 30, 0.98);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(20px);
          animation: fadeIn 0.4s ease-out;
          overflow: hidden;
        }

        .premium-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 203, 5, 0.15) 0%, transparent 70%);
          animation: pulseGlow 4s infinite alternate;
          pointer-events: none;
        }

        @keyframes pulseGlow {
          from { opacity: 0.3; transform: scale(1); }
          to { opacity: 0.6; transform: scale(1.2); }
        }

        .summary-container {
          width: 100%;
          max-width: 1400px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px 30px;
          position: relative;
          z-index: 10;
        }

        .summary-header {
          text-align: center;
          color: white;
          font-family: 'Kanit', sans-serif;
          animation: headerSlideDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .summary-header-badge {
          display: inline-block;
          padding: 4px 16px;
          background: rgba(255, 203, 5, 0.1);
          border: 1px solid rgba(255, 203, 5, 0.3);
          color: #ffcb05;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        @keyframes headerSlideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .summary-header h2 {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(to bottom, #fff, #ccc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cards-grid-container {
          flex: 1;
          width: 100%;
          overflow-y: auto;
          padding: 20px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .cards-grid-container::-webkit-scrollbar { display: none; }

        .pack-row {
          margin-bottom: 40px;
        }

        .pack-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pack-label-main {
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Kanit', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .pack-order {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
          font-weight: 400;
          margin-left: 12px;
        }

        .godpack-badge {
          padding: 4px 14px;
          background: linear-gradient(135deg, #ffd700, #ff8800);
          color: #000;
          font-size: 0.8rem;
          font-weight: 800;
          border-radius: 4px;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
          justify-items: center;
        }

        .grid-card-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          position: relative;
          animation: cardPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        @keyframes cardPopIn {
          from { opacity: 0; transform: scale(0.5) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .grid-card-wrapper :global(.card) {
          width: 200px;
          height: 286px;
          transition: transform 0.3s ease;
        }

        .grid-card-wrapper :global(.full-art-card-wrapper) {
          width: 200px;
          height: 286px;
          --card-scale: 0.57;
        }

        .grid-card-wrapper:hover {
          transform: scale(1.05);
          z-index: 10;
        }

        .card-impact-glow {
           position: absolute;
           inset: -10px;
           background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
           z-index: -1;
           animation: pulse 2s infinite;
        }

        .summary-actions {
          padding: 20px 0;
          animation: slideUp 0.6s ease-out 0.8s both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .back-btn {
          background: linear-gradient(135deg, #3b4cca, #2434a1);
          color: white;
          border: none;
          padding: 14px 60px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Kanit', sans-serif;
          box-shadow: 0 10px 25px rgba(59, 76, 202, 0.4);
          letter-spacing: 1px;
        }

        .back-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(59, 76, 202, 0.6);
          filter: brightness(1.1);
        }

        @media (max-width: 1024px) {
           .cards-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 768px) {
          .summary-container { padding: 20px 15px; }
          .summary-header h2 { font-size: 1.8rem; }
          .cards-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .grid-card-wrapper :global(.card) { width: 140px; height: 200px; }
          .grid-card-wrapper :global(.full-art-card-wrapper) { width: 140px; height: 200px; --card-scale: 0.4; }
        }

        @media (max-width: 480px) {
          .summary-header h2 { font-size: 1.4rem; }
          .cards-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-card-wrapper :global(.card) { width: 130px; height: 186px; }
          .grid-card-wrapper :global(.full-art-card-wrapper) { width: 130px; height: 186px; --card-scale: 0.37; }
        }
      `}</style>
    </div>
  );
};
