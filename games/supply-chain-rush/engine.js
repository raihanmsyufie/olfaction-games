// Supply Chain Rush engine (single player vs 11 bots sharing the same vendor stock).
// Ported from SCR/server/engine.js v2. No DOM and no Date.now: the engine keeps its own game clock
// in GAME milliseconds of the original 30 minute match. A shorter web match simply runs that
// clock faster (SPEED), so cooldowns, production times and restocks keep their original values.

import { SETTINGS, VENDORS, FACTORIES, FLEET, MARKET_EVENTS } from './data/params.js';
import { INTEGER_QUESTIONS } from '../../shared/data/integer-questions.js';
import { makeRng, shuffle, randomSeed } from '../../shared/core/rng.js';
import { BOTS, PLAYER_ID, assertDuration } from '../../shared/core/roster.js';
import { createBotBrains, botsAct, directorStep, registerActions, drivePlayerSeat, PERFECT_PROFILE } from './bots.js';

export const GAME_ID = 'scr';
/** Game seconds per real second, per web duration. */
export const SPEED = { 10: 3, 15: 2, 30: 1 };
/** Engine resolution. Bots and timers are evaluated at least this often (game ms). */
const STEP_MS = 500;

/**
 * Creates a match. The benchmark (what the reference perfect run earns in this exact match) is
 * computed first, then the match is replayed once with the perfect run to check that the bot order
 * holds and the perfect run finishes first. If not, the next seed in the chain is tried, so every
 * match a player gets has passed that check.
 */
export function createGame({ durationMin = 15, playerName = 'Player', seed = randomSeed() } = {}) {
  const d = assertDuration(durationMin);
  for (let k = 0; k < 40; k++) {
    const trySeed = k === 0 ? seed : (Math.imul(seed ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) || k;
    const bench = runSeat(newMatch({ durationMin: d, seed: trySeed, benchmark: null }));
    const check = runSeat(newMatch({ durationMin: d, seed: trySeed, benchmark: bench }));
    if (passes(check)) return newMatch({ durationMin: d, seed: trySeed, benchmark: bench, playerName, requestedSeed: seed });
  }
  throw new Error('No playable Supply Chain Rush seed found');
}

/** Bot order equals the table and the player seat is first. */
export function passes(s) {
  const lb = leaderboard(s);
  return lb[0].isPlayer && lb.filter((x) => !x.isPlayer).every((x, i) => x.targetRank === i + 1);
}

/** Real milliseconds per tick used by the benchmark and sim/. */
export const SIM_TICK_MS = 250;
const TRACE_EVERY_MS = 10000;

/** Plays the whole match with the perfect profile in the player seat. */
function runSeat(s) {
  apply(s, { type: 'start' });
  const seat = { nextActMs: 0, nextGrindMs: 0 };
  while (s.status === 'running') {
    drivePlayerSeat(s, seat, PERFECT_PROFILE, teamAction);
    apply(s, { type: 'tick', dtMs: SIM_TICK_MS });
  }
  if (s.benchmark) return s;
  return { final: player(s).cash, trace: s.seatTrace };
}

function newMatch({ durationMin: d, seed, benchmark, playerName = 'Player', requestedSeed = seed }) {
  const rng = makeRng(seed);
  const team = (id, name, fullName, isPlayer, targetRank) => ({
    id, name, fullName, isPlayer, targetRank,
    cash: SETTINGS.initialCash, raw: 0, goods: 0, cooldownUntil: 0, productions: [],
    grinding: {
      active: false, used: 0,
      order: shuffle(rng, INTEGER_QUESTIONS.map((q) => q.id)),
      completed: [], wrong: {}, lockUntil: {},
    },
    stats: { bought: 0, produced: 0, shipped: 0, revenue: 0, grindingCash: 0 },
  });
  const s = {
    game: GAME_ID,
    seed,
    requestedSeed,
    durationMin: d,
    speed: SPEED[d],
    status: 'ready', // ready | running | finished
    gameMs: 0,
    rng,
    vendors: structuredClone(VENDORS),
    factories: structuredClone(FACTORIES),
    fleet: structuredClone(FLEET),
    events: MARKET_EVENTS.map((e) => ({ id: e.id, triggerSec: e.triggerSec, applied: false })),
    teams: [
      team(PLAYER_ID, playerName, playerName, true, null),
      ...BOTS.map((b) => team(b.id, b.short, b.name, false, b.rank.scr)),
    ],
    feed: [], // { atMs, kind, teamId, detail }
    announcements: [], // { atMs, kind, eventId? }
    brains: null,
  };
  for (const v of Object.values(s.vendors)) { v.stock = v.maxStock; v.restockAt = null; }
  s.brains = createBotBrains(s);
  // Reference perfect run of this exact match: { final, trace }. Rank 1 finishes just below final.
  s.benchmark = benchmark ? benchmark.final : null;
  s.benchmarkTrace = benchmark ? benchmark.trace : null;
  s.seatTrace = benchmark ? null : [];
  s.offScript = false; // true once the player is no longer on the reference run
  return s;
}

function seatSnapshot(s) {
  const p = player(s);
  return `${p.cash}|${p.raw}|${p.goods}|${p.productions.length}|${p.grinding.used}`;
}

// ---------- selectors ----------

export const nowSec = (s) => s.gameMs / 1000;
export const remainingGameSec = (s) => Math.max(0, SETTINGS.durationSec - nowSec(s));
/** Remaining REAL seconds of the web match. */
export const remainingRealSec = (s) => remainingGameSec(s) / s.speed;
export const team = (s, id) => s.teams.find((t) => t.id === id);
export const player = (s) => team(s, PLAYER_ID);

export function phase(s) {
  return 1 + s.events.filter((e) => e.applied).length;
}

/** Ranking: cash, then batteries, then nickel (original getRanking). Bots win full ties. */
export function leaderboard(s) {
  return s.teams.slice().sort((a, b) => b.cash - a.cash || b.goods - a.goods || b.raw - a.raw
    || (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0) || a.targetRank - b.targetRank)
    .map((t, i) => ({ rank: i + 1, id: t.id, name: t.name, isPlayer: t.isPlayer, cash: t.cash, goods: t.goods, raw: t.raw, targetRank: t.targetRank, inProduction: t.productions.length }));
}

/** Why an action is not possible right now, or null. Used by the UI to disable buttons. */
export function whyNot(s, teamId, action) {
  const t = team(s, teamId);
  if (s.status !== 'running') return 'not_running';
  const now = s.gameMs;
  if (action.type === 'buy') {
    const v = s.vendors[action.vendor];
    if (t.cooldownUntil > now) return 'cooldown';
    if (v.stock < v.qty) return 'out_of_stock';
    if (t.cash < v.price) return 'not_enough_cash';
    return null;
  }
  if (action.type === 'produce') {
    const f = s.factories[action.factory];
    if (t.productions.some((p) => p.factory === f.id)) return 'factory_busy';
    if (t.raw < f.inputPerRun) return 'not_enough_nickel';
    if (t.cash < f.price) return 'not_enough_cash';
    return null;
  }
  if (action.type === 'ship') {
    const m = s.fleet[action.fleet];
    if (t.goods < m.capacity) return 'not_enough_batteries';
    if (t.cash < m.shippingCost) return 'not_enough_cash';
    return null;
  }
  if (action.type === 'grind') {
    const g = t.grinding;
    if (!g.active) return 'grinding_locked';
    if (g.used >= SETTINGS.grindingMax) return 'grinding_quota';
    if (!g.order.includes(action.questionId)) return 'unknown_question';
    if (g.completed.includes(action.questionId)) return 'question_done';
    if ((g.lockUntil[action.questionId] || 0) > now) return 'question_locked';
    return null;
  }
  return 'unknown_action';
}

/** Questions the team can see in the grinding panel (without answers). */
export function grindingQuestions(s, teamId) {
  const t = team(s, teamId);
  return t.grinding.order.filter((id) => !t.grinding.completed.includes(id)).map((id) => {
    const q = INTEGER_QUESTIONS.find((x) => x.id === id);
    return { id, title: q.title, level: q.level, question: q.question, lockedForMs: Math.max(0, (t.grinding.lockUntil[id] || 0) - s.gameMs) };
  });
}

// ---------- reducer ----------

export function reduce(state, action) {
  return apply(structuredClone(state), action);
}

/** Player actions carry no teamId. Bots call teamAction directly. */
export function apply(s, action) {
  switch (action.type) {
    case 'start':
      if (s.status === 'ready') s.status = 'running';
      return s;
    case 'tick':
      return tick(s, action.dtMs * s.speed);
    case 'buy':
    case 'produce':
    case 'ship':
    case 'grind':
      teamAction(s, PLAYER_ID, action);
      return s;
    default:
      throw new Error(`Unknown action ${action.type}`);
  }
}

/** Runs one action for any team. Returns { ok, reason?, correct? }. */
export function teamAction(s, teamId, action) {
  if (s.status !== 'running') return { ok: false, reason: 'not_running' };
  const reason = whyNot(s, teamId, action);
  if (reason) return { ok: false, reason };
  const t = team(s, teamId);
  const now = s.gameMs;
  if (action.type === 'buy') {
    const v = s.vendors[action.vendor];
    t.cash -= v.price;
    t.raw += v.qty;
    v.stock -= v.qty;
    t.cooldownUntil = now + SETTINGS.teamCooldownSec * 1000;
    scheduleRestock(v, now);
    t.stats.bought += v.qty;
    s.feed.push({ atMs: now, kind: 'buy', teamId, detail: { vendor: v.id, qty: v.qty, price: v.price } });
  } else if (action.type === 'produce') {
    const f = s.factories[action.factory];
    t.cash -= f.price;
    t.raw -= f.inputPerRun;
    t.productions.push({ factory: f.id, startedAt: now, completesAt: now + f.timeSec * 1000, out: f.outputPerRun });
    s.feed.push({ atMs: now, kind: 'produce', teamId, detail: { factory: f.id } });
  } else if (action.type === 'ship') {
    const m = s.fleet[action.fleet];
    t.goods -= m.capacity;
    t.cash += m.sellPrice - m.shippingCost;
    t.stats.shipped += m.capacity;
    t.stats.revenue += m.sellPrice - m.shippingCost;
    s.feed.push({ atMs: now, kind: 'ship', teamId, detail: { fleet: m.id, net: m.sellPrice - m.shippingCost } });
  } else if (action.type === 'grind') {
    const g = t.grinding;
    const q = INTEGER_QUESTIONS.find((x) => x.id === action.questionId);
    const ans = String(action.answer ?? '').trim();
    if (!/^[+-]?\d+$/.test(ans)) return { ok: false, reason: 'not_an_integer' };
    const correct = q.answers.includes(String(Number.parseInt(ans, 10)));
    if (correct) {
      const reward = Math.round(SETTINGS.grindingRewardPct * SETTINGS.initialCash);
      t.cash += reward;
      g.used += 1;
      g.completed.push(q.id);
      t.stats.grindingCash += reward;
    } else {
      // No cash penalty. Only that question is locked for a while: 10, 20, 40, then 60 seconds.
      const n = (g.wrong[q.id] || 0) + 1;
      g.wrong[q.id] = n;
      const lock = Math.min(SETTINGS.grindingWrongLockMaxSec, SETTINGS.grindingWrongLockBaseSec * 2 ** (n - 1));
      g.lockUntil[q.id] = now + lock * 1000;
    }
    updateGrinding(t);
    return { ok: true, correct };
  }
  updateGrinding(t);
  return { ok: true };
}

function scheduleRestock(v, now) {
  if (v.stock < v.qty && !v.restockAt) v.restockAt = now + v.restockCooldownSec * 1000;
}

/** Unlocks at <= 50% of the start cash, locks again at >= 100% or when the quota is used. */
function updateGrinding(t) {
  const g = t.grinding;
  if (g.used >= SETTINGS.grindingMax) { g.active = false; return; }
  if (!g.active && t.cash <= SETTINGS.grindingUnlockThresholdPct * SETTINGS.initialCash) g.active = true;
  else if (g.active && t.cash >= SETTINGS.grindingLockThresholdPct * SETTINGS.initialCash) g.active = false;
}

function rebaseMarket(s) {
  for (const [k, v] of Object.entries(VENDORS)) Object.assign(s.vendors[k], { qty: v.qty, price: v.price, restockCooldownSec: v.restockCooldownSec });
  for (const [k, f] of Object.entries(FACTORIES)) Object.assign(s.factories[k], f);
  for (const [k, m] of Object.entries(FLEET)) Object.assign(s.fleet[k], m);
}

function applyEvent(s, ev) {
  const def = MARKET_EVENTS.find((e) => e.id === ev.id);
  rebaseMarket(s);
  for (const [k, c] of Object.entries(def.changes.pos1)) Object.assign(s.vendors[k], c);
  for (const [k, c] of Object.entries(def.changes.pos2)) Object.assign(s.factories[k], c);
  for (const [k, c] of Object.entries(def.changes.pos3)) Object.assign(s.fleet[k], c);
  s.events.forEach((e) => { e.applied = e.id === ev.id ? true : e.applied; });
  s.announcements.push({ atMs: s.gameMs, kind: 'market_event', eventId: ev.id });
}

function tick(s, dGameMs) {
  if (s.status !== 'running' || !(dGameMs > 0)) return s;
  const end = SETTINGS.durationSec * 1000;
  let left = dGameMs;
  while (left > 0 && s.status === 'running') {
    const step = Math.min(left, STEP_MS - (s.gameMs % STEP_MS) || STEP_MS);
    s.gameMs = Math.min(end, s.gameMs + step);
    left -= step;
    advanceWorld(s);
    if (s.gameMs >= end) {
      s.status = 'finished'; // unsold nickel and batteries are worth nothing
      s.announcements.push({ atMs: s.gameMs, kind: 'time_up' });
      break;
    }
    if (s.gameMs % TRACE_EVERY_MS === 0) {
      const snap = seatSnapshot(s);
      if (s.seatTrace) s.seatTrace.push(snap);
      else if (s.benchmarkTrace && !s.offScript && s.benchmarkTrace[s.gameMs / TRACE_EVERY_MS - 1] !== snap) s.offScript = true;
    }
    directorStep(s);
    botsAct(s, teamAction);
    if (s.feed.length > FEED_KEEP * 2) s.feed = s.feed.slice(-FEED_KEEP);
    if (s.announcements.length > FEED_KEEP * 2) s.announcements = s.announcements.slice(-FEED_KEEP);
  }
  return s;
}

/** Only the latest feed lines are kept, so cloning the state stays cheap in the browser. */
const FEED_KEEP = 150;

function advanceWorld(s) {
  const now = s.gameMs;
  for (const ev of s.events) if (!ev.applied && now >= ev.triggerSec * 1000) applyEvent(s, ev);
  for (const t of s.teams) {
    if (!t.productions.length) continue;
    const done = t.productions.filter((p) => now >= p.completesAt);
    if (!done.length) continue;
    for (const p of done) { t.goods += p.out; t.stats.produced += p.out; }
    t.productions = t.productions.filter((p) => now < p.completesAt);
  }
  for (const v of Object.values(s.vendors)) {
    scheduleRestock(v, now);
    if (v.restockAt && now >= v.restockAt) {
      v.stock = v.maxStock;
      v.restockAt = null;
      s.announcements.push({ atMs: now, kind: 'restock', vendor: v.id });
    }
  }
  for (const t of s.teams) updateGrinding(t);
}

registerActions(teamAction);

export { SETTINGS, VENDORS, FACTORIES, FLEET, MARKET_EVENTS };
