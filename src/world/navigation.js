import { islands, getIsland } from './islands.js';
import { bakerySnapshot } from './bakeryAdapter.js';

function completedEpisodes(id, bakery, world) {
  if (id === 'bakery') return bakerySnapshot(bakery).completedEpisodeIds;
  const completed = world?.islands?.[id]?.completed;
  return Array.isArray(completed) ? completed : [];
}

export function islandComplete(id, bakery, world, registry = islands) {
  const island = getIsland(id, registry);
  if (!island || island.requiredEpisodeIds.length === 0) return false;
  const completed = completedEpisodes(id, bakery, world);
  return island.requiredEpisodeIds.every(episodeId => completed.includes(episodeId));
}

export function islandAccess(id, bakery, world, registry = islands) {
  const index = registry.findIndex(island => island.id === id);
  if (index < 0) return { eligible: false, available: false, enterable: false, reason: 'unknown-island' };
  const island = registry[index];
  const eligible = registry.slice(0, index).every(previous => islandComplete(previous.id, bakery, world, registry));
  const available = island.availableEpisodeIds.some(episodeId => island.requiredEpisodeIds.includes(episodeId));
  return { eligible, available, enterable: eligible && available, reason: !eligible ? 'previous-island-incomplete' : !available ? 'not-released' : null };
}

export function resolveIsland(requestedId, bakery, world, registry = islands) {
  const access = islandAccess(requestedId, bakery, world, registry);
  return access.enterable ? requestedId : 'bakery';
}

export function initialIsland(bakery, world, registry = islands) {
  return resolveIsland(world?.lastVisitedIslandId ?? 'bakery', bakery, world, registry);
}

export function forestInvitation(bakery, world, registry = islands) {
  return islandAccess('forest', bakery, world, registry).enterable;
}
