import { useEffect, useRef, useState } from 'react';
import { episodes, rewards, taskGoal, taskAnswer, taskExplanation } from './chapter.js';
import { transition, currentMission, ownedRewards, resultQuantity } from './game.js';
import { freshProgress } from './progress.js';
import { playSound, speak, stopSpeaking, unlockAudio } from '../utils/sound.js';
import BakeryScene from './BakeryScene.jsx';
import Workbench3D, { SceneBoundary } from './Workbench3D.jsx';
import './BakeryChapter.css';

export default function BakeryChapter({ progress, setProgress, saved }) {
  const [page, setPage] = useState('story');
  const [inStory, setInStory] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [countIndex, setCountIndex] = useState(-1);
  const [counting, setCounting] = useState(false);
  const [demo, setDemo] = useState(false);
  const idleReminders = useRef(0);
  const [activity, setActivity] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [freeCount, setFreeCount] = useState(0);
  const [freeItem, setFreeItem] = useState('croissant');
  const timers = useRef([]);
  const pendingCountWait = useRef(null);
  const countingRef = useRef(false);
  const countGeneration = useRef(0);
  const voiceEnabled = useRef(enabled && progress.voice);
  voiceEnabled.current = enabled && progress.voice;
  const heading = useRef();
  const busyRef = useRef(false);
  const answerTouch = useRef(null);
  const answerCards = useRef(null);
  const mission = currentMission(progress);
  const active = progress.active;
  const playing = inStory && mission;
  const task = mission?.task;
  const phase = active?.phase;
  const key = `${page}-${inStory}-${active?.episodeId}-${active?.step}-${phase}`;
  const text = playing ? phase === 'intro' ? mission.episode.intro : phase === 'ending' ? mission.episode.ending : phase === 'success' ? taskExplanation(task) : task.prompt : '我是阿栗！陪我從第一爐麵包開始，把小店變成朋友們喜歡的地方。';
  function dispatch(action) { setProgress(p => transition(p, action)); }
  function say(value) { if (enabled && progress.voice && !counting) speak(value); }
  function activate() { unlockAudio(); setEnabled(true); }
  function clearTimers() {
    countGeneration.current += 1;
    countingRef.current = false;
    pendingCountWait.current?.();
    pendingCountWait.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  function returnHome() { stopSpeaking(); clearTimers(); setCounting(false); setCountIndex(-1); setInStory(false); setPage('story'); setMessage(''); }
  useEffect(() => {
    clearTimers(); setCounting(false); setCountIndex(-1); setMessage(''); setDemo(false); idleReminders.current = 0;
    busyRef.current = false; setBusy(false);
    heading.current?.focus();
    return () => { clearTimers(); stopSpeaking(); };
  }, [key]);
  useEffect(() => {
    const cards = answerCards.current;
    const preventCompatibilityClick = event => {
      if (answerTouch.current) event.preventDefault();
    };
    cards?.addEventListener('touchend', preventCompatibilityClick, { passive: false });
    return () => cards?.removeEventListener('touchend', preventCompatibilityClick);
  }, [key, active?.moved.length, busy, demo]);
  useEffect(() => {
    if (!enabled || !progress.voice) return;
    const timer = setTimeout(() => { if (!countingRef.current) speak(text); }, 200);
    return () => { clearTimeout(timer); stopSpeaking(); };
  }, [text, enabled, progress.voice]);
  useEffect(() => {
    const escape = e => { if (e.key === 'Escape') { e.preventDefault(); if (confirm) setConfirm(null); else returnHome(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [confirm]);
  useEffect(() => {
    if (!playing || phase !== 'play' || demo || busy || counting || idleReminders.current >= 2) return;
    const timer = setTimeout(() => {
      if (document.hidden || window.speechSynthesis?.speaking) return;
      idleReminders.current += 1;
      setMessage(`不急，我陪你。把${task.name}移到${task.destination}，也可以點「看我做」。`);
      if (idleReminders.current === 2) say(`把${task.name}移到${task.destination}。不確定可以看我做。`);
    }, idleReminders.current ? 13000 : 12000);
    return () => clearTimeout(timer);
  }, [key, active?.moved.length, activity, demo, busy, counting, message]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { clearTimers(); stopSpeaking(); setCounting(false); setCountIndex(-1); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => {
    if (!confirm) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="alertdialog"]');
    const buttons = dialog?.querySelectorAll('button');
    buttons?.[0]?.focus();
    const trap = event => {
      if (event.key !== 'Tab' || !buttons?.length) return;
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0].focus(); }
    };
    dialog?.addEventListener('keydown', trap);
    return () => { dialog?.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
  }, [confirm]);
  function start(id) {
    activate();
    if (active && active.episodeId !== id) { setConfirm({ type: 'replace', id }); return; }
    if (!active) dispatch({ type: 'start', id });
    setInStory(true);
  }
  async function count() {
    if (!task || busyRef.current || countingRef.current || demo) return;
    clearTimers(); stopSpeaking(); countingRef.current = true; setCounting(true); setCountIndex(-1);
    const generation = countGeneration.current;
    const current = () => countGeneration.current === generation;
    const wait = () => new Promise(resolve => {
      const finish = () => {
        pendingCountWait.current = null;
        resolve();
      };
      pendingCountWait.current = finish;
      timers.current.push(setTimeout(finish, 650));
    });
    const total = resultQuantity(task, active.moved);
    if (voiceEnabled.current) await speak('我們一起數數看。');
    for (let i = 0; i < total && current(); i++) {
      if (voiceEnabled.current) {
        await speak(String(i + 1), { onStart: () => { if (current()) setCountIndex(i); } });
      } else setCountIndex(i);
      if (!current()) return;
      await wait();
    }
    if (!current()) return;
    countingRef.current = false;
    setCounting(false); setCountIndex(-1); setMessage('數好了，換你選一張數量卡。');
  }
  function answer(value) {
    if (busyRef.current || counting) return;
    if (task.type !== 'fill' && value !== taskAnswer(task)) { dispatch({ type: 'answer', value }); setMessage('沒關係，我們一起數數看。'); count(); return; }
    dispatch({ type: 'answer', value });
    if (progress.voice) playSound('correct');
  }
  const done = task && active.moved.length === taskGoal(task);
  const colors = { sage: '#8fb39a', rose: '#d994a1', honey: '#dfb866' };
  const installSign = page === 'decorate' && ownedRewards(progress).includes('sign') && !progress.placed.includes('sign');
  function installFoxSign() {
    dispatch({ type: 'install', id: 'sign' });
    setMessage('狐狸招牌掛好了！這是我們一起開的小店。');
  }
  return <div className="bakery-shell">
    <header className="bakery-header"><button onClick={returnHome}>回到麵包店</button><strong>阿栗的麵包店</strong><button aria-pressed={progress.voice} onClick={() => { activate(); stopSpeaking(); dispatch({ type: 'voice' }); }}>{progress.voice ? '聲音開啟' : '聲音關閉'}</button></header>
    <div className="bakery-content">
      <div className="page-heading"><div><small>一間小店，五段溫暖的故事</small><h1 ref={heading} tabIndex={-1}>{playing ? mission.episode.title : '陪阿栗，烤一個夢想。'}</h1></div><span>{progress.completed.length} / 5 段回憶</span></div>
      {!saved && <p className="notice" role="status">目前無法永久保存；這次仍然可以玩，關閉頁面可能會失去進度。</p>}
      {playing ? <>
        <div className="dialogue"><strong>阿栗說</strong><p>{text}</p><button disabled={!progress.voice || counting} onClick={() => { activate(); speak(text); }}>再聽一次</button></div>
        {phase === 'play' ? <>
          <h2>{task.title}</h2>
          <Workbench3D key={`${active.episodeId}-${active.step}`} task={task} active={active} itemId={mission.itemId} scene={mission.scene} say={say} busy={busy || counting || demo} demo={demo} countIndex={countIndex} onBusy={value => { busyRef.current = value; setBusy(value); }} onMove={id => { if (!busyRef.current && !counting && !demo) { setActivity(n => n + 1); dispatch({ type: 'move', id }); } }} />
          <div className="controls"><button disabled={busy || counting} onClick={() => { stopSpeaking(); setDemo(v => !v); }}>{demo ? '換我玩' : '看我做'}</button><button disabled={busy || counting || demo || !done} onClick={count}>一起數一數</button><button disabled={busy} onClick={() => say(`先選一個${task.name}，再點${task.destination}。也可以直接拖過去。`)}>再聽操作方法</button></div>
          {done && !busy && !demo && <section className="answer-panel"><h2>{task.type === 'fill' ? '空位都補滿了！' : task.type === 'take' ? `${task.source}還剩幾個？` : `${task.destination}共有幾個？`}</h2>
            {task.type === 'fill' ? <button className="primary" disabled={counting} onClick={() => answer(taskAnswer(task))}>補滿了，看看接下來的故事</button> : <div className="number-cards" ref={answerCards}>{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`答案 ${n}`} disabled={counting} onTouchStart={event => {
                const touch = event.touches[0];
                answerTouch.current = event.touches.length === 1 ? { id: touch.identifier, value: n, x: touch.clientX, y: touch.clientY } : null;
              }} onTouchMove={event => {
                const start = answerTouch.current;
                const touch = Array.from(event.touches).find(value => value.identifier === start?.id);
                if (!touch || event.touches.length !== 1 || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 8) answerTouch.current = null;
              }} onTouchCancel={() => { answerTouch.current = null; }} onTouchEnd={event => {
                const start = answerTouch.current;
                answerTouch.current = null;
                const touch = Array.from(event.changedTouches).find(value => value.identifier === start?.id);
                if (!start || !touch || start.value !== n || event.touches.length || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 8) return;
                const rect = event.currentTarget.getBoundingClientRect();
                if (touch.clientX < rect.left || touch.clientX > rect.right || touch.clientY < rect.top || touch.clientY > rect.bottom) return;
                answer(n);
              }} onClick={() => answer(n)}><strong>{n}</strong><span aria-hidden="true">{Array.from({ length: n }, (_, i) => <i key={i} />)}</span></button>)}</div>}
          </section>}
        </> : phase === 'intro' ? <><SceneBoundary><BakeryScene color={colors[progress.color]} placed={progress.placed} /></SceneBoundary><button className="primary" onClick={() => dispatch({ type: 'play' })}>我來幫忙</button></> : phase === 'success' ? <section className="success"><h2>你做到了！</h2><p className="equation">{task.initial} {task.type === 'take' ? '−' : '＋'} {taskGoal(task)} ＝ {taskAnswer(task)}</p><p>{taskExplanation(task)}</p><button className="primary" onClick={() => dispatch({ type: 'next' })}>{active.step === 0 ? '接著幫下一個忙' : '看看故事結尾'}</button></section> : <section className="success"><h2>謝謝你，小小麵包師！</h2><p>朋友送你「{rewards.find(r => r.id === mission.episode.reward)?.name}」。</p><button className="primary" onClick={() => { dispatch({ type: 'claim' }); setInStory(false); setPage('decorate'); setMessage('禮物已收到，點一下就能擺放。'); }}>收下禮物，回到麵包店</button></section>}
      </> : <>
        <nav className="activity-tabs" aria-label="麵包店活動">{[['story', '故事冒險'], ['decorate', '布置小店'], ['free', '自由烘焙'], ['settings', '家長設定']].map(([id, label]) => <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => { activate(); stopSpeaking(); setPage(id); setFreeCount(0); }}>{label}</button>)}</nav>
        {page !== 'settings' && <SceneBoundary><BakeryScene key={installSign ? 'install-sign' : 'overview'} installSign={installSign} onInstallSign={installFoxSign} color={colors[progress.color]} placed={progress.placed} freeCount={page === 'free' ? freeCount : null} freeItem={freeItem} /></SceneBoundary>}
        {installSign && <section className="success" aria-label="安裝狐狸招牌"><h2>把狐狸招牌掛起來</h2><p>把前面的招牌拖到店門上方，也可以點招牌，再點綠色掛牌位置。</p><button className="primary" onClick={installFoxSign}>把狐狸招牌掛在店門上方</button></section>}
        {page === 'story' && <><div className="welcome"><p>從第一爐麵包到星光慶典，把點心合起來、分享出去，讓小店慢慢熱鬧起來。</p>{active ? <button className="primary" onClick={() => start(active.episodeId)}>繼續上次的小幫忙</button> : progress.completed.length < 5 ? <button className="primary" onClick={() => start(episodes[progress.completed.length].id)}>和阿栗一起開始</button> : <h2>我們的店，開張了！</h2>}<small>沒有倒數、不扣分，隨時都能休息。</small></div>
          <div className="episode-list">{episodes.map((ep, i) => <button key={ep.id} disabled={i > progress.completed.length} onClick={() => start(ep.id)}><small>第 {i + 1} 段 · {ep.place}</small><strong>{ep.title}</strong><span>{i > progress.completed.length ? '完成前面的故事後開啟' : progress.completed.includes(ep.id) ? '再玩一次' : '故事準備好了'}</span></button>)}</div></>}
        {page === 'decorate' && <><h2>我的店，我來布置</h2><div className="controls">{[['sage', '薄荷綠'], ['rose', '草莓粉'], ['honey', '蜂蜜黃']].map(([value, label]) => <button key={value} aria-pressed={progress.color === value} style={{ background: colors[value] }} onClick={() => dispatch({ type: 'color', value })}>{label}</button>)}</div><div className="episode-list">{rewards.map(r => <button key={r.id} disabled={!ownedRewards(progress).includes(r.id)} aria-pressed={progress.placed.includes(r.id)} onClick={() => dispatch({ type: 'place', id: r.id })}><strong>{r.name}</strong><span>{!ownedRewards(progress).includes(r.id) ? '完成故事後收到' : progress.placed.includes(r.id) ? '已擺放，點一下收起' : `放在${r.location}`}</span></button>)}</div></>}
        {page === 'free' && <><h2>今天想烤什麼？</h2><div className="controls">{[['croissant', '可頌'], ['toast', '吐司'], ['cupcake', '杯子蛋糕']].map(([id, label]) => <button key={id} aria-pressed={freeItem === id} onClick={() => setFreeItem(id)}>{label}</button>)}</div><p className="equation" aria-live="polite">現在有 {freeCount} 個</p><div className="controls"><button disabled={!freeCount} onClick={() => { setFreeCount(n => n - 1); say(`送出一個，現在有${freeCount - 1}個。`); }}>送出一個</button><button className="primary" disabled={freeCount === 5} onClick={() => { setFreeCount(n => n + 1); say(`加進一個，現在有${freeCount + 1}個。`); }}>烤一個</button></div></>}
        {page === 'settings' && <section><h2>家長設定</h2><p>進度僅儲存在目前瀏覽器，不需要帳號。語音品質依裝置而定。</p><button onClick={() => setConfirm({ type: 'reset' })}>重新開始所有故事</button></section>}
      </>}
      <p className="status" role="status">{message}</p><footer>{saved ? '進度已保存在這個瀏覽器' : '進度暫存在記憶體'}</footer>
      {confirm && <section className="confirmation" role="alertdialog" aria-modal="true" aria-label="確認變更"><h2>{confirm.type === 'reset' ? '確定清除麵包店進度？' : '要放下目前的小幫忙，改玩另一段故事嗎？'}</h2><p>{confirm.type === 'reset' ? '故事、裝飾和設定都會重設。' : '已獲得的禮物會保留，目前任務需重新開始。'}</p><div className="controls"><button autoFocus onClick={() => setConfirm(null)}>保留，回去玩</button><button onClick={() => { if (confirm.type === 'reset') { setProgress(freshProgress()); returnHome(); } else { setProgress(p => transition(transition(p, { type: 'abandon' }), { type: 'start', id: confirm.id })); setInStory(true); } setConfirm(null); }}>確定</button></div></section>}
    </div>
  </div>;
}
