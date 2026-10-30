# Pandora Saga Build Studio — implementation roadmap

**Updated:** 2026-10-30 · **Latest shipped client:** 0.45.0 (`2026.10.30.45`)  
**Source branch:** `bonaqu_projects` · **Desktop-first:** 1920×1080, 2560×1440, 3840×2160 · responsive mobile

This is a durable, evidence-led work plan. A GitHub Pages deploy proves assets were published, **not** that a feature passes real-user browser flows, actual Cloudflare Worker deploy, or game-calculation parity.

## Workstreams

| Issue | Scope | State | Next evidence required |
|---|---|---|---|
| [#1](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/1) | Own D1 catalog, imports, RU/EN, wiki and admin publication | In progress | Worker/D1 deployment confirmation, live API smoke, full 11-dataset coverage, authenticated edit/rollback |
| [#2](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/2) | Self-host original race art and 1,437 icon files | Blocked on original image bytes | Mirror original files, validate WebP and manifest, remove all external icon runtime dependencies |
| [#3](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/3) | Single-screen character workbench, race/class/skills/equipment | In progress | Browser E2E and visual inspection on desktop/mobile, keyboard focus, all gear conflict scenarios |
| [#4](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/4) | Saved-build migration, refresh safety, admin reliability, QA | In progress | Real `npm test`, persisted-state + refresh + modal navigation E2E, deployed admin API, crash monitoring |
| [#5](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5) | Current OS combat parity with Remaked reference mechanics | In progress | Source-fingerprinted fixture matrix, buffs, mastery, Forth enhancement, Souls, sets, modifiers and procs |

## Already implemented; do not redo blindly

- 8 selectable portrait variants for 6 races; three Origin tabs (race plus passive / 28-class drill-down wizard / level plus six in-place stats); right-hand skill allocation with class/level gates and skill-unlock markers.
- Portrait-local item, Soul, refinement (+0…+10) and element/type screens; accessory/cloak slots cannot refine. In-panel scroll stays anchored when adjusting the same item; generic site scrollbars share dark styling.
- Wiki runs D1-first, falls back per catalog JSON to the repository, supports full result search with progressive 100-row paging, linked items/NPCs/monsters/chests/drops.
- UI view/session restore no longer forces stale `#wiki/...` after switching tabs.
- HP/MP: OS class coefficients, race/base class + spent attributes, publicly audited half-to-even rounding; supported flat ability and max-life/mana item/Soul effects. Flat source gear/Soul elemental resistance and selected combat bonuses displayed **separately from final stats**.
- Local original image mirror audit, strict WebP/manifest check, package scripts; physical source file transfer is still incomplete.

## Priority A — acceptance tests and crashes

- [ ] Perform 1920×1080 full interaction pass: change Kroll → Human M/F → Elf M/F → Myrine → Dwarf → Enkidu; verify selection state, fixed-only genders and equipment suitability.
- [ ] Reload on every origin tab and with workbench/wiki/inventory open and **closed**; make sure no unexpected tab, hash, modal, focus, or scroll jump.
- [ ] Test gear for all 14 slots: choose/remove, forbidden refinement, +0→+10→+0, gem types/elements, sockets and incompatible souls, dress blocking legs, class/race/level filters, JSON round-trip.
- [ ] Wiki test 8 categories, 100→200→all, RU/EN and ID search, item drops, NPC trade and deep link, fallback when Worker is temporarily unavailable.
- [ ] 1440p/4K/390px visual + keyboard-focus and mobile touch smoke, shared scrollbars, tooltip clipping, right-skill column overflow.
- [ ] Run full `npm test` locally and record test process output; never treat static regex tests as real browser E2E.
- [ ] Verify actual Worker deployed version and D1 status without mutating credentials or existing data.

## Priority B — combat calculations without guesses

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

Update CHANGELOG/README, this roadmap and matching GitHub Issues after meaningful work. Prefer one coherent release with tests and an explicit deployment check. Never overwrite existing user builds, live D1, Worker secrets or preserved Legacy formulas. Full browser smoke and live OS parity can remain *pending* when tooling/network is unavailable, but must never be described as passed.

## Verification sources

- Public OS game data and calculator: https://pandorasaga-os.com/#calculator
- Remaked formula audit: https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/docs/CALCULATION_PARITY_AUDIT_2026-10-11.md
- Prior enhancements and effect mapping: https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/modern/enhancement-effects.js
- Current build source and release notes: https://github.com/bonaqu/Pandora-Saga-Build-Studio
