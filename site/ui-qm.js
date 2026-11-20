// Question Market screen. Layout areas: minute, prices, desk, news, chart, board.
// Phone: one column in that order. Laptop: three columns (market, desk, board).

import * as E from '../games/question-market/engine.js';
import { t, getLang } from './i18n.js';
import { $, esc, setText, setHTML, rp, pct, clock, icon, avatar, toast, slotOf } from './util.js';
import { lineChart } from './chart.js';
import { sfx } from './sfx.js';
import { bump, burst, play } from './fx.js';

export const KEYS = [['B', 'k_buy'], ['S', 'k_sell'], ['P', 'k_pause']];

export function create(root, opts) {
  const s = E.createGame(opts);
  E.apply(s, { type: 'start' });
  root.innerHTML = `
    <div class="g-top"><div class="g-top-in">
      <button class="btn btn-ghost btn-icon" id="quit" type="button" aria-label="${t('quit')}">${icon('x')}</button>
      <div class="title">QUESTION MARKET</div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end"><span class="clock" id="clk"></span><button class="btn btn-ghost btn-icon" id="pause" type="button" aria-label="${t('pause')}">${icon('pause')}</button></div>
    </div></div>
    <div class="g-grid qm-grid qm-areas">
      <div class="qm-col">
      <div class="card qm-minute a-min">
        <span class="stat-label">${t('minute')}</span>
        <span class="big num" id="min">0</span>
        <div class="bar gold" style="width:100%"><i id="minbar"></i></div>
        <div id="liq" hidden class="banner banner-down" style="width:100%">${t('liquidation')}. ${t('liq_p')}</div>
      </div>
      <div class="prices a-prices">
        <div class="card price stat"><div class="stat-label">${t('buy_price')}</div><div class="stat-value" id="pb"></div><div class="stat-sub" id="pbc"></div></div>
        <div class="card price stat"><div class="stat-label">${t('sell_right')}</div><div class="stat-value" id="pr"></div><div class="stat-sub" id="prc"></div></div>
        <div class="card price stat"><div class="stat-label">${t('sell_wrong')}</div><div class="stat-value" id="pw"></div><div class="stat-sub" id="pwc"></div></div>
      </div>
      <div class="card chart a-chart"><h2 class="card-title">${t('price_chart')}</h2><div class="chart-legend"><span style="--c:var(--purple-700)">${t('buy_price')}</span><span style="--c:var(--green-600)">${t('sell_right')}</span></div><div id="chart"></div></div>
      </div>
      <div class="qm-col">
      <div class="desk a-desk">
        <div class="card stat"><div class="stat-label">${t('your_cash')}</div><div class="stat-value" id="cash" style="font-size:var(--t-2xl)"></div><div class="stat-sub" id="myrank"></div></div>
        <div class="card" id="buyView">
          <button class="btn btn-primary btn-l btn-block" id="buy" type="button">${t('buy_q')} <kbd>B</kbd></button>
          <p class="why" id="buyWhy"></p>
        </div>
        <div class="card" id="holdView" hidden>
          <div class="q-box"><p class="meta" id="hmeta"></p><p class="q" id="qtext"></p></div>
          <div class="field" style="margin-top:10px"><label for="ans">${t('your_answer')}</label><input class="input num" id="ans" inputmode="numeric" autocomplete="off" enterkeyhint="done"></div>
          <button class="btn btn-primary btn-l btn-block" id="sell" type="button" style="margin-top:10px">${t('sell_q')} <kbd>S</kbd></button>
          <p class="why" id="sellWhy"></p>
        </div>
      </div>
      <div class="card narr a-news"><span class="badge badge-down new" id="newb" hidden>${t('news_new')}</span><h2 class="card-title">${t('market_news')}</h2><p class="j" id="news"></p></div>
      </div>
      <div class="card a-board"><h2 class="card-title">${t('standings')}</h2><div class="board" id="board"></div></div>
    </div>`;

  const ui = { state: s, onPause: null, onQuit: null };
  let lastMinute = -1;
  let seenEvents = 0;
  let newsUntil = 0;
  let lastHolding = null;
  let lastCash = s.player.cash;
  let lastRank = null;
  let wasLiq = false;

  const doBuy = () => {
    E.apply(s, { type: 'buy' });
    if (s.player.holding) setTimeout(() => $('#ans', root)?.focus(), 30);
  };
  const doSell = () => E.apply(s, { type: 'sell' });
  $('#buy', root).onclick = doBuy;
  $('#sell', root).onclick = doSell;
  $('#ans', root).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9-]/g, ''); E.apply(s, { type: 'answer', value: e.target.value }); });
  $('#ans', root).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSell(); } });
  $('#pause', root).onclick = () => ui.onPause?.();
  $('#quit', root).onclick = () => ui.onQuit?.();

  ui.tick = (dt) => E.apply(s, { type: 'tick', dtMs: dt });
  ui.remainingMs = () => E.remainingMs(s);
  ui.onKey = (e) => {
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); doBuy(); }
    if (k === 's') { e.preventDefault(); doSell(); }
  };

  const change = (now, prev) => {
    if (prev == null) return '';
    const c = (now - prev) / prev;
    return `<span class="${c > 0 ? 'up' : c < 0 ? 'down' : ''}">${c > 0 ? '▲' : c < 0 ? '▼' : ''} ${pct(c)}</span>`;
  };

  ui.render = () => {
    const m = s.minute;
    const row = E.priceAt(s);
    const prev = m > 0 ? E.PRICES[Math.min(m, 30) - 1] : null;
    setText($('#clk', root), clock(E.remainingMs(s)));
    setText($('#min', root), m >= 30 ? '30' : m);
    $('#minbar', root).style.width = `${(1 - E.msLeftInMinute(s) / s.msPerMinute) * 100}%`;
    const liq = E.isLiquidation(s);
    $('#liq', root).hidden = !liq;
    if (liq && !wasLiq) { sfx('alarm'); play($('#liq', root), 'pop-in'); }
    wasLiq = liq;
    setText($('#pb', root), rp(row.buy));
    setText($('#pr', root), rp(row.sellRight));
    setText($('#pw', root), rp(row.sellWrong));
    setHTML($('#pbc', root), m >= 30 ? '' : change(row.buy, prev?.buy));
    setHTML($('#prc', root), change(row.sellRight, prev?.sellRight));
    setHTML($('#pwc', root), change(row.sellWrong, prev?.sellWrong));
    setText($('#cash', root), rp(s.player.cash));
    if (s.player.cash !== lastCash) { bump($('#cash', root), s.player.cash - lastCash); lastCash = s.player.cash; }

    // desk
    const h = s.player.holding;
    if (!!h !== lastHolding) {
      $('#buyView', root).hidden = !!h;
      $('#holdView', root).hidden = !h;
      if (h) {
        const q = E.questionById(h.questionId);
        setText($('#qtext', root), q.question);
        setText($('#hmeta', root), t('holding', { m: h.boughtMinute, p: rp(h.buyPrice) }));
        $('#ans', root).value = '';
      }
      lastHolding = !!h;
    }
    const cb = E.canBuy(s);
    $('#buy', root).disabled = !cb.ok;
    setText($('#buyWhy', root), cb.ok ? '' : t('r_' + cb.reason));
    const cs = E.canSell(s);
    $('#sell', root).disabled = !cs.ok;
    setText($('#sellWhy', root), cs.ok ? '' : t('r_' + cs.reason));

    // news, chart on minute change
    if (m !== lastMinute) {
      const n = E.currentNarrative(s);
      setText($('#news', root), n[getLang()] || n.en);
      if ([0, 10, 20].includes(m) && lastMinute !== -1) {
        newsUntil = performance.now() + 6000;
        $('.a-news', root).classList.remove('flash');
        void $('.a-news', root).offsetWidth;
        $('.a-news', root).classList.add('flash');
        sfx('bell');
      }
      if (lastMinute !== -1) ['#pb', '#pr', '#pw'].forEach((id, i) => setTimeout(() => play($(id, root), 'flip'), i * 90));
      const upto = Math.min(m, 30);
      const buys = E.PRICES.slice(0, Math.min(upto, 29) + 1).map((p) => p.buy);
      const rights = E.PRICES.slice(0, upto + 1).map((p) => p.sellRight);
      setHTML($('#chart', root), lineChart([
        { name: t('buy_price'), color: 'var(--purple-700)', values: buys },
        { name: t('sell_right'), color: 'var(--green-600)', values: rights },
      ], { xMax: 30, fmtY: (v) => Math.round(v / 1000) + 'k' }));
      lastMinute = m;
    }
    $('#newb', root).hidden = performance.now() > newsUntil;

    // toasts for the player's own results
    while (seenEvents < s.events.length) {
      const ev = s.events[seenEvents++];
      if (ev.teamId !== 'player') continue;
      if (ev.kind === 'sell_right') { toast(t('sold_right', { p: rp(ev.amount) }), 'up'); sfx('win'); burst($('#cash', root)); }
      else if (ev.kind === 'sell_wrong') { toast(t('sold_wrong', { p: rp(ev.amount) }), 'down'); sfx('lose'); play($('#cash', root).closest('.card'), 'shake'); }
      else if (ev.kind === 'buy') { toast(t('bought', { p: rp(-ev.amount) })); sfx('coin'); play($('#holdView', root), 'pop-in'); }
    }

    // board
    const lb = E.leaderboard(s);
    const me = lb.find((r) => r.isPlayer);
    setText($('#myrank', root), `#${me.rank} / 12`);
    if (lastRank != null && me.rank < lastRank) { sfx('rankup'); play($('#myrank', root), 'bump-up'); }
    lastRank = me.rank;
    setHTML($('#board', root), lb.map((r) => `<div class="row ${r.isPlayer ? 'me' : ''} ${r.rank === 1 ? 'top1' : ''}"><span class="rk">${r.rank}</span>${avatar(r, slotOf(r.id))}<span class="nm">${esc(r.name)}</span><span class="sc">${rp(r.cash)}</span></div>`).join(''));
  };

  ui.scoreLabel = () => t('cash');
  ui.finalRows = () => E.leaderboard(s).map((r) => ({ ...r, slot: slotOf(r.id), score: rp(r.cash) }));
  ui.summary = () => {
    const tr = s.player.trades.filter((x) => !x.expired);
    const right = tr.filter((x) => x.correct).length;
    const bestTrade = tr.reduce((b, x) => Math.max(b, x.received - x.buyPrice), -Infinity);
    const top = s.bots.find((b) => b.targetRank === 1);
    const mine = Array.from({ length: 31 }, (_, i) => s.player.cashByMinute[i] ?? null);
    const theirs = Array.from({ length: 31 }, (_, i) => top.cashByMinute[i] ?? null);
    return `<div class="scr-stats" style="margin-bottom:12px">
        <div class="card stat"><div class="stat-label">${t('s_trades')}</div><div class="stat-value">${tr.length}</div></div>
        <div class="card stat"><div class="stat-label">${t('s_right')}</div><div class="stat-value">${right}</div></div>
        <div class="card stat"><div class="stat-label">${t('s_best')}</div><div class="stat-value" style="font-size:var(--t-l)">${tr.length ? rp(bestTrade) : '0'}</div></div>
        <div class="card stat"><div class="stat-label">${t('your_cash')}</div><div class="stat-value" style="font-size:var(--t-l)">${rp(s.player.cash)}</div></div>
      </div>
      <p class="center mu">${t('cash_vs')}</p>
      <div class="chart">${lineChart([
        { name: esc(s.player.name), color: 'var(--gold-600)', values: mine },
        { name: top.name, color: 'var(--purple-700)', values: theirs },
      ], { xMax: 30, fmtY: (v) => Math.round(v / 1000) + 'k' })}</div>`;
  };
  return ui;
}
