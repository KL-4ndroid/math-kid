import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { BakeryLighting, RoundedBox } from '../bakery/ToyPrimitives.jsx';
import { ContextGuard, SceneBoundary } from '../shared/interaction/SceneBoundary.jsx';
import { CircleSlot, DuoDuo, FlowerPot, ForestStation, Seed, SongSong } from './ForestModels.jsx';
import { forestLayout, FOREST_IDS, forestPotPosition, FOREST_FOV } from './layout.js';

export function ForestTaskDisplay({ task = 'plant', seedToPot = {}, potToSlot = {} }) {
  const { camera, size } = useThree();
  const layout = forestLayout(size.width);
  useEffect(() => {
    camera.position.set(...layout.camera);
    camera.lookAt(...layout.lookAt);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return <>
    <RoundedBox {...layout.board} color="#d7c39c" radius={0.16} />
    {task === 'plant' ? <>
      {FOREST_IDS.seeds.filter(id => !seedToPot[id]).map(id => <Seed key={id} position={layout.sources[FOREST_IDS.seeds.indexOf(id)]} />)}
      {FOREST_IDS.pots.map((id, i) => <FlowerPot key={id} position={layout.pots[i]} />)}
    </> : <>
      {FOREST_IDS.slots.filter(id => !Object.values(potToSlot).includes(id)).map(id => <CircleSlot key={id} position={layout.slots[FOREST_IDS.slots.indexOf(id)]} />)}
      {FOREST_IDS.pots.map(id => <FlowerPot key={id} position={forestPotPosition(layout, id, potToSlot)} />)}
    </>}
  </>;
}

export default function ForestScene({ repaired = false }) {
  const [lost, setLost] = useState(false);
  return <SceneBoundary onError={() => setLost(true)}>
    <div className="bk-scene-3d" aria-label="森林車站場景">
      {lost ? <p role="status">森林場景暫時無法顯示，可以回到麵包店。</p> : <Canvas
        dpr={[1, 1.25]} camera={{ position: [0, 4.6, 8.6], fov: FOREST_FOV }}
        onCreated={({ camera }) => camera.lookAt(0, 0.8, 0)}
        fallback={<p role="status">森林場景暫時無法顯示，可以回到麵包店。</p>}
      >
        <ContextGuard onLost={() => setLost(true)} />
        <color attach="background" args={['#e7eddf']} />
        <BakeryLighting />
        <group scale={0.78}>
          <ForestStation />
          <SongSong position={[-1.8, 0, 1.5]} />
          <DuoDuo position={[2.4, 2.3, 0]} />
          {repaired && [-0.9, 0, 0.9].map(x => <FlowerPot key={x} position={[x, 0.3, 1.8]} sprout />)}
        </group>
      </Canvas>}
    </div>
  </SceneBoundary>;
}
