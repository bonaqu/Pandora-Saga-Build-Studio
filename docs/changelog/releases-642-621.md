# История релизов · 0.642.0—0.621.0

## 0.642.0 — 2026.11.11.642 · Expanded Hero Book editorial defaults

- Added 36 further source-authored RU/EN captions in Book: guild and priest enhancements, resistance skill explanations, song previews, conditional equipment effects, potion recovery and empty/disabled messaging.
- Added dedicated Node tests for additional pairs, independent RU/EN D1 overrides, exact-match fallback and noneditable player/game data.
- Player names, item rows, skill records and calculated numbers remain outside the generic editor; specialized guide editors keep priority.
- Publication requires full Node and Chromium acceptance.

## 0.641.0 — 2026.11.11.641 · Hero Book RU/EN editorial sweep

- Expanded existing D1 inline copy editor to 156 exact, source-backed Hero Book caption pairs; each has a stable readable key with a collision-resistant suffix and independent RU/EN overrides.
- No duplicate pencil on specialized labels, chapter tabs or actionable game/item controls; long text grows within the Book and editing does not trigger a navigation or a game calculation.
- Live save, undo and locale switch update only authored text without remounting the current hero, losing focus or overriding generated combat values.
- Node regression and Chromium admin acceptance cover bilingual fallback, safe edit scope, long text and real in-screen D1 mock transport; production D1 is not changed by tests.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.640.0 — 2026.11.11.640 · Guest library RU/EN editor and stable four-slot saved-build rows

- Editable RU/EN guest library and shared-link gate copy without account side effects.
- Guest gate and shared-link modal receive D1-safe authored copy keys without touching usernames, build IDs, drafts, or access checks.
- New saved builds appear last; overwrites retain their position across local storage and cloud refresh, using a backward-compatible creation timestamp.
- Fixed 390px build-card width, four slots per complete row, no stretching of partly filled rows; horizontal scrolling is confined to the card grid only when needed, including filtered results.
- No production D1 mutations; Node and Chromium use isolated fixtures for editorial and card-grid acceptance.

## 0.639.0 — 2026.11.11.639 · Borderless Compare checkbox and comprehensive desktop/mobile visual layout screenshots

- Borderless Compare checkbox and comprehensive desktop/mobile visual layout screenshots.
- Adds the extended Chromium screenshot and geometry audit for Origin, Appearance, Hero Path, Hero Book, Wiki chapters, account and build dialogs.
- The visual audit reports only checks that the browser actually executes; broader RU/EN content remains in Issue #390.

## 0.638.0 — 2026.11.11.638 · Two-browser owner CAS conflict, preserved draft and safe refresh/retry regression

- Two-browser owner CAS conflict, preserved draft and safe refresh/retry regression.
- No production admin writes in the browser scenario: isolated, intercept-only mock API.
- Production CAS atomicity was verified separately by workflow #43034133794.

## 0.637.0 — 2026.11.11.637 · Bilingual D1-editable admin drawer captions, inline help and focused owner controls

- Bilingual D1-editable admin drawer captions, inline help and focused owner controls.
- Test Node and Chromium before merging; verify Pages publication and D1 separately.

## 0.636.0 — 2026.11.11.636 · Controlled production D1 CAS acceptance with two independent temporary admin sessions and verified cleanup

- Controlled production D1 CAS acceptance with two independent temporary admin sessions and verified cleanup.
- No user-build data or game-catalog edits; temporary QA D1 records only.
- Actual production QA execution requires a successful postmerge workflow run; do not infer success from unit tests.

## 0.635.0 — 2026.11.11.635 · Saved-build card layout, centered disclosure arrows, softer text-field focus and clearer D1/GitHub admin tools

- Saved-build card layout, centered disclosure arrows, softer text-field focus and clearer D1/GitHub admin tools.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.634.0 — 2026.11.11.634 · Fresh equipment copies, zero-import account gate, empty-slot menu and Yandex search hints

- Unequip or replace removes all customization owned by the prior equipped copy: Souls, refinement, element/gem, and selected Soul-slot capacity. Re-equipping the same catalog item begins fresh; other worn items remain unchanged.
- All empty portrait equipment slots offer one right-click action «Выбрать вещь / Choose item» opening the normal equipment picker. Previously equipped slots retain all four context-menu actions.
- Removed the old guest-saved-build import UI and registration's guest-library key/carry path. Guests still see only Sign in/Register in My Builds; the currently edited character is preserved across login and registration as an **unsaved** draft, with a save suggestion only when no account work exists. No implicit build uploads.
- Ordinary gameplay and editor searches now send Yandex-recommended best-effort `autocomplete="none"` plus existing no-login markers. Genuine account username/password fields retain browser credential semantics; text entry remains direct and editable.
- Node/Chromium contracts cover no legacy import, no guest-key submission, draft continuity, empty slots and fresh item customization. Production D1 writes remain out of scope without explicit approval.

## 0.633.0 — 2026.11.11.633 · Equipped-item context menu and targeted browser debugging without reducing PR coverage

- Right-click equipped item rails for a compact, themed, viewport-clamped context menu: Properties, Manage Souls, Choose another item, Unequip item. The special armor-and-pants projection resolves its actual owning slot for item actions; choosing pants still replaces the outfit using the existing picker.
- Keyboard ContextMenu/Shift+F10, Arrow keys, Home/End, Escape and outside click to dismiss; no custom menu on empty slots. If a piece has no active Soul socket, the Soul action is disabled with a concise explanation.
- Removal now shares the exact same equipment/soul preservation logic between the existing picker and the shortcut menu. Context captions use D1 editable RU/EN owner copy keys `book.equipment.context.*`.
- Added a focused Chromium scenario plus Node contracts and repeatable manual-only single-scenario CI support; all PR code changes still require full browser acceptance.
- Browser acceptance and deployed Pages state must be verified separately. No production D1 writes were performed.

## 0.632.0 — 2026.11.11.632 · Full-width D1 editing for long equipment property names without changing values

- While an owner edits a narrow equipment stat label, the active inline text field uses the whole stats grid width and the associated numeric value moves below; after save or Escape, the original compact two-column layout returns.
- All other labels and player-facing properties remain visually unchanged. No new admin modal or D1 schema field.
- The shared inline owner editor now stops Escape/Enter keyboard events from also activating document-level panel shortcuts: Escape cancels the edit without closing the equipped-item picker.
- Added focused CSS and keyboard contracts and a real Chromium owner flow: mobile long-draft visibility, Escape without writes, RU and EN override saves through mocked CAS Worker, and Undo of EN without changing RU or the equipped Soul count.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.631.0 — 2026.11.11.631 · Soul slots status: calm partial/full occupancy colors with accessible RU/EN labels

- Equipment Properties label is now **«Слоты душ» / «Soul slots»**, reusing existing owner-editable D1 key `book.equipment.field.slots`.
- Keep compact `0/2` / `1/2` / `2/2` presentation; only the used numerator gets subtle amber when partly filled and muted green when full. Empty capacity and zero occupancy remain neutral, without badges or added rows.
- Screen readers receive current locale occupancy description through `aria-label`; selected physical item capacity, saved Soul contents and game calculations are unchanged.
- Expanded Node/Chromium tests for actual rendered states, hue distinction, accessible names, and zero-socket behavior.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.630.0 — 2026.11.11.630 · One Slots row shows active Souls / available sockets, or 0 when none

- Equipped item Properties now display a single `Слоты / Slots` stat: `0/2`, `1/2`, `2/2` (used/available). Zero capacity stays `0`, never `0/0`.
- Removed the redundant standalone `Вставлено душ / Socketed Souls` stat row. Existing inline RU/EN `field.slots` editor remains intact.
- Counts reflect actually active sockets, not saved inactive overflow; no Soul, equipment, or game data are changed.
- Preview of not-yet-equipped items retains the original plain catalog slot count. Added RU/EN Node and Chromium regressions.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.629.0 — 2026.11.11.629 · Honor owner-form RU/EN accessibility and safe missing-war copy

- Honor's owner-only PvP-war creation form uses the active UI locale for its Russian-name and English-name input labels, without changing the submitted RU/EN record fields.
- Delete buttons describe the actual visible record name, including EN and linked location names, rather than always saying the Russian name.
- Missing-war public message uses the existing owner inline RU/EN D1 editor, with touch pencil only in authorized edit mode.
- Added focused regressions; rank counts, wars and real game data are unchanged.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.628.0 — 2026.11.11.628 · Active Soul counts and live RU/EN search-placeholder synchronization

- Equipment properties display active Souls in the current item's accessible sockets; saved overflow Souls remain preserved.
- Inline D1 save and Undo refresh the Souls search placeholder in place without clearing the user's search or re-rendering its list.
- Added a real-browser saved-two-Souls recovery regression and focused Node contracts.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.627.0 — 2026.11.11.627 · Profile author-copy locale stability

- Администраторские текстовые подписи «Персонаж / Профиль» фиксируют RU или EN при открытии редактора. Если интерфейс переключён до сохранения, исходный язык правки не подменяется другой колонкой D1.
- Закрытие, отмена и успешное сохранение обновляют только открытые авторские подписи и их кнопки ✎, а также доступные названия/placeholder соответствующих полей. Не выполняется полная перерисовка профиля.
- Имя игрока, гильдия, нация, ранг, биография и другие пользовательские данные остаются без изменений и не переходят в редактор D1. Тест подтверждает адресацию editLang и обновление без ремоунта.
- Базовый редактор длинных текстов 0.626.0 используется без дополнительных несовместимых контролов.

## 0.626.0 — 2026.11.11.626 · Unified readable owner editing and RU/EN safety

- Общие текстовые поля администратора теперь используют единый расширяющийся plaintext-редактор: длинные надписи и описания переносятся, не обрезаются однострочным overflow-hidden; поиск остаётся однострочным.
- Поле увеличивается по высоте вместе с вводом; в уведомлении длинный текст доступен через прокрутку при нехватке высоты экрана. На малых экранах редактор не выходит за границы области контента.
- Статические RU/EN-подписи, placeholder и доступные названия фиксируют язык при открытии редактора. Сохранение после переключения языка не перезаписывает другую колонку D1; кнопка ✎ обновляет свой aria-label при смене локали.
- После закрытия редактора восстанавливается только затронутое поле, а не локализуется повторно весь сайт (это сохраняет другие открытые поля ввода).
- Проверки: Node-контракты единого поля и RU/EN-адресации; Chromium-проверка длинного текста на мобильной ширине, сохранения и Undo в mocked D1. Production D1 не изменяется.

## 0.625.0 — 2026.11.11.625 · Origin locale capture and D1 Undo without remount

- Любая правка подписи «Происхождения» фиксирует RU/EN на момент открытия редактора; переключение языка до завершения не может направить текст в неправильную колонку D1. Доступное имя админской кнопки ✎ синхронизируется.
- Undo и «Вернуть оригинал» для безопасных авторских подписей Origin обновляют только текущие DOM-надписи, не перестраивают персонажа, выбранную расу, вводимые значения или пользовательские билды. Активный редактор не затирается.
- Node-контракт проверяет замороженный язык и изоляцию Undo; Chromium проверяет сохранение DOM-кнопки выбора расы и точный возврат EN-подписи после D1 Undo.
- Рабочая production D1 не изменяется этим PR, игровые расчёты и каталоги нетронуты.

## 0.624.0 — 2026.11.11.624 · Touch-accessible Hero Path help labels

- Все авторские подписи Пути героя, карточек умений, описаний и безопасных состояний получают настоящую независимую кнопку ✎ только у администратора; обычный игрок видит те же тексты без кнопок и служебных ключей. Числовые значения в dd и игровое содержимое не меняются.
- RU/EN-статусы «Описание умения отсутствует» и «Условия выполнены» получили отдельные D1-ключи. Названия и описания из игрового каталога, требования и причины блокировки не становятся авторскими надписями.
- Сохранение, Undo, F2, Escape и сенсорное редактирование используют прежний проверенный D1 CAS. Доступное название карандаша обновляется на месте.
- Node-контракт и целевые браузерные проверки администратора/гостя включены в обычные PR CI.

## 0.623.0 — 2026.11.11.623 · Inline skill reset and bilingual Origin polish

- Нативное RU-only confirm для сброса Пути героя заменено компактным подтверждением внутри страницы. Отмена / Esc не меняют персонажа, подтверждение сбрасывает только вложенные очки навыков и зелёное мастерство; экипировка и прочие настройки не затрагиваются.
- Пояснение подтверждения имеет самостоятельный RU/EN D1-ключ `guideedit.book.path.reset-confirm-help`, с редактированием на месте и Undo. Контролы остаются самостоятельными кнопками.
- Исправлены английские пояснения выбора пола/варианта портрета для всех шести рас и перевод состояния загрузки карточки предмета без изменения данных.
- В существующем Chromium сценарии добавлена компактная проверка отмены и подтверждения при реально вложенных очках. Node-контракты проверяют отсутствие системного confirm, сохранность игровых веток и RU/EN.

## 0.622.0 — 2026.11.11.622 · Independent Hero Book and Hero Path tab editors

- В админском интерфейсе Книги героя шесть кнопок ✎ вынесены из вкладок в соседние нативные кнопки; роль tab и связи с tabpanel остаются на игровых вкладках.
- В Пути героя две кнопки ✎ также вынесены в соседние элементы, без пересоздания исходных кнопок и их обработчиков. Выход из режима владельца возвращает стандартную разметку; вкладки не переключаются от редактирования.
- При записи RU/EN подписи Пути героя фиксируется язык в момент открытия редактора; сохранение не записывает текст в неверную колонку D1. Активное текстовое поле не удаляется обычным повторным вызовом рендера вкладок.
- Компактная стилизация сохраняет обычную двух- и шестиколоночную раскладку. Node и узкие Chromium-проверки включены в штатные CI; игровые формулы не меняются.

## 0.621.0 — 2026.11.11.621 · Independent equipment editing and skill counts

- Админские кнопки ✎ у вкладок экипировки, физических/магических и стихийных вариантов кузницы и поиска душ перестали быть вложенными интерактивными элементами игровых кнопок. Игровое действие и редактирование D1 теперь независимые соседние кнопки с нативной клавиатурой.
- Выбор и работа кузницы сохраняют исходные игровые селекторы и значения, 11 позиций заточки в одной строке, радуга занимает два столбца; неавторизованный пользователь видит прежнюю разметку.
- Исправлена локализация запасного названия слота и доступной подписи закрытия окна экипировки.
- Счётчик навыков использует корректные формы «1 умение», «2 умения», «5 умений» и английские «1 skill» / «2 skills» без изменения фильтрации навыков и игровых правил.
- Добавлены целевые Node-регрессии; релиз проверяется обычным CI Node + Chromium. Production D1 не изменяется.
