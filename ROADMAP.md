# Pandora Saga Build Studio — implementation roadmap

**Updated:** 2026-10-30 · **Latest source release:** 0.74.0 (`2026.10.30.74`), browser and Worker deployment unverified  
**Source branch:** `bonaqu_projects` · **Desktop-first:** 1920×1080, 2560×1440, 3840×2160 · responsive mobile

This is a durable, evidence-led work plan. A GitHub Pages deploy proves assets were published, **not** that a feature passes real-user browser flows, actual Cloudflare Worker deploy, or game-calculation parity.

## Workstreams

| Issue | Scope | State | Next evidence required |
|---|---|---|---|
| [#1](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/1) | Own D1 catalog, imports, RU/EN, wiki and admin publication | In progress | Worker/D1 deployment confirmation, live API smoke, full 11-dataset coverage, authenticated edit/rollback |
| [#2](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/2) | Self-host original race art and 1,437 icon files | Blocked on original image bytes | Mirror original files, validate WebP and manifest, remove all external icon runtime dependencies |
| [#3](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/3) | Single-screen character workbench, race/class/skills/equipment | In progress | Browser E2E and visual inspection on desktop/mobile, keyboard focus, all gear conflict scenarios |
| [#4](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/4) | Saved-build migration, refresh safety, admin reliability, QA | In progress | Real `npm test`, persisted-state + refresh + modal navigation E2E, deployed admin API, crash monitoring |
| [#5](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5) | Current OS combat parity with Remaked reference mechanics | In progress | Source-fingerprinted fixture matrix, buffs, mastery, Forth enhancement, Souls, sets, modifiers and procs |

## Source update 0.74.0 (including 0.72.0) — pending visual QA

Desktop center stage height is capped, portrait translateX offsets are removed and threshold pins are placed on the slider as diamond glyphs. Pending: confirm with real 1920×1080/2K/4K/mobile screenshots, hit targets, tooltip clipping and published Pages version. Do not mark this visually accepted yet.

## Already implemented; do not redo blindly

- 8 selectable portrait variants for 6 races; three Origin tabs (race plus passive / 28-class drill-down wizard / level plus six in-place stats); right-hand skill allocation with class/level gates and skill-unlock markers.
- Portrait-local item, Soul, refinement (+0…+10) and element/type screens; accessory/cloak slots cannot refine. In-panel scroll stays anchored when adjusting the same item; generic site scrollbars share dark styling.
- Wiki runs D1-first, falls back per catalog JSON to the repository, supports full result search with progressive 100-row paging, linked items/NPCs/monsters/chests/drops.
- UI view/session restore no longer forces stale `#wiki/...` after switching tabs.
- HP/MP: OS class coefficients, race/base class + spent attributes, publicly audited half-to-even rounding; supported flat ability and max-life/mana item/Soul effects. Flat source gear/Soul elemental resistance and selected combat bonuses displayed **separately from final stats**.
- Local original image mirror audit, strict WebP/manifest check, package scripts; physical source file transfer is still incomplete.

## Current owner requirements — full outstanding backlog (2026-10-30)

**Rule:** all items below remain open until acceptance evidence exists. Source commits are not the same as deployed code, working UI, OS combat parity or user approval.

| Priority | Feature / acceptance | Current state |
|---|---|---|
| P0 | Hero Path ≥410px on wide desktop, visual focus on center portrait, usable gear slots, no overlapping/overflow | Source changed in 0.50; desktop/mobile browser screenshots and user acceptance pending |
| P0 | One-screen Hero Path: change branch points by dragging, show skill unlocks inside skill progression bar, identify prerequisites/class caps, select skill and see full detail without another page | Potential/growth editor, auto/manual green Adeptness and second in-panel skill gallery in source; keyboard/touch testing, OS learning parity and full-detail audit pending |
| P0 | Origin as sole attribute-spend editor: race+class initial stats, level budget, progressive cost, class caps, no legacy data loss | Initial data/editor done; validate historical points against live OS, test state persistence and UI; remove unreachable duplicate implementation code later |
| P0 | Distinguish invested attribute cap 99 from **effective stat values above 99** from equipment/Souls and future buffs, sets, percentages, grade conditions | Flat item/Soul effects and historical Remaked prayer-Adeptness SPI preview separately shown; live OS verification, percent effects, other skills, sets, auras, buffs and advanced formulas pending |
| P0 | All 14 portrait gear slots; Choose, Properties, Souls with only supported sockets, 1-click gem type/element, enchant grade +0…+10, scroll/focus retention | Updated source; full cross-item interactive/browser testing pending; verify Soul compatibility for belts and every slot |
| P0 | Full game catalogue is browse-only, no duplication of character's worn gear; wiki item type RU/EN, meaningful multiline descriptions and source links | Updated source; full catalog visual/E2E and locale corpus QA pending |
| P0 | Local active build and named library remain intact after F5; multiple builds, save/select/delete with confirmation, comparison; JSON buttons removed | Source updated, local reopen preserves legacy/future fields and dress legwear; real reload and corrupted-storage tests pending |
| P0 | Short public link to one build or up to 30 saved builds, safe prompt and save-current action; no clobber of local builds | Worker API, migration, frontend in repo; deployment, D1 migration, live GET/POST, browser compatibility and abuse protections NOT yet verified |
| P1 | Original icon mirror 1,437 and user-supplied race art with manifest; all relevant wiki/items/skills/souls have authentic icons | Blocked on missing binary icon assets; no placeholder should claim original |
| P1 | D1 complete catalogue, RU/EN, item acquisition from monsters/drops/maps/NPC exchanges/chests, wiki coverage and admin editing | Repository JSON/Worker import already present; live D1 content and status require independent validation |
| P1 | Source-validated 28-class combat math across attributes, Souls, sets, sockets, Forth, refining, all EP_* modifiers, resistance, HP/MP, speed, cast, buffs, prestige and per-class rules | Partial flat ability/HP/MP/bonuses only; full OS parity open; no guessing unsupported calculations |
| P1 | Test/release discipline: full unit suite, 1920/2560/3840/1366/390 viewport E2E, F5/URL import/delete/stock UI, CHANGELOG and rollback | Some static tests updated; end-to-end, complete automated suite and actual deployed state NOT verified |

### Sharing rollout prerequisites

1. Apply `worker/migrations/0003_shares.sql` to the **existing** Cloudflare D1 database using the explicit Wrangler migration command; do not recreate or wipe D1.
2. Deploy updated Worker from `worker/index.js` and validate CORS from the GitHub Pages origin, then test GET/POST with a sample, sharing and reopening in two independent browsers.
3. Confirm load of `#b/<11-char ID>` never silently overwrites another active draft. Check "save current first", "open without saving", "cancel" and library merge. Reject bad IDs, oversized payloads and abuse.
4. Only after this confirmation mark remote sharing as ready. Local build library must work even when Worker is unavailable.

## Priority A — acceptance tests and crashes

- [ ] Visual check for adjusted centered 3-column layout at 1920×1080, 2560×1440, 3840×2160, 1366px and 390px: portrait focus, wide 410–430px Hero Path, nearby equipment slots and no horizontal overflow. Static CSS tests are not browser evidence.


- [ ] Perform 1920×1080 full interaction pass: change Kroll → Human M/F → Elf M/F → Myrine → Dwarf → Enkidu; verify selection state, fixed-only genders and equipment suitability.
- [ ] Reload on every origin tab and with workbench/wiki/inventory open and **closed**; make sure no unexpected tab, hash, modal, focus, or scroll jump.
- [ ] Test gear for all 14 slots: choose/remove, forbidden refinement, +0→+10→+0, gem types/elements, sockets and incompatible souls, dress blocking legs, class/race/level filters, JSON round-trip.
- [ ] Wiki test 8 categories, 100→200→all, RU/EN and ID search, item drops, NPC trade and deep link, fallback when Worker is temporarily unavailable.
- [ ] 1440p/4K/390px visual + keyboard-focus and mobile touch smoke, shared scrollbars, tooltip clipping, right-skill column overflow.
- [ ] Run full `npm test` locally and record test process output; never treat static regex tests as real browser E2E.
- [ ] Verify actual Worker deployed version and D1 status without mutating credentials or existing data.

## Priority B — combat calculations without guesses

- [x] Compare initial stats for all 6 races × 4 base professions against Remaked and OS.
- [x] Integrate archived BPt level budget and SPt next-point cost into both UI editors, without overwriting saved builds.
- [ ] Validate archived attribute budgets and next-point costs against current live OS game rules.


1. Freeze OS version/digest of `classes/items/souls/skills/tables` and current public calculator JS; keep Remaked Legacy engine immutable.
2. Run 28 classes × levels (1,10,20,30,40,45,50,55 where supported) × base/modified attribute vectors; compare public calculator against exact results, rounding and flat/percent stacking.
3. Source-map every known `EP_*` and Soul modifier with responsible owner, stack order, min/max upgrade gate, set membership and duplicate-prevention; unsupported effects must remain visibly unsupported.
4. Verify 148 enhancement families and level milestones, two gemstone families × seven elements and up to +10, plus proc exceptions.
5. Verify attack, defense, resists, crit, hit/dodge, cast/attack speed, ranged reach, potions, mastery, group/guild/honor and passive/active buffs.
6. Add deterministic snapshot parity vectors and release gate. Merge only formulas with confirmed source and fixture coverage.

## Priority C — art catalog ownership

- Run `npm run assets:audit` for accurate existing completeness, `npm run assets:mirror -- --limit=200` on a host permitted to download original game WebP.
- Repeat until complete, commit original binary assets and matching `assets/os-icon-manifest.json`, run `npm run assets:audit:strict`.
- Replace external runtime sprite fallbacks **only after exact original files exist**, with visible missing-image behavior rather than unrelated art.

## Release discipline

Update CHANGELOG.md/README.md, this roadmap and matching GitHub Issues after meaningful work. Prefer one coherent release with tests and an explicit deployment check. Never overwrite existing user builds, live D1, Worker secrets or preserved Legacy formulas. Full browser smoke and live OS parity can remain *pending* when tooling/network is unavailable, but must never be described as passed.

## Verification sources

- Public OS game data and calculator: https://pandorasaga-os.com/#calculator
- Remaked formula audit: https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/docs/CALCULATION_PARITY_AUDIT_2026-10-11.md
- Prior enhancements and effect mapping: https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/modern/enhancement-effects.js
- Current build source and release notes: https://github.com/bonaqu/Pandora-Saga-Build-Studio

## Добавление требований 2026-10-30: зелёное мастерство и расход очков

- [x] Модель разделяет распределённые очки из уровней и фактическое тренировочное мастерство; авто-режим по умолчанию сохраняет обратную совместимость.
- [x] В видимой правой панели свободные, использованные и общие очки; групповая сумма, лимит профессии, точный ввод, зелёная шкала и переключение страниц «Развитие» / «Умения».
- [x] Счётчик потраченных **характеристик** использует только вручную вложенные очки `state.stats`; предметы, души и подтверждаемые пассивные эффекты не становятся покупкой за SPt.
- [x] Сохранение `mastery`/`masteryAuto` локально и в общих билдах; при изменении класса старые сверхлимитные очки можно вернуть без потери полного билда.
- [ ] Проверить точность шкалы тренировочного мастерства для текущего OS, включая начальное зелёное значение каждого класса, правила его увеличения и бонусные мастерства.
- [ ] Провести кросс-проверку текущего OS для пассивки Priest/Cleric/Enchanter «Вдохновение» (СД), т.к. временная модель — по Remaked Legacy, а не по подтверждённому текущему серверу.
- [ ] Реальный пользовательский тест: Загонщик 45 секущий / 42 зелёного, 0 исцеления, очки уровня 45, выбор недоступных и изученных умений, F5 и обмен по ссылке.

### 2026-10-30 · 0.55 — удаление повторных редакторов

- [x] Удалён старый редактор умений из модального окна персонажа (в нём оставались ссылки на удалённую вёрстку `branchValue`).
- [x] Навигация персонажа больше не создаёт дублирующее распределение навыков/характеристик; переходы ведут в главный «Путь героя» и «Происхождение».
- [ ] Проверить визуально оба перехода, циклы закрытия окон, фокус и сохранность активного билда в реальном браузере.

### 2026-10-30 · 0.56 — визуальный разбор очков каждой характеристики
- [x] Под полями всех шести параметров выводятся независимо сумма базы, ручных вложений, эффекты вещей/душ, предварительное отдельное мастерство и итог; видно цену следующего очка по Remaked SPt.
- [ ] Подтвердить актуальность стоимостей SPt и BPt у текущего OS по контрольным игровым данным. До этого ни старые вложения, ни формулы их исторического учёта автоматически не переписывать.

### 2026-10-30 · 0.57 — доступность обновлений и одна шкала
- [x] Убрана отдельная зелёная шкала: синий/золото/зелёный теперь части **одного** трека, в нём двигается ползунок вложений.
- [x] В `sessionStorage` сохраняются выбранная категория, раскрытая ветка, прокрутка правой панели и активная страница.
- [x] Исправлено 4-колоночное сжатие дерева на экранах до 1200px.
- [ ] **P0 Доставка:** подтвердить завершение последнего запуска GitHub Pages со статусом success, затем сравнить публичную `site-version.json` с HEAD. На 18:04 UTC последним успехом был `4d1bbe79`, запуск 0.56 ожидал выполнения, несколько предыдущих отменялись.
- [ ] Проверить пользовательский апдейт без потери положения, 45/42 по единой полосе, скролл/клавиатуру/сенсор на текущей опубликованной странице.

### 2026-10-30 · 0.58 — game-like single bar
- [x] В каждой раскрытой ветке до 90 позиция ползунка обозначает только вложенные очки; зелень поверх вложенных, золото между зеленью и вложениями, синяя остаточная часть до class cap, красный замок выше class cap.
- [x] В основном интерфейсе убраны кнопки ±. Точное ручное значение остаётся доступным для клавиатуры, есть отдельное подтверждение полного сброса только навыков.
- [ ] Проверить отображение замка, пороговых иконок и drag по реальному игровому референсу на мобиле и десктопе.

### 2026-10-30 · 0.59 — пороги без смещения
- [x] Пороговые иконки вдоль единой шкалы 0–90 не меняют координаты при классовом пределе менее 90.
- [ ] Browser E2E: сравнить кликабельные иконки на 8/26/41/54 и красную границу низколимитного класса; особенно ширину 410px и мобильный узкий экран.

### 2026-10-30 · 0.60 — точность полосы и пользовательская непрерывность
- [x] 0.59 успешно опубликована Pages (run 41104934636, GitHub success); 0.60 проверять отдельно.
- [x] Выравнивание заливок и красной границы по той же внутренней ширине, что и input[type=range]. Иконка центрируется на пороге.
- [x] Восстановление фокуса раскрывающей группы/ветки и точных полей навыка при обновлении UI, прокрутки каталога иконок после выбора навыка.
- [x] Миграция старых числовых ключей mastery при загрузке каталога по тому же oldToOS, что и points.
- [ ] Подтвердить в живом браузере F5, клики, клавиатуру и точность делений 8/26/45/55/90 на разных экранах.

### 2026-10-30 · 0.61 — источник требований и карточка умения
- [x] Галерея показывает доступность на основе известного `skills.json`, но не утверждает, будто умение точно выучено игроком.
- [x] При выборе иконки — локальные исходные параметры ОМ/каст/кулдаун/дальность/стихия, требования по вложенным и зелёным очкам, известные EP-функции, переход к своей wiki-статье.
- [x] Клик по иконке порога сбрасывает только поиск/фильтр списка, не стирая билд, и выделяет соответствующее умение.
- [ ] Полная верификация доступности/изучения пассивных и обучаемых умений по live OS и Remaked; UI не должен смешивать разрешённость и факт изучения.

### 2026-10-30 · 0.62 — состояние поиска и фокуса экипировки
- [x] Контролы заточки, типа, стихии и гнёзд имеют устойчивые идентификаторы для возврата фокуса после изменения свойства.
- [x] Поиск по душам хранится в состоянии открытого слота и sessionStorage; после назначения души список не сбрасывается к полному каталогу.
- [x] При выборе нового предметного слота поиск сбрасывается, чтобы старый фильтр не выглядел как отсутствие доступных душ.
- [ ] Реальный браузерный проход выбора вещи +0…+10, типов и стихий, гнёзд 0–3, выбор/извлечение души, табуляция и сенсорные касания.

### 2026-10-30 · 0.63 — реальная блокировка контролов и сворачивание дерева
- [x] В DOM-строителях устранено `disabled="false"` (HTML трактует как true); для всех boolean HTML attrs используются настоящие свойства.
- [x] Бюджет и class caps отвязаны от полной загрузки Wiki/D1, local classes и tables читаются отдельно, неизвестные class caps не подменяются 90.
- [x] Повторное нажатие на группу закрывает её целиком; закрытая группа не открывается снова после F5 или асинхронной загрузки каталога.
- [ ] Выполнить реальный браузерный тест: 45-й уровень 103 свободных, Клирик → Молитва → Милосердие, перетащить 0→10→20, увидеть расход 10/20, выполнить F5; проверить class cap и раскрытие/закрытие при тапе.
- [ ] Проверить disabled/checked boolean во всех других динамических интерфейсных компонентах и отсутствие CSS overlay над range.

### 2026-10-30 · 0.64 — интерактивные регрессионные тесты
- [x] Постоянный `node:test` сценарий на 103 свободных: 0→10→30→0, запрещённый cap0, двойное нажатие на группу и правильное disabled=false.
- [x] Подсказка о drag и клавиатурных стрелках непосредственно в редакторе ветки.
- [ ] Запуск full `npm test` в доступной среде и реальный E2E на опубликованной странице (не только симуляция), контроль мобильного ввода.

### 2026-10-30 · 0.65 — изменения прямо во время прокачки
- [x] Во время `range.input` обновляются итоговая сумма группы, вложенные в ветку очки и зелёное мастерство без перерисовки и обрыва перетаскивания.
- [x] При смене профессии автоматически раскрывается первая ветка с разрешённым лимитом; старые значения не стираются.
- [x] Недоступные по классовому лимиту реальные пороговые умения остаются видны в едином треке и маркируются замком.
- [ ] Провести интерактивный браузерный тест для class switch/drag/milestone popovers, проверить мобильную ширину иконочных порогов.

### 2026-10-30 · 0.66 — предсказуемое открытие развития
- [x] Первую раскрытую категорию определяет максимальная сумма class caps для доступных навыков, а не первый разрешённый пункт в списке.
- [x] Проверена категория по фактическим classes.json для Cleric/Warrior/Mage/Predator.
- [x] Ручной выбор и сворачивание группы не отменяются автоматически.
- [ ] Browser QA на смене профессии с вложенными очками и повторном входе после F5.

### 2026-10-30 · 0.67 — тестирование реальных обработчиков
- [x] Исправлено некорректное `sources.app` в новом регрессионном тесте, выявленное его независимым запуском в V8.
- [x] Функциональный тест действительно вызывает `selectJob` и проверяет неприкосновенность очков/mastery с новой профессией.
- [x] Реальная OS-запись «Раскол» (Рубящий удар, порог 41) проверяется против cap15 Клирика в `milestones`, значение отмечается `locked`.
- [ ] Full `npm test` на Node + визуальный браузерный E2E + публикация 0.67 GitHub Pages.

### 2026-10-30 · 0.68 — очистка интерфейса развития
- [x] Родительская группа при сворачивании закрывает ребёнка и при повторном раскрытии не восстанавливает его, включая F5.
- [x] Компактные маркеры порогов (несколько дорожек), настоящее изображение и описание в hover/focus tooltip.
- [x] Скролл правой панели и дерева передан странице, длинный каталог порционно раскрывается.
- [x] Класс + показатели очков в одном блоке; выбранное умение раскрывает карточку непосредственно над галереей.
- [ ] Настоящий визуальный/browser E2E и проверка тач-раскрытия маркеров.

### 2026-10-30 · 0.69 — устранение лишних UI-строк
- [x] Нет подробных технических записей под редактором каждой базовой характеристики; реальные формулы не затронуты.
- [x] Равные размеры `+`, `−` и ручного поля на desktop/mobile.
- [x] Только вкладка «Души» управляет гнёздами; удалена дублирующая строка в «Свойствах» и лишние кнопки/пояснения.
- [x] Короткая легенда развития; исходные данные и wiki не удалены.
- [ ] Визуально проверить табуляцию, точный размер полей, scroll и состояние выбранных душ в живом браузере.

### 2026-10-30 · 0.70 — осмысленные регрессионные сценарии
- [x] Изменены устаревшие ожидания тестов: повторное открытие группы не восстанавливает ветку, удалены техничные ярлыки.
- [x] Тест порогов на настоящих OS-умениях Клирика: маленькие маркеры без полноразмерных иконок в дереве, hover содержит данные навыков.
- [x] CSS-regression на отсутствие вложенного скролла в правой панели.
- [ ] Прогнать npm test и Playwright в рабочем окружении, уточнить UX смартфона.

### 2026-10-30 · 0.71 — устранение ложного падения теста
- [x] HTML boolean атрибуты проверяются отдельно от обычного `setAttribute`; они не должны ошибочно запрещать aria-label/title.
- [ ] Повторить тесты после изменения, выполнить full `npm test` и browser QA на мобильных и десктопе.
