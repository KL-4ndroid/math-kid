import { useRef, useState, useEffect } from "react";
import { isVoiceActive } from '../utils/sound.js';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Plane, Vector3 } from 'three';
import { OrbitControls, RoundedBox as DreiRoundedBox } from "@react-three/drei";
import { Snack, Tray, slotPosition } from './SnackModels.jsx';

const palette = {
  cream: "#f7dfb4",
  bread: "#c98343",
  crust: "#8b512f",
  wood: "#9b6546",
  sage: "#8fb39a",
  peach: "#edaa82",
  berry: "#c95d63",
  leaf: "#5d9b71",
  cocoa: "#6f4535",
};

export function RoundedBox({ position, scale, color, radius = 0.12, ...props }) {
  return (
    <DreiRoundedBox position={position} args={scale} radius={radius} smoothness={3} castShadow receiveShadow {...props}>
      <meshStandardMaterial color={color} roughness={0.82} />
    </DreiRoundedBox>
  );
}

export function Bread({ position, scale = 1, onClick, selected }) {
  return (
    <group position={position} scale={scale} onClick={onClick}>
      <RoundedBox scale={[0.68, 0.34, 0.42]} color={palette.bread} radius={0.14} />
      <RoundedBox position={[0, 0.18, 0]} scale={[0.54, 0.12, 0.3]} color={palette.cream} radius={0.08} />
      {[-0.16, 0, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.27, 0]} rotation={[0, 0, -0.55]} castShadow>
          <boxGeometry args={[0.045, 0.2, 0.04]} />
          <meshStandardMaterial color={palette.crust} roughness={0.8} />
        </mesh>
      ))}
      {selected && <mesh position={[0, 0.02, 0]} scale={1.18}>
        <torusGeometry args={[0.34, 0.025, 8, 24]} />
        <meshBasicMaterial color="#fff3a6" />
      </mesh>}
    </group>
  );
}

export function Croissant({ position, onClick, selected }) {
  return (
    <group position={position} onClick={onClick}>
      <mesh rotation={[0, 0, -0.45]} castShadow receiveShadow>
        <torusGeometry args={[0.28, 0.13, 10, 18, Math.PI * 1.55]} />
        <meshStandardMaterial color={palette.bread} roughness={0.78} />
      </mesh>
      {[-0.16, 0, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.04, 0.02]} rotation={[0, 0, -0.4]} castShadow>
          <torusGeometry args={[0.14, 0.025, 8, 12, Math.PI * 1.45]} />
          <meshStandardMaterial color={palette.cream} roughness={0.75} />
        </mesh>
      ))}
      {selected && <mesh position={[0, 0.02, 0]} scale={1.3}>
        <torusGeometry args={[0.32, 0.025, 8, 24]} />
        <meshBasicMaterial color="#fff3a6" />
      </mesh>}
    </group>
  );
}

export function Fox({ position = [-2.5, 0, 1.7], onClick, happy = false, quiet = false, guiding = false }) {
  const tail = useRef();
  const root = useRef();
  const eyes = useRef();
  const paw = useRef();
  const mouth = useRef();
  const [speaking, setSpeaking] = useState(isVoiceActive);
  useEffect(() => { const update = () => setSpeaking(isVoiceActive()); window.addEventListener('magic-math-voice', update); return () => window.removeEventListener('magic-math-voice', update); }, []);
  useFrame(({ clock }) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mouth.current) mouth.current.scale.y = !quiet && speaking ? (reduced ? 1 : 1 + Math.abs(Math.sin(clock.elapsedTime * 12)) * 1.2) : 0.4;
    if (root.current) root.current.position.y = position[1] + (reduced || quiet ? 0 : Math.sin(clock.elapsedTime * (happy ? 5 : 1.8)) * (happy ? 0.06 : 0.012));
    if (eyes.current) eyes.current.scale.y = !reduced && clock.elapsedTime % 5.5 > 5.3 ? 0.12 : 1;
    if (paw.current) paw.current.rotation.z = quiet ? -0.35 : happy && !reduced ? Math.sin(clock.elapsedTime * 4) * 0.4 : guiding ? -1.2 : -0.35;
    if (tail.current) tail.current.rotation.z = reduced || quiet ? -0.35 : -0.35 + Math.sin(clock.elapsedTime * 2) * 0.12;
  });
  return (
    <group ref={root} position={position} onClick={onClick}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.48, 16, 12]} />
        <meshStandardMaterial color={palette.peach} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial color="#f5c18d" roughness={0.8} />
      </mesh>
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 1.63, 0]} rotation={[0, 0, x < 0 ? -0.18 : 0.18]} castShadow>
          <coneGeometry args={[0.16, 0.42, 5]} />
          <meshStandardMaterial color={palette.peach} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.16, 0.36]} castShadow>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color="#fff0d0" roughness={0.85} />
      </mesh>
      <mesh ref={tail} position={[0.55, 0.6, -0.04]} rotation={[0, 0, -0.35]} castShadow>
        <sphereGeometry args={[0.32, 14, 10]} />
        <meshStandardMaterial color={palette.peach} roughness={0.8} />
      </mesh>
      <group ref={eyes} position={[0, 1.29, 0.35]}>{[-0.14, 0.14].map(x => <mesh key={x} position={[x, 0, 0]}><sphereGeometry args={[0.045, 12, 8]} /><meshStandardMaterial color="#302b29" /></mesh>)}</group>
      <group ref={paw} position={[-0.4, 0.75, 0.1]}><mesh position={[0, -0.13, 0]} scale={[0.8, 1.5, 1]} castShadow><sphereGeometry args={[0.15, 12, 8]} /><meshStandardMaterial color={palette.peach} /></mesh></group>
      <mesh position={[0.4, 0.62, 0.1]} scale={[0.8, 1.5, 1]} castShadow><sphereGeometry args={[0.15, 12, 8]} /><meshStandardMaterial color={palette.peach} /></mesh>
      <mesh ref={mouth} position={[0, 1.06, 0.5]}><sphereGeometry args={[0.035, 10, 8]} /><meshStandardMaterial color="#77483b" /></mesh>
      <mesh position={[0, 1.18, 0.52]}><sphereGeometry args={[0.055, 12, 8]} /><meshStandardMaterial color="#493228" /></mesh>
      {[-0.23, 0.23].map(x => <RoundedBox key={x} position={[x, 0.16, 0.15]} scale={[0.22, 0.24, 0.34]} color={palette.cocoa} radius={0.07} />)}
      <RoundedBox position={[0, 0.72, 0.34]} scale={[0.48, 0.25, 0.08]} color={palette.sage} radius={0.035} />
    </group>
  );
}

function BakeryBuilding({ color }) {
  return (
    <group>
      <RoundedBox position={[0, -0.2, 0]} scale={[8, 0.45, 5.2]} color="#d8b083" radius={0.22} />
      <RoundedBox position={[0, 2, 0]} scale={[6.8, 3.8, 3.8]} color="#fff0d1" radius={0.2} />
      <mesh position={[0, 4.15, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[5.8, 0.35, 4]} />
        <meshStandardMaterial color={palette.wood} roughness={0.85} />
      </mesh>
      <RoundedBox position={[0, 3.25, 2.02]} scale={[6.4, 0.55, 0.35]} color={color} radius={0.1} />
      <RoundedBox position={[0, 1.3, 2.02]} scale={[1.35, 2.2, 0.2]} color={palette.wood} radius={0.12} />
      <RoundedBox position={[-2.05, 1.9, 2.02]} scale={[1.7, 1.55, 0.16]} color="#9ed3d0" radius={0.08} />
      <RoundedBox position={[2.05, 1.9, 2.02]} scale={[1.7, 1.55, 0.16]} color="#9ed3d0" radius={0.08} />
      <mesh position={[0.42, 1.3, 2.16]} castShadow>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#e9c16d" roughness={0.6} />
      </mesh>
    </group>
  );
}

function FoxSign(props) {
  return <group {...props}>
    <RoundedBox scale={[1.8, 0.65, 0.18]} radius={0.06} color="#ac7850" />
    <group scale={0.25} position={[0, -0.26, 0.12]}><Fox position={[0, 0, 0]} quiet /></group>
    {[-0.65, 0.65].map(x => <mesh key={x} position={[x, 0, 0.12]}><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color="#e9c16d" /></mesh>)}
  </group>;
}

function SignInstallation({ onInstall }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 1.2, 1);
    camera.updateMatrixWorld();
  }, [camera]);
  const [selected, setSelected] = useState(false);
  const [point, setPoint] = useState(null);
  const drag = useRef(null);
  const committed = useRef(false);
  const plane = new Plane(new Vector3(0, 0, 1), -2.65);
  const cancel = () => { drag.current = null; setPoint(null); setSelected(false); };
  useEffect(() => {
    const secondary = event => { if (!event.isPrimary) cancel(); };
    window.addEventListener('blur', cancel);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('pointerdown', secondary);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('pointerdown', secondary);
    };
  }, []);
  const install = () => {
    if (committed.current) return;
    committed.current = true;
    onInstall();
  };
  return <>
    <group position={[0, 2.85, 2.65]} onClick={event => { event.stopPropagation(); if (selected) install(); }}>
      <RoundedBox scale={[2.4, 1.15, 0.12]} radius={0.1} color={selected ? '#e9cb89' : '#bdd0b1'} />
      <mesh visible={false}><boxGeometry args={[3.4, 1.8, 0.5]} /><meshBasicMaterial /></mesh>
    </group>
    <group position={point || [0, 0.85, 3.5]}
      onPointerDown={event => {
        if (!event.nativeEvent.isPrimary || event.button !== 0) return;
        event.stopPropagation();
        drag.current = { id: event.pointerId, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY, moved: false };
        event.target.setPointerCapture(event.pointerId);
        setSelected(true);
      }} onPointerMove={event => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        if (Math.hypot(event.nativeEvent.clientX - start.x, event.nativeEvent.clientY - start.y) < 8 && !start.moved) return;
        start.moved = true;
        const hit = event.ray.intersectPlane(plane, new Vector3());
        if (hit) { start.point = hit; setPoint(hit.toArray()); }
      }} onPointerUp={event => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        event.stopPropagation();
        drag.current = null;
        event.target.releasePointerCapture(event.pointerId);
        setPoint(null);
        if (start.moved) {
          if (start.point && Math.abs(start.point.x) < 1.7 && Math.abs(start.point.y - 2.85) < 0.9) install();
          else setSelected(false);
        }
      }} onLostPointerCapture={() => { if (drag.current) cancel(); }}>
      <FoxSign />
      <mesh visible={false}><boxGeometry args={[2.5, 1.2, 0.5]} /><meshBasicMaterial /></mesh>
    </group>
  </>;
}

function SceneContent({ selected, onSelect, color, placed, freeCount, freeItem, installSign, onInstallSign }) {
  return (
    <>
      <BakeryBuilding color={color} />
      <RoundedBox position={[0, -0.04, 3.1]} scale={[8.7, 0.18, 2.5]} color="#9bc486" radius={0.2} />
      <RoundedBox position={[-1.4, 0.28, 1.9]} scale={[3.3, 0.28, 1.1]} color={palette.wood} radius={0.12} />
      <Bread position={[-2.15, 0.62, 1.85]} selected={selected === "bread"} onClick={() => onSelect("bread")} />
      <Bread position={[-1.4, 0.62, 1.85]} selected={selected === "bread-2"} onClick={() => onSelect("bread-2")} />
      <Croissant position={[-0.62, 0.66, 1.86]} selected={selected === "croissant"} onClick={() => onSelect("croissant")} />
      {freeCount !== null && <group position={[0, 0.7, 3.6]}><Tray slots={5} />{Array.from({ length: freeCount }, (_, i) => <Snack key={i} kind={freeItem} position={slotPosition(i)} />)}</group>}
      {placed.includes('sign') && <FoxSign position={[0, 2.85, 2.3]} />}
      {installSign && <SignInstallation onInstall={onInstallSign} />}
      {placed.includes('flowers') && <group position={[-3.4, 0.3, 2.4]}><mesh castShadow><cylinderGeometry args={[0.38, 0.25, 0.55, 16]} /><meshStandardMaterial color="#ce8d75" /></mesh>{[-0.2, 0, 0.2].map((x, i) => <group key={i} position={[x, 0.6 + i * 0.12, 0]}><mesh><cylinderGeometry args={[0.025, 0.025, 0.65, 8]} /><meshStandardMaterial color="#67985e" /></mesh>{Array.from({ length: 5 }, (_, k) => <mesh key={k} position={[Math.cos(k * 1.257) * 0.12, 0.4 + Math.sin(k * 1.257) * 0.12, 0]} scale={[1, 1, 0.5]}><sphereGeometry args={[0.11, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#eac66b' : '#e5a1ac'} /></mesh>)}</group>)}</group>}
      {placed.includes('flags') && Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-2.4 + i * 0.8, 2.75, 2.4]} rotation={[0, 0, Math.PI]} castShadow><coneGeometry args={[0.2, 0.4, 3]} /><meshStandardMaterial color={['#e5a1ac', '#eac66b', '#8fb39a'][i % 3]} /></mesh>)}
      {placed.includes('table') && <group position={[3.5, 0.6, 3]}><mesh castShadow><cylinderGeometry args={[0.8, 0.8, 0.15, 24]} /><meshStandardMaterial color="#b98a5f" /></mesh>{[-0.5, 0.5].flatMap(x => [-0.4, 0.4].map(z => <RoundedBox key={`${x}-${z}`} position={[x, -0.35, z]} scale={[0.1, 0.65, 0.1]} radius={0.03} color="#986a49" />))}</group>}
      {placed.includes('lamp') && <group position={[2.1, 2.3, 2.2]}><mesh><sphereGeometry args={[0.14, 12, 8]} /><meshStandardMaterial color="#ffe49b" emissive="#e5b85a" emissiveIntensity={0.7} /></mesh>{Array.from({ length: 5 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI * 2 / 5]}><mesh position={[0, 0.2, 0]}><coneGeometry args={[0.12, 0.32, 4]} /><meshStandardMaterial color="#ffe49b" emissive="#e5b85a" emissiveIntensity={0.7} /></mesh></group>)}<pointLight color="#ffe2a1" intensity={2} distance={4} /></group>}
      <Fox />
      <mesh position={[2.4, 0.75, 1.95]} castShadow>
        <cylinderGeometry args={[0.65, 0.72, 0.28, 16]} />
        <meshStandardMaterial color="#e8c38a" roughness={0.85} />
      </mesh>
      {[-0.28, 0, 0.28].map((x) => (
        <mesh key={x} position={[2.4 + x, 0.98, 1.95]} castShadow>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial color={palette.bread} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[2.4, 1.34, 2]} castShadow>
        <torusGeometry args={[0.28, 0.035, 8, 16]} />
        <meshStandardMaterial color="#e6b45e" roughness={0.7} />
      </mesh>
    </>
  );
}

export default function BakeryScene({ selected, onSelect = () => {}, color = "#8fb39a", paused = false, placed = [], freeCount = null, freeItem = 'croissant', installSign = false, onInstallSign }) {
  const colorValue = color;
  return (
    <div className="bk-scene-3d" style={installSign ? { touchAction: 'none' } : undefined} aria-label="阿栗的 3D 微縮麵包店">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: installSign ? [0, 4, 12] : [8, 6.2, 11], fov: 38 }} fallback={<div className="bk-scene-fallback">麵包店正在準備中</div>}>
        <color attach="background" args={["#d8f0ec"]} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 9, 7]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
        <SceneContent selected={selected} onSelect={onSelect} color={colorValue} placed={placed} freeCount={freeCount} freeItem={freeItem} installSign={installSign} onInstallSign={onInstallSign} />
        <OrbitControls enabled={!paused && !installSign} enablePan={false} minDistance={8} maxDistance={15} maxPolarAngle={Math.PI / 2.15} minPolarAngle={0.48} target={[0, 1.2, 1]} />
      </Canvas>
    </div>
  );
}
