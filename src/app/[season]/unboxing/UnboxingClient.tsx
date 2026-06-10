"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../../hooks/useGacha";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";
import { Box3D } from "../../../components/unboxing/Box3D";
import { BoosterPack } from "../../../components/unboxing/BoosterPack";
import { PackRipOverlay } from "../../../components/unboxing/PackRipOverlay";
import { SummaryModal } from "../../../components/unboxing/SummaryModal";
import { RandomCutscene } from "../../../components/unboxing/RandomCutscene";
import { MuteButton } from "../../../components/unboxing/MuteButton";
import { Card as CardType } from "../../../data/types";

export default function UnboxingClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { playSFX } = useAudio();

  // --- Persistent States ---
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

  // --- UI States ---
  const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [packsReady, setPacksReady] = useState(false);
  const [cutsceneCards, setCutsceneCards] = useState<CardType[] | null>(null);

  // Timeouts tracker
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (isBoxOpen) {
      const t = setTimeout(() => setPacksReady(true), 100);
      timersRef.current.push(t);
    }
  }, [isBoxOpen]);

  const isUnboxingLoaded =
    isBoxOpenLoaded &&
    isOpenedPacksLoaded &&
    isPackContentsLoaded &&
    isOpenedPackOrderLoaded &&
    isGodPackEffectLoaded &&
    isGodPackIndicesLoaded;

  const TOTAL_PACKS = 6;
  const openedPacks = useMemo(() => new Set(openedPacksArr), [openedPacksArr]);
  const allOpenedCards = useMemo(() => Object.values(packContents).flat(), [packContents]);

  // --- Actions ---
  const handleBoxClick = useCallback(() => {
    setIsBoxOpen(true);
    playSFX(AUDIO_URLS.BOX_OPEN, 0.15);
  }, [playSFX, setIsBoxOpen]);

  const handlePackClick = useCallback(
    (index: number) => {
      if (openedPacks.has(index)) return;

      const { pack, isGod } = openPack();
      
      // Update local content immediately
      setPackContents((prev) => ({ ...prev, [index]: pack }));
      setSelectedPackIndex(index);

      if (isGod) {
        setGodPackIndices((prev) => prev.includes(index) ? prev : [...prev, index]);
        setIsGodPackEffectActive(true);
      }

      playSFX(AUDIO_URLS.TEAR_PACK, 0.2);
    },
    [openedPacks, openPack, setGodPackIndices, setIsGodPackEffectActive, playSFX, setPackContents],
  );

  const handleOpenAll = useCallback(() => {
    const newContents = { ...packContents };
    const newOpenedPacks = [...openedPacksArr];
    const newOpenedOrder = [...openedPackOrder];
    const newGodPackIndices = [...godPackIndices];
    let hasGod = false;
    const allNewCards: CardType[] = [];

    for (let i = 0; i < TOTAL_PACKS; i++) {
      if (openedPacks.has(i)) continue;
      const { pack, isGod } = openPack();
      newContents[i] = pack;
      newOpenedPacks.push(i);
      newOpenedOrder.push(i);
      allNewCards.push(...pack);
      
      pack.forEach(card => addToCollection(card));

      if (isGod) {
        hasGod = true;
        if (!newGodPackIndices.includes(i)) {
          newGodPackIndices.push(i);
        }
      }
    }

    if (allNewCards.length === 0) {
      setIsHistoryOpen(true);
      return;
    }

    setPackContents(newContents);
    setOpenedPacksArr(newOpenedPacks);
    setOpenedPackOrder(newOpenedOrder);
    setGodPackIndices(newGodPackIndices);
    setCutsceneCards(allNewCards);
    
    if (hasGod) {
      setIsGodPackEffectActive(true);
    }
  }, [openedPacks, openedPacksArr, openedPackOrder, packContents, godPackIndices, openPack, setOpenedPacksArr, setOpenedPackOrder, setPackContents, setGodPackIndices, addToCollection, setIsGodPackEffectActive]);

  const handleCutsceneComplete = useCallback(() => {
    setCutsceneCards(null);
    setIsHistoryOpen(true);
  }, []);

  const handleRipComplete = useCallback(() => {
    if (selectedPackIndex === null) return;
    
    const cards = packContents[selectedPackIndex];
    if (cards) {
      cards.forEach((card) => addToCollection(card));
      setOpenedPacksArr((prev) => prev.includes(selectedPackIndex) ? prev : [...prev, selectedPackIndex]);
      setOpenedPackOrder((prev) => prev.includes(selectedPackIndex) ? prev : [...prev, selectedPackIndex]);
    }
  }, [selectedPackIndex, packContents, addToCollection, setOpenedPacksArr, setOpenedPackOrder]);

  const closeRipOverlay = useCallback(() => {
    setSelectedPackIndex(null);
  }, []);

  const handleReset = useCallback(() => {
    setIsFadingOut(true);
    const t = setTimeout(() => {
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
      setCutsceneCards(null);
      clearAllTimers();
    }, 600);
    timersRef.current.push(t);
  }, [setIsBoxOpen, setOpenedPacksArr, setPackContents, setOpenedPackOrder, setGodPackIndices, setIsGodPackEffectActive, clearAllTimers]);

  if (!isLoaded || !isUnboxingLoaded) {
    return (
      <div className="loading-container">กำลังโหลดระบบ Box Unboxing...</div>
    );
  }

  return (
    <div className={`unboxing-page ${isGodPackEffectActive ? "god-pack-effect" : ""}`}>
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
                <button className="summary-btn" onClick={() => setIsHistoryOpen(true)}>
                  VIEW ALL PULLS ({allOpenedCards.length})
                </button>
                <button className="reset-btn" onClick={() => setIsResetDialogOpen(true)}>
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
        key={selectedPackIndex ?? "closed"}
        isOpen={selectedPackIndex !== null}
        season={season}
        cards={selectedPackIndex !== null ? (packContents[selectedPackIndex] || []) : []}
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

      {cutsceneCards && (
        <>
          <MuteButton />
          <RandomCutscene
            cards={cutsceneCards}
            onComplete={handleCutsceneComplete}
          />
        </>
      )}

      {isResetDialogOpen && (
        <div className="reset-overlay" role="dialog" aria-modal="true">
          <div className="reset-dialog">
            <h3>เริ่ม Unbox กล่องใหม่?</h3>
            <p>การ์ดที่เก็บไว้จะไม่ถูกลบออกจากคอลเลกชัน</p>
            <div className="reset-dialog-actions">
              <button className="reset-confirm-btn" onClick={handleReset}>ยืนยัน</button>
              <button className="reset-cancel-btn" onClick={() => setIsResetDialogOpen(false)}>ยกเลิก</button>
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
          background: var(--bg-gradient);
          position: relative;
          overflow: hidden;
        }

        .unboxing-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 2rem;
          gap: 2rem;
        }

        .packs-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          flex-wrap: nowrap;
          width: 100%;
          z-index: 10;
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
          z-index: 20;
        }

        .summary-btn, .reset-btn, .open-all-btn {
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "Kanit", sans-serif;
          white-space: nowrap;
        }

        .summary-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }
        .summary-btn:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }

        .open-all-btn {
          background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          color: white;
          border: none;
          box-shadow: 0 5px 15px rgba(0, 210, 255, 0.4);
        }
        .open-all-btn:hover { transform: scale(1.05); box-shadow: 0 8px 25px rgba(0, 210, 255, 0.6); }

        .reset-btn {
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.4);
        }
        .reset-btn:hover { background: rgba(255, 71, 87, 0.4); transform: translateY(-2px); }

        .reset-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 4000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          animation: fadeIn 0.3s ease-out;
        }

        .reset-dialog {
          background: rgba(15, 12, 41, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          text-align: center;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .reset-dialog h3 { font-size: 1.8rem; margin-bottom: 1rem; color: #fff; }
        .reset-dialog p { opacity: 0.7; margin-bottom: 2rem; }
        .reset-dialog-actions { display: flex; gap: 1rem; justify-content: center; }

        .reset-confirm-btn {
          background: #ff4757;
          color: white;
          border: none;
          padding: 12px 40px;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
        }

        .reset-cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px 40px;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .unboxing-container { padding: 1rem; gap: 1.5rem; }
          .packs-grid { gap: 0.5rem; }
          .unboxing-actions { flex-direction: column; width: 100%; max-width: 300px; }
          .summary-btn, .reset-btn, .open-all-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
