// Bot director for Teka Teki Saya.
//
// The director never edits scores. Before each round it only decides whether each bot answers
// right or wrong, then the normal rules are applied. Three promises:
//
// 1. Bot rank 1 answers everything right except the FIRST Teori question it meets. That is the
//    cheapest possible mistake (no step lost), so only a perfect run beats it.
// 2. A Teori round is guaranteed to happen early: until the first emergency starts, the rank 11
//    bot keeps answering wrong until its blood reaches the emergency threshold.
// 3. After every round the 11 bots stay in their table order. Ties are allowed while running,
//    because ties are broken by seeding rank.

import { next, int } from '../../shared/core/rng.js';
import { applyEffect, compareTeams } from './rules.js';

/** Base chance of a right answer per target rank. Tuned with sim/run.js. */
export const BASE_ACCURACY = { 1: 1, 2: 0.92, 3: 0.88, 4: 0.84, 5: 0.8, 6: 0.76, 7: 0.72, 8: 0.68, 9: 0.62, 10: 0.56, 11: 0.5 };

/** How much of a bot's answer comes from the shared question difficulty (1 = fully shared). */
export const DIFFICULTY_WEIGHT = 0.75;

export function createDirector() {
  return { rank1Missed: false, firstEmergencySeen: false, conflicts: 0 };
}

/** Projected state of one team after answering this round (no shared finish order yet). */
function projectOne(t, type, correct, c) {
  const x = { ...t, fresh: false };
  if (x.status !== 'Aktif') return x;
  applyEffect(x, type, correct, c);
  if (x.darah <= 0) {
    x.darah = 0;
    x.status = 'Tereliminasi';
  } else if (x.langkah >= c.LANGKAH_MENANG) {
    x.status = 'Finish';
    x.fresh = true;
  }
  return x;
}

/** compareTeams for projections: teams finishing this round go after earlier finishers. */
function compareProj(a, b) {
  if (a.status === 'Finish' && b.status === 'Finish' && a.fresh !== b.fresh) return a.fresh ? 1 : -1;
  if (a.status === 'Finish' && b.status === 'Finish' && a.fresh && b.fresh) {
    return b.poin - a.poin || b.darah - a.darah || a.targetRank - b.targetRank;
  }
  return compareTeams(a, b);
}

/** Numeric strength, only used to measure how far a broken pair is from being fixed. */
function strength(t) {
  if (t.status === 'Finish') return 3e7 - (t.fresh ? 50 : t.finishOrder) * 1e5 + t.poin * 10 + t.darah * 0.1;
  if (t.status === 'Tereliminasi') return 1e7 + t.langkah * 1e4 + t.poin * 10;
  return 2e7 + t.langkah * 1e4 + t.poin * 10 + t.darah * 0.1;
}

/**
 * @param {object} s engine state (read-only here except s.director and s.rng)
 * @returns {Record<string, boolean>} right/wrong for every active bot
 */
export function decideBots(s) {
  const { config: c, round, rng, director: dir } = s;
  const type = round.type;
  if (round.mode === 'Darurat') dir.firstEmergencySeen = true;

  const bots = s.teams.filter((t) => !t.isPlayer).sort((a, b) => a.targetRank - b.targetRank);
  // Shared difficulty: a hard question is missed by the weaker teams first. Each bot mixes the
  // round's difficulty with its own noise, so upsets still happen now and then.
  const difficulty = next(rng);
  const options = bots.map((b) => {
    if (b.status !== 'Aktif') return [null];
    const r = b.targetRank;
    if (r === 1) {
      if (type === 'Teori' && !dir.rank1Missed) return [false];
      return [true];
    }
    if (r === 11 && !dir.firstEmergencySeen && b.darah > c.AMBANG_DARURAT) return [false];
    let p = BASE_ACCURACY[r];
    if (b.darah <= 2) p = Math.min(0.97, p + 0.15); // clutch: a bot near elimination tries harder
    const sampled = DIFFICULTY_WEIGHT * difficulty + (1 - DIFFICULTY_WEIGHT) * next(rng) < p;
    return [sampled, !sampled];
  });
  const proj = bots.map((b, i) => options[i].map((o) => (o === null ? { ...b, fresh: false } : projectOne(b, type, o, c))));

  // Depth-first search, top-down, sampled answer first. Each bot must not pass the bot above it.
  // First pass also keeps a one-round safety margin: if both neighbours answer right next round
  // (Hitungan or Teori) the order must still hold. That guarantees "everyone right" is always a
  // way out, which is what a bot on its last blood needs.
  const choice = new Array(bots.length).fill(0);
  // safe 2: full one-round lookahead, safe 1: level neighbours keep streak order, safe 0: order only.
  const breaks = (up, lo, safe) => {
    if (compareProj(up, lo) > 0) return true;
    if (!safe || up.status !== 'Aktif' || lo.status !== 'Aktif') return false;
    if (safe === 1) return up.langkah === lo.langkah && up.poin === lo.poin && lo.streak > up.streak;
    // safe 3 also keeps the death order natural: next to a bot on its last two blood, the lower
    // bot may not hold more blood, so lower bots always run out first.
    if (safe === 3 && up.darah <= 2 && lo.darah > up.darah) return true;
    for (const t of ['Hitungan', 'Teori']) {
      if (compareProj(projectOne(up, t, true, c), projectOne(lo, t, true, c)) > 0) return true;
    }
    return false;
  };
  const dfs = (i, safe) => {
    if (i === bots.length) return true;
    for (let k = 0; k < options[i].length; k++) {
      if (i > 0 && breaks(proj[i - 1][choice[i - 1]], proj[i][k], safe)) continue;
      choice[i] = k;
      if (dfs(i + 1, safe)) return true;
    }
    return false;
  };
  const found = dfs(0, 3) || dfs(0, 2) || dfs(0, 1) || dfs(0, 0);

  if (!found) {
    // No order-preserving answer set exists this round: take the one that breaks the order least,
    // later rounds repair it. Counted so the simulator can report it.
    dir.conflicts++;
    let best = null;
    const n = bots.length;
    const free = options.map((o) => o.length - 1);
    const total = free.reduce((m, f) => m * (f + 1), 1);
    for (let code = 0; code < total; code++) {
      let x = code;
      const ch = free.map((f) => { const v = f ? x % 2 : 0; if (f) x = Math.floor(x / 2); return v; });
      let gap = 0;
      let dev = 0;
      for (let i = 0; i < n; i++) {
        dev += ch[i];
        if (i > 0 && compareProj(proj[i - 1][ch[i - 1]], proj[i][ch[i]]) > 0) gap += Math.max(1, strength(proj[i][ch[i]]) - strength(proj[i - 1][ch[i - 1]]));
      }
      if (!best || gap < best.gap || (gap === best.gap && dev < best.dev)) best = { gap, dev, ch };
    }
    best.ch.forEach((v, i) => { choice[i] = v; });
  }

  if (type === 'Teori' && bots[0].status === 'Aktif' && !dir.rank1Missed) dir.rank1Missed = true;
  const out = {};
  bots.forEach((b, i) => { if (b.status === 'Aktif') out[b.id] = options[i][choice[i]]; });
  return out;
}

/** Visible answer for a bot, so the board can show what each team raised. */
export function botAnswer(s, correct, question) {
  if (s.round.type === 'Teori') return correct ? question.key : question.key === 'T' ? 'F' : 'T';
  if (correct) return question.key;
  const wrong = ['A', 'B', 'C', 'D'].filter((x) => x !== question.key);
  return wrong[int(s.rng, wrong.length)];
}
