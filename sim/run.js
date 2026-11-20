// Monte Carlo runner. Plays every game x duration x player style many times and checks the two
// promises: the 11 bots always finish in table order, and only the best-case run beats rank 1.
// Usage: node sim/run.js [gamesPerCell=200] [scrGamesPerCell=100]
// Writes sim/out/results.csv (one row per match) and sim/out/summary.json.

import { mkdirSync, writeFileSync } from 'node:fs';
import { playQM, playTTS, playSCR, botOrderOk, QM, TTS, SCR } from '../tests/helpers.js';
import { PERFECT_PROFILE } from '../games/supply-chain-rush/bots.js';
import { DURATIONS } from '../shared/core/roster.js';

const N = Number(process.argv[2] || 200);
const N_SCR = Number(process.argv[3] || Math.max(20, Math.round(N / 2)));

const STYLES = {
  qm: {
    perfect: 'perfect',
    good: { accuracy: 0.9, everyMinutes: 2 },
    casual: { accuracy: 0.7, everyMinutes: 3 },
    idle: 'idle',
  },
  tts: {
    perfect: { accuracy: 1, answerMs: 4000 },
    good: { accuracy: 0.9, answerMs: 15000 },
    casual: { accuracy: 0.7, answerMs: 25000 },
    afk: { accuracy: 0, answerMs: 1e9 },
  },
  scr: {
    perfect: PERFECT_PROFILE,
    nearPerfect: { reactSec: 0.8, mistake: 0, grindSec: 8, grindAcc: 1, blunder: 0 },
    good: { reactSec: 3, mistake: 0.05, grindSec: 20, grindAcc: 0.9, blunder: 0 },
    slow: { reactSec: 6, mistake: 0.15, grindSec: 40, grindAcc: 0.7, blunder: 0.2 },
    idle: null,
  },
};

const rows = [];
const summary = [];
const t0 = Date.now();

for (const game of ['qm', 'tts', 'scr']) {
  for (const d of DURATIONS) {
    for (const [style, prof] of Object.entries(STYLES[game])) {
      const n = game === 'scr' ? N_SCR : N;
      let orderOk = 0;
      let first = 0;
      let rankSum = 0;
      let firstAboveBench = 0;
      for (let seed = 1; seed <= n; seed++) {
        let lb;
        let extra = {};
        if (game === 'qm') {
          const s = playQM(d, seed, prof);
          lb = QM.leaderboard(s);
          extra = { trades: s.player.trades.length };
        } else if (game === 'tts') {
          const s = playTTS(d, seed, prof);
          lb = TTS.leaderboard(s);
          extra = { rounds: s.history.length, teoriRounds: s.history.filter((h) => h.type === 'Teori').length, endReason: s.endReason, minutes: (s.elapsedMs / 60000).toFixed(2) };
        } else {
          const s = playSCR(d, seed, prof);
          lb = SCR.leaderboard(s);
          extra = { benchmark: s.benchmark, seedUsed: s.seed };
          const me = lb.find((x) => x.isPlayer);
          if (me.rank === 1 && me.cash >= s.benchmark) firstAboveBench++;
        }
        const me = lb.find((x) => x.isPlayer);
        const ok = botOrderOk(lb);
        orderOk += ok;
        first += me.rank === 1;
        rankSum += me.rank;
        const r1 = lb.find((x) => x.targetRank === 1);
        rows.push({ game, duration: d, style, seed, playerRank: me.rank, playerScore: me.cash ?? me.langkah, rank1Score: r1.cash ?? r1.langkah, botOrderOk: ok ? 1 : 0, ...extra });
      }
      const cell = { game, duration: d, style, matches: n, botOrderOk: orderOk / n, playerFirst: first / n, avgPlayerRank: +(rankSum / n).toFixed(2) };
      if (game === 'scr') cell.firstWhileBeatingBenchmark = first ? firstAboveBench / first : null;
      summary.push(cell);
      console.log(JSON.stringify(cell));
    }
  }
}

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => r[k] ?? '').join(','))].join('\n');
writeFileSync(new URL('./out/results.csv', import.meta.url), csv);
writeFileSync(new URL('./out/summary.json', import.meta.url), JSON.stringify({ generated: new Date().toISOString(), seconds: (Date.now() - t0) / 1000, summary }, null, 2));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s, ${rows.length} matches`);
