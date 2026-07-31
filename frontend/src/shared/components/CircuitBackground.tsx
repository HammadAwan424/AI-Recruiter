import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import * as random from "maath/random/dist/maath-random.esm";

function CircuitLines() {
  const lineRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
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
      <PointMaterial
        transparent
        color="#39ff14"
        size={0.04}
        sizeAttenuation
        depthWrite={false}
      />
    </group>
  );
}

function CircuitParticles() {
  const ref = useRef<THREE.Points>(null);
  const sphere = useMemo(
    () => random.inSphere(new Float32Array(700), { radius: 12 }) as Float32Array,
    []
  );

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta / 18;
      ref.current.rotation.x -= delta / 25;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 6]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#22ff99"
          size={0.035}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
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
        <CircuitParticles />
      </Canvas>
    </div>
  );
};
