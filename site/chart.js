// Tiny SVG line chart: dots on every point, label at the end of each line, centred legend handled by callers.

import { fmt } from './util.js';

/**
 * series: [{ name, color, values: number[] }] sharing the same x positions 0..n-1.
 * opts: { xMax (last x index to scale to), w, h, fmtY }
 */
export function lineChart(series, { xMax, w = 520, h = 250, fmtY = fmt } = {}) {
  const padL = 52;
  const padR = 92;
  const padT = 14;
  const padB = 28;
  const all = series.flatMap((s) => s.values.filter((v) => v != null));
  if (!all.length) return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="chart"></svg>`;
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  const pad = (hi - lo) * 0.12 || hi * 0.1 || 1;
  lo -= pad;
  hi += pad;
  const n = Math.max(xMax ?? 0, ...series.map((s) => s.values.length - 1), 1);
  const X = (i) => padL + (i / n) * (w - padL - padR);
  const Y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);
  const grid = [0, 0.5, 1].map((f) => {
    const v = lo + f * (hi - lo);
    return `<line x1="${padL}" x2="${w - padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${padL - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="15" fill="var(--mu)" font-family="Golos Text">${fmtY(v)}</text>`;
  }).join('');
  const xt = [0, Math.round(n / 2), n].map((i) => `<text x="${X(i)}" y="${h - 8}" text-anchor="middle" font-size="15" fill="var(--mu)" font-family="Golos Text">${i}</text>`).join('');
  const lines = series.map((s) => {
    const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
    if (!pts.length) return '';
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
    const dots = pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${s.color}" stroke="var(--sf)" stroke-width="2"/>`).join('');
    const last = pts[pts.length - 1];
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"/>${dots}<text x="${last[0] + 8}" y="${last[1] + 4}" font-size="15" font-weight="600" fill="var(--ink)" font-family="Figtree">${s.name}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${series.map((s) => s.name).join(', ')}">${grid}${xt}${lines}</svg>`;
}
