"use client";

import React from "react";
import { Card, getRarityStars } from "./Card";
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
      style={{ display: "block" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center" }}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h3 style={{ marginBottom: "15px", color: "var(--accent)", fontSize: "1.5rem" }}>
          นโยบายความเป็นส่วนตัว
        </h3>
        <p
          style={{
            fontSize: "1em",
            color: "rgba(255,255,255,0.85)",
            lineHeight: "1.6",
            textAlign: "left",
            background: "rgba(0,0,0,0.2)",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          การเข้าสู่ระบบด้วย Discord เป็นเพียงการแสดงผล <b>ชื่อ</b>, <b>ภาพอวตาร</b> และ <b>ยศ</b>
          ของผู้ใช้จากเซิร์ฟเวอร์ <span style={{ color: "#00d2ff", fontWeight: "bold" }}>"กองบัญชาการชาวปด"</span>
          เท่านั้น
          <br />
          <br />
          ระบบ<u>ไม่มี</u>การจัดเก็บข้อมูลใดๆ ของท่านลงในฐานข้อมูล
        </p>
        <div id="app-version" style={{ marginTop: "15px", fontSize: "0.8em", color: "rgba(255,255,255,0.4)" }}>
          Version {appVersion}
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: "15px", padding: "10px 25px", fontSize: "1em", borderRadius: "30px" }}
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
}

export const CardDetailDialog: React.FC<CardDetailDialogProps> = ({
  isOpen,
  card,
  onClose,
}) => {
  if (!isOpen || !card) return null;

  return (
    <div
      className="modal"
      style={{ display: "block" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <div className="detail-container">
          <div className="modal-card-wrapper">
            <Card card={card} isRevealed={true} enableHolo={true} />
          </div>
          <div className="detail-info">
            <h2 className={`rarity-${card.rarity}`}>{card.name}</h2>
            <div className="detail-stats">
              <p>
                <strong>ระดับ:</strong>{" "}
                <span className={`rarity-tag ${card.rarity.toLowerCase()}`}>
                  {card.rarity}
                </span>
              </p>
              <p style={{ marginTop: "10px" }}>
                <strong>ความสามารถ:</strong>
              </p>
              <div className="detail-ability-box">{card.ability || "—"}</div>
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
      style={{ display: "block" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
        <div id="dialog-icon" style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          {icon}
        </div>
        <h3 id="dialog-title" style={{ marginBottom: "0.5rem", color: "var(--accent)", fontSize: "1.4rem" }}>
          {title}
        </h3>
        <p id="dialog-message" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.85)", lineHeight: "1.5", marginBottom: "1.5rem" }}>
          {message}
        </p>
        <div id="dialog-buttons" style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              className={btn.className || "btn-primary"}
              style={
                !btn.className
                  ? { padding: "8px 20px", fontSize: "0.95rem", borderRadius: "30px" }
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
