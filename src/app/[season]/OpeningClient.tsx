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
  const { startBGM, stopBGM } = useAudio();

  const [isOpening, setIsOpening] = useState(false);
  const [packCards, setPackCards] = useState<CardType[]>([]);
  const [isGodPackEffectActive, setIsGodPackEffectActive] = useState(false);
  const [packClicked, setPackClicked] = useState(false);
  const [isClosingOverlay, setIsClosingOverlay] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const resetToIdle = useCallback(() => {
    setIsClosingOverlay(true);
    const zoomOutTimer = setTimeout(() => {
      setPackClicked(false);
    }, 200);
    timersRef.current.push(zoomOutTimer);

    const timer = setTimeout(() => {
      clearAllTimers();
      setIsOpening(false);
      setPackCards([]);
      setIsGodPackEffectActive(false);
      setIsClosingOverlay(false);
      stopBGM();
    }, 600);
    timersRef.current.push(timer);
  }, [clearAllTimers, stopBGM]);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetToIdle();
    }, 0);
    return () => clearTimeout(timer);
  }, [season, resetToIdle]);

  const startOpening = useCallback(() => {
    if (packClicked || isOpening) return;
    setPackClicked(true);
    startBGM(AUDIO_URLS.BGM_GOD, 0.02);

    const { pack, isGod } = openPack();
    setPackCards(pack);
    if (isGod) setIsGodPackEffectActive(true);

    // Match Cut: รอให้ซอง zoom เข้ามาก่อน (~1150ms เหมือน unboxing) แล้วค่อยตัดไปหน้าฉีก
    const timer = setTimeout(() => {
      setIsOpening(true);
    }, 1150);
    timersRef.current.push(timer);
  }, [packClicked, isOpening, openPack, startBGM]);

  const handleRipComplete = useCallback(() => {
    packCards.forEach((card) => addToCollection(card));
  }, [packCards, addToCollection]);

  if (!isLoaded) {
    return <div className="opening-loader">กำลังโหลด...</div>;
  }

  return (
    <main
      className={`opening-page ${isGodPackEffectActive ? "god-pack-effect" : ""} ${packClicked ? "is-zooming-pack" : ""}`}
    >

      <div className="vault-frame" aria-hidden="true">
        <span className="vault-corner vault-corner-top-left" />
        <span className="vault-corner vault-corner-top-right" />
        <span className="vault-corner vault-corner-bottom-left" />
        <span className="vault-corner vault-corner-bottom-right" />
      </div>

      <div className="opening-interface">
        <div className="opening-copy">
          <div className="opening-kicker">
            <span className="live-dot" />
            POD CARD VAULT · {season === "season2" ? "SEASON 02" : "SEASON 01"}
          </div>
          <h1>เลือกชะตา<br />จากในซอง</h1>
          <p>
            การ์ด 5 ใบไม่ซ้ำ ลุ้นใบหายากและ<br className="desktop-break" />
            God Pack ในทุกการเปิด
          </p>
        </div>

        <div className="opening-meta" aria-label="ข้อมูลแพ็ก">
          <div className="meta-item">
            <span className="meta-value">05</span>
            <span className="meta-label">การ์ดต่อซอง</span>
          </div>
          <div className="meta-divider" />
          <div className="meta-item">
            <span className="meta-value">1%</span>
            <span className="meta-label">God Pack</span>
          </div>
        </div>

        <div className="opening-action">
          <span className="action-hint">แตะซองเพื่อเริ่ม</span>
        </div>
      </div>

      <ThreeScene
        className="pack-scene"
        cameraPosition={[0, 0.08, 6.7]}
        fogColor="#07060a"
        showAtmosphere={true}
        showDefaultLighting={false}
      >
        <Suspense fallback={null}>
          <PackSingleThree
            season={season}
            onClick={startOpening}
            isClicked={packClicked}
          />
        </Suspense>
      </ThreeScene>



      <PackRipOverlay3D
        key="rip-overlay"
        isOpen={isOpening}
        isClosing={isClosingOverlay}
        season={season}
        cards={packCards}
        onClose={resetToIdle}
        onRipComplete={handleRipComplete}
        mode="single"
        autoOpen
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
          width: 100vw;
          max-width: none;
          margin: 0;
          padding: 0;
          overflow: hidden;
          isolation: isolate;
          min-height: calc(100svh - 60px);
          background:
            radial-gradient(circle at 50% 44%, rgba(0, 210, 255, 0.1), transparent 26%),
            linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
        }

        .opening-page::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(0, 210, 255, 0.035) 1px, transparent 1px),
            linear-gradient(rgba(0, 210, 255, 0.025) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(circle at center, black, transparent 82%);
        }

        .vault-frame {
          position: absolute;
          inset: clamp(1rem, 2.4vw, 2.5rem);
          z-index: 2;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .vault-frame::before,
        .vault-frame::after {
          content: "";
          position: absolute;
          left: 50%;
          width: 5rem;
          height: 1px;
          background: rgba(0, 210, 255, 0.48);
          transform: translateX(-50%);
        }

        .vault-frame::before { top: -1px; }
        .vault-frame::after { bottom: -1px; }

        .vault-corner {
          position: absolute;
          width: 18px;
          height: 18px;
          border-color: rgba(0, 210, 255, 0.7);
        }

        .vault-corner-top-left { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
        .vault-corner-top-right { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
        .vault-corner-bottom-left { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
        .vault-corner-bottom-right { right: -1px; bottom: -1px; border-right: 2px solid; border-bottom: 2px solid; }

        .opening-interface {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          padding: clamp(2rem, 5vw, 5.5rem);
        }

        .opening-copy {
          position: absolute;
          top: 50%;
          left: clamp(2rem, 5vw, 5.5rem);
          max-width: 24rem;
          transform: translateY(-54%);
          animation: interface-enter 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .opening-kicker {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1.25rem;
          color: rgba(255, 255, 255, 0.62);
          font: 600 clamp(0.68rem, 0.6rem + 0.2vw, 0.78rem) var(--font-chakra), sans-serif;
          letter-spacing: 0.15em;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00d2ff;
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.8);
          animation: signal-pulse 2s ease-in-out infinite;
        }

        h1 {
          margin: 0;
          color: #fff;
          font: 700 clamp(2.6rem, 4.5vw, 5.25rem) / 0.92 var(--font-chakra), sans-serif;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .opening-copy p {
          margin-top: 1.5rem;
          color: rgba(255, 255, 255, 0.64);
          font: 300 clamp(0.92rem, 0.84rem + 0.25vw, 1.05rem) / 1.7 var(--font-kanit), sans-serif;
        }

        .opening-meta {
          position: absolute;
          top: clamp(2rem, 5vw, 5.5rem);
          right: clamp(2rem, 5vw, 5.5rem);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          animation: interface-enter 700ms 100ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .meta-item { display: grid; gap: 0.2rem; }

        .meta-value {
          color: #fff;
          font: 600 1.35rem var(--font-chakra), sans-serif;
          letter-spacing: -0.03em;
        }

        .meta-label {
          color: rgba(255, 255, 255, 0.46);
          font: 400 0.7rem var(--font-kanit), sans-serif;
          letter-spacing: 0.04em;
        }

        .meta-divider { width: 1px; height: 2.25rem; background: rgba(255, 255, 255, 0.12); }

        .opening-action {
          position: absolute;
          right: clamp(2rem, 5vw, 5.5rem);
          bottom: clamp(2rem, 5vw, 5.5rem);
          display: flex;
          align-items: center;
          gap: 1rem;
          animation: interface-enter 700ms 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .action-hint {
          color: rgba(255, 255, 255, 0.5);
          font: 300 0.8rem var(--font-kanit), sans-serif;
        }



        @keyframes interface-enter {
          from { opacity: 0; transform: translateY(calc(-54% + 16px)); }
          to { opacity: 1; }
        }

        @keyframes signal-pulse {
          50% { opacity: 0.45; transform: scale(0.75); }
        }

        @media (max-width: 1100px) {
          .opening-copy {
            top: 2.3rem;
            left: 2rem;
            transform: none;
            max-width: calc(100% - 4rem);
          }

          h1 { font-size: clamp(2.25rem, 9vw, 3.75rem); line-height: 0.95; }
          .opening-copy p { display: none; }
          .opening-kicker { margin-bottom: 0.8rem; }
          .opening-meta { display: none; }

          .opening-action {
            right: 2rem;
            bottom: 2rem;
            left: 2rem;
            justify-content: center;
          }



          @keyframes interface-enter {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }

        @media (max-width: 520px) {
          .opening-page { min-height: calc(100svh - 60px); }
          .vault-frame { inset: 0.75rem; }
          .opening-copy { top: 1.6rem; left: 1.5rem; max-width: calc(100% - 3rem); }
          .opening-kicker { font-size: 0.61rem; }
          h1 { font-size: clamp(2rem, 11vw, 2.8rem); }

        }

        @media (prefers-reduced-motion: reduce) {
          .opening-copy,
          .opening-meta,
          .opening-action,
          .live-dot {
            animation: none;
          }
        }

        /* ─── 3D Portal Transition & Zooming styles ─── */
        :global(.three-scene-container) {
          transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), filter 0.35s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .opening-page.is-zooming-pack :global(.three-scene-container) {
          transform: scale(1.1);
          filter: saturate(1.15) brightness(0.9);
        }

        .opening-copy,
        .opening-meta,
        .opening-action {
          transition: transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .opening-page.is-zooming-pack .opening-copy {
          transform: translateY(-54%) scale(0.82) translateX(-30px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease-out;
        }

        .opening-page.is-zooming-pack .opening-meta {
          transform: scale(0.82) translateY(-20px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease-out;
        }

        .opening-page.is-zooming-pack .opening-action {
          transform: scale(0.82) translateY(20px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease-out;
        }
      `}</style>
    </main>
  );
}
