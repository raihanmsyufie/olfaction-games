// Market table used at OLFACTION 2026 (data/harga_pasar.csv of the original dashboard).
// Minute 30 is the liquidation minute: no buying, selling uses the minute 29 prices.
// sellWrong = ROUND(sellRight * 0.3), same formula as the original sheet.

const RAW = [
  [0, 100000, 100500], [1, 144800, 147650], [2, 109650, 139400], [3, 138900, 151250],
  [4, 121750, 143800], [5, 81750, 106850], [6, 92650, 131850], [7, 140550, 154350],
  [8, 108250, 145700], [9, 126350, 133450], [10, 89500, 112650], [11, 117850, 124750],
  [12, 113550, 127150], [13, 111900, 119850], [14, 119650, 138750], [15, 103850, 148650],
  [16, 98650, 129750], [17, 83850, 104350], [18, 149500, 198750], [19, 85250, 96600],
  [20, 102450, 114250], [21, 114350, 106650], [22, 136650, 158850], [23, 112550, 103750],
  [24, 97450, 99650], [25, 104750, 106850], [26, 106950, 108350], [27, 102350, 104750],
  [28, 86250, 96850], [29, 93750, 98950], [30, 93750, 98950],
];

export const PRICES = RAW.map(([minute, buy, sellRight]) => ({
  minute,
  buy,
  sellRight,
  sellWrong: Math.round(sellRight * 0.3),
}));

export const START_CASH = 150000;
export const LAST_BUY_MINUTE = 29;
export const LIQUIDATION_MINUTE = 30;
/** 30 market minutes plus one liquidation minute. */
export const TOTAL_MINUTES = 31;

export const NARRATIVES = [
  {
    minute: 0,
    id: 'Pemerintah memperkuat dukungan terhadap industri pengolahan nikel dalam negeri. Pengembangan proyek pengolahan membuka peluang bagi PT OLFACTION untuk memasok bahan baku kendaraan listrik. Meski persaingan global masih ketat, posisi Indonesia sebagai produsen utama nikel mendukung prospek perusahaan.',
    en: 'The government is stepping up support for the domestic nickel processing industry. New processing projects give PT OLFACTION a chance to supply raw materials for electric vehicles. Global competition is still tight, but Indonesia\'s position as a leading nickel producer supports the company\'s outlook.',
  },
  {
    minute: 10,
    id: 'Produksi nikel dari berbagai negara terus meningkat. Namun, permintaan dari industri baja tahan karat belum tumbuh secepat pasokannya sehingga menekan kondisi pasar. PT OLFACTION tetap melanjutkan operasional dan pengembangan proyek pengolahan untuk menjaga prospek jangka panjang.',
    en: 'Nickel output keeps rising across many countries, while demand from the stainless steel industry is growing more slowly than supply, which weighs on the market. PT OLFACTION keeps operating and developing its processing projects to protect its long-term outlook.',
  },
  {
    minute: 20,
    id: 'PT OLFACTION mengembangkan proyek pengolahan nikel dan kerja sama di sektor bahan baku baterai kendaraan listrik. Langkah ini membuka peluang untuk memperluas pasar dan memperkuat rantai pasok dalam negeri. Meski persaingan global tetap menjadi tantangan, perkembangan industri kendaraan listrik mendukung prospek jangka panjang perusahaan.',
    en: 'PT OLFACTION is expanding its nickel processing projects and partnerships in EV battery materials. The move opens room to grow its market and strengthen the domestic supply chain. Global competition remains a challenge, but the growth of the EV industry supports the company\'s long-term outlook.',
  },
];
