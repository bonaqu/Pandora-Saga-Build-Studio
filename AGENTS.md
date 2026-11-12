# Pandora Saga Build Studio — working rules for coding agents

These repository-level rules are durable instructions for future coding sessions.

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
