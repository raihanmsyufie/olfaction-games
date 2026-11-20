// Small helpers shared by every screen: formatting, DOM, icons, toasts, modals, ornaments, avatars.

import { t } from './i18n.js';
import { BOTS } from '../shared/core/roster.js';
import { sfx } from './sfx.js';

/** Colour slot of a team: 0 is the player, 1 to 11 follow the roster order. */
export const slotOf = (id) => (id === 'player' ? 0 : BOTS.findIndex((b) => b.id === id) + 1);

const nf = new Intl.NumberFormat('id-ID');
export const fmt = (n) => (n < 0 ? '−' : '') + nf.format(Math.abs(Math.round(n)));
export const rp = (n) => (n < 0 ? '−' : '') + 'Rp' + nf.format(Math.abs(Math.round(n)));
export const usd = (n) => (n < 0 ? '−' : '') + '$' + nf.format(Math.abs(Math.round(n)));
export const pct = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x * 100).toFixed(1).replace('.', ',') + '%';
export const clock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/** Sets textContent only when it changed (keeps the DOM calm at 10+ updates a second). */
export function setText(el, v) { if (el && el.textContent !== String(v)) el.textContent = v; }
export function setHTML(el, v) { if (el && el.__h !== v) { el.innerHTML = v; el.__h = v; } }

export const ICON = {
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="var(--down)" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  heartOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="var(--line)" stroke-width="2" d="M12 20s-7-4.3-9-8.6C1.6 8.2 3.6 5 6.8 5c2 0 3.4 1 4.2 2.3.8-1.3 2.2-2.3 4.2-2.3 3.2 0 5.2 3.2 3.8 6.4C19 15.7 12 20 12 20z"/></svg>',
  market: '<path d="M3 17l5-6 4 4 8-9M15 6h5v5"/>',
  truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1"/>',
  race: '<path d="M4 21V4M4 4h12l-2 4 2 4H4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
};
export const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

/** Avatar: the player gets the mascot head, bots get initials on their team colour. */
export function avatar(team, slot, cls = 'av') {
  if (team.isPlayer) return `<span class="${cls} me"><img src="assets/img/head.png" alt=""></span>`;
  return `<span class="${cls}" style="background: var(--team-${slot})">${esc(team.name.slice(0, 2).toUpperCase())}</span>`;
}

// ---------- toasts ----------
let toastBox = null;
export function toast(msg, kind = '') {
  if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; toastBox.setAttribute('aria-live', 'polite'); document.body.append(toastBox); }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  toastBox.append(el);
  while (toastBox.children.length > 3) toastBox.firstChild.remove();
  setTimeout(() => el.remove(), 3200);
}

// ---------- modal ----------
export function modal({ title, body = '', buttons }) {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><h2 class="h2" id="mt">${title}</h2>${body ? `<p>${body}</p>` : ''}<div class="row-btns"></div></div>`;
    const row = ov.querySelector('.row-btns');
    buttons.forEach((b, i) => {
      const btn = document.createElement('button');
      btn.className = `btn ${b.primary ? 'btn-primary' : 'btn-ghost'}`;
      btn.textContent = b.label;
      btn.onclick = () => { ov.remove(); resolve(b.value); };
      row.append(btn);
      if (i === buttons.length - 1) setTimeout(() => btn.focus(), 30);
    });
    document.body.append(ov);
  });
}

/** 3, 2, 1, GO overlay. Resolves when done. */
export function countdown() {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    document.body.append(ov);
    const seq = ['3', '2', '1', t('go')];
    let i = 0;
    const next = () => {
      if (i === seq.length) { ov.remove(); resolve(); return; }
      const last = i === seq.length - 1;
      ov.innerHTML = `<div class="count-wrap c${i}"><span class="count-ring"></span><div class="count" aria-live="assertive">${seq[i++]}</div></div>`;
      sfx(last ? 'go' : 'count', { gap: 0 });
      setTimeout(next, 750);
    };
    next();
  });
}

// ---------- ornaments ----------
const BUILD_A = '<svg viewBox="0 0 442.587 2008.24" fill="var(--orn)"><path d="M304.278 271.085h60.856v204.697h77.453V2008.24H0V475.782h77.452V271.085h60.857V0h165.969z"/></svg>';
const BUILD_B = '<svg viewBox="0 0 393.252 1626.88" fill="var(--orn)"><path d="M205.279 202.099l70.15 192.505h61.644v159.227h56.179V1626.88H0V553.831h62.421V394.604h61.644l70.15-192.505V0h11.064z"/></svg>';
const STAR = (c) => `<svg viewBox="0 0 24 24" fill="${c}"><path d="M12 1c.8 7 4 10.2 11 11-7 .8-10.2 4-11 11-.8-7-4-10.2-11-11 7-.8 10.2-4 11-11z"/></svg>`;
const PNG = ['orn-flower-purple', 'orn-flower-orange', 'orn-flower-green', 'orn-cloud', 'orn-leaf', 'orn-petal'];

/** Small floating ornaments along the left and right edges, behind all content. */
export function ornaments() {
  const layer = document.createElement('div');
  layer.className = 'orn-layer';
  layer.setAttribute('aria-hidden', 'true');
  const items = [];
  const dots = ['#f53738', '#fdc854', '#b5d295', '#fd79e2', '#1a80fd', '#9f7fd5'];
  const edge = (i) => (i % 2 ? 'right' : 'left');
  for (let i = 0; i < 18; i++) {
    const side = edge(i);
    const top = 6 + i * 5.2 + (i % 3) * 1.7;
    const off = 4 + ((i * 37) % 22);
    const delay = -((i * 1.3) % 6);
    let html;
    let w;
    let faint = false;
    if (i % 6 === 0) { html = i % 12 ? BUILD_B : BUILD_A; w = 14 + (i % 4) * 3; faint = true; }
    else if (i % 6 === 1) { html = `<img src="assets/img/${PNG[i % PNG.length]}.png" alt="">`; w = 26 + (i % 3) * 6; }
    else if (i % 6 === 2) { html = STAR(dots[i % dots.length]); w = 12 + (i % 3) * 2; }
    else if (i % 6 === 3) { html = `<span style="display:block;width:100%;aspect-ratio:1;border-radius:50%;background:${dots[(i + 2) % dots.length]}"></span>`; w = 8 + (i % 3) * 2; }
    else if (i % 6 === 4) { html = `<span style="display:block;width:100%;aspect-ratio:1;border-radius:50%;border:2px solid ${dots[(i + 1) % dots.length]}"></span>`; w = 14 + (i % 2) * 4; }
    else { html = `<img src="assets/img/${PNG[(i + 3) % PNG.length]}.png" alt="">`; w = 22 + (i % 3) * 5; }
    items.push(`<div class="orn${faint ? ' faint' : ''}" style="${side}: max(${off}px, calc((100vw - 1260px) / 2 - ${40 + off}px)); top: ${top}%; width: ${w}px; animation-delay: ${delay}s">${html}</div>`);
  }
  layer.innerHTML = items.join('');
  document.body.prepend(layer);
}

// ---------- storage ----------
export function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
  return val;
}
