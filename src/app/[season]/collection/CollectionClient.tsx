"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card } from "../../../components/Card";
import { FullArtCard } from "../../../components/FullArtCard";
import { useGacha } from "../../../hooks/useGacha";
import { useModal } from "../../../components/ModalContext";
import { ThreeScene } from "../../../components/three/ThreeScene";

export default function CollectionClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";

  const { cards, isLoaded, ownedCount, isOwned } = useGacha(season);
  const { setSelectedDetailCard } = useModal();



  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchVal, setSearchVal] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search input by 250ms (same as original TCG script)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, searchVal ? 250 : 0);

    return () => clearTimeout(handler);
  }, [searchVal]);

  // Filtered Cards logic
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const owned = isOwned(card);

      // Search match
      if (
        debouncedSearch &&
        !card.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Rarity filter match
      if (activeFilter === "OWNED") {
        return owned;
      }
      if (activeFilter !== "ALL" && card.rarity !== activeFilter) {
        return false;
      }

      return true;
    });
  }, [cards, activeFilter, debouncedSearch, isOwned]);

  // Rarity Stats
  const rarityStats = useMemo(() => {
    const stats: Record<string, { owned: number; total: number }> = {};
    cards.forEach((card) => {
      if (!stats[card.rarity]) {
        stats[card.rarity] = { owned: 0, total: 0 };
      }
      stats[card.rarity].total += 1;
      if (isOwned(card)) {
        stats[card.rarity].owned += 1;
      }
    });
    return stats;
  }, [cards, isOwned]);

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
        กำลังโหลดสมุดสะสมการ์ด...
      </div>
    );
  }

  const filterButtons = [
    { label: "⭐ สะสมแล้ว", value: "OWNED" },
    { label: "ทั้งหมด", value: "ALL" },
    { label: "LEG", value: "LEG" },
    { label: "SEC", value: "SEC" },
    { label: "UR", value: "UR" },
    { label: "SSR", value: "SSR" },
    { label: "SR", value: "SR" },
    { label: "R", value: "R" },
    { label: "C", value: "C" },
    { label: "EVENT", value: "EVENT" },
  ];

  return (
    <div className="main-wrapper">

      <ThreeScene cameraPosition={[0, 0, 7]} fogColor="#07060a" showDefaultLighting={false} showAtmosphere={true}>
        {null}
      </ThreeScene>

      <main>
        <section id="collection-section" className="active">
          <div className="collection-header-modern">
            <div className="collection-title-row">
              <h2>
                สะสมการ์ด (
                <span id="collected-count">{ownedCount}</span>/
                <span id="total-count">{cards.length}</span>)
              </h2>
              <div className="search-container">
                <input
                  type="text"
                  id="card-search"
                  aria-label="ค้นหาชื่อการ์ด"
                  placeholder="ค้นหาชื่อการ์ด..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
              </div>
            </div>

            <div className="rarity-completion-bar">
               {["LEG", "SEC", "UR", "SSR", "SR", "R", "C", "EVENT"].map((r) => {
                 const stat = rarityStats[r] || { owned: 0, total: 0 };
                 const percent = stat.total > 0 ? (stat.owned / stat.total) * 100 : 0;
                 return (
                   <div key={r} className={`stat-pill ${r.toLowerCase()}`}>
                      <span className="pill-rarity">{r}</span>
                      <span className="pill-count">{stat.owned}/{stat.total}</span>
                      <div className="pill-progress">
                         <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                      </div>
                   </div>
                 );
               })}
            </div>

            <div className="filters-container">
              <div className="filters">
                {filterButtons.map((btn) => (
                  <button
                    key={btn.value}
                    className={activeFilter === btn.value ? "active" : ""}
                    onClick={() => setActiveFilter(btn.value)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredCards.length > 0 ? (
            <div id="collection-grid" className={`cards-grid ${season === "season2" ? "season2-grid" : ""}`}>
              {filteredCards.map((card, idx) => {
                const owned = isOwned(card);
                const CardComponent = season === "season2" ? FullArtCard : Card;
                return (
                  <div
                    key={`${season}-${card.role_id}`}
                    className="collection-card-item"
                    style={{ animationDelay: `${Math.min(idx, 12) * 0.018}s` }}
                  >
                    <CardComponent
                      card={card}
                      isRevealed={true}
                      isOwned={owned}
                      enableHolo={owned}
                      onClick={() => setSelectedDetailCard(card)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
               <div className="empty-icon">🔍</div>
               <h3>ไม่พบการ์ดที่คุณค้นหา</h3>
               <p>ลองเปลี่ยนคำค้นหาหรือฟิลเตอร์ดูนะ</p>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .collection-header-modern {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .collection-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .rarity-completion-bar {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }
        .rarity-completion-bar::-webkit-scrollbar { display: none; }

        .stat-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          min-width: 100px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .pill-rarity { font-weight: bold; font-size: 0.8rem; }
        .pill-count { font-size: 0.75rem; opacity: 0.7; }
        
        .pill-progress {
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill { height: 100%; transition: width 1s ease-out; }

        .leg .progress-fill { background: linear-gradient(90deg, #ff0000, #ff8800); }
        .sec .progress-fill { background: linear-gradient(90deg, #7b00d4, #e91e8c); }
        .ur .progress-fill { background: linear-gradient(90deg, #6a11cb, #a855f7); }
        .ssr .progress-fill { background: #ffd700; }
        .sr .progress-fill { background: #2196f3; }
        .r .progress-fill { background: #4caf50; }
        .c .progress-fill { background: #a8a8a8; }
        .event .progress-fill { background: #e91e63; }

        .filters-container {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.5rem;
          border-radius: 50px;
          display: inline-flex;
          align-self: flex-start;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .collection-card-item {
          animation: card-appear var(--motion-layout) var(--ease-out-quart) both;
        }

        @keyframes card-appear {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255,255,255,0.02);
          border-radius: 20px;
          border: 2px dashed rgba(255,255,255,0.1);
        }

        .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
        .empty-state h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .empty-state p { opacity: 0.6; }

        @media (max-width: 768px) {
          .collection-title-row { flex-direction: column; align-items: stretch; }
          .filters-container { align-self: stretch; overflow-x: auto; border-radius: 15px; }
        }

        .main-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(145deg, #07060a 0%, #0e0c16 52%, #040306 100%);
        }
      `}</style>
    </div>
  );
}
