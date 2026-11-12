# Official OS RU/EN naming and status groups (2026-11-12)

## Identity-first localization

The checked-in OS snapshot [meta.json](../data/os/meta.json) declares `baseLocale: "ru"` and official `branchLabels`. Russian IDs/names originate from [skills.json](../data/os/skills.json), [classes.json](../data/os/classes.json) and matching item/Soul tables. EN names come from [strings.en.json](../data/os/strings.en.json), by the same ID or branch key. Never auto-translate names or infer identity from visual resemblance to old Remaked terms. In particular `exorcism` = **Экзорцизм / Exorcism**, `alchemy` = **Ремесло / Alchemy**, `brush` = **Рубящий удар / Cleave**, `darkness` = **Магия тьмы / Darkness**.

## Current-source English skill naming regression (0.704.0)

The pinned 2026 OS snapshot contains **569** Russian skill identities but only **553** official `strings.en.json.skills[id].n` entries. The remaining **16** are not translated by the site: their canonical Russian skill name is displayed unchanged instead of inventing an English variant. Game-backed names are rendered by exact ID, whereas editorial UI headings stay separate, so a shared Russian term cannot mislabel a spell:

| OS skill ID | Canonical Russian | Canonical OS English | Previously incorrect UI-only alias |
| --- | --- | --- | --- |
| 100052001 | Яростная атака | Raging Soul | Rage Attack |
| 260006001 | Помощь ветра | Speedy Gale | Wind Assist |
| 320004001 | Благословение ветра | Accelerate | Wind Blessing |
| 320005001 | Знак жизни | Divine Aid | Sign of Life |
| 330051001 | Священное оружие | Bless Weapon | Holy Weapon |
| 430051001 | Темная аура | Gloom | Dark Aura |
| 310012001 | Пробуждение | Vivify | Awakening |

Some generic interface captions deliberately have different English wording from a same-spelled skill. This is not a translation error in the UI: e.g., the **Recovery** section versus skill `310022001 Восстановление / Restoration`, **Poison** element versus `220001001 Яд / Toxify`, or **Knockdown** resistance versus `500000015 Падение / Tripped`. Code must use an ID to choose a game name and never replace the generic UI dictionary wholesale.

Source: [current RU skill records](../data/os/skills.json), [current EN catalog](../data/os/strings.en.json), and exact-ID regression `tests/os-canonical-ui-names-704.test.mjs`. These are current OS **site data**; no live server-client label parity claim is made beyond the pinned source snapshot.

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

## Cumulative Forth breakpoints for individual resistance (0.703.0)

`data/os/itemForth.json` stores **full cumulative grade snapshots only when a threshold changes**. The 162 original item records have no loss of previously existing effect names between their subsequent published breakpoints. For +4/+5 an effect introduced at +3 must remain active until another threshold is crossed. Previously `sourceEffects` selected `itemForth[id][exactGrade]` only and fell through to incomplete narrative parsing, dropping known effects at 342 intermediate item-grade combinations.

`forthSnapshotAtGrade` now selects the highest existing threshold **not exceeding** the equipped grade, never sums all snapshots or double-counts earlier effects. Before the first threshold an official Forth record yields no Forth bonus; for items without a structured Forth table the existing legacy narrative fallback remains. The same source lookup is used by conditional fire-element refinement preview; invalid item IDs, grade or source structure still fail closed. Regression: all 162 × 11 grade cases, real item 15077 block-break 1/3/5/7 at grade 0/3/6/9, real item 15024 knockback 5→10 at +7 and higher, items 14603/14613 silence +2 per two refinement steps.

## Source and accuracy matrix

| Source | What the current planner calculates | Scope of proof |
| --- | --- | --- |
| [Remaked legacy Calc RESPDebuff/RESMDebuff](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/js/calc.js) | `floor(VIT/28)*7` for body; `floor(SPI/28)*7` for mind | Confirmed **legacy code arithmetic**; not independent proof of 2026 OS combat rolls |
| Current OS structured item and Soul `EP_IMMUNE_*` + `EP_BLOCK_BREAK_RESIST` | Twelve separate bonuses, item refinement min/max gates, other equipment passives | Confirmed source-effect handling in Build Studio; does not guarantee actual status success chance |
| Current OS `EP_IMMUNE_VIT_TYPE` and `EP_IMMUNE_SPI_TYPE` | Separate grouped body/mind item bonuses | **Not** automatically added to each individual status |
| OS racial/honor/warding inputs | Documented source-backed dwarf/human passives, chosen honor and strict Warding 26 TARGET effect vector | No double counting of extra CASTER effect; other active/conditional mechanics remain excluded |
| [Historical classification/equipment guide](https://wikiwiki.jp/pandoras/%E3%82%B9%E3%83%86%E3%83%BC%E3%82%BF%E3%82%B9%E8%AA%BF%E6%95%B4%E8%A3%85%E5%82%99%E4%B8%80%E8%A6%A7) | Historic notes suggest elemental and base-attribute dependencies in individual status chances | Not verified for modern OS: **do not invent numeric scaling or present resistance as an exact probability** |

The 12 individual status values currently reflect **known flat source bonuses**. Unknown multipliers, elemental-derived rolls, ailment duration and current server resistance caps are not included. Keep the existing `verified:false` flag; see Issue #476 for fuller source-based reconstruction.
