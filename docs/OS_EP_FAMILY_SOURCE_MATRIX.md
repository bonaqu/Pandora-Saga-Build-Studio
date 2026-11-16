# Source EP-family matrix (issue #476)

Run `npm run skills:effect-audit` to inspect **every** effect name from the
checked-in current-game skill catalog. Run `node scripts/audit-os-effect-families.mjs --all`
for full skill IDs, sample FV1/FV2 vectors and signed execution-reference diagnostics.

The matrix contains: occurrences, independent skill counts, target directions,
nonzero and negative counts in **each of the eight original vector positions**,
and conservative execution-link evidence. All rows intentionally say
`source-shape-only`. A populated FV coefficient, `TARGET` direction or
resolved child ID is **not evidence of a final in-game damage/heal/chance
formula**. The script neither reads nor writes production D1.

This is an inventory to support separate, effect-specific formula research,
not a claim that all EP mechanics are modeled. The existing
`npm run skills:formula-audit` remains the source-checked census of
supported hero-facing preview models; keep these two audits distinct.

Regression coverage verifies complete family accounting, old zero-link
sentinels, missing child references, negative/decimal coefficients, unknown
new EPs, malformed source vectors and immutability.
