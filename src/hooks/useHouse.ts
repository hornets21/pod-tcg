"use client";

import { useCallback, useEffect, useState } from "react";
import { HouseId, HOUSE_IDS } from "../data/houses";

const STORAGE_KEY = "pod_house";
const HISTORY_KEY = "pod_house_history";

const randomHouseId = (): HouseId =>
  HOUSE_IDS[Math.floor(Math.random() * HOUSE_IDS.length)];

export interface UseHouseResult {
  current: HouseId | null;
  history: HouseId[];
  isLoaded: boolean;
  roll: () => HouseId;
  reset: () => void;
}

export const useHouse = (): UseHouseResult => {
  const [current, setCurrent] = useState<HouseId | null>(null);
  const [history, setHistory] = useState<HouseId[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw && HOUSE_IDS.includes(raw as HouseId)) {
          setCurrent(raw as HouseId);
        }
        const histRaw = window.localStorage.getItem(HISTORY_KEY);
        if (histRaw) {
          const parsed = JSON.parse(histRaw);
          if (Array.isArray(parsed)) {
            setHistory(parsed.filter((h) => HOUSE_IDS.includes(h as HouseId)));
          }
        }
      } catch {}
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const persist = useCallback(
    (next: HouseId | null, nextHistory: HouseId[]) => {
      if (typeof window === "undefined") return;
      try {
        if (next) {
          window.localStorage.setItem(STORAGE_KEY, next);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      } catch {}
    },
    []
  );

  const roll = useCallback((): HouseId => {
    const next = randomHouseId();
    setCurrent(next);
    setHistory((prev) => {
      const updated = [...prev, next].slice(-20);
      persist(next, updated);
      return updated;
    });
    return next;
  }, [persist]);

  const reset = useCallback(() => {
    setCurrent(null);
    setHistory([]);
    persist(null, []);
  }, [persist]);

  return { current, history, isLoaded, roll, reset };
};