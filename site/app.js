// OLFACTION GAMES: router, home, setup, about, the shared game loop and the podium.
// Hash routes (the only state in the URL): home, about, question-market, supply-chain-rush, teka-teki-saya.

import { t, getLang, setLang } from './i18n.js';
import { $, $$, esc, icon, ICON, avatar, modal, countdown, ornaments, store, slotOf } from './util.js';
import { BOTS, botsByRank } from '../shared/core/roster.js';
import { randomSeed } from '../shared/core/rng.js';
import * as QMUI from './ui-qm.js';
import * as SCRUI from './ui-scr.js';
import * as TTSUI from './ui-tts.js';
import { sfx, soundOn, setSound } from './sfx.js';
import { celebrate } from './fx.js';

const GAMES = {
  'question-market': { key: 'qm', ui: QMUI, color: 'var(--gold-100)', icon: 'market' },
  'supply-chain-rush': { key: 'scr', ui: SCRUI, color: 'var(--purple-200)', icon: 'truck' },
  'teka-teki-saya': { key: 'tts', ui: TTSUI, color: 'var(--red-100)', icon: 'race' },
};
const DURATION_HINT = { 10: 'fast', 15: 'normal', 30: 'full' };
const app = $('#app');
let current = null; // running match controller


// ---------- theme and language ----------
function applyTheme(th) {
  document.documentElement.dataset.theme = th;
  store('ogs-theme', th);
}
applyTheme(store('ogs-theme') || 'light');
setLang(getLang());

function nav(inGame = false) {
  const th = document.documentElement.dataset.theme;
  return `<nav class="nav">
    <a class="brand" href="#home" aria-label="OLFACTION GAMES 2026, ${t('home')}"><img src="assets/img/logo.png" alt=""><span class="w"><span>OLFACTION</span> <span>GAMES 2026</span></span></a>
    <div class="nav-r">
      <button class="btn btn-ghost btn-icon" id="snd" type="button" aria-pressed="${soundOn()}" aria-label="${soundOn() ? t('sound_on') : t('sound_off')}">${icon(soundOn() ? 'sound' : 'mute')}</button>
      ${inGame ? '' : `<a class="btn btn-ghost nav-about" href="#about" aria-label="${t('about')}"><span class="lbl">${t('about')}</span><svg class="ic only-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg></a>`}
      <button class="btn btn-ghost" id="lang" type="button" aria-label="Language">${t('lang')}</button>
      <button class="btn btn-ghost btn-icon" id="theme" type="button" aria-label="${th === 'arena' ? t('theme_light') : t('theme_arena')}">${icon(th === 'arena' ? 'sun' : 'moon')}</button>
    </div>
  </nav>`;
}
function wireNav() {
  $('#snd')?.addEventListener('click', () => {
    setSound(!soundOn());
    const b = $('#snd');
    b.innerHTML = icon(soundOn() ? 'sound' : 'mute');
    b.setAttribute('aria-pressed', String(soundOn()));
    b.setAttribute('aria-label', soundOn() ? t('sound_on') : t('sound_off'));
    sfx('toggle');
  });
  $('#lang')?.addEventListener('click', () => { setLang(getLang() === 'en' ? 'id' : 'en'); route(); });
  $('#theme')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'arena' ? 'light' : 'arena');
    if (current) $('#theme').innerHTML = icon(document.documentElement.dataset.theme === 'arena' ? 'sun' : 'moon');
    else route();
  });
}

// ---------- pages ----------
function home() {
  const cards = Object.entries(GAMES).map(([slug, g], i) => `
    <article class="card game-card" style="--i:${i};--gc:${g.color}">
      <div class="ico" style="background:${g.color}"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3c205b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[g.icon]}</svg></div>
      <h3>${t(g.key + '_name')}</h3>
      <p class="j">${t(g.key + '_desc')}</p>
      <div class="chips"><span class="chip">${t('teams12')}</span><span class="chip">${t(g.key + '_tag')}</span><span class="chip">${t('mins')}</span></div>
      <a class="btn btn-primary btn-block" href="#${slug}">${t('play')}</a>
    </article>`).join('');
  app.innerHTML = `<div class="wrap">${nav()}
    <section class="hero">
      <div class="hero-stage" aria-hidden="true"><span class="rays"></span><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>
      <img class="mascot" src="assets/img/pose-wave.png" alt="OLFACTION robot mascot waving">
      <h1 class="stiker-wrap hero-title">${stickerWords(t('hero_title'))}</h1>
      <p>${t('hero_p')}</p>
    </section>
    <h2 class="h2" style="margin-top:34px">${t('pick')}</h2>
    <section class="games">${cards}</section>
  </div>`;
  wireNav();
}

/** A sticker title split per word, so each word can pop in on its own beat. */
function stickerWords(text) {
  return text.split(' ').map((w, i) => `<span class="stiker pop-word" style="--i:${i}" data-t="${esc(w)}">${esc(w)}</span>`).join(' ');
}

function about() {
  const crew = BOTS.map((b, i) => `<li class="mate" style="--i:${i}">${avatar({ name: b.short }, slotOf(b.id))}<span class="who"><b>${esc(b.short)}</b><span>${esc(b.name)}</span></span></li>`).join('');
  app.innerHTML = `<div class="wrap-narrow">${nav()}
    <section class="about">
      <h1 class="stiker-wrap center">${stickerWords(t('about_title'))}</h1>
      <div class="card about-story"><img class="about-mascot" src="assets/img/pose-thumb.png" alt=""><p class="j">${t('about_p1')}</p><p class="j">${t('about_p2')}</p></div>
      <div class="card">
        <h2 class="h3">${t('meet')}</h2>
        <p class="j" style="margin:8px 0 14px">${t('meet_p')}</p>
        <ul class="crew">${crew}</ul>
      </div>
      <a class="btn btn-primary btn-l btn-block" href="#home">${t('pick')}</a>
    </section></div>`;
  wireNav();
}

function setup(slug) {
  const g = GAMES[slug];
  const k = g.key;
  const saved = store('ogs-setup') || {};
  let dur = saved[k] || 15;
  const name = saved.name || '';
  const rivals = botsByRank(k).map((b, i) => `<span class="rival" style="--i:${i}">${avatar({ name: b.short }, slotOf(b.id))}${esc(b.short)}</span>`).join('');
  const keyHelp = g.ui.KEYS.map(([key, label]) => `<span><kbd>${key}</kbd> ${t(label)}</span>`).join('');
  const best = () => {
    const b = store('ogs-best') || {};
    const r = b[`${k}-${dur}`];
    return r ? t('best', { rank: r }) : '';
  };
  app.innerHTML = `<div class="wrap-narrow">${nav()}
    <section class="setup">
      <h1 class="stiker-wrap center">${stickerWords(t(k + '_name').toUpperCase())}</h1>
      <p class="center mu" style="font-size:var(--t-l)">${t(k + '_desc')}</p>
      <h2 class="h3">${t('howto')}</h2>
      <div class="steps">${[1, 2, 3].map((n) => `<div class="card step" style="--i:${n - 1}"><span class="n">${n}</span><p>${t(`${k}_s${n}`)}</p></div>`).join('')}</div>
      <h2 class="h3">${t('duration')}</h2>
      <div class="seg" role="radiogroup" aria-label="${t('duration')}">${[10, 15, 30].map((m) => `<button type="button" class="seg-opt" role="radio" aria-checked="${m === dur}" data-d="${m}"><span class="big">${m}</span><span class="small">${t('min')}, ${t(DURATION_HINT[m])}</span></button>`).join('')}</div>
      <div class="field"><label for="nm">${t('your_name')}</label><input class="input" id="nm" maxlength="18" placeholder="${t('name_ph')}" value="${esc(name)}"></div>
      <h2 class="h3">${t('rivals')}</h2>
      <div class="rivals">${rivals}</div>
      <div class="keys"><span>${t('keys')}</span>${keyHelp}</div>
      <p class="center mu" id="best">${best()}</p>
      <button class="btn btn-primary btn-l btn-block" id="go" type="button">${t('start_match')}</button>
    </section></div>`;
  wireNav();
  $$('.seg-opt').forEach((b) => b.addEventListener('click', () => {
    dur = Number(b.dataset.d);
    $$('.seg-opt').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    sfx('pop');
    $('#best').textContent = best();
  }));
  $('#go').addEventListener('click', async () => {
    const playerName = $('#nm').value.trim() || t('name_ph');
    store('ogs-setup', { ...saved, [k]: dur, name: $('#nm').value.trim() });
    startMatch(slug, dur, playerName);
  });
}

// ---------- match ----------
async function startMatch(slug, durationMin, playerName, seed = randomSeed()) {
  const g = GAMES[slug];
  app.innerHTML = `<div class="wrap">${nav(true)}<div id="stage"></div></div>`;
  window.scrollTo(0, 0);
  wireNav();
  const stage = $('#stage');
  const ui = g.ui.create(stage, { durationMin, playerName, seed });
  ui.render();
  await countdown();
  let last = performance.now();
  let paused = false;
  let speedup = 1; // test hook: sessionStorage 'ogs-speedup' runs the clock faster
  try { speedup = Number(sessionStorage.getItem('ogs-speedup')) || 1; } catch { /* storage off */ }
  let raf = 0;
  let lastSec = Infinity;
  const frame = (now) => {
    const dt = Math.min(1000, now - last) * speedup;
    last = now;
    if (!paused) {
      ui.tick(dt);
      ui.render();
      const secs = Math.ceil((ui.remainingMs?.() ?? 1e9) / 1000);
      if (secs <= 10 && secs > 0 && secs !== lastSec && ui.state.status !== 'finished') {
        sfx('tick', { gap: 0 });
        $('#clk')?.classList.add('hurry');
      }
      lastSec = secs;
      if (ui.state.status === 'finished') { stop(); podium(slug, durationMin, playerName, ui); return; }
    }
    raf = requestAnimationFrame(frame);
  };
  const pause = async () => {
    if (paused) return;
    paused = true;
    await modal({ title: t('paused'), body: t('paused_p'), buttons: [{ label: t('resume'), value: 1, primary: true }] });
    last = performance.now();
    paused = false;
  };
  const quit = async () => {
    paused = true;
    const v = await modal({ title: t('quit_q'), body: t('quit_p'), buttons: [{ label: t('quit'), value: 'q' }, { label: t('stay'), value: 's', primary: true }] });
    if (v === 'q') { stop(); location.hash = slug; route(); } else { last = performance.now(); paused = false; }
  };
  const onKey = (e) => {
    if (e.target.matches('input') && !['Enter', 'Escape'].includes(e.key)) return;
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (!e.target.matches('input') || e.key === 'Escape') { e.preventDefault(); pause(); } return; }
    if (!paused) ui.onKey(e);
  };
  const onVis = () => { if (document.hidden) pause(); };
  const stop = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    current = null;
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);
  ui.onPause = pause;
  ui.onQuit = quit;
  current = { stop, slug };
  raf = requestAnimationFrame(frame);
}

function podium(slug, durationMin, playerName, ui) {
  const g = GAMES[slug];
  const rows = ui.finalRows();
  const me = rows.find((r) => r.isPlayer);
  const best = store('ogs-best') || {};
  const key = `${g.key}-${durationMin}`;
  if (!best[key] || me.rank < best[key]) { best[key] = me.rank; store('ogs-best', best); }
  const beaten = rows.filter((r) => !r.isPlayer && r.rank > me.rank).length;
  const pod = (r, cls) => r ? `<div class="pod ${cls}">${r.isPlayer ? `<img src="assets/img/${cls === 'p1' ? 'pose-cheer' : 'pose-thumb'}.png" alt="" style="height:96px;width:auto">` : avatar(r, r.slot)}<span class="nm">${esc(r.name)}</span><span class="sc">${r.score}</span><div class="block">${cls.slice(1)}</div></div>` : '<div></div>';
  const table = rows.map((r) => `<tr class="${r.isPlayer ? 'me' : ''}"><td>${r.rank}</td><td style="text-align:left">${esc(r.name)}</td><td>${r.score}</td></tr>`).join('');
  window.scrollTo(0, 0);
  app.innerHTML = `<div class="wrap-narrow">${nav()}
    <section class="setup">
      <h1 class="stiker-wrap center"><span class="stiker" data-t="${t('final')}" style="font-size:clamp(30px,7vw,50px)">${t('final')}</span></h1>
      <p class="center h3">${t(g.key + '_name')}, ${durationMin} ${t('min')}</p>
      <div class="podium">${pod(rows[1], 'p2')}${pod(rows[0], 'p1')}${pod(rows[2], 'p3')}</div>
      <p class="result-line"><b>${t('you_rank', { rank: me.rank })}.</b> <span class="mark">${beaten === 11 ? t('beat_all') : t('beat', { n: beaten })}</span></p>
      <div class="card"><h2 class="card-title">${t('summary')}</h2>${ui.summary()}</div>
      <div class="card"><h2 class="card-title">${t('full_table')}</h2><table class="t"><thead><tr><th>#</th><th>${t('your_name')}</th><th>${ui.scoreLabel()}</th></tr></thead><tbody>${table}</tbody></table></div>
      <div class="end-btns"><button class="btn btn-primary btn-l" id="again" type="button">${t('again')}</button><a class="btn btn-ghost btn-l" href="#home">${t('other')}</a></div>
    </section></div>`;
  wireNav();
  ['p3', 'p2', 'p1'].forEach((c, i) => setTimeout(() => {
    const el = $(`.pod.${c}`);
    if (!el) return;
    el.classList.add('show');
    if (c === 'p1') { sfx('fanfare'); celebrate(me.rank === 1); }
    else sfx('pod');
  }, 400 + i * 900));
  $('#again').addEventListener('click', () => startMatch(slug, durationMin, playerName));
}

// ---------- router ----------
function route() {
  if (current) return; // never leave a running match from a hash change
  const h = location.hash.slice(1);
  window.scrollTo(0, 0);
  if (GAMES[h]) setup(h);
  else if (h === 'about') about();
  else home();
  app.classList.remove('page-in');
  void app.offsetWidth;
  app.classList.add('page-in');
}
window.addEventListener('hashchange', () => {
  if (current) { history.replaceState(null, '', `#${current.slug}`); return; }
  route();
});
// Soft tap on interface buttons. Game actions inside the board play their own sounds.
document.addEventListener('click', (e) => {
  const b = e.target.closest('.btn, .tab, a.brand');
  if (!b || b.id === 'snd') return;
  if (b.closest('#stage') && !b.closest('.g-top') && !b.classList.contains('tab')) return;
  sfx('tap');
});
ornaments();
route();
