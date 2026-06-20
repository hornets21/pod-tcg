"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function CameraRig() {
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      state.pointer.x * 0.14,
      0.035,
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      0.18 + state.pointer.y * 0.09,
      0.035,
    );
    lookTarget.current.set(state.pointer.x * 0.035, state.pointer.y * 0.025, 0);
    state.camera.lookAt(lookTarget.current);
  });

  return null;
}

function MatBorder({ color }: { color: string }) {
  return (
    <group position={[0, 0, -1.12]}>
      <mesh position={[0, 3.18, 0]}>
        <boxGeometry args={[9.35, 0.025, 0.015]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, -3.18, 0]}>
        <boxGeometry args={[9.35, 0.025, 0.015]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
      <mesh position={[-4.66, 0, 0]}>
        <boxGeometry args={[0.025, 6.35, 0.015]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
      <mesh position={[4.66, 0, 0]}>
        <boxGeometry args={[0.025, 6.35, 0.015]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

function CardZone({
  position,
  opacity = 0.16,
}: {
  position: [number, number, number];
  opacity?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[1.34, 1.9]} />
        <meshBasicMaterial color="#d8c59a" transparent opacity={opacity * 0.22} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[0.27, 0.285, 48]} />
        <meshBasicMaterial color="#d8c59a" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, 0.007]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.34, 0.34, 0.008]} />
        <meshBasicMaterial color="#d8c59a" transparent opacity={opacity * 0.45} wireframe />
      </mesh>
    </group>
  );
}

function FoilDust({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const values = new Float32Array(42 * 3);
    for (let index = 0; index < 42; index++) {
      values[index * 3] = ((index * 0.6180339) % 1 - 0.5) * 7.6;
      values[index * 3 + 1] = ((index * 0.381966) % 1 - 0.5) * 5.2;
      values[index * 3 + 2] = -0.78 + (index % 4) * 0.03;
    }
    return values;
  }, []);

  useFrame((state) => {
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.16 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
    pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.025;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.026}
        transparent
        opacity={0.18}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function CollectorTableThree({ season }: { season: string }) {
  const accent = season === "season2" ? "#d7b66a" : "#b7a7d9";

  return (
    <>
      <CameraRig />

      <ambientLight intensity={0.7} color="#6e7180" />
      <directionalLight position={[-4, 6, 5]} intensity={1.7} color="#fff4dc" />
      <spotLight
        position={[2.5, 3.5, 5]}
        angle={0.55}
        penumbra={0.9}
        intensity={8}
        distance={12}
        color="#ffe8b5"
      />

      <mesh position={[0, 0, -1.35]} receiveShadow>
        <boxGeometry args={[10.2, 7.2, 0.32]} />
        <meshStandardMaterial color="#111318" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0, -1.16]}>
        <planeGeometry args={[9.5, 6.5]} />
        <meshStandardMaterial color="#181b22" roughness={0.98} metalness={0.02} />
      </mesh>

      <MatBorder color={accent} />

      <group position={[0, 0, -1.08]}>
        <CardZone position={[-3.55, 0.7, 0]} />
        <CardZone position={[-3.55, -1.45, 0]} opacity={0.11} />
        <CardZone position={[3.55, 1.75, 0]} opacity={0.12} />
        <CardZone position={[3.55, -0.35, 0]} />
        <CardZone position={[3.55, -2.1, 0]} opacity={0.1} />
      </group>

      <mesh position={[0, 0, -1.02]}>
        <planeGeometry args={[3.25, 4.45]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} />
      </mesh>
      <FoilDust color={accent} />
    </>
  );
}
