"use client";

import React, { useRef, useState } from "react";
import { Card as CardType } from "../data/types";

interface CardProps {
  card: CardType;
  isRevealed?: boolean;
  onClick?: () => void;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  enableHolo?: boolean;
  isOwned?: boolean;
}

export const getRarityStars = (rarity: string): string => {
  const stars: Record<string, string> = {
    'C': '★',
    'R': '★★',
    'SR': '★★★',
    'SSR': '★★★★',
    'UR': '★★★★★',
    'SEC': '★★★★★★',
    'LEG': '★★★★★★★'
  };
  return stars[rarity] || '★';
};

export const Card: React.FC<CardProps> = ({
  card,
  isRevealed = true,
  onClick,
  className = "",
  isSelectionMode = false,
  isSelected = false,
  enableHolo = true,
  isOwned = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mx, setMx] = useState(0.5);
  const [my, setMy] = useState(0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHolo || !cardRef.current || !isRevealed) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMx(x);
    setMy(y);
  };

  const handleMouseLeave = () => {
    if (!enableHolo) return;
    setMx(0.5);
    setMy(0.5);
  };

  const rarityClass = card.rarity.toLowerCase();

  return (
    <div
      ref={cardRef}
      className={`card ${rarityClass} ${isRevealed ? "revealed" : ""} ${
        isSelectionMode ? "selection-mode" : ""
      } ${isSelected ? "selected" : ""} ${!isOwned ? "not-owned" : ""} ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        "--mx": mx,
        "--my": my,
      } as React.CSSProperties}
    >
      {enableHolo && (
        <>
          <div className="card-gloss"></div>
          <div className="card-holo"></div>
        </>
      )}
      {!isOwned && <div className="not-owned-badge">ยังไม่มี</div>}
      <div className="card-inner">
        {/* Card Back */}
        <div className="card-back"></div>

        {/* Card Front */}
        <div className="card-front">
          <div className="card-content">
            <div className="card-header">
              <span className="name">{card.name}</span>
            </div>
            <div className="image-box">
              <img
                src={card.image}
                alt={card.name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/180x270?text=Image+Not+Found";
                }}
              />
            </div>
            <div className="card-body">
              <div className="ability">
                <strong>ความสามารถ</strong>
                <p>{card.ability || "ไม่มีความสามารถพิเศษ"}</p>
              </div>
            </div>
            <div className="card-footer">
              <span className="rarity-symbol">{getRarityStars(card.rarity)}</span>
              <span className="rarity-text">{card.rarity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
