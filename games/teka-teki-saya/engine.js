// Teka Teki Saya engine (single player vs 11 bots). No DOM, no clock: time moves only through
// { type: 'tick', dtMs }. Round flow and the emergency state machine are ported from
// tts-node/server/engine.js, including the fix that re-checks critical teams the moment the
// third cooldown round ends.

import { HITUNGAN, TEORI } from './data/questions.js';
import { configFor, applyRound, compareTeams } from './rules.js';
import { createDirector, decideBots, botAnswer } from './director.js';
import { makeRng, int, randomSeed } from '../../shared/core/rng.js';
import { BOTS, PLAYER_ID, assertDuration } from '../../shared/core/roster.js';

export const GAME_ID = 'tts';
export const REVEAL_MS = 3000;
/** Pace of rounds once the player is out of the race (finished or eliminated). */
export const SPECTATE_QUESTION_MS = 2500;
export const SPECTATE_REVEAL_MS = 1500;

export function createGame({ durationMin = 15, playerName = 'Player', seed = randomSeed() } = {}) {
  const d = assertDuration(durationMin);
  const config = configFor(d);
  const team = (id, name, fullName, isPlayer, targetRank) => ({
    id, name, fullName, isPlayer, targetRank,
    langkah: 0, poin: 0, darah: config.DARAH_AWAL, streak: 0, status: 'Aktif', finishOrder: 0,
  });
  const teams = [
    team(PLAYER_ID, playerName, playerName, true, null),
    ...BOTS.map((b) => team(b.id, b.short, b.name, false, b.rank.tts)),
  ];
  return {
    game: GAME_ID,
    seed,
    durationMin: d,
    config,
    status: 'ready', // ready | running | finished
    endReason: null, // top3 | time | no_active
    elapsedMs: 0,
    phase: 'idle', // idle | question | reveal
    phaseEndsMs: 0,
    round: { number: 0, mode: 'Normal', daruratSisa: 0, cooldownSisa: 0, type: 'Hitungan', questionId: null, openedMs: 0 },
    used: { Hitungan: [], Teori: [] },
    teams,
    pending: {}, // teamId -> { answer, correct, atMs }
    lastResult: null,
    announcements: [],
    history: [],
    rng: makeRng(seed),
    director: createDirector(),
  };
}

// ---------- selectors ----------

export function question(s) {
  if (!s.round.questionId) return null;
  const pool = s.round.type === 'Teori' ? TEORI : HITUNGAN;
  return pool.find((q) => q.id === s.round.questionId);
}

/** Question for display, without the key. */
export function publicQuestion(s) {
  const q = question(s);
  if (!q) return null;
  const { key, explanation, ...rest } = q;
  return { ...rest, type: s.round.type };
}

export function player(s) {
  return s.teams.find((t) => t.isPlayer);
}

export function remainingMs(s) {
  return Math.max(0, s.durationMin * 60000 - s.elapsedMs);
}

export function questionRemainingMs(s) {
  return s.phase === 'question' ? Math.max(0, s.phaseEndsMs - s.elapsedMs) : 0;
}

export function leaderboard(s) {
  return s.teams.slice().sort(compareTeams).map((t, i) => ({
    rank: i + 1, id: t.id, name: t.name, isPlayer: t.isPlayer, langkah: t.langkah, poin: t.poin,
    darah: t.darah, status: t.status, finishOrder: t.finishOrder, targetRank: t.targetRank,
    answered: s.phase === 'question' && !!s.pending[t.id] && (t.isPlayer || s.pending[t.id].atMs <= s.elapsedMs),
  }));
}

// ---------- reducer ----------

export function reduce(state, action) {
  return apply(structuredClone(state), action);
}

export function apply(s, action) {
  switch (action.type) {
    case 'start':
      if (s.status !== 'ready') return s;
      s.status = 'running';
      s.round.number = 1;
      draw(s, 'Hitungan');
      openRound(s);
      return s;
    case 'answer':
      return answer(s, String(action.value ?? '').toUpperCase());
    case 'tick':
      return tick(s, action.dtMs);
    default:
      throw new Error(`Unknown action ${action.type}`);
  }
}

function playerActive(s) {
  return player(s).status === 'Aktif';
}

function draw(s, type) {
  const pool = type === 'Teori' ? TEORI : HITUNGAN;
  let free = pool.filter((q) => !s.used[type].includes(q.id));
  if (!free.length && type === 'Hitungan') {
    s.used.Hitungan = []; // original: the Hitungan pool restarts when it runs out
    free = pool.slice();
  }
  if (!free.length) return null; // Teori never restarts
  const q = free[int(s.rng, free.length)];
  s.used[type].push(q.id);
  s.round.type = type;
  s.round.questionId = q.id;
  return q;
}

function openRound(s) {
  const c = s.config;
  const live = playerActive(s);
  const sec = s.round.type === 'Teori' ? c.WAKTU_TEORI_DETIK : c.WAKTU_HITUNGAN_DETIK;
  const dur = live ? sec * 1000 : SPECTATE_QUESTION_MS;
  s.phase = 'question';
  s.round.openedMs = s.elapsedMs;
  s.phaseEndsMs = s.elapsedMs + dur;
  s.pending = {};
  const q = question(s);
  const decisions = decideBots(s);
  for (const [id, ok] of Object.entries(decisions)) {
    s.pending[id] = { answer: botAnswer(s, ok, q), correct: ok, atMs: s.elapsedMs + dur * (0.15 + 0.7 * (int(s.rng, 1000) / 1000)) };
  }
}

function answer(s, value) {
  if (s.status !== 'running' || s.phase !== 'question' || !playerActive(s) || s.pending[PLAYER_ID]) return s;
  const valid = s.round.type === 'Teori' ? ['T', 'F'] : ['A', 'B', 'C', 'D'];
  if (!valid.includes(value)) return s;
  s.pending[PLAYER_ID] = { answer: value, correct: value === question(s).key, atMs: s.elapsedMs };
  closeRound(s); // the bots have already locked in, so the round closes as soon as the player answers
  return s;
}

function tick(s, dtMs) {
  if (s.status !== 'running' || !(dtMs > 0)) return s;
  const limit = s.durationMin * 60000;
  let left = dtMs;
  while (left > 0 && s.status === 'running') {
    const step = Math.min(left, Math.max(1, s.phaseEndsMs - s.elapsedMs));
    if (s.elapsedMs + step >= limit) {
      s.elapsedMs = limit;
      // Time up. A round that is still open is dropped, a round already scored stays scored.
      finish(s, 'time');
      return s;
    }
    s.elapsedMs += step;
    left -= step;
    if (s.elapsedMs >= s.phaseEndsMs) {
      if (s.phase === 'question') closeRound(s);
      else if (s.phase === 'reveal') afterReveal(s);
    }
  }
  return s;
}

function closeRound(s) {
  const c = s.config;
  const type = s.round.type;
  const q = question(s);
  const correct = {};
  const before = new Map(s.teams.map((t) => [t.id, { ...t }]));
  for (const t of s.teams) {
    if (t.status !== 'Aktif') continue;
    // Not answering counts as a wrong answer (guidebook).
    if (!s.pending[t.id]) s.pending[t.id] = { answer: null, correct: false, atMs: s.elapsedMs };
    correct[t.id] = s.pending[t.id].correct;
  }
  applyRound(s.teams, type, correct, c);
  const outcomes = {};
  for (const t of s.teams) {
    const b = before.get(t.id);
    if (b.status !== 'Aktif') continue;
    outcomes[t.id] = {
      answer: s.pending[t.id].answer,
      correct: correct[t.id],
      dLangkah: t.langkah - b.langkah, dPoin: t.poin - b.poin, dDarah: t.darah - b.darah,
      finished: t.status === 'Finish', eliminated: t.status === 'Tereliminasi',
    };
  }
  const p = outcomes[PLAYER_ID];
  s.history.push({ round: s.round.number, type, questionId: q.id, mode: s.round.mode, player: p ? { answer: p.answer, correct: p.correct } : null });

  const finished = s.teams.filter((t) => t.status === 'Finish').length;
  const anyActive = s.teams.some((t) => t.status === 'Aktif');
  let ending = null;
  let announcements = [];
  if (finished >= 3) ending = 'top3';
  else if (!anyActive) ending = 'no_active';
  else announcements = updateMode(s);

  s.lastResult = { round: s.round.number, type, questionId: q.id, key: q.key, explanation: q.explanation, outcomes, announcements, ending };
  s.announcements.push(...announcements.map((text) => ({ round: s.round.number, text })));
  s.pendingEnd = ending;
  s.phase = 'reveal';
  s.phaseEndsMs = s.elapsedMs + (p ? REVEAL_MS : SPECTATE_REVEAL_MS);
}

/** Emergency state machine, same order as updateEmergencyModeAndRound_. Returns announcement keys. */
export function updateMode(s) {
  const c = s.config;
  const r = s.round;
  const out = [];
  if (r.mode === 'Darurat') {
    r.daruratSisa -= 1;
    if (r.daruratSisa <= 0) {
      r.mode = 'Cooldown';
      r.cooldownSisa = c.COOLDOWN_RONDE;
      out.push('emergency_over');
    }
  } else if (r.mode === 'Cooldown') {
    r.cooldownSisa -= 1;
    if (r.cooldownSisa <= 0) {
      r.mode = 'Normal';
      out.push('cooldown_over');
    }
  }
  // Checked whenever the mode ends this round as Normal, including right after cooldown ends.
  if (r.mode === 'Normal') {
    const critical = s.teams.some((t) => t.status === 'Aktif' && t.darah <= c.AMBANG_DARURAT);
    const teoriLeft = TEORI.length - s.used.Teori.length;
    if (critical && teoriLeft > 0) {
      r.mode = 'Darurat';
      r.daruratSisa = c.WINDOW_DARURAT_RONDE;
      out.push('emergency_start');
    } else if (critical) {
      out.push('teori_exhausted');
    }
  }
  r.nextType = r.mode === 'Darurat' ? 'Teori' : 'Hitungan';
  return out;
}

function afterReveal(s) {
  if (s.pendingEnd) return finish(s, s.pendingEnd);
  s.round.number += 1;
  let q = draw(s, s.round.nextType);
  if (!q) {
    // Teori ran out in the middle of an emergency window: back to Normal (spec 04 state diagram).
    s.round.mode = 'Normal';
    s.round.daruratSisa = 0;
    s.announcements.push({ round: s.round.number, text: 'teori_exhausted' });
    q = draw(s, 'Hitungan');
  }
  openRound(s);
}

function finish(s, reason) {
  s.status = 'finished';
  s.endReason = reason;
  s.phase = 'idle';
}
