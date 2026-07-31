import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function CircuitLines() {
  const lineRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10;

      pts.push(new THREE.Vector3(x, y, z));
      pts.push(
        new THREE.Vector3(
          x + (Math.random() - 0.5) * 2,
          y + (Math.random() - 0.5) * 2,
          z
        )
      );
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      lineRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={lineRef}>
      <Line
        points={points}
        color="#05DC7F"
        lineWidth={0.8}
        opacity={0.9}
        transparent
      />
    </group>
  );
}

export const CircuitBackground: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.45,
        background: "radial-gradient(circle at center, #022c22, #000000)",
      }}
    >
      <Canvas camera={{ position: [0, 0, 6] }}>
        <ambientLight intensity={0.6} />
        <CircuitLines />
      </Canvas>
    </div>
  );
};
