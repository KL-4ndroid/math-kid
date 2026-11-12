import { useEffect, useRef, useState } from 'react';
import { generateQuestion } from '../data/islandsData.js';
import { playSound, speak, stopSpeaking } from '../utils/sound.js';

function Items({ emoji, count }) {
  return <span className="items">{Array.from({ length: count }, (_, i) => <span key={i}>{emoji}</span>)}</span>;
}
export default function MathGameModal({ island, onClose, onComplete }) {
  const [question] = useState(() => generateQuestion(island.mode));
  const [correct, setCorrect] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const root = useRef(), back = useRef(), continueButton = useRef();
  const solved = useRef(false), timer = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    back.current.focus();
    const voiceTimer = setTimeout(() => speak(question.text), 180);
    return () => {
      clearTimeout(voiceTimer);
      clearTimeout(timer.current);
      stopSpeaking();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [question]);
  useEffect(() => { if (correct) continueButton.current?.focus(); }, [correct]);
  function handleKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key !== 'Tab') return;
    const buttons = [...root.current.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function answer(value) {
    if (solved.current) return;
    clearTimeout(timer.current);
    setWrong(null);
    if (value === question.answer) {
      solved.current = true;
      setCorrect(true);
      playSound('correct');
      speak('太棒了！答對了！');
      onComplete(island.id);
    } else {
      playSound();
      setWrong(value);
      setAttempt((n) => n + 1);
      speak('再試一次喔！');
      timer.current = setTimeout(() => setWrong(null), 650);
    }
  }
  return <div className="modal-backdrop">
    <section ref={root} className="game-modal" role="dialog" aria-modal="true" aria-labelledby="game-title" onKeyDown={handleKeys}>
      <div className="game-toolbar">
        <button ref={back} className="soft-button" onClick={onClose}>⬅️ 返回地圖</button>
        <button className="soft-button" onClick={() => { playSound(); speak(question.text); }}>🔊 聽題目</button>
      </div>
      <div className="game-heading"><span>{island.emoji} {island.name}</span><span>小小挑戰</span></div>
      <h2 id="game-title">{question.text}</h2>
      {question.mode === 'counting' && <div className="question-visual"><Items emoji={question.emoji} count={question.count} /></div>}
      {question.mode === 'shapes' && <div className="question-visual target-shape" aria-label={question.names[question.answer]}>{question.answer}</div>}
      {question.mode === 'addition' && <div className="question-visual equation">
        <Items emoji={question.emoji} count={question.a} /><b>＋</b><Items emoji={question.emoji} count={question.b} /><b>＝ ?</b>
      </div>}
      {question.mode === 'patterns' && <div className="question-visual sequence">
        {question.sequence.map((item, i) => <span key={i}>{item}</span>)}<span className="missing">?</span>
      </div>}
      <div className={`answers ${question.mode === 'comparison' ? 'comparison' : ''}`}>
        {question.options.map((value, i) => <button key={`${String(value)}-${wrong === value ? attempt : 0}`}
          className={`answer answer-${i} ${wrong === value ? 'shake' : ''} ${correct && value === question.answer ? 'chosen' : ''}`}
          disabled={correct} onClick={() => answer(value)}
          aria-label={question.mode === 'comparison' ? `${value === 0 ? '左邊' : '右邊'}的點心` : question.names?.[value] || String(value)}>
          {question.mode === 'comparison' ? <Items emoji={question.emoji} count={question.counts[value]} /> : value}
        </button>)}
      </div>
      <div className="feedback" role="status" aria-live="polite">
        {correct ? '🌟 太棒了！你得到一顆魔法星星！' : wrong !== null ? '💛 再試一次喔！' : '用小手點一點，選出你的答案'}
      </div>
      {correct && <>
        <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) =>
          <span key={i} style={{ '--x': `${(i * 37) % 100}%`, '--delay': `${(i % 6) * 0.08}s`, '--turn': `${i * 43}deg` }}>{i % 2 ? '★' : '●'}</span>)}</div>
        <button ref={continueButton} className="continue-button" onClick={onClose}>繼續冒險 ✨</button>
      </>}
    </section>
  </div>;
}
