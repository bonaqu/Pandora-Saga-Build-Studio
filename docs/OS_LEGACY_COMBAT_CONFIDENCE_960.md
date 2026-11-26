# 0.960.0 · Legacy ACC/Dodge confidence and official OS source readiness

**Game source is authoritative for values.** Official `https://pandorasaga-os.com/gamedata/skills.json`, `classes.json`, `tables.json` directly retrieved 26.11.2026 matched 571 skill records, 28 classes and 14 table fields in GitHub. The current OS source cap is **50**, whereas Build Studio deliberately plans to **55**. Current source numeric parameters are preserved as correct values.

**Remaked supplies historical mechanics, not proof of undisclosed current-server execution.** Remaked `js/calc.js` lines 336–412 implement unbuffed accuracy `level + DEX` and evasion `level + AGI + AGI threshold` (with separate buffs and mount rates). Build Studio already uses these legacy stages; this release **does not change the calculation**. Instead its returned `accuracy` and `dodge` parts now explicitly say `verified:false`, `confidence:'legacy-model'` with source labels.

Hero Book shows an unobtrusive `модель`/`model` marker beside these **two** numeric results, with an accessible RU/EN explanation. Canonical field names `Точность`/`Уклонение`, D1 editorial keys, other result rows, user saved builds and character calculations remain unchanged.

[Issue #98](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/98) preserves a historical Scout lvl4 game-client report ACC 11 and Dodge 15 vs Remaked's unbuffed formula 14 and 11. One older record cannot identify the current game's missing bonus stages or prove a global offset. Keep #98 open; never adjust game numbers merely to force this example to match.

Read-only `live-readonly.yml` now also runs the **already implemented official 17-dataset source inspector** from PR #831 and prints a GitHub Step Summary. The `--observe` mode can warn on upstream outage/text drift without blocking an unrelated tested web release; local strict `npm run os:source:live` remains blocking. No production D1 SQL, catalog edit, CAS or secret access is performed.

Regression: 28 jobs × Lv 1–55 for unchanged numeric legacy stages; preserved Elf Warrior L1 actual-client 6/6 fixture; conservative source confidence, localised UI marker and advisory original-OS audit behavior. This is not a claim that the current OS server hit/evasion formulas have been reproduced.
