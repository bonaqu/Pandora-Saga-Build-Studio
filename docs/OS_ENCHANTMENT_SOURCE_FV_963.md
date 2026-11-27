# 0.963.0 — три связанных эффекта «Чар усиления» из OS

**Текущий источник:** https://pandorasaga-os.com/gamedata/skills.json и текущее data/os/skills.json; skill `320011001` доступен классу ENCHANTER, тип ALLY, минимальный уровень 45. Источник meta.json служит для диагностики каталога, не для формул.

## Источниковые величины

| EP | FV1 | Применяемая модель Remaked | SPI134 / Blessing90 |
|---|---|---|---:|
| EP_AURADAMAGE_SCALE | [20,0,20,10] | flat + floor(SPI×A/100) + floor(Blessing×C/100) | 54 |
| EP_AURADAMAGE_CONST | [5,0,10,5] | flat + floor(SPI×A/100) + floor(Blessing×C/100) | 20 |
| EP_ELEMENT_DAMAGE_SCALE | [0,0,20,10] | flat + floor(Blessing×C/100) | 28 |

Когда одновременно выбраны Holy Weapon и Enchantment, исторический Remaked-порядок даёт source model holyEnhanced = holyWeapon + auraFlat + ceil(holyWeapon×auraRate/100). Для текущего SPI134/Blessing90 величина 36. Это НЕ доказательство актуального серверного смешивания аур.

Все три EP обязаны присутствовать один раз в единой skill record, с корректными id, learnable, ENCHANTER, charLevel45, TARGET, нулевым FV2. Отсутствие нового неизвестного level channel и нулевая компонента SPI для стихийного множителя обязательны. Иначе все три модели и их комбинация становятся null, никаких частичных бонусов нет.

## Исправление metadata provenance

В data/os/meta.json.warnings актуализированы 13 предупреждений по прямому GET официального OS API от 27 ноября 2026 года. По сравнению с исторической локальной копией: 57→61 NPC scripts, 68→96 предметов без источника, 41→51 монстр вне локаций, 63→99 map drops, добавлен areasv10. Это показатели исходной диагностики доступности контента, НЕ боевые коэффициенты и НЕ подтверждение игровой формулы.

data/os/meta.json.curated=true сохранён, официальный meta.sha остаётся в первичном игровом API и не переписывается в редакторскую копию. После объединения проверить независимые 17/17 OS API и локальный read-only 16/16 D1; любые новые отклонения оставить явно видимыми.

## Проверка и ограничения

Новые тесты принуждают к all-or-nothing на неизвестных EP, `FV2`, уровне, направлении, классе; корректные FV1 перепроверяются без подмены игры. Existing admin compatibility/replay must surface changes prior to D1, no SQL or production writes. Issue #476 remains open; other EP families and actual server stages need further evidence.
