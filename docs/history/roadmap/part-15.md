# История ROADMAP — часть 15 из 20

- [x] Load `unison` as part of the **same atomic Cloudflare D1/local catalog snapshot** as items, skills and souls. Validate against `meta.counts.unison=3`; never merge incompatible published snapshots.
- [x] Evaluate actual OS `data/os/unison.json` set requirements from root item plus **distinct companion items**, root refinement grade and source formulas `a.p * grade + a.c` (all supported rows have `a.f=0` and zero `b`). Fail closed for future unknown polynomial types rather than assuming their math.
- [x] Inject resulting source-backed `set:` effects into the **existing** ability/HP/MP, attack, armor, cooldown, cast-interruption, potion and effect coverage pipelines exactly once. Missing set members never activate bonuses.
- [x] Divine Cuirass (ID 12081) with four companions: at root +0, set bonus MP +200 / interruption resist +12 / cooldown -8; at +5, additional MP +40 / armor +4 / resist +4; at +7, additional MP +120 / armor +12 / resist +12. All values follow OS rows rather than made-up set multipliers.
- [x] Divine Bracers (ID 14094) with Sentinel Shield (ID 17034): +2 VIT, +15% back-attack bonus. Golden Cuirass (ID 12103) with all four companions and root +7: identify active anti-tumble set effect without inventing a numeric resistance from zero-value `EP_PROTECTION_TUMBLE`.
- [x] Hero book `Effects` page displays only truly active sets and their numeric bonuses; no implementation diagnostics appear on player-facing pages. Regression fixtures include missing companion, boundaries +0/+5/+7, and overlapping set membership.
- [ ] Continue remaining conditional skills, set/status immunity confirmations, full equipment refinements, combat procs and final server battle equivalence. **Planning 1–55 is mandatory regardless of live server cap 45.**

## Workstreams

| Issue | Scope | State | Next evidence required |
|---|---|---|---|
| [#1](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/1) | Own D1 catalog, imports, RU/EN, wiki and admin publication | In progress | Worker/D1 deployment confirmation, live API smoke, full 11-dataset coverage, authenticated edit/rollback |
| [#2](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/2) | Self-host original race art and 1,437 icon files | Blocked on original image bytes | Mirror original files, validate WebP and manifest, remove all external icon runtime dependencies |
| [#3](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/3) | Single-screen character workbench, race/class/skills/equipment | In progress | Browser E2E and visual inspection on desktop/mobile, keyboard focus, all gear conflict scenarios |
| [#4](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/4) | Saved-build migration, refresh safety, admin reliability, QA | In progress | Real `npm test`, persisted-state + refresh + modal navigation E2E, deployed admin API, crash monitoring |
| [#5](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5) | Current OS combat parity with Remaked reference mechanics | In progress | Source-fingerprinted fixture matrix, buffs, mastery, Forth enhancement, Souls, sets, modifiers and procs |

## Source update 0.108.0 — stable encyclopedia navigation and real NPC/chest/loot assets

- Keep same-category wiki list and search DOM intact on selected-item change; update card and selected marker, avoiding full-drawer flicker and duplicate hashchange work. Handle browser back/forward with popstate.
- Resolve actual chest item names/icons, NPC names, and all trade/material/chest/monster drop item icons from OS ID-linked catalogs.
- Never synthesize monster/NPC/map artwork if current source data has no assets. Next: audit server completeness, richer loot crosslinks and browser smoke testing.

## Source update 0.107.0 — simplify portrait book entry and relocate all boost controls

- One on-portrait interaction (click or keyboard); no pointer hand, no secondary buttons.
- Uniform dimensions and visual style for previous, next and close controls.
- Origin stats show only base allocations and derived vitals; all buffs are edited inside the book. Hidden legacy form nodes retained short-term to avoid breaking already shipped listeners, pending dedicated cleanup.
- Player summary no longer shows developer-side effect counters or incomplete damage notes.

## Source update 0.106.0 — keyboard and accessibility hardening for results book

- Preserve selected control keyboard focus during live buff updates; move focus to newly selected chapter, restore book scroll, use role=tablist/tab/tabpanel and aria-expanded.
- ArrowLeft/ArrowRight page turning works outside form controls and preserves existing Escape return to portrait.
- Browser E2E and Pages publishing remain to verify.

## Source update 0.105.0 — skill-source inspector bound to actual OS build

- Add searchable, collapsed catalog of current job learnable OS skill variants in the Effects chapter. Include raw catalog cost/timing/requirements in human-readable form, using innate+trained green mastery.
- Do not fake final damage for uncertain `fv1/fv2` kernels; client/server golden vectors still needed for per-hit damage, DOT, target resistance and triggered effects.
- Preserve portrait-first book and compact navigational layout.

## Source update 0.104.0 — item effect coverage and conditional procs disclosure

- Provide per-build counts of calculated, preview-only, conditional, unsupported and grade-gated EP effects across equipped items/Souls/Forth.
- Show the unresolved source item names under an optional collapsed disclosure in the Effects book chapter, keep the Summary visually minimal.
- Next: implement server-grounded trigger dependencies, skill-level target formulas and exact overlapping aura/set effects, then validate D1.

## Source update 0.103.0 — structured condition/status resistances in Defense

- Apply OS `EP_IMMUNE_*` grade-gated item/Soul/Forth resistances to explicitly named condition categories, including body/mental base protections, and `EP_CRITICAL_REGIST` to the incoming critical modifier. Render in the same Defense chapter.
- Future: race/class and active skill immunities, conditional casts and server-side vulnerability/status application checks.

## Source update 0.102.0 — direct healing spells from Remaked

- Derive First Aid/Heal/Healing Aura/Sanctuary/Restoration directly from Legacy `Calc()` formulas. Include level, INT, SPI, Benevolence trained+innate mastery, selected skill healing rate and Cleric level 50 specialization.
- Show all five in Recovery chapter, distinguish theoretical/unavailable skills and per-period Restoration. Leave game-server exact mastery/unlock and per-target casting mechanics pending.

## Source update 0.101.0 — historical Remaked gemstone evidence and source-labeled output

- Port original gem-vs-refinement matrix for physical elemental weapon auras, magic weapon aura and armor elements including multi-resistance Light and Charm from Dark; keep separate from modern OS attack and resistances until verified on server.
- Wire existing saved `state.gems` via equipment refinement keys to `gemstonePreview` and the Effects chapter. Exclude unique rainbow weapon exceptions, no false certainty.
- Next: current OS gemstone server rules, proc caps and exact unique item ID conditions; full skill-level effect formulas and D1/Pages test.

## Source update 0.100.0 — consolidated portrait results book

- The center hero portrait now opens an accessible six-chapter results book in the same area, with keyboard, arrow navigation, Escape, and result summary without duplicate computations.
- Buffs become an independently navigable chapter using the existing Origin setters, including guild, honor, recovery and conditional skills gated against OS class/level and shield.
- The prior equipment layout and portrait aspect remain unchanged. Pending: live browser E2E, animated flip QA, fuller skills/items/set/gemstone source parity and D1 checks.

## Source update 0.99.0 — Legacy natural recovery and skill healing

- Add historic `Calc('LPRec')` = floor(current max HP/35)+floor(VIT/3) and `MPRec` = floor(current max MP/25)+floor(SPI/3), separate from previously implemented regeneration *speed* indices. No invented conversion to per-second or seated recovery amounts.
- Add `Calc('LPSkill')` 100% + Honor2 10% plus OS `EP_CAST_HEAL_LIFE_SCALE` with grade-aware Souls and Forth. This is independent from Potion effects.
- Track `EP_HEAL_TIME_SCALE` MP regen rate and `EP_SKILL_DELAY_FIN` distinct from cast/cooldown indices. Full class effects, all per-skill damage/healing, D1 and browser E2E remain open.

## Source update 0.98.0 — locale-safe equipment and additional typed combat contributions

- Eliminate localized-name checks in MATK, switch historical Iron Staff/Might Staff/Cursed Rod exceptions to OS IDs 2802/2812/2841. Armor enhancement checks the exact empty-name sentinel only, not localized hyphenated item names.
- DEF now includes item/Soul Forth `EP_ARMORCLASS_SCALE` per independent ceil of base armor total, in addition to armor AC, refinement, flat DEF, Honor and selected active skills.
- Track source-backed move speed, skill delay, cast interruption, back attack rate and elemental magic damage effects separately, with explicit warning about overlap between generic wand/staff historic bonus and OS magic equipment effects.
- Remaining: exact server reconciliation for overlapping MATK effects, all active/passive skills, gem-specific enhancement, conditional procs and full D1/Pages E2E.

## Source update 0.97.0 — current OS active-skill combat effects and protected opt-in controls

- Implement `320001001 War Cry` (Gladiator family Lv28+, +10/+20% attack), `100052001 Raging Soul` (Gladiator family Lv35+, +30% ATK/−60% DEF), `100053001 Shieldbearer` (Knight family Lv35+ with equipped shield, **OS** −20% ATK/+40% DEF), `100051001 Lunge` (Warrior line Lv18+ +15 speed index), all opt-in and gated.
- Per Remaked historical source, Shieldbearer used −30%/+60%; this is **not** what current OS EP records specify, so current OS rate takes priority. Guild Arouse tiers also wired for ATK and MATK.
- New collapsed Origin controls, shared-build validation and contribution lines in Attack/Defense. Extend test coverage for jobs, level gates, shield dependence and buff conditions; still no complete active-skill runtime for every skill or live-game golden vectors.

## Source update 0.96.0 — full ID-safe audit of 205 approved Remaked RU skill labels

- Source exact 205 approved `game.ru.skill_entry.*` names cross-referenced against current OS 569 skills by normalized Russian name plus branch, with explicit human-readable resolution for five recognized abbreviations and flagged historical branch shifts. Store full 205-row, ID-indexed crosswalk and count statuses.
- At runtime, apply approved RU names only to verified IDs, keep EN translation and D1 canonical data unchanged. Multiple OS skill revisions sharing an official name are explicitly attached to the same approved Legacy entry.
- Next check: 205 approved skill descriptions against full OS client text; any effect calculations per skill must account for level, mastery and actual opt-in buff before inclusion in character totals. Still missing complete skill/state effects and current-server golden vectors.

## Source update 0.95.0 — Remaked armor grade / OS Forth and grouped skill passives

- Shield/helmet/body/gloves/legs/feet: per-item floor(1.5×enhancement) from archived `js/equip.js`, not weaponPlus or forging probability. Per-item base AC, Forth armor effects, Soul effects, Honor are distinct.
- Current OS itemForth 162 item-ID grade snapshots takes precedence over descriptive refinement parser; intrinsic effects still apply, and imported builds are unchanged.
- Melee, technique and magic mastery passives from innate + trained green branch Adeptness; MATK INT breakpoint table; attack position/cooldown/basic critical resistance from Remaked Legacy. Real-current-server parity still needs golden character vectors and conditional effects.
- Next: entire 205-name Remaked approved skill entries match to exact OS skill ID, more Soul and active combat abilities, comprehensive itemForth cross-check and all-user browser E2E.

## Source update 0.94.0 — approved Remaked RU Honor title labels

- Compare all 13 Honor title IDs against `Pandora-Saga-Simulator-remaked/localization/approved-translations.v1.json`, `game.ru['calculator.honor.0'..'calculator.honor.12']`. Replace paraphrased UI labels with exact approved Russian names; keep numeric IDs/effects/shared saved-state stable.
- Add regression ensuring all thirteen identities, exclusivity and direct Honor damage/defense/accuracy effects remain unchanged. English title names are not overwritten by unverified translations.
- Broader full skill names, item attributes, armor refinement curves, conditionals, cloud D1, icon mirror and end-to-end browser tests still need independent implementation/verification.

## Source update 0.93.0 — attack and casting speed indices, MP consumption

- From Remaked Legacy `ATKSPD`: index 100 + 3floor(AGI/10) + 3floor(AGI/20); explicit current OS gear/Soul `EP_ATTACKINTERVAL_SCALE`, honoring Soul min/max enhancement.
- From `CastSPD`: starting index 100+5floor(DEX/10); actual spell cast times excluded. From `ReduceMP`: base remaining cost 100-floor(INT²/1000); selected Elf racial Harmony skill ID 900020001 -15 and equipped `EP_RACE_MANA_COSTCUT` bonuses stack, source-check required for enhancement-dependent zero-valued Soul descriptions.
- Show partial speed indices in Attack and percent remaining mana consumption in Effects, with explicit caveats. Add six runtime formula regressions; full Node suite, D1, browser, icon mirror, full passive effects and armor refinement remain unverified.

## Source update 0.92.0 — original transparent PS favicon and direct equipment attack effects

