import { episodes } from '../bakery/chapter.js';
import { validateProgress } from '../bakery/progress.js';

export function bakerySnapshot(raw) {
  const progress = validateProgress(raw);
  const completed = episodes.every(episode => progress.completed.includes(episode.id));
  return {
    completedEpisodeIds: progress.completed,
    active: progress.active,
    complete: completed,
    eligibleForForest: completed,
  };
}
