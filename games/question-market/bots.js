// Question Market bots.
//
// The market table is fixed, so the best possible run is a well-defined optimisation:
// hold at most one question, sell it at least one market minute after buying it, answer every
// question correctly. `marketCeiling()` solves that exactly with dynamic programming.
//
// Bot rank 1 plays the SECOND best run that exists (every answer correct). Only the optimal
// run beats it. Bots rank 2 to 11 are simulated traders whose parameters are sampled until
// their final cash lands inside the band of their rank, so the order never changes but the
// trades look different every game.

import { PRICES, START_CASH, LAST_BUY_MINUTE, LIQUIDATION_MINUTE, TOTAL_MINUTES } from './data/market.js';
import { makeRng, between, int, chance } from '../../shared/core/rng.js';
import { botsByRank } from '../../shared/core/roster.js';

const TOP_K = 3;

/**
 * Exact DP over the market. f(t) = best profit when free (holding nothing) at minute t.
 * A trade buys at m >= t and sells at s in [m + minHold, 30]; the trader is free again at s.
 * Keeps the TOP_K distinct profit values per state so we also get the runner-up run.
 */
export function marketCeiling(prices = PRICES, minHold = 1) {
  const memo = new Map();
  const f = (t) => {
    if (t > LAST_BUY_MINUTE) return [{ profit: 0, trades: [] }];
    if (memo.has(t)) return memo.get(t);
    let cands = [{ profit: 0, trades: [] }];
    for (let m = t; m <= LAST_BUY_MINUTE; m++) {
      for (let s = m + minHold; s <= LIQUIDATION_MINUTE; s++) {
        const p = prices[s].sellRight - prices[m].buy;
        if (p <= 0) continue;
        for (const rest of f(s)) {
          cands.push({ profit: p + rest.profit, trades: [{ buy: m, sell: s, correct: true }, ...rest.trades] });
        }
      }
    }
    cands.sort((a, b) => b.profit - a.profit);
    const out = [];
    for (const c of cands) {
      if (!out.some((o) => o.profit === c.profit)) out.push(c);
      if (out.length === TOP_K) break;
    }
    memo.set(t, out);
    return out;
  };
  const top = f(0);
  return {
    best: { finalCash: START_CASH + top[0].profit, trades: top[0].trades },
    runnerUp: { finalCash: START_CASH + top[1].profit, trades: top[1].trades },
  };
}

/** Plays a trade list against the market, returns final cash (wrong answer = sellWrong). */
export function settle(trades, prices = PRICES) {
  let cash = START_CASH;
  for (const t of trades) {
    cash -= prices[t.buy].buy;
    cash += t.correct ? prices[t.sell].sellRight : prices[t.sell].sellWrong;
  }
  return cash;
}

/**
 * One simulated trader. Parameters are in REAL seconds where it matters (solveSec), so the
 * same trader makes fewer trades in a 10 minute game than in a 30 minute game.
 */
function simulateTrader(p, secPerMinute, rng, prices = PRICES) {
  const hold = Math.max(1, Math.ceil(p.solveSec / secPerMinute));
  const trades = [];
  let cash = START_CASH;
  let t = 0;
  while (t <= LAST_BUY_MINUTE) {
    if (chance(rng, p.idle) || cash < prices[t].buy) { t++; continue; }
    const lo = t + hold;
    const hi = Math.min(LIQUIDATION_MINUTE, t + Math.max(hold, p.lookahead));
    if (lo > LIQUIDATION_MINUTE) break;
    let bestS = -1;
    let bestP = -Infinity;
    for (let s = lo; s <= hi; s++) {
      const gain = prices[s].sellRight - prices[t].buy;
      if (gain > bestP) { bestP = gain; bestS = s; }
    }
    if (bestP < p.threshold && !chance(rng, p.impulse)) { t++; continue; }
    let sell = bestS;
    if (chance(rng, p.misTiming)) sell = lo + int(rng, hi - lo + 1);
    const correct = chance(rng, p.accuracy);
    trades.push({ buy: t, sell, correct });
    cash += -prices[t].buy + (correct ? prices[sell].sellRight : prices[sell].sellWrong);
    t = sell;
  }
  return trades;
}

function sampleParams(rng) {
  return {
    accuracy: between(rng, 0.35, 1),
    solveSec: between(rng, 15, 140),
    lookahead: 1 + int(rng, 14),
    threshold: between(rng, -5000, 30000),
    idle: between(rng, 0, 0.45),
    impulse: between(rng, 0, 0.35),
    misTiming: between(rng, 0, 0.5),
  };
}

/** Target profit band (fraction of the ceiling profit) for ranks 2 to 11. */
const BAND_CENTER = { 2: 0.84, 3: 0.74, 4: 0.64, 5: 0.54, 6: 0.44, 7: 0.34, 8: 0.24, 9: 0.14, 10: 0.04, 11: -0.08 };
const BAND_HALF = 0.04;
/** Shorter games realistically allow fewer trades, so the ladder below rank 1 is scaled down. */
const DURATION_FACTOR = { 10: 0.7, 15: 0.85, 30: 1 };

export function bandFor(rank, durationMin, ceilingProfit) {
  const c = BAND_CENTER[rank] * (BAND_CENTER[rank] > 0 ? DURATION_FACTOR[durationMin] : 1);
  return { lo: START_CASH + (c - BAND_HALF) * ceilingProfit, hi: START_CASH + (c + BAND_HALF) * ceilingProfit };
}

/**
 * Builds the 11 bot plans for one game.
 * @returns {Array<{botId, rank, trades, finalCash}>} sorted by rank
 */
export function buildBotPlans({ durationMin, seed }) {
  const rng = makeRng(seed ^ 0x51a7);
  const secPerMinute = (durationMin * 60) / TOTAL_MINUTES;
  const ceiling = marketCeiling();
  const ceilingProfit = ceiling.best.finalCash - START_CASH;
  const roster = botsByRank('qm');
  // One pool of simulated traders per game, then each rank takes a trader from its band.
  const pool = [];
  for (let i = 0; i < 4000; i++) {
    const trades = simulateTrader(sampleParams(rng), secPerMinute, rng);
    pool.push({ trades, cash: settle(trades) });
  }
  const plans = [];
  let prev = Infinity;
  for (const bot of roster) {
    const rank = bot.rank.qm;
    if (rank === 1) {
      plans.push({ botId: bot.id, rank, trades: ceiling.runnerUp.trades, finalCash: ceiling.runnerUp.finalCash });
      prev = ceiling.runnerUp.finalCash;
      continue;
    }
    const band = bandFor(rank, durationMin, ceilingProfit);
    const below = pool.filter((c) => c.cash <= prev - 2000);
    const inBand = below.filter((c) => c.cash >= band.lo && c.cash < band.hi);
    let pickd;
    if (inBand.length) pickd = inBand[int(rng, inBand.length)];
    else {
      const mid = (band.lo + band.hi) / 2;
      pickd = below.reduce((a, c) => (Math.abs(c.cash - mid) < Math.abs(a.cash - mid) ? c : a));
    }
    plans.push({ botId: bot.id, rank, trades: pickd.trades, finalCash: pickd.cash });
    prev = pickd.cash;
  }
  // Safety net: strictly decreasing final cash by rank.
  for (let i = 1; i < plans.length; i++) {
    if (plans[i].finalCash >= plans[i - 1].finalCash) throw new Error(`QM plan order broken at rank ${plans[i].rank}`);
  }
  // Spread each action inside its minute so the live board does not jump all at once.
  for (const plan of plans) {
    plan.trades = plan.trades.map((t) => ({
      ...t,
      buyAt: t.buy + between(rng, 0.35, 0.85),
      sellAt: t.sell + between(rng, 0.05, 0.3),
    }));
  }
  return plans;
}


