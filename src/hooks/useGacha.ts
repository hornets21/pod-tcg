"use client";

import { useMemo, useCallback } from "react";
import { Card as CardType, Rarity } from "../data/types";
import { CARDS_SEASON1 } from "../data/cards-season1";
import { CARDS_SEASON2 } from "../data/cards-season2";
import { useLocalStorage } from "./useLocalStorage";
import { useAuth } from "./useAuth";

// --- GACHA RATES ---
const RATE: Record<Rarity, number> = {
  LEG: 0.1,
  SEC: 0.4,
  UR: 1.0,
  SSR: 6.5,
  SR: 12.0,
  R: 30.0,
  C: 50.0,
};

const GOD_PACK_CHANCE = 1; // 1%

// --- RARITY SUSPENSE CONFIG ---
export const RARITY_SUSPENSE_MS: Record<Rarity, number> = {
  C: 0,
  R: 0,
  SR: 200,
  SSR: 500,
  UR: 900,
  SEC: 1400,
  LEG: 2000,
};

// Helper: Fisher-Yates Shuffle
const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Roll Standard Rarity
const rollRarity = (): Rarity => {
  const rand = Math.random() * 100;
  let cum = 0;
  for (const [tier, rate] of Object.entries(RATE)) {
    cum += rate;
    if (rand < cum) return tier as Rarity;
  }
  return "C";
};

// Roll God Pack Rarity (SR+ only, heavier weight for SSR/UR/SEC/LEG)
const getHighRarity = (): Rarity => {
  const rand = Math.random() * 100;
  if (rand < 5) return "LEG";
  if (rand < 15) return "SEC";
  if (rand < 45) return "UR";
  return "SSR";
};

const isGodPackRoll = (): boolean => {
  return Math.random() * 100 < GOD_PACK_CHANCE;
};

export interface ActiveLotCard extends CardType {
  isOpened: boolean;
}

export const useGacha = (season: "season1" | "season2") => {
  const { user, token } = useAuth();

  // Load appropriate card database
  const cards = useMemo(() => {
    return season === "season2" ? CARDS_SEASON2 : CARDS_SEASON1;
  }, [season]);

  const gachaPool = useMemo(() => {
    return cards.filter((c) => c.isGacha === "Y");
  }, [cards]);

  // Persistent States (season-scoped keys to avoid cross-season data leakage)
  const collectionKey = `pod_collection_${season}`;
  const lotSelectionKey = `pod_lot_selection_${season}`;
  const activeLotKey = `pod_active_lot_${season}`;
  const lotIndexKey = `pod_lot_index_${season}`;

  const [localCollection, setLocalCollection, isCollectionLoaded] = useLocalStorage<string[]>(
    collectionKey,
    []
  );

  const [lotSelection, setLotSelection, isLotSelectionLoaded] = useLocalStorage<string[]>(
    lotSelectionKey,
    []
  );

  const [activeLot, setActiveLot, isActiveLotLoaded] = useLocalStorage<ActiveLotCard[]>(
    activeLotKey,
    []
  );

  const [currentLotIndex, setCurrentLotIndex] = useLocalStorage<number>(
    lotIndexKey,
    0
  );

  // Authentication & Ownership calculations
  const userRoleIds = useMemo(() => {
    if (user && token && Array.isArray(user.roles)) {
      return new Set(user.roles);
    }
    return new Set<string>();
  }, [user, token]);

  const isLoggedIn = !!token;

  const isOwned = useCallback((card: CardType): boolean => {
    if (isLoggedIn) {
      return userRoleIds.has(card.role_id);
    }
    return localCollection.includes(card.role_id);
  }, [isLoggedIn, userRoleIds, localCollection]);

  const ownedCount = useMemo(() => {
    return cards.filter((c) => isOwned(c)).length;
  }, [cards, isOwned]);

  // Add Card to Guest Collection
  const addToCollection = useCallback((card: CardType) => {
    if (!isLoggedIn) {
      setLocalCollection((prev) => {
        if (prev.includes(card.role_id)) return prev;
        return [...prev, card.role_id];
      });
    }
  }, [isLoggedIn, setLocalCollection]);

  // Helper: Get random gacha card by rarity
  const getRandomCardByRarity = useCallback((rarity: Rarity): CardType => {
    const filtered = gachaPool.filter((c) => c.rarity === rarity);
    if (filtered.length === 0) {
      // Fallback
      return gachaPool[Math.floor(Math.random() * gachaPool.length)];
    }
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [gachaPool]);

  // Open 1 pack = 5 unique cards
  const openPack = useCallback((): { pack: CardType[]; isGod: boolean } => {
    const isGod = isGodPackRoll();
    const pack: CardType[] = [];
    const selectedIds = new Set<string>();

    for (let i = 0; i < 5; i++) {
      let rarity: Rarity;
      if (isGod) {
        rarity = getHighRarity();
      } else {
        rarity = rollRarity();
      }

      let card = getRandomCardByRarity(rarity);

      // Uniqueness checks (max 10 retries)
      let attempts = 0;
      while (selectedIds.has(card.role_id) && attempts < 10) {
        card = getRandomCardByRarity(rarity);
        attempts++;
      }

      // If still duplicate, pick any unique gacha card
      if (selectedIds.has(card.role_id)) {
        const fallbackPool = gachaPool.filter((c) => !selectedIds.has(c.role_id));
        if (fallbackPool.length > 0) {
          card = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        }
      }

      pack.push(card);
      selectedIds.add(card.role_id);
    }

    const shuffledPack = shuffleArray(pack);
    return { pack: shuffledPack, isGod };
  }, [getRandomCardByRarity, gachaPool]);

  // --- CUSTOM LOT MANAGEMENT ---
  const toggleLotCard = useCallback((cardId: string) => {
    setLotSelection((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= 10) return prev;
      return [...prev, cardId];
    });
  }, [setLotSelection]);

  const clearLotSelection = useCallback(() => {
    setLotSelection([]);
  }, [setLotSelection]);

  const startLot = useCallback((): boolean => {
    if (lotSelection.length === 0 || lotSelection.length > 10) return false;

    const selectedCards = lotSelection
      .map((id) => cards.find((c) => c.role_id === id))
      .filter((c): c is CardType => !!c);

    const shuffled = shuffleArray(selectedCards).map((c) => ({
      ...c,
      isOpened: false,
    }));

    setActiveLot(shuffled);
    setCurrentLotIndex(0);
    return true;
  }, [lotSelection, cards, setActiveLot, setCurrentLotIndex]);

  const revealLotCard = useCallback((index: number) => {
    const updated = [...activeLot];
    if (updated[index] && !updated[index].isOpened) {
      updated[index].isOpened = true;
      setActiveLot(updated);
      addToCollection(updated[index]);
    }
  }, [activeLot, setActiveLot, addToCollection]);

  const confirmResetLot = useCallback(() => {
    setActiveLot([]);
    setCurrentLotIndex(0);
    setLotSelection([]);
  }, [setActiveLot, setCurrentLotIndex, setLotSelection]);

  return {
    cards,
    gachaPool,
    isLoaded: isCollectionLoaded && isLotSelectionLoaded && isActiveLotLoaded,
    isLoggedIn,
    ownedCount,
    isOwned,
    addToCollection,
    openPack,
    // LotSelection
    lotSelection,
    toggleLotCard,
    clearLotSelection,
    // ActiveLot
    activeLot,
    startLot,
    revealLotCard,
    confirmResetLot,
  };
};
