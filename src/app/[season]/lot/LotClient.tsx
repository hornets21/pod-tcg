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
  CustomDialog,
  DialogButton,
} from "../../../components/Modals";
import { Card as CardType } from "../../../data/types";

export default function LotClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";

  const {
    cards,
    isLoaded,
    lotSelection,
    toggleLotCard,
    clearLotSelection,
    activeLot,
    startLot,
    revealLotCard,
    confirmResetLot,
  } = useGacha(season);

  const { logout } = useAuth();

  // Selection states
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  // Modals state
  const [showPolicy, setShowPolicy] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [selectedDetailCard, setSelectedDetailCard] = useState<CardType | null>(null);

  // Custom Confirmation Dialog states
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    icon: string;
    title: string;
    message: string;
    buttons: DialogButton[];
  }>({
    isOpen: false,
    icon: "",
    title: "",
    message: "",
    buttons: [],
  });

  // Back to top scroll state
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  const handleStartLot = () => {
    if (lotSelection.length === 0 || lotSelection.length > 10) {
      setCustomDialog({
        isOpen: true,
        icon: "⚠️",
        title: "คำเตือน",
        message: "กรุณาเลือกการ์ดอย่างน้อย 1 ใบ (สูงสุด 10 ใบ)",
        buttons: [
          {
            text: "ตกลง",
            onClick: () => setCustomDialog((prev) => ({ ...prev, isOpen: false })),
          },
        ],
      });
      return;
    }

    startLot();
  };

  const handleResetConfirm = () => {
    setCustomDialog({
      isOpen: true,
      icon: "❓",
      title: "ยืนยันการตั้งค่าใหม่",
      message: "คุณต้องการจบล็อตนี้และกลับไปหน้าเดิมใช่หรือไม่? (ความคืบหน้าจะหายไป และรายการที่เลือกจะถูกล้าง)",
      buttons: [
        {
          text: "ยกเลิก",
          onClick: () => setCustomDialog((prev) => ({ ...prev, isOpen: false })),
          className: "btn-secondary logout-btn-cancel",
        },
        {
          text: "ยืนยัน",
          onClick: () => {
            confirmResetLot();
            setCustomDialog((prev) => ({ ...prev, isOpen: false }));
          },
          className: "btn-danger logout-btn-confirm",
        },
      ],
    });
  };

  // Filter cards by selected rarity for custom lot selection
  const lotSelectionCards = useMemo(() => {
    if (!selectedRarity) return [];
    return cards.filter((c) => c.rarity === selectedRarity && c.isGacha === "Y");
  }, [cards, selectedRarity]);

  // Statistics calculations
  const totalInLot = activeLot.length;
  const openedInLot = activeLot.filter((c) => c.isOpened).length;
  const remainingInLot = totalInLot - openedInLot;

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
          กำลังโหลดหน้าจัดการล็อต...
        </div>
      </div>
    );
  }

  const rarityFilters = ["LEG", "SEC", "UR", "SSR", "SR", "R", "C"];

  return (
    <div className="main-wrapper">
      <Header
        currentSeason={season}
        currentSection="lot"
        onShowPolicy={() => setShowPolicy(true)}
        onLogoutClick={() => setShowLogout(true)}
      />

      <main>
        <section id="lot-section" className="active">
          {activeLot.length === 0 ? (
            /* --- LOT SELECTION VIEW --- */
            <div id="lot-selection-view">
              <div className="collection-header">
                <h2>
                  เลือกการ์ดเข้าล็อต (<span id="lot-selected-count">{lotSelection.length}</span>/10)
                </h2>
                <div className="lot-actions">
                  <button
                    id="start-lot-btn"
                    className="btn-primary"
                    style={{ padding: "0.6rem 1.6rem", fontSize: "0.95rem" }}
                    onClick={handleStartLot}
                    disabled={lotSelection.length === 0 || lotSelection.length > 10}
                  >
                    เริ่มล็อตนี้
                  </button>
                  <button className="btn-secondary" onClick={clearLotSelection}>
                    ล้างทั้งหมด
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
                        {rarity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedRarity === null ? (
                <div className="empty-lot-msg">
                  กรุณาเลือกระดับการ์ดด้านบน เพื่อแสดงรายการการ์ด
                </div>
              ) : lotSelectionCards.length === 0 ? (
                <div className="empty-lot-msg">ไม่มีการ์ด gacha สำหรับระดับนี้</div>
              ) : (
                <div id="lot-selection-grid" className="cards-grid selection-mode">
                  {lotSelectionCards.map((card) => {
                    const isSelected = lotSelection.includes(card.role_id);
                    return (
                      <Card
                        key={card.role_id}
                        card={card}
                        isRevealed={true}
                        isSelectionMode={true}
                        isSelected={isSelected}
                        enableHolo={false} // Selection grids disable holo tilt to avoid distraction
                        onClick={() => toggleLotCard(card.role_id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* --- LOT OPENING VIEW --- */
            <div id="lot-opening-view">
              <div className="collection-header">
                <h2>
                  เปิดการ์ดจากล็อต (<span id="lot-remaining-count">{remainingInLot}</span>/
                  <span id="lot-total-count">{totalInLot}</span>)
                </h2>
                <button className="btn-secondary" onClick={handleResetConfirm}>
                  จบล็อต / รีเซ็ต
                </button>
              </div>
              <div className="lot-opening-content">
                <div id="lot-cards-display" className="cards-grid">
                  {activeLot.map((card, idx) => (
                    <Card
                      key={`${card.role_id}-${idx}`}
                      card={card}
                      isRevealed={card.isOpened}
                      enableHolo={card.isOpened} // Only enable 3D holo tilt if revealed!
                      onClick={() => {
                        if (!card.isOpened) {
                          revealLotCard(idx);
                        } else {
                          setSelectedDetailCard(card);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
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

      <CustomDialog
        isOpen={customDialog.isOpen}
        icon={customDialog.icon}
        title={customDialog.title}
        message={customDialog.message}
        buttons={customDialog.buttons}
        onClose={() => setCustomDialog((prev) => ({ ...prev, isOpen: false }))}
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
