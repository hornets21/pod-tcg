"use client";

import { useCallback, useEffect, useState } from "react";
import { Card as CardType, Rarity } from "../../data/types";
import { CardMesh } from "./CardMesh";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface CardRevealThreeProps {
  cards: CardType[];
  season: string;
  // Kept for API compatibility with PackRipOverlay3D; the reveal is driven
  // entirely by timers below, so this is currently unused.
  isInteractive?: boolean;
  onHighRarityImpact?: () => void;
  onComplete?: () => void;
  // Kept for API compatibility; the auto-open flow drives the *pack tear*
  // automatically, but the *card reveals* are still paced via timers here.
  autoReveal?: boolean;
}

const SPECIAL_ROLE_ID = "1513261078321172833";
const ALL_RARITIES: Rarity[] = ["C", "R", "SR", "SSR", "UR", "SEC", "LEG"];
// First card flips 900ms after CardRevealThree mounts; each next card flips
// 850ms later. Matches the pre-story-mode flow so the player gets a clear
// sequential reveal of all five pulled cards.
const FIRST_REVEAL_TIME = 900;
const CARD_REVEAL_INTERVAL = 850;
const HIGH_RARITY_TIERS = new Set(["LEG", "SEC", "UR", "SSR"]);

export function CardRevealThree({
  cards,
  season,
  isInteractive,
  onHighRarityImpact,
  onComplete,
  autoReveal,
}: CardRevealThreeProps) {
  void isInteractive;
  void autoReveal;

  const [revealedStates, setRevealedStates] = useState<boolean[]>(() =>
    new Array(cards.length).fill(false),
  );
  const { playSFX } = useAudio();

  // Pre-calculate fake rarities for special card so the special-card aura
  // shimmers through a randomized rarity badge before settling.
  const [fakeRarities] = useState<Rarity[]>(() =>
    cards.map((card) => {
      if (card.role_id === SPECIAL_ROLE_ID) {
        return ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)];
      }
      return card.rarity;
    }),
  );

  // Stable callback to surface high-rarity impacts to the parent (used to
  // pulse the rarity flash + heavy SFX timing).
  const handleHighRarityImpact = useCallback(
    (card: CardType) => {
      if (
        card.role_id === SPECIAL_ROLE_ID ||
        HIGH_RARITY_TIERS.has(card.rarity)
      ) {
        onHighRarityImpact?.();
      }
    },
    [onHighRarityImpact],
  );

  useEffect(() => {
    if (cards.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    cards.forEach((card, index) => {
      const delay = FIRST_REVEAL_TIME + index * CARD_REVEAL_INTERVAL;
      const timer = setTimeout(() => {
        setRevealedStates((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });

        const isSpecialCard = card.role_id === SPECIAL_ROLE_ID;
        if (isSpecialCard) {
          playSFX(AUDIO_URLS.IMPACT_HEAVY, 0.2);
        } else if (HIGH_RARITY_TIERS.has(card.rarity)) {
          playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.15);
        } else {
          playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.1);
        }

        handleHighRarityImpact(card);

        if (index === cards.length - 1) {
          // Give the last card's flip a moment to settle before signaling
          // completion so the parent doesn't yank the camera mid-flip.
          const completionTimer = setTimeout(() => onComplete?.(), 420);
          timers.push(completionTimer);
        }
      }, delay);

      timers.push(timer);
    });

    return () => timers.forEach((t) => clearTimeout(t));
  }, [cards, onComplete, playSFX, handleHighRarityImpact]);

  return (
    <group>
      {cards.map((card, index) => {
        const isSpecial = card.role_id === SPECIAL_ROLE_ID;
        const displayRarity = fakeRarities[index];
        const displayCard = { ...card, rarity: displayRarity };

        return (
          <CardMesh
            key={`${card.role_id}-${index}`}
            card={displayCard}
            index={index}
            total={cards.length}
            isEntered={true}
            isCarouselLayout={false}
            isRevealed={revealedStates[index]}
            isSpecial={isSpecial}
            season={season}
          />
        );
      })}
    </group>
  );
}
