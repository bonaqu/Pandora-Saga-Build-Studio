# История ROADMAP — часть 18 из 20

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


## Release 0.125.0 — new hero and D1 library

- [x] New characters start at level 1 while the planner retains 1–55, including future content above the temporary OS server cap.
- [x] My Builds has inline unsaved-draft Save / Discard / Cancel actions with no modal for New Build. Redundant global sharing removed.
- [x] Added private Cloudflare D1 library migration 0004, Worker API, per-browser secret and local offline copy; old local builds are imported into D1 when online.
- [ ] Apply D1 migration, deploy Worker, validate live sharing and short links, run full npm test and real browser E2E. Continue 59 missing and 59 partial Remaked formula keys.


## 0.126.0 — browser library resilience and automated D1 preparation

- [x] One-click «Новый билд» in the central character stage opens the existing inline unsaved-draft action in My Builds.
- [x] Offline deletions are queued locally and replayed to D1 before cloud-library hydration; a generation guard prevents older GET responses from overwriting edits made during the request.
- [x] Worker creates only the three missing, fixed shared-link schema objects or two private-library schema objects on first use, using idempotent SQL. This never modifies game catalog datasets; schema files remain in GitHub for controlled migration/backup.
- [ ] Confirm actual Worker deployment, D1 auto-setup, successful short-link creation/readback and browser E2E. If D1 DDL is denied, the API continues to report 503 without silently pretending a save worked. Complete remaining Remaked formulas and full npm test.


## 0.127.0 · Source-backed mounted-stat preview

- [x] Remaked `RelHorse` class baseline, riding green mastery and selected Honor shown in hero book without imaginary equipment bonus. Status PARTIAL; server parity unverified.
- [x] Audit: 58 NOT YET PORTED, 60 PARTIAL, 15 BASE/PREVIEW, 10 BUFF PREVIEW; tests for formula, validation and integration added.
- [ ] Continue conditionals, refinement, gear/soul procs, target-dependent damage, complete Node/browser verification and live Cloudflare deployment checks.


## 0.128.0 — individual share actions and D1 lifecycle tests

- [x] A saved build's Share action creates an **inline** short-link and selectable URL with Copy button inside that same build card; Worker/D1 errors render alongside the card instead of opening a blocking browser alert.
- [x] New Node regression suite uses an in-memory D1 adapter to test private save, listing, deleted tombstones, 55-level compatibility, isolation across browser secrets, and malformed input rejection. The existing 0003 public shares remain enabled only when the updated Worker and D1 schema are live.
- [ ] Execute real `npm test` and browser E2E, confirm live Pages 0.128.0 and Worker, verify public share POST/GET and clipboard from a published site, and complete remaining Remaked calculations.


## Source update 0.129.0 — revocable short links and inline deletion

- [x] Every **new** short link is tied in D1 to the owner's saved build, using only a hashed browser key and saved build ID; public GET checks its source's tombstone before returning the snapshot. Deleting the original revokes every associated URL, across recipients, with HTTP 410 and a stable `reason: deleted`.
- [x] Existing anonymous legacy short links without ownership data return 410 `reason: legacy`, rather than pretending they support deletion-based revocation. The schema upgrades in place (no destructive table replacements).
- [x] The server refuses shares without a saved owned build, refuses anonymous share creation, and prevents deleted IDs from being restored by a stale pending PUT. Ownership mapping and snapshot insertion use an atomic D1 batch.
- [x] Opening a dead/old/invalid link shows a compact bottom-right toast (8.5 seconds or OK). Deletion confirmation is inline; an offline deletion honestly warns that links remain active until cloud synchronization.
- [ ] Full `npm test`, live server deployment and real browser end-to-end checking required. Keep all Remaked incomplete formulas, future level 55, visual improvements, icon and catalog backlog open.


