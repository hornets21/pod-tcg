"use client";

import React, { useEffect, useState } from "react";
import { Card as CardType } from "../../../data/types";
import { useAudio, AUDIO_URLS } from "../../../hooks/useAudio";

interface CutsceneProps {
  cards: CardType[];
  onComplete: () => void;
}

const CHAT_MESSAGES = [
  "เกลือแน่ๆ", "มาว่ะ!", "OMG!!!", "ทองงงงงงงง", "ตึงจัด", 
  "Lucky Pod!", "จารย์ปดดดดด", "หลุดเรทป่าววะ", "10 rolls?",
  "ขอร้องล่ะทองที", "เอาเรื่องงงงง", "ดวงดีเกินนน", "GGEZ",
  "ขอ SEC!", "หลบไปคนจะรวย", "7777777", "ยินดีด้วยครับ",
  "เกลือเป็นหนอน", "หมาจัด", "ดวงอย่างตึง"
];

export const CutsceneChatHype: React.FC<CutsceneProps> = ({ cards, onComplete }) => {
  const { playSFX } = useAudio();
  const [messages, setMessages] = useState<{id: number, text: string, delay: number, color: string}[]>([]);
  const [isFinal, setIsFinal] = useState(false);

  const getHighestRarityColor = () => {
    const rarities = cards.map((c) => c.rarity);
    const isSpecial = cards.some((c) => c.role_id === "1356458345812459611");

    if (isSpecial || rarities.some((r) => ["LEG", "SEC", "UR", "SSR"].includes(r))) return "gold";
    if (rarities.some((r) => r === "SR")) return "purple";
    return "blue";
  };

  const color = getHighestRarityColor();

  useEffect(() => {
    // Generate constant stream of messages
    const newMsgs = [...Array(40)].map((_, i) => ({
      id: i,
      text: CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)],
      delay: Math.random() * 2,
      color: ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5fe"][Math.floor(Math.random() * 5)]
    }));
    setMessages(newMsgs);

    playSFX(AUDIO_URLS.METEOR_FLYBY, 0.15);

    const finalTimer = setTimeout(() => {
      setIsFinal(true);
      playSFX(AUDIO_URLS.HYPE, 0.2);
    }, 2200);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(finalTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, playSFX]);

  return (
    <div className={`cutscene-overlay ${color}`}>
      <div className="speed-lines"></div>
      
      <div className="chat-stream">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className="chat-bubble"
            style={{
              animationDelay: `${msg.delay}s`,
              color: msg.color
            }}
          >
            <span className="username">User_{msg.id}:</span> {msg.text}
          </div>
        ))}
      </div>

      <div className="center-hype">
        <h1 className={`hype-text ${isFinal ? "glitch-out" : "pulse-in"}`} data-text="READY?">
          READY?
        </h1>
      </div>
      
      {isFinal && <div className="final-burst"></div>}

      <style jsx>{`
        .cutscene-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Kanit', sans-serif;
        }

        .speed-lines {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, transparent 30%, rgba(255,255,255,0.05) 100%);
          animation: speed-pulse 0.2s infinite;
        }

        @keyframes speed-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0.3; }
        }

        .chat-stream {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 300px;
          height: 80vh;
          display: flex;
          flex-direction: column-reverse;
          mask-image: linear-gradient(to top, black 80%, transparent);
        }

        .chat-bubble {
          padding: 6px 12px;
          background: rgba(255,255,255,0.05);
          border-left: 3px solid currentColor;
          margin-bottom: 8px;
          font-size: 1rem;
          opacity: 0;
          transform: translateX(-50px);
          animation: chat-scroll 0.4s ease-out forwards;
        }

        .username {
          font-weight: bold;
          font-size: 0.8rem;
          margin-right: 8px;
          opacity: 0.7;
        }

        @keyframes chat-scroll {
          to { opacity: 1; transform: translateX(0); }
        }

        .center-hype {
          z-index: 100;
        }

        .hype-text {
          font-size: 6rem;
          font-weight: 900;
          color: white;
          text-shadow: 4px 4px 0 #ff00ff, -4px -4px 0 #00ffff;
          position: relative;
        }

        .pulse-in {
          animation: text-pulse 0.5s infinite alternate;
        }

        @keyframes text-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }

        .glitch-out {
          animation: glitch-explosion 0.4s ease-out forwards;
        }

        @keyframes glitch-explosion {
          0% { transform: scale(1); opacity: 1; filter: hue-rotate(0deg); }
          50% { transform: scale(2); opacity: 0.8; filter: hue-rotate(180deg) skewX(20deg); }
          100% { transform: scale(5); opacity: 0; filter: hue-rotate(360deg); }
        }

        .final-burst {
          position: absolute;
          inset: 0;
          background: white;
          z-index: 200;
          animation: burst-fade 1s ease-out forwards;
        }

        .gold .final-burst { background: linear-gradient(45deg, #ffd700, #fff); }
        .purple .final-burst { background: linear-gradient(45deg, #a335ee, #fff); }
        .blue .final-burst { background: linear-gradient(45deg, #0070dd, #fff); }

        @keyframes burst-fade {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }
      `}</style>
    </div>
  );
};
