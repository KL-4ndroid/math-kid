import { BAKERY_KEY, freshProgress } from '../bakery/progress.js';
import { getIsland } from './islands.js';

export const WORLD_KEY = 'magic-math-world-v1';
const EPISODE = 'forest/sprout';
const PLANT = `${EPISODE}/plant`;
const REARRANGE = `${EPISODE}/rearrange`;
const seeds = ['seed_1', 'seed_2', 'seed_3'];
const pots = ['pot_1', 'pot_2', 'pot_3'];
const slots = ['circle_1', 'circle_2', 'circle_3'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function freshWorldProgress() {
  return { version: 1, lastVisitedIslandId: 'bakery', seenTransitions: [], resetIntent: null, islands: { forest: { completed: [], active: null } } };
}

function uniqueMapping(raw, keys, values) {
  const result = {};
  if (!record(raw)) return result;
  for (const key of keys) {
    if (values.includes(raw[key]) && !Object.values(result).includes(raw[key])) result[key] = raw[key];
  }
  return result;
}

export function validateForestProgress(raw) {
  const completed = Array.isArray(raw?.completed) && raw.completed.includes(EPISODE) ? [EPISODE] : [];
  const result = { completed, active: null };
  const active = raw?.active;
  if (!record(active) || active.episodeId !== EPISODE) return result;
  let taskId = active.taskId === REARRANGE ? REARRANGE : PLANT;
  let phase = ['intro', 'play', 'success', 'ending'].includes(active.phase) ? active.phase : 'play';
  const seedToPot = uniqueMapping(active.seedToPot, seeds, pots);
  let potToSlot = uniqueMapping(active.potToSlot, pots, slots);
  const planted = Object.keys(seedToPot).length === 3;
  if (!planted) { taskId = PLANT; potToSlot = {}; }
  if (taskId === PLANT) potToSlot = {};
  const complete = taskId === PLANT ? planted : Object.keys(potToSlot).length === 3;
  if ((phase === 'success' && !complete) || (phase === 'ending' && (taskId !== REARRANGE || !complete))) phase = 'play';
  if (!planted && active.taskId === REARRANGE) phase = 'play';
  if (![PLANT, REARRANGE].includes(active.taskId) || (phase === 'intro' && (Object.keys(seedToPot).length || Object.keys(potToSlot).length))) phase = 'play';
  result.active = { episodeId: EPISODE, taskId, phase, mode: completed.length ? 'replay' : 'story', seedToPot, potToSlot };
  return result;
}

export function validateWorldProgress(raw) {
  if (!record(raw) || raw.version !== 1) return freshWorldProgress();
  const result = freshWorldProgress();
  if (getIsland(raw.lastVisitedIslandId)) result.lastVisitedIslandId = raw.lastVisitedIslandId;
  // Only transitions delivered by this client may become persistent flags.
  result.seenTransitions = Array.isArray(raw.seenTransitions) && raw.seenTransitions.includes('bakery/forest') ? ['bakery/forest'] : [];
  if (record(raw.resetIntent) && typeof raw.resetIntent.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(raw.resetIntent.id) && raw.resetIntent.scope === 'adventure') {
    result.resetIntent = { id: raw.resetIntent.id, scope: 'adventure' };
  }
  result.islands.forest = validateForestProgress(raw.islands?.forest);
  return result;
}

function decode(text) {
  if (text === null) return { progress: freshWorldProgress(), status: 'missing', writable: true };
  try {
    const raw = JSON.parse(text);
    if (record(raw) && typeof raw.version === 'number' && raw.version > 1) return { progress: freshWorldProgress(), status: 'newer-version', writable: false };
    if (!record(raw) || raw.version !== 1) return { progress: freshWorldProgress(), status: 'corrupt', writable: true };
    return { progress: validateWorldProgress(raw), status: 'ready', writable: true };
  } catch {
    return { progress: freshWorldProgress(), status: 'corrupt', writable: true };
  }
}

export const storageMessages = {
  'newer-version': '這份冒險進度來自較新的版本，這次暫存遊玩，原始資料會保留。',
  'read-failed': '目前無法讀取冒險進度，這次會暫存遊玩。',
  'write-failed': '目前無法保存冒險進度，這次的操作暫存在記憶體。',
  conflict: '另一個分頁已更新冒險進度。請重新載入後繼續；本頁已暫停保存。',
  'reset-pending': '冒險重設尚未全部保存，重新載入後會繼續完成。',
  corrupt: '冒險進度無法完整讀取，麵包店原有進度不受影響。',
};

// Storage is injected so failures and cross-key interruptions can be tested without a browser.
export function createWorldStore(storage) {
  let text;
  let state;
  try { text = storage.getItem(WORLD_KEY); state = decode(text); }
  catch { state = { progress: freshWorldProgress(), status: 'read-failed', writable: false }; }
  const report = () => ({ ...state, message: storageMessages[state.status] ?? '' });
  const conflict = () => {
    if (!state.writable) return true;
    try {
      if (storage.getItem(WORLD_KEY) !== text) {
        state = { ...state, writable: false, status: 'conflict' };
        return true;
      }
    } catch { state = { ...state, writable: false, status: 'read-failed' }; return true; }
    return false;
  };
  const write = progress => {
    const nextText = JSON.stringify(progress);
    storage.setItem(WORLD_KEY, nextText);
    text = nextText;
    state = { progress, writable: true, status: 'ready' };
  };
  const resumeReset = () => {
    if (!state.progress.resetIntent || conflict()) return report();
    try {
      const bakeryText = storage.getItem(BAKERY_KEY);
      if (bakeryText !== null) {
        let bakery;
        try { bakery = JSON.parse(bakeryText); } catch { bakery = null; }
        if (bakery?.version > 1) {
          state = { ...state, writable: false, status: 'newer-version' };
          return report();
        }
      }
      storage.setItem(BAKERY_KEY, JSON.stringify(freshProgress()));
      write(freshWorldProgress());
    } catch { state = { ...state, status: 'reset-pending' }; }
    return report();
  };
  return {
    snapshot: report,
    checkExternalChange: () => { conflict(); return report(); },
    save(progress) {
      const next = validateWorldProgress({ ...progress, resetIntent: null });
      if (state.progress.resetIntent) return report();
      if (conflict()) { state = { ...state, progress: next }; return report(); }
      state = { ...state, progress: next };
      try { write(next); } catch { state = { ...state, status: 'write-failed' }; }
      return report();
    },
    resetAdventure(id) {
      if (state.progress.resetIntent) return resumeReset();
      if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new TypeError('A stable reset intent ID is required');
      if (conflict()) return report();
      try {
        // Persist intent before touching the legacy key; a failed intent write cannot clear it.
        write({ ...state.progress, resetIntent: { id, scope: 'adventure' } });
      } catch { state = { ...state, status: 'write-failed' }; return report(); }
      return resumeReset();
    },
    resumeReset,
  };
}
