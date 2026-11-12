import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { taskGoal, taskAnswer } from "./chapter.js";
import { nextGuide, taskObjective } from "./guidance.js";
import FoxBuddy, { useVoiceActivity } from "./FoxBuddy.jsx";
import { snackFlightFrames } from "./motion.js";
import { stopSpeaking } from "../utils/sound.js";

function Demo({ item, name, destination, say, onClose }) {
  const sayRef = useRef(say);
  sayRef.current = say;
  useEffect(() => {
    sayRef.current(
      `看我的小手。先點一個${name}，再點${destination}，點心就搬過去囉！看完，點綠色按鈕換你玩。`,
    );
    return () => stopSpeaking();
  }, [name, destination]);
  return (
    <section className="bk-demo" aria-label="操作示範">
      <h3>看阿栗做一次</h3>
      <div className="bk-demo-stage" aria-hidden="true">
        <div className="bk-demo-from">
          <span>{item}</span>
          <small>①</small>
        </div>
        <div className="bk-demo-to">
          <span>🍽️</span>
          <small>②</small>
        </div>
        <div className="bk-demo-hand">👆</div>
        <div className="bk-demo-food">{item}</div>
      </div>
      <p>① 點點心　→　② 點盤子</p>
      <button className="bk-primary bk-guided" onClick={onClose}>
        ▶ 換我玩
      </button>
    </section>
  );
}

export default function GuidedWorkbench({
  task,
  active,
  update,
  finish,
  say,
  chime,
  voice,
}) {
  const [flight, setFlight] = useState(null);
  const [landed, setLanded] = useState(null);
  const sources = useRef(new Map());
  const arriving = useRef();
  const flying = useRef();
  const flightLock = useRef(false);
  const speaking = useVoiceActivity();
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [demo, setDemo] = useState(false);
  const [countIndex, setCountIndex] = useState(-1);
  const [counting, setCounting] = useState(false);
  const [activity, setActivity] = useState(0);
  const [retry, setRetry] = useState(0);
  const countTimers = useRef([]);
  const answerPanel = useRef();
  const idleReminders = useRef(0);
  const sayRef = useRef(say);
  sayRef.current = say;
  const done = active.moved.length === taskGoal(task);
  const guide = flight
    ? { target: "moving", text: "點心搬過去囉！", key: "moving" }
    : nextGuide(task, active.moved.length, selected);
  const sourceIds = Array.from(
    { length: task.type === "take" ? task.initial : taskGoal(task) },
    (_, i) => i,
  ).filter((id) => !active.moved.includes(id));
  const destCount =
    task.type === "take"
      ? active.moved.length
      : task.initial + active.moved.length;
  const resultCount = task.type === "take" ? sourceIds.length : destCount;
  useEffect(() => {
    if (done && !demo && !flight)
      answerPanel.current?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
  }, [done, demo, flight]);
  function clearCounting() {
    countTimers.current.forEach(clearTimeout);
    countTimers.current = [];
  }
  useEffect(() => () => clearCounting(), []);
  useEffect(() => {
    if (demo || counting || flight) return;
    const timer = setTimeout(() => {
      sayRef.current(
        `${active.moved.length === 0 && selected === null ? taskObjective(task) : ""}${guide.text}`,
      );
    }, 180);
    return () => clearTimeout(timer);
  }, [guide.key, demo, counting, voice, flight]);
  useEffect(() => {
    if (demo || counting || flight || idleReminders.current >= 2) return;
    const timer = setTimeout(() => {
      if (
        document.visibilityState !== "visible" ||
        window.speechSynthesis?.speaking
      )
        return;
      idleReminders.current += 1;
      setMessage("小手會帶路。也可以點「看我做」看示範。");
      sayRef.current(
        `不急，我陪你。${guide.text}不確定的話，可以點小手看示範。`,
      );
    }, 14000);
    return () => clearTimeout(timer);
  }, [guide.key, activity, demo, counting, voice, flight]);
  function touch() {
    setActivity((n) => n + 1);
  }
  useLayoutEffect(() => {
    if (!flight) return;
    const target = arriving.current;
    const ghost = flying.current;
    function arrive() {
      flightLock.current = false;
      setLanded(flight.index);
      setFlight(null);
      setMessage("放好了！");
    }
    if (!target || !ghost || typeof ghost.animate !== "function") {
      arrive();
      return;
    }
    const animation = ghost.animate(
      snackFlightFrames(flight.from, target.getBoundingClientRect()),
      { duration: 480, easing: "ease-in-out", fill: "forwards" },
    );
    animation.onfinish = arrive;
    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [flight]);
  function transfer(id) {
    if (
      flightLock.current ||
      done ||
      active.moved.includes(id) ||
      !sourceIds.includes(id)
    )
      return;
    const from = sources.current.get(id)?.getBoundingClientRect();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (from && !reduceMotion) {
      flightLock.current = true;
      setLanded(null);
      setFlight({ from, index: destCount });
    } else setLanded(destCount);
    setSelected(null);
    chime();
    update({ moved: [...active.moved, id] });
    setMessage("點心搬過去囉！");
  }
  function startCount() {
    if (flightLock.current) return;
    touch();
    if (!done) {
      setDemo(true);
      return;
    }
    clearCounting();
    setCounting(true);
    setCountIndex(-1);
    sayRef.current("一起點著數。");
    for (let i = 0; i < resultCount; i++)
      countTimers.current.push(
        setTimeout(
          () => {
            setCountIndex(i);
            sayRef.current(String(i + 1));
          },
          850 + i * 1100,
        ),
      );
    countTimers.current.push(
      setTimeout(
        () => {
          setCountIndex(-1);
          setCounting(false);
          setMessage(`有${resultCount}個。可以對照數字卡上的小圓點。`);
        },
        850 + resultCount * 1100,
      ),
    );
  }
  function choose(value) {
    if (flightLock.current) return;
    touch();
    if (counting) return;
    if (value === taskAnswer(task)) finish();
    else {
      setRetry((n) => n + 1);
      update({ help: Math.min(3, active.help + 1) });
      setMessage("不用猜，我們點著點心一起數。");
      startCount();
    }
  }
  function showDemo() {
    if (flightLock.current) return;
    touch();
    clearCounting();
    setCounting(false);
    setCountIndex(-1);
    update({ help: Math.min(3, active.help + 1) });
    if (done) startCount();
    else setDemo(true);
  }
  const arrivalClass = (i) =>
    `${flight?.index === i ? " bk-in-flight" : ""}${landed === i ? " bk-just-landed" : ""}`;
  const countableClass = (i) => (countIndex === i ? " bk-counting-now" : "");
  return (
    <div
      className="bk-workbench"
      data-moving={!!flight}
      onPointerDown={touch}
      onKeyDown={touch}
    >
      {flight &&
        createPortal(
          <span
            ref={flying}
            className="bk-flying-snack"
            aria-hidden="true"
            style={{
              left: flight.from.left + flight.from.width / 2 - 23,
              top: flight.from.top + flight.from.height / 2 - 23,
            }}
          >
            {task.item}
          </span>,
          document.body,
        )}
      <div className="bk-child-guide" role="status">
        <button
          className="bk-coach-fox"
          aria-label="阿栗，再說一次下一步"
          onClick={() => {
            touch();
            say(guide.text);
          }}
        >
          <FoxBuddy size="small" speaking={speaking} />
          <small>🔊</small>
        </button>
        <div>
          <small>{taskObjective(task)}</small>
          <strong>{guide.text}</strong>
        </div>
      </div>
      {demo ? (
        <Demo
          item={task.item}
          name={task.name}
          destination={task.destination}
          say={say}
          onClose={() => {
            setDemo(false);
            setMessage("換你試試！小手會陪你。");
          }}
        />
      ) : (
        <>
          <div className="bk-transfer-layout">
            <section
              className={`bk-source-zone ${done && task.type === "take" ? "bk-count-target" : ""}`}
              aria-label={task.source}
            >
              <h3>① {task.source}</h3>
              <div className="bk-token-area">
                {sourceIds.map((id, i) => (
                  <button
                    key={id}
                    ref={(node) => {
                      if (node) sources.current.set(id, node);
                      else sources.current.delete(id);
                    }}
                    disabled={!!flight}
                    className={`bk-token ${selected === id ? "selected" : ""} ${guide.target === "source" && i === 0 ? "bk-guided glowing" : ""}${done && task.type === "take" ? countableClass(i) : ""}`}
                    aria-label={`選取${task.name} ${id + 1}`}
                    aria-pressed={selected === id}
                    draggable={!done}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", String(id));
                      setSelected(id);
                    }}
                    onClick={() => {
                      if (done) {
                        startCount();
                        return;
                      }
                      chime();
                      setSelected(id);
                      setMessage("選好了！小手現在指向盤子。");
                    }}
                  >
                    {task.item}
                    {countIndex === i && done && task.type === "take" && (
                      <span className="bk-count-badge">{i + 1}</span>
                    )}
                  </button>
                ))}
                {!sourceIds.length && <span className="bk-empty">✨</span>}
              </div>
              <span className="bk-zone-note">
                {task.type === "take" ? `送出 ${task.change} 個` : "點一個點心"}
              </span>
            </section>
            <span className="bk-transfer-arrow" aria-hidden="true">
              →
            </span>
            <section
              className={`bk-destination-zone ${done && task.type !== "take" ? "bk-count-target" : ""}`}
              aria-label={task.destination}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const raw = event.dataTransfer.getData("text/plain");
                if (/^\d+$/.test(raw)) transfer(Number(raw));
              }}
            >
              <h3>② {task.destination}</h3>
              <button
                className={`bk-drop-area ${selected !== null ? "ready" : ""} ${guide.target === "destination" ? "bk-guided" : ""}`}
                aria-label={`放到${task.destination}`}
                aria-disabled={done || !!flight}
                disabled={!!flight}
                onClick={() => {
                  if (selected !== null) transfer(selected);
                  else if (done && task.type !== "take") startCount();
                  else {
                    setMessage("先點小手指著的點心。");
                    say("先點小手指著的點心。");
                  }
                }}
              >
                {task.type === "fill" ? (
                  Array.from({ length: task.target }, (_, i) => (
                    <span
                      key={i}
                      ref={flight?.index === i ? arriving : null}
                      className={`bk-slot ${i < destCount ? "filled" : ""}${countableClass(i)}${arrivalClass(i)}`}
                    >
                      {i < destCount ? task.item : <small>＋</small>}
                      {countIndex === i && (
                        <span className="bk-count-badge">{i + 1}</span>
                      )}
                    </span>
                  ))
                ) : (
                  <>
                    {Array.from({ length: destCount }, (_, i) => (
                      <span
                        key={i}
                        ref={flight?.index === i ? arriving : null}
                        className={`bk-placed-token${task.type !== "take" ? countableClass(i) : ""}${arrivalClass(i)}`}
                      >
                        {task.item}
                        {countIndex === i && task.type !== "take" && (
                          <span className="bk-count-badge">{i + 1}</span>
                        )}
                      </span>
                    ))}
                    {!destCount && <span className="bk-empty">🍽️</span>}
                  </>
                )}
              </button>
              <span className="bk-zone-note">
                {task.type === "fill"
                  ? `${task.target} 個位置`
                  : "再點盤子放進來"}
              </span>
            </section>
          </div>
          {done && !flight && (
            <div
              ref={answerPanel}
              className={`bk-answer-panel ${guide.target === "answers" ? "bk-answer-guide" : ""}`}
            >
              <h3>
                {task.type === "take"
                  ? "這邊還剩幾個？"
                  : task.type === "fill"
                    ? "補滿了！"
                    : "這邊共有幾個？"}
              </h3>
              {task.type === "fill" ? (
                <button className="bk-primary bk-guided" onClick={finish}>
                  補滿了！看看發生什麼事 ✨
                </button>
              ) : (
                <div className="bk-number-choices" key={retry}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      aria-label={`答案 ${n}`}
                      disabled={counting || !!flight}
                      onClick={() => choose(n)}
                    >
                      <span>{n}</span>
                      <span className="bk-number-dots" aria-hidden="true">
                        {Array.from({ length: n }, (_, i) => (
                          <i key={i} />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="bk-help-row">
            <button
              className="bk-secondary bk-show-demo"
              disabled={!!flight}
              onClick={showDemo}
            >
              <span aria-hidden="true">👆▶</span> 看我做
            </button>
            <button
              className="bk-secondary"
              disabled={!!flight}
              onClick={startCount}
            >
              🔢 一起數一數
            </button>
          </div>
          <p className="bk-action-message" role="status">
            {message || "點小狐狸可以再聽一次。"}
          </p>
        </>
      )}
    </div>
  );
}
