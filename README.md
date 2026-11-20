# OLFACTION GAMES 2026

**Play it here: https://raihanmsyufie.github.io/olfaction-games/**

The three live games of the OLFACTION 2026 national statistics competition final (ITS Surabaya),
rebuilt as single-player browser games: you play one team against the 11 members of the Material
and Method 2026 team, whose finishing order in each game is fixed. Only a best-case run beats the
rank 1 bot.

| Game | What you do | Original | Web |
|---|---|---|---|
| Teka Teki Saya | Answer the same question as everyone each round, step forward, keep your lives | 30 min, MC and judges | 10, 15 or 30 min |
| Question Market | Buy and sell questions like a stock as the price moves every minute | 30 min, Google Sheets dashboard | 10, 15 or 30 min |
| Supply Chain Rush | Buy nickel, run factories, ship batteries, finish with the most cash | 30 min, LAN server | 10, 15 or 30 min (3x, 2x, 1x speed) |

Engines, bots, tests and the simulator are done, and all three games play from the start screen
to the podium on phone and laptop, with sound effects (mute button in the top bar) and motion that
stays still for visitors who ask for reduced motion. `docs/LOGIC.md` is the contract the UI codes
against.

## Run it

Requires Node 18 or newer for the tests. No dependencies, no build step.

```
npm test               # 34 rule and outcome tests
node sim/run.js 200 50 # Monte Carlo check, writes sim/out/results.csv and summary.json
python -m http.server  # then open http://localhost:8000 to play
```

The site uses ES modules, so open it through a local server rather than double-clicking
`index.html`. On a laptop every action has a key, shown on its button (P or Esc pauses).

| Folder | What is in it |
|---|---|
| `games/` | Pure game engines and bots, no DOM |
| `shared/` | Seeded random numbers, the bot roster, the integer question bank |
| `site/` | Screens, tokens, components, EN/ID text, synthesized sound effects, confetti, KaTeX |
| `assets/img/` | Logo, mascot poses and ornaments cut from the OLFACTION assets |

## The opponents

| Bot | Teka Teki Saya | Supply Chain Rush | Question Market |
|---|---|---|---|
| Raihan | 1 | 3 | 4 |
| Rucita | 2 | 10 | 10 |
| Chlea | 3 | 11 | 9 |
| Refaro | 4 | 2 | 8 |
| Nindrax | 5 | 6 | 7 |
| Hanida | 6 | 5 | 5 |
| Ketzia | 7 | 7 | 6 |
| Gepril | 8 | 4 | 3 |
| Zhiyyan | 9 | 1 | 11 |
| Riznug | 10 | 8 | 2 |
| Caca | 11 | 9 | 1 |

Ranks are among the 11 bots. The player slots in wherever their own result lands.

## What the simulator shows

27,000 matches (1,000 per cell for Question Market and Teka Teki Saya, 200 for Supply Chain Rush).

| Check | Question Market | Teka Teki Saya | Supply Chain Rush |
|---|---|---|---|
| Bots finish in table order | 100% | 100% | 100% |
| Perfect run finishes first | 100% | 100% | 100% |
| A good but not perfect player finishes first | 0% | 0% (90% accuracy) | 0 to 8% (3 s reactions), mostly by beating the benchmark |
| Good player's average rank | 9.3 to 9.9 | 5.9 to 6.2 | 1.9 to 2.4 |

Rules are ported from the original OLFACTION 2026 code (the Apps Script market dashboard and the
two Node.js game servers), including the Teka Teki Saya fix where the emergency check runs again the moment the
third cooldown round ends. Every change made for single play is listed at the end of
`docs/LOGIC.md`.

## Credits

Game concepts by the [Material and Method 2026](https://www.instagram.com/mamyodd/) team of
[OLFACTION ITS](https://www.linkedin.com/company/olfaction-its/home/). Web version refined and
rebuilt by [Raihan Mujadid Syufie](https://www.linkedin.com/in/raihanmujadids/). Logo, mascot and
visual style by the OLFACTION 2026 [creative team](https://www.linkedin.com/in/ensita-putri-ramadhani/).
Bot names are members of the Material and Method 2026 team, used with their consent.
