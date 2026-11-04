# Safe manual deployment of the existing Cloudflare Worker

GitHub Pages and the Cloudflare Worker deploy independently. Build Studio 0.354.0
needs the corresponding Worker code to save bilingual item fields and verify writes to both the existing `catalog_entries` and `overrides` D1 tables.

## Procedure

1. Open **GitHub → Actions → Deploy existing Pandora Worker (manual, no D1 migrations)**.
2. Select **Run workflow** on branch `bonaqu_projects`.
3. Enter `DEPLOY-0.354-TO-ps-build-studio-cloud`.
4. Watch the preflight, dry-run, deployment and read-only verification steps.
5. Confirm `/api/runtime-capabilities` reports `codeRelease: 0.354.0` and
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
