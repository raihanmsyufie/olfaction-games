# Logic layer contract (for the UI merge)

The three engines are plain ES modules with no DOM, no timers and no `Date.now`. The UI owns the
clock: it calls `tick` from `requestAnimationFrame` (or a 250 ms interval) with the real milliseconds
that passed, and renders from selectors. Every engine exposes the same shape:

| Export | What it does |
|---|---|
| `createGame({ durationMin, playerName, seed })` | New match. `durationMin` is 10, 15 or 30. `seed` is optional (random if missing), same seed gives the same match |
| `reduce(state, action)` | Pure: returns a new state, input untouched |
| `apply(state, action)` | Same rules, mutates in place. Faster, used by `sim/`. The UI may use it too and re-render after each call |
| `leaderboard(state)` | 12 rows sorted by rank, the player row has `isPlayer: true` |
| `GAME_ID` | `qm`, `tts` or `scr` |

Common actions: `{ type: 'start' }` and `{ type: 'tick', dtMs }`. Pause is simply "stop sending ticks".
`state.status` is `ready`, `running` or `finished`. Reason codes (strings like `cooldown`,
`too_early`) are meant to be looked up in `shared/core/i18n.js` once the UI exists.

Flow for every game: page 1 picks the game, page 2 picks the duration and the player name, page 3
plays. Call `createGame` when page 2 is confirmed (Supply Chain Rush needs about 0.1 to 0.3 s to
prepare a match, show a short "preparing match" state).

## Question Market (`games/question-market/engine.js`)

| Action | Notes |
|---|---|
| `{ type: 'buy' }` | Buys one question at the current minute's buy price. One question held at a time |
| `{ type: 'answer', value }` | Integer answer for the held question, can be changed until it is sold |
| `{ type: 'sell' }` | Allowed from the next market minute on. Right answer gets `sellRight`, otherwise `sellWrong` |

Selectors: `priceAt(s)`, `currentNarrative(s)` (has `id` and `en` text), `remainingMs(s)`,
`msLeftInMinute(s)`, `canBuy(s)`, `canSell(s)` (both return `{ ok, reason }`), `questionById(id)`
(the UI must never show `answers`), `isLiquidation(s)`. History for the summary chart:
`s.player.cashByMinute`, `s.player.trades`, and `cashByMinute` on every bot. Toast feed: `s.events`.

The player never learns whether an answer is right before selling, so the UI must not reveal it.

## Teka Teki Saya (`games/teka-teki-saya/engine.js`)

| Action | Notes |
|---|---|
| `{ type: 'answer', value }` | `A` to `D` for Hitungan, `T` or `F` for Teori. Closes the round at once (the bots have locked in) |

Phases: `s.phase` is `question` (countdown `questionRemainingMs(s)`) or `reveal` (3 s, read
`s.lastResult`: key, explanation, per-team outcome with deltas, announcements). Question to show:
`publicQuestion(s)` (no key, has `image` for `assets/tts/<id>.PNG`, `text`, `choices`, `type`).
Mode banner: `s.round.mode` (`Normal`, `Darurat`, `Cooldown`) and `s.round.daruratSisa` /
`cooldownSisa`. Announcement keys: `emergency_start`, `emergency_over`, `cooldown_over`,
`teori_exhausted`. Track length and blood depend on duration: `s.config.LANGKAH_MENANG`,
`s.config.DARAH_MAX`. `leaderboard(s)` rows carry `answered` for the "already answered" dots.
End: `s.endReason` is `top3`, `time` or `no_active`.

## Supply Chain Rush (`games/supply-chain-rush/engine.js`)

| Action | Notes |
|---|---|
| `{ type: 'buy', vendor }` | `A`, `B` or `C`. 30 game-second cooldown after each purchase |
| `{ type: 'produce', factory }` | `A`, `B` or `C`. One run per factory at a time |
| `{ type: 'ship', fleet }` | `Motor`, `Truck` or `Pesawat`. Needs a full load and the shipping cost up front |
| `{ type: 'grind', questionId, answer }` | Only while `team.grinding.active` (cash at or below 50%) |

The engine clock is in GAME time of the original 30 minute match (`s.gameMs`, 0 to 1,800,000).
`tick` takes REAL milliseconds and multiplies by `s.speed` (3, 2 or 1), so show
`remainingRealSec(s)` on the timer and convert countdowns with `/ s.speed`.

Selectors: `player(s)`, `whyNot(s, 'player', action)` (reason code or `null`, use it to disable
buttons and explain why), `phase(s)` (1, 2 or 3), `grindingQuestions(s, 'player')`, plus the market
objects `s.vendors`, `s.factories`, `s.fleet`. Feed and toasts: `s.feed` (bot and player actions)
and `s.announcements` (`market_event` with `eventId`, `restock` with `vendor`, `time_up`). Event
titles and descriptions in both languages live in `data/params.js`.

Unsold batteries and nickel are worth nothing at the end, exactly like the original.

## How the fixed ranking works

| Game | Rank 1 bot | Bots 2 to 11 |
|---|---|---|
| Question Market | Plays the second best run that exists on the original price table (753,700). The optimal run (755,800) is the only way to beat it | Simulated traders, sampled per match until each lands in the cash band of its rank |
| Teka Teki Saya | Answers everything right except the first Teori question it meets | A director decides right or wrong per round so the table order holds after every round. Scores always follow the real rules |
| Supply Chain Rush | Plays the reference policy at near-instant speed and finishes just below the benchmark, the cash the reference perfect run earns in this exact match | Same policy with slower reactions, plus a director that makes a bot hesitate on purchases when it gets too close to the bot above, and a top-down "last call" at the bell |

`node sim/run.js` checks all of this over thousands of matches (see README).

## Single-player adaptations

| Game | Original | Web |
|---|---|---|
| All | 12 human teams, operator panel, PIN, undo | 1 player and 11 bots, no admin features |
| Question Market | 60 s per market minute, a judge checks answers at sale | 30 market minutes plus one liquidation minute squeezed into 10, 15 or 30 min. Answers are checked automatically at sale and stay hidden until then. One question held at a time, sold at least one minute after buying |
| Question Market | Question bank not in the materials | Uses the 50 integer questions of the Supply Chain Rush grinding bank |
| Teka Teki Saya | 15 steps, 10 blood, 40 s Hitungan, 15 s Teori, 30 min | 30 min keeps that. 15 min: 11 steps, 8 blood, 35 s. 10 min: 8 steps, 7 blood, 30 s and 12 s Teori |
| Teka Teki Saya | A team the judges did not enter was skipped | Not answering in time counts as wrong (guidebook rule). The round closes as soon as the player answers |
| Teka Teki Saya | Shared ranks on a full tie | No shared ranks: on a full tie the bot goes first, then seeding |
| Teka Teki Saya | Teori pool running out mid-window left an empty question | Back to Normal mode with a Hitungan question |
| Supply Chain Rush | 30 min real time | Same 30 min game clock run at 3x (10 min), 2x (15 min) or 1x (30 min) |
| Supply Chain Rush | Market events applied by the operator | Applied automatically at game minute 10 and 20 |
| Supply Chain Rush | Ties broken by team number | Ties (cash, batteries, nickel) go to the bot |
