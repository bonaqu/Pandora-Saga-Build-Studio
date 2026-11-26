# Source-only EP vector shape audit · #476

This read-only inspector helps prioritize **unknown** Pandora Saga OS skill formulas without turning source coefficients into unverified gameplay claims.

## Run

```bash
npm run skills:effect-audit
node scripts/audit-os-effect-families.mjs --all
```

The default command prints aggregate counts and the number of source shapes for every EP family. The `--all` report also includes `sourceShapes`: distinct shapes, their source skill IDs and counts. Both commands use the checked-in `data/os/skills.json` only. Neither accesses nor writes production D1.

## What a source shape means

A shape consists of **source direction** (`CASTER`, `TARGET`, or `UNSPECIFIED`), positions that are nonzero in `fv1[0..3]`, and positions that are nonzero in `fv2[0..3]`. Examples:

- `TARGET;fv1=3;fv2=-`: only the fourth `fv1` position is nonzero, no `fv2` position is nonzero.
- `CASTER;fv1=0,3;fv2=2`: two `fv1` positions and one `fv2` position are nonzero.
- `UNSPECIFIED;fv1=-;fv2=-`: direction is explicitly null and both coefficient vectors are zero.

The report counts effects separately from distinct skill IDs; a skill can have multiple effects of the same family. Shapes are lexicographically sorted and the source catalog is not mutated. `zeroVectorEffects` counts all-zero source vectors across all families.

## Interpreting the evidence safely

A family with multiple shapes may have variants, different parameters, or distinct mechanics. **It does not prove which**. The signatures deliberately exclude coefficient *values*, signs, ranks, damage types, target mitigation, durations, hit counts, and rounding stages. Consult the per-family samples and underlying source skill records before making a gameplay claim.

These are structural source observations, **not final damage/healing values, server-tested formulas, evidence of percentage units, or confirmation of live D1 parity**. Keep resulting combat formulas marked unverified unless independently substantiated. Do not change published catalog records or character stats merely because a shape differs.

Next independent work for #476: review high-variation families against current OS source definitions and preserved Remaked calculations, classify proven parameter roles, and add narrowly scoped regression vectors before considering any UI formula changes.
