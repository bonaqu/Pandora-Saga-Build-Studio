## Аудит 0.598.0 — отмена специальных min–max в пользу общей формулы

По замечанию владельца пользовательский runtime не должен подставлять min–max только для конкретного билда. В релизе 0.598.0 удалены все наблюдавшиеся индивидуальные таблицы минимума из `pandora-os-character-calculator.js`. Проверенные 189–219/229–266, 9–12 и 50–74 **сохранены как независимые экспериментальные эталоны**, а в Книге героя пока показывается вычисленный универсально максимум АТК без непроверенной нижней границы.

Впервые удалось прочитать публичный JS актуального калькулятора OS:
https://pandorasaga-os.com/assets/BuildCalculator-DgAOFedT.js

В функции `xa(abilities, level, weapon, profic, tables.weaponPlus, modifiers)`:
- `damage_rate` = физическая атака по опубликованной формуле силы, + заточка, + источниковые плоские и % бонусы;
- `damage_potential` = `roundHalfEven(effectivePEN / (200 + 6*weaponProficiency) * 100)`, где `effectivePEN` включает `weapon.PEN` и эффекты пробивания;
- `damage_min` = `damage_rate - floor(damage_potential * damage_rate / 100)`;
- `damage_max` = `damage_rate`.
Карта оружия→ветка: `1H_SWORD,2H_SWORD,1H_TRUMP_WEAPON -> slash`; `1H_AXE,2H_AXE -> brush`; `1H_BLUNT_WEAPON,2H_BLUNT_WEAPON,WAND,STAFF -> blow`; `POLE_ARM,LANCE -> thrust`; `BOW,CROSSBOW -> archery`; `2H_TRUMP_WEAPON -> assassin`; `BARE_HAND,MARTIAL_WEAPON -> martial`.

Сравнение с **окном персонажа реальной игры** не совпало без дополнительных объяснений:
- Heavy Crossbow ID2411: `PEN=90`, предполагаемое `archery=5`, `damage_max=74`. Публичная `xa` даёт `roundHalfEven(90/(200+6*5)*100)=39` и `74-floor(74*.39)=46`, клиент показывает **50–74**.
- Zephyr Spear ID1483: `PEN=80`, предполагаемое `thrust=56`, `damage_max=219`. По `xa`: `roundHalfEven(80/(200+6*56)*100)=15` и `219-floor(219*.15)=187`, клиент **189–219**; при 50 зелёных было бы другое число. Эти примеры **не доказывают**, что формула неверна для боевого симулятора: она может рассчитывать иной показатель или использовать другой вход `profic` и модификаторы. Нельзя выдавать диапазон `damage_min` по цели за диапазон `ATK` в окне героя.

Итог: **универсальная формула для отображаемой минимальной АТК остаётся открытой**, см. Issue #238. Новый код/игровые данные не переписывают формулы MATK, DEF или MAX ATK, не затрагивают сохранения билдов, D1 и Worker.

