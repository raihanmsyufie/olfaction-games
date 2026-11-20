// Shared drivers for tests and sim/. Each one plays the player seat with a simple profile.

import * as QM from '../games/question-market/engine.js';
import { marketCeiling } from '../games/question-market/bots.js';
import * as TTS from '../games/teka-teki-saya/engine.js';
import * as SCR from '../games/supply-chain-rush/engine.js';
import { drivePlayerSeat } from '../games/supply-chain-rush/bots.js';
import { makeRng, next, int } from '../shared/core/rng.js';

/** Question Market. profile: 'perfect' | 'idle' | { accuracy, everyMinutes } */
export function playQM(durationMin, seed, profile) {
  let s = QM.createGame({ durationMin, seed });
  QM.apply(s, { type: 'start' });
  const plan = profile === 'perfect' ? marketCeiling().best.trades : null;
  const r = makeRng(seed * 31 + 7);
  let i = 0;
  const step = s.msPerMinute / 8;
  while (s.status === 'running') {
    const m = s.minute;
    if (plan) {
      if (s.player.holding && plan[i] && m === plan[i].sell) { QM.apply(s, { type: 'sell' }); i++; }
      if (!s.player.holding && plan[i] && m === plan[i].buy) answerBuy(s, true);
    } else if (profile !== 'idle') {
      // Naive trader: buys every few minutes, sells after one or two minutes.
      if (s.player.holding && m >= s.player.holding.boughtMinute + 1 + int(r, 2)) QM.apply(s, { type: 'sell' });
      if (!s.player.holding && m % profile.everyMinutes === 0 && m < 30) answerBuy(s, next(r) < profile.accuracy);
    }
    QM.apply(s, { type: 'tick', dtMs: step });
  }
  return s;
}

function answerBuy(s, right) {
  QM.apply(s, { type: 'buy' });
  if (!s.player.holding) return;
  const q = QM.questionById(s.player.holding.questionId);
  QM.apply(s, { type: 'answer', value: right ? q.answers[0] : String(Number(q.answers[0]) + 1) });
}

/** Teka Teki Saya. profile: { accuracy, answerMs } */
export function playTTS(durationMin, seed, profile) {
  const s = TTS.createGame({ durationMin, seed });
  TTS.apply(s, { type: 'start' });
  const r = makeRng(seed * 17 + 3);
  while (s.status === 'running') {
    const me = TTS.player(s);
    if (s.phase === 'question' && me.status === 'Aktif' && !s.pending.player) {
      TTS.apply(s, { type: 'tick', dtMs: profile.answerMs });
      if (s.status !== 'running' || s.phase !== 'question' || s.pending.player) continue;
      const q = TTS.question(s);
      let a = q.key;
      if (next(r) >= profile.accuracy) a = s.round.type === 'Teori' ? (q.key === 'T' ? 'F' : 'T') : ['A', 'B', 'C', 'D'].find((x) => x !== q.key);
      TTS.apply(s, { type: 'answer', value: a });
    } else {
      TTS.apply(s, { type: 'tick', dtMs: 500 });
    }
  }
  return s;
}

/** Supply Chain Rush. profile: a bots.js profile object, or null for an idle player. */
export function playSCR(durationMin, seed, profile) {
  const s = SCR.createGame({ durationMin, seed });
  SCR.apply(s, { type: 'start' });
  const seat = { nextActMs: 0, nextGrindMs: 0 };
  while (s.status === 'running') {
    if (profile) drivePlayerSeat(s, seat, profile, SCR.teamAction);
    SCR.apply(s, { type: 'tick', dtMs: SCR.SIM_TICK_MS });
  }
  return s;
}

/** True when the 11 bots finished in their table order. */
export function botOrderOk(rows) {
  return rows.filter((x) => !x.isPlayer).every((x, i) => x.targetRank === i + 1);
}

export { QM, TTS, SCR };
