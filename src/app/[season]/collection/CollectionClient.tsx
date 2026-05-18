"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { useGacha } from "../../../hooks/useGacha";
import { useAuth } from "../../../hooks/useAuth";
import {
  LogoutDialog,
  PolicyDialog,
  CardDetailDialog,
} from "../../../components/Modals";
import { Card as CardType } from "../../../data/types";

export default function CollectionClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";

  const { cards, isLoaded, ownedCount, isOwned } = useGacha(season);
  const { logout } = useAuth();

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchVal, setSearchVal] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Modals state
  const [showPolicy, setShowPolicy] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<CardType | null>(null);

  // Back to top scroll state
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Debounce search input by 250ms (same as original TCG script)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, searchVal ? 250 : 0);

    return () => clearTimeout(handler);
  }, [searchVal]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  if (!isLoaded) {
    return (
      <div className="main-wrapper">
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
      </div>
    );
  }

  const filterButtons = [
    { label: "⭐ OWNED", value: "OWNED" },
    { label: "ทั้งหมด", value: "ALL" },
    { label: "LEG", value: "LEG" },
    { label: "SEC", value: "SEC" },
    { label: "UR", value: "UR" },
    { label: "SSR", value: "SSR" },
    { label: "SR", value: "SR" },
    { label: "R", value: "R" },
    { label: "C", value: "C" },
  ];

  return (
    <div className="main-wrapper">
      <Header
        currentSeason={season}
        currentSection="collection"
        onShowPolicy={() => setShowPolicy(true)}
        onLogoutClick={() => setShowLogout(true)}
      />

      <main>
        <section id="collection-section" className="active">
          <div className="collection-header">
            <h2>
              Collection (
              <span id="collected-count">{ownedCount}</span>/
              <span id="total-count">{cards.length}</span>)
            </h2>
            <div className="search-container">
              <input
                type="text"
                id="card-search"
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

          <div id="collection-grid" className="cards-grid">
            {filteredCards.map((card) => {
              const owned = isOwned(card);
              return (
                <Card
                  key={card.role_id}
                  card={card}
                  isRevealed={true}
                  isOwned={owned}
                  enableHolo={owned} // Holo shine is only shown if the card is owned!
                  onClick={() => setSelectedDetailCard(card)}
                />
              );
            })}
          </div>
        </section>
      </main>

      {/* --- MODALS --- */}
      <LogoutDialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={logout}
      />

      <PolicyDialog
        isOpen={showPolicy}
        onClose={() => setShowPolicy(false)}
        appVersion="1.0.1"
      />

      <CardDetailDialog
        isOpen={selectedDetailCard !== null}
        card={selectedDetailCard}
        onClose={() => setSelectedDetailCard(null)}
      />

      {/* --- SCROLL TO TOP --- */}
      {showBackToTop && (
        <button
          id="back-to-top-btn"
          className="back-to-top visible"
          onClick={scrollToTop}
          title="กลับไปด้านบน"
        >
          ↑
        </button>
      )}
    </div>
  );
}
