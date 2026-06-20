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

  // Match Cut: ซองพุ่งไปข้างหน้าเล็กน้อยก่อนตัดไปหน้าฉีก
  // ThreeScene camera: z=6.7, fov=45
  // ที่ z=0.7 (distance=6.0) → ซอง ~65.1% ของจอ → พอดีมองเห็นและไม่ล้นจอ
  const { posZ } = useSpring({
    posZ: isClicked ? 0.7 : 0,
    config: { tension: 150, friction: 14 },
  });

  // Idle animation — หยุดเมื่อกดแล้ว
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
      position-z={posZ}
      onClick={isClicked ? undefined : onClick}
    >
      {/* Front face */}
      <mesh position={[0, 0, thickness / 2]} castShadow>
        <planeGeometry args={[packW, packH]} />
        <AnimatedBasicMaterial
          map={frontTexture}
          transparent
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
          opacity={0.6}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>


    </animated.group>
  );
}
