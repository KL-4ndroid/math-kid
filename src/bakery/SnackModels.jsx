import { RoundedBox, Bread, Croissant } from './BakeryScene.jsx';

export const snackNames = { bread: '麵包', croissant: '可頌', toast: '吐司', cupcake: '蛋糕', cookie: '餅乾', strawberry: '草莓' };

export function Snack({ kind, highlighted = false, ...props }) {
  return <group {...props}>
    {kind === 'bread' && <Bread />}
    {kind === 'croissant' && <group rotation={[-Math.PI / 2, 0, 0]}><Croissant /></group>}
    {kind === 'toast' && <group>
      <RoundedBox scale={[0.56, 0.17, 0.6]} color="#bb7843" radius={0.075} />
      <RoundedBox position={[0, 0.09, 0]} scale={[0.44, 0.035, 0.48]} color="#ffe4af" radius={0.015} />
      {[-0.13, 0.12].map(x => <mesh key={x} position={[x, 0.12, 0.03]}><sphereGeometry args={[0.026, 8, 6]} /><meshStandardMaterial color="#eac88f" /></mesh>)}
    </group>}
    {kind === 'cupcake' && <group>
      <mesh position={[0, 0.14, 0]} castShadow><cylinderGeometry args={[0.25, 0.18, 0.3, 16]} /><meshStandardMaterial color="#dda4a2" roughness={0.85} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 6) * 0.215, 0.14, Math.sin(i * Math.PI / 6) * 0.215]} castShadow><cylinderGeometry args={[0.012, 0.01, 0.27, 5]} /><meshStandardMaterial color="#f8c9ba" /></mesh>)}
      {[0, 1, 2].map(i => <mesh key={i} position={[0, 0.32 + i * 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.19 - i * 0.055, 0.075, 8, 20]} /><meshStandardMaterial color="#fff0d9" roughness={0.7} /></mesh>)}
      <mesh position={[0, 0.59, 0]} castShadow><sphereGeometry args={[0.07, 12, 8]} /><meshStandardMaterial color="#ba5157" /></mesh>
    </group>}
    {kind === 'cookie' && <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.29, 0.27, 0.13, 20]} /><meshStandardMaterial color="#d8a368" roughness={0.9} /></mesh>
      {[[-0.13, 0.08], [0.08, 0.15], [0.16, -0.09], [-0.06, -0.16], [0, 0]].map(([x, y], i) => <RoundedBox key={i} position={[x, y, 0.07]} scale={[0.065, 0.06, 0.03]} radius={0.012} color="#674539" rotation={[0, 0, i]} />)}
    </group>}
    {kind === 'strawberry' && <group>
      <mesh position={[0, 0.11, 0]} scale={[1, 1.2, 1]} castShadow><sphereGeometry args={[0.23, 16, 12]} /><meshStandardMaterial color="#d96863" roughness={0.8} /></mesh>
      {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[Math.cos(i * 1.257) * 0.09, 0.35, Math.sin(i * 1.257) * 0.09]} rotation={[0.4, i * 1.257, 0.7]} scale={[1, 0.3, 2]} castShadow><sphereGeometry args={[0.09, 8, 6]} /><meshStandardMaterial color="#79a46b" /></mesh>)}
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.cos(i * 2.4) * 0.2, -0.02 + (i % 4) * 0.075, Math.sin(i * 2.4) * 0.2]} scale={[0.7, 1.3, 0.7]}><sphereGeometry args={[0.018, 6, 4]} /><meshStandardMaterial color="#ffe5a1" /></mesh>)}
    </group>}
    {highlighted && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}><torusGeometry args={[0.4, 0.035, 8, 28]} /><meshBasicMaterial color="#e0a13b" /></mesh>}
  </group>;
}

export function Tray({ position, slots = 5, active = false, basket = false, variant = 'tray', ...props }) {
  return <group position={position} {...props}>
    <RoundedBox scale={[3.2, 0.14, 2]} radius={0.065} color={active ? '#e9cb89' : basket ? '#bd9066' : '#c8d9c7'} />
    {[-1, 1].map(side => <RoundedBox key={side} position={[0, 0.16, side * 0.96]} scale={[3.2, 0.28, 0.1]} radius={0.045} color={basket ? '#a87c53' : '#f8efd9'} />)}
    {[-1, 1].map(side => <RoundedBox key={side} position={[side * 1.55, 0.16, 0]} scale={[0.1, 0.28, 1.9]} radius={0.045} color={basket ? '#a87c53' : '#f8efd9'} />)}
    {basket && <>
      {[-1, 1].map(s => <mesh key={s} position={[s * 1.47, 0.24, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.04, 8, 18, Math.PI]} /><meshStandardMaterial color="#97704d" /></mesh>)}
      {Array.from({ length: 12 }, (_, i) => <RoundedBox key={i} position={[-1.4 + i * 0.255, 0.17, 1.02]} scale={[0.07, 0.26, 0.035]} radius={0.015} color="#e1bd89" />)}
    </>}
    {variant === 'lunchbox' && <>
      {[-0.49, 0.49].map(x => <RoundedBox key={x} position={[x, 0.18, 0]} scale={[0.045, 0.2, 1.8]} radius={0.02} color="#f9ecd4" />)}
      <RoundedBox position={[0, 0.18, 0.01]} scale={[3, 0.2, 0.04]} radius={0.015} color="#f9ecd4" />
    </>}
    {variant === 'bag' && [-1, 1].map(s => <mesh key={s} position={[0, 0.35, s * 0.96]}><torusGeometry args={[0.45, 0.045, 8, 20, Math.PI]} /><meshStandardMaterial color="#ac825a" /></mesh>)}
    {Array.from({ length: slots }, (_, i) => <mesh key={i} position={slotPosition(i)} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.39, 0.018, 6, 20]} /><meshStandardMaterial color={active ? '#bf8d36' : '#a0b49a'} /></mesh>)}
  </group>;
}
export function slotPosition(i) { return [(i % 3 - 1) * 0.98, 0.13, Math.floor(i / 3) * 0.88 - 0.42]; }
