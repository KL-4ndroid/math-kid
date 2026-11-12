import { useEffect, useRef, useState } from "react";
import {
  episodes,
  rewards,
  taskGoal,
  taskAnswer,
  taskExplanation,
} from "./chapter.js";
import {
  transition,
  currentMission,
  ownedRewards,
  resultQuantity,
} from "./game.js";
import { freshProgress } from "./progress.js";
import { playSound, speak, stopSpeaking, unlockAudio } from "../utils/sound.js";
import BakeryScene from "./BakeryScene.jsx";
import Workbench3D, { SceneBoundary } from "./Workbench3D.jsx";
import "./BakeryChapter.css";
import UiIcon from "./UiIcon.jsx";
import { taskObjective } from "./guidance.js";

export default function BakeryChapter({ progress, setProgress, saved }) {
  const [page, setPage] = useState("story");
  const [inStory, setInStory] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [countIndex, setCountIndex] = useState(-1);
  const [counting, setCounting] = useState(false);
  const [demo, setDemo] = useState(false);
  const idleReminders = useRef(0);
  const [activity, setActivity] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [freeCount, setFreeCount] = useState(0);
  const [freeItem, setFreeItem] = useState("croissant");
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
  const text = playing
    ? phase === "intro"
      ? mission.episode.intro
      : phase === "ending"
        ? mission.episode.ending
        : phase === "success"
          ? taskExplanation(task)
          : task.prompt
    : "我是阿栗！陪我從第一爐麵包開始，把小店變成朋友們喜歡的地方。";
  function dispatch(action) {
    setProgress((p) => transition(p, action));
  }
  function say(value) {
    if (enabled && progress.voice && !counting) speak(value);
  }
  function activate() {
    unlockAudio();
    setEnabled(true);
  }
  function clearTimers() {
    countGeneration.current += 1;
    countingRef.current = false;
    pendingCountWait.current?.();
    pendingCountWait.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  function returnHome() {
    stopSpeaking();
    clearTimers();
    setCounting(false);
    setCountIndex(-1);
    setInStory(false);
    setPage("story");
    setMessage("");
  }
  useEffect(() => {
    clearTimers();
    setCounting(false);
    setCountIndex(-1);
    setMessage("");
    setDemo(false);
    idleReminders.current = 0;
    busyRef.current = false;
    setBusy(false);
    heading.current?.focus();
    return () => {
      clearTimers();
      stopSpeaking();
    };
  }, [key]);
  useEffect(() => {
    const cards = answerCards.current;
    const preventCompatibilityClick = (event) => {
      if (answerTouch.current) event.preventDefault();
    };
    cards?.addEventListener("touchend", preventCompatibilityClick, {
      passive: false,
    });
    return () =>
      cards?.removeEventListener("touchend", preventCompatibilityClick);
  }, [key, active?.moved.length, busy, demo]);
  useEffect(() => {
    if (!enabled || !progress.voice) return;
    const timer = setTimeout(() => {
      if (!countingRef.current) speak(text);
    }, 200);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [text, enabled, progress.voice]);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (confirm) setConfirm(null);
        else returnHome();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [confirm]);
  useEffect(() => {
    if (
      !playing ||
      phase !== "play" ||
      demo ||
      busy ||
      counting ||
      idleReminders.current >= 2
    )
      return;
    const timer = setTimeout(
      () => {
        if (document.hidden || window.speechSynthesis?.speaking) return;
        idleReminders.current += 1;
        setMessage(
          `不急，我陪你。把${task.name}移到${task.destination}，也可以點「看我做」。`,
        );
        if (idleReminders.current === 2)
          say(`把${task.name}移到${task.destination}。不確定可以看我做。`);
      },
      idleReminders.current ? 13000 : 12000,
    );
    return () => clearTimeout(timer);
  }, [key, active?.moved.length, activity, demo, busy, counting, message]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        clearTimers();
        stopSpeaking();
        setCounting(false);
        setCountIndex(-1);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  useEffect(() => {
    if (!confirm) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="alertdialog"]');
    const buttons = dialog?.querySelectorAll("button");
    buttons?.[0]?.focus();
    const trap = (event) => {
      if (event.key !== "Tab" || !buttons?.length) return;
      if (event.shiftKey && document.activeElement === buttons[0]) {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === buttons[buttons.length - 1]
      ) {
        event.preventDefault();
        buttons[0].focus();
      }
    };
    dialog?.addEventListener("keydown", trap);
    return () => {
      dialog?.removeEventListener("keydown", trap);
      if (previous?.isConnected) previous.focus();
    };
  }, [confirm]);
  function start(id) {
    activate();
    if (active && active.episodeId !== id) {
      setConfirm({ type: "replace", id });
      return;
    }
    if (!active) dispatch({ type: "start", id });
    setInStory(true);
  }
  async function count() {
    if (!task || busyRef.current || countingRef.current || demo) return;
    clearTimers();
    stopSpeaking();
    countingRef.current = true;
    setCounting(true);
    setCountIndex(-1);
    const generation = countGeneration.current;
    const current = () => countGeneration.current === generation;
    const wait = () =>
      new Promise((resolve) => {
        const finish = () => {
          pendingCountWait.current = null;
          resolve();
        };
        pendingCountWait.current = finish;
        timers.current.push(setTimeout(finish, 650));
      });
    const total = resultQuantity(task, active.moved);
    if (voiceEnabled.current) await speak("我們一起數數看。");
    for (let i = 0; i < total && current(); i++) {
      if (voiceEnabled.current) {
        await speak(String(i + 1), {
          onStart: () => {
            if (current()) setCountIndex(i);
          },
        });
      } else setCountIndex(i);
      if (!current()) return;
      await wait();
    }
    if (!current()) return;
    countingRef.current = false;
    setCounting(false);
    setCountIndex(-1);
    setMessage("數好了，換你選一張數量卡。");
  }
  function answer(value) {
    if (busyRef.current || counting) return;
    if (task.type !== "fill" && value !== taskAnswer(task)) {
      dispatch({ type: "answer", value });
      setMessage("沒關係，我們一起數數看。");
      count();
      return;
    }
    dispatch({ type: "answer", value });
    if (progress.voice) playSound("correct");
  }
  const done = task && active.moved.length === taskGoal(task);
  const colors = { sage: "#8fb39a", rose: "#d994a1", honey: "#dfb866" };
  const installSign =
    page === "decorate" &&
    ownedRewards(progress).includes("sign") &&
    !progress.placed.includes("sign");
  function installFoxSign() {
    dispatch({ type: "install", id: "sign" });
    setMessage("狐狸招牌掛好了！這是我們一起開的小店。");
  }
  const nextEpisode = active
    ? episodes.find((ep) => ep.id === active.episodeId)
    : episodes[progress.completed.length];
  const homeTitle = playing
    ? phase === "play"
      ? task.title
      : mission.episode.title
    : page === "free"
      ? "一起烤點心"
      : page === "decorate"
        ? "我們的小店"
        : page === "settings"
          ? "家長設定"
          : "阿栗在等你！";
  function changePage(id) {
    activate();
    stopSpeaking();
    setPage(id);
    setFreeCount(0);
  }
  const replayControl = (
    <button
      className="listen-button"
      aria-label="再聽一次"
      disabled={!progress.voice || counting}
      onClick={() => {
        activate();
        speak(text);
      }}
    >
      <UiIcon name="sound" />
      <span>聽一聽</span>
    </button>
  );
  return (
    <div
      className={`bakery-shell ${playing ? "is-playing" : "is-home"} phase-${playing ? phase : page}`}
    >
      <div className="game-surface" inert={confirm ? true : undefined}>
        <header className="bakery-header">
          <button
            className="utility-button"
            aria-label="回到麵包店"
            onClick={returnHome}
          >
            <UiIcon name="home" />
            <span>小店</span>
          </button>
          <strong>阿栗的麵包店</strong>
          <button
            className="utility-button"
            aria-label={progress.voice ? "聲音開啟" : "聲音關閉"}
            aria-pressed={progress.voice}
            onClick={() => {
              activate();
              stopSpeaking();
              dispatch({ type: "voice" });
            }}
          >
            <UiIcon name={progress.voice ? "sound" : "mute"} />
            <span>{progress.voice ? "聲音" : "靜音"}</span>
          </button>
        </header>
        <div className="bakery-content">
          <div className="page-heading">
            <h1 ref={heading} tabIndex={-1}>
              {homeTitle}
            </h1>
            {playing ? (
              <div
                className="story-steps"
                aria-label={`這段故事的第 ${active.step + 1} 個小幫忙，共 2 個`}
              >
                {[0, 1].map((i) => (
                  <span key={i} className={i <= active.step ? "filled" : ""} />
                ))}
              </div>
            ) : (
              <div
                className="story-steps"
                aria-label={`已完成 ${progress.completed.length} 段故事，共 5 段`}
              >
                {episodes.map((ep, i) => (
                  <span
                    key={ep.id}
                    className={i < progress.completed.length ? "filled" : ""}
                  />
                ))}
              </div>
            )}
          </div>
          {!saved && (
            <p className="notice" role="status">
              目前無法永久保存；這次仍然可以玩，關閉頁面可能會失去進度。
            </p>
          )}
          {playing ? (
            <>
              {(phase === "play" || phase === "intro") && (
                <div className="dialogue">
                  <div className="dialogue-copy">
                    <strong>阿栗說</strong>
                    <p>{phase === "play" ? taskObjective(task) : text}</p>
                  </div>
                  {replayControl}
                </div>
              )}
              {phase === "play" ? (
                <div className="task-stage">
                  <div className="table-area">
                    <Workbench3D
                      key={`${active.episodeId}-${active.step}`}
                      task={task}
                      active={active}
                      itemId={mission.itemId}
                      scene={mission.scene}
                      say={say}
                      busy={busy || counting || demo}
                      demo={demo}
                      countIndex={countIndex}
                      onBusy={(value) => {
                        busyRef.current = value;
                        setBusy(value);
                      }}
                      onMove={(id) => {
                        if (!busyRef.current && !counting && !demo) {
                          setActivity((n) => n + 1);
                          dispatch({ type: "move", id });
                        }
                      }}
                    />
                  </div>
                  <div className="task-console">
                    <div className="task-actions">
                      <button
                        className={demo ? "primary" : "help-button"}
                        disabled={busy || counting}
                        onClick={() => {
                          stopSpeaking();
                          setDemo((v) => !v);
                        }}
                      >
                        <UiIcon name={demo ? "hand" : "play"} />
                        {demo ? "換我玩" : "看我做"}
                      </button>
                      <button
                        className="help-button"
                        disabled={busy || counting || demo || !done}
                        onClick={count}
                      >
                        <UiIcon name="count" />
                        一起數一數
                      </button>
                    </div>
                    {done && !busy && !demo && (
                      <section className="answer-panel">
                        <h2>
                          {task.type === "fill"
                            ? "空位都補滿了！"
                            : task.type === "take"
                              ? `${task.source}還剩幾個？`
                              : `${task.destination}共有幾個？`}
                        </h2>
                        {task.type === "fill" ? (
                          <button
                            className="primary next-button"
                            disabled={counting}
                            aria-label="補滿了，看看接下來的故事"
                            onClick={() => answer(taskAnswer(task))}
                          >
                            放好了
                            <UiIcon name="check" />
                          </button>
                        ) : (
                          <div className="number-cards" ref={answerCards}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                aria-label={`答案 ${n}`}
                                disabled={counting}
                                onTouchStart={(event) => {
                                  const touch = event.touches[0];
                                  answerTouch.current =
                                    event.touches.length === 1
                                      ? {
                                          id: touch.identifier,
                                          value: n,
                                          x: touch.clientX,
                                          y: touch.clientY,
                                        }
                                      : null;
                                }}
                                onTouchMove={(event) => {
                                  const start = answerTouch.current;
                                  const touch = Array.from(event.touches).find(
                                    (value) => value.identifier === start?.id,
                                  );
                                  if (
                                    !touch ||
                                    event.touches.length !== 1 ||
                                    Math.hypot(
                                      touch.clientX - start.x,
                                      touch.clientY - start.y,
                                    ) > 8
                                  )
                                    answerTouch.current = null;
                                }}
                                onTouchCancel={() => {
                                  answerTouch.current = null;
                                }}
                                onTouchEnd={(event) => {
                                  const start = answerTouch.current;
                                  answerTouch.current = null;
                                  const touch = Array.from(
                                    event.changedTouches,
                                  ).find(
                                    (value) => value.identifier === start?.id,
                                  );
                                  if (
                                    !start ||
                                    !touch ||
                                    start.value !== n ||
                                    event.touches.length ||
                                    Math.hypot(
                                      touch.clientX - start.x,
                                      touch.clientY - start.y,
                                    ) > 8
                                  )
                                    return;
                                  const rect =
                                    event.currentTarget.getBoundingClientRect();
                                  if (
                                    touch.clientX < rect.left ||
                                    touch.clientX > rect.right ||
                                    touch.clientY < rect.top ||
                                    touch.clientY > rect.bottom
                                  )
                                    return;
                                  answer(n);
                                }}
                                onClick={() => answer(n)}
                              >
                                <strong>{n}</strong>
                                <span aria-hidden="true">
                                  {Array.from({ length: n }, (_, i) => (
                                    <i key={i} />
                                  ))}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                </div>
              ) : phase === "intro" ? (
                <div className="intro-stage">
                  <SceneBoundary>
                    <BakeryScene
                      color={colors[progress.color]}
                      placed={progress.placed}
                    />
                  </SceneBoundary>
                  <button
                    className="primary next-button"
                    onClick={() => dispatch({ type: "play" })}
                  >
                    我來幫忙
                    <UiIcon name="hand" />
                  </button>
                </div>
              ) : phase === "success" ? (
                <section className="success">
                  <span className="success-seal">
                    <UiIcon name="check" />
                  </span>
                  <h2>你做到了！</h2>
                  <p className="equation">
                    {task.initial} {task.type === "take" ? "−" : "＋"}{" "}
                    {taskGoal(task)} ＝ {taskAnswer(task)}
                  </p>
                  <p>{taskExplanation(task)}</p>
                  <div className="success-replay">{replayControl}</div>
                  <button
                    className="primary next-button"
                    aria-label={
                      active.step === 0 ? "接著幫下一個忙" : "看看故事結尾"
                    }
                    onClick={() => dispatch({ type: "next" })}
                  >
                    {active.step === 0 ? "再幫一個忙" : "看看故事結尾"}
                    <UiIcon name="arrow" />
                  </button>
                </section>
              ) : (
                <section className="success ending">
                  <span className="success-seal">
                    <UiIcon name="gift" />
                  </span>
                  <h2>謝謝你，小小麵包師！</h2>
                  <p>{text}</p>
                  <div className="success-replay">{replayControl}</div>
                  <button
                    className="primary next-button"
                    aria-label="收下禮物，回到麵包店"
                    onClick={() => {
                      dispatch({ type: "claim" });
                      setInStory(false);
                      setPage("decorate");
                      setMessage("禮物已收到，點一下就能擺放。");
                    }}
                  >
                    收下禮物
                    <UiIcon name="gift" />
                  </button>
                </section>
              )}
            </>
          ) : (
            <>
              {page !== "settings" && (
                <div className="home-hero">
                  <SceneBoundary>
                    <BakeryScene
                      key={installSign ? "install-sign" : "overview"}
                      installSign={installSign}
                      onInstallSign={installFoxSign}
                      color={colors[progress.color]}
                      placed={progress.placed}
                      freeCount={page === "free" ? freeCount : null}
                      freeItem={freeItem}
                    />
                  </SceneBoundary>
                  {page === "story" && (
                    <div className="welcome">
                      <p>
                        {active
                          ? "上次的小幫忙，阿栗還記得。"
                          : nextEpisode
                            ? "來幫阿栗一個小忙吧！"
                            : "我們的店，開張了！"}
                      </p>
                      {nextEpisode && (
                        <button
                          className="primary next-button"
                          aria-label={
                            active ? "繼續上次的小幫忙" : "和阿栗一起開始"
                          }
                          onClick={() => start(nextEpisode.id)}
                        >
                          <UiIcon name="play" />
                          {active ? "繼續玩" : "一起玩"}
                        </button>
                      )}
                      {!nextEpisode && (
                        <button
                          className="primary next-button"
                          onClick={() => changePage("free")}
                        >
                          <UiIcon name="oven" />
                          一起烤點心
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {installSign && (
                <section className="install-prompt" aria-label="安裝狐狸招牌">
                  <h2>把招牌掛起來</h2>
                  <p>拖到店門上方，或點招牌再點亮亮的位置。</p>
                  <button className="primary" onClick={installFoxSign}>
                    把狐狸招牌掛在店門上方
                  </button>
                </section>
              )}
              {page === "decorate" && (
                <section className="decoration-tools">
                  <h2>小店換個顏色</h2>
                  <div className="controls swatches">
                    {[
                      ["sage", "薄荷綠"],
                      ["rose", "草莓粉"],
                      ["honey", "蜂蜜黃"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={progress.color === value}
                        style={{ background: colors[value] }}
                        onClick={() => dispatch({ type: "color", value })}
                      >
                        {progress.color === value && <UiIcon name="check" />}
                        {label}
                      </button>
                    ))}
                  </div>
                  <h2>收到的禮物</h2>
                  {!ownedRewards(progress).length && (
                    <p>幫完一個忙，朋友會送你禮物。</p>
                  )}
                  <div className="episode-list reward-list">
                    {rewards
                      .filter((r) => ownedRewards(progress).includes(r.id))
                      .map((r) => (
                        <button
                          key={r.id}
                          aria-pressed={progress.placed.includes(r.id)}
                          onClick={() => dispatch({ type: "place", id: r.id })}
                        >
                          <UiIcon
                            name={
                              progress.placed.includes(r.id) ? "check" : "plus"
                            }
                          />
                          <strong>{r.name}</strong>
                          <span>
                            {progress.placed.includes(r.id)
                              ? "收起來"
                              : `放在${r.location}`}
                          </span>
                        </button>
                      ))}
                  </div>
                </section>
              )}
              {page === "free" && (
                <section className="free-tools">
                  <h2>今天想烤什麼？</h2>
                  <div className="controls">
                    {[
                      ["croissant", "可頌"],
                      ["toast", "吐司"],
                      ["cupcake", "杯子蛋糕"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={freeItem === id}
                        onClick={() => setFreeItem(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="equation" aria-live="polite">
                    現在有 {freeCount} 個
                  </p>
                  <div className="controls">
                    <button
                      disabled={!freeCount}
                      onClick={() => {
                        setFreeCount((n) => n - 1);
                        say(`送出一個，現在有${freeCount - 1}個。`);
                      }}
                    >
                      <UiIcon name="minus" />
                      送出一個
                    </button>
                    <button
                      className="primary"
                      disabled={freeCount === 5}
                      onClick={() => {
                        setFreeCount((n) => n + 1);
                        say(`加進一個，現在有${freeCount + 1}個。`);
                      }}
                    >
                      <UiIcon name="plus" />
                      烤一個
                    </button>
                  </div>
                </section>
              )}
              {page !== "settings" && (
                <nav className="activity-tabs" aria-label="麵包店活動">
                  {[
                    ["story", "故事冒險", "book"],
                    ["decorate", "布置小店", "gift"],
                    ["free", "自由烘焙", "oven"],
                  ].map(([id, label, icon]) => (
                    <button
                      key={id}
                      aria-current={page === id ? "page" : undefined}
                      onClick={() => changePage(id)}
                    >
                      <UiIcon name={icon} />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              )}
              {page === "story" && (
                <details className="story-picker">
                  <summary>
                    <UiIcon name="book" />
                    選故事
                  </summary>
                  <div className="episode-list">
                    {episodes.map((ep, i) => (
                      <button
                        key={ep.id}
                        disabled={i > progress.completed.length}
                        onClick={() => start(ep.id)}
                      >
                        <small>
                          第 {i + 1} 段 · {ep.place}
                        </small>
                        <strong>{ep.title}</strong>
                        <span>
                          {i > progress.completed.length
                            ? "之後再來玩"
                            : progress.completed.includes(ep.id)
                              ? "再玩一次"
                              : "一起出發"}
                        </span>
                      </button>
                    ))}
                  </div>
                </details>
              )}
              {page === "settings" && (
                <section className="parent-settings">
                  <h2>安心玩，隨時休息</h2>
                  <p>
                    進度僅儲存在目前瀏覽器，不需要帳號。語音品質依裝置而定。
                  </p>
                  <p>可以從左上角回到小店；重新開始前會再次確認。</p>
                  <button onClick={() => setConfirm({ type: "reset" })}>
                    重新開始所有故事
                  </button>
                </section>
              )}
            </>
          )}
          <p className="status feedback-message" role="status">
            {message}
          </p>
          {!playing && (
            <footer>
              <button
                className="parent-link"
                onClick={() => changePage("settings")}
              >
                <UiIcon name="settings" />
                家長設定
              </button>
              <span>
                {saved ? "進度已保存在這個瀏覽器" : "進度暫存在記憶體"}
              </span>
            </footer>
          )}
        </div>
      </div>
      {confirm && (
        <section
          className="confirmation"
          role="alertdialog"
          aria-modal="true"
          aria-label="確認變更"
        >
          <h2>
            {confirm.type === "reset"
              ? "確定清除麵包店進度？"
              : "要放下目前的小幫忙，改玩另一段故事嗎？"}
          </h2>
          <p>
            {confirm.type === "reset"
              ? "故事、裝飾和設定都會重設。"
              : "已獲得的禮物會保留，目前任務需重新開始。"}
          </p>
          <div className="controls">
            <button autoFocus onClick={() => setConfirm(null)}>
              保留，回去玩
            </button>
            <button
              onClick={() => {
                if (confirm.type === "reset") {
                  setProgress(freshProgress());
                  returnHome();
                } else {
                  setProgress((p) =>
                    transition(transition(p, { type: "abandon" }), {
                      type: "start",
                      id: confirm.id,
                    }),
                  );
                  setInStory(true);
                }
                setConfirm(null);
              }}
            >
              確定
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
