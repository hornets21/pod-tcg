"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHouseContext } from "./HouseContext";
import { HOUSE_IDS, HOUSES, HouseId } from "../data/houses";

interface SortingHatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "idle" | "sorting" | "result";

const SPIN_DURATION_MS = 3200;
const SPIN_TURNS = 5;
const SEG = 360 / HOUSE_IDS.length;

export const SortingHatModal: React.FC<SortingHatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { current, roll } = useHouseContext();
  const [phase, setPhase] = useState<Phase>("idle");
  const [spinAngle, setSpinAngle] = useState(0);
  const [resultId, setResultId] = useState<HouseId | null>(null);
  const spinRef = useRef(0);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearSpinTimer = useCallback(() => {
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearSpinTimer();
      const t = setTimeout(() => {
        setPhase("idle");
        setResultId(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, clearSpinTimer]);

  useEffect(() => () => clearSpinTimer(), [clearSpinTimer]);

  const startSort = useCallback(() => {
    const picked = roll();
    const w = HOUSE_IDS.indexOf(picked);
    const offset = (360 - w * SEG) % 360;
    const start = spinRef.current;
    const base = Math.ceil(start / 360) * 360;
    const target = base + 360 * SPIN_TURNS + offset;

    setPhase("sorting");
    setResultId(null);
    setSpinAngle(start);

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        spinRef.current = target;
        setSpinAngle(target);
      });
    });

    spinTimerRef.current = setTimeout(() => {
      setResultId(picked);
      setPhase("result");
    }, SPIN_DURATION_MS);
  }, [roll]);

  const resultHouse = phase === "result" && resultId ? HOUSES[resultId] : null;

  if (!isOpen) return null;

  const conicGradient = `conic-gradient(
    from -${SEG / 2}deg,
    ${HOUSE_IDS.map((id, i) => {
      const from = i * SEG;
      const to = (i + 1) * SEG;
      const c = HOUSES[id].colors.accent;
      const d = "rgba(255, 245, 220, 0.55)";
      return `${c} ${from}deg ${to - 1.2}deg, ${d} ${to - 1.2}deg ${to}deg`;
    }).join(", ")}
  )`;

  return (
    <div
      className="sorting-hat-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== "sorting") onClose();
      }}
    >
      <span className="sorting-hat-dust d1" />
      <span className="sorting-hat-dust d2" />
      <span className="sorting-hat-dust d3" />
      <span className="sorting-hat-dust d4" />
      <span className="sorting-hat-dust d5" />
      <span className="sorting-hat-dust d6" />
      <div className="sorting-hat-box">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close sorting hat"
          disabled={phase === "sorting"}
          style={{ opacity: phase === "sorting" ? 0.4 : 1 }}
        >
          <span className="modal-close-icon">&times;</span>
        </button>

        {phase !== "result" && (
          <div
            className={`sorting-hat-icon${phase === "sorting" ? " is-sorting" : ""}`}
          >
            <img
              src={phase === "sorting" ? "/hat_action_animated.webp" : "/hat_talk_animated.webp"}
              alt="หมวกคัดสรร"
              className="sorting-hat-icon-img"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <h3 className="sorting-hat-title">
          {phase === "result" && resultHouse
            ? resultHouse.name
            : phase === "sorting"
              ? "หมวกกำลังตัดสินใจ..."
              : "พิธีคัดสรรบ้าน"}
        </h3>

        <p className="sorting-hat-subtitle">
          {phase === "result" && resultHouse
            ? resultHouse.motto
            : phase === "sorting"
              ? "อย่าเพิ่งตกใจ... หมวกกำลังอ่านใจ"
              : current
                ? (
                  <>
                    บ้านปัจจุบัน: {HOUSES[current].name}{" "}
                    <img
                      src={HOUSES[current].mascot}
                      alt={HOUSES[current].name}
                      style={{ width: "1.2em", height: "1.2em", verticalAlign: "middle", display: "inline-block" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </>
                )
                : "ยังไม่ได้รับการคัดสรร"}
        </p>

        {(phase === "sorting" || phase === "result") && (
          <div className="sorting-hat-stage">
            {phase === "sorting" ? (
              <div className="sorting-hat-wheel-wrap">
                <div className="sorting-hat-pointer" />
                <div
                  className="sorting-hat-wheel"
                  style={{
                    transform: `rotate(${spinAngle}deg)`,
                    transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                    background: conicGradient,
                  }}
                >
                  {HOUSE_IDS.map((id, i) => {
                    const center = i * SEG;
                    const rad = center * (Math.PI / 180);
                    const r = 72;
                    const x = Math.sin(rad) * r;
                    const y = -Math.cos(rad) * r;
                    return (
                      <div
                        key={id}
                        className="sorting-hat-wheel-mascot"
                        style={{
                          transform: `translate(${x}px, ${y}px) rotate(${-spinAngle}deg)`,
                          transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                        }}
                      >
                        <img
                          src={HOUSES[id].mascot}
                          alt={HOUSES[id].name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    );
                  })}
                  <div className="sorting-hat-wheel-hub" />
                </div>
              </div>
            ) : resultHouse ? (
              <img
                src={resultHouse.mascot}
                alt={resultHouse.name}
                className="sorting-hat-result-mascot"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
          </div>
        )}

        <div className="sorting-hat-actions">
          {phase === "sorting" ? (
            <button className="sorting-hat-btn primary" disabled>
              หมวกกำลังอ่านใจ...
            </button>
          ) : phase === "result" && resultHouse ? (
            <>
              <button className="sorting-hat-btn ghost" onClick={onClose}>
                ยืนยันบ้านของฉัน
              </button>
              <button
                className="sorting-hat-btn primary"
                onClick={startSort}
              >
                ให้หมวกตัดสินใจใหม่
              </button>
            </>
          ) : (
            <button
              className="sorting-hat-btn primary"
              onClick={startSort}
            >
              นั่งลงบนเก้าอี้และสวมหมวก
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Note: CSS classes sorting-hat-* are defined in globals.css appended at the end.