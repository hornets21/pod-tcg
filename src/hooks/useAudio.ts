"use client";

import { useCallback, useEffect, useRef } from "react";

export const AUDIO_URLS = {
  // BGM (Using more reliable Pixabay or similar stable CDN links if possible, otherwise keeping placeholders but fixing indices)
  BGM_WISH: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  BGM_SHATTER: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  BGM_HYPE: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  BGM_MYSTIC: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  BGM_GOD: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", // Changed from 15 to 8 (more likely to exist)
  
  // SFX
  METEOR_FLYBY: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  METEOR_IMPACT: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3",
  CARD_REVEAL_NORMAL: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
  CARD_REVEAL_GOLD: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  TEAR_PACK: "https://img.lucky-pod.fun/tear.mp3",
  BOX_OPEN: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  
  // NEW EXCITING SFX
  SHATTER: "https://assets.mixkit.co/active_storage/sfx/2801/2801-preview.mp3",
  SLASH: "https://assets.mixkit.co/active_storage/sfx/601/601-preview.mp3",
  HYPE: "https://assets.mixkit.co/active_storage/sfx/1111/1111-preview.mp3",
  HEAVENLY: "https://assets.mixkit.co/active_storage/sfx/1119/1119-preview.mp3",
  IMPACT_HEAVY: "https://assets.mixkit.co/active_storage/sfx/2601/2601-preview.mp3",
  ELECTRONIC_BEAM: "https://assets.mixkit.co/active_storage/sfx/2619/2619-preview.mp3",
};

export function useAudio() {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxRefs = useRef<Set<HTMLAudioElement>>(new Set());
  const isMounted = useRef(true);

  const stopAllSFX = useCallback(() => {
    sfxRefs.current.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    sfxRefs.current.clear();
  }, []);

  const playSFX = useCallback((url: string, volume = 0.5) => {
    if (typeof window === "undefined" || !url) return;
    
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      
      sfxRefs.current.add(audio);
      audio.onended = () => {
        sfxRefs.current.delete(audio);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently ignore abort errors
        });
      }
    } catch (err) {
      console.warn("SFX Error:", err);
    }
  }, []);

  const startBGM = useCallback((url: string, volume = 0.3) => {
    if (typeof window === "undefined" || !url) return;

    // If already playing the same URL, don't restart
    if (bgmRef.current && bgmRef.current.src === url && !bgmRef.current.paused) {
      bgmRef.current.volume = volume;
      return;
    }

    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.src = "";
    }
    
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop = true;
      bgmRef.current = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("BGM Play Error:", err);
        });
      }
    } catch (err) {
      console.warn("BGM Creation Error:", err);
    }
  }, []);

  const stopBGM = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.src = "";
      bgmRef.current = null;
    }
  }, []);

  // Cleanup all audio when component unmounts
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.src = "";
        bgmRef.current = null;
      }
      stopAllSFX();
    };
  }, [stopAllSFX]);

  return { playSFX, stopAllSFX, startBGM, stopBGM };
}
