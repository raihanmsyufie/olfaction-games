import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QM, playQM, botOrderOk } from './helpers.js';
import { marketCeiling, settle } from '../games/question-market/bots.js';
import { PRICES } from '../games/question-market/data/market.js';

test('price table matches the original sheet (sellWrong = ROUND(sellRight * 0.3))', () => {
  assert.equal(PRICES.length, 31);
  assert.equal(PRICES[0].buy, 100000);
  assert.equal(PRICES[18].sellRight, 198750);
  assert.equal(PRICES[18].sellWrong, 59625);
  assert.deepEqual(PRICES[30], { ...PRICES[29], minute: 30 });
});

test('market ceiling: best run 755,800, runner-up 753,700', () => {
  const c = marketCeiling();
  assert.equal(c.best.finalCash, 755800);
  assert.equal(c.runnerUp.finalCash, 753700);
  assert.equal(settle(c.best.trades), 755800);
});

test('a question cannot be sold in the minute it was bought, and minute 30 blocks buying', () => {
  let s = QM.apply(QM.createGame({ durationMin: 10, seed: 1 }), { type: 'start' });
  QM.apply(s, { type: 'buy' });
  assert.ok(s.player.holding);
  assert.equal(QM.canSell(s).reason, 'too_early');
  QM.apply(s, { type: 'sell' });
  assert.ok(s.player.holding, 'sell refused');
  QM.apply(s, { type: 'tick', dtMs: s.msPerMinute });
  assert.equal(QM.canSell(s).ok, true);
  while (s.minute < 30) QM.apply(s, { type: 'tick', dtMs: s.msPerMinute / 4 });
  QM.apply(s, { type: 'sell' });
  assert.equal(QM.canBuy(s).reason, 'liquidation');
});

test('a wrong answer sells at the wrong price, an unsold question is lost at the end', () => {
  let s = QM.apply(QM.createGame({ durationMin: 10, seed: 2 }), { type: 'start' });
  QM.apply(s, { type: 'buy' });
  QM.apply(s, { type: 'answer', value: '-1' });
  QM.apply(s, { type: 'tick', dtMs: s.msPerMinute });
  QM.apply(s, { type: 'sell' });
  const t = s.player.trades[0];
  assert.equal(t.correct, false);
  assert.equal(t.received, PRICES[1].sellWrong);
  const u = QM.apply(QM.createGame({ durationMin: 10, seed: 2 }), { type: 'start' });
  QM.apply(u, { type: 'buy' });
  QM.apply(u, { type: 'tick', dtMs: u.msPerMinute * 40 });
  assert.equal(u.status, 'finished');
  assert.equal(u.player.trades.at(-1).expired, true);
  assert.equal(u.player.cash, 50000);
});

test('reduce is pure', () => {
  const a = QM.createGame({ durationMin: 15, seed: 3 });
  const b = QM.reduce(a, { type: 'start' });
  assert.equal(a.status, 'ready');
  assert.equal(b.status, 'running');
});

for (const d of [10, 15, 30]) {
  test(`QM ${d} min: perfect run is first, bot order fixed, near misses lose`, () => {
    for (let seed = 1; seed <= 25; seed++) {
      const perfect = QM.leaderboard(playQM(d, seed, 'perfect'));
      assert.equal(perfect[0].isPlayer, true);
      assert.equal(perfect[0].cash, 755800);
      assert.ok(botOrderOk(perfect));
      const good = QM.leaderboard(playQM(d, seed, { accuracy: 0.9, everyMinutes: 2 }));
      assert.ok(botOrderOk(good));
      assert.notEqual(good[0].isPlayer, true);
    }
  });
}
