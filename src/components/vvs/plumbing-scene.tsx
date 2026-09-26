import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type SceneMode = "flow" | "repair" | "project";

const copper = "#a9b8c8";
const copperLight = "#e7f2ff";
const water = "#3b82f6";
const navy = "#10233c";

function Pipe({ position, rotation, length, radius = 0.24 }: { position: [number, number, number]; rotation?: [number, number, number]; length: number; radius?: number }) {
  const rotationProps = rotation ? { rotation } : {};
  return <mesh position={position} {...rotationProps} castShadow receiveShadow><cylinderGeometry args={[radius, radius, length, 32]}/><meshStandardMaterial color={copper} metalness={0.82} roughness={0.24}/></mesh>;
}

function Joint({ position, radius = 0.32 }: { position: [number, number, number]; radius?: number }) {
  return <mesh position={position} castShadow><sphereGeometry args={[radius, 32, 20]}/><meshStandardMaterial color={copperLight} metalness={0.78} roughness={0.2}/></mesh>;
}

function CurvedPipe({ points, radius=.22 }: { points: [number,number,number][]; radius?: number }) {
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)),false,"catmullrom",.18),[points]);
  return <mesh castShadow receiveShadow><tubeGeometry args={[curve,96,radius,28,false]}/><meshPhysicalMaterial color={copper} metalness={.94} roughness={.13} clearcoat={1} clearcoatRoughness={.06}/></mesh>;
}

function PressureGauge() {
  const needle=useRef<THREE.Mesh>(null);
  useFrame((state)=>{if(needle.current) needle.current.rotation.z=-.42+Math.sin(state.clock.elapsedTime*.8)*.04});
  return <group position={[-.1,1.28,.42]} rotation={[0,0,.04]}>
    <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.5,.5,.18,48]}/><meshPhysicalMaterial color={navy} metalness={.72} roughness={.16} clearcoat={1}/></mesh>
    <mesh position={[0,0,.1]}><circleGeometry args={[.41,48]}/><meshStandardMaterial color="#eaf3fb" roughness={.22}/></mesh>
    <mesh ref={needle} position={[0,.04,.17]} rotation={[0,0,-.42]}><boxGeometry args={[.035,.48,.035]}/><meshStandardMaterial color={water} emissive={water} emissiveIntensity={.25}/></mesh>
    <mesh position={[0,0,.19]}><sphereGeometry args={[.065,20,16]}/><meshStandardMaterial color={navy}/></mesh>
  </group>;
}

function FlowBeads({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, rawDelta) => {
    if (!group.current || !active) return;
    const dt = Math.min(rawDelta, 0.05);
    group.current.rotation.z -= dt * 0.45;
    group.current.children.forEach((child, index) => {
      child.position.y = ((state.clock.elapsedTime * 0.72 + index * 0.86) % 4.2) - 2.1;
    });
  });
  return <group ref={group}>{[0,1,2,3,4].map((i)=><mesh key={i} position={[0, i * .8 - 1.6, .27]}><sphereGeometry args={[.075,16,12]}/><meshStandardMaterial color={water} emissive={water} emissiveIntensity={.35} roughness={.18}/></mesh>)}</group>;
}

function Valve({ active }: { active: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, rawDelta) => {
    if (!wheel.current) return;
    const dt = Math.min(rawDelta, .05);
    wheel.current.rotation.z += dt * (active ? .28 : .06);
  });
  return <group position={[1.45,.15,.1]} rotation={[0,0,Math.PI/2]}><Pipe position={[0,0,0]} length={1.05} radius={.18}/><group ref={wheel} position={[0,.62,0]} rotation={[Math.PI/2,0,0]}><mesh castShadow><torusGeometry args={[.48,.065,20,48]}/><meshPhysicalMaterial color={water} metalness={.72} roughness={.16} clearcoat={1}/></mesh>{[0,Math.PI/2].map((r)=><mesh key={r} rotation-z={r}><capsuleGeometry args={[.045,.82,8,16]}/><meshStandardMaterial color={water} metalness={.7} roughness={.18}/></mesh>)}<mesh><cylinderGeometry args={[.13,.13,.16,24]}/><meshStandardMaterial color={copperLight} metalness={.9} roughness={.12}/></mesh></group></group>;
}

function PlumbingAssembly({ mode }: { mode: SceneMode }) {
  const assembly = useRef<THREE.Group>(null);
  useFrame((state, rawDelta) => {
    if (!assembly.current) return;
    const dt = Math.min(rawDelta,.05);
    const target = mode === "project" ? .18 : -.08;
    assembly.current.rotation.y += (target + Math.sin(state.clock.elapsedTime * .32) * .08 - assembly.current.rotation.y) * (1 - Math.exp(-2 * dt));
  });
  return <Float speed={.75} rotationIntensity={.045} floatIntensity={.14}><group ref={assembly} rotation={[-.05,-.08,-.03]}>
    <CurvedPipe points={[[-1.45,-2.3,0],[-1.45,1.65,0],[-.95,2.15,0],[1.55,2.15,0],[2.05,1.65,0],[2.05,.75,0]]}/>
    <Pipe position={[.3,.15,0]} rotation={[0,0,Math.PI/2]} length={3.5} radius={.2}/>
    <Joint position={[0,.15,0]} radius={.28}/><Joint position={[1.35,.15,0]} radius={.25}/>
    <Pipe position={[0,-1.15,0]} length={2.6} radius={.18}/><Joint position={[0,-2.45,0]} radius={.24}/>
    <PressureGauge/>
    <Valve active={mode !== "repair"}/>
    <FlowBeads active={mode !== "repair"}/>
    {mode === "repair" && <group position={[-1.12,-.62,.35]}><mesh><sphereGeometry args={[.19,24,16]}/><meshStandardMaterial color={water} transparent opacity={.78} roughness={.05}/></mesh><mesh position={[.18,-.28,0]} scale={[.65,1,.65]}><sphereGeometry args={[.14,20,14]}/><meshStandardMaterial color={water} transparent opacity={.62}/></mesh></group>}
    {mode === "project" && <RoundedBox args={[1.4,.72,.36]} radius={.12} position={[-.05,1.2,-.18]} castShadow><meshStandardMaterial color="#dbe8f5" metalness={.48} roughness={.28}/></RoundedBox>}
  </group></Float>;
}

export function PlumbingScene({ mode = "flow", compact = false }: { mode?: SceneMode; compact?: boolean }) {
  const [mounted,setMounted]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(false);
  useEffect(()=>{
    setMounted(true);
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setReducedMotion(media.matches);
    sync();
    media.addEventListener("change",sync);
    return ()=>media.removeEventListener("change",sync);
  },[]);
  return <div className={compact ? "relative h-48 w-full sm:h-60" : "relative h-[360px] w-full sm:h-[500px] lg:h-[650px]"} aria-label="Animated three-dimensional chrome plumbing system">
    <div className="absolute inset-x-[12%] bottom-[8%] h-1/3 rounded-full bg-primary/15 blur-3xl"/>
    {!mounted ? <div className="absolute inset-0 plumbing-fallback"/> : <Canvas shadows frameloop={reducedMotion ? "demand" : "always"} dpr={[1,1.5]} camera={{position:[0,1.2,7.8],fov:35}} gl={{antialias:true,alpha:true}} style={{background:"transparent"}}>
      <Suspense fallback={null}>
        <ambientLight intensity={.75}/><directionalLight position={[4,7,6]} intensity={2.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/><pointLight position={[-4,-1,4]} intensity={1.3} color={water}/>
        <PlumbingAssembly mode={mode}/>
        <ContactShadows position={[0,-2.9,0]} opacity={.22} scale={8} blur={2.4} far={5}/>
        <Environment><Lightformer intensity={2.3} position={[0,5,2]} scale={[8,3,1]}/><Lightformer intensity={1.6} color={copperLight} position={[-4,1,1]} rotation-y={Math.PI/2} scale={[5,2,1]}/></Environment>
      </Suspense>
    </Canvas>}
    <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border bg-card/85 px-3 py-2 backdrop-blur-sm"><p className="text-[11px] font-bold text-primary">{mode === "repair" ? "LEAK DETECTED" : mode === "project" ? "SYSTEM PLANNING" : "FLOW ACTIVE"}</p><p className="mt-0.5 text-xs text-muted-foreground">{mode === "repair" ? "Repair route selected" : mode === "project" ? "New installation route" : "Interactive plumbing network"}</p></div>
  </div>;
}