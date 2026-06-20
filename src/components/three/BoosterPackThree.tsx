"use client";

import { useRef, useState, useEffect, ComponentType } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface BoosterPackThreeProps {
  index: number;
  season: string;
  isEjected: boolean;
  isOpened: boolean;
  isFadingOut?: boolean;
  isZooming?: boolean;
  onClick: () => void;
  shouldAnimate?: boolean;
}

// Arc layout for 6 packs in a fan
function getPackPosition(index: number, total: number): [number, number, number] {
  const spacing = 1.5;
  const x = (index - (total - 1) / 2) * spacing;
  // Slight arc: center packs slightly forward
  const arc = Math.cos(((index - (total - 1) / 2) / (total / 2)) * (Math.PI / 3));
  const z = arc * 0.5 - 0.5;
  return [x, 0.45, z];
}

const AnimatedMaterial = animated.meshStandardMaterial as ComponentType<{ [key: string]: unknown }>;
const AnimatedBasicMaterial = animated.meshBasicMaterial as ComponentType<{ [key: string]: unknown }>;

export function BoosterPackThree({
  index,
  season,
  isEjected,
  isOpened,
  isFadingOut = false,
  isZooming = false,
  onClick,
  shouldAnimate = true,
}: BoosterPackThreeProps) {
  const meshRef = useRef<THREE.Group>(null!);
  const [mounted, setMounted] = useState(!shouldAnimate);

  const isS2 = season === "season2";
  const multiPackScale = 0.85;
  const packW = (isS2 ? 2.0 : 1.6) * multiPackScale;
  const packH = (isS2 ? 2.0 : 2.4) * multiPackScale;
  const thickness = 0.03;
  const frontTexture = useTexture(
    isS2 ? "/pack_tcg_op_2.png" : "/pack_tcg_op_1.png",
  );

  useEffect(() => {
    if (shouldAnimate) {
      const t = setTimeout(() => setMounted(true), index * 120 + 100);
      return () => clearTimeout(t);
    }
  }, [index, shouldAnimate]);

  const targetPos = getPackPosition(index, 6);

  // Match Cut (การซูมเชื่อมซีน): ซองพุ่งเข้ามาตรงกลางก่อนตัดไปหน้าฉีก
  // UnboxingClient camera: z=7.5, fov=45
  // ที่ z=3.5 (distance=4.0), scale=1.2 → ซอง ~73.8% ของจอ → พอดีมองเห็นและเด่นชัดขึ้น
  const { posX, posY, posZ, scl, opac } = useSpring({
    posX: isZooming ? 0 : mounted && isEjected ? targetPos[0] : targetPos[0],
    posY: isZooming ? 0.2 : mounted && isEjected ? targetPos[1] : targetPos[1] - 6,
    posZ: isZooming ? 3.5 : mounted && isEjected ? targetPos[2] : targetPos[2],
    scl: isZooming ? 1.2 : isFadingOut ? 0.3 : isOpened ? 0.85 : 1,
    opac: isFadingOut ? 0 : 1,
    config: {
      tension: isZooming ? 150 : 200,
      friction: isZooming ? 14 : 18,
      delay: isZooming ? 0 : mounted ? 0 : index * 120,
    },
  });

  // Idle float
  useFrame((state) => {
    if (!meshRef.current || isOpened || isFadingOut || isZooming) return;
    const t = state.clock.elapsedTime;
    const phase = index * 0.8;
    meshRef.current.position.y = targetPos[1] + Math.sin(t * 0.9 + phase) * 0.07;
    meshRef.current.rotation.z = Math.sin(t * 0.6 + phase) * 0.03;
    meshRef.current.rotation.y = Math.sin(t * 0.4 + phase) * 0.05;
  });

  const handleClick = () => {
    if (isEjected && !isOpened && !isFadingOut && !isZooming) onClick();
  };

  const handlePointerOver = () => {
    if (!isOpened && !isFadingOut && !isZooming) {
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "default";
  };

  return (
    <animated.group
      ref={meshRef}
      position-x={posX}
      position-y={posY}
      position-z={posZ}
      scale={scl.to((s) => [s, s, s])}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Pack front */}
      <mesh position={[0, 0, thickness / 2]}>
        <planeGeometry args={[packW, packH]} />
        <AnimatedBasicMaterial
          map={frontTexture}
          transparent
          opacity={opac}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* Pack back (foil) */}
      <mesh position={[0, 0, -thickness / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[packW, packH]} />
        <AnimatedMaterial
          color="#d2d2d7"
          opacity={opac.to((o) => o * 0.7)}
          transparent
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>






      {/* Opened grayscale overlay */}
      {isOpened && (
        <mesh position={[0, 0, thickness / 2 + 0.002]}>
          <planeGeometry args={[packW, packH]} />
          <meshBasicMaterial
            map={frontTexture}
            color="#1a1824"
            transparent
            opacity={0.65}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </animated.group>
  );
}
