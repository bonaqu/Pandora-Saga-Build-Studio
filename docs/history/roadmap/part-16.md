# История ROADMAP — часть 16 из 20

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

- Base HP/MP: use current game server class coefficients and integer-cents truncation per Remaked Modern `current-vitals.js`. Preserve existing class/race/allocated values, inventory and Soul state.
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

