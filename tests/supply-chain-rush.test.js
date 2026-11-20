import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCR, playSCR, botOrderOk } from './helpers.js';
import { PERFECT_PROFILE } from '../games/supply-chain-rush/bots.js';
import { INTEGER_QUESTIONS as BANK } from '../shared/data/integer-questions.js';

function bare(seed = 1) {
  // A started match where the bots never move, to test the rules in isolation.
  const s = SCR.createGame({ durationMin: 30, seed });
  SCR.apply(s, { type: 'start' });
  for (const id of Object.keys(s.brains)) if (id !== '_director') s.brains[id].nextActMs = Infinity;
  return s;
}

test('buying: one pack, then a 30 second team cooldown', () => {
  const s = bare();
  assert.equal(SCR.teamAction(s, 'player', { type: 'buy', vendor: 'C' }).ok, true);
  const p = SCR.player(s);
  assert.deepEqual([p.cash, p.raw, s.vendors.C.stock], [84000, 25, 375]);
  assert.equal(SCR.whyNot(s, 'player', { type: 'buy', vendor: 'A' }), 'cooldown');
  SCR.apply(s, { type: 'tick', dtMs: 30000 });
  assert.equal(SCR.whyNot(s, 'player', { type: 'buy', vendor: 'A' }), null);
});

test('restock starts as soon as the stock cannot cover one pack', () => {
  const s = bare();
  s.vendors.B.stock = 20;
  SCR.teamAction(s, 'player', { type: 'buy', vendor: 'B' });
  assert.equal(s.vendors.B.stock, 0);
  assert.equal(s.vendors.B.restockAt, s.gameMs + 150000);
  SCR.apply(s, { type: 'tick', dtMs: 150500 });
  assert.equal(s.vendors.B.stock, 240);
});

test('production: one run per factory, output after its time', () => {
  const s = bare();
  SCR.teamAction(s, 'player', { type: 'buy', vendor: 'C' });
  assert.equal(SCR.teamAction(s, 'player', { type: 'produce', factory: 'C' }).ok, true);
  assert.equal(SCR.whyNot(s, 'player', { type: 'produce', factory: 'C' }), 'factory_busy');
  SCR.apply(s, { type: 'tick', dtMs: 44000 });
  assert.equal(SCR.player(s).goods, 0);
  SCR.apply(s, { type: 'tick', dtMs: 1500 });
  assert.equal(SCR.player(s).goods, 4);
});

test('shipping needs a full load and the shipping cost up front', () => {
  const s = bare();
  const p = SCR.player(s);
  p.goods = 19;
  assert.equal(SCR.whyNot(s, 'player', { type: 'ship', fleet: 'Truck' }), 'not_enough_batteries');
  p.goods = 20;
  p.cash = 20000;
  assert.equal(SCR.whyNot(s, 'player', { type: 'ship', fleet: 'Truck' }), 'not_enough_cash');
  p.cash = 30000;
  SCR.teamAction(s, 'player', { type: 'ship', fleet: 'Truck' });
  assert.deepEqual([p.cash, p.goods], [200000, 0]);
});

test('grinding: opens at 50% cash, closes at 100%, wrong answers lock 10, 20, 40, 60 s', () => {
  const s = bare();
  const p = SCR.player(s);
  p.cash = 50000;
  SCR.apply(s, { type: 'tick', dtMs: 500 });
  assert.equal(p.grinding.active, true);
  const q = p.grinding.order[0];
  const locks = [];
  for (let i = 0; i < 5; i++) {
    p.grinding.lockUntil[q] = 0;
    SCR.teamAction(s, 'player', { type: 'grind', questionId: q, answer: '999' });
    locks.push((p.grinding.lockUntil[q] - s.gameMs) / 1000);
  }
  assert.deepEqual(locks, [10, 20, 40, 60, 60]);
  assert.equal(p.cash, 50000, 'no penalty');
  p.cash = 96000;
  const ok = p.grinding.order[1];
  assert.equal(SCR.grindingQuestions(s, 'player').length, 50);
  SCR.teamAction(s, 'player', { type: 'grind', questionId: ok, answer: answerOf(ok) });
  assert.equal(p.cash, 101000);
  assert.equal(p.grinding.active, false);
});

function answerOf(id) {
  return BANK.find((q) => q.id === id).answers[0];
}

test('market events at minute 10 and 20 rebase to the defaults first', () => {
  const s = bare();
  SCR.apply(s, { type: 'tick', dtMs: 600500 });
  assert.equal(s.vendors.A.price, 7500);
  assert.equal(s.fleet.Pesawat.shippingCost, 60000);
  SCR.apply(s, { type: 'tick', dtMs: 600000 });
  assert.equal(s.vendors.A.price, 4000);
  assert.equal(s.factories.B.timeSec, 20);
  assert.equal(s.fleet.Pesawat.sellPrice, 500000);
});

test('speed: a 10 minute match runs the 30 minute clock three times faster', () => {
  const s = SCR.createGame({ durationMin: 10, seed: 3 });
  SCR.apply(s, { type: 'start' });
  SCR.apply(s, { type: 'tick', dtMs: 10000 });
  assert.equal(s.gameMs, 30000);
});

for (const d of [10, 15, 30]) {
  test(`SCR ${d} min: perfect run first, bot order fixed for several player styles`, () => {
    for (let seed = 1; seed <= 12; seed++) {
      const perfect = SCR.leaderboard(playSCR(d, seed, PERFECT_PROFILE));
      assert.equal(perfect[0].isPlayer, true, `seed ${seed}`);
      assert.ok(botOrderOk(perfect), `seed ${seed}`);
      for (const prof of [null, { reactSec: 3, mistake: 0.05, grindSec: 20, grindAcc: 0.9, blunder: 0 }]) {
        assert.ok(botOrderOk(SCR.leaderboard(playSCR(d, seed, prof))), `seed ${seed}`);
      }
    }
  });
}
