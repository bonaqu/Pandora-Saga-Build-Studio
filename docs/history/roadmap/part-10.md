# История ROADMAP — часть 10 из 20

- Fix a subtle 0.221.0 deduplication weakness: two catalog items can share the same visible/localized name and effect code but represent **different source IDs**, while one item can carry multiple proc variations of the same code. Dedup by exact catalog source + code + skill ID + probability + direction instead of display name.
- Use per-identity **occurrence counts**, so two copies of a source lose only their exact corresponding duplicate previews. Uncorroborated other sources and distinct procs stay visible with probabilities hidden unless description-verified.
- Keep the nine on-hit rules, Traveler Boots Gust, zero-on-blur branch editing, saved builds, accounts, Cloudflare D1 and 1–55 planning untouched. Add standalone regression vectors for name collisions, multiple procs and repeated sources; combat server chance rolls still unverified.

## Source update 0.222.0 — owner-approved blank input resets spent or manual mastery

- Intentional input clearing followed by `change` (blur/tab/click elsewhere) resets **that branch** to 0 in both invested/spent and manually trained/green mastery fields. This supersedes the blank-input preservation introduced in 0.220.0.
- Keep negative, fractional and nonfinite inputs rejected, while numeric zero still refunds. Resetting invested potential also clamps this branch's trained mastery and refunds its allocation budget; clearing manual mastery does not decrease invested potential.
- Commit changes to the existing local draft through unchanged handlers, never silently overwrite an already saved named/cloud build; preserve other branches and planning 1–55.
- Add direct event-handler tests and real Chromium focus-transfer checks for both fields. No D1 migration, authentication or game formula change.

## Source update 0.221.0 — accurate conditional percentages and no repeated proc descriptions

- Restrict numeric conditional-proc previews to values explicitly corroborated by their own item/Soul text, instead of treating any raw `effect.b` as a user-facing probability. Keep unquantified events visible without percent claims, and explicitly conflicting Vampire Soul chance hidden.
- Add the exact **Traveller Boots** (OS item 15082, `EP_ONDAMAGE_SKILL_EXEC` for skill 260003001, `b=8`, TARGET) as a source-backed on-physical-damage Gust proc with matching original 8% description. Reject altered IDs, direction, code, chance, source text and invalid enhancement grades.
- Deduplicate generic and detailed previews of the same source+effect code in the hero book without discarding any unique event or adjusting battle statistics. The standalone generic preview remains available for diagnosis/tests.
- Preserve full 1–55 planning, nine previously confirmed on-hit descriptions, manual build-save semantics, accounts, D1 and administrator access. Formula/server combat parity remains open.

## Source update 0.220.0 — one-pixel tick glow and safe numeric edits

- Reduce only the soft glow blur on hovered/focused 3×12 px skill unlock ticks from 2px to 1px. Keep the permanent one-pixel border, focus outline, geometry, tooltip, and pointer-safe slider interaction intact.
- Reject blank, negative or fractional precise branch investments and manual mastery edits without sending a zero or invalid number to state mutation. Restore the accepted value in the input, keeping slider and green mastery consistent; valid zero remains a deliberate refund.
- Add Chromium assertions for the 1px computed glow and blank-input preservation, plus Node handler tests for invalid and valid investment/mastery values. Preserve 0→1→2→0 layout stability, current builds, D1, auth and level 1–55.
- Pages publication, browser QA and Cloudflare Worker deployment require independent verification.

## Source update 0.219.0 — nine data-verified on-hit triggers

- Expose nine official OS item/Soul on-hit skill procs through the existing natural-language special-effects preview. Every chance must match the original item/Soul description **and** structured effect B field, with exact source ID, effect code, skill ID and direction. Effects are not automatically applied to combat totals or treated as server-proven.
- Confirm three classic weapons with knockdown or stun procs, the Iron Staff 4% stun, and five Souls with original 4/5% stun, weaken, sleep, poison and slow statuses. Preserve grade conditions.
- Explicitly exclude inconsistent Vampire Soul (description 4%, data B=5%), weapons with only an unspecified activation probability and mixed attacker/defender triggers. Do not silently resolve conflicting historical game information.
- Retain fixed branch-header geometry, source 1–55 planning, existing account and D1 state, and manual saved-build overwrite rules.

## Source update 0.218.0 — eliminate branch-header layout shift during mastery drag

- Remove the redundant mastery subtitle that was conditionally inserted into branch headers at 0→1 point, causing a second line and vertical editor/slider jumps. The same actual mastery value remains visible in the numeric green control; branch title and spent/cap remain a single stable line.
- Truncate only long branch names via ellipsis when needed and prevent the right-hand count from wrapping. Check 0→1→2→0 with a live Chromium bounding-rectangle comparison of the header and editor, plus unit-level structure/value assertions.
- Reduce the thin vertical skill marker hover glow by one CSS pixel (3px→2px), without changing the permanent 3×12px tick size, source skill tooltips or threshold positions.
- Keep the explicit save behavior, level 1–55 planning, user accounts, D1, and all existing game computations untouched.

## Source update 0.217.0 — source-backed 3% physical-evasion preview

- Surface only the verified physical-evasion special effect on current OS item 11552, `EP_DESTINE_WARDING` +3% TARGET, through the existing equipment special-effects preview. Do not apply it to numeric static Dodge and do not simulate successful avoidance/trigger chance.
- Reject unrelated items, values or source direction and honour refinement gates. Test the original item source and ensure effect coverage remains conditional.
- Formula parity with the OS combat server remains incomplete, and this addition is a source-backed conditional item description, not a completed combat mechanic.
- Preserve the user-approved thin vertical skill notches, one-line Spent/Mastery controls, D1 schema and manual save rules.

## Source update 0.216.0 — user-requested slim vertical ticks, MP-cost previews and inline controls

- Restore the preferred three-pixel vertical skill-unlock ticks within the 12px track. Preserve exact skill unlock positions, the 0–90 bound, three status colours, keyboard focus, proximity hover and unobstructed range dragging. No large diamond indicators or persistent glow.
- Pull optional MP cost only from source-backed `skill.mana`; retain original skill icon, name, description and point threshold in the same small tooltip. Never infer missing costs.
- Put `Вложено / Spent` and `Мастерство / Mastery` in one flex row with identical 28px fields, mild green mastery accent, contextual label help, automatic wrapping on narrow screens.
- Update regressions and Chromium actual-layout assertions, and inspect desktop/mobile screenshot artifacts. Leave user save semantics, D1, formulas, character starting level 1 and planning through level 55 intact.

## Source update 0.215.0 — readable in-track unlock threshold markers

- Replace full-height ruler ticks on the shared mastery/allocation bar with 8×8-pixel diamond glyphs drawn by CSS. The markers keep exact positions, and their colour indicates whether a skill threshold is achieved or beyond the class cap.
- Do not add separate image icons or extra buttons on the track. Render only numerical thresholds between 0 and 90 on the rail; future skill requirements exceeding 90 remain in the accessible expanded list. Preserve accessible tabindex, proximity-based hover tooltips, pointer dragging, and numeric input controls.
- Check by full Node and Chromium desktop/mobile regressions, including generated layout screenshots. No changes to game formulas, stored builds or D1.

## Source update 0.214.0 — valid branch icon fallback without broken files

- Remove nonexistent default icon path `assets/ui/icons/skill-unknown.svg` from the skill branch image resolver. Missing source art should be represented by the caller's neutral glyph, not by a broken network resource.
- Treat the 19 actually archived branch icons as an exact allowlist; inherited JavaScript object names must not be considered real branch artwork.
- Cover every path's physical existence and unknown/malformed branch handling in Node tests. Formula and D1 behavior remain unchanged.

## Source update 0.213.0 — correct Remaked periodic HP recovery to use effective SPI

- Repair two Remaked `LPsec` preview calculations that mistakenly used hero level instead of the actual SPI attribute. Use source-backed formulas `15 + floor(SPI/10) + floor(benevolence/10)` for Regenerate and `7 + floor(SPI/5) + floor(benevolence/10)` for Restoration.
- Pass the effective SPI from the current hero's actual calculated attributes; preserve character level for skill gating, not the numeric recovery pulse.
- Keep preview separate from passive regeneration and current HP/MP. Legacy computations remain historical unless validated against current OS gameplay.
- Extend source-backed vectors, level-independence checks, missing-data validation, and 1–55 coverage; no D1 or build-data changes.

## Source update 0.212.0 — never refetch known HTTP 404 game icons

- Once the versioned self-hosted manifest has loaded, its explicit HTTP-404 missing records are the authority for whether an original sprite was absent at archive time. Do not repeatedly request an unchanged missing source on each redraw.
- Prefer verified user overrides and original local WebP files; keep unverified source errors eligible for future fetching. For source-backed absent assets, a plain neutral glyph is safer than inventing a game icon.
- Ensure racial passives do not create an empty <img> when no URL is available. Protect skill/item/Soul resolvers and missing-sprite fallback with Node regressions.
- Gameplay formulas, D1 migrations, account secrets and 1–55 progression are unaffected.

## Source update 0.211.0 — local archive of 1,173 original OS item, skill and Soul images

- Confirmed official current game server original WebP endpoints; imported 286 skills, 876 items, 11 Souls as local assets under `assets/*/icons/`. Each preserved source file passed RIFF/WebP validation, 0 corrupt; archive and manifest live in the Git branch.
- Source inventory 1,437 expected = 1,173 present + 264 HTTP-404 missing (260 skills and 4 items). Missing game images are NOT faked, borrowed or counted as present; retain future recovery task for actual original assets.
- Source URLs for Souls were wrong in the previous mirror tool. Verified they share `/icons/items/` upstream, while self-hosting copies as `/assets/souls/icons/`. Prefer these in runtime icon resolution.
- Added strict archive/manifest integrity tests and a regression against reintroducing nonexistent Soul URL paths. Used a one-time isolated asset-import workflow and removed it from the proposed final repository diff.
- Formula parity, save overwrite rules, D1, admin discovery and 1–55 planning stay unchanged. Public Pages deployment still requires independent success verification.

## Source update 0.210.0 — proper EN Hero Path status, prerequisites and skill details

- Translate player-facing labels in skill readiness, point/mastery requirements, branch summaries, skill metadata and status banners without changing game data IDs or source-backed translations.
- Localize the character's skill point budget and workbench chapter names in English; preserve RU wording.
- Extend Node and Chromium acceptance checks of real skill panels, budget and language switch.
- Never alter 1–55 planning range, automatic save restrictions, Cloudflare schema or private admin discovery behavior.

## Source update 0.209.0 — protect one-time recovery codes and label skill scale

- Keep the server-issued account/recovery secret in transient profile memory only. Accidentally hiding the profile must not irreversibly discard the only visible code; let the owner acknowledge it explicitly. A reload or sign-out clears it, with no password or recovery secret written to persistent browser storage.
- Show the code before running any account library synchronization so a slow or failed cloud refresh cannot delay access to the one-time credential. Keep a copy button, keyboard-select fallback, and RU/EN strings.
- Add noninteractive scale labels for 0, profession limit, and 90-point planning endpoint below the current shared slider. Preserve exact unlock notches, tooltips, and draggable slider. Respect reduced-motion preference.
- Add source and Chromium regressions; do not claim live account acceptance, deployed browser acceptance or formula parity without independent evidence. No D1 schema modification.

## Source update 0.208.0 — show library recovery key only for the guest who owns it

- A signed-in account previously saw a «Показать мой код» transfer control that actually revealed this browser's unrelated **guest** secret. On a new device signed in to an existing user account, that guest key is not the account's owner hash and cannot recover account builds.
- Hide guest-library recovery/transfer controls while an account is signed in. The actual saved account library continues to appear under «Мои билды» and transfers by username/password; after logout the separate guest key can be shown again.
- Preserve all legacy guest recovery and explicit cross-device guest-code flows. Add source test and Chromium assertions that signed-in and guest modes show only their appropriate controls.
- No change to password sessions, user-account database schema, 1–55 planning levels or game formulas.

## Source update 0.207.0 — keep guest cloud secrets isolated across tabs

