"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PackVisual } from "../../components/PackVisual";
import { Card } from "../../components/Card";
import { useGacha, RARITY_SUSPENSE_MS } from "../../hooks/useGacha";
import { GodPackDialog } from "../../components/Modals";
import { Card as CardType } from "../../data/types";
import { useModal } from "../../components/ModalContext";

export default function OpeningClient() {
  const params = useParams();
  const season = params.season === "season2" ? "season2" : "season1";

  const { openPack, isLoaded, addToCollection } = useGacha(season);
  const { setSelectedDetailCard } = useModal();

  // Gacha states
  const [isTearing, setIsTearing] = useState(false);
  const [isTorn, setIsTorn] = useState(false);
  const [packCards, setPackCards] = useState<CardType[]>([]);
  const [revealedOpacity, setRevealedOpacity] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [revealedStatus, setRevealedStatus] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [isGodPackOpen, setIsGodPackOpen] = useState(false);
  const [isGodPackEffectActive, setIsGodPackEffectActive] = useState(false);

  const startOpening = async () => {
    if (isTearing) return;

    // Reset card states
    setPackCards([]);
    setRevealedOpacity([false, false, false, false, false]);
    setRevealedStatus([false, false, false, false, false]);
    setIsGodPackEffectActive(false);

    setIsTearing(true);

    // Play tear sound
    const tearSound = new Audio("https://img.lucky-pod.fun/tear.mp3");
    tearSound.play().catch((e) => console.log("Sound play error:", e));

    // Wait for shake, then tear
    await new Promise((r) => setTimeout(r, 500));
    setIsTorn(true);

    // Wait for tear animation to finish
    await new Promise((r) => setTimeout(r, 600));

    const { pack, isGod } = openPack();
    setPackCards(pack);

    if (isGod) {
      setIsGodPackOpen(true);
      setIsGodPackEffectActive(true);
    }

    // Reveal cards one-by-one with dramatic suspense timings
    for (let i = 0; i < pack.length; i++) {
      const card = pack[i];
      const baseDelay = i * 180;
      const jitter = Math.floor(Math.random() * 160) - 80;
      const entryDelay = Math.max(0, baseDelay + jitter);

      const suspense = RARITY_SUSPENSE_MS[card.rarity] ?? 0;
      const suspenseJitter = Math.floor(Math.random() * 200);

      // Fade-in entry
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          setRevealedOpacity((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });

          // Wait suspense duration before auto-reveal flip
          setTimeout(() => {
            setRevealedStatus((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
            addToCollection(card);
            resolve();
          }, 600 + suspense + suspenseJitter);
        }, entryDelay);
      });
    }

    // Reset pack visual state so it can be clicked again
    setIsTearing(false);
    setIsTorn(false);
  };

  const handleCardClick = (card: CardType, index: number) => {
    if (revealedStatus[index]) {
      setSelectedDetailCard(card);
    } else if (revealedOpacity[index]) {
      // Instantly reveal card if user clicks during suspense
      setRevealedStatus((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      addToCollection(card);
    }
  };

  // Safe check if gacha/collection state is loaded from LocalStorage
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
        กำลังโหลดข้อมูลระบบสุ่ม...
      </div>
    );
  }

  return (
    <div className={`main-wrapper ${isGodPackEffectActive ? "god-pack-effect" : ""}`}>
      <main>
        <section id="opening-section" className="active">
          <div className="pack-container">
            <PackVisual
              isTearing={isTearing}
              isTorn={isTorn}
              season={season}
              onClick={startOpening}
            />
          </div>

          <div id="cards-display" className="cards-grid">
            {packCards.map((card, idx) => (
              <Card
                key={`${card.role_id}-${idx}`}
                card={card}
                isRevealed={revealedStatus[idx]}
                enableHolo={true}
                className={revealedOpacity[idx] ? "opacity-visible" : "opacity-hidden"}
                onClick={() => handleCardClick(card, idx)}
              />
            ))}
          </div>
        </section>
      </main>

      <GodPackDialog
        isOpen={isGodPackOpen}
        onClose={() => {
          setIsGodPackOpen(false);
          // Keep body glow active for 5s then clear
          setTimeout(() => setIsGodPackEffectActive(false), 5000);
        }}
      />
    </div>
  );
}
