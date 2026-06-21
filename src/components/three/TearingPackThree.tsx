"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface TearingPackThreeProps {
  season: string;
  mode?: "single" | "box";
  // Callbacks kept for API compat with PackRipOverlay3D. The tear is always
  // time-based (auto), so autoStart has no effect — the original always
  // tears on its own.
  prefersReducedMotion?: boolean;
  onTearStart?: () => void;
  onTearThreshold?: () => void;
  onTearComplete?: () => void;
  sharedProgressRef?: { current: number };
  autoStart?: boolean;
}

export function TearingPackThree({
  season,
  mode = "single",
  prefersReducedMotion = false,
  onTearStart,
  onTearThreshold,
  onTearComplete,
  sharedProgressRef,
  autoStart: _autoStart = true,
}: TearingPackThreeProps) {
  void _autoStart;
  const topGroupRef = useRef<THREE.Group>(null!);
  const bottomGroupRef = useRef<THREE.Group>(null!);
  const startTimeRef = useRef<number | null>(null);
  const callbacksFiredRef = useRef({ start: false, threshold: false, complete: false });

  const isS2 = season === "season2";
  const heroScale = 1.35;
  const packW = (isS2 ? 2.0 : 1.6) * heroScale;
  const packH = (isS2 ? 2.0 : 2.4) * heroScale;
  const thickness = 0.04;

  const texture = useTexture(
    isS2 ? "/pack_tcg_op_2.png" : "/pack_tcg_op_1.png"
  );

  // Clone textures so we can set offset/repeat without mutating the cached one
  const [topTexture, bottomTexture] = useMemo(() => {
    const top = texture.clone();
    top.repeat.set(1, 0.285);
    top.offset.set(0, 1 - 0.285);
    top.needsUpdate = true;

    const bottom = texture.clone();
    bottom.repeat.set(1, 0.715);
    bottom.offset.set(0, 0);
    bottom.needsUpdate = true;

    return [top, bottom];
  }, [texture]);

  useFrame((state) => {
    if (!topGroupRef.current || !bottomGroupRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = (state.clock.elapsedTime - startTimeRef.current) * 1000; // ms

    // Fire tear-start callback once on the very first frame.
    if (!callbacksFiredRef.current.start) {
      callbacksFiredRef.current.start = true;
      onTearStart?.();
    }

    // Reduced-motion: skip the shake anticipation but still play the tear
    // so the player sees the pack rip open (core gameplay, not decorative).
    const effectiveElapsed = prefersReducedMotion ? Math.max(elapsed, 300) : elapsed;

    // Report tear progress (0–1) to the cinematic camera.
    if (sharedProgressRef) {
      sharedProgressRef.current = Math.min(1, effectiveElapsed / 1000);
    }

    if (effectiveElapsed < 300) {
      // 1. Shaking anticipation
      const shakeX = Math.sin(effectiveElapsed * 0.08) * 0.035;
      const shakeY = Math.cos(effectiveElapsed * 0.09) * 0.025;

      topGroupRef.current.position.set(shakeX, shakeY, 0);
      bottomGroupRef.current.position.set(shakeX, shakeY, 0);

      topGroupRef.current.rotation.set(0, 0, 0);
      bottomGroupRef.current.rotation.set(0, 0, 0);

      setGroupOpacity(topGroupRef.current, 1);
      setGroupOpacity(bottomGroupRef.current, 1);
    } else if (effectiveElapsed <= 1000) {
      // 2. Tearing apart — fire threshold callback once when it begins.
      if (!callbacksFiredRef.current.threshold) {
        callbacksFiredRef.current.threshold = true;
        onTearThreshold?.();
      }
      const progress = (effectiveElapsed - 300) / 700; // 0 to 1
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const opacity = 1 - Math.pow(progress, 3); // fade out at the end

      // Top piece: flies up, left, and tilts
      topGroupRef.current.position.x = easeProgress * -3.5;
      topGroupRef.current.position.y = easeProgress * 4.2;
      topGroupRef.current.rotation.z = easeProgress * -0.42;

      // Bottom piece: moves down slightly
      bottomGroupRef.current.position.y = -easeProgress * 2.2;

      setGroupOpacity(topGroupRef.current, opacity);
      setGroupOpacity(bottomGroupRef.current, opacity);
    } else {
      // 3. Finished tearing, hide them — fire complete callback once.
      topGroupRef.current.visible = false;
      bottomGroupRef.current.visible = false;
      if (!callbacksFiredRef.current.complete) {
        callbacksFiredRef.current.complete = true;
        onTearComplete?.();
      }
    }
  });



  // Geometry dimensions for each half
  const topH = packH * 0.285;
  const bottomH = packH * 0.715;

  // Match Cut: ปรับตำแหน่งและขนาดให้ตรงกับซองตอนซูมเสร็จของแต่ละโหมดแบบ 100% ไร้รอยต่อ
  // single: PackSingleThree zoom -> z=0.7, scale=1.0 (ThreeScene fov=45)
  //         ใน PackRipOverlay3D (fov=50) ต้องใช้ groupZ=0.7, groupS=1.126 เพื่อชดเชยค่า fov
  // box: BoosterPackThree zoom -> z=3.5, scale=1.2 (UnboxingClient fov=45, cameraY=0.5, packY=0.2, multiPackScale=0.85)
  //         ใน PackRipOverlay3D (fov=50, cameraY=0.08) ต้องใช้ groupZ=1.0, groupS=1.21, groupY=-0.35
  const isSingle = mode === "single";
  const groupZ = isSingle ? 0.7 : 1.0;
  const groupY = isSingle ? 0 : -0.35;
  const groupX = 0;
  const groupS = isSingle ? 1.126 : 1.21;

  return (
    <group position={[groupX, groupY, groupZ]} scale={[groupS, groupS, groupS]}>
      {/* ── TOP HALF GROUP ── */}
      <group ref={topGroupRef}>
        {/* Front Face */}
        <mesh position={[0, packH / 2 - topH / 2, thickness / 2]}>
          <planeGeometry args={[packW, topH]} />
          <meshBasicMaterial map={topTexture} transparent side={THREE.FrontSide} toneMapped={false} />
        </mesh>

        {/* Back Face (foil) */}
        <mesh position={[0, packH / 2 - topH / 2, -thickness / 2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[packW, topH]} />
          <meshStandardMaterial color="#d2d2d7" transparent roughness={0.15} metalness={0.85} />
        </mesh>
      </group>

      {/* ── BOTTOM HALF GROUP ── */}
      <group ref={bottomGroupRef}>
        {/* Front Face */}
        <mesh position={[0, -packH / 2 + bottomH / 2, thickness / 2]}>
          <planeGeometry args={[packW, bottomH]} />
          <meshBasicMaterial map={bottomTexture} transparent side={THREE.FrontSide} toneMapped={false} />
        </mesh>

        {/* Back Face (foil) */}
        <mesh position={[0, -packH / 2 + bottomH / 2, -thickness / 2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[packW, bottomH]} />
          <meshStandardMaterial color="#d2d2d7" transparent roughness={0.15} metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

function setGroupOpacity(group: THREE.Group, opacity: number) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = opacity;
        });
      } else if (child.material) {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    }
  });
}

