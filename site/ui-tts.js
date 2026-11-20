// Teka Teki Saya screen. Phone: status strip, question card, then the race. Laptop: question left, race right.

import * as E from '../games/teka-teki-saya/engine.js';
import { t } from './i18n.js';
import { $, $$, esc, setText, setHTML, clock, icon, ICON, toast, slotOf } from './util.js';
import { sfx } from './sfx.js';
import { bump, burst, play } from './fx.js';

export const KEYS = [['A–D', 'k_answer'], ['1–4', 'k_answer'], ['P', 'k_pause']];

/** Text with $...$ math rendered by KaTeX (vendored), everything else escaped. */
export function mathText(str, display = false) {
  const parts = String(str).split(/(\$[^$]+\$)/g);
  return parts.map((p) => {
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2 && window.katex) {
      try { return window.katex.renderToString((display ? '\\displaystyle ' : '') + p.slice(1, -1), { throwOnError: false }); } catch { return esc(p); }
    }
    return esc(p);
  }).join('');
}

export function create(root, opts) {
  const s = E.createGame(opts);
  E.apply(s, { type: 'start' });
  const c = s.config;
  const N = c.LANGKAH_MENANG;
  root.innerHTML = `
    <div class="g-top"><div class="g-top-in">
      <button class="btn btn-ghost btn-icon" id="quit" type="button" aria-label="${t('quit')}">${icon('x')}</button>
      <div class="title">TEKA TEKI SAYA</div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end"><span class="clock" id="clk"></span><button class="btn btn-ghost btn-icon" id="pause" type="button" aria-label="${t('pause')}">${icon('pause')}</button></div>
    </div></div>
    <div class="g-grid tts-grid">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="me-strip">
          <div class="card stat"><div class="stat-label">${t('steps')}</div><div class="stat-value"><span id="mst">0</span><span class="mu" style="font-size:var(--t-m)">/${N}</span></div></div>
          <div class="card stat"><div class="stat-label">${t('points')}</div><div class="stat-value" id="mpt">0</div></div>
          <div class="card stat"><div class="stat-label">${t('blood')}</div><div class="hearts" id="mbl"></div></div>
        </div>
        <div id="spec" class="banner banner-brand" hidden><span id="specText"></span><button class="btn btn-primary" id="ffwd" type="button">${t('skip')}</button></div>
        <div id="modeBanner"></div>
        <div class="card qcard" id="qcard"></div>
      </div>
      <div class="card">
        <h2 class="card-title">${t('track')}</h2>
        <div class="lanes" id="lanes"></div>
      </div>
    </div>`;

  const ui = { state: s, onPause: null, onQuit: null, ffwd: false };
  $('#pause', root).onclick = () => ui.onPause?.();
  $('#quit', root).onclick = () => ui.onQuit?.();
  $('#ffwd', root).onclick = () => { ui.ffwd = true; };

  // lanes are built once so the tokens can glide
  const order = s.teams.slice();
  $('#lanes', root).innerHTML = order.map((tm) => `
    <div class="lane ${tm.isPlayer ? 'me' : ''}" data-id="${tm.id}">
      <span class="ln">${esc(tm.name)}</span>
      <div class="track"><span class="fin"></span>${tm.isPlayer ? '<span class="tok me"><img src="assets/img/head.png" alt=""></span>' : `<span class="tok" style="background:var(--team-${slotOf(tm.id)})">${esc(tm.name.slice(0, 2).toUpperCase())}</span>`}</div>
      <span class="meta"><span class="dot-ans"></span><span class="lr"></span></span>
    </div>`).join('');
  const laneEls = Object.fromEntries(order.map((tm) => [tm.id, $(`.lane[data-id="${tm.id}"]`, root)]));

  let shownKey = '';
  const answer = (v) => {
    const before = s.pending.player?.answer;
    E.apply(s, { type: 'answer', value: v });
    const now = s.pending.player?.answer;
    if (now != null && now !== before) {
      sfx('pop');
      $$('.choice', root).forEach((b) => b.classList.toggle('chosen', b.dataset.k === now));
    }
  };
  ui.tick = (dt) => E.apply(s, { type: 'tick', dtMs: ui.ffwd ? 120000 : dt });
  ui.remainingMs = () => E.remainingMs(s);
  const prevStep = {};
  let prevBlood = null;
  ui.onKey = (e) => {
    if (s.phase !== 'question') return;
    const k = e.key.toUpperCase();
    if (s.round.type === 'Teori') {
      if (k === 'T' || k === '1') answer('T');
      if (k === 'F' || k === '2') answer('F');
    } else {
      if ('ABCD'.includes(k) && k.length === 1) answer(k);
      if ('1234'.includes(k) && k.length === 1) answer('ABCD'[Number(k) - 1]);
    }
  };

  const hearts = (n, max) => Array.from({ length: max }, (_, i) => (i < n ? ICON.heart : ICON.heartOff)).join('');

  function buildQuestion() {
    const q = E.publicQuestion(s);
    const me = E.player(s);
    const isT = s.round.type === 'Teori';
    const live = me.status === 'Aktif';
    const opts = isT ? [['T', t('true_'), '1'], ['F', t('false_'), '2']] : ['A', 'B', 'C', 'D'].map((k) => [k, q.choices[k], k]);
    const table = q.table ? `<table class="t"><thead><tr>${q.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${q.table.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
    $('#qcard', root).innerHTML = `
      <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
        <span class="badge ${isT ? 'badge-warn' : 'badge-brand'}">${t('round', { n: s.round.number })}</span>
        <span class="badge ${isT ? 'badge-warn' : 'badge-up'}">${isT ? t('teori') : t('hitungan')}</span>
      </div>
      <div class="bar ${isT ? 'gold' : ''}"><i id="qbar"></i></div>
      <p class="qtext">${mathText(q.text)}</p>
      ${table}
      <div class="choices${!isT && opts.some(([, l]) => String(l).replace(/\\[a-z]+|[{}$\s]/gi, '').length > 9) ? ' long' : ''}">${opts.map(([k, label, key]) => `
        <button class="choice" type="button" data-k="${k}" ${live ? '' : 'disabled'}><span class="k">${isT ? key : k}</span><span class="v">${isT ? esc(label) : mathText(label, /\\frac/.test(label))}</span></button>`).join('')}</div>
      <p class="center mu" id="answered"></p>
      <div id="reveal"></div>`;
    $$('.choice', root).forEach((b) => b.addEventListener('click', () => answer(b.dataset.k)));
    play($('#qcard', root), 'q-in');
    sfx(isT ? 'bell' : 'whoosh');
  }

  function showReveal() {
    const r = s.lastResult;
    const mine = r.outcomes.player;
    $$('.choice', root).forEach((b) => {
      b.disabled = true;
      if (b.dataset.k === r.key) b.classList.add('right');
      if (mine && b.dataset.k === mine.answer) b.classList.add('picked', ...(mine.correct ? [] : ['wrong']));
    });
    const keyLabel = r.type === 'Teori' ? (r.key === 'T' ? t('true_') : t('false_')) : r.key;
    let head = '';
    if (mine) {
      const bits = [];
      if (mine.dLangkah) bits.push(t('d_step', { n: mine.dLangkah }));
      if (mine.dPoin) bits.push(t('d_pts', { n: mine.dPoin }));
      if (mine.dDarah) bits.push(t('d_blood', { n: (mine.dDarah > 0 ? '+' : '−') + Math.abs(mine.dDarah) }));
      const word = mine.answer == null ? t('you_none') : mine.correct ? t('you_right') : t('you_wrong');
      head = `<div class="banner ${mine.correct ? 'banner-up' : 'banner-down'}">${word} ${bits.join(', ')}</div>`;
    }
    const ann = r.announcements.map((a) => `<div class="banner banner-warn">${t('ann_' + a)}</div>`).join('');
    setHTML($('#reveal', root), `<div class="reveal">
      ${mine && mine.correct ? '<img class="react" src="assets/img/pose-thumb.png" alt="">' : ''}
      ${head}
      <p><b>${t('correct_ans', { a: keyLabel })}</b></p>
      ${r.explanation ? `<p class="mu">${mathText(r.explanation)}</p>` : ''}
      ${ann}</div>`);
    if (r.announcements.includes('emergency_start')) { toast(t('ann_emergency_start'), 'warn'); sfx('alarm', { delay: 0.5 }); }
    if (mine) {
      const pick = $(`.choice[data-k="${mine.answer}"]`, root);
      if (mine.correct) { sfx('win'); burst(pick); play($('#mst', root), 'bump-up'); }
      else if (mine.answer == null) sfx('none');
      else { sfx('lose'); play(pick, 'shake'); }
    }
  }

  ui.render = () => {
    const me = E.player(s);
    setText($('#clk', root), clock(E.remainingMs(s)));
    setText($('#mst', root), me.langkah);
    setText($('#mpt', root), me.poin);
    setHTML($('#mbl', root), hearts(me.darah, c.DARAH_MAX));
    if (prevBlood != null && me.darah < prevBlood) play($('#mbl', root), 'shake');
    if (prevBlood != null && me.darah > prevBlood) bump($('#mbl', root), 1);
    prevBlood = me.darah;
    $('#spec', root).hidden = me.status === 'Aktif';
    if (me.status !== 'Aktif') setText($('#specText', root), `${me.status === 'Finish' ? t('you_finished') : t('you_out')}. ${t('spectate')}`);

    const mode = s.round.mode;
    const teoriLeft = 15 - s.used.Teori.length;
    setHTML($('#modeBanner', root), mode === 'Normal' ? '' : `<div class="banner ${mode === 'Darurat' ? 'banner-down' : 'banner-warn'}">${mode === 'Darurat' ? t('mode_darurat') : t('mode_cooldown')}<span class="chip">${t('teori_left', { n: teoriLeft })}</span></div>`);

    const key = `${s.round.number}-${s.phase}`;
    if (s.phase === 'question' && shownKey !== `${s.round.number}-question`) { buildQuestion(); shownKey = key; }
    if (s.phase === 'reveal' && shownKey !== key) {
      if (!shownKey.startsWith(`${s.round.number}-`)) buildQuestion();
      showReveal();
      shownKey = key;
    }
    if (s.phase === 'question') {
      const total = s.phaseEndsMs - s.round.openedMs;
      const bar = $('#qbar', root);
      if (bar) bar.style.width = `${(E.questionRemainingMs(s) / total) * 100}%`;
      const active = s.teams.filter((x) => x.status === 'Aktif');
      const done = active.filter((x) => s.pending[x.id] && (x.isPlayer || s.pending[x.id].atMs <= s.elapsedMs)).length;
      setText($('#answered', root), t('answered', { n: done, m: active.length }));
    } else if ($('#qbar', root)) $('#qbar', root).style.width = '0%';

    // race
    const lb = E.leaderboard(s);
    for (const row of lb) {
      const tm = s.teams.find((x) => x.id === row.id);
      const el = laneEls[row.id];
      const tok = el.querySelector('.tok');
      tok.style.left = `calc(${(Math.min(tm.langkah, N) / N) * 100}% - ${(Math.min(tm.langkah, N) / N) * 26}px)`;
      if (prevStep[tm.id] != null && tm.langkah > prevStep[tm.id]) play(tok, 'hop');
      prevStep[tm.id] = tm.langkah;
      el.classList.toggle('out', tm.status === 'Tereliminasi');
      const ans = s.phase === 'question' && s.pending[tm.id] && (tm.isPlayer || s.pending[tm.id].atMs <= s.elapsedMs);
      el.querySelector('.dot-ans').classList.toggle('on', !!ans);
      setHTML(el.querySelector('.lr'), tm.status === 'Finish' ? `#${row.rank}` : `#${row.rank} <span style="display:inline-flex;align-items:center;gap:2px">${tm.darah}<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">${ICON.heart.replace(/<\/?svg[^>]*>/g, '')}</svg></span>`);
    }
  };

  ui.scoreLabel = () => `${t('steps')}, ${t('points')}`;
  ui.finalRows = () => E.leaderboard(s).map((r) => ({ ...r, slot: slotOf(r.id), score: `${r.langkah}/${N}, ${r.poin}` }));
  ui.summary = () => {
    const h = s.history.filter((x) => x.player);
    const right = h.filter((x) => x.player.correct).length;
    const me = E.player(s);
    return `<div class="scr-stats">
      <div class="card stat"><div class="stat-label">${t('s_rounds')}</div><div class="stat-value">${s.history.length}</div></div>
      <div class="card stat"><div class="stat-label">${t('s_right')}</div><div class="stat-value">${right}/${h.length}</div></div>
      <div class="card stat"><div class="stat-label">${t('s_teori')}</div><div class="stat-value">${s.history.filter((x) => x.type === 'Teori').length}</div></div>
      <div class="card stat"><div class="stat-label">${t('steps')}</div><div class="stat-value">${me.langkah}/${N}</div></div>
    </div>`;
  };
  return ui;
}
