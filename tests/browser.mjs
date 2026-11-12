import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { episodes, rewards, taskGoal, taskAnswer } from '../src/bakery/chapter.js';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: process.env.BAKERY_BROWSER || 'msedge', headless: true });
const readProgress = page => page.evaluate(() => JSON.parse(localStorage.getItem('magic-math-bakery-v1')));
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    for (const episode of episodes) {
      await page.getByRole('button', { name: '和阿栗一起開始' }).click();
      await page.getByRole('button', { name: '我來幫忙' }).click();
      for (const [step, task] of episode.tasks.entries()) {
        const before = await readProgress(page);
        await page.getByRole('button', { name: '看我做', exact: true }).click();
        await page.getByRole('button', { name: '換我玩', exact: true }).click();
        assert.deepEqual(await readProgress(page), before);
        for (let id = 0; id < taskGoal(task); id++) {
          const source = page.getByRole('button', { name: `選第 ${id + 1} 個${task.name}`, exact: true });
          await source.focus();
          await page.keyboard.press('Enter');
          const destination = page.getByRole('button', { name: `放到${task.destination}`, exact: true });
          await destination.focus();
          await page.keyboard.press('Enter');
        }
        if (task.type === 'fill') await page.getByRole('button', { name: '補滿了，看看接下來的故事' }).click();
        else await page.getByRole('button', { name: `答案 ${taskAnswer(task)}`, exact: true }).click();
        await page.getByRole('button', { name: step ? '看看故事結尾' : '接著幫下一個忙' }).click();
      }
      await page.reload();
      await page.getByRole('button', { name: '繼續上次的小幫忙' }).click();
      await page.getByRole('button', { name: '收下禮物，回到麵包店' }).click();
      const reward = rewards.find(value => value.id === episode.reward);
      await page.getByRole('button', { name: reward.name, exact: false }).click();
      assert((await readProgress(page)).placed.includes(reward.id));
      await page.getByRole('button', { name: '故事冒險', exact: true }).click();
    }
    assert.equal((await readProgress(page)).completed.length, 5);
    await page.getByRole('button', { name: '自由烘焙', exact: true }).click();
    assert(await page.getByRole('button', { name: '送出一個', exact: true }).isDisabled());
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: '烤一個', exact: true }).click();
    assert(await page.getByRole('button', { name: '烤一個', exact: true }).isDisabled());
    await page.getByRole('button', { name: '吐司', exact: true }).click();
    assert(await page.getByText('現在有 5 個', { exact: true }).isVisible());
    await page.getByRole('button', { name: '故事冒險', exact: true }).click();
    await page.getByRole('button', { name: '自由烘焙', exact: true }).click();
    assert(await page.getByText('現在有 0 個', { exact: true }).isVisible());
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}×${viewport.height}: ten tasks, keyboard, isolated demos, ending resume, rewards, free baking`);
    await page.close();
  }
  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }]) {
    const touchPage = await browser.newPage({ viewport, hasTouch: true, reducedMotion: 'reduce' });
    await touchPage.goto(url);
    await touchPage.getByRole('button', { name: '和阿栗一起開始' }).tap();
    await touchPage.getByRole('button', { name: '我來幫忙' }).tap();
    for (const [step, task] of episodes[0].tasks.entries()) {
      await touchPage.locator('.workbench-canvas').scrollIntoViewIfNeeded();
      await touchPage.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        return canvas && canvas.width > 300 && canvas.getBoundingClientRect().width > 320;
      });
      await touchPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const points = await touchPage.evaluate(async () => {
        const { PerspectiveCamera, Vector3 } = await import('/node_modules/three/build/three.module.js');
        const rect = document.querySelector('canvas').getBoundingClientRect();
        const { workbenchLayout, slotPoint } = await import('/src/bakery/layout.js');
        const layout = workbenchLayout(rect.width);
        const camera = new PerspectiveCamera(49, rect.width / rect.height, 0.1, 1000);
        camera.position.set(...layout.camera);
        camera.lookAt(0, 1.2, 0);
        camera.updateMatrixWorld();
        return [slotPoint(layout, layout.source, 0), slotPoint(layout, layout.source, 1), layout.target].map(position => {
          const p = new Vector3(...position).project(camera);
          return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2 };
        });
      });
      if (step === 0) {
        const session = await touchPage.context().newCDPSession(touchPage);
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: points[0].x, y: points[0].y }] });
        for (let i = 1; i <= 12; i++) await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: points[0].x + (points[2].x - points[0].x) * i / 12, y: points[0].y + (points[2].y - points[0].y) * i / 12 }],
        });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await session.detach();
        await touchPage.waitForFunction(() => JSON.parse(localStorage.getItem('magic-math-bakery-v1')).active.moved.length === 1);
      }
      for (let id = step === 0 ? 1 : 0; id < taskGoal(task); id++) {
        await touchPage.touchscreen.tap(points[id].x, points[id].y);
        const touchState = await touchPage.evaluate(point => ({ hit: document.elementFromPoint(point.x, point.y)?.outerHTML.slice(0, 180), rect: document.querySelector('canvas').getBoundingClientRect().toJSON(), point }), points[id]);
        assert(await touchPage.getByRole('button', { name: `放到${task.destination}`, exact: true }).isEnabled(), `touch selection ${viewport.width}, step ${step}, item ${id}: ${JSON.stringify(touchState)}`);
        await touchPage.touchscreen.tap(points[2].x, points[2].y);
        await touchPage.waitForFunction(expected => JSON.parse(localStorage.getItem('magic-math-bakery-v1')).active.moved.length === expected, id + 1, { timeout: 3000 });
      }
      if (task.type === 'fill') await touchPage.getByRole('button', { name: '補滿了，看看接下來的故事' }).tap();
      else {
        const answer = touchPage.getByRole('button', { name: '答案 3', exact: true });
        await answer.scrollIntoViewIfNeeded();
        await touchPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await answer.focus();
        await touchPage.keyboard.press('Enter');
        await touchPage.waitForFunction(() => JSON.parse(localStorage.getItem('magic-math-bakery-v1')).active.phase === 'success', null, { timeout: 3000 });
      }
      await touchPage.getByRole('button', { name: step ? '看看故事結尾' : '接著幫下一個忙' }).tap();
    }
    await touchPage.getByRole('button', { name: '收下禮物，回到麵包店' }).tap();
    assert((await readProgress(touchPage)).completed.includes('opening'));
    console.log(`PASS ${viewport.width}×${viewport.height}: opening story with simulated touch drag/tap movement and keyboard numeric answer`);
    await touchPage.close();
  }
  const direct = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await direct.goto(url);
  await direct.getByRole('button', { name: '和阿栗一起開始' }).click();
  await direct.getByRole('button', { name: '我來幫忙' }).click();
  await direct.locator('.workbench-canvas').scrollIntoViewIfNeeded();
  const points = await direct.evaluate(async () => {
    const { PerspectiveCamera, Vector3 } = await import('/node_modules/three/build/three.module.js');
    const rect = document.querySelector('canvas').getBoundingClientRect();
    const { workbenchLayout, slotPoint } = await import('/src/bakery/layout.js');
    const layout = workbenchLayout(rect.width);
    const camera = new PerspectiveCamera(49, rect.width / rect.height, 0.1, 1000);
    camera.position.set(...layout.camera);
    camera.lookAt(0, 1.2, 0);
    camera.updateMatrixWorld();
    return [slotPoint(layout, layout.source, 0), layout.target, [layout.source[0], 1.35, layout.source[2] + 2]].map(position => {
      const point = new Vector3(...position).project(camera);
      return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 };
    });
  });
  const drag = async target => {
    await direct.mouse.move(points[0].x, points[0].y);
    await direct.mouse.down();
    await direct.mouse.move(target.x, target.y, { steps: 12 });
    await direct.mouse.up();
  };
  await drag(points[2]);
  assert.deepEqual((await readProgress(direct)).active.moved, []);
  for (const interruption of ['pointercancel', 'blur', 'secondary']) {
    await direct.mouse.move(points[0].x, points[0].y);
    await direct.mouse.down();
    await direct.mouse.move(points[1].x, points[1].y, { steps: 8 });
    await direct.evaluate(kind => {
      if (kind === 'secondary') window.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, isPrimary: false }));
      else window.dispatchEvent(new Event(kind));
    }, interruption);
    await direct.mouse.up();
    assert.deepEqual((await readProgress(direct)).active.moved, [], interruption);
  }
  await drag(points[1]);
  assert.deepEqual((await readProgress(direct)).active.moved, [0]);
  await direct.reload();
  await direct.getByRole('button', { name: '繼續上次的小幫忙' }).click();
  await direct.getByRole('button', { name: '答案 1', exact: true }).click();
  assert.equal((await readProgress(direct)).active.phase, 'play');
  assert.deepEqual((await readProgress(direct)).active.moved, [0]);
  await direct.getByRole('button', { name: '答案 3', exact: true }).click();
  await direct.getByRole('button', { name: '接著幫下一個忙' }).click();
  await direct.locator('canvas').dispatchEvent('webglcontextlost');
  await direct.getByRole('button', { name: '選第 1 個可頌', exact: true }).click();
  await direct.getByRole('button', { name: '放到展示盤', exact: true }).click();
  assert.deepEqual((await readProgress(direct)).active.moved, [0]);
  console.log('PASS direct drag, outside drop, cancellation, blur, secondary-pointer interference, in-flight reload, wrong answer preservation, context loss');
  await direct.close();
  const speechPage = await browser.newPage();
  await speechPage.addInitScript(() => {
    const utterances = [];
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speaking: false,
      cancel() {},
      getVoices: () => [],
      speak(utterance) { utterances.push(utterance); },
    } });
    window.bakeryTestSpeech = utterances;
  });
  await speechPage.goto(url);
  await speechPage.getByRole('button', { name: '和阿栗一起開始' }).click();
  await speechPage.getByRole('button', { name: '我來幫忙' }).click();
  await speechPage.getByRole('button', { name: '選第 1 個麵包', exact: true }).click();
  await speechPage.getByRole('button', { name: '放到麵包籃', exact: true }).click();
  await speechPage.getByRole('button', { name: '一起數一數', exact: true }).click();
  await speechPage.evaluate(() => window.bakeryTestSpeech.at(-1).onend());
  await speechPage.waitForFunction(() => window.bakeryTestSpeech.at(-1).text === '1');
  assert.equal(await speechPage.getByText('正在數第 1 個。', { exact: false }).count(), 0);
  await speechPage.evaluate(() => window.bakeryTestSpeech.at(-1).onstart());
  assert(await speechPage.getByText('正在數第 1 個。', { exact: false }).isVisible());
  assert(await speechPage.getByRole('button', { name: '再聽一次', exact: true }).isDisabled());
  await speechPage.getByRole('button', { name: '回到麵包店', exact: true }).click();
  await speechPage.evaluate(() => window.bakeryTestSpeech.filter(value => value.text === '1').at(-1).onend());
  await speechPage.getByRole('button', { name: '繼續上次的小幫忙' }).click();
  assert(await speechPage.getByRole('button', { name: '答案 3', exact: true }).isEnabled());
  console.log('PASS speech-start counting highlight and cancellation on return');
  await speechPage.close();
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).includes('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto(url);
  await page.getByRole('button', { name: '和阿栗一起開始' }).click();
  await page.getByRole('button', { name: '我來幫忙' }).click();
  await page.getByRole('button', { name: '選第 1 個麵包', exact: true }).click();
  await page.getByRole('button', { name: '放到麵包籃', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '繼續上次的小幫忙' }).click();
  await page.getByRole('button', { name: '答案 3', exact: true }).click();
  assert(await page.getByRole('heading', { name: '你做到了！' }).isVisible());
  console.log('PASS WebGL unavailable: accessible first task and committed movement resume');
} finally {
  await browser.close();
  await server.close();
}
