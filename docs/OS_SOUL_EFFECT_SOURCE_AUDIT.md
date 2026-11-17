# Pandora Saga — Source-only Soul effect census

Run `npm run souls:effect-audit` for per-family counts or
`node scripts/audit-os-soul-effects.mjs --all` for exact Soul IDs, directions,
and original `a/b/min/max` vectors.

This reads the checked-in current-game `data/os/souls.json` and performs
**no network requests and no Cloudflare D1 writes**. It is a separate,
source-only complement to `skills:effect-audit` (#476): OS skill effects
use `fv1/fv2`, while Souls have `a/b/min/max`. These are *not* equivalent
parameter semantics; do not join their magnitudes or infer combat math.

A family listed as `source-parameters-only` is **not** a verified numerical
bonus, damage formula, effect duration, level-scaling rule, or proof of server
rounding. Every row preserves signed parameters including negatives and zeroes
without guessing what the game engine does with them. If original data change
after a one-click catalog refresh, the next report reflects the new snapshot.

Regression tests ensure all IDs and effect names are counted, duplicate
effects belong to one Soul, directions remain exact (including explicit null),
future unknown EPs remain readable, and malformed source data fail loudly.
No in-game client or manual gameplay verification is required to run this audit.
