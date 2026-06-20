"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../../hooks/useGacha";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";
import { ThreeScene } from "../../../components/three/ThreeScene";
import { Box3DThree } from "../../../components/three/Box3DThree";
import { BoosterPackThree } from "../../../components/three/BoosterPackThree";
import { PackRipOverlay3D } from "../../../components/unboxing/PackRipOverlay3D";
import { SummaryModal } from "../../../components/unboxing/SummaryModal";
import { Card as CardType } from "../../../data/types";

export default function UnboxingClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { playSFX, stopAllSFX, startBGM } = useAudio();

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
  const [tempSelectedPackIndex, setTempSelectedPackIndex] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [packsReady, setPacksReady] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 0);
    timersRef.current.push(t1);
    if (isBoxOpen) {
      const t2 = setTimeout(() => setPacksReady(true), 100);
      timersRef.current.push(t2);
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
    setTimeout(() => setPacksReady(true), 600);
  }, [playSFX, setIsBoxOpen]);

  const handlePackClick = useCallback(
    (index: number) => {
      if (openedPacks.has(index) || tempSelectedPackIndex !== null || selectedPackIndex !== null) return;
      
      setTempSelectedPackIndex(index);
      playSFX(AUDIO_URLS.TEAR_PACK, 0.2);
      startBGM(AUDIO_URLS.BGM_GOD, 0.02);

      const { pack, isGod } = openPack();
      setPackContents((prev) => ({ ...prev, [index]: pack }));
      if (isGod) {
        setGodPackIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
        setIsGodPackEffectActive(true);
      }

      const timer = setTimeout(() => {
        setSelectedPackIndex(index);
      }, 350);
      timersRef.current.push(timer);
    },
    [openedPacks, openPack, setGodPackIndices, setIsGodPackEffectActive, playSFX, setPackContents, startBGM, tempSelectedPackIndex, selectedPackIndex],
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
      pack.forEach((card) => addToCollection(card));
      if (isGod) {
        hasGod = true;
        if (!newGodPackIndices.includes(i)) newGodPackIndices.push(i);
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
    setIsHistoryOpen(true);
    if (hasGod) setIsGodPackEffectActive(true);
  }, [
    openedPacks, openedPacksArr, openedPackOrder, packContents, godPackIndices,
    openPack, setOpenedPacksArr, setOpenedPackOrder, setPackContents,
    setGodPackIndices, addToCollection, setIsGodPackEffectActive,
  ]);

  const handleRipComplete = useCallback(() => {
    if (selectedPackIndex === null) return;
    const cards = packContents[selectedPackIndex];
    if (cards) {
      cards.forEach((card) => addToCollection(card));
      setOpenedPacksArr((prev) =>
        prev.includes(selectedPackIndex) ? prev : [...prev, selectedPackIndex]
      );
      setOpenedPackOrder((prev) =>
        prev.includes(selectedPackIndex) ? prev : [...prev, selectedPackIndex]
      );
    }
  }, [selectedPackIndex, packContents, addToCollection, setOpenedPacksArr, setOpenedPackOrder]);

  const closeRipOverlay = useCallback(() => {
    setSelectedPackIndex(null);
    setTempSelectedPackIndex(null);
  }, []);

  const handleReset = useCallback(() => {
    setIsFadingOut(true);
    stopAllSFX();
    const t = setTimeout(() => {
      setIsBoxOpen(false);
      setOpenedPacksArr([]);
      setSelectedPackIndex(null);
      setTempSelectedPackIndex(null);
      setPackContents({});
      setOpenedPackOrder([]);
      setGodPackIndices([]);
      setIsGodPackEffectActive(false);
      setIsHistoryOpen(false);
      setIsResetDialogOpen(false);
      setIsFadingOut(false);
      setPacksReady(false);
      clearAllTimers();
    }, 600);
    timersRef.current.push(t);
  }, [
    setIsBoxOpen, setOpenedPacksArr, setPackContents, setOpenedPackOrder,
    setGodPackIndices, setIsGodPackEffectActive, clearAllTimers, stopAllSFX,
  ]);

  if (!isLoaded || !isUnboxingLoaded) {
    return (
      <div className="loading-container-3d">
        <div className="loading-spinner" />
        <p>กำลังโหลดระบบ Box Unboxing...</p>
      </div>
    );
  }

  return (
    <div className={`unboxing-3d-page ${isGodPackEffectActive ? "god-pack-effect" : ""}`}>


      {/* ─── THREE.JS SCENE ─── */}
      <ThreeScene cameraPosition={[0, 0.5, 7.5]} fogColor="#07060a">
        {/* Box — visible when not yet open */}
        {!isBoxOpen && (
          <Suspense fallback={null}>
            <Box3DThree
              isOpen={isBoxOpen}
              onClick={handleBoxClick}
              season={season}
              shouldAnimate={mounted}
            />
          </Suspense>
        )}

        {/* Packs — visible once box is open */}
        {packsReady && (
          <Suspense fallback={null}>
            {[...Array(TOTAL_PACKS)].map((_, i) => (
              <BoosterPackThree
                key={i}
                index={i}
                season={season}
                isEjected={packsReady}
                isOpened={openedPacks.has(i)}
                isFadingOut={isFadingOut}
                isZooming={tempSelectedPackIndex === i}
                onClick={() => handlePackClick(i)}
                shouldAnimate={mounted}
              />
            ))}
          </Suspense>
        )}
      </ThreeScene>

      {/* ─── HUD OVERLAY ─── */}
      <div className="unboxing-hud">
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

        {/* Click hint for box */}
        {!isBoxOpen && (
          <div className="box-hint">
            <span>คลิกกล่องเพื่อเปิด</span>
          </div>
        )}
      </div>

      {/* ─── PACK RIP 3D OVERLAY ─── */}
      <PackRipOverlay3D
        key={selectedPackIndex ?? "closed"}
        isOpen={selectedPackIndex !== null}
        season={season}
        cards={selectedPackIndex !== null ? (packContents[selectedPackIndex] || []) : []}
        onClose={closeRipOverlay}
        onRipComplete={handleRipComplete}
        mode="box"
      />

      {/* ─── SUMMARY MODAL ─── */}
      <SummaryModal
        isOpen={isHistoryOpen}
        packContents={packContents}
        packOrder={openedPackOrder}
        season={season}
        godPackIndices={godPackIndices}
        onClose={() => setIsHistoryOpen(false)}
      />



      {/* ─── RESET DIALOG ─── */}
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
        .unboxing-3d-page {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
        }

        .loading-container-3d {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: "Kanit", sans-serif;
          font-size: 1.2rem;
          gap: 1.5rem;
          background: #06060f;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #6688ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .unboxing-hud {
          position: absolute;
          bottom: 14%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          pointer-events: none;
        }

        .unboxing-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          pointer-events: auto;
          animation: fadeUpIn 0.6s ease forwards;
        }

        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .box-hint {
          pointer-events: none;
          color: rgba(255,255,255,0.45);
          font-family: "Kanit", sans-serif;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          animation: pulseHint 2s ease-in-out infinite;
        }

        @keyframes pulseHint {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        .summary-btn, .reset-btn, .open-all-btn {
          padding: 12px 28px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: "Kanit", sans-serif;
          white-space: nowrap;
          backdrop-filter: blur(12px);
          letter-spacing: 0.05em;
        }

        .open-all-btn {
          background: linear-gradient(135deg, #0099ff, #6644ff);
          color: white;
          border: 1px solid rgba(100, 150, 255, 0.4);
          box-shadow: 0 4px 20px rgba(80, 120, 255, 0.5);
        }
        .open-all-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 32px rgba(80, 120, 255, 0.7);
        }

        .summary-btn {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .summary-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .reset-btn {
          background: rgba(255, 60, 80, 0.12);
          color: #ff6070;
          border: 1px solid rgba(255, 60, 80, 0.3);
        }
        .reset-btn:hover {
          background: rgba(255, 60, 80, 0.25);
          transform: translateY(-2px);
        }

        .reset-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 4000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          animation: fadeIn 0.3s ease-out;
        }

        .reset-dialog {
          background: rgba(12, 10, 35, 0.95);
          border: 1px solid rgba(100, 120, 255, 0.2);
          border-radius: 24px;
          padding: 3rem;
          text-align: center;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 80, 0.6), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .reset-dialog h3 {
          font-size: 1.8rem;
          margin-bottom: 0.8rem;
          color: #fff;
          font-family: "Kanit", sans-serif;
        }

        .reset-dialog p {
          opacity: 0.6;
          margin-bottom: 2rem;
          font-family: "Kanit", sans-serif;
        }

        .reset-dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .reset-confirm-btn {
          background: linear-gradient(135deg, #ff3355, #ff6644);
          color: white;
          border: none;
          padding: 12px 40px;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
          font-family: "Kanit", sans-serif;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(255,50,80,0.4);
        }

        .reset-confirm-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255,50,80,0.6);
        }

        .reset-cancel-btn {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 12px 40px;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
          font-family: "Kanit", sans-serif;
          transition: all 0.2s;
        }

        .reset-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .unboxing-actions {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          .summary-btn, .reset-btn, .open-all-btn {
            min-width: 220px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
