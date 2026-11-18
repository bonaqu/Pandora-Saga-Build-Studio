- UI использует только локальный assets/os-icon-manifest.json и точные оригинальные WebP. Не давать клиентскому браузеру прямо запрашивать сторонний домен для новых иконок; временно использовать неизвестное изображение, не подменять схожим предметом. Восстановление после подтверждённой публикации: event-triggered catalog-icon-reconcile.yml, строго оригинальные WebP/JPEG и asset manifest, проверка Node+Chromium exact SHA перед PR merge, без cron и D1 writes.
- Стрелки навигации экипировки должны идти перед кнопкой закрытия и совпадать с её размером, высотой и стилем. Сундуки упорядочены по исходным шансам p внутри независимых групп; не менять исходные редакторские индексы D1.
- Регрессии tests/catalog-player-facing-polish-846.test.mjs, tests/catalog-icon-reconcile-ci-846.test.mjs, tests/chest-presentation.test.mjs и настоящий Chromium. После merge отдельно Pages+Worker+D1 только чтение.

## 0.843.0 · Поддержка источниковых параметров и сохранение моделей (#615)
- Известные изменения mana/cooldown поддерживаются в трехступенчатой песенной цепочке, специализированных умениях, стрелах и ресурсах. Проверять old/new и не терять предыдущие модели; 571 mana+1 должно давать 0 lost.
- Для Песни поэта 340001004/340001005/340001006 только mana/cooldown могут изменяться. Дополнительное изменение cast должно приводить к трем lost и блокировать D1. Все EP/FV и связи остаются exact.
- В Энциклопедии Честь/Победы в PvP только локальная иллюстрация, без внешнего fallback.
- Node+Chromium exact SHA, затем read-only Pages/Worker/D1. Не менять production D1.

## 0.842.0 · Иконки и интерфейс Энциклопедии (#615)
- «Честь / Победы в PvP»: скриншот только как иллюстрация, никаких ссылок на игровой сервер или атрибуций с датой.
- Все сундуки: стабильное сортирование визуального списка по p, независимые группы остаются отдельными; исходные D1-индексы должны сохраняться даже в админке.
- Окно экипировки: стрелки соседних слотов перед последним крестиком, согласованные размеры и состояния через equipment-tooltip.css; основной theme.css не раздувать.
- Иконки: приоритет локальных оригиналов и подтверждённых display aliases, затем точный игровой URL только для записей из активного каталога. Старые 404 не считать доступными и не подставлять похожие картинки.
- После успешного live-readonly либо проверенного авто-мержа каталожного PR отдельный workflow запускает строго WebP/JPEG зеркало, ресурсный PR, два CI exact SHA и только затем auto-merge и Pages; нет cron и D1 writes. Проблемы доступа к внешним файлам остаются видимыми, 100% покрытия не обещать.
- Экспериментальные механики из PR #653–656 остаются на проверке и не должны попадать в этот безопасный UI-релиз.

## 0.841.0 · Справочные навыки тактики и поддержки (#615)
- qualitativeSkillMetadataMatches разрешает источник mana/cooldown только для sourceOnly combatTechniquePreview, tacticalSkillPreview и supportEffectPreview. EP/FV1/FV2, классы, reqs, parent/child, каст и остальные поля по-прежнему exact.
- Тесты tests/catalog-qualitative-skill-metadata-841.test.mjs и tests/catalog-skill-source-parameters-839.test.mjs: исходные затраты «Провокации»/«Лечения отравления» не удаляют справочные строки, «Блокирование» ещё блокируется replaySkills при изменении расхода.
- Node+Chromium exact SHA, потом live D1 только чтение. Не изменять данные игры, Worker, CAS, auth и билды.

## 0.840.0 · Source metadata для семи справочных боевых навыков (#615)
- combatTechniquePreview сохраняет только существующие sourceOnly/qualitative строки при изменении настоящих mana/cooldown, которые UI уже читает из skill catalog. Игровые EP/FV, классы, reqs, prereq, range, cast, AoE, linked child/parent, а также другие инспекторы остаются со строгой sourceVerifiedSkillSignature. Не менять числовые боевые формулы.
- Проверку парных source-only мана/перезарядка вести на старом/новом каталоге для 7 качественных combatTechniquePreview; дочерняя цепочка не может изменять FV1/FV2, даже если стоимость допустима.
- Сохранить independent replaySkills до D1: изменение mana у 233001001 теперь не теряет источник и допускается, но у 100000501 остаётся loss + blocking preflight, пока отдельный контракт там не доказан.
- tests/os-combat-advanced-738.test.mjs и tests/catalog-skill-source-parameters-839.test.mjs; обязательны Node+Chromium exact SHA, live D1 только чтение.

## 0.839.0 · Источниковые затраты/время/дальность навыков (#615)
- skill.source-parameters (sourceOnly): только mana/cast/cooldown/motion/range/aoe старого и нового существующего skill ID, при неизменном funcs, reqs, классе, prereq, powerStat и прочих игровых полях. Качественные/числовые боевые эффекты не подтверждаются этим источником.
- Независимый replaySkills по-прежнему блокирует потерю любого ранее моделируемого эффекта/описания до CAS; пример 233001001 «Внезапная атака», mana+1 — sourceOnly классификация, но blocked final preflight.
- tests/catalog-skill-source-parameters-839.test.mjs, 571-source batch и отрицательные случаи. Node+Chromium exact SHA, Pages/Worker/D1 read-only после merge. Не писать D1 и не менять auth/CAS/builds.

## 0.838.0 · Зональная добыча и связи (#615)
- table.zone-drop-parameters (sourceOnly) распознаёт только числовые изменения base/perMember и lo/hi при сохранении identity, порядка, map/mob/item IDs, видов csv/hook и slotP/slotN. Два исходных hook без mob являются осмысленными zone-wide правилами, не добавлять им ложную ссылку на монстра. Не приписывать source-only весам шансы дропа на сервере.
- sourceGraphIntegrity до D1 дополнительно охватывает zoneDrops: zone.map -> maps, hook.mob -> monsters, reward.i -> items. Контролировать все 11 зон, 285 правил и 1 091 предмет; изменения формы требуют review.
- tests/catalog-zone-drops-source-838.test.mjs; Node+Chromium на exact PR SHA и после merge read-only Pages/Worker/D1, без записей в production.

## 0.837.0 · Подписанные лимиты мастерства и требования навыков (#615)
- Если изменение class.branchCaps пересекает порог reqs любого классового навыка, оно остаётся needsReview, даже если старая/новая арифметика зелёного мастерства работает. Новая доступность требует проверки механики.
- class.branch-limits: old/new проверка изменения только существующих 27 веток через PandoraSkillProgression branchPotential/trained/setPotential на всех профессиях. Не смешивать с HP/MP, parent, новыми ветками и не подтверждать неизвестные условия.
- sourceGraphIntegrity проверяет reqs.branch, reqs.amount, циклы prereq и форму class.branchCaps до D1. Требования 100/102 есть в исходной игре; не приравнивать их к пределу зелёного мастерства 90.
- table.server-level-cap/table.server-experience-cap sourceOnly только для корректных целочисленных метаданных; не менять независимый планировщик до 55 ур.
- tests/catalog-branch-and-requirements-837.test.mjs, Node+Chromium exact SHA, Pages+Worker+D1 read-only. Не писать production D1, не менять auth/CAS/builds.

## 0.836.0 · Исходный опыт отдельно от модельной прокачки (#615)
- table.experience-requirement — sourceOnly для неотрицательного конечного tables.exp[1..99].expReq, включая дробный архивный опыт уровней 60–69 при неизменных полях ability/skill/skillLimit и неизменной схеме.
- Нельзя утверждать, что source OS exp таблицы определяют очки актуального планировщика. Изменение ability/skill/skillLimit — needsReview. tests/catalog-experience-source-836.test.mjs.
- Обязательные Node+Chromium exact SHA и проверка Pages/Worker/D1 parity без production writes; релизы публикуются только по порядку после зелёных CI.

## 0.835.0 · Доказанные таблицы физической и магической заточки (#615)
- table.weapon-refinement подписывает weaponPlus ratio+flat только при полном старом/новом 1..10 model replay через weaponAttackPreview для STR/W.
- table.magic-refinement-rate подписывает magicPlus ratio через magicAttackPreview при магической заточке; magicPlus.flat калькулятор НЕ использует и новая правка flat остаётся needsReview.
- Неизвестные поля, лишние уровни, нецелые и отрицательные значения — needsReview. tests/catalog-refinement-tables-835.test.mjs.
- node+Chromium exact SHA; Pages и D1 Worker parity только в чтении, без production D1 writes/auth/CAS/builds.

## 0.834.0 · Доказуемые контракты профессий и таблиц (#615)
- class.base-parameters, table.race-origin, table.job-origin получают verified только при полной old/new проверке по 28 профессиям, 6 расам, уровням 1/15/30/45/55 и веткам мастерства. Незнакомые коэффициенты и изменения class.parent/baseClass — needsReview.
- table.ability-source sourceOnly: планировщик рассчитывает очки навыков через собственную модель PandoraSkillProgression/PandoraLevelProgression, а не через OS abilityPoint.
- sourceGraphIntegrity до CAS блокирует новые сломанные class.parent/baseClass и promotion cycles. Тесты tests/catalog-character-preflight-834.test.mjs.
- Проверить Node и Chromium на точном PR SHA, затем Pages и live read-only Worker/D1 parity, без записи D1, auth, билды и CAS не менять.

## 0.833.0 · Видимые статусы проверки атомарных разделов игрового каталога (#615)
- `PandoraOSCatalogWorkbench.statusForSelection(change,entries)` объединяет все `compatibility.entries` вложенных источников для одной выбираемой целиком записи `@dataset` (`trades`, `chests`, `instances`, `expertise`, `tables`). Публикация этих разделов намеренно остаётся атомарной: **не** разбивать её на частичные записи без отдельного CAS- и D1-контракта.
- Правило приоритета статуса: `needsReview` > `verified` > `sourceOnly`. Учитывается полный список machine-readable `entries`, а не первые шесть UI примеров. Ранее для выбранного целого раздела отображение статуса могло пропадать из-за несовпадения `@dataset` и вложенных ключей `trades:trades/0`, `chests:boxes/0`, `instances:0`, `expertise:limit/WARRIOR`.
- Каждая обычная строка предмета/комплекта продолжает сопоставляться только со своим точным ID, чтобы статус чужой записи не подсвечивал текущую. Для невыбранной строки статус отсутствует. Общее preflight/publish/сохранение не меняются.
- `tests/catalog-atomic-status-833.test.mjs`: восемь реальных сценариев изменения NPC/обменов/сундуков/подземелий/мастерства/таблиц/комплектов/предметов, неизвестных новых полей, 31 вложенного статуса, а также отображение только выбранных строк.
- Проверить Node + Chromium на точном SHA, затем Pages + read-only Worker/D1 parity 16/16. Без production D1 writes, без изменения auth/CAS/библиотеки персонажей.

## 0.832.0 · Единый реестр подтверждённых source-contracts (#615)
- `PandoraCatalogSafety.sourceContractRegistry` — машинно-читаемый неизменяемый список 9 существующих строго проверяемых преобразований игровых исходных данных: 5 verified числовых изменений source FV/расходников навыков, 1 sourceOnly количество расходников без заявленного игрового урона, 2 изменения экипировки и 1 бонус заточки.
- Для каждого `verified` по-прежнему обязателен полный old/new `matches()` на действующем калькуляторе и `replaySkills`/`replayEquipmentEffects`/`check`/`sourceGraphIntegrity` до D1 CAS. Замена старого разветвлённого списка внутренних вызовов реестром **не** добавляет известных механик и **не** меняет их числовую семантику.
- `compatibility.entries` содержит ID применённого подписанного контракта (`contract`) для каждой автоматически распознанной игровой числовой правки. Изменение неизвестного EP, смешанных параметров, без доказательства или с новыми игровой схемой остаётся `needsReview` и не получает ID; текстовые исходные правки тоже не приписывают себе numeric contract.
- Глубокая проверка `tests/catalog-source-contract-registry-832.test.mjs`: источник 43 навыков и 47 расходов одним пакетом → 16 verified/27 sourceOnly/0 needsReview на текущем источнике, все 43 имеют договорённый проверяемый ID; unknown EP/время каста/неизвестный эффект экипировки не получают неверный verified; readonly и проверка всех обязательных предпросмотров. Регрессия новых связанных классов и 20 863 source ссылок из 0.831 сохраняется.
- После точного Node + Chromium CI выполнить публикацию Pages и независимую проверку 16/16 Worker D1 только на чтение. Production D1, CAS, аккаунты и билды не менять. Не заявлять покрытие неизвестных боевых формул.

## 0.831.0 · Валидация связей экипировки, заточки и мастерства (#615)
- `PandoraCatalogSafety.sourceGraphIntegrity(before,after)` теперь пересчитывает более 20 тысяч source ссылок на полном реальном snapshot: 11 109 разрешённых пар предмет/профессия, `itemForth` → предмет, `unison` → предмет набора и каждый компонент, `expertise.limit` и `tables.jobInit` → реальные классы. Новая или изменённая оборванная связь блокируется в preview и в финальном `prepare()` **до CAS D1**; текущие 4 исторические нулевые ссылки skill не трогать.
- Компактные `graph.samples` показывают по возможности различные `kind/field` из массовых повреждений, а не восемь одинаковых записей одного поля. `newBroken` учитывает полный объём; `samples` — только поясняющие примеры.
- `PandoraCatalogSafety.compatibility` присваивает статус **по каждому изменённому** комплекту `unison`, профессии/ветке/оружию/уровню `expertise`. Любое изменение игровых коэффициентов этих наборов остаётся `needsReview`, а не необоснованным verified.
- Регрессии `tests/catalog-equipment-expertise-links-831.test.mjs` на текущих JSON: утрата classes в предметах, сиротские записи заточки, состав/ID комплектов, ограничения профессий и таблицы начальных классов; проверка массовых статусов, отсутствие мутаций, неизвестные эффекты и единый pre-D1 gate.
- CI: Node + Chromium на точном SHA; после merge — Pages и read-only Worker/D1 parity 16/16. Никаких production D1 writes, auth/CAS/build changes.

## 0.830.0 · Целостность вторичных игровых ссылок и подробные статусы (#615)
