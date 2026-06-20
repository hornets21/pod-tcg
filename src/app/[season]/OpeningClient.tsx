"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { Card as CardType } from "../../data/types";
import { useGacha } from "../../hooks/useGacha";
import { AUDIO_URLS, useAudio } from "../../hooks/useAudio";
import { PackSingleThree } from "../../components/three/PackSingleThree";
import { ThreeScene } from "../../components/three/ThreeScene";
import { PackRipOverlay3D } from "../../components/unboxing/PackRipOverlay3D";

export default function OpeningClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { playSFX, startBGM, stopBGM } = useAudio();

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
    const timer = setTimeout(() => resetToIdle(), 0);
    return () => clearTimeout(timer);
  }, [season, resetToIdle]);

  const startOpening = useCallback(() => {
    if (packClicked || isOpening) return;
    setPackClicked(true);
    playSFX(AUDIO_URLS.TEAR_PACK, 0.2);
    startBGM(AUDIO_URLS.BGM_GOD, 0.02);

    const { pack, isGod } = openPack();
    setPackCards(pack);
    if (isGod) setIsGodPackEffectActive(true);

    // Match Cut: รอให้ซอง zoom เข้ามาก่อน (~350ms เหมือน unboxing) แล้วค่อยตัดไปหน้าฉีก
    const timer = setTimeout(() => {
      setIsOpening(true);
    }, 350);
    timersRef.current.push(timer);
  }, [packClicked, isOpening, playSFX, openPack, startBGM]);

  const handleRipComplete = useCallback(() => {
    packCards.forEach((card) => addToCollection(card));
  }, [packCards, addToCollection]);

  if (!isLoaded) {
    return <div className="opening-loader">กำลังโหลด...</div>;
  }

  return (
    <div
      className={`opening-page ${isGodPackEffectActive ? "god-pack-effect" : ""}`}
    >


      <ThreeScene
        className="pack-scene"
        cameraPosition={[0, 0.08, 6.7]}
        fogColor="#07060a"
        showAtmosphere={true}
        showDefaultLighting={false}
      >
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



      <PackRipOverlay3D
        key={isOpening ? (packCards.map((card) => card.role_id).join("-") || "open") : "closed"}
        isOpen={isOpening}
        season={season}
        cards={packCards}
        onClose={resetToIdle}
        onRipComplete={handleRipComplete}
        mode="single"
      />

      <style jsx>{`
        .opening-loader,
        .opening-page {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
        }

        .opening-loader {
          display: grid;
          place-items: center;
          color: rgba(255, 255, 255, 0.72);
          font: 400 1rem var(--font-kanit), sans-serif;
        }

        .opening-page {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
      `}</style>
    </div>
  );
}
