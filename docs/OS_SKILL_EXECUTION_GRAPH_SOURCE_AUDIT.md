# Skill execution graph — source-only audit (#476)

This report enumerates the **current checked-in OS skill snapshot**, without
starting the game or reading/writing Cloudflare D1.

- Run `npm run skills:chain-audit` for source-graph counts, unresolved links,
  historic zero placeholders, cycles, and classless/multi-parent target IDs.
- Run `node scripts/audit-os-skill-execution-graph.mjs --all` for every exact
  parent/child edge, its `EP_*` family, original signed FV1/FV2 vectors,
  and each chain starting at a learnable class-assigned source skill.
- Compare with `npm run skills:effect-audit` for **all** effect families,
  including those that do not point to other skills, and with
  `npm run skills:formula-audit` for existing hero-facing coefficients.

## Snapshot evidence: 17 November 2026

The **571** source skills currently contain **112 resolved execution-reference
candidates** to **111 distinct target IDs** across seven explicitly
enumerated `EP_*` families. The audit finds **2 original zero placeholders**,
**0 unresolved positive targets**, **0 cycles**, **86 classless targets**, and
**234 learnable class-assigned root skills**, of which **51** have outgoing
candidate references. **299 IDs** are reachable from the roots; **39 referenced
targets** are not reached by *these roots alone*. Such targets may be reached
through other game mechanics, including item/NPC triggers: do **not** label
them unusable or remove them.

A candidate reference is defined narrowly as `fv1[3]` in one of the seven
known source families matching a current skill ID. Only those literal source
vectors are reported. A zero is retained as an original source placeholder;
a positive unresolvable target or nonintegral target is reported, not silently
dropped. Parent/child IDs and vectors remain untouched.

**Source links do not prove gameplay:** the report cannot infer activation
chance, hit/miss, duration, tick count, stacking, projectile count, target
resistance, mitigation or final damage. In particular `fv2[3]` is retained as
raw evidence, **not** automatically interpreted as a probability or count.
Class-based reachability is a navigation aid, **not** a legal single-character
build. Never promote these results to verified server formulas.

The existing prepublish `PandoraCatalogSafety.sourceGraphIntegrity` remains
the **blocking** data-integrity authority for D1 updates. This independent
read-only report helps decide which families need source-specific study;
it does not replace CAS, auth, compatibility replay, browser tests, or the
original #615 acceptance.
