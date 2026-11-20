// Sound effects, synthesized with the Web Audio API (no audio files, nothing to license).
// Every sound is a few short notes through one master gain and a small room reverb.
// The audio context starts on the first tap or key press, as browsers require.

const store = (k, v) => {
  try {
    if (v === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(v));
  } catch { /* storage off */ }
  return v;
};

let ctx = null;
let master = null;
let wet = null;
let on = store('ogs-sound') !== false;
const last = {}; // per-sound throttle

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    // short room: decaying noise as impulse response
    const len = Math.floor(ctx.sampleRate * 0.9);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    wet = ctx.createGain();
    wet.gain.value = 0.22;
    wet.connect(verb).connect(master);
  } catch { ctx = null; }
  return ctx;
}

export function soundOn() { return on; }
export function setSound(v) {
  on = v;
  store('ogs-sound', v);
  if (v) { init(); ctx?.resume?.(); }
}

// unlock on first gesture
const unlock = () => { if (on) { init(); ctx?.resume?.(); } };
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('keydown', unlock);

/** One note. type: sine | triangle | square | sawtooth. */
function note(freq, at, dur, { type = 'sine', vol = 0.3, slide = 0, attack = 0.006, reverb = true } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master);
  if (reverb) g.connect(wet);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** Short filtered noise (whoosh, thud, shaker). */
function noise(at, dur, { vol = 0.2, from = 800, to = 3000, q = 1.2, type = 'bandpass' } = {}) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(master);
  g.connect(wet);
  src.start(at);
}

const N = (m) => 440 * 2 ** ((m - 69) / 12); // midi to Hz

const SOUNDS = {
  tap: (t) => { note(N(84), t, 0.07, { type: 'triangle', vol: 0.08, slide: 0.6, reverb: false }); },
  toggle: (t) => { note(N(79), t, 0.08, { type: 'triangle', vol: 0.12 }); note(N(86), t + 0.06, 0.1, { type: 'triangle', vol: 0.1 }); },
  count: (t) => { note(N(72), t, 0.18, { type: 'triangle', vol: 0.28 }); note(N(84), t, 0.12, { type: 'sine', vol: 0.1 }); },
  go: (t) => {
    [72, 76, 79, 84].forEach((m) => note(N(m), t, 0.55, { type: 'triangle', vol: 0.18 }));
    note(N(96), t + 0.02, 0.4, { type: 'sine', vol: 0.08 });
    noise(t, 0.35, { vol: 0.08, from: 2000, to: 8000 });
  },
  coin: (t) => { note(N(88), t, 0.09, { type: 'square', vol: 0.07 }); note(N(93), t + 0.07, 0.28, { type: 'square', vol: 0.07 }); },
  win: (t) => { [76, 79, 84, 88].forEach((m, i) => note(N(m), t + i * 0.07, 0.32, { type: 'triangle', vol: 0.2 })); note(N(100), t + 0.28, 0.4, { type: 'sine', vol: 0.06 }); },
  lose: (t) => { note(N(64), t, 0.16, { type: 'triangle', vol: 0.22 }); note(N(58), t + 0.14, 0.32, { type: 'triangle', vol: 0.22, slide: 0.85 }); },
  none: (t) => { note(N(62), t, 0.25, { type: 'sine', vol: 0.16, slide: 0.8 }); },
  thud: (t) => { note(N(43), t, 0.22, { type: 'sine', vol: 0.4, slide: 0.5, reverb: false }); noise(t, 0.08, { vol: 0.08, from: 300, to: 120, type: 'lowpass' }); },
  whoosh: (t) => { noise(t, 0.35, { vol: 0.12, from: 400, to: 3500, q: 0.8 }); },
  bell: (t) => { note(N(91), t, 0.9, { type: 'sine', vol: 0.16 }); note(N(91) * 2.76, t, 0.5, { type: 'sine', vol: 0.04 }); note(N(86), t + 0.16, 0.9, { type: 'sine', vol: 0.13 }); },
  alarm: (t) => { for (let i = 0; i < 3; i++) { note(N(81), t + i * 0.26, 0.12, { type: 'square', vol: 0.06 }); note(N(76), t + i * 0.26 + 0.13, 0.12, { type: 'square', vol: 0.06 }); } },
  machine: (t) => { note(N(48), t, 0.4, { type: 'sawtooth', vol: 0.05, slide: 1.5 }); noise(t, 0.4, { vol: 0.05, from: 200, to: 900 }); note(N(84), t + 0.32, 0.12, { type: 'triangle', vol: 0.1 }); },
  ding: (t) => { note(N(88), t, 0.5, { type: 'sine', vol: 0.18 }); note(N(95), t + 0.08, 0.6, { type: 'sine', vol: 0.12 }); },
  ship: (t) => { noise(t, 0.45, { vol: 0.12, from: 300, to: 2500, q: 0.7 }); SOUNDS.coin(t + 0.3); },
  step: (t) => { note(N(79), t, 0.08, { type: 'triangle', vol: 0.12 }); note(N(84), t + 0.06, 0.12, { type: 'triangle', vol: 0.12 }); },
  tick: (t) => { note(N(96), t, 0.03, { type: 'square', vol: 0.03, reverb: false }); },
  rankup: (t) => { note(N(84), t, 0.12, { type: 'triangle', vol: 0.12 }); note(N(91), t + 0.08, 0.2, { type: 'triangle', vol: 0.12 }); },
  pod: (t) => { SOUNDS.thud(t); note(N(67), t + 0.02, 0.3, { type: 'triangle', vol: 0.14 }); },
  fanfare: (t) => {
    const seq = [[67, 0, 0.14], [72, 0.14, 0.14], [76, 0.28, 0.14], [79, 0.42, 0.5], [76, 0.66, 0.14], [79, 0.8, 0.9]];
    seq.forEach(([m, d, l]) => { note(N(m), t + d, l, { type: 'triangle', vol: 0.2 }); note(N(m + 12), t + d, l, { type: 'sine', vol: 0.05 }); });
    [60, 64, 67].forEach((m) => note(N(m), t + 0.8, 1.1, { type: 'triangle', vol: 0.09 }));
    noise(t + 0.8, 0.8, { vol: 0.06, from: 3000, to: 9000 });
  },
  pop: (t) => { note(N(76) * (0.9 + Math.random() * 0.25), t, 0.09, { type: 'sine', vol: 0.12, slide: 1.6, reverb: false }); },
};

/** Play a named sound. Quiet no-op when muted, unsupported or not yet unlocked. */
export function sfx(name, { delay = 0, gap = 40 } = {}) {
  if (!on || !SOUNDS[name]) return;
  if (!init()) return;
  if (ctx.state === 'suspended') ctx.resume?.().catch(() => {});
  const now = performance.now();
  if (last[name] && now - last[name] < gap) return;
  last[name] = now;
  try { SOUNDS[name](ctx.currentTime + 0.005 + delay); } catch { /* audio graph error: stay silent */ }
}
