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
import Workbench from "./GuidedWorkbench.jsx";
import FoxBuddy, { Celebration, useVoiceActivity } from "./FoxBuddy.jsx";

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
            <FoxBuddy size="small" mood="welcome" />
            <small>歡迎光臨</small>
          </div>
        </div>
      </div>
      {progress.placed.includes("flowers") && (
        <div className="bk-shop-flower bk-decor-reveal">🌷🪴</div>
      )}
      {progress.placed.includes("table") && (
        <div className="bk-shop-table bk-decor-reveal">
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

function FreeBake({ say, chime }) {
  const [count, setCount] = useState(0);
  const [item, setItem] = useState("🥐");
  function change(delta) {
    const next = count + delta;
    if (next < 0 || next > 5) return;
    setCount(next);
    chime();
    say(
      `${delta > 0 ? "加進" : "拿走"}一個，現在有${next}個。${next === 5 ? "烤盤滿了，可以點減號送一個給朋友。" : ""}`,
    );
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
          <span className="bk-new-bake" key={`${item}-${i}`}>
            {item}
          </span>
        ))}
        {!count && <small>你的烤盤準備好了</small>}
      </div>
      <p className="bk-free-count" aria-live="polite">
        現在有{" "}
        <strong key={count} className="bk-count-change">
          {count}
        </strong>{" "}
        個
      </p>
      <div className="bk-help-row">
        <button
          className={`bk-secondary ${count === 5 ? "bk-guided" : ""}`}
          disabled={count === 0}
          onClick={() => change(-1)}
        >
          − 送出一個
        </button>
        <button
          className={`bk-primary ${count < 5 ? "bk-guided" : ""}`}
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
  const speaking = useVoiceActivity();
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
  const navInstruction = episode
    ? phase === "intro"
      ? "聽完故事，點下面亮亮的綠色按鈕，我們一起幫忙。"
      : phase === "success"
        ? "你做到了！點綠色箭頭，繼續看看。"
        : phase === "ending"
          ? "點綠色禮物按鈕，收下禮物。"
          : ""
    : justEarned
      ? "禮物放好囉！點綠色小房子，看看我們的店。"
      : tab === "story"
        ? unlocked === 5
          ? "麵包店開張了！點小房子可以布置，點可頌可以自由烘焙。"
          : "我是阿栗！點亮亮的綠色按鈕，我帶你一起玩。聽不清楚時，可以點小狐狸。"
        : tab === "decorate"
          ? "點顏色換遮陽棚，點禮物可以擺放。玩好了，點綠色書本回故事。"
          : "點綠色加號，烤一個點心。點減號，就能送出一個。";
  const currentKey = `${active?.episodeId}-${active?.step}-${phase}-${tab}-${showHub}`;
  const completeLock = useRef(false);
  function say(text) {
    if (progress.voice) speak(text);
  }
  function chime(kind) {
    if (progress.voice) playSound(kind);
  }
  useEffect(() => {
    function escapeFromBody(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      stopSpeaking();
      onClose();
    }
    document.addEventListener("keydown", escapeFromBody);
    return () => document.removeEventListener("keydown", escapeFromBody);
  }, [onClose]);
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
    dialog.current?.scrollTo({ top: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() => {
      if (phase === "play") {
        dialog.current
          ?.querySelector(".bk-answer-panel")
          ?.scrollIntoView({ block: "nearest", behavior: "instant" });
      } else
        dialog.current
          ?.querySelector(".bk-guided:not(:disabled)")
          ?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentKey]);
  useEffect(() => {
    completeLock.current = false;
    focusTarget.current?.focus();
    const timer = setTimeout(() => {
      if (progress.voice && phase !== "play")
        speak(`${prompt} ${navInstruction}`);
    }, 150);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [currentKey, prompt, progress.voice, navInstruction, phase]);
  function update(patch) {
    setProgress((p) =>
      p.active ? { ...p, active: { ...p.active, ...patch } } : p,
    );
  }
  function start(ep) {
    chime();
    if (progress.voice) speak(ep.intro);
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
      data-phase={episode ? phase : "hub"}
      data-reward={!!justEarned}
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
                <FoxBuddy
                  speaking={speaking}
                  mood={
                    phase === "success" || phase === "ending"
                      ? "happy"
                      : "welcome"
                  }
                />
              </span>
              <div>
                <strong>阿栗說</strong>
                <p>{prompt}</p>
              </div>
              <button
                aria-label="再聽一次故事"
                disabled={!progress.voice}
                onClick={() => say(`${prompt} ${navInstruction}`)}
              >
                🔊
              </button>
            </div>
            {phase === "intro" && (
              <div className="bk-story-start">
                <Shop progress={progress} />
                <button
                  className="bk-primary bk-guided"
                  onClick={() => {
                    chime();
                    update({ phase: "play" });
                  }}
                >
                  我來幫忙！→
                </button>
                <p>按住點心拖到盤子，或點一下點心再點盤子。</p>
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
                  voice={progress.voice}
                />
              </>
            )}
            {phase === "success" && (
              <section className="bk-success">
                <Celebration />
                <div className="bk-big-star" aria-hidden="true">
                  <FoxBuddy size="large" mood="happy" />
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
                <button className="bk-primary bk-guided" onClick={next}>
                  {active.step + 1 < episode.tasks.length
                    ? "接著幫下一個忙 →"
                    : "看看故事結尾 →"}
                </button>
              </section>
            )}
            {phase === "ending" && (
              <section className="bk-ending">
                <Celebration />
                <span className="bk-reward-large">
                  {rewards.find((r) => r.id === episode.reward).emoji}
                </span>
                <h2>謝謝你，小小麵包師！</h2>
                <p>
                  得到「{rewards.find((r) => r.id === episode.reward).name}
                  」，放進我們的店。
                </p>
                <button className="bk-primary bk-guided" onClick={claim}>
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
            {justEarned && (
              <div className="bk-gift-next">
                <button
                  className="bk-primary bk-guided"
                  onClick={() => {
                    stopSpeaking();
                    setTab("decorate");
                    setJustEarned(null);
                  }}
                >
                  🏡 看看我的禮物 →
                </button>
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
                        className="bk-primary bk-guided"
                        onClick={() => setShowHub(false)}
                      >
                        接著完成上次的小幫忙 →
                      </button>
                    ) : (
                      unlocked < 5 && (
                        <button
                          className="bk-primary bk-guided"
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
            {tab === "decorate" && (
              <div className="bk-gift-next">
                <button
                  className="bk-primary bk-guided"
                  onClick={() => setTab("story")}
                >
                  📖 回到故事冒險 →
                </button>
              </div>
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
