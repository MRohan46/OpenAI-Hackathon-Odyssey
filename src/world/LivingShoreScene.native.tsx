import { Canvas, useFrame } from '@react-three/fiber/native';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface SceneProps {
  reducedMotion: boolean;
  accent?: string;
}

function ShoreObjects({ reducedMotion, accent = '#FFC72C' }: SceneProps) {
  const current = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const footprints = useMemo(
    () => Array.from({ length: 9 }, (_, index) => ({ x: Math.sin(index * 0.78) * 0.38, z: index * 0.48 + 0.35 })),
    [],
  );
  const seaGlass = useMemo(
    () => [
      { color: '#77E0DC', position: [-1.72, 0.32, 1.35] as const, scale: 0.13 },
      { color: '#F7D55A', position: [1.62, 0.84, 2.45] as const, scale: 0.1 },
      { color: '#9BE9E1', position: [1.52, 0.18, 0.7] as const, scale: 0.08 },
      { color: '#FF9A84', position: [-1.45, 0.74, 3.4] as const, scale: 0.07 },
    ],
    [],
  );

  useFrame((_, delta) => {
    if (reducedMotion) return;
    elapsed.current += Math.min(delta, 0.05);
    if (current.current) {
      current.current.rotation.y = Math.sin(elapsed.current * 0.28) * 0.025;
      current.current.position.y = Math.sin(elapsed.current * 0.72) * 0.035;
    }
    if (marker.current) {
      marker.current.position.y = 0.66 + Math.sin(elapsed.current * 1.2) * 0.045;
      marker.current.rotation.y = elapsed.current * 0.34;
    }
  });

  return (
    <>
      <ambientLight intensity={2.1} />
      <directionalLight position={[-3, 7, 4]} intensity={2.2} color="#FFF8D9" />
      <group ref={current}>
        {footprints.map((footprint, index) => (
          <mesh
            key={`${footprint.x}-${footprint.z}`}
            position={[footprint.x, -0.08, footprint.z]}
            rotation={[-Math.PI / 2, 0, index % 2 ? -0.15 : 0.15]}
            scale={[0.085, 0.17, 0.035]}
          >
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color="#BFAE8C" transparent opacity={0.24} roughness={1} depthWrite={false} />
          </mesh>
        ))}
        {seaGlass.map((glass, index) => (
          <mesh key={`${glass.color}-${index}`} position={glass.position} rotation={[0.42, index * 0.9, 0.22]}>
            <icosahedronGeometry args={[glass.scale, 1]} />
            <meshPhysicalMaterial
              color={glass.color}
              transparent
              opacity={0.48}
              roughness={0.14}
              metalness={0.03}
              clearcoat={0.9}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <group ref={marker} position={[1.18, 0.66, 3.05]} scale={0.46}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.055, 16, 40]} />
          <meshStandardMaterial color={accent} transparent opacity={0.66} roughness={0.3} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.09, 18, 18]} />
          <meshStandardMaterial color={accent} transparent opacity={0.72} emissive={accent} emissiveIntensity={0.12} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

export function LivingShoreScene(props: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 3.15, -5.3], fov: 42, near: 0.1, far: 40 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.12, 2.55)}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ShoreObjects {...props} />
    </Canvas>
  );
}
