import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";

const server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const executablePath = process.env.BAKERY_EXECUTABLE_PATH;
let browser;
try {
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
  ]) {
    const page = await browser.newPage({
      viewport,
      hasTouch: true,
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const read = () =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("magic-math-bakery-v1")),
      );
    const session = await page.context().newCDPSession(page);
    const send = (type, points) =>
      session.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: points.map((point) => ({
          ...point,
          radiusX: 5,
          radiusY: 5,
          force: 1,
        })),
      });
    async function positions(step) {
      await page.locator(".workbench-canvas").scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => document.querySelector("canvas")?.width > 300,
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      return page.evaluate(async (step) => {
        const { PerspectiveCamera, Vector3 } =
          await import("/node_modules/three/build/three.module.js");
        const { workbenchLayout, slotPoint } =
          await import("/src/bakery/layout.js");
        const rect = document.querySelector("canvas").getBoundingClientRect();
        const layout = workbenchLayout(rect.width);
        const camera = new PerspectiveCamera(
          49,
          rect.width / rect.height,
          0.1,
          1000,
        );
        camera.position.set(...layout.camera);
        camera.lookAt(0, 1.2, 0);
        camera.updateMatrixWorld();
        const count = step === 0 ? 1 : 2;
        return [
          ...Array.from({ length: count }, (_, i) =>
            slotPoint(layout, layout.source, i),
          ),
          layout.target,
        ].map((point) => {
          const p = new Vector3(...point).project(camera);
          return {
            x: rect.left + ((p.x + 1) * rect.width) / 2,
            y: rect.top + ((1 - p.y) * rect.height) / 2,
          };
        });
      }, step);
    }
    async function drag(from, to, cancel = false) {
      await send("touchStart", [{ ...from, id: 1 }]);
      for (let i = 1; i <= 10; i++)
        await send("touchMove", [
          {
            id: 1,
            x: from.x + ((to.x - from.x) * i) / 10,
            y: from.y + ((to.y - from.y) * i) / 10,
          },
        ]);
      await send(cancel ? "touchCancel" : "touchEnd", []);
    }
    await page.goto(server.resolvedUrls.local[0]);
    await page.getByRole("button", { name: "聲音開啟", exact: true }).tap();
    await page.getByRole("button", { name: "和阿栗一起開始" }).tap();
    await page.getByRole("button", { name: "我來幫忙" }).tap();
    let points = await positions(0);
    await drag(points[0], points[1], true);
    assert.deepEqual((await read()).active.moved, []);
    await drag(points[0], points[1]);
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("magic-math-bakery-v1")).active.moved
          .length === 1,
    );
    await page.reload();
    await page.getByRole("button", { name: "繼續上次的小幫忙" }).tap();
    await page.getByRole("button", { name: "答案 3", exact: true }).tap();
    assert.equal((await read()).active.phase, "success");
    await page.getByRole("button", { name: "接著幫下一個忙" }).tap();
    points = await positions(1);
    await page.touchscreen.tap(points[0].x, points[0].y);
    await page.touchscreen.tap(points[2].x, points[2].y);
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("magic-math-bakery-v1")).active.moved
          .length === 1,
    );
    // Wait for the animation input lock using the existing accessible control.
    await page
      .getByRole("button", { name: "選第 2 個可頌", exact: true })
      .waitFor();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent === "選第 2 個可頌" && !button.disabled,
      ),
    );
    points = await positions(1);
    await drag(points[1], points[2]);
    await page
      .getByRole("button", { name: "補滿了，看看接下來的故事" })
      .waitFor();
    const beforeCount = await read();
    await page.getByRole("button", { name: "一起數一數", exact: true }).tap();
    await page.getByText("正在數第 1 個。", { exact: false }).waitFor();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (button) =>
          button.textContent === "補滿了，看看接下來的故事" && !button.disabled,
      ),
    );
    assert.deepEqual(await read(), beforeCount);
    await page.getByRole("button", { name: "補滿了，看看接下來的故事" }).tap();
    await page.getByRole("button", { name: "看看故事結尾" }).tap();
    await page.getByRole("button", { name: "收下禮物，回到麵包店" }).tap();
    await page.locator(".bk-scene-3d").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => document.querySelector("canvas")?.width > 300,
    );
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const sign = await page.evaluate(async () => {
      const { PerspectiveCamera, Vector3 } =
        await import("/node_modules/three/build/three.module.js");
      const rect = document.querySelector("canvas").getBoundingClientRect();
      const camera = new PerspectiveCamera(
        38,
        rect.width / rect.height,
        0.1,
        1000,
      );
      camera.position.set(0, 4, 12);
      camera.lookAt(0, 1.2, 1);
      camera.updateMatrixWorld();
      return [
        [0, 0.85, 3.5],
        [0, 2.85, 2.65],
      ].map((point) => {
        const p = new Vector3(...point).project(camera);
        return {
          x: rect.left + ((p.x + 1) * rect.width) / 2,
          y: rect.top + ((1 - p.y) * rect.height) / 2,
        };
      });
    });
    await send("touchStart", [{ ...sign[0], id: 1 }]);
    await send("touchMove", [{ ...sign[0], x: sign[0].x + 20, id: 1 }]);
    await send("touchStart", [
      { ...sign[0], x: sign[0].x + 20, id: 1 },
      { ...sign[1], id: 2 },
    ]);
    await send("touchCancel", []);
    assert.deepEqual((await read()).placed, []);
    await drag(sign[0], sign[1]);
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem("magic-math-bakery-v1")).placed.includes(
        "sign",
      ),
    );
    await page.reload();
    assert((await read()).placed.includes("sign"));
    assert.deepEqual(errors, []);
    assert.equal(
      await page
        .locator(".bakery-shell")
        .evaluate((element) => element.scrollWidth > element.clientWidth),
      false,
    );
    console.log(
      `PASS ${viewport.width}×${viewport.height}: normal-motion first story, native touch drag/tap, cancel, committed resume, visual counting, secondary-touch sign cancellation and install persistence`,
    );
    await session.detach();
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
