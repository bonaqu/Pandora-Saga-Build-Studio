# 0.969.0 · Current OS paired self effects, source first (#476)

Three pre-existing **read-only Skill Effects** models still used frozen Remaked numerical coefficients, despite exact matching current-OS FV1[3] source records. New source gates require the complete signed effect chain, not just the visible beneficial component.

| OS skill | Current OS paired target effects | Preserved modeled arithmetic |
|---|---|---|
| 100052001 «Яростная атака» | EP_DAMAGERATE_SCALE +30 AND EP_ARMORCLASS_SCALE −60 | ceil(walking ATK × OS rate/100) |
| 100053001 «Бастион» | EP_DAMAGERATE_SCALE −20 AND EP_ARMORCLASS_SCALE +40 | floor(direct DEF × OS rate/100) |
| 168052001 «Железная чешуя» | EP_CRITICAL_SAFE 0 AND EP_AVOIDANCE_SCALE −50 | floor(base evasion × OS negative rate/100); critical safety remains nonnumeric |

Supported changes of the same official source *shape and sign* flow through to the displayed amount and companion penalty. New unknown FV1 lanes, FV2 fields, changed direction, extra/duplicate effects, or inverted sign **suppress the row** rather than silently retaining old values. Crit safety remains an unquantified state.

Outputs now explicitly carry modelOnly/uncertain markers. The server-exported **values** are authoritative; final PvP/PvE server stacking/rounding and mitigation are not derived from those values alone. No D1, saved builds, character combat totals, skills, classes or equipment data were written.

Test: `node --test tests/os-three-paired-self-buffs-fv-969.test.mjs`, then full mandatory Node/Chromium PR checks. Tests: current values, source drift, paired signed penalties, 36 hostile-source mutations and 84 class/level scenarios.
