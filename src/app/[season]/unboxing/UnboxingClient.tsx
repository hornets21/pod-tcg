"use client";

import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../../hooks/useGacha";
import { Box3D } from "../../../components/unboxing/Box3D";
import { BoosterPack } from "../../../components/unboxing/BoosterPack";
import { PackRipOverlay } from "../../../components/unboxing/PackRipOverlay";
import { SummaryModal } from "../../../components/unboxing/SummaryModal";
import { Card as CardType } from "../../../data/types";
import { useModal } from "../../../components/ModalContext";
import { GodPackDialog } from "../../../components/Modals";

export default function UnboxingClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { setSelectedDetailCard } = useModal();

  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [openedPacks, setOpenedPacks] = useState<Set<number>>(new Set());
  const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(
    null,
  );
  const [packContents, setPackContents] = useState<Record<number, CardType[]>>(
    {},
  );

  const [openedPackOrder, setOpenedPackOrder] = useState<number[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGodPackOpen, setIsGodPackOpen] = useState(false);
  const [isGodPackEffectActive, setIsGodPackEffectActive] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const TOTAL_PACKS = 6;

  const handleBoxClick = useCallback(() => {
    setIsBoxOpen(true);
    const openSound = new Audio("https://img.lucky-pod.fun/box_open.mp3");
    openSound.play().catch(() => {});
  }, []);

  const handlePackClick = useCallback(
    (index: number) => {
      if (openedPacks.has(index)) return;

      // Generate pack content
      const { pack, isGod } = openPack();
      setPackContents((prev) => ({ ...prev, [index]: pack }));
      setSelectedPackIndex(index);

      if (isGod) {
        setIsGodPackOpen(true);
        setIsGodPackEffectActive(true);
      }

      // Play rip sound
      const tearSound = new Audio("https://img.lucky-pod.fun/tear.mp3");
      tearSound.play().catch(() => {});
    },
    [openedPacks, openPack],
  );

  const handleRipComplete = useCallback(() => {
    if (selectedPackIndex !== null) {
      const cards = packContents[selectedPackIndex];
      if (cards) {
        cards.forEach((card) => addToCollection(card));
        setOpenedPacks((prev) => new Set(prev).add(selectedPackIndex));
        setOpenedPackOrder((prev) => [...prev, selectedPackIndex]);
      }
    }
  }, [selectedPackIndex, packContents, addToCollection]);

  const closeRipOverlay = useCallback(() => {
    setSelectedPackIndex(null);
  }, []);

  const handleReset = useCallback(() => {
    setIsBoxOpen(false);
    setOpenedPacks(new Set());
    setSelectedPackIndex(null);
    setPackContents({});
    setOpenedPackOrder([]);
    setIsGodPackEffectActive(false);
    setIsHistoryOpen(false);
    setIsResetDialogOpen(false);
  }, []);

  const confirmReset = useCallback(() => {
    setIsResetDialogOpen(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="loading-container">กำลังโหลดระบบ Box Unboxing...</div>
    );
  }

  const allPacksOpened = openedPacks.size === TOTAL_PACKS;
  const allOpenedCards = Object.values(packContents).flat();

  return (
    <div
      className={`unboxing-page ${isGodPackEffectActive ? "god-pack-effect" : ""}`}
    >
      <div className="unboxing-container">
        <Box3D isOpen={isBoxOpen} onClick={handleBoxClick} season={season} />

        {[...Array(TOTAL_PACKS)].map((_, i) => (
          <BoosterPack
            key={i}
            index={i}
            season={season}
            isEjected={isBoxOpen}
            isOpened={openedPacks.has(i)}
            onClick={() => handlePackClick(i)}
          />
        ))}

        {isBoxOpen && openedPacks.size > 0 && (
          <div className="unboxing-actions">
            <button
              className="summary-btn"
              onClick={() => setIsHistoryOpen(true)}
            >
              VIEW ALL PULLS ({allOpenedCards.length})
            </button>

            {allPacksOpened && (
              <button className="reset-btn" onClick={confirmReset}>
                UNBOX NEW BOX
              </button>
            )}
          </div>
        )}
      </div>

      <PackRipOverlay
        isOpen={selectedPackIndex !== null}
        season={season}
        cards={
          selectedPackIndex !== null ? packContents[selectedPackIndex] : []
        }
        onClose={closeRipOverlay}
        onRipComplete={handleRipComplete}
      />

      <SummaryModal
        isOpen={isHistoryOpen}
        packContents={packContents}
        packOrder={openedPackOrder}
        season={season}
        onClose={() => setIsHistoryOpen(false)}
      />

      <GodPackDialog
        isOpen={isGodPackOpen}
        onClose={() => {
          setIsGodPackOpen(false);
          setTimeout(() => setIsGodPackEffectActive(false), 5000);
        }}
      />

      {isResetDialogOpen && (
        <div className="reset-overlay">
          <div className="reset-dialog">
            <h3>เริ่ม Unbox กล่องใหม่?</h3>
            <p>การ์ดที่เก็บไว้จะไม่ถูกลบออกจากคอลเลกชัน</p>
            <div className="reset-dialog-actions">
              <button className="reset-confirm-btn" onClick={handleReset}>
                ยืนยัน
              </button>
              <button className="reset-cancel-btn" onClick={() => setIsResetDialogOpen(false)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .unboxing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--bg-gradient);
          position: relative;
        }

        .unboxing-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: "Kanit", sans-serif;
          font-size: 1.5rem;
        }

        .unboxing-actions {
          position: absolute;
          bottom: 50px;
          display: flex;
          gap: 20px;
          animation: fadeIn 0.5s ease forwards;
        }

        .summary-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "Kanit", sans-serif;
        }

        .summary-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .reset-btn {
          background: #ffcb05;
          color: #3b4cca;
          border: none;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
          box-shadow: 0 5px 15px rgba(255, 203, 5, 0.4);
          font-family: "Kanit", sans-serif;
        }

        .reset-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 203, 5, 0.6);
        }

        .reset-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 4000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease-out;
        }

        .reset-dialog {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          color: white;
          font-family: 'Kanit', sans-serif;
          max-width: 400px;
          width: 90%;
        }

        .reset-dialog h3 {
          font-size: 1.6rem;
          margin-bottom: 10px;
          background: linear-gradient(90deg, #ffcb05, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .reset-dialog p {
          opacity: 0.7;
          font-size: 0.95rem;
          margin-bottom: 30px;
        }

        .reset-dialog-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .reset-confirm-btn {
          background: #ffcb05;
          color: #3b4cca;
          border: none;
          padding: 12px 35px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          font-family: 'Kanit', sans-serif;
          transition: transform 0.2s ease;
        }

        .reset-confirm-btn:hover {
          transform: scale(1.05);
        }

        .reset-cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px 35px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          font-family: 'Kanit', sans-serif;
          transition: background 0.2s ease;
        }

        .reset-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}
