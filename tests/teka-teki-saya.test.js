import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TTS, playTTS, botOrderOk } from './helpers.js';
import { applyEffect, applyRound, compareTeams, configFor } from '../games/teka-teki-saya/rules.js';

const c30 = configFor(30);
const team = (o = {}) => ({ id: 'x', langkah: 0, poin: 0, darah: 10, streak: 0, status: 'Aktif', finishOrder: 0, isPlayer: false, targetRank: 5, ...o });

test('effects: Hitungan right +1 step +15, wrong -1 blood; Teori right +10 only', () => {
  const t = team();
  applyEffect(t, 'Hitungan', true, c30);
  assert.deepEqual([t.langkah, t.poin, t.darah], [1, 15, 10]);
  applyEffect(t, 'Hitungan', false, c30);
  assert.deepEqual([t.langkah, t.darah, t.streak], [1, 9, 0]);
  applyEffect(t, 'Teori', true, c30);
  assert.deepEqual([t.langkah, t.poin], [1, 25]);
});

test('streak of 3 (mixed types): +2 blood, or +15 points at full blood, then resets', () => {
  const hurt = team({ darah: 7 });
  ['Hitungan', 'Teori', 'Hitungan'].forEach((ty) => applyEffect(hurt, ty, true, c30));
  assert.deepEqual([hurt.darah, hurt.streak], [9, 0]);
  const full = team();
  ['Hitungan', 'Hitungan', 'Hitungan'].forEach((ty) => applyEffect(full, ty, true, c30));
  assert.deepEqual([full.poin, full.streak], [60, 0]);
});

test('streak bonus is applied before the finish check (audit: bonus together with finish)', () => {
  const a = team({ id: 'a', langkah: 14, poin: 100, streak: 2 });
  const b = team({ id: 'b', langkah: 14, poin: 110, streak: 0, darah: 9 });
  applyRound([a, b], 'Hitungan', { a: true, b: true }, c30);
  assert.equal(a.poin, 130); // 100 + 15 + 15 bonus
  assert.equal(a.finishOrder, 1); // beats b (125) on points
  assert.equal(b.finishOrder, 2);
});

test('five teams finishing in the same round are ordered by points then blood', () => {
  const ts = [0, 1, 2, 3, 4].map((i) => team({ id: `t${i}`, langkah: 14, poin: 100 + (i % 2) * 10, darah: 5 + i }));
  applyRound(ts, 'Hitungan', Object.fromEntries(ts.map((t) => [t.id, true])), c30);
  const order = ts.slice().sort((x, y) => x.finishOrder - y.finishOrder).map((t) => t.id);
  assert.deepEqual(order, ['t3', 't1', 't4', 't2', 't0']);
});

test('ranking: finishers, then active by steps/points/blood, then eliminated', () => {
  const f = team({ status: 'Finish', finishOrder: 1, langkah: 15 });
  const a = team({ langkah: 9, poin: 10 });
  const e = team({ status: 'Tereliminasi', langkah: 12, darah: 0 });
  assert.deepEqual([e, a, f].sort(compareTeams), [f, a, e]);
});

function stateWithMode(mode, sisa, critical) {
  const s = TTS.createGame({ durationMin: 30, seed: 1 });
  s.round.mode = mode;
  if (mode === 'Darurat') s.round.daruratSisa = sisa;
  if (mode === 'Cooldown') s.round.cooldownSisa = sisa;
  if (critical) s.teams[3].darah = 2;
  return s;
}

test('emergency state machine: Normal -> Darurat when a team is critical', () => {
  const s = stateWithMode('Normal', 0, true);
  TTS.updateMode(s);
  assert.equal(s.round.mode, 'Darurat');
  assert.equal(s.round.daruratSisa, 3);
  assert.equal(s.round.nextType, 'Teori');
});

test('emergency state machine: third emergency round -> Cooldown of 3 Hitungan rounds', () => {
  const s = stateWithMode('Darurat', 1, true);
  TTS.updateMode(s);
  assert.equal(s.round.mode, 'Cooldown');
  assert.equal(s.round.cooldownSisa, 3);
  assert.equal(s.round.nextType, 'Hitungan');
});

test('old bug: when the third cooldown round ends and a team is still critical, Darurat starts next round', () => {
  const s = stateWithMode('Cooldown', 1, true);
  TTS.updateMode(s);
  assert.equal(s.round.mode, 'Darurat');
  assert.equal(s.round.nextType, 'Teori');
});

test('cooldown cannot be skipped even with critical teams', () => {
  const s = stateWithMode('Cooldown', 3, true);
  TTS.updateMode(s);
  assert.equal(s.round.mode, 'Cooldown');
  assert.equal(s.round.cooldownSisa, 2);
});

test('no emergency once the Teori pool is used up', () => {
  const s = stateWithMode('Normal', 0, true);
  s.used.Teori = Array.from({ length: 15 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`);
  const out = TTS.updateMode(s);
  assert.equal(s.round.mode, 'Normal');
  assert.ok(out.includes('teori_exhausted'));
});

test('not answering counts as wrong, a time-up round is dropped', () => {
  let s = TTS.apply(TTS.createGame({ durationMin: 10, seed: 4 }), { type: 'start' });
  TTS.apply(s, { type: 'tick', dtMs: s.config.WAKTU_HITUNGAN_DETIK * 1000 + 10 });
  assert.equal(s.lastResult.outcomes.player.correct, false);
  assert.equal(TTS.player(s).darah, s.config.DARAH_AWAL - 1);
  s = TTS.apply(TTS.createGame({ durationMin: 10, seed: 5 }), { type: 'start' });
  s.durationMin = 0.5; // test only: the clock runs out in the middle of the first question
  const before = TTS.player(s).darah;
  TTS.apply(s, { type: 'tick', dtMs: 30000 });
  assert.equal(s.status, 'finished');
  assert.equal(s.endReason, 'time');
  assert.equal(TTS.player(s).darah, before, 'open round dropped');
});

for (const d of [10, 15, 30]) {
  test(`TTS ${d} min: perfect player always first, bot order fixed, 90% player never first`, () => {
    for (let seed = 1; seed <= 150; seed++) {
      const perfect = TTS.leaderboard(playTTS(d, seed, { accuracy: 1, answerMs: 4000 }));
      assert.equal(perfect[0].isPlayer, true, `seed ${seed}`);
      assert.ok(botOrderOk(perfect), `seed ${seed}`);
      const good = TTS.leaderboard(playTTS(d, seed, { accuracy: 0.9, answerMs: 15000 }));
      assert.ok(botOrderOk(good), `seed ${seed}`);
      assert.notEqual(good[0].isPlayer, true, `seed ${seed}`);
    }
  });
}
