# #390 · Verifiable authorial RU/EN defaults in D1 — migration staging

**Status: planning + deterministic generation only. NO deployment, D1 writes, or production activation.** This document describes an opt-in future migration, not a completed conversion.

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

The generator evaluates the actual `PandoraUILocale` and `PandoraHonorGuide` authorial dictionaries in isolated Node VM contexts. It does **not** make network requests, import Worker secrets, connect to Cloudflare, or run the SQL. The SQL is a review artifact: generating it does not authorize its execution.

The manifest contains the source release, exact existing D1 record keys, field identities, bilingual fallback values, sorted rows, a SHA-256 digest of the canonical content, and a snapshot name incorporating that digest. The SQL includes the two versioned staging tables, conflict-preserving inserts, the completion marker inserted last, and readback queries. Apostrophes in authored text are escaped.

### Intentionally bounded coverage

- Current `PandoraUILocale.keys()` and the Hero Book exact bilingual authorial defaults.
- Existing Book summary hover hints whose captions can be matched to the current ordered result metadata, plus semantic tooltip keys.
- Existing Honor overview fields and rank names/benefit prose, **excluding rank thresholds**.
- Missing summary hint matches are reported as `unmappedHints`, not silently assigned to a different game stat.

This is a **measured subset**, not proof that every page's dynamically generated authorial string is already covered. Other owner copy registries, verified Wiki source-dependent notes, generated sentence fragments, and rare states still need explicit mapping. Do not migrate an unidentified string based on fuzzy text or runtime value.

## Required acceptance before any real D1 import

1. **Review coverage and source release:** compare each proposed `recordKey` + `field` with the currently deployed frontend and the active game catalog. Require explicit release and snapshot compatibility; reject unknown keys.
2. **Review the generated SQL and export an independent D1 backup.** Test import into an isolated staging D1 database first. Do not use live production D1 while #390 is a Draft PR.
3. **Read back every row in stable order, hash canonical content, and compare** both the SHA-256 and exact expected row count. A completion marker **alone is not proof** that all rows were installed, particularly if a partial import was retried. Do not activate a mismatch.
4. **Build a separate, version-gated read-only Worker endpoint** and a frontend reader that accepts only an exact compatible snapshot, overlays existing CAS overrides, and rejects incomplete/stale snapshots. This work is **not implemented** in this preparatory packet. The current public read path and fallback stay unchanged.
5. **Run the full Node+Chromium matrix on the same SHA**, including RU/EN, guest/no-owner, 409, Undo/Reset, offline/503, and no data loss. A real touchscreen/OS input check remains separate from synthetic browser pointer tests.
6. After explicit approval for production: publish through the normal protected PR workflow; perform read-only verification of Pages, Worker, and D1. No manual production write is implied by this document.

## Rollback

Each snapshot is keyed by `release + digest` and inserted without overwriting a previous snapshot. The SQL does **not** change an active-snapshot pointer, `overrides`, catalog data, accounts, or builds. Before any later activation, the reader must be able to return to the previous compatible snapshot or code defaults without discarding owner edits. A rollback procedure must be exercised in staging, not assumed to work solely from retaining rows.

## Completion truthfulness

Creating this plan materially reduces migration risk, but **does not complete the physical D1 migration**. #390 and Draft PR #809 remain open until full authorial coverage, versioned D1 loading, physical touch acceptance and release verification have actually passed.
