"use client";

import { useState, useEffect } from "react";
import { Card as CardType, Rarity } from "../../data/types";
import { CardMesh } from "./CardMesh";
import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface CardRevealThreeProps {
  cards: CardType[];
  season: string;
  onHighRarityImpact?: () => void;
}

const SPECIAL_ROLE_ID = "1356458345812459611";
const ALL_RARITIES: Rarity[] = ["C", "R", "SR", "SSR", "UR", "SEC", "LEG"];
const FIRST_REVEAL_TIME = 900;
const CARD_REVEAL_INTERVAL = 850;

export function CardRevealThree({
  cards,
  season,
  onHighRarityImpact,
}: CardRevealThreeProps) {
  const [revealedStates, setRevealedStates] = useState<boolean[]>(() =>
    new Array(cards.length).fill(false)
  );
  const { playSFX } = useAudio();

  // Pre-calculate fake rarities for special card
  const [fakeRarities] = useState<Rarity[]>(() =>
    cards.map((card) => {
      if (card.role_id === SPECIAL_ROLE_ID) {
        return ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)];
      }
      return card.rarity;
    })
  );

  useEffect(() => {
    if (cards.length === 0) return;
    const timers: NodeJS.Timeout[] = [];

    cards.forEach((card, index) => {
      const delay = FIRST_REVEAL_TIME + index * CARD_REVEAL_INTERVAL;
      const timer = setTimeout(() => {
        setRevealedStates((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });

        const isHighRarity = ["LEG", "SEC", "UR", "SSR"].includes(card.rarity);
        const isSpecialCard = card.role_id === SPECIAL_ROLE_ID;

        if (isSpecialCard) {
          playSFX(AUDIO_URLS.IMPACT_HEAVY, 0.2);
        } else if (isHighRarity) {
          playSFX(AUDIO_URLS.CARD_REVEAL_GOLD, 0.15);
        } else {
          playSFX(AUDIO_URLS.CARD_REVEAL_NORMAL, 0.1);
        }

        if (isHighRarity) onHighRarityImpact?.();
      }, delay);

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [cards, onHighRarityImpact, playSFX]);

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
