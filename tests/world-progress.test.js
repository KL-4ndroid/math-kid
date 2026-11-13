import test from "node:test";
import assert from "node:assert/strict";
import { BAKERY_KEY, freshProgress } from "../src/bakery/progress.js";
import {
  createWorldStore,
  freshWorldProgress,
  validateForestProgress,
  validateWorldProgress,
  WORLD_KEY,
} from "../src/world/progress.js";

const planted = { seed_1: "pot_2", seed_2: "pot_3", seed_3: "pot_1" };
const arranged = { pot_1: "circle_2", pot_2: "circle_3", pot_3: "circle_1" };
function forestActive(patch = {}) {
  return {
    episodeId: "forest/sprout",
    taskId: "forest/sprout/rearrange",
    phase: "play",
    mode: "story",
    seedToPot: planted,
    potToSlot: arranged,
    ...patch,
  };
}
function memory(initial = {}) {
  const data = new Map(Object.entries(initial));
  let writes = 0;
  return {
    data,
    failAt: Infinity,
    get writes() {
      return writes;
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      writes += 1;
      if (writes === this.failAt) throw new Error("quota");
      data.set(key, value);
    },
  };
}

test("forest snapshots round-trip partial planting, rearrangement and all valid phases", () => {
  for (const active of [
    forestActive({
      taskId: "forest/sprout/plant",
      phase: "intro",
      seedToPot: {},
      potToSlot: {},
    }),
    forestActive({
      taskId: "forest/sprout/plant",
      seedToPot: { seed_1: "pot_2" },
      potToSlot: {},
    }),
    forestActive({
      taskId: "forest/sprout/plant",
      phase: "success",
      potToSlot: {},
    }),
    forestActive({ potToSlot: { pot_1: "circle_2" } }),
    forestActive({ phase: "success" }),
    forestActive({ phase: "ending" }),
  ]) {
    const result = validateForestProgress({ completed: [], active });
    assert.deepEqual(result.active, active);
    assert.deepEqual(
      validateForestProgress(JSON.parse(JSON.stringify(result))),
      result,
    );
  }
});

test("invalid mappings and impossible completion recover without creating objects or rewards", () => {
  const result = validateForestProgress({
    completed: ["forest/departure"],
    active: forestActive({
      phase: "ending",
      seedToPot: { seed_1: "pot_1", seed_2: "pot_1", seed_4: "pot_3" },
    }),
  });
  assert.deepEqual(result.completed, []);
  assert.equal(result.active.taskId, "forest/sprout/plant");
  assert.equal(result.active.phase, "play");
  assert.deepEqual(result.active.seedToPot, { seed_1: "pot_1" });
  assert.deepEqual(result.active.potToSlot, {});
  const partial = validateForestProgress({
    active: forestActive({
      phase: "success",
      potToSlot: { pot_1: "circle_1", pot_2: "circle_1", pot_3: "unknown" },
    }),
  });
  assert.equal(partial.active.phase, "play");
  assert.deepEqual(partial.active.potToSlot, { pot_1: "circle_1" });
  assert.equal(
    validateForestProgress({
      active: forestActive({ taskId: "forest/sprout/plant", phase: "ending" }),
    }).active.phase,
    "play",
  );
});

test("completed sprout preserves replay ownership and sanitizes world flags", () => {
  const world = validateWorldProgress({
    ...freshWorldProgress(),
    seenTransitions: ["bakery/forest", "bakery/forest", "unknown"],
    islands: {
      forest: {
        completed: ["forest/sprout", "forest/sprout"],
        active: forestActive(),
      },
    },
  });
  assert.deepEqual(world.islands.forest.completed, ["forest/sprout"]);
  assert.equal(world.islands.forest.active.mode, "replay");
  assert.deepEqual(world.seenTransitions, ["bakery/forest"]);
  assert.equal(
    validateWorldProgress({ ...world, lastVisitedIslandId: "bad" })
      .lastVisitedIslandId,
    "bakery",
  );
});

test("missing or corrupt world does not readjust legacy bakery or write on construction", () => {
  for (const value of [null, "{broken", JSON.stringify({ version: 0 })]) {
    const bakery = JSON.stringify({
      ...freshProgress(),
      completed: ["opening"],
      voice: false,
    });
    const storage = memory({
      [BAKERY_KEY]: bakery,
      ...(value === null ? {} : { [WORLD_KEY]: value }),
    });
    const store = createWorldStore(storage);
    assert.deepEqual(store.snapshot().progress, freshWorldProgress());
    assert.equal(storage.writes, 0);
    store.save({ ...freshWorldProgress(), lastVisitedIslandId: "forest" });
    assert.equal(storage.getItem(BAKERY_KEY), bakery);
  }
});

test("newer world and inaccessible storage stay in memory and preserve original text", () => {
  const original = JSON.stringify({ version: 99, secretFutureField: [1, 2] });
  const storage = memory({ [WORLD_KEY]: original });
  const store = createWorldStore(storage);
  assert.equal(store.snapshot().status, "newer-version");
  store.save({ ...freshWorldProgress(), lastVisitedIslandId: "forest" });
  store.resetAdventure("reset_1");
  assert.equal(storage.getItem(WORLD_KEY), original);
  assert.equal(storage.writes, 0);
  const inaccessible = createWorldStore({
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
  });
  assert.equal(inaccessible.snapshot().writable, false);
  assert.equal(inaccessible.save(freshWorldProgress()).status, "read-failed");
});

test("write failure retains in-memory progress and can retry without touching bakery", () => {
  const storage = memory();
  storage.failAt = 1;
  const store = createWorldStore(storage);
  const next = { ...freshWorldProgress(), lastVisitedIslandId: "forest" };
  assert.equal(store.save(next).status, "write-failed");
  assert.equal(store.snapshot().progress.lastVisitedIslandId, "forest");
  assert.equal(store.save(next).status, "ready");
  assert.equal(storage.getItem(BAKERY_KEY), null);
});

test("external world change pauses writes even when not notified by a storage event", () => {
  const storage = memory();
  const store = createWorldStore(storage);
  const other = JSON.stringify({
    ...freshWorldProgress(),
    lastVisitedIslandId: "forest",
  });
  storage.data.set(WORLD_KEY, other);
  assert.equal(store.checkExternalChange().status, "conflict");
  store.save(freshWorldProgress());
  store.resetAdventure("reset_2");
  assert.equal(storage.getItem(WORLD_KEY), other);
  assert.equal(storage.writes, 0);
});

test("reset intent write failure leaves bakery completely unchanged", () => {
  const bakery = JSON.stringify({ ...freshProgress(), completed: ["opening"] });
  const storage = memory({ [BAKERY_KEY]: bakery });
  storage.failAt = 1;
  assert.equal(
    createWorldStore(storage).resetAdventure("confirmed_reset").status,
    "write-failed",
  );
  assert.equal(storage.getItem(BAKERY_KEY), bakery);
  assert.equal(storage.getItem(WORLD_KEY), null);
});

test("each cross-key reset interruption resumes idempotently and keeps unrelated keys", () => {
  for (const failAt of [2, 3]) {
    const storage = memory({
      [BAKERY_KEY]: JSON.stringify({
        ...freshProgress(),
        completed: ["opening"],
      }),
      unrelated: "keep",
    });
    storage.failAt = failAt;
    const store = createWorldStore(storage);
    assert.equal(
      store.resetAdventure("confirmed_reset").status,
      "reset-pending",
    );
    assert.equal(
      JSON.parse(storage.getItem(WORLD_KEY)).resetIntent.id,
      "confirmed_reset",
    );
    const restored = createWorldStore(storage);
    assert.equal(restored.resumeReset().status, "ready");
    assert.deepEqual(JSON.parse(storage.getItem(BAKERY_KEY)), freshProgress());
    assert.deepEqual(
      JSON.parse(storage.getItem(WORLD_KEY)),
      freshWorldProgress(),
    );
    const writes = storage.writes;
    restored.resumeReset();
    assert.equal(storage.writes, writes);
    assert.equal(storage.getItem("unrelated"), "keep");
  }
});

test("world writes preserve every legacy phase and cannot inject a reset intent", () => {
  for (const phase of ["intro", "play", "success", "ending"]) {
    const bakery = JSON.stringify({
      ...freshProgress(),
      completed: ["opening"],
      active: { episodeId: "rabbit", step: 0, phase, moved: [0], help: 2 },
      voice: false,
      placed: [],
    });
    const storage = memory({ [BAKERY_KEY]: bakery });
    const store = createWorldStore(storage);
    store.save({
      ...freshWorldProgress(),
      resetIntent: { id: "unconfirmed", scope: "adventure" },
      islands: {
        forest: {
          completed: [],
          active: forestActive({ potToSlot: { pot_1: "circle_2" } }),
        },
      },
    });
    assert.equal(storage.getItem(BAKERY_KEY), bakery);
    assert.equal(JSON.parse(storage.getItem(WORLD_KEY)).resetIntent, null);
    assert.deepEqual(
      createWorldStore(storage).snapshot().progress,
      store.snapshot().progress,
    );
  }
});

test("pending reset blocks ordinary writes until recovery finishes", () => {
  const storage = memory();
  storage.failAt = 2;
  const store = createWorldStore(storage);
  store.resetAdventure("confirmed_reset");
  const original = storage.getItem(WORLD_KEY);
  store.save({ ...freshWorldProgress(), lastVisitedIslandId: "forest" });
  assert.equal(storage.getItem(WORLD_KEY), original);
  assert.equal(store.resumeReset().status, "ready");
});

test("newer bakery data is never cleared by a world reset recovery", () => {
  const bakery = JSON.stringify({ version: 2, completed: ["future"] });
  const storage = memory({ [BAKERY_KEY]: bakery });
  const store = createWorldStore(storage);
  assert.equal(store.resetAdventure("confirmed_reset").status, "newer-version");
  assert.equal(storage.getItem(BAKERY_KEY), bakery);
  assert(JSON.parse(storage.getItem(WORLD_KEY)).resetIntent);
});

test("external clear locks all writers even when the world key was absent", () => {
  const storage = memory({
    [BAKERY_KEY]: JSON.stringify({
      ...freshProgress(),
      completed: ["opening"],
    }),
  });
  const store = createWorldStore(storage);
  storage.data.clear();
  assert.equal(store.pauseForExternalChange().status, "conflict");
  assert.equal(store.snapshot().writable, false);
  store.save({ ...freshWorldProgress(), lastVisitedIslandId: "forest" });
  store.resetAdventure("after_external_clear");
  assert.equal(store.checkExternalChange().writable, false);
  assert.equal(storage.writes, 0);
  assert.equal(storage.getItem(WORLD_KEY), null);
  assert.equal(storage.getItem(BAKERY_KEY), null);
  assert.equal(createWorldStore(storage).snapshot().writable, true);
});

test("external bakery-only changes keep the world store paused with unchanged world text", () => {
  const original = JSON.stringify(freshWorldProgress());
  const storage = memory({ [WORLD_KEY]: original });
  const store = createWorldStore(storage);
  storage.data.set(
    BAKERY_KEY,
    JSON.stringify({ ...freshProgress(), voice: false }),
  );
  assert.equal(store.pauseForExternalChange().writable, false);
  store.save({ ...freshWorldProgress(), lastVisitedIslandId: "forest" });
  assert.equal(store.pauseForExternalChange().status, "conflict");
  assert.equal(storage.getItem(WORLD_KEY), original);
  assert.equal(storage.writes, 0);
});

test("external-change notification preserves existing newer-version protection", () => {
  const original = JSON.stringify({ version: 99, future: "keep" });
  const storage = memory({ [WORLD_KEY]: original });
  const store = createWorldStore(storage);
  assert.equal(store.pauseForExternalChange().status, "newer-version");
  assert.equal(store.pauseForExternalChange().writable, false);
  assert.equal(storage.getItem(WORLD_KEY), original);
  assert.equal(storage.writes, 0);
});
