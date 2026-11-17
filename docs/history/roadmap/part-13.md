# История ROADMAP — часть 13 из 20

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

