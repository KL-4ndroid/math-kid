import { useEffect, useState } from "react";
import { episodes, rewards, taskGoal } from "./chapter.js";
export const BAKERY_KEY = "magic-math-bakery-v1";
export const freshProgress = () => ({
  version: 1,
  completed: [],
  active: null,
  placed: [],
  color: "sage",
  voice: true,
});
export function validateProgress(raw) {
  const result = freshProgress();
  if (!raw || raw.version !== 1) return result;
  // Only accept a completed prefix; chapters always have a causal order.
  for (const episode of episodes) {
    if (!Array.isArray(raw.completed) || !raw.completed.includes(episode.id))
      break;
    result.completed.push(episode.id);
  }
  result.placed = rewards
    .filter(
      (reward, i) =>
        i < result.completed.length &&
        Array.isArray(raw.placed) &&
        raw.placed.includes(reward.id),
    )
    .map((r) => r.id);
  if (["sage", "rose", "honey"].includes(raw.color)) result.color = raw.color;
  if (typeof raw.voice === "boolean") result.voice = raw.voice;
  const active = raw.active;
  const index = episodes.findIndex((e) => e.id === active?.episodeId);
  if (
    index >= 0 &&
    index <= result.completed.length &&
    Number.isInteger(active.step) &&
    active.step >= 0 &&
    active.step < episodes[index].tasks.length
  ) {
    const task = episodes[index].tasks[active.step];
    const moved = Array.isArray(active.moved)
      ? [
          ...new Set(
            active.moved.filter(
              (n) =>
                Number.isInteger(n) &&
                n >= 0 &&
                n < (task.type === "take" ? task.initial : taskGoal(task)),
            ),
          ),
        ].slice(0, taskGoal(task))
      : [];
    const phase = ["intro", "play", "success", "ending"].includes(active.phase)
      ? active.phase
      : "intro";
    result.active = {
      episodeId: active.episodeId,
      step: active.step,
      moved,
      phase:
        ["success", "ending"].includes(phase) && moved.length !== taskGoal(task)
          ? "play"
          : phase,
      help: Math.min(3, Math.max(0, Number(active.help) || 0)),
    };
  }
  return result;
}
export function useBakeryProgress() {
  const [progress, setProgress] = useState(() => {
    try {
      return validateProgress(JSON.parse(localStorage.getItem(BAKERY_KEY)));
    } catch {
      return freshProgress();
    }
  });
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(BAKERY_KEY, JSON.stringify(progress));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [progress]);
  return [progress, setProgress, saved];
}
