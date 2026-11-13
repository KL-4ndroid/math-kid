import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { freshProgress } from "../src/bakery/progress.js";
import { freshWorldProgress } from "../src/world/progress.js";

// A React-only harness checks callback changes without relying on WebGL or R3F timing.
const placementHarness = `
import { createElement, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Plane, Ray, Vector3 } from 'three';
import { useObjectPlacement } from '/src/shared/interaction/useObjectPlacement.js';
const target = { setPointerCapture(){}, releasePointerCapture(){} };
function Harness() {
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(0);
  const [drops, setDrops] = useState(0);
  const placement = useObjectPlacement({
    disabled: false, sourcePosition: () => new Vector3(),
    plane: new Plane(new Vector3(0, 1, 0), 0), acceptsDrop: () => true,
    onSelect: id => { setSelected(id); window.lastSelectRevision = revision; },
    onDrop: () => { setDrops(value => value + 1); setSelected(null); window.lastDropRevision = revision; },
  });
  window.placementState = { selected, revision, drops, dragId: placement.dragId };
  const handlers = placement.sourceHandlers('seed_1');
  const event = { nativeEvent: {isPrimary: true, clientX: 30, clientY: 30},
    button: 0, pointerId: 1, target, stopPropagation(){},
    ray: new Ray(new Vector3(1, 2, 1), new Vector3(0, -1, 0)) };
  return createElement('div', {},
    createElement('button', {onClick: () => handlers.onPointerDown(event)}, 'select'),
    createElement('button', {onClick: () => setRevision(value => value + 1)}, 'rerender'),
    createElement('button', {onClick: () => handlers.onPointerMove({...event, nativeEvent: {...event.nativeEvent, clientX: 70}})}, 'move'),
    createElement('button', {onClick: () => handlers.onPointerUp(event)}, 'drop'));
}
createRoot(document.getElementById('root')).render(createElement(StrictMode, {}, createElement(Harness)));
`;
const server = await createServer({
  server: { host: "127.0.0.1", port: 0 },
  plugins: [
    {
      name: "placement-reliability-harness",
      resolveId(id) {
        if (id === "/placement-harness.mjs") return "\0placement-harness.mjs";
      },
      load(id) {
        if (id === "\0placement-harness.mjs") return placementHarness;
      },
      configureServer(vite) {
        vite.middlewares.use((request, response, next) => {
          if (request.url === "/placement-harness") {
            response.setHeader("Content-Type", "text/html");
            response.end(
              '<div id="root"></div><script type="module" src="/placement-harness.mjs"></script>',
            );
          } else next();
        });
      },
    },
  ],
});
await server.listen();
const url = server.resolvedUrls.local[0];
const bakeryKey = "magic-math-bakery-v1";
const worldKey = "magic-math-world-v1";
let browser;
async function storageOnlyPage(context) {
  const page = await context.newPage();
  // Storage cases also exercise the existing accessible WebGL fallback, avoiding GPU dependence.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).includes("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  return page;
}
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), bakeryKey);
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
  {
    const context = await browser.newContext();
    const page = await storageOnlyPage(context);
    await page.addInitScript((key) => {
      if (!sessionStorage.reliabilitySeeded) {
        localStorage.setItem(key, "{broken");
        sessionStorage.reliabilitySeeded = "1";
      }
    }, bakeryKey);
    await page.goto(url);
    await page.getByRole("button", { name: "家長設定", exact: true }).click();
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), bakeryKey),
      "{broken",
    );
    await page
      .getByRole("button", { name: "重新開始所有故事", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "確定", exact: true })
      .click();
    await page
      .getByRole("button", { name: "和阿栗一起開始", exact: true })
      .click();
    await page.getByRole("button", { name: "我來幫忙", exact: true }).click();
    await page
      .getByRole("button", { name: "選第 1 個麵包", exact: true })
      .click();
    await page.getByRole("button", { name: "放到麵包籃", exact: true }).click();
    await page.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).active?.moved.length === 1,
      bakeryKey,
    );
    await page.getByRole("button", { name: "答案 3", exact: true }).click();
    assert.equal((await read(page)).active.phase, "success");
    await page.reload();
    await page
      .getByRole("button", { name: "繼續上次的小幫忙", exact: true })
      .click();
    assert(
      await page
        .getByRole("heading", { name: "你做到了！", exact: true })
        .isVisible(),
    );
    assert.equal((await read(page)).active.phase, "success");
    console.log(
      "PASS corrupt bakery → confirmed reset → saved movement/answer → reload/resume",
    );
    await context.close();
  }
  for (const kind of ["clear", "bakery-update"]) {
    const context = await browser.newContext();
    const page = await storageOnlyPage(context);
    await page.addInitScript(
      ({ key, progress }) => {
        if (!sessionStorage.reliabilitySeeded) {
          localStorage.setItem(key, JSON.stringify(progress));
          sessionStorage.reliabilitySeeded = "1";
        }
      },
      {
        key: bakeryKey,
        progress: { ...freshProgress(), completed: ["opening"] },
      },
    );
    await page.goto(url);
    await page
      .getByRole("button", { name: "和阿栗一起開始", exact: true })
      .waitFor();
    const other = await storageOnlyPage(context);
    await other.goto(url);
    await other
      .getByRole("button", { name: "和阿栗一起開始", exact: true })
      .waitFor();
    assert.equal(
      await other.evaluate((key) => localStorage.getItem(key), worldKey),
      null,
    );
    const external = JSON.stringify({
      ...freshProgress(),
      completed: ["opening", "rabbit"],
      voice: false,
    });
    await other.evaluate(
      ({ kind, key, external }) => {
        if (kind === "clear") localStorage.clear();
        else localStorage.setItem(key, external);
      },
      { kind, key: bakeryKey, external },
    );
    await page
      .getByText("另一個分頁已更新冒險進度", { exact: false })
      .waitFor();
    const expected = kind === "clear" ? null : external;
    await page
      .getByRole("button", { name: "和阿栗一起開始", exact: true })
      .click();
    await page.getByRole("button", { name: "我來幫忙", exact: true }).waitFor();
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), bakeryKey),
      expected,
    );
    // Another world event must not re-enable the old tab's writer.
    const otherWorld = JSON.stringify(freshWorldProgress());
    await other.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: worldKey,
      value: otherWorld,
    });
    await page.getByRole("button", { name: "我來幫忙", exact: true }).click();
    await page
      .getByRole("button", {
        name: "選第 1 個可頌",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), bakeryKey),
      expected,
    );
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), worldKey),
      otherWorld,
    );
    await page.reload();
    await page
      .getByRole("button", { name: "和阿栗一起開始", exact: true })
      .click();
    await page.getByRole("button", { name: "我來幫忙", exact: true }).waitFor();
    await page.waitForFunction(
      (key) => Boolean(JSON.parse(localStorage.getItem(key))?.active),
      bakeryKey,
    );
    assert.equal(
      (await read(page)).active.episodeId,
      kind === "clear" ? "opening" : "bear",
    );
    console.log(
      `PASS actual second-tab ${kind}, unchanged-world protection, sticky write pause and fresh reload`,
    );
    await context.close();
  }
  for (const newer of ["bakery", "world"]) {
    const context = await browser.newContext();
    const page = await storageOnlyPage(context);
    const protectedKey = newer === "bakery" ? bakeryKey : worldKey;
    const original = JSON.stringify({ version: 99, future: "preserve" });
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: protectedKey, value: original },
    );
    await page.goto(url);
    await page
      .getByRole("button", { name: "和阿栗一起開始", exact: true })
      .click();
    await page.getByRole("button", { name: "我來幫忙", exact: true }).click();
    assert.equal(
      await page.evaluate((key) => localStorage.getItem(key), protectedKey),
      original,
    );
    assert(await page.getByText("較新的版本", { exact: false }).isVisible());
    console.log(
      `PASS newer ${newer} version remains protected during in-memory play`,
    );
    await context.close();
  }
  {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}placement-harness`);
    await page.getByRole("button", { name: "select", exact: true }).click();
    await page.waitForFunction(
      () => window.placementState.selected === "seed_1",
    );
    await page.getByRole("button", { name: "rerender", exact: true }).click();
    await page.getByRole("button", { name: "move", exact: true }).click();
    await page.waitForFunction(() => window.placementState.dragId === "seed_1");
    await page.getByRole("button", { name: "drop", exact: true }).click();
    await page.waitForFunction(() => window.placementState.drops === 1);
    assert.equal(await page.evaluate(() => window.lastDropRevision), 1);
    for (const interrupt of ["blur", "pointercancel", "secondary"]) {
      await page.getByRole("button", { name: "select", exact: true }).click();
      await page.getByRole("button", { name: "rerender", exact: true }).click();
      await page.getByRole("button", { name: "move", exact: true }).click();
      await page.evaluate((kind) => {
        window.dispatchEvent(
          kind === "secondary"
            ? new PointerEvent("pointerdown", {
                pointerId: 2,
                isPrimary: false,
              })
            : new Event(kind),
        );
      }, interrupt);
      await page.waitForFunction(
        () =>
          window.placementState.selected === null &&
          window.placementState.dragId === null,
      );
      assert.equal(
        await page.evaluate(() => window.lastSelectRevision),
        await page.evaluate(() => window.placementState.revision),
      );
      assert.equal(await page.evaluate(() => window.placementState.drops), 1);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS inline selection callback, rerender during drag, latest callback and interruption cancellation",
    );
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
