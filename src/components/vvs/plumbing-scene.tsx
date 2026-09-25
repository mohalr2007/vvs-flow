import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type SceneMode = "flow" | "repair" | "project";

const copper = "#a96335";
const copperLight = "#d89a67";
const water = "#3a91b5";
const navy = "#183d52";

function Pipe({ position, rotation, length, radius = 0.24 }: { position: [number, number, number]; rotation?: [number, number, number]; length: number; radius?: number }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={[radius, radius, length, 32]}/><meshStandardMaterial color={copper} metalness={0.82} roughness={0.24}/></mesh>;
}

function Joint({ position, radius = 0.32 }: { position: [number, number, number]; radius?: number }) {
  return <mesh position={position} castShadow><sphereGeometry args={[radius, 32, 20]}/><meshStandardMaterial color={copperLight} metalness={0.78} roughness={0.2}/></mesh>;
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
  return <group position={[1.55,.25,.1]} rotation={[0,0,Math.PI/2]}><Pipe position={[0,0,0]} length={1.25} radius={.2}/><group ref={wheel} position={[0,.72,0]} rotation={[Math.PI/2,0,0]}><mesh castShadow><torusGeometry args={[.55,.09,16,40]}/><meshStandardMaterial color={navy} metalness={.5} roughness={.3}/></mesh>{[0,Math.PI/2].map((r)=><mesh key={r} rotation-z={r}><boxGeometry args={[1.05,.1,.1]}/><meshStandardMaterial color={navy} metalness={.5} roughness={.3}/></mesh>)}</group></group>;
}

function PlumbingAssembly({ mode }: { mode: SceneMode }) {
  const assembly = useRef<THREE.Group>(null);
  useFrame((state, rawDelta) => {
    if (!assembly.current) return;
    const dt = Math.min(rawDelta,.05);
    const target = mode === "project" ? .18 : -.08;
    assembly.current.rotation.y += (target + Math.sin(state.clock.elapsedTime * .32) * .08 - assembly.current.rotation.y) * (1 - Math.exp(-2 * dt));
  });
  return <Float speed={1.1} rotationIntensity={.08} floatIntensity={.22}><group ref={assembly} rotation={[-.08,-.08,-.05]}>
    <Pipe position={[-1.45,0,0]} length={4.2}/><Joint position={[-1.45,2.1,0]}/><Joint position={[-1.45,-2.1,0]}/>
    <Pipe position={[0,.25,0]} rotation={[0,0,Math.PI/2]} length={3.15}/>
    <Joint position={[0,.25,0]}/><Joint position={[1.55,.25,0]}/>
    <Pipe position={[0,-1.15,0]} length={2.8} radius={.2}/><Joint position={[0,-2.55,0]} radius={.27}/>
    <Valve active={mode !== "repair"}/>
    <FlowBeads active={mode !== "repair"}/>
    {mode === "repair" && <group position={[-1.12,-.62,.35]}><mesh><sphereGeometry args={[.19,24,16]}/><meshStandardMaterial color={water} transparent opacity={.78} roughness={.05}/></mesh><mesh position={[.18,-.28,0]} scale={[.65,1,.65]}><sphereGeometry args={[.14,20,14]}/><meshStandardMaterial color={water} transparent opacity={.62}/></mesh></group>}
    {mode === "project" && <RoundedBox args={[1.4,.72,.36]} radius={.12} position={[-.05,1.2,-.18]} castShadow><meshStandardMaterial color="#e6e0d5" metalness={.18} roughness={.42}/></RoundedBox>}
  </group></Float>;
}

export function PlumbingScene({ mode = "flow", compact = false }: { mode?: SceneMode; compact?: boolean }) {
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  return <div className={compact ? "relative h-48 w-full sm:h-60" : "relative h-[360px] w-full sm:h-[460px] lg:h-[560px]"} aria-label="Animated three-dimensional copper plumbing system">
    <div className="absolute inset-x-[12%] bottom-[8%] h-1/3 rounded-full bg-copper/10 blur-3xl"/>
    {!mounted ? <div className="absolute inset-0 plumbing-fallback"/> : <Canvas shadows dpr={[1,1.5]} camera={{position:[0,1.2,7.8],fov:35}} gl={{antialias:true,alpha:true}} style={{background:"transparent"}}>
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