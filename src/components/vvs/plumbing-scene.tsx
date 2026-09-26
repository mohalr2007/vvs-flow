import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type SceneMode = "flow" | "repair" | "project";
type Position = [number, number, number];

const copper = "#b87333";
const steel = "#d9e1e8";
const red = "#cc2222";
const water = "#38bdf8";
const darkSteel = "#667586";
const pipeRadius = 0.25;

function MainPipe() {
  const geometry = useMemo(() => {
    const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(new THREE.LineCurve3(point(-4, 0, 0), point(0.4, 0, 0)));
    path.add(new THREE.QuadraticBezierCurve3(point(0.4, 0, 0), point(1, 0, 0), point(1, 0.6, 0)));
    path.add(new THREE.LineCurve3(point(1, 0.6, 0), point(1, 2.4, 0)));
    path.add(new THREE.QuadraticBezierCurve3(point(1, 2.4, 0), point(1, 3, 0), point(1.6, 3, 0)));
    path.add(new THREE.LineCurve3(point(1.6, 3, 0), point(4, 3, 0)));
    return new THREE.TubeGeometry(path, 200, pipeRadius, 32, false);
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial color={copper} metalness={0.9} roughness={0.27} clearcoat={0.45} />
    </mesh>
  );
}

function Coupling({ position, rotation }: { position: Position; rotation: Position }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[pipeRadius * 1.35, pipeRadius * 1.35, 0.5, 32]} />
      <meshPhysicalMaterial color={steel} metalness={1} roughness={0.16} clearcoat={0.6} />
    </mesh>
  );
}

function Valve({ reducedMotion }: { reducedMotion: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, rawDelta) => {
    if (!wheel.current || reducedMotion) return;
    wheel.current.rotation.z += Math.min(rawDelta, 0.05) * 0.6;
  });

  return (
    <group position={[2.5, 3, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.45, 32, 24]} />
        <meshPhysicalMaterial color={steel} metalness={1} roughness={0.18} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
        <meshStandardMaterial color={darkSteel} metalness={0.95} roughness={0.2} />
      </mesh>
      <group ref={wheel} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.5, 0.06, 16, 48]} />
          <meshPhysicalMaterial color={red} metalness={0.48} roughness={0.32} clearcoat={0.4} />
        </mesh>
        {[0, Math.PI / 3, (Math.PI * 2) / 3].map((rotation) => (
          <mesh key={rotation} rotation-z={rotation} castShadow>
            <boxGeometry args={[1, 0.06, 0.06]} />
            <meshStandardMaterial color={red} metalness={0.45} roughness={0.34} />
          </mesh>
        ))}
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.12, 24]} />
          <meshStandardMaterial color={steel} metalness={1} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
}

function Faucet() {
  return (
    <group position={[4, 3, 0]}>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[pipeRadius * 0.7, pipeRadius * 0.7, 0.8, 24]} />
        <meshPhysicalMaterial color={steel} metalness={1} roughness={0.14} clearcoat={0.7} />
      </mesh>
      <mesh position={[0.4, -0.8, 0]} rotation={[0, 0, Math.PI]} castShadow>
        <torusGeometry args={[0.4, pipeRadius * 0.7, 16, 32, Math.PI / 2]} />
        <meshPhysicalMaterial color={steel} metalness={1} roughness={0.14} clearcoat={0.7} />
      </mesh>
    </group>
  );
}

function WaterDrop({ reducedMotion }: { reducedMotion: boolean }) {
  const drop = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!drop.current || reducedMotion) return;
    drop.current.position.y = 2.2 - (state.clock.elapsedTime % 1.5) * 1.6;
    const stretch = 1 + Math.sin(state.clock.elapsedTime * 7) * 0.08;
    drop.current.scale.set(1, stretch, 1);
  });
  return (
    <group ref={drop} position={[4.8, 2.2, 0]}>
      <mesh rotation-z={Math.PI / 4}>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshPhysicalMaterial color={water} emissive={water} emissiveIntensity={0.22} transmission={0.15} transparent opacity={0.88} roughness={0.08} />
      </mesh>
    </group>
  );
}

function PlumbingAssembly({ mode, reducedMotion }: { mode: SceneMode; reducedMotion: boolean }) {
  const assembly = useRef<THREE.Group>(null);
  useFrame((state, rawDelta) => {
    if (!assembly.current || reducedMotion) return;
    const dt = Math.min(rawDelta, 0.05);
    const target = mode === "project" ? -0.14 : 0.08;
    assembly.current.rotation.y += (target + Math.sin(state.clock.elapsedTime * 0.32) * 0.035 - assembly.current.rotation.y) * (1 - Math.exp(-2 * dt));
  });

  return (
    <group ref={assembly} position={[0, -1.25, 0]} rotation={[0.04, 0.08, 0]} scale={0.92}>
      <MainPipe />
      <Coupling position={[-2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Coupling position={[1, 1.5, 0]} rotation={[0, 0, 0]} />
      <Coupling position={[3.6, 3, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Valve reducedMotion={reducedMotion} />
      <Faucet />
      {(mode === "repair" || mode === "flow") && <WaterDrop reducedMotion={reducedMotion} />}
    </group>
  );
}

export function PlumbingScene({ mode = "flow", compact = false }: { mode?: SceneMode; compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className={compact ? "relative h-48 w-full sm:h-60" : "relative h-[360px] w-full sm:h-[500px] lg:h-[650px]"} aria-label="Interactive three-dimensional copper plumbing installation">
      <div className="absolute inset-x-[8%] bottom-[6%] h-1/3 rounded-full bg-primary/15 blur-3xl" />
      {!mounted ? (
        <div className="absolute inset-0 plumbing-fallback" />
      ) : (
        <Canvas shadows frameloop={reducedMotion ? "demand" : "always"} dpr={[1, 1.5]} camera={{ position: [6, 4.2, 9], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.58} />
            <directionalLight position={[5, 10, 7]} intensity={2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <pointLight position={[-3, 1, 5]} intensity={1.15} color={water} />
            <PlumbingAssembly mode={mode} reducedMotion={reducedMotion} />
            <gridHelper args={[12, 12, darkSteel, "#1e293b"]} position={[0, -1.42, 0]} />
            <ContactShadows position={[0, -1.38, 0]} opacity={0.28} scale={11} blur={2.5} far={7} />
            <Environment>
              <Lightformer intensity={2.8} position={[0, 6, 3]} scale={[9, 4, 1]} />
              <Lightformer intensity={1.8} color={steel} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[7, 3, 1]} />
            </Environment>
            <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={7} maxDistance={13} minPolarAngle={0.65} maxPolarAngle={1.55} target={[0, 0.4, 0]} />
          </Suspense>
        </Canvas>
      )}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border bg-card/85 px-3 py-2 backdrop-blur-sm">
        <p className="text-[11px] font-bold text-primary">{mode === "repair" ? "LEAK DETECTED" : mode === "project" ? "SYSTEM PLANNING" : "FLOW ACTIVE"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Drag to rotate · Scroll to zoom</p>
      </div>
    </div>
  );
}