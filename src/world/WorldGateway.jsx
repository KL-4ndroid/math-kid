import { useEffect, useRef, useState } from 'react';
import ForestScene from '../forest/ForestScene.jsx';
import BakeryScene from '../bakery/BakeryScene.jsx';
import { SceneBoundary } from '../bakery/Workbench3D.jsx';
import { islandAccess } from './navigation.js';
import { stopSpeaking } from '../utils/sound.js';

export default function WorldGateway({ bakery, world, onReturn, onRest }) {
  const heading = useRef(null);
  const [preview, setPreview] = useState('bakery');
  const forest = islandAccess('forest', bakery, world);
  useEffect(() => {
    stopSpeaking();
    heading.current?.focus();
    const escape = event => { if (event.key === 'Escape') onReturn(); };
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('keydown', escape); stopSpeaking(); };
  }, [onReturn]);
  return (
    <section className="world-gateway bakery-content" aria-label="故事群島">
      <h1 ref={heading} tabIndex={-1}>熟悉的小店，隨時歡迎你</h1>
      <div className="world-actions" aria-label="選擇場景預覽">
        <button aria-pressed={preview === 'bakery'} onClick={() => setPreview('bakery')}>看看麵包店</button>
        <button aria-pressed={preview === 'forest'} onClick={() => setPreview('forest')}>看看森林車站</button>
      </div>
      {preview === 'bakery' ? <SceneBoundary>
        <BakeryScene color={{ sage: '#8fb39a', rose: '#d994a1', honey: '#dfb866' }[bakery.color]} placed={bakery.placed} />
      </SceneBoundary> : <ForestScene repaired={Boolean(world?.islands?.forest?.completed?.includes('forest/sprout'))} />}
      <p>阿栗會記得你幫過的忙，還沒做完的也會留下來。</p>
      {!forest.available && <p>森林朋友的故事還在準備中，目前只能看看車站。</p>}
      <div className="world-actions">
        <button className="primary" onClick={onReturn}>回麵包店</button>
        <button onClick={onRest}>今天先休息</button>
      </div>
    </section>
  );
}
