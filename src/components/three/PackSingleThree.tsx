"use client";

import { useRef, ComponentType } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface PackSingleThreeProps {
  season: string;
  onClick: () => void;
  isClicked: boolean;
}

const AnimatedMaterial = animated.meshStandardMaterial as ComponentType<{
  [key: string]: unknown;
}>;
const AnimatedBasicMaterial = animated.meshBasicMaterial as ComponentType<{
  [key: string]: unknown;
}>;

export function PackSingleThree({
  season,
  onClick,
  isClicked,
}: PackSingleThreeProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const isS2 = season === "season2";
  const heroScale = 1.35;
  const packW = (isS2 ? 2.0 : 1.6) * heroScale;
  const packH = (isS2 ? 2.0 : 2.4) * heroScale;
  const thickness = 0.04;
  const frontTexture = useTexture(
    isS2 ? "/pack_tcg_op_2.png" : "/pack_tcg_op_1.png",
  );

  const { scl, rotY } = useSpring({
    scl: isClicked ? 0.3 : 1.0,
    rotY: isClicked ? Math.PI * 2 : 0,
    config: { tension: 200, friction: 18 },
  });

  const { opac } = useSpring({
    opac: isClicked ? 0 : 1,
    config: { tension: 80, friction: 15, delay: isClicked ? 300 : 0 },
  });

  // Idle animation
  useFrame((state) => {
    if (!groupRef.current || isClicked) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.12;
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.03;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
  });

  return (
    <animated.group
      ref={groupRef}
      scale={scl.to((s) => [s, s, s])}
      rotation-y={rotY}
      onClick={isClicked ? undefined : onClick}
    >
      {/* Front face */}
      <mesh position={[0, 0, thickness / 2 + 0.01]}>
        <planeGeometry args={[packW, packH]} />
        <AnimatedBasicMaterial
          map={frontTexture}
          transparent
          opacity={opac}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* Back face (foil) */}
      <mesh position={[0, 0, -thickness / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[packW, packH]} />
        <AnimatedMaterial
          color="#d2d2d7"
          transparent
          opacity={opac.to((o) => o * 0.6)}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Thickness */}
      {/* Left edge */}
      <mesh position={[-packW / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[thickness, packH]} />
        <AnimatedMaterial
          color="#d2d2d7"
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={opac}
        />
      </mesh>
      {/* Right edge */}
      <mesh position={[packW / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[thickness, packH]} />
        <AnimatedMaterial
          color="#d2d2d7"
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={opac}
        />
      </mesh>
      {/* Top edge */}
      <mesh position={[0, packH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[packW, thickness]} />
        <AnimatedMaterial
          color="#d2d2d7"
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={opac}
        />
      </mesh>
      {/* Bottom edge */}
      <mesh position={[0, -packH / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[packW, thickness]} />
        <AnimatedMaterial
          color="#d2d2d7"
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={opac}
        />
      </mesh>
    </animated.group>
  );
}
