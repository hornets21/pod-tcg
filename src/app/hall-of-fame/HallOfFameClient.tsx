"use client";

import React, { useState, useMemo } from "react";
import { FullArtCard } from "../../components/FullArtCard";
import { CARDS_DELETE } from "../../data/cards-delete";
import { useModal } from "../../components/ModalContext";
import { ThreeScene } from "../../components/three/ThreeScene";

const RARITY_ORDER: Record<string, number> = {
  LEG: 0,
  SEC: 1,
  UR: 2,
  SSR: 3,
  SR: 4,
  R: 5,
  C: 6,
  EVENT: 7,
};

export default function HallOfFameClient() {
  const { setSelectedDetailCard } = useModal();

  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchVal, setSearchVal] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  React.useEffect(() => {
    const handler = setTimeout(
      () => {
        setDebouncedSearch(searchVal);
      },
      searchVal ? 250 : 0,
    );

    return () => clearTimeout(handler);
  }, [searchVal]);

  const filteredCards = useMemo(() => {
    return CARDS_DELETE.filter((card) => {
      if (
        debouncedSearch &&
        !card.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      if (activeFilter !== "ALL" && card.rarity !== activeFilter) {
        return false;
      }

      return true;
    }).sort(
      (a, b) => (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99),
    );
  }, [activeFilter, debouncedSearch]);

  const filterButtons = [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "LEG", value: "LEG" },
    { label: "SEC", value: "SEC" },
    { label: "UR", value: "UR" },
    { label: "SSR", value: "SSR" },
    { label: "R", value: "R" },
    { label: "EVENT", value: "EVENT" },
  ];

  return (
    <div className="main-wrapper">
      <ThreeScene cameraPosition={[0, 0, 7]} fogColor="#07060a" showDefaultLighting={false} showAtmosphere={true}>
        {null}
      </ThreeScene>

      <main>
        <section id="collection-section" className="active">
          <div className="collection-header">
            <h2>
              🏆 Hall of Fame — การ์ดที่ถูกลบ (
              <span id="collected-count">{filteredCards.length}</span>/
              <span id="total-count">{CARDS_DELETE.length}</span>)
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

          <div id="collection-grid" className="cards-grid season2-grid">
            {filteredCards.map((card) => (
              <FullArtCard
                key={card.role_id}
                card={card}
                isRevealed={true}
                isOwned={true}
                enableHolo={true}
                onClick={() => setSelectedDetailCard(card)}
              />
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
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
