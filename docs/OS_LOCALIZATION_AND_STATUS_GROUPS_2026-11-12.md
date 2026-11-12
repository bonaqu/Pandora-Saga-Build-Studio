# Official OS RU/EN naming and status groups (2026-11-12)

## Identity-first localization

The checked-in OS snapshot [meta.json](../data/os/meta.json) declares `baseLocale: "ru"` and official `branchLabels`. Russian IDs/names originate from [skills.json](../data/os/skills.json), [classes.json](../data/os/classes.json) and matching item/Soul tables. EN names come from [strings.en.json](../data/os/strings.en.json), by the same ID or branch key. Never auto-translate names or infer identity from visual resemblance to old Remaked terms. In particular `exorcism` = **Экзорцизм / Exorcism**, `alchemy` = **Ремесло / Alchemy**, `brush` = **Рубящий удар / Cleave**, `darkness` = **Магия тьмы / Darkness**.

## Resistance families

The historic sources disagree on whether the body list includes knockdown: [the status page](https://wikiwiki.jp/pandoras/%E7%8A%B6%E6%85%8B%E5%A4%89%E5%8C%96) lists five without knockdown; [the historical equipment index](https://wikiwiki.jp/pandoras/%E3%82%B9%E3%83%86%E3%83%BC%E3%82%BF%E3%82%B9%E8%AA%BF%E6%95%B4%E8%A3%85%E5%82%99%E4%B8%80%E8%A6%A7) explicitly includes knockdown as a sixth. The UI uses the latter listing without asserting current OS combat-engine parity.

Current OS effect channels `EP_IMMUNE_VIT_TYPE` and `EP_IMMUNE_SPI_TYPE` provide physical and mental status-family effects. Current RU OS Soul 102007 gives body resistance +20, Soul 102014 gives mind resistance +20, and race skill 900010002 gives body resistance +15. They are distinct from `EP_IMMUNE_STUN`, `EP_IMMUNE_TUMBLE`, etc.

The *historical* Pandora Saga taxonomy lists:
- Body: оглушение (stun), падение (knockdown), отравление (poison), кровотечение (bleeding), ожог (burn), заморозка (freeze).
- Mind: сон (sleep), безумие (madness), немота (silence), слабость (weakness), болезнь (disease).

Sources: [historical status guide](https://wikiwiki.jp/pandoras/%E7%8A%B6%E6%85%8B%E5%A4%89%E5%8C%96) and [historic equipment/status-group index](https://wikiwiki.jp/pandoras/%E3%82%B9%E3%83%86%E3%83%BC%E3%82%BF%E3%82%B9%E8%AA%BF%E6%95%B4%E8%A3%85%E5%82%99%E4%B8%80%E8%A6%A7). Complete modern OS combat-roll membership and stacking stages are **not independently confirmed**. Do not add group values to individual resistance totals as if a server rule was established.

## Hero Book and D1 editorial contract (0.703.0)

**Результаты расчёта → Сопротивления:** the body and mind numbers have a normal label-hover/keyboard-focus hint, with no additional ⓘ icon. The descriptions contain real line breaks, mention the historic 6/5 members and direct players to **Защита**.

**Защита → Сопротивления отдельным состояниям:** the expandable reference uses the **same** D1 summary keys `guideedit.book.summary.40` (body) and `guideedit.book.summary.41` (mind), plus the D1-editable header `guideedit.book.defense.statusFamilyCaption`. In owner mode, each paragraph can be edited via its pencil or double click, saved through the existing D1 editor; RU and EN are separate, no independent duplicate copy. The 12 individual names have standard hover descriptions in the existing `guideedit.book.defense.resistStatus:<key>` namespace. All editor descriptions are **plain text**, rendered with newlines. Historical double-escaped `\\n` in a D1 override is normalized on display without changing the override's bytes.

## Source and accuracy matrix

| Source | What the current planner calculates | Scope of proof |
| --- | --- | --- |
| [Remaked legacy Calc RESPDebuff/RESMDebuff](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/master/js/calc.js) | `floor(VIT/28)*7` for body; `floor(SPI/28)*7` for mind | Confirmed **legacy code arithmetic**; not independent proof of 2026 OS combat rolls |
| Current OS structured item and Soul `EP_IMMUNE_*` + `EP_BLOCK_BREAK_RESIST` | Twelve separate bonuses, item refinement min/max gates, other equipment passives | Confirmed source-effect handling in Build Studio; does not guarantee actual status success chance |
| Current OS `EP_IMMUNE_VIT_TYPE` and `EP_IMMUNE_SPI_TYPE` | Separate grouped body/mind item bonuses | **Not** automatically added to each individual status |
| OS racial/honor/warding inputs | Documented source-backed dwarf/human passives, chosen honor and strict Warding 26 TARGET effect vector | No double counting of extra CASTER effect; other active/conditional mechanics remain excluded |
| [Historical classification/equipment guide](https://wikiwiki.jp/pandoras/%E3%82%B9%E3%83%86%E3%83%BC%E3%82%BF%E3%82%B9%E8%AA%BF%E6%95%B4%E8%A3%85%E5%82%99%E4%B8%80%E8%A6%A7) | Historic notes suggest elemental and base-attribute dependencies in individual status chances | Not verified for modern OS: **do not invent numeric scaling or present resistance as an exact probability** |

The 12 individual status values currently reflect **known flat source bonuses**. Unknown multipliers, elemental-derived rolls, ailment duration and current server resistance caps are not included. Keep the existing `verified:false` flag; see Issue #476 for fuller source-based reconstruction.
