"use client";

import React from "react";
import { Card } from "./Card";
import { FullArtCard } from "./FullArtCard";
import { Card as CardType } from "../data/types";

// --- 1. LOGOUT DIALOG ---
interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="logout-dialog-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="logout-dialog-box">
        <div className="logout-dialog-icon"></div>
        <h3>ออกจากระบบ</h3>
        <p>คุณต้องการออกจากระบบใช่หรือไม่?</p>
        <div className="logout-dialog-actions">
          <button className="logout-btn-cancel" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="logout-btn-confirm" onClick={onConfirm}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. GOD PACK DIALOG ---
interface GodPackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GodPackDialog: React.FC<GodPackDialogProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="godpack-dialog-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="godpack-dialog-box">
        <div className="godpack-stars">✦ ✦ ✦</div>
        <div className="godpack-title">GOD PACK</div>
        <div className="godpack-subtitle">DETECTED!</div>
        <p className="godpack-desc">
          คุณได้รับ God Pack!
          <br />
          การ์ดทุกใบในซองนี้คือ SR ขึ้นไปทั้งหมด!
        </p>
        <button className="godpack-btn" onClick={onClose}>
          รับการ์ด!
        </button>
      </div>
    </div>
  );
};

// --- 3. PRIVACY POLICY MODAL ---
interface PolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appVersion: string;
}

export const PolicyDialog: React.FC<PolicyDialogProps> = ({
  isOpen,
  onClose,
  appVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content policy-modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Close policy">
          <span className="modal-close-icon">&times;</span>
        </button>
        <h3 style={{ marginBottom: "1.25rem", color: "var(--accent)", fontSize: "1.6rem", fontWeight: "600", textShadow: "0 0 10px var(--accent-glow)" }}>
          นโยบายความเป็นส่วนตัว
        </h3>
        <p className="policy-desc-box">
          การเข้าสู่ระบบด้วย Discord เป็นเพียงการแสดงผล <b>ชื่อ</b>, <b>ภาพอวตาร</b> และ <b>ยศ</b>
          ของผู้ใช้จากเซิร์ฟเวอร์ <span style={{ color: "#00d2ff", fontWeight: "bold" }}>&quot;กองบัญชาการชาวปด&quot;</span>
          เท่านั้น
          <br />
          <br />
          ระบบ<u>ไม่มี</u>การจัดเก็บข้อมูลใดๆ ของท่านลงในฐานข้อมูล
        </p>
        <div id="app-version" style={{ marginTop: "1.25rem", fontSize: "0.85em", color: "rgba(255,255,255,0.4)" }}>
          Version {appVersion}
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: "1.25rem", padding: "10px 35px", fontSize: "0.95rem", borderRadius: "50px" }}
          onClick={onClose}
        >
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
};

// --- 4. CARD DETAIL DIALOG ---
interface CardDetailDialogProps {
  isOpen: boolean;
  card: CardType | null;
  onClose: () => void;
  season?: string;
}

export const CardDetailDialog: React.FC<CardDetailDialogProps> = ({
  isOpen,
  card,
  onClose,
  season = "season1",
}) => {
  if (!isOpen || !card) return null;

  const CardComponent = season === "season2" ? FullArtCard : Card;

  return (
    <div
      className="modal"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-content rarity-${card.rarity.toLowerCase()}-modal`}>
        <button className="modal-close" onClick={onClose} aria-label="Close details">
          <span className="modal-close-icon">&times;</span>
        </button>
        <div className="detail-container">
          <div className="modal-card-wrapper">
            <CardComponent card={card} isRevealed={true} enableHolo={true} />
          </div>
          <div className="detail-info">
            <h2 className={`rarity-${card.rarity}`}>{card.name}</h2>
            <div className="detail-stats">
              <p style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>ระดับ:</strong>{" "}
                <span className={`rarity-tag ${card.rarity.toLowerCase()}`}>
                  {card.rarity}
                </span>
              </p>
              <div style={{ marginTop: "10px" }}>
                <strong style={{ display: "block", marginBottom: "8px", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.95rem" }}>ความสามารถ:</strong>
                <div className="detail-ability-box">{card.ability || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. CUSTOM DIALOG ---
export interface DialogButton {
  text: string;
  onClick: () => void;
  className?: string;
}

interface CustomDialogProps {
  isOpen: boolean;
  icon: string;
  title: string;
  message: string;
  buttons: DialogButton[];
  onClose: () => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  icon,
  title,
  message,
  buttons,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: "420px", textAlign: "center", border: "1px solid rgba(0, 210, 255, 0.2)" }}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">
          <span className="modal-close-icon">&times;</span>
        </button>
        <div id="dialog-icon" style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          {icon}
        </div>
        <h3 id="dialog-title" style={{ marginBottom: "0.5rem", color: "var(--accent)", fontSize: "1.5rem", fontWeight: "600", textShadow: "0 0 8px var(--accent-glow)" }}>
          {title}
        </h3>
        <p id="dialog-message" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.8)", lineHeight: "1.6", marginBottom: "1.75rem" }}>
          {message}
        </p>
        <div id="dialog-buttons" style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              className={btn.className || "btn-primary"}
              style={
                !btn.className
                  ? { padding: "10px 25px", fontSize: "0.9rem", borderRadius: "50px" }
                  : {}
              }
              onClick={btn.onClick}
            >
              {btn.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
