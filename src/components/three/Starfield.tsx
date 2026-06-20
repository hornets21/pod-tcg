"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Generate stable random data outside component (module-level, runs once)
function generateStarData(count: number) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Use deterministic seed-like pattern with index
    const t = (i * 2.399963229728653) % (Math.PI * 2); // golden angle
    const r = Math.sqrt(i / count);
    positions[i * 3] = (r * Math.cos(t) + (i % 7) * 0.5 - 1.75) * 20;
    positions[i * 3 + 1] = ((i * 0.137) % 1 - 0.5) * 50;
    positions[i * 3 + 2] = -((i * 0.293) % 1) * 40 - 5;
    sizes[i] = ((i * 0.174) % 1) * 2 + 0.5;
  }
  return { positions, sizes };
}

function generateDustData(count: number) {
  const arr = new Float32Array(count * 3);
  const speeds: Array<{ dx: number; dy: number; phase: number }> = [];
  for (let i = 0; i < count; i++) {
    const t = (i * 1.618033988749895) % (Math.PI * 2);
    arr[i * 3] = (Math.cos(t) * (i % 5) * 0.5) % 10;
    arr[i * 3 + 1] = ((i * 0.271) % 1 - 0.5) * 12;
    arr[i * 3 + 2] = ((i * 0.382) % 1 - 0.5) * 10;
    speeds.push({
      dx: (((i % 11) * 0.00018) - 0.001) * 0.5,
      dy: (((i % 7) * 0.00043) + 0.001) * 0.5,
      phase: (i * 0.523) % (Math.PI * 2),
    });
  }
  return { arr, speeds };
}

interface StarfieldProps {
  count?: number;
  color?: string;
}

export function Starfield({ count = 300, color = "#c5a880" }: StarfieldProps) {
  const meshRef = useRef<THREE.Points>(null!);
  const data = useMemo(() => generateStarData(count), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = Math.sin(t * 0.05) * 0.1;
    meshRef.current.rotation.x = Math.sin(t * 0.03) * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function FloatingDust({ count = 60, color = "#c5a880" }: { count?: number; color?: string }) {
  const meshRef = useRef<THREE.Points>(null!);
  const { arr: initialPositions, speeds } = useMemo(() => generateDustData(count), [count]);
  const currentPositions = useMemo(() => new Float32Array(initialPositions), [initialPositions]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const pos = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const nx = (pos.getX(i) + speeds[i].dx + Math.sin(t * 0.5 + speeds[i].phase) * 0.001);
      pos.setX(i, nx);
      let y = pos.getY(i) + speeds[i].dy;
      if (y > 6) y = -6;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[currentPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.2}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
