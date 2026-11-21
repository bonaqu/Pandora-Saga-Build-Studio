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

## CI repair after third packet

- SHA `04d9e1d88fa044d2f90fe64557960be58eb48a1b`: [Chromium #44856815386](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44856815386) passed with the added touch-pointer scenarios.
- [Node #44856815374](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44856815374) ran 3304 tests: 3302 passed, 1 TODO, 1 failure in `tests/library-inline-copy.test.mjs`. This was a stale assertion demanding the removed `button:not(.account-copy-pencil)` selector; the current code rightly focuses the real first button. Updated the assertion to require the live direct button focus and **absence** of obsolete pencil code. The earlier code was not restored.
- Cleaned the unreferenced local variable in Chromium touch acceptance. The repair commit must receive a fresh Node + Chromium on the same SHA; the preceding Chromium success is only evidence for the preceding revision.

## Fourth continuation packet · real touch edge-case protection

- [x] Head `2dabe3c3d5ed9ac38650d3367c2cdb671b8c064a` passed [Node 44857304880](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44857304880) and [Chromium 44857304908](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44857304908).
- [x] Fixed the nested-button long-press gap: controls nested inside a caption cannot trigger an editor on the parent. Added pointer cancellation on a scrolling container/window event and suppression of native context menus arriving **after** the editor opened.
- [x] Extended actual Chromium synthetic pointer coverage at 390px for nested actions, scroll cancellation, movement cancellation and context-menu suppression. Existing full owner RU/EN/CAS scenarios remain enabled.
- [ ] This touch-hardening packet requires Node + real Chromium on its own new SHA. Physical mobile hardware/OS gestures remain unverified, and owner controls inside buttons/summary still intentionally excluded.

## Recovered follow-up · Chromium regression on 9673901 (21.11.2026)

- [x] GitHub Actions [Node #44857829405](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44857829405) succeeded; [Chromium #44857829381](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44857829381) failed **only** the UI-content-inline account touch caption check (account editor host not visible before 6s). The preceding SHA `2dabe3c` had both checks green.
- [x] Removed overly broad **global scroll-event cancellation** introduced in `9673901`; an unrelated scroll while opening a popover or focusing an input must not kill the hold gesture. Native touch panning cancels via `pointercancel`, movement and multi-pointer checks remain explicit.
- [x] Added multi-touch/pinch cancellation and pointer identity tracking. Chromium tests now cover actual `pointercancel`, movement, second-finger cancellation, and an unrelated document scroll followed by account caption long press. No extra pencil was reintroduced.
- [ ] Confirm full Node+Chromium on a new SHA; hardware and interactive controls are still not fully accepted. Keep PR #809 Draft and #390 open.

## Next packet · interactive-caption touch parity

- [x] Head `10f2c11c84e091c5af1664647db2a633db2fe835` passed [Node](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44859899066) and [real Chromium](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44859899062): no longer loses the account touch editor on unrelated scroll.
- [x] Registered *explicit D1-owned* captions inside buttons, links, tab buttons and native disclosure summaries for the same owner long-press editor, without reintroducing caption pencils. Plain guest text and game numbers are unaffected. The target's nearest real action must match the registered caption action, preventing nested-button accidental edits.
- [x] Once the editor opens, a delayed synthesized click/contextmenu on the *enclosing action* is suppressed. Short clicks still navigate/activate normally. An unrelated mouse pointermove on a hybrid laptop cannot cancel a held touch; stale gesture DOM references are released after timeout.
- [x] Chromium adds Chapter tab navigation/no-navigation, native summary no-toggle and login action no-submit tests, alongside the existing account/Book/Honor CAS, 409, Undo and touch coverage.
- [ ] This packet needs green full Node + Chromium at its own SHA. Physical mobile validation, disabled interactive native controls and physical D1 defaults remain separately open under #390.
