import { episodes, taskGoal, taskAnswer } from './chapter.js';

export const episodeScenes = {
  opening: { scene: 'kitchen', friend: null, items: ['bread', 'croissant'] },
  rabbit: { scene: 'counter', friend: 'rabbit', items: ['croissant', 'toast'] },
  bear: { scene: 'picnic', friend: 'bear', items: ['cupcake', 'cookie'] },
  tea: { scene: 'garden', friend: 'bird', items: ['strawberry', 'cookie'] },
  party: { scene: 'celebration', friend: 'all', items: ['cupcake', 'cupcake'] },
};
export function currentMission(progress) {
  const episode = episodes.find(e => e.id === progress.active?.episodeId);
  if (!episode) return null;
  const task = episode.tasks[progress.active.step];
  return { episode, task, itemId: episodeScenes[episode.id].items[progress.active.step], ...episodeScenes[episode.id] };
}
export function availableSource(task, moved) {
  return Array.from({ length: task.type === 'take' ? task.initial : taskGoal(task) }, (_, i) => i)
    .filter(id => !moved.includes(id));
}
export function resultQuantity(task, moved) {
  return task.type === 'take' ? task.initial - moved.length : task.initial + moved.length;
}
export function ownedRewards(progress) {
  return episodes.filter(e => progress.completed.includes(e.id)).map(e => e.reward);
}
export function transition(progress, action) {
  const mission = currentMission(progress);
  const active = progress.active;
  const patch = data => ({ ...progress, active: { ...active, ...data } });
  switch (action.type) {
    case 'start': {
      const index = episodes.findIndex(e => e.id === action.id);
      if (active || index < 0 || index > progress.completed.length) return progress;
      return { ...progress, active: { episodeId: action.id, step: 0, phase: 'intro', moved: [], help: 0 } };
    }
    case 'play':
      return active?.phase === 'intro' ? patch({ phase: 'play' }) : progress;
    case 'move':
      if (!mission || active.phase !== 'play' || action.locked || active.moved.length >= taskGoal(mission.task) || !availableSource(mission.task, active.moved).includes(action.id)) return progress;
      return patch({ moved: [...active.moved, action.id] });
    case 'answer':
      if (!mission || action.locked || active.phase !== 'play' || active.moved.length !== taskGoal(mission.task)) return progress;
      if (mission.task.type === 'fill' || action.value === taskAnswer(mission.task)) return patch({ phase: 'success' });
      return patch({ help: Math.min(3, active.help + 1) });
    case 'next':
      if (!mission || active.phase !== 'success') return progress;
      return active.step + 1 < mission.episode.tasks.length
        ? patch({ step: active.step + 1, phase: 'play', moved: [], help: 0 })
        : patch({ phase: 'ending' });
    case 'claim': {
      if (!mission || active.phase !== 'ending') return progress;
      return { ...progress, completed: [...new Set([...progress.completed, mission.episode.id])], active: null };
    }
    case 'place':
      if (!ownedRewards(progress).includes(action.id)) return progress;
      return { ...progress, placed: progress.placed.includes(action.id) ? progress.placed.filter(id => id !== action.id) : [...progress.placed, action.id] };
    case 'color':
      return ['sage', 'rose', 'honey'].includes(action.value) ? { ...progress, color: action.value } : progress;
    case 'voice': return { ...progress, voice: !progress.voice };
    case 'abandon': return { ...progress, active: null };
    default: return progress;
  }
}

export const taskInventory = episodes.flatMap(episode => episode.tasks.map((task, step) => ({
  id: `${episode.id}-${step}`, episodeId: episode.id, step,
  scene: episodeScenes[episode.id].scene, itemId: episodeScenes[episode.id].items[step],
  source: task.source, destination: task.destination, initial: task.initial,
  moves: taskGoal(task), answer: taskAnswer(task), type: task.type,
})));
