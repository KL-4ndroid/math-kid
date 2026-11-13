export const FOREST_FOV = 42;
export const FOREST_IDS = Object.freeze({
  seeds: Object.freeze(['seed_1', 'seed_2', 'seed_3']),
  pots: Object.freeze(['pot_1', 'pot_2', 'pot_3']),
  slots: Object.freeze(['circle_1', 'circle_2', 'circle_3']),
});

export function forestLayout(width) {
  const portrait = width < 600;
  return {
    portrait,
    camera: [0, 6, 6],
    lookAt: [0, 0, 0],
    hitRadius: 0.64,
    sources: [-1.5, 0, 1.5].map(x => [x, 0.45, 1.6]),
    pots: [-1.5, 0, 1.5].map(x => [x, 0.45, -1.55]),
    slots: [[-1.5, 0.45, -1.5], [1.5, 0.45, -1.5], [0, 0.45, 0]],
    board: { position: [0, -0.2, 0], scale: [5.2, 0.35, 5.5] },
  };
}

export function forestPotPosition(layout, potId, potToSlot = {}) {
  const slot = FOREST_IDS.slots.indexOf(potToSlot[potId]);
  if (slot >= 0) return layout.slots[slot];
  return layout.sources[FOREST_IDS.pots.indexOf(potId)] ?? null;
}
