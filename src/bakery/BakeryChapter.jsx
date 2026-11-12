import { useEffect, useRef, useState } from "react";
import {
  episodes,
  rewards,
  taskGoal,
  taskAnswer,
  taskExplanation,
} from "./chapter.js";
import { playSound, speak, stopSpeaking } from "../utils/sound.js";
import "./BakeryChapter.css";

function Shop({ progress }) {
  return (
    <div
      className={`bk-shop-scene theme-${progress.color}`}
      aria-label={`阿栗的麵包店，已擺放${progress.placed.length}件裝飾`}
    >
      <span className="bk-cloud cloud-one">☁</span>
      <span className="bk-cloud cloud-two">☁</span>
      <div className="bk-shop">
        <div className="bk-roof" />
        <div className="bk-shop-sign">
          {progress.placed.includes("sign")
            ? "🦊 阿栗的麵包店"
            : "一家小小麵包店"}
        </div>
        <div className="bk-awning" />
        {progress.placed.includes("flags") && (
          <div className="bk-flags">▾ ▾ ▾ ▾ ▾</div>
        )}
        <div className="bk-shop-front">
          <div className="bk-window">
            🥖 🥐<span>{progress.placed.includes("lamp") ? "⭐" : "🍞"}</span>
          </div>
          <div className="bk-door">
            🦊<small>歡迎光臨</small>
          </div>
        </div>
      </div>
      {progress.placed.includes("flowers") && (
        <div className="bk-shop-flower">🌷🪴</div>
      )}
      {progress.placed.includes("table") && (
        <div className="bk-shop-table">
          ☕<span>━</span>
          <small>╱ ╲</small>
        </div>
      )}
      <div className="bk-garden" />
      <span className="bk-scene-caption">
        {progress.completed.length === 5
          ? "我們一起開張了！"
          : progress.completed.length
            ? "你的每一次幫忙，都讓這裡更溫暖"
            : "故事從一爐麵包開始"}
      </span>
    </div>
  );
}

function ObjectToken({ item, label, onClick, selected, glow, ...props }) {
  return (
    <button
      className={`bk-token ${selected ? "selected" : ""} ${glow ? "glowing" : ""}`}
      aria-label={label}
      aria-pressed={selected || false}
      onClick={onClick}
      {...props}
    >
      {item}
    </button>
  );
}

function Workbench({ task, active, update, finish, say, chime }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(0);
  const done = active.moved.length === taskGoal(task);
  const remaining = task.initial - active.moved.length;
  const sourceCount = task.type === "take" ? task.initial : taskGoal(task);
  const sourceIds = Array.from({ length: sourceCount }, (_, i) => i).filter(
    (id) => !active.moved.includes(id),
  );
  const destCount =
    task.type === "take"
      ? active.moved.length
      : task.initial + active.moved.length;
  const hints = [
    task.type === "take"
      ? `從${task.source}選一個${task.name}，再點${task.destination}，送出${taskGoal(task)}個。`
      : `先點${task.source}裡的一個${task.name}，再點${task.destination}。`,
    task.type === "fill"
      ? `看看虛線空位。每個空位放一個，再補${taskGoal(task) - active.moved.length}個就滿了。`
      : task.type === "take"
        ? `已經送出${active.moved.length}個，還要送${taskGoal(task) - active.moved.length}個。`
        : `一個一個移過去。我們要把${task.change}個都放進去。`,
    done
      ? taskExplanation(task)
      : `一起做：點一下發光的${task.name}，再點右邊的大盤子。`,
  ];
  function transfer(id) {
    setSelected(null);
    if (done || active.moved.includes(id) || !sourceIds.includes(id)) return;
    chime();
    const next = [...active.moved, id];
    update({ moved: next });
    const completedMove = next.length === taskGoal(task);
    const count =
      task.type === "take"
        ? task.initial - next.length
        : task.initial + next.length;
    const text = completedMove
      ? task.type === "fill"
        ? "空位都補好了！"
        : `現在有${count}個。一起選出數量吧！`
      : `移好一個了！${task.type === "take" ? `還剩${count}個。` : `現在有${count}個。`}`;
    setMessage(text);
    say(text);
  }
  function drop(event) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("text/plain");
    if (/^\d+$/.test(raw)) transfer(Number(raw));
  }
  function choose(value) {
    if (value === taskAnswer(task)) finish();
    else {
      setShake((n) => n + 1);
      setMessage("我們一起數一數，再試一次。");
      update({ help: Math.min(3, active.help + 1) });
      say("我們一起數一數，再試一次。");
    }
  }
  function help() {
    const next = Math.min(3, active.help + 1);
    update({ help: next });
    const text = hints[next - 1];
    setMessage(text);
    say(text);
  }
  const count = task.type === "take" ? remaining : destCount;
  return (
    <div className="bk-workbench">
      <div className="bk-transfer-layout">
        <section className="bk-source-zone" aria-label={task.source}>
          <h3>① {task.source}</h3>
          <div className="bk-token-area">
            {sourceIds.map((id, i) => (
              <ObjectToken
                key={id}
                item={task.item}
                label={`選取${task.name} ${id + 1}`}
                selected={selected === id}
                glow={active.help > 0 && i === 0 && !done}
                draggable={!done}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", String(id));
                  setSelected(id);
                }}
                onClick={() => {
                  if (done) {
                    setMessage("已經送夠了，我們看看剩下的數量。");
                    return;
                  }
                  chime();
                  setSelected(id);
                  setMessage(`選好了！再點右邊的${task.destination}。`);
                }}
              />
            ))}
            {sourceIds.length === 0 && (
              <span className="bk-empty">都移好了 ✨</span>
            )}
          </div>
          <span className="bk-zone-note">
            {task.type === "take"
              ? `要送出 ${task.change} 個`
              : "點一個，或拖到右邊"}
          </span>
        </section>
        <span className="bk-transfer-arrow" aria-hidden="true">
          →
        </span>
        <section
          className="bk-destination-zone"
          aria-label={task.destination}
          onDragOver={(e) => e.preventDefault()}
          onDrop={drop}
        >
          <h3>② {task.destination}</h3>
          <button
            className={`bk-drop-area ${selected !== null ? "ready" : ""}`}
            aria-label={`放到${task.destination}`}
            aria-disabled={done}
            onClick={() => {
              if (selected !== null) transfer(selected);
              else if (!done) {
                setMessage("先點左邊的一個點心，再點這裡。");
                say("先點左邊的一個點心，再點這裡。");
              }
            }}
          >
            {task.type === "fill" ? (
              Array.from({ length: task.target }, (_, i) => (
                <span
                  key={i}
                  className={`bk-slot ${i < destCount ? "filled" : ""}`}
                >
                  {i < destCount ? task.item : <small>放這裡</small>}
                </span>
              ))
            ) : (
              <>
                {Array.from({ length: destCount }, (_, i) => (
                  <span className="bk-placed-token" key={i}>
                    {task.item}
                  </span>
                ))}
                {!destCount && <span className="bk-empty">點這裡放進來</span>}
              </>
            )}
          </button>
          <span className="bk-zone-note">
            {task.type === "fill"
              ? `每個空位放一個 · 共 ${task.target} 格`
              : "選好後，點這個大盤子"}
          </span>
        </section>
      </div>
      <p className="bk-action-message" role="status">
        {message || "慢慢來，點心會在這裡等你。"}
      </p>
      {done && (
        <div className="bk-answer-panel">
          <h3>
            {task.type === "take"
              ? "左邊還剩幾個？"
              : task.type === "fill"
                ? "空位都補滿了！"
                : "右邊一共有幾個？"}
          </h3>
          {task.type === "fill" ? (
            <button className="bk-primary" onClick={finish}>
              補滿了！看看發生什麼事 ✨
            </button>
          ) : (
            <div className="bk-number-choices" key={shake}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`答案 ${n}`}
                  onClick={() => choose(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="bk-help-row">
        <button className="bk-secondary" onClick={help}>
          💡 陪我一起做
        </button>
        <button
          className="bk-secondary"
          onClick={() => {
            if (!done) {
              const text = "先把點心移好，再一起數一數。";
              setMessage(text);
              say(text);
              return;
            }
            const text = `${Array.from({ length: count }, (_, i) => i + 1).join("，")}。${task.type === "take" ? "還剩" : "一共有"}${count}個${task.name}。`;
            setMessage(text);
            say(text);
          }}
        >
          👆 一起數一數
        </button>
      </div>
      {active.help > 0 && (
        <div className="bk-hint" role="note">
          {hints[active.help - 1]}
        </div>
      )}
    </div>
  );
}

function FreeBake({ say, chime }) {
  const [count, setCount] = useState(0);
  const [item, setItem] = useState("🥐");
  function change(delta) {
    const next = count + delta;
    if (next < 0 || next > 5) return;
    setCount(next);
    chime();
    say(`${delta > 0 ? "加進" : "拿走"}一個，現在有${next}個。`);
  }
  return (
    <section className="bk-free-bake">
      <div className="bk-section-label">沒有考題，隨心玩</div>
      <h2>今天想烤什麼？</h2>
      <div className="bk-item-picker">
        {["🥐", "🍞", "🧁"].map((emoji) => (
          <button
            key={emoji}
            aria-label={`烘焙${emoji}`}
            aria-pressed={item === emoji}
            onClick={() => setItem(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="bk-free-tray" aria-label={`盤子裡有${count}個點心`}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i}>{item}</span>
        ))}
        {!count && <small>你的烤盤準備好了</small>}
      </div>
      <p className="bk-free-count" aria-live="polite">
        現在有 <strong>{count}</strong> 個
      </p>
      <div className="bk-help-row">
        <button
          className="bk-secondary"
          disabled={count === 0}
          onClick={() => change(-1)}
        >
          − 送出一個
        </button>
        <button
          className="bk-primary"
          disabled={count === 5}
          onClick={() => change(1)}
        >
          ＋ 烤一個
        </button>
      </div>
      <p className="bk-fine-print">
        一盤最多放 5 個。可以拿走、再放回，看看數量怎麼變。
      </p>
    </section>
  );
}

export default function BakeryChapter({
  progress,
  setProgress,
  saved,
  onClose,
}) {
  const [tab, setTab] = useState("story");
  const [showHub, setShowHub] = useState(false);
  const [notice, setNotice] = useState("");
  const [justEarned, setJustEarned] = useState(null);
  const dialog = useRef();
  const focusTarget = useRef();
  const active = progress.active;
  const episode = showHub
    ? null
    : episodes.find((e) => e.id === active?.episodeId);
  const task = episode?.tasks[active.step];
  const unlocked = progress.completed.length;
  const phase = active?.phase;
  const prompt = episode
    ? phase === "intro"
      ? episode.intro
      : phase === "ending"
        ? episode.ending
        : phase === "success"
          ? taskExplanation(task)
          : task.prompt
    : "";
  const currentKey = `${active?.episodeId}-${active?.step}-${phase}-${tab}`;
  const completeLock = useRef(false);
  function say(text) {
    if (progress.voice) speak(text);
  }
  function chime(kind) {
    if (progress.voice) playSound(kind);
  }
  useEffect(() => {
    const old = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      stopSpeaking();
      document.body.style.overflow = overflow;
      old?.focus();
    };
  }, []);
  useEffect(() => {
    completeLock.current = false;
    focusTarget.current?.focus();
    const timer = setTimeout(() => {
      if (progress.voice && prompt) speak(prompt);
    }, 150);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [currentKey, prompt, progress.voice]);
  function update(patch) {
    setProgress((p) =>
      p.active ? { ...p, active: { ...p.active, ...patch } } : p,
    );
  }
  function start(ep) {
    chime();
    setJustEarned(null);
    setShowHub(false);
    setProgress((p) => ({
      ...p,
      active: { episodeId: ep.id, step: 0, phase: "intro", moved: [], help: 0 },
    }));
  }
  function finish() {
    if (completeLock.current || active.moved.length !== taskGoal(task)) return;
    completeLock.current = true;
    chime("correct");
    update({ phase: "success" });
  }
  function next() {
    chime();
    if (active.step + 1 < episode.tasks.length)
      update({ step: active.step + 1, moved: [], help: 0, phase: "play" });
    else update({ phase: "ending" });
  }
  function claim() {
    chime("correct");
    const reward = rewards.find((r) => r.id === episode.reward);
    setJustEarned(reward);
    setProgress((p) => ({
      ...p,
      completed: p.completed.includes(episode.id)
        ? p.completed
        : [...p.completed, episode.id],
      placed: p.placed.includes(episode.reward)
        ? p.placed
        : [...p.placed, episode.reward],
      active: null,
    }));
  }
  function pause() {
    stopSpeaking();
    setTab("story");
    onClose();
  }
  function keyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      pause();
    }
    if (e.key !== "Tab") return;
    const nodes = [
      ...dialog.current.querySelectorAll(
        'button:not(:disabled),[tabindex="0"]',
      ),
    ];
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === focusTarget.current)
    ) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  return (
    <div
      className="bk-overlay"
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bakery-title"
      onKeyDown={keyDown}
    >
      <header className="bk-header">
        <button className="bk-back" onClick={pause}>
          ← 小島地圖
        </button>
        <span className="bk-header-brand">🦊 阿栗的麵包店</span>
        <button
          className="bk-audio"
          aria-pressed={progress.voice}
          onClick={() => {
            stopSpeaking();
            setProgress((p) => ({ ...p, voice: !p.voice }));
          }}
        >
          {progress.voice ? "🔊 聲音開啟" : "🔇 聲音關閉"}
        </button>
      </header>
      <div className="bk-content">
        <div className="bk-page-heading">
          <div>
            <span className="bk-section-label">
              魔法數學浮空島 · 故事第一章
            </span>
            <h1 id="bakery-title" ref={focusTarget} tabIndex={-1}>
              {episode ? episode.title : "一間店，五個小故事。"}
            </h1>
          </div>
          <span className="bk-progress">{unlocked} / 5 段回憶</span>
        </div>
        {!saved && (
          <p className="bk-storage-warning" role="status">
            這個瀏覽器暫時無法保存，這次仍然可以玩。離開頁面後進度可能不會保留。
          </p>
        )}
        {episode ? (
          <>
            <div className="bk-mission-crumb">
              <button
                className="bk-return-shop"
                onClick={() => {
                  stopSpeaking();
                  setShowHub(true);
                }}
              >
                ← 麵包店 · 保存小幫忙
              </button>
              <span>
                {episode.icon} {episode.place}
              </span>
              <span>
                {phase === "intro"
                  ? "故事開始"
                  : phase === "ending"
                    ? "故事小結"
                    : `小幫忙 ${active.step + 1} / ${episode.tasks.length}`}
              </span>
            </div>
            <div className="bk-dialogue">
              <span className="bk-fox" aria-hidden="true">
                🦊
              </span>
              <div>
                <strong>阿栗說</strong>
                <p>{prompt}</p>
              </div>
              <button
                aria-label="再聽一次故事"
                disabled={!progress.voice}
                onClick={() => say(prompt)}
              >
                🔊
              </button>
            </div>
            {phase === "intro" && (
              <div className="bk-story-start">
                <Shop progress={progress} />
                <button
                  className="bk-primary"
                  onClick={() => {
                    chime();
                    update({ phase: "play" });
                  }}
                >
                  我來幫忙！→
                </button>
                <p>點一個點心，再點盤子；也可以直接拖過去。</p>
              </div>
            )}
            {phase === "play" && (
              <>
                <h2 className="bk-task-title">{task.title}</h2>
                <Workbench
                  key={`${episode.id}-${active.step}`}
                  task={task}
                  active={active}
                  update={update}
                  finish={finish}
                  say={say}
                  chime={chime}
                />
              </>
            )}
            {phase === "success" && (
              <section className="bk-success">
                <div className="bk-big-star" aria-hidden="true">
                  🌟
                </div>
                <h2>你做到了！</h2>
                <div className="bk-equation" aria-label={taskExplanation(task)}>
                  <span>{task.initial}</span>
                  <b>{task.type === "take" ? "−" : "＋"}</b>
                  <span>
                    {task.type === "fill" ? taskGoal(task) : task.change}
                  </span>
                  <b>＝</b>
                  <span>{taskAnswer(task)}</span>
                </div>
                <div className="bk-result-objects">
                  {Array.from({ length: taskAnswer(task) }, (_, i) => (
                    <span key={i}>{task.item}</span>
                  ))}
                </div>
                <p>{taskExplanation(task)}</p>
                <button className="bk-primary" onClick={next}>
                  {active.step + 1 < episode.tasks.length
                    ? "接著幫下一個忙 →"
                    : "看看故事結尾 →"}
                </button>
              </section>
            )}
            {phase === "ending" && (
              <section className="bk-ending">
                <span className="bk-reward-large">
                  {rewards.find((r) => r.id === episode.reward).emoji}
                </span>
                <h2>謝謝你，小小麵包師！</h2>
                <p>
                  得到「{rewards.find((r) => r.id === episode.reward).name}
                  」，放進我們的店。
                </p>
                <button className="bk-primary" onClick={claim}>
                  收下禮物，回到麵包店 🎁
                </button>
                <p className="bk-fine-print">
                  這一段故事完成了，可以休息，也可以再逛逛。
                </p>
              </section>
            )}
            <div className="bk-pause-note">
              隨時按「小島地圖」休息。回來會從這裡繼續。
            </div>
          </>
        ) : (
          <>
            <nav className="bk-tabs" aria-label="麵包店活動">
              {[
                ["story", "📖 故事冒險"],
                ["decorate", "🏡 我的麵包店"],
                ["free", "🥐 自由烘焙"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-current={tab === id ? "page" : undefined}
                  onClick={() => {
                    stopSpeaking();
                    setTab(id);
                    setJustEarned(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
            {justEarned && (
              <div className="bk-earned" role="status">
                {justEarned.emoji}「{justEarned.name}」已擺在
                {justEarned.location}！去「我的麵包店」看看。
              </div>
            )}
            {tab === "story" && (
              <>
                <div className="bk-hub-hero">
                  <Shop progress={progress} />
                  <div className="bk-hub-copy">
                    <span className="bk-section-label">慢慢想，開心玩</span>
                    <h2>
                      {unlocked === 5
                        ? "我們的店，開張了！"
                        : "陪阿栗，烤一個夢想。"}
                    </h2>
                    <p>
                      {unlocked === 5
                        ? "朋友都記得你的幫忙。回去重玩故事，或隨心烤一盤點心吧。"
                        : "從第一爐麵包到星光慶典。把點心合起來、分享出去，讓小店一點一點熱鬧起來。"}
                    </p>
                    {active ? (
                      <button
                        className="bk-primary"
                        onClick={() => setShowHub(false)}
                      >
                        接著完成上次的小幫忙 →
                      </button>
                    ) : (
                      unlocked < 5 && (
                        <button
                          className="bk-primary"
                          onClick={() => start(episodes[unlocked])}
                        >
                          {unlocked === 0
                            ? "一起打開麵包店 →"
                            : `繼續故事：${episodes[unlocked].title} →`}
                        </button>
                      )
                    )}
                    <small>沒有倒數、不扣星星，隨時都能休息。</small>
                  </div>
                </div>
                <div className="bk-section-heading">
                  <h2>我們的故事地圖</h2>
                  <span>一段一段，慢慢發生</span>
                </div>
                <div className="bk-episode-list">
                  {episodes.map((ep, i) => (
                    <button
                      key={ep.id}
                      className={`bk-episode-card ${i > unlocked ? "locked" : ""}`}
                      disabled={
                        i > unlocked || (!!active && ep.id !== active.episodeId)
                      }
                      onClick={() =>
                        active?.episodeId === ep.id
                          ? setShowHub(false)
                          : start(ep)
                      }
                    >
                      <span className="bk-episode-icon">
                        {i > unlocked ? "🔒" : ep.icon}
                      </span>
                      <span className="bk-episode-text">
                        <small>
                          第 {i + 1} 段 · {ep.place}
                        </small>
                        <strong>{ep.title}</strong>
                        <span>
                          {i < unlocked
                            ? "完成了 · 再玩一次"
                            : i === unlocked
                              ? active?.episodeId === ep.id
                                ? "繼續上次的小幫忙 →"
                                : "故事準備好了 →"
                              : `完成第 ${i} 段後一起出發`}
                        </span>
                      </span>
                      <span className="bk-episode-check">
                        {i < unlocked ? "✓" : String(i + 1).padStart(2, "0")}
                      </span>
                    </button>
                  ))}
                </div>
                {unlocked === 5 && (
                  <div className="bk-chapter-finale">
                    <span>🌙</span>
                    <h2>今晚的麵包店，特別溫暖。</h2>
                    <p>
                      五段故事都完成了。謝謝你讓朋友們有點心、有地方相聚。今天可以好好休息，下次小店也會在這裡等你。
                    </p>
                    <button
                      className="bk-secondary"
                      onClick={() => setTab("decorate")}
                    >
                      看看我們一起完成的店 →
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "decorate" && (
              <>
                <Shop progress={progress} />
                <div className="bk-section-heading">
                  <h2>我的店，我來布置</h2>
                  <span>自動保存，每次回來都看得到</span>
                </div>
                <div
                  className="bk-colors"
                  role="group"
                  aria-label="選擇遮陽棚顏色"
                >
                  {[
                    ["sage", "薄荷綠"],
                    ["rose", "草莓粉"],
                    ["honey", "蜂蜜黃"],
                  ].map(([color, name]) => (
                    <button
                      key={color}
                      className={`swatch-${color}`}
                      aria-pressed={progress.color === color}
                      onClick={() => {
                        chime();
                        setProgress((p) => ({ ...p, color }));
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="bk-decoration-grid">
                  {rewards.map((r, i) => (
                    <button
                      key={r.id}
                      disabled={i >= unlocked}
                      aria-pressed={progress.placed.includes(r.id)}
                      onClick={() => {
                        chime();
                        setProgress((p) => ({
                          ...p,
                          placed: p.placed.includes(r.id)
                            ? p.placed.filter((id) => id !== r.id)
                            : [...p.placed, r.id],
                        }));
                        setNotice(
                          `${r.name}${progress.placed.includes(r.id) ? "收好了" : `放在${r.location}了`}！`,
                        );
                      }}
                    >
                      <span>{i >= unlocked ? "🔒" : r.emoji}</span>
                      <strong>{r.name}</strong>
                      <small>
                        {i >= unlocked
                          ? `第 ${i + 1} 段故事的禮物`
                          : progress.placed.includes(r.id)
                            ? "✓ 已擺放 · 點一下收起"
                            : `擺放在${r.location}`}
                      </small>
                    </button>
                  ))}
                </div>
                <p className="bk-action-message" role="status">
                  {notice || "點禮物擺放或收起；每件禮物都有自己的位置。"}
                </p>
              </>
            )}
            {tab === "free" && <FreeBake say={say} chime={chime} />}
            <div className="bk-hub-footer">
              <span>
                {saved ? "✓ 冒險進度已存在這個瀏覽器" : "本次進度暫存在記憶體"}
              </span>
              <button className="bk-secondary" onClick={pause}>
                今天先休息 ☁
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
