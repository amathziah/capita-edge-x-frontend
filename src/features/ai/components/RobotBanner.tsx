import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  PerspectiveCamera,
  RoundedBox,
} from '@react-three/drei';
import { Group, MathUtils, Mesh } from 'three';

function NeoRobotHead() {
  const rig = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    if (rig.current) {
      rig.current.position.y = Math.sin(t * 0.95) * 0.025;
      rig.current.position.x = Math.sin(t * 1.45) * 0.025;
      rig.current.rotation.y = MathUtils.lerp(
        rig.current.rotation.y,
        Math.sin(t * 1.35) * 0.12 + Math.sin(t * 0.42) * 0.04,
        Math.min(1, dt * 3.2),
      );
      rig.current.rotation.z = Math.sin(t * 1.25) * 0.025;
      rig.current.rotation.x = Math.sin(t * 0.82) * 0.018;
    }

    const blink = Math.sin(t * 1.9) > 0.94 ? 0.24 : 1;
    if (leftEye.current) leftEye.current.scale.y = MathUtils.lerp(leftEye.current.scale.y, blink, dt * 12);
    if (rightEye.current) rightEye.current.scale.y = MathUtils.lerp(rightEye.current.scale.y, blink, dt * 12);
  });

  return (
    <group ref={rig} scale={0.88}>
      <group position={[-0.76, -0.03, 0.02]} rotation={[0, 0, 0.05]}>
        <RoundedBox args={[0.26, 0.46, 0.28]} radius={0.12} smoothness={14} castShadow receiveShadow>
          <meshStandardMaterial color="#D92F2D" roughness={0.42} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.28, 0.04]} radius={0.055} smoothness={10} position={[0.015, 0, 0.16]}>
          <meshStandardMaterial color="#F0E5CF" roughness={0.38} metalness={0.04} />
        </RoundedBox>
        <mesh position={[0.02, 0, 0.19]}>
          <cylinderGeometry args={[0.035, 0.035, 0.018, 24]} />
          <meshStandardMaterial color="#111313" roughness={0.24} metalness={0.08} />
        </mesh>
      </group>
      <group position={[0.76, -0.03, 0.02]} rotation={[0, 0, -0.05]}>
        <RoundedBox args={[0.26, 0.46, 0.28]} radius={0.12} smoothness={14} castShadow receiveShadow>
          <meshStandardMaterial color="#D92F2D" roughness={0.42} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.28, 0.04]} radius={0.055} smoothness={10} position={[-0.015, 0, 0.16]}>
          <meshStandardMaterial color="#F0E5CF" roughness={0.38} metalness={0.04} />
        </RoundedBox>
        <mesh position={[-0.02, 0, 0.19]}>
          <cylinderGeometry args={[0.035, 0.035, 0.018, 24]} />
          <meshStandardMaterial color="#111313" roughness={0.24} metalness={0.08} />
        </mesh>
      </group>

      <RoundedBox args={[1.34, 1.12, 0.84]} radius={0.34} smoothness={20} castShadow receiveShadow>
        <meshStandardMaterial color="#EDE3CF" roughness={0.35} metalness={0.05} envMapIntensity={1.05} />
      </RoundedBox>

      <RoundedBox args={[1.08, 0.84, 0.09]} radius={0.34} smoothness={22} position={[0, -0.01, 0.435]}>
        <meshStandardMaterial color="#0A0D0D" roughness={0.18} metalness={0.08} />
      </RoundedBox>

      <RoundedBox ref={leftEye} args={[0.22, 0.085, 0.028]} radius={0.045} smoothness={8} position={[-0.22, 0.03, 0.49]}>
        <meshStandardMaterial color="#FFE793" emissive="#FFD166" emissiveIntensity={1.55} />
      </RoundedBox>
      <RoundedBox ref={rightEye} args={[0.22, 0.085, 0.028]} radius={0.045} smoothness={8} position={[0.22, 0.03, 0.49]}>
        <meshStandardMaterial color="#FFE793" emissive="#FFD166" emissiveIntensity={1.55} />
      </RoundedBox>
    </group>
  );
}

export function RobotBanner() {
  const [canvasReady, setCanvasReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const animate = inView && tabVisible;

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08),0_1px_4px_-1px_rgba(0,0,0,0.04)]"
      style={{ height: 252 }}
    >
      <style>{`
        @keyframes capita-robot-appear {
          0%   { opacity: 0; transform: scale(0.78) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .capita-robot-appear { animation: capita-robot-appear 0.55s cubic-bezier(0.34, 1.3, 0.64, 1) both; }
      `}</style>
      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Warm left-side wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(255,255,255,1) 0%, rgba(255,252,245,0.92) 40%, rgba(255,245,230,0.55) 70%, rgba(255,237,213,0.18) 100%)',
        }}
      />

      {/* Ambient glows — right side, robot zone */}
      <div className="pointer-events-none absolute -right-6 top-1/2 h-[200px] w-[200px] -translate-y-1/2 rounded-full bg-amber-200/25 blur-3xl" />
      <div className="pointer-events-none absolute right-8 bottom-0 h-[100px] w-[160px] rounded-full bg-red-200/20 blur-2xl" />
      <div className="pointer-events-none absolute right-16 top-0 h-[80px] w-[120px] rounded-full bg-orange-100/30 blur-2xl" />

      {/* Top accent line — brand coral/red */}
      <div
        className="absolute left-0 top-0 w-full h-[3px]"
        style={{ background: 'linear-gradient(90deg, #D92F2D 0%, #F97316 55%, transparent 100%)' }}
      />

      {/* Robot — right panel */}
      <div className="absolute inset-y-0 right-0 z-10 flex h-full w-[150px] items-center justify-center sm:w-[180px]">
<div
          className={`absolute inset-0 transition-opacity duration-500 ${canvasReady ? 'opacity-100 capita-robot-appear' : 'opacity-0'}`}
        >
          <Canvas
            className="h-full w-full"
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
            frameloop={animate ? 'always' : 'never'}
            onCreated={() => setCanvasReady(true)}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 7.2]} fov={28} near={0.1} far={50} />

              <ambientLight intensity={0.95} />
              <hemisphereLight args={['#FFF7E6', '#FDE8D0', 0.9]} />
              <directionalLight position={[3.2, 4.8, 4.3]} intensity={1.2} color="#ffffff" />
              <directionalLight position={[-3, 2.4, -2]} intensity={0.4} color="#FED7AA" />

              <NeoRobotHead />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Text content — left */}
      <div className="absolute inset-y-0 left-0 z-10 flex w-full min-w-0 flex-col justify-center gap-3 pl-6 pr-[160px] sm:pl-8 sm:pr-[190px]">
        {/* Status pill */}
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 shadow-sm">
          <span className="capita-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Capita AI · Online
        </span>

        <h2 className="font-display text-[18px] font-bold leading-[1.18] text-gray-900 sm:text-[22px]">
          Your finance copilot,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #D92F2D 0%, #F97316 100%)' }}
          >
            ready to help.
          </span>
        </h2>

        <p className="max-w-[340px] text-[11px] leading-[1.6] text-gray-500 sm:text-[12px]">
          Ask anything about your invoices, payments, expenses, or compliance — answered from live data.
        </p>

        {/* Quick action chips */}
        <div className="flex flex-wrap gap-1.5">
          {['Invoices', 'Payments', 'Expenses', 'Compliance'].map((label) => (
            <span
              key={label}
              className="rounded-full border border-gray-200 bg-gray-50/80 px-2 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
