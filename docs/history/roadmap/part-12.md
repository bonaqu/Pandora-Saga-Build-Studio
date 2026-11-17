# История ROADMAP — часть 12 из 20

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

