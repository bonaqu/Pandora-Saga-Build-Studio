# История ROADMAP — часть 19 из 20

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

