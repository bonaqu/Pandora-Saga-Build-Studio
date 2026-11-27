# Branch retention and safe cleanup — current owner policy (2026-11-27)

**Owner requirement:** the only permanent Git branch in this repository is `bonaqu_projects`. Do not abandon working branches after a release. This applies to every future task and agent, not just issue #476.

## Mandatory development routine

1. Always start from the current protected `bonaqu_projects`; use a short-lived PR branch only for the change being reviewed. Never bypass required Node/Chromium checks or protection.
2. Keep the temporary branch while its PR is open. Do not delete, close or merge an unfinished PR to satisfy the one-branch cosmetic goal.
3. After the required CI succeeds, merge via the protected PR process, confirm the actual merge and production checks, and **verify that its remote head branch was deleted** (repository auto-delete is configured). If the branch remains, retire it after auditing the exact SHA.
4. Before deleting any orphaned/divergent/unmerged branch, record its full name, exact tip SHA, ahead/behind comparison, and PR state; pin the tip as a persistent Git tag. Never silently discard unmerged changes. Archive tags are history references, **not deployment branches**.
5. The cleanup script must reject any changed ref SHA, active PR, missing/mismatched archive tag, missing permissions, or an unexpected repository/default branch. Re-audit and explicitly expand the reviewed list when new orphans appear. Never delete `bonaqu_projects`.
6. After branch retirement, query all GitHub refs to confirm **exactly one branch remains**. If there are extras, report the exact names rather than claiming success. Do not create a replacement PR merely to clean the same PR.
7. For future releases and interrupted conversations, re-read this policy and `AGENTS.md` before declaring work finished.

## 2026-11-27 audited retirement

At the start of this batch GitHub reported **30 total branch refs**: `bonaqu_projects` and **29** old working/snapshot branches. Open PRs: **0**. All 29 have divergent unique commits relative to the then-main head `d715686759290047aa4ceae2231d0b255659215b`, so the safe mechanism is **archive, then delete**, not merge outdated experiments into production.

The exhaustive exact-name ↔ tip SHA register is the frozen `targets` object in [`scripts/prune-audited-branches.mjs`](../scripts/prune-audited-branches.mjs). Previous 13-branch review: [`BRANCH_AUDIT_2026-11-20.md`](BRANCH_AUDIT_2026-11-20.md).

Each tip is pinned before removal at `refs/tags/branch-archive/2026-11-27/<original-branch-name>`, recoverable by SHA/tag. These tags do not merge any abandoned feature or change running app data. A second ref check immediately precedes each DELETE; GitHub's branch-delete REST call itself has no atomic SHA lease, so concurrent ref updates remain a small documented API race. Its postflight confirms removal.

The [cleanup workflow](../.github/workflows/prune-audited-branches.yml) runs automatically **once the protected PR containing this update is merged**, because it listens for pushes affecting the audited cleanup files. It can also be explicitly rerun manually with `DELETE_AUDITED_BRANCHES`. It performs focused Node tests first and fails if anything besides the production branch remains. A changed/unreviewed branch is never silently swept by a broad wildcard.

**Evidence requirement:** do not call the cleanup complete until Actions logs and GitHub's real branch list confirm one remaining ref. If the workflow lacks `contents:write` permission or an archive tag fails, preserve the branch and investigate; do not advise force-push or expose credentials.

## Game-data scope

The branch cleanup makes **no changes** to the game catalog, formulas, D1, existing builds, or Cloudflare. Continue #476 with verified current source vectors and explicitly labeled unverified gameplay semantics. Do not put source infrastructure details into the player-facing UI.
