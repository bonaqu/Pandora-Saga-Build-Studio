# История ROADMAP — часть 11 из 20

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

