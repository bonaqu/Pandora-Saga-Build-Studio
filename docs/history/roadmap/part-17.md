# История ROADMAP — часть 17 из 20

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

