export const WORKBENCH_FOV = 49;
const TAN_HALF_FOV = Math.tan((WORKBENCH_FOV / 2) * (Math.PI / 180));
const TARGET = [0, 1.2, 0];

export function workbenchLayout(width) {
  if (width < 600) {
    return {
      portrait: true,
      camera: [0, 6.2, 3.5],
      source: [0, 1.35, 1.5],
      target: [0, 1.35, -1.5],
      board: { position: [0, 0.98, 0], scale: [5.4, 0.35, 6] },
      slot: (i) => [((i % 3) - 1) * 1.3, 0.13, Math.floor(i / 3) * 0.88 - 0.42],
      hitRadius: 0.6,
      dropHalf: { x: 1.95, z: 1.45 },
      fox: [-1.95, 0.5, 0],
    };
  }
  return {
    portrait: false,
    camera: [0, 7, 6],
    source: [-2.05, 1.35, 0],
    target: [2.05, 1.35, 0],
    board: { position: [0, 0.98, 0], scale: [8.2, 0.35, 3.25] },
    slot: (i) => [((i % 3) - 1) * 0.98, 0.13, Math.floor(i / 3) * 0.88 - 0.42],
    hitRadius: 0.5,
    dropHalf: { x: 1.9, z: 1.3 },
    fox: [-3.15, 0, -2],
  };
}

export function slotPoint(layout, origin, index) {
  const [sx, sy, sz] = layout.slot(index);
  return [origin[0] + sx, origin[1] + sy, origin[2] + sz];
}

function normalize(vector) {
  const length = Math.hypot(...vector);
  return vector.map((value) => value / length);
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function projectPoint(layout, point, viewport) {
  const forward = normalize(TARGET.map((value, i) => value - layout.camera[i]));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const offset = point.map((value, i) => value - layout.camera[i]);
  const depth = dot(offset, forward);
  const aspect = viewport.width / viewport.height;
  return {
    x:
      viewport.width / 2 +
      (dot(offset, right) / depth / (TAN_HALF_FOV * aspect)) *
        (viewport.width / 2),
    y:
      viewport.height / 2 -
      (dot(offset, up) / depth / TAN_HALF_FOV) * (viewport.height / 2),
    depth,
  };
}

export function hitDiameterPixels(layout, point, viewport) {
  const { depth } = projectPoint(layout, point, viewport);
  return (layout.hitRadius / depth / TAN_HALF_FOV) * viewport.height;
}

export function hitSpacingPixels(layout, origin, viewport) {
  const first = projectPoint(layout, slotPoint(layout, origin, 0), viewport);
  const second = projectPoint(layout, slotPoint(layout, origin, 1), viewport);
  return Math.hypot(first.x - second.x, first.y - second.y);
}
