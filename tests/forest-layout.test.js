import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { FOREST_FOV, FOREST_IDS, forestLayout, forestPotPosition } from '../src/forest/layout.js';

test('forest layout keeps three source targets large and distinct on phone and tablet', () => {
  for (const width of [366, 390, 768, 976]) {
    const layout = forestLayout(width);
    assert.equal(layout.sources.length, 3);
    assert.equal(layout.pots.length, 3);
    for (const point of [...layout.sources, ...layout.pots]) {
      assert(point[0] >= -2.6 && point[0] <= 2.6);
      assert(point[2] >= -2.4 && point[2] <= 2.4);
    }
    assert.equal(new Set(layout.sources.map(point => point.join(','))).size, 3);
  }
});

test('forest projected proxies meet 56px, stay on canvas and exclude neighboring centers', () => {
  for (const [width, height] of [[280, 350], [350, 350], [728, 460], [976, 460]]) {
    const layout = forestLayout(width);
    const camera = new PerspectiveCamera(FOREST_FOV, width / height, 0.1, 100);
    camera.position.set(...layout.camera);
    camera.lookAt(...layout.lookAt);
    camera.updateMatrixWorld();
    const project = point => {
      const p = new Vector3(...point).project(camera);
      const depth = -new Vector3(...point).applyMatrix4(camera.matrixWorldInverse).z;
      return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2, radius: layout.hitRadius * height / (2 * depth * Math.tan(FOREST_FOV * Math.PI / 360)) };
    };
    for (const points of [[...layout.sources, ...layout.pots], [...layout.sources, ...layout.slots]]) {
      const projected = points.map(project);
      for (const [i, p] of projected.entries()) {
        assert(p.radius * 2 >= 56, JSON.stringify({ width, height, p }));
        assert(p.x - p.radius >= 0 && p.x + p.radius <= width && p.y - p.radius >= 0 && p.y + p.radius <= height, JSON.stringify({ width, height, p }));
        for (const [j, other] of projected.entries()) {
          if (i !== j) assert(Math.hypot(p.x - other.x, p.y - other.y) > p.radius);
        }
      }
    }
  }
});

test('forest pot positions use stable IDs and never duplicate a placed pot', () => {
  const layout = forestLayout(390);
  const potToSlot = { pot_1: 'circle_2', pot_2: 'circle_1' };
  assert.deepEqual(forestPotPosition(layout, 'pot_1', potToSlot), layout.slots[1]);
  assert.deepEqual(forestPotPosition(layout, 'pot_2', potToSlot), layout.slots[0]);
  assert.deepEqual(forestPotPosition(layout, 'pot_3', potToSlot), layout.sources[2]);
  assert.deepEqual(FOREST_IDS.pots, ['pot_1', 'pot_2', 'pot_3']);
});
