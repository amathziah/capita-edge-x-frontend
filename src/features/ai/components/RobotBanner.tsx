import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, RoundedBox, Text } from '@react-three/drei';
import { Group, MathUtils, Mesh, MeshStandardMaterial } from 'three';

// ─── Holographic Text Robot Head ──────────────────────────────────────────

function HeadAgent() {
  const rig = useRef<Group>(null);
  const head = useRef<Group>(null);
  const textRef = useRef<{ fillOpacity: number; material?: { transparent: boolean; opacity: number } }>(null);
  const mb1 = useRef<Mesh>(null);
  const mb2 = useRef<Mesh>(null);
  const mb3 = useRef<Mesh>(null);
  const mb4 = useRef<Mesh>(null);
  const mb5 = useRef<Mesh>(null);
  const mb6 = useRef<Mesh>(null);
  const mb7 = useRef<Mesh>(null);
  
  const words = useMemo(() => ['INVOICES', 'PAYMENTS', 'EXPENSES', 'COMPLIANCE', 'REPORTS'], []);
  const [currentWord, setCurrentWord] = useState(words[0]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const duration = 2.5; // Seconds per word
    
    // Smooth, premium floating
    if (rig.current) {
      rig.current.position.y = Math.sin(t * 1.5) * 0.1;
      rig.current.position.x = Math.sin(t * 0.8) * 0.05;
    }

    // Natural head tracking / looking around
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.8) * 0.15;
      head.current.rotation.x = Math.cos(t * 1.2) * 0.05;
      head.current.rotation.z = Math.sin(t * 1.0) * 0.02;
    }

    // Audio Visualizer Waveform Mouth (simulates speech)
    const baseTalk = Math.sin(t * 2.5) > 0 ? 1 : 0.15; // Alternates between talking and silence
    if (mb1.current) mb1.current.scale.y = MathUtils.damp(mb1.current.scale.y, 0.4 + Math.abs(Math.sin(t * 12)) * 0.4 * baseTalk, 15, dt);
    if (mb2.current) mb2.current.scale.y = MathUtils.damp(mb2.current.scale.y, 0.5 + Math.abs(Math.sin(t * 18 + 1)) * 0.7 * baseTalk, 15, dt);
    if (mb3.current) mb3.current.scale.y = MathUtils.damp(mb3.current.scale.y, 0.6 + Math.abs(Math.sin(t * 22 + 2)) * 1.0 * baseTalk, 15, dt);
    if (mb4.current) mb4.current.scale.y = MathUtils.damp(mb4.current.scale.y, 0.7 + Math.abs(Math.sin(t * 28 + 3)) * 1.4 * baseTalk, 15, dt);
    if (mb5.current) mb5.current.scale.y = MathUtils.damp(mb5.current.scale.y, 0.6 + Math.abs(Math.sin(t * 20 + 4)) * 1.0 * baseTalk, 15, dt);
    if (mb6.current) mb6.current.scale.y = MathUtils.damp(mb6.current.scale.y, 0.5 + Math.abs(Math.sin(t * 16 + 5)) * 0.7 * baseTalk, 15, dt);
    if (mb7.current) mb7.current.scale.y = MathUtils.damp(mb7.current.scale.y, 0.4 + Math.abs(Math.sin(t * 10 + 6)) * 0.4 * baseTalk, 15, dt);

    // Word cycling logic
    const index = Math.floor(t / duration) % words.length;
    if (words[index] !== currentWord) {
      setCurrentWord(words[index]);
    }

    // Fade in/out logic
    const cycle = (t % duration) / duration;
    let opacity = 1;
    if (cycle < 0.15) opacity = cycle / 0.15; // Fade in
    else if (cycle > 0.85) opacity = 1 - (cycle - 0.85) / 0.15; // Fade out

    if (textRef.current) {
      textRef.current.fillOpacity = opacity;
      if (textRef.current.material) {
        textRef.current.material.transparent = true;
        textRef.current.material.opacity = opacity;
      }
    }
  });

  // Extremely premium, seamless materials
  const shellMat = useMemo(() => new MeshStandardMaterial({ color: '#ffffff', roughness: 0.1, metalness: 0.15 }), []);
  const visorMat = useMemo(() => new MeshStandardMaterial({ color: '#020617', roughness: 0.05, metalness: 0.9 }), []);
  const detailMat = useMemo(() => new MeshStandardMaterial({ color: '#1E293B', roughness: 0.5, metalness: 0.6 }), []);
  const glowMat = useMemo(() => new MeshStandardMaterial({ color: '#06B6D4', emissive: '#06B6D4', emissiveIntensity: 1.5 }), []);

  return (
    <group ref={rig} scale={0.75}>
      {/* Scaled down to minimize overall size */}
      <group ref={head}>
        {/* Main Helmet Body - cute round shape */}
        <RoundedBox args={[1.4, 1.3, 1.4]} radius={0.6} smoothness={32} material={shellMat} />
        
        {/* Seamless Visor - wraps around smoothly */}
        <RoundedBox args={[1.45, 0.5, 1.2]} radius={0.25} smoothness={32} position={[0, 0.15, 0.15]} material={visorMat} />

        {/* Improved Earpieces / Audio Sensors (Headphone style) */}
        <group position={[-0.72, 0.1, 0]}>
          <RoundedBox args={[0.2, 0.45, 0.45]} radius={0.1} smoothness={16} material={detailMat} />
          {/* Inner ear ring and glow cap */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.1, 0, 0]}>
            <torusGeometry args={[0.12, 0.02, 16, 32]} />
            <primitive object={glowMat} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.1, 0, 0]}>
             <cylinderGeometry args={[0.06, 0.06, 0.04, 32]} />
             <primitive object={glowMat} />
          </mesh>
        </group>
        
        <group position={[0.72, 0.1, 0]}>
          <RoundedBox args={[0.2, 0.45, 0.45]} radius={0.1} smoothness={16} material={detailMat} />
          {/* Inner ear ring and glow cap */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.1, 0, 0]}>
            <torusGeometry args={[0.12, 0.02, 16, 32]} />
            <primitive object={glowMat} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.1, 0, 0]}>
             <cylinderGeometry args={[0.06, 0.06, 0.04, 32]} />
             <primitive object={glowMat} />
          </mesh>
        </group>

        {/* Digital Waveform Mouth - 7 Bar curved visualizer */}
        <group position={[0, -0.3, 0.69]}>
          <RoundedBox ref={mb1} args={[0.015, 0.04, 0.02]} radius={0.008} position={[-0.12, 0.02, 0]} rotation={[0, 0, 0.15]} material={glowMat} />
          <RoundedBox ref={mb2} args={[0.015, 0.05, 0.02]} radius={0.008} position={[-0.08, 0.01, 0]} rotation={[0, 0, 0.08]} material={glowMat} />
          <RoundedBox ref={mb3} args={[0.015, 0.06, 0.02]} radius={0.008} position={[-0.04, 0.005, 0]} rotation={[0, 0, 0.04]} material={glowMat} />
          <RoundedBox ref={mb4} args={[0.02, 0.07, 0.02]} radius={0.008} position={[0, 0, 0]} material={glowMat} />
          <RoundedBox ref={mb5} args={[0.015, 0.06, 0.02]} radius={0.008} position={[0.04, 0.005, 0]} rotation={[0, 0, -0.04]} material={glowMat} />
          <RoundedBox ref={mb6} args={[0.015, 0.05, 0.02]} radius={0.008} position={[0.08, 0.01, 0]} rotation={[0, 0, -0.08]} material={glowMat} />
          <RoundedBox ref={mb7} args={[0.015, 0.04, 0.02]} radius={0.008} position={[0.12, 0.02, 0]} rotation={[0, 0, -0.15]} material={glowMat} />
        </group>

        {/* Cute top antenna */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.18, 16]} />
          <primitive object={detailMat} />
        </mesh>
        <mesh position={[0, 0.76, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <primitive object={glowMat} />
        </mesh>



        {/* 3D Animated Text on Visor */}
        <Text
          ref={textRef}
          position={[0, 0.15, 0.77]}
          fontSize={0.15}
          letterSpacing={0.12}
          color="#00FFFF" // Bright cyan
          anchorX="center"
          anchorY="middle"
        >
          {currentWord}
        </Text>
      </group>
    </group>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────

export function RobotBanner() {
  const [canvasKey, setCanvasKey] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
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

  // When context is lost: unmount the Canvas, then remount after 2 s to reclaim a fresh context
  useEffect(() => {
    if (!contextLost) return;
    const t = setTimeout(() => {
      setContextLost(false);
      setCanvasReady(false);
      setCanvasKey((k) => k + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [contextLost]);

  const animate = inView && tabVisible && !contextLost;

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800/50 bg-[#0B1019] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm"
      style={{ minHeight: 252 }}
    >
      <style>{`
        @keyframes capita-robot-appear {
          0%   { opacity: 0; transform: scale(0.78) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .capita-robot-appear { animation: capita-robot-appear 0.55s cubic-bezier(0.34, 1.3, 0.64, 1) both; }
        @keyframes capita-glow-pulse {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.65; transform: translate(-50%, -50%) scale(1.08); }
        }
        .capita-glow-pulse { animation: capita-glow-pulse 3.6s ease-in-out infinite; }
      `}</style>

      {/* Subtle cyber grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Dark left-side wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(11,16,25,1) 0%, rgba(11,16,25,0.92) 40%, rgba(15,23,42,0.6) 70%, rgba(30,41,59,0.2) 100%)',
        }}
      />

      {/* Ambient glows behind the robot */}
      <div className="pointer-events-none absolute -right-6 top-1/2 h-[200px] w-[200px] -translate-y-1/2 rounded-full bg-cyan-900/40 blur-3xl" />
      <div className="pointer-events-none absolute right-16 bottom-0 h-[100px] w-[160px] rounded-full bg-teal-900/30 blur-2xl" />

      {/* Top accent line */}
      <div
        className="absolute left-0 top-0 w-full h-[2px]"
        style={{ background: 'linear-gradient(90deg, #06B6D4 0%, #10B981 55%, transparent 100%)' }}
      />

      {/* Content layout — stacks vertically on mobile, side-by-side on md+ */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-stretch">

        {/* Text content */}
        <div className="flex flex-col justify-center gap-3 px-6 py-8 sm:px-8 md:flex-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-400 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            CapitaEdgeX Core
          </span>

          <h2 className="font-display text-[18px] font-bold leading-[1.18] text-white sm:text-[22px]">
            Your autonomous finance agent,{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)' }}
            >
              processing real-time.
            </span>
          </h2>

          <p className="max-w-[340px] text-[11px] leading-[1.6] text-slate-400 sm:text-[12px]">
            Seamlessly orchestrating your invoices, payments, expenses, and compliance with data-driven precision.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {['Invoices', 'Payments', 'Expenses', 'Compliance'].map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* AI Robot — bottom on mobile, right panel on md+ */}
        <div className="relative flex h-[160px] w-full items-center justify-center md:h-auto md:w-[200px] md:flex-shrink-0">
          {/* Behind-robot pulsing halo */}
          <div
            aria-hidden
            className="capita-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0) 70%)' }}
          />

          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              canvasReady ? 'opacity-100 capita-robot-appear' : 'opacity-0'
            }`}
          >
            <Canvas
              key={canvasKey}
              className="h-full w-full"
              dpr={[1, Math.min(window.devicePixelRatio, 2)]}
              camera={{ position: [0, 0, 5], fov: 35 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
              }}
              frameloop={animate && !contextLost ? 'always' : 'never'}
              onCreated={({ gl }) => {
                setCanvasReady(true);
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                  e.preventDefault();
                  setContextLost(true);
                });
                gl.domElement.addEventListener('webglcontextrestored', () => {
                  setContextLost(false);
                });
              }}
            >
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35} near={0.1} far={50} />
                <ambientLight intensity={0.7} />
                <hemisphereLight args={['#ffffff', '#0F172A', 1.5]} />
                <directionalLight position={[3, 5, 4]} intensity={3} color="#ffffff" />
                <directionalLight position={[-4, 1, -1]} intensity={2.5} color="#06B6D4" />
                <pointLight position={[0, 0.5, 3]} intensity={0.8} color="#E0F2FE" />
                <HeadAgent />
              </Suspense>
            </Canvas>
          </div>
        </div>

      </div>
    </div>
  );
}
