// The 11 opponents. Every bot is a member of Tim Mamod OLFACTION 2026 (names used with consent).
// `rank` is the bot's fixed finishing order AMONG THE 11 BOTS in each game.
// The player slots in wherever their own result lands; bots below the player shift down by one.
// Rank 1 in every game is the best-case bot: it is exactly one step short of a perfect run,
// so only a perfect run beats it.

export const BOTS = [
  { id: 'raihan', name: 'Raihan Mujadid Syufie', short: 'Raihan', rank: { tts: 1, scr: 3, qm: 4 } },
  { id: 'rucita', name: 'Dihyani Rucita', short: 'Rucita', rank: { tts: 2, scr: 10, qm: 10 } },
  { id: 'chlea', name: 'Chlearezza Claudia Dayyanti', short: 'Chlea', rank: { tts: 3, scr: 11, qm: 9 } },
  { id: 'refaro', name: 'M. Refaro Hafid', short: 'Refaro', rank: { tts: 4, scr: 2, qm: 8 } },
  { id: 'nindrax', name: 'Rafi Nindra Kumara', short: 'Nindrax', rank: { tts: 5, scr: 6, qm: 7 } },
  { id: 'hanida', name: 'Hanida Hafsya Tsabita', short: 'Hanida', rank: { tts: 6, scr: 5, qm: 5 } },
  { id: 'ketzia', name: 'Ketzia Gracie Margaretha', short: 'Ketzia', rank: { tts: 7, scr: 7, qm: 6 } },
  { id: 'gepril', name: 'Gavrille Emmanuel Oliver Wattimena', short: 'Gepril', rank: { tts: 8, scr: 4, qm: 3 } },
  { id: 'zhiyyan', name: 'Zhiyyan Ravi Zidnazain', short: 'Zhiyyan', rank: { tts: 9, scr: 1, qm: 11 } },
  { id: 'riznug', name: 'Muhammad Rizky Nugraha', short: 'Riznug', rank: { tts: 10, scr: 8, qm: 2 } },
  { id: 'caca', name: 'Ratu Annisa Fajar Islami', short: 'Caca', rank: { tts: 11, scr: 9, qm: 1 } },
];

export const DURATIONS = [10, 15, 30];

export const PLAYER_ID = 'player';

/** Bots of one game sorted by their target rank (index 0 = rank 1). */
export function botsByRank(game) {
  return BOTS.slice().sort((a, b) => a.rank[game] - b.rank[game]);
}

export function assertDuration(d) {
  if (!DURATIONS.includes(Number(d))) throw new Error(`Duration must be one of ${DURATIONS.join(', ')} minutes`);
  return Number(d);
}
