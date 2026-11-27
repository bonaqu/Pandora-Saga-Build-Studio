# 0.972.0 — Three ally buff coefficients share one OS source

**Issue #476 — source coefficient parity, not a server execution claim.**

The Hero Book already used the current official OS FV1 for **War Cry** `320001001` `EP_DAMAGERATE_CONST/SCALE`, **Mass Concentration** `100055001` `EP_TOHIT_CONST/SCALE`, and **Wind Assist** `260006001` `EP_AVOIDANCE_CONST/SCALE`. The separate Skill Effects pane still applied frozen Remaked `10+20%`, `20+15%`, `15+15%` and did not reuse the strict caster/source access evidence.

The Skill Effects pane now calls the **same official source validator and modeled recipient result** `alliedRecipientPreviews(...,includeSource:true)`. The established default API shape stays unchanged; opt-in `includeSource` additionally returns the exact `flat` and `percent` from the two validated TARGET FV1 vectors for the next-breakpoint tooltip. Full source access is still checked: correct caster class list, level, learnable, branch, prerequisite, exact two effects, zero auxiliary FV2 and no new unknown effects.

Each of the three panes uses the model consistently, including mounted recipient base. Values are explicitly `modelOnly:true`/`uncertain:true` and are **not automatically applied** to the hero, to D1, or to saved builds. A future valid same-shape OS coefficient update appears on both screens; unfamiliar channel or revoked caster access suppresses both.

Regression: `tests/os-three-ally-source-parity-972.test.mjs`, 28 jobs × Lv1/45/55, supported FV1 revisions, invalid target/FV2/extra EP/class, default API compatibility. Exact OS numbers are source-confirmed; combat rounding/stacking remain candidate Remaked rules.
