import test from "node:test";
import assert from "node:assert/strict";
import { episodes, taskGoal, taskAnswer } from "../src/bakery/chapter.js";
import {
  workbenchLayout,
  slotPoint,
  projectPoint,
  hitDiameterPixels,
} from "../src/bakery/layout.js";
import { freshProgress, validateProgress } from "../src/bakery/progress.js";
import {
  transition,
  currentMission,
  availableSource,
  ownedRewards,
  taskInventory,
} from "../src/bakery/game.js";

test("responsive source targets meet 56 CSS pixels and keep neighboring centers distinct", () => {
  for (const viewport of [
    { width: 360, height: 344 },
    { width: 688, height: 454 },
    { width: 976, height: 460 },
  ]) {
    const layout = workbenchLayout(viewport.width);
    const points = Array.from({ length: 5 }, (_, i) =>
      slotPoint(layout, layout.source, i),
    );
    for (const point of points) {
      const diameter = hitDiameterPixels(layout, point, viewport);
      const projected = projectPoint(layout, point, viewport);
      assert(diameter >= 56);
      assert(
        projected.x > diameter / 2 &&
          projected.x < viewport.width - diameter / 2,
      );
      assert(
        projected.y > diameter / 2 &&
          projected.y < viewport.height - diameter / 2,
      );
      for (const neighbor of points.filter((value) => value !== point)) {
        const other = projectPoint(layout, neighbor, viewport);
        assert(
          Math.hypot(projected.x - other.x, projected.y - other.y) >
            diameter / 2,
        );
      }
    }
  }
});

test("reward installation requires ownership and is idempotent", () => {
  const fresh = freshProgress();
  assert.equal(transition(fresh, { type: "install", id: "sign" }), fresh);
  const owned = { ...fresh, completed: ["opening"] };
  const installed = transition(owned, { type: "install", id: "sign" });
  assert.deepEqual(installed.placed, ["sign"]);
  assert.equal(
    transition(installed, { type: "install", id: "sign" }),
    installed,
  );
  assert.deepEqual(
    validateProgress(JSON.parse(JSON.stringify(installed))).placed,
    ["sign"],
  );
});

test("all ten tasks have stable model and scene identifiers", () => {
  assert.equal(taskInventory.length, 10);
  assert.equal(new Set(taskInventory.map((t) => t.id)).size, 10);
  assert.equal(new Set(taskInventory.map((t) => t.itemId)).size, 6);
  for (const task of taskInventory) {
    assert.match(task.itemId, /^[a-z]+$/);
    assert(task.moves > 0);
  }
});

test("all stories complete with idempotent moves, answers and reward ownership", () => {
  let progress = freshProgress();
  for (const episode of episodes) {
    progress = transition(progress, { type: "start", id: episode.id });
    progress = transition(progress, { type: "play" });
    for (const task of episode.tasks) {
      assert.equal(currentMission(progress).task, task);
      assert.equal(
        transition(progress, { type: "answer", value: taskAnswer(task) }),
        progress,
      );
      assert.equal(transition(progress, { type: "move", id: -1 }), progress);
      for (let i = 0; i < taskGoal(task); i++) {
        const id = availableSource(task, progress.active.moved)[0];
        assert.equal(
          transition(progress, { type: "move", id, locked: true }),
          progress,
        );
        progress = transition(progress, { type: "move", id });
        assert.equal(transition(progress, { type: "move", id }), progress);
        assert.deepEqual(
          validateProgress(JSON.parse(JSON.stringify(progress))),
          progress,
        );
      }
      assert.equal(
        transition(progress, {
          type: "answer",
          value: taskAnswer(task),
          locked: true,
        }),
        progress,
      );
      if (task.type !== "fill") {
        progress = transition(progress, { type: "answer", value: 99 });
        assert.equal(progress.active.phase, "play");
      }
      progress = transition(progress, {
        type: "answer",
        value: taskAnswer(task),
      });
      progress = transition(progress, { type: "next" });
    }
    const ending = progress;
    assert.deepEqual(validateProgress(ending), ending);
    progress = transition(progress, { type: "claim" });
    assert(ownedRewards(progress).includes(episode.reward));
    assert(!progress.placed.includes(episode.reward));
    assert.equal(transition(progress, { type: "claim" }), progress);
    progress = transition(progress, { type: "place", id: episode.reward });
    assert(progress.placed.includes(episode.reward));
    progress = transition(progress, { type: "place", id: episode.reward });
    assert(ownedRewards(progress).includes(episode.reward));
  }
  assert.equal(progress.completed.length, 5);
  progress = transition(progress, { type: "start", id: "opening" });
  assert.equal(progress.completed.length, 5);
});

test("locks, incompatible phases and story replacement cannot bypass the sequence", () => {
  let p = freshProgress();
  assert.equal(transition(p, { type: "start", id: "party" }), p);
  assert.equal(transition(p, { type: "place", id: "lamp" }), p);
  assert.equal(transition(p, { type: "next" }), p);
  p = transition(p, { type: "start", id: "opening" });
  assert.equal(transition(p, { type: "move", id: 0 }), p);
  assert.equal(transition(p, { type: "start", id: "rabbit" }), p);
  assert.equal(transition(p, { type: "claim" }), p);
});

test("legacy v1 fixtures retain preferences, hidden decorations and in-flight commits", () => {
  const base = {
    ...freshProgress(),
    completed: ["opening"],
    placed: [],
    color: "rose",
    voice: false,
  };
  for (const [phase, moved] of [
    ["intro", []],
    ["play", [0]],
    ["success", [0]],
    ["ending", [0]],
  ]) {
    const fixture = {
      ...base,
      active: { episodeId: "rabbit", step: 0, phase, moved, help: 1 },
    };
    assert.deepEqual(validateProgress(fixture), fixture);
  }
  assert.deepEqual(validateProgress(base), base);
  assert.deepEqual(ownedRewards(base), ["sign"]);
});
