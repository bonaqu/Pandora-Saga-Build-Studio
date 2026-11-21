# #390 — Editorial RU/EN completion matrix · 21.11.2026

**Источник:** фактические исходники Pandora Saga Build Studio после squash PR #803 и изменения draft PR #809. Цель — завершать функционал пакетами, не подменять требования подсчётом коммитов.

## Единый UX-контракт
Владелец: двойной клик по видимой надписи → прямое редактирование; blur → D1 CAS; Escape → отмена; F2 → клавиатура. Отдельный карандаш допустим **только у настоящего авторского hover-пояснения**. Числовые результаты, названия предметов/аккаунтов, игровые ID, пользовательские данные и ответы Worker остаются вне редактора. Обычный пользователь не получает редакторские инструменты.

## Сверенная матрица

| Поверхность | На 21.11.2026 | Дальнейшая приёмка |
| --- | --- | --- |
| Общие подписи / Происхождение / Путь героя / кнопки | Режим direct-edit внедрён в merged #803; #809 отдельно исправляет «Начально (оч.)» и «Лимит (оч.)» — редактируемая подпись + защищённое числовое значение, с F2/aria-поддержкой | Проверка реального CAS, клавиатуры и неизменности очков после перерасчётов |
| Честь / PvP / навигация | В #809 статические RU/EN-подписи PvP-таблиц (13 ключей), 5 существующих wiki.labels на боковых ссылках, отдельные количество разделов и числовые награды | Проверить owner dblclick + F2, смену языка, Undo и сохранность скролла/ссылок после CAS |
| Книга героя | Основной реестр авторских подписей уже есть; PR #809 добавляет 9 точно локализованных статических строк и отделяет числа мастерства, шанс и счётчики от D1 | Node + Chromium RU/EN, сохранение открытых вкладок и пользовательского билда |
| Энциклопедия / игровые пояснения умений | Патчноуты с сигнатурами уже редактируются; PR #809 расширяет на доказанные статические пояснения poison, hymn, trap, composite, linked | Проверка source signature, D1 CAS, отсутствие editing у вычисленных заметок |
| Экипировка / души | Специальный owner-copy registry уже работает (merged #803) | Дополнительный аудит динамических и служебных подписей по настоящему рендеру |
| Библиотека билдов / сравнение | Семантические редакторы и браузерные RU/EN тесты присутствуют | Проверить все редкие состояния после редактирования и Undo, не менять введённые имена |
| Аккаунт / профиль / уведомления | Стабильный `literalKey`, статусные проверки и гостевая изоляция уже работают | Аудит новых безопасных текстов; никогда не редактировать пароли, сообщения API и резервные коды |
| Админ-панель / помощь | Дублирующие карандаши удалены (#803) | Контроль присутствия карандашей только у hover-подсказок, клавиатура и 390px |

## Не путать с готовой миграцией
Текущая Cloudflare D1 хранит опубликованные авторские **overrides**; fallback текста остаётся в versioned code/catalog. Загрузка **всех** стандартных строк в D1 потребует отдельного проекта с версионированием, миграцией, откатом и гарантиями несовместимых ревизий. Пока это не выполнено, не объявлять её готовой.

## Условия завершения
- Полный аудит реального отображаемого RU/EN текста; безопасный статический контент покрыт, намеренно исключённый объяснён.
- Не регрессируют Blur/Esc/F2, сохранение D1 CAS, 409/draft/Undo, режим гостя, кнопки и сенсорные устройства.
- Node и **настоящий Chromium** зелёные на одном head SHA draft PR #809.
- При завершении PR — публикация Pages и **read-only** проверка Worker/D1; никаких ручных изменений production D1.
- #390 не закрывать, пока оставшийся scope действительно не принят.

## Добавленная приёмка в PR #809 · следующий пакет

- `tests/honor-ui-editorial-616.test.mjs`: новые PvP-заголовки и колонки имеют стабильные bilingual D1-ключи, числовые награды и счётчик разделов не включены в авторский текст
- `tests/browser-ui-content-inline.mjs`: сохранение текста таблицы и левого меню через реальный Chromium с мокированным Worker CAS; двойной клик не открывает другую главу
- `tests/hero-path-locale.test.mjs` и `tests/browser-owner-racial-path-648.mjs`: отдельные подписи/числа на дорожках умений, D1-проверка и сохранение предела профессии
- Полные Node и Chromium должны быть **зелёными на одном последнем SHA**; старые успешные прогоны нельзя выдавать за проверку новых изменений

## Follow-up after restored #809 CI · Honor generated rank requirements

- The previous head `531480b1f63c4645e8ae04cfe2d6465b6b6f192e` completed **both** Node ([run 44850076815](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44850076815)) and Chromium ([run 44850077022](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44850077022)) successfully. This does **not** validate the newer changes until their own checks finish.
- Audited the actual Honor rank renderer: generated fallback requirements had been passed to a whole-paragraph editor, so an owner could unknowingly replace live numerical Total Honor, gold and monthly rank thresholds while translating static prose.
- The generated text is now split into seven stable RU/EN D1 fragments; runtime values are independent read-only nodes. No caption pencil is added. Source-authored or previously overridden `honor.rank.*.requirementRu/En` remains on its original D1 path without destructive migration.
- Added Node validation for the new D1 keys and no generated whole-paragraph editor, plus a real Chromium RU/EN CAS scenario protecting rank thresholds and F2/double-click behavior.
- **Still open:** 409/Undo across new fragments, broad guest and mobile UX, remaining dynamic editorial strings and whether physical storage of all defaults in D1 is in scope. Do not mark #390 or PR #809 complete on account of this targeted fix.

## Second continuation packet · exact Book notes and abandoned Honor chrome

- [x] Previous `68af443f35dfcbc2b337e5a4a8793508649261bf`: full [Node](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44855588375) and [Chromium](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44855588276) succeeded.
- [x] Four additional existing, authored, nonnumeric Hero Book notes are registered with exact RU/EN semantic defaults. Rendered static note nodes therefore reuse shared direct-dblclick D1/CAS; dynamic numeric skill results and item names are excluded.
- [x] Defense status-source breakdown disclosure has a separate `defense.caption.sources` key rather than making the numerical/source rows editable.
- [x] Removed abandoned Honor caption-pencil CSS, whitespace and obsolete attribute updater; the rank requirement and benefit grid owners remain intact.
- [x] Expanded regression checks for default Book keys, archived authored rank requirements, 409 draft survival and Undo preserving runtime rank threshold numbers.
- [ ] This packet requires new same-SHA CI. Do not use the successful preceding SHA as evidence for its content.

## Third continuation packet · plain-caption touch and stale pencil state

- [x] The preceding SHA `25d0e67df00696913e33450abde8ff6cfb6feb97` passed [Node](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44856207648) and [Chromium](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44856207639).
- [x] Plain, **non-interactive** owner-only labels support delegated touch long-press (~460ms), reusing exact double-click/D1/CAS editor; moving a finger to scroll or releasing early cancels. No additional per-label listeners or UI pencils. True buttons, links, labels and disclosure summaries remain excluded to protect single taps.
- [x] Removed obsolete `ownerCopyPencil` branches across core app, account and update manager, retaining only current direct-caption and independent hover-hint flows. Eliminated an unnecessary second append of each Hero Book result tile.
- [x] Added Chromium synthetic touch-pointer scenarios at narrow viewport, Book guide, Honor numeric requirement, and account draft. This tests the delegated handler in real Chromium; a physical touchscreen/real OS gesture is still a distinct acceptance step.
- [ ] This third packet requires Node + Chromium on its own head SHA. Guest permissions and interactive-control touch behavior still need full independent acceptance; no closure of #390.
