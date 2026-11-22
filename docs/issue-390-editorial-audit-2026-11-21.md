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

## Recovery after Chromium failure on 7522be2 · detached Book tab registration

- [x] [Node #44860534228](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44860534228) passed, but [Chromium #44860534243](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44860534243) failed the new Hero Book tab long-press case waiting for a contenteditable after 6 seconds.
- [x] Root cause from code: Hero Book registers a caption with the touch helper **before** inserting it into its tab button. The helper cached its nearest action at bind time as null, then rejected the valid touch when the caption had been mounted inside a button.
- [x] The centralized helper now stores only the editor callback and whether an interactive ancestor is allowed. At pointerdown time it resolves the current button/link/summary ancestry after mount, rejects nested foreign actions, and uses the real ancestor to suppress the delayed click.
- [x] The existing Book tab Chromium case exercises exactly this detached registration and ensures no unintended navigation. Full Node/Chromium must rerun on the repair SHA; PR and issue remain open.

## Follow-up · HTML labels and hybrid input

- [x] Previous head `c02e7187a831be16c2040d80cda9e26c32d40b8b` passed [Node](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44860923568) and [real Chromium](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44860923580).
- [x] Added owner-only long-press for explicitly registered authorial HTML label captions, including the real mounted toggle in Hero Book. A label containing native inputs stays ineligible for destructive replacement.
- [x] The editor suppresses a synthetic touch click, so it cannot change the character setting. Short clicks must still toggle the associated checkbox; Chromium verifies both and restores the original state.
- [x] An unrelated mouse pointermove or pointerup on a hybrid touchscreen PC cannot cancel a held touch. Only touch pointercancel/release with matching pointerId cancels; Chromium exercises these cases.
- [x] Updated 0.947.0 changelog, release notes and roadmap to describe real RU/EN, Honor numeric safety and touch work. No version bump, game formulas, Worker or production D1 changes.
- [ ] This packet requires full same-SHA Node/Chromium, physical hardware acceptance is still unknown; #390 and PR #809 remain open.

## Catalog synchronization success copy · remaining #390 admin gap

- [x] The root ROADMAP was compacted after [Node run 44861414647](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44861414647) failed only the existing under-7000-character contract. No history is discarded: detailed #390 acceptance stays here and the roadmap archive remains linked.
- [x] The corresponding [Chromium run 44861414634](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/44861414634) passed the physical-label and hybrid-pointer synthetic browser scenarios on `e3ad6afe`.
- [x] Four **verified success-only** catalog workbench statuses now use the existing `editorialState(status,...)` D1 direct-editor with separate RU/EN: downloadable snapshot, test-write readback/cleanup, CAS stale-edit rejection and no-op GitHub sync.
- [x] Raw network errors, source dataset IDs, authentication diagnostics, operational warnings and game records remain separate from authorial overrides. Added Node validation of new keys and real Chromium owner blur/save on a confirmed workbench success without modifying the game catalog.
- [ ] Recheck full Node/Chromium on the new SHA, and continue broader #390 acceptance; do not merge or close draft PR.

## Administrator safety copy · RU/EN without editing sensitive workflow decisions

- [x] Localized the native confirmation dialogs for write/readback check, CAS conflict check, and creation of a GitHub PR from the published catalog. These prompts remain immutable security workflow instructions; they do not become D1 fields.
- [x] Localized export/publish failure prefixes, progress surrounding live counts, the GitHub PR success link and its accessible label, while preserving all original dynamic values, errors and operational steps.
- [x] Existing workbench Chromium confirms the same verified D1 workflow and PR link without action behavior changes; Node regression covers both language literals, edit/non-edit boundaries and native confirmation presence.
- [ ] The source-error reason codes and complex publish impact confirmations still require a separate audit; do not mistake these translations for a completed #390. New SHA must pass full Node and Chromium.

## Continuation · source error details & publish parity (21.11.2026)

- [x] Fixed RU/EN reasons for source unavailability (401/403, 404, 429, timeout, network, invalid JSON, over-limit response). Exact HTTP, Worker reason, dataset name and raw technical response are shown separately, not owner-editable.
- [x] Fixed D1 source and snapshot mismatch messages. Sensitive publication-failure guidance is localized without masking original Worker errors or allowing direct editing.
- [x] Replaced diverging RU/EN publication confirmations with a single builder. Both languages now preserve calculated chance samples and caveats, manual-review flags, mechanic compatibility examples, atomic formula-table risks, source/archived provenance and accurate dynamic counters.
- [x] Verified unselected gameplay (`!service`) vs unselected settings (`service`) were already counted correctly; these predicates were left unchanged.
- [x] Added Node source/boundary checks and actual Chromium EN flow: failed source, Worker diagnostics, archived comparison, English publication confirmation dismissal, no D1 mutation, and return to RU.
- [ ] Complete Node and Chromium are required on the final same SHA; no physical touchscreen or production D1 acceptance was performed. PR #809 stays draft, issue #390 open.

## Prepared follow-on · fail-closed model checks in both languages

- Preserve the existing `safety.check`, `replaySkills`, graph, equipment and target guards; translate only static explanatory prefixes and known module labels. Return raw model issues, dynamic identifiers and counts unchanged.
- Make final read-only verification of every published D1 dataset bilingual, while retaining the pinned snapshot equality, per-dataset strict data equality, second meta read and hero base safety check. Existing callers of the four-argument helper remain backward-compatible; the owner calls it with the current locale.
- Add actual Node execution tests for English D1 provenance failure, content mismatch and base calculation failure. Those tests must still verify the complete 17-dataset audit and meta read twice.
- This batch is independent of changing D1 records or reaching the live game. It requires its own Node + Chromium acceptance after commit.

## Follow-up · bilingual calculated loot previews (staged; requires CI)

- The drop chance model and `before`/`after` numeric arrays are unchanged. The published Russian `preview` remains byte-for-byte the same.
- Added `previewEn` for English solo/4-player/8-player estimated probabilities, formatted with English decimal punctuation but sourced from the same independently modeled odds.
- Both review rows and final publication confirmation select a locale-matched projection, preserving real game-source map, monster and item names without inventing translations or mechanics.
- Added Node tests for bilingual preview values and both workbench output paths. The batch still requires same-SHA full Node+Chromium acceptance.

## Path metrics and rail caption: separate editable labels from game data (21.11.2026)

- The expanded skill-rail summary previously combined the shared `skillsOnTrack` label and the calculated number in one uneditable DOM text. Its authorial label is now a direct dblclick/F2/long-press D1/CAS caption, with a separate immutable count node.
- Previously saved `PandoraUILocale.skillsOnTrack` RU/EN overrides remain valid defaults for the new Path-specific editor. The new key changes only that particular rail caption; there is no global-key migration or reset.
- Existing `pathGroupTrained/Learned/Invested` and `pathReq*` authorial captions were previously editable only in the owner panel. Now the visible captions themselves reuse the exact same existing D1 keys, while punctuation and all calculated metrics remain separate nodes. No new pencils or duplicated edit keys.
- A delegated guard distinguishes the owner double-click from an ordinary click on group headings or disclosure summaries; guest navigation and source skills remain unchanged.
- `tests/hero-path-locale.test.mjs` covers the structural copy-versus-number contract. `tests/browser-owner-racial-path-648.mjs` adds actual EN inline blur→D1 CAS on the group and rail captions, preserves live group totals, the count and disclosure expansion. Check the final same-SHA Node/Chromium workflow before marking this slice accepted.
- Remaining #390 blockers are unchanged: comprehensive dynamic-text audit, independent physical touchscreen acceptance, safe versioned physical D1 defaults migration, and read-only production acceptance only after an approved release. PR stays Draft.

## Bilingual source-review summaries (staged, requires CI)

- Source-human-review keeps its existing Russian `summary`/`caution` and adds conservative `summaryEn`/`cautionEn` where semantics are verified: catalog checksum metadata, monster drops, quest records, translations, item-reference changes, source text mismatch and atomic formula/loot updates.
- Unknown raw fields and complex ambiguous descriptions are not guessed or turned into D1-editable text: a missing safe English summary falls back to the source-derived review rather than silently dropping evidence.
- Workbench uses safe available English messages in review and publication preview; the search index includes bilingual summaries for finding related changes.
- Unit regressions assert English and original Russian meanings and unchanged source-model `uncertain` classification and approval gates. Same-SHA Node+Chromium are required.
- Touch owner gesture: unrelated clicks no longer consume the synthetic-action suppression of a long-pressed caption. The independent Chromium flow explicitly tests a normal unrelated click followed by an ignored delayed tab action.
- Gear menu locale readiness: the EN smoke checks the actual belt's localized accessible name before opening a transient native menu, rather than relying only on `documentElement.lang`.


## Continuation: multiple captions and skill-attack-range prose · 21.11.2026

- Native Hero Book `summary` elements can contain **more than one distinct source-authored RU/EN caption** (e.g., Honor + its passive-skill annotation). `guardBookSummaryCaption` now registers all targets under one WeakMap-backed guard, protecting dblclick/edit of either caption without blocking short native disclosure activation, while retaining one listener. The shared generic button/summary guard likewise accepts multiple explicitly registered captions per action.
- `appendItemEvents` separates the preexisting D1 authorial summary label from the runtime trigger count; original UI copy keys remain intact. Neither gameplay trigger IDs nor source equipment names become editable.
- Skill-use attack range preview now separates **seven known bilingual authorial fragments** (bonus, source, direction, mastery, two activation contexts, ready state) from all source-backed bonuses, official skill names, class/branch labels, and unknown denial reasons. These use scoped `book.attack.skillRange.*` CAS keys and the standard direct dblclick/F2/touch editor, without caption pencils. Unverified source reasons remain plain read-only text.
- Tests retain full Node + real Chromium browser coverage, plus an isolated two-locale rendering fixture: RU/EN editorial editor entry, identical `+42/+20/+22` source values, stable source skill name, preserved gated reason, no D1 writes. Separate browser checks edit **both** Honor captions inside one native summary while confirming unchanged disclosure state and ordinary click behavior.
- **CI acceptance requires both full workflows on the exact last PR head**; intermediate successful or failed older SHAs are not proof of a newer commit. Do not merge or close this Draft PR or #390.
- **Heuristic remaining ≈50%**, not measured by source lines. Still blocked: exhaustive rare dynamic-authorial coverage, physical touch acceptance, safe versioned storage of defaults in production D1, and read-only production verification after an approved release. No production D1 writes in this packet.

## Продолжение · версионированные дефолтные тексты D1 и PvP label CAS · 21.11.2026

- [x] Найдено фактическое расхождение между `PandoraHonorGuide.validOverride('wiki.labels')`, `PandoraWikiLabels` и `worker/index.js`: `honor_victories_{ru,en}` мог сохраняться, но не отображаться из D1, а общий Wiki-парсер мог отклонять остальные записи этого же patch. Все три уровня выровнены, включая регистрацию раздела в видимом RU/EN-словаре. Дополнительно Worker отвергал все восемь RU/EN-описаний PvP-события в `honor.overview`. Валидаторы выровнены, добавлена исчерпывающая Node-проверка исходных полей обеих схем и Chromium RU/EN CAS с защитой наград и навигации.
- [x] Реализован **только офлайн-планировщик**, вычисляющий детерминированный SHA-256-снимок проверяемого подмножества авторских D1 defaults, включая полный реестр `PandoraWikiLabels` (`chapter`, `honor`, `skillFilter`), а также неизменяемую SQL-заготовку. Схема и контрольные суммы описаны в [плане миграции](issue-390-d1-defaults-staged-migration.md). Скрипт и тесты исключают изменение действующих `overrides` и production D1.
- [ ] Физическая D1 миграция по-прежнему **не выполнена**: источник некоторых динамических надписей пока не инвентаризирован. В код Draft Worker добавлено необязательное проверяемое чтение точной версии из D1, строго выключенное без флага `EDITORIAL_DEFAULTS_PREVIEW=enabled`; без флага не выполняется даже D1 SELECT. Endpoint не развёрнут, нет staging/production импортов, клиент не активирован и rollback не отрепетирован.
- [ ] Аппаратная touch-проверка на реальных устройствах и полная RU/EN-инвентаризация не завершены.
- [ ] Новый пакет требует *полного* Node + Chromium SUCCESS на одном HEAD SHA; статус промежуточных коммитов не заменяет финальный.
- **Осталось приблизительно 50% общей #390** по совокупности критериев приёмки, а не по строкам кода. PR #809 — OPEN DRAFT, #390 — OPEN. Никакого merge или изменения Pages/Worker/production D1.

## Checkpoint: generic labels are direct-edit only; mirrored browser titles are not hints

- A fixed `data-i18n` caption is edited in place through double click; non-interactive captions also support owner Enter/F2, and interactive actions retain their native Enter behavior (F2 remains available for editing). Existing blur/CAS/Escape/Undo is retained.
- Owner-only tabindex/aria-keyshortcuts are cleaned up on exit; existing author-defined keyboard semantics are preserved.
- A `data-i18n-title` such as the profile trigger's `profileAccess` simply mirrors its accessible name. It does not create an independent authorial hover hint or a caption pencil. RU/EN title+ARIA still refresh together through `PandoraUILocale.apply`. The site-specific true independent tooltip editors are untouched.
- Length validation is now based on `PandoraUILocale.copyLimit(key)` instead of a blanket 90-character cap, preserving safety for each key.
- Added Node source contract assertions and Chromium owner login/guest/EN/Escape keyboard tests. Physical touch QA is still open.

## Checkpoint: Wiki authored-copy Save and Undo without reloading records

- Source-only `guideedit.book.wiki.map.text.*`, `wiki.monster.text.*`, `wiki.npc.trade.*`, `wiki.chest.text.*`, `wiki.item.text.*` now have an explicit, narrow authorial key matcher. The same matcher is used on successful CAS save, mounted-field refresh and Undo.
- Editing or Undoing an authorial caption no longer calls `refreshOwnerCatalog()` as if a monster stat, item ID, NPC trade or loot had changed. The existing card, browser list, search, scroll, inline editors and real gameplay values remain mounted. Gameplay `wikiedit.*` keys still use the full catalog refresh as required.
- Added Node contracts and a Chromium RU CAS/Undo scenario on an actual selected Wiki map caption, asserting stable DOM node identity, selected map and browse scroll, verified D1 reset. This is mock D1, not production/staging import.

## Checkpoint: icon-only accessible copy stays editable without a false pencil

- `#profileTrigger` has no visible caption; the `title` mirrors its same-key `aria-label`, not a separate authorial hover guide. Owner-mode keyboard F2 opens the ordinary inline editor for `ui.label.profile-access`; Enter/Space/click retain their normal account action. No pencil appears.
- Save, Escape, cross-language fallback and validation reuse the original `book.ui.label.profile-access` D1 CAS key and `PandoraUILocale.copyLimit`; only this icon's title/ARIA are refreshed at editor close without remounting the account form. Nonowners do not receive the F2 shortcut. Browser regression covers F2, blur-save, Escape/no-write, mirrored title/ARIA and absence of pencils.

## #390 directly editable static Wiki section headings

- Audited five Wiki owner-copy families now mount a direct dblclick/F2 editor on their **visible plain H4 heading** (map/dungeon, monster, NPC trade, chest, item). This reuses the exact original CAS key and inline blur/Escape/Undo semantics. No additional pencil or owner panel is required to edit the displayed heading.
- Only a leaf H4 with no prefix/suffix, dynamic child, or active interactive control receives the editor. Runtime counts, probabilities, IDs, Soul data, inputs, options, action buttons, and other chapter data remain outside this direct edit path.
- Added Node assertions for the narrow binding and a real Chromium Save/Undo on a mounted Wiki map heading with unchanged DOM identity; synthetic test never writes real D1. Physical touch testing remains separate.

## #390 removal of abandoned generic/label pencils

Legacy CSS for the non-rendered `.ui-content-pencil` and `.wiki-label-pencil` has been removed, including obsolete source label-pen ARIA updates. Real independent `.wiki-hint-pencil` controls retain keyboard/touch focus styling; direct caption editing and in-place host CSS remain intact. This reduces unnecessary layout reservations without altering item/game values.

## #390 owner-only keyboard affordance cleanup on account and library copy

The generic account/library text editor now tracks `tabindex` and `aria-keyshortcuts` attributes that it adds. Reopening owner editing restores F2 without duplicate listeners; leaving owner mode removes only those owner-added attributes while retaining authored/native tabindex values. This does not touch passwords, account state, player names, CAS values, or action semantics. Added Node and Chromium source/mounted-account assertions. Hardware touchscreen testing remains outstanding.

## Checkpoint: only mounted, meaningful Workbench hover help is editable

The owner Workbench help editor previously displayed five copy entries for self-explanatory Origin/Path tabs whose hover descriptions are explicitly suppressed in the real renderer. The panel now filters those phantom fields by the existing `SELF_EXPLANATORY_TABS` allowlist, omits the empty Origin hint panel, and retains only four mounted equipment hints and the actual Path Reset hint. Existing unused overrides are **not** deleted or rewritten; direct-edit captions and game controls remain untouched. The staging manifest now includes the exact ten RU/EN defaults for those five real hover hints, with source-drift checks and mock Chromium Save→Undo verifying the mounted portrait tooltip updates and rolls back without affecting game data.

## Follow-up: remove retired Workbench hint copy and live-refresh real tooltip text

The Workbench source registry now contains only five genuine hover descriptions (portrait, equipment jump, new build, save build, Path points reset). The five self-explanatory Origin/Path tabs retain a separate explicit no-tooltip guard; their historical owner CAS rows are **not removed**, but do not appear in the editor or staging defaults. The owner panel and source migration inventory now agree without filtering dead source records.

`refreshWorkbenchHints()` reuses the guide tooltip module's existing per-node WeakMap binding on every RU/EN or successful owner CAS refresh. An already open/pending tooltip is updated and no duplicate pointer/keyboard handlers are installed. A stale hint on a self-explanatory tab is detached. The normal caption editors, gameplay values, and guest UI are unchanged. Node source/manifest regression checks and existing tooltip lifecycle tests cover these transitions.

## #390 footer counts: separate authorial words from live quantities

The live encyclopedia footer now has four independently editable RU/EN spans and three untouched number spans. `catalog-sync.catalog-count-{lead,skills,items,souls}` uses existing owner D1/CAS Save/Undo (8 immutable staging-only defaults). A normal re-render or locale switch patches only mounted text and real `catalogSource.meta.counts` values, without re-creating a live editor or moving a number into owner text. Guest mode has no editing attributes; changing owner mode safely replaces the footer's owner-only controls. Node and browser checks validate the exact source copy inventory, CAS persistence and reversal, and stable numeric DOM nodes. Production D1 and game catalog remain unchanged.

## #390 runtime cleanup of retired caption pencils

Audited all 58 shipped `pandora-*.js` modules and static HTML. Pencil creation remains only for genuinely separate explanations in Wiki item stats, Hero Book help and catalog-review action/search hints. Removed dead selector guards and no-op ARIA updates for the old `path-tab-pencil`, `path-owner-pencil`, `studio-owner-interface-pencil`, `stage-picker-slot-pencil`, `stage-control-pencil`, `stage-book-tab-pencil` and profile caption pencils across the main app, equipment and Hero Book. Inline editors, keyboard behavior, CAS Save/Undo and legitimate hover pencils remain. New Node contract requires this distinction; full Chromium check still required before acceptance.

## #390 cleaned CSS after direct-caption migration

Removed orphaned pencil CSS from owner-inline and Workbench guidance after auditing the 58 runtime JS modules; simplified native button rules and restored 8px right padding where 23/28px was previously reserved for duplicate caption pencils. True independent hover-hint pencil buttons and actual inline text editor styles are preserved. New Node CSS contract protects against regression. Physical touch QA still open.

## #390 direct profile copy sizing and retired pencil tracks · 22.11.2026

Reviewed rendered profile DOM: the live copy sits on `.ps-profile-copy`, with no `.ps-profile-copy-host` or pencil. Removed dead profile and Hero Path legend/racial/show-more pencil CSS. The racial disabled row no longer wastes a 27px empty grid track. The visible profile caption and its in-place text editor now use the actual DOM selectors for mobile wrapping and width; editable build name, guild, nation, rank and bio inputs are not replaced. Standalone profile copy accepts Enter/F2, while a real associated `label` keeps its native Enter behavior and exposes F2 for editing; key events from nested draft inputs do not reenter the editor. Updated the failing profile regression test to verify these real contracts rather than the removed pencil. Await full Node+Chromium on the new exact SHA; production D1 unchanged.

## #390 Profile direct-caption acceptance: 409, Undo and mobile

Extended the isolated Chromium Profile scenario beyond RU/EN happy-path: a stale expectedValue returns 409 and preserves the full unsaved EN draft; Escape cancels without a D1 write, and Undo reverses only the last successful EN edit without recreating the selected Profile tab or touching the user's hero input fields. At a 390px viewport, Enter opens only a non-interactive profile caption and its long text draft remains within visible horizontal bounds with `pre-wrap` rather than clipped. No true Cloudflare D1 access, game-client verification, or physical touchscreen is involved.

## #390 · Build comparison A/B editorial source, 22.11.2026

- The compact comparison now uses five stable `PandoraUILocale` D1/CAS RU/EN fields for its authored A/B selector prefix, default chooser option, swap accessible label/title, A/B statistics table ARIA description and repeated “Характеристика” column headers.
- Visible selector prefixes and both column headings are directly editable by dblclick/F2 through the established owner-only inline editor; there are no caption pencils. Fixed A/B letters and private player build names, selections, calculated metrics, numeric values and game identities remain separate uneditable nodes.
- Save, Undo and reset patch the existing selector accessible names, picker placeholder options and table/swap labels without remounting the selected builds. Added Node, source manifest/CAS, and RU/EN Chromium assertions; physical Cloudflare staging D1 import and hardware touch tests remain separately outstanding.

## Checkpoint 22.11.2026 — immutable A/B stat metric captions

- All **36** source-backed compact comparison metrics now carry independent, non-game authorial RU/EN captions editable **directly on the visible th** via owner dblclick, F2/Enter, blur→D1 CAS, Escape, Undo. No caption pencils or new numeric/delta columns.
- The comparison module's original RU metric names remain its exclusive source lookup, and winner/max/min/delta and saved A/B identifiers are not altered by a textual owner override. The UI reads `compare-metric.<key>` via existing `PandoraHonorGuide` CAS and stages **72 immutable bilingual D1-defaults rows** from the very same fixed source registry.
- An open/failed caption edit defers A/B table re-render until the editor closes, keeping drafts intact across a swap/selection. Numeric cells remain protected. Static Node tests cover the source key inventory and CAS precedence, browser acceptance must be green on the final PR SHA.
- The D1 manifest is still offline staging-only: no Cloudflare staging import, production D1 write or deployment is implied.

## #390 · Boundaries for source gameplay rules (22.11.2026)

- Split Honor double rewards into an authorial RU/EN D1/CAS heading (`book.honor-view.pvp-double-heading`) and a separate immutable Tuesday/Thursday schedule DOM node. Old full-schedule D1 overrides remain stored but cannot replace the live game-rule wording. Staged authorial defaults gain exactly one bilingual heading pair.
- Chest source gold intervals are separate numeric DOM nodes beside the editable `book.wiki.chest.text.gold-amount-prefix` caption. The actual deterministic generator now recognizes 36 audited chest source captions; it continues to reject unreviewed keys and gameplay data.
- Node and browser regression on the exact new SHA must pass before accepting this packet. No staging/production D1 migration, deployment or game-client verification occurred.

## #390 · Owner change-history numeric and authorial separation (22.11.2026)

The owner's **History of manual changes** contains two independently computed
record totals and real before/after values. The five label fragments next to
these live values are editable authorial RU/EN text, *not* part of the numeric
counts or catalog data. `ownerHistoryTextRows` now drives the mounted source
copy and the strict D1-only manifest inventory for `owner-history.*`.

The summary DOM is mounted once, with two immutable live-number spans updated
only in `draw()`. Standalone literal whitespace separates authorial captions,
so CAS text trimming cannot concatenate the label with a count after Save.
The game-data before/after paragraph nodes are unaffected. Existing
`intro` and `empty` captions share the same source-verified default cohort:
**seven unique bilingual keys / fourteen staging-only RU/EN default rows**.
No player IDs, record names, D1 values or counts were staged.

A real Chromium owner-history scenario exercises double-click Save on a summary
caption, preserves both current numeric counters, edits a before-heading
without changing D1 before/after values, and confirms the absence of extraneous
pencil controls. Full Node+Chromium required on the exact new PR SHA.

## 22.11.2026 · Equipment source-authorial and accessibility follow-up

- A previously hardcoded empty item-preview message now uses the bounded owner RU/EN D1/CAS `guideedit.book.equipment.unavailable` key; when an owner edit context is available, its visible copy is directly editable. Actual item data remains immutable.
- The equipment settings group's native `aria-label` now binds to an independent owner-copy key `pickerPropertiesGroup`, exposed through the existing compact owner text panel, so Save/Undo updates mounted accessible text without rerendering the gear.
- Equipped Soul socket accessible names use the original locale-aware item presenter (not a raw potentially RU-only `soul.name`). The source name, socket number and ID are never writable editorial text.
- Exactly two new reviewed RU/EN source identities (four rows) are admitted to the deterministic offline staging default manifest. Source-key inventory checks and browser regression verify RU/EN group/socket names and preserve the actual gear actions. Physical staging D1 import, hardware touch acceptance, and production release still require separate validation; do not merge the Draft PR on this packet alone.

## 22.11.2026 · Equipment native-button F2 parity

- Identified a keyboard gap after removing caption pencils: gear actions kept focus on the native button, while their nested visible span alone listened for F2. Double-click worked but F2 did not. The source-backed equipment `labeledAction` now delegates button F2 to the existing caption editor and declares the shortcut; Enter/Space remain native actions, no new pencil or D1 identity is introduced.
- Node source-contract assertions and a real Chromium owner-authenticated F2→draft→Escape scenario are added to an existing regression suite; the underlying item, Soul slot and selected tab stay unchanged. The packet needs same-HEAD Node+Chromium CI.
