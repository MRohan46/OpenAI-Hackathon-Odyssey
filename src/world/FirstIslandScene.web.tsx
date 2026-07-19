/* eslint-disable react/no-unknown-property -- React Three Fiber mesh props are valid scene attributes. */
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface FirstIslandSceneProps {
  reducedMotion: boolean;
}

interface DriftParticle {
  position: readonly [number, number, number];
  scale: number;
  phase: number;
  color: string;
}

function IslandAtmosphere({ reducedMotion }: FirstIslandSceneProps) {
  const atmosphere = useRef<THREE.Group>(null);
  const routeRings = useRef<THREE.Group>(null);
  const lightShafts = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);

  const particles = useMemo<DriftParticle[]>(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        position: [
          Math.sin(index * 2.17) * (2.8 + (index % 4) * 0.34),
          Math.cos(index * 1.31) * 1.9 + (index % 3) * 0.3,
          -1.4 + (index % 7) * 0.42,
        ] as const,
        scale: 0.018 + (index % 5) * 0.006,
        phase: index * 0.47,
        color: index % 4 === 0 ? '#FFE8A3' : index % 3 === 0 ? '#CFFFF4' : '#FFFFFF',
      })),
    [],
  );

  const haze = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        position: [
          -4.8 + index * 0.94,
          -1.2 + Math.sin(index * 1.4) * 1.35,
          -2.2 + (index % 4) * 0.48,
        ] as const,
        scale: [2.2 + (index % 3) * 0.8, 0.58 + (index % 2) * 0.22, 1] as const,
        opacity: 0.035 + (index % 3) * 0.016,
      })),
    [],
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  useFrame(({ camera }, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    const time = elapsed.current;
    const targetX = reducedMotion ? 0 : pointer.current.x * 0.13;
    const targetY = reducedMotion ? 0 : -pointer.current.y * 0.08;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3.1, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3.1, delta);
    camera.lookAt(0, 0, 0);

    if (reducedMotion) return;
    if (atmosphere.current) {
      atmosphere.current.rotation.z = Math.sin(time * 0.08) * 0.025;
      atmosphere.current.position.x = Math.sin(time * 0.13) * 0.08;
    }
    if (routeRings.current) {
      routeRings.current.rotation.z = time * 0.055;
      routeRings.current.position.y = Math.sin(time * 0.52) * 0.04;
    }
    if (lightShafts.current) {
      lightShafts.current.rotation.z = -0.1 + Math.sin(time * 0.17) * 0.035;
      lightShafts.current.position.x = Math.cos(time * 0.12) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#FFF4C7" />

      <group ref={lightShafts} position={[2.5, 1.45, -1.8]}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[index * 0.34, 0, index * -0.08]} rotation={[0, 0, -0.74]}>
            <planeGeometry args={[0.34 + index * 0.12, 6.4]} />
            <meshBasicMaterial
              color="#FFF0B5"
              transparent
              opacity={0.045 - index * 0.008}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={routeRings} position={[0.2, -0.2, -0.6]} rotation={[0.42, 0.1, 0]}>
        {[0.72, 1.02, 1.34].map((radius, index) => (
          <mesh key={radius} rotation={[Math.PI / 2, 0, index * 0.4]}>
            <torusGeometry args={[radius, 0.012 + index * 0.004, 10, 72]} />
            <meshBasicMaterial
              color={index === 1 ? '#FFE8A3' : '#E8FFFB'}
              transparent
              opacity={0.18 - index * 0.025}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={atmosphere}>
        {haze.map((cloud, index) => (
          <mesh key={`haze-${index}`} position={cloud.position} scale={cloud.scale}>
            <sphereGeometry args={[1, 18, 12]} />
            <meshBasicMaterial
              color={index % 2 ? '#E8FFFB' : '#FFFFFF'}
              transparent
              opacity={cloud.opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}

        {particles.map((particle, index) => (
          <mesh
            key={`particle-${index}`}
            position={particle.position}
            scale={particle.scale}
            rotation={[particle.phase, particle.phase * 0.7, particle.phase * 0.2]}
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial
              color={particle.color}
              transparent
              opacity={0.32 + (index % 4) * 0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group position={[-2.35, -1.24, -0.5]} rotation={[0.18, 0.22, 0.12]}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[index * 0.38, index * 0.08, index * -0.1]} rotation={[0.3, index, 0.4]}>
            <octahedronGeometry args={[0.08 + index * 0.018, 0]} />
            <meshPhysicalMaterial
              color={index === 1 ? '#78E7E0' : '#FFF1B8'}
              transparent
              opacity={0.48}
              roughness={0.15}
              clearcoat={1}
              emissive={index === 1 ? '#1FBAC8' : '#FFC72C'}
              emissiveIntensity={0.16}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function FirstIslandScene(props: FirstIslandSceneProps) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let frame: number | undefined;

    try {
      const probe = document.createElement('canvas');
      const context = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ?? probe.getContext('webgl');
      const extension = context?.getExtension('WEBGL_lose_context');
      extension?.loseContext();

      if (context) frame = window.requestAnimationFrame(() => setSupported(true));
    } catch {
      // The image, native haze, and companion motion remain the intentional fallback.
    }

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!supported) return null;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 44, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <IslandAtmosphere {...props} />
    </Canvas>
  );
}
