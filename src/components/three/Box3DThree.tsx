"use client";

import { useRef, useState, ComponentType } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface Box3DThreeProps {
  isOpen: boolean;
  onClick: () => void;
  season: string;
  shouldAnimate?: boolean;
}

const BOX_W = 1.8;
const BOX_H = 2.8;
const BOX_D = 1.1;
const CLOSED_BOX_ROT_Y = -0.36;
const HOVER_BOX_ROT_Y = -0.5;

const AnimatedBasicMaterial = animated.meshBasicMaterial as ComponentType<{
  [key: string]: unknown;
}>;

function BoxFace({
  position,
  rotation,
  size,
  color = "#ffffff",
  texture,
  emissive,
  unlit = false,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  color?: string;
  texture?: THREE.Texture;
  emissive?: string;
  unlit?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {unlit ? (
        <meshBasicMaterial
          map={texture}
          color={color}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      ) : (
        <meshStandardMaterial
          map={texture}
          color={color}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.15 : 0}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

export function Box3DThree({ isOpen, onClick }: Box3DThreeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const lidRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const frontTexture = useTexture("/front-box.png");

  // Hover + idle rotation spring
  const { rotX } = useSpring({
    rotX: hovered && !isOpen ? -0.1 : 0,
    config: { tension: 200, friction: 20 },
  });

  // Open animation spring
  const { scaleY, posY, opacity } = useSpring({
    scaleY: isOpen ? 0.5 : 1,
    posY: isOpen ? -4 : 0,
    opacity: isOpen ? 0 : 1,
    config: { tension: 80, friction: 20 },
  });

  // Lid open angle
  const { lidAngle } = useSpring({
    lidAngle: isOpen ? -2.4 : 0,
    config: { tension: 60, friction: 12 },
  });

  // Idle floating animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    if (!isOpen) {
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;
      groupRef.current.rotation.y =
        (hovered ? HOVER_BOX_ROT_Y : CLOSED_BOX_ROT_Y) + Math.sin(t * 0.5) * 0.04;
    }
  });

  const handlePointerOver = () => {
    if (!isOpen) {
      setHovered(true);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "default";
  };

  const handleClick = () => {
    if (!isOpen) onClick();
  };

  return (
    <animated.group
      ref={groupRef}
      position-y={posY}
      scale-y={scaleY}
      rotation-x={rotX}
      rotation-y={CLOSED_BOX_ROT_Y}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Front face */}
      <mesh position={[0, 0, BOX_D / 2]}>
        <planeGeometry args={[BOX_W, BOX_H]} />
        <meshBasicMaterial color="#ffffff" side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, 0, BOX_D / 2 + 0.01]}>
        <planeGeometry args={[BOX_W, BOX_H]} />
        <AnimatedBasicMaterial
          map={frontTexture}
          transparent
          opacity={opacity}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* Back face */}
      <BoxFace
        position={[0, 0, -BOX_D / 2]}
        rotation={[0, Math.PI, 0]}
        size={[BOX_W, BOX_H]}
        color="#ffffff"
        unlit
      />

      {/* Right face */}
      <BoxFace
        position={[BOX_W / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        size={[BOX_D, BOX_H]}
        color="#ffffff"
        unlit
      />

      {/* Left face */}
      <BoxFace
        position={[-BOX_W / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[BOX_D, BOX_H]}
        color="#ffffff"
        unlit
      />

      {/* Bottom face */}
      <BoxFace
        position={[0, -BOX_H / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[BOX_W, BOX_D]}
        color="#ffffff"
        unlit
      />

      {/* Lid group - pivots from top edge of box */}
      {isOpen && (
        <animated.group
          ref={lidRef}
          position={[0, BOX_H / 2, 0]}
          rotation-x={lidAngle}
        >
          {/* Lid top */}
          <BoxFace
            position={[0, BOX_D / 2, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            size={[BOX_W, BOX_D]}
            color="#ffffff"
            unlit
          />
          {/* Lid front panel */}
          <BoxFace
            position={[0, 0, BOX_D / 2]}
            rotation={[0, 0, 0]}
            size={[BOX_W, BOX_D]}
            color="#ffffff"
            unlit
          />
        </animated.group>
      )}

      {/* Hover glow / outline effect via a slightly larger invisible mesh */}
      {hovered && !isOpen && (
        <mesh>
          <boxGeometry args={[BOX_W + 0.05, BOX_H + 0.05, BOX_D + 0.05]} />
          <meshBasicMaterial
            color="#88aaff"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </animated.group>
  );
}
