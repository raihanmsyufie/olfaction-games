// Interface text in English (default) and Indonesian. Questions stay in their original language.

const D = {
  en: {
    play: 'Play', about: 'About', back: 'Back', home: 'Home', start: 'Start', pause: 'Pause', resume: 'Resume',
    quit: 'Quit', quit_q: 'Leave this match?', quit_p: 'Progress in this match will not be saved.', stay: 'Continue playing',
    theme_light: 'Light', theme_arena: 'Arena', lang: 'ID',
    hero_title: 'PLAY THE OLFACTION FINALS',
    hero_p: 'Three live games from the OLFACTION 2026 national final, rebuilt for a single player. Choose a game and {mark}compete against eleven rival teams{/mark} right in your browser.',
    pick: 'Choose a game', teams12: '12 teams', mins: '10–30 min',
    qm_name: 'Question Market', scr_name: 'Supply Chain Rush', tts_name: 'Teka Teki Saya',
    qm_tag: 'Trading', scr_tag: 'Logistics', tts_tag: 'Race',
    qm_desc: 'Buy questions on a live market where prices change every minute, solve them, and sell before the market closes.',
    scr_desc: 'Source nickel, run factories, and ship batteries. Every team draws from the same supply, so timing matters.',
    tts_desc: 'Every team answers the same question each round. Correct answers move you forward, while wrong answers cost a life.',
    howto: 'How to play', duration: 'Match length', your_name: 'Team name', name_ph: 'Your team',
    rivals: 'Rival teams', start_match: 'Start match', best: 'Your best finish: #{rank}', keys: 'Keyboard shortcuts',
    min: 'min', fast: 'Quick', normal: 'Standard', full: 'Full length',
    qm_s1: 'Buy one question at the current minute\'s buy price.',
    qm_s2: 'Solve it. Whether your answer is correct is revealed only when you sell.',
    qm_s3: 'Sell from the following minute onward. A correct answer earns the sell-if-correct price, and a wrong one earns 30% of it.',
    scr_s1: 'Buy nickel from a vendor. Each purchase starts a 30-second cooldown (game time) for your team.',
    scr_s2: 'Process nickel into batteries at the factories. Each factory runs on its own timer.',
    scr_s3: 'Ship full loads to sell. Unsold nickel and batteries are worth nothing, so the team with the most cash at the end wins.',
    tts_s1: 'Answer before the timer runs out. A correct answer to a Hitungan (calculation) question moves you one step forward.',
    tts_s2: 'A wrong or missing answer costs one life. Three correct answers in a row earn a bonus.',
    tts_s3: 'When any team runs low on lives, Teori (true or false) rounds begin. The first team to reach the finish wins.',
    k_buy: 'buy', k_sell: 'sell', k_answer: 'answer', k_pause: 'pause',
    go: 'GO!', paused: 'Paused', paused_p: 'The match is paused. The bots are waiting too.',
    // QM
    minute: 'Minute', liquidation: 'Liquidation', liq_p: 'Buying is closed. Sell any question you hold at the minute 29 price.',
    buy_price: 'Buy price', sell_right: 'Sell if correct', sell_wrong: 'Sell if wrong', your_cash: 'Cash balance',
    buy_q: 'Buy a question', sell_q: 'Sell question', your_answer: 'Your answer', holding: 'Bought in minute {m} for {p}',
    market_news: 'Market news', news_new: 'NEW', price_chart: 'Price history', you_trade: 'Your trades',
    r_not_running: 'The market is closed.', r_liquidation: 'Buying is closed during liquidation.', r_already_holding: 'Sell your current question first.',
    r_not_enough_cash: 'Insufficient cash at this price.', r_too_early: 'You can sell from the next minute.', r_nothing_to_sell: 'Buy a question first.',
    sold_right: 'Correct answer. Sold for {p}', sold_wrong: 'Incorrect answer. Sold for {p}', bought: 'Purchased for {p}', standings: 'Standings',
    // TTS
    round: 'Round {n}', hitungan: 'Hitungan', teori: 'Teori', steps: 'Steps', points: 'Points', blood: 'Lives',
    mode_normal: 'Normal', mode_darurat: 'Emergency: Teori rounds', mode_cooldown: 'Cooldown: Hitungan only',
    true_: 'True', false_: 'False', answered: '{n} of {m} teams have answered', correct_ans: 'Correct answer: {a}',
    you_right: 'Correct!', you_wrong: 'Incorrect', you_none: 'No answer', you_finished: 'You reached the finish line',
    you_out: 'You are out of lives', spectate: 'The race continues without you.', skip: 'Skip to results',
    ann_emergency_start: 'A team is running low on lives. The next 3 rounds are Teori questions for all teams.',
    ann_emergency_over: 'The Teori rounds are over. Three Hitungan rounds follow as a cooldown.',
    ann_cooldown_over: 'Cooldown complete.', ann_teori_exhausted: 'All Teori questions have been used. Only Hitungan rounds remain.',
    teori_left: '{n} Teori left', track: 'Race track', d_step: '+{n} step', d_pts: '+{n} pts', d_blood: '{n} life',
    // SCR
    cash: 'Cash', nickel: 'Nickel', batteries: 'Batteries', cooldown: 'Purchase cooldown', ready: 'Ready',
    pos1: 'Buy nickel', pos2: 'Production', pos3: 'Shipping and sales', vendor: 'Vendor {id}', factory: 'Factory {id}',
    pack: 'Pack', price: 'Price', stock: 'Stock', restock_in: 'Restocks in {s}s', input: 'In', output: 'Out', time: 'Time', fee: 'Fee',
    per_batt_s: 'Cost per battery', net_batt_s: 'Net per battery',
    capacity: 'Load', ship_cost: 'Shipping', sale: 'Sale', per_batt: 'Net per battery {v}', buy: 'Buy', produce: 'Produce', ship: 'Ship',
    fleet_Motor: 'Motorcycle', fleet_Truck: 'Truck', fleet_Pesawat: 'Air freight',
    running: 'In progress, {s}s left', phase: 'Phase {n}', speed: '{n}x speed', grinding: 'Grinding',
    grind_p: 'Your cash is at half of the starting amount or less. Each correct answer adds {v}.',
    grind_off: 'Grinding unlocks when your cash falls to half of the starting amount or less.',
    grind_locked: 'Locked for {s}s', check: 'Submit', board: 'Ranks', grind_right: 'Correct! +{v}', grind_wrong: 'Incorrect. This question is locked for {s}s.',
    w_not_running: 'The market is closed.', w_cooldown: 'Cooldown, {s}s', w_out_of_stock: 'Out of stock', w_not_enough_cash: 'Insufficient cash',
    w_factory_busy: 'Already running', w_not_enough_nickel: 'Not enough nickel', w_not_enough_batteries: 'Not enough batteries',
    restocked: 'Vendor {id} has restocked', unsold: 'Unsold nickel and batteries are worth nothing at the end.',
    // end
    final: 'FINAL STANDINGS', you_rank: 'You finished #{rank}', beat: 'You finished ahead of {n} of 11 rival teams.', beat_all: 'You finished ahead of all 11 rival teams. A perfect run.',
    again: 'Play again', other: 'Choose another game', full_table: 'Full standings', summary: 'Match summary',
    s_trades: 'Trades', s_right: 'Correct answers', s_best: 'Best trade', s_rounds: 'Rounds', s_teori: 'Teori rounds', s_shipped: 'Batteries shipped', s_produced: 'Batteries produced', s_grind: 'Earned from grinding',
    cash_vs: 'Your cash compared with the leader, by minute',
    // about
    about_title: 'ABOUT THE GAMES',
    about_p1: 'The three games on this site were designed by the {a:mamod}Material and Method 2026{/a} team of {a:olf}OLFACTION ITS{/a}, a national statistics competition organized by Business Statistics students at Institut Teknologi Sepuluh Nopember (ITS), Surabaya. The games were first played live at the OLFACTION 2026 final, where 12 teams competed at a single venue.',
    about_p2: 'This web edition was refined and rebuilt by {a:raihan}Raihan Mujadid Syufie{/a} so that anyone can play the finals individually, directly in a browser. The logo, robot mascot, and visual identity were created by the OLFACTION 2026 {a:creative}creative team{/a}.',
    meet: 'Meet your rivals',
    meet_p: 'Your eleven opponents are the members of the Material and Method 2026 team, the people who designed these games. Each of them appears as a bot under their own nickname. Their finishing order is fixed in every game, and the top-ranked bot always stops one step short of a perfect run, so first place requires a flawless performance.',
    sound_on: 'Sound on', sound_off: 'Sound off',
  },
  id: {
    play: 'Main', about: 'Tentang', back: 'Kembali', home: 'Beranda', start: 'Mulai', pause: 'Jeda', resume: 'Lanjutkan',
    quit: 'Keluar', quit_q: 'Keluar dari pertandingan?', quit_p: 'Progres pertandingan ini tidak akan disimpan.', stay: 'Lanjutkan permainan',
    theme_light: 'Terang', theme_arena: 'Arena', lang: 'EN',
    hero_title: 'MAINKAN FINAL OLFACTION',
    hero_p: 'Tiga game langsung dari babak final nasional OLFACTION 2026, dibangun ulang untuk satu pemain. Pilih game dan {mark}hadapi sebelas tim rival{/mark} langsung di browser.',
    pick: 'Pilih game', teams12: '12 tim', mins: '10–30 menit',
    qm_name: 'Question Market', scr_name: 'Supply Chain Rush', tts_name: 'Teka Teki Saya',
    qm_tag: 'Perdagangan', scr_tag: 'Logistik', tts_tag: 'Balapan',
    qm_desc: 'Beli soal di pasar yang harganya berubah setiap menit, kerjakan, lalu jual sebelum pasar ditutup.',
    scr_desc: 'Beli nikel, jalankan pabrik, dan kirim baterai. Semua tim mengambil dari stok yang sama, jadi ketepatan waktu sangat menentukan.',
    tts_desc: 'Semua tim menjawab soal yang sama setiap ronde. Jawaban benar membawa Anda maju, sedangkan jawaban salah mengurangi nyawa.',
    howto: 'Cara bermain', duration: 'Durasi pertandingan', your_name: 'Nama tim', name_ph: 'Tim Anda',
    rivals: 'Tim rival', start_match: 'Mulai pertandingan', best: 'Peringkat terbaik Anda: #{rank}', keys: 'Pintasan keyboard',
    min: 'menit', fast: 'Singkat', normal: 'Standar', full: 'Durasi penuh',
    qm_s1: 'Beli satu soal dengan harga beli pada menit tersebut.',
    qm_s2: 'Kerjakan soalnya. Benar atau salahnya jawaban baru diketahui saat soal dijual.',
    qm_s3: 'Jual mulai menit berikutnya. Jawaban benar dibayar dengan harga jual benar, dan jawaban salah dibayar 30% dari harga tersebut.',
    scr_s1: 'Beli nikel dari vendor. Setiap pembelian memicu jeda 30 detik (waktu game) untuk tim Anda.',
    scr_s2: 'Olah nikel menjadi baterai di pabrik. Setiap pabrik memiliki waktu proses sendiri.',
    scr_s3: 'Kirim muatan penuh untuk menjual. Nikel dan baterai yang tersisa tidak bernilai, sehingga tim dengan kas terbanyak di akhir pertandingan menjadi pemenang.',
    tts_s1: 'Jawab sebelum waktu habis. Jawaban benar pada soal Hitungan membawa Anda maju satu langkah.',
    tts_s2: 'Jawaban salah atau kosong mengurangi satu nyawa. Tiga jawaban benar berturut-turut memberi bonus.',
    tts_s3: 'Saat ada tim yang nyawanya menipis, ronde Teori (benar atau salah) dimulai. Tim pertama yang mencapai garis akhir menjadi pemenang.',
    k_buy: 'beli', k_sell: 'jual', k_answer: 'jawab', k_pause: 'jeda',
    go: 'MULAI!', paused: 'Dijeda', paused_p: 'Pertandingan sedang dijeda. Bot juga ikut menunggu.',
    minute: 'Menit', liquidation: 'Likuidasi', liq_p: 'Pembelian ditutup. Jual soal yang Anda pegang dengan harga menit ke-29.',
    buy_price: 'Harga beli', sell_right: 'Jual jika benar', sell_wrong: 'Jual jika salah', your_cash: 'Saldo kas',
    buy_q: 'Beli soal', sell_q: 'Jual soal', your_answer: 'Jawaban Anda', holding: 'Dibeli pada menit {m} seharga {p}',
    market_news: 'Berita pasar', news_new: 'BARU', price_chart: 'Riwayat harga', you_trade: 'Transaksi Anda',
    r_not_running: 'Pasar sudah ditutup.', r_liquidation: 'Pembelian ditutup selama likuidasi.', r_already_holding: 'Jual soal yang sedang Anda pegang terlebih dahulu.',
    r_not_enough_cash: 'Kas tidak mencukupi pada harga ini.', r_too_early: 'Soal dapat dijual mulai menit berikutnya.', r_nothing_to_sell: 'Beli soal terlebih dahulu.',
    sold_right: 'Jawaban benar. Terjual {p}', sold_wrong: 'Jawaban salah. Terjual {p}', bought: 'Dibeli seharga {p}', standings: 'Klasemen',
    round: 'Ronde {n}', hitungan: 'Hitungan', teori: 'Teori', steps: 'Langkah', points: 'Poin', blood: 'Nyawa',
    mode_normal: 'Normal', mode_darurat: 'Darurat: ronde Teori', mode_cooldown: 'Cooldown: hanya Hitungan',
    true_: 'Benar', false_: 'Salah', answered: '{n} dari {m} tim sudah menjawab', correct_ans: 'Jawaban benar: {a}',
    you_right: 'Benar!', you_wrong: 'Salah', you_none: 'Tidak menjawab', you_finished: 'Anda telah mencapai garis akhir',
    you_out: 'Nyawa Anda habis', spectate: 'Balapan berlanjut tanpa tim Anda.', skip: 'Lewati ke hasil',
    ann_emergency_start: 'Ada tim yang nyawanya menipis. Tiga ronde berikutnya berisi soal Teori untuk semua tim.',
    ann_emergency_over: 'Ronde Teori selesai. Tiga ronde Hitungan berikutnya menjadi masa cooldown.',
    ann_cooldown_over: 'Cooldown selesai.', ann_teori_exhausted: 'Soal Teori sudah habis. Ronde berikutnya hanya Hitungan.',
    teori_left: 'Sisa {n} Teori', track: 'Lintasan', d_step: '+{n} langkah', d_pts: '+{n} poin', d_blood: '{n} nyawa',
    cash: 'Kas', nickel: 'Nikel', batteries: 'Baterai', cooldown: 'Jeda pembelian', ready: 'Siap',
    pos1: 'Beli nikel', pos2: 'Produksi', pos3: 'Pengiriman dan penjualan', vendor: 'Vendor {id}', factory: 'Pabrik {id}',
    pack: 'Paket', price: 'Harga', stock: 'Stok', restock_in: 'Restok dalam {s} dtk', input: 'Masuk', output: 'Hasil', time: 'Waktu', fee: 'Biaya',
    per_batt_s: 'Biaya per baterai', net_batt_s: 'Bersih per baterai',
    capacity: 'Muatan', ship_cost: 'Ongkos kirim', sale: 'Harga jual', per_batt: 'Bersih per baterai {v}', buy: 'Beli', produce: 'Produksi', ship: 'Kirim',
    fleet_Motor: 'Motor', fleet_Truck: 'Truk', fleet_Pesawat: 'Pesawat',
    running: 'Berjalan, sisa {s} dtk', phase: 'Fase {n}', speed: 'Kecepatan {n}x', grinding: 'Grinding',
    grind_p: 'Kas Anda tinggal setengah dari modal awal atau kurang. Setiap jawaban benar menambah {v}.',
    grind_off: 'Grinding terbuka saat kas Anda turun ke setengah modal awal atau kurang.',
    grind_locked: 'Terkunci {s} dtk', check: 'Periksa', board: 'Peringkat', grind_right: 'Benar! +{v}', grind_wrong: 'Belum tepat. Soal ini dikunci selama {s} dtk.',
    w_not_running: 'Pasar sudah ditutup.', w_cooldown: 'Jeda, {s} dtk', w_out_of_stock: 'Stok habis', w_not_enough_cash: 'Kas tidak mencukupi',
    w_factory_busy: 'Sedang berjalan', w_not_enough_nickel: 'Nikel tidak mencukupi', w_not_enough_batteries: 'Baterai tidak mencukupi',
    restocked: 'Vendor {id} telah restok', unsold: 'Nikel dan baterai yang tidak terjual tidak bernilai di akhir pertandingan.',
    final: 'KLASEMEN AKHIR', you_rank: 'Anda finis di posisi #{rank}', beat: 'Anda unggul atas {n} dari 11 tim rival.', beat_all: 'Anda unggul atas seluruh 11 tim rival. Permainan sempurna.',
    again: 'Main lagi', other: 'Pilih game lain', full_table: 'Klasemen lengkap', summary: 'Ringkasan pertandingan',
    s_trades: 'Transaksi', s_right: 'Jawaban benar', s_best: 'Transaksi terbaik', s_rounds: 'Ronde', s_teori: 'Ronde Teori', s_shipped: 'Baterai terkirim', s_produced: 'Baterai diproduksi', s_grind: 'Dari grinding',
    cash_vs: 'Kas Anda dibandingkan pemimpin klasemen, per menit',
    about_title: 'TENTANG GAME INI',
    about_p1: 'Ketiga game di situs ini dirancang oleh tim {a:mamod}Material and Method 2026{/a} dari {a:olf}OLFACTION ITS{/a}, kompetisi statistika tingkat nasional yang diselenggarakan oleh mahasiswa Statistika Bisnis Institut Teknologi Sepuluh Nopember (ITS), Surabaya. Game ini pertama kali dimainkan secara langsung di babak final OLFACTION 2026, dengan 12 tim bertanding di satu lokasi.',
    about_p2: 'Versi web ini dirapikan dan dibangun ulang oleh {a:raihan}Raihan Mujadid Syufie{/a} agar babak final OLFACTION dapat dimainkan siapa saja secara individu, langsung dari browser. Logo, maskot robot, dan identitas visualnya dibuat oleh {a:creative}tim kreatif{/a} OLFACTION 2026.',
    meet: 'Kenali tim rival Anda',
    meet_p: 'Sebelas lawan Anda adalah anggota tim Material and Method 2026, tim yang merancang game ini. Masing-masing tampil sebagai bot dengan nama panggilannya sendiri. Urutan finis mereka di setiap game sudah ditetapkan, dan bot peringkat pertama selalu berhenti satu langkah sebelum permainan sempurna. Karena itu, posisi pertama hanya dapat diraih dengan permainan tanpa kesalahan.',
    sound_on: 'Suara aktif', sound_off: 'Suara nonaktif',
  },
};

// The site always opens in English. A switch to Indonesian lasts for the current visit only.
let lang = 'en';
try { lang = sessionStorage.getItem('ogs-lang') === 'id' ? 'id' : 'en'; localStorage.removeItem('ogs-lang'); } catch { /* storage off */ }

export function getLang() { return lang; }
export function setLang(l) {
  lang = l;
  try { sessionStorage.setItem('ogs-lang', l); } catch { /* storage off */ }
  document.documentElement.lang = l;
}

// Outside links used in the About text, written as {a:key}label{/a}.
const LINKS = {
  mamod: 'https://www.instagram.com/mamyodd/',
  olf: 'https://www.linkedin.com/company/olfaction-its/home/',
  raihan: 'https://www.linkedin.com/in/raihanmujadids/',
  creative: 'https://www.linkedin.com/in/ensita-putri-ramadhani/',
};

/** t('key', { n: 3 }) with {name} placeholders. {mark}..{/mark} become highlighter spans, {a:key}..{/a} outside links. */
export function t(key, vars = {}) {
  let s = D[lang][key] ?? D.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  s = s.replace(/\{a:(\w+)\}(.*?)\{\/a\}/g, (_, k, label) => `<a class="ext" href="${LINKS[k]}" target="_blank" rel="noopener">${label}</a>`);
  return s.replace('{mark}', '<span class="mark">').replace('{/mark}', '</span>');
}
