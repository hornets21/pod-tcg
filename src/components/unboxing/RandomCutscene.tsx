"use client";

import React, { useEffect, useState } from "react";
import { Card as CardType } from "../../data/types";
import { CutsceneFoilRip } from "./cutscenes/CutsceneFoilRip";
import { CutsceneCardShatter } from "./cutscenes/CutsceneCardShatter";
import { CutscenePodDrop } from "./cutscenes/CutscenePodDrop";
import { CutsceneChatHype } from "./cutscenes/CutsceneChatHype";
import { CutsceneWorldCup } from "./cutscenes/CutsceneWorldCup";
import { GenshinWishCutscene } from "./GenshinWishCutscene";

import { useAudio, AUDIO_URLS } from "../../hooks/useAudio";

interface RandomCutsceneProps {
  cards: CardType[];
  onComplete: () => void;
  onSelectBGM?: (url: string) => void;
}

export const CUTSCENE_CONFIGS = [
  { component: CutsceneFoilRip, bgm: AUDIO_URLS.BGM_MYSTIC },
  { component: CutsceneCardShatter, bgm: AUDIO_URLS.BGM_SHATTER },
  { component: CutscenePodDrop, bgm: AUDIO_URLS.BGM_WISH },
  { component: CutsceneChatHype, bgm: AUDIO_URLS.BGM_HYPE },
  { component: CutsceneWorldCup, bgm: "" }
];

export const RandomCutscene: React.FC<RandomCutsceneProps> = ({ cards, onComplete, onSelectBGM }) => {
  const selected = React.useMemo(() => {
    const randomIndex = Math.floor(Math.random() * CUTSCENE_CONFIGS.length);
    return CUTSCENE_CONFIGS[randomIndex];
  }, []);

  useEffect(() => {
    if (onSelectBGM) {
      onSelectBGM(selected.bgm);
    }
  }, [selected, onSelectBGM]);

  const SelectedComponent = selected.component;
  return <SelectedComponent cards={cards} onComplete={onComplete} />;
};
