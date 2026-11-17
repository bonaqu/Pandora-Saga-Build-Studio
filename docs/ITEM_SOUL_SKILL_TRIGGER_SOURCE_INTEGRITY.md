# Item and Soul → skill trigger reference integrity

## Independent follow-up to completed #615 (17 November 2026)

The completed data-only workbench already validates direct skill action
references and item consumables before publishing a D1 catalog selection.
A review of the current **checked-in** `data/os/items.json`,
`data/os/souls.json` and `data/os/skills.json` found eight source
families where `effect.a` is a *referenced skill ID*, rather than the
coefficient of a combat formula. The cross-source inventory currently
contains **68 item links and 6 Soul links (74 total)**, all pointing to
existing source skill IDs.

The eight recognized source families are:

| EP family | Original target location |
|---|---|
| `EP_SKILL_EXEC` | Item effect `a` |
| `EP_SKILL_EXEC_BALM` | Item effect `a` |
| `EP_ONHIT_SKILL_EXEC` | Item or Soul effect `a` |
| `EP_ONDAMAGE_SKILL_EXEC` | Item effect `a` |
| `EP_ONHIT_SKILL_EXEC_ATTACKER` | Item effect `a` |
| `EP_ONDAMAGE_SKILL_EXEC_ATTACKER` | Item effect `a` |
| `EP_ONDAMAGE_ELEM_SKILL_EXEC` | Item effect `a` |
| `EP_SKILL_EXEC_MAPIN` | Item effect `a` |

`PandoraCatalogSafety.sourceGraphIntegrity` now includes the missing
item and Soul source links in the same **read-only, old/new signed graph
comparison** used by the existing pre-D1 publication guard. A newly
broken, changed target fails closed with a specific source ID and EP
family. The exact unchanged original source stays valid. The original
`effect.b` coefficient is *not* a target identifier: do not interpret it
as a confirmed server chance, duration, hit count or percentage.

Regression tests mutate every one of the eight item families and every
one of six current Soul links independently; removing the referenced
skill is also blocked. Unknown new `EP_*` names remain `needsReview`
in the existing semantic compatibility system rather than being
automatically treated as skill calls. No game client, production D1
write, personal account, model formula, or site version was changed.

This strengthens the already-closed #615 acceptance without reopening
it or claiming full server behavior for proc effects.
