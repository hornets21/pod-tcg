"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../../hooks/useGacha";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Box3D } from "../../../components/unboxing/Box3D";
import { BoosterPack } from "../../../components/unboxing/BoosterPack";
import { PackRipOverlay } from "../../../components/unboxing/PackRipOverlay";
import { SummaryModal } from "../../../components/unboxing/SummaryModal";
import { Card as CardType } from "../../../data/types";
import { GodPackDialog } from "../../../components/Modals";

export default function UnboxingClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection } = useGacha(season);

  const [isBoxOpen, setIsBoxOpen, isBoxOpenLoaded] = useLocalStorage<boolean>(
    `pod_unboxing_boxOpen_${season}`,
    false,
  );
  const [openedPacksArr, setOpenedPacksArr, isOpenedPacksLoaded] =
    useLocalStorage<number[]>(`pod_unboxing_openedPacks_${season}`, []);
  const [packContents, setPackContents, isPackContentsLoaded] = useLocalStorage<
    Record<number, CardType[]>
  >(`pod_unboxing_packContents_${season}`, {});
  const [openedPackOrder, setOpenedPackOrder, isOpenedPackOrderLoaded] =
    useLocalStorage<number[]>(`pod_unboxing_openedPackOrder_${season}`, []);
  const [
    isGodPackEffectActive,
    setIsGodPackEffectActive,
    isGodPackEffectLoaded,
  ] = useLocalStorage<boolean>(`pod_unboxing_godEffect_${season}`, false);
  const [godPackIndices, setGodPackIndices, isGodPackIndicesLoaded] =
    useLocalStorage<number[]>(`pod_unboxing_godPackIndices_${season}`, []);

  const openedPacks = new Set(openedPacksArr);

  const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(
    null,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGodPackOpen, setIsGodPackOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [packsReady, setPacksReady] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
        if (isBoxOpen) {
          setPacksReady(true);
        }
      });
    });
  }, []);

  const isUnboxingLoaded =
    isBoxOpenLoaded &&
    isOpenedPacksLoaded &&
    isPackContentsLoaded &&
    isOpenedPackOrderLoaded &&
    isGodPackEffectLoaded &&
    isGodPackIndicesLoaded;

  const TOTAL_PACKS = 6;

  const handleBoxClick = useCallback(() => {
    setIsBoxOpen(true);
    setTimeout(() => setPacksReady(true), 1500);
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
        setGodPackIndices((prev) =>
          prev.includes(index) ? prev : [...prev, index],
        );
        setIsGodPackOpen(true);
        setIsGodPackEffectActive(true);
      }

      // Play rip sound sound
      const tearSound = new Audio("https://img.lucky-pod.fun/tear.mp3");
      tearSound.play().catch(() => {});
    },
    [openedPacks, openPack, setGodPackIndices],
  );

  const handleOpenAll = useCallback(() => {
    const alreadyOpened = new Set(openedPacksArr);
    const newContents = { ...packContents };
    const newOpenedPacks = [...openedPacksArr];
    const newOpenedOrder = [...openedPackOrder];
    const newGodPackIndices = [...godPackIndices];
    let hasGod = false;

    for (let i = 0; i < TOTAL_PACKS; i++) {
      if (alreadyOpened.has(i)) continue;
      const { pack, isGod } = openPack();
      newContents[i] = pack;
      newOpenedPacks.push(i);
      newOpenedOrder.push(i);
      if (isGod) {
        hasGod = true;
        if (!newGodPackIndices.includes(i)) {
          newGodPackIndices.push(i);
        }
      }
    }

    setPackContents(newContents);
    setOpenedPacksArr(newOpenedPacks);
    setOpenedPackOrder(newOpenedOrder);
    setGodPackIndices(newGodPackIndices);

    if (hasGod) {
      setIsGodPackOpen(true);
      setIsGodPackEffectActive(true);
    }

    setIsHistoryOpen(true);
  }, [openedPacksArr, openedPackOrder, packContents, godPackIndices, openPack, setGodPackIndices]);

  const handleRipComplete = useCallback(() => {
    if (selectedPackIndex !== null) {
      const cards = packContents[selectedPackIndex];
      if (cards) {
        cards.forEach((card) => addToCollection(card));
        setOpenedPacksArr((prev) => {
          if (prev.includes(selectedPackIndex)) return prev;
          return [...prev, selectedPackIndex];
        });
        setOpenedPackOrder((prev) => {
          if (prev.includes(selectedPackIndex)) return prev;
          return [...prev, selectedPackIndex];
        });
      }
    }
  }, [
    selectedPackIndex,
    packContents,
    addToCollection,
    setOpenedPacksArr,
    setOpenedPackOrder,
  ]);

  const closeRipOverlay = useCallback(() => {
    setSelectedPackIndex(null);
  }, []);

  const handleReset = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsBoxOpen(false);
      setOpenedPacksArr([]);
      setSelectedPackIndex(null);
      setPackContents({});
      setOpenedPackOrder([]);
      setGodPackIndices([]);
      setIsGodPackEffectActive(false);
      setIsHistoryOpen(false);
      setIsResetDialogOpen(false);
      setIsFadingOut(false);
      setPacksReady(false);
    }, 600);
  }, [
    setIsBoxOpen,
    setOpenedPacksArr,
    setPackContents,
    setOpenedPackOrder,
    setGodPackIndices,
    setIsGodPackEffectActive,
  ]);

  const confirmReset = useCallback(() => {
    setIsResetDialogOpen(true);
  }, []);

  if (!isLoaded || !isUnboxingLoaded) {
    return (
      <div className="loading-container">กำลังโหลดระบบ Box Unboxing...</div>
    );
  }

  const allOpenedCards = Object.values(packContents).flat();

  return (
    <div
      className={`unboxing-page ${isGodPackEffectActive ? "god-pack-effect" : ""}`}
    >
      <div className="unboxing-container">
        <div className="packs-grid">
          {packsReady && [...Array(TOTAL_PACKS)].map((_, i) => (
            <BoosterPack
              key={i}
              index={i}
              season={season}
              isEjected={packsReady}
              isOpened={openedPacks.has(i)}
              isFadingOut={isFadingOut}
              onClick={() => handlePackClick(i)}
              shouldAnimate={mounted}
            />
          ))}
        </div>

        {isBoxOpen && (
          <div className="unboxing-actions">
            {packsReady && openedPacks.size < TOTAL_PACKS && (
              <button className="open-all-btn" onClick={handleOpenAll}>
                OPEN ALL ({TOTAL_PACKS - openedPacks.size})
              </button>
            )}
            {openedPacks.size > 0 && (
              <>
                <button
                  className="summary-btn"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  VIEW ALL PULLS ({allOpenedCards.length})
                </button>
                <button className="reset-btn" onClick={confirmReset}>
                  UNBOX NEW BOX
                </button>
              </>
            )}
          </div>
        )}

        <Box3D
          isOpen={isBoxOpen}
          onClick={handleBoxClick}
          season={season}
          shouldAnimate={mounted}
        />
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
        godPackIndices={godPackIndices}
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
        <div
          className="reset-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="ยืนยันเริ่มใหม่"
        >
          <div className="reset-dialog">
            <h3>เริ่ม Unbox กล่องใหม่?</h3>
            <p>การ์ดที่เก็บไว้จะไม่ถูกลบออกจากคอลเลกชัน</p>
            <div className="reset-dialog-actions">
              <button className="reset-confirm-btn" onClick={handleReset}>
                ยืนยัน
              </button>
              <button
                className="reset-cancel-btn"
                onClick={() => setIsResetDialogOpen(false)}
              >
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
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 1rem;
          gap: 1rem;
        }

        .packs-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: nowrap;
          width: 100%;
        }

        @media (max-width: 768px) {
          .unboxing-container {
            min-height: 70vh;
            padding: 1rem 0.5rem;
            gap: 1.5rem;
          }
          .packs-grid {
            gap: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .unboxing-container {
            min-height: 60vh;
            gap: 1rem;
          }
          .packs-grid {
            gap: 0.4rem;
          }
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
          display: flex;
          gap: 20px;
          animation: fadeIn 0.5s ease forwards;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .unboxing-actions {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
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
          white-space: nowrap;
        }

        .summary-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .open-all-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          font-family: "Kanit", sans-serif;
          white-space: nowrap;
          animation: fadeIn 0.5s ease forwards;
        }

        .open-all-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        @media (max-width: 768px) {
          .summary-btn {
            padding: 10px 20px;
            font-size: 14px;
            width: 100%;
            max-width: 320px;
          }
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
          white-space: nowrap;
        }

        .reset-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 203, 5, 0.6);
        }

        @media (max-width: 768px) {
          .reset-btn {
            padding: 10px 20px;
            font-size: 14px;
            width: 100%;
            max-width: 320px;
          }
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
          font-family: "Kanit", sans-serif;
          max-width: 400px;
          width: 90%;
        }

        .reset-dialog h3 {
          font-size: 1.6rem;
          margin-bottom: 10px;
          color: #ffd700;
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
          font-family: "Kanit", sans-serif;
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
          font-family: "Kanit", sans-serif;
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
