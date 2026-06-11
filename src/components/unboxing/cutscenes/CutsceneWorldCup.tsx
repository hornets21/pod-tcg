"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAudioContext } from "../../AudioContext";
import { Card as CardType } from "../../../data/types";

interface CutsceneWorldCupProps {
  cards: CardType[];
  onComplete: () => void;
}

export const CutsceneWorldCup: React.FC<CutsceneWorldCupProps> = ({ onComplete }) => {
  const { isMuted } = useAudioContext();
  const [showGoal, setShowGoal] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [confettiData, setConfettiData] = useState<{id: number, left: number, delay: number, duration: number, color: string}[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Generate confetti on mount
    const data = [...Array(30)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2,
      color: i % 2 === 0 ? "#FFD700" : "#FFFFFF"
    }));
    setConfettiData(data);

    // Start fade-in with a slight delay to avoid cascading render lint
    const timer = setTimeout(() => {
      setIsEntering(true);
    }, 50);

    // Safety timeout: if video doesn't end in 15 seconds, auto-complete
    const safetyTimer = setTimeout(() => {
      handleVideoEnded();
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      
      // Try to force play
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Video autoplay failed, waiting for interaction or retrying muted:", error);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => console.error("Muted video play also failed:", e));
          }
        });
      }
    }
  }, [isMuted]);

  const handleVideoEnded = () => {
    if (showGoal) return; // Avoid multiple triggers
    setShowGoal(true);
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 800);
    }, 2500);
  };

  return (
    <div className={`worldcup-cutscene-root ${isEntering ? "entering" : ""} ${isExiting ? "exit" : ""}`}>
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          playsInline
          disablePictureInPicture
          controlsList="nopictureinpicture"
          onEnded={handleVideoEnded}
          className="wc-video"
          onError={(e) => {
            console.error("Video Error:", e);
            handleVideoEnded(); // Fallback to goal text if video fails
          }}
        >
          <source src="/videos/worldcup-event.webm" type="video/webm" />
          <source src="/videos/worldcup-event.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {showGoal && (
        <div className="goal-overlay">
          <div className="goal-text">GOAL!</div>
          <div className="sub-text">WORLD CUP SPECIAL EVENT</div>
          <div className="confetti-container">
            {confettiData.map((p) => (
              <div key={p.id} className="confetti" style={{
                left: `${p.left}%`,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}></div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .worldcup-cutscene-root {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Kanit', sans-serif;
          transition: opacity 1.2s ease-in-out;
          opacity: 0;
        }

        .worldcup-cutscene-root.entering {
          opacity: 1;
        }

        .worldcup-cutscene-root.exit {
          opacity: 0;
        }

        .video-container {
          width: 100%;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .wc-video {
          width: 100%;
          height: auto;
          max-height: 100vh;
          object-fit: contain;
        }

        .goal-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.5s ease forwards;
        }

        .goal-text {
          font-size: 8rem;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700;
          letter-spacing: 0.1em;
          animation: scalePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .sub-text {
          font-size: 1.5rem;
          color: #FFD700;
          font-weight: 700;
          letter-spacing: 0.3em;
          margin-top: 1rem;
          opacity: 0;
          animation: fadeIn 0.5s ease 0.3s forwards;
        }

        .confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .confetti {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: fall linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scalePop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes fall {
          to { transform: translateY(110vh) rotate(360deg); }
        }

        @media (max-width: 768px) {
          .goal-text { font-size: 4rem; }
          .sub-text { font-size: 1rem; }
          .video-container { width: 95%; }
        }
      `}</style>
    </div>
  );
};
