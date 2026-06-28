"use client";

import { ComponentType, useRef, useState, useEffect } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { animated, useSpring } from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface PackSingleThreeProps {
  season: string;
  onClick: () => void;
  isClicked: boolean;
  packSize?: number;
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
  packSize = 5,
}: PackSingleThreeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [mounted, setMounted] = useState(false);

  // Trigger the entrance transition on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 150); // Small delay to let R3F canvas mount cleanly
    return () => clearTimeout(timer);
  }, []);

  const isS2 = season === "season2" && packSize !== 1;
  const heroScale = 1.35;
  const packW = (packSize === 1 ? 1.7 : isS2 ? 2.0 : 1.6) * heroScale;
  const packH = (packSize === 1 ? 2.4 : isS2 ? 2.0 : 2.4) * heroScale;
  const thickness = 0.04;
  const frontTexture = useTexture(
    packSize === 1
      ? "/pack_tcg_op_2_one_per_pack.webp"
      : (season === "season2" ? "/pack_tcg_op_2.png" : "/pack_tcg_op_1.png"),
  );

  // Match cut: move the pack slightly toward the camera before the tear scene.
  // Entrance transition: Spin, zoom (scale), and fade in from the back (posZ: -3.5).
  // ThreeScene camera: z=6.7, fov=45.
  const { posZ, rotY, scl, opac } = useSpring({
    posZ: isClicked ? 0.7 : mounted ? 0 : -3.5,
    rotY: isClicked ? 0 : mounted ? 0 : Math.PI * 1.5,
    scl: isClicked ? 1.0 : mounted ? 1.0 : 0.05,
    opac: mounted ? 1.0 : 0.0,
    config: { 
      tension: isClicked ? 50 : 35, // Elegant cinematic physics
      friction: isClicked ? 16 : 14, 
    },
  });

  // Keep the approved idle motion, but smoothly transition to 0 when clicked.
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isClicked) {
      // Smoothly lerp local floating offset back to 0 during the zoom transition
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0,
        12 * delta,
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        0,
        12 * delta,
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        0,
        12 * delta,
      );
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.12;
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.03;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
  });

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!isClicked && mounted) {
      document.body.style.cursor = "default";
      onClick();
    }
  }

  function handlePointerOver(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    if (!isClicked && mounted) {
      document.body.style.cursor = "pointer";
    }
  }

  function handlePointerOut() {
    document.body.style.cursor = "default";
  }

  return (
    <animated.group
      ref={groupRef}
      position-z={posZ}
      rotation-y={rotY}
      scale={scl.to((s) => [s, s, s])}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Front face */}
      <mesh position={[0, 0, thickness / 2]} castShadow>
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
    </animated.group>
  );
}

