"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../hooks/useGacha";
import { Card as CardType } from "../../data/types";
import { PackRipOverlay3D } from "../../components/unboxing/PackRipOverlay3D";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";
import { ThreeScene } from "../../components/three/ThreeScene";
import { PackSingleThree } from "../../components/three/PackSingleThree";

export default function OpeningClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { playSFX, stopBGM } = useAudio();

  const [isOpening, setIsOpening] = useState(false);
  const [packCards, setPackCards] = useState<CardType[]>([]);
  const [isGodPackEffectActive, setIsGodPackEffectActive] = useState(false);
  const [packClicked, setPackClicked] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const resetToIdle = useCallback(() => {
    clearAllTimers();
    setIsOpening(false);
    setPackCards([]);
    setIsGodPackEffectActive(false);
    setPackClicked(false);
    stopBGM();
  }, [clearAllTimers, stopBGM]);

  useEffect(() => {
    const t = setTimeout(() => resetToIdle(), 0);
    return () => clearTimeout(t);
  }, [season, resetToIdle]);

  const startOpening = useCallback(() => {
    if (packClicked || isOpening) return;
    setPackClicked(true);
    playSFX(AUDIO_URLS.TEAR_PACK, 0.2);

    const t = setTimeout(() => {
      const { pack, isGod } = openPack();
      setPackCards(pack);
      if (isGod) setIsGodPackEffectActive(true);
      setIsOpening(true);
    }, 700);
    timersRef.current.push(t);
  }, [packClicked, isOpening, playSFX, openPack]);

  const handleRipComplete = useCallback(() => {
    packCards.forEach((card) => addToCollection(card));
  }, [packCards, addToCollection]);

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
    <div
      className={`opening-3d-page ${isGodPackEffectActive ? "god-pack-effect" : ""}`}
    >
      {/* 3D Scene with single pack */}
      <ThreeScene cameraPosition={[0, 0, 6]}>
        {!isOpening && (
          <Suspense fallback={null}>
            <PackSingleThree
              season={season}
              onClick={startOpening}
              isClicked={packClicked}
            />
          </Suspense>
        )}
      </ThreeScene>

      {/* 3D Pack Rip Overlay */}
      <PackRipOverlay3D
        key={packCards.map((c) => c.role_id).join("-") || "closed"}
        isOpen={isOpening}
        season={season}
        cards={packCards}
        onClose={resetToIdle}
        onRipComplete={handleRipComplete}
      />

      <style jsx>{`
        .opening-3d-page {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #06060f 0%,
            #0d0d2e 50%,
            #08080f 100%
          );
        }
      `}</style>
    </div>
  );
}
