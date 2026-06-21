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
  isReceding?: boolean;
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
  isReceding = false,
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
  const { posX, posY, posZ, scl, opac, rotX, rotY, rotZ } = useSpring({
    posX: isZooming ? 0 : mounted && isEjected ? targetPos[0] : targetPos[0],
    posY: isZooming ? 0.2 : isReceding ? targetPos[1] - 0.3 : mounted && isEjected ? targetPos[1] : targetPos[1] - 6,
    posZ: isZooming ? 3.5 : isReceding ? targetPos[2] - 1.2 : mounted && isEjected ? targetPos[2] : targetPos[2],
    scl: isZooming ? 1.2 : isReceding ? 0.6 : isFadingOut ? 0.3 : isOpened ? 0.85 : 1,
    opac: isReceding ? 0.3 : isFadingOut ? 0 : 1,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    config: {
      tension: isZooming ? 50 : isReceding ? 40 : 45, // Much slower, highly gradual cinematic drift
      friction: isZooming ? 16 : isReceding ? 20 : 18,
      delay: isZooming ? 0 : mounted ? 0 : index * 120,
    },
  });
 
  // Idle float
  useFrame((state, delta) => {
    if (!meshRef.current || isOpened || isFadingOut) return;
 
    if (isZooming) {
      // Smoothly lerp local floating offset back to 0 during the zoom transition
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 12 * delta);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 12 * delta);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 12 * delta);
      return;
    }
 
    const t = state.clock.elapsedTime;
    const phase = index * 0.8;
    const floatMult = isReceding ? 0.3 : 1;
    const targetY = Math.sin(t * 0.9 + phase) * 0.07 * floatMult;
    const targetRotZ = Math.sin(t * 0.6 + phase) * 0.03 * floatMult;
    const targetRotY = Math.sin(t * 0.4 + phase) * 0.05 * floatMult;

    // Smoothly lerp to target floating values to prevent snapping when starting/stopping the idle motion.
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 8 * delta);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotZ, 8 * delta);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 8 * delta);
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
      position-x={posX}
      position-y={posY}
      position-z={posZ}
      rotation-x={rotX}
      rotation-y={rotY}
      rotation-z={rotZ}
      scale={scl.to((s) => [s, s, s])}
    >
      <group
        ref={meshRef}
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
      </group>
    </animated.group>
  );
}
