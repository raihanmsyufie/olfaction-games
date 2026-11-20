// Supply Chain Rush screen. Phone: stats on top, tabs for Buy / Produce / Ship / Board.
// Laptop: the three posts side by side, standings on the right.

import * as E from '../games/supply-chain-rush/engine.js';
import { t, getLang } from './i18n.js';
import { $, $$, esc, setText, setHTML, usd, clock, icon, avatar, toast, slotOf } from './util.js';
import { sfx } from './sfx.js';
import { bump, burst, play } from './fx.js';

export const KEYS = [['1 2 3', 'buy'], ['Q W E', 'produce'], ['Z X C', 'ship'], ['P', 'k_pause']];
const FLEET_KEYS = { Motor: 'Z', Truck: 'X', Pesawat: 'C' };
const FAC_KEYS = { A: 'Q', B: 'W', C: 'E' };

export function create(root, opts) {
  const s = E.createGame(opts);
  E.apply(s, { type: 'start' });
  const sp = s.speed;
  const realS = (gameMs) => Math.max(0, Math.ceil(gameMs / 1000 / sp));
  const vendorCard = (v) => `
    <div class="card unit" data-v="${v.id}">
      <div class="top"><span class="nm">${t('vendor', { id: v.id })}</span><span class="chip" data-f="qty"></span></div>
      <div class="facts"><div><b data-f="price"></b><span>${t('price')}</span></div><div><b data-f="unit"></b><span>/ ${t('nickel')}</span></div><div><b data-f="stock"></b><span>${t('stock')}</span></div></div>
      <div class="bar green"><i data-f="sbar"></i></div>
      <button class="btn btn-primary" type="button" data-act="buy">${t('buy')} <kbd>${['A', 'B', 'C'].indexOf(v.id) + 1}</kbd></button>
      <p class="why" data-f="why"></p>
    </div>`;
  const facCard = (f) => `
    <div class="card unit" data-fac="${f.id}">
      <div class="top"><span class="nm">${t('factory', { id: f.id })}</span><span class="chip" data-f="io"></span></div>
      <div class="facts"><div><b data-f="time"></b><span>${t('time')}</span></div><div><b data-f="fee"></b><span>${t('fee')}</span></div><div><b data-f="per"></b><span>${t('per_batt_s')}</span></div></div>
      <div class="bar"><i data-f="pbar"></i></div>
      <button class="btn btn-primary" type="button" data-act="produce">${t('produce')} <kbd>${FAC_KEYS[f.id]}</kbd></button>
      <p class="why" data-f="why"></p>
    </div>`;
  const fleetCard = (m) => `
    <div class="card unit" data-m="${m.id}">
      <div class="top"><span class="nm">${t('fleet_' + m.id)}</span><span class="chip" data-f="cap"></span></div>
      <div class="facts"><div><b data-f="sale"></b><span>${t('sale')}</span></div><div><b data-f="cost"></b><span>${t('ship_cost')}</span></div><div><b data-f="net"></b><span>${t('net_batt_s')}</span></div></div>
      <button class="btn btn-primary" type="button" data-act="ship">${t('ship')} <kbd>${FLEET_KEYS[m.id]}</kbd></button>
      <p class="why" data-f="why"></p>
    </div>`;

  root.innerHTML = `
    <div class="g-top"><div class="g-top-in">
      <button class="btn btn-ghost btn-icon" id="quit" type="button" aria-label="${t('quit')}">${icon('x')}</button>
      <div class="title">SUPPLY CHAIN RUSH</div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end"><span class="clock" id="clk"></span><button class="btn btn-ghost btn-icon" id="pause" type="button" aria-label="${t('pause')}">${icon('pause')}</button></div>
    </div></div>
    <div class="scr-stats" style="margin-top:14px">
      <div class="card stat"><div class="stat-label">${t('cash')}</div><div class="stat-value" id="cash"></div><div class="stat-sub" id="rank"></div></div>
      <div class="card stat"><div class="stat-label">${t('nickel')}</div><div class="stat-value" id="raw"></div></div>
      <div class="card stat"><div class="stat-label">${t('batteries')}</div><div class="stat-value" id="goods"></div><div class="stat-sub" id="inprod"></div></div>
      <div class="card stat"><div class="stat-label">${t('cooldown')}</div><div class="stat-value" id="cd"></div><div class="bar gold" style="margin-top:6px"><i id="cdbar"></i></div></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px"><span class="badge badge-brand" id="phase"></span><span class="chip">${t('speed', { n: sp })}</span></div>
    <div class="tabs scr-tabs" role="tablist" style="margin-top:12px">
      <button class="tab" role="tab" aria-selected="true" data-tab="buy">${t('buy')}</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="produce">${t('produce')}</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="ship">${t('ship')}</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="grind">${t('grinding')}<span class="dot" id="gdot" hidden></span></button>
      <button class="tab" role="tab" aria-selected="false" data-tab="board">${t('board')}</button>
    </div>
    <div class="g-grid scr-layout scr-main" data-tab="buy">
      <div style="display:flex;flex-direction:column;gap:14px">
        <section class="card pane-grind" id="grind" data-on="0">
          <h2 class="card-title">${t('grinding')}</h2>
          <p class="center mu" id="gnote">${t('grind_off')}</p>
          <p class="center mu" id="gon" style="margin-bottom:10px">${t('grind_p', { v: usd(5000) })}</p>
          <div class="grind-list" id="glist"></div>
        </section>
        <div class="scr-cols">
          <section class="pos pane-buy"><h3>${t('pos1')}</h3>${Object.values(s.vendors).map(vendorCard).join('')}</section>
          <section class="pos pane-produce"><h3>${t('pos2')}</h3>${Object.values(s.factories).map(facCard).join('')}</section>
          <section class="pos pane-ship"><h3>${t('pos3')}</h3>${Object.values(s.fleet).map(fleetCard).join('')}</section>
        </div>
      </div>
      <aside class="card pane-board"><h2 class="card-title">${t('standings')}</h2><div class="board" id="board"></div><div class="feed" id="feed" style="margin-top:12px"></div></aside>
    </div>`;

  const ui = { state: s, onPause: null, onQuit: null };
  const SOUND = { buy: 'thud', produce: 'machine', ship: 'ship' };
  const act = (a, btn) => {
    const r = E.teamAction(s, 'player', a);
    if (r.ok && SOUND[a.type]) {
      sfx(SOUND[a.type]);
      const card = btn?.closest('.unit') || $(a.type === 'buy' ? `[data-v="${a.vendor}"]` : a.type === 'produce' ? `[data-fac="${a.factory}"]` : `[data-m="${a.fleet}"]`, root);
      play(card, 'pop-in');
      if (a.type === 'ship') burst(card?.querySelector('button'));
    }
    return r;
  };
  let lastCash = null;
  let lastGoods = null;
  $('#pause', root).onclick = () => ui.onPause?.();
  $('#quit', root).onclick = () => ui.onQuit?.();
  $$('.tab', root).forEach((b) => b.addEventListener('click', () => {
    $$('.tab', root).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('.scr-main', root).dataset.tab = b.dataset.tab;
  }));
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const card = b.closest('.unit');
    if (b.dataset.act === 'buy') act({ type: 'buy', vendor: card.dataset.v }, b);
    if (b.dataset.act === 'produce') act({ type: 'produce', factory: card.dataset.fac }, b);
    if (b.dataset.act === 'ship') {
      const r = act({ type: 'ship', fleet: card.dataset.m }, b);
      if (r.ok) toast(`${t('fleet_' + card.dataset.m)}: +${usd(s.fleet[card.dataset.m].sellPrice - s.fleet[card.dataset.m].shippingCost)}`, 'up');
    }
  });

  ui.tick = (dt) => E.apply(s, { type: 'tick', dtMs: dt });
  ui.remainingMs = () => E.remainingRealSec(s) * 1000;
  ui.onKey = (e) => {
    const k = e.key.toUpperCase();
    const vi = ['1', '2', '3'].indexOf(k);
    if (vi >= 0) act({ type: 'buy', vendor: 'ABC'[vi] });
    const fi = Object.entries(FAC_KEYS).find(([, key]) => key === k);
    if (fi) act({ type: 'produce', factory: fi[0] });
    const mi = Object.entries(FLEET_KEYS).find(([, key]) => key === k);
    if (mi) { const r = act({ type: 'ship', fleet: mi[0] }); if (r.ok) toast(`${t('fleet_' + mi[0])}: +${usd(s.fleet[mi[0]].sellPrice - s.fleet[mi[0]].shippingCost)}`, 'up'); }
  };

  const why = (reason, extra = {}) => (reason ? t('w_' + reason, extra) : '');
  let grindSig = '';
  let seenAnn = s.announcements.length;

  function buildGrind() {
    const qs = E.grindingQuestions(s, 'player').slice(0, 8);
    setHTML($('#glist', root), qs.map((q) => `
      <div class="grind-q" data-q="${q.id}"><p class="q">${esc(q.question)}</p>
        <form><input class="input num" inputmode="numeric" autocomplete="off" aria-label="${t('your_answer')}"><button class="btn btn-primary" type="submit">${t('check')}</button></form>
        <p class="why" data-f="lock"></p></div>`).join(''));
    $$('.grind-q input', root).forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/[^0-9-]/g, ''); }));
    $$('.grind-q form', root).forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = Number(f.closest('.grind-q').dataset.q);
      const r = act({ type: 'grind', questionId: id, answer: f.querySelector('input').value });
      if (!r.ok) return;
      if (r.correct) { toast(t('grind_right', { v: usd(5000) }), 'up'); sfx('win'); burst(f.querySelector('button')); grindSig = ''; }
      else {
        sfx('lose');
        play(f.closest('.grind-q'), 'shake');
        const lock = Math.ceil((s.teams[0].grinding.lockUntil[id] - s.gameMs) / 1000 / sp);
        toast(t('grind_wrong', { s: lock }), 'down');
        f.querySelector('input').value = '';
      }
    }));
  }

  ui.render = () => {
    const me = E.player(s);
    setText($('#clk', root), clock(E.remainingRealSec(s) * 1000));
    setText($('#cash', root), usd(me.cash));
    setText($('#raw', root), me.raw);
    setText($('#goods', root), me.goods);
    if (lastCash != null && me.cash !== lastCash) bump($('#cash', root), me.cash - lastCash);
    if (lastGoods != null && me.goods > lastGoods && me.stats.produced) { /* goods only grow when a run finishes */ sfx('ding'); bump($('#goods', root), 1); }
    lastCash = me.cash;
    lastGoods = me.goods;
    const inProd = me.productions.reduce((n, p) => n + p.out, 0);
    setText($('#inprod', root), inProd ? `+${inProd}` : '');
    const cdLeft = Math.max(0, me.cooldownUntil - s.gameMs);
    setText($('#cd', root), cdLeft ? `${realS(cdLeft)}s` : t('ready'));
    $('#cdbar', root).style.width = `${(cdLeft / 30000) * 100}%`;
    setText($('#phase', root), t('phase', { n: E.phase(s) }));

    for (const v of Object.values(s.vendors)) {
      const el = $(`[data-v="${v.id}"]`, root);
      setText(el.querySelector('[data-f="qty"]'), `${v.qty} ${t('nickel').toLowerCase()}`);
      setText(el.querySelector('[data-f="price"]'), usd(v.price));
      setText(el.querySelector('[data-f="unit"]'), usd(v.price / v.qty));
      setText(el.querySelector('[data-f="stock"]'), v.stock);
      el.querySelector('[data-f="sbar"]').style.width = `${(v.stock / v.maxStock) * 100}%`;
      const r = E.whyNot(s, 'player', { type: 'buy', vendor: v.id });
      el.querySelector('button').disabled = !!r;
      let w = why(r, { s: realS(cdLeft) });
      if (r === 'out_of_stock' && v.restockAt) w += `. ${t('restock_in', { s: realS(v.restockAt - s.gameMs) })}`;
      setText(el.querySelector('[data-f="why"]'), w);
    }
    for (const f of Object.values(s.factories)) {
      const el = $(`[data-fac="${f.id}"]`, root);
      setText(el.querySelector('[data-f="io"]'), `${f.inputPerRun} → ${f.outputPerRun}`);
      setText(el.querySelector('[data-f="time"]'), `${Math.round((f.timeSec / sp) * 10) / 10}s`.replace('.', ','));
      setText(el.querySelector('[data-f="fee"]'), usd(f.price));
      setText(el.querySelector('[data-f="per"]'), usd(f.price / f.outputPerRun));
      const run = me.productions.find((p) => p.factory === f.id);
      el.querySelector('[data-f="pbar"]').style.width = run ? `${((s.gameMs - run.startedAt) / (run.completesAt - run.startedAt)) * 100}%` : '0%';
      const r = E.whyNot(s, 'player', { type: 'produce', factory: f.id });
      el.querySelector('button').disabled = !!r;
      setText(el.querySelector('[data-f="why"]'), run ? t('running', { s: realS(run.completesAt - s.gameMs) }) : why(r));
    }
    for (const m of Object.values(s.fleet)) {
      const el = $(`[data-m="${m.id}"]`, root);
      setText(el.querySelector('[data-f="cap"]'), `${m.capacity} ${t('batteries').toLowerCase()}`);
      setText(el.querySelector('[data-f="sale"]'), usd(m.sellPrice));
      setText(el.querySelector('[data-f="cost"]'), usd(m.shippingCost));
      setText(el.querySelector('[data-f="net"]'), usd((m.sellPrice - m.shippingCost) / m.capacity));
      const r = E.whyNot(s, 'player', { type: 'ship', fleet: m.id });
      el.querySelector('button').disabled = !!r;
      setText(el.querySelector('[data-f="why"]'), why(r));
    }

    // grinding
    const g = me.grinding;
    $('#grind', root).dataset.on = g.active ? '1' : '0';
    $('#gnote', root).hidden = g.active;
    $('#gon', root).hidden = !g.active;
    if (!g.active) setHTML($('#glist', root), '');
    $('#gdot', root).hidden = !g.active;
    const sig = g.active ? `${g.completed.length}` : '';
    if (sig !== grindSig) { if (g.active) buildGrind(); grindSig = sig; }
    if (g.active && !$('#glist', root).children.length) buildGrind();
    if (g.active) $$('.grind-q', root).forEach((el) => {
      const left = (g.lockUntil[el.dataset.q] || 0) - s.gameMs;
      setText(el.querySelector('[data-f="lock"]'), left > 0 ? t('grind_locked', { s: realS(left) }) : '');
      el.querySelector('button').disabled = left > 0;
    });

    // announcements
    while (seenAnn < s.announcements.length) {
      const a = s.announcements[seenAnn++];
      if (a.kind === 'market_event') {
        const ev = E.MARKET_EVENTS.find((x) => x.id === a.eventId);
        toast(ev.title[getLang()] || ev.title.en, 'warn');
        sfx('bell');
      } else if (a.kind === 'restock') toast(t('restocked', { id: a.vendor }));
    }
    if (seenAnn > s.announcements.length) seenAnn = s.announcements.length;

    // board and feed
    const lb = E.leaderboard(s);
    setText($('#rank', root), `#${lb.find((r) => r.isPlayer).rank} / 12`);
    setHTML($('#board', root), lb.map((r) => `<div class="row ${r.isPlayer ? 'me' : ''} ${r.rank === 1 ? 'top1' : ''}"><span class="rk">${r.rank}</span>${avatar(r, slotOf(r.id))}<span class="nm">${esc(r.name)}</span><span class="sc">${usd(r.cash)}</span></div>`).join(''));
    const names = Object.fromEntries(s.teams.map((x) => [x.id, x.name]));
    setHTML($('#feed', root), s.feed.slice(-5).reverse().map((f) => `<span>${esc(names[f.teamId])}: ${f.kind === 'buy' ? `${t('buy')} ${f.detail.qty} (${f.detail.vendor})` : f.kind === 'produce' ? `${t('produce')} ${f.detail.factory}` : `${t('ship')} ${t('fleet_' + f.detail.fleet)}`}</span>`).join(''));
  };

  ui.scoreLabel = () => t('cash');
  ui.finalRows = () => E.leaderboard(s).map((r) => ({ ...r, slot: slotOf(r.id), score: usd(r.cash) }));
  ui.summary = () => {
    const me = E.player(s);
    return `<div class="scr-stats">
      <div class="card stat"><div class="stat-label">${t('s_produced')}</div><div class="stat-value">${me.stats.produced}</div></div>
      <div class="card stat"><div class="stat-label">${t('s_shipped')}</div><div class="stat-value">${me.stats.shipped}</div></div>
      <div class="card stat"><div class="stat-label">${t('s_grind')}</div><div class="stat-value" style="font-size:var(--t-l)">${usd(me.stats.grindingCash)}</div></div>
      <div class="card stat"><div class="stat-label">${t('cash')}</div><div class="stat-value" style="font-size:var(--t-l)">${usd(me.cash)}</div></div>
    </div>`;
  };
  return ui;
}
