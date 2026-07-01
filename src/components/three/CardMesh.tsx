"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { animated as webAnimated, to } from "@react-spring/web";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Card as CardType } from "../../data/types";
import { Card } from "../Card";
import { FullArtCard } from "../FullArtCard";

interface CardMeshProps {
  card: CardType;
  index: number;
  total: number;
  isEntered: boolean;
  isCarouselLayout: boolean;
  isRevealed: boolean;
  isSpecial: boolean;
  season?: string;
}

function getRowPosition(
  index: number,
  total: number,
  spacing: number,
): [number, number, number, number] {
  // Returns [x, y, z, rotZ] for a clean horizontal row.
  const x = (index - (total - 1) / 2) * spacing;
  return [x, 0, index * 0.012, 0];
}

const SPARKLE_PROPS = [
  { tx: "-80px", ty: "-220px", delay: "0.2s", size: "3px" },
  { tx: "45px", ty: "-180px", delay: "1.1s", size: "5px" },
  { tx: "-20px", ty: "-310px", delay: "0.7s", size: "4px" },
  { tx: "90px", ty: "-250px", delay: "1.4s", size: "3px" },
  { tx: "-50px", ty: "-160px", delay: "0.5s", size: "6px" },
  { tx: "15px", ty: "-280px", delay: "1.8s", size: "2px" },
  { tx: "-95px", ty: "-200px", delay: "0.9s", size: "5px" },
  { tx: "60px", ty: "-330px", delay: "1.3s", size: "4px" },
  { tx: "-10px", ty: "-150px", delay: "0.1s", size: "3px" },
  { tx: "80px", ty: "-290px", delay: "1.6s", size: "5px" },
  { tx: "-35px", ty: "-240px", delay: "0.4s", size: "4px" },
  { tx: "30px", ty: "-210px", delay: "1.0s", size: "6px" },
];

export function CardMesh({
  card,
  index,
  total,
  isEntered,
  isCarouselLayout,
  isRevealed,
  isSpecial,
  season = "season1",
}: CardMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const { size, viewport } = useThree();

  const cardPixelWidth =
    size.width <= 480
      ? 145
      : size.width <= 768
        ? 160
        : size.width <= 992
          ? 200
          : 230;
  const gapPixels = size.width <= 768 ? 10 : 18;
  const availableWidth = size.width * 0.9;
  const naturalRowWidth = total * cardPixelWidth + (total - 1) * gapPixels;
  const rowScale = Math.min(1, availableWidth / naturalRowWidth);
  const spacing =
    (cardPixelWidth * rowScale + gapPixels) * (viewport.width / size.width);

  const [fx, fy, fz, fRotZ] = getRowPosition(index, total, spacing);
  // Place the first card at the far-right edge so it visibly leads the loop.
  const carouselAngle = (index / total) * Math.PI * 2 + Math.PI / 2;
  const targetX = isCarouselLayout ? Math.sin(carouselAngle) * 2.85 : fx;
  const targetY = isCarouselLayout ? 0 : fy;
  const targetZ = isCarouselLayout ? Math.cos(carouselAngle) * 2.15 : fz;
  const targetRotZ = isCarouselLayout ? 0 : fRotZ;

  // Settle directly into the reveal row with a short upward entrance.
  // `from` is required so react-spring animates from 0 → 1 on mount instead
  // of jumping straight to the target.
  const { entry, layoutX, layoutY, layoutZ, layoutRotZ, scl } = useSpring({
    entry: isEntered ? 1 : 0,
    layoutX: targetX,
    layoutY: targetY,
    layoutZ: targetZ,
    layoutRotZ: targetRotZ,
    scl: rowScale,
    from: {
      entry: 0,
      layoutX: targetX,
      layoutY: targetY,
      layoutZ: targetZ,
      layoutRotZ: targetRotZ,
      scl: rowScale,
    },
    config: {
      tension: 190,
      friction: 21,
      mass: 0.75,
    },
  });

  // Idle hover sway (makes the card rotate/sway slightly when hovered)
  useFrame((state) => {
    if (!groupRef.current || !isRevealed) return;
    const t = state.clock.elapsedTime;
    if (hovered) {
      groupRef.current.rotation.x = Math.sin(t * 2) * 0.03;
      groupRef.current.rotation.y = Math.cos(t * 1.5) * 0.03;
    } else {
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
    }
  });

  const CardComponent = season === "season2" ? FullArtCard : Card;

  return (
    <animated.group
      ref={groupRef}
      position-x={layoutX}
      position-y={layoutY}
      position-z={layoutZ}
    >
      <Html
        center
        style={{
          pointerEvents: "auto",
        }}
      >
        <webAnimated.div
          onMouseEnter={() => {
            if (isRevealed) {
              setHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onMouseLeave={() => {
            setHovered(false);
            document.body.style.cursor = "default";
          }}
          style={{
            position: "relative",
            width: "230px",
            height: "330px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            opacity: entry,
            transform: to(
              [entry, layoutRotZ, scl],
              (progress, rotation, scale) =>
                `perspective(900px) rotateY(0deg) rotateZ(${rotation * progress}rad) scale(${scale})`,
            ),
          }}
          className={isSpecial && isRevealed ? "magnificent-wrapper" : ""}
        >
          {isSpecial && isRevealed && (
            <>
              <div className="magnificent-aura" />
              <div className="sparkles-container">
                {SPARKLE_PROPS.map((sparkle, i) => (
                  <div
                    key={i}
                    className="magnificent-sparkle"
                    style={
                      {
                        "--tx": sparkle.tx,
                        "--ty": sparkle.ty,
                        "--delay": sparkle.delay,
                        "--size": sparkle.size,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </>
          )}

          <CardComponent
            card={card}
            isRevealed={isRevealed}
            enableHolo={true}
          />

          <style>{`
            /* Magnificent Special Card Effects */
            .magnificent-wrapper {
              z-index: 50;
            }

            .magnificent-aura {
              position: absolute;
              inset: -10px;
              background: conic-gradient(
                from 0deg,
                #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000
              );
              border-radius: 12px;
              filter: blur(15px);
              opacity: 0.6;
              animation: aura-pulse 2s ease-in-out infinite alternate;
              z-index: -1;
            }

            @keyframes aura-pulse {
              from { opacity: 0.4; transform: scale(0.98); }
              to { opacity: 0.8; transform: scale(1.02); }
            }

            .sparkles-container {
              position: absolute;
              inset: 0;
              pointer-events: none;
              z-index: 20;
            }

            .magnificent-sparkle {
              position: absolute;
              left: 50%;
              top: 50%;
              width: var(--size);
              height: var(--size);
              background: #fff;
              border-radius: 50%;
              box-shadow: 0 0 10px #fff, 0 0 20px #ff00ff;
              opacity: 0;
              animation: sparkle-fly 2s ease-out var(--delay) infinite;
            }

            @keyframes sparkle-fly {
              0% { transform: translate(0, 0) scale(0); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; }
            }
          `}</style>
        </webAnimated.div>
      </Html>
    </animated.group>
  );
}
