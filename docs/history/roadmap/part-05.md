# История ROADMAP — часть 5 из 20

Рефакторинг 0.302: 27 именованных runtime-модулей; 588 внутренних ссылок; 170 файлов с исправленными зависимостями; постоянный статический аудит графа подключений. Данные OS и D1 namespace неизменны. [Карта архитектуры](../../../docs/STUDIO_ARCHITECTURE.md).
**0.389.0:** Source-backed two-slot outfits display in both armor/pants rails while storing one calculated item; pants selection replaces dresses. Shared rich equipment-choice previews and preserved Soul catalog scroll. Visual green split D vs extra training; Origin wizard alignment and compact numeric cards. Regression/production checks tracked independently.

**0.390.0:** Live game priority: initial branch points are not green mastery. Manual mastery 0..allocated, auto = allocated; absolute class cap and track 90; +/− hold actions. Legacy explicit manually saved green values are converted for backward compatibility.

**0.391.0:** Hero Path milestones display both required total branch level and corresponding free-point investment after profession start (e.g. assassin 21 = start 3 + invest 18). Shared numeric-field autofill mitigation on Hero Path, Origin and Hero Book; player-facing concise RU/EN help text.

**0.392.0:** Hero Path shows trained / learned / spent independently; concise absolute-threshold and class-start labels. Equipment item choices show source socket counts; shared outfit projection is visually locked but remains selectable. Compact 11-step grade and 4+3 element selector, cleaned header/footer.

**0.393.0:** New builds start with auto green mastery; group captions lead with their labels. Equipment selector only shows Soul slots for supported categories; Soul tab uses consistent «Слоты» wording and larger cards. Refinement buttons wrap without clipping; seven element choices fill both rows. An owner can edit equipment captions separately in RU/EN using existing authenticated D1 guide overrides.

**0.394.0:** Reduce Soul slot cards in the Hero appearance Souls tab to about 60×54 px while preserving their numbered labels, active glow and click behavior. Keep grade, type and element selectors unchanged until a design concept is approved. Chromium regression measures actual slot dimensions.

**0.395.0:** Approved UI direction applied to the actual Properties equipment panel: concept #02's contiguous 11-step forge bar with responsive text sizing; joined compact physical/magical type control. Element buttons use prior demo #05's grid: 4 equal buttons above, equal Light/Dark cells and double-width Rainbow below. Forge CSS is isolated in `pandora-studio-forge-controls.css`; Souls tab unchanged. Browser regression verifies grades at multiple widths, type seam, element geometry, and saved selections.

**0.396.0:** Refinement title now belongs to a framed fieldset matching Type/Element; redundant combined header removed. Properties scroll body reserves right-side room. Replacement or removal of equipment clears Souls bound to the old item even when one-piece outfits restore/displace pants; same catalog ID re-selection preserves Souls. Mirrored pants display no duplicate +grade. Exclamation badges expose exact invalid-gear and socket-capacity reasons in an unclipped floating tooltip.

**0.397.0:** Exclusive warning-badge hover stops equipment's rich preview and resumes it on the actual icon. D1 item Souls now track equipped item IDs and legacy drafts are reconciled once the current source catalog loads; invalid or oversubscribed Soul arrays are removed. Wearable-by race restrictions use readable chips in item Properties as well as hover previews. Book tabs, Hero Path headings/tabs/legends, equipment field labels, enchantment options, and Soul-picker controls now support authenticated RU/EN in-place editing through the existing D1 guide and record overrides. The encyclopedia's verified local icon manifest is authoritative: known-404 OS URLs are no longer requested. Real original missing sprites remain unspecified (no invented replacements). Added tests and asset-coverage audit.

**0.398.0:** Correct sparse Soul socket position validation during legacy build reconciliation: a soul at index 2 must not survive into equipment offering only index 0, even if one Soul in total fits capacity. Preserve valid sparse arrangements within capacity. Move live Pages/Worker verification from concurrent push trigger to successful Pages completion so queuing does not cause premature CI failure. No Worker/D1 migration.

**0.399.0:** A missing `>` after the forge stylesheet link caused the subsequently declared `pandora-studio-owner-inline-ui.css` link to be parsed as attributes rather than an independent stylesheet. Fixed malformed HTML and added structural regression for ALL head <link> tags and browser computed stylesheet registration. No D1, Worker, or game logic changes.

**0.400.0:** Approved wearable-by layout 02: item race/gender compatibility is rendered inside the same dl as Type, Level, Slots as a right-aligned wrapping meta value, without the redundant framed chip group. Editor RU/EN label persisted as before. Added exact 264-entry missing artwork audit grounded in OS local item/skill catalogs, including 4 item IDs, 260 skill IDs, same-name candidate icons, Japanese archive references and rights/identity caveats. No unverified/copyright-unclear artwork replacements.

**Source branch:** `bonaqu_projects` · **Desktop-first:** 1920×1080, 2560×1440, 3840×2160 · responsive mobile

**0.320.0:** исправление ложных NPC-списков версии 0.319: все 32 неподтверждённые записи удалены. По уточнению пользователя Кларис — мастер сундуков на Территории Королевства города Астир; Культье не является проверенным NPC игры. Территории Союза и Империи оставлены без неподтверждённых персонажей. Нормализация источников OS и полный реестр NPC остаются открытыми.

**0.322.0:** первые специальные записи энциклопедии (городские NPC и районы Астира) подключены к общим D1-override ключам; админ редактирует RU/EN названия, описания, услуги, координаты, переносит NPC между районами и создаёт новые проверенные записи. Публикация Worker должна быть подтверждена отдельно: GitHub Pages сама не развёртывает Worker. Дополнительные специальные справочники вне Astir пока требуют следующей нормализации.

**0.323.0:** устранение неиспользуемых точных дублей монстров с сохранением всех серверных ID и привязок. Гигантский питон 11205 (Лейбгольдские теснины, 8 записей добычи) выбран каноническим вместо пустого 72006. Скрываются полностью эквивалентные монстры без собственных источников, а также копии с одинаковыми локациями и таблицами добычи. Только варианты с различающимся дропом или отдельной значимой записью без лута остаются отдельными. Одинаковые предметы показывают совокупность источников получения разных ID. Поиск дубликатов названий использует готовый индекс вместо полного сканирования списка при каждом открытии.

This is a durable, evidence-led work plan. A GitHub Pages deploy proves assets were published, **not** that a feature passes real-user browser flows, actual Cloudflare Worker deploy, or game-calculation parity.

## Source update 0.375.0 — единые компоненты энциклопедии и Чести

- [x] Редактор поверх интерфейса сохраняет положение и раскрытие между главной, билдами и энциклопедией. Hover скрытой кнопки не должен менять видимость, положение или hit-testing (Chromium regression).
- [x] Переиспользуемые RU/EN названия вкладок энциклопедии и подзаголовков «Чести» из `PandoraWikiLabels` с безопасной серверной D1-валидацией и неизменными ключами.
- [x] Общий поиск по названию и замена существующих связей без ручного ID в списках с атомарной записью одного D1-поля; inline Add после последней записи.
- [x] «Честь»: сократить повторы, перенести начальные очки в ранг Оруженосца; прогрессия символов рангов и «Награды» вместо «Нация».
- [x] Согласованные UI-правила: `docs/APPROVED_UI_UX_GUIDELINES.md`.
- [ ] Перевести старые обратные связи (спавны и исторические NPC) на безопасную атомарную замену или подтверждённый rollback; пока только добавить/удалить.
- [ ] Продолжить аудит всех типов связей и редакторов и проверить write-тест на production D1 с администраторской сессией.
- [ ] Проверить полноту оригинальных игровых иконок и RU/EN имён по подтверждённым источникам.

## Source update 0.374.0 — editor button always clickable

- [x] В раскрытом редакторе кнопка «Скрыть» выше липкой шапки по z-index.
- [x] Chromium проверяет центр кнопки, реальное скрытие и раскрытие после перехода в Энциклопедию.

## Source update 0.373.0 — Honor UX + fixed editor launcher

- [x] Убрать старые CSS-правила, принудительно перемещавшие editor dock вправо и сжимавшие его до 240–298px при открытии энциклопедии; единственный владелец стилей — `pandora-studio-owner-dock.css`.
- [x] Закрепить свернутый editor launcher у `left:0` самого viewport, в том числе после перехода в Wiki, без видимой выезжающей полосы. Проверка в Chromium.
- [x] Удалить из статьи «Честь» дату и внешнюю новость, технические подписи источников и вторые языковые имена локаций/рангов. RU/EN — только соответствующая локаль.
- [x] Сделать редактируемыми пояснения «Честь» / «Вся честь», условия 12 рангов, названия и тексты трёх ежемесячных званий, пояснение продления. Обновить клиентскую и серверную валидацию D1.
- [x] Грамотные требования для рангов: 3 000 «Вся честь» и 20 000 золота, а для месячных рангов — топ нации за прошлый месяц. Уточнить льготу обменника.
- [x] PvP-локации: выбор существующей локации через поиск и dropdown, без ручного ввода RU/EN названия; новые добавлять в энциклопедии Локации.
- [x] При сохранении «Чести» не пересоздавать весь Wiki workbench, восстанавливать scroll и фильтр.
- [ ] Проверить, что Worker deploy на production завершился и активна расширенная проверка полей Honor. GitHub Pages не доказывает серверную запись.
- [ ] Полная проверка ручного CRUD во всех разделах на боевой D1 с тестовыми, не затрагивающими игроков данными.
- [ ] Восстановить 264 отсутствующих оригинала изображений из проверяемых источников; не использовать похожие спрайты без доказанной идентичности.

## Source update 0.372.0 — удобная панель редактора и безопасные проверки

- [x] Раскрытие редактора больше не рисует большой выступающий язычок; панель 474px с горизонтальным переключателем внутри заголовка и одной вертикальной прокруткой.
- [x] Центральный портрет героя не является админским `visual.*`-полем и открывает Книгу героя в редакторе по клику и клавиатуре; редактирование портретов доступно в «Расе».
- [x] В уже существующих обменах NPC поиск для добавления NPC, защита от повторного материала.
- [x] В режиме владельца доступен ручной вызов временной `admin/catalog/test-write` с серверной проверкой чтения/очистки и неизменности `catalog_current`; это **не утверждение об уже проведённой production записи**.
- [x] Read-only очередь источников отсутствующих оригиналов (264 по сохранённому манифесту), без выдуманной замены. Команда `npm run assets:missing`.
- [x] Матрица текущих возможностей и открытых пробелов в `docs/ENCYCLOPEDIA_EDITOR_AUDIT_2026-11-05.md`.
- [ ] Восстановить только подтверждённые OS/Remaked картинки, сравнить идентичность навыков и предметов перед добавлением в локальный каталог.
- [ ] Завершить полноценный CRUD и проверку записей всех разделов на production D1 с реальной авторизацией. Нельзя считать read-only smoke эквивалентом записи.
- [ ] Полная игровая сверка ОЗ/ОМ/защиты/заточки/сопротивлений и всех эффектов по текущему клиенту OS, а не приблизительные коэффициенты.

## Source update 0.371.0 — карточки сундуков, фактические связи, source-only аудит

- [x] Убрать чрезмерно растянутую горизонтальную плашку награды за уровень: компактная карточка максимум 480px, лейбл, крупный уровень и самостоятельный чип «Класс». Вписать на малых экранах; сохранение RU/EN и игровой структуры.
- [x] Сделать сетку 100%-записей адаптивной к фактическому количеству наград и привести счётчик в заголовке к визуальному стилю карточек, без изменения шансов.
- [x] В редакторе предмета развести справочную связь с монстром и фактическое добавление в обычную добычу: новый режим сохраняет настоящий dropedit по монстру, без выдумывания вероятности; обратный индекс восстанавливается из актуальных связей.
- [x] С карточки предмета-награды создавать настоящий обмен NPC с поиском NPC и выбором предмета-материала. Не добавлять дубль идентичного обмена с тем же NPC и материалом.
- [x] Перед сохранением drop/chest связей проверять существование всех предметов и исходной записи, а не записывать заведомо игнорируемые D1 override-значения.
- [x] Покрыть источник→предмет и предмет→источник unit-тестом с исполнением обработчиков, проверки целостности отправляемых ID, дизайнерские CSS-инварианты и RU/EN подписи.
- [x] Добавить в CI регулярные read-only аудиты реальных WebP и English name coverage, без искусственного заполнения переводов.
- [ ] Оригинальные игровые изображения: в текущем checked-in манифесте 1173 из 1437; 264 отсутствуют (260 навыков и 4 предмета). Искать исходники только из подтверждённого OS/Remaked, не подменять картинками-заменителями.
- [ ] Источник EN: в текущем OS snapshot нет имён 54 записей (1 предмет, 16 навыков, 36 монстров, 1 карта). Сверить с OS/Remaked прежде чем публиковать переводы; не машинно переводить без источника.
- [ ] Завершить полноценное безопасное CRUD для всех существующих рецептов и источников, проверить авторизованную запись Worker в production D1 отдельно от успешно проходящих read-only checks.
- [ ] Подтвердить сомнительные коэффициенты расчётов по клиенту текущей игры и Remaked; изменения формул в этом релизе намеренно отсутствуют.

## Source update 0.370.0 — понятный класс наград за уровень

- [x] В карточках шкатулок награды за уровень вместо «Для направления: Маги/Воины/Следопыты/Адепты» выводить «Класс: Маг/Воин/Следопыт/Адепт». Сохранить явные «Уровень 40» и заголовок награды.
- [x] В английском интерфейсе выводить Class: Mage/Warrior/Scout/Acolyte без технического термина Class family; не показывать неизвестный внутренний код как название класса.
- [x] Покрыть четыре базовых класса и RU/EN прямой проверкой работающего рендера. Не изменять исходные игровые записи, принадлежность предметов к классам, награды сундуков и production D1.
- [ ] Отдельно проверить реальную семантику гарантий сундуков и связей получения в игре, формулы урона/ОЗ/ОМ и продакшен-сохранение администратора: это не следствие UI-правки.

