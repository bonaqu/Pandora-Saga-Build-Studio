# GitHub operations and faster, safe delivery — Build Studio

Last verified: **2026-11-13**. This is an operational snapshot, **not a permanent claim about current GitHub settings**. For an actual task recheck the live repo, the Ruleset and in-flight PRs before acting.

## Current repository configuration (verified from GitHub API)

| Setting | Verified value | Consequence |
|---|---|---|
| Repository | `bonaqu/Pandora-Saga-Build-Studio`, public | Code and GitHub Actions checks visible to collaborators |
| Default / production source | `bonaqu_projects` | Open all PRs **into this branch**; GitHub Pages publishes from the established release process |
| Ruleset | [Protect bonaqu_projects #27159457](https://github.com/bonaqu/Pandora-Saga-Build-Studio/settings/rules/27159457), **active**, branch include `refs/heads/bonaqu_projects` | No direct main pushes, force pushes or deletion |
| PR reviews | Required approvals **0**; no code-owner, last-push or team approval | Solo owner does not need a second approver |
| Required checks | **`Unit regressions and release consistency`** (Node) and **`browser`** (Chromium), GitHub Actions | Both jobs must report success on the latest required commit |
| Strict checks | `strict_required_status_checks_policy: true` | Update a stale PR against the changed main and rerun checks |
| Merge strategy | Merge and Squash allowed, Rebase not allowed | Explicit and reviewable commit history |
| Auto-merge | Repository **allows** it | Must be **enabled for each PR**; a checkbox in General does not auto-merge all PRs |
| Delete merged head branches | Enabled | GitHub removes merged temporary branches; non-PR orphan branches require separate handling |
| Workflow cadence | PR or explicit manual run; no scheduled daily checks | No background/daily noise; postmerge Pages + read-only readiness remain separate |
| Data ownership | Cloudflare Worker + D1 catalog | Reading/verification ≠ writing; do not mutate production game data without owner approval |

To recheck metadata: `GET /repos/bonaqu/Pandora-Saga-Build-Studio` and `GET /repos/bonaqu/Pandora-Saga-Build-Studio/rulesets/27159457` through an authorised GitHub connector. Check the actual workflow files before claiming names/settings.

## Mandatory workflows: avoid a hidden merge deadlock

- `.github/workflows/quality.yml` emits check **`Unit regressions and release consistency`**.
- `.github/workflows/browser-smoke.yml` emits check **`browser`**.
- **Both workflows trigger for all PRs to `bonaqu_projects`**. Do not add `on.pull_request.paths-ignore`: a docs-only/test-only PR would skip a required workflow and GitHub would leave its check permanently Pending. See [GitHub's skipped-workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs).
- Do not put `[skip ci]` or equivalent skip directives into PR commits; these also leave required checks Pending. Do not rename the job checks without first updating Ruleset #27159457. A manually dispatched run cannot replace a missing PR status.
- Preserve real Chromium even in the fast browser path. Impact selector `scripts/select-browser-suite.mjs` chooses **quick** for proven harmless Markdown/style/test changes, **full** for JS/gameplay/unknown changes. If selection fails, the workflow safely falls back to **full**. The manual `--only=<scenario>` is an optional local/debug run, never a replacement for the PR gate.

## Fast feedback loop without lowering coverage

1. **Before edits:** read current `bonaqu_projects` HEAD, open PRs and relevant Issue *once per new work batch*. Inspect current release, related code and its existing tests together. Do not copy stale version numbers from chat.
2. **Model dependencies first:** identify UI/data entry points, RU/EN canonical IDs, D1 constraints and shared state lifecycles. Reuse handlers; avoid changing unrelated modules or making guesses about game-server mechanics.
3. **One coherent branch/PR per independent feature:** batch remote reads and independent mutations; use one coherent Git commit/tree when appropriate, with a matching regression test. Link PR to Issue using `Closes #N`, only when the issue is fully addressed.
4. **Fast local diagnosis:** run `node --test tests/<affected>.test.mjs` and `npm run release:check` before the PR where tools permit. For one browser defect: `node scripts/dev-server.mjs` alongside `node tests/browser-smoke.mjs --only=<scenario>`. Never present these focused runs as full CI.
5. **Fail early:** release consistency is a cheap first step in Node CI; wrong version/cache keys should fail *before* the full unit suite. Keep the actual complete Node suite and Node/icon/localization audits mandatory.
6. **Use existing browser optimization:** cached Playwright Chromium 1.55.1 on Ubuntu 24.04; install OS deps only if actual headless launch fails. Keep parallel isolated smoke tests and quick selection; do **not** remove visual/real-browser coverage for gameplay changes.
7. **Respond to the first failure:** read failed job + first failing assertion. Repair stale fixtures, run an isolated diagnostic, push the minimum patch, and let GitHub re-run the final full checks. Do not blindly retrigger 50+ browser flows after every minor edit.
8. **Manage parallel PRs:** strict required freshness means a release merged while another PR is pending can invalidate earlier green checks. Rebase/merge against current `bonaqu_projects` and rerun required checks. Never overwrite other PR changes or force-push protected main; avoid enabling auto-merge on conflicting release-number changes before resolving dependencies.
9. **After auto-merge:** confirm the PR **really merged**, actual main SHA, Issue closure, source branch cleanup, Pages publish and live read-only Worker/D1 readiness. Do not re-run the PR's complete Node/Chromium suite *again* after merge. Don't claim Telegram/Discord updated their independent preview caches.
10. **Effort budget:** prioritize changes backed by user impact and existing data. Parallelize independent reading, review and test preparation while CI is running, but don't mutate another PR branch. Avoid repeated single-file connector calls, excessive polling, unrelated release commits or temporary branches without cleanup.

## Release and production safety

- For any changed site code/assets, use `npm run release:bump -- YYYY.MM.DD.N "note"` (or `node scripts/release-version.mjs ...`) and keep `package.json`, `site-version.json`, `index.html` CSS/JS cache keys, social-preview version descriptions, `ROADMAP.md` and `CHANGELOG.md` consistent. Version check: `npm run release:check`.
- **Do not bump** site version for mere documentation/workflow policy changes; it creates unnecessary contention with live feature PRs.
- GitHub Pages publishes from main; postmerge `Live Pages and Worker readiness` must verify the actually served `site-version.json`, Open Graph PNG, Worker, CORS and D1 read-only responses. An initial failed readiness check may expose outdated verification scripts; diagnose rather than changing live D1.
- D1 is the operational catalog and contains user state. Admin overrides/CAS and source-aligned edits are separate workflows. Do not silently publish game data, migrate accounts, or claim a mocked browser test proves a live write.
- The official OS game source (RU+EN records matched by ID) and documented Remaked formula stages govern skill reconstruction; explicit uncertainty remains where actual server behavior isn't proven.

## Known trade-offs and changes deferred

- Strict up-to-date protection is intentionally preserved. On busy parallel release days it can require repeat CI; the proper fix is to coordinate PR merges and isolate feature branches, **not** disable protection.
- A GitHub merge queue could reduce reruns in a highly parallel project, but it has different event/plan requirements and requires explicit owner review and `merge_group` checks. **Do not enable it automatically.**
- Avoid promising a speedup in minutes without measured end-to-end before/after. The confirmed CI speed improvement in this change is removing invalidly skipped required statuses (unblock docs-only PRs) and faster detection of version inconsistencies.
- Existing case study: [development-process timing investigation, 2026-11-11](DEVELOPMENT_PROCESS_TIME_OPTIMIZATION_2026-11-11.md).
