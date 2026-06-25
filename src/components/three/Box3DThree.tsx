"use client";

import { useRef, useState, useEffect, ComponentType } from "react";
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
const HOVER_BOX_ROT_Y = -0.6; // Slightly larger rotation on hover to show side detail

const AnimatedBasicMaterial = animated.meshBasicMaterial as ComponentType<{
  [key: string]: unknown;
}>;

const AnimatedStandardMaterial = animated.meshStandardMaterial as ComponentType<{
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
  opacity = 1,
  roughness = 0.3,
  metalness = 0.1,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  color?: string;
  texture?: THREE.Texture;
  emissive?: string;
  unlit?: boolean;
  opacity?: unknown;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {unlit ? (
        <AnimatedBasicMaterial
          map={texture}
          color={color}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
          opacity={opacity}
        />
      ) : (
        <AnimatedStandardMaterial
          map={texture}
          color={color}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={emissive ? 0.15 : 0}
          roughness={roughness}
          metalness={metalness}
          side={THREE.DoubleSide}
          transparent
          opacity={opacity}
        />
      )}
    </mesh>
  );
}

export function Box3DThree({ isOpen, onClick, season }: Box3DThreeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const shakeRef = useRef<THREE.Group>(null!);
  const lidRef = useRef<THREE.Group>(null!);
  const orbRef = useRef<THREE.Mesh>(null!);
  
  const [hovered, setHovered] = useState(false);
  const [animState, setAnimState] = useState<"closed" | "lift" | "lidOpen" | "sink">("closed");
  const lidOpenTimeRef = useRef<number | null>(null);

  const frontTexture = useTexture("/front-box.png");

  // Premium light slate gray/silver color for the box body
  const boxColor = "#8e8e98";

  // Track the multi-stage animation sequence when isOpen becomes true
  useEffect(() => {
    if (isOpen) {
      const t0 = setTimeout(() => {
        setAnimState("lift");
      }, 0);
      const t1 = setTimeout(() => {
        setAnimState("lidOpen");
        lidOpenTimeRef.current = performance.now();
      }, 450);
      const t2 = setTimeout(() => {
        setAnimState("sink");
      }, 850);
      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      const tClosed = setTimeout(() => {
        setAnimState("closed");
        lidOpenTimeRef.current = null;
      }, 0);
      return () => clearTimeout(tClosed);
    }
  }, [isOpen]);

  // Spring animation definitions for smooth, physical transitions
  const { posY, scale, rotX, rotY, lidAngle, opacity } = useSpring({
    posY: animState === "closed" ? 0 : animState === "sink" ? -4.5 : 0.6,
    scale: animState === "closed" ? 1 : animState === "sink" ? 0.1 : 1.15,
    rotX: animState === "closed" ? (hovered ? -0.15 : 0) : animState === "lift" ? -0.28 : animState === "lidOpen" ? -0.15 : 0,
    rotY: animState === "closed" ? (hovered ? HOVER_BOX_ROT_Y : CLOSED_BOX_ROT_Y) : CLOSED_BOX_ROT_Y + Math.PI * 2,
    lidAngle: animState === "lidOpen" || animState === "sink" ? -2.4 : 0,
    opacity: animState === "sink" ? 0 : 1,
    config: (key) => {
      if (key === "rotY") return { tension: 120, friction: 14 }; // fast spin on click
      if (key === "lidAngle") return { tension: 180, friction: 12 }; // snappy lid snap open
      if (key === "posY" && animState === "sink") return { tension: 60, friction: 18 }; // smooth sink
      if (key === "scale" && animState === "sink") return { tension: 60, friction: 18 }; // smooth shrink
      return { tension: 150, friction: 18 };
    }
  });

  // Idle floating animation and physical snap impact shake
  useFrame((state) => {
    if (!shakeRef.current) return;

    if (animState === "closed") {
      const t = state.clock.elapsedTime;
      shakeRef.current.position.y = Math.sin(t * 0.8) * 0.08;
      shakeRef.current.rotation.y = Math.sin(t * 0.5) * 0.04;
      shakeRef.current.rotation.x = 0;
      shakeRef.current.rotation.z = 0;
    } else if (animState === "lidOpen" && lidOpenTimeRef.current !== null) {
      const elapsed = (performance.now() - lidOpenTimeRef.current) / 1000;
      if (elapsed < 0.6) {
        // High frequency decaying shake on X and Z rotation for physical feedback
        const shakeAmp = 0.04 * Math.exp(-elapsed * 6) * Math.sin(elapsed * 45);
        shakeRef.current.rotation.x = shakeAmp;
        shakeRef.current.rotation.z = shakeAmp * 0.5;
        // Subtle vertical impact bounce
        shakeRef.current.position.y = 0.08 * Math.exp(-elapsed * 6) * Math.cos(elapsed * 35);
      } else {
        shakeRef.current.position.set(0, 0, 0);
        shakeRef.current.rotation.set(0, 0, 0);
      }
    } else {
      shakeRef.current.position.set(0, 0, 0);
      shakeRef.current.rotation.set(0, 0, 0);
    }

    // Inner glowing energy orb breathing animation
    if (orbRef.current && (animState === "lidOpen" || animState === "sink")) {
      const t = state.clock.elapsedTime;
      const s = 1.0 + Math.sin(t * 8) * 0.12;
      orbRef.current.scale.set(s, s, s);
    }
  });

  const handlePointerOver = () => {
    if (animState === "closed") {
      setHovered(true);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "default";
  };

  const handleClick = () => {
    if (animState === "closed") onClick();
  };

  return (
    <animated.group
      ref={groupRef}
      position-y={posY}
      scale={scale.to((s) => [s, s, s])}
      rotation-x={rotX}
      rotation-y={rotY}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <group ref={shakeRef}>
        {/* Front face background (DoubleSided and Lit so it is visible from the inside) */}
        <mesh position={[0, 0, BOX_D / 2]}>
          <planeGeometry args={[BOX_W, BOX_H]} />
          <AnimatedStandardMaterial
            color={boxColor}
            side={THREE.DoubleSide}
            transparent
            opacity={opacity}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        {/* Front face texture (Basic Material to preserve bright artwork colors) */}
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
          color={boxColor}
          opacity={opacity}
          roughness={0.25}
          metalness={0.2}
        />

        {/* Right face */}
        <BoxFace
          position={[BOX_W / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          size={[BOX_D, BOX_H]}
          color={boxColor}
          opacity={opacity}
          roughness={0.25}
          metalness={0.2}
        />

        {/* Left face */}
        <BoxFace
          position={[-BOX_W / 2, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          size={[BOX_D, BOX_H]}
          color={boxColor}
          opacity={opacity}
          roughness={0.25}
          metalness={0.2}
        />

        {/* Bottom face */}
        <BoxFace
          position={[0, -BOX_H / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={[BOX_W, BOX_D]}
          color={boxColor}
          opacity={opacity}
          roughness={0.3}
          metalness={0.1}
        />

        {/* Lid group - pivots from top-back edge of box */}
        <animated.group
          ref={lidRef}
          position={[0, BOX_H / 2, -BOX_D / 2]}
          rotation-x={lidAngle}
        >
          {/* Lid top panel */}
          <BoxFace
            position={[0, 0, BOX_D / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            size={[BOX_W, BOX_D]}
            color={boxColor}
            opacity={opacity}
            roughness={0.25}
            metalness={0.2}
          />
          {/* Lid front panel (flap) */}
          <BoxFace
            position={[0, -0.2, BOX_D + 0.005]}
            rotation={[0, 0, 0]}
            size={[BOX_W, 0.4]}
            color={boxColor}
            opacity={opacity}
            roughness={0.25}
            metalness={0.2}
          />
          {/* Lid left panel (flap) */}
          <BoxFace
            position={[-BOX_W / 2 - 0.005, -0.2, BOX_D / 2]}
            rotation={[0, -Math.PI / 2, 0]}
            size={[BOX_D, 0.4]}
            color={boxColor}
            opacity={opacity}
            roughness={0.25}
            metalness={0.2}
          />
          {/* Lid right panel (flap) */}
          <BoxFace
            position={[BOX_W / 2 + 0.005, -0.2, BOX_D / 2]}
            rotation={[0, Math.PI / 2, 0]}
            size={[BOX_D, 0.4]}
            color={boxColor}
            opacity={opacity}
            roughness={0.25}
            metalness={0.2}
          />
        </animated.group>

        {/* Light burst from inside (Season-themed light colors) */}
        {(animState === "lidOpen" || animState === "sink") && (
          <pointLight
            position={[0, BOX_H / 4, 0]}
            color={season === "season2" ? "#ffd788" : "#88d8ff"}
            intensity={animState === "lidOpen" ? 18 : 0}
            distance={6}
            decay={1.5}
          />
        )}

        {/* Glowing energy orb inside (Season-themed orb colors) */}
        {(animState === "lidOpen" || animState === "sink") && (
          <mesh ref={orbRef} position={[0, BOX_H / 4, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color={season === "season2" ? "#ffa833" : "#33ccff"}
              toneMapped={false}
              transparent
              opacity={animState === "lidOpen" ? 0.75 : 0}
            />
          </mesh>
        )}

        {/* Hover outline glow effect (Season-themed glow) */}
        {hovered && animState === "closed" && (
          <mesh>
            <boxGeometry args={[BOX_W + 0.05, BOX_H + 0.05, BOX_D + 0.05]} />
            <meshBasicMaterial
              color={season === "season2" ? "#ffd788" : "#88aaff"}
              transparent
              opacity={0.08}
              side={THREE.BackSide}
            />
          </mesh>
        )}
      </group>
    </animated.group>
  );
}
