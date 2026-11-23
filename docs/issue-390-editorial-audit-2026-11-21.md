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

## 22.11.2026 · Honor owner-editable accessibility and native F2 acceptance

- The actual rank-filter button now accepts F2 without a second focusable caption; Enter remains its normal filter action, and Escape restores focus. Authored PvP illustration alt and rank-emblem label prefix now use the existing owner-only native D1/CAS editor. Game rank names, IDs, artwork assets and numeric rank thresholds are not owner-copy values.
- Exactly two new source-reviewed semantic accessibility keys enter the offline staging D1 manifest (four RU/EN rows), guarded by a closed source inventory and existing Node tests. Existing real Chromium owner integration now tests cancel/save, rank-filter action, and original image/rank-name preservation.
- Both complete CI workflows are required on the new exact PR SHA; no staging D1 import, production write, release, physical touch check, merge or issue closure is implied.

## 22.11.2026 · Account trigger D1 copy versus live account identity

- The icon-only account trigger has an existing owner-editable `profileAccess` RU/EN key. Its account module used to overwrite the accessible guest title with its static source after refreshing; it now reads that semantic D1 value in both initial render and locale refresh. Signed-in title remains separate: localized authorial `Профиль`/`Profile` prefix followed by the current user's account name, which is never a D1 owner-editable string.
- After direct F2 save/Escape of this icon copy, the general static editor also reconciles the real account module's title and aria without remounting the account form or touching credentials/recovery codes. Node and real Chromium regressions exercise the exact D1 title across account refresh, and the guest/signed-in source split.
- Both full CI workflows are required on the new SHA. No production account data, D1, Worker or Pages write is performed.

## 22.11.2026 · Account icon guest versus signed-in editor selection

- The same icon-only account trigger now binds `profileAccess` for a guest and the existing `accountProfileTitle` for a signed-in user to both `data-i18n-title` and `data-i18n-aria-label`. Its F2 owner editor already reads the current key at activation, so an authenticated Profile prefix no longer edits the guest Sign-in label. The live account name stays outside D1 owner text; logout restores guest semantics and its RU/EN override.
- Existing Node contract and actual Chromium browser account registration/logout flows check the bound keys and the source-backed runtime name, with normal actions unchanged. No pencils or redundant editor widgets were added. Exact-HEAD full Node+Chromium required.

## 22.11.2026 · Wiki skill count bootstrap race

- Full Chromium on `6d4c01b` observed 18 correctly rendered racial skills but an early native option caption `Расовая пассивка` missing ` · 18`. The selector may mount before its source-backed index/model is ready. The existing list draw now refreshes native option counts after the real skill model arrives, without replacing the select, the selected filter, or its D1-authored RU/EN caption.
- The count is a separate source-computed number and updates existing `data-label-count` for future CAS/Undo. Original game IDs and data remain untouched. Node source lifecycle test and existing Chromium skill-filter smoke verify behavior; both complete CI required on this new SHA. No staging/production D1 writes or deployment.

## 23.11.2026 — #390 item-reference validation / EN fallback audit

- [x] Audited the existing `PandoraItemPresentation` reference-restoration boundary. Ambiguous duplicate or overlapping source item names previously produced Russian validation copy in EN mode; these are **non-editable safety messages**, not D1 authorial fields. Error messages now follow the selected language while preserving strict item-link rejection and source IDs.
- [x] A source item without a usable name now receives `Unnamed item` in EN instead of the RU-only `Без названия`. Explicit caller-provided fallbacks (including empty strings) are unchanged; source item names and identifiers remain untouched.
- [x] Extended existing Node reference tests and real Chromium material-link smoke with both-language fallback, ambiguous-name rejection and overlapping linked-name checks. No new test suites or pencils, game-client / Cloudflare changes, or D1 writes.
- [ ] Accept only after **both full Node + Chromium CI** succeed on the exact new PR head. This narrow correction does not complete the rare/dynamic RU/EN audit, physical touch QA, isolated staging D1 procedure, or owner release approval. Keep PR #809 Draft and issue #390 open.

## 23.11.2026 — #390 visible Workbench titles and Origin owner-only keyboard lifecycle

- [x] Five true **visible** Workbench chapter H2 headings are now semantic `PandoraUILocale` RU/EN D1 CAS fields; the existing `aria-labelledby` and open draft survive save/Undo and tab switches.
- [x] The visible Origin header retains its original source-backed `origin.race-heading` D1 key. Owner-only F2/tabindex hints no longer appear to guests; new Chromium tests cover direct double-click, D1 CAS, Undo and unchanged race identity.
- [x] Removed the proposed contextual gender guidance records and physical migration rows after discovering that `#raceSexInfo` belongs to the intentionally **hidden legacy gender controls**. No editorial keys are seeded for a hidden, obsolete panel. Original hidden legacy source behavior remains unchanged.
- [x] Updated the three pre-existing Node contract tests to assert the new semantic titles and existing Wiki event cleanup instead of obsolete one-line/hardcoded string shapes. Browser test uses only actually visible controls.
- [ ] Full Node + Chromium must pass on the next exact head before acceptance. Remaining: rare/dynamic RU/EN coverage, isolated Cloudflare staging D1 with rollback, real touch device QA, release acceptance. PR #809 Draft, issue #390 Open.

## 23.11.2026 — #390 visible class-selection wizard authorial captions

- [x] Centralized 13 existing source-authored RU/EN class-wizard fragments in a closed `originClassWizardCopyRows` registry. The 26 corresponding D1 defaults are **versioned, staging-only** and keyed by the existing `guideedit.book.origin.*` CAS identities.
- [x] Changed the actual rendered Back / All directions buttons, source stage captions, selected profession banner, current selection, card labels and empty-route instruction to use the existing direct dblclick/F2/Enter owner editor. Button navigation and accessible class identity remain separate from editable captions; native single-click/keyboard action stays meaningful. No new pencil icons.
- [x] Dynamic profession name/ID, current selection, class-tree route and mastery caps stay outside D1 editorial content. The selected badge and action labels split static authorial fragments from source job names rather than serializing composite text.
- [x] Extended existing Node manifest/identity tests and Chromium mock-CAS scenario: stage caption save/Undo alongside visible Origin and live Workbench H2, preserving race and hero identity. No actual Cloudflare writes or deploys.
- [ ] Require both full CI on the final commit before raising #390 progress. Staging D1 physical readback/rollback, hardware touch QA and release acceptance still pending; PR #809 OPEN DRAFT, issue #390 OPEN.

## 23.11.2026 — Class wizard single-click and ARIA authorial parity

- [x] Fixed a real owner-mode navigation defect: the editable stage caption previously suppressed **every** normal click. It now uses the shared 500ms guard so one click selects the stage and a genuine double-click edits its authorial RU/EN caption.
- [x] Six screen-reader authorial RU/EN phrases now use original `origin.*` CAS keys. Stage progress, breadcrumbs and each class-choice accessible name use `bindOwnerInterfaceText`; class names, chosen specialization and IDs remain uneditable runtime prefixes/suffixes.
- [x] One owner-only collapsed ARIA editor lives **outside** the class grid's `replaceChildren()`, preserving active drafts during class choice redraw. Save/Undo patch the mounted aria-label attributes via the existing owner-copy binding and no pencil icons.
- [x] Added 12 source-verified fields to the **staging-only** versioned D1 defaults manifest, updated real source-bound Node class wizard harness and added contract regression tests.
- [ ] New Chromium save/Undo/single-click integration scenario and BOTH full CI required on final SHA before the packet is accepted. No physical remote staging D1, real touch hardware, deployment, merge or production write.

### Follow-up — trimmed D1 fragments must never glue canonical class names

- [x] Audited `editWikiValue()` which intentionally trims owner text before CAS. Removed leading/trailing whitespace from the six original class-wizard ARIA phrases; owner D1 now stores only words, while class name, separator ` · ` / ` — ` and spaces are composed outside the edit.
- [x] Fixed the same risk in two actual *visible* class selection prefixes (`classSelectedPrefix`, `classCurrentChoose`): authorial RU/EN defaults have no trailing spaces; visible separating spaces are own, non-editable text nodes. Original guest-visible wording is unchanged.
- [x] Updated the two old Node source-structure tests to verify the new bilingual source registry and restored owner single-click contract, with no deleted testing of profession stages or source name integrity.
- [ ] Browser scenario must verify class-visible CAS compositing and ARIA roundtrip; both Node and Chromium required on a final SHA. PR stays Draft, issue remains Open; no staging remote or production mutation.

## 23.11.2026 — Hero Path blocked skill readiness: 16 dynamic authorial fragments

- [x] Audited all 16 canonical blocked-skill explanations, including wrong class, unavailable branch, missing invested points, required character level, predecessor, exceptional training, malformed conditions and unknown extra requirements.
- [x] Preserved \`PandoraHeroPath.readiness().learned\` and its source-locale \`problems\` strings as the original game-logic API; added \`problemParts\` containing authorial RU/EN identity versus immutable class/branch/skill names and runtime numbers.
- [x] Replaced the single noneditable \`🔒 + gate.problems.join(' · ')\` UI string with individual direct dblclick/F2/Enter editable authorial spans. The \`🔒\`, separators, source identity, numeric thresholds and raw game requirements stay separate nodes. Same existing \`path.*\` D1 CAS/Undo lifecycle; no pencils, no invented game names.
- [x] Staged exactly 32 source-authored bilingual defaults under 16 reviewed \`guideedit.book.path.skill-gate-*\` keys, strictly staging-only (no remote Cloudflare writes).
- [x] Added source audit and game-logic compatibility tests for both locales, malformed prerequisites and immutable source segments. Added real Chromium owner CAS Save/Undo regression for locked skill reasons with source/numeric value and selection preservation.
- [ ] Both full Node and Chromium CI are required on the final exact SHA. Remote isolated staging D1 import/readback/rollback, real hardware touch, further rare RU/EN audit, release authorisation and production read-only acceptance are still outstanding.

## 23.11.2026 — Origin visible race-carousel accessibility, #390 continuation

- [x] The **visible** portrait carousel now exposes three separate RU/EN authorial accessible actions (previous, next, select) via the original `origin.*` D1/CAS key family. Its small, owner-only collapsed accessible-copy editor sits in the visible Race tab. No generic pencil or new editing backend.
- [x] Canonical race names, gender suffixes, portrait indices, image paths and the actual chosen race stay outside owner-editable data. The source action remains usable and correctly named when gallery artwork fails to load. Hidden legacy gender controls were **not** promoted to editorial content.
- [x] Exactly three reviewed bilingual identities (six fields) enter the deterministic offline, **staging-only** default manifest, with source-key protection in an existing Node test. Existing real Chromium owner-racial-path regression covers RU CAS, cancellation by Escape, EN separation, gallery re-render and unchanged hero race.
- [ ] Final acceptance requires BOTH complete Node+Chromium CI on the exact new HEAD. Physical isolated Cloudflare staging D1 import/readback/rollback, real hardware touch, separately approved release and production read-only acceptance remain incomplete. Keep PR #809 Draft and issue #390 open.

## 23.11.2026 — Character/Profile source-authored dynamic RU/EN and live editor lifecycle

- [x] Audited **twelve** source-authored dynamic accessibility/status families displayed in the Character overview and Profile: portrait image alt prefix and missing race, unnamed hero, missing class, level unit, missing overview field, passive loading/choose-race/missing description, passive select/selected status and character tablist accessible name. All now use stable `guideedit.book.profile.*` source RU/EN overrides.
- [x] Real player-entered name, biography, guild/nation/rank, canonical race/class names, racial skill game names/descriptions and numeric level remain separate immutable source/user fields. The merged visible string is **never** serialized as an editable CAS value; source-only spacing and separators remain outside editable units.
- [x] Reused one compact owner-only collapsed `ownerInterfaceEditor` for rare and accessible-only words, with no extra pencil icons or new modal. On CAS Save, Undo or Reset, `refreshVisibleProfileCopy()` patches the **mounted** portrait alt, tablist ARIA and eligible text nodes in place, not the input elements or profile fields. The old standard direct dblclick/F2 editing still applies to ordinary visible Profile captions.
- [x] Deterministic offline staging-defaults plan now includes exactly **24 additional bilingual source-only rows** (the 12 keys × RU/EN), never user-written content. Extended the existing Node manifest/source-boundary and real Chromium Profile CAS/Undo/reset, EN→RU isolation and unchanged portrait/hero/bio regressions.
- [ ] Both full required Node + Chromium CI must be accepted on one final HEAD. Physical **remote** isolated Cloudflare staging D1 backup/import/readback/SHA-256/rollback, true touch hardware QA, separately authorized release and production read-only acceptance remain open; never count mock/SQLite as physical D1. Leave PR #809 OPEN DRAFT and issue #390 OPEN.

### Follow-up · direct editor for visible composite Profile copy

- [x] Instead of one composite `<small>.textContent`, the Profile summary now uses independent DOM nodes for canonical race, canonical profession, numeric level, source separators and a directly editable **level-unit** caption. Dblclick/F2/Enter edits `profile.level-suffix` through the existing CAS/Undo path, not a button and not a parent paragraph. The numeric level and source names are not owner text; Save/Undo must preserve the adjacent original DOM nodes and the inline draft.
- [x] Pure fallback words (unnamed hero, missing race/class and missing overview) and the noninteractive empty racial-passive description use the already established visible `profileCopyLabel` direct-editor contract. Original source/player values are displayed as noneditable elements when present. The owner-only panel remains available for non-visible/rare states, but no pencil buttons appear next to the visible caption.
- [x] Expanded the existing Node source-boundary assertion and real Chromium profile scenario to require a direct level-unit caption plus immutable current level after CAS. Source identity, player inputs, English/Russian isolation and reset acknowledgement continue to be tested.
- [ ] Both full CI on the new exact HEAD required, no physical Cloudflare D1 or device QA implied.

## 23.11.2026 — Origin racial passive dynamic source copy and owner CAS (continuation #390)

- [x] Six exact original RU/EN source-authored identities for the actual Origin racial passive UI: choose-race/late-catalog notices, selected/select badge captions, selected/select accessible action words. All use the existing `guideedit.book.origin.*` CAS/Undo family. Original skill name, ID, chosen passive and loading conditions remain source/runtime facts, never authorial D1 values.
- [x] Visible badge and empty-state copy is edited directly on double-click/long-press with no new pencil. The two accessibility-only phrases share a single compact owner-only panel outside the rerendered `#originPassives` node; this prevents a redraw from losing an active accessibility draft. The parent button keeps RU F2 game-name editing, Shift+F2 for the separate authorial status, and its original click selection action without redundant nested tab stops.
- [x] Added twelve reviewed bilingual source-only fields to the deterministic **offline staging** default plan, with closed source-key inventory, Node game-source boundary assertions and existing real Chromium owner-racial-path CAS/Escape/Shift+F2/ARIA/RU→EN regression. No production D1/Worker/Pages changes.
- [ ] Both complete Node + Chromium CI on one exact SHA required before acceptance; physical isolated Cloudflare D1 staging import/readback/rollback and real device touch acceptance are still unverified, no merge or issue closure.

## 23.11.2026 — Origin Stats and HP/MP source-only editorial coverage (#390)

- [x] Reviewed 14 further RU/EN authorial families in the live Origin stat allocation surface: choose-race/class and budget text, total/bonus captions, the vitals loading announcement, one-step/hold instruction, increment/decrement input accessibility and computed-stat explanation (base, allocated points, known bonuses, cost, maximum). Reused the same `guideedit.book.stats-ui.*` CAS keys, extending its closed source inventory from two to **sixteen** identities and the deterministic **offline staging** manifest from 4 to 32 fields.
- [x] Visible summary, total and bonus words are directly editable by dblclick/F2 through existing owner text controls without adjacent pencil icons. Remaining/total points, effective stat values, stat IDs, original labels, numeric cost and bonus magnitude are separate gameplay nodes; no composed numeric string is saved as a D1 override.
- [x] The HP/MP accessible description reads the **actual visible, already localized HP/MP labels and computed DOM values**, never duplicates their existing UI localization keys or reruns the calculator during a copy-only CAS refresh. On missing game data, one source-only editable aria announcement is used. After owner Save/Undo/Reset, `refreshOriginStatAccessibility()` updates mounted aria labels and hints without changing stat inputs or rebuilds.
- [x] Owner-only ARIA copy panel sits **outside** the frequently replaced stat list to preserve active editor drafts. Source-only keys remain separate from gamer-entered stat investments; established original number controls and hold interaction stay intact.
- [x] Extended existing Node manifest/source-contract, absolute-stat fixture and real Chromium racial-owner scenario for direct RU save, source totals, original HP/MP, increment ARIA and EN isolation. No new test suite added.
- [ ] Full Node+Chromium CI acceptance on exact final SHA, physical isolated remote D1 import/readback/rollback, real hardware touch QA and separately authorized release remain pending. PR #809 stays OPEN DRAFT; issue #390 OPEN.

## 23.11.2026 — Hero Path visible skill budget (#390)

- [x] Five original source-authorial RU/EN states (loading, available, spent, total, over-budget preservation) are now `guideedit.book.path.budget-*` CAS copy identities; staged ten **offline-only** defaults without any character point values.
- [x] The mounted budget rows preserve an open direct dblclick/F2/blur editor during real level and point recalculations. Live totals and the selected canonical class stay in separate DOM elements; no caption pencils or guest editors.
- [x] Added source/staging Node assertions and expanded real Chromium owner Path regression for RU/EN CAS, Escape, stable numbers and inline draft preservation.
- [ ] Required full Node + Chromium CI on final HEAD pending; isolated remote Cloudflare staging, real hardware touch and separately authorized release not yet accepted. Keep PR #809 Draft and issue #390 open.

## 23.11.2026 — Hero Book accessible chapter navigation (#390)

- [x] Audited the six-page live Book region. Existing "Previous/Next/Return/Chapters" authorial RU/EN actions intentionally reuse original `ui.label.book-*` CAS records; no duplicate identities or source game records.
- [x] Added three reviewed `guideedit.book.book-aria.region-*` RU/EN fragments for the composed region accessible sentence, with **six source-only, deterministic offline staging D1 defaults**. The chapter name comes from the established editable `chapter.*` identity; current page index and total stay immutable runtime numbers.
- [x] Added one compact owner-only collapsed accessibility panel without pencil icons. In-place `dblclick/F2/blur` uses existing D1/CAS and preserves the mounted editor through normal Book redraw and chapter changes. Save/Undo/Reset refreshes mounted navigation and region accessible names without rebuilding player data or rewriting character state.
- [x] Extended existing Node source/manifest and real Chromium mock-CAS owner flows for old-key compatibility, RU/EN separation, dynamic chapter index, no duplicate accessibility panel and unchanged gameplay.
- [ ] Full Node + Chromium must both pass on the final exact commit before this batch is accepted. Physical, isolated remote Cloudflare staging D1 backup/import/digest readback/rollback; hardware touch and explicitly approved release are still **NOT** complete. Keep PR #809 OPEN DRAFT and issue #390 OPEN.

## 23.11.2026 — Hero Book interactive item/skill ARIA prefix separation (#390)

- [x] Found three original bilingual navigation-action phrases shared across **six mounted link/button construction sites** (one skill encyclopedia badge, four item encyclopedia actions and one direct item action). Added exactly three source-only `book-aria.*-prefix` CAS identities (six RU/EN OFFLINE staging rows) in a separate closed, source-audited manifest cohort.
- [x] Every real action keeps its **current source-derived** item/skill name as a separate `data-book-source-name` element property. Refreshing D1 copy recomposes the mounted accessible name in place without writing a source name, skill ID, item ID or character value to the override or rebuild/rendering the game calculator.
- [x] Reused the single owner-only collapsed Book accessibility panel, direct dblclick/F2/blur and current CAS/Undo/Reset; no additional pencil buttons. The same existing full Chromium owner test checks English prefix save with unchanged numeric chapter identity; Node tests validate all six call sites, exact staging manifest and a bilingual original-source DOM composite after CAS.
- [ ] Both full Node + Chromium CI required on the new exact HEAD; no remote isolated Cloudflare staging D1 import/readback/rollback, real hardware touch, production deployment or release authorization implied.

## 23.11.2026 — Book pure combat-buff unavailable messages (#390)

- [x] Four **new literal-only** RU/EN status families now share one source-verified Book `buffStatusCopyRows` inventory: wrong profession, missing shield, incompatible weapon and ally/support skill unavailable. The original default «Недоступно для героя» remains on its historic UI D1 key, never duplicated. The absent-catalog result is deliberately **excluded** because there is no rendered skill card without source skill data.
- [x] Existing game availability/skill level/branch mastery/weapon predicate remains in the calculator and current character; exact original literal reason selects only a safe `reasonCopyKey`, never a dynamically composed game number or catalog name. No change to valid skill allocation or OS mechanics. Eight bilingual source-only fields enter the **offline staging** manifest under `guideedit.book.buffs.reason.*`.
- [x] Visible pure reason spans use the established direct dblclick/F2/blur D1/CAS owner editor with no pencil. Owner double-click over a native checkbox label is delayed/guarded to avoid triggering an unintended game toggle; an ordinary single click remains available. Save/Undo/Reset updates the current Book without replacing live player data.
- [x] Extended the existing Book Node/manifest assertions and real owner Chromium scenario for direct RU status edit, F2, Escape, source-skill unchanged, and native buff checkbox integrity.
- [ ] Final full Node + Chromium both SUCCESS on the same exact HEAD required before accepting this packet. Real isolated Cloudflare staging D1 import/readback/rollback, physical touch hardware and authorized release/production read-only remain **NOT** done; keep PR #809 OPEN DRAFT and #390 OPEN.

### Follow-up · disabled buff label accessibility regression (23.11.2026)

- [x] Real Chromium on `494727dc` found an interaction bug: owner caption inside a disabled checkbox `label` cannot be double-clicked. Enabled skills retain native `label`; disabled skill rows use class-identical `div`, with source-skill accessible name on the disabled checkbox and independent focusable CAS caption.
- [x] Removed the dead deferred checkbox guard, updated focus styling and strengthened source/Chromium tests to verify disabled-row semantics, double-click/F2, Escape and unchanged checkbox state. Gameplay predicates unchanged.
- [ ] Accept only after both full CI SUCCESS on the exact final SHA. No remote staging D1, physical touch QA, release, merge or production writes.

## 23.11.2026 — Hero Book level/mastery composite blockers · #390

- [x] Audited the actual combined strings «Откроется на 46 уровне» / «Available at level 46» and «Требуется мастерство «Стрельба»: 25» / «Requires 25 Archery mastery». The original source/game restrictions and their condition precedence remain untouched. A small shared source helper classifies only verified level/mastery restrictions; recipient party buffs and class-unknown/cross-class cases cannot gain a fake requirement.
- [x] Split the two locale-dependent messages into **four exact bilingual authorial pairs** (levelLead, levelUnit, masteryLead, masteryTerm), retaining original word order in RU and EN. Game-owned level, mastery amount, source branch name and punctuation live in separate DOM nodes. None of the complete composite text or runtime numbers is written into D1/CAS.
- [x] Reused the already corrected disabled-skill DIV/editor: direct dblclick/F2/blur, Escape and normal skill-checkbox gating without pencil buttons. Exactly eight additional source-only defaults in the deterministic, fail-closed **offline staging** manifest at `guideedit.book.buffs.reason.*`; existing source status keys remain unchanged.
- [x] Added Node source/manifest/game-fact boundary assertions and an actual Chromium Book DOM-only RU/EN fixture: verify original sentences, original game branch/threshold, double-click/F2 owner callbacks and simulated CAS override changing only words. No real game skill IDs or production data are impersonated; test fixture is explicitly synthetic.
- [ ] Final complete Node + Chromium on one exact HEAD required before accepting. Physical isolated Cloudflare staging D1 backup/import/readback/rollback, real touch hardware and authorized protected release/read-only production are still pending. Leave PR #809 Draft and issue #390 Open.

### Follow-up · preserve Book inspector regression after metadata extraction

- [x] The first complete Chromium on `f08f3235` passed, including the synthetic Book requirement fixture, direct RU/EN edits, immutable level 46 and source mastery branch. The parallel Node suite caught only an obsolete source regex that assumed a `branchName` scalar instead of the same original name under `req.branchName`. Updated the regression to verify both the original English wording and source-owned requirement metadata; did **not** remove any test or game rule.
- [ ] Re-run both full Node + Chromium on the final HEAD before acceptance. Remote Cloudflare staging, touch hardware and authorized release remain pending.

## 23.11.2026 — F2 для пиктограммы обмена билдов (#390)

- [x] Кнопка обмена A/B использует уже существующий RU/EN D1-ключ `compareSwapAction` для `title` и `aria-label`. В режиме владельца F2 правит текст через прежний CAS/Undo, не заменяя видимую пиктограмму и не создавая ✎.
- [x] Общий обработчик прямой редакции принимает необязательный DOM scope. Динамически вставленный блок сравнения привязывает только собственные элементы, сохраняя общий документный режим и гостевые ограничения.
- [x] Дополнен существующий Node-контракт и настоящий Chromium-сценарий: F2, CAS, Escape, Undo, синхронизация ARIA/title, сохранение A/B ID, отсутствие карандаша; штатный обмен проверяется существующей частью сценария.
- [ ] До принятия необходимы оба полных CI на точном новом SHA. Реальная remote staging D1 и touch hardware не проверены. PR #809 Draft, issue #390 Open, production без изменений.

## 23.11.2026 — Owner history controls and no-pencil CSS cleanup (#390)

- [x] Seven formerly hard-coded RU/EN authorial controls in the manual D1 change-history dialog now have stable semantic `guideedit.book.owner-history.*` identities: editable search placeholder/ARIA, section-select ARIA, session checkbox caption, clear-action caption/ARIA and All sections option. The same D1 CAS/Undo mechanism applies; native non-text controls are grouped in one collapsed owner-only editor, with direct double-click on visible captions.
- [x] Existing checkbox and clear action keep their native behavior through the delayed first-click guard; a double-click edits only the source caption. Typed search text, selected section, checked state, runtime D1 records, before/after values and totals are never translated or stored as authorial copy.
- [x] Source-staging manifest explicitly recognizes exactly these seven new bilingual keys and fails closed on registry drift; Node and real Chromium coverage added to existing suites. Removed obsolete CSS for historical `owner-history-pencil` and `owner-history-edit-row` while preserving actual caption layout.
- [ ] Require BOTH full CI checks on exactly the next HEAD. Cloudflare isolated remote D1 preflight/import/hash readback/rollback, physical-touch acceptance and authorized release remain pending. PR #809 stays Draft; issue #390 Open.

## 23.11.2026 — History row text, safe counts and status stability (#390)

- [x] Audited five original RU/EN source-only history row identities: two transient owner save statuses, the change-count prefix, and the two visible per-record action captions. Staged ten bilingual fields in a strict closed `owner-history-rows` cohort. No user record names, before/after values, numeric counts, save payloads or server errors become editable.
- [x] The change count is a separate live numeric node. Status nodes survive repeated history redraws and no longer have their text destroyed while a CAS input is mounted. Visible captions edit by direct double-click with the original action guard and no pencil; hidden status text is in one collapsed owner-only copy panel.
- [x] Existing source/manifest tests and real Chromium owner D1 mock/CAS checks cover inline change count editing, reset caption editing without an accidental reset, preserved values and unchanged history totals. No independent test suite was added.
- [ ] Accept only after FULL Node and FULL Chromium pass on one final SHA. Physical isolated Cloudflare staging, real touch-device QA, release authorization and production read-only acceptance remain pending. Do not merge/close PR #809 or issue #390.

## 23.11.2026 — Complete history dialog/hover source parity and guarded summary (#390)

- [x] Added seven verified bilingual authorial history keys: three real independent hover explanations (clear, restore, open), the visible dialog heading, a confirmation prefix, reset-error prefix and missing-catalog notice. The popup/aria explanations are **not** the button captions; source-only staging manifest stores 14 additional default fields, never record titles, D1 before/after values, runtime counts or server errors.
- [x] History dialog heading now edits directly on dblclick/F2/blur, with ARIA name updated in place after Save/Undo, preserving the modal and record data. True hover explanations are edited in the existing collapsed owner panel; updates propagate to `data-guide-hint` and `aria-description`, without new pencils. Count caption inside native `summary` guards against unintended expansion/collapse during double-click editing.
- [x] Fixed an actual CI race in Equipment's real browser regression: the history reset action has a deliberate single-click delay to preserve direct double-click editing, so waiting for a label that was **already** correct did not prove the CAS write. The browser now waits for **actual deletion of the exact D1 key**, with all previous value/DOM invariants intact.
- [x] Extended the existing Node source/staging and Chromium browser tests for independent hint/button CAS keys, no loss of typed search, unchanged record counts, guarded summary, title/ARIA synchronization and functional reset. No test disabled or new standalone suite created.
- [ ] Full Node and Chromium must both succeed on one new exact SHA. Physical isolated staging D1 backup/import/hash readback/rollback, hardware touch QA, authorized release and production read-only acceptance are still unverified. Keep PR #809 OPEN DRAFT, #390 OPEN.

## 23.11.2026 — Owner EN-translations and optional GitHub export, safe RU/EN D1 (#390)

- [x] Audited the two actual owner dialogs and added 18 semantically stable RU/EN source-only status/label/hint identities, plus five pre-existing owner dialog help/action D1 identities. **46 bilingual source defaults** are now part of strict fail-closed `owner-dialog-states` and `owner-dialog-helpers` offline staging cohorts.
- [x] English-review success/partial-failure copy is split from actual translated record count, successful write count and untouched Worker errors. Export record-count copy is independently editable without changing the server's `count`; explanatory messages, status captions and modal titles are editable directly by double-click/F2/blur and existing CAS/409/Undo. A title Save/Undo refreshes the existing dialog ARIA name without remounting the modal.
- [x] The two existing independent owner action hover hints are separate from the actual button text and are accessible in small collapsed owner-only panels; hover and `aria-description` refresh from the same D1 field. Native actions remain double-click guarded; the real server-provided GitHub PR URL is never author-editable and retains native link semantics. Source help no longer describes ordinary D1 caption edits as requiring a pencil.
- [x] Added Node contract/default staging and real Chromium mocked D1/CAS regression for direct export count edits, hint edits without publishing, explicit click creating exactly one simulated PR, link-label changes without changing the URL, and direct modal title/ARIA. This is a mock server: no real PR is published and no Cloudflare writes performed.
- [ ] Full Node + real Chromium must both pass on the exact final PR SHA. The remote isolated Cloudflare staging D1 physical backup/import/full readback digest/rollback, real hardware touch QA, remaining rare authorial RU/EN review and explicit release/read-only production verification are still open; do not close PR #809 or issue #390.

## 23.11.2026 — безопасная EN-приёмка подробностей проверки каталога (#390)

- [x] Найден конкретный пробел: английский review/catalog-sync показывал частично русские подписи детальных изменений, даже при уже локализованной основной сводке. Для **известных** характеристик, сопротивлений, добычи, слотов, полей подземелий и служебных контрольных сумм модель проверки теперь возвращает раздельные `label` (старое RU) и `labelEn` (EN), без перезаписи самого игрового значения. Изменён отображаемый текст и поисковый индекс в каталожной панели; настоящие source item references и открытие карточек сохраняются.
- [x] Для вложенных таблиц формул, уровней, мастерства, параметров экипировки добавлены закрытые EN-подписи известных ключей и разделов. Исходные игровые ID и незнакомые source-коды **не переводятся в вымышленные игровые понятия**; существующий `uncertain`/technical/manual review обязателен. Переводы не изменяют расчёт, результаты сравнения, delta, списки выбора или состав D1-публикации.
- [x] Разделены английские безопасные generated-части названий групп (Loot / Dungeons and quests / Game formulas и т.д.) от оригинального имени монстра/предмета/задания. Пустые/неуказанные значения, наличие записей и дополнительные слоты отображаются на EN по **исходному типу данных**, а не заменой похожих слов в реальном описании. EN-объяснение без специального шаблона стало нейтральным: перечень известных полей либо честное «source records differ / manual review required». RU-вывод остаётся прежним.
- [x] Расширен существующий `tests/pandora-os-catalog-human-review.test.mjs`: RU-регрессия, EN-поля известных сопротивлений, предметные ссылки и слоты, nested tables с неизменными числами, работа ручного review для неподтверждённых механик и исходных source-кодов.
- [ ] Принимать этот пакет только после **Node + настоящего Chromium SUCCESS на последнем точном HEAD**. Физическая Cloudflare staging D1 с независимым backup/import/readback/SHA-256/rollback, hardware touch, финальный сквозной rare/dynamic аудит, отдельное разрешение на релиз и read-only production после релиза **не подтверждены**. Оставить PR #809 OPEN DRAFT и issue #390 OPEN.

## 23.11.2026 — прямое D1/CAS-редактирование авторских подписей подробной сверки (#390)

- [x] После EN-локализации фактического human-review найден оставшийся UX-пробел: девять подтверждённых RU/EN заголовков, префиксов и пустых поясняющих состояний подробного сравнения были жёстко зашиты в `pandora-os-catalog-workbench.js`. Добавлен точный `catalogReviewDetailCopyRows` и прямой `reviewCaption()`: двойной клик/F2 непосредственно по тексту, существующий owner D1/CAS, Blur/Undo, без карандашей для видимых подписей и без вложения редактора в управляющие кнопки.
- [x] Реальное отображение: «Перед применением», заголовок проверки результатов персонажа, количество изменённых параметров, заголовок прогнозируемых дропов, «Ещё N изменений», отсутствие изменений героя и приглашение выбрать расу/класс. Числа `description.rows.length`, `impacts.length - 4`, `comparison.changes.length - 10` остаются отдельными runtime DOM-узлами; ID, игровой билд, дельты, модель вероятностей, ссылки, статусы источников и подтверждения публикации **не** сериализуются в D1.
- [x] В офлайн-планировщик добавлен строгий fail-closed cohort `catalog-review-details` (ровно 9 RU/EN ключей, 18 source-only defaults); новый/удалённый/пустой/изменённый ключ блокирует планирование до повторной ревизии. Существующие семантические `guideedit.book.catalog-sync.*` CAS-ключи сохранены.
- [x] В существующем Node-наборе проверены реальные ключи, точные значения манифеста, разделение счётчиков и прямые биндинги. В реальный Chromium сценарий owner каталога добавлены dblclick/blur/CAS и независимость количества выбранных изменений, подтверждения риска и кнопки публикации.
- [ ] Финальная приёмка пакета только по полным Node **и** Chromium SUCCESS на одном и том же HEAD SHA; последующие коммиты требуют новой проверки. Осталось за пределами автоматической приёмки: исчерпывающий rare/dynamic аудит, реальные изолированные Cloudflare staging D1 backup/import/readback/SHA-256/rollback, аппаратное touch QA, отдельно разрешённый релиз и post-release production read-only. Не объединять/не закрывать PR #809 и #390.

## 23.11.2026 — динамические фильтры каталожной сверки: RU/EN редактирование без изменения чисел (#390)

- [x] Из фактического `filterChoices` смонтированы 10 раздельных видимых RU/EN подписей владельца: Все, Новые, Изменённые, Удалённые, Выбранные, Не выбраны, Требует проверки, Игровые ссылки, Текст совпадает, Расшифрованы. За ними по-прежнему остаются **отдельные живые счётчики** по текущим данным; пользовательские изменения/ID и выбор фильтра никогда не пишутся в authorial D1.
- [x] Вместо прежнего `button.textContent = подпись + N`, который стирал бы открытый редактор, используются соседние `.os-sync-filter-caption` (owner dblclick/F2/blur→CAS/Undo) и `.os-sync-filter-count` (только рассчитанное число). Владелец выбирает фильтр обычным одиночным кликом после короткого отсечения двойного; guest и клавиатурная активация не ждут. Двойной клик по тексту не должен переключать категорию; сенсорное удержание использует общий owner-gesture; лишних карандашей у подписей нет.
- [x] В staging-only planner добавлена строгая ревизия `catalog-review-filter-captions` (20 bilingual defaults из оригинального `filterChoices`); неожиданные ключи/невалидные поля блокируют генерацию. Никаких production D1 writes, изменения игровых записей или автоматической публикации.
- [x] Независимые настоящие hover-подсказки всех 10 фильтров получили **отдельные** RU/EN ключи `catalog-sync.hint-review-filter-*` и сохранение D1/CAS через одну соседнюю ✎ *только для подсказки*, в том числе при F2/клавиатурном фокусе и на touch. Надпись остаётся dblclick/F2 inline, счётчик и состояние выбора — runtime. На мыши подсказочный карандаш показывается только при hover/focus, на touch остаётся доступным. Не добавлены карандаши для заголовков без самостоятельной подсказки.
- [x] Динамические сводки проверки каталога (`Найдено изменений`, `Выбрано`, `Не выбрано`, `Осталось`, `Требуют проверки`, `Настроек игры найдено`, `Затронутые разделы`, `Переносы строк включены`, `Различий в игровых данных нет`) разделены на постоянные авторские RU/EN D1/CAS подписи и вычисляемые sibling-числа/источники. 12 фиксированных semantic keys, 24 значения staging defaults (`catalog-review-runtime-labels`); повторная сверка, выбор и автообновление не уничтожают открытый редактор, клиентскую модель или count. Никаких карандашей для таких подписей. Проверки Node и настоящий Chromium дополнены независимыми сохранениями `summarySelected`/`affectedSections`, без изменения чисел/данных игры.

- [x] Строгая версия staging defaults расширена на 20 RU/EN значений `catalog-review-filter-hover` из отдельного оригинального словаря, исключая ID/изменения каталога. Node проверяет все 10 пар и невозможность коллизии с 10 RU/EN подписями; Chromium отдельно проверяет сохранение подсказки, неизменность видимой надписи, счётчика, выбранного фильтра и показанных игровых записей.

- [x] Расширены существующие Node и настоящий Chromium проверки: источниковые ключи, тип и динамичность DOM-счётчика, RU D1 CAS редактирование, ESC-отмена F2, штатная одиночная фильтрация с реальным ожиданием действия, отсутствие влияния перевода на количество и выбор записей.
- [ ] Обязательно проверить **полный Node и настоящий Chromium на одном финальном SHA**. Физическая изолированная Cloudflare staging D1, реальное touch hardware, финальный исчерпывающий аудит и отдельно разрешённый protected release/read-only production по-прежнему не подтверждены. Не закрывать PR #809 или issue #390.

## 23.11.2026 — устранили блокер запуска изолированной staging D1 до merge (#390)

- [x] Найден организационно-технический тупик: `.github/workflows/editorial-staging-d1-manual.yml` создан только в Draft PR #809, но по [официальному правилу GitHub Actions workflow_dispatch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch) ручное событие принимается только для workflow, существующего в default branch `bonaqu_projects`. Для проверки staging до слияния **нельзя** рассчитывать на кнопку Run workflow из этой ветки.
- [x] Создан отдельный локально запускаемый оператором `scripts/run-editorial-staging-d1-premerge.mjs`, использующий прежние allowlist guard, source-only manifest, SQL/readback/rollback. Требуется чистая checkout ветка PR, явный точный HEAD-SHA из зелёных Node+Chromium, отдельно одобренное действие и выделенные staging-only параметры Cloudflare. Перед любым удалённым import/rollback — сверка реального D1 имени/UUID, whitelist схемы и независимый **полный remote export** за пределы репозитория/temp + собственный SHA-256. Import завершается только после полного удалённого readback со сверкой каждого значения и digest, rollback удаляет только фиксированный snapshot и проверяет оба нулевых счётчика.
- [x] `docs/issue-390-premerge-d1-staging.md` содержит операторский preflight → отдельный import → отдельный rollback с различными manual-confirmation, запретом production и перечнем доказательств. Существующий `tests/editorial-staging-target-390.test.mjs` расширен безопасными проверками no-network import, SHA/branch/dirty guard, staging-only команд, бэкапа и верификации.
- [ ] **Сам remote D1 прогон НЕ проводился:** здесь нет подтверждённых отдельного staging Cloudflare токена, staging UUID, внешнего бэкапа и физического readback. Программный runner/CI не заменяет реальную репетицию. До принятия этого пакета также нужны оба полных Node + Chromium SUCCESS на новом точном SHA. PR #809 и issue #390 сохранить OPEN, не сливать и не изменять production.

## 23.11.2026 — История правок: понятное RU/EN сравнение всех authorial Book D1 overrides (#390)

- [x] Проверен **реальный** просмотр истории владельца `PandoraOwnerChangeReview.inspect()`: после новых UI правок `guideedit.book.*` в истории ошибочно попадали в «Другие настройки», показывая одну строку `value: {"ru":"...","en":"..."}` и внутренний namespace вместо понятного назначения. Это не сам UI-редактор, а отдельный разбор *уже сохранённых* записей — поправлен без изменения D1/CAS.
- [x] Для всех прочих `guideedit.book.*` добавлен безопасный read-only маршрут в раздел «Интерфейс / Interface»: известные семейства (catalog-sync, owner-history, owner-dialog, owner-dock, origin, path, equipment, honor-view, profile, wiki, book-aria) отображаются понятной локализованной группой; заголовок берёт только сокращённый **сохранённый текст**, не игровой ID/имя и не JSON. Сам оригинальный D1-ключ оставлен неизменным для поиска, сброса и Undo; поля `ru/en/hintRu/hintEn` отражаются отдельно. Уже существующие специальные `wiki.item-field`, `ui.label` маршруты и игровая история остаются приоритетными.
- [x] Исходный авторский текст для сравнения берётся только из *фактически загруженного проверенного versioned staging reader*, если тот предоставляет точное `guideedit.book.*` поле. Без такого источника честно показывается «Исходное значение неизвестно / Original value unknown». Сохранённая строка **никогда** не выдаётся за baseline. Ошибки необязательного reader не ломают список истории; никаких D1 writes или запроса на публикацию.
- [x] Существующий Node-набор истории дополнен тестами RU/EN заголовков, полей, настоящего исходного значения, отсутствия источника, неприкосновенности исходного D1 ключа и legacy-данных предмета. Реальный Chromium сценарий owner history теперь проверяет **фактически ранее сохранённые** caption и tooltip каталога, отдельные поля и отсутствие JSON, без нажатий на Restore/Publish.
- [ ] До принятия этого пакета обязательны полные Node + настоящий Chromium **на одном точном SHA**, затем по #390 остаются физический isolated Cloudflare staging D1 backup/import/readback/SHA256/rollback, аппаратный touch QA, полный rare/dynamic аудит, отдельно разрешённый выпуск и read-only production. PR #809 и #390 оставить OPEN.

