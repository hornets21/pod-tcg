"use client";

import React, { useRef, useState } from "react";
import { Card as CardType } from "../data/types";
import { getRarityStars } from "./Card";

interface FullArtCardProps {
  card: CardType;
  isRevealed?: boolean;
  onClick?: () => void;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  enableHolo?: boolean;
  isOwned?: boolean;
}

const getRarityClasses = (rarity: string) => {
  switch (rarity) {
    case "UR":
      return {
        borderColor: "#ea580c",
        glow: "rarity-glow-UR",
        overlay: "bg-gradient-to-tr from-purple-500/20 via-blue-400/20 to-pink-500/20 animate-pulse",
      };
    case "SSR":
      return {
        borderColor: "#ca8a04",
        glow: "rarity-glow-SEG",
        overlay: "bg-gradient-to-br from-yellow-300/10 via-transparent to-yellow-600/20",
      };
    case "SEC":
      return {
        borderColor: "#6366f1",
        glow: "rarity-glow-SEC",
        overlay: "bg-gradient-to-tr from-indigo-500/20 via-white/10 to-blue-400/20 animate-shine-fullart",
      };
    case "LEG":
      return {
        borderColor: "#991b1b",
        glow: "rarity-glow-LEG",
        overlay: "bg-[radial-gradient(circle,rgba(239,68,68,0.1)_0%,transparent_70%)]",
      };
    default:
      return {
        borderColor: "#475569",
        glow: "",
        overlay: "",
      };
  }
};

export const FullArtCard: React.FC<FullArtCardProps> = ({
  card,
  isRevealed = true,
  onClick,
  className = "",
  isSelectionMode = false,
  isSelected = false,
  enableHolo = true,
  isOwned = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mx, setMx] = useState(0.5);
  const [my, setMy] = useState(0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHolo || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMx(x);
    setMy(y);
  };

  const handleMouseLeave = () => {
    if (!enableHolo) return;
    setMx(0.5);
    setMy(0.5);
  };

  const { borderColor, glow, overlay } = getRarityClasses(card.rarity);

  const textStrokeStyle: React.CSSProperties = {
    textShadow: `
      -1.5px -1.5px 0 #000,  
       1.5px -1.5px 0 #000,
      -1.5px  1.5px 0 #000,
       1.5px  1.5px 0 #000,
       0px  3px 6px rgba(0,0,0,0.8)
    `
  };

  // Base scale is 0.657 to fit 350px card into 230px grid slot
  const baseScale = 0.657;
  const finalScale = isSelected ? baseScale * 1.03 : baseScale;
  const lift = isSelected ? -15 : 0;

  return (
    <div 
        className={`full-art-card-wrapper ${className}`} 
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
            width: "230px", 
            height: "330px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            position: "relative",
            cursor: "pointer",
            perspective: "1200px",
            transition: "opacity 0.4s ease"
        }}
    >
        <div
            ref={cardRef}
            className={`group relative transition-all duration-500 card ${
                card.rarity.toLowerCase()
            } ${isRevealed ? "revealed" : ""} ${isSelectionMode ? "selection-mode" : ""} ${
                isSelected ? "selected" : ""
            } ${!isOwned ? "not-owned" : ""} ${isRevealed ? glow : ""}`}
            style={{
                "--mx": mx,
                "--my": my,
                width: "350px",
                height: "490px",
                padding: "0",
                margin: "0",
                background: "transparent",
                boxShadow: isRevealed ? "0 30px 60px -12px rgba(0, 0, 0, 0.8)" : "none",
                display: "block",
                position: "absolute",
                transform: `scale(${finalScale}) translateY(${lift}px)`,
                transformOrigin: "center center",
                pointerEvents: "none"
            } as React.CSSProperties}
        >
            {!isOwned && (
                <div style={{ zIndex: 200, position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.9)", color: "white", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>ยังไม่มี</div>
            )}

            <div className="card-inner" style={{ width: "100%", height: "100%", position: "relative" }}>
                {/* BACK */}
                <div className="card-back" style={{ borderRadius: "22px", borderWidth: "6px" }}></div>

                {/* FRONT */}
                <div className="card-front" style={{ borderRadius: "22px", border: `10px solid ${borderColor}`, padding: "0", overflow: "hidden", background: "black", boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)" }}>
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    
                    {/* 1. ARTWORK LAYER */}
                    <div style={{ position: "absolute", inset: "0", zIndex: 0 }}>
                        <img src={card.image} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "auto" }} loading="lazy" />
                        <div style={{ position: "absolute", inset: "0", background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.9) 100%)" }}></div>
                    </div>

                    {/* 2. EFFECT LAYER */}
                    <div className={`absolute inset-0 z-10 opacity-50 pointer-events-none ${overlay}`}></div>

                    {/* 3. CONTENT LAYER (ABSOLUTE POSITIONING) */}
                    <div style={{ position: "absolute", inset: "0", zIndex: 20, color: "white" }}>
                        
                        {/* NAME - TOP LEFT */}
                        <h2 style={{ 
                            position: "absolute", top: "22px", left: "24px", margin: 0,
                            fontSize: "32px", fontWeight: "900", letterSpacing: "-0.04em",
                            fontFamily: "var(--font-chakra), sans-serif", ...textStrokeStyle,
                            maxWidth: "70%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                            {card.name}
                        </h2>

                        {/* BOTTOM BLOCK (Ability + Footer) */}
                        <div style={{ position: "absolute", bottom: "18px", left: "24px", right: "24px" }}>
                            
                            {/* ABILITY SECTION (Badge then Text below) */}
                            <div style={{ marginBottom: "12px" }}>
                                {/* ABILITY BADGE */}
                                <div style={{ display: "flex", marginBottom: "10px" }}>
                                    <div style={{ 
                                        backgroundColor: "#ef4444", border: "1px solid rgba(255,255,255,0.4)",
                                        borderRadius: "20px", padding: "3px 14px", boxShadow: "0 4px 8px rgba(0,0,0,0.4)"
                                    }}>
                                        <span style={{ 
                                            fontSize: "10px", fontWeight: "900", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.08em",
                                            fontFamily: "var(--font-prompt), sans-serif", ...textStrokeStyle
                                        }}>
                                            ABILITY
                                        </span>
                                    </div>
                                </div>
                                {/* ABILITY DESCRIPTION TEXT */}
                                <p style={{ 
                                    fontSize: "14px", fontWeight: "800", lineHeight: "1.4", margin: 0,
                                    fontFamily: "var(--font-prompt), sans-serif", ...textStrokeStyle,
                                    display: "-webkit-box", WebkitLineClamp: "4", WebkitBoxOrient: "vertical", overflow: "hidden"
                                }}>
                                    {card.ability || "ไม่มีความสามารถพิเศษ"}
                                </p>
                            </div>

                            {/* SEPARATOR LINE */}
                            <div style={{ 
                                height: "1px", background: "rgba(255,255,255,0.25)", marginBottom: "10px"
                            }}></div>

                            {/* FOOTER ROW */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <span style={{ 
                                    fontSize: "10px", fontWeight: "700", fontStyle: "italic", opacity: "0.95",
                                    fontFamily: "var(--font-prompt), sans-serif", ...textStrokeStyle
                                }}>
                                    Illus. pod_tcg_design
                                </span>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ 
                                        fontSize: "13px", lineHeight: "1", marginBottom: "3px",
                                        color: card.rarity === 'SSR' ? '#fde047' : 'white', ...textStrokeStyle
                                    }}>
                                        {getRarityStars(card.rarity)}
                                    </div>
                                    <div style={{ 
                                        fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em", opacity: "0.85",
                                        fontFamily: "var(--font-prompt), sans-serif", ...textStrokeStyle
                                    }}>
                                        SVI-222
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                </div>
            </div>
            
            {/* GLOSS & HOLO */}
            {enableHolo && (
                <>
                <div className="card-gloss" style={{ borderRadius: "22px", zIndex: 30, opacity: 0.6 }}></div>
                <div className="card-holo" style={{ borderRadius: "22px", zIndex: 30, opacity: 0.8 }}></div>
                </>
            )}
        </div>
    </div>
  );
};
