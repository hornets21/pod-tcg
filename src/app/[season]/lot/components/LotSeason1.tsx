"use client";

import React, { useState, useMemo } from "react";
import { Card } from "../../../../components/Card";
import { Card as CardType } from "../../../../data/types";
import { ActiveLotCard } from "../../../../hooks/useGacha";

interface LotSeason1Props {
  cards: CardType[];
  lotSelection: string[];
  toggleLotCard: (id: string) => void;
  clearLotSelection: () => void;
  activeLot: ActiveLotCard[];
  startLot: () => void;
  revealLotCard: (idx: number) => void;
  handleResetConfirm: () => void;
  setSelectedDetailCard: (card: CardType) => void;
  handleStartLot: () => void;
}

export const LotSeason1: React.FC<LotSeason1Props> = ({
  cards,
  lotSelection,
  toggleLotCard,
  clearLotSelection,
  activeLot,
  revealLotCard,
  handleResetConfirm,
  setSelectedDetailCard,
  handleStartLot,
}) => {
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  const lotSelectionCards = useMemo(() => {
    if (!selectedRarity) return [];
    return cards.filter((c) => c.rarity === selectedRarity && c.isGacha === "Y");
  }, [cards, selectedRarity]);

  const totalInLot = activeLot.length;
  const openedInLot = activeLot.filter((c) => c.isOpened).length;
  const remainingInLot = totalInLot - openedInLot;

  const rarityFilters = ["LEG", "SEC", "UR", "SSR", "SR", "R", "C"];

  return (
    <section id="lot-section" className="active">
      {activeLot.length === 0 ? (
        <div id="lot-selection-view">
          <div className="collection-header">
            <h2>
              เลือกการ์ดเข้าล็อต (<span id="lot-selected-count">{lotSelection.length}</span>/10)
            </h2>
            <div className="lot-actions">
              <button
                id="start-lot-btn"
                className="btn-primary"
                style={{ padding: "0.6rem 1.6rem", fontSize: "0.95rem" }}
                onClick={handleStartLot}
                disabled={lotSelection.length === 0 || lotSelection.length > 10}
              >
                เริ่มล็อตนี้
              </button>
              <button className="btn-secondary" onClick={clearLotSelection}>
                ล้างทั้งหมด
              </button>
            </div>
            <div className="quick-select-container">
              <label htmlFor="rarity-select">เลือกระดับการ์ดเพื่อแสดงรายการ:</label>
              <select
                id="rarity-select"
                value={selectedRarity || ""}
                onChange={(e) => setSelectedRarity(e.target.value || null)}
              >
                <option value="">-- กรุณาเลือกระดับ --</option>
                {rarityFilters.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRarity === null ? (
            <div className="empty-lot-msg">
              กรุณาเลือกระดับการ์ดด้านบน เพื่อแสดงรายการการ์ด
            </div>
          ) : lotSelectionCards.length === 0 ? (
            <div className="empty-lot-msg">ไม่มีการ์ด gacha สำหรับระดับนี้</div>
          ) : (
            <div id="lot-selection-grid" className="cards-grid selection-mode">
              {lotSelectionCards.map((card) => {
                const isSelected = lotSelection.includes(card.role_id);
                return (
                  <Card
                    key={card.role_id}
                    card={card}
                    isRevealed={true}
                    isSelectionMode={true}
                    isSelected={isSelected}
                    enableHolo={false}
                    onClick={() => toggleLotCard(card.role_id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div id="lot-opening-view">
          <div className="collection-header">
            <h2>
              เปิดการ์ดจากล็อต (<span id="lot-remaining-count">{remainingInLot}</span>/
              <span id="lot-total-count">{totalInLot}</span>)
            </h2>
            <button className="btn-secondary" onClick={handleResetConfirm}>
              จบล็อต / รีเซ็ต
            </button>
          </div>
          <div className="lot-opening-content">
            <div id="lot-cards-display" className="cards-grid">
              {activeLot.map((card, idx) => (
                <Card
                  key={`${card.role_id}-${idx}`}
                  card={card}
                  isRevealed={card.isOpened}
                  enableHolo={card.isOpened}
                  onClick={() => {
                    if (!card.isOpened) {
                      revealLotCard(idx);
                    } else {
                      setSelectedDetailCard(card);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
