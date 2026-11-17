# История ROADMAP — часть 7 из 20

- [x] Prevent skill readiness from assuming a missing/invalid class membership list allows learning. A class must be explicitly allowed by the authoritative source record; an empty list stays locked.
- [x] Apply the same strict positive safe-integer threshold semantics to skill readiness and milestone markers: ignore arrays, objects, booleans, exponent/hex strings, fractions and unsafe values, preserving decimal numeric-text compatibility.
- [x] Deduplicate over-cap skill notches by source skill ID + threshold, using first record identity; previously repeated requirements were de-duplicated only for reachable marks, not blocked entries.
- [x] Add direct regression tests and verify against all 569 OS skills; do not change any skill points, character builds, D1 data or formula coefficients.
- [ ] Continue source-backed combat parity, authentic icons and real D1 account write lifecycle after production/browser gates.

## Source update 0.257.0 — prevent coerced ghost points from damaged saved builds

- [x] Do not treat JSON boolean `true`, arrays, objects or non-decimal strings as valid positive branch investments/mastery. Preserve ordinary numeric values and legacy decimal numeric strings, including whole-value `.0` and leading `+`.
- [x] Use safe integer validation for existing investments, blue point budgets, trained green mastery and derived group adeptness to prevent out-of-range input from corrupting totals; do not mutate historic saved builds or alter valid number semantics.
- [x] Add model-level regressions for budget, ability to train, prayer adeptness, accepted legacy formats and all malformed input classes. Keep full Node+real Chromium verification and read-only Worker/D1 publication check.
- [ ] Further validate real OS game packet/formula parity, icon coverage and authenticated cloud lifecycle without inventing source mechanics.

## Source update 0.256.0 — efficient, tiered regression execution without deleting coverage

- [x] Confirm from actual Actions timing: full quality workflow is ~16s, full Chromium workflow ~58s; browser scenarios themselves ran ~30s sequentially, and the package/browser/OS dependency setup occupied the rest.
- [x] Keep all 722+ full Node assertions and all existing browser scenarios; run independent isolated Playwright contexts through a concurrency-limited (3) scheduler, while 4K screenshot/layout audit remains sequential outside the worker pool to prevent memory contention. Fail with scenario name/cause and preserve deterministic source-order results.
- [x] Add optional `npm run test:quick` (focused local checks), `npm run test:browser:quick` (core + selected high-risk isolation flows), and `npm run test:browser:serial` (full reproducible debugging). `npm test` and `npm run test:browser` remain the comprehensive CI gate.
- [x] Test runner concurrency, order, failure propagation and serial reproduction in Node. Compare GitHub browser workflow elapsed time before/after and independently verify GitHub Pages / Worker readiness.
- [ ] Future measured tuning: benchmark Node worker-file overhead before regrouping independent tests; keep source-backed gameplay parity and live D1 write acceptance open.

## Source update 0.255.0 — shared skill-row snapshot and saved class-switch browser acceptance

- [x] Cache the catalog skill array across growth/skill page renders via a WeakMap keyed by catalog identity. Avoid allocating and extracting all 569 source skills on every layout/hover rerender. RU/EN catalog changes replace the source and receive an independent correct snapshot; no source record is mutated.
- [x] Add real Chromium reproduction of a Cleric opening an old saved 12-point Slash allocation (class cap 0): still visible 12 / 0 with warning, editable refund to 8 / 0 and persisted after browser reload. Changing profession never silently removes old investments.
- [x] Extend Node tests for source-order parity, language-switched cache invalidation and shared page consumption. Named-build explicit save, D1 ownership, level-55 planning and skill availability rules untouched.
- [ ] Verify real gameplay formula parity, account D1 production writes and visual icon mirroring independently.

## Source update 0.254.0 — no redundant persistence while dragging skill points

- [x] Avoid local draft rewrites and budget widget rebuilds when the range fires many events for an allocation value clamped to the existing cap or already saved value.
- [x] Keep an immediate owned/scoped draft write for every genuinely changed allocation or selected branch; a zero-point branch navigation still persists correctly.
- [x] Preserve end-of-drag / blur UI refresh, native focus restoration, attribute/book recalculation, 1–55 points, named-build explicit overwrite, account/D1 isolation and ability to refund old over-budget builds.
- [x] Unit-test real app allocation callback through unchanged, capped, changed, refunded, branch-navigation, final-commit and malformed-input scenarios; keep Chromium regression for 0→1→0 and exact input clearing.
- [ ] Investigate future measured renderer performance and verified current OS game formula parity; production D1 authenticated write acceptance remains a distinct unresolved task.

## Source update 0.253.0 — indexed branch skill catalog and readable old builds

- [x] Build skill eligibility/branch grouping in one source-order-preserving pass per Hero Path render instead of repeatedly filtering the full 569-record OS skill catalog for each expanded branch. Ignore malformed records and duplicate same-branch prerequisites safely.
- [x] Preserve the true old-build invested balance when changing profession to one with a zero branch cap: show `12 / 0` if 12 was already saved, but still show an em dash for genuinely empty/inaccessible `0 / 0`. Keep historical allocations intact and disallow new spending beyond current class cap.
- [x] Add parity checks for every official class and every visible branch against the previous filter, including corruption and duplicates; cover rendered over-cap legacy records.
- [x] Update old source-shape assertions without changing user-visible layout, green mastery, skill icons, or interactive allocation.
- [ ] Continue game formula source verification, Cloudflare D1 production acceptance, icon mirroring and remaining localization.

## Source update 0.252.0 — verified cleanup of unused mastery picker styling

- [x] Check every top-level JavaScript module loaded by the site and confirm that retired grouped skill picker / choice / dismiss and obsolete four-button inline branch controls are never created.
- [x] Remove only the now-unreachable rules and obsolete media-query overrides for `path-milestone-picker`, `path-milestone-choice`, `path-milestone-choice-body`, `path-milestone-dismiss` and `inline-branch-controls`. Preserve live skill hover previews, accessible unlock list, vertical current-value tick, and invested/mastery inputs.
- [x] Add regression checks over the actual HTML script dependency list, asserting no deleted class is still rendered and active selectors remain. Verify real Chromium and deployed Pages separately.
- [ ] Continue source-based cleanup, image restoration, formula parity, RU/EN coverage and authenticated production D1 acceptance.

## Source update 0.251.0 — single header locale and concise Hero Path

- [x] Screenshot/user request: remove redundant `Очки ветки N / cap` from the expanded tree, retaining `Стрельба 12 / 45` in the branch header and precise invested/mastery inputs below the rail.
- [x] Keep gold value notch, all milestone markers, group invested totals and drag/keyboard/manual-input behavior unchanged. Add real browser 0→1→2→0 and exact-input regression verifying no duplicate.
- [x] Remove second language switch in workbench: RU/EN available only in the site header's top-right. To switch while the modal is open, close it, use header RU/EN, then reopen. Preserve one locale handler.
- [x] Remove now-dead CSS for repeated point row and dock language switch, and the old modal click handler, dual synchronization logic, and obsolete tests.
- [ ] Full formula parity, real D1 authenticated write acceptance, original icons and remaining RU/EN subcomponents continue separately.

## Source update 0.250.0 — locale-aware item names and real bilingual equipment acceptance

- [x] Prefer official localized RU/EN item name when both versions are included in a source record, falling back to the other official language only if missing. Preserve original plain-string OS names and reject names that are merely numeric IDs; player/admin overrides remain untouched.
- [x] Pass active site language from the equipment catalog's item display helper without changing record IDs, sorting, slot relationships, damage or combat calculations.
- [x] Add genuine Chromium integration of the open equipment panel: RU → EN → RU search and slot labels, same item name for single-locale OS records, source/inspector interaction and JavaScript error guard.
- [x] Keep RU/EN reachable while the workbench blocks header pointer events: add a compact keyboard-accessible dock-local switch wired into the **same** existing site locale handler and synchronized pressed state, without making the modal's backdrop nonmodal.
- [x] Add locale-order and original-record-preservation unit regressions. Confirm Pages and Worker readiness separately after merging.
- [ ] Remaining dense Hero Book/external item display translation, real game combat parity, original binary icon mirroring and production D1 authenticated write acceptance stay open.

## Source update 0.249.0 — bilingual equipment catalog and skill navigation

- [x] Localize the Equipment collection's filters, grid/list controls, status counts, inspector, acquisition-source labels, loading/failure states, empty state, aria labels and action texts to RU/EN.
- [x] Give known equipment kind/slot types strict English display labels via the existing PandoraItemPresentation.kind API, keeping its Russian default and all game record IDs, names, descriptions, classes and stats unchanged.
- [x] Replace the redundant technical note in the Skill details pane with a compact RU/EN navigation hint; no duplicate skill editor is created.
- [x] Add bilingual item-kind and UI-source tests, then verify real Chromium and Pages separately.
- [ ] Complete the remaining localized equipment inspection subcomponents, account UI and legacy sections after source checks; no user-defined names should be heuristically translated.

## Source update 0.248.0 — source integrity in Hero Path and quieter locked rail

- [x] Do not report learnable skills when the current class has a disabled/false/fabricated membership value; allow only source-backed 1/true.
- [x] Fail closed on malformed explicitly provided character levels, non-array requirements, unsupported learnability flags and invalid supplementary requirement levels. Valid zero character level remains supported, as do future-level skill requirements above 55 (they remain locked at planner level 55).
- [x] Lower contrast of the integrated bar's unavailable red hatching while keeping the fixed class boundary, golden value notch, exact 21px rail geometry, tooltips and native pointer/keyboard interactions.
- [x] Add source-contract tests against all 569 official OS skill records and malformed fixture records; avoid touching saved builds, Cloudflare D1 or combat formulas.
- [ ] Measure actual hover/render performance and verify remaining game combat formula parity. Authenticated live D1 write acceptance still requires a controlled separate check.

## Source update 0.247.0 — validated milestone source integrity and dead handler cleanup

- [x] Align skill milestone creation with readiness rules: null/blank, zero, boolean, negative, noninteger, array and object requirements cannot form phantom markers; numeric-string positive integer requirements remain compatible.
- [x] Treat a malformed class cap as zero (fail closed), keeping valid future skill thresholds in the unreachable list rather than falsely available. Reject missing skill-ID records and null entries.
- [x] Remove two proven unreferenced app functions `branchRow` and `markNode`, leaving the current right-panel skill tree and encyclopedia untouched.
- [x] Reuse a first-match-preserving ID map in the above-cap skill adapter, eliminating a repeated array scan and retaining all accessible records.
- [x] Add source and model tests; follow with full Node/Chromium and deployed Pages acceptance separately.
- [ ] Modern game formula parity and authenticated production D1 write lifecycle are not claimed by these tests.

## Source update 0.246.0 — profession-cap-safe skill readiness and complete index reuse

- [x] Fix a real cross-profession legacy-save edge case: points retained beyond the current class cap cannot make a skill appear available when its requirement exceeds this class cap. Skill points/mastery are still retained intact, and unreachable skills remain visible in the unlock list.
- [x] Reject malformed or zero/missing branch thresholds rather than treating null, blank, zero or negative requirements as fulfilled. Existing OS snapshot verified as 569 skills with positive integer branch requirements; legitimate numeric-string thresholds remain supported.
- [x] Reuse the already-built skill ID index when initial unlock notches are created, not only when slider values repaint; remove an unused local group subtotal.
- [x] Add isolated regression tests for old saved points, source integrity, valid skills, missing requirements and prerequisite propagation. No combat arithmetic, D1 writes, account ownership or level 1–55 behavior changed.
- [ ] Verify PR/full main Chromium and deployment separately; continue OS parity and production D1 lifecycle verification.

## Source update 0.245.0 — shared skill prerequisite index in Hero Path and skill gallery

