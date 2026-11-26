# Live official Pandora Saga OS source parity · 26 November 2026

Pandora Saga OS publicly states that its Wiki and calculator read active game files; these are the **current authoritative source record values**, not a substitute for undocumented server-side hit, rounding, targeting, buff or damage algorithms.

## Read-only comparison and evidence

Upstream: `https://pandorasaga-os.com/gamedata/{name}.json`. Fixed allowlist of **17** original datasets matches the Worker admin source retrieval code, including `strings.en` and the `instances` array. Read-only inspection: `node scripts/audit-os-official-source-parity.mjs --strict`. Production release read-only checks instead use `--observe`: drift/unavailable upstream is logged with a GitHub Step Summary and a GitHub warning but does **not** disable deployment, delete source data, or write to Cloudflare.

Each dataset compares the official JSON object to the checked-in `data/os/{name}.json` using canonical deep value equality (object field ordering ignored). The CLI reports total records, record IDs added/removed, changed IDs, which *top-level fields* differ, and cryptographic SHA-256 fingerprints of complete canonical JSON. A `description-only` change cannot silently pass as full equality. A presentation-equivalent description means only bold/line-break/whitespace formatting differs — the exact original markup remains distinct and is not overwritten or discarded.

## Preliminary direct API evidence obtained 26 November 2026

These are **observations from live HTTP 200 public OS JSON reads**, not assumptions about a future upstream revision:

| Dataset | Current records | Comparison vs GitHub |
|---|---:|---|
| `skills` | 571 | full structural/content equality |
| `classes` | 28 | full equality |
| `tables` | 14 top-level datasets | full equality |
| `itemForth` | 172 | full equality |
| `items` | 1,140 | 858 record differences, **only the `desc` field** |
| `souls` | 115 | 15 record differences, **only the `desc` field** |

The earlier [0.959.0 D1 read-only readiness run](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45880125953) confirmed all 16 published D1 datasets matched our current *checked-in* catalog, including 571 skill records. That **does not imply original upstream descriptions currently match**: these are distinct comparisons.

The live GitHub release check provides repeatable attribution for the remaining original datasets and differentiates text-only drift from changed actual game parameters. An official `fv1/fv2` value is source-verified on the checked revision; interpreting its units, rounding and duration requires actual encoded formulas or independent observations. Remaked 2E is the historical calculator *mechanics reference* and OS overwrites its old constants only where official OS source specifies current replacement values.

## Safety and next actions

When source descriptions differ: review exact old/new strings and supported formatting before a versioned catalog PR. **Do not silently rewrite 858 descriptions** or replace authored D1 overrides from a text-only diagnostic. When numerical fields differ: compare all dependent formula/test fixtures and prepare a reviewed change; never label a source-parameter change as a tested final combat formula.

The check consumes no GitHub write permissions, no game login, no player or admin credentials, and no production D1 SQL/write. Existing D1 CAS and fallback-backup processes remain authoritative for publication. The release readiness check is advisory for upstream differences so an unavailable game website cannot strand an unrelated safe UI release.
