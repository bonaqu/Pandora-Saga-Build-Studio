- Preserve audit/coverage for verified models even when moving their presentation from Book to Wiki. Do not generate duplicative fake values or remove tests: update historical UI test assertions to check the correct chapter and keep full Node + Chromium.

## MELEE parent-group skills (0.741.0)
- Current OS `branchRaw:MELEE` with `branch:'martial'` is a **group requirement** for exactly four pinned IDs: 100056001, 100057001, 100101001, 111201001. The OS class `branchCaps.martial=0` is not the actual group limit. Parent cap = sum of class caps for `slash,thrust,brush,blow,defense`; parent proficiency = sum of current **green trained** values for those same branches (respecting each child cap), never allocations or stored raw `martial` investment. Historical game skill reference supports the parent sum; current OS client outcome remains unmeasured.
- Use `PandoraSkillProgression.meleeGroupCap/meleeGroupTrained` for Hero Path gates, and the read-only `combatTechniquePreview` for Hero Book source models. Display player-facing RU/EN parent labels, requirements and actual source status; no arbitrary reallocation, no permanently applied bonuses. The four source proofs must fail closed on any changed FV1/FV2, class/weapon metadata or `branchRaw` drift.
- Current census: 73 numeric, 98 qualitative, 3 unmodeled IDs (260006002,300001001,300002001). Do not assert those are server-impossible; the former lacks permitted caster classes in source, the last two require benevolence 102 vs current cap 90. Historical 0.740 tests retain minimum coverage; exact current status goes in 0.741 tests. Do not invent final probabilities or combat values.

## GitHub repository operations and time-efficient PR delivery (2026-11-13)
- **Read `docs/REPOSITORY_OPERATIONS_AND_FAST_DELIVERY.md` before touching GitHub branches, CI, release numbering or production readiness.** It records verified owner settings and the playbook. Settings can change; recheck API/Ruleset and current HEAD rather than assuming the snapshot remains current.
- Main branch is `bonaqu_projects`. Active Ruleset **Protect bonaqu_projects** (#27159457) requires a PR, **zero** independent approvals, the **exact** GitHub Actions checks `Unit regressions and release consistency` and `browser`, strict branch freshness, no force push or protected-branch deletion. Use Merge/Squash, never Rebase. Do **not** bypass checks or push directly to main. Ruleset: https://github.com/bonaqu/Pandora-Saga-Build-Studio/settings/rules/27159457 .
- Repository allows auto-merge, but it is **opt-in per PR**. Auto-delete merged PR branches is on; orphan branches without a PR are a separate cleanup. PRs with overlapping release edits must be integrated against the latest main and rechecked, never blindly force-updated. Preserve ongoing independent PR work.
- **Both named required checks must run for every PR**, including Markdown-only and test-only changes. Never add `pull_request.paths-ignore` or commit `[skip ci]` to these two workflows: omitted required checks stay Pending and can deadlock the protected PR. Keep Chromium's conservative impact selector: quick for proven docs/copy/style-only diffs, full for gameplay/source/uncertain changes. Even quick must launch real Chromium; manual single-scenario runs never substitute for the required `browser` check.
- **Fast without cutting corners:** batch related reads, inspect dependent call paths/test fixtures before changes, ship coherent patches, run focused Node and isolated browser diagnostics first, preflight release metadata before the full Node suite, then let the final mandatory CI run exactly once per revision. On failure read the first failing test/log before rerunning. Avoid needless release bumps for documentation/CI-only patches; when code/site assets change bump release files together. After a release verify Pages **and** live Worker/D1 read-only readiness; never infer a real production write from mock tests. Never run background/daily CI without an owner request.


## Multi-stage dark spells and status effects (0.740.0)
- Source-proof the eight dark/status roots inside the existing `specializedSkillPreview.magic` accordion. Keep official RU/EN names and full FV1/FV2 in root and all nested helper signatures. In particular `430058001` must check `430058002`, `430058003`, `500000004`, `500000003`; `430053003` checks both child stages, `440003001` checks both independent child branches.
- EP_LIFE_ABSORB/POISON/CAUSE_DISEASE/SILENCE etc. identify mechanics but do NOT prove final heals, damage, probability, stack order or duration. Never invent server figures or change persistent stats.
- The same 0.740 release adds `330061001` / `330061002` (Holy Rays), `330081001` / `330081002` (Banish) to the specialized magic group, and a separate `340001004` → `340001005` → `340001006` Minstrel song to the existing Songs group. For the song, check exact FULL signatures in all three records, not FV1 alone; the source-only row must never add an automatic combat bonus. All current class-eligible learnable roots are now represented by the source-based census. Seven current-OS learnable-marked records still have no eligible class/branch-cap combination; leave them unmodeled, do not claim they are server-impossible. Past census tests stay minimum guarantees, and the current exact census is asserted by 0.740 tests.

## Linked elemental and state spell proofs (0.739.0)
- Keep `410005001`, `410014001`, `410014003`, `410022001`, `410026001`, and `420007001` within the existing `specializedSkillPreview.magic` Book block. Use current OS RU and EN names, full root and child signatures, and class/mastery requirements.
- Validate BOTH nested Meteor stages `410005002` / `410005003` and ALL Thunder Storm stages `410026002`, `410026003`, `410026004`. Verify source-graph effects including RANDPOS, GETON, sleep, stun and knockback. Fail closed if any stage's FV1/FV2 changes.
- Source EP parameters do not prove actual final damage, probability, radius, hit count or status duration; show natural, clear RU/EN uncertainty. No new panels, permanent bonuses or D1 writes.

## Advanced melee and stealth source proofs (0.738.0)
- Reuse the existing `combatTechniquePreview` and Hero Book `stage-skill-combat-technique` for seven additional OS root abilities. Require exact current full record including FV1/FV2, job, weapon and mastery; `350001001` must also verify the entire linked `350001002` immobilization effect for caster and target.
- A label such as Double Strike or a 100/200 source parameter is NOT a verified hit, chance, damage or motion distance. On Blindside, describe the game-source invisibility prerequisite rather than pretending the calculator checked current stealth status. Do not add permanent stat effects or D1 writes.
- Test all roots and linked helper changes. Keep older release assertions as historical minimum coverage, current version assertions exact.

## Combat combo source proofs (0.737.0)
- Render new combat source models within the existing Book `stage-skill-combat-technique` accordion; verify full source signature and every linked `EP_ONHIT_SKILL_EXEC`, `EP_SKILL_EXEC_COMBO`, `EP_SKILL_EXEC_GETON`, `EP_SKILL_EXEC_CASTPOS` stage. Specifically validate `121703501` against `121703001`, `121703511`, `121703512`; `121707001` against `121707002` and `121707003`; `121704001` against `121704002`; `100103001` against `100103050`.
- An OS strike count (3, 4), combo condition or source resource cost (2) is NOT evidence of actual hits, trigger probability, resulting HP damage or travel distance. Show source-only RU/EN descriptions and prerequisites without altering persistent character stats or D1.
- Keep prior audit tests as baseline guarantees, and assert new exact counts only in the latest release test. Keep Node+Chromium gates and separate Pages/Worker read-only readiness.

## Specialist magic and defense source chains (0.736.0)
- Keep specialized Skill Effects inside the existing «Дополнительные защитные умения» / «Особые магические умения» accordions. Verify official names through the current OS RU and EN IDs; do not invent class titles in notes.
- For `440004002` check the full parent `440004001` and both nested child actions `440004003` → `440004004`, not just the first EP_SKILL_EXEC. For `330091001`, check linked `330091002`. Fail closed on any FV1/FV2 or source mismatch.
- Defensive control, area effects and targeted damage are source descriptions, never permanent hero stats or server-verified hit/duration/damage figures. Continue checking 569-skill audit and keep tests for historic minima instead of brittle exact old snapshots.

## Existing buff source audit (0.735.0)
- Keep one existing UI toggle and one stat application for `260008001` «Ускользание». The numeric +100 Evasion preview is valid only when both current OS effects exactly match, including the two-hit termination marker. Do not count the marker as another buff.
- `320006001` «Воодушевление» carries exact current OS TARGET `EP_SKILL_DELAY_FIN [0,0,0,50]` with zero FV2 and the preceding cancellation effect. This is a confirmed game-source **50% of normal skill casting time (2× casting speed)**; show the numeric reduction, don't call the source number itself unknown. Do not invent a particular number of seconds without a base cast duration. Gate the rendering on both unmodified source signatures.
- Source audit categorization is historical and not a reason to hide the confirmed 50% value of `320006001`; never add duplicate controls or mutate production D1. Infer neither arbitrary seconds nor stacking beyond the available game source.

## Further source-only abilities (0.734.0)
- New `situationalSkillProofs` records retain the full, current OS source signatures and *all* linked helper skill signatures (including two-hop `410000201 → 410000202 → 410000203`). Avoid claiming a verified final teleport destination, plant damage, effect duration, trap success, or server speed-roll from an EP value.
- Reuse the existing two Skill Effects sections with canonical RU/EN skill names and icons, never create separate top-level panels or permanent hero modifications.
- Use class branch caps, level and exact FV1/FV2 source verification; fail closed on changed helpers. Recompute the census of all 569 records on each PR, and preserve tests for historic minima instead of hardcoding previous exact totals.

## Portal and movement source previews (0.733.0)
- The exact current OS RU name for skill `410000301` is «Двойной портал»; English OS `strings.en.json` uses `Memorize`. Display each verbatim per selected locale, never free-translate skill titles.
- `EP_CANCEL_MEMORIZE_IN_MAP` / `EP_WARP_MEMORY` are verified source action markers, not a confirmed destination, available map, travel success or live server outcome. The Book's existing «Особые действия» section may describe requirements, MP, cooldown and source effects, but must not modify hero stats or imply a server-confirmed teleport result.
- Require a full root signature match, including all FV1/FV2, before listing this qualitative portal source; preserve other previously covered skills.

## Skill Effects disclosure geometry (0.732.0)
- `collapseBookSections()` normalizes top-level Skill Effects `<details>` to the shared `.stage-book-disclosure` header with a single `.stage-result-chevron`. Never add a second arrow using `summary::after` or a second clickable header.
- The classes `.stage-skill-chain-effects`, `.stage-skill-onhit-effects`, `.stage-skill-crafting-effects`, `.stage-skill-trap-costs`, and `.stage-skill-complex-effects` must not override common header padding, background, typography or disclosure geometry. Preserve keyboard-native `summary` behavior and persisted disclosure state.
- Chromium desktop smoke tests both actual present skill sections and isolated fixtures for all five class families, collapsed and expanded. No source skill IDs, D1 rows or character state need changing for this UI repair.

## Source of truth and safety
- Work in `bonaqu_projects` through focused PRs. Inspect current branch HEAD, open PRs and relevant issues **once**, before editing.
- Keep all gameplay formulas, character state, saved Souls and catalog data unchanged unless the issue requires a verified change.
- Cloudflare D1 is authoritative for game data. Do not claim successful **production writes/rollback** from mocked CAS browser tests or read-only readiness. Issue #203 requires separate owner approval for any live temporary write.
- Owner-editable RU/EN UI copy uses existing D1 override keys and unified inline editors. Do not reveal internal IDs in player-facing text.

## Mandatory RU/EN source naming and status explanations (2026-11-12)
- Current OS data are authoritative for **all user-visible game identity names**: RU uses the exact skill/item/soul/class ID in `data/os/*.json` and branch key in `data/os/meta.json:branchLabels`; EN uses the matching ID in `data/os/strings.en.json` and its `branches` table. Never autotranslate, invent labels or substitute similar historical Remaked terms. Only use an approved Legacy mapping after verifying the same current OS ID.
- `exorcism` is «Экзорцизм» / Exorcism, **not** «Изгнание»; `alchemy` «Ремесло» / Alchemy, `brush` «Рубящий удар» / Cleave, `darkness` «Магия тьмы» / Darkness. Pass canonical lookup into each calculation/requirement renderer; avoid stale manual mini-dictionaries. Keep current D1 admin overrides and stable internal keys intact.
- The full historical body/mind status family membership is documented in `docs/OS_LOCALIZATION_AND_STATUS_GROUPS_2026-11-12.md`. Show both families in bilingual summary tooltips and the Defense explanatory section; family resistance is distinct from individual state resistance. Historical membership must NOT be promoted into an unverified OS server-roll or invented stacking formula.
- Add source-by-ID RU/EN regression tests for any new gameplay terminology, skill or enhancement labels before release.

