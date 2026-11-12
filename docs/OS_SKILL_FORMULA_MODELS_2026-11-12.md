# Pandora Saga OS — skill formula model coverage (12 Nov 2026)

## Scope and provenance
- Current checked-in OS snapshot: `data/os/skills.json` (569 skill records; 283 distinct `EP_*` effect names).
- Historical Remaked 2E source: `bonaqu/Pandora-Saga-Simulator-remaked/js/calc.js`, especially `Calc('ATK')` and the SPI/Blessing/Hymn steps.
- Current source-backed runtime: `pandora-os-character-calculator.js` → `scalingSkillPreview`.
- **Crucial:** these files show parameters and historical formulas, not the complete current OS server damage/rounding kernel. A unit test against a synthetic vector does not verify a displayed result in the live game.

## Change in 0.684.0
The Skill Effects page displays **coefficient-model** numbers for 11 independently identified skill variants, without pretending the full final damage or server rounding is proven:

| Skill source ID | Name | Modeled source effect(s) |
|---|---|---|
| 260005001 | Быстрое уклонение | EP_AVOIDANCE_CONST, AGI + Warding |
| 213605001 | Точная стрельба | EP_DAMAGERATE_SCALE, EP_TOHIT_CONST, EP_ATTACKRANGE_CONST, Archery |
| 142051001 | Хладнокровие | EP_CRITICALRATE_CONST, Cleaving |
| 330002001 | Поглощение стихий | EP_ABSOLUTE_MAGIC, SPR + Exorcism |
| 420002001, 420002002 | Магический щит | EP_MANA_SHIELD, Embodiment and Lv50 variant |
| 420004001, 420004002 | По следам ветра | EP_CASTINGCANCEL_RESISTANCE_CONST, SPR + Embodiment |
| 320011001 | Чары усиления | THREE separate aura / magic vectors, SPR + Blessing |
| 100058001 | Отчаянье | EP_DAMAGERATE_SCALE, Slash mastery; incoming damage not synthesized |
| 410000101 | Сосредоточенность | EP_ELEMENT_DAMAGE_SCALE, elemental mastery; separate EP_ELEMENT_BONUS |

### Coefficient interpretation (hypothesis)
For these source-matched target effects, this is a **visible model**, not a verified server result:

```
model = fv1[3] + floor(attribute * fv1[0] / 100)
               + floor(mastery * fv1[2] / 100)
```

`fv1[1]` must be zero, inputs must be valid integers and mastery must be within the class cap. Each effect's current OS ID, direction, source vectors and prerequisite/variant chain are still checked by the existing whitelist. The calculator does **not** use these model results to modify combat, active buffs, saved builds or D1. The Hero Book keeps **—** for unverified final magnitude and shows the modeled components in a separate clearly labeled line.

For example, current OS Отчаянье stores `[0,0,35,40]` → a model rate of 40 + floor(Slash mastery × 35 / 100). At Slash 85 this is 69% **modeled**; neither damage after target mitigation nor the final damage rounding is asserted. Legacy `js/calc.js` used an older 55-base skill expression and was never a current OS proof.

## Explicit exclusions and remaining work
- Skills such as `213703001` (Двойной выстрел), `233200101` (Волна), and the poison family `220001001/003` have other effect terms or unusual coefficient roles; a generic four-number interpolation would be misleading, so they retain unknown final output.
- Remaining catalog IDs require classification as passive, on-hit/proc, triggered subskill, heal/periodic, fixed buff, effect with validated formula, or unresolved. A blanket formula for every `EP_*` is **not valid**.
- Reconcile the mutable live D1 snapshot (read-only), test diverse current OS characters and conditions, establish stage order, caps and rounding, and promote each **modeled** result to verified **only** after independent game measurements.
- The formal set of 250 artificial mastery scenarios tests model invariants and class gates, **not** server parity.

## Acceptance matrix for gameplay validation
For each modeled skill capture current client/server build, skill ID, class, level, weapon, buffs, stat before and after, exact mastery, raw displayed attack/avoidance/etc., and an A/B comparison at coefficient step boundaries. Confirm whether each term is separately floored, rounded once, or affected by other party buffs. Until then, keep the model label.

## 0.685.0 — direct-hit coefficient class coverage

Extended the same explicitly unverified coefficient display to **19 learnable source skills** with an `EP_ONHIT_DAMAGE_SCALE` CASTER vector and a corresponding `EP_PLAYER_ATTACK` / `EP_PLAYER_ATTACK2` trigger. Class branch caps, weapon restrictions, required mastery, character level and prerequisite upgrades are enforced. Internal, non-learnable triggered variants cannot appear as separate player abilities. Source vectors must match the safe zero-attribute/zero-reserved structure; the model is `fv1[3] + floor(branchMastery * fv1[2] / 100)` and is **not** final damage against a target. Some skills are inaccessible to particular classes even when the raw OS classes map lists them. 250 artificial cases exercise the preview independently of actual gameplay.

## 0.686.0 — six source-guarded elemental/magic coefficient hypotheses

Six learnable current OS spell IDs carry one `EP_ELEMENT_DAMAGE` TARGET effect with `fv1[1] == 0` and `fv2 == [0,0,0,0]`: 410001001 (Огненная стрела), 410002001 (Огненная буря), 410004001 (Неотвратимый взрыв), 430001001 (Кража жизни), 430052001 (Ядовитый удар), 430053001 (Гниение). The proposed source model is `base + floor(INT * fv1[0] / 100) + floor(branchMastery * fv1[2] / 100)` with the **live OS source coefficients**. This is a *hypothesis* about coefficient interpretation, not verified damage output, and remains read-only. It does not include elemental mitigation, multi-hit and chained proc effects, HP steal or poison, or damage packet rounding. The six other learnable `EP_ELEMENT_DAMAGE` skills carry non-zero reserved/second coefficients and are deliberately excluded until a separate family rule is grounded.

Read-only UI uses the existing marked coefficient-model line, leaving final amount as `—`; class, level, branch capacity, source vector, fixed ID, type and learnability are enforced. The automated 250 synthetic variants check the mathematical *model*, not server equivalence. To establish accuracy, run paired current-client A/B stat+mastery and target-resistance samples.
