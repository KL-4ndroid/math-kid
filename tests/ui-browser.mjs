import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { freshProgress } from "../src/bakery/progress.js";
import { transition, currentMission } from "../src/bakery/game.js";
import { episodes, taskGoal, taskAnswer } from "../src/bakery/chapter.js";

const moveAll = (progress) => {
  const { task } = currentMission(progress);
  for (let id = 0; id < taskGoal(task); id++)
    progress = transition(progress, { type: "move", id });
  return progress;
};
const moved = moveAll(
  transition(transition(freshProgress(), { type: "start", id: "opening" }), {
    type: "play",
  }),
);
const success = transition(moved, { type: "answer", value: 3 });
let ending = transition(success, { type: "next" });
ending = transition(moveAll(ending), { type: "answer", value: 4 });
ending = transition(ending, { type: "next" });
let complete = freshProgress();
for (const episode of episodes) {
  complete = transition(
    transition(complete, { type: "start", id: episode.id }),
    { type: "play" },
  );
  for (let step = 0; step < 2; step++) {
    const { task } = currentMission(complete);
    complete = transition(moveAll(complete), {
      type: "answer",
      value: taskAnswer(task),
    });
    complete = transition(complete, { type: "next" });
  }
  complete = transition(complete, { type: "claim" });
}
assert.equal(ending.active.phase, "ending");
assert.equal(complete.completed.length, 5);
const server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await server.listen();
let browser;
try {
  const executablePath = process.env.BAKERY_EXECUTABLE_PATH;
  browser = await chromium.launch({
    executablePath,
    channel: executablePath
      ? undefined
      : process.env.BAKERY_BROWSER || "msedge",
    headless: true,
    args: executablePath ? ["--no-sandbox", "--enable-unsafe-swiftshader"] : [],
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 320, height: 568 },
  ]) {
    const page = await browser.newPage({
      viewport,
      reducedMotion: "reduce",
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.uiVoiceTexts = [];
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          speaking: false,
          cancel() {},
          getVoices: () => [],
          speak(utterance) {
            window.uiVoiceTexts.push(utterance.text);
            utterance.onstart?.();
            queueMicrotask(() => utterance.onend?.());
          },
        },
      });
    });
    async function load(progress) {
      await page.goto(server.resolvedUrls.local[0]);
      await page.evaluate(
        (value) =>
          localStorage.setItem("magic-math-bakery-v1", JSON.stringify(value)),
        progress,
      );
      await page.reload();
      if (progress.active)
        await page.getByRole("button", { name: "繼續上次的小幫忙" }).tap();
    }
    async function within(locator, minHeight = 56) {
      if (viewport.height < 768) await locator.scrollIntoViewIfNeeded();
      const rect = await locator.boundingBox();
      assert(rect && rect.height >= minHeight);
      assert(rect.x >= 0 && rect.x + rect.width <= viewport.width);
      assert(
        rect.y >= 0 && rect.y + rect.height <= viewport.height,
        JSON.stringify({ viewport, rect }),
      );
    }
    await load(moved);
    for (const n of [1, 2, 3, 4, 5]) {
      const button = page.getByRole("button", {
        name: `答案 ${n}`,
        exact: true,
      });
      const rect = await button.boundingBox();
      assert(rect.width >= 56 && rect.height >= 80);
      if (viewport.height >= 768) await within(button, 80);
    }
    assert.equal(
      await page
        .locator(".bakery-shell")
        .evaluate((element) => element.scrollWidth > element.clientWidth),
      false,
    );
    await load(success);
    await within(page.getByRole("button", { name: "接著幫下一個忙" }), 80);
    const listen = page.getByRole("button", { name: "再聽一次", exact: true });
    await listen.tap();
    assert((await page.evaluate(() => window.uiVoiceTexts.length)) > 0);
    await load(ending);
    await page.getByRole("button", { name: "再聽一次", exact: true }).tap();
    assert((await page.evaluate(() => window.uiVoiceTexts.length)) > 0);
    await within(
      page.getByRole("button", { name: "收下禮物，回到麵包店" }),
      80,
    );
    await load(complete);
    await page.getByRole("button", { name: "一起烤點心", exact: true }).tap();
    assert(
      await page
        .getByRole("heading", { name: "一起烤點心", exact: true })
        .isVisible(),
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("magic-math-bakery-v1")).completed
            .length,
      ),
      5,
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${viewport.width}×${viewport.height}: quantity card size, layout, success/ending voice replay, complete-story free-play entry and saved progress`,
    );
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
