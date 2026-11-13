import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { Fox } from "./FoxModel.jsx";
import { RoundedBox, BakeryLighting } from "./ToyPrimitives.jsx";
import { Snack, Tray } from "./SnackModels.jsx";
import { availableSource } from "./game.js";
import { taskGoal } from "./chapter.js";
import { StorySet } from "./StorySet.jsx";
import { workbenchLayout, slotPoint } from "./layout.js";

import { ContextGuard, SceneBoundary } from "../shared/interaction/SceneBoundary.jsx";
import { useObjectPlacement } from "../shared/interaction/useObjectPlacement.js";
export { SceneBoundary } from "../shared/interaction/SceneBoundary.jsx";

function FlyingSnack({ flight, itemId, onArrive }) {
  const ref = useRef();
  const elapsed = useRef(0);
  const arrived = useRef(false);
  useFrame((_, delta) => {
    if (!ref.current || arrived.current) return;
    elapsed.current += delta;
    const t = Math.min(1, elapsed.current / 0.45);
    ref.current.position.lerpVectors(flight.from, flight.to, t);
    ref.current.position.y += Math.sin(t * Math.PI) * 0.75;
    if (t === 1) {
      arrived.current = true;
      onArrive();
    }
  });
  return (
    <group ref={ref} position={flight.from}>
      <Snack kind={itemId} />
    </group>
  );
}

function GuideHand({ from, to, demo }) {
  const ref = useRef();
  useEffect(() => {
    ref.current?.traverse((object) => {
      object.raycast = () => {};
    });
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const t = demo && !reduced ? (clock.elapsedTime % 3) / 3 : 0;
    ref.current.position.lerpVectors(from, to, Math.min(1, t * 1.8));
    ref.current.position.y +=
      0.8 + (reduced ? 0 : Math.sin(clock.elapsedTime * 3) * 0.07);
  });
  return (
    <group ref={ref} rotation={[0, 0, -0.35]}>
      <RoundedBox scale={[0.32, 0.15, 0.3]} radius={0.06} color="#ffdfb4" />
      <RoundedBox
        position={[0.08, 0, -0.23]}
        scale={[0.1, 0.13, 0.32]}
        radius={0.04}
        color="#ffdfb4"
      />
      <RoundedBox
        position={[-0.18, 0, 0]}
        scale={[0.16, 0.13, 0.12]}
        radius={0.04}
        color="#ffdfb4"
      />
      <RoundedBox
        position={[0, 0, 0.21]}
        scale={[0.3, 0.14, 0.13]}
        radius={0.04}
        color="#88aa91"
      />
    </group>
  );
}

function DemoSnack({ itemId, from, to }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : Math.min(1, (clock.elapsedTime % 3) / 1.8);
    ref.current.position.lerpVectors(from, to, t);
    ref.current.position.y += Math.sin(t * Math.PI) * 0.6;
  });
  return (
    <group ref={ref}>
      <Snack kind={itemId} />
    </group>
  );
}

function Board({
  task,
  moved,
  itemId,
  selected,
  onSelect,
  onMove,
  flight,
  setFlight,
  disabled,
  countIndex,
  demo,
  scene,
  onReplay,
}) {
  const { camera, size } = useThree();
  const layout = workbenchLayout(size.width);
  useEffect(() => {
    camera.position.set(...workbenchLayout(size.width).camera);
    camera.lookAt(0, 1.2, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  const plane = new Plane(new Vector3(0, 1, 0), -1.35);
  const sources = availableSource(task, moved);
  const hitRadius = layout.hitRadius;
  const destinationCount =
    task.type === "take" ? moved.length : task.initial + moved.length;
  const sourcePosition = (id) =>
    new Vector3(...slotPoint(layout, layout.source, id));
  const targetPosition = (i) =>
    new Vector3(...slotPoint(layout, layout.target, i));
  const lock = useRef(false);
  const transfer = (id, from) => {
    if (lock.current || disabled || !sources.includes(id)) return;
    lock.current = true;
    const index = destinationCount;
    onMove(id);
    onSelect(null);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      setFlight({ id, index, from: from || sourcePosition(id), to: targetPosition(index) });
    else lock.current = false;
  };
  const placement = useObjectPlacement({
    disabled, sourcePosition, plane, onSelect, onDrop: transfer,
    acceptsDrop: (id, point) => Boolean(point && sources.includes(id) && Math.abs(point.x - layout.target[0]) < layout.dropHalf.x && Math.abs(point.z - layout.target[2]) < layout.dropHalf.z),
  });
  const { dragId, ghost, ghostPoint, sourceHandlers } = placement;
  useEffect(() => { if (!flight) lock.current = false; }, [flight]);
  return (
    <>
      <StorySet
        scene={scene}
        moved={moved.length}
        quiet={countIndex >= 0}
        ovenOpen={itemId === "bread" && moved.length === 0}
      />
      <RoundedBox
        position={layout.board.position}
        scale={layout.board.scale}
        color="#bd9168"
        radius={0.15}
      />
      <Tray
        position={[layout.source[0], 1.22, layout.source[2]]}
        scale={[layout.portrait ? 1.33 : 1, 1, 1]}
        slots={0}
        variant={task.source === "烤箱" ? "baking" : "tray"}
        basket={task.source.includes("籃")}
      />
      <Tray
        position={[layout.target[0], 1.22, layout.target[2]]}
        scale={[layout.portrait ? 1.33 : 1, 1, 1]}
        variant={
          task.destination.includes("袋")
            ? "bag"
            : task.destination.includes("餐盒") ||
                task.destination.includes("野餐盒")
              ? "lunchbox"
              : "tray"
        }
        basket={task.destination.includes("籃")}
        slots={task.type === "fill" ? task.target : 0}
        active={selected !== null || dragId !== null}
        onClick={(e) => {
          e.stopPropagation();
          if (selected !== null) transfer(selected);
        }}
      />
      <mesh
        position={layout.target}
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          if (selected !== null) transfer(selected);
        }}
      >
        <boxGeometry
          args={[layout.dropHalf.x * 2, 0.15, layout.dropHalf.z * 2]}
        />
        <meshBasicMaterial />
      </mesh>
      {sources.map((id, i) => (
        <group key={id} position={sourcePosition(id)} {...sourceHandlers(id)}>

          <mesh visible={false}>
            <sphereGeometry args={[hitRadius, 16, 12]} />
            <meshBasicMaterial />
          </mesh>
          {dragId !== id && (
            <Snack
              kind={itemId}
              highlighted={
                selected === id || (task.type === "take" && countIndex === i)
              }
              position={[0, selected === id ? 0.15 : 0, 0]}
            />
          )}
        </group>
      ))}
      {Array.from(
        { length: destinationCount },
        (_, i) =>
          flight?.index !== i && (
            <Snack
              key={i}
              position={targetPosition(i)}
              kind={itemId}
              highlighted={task.type !== "take" && countIndex === i}
            />
          ),
      )}
      {dragId !== null && (
        <group ref={ghost} position={ghostPoint}>
          <Snack kind={itemId} highlighted />
        </group>
      )}
      {flight && (
        <FlyingSnack
          key={flight.id}
          flight={flight}
          itemId={itemId}
          onArrive={() => setFlight(null)}
        />
      )}
      {(demo || (!disabled && sources.length > 0)) && (
        <GuideHand
          from={
            selected !== null && !demo
              ? targetPosition(Math.min(4, destinationCount))
              : sourcePosition(sources[0] ?? 0)
          }
          to={
            selected !== null && !demo
              ? targetPosition(Math.min(4, destinationCount))
              : targetPosition(destinationCount)
          }
          demo={demo}
        />
      )}
      {demo && (
        <DemoSnack
          itemId={itemId}
          from={sourcePosition(sources[0] ?? 0)}
          to={targetPosition(Math.min(4, destinationCount))}
        />
      )}
      <Fox
        position={
          layout.portrait ? layout.fox : [layout.fox[0], 0.48, layout.fox[2]]
        }
        scale={layout.portrait ? 0.65 : 0.95}
        happy={moved.length === taskGoal(task) && !flight}
        quiet={countIndex >= 0}
        guiding={!disabled && selected !== null}
        onClick={() => onReplay?.()}
      />
    </>
  );
}

export default function Workbench3D({
  task,
  active,
  itemId,
  onMove,
  say,
  countIndex = -1,
  busy,
  onBusy,
  demo = false,
  scene = "kitchen",
}) {
  const [selected, setSelected] = useState(null);
  const [contextLost, setContextLost] = useState(false);
  const [flight, setFlightState] = useState(null);
  const setFlight = (value) => {
    setFlightState(value);
    onBusy(!!value);
  };
  const done = active.moved.length === taskGoal(task);
  useEffect(() => {
    if (!flight) return;
    const timer = setTimeout(() => setFlight(null), 700);
    return () => clearTimeout(timer);
  }, [flight]);
  useEffect(() => () => onBusy(false), []);
  return (
    <section className="workbench" aria-label={task.title}>
      <div className="world-labels">
        <span>{task.source}</span>
        <span>{task.destination}</span>
      </div>
      <SceneBoundary onError={() => setContextLost(true)}>
        <div className="workbench-canvas">
          {contextLost ? (
            <p role="status">
              3D 顯示中斷。請使用下方輔助操作繼續，已搬運的點心會保留。
            </p>
          ) : (
            <Canvas
              fallback={
                <p role="status">
                  3D
                  暫時無法使用，請使用下方來源選取及放置按鈕繼續；故事進度照常保存。
                </p>
              }
              shadows
              dpr={[1, 1.4]}
              camera={{ position: [0, 8.5, 7.5], fov: 49 }}
              onCreated={({ camera }) => camera.lookAt(0, 1.2, 0)}
            >
              <ContextGuard
                onLost={() => {
                  setFlight(null);
                  setContextLost(true);
                }}
              />
              <color attach="background" args={["#eee8d9"]} />
              <BakeryLighting />
              <Board
                task={task}
                moved={active.moved}
                itemId={itemId}
                selected={selected}
                onSelect={setSelected}
                onMove={onMove}
                flight={flight}
                setFlight={setFlight}
                disabled={busy || done}
                countIndex={countIndex}
                demo={demo}
                scene={scene}
                onReplay={() => say(task.prompt)}
              />
            </Canvas>
          )}
        </div>
      </SceneBoundary>
      <p className="instruction">
        {demo
          ? "跟著小手看一遍。"
          : done
            ? "放好囉！"
            : selected !== null
              ? `點${task.destination}，放進去。`
              : `拖進${task.destination}`}
      </p>
      {!flight && (
        <p
          className={countIndex >= 0 ? "count-marker" : "sr-only"}
          aria-live="polite"
        >
          {countIndex >= 0
            ? `正在數第 ${countIndex + 1} 個。`
            : done
              ? "搬運完成，可以一起數一數，再選數量卡。"
              : "每次搬一個，慢慢來。"}
        </p>
      )}
      <details className="assist-controls" open={contextLost || undefined}>
        <summary>鍵盤操作與輔助控制</summary>
        <button
          disabled={busy}
          onClick={() =>
            say(
              `先選一個${task.name}，再點${task.destination}。也可以直接拖過去。`,
            )
          }
        >
          再聽操作方法
        </button>
        <div className="controls">
          {availableSource(task, active.moved).map((id) => (
            <button
              key={id}
              disabled={busy || done}
              onClick={() => {
                setSelected(id);
                say(`選好${task.name}，接著放進${task.destination}。`);
              }}
            >
              選第 {id + 1} 個{task.name}
            </button>
          ))}
          <button
            disabled={selected === null || busy || done}
            onClick={() => {
              onMove(selected);
              setSelected(null);
            }}
          >
            放到{task.destination}
          </button>
        </div>
      </details>
    </section>
  );
}
