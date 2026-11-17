# История ROADMAP — часть 9 из 20

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
- Use the already supported official `strings.en.json` ID-based names for skills/items via the existing `pandora-studio-app.js` localized catalog. Do not fuzzy-translate user-edited text or invent missing game terms. Experience-bonus title and percent suffix are also bilingual.
- Retain source-accurate chance corroboration, source-key dedup, all stored builds and account logic, no server-formula additions, and planning levels 1–55.

## Source update 0.223.0 — lossless multi-proc book and source identity

