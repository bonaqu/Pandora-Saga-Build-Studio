# Pandora Saga Build Studio — working rules for coding agents

These repository-level rules are durable instructions for future coding sessions.

## Source of truth and safety
- Work in `bonaqu_projects` through focused PRs. Inspect current branch HEAD, open PRs and relevant issues **once**, before editing.
- Keep all gameplay formulas, character state, saved Souls and catalog data unchanged unless the issue requires a verified change.
- Cloudflare D1 is authoritative for game data. Do not claim successful **production writes/rollback** from mocked CAS browser tests or read-only readiness. Issue #203 requires separate owner approval for any live temporary write.
- Owner-editable RU/EN UI copy uses existing D1 override keys and unified inline editors. Do not reveal internal IDs in player-facing text.

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
