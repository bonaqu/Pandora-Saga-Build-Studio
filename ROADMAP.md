# Pandora Saga Build Studio — implementation roadmap

**Updated:** 2026-10-30 · **Latest source release:** 0.55.0 (`2026.10.30.55`), browser and Worker deployment unverified  
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
