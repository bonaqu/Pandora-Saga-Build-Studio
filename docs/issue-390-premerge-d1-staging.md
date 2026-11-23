# #390 — Pre-merge isolated Cloudflare D1 rehearsal

**Operator instructions only. No remote migration has been performed by this document.**

## Why a local runner is required

GitHub [requires a workflow_dispatch file on the default branch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch).
The existing manual staging workflow is introduced only by Draft PR #809;
default branch bonaqu_projects does not yet contain it. Therefore use the
guarded PR-local scripts/run-editorial-staging-d1-premerge.mjs runner, rather
than merging unfinished work just to expose the Run workflow button.

The runner uses the existing verified manifest, identity guard and
readback/rollback algorithms. It changes **no production D1, Worker, Pages,
game JSON or player builds**. These instructions alone are not remote evidence.

## Preconditions

1. Create an independently isolated D1 database whose name starts with
   ps-editorial-staging- and whose UUID differs from production D1.
   Create a staging-only scoped API token, never paste it into PR comments.
2. Use a **clean** checkout of work/947-issue390-editorial-parity in Linux
   or WSL, with Node 22, Git, npx/Wrangler 4 and network access.
3. Copy the exact 40-character HEAD SHA with **both full green Node and
   Chromium** checks into PS_EDITORIAL_EXPECTED_SHA. Never approve by branch
   name alone. The CLI refuses a dirty checkout or wrong SHA.
4. Provide a persistent, operator-restricted backup directory **outside**
   the repo and system temp, owned by the operator with exact mode 0700.
   The CLI refuses group/world-accessible folders and symlink/empty exports;
   it restricts exported SQL to 0600, checks and hashes the same
   no-symlink file descriptor, then syncs SQL, checksum and backup directory
   metadata to disk before the first import/rollback write (Linux/WSL).
   Never upload raw SQL backups as public artifacts.

Example shell session (all values below are placeholders):

~~~bash
git switch work/947-issue390-editorial-parity
git status --porcelain
git rev-parse HEAD

export PS_EDITORIAL_EXPECTED_SHA="REPLACE_WITH_APPROVED_40_CHARACTER_HEAD"
export PS_EDITORIAL_STAGING_NAME="ps-editorial-staging-390"
export PS_EDITORIAL_STAGING_ID="REPLACE_WITH_STAGING_DATABASE_UUID"
export CLOUDFLARE_ACCOUNT_ID="REPLACE_WITH_CLOUDFLARE_ACCOUNT_ID"
read -r -s -p "Dedicated staging token: " CLOUDFLARE_API_TOKEN
echo
export CLOUDFLARE_API_TOKEN
mkdir -p "$HOME/ps-editorial-staging-backups"
chmod 700 "$HOME/ps-editorial-staging-backups"
export PS_EDITORIAL_BACKUP_DIR="$HOME/ps-editorial-staging-backups"

node scripts/run-editorial-staging-d1-premerge.mjs preflight
~~~

Preflight performs **read-only** remote UUID/name, complete SQLite
object inventory (tables, views, triggers and user-created indexes), and
full column/key-layout checks for the two permitted staging tables
(including both absent tables on an empty staging DB). It rejects all
views, triggers and manual indexes, including confusing names such as
`sqliteXshadow` (SQL `LIKE` treats `_` as a wildcard, so the preflight uses
literal-underscore, case-normalized `GLOB` to omit only SQLite's internal
`sqlite_*` objects), same-named tables with unexpected fields,
types or primary keys, unrelated tables, production UUID, malformed
parameters and an unclean or wrong source checkout. The manual workflow
shares these object/column validation rules, but cannot run pre-merge while
its workflow_dispatch file is absent from the default branch.

## Separate explicit import approval

~~~bash
export PS_EDITORIAL_CONFIRMATION="CONFIRM-EDITORIAL-STAGING-$PS_EDITORIAL_STAGING_NAME-import"
node scripts/run-editorial-staging-d1-premerge.mjs import
unset PS_EDITORIAL_CONFIRMATION
~~~

The runner re-checks the remote target, exports **full remote staging D1**
to the independent directory, verifies a nonempty regular owner-owned backup, restricts SQL
permissions to 0600, and flushes the backup and adjacent SHA-256 checksum
to disk **before any write**. It imports only the
versioned authorial defaults, then reads every row and verifies metadata,
record count and SHA-256, failing closed on any mismatch. It does not
activate or publish an unverified snapshot.

## Separately approved exact rollback

Use the **same source SHA that created the snapshot**, not an updated
branch with a different manifest digest:

~~~bash
export PS_EDITORIAL_CONFIRMATION="CONFIRM-EDITORIAL-STAGING-$PS_EDITORIAL_STAGING_NAME-rollback"
node scripts/run-editorial-staging-d1-premerge.mjs rollback
unset PS_EDITORIAL_CONFIRMATION
unset CLOUDFLARE_API_TOKEN
~~~

Another independent backup precedes rollback. Only the pinned source
snapshot marker and rows are deleted; both remaining counts must equal zero.
A failed import is **not automatically rolled back**: assess the evidence
and separately authorize this rollback.

## PR acceptance evidence

Record the exact source HEAD, green Node/Chromium links, staging name and
nonproduction UUID, backup location and hash (never upload backup contents),
remote snapshot ID, full readback count/hash, and verified zero-row rollback.
Real physical touchscreen testing, a separately approved protected release,
and subsequent **read-only** production audit remain independent gates.

Do **not** count local Node, Chromium or mock SQLite as remote D1 evidence;
do not merge/close Draft PR #809 or close issue #390 on this basis.
