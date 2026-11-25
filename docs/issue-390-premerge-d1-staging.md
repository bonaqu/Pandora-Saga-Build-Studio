# #390 — Pre-merge isolated Cloudflare D1 rehearsal

**Remote staging exists and the complete read-only staging preflight is successful; no remote import, rollback, or production migration has been performed.**

A failed import with only one of the two reviewed staging tables is recoverable: the rollback checks the audited schema inventory, requires actual pinned rows/marker, retains the independent backup, deletes only the exact snapshot from existing tables (marker first), and verifies absence without creating the missing table. Unexpected schema drift stops rollback rather than silently treating it as success.

## Verified Cloudflare metadata access · 24 November 2026

[Temporary read-only GitHub Actions probe](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45373602653) initially confirmed Cloudflare metadata access before staging existed. Subsequently [isolated staging bootstrap](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45379974380) **created** `ps-editorial-staging-390` with UUID `56757608-3492-4fae-b698-27c76918cdc1`. Independent Cloudflare metadata readback verified that this UUID is distinct from production. The bootstrap did not execute D1 SQL or touch production. Cloudflare account access to *create staging* is therefore confirmed; dedicated staging write rehearsals and a durable backup are still unproven. These one-time workflows are removed from the release branch after diagnosis.

## Cloudflare-owned sqlite_master object on fresh staging D1

The first remote [read-only schema preflight](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45380175706) rejected the otherwise empty newly created staging database. A separate, narrowly scoped [read-only metadata inspection](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45380364467) established that its sole schema object was `table _cf_KV`. [Cloudflare's official D1 import/export documentation](https://developers.cloudflare.com/d1/best-practices/import-export-data/) explicitly identifies `_cf_KV` as a reserved internal storage-system table. The shared schema query now excludes **only the exact name `_cf_KV`**, while continuing to reject every unknown table, view, index or trigger (including `_cf_KVX`); SQLite's `sqlite_*` system exclusion remains literal via GLOB. [The third real remote preflight](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45380662619) **PASSED** with the pinned staging UUID, zero non-system schema objects, and both absent editorial tables confirmed by PRAGMA table_xinfo. No D1 SQL writes, imports, rollbacks or deployments were performed.

This is a schema-introspection exemption, **not permission to query or mutate** the internal table. The approved user-owned staging tables and exact columns remain unchanged.

## Why a local runner is required

GitHub [requires a workflow_dispatch file on the default branch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch).
The existing manual staging workflow is introduced only by Draft PR #809;
default branch bonaqu_projects does not yet contain it. Therefore use the
guarded PR-local scripts/run-editorial-staging-d1-premerge.mjs runner, rather
than merging unfinished work just to expose the Run workflow button.

The runner uses the existing verified manifest, identity guard and
readback/rollback algorithms. It changes **no production D1, Worker, Pages,
game JSON or player builds**. These instructions alone are not remote evidence.

**GitHub-hosted staging workflow is intentionally READ-ONLY.** Only a
`preflight` choice is exposed, with schema/UUID checks, no import, rollback,
D1 export or upload of raw SQL. An ephemeral Actions runner cannot retain the
required independent durable private staging backup: uploading the raw SQL
as an artifact would expose unreviewed existing staging records and does not
meet the operator-local 0700 backup requirement. Even once the workflow is
merged onto the default branch, all *writes* must use the approved local
Linux/WSL runner below with an independently retained backup.

## Preconditions

1. The isolated `ps-editorial-staging-390` D1 database has been created and its
   nonproduction UUID confirmed as `56757608-3492-4fae-b698-27c76918cdc1`.
   Use a staging-scoped API token for the guarded write rehearsal; never paste it
   into PR comments. Existing GitHub account-level access must not be mistaken
   for a staging-only token.
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
parameters and an unclean or wrong source checkout. The manual read-only preflight shares these object/column
validation rules; its workflow_dispatch cannot run pre-merge while the file
is absent from the default branch. Manual GitHub Actions *writes* remain
explicitly disabled (no raw backup artifacts).

## Independently tested backup restore gate (25 November 2026)

The guarded Linux/WSL runner now checks more than file existence, private
0700/0600 permissions and SHA-256. **Before either remote write** it reads a
complete remote staging row inventory, exports SQL into the operator's private
durable directory, checks the single-link inode and exact file digest, and
**replays the exported SQL in a fresh in-memory SQLite database**. The restored
database must pass integrity checking, exact allowlisted tables/columns,
whole-table row counts (including pre-existing snapshots) and exact target
snapshot row counts. Additionally, for **every existing staging row** in both
allowlisted tables, a deterministic SHA-256 content fingerprint from a
read-only ordered remote SELECT is compared with the SQL restored in memory;
a same-count change to a string or snapshot metadata fails closed. A second
complete remote fingerprint is obtained after backup, before either write, to
catch concurrent same-count edits. The private record values are never logged,
uploaded or embedded in an artifact. Large/unexpected remote result payloads
fail closed rather than silently skipping content validation. Remote identity,
schema and row inventory are also checked again after backup.
This replay proves local restorability of the export under the reviewed
SQLite schema; it is **not** a real remote import/rollback or proof of backup
survival after a machine failure. Store the SQL and its .sha256 file securely,
outside the checkout and temporary directories.

**Status:** Source and tests only. No actual isolated Cloudflare D1 export,
import, readback, or rollback is claimed by this change.

## Separate explicit import approval

~~~bash
export PS_EDITORIAL_CONFIRMATION="CONFIRM-EDITORIAL-STAGING-$PS_EDITORIAL_STAGING_NAME-import"
node scripts/run-editorial-staging-d1-premerge.mjs import
unset PS_EDITORIAL_CONFIRMATION
~~~

The runner first rejects an already existing exact snapshot, including partial rows without a marker, so a previous import cannot be mistaken for a fresh rehearsal and subsequently deleted. Other snapshots are not targeted. Use an exclusively operated staging database: the runner cannot lock out independent writers. It re-checks the remote target, exports **full remote staging D1**
to the independent directory, verifies a nonempty regular owner-owned backup, restricts SQL
permissions to 0600, and flushes the backup and adjacent SHA-256 checksum
to disk **before any write**. After backup it revalidates remote identity, schema, column layout and exact snapshot presence before either write operation; drift stops the run. It imports only the
versioned authorial defaults, then reads every row and verifies metadata,
record count and SHA-256, failing closed on any mismatch. It does not
activate or publish an unverified snapshot.

## Independent read-only snapshot verification

After a successful import, use the **same exact source SHA** and the existing
dedicated staging credentials to audit the full remote snapshot again from
a separate CLI invocation:

~~~bash
unset PS_EDITORIAL_CONFIRMATION
node scripts/run-editorial-staging-d1-premerge.mjs verify
~~~

This mode requires a clean pinned PR checkout, remote UUID/name and strict
schema/column validation. It refuses missing tables, absent or mismatched
snapshot metadata, duplicate/missing rows, or any SHA-256/content mismatch.
It reads the complete remote defaults rows and reports the verified snapshot,
row count and digest. It does **not** export data, create a backup, execute
an import/DELETE, or deploy Worker/Pages; it needs no write confirmation.
The prior independently retained 0700/0600 SQL backup remains mandatory
for import and rollback, and this verification cannot replace a separately
approved, verified rollback. The read-only command will appropriately fail
before the first actual staging import; its implementation and local tests
are **not** evidence that remote import has occurred.

## Separately approved exact rollback

Use the **same source SHA that created the snapshot**, not an updated
branch with a different manifest digest:

~~~bash
export PS_EDITORIAL_CONFIRMATION="CONFIRM-EDITORIAL-STAGING-$PS_EDITORIAL_STAGING_NAME-rollback"
node scripts/run-editorial-staging-d1-premerge.mjs rollback
unset PS_EDITORIAL_CONFIRMATION
unset CLOUDFLARE_API_TOKEN
~~~

Before backup or mutation, a separate **read-only SELECT** must prove that
this exact pinned snapshot contains a marker and/or at least one row. An empty
staging D1 is rejected: otherwise a no-op could be mislabeled as a successful
rollback. A partially failed import with unmarked rows is still recoverable.
Another independent backup then precedes deletion. Only the pinned source
snapshot marker and rows are deleted; both remaining counts must equal zero.
If import created only one reviewed table, the runner checks and deletes only that table's exact snapshot and verifies absence without creating the other table. If no exact snapshot rows or marker exist, it refuses rollback; use the independent backup to assess manual recovery, not to claim a successful rollback.
A failed import is **not automatically rolled back**: assess the evidence
and separately authorize this rollback.

## PR acceptance evidence

Record the exact source HEAD, green Node/Chromium links, staging name and
nonproduction UUID, backup location and hash (never upload backup contents),
remote snapshot ID, full readback count/hash, and verified zero-row rollback.
Physical owner-editor touchscreen acceptance was removed from scope on 24 November; existing touch regressions and ordinary mobile user scenarios remain. A separately approved protected release and subsequent **read-only** production audit remain independent gates.

Do **not** count local Node, Chromium or mock SQLite as remote D1 evidence;
do not merge/close Draft PR #809 or close issue #390 on this basis.

## Pinned manifest after the Healing authorial review · 24 November 2026

The previously remotely reported `0.947.0-e4f26c02e2896e3c` manifest / 2,586-row digest describes **the older PR HEAD** prior to the 19 new Healing RU/EN authorial identities. It is audit history, NOT an authorization to import that stale snapshot after the later source changes. The source planner's reviewed Healing cohort is now **37 authorial RU/EN keys / 74 exact `guideedit.book.effects.healing.*` rows**. The 2,586-row historical snapshot has NOT been replaced in remote staging. Before any future staging import, require a **freshly generated exact snapshot ID, full SHA-256, row count, two green CI checks and the matching 40-character PR HEAD**. Never reuse the old digest or silently mix SQL from different commits. No remote SQL import or rollback has yet occurred.

### Version-safe snapshot SQL gate (24 November 2026)

Rollback/presence SQL accepts only a strict release of three bounded numerical
components followed by exactly 16 lowercase hexadecimal SHA-256 characters.
The old hardcoded `0.947.0` guard would make an otherwise valid new
`0.948.0-<digest>` release impossible to roll back. The schema guard now
validates **shape**; it does **not** authorize a user-provided snapshot ID.
The Linux/WSL premerge runner still obtains **both** import and rollback
snapshots only from `buildEditorialDefaultsManifest()`, enforces the exact
40-character expected PR SHA and branch, requires operation-specific manual
confirmation, performs a distinct durable independent backup before each
mutation, and rechecks the staging identity and schema. Old or forged records
outside the current source manifest are not rollback targets.

The snapshot with 37 new Healing caption identities needs a new full SHA-256
from the exact final PR checkout. Neither remote import nor remote rollback
has been executed or accepted by this documentation change.

### Additional reviewed dynamic source-only coverage (24 November 2026)

Current code also includes **14 skill scaling authorial identities / 28 bilingual defaults** alongside **37 healing identities / 74 bilingual defaults**. The scaling values are still the original OS numerical coefficients and hero-specific thresholds, not editable D1 copy. Regenerate the final manifest only from the exact accepted PR SHA after all changes; the pre-existing `0.947.0-e4f26c02e2896e3c` snapshot is no longer current and must never be imported as the final acceptance artifact. No remote staging SQL writes are implied by these source and test updates.
