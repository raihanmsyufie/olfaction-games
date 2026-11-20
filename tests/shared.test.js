import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, next, shuffle } from '../shared/core/rng.js';
import { BOTS, botsByRank } from '../shared/core/roster.js';

test('rng: same seed, same sequence', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 100; i++) assert.equal(next(a), next(b));
  assert.deepEqual(shuffle(makeRng(7), [1, 2, 3, 4, 5]), shuffle(makeRng(7), [1, 2, 3, 4, 5]));
});

test('roster: 11 bots, every game column is a full 1..11 ranking', () => {
  assert.equal(BOTS.length, 11);
  for (const g of ['tts', 'scr', 'qm']) {
    assert.deepEqual(botsByRank(g).map((b) => b.rank[g]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  }
  assert.equal(botsByRank('tts')[0].short, 'Raihan');
  assert.equal(botsByRank('scr')[0].short, 'Zhiyyan');
  assert.equal(botsByRank('qm')[0].short, 'Caca');
});
