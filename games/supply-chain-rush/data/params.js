// Supply Chain Rush v2 parameters, copied from SCR/server/state.js (OLFACTION 2026).
// All times are GAME seconds of the original 30 minute match. Shorter web matches run the same
// match faster (see SPEED in engine.js), so every rule keeps its original value.

export const SETTINGS = {
  initialCash: 100000,
  durationSec: 1800,
  teamCooldownSec: 30,
  grindingRewardPct: 0.05,
  grindingUnlockThresholdPct: 0.5,
  grindingLockThresholdPct: 1.0,
  grindingWrongLockBaseSec: 10,
  grindingWrongLockMaxSec: 60,
  grindingMax: 50,
};

/** Pos 1, raw material (nickel). */
export const VENDORS = {
  A: { id: 'A', qty: 10, price: 3500, maxStock: 240, restockCooldownSec: 90 },
  B: { id: 'B', qty: 20, price: 11000, maxStock: 240, restockCooldownSec: 150 },
  C: { id: 'C', qty: 25, price: 16000, maxStock: 400, restockCooldownSec: 180 },
};

/** Pos 2, factories (nickel to battery). */
export const FACTORIES = {
  A: { id: 'A', inputPerRun: 10, outputPerRun: 2, timeSec: 60, price: 3000 },
  B: { id: 'B', inputPerRun: 25, outputPerRun: 5, timeSec: 25, price: 14000 },
  C: { id: 'C', inputPerRun: 20, outputPerRun: 4, timeSec: 45, price: 8000 },
};

/** Pos 3, shipping and sale (one full load per shipment). */
export const FLEET = {
  Motor: { id: 'Motor', capacity: 5, shippingCost: 10000, sellPrice: 40000 },
  Truck: { id: 'Truck', capacity: 20, shippingCost: 30000, sellPrice: 200000 },
  Pesawat: { id: 'Pesawat', capacity: 40, shippingCost: 50000, sellPrice: 420000 },
};

/** Scheduled market events (auto mode in the original). Each one rebases to the defaults first. */
export const MARKET_EVENTS = [
  {
    id: 'event_10m',
    triggerSec: 600,
    title: { id: 'FASE 2: DINAMIKA TAMBANG & DISTRIBUSI', en: 'PHASE 2: MINING AND DISTRIBUTION SHAKE-UP' },
    description: {
      id: 'Cuaca mengganggu pasokan nikel, jadwal pabrik bergeser, dan permintaan naik. Tinjau ulang strategi tim!',
      en: 'Bad weather disrupts nickel supply, factory schedules shift and demand rises. Rethink your plan!',
    },
    changes: {
      pos1: { A: { price: 7500, qty: 10 }, B: { price: 10000, qty: 20 }, C: { price: 12000, qty: 25 } },
      pos2: { A: { price: 4500, timeSec: 30, outputPerRun: 2 }, B: { price: 16000, timeSec: 35, outputPerRun: 5 }, C: { price: 7000, timeSec: 45, outputPerRun: 4 } },
      pos3: { Motor: { sellPrice: 40000, shippingCost: 12500 }, Truck: { sellPrice: 210000, shippingCost: 30000 }, Pesawat: { sellPrice: 410000, shippingCost: 60000 } },
    },
  },
  {
    id: 'event_20m',
    triggerSec: 1200,
    title: { id: 'FASE 3: LONJAKAN EKSPOR & BAHAN BAKAR', en: 'PHASE 3: EXPORT BOOM AND FUEL SPIKE' },
    description: {
      id: 'Order global meningkat tajam saat ongkos kirim naik dan pasokan nikel mengetat. Tuntaskan pengiriman sebelum waktu habis!',
      en: 'Global orders jump while shipping costs rise and nickel gets scarce. Ship everything before time runs out!',
    },
    changes: {
      pos1: { A: { price: 4000, qty: 10 }, B: { price: 11000, qty: 20 }, C: { price: 19000, qty: 25 } },
      pos2: { A: { price: 3500, timeSec: 45, outputPerRun: 2 }, B: { price: 17000, timeSec: 20, outputPerRun: 5 }, C: { price: 9000, timeSec: 40, outputPerRun: 4 } },
      pos3: { Motor: { sellPrice: 45000, shippingCost: 17500 }, Truck: { sellPrice: 220000, shippingCost: 45000 }, Pesawat: { sellPrice: 500000, shippingCost: 90000 } },
    },
  },
];
