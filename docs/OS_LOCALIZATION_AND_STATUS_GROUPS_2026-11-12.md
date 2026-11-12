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

Hero Book: **Результаты расчёта → Сопротивления** lists separate body and mind group values with ⓘ explanatory hints; **Защита → Сопротивления отдельным состояниям** shows individually modeled resistances and an expandable explanation. Group formula currently ported from Remaked: `floor(VIT/28)*7` for body, `floor(SPI/28)*7` for mind, plus known character effects. This is existing simulator arithmetic, not a new OS gameplay observation. All UI text RU/EN is source-grounded and independent of game calculations.
