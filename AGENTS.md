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
- In **Результаты расчёта**, body/mind resistance rows use the existing label tooltip; do **not** reintroduce a large or separate ⓘ warning. Real line breaks only; legacy literal `\\n` must be displayed as newlines, never HTML.
- Defense's body/mind explanation shares the existing `guideedit.book.summary.40/.41` RU/EN D1 records, not independent hardcoded copy. All twelve individual resistances have short `defense.resistStatus:<channel>` RU/EN hints stored through `guideedit.book.*`. Use the unified multiline editor for hints and preserve D1 CAS behavior.
- Item/Soul `EP_IMMUNE_*` and grouped `EP_IMMUNE_VIT_TYPE/SPI_TYPE` are separate inputs. Keep the source-backed honor/racial/Warding contributions isolated; **do not treat group resistance or historical elemental dependencies as a verified individual 2026 OS status-roll formula**. The `verified:false` source limitation stays visible in code/audits until independently supported.
- Preferred RU status is `Немота` / EN `Silence` (not improvised `Молчание`); existing OS label IDs and historical sources take priority over loose translation.

## Shared priest UI and numerical display (2026-11-12)
- In the external priest section edit SPR (СД), Blessing and Hymn **once each**; do not duplicate caster input fields alongside priest skills. Keep persisted legacy Benevolence/Exorcism values and original requirements intact.
- Only add contextual input fields for allied skills when OS/Remaked source evidence proves an independent caster dependency. Natural Recovery presently has a fixed source effect vector, so no speculative extra field.
- Avoid long internal formula-confidence labels in player-facing descriptions when a numeric source-derived value is available. Record technical provenance and unresolved game mechanics in issues and code; never present a bare coefficient as guaranteed final damage.
- Preserve individually established floor/ceil calculation stages; do not globally replace arithmetic.

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
