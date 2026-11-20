// Seeded random number generator (mulberry32).
// The generator state is a plain object { s } so it can live inside a game state
// and be cloned together with it. Same seed, same game.

export function makeRng(seed) {
  return { s: (Number(seed) >>> 0) || 1 };
}

export function next(r) {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(r, p) {
  return next(r) < p;
}

export function int(r, n) {
  return Math.floor(next(r) * n);
}

export function between(r, lo, hi) {
  return lo + next(r) * (hi - lo);
}

export function pick(r, arr) {
  return arr[int(r, arr.length)];
}

export function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = int(r, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31) + 1;
}
