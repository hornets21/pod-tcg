"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAudioContext } from "../components/AudioContext";

export const AUDIO_URLS = {
  // BGM
  BGM_GOD: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // Energetic Shonen Heavy Guitar Rock
  
  // SFX
  CARD_REVEAL_NORMAL: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
  CARD_REVEAL_GOLD: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  TEAR_PACK: "https://img.lucky-pod.fun/tear.mp3",
  BOX_OPEN: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  
  // NEW EXCITING SFX (SHONEN ANIME STYLE)
  HEAVENLY: "https://assets.mixkit.co/active_storage/sfx/2790/2790-preview.mp3", // Shonen aura flare / whoosh
  IMPACT_HEAVY: "https://assets.mixkit.co/active_storage/sfx/2601/2601-preview.mp3", // Shonen explosive impact
  SHONEN_SLASH: "https://assets.mixkit.co/active_storage/sfx/1476/1476-preview.mp3", // Sword slash / screen cut
};

// Global BGM instance to share background music state across components and prevent duplicate playbacks
let globalBGM: HTMLAudioElement | null = null;

export function useAudio() {
  const { isMuted } = useAudioContext();
  const sfxRefs = useRef<Set<HTMLAudioElement>>(new Set());
  const isMounted = useRef(true);

  // Preload common SFX
  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.values(AUDIO_URLS).forEach(url => {
        if (url) {
          const img = new Audio();
          img.src = url;
          img.preload = "auto";
        }
      });
    }
  }, []);

  const stopAllSFX = useCallback(() => {
    sfxRefs.current.forEach((audio) => {
      try {
        audio.pause();
        audio.src = "";
      } catch (e) {}
    });
    sfxRefs.current.clear();
  }, []);

  const playSFX = useCallback((url: string, volume = 0.15) => {
    if (typeof window === "undefined" || !url) return;
    if (isMuted) return;
    
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      
      sfxRefs.current.add(audio);
      audio.onended = () => {
        sfxRefs.current.delete(audio);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("SFX Play Blocked/Error:", err);
          // Retry once on next interaction if needed? No, just log for now.
        });
      }
    } catch (err) {
      console.warn("SFX Creation Error:", err);
    }
  }, [isMuted]);

  const startBGM = useCallback((url: string, volume = 0.02) => {
    if (typeof window === "undefined" || !url) return;
    if (isMuted) return;

    if (globalBGM && globalBGM.src === url && !globalBGM.paused) {
      globalBGM.volume = volume;
      return;
    }

    if (globalBGM) {
      globalBGM.pause();
      globalBGM.src = "";
    }
    
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop = true;
      globalBGM = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("BGM Play Error:", err);
        });
      }
    } catch (err) {
      console.warn("BGM Creation Error:", err);
    }
  }, [isMuted]);

  const stopBGM = useCallback(() => {
    if (globalBGM) {
      globalBGM.pause();
      globalBGM.src = "";
      globalBGM = null;
    }
  }, []);

  useEffect(() => {
    if (isMuted) {
      stopAllSFX();
      if (globalBGM) {
        globalBGM.pause();
      }
    } else {
      if (globalBGM && globalBGM.src && globalBGM.paused) {
        globalBGM.play().catch(() => {});
      }
    }
  }, [isMuted, stopAllSFX]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopAllSFX();
    };
  }, [stopAllSFX]);

  return { playSFX, stopAllSFX, startBGM, stopBGM };
}
