"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
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
import { FullArtCard } from "../../components/FullArtCard";
import { Card } from "../../components/Card";

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "LEG": return "#dc2626";
    case "SEC": return "#4f46e5";
    case "UR": return "#ea580c";
    case "SSR": return "#ca8a04";
    case "SR": return "#9333ea";
    case "R": return "#2563eb";
    case "C": return "#4b5563";
    case "EVENT": return "#db2777";
    default: return "#334155";
  }
};

export default function OpeningClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { openPack, isLoaded, addToCollection, gachaPool } = useGacha(season);
  const { startBGM, stopBGM, playSFX } = useAudio();

  const [isOpening, setIsOpening] = useState(false);
  const [packCards, setPackCards] = useState<CardType[]>([]);
  const packCardsRef = useRef<CardType[]>([]);
  const [isGodPackEffectActive, setIsGodPackEffectActive] = useState(false);
  const [packClicked, setPackClicked] = useState(false);
  const [isClosingOverlay, setIsClosingOverlay] = useState(false);

  // Free Wheel States
  const [showFreeWheelModal, setShowFreeWheelModal] = useState(false);
  const [freeWheelCards, setFreeWheelCards] = useState<CardType[]>([]);
  const [isSpinningFreeWheel, setIsSpinningFreeWheel] = useState(false);
  const [freeWheelRotation, setFreeWheelRotation] = useState(0);
  const [freeWheelStartRotation, setFreeWheelStartRotation] = useState(0);
  const [freeWheelWinnerIndex, setFreeWheelWinnerIndex] = useState<number | null>(null);
  const [freeWheelWinnerCard, setFreeWheelWinnerCard] = useState<CardType | null>(null);
  const [showWinnerFreeWheel, setShowWinnerFreeWheel] = useState(false);

  const CardComponent = season === "season2" ? FullArtCard : Card;

  const freeConicGradientStyle = useMemo(() => {
    if (freeWheelCards.length === 0) return {};
    const segmentAngle = 360 / freeWheelCards.length;

    const gradientParts = freeWheelCards.map((card, idx) => {
      const start = idx * segmentAngle;
      const end = (idx + 1) * segmentAngle;
      return `${getRarityColor(card.rarity)} ${start}deg ${end}deg`;
    });

    return {
      background: `conic-gradient(from 90deg, ${gradientParts.join(", ")})`
    };
  }, [freeWheelCards]);

  const prepareFreeWheel = useCallback(() => {
    const srPlusCards = gachaPool.filter(c => 
      ["SR", "SSR", "UR", "SEC", "LEG"].includes(c.rarity)
    );
    if (srPlusCards.length === 0) return;

    const shuffled = [...srPlusCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(8, shuffled.length));
    
    setFreeWheelCards(selected);
    setIsSpinningFreeWheel(false);
    setFreeWheelRotation(0);
    setFreeWheelStartRotation(0);
    setFreeWheelWinnerIndex(null);
    setFreeWheelWinnerCard(null);
    setShowWinnerFreeWheel(false);
    setShowFreeWheelModal(true);
  }, [gachaPool]);

  const startFreeWheelSpin = useCallback(() => {
    if (freeWheelCards.length === 0 || isSpinningFreeWheel) return;
    setIsSpinningFreeWheel(true);
    setShowWinnerFreeWheel(false);
    setFreeWheelWinnerCard(null);

    const randIdx = Math.floor(Math.random() * freeWheelCards.length);
    setFreeWheelWinnerIndex(randIdx);

    const segmentAngle = 360 / freeWheelCards.length;
    const targetSectorCenter = randIdx * segmentAngle + segmentAngle / 2;
    
    const targetAngleMod = ((targetSectorCenter - 270) % 360 + 360) % 360;
    const currentRotationMod = freeWheelRotation % 360;
    let diff = targetAngleMod - currentRotationMod;
    if (diff <= 0) diff += 360;
    
    const nextRotation = freeWheelRotation + diff + 360 * 5;
    
    setFreeWheelStartRotation(freeWheelRotation);
    setFreeWheelRotation(nextRotation);
    playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.12);
  }, [freeWheelCards, isSpinningFreeWheel, freeWheelRotation, playSFX]);

  // Ticking sound simulation matching CSS transition speed (easeOutQuart)
  useEffect(() => {
    if (!isSpinningFreeWheel || freeWheelWinnerIndex === null || freeWheelCards.length === 0) return;

    const duration = 5000;
    const startTime = performance.now();
    const startAngle = freeWheelStartRotation;
    const endAngle = freeWheelRotation;
    const segmentAngle = 360 / freeWheelCards.length;
    let lastSector = -1;
    let animId: number;

    const tickAudio = new Audio(AUDIO_URLS.CARD_REVEAL_NORMAL);
    tickAudio.volume = 0.08;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= duration) return;

      const progress = elapsed / duration;
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const currentAngle = startAngle + (endAngle - startAngle) * ease;

      const sector = Math.floor(((currentAngle + 270) % 360 + 360) % 360 / segmentAngle);
      if (sector !== lastSector && sector >= 0 && sector < freeWheelCards.length) {
        lastSector = sector;
        tickAudio.currentTime = 0;
        tickAudio.play().catch(() => {});
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      tickAudio.pause();
    };
  }, [isSpinningFreeWheel, freeWheelRotation, freeWheelStartRotation, freeWheelCards.length, freeWheelWinnerIndex]);

  const handleFreeWheelTransitionEnd = useCallback(() => {
    setIsSpinningFreeWheel(false);
    if (freeWheelWinnerIndex !== null && freeWheelCards[freeWheelWinnerIndex]) {
      const card = freeWheelCards[freeWheelWinnerIndex];
      setFreeWheelWinnerCard(card);
      setShowWinnerFreeWheel(true);

      addToCollection(card);

      if (["LEG", "SEC", "UR"].includes(card.rarity)) {
        playSFX(AUDIO_URLS.HEAVENLY, 0.25);
      } else {
        playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.18);
      }
    }
  }, [freeWheelWinnerIndex, freeWheelCards, addToCollection, playSFX]);

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

    const openedCards = packCardsRef.current;
    const allC = openedCards.length === 5 && openedCards.every(c => c.rarity === "C");
    const allR = openedCards.length === 5 && openedCards.every(c => c.rarity === "R");
    const earnedFreeSpin = allC || allR;

    const timer = setTimeout(() => {
      clearAllTimers();
      setIsOpening(false);

      if (earnedFreeSpin) {
        prepareFreeWheel();
      }

      setPackCards([]);
      packCardsRef.current = [];
      setIsGodPackEffectActive(false);
      setIsClosingOverlay(false);
      stopBGM();
    }, 600);
    timersRef.current.push(timer);
  }, [clearAllTimers, stopBGM, prepareFreeWheel]);

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
    packCardsRef.current = pack;
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

      {showFreeWheelModal && (
        <div className="free-wheel-modal-overlay">
          <div className="free-wheel-modal-content">
            {!showWinnerFreeWheel ? (
              <>
                <div className="free-wheel-banner">🎉 JACKPOT BONUS! 🎉</div>
                <h2>ยินดีด้วย! คุณเกลือจัดจนระบบเห็นใจ</h2>
                <p className="free-wheel-desc">
                  เนื่องจากคุณเปิดซองได้ระดับ C ทั้งหมด หรือ R ทั้งหมด <br />
                  รับสิทธิ์หมุนวงล้อพิเศษ สุ่มการ์ดระดับ <strong>SR ขึ้นไป</strong> ฟรี 1 ใบ!
                </p>

                <div className="free-wheel-spin-area">
                  <div className="free-wheel-pointer" />
                  <div
                    className="free-wheel-plate"
                    style={{
                      ...freeConicGradientStyle,
                      transform: `rotate(${-freeWheelRotation}deg)`
                    }}
                    onTransitionEnd={handleFreeWheelTransitionEnd}
                  >
                    {freeWheelCards.map((card, idx) => {
                      const angle = idx * (360 / freeWheelCards.length) + (360 / freeWheelCards.length) / 2;
                      return (
                        <div
                          key={`${card.role_id}-sector-${idx}`}
                          className="free-sector-text"
                          style={{
                            transform: `rotate(${angle}deg) translateZ(1px)`
                          }}
                        >
                          {card.name}
                        </div>
                      );
                    })}
                  </div>
                  <div className="free-wheel-center" />
                </div>

                <button
                  className="free-spin-btn"
                  onClick={startFreeWheelSpin}
                  disabled={isSpinningFreeWheel}
                >
                  {isSpinningFreeWheel ? "กำลังสุ่ม..." : "กดเพื่อหมุนวงล้อ!"}
                </button>
              </>
            ) : (
              <div className="free-wheel-winner-reveal">
                <div className="free-wheel-winner-sparkle" />
                <div className="winner-label-badge">ยินดีด้วย! คุณได้รับการ์ด</div>
                <h3>{freeWheelWinnerCard?.name}</h3>
                <div className="winner-rarity-badge" style={{ backgroundColor: getRarityColor(freeWheelWinnerCard?.rarity || "") }}>
                  {freeWheelWinnerCard?.rarity}
                </div>

                <div className="winner-card-container">
                  {freeWheelWinnerCard && (
                    <CardComponent card={freeWheelWinnerCard} isRevealed={true} />
                  )}
                </div>

                <button
                  className="free-close-btn"
                  onClick={() => setShowFreeWheelModal(false)}
                >
                  รับการ์ดและปิดหน้านี้
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

        /* ─── Free Wheel Modal Styles ─── */
        .free-wheel-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(4, 3, 6, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          animation: free-fade-in 0.3s ease-out;
        }
        .free-wheel-modal-content {
          position: relative;
          width: 92%;
          max-width: 460px;
          background: linear-gradient(180deg, rgba(20, 18, 30, 0.95) 0%, rgba(10, 8, 16, 0.98) 100%);
          border: 1.5px solid rgba(0, 210, 255, 0.3);
          box-shadow: 0 0 40px rgba(0, 210, 255, 0.15), 0 20px 50px rgba(0, 0, 0, 0.5);
          border-radius: 20px;
          padding: 2.2rem;
          text-align: center;
          color: #fff;
          font-family: var(--font-kanit), sans-serif;
          animation: free-scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes free-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes free-scale-up {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .free-wheel-spin-area {
          position: relative;
          width: 290px;
          height: 290px;
          margin: 1.8rem auto;
          border-radius: 50%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 210, 255, 0.15);
        }
        .free-wheel-pointer {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%) translateZ(10px);
          z-index: 10;
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 24px solid #f43f5e;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }
        .free-wheel-plate {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 6px solid #1e293b;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(0, 210, 255, 0.5);
          position: relative;
          overflow: hidden;
          transition: transform 5s cubic-bezier(0.1, 0.8, 0.1, 1);
        }
        .free-wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translateZ(5px);
          z-index: 5;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: radial-gradient(circle, #00d2ff 0%, #008cb3 60%, #0f172a 100%);
          border: 3px solid #00d2ff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 210, 255, 0.6);
        }
        .free-sector-text {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 130px;
          margin-top: -10px;
          text-align: right;
          padding-right: 18px;
          color: #fff;
          font-weight: 700;
          font-size: 0.72rem;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          transform-origin: 0 50%;
          text-shadow: 0 1px 3px #000, 0 0 2px #000;
          pointer-events: none;
        }
        .free-wheel-banner {
          font-family: var(--font-chakra), sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: #00d2ff;
          text-shadow: 0 0 15px rgba(0, 210, 255, 0.6);
          margin-bottom: 0.4rem;
          letter-spacing: 0.1em;
        }
        .free-wheel-modal-content h2 {
          font-size: 1.45rem;
          font-weight: 700;
          margin: 0.5rem 0;
          color: #fff;
        }
        .free-wheel-desc {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
          margin: 0;
        }
        .free-spin-btn {
          width: 100%;
          background: var(--accent);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #07060a;
          font-weight: 700;
          font-size: 1.05rem;
          padding: 0.85rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.35);
          font-family: var(--font-kanit), sans-serif;
        }
        .free-spin-btn:hover:not(:disabled) {
          background: #fff;
          border-color: #fff;
          color: #07060a;
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.45);
        }
        .free-spin-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.25);
        }
        .free-spin-btn:disabled {
          background: #334155;
          border-color: #475569;
          color: #64748b;
          cursor: not-allowed;
          box-shadow: none;
        }
        .free-wheel-winner-reveal {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: free-fade-in 0.5s ease-out;
        }
        .winner-label-badge {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.2rem;
        }
        .free-wheel-winner-reveal h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }
        .winner-rarity-badge {
          font-size: 0.85rem;
          font-weight: 800;
          color: #fff;
          padding: 0.2rem 0.8rem;
          border-radius: 20px;
          margin-bottom: 1.2rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .winner-card-container {
          width: 200px;
          height: 290px;
          margin-bottom: 1.6rem;
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 1000px;
          animation: winner-card-float 3s ease-in-out infinite;
        }
        @keyframes winner-card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .free-close-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          font-family: var(--font-kanit), sans-serif;
        }
        .free-close-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 210, 255, 0.3);
          color: white;
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.1);
          transform: translateY(-1px);
        }
      `}</style>
    </main>
  );
}
