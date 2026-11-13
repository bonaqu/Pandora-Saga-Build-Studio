# Pandora Saga Build Studio — working rules for coding agents

These repository-level rules are durable instructions for future coding sessions.

## GitHub repository operations and time-efficient PR delivery (2026-11-13)
- **Read `docs/REPOSITORY_OPERATIONS_AND_FAST_DELIVERY.md` before touching GitHub branches, CI, release numbering or production readiness.** It records verified owner settings and the playbook. Settings can change; recheck API/Ruleset and current HEAD rather than assuming the snapshot remains current.
- Main branch is `bonaqu_projects`. Active Ruleset **Protect bonaqu_projects** (#27159457) requires a PR, **zero** independent approvals, the **exact** GitHub Actions checks `Unit regressions and release consistency` and `browser`, strict branch freshness, no force push or protected-branch deletion. Use Merge/Squash, never Rebase. Do **not** bypass checks or push directly to main. Ruleset: https://github.com/bonaqu/Pandora-Saga-Build-Studio/settings/rules/27159457 .
- Repository allows auto-merge, but it is **opt-in per PR**. Auto-delete merged PR branches is on; orphan branches without a PR are a separate cleanup. PRs with overlapping release edits must be integrated against the latest main and rechecked, never blindly force-updated. Preserve ongoing independent PR work.
- **Both named required checks must run for every PR**, including Markdown-only and test-only changes. Never add `pull_request.paths-ignore` or commit `[skip ci]` to these two workflows: omitted required checks stay Pending and can deadlock the protected PR. Keep Chromium's conservative impact selector: quick for proven docs/copy/style-only diffs, full for gameplay/source/uncertain changes. Even quick must launch real Chromium; manual single-scenario runs never substitute for the required `browser` check.
- **Fast without cutting corners:** batch related reads, inspect dependent call paths/test fixtures before changes, ship coherent patches, run focused Node and isolated browser diagnostics first, preflight release metadata before the full Node suite, then let the final mandatory CI run exactly once per revision. On failure read the first failing test/log before rerunning. Avoid needless release bumps for documentation/CI-only patches; when code/site assets change bump release files together. After a release verify Pages **and** live Worker/D1 read-only readiness; never infer a real production write from mock tests. Never run background/daily CI without an owner request.


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

## Status-resistance UX, D1 and formula boundaries (2026-11-13)
- Current OS `itemForth` is **cumulative by breakpoint** (not an effect only at that exact grade). Look up the highest validated threshold ≤ grade; do not sum snapshots and do not parse historical narrative if a canonical Forth record already exists. Tests must cover +0…+10, including sparse between-threshold examples and known OS item IDs. Preserve canonical ID validation, D1 overrides and item state lifecycle.

- In **Результаты расчёта**, body/mind resistance rows use the existing label tooltip; do **not** reintroduce a large or separate ⓘ warning. Real line breaks only; legacy literal `\\n` must be displayed as newlines, never HTML.
- Defense's body/mind explanation shares the existing `guideedit.book.summary.40/.41` RU/EN D1 records, not independent hardcoded copy. All twelve individual resistances have short `defense.resistStatus:<channel>` RU/EN hints stored through `guideedit.book.*`. Use the unified multiline editor for hints and preserve D1 CAS behavior.
- Item/Soul `EP_IMMUNE_*` and grouped `EP_IMMUNE_VIT_TYPE/SPI_TYPE` are separate inputs. Keep the source-backed honor/racial/Warding contributions isolated; **do not treat group resistance or historical elemental dependencies as a verified individual 2026 OS status-roll formula**. The `verified:false` source limitation stays visible in code/audits until independently supported.
- Preferred RU status is `Немота` / EN `Silence` (not improvised `Молчание`); existing OS label IDs and historical sources take priority over loose translation.

## Canonical game labels and missing translations (2026-11-13, 0.704.0)
- The **same OS skill ID** must render its current RU `data/os/skills.json[id].name` and EN `data/os/strings.en.json.skills[id].n`. Never auto-translate, transliterate, or insert a guessed English alias. Current snapshot: 569 skill IDs, only 553 with official EN; for the other 16, show **canonical RU** until a verified EN entry exists.
- Generic UI captions may share a Russian word with a skill but have another meaning. Examples: section `Восстановление → Recovery` versus skill ID 310022001 `Восстановление → Restoration`; element `Яд → Poison` versus skill 220001001 `Яд → Toxify`; status `Падение → Knockdown` versus skill 500000015 `Падение → Tripped`. Do not globally replace these strings. Route game skill labels through `gameSkillName(id, ...)`, editorial captions through UI translation tables.
- OS-verified EN self/party buff names: `100052001 Яростная атака / Raging Soul`, `260006001 Помощь ветра / Speedy Gale`, `320004001 Благословение ветра / Accelerate`, `320005001 Знак жизни / Divine Aid`; avoid historical convenient names like Rage Attack, Wind Assist, Wind Blessing, Sign of Life. Verify the current ID and source on every future naming change.
- Regression `tests/os-canonical-ui-names-704.test.mjs` checks the 569 skill identities, missing EN fallback and ambiguous UI label pairs. Any new source labels need the same proof.

## Shared priest UI and numerical display (2026-11-12)
- In the external priest section edit SPR (СД), Blessing and Hymn **once each**; do not duplicate caster input fields alongside priest skills. Keep persisted legacy Benevolence/Exorcism values and original requirements intact.
- Only add contextual input fields for allied skills when OS/Remaked source evidence proves an independent caster dependency. Natural Recovery presently has a fixed source effect vector, so no speculative extra field.
- Avoid long internal formula-confidence labels in player-facing descriptions when a numeric source-derived value is available. Record technical provenance and unresolved game mechanics in issues and code; never present a bare coefficient as guaranteed final damage.
- Preserve individually established floor/ceil calculation stages; do not globally replace arithmetic.

## Source-only formula restoration strategy (owner direction, 2026-11-13)
- Do not request, block on or require comparison with the live Pandora Saga game client. Reconstruct as much as possible from the complete Remaked UI source formulas, current Pandora Saga OS source files and published OS/D1 catalogs. Where the sources disagree, preserve the Remaked mathematical stages only when applicable to the OS vector and replace obsolete coefficients with the actual OS parameters.
- For every new effect family, audit **every current OS skill ID**, direction (CASTER/TARGET), mastery/level/class eligibility, root/upgrade prerequisites and FV1/FV2 roles. Use RU/EN from the same OS ID; never infer names. Record unproven stacking, timing, resist rolls and final target calculations separately, but do not turn lack of client testing into a development blocker.
- Formula coverage census MUST inspect actual cross-module models: `scalingSkillPreview`, `healingSpellsPreview` at theoretical levels 45/55, `periodicRecoveryPreview`, `songSkillPreview` and `resistanceSkillChoices`. Preserve unique skill ID counts, `sourceModules`, separate `source-parameter` from `coefficient-model`, and flag enemy TARGET spells as `targetSideOnly`. Theoretical levels are for auditing, not a live server cap.
- Current OS elemental resistance casts (six learnable source IDs): five `ENEMY` spells are **TARGET-side** signed effects, not own passives; `330004001` Providence is a separate `PARTY_ALL` +25 Magic Resistance. Validate *all* recognized resistance EP rows together: zero FV1[0..2], exact 4-value zero FV2, TARGET direction, unique EP/stat; reject the **whole** skill when any row changes. Never silently omit a changed negative penalty. `EP_PROTECTION_*` toggles are separate from `EP_IMMUNE_*` persistent status resistance; source learnability alone does not override class mastery caps.
- Current OS movement source family: nine learnable `EP_MOVESPEED_SCALE` records, including the singular `prereq:0` sentinel for `260003001`. `+200` boost vectors, enemy `-50` and caster toggles `-20` are source **effect parameters**, not a verified final MoveSPD percent or unconditional buff. Only the older `+30` and `+40` additions have a preserved Remaked MoveSPD formula; keep them isolated from unverified stacking.

## OS-skill coefficient staging (2026-11-12)
- Completed *source-scaled effect parameters* may appear as normal compact numeric results (without technical model disclaimers); **they are not automatically final combat target damage, mana consumption or absorption**. Preserve internal modelOnly/uncertain metadata and fail closed on mismatched OS vectors.
- Current source-projected families: `EP_ABSOLUTE_MAGIC`, `EP_MANA_SHIELD`, `EP_CASTINGCANCEL_RESISTANCE_CONST` and `EP_ELEMENT_DAMAGE_SCALE`. Float arithmetic is floored *per attribute/mastery component*, following the supported Remaked coefficient pattern, not by rounding the combined value. Respect FV2 and the source skill variant chain.

## Multi-hit and projectile effects (2026-11-12)
- `EP_DOUBLE_MISSILE` together with `EP_ATTACKRANGE_CONST`/`EP_ATTACKCARRY_CONST`, and `EP_INCREASE_ATTACK`, produce independent source-scaled coefficients. Display them as **parameters**, not final hit damage or true distance. Source vectors, class, weapon and mastery cap must pass before projection. Never merge these channels into base physical ATK without source proof.

## Warding 26 source validation (2026-11-12)
- Passive 260007001 adds +15 TARGET stun/numb/tumble. Its additional CASTER numb is not an extra bonus. Use the same strict FV1/FV2, class and requirement validation in the read-only Skill Effects and applied Defense calculation. No double-counting.

## Purify chain and remaining skill coefficient locale (2026-11-12)
- OS Purify root 310014001 triggers internal 310014002: once the IDs, learnable flags, requirements and FV1/FV2 match, display independent +100 body/mind **source parameters** read-only. Never add them to a character's permanent resistances or invent duration, real cure success, mitigation or target-roll results.
- Both `directStrikeCoefficientPreview` and `elementalSpellCoefficientPreview` must receive the RU `meta.branchLabels` and EN `strings.en.branches` in addition to `scalingSkillPreview`. Never expose raw internal branch keys when approved current OS labels exist.

## Attack reach and plain-language player guidance (2026-11-13, 0.719.0)
- OS `weapon.range` is the weapon base distance; direct item `EP_RACE_RANGE` adds to melee/ranged and `EP_BOW_RANGE` to bow/crossbow. Elf racial passive ID 900020002 is RU «Зоркость» / official EN «Eagle Eye» and adds +500 to bow/crossbow only. The paired `EP_RACE_CARRY` and `EP_BOW_CARRY` are not extra bonuses.
- Show source-derived estimated totals in calculation results and base/gear/race/total separately in Attack. Keep `verified:false`; unverified temporary skill modifiers and full live combat stacking excluded.
- Use readable player-facing explanations without raw effect names, vectors, IDs, or internal system abbreviations.

## Saboteur level-50 trap variant (2026-11-13, 0.720.0)
- Current game class DISTURBANCE is «Загонщик» / Saboteur. Learnable Plant Mine 240002001 triggers 240002050; nonlearnable, class-only, level-50 record 240002002 requires 240002001 and triggers 240002051 while cancelling 240002050. Both cost one item 65007. Enhanced elemental vector [450,100,300,50] differs from basic [350,100,70,50]; knockback vector is unchanged.
- The source alone does NOT confirm when the game switches to the upgraded effect, or the final damage. Strictly validate the second root and its child and show a conditional source explanation only. Do not silently change the normal trap's calculation or its requirements.

## Skill-specific attack reach (2026-11-13, 0.721.0)
- Current OS 213605001 «Точная стрельба» / Sniper Nest belongs to SNIPER «Стрелок» Lv45, weapon BOW/CROSSBOW, TOGGLE; 213703001 «Двойной выстрел» / Arrow Fusillade belongs to PREDATOR «Охотник» Lv50, weapon CROSSBOW, MYSELF. Validate complete ordered source effects including paired ATTACKRANGE and ATTACKCARRY vectors; carry is a mirror, not twice the bonus.
- Only model `FV1[3]+floor(archery*FV1[2]/100)` as the effect coefficient. It is **not** proven final skill range, cannot be added to permanent attack reach, and is not automatically active even when eligibility is met. Report activation and requirements in ordinary RU/EN text.
- Apply source changes to both Skill Effects and Attack consistently and keep the 43-field Summary matrix unchanged.

## Tooltip and owner-editor Escape priority (2026-11-13, 0.721.0)
- An active inline text editor owns Escape. A pending/visible guide tooltip must dismiss itself without intercepting that key; otherwise failed CAS edits cannot be cancelled reliably.
- The isolated Chromium ui-content-inline flow arms a pending tooltip before editor Escape, verifies cancellation and preserves normal tooltip dismissal elsewhere.

## Human-readable skill effect models and range breakdown (2026-11-13, 0.722.0)
- Render individual skill-range terms as source constant and independently floored Ranged mastery contribution, never as automatically applied permanent attack distance or proven full active-skill reach. Use official bilingual mastery name and existing skill icon/hover tooltip in Attack.
- Both range-bearing skills in Skill Effects must pass the same full ordered OS source proof as the Attack skill-range panel. The paired ATTACKCARRY vector must be checked but not listed as a second source of increased range.
- Owner-editable new UI titles/help reuse standard RU/EN D1 guideLabel keys. Player descriptions must never say raw OS/Remaked/FV/EP internals or use unexplained developer coefficient labels; retain exact data and evidence in code and tests.

## Four enemy debuff sources (2026-11-13, 0.723.0)
- Source IDs 440001001 «Немощь» / Weakness, 440007001 «Слабость» / Weaken, 260004001 «Путающая рука» / Tangled Fingers, 440005001 «Мысленный удар» / Psionic Blast are **TARGET-side only**. Validate skill/class/branch/mastery/power stat and complete ordered FV1/FV2 vectors. Original RU and EN names must remain canonical by ID.
- An enemy's final Attack/Defense/Accuracy/MP change, resistance, duration and negative scaling stages are not proven. Show effects only as descriptive source previews with eligibility, never insert them in the hero's own stats or invent final numbers. Treat the different ATTACK and ARMORCLASS CONST/SCALE channels independently and do not sum them as an assured target result.
- Update the cross-module formula-coverage audit and tests whenever new roots become source-modeled; ensure one classification per learnable root.

## Fast, safe verification
1. Identify the affected UI handler and existing related test before coding. Reuse current equipment open/replace/unequip paths instead of duplicating mutations.
2. Fetch related files in batches; make one coherent patch, with a focused Node regression and an isolated Chromium scenario before a PR.
3. If local dependencies are available, run `node --test tests/<affected>.test.mjs` first. For a single browser scenario run `node scripts/dev-server.mjs` and `node tests/browser-smoke.mjs --only=<scenario>`. This mode skips the global desktop baseline and all unrelated flows.
4. On GitHub Actions, `Chromium browser smoke` → **Run workflow** → select the branch and optional `scenario` input. **This is manual diagnostic feedback only.** PR validation still requires the full Node suite and the impact-classified (full for gameplay JS) Chromium suite before merge.
5. When a full browser run fails, inspect the failed job logs for the **first failing scenario**. Repair and run **that scenario** before repeating the full run. Do not trigger full 46+ scenario suites for each one-line test adjustment if the targeted diagnosis is available.
6. Do not merge a failing or pending PR. After merging, verify both automatic GitHub Pages deployment and production read-only Worker/catalog readiness; do not run redundant full Node/Chromium again on merge.
7. Leave concise, grounded PR and Issue logs with commit SHA, exact tests and remaining blockers. No speculative "fixed in production" claims.

## Why this is needed
2026-11-11: Releases 0.631.0–0.632.0 occupied roughly 27 minutes because two browser iterations in PR #422 repeated the full 46-scenario Chromium suite while isolating an Escape propagation issue, and another set of unit regressions had stale fixture assertions. The browser discovered a real regression; **retain the final full check**, but use isolated diagnostics to avoid repeated unrelated work. See `docs/DEVELOPMENT_PROCESS_TIME_OPTIMIZATION_2026-11-11.md`.

## Character-state and browser-autofill regressions (2026-11-11)
- A newly equipped copy must not inherit the old copy's refinement, element/gem, Souls or manual socket capacity after unequip or swap. The shared `clearChangedEquipmentSouls` lifecycle clears all such per-copy keys on an item identity change. Never clear other slots' customization.
- No guest saved-build import UI, D1 legacy-preview action or implicit guest-library transfer on registration. Preserve only the currently edited character as an unsaved draft, and offer an explicit user-controlled save when the account has no earlier work.
- **Every gameplay/editor search input is NOT a login field.** Use Yandex's best-effort `autocomplete="none"` plus the standard `data-lpignore`, `data-1p-ignore`, `data-bwignore` markers. Keep genuine username/password fields semantically correct and editable. Don't introduce readOnly on normal text/search fields: it breaks normal typing and tests.
- Screenshot-based Yandex autofill behavior cannot be proven by regular Playwright Chromium: assert emitted DOM attributes and normal text entry, then leave a concise manual YaBrowser acceptance check. Run focused smoke first and keep final PR full CI.

## Source-validated utility skill parameters (2026-11-13, 0.708.0)
- `100061001` (Воля к жизни), `440008001` (Обуздание), `440006001` (Остановка времени) expose **only exact OS FV1 source terms**, not calculated final HP, cooldown, target evasion or healing. The incoming target is not the hero's permanent buff. Do not infer negative-coefficient target mitigation or stacking from these slots.
- Validate the full skill type/learnable/class/level/branch/requirements, exact unique TARGET EP rows and four-element FV1/FV2; fail closed when an OS record changes. `100061001` is a level-based Juggernaut skill although its `martial` branch cap is zero; do not use a blanket `cap>0` gate for level-only abilities without mastery requirements.
- `sourceParameters` uses `confidence:'source-parameter'` and its own audit classification, distinct from numeric final previews and Remaked `coefficient-model`. Render canonical RU/EN names by the OS skill ID; preserve class caps, D1, character and saved-build state.

## Current OS healing FV1 and Remaked stage reconciliation (2026-11-13, 0.710.0)
- Numeric Healing/periodic **preview models** derive coefficients from validated current OS skill FV1 and preserve Remaked rounding stages. Direct healing uses [INT%, level%, Healing mastery%, flat] with one final healing-rate floor; periodic recovery uses [SPI%, level%, mastery%, flat] with separate floors. Exact skill roots/child IDs and all FV1/FV2 slots must match. Do not infer live tick interval, duration, target mitigation or stacking from FV2 code.
- OS enhanced Heal 310004002 [1000,300,500,50], Sanctuary triggered 310023002 [200,0,200,100] supersede archived constants. OS Regeneration 310002001 [10,10,10,10], Restoration 310022001 [20,5,5,5], Natural Recovery 330005001 [0,10,0,0] now have source-derived level terms. Skill names by canonical OS ID only; never add these cast effects to permanent stats.

## Ranged skill ammunition sources (2026-11-13, 0.725.0)
- Three learnable BOW skills 213603002 («Ураган»/Arrow Storm), 213608001 («Пламенная стрела»/Kindling Arrow) and 213700501 («Внезапный выстрел»/Charge Shot) each have exactly one CASTER `EP_CONSUME_AMMO` with `fv2[3]=1` plus TARGET `EP_SKILL_EXEC`. Read the count as a **source ammunition parameter**, not verified inventory deduction, hit count or final damage.
- Model requires complete pinned root/child FV1/FV2 and class/level/branch/weapon checks, plus original 213603001 for the upgraded «Ураган». Linked burn, knockback and repeating damage are qualitative, without invented chance, duration or damage. Do not merge ammunition into permanent ATK or expose raw EP identifiers to the player.
- In the cross-module audit, source quantity is `numeric-preview` with `sourceModules:['skill-ammunition']`. Current counts: 65 numeric and 87 still-unmodeled learnable roots. Source names are the same current OS IDs in RU/EN; no guessed translations. D1, accounts, stored builds remain untouched.

## Source-verified combat techniques (2026-11-13, 0.726.0)
- `combatTechniquePreview` covers eight source learnable roots: 161201001, 161202001, 168001001/003, 100051001, 100054001, 121705001 and 142503001. Validate all source fields with `sourceVerifiedSkillSignature` plus child 161202050 and 142503002 and upgraded Blocking's parent. If any record changes, suppress that skill rather than retaining historical coefficients.
- Show OS-canonical RU/EN names, MP cost, cooldown and class/level/mastery/weapon requirements, not guaranteed hit chance, dismount odds, parry protection, shield-break success, final attack speed, damage, or permanent character buff. The preview is `verified:false`, `finalAmount:null`, `appliedToHero:false`.
- OS skills 100056001 («Отвлечение») and 100057001 («Безболезненность») exist, but martial requirements 70/100 exceed all current class mastery caps. Do not classify them as learnable model coverage unless a valid unlocking path is found. Source class flags alone are insufficient.
- Census as of 0.726.0: 65 numeric, 30 qualitative, 79 unmodeled learnable roots. No production D1 writes.

## Defensive/magic linked skill records (2026-11-13, 0.727.0)
- `specializedSkillPreview` is read-only for 168001004, 168002002, 168003001, 168051001, 420001001/002 and 420005001/002. Require complete `sourceVerifiedSkillSignature` matching for every skill and for parents 168001001, 168002001, 420001001, 420005001, and children 420001003, 420005003/004.
- Official current OS RU/EN names must come from the same numeric ID. Surface source MP, cooldown, class, level and branch gates; distinguish upgraded variants. The Paladin blocking magical effect, Guardian movement counter, shield knockdown and auto-guard have no verified success or final-mitigation formula. Do not treat them as unconditional bonuses.
- Psychic Blade triggered `EP_MAGIC_DAMAGE` uses distinct vectors for base versus level-50 variant. The full current OS server damage/defense/rounding kernel is unknown; **do not infer final hit damage or promote the vector to a verified model**. Soul Bright upgrade has a triggered concealment-related effect, not a permanent invisibility-detection stat.
- Audit at 0.727.0: 65 numeric, 38 qualitative, 71 unmodeled learnable roots. These are model-coverage counts, not verified server calculations; D1 remains unchanged.

## Source-backed support, cure and dispel skills (2026-11-13, 0.728.0)
- `supportEffectPreview` covers 310003001, 310011001, 310012001, 330101001, 330071001, 330072001 and 440002001/002. Pin the complete source signature (all effects, FV1/FV2 and class/mana/requirements) and the upgraded Dispel parent 440002001 and child 440002003; stale or changed records must fail closed.
- `310003001` Revive requires one CASTER `EP_CONSUME_ITEM` for OS item ID `50059` Holy Water, `fv2[3]=3`. Display its RU/EN name from actual current item/English catalog by that ID. This is a numerical **source material count**, not live inventory deduction, restoration HP, success chance or duration. It alone enters `numeric-preview` under `sourceModules:['support-effects-source']`; the other seven source-only qualitative effects do not become permanent character stats.
- Keep separate target semantics: Cleanse/Vivify cure ally statuses, Devotion shares caster MP, Mana/Soul Swap and Dispel target another character. Do not treat spell source coefficients as verified server results or as unconditional own buffs.
- Audit after 0.728.0: 66 numeric, 45 qualitative, 63 remaining unmodeled learnable roots. D1, accounts and saved builds remain untouched.

## Situational skill previews (2026-11-13, 0.729.0)
- `situationalSkillPreview` protects complete current OS source signatures for 220007001, 213606001, 230001001, 230002004 (including parent 230002001) and 520000001. Official RU/EN game labels must always come from matching source IDs.
- Detection, hiding and mount skills are contextual actions. Display exact source MP, cooldown and class/level/mastery restrictions, but not invented duration, invisibility success, final damage, or universal mount availability; never add toggles to permanent hero stats.
- The skill formula audit inspects crafting exactly once per each of 28 classes, not 784 redundant times. Coverage at 0.729.0: 66 numeric, 50 qualitative, 58 learnable without a separate model. Census is NOT a verified server outcome.

## Additional OS ammo source models (2026-11-13, 0.730.0)
- `rangedAmmoPreview` now additionally guards full signatures for 213602001 «Ядовитая стрела» / Cobra Arrow, 213603501 «Печать тишины» / Silence Arrow, 213701001 «Пятикратный выстрел» / Multi Shot. Verify internal linked effects 213603511 and 213603521 alongside Silence Arrow's root, including ALL FV1/FV2, directions, requirements and current numeric IDs.
- Current OS consume-ammo vectors are 1, 1 and 5; the five in Multi Shot are **ammunition cost**, NOT five proven successful hits. Source effect values, silence duration, poison chance and final damage are not independently proven. Show MP, cooldown and separate class/mastery/weapon eligibility. 213701001 is CROSSBOW-only and requires both archery 41 and trap 21. Never convert these skills into permanent hero stats.
- The ammo coverage audit checks both BOW and CROSSBOW eligible builds, counts each skill once, and excludes weapon-ineligible previews from numeric attribution. Updated totals: 69 numeric source previews, 50 qualitative, 55 still-unmodeled learnable roots. D1 and saved builds must remain untouched.
