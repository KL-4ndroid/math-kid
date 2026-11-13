import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, SoftBall } from '../bakery/ToyPrimitives.jsx';

export function Seed(props) {
  return <group {...props}>
    <SoftBall color="#a16b3e" size={0.32} scale={[0.8, 1, 1.25]} rotation={[0.3, 0, -0.2]} />
    <SoftBall color="#e1b879" size={0.12} scale={[0.5, 0.6, 1.5]} position={[0, 0.18, 0.17]} />
  </group>;
}

export function FlowerPot({ sprout = false, ...props }) {
  return <group {...props}>
    <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.43, 0.3, 0.55, 24]} />
      <meshStandardMaterial color="#c78465" roughness={0.92} />
    </mesh>
    <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[0.42, 0.065, 8, 24]} />
      <meshStandardMaterial color="#e0a07c" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.13, 0]} receiveShadow>
      <cylinderGeometry args={[0.38, 0.38, 0.04, 24]} />
      <meshStandardMaterial color="#5a4033" roughness={1} />
    </mesh>
    {sprout && <group position={[0, 0.17, 0]}>
      <RoundedBox scale={[0.06, 0.45, 0.06]} position={[0, 0.2, 0]} color="#6b9255" radius={0.02} />
      {[-1, 1].map(side => <SoftBall key={side} color={side < 0 ? '#8eaf69' : '#6f9959'} size={0.2} scale={[1, 0.3, 0.65]} position={[side * 0.16, 0.36, 0]} rotation={[0, 0, side * 0.35]} />)}
    </group>}
  </group>;
}

export function CircleSlot(props) {
  return <mesh {...props} rotation={[-Math.PI / 2, 0, 0]}>
    <torusGeometry args={[0.48, 0.035, 8, 32]} />
    <meshStandardMaterial color="#e4c880" roughness={0.88} />
  </mesh>;
}

export function SongSong({ quiet = false, ...props }) {
  const root = useRef();
  useFrame(({ clock }) => {
    if (root.current) root.current.rotation.z = quiet || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(clock.elapsedTime * 1.4) * 0.015;
  });
  return <group {...props}><group ref={root}>
    <SoftBall color="#aa7149" size={0.48} scale={[0.9, 1.6, 0.8]} position={[0.52, 0.8, -0.27]} rotation={[0, 0, -0.35]} />
    <SoftBall color="#cf9864" size={0.3} position={[0.55, 1.36, -0.18]} />
    <SoftBall color="#b88055" size={0.35} scale={[1, 1.3, 0.85]} position={[0, 0.6, 0]} />
    <RoundedBox color="#7f9b87" scale={[0.57, 0.49, 0.51]} radius={0.1} position={[0, 0.61, 0.04]} />
    <RoundedBox color="#f0d6a1" scale={[0.15, 0.17, 0.035]} radius={0.02} position={[0.16, 0.65, 0.31]} />
    <SoftBall color="#b88055" size={0.38} scale={[1.06, 0.95, 0.9]} position={[0, 1.12, 0.04]} />
    {[-1, 1].map(side => <group key={side}>
      <SoftBall color="#aa7149" size={0.15} scale={[0.8, 1.4, 0.7]} position={[side * 0.24, 1.43, 0.01]} />
      <SoftBall color="#e8bf96" size={0.09} position={[side * 0.24, 1.45, 0.1]} />
      <SoftBall color="#3f352d" size={0.044} position={[side * 0.14, 1.18, 0.36]} />
      <SoftBall color="#aa7149" size={0.12} scale={[0.75, 1.7, 0.85]} position={[side * 0.36, 0.64, 0.06]} />
      <SoftBall color="#82583f" size={0.13} position={[side * 0.18, 0.17, 0.13]} />
    </group>)}
    <SoftBall color="#f4ddb5" size={0.18} scale={[1.25, 0.65, 0.65]} position={[0, 1.01, 0.34]} />
    <SoftBall color="#49382f" size={0.055} position={[0, 1.08, 0.46]} />
    <RoundedBox color="#fff2d6" scale={[0.09, 0.1, 0.035]} position={[0, 0.97, 0.46]} radius={0.01} />
  </group></group>;
}

export function DuoDuo({ quiet = false, ...props }) {
  const cloud = useRef();
  useFrame(({ clock }) => {
    if (cloud.current) cloud.current.position.y = quiet || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(clock.elapsedTime * 1.2) * 0.07;
  });
  return <group {...props}><group ref={cloud}>
    {[-0.35, 0, 0.35].map((x, i) => <SoftBall key={x} color="#fff7e5" size={i === 1 ? 0.4 : 0.3} position={[x, i === 1 ? 0.13 : 0, 0]} />)}
    {[-1, 1].map(side => <group key={side}>
      <SoftBall color="#493f38" size={0.038} position={[side * 0.15, 0.11, 0.37]} />
      <SoftBall color="#fff7e5" size={0.12} scale={[1.6, 0.7, 0.8]} position={[side * 0.6, -0.08, 0]} />
    </group>)}
    <SoftBall color="#cf927c" size={0.04} scale={[1, 0.5, 0.5]} position={[0, -0.02, 0.39]} />
  </group></group>;
}

export function ForestStation() {
  return <group>
    <RoundedBox color="#a8b68a" scale={[9, 0.45, 6]} radius={0.2} position={[0, -0.3, 0]} />
    <RoundedBox color="#ead7ae" scale={[3.8, 2, 1.6]} position={[0, 1, -1.2]} />
    <RoundedBox color="#78947b" scale={[4.3, 0.25, 2.4]} position={[0, 2.12, -1.15]} rotation={[0, 0, 0.04]} />
    <RoundedBox color="#87654d" scale={[0.85, 1.5, 0.1]} position={[0, 0.76, -0.34]} />
    {[-1.15, 1.15].map(x => <group key={x}>
      <RoundedBox color="#758f88" scale={[0.72, 0.8, 0.08]} position={[x, 1.22, -0.34]} />
      <RoundedBox color="#f4e4c5" scale={[0.06, 0.85, 0.12]} position={[x, 1.22, -0.28]} />
    </group>)}
    <mesh position={[0, 1.8, -0.27]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} /><meshStandardMaterial color="#f7e7bf" />
    </mesh>
    <RoundedBox scale={[0.03, 0.14, 0.04]} position={[0, 1.85, -0.2]} color="#795a43" radius={0.01} />
    {[-3.3, 3.3].map(x => <group key={x} position={[x, 0, -1.6]}>
      <RoundedBox scale={[0.22, 1.5, 0.22]} position={[0, 0.65, 0]} color="#967452" />
      <SoftBall color="#7f9a68" size={0.8} scale={[0.8, 1.3, 0.8]} position={[0, 1.6, 0]} />
    </group>)}
    <RoundedBox color="#dbc39a" scale={[2.4, 0.08, 2.8]} position={[0, -0.02, 1.2]} />
  </group>;
}
