import { Component, useEffect, useState } from 'react';
import IslandScene from './components/IslandScene.jsx';
import MathGameModal from './components/MathGameModal.jsx';
import { islandsData } from './data/islandsData.js';
import { playSound, stopSpeaking } from './utils/sound.js';
import './App.css';

const STORAGE_KEY = 'magic-math-islands-progress-v1';
function loadProgress() {
  try {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => islandsData.some((island) => island.id === id)))] : [];
  } catch { return []; }
}
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-fallback">🌈 點選下方的島嶼，開始數學冒險！</div> : this.props.children;
  }
}
export default function App() {
  const [selectedIsland, setSelectedIsland] = useState(null);
  const [completedIds, setCompletedIds] = useState(loadProgress);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds)); } catch { /* Progress still works in memory. */ }
  }, [completedIds]);
  useEffect(() => () => stopSpeaking(), []);
  function selectIsland(island) { playSound(); setSelectedIsland(island); }
  function completeIsland(id) { setCompletedIds((ids) => ids.includes(id) ? ids : [...ids, id]); }
  return <>
    <main className="app-shell" inert={selectedIsland ? true : undefined}>
      <header className="site-header">
        <a className="brand" href="#" aria-label="魔法數學浮空島首頁"><span className="brand-icon">✦</span><span>MAGIC MATH<span className="brand-subtitle">小小探險家，大大想像力</span></span></a>
        <div className="progress-pill" aria-label={`已收集 ${completedIds.length} 顆星，共 5 顆`}>⭐ <strong>{completedIds.length}</strong><span>/ 5 顆魔法星</span></div>
      </header>
      <section className="intro"><div className="eyebrow">☁ 歡迎來到你的天空遊樂園</div>
        <h1>魔法數學<span>浮空島</span><i>✧</i></h1>
        <p>點一座小島，和數學一起玩！</p>
      </section>
      <section className="world" aria-label="可以旋轉的三維浮空島地圖">
        <SceneBoundary><IslandScene completedIds={completedIds} onSelect={selectIsland} paused={!!selectedIsland} /></SceneBoundary>
        <div className="map-hint">👆 點小島開始 · 拖曳看看世界</div>
      </section>
      <section className="adventure-panel" aria-labelledby="adventure-title">
        <div className="panel-heading"><h2 id="adventure-title">今天，想去哪裡玩？</h2><span>{completedIds.length === 5 ? '🏆 全部完成！也可以再玩一次' : '每座小島，都有一個小驚喜'}</span></div>
        <nav className="island-menu" aria-label="選擇數學小島">{islandsData.map((island) =>
          <button key={island.id} style={{ '--island-color': island.color }} onClick={() => selectIsland(island)}>
            <span className="menu-emoji">{island.emoji}</span><span className="menu-name">{island.name}</span><span className="menu-status">{completedIds.includes(island.id) ? '⭐ 已收集星星' : '出發探險 →'}</span>
          </button>)}</nav>
      </section>
      <footer>為 4–6 歲的小小探險家設計 <span>✦</span> 慢慢想，開心玩</footer>
    </main>
    {selectedIsland && <MathGameModal key={selectedIsland.id} island={selectedIsland} onClose={() => { stopSpeaking(); playSound(); setSelectedIsland(null); }} onComplete={completeIsland} />}
  </>;
}
