import test from 'node:test';
import assert from 'node:assert/strict';
import { episodes } from '../src/bakery/chapter.js';
import { freshProgress } from '../src/bakery/progress.js';
import { bakerySnapshot } from '../src/world/bakeryAdapter.js';
import { islands } from '../src/world/islands.js';
import { forestInvitation, initialIsland, islandAccess, islandComplete, resolveIsland } from '../src/world/navigation.js';

function completedBakery() {
  return { ...freshProgress(), completed: episodes.map(episode => episode.id) };
}

test('C1 registers all islands while only bakery content is available', () => {
  assert.deepEqual(islands.map(island => island.id), ['bakery', 'forest', 'castle', 'meadow', 'rainbow']);
  assert.equal(islands.find(island => island.id === 'forest').requiredEpisodeIds.length, 4);
  assert.equal(islands.find(island => island.id === 'forest').availableEpisodeIds.length, 0);
});

test('bakery adapter derives completion without changing the legacy snapshot', () => {
  const raw = completedBakery();
  const before = JSON.stringify(raw);
  const snapshot = bakerySnapshot(raw);
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.eligibleForForest, true);
  assert.deepEqual(snapshot.completedEpisodeIds, episodes.map(episode => episode.id));
  assert.equal(JSON.stringify(raw), before);
});

test('forest eligibility is separate from forest release availability', () => {
  const bakery = completedBakery();
  const access = islandAccess('forest', bakery, null);
  assert.equal(access.eligible, true);
  assert.equal(access.available, false);
  assert.equal(access.enterable, false);
  assert.equal(forestInvitation(bakery, null), false);
  assert.equal(resolveIsland('forest', bakery, null), 'bakery');
});

test('unfinished bakery cannot unlock or resolve a later island', () => {
  const bakery = freshProgress();
  assert.equal(bakerySnapshot(bakery).complete, false);
  assert.equal(islandComplete('bakery', bakery, null), false);
  assert.equal(islandAccess('forest', bakery, null).reason, 'previous-island-incomplete');
  assert.equal(initialIsland(bakery, { lastVisitedIslandId: 'forest' }), 'bakery');
});

test('released forest requires its complete four episode set', () => {
  const bakery = completedBakery();
  const registry = islands.map(island => island.id === 'forest' ? { ...island, availableEpisodeIds: [...island.requiredEpisodeIds] } : island);
  const partial = { islands: { forest: { completed: ['forest/sprout'] } } };
  assert.equal(islandAccess('forest', bakery, partial, registry).eligible, true);
  assert.equal(islandComplete('forest', bakery, partial, registry), false);
  const complete = { islands: { forest: { completed: registry[1].requiredEpisodeIds } } };
  assert.deepEqual(islandAccess('forest', bakery, complete, registry), { eligible: true, available: true, enterable: true, reason: null });
  assert.equal(resolveIsland('forest', bakery, complete, registry), 'forest');
});

test('bakery replay and each legacy phase survive navigation without mutation', () => {
  for (const phase of ['intro', 'play', 'success', 'ending']) {
    const bakery = {
      ...completedBakery(), placed: [], voice: false,
      active: { episodeId: 'opening', step: 1, phase, moved: [0, 1], help: 2 },
    };
    const world = { lastVisitedIslandId: 'forest', islands: { forest: { completed: [], active: { episodeId: 'forest/sprout', taskId: 'forest/sprout/plant', phase: 'play', seedToPot: { seed_1: 'pot_2' } } } } };
    const before = JSON.stringify({ bakery, world });
    const registry = islands.map(island => island.id === 'forest' ? { ...island, availableEpisodeIds: ['forest/sprout'] } : island);
    assert.equal(bakerySnapshot(bakery).eligibleForForest, true);
    assert.deepEqual(bakerySnapshot(bakery).active, bakery.active);
    assert.equal(initialIsland(bakery, world, registry), 'forest');
    assert.equal(resolveIsland('bakery', bakery, world, registry), 'bakery');
    assert.equal(JSON.stringify({ bakery, world }), before);
    assert.equal(islandAccess('castle', bakery, world, registry).eligible, false);
  }
});

test('invalid legacy completion cannot grant eligibility and fresh routes stay in bakery', () => {
  for (const bakery of [null, {}, { version: 2, completed: episodes.map(episode => episode.id) }, { ...freshProgress(), completed: ['party'] }]) {
    assert.equal(bakerySnapshot(bakery).eligibleForForest, false);
    assert.equal(initialIsland(bakery, null), 'bakery');
  }
  assert.equal(islandComplete('missing', completedBakery(), null), false);
});

test('unknown island requests safely return to bakery', () => {
  const bakery = completedBakery();
  assert.deepEqual(islandAccess('missing', bakery, null), { eligible: false, available: false, enterable: false, reason: 'unknown-island' });
  assert.equal(resolveIsland('missing', bakery, null), 'bakery');
});
