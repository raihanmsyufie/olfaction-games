// Supply Chain Rush bots: one shared policy, a skill profile per rank, and a director.
//
// Every bot plays the same greedy policy (`policyAct`), the one that came out best in sim/:
// buy the pack with the best margin per 30 second purchase slot, run the cheapest idle factory per
// battery, ship with the fleet that pays the most per battery in the current phase, and grind when
// cash drops to half. What separates the ranks is reaction time, mistakes and grinding speed, all
// in REAL seconds, so a 10 minute match (3x speed) is harder for everyone, bots included.
//
// The director keeps the final cash order equal to the roster table. It never touches cash. It only
// slows a bot down (longer reactions, skipped turns) when the bot gets too close to the one above
// it, and in the last stretch it makes a bot that is still too rich hold back its last shipment,
// which is what a real team does when it misjudges the clock.

import { next, chance, int } from '../../shared/core/rng.js';
import { SETTINGS } from './data/params.js';
import { INTEGER_QUESTIONS } from '../../shared/data/integer-questions.js';

/** Skill per target rank. reactSec and grindSec are real seconds. */
export const PROFILES = {
  1: { reactSec: 0.5, mistake: 0, grindSec: 6, grindAcc: 1, blunder: 0 }, // plays like the perfect run, trimmed at the bell
  2: { reactSec: 1.6, mistake: 0.02, grindSec: 12, grindAcc: 0.95, blunder: 0.0 },
  3: { reactSec: 1.92, mistake: 0.029, grindSec: 14, grindAcc: 0.92, blunder: 0.011 },
  4: { reactSec: 2.24, mistake: 0.038, grindSec: 16, grindAcc: 0.89, blunder: 0.022 },
  5: { reactSec: 2.57, mistake: 0.047, grindSec: 19, grindAcc: 0.87, blunder: 0.033 },
  6: { reactSec: 2.89, mistake: 0.056, grindSec: 21, grindAcc: 0.84, blunder: 0.044 },
  7: { reactSec: 3.21, mistake: 0.064, grindSec: 23, grindAcc: 0.81, blunder: 0.056 },
  8: { reactSec: 3.53, mistake: 0.073, grindSec: 25, grindAcc: 0.78, blunder: 0.067 },
  9: { reactSec: 3.86, mistake: 0.082, grindSec: 28, grindAcc: 0.76, blunder: 0.078 },
  10: { reactSec: 4.18, mistake: 0.091, grindSec: 30, grindAcc: 0.73, blunder: 0.089 },
  11: { reactSec: 4.5, mistake: 0.1, grindSec: 32, grindAcc: 0.7, blunder: 0.1 },
};

/** Profile used by sim/ as the "perfect run" reference for the player seat. */
export const PERFECT_PROFILE = { reactSec: 0.5, mistake: 0, grindSec: 6, grindAcc: 1, blunder: 0 };

const DIRECTOR_EVERY_MS = 10000;
/** From here on bots stop buying and keep their batteries for one shipment at the bell. */
export const WINDDOWN_SEC = 240;
/** The director ships for every bot at this moment, top-down, so the final order is exact. */
export const LAST_CALL_SEC = 3;
/** Rank 1 lands this far below the perfect-run benchmark. */
export const RANK1_MARGIN = 2000;


export function createBotBrains(s) {
  const brains = {};
  for (const t of s.teams) {
    if (t.isPlayer) continue;
    brains[t.id] = {
      profile: PROFILES[t.targetRank],
      handicap: 0,
      nextActMs: int(s.rng, 4000),
      nextGrindMs: 0,
      sink: false,
      windDown: false,
      freeze: false,
      holdShip: false,
      virtual: { cash: 0, goods: 0 },
    };
  }
  brains._director = { nextMs: DIRECTOR_EVERY_MS, lastCallDone: false };
  return brains;
}

// ---------- economics helpers ----------

export function netPerBattery(s, fleetId) {
  const m = s.fleet[fleetId];
  return (m.sellPrice - m.shippingCost) / m.capacity;
}

function bestFleet(s) {
  return Object.keys(s.fleet).reduce((a, b) => (netPerBattery(s, b) > netPerBattery(s, a) ? b : a));
}

function feePerBattery(s, f) {
  return s.factories[f].price / s.factories[f].outputPerRun;
}

/** Value of one nickel unit once turned into a battery and shipped (rough, for decisions only). */
function nickelValue(s) {
  const fees = ['A', 'B', 'C'].map((f) => feePerBattery(s, f));
  return (netPerBattery(s, bestFleet(s)) - Math.min(...fees)) / 5;
}

/** Projected worth of a team, used by the director to compare teams mid game. */
export function projectedWorth(s, real) {
  const t = view(s, real);
  const perBattery = netPerBattery(s, bestFleet(s));
  const inProd = t.productions.reduce((n, p) => n + p.out, 0);
  return t.cash + (t.goods + inProd) * perBattery + t.raw * nickelValue(s);
}

// ---------- rank 1 shadow ledger ----------

/**
 * When rank 1 holds its shipments (see directorStep) it keeps a ledger of the loads it would have
 * shipped. Every decision, and every number the director reads about rank 1, uses this view, so
 * the match plays out exactly like the benchmark for everybody else.
 */
export function view(s, t) {
  const V = s.brains?.[t.id]?.virtual;
  if (!V || (!V.cash && !V.goods)) return t;
  return {
    id: t.id, isPlayer: t.isPlayer, targetRank: t.targetRank, productions: t.productions, grinding: t.grinding,
    get cash() { return t.cash + V.cash; },
    get goods() { return t.goods - V.goods; },
    get raw() { return t.raw; },
    get cooldownUntil() { return t.cooldownUntil; },
  };
}

// ---------- the policy ----------

/**
 * One decision turn for a team. `act(s, teamId, action)` is the engine's teamAction.
 * Exported so sim/ can drive the player seat with the same brain.
 * opts.buy = false skips the purchase this turn (the director uses it to slow a bot down).
 * opts.windDown = keep batteries for the bell, no purchases. opts.sink = burn cash on nickel.
 */
export function policyAct(s, real, profile, act, opts = {}) {
  const t = view(s, real);
  const V = opts.holdShip ? s.brains[real.id].virtual : null;
  const ship = (fleet) => {
    if (!V) return act(s, t.id, { type: 'ship', fleet });
    const m = s.fleet[fleet];
    if (t.goods < m.capacity || t.cash < m.shippingCost) return { ok: false };
    V.cash += m.sellPrice - m.shippingCost; // recorded, the batteries stay in the warehouse
    V.goods += m.capacity;
    return { ok: true };
  };
  const rem = SETTINGS.durationSec - s.gameMs / 1000;
  const reactGame = profile.reactSec * s.speed;
  const bySize = Object.keys(s.fleet).sort((a, b) => s.fleet[b].capacity - s.fleet[a].capacity);
  const best = bestFleet(s);
  const sellable = () => t.goods;
  const shipLargest = () => {
    for (const id of bySize) {
      const m = s.fleet[id];
      if (sellable() >= m.capacity && t.cash >= m.shippingCost) return ship(id).ok;
    }
    return false;
  };

  // 1. Ship. Bots in wind-down keep everything for the director's last call.
  if (opts.windDown) {
    // nothing
  } else if (rem < reactGame * 3 + 3) {
    while (shipLargest()); // last call: sell everything that fits
  } else {
    const m = s.fleet[opts.blunder && chance(s.rng, opts.blunder) ? 'Motor' : best];
    const running = t.productions.length > 0;
    const fedUp = !running && t.raw < Math.min(...Object.values(s.factories).map((f) => f.inputPerRun));
    if (sellable() >= m.capacity && t.cash >= m.shippingCost) ship(m.id);
    else if (t.cash < 25000 || fedUp || rem < 150) shipLargest();
  }

  // Cash kept aside so the next shipment can always be paid for (shipping is paid up front, and
  // costs go up in phase 3, hence the 1.5 factor).
  const pipeline = t.goods + t.productions.reduce((n, p) => n + p.out, 0);
  const shipReserve = 1.5 * (pipeline + 4 >= s.fleet.Truck.capacity ? s.fleet.Truck.shippingCost : s.fleet.Motor.shippingCost);

  // 2. Produce: cheapest fee per battery first, only if it finishes before the end.
  const factories = Object.keys(s.factories).sort((a, b) => feePerBattery(s, a) - feePerBattery(s, b));
  if (opts.blunder && chance(s.rng, opts.blunder)) factories.reverse();
  for (const f of factories) {
    if (opts.freeze) break;
    if (s.factories[f].timeSec + reactGame + 2 > rem - (opts.windDown ? LAST_CALL_SEC + 1 : 0)) continue;
    if (t.cash - s.factories[f].price < shipReserve) continue;
    act(s, t.id, { type: 'produce', factory: f });
  }

  // 3. Buy the pack with the best margin per purchase slot.
  if (opts.buy !== false && !opts.windDown && t.cooldownUntil <= s.gameMs) {
    const fastest = Math.min(...Object.values(s.factories).map((f) => f.timeSec));
    if (rem > fastest + reactGame * 2 + 10) {
      const nv = nickelValue(s);
      const candidates = Object.values(s.vendors)
        .filter((v) => v.stock >= v.qty && t.cash - v.price >= Math.max(shipReserve, 8000))
        .map((v) => ({ id: v.id, value: v.qty * (nv - v.price / v.qty) }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value);
      if (candidates.length) {
        let pickd = profile.mistake && chance(s.rng, profile.mistake) ? candidates[int(s.rng, candidates.length)] : candidates[0];
        if (opts.blunder && chance(s.rng, opts.blunder)) pickd = candidates.at(-1);
        act(s, t.id, { type: 'buy', vendor: pickd.id });
      }
    }
  }
  // 4. Endgame cash sink asked by the director: nickel and factory runs that can no longer pay off.
  if (opts.sink) {
    if (t.cooldownUntil <= s.gameMs) {
      const v = Object.values(s.vendors).filter((x) => x.stock >= x.qty && t.cash >= x.price).sort((a, b) => b.price - a.price)[0];
      if (v) act(s, t.id, { type: 'buy', vendor: v.id });
    }
    for (const f of Object.keys(s.factories).sort((a, b) => s.factories[b].price - s.factories[a].price)) {
      if (t.cash - s.factories[f].price < 0) continue;
      act(s, t.id, { type: 'produce', factory: f });
    }
  }
}

/** Grinding turn: answer the next open question. Right with probability grindAcc. */
export function grindAct(s, t, profile, act) {
  const g = t.grinding;
  if (!g.active) return;
  const qid = g.order.find((id) => !g.completed.includes(id) && (g.lockUntil[id] || 0) <= s.gameMs);
  if (qid == null) return;
  const q = INTEGER_QUESTIONS.find((x) => x.id === qid);
  const right = chance(s.rng, profile.grindAcc);
  const answer = right ? q.answers[0] : String((Number(q.answers[0]) % 100) + 1);
  act(s, t.id, { type: 'grind', questionId: qid, answer });
}

// ---------- per-step bot loop ----------

export function botsAct(s, act) {
  if (s.brains._director.lastCallDone) return;
  // Within one engine step the sharper bots move first, which is what reaction time means.
  for (const t of s.teams.filter((x) => !x.isPlayer).sort((a, b) => a.targetRank - b.targetRank)) {
    const b = s.brains[t.id];
    const p = b.profile;
    if (s.gameMs >= b.nextActMs) {
      if (!(p.mistake && chance(s.rng, p.mistake / 2))) {
        // The director's main lever is purchases: a bot that is too close to the one above it skips
        // buying turns (it hesitates), and trades a little worse.
        let buy = !(b.handicap > 0 && chance(s.rng, Math.min(0.97, b.handicap / 3)));
        // Off the reference run, the other bots leave fresh restocks to rank 1 for a moment, so a
        // player who crowds the market cannot drag rank 1 below the best case and slip past it.
        if (buy && s.offScript && t.targetRank > 1 && recentRestock(s)) buy = false;
        const blunder = Math.max(0, Math.min(0.6, p.blunder * (1 + Math.min(0, b.handicap)) + Math.max(0, b.handicap) / 10));
        policyAct(s, t, p, act, { buy, blunder, sink: b.sink, windDown: b.windDown, freeze: b.freeze, holdShip: b.holdShip });
      }
      b.nextActMs = s.gameMs + p.reactSec * s.speed * 1000 * (0.7 + 0.6 * next(s.rng));
    }
    if (t.grinding.active && s.gameMs >= b.nextGrindMs) {
      if (b.nextGrindMs > 0) grindAct(s, t, p, act);
      b.nextGrindMs = s.gameMs + p.grindSec * s.speed * 1000 * (1 + Math.max(0, b.handicap) / 3) * (0.7 + 0.6 * next(s.rng));
    } else if (!t.grinding.active) b.nextGrindMs = 0;
  }
}

const PRIORITY_WINDOW_MS = 4000;
function recentRestock(s) {
  const a = s.announcements;
  for (let i = a.length - 1; i >= 0 && s.gameMs - a[i].atMs <= PRIORITY_WINDOW_MS; i--) if (a[i].kind === 'restock') return true;
  return false;
}

// ---------- director ----------

/** Each bot aims to stay at or below this share of the bot right above it. */
const RATIO = 0.9;

export function directorStep(s) {
  const d = s.brains._director;
  const rem = SETTINGS.durationSec - s.gameMs / 1000;
  const bots = s.teams.filter((t) => !t.isPlayer).sort((a, b) => a.targetRank - b.targetRank);
  if (!d.lastCallDone && rem <= LAST_CALL_SEC) {
    lastCall(s, bots);
    d.lastCallDone = true;
    return;
  }
  // Rank 1 stops shipping once it could pass the benchmark. With 250,000+ in cash its purchases do
  // not change, and shipping touches no shared stock, so the rest of the match is unaffected.
  const top = s.brains[bots[0].id];
  if (!top.holdShip && s.benchmark != null && bots[0].cash >= 250000 && finalEstimate(s, bots[0]) >= rank1Cap(s) - 40000) top.holdShip = true;
  // Holding is only invisible while rank 1 has real cash to spare. If it runs low, part of the
  // warehouse is shipped for real and taken off the ledger.
  if (top.virtual.goods > 0 && bots[0].cash < 150000) {
    for (const id of Object.keys(s.fleet).sort((a, b) => s.fleet[b].capacity - s.fleet[a].capacity)) {
      const m = s.fleet[id];
      if (top.virtual.goods < m.capacity) continue;
      const before = bots[0].cash;
      if (teamActionRef(s, bots[0].id, { type: 'ship', fleet: id }).ok) {
        top.virtual.goods -= m.capacity;
        top.virtual.cash -= bots[0].cash - before;
      }
      break;
    }
  }
  if (s.gameMs < d.nextMs) return;
  d.nextMs = s.gameMs + DIRECTOR_EVERY_MS;
  const worth = bots.map((t) => projectedWorth(s, t));
  // Once the player has left the reference run, rank 1 is known to end below the benchmark, so the
  // bots under it are steered against that instead (before that, nothing may depend on it).
  if (s.offScript && s.benchmark != null) {
    const progress = Math.min(1, s.gameMs / 1000 / SETTINGS.durationSec);
    worth[0] = Math.min(worth[0], SETTINGS.initialCash + (s.benchmark - SETTINGS.initialCash) * Math.max(progress, 0.35));
  }
  for (let i = 1; i < bots.length; i++) {
    const b = s.brains[bots[i].id];
    const target = Math.min(worth[i - 1] * RATIO, worth[i - 1] - 8000);
    if (worth[i] > target) b.handicap = Math.min(3, b.handicap + (worth[i] > worth[i - 1] ? 0.6 : 0.25));
    else if (worth[i] < target * 0.93) b.handicap = Math.max(-1, b.handicap - 0.25);
  }
  if (rem <= WINDDOWN_SEC) windDown(s, bots);
}

/**
 * Wind-down: no more purchases, batteries are kept for the bell, and every bot except rank 1 stops
 * starting factory runs, so its cash before the bell is known. A bot whose cash already reaches the
 * cash of the bot above it burns some on nickel and factory runs that can no longer pay off.
 * Nothing here depends on the benchmark, so a player who copies the reference run sees exactly the
 * benchmark match.
 */
function windDown(s, bots) {
  // Dry run of the bell with the current numbers (rank 1 uncapped so nothing depends on the
  // benchmark): a bot whose cash alone already reaches its cap has to spend.
  let cap = Infinity;
  for (let i = 0; i < bots.length; i++) {
    const t = bots[i];
    const b = s.brains[t.id];
    // Rank 1 plays on normally until the bell; only its last shipments are trimmed there.
    b.windDown = i > 0;
    b.freeze = i > 0;
    b.sink = i > 0 && view(s, t).cash >= cap - 12000;
    const final = dryShipCash(s, t, cap - 1);
    cap = Math.min(cap, final) - 500;
  }
}

function dryShipCash(s, real, limit) {
  const t = view(s, real);
  const rem = SETTINGS.durationSec - s.gameMs / 1000;
  const goods = t.goods + t.productions.filter((p) => (p.completesAt - s.gameMs) / 1000 < rem - LAST_CALL_SEC).reduce((n, p) => n + p.out, 0);
  const plan = bestShipments(s, { ...t, goods }, limit);
  let cash = t.cash;
  for (const id of plan) cash += s.fleet[id].sellPrice - s.fleet[id].shippingCost;
  return plan.length || cash < limit ? cash : t.cash;
}

function rank1Cap(s) {
  return s.benchmark == null ? Infinity : s.benchmark - RANK1_MARGIN;
}

/**
 * The bell. Top-down, each bot ships the set of loads that gives it the most cash while staying
 * below the bot above it (rank 1 stays below the perfect-run benchmark). Unshipped batteries are
 * lost, exactly like in the original game.
 */
function lastCall(s, bots) {
  let cap = rank1Cap(s);
  const top = s.brains[bots[0].id];
  top.virtual = { cash: 0, goods: 0 }; // the warehouse is real again, shipped below
  top.holdShip = false;
  for (const t of bots) {
    if (t.cash >= cap) bellSink(s, t, cap);
    const plan = bestShipments(s, t, cap - 1);
    for (const id of plan) teamActionRef(s, t.id, { type: 'ship', fleet: id });
    cap = Math.min(cap, t.cash) - 500;
  }
}

/** Last-second spending for a bot that is still too rich: one nickel pack and idle factory runs. */
function bellSink(s, t, cap) {
  const v = Object.values(s.vendors).filter((x) => x.stock >= x.qty && t.cash >= x.price).sort((a, b) => b.price - a.price)[0];
  if (v) teamActionRef(s, t.id, { type: 'buy', vendor: v.id });
  for (const f of Object.keys(s.factories).sort((a, b) => s.factories[b].price - s.factories[a].price)) {
    if (t.cash < cap) break;
    teamActionRef(s, t.id, { type: 'produce', factory: f });
  }
}

/** Loads to ship (largest first) that maximise cash without reaching `limit`. */
export function bestShipments(s, t, limit) {
  const ids = Object.keys(s.fleet).sort((a, b) => s.fleet[b].capacity - s.fleet[a].capacity);
  const max = ids.map((id) => Math.floor(t.goods / s.fleet[id].capacity));
  let best = { cash: t.cash, plan: [] };
  for (let a = 0; a <= max[0]; a++) for (let b = 0; b <= max[1]; b++) for (let c = 0; c <= max[2]; c++) {
    const counts = [a, b, c];
    let goods = t.goods;
    let cash = t.cash;
    const plan = [];
    let ok = true;
    ids.forEach((id, k) => {
      const m = s.fleet[id];
      for (let n = 0; n < counts[k]; n++) {
        if (goods < m.capacity || cash < m.shippingCost) { ok = false; return; }
        goods -= m.capacity;
        cash += m.sellPrice - m.shippingCost;
        plan.push(id);
      }
    });
    if (ok && cash <= limit && cash > best.cash) best = { cash, plan };
  }
  return best.plan;
}

let teamActionRef = null;
/** The engine registers its teamAction here so the director can ship at the bell. */
export function registerActions(fn) {
  teamActionRef = fn;
}

/** Cash at the end if the team ships every battery it will have at the bell, biggest loads first. */
export function finalEstimate(s, t) {
  const rem = SETTINGS.durationSec - s.gameMs / 1000;
  let goods = t.goods + t.productions.filter((p) => (p.completesAt - s.gameMs) / 1000 < rem - LAST_CALL_SEC).reduce((n, p) => n + p.out, 0);
  let cash = t.cash;
  for (const id of Object.keys(s.fleet).sort((a, b) => s.fleet[b].capacity - s.fleet[a].capacity)) {
    const m = s.fleet[id];
    while (goods >= m.capacity && cash >= m.shippingCost) {
      goods -= m.capacity;
      cash += m.sellPrice - m.shippingCost;
    }
  }
  return cash;
}

// ---------- player seat driver (benchmark and simulator) ----------

/** Plays the player seat with a profile. Call before every engine tick. */
export function drivePlayerSeat(s, seat, profile, act) {
  const t = s.teams.find((x) => x.isPlayer);
  if (s.gameMs >= seat.nextActMs) {
    policyAct(s, t, profile, act);
    seat.nextActMs = s.gameMs + profile.reactSec * s.speed * 1000;
  }
  if (t.grinding.active && s.gameMs >= seat.nextGrindMs) {
    if (seat.nextGrindMs > 0) grindAct(s, t, profile, act);
    seat.nextGrindMs = s.gameMs + profile.grindSec * s.speed * 1000;
  } else if (!t.grinding.active) seat.nextGrindMs = 0;
}
