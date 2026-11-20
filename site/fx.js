// Visual effects: confetti bursts, number bumps, small shakes. All of them stay still
// when the visitor asks for reduced motion.

const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const COLORS = ['--gold-500', '--purple-700', '--red-500', '--pink-500', '--blue-600', '--sage-500', '--gold-600', '--purple-300'];
const palette = () => {
  const cs = getComputedStyle(document.documentElement);
  return COLORS.map((v) => cs.getPropertyValue(v).trim() || '#fdc854');
};

let canvas = null;
let parts = [];
let raf = 0;

function loop() {
  const c = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  c.clearRect(0, 0, W, H);
  parts = parts.filter((p) => p.life > 0 && p.y < H + 40);
  for (const p of parts) {
    p.vy += p.g;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;
    c.save();
    c.globalAlpha = Math.min(1, p.life / 30);
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    c.fillStyle = p.color;
    if (p.shape === 0) c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    else if (p.shape === 1) { c.beginPath(); c.arc(0, 0, p.s / 2.6, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.moveTo(0, -p.s / 2); c.lineTo(p.s / 2, p.s / 2); c.lineTo(-p.s / 2, p.s / 2); c.closePath(); c.fill(); }
    c.restore();
  }
  if (parts.length) raf = requestAnimationFrame(loop);
  else { canvas.remove(); canvas = null; raf = 0; }
}

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = innerWidth; // 1x pixels: plenty for confetti and light on phones
  canvas.height = innerHeight;
  document.body.append(canvas);
}

/** Confetti from a point (x, y in viewport px). spread in degrees, angle 270 = up. */
export function confetti({ x = innerWidth / 2, y = innerHeight / 2, count = 60, angle = 270, spread = 70, speed = 11, gravity = 0.32 } = {}) {
  if (calm()) return;
  ensureCanvas();
  const cols = palette();
  for (let i = 0; i < count; i++) {
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const v = speed * (0.55 + Math.random() * 0.6);
    parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: gravity, drag: 0.985,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35, s: 7 + Math.random() * 7,
      color: cols[i % cols.length], shape: i % 3, life: 140 + Math.random() * 60,
    });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}

/** Burst from the middle of an element. */
export function burst(el, opts = {}) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 28, spread: 360, speed: 7, gravity: 0.25, ...opts });
}

/** Two cannons from the bottom corners, for the podium. */
export function celebrate(big = false) {
  const n = big ? 110 : 60;
  confetti({ x: 0, y: innerHeight, angle: 300, spread: 30, speed: big ? 22 : 18, count: n });
  confetti({ x: innerWidth, y: innerHeight, angle: 240, spread: 30, speed: big ? 22 : 18, count: n });
  if (big) setTimeout(() => confetti({ x: innerWidth / 2, y: -20, angle: 90, spread: 160, speed: 4, gravity: 0.18, count: 90 }), 500);
}

/** Replays a one-shot CSS animation class on an element. */
export function play(el, cls) {
  if (!el || calm()) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

/** Number bump: green when it went up, red when it went down. */
export function bump(el, dir) {
  play(el, dir < 0 ? 'bump-down' : 'bump-up');
}
