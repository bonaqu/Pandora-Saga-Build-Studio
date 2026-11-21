# #390 · Verifiable authorial RU/EN defaults in D1 — migration staging

**Status: planning, deterministic generation and an optional read-only Worker endpoint in Draft PR. NO deployment, D1 writes, client activation, or production migration.** This document describes an opt-in future migration, not a completed conversion.

## Why a separate versioned table is required

The current public `GET /api/overrides` returns administrator edits. The site's authored fallback text lives in versioned JavaScript and is correct for guests with no owner overrides. Treating that overrides table as a seed table would corrupt CAS/Undo/Reset semantics: an "Undo to original" could become a permanent edit, and older frontend revisions would not necessarily understand newer keys.

A separate immutable snapshot of default text preserves **three distinct layers**:

1. Game source data, character state, IDs, counts, and formulas: **never authorial D1 defaults**.
2. Authored bilingual defaults: versioned, read-only `editorial_default_*` rows, keyed by existing owner-copy semantic identity and original field name.
3. Explicit administrator RU/EN overrides: existing `overrides` records, with the same CAS write/reset semantics and higher precedence once a version-compatible reader is explicitly released.

## Offline preparation

From the repository root, with Node 20+:

```bash
npm run editorial:defaults:plan
node scripts/plan-editorial-d1-defaults.mjs --json > local-editorial-defaults.json
npm run editorial:defaults:sql > local-editorial-defaults.sql
npm run editorial:defaults:readback-sql > local-editorial-readback.sql
```

For offline **post-import verification** in a staging database, export the actual rows and the single snapshot marker into a local JSON document with exactly this structure:

```json
{
  "metadata": {
    "snapshot": "0.947.0-<digest-prefix-from-plan>",
    "source_release": "0.947.0",
    "sha256": "<full-64-character-SHA-256-from-plan>",
    "expected_rows": 0
  },
  "rows": [
    {"record_key": "guideedit.book.ui.label.some-key", "field": "ru", "value": "Actual database value"}
  ]
}
```

The example is a **schema illustration**, not a complete valid dump: `expected_rows` must match the generated report and `rows` must contain every physically read-back entry. To validate the real staging export, run:

```bash
npm run editorial:defaults:verify -- staging-readback.json
```

The command compares snapshot/release/digest/count, detects duplicate identities, rehashes the **actual readback contents** in canonical order and exits nonzero for any mismatch. A successful check validates only that isolated export; it does not activate any D1 snapshot or prove the live frontend uses it.

The staging-only Worker preview accepts exactly one `snapshot` query field and refuses duplicate or unknown parameters before accessing D1. When enabled, an unexpected D1 read failure returns a generic 503 without private SQL diagnostics; known daily D1 quota failures retain the standard 503 and `Retry-After`. Preview responses are not cached. The route remains disabled by default, and the public override/CAS protocol is unchanged.

The generator evaluates the actual `PandoraUILocale` and `PandoraHonorGuide` authorial dictionaries in isolated Node VM contexts. It does **not** make network requests, import Worker secrets, connect to Cloudflare, or run the SQL. The SQL is a review artifact: generating it does not authorize its execution.

The manifest contains the source release, exact existing D1 record keys, field identities, bilingual fallback values, sorted rows, a SHA-256 digest of the canonical content, and a snapshot name incorporating that digest. The SQL includes the two versioned staging tables, conflict-preserving inserts, the completion marker inserted last, and readback queries. Apostrophes in authored text are escaped.

### Intentionally bounded coverage

- Current `PandoraUILocale.keys()` and the Hero Book exact bilingual authorial defaults.
- The complete existing `PandoraWikiLabels` bilingual chapter, Honor (including PvP Victories) and skill-filter registry, preserving the shared `guideedit.wiki.labels` D1 identity and each exact field name. The Reader validates the same closed allowlist; live game counts/thresholds are excluded.
- Existing Book summary hover hints whose captions can be matched to the current ordered result metadata, plus semantic tooltip keys.
- Existing Honor overview fields and rank names/benefit prose, **excluding rank thresholds**.
- Exact Wiki equipment/item **field captions** (kind, level, W, PEN, AC, attack speed, range, Soul slots) and their independent RU/EN hover explanations; names, IDs and numeric field values remain game data.
- Exactly three existing settings-tab copy keys for equipment chooser/properties/Souls: `equipment.tab.{choose,details,souls}`, plus three **independent preexisting** `equipment.hint.{choose,details,souls}` tooltip keys. No invented D1 keys for other context-menu actions.
- Fifteen additional source-authored equipment summary captions already routed through owner CAS (`equipment.field.*`, `equipment.wearable-by`, `equipment.outfit-note`, `equipment.socketed-soul-heading`). The static registry supplies mounted label defaults and the staging manifest; item data, values, IDs, Soul capacities, refinement and combat calculations remain excluded.
- Nineteen additional fixed equipment interface captions and ARIA prefixes (search, empty states, slot, refinement, Souls, and gemstone controls) shared by the UI and manifest, with no dynamic item names or numeric suffixes in D1 defaults.
- All 16 source-verified zero/unknown Soul-capacity explanations (eight equipment families × two states) as 32 RU/EN rows using the exact original owner CAS keys. This does **not** seed actual capacities or change the Soul-slot rule engine.
- All five original right-click context actions (`equipment.context.*`), 15 picker/menu accessibility and status prefixes from `equipmentPickerMetaCopyRows` (`equipment.*`), and 13 existing `origin.*` editable captions from `originFixedLabels`. The authored string `classCount` containing **28 classes** is explicitly excluded as game-dependent counter copy. The actual Origin class badge now uses the real `jobKeys.length` with RU pluralization/EN label, has no `data-i18n` or double-click owner editor, and ignores old D1 overrides; derived counts never become authorial defaults.
- Fifteen independently editable equipment picker selection/status labels from the existing owner editor (`equipmentPickerSelectionCopyRows`), consolidated into one live source registry and 30 additional RU/EN defaults. Counts, item names, search text and player plans are never copied into this registry.
- Forty-four safe Wiki map/dungeon authorial labels (88 RU/EN defaults) from the existing `wikiMapRows` and `wiki.map.text.*` owner CAS keys. Fourteen intentionally excluded fields cover validation limits, source-uncertain chance explanation, D1 deletion confirmation/failure and form errors. A new or removed Wiki key stops the offline planner until the inventory is reviewed.
- Another **262** reviewed RU/EN labels from the existing Wiki monster, NPC trade, chest and item dictionaries. Static stat captions, search controls, selectors and copy prefixes are included; actual monster stats, NPC trade contents, drop probabilities, item IDs and equipped values are not. Source-dependent empty data claims, hard-coded 100%/singular reward assertions, validation limits, raw failures and destructive confirmations are explicitly excluded. New source registry lengths or an unreviewed field shape make the offline generator fail closed.
- Fourteen already editable Hero Path copy fragments (28 RU/EN defaults) extracted from source `authored(api,key,ru,en)` calls, plus **20 conditional Path state/skill metadata fields (40 RU/EN rows)**, **18 Path accessible/help fields (36 RU/EN rows)**, **six branch requirement captions (12 RU/EN rows)** and **two unlock-state phrases (4 RU/EN rows)**. The source's repeated requirement key is deduplicated and checked for identical text. The unlock unit's shared identity is checked for consistency and seeded once. Group/skill counts, numerical thresholds, readiness calculations, composed accessible names and character/game record values remain immutable. Seven safe Honor-view labels (14 RU/EN defaults) extracted from actual `editorial()` calls; duplicate `searchEmpty` uses the same D1 key. The factual Tuesday/Thursday rewards schedule is **excluded** as game mechanics, not customizable copy. New source calls or changed semantic keys make the generator fail closed for explicit review.
- The source-authored Honor PvP daily/weekly/hunt table headings and columns (11 bilingual keys), seven generated rank-requirement prose fragments, and one unique PvP-locations heading: **38 exact additional RU/EN rows**, parsed from the existing mounted renderer. The repeated `warsHeading` shares its original D1 key. Real win counts, rank points, gold, weekly limits, map names and time entries never enter this migration.
- Existing static owner-dock RU/EN headings, button copy, group explanations and instructions via the original `owner-dock.*` key family; runtime save/error states and dynamic D1 operation hints are excluded.
- Missing summary hint matches are reported as `unmappedHints`, not silently assigned to a different game stat.

This is a **measured subset**, not proof that every page's dynamically generated authorial string is already covered. Other owner copy registries, verified Wiki source-dependent notes, generated sentence fragments, and rare states still need explicit mapping. Do not migrate an unidentified string based on fuzzy text or runtime value.

## Required acceptance before any real D1 import

1. **Review coverage and source release:** compare each proposed `recordKey` + `field` with the currently deployed frontend and the active game catalog. Require explicit release and snapshot compatibility; reject unknown keys.
2. **Review the generated SQL and export an independent D1 backup.** Test import into an isolated staging D1 database first. Do not use live production D1 while #390 is a Draft PR.
3. **Read back every row in stable order, hash canonical content, and compare** both the SHA-256 and exact expected row count. A completion marker **alone is not proof** that all rows were installed, particularly if a partial import was retried. Do not activate a mismatch.
4. **Review the optional read-only Worker endpoint** `GET /api/editorial-defaults?snapshot=<release-digest>`, added only to this Draft PR. It checks table existence, exact snapshot marker, expected row count, allowlisted keys, duplicate identities and a SHA-256 of actual D1 row contents. Missing/mismatched snapshots fail closed with 404/503. **The endpoint is disabled by default** unless an operator explicitly sets `EDITORIAL_DEFAULTS_PREVIEW=enabled` in a staging Worker environment. Without the flag the route returns 404 **without any D1 query**. The generator and reader share hard limits of 3,000 rows and 450,000 source characters per snapshot. **The endpoint has NOT been deployed or exercised against real D1.** The Draft PR now includes a **version-pinned browser verifier** (`pandora-studio-editorial-defaults-client.js`) and exact-key fallback integration for the shared UI, Hero Book/Honor, and Wiki label registries. It verifies SHA-256 on canonical sorted rows, the exact requested snapshot, schema, field allowlists, limits and duplicate identities before an **explicit** `installVerified` call can change defaults. The priority is **existing owner CAS override → verified staged default → release code fallback**. `reset()` returns to code text without writing anything. The verifier has **no automatic activation or startup fetch**, and is tested in Node and Chromium with a synthetic verified snapshot. Its explicit `loadPinned(snapshot,{endpoint,fetcher,subtle,signal})` method rejects non-HTTPS remote endpoints, credentials embedded in URLs, unapproved query strings, fragments, wrong paths and unpinned versions. Requests use `credentials:'omit'`, `cache:'no-store'`, `redirect:'error'` and an exact `?snapshot=` query. An older asynchronous response cannot supersede a newer load or reset. A future **release-authorized staging bootstrap and pinned snapshot configuration**, physical D1 import/readback and rollback are still NOT implemented. No current browser invokes this endpoint automatically. The existing `GET /api/overrides`, fallback text and CAS remain unchanged.
5. **Run the full Node+Chromium matrix on the same SHA**, including RU/EN, guest/no-owner, 409, Undo/Reset, offline/503, and no data loss. A real touchscreen/OS input check remains separate from synthetic browser pointer tests.
6. After explicit approval for production: publish through the normal protected PR workflow; perform read-only verification of Pages, Worker, and D1. No manual production write is implied by this document.

## Repeatable isolated staging rehearsal and rollback

The mandatory Node 22 CI now executes the **actual generated SQLite SQL** inside an in-memory database. It also executes the actual SELECT-only Worker snapshot reader against those materialized SQLite tables before corruption, after corruption and after rollback. It checks first import, idempotent retry, a complete JSON readback, corruption rejection, and exact-version rollback while keeping other snapshots and the preexisting CAS `overrides` table intact. This is a local SQL rehearsal, **not** evidence of a real Cloudflare D1 staging import.

After an independently authorized staging-only import, execute the SELECT-only `local-editorial-readback.sql` against that staging D1. Cloudflare Wrangler officially supports `d1 execute --remote --file ... --json` (https://developers.cloudflare.com/d1/wrangler-commands/#d1-execute). Save its **unmodified JSON response** for offline verification. Example **READ-ONLY** command, with the target independently confirmed as an **isolated staging D1 database** (never production):

```bash
npx wrangler@4 d1 execute STAGING_DATABASE_NAME --remote --file=local-editorial-readback.sql --json > staging-wrangler-readback.json
npm run editorial:defaults:verify-wrangler -- staging-wrangler-readback.json
```

The CLI validates that Wrangler returned exactly **one successful query, one result row, one `staging_readback_json` column**, then independently verifies all expected rows and the exact SHA-256. Multiple statements/results, failed SQL, malformed envelopes, stale hashes and incomplete rows fail closed, with no D1 writes. Exit code 0 is mandatory before activating a staged snapshot. For direct SQLite/JSON exports containing only `{metadata,rows}`, the original `npm run editorial:defaults:verify -- staging-readback.json` remains supported. Never mistake generated SQL or an import success message for verified staging data.

For a separate, backed-up **staging-only** rollback review, generate:

```bash
npm run editorial:defaults:rollback-sql > local-editorial-rollback.sql
```

That SQL deletes the **completion marker first**, then rows for the **exact pinned snapshot only**. This deliberately disables the reader immediately if an operator's rollback stops halfway. It must never be run on production D1, and its generation itself never connects to any database. Check both zero-count readbacks after a separately authorized staging execution. No other snapshot, override or game table should change.

## Rollback

Each snapshot is keyed by `release + digest` and inserted without overwriting a previous snapshot. The SQL does **not** change an active-snapshot pointer, `overrides`, catalog data, accounts, or builds. Before any later activation, the reader must be able to return to the previous compatible snapshot or code defaults without discarding owner edits. A rollback procedure must be exercised in staging, not assumed to work solely from retaining rows.

## Completion truthfulness

Creating this plan materially reduces migration risk, but **does not complete the physical D1 migration**. #390 and Draft PR #809 remain open until full authorial coverage, versioned D1 loading, physical touch acceptance and release verification have actually passed.
