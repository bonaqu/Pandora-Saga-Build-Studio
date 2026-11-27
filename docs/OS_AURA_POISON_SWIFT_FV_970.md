# 0.970.0 · Current OS Aura/Poison/Swift Arrow FV1 replay

This release removes **four frozen Remaked coefficient previews** in Skill Effects, and keeps independent gameplay stages in their existing modeled/unverified status.

| Skill ID | Current official OS FV1 | Existing Remaked model used |
|---|---|---|
| 220001001 «Яд» | EP_AURAPOISON_CONSTANT [0,10,5,5] | 5 + floor(level × 10/100) + floor(Alchemy × 5/100) |
| 220001003 «Яд» (advanced) | [0,10,15,6] | 6 + floor(level × 10/100) + floor(Alchemy × 15/100) |
| 430051001 «Тёмная аура» | EP_AURADARK_CONSTANT [8,0,0,15] | 15 + floor(SPI × 8/100) |
| 213702001 «Стремительная стрела» | EP_ATTACKINTERVAL_SCALE [0,0,0,30] | Read-only rate coefficient 30 (not proved actual shots per second) |

All coefficients, including the displayed next Spirit threshold for Dark Aura, now read from the exact **current OS FV1 lanes** rather than literal values. The level, class, trained branch cap, prerequisite chain and weapon gate remain in the existing Skill Effects model.

**Full-source guards:** Poison requires the original CASTER EP_CONSUME_ITEM (item 50056, quantity 1) and TARGET EP_LOST_CHANGE_WEAPON; Swift Arrow requires its exact TARGET weapon-change loss state; Dark Aura accepts only its one expected EP. Changed target directions, FV2, unknown stat/mastery lanes, extra actions or item costs **suppress** the model row until verified. Signed or future valid same-shape OS values replay; server execution, stacking and precise hit damage remain unproven.

No D1, Cloudflare Worker, item/skill catalog, saved builds or actual character combat totals change. Read-only result labels remain `modelOnly:true` and `uncertain:true`. Automated test: `tests/os-four-aura-source-fv-970.test.mjs`, full Node and Chromium before merge.
