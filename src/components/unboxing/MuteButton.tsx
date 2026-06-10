"use client";

import React from "react";
import { useAudioContext } from "../AudioContext";

export const MuteButton: React.FC = () => {
  const { isMuted, toggleMute } = useAudioContext();

  return (
    <>
      <button
        className="mute-btn"
        onClick={toggleMute}
        aria-label={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
        title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
      >
        <span className="mute-icon">{isMuted ? "🔇" : "🔊"}</span>
      </button>

      <style jsx>{`
        .mute-btn {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 9999;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          padding: 0;
        }

        .mute-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        .mute-btn:active {
          transform: scale(0.95);
        }

        .mute-icon {
          font-size: 20px;
          line-height: 1;
        }

        @media (max-width: 480px) {
          .mute-btn {
            top: 12px;
            right: 12px;
            width: 38px;
            height: 38px;
          }
          .mute-icon {
            font-size: 17px;
          }
        }
      `}</style>
    </>
  );
};