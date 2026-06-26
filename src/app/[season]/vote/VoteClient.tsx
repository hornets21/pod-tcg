"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useParams } from "next/navigation";
import type { Group } from "three";
import { Card } from "@/components/Card";
import { FullArtCard } from "@/components/FullArtCard";
import { ThreeScene } from "@/components/three/ThreeScene";
import { useGacha } from "@/hooks/useGacha";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Card as CardType } from "@/data/types";

interface VoteState {
  leftId: string | null;
  rightId: string | null;
  leftScore: number;
  rightScore: number;
  seconds: number;
  duration: number;
  recent: Array<{
    leftName: string;
    rightName: string;
    leftScore: number;
    rightScore: number;
  }>;
}

type TimerStatus = "idle" | "running" | "paused" | "ended";

const DEFAULT_DURATION = 60;
const initialVoteState: VoteState = {
  leftId: null,
  rightId: null,
  leftScore: 0,
  rightScore: 0,
  seconds: DEFAULT_DURATION,
  duration: DEFAULT_DURATION,
  recent: [],
};

function pickTwoCards(cards: CardType[]) {
  if (cards.length < 2) return null;
  const leftIndex = Math.floor(Math.random() * cards.length);
  let rightIndex = Math.floor(Math.random() * cards.length);

  while (rightIndex === leftIndex) {
    rightIndex = Math.floor(Math.random() * cards.length);
  }

  return {
    left: cards[leftIndex],
    right: cards[rightIndex],
  };
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function CardWheel({
  cards,
  spinKey,
}: {
  cards: CardType[];
  spinKey: number;
}) {
  const groupRef = useRef<Group>(null);
  const sample = useMemo(() => cards.slice(0, 12), [cards]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetSpeed = spinKey > 0 ? 1.8 : 0.28;
    groupRef.current.rotation.y += delta * targetSpeed;
    groupRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.035;
  });

  return (
    <group ref={groupRef}>
      {sample.map((card, index) => {
        const angle = (index / sample.length) * Math.PI * 2;
        const rarityBoost = ["LEG", "SEC", "UR", "SSR"].includes(card.rarity) ? 0.22 : 0;
        return (
          <mesh
            key={card.role_id}
            position={[Math.cos(angle) * 2.25, Math.sin(angle) * 1.08, Math.sin(angle) * 0.45]}
            rotation={[0, -angle + Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.46, 0.66, 0.035]} />
            <meshStandardMaterial
              color={card.rarity === "C" ? "#9ca3af" : card.rarity === "R" ? "#4caf50" : "#00d2ff"}
              emissive={card.rarity === "C" ? "#111827" : "#00d2ff"}
              emissiveIntensity={0.14 + rarityBoost}
              roughness={0.34}
              metalness={0.18}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[1.45, 0.025, 12, 96]} />
        <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.42} />
      </mesh>
    </group>
  );
}

export default function VoteClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { gachaPool, isLoaded } = useGacha(season);
  const [storedState, setStoredState, isVoteLoaded] = useLocalStorage<VoteState>(
    `pod-tcg-vote-${season}`,
    initialVoteState
  );
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [spinKey, setSpinKey] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const playableCards = useMemo(() => gachaPool.filter((card) => card.isGacha === "Y"), [gachaPool]);
  const leftCard = playableCards.find((card) => card.role_id === storedState.leftId) || null;
  const rightCard = playableCards.find((card) => card.role_id === storedState.rightId) || null;
  const CardComponent = season === "season2" ? FullArtCard : Card;
  const canPlay = playableCards.length >= 2;

  const stopTimer = useCallback(() => {
    if (intervalRef.current === null) return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const setScores = useCallback((side: "left" | "right", delta: number) => {
    setStoredState((current) => {
      const key = side === "left" ? "leftScore" : "rightScore";
      return {
        ...current,
        [key]: current[key] + delta,
      };
    });
  }, [setStoredState]);

  const saveRecentRound = useCallback(() => {
    if (!leftCard || !rightCard) return;
    setStoredState((current) => ({
      ...current,
      recent: [
        {
          leftName: leftCard.name,
          rightName: rightCard.name,
          leftScore: current.leftScore,
          rightScore: current.rightScore,
        },
        ...current.recent,
      ].slice(0, 5),
    }));
  }, [leftCard, rightCard, setStoredState]);

  const randomizeMatch = useCallback(() => {
    const picked = pickTwoCards(playableCards);
    if (!picked) return;
    stopTimer();
    setSpinKey((current) => current + 1);
    setTimerStatus("idle");
    setStoredState((current) => ({
      ...current,
      leftId: picked.left.role_id,
      rightId: picked.right.role_id,
      leftScore: 0,
      rightScore: 0,
      seconds: current.duration,
    }));
  }, [playableCards, setStoredState, stopTimer]);

  const startTimer = useCallback(() => {
    if (!leftCard || !rightCard || storedState.seconds <= 0 || intervalRef.current !== null) return;
    setTimerStatus("running");
    intervalRef.current = window.setInterval(() => {
      setStoredState((current) => {
        const nextSeconds = Math.max(0, current.seconds - 1);
        if (nextSeconds === 0) {
          stopTimer();
          setTimerStatus("ended");
        }
        return {
          ...current,
          seconds: nextSeconds,
        };
      });
    }, 1000);
  }, [leftCard, rightCard, setStoredState, stopTimer, storedState.seconds]);

  const pauseTimer = useCallback(() => {
    stopTimer();
    setTimerStatus("paused");
  }, [stopTimer]);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimerStatus("idle");
    setStoredState((current) => ({
      ...current,
      seconds: current.duration,
    }));
  }, [setStoredState, stopTimer]);

  const updateDuration = useCallback((value: string) => {
    const duration = Math.max(10, Math.min(600, Number(value) || DEFAULT_DURATION));
    stopTimer();
    setTimerStatus("idle");
    setStoredState((current) => ({
      ...current,
      duration,
      seconds: duration,
    }));
  }, [setStoredState, stopTimer]);

  const selectCard = useCallback((side: "left" | "right", cardId: string) => {
    setStoredState((current) => {
      const otherId = side === "left" ? current.rightId : current.leftId;
      if (cardId === otherId) return current;
      return {
        ...current,
        [side === "left" ? "leftId" : "rightId"]: cardId,
      };
    });
  }, [setStoredState]);

  const clearBoard = useCallback(() => {
    stopTimer();
    setTimerStatus("idle");
    setStoredState({
      ...initialVoteState,
      duration: storedState.duration,
      seconds: storedState.duration,
      recent: storedState.recent,
    });
  }, [setStoredState, stopTimer, storedState.duration, storedState.recent]);

  if (!isLoaded || !isVoteLoaded) {
    return <div className="vote-loading">กำลังโหลดบอร์ดโหวต...</div>;
  }

  return (
    <div className="vote-page">
      <ThreeScene cameraPosition={[0, 0, 7]} fogColor="#07060a" showDefaultLighting={false} showAtmosphere={true}>
        {null}
      </ThreeScene>

      <main className="vote-shell">
        <section className="vote-hero active" aria-labelledby="vote-title">
          <div className="vote-title-block">
            <p className="vote-kicker">POD TCG ARENA</p>
            <h1 id="vote-title">บอร์ดโหวตการ์ด 1v1</h1>
            <p>สุ่มการ์ดสองใบ จับเวลา แล้วกดคะแนนระหว่างโหวตหน้างานหรือแชร์จอใน Discord</p>
          </div>

          <div className="vote-wheel-panel" aria-label="วงล้อสุ่มการ์ด">
            <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }} dpr={[1, 1.6]}>
              <ambientLight intensity={0.8} />
              <pointLight position={[2, 2, 4]} intensity={12} color="#00d2ff" />
              <CardWheel cards={playableCards} spinKey={spinKey} />
            </Canvas>
          </div>
        </section>

        {!canPlay ? (
          <div className="vote-empty">
            <h2>ยังสุ่มแข่งไม่ได้</h2>
            <p>ต้องมีการ์ดที่เปิดกาชาได้อย่างน้อย 2 ใบในซีซันนี้</p>
          </div>
        ) : (
          <>
            <section className="vote-controls active" aria-label="ตัวควบคุมรอบโหวต">
              <button type="button" className="vote-primary" onClick={randomizeMatch}>
                สุ่มคู่แข่ง
              </button>
              <label>
                เวลา
                <input
                  type="number"
                  min="10"
                  max="600"
                  step="10"
                  value={storedState.duration}
                  onChange={(event) => updateDuration(event.target.value)}
                />
              </label>
              <div className={`vote-clock ${timerStatus}`}>
                <span>{formatClock(storedState.seconds)}</span>
                <small>{timerStatus === "running" ? "กำลังจับเวลา" : timerStatus === "ended" ? "หมดเวลา" : "พร้อมเริ่ม"}</small>
              </div>
              <div className="vote-timer-actions">
                {timerStatus === "running" ? (
                  <button type="button" onClick={pauseTimer}>พัก</button>
                ) : (
                  <button type="button" onClick={startTimer} disabled={!leftCard || !rightCard || storedState.seconds <= 0}>เริ่ม</button>
                )}
                <button type="button" onClick={resetTimer}>รีเซ็ตเวลา</button>
                <button type="button" onClick={saveRecentRound} disabled={!leftCard || !rightCard}>บันทึกรอบ</button>
                <button type="button" onClick={clearBoard}>ล้างบอร์ด</button>
              </div>
            </section>

            <section className="vote-board active" aria-label="บอร์ดคะแนน">
              {(["left", "right"] as const).map((side) => {
                const card = side === "left" ? leftCard : rightCard;
                const score = side === "left" ? storedState.leftScore : storedState.rightScore;
                return (
                  <article key={side} className={`vote-lane ${side}`}>
                    <select
                      value={card?.role_id || ""}
                      onChange={(event) => selectCard(side, event.target.value)}
                      aria-label={side === "left" ? "เลือกการ์ดฝั่งซ้าย" : "เลือกการ์ดฝั่งขวา"}
                    >
                      <option value="">เลือกการ์ด</option>
                      {playableCards.map((option) => (
                        <option key={option.role_id} value={option.role_id}>
                          {option.rarity} - {option.name}
                        </option>
                      ))}
                    </select>

                    <div className="vote-card-stage">
                      {card ? (
                        <CardComponent card={card} isRevealed={true} enableHolo={true} />
                      ) : (
                        <div className="vote-card-placeholder">รอเลือกการ์ด</div>
                      )}
                    </div>

                    <div className="vote-score-row">
                      <button type="button" aria-label="ลดคะแนน" onClick={() => setScores(side, -1)}>-</button>
                      <strong>{score}</strong>
                      <button type="button" aria-label="เพิ่มคะแนน" onClick={() => setScores(side, 1)}>+</button>
                    </div>
                    {score < 0 && (
                      <p className="vote-negative-note">คะแนนติดลบแล้วนะ ทรงนี้โดนโหวตให้กลับบ้าน</p>
                    )}
                  </article>
                );
              })}
            </section>

            {storedState.recent.length > 0 && (
              <section className="vote-recent active" aria-label="ประวัติรอบล่าสุด">
                <h2>รอบล่าสุด</h2>
                <div className="vote-recent-list">
                  {storedState.recent.map((round, index) => (
                    <div key={`${round.leftName}-${round.rightName}-${index}`} className="vote-recent-item">
                      <span>{round.leftName}</span>
                      <strong>{round.leftScore} - {round.rightScore}</strong>
                      <span>{round.rightName}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        .vote-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(145deg, #07060a 0%, #11101a 54%, #040306 100%);
        }

        .vote-shell {
          position: relative;
          z-index: 1;
          width: min(100%, 1440px);
          padding: 6rem 1.25rem 4rem;
        }

        .vote-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          align-items: center;
          gap: clamp(1.5rem, 4vw, 4rem);
          min-height: 300px;
          margin-bottom: 1.5rem;
        }

        .vote-kicker {
          color: rgba(0, 210, 255, 0.78);
          font: 600 0.8rem var(--font-chakra), sans-serif;
          letter-spacing: 0.12em;
          margin-bottom: 0.75rem;
        }

        .vote-title-block h1 {
          max-width: 720px;
          color: #fff;
          font: 700 clamp(2rem, 4vw, 3.25rem) var(--font-chakra), sans-serif;
          letter-spacing: -0.035em;
          line-height: 1.05;
          margin-bottom: 0.85rem;
          text-wrap: balance;
        }

        .vote-title-block p:last-child {
          max-width: 58ch;
          color: rgba(255, 255, 255, 0.78);
          font-size: 1rem;
          line-height: 1.7;
        }

        .vote-wheel-panel {
          height: 280px;
          border: 1px solid rgba(0, 210, 255, 0.16);
          border-radius: 14px;
          background: radial-gradient(circle at 50% 45%, rgba(0, 210, 255, 0.12), rgba(255, 255, 255, 0.035) 45%, rgba(0, 0, 0, 0.16));
          overflow: hidden;
        }

        .vote-controls,
        .vote-recent {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.045);
        }

        .vote-controls label {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          min-height: 44px;
          color: rgba(255, 255, 255, 0.78);
          font-weight: 600;
        }

        .vote-controls input,
        .vote-lane select {
          min-height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          background: rgba(5, 4, 8, 0.84);
          color: #fff;
          font: 400 0.95rem var(--font-kanit), sans-serif;
          padding: 0 0.8rem;
        }

        .vote-controls input {
          width: 90px;
        }

        .vote-primary,
        .vote-timer-actions button,
        .vote-score-row button {
          min-height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
          cursor: pointer;
          font: 600 0.94rem var(--font-kanit), sans-serif;
          transition: background var(--motion-fast) var(--ease-out-quart), border-color var(--motion-fast) var(--ease-out-quart), transform var(--motion-fast) var(--ease-out-quart);
        }

        .vote-primary {
          border-color: transparent;
          background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          padding: 0 1.45rem;
        }

        .vote-timer-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .vote-timer-actions button {
          padding: 0 1rem;
        }

        .vote-timer-actions button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .vote-primary:hover,
        .vote-timer-actions button:not(:disabled):hover,
        .vote-score-row button:hover {
          border-color: rgba(0, 210, 255, 0.34);
          background-color: rgba(0, 210, 255, 0.12);
        }

        .vote-primary:active,
        .vote-timer-actions button:not(:disabled):active,
        .vote-score-row button:active {
          transform: translateY(1px) scale(0.985);
        }

        .vote-clock {
          display: grid;
          min-width: 132px;
          min-height: 58px;
          place-items: center;
          padding: 0.45rem 0.8rem;
          border: 1px solid rgba(0, 210, 255, 0.18);
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.24);
        }

        .vote-clock span {
          color: #fff;
          font: 700 1.35rem var(--font-chakra), sans-serif;
          letter-spacing: 0;
        }

        .vote-clock small {
          color: rgba(255, 255, 255, 0.62);
          font-size: 0.72rem;
        }

        .vote-clock.ended {
          border-color: rgba(255, 215, 0, 0.44);
        }

        .vote-board {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1rem, 3vw, 2rem);
          align-items: stretch;
        }

        .vote-lane {
          display: grid;
          grid-template-rows: auto minmax(430px, 1fr) auto;
          gap: 1rem;
          min-width: 0;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
        }

        .vote-lane.left {
          border-color: rgba(0, 210, 255, 0.16);
        }

        .vote-lane.right {
          border-color: rgba(255, 215, 0, 0.18);
        }

        .vote-lane select {
          width: 100%;
        }

        .vote-card-stage {
          display: grid;
          place-items: center;
          min-height: 430px;
          overflow: hidden;
        }

        .vote-card-placeholder {
          display: grid;
          place-items: center;
          width: min(100%, 260px);
          aspect-ratio: 5 / 7;
          border: 1px dashed rgba(255, 255, 255, 0.18);
          border-radius: 18px;
          color: rgba(255, 255, 255, 0.58);
          background: rgba(0, 0, 0, 0.24);
        }

        .vote-score-row {
          display: grid;
          grid-template-columns: 64px minmax(80px, 1fr) 64px;
          align-items: center;
          gap: 0.75rem;
        }

        .vote-score-row strong {
          color: #fff;
          font: 700 3rem var(--font-chakra), sans-serif;
          line-height: 1;
          text-align: center;
        }

        .vote-negative-note {
          margin-top: -0.35rem;
          color: #ff9aa3;
          font-size: 0.86rem;
          line-height: 1.5;
          text-align: center;
        }

        .vote-score-row button {
          width: 64px;
          height: 54px;
          border-radius: 14px;
          font-size: 1.6rem;
        }

        .vote-recent {
          display: grid;
          margin-top: 1rem;
        }

        .vote-recent h2 {
          font-size: 1rem;
          font-weight: 600;
        }

        .vote-recent-list {
          display: grid;
          gap: 0.5rem;
          width: 100%;
        }

        .vote-recent-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          gap: 1rem;
          align-items: center;
          min-height: 44px;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.18);
        }

        .vote-recent-item span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255, 255, 255, 0.74);
        }

        .vote-recent-item span:last-child {
          text-align: right;
        }

        .vote-empty,
        .vote-loading {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          min-height: 60vh;
          padding: 2rem;
          text-align: center;
          color: #fff;
        }

        .vote-empty {
          border: 1px dashed rgba(255, 255, 255, 0.16);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.035);
        }

        @media (max-width: 980px) {
          .vote-hero,
          .vote-board {
            grid-template-columns: 1fr;
          }

          .vote-shell {
            padding-top: 2rem;
          }
        }

        @media (max-width: 640px) {
          .vote-wheel-panel {
            height: 220px;
          }

          .vote-lane {
            grid-template-rows: auto minmax(360px, 1fr) auto;
            padding: 0.75rem;
          }

          .vote-card-stage {
            min-height: 360px;
          }

          .vote-score-row {
            grid-template-columns: 54px minmax(70px, 1fr) 54px;
          }

          .vote-score-row button {
            width: 54px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vote-primary,
          .vote-timer-actions button,
          .vote-score-row button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
