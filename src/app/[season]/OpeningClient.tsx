"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { PackVisual } from "../../components/PackVisual";
import { useGacha } from "../../hooks/useGacha";
import { Card as CardType } from "../../data/types";
import { PackRipOverlay } from "../../components/unboxing/PackRipOverlay";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

export default function OpeningClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";

  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { playSFX, stopBGM } = useAudio();

  // Gacha states
  const [isOpening, setIsOpening] = useState(false);
  const [isTearing, setIsTearing] = useState(false);
  const [isTorn, setIsTorn] = useState(false);
  const [packCards, setPackCards] = useState<CardType[]>([]);
  const [isGodPackEffectActive, setIsGodPackEffectActive] = useState(false);

  // Timeouts tracker
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const resetToIdle = useCallback(() => {
    clearAllTimers();
    setIsOpening(false);
    setPackCards([]);
    setIsGodPackEffectActive(false);
    stopBGM();
  }, [clearAllTimers, stopBGM]);

  // Reset state when season changes
  useEffect(() => {
    const t = setTimeout(() => resetToIdle(), 0);
    return () => clearTimeout(t);
  }, [season, resetToIdle]);

  const startOpening = useCallback(async () => {
    if (isTearing || isOpening) return;

    // Reset card states
    setPackCards([]);
    setIsGodPackEffectActive(false);
    setIsTearing(true);

    // Play tear sound
    playSFX(AUDIO_URLS.TEAR_PACK, 0.2);

    // Wait for shake, then tear
    await new Promise((r) => setTimeout(r, 500));
    setIsTorn(true);

    // Wait for tear animation to finish
    await new Promise((r) => setTimeout(r, 600));

    const { pack, isGod } = openPack();
    setPackCards(pack);

    if (isGod) {
      setIsGodPackEffectActive(true);
    }
    
    setIsOpening(true);
    
    // Reset pack visual state so it's clean behind the overlay
    setIsTearing(false);
    setIsTorn(false);
  }, [isTearing, isOpening, playSFX, openPack]);

  const handleRipComplete = useCallback(() => {
    if (packCards.length > 0) {
      packCards.forEach((card) => addToCollection(card));
    }
  }, [packCards, addToCollection]);

  // Safe check if gacha/collection state is loaded from LocalStorage
  if (!isLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "white",
          fontFamily: "var(--font-kanit)",
          fontSize: "1.2rem",
        }}
      >
        กำลังโหลดข้อมูลระบบสุ่ม...
      </div>
    );
  }

  return (
    <div className={`main-wrapper ${isGodPackEffectActive ? "god-pack-effect" : ""}`}>
      <main>
        <section id="opening-section" className="active">
          {!isOpening && (
            <div className="pack-container">
              <PackVisual
                isTearing={isTearing}
                isTorn={isTorn}
                season={season}
                onClick={startOpening}
              />
            </div>
          )}
        </section>
      </main>

      <PackRipOverlay
        key={packCards.map(c => c.role_id).join("-") || "closed"}
        isOpen={isOpening}
        season={season}
        cards={packCards}
        onClose={resetToIdle}
        onRipComplete={handleRipComplete}
      />
    </div>
  );
}
