# Pandora Saga Build Studio — implementation roadmap

**Updated:** 2026-11-01 · **Latest source release:** 0.238.0 (`2026.11.01.238`), browser and Worker deployment require independent verification  
**Source branch:** `bonaqu_projects` · **Desktop-first:** 1920×1080, 2560×1440, 3840×2160 · responsive mobile

This is a durable, evidence-led work plan. A GitHub Pages deploy proves assets were published, **not** that a feature passes real-user browser flows, actual Cloudflare Worker deploy, or game-calculation parity.

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

- [x] Validate complete official source chains for `Minstrel's Song` (340001001 → 340001002 → 340001003), `Peaceful Hymn` (340003001 → 340003002 → 340003003) and `Sage's Song` (340004001 → 340004002 → 340004003). Verify parent/area/recipient skill ID, type, required branch thresholds and every current structured function/vector. A forged/missing link does not earn a confirmed preview.
- [x] Display only the songs possible for the chosen class mastery caps, distinguishing requirement fulfillment from actual application. Cleric can access Minstrel + Peaceful, Enchanter Minstrel + Sage, Exorcist Minstrel. At actual zero or insufficient mastery display unmet requirements rather than active buffs.
- [x] Hero Book → Buffs has an optional collapsed RU/EN song index with gameplay effect descriptions. Numeric `EP_DAMAGE_CLEAR` and buff payload parameter arrays are **not** turned into fabricated live damage thresholds or automatic player stat changes. Existing Remaked legacy song previews remain read-only and separate.
- [x] Unit vectors: valid source sets, invalid class, missing or mutated nested skills, fake requirement or effect fields, cap bounds, both languages, and invariance of HP/MP/attack when a song's learning requirement is met.
- [ ] Still required: active-song toggling only once modern source application/expiration is verified, server battle parity, remaining historical formula keys and independent mobile/keyboard acceptance.

## Source update 0.234.0 — source-gated healing skills and bilingual recovery

- [x] The five historical Remaked healing magnitudes (First Aid, Heal, Healing Aura, Sanctuary, Restoration) keep their previous arithmetic and **do not automatically apply healing**. Learning/availability is now a separate current-OS decision: exact original skill ID, target effect and vector, required mastery, level, character class, real class mastery cap, learnability, prerequisite skill and Sanctuary's nested healing link.
- [x] Cleric level 50+ uses OS skill IDs 310001002, 310004002 and 310021002 for their respective historical variant previews; pre-50 uses base IDs. Unknown/altered OS catalogs or impossible class skill budgets cannot claim availability; theoretical values remain visible without forcing a rebuild or rewriting saves.
- [x] Localize healing/periodic recovery spell names and full rows to RU/EN using official indexed skill names (First Aid, Heal, Healing Aura, Sanctuary, Restoration, Regenerate, Mana Restore), with distinct localized requirements and HP/MP units.
- [x] Add source-tampering, class-cap, numeric-invariance and RU/EN regressions; keep all existing cloud/guest/account/admin and level 1–55 behavior.
- [ ] Confirm game-client healing packets and all unknown Remaked keys before claiming exact modern OS parity. Browser responsive/keyboard acceptance and live D1 writes still need separate testing.

## Source update 0.233.0 — validate six Soul-to-creature effects and bilingual result details

- [x] Require a canonical Soul ID/source, exact OS family ID (502, 504, 505, 508, 511, 512), -3 effect, SELF direction, 0–10 enhancement limits, body socket type and the official Russian **or** English source description before showing a creature-specific incoming-damage modifier.
- [x] Preserve each socket as an independent preview. Do not silently add the six conditional damage effects to permanent armor or claim a known live-server stacking rule.
- [x] Use OS-localized enemy names in RU/EN Hero Book. Note the catalog mismatch: OS English Soul 103034 says “Unliving” while Russian says “големами”; do **not** silently equate that category to historical Remaked RESInanimate.
- [x] Translate known numeric composition lines in Attack/Defense/Recovery chapters with a fixed safe whitelist; never perform fuzzy translation of source item descriptions and user-defined character names. Negative tests reject forged source keys, descriptions, grades, wrong family and direction.
- [ ] Full Remaked combat equivalence, live OS damage packets, remaining formula keys, Cloudflare D1 writes, keyboard/mobile browser acceptance and additional localizations are still open.

## Source update 0.232.0 — bilingual Hero Book sets and recovery effects

- Finish RU/EN display for active equipment sets: titles, familiar bonus names, item piece counts, enhancement and fall-protection condition. Keep the original underlying `unison.json` calculations and fully localized item names.
- In Hero Book recovery, translate potion-healing captions, on-use check, HP/MP sections and units, encyclopedia item names, and status-cure section. Add exact English companion labels for the seven current OS `EP_RECOVERY_*` effects without changing their actual targets.
- Retain collapsed large lists, no invented potion effects, no hidden administrative diagnostics, saved named-build edit rules, account/D1 behavior and planning level 1–55.

## Source update 0.231.0 — source-linked on-use consumable skill index

- Add a compact **collapsed** recovery-book catalog for OS consumables explicitly activating linked skills on use via `EP_SKILL_EXEC` and `EP_SKILL_EXEC_BALM`. Current OS snapshot has **38 distinct BALM/POTION items with 49 effect links** (two skills from Life Force Potion, and repeated links on several balms); each named skill is resolved by numeric ID from the current localized RU/EN skill catalog.
- Make every item row clickable to the existing encyclopedia and reuse its translated item name/icon. Never add those *optional, not consumed* effects to a hero's current buff/HP/MP/combat totals, never claim duration/cooldown if unsupported, never create an active consumable selection or cloud write.
- Reject records with unsupported type, mismatched item ID, unknown skill, wrong direction or invalid effect identifiers; use actual official OS POTION and BALM records and language tests. Status cures and consumable HP/MP recovery remain independent.
- Preserve all named/cloud builds, 1–55 planning, admin entry, account scopes and D1 schema.

## Source update 0.230.0 — original OS battle-map-only cloak bonuses

- Add a separate Hero Book Effects preview for **nine** source-backed battlefield cloaks (OS item IDs 18022–18030). Every item requires canonical source ID, cloak slot, valid enhancement and the precise RU/EN original map-only description, plus its mapped OS skill 500000044/45/46 and exact structured EP effect rows including `EP_LOST_MAPCHANGE`.
- For the three ranks show source values **+2/+3/+5 to all attributes**, **+1/+3/+5 armor**, **+300/+1000/+2000 HP**; top-tier OS skill also has **+5 resistance to all damage types** and **+10 magic resistance**. Only show as map-conditional effects and **never** add them to usual stat/combat totals outside a declared map context.
- Prevent another equipped item with a similar EP code or forged skill rows from inheriting these exact battlefield bonuses; fail closed for incorrect language descriptions/grade/source and unknown skills. No speculative server map ID behavior beyond the explicit OS cloak text.
- Keep manual save semantics, D1, account controls, new build level 1 and long-term plan through 55.

## Source update 0.229.0 — no unverified generic proc rates and asynchronous guest cloud assertion

- Generic conditional-proc entries now reveal numerical rates **only when the exact on-hit/on-damage event** is independently supported by a source-ID/EP/skill/direction/chance and RU/EN exact phrasing rule already used by detailed proc previews. A merely coincidental percentage from unrelated item prose cannot appear as a trigger rate. Unverified events remain present, but without claimed percentages.
- Two similarly rated 4% triggers on the historical Wind Lord Fan remain visible yet unquantified until exact original trigger-to-skill mapping is established; conflicted Vampire Soul still marked disputed. All ten already corroborated items/Souls retain their respective 4–9% RU/EN previews.
- Chromium concurrent-guest library test now awaits each exact **successful** Worker POST response containing the correct guest bearer token and build name, rather than asserting network side effects immediately after the local build card appears. A real missing/misrouted cloud save will still fail. No user account/build persistence logic changed.
- Preserve automatic local draft and explicit named-build overwrite, level 1–55 planning, game formulas and D1 schema.

## Source update 0.228.0 — exact RU/EN provenance for special equipment/Soul effects

- Tighten nine on-hit and Traveler Boots descriptions to the specific originally published RU/EN trigger phrase, not any arbitrary mention of the same percentage; require exact source ID, effect code/parameters and current grade validity. All source-backed RU/EN examples remain visible.
- Four unusual Soul/item effects (Unfortunate Soul, Gnashing/Stubborn Heart, Cursed Rod, Dawn Veil) require exact source key, ID, full structured effect parameters and original RU/EN phrasing. Prevent a different item/Soul with a similar effect code or superficially matching chance from inheriting its displayed behavior.
- Source discrepancy: RU Stubborn Heart description says trigger near 5% HP, while the EN archive says 5% chance when LP reaches 0. The UI now labels the **conditional effect** without inventing a single HP threshold/probability. All incoming-critical text is conservatively limited to physical attacks in the description due to EN source language. No server roll or new combat formula asserted.
- Regression tests cover all 13 precise proc/special cases across two locales plus tampered sources, grades and conflicting descriptions. Existing builds/D1/auth, manual save and planning 1–55 intact.

## Source update 0.227.0 — locale-invariant enhancement fallback

- Keep the authenticated original Russian OS item description as `sourceDesc` on **translated equipment records only**; display the official translated EN description and name as before. The existing narrow narrative-refinement fallback parses source text rather than language-dependent display prose.
- Structured OS `itemForth.json` snapshots remain higher priority, with no duplicate additions or new unsupported combat rules. Real Gladius ID 2 (enhancement +0/+1/+5/+7/+10) is compared in RU and EN for both fallback and structured Forth, including +60 MP and official +7 agility once.
- No user-visible technical commentary, no persisted-build schema migration or D1 write, and permanent 1–55 build planning retained.
- In cross-account Chromium acceptance, wait until the scoped local library owner marker has switched to the requested account/guest before attempting to save. Keep every no-cross-owner-D1-PUT assertion; the initial race grid alone does not mean account bootstrap is complete.

## Source update 0.226.0 — source-ID and grade-safe OS equipment sets

- A stored item counts as an OS unison set root or companion **only** when it has a canonical `item:<numeric id>` source, that ID agrees with the actual catalog record, and enhancement is an integer +0…+10. Unknown, mismatched or corrupted rows cannot activate a complete set.
- Deduplicate companion IDs while excluding the set root itself, including for future catalog updates. Set activation still uses verified OS min/max companion and root-grade rows, and existing calculations/rounding remain unchanged.
- Test all three actual OS sets plus malformed root/companion grades, forged source IDs, root-self membership and repeated companions. Preserve state data in existing builds without irreversible cleanup; no D1 or auth changes, permanent 1–55 planning intact.
- Stabilize the complete browser test: the Hero Path skill-milestone scenario must wait for the full validated D1/local catalog to finish loading, not only the early race grid; continue to test actual branch rendering, tooltips and 0→1→2→0 interactions.

## Source update 0.225.0 — RU/EN conditional chance verification, actual skill localization and enhancement validation

- Match source-backed percentages from both original RU `шанс/вероятность` and EN `chance/probability` item/Soul descriptions. An item containing two different quoted proc chances does **not** yield an invented one-to-one match; leave both generic rates unspecified until an event-specific source check exists.
- Traveler Boots (OS item 15082) exact 8% on-physical-damage skill 260003001 now passes either verified RU or official EN descriptor. English caption uses official ID-keyed skill **Dash**, not the earlier informal **Gust** label. Changed numbers, source IDs, effect directions or descriptions still fail closed.
- All generic conditional, detailed special-equipment and experience preview source rows require enhancement grade integer +0–+10; out-of-range records contribute no displayed proc/rate.
- Add source-backed RU/EN, conflicting Vampire Soul, multi-percentage and invalid-grade vectors. No speculative server proc rolls, battle engine formula, storage migration, account or D1 write; planning 1–55 preserved.

## Source update 0.224.0 — bilingual equipment proc and experience sections

- In the Hero Book effects chapter, switch headings and structured conditional-proc triggers between RU and EN based on the chosen site language. Add proper English names for the generic Stun and unknown-special-effect fallbacks; when an OS skill has a name, reuse the localized catalog's existing name.
- Use the already supported official `strings.en.json` ID-based names for skills/items via the existing `app.js` localized catalog. Do not fuzzy-translate user-edited text or invent missing game terms. Experience-bonus title and percent suffix are also bilingual.
- Retain source-accurate chance corroboration, source-key dedup, all stored builds and account logic, no server-formula additions, and planning levels 1–55.

## Source update 0.223.0 — lossless multi-proc book and source identity

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

- Confirmed official Pandora Saga OS original WebP endpoints; imported 286 skills, 876 items, 11 Souls as local assets under `assets/*/icons/`. Each preserved source file passed RIFF/WebP validation, 0 corrupt; archive and manifest live in the Git branch.
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

- Capture each tab's **own** account-free D1 library secret at startup. If another tab connects to a different 64-character guest library key, the first tab continues using its original secret for GET/PUT, public-link creation, displayed recovery code and optional account registration linkage.
- Explicit in-tab «Подключить и объединить» updates that tab's guest identity and merges **its own** existing local snapshots. A different tab's currently active browser-local records cannot be carried into the newly connected guest library.
- Account-scoped tokens retain higher priority when the user is signed in. No storage secret is embedded in an external URL or logged as a browser diagnostic.
- Source and pure Node tests cover carryFrom and guest data isolation; fake-Worker Chromium tests use two simultaneous guest tabs with different D1 keys and assert no PUT to the other key.
- All level 1–55 planning, database migrations and direct source-backed game calculations remain unchanged.

## Source update 0.206.0 — prevent browser cross-tab account library contamination

- Accounts open in multiple tabs share the same origin-localStorage but not the same in-memory session. All saved build writes, current hero drafts, active saved-build references, shared-library imports and pending deletion queues now use `PandoraBuildScope.setOwned/getOwned` with their initiating account or guest library identity.
- A stale Alice tab writes **only Alice's isolated recovery cache** when another tab has switched the global active storage scope to Bob. Bob's primary localStorage records and pending deletions remain unchanged; switching back restores each owner's own saved records.
- Retain compatibility with the pre-0.197 guest backups, existing active storage keys and accountless D1 keys; avoid rewriting unrelated localStorage secrets or account session tokens.
- Add isolated Node tests for Alice/Bob simultaneous ownership and a fake-Worker Chromium scenario with two actual tabs saving independently. No Cloudflare migration, auto-save of unsaved heroes or game formula changes.

## Source update 0.205.0 — no false cloud-save success messages

- An explicit saved-build overwrite updates the current browser draft first and requests the cloud PUT. The confirmation toast now accurately reports only **browser persistence and pending cloud verification**, instead of claiming D1 successfully saved before any Worker response.
- Successful D1 PUT explicitly controls the separate cloud status; HTTP 5xx/network errors remain visibly marked as browser-only until cloud reconciliation. The player never receives an incorrect success receipt.
- Add RU/EN label and isolated Chromium fake-Worker failure flow: 503 during overwrite, unchanged cloud original, preserved local revision, reload creates an unpublished conflict copy (no automatic retry into the deleted or stale cloud ID).
- No game formulas, account data, or migration modified.

## Source update 0.204.0 — prevent false cloud conflict copies from reordered JSON

- Compare saved character snapshots by actual nested JSON values, not the original insertion order of object keys. Account, old-build migrations, D1 serialization and browser file imports can rearrange fields while the character itself remains identical.
- Preserve array order, equipment IDs, stats, character level and all genuinely different saved choices. Cloud D1 remains the primary record for the same ID; conflicting local edits still become unpublished recovery copies.
- Add functional Node regressions for re-ordered nested stats/equipment/Souls with a 55-level future sword, genuine gear differences and array-order conflicts. This change does not upload any new data or alter manual D1 overwrite consent.

## Source update 0.203.0 — real Hero Book RU/EN interface translations

- Hero Book chapter headings, tabs, accessibility names, summary labels, buff names and many known combat/equipment headers now use exact, two-way RU/EN interface keys.
- The English chapter names are **Summary, Attack, Defense, Potions & skills, Effects, Buffs**; switching language while using the Hero Book updates rendered labels and controls without rewriting official game entity IDs or freeform character data.
- Translate unit and skill settings in the saved Hero Book UI, including source-defined labels such as HP/MP, guild bonuses and individual combat skills. Unknown official game strings remain unchanged until ID-backed translations exist.
- Add Node and Chromium tests of book chapters, English summary, buff chapter, access labels and unknown source strings. Other game mechanics and D1 user account data stay unchanged.

## Source update 0.202.0 — ignore stale cloud replies after switching account/library

- Capture the initiating library owner before each cloud PUT or DELETE and check that same owner before changing any visible cloud status or acknowledging pending deletion. Network responses from a previously signed-in user must not consume the new user's pending tombstones or show a false success.
- A delayed legacy-library-key validation cannot switch the active guest scope after the player signs in or otherwise changes its owner.
- Ignore failed refresh messages and stale conflict toasts from an earlier library generation. Only the current user's cloud refresh may report status.
- Isolated promise-based Node tests exercise delayed PUT/delete responses, expected same-owner success and safe legacy transfer. No actual D1 write or schema migration is performed.

## Source update 0.201.0 — saved-build comparison names from current OS catalogs

- Correct an actual misleading comparison: saved equipment and socket Soul records often contain only the `id`; the old comparison printed «пусто → пусто» even when different items were selected. Look up each ID against the current OS/D1 `catalog.equipment` and `catalog.souls` instead, preserving safe source-backed legacy names and showing a distinct ID fallback for missing records.
- Compare race, profession and level on their own lines instead of giving an unchanged profession and level when only the selected race changed. RU/EN headings are supported without changing official game names.
- Add tests against the real OS item and Soul catalog, absent catalog entries, old embedded names and unknown IDs. No gameplay formula, save semantics or cloud migration changes.

## Source update 0.200.0 — source-backed special Soul/equipment effects in Hero Book

- When the existing equipment eligibility gate activates `Душа несчастья` (`EP_ALL_CRITICAL`), show its OS-stated drawback: all incoming attacks are critical. For `Вечная душа` (`EP_RACE_TOUGH_HEART`), show the sourced 5% HP trigger without inventing a trigger probability. For `Проклятый посох` (`EP_HEAL_LIFE_REGENERATOR` with a negative value), show gradual HP loss without inventing a tick interval or amount.
- Render these effects in the Hero Book Effects tab with RU/EN labels; do not expose technical EP identifiers to ordinary players. Source item eligibility, sockets and refinement thresholds remain mandatory.
- Move the three codes from wholly-unmapped to **descriptive preview only** in the effect-coverage audit. This is not a completed Remaked formula port, and no character HP, critical-chance or combat damage number is altered.
- Add Node tests against current OS records, grade gating, other item effects, source descriptions, absence of fabricated proc rates, and Hero Book wiring.

## Source update 0.199.0 — recover pre-account guest library backups

- Browsers that signed into the old account UI before the 0.197 owner-isolation release could contain the original guest saved-build backup `ps-preaccount-library.v1`. On upgrade, import that existing backup **only into its guest library scope**, never into another user's account or remote D1.
- Do not overwrite a guest cache already established by a newer release; reject malformed or unexpected backup payloads without destroying either original backup or current saved builds.
- A logged-in account's browser draft remains independent. After logout the guest library recovers its original snapshots; logging back into the account restores account-specific records.
- Pure Node tests cover the old backup, existing guest cache, malformed records and preservation of the old backup. No Worker migration or formula changes.

## Source update 0.198.0 — protect old offline snapshots when saved builds are deleted elsewhere

- D1 remote deletion tombstones remain authoritative and existing public links are never revived. If a device still has a snapshot under that ID, preserve its exact snapshot under a **new browser-only recovery ID** with an explanatory local-copy title, instead of silently dropping the user's work.
- An explicitly queued local deletion takes precedence: do not create recovery copies for the player's own delete action. Reopening/reloading does not spawn endless duplicate recovery records.
- Sharing and D1 PUT for this recovered snapshot remain blocked until the player explicitly chooses «Перезаписать» on that local copy. The original deleted ID is never written again.
- Extend Node and fake-Worker Chromium regressions. No schema changes; current 1–55 range and formula parity inventory unchanged.

## Source update 0.197.0 — browser library ownership boundaries

- Browser saved builds, current local hero draft and pending cloud deletions now maintain separate recovery snapshots per logged-in account or account-free library key. Logging into another existing account does not merge that account's saves with local guest saves.
- New account registration intentionally retains the guest library **only when registration is made from that guest browser**; the same legacy key remains bound in D1. Logging out restores the guest-owned draft instead of another user's private build.
- Existing unscoped browser storage is migrated without changing D1 or deleting earlier local records; an expired old account's browser snapshot is attributed to its previous account where identifiable.
- Cloud reconciliation now exits immediately if an account switch happens while pending deletes are being processed. Source-backed Node tests cover account A/B/guest switching, registration transfer, legacy cache and pending-delete isolation.
- No server migration needed; independent Chromium browser and live-user acceptance still required.

## Source update 0.196.0 — guard live user accounts after migration 0005

- Following successfully applied production migration 0005, read-only live checks now REQUIRE `/api/health.features.accounts=true`, alongside intact existing D1 library and catalogs; a future regression no longer logs an ignored INFO warning.
- Verify `GET /api/account/me` correctly rejects an anonymous caller with `401 Sign in required`, proving the actual deployed login route and CORS work without creating accounts, submitting credentials or writing any D1 records.
- Add Node source-policy regression so no production registration/password writes are inadvertently added to automated diagnostics.
- All player build editing and account passwords remain unchanged.

## Source update 0.195.0 — one clean skill bar, private administrator access, live D1 accounts

- Replace the broken multi-lane pins with a **new element class** that cannot inherit legacy `:nth-child` positioning. Every skill threshold is a thin inline notch occupying the actual bar's 12px height, aligned with the native range thumb's exact travel (21px endpoints). No floating squares, duplicate lanes or pointer interception.
- Hovering the skill's position on the shared progress slider reveals its complete original icon/name/description; keyboard focusing a notch also reveals the tooltip. All marks stay on the same horizontal Y coordinate. Browser E2E asserts computed element geometry, drag input priority, hover and keyboard tooltips.
- Remove the administrator login button and hints from the public profile UI entirely. Keep **both original hidden triggers**: 5 logo clicks within 6 seconds and Ctrl+Alt+Shift+P. Legacy administrator login continues at `/api/admin/login` with existing D1 `admins` and `sessions`.
- **Production D1 account migration verified** from manually dispatched GitHub Actions run [41263185077](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/41263185077) at 2026-11-01 01:57 UTC. Before/after checks confirm existing tables stayed available, 0005 created `user_accounts`, `user_sessions`, `user_registration_limits`, and the live Worker reported `features.accounts=true` with library still enabled. No further migration required. Real user sign-in acceptance remains separate.
- Updates do not change formulas or the 1–55 planning range.

## Source update 0.194.0 — one-click, owner-confirmed D1 account migration path

- Prepare a **manual-only** GitHub Actions workflow explicitly gated by owner confirmation, the exact existing Cloudflare account/database IDs and a server-side `CLOUDFLARE_API_TOKEN` secret. It checks legacy admin/saved-build tables before doing anything, records a Time Travel bookmark, and applies **only** the additive `worker/migrations/0005_user_accounts.sql`. No earlier migrations and no production data re-imports run.
- After application, validate expected account tables and the live Worker reporting `features.accounts=true` while `features.library=true`. Failure or missing token leaves the migration unverified and surfaces in workflow results.
- This workflow has not been triggered by source commits; real production migration and actual admin login remain unverified until the owner runs the explicitly confirmed action and acceptance checks.
- Include independent Node assertions for workflow gating, expected D1 UUID, SQL additivity and script correctness.

## Source update 0.193.0 — actual inline skill ticks and legacy administrator entry

- Replace the detached skill-pins rule that erroneously placed skill milestone icons above the slider. Milestone symbols occupy the progress line itself, with gold/green/red states; hover and keyboard focus reveal source-backed names, original icons and skill descriptions. The same drag range remains intact.
- Expose a clear, independent «Вход администратора» entry from the regular account menu. Legacy `administrator` belongs to `POST /api/admin/login` and existing D1 `admins`/`sessions` — not `POST /api/account/login` and uninstalled `user_accounts` tables. Never send administrator credentials to the new player account route. The existing five-logo-click and Ctrl+Alt+Shift+P options remain.
- When player-account registration returns the known 0005-migration error, explain the player-account unavailability without implying that the old administrative account is unavailable. No admin secrets stored or published.
- Add Node regressions and independent mocked Chromium tests for in-bar milestone geometry/tooltips and a working administrator login while player account routes return 503.
- **Deployment limit:** no direct Cloudflare account/D1 admin connector is currently available. Do not claim migration 0005 was applied or that a live administrator login was tested with real credentials.

## Source update 0.192.0 — account password confirmation and legacy comparison

- Password change and one-time recovery now request a repeat of the new password, refusing a mismatch **before** calling the Worker. Form fields have explicit accessible names and required/min-length constraints.
- A mistyped recovery password no longer consumes and rotates the single-use recovery code without a matching confirmation. Existing PBKDF2 server requirements, secret handling and account-free libraries remain unchanged.
- New Chromium flow checks wrong/correct change confirmation and wrong/correct recovery confirmation, including returning a rotated recovery code. Historic builds without a gender key now compare as the default female rather than reporting a fake gender change.
- Browser and published D1 account registration are separate acceptance tasks; production migration 0005 is still required before actual account use.

## Source update 0.191.0 — compare gem settings and opt-in buffs

- Show two saved builds' attached gem type/element choices, guild HP/MP boosts, Sign of Life, active potion/combat toggles, Proelium and trained combat choices, and selected honor title in the same comparison view.
- Only compare gemstones attached to the **currently equipped item ID and slot**. Ignore unrelated stale gem keys, and treat legacy absent buff fields as off/zero to avoid false differences.
- Support RU/EN comparisons with the same source ID-based game data and honor title names. No recalculation of combat statistics, D1 schema changes or implicit saves.
- Add pure Node comparison regressions, including old-build compatibility and source data immutability. Full Chromium/Pages status requires independent CI and deployment checks.

## Source update 0.190.0 — durable cloud conflict copies and no implicit PUT

- A divergent local snapshot becomes an explicitly marked browser-only recovery copy. Reconciliation preserves `localOnly:true` through reloads and excludes those copies from the automatic retry queue. Other previously **explicitly saved** offline builds still retry after connectivity is restored.
- The card explains how to publish that copy: open it and explicitly choose «Перезаписать». Only that confirmation clears the local-only marker and submits an existing saved ID to D1.
- Deleting an unpublished copy does not issue a remote delete or create an unnecessary D1 tombstone; sharing is blocked with a useful action hint until explicit save.
- Node merge regressions and a fake-Worker Chromium conflict/refresh/share/manual-save scenario verify no accidental PUT. Published Pages and independent live D1 behavior require separate acceptance; formulas and 1–55 planning are unchanged.

## Source update 0.189.0 — resilient sessions and explicit save UI

- A temporary offline / 5xx / network error while verifying an otherwise unexpired account session does not trigger a false logout or drop the stored session. A confirmed 401/403 still revokes the local session.
- Add Chromium account regression for a transient account-me 503 followed by a genuine 401, with Node source validation; browser and D1 production state remain subject to independent checks.
- Style the inline overwrite card, retain the no-background-write contract, and refresh the public cache key for stylesheet/client updates.

## Source update 0.188.0 — clearer RU/EN UI and explicit inline overwrites

- Translate main static labels, controls and accessibility descriptions through exact UI keys; avoid altering OS item names, custom build titles and game records.
- Translate account registration/login/recovery/password interfaces on language switch, including the account popover shown before the catalog finishes loading.
- Translate saved-build management buttons and messages with exact UI-only mappings. A saved build still changes in the cloud **only** after a second in-app confirmation; cancelling or merely opening the confirmation makes no cloud PUT.
- Add pure Node localization tests and Chromium account/overwrite regressions. Live Pages / Worker and end-to-end browser acceptance remain unverified until run.

## Source update 0.187.0 — user accounts and explicit save semantics

- Read-only connection checks now distinguish the source feature from actual deployment: `features.accounts=false` is reported as INFO until migration 0005 is applied; current library/catalog tests continue independently. Do not report production signup as active before server evidence.


- Revert automatic cloud PUTs of already saved character revisions: state changes are only browser-local until the user opens the saved build in «Мои билды» and explicitly chooses «↻ Перезаписать» with confirmation. The original ID is kept. The quick hero Save button navigates to library management; «Сохранить новый билд» deliberately creates a new saved entry.
- Keep D1 authoritative under an unchanged saved ID. Conflicting locally saved snapshots are preserved as **local copies only** rather than implicitly uploading an unapproved additional cloud build. Explicitly saved local new IDs may still upload when the network returns.
- Fix screenshot header to show the SLOT («Слот: Оружие / Щит / ...») rather than duplicating item name. Correct RU/EN slot labels for the 14 official equipment positions.
- Place milestone pins entirely within a dedicated three-row band above the existing interactive slider, separate from the label and thumb.
- Add a small top-right profile control and Worker/D1 account module with case-insensitive unique Latin usernames (3–20 chars, a-z starting letter, digits/underscore), long passwords (15–128 Unicode characters with punctuation/spaces allowed), salted PBKDF2-SHA256 hashes, random hashed seven-day sessions, rate-limited login/registration, password change and one-time printable recovery code. No email/SMS/payments.
- Existing account-free 64-hex-key D1 libraries remain available. Registration can bind an existing legacy library's **same** owner hash; account session access to `/api/library` and share creation recognizes it without moving existing build/share IDs.
- **Deployment gate:** `worker/migrations/0005_user_accounts.sql` must be applied to the actual production D1 and Worker code redeployed before live account APIs are available. Pages publication, Node and mock Chromium tests alone do not prove live registration.
- Remaining: end-to-end live D1 account acceptance after migration, complete RU/EN interface translations, remaining formula port and combat/server parity.

## Source update 0.186.0 — reconnect saved libraries and restore language without game data

- Network `online` and tab `visibilitychange` handlers retry reading previously saved D1 builds and pending deletions after loss of connectivity, throttled to one check in 20 seconds. Never auto-create records from a fresh, unpersisted character.
- Expose a concise user-facing warning in the library's transfer/recovery section: without the secret recovery code stored outside the browser, cookie/site-data wipes make account-less cloud builds inaccessible even though D1 rows remain.
- Apply primary RU/EN interface strings and the pressed-state language choice immediately even when game catalog fetch fails or is still pending. Keep game data names sourced by item/skill IDs, never fuzzy translation.
- Confirm with Node and browser regressions. Continue full RU/EN coverage, actual D1 live acceptance, and 39 NOT YET PORTED / 77 PARTIAL Remaked formula keys in future work.

## Source update 0.185.0 — account-free D1 authority, saved-only autosync, screenshot UX

- The cloud row is authoritative for a saved ID even if browser timestamps suggest a newer local record. Preserve divergent local edits as a separately named saved copy; never silently overwrite the original cloud record. Offline copies upload only when the existing cloud library becomes available.
- A draft without an explicit initial save remains local-only. Existing saved builds auto-update the same D1 ID after deliberate user edits, with a short debounce, monotonic revision, and offline retry through the browser saved-library cache. Do not claim cloud success when D1 has not acknowledged the write.
- Fix the equipment detail header with the globally registered item presenter and a localized slot fallback. Replace the ambiguous RU ✓ · EN caption with two explicit pressed-state controls and introduce site UI translations for primary sections. Full RU/EN coverage remains an open task.
- Stagger compact skill-milestone markers over three lanes, retain actual threshold values, icons in hover/focus tooltips and the same 90-point drag surface.
- Browser checks cover previously saved automatic updates, new drafts not generating D1 PUTs, prior conflict recovery, hero book and level-55 planning. Private library recovery after cookie deletion requires the user to restore their 64-hex-character library key; this key is not an account or login and is not recoverable by site identity.
- The repository contains 17 main `data/os/*.json` game source snapshots. Cloudflare may expose additional derived endpoints. Do not claim universal source/game server parity or current availability of every official item.

## Source update 0.184.0 — fail closed on stale/corrupt equipment slot identities

- Require an integer equipment index within 14 official planner slots and exact alignment between item `slot` and slot type before an equipped record can affect HP, MP, effective attributes, damage, defense, Souls, gemstones or sets.
- No mutation or deletion of the original browser-saved equipment data: unknown slots can be restored by a later source migration but do not count as valid equipment now.
- A source-extracted functional test executes the real app `equipmentIssue` on current OS records and rejects invented slot 14, mismatched shield and potion. The character book also filters invalid slot records, without suppressing genuine under-level future items.
- Fix the new browser equipment regression to navigate from Properties → Choose before clicking Remove, matching the actual user flow. Retain cloud conflict and future 1–55 tests.

## Source update 0.183.0 — future gear directly in equipment picker

- Display profession-, slot-, race- and costume-compatible equipment with required level up to **55** even when the character is currently below its requirement. Mark with a concise “Будет доступен с N уровня” label, keep current usable items first and retain catalog searching.
- Future items can be selected and saved immediately. The existing stat/combat gate keeps their bonuses, Souls and upgrades inactive until the character reaches the source level; no server cap 45 is imposed on Build Studio.
- Regression fixtures use current OS real item 422 “Рычащий меч”, level 53, plus synthetic level-56 exclusions and incompatible-class items; Chromium will verify planning at 45 and eligibility after changing to level 53.
- Do not overclaim current server item availability or exact damage values, and retain the maximum preview level 55.

## Source update 0.182.0 — explicit two-handed weapon and shield conflict

- Use only the official OS item field `twoHanded===true` to establish that a usable two-handed weapon occupies the shield/offhand slot. A saved shield stays visible and remains in the planner, but is **inactive** for stats, defense, souls, gemstones, set bonuses, and shield-gated combat skills until the character uses one hand or the two-handed weapon is itself ineligible.
- The same source-backed equipment exclusion is applied in the derived stat engine, equipment rail and Hero Book; display a plain, useful player warning instead of an unexplained change in numbers.
- Regressions cover OS weapon 401 + shield 17001 at level 40, unuseable underlevel 2H, one-handed weapon 1, and level-53 2H sword 422 for future level-55 planning. Separate Chromium scenario verifies the shield remains saved through level 40 → 3 → 55 and becomes active/inactive appropriately.
- Improve repeatability of the existing Playwright CI browser installation by caching its pinned Chromium 1.55.1 binary; this does not change production client dependencies.

## Source update 0.181.0 — non-destructive gear eligibility in all derived stats

- Saved equipment remains visibly slotted across class/race/level changes but only contributes to character attributes, HP/MP, combat modifiers, gemstones, Souls and set bonuses when the current level/job/slot and existing explicitly mapped Astir race/gender restriction permit it.
- Mark currently unusable equipment in the character gear rails and in the detailed Hero Book, showing a short practical requirement instead of removing the user's future-planning choices. Returning to an eligible class/level restores its effects.
- Hero Book active skill enablement now uses the same full actual trained branch mastery map as the underlying calculator, including Wind requirements. Only eligible shield/weapon checks permit corresponding active skills in both views.
- Add real OS level-38 Cardinal Cap and level-40 sword regressions, an isolated Chromium level-change +50 HP test and basic Astir gender checks. Keep permanent planning levels 1–55, even while the live server cap is temporarily 45.

## Source update 0.180.0 — preserve both sides of browser/cloud conflicts

- Introduce a deterministic, source-independent build library merge module. If local and cloud snapshots for the same ID differ (including a timestamp collision, newer local, or newer cloud), retain both: the chosen winner under its existing ID and a clearly named copy with a distinct ID for the losing edition.
- Preserve active local draft selection by remapping its active saved build ID to the local copy when the cloud wins. Respect confirmed remote tombstones, pending deletes and invalid/malformed remote payloads; never reactivate deleted IDs.
- Worker D1 compares the stored payload on equal timestamps: retry of identical content is allowed, but a different snapshot with equal revision returns HTTP 409 conflict. Older saves and deleted records remain guarded by atomic SQL.
- Node regression tests cover conflicting 55/54-level histories, stale cloud/local, tombstones and idempotent writes. Chromium exercises real frontend storage and mocked cloud GET/PUT through reload. No production D1 writes.
- The Worker source code was changed; public readiness tests do **not** establish that Cloudflare deployed the matching Worker revision. Verify actual live write semantics only by explicitly approved isolated D1 acceptance.

## Source update 0.179.0 — dynamic current/future HP, MP and status-cleansing catalog

- Classify all current OS POTION-kind TARGET EP_HEAL_LIFE/MANA(_RATE) item effects instead of hard-coded Mana-only IDs. The 2026-10-30 snapshot contains 20 genuine recovery items: eight with mana or mixed healing and twelve HP-only.
- Display HP-only items in a compact, collapsed Hero Book section linking to the original encyclopedia; keep mixed HP/MP items together in the existing mana section without doubling.
- Populate status-cure items dynamically from current TARGET EP_RECOVERY_* records, retaining the known nine in today's snapshot and automatically supporting new catalog entries.
- Use only catalog source effects; never infer a damage-over-time weapon is a potion, invent statuses, or alter saved builds.

## Source update 0.178.0 — opt-in isolated live D1 lifecycle and Chromium status cures

- Add a manually gated GitHub Actions workflow and Node 22 acceptance script using a disposable level-55 build and two independently generated random library secrets. Verify save/owner read, cross-owner isolation, public share, source deletion, HTTP 410 revocation, stored tombstone, and HTTP 409 resurrection rejection.
- No existing user library key or real build is accessed; the script retries safe cleanup on errors. Production D1 retains a small tombstone and revoked share record. No production D1 writes are part of automatic CI.
- Extend Chromium smoke with all nine actual OS cleansing consumables, their names and displayed conditions.
- Script readiness is not proof of a successful live D1 write/delete lifecycle. Run the opt-in workflow manually and inspect the result before claiming it verified.

## Source update 0.177.0 — current OS status-cleansing consumables

- Add a compact, collapsed-on-load group of nine actual OS consumables in Hero Book → Recovery; each opens its own encyclopedia record.
- Resolve seven distinct EP_RECOVERY_* status-clearing effects directly from item records, without interpreting them as healing amounts, passive resistance, or permanent buffs. The item descriptions and IDs remain authoritative.
- Test Panacea, Calming Potion, Antidote, Astir Candy and Universal Potion, duplicates, incomplete catalogs and missing effects. No modification to existing build saves or gear-derived stats.

## Source update 0.176.0 — source-backed attack range equipment bonuses

- Read EP_RACE_RANGE and EP_BOW_RANGE directly from currently equipped OS items and compatible grade-gated effects. Show them separately in the hero's attack book.
- Keep paired EP_RACE_CARRY/EP_BOW_CARRY untouched: they are distinct fields and must not be counted twice as range. A bonus is not presented as the character's final attack reach without weapon/client evidence.
- Test real current OS Sight (11083), Dwarf Dawn Helmet (11542), Hunter's Beret (11202) and Hunter's Ring (19006), including grade thresholds and no phantom bonus after unequip.

## Source update 0.175.0 — propagate mastered branches and fail closed on unlearnable skills

- Build the full branch-to-green-Adeptness map from live selected class innate mastery and actual trained mastery, rather than passing Slash alone. Blue potential is not counted as mastery.
- Require a valid planning level (1–55), learnable active skill and no unresolved prerequisite before opting in an OS combat buff, consistent with the support skill gate.
- Add executable regressions for future Exorcism prerequisites and invalid combat selections. Neither server cap 45 nor saved character levels are changed.

## Source update 0.174.0 — enforce the planned 1–55 range and verify cloud library readiness

- The complete character calculator accepts all levels 1–55 but fails closed on 56+, negative and fractional levels; the game's temporary 45-level server limit does not constrain Build Studio.
- Require the published Worker health's D1 library-ready flag in addition to sharing/catalog flags, CORS and all 19 public datasets. No data mutation or player credentials.
- Keep the actual end-to-end recipient share and unsaved draft/browser regressions intact.

## Source update 0.173.0 — validate all opt-in Wind skill conditions

- Gate real OS Wind Assist and Wind Blessing sources on their class, character level, learnability, unresolved prerequisites and any explicit trained branch mastery requirements, not merely a saved checkbox.
- Prevent malformed catalog skill values above 100 in the source percentage slot from granting arbitrary movement/dodge bonuses.
- Add regression fixtures for future changed OS requirements while preserving valid current level-28 Ascetic and Archer skills. No edits to permanent character stats or the underlying skill catalog.

## Source update 0.172.0 — comprehensive D1 catalog and EN validation

- Promote the post-deployment read-only diagnostic from five datasets to all 19 current public D1 endpoints. Include classes/skills/items/Souls plus monster/drop/map/dungeon/NPC trade/chest data and both translation layers.
- Require HTTP 200, a nonempty JSON response, D1-origin response header and correct GitHub Pages CORS on every endpoint. Report the exact failing dataset when a source is absent.
- The published cloud index is not considered fully verified until the actual check run passes. This is public read-access coverage, not proof that every localized item matches the live game client.

## Source update 0.171.0 — source-backed on-hit stun and safe regression compatibility

- Treat the Iron Staff OS EP_ONHIT_STUN source as a physical-hit 4% status proc, not a skill ID 3 and not passive stun resistance. Display its actual item name and chance in Hero Book effects.
- Retain the existing discrepancy guard if a future catalog record's stated chance conflicts with its numeric fields.
- Update the historical periodic recovery return-object regression to include the new independent consumable result instead of failing against a stale exact string. Neither new code path mutates permanent HP/MP.

## Source update 0.170.0 — real OS mana consumables in the hero book

- Calculate MP restoration from exact current OS `EP_HEAL_MANA` and `EP_HEAL_MANA_RATE` effects for known consumables, including combined HP/MP items and max-MP scaling.
- Keep Remaked potion mastery scaling only on HP until its effect on mana is evidenced. Never mutate current MP or the maximum MP from a one-use item.
- Show a compact, navigable group of mana-recovery items in the book and cover all values in the Node and Chromium suites.

## Source update 0.169.0 — recipient share lifecycle in Chromium

- Open a public build URL in a second isolated browser with its own level-22 unsaved character; canceling preserves both draft and navigation.
- Accept the exact level-55 snapshot without saving, then simulate owner revocation (HTTP 410) and assert the user gets a clear message while the active character is not erased.
- Keep Worker requests mocked and production D1 untouched. Live published health/version checks are separate from this transactional browser simulation.

## Source update 0.168.0 — dependable live release monitoring

- Add a direct trigger when site-version.json changes; internal GitHub Pages deployment events may not dispatch workflow_run on all repository setups.
- Wait for the exact published Pages version via 24 bounded GET attempts (five-second pauses) before read-only Worker/D1 health, CORS and catalog checks. No secrets or data mutation.
- Keep workflow_run, daily scheduled checks and manual dispatch as additional paths. Consider the check green only after its actual GitHub Actions run completes.

## Source update 0.167.0 — viewport geometry and screenshot evidence

- Add Playwright geometric regression coverage at 1366×768, 1920×1080, 2560×1440, 3840×2160 and 390×844. Check horizontal overflow, panel separation, portrait centering and full image containment.
- Preserve the agreed neutral cursor even though clicking the hero opens the book. Upload actual full-page JPEGs plus DOM geometry data as inspectable GitHub Actions artifacts (retained 14 days).
- These are functional geometry checks, not an assertion that aesthetic/UX review is complete. If a live browser size fails, fix the measured layout rather than relaxing hard correctness requirements.

## Source update 0.166.0 — live read-only deployment checks

- Add a separate post-Pages, daily and manual GitHub Actions workflow for live GitHub Pages version, Worker health, D1 sample catalog datasets and CORS responses. No credentials or write operations are used; run against the specific deployed revision to avoid version-race false positives.
- Extend genuine Chromium E2E to open the recovery chapter, inspect the periodic skills preview and verify its unobtrusive content alongside existing keyboard/share/mobile flows.
- The live diagnostic workflow must complete successfully before claims of current Pages↔Worker↔D1 availability. It does not prove transactional D1 writes or final OS combat formulas.

## Source update 0.165.0 — end-to-end share-link UI with isolated Worker

- Add actual Chromium clicks through the build editor, saving a level-55 build, publishing a Worker-style short link, verifying exact GET snapshot and clipboard copy.
- Simulate a mismatched public snapshot and assert the success message and URL disappear in favor of a clear error. Keep all production Worker/D1 requests blocked in this test.
- This confirms the real UI contract only; it does not prove deployment or availability of live Cloudflare services.

## Source update 0.164.0 — 2-second spell recovery preview

- Port independent Remaked Legacy LPsec/MPsec preview magnitudes for Regeneration, Restoration and Natural Recovery; validate current OS skill IDs, class, level and trained/innate benevolence.
- Keep these read-only spell previews separate from HP/MP and permanent regeneration. Add an optional, compact Hero Book recovery section; no public developer debug banners.
- Reduce untouched audit identities from 41 to 39; both transferred keys remain BASE/PREVIEW rather than claiming current server parity.

## Source update 0.163.0 — finish high-level regression gate

- The first full 0.162.0 Chromium desktop/touch test passed. Fix the doubled escape in the new level-1 source assertion so the 35 future equipment checks and the existing Node suite can both pass together.
- Retain checked planning levels 46–55 and mobile book UX; do not imply Worker/D1 or Remaked full parity from local checks.

## Source update 0.162.0 — future items and mobile browser acceptance

- Freeze the 35 source-backed OS catalog items requiring levels 46–55, including the level-55 Dragon Shield. All ten level values are covered; maintain genuine class and level gates (unavailable at level 45, selectable when actually eligible).
- Extend Chromium smoke to a separate 390px touch context, verifying portrait-only book open/close and narrow viewport horizontal overflow.
- Maintain the separate Node, Chromium and Pages checks; this does not assert full Remaked calculations or live Cloudflare D1 readiness.

## Source update 0.161.0 — fix static test server path validation

- Chromium diagnostics revealed an empty DOM and no page errors: all local URLs were mistakenly rejected with HTTP 403 because a trailing slash on the project root doubled the path separator during containment checks.
- Normalize the filesystem root with path.resolve before checking descendants. Add a Node HTTP integration test proving real index and JavaScript files return 200 and missing paths return 404.
- Re-run independent Chromium E2E; production Pages/Worker unaffected by this test-only server fix.

## Source update 0.160.0 — Chromium boot diagnostics

- Initial Chromium run reached the test but timed out on a combined race/skill-branch condition. Replace the unrelated branch requirement with the race/portrait readiness condition; report DOM counts, catalog status, JavaScript errors and failed local requests if boot still fails.
- Continue to require the full desktop interaction scenario and genuine successful browser job before claiming E2E parity.

## Source update 0.159.0 — real Chromium smoke coverage

- Add isolated GitHub Actions Playwright Chromium smoke: live DOM interactions for portrait-only book, book tab/keyboard navigation, max-55 range persistence, new-hero level-1 reset and explicit unsaved-draft choice.
- Keep the full Node regression suite and release guard in the independent fast CI job; browser job never touches Cloudflare production or credentials.
- Browser smoke status remains pending until actual GitHub Actions result is observed; local verification does not prove Worker/D1 availability.

## Source update 0.158.0 — verified share content

- Verify a share not merely exists but contains the exact saved build snapshot returned by the Worker; prevent accidental false-positive URL publication on stale/wrong-level equipment or mastery.
- Guard this behavior with executable runtime tests, including future level-55 equipment, incorrect Soul/mastery values, incompatible schemas and invalid payloads.
- Improve the clipboard failure hint for touch/mobile browsers while keeping Ctrl+C as a desktop fallback.

## Source update 0.157.0 — book, cloud library and RU source regressions

- Replace test-only dependencies on removed duplicate Results controls, inline-skill list, obsolete user notices and old rune toggles with assertions against the single portrait book entry and current Hero Path.
- Preserve the historical rune serialization contract in shared builds without adding any live UI switch or unsupported game effect.
- Exercise full Node suite in GitHub Actions; success will be confirmed after the workflow ends.

## Source update 0.156.0 — repair current test harness and remove stale UI assumptions

- Restore runnable compact-workbench test, extend fake DOM attribute support, and align the documented OS MP cents-floor example.
- Update existing regression contracts to current skill milestones, Origin absolute-stat display, source-backed status immunity and keyboard behavior; no hidden player diagnostics are reintroduced.
- Full GitHub Actions tests and live browser/Worker validation remain separate and are not marked complete unless their runs succeed.

## Source update 0.155.0 — restore broken unit harnesses

- Rebuild a duplicated/corrupted Origin test source and inject the now-required potion and attribute node mock dependencies.
- Fix a broken 143-key inventory matching expression; align two legacy numeric assertions with the actual explicitly documented tenth-floor/mass mastery rounding.
- Correct the new level 55 guard to inspect the real skill budget module instead of unrelated general rules. Remaining CI failures will be investigated rather than suppressed.

## Source update 0.154.0 — automated test gate and share/level invariants

- Add GitHub Actions CI on pushes and pull requests against the source branch. Run the built-in Node 22 suite and the version-consistency release guard without secrets, package installation, or D1 mutations.
- Add regression guards for verified shared-link delivery, accessible copy fallback, level-1 new characters, and planning through level 55 despite current OS server cap 45.
- Live browser/Cloudflare acceptance remains separate from Node tests. An automation run is required before the release can be claimed test-green.

## Source update 0.117.0 — current OS-backed combat buffs in the hero book

- Four combat toggles use actual OS skill IDs 100051001, 320001001, 100052001 and 100053001, respecting record charLevel, class gates and EP skill effect values. The public app always supplies a skill catalog, including an empty one during loading, so unavailable source data cannot enable an old saved toggle.
- Attack, defense and speed are calculated from the source numeric fields. The hero book reuses exactly the same ability gate, displays the original skill artwork and values, and explains a missing class, level or shield.
- New test vectors exercise four source skills, changing skill values, incomplete source rows, unavailable skills and DOM checkbox interaction.
- Pending: full Node test run, actual browser and Worker/D1 deployment checks, additional verified active skill mechanics.

## Source update 0.118.0 — complete Remaked formula inventory and broader calculation parity

- [x] Inventory all 178 Legacy switch cases, their 143 distinct keys and exact source lines. [Full source coverage matrix](docs/REMAKED_FORMULA_INVENTORY.md) and pinned [machine-readable case index](data/remaked/legacy-calc-cases.v1.json). This does NOT mean all formulas have been ported.
- [x] Port eleven Remaked support-skill magnitude formulas as read-only, source-backed predictions with trained blessing, hymn and alchemy masteries. Display them in the hero's Buffs chapter without activating effects.
- [x] Integrate Remaked armor gemstone elemental resistances into actual defense figures exactly once; keep unverified elemental damage packet effects separate.
- [x] Port fourteen additional source-backed equipment EP mappings, connecting casting speed, mana recovery speed, cooldown, incoming physical/magic damage, reflect, aura bonus and debuff modifiers to the relevant result pages.
- [x] Add regression fixtures for source skill formulas, gemstone +7/+5, minimum refinement gates, fourteen equipment effects and source-audit completeness.
- [ ] Complete remaining 75 not-yet-ported unique Legacy keys and full conditional behaviors. Of other keys, 43 are still only partial, 10 read-only skill previews and 15 base/previews. No current OS live gameplay equivalence is claimed.
- [ ] Check feature-complete browser QA, all Node tests, and exact active game-server outcomes; resolve OS divergences only on confirmed evidence, preserving equivalent Remaked formulas.

## Source update 0.119.0 — wind skills with verified OS identities

- [x] Wind Assist «Помощь ветра»: current OS skill 260006001, Ascetic/Monk/Exorcist, level 28, +15 flat Dodge plus +15% base, combined via exact Remaked `floor(15 + baseDodge×0.15)`.
- [x] Wind Blessing «Благословение ветра»: current OS skill 320004001, Archer/Sniper/Predator, level 28, +40 movement speed from source EP_MOVESPEED_SCALE.
- [x] Both skills are opt-in, class/level gated, disabled on missing or incomplete catalog data, saved with character builds, and displayed in the hero book with official skill icons and source bonuses.
- [x] Regression vectors cover the source IDs, level 27/28 threshold, incorrect classes, altered/missing effects, and current book inputs.
- [ ] Extend the same verified skill-identity approach to remaining passive and active effects, with full tests of related states and real OS gameplay.

## Source update 0.120.0 — verified OS cap and mastery-accurate combat gating

- [x] Official OS cap is **level 45** (announcement 2026-10-03); matching `data/os/tables.json` `levelCap:45`. Corrected fresh builds, level input limits, labels, restored builds and shared-link active state with a human-readable legacy migration notice. Original library entries remain untouched.
- [x] Enforced current OS skill 100051001 («Рывок») `weaponUse` constraints. Its +15 speed bonus no longer activates with an incompatible bow/crossbow, while bare-hand and allowed weapon types remain valid. Book and calculator use the same constraint.
- [x] Ported Remaked `ACC` «Сосредоточенность» +100 using OS skill ID 100054001, class gate and `slash` mastered-green threshold 26. It is opt-in, persists in builds/links, fails closed if an OS effect/prerequisite is missing, and is shown in the hero book.
- [x] Corrected player-facing outgoing versus incoming critical damage, and removed a misleading claim that the already-buffed attack total excluded active bonuses.
- [x] Added test cases for level cap, Lunge weapon kinds, Concentration threshold 25/26, data drift, saved-state selection and precise critical labels. Manually evaluated **42 isolated test callbacks** across eight relevant files in a mock runner; these are not a full Node/browser suite.
- [ ] [OS server check protocol](docs/OS_LIVE_PARITY_CHECKS.md) for unresolved percentage rounding, item procs, gemstones, stance and buff lifecycle. Confirm only from current game/client evidence.
- [ ] Continue the [143-key Remaked formula inventory](docs/REMAKED_FORMULA_INVENTORY.md), with complete item sets, active/passive effects and final combat result chains; **full parity not yet achieved**.

## Source update 0.121.0 — old-build allocation safety at the actual OS level cap

- [x] A saved character originating from the old level-50/55 UI may contain more blue/green skill points or attribute points than current level-45 OS permits. After cap adjustment, detect both budgets using the existing Remaked point-cost engine and current OS ability point table.
- [x] Invalid distribution does not silently shed points from the user's draft or library. The hero can be reallocated, while the Book/Origin calculation refuses to label illegal results as valid; a short player-facing notice explains which pool needs attention.
- [x] Added direct regression cases for legal level-45, excess stats, excess trained skills, malformed allocations and UI warning presence. Recorded source validation without any login or database mutation.
- [ ] Continue full Remaked formula port and current OS gameplay checks using the [source inventory](docs/REMAKED_FORMULA_INVENTORY.md) and [live test protocol](docs/OS_LIVE_PARITY_CHECKS.md).

## Permanent planning rule — v0.122.0

**Build Studio supports planning for game levels 1–55**, including levels 50 and 55, even while the **current OS server temporarily caps play at 45**. The current server cap in `data/os/tables.json` is truthful metadata, **not** the studio's limit. NEVER clamp, discard, refuse calculations for, or hide builds, gear, points, skill previews, or saved/shareable characters for levels 46–55 merely because the current server cap is lower. This is a standing product requirement for future patches.

- [x] Restore level-55 range, original level-50 default, no auto-migration/clamping or invalidation of future builds. Remove extra level-cap notices. Keep future armor: Крепкий шлем 51 / 11023, Доспех тьмы 48 / 12073, Штаны тени 48 / 13052 and 36 other source-listed items above 45.
- [x] Restore Remaked attribute budgets at levels 50 (504) and 55 (544), preserve all saved green/blue mastery and item selections.
- [x] Implement seven elemental aura source branches from executed Remaked `Calc('DAMAura'..'DAMDark')`: weapon gem aura, compatible flat aura effects from equipment, percent modifier and separate per-element ceiling. Link results to the hero book without inventing server damage packets.
- [x] Implement six Remaked `MATKFire`..`MATKDark` elemental magic bonus fields with exactly one honor title's source-backed +5; show them in the attack book. Keep global staff magic separate from elemental bonuses.
- [x] Add tests for future levels/items, actual OS Priest Earring +2 aura and level-55 combat, percentage rounding, honor exclusivity and player-view output.
- [ ] Continue remaining Remaked effects and conditional combat math, preserving current OS overrides only for verified differences, not temporary server progression limits.

## Source update 0.123.0 — city speed and grade-aware defense effects

- [x] Corrected `MoveSPD` Remaked normal versus town indexes: `EP_RESTMAP_MOVESPEED_SCALE` from OS items affects *only town movement*, not running speed in the world. Actual source: Плащ новичка / Beginner Cloak ID 18073, +15. The hero book presents the separate town speed when present; general active buffs and gear stack once.
- [x] Test real OS `EP_BLOCK_BREAK_RESIST` from Боевые башмаки ID 15077 (block-break resistance +1).
- [x] Test real OS `EP_ONDAMAGE_REFLECTION` from Душа зеркала ID 103001: +3 until improvement +7, +5 from +8 through +10; no unconditional double-counting and no fictitious physical-defense increase.
- [x] Recognize `Blocking`, `Reflection`, `Gdebuff` as *partial* in the formula inventory based on existing source-backed secondary effect mappings. They are **not** complete simulations of the relevant combat or debuff success paths.
- [x] Isolated test vectors for separated 55-level town speed and refinement threshold; developer-side checks are not a full Node/browser/game-client acceptance test.
- [ ] Continue the remaining 59 not-yet-ported Legacy identities, 59 partial formulas, ten support-skill read-only previews, and 15 base previews; high-level 50/55 calculations remain an explicit studio feature.

## Source update 0.124.0 — current OS unison bonuses integrated into final stats

- [x] Load `unison` as part of the **same atomic Cloudflare D1/local catalog snapshot** as items, skills and souls. Validate against `meta.counts.unison=3`; never merge incompatible published snapshots.
- [x] Evaluate actual OS `data/os/unison.json` set requirements from root item plus **distinct companion items**, root refinement grade and source formulas `a.p * grade + a.c` (all supported rows have `a.f=0` and zero `b`). Fail closed for future unknown polynomial types rather than assuming their math.
- [x] Inject resulting source-backed `set:` effects into the **existing** ability/HP/MP, attack, armor, cooldown, cast-interruption, potion and effect coverage pipelines exactly once. Missing set members never activate bonuses.
- [x] Divine Cuirass (ID 12081) with four companions: at root +0, set bonus MP +200 / interruption resist +12 / cooldown -8; at +5, additional MP +40 / armor +4 / resist +4; at +7, additional MP +120 / armor +12 / resist +12. All values follow OS rows rather than made-up set multipliers.
- [x] Divine Bracers (ID 14094) with Sentinel Shield (ID 17034): +2 VIT, +15% back-attack bonus. Golden Cuirass (ID 12103) with all four companions and root +7: identify active anti-tumble set effect without inventing a numeric resistance from zero-value `EP_PROTECTION_TUMBLE`.
- [x] Hero book `Effects` page displays only truly active sets and their numeric bonuses; no implementation diagnostics appear on player-facing pages. Regression fixtures include missing companion, boundaries +0/+5/+7, and overlapping set membership.
- [ ] Continue remaining conditional skills, set/status immunity confirmations, full equipment refinements, combat procs and final server battle equivalence. **Planning 1–55 is mandatory regardless of live server cap 45.**

## Workstreams

| Issue | Scope | State | Next evidence required |
|---|---|---|---|
| [#1](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/1) | Own D1 catalog, imports, RU/EN, wiki and admin publication | In progress | Worker/D1 deployment confirmation, live API smoke, full 11-dataset coverage, authenticated edit/rollback |
| [#2](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/2) | Self-host original race art and 1,437 icon files | Blocked on original image bytes | Mirror original files, validate WebP and manifest, remove all external icon runtime dependencies |
| [#3](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/3) | Single-screen character workbench, race/class/skills/equipment | In progress | Browser E2E and visual inspection on desktop/mobile, keyboard focus, all gear conflict scenarios |
| [#4](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/4) | Saved-build migration, refresh safety, admin reliability, QA | In progress | Real `npm test`, persisted-state + refresh + modal navigation E2E, deployed admin API, crash monitoring |
| [#5](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5) | Current OS combat parity with Remaked reference mechanics | In progress | Source-fingerprinted fixture matrix, buffs, mastery, Forth enhancement, Souls, sets, modifiers and procs |

## Source update 0.108.0 — stable encyclopedia navigation and real NPC/chest/loot assets

- Keep same-category wiki list and search DOM intact on selected-item change; update card and selected marker, avoiding full-drawer flicker and duplicate hashchange work. Handle browser back/forward with popstate.
- Resolve actual chest item names/icons, NPC names, and all trade/material/chest/monster drop item icons from OS ID-linked catalogs.
- Never synthesize monster/NPC/map artwork if current source data has no assets. Next: audit server completeness, richer loot crosslinks and browser smoke testing.

## Source update 0.107.0 — simplify portrait book entry and relocate all boost controls

- One on-portrait interaction (click or keyboard); no pointer hand, no secondary buttons.
- Uniform dimensions and visual style for previous, next and close controls.
- Origin stats show only base allocations and derived vitals; all buffs are edited inside the book. Hidden legacy form nodes retained short-term to avoid breaking already shipped listeners, pending dedicated cleanup.
- Player summary no longer shows developer-side effect counters or incomplete damage notes.

## Source update 0.106.0 — keyboard and accessibility hardening for results book

- Preserve selected control keyboard focus during live buff updates; move focus to newly selected chapter, restore book scroll, use role=tablist/tab/tabpanel and aria-expanded.
- ArrowLeft/ArrowRight page turning works outside form controls and preserves existing Escape return to portrait.
- Browser E2E and Pages publishing remain to verify.

## Source update 0.105.0 — skill-source inspector bound to actual OS build

- Add searchable, collapsed catalog of current job learnable OS skill variants in the Effects chapter. Include raw catalog cost/timing/requirements in human-readable form, using innate+trained green mastery.
- Do not fake final damage for uncertain `fv1/fv2` kernels; client/server golden vectors still needed for per-hit damage, DOT, target resistance and triggered effects.
- Preserve portrait-first book and compact navigational layout.

## Source update 0.104.0 — item effect coverage and conditional procs disclosure

- Provide per-build counts of calculated, preview-only, conditional, unsupported and grade-gated EP effects across equipped items/Souls/Forth.
- Show the unresolved source item names under an optional collapsed disclosure in the Effects book chapter, keep the Summary visually minimal.
- Next: implement server-grounded trigger dependencies, skill-level target formulas and exact overlapping aura/set effects, then validate D1.

## Source update 0.103.0 — structured condition/status resistances in Defense

- Apply OS `EP_IMMUNE_*` grade-gated item/Soul/Forth resistances to explicitly named condition categories, including body/mental base protections, and `EP_CRITICAL_REGIST` to the incoming critical modifier. Render in the same Defense chapter.
- Future: race/class and active skill immunities, conditional casts and server-side vulnerability/status application checks.

## Source update 0.102.0 — direct healing spells from Remaked

- Derive First Aid/Heal/Healing Aura/Sanctuary/Restoration directly from Legacy `Calc()` formulas. Include level, INT, SPI, Benevolence trained+innate mastery, selected skill healing rate and Cleric level 50 specialization.
- Show all five in Recovery chapter, distinguish theoretical/unavailable skills and per-period Restoration. Leave game-server exact mastery/unlock and per-target casting mechanics pending.

## Source update 0.101.0 — historical Remaked gemstone evidence and source-labeled output

- Port original gem-vs-refinement matrix for physical elemental weapon auras, magic weapon aura and armor elements including multi-resistance Light and Charm from Dark; keep separate from modern OS attack and resistances until verified on server.
- Wire existing saved `state.gems` via equipment refinement keys to `gemstonePreview` and the Effects chapter. Exclude unique rainbow weapon exceptions, no false certainty.
- Next: current OS gemstone server rules, proc caps and exact unique item ID conditions; full skill-level effect formulas and D1/Pages test.

## Source update 0.100.0 — consolidated portrait results book

- The center hero portrait now opens an accessible six-chapter results book in the same area, with keyboard, arrow navigation, Escape, and result summary without duplicate computations.
- Buffs become an independently navigable chapter using the existing Origin setters, including guild, honor, recovery and conditional skills gated against OS class/level and shield.
- The prior equipment layout and portrait aspect remain unchanged. Pending: live browser E2E, animated flip QA, fuller skills/items/set/gemstone source parity and D1 checks.

## Source update 0.99.0 — Legacy natural recovery and skill healing

- Add historic `Calc('LPRec')` = floor(current max HP/35)+floor(VIT/3) and `MPRec` = floor(current max MP/25)+floor(SPI/3), separate from previously implemented regeneration *speed* indices. No invented conversion to per-second or seated recovery amounts.
- Add `Calc('LPSkill')` 100% + Honor2 10% plus OS `EP_CAST_HEAL_LIFE_SCALE` with grade-aware Souls and Forth. This is independent from Potion effects.
- Track `EP_HEAL_TIME_SCALE` MP regen rate and `EP_SKILL_DELAY_FIN` distinct from cast/cooldown indices. Full class effects, all per-skill damage/healing, D1 and browser E2E remain open.

## Source update 0.98.0 — locale-safe equipment and additional typed combat contributions

- Eliminate localized-name checks in MATK, switch historical Iron Staff/Might Staff/Cursed Rod exceptions to OS IDs 2802/2812/2841. Armor enhancement checks the exact empty-name sentinel only, not localized hyphenated item names.
- DEF now includes item/Soul Forth `EP_ARMORCLASS_SCALE` per independent ceil of base armor total, in addition to armor AC, refinement, flat DEF, Honor and selected active skills.
- Track source-backed move speed, skill delay, cast interruption, back attack rate and elemental magic damage effects separately, with explicit warning about overlap between generic wand/staff historic bonus and OS magic equipment effects.
- Remaining: exact server reconciliation for overlapping MATK effects, all active/passive skills, gem-specific enhancement, conditional procs and full D1/Pages E2E.

## Source update 0.97.0 — current OS active-skill combat effects and protected opt-in controls

- Implement `320001001 War Cry` (Gladiator family Lv28+, +10/+20% attack), `100052001 Raging Soul` (Gladiator family Lv35+, +30% ATK/−60% DEF), `100053001 Shieldbearer` (Knight family Lv35+ with equipped shield, **OS** −20% ATK/+40% DEF), `100051001 Lunge` (Warrior line Lv18+ +15 speed index), all opt-in and gated.
- Per Remaked historical source, Shieldbearer used −30%/+60%; this is **not** what current OS EP records specify, so current OS rate takes priority. Guild Arouse tiers also wired for ATK and MATK.
- New collapsed Origin controls, shared-build validation and contribution lines in Attack/Defense. Extend test coverage for jobs, level gates, shield dependence and buff conditions; still no complete active-skill runtime for every skill or live-game golden vectors.

## Source update 0.96.0 — full ID-safe audit of 205 approved Remaked RU skill labels

- Source exact 205 approved `game.ru.skill_entry.*` names cross-referenced against current OS 569 skills by normalized Russian name plus branch, with explicit human-readable resolution for five recognized abbreviations and flagged historical branch shifts. Store full 205-row, ID-indexed crosswalk and count statuses.
- At runtime, apply approved RU names only to verified IDs, keep EN translation and D1 canonical data unchanged. Multiple OS skill revisions sharing an official name are explicitly attached to the same approved Legacy entry.
- Next check: 205 approved skill descriptions against full OS client text; any effect calculations per skill must account for level, mastery and actual opt-in buff before inclusion in character totals. Still missing complete skill/state effects and current-server golden vectors.

## Source update 0.95.0 — Remaked armor grade / OS Forth and grouped skill passives

- Shield/helmet/body/gloves/legs/feet: per-item floor(1.5×enhancement) from archived `js/equip.js`, not weaponPlus or forging probability. Per-item base AC, Forth armor effects, Soul effects, Honor are distinct.
- Current OS itemForth 162 item-ID grade snapshots takes precedence over descriptive refinement parser; intrinsic effects still apply, and imported builds are unchanged.
- Melee, technique and magic mastery passives from innate + trained green branch Adeptness; MATK INT breakpoint table; attack position/cooldown/basic critical resistance from Remaked Legacy. Real-current-server parity still needs golden character vectors and conditional effects.
- Next: entire 205-name Remaked approved skill entries match to exact OS skill ID, more Soul and active combat abilities, comprehensive itemForth cross-check and all-user browser E2E.

## Source update 0.94.0 — approved Remaked RU Honor title labels

- Compare all 13 Honor title IDs against `Pandora-Saga-Simulator-remaked/localization/approved-translations.v1.json`, `game.ru['calculator.honor.0'..'calculator.honor.12']`. Replace paraphrased UI labels with exact approved Russian names; keep numeric IDs/effects/shared saved-state stable.
- Add regression ensuring all thirteen identities, exclusivity and direct Honor damage/defense/accuracy effects remain unchanged. English title names are not overwritten by unverified translations.
- Broader full skill names, item attributes, armor refinement curves, conditionals, cloud D1, icon mirror and end-to-end browser tests still need independent implementation/verification.

## Source update 0.93.0 — attack and casting speed indices, MP consumption

- From Remaked Legacy `ATKSPD`: index 100 + 3floor(AGI/10) + 3floor(AGI/20); explicit current OS gear/Soul `EP_ATTACKINTERVAL_SCALE`, honoring Soul min/max enhancement.
- From `CastSPD`: starting index 100+5floor(DEX/10); actual spell cast times excluded. From `ReduceMP`: base remaining cost 100-floor(INT²/1000); selected Elf racial Harmony skill ID 900020001 -15 and equipped `EP_RACE_MANA_COSTCUT` bonuses stack, source-check required for enhancement-dependent zero-valued Soul descriptions.
- Show partial speed indices in Attack and percent remaining mana consumption in Effects, with explicit caveats. Add six runtime formula regressions; full Node suite, D1, browser, icon mirror, full passive effects and armor refinement remain unverified.

## Source update 0.92.0 — original transparent PS favicon and direct equipment attack effects

- Commit the generated 96×96 indexed-transparent gold/blue PS art as a small self-hosted PNG, connect favicon/apple-touch with current cache key. Preserve independently editable header logo. Add offline PNG signature/size/tRNS and HTML cache-key tests.
- Increase partial combat coverage for current OS equipment structured flat `EP_DAMAGERATE_CONST` / `EP_SKILL_EQUIP_DAMAGERATE`, percent `EP_DAMAGERATE_SCALE`, percent accuracy `EP_TOHIT_SCALE`. Match Legacy percent rounding per effect. Grade-gated Souls remain gated, unnamed unstructured skills/set effects excluded.
- Still pending: complete skills/passives, armor enhancement table confirmed against server, all item conditions, full RU terms reconciliation, original OS icons, D1 deployment and actual browser QA.

## Source update 0.91.0 — partial equipped armor DEF and resilience of HP/MP

- Sum OS equipped item AC only, plus `EP_ARMORCLASS_CONST` from grade-qualified item/Soul effects and direct Honor 11 +5 (Remaked `Calc('DEF')`); do not double count armor from Soul metadata or assume armor refinement multiplier. Expose a breakdown in Defense tab.
- Treat missing OS weapon improvement table as an **unavailable weapon attack**, not a reason to make the character HP/MP or other defensive/combat subtotals disappear. Test null-grade and grade-gate cases.
- Remaked skill buffs, remaining class passives, armor enhancement scaling, full game-server DEF, complete naming audit, local icon library, D1 and browser/page verification remain outstanding.

## Source update 0.90.0 — source-backed partial offense and stale test fixes

- Connect source-mapped weapon baseline ATK from Remaked Legacy: floor(STR/2), weapon W, OS weaponPlus ratio/flat per refinement and Legacy STR breakpoints; known Honor (fire title) floor bonus. Show as a partial figure, not full current-server attack. Unknown active buffs, weapon-class Souls, sets and conditional skills remain excluded.
- Add basic accuracy (level+DEX), AGI stepped dodge, critical chance (1+floor(DEX/10)), confirmed equipped flat EP codes and direct Honor modifiers. The Myrine current OS critical racial passive +5 differs from historic Remaked +2; **OS skill metadata wins**. Her +10% accuracy and +5% dodge are shown separately until rounding/stacking parity is verified.
- In central stage Attack tab show actual partial totals with per-source disclosure. Extend source-backed tests and repair outdated stage assertions that still expected 2026-10-30 or removed interface placeholder text. Full npm test/Pages browser checks still need a Node/browser runtime.
- Next: remaining warrior/archer passives, active buffs, complete DEF, cast/attack speed, conditional equipment effects, icon mirroring, D1 connectivity, manual RU terminology audit and visual QA.

## Source update 0.89.0 — innate + trained green mastery parity

- Confirmed Legacy `Status.Skill[i][0]` innate Adeptness is nonzero and must be included alongside `[1]` trained Adeptness. Current OS jobInit base-class branch starts match source: Warrior Melee 18, Acolyte Prayer 15. Skill Potential/blue points are not counted twice.
- Correct potion healing passive and Priest/Cleric/Enchanter innate Inspiration SPI bonus; new tests preserve formulas. Remaining full combat stats, complete active/passive effects, icon library, broader RU terminology reconciliation, D1 verification and browser `npm test` still open.

## Source update 0.88.0 — resistance and guild recovery source preview

- Port conservative `RES*` base terms from Remaked: current derived VIT/SPI resistance to physical and mental states, selected Honor paths and explicitly chosen Human/Elf/Enkidu/Lapin race passives, plus confirmed OS item/Soul elemental effects. Keep partial-combat disclaimer; do not claim complete attack/defense or current-server parity.
- Port three independently selectable guild regeneration `SelBuffClan_3,4,8` branches with Remaked `LPRecSPD/MPRecSPD` indices and original integer tier values. Recovery indices are NOT HP/MP per tick. Expose in collapsed Origin controls and defense attribute cards; validate and persist in shared builds.
- Regression fixtures added; complete `npm test`, Pages visual checks, live Worker/D1, remaining skill effects/sets, icon library, and full attack/defense formulas are still open.

## Source update 0.87.0 — Legacy POT parity and approved racial terminology

- Port third human racial passive «Знахарство» (+15%) and trained green Melee group +10 per 10 at level 12+ for the warrior lineage; recalculate when race passive, level or mastery changes. These cover direct Remaked Legacy POT triggers; current OS extras need live-game comparison.
- Source verified RU labels for 18 exactly-mapped racial passive skill IDs. Other skill names remain untouched until independently matched with client names and Remaked; no machine translation or D1 rewrite.
- Added `remaked-potion-masteries.test.mjs` and effect breakdown UI. Full npm test, browser E2E, Pages deployment, Worker/D1 live verification, icons and remaining combat formulas are **not** considered complete.
- Next major batch: source mapping of active/passive skills, guild recovery branches, weapon attack/defense and elemental resistances, original icon library, and UI verification without GitHub Actions.

## Source update 0.86.0 — exclusive Honor and verified potion previews

- Port exclusive 13 Remaked Honor titles from archived `js/ini.js`, executing direct bonuses from `js/calc.js` without inventing derived combat totals. Honor choice RU/EN replaces independent bool UI; old Honor curiosity saves migrate by fallback.
- Potion restoration: base `100 + floor(VIT²*2/1000)`; equipped `EP_MASTERY_POTION` Souls, `Flag Honor=11` and `Flag 30_0` Jo-eun rune all add correctly. Skill/profession recovery bonus remains pending exact class/skill mapping.
- Port Remaked Modern 4.23's 14 potion preview positions, including 10 confirmed current item identities and 4 historical positions hidden from current item lists. Apply fixed/percentage floor/ceil order only after the player opts in; no implicit toggles.
- Keep nested tabs compact, apply RU/EN names, refresh Origin and active attribute card after buff changes, persist and validate selected Honor and potion settings in shared builds.
- 41 isolated regressions from 7 suites pass, covering 13-title identity, VIT→POT, Souls/Jo-eun/«Крепкое тело», current-only previews, opt-in, legacy migrations and shared links. Node-wide `npm test` and actual browser acceptance remain unverified.
- Further unfinished scope is in `docs/REMAKED_CALCULATOR_PORT.md`: potion profession and mastery bonus, exact remaining combat stats and skill effects, guild branches, icon completeness, D1 live verification, wiki, responsiveness and full browser QA.

## Source update 0.85.0 — confirmed Remaked attribute modifiers

- Owner confirms Remaked calculations for abilities, potions, boosts, guild, honor and gear as the working functional reference. Keep their historical behavior while using current OS catalog keys and modern UX.
- Source-port Remaked `SelBuffClan_9` (guild +N to all six), `Flag.Honor==1` (+1 to all six), and `Flag 14_9/InBuff_1` (Proelium +floor(power/10) to STR/AGI/INT). Apply before HP/MP and do not charge allocation points.
- Include compact nested Origin settings, local persistence, and strictly validated sharing of `attributeBuffs`; leave older builds off by default.
- New direct calculation tests (6) and shared-state regression tests (2 new) pass alongside existing HP/MP, stage and buff tests (25 related checks in isolated harness).
- See `docs/REMAKED_CALCULATOR_PORT.md` for exact source mappings and **open** transfer tasks: additional active/passive skills, potion effectiveness, full Honor list, guild branches, all special boosts, combat/resistances and current-server golden vectors.
- Do not claim total game parity or Pages deployment until end-to-end checks. Continue previous D1/wiki/icon/UX backlog without removing it.

## Source update 0.84.0 — finish HP/MP sharing and cache-safe publication

- Complete 0.83 feature batch and publish new asset cache keys to include the subsequent shared-build sanitizer fix. Selected guild levels and Life Sign survive clean export/import; invalid values default to off.
- New `tests/vitals-shared-build.test.mjs` verifies enabled settings, legacy defaults and malicious/invalid incoming values.
- Source and behavior validation performed in isolated JS harness. Actual `npm test` and browser acceptance, Pages deployment and live D1 require verification and are **not** asserted.
- The full missing effect list remains in `docs/HP_MP_COVERAGE.md`; need game-client reference vectors for complete parity, then address remaining icon and D1/wiki/scrolling backlog.

## Source update 0.83.0 — HP/MP effect parity + responsive portrait separation

- Base HP/MP: use Pandora Saga OS class coefficients and integer-cents truncation per Remaked Modern `current-vitals.js`. Preserve existing class/race/allocated values, inventory and Soul state.
- Item/Soul effect records now apply flat HP/MP and separately floored base-derived percentage HP/MP. Structured Soul grade filters remain in place.
- Apply explicit OS item refinement descriptions for HP/MP/VIT/SPI per-N level and +N thresholds when unambiguous. No guessed unsupported enhancement or set mechanics.
- Add optional, independently chosen guild HP and guild MP buffs 0–6 and Life Sign; never infer these buffs from the name of the guild. No data migration or D1 mutation needed; existing saved build stats remain intact.
- Fully visible hero image `#hero` is shorter at desktop and mobile widths. Distinguish the compact race-selection portrait in Origin from the equipped hero presentation via labels, background and spacing at 390/790/1200px.
- Numeric reference tests cover Cleric 45 baseline 3145/1279, High Soul +SPI then +8% MP, Soul and equipment modifiers, +6/+7 refinement, separate guild buffs and Life Sign. UI/configuration and CSS regressions added.
- **Still not complete:** user expects all HP/MP impacts. Requires source-backed full sets, every conditional passive/active ability, server event/group buffs, nonstandard enhancements, game-client golden vectors across races and classes. See `docs/HP_MP_COVERAGE.md`. Do not claim accurate final server totals until parity coverage is proven.
- Full `npm test` and browser visual checks are not yet confirmed; GitHub Actions not run. Keep all historical roadmap workstreams (D1, encyclopedia, icons, sharing, scroll and layout UX).

## Source update 0.82.0 — vitals, class-selection continuity and Origin height

- Display calculated HP and MP as plain integer totals in larger Origin cards without decorative symbols. Do not suggest these are confirmed server totals: the current `PandoraOSCalculator.base()` returns `verified:false` and excludes conditionals, percentages, sets, skills and buffs. Exact OS parity needs authoritative formula and effect tests.
- Show current chosen specialization in class-wizard heading and on every ancestor direction. Selecting Back only changes `jobPathKey`; `state.job` stays unchanged. Prevent truncation by wrapping long specialization names in narrow left panels.
- On desktop, observe the central portrait stage and set the left panel's minimum height to its actual rendered height; on mobile, drop the forced height. Maintain a single natural page scrollbar.
- Race hint now says «Выбери расу».
- Added `tests/origin-vitals-specialization.test.mjs` (5 checks); updated older compact-workbench expectations. 28 checks passed in isolated JS/DOM regression harness (5 suites). GitHub Pages browser acceptance is still required.
- All previous long-term workstreams remain: D1/Worker live publish verification, original icon library, game formula parity, wiki, shared builds, user-facing scrolling and mobile polish.

## Source update 0.81.0 — remove redundant introduction, keep editor access

- No landing intro: the workbench follows header and status immediately, and a screen-reader-only H1 retains page semantics without consuming visible space.
- The admin-only `authState` indicator was moved into `header-actions`; the existing owner tools, D1 publishing and edit overrides remain accessible. No database writes or credentials were involved.
- Catalog status: routine success now stays in the footer, while actual catalog load failure is shown in the top notice. The previous site.title/subtitle override keys remain stored for backward compatibility even though that obsolete intro is no longer rendered.
- Top margin reduced to let the portrait and two side panels be the first content users see. Unused intro desktop/mobile styles removed.
- Targeted tests: new workbench-without-intro test (4) + earlier connected regression suites (19) pass in isolated JavaScript/DOM harness. Browser validation remains user-owned.
- All earlier roadmap issues (Pages deployment, D1/Worker, icons, game stat parity, encyclopedia, builder sharing, scrolling and responsive QA) remain open; nothing is silently considered complete.

## Source update 0.80.0 — slider/portrait symmetry/HUD removal

- Remove all visual top HUD markup and unused game HUD CSS. No experience indicator and no placeholder hero name above the workbench.
- Show preliminary HP/MP only in **Origin → Characteristics**, alongside the existing character level control. Keep persisted character name and profile data unchanged.
- Replace skill threshold input-overlapping buttons with thin passive ticks. Every source threshold remains represented independently, all pointer and keyboard allocation remains owned by the range. A collapsed-by-default native details list beneath the track offers individual skill icons, thresholds and independent selection.
- Force identical slot-local `--studio-slot` values on left/right equipment rails at desktop, tablet and mobile breakpoints; increase image visual size slightly.
- 19 isolated JS/mock DOM checks passed: 13 Hero Path, 4 compact workbench, 2 equipment slot tests. Browser visual QA remains the user's acceptance gate (1920×1080 and 2560×1440, 390px mobile).
- Not complete: actual Cloudflare Worker deployment/D1 connectivity, in-browser scrolling behavior, full game formula parity, original icon set, encyclopedia and shared-build acceptance. Preserve all earlier backlog/issues.

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

### 2026-10-30 · 0.56 — визуальный разбор очков каждой характеристики
- [x] Под полями всех шести параметров выводятся независимо сумма базы, ручных вложений, эффекты вещей/душ, предварительное отдельное мастерство и итог; видно цену следующего очка по Remaked SPt.
- [ ] Подтвердить актуальность стоимостей SPt и BPt у текущего OS по контрольным игровым данным. До этого ни старые вложения, ни формулы их исторического учёта автоматически не переписывать.

### 2026-10-30 · 0.57 — доступность обновлений и одна шкала
- [x] Убрана отдельная зелёная шкала: синий/золото/зелёный теперь части **одного** трека, в нём двигается ползунок вложений.
- [x] В `sessionStorage` сохраняются выбранная категория, раскрытая ветка, прокрутка правой панели и активная страница.
- [x] Исправлено 4-колоночное сжатие дерева на экранах до 1200px.
- [ ] **P0 Доставка:** подтвердить завершение последнего запуска GitHub Pages со статусом success, затем сравнить публичную `site-version.json` с HEAD. На 18:04 UTC последним успехом был `4d1bbe79`, запуск 0.56 ожидал выполнения, несколько предыдущих отменялись.
- [ ] Проверить пользовательский апдейт без потери положения, 45/42 по единой полосе, скролл/клавиатуру/сенсор на текущей опубликованной странице.

### 2026-10-30 · 0.58 — game-like single bar
- [x] В каждой раскрытой ветке до 90 позиция ползунка обозначает только вложенные очки; зелень поверх вложенных, золото между зеленью и вложениями, синяя остаточная часть до class cap, красный замок выше class cap.
- [x] В основном интерфейсе убраны кнопки ±. Точное ручное значение остаётся доступным для клавиатуры, есть отдельное подтверждение полного сброса только навыков.
- [ ] Проверить отображение замка, пороговых иконок и drag по реальному игровому референсу на мобиле и десктопе.

### 2026-10-30 · 0.59 — пороги без смещения
- [x] Пороговые иконки вдоль единой шкалы 0–90 не меняют координаты при классовом пределе менее 90.
- [ ] Browser E2E: сравнить кликабельные иконки на 8/26/41/54 и красную границу низколимитного класса; особенно ширину 410px и мобильный узкий экран.

### 2026-10-30 · 0.60 — точность полосы и пользовательская непрерывность
- [x] 0.59 успешно опубликована Pages (run 41104934636, GitHub success); 0.60 проверять отдельно.
- [x] Выравнивание заливок и красной границы по той же внутренней ширине, что и input[type=range]. Иконка центрируется на пороге.
- [x] Восстановление фокуса раскрывающей группы/ветки и точных полей навыка при обновлении UI, прокрутки каталога иконок после выбора навыка.
- [x] Миграция старых числовых ключей mastery при загрузке каталога по тому же oldToOS, что и points.
- [ ] Подтвердить в живом браузере F5, клики, клавиатуру и точность делений 8/26/45/55/90 на разных экранах.

### 2026-10-30 · 0.61 — источник требований и карточка умения
- [x] Галерея показывает доступность на основе известного `skills.json`, но не утверждает, будто умение точно выучено игроком.
- [x] При выборе иконки — локальные исходные параметры ОМ/каст/кулдаун/дальность/стихия, требования по вложенным и зелёным очкам, известные EP-функции, переход к своей wiki-статье.
- [x] Клик по иконке порога сбрасывает только поиск/фильтр списка, не стирая билд, и выделяет соответствующее умение.
- [ ] Полная верификация доступности/изучения пассивных и обучаемых умений по live OS и Remaked; UI не должен смешивать разрешённость и факт изучения.

### 2026-10-30 · 0.62 — состояние поиска и фокуса экипировки
- [x] Контролы заточки, типа, стихии и гнёзд имеют устойчивые идентификаторы для возврата фокуса после изменения свойства.
- [x] Поиск по душам хранится в состоянии открытого слота и sessionStorage; после назначения души список не сбрасывается к полному каталогу.
- [x] При выборе нового предметного слота поиск сбрасывается, чтобы старый фильтр не выглядел как отсутствие доступных душ.
- [ ] Реальный браузерный проход выбора вещи +0…+10, типов и стихий, гнёзд 0–3, выбор/извлечение души, табуляция и сенсорные касания.

### 2026-10-30 · 0.63 — реальная блокировка контролов и сворачивание дерева
- [x] В DOM-строителях устранено `disabled="false"` (HTML трактует как true); для всех boolean HTML attrs используются настоящие свойства.
- [x] Бюджет и class caps отвязаны от полной загрузки Wiki/D1, local classes и tables читаются отдельно, неизвестные class caps не подменяются 90.
- [x] Повторное нажатие на группу закрывает её целиком; закрытая группа не открывается снова после F5 или асинхронной загрузки каталога.
- [ ] Выполнить реальный браузерный тест: 45-й уровень 103 свободных, Клирик → Молитва → Милосердие, перетащить 0→10→20, увидеть расход 10/20, выполнить F5; проверить class cap и раскрытие/закрытие при тапе.
- [ ] Проверить disabled/checked boolean во всех других динамических интерфейсных компонентах и отсутствие CSS overlay над range.

### 2026-10-30 · 0.64 — интерактивные регрессионные тесты
- [x] Постоянный `node:test` сценарий на 103 свободных: 0→10→30→0, запрещённый cap0, двойное нажатие на группу и правильное disabled=false.
- [x] Подсказка о drag и клавиатурных стрелках непосредственно в редакторе ветки.
- [ ] Запуск full `npm test` в доступной среде и реальный E2E на опубликованной странице (не только симуляция), контроль мобильного ввода.

### 2026-10-30 · 0.65 — изменения прямо во время прокачки
- [x] Во время `range.input` обновляются итоговая сумма группы, вложенные в ветку очки и зелёное мастерство без перерисовки и обрыва перетаскивания.
- [x] При смене профессии автоматически раскрывается первая ветка с разрешённым лимитом; старые значения не стираются.
- [x] Недоступные по классовому лимиту реальные пороговые умения остаются видны в едином треке и маркируются замком.
- [ ] Провести интерактивный браузерный тест для class switch/drag/milestone popovers, проверить мобильную ширину иконочных порогов.

### 2026-10-30 · 0.66 — предсказуемое открытие развития
- [x] Первую раскрытую категорию определяет максимальная сумма class caps для доступных навыков, а не первый разрешённый пункт в списке.
- [x] Проверена категория по фактическим classes.json для Cleric/Warrior/Mage/Predator.
- [x] Ручной выбор и сворачивание группы не отменяются автоматически.
- [ ] Browser QA на смене профессии с вложенными очками и повторном входе после F5.

### 2026-10-30 · 0.67 — тестирование реальных обработчиков
- [x] Исправлено некорректное `sources.app` в новом регрессионном тесте, выявленное его независимым запуском в V8.
- [x] Функциональный тест действительно вызывает `selectJob` и проверяет неприкосновенность очков/mastery с новой профессией.
- [x] Реальная OS-запись «Раскол» (Рубящий удар, порог 41) проверяется против cap15 Клирика в `milestones`, значение отмечается `locked`.
- [ ] Full `npm test` на Node + визуальный браузерный E2E + публикация 0.67 GitHub Pages.

### 2026-10-30 · 0.68 — очистка интерфейса развития
- [x] Родительская группа при сворачивании закрывает ребёнка и при повторном раскрытии не восстанавливает его, включая F5.
- [x] Компактные маркеры порогов (несколько дорожек), настоящее изображение и описание в hover/focus tooltip.
- [x] Скролл правой панели и дерева передан странице, длинный каталог порционно раскрывается.
- [x] Класс + показатели очков в одном блоке; выбранное умение раскрывает карточку непосредственно над галереей.
- [ ] Настоящий визуальный/browser E2E и проверка тач-раскрытия маркеров.

### 2026-10-30 · 0.69 — устранение лишних UI-строк
- [x] Нет подробных технических записей под редактором каждой базовой характеристики; реальные формулы не затронуты.
- [x] Равные размеры `+`, `−` и ручного поля на desktop/mobile.
- [x] Только вкладка «Души» управляет гнёздами; удалена дублирующая строка в «Свойствах» и лишние кнопки/пояснения.
- [x] Короткая легенда развития; исходные данные и wiki не удалены.
- [ ] Визуально проверить табуляцию, точный размер полей, scroll и состояние выбранных душ в живом браузере.

### 2026-10-30 · 0.70 — осмысленные регрессионные сценарии
- [x] Изменены устаревшие ожидания тестов: повторное открытие группы не восстанавливает ветку, удалены техничные ярлыки.
- [x] Тест порогов на настоящих OS-умениях Клирика: маленькие маркеры без полноразмерных иконок в дереве, hover содержит данные навыков.
- [x] CSS-regression на отсутствие вложенного скролла в правой панели.
- [ ] Прогнать npm test и Playwright в рабочем окружении, уточнить UX смартфона.

### 2026-10-30 · 0.71 — устранение ложного падения теста
- [x] HTML boolean атрибуты проверяются отдельно от обычного `setAttribute`; они не должны ошибочно запрещать aria-label/title.
- [ ] Повторить тесты после изменения, выполнить full `npm test` и browser QA на мобильных и десктопе.


## Release 0.125.0 — new hero and D1 library

- [x] New characters start at level 1 while the planner retains 1–55, including future content above the temporary OS server cap.
- [x] My Builds has inline unsaved-draft Save / Discard / Cancel actions with no modal for New Build. Redundant global sharing removed.
- [x] Added private Cloudflare D1 library migration 0004, Worker API, per-browser secret and local offline copy; old local builds are imported into D1 when online.
- [ ] Apply D1 migration, deploy Worker, validate live sharing and short links, run full npm test and real browser E2E. Continue 59 missing and 59 partial Remaked formula keys.


## 0.126.0 — browser library resilience and automated D1 preparation

- [x] One-click «Новый билд» in the central character stage opens the existing inline unsaved-draft action in My Builds.
- [x] Offline deletions are queued locally and replayed to D1 before cloud-library hydration; a generation guard prevents older GET responses from overwriting edits made during the request.
- [x] Worker creates only the three missing, fixed shared-link schema objects or two private-library schema objects on first use, using idempotent SQL. This never modifies game catalog datasets; schema files remain in GitHub for controlled migration/backup.
- [ ] Confirm actual Worker deployment, D1 auto-setup, successful short-link creation/readback and browser E2E. If D1 DDL is denied, the API continues to report 503 without silently pretending a save worked. Complete remaining Remaked formulas and full npm test.


## 0.127.0 · Source-backed mounted-stat preview

- [x] Remaked `RelHorse` class baseline, riding green mastery and selected Honor shown in hero book without imaginary equipment bonus. Status PARTIAL; server parity unverified.
- [x] Audit: 58 NOT YET PORTED, 60 PARTIAL, 15 BASE/PREVIEW, 10 BUFF PREVIEW; tests for formula, validation and integration added.
- [ ] Continue conditionals, refinement, gear/soul procs, target-dependent damage, complete Node/browser verification and live Cloudflare deployment checks.


## 0.128.0 — individual share actions and D1 lifecycle tests

- [x] A saved build's Share action creates an **inline** short-link and selectable URL with Copy button inside that same build card; Worker/D1 errors render alongside the card instead of opening a blocking browser alert.
- [x] New Node regression suite uses an in-memory D1 adapter to test private save, listing, deleted tombstones, 55-level compatibility, isolation across browser secrets, and malformed input rejection. The existing 0003 public shares remain enabled only when the updated Worker and D1 schema are live.
- [ ] Execute real `npm test` and browser E2E, confirm live Pages 0.128.0 and Worker, verify public share POST/GET and clipboard from a published site, and complete remaining Remaked calculations.


## Source update 0.129.0 — revocable short links and inline deletion

- [x] Every **new** short link is tied in D1 to the owner's saved build, using only a hashed browser key and saved build ID; public GET checks its source's tombstone before returning the snapshot. Deleting the original revokes every associated URL, across recipients, with HTTP 410 and a stable `reason: deleted`.
- [x] Existing anonymous legacy short links without ownership data return 410 `reason: legacy`, rather than pretending they support deletion-based revocation. The schema upgrades in place (no destructive table replacements).
- [x] The server refuses shares without a saved owned build, refuses anonymous share creation, and prevents deleted IDs from being restored by a stale pending PUT. Ownership mapping and snapshot insertion use an atomic D1 batch.
- [x] Opening a dead/old/invalid link shows a compact bottom-right toast (8.5 seconds or OK). Deletion confirmation is inline; an offline deletion honestly warns that links remain active until cloud synchronization.
- [ ] Full `npm test`, live server deployment and real browser end-to-end checking required. Keep all Remaked incomplete formulas, future level 55, visual improvements, icon and catalog backlog open.


## Source update 0.130.0 — saving the active build vs creating a copy

- [x] Opening a library build marks its source ID in the current tab, surviving refresh. Saving changes updates the same library record and D1 row instead of producing accidental duplicate builds.
- [x] «Сохранить копию» explicitly creates a separate build with a new ID. A new clean character or imported public snapshot drops the active-original association.
- [x] Changed names propagate into the saved character snapshot and ongoing draft. Browser quota failures roll back the save and display a user-facing toast.
- [x] Add a visible cloud retry action; a 409 tombstone conflict is not misreported as a generic network outage.
- [ ] Browser/real D1 full acceptance, complete Remaked parity and verified live battle effects are outstanding. Short links retain immutable snapshots when the source build is edited; deletion of the source revokes all its links.


## Source update 0.131.0 — private data scrub on revocation

- [x] Deleting a D1 build now atomically writes its permanent tombstone and scrubs all public shared snapshot payloads belonging to that owner/source ID. The source-link mapping is retained only so GET returns HTTP 410 with the right deletion reason.
- [x] Legacy D1 deployments without `shared_build_sources` continue to support safe library deletion without requiring manual schema changes.
- [x] Restoring the active saved-build ID tolerates blocked sessionStorage (private-browser/storage restrictions) without crashing the entire app.
- [x] Expanded regression coverage to assert that revoked public snapshot bytes are cleared and that another player's link remains available.
- [ ] Confirm live Worker release, actual D1 POST/GET/delete and full browser E2E. Unported Remaked mechanics and OS-specific target-dependent bonuses still need source-backed implementation.


## Source update 0.132.0 — safe switching between saved builds

- [x] When opening a saved library character with unsaved changes in the current workbench, show an inline decision inside that build card: «Сохранить текущий и открыть», «Открыть без сохранения», or «Отмена». No global browser confirm dialog.
- [x] The default open action is immediate when the current draft is already saved or blank. Loading still preserves old/future fields via the existing in-memory clone and merge.
- [x] Add static guard for the choice, save-before-open requirement, and existing-legacy field-preserving restoration.
- [ ] Actual browser acceptance remains necessary, along with Remaked combat parity, Worker lifecycle testing and full npm test.


## Source update 0.133.0 — stale card and offline deletion guard

- [x] When «Save current and open» targets the same saved build, resolve its newest in-memory snapshot after saving; don't reopen a stale card's pre-save version.
- [x] If the browser cannot store a queued offline deletion, still attempt immediate server deletion and explicitly warn when a later retry cannot be guaranteed. Never claim revocation before D1 confirms it.
- [x] Keep all current 1–55 planning, per-build revocable links, D1 migration and Remaked audit in place.
- [ ] Confirm full Node suite, cross-browser/cloud Worker lifecycle, and unimplemented combat/skill effects.


## Source update 0.134.0 — correct saved-build regression expectations

- [x] The share-link and save-workflow tests now require the **current** source of truth (`latest.data` and `latest.id`) instead of the stale card snapshot after Save-and-open.
- [x] Keep existing new-character, D1 revocation, inline UI, legacy field compatibility and release guards unchanged.
- [ ] Run actual full Node suite and browser/Worker E2E; these test-source corrections do not prove the suite passes.


## Source update 0.135.0 — authoritative D1 shared snapshots

- [x] Public short-link POST now derives the character snapshot solely from the saved, owner-authorized D1 record. Untrusted caller-supplied snapshot data cannot be substituted for an unrelated build; the website sends only the saved build ID.
- [x] The 200-build D1 limit counts only active records; permanent deletion tombstones no longer indefinitely exhaust the number of usable library slots.
- [x] Regression assertions cover attempted tampering with shared snapshots. Existing snapshots stay immutable; deletion still revokes all linked IDs and scrubs payloads.
- [ ] Real Worker POST lifecycle, full Node suite, browser E2E and Remaked battle parity remain pending.


## 0.136.0 — source-backed target-dependent Soul reductions

- [x] Six real current OS soul records contribute signed, target-family-specific reductions to the Hero Book defense page; grade gates respected and duplicates not silently combined.
- [x] Five corresponding Remaked keys now PARTIAL; inventory has **53 missing, 65 partial**, 15 base, 10 buff previews. Golem effects remain separate from unverified Remaked Inanimate equivalence.
- [ ] Finish conditional passives/procs, server damage packet, full npm test, browser E2E and responsive UX audits.


## Source update 0.137.0 — on-hit and on-damage equipment/Soul proc previews

- [x] Render source-listed triggered skills for five known ONHIT/ONDAMAGE EP codes in the Hero Book, using exact skill IDs, eligible enhancement ranges and the published OS skill catalog.
- [x] Do not convert procs into deterministic attack statistics. Suppress a conflicting numeric chance when a source description disagrees (Soul 101009: 4% text vs b=5).
- [x] Regression tests cover real proc skills, item-on-damage effects, grade bounds, contradictory chance and missing skills. Remaked coverage remains 53 missing/65 partial/15 base/10 buff previews: no completed damage formula is claimed.
- [ ] Browser E2E, full npm test, exact trigger probabilities and remaining Remaked skills/target damage need verification.


## Source update 0.138.0 — short-link idempotence and revisions

- [x] Sharing an unchanged owned D1 build returns the existing 11-character short ID; repeated clicks no longer burn the daily share quota or create unnecessary duplicate links.
- [x] Once a player updates a saved build, the older short URL remains an immutable snapshot and a new short URL is issued for the new character state. Deleting the original revokes **both** versions and scrubs both snapshots.
- [x] Expanded mocked D1 server regression to cover idempotent sharing, different revisions, malicious client payloads, and multi-version revocation.
- [ ] Run live browser link-copy flow, live D1 write/delete acceptance and complete Node test suite independently.


## Source update 0.139.0 — complete private library listing

- [x] D1 library GET no longer truncates the result to the newest 250 rows, which could hide older active builds when numerous permanent deletion tombstones were newer.
- [x] Active rows are ordered before tombstones; all deletion IDs remain represented to prevent an old offline cache from treating deleted builds as new unsynced characters.
- [x] Regression guard covers one original level-55 build and 275 newer tombstones without dropping that active record.
- [ ] Consider paged sync and compact tombstone records for extremely large historical libraries; verify full Node suite, real D1 E2E and browser acceptance.


## Source update 0.140.0 — faithful D1 test doubles

- [x] The mocked D1 query layer now supports both read shapes used by the public share lifecycle: the source snapshot and the source deletion status. Revoked links can be checked for their actual HTTP 410 response rather than a spurious mock-only 500.
- [x] Library lifecycle mocks now distinguish the existing private_builds table from an absent shared_build_sources table. The offline/legacy delete path no longer attempts an unsupported fake D1 batch.
- [x] Independently confirmed the SQLite ordering with one active level-55 build and 300 tombstones: all 301 rows remain available with the active build first.
- [ ] Full Node npm test and deployed browser E2E are still required; updating test doubles does not constitute full-suite success.


## Source update 0.141.0 — saved-build identity across browser restarts

- [x] The active named build association is stored alongside the existing draft in localStorage, with sessionStorage kept as the per-tab first choice.
- [x] Restoring the active ID checks that a matching build still exists in the local library; New Build and opening an unrelated shared snapshot clear both stored identifiers.
- [x] Storage exceptions do not prevent editing, and a resumed saved build is updated instead of silently becoming a duplicate.
- [ ] Full browser session-restart acceptance, npm test and multi-device library-key transfer remain to be validated.


## Source update 0.142.0 — focused saved-build search

- [x] When the local/cloud library contains more than five saved characters, a single inline search field filters cards by name, race, profession or level without reloading any build or opening a modal.
- [x] Search text survives in-section re-renders (save, comparison, cloud update), and a clear empty-results message appears only for a nonempty unmatched query. Small libraries have no extra search field.
- [x] Existing actions remain per-build; no global sharing controls were added.
- [ ] Test actual keyboard focus and mobile layout in browsers and complete the remaining Remaked/OS combat parity backlog.


## 0.143.0 — no silent loss of offline edits

- [x] Reconcile the local browser cache and remote D1 by each saved build's revision. Newer offline changes remain visible and are uploaded again rather than overwritten with older cloud data.
- [x] Do not upload queued stale local copies if a save/delete occurs during cloud retrieval.
- [x] Local saves advance timestamps monotonically for each ID. D1 uses an atomic SQLite UPSERT condition to reject older versions and deleted sources even when requests complete out of order.
- [x] Differentiate "cloud has a newer version" and "source already deleted" errors.
- [x] Add regression tests for stale writes, source deletion races and offline cloud reconciliation.
- [ ] Complete Node tests, real Cloudflare D1 conflict scenarios and browser offline/online acceptance are still required. Multi-device wall-clock skew remains a limitation of client timestamps.


## 0.144.0 — complete the available OS inputs to old Remaked status resistances

- [x] Eleven historical status/debuff-resistance branches advance to PARTIAL, with game-source-backed equipment values and verified Honor, Dwarf and Warding skill effects where applicable. Counts: 42 NOT YET PORTED, 76 PARTIAL, 15 BASE/PREVIEW and 10 BUFF PREVIEW.
- [x] Current OS passive 260007001 requires Warding Adeptness 26, allowed class and exactly one TARGET row for each of three +15 effects; duplicated CASTER frostbite row is ignored. The Dwarf racial passive 900030001 adds +10 to stun and tumble, while fire/ice/lightning Honor titles each grant +5 to a distinct status.
- [x] No unsupported numerical combat hit chance, immune status threshold or non-OS bleeding and unseat effect is fabricated.
- [ ] Full Node/browser E2E and verification against actual game server remain outstanding.


## 0.145.0 — passive class-cap gate and unobstructed player book

- [x] A Warding 26 Soul/passive bonus cannot be enabled when the current profession's real branch cap is less than 26, even if an invalid saved allocation claims the required mastery. SNIPER and other eligible classes still receive their supported passive effects.
- [x] Remove methodology/debugger comments from the **ordinary player's** Hero Book. Developer formula disclosures remain in admin mode only. Public main summary uses intuitive gameplay labels rather than technical 'Частично' disclaimers; Origin HP/MP accessibility labels report clean numeric values.
- [x] Add regression checks for cap gating and public UI text while retaining admin-only formula trace and structured effect-coverage diagnostics.
- [ ] Perform full browser/keyboard/mobile QA and full Node suite; calculator server parity remains incomplete.


## 0.146.0 — restore account-free D1 library on a second device

- [x] Add an optional, collapsed transfer panel: reveal or copy the private browser key only after an explicit action. Importing the key first checks the live D1 library using that key, then merges local and remote saves instead of erasing either.
- [x] Refuse switching owners while offline deletions are still queued, to avoid applying old-library tombstones to the new owner's key and accidentally leaving links from the old owner active.
- [x] Clearing the active saved-build association before connecting a different key prevents an old local draft from overwriting an unrelated restored record.
- [x] Add validation, input and regression guards; do not put personal recovery secrets in public files, logs or URLs.
- [ ] Browser live transfer E2E, token rotation/revocation and true account authentication remain future tasks.


## 0.147.0 — secure two-stage code reveal and copy

- [x] Recovery-code disclosure uses one deterministic button listener: first click reveals and selects the secret, second click copies it (with manual selection fallback). The old dynamically assigned onclick is removed, avoiding double-running reveal and copy handlers.
- [x] A syntactically valid but empty remote D1 library is not treated as successful recovery; users must verify the full code instead of replacing a working key with an accidental empty owner.
- [x] The code remains hidden until explicit user interaction, and the UI remains collapsed by default. No technical notes added to the ordinary build editor.
- [ ] Browser clipboard and password-manager acceptance, real Worker transfer and future account recovery/revocation remain pending.


## 0.148.0 — user-facing text cleanup and real test fixtures

- [x] Remove the remaining technical Remaked/server-verification paragraphs from public Origin buffs and the HP/MP coverage status. Keep useful explanations of gameplay requirements and values.
- [x] Restore the isolated HP/MP test's required potion-preview dependency and assert the clean accessibility label instead of the removed technical disclaimer.
- [x] A malformed saved character now shows an inline share-card error, not an uncaught exception.
- [x] Recovery code import checks that a D1 library contains an actual active saved build, not just deletion tombstones, before replacing the browser owner key.
- [ ] Need real browser/D1 E2E and the full npm test runner once the complete source workspace can be executed.


## 0.149.0 — historical snapshot round-trip and stale regression repairs

- [x] Preserve the historical runeJoEun Boolean field when opening or sharing a stored character. The source OS catalog does not identify a matching current item, so the old rune is NOT automatically added to game calculations.
- [x] Update outdated tests for clean Origin HP/MP labels, modern separate proc/target combat previews, and the distinct equipment part of natural MP regeneration.
- [x] Verify technical formula methodology is retained only for authenticated site-admin mode.
- [ ] Full npm test, browser E2E, and current server parity are still required.


## 0.150.0 — source-backed earned XP bonus

- [x] Current OS beginner cape ID 18073 grants a real +5% earned EXP via EP_VOLUME_EXP. Only equipped records can contribute; refinement bounds and per-item sources remain visible without pretending to know the full server reward formula.
- [x] The EXP branch moves to PARTIAL; inventory: **41 missing, 77 partial**, 15 base previews and 10 buff previews. SkillEXP remains missing: no confirmed matching current-game effect has been discovered.
- [x] Added regression tests for the actual published OS item ID, conditional grade gates and separate effects UI.
- [ ] Verify XP grant behavior in the live game and complete remaining Remaked branches; full Node and browser E2E still required.


## 0.151.0 — player-focused UI labels and icon messages

- [x] Remove implementation phrases embedded in plain Hero Book values (partial magic attack and healing labels, unverified rounding notes, rainbow gem debug message). Players still see the distinct conditional effects and their actual source values.
- [x] Replace local OS icon counts/import diagnostics in the public interface with useful generic loading/availability messages.
- [x] Keep technical auditing in source documentation and authenticated admin views, not in regular gameplay-facing descriptions.
- [ ] Verify responsive rendering and actual browser focus/hover flows. Complete remaining formula branches.


## 0.152.0 — corrected concise gem and image labels

- [x] Correct the special rainbow-gem label to a single readable player-facing phrase instead of the duplicate text introduced in 0.151.0.
- [x] Do not claim that every image is available when the local manifest is missing; describe the active source without overstating actual fetch success.
- [x] Extend regression tests to catch reintroduced repeated gem phrases.
- [ ] Browser render and full Node suite remain outstanding.


## 0.153.0 — protect actual current mitigation and conditional skill behavior

- [x] Update old test snapshots to recognize the newly added, independent earned-EXP preview without accidentally classifying it as a damage bonus.
- [x] An incoming physical damage-percent modifier is already modeled by the current equipment calculator; tests now assert calculated mitigation. On-hit skill procs remain conditional and must never be included in deterministic damage.
- [x] Preserve a targeted regression test for each distinction, preventing a stale fixture from forcing incorrect behavior back into production.
- [ ] Run the full Node suite and deployed Worker/browser E2E before claiming complete coverage.
