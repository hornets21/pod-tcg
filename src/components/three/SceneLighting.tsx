"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function SceneLighting() {
  const topLightRef = useRef<THREE.PointLight>(null!);
  const rimLightRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (topLightRef.current) {
      topLightRef.current.intensity = 2.5 + Math.sin(t * 0.8) * 0.3;
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = 1.0 + Math.sin(t * 0.5 + 1) * 0.2;
    }
  });

  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.4} color="#1a1a2e" />

      {/* Main top light */}
      <pointLight
        ref={topLightRef}
        position={[0, 8, 4]}
        intensity={2.5}
        color="#ffffff"
        distance={30}
        decay={2}
      />

      {/* Rim light (blue) */}
      <pointLight
        ref={rimLightRef}
        position={[-6, 2, -4]}
        intensity={1.0}
        color="#4488ff"
        distance={20}
        decay={2}
      />

      {/* Accent light (purple) */}
      <pointLight
        position={[6, 2, -4]}
        intensity={0.8}
        color="#aa44ff"
        distance={20}
        decay={2}
      />

      {/* Ground fill */}
      <pointLight
        position={[0, -5, 5]}
        intensity={0.3}
        color="#ff6644"
        distance={15}
        decay={2}
      />
    </>
  );
}
