"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Use a seeded pseudo-random generator so Math.random is not called during render
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateBurstData(count: number, seed: number = 42) {
  const rng = seededRng(seed);
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const speed = 0.04 + rng() * 0.08;
    velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed * 1.5;
    velocities[i * 3 + 2] = Math.cos(phi) * speed;
    sizes[i] = rng() * 3 + 1;
  }

  return { positions, velocities, sizes };
}

interface BurstParticlesProps {
  active: boolean;
  color?: string;
  count?: number;
  position?: [number, number, number];
}

export function BurstParticles({
  active,
  color = "#88aaff",
  count = 120,
  position = [0, 0, 0],
}: BurstParticlesProps) {
  const meshRef = useRef<THREE.Points>(null!);
  const startTime = useRef<number>(0);
  const prevActive = useRef(false);

  const { positions, velocities, sizes } = useMemo(
    () => generateBurstData(count, count * 7),
    [count]
  );

  // Use ref for mutable position array to avoid immutability lint errors
  const currentPositionsRef = useRef<Float32Array>(new Float32Array(positions));

  useFrame((state) => {
    if (!meshRef.current) return;

    if (active && !prevActive.current) {
      startTime.current = state.clock.elapsedTime;
      prevActive.current = true;
      for (let i = 0; i < count; i++) {
        currentPositionsRef.current[i * 3] = 0;
        currentPositionsRef.current[i * 3 + 1] = 0;
        currentPositionsRef.current[i * 3 + 2] = 0;
      }
    }

    if (!active) {
      prevActive.current = false;
      return;
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const gravity = -0.002;

    for (let i = 0; i < count; i++) {
      currentPositionsRef.current[i * 3] += velocities[i * 3];
      currentPositionsRef.current[i * 3 + 1] += velocities[i * 3 + 1] + gravity * elapsed;
      currentPositionsRef.current[i * 3 + 2] += velocities[i * 3 + 2];
    }

    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.set(currentPositionsRef.current);
    posAttr.needsUpdate = true;

    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - elapsed / 1.5);
  });

  if (!active) return null;

  return (
    <group position={position}>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color={color}
          transparent
          opacity={1}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// God Pack shockwave ring
export function GodPackRing({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const startTime = useRef(0);
  const prevActive = useRef(false);

  useFrame((state) => {
    if (!meshRef.current) return;

    if (active && !prevActive.current) {
      startTime.current = state.clock.elapsedTime;
      prevActive.current = true;
    }
    if (!active) {
      prevActive.current = false;
      return;
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const scale = 1 + elapsed * 8;
    meshRef.current.scale.set(scale, scale, 1);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 0.6 - elapsed * 0.4);
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <ringGeometry args={[0.8, 1.0, 64]} />
      <meshBasicMaterial
        color="#ffd700"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
