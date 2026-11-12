import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line, OrbitControls, useCursor } from '@react-three/drei';
import { MathUtils } from 'three';
import { islandsData } from '../data/islandsData.js';

function Toy({ kind = 'sphere', args, color, ...props }) {
  return <mesh castShadow receiveShadow {...props}>
    {kind === 'sphere' && <sphereGeometry args={args || [0.3, 16, 12]} />}
    {kind === 'box' && <boxGeometry args={args || [0.6, 0.6, 0.6]} />}
    {kind === 'cone' && <coneGeometry args={args || [0.6, 1.3, 8]} />}
    {kind === 'cylinder' && <cylinderGeometry args={args || [0.3, 0.3, 0.8, 12]} />}
    <meshStandardMaterial color={color} roughness={0.8} flatShading />
  </mesh>;
}
function Mushroom({ position, scale }) {
  return <group position={position} scale={scale}>
    <Toy kind="cylinder" position={[0, 0.45, 0]} color="#fff5dc" />
    <Toy position={[0, 0.95, 0]} scale={[2.5, 1.1, 2.5]} color="#f88091" />
    <Toy position={[-0.3, 1.18, 0.25]} scale={0.4} color="white" />
    <Toy position={[0.25, 1.2, 0.1]} scale={0.35} color="white" />
  </group>;
}
function Props({ id }) {
  if (id === 1) return <>
    {[-0.7, 0.6].map((x) => <group key={x} position={[x, 0.35, -0.35]}>
      <Toy kind="cylinder" position={[0, 0.4, 0]} color="#a7785e" args={[0.13, 0.16, 0.8, 8]} />
      <Toy kind="cone" position={[0, 1.1, 0]} color={x < 0 ? '#4aa887' : '#76c58b'} />
    </group>)}
    {[-0.8, 0, 0.8].map((x) => <Toy key={x} position={[x, 0.58, 0.65]} color="#f46a72" args={[0.23, 12, 10]} />)}
  </>;
  if (id === 2) return <>
    <Toy kind="box" args={[1.2, 0.8, 1.1]} position={[0, 0.75, 0]} color="#a58ade" />
    <Toy kind="cylinder" args={[0.45, 0.45, 0.8, 16]} position={[0, 1.55, 0]} color="#ffd67d" />
    <Toy kind="cone" args={[0.65, 0.85, 12]} position={[0, 2.35, 0]} color="#f887a6" />
    <Toy kind="box" args={[0.3, 0.45, 0.08]} position={[0, 0.6, 0.57]} color="#fff3db" />
  </>;
  if (id === 3) return <>
    <Mushroom position={[-0.55, 0.35, 0]} scale={1} />
    <Mushroom position={[0.9, 0.35, 0.5]} scale={0.48} />
  </>;
  if (id === 4) return <>
    {[-0.7, 0.7].map((x) => <Toy key={x} position={[x, 0.6, 0.4]} scale={[1.8, 0.85, 1.4]} color="#dfab70" />)}
    <Toy kind="cylinder" args={[0.48, 0.48, 0.7, 16]} position={[0, 0.7, -0.5]} color="#fffdf1" />
    {[-0.32, 0, 0.32].map((x) => <Toy key={x} position={[x, 1.15, -0.5]} args={[0.32, 12, 10]} color="white" />)}
  </>;
  return <>
    {['#f28599', '#ffe08b', '#81b9ed'].map((color, i) => <Toy key={color} kind="box" args={[0.65, 0.45 + i * 0.35, 1.1]} position={[-0.85 + i * 0.85, 0.575 + i * 0.175, 0]} color={color} />)}
  </>;
}
function Reward() {
  const ref = useRef();
  useFrame((_, delta) => { ref.current.rotation.y += delta; });
  return <group ref={ref} position={[0, 3.1, 0]}>
    <Toy kind="cone" args={[0.43, 0.7, 4]} color="#ffd351" />
    <Toy kind="cone" args={[0.43, 0.7, 4]} rotation={[Math.PI, 0, 0]} position={[0, -0.7, 0]} color="#ffd351" />
  </group>;
}
function Island({ island, index, completed, onSelect }) {
  const ref = useRef(), bounce = useRef(-1);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = island.position[1] + Math.sin(t + index) * 0.12;
    if (bounce.current >= 0) bounce.current += delta;
    const pop = bounce.current >= 0 && bounce.current < 0.4 ? Math.sin(bounce.current / 0.4 * Math.PI) * 0.16 : 0;
    const size = (hovered ? 1.035 : 1) + pop;
    ref.current.scale.setScalar(MathUtils.damp(ref.current.scale.x, size, 14, delta));
  });
  return <group ref={ref} position={island.position}>
    <group onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); bounce.current = 0; onSelect(island); }}>
      <Toy kind="cylinder" args={[1.8, 1.8, 0.7, 6]} color={island.color} />
      <Toy kind="cone" args={[1.65, 1.8, 6]} rotation={[Math.PI, 0, 0]} position={[0, -1.2, 0]} color="#b5a6cb" />
      <Props id={island.id} />
    </group>
    {completed && <Reward />}
    <Html position={[0, -0.55, 1.5]} center zIndexRange={[10, 0]}>
      <button className="island-label" onClick={() => { bounce.current = 0; onSelect(island); }}
        aria-label={`${island.name}${completed ? '，已完成，再玩一次' : '，開始遊戲'}`}>
        <span className="island-number">{completed ? '★' : island.id}</span>{island.name}
      </button>
    </Html>
  </group>;
}
function Cloud({ position, index }) {
  const ref = useRef();
  useFrame(({ clock }) => { ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.15 + index) * 0.6; });
  return <group ref={ref} position={position}>
    {[-0.7, 0, 0.65].map((x, i) => <Toy key={x} position={[x, i === 1 ? 0.15 : 0, 0]} scale={[1.5, 0.65, 1]} args={[0.7, 12, 8]} color="#fffdf6" />)}
  </group>;
}
export default function IslandScene({ completedIds, onSelect, paused }) {
  useEffect(() => () => { document.body.style.cursor = ''; }, []);
  return <Canvas shadows dpr={[1, 1.7]} camera={{ position: [10, 12, 16], fov: 52 }}
    fallback={<div className="scene-fallback">用下方的大按鈕，一起開始冒險吧！</div>}>
    <color attach="background" args={['#87CEEB']} />
    <fog attach="fog" args={['#87CEEB', 28, 65]} />
    <ambientLight intensity={0.7} />
    <directionalLight position={[10, 15, 10]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
    {islandsData.slice(0, -1).map((island, i) => <Line key={island.id}
      points={[island.position, islandsData[i + 1].position]} color="#fff5cc" lineWidth={3} dashed dashSize={0.22} gapSize={0.15} />)}
    {islandsData.map((island, index) => <Island key={island.id} island={island} index={index}
      completed={completedIds.includes(island.id)} onSelect={onSelect} />)}
    {[[-8, 3, -5], [6, 4, -8], [-6, 1, 6], [9, 2, 6]].map((position, index) =>
      <Cloud key={index} position={position} index={index} />)}
    <OrbitControls enabled={!paused} enablePan={false} minDistance={7} maxDistance={18}
      maxPolarAngle={Math.PI / 2.2} minPolarAngle={0.3} target={[0, 0, 0]} />
  </Canvas>;
}
