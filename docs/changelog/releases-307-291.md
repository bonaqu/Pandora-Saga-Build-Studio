# История релизов · 0.307.0—0.291.0

## 0.307.0 — 2026.11.02.307 · Owner equipment editor and existing-project Cloudflare instructions

- Replace first-install D1 migration/setup instructions with a precise existing-Worker guide for adding a fine-grained GitHub token as Cloudflare Secret. No D1 recreation.
- Add visual owner item editing in encyclopedia: numerical attributes, allowed classes, effect rows and a separately labeled acquisition note. Save only changed fields to independent D1 owner overrides; none overwrite source snapshots during future sync.
- Enable RU item/skill name and description double-click, including race passive titles; synchronize owner changes in hero calculations and encyclopedia.
- Distinguish an administrator-provided acquisition note from actual loot or NPC trade data. Source graphs and exchange recipes are not yet modified by the new editor.
- Prevent password-manager autofill targeting the encyclopedia search using explicit search field identity and ignore hints.
- Add server-side structured payload validation, XSS-safe DOM form, undo compatibility and regression tests.

## 0.306.0 — 2026.11.02.306 · Direct GitHub PR from published catalog; isolated D1 diagnostic

- Authenticated administrator can create a GitHub PR directly from the current published catalog with no browser-held GitHub credentials. Worker accepts one fixed repository and 17 game data paths, creates a separate branch, and never merges automatically.
- GitHub integration requires optional Cloudflare Secret `GITHUB_CATALOG_TOKEN`, with selected-repository Contents/PR permissions. Disabled safely until configured.
- Source baseline and active D1 snapshot are both checked again before PR branch creation. Repeated clicks reuse an existing PR for the same snapshot.
- One-click administrator D1 write/read/delete verification uses a disposable unreferenced catalog entry. It does not modify active data or player accounts.
- New isolated tests cover authorization, D1 reconstruction, scoped PR creation and temporary data writes.
- Real external GitHub mutation and live production D1 admin diagnostic need owner-side credentials; tests simulate those operations without secrets.

## 0.305.0 — 2026.11.02.305 · Reviewed catalog update safety for GitHub

- Rename the downloaded administrator-approved catalog artifact to `pandora-studio-reviewed-catalog.json`; existing export format remains supported for backward compatibility.
- Name the import bridge `apply-reviewed-pandora-catalog.mjs`, retaining the stable `npm run catalog:review` command.
- Before `--write`, detect uncommitted changes under `data/os/` and stop rather than silently overwriting a developer's source edits.
- Prepare all changes to temporary same-directory files, then commit replacements and restore already replaced originals if an ordinary filesystem error occurs. Dry run still never modifies data.
- No Cloudflare database writes or player-account changes.

## 0.304.0 — 2026.11.02.304 · Safe game-catalog review and neutral project copy

- Removed direct source-server branding from maintained documentation and runtime copy. All technical game-data URLs, stable IDs and D1 datasets remain unchanged.
- Simplified admin controls to **Игровой каталог → Проверить обновления игрового каталога → Применить выбранные изменения**.
- Reject mixed remote revisions by rechecking metadata after 17 source downloads. Authorised source proxy is covered by new allowlist/credential tests.
- Administrator 401 cannot sign out an independent player account. Decisions are locked during publishing. A successful D1 publication is never misreported as rolled back if UI reload fails.
- Replaced an obsolete Cloudflare import procedure with the actual interactive selective-review instructions. No production database writes were performed.

## 0.303.0 — 2026.11.02.303 · D1 Legacy translation isolation

- Fixed a hidden cross-data overwrite risk: accepting new current game server items, skills or tables must not regenerate the published D1 `legacyLocale` namespace from the local GitHub archive.
- Read the current D1 locale under the same catalog snapshot lease, reject incomplete/duplicate records and copy exact existing keys, text and provenance into the new snapshot.
- Extend unit and interactive Chromium admin sync checks; no production D1 write, user-build mutation or speculative combat formulas.

## 0.302.0 — 2026.11.02.302 · Pandora Studio modules named and dependency links audited

- Pandora Studio modules named and dependency links audited
- 27 root/Worker runtime source files renamed and all 588 tracked references rewritten across 170 files; complete Node/Chromium regression verified on feature branch.
- Added persistent runtime dependency audit, architecture/operator documentation and explicit metadata approval during selective OS synchronization.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.301.0 — 2026.11.02.301 · current game server admin review and safe source refresh

- Admin can review every detected game-record change, choose individual changes or full sections, search by source ID/name and approve nothing by default. Interdependent formula, trade and instance structures are accepted as atomic groups.
- A dedicated OS workbench module and stylesheet replace the large inline admin editor workflow. Source utilities now have descriptive current game server file names; loader and test references are updated.
- Curated versions recompute source/translation counts and do not inherit misleading official CSV hashes. New D1 publish requests use a server-side atomic expected-active lease to reject stale admin decisions.
- The review can be downloaded as a GitHub-ready JSON snapshot, then applied to checked-in OS source files through a validated, dry-run-first CLI. GitHub and Cloudflare are never silently cross-written.
- Official game formula verification, Worker production deployment and authenticated D1 lifecycle acceptance remain separately tracked. No automatic changes to player builds, 1–55 planning or Encouragement +9.

## 0.300.0 — 2026.11.02.300 · Clean item names, physical attack forge notation and left-aligned eligibility

- Remove synthesized elemental prefixes/suffixes in equipment names. The canonical RU/EN item name retains its +grade; the chosen element appears in its own field.
- For a physically refined weapon, show the OS weaponPlus-derived Attack base+increment, e.g. W 53 at +4 shows 53+12, not 53+4. Magical gems and missing tables do not fabricate a physical attack bonus.
- Race/gender suitability chips now align from the left. Hover and editor share weaponPlus data; tests verify all 10 weapon tiers and both gem types.
- Do not alter Remaked defense rounding, HP/MP, Encouragement at Blessing 90 (+9), saved builds, level-55 planning or D1. Full live OS calculator parity remains unconfirmed.

## 0.299.0 — 2026.11.02.299 · Faithful Remaked buffs, elemental refinement and OS resistance audit

- Restore **Ободрение / Battle Prayer** (OS skill 320012001) to Hero Book priest enhancements. Selectable and tracked as an effect, with the preserved Remaked blessing-based +STR/+AGI/+INT computation, source identity and mastery 61 validation. Existing priest settings (SD 134 / Blessing 90 / Hymns 30) remain editable.
- Equipped gear names now include the selected elemental word and refinement grade like the supplied game screenshots. Physical/magical gem type is selectable only for weapons; armor and shield choose only an element. Old saved armor type values normalize without changing their elemental effect.
- Item hover shows the client-style base+grade notation (e.g. 31+4 for +4 armor); the separate total-defense calculator retains Remaked floor(grade*1.5) contribution until verified against live OS behavior.
- Audit structured elemental and status resistances across the entire checked-in OS item and Soul catalogs at **all 11 refinement grades** and official Forth snapshots. Only effectively socketed and equipped effects participate.
- Add six source-backed, explicitly opt-in resistance skill effects with RU/EN labels (including incoming enemy resistance debuffs and negative values), plus a selected-skill breakdown. Spell effects are never treated as permanent without activation.
- Existing Node.js and Chromium workflows reused. Some conditional skills, server-side damage interactions, and modern OS effects still require verification; no D1 mutation.

## 0.298.0 — 2026.11.02.298 · Style skill buffs and remove abandoned UI code

- Skill-effect rows now have compact, aligned game-styled icon, name and numeric-effect columns matching the Hero Book's dark/gold visual language.
- Remove unused old skill-search CSS, abandoned optional Proelium-section structure, and redundant removed Soul-item card styling. Keep the shared main stylesheet under its size budget.
- Update focused source assertions for the simplified buff section and new skill-effect rows. No new test runner or external dependencies.

## 0.297.0 — 2026.11.02.297 · Skill-effect songs and exact gear armor notation

- Hero Book song effects now appear in the Skill effects chapter rather than the Buffs configuration chapter. The OS class/mastery checks and never-assume-song-activation policy remain unchanged.
- Equipped armor hover shows the requested compact base+refinement format, such as 11+3 and 13+6, matching the calculator's existing per-piece refinement rule.
- Added one focused regression test for the song chapter association and updated item-preview acceptance assertions. This is a source release; live server parity is not implied.

## 0.296.0 — 2026.11.02.296 · Priest defaults, equipped detail and Remaked-style Hero Book

- Fresh heroes now start with an enabled external priest and editable SD 134, Blessing 90, Hymns 30. Saved and shared build values take precedence, including explicit disabled settings; older snapshots inherit missing defaults.
- Current OS items, skills and English names did not confirm the historical Proelium effect. Hide its controls and exclude it from active stat calculations while retaining previous saved keys for compatibility.
- Hovering an equipped item now shows its actual socketed Souls and their descriptions, per-item base armor plus refinement, refinement rank and clearer race/gender restrictions, rather than only the generic item catalog record.
- Hero Book has six Remaked-style chapters: Results, Attack, Defense, Buffs, Skill effects, Potion effects. Remove redundant equipped-item cards and the all-skills inspector; move skill recovery previews and selected active-skill summaries into Skill effects, and potion effectiveness into Potion effects.
- Split tooltip styling into a dedicated stylesheet to retain the main CSS size budget, and add or adjust source and browser regressions without introducing redundant test runners.
- Automated checks do not prove every modern current game server server calculation; level planning remains 1 through 55.

## 0.295.0 — 2026.11.02.295 · Show only effectively available priest buffs

- The Hero Book active-buff counter excludes selected but unavailable priest skills when Blessing rank is below their source requirement (8 for Velox, 12 for Lapis Medio).
- Existing selections remain stored and can become effective again when the required mastery is restored.
- Add a direct, parameterized test of the exact counter expression for enabled/disabled priest, threshold ranks and automatic guild overrides. No extra test runner.

## 0.294.0 — 2026.11.02.294 · Sync guild effects across Origin and Hero Book

- Both Origin and Hero Book show identical level-derived guild HP/MP and regeneration ranks when guild auto-passives are selected; manual Origin selectors are visibly disabled with localized explanation instead of showing misleading stale ranks.
- Manual guild selections are preserved and restored when changing the guild level back to zero; change handlers reject conflicting writes while automatic guild ranks are active.
- Add one in-memory UI regression test for synchronized display, disabled selectors, blocked conflicting changes and restoration of manual values; no extra browser runner.
- Player planner still supports level 1–55. Browser and Worker acceptance require separate CI verification.

## 0.293.0 — 2026.11.02.293 · Source-backed alchemy names and cleaner Hero Book

- Corrected the priest Hymns field and the current OS alchemy skills: Яд/Toxify and Усиление яда/Toxic Aura, preserving matching RU/EN source identities.
- Removed dead pre-Remaked translation aliases and a redundant book locale declaration. Shortened player-facing guild/priest notes without changing the distinction between applied and preview-only bonuses.
- One parameterized regression test covers eight meaningful external-priest combat cases, including below/at mastery thresholds, disabled buffs and malformed values.
- Browser deployment and live Worker readiness require independent checks.

## 0.292.0 — 2026.11.02.292 · Remaked RU/EN buffs and priest mastery safety

- Hero Book uses the Remaked-approved Russian skill identities for attack/defense signs, group protection, Holy Weapon, Dark Aura, enchantment and hymns, with their corresponding English client names.
- External priest's attack speed and defense signs require Blessing mastery 8 and 12, respectively, matching current OS skill records; disabled selections do not affect the calculation.
- Invalid external priest values from older or damaged local saves cannot grant combat bonuses or crash the preview; the enhancement counter excludes mastery input fields and inactive selections.
- Added regression assertions for source-backed prerequisites and official names. Deployed browser/Worker state requires independent verification.

## 0.291.0 — 2026.11.02.291 · Live OS sync, priest and guild inputs, compact profile and resistances

- Fixed OS source verification: public `/gamedata/*.json` works. Compared 17 datasets by source IDs. Reconciled 10 changed monsters and 5 changed drop entries; live OS added `slotAdd:1` to five drop items but probabilities did not change. Updated source meta hashes.
- Logged-in profile loses the unexplained decorative star; neutral sign-out button. Monster resistances fit five columns / two rows on desktop, with responsive mobile wrapping.
- Hero Book adds an external priest profile (SPR/SD, Blessing, Hymn) and optional application of verified Remaked Gratia attack-speed and Lapis Medio defense formulas. Other priest effects are explicitly read-only previews.
- Guild levels 1–12 automatically configure the currently supported HP/MP and regeneration passives from Remaked; level 0 retains manual buff selection. Guild physical/magic damage reductions and experience unlocks display but are not fabricated into an unsupported combat formula; honor titles retain single selection.
- In a safe read-only bridge, D1-backed encyclopedia can adopt only audited changed monster/drop fields from checked-in verified source when its D1 source hashes match the known older version. This is not a D1 write or complete data import.
- Live chest composition remains unchanged in publicly exposed `chests.json`; unavailable location-chest odds are not invented. Planning cap remains 55.
