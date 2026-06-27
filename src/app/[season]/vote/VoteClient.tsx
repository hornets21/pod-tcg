"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/Card";
import { FullArtCard } from "@/components/FullArtCard";
import { ThreeScene } from "@/components/three/ThreeScene";
import { useGacha } from "@/hooks/useGacha";
import { SelectionSearch } from "@/components/SelectionSearch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Card as CardType } from "@/data/types";
import { CARDS_DELETE } from "@/data/cards-delete";
import { useAudio, AUDIO_URLS } from "@/hooks/useAudio";

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

const DEFAULT_DURATION = 600;
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
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getUniqueRandomWheelCards(): CardType[] {
  const uniqueMap = new Map<string, CardType>();
  CARDS_DELETE.forEach((card) => {
    if (!uniqueMap.has(card.name)) {
      uniqueMap.set(card.name, card);
    }
  });
  return Array.from(uniqueMap.values()).sort(() => Math.random() - 0.5);
}

function VoteBackgroundThree({
  sceneLightFlash,
  isSacrificeMode,
}: {
  sceneLightFlash:
    | "plus-left"
    | "plus-right"
    | "minus-left"
    | "minus-right"
    | null;
  isSacrificeMode: boolean;
}) {
  return (
    <>
      <ambientLight
        intensity={isSacrificeMode ? 0.35 : 0.65}
        color={isSacrificeMode ? "#ff5555" : "#ffffff"}
      />
      <pointLight
        position={[-3, 1, 2]}
        intensity={
          sceneLightFlash === "plus-left"
            ? 15
            : sceneLightFlash === "minus-left"
              ? 0
              : 3
        }
        color={
          sceneLightFlash === "plus-left"
            ? "#00ffcc"
            : sceneLightFlash === "minus-left"
              ? "#ff2200"
              : "#00d2ff"
        }
      />
      <pointLight
        position={[3, 1, 2]}
        intensity={
          sceneLightFlash === "plus-right"
            ? 15
            : sceneLightFlash === "minus-right"
              ? 0
              : 3
        }
        color={
          sceneLightFlash === "plus-right"
            ? "#ffd700"
            : sceneLightFlash === "minus-right"
              ? "#ff2200"
              : "#ffaa00"
        }
      />
    </>
  );
}

export default function VoteClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";
  const { gachaPool, isLoaded, isLoggedIn } = useGacha(season);
  const [storedState, setStoredState, isVoteLoaded] =
    useLocalStorage<VoteState>(`pod-tcg-vote-${season}`, initialVoteState);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<number | null>(null);

  const { playSFX } = useAudio();

  // Floating text score popups
  const [floatingTexts, setFloatingTexts] = useState<
    Array<{
      id: number;
      text: string;
      type: "plus" | "minus";
      side: "left" | "right";
    }>
  >([]);

  // Active effect triggers
  const [leftPulse, setLeftPulse] = useState<"plus" | "minus" | null>(null);
  const [rightPulse, setRightPulse] = useState<"plus" | "minus" | null>(null);

  // Dynamic light flash color state
  const [sceneLightFlash, setSceneLightFlash] = useState<
    "plus-left" | "plus-right" | "minus-left" | "minus-right" | null
  >(null);

  const [isSacrificeMode] = useState(true);

  // Presentation Slider States
  const [slideIndex, setSlideIndex] = useState(0);

  // Guest Collection hook
  const [, setCollection] = useLocalStorage<string[]>(
    `pod_collection_${season}`,
    [],
  );

  const playableCards = useMemo(
    () => gachaPool.filter((card) => card.isGacha === "Y"),
    [gachaPool],
  );
  const [wheelCards, setWheelCards] = useState<CardType[]>(() =>
    getUniqueRandomWheelCards(),
  );

  const leftCard =
    playableCards.find((card) => card.role_id === storedState.leftId) || null;
  const rightCard =
    playableCards.find((card) => card.role_id === storedState.rightId) || null;
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

  // Autoplay for slide mode (moves slide to the left automatically)
  useEffect(() => {
    if (wheelCards.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % wheelCards.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [wheelCards.length]);

  const setScores = useCallback(
    (side: "left" | "right", delta: number) => {
      // Validate that cards are selected and timer is running
      if (!leftCard || !rightCard || timerStatus !== "running") {
        return;
      }

      // Play high energy sound effects (non-overlapping with opening, clean and not too loud)
      if (delta > 0) {
        playSFX(AUDIO_URLS.HEAVENLY, 0.12);
      } else {
        playSFX(AUDIO_URLS.SHONEN_SLASH, 0.12);
      }

      // Add floating score popups
      const id = Date.now() + Math.random();
      const text = delta > 0 ? `+${delta}` : `${delta}`;
      const type = delta > 0 ? ("plus" as const) : ("minus" as const);
      setFloatingTexts((prev) => [...prev, { id, text, type, side }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
      }, 1200);

      // Trigger pulse animations
      const setPulse = side === "left" ? setLeftPulse : setRightPulse;
      setPulse(type);
      setSceneLightFlash(`${type}-${side}` as const);
      setTimeout(() => setPulse(null), 500);
      setTimeout(() => setSceneLightFlash(null), 500);

      setStoredState((current) => {
        const key = side === "left" ? "leftScore" : "rightScore";
        return {
          ...current,
          [key]: current[key] + delta,
        };
      });
    },
    [setStoredState, playSFX, leftCard, rightCard, timerStatus],
  );

  const saveRecentRound = useCallback(() => {
    if (!leftCard || !rightCard) return;

    // Pick two new competitor cards
    const picked = pickTwoCards(playableCards);

    // Stop the current timer
    stopTimer();
    setTimerStatus("idle");
    setSlideIndex(0);

    setStoredState((current) => {
      const nextRecent = [
        {
          leftName: leftCard.name,
          rightName: rightCard.name,
          leftScore: current.leftScore,
          rightScore: current.rightScore,
        },
        ...current.recent,
      ].slice(0, 20);

      if (!picked) {
        return {
          ...current,
          recent: nextRecent,
        };
      }

      return {
        ...current,
        leftId: picked.left.role_id,
        rightId: picked.right.role_id,
        leftScore: 0,
        rightScore: 0,
        seconds: current.duration,
        recent: nextRecent,
      };
    });

    // Refresh wheel cards
    setWheelCards(getUniqueRandomWheelCards());
  }, [leftCard, rightCard, playableCards, stopTimer, setStoredState]);

  const clearRecentHistory = useCallback(() => {
    setStoredState((current) => ({
      ...current,
      recent: [],
    }));
  }, [setStoredState]);

  const randomizeMatch = useCallback(() => {
    const picked = pickTwoCards(playableCards);
    if (!picked) return;
    stopTimer();
    setTimerStatus("idle");
    setSlideIndex(0); // Reset slider to first card when pairing changes
    setStoredState((current) => ({
      ...current,
      leftId: picked.left.role_id,
      rightId: picked.right.role_id,
      leftScore: 0,
      rightScore: 0,
      seconds: current.duration,
    }));
    setWheelCards(getUniqueRandomWheelCards());
  }, [playableCards, setStoredState, stopTimer]);

  const startTimer = useCallback(() => {
    if (
      !leftCard ||
      !rightCard ||
      storedState.seconds <= 0 ||
      intervalRef.current !== null
    )
      return;
    setTimerStatus("running");
    intervalRef.current = window.setInterval(() => {
      setStoredState((current) => {
        const nextSeconds = Math.max(0, current.seconds - 1);
        if (nextSeconds === 0) {
          stopTimer();
          setTimerStatus("ended");

          // Trigger deletion directly inside the interval callback
          if (isSacrificeMode) {
            let loserCardId: string | null = null;
            if (current.leftScore > current.rightScore) {
              loserCardId = current.rightId;
            } else if (current.rightScore > current.leftScore) {
              loserCardId = current.leftId;
            }

            if (loserCardId && !isLoggedIn) {
              setCollection((prev) => prev.filter((id) => id !== loserCardId));
            }
          }
        }
        return {
          ...current,
          seconds: nextSeconds,
        };
      });
    }, 1000);
  }, [
    leftCard,
    rightCard,
    storedState.seconds,
    isSacrificeMode,
    isLoggedIn,
    setCollection,
    stopTimer,
    setStoredState,
  ]);

  // Compute sacrificed card name dynamically
  const sacrificedCardName = useMemo(() => {
    if (timerStatus !== "ended" || !isSacrificeMode) return null;
    if (storedState.leftScore > storedState.rightScore) {
      return rightCard?.name || "";
    }
    if (storedState.rightScore > storedState.leftScore) {
      return leftCard?.name || "";
    }
    return null;
  }, [
    timerStatus,
    isSacrificeMode,
    storedState.leftScore,
    storedState.rightScore,
    leftCard,
    rightCard,
  ]);

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

  const updateDuration = useCallback(
    (value: string) => {
      const duration = Math.max(
        10,
        Math.min(7200, Number(value) || DEFAULT_DURATION),
      );
      stopTimer();
      setTimerStatus("idle");
      setStoredState((current) => ({
        ...current,
        duration,
        seconds: duration,
      }));
    },
    [setStoredState, stopTimer],
  );

  const selectCard = useCallback(
    (side: "left" | "right", cardId: string) => {
      setStoredState((current) => {
        const otherId = side === "left" ? current.rightId : current.leftId;
        if (cardId === otherId) return current;
        return {
          ...current,
          [side === "left" ? "leftId" : "rightId"]: cardId,
        };
      });
    },
    [setStoredState],
  );

  const clearBoard = useCallback(() => {
    stopTimer();
    setTimerStatus("idle");
    setStoredState({
      ...initialVoteState,
      leftId: null,
      rightId: null,
      duration: storedState.duration,
      seconds: storedState.duration,
      recent: storedState.recent,
    });
  }, [setStoredState, stopTimer, storedState.duration, storedState.recent]);

  if (!isLoaded || !isVoteLoaded) {
    return <div className="vote-loading">กำลังโหลดบอร์ดโหวต...</div>;
  }

  const isCriticalSeconds =
    timerStatus === "running" && storedState.seconds <= 10;

  return (
    <div
      className={`vote-page ${isSacrificeMode ? "sacrifice-theme" : ""} ${isCriticalSeconds ? "critical-warning" : ""}`}
    >
      <ThreeScene
        cameraPosition={[0, 0, 7]}
        fogColor={isSacrificeMode ? "#0d0202" : "#07060a"}
        showDefaultLighting={false}
        showAtmosphere={true}
      >
        <VoteBackgroundThree
          sceneLightFlash={sceneLightFlash}
          isSacrificeMode={isSacrificeMode}
        />
      </ThreeScene>

      <main className="vote-shell">
        <div className="vote-layout-container">
          <div className="vote-layout-left">
            {!canPlay ? (
              <div className="vote-empty">
                <h2>ยังสุ่มแข่งไม่ได้</h2>
                <p>ต้องมีการ์ดที่เปิดกาชาได้อย่างน้อย 2 ใบในซีซันนี้</p>
              </div>
            ) : (
              <>
                <section
                  className="vote-controls active"
                  aria-label="ตัวควบคุมรอบโหวต"
                >
                  <button
                    type="button"
                    className="vote-primary"
                    onClick={randomizeMatch}
                  >
                    สุ่มคู่แข่ง
                  </button>

                  <label>
                    เวลา (วินาที)
                    <input
                      type="number"
                      min="10"
                      max="7200"
                      step="10"
                      value={storedState.duration}
                      onChange={(event) => updateDuration(event.target.value)}
                    />
                  </label>
                  <div className={`vote-clock ${timerStatus}`}>
                    <span>{formatClock(storedState.seconds)}</span>
                    <small>
                      {timerStatus === "running"
                        ? "กำลังจับเวลา"
                        : timerStatus === "ended"
                          ? "หมดเวลา"
                          : "พร้อมเริ่ม"}
                    </small>
                  </div>
                  <div className="vote-timer-actions">
                    {timerStatus === "running" ? (
                      <button type="button" onClick={pauseTimer}>
                        พัก
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startTimer}
                        disabled={
                          !leftCard || !rightCard || storedState.seconds <= 0
                        }
                      >
                        เริ่ม
                      </button>
                    )}
                    <button type="button" onClick={resetTimer}>
                      รีเซ็ตเวลา
                    </button>
                    <button
                      type="button"
                      onClick={saveRecentRound}
                      disabled={!leftCard || !rightCard}
                    >
                      บันทึกรอบ
                    </button>
                    <button type="button" onClick={clearBoard}>
                      ล้างบอร์ด
                    </button>
                  </div>
                </section>

                <section className="vote-board active" aria-label="บอร์ดคะแนน">
                  {(["left", "right"] as const).map((side) => {
                    const card = side === "left" ? leftCard : rightCard;
                    const score =
                      side === "left"
                        ? storedState.leftScore
                        : storedState.rightScore;

                    // Determine if this side is the loser when timer ends
                    const isLoser =
                      timerStatus === "ended" &&
                      ((side === "left" &&
                        storedState.leftScore < storedState.rightScore) ||
                        (side === "right" &&
                          storedState.rightScore < storedState.leftScore));

                    const pulseEffect =
                      side === "left" ? leftPulse : rightPulse;

                    return (
                      <article key={side} className={`vote-lane ${side}`}>
                        <SelectionSearch
                          value={card?.role_id || ""}
                          onChange={(val) => selectCard(side, val)}
                          options={playableCards}
                          placeholder="เลือกการ์ด"
                          ariaLabel={
                            side === "left"
                              ? "เลือกการ์ดฝั่งซ้าย"
                              : "เลือกการ์ดฝั่งขวา"
                          }
                          side={side}
                        />

                        <div
                          className={`vote-card-stage ${pulseEffect ? `pulse-${pulseEffect}` : ""} ${isLoser && isSacrificeMode ? "card-obliterated" : ""}`}
                        >
                          {/* Floating indicators */}
                          <div className="floating-scores-container">
                            {floatingTexts
                              .filter((t) => t.side === side)
                              .map((t) => (
                                <div
                                  key={t.id}
                                  className={`floating-score-pop ${t.type}`}
                                >
                                  {t.text}
                                </div>
                              ))}
                          </div>

                          {card ? (
                            <>
                              <CardComponent
                                card={card}
                                isRevealed={true}
                                enableHolo={true}
                              />
                              {isLoser && isSacrificeMode && (
                                <div className="obliterated-overlay">
                                  <span className="obliterated-stamp">
                                    DESTROYED
                                  </span>
                                  <span className="obliterated-sub">
                                    การ์ดถูกทำลายแล้ว
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="vote-card-placeholder">
                              รอเลือกการ์ด
                            </div>
                          )}
                        </div>

                        <div className="vote-score-row">
                          <button
                            type="button"
                            aria-label="ลดคะแนน"
                            onClick={() => setScores(side, -1)}
                            disabled={
                              !leftCard ||
                              !rightCard ||
                              timerStatus !== "running"
                            }
                          >
                            -
                          </button>
                          <strong>{score}</strong>
                          <button
                            type="button"
                            aria-label="เพิ่มคะแนน"
                            onClick={() => setScores(side, 1)}
                            disabled={
                              !leftCard ||
                              !rightCard ||
                              timerStatus !== "running"
                            }
                          >
                            +
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              </>
            )}
          </div>

          <div className="vote-layout-right">
            <section className="vote-hero active" aria-labelledby="vote-title">
              <div className="vote-title-block">
                <p className="vote-kicker">
                  {isSacrificeMode
                    ? "🔥 POD DEATHMATCH ARENA"
                    : "POD TCG ARENA"}
                </p>
                <h1 id="vote-title">
                  {isSacrificeMode
                    ? "ศึกสังเวยการ์ด 1v1"
                    : "บอร์ดโหวตการ์ด 1v1"}
                </h1>
                <p>
                  {isSacrificeMode
                    ? "คำเตือน: โหมดสังเวยการ์ดทำงาน! เมื่อหมดเวลา การ์ดที่ได้คะแนนน้อยกว่าจะถูกลบ!"
                    : ""}
                </p>
              </div>

              <div
                className="vote-wheel-panel"
                aria-label="ส่วนแสดงการ์ดโหวต"
                style={{ position: "relative" }}
              >
                <div className="vote-slider-container">
                  {wheelCards.length > 0 && (
                    <div className="vote-slider-wrapper">
                      <div
                        className="vote-slider-track"
                        style={{
                          transform: `translateX(-${slideIndex * 100}%)`,
                        }}
                      >
                        {wheelCards.map((card, idx) => (
                          <div
                            key={`${card.role_id}-${idx}`}
                            className="vote-slider-slide"
                          >
                            <div className="slider-card-glow-wrapper">
                              <CardComponent card={card} isRevealed={true} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {timerStatus === "ended" &&
              isSacrificeMode &&
              sacrificedCardName && (
                <div className="sacrifice-alert" role="alert">
                  <span className="sacrifice-alert-icon">💀</span>
                  <div className="sacrifice-alert-content">
                    <h4>การสังเวยเสร็จสิ้น</h4>
                    <p>
                      การ์ด <strong>{sacrificedCardName}</strong>{" "}
                      ได้รับคะแนนน้อยกว่าและถูกทำลายแล้ว!
                      {isLoggedIn
                        ? " (ระบบจำลองการทำลายการ์ดบนจอ เนื่องจากคุณล็อกอินผ่าน Discord)"
                        : " (การ์ดถูกลบออกจากคอลเลกชันคลังของคุณแล้ว)"}
                    </p>
                  </div>
                </div>
              )}

            {storedState.recent.length > 0 && (
              <section
                className="vote-recent active"
                aria-label="ประวัติรอบล่าสุด"
              >
                <div className="vote-recent-header">
                  <h2>รอบล่าสุด</h2>
                  <button
                    type="button"
                    className="clear-recent-btn"
                    onClick={clearRecentHistory}
                  >
                    ล้างประวัติ
                  </button>
                </div>
                <div className="vote-recent-list">
                  {storedState.recent.map((round, index) => {
                    const isLeftWinner = round.leftScore > round.rightScore;
                    const isRightWinner = round.rightScore > round.leftScore;

                    return (
                      <div
                        key={`${round.leftName}-${round.rightName}-${index}`}
                        className="vote-recent-item"
                      >
                        <span className={isLeftWinner ? "recent-winner" : ""}>
                          {isLeftWinner && "👑 "}
                          {round.leftName}
                        </span>
                        <strong>
                          {round.leftScore < 0 ? (
                            <span className="negative-highlight">
                              {round.leftScore}
                            </span>
                          ) : (
                            round.leftScore
                          )}
                          {" - "}
                          {round.rightScore < 0 ? (
                            <span className="negative-highlight">
                              {round.rightScore}
                            </span>
                          ) : (
                            round.rightScore
                          )}
                        </strong>
                        <span className={isRightWinner ? "recent-winner" : ""}>
                          {round.rightName}
                          {isRightWinner && " 👑"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .vote-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(
            145deg,
            #07060a 0%,
            #11101a 54%,
            #040306 100%
          );
        }

        .vote-shell {
          position: relative;
          z-index: 1;
          width: min(100%, 1440px);
          padding: 6rem 1.25rem 4rem;
          margin: 0 auto;
        }

        .vote-layout-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .vote-layout-left {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }

        .vote-layout-right {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
          position: sticky;
          top: 6rem;
        }

        @media (max-width: 1024px) {
          .vote-layout-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .vote-layout-left {
            order: 2;
          }
          .vote-layout-right {
            order: 1;
            position: static;
          }
        }

        @media (min-width: 1025px) {
          .vote-layout-left {
            order: 1;
          }

          .vote-layout-right {
            order: 2;
          }

          .vote-layout-right .vote-hero {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 1.5rem;
            min-height: auto;
          }

          .vote-layout-right .vote-wheel-panel {
            height: 280px;
          }

          .vote-layout-right .vote-slider-wrapper {
            width: 100%;
            max-width: 300px;
            height: 240px;
            margin: 0 auto;
          }

          .vote-layout-right .vote-slider-slide {
            width: 100%;
            max-width: 300px;
            height: 240px;
          }

          .vote-layout-right .slider-card-glow-wrapper {
            transform: scale(0.42);
          }

          .vote-layout-right
            .vote-slider-container:hover
            .slider-card-glow-wrapper {
            transform: scale(0.45);
          }
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
          font:
            600 0.8rem var(--font-chakra),
            sans-serif;
          letter-spacing: 0.12em;
          margin-bottom: 0.75rem;
        }

        .vote-title-block h1 {
          max-width: 720px;
          color: #fff;
          font:
            700 clamp(2rem, 4vw, 3.25rem) var(--font-chakra),
            sans-serif;
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
          height: 380px;
          overflow: hidden;
        }

        .vote-wheel-panel :global(.card-back) {
          display: none !important;
        }

        .vote-wheel-panel :global(.card-front) {
          transform: none !important;
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
        }

        .vote-wheel-panel :global(.card-inner) {
          transform: none !important;
        }

        .vote-wheel-panel :global(.card) {
          transform: scale(1) !important;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5) !important;
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
          font:
            400 0.95rem var(--font-kanit),
            sans-serif;
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
          font:
            600 0.94rem var(--font-kanit),
            sans-serif;
          transition:
            background var(--motion-fast) var(--ease-out-quart),
            border-color var(--motion-fast) var(--ease-out-quart),
            transform var(--motion-fast) var(--ease-out-quart);
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
          font:
            700 1.35rem var(--font-chakra),
            sans-serif;
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
          position: relative;
          z-index: 10;
        }

        /* 3D Floating Stages */
        .vote-card-stage {
          display: grid;
          place-items: center;
          min-height: 430px;
          position: relative;
          perspective: 1200px;
          transform-style: preserve-3d;
        }

        .vote-lane.left .vote-card-stage {
          animation: floatLeft 6.5s ease-in-out infinite alternate;
        }

        .vote-lane.right .vote-card-stage {
          animation: floatRight 7.5s ease-in-out infinite alternate;
        }

        @keyframes floatLeft {
          0% {
            transform: translateY(0px) rotateY(0deg) rotateX(1deg);
          }
          100% {
            transform: translateY(-10px) rotateY(1.5deg) rotateX(-1deg);
          }
        }

        @keyframes floatRight {
          0% {
            transform: translateY(0px) rotateY(0deg) rotateX(-1deg);
          }
          100% {
            transform: translateY(-12px) rotateY(-1.5deg) rotateX(1deg);
          }
        }

        /* ─── PUNCHY HIT ANIMATIONS ─── */
        .vote-card-stage.pulse-plus {
          animation: pulsePlus 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .vote-card-stage.pulse-plus::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.8) 0%,
            transparent 70%
          );
          border-radius: 24px;
          pointer-events: none;
          z-index: 10;
          animation: flashEffect 0.45s ease-out forwards;
        }

        @keyframes pulsePlus {
          0% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.08) translateY(-10px) rotateX(4deg);
          }
          50% {
            transform: scale(0.97) translateY(1px);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes flashEffect {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          25% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(1.4);
          }
        }

        .vote-card-stage.pulse-minus {
          animation: pulseMinus 0.45s ease-out forwards;
        }

        .vote-card-stage.pulse-minus::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(255, 30, 30, 0.35);
          border-radius: 24px;
          pointer-events: none;
          z-index: 10;
          animation: redFlashEffect 0.45s ease-out forwards;
        }

        @keyframes pulseMinus {
          0% {
            transform: scale(1) translate(0, 0);
          }
          15%,
          45%,
          75% {
            transform: scale(0.96) translate(-5px, 2px) rotate(-1deg);
          }
          30%,
          60%,
          90% {
            transform: scale(0.96) translate(5px, -2px) rotate(1deg);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }

        @keyframes redFlashEffect {
          0% {
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        /* ─── FLOATING SCORE POPUPS ─── */
        .floating-scores-container {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          z-index: 20;
        }

        .floating-score-pop {
          position: absolute;
          font-family: var(--font-chakra), sans-serif;
          font-size: 3.25rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-shadow:
            0 4px 12px rgba(0, 0, 0, 0.8),
            0 0 20px currentColor;
          animation: scoreFloatUp 1s cubic-bezier(0.18, 0.89, 0.32, 1.28)
            forwards;
        }

        .floating-score-pop.plus {
          color: #00ffcc;
        }

        .floating-score-pop.minus {
          color: #ff3c00;
        }

        @keyframes scoreFloatUp {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-10px) scale(1.2);
          }
          80% {
            opacity: 0.8;
            transform: translateY(-60px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-90px) scale(0.85);
          }
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
          font:
            700 3rem var(--font-chakra),
            sans-serif;
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

        .negative-highlight {
          display: inline-block;
          vertical-align: middle;
          background: rgba(255, 60, 0, 0.18);
          border: 1px solid rgba(255, 60, 0, 0.35);
          padding: 1px 6px;
          border-radius: 6px;
          color: #fff;
          font-weight: 700;
          text-shadow: 0 0 8px rgba(255, 60, 0, 0.6);
          margin: 0 2px;
          line-height: 1.2;
        }

        .vote-score-row button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
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
          margin: 0;
        }

        .vote-recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 0.75rem;
        }

        .clear-recent-btn {
          border: 1px solid rgba(255, 60, 0, 0.25);
          background: rgba(255, 60, 0, 0.08);
          color: #ff9aa3;
          border-radius: 8px;
          padding: 4px 10px;
          font-family: var(--font-kanit), sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-recent-btn:hover {
          background: rgba(255, 60, 0, 0.2);
          border-color: rgba(255, 60, 0, 0.45);
          color: #fff;
          box-shadow: 0 0 8px rgba(255, 60, 0, 0.25);
        }

        .clear-recent-btn:active {
          transform: scale(0.96);
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

        .vote-recent-item strong {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          line-height: 1;
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

        .vote-recent-item span.recent-winner {
          color: #ffb700;
          font-weight: 700;
          text-shadow: 0 0 8px rgba(255, 183, 0, 0.45);
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
            height: 360px;
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

        /* ─── SACRIFICE THEME STYLES ─── */
        .vote-page.sacrifice-theme {
          background: linear-gradient(
            145deg,
            #0c0202 0%,
            #1c0505 54%,
            #040000 100%
          );
        }

        .vote-page.sacrifice-theme .vote-lane.left {
          border-color: rgba(255, 60, 0, 0.25);
          box-shadow: 0 0 15px rgba(255, 60, 0, 0.05);
        }

        .vote-page.sacrifice-theme .vote-lane.right {
          border-color: rgba(255, 120, 0, 0.25);
          box-shadow: 0 0 15px rgba(255, 120, 0, 0.05);
        }

        .vote-page.sacrifice-theme .vote-clock {
          border-color: rgba(255, 60, 0, 0.35);
          background: rgba(20, 5, 5, 0.45);
        }

        .vote-page.sacrifice-theme .vote-clock span {
          color: #ff6060;
          text-shadow: 0 0 8px rgba(255, 60, 60, 0.4);
        }

        .vote-page.sacrifice-theme .vote-controls,
        .vote-page.sacrifice-theme .vote-recent {
          border-color: rgba(255, 60, 0, 0.15);
          background: rgba(255, 60, 0, 0.035);
        }

        /* ─── CRITICAL PULSE BORDER ─── */
        .vote-page.critical-warning {
          animation: criticalPulse 1s infinite alternate;
        }

        @keyframes criticalPulse {
          0% {
            box-shadow: inset 0 0 0px transparent;
          }
          100% {
            box-shadow: inset 0 0 40px rgba(255, 0, 0, 0.4);
          }
        }

        /* ─── MODE SELECTOR STYLES ─── */
        .vote-mode-selector {
          display: flex;
          background: rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 3px;
          margin-right: 0.5rem;
        }

        .mode-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 16px;
          border-radius: 17px;
          font-family: var(--font-kanit), sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn.normal.active {
          background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          color: white;
          box-shadow: 0 2px 10px rgba(0, 210, 255, 0.3);
        }

        .mode-btn.sacrifice.active {
          background: linear-gradient(135deg, #ff416c, #ff4b2b);
          color: white;
          box-shadow: 0 2px 10px rgba(255, 65, 108, 0.4);
          animation: buttonPulse 1.5s infinite alternate;
        }

        @keyframes buttonPulse {
          0% {
            box-shadow: 0 2px 10px rgba(255, 65, 108, 0.4);
          }
          100% {
            box-shadow: 0 2px 18px rgba(255, 65, 108, 0.7);
          }
        }

        /* ─── CARD OBLITERATION STYLES ─── */
        .vote-card-stage.card-obliterated {
          position: relative;
          filter: grayscale(1) contrast(1.2) brightness(0.4) blur(1px);
          animation: cardBurn 1.5s ease-out forwards;
        }

        .obliterated-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          z-index: 5;
          pointer-events: none;
        }

        .obliterated-stamp {
          color: #ff3c00;
          border: 4px solid #ff3c00;
          font-family: var(--font-chakra), sans-serif;
          font-size: 2rem;
          font-weight: 900;
          padding: 0.5rem 1rem;
          text-transform: uppercase;
          transform: rotate(-15deg) scale(1);
          letter-spacing: 0.1em;
          text-shadow: 0 0 10px rgba(255, 60, 0, 0.6);
          box-shadow: 0 0 15px rgba(255, 60, 0, 0.4);
          animation: stampAppear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .obliterated-sub {
          color: #ff9aa3;
          font-family: var(--font-kanit), sans-serif;
          font-size: 0.9rem;
          margin-top: 0.8rem;
          text-shadow: 0 0 4px #000;
        }

        @keyframes cardBurn {
          0% {
            box-shadow: 0 0 0px transparent;
          }
          50% {
            box-shadow:
              0 0 30px #ff3c00,
              0 0 10px #ff8c00;
          }
          100% {
            box-shadow: 0 0 15px rgba(255, 60, 0, 0.3);
          }
        }

        @keyframes stampAppear {
          0% {
            transform: rotate(-45deg) scale(4);
            opacity: 0;
          }
          100% {
            transform: rotate(-15deg) scale(1);
            opacity: 1;
          }
        }

        /* ─── SACRIFICE ALERT DIALOG ─── */
        .sacrifice-alert {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 60, 0, 0.12);
          border: 1px solid rgba(255, 60, 0, 0.3);
          border-radius: 14px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          color: #fff;
          font-family: var(--font-kanit), sans-serif;
          animation: slideDown 0.4s ease-out forwards;
        }

        .sacrifice-alert-icon {
          font-size: 2rem;
          animation: pulse 1s infinite alternate;
        }

        .sacrifice-alert-content h4 {
          color: #ff6070;
          font-size: 1.1rem;
          font-weight: bold;
          margin: 0 0 0.25rem 0;
        }

        .sacrifice-alert-content p {
          margin: 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ─── CARD PRESENTATION SLIDER ─── */
        .vote-slider-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .vote-slider-wrapper {
          width: 300px;
          height: 350px;
          position: relative;
          overflow: hidden;
        }

        .vote-slider-track {
          display: flex;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vote-slider-slide {
          flex: 0 0 300px;
          width: 300px;
          height: 350px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .slider-card-glow-wrapper {
          width: 230px;
          height: 330px;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: scale(0.5);
          transform-origin: center center;
          transition: transform 0.3s ease;
        }

        .vote-slider-container:hover .slider-card-glow-wrapper {
          transform: scale(0.55);
        }

        @media (max-width: 640px) {
          .vote-slider-wrapper {
            width: 260px;
            height: 300px;
          }
          .vote-slider-slide {
            flex: 0 0 260px;
            width: 260px;
            height: 300px;
          }
          .slider-card-glow-wrapper {
            transform: scale(0.8);
          }
          .vote-slider-container:hover .slider-card-glow-wrapper {
            transform: scale(0.84);
          }
        }
      `}</style>
    </div>
  );
}
