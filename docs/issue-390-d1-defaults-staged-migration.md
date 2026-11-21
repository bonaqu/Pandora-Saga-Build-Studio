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

The generator evaluates the actual `PandoraUILocale` and `PandoraHonorGuide` authorial dictionaries in isolated Node VM contexts. It does **not** make network requests, import Worker secrets, connect to Cloudflare, or run the SQL. The SQL is a review artifact: generating it does not authorize its execution.

The manifest contains the source release, exact existing D1 record keys, field identities, bilingual fallback values, sorted rows, a SHA-256 digest of the canonical content, and a snapshot name incorporating that digest. The SQL includes the two versioned staging tables, conflict-preserving inserts, the completion marker inserted last, and readback queries. Apostrophes in authored text are escaped.

### Intentionally bounded coverage

- Current `PandoraUILocale.keys()` and the Hero Book exact bilingual authorial defaults.
- The complete existing `PandoraWikiLabels` bilingual chapter, Honor (including PvP Victories) and skill-filter registry, preserving the shared `guideedit.wiki.labels` D1 identity and each exact field name. The Reader validates the same closed allowlist; live game counts/thresholds are excluded.
- Existing Book summary hover hints whose captions can be matched to the current ordered result metadata, plus semantic tooltip keys.
- Existing Honor overview fields and rank names/benefit prose, **excluding rank thresholds**.
- Missing summary hint matches are reported as `unmappedHints`, not silently assigned to a different game stat.

This is a **measured subset**, not proof that every page's dynamically generated authorial string is already covered. Other owner copy registries, verified Wiki source-dependent notes, generated sentence fragments, and rare states still need explicit mapping. Do not migrate an unidentified string based on fuzzy text or runtime value.

## Required acceptance before any real D1 import

1. **Review coverage and source release:** compare each proposed `recordKey` + `field` with the currently deployed frontend and the active game catalog. Require explicit release and snapshot compatibility; reject unknown keys.
2. **Review the generated SQL and export an independent D1 backup.** Test import into an isolated staging D1 database first. Do not use live production D1 while #390 is a Draft PR.
3. **Read back every row in stable order, hash canonical content, and compare** both the SHA-256 and exact expected row count. A completion marker **alone is not proof** that all rows were installed, particularly if a partial import was retried. Do not activate a mismatch.
4. **Review the optional read-only Worker endpoint** `GET /api/editorial-defaults?snapshot=<release-digest>`, added only to this Draft PR. It checks table existence, exact snapshot marker, expected row count, allowlisted keys, duplicate identities and a SHA-256 of actual D1 row contents. Missing/mismatched snapshots fail closed with 404/503. **The endpoint is disabled by default** unless an operator explicitly sets `EDITORIAL_DEFAULTS_PREVIEW=enabled` in a staging Worker environment. Without the flag the route returns 404 **without any D1 query**. The generator and reader share hard limits of 3,000 rows and 450,000 source characters per snapshot. **The endpoint has NOT been deployed or exercised against real D1.** A version-pinned frontend reader, override precedence integration and explicit activation are **still NOT implemented**. The existing `GET /api/overrides`, fallback text and CAS remain unchanged.
5. **Run the full Node+Chromium matrix on the same SHA**, including RU/EN, guest/no-owner, 409, Undo/Reset, offline/503, and no data loss. A real touchscreen/OS input check remains separate from synthetic browser pointer tests.
6. After explicit approval for production: publish through the normal protected PR workflow; perform read-only verification of Pages, Worker, and D1. No manual production write is implied by this document.

## Rollback

Each snapshot is keyed by `release + digest` and inserted without overwriting a previous snapshot. The SQL does **not** change an active-snapshot pointer, `overrides`, catalog data, accounts, or builds. Before any later activation, the reader must be able to return to the previous compatible snapshot or code defaults without discarding owner edits. A rollback procedure must be exercised in staging, not assumed to work solely from retaining rows.

## Completion truthfulness

Creating this plan materially reduces migration risk, but **does not complete the physical D1 migration**. #390 and Draft PR #809 remain open until full authorial coverage, versioned D1 loading, physical touch acceptance and release verification have actually passed.
