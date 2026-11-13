import { episodes } from '../bakery/chapter.js';

const defineIsland = (id, name, requiredEpisodeIds, availableEpisodeIds = []) => Object.freeze({
  id, name,
  requiredEpisodeIds: Object.freeze(requiredEpisodeIds),
  availableEpisodeIds: Object.freeze(availableEpisodeIds),
});

export const islands = Object.freeze([
  defineIsland('bakery', '阿栗的麵包店', episodes.map(episode => episode.id), episodes.map(episode => episode.id)),
  defineIsland('forest', '數數森林', ['forest/sprout', 'forest/tickets', 'forest/cargo', 'forest/departure']),
  defineIsland('castle', '形狀城堡', ['castle/windows', 'castle/roof', 'castle/telescope', 'castle/starlight']),
  defineIsland('meadow', '比大小牧場', ['meadow/picnic', 'meadow/baskets', 'meadow/enough', 'meadow/return']),
  defineIsland('rainbow', '規律彩虹橋', ['rainbow/first-span', 'rainbow/rhythm', 'rainbow/post', 'rainbow/garden-path']),
]);

export function getIsland(id, registry = islands) {
  return registry.find(island => island.id === id) ?? null;
}
