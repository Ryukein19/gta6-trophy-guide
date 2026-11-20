# Leonida Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ryukein19/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ryukein19/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The best offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words with 290 citations from 10 sources (5–6 per trophy), a roadmap to the platinum in five stages, every missable trophy flagged, and a checklist that saves your progress in the browser. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything runs offline from the static files under `app/` — the trophy data is read from your own machine and never uploaded.

## What it does

1. **Checklist of all 55 trophies** — official name, description, grade badge, hidden badge where PlayStation hides it, kind tag, and a missable warning where it applies. Tick a trophy to mark it earned.
2. **Progress that saves** — localStorage keeps your ticks across reloads, with a progress bar, percent, and per-grade counts. Export your progress to a JSON file and import it back.
3. **Filters** — by kind (story, missable, collectibles, activities), by grade (platinum, gold, silver, bronze), by earned/unearned, and a text search by name. They combine.
4. **Spoiler-free mode** — hides the names and descriptions of story and missable trophies until you earn them.
5. **A guide for every trophy** — click a trophy to open its guide beside the list, with the sources it cites (Exophase, PSNProfiles, GTAScoop, EGamers.io, GamesFuze, PowerPyx, GTABase, GameMapa, SixShore, GTASpotter). Every trophy cites 5–6 sources; a Sources section lists all 10 guides with per-source counts.
6. **Roadmap to the platinum** — five stages in order: story, stranger missions, collectibles, activities, then the 100% cleanup.
7. **Missable flags** — a dedicated section lists the six trophies that can be missed and when.

## Notes on the guides

GTA VI is not released yet, so the guides are built from the official trophy descriptions plus the mission and chapter structure those descriptions name. Where a detail is not verifiable, the guide says what the description states and cites the list source; no walkthrough step is invented. The only trophy flagged as possibly missable is Positive Mental Attitude (one meditation spot is at Jason's house in Chapter 1), and the five stranger chains have windows tied to story progress. No Rockstar logo or artwork is used.

---

Entered on [make.fun](https://make.fun/?ref=sage-badger-64&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards
