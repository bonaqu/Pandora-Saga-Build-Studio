# One-action publication: live D1 + GitHub fallback (0.806.0)

The administrator's confirmed **Apply selected changes** is now a full post-publication sequence. The original CAS-protected import and atomic D1 active pointer remain unchanged.

Once D1 accepts the new snapshot, the app reloads and reads **every one of the 17 public JSON datasets**, requiring their full values and snapshot headers to match the reviewed selection. A second meta fetch catches concurrent updates. The existing model test covers attributes, progression, base HP/MP and level 55; it does not prove changed, undocumented combat effects are implemented.

When the Worker has `GITHUB_CATALOG_TOKEN` configured, the same owner action creates a GitHub PR containing the 17 fallback JSON files (or confirms they match). The PR is **never merged automatically** and awaits mandatory Node and Chromium CI. If GitHub is unavailable, the browser reports that fallback is incomplete, but does not claim the already-published D1 was rolled back.

This does **not** guarantee future unknown effect semantics will be calculable without code changes; there is no safe data-only way to invent new game mechanics. Explicit shape/semantic model work remains necessary when upstream mechanics change. Never disable account auth, CAS, or validation to mask model compatibility errors.

Tests: `node --test tests/catalog-publication-complete-806.test.mjs`, full Node and Chromium CI, release guard; Pages/D1 read-only verification after merge.
