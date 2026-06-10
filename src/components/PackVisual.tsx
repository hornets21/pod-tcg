"use client";

import React from "react";

interface PackVisualProps {
  isTearing: boolean;
  isTorn: boolean;
  season: string;
  onClick: () => void;
}

export const PackVisual: React.FC<PackVisualProps> = ({
  isTearing,
  isTorn,
  season,
  onClick,
}) => {
  // Season-specific pack images (easily expandable for OP-3, OP-4, etc.)
  const packImgMap: Record<string, string> = {
    season1: "https://img.lucky-pod.fun/pack_tcg_op_1.png",
    season2: "https://img.lucky-pod.fun/pack_tcg_op_2.png",
  };

  const packImg = packImgMap[season] || packImgMap["season1"];

  return (
    <div
      id="pack-visual"
      className={`pack-visual ${isTearing ? "tearing" : ""} ${
        isTorn ? "torn" : ""
      }`}
      onClick={onClick}
    >
      <div className="pack-shaker">
        <div className="pack-half top">
          <img src={packImg} alt={`POD TCG ${season.toUpperCase()} Pack`} />
        </div>
        <div className="pack-half bottom">
          <img src={packImg} alt={`POD TCG ${season.toUpperCase()} Pack`} />
        </div>
      </div>
      <div className="pack-glow"></div>
    </div>
  );
};
