# Safe manual deployment of the existing Cloudflare Worker

GitHub Pages and the Cloudflare Worker deploy independently. The reviewed 0.361 Worker also deploys on merges into bonaqu_projects when the CLOUDFLARE_API_TOKEN GitHub Actions secret is configured; manual deployment remains available. Build Studio 0.361.0
needs the corresponding Worker code to save bilingual item fields and verify writes to both the existing `catalog_entries` and `overrides` D1 tables. Worker 0.361 also requires `expectedActive` on all catalog publish requests (HTTP 428 when absent) and exposes the `X-PS-Catalog` provenance header to the Pages origin.

## Procedure

1. Open **GitHub → Actions → Deploy existing Pandora Worker (manual, no D1 migrations)**.
2. Select **Run workflow** on branch `bonaqu_projects`.
3. Enter `DEPLOY-0.361-TO-ps-build-studio-cloud`.
4. Watch the preflight, dry-run, deployment and read-only verification steps.
5. Confirm `/api/runtime-capabilities` reports `codeRelease: 0.361.0` and
   `ownerEditors` contains `bilingual-item-text`, `adminD1WriteCheck` is `catalog-and-overrides`, and that `/api/health`
   continues to report an active D1 catalog.

The workflow requires repository secret `CLOUDFLARE_API_TOKEN` with the
appropriate Cloudflare Worker deployment permission. Set it in GitHub Actions
repository secrets if absent; do not paste it into workflow inputs or logs.

The target service and existing D1 UUID are fixed in the workflow. The
generated Wrangler config uses the same D1 binding (`DB`). `--keep-vars`
preserves dashboard variables, and existing Cloudflare Worker secrets remain
attached. The workflow runs **no D1 migration, import, delete or mutation**.

If the preflight cannot confirm a healthy existing Worker/D1, deployment is
blocked. GitHub Pages release checks independently verify the public catalog
after changes; a passing static or browser test does not authorize a D1 write.


After successful **read-only** deployment verification, an authenticated administrator must open the catalog editor and click **Проверить запись в D1**. This creates two temporary rows (one catalog snapshot record, one reserved owner override), checks exact readbacks and scoped deletions, and compares the active catalog snapshot before and after. No deployment job performs this write automatically. Do not share session tokens or passwords.


Worker 0.355 includes an allowlisted second-source retry when the current game's official data endpoint is temporarily unreachable. This does not bypass access controls or guarantee availability; both upstream attempts can still fail. The admin UI offers a separate comparison with the saved project copy in that case, never calling archived data live. Only authenticated admins can query the source adapter, and it never forwards their bearer credentials.


## Catalog publication lease and provenance (Worker 0.361)

The browser-side admin already supplies `expectedActive`. The Worker now enforces it server-side: even an authenticated older client cannot publish without the expected snapshot. A mismatched revision returns HTTP 409; an omitted expectation returns HTTP 428. No DB migration or bulk data write is required. For the first publication, `expectedActive: null` is allowed only if the pointer row does not yet exist.

Cross-origin admin requests can inspect `X-PS-Catalog: d1` and `X-PS-Catalog-Snapshot`, exposed via CORS to the approved Pages origin. Verify the public read-only endpoint and headers before enabling strict client validation. Server changes deploy independently from the Pages release.
