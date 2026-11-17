# Исторические заметки README · часть 6 из 6

## 2026-10-30.23 — navigation reliability

All internal encyclopedia crosslinks now use real fragment URLs, so context links work with browser history, copying, keyboard navigation, and Ctrl/Cmd-click to open a new tab. The normal click stays within the all-in-one workspace. Milestone positions use broadly supported CSS `calc()` addition rather than multiplication, improving browser compatibility.

## 2026-10-30.24 — remove broken Legacy icon fallback

A missing current skill sprite now falls back to the **correct branch icon already mirrored into this repository**, not to an invalid dynamically constructed URL in the old simulator. Unknown or removed item IDs use the UI's slot glyph instead of silently fetching a non-authoritative external item icon. When the original OS icon WebPs are mirrored, verified entries in the local manifest replace the remaining OS image fallbacks.


## Build library · 0.125.0

A blank character starts at level **1**; level **55** remains the maximum planning level. The My Builds «Новый билд» action has an inline choice to save or discard an unsaved draft, without blocking dialogs. Sharing is available only for individual saved builds. The private library now targets D1 via `/api/library`; localStorage is kept as offline fallback. **Deployment prerequisite:** apply `worker/migrations/0004_private_builds.sql` and deploy the updated Worker. The random browser secret is not an account; clearing it without backup loses access to previous D1 library records. Live deployment is not confirmed.


### 0.126.0 · Faster creation and cloud recovery

The character stage also exposes «Новый билд», which reveals the same inline Save / Discard options as My Builds. Deletions made offline stay queued until D1 acknowledges them, so a reconnect does not restore deleted builds. When deployed, the Worker can create only its fixed missing auxiliary D1 tables on first use, without rewriting game catalog data; SQL migrations remain checked in. This does not assert that the updated Worker has been deployed.


### 0.127.0 · Верховая езда

Книга героя показывает частичную формулу `RelHorse` из Remaked `js/calc.js:555–566`. Используется профессия, зелёное мастерство верховой езды и один титул. Неопределённые бонусы экипировки OS и их влияние на бой не моделируются. Поддержка уровней 1–55 и будущего снаряжения сохраняется.


### 0.128.0 · Individual sharing and acceptance tests

A saved build now displays its short-link field and Copy action **inside the build card**; failed cloud link creation shows an inline error, never a fake success. A Node test suite covers the D1 private library save/list/delete path with a deterministic mock database. Real Pages, Worker, and clipboard end-to-end verification remain outstanding.


## Revocable shared builds (0.129.0)

New links are created only for a build saved by the owner in D1. `shared_build_sources` stores the ownership relation (owner hash, source build ID), without storing the private browser secret. When the owner deletes that build, its D1 tombstone causes **every** associated short link to return HTTP 410 `reason=deleted`; anyone opening such a link receives a bottom-right message that dismisses itself or closes on OK. Offline deletion revokes links only after the pending delete reaches D1. Older anonymous links cannot be attached retroactively and therefore return HTTP 410 `reason=legacy`; the owner must share again. A recipient's separately saved copy is not deleted. D1 migration `0003_shares.sql` now creates the mapping table for new deployments; Worker also attempts a non-destructive in-place schema upgrade. Deployment and browser E2E are separate from a GitHub commit.


## Updating a saved build · 0.130.0

When a player opens a saved build from the library, the editor remembers its ID for that tab. «Сохранить изменения» updates that same saved build (including D1), not a duplicate; «Сохранить копию» creates a distinct new ID. Starting a new blank build or accepting a shared public snapshot clears the active-saved link so it cannot overwrite an unrelated library record. Shared links remain immutable **snapshots** of the published version until the owner deletes the source build, which revokes all those links.


## D1 data removal for revoked links · 0.131.0

A permanent delete now atomically tombstones the private source record **and overwrites the payloads of every attached public share with an empty object**. The share ID to source-ID association remains so the Worker can answer HTTP 410 with a meaningful `deleted` reason. No public endpoint can read the original shared build after revocation. A player who saved an independent copy retains that new copy. If the browser is offline, revocation and payload scrubbing happen only when its queued delete reaches D1.


## Safe library switching · 0.132.0

Opening a different saved character with unsaved current changes never silently destroys the workbench. The selected card expands a compact inline Save-and-open / Open-without-saving / Cancel choice. Opening is immediate if the active character is blank or its state already matches a saved build. No modal dialog interrupts editing.


## Deletion reliability · 0.133.0

A failed localStorage write must not silently disable cloud deletion. The site attempts an immediate Worker deletion even if the offline queue is unavailable, then clearly warns if both the queue and cloud request failed. Re-opening the build just saved uses the newest in-memory snapshot, not the previous UI card object.


Regression notes (0.134.0): automated source assertions for opening a previously saved build now inspect the newest library row, not an outdated UI-card object. See `tests/build-save-workflow.test.mjs` and `tests/share-links.test.mjs`.


## Trusted share creation · 0.135.0

Creating a public share requires proof of ownership of a saved D1 build. The Worker now loads the exact source snapshot from D1 itself; any extra client-supplied character object is ignored. The front-end sends the saved ID only, preventing someone from altering the shared character independently of the saved original. The 200-record quota counts active builds, not deleted tombstones. All 1–55 future-planning data remains eligible for saving and sharing.


## Target-family defense from souls · 0.136.0

The Book now displays six actual OS soul effects against specific creature types. Each entry respects refinement gates and remains separate from universal physical armor and unverified combat damage. Five historical Remaked resistance keys have corresponding partial data; the golem category is not equated with the old inanimate type without evidence. The build planner continues to support 1–55.


## Conditional item and Soul effects · 0.137.0

Conditional on-hit/on-damage equipment and Soul skills appear separately in the Hero Book with names from the current OS skill catalog and source-reported chance values where consistent. One documented inconsistency, Soul 101009, suppresses its number rather than misrepresenting the probability. These are informational trigger descriptions, not guaranteed per-hit damage or permanent buffs.


## Repeat sharing · 0.138.0

The short link is stable for a given saved D1 character snapshot. Re-sharing an unchanged build returns the same URL without consuming another daily creation slot. Saving a revised build retains the old URL as a snapshot, while generating a distinct URL for the revision; deleting the original revokes **every** revision link. Links from old characters are still read-only.


## Complete cloud library list · 0.139.0

The D1 library GET response preserves old active builds even after many deletions: live records sort first, tombstones second, and the former 250-row cap is removed. Tombstones prevent a stale local cache from reintroducing a deleted build. Extremely large deletion histories should eventually move to cursor-based synchronization to bound request size.


## D1 regression testing · 0.140.0

The mock D1 adapter used in share revocation and library lifecycle tests now handles the same SQL branches as the Worker: private-source state checks, missing optional share tables, and tombstone revocation. A standalone SQLite query check verified that an active build remains visible after 300 deletion records. Live deployment, actual D1 writes and the full Node suite are distinct validations.


## Resume editing after browser restart · 0.141.0

The last opened saved build ID is persisted alongside the draft, so reopening the browser and pressing «Сохранить изменения» updates the same named build instead of creating an unwanted duplicate. A new character or a separately received public build clears the association. Storage blocking is handled without crashing the editor.


## Library search · 0.142.0

Libraries of six or more builds now include one compact search field for names, races, professions and levels. It filters visible cards immediately and does not alter saved data or create another sharing action. Smaller libraries stay uncluttered.


## Offline edit protection · 0.143.0

When an already saved build is updated offline, reloading the cloud library retains the newer local revision and retries the D1 upload. Cloudflare D1 rejects out-of-order older writes with an atomic conflict guard and does not allow late saves to restore deleted source builds. The workbench distinguishes stale-version conflicts from removed-original conflicts. Full browser and live D1 acceptance is a separate verification step.


## Status resistance parity · 0.144.0

The defensive Hero Book now includes real OS source-based bonuses from Warding's «Устойчивость», the Dwarf's «Упрямое сердце», the fire/ice/lightning Honor titles, and structured equipment and Soul resistances. Eleven historical Remaked keys advance to partial support; not all conditional or immunity rules are modeled. These resistances are not assumed to equal final combat status-proc probabilities.


## Class-aware passives and a cleaner Book · 0.145.0

The Warding skill requires both its learned Green mastery and an actual class branch cap permitting 26 points. The public Hero Book hides methodology warnings and developer-only diagnostics; these remain accessible to authenticated administrators. Player-facing characteristics and their meaningful descriptions remain visible.


## Transfer your library without JSON · 0.146.0

Under «Мои билды», open the collapsed «Перенести библиотеку на другое устройство» section. Reveal and securely copy your personal recovery code, then use it on the other device to connect to the same D1 library. The code acts like a password: anyone holding it can read and delete your builds, so never publish it or put it into a shared-build URL. Existing local builds are merged, pending offline deletions must be synchronized first, and no Google/GitHub account is required. This is an optional device-key recovery workflow, not a fully fledged user-account system.


## Recovery-code safety · 0.147.0

The transfer panel requires one click to reveal/select your code and another to copy it (or manual copy if the Clipboard API is unavailable). Empty remote libraries do not silently replace an existing browser key; an incorrect pasted code is reported without changing local or cloud saves. Treat the code as a private password.


## Clean public player UX · 0.148.0

Origin buff controls now show functional gameplay conditions without implementation notes. HP/MP numeric accessibility descriptions avoid irrelevant warnings. Corrupt saved builds fail gracefully when a user shares them. A recovery code associated only with deletion tombstones is not treated as a successfully restored library.


## Historical saved build compatibility · 0.149.0

Shared builds preserve a strict Boolean value for the old Jo-Eun rune so existing builds are not stripped of data. It stays inactive in current OS calculation pending confirmation of a real current-game source. Updated regression cases assert modern numeric and player-only presentation rather than reinstating removed debug text.


## Earned EXP bonuses · 0.150.0

The Effects chapter in the Hero Book now shows the earned-XP bonus from equipped source-backed items. The verified current OS example is beginner cape ID 18073, +5% XP. The old Remaked EXP key becomes partial; no unverified XP-on-kill math or skill expertise bonus is inferred.


## Clear player UI · 0.151.0

Hero Book value lines keep gameplay-specific labels and source bonuses but avoid internal calculator-status wording. The footer communicates whether images are available without leaking internal asset-import counters. Detailed formula coverage continues to be documented for project maintainers.


## UI label fix · 0.152.0

Special rainbow gem combinations have one concise in-game label. Image-loading status no longer claims successful availability when only an external image source fallback has been configured.


## Separate deterministic mitigation and random procs · 0.153.0

Tests now accurately distinguish calculated incoming physical mitigation from conditional on-hit skills. The independent experience bonus remains a separate numeric preview, not a contribution to attack, armor or random chance. The changes correct regression expectations rather than alter the proven numeric source values.
