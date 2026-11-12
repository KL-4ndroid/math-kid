import test from "node:test";
import assert from "node:assert/strict";
import {
  episodes,
  rewards,
  taskGoal,
  taskAnswer,
} from "../src/bakery/chapter.js";
import { freshProgress, validateProgress } from "../src/bakery/progress.js";

test("five connected stories provide ten valid, concrete tasks within five", () => {
  assert.equal(episodes.length, 5);
  assert.equal(episodes.flatMap((e) => e.tasks).length, 10);
  assert.equal(new Set(episodes.map((e) => e.id)).size, 5);
  assert.deepEqual(
    new Set(episodes.flatMap((e) => e.tasks.map((t) => t.type))),
    new Set(["merge", "take", "fill"]),
  );
  for (const episode of episodes) {
    assert(rewards.some((r) => r.id === episode.reward));
    for (const task of episode.tasks) {
      assert(
        Number.isInteger(task.initial) && task.initial > 0 && task.initial <= 5,
      );
      assert(taskGoal(task) > 0 && taskGoal(task) <= 5);
      assert(taskAnswer(task) >= 1 && taskAnswer(task) <= 5);
      if (task.type === "take") assert(taskGoal(task) < task.initial);
    }
  }
});

test("invalid storage does not unlock stories or grant decorations", () => {
  assert.deepEqual(validateProgress(null), freshProgress());
  assert.deepEqual(validateProgress({ version: 99 }), freshProgress());
  const result = validateProgress({
    version: 1,
    completed: ["party"],
    placed: ["lamp"],
    active: { episodeId: "party", step: 0 },
  });
  assert.deepEqual(result.completed, []);
  assert.deepEqual(result.placed, []);
  assert.equal(result.active, null);
});

test("mid-task movement, hints and preferences survive serialization", () => {
  const raw = {
    ...freshProgress(),
    completed: ["opening"],
    placed: ["sign"],
    color: "rose",
    voice: false,
    active: {
      episodeId: "rabbit",
      step: 0,
      phase: "play",
      moved: [0],
      help: 2,
    },
  };
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(raw))), raw);
});

test("replaying a completed story keeps its earned progress", () => {
  const result = validateProgress({
    ...freshProgress(),
    completed: episodes.map((e) => e.id),
    placed: rewards.map((r) => r.id),
    active: {
      episodeId: "opening",
      step: 0,
      phase: "success",
      moved: [0],
      help: 0,
    },
  });
  assert.equal(result.completed.length, 5);
  assert.equal(result.placed.length, 5);
  assert.equal(result.active.phase, "success");
});

test("malformed movement cannot skip a task or duplicate an object", () => {
  const result = validateProgress({
    ...freshProgress(),
    active: {
      episodeId: "opening",
      step: 0,
      phase: "success",
      moved: [999, -1, "0"],
      help: 0,
    },
  });
  assert.equal(result.active.phase, "play");
  assert.deepEqual(result.active.moved, []);
  const duplicate = validateProgress({
    ...freshProgress(),
    active: {
      episodeId: "opening",
      step: 0,
      phase: "play",
      moved: [0, 0, 0],
      help: 1,
    },
  });
  assert.deepEqual(duplicate.active.moved, [0]);
});

test("non-reading guide advances one action at a time without pointing at a numeric answer", async () => {
  const { nextGuide, taskObjective } = await import(
    "../src/bakery/guidance.js"
  );
  for (const task of episodes.flatMap((e) => e.tasks)) {
    assert.equal(nextGuide(task, 0, null).target, "source");
    assert.equal(nextGuide(task, 0, 0).target, "destination");
    assert.equal(
      nextGuide(task, taskGoal(task), null).target,
      task.type === "fill" ? "confirm" : "answers",
    );
    assert(taskObjective(task).length > 0);
  }
});

test("snack flight uses real source and destination centers", async () => {
  const { snackFlightFrames } = await import("../src/bakery/motion.js");
  const from = { left: 10, top: 20, width: 60, height: 60 };
  const to = { left: 210, top: 120, width: 60, height: 60 };
  const frames = snackFlightFrames(from, to);
  assert.equal(frames.length, 3);
  assert.equal(frames[2].transform, "translate(200px, 100px) scale(1)");
  assert.equal(frames[1].transform, "translate(100px, 12px) scale(1.12)");
});

test("touch drop accepts the whole tray and a small forgiving edge, but not the source", async () => {
  const { isInsideDropZone } = await import("../src/bakery/touchGeometry.js");
  const rect = { left: 200, right: 350, top: 300, bottom: 500 };
  assert(isInsideDropZone(275, 400, rect));
  assert(isInsideDropZone(195, 295, rect));
  assert(!isInsideDropZone(100, 400, rect));
  assert(!isInsideDropZone(275, 550, rect));
  assert(!isInsideDropZone(275, 400, null));
});

test("touch guidance teaches direct dragging and keeps tap placement instructions", async () => {
  const { nextGuide } = await import("../src/bakery/guidance.js");
  const task = episodes[0].tasks[0];
  assert(nextGuide(task, 0, null, { touch: true }).text.includes("拖進"));
  assert(nextGuide(task, 0, 0, { touch: true }).text.includes("點亮亮"));
  assert(nextGuide(task, 0, null).text.includes("點一個"));
});
