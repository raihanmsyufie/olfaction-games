// Teka Teki Saya scoring rules, ported 1:1 from tts-node/server/engine.js (applyEffect_, compareRank_,
// assignFinishOrder_). Shared by the engine and the bot director so both always agree.

export const BASE_CONFIG = {
  AMBANG_DARURAT: 2,
  HITUNGAN_BENAR_LANGKAH: 1,
  HITUNGAN_BENAR_POIN: 15,
  HITUNGAN_SALAH_DARAH: -1,
  TEORI_BENAR_POIN: 10,
  TEORI_SALAH_DARAH: -1,
  STREAK_TARGET: 3,
  BONUS_DARAH: 2,
  BONUS_POIN: 15,
  WINDOW_DARURAT_RONDE: 3,
  COOLDOWN_RONDE: 3,
};

// Single-player adaptation: shorter games get a shorter track and less blood so a full race still
// fits the time limit. 30 minutes is the original OLFACTION configuration.
export const DURATION_CONFIG = {
  30: { LANGKAH_MENANG: 15, DARAH_AWAL: 10, DARAH_MAX: 10, WAKTU_HITUNGAN_DETIK: 40, WAKTU_TEORI_DETIK: 15 },
  15: { LANGKAH_MENANG: 11, DARAH_AWAL: 8, DARAH_MAX: 8, WAKTU_HITUNGAN_DETIK: 35, WAKTU_TEORI_DETIK: 15 },
  10: { LANGKAH_MENANG: 8, DARAH_AWAL: 7, DARAH_MAX: 7, WAKTU_HITUNGAN_DETIK: 30, WAKTU_TEORI_DETIK: 12 },
};

export function configFor(durationMin) {
  return { ...BASE_CONFIG, ...DURATION_CONFIG[durationMin], DURASI_MENIT: durationMin, JUMLAH_TIM: 12 };
}

/** Mutates team. Same order of operations as the original applyEffect_. */
export function applyEffect(team, type, correct, c) {
  if (type === 'Hitungan') {
    if (correct) {
      team.langkah += c.HITUNGAN_BENAR_LANGKAH;
      team.poin += c.HITUNGAN_BENAR_POIN;
      team.streak += 1;
    } else {
      team.darah += c.HITUNGAN_SALAH_DARAH;
      team.streak = 0;
    }
  } else if (correct) {
    team.poin += c.TEORI_BENAR_POIN;
    team.streak += 1;
  } else {
    team.darah += c.TEORI_SALAH_DARAH;
    team.streak = 0;
  }
  if (correct && team.streak >= c.STREAK_TARGET) {
    if (team.darah < c.DARAH_MAX) team.darah = Math.min(c.DARAH_MAX, team.darah + c.BONUS_DARAH);
    else team.poin += c.BONUS_POIN;
    team.streak = 0;
  }
}

/**
 * Applies one round of answers to a list of teams (mutating). Handles elimination, finishing and
 * the finish order of teams that cross the line in the same round (poin, then darah; on a full
 * tie the bot goes first, then the seeding rank).
 */
export function applyRound(teams, type, correctById, c) {
  const justFinished = [];
  for (const t of teams) {
    if (t.status !== 'Aktif') continue;
    applyEffect(t, type, !!correctById[t.id], c);
    if (t.darah <= 0) {
      t.darah = 0;
      t.status = 'Tereliminasi';
    } else if (t.langkah >= c.LANGKAH_MENANG) {
      justFinished.push(t);
    }
  }
  justFinished.sort(finishTieBreak);
  const maxOrder = teams.reduce((m, t) => Math.max(m, t.finishOrder || 0), 0);
  justFinished.forEach((t, i) => {
    t.status = 'Finish';
    t.finishOrder = maxOrder + i + 1;
  });
  return justFinished;
}

function finishTieBreak(a, b) {
  return b.poin - a.poin || b.darah - a.darah || (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0) || (a.targetRank ?? 99) - (b.targetRank ?? 99);
}

const STATUS_ORDER = { Finish: 0, Aktif: 1, Tereliminasi: 2 };

/**
 * Original ranking (Regi, 31 Oct 2026): finishers by finish order, then active teams by
 * langkah, poin, darah, then eliminated teams by langkah, poin.
 * Single-player adaptation: no shared ranks. A full tie puts the bot first, then seeding rank.
 */
export function compareTeams(a, b) {
  const sa = STATUS_ORDER[a.status];
  const sb = STATUS_ORDER[b.status];
  if (sa !== sb) return sa - sb;
  if (a.status === 'Finish') return a.finishOrder - b.finishOrder;
  const byScore = b.langkah - a.langkah || b.poin - a.poin || (a.status === 'Aktif' ? b.darah - a.darah : 0);
  if (byScore) return byScore;
  return (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0) || (a.targetRank ?? 99) - (b.targetRank ?? 99);
}
