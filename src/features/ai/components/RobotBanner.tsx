import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, RoundedBox } from '@react-three/drei';
import {
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
} from 'three';

// ─── Brand palette ─────────────────────────────────────────────────────────
// Cream chassis · coral/red accents · dark glossy face · warm yellow eyes ·
// soft amber rim light. Matches the banner's white→cream→peach background.
const COLORS = {
  shell: '#F4ECDA',       // ivory/cream chassis
  shellShadow: '#E8DEC4', // darker cream for back/side accents
  faceScreen: '#0A0D11',  // glossy near-black face panel
  eye: '#FFE89A',         // warm yellow eye
  eyeGlow: '#FFC93C',     // amber emissive
  accent: '#E33C39',      // brand coral/red (ear pods, antenna ball)
  accentGlow: '#FF7A45',  // coral→orange emissive
  cheek: '#FF8B7A',       // soft coral cheek dot
  chestLed: '#34D399',    // status LED green
  detail: '#1A1D22',      // dark detail color (mouth grille, pupils)
};

// ─── Robot ────────────────────────────────────────────────────────────────

function CapitaRobot() {
  const rig = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);
  const mouth = useRef<Mesh>(null);
  const chestLed = useRef<Mesh>(null);
  const chestMat = useRef<MeshStandardMaterial>(null);

  // Reusable look-target state (eye tracking around)
  const lookState = useRef({ targetX: 0, targetY: 0, nextChange: 1.5 });
  // Random natural blink scheduler — singles + occasional doubles
  const blinkState = useRef({ next: 1.6, until: 0, second: false });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const cdt = Math.min(dt, 0.05); // cap delta to avoid huge jumps after pause

    // ── Whole-rig float + subtle drift ─────────────────────────────────
    if (rig.current) {
      rig.current.position.y = Math.sin(t * 1.5) * 0.08;
      rig.current.position.x = Math.sin(t * 1.1) * 0.05;
      rig.current.rotation.z = Math.sin(t * 1.3) * 0.06;
    }

    // ── Head turn — gentle "looking around" lerped to target ───────────
    if (head.current) {
      // Pick a new look target more frequently for snappier movement
      lookState.current.nextChange -= cdt;
      if (lookState.current.nextChange <= 0) {
        lookState.current.targetX = (Math.random() - 0.5) * 0.6; // wider yaw
        lookState.current.targetY = (Math.random() - 0.5) * 0.3; // wider pitch
        lookState.current.nextChange = 0.8 + Math.random() * 1.5; // faster changes
      }
      
      // Add a continuous playful shake/bobble to the target
      const shakeX = Math.sin(t * 4.2) * 0.04;
      const shakeY = Math.cos(t * 3.8) * 0.04;

      head.current.rotation.y = MathUtils.damp(
        head.current.rotation.y,
        lookState.current.targetX + shakeX,
        4.5, // faster dampening
        cdt,
      );
      head.current.rotation.x = MathUtils.damp(
        head.current.rotation.x,
        lookState.current.targetY + shakeY,
        4.5,
        cdt,
      );
    }

    // ── Natural blink (single + occasional double) ─────────────────────
    blinkState.current.next -= cdt;
    blinkState.current.until -= cdt;
    if (blinkState.current.next <= 0 && blinkState.current.until <= 0) {
      blinkState.current.until = 0.13;
      blinkState.current.next = 2.5 + Math.random() * 3.5;
      // 25% chance of a double-blink
      blinkState.current.second = Math.random() < 0.25;
    } else if (blinkState.current.until <= 0 && blinkState.current.second) {
      blinkState.current.second = false;
      blinkState.current.until = 0.13;
      blinkState.current.next = 0.18; // tiny gap before next
    }
    const blinking = blinkState.current.until > 0;
    const target = blinking ? 0.08 : 1;
    if (leftEye.current)
      leftEye.current.scale.y = MathUtils.damp(leftEye.current.scale.y, target, 18, cdt);
    if (rightEye.current)
      rightEye.current.scale.y = MathUtils.damp(rightEye.current.scale.y, target, 18, cdt);

    // ── Mouth subtle bob (suggests speech-readiness) ───────────────────
    if (mouth.current) {
      mouth.current.scale.x = 1 + Math.sin(t * 3.2) * 0.05;
      mouth.current.scale.y = 1 + Math.cos(t * 2.8) * 0.07;
    }

    // ── Chest LED breathing ────────────────────────────────────────────
    if (chestMat.current) {
      chestMat.current.emissiveIntensity = 1.2 + Math.sin(t * 1.6) * 0.55;
    }
    if (chestLed.current) {
      const s = 1 + Math.sin(t * 1.6) * 0.08;
      chestLed.current.scale.set(s, s, 1);
    }
  });

  // Memoize materials so we don't recreate per frame
  const shellMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COLORS.shell,
        roughness: 0.42,
        metalness: 0.06,
        envMapIntensity: 0.85,
      }),
    [],
  );
  const screenMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COLORS.faceScreen,
        roughness: 0.18,
        metalness: 0.18,
      }),
    [],
  );
  const accentMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COLORS.accent,
        roughness: 0.38,
        metalness: 0.08,
      }),
    [],
  );
  const eyeMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COLORS.eye,
        emissive: COLORS.eyeGlow,
        emissiveIntensity: 1.7,
        roughness: 0.3,
      }),
    [],
  );
  const detailMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: COLORS.detail,
        roughness: 0.4,
      }),
    [],
  );

  return (
    <group ref={rig} scale={0.82}>
      {/* ── Head + body (single rig, head turns as one) ───────────────── */}
      <group ref={head}>
        {/* Side speaker/ear pods — left */}
        <group position={[-0.78, -0.02, 0.04]} rotation={[0, 0, 0.06]}>
          <RoundedBox args={[0.24, 0.5, 0.32]} radius={0.12} smoothness={12} material={accentMat} />
          {/* cream inset */}
          <RoundedBox
            args={[0.13, 0.3, 0.04]}
            radius={0.05}
            smoothness={8}
            position={[0.018, 0, 0.18]}
            material={shellMat}
          />
          {/* dark center ring */}
          <mesh position={[0.025, 0, 0.205]}>
            <cylinderGeometry args={[0.038, 0.038, 0.02, 22]} />
            <meshStandardMaterial color={COLORS.detail} roughness={0.25} metalness={0.2} />
          </mesh>
        </group>

        {/* Side speaker/ear pods — right */}
        <group position={[0.78, -0.02, 0.04]} rotation={[0, 0, -0.06]}>
          <RoundedBox args={[0.24, 0.5, 0.32]} radius={0.12} smoothness={12} material={accentMat} />
          <RoundedBox
            args={[0.13, 0.3, 0.04]}
            radius={0.05}
            smoothness={8}
            position={[-0.018, 0, 0.18]}
            material={shellMat}
          />
          <mesh position={[-0.025, 0, 0.205]}>
            <cylinderGeometry args={[0.038, 0.038, 0.02, 22]} />
            <meshStandardMaterial color={COLORS.detail} roughness={0.25} metalness={0.2} />
          </mesh>
        </group>

        {/* Main head shell */}
        <RoundedBox
          args={[1.4, 1.2, 0.92]}
          radius={0.36}
          smoothness={20}
          material={shellMat}
        />

        {/* Subtle top "dome" highlight strip — slightly darker cream band */}
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.012, 12, 48, Math.PI]} />
          <meshStandardMaterial color={COLORS.shellShadow} roughness={0.5} />
        </mesh>

        {/* Face screen — dark glossy panel */}
        <RoundedBox
          args={[1.14, 0.92, 0.1]}
          radius={0.34}
          smoothness={22}
          position={[0, -0.005, 0.475]}
          material={screenMat}
        />

        {/* Eye whites/glow shapes */}
        <RoundedBox
          ref={leftEye}
          args={[0.24, 0.14, 0.04]}
          radius={0.06}
          smoothness={10}
          position={[-0.22, 0.04, 0.535]}
          material={eyeMat}
        />
        <RoundedBox
          ref={rightEye}
          args={[0.24, 0.14, 0.04]}
          radius={0.06}
          smoothness={10}
          position={[0.22, 0.04, 0.535]}
          material={eyeMat}
        />

        {/* Eye glints — small white highlights for "alive" feel */}
        <mesh position={[-0.16, 0.075, 0.56]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.28, 0.075, 0.56]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Cheek dots — soft coral, on the cream cheeks beside the screen */}
        <mesh position={[-0.62, -0.18, 0.42]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color={COLORS.cheek}
            emissive={COLORS.cheek}
            emissiveIntensity={0.35}
            roughness={0.55}
          />
        </mesh>
        <mesh position={[0.62, -0.18, 0.42]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color={COLORS.cheek}
            emissive={COLORS.cheek}
            emissiveIntensity={0.35}
            roughness={0.55}
          />
        </mesh>

        {/* Mouth — friendly speaker grille (rounded pill, subtle pulse) */}
        <RoundedBox
          ref={mouth}
          args={[0.22, 0.06, 0.025]}
          radius={0.03}
          smoothness={8}
          position={[0, -0.27, 0.545]}
        >
          <meshStandardMaterial
            color={COLORS.eyeGlow}
            emissive={COLORS.eyeGlow}
            emissiveIntensity={0.7}
            roughness={0.4}
          />
        </RoundedBox>
      </group>

      {/* ── Floating chest panel (below the head, doesn't turn) ────────── */}
      <group position={[0, -0.92, 0.02]}>
        <RoundedBox args={[0.52, 0.22, 0.32]} radius={0.08} smoothness={12} material={shellMat} />
        {/* Status LED */}
        <mesh ref={chestLed} position={[0, 0, 0.165]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial
            ref={chestMat}
            color={COLORS.chestLed}
            emissive={COLORS.chestLed}
            emissiveIntensity={1.4}
            roughness={0.3}
          />
        </mesh>
        {/* Two small detail lines */}
        <mesh position={[-0.13, 0, 0.165]}>
          <boxGeometry args={[0.04, 0.005, 0.005]} />
          <meshStandardMaterial color={COLORS.detail} />
        </mesh>
        <mesh position={[0.13, 0, 0.165]}>
          <boxGeometry args={[0.04, 0.005, 0.005]} />
          <meshStandardMaterial color={COLORS.detail} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────

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
        @keyframes capita-glow-pulse {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.08); }
        }
        .capita-glow-pulse { animation: capita-glow-pulse 3.6s ease-in-out infinite; }
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

      {/* Ambient glows behind the robot */}
      <div className="pointer-events-none absolute -right-6 top-1/2 h-[200px] w-[200px] -translate-y-1/2 rounded-full bg-amber-200/25 blur-3xl" />
      <div className="pointer-events-none absolute right-8 bottom-0 h-[100px] w-[160px] rounded-full bg-red-200/20 blur-2xl" />
      <div className="pointer-events-none absolute right-16 top-0 h-[80px] w-[120px] rounded-full bg-orange-100/30 blur-2xl" />

      {/* Top accent line */}
      <div
        className="absolute left-0 top-0 w-full h-[3px]"
        style={{ background: 'linear-gradient(90deg, #D92F2D 0%, #F97316 55%, transparent 100%)' }}
      />

      {/* Robot — right panel */}
      <div className="absolute inset-y-0 right-0 z-10 flex h-full w-[150px] items-center justify-center sm:w-[180px]">
        {/* Behind-robot pulsing halo for premium feel */}
        <div
          aria-hidden
          className="capita-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[150px] w-[150px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,170,90,0.32) 0%, rgba(255,170,90,0) 70%)',
          }}
        />

        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            canvasReady ? 'opacity-100 capita-robot-appear' : 'opacity-0'
          }`}
        >
          <Canvas
            className="h-full w-full"
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
            frameloop={animate ? 'always' : 'never'}
            onCreated={() => setCanvasReady(true)}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 7.6]} fov={28} near={0.1} far={50} />

              {/* Soft ambient + warm hemisphere */}
              <ambientLight intensity={0.85} />
              <hemisphereLight args={['#FFF6E0', '#FBE4C4', 0.85]} />

              {/* Key light — top-right warm */}
              <directionalLight position={[3.6, 5.2, 4.5]} intensity={1.2} color="#FFFFFF" />

              {/* Coral rim light from the left to pick up brand color */}
              <directionalLight position={[-3.4, 1.2, -1.2]} intensity={0.9} color="#FF8A5C" />

              {/* Front fill — gentle */}
              <pointLight position={[0, 0.6, 3.4]} intensity={0.3} color="#FFE6C2" />

              <CapitaRobot />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Text content — left */}
      <div className="absolute inset-y-0 left-0 z-10 flex w-full min-w-0 flex-col justify-center gap-3 pl-6 pr-[160px] sm:pl-8 sm:pr-[190px]">
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
