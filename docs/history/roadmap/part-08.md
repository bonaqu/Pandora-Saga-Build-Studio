# История ROADMAP — часть 8 из 20

- [x] Replace repeated linear scans for prerequisite IDs with one render-local, first-match-preserving Map shared by nested readiness checks, growth marker state and the visible skill gallery/inspector.
- [x] Keep original cyclic dependency guard, level, job, mastery, learnability, unknown prerequisites and skill availability semantics; never trust fabricated skill IDs.
- [x] Add regression tests for valid multi-skill chains, missing links, cyclic links, duplicate IDs and the absence of accidental Array.find scans.
- [ ] Confirm in Chromium and Pages independently; current OS formula parity and production D1 write lifecycle remain open.

## Source update 0.244.0 — indexed milestones and logarithmic hover selection

- [x] Group source-backed skill thresholds in one pass, preserving all skills at a shared threshold, unreachable skills and the complete accessible unlock list.
- [x] Find the nearest skill tick via binary search over sorted cached fractions, retaining the same rail coordinates, native 18px range thumb, 10px hover tolerance and earlier-marker tie behavior.
- [x] Add close-threshold, multi-width, deterministic tie and grouping regression tests. No modifications to skill formulas, manual named-build saves, accounts, D1 or level-55 planning.
- [ ] Browser/Pages readiness and production D1 write lifecycle require independent validation; 39 unported and 77 partial Remaked keys remain outstanding.

## Source update 0.243.0 — remove obsolete named-build autosaver and cache skill hover geometry

- [x] Confirm the deprecated `saved-build-autosave.js` module is not loaded by the current HTML and is not imported/called by `pandora-studio-app.js`. Remove this unused old code path (it automatically rewrote named builds and contradicts explicit-save semantics). Keep the existing read-only and user-triggered save operations intact.
- [x] Replace its obsolete function-level tests with an explicit save contract: `persist()` only updates the owner-scoped draft, the saved-build cloud POST occurs only in `saveBuild()`, and deliberate Save New, Save and Create, and confirmed Overwrite are still the triggers. Preserve levels 1–55 and named-build preservation.
- [x] Optimize Hero Path threshold hover: normalize each source-backed skill threshold **once at render time**. On mouse movement use `mark.thresholdFraction`, avoiding repeated `getAttribute` and numeric parsing for every marker on every pointer event. Accessible marker attributes, tooltip, exact 18px range geometry and branch maxima unchanged.
- [x] Regression tests check stale module removal, source contract, hover DOM-read elimination and exact marker coordinate at multiple widths; full browser acceptance verifies real hover plus manual saved-build and guest/account isolation.
- [ ] Continue measured performance investigation and verified OS formula parity. 39 historical Remaked keys are still unported and 77 partial; live D1 write lifecycle remains separate from read-only release readiness.

## Source update 0.242.0 — verified account ownership and asynchronous /me protection

- [x] Validate stored and newly issued account sessions before accepting them: canonical username, 43-character bearer, safe future Unix-ms expiry and valid account object. A malformed 200 response to registration/login or recovery cannot replace an existing session, fallback into guest ownership or accept a malformed recovery code.
- [x] An authenticated `/api/account/me` 200 reply must have a **canonical valid username matching the stored session owner**; an unexpected identity or missing owner is treated as a failed identity validation, not silently replaced. An owner mismatch invokes existing session logout/guest transition while preserving the owner's saved library cache.
- [x] Protect asynchronous initialization from stale `/me` responses: capture bootstrap token and refuse to change/clear a newer session on late 200 or 401. Transient 503/network errors continue to retain the valid original session.
- [x] New sandboxed client-model tests for malformed sessions, mismatch, outage and late response; true Chromium acceptance injects an HTTP 200 different owner and verifies no cross-owner D1 PUT.
- [x] Remove never-read static `branchNames` array from `pandora-studio-app.js`: current canonical localized path navigation/catalog already owns branch IDs and labels.
- [ ] Keep full D1 authenticated live write lifecycle and server numeric formula parity open. Level planning remains 1–55; named-build explicit overwrite, account recovery and data remain unchanged.

## Source update 0.241.0 — remove dead milestone CSS, harden cross-tab acceptance

- [x] Complete source audit of all **27 active top-level JavaScript modules**: none creates retired `inline-branch-milestones`, `inline-milestone`, `path-threshold-tick`, `path-milestone-pin`, or `path-milestone-core` nodes; the live Hero Path uses `path-integrated-milestones`, `path-unlock-notch`, `path-current-notch` and `path-milestone-tooltip`.
- [x] Remove **65 unreachable legacy marker/diamond CSS rules (~8.1 KB)**, including repeated historical round markers and abandoned staggered layout overrides; preserve the real current 90-point bar, native range thumb, compact unlock ticks, current-value notch and existing accessible tooltip.
- [x] A post-merge 0.240.0 Chromium run initially timed out while testing concurrent Alice/Bob account tabs, despite the PR run and retry passing. Harden cross-tab smoke to wait for **both** account-owner scope, verified profile and complete OS catalog before entering a build name; require successful mock Worker POST with the **exact intended bearer + saved name**, not only a local card. Do not weaken any owner isolation assertions.
- [x] Add source regressions to prevent return of retired CSS selectors and preserve live value-marker/tooltip behavior.
- [ ] Finish more performance and dead-code audits with proof of reachability; independently test live D1 write lifecycle and in-game formula parity. The 39 unported / 77 partial Remaked keys remain open; planning stays 1–55.

## Source update 0.240.0 — vertical mastery value marker and shared geometry

- [x] Replace the visible 18px **gold ring** on the actual Hero Path skill/mastery rail with a **4×26px upright bevelled gold notch**, positioned at the selected invested-points value. Mark it decorative (`aria-hidden`), prevent hit interception (`pointer-events:none`), preserve original mouse/touch and 18px native range-thumb interactive hit area in Chromium and Firefox while hiding the round native artwork.
- [x] Reuse **one 21px rail inset and shared `positionOnRail` / `widthOnRail` functions** for the value notch, spent gold bar, trained green bar and red class limit. This avoids slight but cumulative alignment bugs at 0, 1, maximum, zoomed widths and future cap changes. Keep in-rail unlock markers, 90-point visual span, planning levels 1–55 and unchanged allocation semantics.
- [x] Remove the obsolete gold-ring thumb decorations instead of piling new specificity on the old circular UI. Preserve accessibility/keyboard focus and forced-color feedback.
- [x] Assert exact geometry mathematically across five widths and nine values; extend **real Chromium** `0→1→2→0` checks to verify the notch center, width/height, non-intercepting pointer events and keyboard ArrowRight allocation. Do not conflate unit tests with real browser pass.
- [ ] Continue source-backed combat formula parity, gameplay evaluation of status resistances and end-to-end cloud write acceptance. Avoid broad deletion of legacy CSS without proving it is unused by tested UI paths.

## Source update 0.239.0 — bilingual defensive resistance and status grid

- [x] Hero Book Defense uses current RU/EN for eight source-backed elemental/magic resistance labels (fire, ice, lightning, poison, charm, light, dark, magic), independently formatted equipment-gem contribution lines, and the known warding passive description.
- [x] Localize the complete twelve historical status-resistance labels without adding or removing mechanics: burn, stun, freeze, knockdown, knockback, sleep, silence, evil, weakness/curse, disease, madness and block break. Keep original source keys and raw signed values; no invented conversion of resistance indices to hit probability.
- [x] Translate the remaining physical-damage-change caption and user-facing note on unmodelled server immunities. All equipment, Soul, class and hero values are unchanged, as are saved-build semantics, D1 and account security.
- [x] New regressions cover every language pair, numeric wiring, gems, passive and original player-defined names.
- [ ] Further RU/EN attack/defense detail sections, authoritative server state proc resistance formula and full Remaked parity remain open. Hero build planning stays 1–55.

## Source update 0.238.0 — bilingual Effects gemstones, healing, mana, potion breakdown

- [x] Full RU/EN choice for the Hero Book Effects gemstone subsections: seven elemental labels, weapon aura, total aura, magical weapon enhancement, armor resistance, status chance, rainbow gems and the existing explanation of aura/physical damage. Values, source attribution and numeric formulas unchanged.
- [x] RU/EN explanations for Healing Skill effectiveness and its honor/gear contributions, MP cost index, base INT, racial passive, gear/Souls and explicit limits of the preview.
- [x] Potion recovery effectiveness now shows official model portions in RU/EN for base stamina, human Herbalist, warrior melee mastery, honor and equipment/Souls. The base-versus-additive percentage sign is tracked structurally as `isBase` instead of inspecting a Russian string; negative values no longer display `+-`.
- [x] New tests assert locale text paths, known numeric source fields, sign treatment, lack of translated source/player names and existing bilingual Book behavior.
- [ ] Still pending: complete RU/EN in some attack/defense detailed captions, browser and live game calculation parity, D1 real write lifecycle/manual user acceptance. Preserve levels 1–55 and existing build persistence.

## Source update 0.237.0 — full bilingual skill inspector and Honor Book controls

- [x] Skill Results inspector now explicitly receives current document language and the localized original branch names from the class/skill catalog. Numeric level/mastery requirements, search placeholder and accessibility labels, available/locked status, mana/casting/cooldown labels, result counts and help copy display entirely in the selected RU/EN language without fuzzy item or player-name translation.
- [x] The Hero Book Buffs screen now uses the exact preserved English Honor title strings for selection and the detailed original Honor effect labels. The stored integer Honor title ID remains identical in RU and EN; all effects and computation stay untouched.
- [x] Source-specific combat-skill gating message: only a skill **actually requiring mastery** can say so, with its real branch and amount rather than a blanket `26 points of slashing mastery` across unrelated skills. Combat/Wind buffs show English or Russian status, shield/weapon prerequisites and numeric effect summaries in the chosen locale.
- [x] Read-only skill inspector continues to display already-translated official OS skill names/descriptions; no guessed English name, fake damage or live skill activation. Test vectors cover RU/EN output, class/branch gates, preserved title IDs and player-defined text.
- [ ] Remaining separate translations of dense combat/equipment explanatory sections, live in-game numeric parity and browser/manual mobile + keyboard experience still require verification.

## Source update 0.236.0 — verified OS periodic healing/recovery source effects

- [x] Match the current OS skill identity and **full** `fv1`/`fv2` vectors, direction, type, class, level, prereq, learnability and branch thresholds for `310002001` Regenerate, `310022001` Restoration and `330005001` Mana Restore. An altered EP, tick interval, magnitude, class or mastery requirement cannot become a legitimate preview.
- [x] For periodic HP healing, check that the class's true `benevolence` limit permits the skill and that effective mastery is within it; unrelated invalid mastery does **not** remove valid Ascetic-family mana recovery. Level 20 remains required for the latter. No skill is activated automatically and no effects are credited to permanent regen.
- [x] Preserve original Remaked `LPsec`/`MPsec` formulas and historical warning of uncertain server application. Pass class branch caps from current real character model, not from user-editable allocations.
- [x] Unit regressions reject corrupted child vectors, incorrect EP or directions, invalid class, impossible thresholds and missing catalog; validate that filtering does not change max HP/MP or base stats.
- [ ] Actual live OS periodic recovery mechanics, stacking and ultimate health/mana gain still need in-game comparison. Further formula branches, real D1 writes and mobile UI acceptance remain open.

## Source update 0.235.0 — OS area song chain previews

