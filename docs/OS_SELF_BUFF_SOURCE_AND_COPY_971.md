# 0.971.0 · Full-source Despair / Painlessness and live self-buff captions

The official Pandora Saga OS skill records are the authority for their **exported FV1 coefficients**. Remaked remains the **modeled** arithmetic source for read-only Skill Effects; no current live server damage-packet, crit-state, target mitigation, immunity duration or rounding parity is claimed.

## New complete-effect guards

| ID | Name | Actual OS source effects | Read-only existing Remaked model |
|---|---|---|---|
| 100058001 | Отчаянье | EP_DAMAGERATE_SCALE [0,0,35,40]; EP_ONDAMAGE_FIN_DAMAGE_SCALE [0,0,0,100]; EP_LOST_ATK_END [0,0,0,0] | ceil(walking ATK × (OS flat + floor(legacy modeled green-slash rank × OS mastery channel/100)) /100); incoming damage coefficient shown separately |
| 100057001 | Безболезненность | EP_PROTECTION_NUMB +100; EP_PROTECTION_TUMBLE +100; EP_DAMAGERATE_SCALE −50; EP_PROTECTION_MOVEBAN zero; EP_TOGGLE zero | floor(walking ATK × current negative OS rate/100); status protection left nonnumeric |

The guard checks full skill identity, level, class context and **every ordered TARGET effect, FV2 and all unmodeled FV1 lanes**. Despair's two signed numeric source channels can evolve independently; Painlessness only updates its negative ATK-rate lane while protective states remain exactly validated. Unknown source mechanisms **remove the numeric model**, not silently fall back to a hardcoded percentage. Both outputs are `modelOnly:true` and `uncertain:true`.

## RU/EN Hero Book source text

Self-buff explanations no longer freeze values for Despair, Swift Arrow, Lightness and Iron Scale (−50). When the source is recognized and the related source-gated model is available, captions read the **current exported** values. If an EP family or value changes into an unsupported shape, the interface says its magnitude is not calculated, instead of claiming the old effect. Movement rate is identified as a **speed index**, not guaranteed game movement speed percentage; Swift Arrow is a **firing-rate coefficient**, not a proven shots-per-second improvement.

All user-visible descriptions avoid internal API names. Tests cover two live multipliers, each source channel's allowed update, 28 hostile source mutations, 28 classes × 4 levels, and static RU/EN regression guards. No D1, Cloudflare Worker, game catalogs, saved builds or actual hero combat totals are modified. Full Node and Chromium CI required before publication; issue #476 remains open for unproven execution details.
