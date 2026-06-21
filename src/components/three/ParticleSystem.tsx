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

  useFrame((state, delta) => {
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
    const frameScale = Math.min(delta * 60, 2);

    for (let i = 0; i < count; i++) {
      currentPositionsRef.current[i * 3] += velocities[i * 3] * frameScale;
      currentPositionsRef.current[i * 3 + 1] +=
        (velocities[i * 3 + 1] + gravity * elapsed) * frameScale;
      currentPositionsRef.current[i * 3 + 2] += velocities[i * 3 + 2] * frameScale;
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

// God Pack shockwave ring & 3D cozy pop particles (Abeto Messenger style)
interface ParticleData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: string;
  size: number;
  rotSpeed: THREE.Vector3;
  swayPhase: number;
  swayFreq: number;
  rot: THREE.Vector3;
}

export function GodPackRing({ active }: { active: boolean }) {
  const ringsRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Group>(null!);
  const startTime = useRef(0);
  const prevActive = useRef(false);

  // Generate 45 cozy particles
  const particlesData = useMemo(() => {
    const data: ParticleData[] = [];
    const colors = ["#ffd700", "#ff9ebd", "#e2b4ff", "#ffb997", "#bbfbda"];
    const rng = seededRng(888);

    for (let i = 0; i < 45; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const speed = 0.05 + rng() * 0.12;

      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed * 1.2 + 0.03, // upward bias
        Math.cos(phi) * speed
      );

      data.push({
        pos: new THREE.Vector3(0, 0, 0),
        vel,
        color: colors[Math.floor(rng() * colors.length)],
        size: 0.15 + rng() * 0.2,
        rotSpeed: new THREE.Vector3(
          (rng() - 0.5) * 4,
          (rng() - 0.5) * 4,
          (rng() - 0.5) * 4
        ),
        swayPhase: rng() * Math.PI * 2,
        swayFreq: 1.5 + rng() * 2,
        rot: new THREE.Vector3(rng() * Math.PI, rng() * Math.PI, 0),
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!active) {
      prevActive.current = false;
      return;
    }

    if (!prevActive.current) {
      startTime.current = state.clock.elapsedTime;
      prevActive.current = true;

      // Reset positions
      if (particlesRef.current) {
        particlesRef.current.children.forEach((child) => {
          child.position.set(0, 0, 0);
          child.scale.set(0, 0, 0);
        });
      }
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const frameScale = Math.min(delta * 60, 2);

    // 1. Animate expanding concentric rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, index) => {
        const delay = index * 0.12;
        const ringTime = Math.max(0, elapsed - delay);
        
        // Elastic cozy ripples
        const scale = Math.sin(Math.min(1.5, ringTime * 3)) * (2.0 + index * 1.5);
        ring.scale.set(scale, scale, 1);
        
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.55 - ringTime * 0.45);
        ring.rotation.z = elapsed * 0.2 * (index % 2 === 0 ? 1 : -1);
      });
    }

    // 2. Animate cozy particles
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const data = particlesData[i];
        
        // Wind sway
        const t = elapsed;
        const xSway = Math.sin(t * data.swayFreq + data.swayPhase) * 0.008;
        
        // Damping movement
        const drag = Math.max(0.1, 1 - t * 0.8);
        child.position.x += (data.vel.x * drag + xSway) * frameScale;
        child.position.y += data.vel.y * drag * frameScale;
        child.position.z += data.vel.z * drag * frameScale;

        // Bouncy scale pop
        let scale = 0;
        if (t < 0.25) {
          scale = (t / 0.25) * data.size;
        } else {
          scale = Math.max(0, data.size * (1 - (t - 0.25) / 1.5));
        }
        child.scale.set(scale, scale, scale);

        // Continuous spin
        child.rotation.x += data.rotSpeed.x * delta;
        child.rotation.y += data.rotSpeed.y * delta;
        child.rotation.z += data.rotSpeed.z * delta;
      });
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Expanding cozy rings */}
      <group ref={ringsRef}>
        {[...Array(3)].map((_, i) => (
          <mesh key={i} position={[0, 0, -0.01]}>
            <ringGeometry args={[0.9, 1.05, 32]} />
            <meshBasicMaterial
              color={i === 1 ? "#ffb997" : i === 2 ? "#e2b4ff" : "#ffd700"}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Floating 3D stars (low-poly octahedrons) */}
      <group ref={particlesRef}>
        {particlesData.map((data, i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[data.rot.x, data.rot.y, 0]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={0.6}
              roughness={0.1}
              metalness={0.9}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function StandardPackRing({ active }: { active: boolean }) {
  const ringsRef = useRef<THREE.Group>(null!);
  const particlesRef = useRef<THREE.Group>(null!);
  const startTime = useRef(0);
  const prevActive = useRef(false);

  // Generate 25 cozy particles
  const particlesData = useMemo(() => {
    const data: ParticleData[] = [];
    const colors = ["#c5a880", "#4fc3f7", "#ffffff", "#ffb74d"];
    const rng = seededRng(777); // different seed to avoid identical positions

    for (let i = 0; i < 25; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const speed = 0.04 + rng() * 0.09; // slightly slower/more controlled speed

      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed * 1.1 + 0.02, // upward bias
        Math.cos(phi) * speed
      );

      data.push({
        pos: new THREE.Vector3(0, 0, 0),
        vel,
        color: colors[Math.floor(rng() * colors.length)],
        size: 0.12 + rng() * 0.14, // slightly smaller particles
        rotSpeed: new THREE.Vector3(
          (rng() - 0.5) * 3,
          (rng() - 0.5) * 3,
          (rng() - 0.5) * 3
        ),
        swayPhase: rng() * Math.PI * 2,
        swayFreq: 1.2 + rng() * 1.8,
        rot: new THREE.Vector3(rng() * Math.PI, rng() * Math.PI, 0),
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!active) {
      prevActive.current = false;
      return;
    }

    if (!prevActive.current) {
      startTime.current = state.clock.elapsedTime;
      prevActive.current = true;

      // Reset positions
      if (particlesRef.current) {
        particlesRef.current.children.forEach((child) => {
          child.position.set(0, 0, 0);
          child.scale.set(0, 0, 0);
        });
      }
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const frameScale = Math.min(delta * 60, 2);

    // 1. Animate expanding concentric rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, index) => {
        const delay = index * 0.15;
        const ringTime = Math.max(0, elapsed - delay);
        
        // Elastic cozy ripples
        const scale = Math.sin(Math.min(1.5, ringTime * 3)) * (1.3 + index * 1.0);
        ring.scale.set(scale, scale, 1);
        
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.45 - ringTime * 0.5);
        ring.rotation.z = elapsed * 0.15 * (index % 2 === 0 ? 1 : -1);
      });
    }

    // 2. Animate cozy particles
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const data = particlesData[i];
        
        // Wind sway
        const t = elapsed;
        const xSway = Math.sin(t * data.swayFreq + data.swayPhase) * 0.006;
        
        // Damping movement
        const drag = Math.max(0.1, 1 - t * 0.9);
        child.position.x += (data.vel.x * drag + xSway) * frameScale;
        child.position.y += data.vel.y * drag * frameScale;
        child.position.z += data.vel.z * drag * frameScale;

        // Bouncy scale pop
        let scale = 0;
        if (t < 0.25) {
          scale = (t / 0.25) * data.size;
        } else {
          scale = Math.max(0, data.size * (1 - (t - 0.25) / 1.2));
        }
        child.scale.set(scale, scale, scale);

        // Continuous spin
        child.rotation.x += data.rotSpeed.x * delta;
        child.rotation.y += data.rotSpeed.y * delta;
        child.rotation.z += data.rotSpeed.z * delta;
      });
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Expanding cozy rings */}
      <group ref={ringsRef}>
        {[...Array(2)].map((_, i) => (
          <mesh key={i} position={[0, 0, -0.01]}>
            <ringGeometry args={[0.9, 1.02, 32]} />
            <meshBasicMaterial
              color={i === 1 ? "#4fc3f7" : "#c5a880"}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Floating 3D stars (low-poly octahedrons) */}
      <group ref={particlesRef}>
        {particlesData.map((data, i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[data.rot.x, data.rot.y, 0]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
