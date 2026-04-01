import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

const CoreGeometry = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.mouse;

    if (meshRef.current) {
        // Dynamic rotation + Mouse follow
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, y * 0.5, 0.1) + t * 0.2;
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * 0.5, 0.1) + t * 0.3;
        meshRef.current.position.y = Math.sin(t) * 0.15;
    }
    if (outerRef.current) {
        outerRef.current.rotation.x = -t * 0.1;
        outerRef.current.rotation.z = -t * 0.2;
        // Breathing scale
        const s = 1 + Math.sin(t * 2) * 0.05;
        outerRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
        ringRef.current.rotation.z = t * 0.05;
        ringRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Central Neural Hub */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial 
            color="#14b8a6" 
            emissive="#14b8a6" 
            emissiveIntensity={4} 
            wireframe 
            transparent 
            opacity={0.9}
          />
        </mesh>
        
        {/* Core Pulsing Heart */}
        <Sphere args={[0.5, 32, 32]}>
          <MeshDistortMaterial
            color="#06b6d4"
            speed={4}
            distort={0.5}
            radius={1}
            emissive="#06b6d4"
            emissiveIntensity={3}
          />
        </Sphere>
      </Float>

      {/* Outer Geometric Web */}
      <mesh ref={outerRef}>
        <octahedronGeometry args={[2.8, 2]} />
        <meshStandardMaterial 
          color="#14b8a6" 
          wireframe 
          transparent 
          opacity={0.2} 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting Data Rings */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.5, 0.015, 16, 100]} />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[3.8, 0.01, 16, 100]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Environment Lighting */}
      <pointLight position={[10, 10, 10]} intensity={1} color="#14b8a6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      <ambientLight intensity={0.2} />
    </group>
  );
};

export const CapitaCore: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden h-screen w-full opacity-60">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <CoreGeometry />
      </Canvas>
    </div>
  );
};
