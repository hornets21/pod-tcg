"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneLighting } from "./SceneLighting";
import { Starfield, FloatingDust } from "./Starfield";

interface ThreeSceneProps {
  children: React.ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fogColor?: string;
  showAtmosphere?: boolean;
  showDefaultLighting?: boolean;
}

export function ThreeScene({
  children,
  className = "",
  cameraPosition = [0, 0, 7],
  fogColor = "#06060f",
  showAtmosphere = true,
  showDefaultLighting = true,
}: ThreeSceneProps) {
  return (
    <div
      className={`three-scene-container ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "auto",
      }}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        shadows
        dpr={[1, 2]}
      >
        {/* Scene fog */}
        <fog attach="fog" args={[fogColor, 15, 50]} />

        {/* Lighting */}
        {showDefaultLighting && <SceneLighting />}

        {/* Background stars */}
        {showAtmosphere && <Starfield count={250} />}
        {showAtmosphere && <FloatingDust count={50} />}

        {/* Scene content */}
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
