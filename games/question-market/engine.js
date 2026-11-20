// Question Market engine (single player vs 11 bots). No DOM, no clock: time only moves through
// { type: 'tick', dtMs } actions, so the same engine runs in the browser, in sim/ and in tests.
//
// Rules kept from OLFACTION 2026: start cash 150,000, market minutes 0 to 29 with the original
// price table, minute 30 is liquidation (no buying, sell at minute 29 prices), a wrong answer
// sells at 30% of the right price, ranking by cash. Single-player adaptations are listed in
// docs/LOGIC.md and in spec 02.

import { PRICES, START_CASH, LAST_BUY_MINUTE, LIQUIDATION_MINUTE, TOTAL_MINUTES, NARRATIVES } from './data/market.js';
import { INTEGER_QUESTIONS } from '../../shared/data/integer-questions.js';
import { makeRng, shuffle, randomSeed } from '../../shared/core/rng.js';
import { BOTS, PLAYER_ID, assertDuration } from '../../shared/core/roster.js';
import { buildBotPlans } from './bots.js';

export const GAME_ID = 'qm';
/** A question must be held at least this many market minutes before it can be sold. */
export const MIN_HOLD_MINUTES = 1;

export function createGame({ durationMin = 15, playerName = 'Player', seed = randomSeed() } = {}) {
  const d = assertDuration(durationMin);
  const rng = makeRng(seed);
  const plans = buildBotPlans({ durationMin: d, seed });
  const bots = plans.map((p) => {
    const b = BOTS.find((x) => x.id === p.botId);
    return {
      id: b.id, name: b.short, fullName: b.name, isPlayer: false, targetRank: p.rank,
      cash: START_CASH, holding: null, plan: p.trades, cursor: 0, trades: 0,
      cashByMinute: [],
    };
  });
  return {
    game: GAME_ID,
    seed,
    durationMin: d,
    msPerMinute: (d * 60000) / TOTAL_MINUTES,
    status: 'ready', // ready | running | finished
    elapsedMs: 0,
    minute: 0,
    rng,
    questionOrder: shuffle(rng, INTEGER_QUESTIONS.map((q) => q.id)),
    questionCursor: 0,
    player: {
      id: PLAYER_ID, name: playerName, isPlayer: true, cash: START_CASH,
      holding: null, // { questionId, boughtMinute, buyPrice, answer }
      trades: [], // settled trades, for the summary screen
      cashByMinute: [],
    },
    bots,
    events: [], // { atMs, kind, teamId, text } for toasts and the feed
  };
}

// ---------- selectors ----------

export function priceAt(state, minute = state.minute) {
  return PRICES[Math.min(minute, LIQUIDATION_MINUTE)];
}

export function isLiquidation(state) {
  return state.minute >= LIQUIDATION_MINUTE;
}

export function remainingMs(state) {
  return Math.max(0, TOTAL_MINUTES * state.msPerMinute - state.elapsedMs);
}

export function msLeftInMinute(state) {
  return state.msPerMinute - (state.elapsedMs % state.msPerMinute);
}

export function currentNarrative(state) {
  return NARRATIVES.filter((n) => n.minute <= state.minute).at(-1);
}

export function questionById(id) {
  return INTEGER_QUESTIONS.find((q) => q.id === id);
}

export function canBuy(state) {
  const p = state.player;
  if (state.status !== 'running') return { ok: false, reason: 'not_running' };
  if (state.minute > LAST_BUY_MINUTE) return { ok: false, reason: 'liquidation' };
  if (p.holding) return { ok: false, reason: 'already_holding' };
  if (p.cash < priceAt(state).buy) return { ok: false, reason: 'not_enough_cash' };
  return { ok: true };
}

export function canSell(state) {
  const p = state.player;
  if (state.status !== 'running') return { ok: false, reason: 'not_running' };
  if (!p.holding) return { ok: false, reason: 'nothing_to_sell' };
  if (state.minute < p.holding.boughtMinute + MIN_HOLD_MINUTES) return { ok: false, reason: 'too_early' };
  return { ok: true };
}

/** All 12 teams sorted by cash. Ties share a rank, and on a tie the bot is listed first. */
export function leaderboard(state) {
  const rows = [...state.bots, state.player].map((t) => ({
    id: t.id, name: t.name, isPlayer: t.isPlayer, cash: t.cash, holding: !!t.holding, targetRank: t.targetRank ?? null,
  }));
  rows.sort((a, b) => b.cash - a.cash || (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0) || a.targetRank - b.targetRank);
  let rank = 0;
  rows.forEach((r, i) => {
    if (i === 0 || r.cash !== rows[i - 1].cash) rank = i + 1;
    r.rank = rank;
  });
  return rows;
}

// ---------- reducer ----------

/** Pure reducer: returns a new state, the input is not touched. */
export function reduce(state, action) {
  return apply(structuredClone(state), action);
}

/** Mutating version used by the simulator for speed. Same rules as reduce. */
export function apply(s, action) {
  switch (action.type) {
    case 'start':
      if (s.status === 'ready') s.status = 'running';
      return s;
    case 'tick':
      return tick(s, action.dtMs);
    case 'buy':
      return buy(s);
    case 'answer':
      if (s.player.holding && s.status === 'running') s.player.holding.answer = String(action.value ?? '').trim();
      return s;
    case 'sell':
      return sell(s);
    default:
      throw new Error(`Unknown action ${action.type}`);
  }
}

function buy(s) {
  if (!canBuy(s).ok) return s;
  const price = priceAt(s).buy;
  const qid = s.questionOrder[s.questionCursor % s.questionOrder.length];
  s.questionCursor++;
  s.player.cash -= price;
  s.player.holding = { questionId: qid, boughtMinute: s.minute, buyPrice: price, answer: '' };
  s.events.push({ atMs: s.elapsedMs, kind: 'buy', teamId: PLAYER_ID, amount: -price });
  return s;
}

function isCorrect(holding) {
  const q = questionById(holding.questionId);
  if (!/^[+-]?\d+$/.test(holding.answer)) return false;
  return q.answers.includes(String(Number.parseInt(holding.answer, 10)));
}

function sell(s) {
  if (!canSell(s).ok) return s;
  const h = s.player.holding;
  const row = priceAt(s);
  const correct = isCorrect(h);
  const received = correct ? row.sellRight : row.sellWrong;
  s.player.cash += received;
  s.player.trades.push({ questionId: h.questionId, buy: h.boughtMinute, sell: s.minute, buyPrice: h.buyPrice, received, correct });
  s.player.holding = null;
  s.events.push({ atMs: s.elapsedMs, kind: correct ? 'sell_right' : 'sell_wrong', teamId: PLAYER_ID, amount: received });
  return s;
}

function tick(s, dtMs) {
  if (s.status !== 'running' || !(dtMs > 0)) return s;
  const endMs = TOTAL_MINUTES * s.msPerMinute;
  const target = Math.min(endMs, s.elapsedMs + dtMs);
  // Bot actions fire at their own fractional minute, in time order.
  for (const b of s.bots) runBot(s, b, target / s.msPerMinute);
  const prevMinute = s.minute;
  s.elapsedMs = target;
  s.minute = Math.min(LIQUIDATION_MINUTE, Math.floor(target / s.msPerMinute));
  for (let m = prevMinute; m < Math.floor(target / s.msPerMinute) && m <= LIQUIDATION_MINUTE; m++) snapshot(s, m);
  if (target >= endMs) finish(s);
  return s;
}

function runBot(s, b, nowMinute) {
  while (b.cursor < b.plan.length * 2) {
    const trade = b.plan[Math.floor(b.cursor / 2)];
    const isBuy = b.cursor % 2 === 0;
    const at = isBuy ? trade.buyAt : trade.sellAt;
    if (at > nowMinute) break;
    if (isBuy) {
      b.cash -= PRICES[trade.buy].buy;
      b.holding = { boughtMinute: trade.buy };
    } else {
      b.cash += trade.correct ? PRICES[trade.sell].sellRight : PRICES[trade.sell].sellWrong;
      b.holding = null;
      b.trades++;
    }
    b.cursor++;
  }
}

function snapshot(s, minute) {
  for (const t of [...s.bots, s.player]) t.cashByMinute[minute] = t.cash;
}

function finish(s) {
  // A question still held when liquidation closes is worth nothing (its purchase price is gone).
  if (s.player.holding) {
    s.player.trades.push({ ...s.player.holding, sell: null, received: 0, correct: false, expired: true });
    s.player.holding = null;
  }
  s.status = 'finished';
}

export { START_CASH, PRICES, NARRATIVES, TOTAL_MINUTES, LIQUIDATION_MINUTE };
