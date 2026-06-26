"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGacha } from "../../../hooks/useGacha";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";
import { FullArtCard } from "../../../components/FullArtCard";
import { Card } from "../../../components/Card";
import { Card as CardType } from "../../../data/types";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "#f43f5e", background: "#0f172a", minHeight: "100vh", fontFamily: "monospace" }}>
          <h2>พบข้อผิดพลาดขณะรันไทม์:</h2>
          <pre style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px", overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#fbbf24", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "Kanit, sans-serif" }}
          >
            โหลดหน้าใหม่ (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function WheelClientContent() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { gachaPool, isLoaded, isOwned, addToCollection } = useGacha(season);
  const { playSFX } = useAudio();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  // Fallback load safety in case localStorage hydration hangs
  const [forceLoad, setForceLoad] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoad(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  // Phase state: "select" | "spin"
  const [phase, setPhase] = useState<"select" | "spin">("select");

  // Spin states
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winnerCard, setWinnerCard] = useState<CardType | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Filter cards by selected rarity
  const filteredSelectionCards = useMemo(() => {
    if (!selectedRarity) return [];
    return gachaPool.filter((c) => c.rarity === selectedRarity);
  }, [gachaPool, selectedRarity]);

  // Selected card objects
  const selectedCards = useMemo(() => {
    return selectedIds
      .map((id) => gachaPool.find((c) => c.role_id === id))
      .filter((c): c is CardType => !!c);
  }, [selectedIds, gachaPool]);

  // Toggle card selection (min 2, max 16 cards)
  const toggleCard = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 16) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  // Presets
  const handleSelectPreset = (type: "random8" | "random12" | "srPlus" | "clear") => {
    if (type === "clear") {
      setSelectedIds([]);
      return;
    }

    if (type === "srPlus") {
      const highRarityCards = gachaPool.filter(
        (c) => ["SR", "SSR", "UR", "SEC", "LEG"].includes(c.rarity)
      );
      const selected = highRarityCards.slice(0, 16).map((c) => c.role_id);
      setSelectedIds(selected);
      return;
    }

    const count = type === "random8" ? 8 : 12;
    const shuffled = [...gachaPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count).map((c) => c.role_id);
    setSelectedIds(selected);
  };

  const handleStartSpin = () => {
    if (selectedCards.length < 2 || isSpinning) return;
    setIsSpinning(true);
    setWinnerCard(null);
    setShowWinnerModal(false);

    // Pick random winner index
    const randIdx = Math.floor(Math.random() * selectedCards.length);
    setWinnerIndex(randIdx);

    const segmentAngle = 360 / selectedCards.length;
    // Calculate center angle of the winner segment
    const targetSectorCenter = randIdx * segmentAngle + segmentAngle / 2;
    
    // targetAngle = 5 full rotations + offset to top pointer (270 degrees)
    const targetAngle = 360 * 5 + 270 - targetSectorCenter;
    
    setWheelRotation(targetAngle);
    playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.12);
  };

  // Ticking sound simulation matching CSS transition speed (easeOutQuart)
  useEffect(() => {
    if (!isSpinning || winnerIndex === null) return;

    const duration = 5000;
    const startTime = performance.now();
    const startAngle = wheelRotation - 360 * 5;
    const endAngle = wheelRotation;
    const segmentAngle = 360 / selectedCards.length;
    let lastSector = -1;
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= duration) return;

      const progress = elapsed / duration;
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const currentAngle = startAngle + (endAngle - startAngle) * ease;

      // Top pointer is at 270 degrees relative to 0 degree canvas rotation
      const sector = Math.floor(((270 - currentAngle) % 360 + 360) % 360 / segmentAngle);
      if (sector !== lastSector && sector >= 0 && sector < selectedCards.length) {
        lastSector = sector;
        playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.08);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isSpinning, wheelRotation, selectedCards.length, winnerIndex, playSFX]);

  const handleTransitionEnd = () => {
    setIsSpinning(false);
    if (winnerIndex !== null && selectedCards[winnerIndex]) {
      const card = selectedCards[winnerIndex];
      setWinnerCard(card);
      setShowWinnerModal(true);

      addToCollection(card);

      if (["LEG", "SEC", "UR"].includes(card.rarity)) {
        playSFX(AUDIO_URLS.HEAVENLY, 0.25);
      } else {
        playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.18);
      }
    }
  };

  const handleSpinAgain = () => {
    setShowWinnerModal(false);
    // Reset wheel rotation back to normalized angle so it can spin again smoothly
    const normalized = wheelRotation % 360;
    setWheelRotation(normalized);
    
    setTimeout(() => {
      handleStartSpin();
    }, 150);
  };

  // Generate conic gradient string for wheel sectors
  const conicGradientStyle = useMemo(() => {
    if (selectedCards.length === 0) return {};
    const segmentAngle = 360 / selectedCards.length;
    
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

    const gradientParts = selectedCards.map((card, idx) => {
      const start = idx * segmentAngle;
      const end = (idx + 1) * segmentAngle;
      return `${getRarityColor(card.rarity)} ${start}deg ${end}deg`;
    });

    return {
      background: `conic-gradient(${gradientParts.join(", ")})`
    };
  }, [selectedCards]);

  if (!isLoaded && !forceLoad) {
    return (
      <div className="loading-screen">
        กำลังโหลดระบบวงล้อสุ่ม...
        <style>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #07060a;
            color: white;
            font-family: var(--font-kanit);
            font-size: 1.3rem;
          }
        `}</style>
      </div>
    );
  }

  const rarityFilters = ["LEG", "SEC", "UR", "SSR", "SR", "R", "C", "EVENT"];
  const CardComponent = season === "season2" ? FullArtCard : Card;

  const getRarityBadgeColor = (rarity: string) => {
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

  const segmentAngle = 360 / selectedCards.length;

  return (
    <div className="wheel-wrapper">
      {phase === "select" ? (
        <section className="select-view active">
          <div className="collection-header">
            <h2>
              สร้างวงล้อสุ่มการ์ด (<span className="neon-text">{selectedIds.length}</span>/16)
            </h2>
            <div className="lot-actions">
              <button
                className="btn-primary"
                onClick={() => setPhase("spin")}
                disabled={selectedIds.length < 2 || selectedIds.length > 16}
              >
                เข้าสู่วงล้อสุ่ม 3D
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleSelectPreset("clear")}
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          <div className="presets-bar">
            <span>ทางเลือกด่วน:</span>
            <button className="preset-btn" onClick={() => handleSelectPreset("random8")}>
              สุ่ม 8 ใบ
            </button>
            <button className="preset-btn" onClick={() => handleSelectPreset("random12")}>
              สุ่ม 12 ใบ
            </button>
            <button className="preset-btn" onClick={() => handleSelectPreset("srPlus")}>
              ระดับ SR ขึ้นไป
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
                  {rarity} ({gachaPool.filter(c => c.rarity === rarity).length} ใบ)
                </option>
              ))}
            </select>
          </div>

          {selectedRarity === null ? (
            <div className="empty-lot-msg">
              กรุณาเลือกระดับการ์ดด้านบน เพื่อแสดงรายการการ์ด
            </div>
          ) : filteredSelectionCards.length === 0 ? (
            <div className="empty-lot-msg">ไม่มีการ์ด gacha สำหรับระดับนี้</div>
          ) : (
            <div className="cards-grid selection-mode season2-grid">
              {filteredSelectionCards.map((card) => {
                const isSelected = selectedIds.includes(card.role_id);
                const owned = isOwned(card);
                return (
                  <div key={card.role_id} className="card-selection-item">
                    <CardComponent
                      card={card}
                      isRevealed={true}
                      isSelectionMode={true}
                      isSelected={isSelected}
                      isOwned={owned}
                      enableHolo={false}
                      onClick={() => toggleCard(card.role_id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="spin-view active">
          <div className="spin-header">
            <button className="btn-back" onClick={() => setPhase("select")} disabled={isSpinning}>
              ← กลับไปแก้ไข
            </button>
            <h2>วงล้อสุ่มการ์ด 3D</h2>
            <div style={{ width: 100 }} />
          </div>

          <div className="spin-layout">
            <div className="wheel-cards-sidebar">
              <h3>การ์ดในวงล้อ ({selectedCards.length} ใบ)</h3>
              <div className="sidebar-list">
                {selectedCards.map((card, idx) => (
                  <div key={`${card.role_id}-${idx}`} className="sidebar-card-item">
                    <span
                      className="rarity-badge"
                      style={{ backgroundColor: getRarityBadgeColor(card.rarity) }}
                    >
                      {card.rarity}
                    </span>
                    <span className="card-name">{card.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="spin-area-container">
              {/* Pseudo-3D CSS Tilted Wheel */}
              <div className="wheel-container-3d">
                <div className="wheel-shadow" />
                <div className="wheel-pointer" />
                <div
                  className="wheel-plate"
                  style={{
                    ...conicGradientStyle,
                    transform: `rotateX(25deg) rotate(${-wheelRotation}deg)`,
                  }}
                  onTransitionEnd={handleTransitionEnd}
                >
                  {selectedCards.map((card, idx) => {
                    const angle = idx * segmentAngle + segmentAngle / 2;
                    return (
                      <div
                        key={idx}
                        className="wheel-sector-text"
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                        {card.name}
                      </div>
                    );
                  })}
                </div>
                <div className="wheel-center-cap" />
              </div>

              {/* SPIN Button Overlay */}
              <div className="spin-button-container">
                <button
                  className="spin-trigger-btn"
                  onClick={handleStartSpin}
                  disabled={isSpinning}
                >
                  {isSpinning ? "กำลังหมุน..." : "กดเพื่อหมุน!"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {winnerCard && showWinnerModal && (
        <div className="winner-overlay">
          <div className="winner-modal">
            <h3 className="winner-title animate-bounce">🎉 ได้รับการ์ดแล้ว! 🎉</h3>
            
            <div className="winner-card-box">
              <CardComponent card={winnerCard} isRevealed={true} enableHolo={true} />
            </div>

            <div className="winner-card-details">
              <span
                className="winner-rarity"
                style={{ backgroundColor: getRarityBadgeColor(winnerCard.rarity) }}
              >
                {winnerCard.rarity}
              </span>
              <h4 className="winner-name">{winnerCard.name}</h4>
              <p className="winner-ability">
                <strong>ความสามารถ:</strong> {winnerCard.ability || "ไม่มีความสามารถพิเศษ"}
              </p>
            </div>

            <div className="winner-actions">
              <button className="btn-modal-spin" onClick={handleSpinAgain}>
                หมุนอีกครั้ง
              </button>
              <button className="btn-modal-close" onClick={() => setShowWinnerModal(false)}>
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loading-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #07060a;
          color: white;
          font-family: var(--font-kanit);
          font-size: 1.3rem;
        }

        .wheel-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
          font-family: var(--font-kanit);
          color: white;
        }

        .select-view {
          padding: 2rem;
          padding-top: 6rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .neon-text {
          color: #38bdf8;
          text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
        }

        .presets-bar {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.8rem 1.2rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .presets-bar span {
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .preset-btn {
          background: rgba(56, 189, 248, 0.1);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 0.4rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-btn:hover {
          background: #38bdf8;
          color: #0f172a;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
        }

        .card-selection-item {
          transition: transform 0.2s ease;
        }

        .card-selection-item:hover {
          transform: translateY(-5px);
        }

        /* SPIN VIEW LAYOUT */
        .spin-view {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .spin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 10;
          margin-top: 55px;
        }

        .spin-header h2 {
          font-size: 1.3rem;
          margin: 0;
          font-weight: 600;
          color: #38bdf8;
          text-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
        }

        .btn-back {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1.2rem;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }

        .spin-layout {
          display: flex;
          flex: 1;
          position: relative;
          height: calc(100vh - 110px);
        }

        .wheel-cards-sidebar {
          width: 300px;
          background: rgba(7, 6, 10, 0.8);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          z-index: 5;
        }

        .wheel-cards-sidebar h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-card-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
        }

        .rarity-badge {
          font-size: 0.75rem;
          font-weight: bold;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          min-width: 42px;
          text-align: center;
        }

        .card-name {
          font-size: 0.85rem;
          color: #e2e8f0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spin-area-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 2rem;
        }

        /* 3D CSS WHEEL SPINNER */
        .wheel-container-3d {
          position: relative;
          width: 340px;
          height: 340px;
          perspective: 1000px;
          margin-bottom: 3rem;
        }

        .wheel-shadow {
          position: absolute;
          width: 90%;
          height: 90%;
          left: 5%;
          top: 8%;
          background: rgba(0, 0, 0, 0.65);
          border-radius: 50%;
          filter: blur(15px);
          transform: translateY(24px) rotateX(45deg) scale(0.95);
          z-index: 1;
          pointer-events: none;
        }

        .wheel-pointer {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%) translateZ(25px);
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 24px solid #f43f5e;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
          z-index: 10;
          pointer-events: none;
        }

        .wheel-plate {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 10px solid #1e293b;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.7),
            0 0 0 3px #38bdf8,
            inset 0 0 20px rgba(0,0,0,0.8);
          transform-style: preserve-3d;
          transform: rotateX(45deg) rotate(0deg);
          transition: transform 5s cubic-bezier(0.1, 0.8, 0.1, 1);
          z-index: 2;
          overflow: hidden;
        }

        .wheel-sector-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: 0 50%;
          width: 145px;
          text-align: right;
          margin-top: -10px;
          padding-right: 25px;
          font-size: 0.82rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 4px rgba(0,0,0,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          pointer-events: none;
        }

        .wheel-center-cap {
          position: absolute;
          width: 54px;
          height: 54px;
          background: radial-gradient(circle, #38bdf8 0%, #0284c7 50%, #0f172a 100%);
          border: 3.5px solid #38bdf8;
          border-radius: 50%;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(20px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.6), 0 0 10px rgba(56, 189, 248, 0.5);
          z-index: 5;
          pointer-events: none;
        }

        .spin-button-container {
          z-index: 10;
        }

        .spin-trigger-btn {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          border: 2px solid #38bdf8;
          font-size: 1.2rem;
          font-weight: bold;
          padding: 0.9rem 2.8rem;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.25);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }

        .spin-trigger-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.6);
        }

        .spin-trigger-btn:active:not(:disabled) {
          transform: scale(0.96);
        }

        .spin-trigger-btn:disabled {
          background: #475569;
          border-color: #64748b;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* WINNER MODAL OVERLAY */
        .winner-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 5, 8, 0.88);
          backdrop-filter: blur(12px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fade-in 0.3s ease-out;
        }

        .winner-modal {
          background: linear-gradient(185deg, #111827 0%, #030712 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.25);
          box-shadow: 0 0 45px rgba(56, 189, 248, 0.15), 0 10px 30px rgba(0, 0, 0, 0.6);
          padding: 2.2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 420px;
          width: 90%;
          text-align: center;
          animation: scale-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .winner-title {
          font-size: 1.4rem;
          color: #fbbf24;
          text-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
          margin-bottom: 1.2rem;
          font-weight: 700;
        }

        .winner-card-box {
          width: 200px;
          height: 290px;
          margin-bottom: 1.2rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .winner-card-details {
          margin-bottom: 1.5rem;
          width: 100%;
        }

        .winner-rarity {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 0.2rem 0.8rem;
          border-radius: 50px;
          color: white;
          margin-bottom: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .winner-name {
          font-size: 1.2rem;
          color: white;
          margin-bottom: 0.6rem;
          font-weight: 600;
        }

        .winner-ability {
          font-size: 0.85rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.6rem;
          border-radius: 6px;
          line-height: 1.4;
        }

        .winner-actions {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .btn-modal-spin {
          flex: 1;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          border: 1px solid #38bdf8;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-modal-spin:hover {
          background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
        }

        .btn-modal-close {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-modal-close:hover {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-up {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function WheelClient() {
  return (
    <ErrorBoundary>
      <WheelClientContent />
    </ErrorBoundary>
  );
}
