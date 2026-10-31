# Pandora Saga Build Studio — implementation roadmap

**Updated:** 2026-10-31 · **Latest source release:** 0.140.0 (`2026.10.31.140`), browser and Worker deployment partially verified  
**Source branch:** `bonaqu_projects` · **Desktop-first:** 1920×1080, 2560×1440, 3840×2160 · responsive mobile

This is a durable, evidence-led work plan. A GitHub Pages deploy proves assets were published, **not** that a feature passes real-user browser flows, actual Cloudflare Worker deploy, or game-calculation parity.

## Source update 0.117.0 — current OS-backed combat buffs in the hero book

- Four combat toggles use actual OS skill IDs 100051001, 320001001, 100052001 and 100053001, respecting record charLevel, class gates and EP skill effect values. The public app always supplies a skill catalog, including an empty one during loading, so unavailable source data cannot enable an old saved toggle.
- Attack, defense and speed are calculated from the source numeric fields. The hero book reuses exactly the same ability gate, displays the original skill artwork and values, and explains a missing class, level or shield.
- New test vectors exercise four source skills, changing skill values, incomplete source rows, unavailable skills and DOM checkbox interaction.
- Pending: full Node test run, actual browser and Worker/D1 deployment checks, additional verified active skill mechanics.

## Source update 0.118.0 — complete Remaked formula inventory and broader calculation parity

- [x] Inventory all 178 Legacy switch cases, their 143 distinct keys and exact source lines. [Full source coverage matrix](docs/REMAKED_FORMULA_INVENTORY.md) and pinned [machine-readable case index](data/remaked/legacy-calc-cases.v1.json). This does NOT mean all formulas have been ported.
- [x] Port eleven Remaked support-skill magnitude formulas as read-only, source-backed predictions with trained blessing, hymn and alchemy masteries. Display them in the hero's Buffs chapter without activating effects.
- [x] Integrate Remaked armor gemstone elemental resistances into actual defense figures exactly once; keep unverified elemental damage packet effects separate.
- [x] Port fourteen additional source-backed equipment EP mappings, connecting casting speed, mana recovery speed, cooldown, incoming physical/magic damage, reflect, aura bonus and debuff modifiers to the relevant result pages.
- [x] Add regression fixtures for source skill formulas, gemstone +7/+5, minimum refinement gates, fourteen equipment effects and source-audit completeness.
- [ ] Complete remaining 75 not-yet-ported unique Legacy keys and full conditional behaviors. Of other keys, 43 are still only partial, 10 read-only skill previews and 15 base/previews. No current OS live gameplay equivalence is claimed.
- [ ] Check feature-complete browser QA, all Node tests, and exact active game-server outcomes; resolve OS divergences only on confirmed evidence, preserving equivalent Remaked formulas.

## Source update 0.119.0 — wind skills with verified OS identities

- [x] Wind Assist «Помощь ветра»: current OS skill 260006001, Ascetic/Monk/Exorcist, level 28, +15 flat Dodge plus +15% base, combined via exact Remaked `floor(15 + baseDodge×0.15)`.
- [x] Wind Blessing «Благословение ветра»: current OS skill 320004001, Archer/Sniper/Predator, level 28, +40 movement speed from source EP_MOVESPEED_SCALE.
- [x] Both skills are opt-in, class/level gated, disabled on missing or incomplete catalog data, saved with character builds, and displayed in the hero book with official skill icons and source bonuses.
- [x] Regression vectors cover the source IDs, level 27/28 threshold, incorrect classes, altered/missing effects, and current book inputs.
- [ ] Extend the same verified skill-identity approach to remaining passive and active effects, with full tests of related states and real OS gameplay.

## Source update 0.120.0 — verified OS cap and mastery-accurate combat gating

- [x] Official OS cap is **level 45** (announcement 2026-10-03); matching `data/os/tables.json` `levelCap:45`. Corrected fresh builds, level input limits, labels, restored builds and shared-link active state with a human-readable legacy migration notice. Original library entries remain untouched.
- [x] Enforced current OS skill 100051001 («Рывок») `weaponUse` constraints. Its +15 speed bonus no longer activates with an incompatible bow/crossbow, while bare-hand and allowed weapon types remain valid. Book and calculator use the same constraint.
- [x] Ported Remaked `ACC` «Сосредоточенность» +100 using OS skill ID 100054001, class gate and `slash` mastered-green threshold 26. It is opt-in, persists in builds/links, fails closed if an OS effect/prerequisite is missing, and is shown in the hero book.
- [x] Corrected player-facing outgoing versus incoming critical damage, and removed a misleading claim that the already-buffed attack total excluded active bonuses.
- [x] Added test cases for level cap, Lunge weapon kinds, Concentration threshold 25/26, data drift, saved-state selection and precise critical labels. Manually evaluated **42 isolated test callbacks** across eight relevant files in a mock runner; these are not a full Node/browser suite.
- [ ] [OS server check protocol](docs/OS_LIVE_PARITY_CHECKS.md) for unresolved percentage rounding, item procs, gemstones, stance and buff lifecycle. Confirm only from current game/client evidence.
- [ ] Continue the [143-key Remaked formula inventory](docs/REMAKED_FORMULA_INVENTORY.md), with complete item sets, active/passive effects and final combat result chains; **full parity not yet achieved**.

## Source update 0.121.0 — old-build allocation safety at the actual OS level cap

- [x] A saved character originating from the old level-50/55 UI may contain more blue/green skill points or attribute points than current level-45 OS permits. After cap adjustment, detect both budgets using the existing Remaked point-cost engine and current OS ability point table.
- [x] Invalid distribution does not silently shed points from the user's draft or library. The hero can be reallocated, while the Book/Origin calculation refuses to label illegal results as valid; a short player-facing notice explains which pool needs attention.
- [x] Added direct regression cases for legal level-45, excess stats, excess trained skills, malformed allocations and UI warning presence. Recorded source validation without any login or database mutation.
- [ ] Continue full Remaked formula port and current OS gameplay checks using the [source inventory](docs/REMAKED_FORMULA_INVENTORY.md) and [live test protocol](docs/OS_LIVE_PARITY_CHECKS.md).

## Permanent planning rule — v0.122.0

**Build Studio supports planning for game levels 1–55**, including levels 50 and 55, even while the **current OS server temporarily caps play at 45**. The current server cap in `data/os/tables.json` is truthful metadata, **not** the studio's limit. NEVER clamp, discard, refuse calculations for, or hide builds, gear, points, skill previews, or saved/shareable characters for levels 46–55 merely because the current server cap is lower. This is a standing product requirement for future patches.

- [x] Restore level-55 range, original level-50 default, no auto-migration/clamping or invalidation of future builds. Remove extra level-cap notices. Keep future armor: Крепкий шлем 51 / 11023, Доспех тьмы 48 / 12073, Штаны тени 48 / 13052 and 36 other source-listed items above 45.
- [x] Restore Remaked attribute budgets at levels 50 (504) and 55 (544), preserve all saved green/blue mastery and item selections.
- [x] Implement seven elemental aura source branches from executed Remaked `Calc('DAMAura'..'DAMDark')`: weapon gem aura, compatible flat aura effects from equipment, percent modifier and separate per-element ceiling. Link results to the hero book without inventing server damage packets.
- [x] Implement six Remaked `MATKFire`..`MATKDark` elemental magic bonus fields with exactly one honor title's source-backed +5; show them in the attack book. Keep global staff magic separate from elemental bonuses.
- [x] Add tests for future levels/items, actual OS Priest Earring +2 aura and level-55 combat, percentage rounding, honor exclusivity and player-view output.
- [ ] Continue remaining Remaked effects and conditional combat math, preserving current OS overrides only for verified differences, not temporary server progression limits.

## Source update 0.123.0 — city speed and grade-aware defense effects

- [x] Corrected `MoveSPD` Remaked normal versus town indexes: `EP_RESTMAP_MOVESPEED_SCALE` from OS items affects *only town movement*, not running speed in the world. Actual source: Плащ новичка / Beginner Cloak ID 18073, +15. The hero book presents the separate town speed when present; general active buffs and gear stack once.
- [x] Test real OS `EP_BLOCK_BREAK_RESIST` from Боевые башмаки ID 15077 (block-break resistance +1).
- [x] Test real OS `EP_ONDAMAGE_REFLECTION` from Душа зеркала ID 103001: +3 until improvement +7, +5 from +8 through +10; no unconditional double-counting and no fictitious physical-defense increase.
- [x] Recognize `Blocking`, `Reflection`, `Gdebuff` as *partial* in the formula inventory based on existing source-backed secondary effect mappings. They are **not** complete simulations of the relevant combat or debuff success paths.
- [x] Isolated test vectors for separated 55-level town speed and refinement threshold; developer-side checks are not a full Node/browser/game-client acceptance test.
- [ ] Continue the remaining 59 not-yet-ported Legacy identities, 59 partial formulas, ten support-skill read-only previews, and 15 base previews; high-level 50/55 calculations remain an explicit studio feature.

## Source update 0.124.0 — current OS unison bonuses integrated into final stats

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

- Commit the generated 96×96 indexed-transparent gold/blue PS art as a small self-hosted PNG, connect favicon/apple-touch with current cache key. Preserve independently editable header logo. Add offline PNG signature/size/tRNS and HTML cache-key tests.
- Increase partial combat coverage for current OS equipment structured flat `EP_DAMAGERATE_CONST` / `EP_SKILL_EQUIP_DAMAGERATE`, percent `EP_DAMAGERATE_SCALE`, percent accuracy `EP_TOHIT_SCALE`. Match Legacy percent rounding per effect. Grade-gated Souls remain gated, unnamed unstructured skills/set effects excluded.
- Still pending: complete skills/passives, armor enhancement table confirmed against server, all item conditions, full RU terms reconciliation, original OS icons, D1 deployment and actual browser QA.

## Source update 0.91.0 — partial equipped armor DEF and resilience of HP/MP

- Sum OS equipped item AC only, plus `EP_ARMORCLASS_CONST` from grade-qualified item/Soul effects and direct Honor 11 +5 (Remaked `Calc('DEF')`); do not double count armor from Soul metadata or assume armor refinement multiplier. Expose a breakdown in Defense tab.
- Treat missing OS weapon improvement table as an **unavailable weapon attack**, not a reason to make the character HP/MP or other defensive/combat subtotals disappear. Test null-grade and grade-gate cases.
- Remaked skill buffs, remaining class passives, armor enhancement scaling, full game-server DEF, complete naming audit, local icon library, D1 and browser/page verification remain outstanding.

## Source update 0.90.0 — source-backed partial offense and stale test fixes

- Connect source-mapped weapon baseline ATK from Remaked Legacy: floor(STR/2), weapon W, OS weaponPlus ratio/flat per refinement and Legacy STR breakpoints; known Honor (fire title) floor bonus. Show as a partial figure, not full current-server attack. Unknown active buffs, weapon-class Souls, sets and conditional skills remain excluded.
- Add basic accuracy (level+DEX), AGI stepped dodge, critical chance (1+floor(DEX/10)), confirmed equipped flat EP codes and direct Honor modifiers. The Myrine current OS critical racial passive +5 differs from historic Remaked +2; **OS skill metadata wins**. Her +10% accuracy and +5% dodge are shown separately until rounding/stacking parity is verified.
- In central stage Attack tab show actual partial totals with per-source disclosure. Extend source-backed tests and repair outdated stage assertions that still expected 2026-10-30 or removed interface placeholder text. Full npm test/Pages browser checks still need a Node/browser runtime.
- Next: remaining warrior/archer passives, active buffs, complete DEF, cast/attack speed, conditional equipment effects, icon mirroring, D1 connectivity, manual RU terminology audit and visual QA.

## Source update 0.89.0 — innate + trained green mastery parity

- Confirmed Legacy `Status.Skill[i][0]` innate Adeptness is nonzero and must be included alongside `[1]` trained Adeptness. Current OS jobInit base-class branch starts match source: Warrior Melee 18, Acolyte Prayer 15. Skill Potential/blue points are not counted twice.
- Correct potion healing passive and Priest/Cleric/Enchanter innate Inspiration SPI bonus; new tests preserve formulas. Remaining full combat stats, complete active/passive effects, icon library, broader RU terminology reconciliation, D1 verification and browser `npm test` still open.

## Source update 0.88.0 — resistance and guild recovery source preview

- Port conservative `RES*` base terms from Remaked: current derived VIT/SPI resistance to physical and mental states, selected Honor paths and explicitly chosen Human/Elf/Enkidu/Lapin race passives, plus confirmed OS item/Soul elemental effects. Keep partial-combat disclaimer; do not claim complete attack/defense or current-server parity.
- Port three independently selectable guild regeneration `SelBuffClan_3,4,8` branches with Remaked `LPRecSPD/MPRecSPD` indices and original integer tier values. Recovery indices are NOT HP/MP per tick. Expose in collapsed Origin controls and defense attribute cards; validate and persist in shared builds.
- Regression fixtures added; complete `npm test`, Pages visual checks, live Worker/D1, remaining skill effects/sets, icon library, and full attack/defense formulas are still open.

## Source update 0.87.0 — Legacy POT parity and approved racial terminology

- Port third human racial passive «Знахарство» (+15%) and trained green Melee group +10 per 10 at level 12+ for the warrior lineage; recalculate when race passive, level or mastery changes. These cover direct Remaked Legacy POT triggers; current OS extras need live-game comparison.
- Source verified RU labels for 18 exactly-mapped racial passive skill IDs. Other skill names remain untouched until independently matched with client names and Remaked; no machine translation or D1 rewrite.
- Added `remaked-potion-masteries.test.mjs` and effect breakdown UI. Full npm test, browser E2E, Pages deployment, Worker/D1 live verification, icons and remaining combat formulas are **not** considered complete.
- Next major batch: source mapping of active/passive skills, guild recovery branches, weapon attack/defense and elemental resistances, original icon library, and UI verification without GitHub Actions.

## Source update 0.86.0 — exclusive Honor and verified potion previews

- Port exclusive 13 Remaked Honor titles from archived `js/ini.js`, executing direct bonuses from `js/calc.js` without inventing derived combat totals. Honor choice RU/EN replaces independent bool UI; old Honor curiosity saves migrate by fallback.
- Potion restoration: base `100 + floor(VIT²*2/1000)`; equipped `EP_MASTERY_POTION` Souls, `Flag Honor=11` and `Flag 30_0` Jo-eun rune all add correctly. Skill/profession recovery bonus remains pending exact class/skill mapping.
- Port Remaked Modern 4.23's 14 potion preview positions, including 10 confirmed current item identities and 4 historical positions hidden from current item lists. Apply fixed/percentage floor/ceil order only after the player opts in; no implicit toggles.
- Keep nested tabs compact, apply RU/EN names, refresh Origin and active attribute card after buff changes, persist and validate selected Honor and potion settings in shared builds.
- 41 isolated regressions from 7 suites pass, covering 13-title identity, VIT→POT, Souls/Jo-eun/«Крепкое тело», current-only previews, opt-in, legacy migrations and shared links. Node-wide `npm test` and actual browser acceptance remain unverified.
- Further unfinished scope is in `docs/REMAKED_CALCULATOR_PORT.md`: potion profession and mastery bonus, exact remaining combat stats and skill effects, guild branches, icon completeness, D1 live verification, wiki, responsiveness and full browser QA.

## Source update 0.85.0 — confirmed Remaked attribute modifiers

- Owner confirms Remaked calculations for abilities, potions, boosts, guild, honor and gear as the working functional reference. Keep their historical behavior while using current OS catalog keys and modern UX.
- Source-port Remaked `SelBuffClan_9` (guild +N to all six), `Flag.Honor==1` (+1 to all six), and `Flag 14_9/InBuff_1` (Proelium +floor(power/10) to STR/AGI/INT). Apply before HP/MP and do not charge allocation points.
- Include compact nested Origin settings, local persistence, and strictly validated sharing of `attributeBuffs`; leave older builds off by default.
- New direct calculation tests (6) and shared-state regression tests (2 new) pass alongside existing HP/MP, stage and buff tests (25 related checks in isolated harness).
- See `docs/REMAKED_CALCULATOR_PORT.md` for exact source mappings and **open** transfer tasks: additional active/passive skills, potion effectiveness, full Honor list, guild branches, all special boosts, combat/resistances and current-server golden vectors.
- Do not claim total game parity or Pages deployment until end-to-end checks. Continue previous D1/wiki/icon/UX backlog without removing it.

## Source update 0.84.0 — finish HP/MP sharing and cache-safe publication

- Complete 0.83 feature batch and publish new asset cache keys to include the subsequent shared-build sanitizer fix. Selected guild levels and Life Sign survive clean export/import; invalid values default to off.
- New `tests/vitals-shared-build.test.mjs` verifies enabled settings, legacy defaults and malicious/invalid incoming values.
- Source and behavior validation performed in isolated JS harness. Actual `npm test` and browser acceptance, Pages deployment and live D1 require verification and are **not** asserted.
- The full missing effect list remains in `docs/HP_MP_COVERAGE.md`; need game-client reference vectors for complete parity, then address remaining icon and D1/wiki/scrolling backlog.

## Source update 0.83.0 — HP/MP effect parity + responsive portrait separation

- Base HP/MP: use Pandora Saga OS class coefficients and integer-cents truncation per Remaked Modern `current-vitals.js`. Preserve existing class/race/allocated values, inventory and Soul state.
- Item/Soul effect records now apply flat HP/MP and separately floored base-derived percentage HP/MP. Structured Soul grade filters remain in place.
- Apply explicit OS item refinement descriptions for HP/MP/VIT/SPI per-N level and +N thresholds when unambiguous. No guessed unsupported enhancement or set mechanics.
- Add optional, independently chosen guild HP and guild MP buffs 0–6 and Life Sign; never infer these buffs from the name of the guild. No data migration or D1 mutation needed; existing saved build stats remain intact.
- Fully visible hero image `#hero` is shorter at desktop and mobile widths. Distinguish the compact race-selection portrait in Origin from the equipped hero presentation via labels, background and spacing at 390/790/1200px.
- Numeric reference tests cover Cleric 45 baseline 3145/1279, High Soul +SPI then +8% MP, Soul and equipment modifiers, +6/+7 refinement, separate guild buffs and Life Sign. UI/configuration and CSS regressions added.
- **Still not complete:** user expects all HP/MP impacts. Requires source-backed full sets, every conditional passive/active ability, server event/group buffs, nonstandard enhancements, game-client golden vectors across races and classes. See `docs/HP_MP_COVERAGE.md`. Do not claim accurate final server totals until parity coverage is proven.
- Full `npm test` and browser visual checks are not yet confirmed; GitHub Actions not run. Keep all historical roadmap workstreams (D1, encyclopedia, icons, sharing, scroll and layout UX).

## Source update 0.82.0 — vitals, class-selection continuity and Origin height

- Display calculated HP and MP as plain integer totals in larger Origin cards without decorative symbols. Do not suggest these are confirmed server totals: the current `PandoraOSCalculator.base()` returns `verified:false` and excludes conditionals, percentages, sets, skills and buffs. Exact OS parity needs authoritative formula and effect tests.
- Show current chosen specialization in class-wizard heading and on every ancestor direction. Selecting Back only changes `jobPathKey`; `state.job` stays unchanged. Prevent truncation by wrapping long specialization names in narrow left panels.
- On desktop, observe the central portrait stage and set the left panel's minimum height to its actual rendered height; on mobile, drop the forced height. Maintain a single natural page scrollbar.
- Race hint now says «Выбери расу».
- Added `tests/origin-vitals-specialization.test.mjs` (5 checks); updated older compact-workbench expectations. 28 checks passed in isolated JS/DOM regression harness (5 suites). GitHub Pages browser acceptance is still required.
- All previous long-term workstreams remain: D1/Worker live publish verification, original icon library, game formula parity, wiki, shared builds, user-facing scrolling and mobile polish.

## Source update 0.81.0 — remove redundant introduction, keep editor access

- No landing intro: the workbench follows header and status immediately, and a screen-reader-only H1 retains page semantics without consuming visible space.
- The admin-only `authState` indicator was moved into `header-actions`; the existing owner tools, D1 publishing and edit overrides remain accessible. No database writes or credentials were involved.
- Catalog status: routine success now stays in the footer, while actual catalog load failure is shown in the top notice. The previous site.title/subtitle override keys remain stored for backward compatibility even though that obsolete intro is no longer rendered.
- Top margin reduced to let the portrait and two side panels be the first content users see. Unused intro desktop/mobile styles removed.
- Targeted tests: new workbench-without-intro test (4) + earlier connected regression suites (19) pass in isolated JavaScript/DOM harness. Browser validation remains user-owned.
- All earlier roadmap issues (Pages deployment, D1/Worker, icons, game stat parity, encyclopedia, builder sharing, scrolling and responsive QA) remain open; nothing is silently considered complete.

## Source update 0.80.0 — slider/portrait symmetry/HUD removal

- Remove all visual top HUD markup and unused game HUD CSS. No experience indicator and no placeholder hero name above the workbench.
- Show preliminary HP/MP only in **Origin → Characteristics**, alongside the existing character level control. Keep persisted character name and profile data unchanged.
- Replace skill threshold input-overlapping buttons with thin passive ticks. Every source threshold remains represented independently, all pointer and keyboard allocation remains owned by the range. A collapsed-by-default native details list beneath the track offers individual skill icons, thresholds and independent selection.
- Force identical slot-local `--studio-slot` values on left/right equipment rails at desktop, tablet and mobile breakpoints; increase image visual size slightly.
- 19 isolated JS/mock DOM checks passed: 13 Hero Path, 4 compact workbench, 2 equipment slot tests. Browser visual QA remains the user's acceptance gate (1920×1080 and 2560×1440, 390px mobile).
- Not complete: actual Cloudflare Worker deployment/D1 connectivity, in-browser scrolling behavior, full game formula parity, original icon set, encyclopedia and shared-build acceptance. Preserve all earlier backlog/issues.

## Source update 0.79.0 — player tooltips, gear badges and connections

- Player item, Soul and wiki descriptions omit technical IDs. IDs remain stable as internal catalog keys, saved IDs, search values and deep-link parameters; owner-authorized admin details may show them.
- Browser-native title is no longer paired with rich equipment/skill previews. Focus can display custom tooltips; rerender dismisses stale item previews.
- Gear slot icon is larger within the available rail width. Refinement grade and Soul count occupy opposite corners; non-socket accessories do not announce pointless `0/0`.
- Ordinary player-facing attribute descriptions omit raw `EP_*` codes and database jargon.
- Worker now reports `features.catalog` in health; missing D1 binding for shares returns 503. No deployment was performed: Cloudflare Worker and existing D1 database must be verified/deployed explicitly, without recreating the database.
- New read-only connectivity CLI: `npm run connection:check` (fast) or `npm run connection:check:full` (all 19 D1 dataset routes). Checks live Pages version, Worker health, CORS GET/OPTIONS, published catalog, D1 migration 0003 and selected datasets. This tool is **not** a completed live check.
- Mock DOM and Worker tests were exercised for tooltip cleanup, ID privacy, 14 equipment slots, badge states, HTTP 503 and CORS; real-browser 1920×1080/2560×1440/mobile and deployed D1 results await owner acceptance.

## Source update 0.78.0 — absolute stats and effective bonuses (browser acceptance pending)

- Origin fields now show **base race + root class + invested points** instead of the investment only. Rapin/SCOUT first level baseline is 3/3/7/7/8/6 in the bundled OS tables.
- The stat input minimum is race/class base, allocated ceiling is 99, and invested level-budget limits still apply. A low-level build cannot request an unaffordable 99.
- Right-side effective total remains separate and may exceed 99 through supported flat item/Soul and known additional modifiers. Unimplemented OS formulae (percent sets / buffs / conditional effects) remain open; do not fabricate them.
- Legacy local builds retain their stored invested-only data. Both origin and secondary stat editor now interpret absolute input and convert to invested points before saving.
- Selecting/removing supported Souls or changing refinement triggers an Origin effective-stat redraw as well as HUD update.
- The DOM and calculation regression tests are present in `tests/origin-absolute-ui.test.mjs` and `tests/attribute-progression.test.mjs`. Real browser/manual validation still required: all six race origins, class switching, 99+ bonus gear/souls, reload, and budget.
- Other backlog categories — layouts, icon mirror, Worker D1, full OS combat parity, wiki and sharing — remain open.

## 0.77.0 — compact Hero Path & release integrity (browser approval pending)

- Group headings show only the total spent, rather than a long list of invested branches.
- Grouped unlock menu displays **each skill's own numeric threshold and class-lock status**. No new combat formulas or claims of confirmed in-game learning.
- `scripts/release-version.mjs` adds local `--check` and version bump; `npm test` includes a release-integrity test. No Actions needed.
- Verification performed in isolated JavaScript/mock DOM and simulated release file system. **Published Pages, viewport appearance, drag touch UX and full Node suite still require acceptance.**
- Do not drop previous UI, D1, Wiki, Soul, combat parity and sharing tasks.

## Source update 0.76.0 (including 0.72.0) — pending visual QA

Desktop center stage height is capped, portrait translateX offsets are removed and the former diamond glyphs were replaced in 0.76 with compact in-track ticks. Pending: confirm with real 1920×1080/2K/4K/mobile screenshots, hit targets, tooltip clipping and published Pages version. Do not mark this visually accepted yet.

### 0.76.0 — release / UX verification required

- Cache-busting refresh now cleans `ps-revision` via History API after receiving fresh HTML; numeric release comparison prevents stale update prompts. Check visible canonical URL after clicking “Обновить”.
- Branch slider uses compact in-track vertical threshold tabs (not diamonds); clustered skills remain individually selectable. `picker` scope error fixed and new unit regression added.
- The native browser tooltip on the entire track is removed. Skill previews use constrained size and panel-aware positioning.
- The following remain **user browser acceptance**, not automatically complete: page publication, drag interaction, popup visibility at 1920×1080/390px, no overlap near red class caps, URL/history on F5, preserved build data.

## Already implemented; do not redo blindly

- 8 selectable portrait variants for 6 races; three Origin tabs (race plus passive / 28-class drill-down wizard / level plus six in-place stats); right-hand skill allocation with class/level gates and skill-unlock markers.
- Portrait-local item, Soul, refinement (+0…+10) and element/type screens; accessory/cloak slots cannot refine. In-panel scroll stays anchored when adjusting the same item; generic site scrollbars share dark styling.
- Wiki runs D1-first, falls back per catalog JSON to the repository, supports full result search with progressive 100-row paging, linked items/NPCs/monsters/chests/drops.
- UI view/session restore no longer forces stale `#wiki/...` after switching tabs.
- HP/MP: OS class coefficients, race/base class + spent attributes, publicly audited half-to-even rounding; supported flat ability and max-life/mana item/Soul effects. Flat source gear/Soul elemental resistance and selected combat bonuses displayed **separately from final stats**.
- Local original image mirror audit, strict WebP/manifest check, package scripts; physical source file transfer is still incomplete.

## Current owner requirements — full outstanding backlog (2026-10-30)

**Rule:** all items below remain open until acceptance evidence exists. Source commits are not the same as deployed code, working UI, OS combat parity or user approval.

| Priority | Feature / acceptance | Current state |
|---|---|---|
| P0 | Hero Path ≥410px on wide desktop, visual focus on center portrait, usable gear slots, no overlapping/overflow | Source changed in 0.50; desktop/mobile browser screenshots and user acceptance pending |
| P0 | One-screen Hero Path: change branch points by dragging, show skill unlocks inside skill progression bar, identify prerequisites/class caps, select skill and see full detail without another page | Potential/growth editor, auto/manual green Adeptness and second in-panel skill gallery in source; keyboard/touch testing, OS learning parity and full-detail audit pending |
| P0 | Origin as sole attribute-spend editor: race+class initial stats, level budget, progressive cost, class caps, no legacy data loss | Initial data/editor done; validate historical points against live OS, test state persistence and UI; remove unreachable duplicate implementation code later |
| P0 | Distinguish invested attribute cap 99 from **effective stat values above 99** from equipment/Souls and future buffs, sets, percentages, grade conditions | Flat item/Soul effects and historical Remaked prayer-Adeptness SPI preview separately shown; live OS verification, percent effects, other skills, sets, auras, buffs and advanced formulas pending |
| P0 | All 14 portrait gear slots; Choose, Properties, Souls with only supported sockets, 1-click gem type/element, enchant grade +0…+10, scroll/focus retention | Updated source; full cross-item interactive/browser testing pending; verify Soul compatibility for belts and every slot |
| P0 | Full game catalogue is browse-only, no duplication of character's worn gear; wiki item type RU/EN, meaningful multiline descriptions and source links | Updated source; full catalog visual/E2E and locale corpus QA pending |
| P0 | Local active build and named library remain intact after F5; multiple builds, save/select/delete with confirmation, comparison; JSON buttons removed | Source updated, local reopen preserves legacy/future fields and dress legwear; real reload and corrupted-storage tests pending |
| P0 | Short public link to one build or up to 30 saved builds, safe prompt and save-current action; no clobber of local builds | Worker API, migration, frontend in repo; deployment, D1 migration, live GET/POST, browser compatibility and abuse protections NOT yet verified |
| P1 | Original icon mirror 1,437 and user-supplied race art with manifest; all relevant wiki/items/skills/souls have authentic icons | Blocked on missing binary icon assets; no placeholder should claim original |
| P1 | D1 complete catalogue, RU/EN, item acquisition from monsters/drops/maps/NPC exchanges/chests, wiki coverage and admin editing | Repository JSON/Worker import already present; live D1 content and status require independent validation |
| P1 | Source-validated 28-class combat math across attributes, Souls, sets, sockets, Forth, refining, all EP_* modifiers, resistance, HP/MP, speed, cast, buffs, prestige and per-class rules | Partial flat ability/HP/MP/bonuses only; full OS parity open; no guessing unsupported calculations |
| P1 | Test/release discipline: full unit suite, 1920/2560/3840/1366/390 viewport E2E, F5/URL import/delete/stock UI, CHANGELOG and rollback | Some static tests updated; end-to-end, complete automated suite and actual deployed state NOT verified |

### Sharing rollout prerequisites

1. Apply `worker/migrations/0003_shares.sql` to the **existing** Cloudflare D1 database using the explicit Wrangler migration command; do not recreate or wipe D1.
2. Deploy updated Worker from `worker/index.js` and validate CORS from the GitHub Pages origin, then test GET/POST with a sample, sharing and reopening in two independent browsers.
3. Confirm load of `#b/<11-char ID>` never silently overwrites another active draft. Check "save current first", "open without saving", "cancel" and library merge. Reject bad IDs, oversized payloads and abuse.
4. Only after this confirmation mark remote sharing as ready. Local build library must work even when Worker is unavailable.

## Priority A — acceptance tests and crashes

- [ ] Visual check for adjusted centered 3-column layout at 1920×1080, 2560×1440, 3840×2160, 1366px and 390px: portrait focus, wide 410–430px Hero Path, nearby equipment slots and no horizontal overflow. Static CSS tests are not browser evidence.


- [ ] Perform 1920×1080 full interaction pass: change Kroll → Human M/F → Elf M/F → Myrine → Dwarf → Enkidu; verify selection state, fixed-only genders and equipment suitability.
- [ ] Reload on every origin tab and with workbench/wiki/inventory open and **closed**; make sure no unexpected tab, hash, modal, focus, or scroll jump.
- [ ] Test gear for all 14 slots: choose/remove, forbidden refinement, +0→+10→+0, gem types/elements, sockets and incompatible souls, dress blocking legs, class/race/level filters, JSON round-trip.
- [ ] Wiki test 8 categories, 100→200→all, RU/EN and ID search, item drops, NPC trade and deep link, fallback when Worker is temporarily unavailable.
- [ ] 1440p/4K/390px visual + keyboard-focus and mobile touch smoke, shared scrollbars, tooltip clipping, right-skill column overflow.
- [ ] Run full `npm test` locally and record test process output; never treat static regex tests as real browser E2E.
- [ ] Verify actual Worker deployed version and D1 status without mutating credentials or existing data.

## Priority B — combat calculations without guesses

- [x] Compare initial stats for all 6 races × 4 base professions against Remaked and OS.
- [x] Integrate archived BPt level budget and SPt next-point cost into both UI editors, without overwriting saved builds.
- [ ] Validate archived attribute budgets and next-point costs against current live OS game rules.


1. Freeze OS version/digest of `classes/items/souls/skills/tables` and current public calculator JS; keep Remaked Legacy engine immutable.
2. Run 28 classes × levels (1,10,20,30,40,45,50,55 where supported) × base/modified attribute vectors; compare public calculator against exact results, rounding and flat/percent stacking.
3. Source-map every known `EP_*` and Soul modifier with responsible owner, stack order, min/max upgrade gate, set membership and duplicate-prevention; unsupported effects must remain visibly unsupported.
4. Verify 148 enhancement families and level milestones, two gemstone families × seven elements and up to +10, plus proc exceptions.
5. Verify attack, defense, resists, crit, hit/dodge, cast/attack speed, ranged reach, potions, mastery, group/guild/honor and passive/active buffs.
6. Add deterministic snapshot parity vectors and release gate. Merge only formulas with confirmed source and fixture coverage.

## Priority C — art catalog ownership

- Run `npm run assets:audit` for accurate existing completeness, `npm run assets:mirror -- --limit=200` on a host permitted to download original game WebP.
- Repeat until complete, commit original binary assets and matching `assets/os-icon-manifest.json`, run `npm run assets:audit:strict`.
- Replace external runtime sprite fallbacks **only after exact original files exist**, with visible missing-image behavior rather than unrelated art.

## Release discipline

Update CHANGELOG.md/README.md, this roadmap and matching GitHub Issues after meaningful work. Prefer one coherent release with tests and an explicit deployment check. Never overwrite existing user builds, live D1, Worker secrets or preserved Legacy formulas. Full browser smoke and live OS parity can remain *pending* when tooling/network is unavailable, but must never be described as passed.

## Verification sources

- Public OS game data and calculator: https://pandorasaga-os.com/#calculator
- Remaked formula audit: https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/docs/CALCULATION_PARITY_AUDIT_2026-10-11.md
- Prior enhancements and effect mapping: https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/modern/enhancement-effects.js
- Current build source and release notes: https://github.com/bonaqu/Pandora-Saga-Build-Studio

## Добавление требований 2026-10-30: зелёное мастерство и расход очков

- [x] Модель разделяет распределённые очки из уровней и фактическое тренировочное мастерство; авто-режим по умолчанию сохраняет обратную совместимость.
- [x] В видимой правой панели свободные, использованные и общие очки; групповая сумма, лимит профессии, точный ввод, зелёная шкала и переключение страниц «Развитие» / «Умения».
- [x] Счётчик потраченных **характеристик** использует только вручную вложенные очки `state.stats`; предметы, души и подтверждаемые пассивные эффекты не становятся покупкой за SPt.
- [x] Сохранение `mastery`/`masteryAuto` локально и в общих билдах; при изменении класса старые сверхлимитные очки можно вернуть без потери полного билда.
- [ ] Проверить точность шкалы тренировочного мастерства для текущего OS, включая начальное зелёное значение каждого класса, правила его увеличения и бонусные мастерства.
- [ ] Провести кросс-проверку текущего OS для пассивки Priest/Cleric/Enchanter «Вдохновение» (СД), т.к. временная модель — по Remaked Legacy, а не по подтверждённому текущему серверу.
- [ ] Реальный пользовательский тест: Загонщик 45 секущий / 42 зелёного, 0 исцеления, очки уровня 45, выбор недоступных и изученных умений, F5 и обмен по ссылке.

### 2026-10-30 · 0.55 — удаление повторных редакторов

- [x] Удалён старый редактор умений из модального окна персонажа (в нём оставались ссылки на удалённую вёрстку `branchValue`).
- [x] Навигация персонажа больше не создаёт дублирующее распределение навыков/характеристик; переходы ведут в главный «Путь героя» и «Происхождение».
- [ ] Проверить визуально оба перехода, циклы закрытия окон, фокус и сохранность активного билда в реальном браузере.

### 2026-10-30 · 0.56 — визуальный разбор очков каждой характеристики
- [x] Под полями всех шести параметров выводятся независимо сумма базы, ручных вложений, эффекты вещей/душ, предварительное отдельное мастерство и итог; видно цену следующего очка по Remaked SPt.
- [ ] Подтвердить актуальность стоимостей SPt и BPt у текущего OS по контрольным игровым данным. До этого ни старые вложения, ни формулы их исторического учёта автоматически не переписывать.

### 2026-10-30 · 0.57 — доступность обновлений и одна шкала
- [x] Убрана отдельная зелёная шкала: синий/золото/зелёный теперь части **одного** трека, в нём двигается ползунок вложений.
- [x] В `sessionStorage` сохраняются выбранная категория, раскрытая ветка, прокрутка правой панели и активная страница.
- [x] Исправлено 4-колоночное сжатие дерева на экранах до 1200px.
- [ ] **P0 Доставка:** подтвердить завершение последнего запуска GitHub Pages со статусом success, затем сравнить публичную `site-version.json` с HEAD. На 18:04 UTC последним успехом был `4d1bbe79`, запуск 0.56 ожидал выполнения, несколько предыдущих отменялись.
- [ ] Проверить пользовательский апдейт без потери положения, 45/42 по единой полосе, скролл/клавиатуру/сенсор на текущей опубликованной странице.

### 2026-10-30 · 0.58 — game-like single bar
- [x] В каждой раскрытой ветке до 90 позиция ползунка обозначает только вложенные очки; зелень поверх вложенных, золото между зеленью и вложениями, синяя остаточная часть до class cap, красный замок выше class cap.
- [x] В основном интерфейсе убраны кнопки ±. Точное ручное значение остаётся доступным для клавиатуры, есть отдельное подтверждение полного сброса только навыков.
- [ ] Проверить отображение замка, пороговых иконок и drag по реальному игровому референсу на мобиле и десктопе.

### 2026-10-30 · 0.59 — пороги без смещения
- [x] Пороговые иконки вдоль единой шкалы 0–90 не меняют координаты при классовом пределе менее 90.
- [ ] Browser E2E: сравнить кликабельные иконки на 8/26/41/54 и красную границу низколимитного класса; особенно ширину 410px и мобильный узкий экран.

### 2026-10-30 · 0.60 — точность полосы и пользовательская непрерывность
- [x] 0.59 успешно опубликована Pages (run 41104934636, GitHub success); 0.60 проверять отдельно.
- [x] Выравнивание заливок и красной границы по той же внутренней ширине, что и input[type=range]. Иконка центрируется на пороге.
- [x] Восстановление фокуса раскрывающей группы/ветки и точных полей навыка при обновлении UI, прокрутки каталога иконок после выбора навыка.
- [x] Миграция старых числовых ключей mastery при загрузке каталога по тому же oldToOS, что и points.
- [ ] Подтвердить в живом браузере F5, клики, клавиатуру и точность делений 8/26/45/55/90 на разных экранах.

### 2026-10-30 · 0.61 — источник требований и карточка умения
- [x] Галерея показывает доступность на основе известного `skills.json`, но не утверждает, будто умение точно выучено игроком.
- [x] При выборе иконки — локальные исходные параметры ОМ/каст/кулдаун/дальность/стихия, требования по вложенным и зелёным очкам, известные EP-функции, переход к своей wiki-статье.
- [x] Клик по иконке порога сбрасывает только поиск/фильтр списка, не стирая билд, и выделяет соответствующее умение.
- [ ] Полная верификация доступности/изучения пассивных и обучаемых умений по live OS и Remaked; UI не должен смешивать разрешённость и факт изучения.

### 2026-10-30 · 0.62 — состояние поиска и фокуса экипировки
- [x] Контролы заточки, типа, стихии и гнёзд имеют устойчивые идентификаторы для возврата фокуса после изменения свойства.
- [x] Поиск по душам хранится в состоянии открытого слота и sessionStorage; после назначения души список не сбрасывается к полному каталогу.
- [x] При выборе нового предметного слота поиск сбрасывается, чтобы старый фильтр не выглядел как отсутствие доступных душ.
- [ ] Реальный браузерный проход выбора вещи +0…+10, типов и стихий, гнёзд 0–3, выбор/извлечение души, табуляция и сенсорные касания.

### 2026-10-30 · 0.63 — реальная блокировка контролов и сворачивание дерева
- [x] В DOM-строителях устранено `disabled="false"` (HTML трактует как true); для всех boolean HTML attrs используются настоящие свойства.
- [x] Бюджет и class caps отвязаны от полной загрузки Wiki/D1, local classes и tables читаются отдельно, неизвестные class caps не подменяются 90.
- [x] Повторное нажатие на группу закрывает её целиком; закрытая группа не открывается снова после F5 или асинхронной загрузки каталога.
- [ ] Выполнить реальный браузерный тест: 45-й уровень 103 свободных, Клирик → Молитва → Милосердие, перетащить 0→10→20, увидеть расход 10/20, выполнить F5; проверить class cap и раскрытие/закрытие при тапе.
- [ ] Проверить disabled/checked boolean во всех других динамических интерфейсных компонентах и отсутствие CSS overlay над range.

### 2026-10-30 · 0.64 — интерактивные регрессионные тесты
- [x] Постоянный `node:test` сценарий на 103 свободных: 0→10→30→0, запрещённый cap0, двойное нажатие на группу и правильное disabled=false.
- [x] Подсказка о drag и клавиатурных стрелках непосредственно в редакторе ветки.
- [ ] Запуск full `npm test` в доступной среде и реальный E2E на опубликованной странице (не только симуляция), контроль мобильного ввода.

### 2026-10-30 · 0.65 — изменения прямо во время прокачки
- [x] Во время `range.input` обновляются итоговая сумма группы, вложенные в ветку очки и зелёное мастерство без перерисовки и обрыва перетаскивания.
- [x] При смене профессии автоматически раскрывается первая ветка с разрешённым лимитом; старые значения не стираются.
- [x] Недоступные по классовому лимиту реальные пороговые умения остаются видны в едином треке и маркируются замком.
- [ ] Провести интерактивный браузерный тест для class switch/drag/milestone popovers, проверить мобильную ширину иконочных порогов.

### 2026-10-30 · 0.66 — предсказуемое открытие развития
- [x] Первую раскрытую категорию определяет максимальная сумма class caps для доступных навыков, а не первый разрешённый пункт в списке.
- [x] Проверена категория по фактическим classes.json для Cleric/Warrior/Mage/Predator.
- [x] Ручной выбор и сворачивание группы не отменяются автоматически.
- [ ] Browser QA на смене профессии с вложенными очками и повторном входе после F5.

### 2026-10-30 · 0.67 — тестирование реальных обработчиков
- [x] Исправлено некорректное `sources.app` в новом регрессионном тесте, выявленное его независимым запуском в V8.
- [x] Функциональный тест действительно вызывает `selectJob` и проверяет неприкосновенность очков/mastery с новой профессией.
- [x] Реальная OS-запись «Раскол» (Рубящий удар, порог 41) проверяется против cap15 Клирика в `milestones`, значение отмечается `locked`.
- [ ] Full `npm test` на Node + визуальный браузерный E2E + публикация 0.67 GitHub Pages.

### 2026-10-30 · 0.68 — очистка интерфейса развития
- [x] Родительская группа при сворачивании закрывает ребёнка и при повторном раскрытии не восстанавливает его, включая F5.
- [x] Компактные маркеры порогов (несколько дорожек), настоящее изображение и описание в hover/focus tooltip.
- [x] Скролл правой панели и дерева передан странице, длинный каталог порционно раскрывается.
- [x] Класс + показатели очков в одном блоке; выбранное умение раскрывает карточку непосредственно над галереей.
- [ ] Настоящий визуальный/browser E2E и проверка тач-раскрытия маркеров.

### 2026-10-30 · 0.69 — устранение лишних UI-строк
- [x] Нет подробных технических записей под редактором каждой базовой характеристики; реальные формулы не затронуты.
- [x] Равные размеры `+`, `−` и ручного поля на desktop/mobile.
- [x] Только вкладка «Души» управляет гнёздами; удалена дублирующая строка в «Свойствах» и лишние кнопки/пояснения.
- [x] Короткая легенда развития; исходные данные и wiki не удалены.
- [ ] Визуально проверить табуляцию, точный размер полей, scroll и состояние выбранных душ в живом браузере.

### 2026-10-30 · 0.70 — осмысленные регрессионные сценарии
- [x] Изменены устаревшие ожидания тестов: повторное открытие группы не восстанавливает ветку, удалены техничные ярлыки.
- [x] Тест порогов на настоящих OS-умениях Клирика: маленькие маркеры без полноразмерных иконок в дереве, hover содержит данные навыков.
- [x] CSS-regression на отсутствие вложенного скролла в правой панели.
- [ ] Прогнать npm test и Playwright в рабочем окружении, уточнить UX смартфона.

### 2026-10-30 · 0.71 — устранение ложного падения теста
- [x] HTML boolean атрибуты проверяются отдельно от обычного `setAttribute`; они не должны ошибочно запрещать aria-label/title.
- [ ] Повторить тесты после изменения, выполнить full `npm test` и browser QA на мобильных и десктопе.


## Release 0.125.0 — new hero and D1 library

- [x] New characters start at level 1 while the planner retains 1–55, including future content above the temporary OS server cap.
- [x] My Builds has inline unsaved-draft Save / Discard / Cancel actions with no modal for New Build. Redundant global sharing removed.
- [x] Added private Cloudflare D1 library migration 0004, Worker API, per-browser secret and local offline copy; old local builds are imported into D1 when online.
- [ ] Apply D1 migration, deploy Worker, validate live sharing and short links, run full npm test and real browser E2E. Continue 59 missing and 59 partial Remaked formula keys.


## 0.126.0 — browser library resilience and automated D1 preparation

- [x] One-click «Новый билд» in the central character stage opens the existing inline unsaved-draft action in My Builds.
- [x] Offline deletions are queued locally and replayed to D1 before cloud-library hydration; a generation guard prevents older GET responses from overwriting edits made during the request.
- [x] Worker creates only the three missing, fixed shared-link schema objects or two private-library schema objects on first use, using idempotent SQL. This never modifies game catalog datasets; schema files remain in GitHub for controlled migration/backup.
- [ ] Confirm actual Worker deployment, D1 auto-setup, successful short-link creation/readback and browser E2E. If D1 DDL is denied, the API continues to report 503 without silently pretending a save worked. Complete remaining Remaked formulas and full npm test.


## 0.127.0 · Source-backed mounted-stat preview

- [x] Remaked `RelHorse` class baseline, riding green mastery and selected Honor shown in hero book without imaginary equipment bonus. Status PARTIAL; server parity unverified.
- [x] Audit: 58 NOT YET PORTED, 60 PARTIAL, 15 BASE/PREVIEW, 10 BUFF PREVIEW; tests for formula, validation and integration added.
- [ ] Continue conditionals, refinement, gear/soul procs, target-dependent damage, complete Node/browser verification and live Cloudflare deployment checks.


## 0.128.0 — individual share actions and D1 lifecycle tests

- [x] A saved build's Share action creates an **inline** short-link and selectable URL with Copy button inside that same build card; Worker/D1 errors render alongside the card instead of opening a blocking browser alert.
- [x] New Node regression suite uses an in-memory D1 adapter to test private save, listing, deleted tombstones, 55-level compatibility, isolation across browser secrets, and malformed input rejection. The existing 0003 public shares remain enabled only when the updated Worker and D1 schema are live.
- [ ] Execute real `npm test` and browser E2E, confirm live Pages 0.128.0 and Worker, verify public share POST/GET and clipboard from a published site, and complete remaining Remaked calculations.


## Source update 0.129.0 — revocable short links and inline deletion

- [x] Every **new** short link is tied in D1 to the owner's saved build, using only a hashed browser key and saved build ID; public GET checks its source's tombstone before returning the snapshot. Deleting the original revokes every associated URL, across recipients, with HTTP 410 and a stable `reason: deleted`.
- [x] Existing anonymous legacy short links without ownership data return 410 `reason: legacy`, rather than pretending they support deletion-based revocation. The schema upgrades in place (no destructive table replacements).
- [x] The server refuses shares without a saved owned build, refuses anonymous share creation, and prevents deleted IDs from being restored by a stale pending PUT. Ownership mapping and snapshot insertion use an atomic D1 batch.
- [x] Opening a dead/old/invalid link shows a compact bottom-right toast (8.5 seconds or OK). Deletion confirmation is inline; an offline deletion honestly warns that links remain active until cloud synchronization.
- [ ] Full `npm test`, live server deployment and real browser end-to-end checking required. Keep all Remaked incomplete formulas, future level 55, visual improvements, icon and catalog backlog open.


## Source update 0.130.0 — saving the active build vs creating a copy

- [x] Opening a library build marks its source ID in the current tab, surviving refresh. Saving changes updates the same library record and D1 row instead of producing accidental duplicate builds.
- [x] «Сохранить копию» explicitly creates a separate build with a new ID. A new clean character or imported public snapshot drops the active-original association.
- [x] Changed names propagate into the saved character snapshot and ongoing draft. Browser quota failures roll back the save and display a user-facing toast.
- [x] Add a visible cloud retry action; a 409 tombstone conflict is not misreported as a generic network outage.
- [ ] Browser/real D1 full acceptance, complete Remaked parity and verified live battle effects are outstanding. Short links retain immutable snapshots when the source build is edited; deletion of the source revokes all its links.


## Source update 0.131.0 — private data scrub on revocation

- [x] Deleting a D1 build now atomically writes its permanent tombstone and scrubs all public shared snapshot payloads belonging to that owner/source ID. The source-link mapping is retained only so GET returns HTTP 410 with the right deletion reason.
- [x] Legacy D1 deployments without `shared_build_sources` continue to support safe library deletion without requiring manual schema changes.
- [x] Restoring the active saved-build ID tolerates blocked sessionStorage (private-browser/storage restrictions) without crashing the entire app.
- [x] Expanded regression coverage to assert that revoked public snapshot bytes are cleared and that another player's link remains available.
- [ ] Confirm live Worker release, actual D1 POST/GET/delete and full browser E2E. Unported Remaked mechanics and OS-specific target-dependent bonuses still need source-backed implementation.


## Source update 0.132.0 — safe switching between saved builds

- [x] When opening a saved library character with unsaved changes in the current workbench, show an inline decision inside that build card: «Сохранить текущий и открыть», «Открыть без сохранения», or «Отмена». No global browser confirm dialog.
- [x] The default open action is immediate when the current draft is already saved or blank. Loading still preserves old/future fields via the existing in-memory clone and merge.
- [x] Add static guard for the choice, save-before-open requirement, and existing-legacy field-preserving restoration.
- [ ] Actual browser acceptance remains necessary, along with Remaked combat parity, Worker lifecycle testing and full npm test.


## Source update 0.133.0 — stale card and offline deletion guard

- [x] When «Save current and open» targets the same saved build, resolve its newest in-memory snapshot after saving; don't reopen a stale card's pre-save version.
- [x] If the browser cannot store a queued offline deletion, still attempt immediate server deletion and explicitly warn when a later retry cannot be guaranteed. Never claim revocation before D1 confirms it.
- [x] Keep all current 1–55 planning, per-build revocable links, D1 migration and Remaked audit in place.
- [ ] Confirm full Node suite, cross-browser/cloud Worker lifecycle, and unimplemented combat/skill effects.


## Source update 0.134.0 — correct saved-build regression expectations

- [x] The share-link and save-workflow tests now require the **current** source of truth (`latest.data` and `latest.id`) instead of the stale card snapshot after Save-and-open.
- [x] Keep existing new-character, D1 revocation, inline UI, legacy field compatibility and release guards unchanged.
- [ ] Run actual full Node suite and browser/Worker E2E; these test-source corrections do not prove the suite passes.


## Source update 0.135.0 — authoritative D1 shared snapshots

- [x] Public short-link POST now derives the character snapshot solely from the saved, owner-authorized D1 record. Untrusted caller-supplied snapshot data cannot be substituted for an unrelated build; the website sends only the saved build ID.
- [x] The 200-build D1 limit counts only active records; permanent deletion tombstones no longer indefinitely exhaust the number of usable library slots.
- [x] Regression assertions cover attempted tampering with shared snapshots. Existing snapshots stay immutable; deletion still revokes all linked IDs and scrubs payloads.
- [ ] Real Worker POST lifecycle, full Node suite, browser E2E and Remaked battle parity remain pending.


## 0.136.0 — source-backed target-dependent Soul reductions

- [x] Six real current OS soul records contribute signed, target-family-specific reductions to the Hero Book defense page; grade gates respected and duplicates not silently combined.
- [x] Five corresponding Remaked keys now PARTIAL; inventory has **53 missing, 65 partial**, 15 base, 10 buff previews. Golem effects remain separate from unverified Remaked Inanimate equivalence.
- [ ] Finish conditional passives/procs, server damage packet, full npm test, browser E2E and responsive UX audits.


## Source update 0.137.0 — on-hit and on-damage equipment/Soul proc previews

- [x] Render source-listed triggered skills for five known ONHIT/ONDAMAGE EP codes in the Hero Book, using exact skill IDs, eligible enhancement ranges and the published OS skill catalog.
- [x] Do not convert procs into deterministic attack statistics. Suppress a conflicting numeric chance when a source description disagrees (Soul 101009: 4% text vs b=5).
- [x] Regression tests cover real proc skills, item-on-damage effects, grade bounds, contradictory chance and missing skills. Remaked coverage remains 53 missing/65 partial/15 base/10 buff previews: no completed damage formula is claimed.
- [ ] Browser E2E, full npm test, exact trigger probabilities and remaining Remaked skills/target damage need verification.


## Source update 0.138.0 — short-link idempotence and revisions

- [x] Sharing an unchanged owned D1 build returns the existing 11-character short ID; repeated clicks no longer burn the daily share quota or create unnecessary duplicate links.
- [x] Once a player updates a saved build, the older short URL remains an immutable snapshot and a new short URL is issued for the new character state. Deleting the original revokes **both** versions and scrubs both snapshots.
- [x] Expanded mocked D1 server regression to cover idempotent sharing, different revisions, malicious client payloads, and multi-version revocation.
- [ ] Run live browser link-copy flow, live D1 write/delete acceptance and complete Node test suite independently.


## Source update 0.139.0 — complete private library listing

- [x] D1 library GET no longer truncates the result to the newest 250 rows, which could hide older active builds when numerous permanent deletion tombstones were newer.
- [x] Active rows are ordered before tombstones; all deletion IDs remain represented to prevent an old offline cache from treating deleted builds as new unsynced characters.
- [x] Regression guard covers one original level-55 build and 275 newer tombstones without dropping that active record.
- [ ] Consider paged sync and compact tombstone records for extremely large historical libraries; verify full Node suite, real D1 E2E and browser acceptance.


## Source update 0.140.0 — faithful D1 test doubles

- [x] The mocked D1 query layer now supports both read shapes used by the public share lifecycle: the source snapshot and the source deletion status. Revoked links can be checked for their actual HTTP 410 response rather than a spurious mock-only 500.
- [x] Library lifecycle mocks now distinguish the existing private_builds table from an absent shared_build_sources table. The offline/legacy delete path no longer attempts an unsupported fake D1 batch.
- [x] Independently confirmed the SQLite ordering with one active level-55 build and 300 tombstones: all 301 rows remain available with the active build first.
- [ ] Full Node npm test and deployed browser E2E are still required; updating test doubles does not constitute full-suite success.
