# История ROADMAP — часть 14 из 20

- Initial Chromium run reached the test but timed out on a combined race/skill-branch condition. Replace the unrelated branch requirement with the race/portrait readiness condition; report DOM counts, catalog status, JavaScript errors and failed local requests if boot still fails.
- Continue to require the full desktop interaction scenario and genuine successful browser job before claiming E2E parity.

## Source update 0.159.0 — real Chromium smoke coverage

- Add isolated GitHub Actions Playwright Chromium smoke: live DOM interactions for portrait-only book, book tab/keyboard navigation, max-55 range persistence, new-hero level-1 reset and explicit unsaved-draft choice.
- Keep the full Node regression suite and release guard in the independent fast CI job; browser job never touches Cloudflare production or credentials.
- Browser smoke status remains pending until actual GitHub Actions result is observed; local verification does not prove Worker/D1 availability.

## Source update 0.158.0 — verified share content

- Verify a share not merely exists but contains the exact saved build snapshot returned by the Worker; prevent accidental false-positive URL publication on stale/wrong-level equipment or mastery.
- Guard this behavior with executable runtime tests, including future level-55 equipment, incorrect Soul/mastery values, incompatible schemas and invalid payloads.
- Improve the clipboard failure hint for touch/mobile browsers while keeping Ctrl+C as a desktop fallback.

## Source update 0.157.0 — book, cloud library and RU source regressions

- Replace test-only dependencies on removed duplicate Results controls, inline-skill list, obsolete user notices and old rune toggles with assertions against the single portrait book entry and current Hero Path.
- Preserve the historical rune serialization contract in shared builds without adding any live UI switch or unsupported game effect.
- Exercise full Node suite in GitHub Actions; success will be confirmed after the workflow ends.

## Source update 0.156.0 — repair current test harness and remove stale UI assumptions

- Restore runnable compact-workbench test, extend fake DOM attribute support, and align the documented OS MP cents-floor example.
- Update existing regression contracts to current skill milestones, Origin absolute-stat display, source-backed status immunity and keyboard behavior; no hidden player diagnostics are reintroduced.
- Full GitHub Actions tests and live browser/Worker validation remain separate and are not marked complete unless their runs succeed.

## Source update 0.155.0 — restore broken unit harnesses

- Rebuild a duplicated/corrupted Origin test source and inject the now-required potion and attribute node mock dependencies.
- Fix a broken 143-key inventory matching expression; align two legacy numeric assertions with the actual explicitly documented tenth-floor/mass mastery rounding.
- Correct the new level 55 guard to inspect the real skill budget module instead of unrelated general rules. Remaining CI failures will be investigated rather than suppressed.

## Source update 0.154.0 — automated test gate and share/level invariants

- Add GitHub Actions CI on pushes and pull requests against the source branch. Run the built-in Node 22 suite and the version-consistency release guard without secrets, package installation, or D1 mutations.
- Add regression guards for verified shared-link delivery, accessible copy fallback, level-1 new characters, and planning through level 55 despite current OS server cap 45.
- Live browser/Cloudflare acceptance remains separate from Node tests. An automation run is required before the release can be claimed test-green.

## Source update 0.117.0 — current OS-backed combat buffs in the hero book

- Four combat toggles use actual OS skill IDs 100051001, 320001001, 100052001 and 100053001, respecting record charLevel, class gates and EP skill effect values. The public app always supplies a skill catalog, including an empty one during loading, so unavailable source data cannot enable an old saved toggle.
- Attack, defense and speed are calculated from the source numeric fields. The hero book reuses exactly the same ability gate, displays the original skill artwork and values, and explains a missing class, level or shield.
- New test vectors exercise four source skills, changing skill values, incomplete source rows, unavailable skills and DOM checkbox interaction.
- Pending: full Node test run, actual browser and Worker/D1 deployment checks, additional verified active skill mechanics.

## Source update 0.118.0 — complete Remaked formula inventory and broader calculation parity

- [x] Inventory all 178 Legacy switch cases, their 143 distinct keys and exact source lines. [Full source coverage matrix](../../../docs/REMAKED_FORMULA_INVENTORY.md) and pinned [machine-readable case index](../../../data/remaked/legacy-calc-cases.v1.json). This does NOT mean all formulas have been ported.
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
- [ ] [OS server check protocol](../../../docs/OS_LIVE_PARITY_CHECKS.md) for unresolved percentage rounding, item procs, gemstones, stance and buff lifecycle. Confirm only from current game/client evidence.
- [ ] Continue the [143-key Remaked formula inventory](../../../docs/REMAKED_FORMULA_INVENTORY.md), with complete item sets, active/passive effects and final combat result chains; **full parity not yet achieved**.

## Source update 0.121.0 — old-build allocation safety at the actual OS level cap

- [x] A saved character originating from the old level-50/55 UI may contain more blue/green skill points or attribute points than current level-45 OS permits. After cap adjustment, detect both budgets using the existing Remaked point-cost engine and current OS ability point table.
- [x] Invalid distribution does not silently shed points from the user's draft or library. The hero can be reallocated, while the Book/Origin calculation refuses to label illegal results as valid; a short player-facing notice explains which pool needs attention.
- [x] Added direct regression cases for legal level-45, excess stats, excess trained skills, malformed allocations and UI warning presence. Recorded source validation without any login or database mutation.
- [ ] Continue full Remaked formula port and current OS gameplay checks using the [source inventory](../../../docs/REMAKED_FORMULA_INVENTORY.md) and [live test protocol](../../../docs/OS_LIVE_PARITY_CHECKS.md).

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

