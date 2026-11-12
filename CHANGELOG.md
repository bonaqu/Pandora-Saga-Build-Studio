# Pandora Saga Build Studio — CHANGELOG

## 0.674.0 — 2026.11.12.674 · Source-gated Lightness, Swift Arrow and Blessed Repose active buffs: OS coefficients, Remaked index channels and regression tests

- Source-gated Lightness, Swift Arrow and Blessed Repose active buffs: OS coefficients, Remaked index channels and regression tests
- Legacy Remaked MoveSPD explicitly adds +30 for Lightness. Swift Arrow uses the existing attack-interval index channel. Blessed Repose uses the OS MP recovery-speed index; game-client stacking remains unverified and no extra MP per tick is invented.
- Four focused test cases cover gating, numeric application and forged source coefficients. Full PR Node and Chromium acceptance remains required.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.673.0 — 2026.11.12.673 · Hero Book experience, skill groups, tooltips and priest effects

- Defensive chapter: experience-bonus disclosure is always visible, including a clear empty state when no XP source is active.
- Skill Effects: Attack and Defense groups use the exact same chapter/row styling as Healing; original OS Defensive Skills (including «Безболезненность») show class, level, mastery and weapon restrictions, stable effects and honest status instead of pretending previews are activated buffs.
- Consumable-triggered skill names each use a keyboard-focusable hover tooltip containing the current skill description from the OS catalog; both RU and EN supported.
- Passive HP/MP regeneration speed guide now explains «инд.» / idx as an index, NOT elapsed time, and preserves existing editable guide text.
- External Priest «Божественная защита» and «Священное оружие» now affect incoming physical/magical mitigation and light-element weapon aura using Remaked floor rules guarded by current-OS coefficients; invalid, disabled or unselected buffs apply nothing.
- Exact current-server proc damage and stacking still require further game-client parity testing in Issue #5. No speculative rune buffs added.



## 0.672.0 — 2026.11.12.672 · Unified Hero Book cards, buffs and priest songs

- Potion health/status/skill-item and Defense experience sections now use the same interactive glyph, header and right-chevron as other Hero Book chapters, without counts in titles; expanded state survives recalculation.
- Offensive skills now share the Healing row layout and include eligible self-class boosts even when not activated; missing mastery and inactive state are explained.
- Elemental weapon effects chapter always has a recognizable header, with active Phoenix Flame preview when equipped.
- Source-backed readable effects for personal, allied and priest buffs; original OS icons in elemental resistance toggles; compact alignment of guild icons next to skill titles.
- Remaked stat/hymn floor interpolation is adapted to current OS Song coefficient records: enabled Minstrel Song contributes to accuracy and evasion, and Sage Song exposes an elemental-damage rate. Client stacking still needs game validation; further skills remain tracked in issue #5.
- Mandatory Node and Chromium checks on PR plus post-publication Pages/Worker/D1 checks.



## 0.671.0 — 2026.11.12.671 · Hero Book guild, priest, attack and effects

- All seven manual guild passives, source-backed skill ranks and descriptions, compact icons, full counter and source-backed manual damage mitigation / EXP calculations.
- External priest signs and source-scaled group effects are managed within Priest, with readable details even when disabled.
- Title bonuses described in contextual tooltips. Strong Arms has an exact numeric ATK contribution, and elemental weapon effects expand automatically.
- Offensive skill group uses known calculated ATK, accuracy and critical effects, with Incredible Strength source identity but no unverified damage formula.
- Cohesive experience and potion panels, clipped item rows and original game icon sizing.
- Mandatory Node and Chromium checks before publication. No new production D1 writes.



## 0.670.0 — 2026.11.12.670 · Guild skills, ally buffs, priest preview and Hero Book disclosures

- Original Remaked guild RU/EN per-level tooltips and OS skill icons. Seven guild passives appear separately at level 10, with a truthful selected-buff counter; three active Guild Master skills have separate controls.
- Guild physical/magical damage mitigation and experience passives now enter calculated results, alongside existing guild HP, MP and recovery effects.
- Life Sign and original priest signs are grouped with ally buffs; source-backed priest song and weapon enhancements have their own caster-parameter section. Divine Blessing is no longer duplicated in the elemental-resistance list.
- Skill effect summaries use numeric game values when supported, rather than the generic claim that they are counted.
- Attack, Defense, Buffs, Skill Effects and Potion Effects sections support collapsible headings, preserving state across recalculations.
- Unconfirmed rune and server scaling formulas are not invented; Node and Chromium validation required before publication.


## 0.669.0 — 2026.11.12.669 · Remaked party and self-buff coverage

- Linked all 36 Remaked enhancement skill flags to original current OS primary skill IDs. Three unmatched rune slots intentionally remain outside calculated current-game effects.
- 21 previously missing buffs become available in the Hero Book without duplicating 15 existing controls (War Cry, wind group buffs, Life Sign, priest effects and elemental resistances). Party effects belong to any recipient, regardless of the caster's profession, mastery or weapon; self-cast buffs require the active character's class, level, trained mastery and equipped weapon.
- User-friendly exact-source RU/EN names and disabled reasons; true castable spells and preview-only effects are distinguished. Added persistence and shared-build filtering.
- Source-validated Third Eye (+20 and +15% base accuracy), Providence (+25 magic resistance), Cold Blood (+10 crit with axe/Brush 21), Quick Step (+10 dodge with mastery), and Avoidance (+100 dodge with mastery) now affect results. Existing Wind Assist, Wind Blessing and War Cry accept external party casts.
- New source, calculator and Chromium tests; unknown serverside stacking or rune effects are never invented.


## 0.668.0 — 2026.11.12.668 · Hero Book visual and help repairs

- Fixed the oversized skill icons in Effects: hard 26×26 px markup bounds plus guarded CSS, preserving original OS icon identities and fallbacks.
- Moved Mounted help to the visible word itself with editable RU/EN D1 wording, removed technical paragraphs in Attack/Defense/Summary, and simplified game-facing explanations.
- Removed redundant introductory paragraph from Buffs.
- Stabilized admin name/hint buttons as two separate, nonoverlapping controls, including the compact header and mobile breakpoint.
- Added Node assertions and actual Chromium icon-size and hover/owner-toolbar smoke. No game formulas or user D1 overrides changed.


## 0.667.0 — 2026.11.12.667 · Owner inline editing resilience, bilingual CAS failures and draft preservation

- Единый административный редактор D1 предотвращает повторное открытие того же текста двойным кликом или клавишей F2: незаписанный черновик больше не заменяется вложенным полем.
- Во время асинхронной CAS-проверки блокируется именно contenteditable, а не только обычный input. Клавиатурная отмена не прерывает уже отправленную запись.
- При конфликте или отказе сохранения исходный черновик и редактируемость восстанавливаются. Ошибка появляется рядом с полем, не подменяя текущий интерфейс новым toast.
- Административные подсказки полей, валидация и сообщения о проблеме теперь двуязычные RU/EN; добавлены Node и полноценные Chromium-сценарии с замедленной D1-записью и конфликтом.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.666.0 — 2026.11.12.666 · Hero Book clarity, canonical Cverg copy, riding context and original skill art tests

- Книга героя: каноническое русское название расы «Цверг», без автоперевода «дворф»; оригинальное «Упрямое сердце» остаётся неизменным.
- Подсказки источника W оружия, доли характеристик верхом и трёх подтверждённых сопротивлений по игровым описаниям; независимые RU/EN редакторские тексты через действующий D1-интерфейс.
- При выборе режима «Верхом» предупреждение о предварительных расчётах показывается в «Результатах», «Атаке» и «Защите»; сама настройка общая и сохраняется с героем.
- При ошибке загрузки иконки используется исходный клиентский знак вопроса, а не чужое изображение. Расширены Node и Chromium проверки: загрузка оригиналов всех шести запрошенных умений, переключение глав и подсказки.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.665.0 — 2026.11.12.665 · Hero Book skill artwork, game-native resistance names and mounted stat preview

- «Эффекты умений»: иконки настоящих OS-навыков для пяти лечащих заклинаний, периодических умений, песен и «Невероятной силы» через общий каталог рисунков.
- «Защита»: названия сопротивлений строго по описаниям OS-предметов — проклятие, слабость, безумие; RU/EN пояснения для аномалий тела и духа дополнены второй строкой.
- «Атака»: показана настоящая базовая атака надетого оружия W вместо вводящего в заблуждение отдельного бонуса; «Характеристики верхом» и сохраняемый переключатель «Верхом».
- Исторические формулы Remaked дают расчётный вид АТК, точности, уклонения, скорости передвижения, каста и отката при езде; неизвестные показатели защиты и скорости обычных атак не выдумываются. Node-регрессии и общие CI-проверки обязательны до слияния.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.664.0 — 2026.11.12.664 · Canonical game Book terminology and Honor search

- Hero Book «Эффекты умений» and «Усиления» now resolve skill titles by actual numeric current-game skill IDs, with the existing Remaked-approved 327-to-OS identity mapping and official OS RU/EN catalogue as the source of truth. The canonical names cover healing previews, periodic HP/MP recovery, songs, combat buffs and the priest's legacy skill effects.
- Skill mastery branches in effect requirements use the game's RU/EN branch registry: e.g. hymn displays **«Песнопения»**, not an improvised «Гимны». Profession restrictions use actual game class definitions: ACOLYTE is **«Адепт»**, not a literal «Аколит». The two distinct Enchantment preview effects remain disambiguated. English uses official OS skill names rather than Russian fallbacks where available.
- «Защита» preserves the source-backed combat stat and debuff labels; name-source/locale checks cover its results without changing formulas or numeric outputs. Unknown custom data are not guessed or overwritten.
- Encyclopedia → «Честь» search now has its own debounced input listener before the Honor early return. It filters the authored Honor article, PvP locations/wars, rank records and monthly rewards, shows compact bilingual no-results copy, retains the rank-type filter and clickable links, and works with Cyrillic ё/е normalization. The empty-state caption uses the existing D1 inline honor-view copy editor.
- Added source/parity unit tests for all 327 approved skill-to-OS references (including five intentional historical abbreviations and one missing official EN label), and full Chromium tests for actual Book RU/EN rendered terminology, Honor search/filter, no-results, link navigation and mobile styling.
- No user builds, game calculations, class limits, Worker endpoints, production D1 records or scheduled actions changed. HTML footer, cache keys and social-preview version synchronized.



## 0.663.0 — 2026.11.12.663 · Bulk RU/EN D1 copy in four workbench families

- **27 semantic RU/EN editorial fields in one release**: Equipment item picker (10); Item settings and Soul search/slots (6); Encyclopedia search, return-to-top and list/grid view (7); Hero Path skill-search placeholder/filter accessible name (2); visible Origin stats remaining/spent-point prefixes (2).
- One shared, compact owner-only inline editor is reused across all four screen families; pencils open the existing editable text with CAS, autosave-on-blur, Esc cancellation and Undo. Each field stores only RU/EN authored copy under the existing `guideedit.book.*` namespace; shipped defaults remain the offline fallback.
- Live copy refresh updates mounted captions, search placeholders, accessible names, button text and bounded dynamic prefixes without rebuilding the current input, item picker or skill screen. Soul names, player query, character equipment/attributes, game IDs and real-time counts remain external to D1 editorial copy.
- Responsive editor rows, plain-text display, and independent accessibility labels for the Wiki and equipment searches, Soul slots and picker controls. No editable action appears to ordinary users.
- Node data contracts and a real Chromium mock-D1 walkthrough of Encyclopedia, Skills, equipment chooser and item settings. Full CI and live read-only Pages/Worker/D1 readiness are required before claiming publication.
- No game math, Worker route, D1 schema, authentication, user builds or scheduled workflow changes.



## 0.662.0 — 2026.11.12.662 · Owner RU/EN edits for search and empty states

- Four existing semantic RU/EN D1 keys for the saved-build search field label, search placeholder, no matches and empty library are exposed via the existing compact owner-only inline copy editor.
- The live input, active query, filtering, caret, user-scoped saved builds and scrolling remain untouched while CAS writes or Undo update only the displayed text/attributes.
- Dynamic no-results and no-saved-builds notices now have explicit markers for exact in-place refresh; no duplicate native browser tooltips or additional player-facing controls.
- Node tests verify the copy registry and that the refresh path cannot change the search query; real Chromium with six simulated builds checks D1 save, RU/EN independence, no-match filter and 390px viewport.
- No formula changes, account migration, Worker/D1 schema updates or production D1 writes. Release, assets, OG/Twitter preview and footer synchronized.



## 0.661.0 — 2026.11.12.661 · D1-editable four-card action labels

- Open, Overwrite, Share and Delete have four distinct RU/EN `libraryCard*` content keys. The existing decorative icon spans remain separate; button labels are plain readable text with no duplicated symbols.
- Owner-only “Buttons and hints” area now groups action captions and compact hover descriptions. Editing uses the existing inline pencil, RU/EN CAS D1 save, Escape and Undo. Regular players see only the original four card actions.
- Saving and undoing an action label update the mounted button caption directly without remounting the current character or modifying stored builds.
- Prevent legacy literal text localization from overriding explicitly keyed editorial labels during render. New Node semantics regression and extended real Chromium owner save checks.
- Release metadata, GitHub Pages asset cache keys, footer and Telegram/social preview synchronized. No game formulas, Cloudflare Worker endpoints, account logic or production D1 migrations.



## 0.660.0 — 2026.11.12.660 · Owner-only editable RU/EN build action hints

- An owner-only collapsible “Button hints” panel appears inside the authenticated saved-build library. Five short action explanations are editable beside their real labels using the existing tiny pencil and inline text control. No secondary modal or nested interactive buttons.
- The same CAS D1 writing, blur saving, Escape cancellation, Undo and RU/EN override isolation apply. Saving and Undo synchronize the existing mounted action button's game-style popup without remounting saved cards or altering user-created builds.
- Responsive compact three-column editor rows with keyboard focus and wrapping on narrow viewports. Panel stays expanded across normal library re-renders.
- Added a Node regression against player-data exposure and a dedicated isolated real Chromium owner D1-mock scenario for RU/EN writes, keyboard cancellation, tooltip update, mobile layout and preserved character identity.
- Synchronized package, Pages asset versions, footer and social preview. No Worker API change, account migration, game formula or production D1 mutation.



## 0.659.0 — 2026.11.12.659 · Unified four-action library hover help

- Open, Overwrite, Share and Delete use the already established PandoraGuideTooltip styling and lifecycle, with short RU/EN explanations. Delete uses a precise alternative for local-only copies.
- Mouse hover waits 350 ms; keyboard focus is immediate. Tooltip text is plain text; Escape, pointer leave, blur, navigation and scrolling use the existing guide mechanism. Icons are decorative, button names remain accessible, no native title duplication.
- Five semantic hint keys plus two searchable-library field keys use RU/EN fallbacks and existing D1 content overrides; search-empty and no-builds states use semantic translations. Never interpolate usernames, item IDs, shared URLs or build names into tooltip content.
- Node safety/localization regressions and Chromium desktop/mobile real hover, keyboard, viewport, search and language-switch tests.
- Release metadata, footer, assets, Telegram/Open Graph and notes synchronized. No change to character formulas, user library saves, account API or production D1 content.



## 0.658.0 — 2026.11.12.658 · Bilingual build card actions and icons

- All four saved-build actions now have consistently positioned decorative icons: 📂 Open, ↻ Overwrite, 🔗 Share and 🗑 Delete. Buttons retain clear accessible text names.
- The actions, comparison caption, and open/overwrite/delete confirmation copy now follow RU/EN; player-generated build names remain untouched.
- Only one confirmation panel can be expanded per saved-build card at once; keyboard focus moves to its first action.
- Added Node regression and real Chromium card icon checks. Release metadata, footer assets and Telegram/Open Graph previews remain synchronized.
- No user build data, gameplay rules, authentication, link mechanics, live D1 or Worker API changes.

## 0.657.0 — 2026.11.12.657 · Owner-editable shared import counter label and unsaved-work warning

- The shared library import count now consists of an independently editable RU/EN label and a separately rendered **computed count**. The count is never D1-backed or editable.
- The shared character confirmation now separates the incoming player's name from the warning that unsaved changes will be replaced. Only the static warning is D1 owner-editable, the name and character snapshot remain unchanged.
- Two safe semantic keys `ui.label.library-shared-import-count-label` and `ui.label.library-shared-unsaved-warning` reuse the existing owner-only inline pencil and D1 CAS/blur/Escape/Undo semantics, with responsive layouts.
- Extended Node regression for dynamic data isolation, ordinary Chromium share/import flows and the authenticated mock-owner Chromium scenario exercising 6 writes across both languages and all affected captions.
- All release metadata, social-preview descriptions/image cache keys, HTML assets and footer remain synchronized. No live production D1 write or combat/build data mutation.



## 0.656.0 — 2026.11.12.656 · D1 editable shared-link creation statuses and safe error prefix

- Shared build publisher has three separate authored RU/EN inline notes: local-only copy guidance, link creation progress and the fixed introduction to an error. All reuse semantic `ui.label.library-share-*` D1 keys, owner-only pencil controls, bilingual CAS saves, undo and strict fallbacks.
- Runtime Worker error text is now a separate non-editable node; generated share token/URL, saved-build name, public verification and copy-to-clipboard controls remain untouched.
- Removed the instantaneously replaced “Checking saved build…” state, leaving one clear progress status during the actual POST/GET verification.
- Added responsive layout for long RU/EN share notices and error details. Node validates D1 keys and dynamic isolation; Chromium checks real verification-failure DOM, no guest/account pencils and unaffected copy/receiver flow.
- Release metadata, public social-preview descriptions/cache keys, asset versions and footer stay synchronized. No production D1 writes or gameplay changes.



## 0.655.0 — 2026.11.12.655 · Bilingual editable shared-link receiver explanations

- Shared library import modal now separates the computed incoming build count from a short, independently editable RU/EN explanation; imported builds and active draft remain under the existing explicit user action.
- Single shared build confirmation exposes its separate static reassurance that existing saved builds will not be deleted, while the quoted other player's build name and unsaved-work warning remain non-editorial dynamic content.
- Admin-only compact inline pencils reuse existing D1 CAS/blur/Escape/Undo machinery. Notes have stable `ui.label.library-shared-*` keys and bundled RU/EN fallbacks; no admin buttons for guests or ordinary account users.
- Responsive dialog copy rows, node regressions for exact registered text/dynamic isolation, ordinary Chromium share/import checks, and a dedicated authenticated mock-admin Chromium scenario validate both languages and that editing never imports or saves a build.
- No production D1 writes or changes to game formulas, player accounts, shared-link token semantics or build persistence. Social preview metadata also advances to this release automatically.



## 0.654.0 — 2026.11.12.654 · Social link previews and automatic version sync

- Added crawler-visible Open Graph and X Card metadata for Telegram, messengers and social link sharing: canonical title `Pandora Saga | Build Studio`, an English Character Planner summary, RU/EN availability, and current site version.
- Published `assets/social-preview.jpg` as a stable self-hosted screenshot of the real hero creator (1920×1080, shared from the existing reviewed interface capture); image accessibility text and actual dimensions are declared in both cards.
- Automatically bump share-card versions and image cache keys with `release:bump`. The release guard fails when crawler-visible metadata drifts away from the HTML/package/manifest version; no runtime JavaScript or D1 override is needed.
- Added standalone Node metadata/image checks, a fixture-based next-release regression and production read-only checks for served HTML and image. Shared build links with `#b/...` correctly retain the generic site preview without exposing private build details.



## 0.653.0 — 2026.11.12.653 · Owner-editable bilingual build share-link result copy

- Saved-build share result exposes three static RU/EN D1 owner-copy keys for a new link, a reused link, and a short explanation that the link is revoked when its source build is deleted.
- A compact owner-only inline pencil beside each standalone paragraph uses the established CAS save, blur/Escape/Undo and localized fallback. The URL, read-only input, clipboard button, saved character identity and Worker verification are never editor targets.
- Share-result rows wrap text safely on narrow screens. A normal signed-in player sees no pencils; the existing copy action remains usable.
- Node tests exercise exact D1 keys and independent RU/EN overrides; the original Chromium share-link scenario asserts real DOM markers, no guest/normal-user pencils, and unchanged link verification and clipboard behavior. No live D1 writes.



## 0.652.0 — 2026.11.12.652 · RU/EN owner history field and data preview parity

- Fixed the read-only administrator change-history preview: nested chest reward groups now use "Draw" / "Gold" in EN and retain "Розыгрыш" / "Золото" in RU, without changing reward item identity, count, or chance.
- The compatible-slot listing passes the selected locale to existing game slot translations; eligible profession names prefer source-backed EN names, then safely fall back to the recorded source name.
- Known administrative change fields for deleted trade entries, item acquisition sources, spawn locations and other saved values have readable RU/EN captions rather than raw schema field names.
- Mixed-case item hint keys (W/PEN/AC versus kind/level/atkspeed/range/soulslot) now resolve friendly field captions and actual RU/EN source hints, instead of exposing technical schema names or falsely claiming the original hint was unknown.
- Added Node behavioral regressions and an isolated real-Chromium scenario checking RU and EN chest, slot, profession rendering. This release affects only read-only history descriptions. No D1 mutation, build state, catalog contents or formula change.


## 0.651.0 — 2026.11.12.651 · Automatic site version in the footer

- A compact `Version: 0.651.0` label appears at the bottom-right of every page in RU and EN. The encyclopedia counts remain at the bottom-left, including after language changes.
- The label reads the version from the actual HTML release metadata. Future releases update it automatically through the existing `release:bump` process, without manually changing UI text. Update availability keeps showing the running version until the new page is loaded.
- Responsive footer layout for small screens, focused Node tests for version derivation/fallback and release consistency, plus Chromium checks across desktop/mobile layouts. No game data, D1 writes, saved builds, or gameplay formulas changed.

## 0.650.0 — 2026.11.11.650 · Bilingual editable prerequisite caption

- Hero Path skill detail “Предыдущее умение” / “Previous skill” now has a stable RU/EN owner-copy D1 field and compact inline ✎ editor. The referenced skill name stays a separate, non-editable game-data value. When that source record is missing, the fixed RU/EN 'Skill not in catalog' explanation is independently editable, never the actual skill identity.
- The caption and dynamic name remain on one compact accessible row; long owner text wraps without changing the prereq requirement. Keyboard/blur save and Undo use the existing editor mechanism.
- Node behavioral regression covers separate fields, both languages, owner-only pencils, unmodified catalog identity and preserved skill prerequisite. Full Chromium and live release checks are required before merge.

## 0.649.0 — 2026.11.11.649 · Editable Show More and unchanged dynamic count

- Hero Path skill gallery: “Показать ещё” / “Show more” now uses an RU/EN owner-editable D1 caption with a compact separate pencil and inline blur-save/Undo. The numeric count is computed exclusively from the filtered skill catalog and is never stored in D1.
- Ordinary players still see one full paging button; administrators can edit its text without invoking pagination. The button remains keyboard and touch operable, with no nested action button.
- Added Node behavior regression and real Chromium admin scenario for bilingual D1 save, unchanged count and loading the next 24 skills. Game catalog, class allocation and formulas are unchanged.

## 0.648.0 — 2026.11.11.648 · Racial Path inline RU/EN copy

- Disabled Racial row in Hero Path → Special now displays the D1-override RU/EN caption and exposes a separate owner-only pencil. All game/race stats, allocations and branch access remain unchanged.
- Group edit-pencil accessible labels update after D1 save and keyboard focus (including Undo). Editing the pencil never opens or closes a skill group.
- Node behavioral tests cover owner-only pencil, no nested controls, both language defaults, unchanged skills budget and updated pencil accessible name; full browser and production checks are separate.

## 0.647.0 — 2026.11.11.647 · Non-disruptive history reset for UI copy

- “Все правки” / “All edits” → “Вернуть оригинал” / “Restore original” now restores editor-authored equipment, Hero Path, Honor, catalog, profile and generic RU/EN UI copy on the current screen, without reloading the game catalog or replacing an open character/Soul picker. Game-record resets still refresh game data.
- Extended Chromium admin acceptance with a mocked CAS-protected history reset, checking that the previously edited label returns to the EN fallback without changing its DOM node or the active equipped item's 0/2 Soul capacity. Full Node regressions and browser smoke are required before merge; live D1 writes are outside this scope.
- Kept the existing compact item properties unchanged: the installed-Souls listing is not redundantly inserted into the properties tab, where the dedicated Souls tab already manages that content.

## 0.646.0 — 2026.11.11.646 · Hero Book Buff bilingual defaults

- Buff chapter's guide fields now receive separate Russian and English defaults instead of sending the current locale value to both D1 columns. Five section headings and nine settings retain stable semantic keys, inline editing and undo; existing D1 overrides take precedence.
- Fixed English fallback for previously Russian-only guide captions such as guild HP/MP, attributes, and combat skills. The change affects only text, not gameplay bonuses, character state or settings.
- Fixed the shared client/Worker key allowlist to preserve safe camelCase IDs such as `buffs.setting.guildHp`; previously, these valid UI settings were rejected for D1 saving. Non-alphanumeric or malformed keys remain prohibited. Added real Worker CAS validation and Chromium language-switch tests; production deployment requires separate verification.


## 0.645.0 — 2026.11.11.645 · Bilingual administrator review dialogs

- Two admin review dialogs (English translations and GitHub export) have source-backed RU/EN introductory explanations and safe D1 inline ✎ editors. Translation/save and GitHub/create labels have independent D1 copy fields and separate pencils, never nested in their action buttons.
- EN modal titles, status text, actions and feedback render in English; live record/translation counts and imported row values remain read-only. Export and translation actions still use the existing D1 CAS/fingerprint checks. No game formulas, character states, tokens, or catalog values are made editable.
- Existing history/undo and owner-copy refresh now handle `owner-dialog`. Long text grows inside the same modal; mobile pencils remain independent.
- Node key contract and Chromium authenticated admin mock cover separate RU/EN fallback, D1 captions, dynamic counts and no accidental GitHub publication.
- Merge only after Node and Chromium, then verify Pages and Worker readiness independently.


## 0.644.0 — 2026.11.11.644 · Owner change history inline D1 help editing

- The administrator's “All manual edits” view now has two real RU/EN D1-authored help captions (intro and empty-search message), with separate compact ✎ buttons, double-click, keyboard entry, growing input, CAS on save and Undo without dismissing the modal.
- Only static explanatory text is editable. The change counter, before/after values, record titles, player data and game-catalog values remain read-only.
- Browser admin mock checks the real in-modal D1 write and verifies that no game-source or catalog-publish action is triggered; Node protects supported keys and safe editor scope.
- No production D1 writes during CI. Pages and Worker readiness must be checked after merge.


## 0.643.0 — 2026.11.11.643 · D1 catalog choices and centered Book heading

- Catalog review: static RU/EN text for both optional comparison checkboxes is independently editable in D1 with the existing CAS/Undo editor. Dynamic selection counts are separate, noneditable nodes; editing cannot toggle a checkbox or publish catalog data.
- Hero Book: restore true centered “КНИГА ГЕРОЯ · 1/6” and chapter title by balancing navigation gutters, including mobile. In narrow owner mode, editorial controls move below rather than overlapping the heading.
- Node regression and full Chromium visual geometry check cover the six Book chapters in RU desktop and EN mobile; authenticated admin smoke checks checkbox captions, isolation from actions and a mocked D1 save.
- Production game data, saved builds and formulas remain unchanged.
- Publish only after Node and Chromium pass; verify Pages and Worker readiness separately.


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



## 0.620.0 — 2026.11.11.620 · Touch access to Honor rank texts

- В режиме администратора описания рангов, требования, привилегии, названия и другие авторские тексты Чести получили компактную отдельную кнопку ✎. Посетитель видит прежнюю разметку; поля редактируются через существующий D1 CAS/Undo.
- Позиционирование требований и привилегий внутри двухколоночной карточки сохранено. Карандаши умеренно приглушены при работе мышью и видны на сенсорных устройствах.
- После сохранения RU/EN подписей общего блока и фильтра рангов обновляется также доступное название соответствующей кнопки ✎; действия фильтра остаются неизменными.
- Добавлены узкие Node-контракты и обновлён прежний тест в связи с появлением callback. Chromium и релизная проверка должны пройти перед слиянием.



## 0.619.0 — 2026.11.11.619 · Honor touch and keyboard editing

- Заголовки разделов Чести, название PvP-войны и три блока ежемесячных наград получили отдельные компактные ✎, доступные на сенсорных устройствах и с клавиатуры.
- Многострочные пояснения и требования рангов теперь открывают существующий редактор по F2, а однострочные подписи сохраняют Enter; редактирование не запускает навигацию и не меняет игровые записи.
- Добавлены узкие Node-регрессии для независимой компоновки и клавиатуры. Публикация требует штатных GitHub Actions Node/Chromium. Production D1 CAS #203 остаётся отдельной проверкой.


## 0.618.0 — 2026.11.11.618 · Безопасная компоновка редактирования направлений Пути героя

- В «Пути героя» карандаш ✎ больше не является вложенным интерактивным элементом кнопки раскрытия направления: это отдельная настоящая кнопка справа от основного заголовка.
- Редактирование названия по-прежнему использует существующую RU/EN D1-запись `book.path.group.*`, сохранение по потере фокуса и CAS/Undo. Обычное нажатие на заголовок раскрывает/сворачивает ветку, отдельный ✎ не запускает раскрытие и не тратит очки.
- Кнопки выровнены в единую компактную строку; доступ с клавиатуры и тач-экрана не требует вложенного `role=button`. В обычном режиме игрок видит только раскрывающую кнопку.
- Добавлены Node-регрессия корректной HTML-структуры и браузерная проверка публичного режима. Полный Node и Chromium CI — при PR. Игровые формулы, очки, D1-данные и уровни не менялись.

## 0.617.0 — 2026.11.11.617 · Редактируемые фильтры рангов без изменения счётчиков

- Три RU/EN-подписи фильтров рангов в энциклопедии «Честь» получили собственные D1-ключи `book.honor-view.filter-{all,standard,monthly}`.
- Числа рангов берутся из реальных записей, остаются недоступными для редакторского изменения. Карандаш ✎ находится рядом с кнопкой фильтра, но не внутри неё; редактирование и отмена не изменяют выбранный фильтр и видимость рангов.
- Поддерживаются двойной клик/F2, сохранение по потере фокуса, Esc и Undo через единый админский редактор с CAS.
- Node-контракты проверяют допустимость ключей, счётчики и изоляцию действий; Chromium проверяет пользовательские подписи, фильтрацию 12/9/3, административную правку и Undo с тестовым Worker.
- Игровые формулы и данные D1 не менялись. Issue #390 остаётся открытым для остальных интерфейсных текстов.

## 0.616.0 — 2026.11.11.616 · Редактируемые RU/EN подписи раздела «Честь»

- Пять стабильных D1-ключей `book.honor-view.*` добавлены к интерфейсным подписям энциклопедии «Честь»: вводный подзаголовок, заголовки PvP-локаций и войн, обозначение отдельной войны, заголовок наград.
- В режиме администратора компактный ✎ расположен рядом с подписью, редактирование идёт внутри неё: двойной клик/F2, автосохранение по потере фокуса, Esc, проверка конфликтов и Undo через существующий редактор. Пользовательская разметка и поведение ссылок/фильтров не меняются.
- Браузерный тест проверяет запись RU и EN в одну D1-запись без потери другой локали, число рангов и отсутствие смещения элементов. Новые Node-контракты проверяют разрешённые ключи и привязки редактора.
- Игровые тексты, ранги, их награды, формулы и отношения с локациями не менялись. Продакшн D1 не модифицировалась; Issue #390 остаётся открытым.

## 0.615.0 — 2026.11.11.615 · Редактируемые подсказки поиска и раскрывающихся разделов каталога

- В админском окне синхронизации каталога у поиска, архивной сверки и дополнительных инструментов появились отдельные редактируемые RU/EN подсказки `book.catalog-sync.hint-search`, `hint-archive-disclosure`, `hint-advanced-disclosure`.
- Для заголовков `details` редактор `?` размещён вне самого `summary`; редактирование не раскрывает и не закрывает панель, не вызывает публикацию и не меняет пользовательский выбор.
- Оригинальные input, поиск и подсказки не пересоздаются при правке; сохранение/Undo обновляют текст на существующем узле без новой подписки на hover, с D1 CAS и RU/EN. UI остаётся компактным на узком экране.
- Дополнены Node-контракты и Chromium сценарий реального администраторского редактирования трёх подсказок в mocked D1. Issue #390 остаётся открытой для остального сайта и production CAS-приёмки.


## 0.614.0 — 2026.11.11.614 · RU/EN D1-редактура всплывающих подсказок действий сверки каталога

- Девять всплывающих пояснений к основным действиям синхронизации игрового каталога получили RU/EN D1-ключи `book.catalog-sync.hint-*`. Редактирование подсказки по кнопке `?` находится отдельно от запуска действия и переименования основной кнопки.
- Общий модуль всплывающих подсказок читает актуальный безопасный текст из `data-guide-hint` в момент показа. После сохранения и Undo новый/восстановленный текст доступен немедленно на прежнем DOM-элементе, без дополнительных обработчиков и перезагрузки страницы.
- Пояснения поиска и разделов «Архив»/«Дополнительные инструменты» получили английские значения по умолчанию; D1-правки этих вторичных подсказок остаются отдельным незакрытым этапом.
- Chromium проверяет реальную D1-правку подсказки у живой проверки источника и отсутствие лишних запросов к игровым данным. Node-контракты проверяют безопасный текст, 9 разрешённых ключей и синхронизацию Undo.
- Формулы, значения каталога, ID и действие публикации не изменяются; Issue #390 остаётся открытым для других модулей и неохваченных подсказок.


## 0.613.0 — 2026.11.11.613 · Редактируемые RU/EN статусы сверки каталога без редактирования диагностики

- Фиксированные сообщения о состоянии сверки и предупреждения о live/архивном источнике получили компактные кнопки ✎ рядом с текстом, с RU/EN D1-правкой, F2, автосохранением при выходе из поля, Esc и существующей CAS/Undo-семантикой.
- Редактирование работает внутри открытого административного окна и не запускает публикацию, проверку D1, скачивание источников или создание GitHub PR; редактируемая подпись отделена от реального игрового действия.
- Количество обработанных файлов, динамические данные Worker и технические ошибки остаются только для чтения; при переходе к следующему состоянию временный редактор исчезает, а актуальный фиксированный статус получает собственный безопасный ключ.
- Добавлена браузерная проверка сохранения из действующего архивного сравнения в mocked D1 без повторных запросов к игровому источнику. Issue #390 остаётся открытым для неподдерживаемых сообщений и разделов.


## 0.612.0 — 2026.11.11.612 · RU/EN результаты сверки каталога и сохранение редакторов пояснений

- Исправлена потеря администраторских ✎ у `checksumExplanation`, `formattingExplanation` и `russianDescriptionExplanation`: результаты сверки больше не заменяют DOM редактора; контрольные суммы показываются отдельным read-only пояснением.
- Восстановлено использование RU/EN D1-подписей `russianDescriptionsLabel` и `formattingLabel` после перерисовок, с отдельными вычисленными количествами.
- Добавлены английские подписи фильтров, результатов сравнения, количества изменений, карточек связанных предметов, предупреждений и действий внутри результатов. Числовые и игровые поля не становятся изменяемым интерфейсным контентом.
- Шаблонные статусы завершения сверки и сообщения об отказе без подробностей сервера используют отдельные `book.catalog-sync.*` RU/EN ключи; ошибки Worker и динамические значения остаются диагностикой, а не произвольным редактируемым текстом.
- Дополнена Chromium-проверка реального редактора контрольных сумм после архивной сверки и отдельные Node-регрессии. Issue #390 остаётся открытым: непокрытые динамические ошибки, часть подсказок и другие модули требуют отдельной проверки.


## 0.611.0 — 2026.11.11.611 · Редактируемые RU/EN подписи обновления игрового каталога и отдельные безопасные карандаши действий

- В окне администратора «Обновление игрового каталога» RU/EN названия основных действий и объяснения стали редактируемыми по месту через `guideedit.book.catalog-sync.*`. Никакие игровые ID, сравнения каталогов и значения параметров не подменяются.
- Редактор кнопки находится в отдельной компактной оболочке, а не внутри её кликабельной области. Изменение текста не запускает `publish`, создание GitHub PR, проверку D1 или выбор изменений.
- Сохранение и Undo обновляют надпись без полной перерисовки открытой модалки. Оригинальные RU значения остаются локальным fallback; английские значения отображаются при EN-локали.
- Добавлены RU/EN заголовки разделов, подписи поиска, пояснения форматирования/русских описаний, но не все динамические сообщения о сравнении и серверных ошибках: Issue #390 остаётся открытой.
- Node-контракты безопасности редактора, Chromium и публикация проверяются отдельно до выпуска.


## 0.610.0 — 2026.11.11.610 · Дополнительные RU/EN подсказки экипировки, подписи навыков и стабильный клавиатурный редактор

- В окне экипировки сообщения об отсутствии предмета и совместимых душ, ограничении результатов и подсказка занятых слотов получили отдельные RU/EN ключи `guideedit.book.equipment.*`, редактируемые на месте.
- В Пути героя и карточке умения переименовываются подписи уровня, маны, времени подготовки, перезарядки, дальности, стихии, характеристики, требований и статические сообщения состояний веток и поиска. Величины и игровые данные не изменяются.
- Общий редактор фиксирует язык при открытии, поддерживает F2/Enter для неинтерактивных надписей, не создаёт вложенные фокусируемые элементы внутри кнопок. Убрана двойная CSS-иконка карандаша, добавлен видимый фокус.
- Добавлены Node-регрессии. Chromium и публикация должны быть проверены отдельно перед merge. Issue #390 остаётся открытым для остальных модулей.


## 0.609.0 — 2026.11.11.609 · Стабильное RU/EN уведомление, встроенная ошибка CAS и новые D1-редактируемые сообщения

- Исправлено переключение RU/EN уже открытого уведомления без замены DOM-элемента, сброса текущего редактора и потери идентификатора D1; заголовок и aria-подпись карандаша следуют языку сайта.
- Если owner-правка текста самого toast получает CAS 409 или сетевую ошибку, сообщение об ошибке выводится внутри уже открытого редактора; поле и введённый текст не уничтожаются новым toast.
- Запоминается язык на момент открытия inline-редактора уведомления/библиотеки/аккаунта: переключение языка не запишет старую RU-надпись в английский D1-перевод.
- Добавлены восемь безопасных админских RU/EN-уведомлений о сохранении, проверке D1 и экспорте PR, редактируемых по месту в D1. Динамические ошибки сервера и пользовательские данные не включены.
- Исправлено сохранение в браузере: toast больше не получает заранее переведённый текст и сохраняет стабильный редакторский D1 ключ.
- Node-контракты и Chromium сценарий RU/EN, сохранения и отказа D1 CAS 409 с сохранением несохранённого текста.
- Issue #390 остаётся открытым: охват специфичных сообщений и подсказок всех остальных динамических модулей пока неполон.


## 0.608.0 — 2026.11.10.608 · RU/EN-редактура подписей профиля и карточки персонажа без изменения пользовательских данных

- Ещё 12 стабильных авторских RU/EN-подписей профиля героя и карточек персонажа доступны через уже существующие `guideedit.book.profile.*` в production D1, включая имена полей, заметку, видимые заголовки и помощь.
- Админ видит компактную кнопку `✎` рядом с надписью; двукратный клик и F2 тоже работают. Редактирование и Undo обновляют текст и относящиеся к нему доступные атрибуты, не пересоздавая поля ввода и не меняя значения персонажа.
- Привязка `label for` к пользовательскому полю сохраняется; редактор не захватывает сохранённые пользовательские имена, гильдию или описание.
- Ветви профиля и второстепенные динамические состояния остаются частью более широкой незакрытой задачи #390, без утверждения стопроцентного охвата.


## 0.607.0 — 2026.11.10.607 · Компактная Книга героя, ровные админские редакторы и изолированный production D1 тест

- Полностью переработана компоновка сворачиваемых групп результатов: выровненные заголовки, отдельная стрелка раскрытия, единые границы и отступы, улучшенная мобильная компоновка при сохранении доступности клавиатурой.
- Администраторские действия «переименовать»/«пояснить» объединены в компактные инструменты, больше не перекрывают названия и числа; у полей предметов редактор появляется полной строкой под характеристикой.
- Исправлена преждевременная перерисовка Книги героя во время сохранения D1: ввод закрывается первым, затем обновляется отображение.
- Дополнительно охвачены 14 фиксированных RU/EN-уведомлений о билдах, общих ссылках и зависимостях записей; динамические данные пользователя и сообщения сервера не превращаются в редакторские поля.
- Изолированная production-проверка настоящего admin override API, D1 RU/EN readback, CAS-конфликта, отмены и гарантированной уборки временных записей/сеанса через существующую Cloudflare CI-связку. Это QA-сеанс, а не личная администраторская авторизация пользователя.
- Issue #390 остаётся открытым до полной инвентаризации и UX-проверки остальных динамических текстов и подсказок.


## 0.606.0 — 2026.11.10.606 · Явные RU/EN-редакторы подписей в Происхождении, Пути и Книге героя, D1-правки уведомлений о билдах

- Визуально доступные маленькие карандаши у названий главных областей Происхождения/Образа/Пути, а также у подписей мастерства и распределения очков.
- Для Книги героя отдельные доступные действия ✎ для изменения названия и ? для изменения подсказки через независимые RU/EN поля в D1.
- Восемь безопасных шаблонных уведомлений библиотеки билдов получили собственные D1 RU/EN-ключи и редактирование по месту; серверные сообщения и пользовательские значения не изменяются. Сохранение подписи не сбрасывает билды и Книгу героя.
- Node и Chromium регрессионные тесты; публикацию Pages, реальную авторизованную D1-запись и оставшийся аудит Issue #390 проверять отдельно.


## 0.605.0 — 2026.11.10.605 · Редактирование RU/EN-названий параметров предметов и сворачиваемые результаты Книги героя

- Редактирование RU/EN-названий параметров предметов и сворачиваемые результаты Книги героя: подписи Тип/Уровень/Атака/Пробитие/Защита/Скорость атаки/Дальность/Слоты душ сохраняются отдельно от подсказок в D1 без изменения игрового каталога.
- В Книге героя четыре результатных раздела раскрыты по умолчанию, сворачиваются независимо, сохраняют состояние при пересчёте; дублирующий заголовок убран.
- Подтверждение реального сохранения в production D1 при личной администраторской авторизации остаётся отдельным шагом, не подменяется моками CI.


## 0.604.0 — 2026.11.10.604 · Отмена D1-правок надписей без сброса открытой библиотеки и введённого названия

- Отмена D1-правок надписей без сброса открытой библиотеки и введённого названия; точечное обновление после сохранения/отмены вместо перерисовки всего каталога.
- Защита активного поля названия билда, настроек сравнения и позиции прокрутки; отдельные Node- и Chromium-регрессии.
- Публикацию GitHub Pages и реальную D1-запись необходимо проверять отдельно.


## 0.603.0 — 2026.11.10.603 · RU/EN-редактирование 24 подписей библиотеки билдов на месте через D1 с проверками

- RU/EN-редактирование 24 подписей библиотеки билдов на месте через D1 с проверками. 24 семантических ключа для статических подписей библиотеки; данные персонажей, имена билдов и серверные ответы неизменны.
- Вход через аккаунт и редактирование по месту: клавиатура, карандаш, двойной клик; D1 CAS, blur, RU/EN.
- Node и Chromium regression-тесты; результаты CI и публикацию GitHub Pages проверять отдельно.


## 0.602.0 — 2026.11.10.602 · RU/EN-тексты аккаунта редактируются в Cloudflare D1 прямо на странице

- 21 видимая надпись, подпись кнопки или короткое пояснение в окне аккаунта получили стабильный семантический RU/EN-ключ. Авторизованный администратор редактирует текст на месте двойным кликом или компактным карандашом, без отдельного модального редактора; потеря фокуса сохраняет через существующий защищённый Worker.
- Тексты заголовка, описания входа, резервного кода, информации об облачных билдах и кнопок корректно возвращаются к исходным при отмене. Изменения языков хранятся независимо и переживают перестроение формы.
- Не изменяются содержимое полей логина/пароля, реальный код восстановления, учётные данные, серверные сообщения, механика авторизации, сохранения билдов или игровые расчёты.
- Добавлены Node и Chromium-регрессии D1, редактирования аккаунта и сохранения введённого логина при переключении языка.
- Оставшиеся неразмеченные динамические строки продолжают отслеживаться в Issue #390: это пакет расширения, а не заявление о завершении всего аудита.



## 0.601.0 — 2026.11.10.601 · Редактирование RU/EN-подсказок предметов и базовых надписей сайта через D1 прямо в интерфейсе

- Для администратора включено компактное редактирование на месте: двойной клик по подписи или небольшой карандаш рядом с интерактивным элементом, сохранение при уходе с поля без нового модального окна.
- Все подсказки полей предметов в энциклопедии подключены к существующему защищённому D1 `overrides`: независимые RU/EN тексты с fallback; ошибки сети/конфликты не перезаписывают чужие правки.
- В существующей таблице D1 сохраняются также администраторские изменения зарегистрированных RU/EN-подписей, статических подсказок, placeholder и aria-label сайта. Не изменяются игровые названия, характеристики, физическая/магическая АТК.
- Тексты «Атака», «Пробитие», «Дальность» сокращены. Убраны неподтверждённые утверждения об игнорировании защиты и лишние объяснения бонусов.
- Уточнено влияние PEN по игровым измерениям: только установленный в текущем проекте расчёт нижней границы физической АТК; «Пробитие блока» является другим параметром.
- Аудит `docs/UI_COPY_AND_PEN_AUDIT_2026-11-10.md` выделяет остаток динамических/неразмеченных интерфейсных текстов, ещё не связанных с D1 — не выдавать их за завершённое покрытие.
- Добавлены unit и Chromium регрессии редакторов, CAS, RU/EN и подсказок. Публичную публикацию GitHub Pages и облачное состояние проверять отдельно.



## 0.600.0 — 2026.11.10.600 · понятные подсказки характеристик оружия

- Наведение на «Пробитие» в энциклопедии объясняет параметр PEN как разброс физической АТК: при одинаковом максимуме и мастерстве больше PEN означает более низкий минимум; влияние на защиту цели не подтверждено.
- Подсказка «Атака» уточняет, что показатель W — базовая физическая АТК оружия до СИЛ, физической заточки и остальных усилений.
- Подсказка «Дальность» уточняет, что это базовая дальность атаки этим оружием (дополнительные бонусы считаются отдельно).
- Все подсказки свойств предметов переведены на RU/EN согласно текущему языку энциклопедии. Добавлены регрессионные проверки текстов и подключения к UI.
- Формулы физической АТК, магической АТК, предметы, пассивные навыки и облачный D1 не изменены.
- Сборка браузера, CI и публикация GitHub Pages проверяются отдельно.


## 0.599.0 — 2026.11.10.599 · Универсальный диапазон физической АТК по PEN оружия и действующему зелёному мастерству

- Новая универсальная модель отображения физической АТК: D=floor(100×PEN/(200+6×зелёное мастерство оружейной ветки)); MIN=MAX-floor(MAX×D/100).
- В Книге героя диапазон MIN–MAX отображается при доступных данных; сравнение двух билдов показывает оба значения, а приоритет максимальной АТК сохраняется.
- Формула применяется ко всем поддерживаемым видам оружия, включая жезлы и посохи. Физические самоцветы увеличивают физическую атаку по таблице заточки; магические самоцветы не подмешивают физическую заточку. МАТК не изменялась.
- Добавлены 41 игровой эталон на всаднике, охотнике и воине; 250 синтетических случаев и отдельные интеграционные проверки арбалетов, древкового оружия, жезлов и посохов. Старые неподтверждённые показания не применяются.
- Проверяемость за пределами измеренных типов оружия остаётся предметом расширения тестов, а не индивидуальных подстановок.

## 0.598.0 — 2026.11.10.598 · отказ от жёстко заданного минимума атаки

- По требованию владельца удалены **все три частных runtime-исключения** min–max АТК: Энкиду/Всадник 45 с копьём, эльф/воин 1 уровня с коротким мечом и эльф/лучник 45 с тяжёлым арбалетом. Скриншоты и измерения оставлены только в исследовательских документах и тестовых эталонах.
- Для любого персонажа Книга героя показывает **рассчитанную максимальную АТК**, пока не найдена общая и проверенная по игровому клиенту формула минимальной. Неизвестный минимум не подменяется числом из каталога отдельных билдов.
- Изучен JavaScript игрового калькулятора: опубликована формула `damage_min=damage_max-floor(damage_max*damage_potential/100)`, `damage_potential=roundHalfEven(PEN/(200+6*weaponProficiency)*100)` и карта категорий оружия→веток; но этот диапазон **боевой модели** пока не подтверждён как диапазон АТК **окна персонажа**. Примеры 74/5/90 и 219/56/80 не воспроизводят известные игровые минимумы. Не копируем в UI неподтверждённую формулу.
- Дополнены тесты на отсутствие специализирующих lookup-таблиц и на отображение только max. Макс-АТК 219/266 и аналогичные подтверждённые результаты релиза 0.596.0 сохранены. [Issue #238](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/238) и [#5](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5) остаются открыты.


## 0.597.0 — 2026.11.10.597 · проверенные диапазоны атаки Энкиду-всадника

- Книга героя теперь выводит **189–219** без «Боевого клича» и **229–266** с ним для **строго того самого проверенного игрового билда** Энкиду/Всадник 45 уровня, с W90 копьём Зефира +8, паспортными предметами и душами, зелёным мастерством «Колющий» 56 и полным распределением веток.
- Это подтверждённый игровой диапазон, **не универсальная формула минимума АТК**. Проверяются все ID и заточки вещей/душ, полный набор зелёного мастерства, раса через пассивку, профессия, оружие, характеристики, итоговые DEF/ACC/DODGE и выбранный баф. При изменении условий неизвестный минимум снова скрывается вместо выдуманного результата.
- Добавлены негативные проверки: другое распределение зелёного при том же общем суммарном мастерстве, удалённая душа, другая расовая пассивка, активный лишний баф, другое оружие. Проверяется реальное построение зелёного мастерства из 54 оч. в Колющий и 50 оч. в Верховая езда через `PandoraSkillProgression`.
- [Issue #238](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/238) **остаётся открытой**: формула минимумов для остальных оружий и персонажей требует измерений при разных значениях натренированного мастерства. [Issue #5](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5) о полном боевом паритете также открыта. Максимальная АТК и заточка из 0.596.0 не изменены.


## 0.596.0 — 2026.11.10.596 · игровые расчёты максимальной АТК

- Исправлен физический расчёт: процент за силу применяется к **базовой W** оружия; физическая заточка из `weaponPlus` добавляется **после** масштабирования W. Старый Legacy умножал ещё и заточку, завышая АТК.
- Используется формула OS `floor(floor(STR/10)^2/2)%`, включая новые по отношению к старому Remaked пороги выше 120 СИЛ (120 = +72%, 130 = +84%, 140 = +98%, 200 = +200%).
- В подтверждённом игровом сценарии «Сильные руки» и «Боевой клич» округляют отдельные проценты **вниз** от базовой АТК (до плоских бонусов экипировки): `floor(base*12%)`, `10+floor(base*20%)`.
- Реальные проверки тестера: Энкиду-всадник 45, W90 +8, СИЛ72: **219/266**; СИЛ71 (разные снятые предметы) **218/265**; СИЛ70 **218/265**; обычное копьё +0 СИЛ71 **174**. Обновлены тесты, расчётные эталоны и документация Issue #386.
- Не затронуты защита 72, точность 99, уклонение 144, сопротивления 9/4/10, зафиксированная OS таблица улучшений, билд-сохранения и D1. Неизвестная формула **минимальной** АТК остаётся в Issue #238, остальные боевые эффекты требуют проверки по отдельности.


## 0.595.0 — 2026.11.10.595 · точные категории оружия и классовая пассивка

- Расовые оружейные пассивки теперь проверяют реальный `weaponUse` навыка из OS skills.json, а не только признак «одноручное/двуручное». Это предотвращает бонусы на неподдерживаемых типах оружия. «Сильные руки» корректно распознаёт копьё `POLE_ARM`.
- «Невероятная сила» (ID 910110001) класса Всадник отображается в «Эффектах умений» как пассивка урона при попадании. Исходный `EP_ONHIT_FIN_DAMAGE_CONST` не должен искусственно увеличивать числовую АТК: без подтверждённой серверной формулы урона за удар фиксированные значения не выводятся.
- Автотесты проверяют реальный ID/тип оружия, условия класса/уровня, невмешательство урона при попадании в статус АТК и невалидные источники навыков.
- **Известное несовпадение не закрыто:** игровая АТК Энкиду-всадника 45 при +8 копье (219/266) против прежней Legacy-формулы (231/281). Данные для воспроизведения, математическая гипотеза и риски обобщения записаны в [Issue #386](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/386). На основании одной сборки глобальную таблицу силы не меняем.


## 0.594.0 — 2026.11.10.594 · Расовая атака Энкиду и компактные кнопки слотов душ

- Бонус «Сильные руки» Энкиду (+12%) теперь входит в итоговую АТК при подходящем двуручном оружии (в том числе копьё всадника). Используется исходное отдельное округление вверх Remaked Legacy Calc('ATK'), а не процент от итоговой суммы всех усилений. При смене пассивки или типа оружия бонус пропадает.
- Те же подтверждённые поля `EP_SKILL_EQUIP_DAMAGERATE` учитываются для подходящих оружейных пассивок человека и цверга: фиксированный и процентный бонусы независимы.
- Четыре кнопки настройки количества слотов душ 0–3 остаются в одну строку и получают высоту 26 px. Сами слоты вставленных душ, заточка и селектор стихии не затронуты.
- Добавлены Node-регрессии: Энкиду/всадник/двуручное копьё с +3, замена пассивки, несовместимое оружие, другие расовые оружейные эффекты и компактная сетка.


## 0.593.0 — 2026.11.10.593 · Клавиатурная доступность диалогов и подтверждений

- Клавиатурная доступность диалогов и подтверждений.
- Общие модальные окна ставят фокус на заголовок вместо потенциально опасной кнопки подтверждения. Tab/Shift+Tab циклически обходят видимые доступные элементы, Escape закрывает диалог и возвращает фокус исходной кнопке, если она ещё в DOM.
- На заголовке есть видимая подсветка клавиатурного фокуса. Обработка клика по фону остаётся прежней, без новых технических подсказок.
- Отдельная Chromium-проверка гостевого диалога входа на широком экране и мобильной ширине: клавиатура, невыходящий за границы фокус, сохранность черновика и ссылки #b.
- Не менялись правила сохранения билдов, бизнес-данные или D1; ручная UX-приёмка всего сайта по Issue #3 остаётся открытой.


## 0.592.0 — 2026.11.10.592 · Устойчивый перенос безымянного черновика и проверки гостевой авторизации

- Устойчивый перенос безымянного черновика и проверки гостевой авторизации.
- При выборе продолжения гостевого героя безымянный несохранённый черновик аккаунта предварительно явно сохраняется как «Новый герой» / «New hero», а не блокирует действие без сообщения; отказ localStorage по-прежнему отменяет переключение.
- Из закрытого как superseded PR #377 в актуальные Node-проверки перенесена регрессия: анонимный GET и старый гостевой ключ получают 401, разрешённый аккаунт с неподдерживаемым GET — 405, без обращений к D1-данным билдов.
- В Chromium добавлен сценарий гостевой → существующий аккаунт с безымянным черновиком; недописанные/чужие данные не удаляются.
- Предпосылки и результаты проверки PR/публикации отмечаются отдельно; игровой каталог и production D1 не менялись вручную.


## 0.591.0 — 2026.11.10.591 · Предупреждение о несохранённом черновике при ошибке хранилища браузера

- Предупреждение о несохранённом черновике при ошибке хранилища браузера.
- В мастерской героя при сбое записи localStorage показывается одно компактное RU/EN-предупреждение: изменения пока видны, но могут потеряться после перезагрузки.
- Повторные ошибки от ползунков не создают дубликаты; предупреждение автоматически пропадает после успешной записи черновика.
- Node и реальный Chromium проверяют гостевой/аккаунтный сценарии, заполненное хранилище и восстановление.
- Проверки PR и опубликованной Pages/Worker фиксируются отдельно.


## 0.590.0 — 2026.11.10.590 · Понятные сообщения билдов, сохранение второго черновика и безопасный импорт ссылок

- Понятные сообщения билдов, сохранение второго черновика и безопасный импорт ссылок.
- При конфликте гостевого и аккаунтного черновиков показаны обе версии, сохранение героя аккаунта выполняется только по явной кнопке; отказ браузерного хранилища не переключает героя.
- Предупреждения RU/EN различают локальное сохранение и подтверждение облака, а после перехода гостевого героя напоминают явно сохранить его в библиотеку.
- Импорт ссылок с библиотекой использует компактное подтверждение, проверку аккаунта и предела записей, без браузерного alert.
- Проверки Node/Chromium и опубликованного Pages/Worker — отдельно по итоговому коммиту.


## 0.589.0 — 2026.11.09.589 · Безопасный выбор гостевого или аккаунтного героя перед открытием чужой ссылки

- Безопасный выбор гостевого или аккаунтного героя перед открытием чужой ссылки. При существующем черновике аккаунта гостевой герой не переписывает его без явного выбора.
- При открытии ссылки сохраняется исходный гостевой черновик, если выбрана эта версия; экран чужого билда показывается после выбора.
- Chromium проверяет выбор обеих версий и отказ от чужой ссылки без потери выбранного героя.
- Публикация Pages и проверка Worker после объединения подтверждаются отдельно.


## 0.588.0 — 2026.11.09.588 · Гостевой черновик сохраняется при входе через профиль; плавное открытие и закрытие профиля

- Гостевой черновик сохраняется при входе через профиль; плавное открытие и закрытие профиля.
- Сохранение гостевого героя после входа через профиль, регистрация и конфликт с черновиком аккаунта проверяются в Chromium.
- Устранены дублирующие старые CSS-правила кнопки выхода.
- Публикация Pages и проверка Worker после объединения подтверждаются отдельно.


## 0.587.0 — 2026.11.09.587 · приёмка аккаунтной библиотеки и гостевого переноса

- Проверка аккаунта в read-only импорте старой библиотеки запускается раньше проверки метода: анонимный GET и гостевой ключ теперь всегда получают HTTP 401 вместо 405. Для вошедшего пользователя GET остаётся запрещённым (405), POST-предпросмотр и перенос сохраняют прежние правила.
- Node-регрессия отдельно проверяет оба метода с гостем, старым ключом и действующей сессией. Миграции D1, игровые формулы, пользовательские сохранения и cron Actions не менялись.
- Повторная публикация Worker и read-only проверка Pages/Worker/D1 подтвердят корректность релиза отдельно.

## 0.586.0 — 2026.11.09.586 · сохранённые билды только для аккаунтов

- Гость может планировать персонажа, но «Мои билды» отображают компактную RU/EN карточку «Войти»/«Регистрация». Внутренние операции сохранения, открытия, сравнения и публикации запрещены без входа, а не просто спрятаны.
- Worker проверяет действительный аккаунт для GET/POST `/api/library`, POST `/api/shared` и GET `/api/shared/<id>`; старый гостевой ключ не является учётной сессией. Сохранённые ссылки и их отзыв остаются привязаны к исходному билду.
- После входа можно открыть чужую ссылку `#b/...`; при регистрации пользователь сначала видит резервный код. Старые запросы другого аккаунта не должны подменять актуальные ответы.
- Старые гостевые библиотеки можно найти по старому коду либо на этом устройстве, предварительно просмотреть через отдельный аккаунтный read-only API и импортировать явно, без потери исходников и с пропуском дублей.
- При входе в существующий профиль незавершённый гостевой персонаж не перезаписывается молча. Обычный вход через шапку не закрывает профиль самовольно.
- Node + полноценный Chromium проверяют авторизацию, локализацию, конфликты, удаление, ссылки и миграцию. Релизный Actions сверяет Worker runtime flags и гостевые HTTP 401 только читающими запросами. Не изменены игровые формулы, схемы production D1, cron.

## 0.585.0 — 2026.11.09.585 · поиск остаётся при удалении последнего совпадения

- Если фильтр введён при шести сохранённых билдах, последующее удаление одной записи до пяти больше не убирает поисковое поле и не раскрывает все оставшиеся карточки.
- Строка поиска существует, пока осталось больше пяти записей либо активен непустой пользовательский запрос. Пустой результат отображается штатным текстом; записи и названия не меняются.
- Добавлены Node-контракт и Chromium EN-сценарий удаления единственного подходящего билда без доступа к production D1.
- Формулы, сохранения, Worker, авторизация и cron Actions не затронуты; Node/Chromium и опубликованная версия проверяются отдельно.

## 0.584.0 — 2026.11.09.584 · сохранять ввод при обновлении облачной библиотеки

- Ответ D1 не стирает незавершённое название нового билда и не перемещает курсор из поля поиска. Восстанавливаются поисковая строка, выделение текста и позиция прокрутки внутри рабочего окна.
- Сохранено прежнее правило: только явные действия сохраняют именованные билды; черновик не отправляется в облако при обновлении списка.
- Node guard и Chromium с задержанным GET `/api/library` проверяют реальный интерфейс. Worker/D1, аккаунты и игровые формулы не изменялись. Автоматические проверки и публикация подтверждаются отдельно.

## 0.583.0 — 2026.11.09.583 · единый поиск по сохранённым билдам

- Фильтр «Мои билды» использует тот же `searchWords`, что уже применяется в энциклопедии и экипировке; поиск «темный Elf 14» находит «Тёмный герой», а разные порядки слов и пробелы работают единообразно.
- Существующие русские и английские названия рас и уровень продолжают входить в поисковую строку; реальные названия билдов не изменяются.
- Дополнены Node контракт и настоящий Chromium EN-сценарий без сетевых операций с production D1.
- Формулы, экземпляры предметов, облачный протокол, аккаунты и расписание Actions не затронуты; CI и Pages-публикация проверяются отдельно.

## 0.582.0 — 2026.11.09.582 · статус облачной библиотеки соответствует последнему действию

- Два сохранения подряд могут завершиться в обратном порядке: теперь старый успешный PUT не показывает «Сохранено в облаке», если последняя версия не загрузилась; старый отказ не закрывает новое успешное сохранение.
- Запоздалый ответ удаления всё ещё очищает очередь отозванных ссылок, но не заменяет статус более позднего действия и не показывает лишний успех.
- Три изолированные Node-регрессии проверяют обратные порядки PUT и PUT/DELETE; серверные операции и данные билдов не меняются.
- Production D1, Worker, игровая арифметика, авторизация и GitHub Actions cron не изменены; публикацию и CI проверять отдельно.

## 0.581.0 — 2026.11.09.581 · не прерывать чтение Книги героя

- Открытая Книга героя блокирует фоновую перезагрузку при обнаружении новой версии; предложение обновиться остаётся доступным.
- Закрытие Книги снова разрешает обновление после бездействия, при этом сохраняется существующая предварительная запись черновика и библиотеки.
- Node-регрессия детерминированно проверяет оба состояния. Боевые формулы, D1, аккаунты, Worker и расписания не затронуты.
- Полную CI/Pages-проверку выполнить отдельно.

## 0.580.0 — 2026.11.09.580 · безопасное повторное открытие одной и той же ссылки

- Устранено окно гонки: пользователь может уйти со ссылки и вернуться на тот же `#b/<id>` пока первый GET ещё выполняется. Раньше поздний ответ со старой ошибкой 410 мог удалить новый hash и ошибочно сообщить об удалённом билде.
- Для каждого запуска `restoreSharedHash()` запоминается возрастающий номер запроса. Устаревшие успешные снимки и ошибки не влияют на текущий диалог или адрес; новый актуальный ответ по-прежнему обрабатывается.
- Chromium-регрессия принудительно задерживает старый ответ 410, открывает ту же ссылку повторно и проверяет отсутствие ложного предупреждения при новом успешном диалоге; Node guard проверяет запросную последовательность. Используются только моки Worker.
- Сохранения, формулы, аккаунты, production D1 и GitHub Actions расписание не изменены. CI и опубликованный Pages проходят отдельную проверку.

## 0.579.0 — 2026.11.09.579 · один запрос для каждого перехода по ссылке на билд

- Устранено перекрытие двух `hashchange`-обработчиков: одна короткая ссылка `#b/...` в уже открытой вкладке больше не запускает два параллельных обращения к Worker и два открытия диалога.
- Сохранён единый обработчик навигации Wiki/билдов и проверка полного 11-символьного идентификатора; переходы без перезагрузки продолжают работать.
- Добавлены Node guard единственного слушателя и Chromium assertions точного количества публичных GET при создании ссылки, повторной проверке, RU/EN открытии и отозванной ссылке. Все сетевые запросы в браузерном тесте мокируются.
- Не затронуты игровые формулы, сохранения, production D1, сессии и расписание GitHub Actions. Проверки CI и опубликованного релиза требуются отдельно.

## 0.578.0 — 2026.11.09.578 · единый расчёт для Origin, усилений и открытой Книги героя

- Полное обновление Origin теперь переиспользует один снимок `PandoraOSCalculator.base` для всех шести показателей характеристик, ОЗ/ОМ и усилений вместо трёх последовательных расчётов одинакового состояния.
- Редактирование гильдейских характеристик и других `attributeBuffs` передаёт тот же рассчитанный объект в Origin, Hero Book и усиления. Изменение гильдейского ОЗ/ОМ (`vitalsBuffs`) также считает один раз.
- Важная защита от устаревших чисел: интерактивный `renderOriginStats().refresh()` продолжает вычислять **новый** снимок после изменения вложенных очков, а не переиспользовать старый.
- Chromium регрессия с настоящим OS-калькулятором проверяет уровень 45, переход ЛВК 9→10 при гильдейском бонусе +1 (крит 1→2), увеличение ОЗ от гильдии, обновление открытой Книги героя и число вызовов `base()` на каждом вводе. Включена в quick/full smoke; внешние запросы заблокированы.
- Формулы, D1, авторизация и игровые данные не изменены. Только устранён повтор вычислений и добавлено покрытие.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.577.0 — 2026.11.09.577 · Быстрее живые пересчёты Книги героя

- Один и тот же уже вычисленный результат `PandoraOSCalculator.base()` теперь передаётся из Origin (ОЗ/ОМ) в открытую Книгу героя при `renderOriginVitals`, вместо второго полного расчёта после каждого изменения персонажа. Передача `null` при отсутствии выбранных расы/класса также не вызывает лишний повторный расчёт.
- Удалён дублирующий явный вызов `renderStageAttributes()` из полного `render()`: `renderStagePicker()` уже синхронизирует состояние Книги, а `renderOriginVitals()` завершает отображение актуальным единым результатом. Нет изменения игровых формул, D1, сохранений или пользовательского контента.
- Расширен действующий Chromium сценарий открытой Книги: обёртки счётчиков подтверждают не более 2 полных вызовов расчётного движка на изменение одного стата (Origin + refresh input) и не более 2 монтирований Книги на полный `render()`, одновременно проверяя сохранение главы и корректный крит/точность.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.576.0 — 2026.11.09.576 · Восстановление D1-библиотеки аккаунта после сетевого сбоя

- Исправлена ранняя остановка `resumeCloudLibrary()`: ранее при пустом локальном списке билдов и отсутствии очереди удаления после восстановления сети **не выполнялся** GET облака даже для авторизованного пользователя с сохранёнными билдами на другом устройстве. Теперь текущий подписанный аккаунт повторно загружает свою D1-библиотеку независимо от наличия локальных строк, не требует повторного логина.
- Для пустого гостевого списка прежний запрет лишних запросов остаётся; ограничение частоты восстановления 20 секунд и существующая защита owner-scope остаются.
- Новый Chromium E2E моделирует 503 первоначального GET, 0 локальных билдов, возврат сети и получение ранее сохранённой D1-only записи без PUT или нового входа. Включён в quick и полный browser suite.
- Исправлен пропуск открытия ссылки `#b/<short-id>` внутри уже запущенного SPA: теперь `hashchange` вызывает существующий проверенный загрузчик. Это устраняет наблюдавшийся интермиттирующий Chromium сценарий, в котором диалог открытия не возникал после перехода без полной перезагрузки. Просроченный ответ от оставленной ссылки больше не показывает ложное сообщение об ошибке.
- Browser share-link E2E теперь намеренно делает четыре настоящих same-document перехода: отклонение, принятие, EN-диалог и отозванная ссылка. До изменения обработчик `hashchange` отсутствовал.
- Не меняет TTL аккаунтов, игровой каталог и формулы; нет production D1-записей из тестов.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.575.0 — 2026.11.09.575 · Убраны ежедневные GitHub Actions проверки D1, сохранены проверки релизов

- Удалён автоматический ежедневный cron `17 4 * * *` у workflow `.github/workflows/live-readonly.yml`; остальные workflows тоже проверены и не содержат расписания. Отныне **нет фоновых запусков GitHub Actions по дням/неделям**.
- Удалён неиспользуемый/дублирующий путь `workflow_run`; живой read-only Pages/Worker/D1 аудит теперь запускается только после `push` в `bonaqu_projects` или вручную (`workflow_dispatch`). При публикации сохраняются ожидание версии Pages, health и строгая сверка всех 16 наборов D1, но не создаются дополнительные ежедневные jobs.
- Добавлен Node регресс-тест, запрещающий любые `schedule`/`cron` во всех GitHub Actions workflows и проверяющий сохранение основных проверок после релиза. Конфигурация проверки не пишет в D1 и не затрагивает пользовательские билды.
- Репозиторий публичный; стандартные GitHub-hosted runners в публичных репозиториях бесплатны по действующей политике GitHub, но ненужные автозапуски удалены по желанию владельца.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.574.0 — 2026.11.09.574 · Обязательная строгая D1-проверка опубликованных русских описаний

- Production D1 CAS-публикация PR #362 подтверждена: 6/6 русских `instances.blurbRu` записаны в новый snapshot `ru-instances-20261109-fa79406fb5c1`, 16/16 источников идентичны, 0 отсутствующих RU.
- Текущая read-only проверка `catalog:parity:live` теперь **по умолчанию завершается ошибкой**, если этот уже опубликованный перевод потерян из-за отката каталога или повреждённой записи. Историческое разрешение шести пустых переводов больше не ослабляет мониторинг production.
- Новые Node проверки воспроизводят полную сверку 16 наборов со свежим snapshot, откат к старому D1 и диагностический режим. Никаких новых формул и записей в БД в данном релизе нет.
- [Issue #284](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/284) закрыта по реальной публикации и строгому readback, остальные Issues сохраняются до подтверждённой приёмки.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.573.0 — 2026.11.09.573 · Проверка всех 28 профессий и безопасная публикация шести русских описаний D1

- Добавлен 28-классовый расчётный регресс-тест для всех шести характеристик: VIT→HP, STR→ATK, AGI→уклонение/скорость, DEX→крит/точность, SPI→MP, INT→расход MP, включая равенство Книги героя и расчётного движка.
- Подготовлена узкая, подтверждённая владельцем 09.11.2026 публикация шести уже существующих `instances.blurbRu` через изолированную копию 19 наборов D1, 6 условных JSON-правок и единственную атомарную CAS-активацию. Нет ручного UPDATE активного snapshot.
- Одноразовый GitHub Actions workflow требует проверки исходного живого каталога ДО записи и строгого паритета всех 16 публичных ресурсов с шестью русскими описаниями ПОСЛЕ. Запись произойдёт только если production D1 credential имеет нужные разрешения; не заявлять публикацию до успешного workflow/readback.
- Старый snapshot сохраняется для возможного отката; на неизвестном активном snapshot или конфликте job отказывает без подмены игровых записей.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.572.0 — 2026.11.09.572 · Живой пересчёт Книги героя при изменении характеристик, веток и мастерства

- Книга героя пересчитывает итоги без закрытия/повторного открытия при изменении базовых статов, зелёного мастерства, очков веток, автозаполнения, сброса, душ, заточки и сокетов.
- При перемещении шкалы и удержании кнопки мастерства пересчёт идёт без демонтажа ползунка; сохраняются текущая глава и прокрутка Книги героя.
- Убраны пять дублирующихся явных вызовов повторного рендера при уже работающем общем обновлении.
- Расчётные и браузерные регрессии проверяют пороги ЛВК 9/10/20 и Тактика 85/65 по формулам Remaked.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.571.0 — 2026.11.09.571 · Двуязычные диалоги общих билдов, импорта и ошибок сохранения

- Отдельные диалоги открытия общих билдов и импорта общей библиотеки теперь полноценно RU/EN без перевода пользовательских названий.
- При создании ссылок и в ошибках облака на EN нет известных русских сообщений; предупреждения не скрывают реальные проблемы.
- Chromium smoke проверяет EN-получателя и сохранность текущего персонажа при отмене.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.570.0 — 2026.11.09.570 · Двуязычные формы создания записей энциклопедии без технических ID

- Поля RU/EN для создания монстров, локаций, NPC и разделов теперь озвучиваются на выбранном языке сайта.
- Технические ошибки внутреннего ID заменены понятным действием; ошибки связи NPC и разделов также переведены на EN.
- Добавлены регрессии в тесты локализации редактора энциклопедии.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.569.0 — 2026.11.09.569 · Понятные названия стихий навыков и подсказки прокачки на RU/EN

- В «Пути героя» названия подтверждённых стихий показаны на языке интерфейса; NONE не показывается, неизвестные коды не выводятся игроку.
- Подсказки удержания ± и доступное имя навыка синхронизированы с RU/EN.
- Добавлены проверки подробностей навыков, скрытых стихий и доступности кнопок.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.568.0 — 2026.11.09.568 · Двуязычный поиск в энциклопедии, экипировке и редакторе связей

- EN-переключение раньше переводило индекс имени и лишало поиск оригинального русского названия в Энциклопедии, экипировке и списках связей редактора. Теперь индекс включает точные RU-имена неизменённого исходного каталога, отображаемые названия и подтверждённые EN-переводы.
- Поиск по нескольким словам и в обоих языках работает без перестановки игровых ID и без изменений D1. Реальный Chromium acceptance: пользователь открывает EN Энциклопедию, вводит «Спата Kris» и находит подтверждённый предмет с английским названием.
- No gameplay formulas changed; publication awaits passing CI and post-merge Pages readiness.


## 0.567.0 — 2026.11.09.567 · Путь героя: точные требования уровня и понятные названия характеристик

- Умения с подтверждённым `charLevel: 0` (477 из 569 исходных) не показывают ложную подпись «Нет известного порога» / «Unknown requirement». Требования ветки и настоящие положительные уровни остаются видимыми.
- Пользовательская карточка навыка показывает «Сила», «Ловкость», «Сила духа» / Strength, Dexterity, Spirit и другие уже утверждённые названия из «Происхождения», вместо внутренних `STR` / `DEX` / `SPI`. Неизвестный код не выдаётся за подтверждённую характеристику.
- Node: чтение проверенных игровых записей в RU/EN. Chromium: реальный «Беспощадный удар», без фальшивого уровня и сырого кода STR. Игровые формулы, игровые данные и D1 не меняются.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.566.0 — 2026.11.09.566 · Поиск умений по официальным RU/EN названиям в Пути героя

- В Пути героя поиск навыков поддерживает название из выбранного языка, точное русское имя из активного игрового каталога и точный английский перевод из D1, если он загружен. Поиск не меняет запись навыка, обучаемость или боевые формулы; номер ID остаётся внутренним.
- Сохранены проверенные 0.565.0 ограничения технических ID в карточках. Node регрессия RU-поиска в EN-панели и отсутствие записей в D1.
- Матрица приёмки #2 синхронизирована с независимой проверкой 1 459 SHA-256 бинарных ресурсов полного исследовательского ZIP; отсутствующие 264 оригинала не объявлены восстановленными.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.565.0 — 2026.11.09.565 · Путь героя: понятные названия умений без технических ID и поиск по словам в любом порядке

- В компактном инспекторе умений Пути героя пользователю больше не показывается внутренний ID навыка; отсутствие известного предыдущего умения объясняется словами RU/EN вместо числа. Идентификаторы остаются внутри модели и пригодны для поиска, ссылок и расчётов.
- Поиск навыков в правой панели теперь поддерживает несколько слов в любом порядке, регистр, пробелы и ё/е. Добавлены регрессионные проверки реального содержимого карточки в обоих языках; игровые формулы не менялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.564.0 — 2026.11.09.564 · Единый поиск по нескольким словам в экипировке и выборе связей энциклопедии

- В основном выборе экипировки и семи редакторских каталогах связей (предметы, NPC, монстры, навыки, эффекты) теперь общий поиск слов вне зависимости от порядка, пробелов и регистра. Поиск «меч Рычащий» находит «Рычащий меч», «холмы Туманные» — «Туманные холмы».
- Новые Node и реальные Chromium регрессии. В документации исследования арта уточнена независимая проверка ранее загруженного ZIP (15 628 записей, 1 459/1 459 SHA-256 сверок (1 448 уникальных клиентских файлов), точных восстановлений 0); никакие изображения или production D1 записи не опубликованы.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.563.0 — 2026.11.09.563 · При сравнении физической АТК приоритет у максимального урона; минимум решает только при равных максимумах

- Исправлена регрессия сравнения физических АТК из PR #350: максимальный урон приоритетнее минимального (20–100 лучше 30–90). Равный максимум разрешается подтверждённым минимумом. Нет дополнительной колонки разницы, игровых формул не меняли.
- Новые регрессионные Node тесты и обновлённый утверждённый UI-гайд. Browser acceptance and deployed Pages state must be verified separately.


## 0.562.0 — 2026.11.09.562 · Полная локализация управления расой, подписей умений и доступности основного редактора

- На английском теперь локализованы обозначения пола у портрета человека/эльфа, ARIA-выбор расы, кнопки листания портретов; русская версия сохранена. Не меняются официальные названия игровых навыков/предметов.
- Заголовок редактора, название рабочей области, подписи разделов, поисковая строка и фильтр навыков, основные ARIA-группы Пути героя и окна билдов теперь имеют точный RU/EN интерфейсный перевод.
- В «Происхождение → Характеристики» видимые метки ОЗ/ОМ теперь становятся HP/MP на EN; динамическое голосовое описание вычисленных значений тоже двуязычно.
- Browser/Node regression, обновлён UI-гайд. Без D1-записей, изменений боевых формул и новых защит аккаунтов.


## 0.561.0 — 2026.11.09.561 · Корректное выделение A/B при пересекающихся диапазонах физической атаки

- Сравнение билдов не выделяет «лучшее» физическое АТК, когда подтверждённые диапазоны пересекаются (например, A 20–100 против B 30–90). Преимущество выделяется жирным только если и минимум, и максимум у одного билда не ниже, причём хотя бы один строго выше.
- Если у одного сохранённого билда минимум неизвестен, не угадывать преимущество полного диапазона; разница по значениям остаётся видна. Сравнение одних максимумов без подтверждённых диапазонов сохраняет прежнюю логику.
- Регрессии для перестановки A/B, одинаковых максимумов, превосходящих диапазонов и пересечений, плюс актуализация утверждённого UI-гайда. Игровые формулы, D1, Worker и аккаунты не изменены.


## 0.560.0 — 2026.11.09.560 · Поиск билдов по нескольким словам, ясный статус гостевого облака и актуальный UI-гайд

- Поиск в «Моих билдах» по нескольким словам одновременно: раса, профессия, уровень и имя могут находиться в разных частях карточки. Лишние пробелы не мешают, RU/EN имена рас продолжают индексироваться.
- Для неавторизованного пользователя статус «Облачная библиотека подключена» теперь явно говорит «Гостевая облачная библиотека подключена» / «Guest cloud library connected». Вход в аккаунт не меняет существующих операций сохранения, сессий и владельца.
- Утверждённый UI-гайд исправлен: 6 колонок A/B, без устаревшей колонки разницы. Обновлены Node/Chromium проверки поиска, гостевого статуса и двух языков.
- Node и Chromium регрессии, а также deployed Pages проверяются отдельно; игровая D1 и формулы не изменены.


## 0.559.0 — 2026.11.09.559 · Вход и регистрация из библиотеки билдов; сравнение A/B в 6 столбцов без разницы

- Вход и регистрация из библиотеки билдов; сравнение A/B в 6 столбцов без разницы.
- При отсутствии входа в «Моих билдах» показано ясное уведомление с ссылками на вход и регистрацию: открывается нужная форма профиля, панель билдов предварительно закрывается. Отдельная гостевая библиотека не переименовывается в несохранённые данные.
- Сессии без таймаута бездействия сохранены; при переключении аккаунта библиотека и локальный owner scope по-прежнему изолированы. Обновление облака получает отдельное статусное сообщение.
- Сравнение результатов: две группы «Характеристика / A / B», без колонки разницы; жирным выделяются только сопоставимые благоприятные значения, включая меньший получаемый урон и лучший минимальный ATK.
- Node и Chromium регрессии дополнены; браузерная приёмка и deployed Pages должны проверяться отдельно.


## 0.558.0 — 2026.11.09.558 · Ненавязчивая подсказка в «Мои билды» для гостей

- Только на странице сохранённых билдов посетитель без авторизации видит компактную RU/EN-подсказку, почему билды из его аккаунта не подтянулись. Кнопка «Войти в аккаунт» открывает штатный профиль; пароль, логин и новые элементы авторизации не дублируются.
- У вошедшего пользователя подсказка скрыта. Гостевой редактор и перенос библиотеки по коду остаются доступны, никакие сохранения не удаляются и автоматический вход не выполняется.
- Chromium проверяет оба состояния, кнопку перехода, сохранность гостевых билдов. Без правок Worker/production D1 или игровых формул.

## 0.557.0 — 2026.11.09.557 · Без автоматического выхода из пользовательского аккаунта

- Отменена семидневная автоматическая разавторизация: Worker проверяет действующий bearer в таблице сессий, а не старую дату. Браузер не удаляет сохранённый вход по времени и запрашивает подтверждение владельца через /api/account/me.
- Новые сессии по-прежнему сохраняют старое обязательное поле expires_at с максимально безопасным целым значением, без миграции production D1. Ранее сохранённые сессии также не теряют действительность только по времени.
- Явный выход, смена пароля и восстановление продолжают отзывать токены; админский доступ не затронут. Очистка браузерных данных всё ещё требует входа заново.
- Node/Chromium тесты проверяют возвращение спустя месяцы, правильную библиотеку и явный logout. Игровые формулы и пользовательские билды не менялись.

## 0.556.0 — 2026.11.09.556 · Ручная проверка конфликтов правок D1 без игровых изменений

- В «Игровом каталоге» → «Дополнительные инструменты» добавлена кнопка «Проверить конфликты правок». Тест выполняется только после отдельного подтверждения владельца, никогда при загрузке страницы или CI.
- Авторизованный Worker проверяет CAS-сценарии только на двух уникальных случайных ключах `__qa.*`: создание, устаревшая правка (0), правильная правка (1), устаревшее удаление (0), правильное удаление (1), повторное удаление (0) и независимость соседней записи. В `finally` удаляются обе временные записи и проверяется неизменность активной версии игрового каталога.
- Ошибки возвращают отказ, а не ложный успех; при ошибке после выполненной вставки очистка всё равно выполняется. Новый отдельный Worker endpoint не принимает обычные игровые ключи.
- Тесты Node имитируют изолированную D1 и проверяют реальные SQL/HTTP пути, включая 401, ошибку после записи и смену активного каталога. Это подготовка #203, а не полноценная production-приёмка: Worker должен быть отдельно опубликован, администратор должен осознанно нажать кнопку. Два реальных браузера и UI Undo требуют отдельной проверки.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.555.0 — 2026.11.09.555 · Защита повреждённых резервных копий локальной библиотеки

- Owner-scoped recovery snapshot должен быть массивом ровно из четырёх строк. Ранее JSON-массив правильной длины мог содержать объект/число/null, после чего смена аккаунта превращала его в нечитаемый текст, потенциально затрагивая сохранённые билды.
- Повреждённый snapshot не активируется и не перезаписывается: смена владельца или запись в чужой кэш завершается понятной ошибкой, оставляя оригинальный backup и активные данные другого пользователя нетронутыми. Для обычного чтения повреждённый тип не выдаётся за валидный билд.
- Проверены исправные старые четырёхстрочные снимки и отрицательные случаи для аккаунта/гостя. Production D1, Worker, игровые формулы и сами исходные данные не изменены.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.554.0 — 2026.11.09.554 · Полнота игровых таблиц расчёта и развития персонажа

- Источник D1 теперь обязан содержать все шесть рас и четыре начальные профессии, прогрессию для планировщика уровней 1–55 и обе таблицы бонусов заточки +1…+10. Отсутствие всей строки больше не превращается в тихое отсутствие бонуса.
- Проверяются все десять ставок кузницы и четыре базовых уровня самоцветов; дополнительные будущие уровни персонажа не запрещены.
- Тесты намеренно удаляют реальные строки из корректного OS-снимка и проверяют отказ, сохраняя дробные `expReq` для уровней 60–69 без округления. Источники, формулы, Worker и production D1 не изменены.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.553.0 — 2026.11.09.553 · Безопасный откат неудачного удаления черновика

- При исключении браузера после фактического `removeItem` ранее сохранённый черновик мог остаться удалённым: проверка отката сравнивала `null` с пустой строкой. Теперь при неизменном владельце и независимом recovery snapshot восстановление учитывает именно фактическое отсутствие ключа.
- Уточнена защита от старой операции, пересекающейся с новым сохранением другой вкладки того же владельца: прежде чем возвращать старый primary, проверяется, что owner-cache не был обновлён другим сохранением.
- Два детерминированных теста имитируют ошибку после удаления и более новую параллельную правку, сохраняя 4 owner-scoped области. Не заявляется полная атомарность browser localStorage.
- Игровые таблицы, пользовательские данные в production D1 и Worker не менялись.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.552.0 — 2026.11.09.552 · Устаревшая форма смены пароля не отправляет запросы

- Исправлено отдельное воспроизводимое окно в аккаунте: после RU/EN пересоздания интерфейса старый DOM-обработчик кнопки или Enter больше не отправляет password POST и не переписывает обратную связь свежей формы. Проверка учитывает владельца сессии и её revision, а также удаление формы из DOM.
- Добавлена реальная Chromium-регрессия с искусственным кликом и submit на старой форме после смены языка. Обычное изменение пароля, валидация подтверждения и RU/EN остаются в прежнем тесте.
- Это доказанная защита одного класса гонок #115; не утверждаем, что исходный флейк объяснён только им. Пользовательские билды, пароли и production D1 не меняются.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.551.0 — 2026.11.09.551 · Защита источниковых таблиц развития, баффов заточки и кузницы

- Проверяются начальные характеристики шести рас и четырёх стартовых профессий, очки по уровням и прогрессия опыта. Повреждённые D1-строки не участвуют в калькуляторе.
- Дробные значения expReq, реально присутствующие в OS-архиве для уровней 60–69, остаются точными: проверяется конечное неотрицательное число, а не только integer. Числа не округляются.
- Проверяются реальные физические и магические таблицы заточки (ratio/flat), а также ставки, уровни самоцветов, молоты и основные числовые параметры кузницы.
- Отрицательные официальные ставки кузницы остаются допустимыми — источниковые игровые коэффициенты не подгоняются под ошибочное предположение о шансах 0–100%. Лимит сервера не сужает диапазон планировщика 1–55.
- Добавлены тесты повреждённых D1-схем и архивных таблиц; механика игры, опубликованный D1, пользовательские билды и Worker не менялись.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.550.0 — 2026.11.09.550 · Защита классов, наборов и кузнечных эффектов от повреждённых D1 записей

- До расчёта билда проверяются 28 исходных профессий: ID/родительская профессия, базовые ОЗ/ОМ, пределы атрибутов и веток. Неверные коэффициенты не выдаются за игровые.
- Проверяются 162 исходные таблицы эффектов заточки: ссылки на предметы, допустимые градации, имена эффектов и конечные числовые коэффициенты. Не ограничиваются правдоподобные большие исходные коды эффектов.
- Проверяются 3 комплекта: уникальные существующие предметы, допустимые интервалы условий и конечные исходные полиномиальные коэффициенты.
- Добавлены поведенческие регрессии на испорченные поля и полный актуальный source snapshot. Сохранены настоящие таблицы и формулы; production D1/Worker не менялись.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.549.0 — 2026.11.09.549 · Единая D1-проверка навыков, предметов и душ для всей студии

- Закрыт кодовый разрыв между двумя загрузчиками: ранее Энциклопедия проверяла поля боевых предметов, душ и требований навыков глубоко, а загрузчик создания билда ограничивался в основном количествами и связью расовых пассивок. Повреждённый исходный D1-параметр не должен достигать расчёта персонажа даже при отказе Wiki от этого снимка.
- Выделен один общий источниковый валидатор для обеих частей сайта. Он проверяет соответствие ID, характеристики предметов, сокеты и эффекты душ, затраты и требования умений, принадлежность расовых пассивок; отсутствующие опциональные старые поля остаются неизвестными.
- Добавлены отдельные поведенческие проверки реального загрузчика: искажённый W, отрицательная стоимость ОМ, невалидные сокеты души, prereq и расовые связи отклоняются до замены состояния персонажа.
- Исходные JSON, пользовательские билды, боевые формулы и production D1/Worker не менялись. Browser acceptance and deployed Pages state must be verified separately.

## 0.548.0 — 2026.11.09.548 · Защита вложенных данных душ, NPC, локаций и подземелий в D1

- Проверяются имена и необязательные структурные поля 112 душ, 24 торговых NPC, карт и 6 подземелий. Массивы сокетов душ имеют только реальные категории без повторов, эффекты не могут содержать NaN/строку вместо числа или обратный диапазон; неопубликованные старые поля не выдумываются.
- Также отклоняются обратные интервалы заточки в добыче монстров и повторные материалы/NPC внутри одного рецепта обмена. Проверено отсутствие таких повреждений в исходных 1288 строках добычи и 236 обменах.
- Некорректные значения в одном D1-снимке приводят к отказу от него целиком и сохранению атомарного локального fallback, а не к повреждённой карточке или вымышленному боевому эффекту. Добавлены регрессионные отрицательные варианты и проверка полного исходного OS-каталога.
- Исходные данные, формулы, пользовательские билды, D1 и Worker не изменены; это защита схемы, не доказательство новых игровых механик.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.547.0 — 2026.11.09.547 · Безопасная проверка боевых характеристик предметов и вместимости душ в D1

- Каталог D1 перед передачей предмета в экипировку, Книгу героя и кузницу проверяет имя, тип, слот, исходную вместимость душ (целое 0–3), существующие базовые АТК/защиту/пробивание/скорость/дальность/заточку/уровень, флаги двуручности и доступности, тип ограничений класса и массива эффектов.
- Все 1116 предметов текущего OS-архива проходят валидацию без изменений. Исходные значения soulslot для железных поножей 13041 остаются 1, для пояса 21001 — 0; индивидуальные выбранные 2/1 сокеты из игры продолжают храниться в билде отдельно, как до релиза.
- Добавлены 17 регрессий повреждённых D1-значений и строгий отказ с атомарным fallback; необязательные отсутствующие поля старых корректных источников остаются неизвестными и не заполняются нулями.
- Не доказывается, почему в реальном игровом клиенте на двух экземплярах были иные сокеты (#237). Production D1, исходные игровые таблицы, боевые формулы и сохранения не переписывались.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.546.0 — 2026.11.09.546 · Защита достоверности характеристик и сопротивлений монстров в D1

- Активный D1-снимок не должен представлять некорректные ОЗ, уровень, защиту, базовые характеристики или сопротивления монстров как официальные игровые данные. Перед отображением проверяются имена, существующие целочисленные поля и типизированные `resists` (включая допустимые отрицательные значения, означающие уязвимость).
- Сохранена поддержка неполных старых источников: отсутствующие опциональные показатели не заменяются выдуманными нулями. Все 702 монстра текущего OS-архива проходят проверку без переписывания или изменения игровых значений.
- Добавлены 15 дефектных D1-фрагментов и проверки strict отказа с атомарным fallback; реальная модель защиты, HP и уязвимостей не пересчитывается.
- Worker, production D1, игровая таблица монстров, боевые формулы и сохранения персонажей не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.545.0 — 2026.11.09.545 · Проверка параметров навыков и их требований перед загрузкой из D1

- Прежде D1-каталог проверял существование записей навыков и расовые ссылки, но не значения, от которых зависят подсказки и планирование: ОМ, чтение заклинания, откат, анимация, дальность, требования уровня, AoE, флаги применения оружия, изучаемость, предыдущий навык и требуемое мастерство ветки.
- Теперь повреждённые числовые поля, ссылки и требования отвергаются до отображения игрового каталога. Отсутствующие необязательные поля старых корректных снимков не заполняются выдуманными значениями.
- Сверены все 569 текущих навыков, 179 требований веток и 29 записей с prereq; 17 детерминированных примеров повреждённого D1 и атомарный fallback. Исходные свойства и иконки навыков остаются неизменными.
- Worker, production D1, боевые формулы и пользовательские билды не менялись. Это защита достоверности данных, а не доказательство полного игрового паритета.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.544.0 — 2026.11.09.544 · Защита входа и регистрации от отправки устаревших форм

- После смены режима «Войти» / «Регистрация» / «Восстановить» или пересоздания формы при RU/EN старый экземпляр формы больше не может отправить авторизацию в новый режим. Обработчик проверяет `form.isConnected` и собственный `renderedMode` перед чтением закрытых полей и обращением к Worker.
- Новый реальный Chromium-тест принудительно посылает `submit` в уже удалённые login и register формы с введёнными значениями и проверяет отсутствие любых login/register/recover запросов и ошибок в консоли. Обычные регистрация, смена пароля и восстановление продолжают проверяться существующей полной браузерной последовательностью.
- Содержимое паролей не записывается в журнал, cookie или localStorage. Issue #115/#253 остаются открытыми, пока исторические редкие флейки не объяснены полностью.
- Игровые данные, формулы и production D1 не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.543.0 — 2026.11.09.543 · Защита стоимости материалов и лимитов обмена NPC при чтении D1

- Загрузчик D1 игрового каталога дополнительно проверяет имеющиеся стоимости обменов NPC (опыт, золото, честь), численность ингредиентов и лимит покупки (неотрицательные целые значения, количества от 1, период `daily`/`weekly`/`lifetime`). Это предотвращает отображение повреждённых чисел и периодов как реальных правил игры.
- Неуказанные поля старых снимков остаются неизвестными: ноль не выдумывается. Все 236 обменов, 339 ингредиентов и 48 лимитов текущего архивного источника проходят проверку без изменений.
- Добавлены 13 регрессий на неверные D1-поля, проверка отказа strict-режима и атомарного перехода на локальный каталог без смешивания двух источников.
- Production D1, Worker, игровые шансы, цены, названия и боевые формулы не менялись. Issue #1/#284 требуют отдельной production приёмки.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.542.0 — 2026.11.09.542 · Безопасный откат записи билдов без уничтожения новых межвкладочных сохранений

- `PandoraBuildScope.setOwned()`: при ошибке записи в общие ключи выполняет rollback только собственных прежних значений, пока active owner не сменился, а recovery cache всё ещё содержит именно резервную версию отказавшей операции. Это исключает уничтожение более нового сохранения другой вкладки того же аккаунта и резервной копии после перехода другой вкладки на другой аккаунт.
- Три детерминированных Node-регрессии: независимая новая запись в том же аккаунте, новая копия Alice после переключения Bob и частично применённая запись с ошибкой. Существующий тест обычной ошибки quota сохранён.
- Из-за отсутствия транзакций в browser localStorage полная безусловная атомарность между вкладками не заявляется; историческое Issue #253 остаётся открытым.
- Worker, production D1, исходные игровые данные и боевые формулы не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.541.0 — 2026.11.09.541 · Изоляция независимых D1-правок и конфликтов CAS

- Регрессии #203 проверяют атомарный compare-and-set не только при двух вкладках, редактирующих один и тот же ключ, но и при параллельной работе с двумя разными записями: две независимые операции не должны конфликтовать.
- Параллельная устаревшая правка получает 409, а успешная правка другого ключа сохраняется. Проверены независимый reset, отказ повторного stale reset, отказ при чужом bearer и очистка **всех** синтетических ключей.
- Тест использует только in-memory SQLite mock и существующий Worker handler; никаких production D1-записей не выполняет. Авторизованная production-приёмка CAS по #203 остаётся открытым отдельным пунктом.
- Не менялись Worker, реальные D1-таблицы, игровые данные, формулы, билд-сохранения и UX.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.540.0 — 2026.11.09.540 · Повторяемые браузерные регрессии ошибок смены пароля и задержанного входа

- Тройной изолированный реальный Chromium-сценарий для #115 и части #253: задержанный GET /api/account/me, заполнение формы изменения пароля, отклонение несовпадающего подтверждения, переключение RU→EN→RU, скрытие/открытие панели и завершение /me без удаления вводимого текста и ошибки.
- Проверяет, что неподтверждённый пароль никогда не отправляется в API, а учётная запись в состоянии pending не обращается к чужой гостевой библиотеке. Используются только тестовые токены и заглушки, без production D1 или реального пароля.
- Тест третьей вкладки также исправлен: прежде он задерживал только первый GET `/me`, а повторный запрос мог обойти ожидание и сделать уже проверенный профиль ложным провалом pending-state. Теперь все GET проходят через один отложенный gate, с сохранением контроля preflight. Добавлен regression guard для сценария.
- Сценарий включён в полный набор браузерных smoke. Прогоны не доказывают, что исторические флейки #115/#253 полностью объяснены; обе задачи сохраняют отдельный статус расследования.
- Нет изменений логики авторизации, игрового каталога, формул и сохранений.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.539.0 — 2026.11.09.539 · Отказ при межвкладочной смене владельца во время повторной синхронизации

- Повторное подтверждение того же владельца библиотеки теперь отклоняется, если во время резервной синхронизации другая вкладка переключила активный owner marker. Прежде `sync()` мог вернуть `false`, но `transition()` всё равно выдавал успешный результат.
- Ошибка не возвращает маркер чужого аккаунта назад и не переписывает его общие ключи; отдельный тест воспроизводит межвкладочную смену ровно во время второго owner-cache write, сохраняет собственную копию Alice и библиотеку Bob.
- Старые сохранения и штатное поведение без конкурентной смены владельца сохраняются. Полное устранение всех гонок `localStorage` не заявляется; #253 остаётся открытой до независимой проверки исторического флейка.
- Worker, D1, боевые формулы и игровая база не изменялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.538.0 — 2026.11.09.538 · Защита зональной добычи от некорректных шансов и границ в D1

- D1-лоадер Энциклопедии проверяет существующие базовый и групповой бонусные шансы зональной добычи: числовые конечные 0–100%. Они не складываются и не переинтерпретируются как вычисленная вероятность; отсутствующие поля в старых снимках остаются допустимыми.
- Все награды групп должны ссылаться на настоящий предмет или душу; необязательные нижняя и верхняя границы улучшения проверяются как целые 0–1000 в правильном порядке.
- Проверены реальные 485 групп зональной добычи и 1445 источниковых ссылок на предметы. Новые тесты воспроизводят повреждённый D1, strict отказ и согласованный fallback без подмены игровых шансов.
- Исходные карты, предметы, таблицы, боевые формулы, Worker, production D1 и пользовательские билды не изменялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.537.0 — 2026.11.09.537 · Валидация вероятностей добычи монстров и связей душ в D1

- Каталог D1 перед отображением проверяет идентичность предмета в строке добычи, числовой шанс 0–100% либо отсутствие шанса, количество, дополнительное число слотов душ, границы улучшения и ссылки на существующие души с корректной вероятностью.
- Проверены все 1288 строк 187 источниковых таблиц добычи монстров; записанные шансы 0,01–100%, четыре вложенные ссылки на души соответствуют реальному каталогу. Исходные строки не меняются.
- Добавлены регрессии неправильных значений и несуществующих душ, строгий D1 отказ и согласованный архивный fallback; отсутствующий шанс остаётся неуказанным.
- Отдельные игровые формулы, шансы выпадения, данные монстров, Cloudflare Worker, production D1 и билды не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.536.0 — 2026.11.09.536 · Проверка шансов и количества наград сундуков в каталоге D1

- Загружаемый из D1 каталог проверяет вероятность каждой предметной и золотой награды сундука: 0–100% либо неуказанное значение. Нечисловые, бесконечные и выходящие за пределы вероятности отвергаются до отображения Энциклопедии.
- Для предметных наград проверяются существующие количественные поля, уровень заточки и число слотов душ. Для золотых наград не принимаются посторонние поля количества предмета; ранее проверенный диапазон золота сохраняется.
- Проверены все 457 реальных строк 32 обычных и 12 NPC-сундуков: их исходные шансы от 0,05% до 100%, без отклонений. Новые тесты воспроизводят повреждённый D1, строгий отказ и полный согласованный fallback; неуказанный шанс остаётся «не указан».
- Вероятности выпадения, содержимое сундуков, формулы, Cloudflare Worker, production D1 и пользовательские билды не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.535.0 — 2026.11.09.535 · Безопасная изоляция повторных идентификаторов облачных билдов

- Если повреждённый ответ облачной библиотеки содержит два билда с одинаковым идентификатором, приложение больше не выбирает произвольную «первую» версию. Конфликтующий ID считается недоступным; локальная версия сохраняется как отдельная восстановленная копия.
- Восстановленная копия остаётся только в браузере до явного сохранения; автоматическая обратная запись поверх конфликтующего D1 ID запрещена. Неповреждённые соседние облачные билды продолжают загружаться.
- Обработаны конфликты удалённой и активной записи, повторная загрузка, очередь удаления и отсутствие локальной копии; регрессии сохраняют исходные объекты неизменными.
- Проблема относится к защите от **аномального ответа**: действующая D1 требует уникальные ID, факт такого повреждения в production не установлен.
- Worker, production D1, исходные игровые таблицы и боевые формулы не менялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.534.0 — 2026.11.09.534 · Валидация идентичности предметов, монстров, навыков и душ в D1

- Для словарей D1 items/monsters/skills/souls проверяется, что ID внутри записи, если он присутствует, совпадает с ключом каталога. Чужой ID в карточке не может выдать другой предмет, умение или монстра за запись текущей строки.
- Невалидные записи `null` отвергаются, корректные старые числовые строки и исторические записи без дублирующего поля ID продолжают приниматься.
- Node-регрессии отдельно проверяют все четыре каталога, strict отказ и согласованный полный архивный fallback при повреждённом D1.
- Перед изменением сверено: в 1116 предметах, 702 монстрах, 569 умениях и 112 душах исходного архива ID совпадают с ключами.
- Игровые таблицы, формулы, Cloudflare Worker, production D1 и сохранённые билды не менялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.533.0 — 2026.11.09.533 · Сравнение билдов показывает все отличающиеся боевые характеристики Книги героя

- Компактное A/B теперь сравнивает также итоговые изменения атаки спереди/сзади, дальности ближнего и дальнего оружия, физического поглощения (ед.), точности спереди, уклонения от дальних атак, скорости в городе и сопротивлений физическим/ментальным аномалиям.
- Все значения берутся из существующей матрицы итогов Книги героя; строки показываются **только при отличиях**, без повторения экипировки, усилений, навыков, стоимости и технических подробностей.
- Недоступные расчёты остаются «—», отсутствие различий не превращается в ложные изменения; RU/EN и единицы проверяются тестами. Ни одна игровая формула не добавлена и не изменена.
- Worker, production D1, исходные OS-данные и сохранения билдов не изменялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.532.0 — 2026.11.09.532 · Откат сохранений не перезаписывает библиотеку другой вкладки

- При ошибке перехода между аккаунтами откат общих полей выполняется только пока текущая вкладка сохраняет право на них. Если соседняя вкладка уже переключила владельца, её активные билды и draft больше не переписываются данными из чужого отката.
- Перед назначением нового owner marker проверяется, что его не забрала другая вкладка во время записи четырёх ключей. Неуспешная синхронизация после назначения marker больше не выдаётся за завершённый переход.
- Аналогичная защита при ошибке повторного перехода в уже активный аккаунт. Три теста на искусственное межвкладочное переключение во время записи, непосредственно после записи и в same-owner ветке.
- Ранее существовавший откат при quota/storage failure в пределах того же владельца сохраняется. Browser localStorage не транзакционен; все гонки нескольких вкладок этим не исключены.
- Нет изменений Cloudflare Worker, production D1, игровых данных, формул и содержимого сохранений.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.531.0 — 2026.11.09.531 · Безопасное восстановление ссылок предметов при редактировании описаний

- При изменении описания ссылки `<item N>` восстанавливаются только для целых названий предметов, а не для совпадений внутри других слов. Например, «Билет испытаний» больше не превращает «ПромоБилет испытаний» в ссылку.
- Все совпадения ищутся в неизменённом отредактированном тексте; перекрывающиеся и неоднозначные названия блокируются вместо неверной привязки.
- Существующие неизменённые игровые ссылки, повторы, переносы строк и RU/EN-тексты сохраняются; добавлены тесты на Unicode и несколько предметов.
- Worker, D1, игровой каталог, боевые формулы и сохранённые билды не изменялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.530.0 — 2026.11.09.530 · Проверка вложенных списков связей каталога D1 перед показом Энциклопедии

- Проверка каталога отвергает строки и объекты вместо массивов монстров, душ, NPC, материалов обмена, добычи и наград локаций; повреждённые связи больше не проходят даже при правильных числах записей.
- Для подзаписей добычи, материалов и локаций требуется корректная структура; отсутствие необязательных списков в старых снапшотах остаётся допустимым.
- Node-регрессии на повреждённые D1 ответы, строгий отказ, атомарный архивный fallback и неизменность полного игрового архива.
- Worker, production D1, исходные игровые значения и боевые формулы не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.529.0 — 2026.11.09.529 · Уникальные идентификаторы обменов NPC в игровом каталоге D1

- После проверки формата каталога обмены NPC проверяются на уникальные исходные ID: повторный/отсутствующий/нечисловой ID не принимается из D1 как исправный.
- Разные рецепты для одной и той же награды и NPC сохраняются как отдельные обмены, а старые допустимые числовые строки поддерживаются.
- Регрессии с одинаковыми ID при формально полном количестве строк, strict D1 rejection и read-only архивным fallback.
- D1, Worker и игровые формулы не меняются; реальных 236 источниковых обменов данные сохраняются без изменений.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.528.0 — 2026.11.09.528 · Подземелья не скрывают друг друга при повторяющихся ID игрового каталога

- Данные подземелий D1 теперь отвергаются, если ID отсутствует, некорректен или повторяется. Публикация со старым количеством строк не считается полноценной, если энциклопедический индекс скрыл одну карточку.
- Числовые ID, представленные строкой в старых снапшотах, продолжают приниматься.
- Добавлены регрессии на дубли, некорректные ID, строгое чтение D1 и чтение из полностью валидированного архива только в разрешённом режиме.
- Не меняются Worker, game source, D1 и боевые формулы.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.527.0 — 2026.11.09.527 · Проверка целостности золотых наград и уникальности сундуков D1

- Валидация загруженного каталога D1 отклоняет сундуки с повторными ID в обычном и NPC-списках, не позволяя незаметно переписать карточку при построении Энциклопедии.
- Золотая награда должна иметь корректные безопасные целочисленные границы от 0 и нижнюю границу не больше верхней. Строка не может одновременно быть предметом и золотом; группы наград должны быть массивами.
- Добавлены Node-регрессии неверных золотых диапазонов, дублирования и атомарного отказа D1 со штатным архивным fallback только при явном non-strict режиме.
- Не меняются Worker, D1 и игровые формулы; существующие исходные диапазоны сохраняются.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.526.0 — 2026.11.09.526 · Админка умеет проверять и сохранять правки NPC-сундуков с золотом

- В админском редакторе сундуков правила `validChest`, проверка ссылок и применение D1 overrides теперь допускают два источниковых вида наград: предмет с ID или диапазон золота без ID.
- Сохранение исправленного шанса в NPC-сундуке не отвергается из-за уже существующих золотых наград; ключи сундука, остальные суммы и обычные сундуки сохраняются без изменений.
- Неправильные интервалы золота, строки вместо чисел и смешанные item+gold payloads отклоняются; Node-тесты проверяют реальные 32 обычных и 12 NPC-сундуков, иммутабельность исходных данных.
- Нет изменений production D1, Worker, игровых данных или боевых формул.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.525.0 — 2026.11.09.525 · NPC-сундуки показывают награды золотом вместо отсутствующих предметов

- В карточках сундуков NPC награды золотом показываются как источниковый диапазон, например «Золото: 60 000–100 000» / «Gold: 60,000–100,000», а не как неизвестный предмет.
- Для gold-only строки отсутствуют фиктивные предметные ссылки и лишний редактор количества. Некорректные суммы не превращаются в придуманное число; остальные награды остаются как прежде.
- Добавлены Node-проверки исходных сумм и Chromium сценарий RU/EN с настоящим NPC-сундуком.
- Никаких изменений Worker, production D1, игровых данных или формул.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.524.0 — 2026.11.09.524 · Проверка целостности D1 охватывает также сундуки NPC и их ключи

- Проверка целостности Энциклопедии теперь охватывает и NPC-сундуки, которые пользователь уже видит в общем каталоге, а не только обычные сундуки.
- Проверяются существование сундука, его ключа, универсального ключа и всех item-наград; награды золотом остаются допустимыми без item ID.
- Некорректный NPC-набор в D1 вызывает fail-closed в strict режиме и общий безопасный fallback в нестрогом режиме; Node-регрессии на обе ветки и корректные золотые награды.
- Нет изменений в Worker, D1, исходных игровых данных, формулах или существующем UX.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.523.0 — 2026.11.09.523 · Профиль предупреждает об ошибке открытия билдов после успешного входа

- При успешном входе в аккаунт ошибка переключения локальной библиотеки больше не скрывается проверкой старого гостевого запроса. Сообщение показывается только активному владельцу аккаунта; авторизация не сбрасывается, повторное переключение не инициируется.
- Краткая RU/EN подсказка без технических идентификаторов. Chromium сценарий намеренно имитирует нехватку браузерного хранилища и подтверждает восстановление на следующей загрузке.
- Не изменяются Worker, production D1, игровые данные и формулы.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.522.0 — 2026.11.09.522 · Исходные игровые ссылки и переносы не повреждаются при сохранении описаний

- В админке Энциклопедии неизменённый видимый текст описания сохраняет исходные игровые ссылки `<item N>`, `<br>` и выделение, не восстанавливая их по совпадениям имён.
- Два одинаковых связанных предмета теперь не вызывают ложную ошибку сохранения. Реальные неоднозначные изменения продолжают требовать уточнения — неверные ссылки не назначаются автоматически.
- Три Node-регрессии. Никаких изменений Worker, D1, исходных описаний и игровых формул.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.521.0 — 2026.11.09.521 · Предотвращение записи чужого билда после позднего переключения вкладок

- При owner-scoped записи `setOwned` после чтения прежнего значения повторно проверяет marker. Если другая вкладка захватила общий primary slot, записывает данные только в персональный backup и не изменяет чужой активный слот.
- Node-регрессия перехватывает второй getItem в реальном модуле, переключает аккаунт и проверяет оба owner cache/primary для всех четырёх сохраняемых ключей.
- Это защита конкретно воспроизведённой гонки, не замена транзакциям; никаких изменений D1, Worker, игровых данных или формул.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.520.0 — 2026.11.09.520 · Подключение библиотеки по коду откатывается при ошибке сохранения

- Код подключаемой гостевой библиотеки сохраняется только после успешного активирования локального владельца; неуспех не подменяет исходную библиотеку на следующей загрузке.
- Если переключение владельца или запись нового кода не удалась, возвращаются исходный ключ и контекст, без отправки облачного запроса на новую библиотеку.
- Добавлены три независимых Node-регрессии на исходную production-функцию (успех, ошибка переключения, browser quota).
- Worker, production D1, игровые данные и формулы не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.519.0 — 2026.11.09.519 · Облачные операции не переходят на гостевой ключ после смены аккаунта

- До отправки запросов `/api/library` проверяется, что текущая учётная сессия и владелец рабочего пространства остались прежними после получения token().
- Подмена account request гостевым ключом при истечении сессии/смене владельца отклоняется до сети. Экран получает локализованное предупреждение, без подтверждения облачной записи.
- Проверка не препятствует штатным гостевым запросам и явному импорту библиотеки по валидному личному коду.
- Добавлено семь независимых Node-регрессий. Нет изменений в Worker, D1, сохранённых данных или игровых формулах.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.518.0 — 2026.11.09.518 · Контролируемая проверка третьей вкладки без разглашения кода библиотеки

- В Chromium добавлен искусственно отложенный `/me` при загрузке третьей вкладки: до подтверждения владелец остаётся на корректном аккаунте, гостевые запросы не отправляются; после ответа восстанавливаются профиль и сохранения.
- Тест поздней авторизации ждёт завершённого HTTP-ответа облачной библиотеки, а не гоняется с асинхронным счётчиком запросов.
- В исключениях теста и его диагностике больше не выводится весь гостевой `owner` и ключ библиотеки — только тип владельца или логический признак совпадения.
- Никаких изменений D1, Worker, игровых значений и поведения пользователей; усилена приёмка открытой #253.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.517.0 — 2026.11.09.517 · Профиль завершает проверку даже при ошибке локального восстановления билдов

- Завершение профиля и очистка временного сообщения проверки выполняются в finally после завершения проверки аккаунта и локального bootstrap, даже если обработчик возвращает ошибку/отклонённый Promise.
- Добавлены регрессионные тесты verified, offline и guest callback failures.
- Не меняются Worker, D1, формулы игры, библиотека билдов и игровые данные.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.516.0 — 2026.11.08.516 · Единая доступность подсказок предметов, душ и навыков без потери описаний

- Единые helper-функции ARIA link/unlink переиспользуются всеми тремя контроллерами вместо перезаписи и удаления всего `aria-describedby`.
- Подсказки предметов, душ и навыков сохраняют независимые текстовые описания для экранных дикторов.
- Обновлены существующие регрессионные проверки контроллеров, добавлены проверки отсутствия дублирования и корректной очистки.
- Задержки hover 650 мс, визуальный UI, формулы, каталог, D1 и Worker не менялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.515.0 — 2026.11.08.515 · Подсказки Книги героя сохраняют исходные описания для экранных дикторов

- Короткая подсказка больше не перезаписывает и не стирает существующий `aria-describedby`: при показе присоединяет только свой tooltip ID, при закрытии удаляет только его.
- Регрессии покрывают несколько текстовых описаний, динамическое добавление описания и переключение между подсказками.
- Без изменения игрового каталога, формул, Worker, D1 и пользовательских билдов.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.514.0 — 2026.11.08.514 · Точная проверка аккаунта без повторного переключения библиотеки при локальной ошибке

- Вызов `onLogin` вынесен за обработку ответа `/api/account/me`: ошибка перехода локальной библиотеки больше не выдаётся за сбой сети и не запускает вход повторно.
- Новые Node-регрессии проверяют успешную верификацию и настоящий временный HTTP 503 при исключении в локальном обработчике.
- Без изменения авторизации Worker, D1, каталога, игровых формул и сохранённых пользовательских данных.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.513.0 — 2026.11.08.513 · Защита резервных копий билдов от смешивания данных между вкладками при переключении аккаунта

- Защита резервных копий билдов от смешивания данных между вкладками при переключении аккаунта.
- Межвкладочное чтение проверяет неизменность владельца до сохранения резервного снимка; переключение, столкнувшееся с другой вкладкой, прекращается до перезаписи общих ключей.
- Три регрессионных сценария эмулируют переключение аккаунтов при чтении, сохранении и восстановлении данных; getOwned повторно проверяет marker до выдачи общего ключа. Никаких изменений в D1, Worker, игровом каталоге или формулах.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.512.0 — 2026.11.08.512 · Точное отображение всех игровых переносов

- При отображении описаний предметов и душ игровые `<br>`, `<br/>`, `<BR />` и реальные переводы строк продолжают превращаться в переносы без показанных HTML-тегов. Но теперь `formattedDescription` больше не удаляет **конечные** игровые переводы строк и не сжимает три и более подряд в два.
- В текущей сохранённой копии OS обнаружено 16 русских описаний предметов, 9 душ и 27 EN-описаний с конечным `<br>` (включая пару `<br><br>`). Исходные строки не меняются; только визуальное представление сохраняет авторские переносы.
- Наружные горизонтальные пробелы по-прежнему убираются; внутренние слова, эффекты, ссылки на предметы и числовые характеристики остаются исходными.
- Добавлены Node-регрессии с текущими RU/EN записями OS, тремя и более переносами, разным регистром тегов и ссылкой `<item 300001>`. Повторное форматирование должно быть идемпотентным.
- Никаких изменений D1, игровых таблиц, пользовательских билдов или Cloudflare Worker.



## 0.511.0 — 2026.11.08.511 · Безопасное локальное сохранение между вкладками

- Перед записью черновика/билда/очереди удаления/активного билда в общие ключи браузера сохраняется **независимая резервная копия текущего владельца**. Неуспешная запись копии из-за лимита браузера не меняет общие данные.
- После сохранения копии повторно проверяется владелец общих ключей. Если соседняя вкладка успела сменить аккаунт, запись применяется только к изолированной копии инициатора и не меняет чужой активный черновик.
- Если смена владельца произошла прямо во время сохранения копии, возможно, другая вкладка успела перезаписать её старым состоянием. В этом случае новый черновик повторно закрепляется в копии инициатора после переключения.
- Если обновить общие ключи не удалось, прежняя резервная копия восстанавливается. Разные владельцы по-прежнему не объединяются.
- Детерминированные Node-тесты имитируют переключение владельца во время записи, смену непосредственно после чтения общих ключей и ошибку сохранения. Повторная проверка существующих сценариев Chromium с двумя/тремя аккаунтами.
- Данные игры, Worker, D1, формулы и сохранённые билды в облаке не изменяются. У браузерного localStorage нет межвкладочных транзакций: это снижение риска, не обещание абсолютной атомарности.



## 0.510.0 — 2026.11.08.510 · Проверка источника D1 в расчётном модуле

- Загрузка девяти расчётных ресурсов персонажа (`meta`, `classes`, `skills`, `items`, `souls`, `racialPassives`, `unison`, `tables`, `itemForth`) проверяет `X-PS-Catalog: d1` **для каждого ответа**, а не только одинаковые имена snapshot.
- Английские игровые описания из `stringsEn` проверяют и `X-PS-Catalog: d1`, и действующий идентификатор snapshot. Подложный архивный JSON не меняет выбранный язык и расчёты.
- Сохранённые локальные игровые данные остаются доступны только при явном выборе архивного режима; они не обязаны содержать D1-заголовки.
- Исполняемые Node-регрессии запускают реальный код функций загрузчика с поддельными HTTP-ответами и проверяют остановку до разбора недоверенного английского JSON.
- Нет изменений Worker, игровых формул или состояния D1. Совместимо с подтверждённо развёрнутым Worker 0.361.0.


## 0.509.0 — 2026.11.08.509 · Поздняя сессия аккаунта и три вкладки

- Исправлено окно гонки между загрузкой обычного скрипта аккаунта и отложенным запуском основного приложения. Если другая вкладка успела сохранить действительную сессию в localStorage, перед `init()` аккаунт считывает её повторно и проверяет через `/api/account/me` вместо ошибочного гостевого режима.
- Уже действующая сессия конкретной вкладки не подменяется входом другого пользователя в соседней вкладке. При временной ошибке сети аккаунт сохраняется с пометкой offline, без неверного выхода.
- Новый Node сценарий с добавлением сессии после выполнения аккаунт-скрипта и задержанным ответом `/me`.
- Новый Chromium-тест задерживает загрузку `pandora-studio-app.js`, затем имитирует сохранённый вход и проверяет, что загружается только облачная библиотека правильного аккаунта; никакой авторизационный токен не печатается в CI.
- Не меняет D1, игровые формулы, данные, учётные записи и сохранённые билды.


## 0.508.0 — 2026.11.08.508 · Проверка происхождения опубликованных D1 JSON в Энциклопедии и админской сверке

- Проверка происхождения опубликованных D1 JSON в Энциклопедии и админской сверке. Источник каждого удалённого набора данных обязан подтверждать `X-PS-Catalog: d1` и единый `X-PS-Catalog-Snapshot`; архив никогда не маскируется под D1.
- Админский импорт отвергает неверный источник также для D1-перевода `legacyLocale`; публикация недоступна при неполной или неподтверждённой сверке.
- Node/Chromium тесты включают поддельный источник с корректным JSON и snapshot ID. В строгом production режиме нет незаметного fallback на архив.
- Требуется Worker 0.361.0 с CORS-доступом к provenance; его production deploy проверен в Actions. В D1 ничего не записывается.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.507.0 — 2026.11.08.507 · Админка: безопасное добавление шести подтверждённых русских описаний подземелий в D1 по явному выбору

- Админка: безопасное добавление шести подтверждённых русских описаний подземелий в D1 по явному выбору. В текущей игре нет русских полей blurbRu; допустимы только шесть ранее утверждённых переводов из проверенной копии проекта.
- Обязательна полная идентичность остальных игровых полей между текущим игровым JSON, опубликованным D1 и архивом, включая имена, связанные монстры и базовые описания.
- Уже заполненные в D1 русские описания никогда не заменяются. При дальнейшем обновлении игрового каталога существующий русский перевод сохраняется, только если исходное описание осталось неизменным.
- Чекбокс и компактный просмотр текстов доступны только после успешной сверки; публикация проходит через обычную D1 staged snapshot + expectedActive compare-and-set и отдельное подтверждение. Сам релиз не меняет D1.
- Проверки позитивных и негативных сценариев в Node/Chromium; фактическую публикацию RU описаний должен отдельно подтвердить администратор.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.506.0 — 2026.11.08.506 · Админка: оригинальные переносы описаний видны при сверке игры, без скрытых действий и автоматического сохранения

- Админка: оригинальные переносы описаний видны при сверке игры, без скрытых действий и автоматического сохранения.
- Чекбокс восстановления авторских переносов из игрового JSON находится рядом с подтверждением каталога и появляется только при настоящем formatting-only отличии. Сохранение по умолчанию выключено; для записи нужен явный выбор и подтверждение.
- Регрессия для <br>, <br/> и <BR /> в RU/EN и для публикации переносов без изменения игрового текста и характеристик.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.505.0 — 2026.11.08.505 · Диагностика игрового источника из Worker

- Live-readiness делает реальный анонимный GET /api/source-health от опубликованного Worker вместо проверки только флага доступности API.
- Если внешний игровой источник временно недоступен, выводится отдельный WARN, а рабочий D1-каталог оценивается независимо. Нет приватных токенов и сырых сообщений ошибок в логах.
- Добавлены Node-проверки корректных/некорректных ответов, безопасности сообщений и read-only вызова.
- Ни Worker, ни production D1, ни боевые формулы не изменялись.


## 0.504.0 — 2026.11.08.504 · Удалена устаревшая подмена игровых характеристик

- Удалён исторический read-only overlay, который изменял ОЗ/сопротивления и дроп монстров при определённых старых SHA каталога. Его коррекции уже не соответствуют текущей игре.
- Подтверждённый D1 остаётся единственным источником игровых характеристик; атомарный переход на проверенный локальный архив при ошибке остаётся без изменений.
- Единственный текстовый fallback для шести RU описаний подземелий работает только при одинаковом английском первоисточнике.
- Добавлены тесты на отсутствие скрытой подмены характеристик и защищённый перевод. Без изменения production D1 и формул.


## 0.503.0 — 2026.11.08.503 · Original game-source descriptions RU/EN

- Restore OS-authored descriptions to the GitHub fallback archive: 832 items, 13 souls, 833 EN item descriptions and 20 EN soul descriptions, only description fields.
- A complete read-only comparison verified that the source game JSON matches production D1 before taking text: original line breaks, formatting and item links remain authoritative.
- No changes to combat formulas, source IDs, equipment stats, names, Worker or production D1. Other source SHA entries are deliberately untouched.
- Node/Chromium regression checks and live parity are required; a successful PR check alone does not certify deployment.


## 0.502.0 — 2026.11.08.502 · Два HP боссов и SHA монстров приведены к текущему игровому OS

- Сверены все 702 монстра по текущему официальному /gamedata/monsters.json и публичному D1. Активный D1 полностью совпал с игровым источником; резервный GitHub-архив ошибался лишь по двум HP.
- В резервном каталоге исправлены: Восставший король (43650) 5 000 000 → 1 250 000; Хранитель тлена (43732) 1 600 000 → 1 350 000. SHA файла monster/monster.csv обновлён до официального f637f83a84a49c74.
- Прочие OS source-хэши, D1, Worker, формулы и пользовательские билды не менялись. Добавлены регрессии на HP и сохранение остальных полей.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.501.0 — 2026.11.08.501 · Автоматическая read-only проверка D1 после публикации GitHub Pages

- Live-readonly check is triggered on bonaqu_projects push because the built-in GitHub Pages dynamic deployment did not emit observable workflow_run events.
- The check waits for the public version (up to 60 attempts at 5-second intervals) before verifying Worker, CORS and D1; a newer release cancels the old check.
- Schedule, manual dispatch and workflow_run are retained. No D1 writes or credentials. Verify an actual post-merge run before claiming the trigger operational.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.500.0 — 2026.11.08.500 · Проверка реальных ссылок предметов и честный отчёт целостности D1

- Read-only сверка архивных и опубликованных описаний RU/EN проверяет каждую ссылку <item N> по реальному каталогу ID и не допускает висячих ссылок даже при идентичных исходниках.
- Исправлена формулировка итогов CI: число ресурсов, реально прочитанных из D1, больше не уменьшается от количества расхождений или нарушений ссылок.
- Регрессии на валидные, отсутствующие и некорректные ссылки; работа с D1 строго GET без данных авторизации.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.499.0 — 2026.11.08.499 · Восстановление ссылок в архивных описаниях и точный аудит D1

- В архивных описаниях хеллоуинского сундука и тыквы восстановлены две подтверждённые публичным D1 ссылки на реальные игровые предметы и их исходные переносы.
- Read-only сверка каталога различает отклонения разметки <br>, inline-оформления, ссылок <item> и другого текста. Все реальные несовпадения остаются блокирующими для CI, никаких автоматических записей в D1 нет.
- Добавлены проверки кликабельных ссылок в режиме архива и точности read-only диагностики; задокументирован прямой public-снимок.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.498.0 — 2026.11.08.498 · Актуальная облачная библиотека при параллельных обновлениях

- Два параллельных запроса «Обновить библиотеку» не могут примениться в обратном порядке: устаревший GET и его ошибки игнорируются до пересогласования D1-сохранений.
- Для запроса облачной библиотеки установлен ограниченный таймаут (20 с чтение, 25 с запись), чтобы зависшее соединение не держало интерфейс в ожидании бесконечно.
- Node-регрессии на ответы в обратном порядке и позднюю ошибку сети. Данные D1, игровые формулы и Worker не меняются.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.497.0 — 2026.11.08.497 · Защита черновиков при нехватке места в браузере

- Открытие сохранённого билда, создание нового и открытие билда из ссылки теперь сначала записывают целевой черновик в браузер, и лишь после успешной записи меняют активный билд и интерфейс.
- Ошибка браузерной квоты не уничтожает текущий черновик, не закрывает окно ссылки и сопровождается понятным сообщением RU/EN.
- Добавлены регрессии на сбой записи при открытии и единый порядок переходов. Облачные данные и игровые формулы не затронуты.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.496.0 — 2026.11.08.496 · Безопасная диагностика расхождений D1 и каталога

- Read-only CI теперь подробно разделяет отсутствующие, дополнительные и изменённые записи D1 по каждому ресурсу (без имён, ID или значений); настоящие расхождения по-прежнему завершают проверку ошибкой.
- Исторический run 0.492.0 выявил дрейф items, souls и stringsEn; документация явно помечена как неактуальная для этого снимка.
- Добавлены проверки приватности и неизменности исходных данных. Никаких D1-записей или изменений формул.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.495.0 — 2026.11.08.495 · Escape закрывает краткие подсказки до навигации по Книге героя

- У коротких подсказок (Книга героя, Энциклопедия) Escape сначала отменяет показ/таймер, не закрывая главу.
- Первый внешний клик отменяет и ожидающий hover-таймер; больше нет поздней подсказки после смены действия.
- Тесты подтверждают однократную отмену; следующий Escape продолжает обычную навигацию. Игровые формулы, Worker и D1 не затронуты.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.494.0 — 2026.11.08.494 · Единое восстановление сохранённых билдов и нейтральные обозначения разницы A/B

- Открытие сохранённого билда и read-only сравнение A/B теперь используют один и тот же валидатор и восстановление исторических полей; устранён дублирующий код.
- Разница характеристик A/B больше не маркирует всякое увеличение зелёным и уменьшение красным: знак сохранён, интерпретация игрового эффекта не подменяется.
- Добавлены Node-регрессии для общего восстановления и нейтральных обозначений; старые проверки изолированного открытия переведены на единый helper.
- Пока D1-каталог загружается, A/B сообщает о загрузке, а не о повреждении сохранений. Production D1, Worker и боевые формулы не изменялись.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.493.0 — 2026.11.08.493 · Компактное сравнение по Remaked

- В «Мои билды» таблица A/B теперь показывает только различающиеся основные итоговые характеристики из расчёта Книги героя, по принципу Remaked (ОЗ/ОМ, АТК/МАТК, DEF, точность, уклонение, криты, скорость, сопротивления); без вкладок, поиска, перечисления слотов, душ, вложенных очков, настроек усилений и дублирующихся групп.
- Сохранены выбор двух билдов, перестановка A/B, числовая разница B−A, одинаковые алгоритмы расчёта и поддержка RU/EN. Если характеристика не подтверждена, не подменяем её нулём; подтверждённые игровые диапазоны АТК не теряются. Разреженные старые записи проходят тот же безопасный слой подстановки исторических значений перед расчётом, что и при открытии, без записи в хранилище.
- Нет лишней отдельной модалки и горизонтального переполнения страницы на мобильных: компактная таблица встроена в «Мои билды». Модель полного сравнения сохранена для совместимости и регрессионных тестов; в интерфейсе не используется.
- Обновлены Playwright проверки компактности, доступности и разницы, Node тесты ключевых характеристик. Game source, Worker и production D1 не менялись.

## 0.492.0 — 2026.11.08.492 · Регулярная проверка согласованности D1

- В существующий GitHub Actions Live Pages and Worker readiness добавлен read-only аудит 16 игровых датасетов после полного успешного деплоя GitHub Pages и по ежедневному расписанию.
- Проверка запускается только после ожидания опубликованной версии и проверки здоровья Pages, Worker, D1 и CORS, чтобы избежать заведомо устаревших снимков.
- `--strict-ru` не включён: шесть подтверждённых отсутствующих русских описаний в D1 пока являются явно отмеченным долгом, а не причиной ложного красного CI. Любое иное расхождение продолжает проваливать проверку.
- Добавлены статические Node-регрессии workflow: порядок шагов, автоматическая и ручная доступность, отсутствие secrets и мутирующих команд. Исключение отсутствующих RU описаний ограничено шестью подтверждёнными игровыми ID, новые пропуски проваливают проверку. Worker, production D1 и формулы не изменялись.

## 0.491.0 — 2026.11.08.491 · Повторяемый read-only аудит игрового каталога D1

- Сверены все публичные записи 16 типов данных Pages/D1. Пятнадцать игровых ресурсов совпадают полностью; у шести подземелий в D1 пока нет русского поля blurbRu, остальные поля совпадают.
- Добавлен npm run catalog:parity:live: проверка активного snapshot, классов, itemForth, unison, expertise и stringsEn, GET без авторизации и записи, детектор расхождений, безопасное исключение только для подтверждённого совпадения английских описаний и отсутствие двойных переводов. --strict-ru выявляет неустранённый долг миграции.
- Node.js тесты на полные совпадения, порядок JSON, недостающий перевод, изменённый оригинал, лишние/изменённые записи. Production D1, Worker и игровые формулы не менялись.

## 0.490.0 — 2026.11.08.490 · Сравнение A/B не маскирует повреждённые настройки героя

- Повреждённые пол, автоматическое мастерство, титул чести, профиль и список сопротивлений теперь отображаются как неизвестные вместо выдуманных «Женский», «Вкл», «Без титула» или технического текста.
- Два неизвестных игровых ID расы/профессии и разные повреждённые значения остаются различимы в «Только отличия» без показа внутреннего payload.
- Прежние умолчания и точные строковые значения пола/титула сохранены, сохранённые данные и игровой калькулятор не переписываются.
- Добавлены RU/EN регрессии на повреждённые данные, Node/Chromium CI. Worker и production D1 не менялись.

## 0.489.0 — 2026.11.08.489 · Автообновление не стирает резервный код и несохранённые формы аккаунта

- Готовый одноразовый код восстановления, незавершённый запрос аккаунта, заполненная парольная форма и открытый профиль защищены от автоматического обновления Pages. Ручное «Обновить» не скрывает секрет: переход блокируется с RU/EN объяснением.
- Проверка состояния отдаёт только тип причины, без самого токена/пароля/кода. После сохранения кода или завершения формы разрешено обновление.
- Node.js регрессии выполняют реальный update-manager, имитируют idle >120 секунд, RU/EN, ручной отказ и повторную попытку. Chromium проверяется полным smoke suite. Worker, игровые формулы и production D1 не меняются.

## 0.488.0 — 2026.11.08.488 · Резервный код при переполнении браузерного хранилища

- При успешной регистрации отказ записи ключа сессии в localStorage больше не скрывает одноразовый код восстановления: аккаунт остаётся доступен в текущей вкладке, а пользователь видит RU/EN предупреждение о повторном входе после перезагрузки.
- Node.js проверка искусственно выбрасывает QuotaExceededError и убеждается в сохранении одноразового кода и состояния сессии после перерисовки.
- README и аудит Branches приведены к текущей единственной основной ветке; добавлена матрица 12 актуальных открытых Issues с условиями закрытия. Worker, production D1 и игровые формулы не изменялись.

## 0.487.0 — 2026.11.08.487 · Учётная запись сохраняется при неполном ответе проверки

- Восстановление учётной записи не разлогинивает пользователя при HTTP 200 с пустым/неполным JSON или отсутствующим именем владельца: статус временно «offline» с сохранением сессии.
- Подтверждённый другой владелец и HTTP 401/403 по-прежнему блокируют использование неверной сессии.
- Node.js и Chromium регрессии покрывают неполный/нечитаемый 200, 503, 401 и несовпадение владельца. Production D1, Worker и игровые формулы не изменялись.

## 0.486.0 — 2026.11.08.486 · Двуязычные редакторы выбора в Энциклопедии

- Общие административные селекторы Энциклопедии используют RU/EN подписи и `aria-label`: поиск предметов, классы, эффекты, зависимости навыков и слоты душ.
- Доступные названия кнопок удаления связей и добавления условий не остаются на русском в английской версии. Сами названия игровых предметов и персонажей не изменялись.
- Добавлены Node-регрессии и применён существующий Chromium suite администратора и Энциклопедии. Рабочая D1, Worker и боевые формулы не затрагивались.


## 0.485.0 — 2026.11.08.485 · Двуязычная доступность выбора профессии

- В «Происхождение → Профессия» тексты для экранного диктора на этапах, навигации и всех вариантах выбора теперь соответствуют языку сайта. Добавлены RU/EN Node и Chromium проверки.
- Проведён аудит трёх устаревших веток в `docs/LEGACY_BRANCH_RETIREMENT_2026-11-08.md`. Прежние два исправления находятся в основной истории, английская Claris уже поддерживается на main; физическое удаление старых Git refs недоступно через текущий коннектор.
- Игровые данные, Worker, D1 и расчётные формулы не менялись.


## 0.484.0 — 2026.11.08.484 · Английские карточки и поиск в сохранённых билдах

- Английская карточка сохранённого персонажа показывает английское название расы. Имя, выбранное игроком, не переводится.
- Поиск сохранённых билдов понимает обе локализации рас (например, Elf/Эльф), независимо от языка сайта.
- Динамическое подтверждение перезаписи с именем билда полностью переведено, добавлена английская кнопка «Сохранить в этот билд».
- Node-регрессии и Chromium-тест шести сохранённых билдов, EN, поиск Elf/Эльф, проверка неизменности библиотеки при открытии подтверждения. Worker, D1 и игровые формулы не изменялись.


## 0.483.0 — 2026.11.08.483 · Защита входа от чужого выхода при совпадении токенов

- Пассивно истёкший старый вход не стирает чужую сессию или более новый expires. Явный выход и подтверждённый отзыв токена завершают все вкладки **того же владельца с тем же bearer**, даже если expires в общей записи уже обновлён.
- Межвкладочное событие удаления проверяет не только токен, но и каноническое имя аккаунта. При настоящем выходе того же владельца завершение сеанса работает как прежде.
- Node-тесты покрывают оба режима выхода. Chromium добавляет безопасную диагностику третьей вкладки, а тест отказа игрового прокси принимает первый упавший JSON-файл при параллельной загрузке, сохраняя проверки HTTP 502 и причины network. Worker, production D1 и игровые данные не менялись.


## 0.482.0 — 2026.11.08.482 · Единообразные английские подписи экипировки и выбора предметов

- Все 14 слотов экипировки используют общий RU/EN список, включая номера колец и серёг. Убраны русские подписи пустых слотов и подсказок из английского режима.
- Переведены управление подбором предметов, поиск, количество результатов, дозагрузка списка и известные причины недействующего предмета. Сортировка учитывает выбранный язык.
- Node и Chromium регрессии проверяют локализацию реальных рельсов и окна выбора. Каталог, Worker и D1 не менялись.


## 0.481.0 — 2026.11.08.481 · Регистрация и восстановление устойчивы к смене языка во время запроса

- Запросы регистрации, входа и восстановления привязаны к конкретной гостевой сессии и не допускают параллельных отправок даже при пересоздании формы во время RU/EN переключения.
- Пока ответ ожидается, смена вкладки и повторная отправка заблокированы; после ошибки интерфейс разрешает повторить, после регистрации резервный код отображается в актуальной форме.
- Chromium: задержанная регистрация, смена языка и единственность отправки, получение одноразового кода. Существующие проверки аккаунтов и межвкладочной изоляции сохраняются.
- Production Worker, D1 и игровые формулы не изменялись.


## 0.480.0 — 2026.11.08.480 · Надёжное открытие билдов с повреждёнными настройками слотов душ

- Сохранение индивидуальных слотов душ больше не ломается при открытии сохранённого билда с повреждённым вложенным полем.
- Вложенные объекты безопасно подготавливаются при первичной загрузке, восстановлении владельческой области и открытии сохранённого героя: строки и массивы не подменяют структуры экипировки, душ, самоцветов и усилений.
- Node-тесты восстановления и неизменности исходного JSON; Chromium-сценарий открытия повреждённого сохранения и настройки слотов.
- Игровые формулы, каталог, Worker и production D1 не менялись.


## 0.479.0 — 2026.11.08.479 · Сравнение билдов отличает повреждённую заточку от настоящей +0

- Сохранённый повреждённый уровень заточки предмета больше не отображается как настоящий +0 в сравнении A/B. Отсутствующая запись старого билда корректно остаётся +0.
- Различия между двумя повреждёнными значениями учитываются в «Только отличия» без отображения внутренних исходных данных.
- Проверены RU/EN, заточки +0/+7, повреждённые строки и числа, неизменность сохранений и отказ вычислителя. Игровой калькулятор, Worker и D1 не менялись.


## 0.478.0 — 2026.11.08.478 · Смена пароля безопасна при переключении языка и позднем ответе

- Поправлена гонка формы изменения пароля: успешный отложенный ответ после переключения языка закрывает текущую, а не удалённую форму и очищает поля пароля.
- Пока запрос выполняется, заново созданная кнопка остаётся недоступной для повторной отправки. Ошибки позволяют исправить ввод.
- Сверка ревизии применяется к смене пароля, загрузке профиля `/me` и отложенному выходу: старый ответ не сбрасывает новый вход даже при совпавшей строке bearer. Добавлен Node-тест отложенного 401.
- Chromium проверяет медленный запрос, RU→EN→RU и очистку полей. Игровой каталог, Worker и D1 не изменялись.


## 0.477.0 — 2026.11.08.477 · Сохранение душ при расхождении вместимости экземпляра и каталога

- Исправлена потеря душ при открытии билда с `soulOwners`: если у **того же** предмета явно сохранены 2 души, но каталог по умолчанию предусматривает 1 слот, обе остаются в сохранении до выбора правильной вместимости. Для древних записей без привязки к предмету строгая очистка сохраняется.
- Лишние души отмечены понятным предупреждением RU/EN и **не учитываются** при расчёте, пока выбранная вместимость их не допускает.
- Сохранены проверки против переноса душ при замене самой вещи и несовместимых типов душ.
- Node.js регрессии и Chromium-сценарий на реальных игровых ID железных поножей и двух совместимых душ. D1 и игровая механика не изменялись.


## 0.476.0 — 2026.11.08.476 · Старые усиления корректно сравниваются без ложных нулей

- Исторические числовые усиления, записанные в сохранении строкой («5»), корректно сравниваются с текущим числом 5 без ложного отличия.
- Повреждённые числовые/булевы параметры не подменяются нулём либо «Выкл», а честно обозначаются как неизвестные. Разницу с исправным билдом видно даже в «Только отличия».
- То же правило применяется к короткому описанию различий, без технического «null».
- Добавлены Node.js проверки, RU/EN и неизменности исходных сохранений. Игровые формулы и D1 не менялись.


## 0.475.0 — 2026.11.08.475 · Большие карточки предметов и навыков закрываются после перерисовки

- Большие карточки предметов и душ больше не остаются поверх Энциклопедии при замене исходной ссылки; при удалении элемента контроллер закрывает предпросмотр.
- Аналогичная защита добавлена в предпросмотр расовых пассивок и навыков Пути героя.
- DOM-наблюдатели существуют только пока карточка показана. При закрытии aria-describedby очищается; задержка мыши 650 мс и доступность клавиатуры не менялись.
- Добавлены два реальных Chromium-сценария удаления исходного элемента и тесты подключения/отключения наблюдателя.
- Без изменений боевых формул, сохранений и D1.


## 0.474.0 — 2026.11.08.474 · Сравнение билдов: честные значения заточки и неизвестных самоцветов

- Сравнение двух сохранённых персонажей больше не отображает подтверждённую заточку 0 у отсутствующего предмета или при отсутствии функции вычисления.
- Повреждённый или устаревший самоцвет обозначается понятной надписью, а не как пустой слот. При разных исходных данных режим «Только отличия» сохраняет строку даже при совпадающих внешних подписях.
- Добавлены тесты отсутствующего предмета, повреждённого самоцвета, недоступных переводов и неизменности сохранённых данных.
- Данные игрового каталога, Worker/D1 и математические формулы не менялись.


## 0.473.0 — 2026.11.08.473 · Подсказки автоматически закрываются при замене интерфейса и навигации

- Короткие подсказки больше не остаются висеть после удаления своей ссылки при перерисовке Книги героя/разделов сайта; наблюдение за DOM включено только на время видимой подсказки.
- Прокрутка после удаления источника также закрывает подсказку; popstate/hashchange и внешний клик отменяют устаревшее объяснение.
- При смене элемента все устаревшие aria-describedby и DOM-наблюдатели удаляются. Добавлены изолированные Node.js регрессии жизненного цикла с тестовой DOM-моделью.
- Без изменения задержки hover, игровых формул, каталогов и сохранений.


## 0.472.0 — 2026.11.08.472 · Ограниченная проверка входа и диагностика восстановления аккаунта

- Проверка сохранённой учётной записи больше не ожидает /me неограниченно: до 12 секунд, сессия сохраняется при сетевой ошибке или истечении ожидания.
- Пока идёт проверка, профиль показывает «Проверяем учётную запись…» / «Checking your account…», а не предложение повторного входа.
- Подтверждённая сессия, временная недоступность и реальный выход различаются внутренними состояниями verified/offline/guest без публикации токенов.
- Chromium-тест трёх вкладок ждёт подтверждения /me; диагностические сообщения содержат только состояние и HTTP-статусы, без ключей и паролей.
- Это ограничение и диагностика неопределённого сбоя #253, не доказательство устранения всей гонки. Данные D1 и игровые формулы не менялись.


## 0.471.0 — 2026.11.08.471 · Полный перевод видимых элементов профиля, выхода и ошибок аккаунта RU/EN

- Переведены EN подписи учётной записи, привязки облачных билдов и полного выхода из профиля; ранее эти элементы оставались русскими.
- Добавлены корректные варианты переводов сообщений ошибок авторизации. RU-подписи не изменялись.
- Добавлены проверки реального словаря интерфейса по строкам, используемым профилем.
- Игровые формулы, D1, Worker, сохранения и токены не изменялись.


## 0.470.0 — 2026.11.08.470 · Понятный счётчик Энциклопедии RU/EN

- Вместо технического «Наша база данных состоит из» подвал показывает «В энциклопедии: N навыков · M предметов · K душ»; английский интерфейс — «Encyclopedia: N skills · M items · K souls».
- Числа считываются только из загруженного снимка каталога; не придумываются и не хранятся отдельно.
- Исправлен рассинхрон при смене RU↔EN: теперь подвал обновляется вместе с остальным интерфейсом, не сохраняя старый язык.
- Упрощено начальное сообщение до загрузки. Добавлены Node.js и Chromium проверки RU→EN→RU.
- Никаких изменений игровых формул, сохранений и D1.


## 0.469.0 — 2026.11.08.469 · Чистые сообщения загрузки и один путь сравнения билдов

- При ошибке стартовой загрузки обычный пользователь получает понятные RU/EN действия вместо сырых D1/HTTP/ID-ошибок; подробности по-прежнему доступны в консоли разработчика.
- Начальный экран корректно показывает выбранный язык ещё до выполнения основного JavaScript. Добавлены локализованные доступные названия состояния ошибки и отсутствующих изображений расы.
- Архивный режим сообщает о возможной неактуальности игровых данных простыми словами и обновляет предупреждение при смене RU/EN.
- Удалён устаревший неиспользуемый compareSnapshots с техническими ID и неполной английской локализацией; единственный рабочий сценарий — таблица A/B внутри «Мои билды».
- Тесты перепривязаны к действующему сравнению; Chromium проверяет выбор A/B, фильтры, перестановку и сохранение данных. EN-сравнение проверяется отдельно на уровне модели: глобальный переключатель языка недоступен внутри открытого модального окна.
- Без изменений сохранений, боевой математики, Worker и production D1.


## 0.468.0 — 2026.11.08.468 · Единое поведение предпросмотра навыков

- Большие подсказки навыков в Происхождении и Пути героя больше не появляются мгновенно при пересечении курсором: единый контроллер ожидает 650 мс, как предпросмотр предметов.
- При переходе между навыками прежняя подсказка закрывается и старому элементу удаляется aria-describedby. Исправлено накопление некорректных доступных описаний после замены карточки.
- На сенсорном устройстве hover не создаётся; клавиатура открывает предпросмотр сразу, Escape закрывает только подсказку. При прокрутке и навигации таймеры/позиция контролируются централизованно.
- Добавлены Node.js и Chromium проверки ожидания, перехода между двумя пассивками и отмены отложенного предпросмотра.
- Без изменения формул, каталога, D1, Worker и сохранённых билдов.


## 0.467.0 — 2026.11.08.467 · Двуязычное Происхождение и расовые пассивки

- Во вкладке «Происхождение → Характеристики» английская версия корректно отображает названия, сокращения, бюджет, итоговые подписи и aria-описания ввода и кнопок.
- Кнопки расовых пассивок, включая состояния «Выбрано»/«Выбрать», переключаются между RU и EN; имена/описания навыков берутся из уже локализованного каталога.
- Унифицированы имена характеристик для основного редактора и «Происхождения», без изменения старых ключей сохранённых билдов.
- В подсказках навыков переведены собственные UI-подписи «Уровень» и «Ещё N навыков», без придуманных переводов игрового контента.
- Добавлены Node.js и Chromium проверки RU/EN выбранного персонажа. Расчёты, D1, Worker и сохранения не изменены.


## 0.466.0 — 2026.11.08.466 · Читаемые умения и титулы вместо внутренних ID

- Сравнение билдов A/B показывает названия выбранных умений сопротивления из каталога, а не внутренние числовые ID. В EN использует актуальные переводы источников.
- Если запись умения или титула отсутствует, пользователю показывается понятная надпись; технический ID не раскрывается.
- Различия между двумя неизвестными умениями/титулами не теряются: идентичность проверяется отдельно от пользовательского названия.
- Неправильные значения массива умений не интерпретируются как ноль и не прячут ошибку в данных.
- Проверено Node.js сценариями RU/EN и сохранённой структурой снапшотов. Без изменений игровых формул, сохранений и production D1.


## 0.465.0 — 2026.11.08.465 · Понятные подсказки и эффекты Книги героя

- Полезные подсказки характеристик в Книге героя появляются с единой задержкой при наведении курсора; с клавиатуры доступны без ожидания.
- Убраны нативные title-подсказки описаний боевых навыков. Для них используется безопасный, читаемый компонент с такой же задержкой.
- У усилений жреца тип эффекта теперь виден отдельной строкой, а не спрятан в нативной русской подсказке (в EN показываются английские подписи).
- Удалена техническая сноска про старый симулятор и OS из пользовательского раздела «Эффекты умений»; сохранены сами значения, подписи и требования.
- Общая подсказка корректно повторно планируется после прокрутки, если курсор остался на элементе. Таймер отменяется окончательно, когда курсор действительно покинул элемент.
- Регрессионные тесты Node.js и Chromium. Нет изменений игровых формул, аккаунтов, Worker, D1 или сохранённых билдов.


## 0.464.0 — 2026.11.08.464 · Понятные названия характеристик в сравнении билдов

- Сравнение сохранённых билдов A/B использует те же имена характеристик, что «Происхождение»: Проворность (ПРВ), Ловкость (ЛВК) и Сила духа (СД).
- Старые ключи сохранённых билдов «Ловкость» (AGI), «Сноровка» (DEX) и «Дух» (SPI) читаются как прежде, чтобы не исчезали вложенные очки.
- Переводы EN (Agility, Dexterity, Spirit) и числовые разницы A/B остаются корректными; добавлены регрессии старых билдов.
- Незначительно упрощена передача полей подписей Книги героя. Нет изменений формул, сохранённых билдов, аккаунтов или D1.


## 0.463.0 — 2026.11.08.463 · Чистые подсказки и локализация Книги героя

- Удалены вводящие в заблуждение редакторские подсказки и пунктирное подчёркивание заголовков глав/групп и параметров без содержательного объяснения. Старые D1-заглушки игнорируются при показе игроку.
- Подсказки к реальным игровым характеристикам (ОЗ, ОМ и другим) и содержательные тексты редактора сохранены. Возможность редактировать RU/EN описание в режиме владельца осталась.
- Исправлены английские доступные имена навигации и англоязычное описание вкладки усилений; добавлены Node.js и Chromium регрессии.
- Без изменений игрового баланса, формул, Cloudflare D1, Worker и пользовательских сохранений.


## 0.462.0 — 2026.11.08.462 · Сравнение подтверждённого диапазона физической атаки

- В сравнении сохранённых билдов A/B добавлен диапазон физической АТК, если нижняя граница действительно подтверждена игровым клиентом (например, 50–74). Раньше отображался только максимальный показатель 74, скрывая различия нижней границы.
- Неизвестная или неподтверждённая минимальная АТК обозначается отсутствием подтверждённого значения; не создаются вымышленные коэффициенты и дельты. Обычный числовой результат АТК и сравнение максимумов остаются без изменений.
- Проверки для RU/EN, одинакового максимума с разным минимумом, отсутствующего минимума и безопасного расчёта изменений.
- Не менялись игровые формулы, каталоги Cloudflare D1, Worker и данные сохранённых билдов.


## 0.461.0 — 2026.11.08.461 · Гнёзда душ для конкретного экземпляра экипировки

- Можно выбрать 0–3 гнезда душ для конкретного надетого предмета, не меняя базовую карточку предмета и данные Cloudflare D1. Для подтверждённого игрового примера: железные поножи — 2 гнезда, пояс — 1.
- Слоты душ в свойствах, подсказках, выборах и Книге героя используют фактическое значение для выбранного экземпляра; гнёзда и вставленные души сохраняются в локальном черновике, личных билдах и публичной ссылке.
- Система не позволяет уменьшить число гнёзд, если в удаляемом гнезде установлена душа. Несовместимые типы предметов (плащи, серьги, кольца, амулеты) не получают кнопку выбора.
- Сравнение билдов A/B показывает различие количества гнёзд между версиями одной вещи, даже если идентификатор предмета совпадает.
- Добавлены Node.js и Chromium-проверки, включая RU/EN, перезагрузку страницы, сохранение двух душ при несовпадении со старым каталогом и защиту от переполнения.
- Без изменения исходных предметов в D1, игрового баланса, формул заточки или уже сохранённых билдов.


## 0.460.0 — 2026.11.08.460 · Устойчивость формы аккаунта

- Сообщения ошибок и подтверждения формы аккаунта сохраняются при повторной отрисовке той же сессии; не переносятся в другой аккаунт, в другое действие или после выхода. Секреты в localStorage не сохраняются.
- Запоздалый ответ смены пароля не перезаписывает поля и не выводит состояние старого пользователя после выхода/смены сессии. Запоздалый ответ logout не выходит из нового аккаунта.
- Chromium тестирует потерю сообщения после повторной отрисовки и гонку запоздалой смены пароля с выходом, в дополнение к старым сценариям RU/EN, bootstrap и восстановления.
- Без изменений базовых игровых данных, Cloudflare D1 и боевых формул.


## 0.459.0 — 2026.11.08.459 · Исправление бонусов заточки в свойствах предметов

- Исправлена ошибка карточек экипировки: вместо `Защита 12+N` (где N — ступень заточки) теперь показывается `12+floor(N×1,2)`. Для железных поножей +1…+10: `12+1 / 12+2 / 12+3 / 12+4 / 12+6 / 12+7 / 12+8 / 12+9 / 12+10 / 12+12`.
- Правило применяется ко всем шести категориям — щит, шлем, броня, перчатки, штаны, обувь — в свойствах и подсказках RU/EN. Название вещи по-прежнему содержит реальный уровень `+N`; общая защита героя по-прежнему суммирует дробные части до округления вниз.
- Подсказки оружия теперь согласованы с калькулятором: физическая заточка использует `tables.weaponPlus`, магическая `tables.magicPlus.ratio`, одновременно бонусы не начисляются. Старое сохранённое оружие без типа самоцвета отображает физический fallback, совпадающий с расчётом.
- Исправлено смещение переводимых/редактируемых подписей полей при условном добавлении строки МАТК и отсутствии слотов душ.
- Добавлены проверки фактического DOM для всех +0…+10, RU/EN и вариантов физической/магической заточки, а также Chromium-сценарий на реальной карточке поножей.
- Исправлена документация предыдущего релиза: `12+3` при +3 — отображённая прибавка `floor(3×1,2)`, а не универсальная запись номера заточки в поле защиты. Production D1, Worker и пользовательские билды не изменялись.


## 0.458.0 — 2026.11.07.458 · Общие правила заточки текущей игры, новость №4

- Вместо прежней Legacy-формулы `floor(уровень×1,5)` броня и щиты всех шести категорий получают **+1,2 Защиты за уровень**; дробные прибавки сохраняются при суммировании разных вещей, затем итоговая Защита отображается округлённой вниз.
- Убран ошибочный специальный костыль для железных поножей ID 13041. Для игрового комплекта эльфийки: сырой итог 47,6 → 47 в интерфейсе.
- Физическая заточка оружия использует уже присутствующую в данных текущую `weaponPlus` (уровни +1…+10, включая +7…+10); магическая заточка использует актуальные проценты `magicPlus.ratio` (1/3/5/8/11/15/19/23/27/32).
- Физические и магические прибавки заточки оружия не начисляются одновременно; тип выбирается из сохранённого самоцвета. В подсказке оружия с магической заточкой показывается бонус МАТК в процентах.
- Дополнены комплексные проверки заточки +0…+10, накопления дробей, RU/EN и живого игрового эталона. Источник — https://pandorasaga-os.com/#news/4.
- Без изменений в production D1, каталогах предметов и форматах пользовательских билдов.


## 0.457.0 — 2026.11.07.457 · Правильная доступность слотов душ в Энциклопедии

- В карточках предметов Энциклопедии не показывать параметр «Слоты душ» для плащей, серёг, колец и амулетов; эти категории в игре не используют души.
- Применить уже утверждённое общее правило из выбора экипировки, без дублирования логики или изменения характеристик предметов.
- В админке запрещено визуально добавлять несуществующий параметр слотов для таких категорий. У оружия, брони, шлемов, перчаток, штанов, обуви, щитов и поясов поле остаётся, включая 0.
- Новые RU/EN регрессионные проверки, без правок D1, игровых формул или опубликованного каталога.


## 0.456.0 — 2026.11.07.456 · Наблюдаемые защита и диапазон атаки

- Добавлена игровая регрессия комплекта эльфийки 45 уровня: защита 47, атака 50–74, точность 62, уклонение 52 и сопротивление льду 3.
- Железные поножи ID 13041 при +3 дают наблюдаемый бонус защиты +3 вместо Legacy +4; другие уровни/предметы не пересчитаны без игровых доказательств.
- Книга героя отображает диапазон АТК только при подтверждённой нижней границе; в остальных случаях прежнее верхнее значение сохраняется, без догадок.
- Проверяется также ранний игровой эталон эльфа-воина 1 уровня 9–12. RU/EN поддерживаются.
- Production D1, Worker и пользовательские сохранения не изменялись.


## 0.455.0 — 2026.11.07.455 · Откат переключения локальной библиотеки при сбое

- При ошибке записи во время смены аккаунта/гостевой библиотеки исходные ключи и маркер владельца восстанавливаются без частично смешанной библиотеки.
- Откат сохраняет исходное отсутствие ключей и выполняется при ошибке записи отдельных полей или итоговой резервной копии.
- Тесты моделируют отказ посередине переключения, отказ резервной копии и ошибку первоначальной установки владельца.
- Production D1, Cloudflare Worker и игровые формулы не изменяются.


## 0.454.0 — 2026.11.07.454 · Сохранение формы при поздней проверке аккаунта

- Поздний успешный ответ `/api/account/me` не пересоздаёт форму с незавершённым вводом, даже если панель аккаунта была временно закрыта.
- Подтверждённо недействительная сессия по-прежнему сбрасывает поля и переключает интерфейс на гостевой.
- Chromium E2E проверяет закрытие панели до ответа сервера и сохранение полей и сообщения об ошибке при повторном открытии.
- Игровые расчёты и production D1 не изменены.


## 0.453.0 — 2026.11.07.453 · Безопасное обновление при ошибке сохранения

- Переход на новую версию отменяется, если браузер не смог записать текущий черновик или библиотеку билдов.
- Уведомление об ошибке доступно на RU/EN, кнопка обновления остаётся для повторной попытки.
- После ошибки автоматическое обновление не повторяется до нового действия пользователя; добавлены регрессионные тесты.
- Игровые формулы и содержимое production D1 не меняются.


## 0.452.0 — 2026.11.07.452 · RU/EN просмотр ручных изменений Энциклопедии

- Админский просмотр ручных правок теперь использует выбранный язык сайта для заголовков, названий полей, поиска, статистики, истории до/после и действий.
- В EN появляются английские названия игровой сущности при наличии их в проверенном каталоге; если перевода предмета нет, исходное название сохраняется без выдуманных переводов.
- EN сопротивления, локации, NPC, внутренние разделы и требования веток используют понятные английские подписи.
- RU-представление не изменено. Добавлены тесты английского просмотра и сохранения прежнего русского отображения.


## 0.451.0 — 2026.11.07.451 · Восстановление черновика и библиотеки только для своего аккаунта

- Если две вкладки одновременно используют разные аккаунты, переключение владельца не читает чужие общие ключи браузера для восстановления текущего героя и сохранённых билдов. Используется уже существующая изолированная копия активного владельца.
- Выбор активного билда при смене аккаунта берётся из его хранилища и не наследуется из другой вкладки или прежнего профиля.
- Старые ключи и миграции не удаляются; обычная работа в одной вкладке не меняется.
- Новые тесты моделируют параллельное владение Alice/Bob и восстановление сохранений без утечки между профилями.


## 0.450.0 — 2026.11.07.450 · Надёжное сохранение и удаление билдов при нехватке памяти браузера

- Сверка с облачной библиотекой больше не считает восстановленные копии сохранёнными, если браузер не смог записать объединённый список; исходная библиотека остаётся доступной, а облачные загрузки не отправляются повторно.
- Удаление билда сначала подтверждает запись в локальное хранилище и лишь затем изменяет выбор и отзывает удаляемую запись в D1. При ошибке удаление отменяется.
- При ошибке записи резервной копии браузер восстанавливает исходное значение основного сохранения — предотвращается частично сохранённая операция.
- Все ошибки понятны на RU/EN; общее уведомление об ошибке больше не называется «Ссылка недоступна», если проблема не связана со ссылками.
- Добавлены регрессионные тесты переполнения локального хранилища, отката резервной копии и предотвращения ошибочного удаления.


## 0.449.0 — 2026.11.07.449 · Понятные связи и названия при просмотре изменений Энциклопедии

- В админском предварительном просмотре изменений локаций ссылки на NPC, предметы добычи, дополнительные разделы и патрули отображаются понятными названиями вместо сырых числовых и структурных ID.
- Сопротивления монстров показывают игровые названия стихий; требования умений используют названия веток из игрового каталога.
- Для созданных вручную NPC и локаций используется тот же каталог, что и в обычной Энциклопедии.
- Добавлены тесты RU-подписей отношений между записями, названий локаций, стихий и пользовательских секций. D1 и игровые формулы не изменялись.


## 0.448.0 — 2026.11.07.448 · Защита сеансов двух аккаунтов в разных вкладках

- Выход из старой вкладки одного аккаунта удаляет общую сохранённую сессию только если её токен совпадает с токеном текущей вкладки. Действующая сессия другого аккаунта не уничтожается.
- Если две вкладки используют один и тот же сеанс, выход в одной закрывает второй локальный сеанс через стандартное событие storage и обновляет библиотеку владельца.
- Разные аккаунты в двух вкладках по-прежнему могут продолжать независимую работу, не смешивая билды.
- Дополнен Chromium-тест разделения профилей и добавлена проверка правил удаления сессии.
- Не потребовалось изменение Worker, токенов или production D1.


## 0.447.0 — 2026.11.07.447 · Повреждённые облачные сохранения защищены от перезаписи через D1

- `POST /api/library` больше не пытается выполнить `json_extract` на повреждённом старом JSON из D1, что раньше могло давать HTTP 500. Проверка `CASE WHEN json_valid(...)` исполняется атомарно внутри SQLite UPSERT.
- Даже при корректном JSON запись с чужим ID или некорректными данными героя остаётся нетронутой и недоступной, как при чтении библиотеки. Ответ HTTP 409 объясняет, что для сохранения нужна отдельная копия.
- Пользовательский статус сохранения отображается в RU и EN, без технических ID и утечки содержимого повреждённых записей.
- Добавлены тесты повреждённого JSON, подменённого ID и неверной профессии; старые тесты блокировки гонок и удалений остаются в наборе.


## 0.446.0 — 2026.11.07.446 · Уведомления об обновлениях учитывают новые релизы и порядок ответов сети

- Если пользователь оставил баннер предыдущего выпуска открытым, а сайт уже обнаружил следующий, кнопка «Позже» теперь откладывает именно последний предложенный выпуск, а не устаревшую версию замыкания обработчика.
- Параллельные проверки `site-version.json` больше не могут понизить рекомендуемую версию из-за более позднего ответа с устаревшего кэша CDN.
- Исправления сохраняют RU/EN-подсказки, ручное подтверждение обновления, сохранение текущего героя и ограничение автоматического обновления на занятых страницах.
- Добавлены тесты последовательных публикаций и ответов сетевых запросов в обратном порядке.


## 0.445.0 — 2026.11.07.445 · Форма аккаунта сохраняет ввод и подсказки при переключении языка; одинаковая проверка пароля для Enter и клика

- При переключении RU/EN в шапке форма аккаунта сохраняет набранные логин, пароль, подтверждение и прежнее состояние раскрытого редактора пароля. Секреты не помещаются в localStorage или другие постоянные хранилища.
- Сообщение о несовпадающих паролях не пропадает при переключении языка и отображается на языке текущего интерфейса.
- Прямое нажатие на «Изменить пароль» теперь проходит проверку обязательных полей и минимальной длины через `form.reportValidity()`, так же как отправка клавишей Enter. Несовпадающее подтверждение проверяется до запроса на сервер.
- Chromium-проверка использует однозначную кнопку действия вместо потенциально совпадающей подписи раскрывающего элемента; добавлен полноценный прогон переключения RU→EN→RU с открытым редактором.


## 0.444.0 — 2026.11.07.444 · Сбой отложенного удаления больше не блокирует загрузку облачной библиотеки

- Ошибка одной повторной попытки отзыва удалённого билда теперь не блокирует GET остальных облачных сохранений.
- Неуспешное удаление остаётся в локальной очереди для повторной синхронизации; ожидающие удаления записи никогда не возвращаются в видимый список из-за свежего GET.
- Индикатор RU/EN явно говорит, что библиотека загружена, но отзыв отдельных публичных ссылок ещё не подтверждён.
- Регрессионные тесты проверяют частичную недоступность, успешные соседние удаления, скрытие ожидающих удаление записей и последующее завершение очереди.


## 0.443.0 — 2026.11.07.443 · Админский индикатор сохраняет ошибки при параллельной записи разных полей

- Индикатор админского автосохранения теперь учитывает несколько одновременно идущих запросов к разным полям, вместо последнего завершившегося запроса.
- Успех одной записи больше не скрывает ошибку HTTP 409/428 другого поля. Пока хотя бы одно поле сохраняется, статус остаётся «Сохраняю»; после завершения показывается ошибка, если какое-либо поле не было записано.
- Новая самостоятельная попытка после завершения предыдущих операций сбрасывает устаревшее сообщение об ошибке и при успешном ответе снова показывает «Сохранено».
- Добавлены тесты обоих порядков завершения конкурентных правок и последующего успешного сохранения.


## 0.442.0 — 2026.11.07.442 · Ограниченное потоковое чтение данных текущей игры

- Авторизованный запрос и read-only-диагностика игрового источника больше не делают `response.text()` на неограниченном внешнем ответе: поток UTF-8 останавливается и отменяется при превышении 3 750 000 байт или прежнего лимита 1 250 000 символов.
- Некорректная кодировка, недостоверная заявленная длина и превышение размера обрабатываются без раскрытия административных данных, с безопасной попыткой второго разрешённого хоста.
- Добавлены регрессионные тесты отмены потока на превышении размера и отказоустойчивого переключения между хостами.
- Production D1 и игровые формулы не изменялись.


## 0.441.0 — 2026.11.07.441 · Атомарная смена пароля и отзыв остальных сеансов в Cloudflare D1

- Обновление хеша пароля и завершение всех прочих сеансов аккаунта теперь выполняются в одной D1-транзакционной группе, как уже было устроено восстановление доступа.
- Если отзыв прочих сеансов отклонён базой, обновление пароля не фиксируется отдельно от него; сообщение об успешной смене не возвращается до окончания обоих действий.
- Добавлен тест с имитацией сбоя транзакции; существующий пользовательский тест проверяет успешную смену, завершение старых сеансов и восстановление доступа.
- Пароли и действующие пользовательские данные production D1 не читались и не изменялись при разработке и CI.


## 0.440.0 — 2026.11.07.440 · Восстановление нескольких локальных редакций билда с одинаковым идентификатором

- Если старые локальные данные содержат несколько различающихся билдов с одним ID, библиотека выбирает более свежий снимок для исходного ID, а остальные различающиеся редакции сохраняет в отдельные локальные копии.
- Одинаковые по содержимому дубли не создают лишние копии, совпадающая с D1 редакция не дублируется, явно поставленное удаление не восстанавливается.
- Все восстановленные конфликтные копии остаются только в браузере до явного сохранения пользователем; никакие новые ID автоматически не публикуются в D1.
- Добавлены регрессионные тесты облачной и локальной сверки, повторных обновлений и старых дублированных данных.


## 0.439.0 — 2026.11.07.439 · Обновления сайта: корректные EN-подсказки и отложенное уведомление только для текущей версии

- Баннер новой версии следует текущему языку RU/EN при первом показе и при переключении языка в открытом интерфейсе.
- «Позже» откладывает только конкретный номер версии, а не скрывает навсегда уведомления о последующих релизах. Автообновление не применяет отложенный релиз без согласия пользователя.
- Добавлены проверки последовательных релизов, смены языка и сохранения черновика перед обновлением.
- Production D1 и игровые формулы не изменялись.


## 0.438.0 — 2026.11.07.438 · Безопасное ограничение JSON-запросов входа и восстановления аккаунта

- Автоматическая публикация Worker теперь срабатывает при изменении любого исполняемого `worker/*.js`, включая модуль аккаунтов, без автоматического применения миграций D1.
- API пользовательских аккаунтов, включая вход, регистрацию и восстановление, теперь применяет фактический ограничитель 16 КиБ на поток UTF-8 с сохранением старого предела 4096 символов JSON.
- Невалидный UTF-8, повреждённый JSON и неверные заголовки Content-Length отклоняются до выполнения операций с учётной записью; большие запросы получают HTTP 413.
- Добавлены регрессионные тесты без заголовка длины, ложно заниженной длины, кириллицы и некорректных данных.
- Production D1 и реальные пользовательские пароли не затронуты; браузерная приёмка и деплой проверяются отдельно.


## 0.437.0 — 2026.11.07.437 · Понятное восстановление повреждённых публичных ссылок на билды

- Публичный endpoint короткой ссылки проверяет JSON и структуру build после подтверждения существования исходного сохранения. Повреждённая запись получает HTTP 410 с понятным ответом без раскрытия повреждённого содержимого.
- В RU/EN интерфейсе добавлено сообщение с просьбой создать новую ссылку. Корректные соседние ссылки и причины `deleted`/`legacy` остаются без изменения.
- Добавлены регрессионные тесты сломанного JSON, неподдерживаемой схемы и недопустимого уровня.
- Production D1 и игровые формулы не изменялись; публикация и Chromium отдельно проверяются.


## 0.436.0 — 2026.11.07.436 · Обязательная проверка предыдущей версии при админском сохранении и отмене

- Admin Worker больше не принимает безусловные сохранение или сброс из старого закешированного редактора: если отсутствует `expectedValue`, возвращается HTTP 428 с просьбой обновить страницу.
- Современные клиенты по-прежнему атомарно сравнивают старую и текущую D1 запись; конфликт возвращает HTTP 409 и сохраняет пользовательский ввод.
- Добавлены серверные регрессионные тесты запрета legacy overwrite/reset и клиентская проверка RU/EN сообщения.
- Production D1 тестовыми записями не изменялась. Browser acceptance and deployed Worker state must be verified separately.


## 0.435.0 — 2026.11.07.435 · Изоляция повреждённых облачных билдов без потери других сохранений

- Повреждённая запись private_builds больше не вызывает HTTP 500 для всей облачной библиотеки: недоступная запись отдельно отмечена, соседние корректные билды по-прежнему загружаются.
- При конфликте такой записи с локальным билдом исходный облачный ID резервируется, а локальная версия переносится в отдельную браузерную копию без автоматической записи в D1.
- Интерфейс сообщает о недоступных облачных записях, не раскрывая содержимое повреждённого JSON; добавлены серверные и клиентские регрессионные тесты.
- Игровые расчёты и production D1 не изменялись. Browser acceptance and deployed Pages state must be verified separately.


## 0.434.0 — 2026.11.07.434 · Автоматическое завершение истекших сессий аккаунта в открытой вкладке

- Аккаунт, открытый в течение длительного времени, больше не остаётся видимым как активный после окончания срока действия серверной сессии.
- Токены, имя владельца и состояние входа проверяют срок действия перед использованием; переход в гостевую библиотеку выполняется один раз.
- Сетевые сбои до истечения срока по-прежнему не приводят к ложному выходу.
- Добавлены тесты времени, восстановления владельца и повторных перерисовок профиля.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.433.0 — 2026.11.07.433 · Двуязычные статусы облачной библиотеки и названия копий конфликтующих билдов

- При переключении RU/EN статусы сохранения, восстановления, конфликтов и удаления билдов переводятся через общий словарь, включая сообщение при возвращении на вкладку «Мои билды».
- В английском интерфейсе автоматически созданные локальные копии конфликтующих и удалённых билдов получают английские подписи, сохраняя пользовательское имя и отдельный ID.
- Уведомления об успешной операции и ошибках переводятся без изменения исходных данных.
- Добавлены тесты RU/EN, восстановления удалённых билдов и повторного отображения статуса.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.432.0 — 2026.11.07.432 · Ограничение JSON-запросов Worker по фактическим байтам без зависимости от Content-Length

- JSON-маршруты Worker теперь читаются с фактическим ограничением байтов, даже если Content-Length отсутствует или недостоверен.
- Импорт каталога сохраняет прежний предел 65 000 символов и получает дополнительный предел 256 КиБ по UTF-8; лимит больших CAS-правок остаётся 384 КиБ.
- Новые регрессионные тесты проверяют недостоверные заголовки, UTF-8, повреждённый JSON и совместимость небольших запросов.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.431.0 — 2026.11.07.431 · Полностью двуязычный перенос гостевой облачной библиотеки

- Перенос и восстановление гостевой облачной библиотеки на английской версии сайта теперь показывает английские названия кнопок, полей, пояснения к секретному коду, предупреждение о необходимости его сохранения и статус копирования.
- Сообщения валидации 64-символьного кода, запрета переключения при входе в аккаунт, незавершённых удалений, пустой удалённой библиотеки, смены владельца и успешного подключения локализованы по выбранному RU/EN интерфейсу.
- Секрет гостевой библиотеки по-прежнему не виден в DOM до отдельного действия пользователя; передача на другое устройство остаётся доступной только гостям, без автоматического переноса пароля/ключа.
- Добавлены Node-проверки реального компонента для двух языков, кнопки раскрытия и копирования, сообщений об ошибках и сохранности существующих проверок владельца.
- Данные D1, игровые формулы, записи о билдах и Cloudflare Worker не изменены.


## 0.430.0 — 2026.11.07.430 · Восстановление сохранённых билдов при повреждении локального черновика

- Локальный черновик персонажа и список сохранённых билдов теперь читаются независимо: повреждённый черновик больше не блокирует загрузку корректной библиотеки.
- При открытии сохранённого билда сначала безопасно проверяется и клонируется снимок, а только затем переключается активный герой. Если снимок повреждён или его невозможно клонировать, пользователь видит сообщение и остаётся на прежнем персонаже без ошибочной записи в активный билд.
- Восстановление старых снимков дополняет отсутствующие вложенные словари, включая мастерство и бонусы ОЗ/ОМ, значениями по умолчанию, не изменяя исходное сохранение.
- Нечитаемые элементы списка (null, строки, массивы) не передаются в UI; исходный localStorage не перезаписывается при чтении и доступен для восстановления.
- Node-регрессии покрывают смешанную библиотеку, пустые данные, ошибку клонирования, старые форматы и сохранность исходного героя.
- Cloudflare Worker, production D1 и игровые формулы не изменены.


## 0.429.0 — 2026.11.07.429 · Безопасное сохранение и отмена крупных D1-правок

- Исправлен отказ сохранения крупных сундуков и списков добычи после включения атомарной проверки D1: запрос теперь содержит два JSON-значения (`value` и `expectedValue`) и может превышать старый лимит 32 КиБ при допустимой длине отдельной записи.
- Исправлена отмена (Undo/Reset) крупных записей: ранее общий ограничитель тела 8 КиБ отклонял `expectedValue` даже при допустимом JSON содержимом сундука.
- Для двух административных маршрутов используется отдельный ограниченный потоковый JSON-парсер с фактическим подсчётом UTF-8 байтов и защитой даже при отсутствующем или ложном заголовке Content-Length; лимит запроса 384 КиБ, проверки размера каждой отдельной записи сохраняются.
- Новые Worker-регрессии охватывают запись/отмену крупных списков, слишком длинный запрос с/без Content-Length, некорректный JSON и совместимость старых маленьких записей.
- D1-схема, игровые данные и формулы, сохранённые билды не менялись. Production D1 не использовалась для тестовой записи.


## 0.428.0 — 2026.11.07.428 · Английские названия предметов и душ в сравнении билдов

- Сравнение сохранённых билдов теперь использует подтверждённые английские имена предметов и душ из `nameEn` или уже загруженного словаря `officialEnglish.items/souls` вместо русского игрового названия при выбранном EN.
- Та же локализация применяется и к краткому сравнению сохранённых данных, и к подробной таблице характеристик A/B; русские названия из исходного игрового каталога не изменяются.
- При отсутствии реального английского названия новые переводы не выдумываются. Отсутствующие в каталоге предметы сохраняют безопасные подписи без внутренних ID из 0.427.0.
- Новые тесты проверяют приоритет подтверждённого владельцем перевода, оригинальные английские словари, RU/EN имена в двух сравниваемых билдах и неизменность их исходных данных.
- Worker, production D1, игровые формулы, исходные предметы и сохранённые пользовательские билды не изменены.


## 0.427.0 — 2026.11.07.427 · Понятные RU/EN подписи и точное сравнение сохранённых билдов

- В сравнении сохранённых билдов неизвестные предметы и души больше не показывают внутренние игровые ID. При этом два разных ID корректно считаются разными даже при одинаковом пользовательском названии или отсутствии названия, в том числе в режиме «Только отличия».
- Для расовой пассивки сравнение использует оригинальное русское название из каталога и проверенное английское название из `officialEnglish.skills`, а неизвестные пассивки показываются понятной подписью без числовых идентификаторов.
- Устаревшие внутренние поля усиления остаются совместимыми со старыми сохранениями, но больше не выводят исключённый игровой термин в русской и английской версиях сравнения.
- Добавлены тесты на разные неизвестные предметы, одноимённые записи, языки, расовые пассивки, исходные данные и совместимость старых билдов.
- Не изменены игровая математика, Cloudflare Worker, production D1 и содержимое пользовательских билдов.


## 0.426.0 — 2026.11.07.426 · Защищённое сохранение админских правок между окнами и устройствами

- Подключён атомарный протокол `expectedValue` из Worker 0.425.0 ко всем административным операциям изменения и удаления `/api/admin/override` и `/api/admin/reset`, включая поля предметов, NPC, монстров, сундуков, списки и «Отменить».
- При изменении той же записи в другом браузере Worker отклоняет устаревший запрос (HTTP 409). Интерфейс показывает короткое русское/английское сообщение, не добавляет такую операцию в историю и оставляет локальный ввод без ложного статуса сохранения.
- Новые Node-тесты проверяют конкурентное создание, конфликт обновления и удаления, авторизацию, неприменение условия к другим API и общий защищённый путь всех редакторов.
- Сохранённые билды, исходные игровые формулы и записи production D1 релизом не менялись. Для старых закешированных страниц Worker временно принимает прежний запрос без условия; безопасный переход к обязательному протоколу требует отдельной совместимости.


## 0.425.0 — 2026.11.07.425 · Атомарная проверка конфликтов редактирования в Cloudflare D1

- Cloudflare Worker добавляет необязательное условие `expectedValue` для административного сохранения и удаления отдельной ручной правки: новая запись вставляется атомарно при отсутствии ключа; существующая обновляется/удаляется только если прежнее значение совпадает.
- При конфликте ответ HTTP 409 `OWNER_EDIT_CONFLICT`; запись не изменяется. Условия выполняются внутри одного SQL-запроса без небезопасного раздельного чтения и перезаписи.
- Старые клиенты без `expectedValue` временно сохраняют прежний протокол для совместимости. Полная защита межбраузерного редактирования требует подключения нового клиента; до этого прежний сайт продолжает работать.
- Добавлено машинно-читаемое свойство `ownerOverrideCAS:true` в диагностике Worker. Новые тесты охватывают гонки создания, обновления и удаления, отказ авторизации, некорректные условия и старый протокол.
- Не требуется миграция D1, не изменяются игровые формулы, списки предметов и билды. Production D1 нельзя использовать для тестовых записей без отдельной проверки и очистки.


## 0.424.0 — 2026.11.07.424 · Безопасная проверка сессии без сброса открытой формы аккаунта

- Если проверка сохранённой сессии /me завершается после открытия пользователем панели аккаунта, приложение больше не пересоздаёт уже заполненную форму смены пароля и не стирает её сообщение о несовпадении паролей.
- При ответах 401/403 старая сессия по-прежнему немедленно удаляется, а панель принудительно переключается в безопасный экран входа. При смене аккаунта во время проверки старый ответ не может переписать новый экран.
- Chromium-тест удерживает ответ /me, вводит несовпадающее подтверждение нового пароля, затем отпускает ответ и проверяет сохранность полей, ошибки и отсутствие сетевого запроса смены пароля.
- Изменены только Account UI и браузерный тест. Содержимое аккаунтов, Worker, D1, игровые формулы, предметы и билды не менялись.


## 0.423.0 — 2026.11.07.423 · Защита от устаревших списков добычи, сундуков, обменов и источников

- Добыча монстров, награды сундуков, рецепты NPC-обменов и дополнительные источники предметов больше не допускают незаметной перезаписи списка, который изменился до завершения предыдущего сохранения.
- Для каждого ключа `dropedit`, `chestedit`, `tradeedit`, `acquireedit` добавлена последовательная проверка исходного состояния; при устаревшей правке пользователь получает короткое сообщение об обновлении карточки.
- Несвязанные справочники продолжают сохраняться независимо. После ошибки записи следующая операция с тем же ключом не блокируется навсегда.
- Добавлены Node-регрессии на конфликтующие изменения каждого из четырёх типов списков, сбой D1, независимые изменения и некорректные записи.
- Изменяется только клиентский код; Cloudflare Worker, игровые данные, формулы и production D1 не изменяются. Браузерные CI/Pages проверяются отдельно.


## 0.422.0 — 2026.11.07.422 · Последовательные изменения мест появления монстров

- Исправлена потеря одного из мест появления монстра при двух быстрых добавлениях: каждый следующий `spawnedit.<monster>` строится после предыдущей записи и обновления индекса Энциклопедии.
- Замена устаревшего исходного места появления теперь отклоняется до D1-записи; остальные карты и подземелья сохраняются.
- Добавлены Node-регрессии на параллельные добавления, замену, ошибку D1, независимые записи разных монстров и запрет неавторизованной операции.
- Cloudflare Worker, реальные игровые данные, формулы и production D1 не изменены. Проверки CI и Pages отдельно.


## 0.421.0 — 2026.11.07.421 · Безопасное сохранение быстрых правок экипировки

- Устранена потеря изменения предмета, когда администратор быстро редактирует название, описание или другое поле экипировки: следующий `itemedit` собирается после завершения предыдущей записи и обновления каталога.
- Удаление собственного переопределения при возвращении к исходному значению сохраняет остальные изменения предмета и правильную историю отмены.
- Используется та же очередь ключей, что для обычных записей Энциклопедии; записи разных предметов не блокируют друг друга.
- Добавлены Node-регрессии на последовательность правок, сбои, отмену изменённого поля и неизменность игрового первоисточника.
- Игровые правила, исходные данные, Cloudflare Worker и production D1 не изменялись. Браузерные и релизные проверки выполняются отдельно.


## 0.420.0 — 2026.11.07.420 · Сохранение нескольких быстрых правок одной записи без потери данных

- Редактор Энциклопедии последовательно сохраняет несколько быстрых правок одной и той же записи в существующий D1 override: последующее изменение собирается поверх предыдущего уже подтверждённого значения, а не устаревшего снимка.
- Правки разных сопротивлений одного монстра теперь корректно объединяются, не возвращая ранее изменённые сопротивления к старым значениям.
- Блокировка отмены действует до завершения всей очереди записей; после ошибки отдельной записи очередь не перестаёт работать, история отмены сохраняет корректные промежуточные значения.
- Добавлены независимые Node-регрессии для быстрых правок, пользовательских NPC, частичных сбоев и параллельных независимых записей.
- Рабочие игровые данные, формулы, Worker, production D1 и сохранённые билды не менялись. Отдельно проверять успешность CI и опубликованного Pages.


## 0.419.0 — 2026.11.07.419 · Безопасная совместная правка игровых NPC и локаций

- Исправлено наложение двух независимых правок на `trades.npcs` и `trades.mapNames`: независимо от порядка редактирования теперь копируется именно изменяемый вложенный справочник.
- Стабильное создание отдельного каталога исключает изменение исходных игровых NPC и имён локаций при повторном построении Энциклопедии.
- Добавлены проверки с замороженными исходными данными, перестановкой порядка правок, независимыми повторными построениями и сочетанием обычных и городских записей.
- Серверный Worker, production D1, исходные игровые данные, формулы и сохранённые билды не менялись. Проверки CI/Pages отдельно.


## 0.418.0 — 2026.11.07.418 · Безопасные правки городских NPC, локаций и рецептов обмена

- Исправлено изменение исходных `townMaps` и `townNpcs` при наложении административных правок Энциклопедии: теперь создаются отдельные словари и исходный каталог остаётся неизменным.
- Новый NPC владельца должен иметь одну корректно выбранную локацию; случайный идентификатор NPC больше не может превращаться в вымышленную территорию.
- Повторные материалы с одинаковым ID в рецепте обмена отклоняются как в интерфейсе, так и в Cloudflare Worker.
- Изменение точек появления исходных монстров сохраняет строковые ID пользовательских монстров в картах и подземельях; добавлена регрессия против потери связей из-за преобразования в `NaN`.
- Добавлены Node-регрессии на неизменность снимка, независимость правок и обе серверные проверки. Записи production D1 не изменялись.
- Browser acceptance и развёрнутую версию Pages/Worker необходимо проверить отдельно.


## 0.417.0 — 2026.11.07.417 · Согласованное обновление экипировки и отмены

- Исправлены две ранее неотслеживаемые асинхронные операции: после `itemedit` и после отмены `undoOwnerEdit` дожидаемся завершения `refreshOwnerCatalog()`.
- Индикатор сохранения, доступность повторной отмены и обратные связи карточек не расходятся по времени.
- Добавлены независимые Node-тесты с искусственно задержанной реиндексацией; исходный D1 не меняется.
- Игровые формулы, серверный Worker, предметы и билды без изменений.


## 0.416.0 — 2026.11.07.416 · Замена места появления монстра без промежуточного удаления

- Для исходных игровых монстров разрешена замена известной локации через существующий ✎ в Энциклопедии. Целевой вариант выбирается из текущего каталога; исходный монстр, текущая локация и подземелья сохраняют свои идентификаторы.
- Вместо последовательных запросов «удалить старое место → добавить новое» формируется один валидированный `spawnedit.<monsterId>` override, который пересобирает весь набор прямых и обратных связей за одну публикацию.
- Устаревшая или отсутствующая исходная связь блокирует запись до обращения к D1. Для пользовательских и виртуальных локаций оставлена прежняя схема, требующая отдельного подтверждения безопасной замены между разными ключами.
- Новые Node-тесты проверяют единственность запроса, неизменность игровых исходников, сохранение других привязок и отказ при устаревшей связи. Нет изменений Worker, D1 схемы и игрового баланса.


## 0.415.0 — 2026.11.07.415 · Синхронное завершение обновления связей Энциклопедии

- После успешной записи мест появления монстров, выпадения предметов/сундуков, NPC-обменов и дополнительных источников предметов дождаться обновления Энциклопедии, а не возвращать управление до завершения рендера и пересборки обратных индексов.
- Индикатор сохранения остаётся активным, пока работа не завершена; ошибки обновления обрабатываются внутри исходного async-процесса, а не оставляют неподконтрольный Promise.
- Добавлены исполняемые Node-тесты четырёх сценариев с искусственно задержанным обновлением без реальной записи D1.
- Игровые данные, проверенные рецепты, вероятности, формулы, билды и Worker не изменяются. Реальная запись в production D1 требует отдельной авторизации.


## 0.414.0 — 2026.11.07.414 · Общий контроль расовых пассивок в билдах и Энциклопедии

- Сведена в одно место проверка полноты, связей и уникальности расовых пассивок: `PandoraWikiCatalog.validateRacialPassives`.
- В редакторе персонажа проверка выполняется после получения согласованного снимка D1 и **до** установки нового `catalogSource`. Нельзя принять неверную пассивку при расчёте билда, если Энциклопедия её обоснованно отклоняет.
- Тесты проверяют общую функцию на реальном локальном источнике, отсутствующей расе, чужом навыке и наличие вызовов в обоих загрузчиках.
- Не изменялись формулы, значения рас, навыки, сохранения билдов, изображения, Cloudflare Worker или схема D1.


## 0.413.0 — 2026.11.07.413 · Целостность каталога расовых пассивок

- Полнота опубликованного списка рас проверяется по `meta.counts.racialPassives`. Больше нельзя молча считать обрезанный реестр полноценным.
- Проверяются уникальность расовых `raceId` и ID пассивок в пределах каждой расы и между расами, согласованность ключей и принадлежность каждого исходного ID подтверждённому `PASSIVE` навыку ветки `race`.
- Дополнены тесты умышленно неполного реестра, совпадений и неверных ключей, а также точной структуры сохранённого OS снимка: шесть рас, 18 уникальных пассивок.
- Содержимое D1, формулы, локализации, изображения, билды и Worker не меняются. Строгий режим Энциклопедии сохраняет отказ от подмены некорректной D1 версии локальным архивом.


## 0.412.0 — 2026.11.07.412 · Поиск Энциклопедии использует готовый кэш переводов

- Исправлена найденная причина повторной обработки локализованных имен при каждой поисковой строке: вместо нового callback на каждом `wikiIndex.search` переиспользуется стабильная функция поиска на одном снимке.
- При смене языка RU/EN, актуального игрового индекса или источника английских переводов кэш и функция поиска заменяются согласованно; устаревшие подписи не должны сохраняться.
- Node тестирует идентичность callback и обновление словаря; Chromium — последовательные запросы в EN и исходные русские названия. Игровые данные, формулы, сохранённые билды и Cloudflare Worker не изменяются.


## 0.411.0 — 2026.11.07.411 · Группировка расовых пассивок по расам

- Фильтр «Расовая пассивка» теперь группирует 18 навыков по шести расам с уже существующими стилями заголовков Энциклопедии. В подробной карточке добавлена строка «Раса / Race» в стандартном блоке характеристик.
- Источник названия и принадлежности — уже загруженный `racialPassives`, а не догадка по имени навыка. RU/EN, прямые ссылки, поиск и компактный мобильный режим проверяются Chromium.
- Новых внешних зависимостей, полей D1, Worker изменений, дополнительных игровых картинок, формул и модификаций билдов нет.

## 0.410.0 — 2026.11.07.410 · Расовая пассивка, Дубли навыков, Особое

- В Энциклопедии отдельный фильтр «Расовая пассивка» показывает 18 подтверждённых врождённых умений из `racialPassives` того же D1-снимка, что и каталог навыков; «Сон», «Оглушение» и другие технические записи ветки race остаются отдельно.
- «Варианты навыков» → «Дубли навыков» (Duplicate skills), «Особые умения» → «Особое» (Special). Внутренние идентификаторы, ссылки, варианты и история сохранены.
- Добавлена атомарная загрузка расового реестра, обновлены все три валидатора редактирования RU/EN и тесты Node/Chromium. Старые стандартные подписи, сохранённые владельцем, обновляются для отображения, собственные названия не перезаписываются.
- Игровые формулы, сохранённые билды и данные D1 не переписывались. Развёртывание Worker и GitHub Pages проверяется отдельно.

## 0.409.0 — 2026.11.07.409 · Компактный фильтр навыков как в других главах Энциклопедии

- Убран отдельный растягивающий стиль `flex: 1 1 auto` у выбора категории навыков. Переиспользуется стандартная `.wiki-effect-toolbar`: нативный `select`, штатная рамка, отступы, стрелка и компактная ширина — точно такой же принцип, как в «Предметах эффектов».
- Владелец по-прежнему видит рядом одну ✎ для редактирования семи RU/EN названий; узкий экран корректно переносит элементы без горизонтального переполнения.
- Дополнены Node- и Chromium-регрессии: сравнение вычисленных стилей с фильтром предметов эффектов, ширина десктопного списка, отсутствие наложения ✎ и проверка мобильного режима. Категории, количества, база D1, игровые формулы и билды не меняются.
- Факт прохождения CI и публикации Pages проверяется отдельно; правка Worker не требуется.

## 0.408.0 — 2026.11.07.408 · Исправление отмены подписей энциклопедии и защита очереди автосохранений

- Устранена асимметрия Cloudflare Worker: `guideedit.wiki.labels` разрешался для сохранения, но не для удаления в `/api/admin/reset`. Теперь первая правка заголовка или фильтра может быть полностью отменена, включая удаление единственной созданной записи D1.
- Защита редактора распространяется на **ожидающие в очереди** сохранения подписей, а не только на текущий HTTP-запрос. Пока очередь не пуста, Undo, «Завершить», EN-синхронизация, экспорт PR и проверка временной D1-записи не стартуют поверх неполного состояния.
- Добавлены регрессии настоящего Worker (создание/чтение/сброс, проверка запрета посторонних ключей) и Chromium на две правки с последовательной отменой до пустого исходного состояния. Иконки, игровые данные, формулы и билды не менялись.
- Публикация Worker и GitHub Pages проверяются раздельно.


## 0.407.0 — 2026.11.07.407 · Понятные фильтры и согласованные EN-переводы существующих правок

- Фильтры в Энциклопедии → Навыки: «Прочие записи» → «Другие навыки» (Other skills). Сохранённое владельцем «Неуточнённые» в английской версии теперь отображается как Unresolved; в коде это также нейтральное значение по умолчанию.
- Редактор фильтров пересобран на уже одобренных компонентах категорий Энциклопедии: стандартный select + небольшой ✎ и встроенные строки категорий, без отдельного всплывающего меню. Сохраняются RU/EN и текущий выбранный фильтр.
- Обнаружены реальные RU-only правки в публичном списке Cloudflare D1. Для 24 полей в 19 объектах подготовлены точные EN-эквиваленты (экипировка, происхождение, честь, ранги, метки энциклопедии). Они отображаются при отсутствии явного EN без записи в D1; владельцу доступен предварительный просмотр «EN-переводы» и ручное подтверждение постоянного сохранения. Произвольные новые строки не переводятся автоматически и имеющиеся EN правки не перезаписываются.
- Просмотрены присланные отчёты клиента и четыре региональные иконки: у навыков 900050003 и 900060003 RU/EN рисунки различаются и переставлены. Для RU отображение корректно **меняет местами два уже существующих локальных изображения**, EN сохраняет текущие; собственные иконки администратора не тронуты. Новые бинарные игровые ресурсы не публиковались. Воспроизвести извлечение из RAR среда не позволила.
- Не менялись игровая механика, D1-схема, сохранённые билды, ID навыков, связи и архивные изображения.

## 0.406.0 — 2026.11.07.406 · Нейтральные и редактируемые названия фильтров навыков RU/EN

- В Энциклопедии → Навыки фильтр «С иконкой „?“» переименован в нейтральное «На проверке» (EN: Under review). Это только отображение навыков без подтверждённого графического соответствия, не заявление об их активности.
- При включённом редакторе теперь можно редактировать **все семь** подписей выпадающих фильтров на месте через компактную ✎, с отдельными RU/EN названиями. Выбор фильтра не сбрасывается, инлайн-сохранение работает по Enter/уходу с поля.
- Разрешённые ключи текстов синхронизированы в PandoraWikiLabels, PandoraHonorGuide и Worker без миграции D1; обновлены лимит структуры и проверки ошибок ввода. Добавлены Node-тесты и отдельный браузерный сценарий с подставным ответом D1, без реальных записей в production.
- Игровые формулы, исходные изображения, содержимое игровых каталогов и билды не менялись.


## 0.405.0 — 2026.11.07.405 · Надёжный фильтр с вопросиком при недоступных игровых изображениях

- Фильтр «С иконкой „?“» теперь всегда соответствует реальным значкам в списке даже при ошибке загрузки `assets/os-icon-manifest.json`: раньше в таком режиме он ошибочно показывал 0 навыков. После успешной загрузки манифеста количество автоматически актуализируется.
- Новые записи D1 без `iconId` больше не исключаются из фильтра из-за совпадения имени с известным навыком, если сам рендерер показывает для них «?».
- Добавлены Node-регрессии и отдельный Chromium smoke с блокировкой запроса локального манифеста. Игровые данные, оригинальные изображения, формулы и D1 не изменены.
- CI и Pages проверяются отдельно.


## 0.404.0 — 2026.11.07.404 · Понятный фильтр с вопросиком и точные ссылки на версии навыков

- В Энциклопедии → Навыки фильтр «Без изображения» переименован в понятное «С иконкой „?“» (EN: `With “?” icon`): это именно навыки с игровым вопросительным знаком, а не утверждение, что навыки не используются.
- Все ссылки на конкретные варианты навыков и их требования теперь сохраняют исходный идентификатор навыка; общие одинаковые названия больше не меняют карточку назначения. Канонизация предметов, монстров и других разделов сохранена.
- Добавлены отдельные Node-тесты реальных ссылок и Chromium-проверка названий RU/EN. Исследовательский ZIP не публиковался и не запускался.
- Формулы, Cloudflare D1, игровой каталог, изображения и сохранённые билды не менялись.
- CI и публикация проверяются отдельно.


## 0.403.0 — 2026.11.07.403 · Точные ссылки на варианты навыков, исправленная классификация и стабильные иконки

- Исправлена классификация: дополнительные «Помощь ветра» и «Храм» с пустым списком разрешённых профессий — в «Вариантах навыков», не в основных умениях. Технические статусные эффекты («Сон», «Оглушение» и др.) больше не выдаются за особые умения персонажа.
- По прямой ссылке и после F5 открывается выбранная исходная версия навыка, а не подменённая карточка основного умения. Фильтр навыков сохраняется в истории браузера и сеансе.
- Иконки конкретных навыков одинаково разрешаются из локального манифеста и в актуальном, и в явно выбранном архивном режиме. Обновлены Node и Chromium-регрессии, учтено обновление кэша результатов при смене модели фильтра.
- Дополнительно создан внутренний аудит совпадений имён изучаемых навыков: 19 неоднозначных групп и 41 запись, с пересечениями профессий. `npm run skills:duplicates` позволяет проверять их отдельно, не объявляя ни одну версию устаревшей без подтверждения в игре.
- Ни игровые формулы, ни Cloudflare D1, ни исходные изображения, ни пользовательские билды не изменены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.402.0 — 2026.11.07.402 · Разделение игровых навыков, гильдейских умений, дублей и записей без изображения

- В энциклопедии «Навыки» добавлен единый компактный фильтр: умения персонажа (по умолчанию), гильдия и осада, особые умения, варианты, прочие, без изображения и все.
- Основные изучаемые навыки отделены по подтверждённым признакам `learnable` и `classes`. Гильдейские ранги и осадные умения остаются самостоятельными игровыми записями, даже если переиспользуют иконку.
- Поиск по исходным записям и вариантам не затрагивает формулы, прямые связи и Cloudflare D1; добавлена отдельная модель категорий и регрессионные тесты.
- Категория «Без изображения» определяется по фактическому отсутствию локального оригинала, одобренной иконки или пользовательской замены, а не по игровому назначению навыка.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.401.0 — 2026.11.07.401 · Общие игровые иконки одноимённых навыков и рангов; прозрачный значок неизвестного навыка

- Для 130 пропущенных ID навыков переиспользуется оригинал с точно таким же названием; ещё для 71 ID — оригинал из согласованного семейства рангов I–VIII. Приоритет: админская иконка → оригинал по ID → утверждённая связь → точное совпадение имени в D1 → значок «?».
- По пользовательскому игровому изображению подготовлен прозрачный lossless WebP значка «?» размером 39×37. Никакие оригинальные PNG/WebP существующих навыков не перезаписаны.
- 264 отсутствующих исходных оригинала по-прежнему учитываются отдельно: картинки не выдаются за найденные в HED/DAT. Добавлены проверка происхождения, тесты, документация и автоматический пересчёт связей при обновлении каталога.
- Формулы, D1, сохранённые билды и Cloudflare Worker не изменены.
- Проверки Node/Chromium и публикация Pages проверяются отдельно.


## 0.400.0 — 2026.11.06.400 · Компактная совместимость вещей и аудит иконок

- Утверждённый дизайн №02: «Подходит» включено в обычные характеристики предмета рядом с «Тип», «Уровень», «Слоты» — одна аккуратная строка, значение справа, перенос при узкой панели, никаких плиток и отдельной рамки. Редактирование подписи RU/EN остаётся доступным владельцу.
- Убраны устаревшие стили бейджей совместимости.
- Составлен полный аудит 264 ранее недоступных оригинальных иконок: 4 предмета (без оружия/брони) и 260 ID навыков, включая названия, разделы и кандидатов с локальными одноимёнными картинками; отдельно указаны японские архивы и ограничения точности/прав на повторную публикацию.
- Не подменяли ни одной картинки сомнительным аналогом; игровые формулы, D1 и Worker не изменены.

## 0.399.0 — 2026.11.06.399 · Исправлена загрузка стилей редактора

- Исправлен пропущенный символ `>` в HTML после подключения кузнечных стилей. Из-за этой ошибки мини-карандаши, вкладки и другие элементы админского inline-редактора могли отображаться без отдельной таблицы стилей.
- Добавлена регрессия на синтаксис всех тегов `<link>` в `<head>` и проверка доступности CSS в Chromium.
- Игровые данные, математические формулы и база D1 не менялись.

## 0.398.0 — 2026.11.06.398 · Исправление позиции душ и проверки релиза

- Исправлена проверка старых вставленных душ: теперь учитывается не только общее число душ, но и реальный номер занятого слота. Например, душа в слоте 3 не остаётся в новой вещи с одним слотом; допустимые промежутки между занятыми слотами сохраняются.
- Проверка живого сайта и API запускается после успешного завершения GitHub Pages, а не одновременно с публикацией. Это устраняет ложные провалы readiness CI из-за длительной очереди Pages, но не маскирует настоящий сбой публикации.
- Добавлены отдельные регрессии для случаев с разреженным массивом слотов. Игровые формулы, каталог D1 и сервер Worker не изменены.

## 0.397.0 — 2026.11.06.397 · Подсказки, проверка душ и единый редактор подписей

- Наведение на красное «!» показывает только предупреждение; большое описание предмета больше не открывается одновременно и доступно при наведении на сам предмет.
- Состояние вставленных душ теперь связывается с ID надетого предмета. Старые локальные билды после загрузки каталога проверяются: души у несуществующего/неподходящего слота или у вещи без слотов сбрасываются, как и избыточные души.
- Совместимые расы и варианты персонажа в «Свойствах» оформлены ровными игровыми бейджами с отступами, а не слитным текстом.
- Добавлено единое сохранение RU/EN подписей через D1 при потере фокуса: названия шести вкладок Книги героя (мини-карандаш в кнопке), подписи в свойствах предмета, выбор типа/стихии, вкладки и подписи панели душ, названия душ, заголовки направлений и основные подписи Пути героя.
- Неизвестные/ранее подтверждённые как 404 оригинальные изображения больше не запрашиваются напрямую с OS: выводится нейтральная заглушка; известные локальные иконки остаются оригинальными. Четыре оригинала предметов в текущем сохранённом каталоге по-прежнему отсутствуют на сервере-источнике.
- Добавлены проверки поведения предупреждений, старых слотов душ, официальных иконок и корректности ключей D1.

## 0.396.0 — 2026.11.06.396 · Кузница, привязка душ к вещам и понятные предупреждения

- В свойствах предмета заголовок «Заточка: +0…+10» размещён в рамке с легендой, как «Тип» и «Стихия». Лишний заголовок «Тип и стихия» больше не дублирует подписи.
- Внутри прокручиваемой панели свойств добавлено свободное место справа: интерфейс не прижимается к полосе прокрутки.
- При снятии либо замене предмета (оружия, брони, пояса и др.) прежние вставленные души очищаются для изменившихся физических слотов; повторный выбор точно того же предмета души сохраняет. Учтён перенос двуслотовой одежды.
- Заточка двуслотового платья теперь подписана только на основной иконке брони; на проекции штанов +N не повторяется.
- Красный значок «!» теперь показывает по наведению конкретную причину невозможности использовать предмет либо число лишних душ в слотах, во всплывающей подсказке вне обрезаемых границ иконки.
- Добавлены Node и браузерные регрессии. Изменений D1, Worker и игровых формул нет.

## 0.395.0 — 2026.11.06.395 · Утверждённая единая кузнечная планка

- В свойствах снаряжения заточка +0…+10 собрана в **одну цельную панель из 11 смежных сегментов** по утверждённой концепции №2. У неё общие границы, скругление только на концах, компактная активная подсветка и размер надписи, подстраивающийся под ширину.
- Выбор «Физический / Магический» оформлен как компактный объединённый переключатель шириной не больше 230 px; не растягивается на весь блок.
- Стихии реализованы по старому варианту №5: 4 одинаковые ячейки в верхнем ряду, «Свет» и «Тьма» занимают по одной, а «Радуга» растягивается на последние две ячейки второго ряда; пустых клеток нет.
- Все стили нового набора контролов изолированы в `pandora-studio-forge-controls.css`, подключённом после темы. Обновлены Node-тесты и геометрические Chromium-проверки ширин.
- Вкладка «Души», формулы, характеристики, D1, сохранения и функции редактора остались неизменными.

## 0.394.0 — 2026.11.06.394 · Компактные слоты душ без изменения поведения

- В «Образ героя → Души» ячейки слотов уменьшены до примерно 60×54 px (вместо 108×78), отступы и изображение уменьшены пропорционально.
- Сохранены надписи «Слот 1», «Слот 2» и т. д., подсветка выбранного слота, стили hover/focus и работа с существующими душами.
- Добавлена Chromium-проверка реальных габаритов слотов и текущей нумерации.
- Кнопки заточки, тип и стихии не менялись: 10 отдельных дизайн-концепций рассматриваются в изолированной HTML-демонстрации до выбора пользователем.
- Игровые данные, формулы, Worker и D1 без изменений.

## 0.393.0 — 2026.11.06.393 · Исправленные слоты душ и адаптивная заточка

- Надписи в шапках направлений: «освоено N · изучено N · вложено N» (RU), «trained N · learned N · invested N» (EN).
- Новый билд начинает с включённой настройкой автоматического зелёного мастерства; явно сохранённый ранее выключенный режим остаётся выключенным.
- В списке экипировки счётчик слотов душ виден только для оружия, щита, шлема, брони, перчаток, штанов, обуви и пояса. У плащей, колец, амулетов и серёг нет ложной подписи.
- Одинадцать кнопок заточки +0…+10 автоматически переносятся, сохраняя полностью видимую область на узком экране. Семь кнопок стихий заполняют 4+3 позиции без пустой четвёртой колонки.
- В предметных свойствах и редакторе: «Слоты», а не «Гнёзда»; в разделе «Души» — крупные интерактивные слоты с подписями «Слот 1» и т. п.
- Тексты заголовков заточки, стихий, типа самоцвета и слотов душ редактируются администратором по двойному клику. Переводы RU/EN сохраняются отдельно в существующем `guideedit.book.equipment.*`, без миграции D1.
- Изменения в исходных игровых данных, формулах и сохранённых билдах не производились.

## 0.392.0 — 2026.11.06.392 · Путь героя, свойства экипировки и чистый интерфейс

- В шапках направлений навыков всегда три независимых значения: «N освоено · N изучено · вложено N». «Освоено» = реальное зелёное мастерство; «изучено» = стартовые + вложенные очки веток; «вложено» = только вручную потраченные очки развития. Так при снятии автоматической зелени не исчезает показатель изученных очков.
- Все подсказки порогов навыков показывают «N оч. ветки» и «Начально (оч.): X · Вложено (оч.): Y», где Y — сколько очков нужно распределить сверх старта для достижения порога. Легенда «Лимит (оч.)» / «Начально (оч.)»; короткие обновлённые подсказки «Вложено» и «Мастерство», RU/EN.
- Вторая проекция одного платья на слот штанов приглушена и помечена замочком; это **не заблокированная кнопка** — выбор новых штанов по-прежнему снимает платье, не дублируя вещь в расчётах.
- Выбор экипировки показывает исходный уровень и количество гнёзд душ («Уровень 20 · Слоты: 3»), используя живой каталог и общую `socketCapacity` без выдуманных значений. Неизвестная ёмкость показывается как «—».
- В свойствах предмета все одиннадцать уровней заточки +0…+10 помещаются в одну строку (с прокруткой лишь на узкой ширине), стихийные варианты получают знакомые пиктограммы в компактной сетке 4+3, вкладки «Выбор / Свойства / Души» растягиваются ровно на доступную ширину.
- Шапка: «BUILD STUDIO / CHARACTER PLANNER». Нижний видимый статус загрузки иконок скрыт; отображается простая строка «Наша база данных состоит из: N навыков · N предметов · N душ» (цифры берутся из загруженного каталога). Архивный режим по-прежнему помечается отдельным предупреждением.
- Все поведенческие правки проходят отдельные Node и Chromium-регрессии. Изменения Cloudflare D1 не требуются.


## 0.391.0 — 2026.11.06.391 · Понятные пороги навыков и защита числовых полей

- Подсказки на засечках «Пути героя» показывают **общее требование ветки** и **сколько свободных очков нужно вложить** с учётом старта профессии. Пример: «Убийства» — старт 3, «Внезапный выстрел» требует 21 очко ветки, значит «Вложить: 18». Шкала остаётся единой 0–90; пороги и ползунок физически на одной координатной сетке, без искусственного сдвига.
- Все числовые редакторы **Пути героя**, **Происхождения** и **Книги героя** подключены к общему защитному механизму: `autocomplete="none"` (рекомендация Яндекса для его автозаполнения), запреты распространённых расширений менеджеров паролей, read-only до взаимодействия и повторная блокировка после потери фокуса. Стандартные пароли и вход намеренно не затронуты. Так как поведение автозаполнения определяется браузером, универсальная блокировка не гарантируется.
- Подсказки «Вложено» и «Мастерство» переписаны человеческим языком на русском и английском; без технических комментариев.
- Добавлены регрессии на реальное умение «Внезапный выстрел» с двумя требованиями (Стрельба 50, Убийства 21), координаты засечек, безопасные числовые поля и сохранение ручного редактирования.


## 0.390.0 — 2026.11.06.390 · Исправление механики веток и мастерства по живой игре

- Начальные значения профессии (например, Воин: 5 Секущий / 2 Колющий / 5 Рубящий / 2 Тяжёлый / 4 Оборона / 1 Стрельба) — уже прокачанные **очки ветки**, а не автоматически выученная зелень.
- При выключенном автозаполнении мастерство по умолчанию 0; вручную разрешено 0..(начальные + вложенные). Включённая галочка заполняет зелень ровно до текущей прокачки ветки; сохранённое ручное значение не теряется при переключениях.
- Предел профессии фиксированный и не растёт от вложений (например, 25 у начального Воина, 90 у позднего Джаггернаута); шкала и маркеры всегда в пределах 0..90.
- Первый навык открывается по вложенным очкам ветки, а не требует предварительно освоить зелень: иначе невозможно начать тренировать мастерство.
- Зависимые от зелени пассивные бонусы и эффекты берут именно освоенное мастерство. Показ предыдущего Legacy-константного +1 у «Вдохновения» остаётся до отдельной сверки в игре.
- К обоим компактным полям «Вложено» и «Мастерство» добавлены −/+ с шагом 1 и удержанием для повторения в стиле редактора характеристик.
- Старые явно введённые значения ручной зелени до версии 0.390 преобразуются в абсолютное мастерство один раз. Пустые значения не становятся выученной зеленью.
- Проверки охватывают 28 профессий, старт и ручную зелень, потолки, 90-делительную шкалу, пассивки и сценарии интерфейса. Исправления выбора предметов, душ и платьев из 0.389 сохранены.


## 0.389.0 — 2026.11.06.389 · Компоновка Происхождения и Пути героя, выбор экипировки, души и платья

- В «Происхождении» три шага выбора профессии получили единую выровненную сетку для номера и длинных подписей на RU/EN.
- Точные поля «Вложено» и «Мастерство» оформлены компактными двухколоночными карточками; смысл и расчёт сохранены.
- Зелёная полоса визуально разделена на стартовую базу D и дополнительно тренированное мастерство. Яркий сегмент отображает только дополнительную тренировку (например, 5 стартовых + 10 новых = отдельный сегмент длиной 10), не переписывая числовую формулу или бюджет очков.
- Во всех списках выбора экипировки на портрете используется одна существующая информативная подсказка, включая оружие, щит, шлем, броню, перчатки, штаны, обувь, плащ, кольца, амулет, пояс и серьги.
- При вставке души и выборе следующего гнезда сохраняются поисковая строка и положение прокрученного списка душ; новый запрос сбрасывает список к началу осознанно.
- Подтверждённые платья, занимающие броню и штаны, показываются в обоих слотах с ненавязчивой пометкой. Расчёт хранит одну вещь, не дублирует её эффекты и разрешает заменить платье выбором другой брони или штанов.
- Добавлены статические, модельные и Chromium-регрессии на классовые D/P, визуальную шкалу, одежду на два слота, всплывающие подсказки и прокрутку душ. Пассивки, не верифицированные в живой игре, не объявляются полностью подтверждёнными.
- D1-миграций нет; публикацию GitHub Pages и полноту текущего игрового сервера проверять отдельно.


## 0.388.0 — 2026.11.06.388 · Автозелень перестала выдавать потенциал за уже освоенное мастерство

- Исправлен ошибочный расчёт в «Пути героя»: автозаполнение зелени не поднимает освоенное до исходного потолка профессии (P). Для Воина 1 уровня при любой позиции галочки сохранены 5/25, 2/25, 5/25, 2/20, 4/25 и 1/5, а вложено 0.
- Автозаполнение поднимает лишь дополнительно освоенную зелень в пределах фактически вложенных очков ветки, сохраняя уже натренированное вручную. Потенциал P+вложения остаётся независимым пределом доступной ручной тренировки.
- Выключение автозаполнения больше не записывает временно рассчитанную зелень в сохранение как реально натренированную. Старые билды, действительные вложения и ручные достижения не перезаписываются.
- Добавлены регрессионные тесты 28 профессий, расчёта всех начальных веток, переключения галочки и F5 при включённом автозаполнении. Прежние unit-тесты ошибочно принимали автозаполнение до P за правильное поведение.
- GitHub Actions и публикация GitHub Pages проверяются отдельно; Cloudflare D1 не затрагивается.


## 0.387.0 — 2026.11.06.387 · Умения: стартовая зелень всех классов, потенциал веток и защита полей поиска от автозаполнения

- Очки характеристик и умений сверены с предоставленными скриншотами актуального игрового сервера для уровней 1–4 и официальным калькулятором на уровнях 2/45. Бюджет 45: 432/104; таблица `abilityPoint` не трактуется как свободные очки без подтверждения.
- Путь героя теперь показывает стартовое зелёное мастерство всех четырёх базовых профессий из D1-каталога `jobInit.<baseClass>.branches` и исходный потенциал `classes.<job>.branchCaps`. Пример Воина L1: Секущий 5/25, Колющий 2/25, Рубящий 5/25, Тяжёлый 2/20, Оборона 4/25, Стрельба 1/5; свободные очки 0.
- Разделены 4 части Remaked Skill: `D` начальная зелень, дополнительная зелень, `P` базовый потенциал и вложенные свободные очки. Потенциал = P + вложено; тренировка зелени не расходует свободные очки; стартовое значение нельзя снять. Для нового персонажа автоматическая тренировка выключена, а при включении заполняет текущий потенциал.
- Шкалы, подписи, доступность веток, условия открытия умений и итоговый расчёт используют единую модель. Исправлено ошибочное ограничение вложений исходным P: свободные очки расширяют P, согласно Remaked.
- Перепроверены производные бонусы зелени: `Вдохновение` для Священника/Клирика/Энчантера, `Орлиный глаз` линии Лучника; бонус от Тактики не распространяется на другие классы без игрового доказательства.
- Поиск навыков явно помечен как неавторизационное поле: autocomplete off, атрибуты популярных менеджеров паролей, readOnly при отсутствии пользовательского фокуса. Генератор остальных текстовых полей больше не считает упоминания слова «логин» признаком учётных данных.
- Новые Node/Chromium-регрессии для стартовых классов, 1–55 бюджета, P/D, навыков и безопасного поиска. Проверка с live server остаётся отдельной от CI.


## 0.386.0 — 2026.11.06.386 · Происхождение: визуальное RU/EN редактирование подписей, красное удержание − и сравнение таблиц очков

- Во вкладке «Происхождение» для RU/EN доступны редактирование заголовков, названий трёх вкладок, разделов, ступеней профессии и текста выбора расы. Двойной клик по отмеченной надписи открывает редактор прямо на странице, кнопка ✎ рядом с выбором расы не меняет расу.
- Изменения подписей сохраняются автоматически в существующие двуязычные D1 guide-overrides (book.origin.*) по подтверждённой авторизации: Enter/уход с поля; Escape отменяет, ошибка не скрывает введённый текст. Игровые имена, ID, расчёты и контроль выбора не меняются.
- Удержание «+» по-прежнему зелёное, удержание «−» красноватое в «Происхождении» и расширенных характеристиках Книги героя. Время и лимиты повторения не изменены.
- Сравнение всех 55 уровней Remaked и сохранённой таблицы OS вынесено в docs/SKILL_POINT_OS_VS_REMAKED_1_55.md. До подтверждения по живой игре бюджет остаётся по Remaked.
- Доработлены Node и Chromium-проверки RU/EN редактирования, клавиатуры и сохранившихся шаблонов; изменения production D1 выполняются только через собственное действие администратора.
- CI, публикация Pages и реальная запись в production D1 проверяются отдельно.


## 0.385.0 — 2026.11.06.385 · Происхождение: пустой выбор расы и профессии, очки Remaked 1–55, удержание характеристик

- Новый персонаж и «Новый билд» начинают с 1-го уровня без автоматически выбранных расы и профессии; для существующих сохранений выбранная раса и класс сохраняются.
- Выбор расы переименован в «Выбрать эту расу». Расовая пассивка привязана к выбранной расе и передаётся в Книгу героя по проверенному ID с повторным расчётом характеристик.
- Мастер профессий показывает выбранную специализацию зелёным стилем и ✓ даже на третьем этапе; согласованы состояния и RU/EN подписи.
- Очки характеристик и умений на уровнях 1–55 следуют Remaked js/bonus.js: к 55-му уровню 544 и 134; неверная таблица OS не подменяет бюджет очков умений.
- Кнопки ± характеристик используют общую обработку одиночного нажатия и удержания с автоостановкой при отпускании или лимите; повторно используется в Книге героя.
- Добавлены тесты 55 уровней, состояний, повторения кнопок и Chromium-сценарий; подробности в docs/ORIGIN_SELECTION_PROGRESSION_STANDARD.md.
- Прохождение CI, фактический деплой Pages и проверка поведения на реальной игре — отдельные контрольные этапы.


## 0.384.0 — 2026.11.06.384 · Унифицированный отложенный предпросмотр вещей и душ: 650 мс наведения, отмена и мгновенный фокус клавиатурой

- Вместо мгновенного предпросмотра на `mouseenter` богатые подсказки предметов и душ используют один таймер 650 мс после наведения курсора.
- Быстрый пролёт, переключение между предметами, навигация, уход курсора, клик и Escape отменяют отложенный/открытый предпросмотр; прокрутка закрывает открытую подсказку и перезапускает ожидание, только если курсор всё ещё над предметом.
- При клавиатурном фокусе `:focus-visible` подсказка появляется сразу, на сенсорном касании не перекрывает ссылку; RU/EN и игровые данные без изменений.
- Escape с открытым предпросмотром закрывает только подсказку, не закрывая всю энциклопедию; при отсутствии подсказки стандартная клавиша Escape продолжает работать.
- Добавлены Chromium- и Node-регрессии пути «Спата → Используется в обмене NPC → Прочная спата», добычи монстра, плащей Чести, быстрой смены карточек и отмены таймеров.
- Поведение закреплено в `docs/ITEM_TOOLTIP_INTERACTION_STANDARD.md`; D1, расчёты и внешние зависимости не изменяются.


## 0.383.0 — 2026.11.05.383 · Единый дизайн энциклопедии: компактные PvP-ссылки, награды Чести, общие карточки сущностей и аудит 10 разделов

- PvP-локации и PvP-войны в «Чести» представлены компактными кликабельными карточками на основе уже утверждённого компонента `.wiki-entity-flow`, как места появления монстров. Ссылки и история навигации сохранены.
- Ежемесячные награды выровнены по нациям и плащам; адаптивная раскладка 3/2/1 колонка. Существующие подсказки предметов и редактирование D1-текста сохранены.
- Усилено общее оформление заголовков, ссылок и клавиатурного фокуса во всех десяти главах энциклопедии без изменения игрового содержимого.
- Проведён UX-аудит каждой главы и зафиксированы правила переиспользования в docs/WIKI_VISUAL_AUDIT_2026-11-05.md; добавлены браузерные и статические регрессии.


## 0.382.0 — 2026.11.05.382 · Универсальная кнопка «← Назад» / «← Back» во всех карточках Энциклопедии

- Во всех карточках энциклопедии кнопка теперь подписана только «← Назад» (RU) / «← Back» (EN), без предположений о категории, откуда пришёл пользователь.
- Оформление, позиция, механизм истории и восстановление исходной прокрутки не менялись.
- Расширены браузерные регрессии: переходы Честь → PvP-локация / PvP-война / плащ, вложенный монстр, все типы страниц энциклопедии, доступность и локализация кнопки.
- Правило закреплено в docs/WIKI_BACK_NAVIGATION_GUIDELINE.md; изменения игровых данных и D1 отсутствуют.


## 0.381.0 — 2026.11.05.381 · Навигация Wiki: кнопка «Назад» возвращает на точное место исходной статьи и списка во всех разделах

- Все ссылки в энциклопедии запоминают исходную карточку, позицию статьи и левого списка, поиск и фильтр перед переходом.
- При «Назад» из PvP-войны, PvP-локации, плаща и вложенного монстра восстанавливаются предыдущая статья и точное место чтения — независимо от раздела.
- Убраны уникальные Honor-состояния и спецобработчик войн, общий механизм истории для всех карточек.
- Добавлены браузерные сценарии именно с нажатием видимой кнопки «Назад» и проверкой восстановления прокрутки; без миграций D1.


## 0.380.0 — 2026.11.05.380 · Единая кнопка «Назад» в энциклопедии по утверждённому образцу страниц PvP-войн

- Все карточки энциклопедии используют ту же кнопку возврата в левом верхнем углу, что страницы Лидии и Гихайма, с общим компонентом и CSS.
- Старые панели навигации, отличающиеся расположением кнопки, убраны; текст «Назад к …» локализован для RU/EN.
- При переходе внутри Wiki сохраняется история; при прямом входе безопасно открывается список раздела.
- Добавлены проверки одинакового оформления, возврата и клавиатурной доступности; документация UX размещена в docs/WIKI_BACK_NAVIGATION_GUIDELINE.md.
- Исправлена гонка загрузки каталога в «Чести»: ссылки на девять плащей и PvP-локации появляются сразу после загрузки данных, даже при быстром открытии вкладки.


## 0.379.0 — 2026.11.05.379 · Честь: подсветка ежемесячных рангов внизу страницы и страницы PvP-войн с возвратом назад

- При прокрутке «Чести» до нижней границы активируется последний раздел, даже если его заголовок не достиг верхней части окна.
- Существующие и будущие PvP-войны — гиперссылки на собственные страницы с постоянным адресом по ID, прямым открытием и возвратом к прежней позиции в «Чести».
- Переиспользуются текущие записи D1 и механизмы RU/EN, без создания фиктивных локаций и неподтверждённых расписаний.
- Добавлены регрессии просмотра и истории; фактический деплой проверяется отдельно.


## 0.378.0 — 2026.11.05.378 · Активная подсветка раздела Чести при прокрутке, компактные ранги и кликабельные PvP-локации

- При скролле в «Чести» автоматически обновляются активный пункт меню и aria-current (один observer, корректная очистка при смене главы).
- Сокращены карточки рангов, сохранены исходные пиксели иконок с тёплым цветовым фильтром; убрана особая подсветка Министра.
- PvP-локации теперь открываются кликом на название через общую Wiki-навигацию с возвратом назад.
- Проверки браузерной навигации и CI; опубликованное состояние GitHub Pages проверяется отдельно.


## 0.377.0 — 2026.11.05.377 · Точные оригинальные игровые эмблемы 12 рангов и закреплённое меню разделов Чести при прокрутке

- Все 12 игровых PNG из /img/rank/2/ встроены пиксель-в-пиксель в автономные локальные SVG, без произвольной геометрии.
- Меню из четырёх разделов «Чести» закрепляется внутри прокрутки энциклопедии на десктопе; на телефоне остаётся в потоке.
- Добавлены проверки точных ассетов, скролла и доступности; поведение в опубликованном GitHub Pages подтверждается отдельно.


## 0.376.0 — 2026.11.05.376 · Исправлены навигация по Чести, векторные эмблемы рангов, ссылки и подсказки девяти плащей, отображение переносов и стабильность редактора

- Исправлены навигация по Чести, векторные эмблемы рангов, ссылки и подсказки девяти плащей, отображение переносов и стабильность редактора
- Обновлены браузерные проверки переходов между разделами, наград и подсказок.
- Тесты CI и опубликованное состояние GitHub Pages проверяются отдельно.


## 0.375.0 — 2026.11.05.375 · Согласованные паттерны редактирования энциклопедии

- Режим редактора больше не сворачивается автоматически при переходе в энциклопедию и «Мои билды». Исправлено мигание свернутого переключателя: отдельный фиксированный компактный контейнер без вложенной fixed-кнопки и перехода прозрачности.
- Вкладки «Экипировка», «Локации», «Честь» и остальные разделы: изменяемые RU/EN названия через редактор, неизменные ключи для сохранений, D1, deep links и связей. Подразделы «Чести» также редактируются через интерактивные заголовки.
- Общие связи предметов, NPC, монстров и локаций: поиск по имени, явные действия «✎ Заменить», «× Удалить» и «+ Добавить» в той же строке. Для обратных связей, которые требуют неатомарной пары D1 записей, замена пока намеренно недоступна до транзакционной реализации.
- «Честь»: убрана повторная плашка о 1 000 чести, начальная награда перенесена в условия Оруженосца; введена последовательность ромбов, розетка и луны для рангов, в месячных званиях заголовок «Награды».
- Связь PvP-локаций: выбор новой локации из существующих, блокировка дубликата, кнопка «+ Добавить» рядом с последней строкой.
- Зафиксированы утверждённые UX-паттерны в `docs/APPROVED_UI_UX_GUIDELINES.md`. Тесты охватывают совпадение схемы клиента и Worker для подписей и сохранение состояния редактора.
- Сохранённая игровая математика, исходные таблицы D1 и билды пользователей не затронуты. Production редактирование требует отдельно авторизованного действия.


## 0.374.0 — 2026.11.05.374 · Кнопка «Скрыть» поверх шапки редактора

- Исправлено перекрытие кнопки «Скрыть» липким заголовком панели; z-index:3 у кнопки.
- Chromium проверяет центр клика, скрытие и повторное раскрытие после перехода в Энциклопедию.
- Каталог игры, Cloudflare D1 и формулы персонажей не менялись.


## 0.373.0 — 2026.11.05.373 · Редактор у левого края, улучшенная Честь и редактирование локаций без ручных названий

- **Корневая причина бага панели:** удалён устаревший набор правил в `pandora-studio-item-owner-editor.css`, который при открытии Wiki специально переносил `#ownerDock` вправо, уменьшал его до 298px/240px и менял поведение свёрнутой кнопки. Оформление редактора теперь живёт в одном `pandora-studio-owner-dock.css`.
- Свернутый редактор закреплён у левого края viewport даже после перехода в энциклопедию. Панель в скрытом состоянии не занимает место и не оставляет вертикальную полосу. Добавлен Chromium-тест открытия энциклопедии из редактора и геометрии кнопки.
- Честь: удалены техническое сообщение об изменении правил, ссылка на новость и подписи об источниках. Объяснение ресурсов уже содержится в пользовательском тексте; «Вся честь» не содержит лишнего предложения.
- Локации и войны в списках «Чести» показывают только язык интерфейса; ссылку на локацию заменяет небольшая стрелка без дублирования её названия. Редактор позволяет искать и выбирать существующую локацию, а новую создавать только в разделе «Локации».
- Админка Чести: редактируемые пояснения ресурсов, условия для каждой из 12 ранговых карточек, ежемесячные награды и пояснение продления; встроенный редактор D1 поддерживается обновлённой схемой Worker.
- Ранги: более понятные требования с «Вся честь» и золотом или местом в топе за прошлый месяц; «При вступлении в нацию» и описание новых предметов за честь заменены на понятные формулировки. RU/EN исправлены вместе.
- Ежемесячные звания: три отдельные карточки «Герцог», «Кронпринц», «Эрцгерцог» с перечислением национальных плащей и понятным условием продления. Существующие D1-правки старого текста плащей не стираются.
- После автосохранения текста «Чести» статья обновляется без пересоздания всего workbench; прокрутка и фильтр рангов остаются на месте.
- Код Worker изменён без D1-миграций; фактический deploy и авторизованные записи проверяются отдельно, unit/Chromium проверки публикуются через CI.
 

## 0.372.0 — 2026.11.05.372 · Исправлена панель редактора и открытие Книги героя; проверка D1 и аудит оригинальных иконок

- Режим редактора: вместо перекрывающего вертикального язычка — компактный горизонтальный переключатель; увеличена ширина панели и сделана одна внутренняя зона прокрутки.
- Клик, Enter и Space по основному образу героя открывают Книгу героя даже при включённом редакторе. Замена игровых портретов остаётся во вкладке «Раса», чтобы не перехватывать вход в Книгу.
- В существующих рецептах NPC поиск добавляемого NPC по игровому имени, исключение уже привязанных NPC и дублирования одного материала.
- В панели появился авторизованный ручной запуск безопасной проверки чтения/записи/удаления временных записей D1; производство не проверено этим коммитом до подтверждённого запуска с действующей админ-сессией.
- Оригинальные изображения: добавлен проверяемый read-only реестр 264 известных отсутствующих OS ресурсов с ID, именем и исходным URL; похожие иконки не выдаются за оригиналы.
- Добавлены браузерные регрессии портрета и геометрии панели, unit-тест временной записи D1 и документированная матрица редакторов по разделам.
- Ни один боевой коэффициент, пользовательский билд, исходный игровой JSON и запись production D1 не менялись этим релизом.



## 0.371.0 — 2026.11.05.371 · Компактные награды, реальные связи добычи и обменов, проверка исходных переводов и иконок

- Карточка награды за уровень стала компактной (до 480px): надпись, отдельное значение уровня, чип класса, экранная адаптация; сетка гарантированных по игровому snapshot наград равномернее заполняет доступную ширину.
- Редактор предметов позволяет привязать предмет к реальной добыче существующего монстра (обычная группа с p:null), а не только создать справочную ссылку. Редакторские подписи и подсказки RU/EN.
- Из карточки предмета добавлено создание реального рецепта обмена NPC с выбором NPC и предмета-материала; повтор идентичного бесплатного рецепта блокируется.
- Добавлена предварительная проверка исходной записи, всех предметов в добыче и сундуке, типов сохраняемых связей до D1 write.
- Новый unit suite проверяет DOM-обработчик источников, дубли добычи, корректное формирование связи и запрет сиротских ссылок. Игровые коэффициенты, шансы существующих сундуков и исходные OS записи не менялись.
- CI запускает read-only аудит оригинальных игровых WebP и манифеста и отчёт о непереведённых из официального OS источника названиях. Отсутствующие английские имена не выдумываются; локальные оригиналы не подменяются.
- Реальное тестирование в браузере и на опубликованном Pages проверяются после PR; production D1 данные не изменяются данным релизом.



## 0.370.0 — 2026.11.05.370 · Названия классов в наградах за уровень — коротко и понятно

- Карточки шкатулок награды за уровень используют короткие названия базовых классов: «Класс: Маг», «Класс: Воин», «Класс: Следопыт», «Класс: Адепт».
- Английские подписи приведены к «Class: Mage/Warrior/Scout/Acolyte» вместо Class family; неподтверждённые внутренние коды классов не показываются пользователям.
- Регрессионные проверки выполняют реальный фрагмент формирования карточки на четырёх базовых классах и обоих языках.
- Без изменений игровые данные, шансы сундуков, D1, формулы, экипировка и сохранённые билды. CI, real Chromium and Pages deployment должны проверяться отдельно.


## 0.369.0 — 2026.11.05.369 · Встроенная навигация длинных списков энциклопедии

- «↑ Наверх» больше не плавает над карточками предметов и не закрывает названия, иконки или полосу прокрутки. Кнопка превращена в отдельную небольшую нижнюю строку левой панели и оформлена в стиле энциклопедии.
- Список и кнопка имеют общий контур. Отступы, прокрутка и высота ограничены в одном контейнере, включая компактный экран; действие появляется лишь после значительной прокрутки.
- Подпись яснее: «↑ В начало списка» / «↑ Back to top». Существующий плавный возврат сохраняется с учётом reduced-motion; URL и карточка не меняются.
- Chromium acceptance проверяет геометрию: кнопка размещена после прокручиваемых записей, имеет ту же ширину и не перекрывает список. Game data, Worker/D1 and saved builds remain unchanged.


## 0.368.0 — 2026.11.05.368 · Простые названия наград, очистка пользовательских текстов и возвращение к началу списка

- Убрана бесполезная «К списку» возле статьи: список всегда виден слева. Добавлена «↑ Наверх» внутри левой колонки после глубокой прокрутки; кнопка исчезает в начале и не меняет открытую карточку.
- В витрине сундуков общедоступные заголовки стали «Возможные награды», число альтернатив указано без технической нумерации групп. Номера и исходная структура сохраняются в админском редакторе.
- Удалены пояснения о таблицах, сервере и методике шансов из видимых описаний сундуков. Цветные сундуки показывают категорию и короткую фразу об отсутствии сведений, не делая ложного вывода о пустоте.
- Убрана техническая формулировка о базе источников из карточек предметов, сокращена техническая пометка нерасшифрованных эффектов и текст предупреждения в редакторе локаций.
- Обновлены подсветка выбранных записей, клавиатурный фокус, оформление переключателей глав и визуальный стиль уведомления сундука; учтён reduced-motion.
- Добавлена компактная проверка целостности ссылок сохранённого каталога: монстры↔добыча, предметы/NPC↔обмены, предметы↔сундуки, границы шансов. Проверка не обращается к production D1.
- Обновлены адресные Node/Chromium проверки прокрутки, истории, RU/EN и текстов сундуков. Production D1, формулы, исходные шансы и игровые данные не менялись.


## 0.367.0 — 2026.11.05.367 · Игровая навигация энциклопедии и компактные группы наград шкатулок

- Энциклопедия: новая верхняя навигационная строка в игровом стиле — хлебные крошки, «← Назад» для реальной истории и «К списку» для любого входа; кнопки больше не конкурируют с названием предмета.
- «К списку» открывает текущую главу, очищает адрес предыдущего предмета и сохраняет полноценный переход «Назад/Вперёд». При смене раздела старый deep-link также больше не остаётся в адресе.
- Сундуки: одиночные группы с шансом 100% по таблице объединены визуально в компактную витрину, варианты каждой отдельной группы по-прежнему показаны отдельно.
- Вложенные шкатулки помечены и открываются через игровую ссылку; шанс отсутствующей записи показан как «Не указан», а не как 0%. Все исходные номера групп сохранены для админского редактирования.
- Режим редактора сохраняет исходные границы групп. Неизменённое пустое числовое поле не записывается как ноль при потере фокуса; подсказки при наведении на поля шкатулки теперь задерживаются на 1 секунду.
- Выравнивание иконки относительно заголовка, компактный блок награды за уровень, аккуратные карточки, улучшенный переключатель «Список / Сетка» и мобильная компоновка.
- В исходных данных сундуков и D1 не меняются ни награды, ни шансы; tests/CI требуются для подтверждения выпуска.


## 0.366.0 — 2026.11.05.366 · Исправлена история навигации энциклопедии и возврат к предыдущему экрану

- Исправлена ошибка, когда кнопка «Назад» после перехода в энциклопедию возвращала адрес, но не восстанавливала исходный экран без `#wiki`.
- Сохраняются предыдущее окно (главный экран, билды, список энциклопедии), выбранная глава, строка поиска и число показанных записей — только в истории браузера.
- Переход между предметом, монстром, душой и NPC открывает читаемую кнопку «← Назад» внутри статьи; она появляется только при реальном переходе внутри сайта, а не у произвольного внешнего deep-link.
- Повторное открытие того же URL не создаёт лишних записей истории; Forward корректно повторно открывает статью. Дублирующиеся перерисовки при `popstate` + `hashchange` предотвращены.
- Отдельный компактный CSS-модуль с доступностью для клавиатуры, мобильных размеров и prefers-reduced-motion.
- Unit и реальный Chromium: Back/Forward из списка, ссылочного перехода «душа → монстр», прямой deep-link, повторная навигация RU/EN. Production D1 остаётся read-only.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.365.0 — 2026.11.05.365 · Безопасная сверка игровых ссылок, поиск по описаниям и сохранение состояния просмотра

- Изменение игровой ссылки `<item ...>` или невидимое после форматирования различие больше не считается пригодным для массового «Выбрать понятные»: требуется отдельная ручная галочка.
- Два самостоятельных фильтра: «Игровые ссылки» и «Текст совпадает», с заметными объяснениями на карточках сравнения.
- Поиск по русским и английским описаниям и названиям связанных предметов, даже если в исходном тексте стоит игровой `<item ...>`; результаты индексируются на время сверки.
- Раскрытые подробности записей и предпросмотры игровых ссылок сохраняются при изменении фильтров; прокрутка большого модального окна сохраняется при обновлении списка; клавиатурный фокус не теряется после выбора строки.
- Отдельные игровые подсказки на ссылках и разницах чисел без дублирующих браузерных title; повторяющиеся предупреждения уточнены.
- Количество объектов с отличиями переносов называется числом записей, а не числом отдельных описаний.
- Новые unit и Chromium регрессии: ручное подтверждение ссылок, поисковый результат, предпросмотр, изоляция изменений от production D1.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.364.0 — 2026.11.05.364 · Выдвижная панель редактора у края экрана

- Удалено ошибочное встраивание административных инструментов в левую колонку героя: панель находится поверх сайта и не меняет высоту или сетку характеристик.
- Слева у края экрана постоянно доступен только компактный переключатель «Редактор»; панель выдвигается по нажатию, скрывается той же кнопкой или клавишей Escape. Скрытое содержимое не получает фокус с клавиатуры.
- Адаптивное позиционирование, ограничение по высоте экрана и внутренний скролл, приглушённые анимации при prefers-reduced-motion, отдельная индикация ошибок сохранения.
- Кнопки административного каталога и редактора показывают подсказки после 1000 мс наведения, при уходе мыши ожидание отменяется. Фокус с клавиатуры и касание продолжают работать.
- Добавлены модульные и Chromium-регрессии для положения панели, закрытого состояния, предотвращения изменения разметки и задержки подсказок.
- Игровые данные в D1 не изменяются этим релизом.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.363.0 — 2026.11.05.363 · Интерактивная проверка игровых ссылок, изменений добычи и встроенная панель редактора слева

- Игровые ссылки на предметы в сравнении: пунктирные интерактивные названия, предпросмотр, безопасный переход к опубликованной карточке в новой вкладке.
- Числовые разницы рядом с новым значением; понятные пояснения к дополнительным слотам добычи и отметки одноимённых монстров.
- Если видимый текст совпадает, сверка объясняет изменения привязки ссылок и различия исходного представления.
- Приоритет точных игровых `<br>` при показе описаний; регрессионные проверки переносов, ссылок и английского текста.
- Панель редактора перенесена вниз левой колонки с плавным сворачиванием и поддержкой клавиатуры.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.362.0 — 2026.11.05.362 · Читаемые описания и ссылки на предметы

- Описание предмета в энциклопедии корректно обрабатывает игровые теги переноса как настоящие строки, а `<item 300001>` безопасно показывает как кликабельное «Билет испытаний» только при наличии проверенной записи в актуальном каталоге. Ссылки ведут на карточки внутри энциклопедии; никаких HTML-вставок из исходных JSON.
- Сравнение RU/EN описаний показывает короткое понятное резюме и полные значения «было → стало» с переносами строк и названиями предметов вместо внутренних тегов, без удвоения огромного текста.
- Администраторский инлайн-редактор сохраняет реальные исходные ссылки при изменении описаний, не теряя обработчики ссылок при отмене редактирования.
- Изменения только контрольных сумм/численности каталога исключены из списка игровых изменений; сами значения остаются в «Дополнительных инструментах» как диагностика происхождения файлов. Настоящие изменения настроек игры по-прежнему требуют ручного решения.
- Добавлена отдельная **выключенная по умолчанию** настройка синхронизации только переносов описаний с текущим игровым источником. Она не принимает характеристики, эффекты или названия; сохранение возможно только после подтверждения администратора. Данные D1 не перезаписываются самим релизом.
- Регрессии проверяют разрешение имен предметов, HTML-безопасность, отсутствие ложных игровых различий при изменениях переносов, корректную мета-классификацию и доступность админских действий.


## 0.361.0 — 2026.11.04.361 · Сравнение по смыслу и загрузка актуальной версии

- Проверено с текущими открытыми JSON и опубликованной D1: 1716 сообщений о различиях преимущественно были вызваны оформлением описаний `<br>`. После исключения только разметки переносов получаются 3 изменения предметов, 0 душ, 10 монстров, 5 таблиц добычи, 1 английское описание и 1 метаданных (20 всего); исходные данные не перезаписываются.
- Сравнение не считает `<br>` или CR/LF в описании игровым изменением, сохраняя точный текст, характеристики, названия, эффекты и числа без нормализации. Отдельная побайтовая проверка не позволяет считать исходный SHA актуальным, когда оформление оригинала не совпадает.
- Предпросмотр показывает игровые переносы строк как переносы, не выводит буквально `<br>` и никогда не вставляет HTML из игрового сайта в DOM.
- Опубликованная версия грузит основной каталог, таблицы расчёта и улучшения предметов из единой согласованной публикации Cloudflare D1. Архив GitHub Pages больше не показывается до завершения D1-проверки и доступен только по явному выбору при ошибке (плюс обычная локальная разработка, всегда помеченная как архив).
- Добавлен полноэкранный Vintage-загрузчик с размытием фона, анимациями, отдельными RU/EN сообщениями, режимом ошибки, повтором и осознанным архивным режимом; соблюдается reduced motion.
- Начальная EN-версия ждёт переводы ровно той же публикации D1, RU отдаёт приоритет русскому интерфейсу и асинхронно готовит английский; переключение на EN не показывает полупереведённый интерфейс.
- В обычном режиме энциклопедия не подменяет недоступную D1 старым архивом. Изменений в production D1, аккаунтах и сохранённых билдах нет.


## 0.360.0 — 2026.11.04.360 · Текущие игровые данные и быстрый первый экран

- Исправлена реальная ошибка `instances.json invalid-format`: официальный JSON подземелий представляет собой массив. Доверенный Worker разрешает массив только для подземелий; другие наборы обязаны оставаться объектами.
- К Worker добавлена ограниченная read-only проверка всех 17 публичных игровых JSON, с тремя одновременными запросами, ограничением частоты, без записи в D1 и без возвращения игровых записей в диагностике.
- Первая загрузка персонажа теперь может показывать проверенный локальный каталог, пока полная согласованная версия D1 загружается; затем D1 целиком заменяет временную копию, не сбрасывая активный билд.
- Английский набор переводов загружается по необходимости и не блокирует русскую версию. Стартовые ОЗ и ОМ обновляются сразу при готовности базовых таблиц.
- Энциклопедия может показывать проверенный архив без долгого пустого экрана, затем обновлять его только полностью согласованной D1. Частичные или смешанные снимки отклоняются.
- Административное сравнение игровых данных и D1 использует максимум три одновременных запроса вместо длинной последовательности, сохраняя проверку метаданных до и после сравнения.
- Автотесты проверяют допустимый формат всех 17 источников, недопустимые массивы, безопасность read-only диагностики, целостность связей энциклопедии и регрессии UI.
- Релиз интерфейса и Worker независимы; в существующую D1 никто автоматически не записывает игровые изменения.


## 0.358.0 — 2026.11.04.358 · Диагностика доступа к игровым данным из Cloudflare Worker

- Вынесен общий защищённый загрузчик публичных JSON `pandorasaga-os.com` с диагностикой каждого доверенного адреса и ограничением времени ожидания для каждого запроса.
- Добавлена фиксированная read-only проверка `/api/source-health`, выполняющая запрос из production Worker, не из браузера или GitHub runner. Результат кэшируется, игровой JSON не раскрывается, произвольные URL не принимаются.
- При ошибке администратор получает безопасные коды проблем по каждому хосту. Публикация D1 не выполняется автоматически.
- Автоматический выпуск проверенного Worker после слияния `bonaqu_projects` через сохранённый секрет GitHub Actions `CLOUDFLARE_API_TOKEN`, с предварительными проверками существующей базы, dry-run, `--keep-vars`, проверкой совместимости и без миграций.
- После выпуска CI проверяет серверный сетевой маршрут. Возможные запреты со стороны игрового сайта требуют отдельного исправления или разрешения владельцев источника, их нельзя считать решёнными заранее.


## 0.357.0 — 2026.11.04.357 · Источники игровых данных и понятная админка

- Разъяснено, что кнопка текущей игры читает публичные JSON с pandorasaga-os.com через аутентифицированный Cloudflare Worker, не файлы игрока и не живой процесс сервера.
- Архивная сверка явно ограничена ранее сохранёнными файлами из GitHub Pages; архив не выдаётся за актуальный источник.
- Общие игровые подсказки при наведении/фокусе добавлены для действий, фильтров и поиска в админском каталоге.
- При ошибке публичного игрового источника показываются конкретный набор данных и безопасная диагностическая причина Worker (например, HTTP 403, тайм-аут или сетевая ошибка), а опубликованная D1 остаётся без изменений.
- Подтверждение сетевого доступа именно из production Worker к независимому сайту игры требует администраторского запроса; этот релиз не заявляет обход внешних ограничений доступа.
- Регрессионные проверки источника и подсказок выполняются без изменения production D1.


## 0.356.0 — 2026.11.04.356 · Исправление публикации каталога D1 и проверка понятных изменений

- Исправлено создание идентификатора версии при применении проверенных изменений: дефисы UUID теперь удаляются корректно, поэтому Cloudflare Worker принимает снимок D1.
- Добавлен регрессионный тест реального формата ID и проверка перед отправкой пакетов на сервер.
- Продолжен глубокий аудит: человекочитаемые ПРВ/ЛВК, золото и заточка сундуков, ограничения NPC-обменов, длинные английские описания, проверки целостности исходных данных.
- Обновлены сообщения прогресса публикации; архивная сверка не считается проверкой текущего сервера.
- Перед слиянием проверить CI. Ни GitHub PR, ни обновление Pages не переключают активную D1 автоматически.


## 0.355.0 — 2026.11.04.355 · Понятная админка и скорость в браузере

- Главная проверка изменений из текущей игры отделена от архивной сверки; при ошибке показано понятное действие, технические сведения скрыты, данные D1 остаются нетронутыми.
- Дополнительные инструменты администратора и GitHub собраны под раскрываемым пунктом. Коды и идентификаторы отдельных изменений показаны только в подробностях.
- Замер скорости реальных списков Энциклопедии доступен прямо в админском браузере без локальной установки Node.js и клонирования репозитория.
- Защищённый игровой адаптер проверяет оба официальных адреса исходного сайта и возвращает диагностический код при недоступности; он не выдаёт архивные данные за актуальные.
- Для десяти ранее несопоставленных английских эффектов добавлены ссылки на точные описания исходных предметов; всего 18 наблюдений с первичной предметной атрибуцией, без выдуманных механик.
- Задачи по полному паритету с клиентом игры, недоступным исходным данным и замерам именно на устройстве владельца требуют отдельных подтверждений.


## 0.354.0 — 2026.11.04.354 · D1 admin-write integrity and local Wiki profiling

- Added authenticated isolated readback and cleanup for both `catalog_entries` and `overrides` D1 tables, with actual before/after verification of the published catalog snapshot.
- Isolated QA keys no longer appear in the public override response; admin UI requires both readback/cleanup checks and reports failures.
- Added five D1 regression cases and a one-command local-PC headless Chromium benchmark for the Items, Monsters and Souls encyclopedia lists.
- Source-checked five previously unmapped English effect names against the bundled OS item descriptions (Weakness, Freeze, Madness, physical attack evasion and fire magic); three more EP codes remain without corroborated plain-English labels.
- Browser acceptance, production Worker deployment, and true owner-device measurements must be verified independently.


## 0.353.0 — 2026.11.04.353 · Аудит английских эффектов и производительности энциклопедии

- По OS-каталогу сверены 101 реально присутствующий код эффекта предметов, душ и заточки; каждому соответствует запись в `data/localization/remaked-effect-source.v1.json` с привязкой к неизменяемому коммиту Remaked.
- Для 64 эффектов подтверждена связь с EN шкалой Remaked; 37 оставлены явно неподтверждёнными. 11 неточных EN надписей исправлены, 14 отсутствующих ранее, но подтверждённых шкалой Remaked, добавлены; четыре неизвестных кода не переименованы наугад.
- Для набора сотен карточек Wiki DOM обновляется одной вставкой через DocumentFragment; переводы поисковых алиасов нормализуются только один раз на отображаемую версию списка.
- Добавлен браузерный замер разворачивания и поиска в разделах предметов, монстров и душ с указанием характеристик runner и фактических миллисекунд (не заявляется, что это ПК пользователя).
- Добавлены проверки полноты аудита эффектов, кэша и сохранения идентификаторов источника. Изменений игрового баланса или прямых записей в production D1 нет.
- Дополнительно проверены редко используемые экраны «Персонаж», «Профиль» и старый редактор атрибутов: RU/EN подписи теперь соответствуют выбранному языку и не меняют сохранённые пользовательские значения; убран повторный расчёт базового превью для каждого поля.


## 0.352.0 — 2026.11.04.352 · Надёжная синхронизация энциклопедии и плавный поиск

- Устранена гонка асинхронной загрузки Wiki: устаревшие D1-ответы и ошибки старых запросов больше не способны подменить новый каталог после сохранения админом или публикации.
- Очистка pending-запроса теперь проверяет принадлежность конкретному запросу и не сбрасывает последнюю загрузку.
- Сохранена повторная сборка индекса на основе проверенного D1-снимка без лишней загрузки всех наборов после каждой правки.
- Поиск энциклопедии группирует частые нажатия клавиш перед тяжёлой фильтрацией и построением DOM; отложенная задача отменяется при переходе на другую страницу.
- Добавлены исполняемые регрессионные тесты устаревшего ответа, сетевой ошибки, повторного использования снимка и жизненного цикла поискового таймера.
- Production Worker обновляется отдельно через защищённый ручной workflow; игровые данные и D1 не перезаписываются в этом релизе.


## 0.351.0 — 2026.11.03.351 · Редактирование английских названий и описаний предметов в D1, кэш поиска и очистка обработчиков энциклопедии

- Администратор редактирует RU и EN названия и описания предметов и сундуков непосредственно в энциклопедии. Английские поля хранятся отдельно от исходного каталога в Cloudflare D1 overrides, с серверной валидацией.
- Согласован приоритет локализации: явно сохранённый английский текст администратора перекрывает локальное и официальное имя; при отсутствии правки используется подтверждённая EN строка каталога OS.
- Результаты фильтрации Wiki кэшируются внутри открытого списка с учётом поисковой строки, фильтров, персонажа и версии данных. Переход между карточками без смены условий больше не сканирует весь каталог заново.
- Очищаются временные document.pointerdown обработчики редакторских панелей при закрытии панели или повторном рендере. Визуальный редактор не показывает внутренние ключи переопределений, удалён неиспользуемый CSS.
- Node регрессии: D1 EN редактирование и ограничения, жизненный цикл временных слушателей, повторное использование выборки и сопоставление десяти подтверждённых EN названий Remaked / OS.
- Проверка CI, опубликованных Pages и Worker выполняется отдельно; production D1 данные не перезаписываются в рамках PR.



## 0.350.0 — 2026.11.03.350 · Чистая энциклопедия, локализация эффектов и оптимизация

- Пользовательские карточки расходников и снаряжения больше не выдают ID умения за численный бонус; известные умения, срабатывающие на экипировке, открываются по ссылке.
- Все 81 кода эффектов из сохранённого каталога получили полноценные английские названия. Администратор сохраняет доступ к исходным ID в интерактивном редакторе.
- Убраны технические пояснения про EP_* и неизучаемый технический «Яд» из карточек игрока. Оставлены описание отравления, реально изучаемый «Ядовитый удар», противоядия и подтверждённые рецепты.
- Пустая категория «Требуют проверки» больше не показывается. Если новые неклассифицированные действия появятся, доступна категория «Прочие эффекты». Служебные описания «Недоступно (не загружено)» не выводятся обычному читателю.
- Связи рецептов и умений предварительно индексируются для конкретной версии загруженного каталога; редактор эффектов не перебирает весь каталог при обычном просмотре.
- Усилены Node и Chromium тесты: правильность RU/EN, отсутствие служебных ID в публичной карточке, безопасный вывод вероятностных умений, обновление каталога и мобильная вёрстка.



## 0.349.0 — 2026.11.03.349 · Верификация предметных эффектов и связей отравления

- Перебраны 107 предметов без экипировочного слота с явными эффектами: 71 источник активных действий классифицирован, оставшиеся 36 кодов EP_RANDOM_BOX — контейнеры и остаются в сундуках; 4 точных дубликата свёрнуты в списке.
- Новый фильтр «Требуют проверки» не допускает ложной классификации будущего умения как положительного эффекта. Ядовитые будущие расходники с EP_CAUSE_POISON или EP_DESTINED_POISON учитываются без привязки к названию или POTION.
- В карточках корня и зелья: техническое неизучаемое умение «Яд» (500000004) и «Ядовитый удар» связаны с EP_CAUSE_POISON, но не приравнены к EP_DESTINED_POISON предмета; длительность и шанс не измышляются.
- Для EP_CONSUME_ITEM и EP_ADDITION_ITEM выведены подтверждённые количества материалов/результатов, включая единую бутылку для «Яд» и «Скороговорка». Добавлены независимые Node/Chromium проверки.
- 19 праздничных TOY без кода эффекта, 3 неописанных POTION/BALM и премиум-билет без игрового on-use кода не записываются автоматически в усиления; механика их активации не верифицирована.


## 0.348.0 — 2026.11.03.348 · Аудит расходуемых предметов эффектов, очищения и цепочки яда

- Энциклопедия классифицирует все 71 ID расходуемых предметов с активными эффектами из проверенного OS-снимка, объединяя 4 точных дубля в 67 отображаемых записей: усиления, лечение ОЗ/ОМ, прямое и косвенное снятие состояний, отравление и отдельные утилитарные действия.
- Чудесное зелье запускает Очищение; теперь показано как снятие одного отрицательного эффекта, включая Книгу героя. Мультиэффектные предметы присутствуют в каждой подходящей группе.
- Для корня/зелья яда показаны связи с алхимией, созданием зелья и обработкой оружия; доступны ссылки на умения, яд и противоядие. Не приписываем параметру 50 вероятность или урон.
- Данные OS и production D1 не изменялись. Node/Chromium и public Pages требуют отдельной проверки.


## 0.347.0 — 2026.11.03.347 · Изолированный расчёт A/B и безопасное сравнение повреждённых сохранённых билдов

- Сравнение сохранённых билдов больше не теряет результат B из-за ошибки расчёта A (и наоборот).
- Повреждённые числа очков и списки умений не подменяются ложными нулями и не обрывают таблицу.
- Дополнительные регрессионные проверки сохранений; production D1 не изменяется.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.346.0 — 2026.11.03.346 · Понятная админка, редактирование энциклопедии и связи NPC

- Редактор сайта показывает состояние реального POST в Cloudflare D1: «Сохраняю», «Сохранено» или ошибку; отдельно указаны уже сохранённые записи и изменения текущего сеанса. Разворачиваемая инструкция объясняет автосохранение, «Все правки», «Игровой каталог», необязательный экспорт PR в GitHub и выход из редактирования. Запрещено выходить при незавершённой записи.
- Длинные редактируемые названия монстров/NPC/локаций (включая «Мастер арены Алиса») теперь показываются полностью, без старого ограничения 320px и nowrap; добавлены фокус клавиатуры и F2 для редактируемых заголовков.
- У карт с отсутствующими NPC не показывается лишняя фраза «Подтверждённых сведений о NPC пока нет». Подтверждённые будущие локации используют обычный визуальный стиль списка.
- Вкладки энциклопедии: добавление отсутствующих характеристик предметов и навыков, стоимости души, комментария к источнику предмета, назначения и координат любых NPC; двуязычные названия/описания у навыков, душ и подземелий.
- Создание администраторских NPC (RU/EN) прямо из будущей или новой локации, местонахождение и кликабельные связи в энциклопедии. Собственные NPC хранятся только как D1-правки, не подменяют реальные серверные ID.
- Безопасное удаление созданных администратором локаций, монстров и NPC через reset D1 с защитой от удаления записей, у которых есть входящие ссылки. Реальные записи игрового сервера не удаляются.
- Обзор «Все правки» показывает имя новых записей вместо технических ID и допускает переход к их карточкам. Проверки Node/D1 и браузерная проверка редактора расширены.
- В «Моих билдах» появилось полноценное **сравнение двух сохранённых билдов A/B внутри списка**, без отдельного модального окна: выбор A/B, перестановка, сравнение всех полей или только отличий, поиск, разделы «Расчёт / Персонаж / Снаряжение / Навыки / Усиления» и таблица Δ = B − A.
- Числовые параметры сравнения считаются индивидуально для каждого сохранённого героя тем же калькулятором и матрицей Книги героя; неподтверждённые значения остаются «—», а не превращаются в 0. Снимки билдов не меняются при сравнении.
- Плавающая админ-панель теперь сворачивается при открытии энциклопедии, чтобы не перекрывать интерактивные поля и кнопки NPC/монстров/локаций; можно развернуть вручную.



## 0.345.0 — 2026.11.03.345 · Подтверждённые будущие локации и админ-редактор монстров

- Эль Ведд и Подземные руины Астира — подтверждённые игровые локации для будущего обновления, без неверных баннеров «историческая» и «недоступна» и без неподтверждённых выдуманных описаний.
- Списки монстров отображаются нативными компонентами обычных локаций. Сохранены все 22 записи Эль Ведда; 19 текущих соответствий с OS связаны с карточками; для остальных можно назначить существующий ID или создать редакторскую карточку.
- Администратор создаёт новых монстров с отдельными D1 owner-ID, двуязычными названиями, уровнем, характеристиками, сопротивлениями и редактируемой добычей без вымышленных процентов. Новые монстры не выдаются за записи актуального игрового сервера.
- В Эль Ведде разрешено редактировать каждый указанный уровень/название, связывать/отвязывать карточки, исправлять спорные сведения, не затрагивая оригинальный каталог OS; связи обновляются и в карточках монстров, локаций, подземелий и предметов.
- Поддержка D1-валидации, GitHub owner-review и браузерных/regression проверок новых типов записей.
 

## 0.344.0 — 2026.11.03.344 · Единые локации, визуальный D1-редактор и спокойная Книга героя

- Исторические Эль Ведд и Подземные руины Астира оформлены теми же нативными карточками, списками монстров, NPC и добычи, что и обычные локации. Все 22 исторических появления остаются видимыми; три неподтверждённых ID явно отмечены без ложных ссылок.
- Администратор создаёт новые двуязычные локации прямо в Энциклопедии; D1 хранит RU/EN описание, разделы, теги, проверенные связи NPC, монстров, добычи и пользовательские разделы (текст, предметы, NPC или монстры). Игровой исходный OS-каталог не меняется.
- В разделе «Очки чести» левая панель приведена к обычному виду Энциклопедии, добавлены активные переходы и фильтры рангов без потери информации.
- В Усилениях чести оставлен компактный выбор навыка; сведения о ранге Министр перенесены в стилизованную подсказку на словах «пассивное умение». Удалены поясняющий абзац и переход в Энциклопедию.
- Книга героя сохраняет смонтированную прокручиваемую панель при изменении усилений, чтобы избежать повторной анимации и сброса позиции.
- Клиент и Worker проверяют один и тот же набор разрешённых типов новых карт и полей; авторизованные D1-запись, сброс и GitHub-экспорт покрыты регрессионными тестами.


## 0.343.0 — 2026.11.03.343 · Подсказки и D1-редактор Книги героя, честь и исторические PvP-локации

- Результаты расчёта: 43 компактные RU/EN подсказки, оформленные существующим игровым стилем stage-hover-preview, с мышью, клавиатурой и касанием.
- Пассивное восстановление / Passive recovery: индекс скорости отличается от количества ОЗ/ОМ, не объявляется единицей времени или обычным процентом.
- Усиления: гильдейские настройки отдельно от выбора одного пассивного умения за честь (Count/Министр — 129 000 «Вся честь», 640 000 золота).
- Энциклопедия: двуязычные Очки чести, 12 рангов, PvP-войны и локации, топ-15/5/1 и награды наций; изменение чести с 23.10.2026 по официальной новости OS.
- Исторические El Beht / Эль Ведд и Underground of Astir / Подземные руины Астира; 22 исторических появления, 19 с подтверждёнными текущими ID, три без выдуманных ссылок.
- Owner: D1-валидация редактирования RU/EN подписей и подсказок, рангов, текста Wiki и списков войн/локаций; без изменения игровых формул и снимков OS.
- Для поддержки новых полей редактирования нужен деплой Worker — успешная публикация Pages сама по себе не обновляет его серверные правила.


## 0.342.0 — 2026.11.03.342 · Раздельные разделы Книги героя по структуре Modern UI без дублирования результатов

- По исходным массивам Remaked `Set.Status` (43 результата), `Set.ATK`, `Set.RES` разделены **три независимых набора**: 43 итоговых значения только в «Результатах расчёта»; в «Атаке» — дополнительный урон оружия, ауры, стихийная магия, отдельные эффекты и проки; в «Защите» — естественное восстановление, сопротивления отдельным состояниям и условные защитные механики.
- «Эффекты умений» теперь содержат действия конкретных навыков, а не повтор активированных галочек усиления; «Эффекты зелий» сохраняют свою механику, включает расходники снятия состояний и запуска умений, но без дублирующей плитки общей эффективности.
- Стихийное оружие, специальные эффекты и проки имеют единственный раздел-владелец. Проверяется блокировка несовместимых расовых свойств, отсутствие двойного RANGE/CARRY, исключение повтора огненного бонуса заточки и повторов во всех шести главах.
- Визуальные элементы остаются в прежнем стиле книги; вторичные величины выводятся компактными строками, без сырой арифметики и неподтверждённых итогов. Обновлены браузерные проверки и карта источников `docs/HERO_BOOK_CHAPTER_MAPPING_2026-11-03.md`.
- Продакшен D1 и игровые данные не изменены. Полное соответствие игровому клиенту OS остаётся отдельной задачей.


## 0.341.0 — 2026.11.03.341 · Книга героя: сворачиваемые предметы и независимые эффекты без засорения итоговых характеристик

- Результаты атаки и защиты сохраняют итоговые показатели. Параметры отдельно экипированных вещей скрыты в компактном раскрываемом списке с исходными иконками и переходом в Энциклопедию.
- Источниковые расовые эффекты владения оружием, бонусы дальности, пассивные процентные эффекты и отдельно учитываемый магический бонус не потеряны при удалении публичных формул: показаны только на вкладке «Эффекты», свёрнутыми по умолчанию, без суммирования с итогами.
- Парные поля RANGE/CARRY показаны как единый расовый источник, эффекты несовместимого оружия не объявляются активными. Оставлены тесты источников и математического движка.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.340.0 — 2026.11.03.340 · Периодический урон ядом от расходников; Книга героя показывает итоговые значения без раскрытия формул

- Исправлено описание ядовитого корня (50022) и ядовитого зелья (50056): временное отравление наносит периодический урон ядом употребившему предмет персонажу. Неизвестные размер и интервал тика, длительность и шанс не выдуманы.
- Книга героя возвращена к подаче Modern UI: только финальные значения в «Результатах расчёта», «Атаке», «Защите» и восстановлении, без раскрывающихся формул, арифметики компонентов и многократных дублирующих таблиц.
- Сохранены формулы движка и регрессионные проверки итоговых величин; независимые условные эффекты вынесены во вкладку «Эффекты», а не смешаны с итогом. RU/EN итоговые плитки расширены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.339.0 — 2026.11.03.339 · Импорт иконок: безопасные пакетные обновления и явная перепроверка известных HTTP 404

- Importer теперь пропускает ранее подтверждённые 404 по умолчанию и не повторяет загрузку отсутствующих источников на каждом пакетном запуске; для сознательной перепроверки появился флаг --retry-404.
- После частичного скачивания манифест формируется по всему архиву и сохраняет ранее проверенные отсутствующие оригиналы. 404 не пытается загрузиться трижды подряд.
- Тесты проверяют нулевую очередь обычного dry-run, 264 источника при retry-404, лимиты, неизменность манифеста и сохранность проверяемого источника. Browser acceptance and deployed Pages state must be verified separately.


## 0.338.0 — 2026.11.03.338 · Книга героя: подробные формулы атаки, защиты, точности, уклонения, скорости и расхода ОМ

- Книга героя → Атака/Защита: раскрываемая подробная проверяемая раскладка уже рассчитываемых величин. Включены физическая атака, точность, крит, скорости, расход ОМ, уклонение и защита.
- Суммы сверяются с фактическим результатом калькулятора; несовпадения и недостающие источники не выдаются за проверенные формулы.
- Значения сохраняют статус частичной модели: неподтверждённые активные эффекты сервера не симулируются. Browser acceptance and deployed Pages state must be verified separately.


## 0.337.0 — 2026.11.03.337 · Книга героя: формулы ОЗ/ОМ с коэффициентами класса, подробными бонусами и проверкой округления

- Книга героя показывает формулу ОЗ/ОМ: базовые коэффициенты класса, уровень, характеристика, плоские бонусы, процентные бонусы с индивидуальным округлением, гильдия, Знак жизни.
- Целочисленная арифметика базы и её отображения используют общий источник. Проверка суммы предотвращает ложные результаты при неполных данных.
- Регрессионные тесты: уровни 1–55, положительные и отрицательные проценты, гильдия, жизнь, RU/EN. Browser acceptance and deployed Pages state must be verified separately.


## 0.336.0 — 2026.11.03.336 · Отравляющие предметы перенесены в отрицательные эффекты Энциклопедии; Книга героя очищена от справочного списка

- Проверены ID 50022 и 50056: отрицательный эффект EP_DESTINED_POISON, применение к использовавшему предмет; число 50 не считается доказанным уроном, шансом или длительностью.
- В Энциклопедии появился фильтр «Дают отрицательные эффекты». Проверены противоядие, позитивные предметы и будущие записи с известным игровым кодом.
- Удалён отдельный справочный раздел ядовитых расходников из Книги героя; неизвестное значение серверного поля не показывается игроку как готовая формула.
- Дополнены регрессионные тесты. Browser acceptance and deployed Pages state must be verified separately.


## 0.335.0 — 2026.11.03.335 · Расходники с отравлением и оптимизация Книги героя

- По оригинальному OS items.json добавлен отдельный справочный список «Ядовитый корень» (50022) и «Ядовитое зелье» (50056): оба содержат EP_DESTINED_POISON, но не являются лечащими расходниками.
- Число 50 из исходного эффект-кода не интерпретируется как урон, вероятность или длительность без подтверждения игры. Предметы не влияют на ОЗ/ОМ и доступны по клику из главы эффектов в Энциклопедию.
- Улучшена производительность массовой перерисовки Книги героя: упорядоченные RU/EN словари переводов создаются однократно, вместо повторного построения для каждого DOM-узла; правила перевода и пользовательские имена сохранены.
- Новые тесты исходных ID, полей эффекта, защиты от повреждений каталога, отсутствия ложного лечения и переводов RU/EN. Игровые коэффициенты и уровни планирования 1–55 не менялись.


## 0.334.0 — 2026.11.03.334 · Целостность источников и числовых эффектов

- Общий источник `sourceEffects` отвергает совпадающие только по названию или подменённые ID предметов/душ, некорректную заточку, испорченные строки и неверно связанные Forth-снимки до расчёта характеристик.
- `gatherEffects` больше не превращает `null`, `true` и строки в игровые бонусы через `Number()`; в словарях `EP_*` используются только собственные ключи, без унаследованных полей JavaScript.
- Добавлены тесты предмета 1862 с реальной заточкой, ошибочного источника Высокой души, невалидных данных и эталона ОЗ/ОМ эльфа-воина 149/44 → 155/44 с правильным кольцом.
- Правка не меняет классовые коэффициенты, правила сохранения и планировочный уровень 55; полный боевой паритет по-прежнему требует сверки игрового клиента.


## 0.333.0 — 2026.11.03.333 · Стихийное усиление огненного кинжала

- Добавлен источниковый `EP_ELEMENT_DAMAGE_SCALE_FIRE` для оружия ID 1862 «Огненный кинжал зноя»: +1/+2/+3/+4% к магической атаке огнём на уровнях заточки +7/+8/+9/+10 по `itemForth.json`.
- Для предварительного значения требуется выбранный самоцвет **огня** на том же оружии и том же уровне заточки. Обход требований через другой предмет/камень/уровень или дубликаты источника запрещён.
- Значение отдельно видно в главе атаки и не прибавляется к общей МАТК, титулу чести, ауре или неизвестному срабатыванию Пламени феникса. Порядок серверного суммирования ещё требует проверки по клиенту.
- Код `EP_ELEMENT_DAMAGE_SCALE_FIRE` переведён из «неизвестно» в осторожную категорию preview. Добавлены тесты всех четырёх грейдов, условий выбора элемента, некорректных источников, сортировки и полноты исходных связей.


## 0.332.0 — 2026.11.03.332 · Источниковая целостность архива иконок

- Аудит оригинальных игровых изображений теперь сверяет весь путь «ID в OS skills/items/souls → ожидаемая иконка → проверенный WebP → manifest.icons». Несоответствие, лишний или неописанный файл перестают проходить незамеченными.
- Список `manifest.missing` проверяется по действительно отсутствующим файлам: восстановленная иконка не может бесконечно оставаться помеченной как HTTP 404. Исключены дубли отсутствующих путей и записи для неизвестных исходных ID.
- Подтверждены тип и целостность WebP, итоговые expected/present/missing, отлов ошибок источника и отсутствие сетевых запросов при обычном аудите. Добавлены новые автотесты.
- По состоянию снимка присутствуют 1173 из 1437 оригинальных иконок; остальные 264 помечены как отсутствующие в исходном хосте (HTTP 404). Не утверждается 100% полнота арта и не выполняется подмена игрового изображения.


## 0.331.0 — 2026.11.03.331 · Расовые оружейные навыки по серверным данным

- Три пассивных навыка из актуального OS skills.json: Бойцовский дух человека (900010001), Дух цверга дворфа (900030002) и Сильные руки энкиду (900050002) показывают отдельно flat/fv1 и процент/fv2, с проверкой категории надетого оружия.
- Новый `combat.racialWeapon` не прибавляет неподтверждённый бонус к итоговой АТК: исходные числа и типы оружия подтверждены игровыми данными, но стадия применения и округление сервером пока не определены.
- Регрессионные тесты на актуальные EP_SKILL_EQUIP_DAMAGERATE, три расовые принадлежности, типы оружия, отсутствие ложной прибавки и обработку изменённых/испорченных записей навыка.
- Аудит Remaked выявил исторический невыполнимый AND для нескольких взаимоисключающих типов оружия; он не перенесён в Build Studio. Остальные вычисления и планирование 1–55 сохранены.


## 0.330.0 — 2026.11.03.330 · Расовые эффекты дальности и стойкости

- «Зоркость» эльфа (ID 900020002) отдельно показывает источник +500 к дальности, проверяя парные EP_RACE_RANGE/EP_RACE_CARRY из текущего OS skills.json. Эти два поля не складываются в выдуманное +1000; поле базовой дальности оружия и бонусы от экипировки остаются независимыми.
- «Упрямое сердце» дворфа (ID 900030001) выводит условную способность EP_RACE_TOUGH_HEART=20, не меняя постоянные ОЗ или защиту и не обещая гарантированное переживание удара.
- Новые регрессионные тесты проверяют правильные ID и TARGET-эффекты, отсутствие начисления чужих расовых эффектов, поведение при неверном или отсутствующем источнике, сохранение 55 уровня.
- Убраны устаревшие противоречия о фоновой записи уже сохранённых билдов из docs/OS_LIVE_PARITY_CHECKS.md; подтверждён текущий ручной сценарий сохранения и работающая авторизация по аккаунту.


## 0.329.0 — 2026.11.03.329 · Строгая привязка расовой пассивки к расе при расчёте и загрузке билда

- При вычислении характеристик любая сохранённая расовая пассивка проходит проверку принадлежности текущей расе по загруженному `racialPassives.json`.
- Допустимые старые строковые ID приводятся к каноническим числовым; чужие, повреждённые и неразрешённые становятся `null` ещё до запуска формул, независимо от порядка отрисовки интерфейса.
- Устранён потенциальный конфликт с новыми расовыми боевыми бонусами и импортированными билдами после смены расы. Старые билды остаются совместимы; пользовательские значения не перезаписываются при одних вычислениях.
- Добавлены тесты для всех 18 допустимых расовых навыков шести рас, чужих ID и импортированных строковых идентификаторов.


## 0.328.0 — 2026.11.03.328 · Расовые эффекты критов, восстановления ОМ и сопротивления заморозке

- По актуальным ID 900050003, 900030003, 900060003 добавлены расовые эффекты исходящего критического урона, сопротивления шансу получения крита и получаемого критического урона. Эффекты выбора расовой пассивки независимы от титулов Honor.
- «Всплеск магии» рапина 900060002 добавляет +18 к индексу скорости восстановления ОМ, не к максимальному ОМ; источник учитывается отдельно от снаряжения и гильдии.
- Исправлена неполная пассивка дворфа «Упрямое сердце» 900030001: +10 к заморозке (EP_IMMUNE_NUMB) наряду с +10 к оглушению и падению.
- Книга героя показывает расовый бонус к восстановлению ОМ в RU/EN и не пишет ложное «эффекты снаряжения не включены», если они уже вошли в итог.
- Добавлены тесты с точными исходными OS skill ID/EP/fv1/fv2 и сочетаниями с Honor; неопубликованные финальные боевые правила остаются PARTIAL.


## 0.327.0 — 2026.11.03.327 · Точность спереди, уклонение от дальних атак и время каста по Remaked

- Перенесены исходные компоненты Remaked Calc('ACC') Status_63 (точность спереди), Calc('EVARange') Status_67 (отдельное уклонение от дальних атак, в том числе +3 от титула 12) и Calc('CastSPD') Status_78 (базовое время каста 100%).
- Отдельные каналы вместо подмены общей точностью/уклонением/скоростью каста. Новые значения отражены в 43-показательной сводке и снабжены ограничениями относительно текущего OS.
- Исправлены RU/EN надписи заголовка результатов и сообщения о загрузке данных.
- Добавлены регрессии различий общего и позиционного показателя, зависимость от титула, независимость времени каста от ЛВК и отсутствие выдуманных значений при неполном контексте.
- Отдельные эффекты снаряжения, активное изменение времени каста и абсолютный игровой паритет требуют подтверждения и по-прежнему помечены PARTIAL.


## 0.326.0 — 2026.11.03.326 · Игровые эталоны ОЗ/ОМ и базовая дальность оружия с доказанной границей расчёта

- Найдены реальные игровые проверки HP/MP (13.10.2026) из Remaked; подтверждено floor-округление игрового клиента, в отличие от ties-to-even в публичном веб-калькуляторе.
- Регрессионные тесты: эльф-воин уровня 1, кольцо +1 ВЫН, клирик 45 с полным набором бонусов и Знаком жизни; дополнительно базовые параметры оружия, точности, защиты и сопротивления чарам.
- Базовая дальность оружия читается из официального OS range только для активного оружия, без ложного сложения бонусов от экипировки, навыков и верховой езды.
- Документирован реестр доказательств docs/GAME_CLIENT_VITALS_PROOFS.md и уточнён Issue #91. Полный паритет других формул не заявляется.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.325.0 — 2026.11.03.325 · Расширена книга результатов до 43 показателей с явными пропусками для неподтверждённых формул

- Расширена книга результатов до 43 показателей с явными пропусками для неподтверждённых формул.
- В матрице неизвестные показатели остаются «—»; это не заявление о полном соответствии серверным формулам.
- Браузерный приемочный тест и live Pages должны быть проверены отдельно.


## 0.324.0 — 2026.11.03.324 · Полнота ссылок и шансов получения идентичных предметов

- Объединённая карточка предмета сохраняет каждое самостоятельное событие получения: отдельные шансы добычи локации, группы, рецепты обмена NPC и исходные игровые ID.
- Обратные ссылки «Используется как материал» собираются по всем идентичным вариантам предмета, а не только по отображаемому каноническому ID.
- Никаких правок в исходных игровых данных или D1 не производилось.
- Добавлены регрессии, проверяющие разные шансы одной локации, разные рецепты одного NPC и материалы с разными исходными ID.



## 0.323.0 — 2026.11.03.323 · Очистка дублей монстров и оптимизация связей

- В энциклопедии `Гигантский питон` теперь показывается одной карточкой: подтверждённый исходными JSON ID `11205` с локацией `Лейбгольдские теснины` и восемью строками добычи; идентичная пустая запись `72006` становится алиасом для старых ссылок.
- Для всех монстров эквивалентность определяется по имени, полному набору игровых характеристик и добыче. Монстры без источников не создают вторые одинаковые карточки; если в разных картах используются одинаковые монстры с той же добычей — отображается одна карточка со всеми локациями. Варианты с действительно разной добычей сохраняются отдельно. Даже шесть одинаковых по игровым данным «Фонарщиков» объединены без удаления их исходных ID.
- Истинные серверные ID не удаляются из базовых `data/os/*.json`, Worker, D1 или калькулятора. Прямые ссылки на скрытые дубли открывают главную запись.
- Источники получения идентичных предметов суммируются из всех их игровых ID, чтобы визуальная дедупликация не скрывала монстров, сундуки или обмены.
- Подготовлен индекс совпадающих имён при построении энциклопедии: больше не требуется сканировать все записи при каждом открытии карточки.
- Добавлены регрессионные тесты реального гигантского питона, зомби-клонов, раздельных активных вариантов и дублирующихся предметов.
- Существующая система ручных правок Cloudflare D1 и админ-редактор не сбрасываются; редактирование монстра, возвращающее отличающиеся характеристики или новый источник, снова делает запись видимой.



## 0.322.0 — 2026.11.02.322 · D1-редактирование NPC и специальных локаций

- Добавлена поддержка `wikiedit.npc.astir-npc-...` и `wikiedit.map.astir-...` с авторизацией, строгими серверными типами и D1-override сохранением без записи несуществующих OS-ID.
- В админ-режиме двойной клик редактирует RU/EN имена и описания NPC и локаций, автоматически сохраняет при уходе с поля; отдельно доступны назначение NPC, координаты и выбор локации из четырёх районов Астира.
- Добавление нового NPC вручную через встроенную форму в соответствующем городском районе — без предположений о действующих персонажах игры.
- Внутренний граф энциклопедии перестраивается по D1-правкам: поиск, список NPC в каждой локации, карточка, обратная ссылка и просмотр изменений используют одни данные.
- Старые OS NPC и связи государств не меняются; виртуальные ID нельзя отправлять как игровые числовые ID. Ручные правки остаются отдельно от синхронизируемого снимка.
- Экспорт правок D1 → GitHub PR и просмотр административных изменений включают новые записи.
- Добавлены Node-тесты проверки Worker/D1, валидаторов и взаимных связей, браузерные сценарии редактирования в реальном UI.
- **Работа в production:** новый Worker-код требует фактического развёртывания; публикация Pages и D1 не означает, что Cloudflare уже принимает эти ключи.



## 0.321.0 — 2026.11.02.321 · Подтверждено написание Кларис / Claris

- Подтверждённое игроком английское имя **Claris** теперь отображается у NPC на Территории Королевства Астира в английском интерфейсе вместо русского написания.
- Поиск понимает «Кларис» и «Claris». Подписи NPC, список локации и ссылка из сундука получают имя из одной подтверждённой записи.
- Не добавлялись другие NPC, не менялись их местонахождение, игровые ID, обмены, Cloudflare Worker или D1.
- RU/EN и переходы проверяются отдельными Node и Chromium регрессиями.


## 0.320.0 — 2026.11.02.320 · Кларис на Территории Королевства; удаление неподтверждённых NPC

- Исправлено местонахождение мастера сундуков Кларис: район Королевства **города Астир**, не район Империи.
- Удалено неверное имя «Культье», неподтверждённые координаты K-11 и все NPC, не подтверждённые клиентом или актуальным серверным источником. Имена из старой японской вики больше не транслитерируются в RU/EN клиент наугад.
- Из 32 ранее добавленных городских NPC оставлена только Кларис; для Союза и Империи не показываются выдуманные списки.
- Ссылки сундуков, профиля NPC, прямые URL и локализация проверяются браузерными тестами. Серверные ID трёх государств и NPC обменов в D1 не тронуты.
- Примечание: предыдущий релиз 0.319 содержал ложные NPC-профили, и его список не следует использовать как источник игровых сведений.


## 0.319.0 — 2026.11.02.319 · NPC трёх районов Астира, Кларис и Культье, без лишних маршрутов и подмены государств

- Удалены непрошенные блоки «Маршрут из Астира» из энциклопедии и связанные мёртвые route-данные.
- Добавлены NPC для Территории Союза (11), Территории Империи (11, включая Кларис по игровому скриншоту) и Территории Королевства (10, включая Культье K-11).
- Названия, координаты и услуги NPC основаны на исторической вики Pandora Saga (последняя правка 2012) и на присланном игровом скриншоте. Это не выдается за актуальный полный OS-реестр: официальный /gamedata/trades.json публикует только NPC торговых обменов.
- NPC кликабельны, их карточки содержат доступные координаты и обратную ссылку в район; Кларис и Культье — отдельные персонажи, оба доступны из карточки сундуков.
- Записи трёх государств, исходные игровые ID, NPC обменов, D1 и Worker не переписывались.
- Регрессионные и браузерные проверки покрывают географическую изоляцию, NPC, сундуки, ссылки и отсутствие маршрутов.


## 0.318.0 — 2026.11.02.318 · Исправлены независимые государственные локации и районы Астира, оригинальные NPC-привязки и маршруты сундуков

- Восстановлены исходные государственные ID в trade mapNames (`1002001`, `1003001`, `1004001`), без миграции NPC и изменений действующих NPC-обменов.
- Четыре района Астира представлены отдельно от государств (центральная площадь с исходным ID и три UI-псевдолокации с постоянными ссылками).
- Маршруты связывают районы Астира, дороги и конечные государственные локации. Сундуки Культье ссылаются только на территорию Королевства города Астир.
- Старые некорректные подписи в активном D1 нормализуются только в отображаемом индексе — без порчи опубликованного снимка, NPC или их локаций.
- Регрессии проверяют изоляцию ID, NPC, поиск, ссылки, локализацию, сохранение и переходы.
- Публикацию Pages, Worker и браузерное тестирование проверять отдельно.


## 0.317.0 — 2026.11.02.317 · Районы Астира и маршруты к нациям, расчёт Пламени Феникса, самостоятельные фильтры предметов эффектов, души и данные монстров

- Районы Астира и маршруты к нациям, расчёт Пламени Феникса, самостоятельные фильтры предметов эффектов, души и данные монстров
- Результат «Пламени Феникса» — расчёт до сопротивлений цели, без неподтверждённого серверного округления.
- Отсутствующие сведения о месте появления и добыче монстров отображаются прочерком, а не выдуманными значениями.
- Проверка реального развёртывания GitHub Pages и рабочего Cloudflare Worker требуется отдельно.


## 0.316.0 — 2026.11.02.316 · Астир, компактные души, стихийное оружие и раздельные эффекты расходников

- Уточнение: Культье находится в Астире, на территории Королевства, а не в отдельном городе Сэнт-Фальстайн. Четыре городских района связаны в энциклопедии.
- Свойства души: компактная единая карточка слотов и каталожной цены, без дублирующих старых CSS-правил.
- Для Пламени феникса осталась одна тематическая подсказка; системный браузерный title убран.
- Экипировка: фильтр «Стихийное оружие» с выбором стихии и отдельная категория «Предметы эффектов» для лечения состояний и применения умений.
- Книга героя: эффекты зелий показывают расходники ОЗ/ОМ; снятие состояний и активация навыков относятся к эффектам умений, естественное восстановление к результатам расчёта.
- Для надетого оружия с огненным самоцветом от +7 и корректной доступностью игроку в Книге героя и слоте показываются подтверждённые условные эффекты (включая Пламя феникса); числовой урон этих срабатываний не моделируется без подтверждённых серверных формул.
- Полная сборка, Chromium и GitHub Pages проверяются отдельно от фактического развёртывания Cloudflare Worker.


## 0.315.0 — 2026.11.02.315 · Огненные бонусы от +7, мастер сундуков и территории держав

- Бонусы предметов выравниваются справа; сопротивляемость ожогам и временные характеристики корректно показывают процентный знак.
- 14 огненных оружий отображают условные свойства закалки от +7 на основе фактических описаний: шанс ожога, Пламя феникса, его расчётный параметр СИЛ/ИНТ и ограничения; в игроматематику эти условия не добавляются без проверенной реализации.
- К сундукам локаций добавлены ключ и мастер сундуков Культье в Вастире (королевская территория).
- Локации Союза, Королевства и Империи вынесены в начало списка с поисковыми синонимами, опираясь на mapNames NPC каталога.
- Красный, зелёный и синий сундуки: отображение подтверждённых категорий, без вымышленных наград и процентов; их ID отсутствуют в текущем /gamedata/chests.json.
- Проверки в CI, Chromium и развёртывание GitHub Pages проверяются отдельно от Worker.


## 0.314.0 — 2026.11.02.314 · Сундуки локаций, игровые сокращения характеристик, обзор правок и обновлённый редактор

- Сундуки локаций, игровые сокращения характеристик, обзор правок и обновлённый редактор.
- Впервые показаны 12 подтверждённых NPC-сундуков локаций из уже существующего D1 без импорта несуществующих таблиц.
- Применены игровые сокращения ПРВ, ЛВК, СИЛ и др.; показаны исходное и изменённое значения административных правок.
- Предотвращение автозаполнения основано на текстовых элементах без полей учётных данных; расширения браузера могут вести себя независимо.
- Fixed Soul catalog price is not claimed to be NPC buyback or player-market value.
- Browser acceptance and deployed Pages and Worker state must be verified separately.


## 0.313.0 — 2026.11.02.313 · Инлайн-редактирование энциклопедии, понятные бонусы, источники душ, связи NPC и явная перезапись билдов

- Инлайн-редактирование энциклопедии, понятные бонусы, источники душ, связи NPC и явная перезапись билдов.
- Игровые шансы, отсутствующие в проверенном источнике, не подменяются предположениями.
- Для записи новых полей навыков требуется развёрнутый Worker с актуальной валидацией.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.312.0 — 2026.11.02.312 · Редактор игровых эффектов непосредственно в энциклопедии, сохранение переносов и пустых описаний, удаление устаревшего модального редактора

- Редактор игровых эффектов непосредственно в энциклопедии, сохранение переносов и пустых описаний, удаление устаревшего модального редактора
- Единая основная ветка; тестовые изменения из старой NPC-ветки перенесены с удалением временной ветки после merge.
- Авторизованные правки хранятся отдельно от игрового каталога; для новых маршрутов требуется развёртывание актуального Cloudflare Worker.


## 0.311.0 — 2026.11.02.311 · Встроенное редактирование монстров, локаций, подземелий, навыков, душ, дропа и сундуков; защита полей от автозаполнения и PR-экспорт ручных правок

- Встроенное редактирование монстров, локаций, подземелий, навыков, душ, дропа и сундуков; защита полей от автозаполнения и PR-экспорт ручных правок
- Технические игровые данные сохраняются отдельно от опубликованных OS-снимков, без автоматического изменения production D1 при обновлении сайта.
- Browser acceptance and deployed Pages/Worker state must be verified separately.


## 0.310.0 — 2026.11.02.310 · Встроенное редактирование энциклопедии: параметры и классы предметов, источники NPC/монстров и обмены без модальных окон

- Встроенное редактирование энциклопедии: параметры и классы предметов, источники NPC/монстров и обмены без модальных окон
- Ручные изменения сохраняются отдельно от исходного игрового каталога; авторизация обязательна.
- Browser acceptance and deployed Pages/Worker state must be verified separately.


## 0.309.0 — 2026.11.02.309 · Visual ownership editing and encyclopedia search isolation

- Racial passive names and encyclopedia item/skill names and descriptions expose explicit, separately clickable editor buttons in the game's theme.
- The existing structured equipment editor now also changes the item's RU title and description alongside attack/armor, allowed classes and effects. Updates are stored as separate owner overrides and survive base catalog refreshes.
- Prior inline text overrides remain compatible. Structured item fields use deterministic precedence over older inline edits.
- The encyclopedia's search inputs are protected against unwanted username autofill before user focus; keyboard and pointer navigation remains supported.
- Worker validates item title and description sizes; added relevant regression checks. No account changes, data migration or formula changes.



## 0.308.0 — 2026.11.02.308 · Graphical catalog comparison for nontechnical administrators

- The authenticated catalog comparison now uses a responsive dashboard with four numeric summaries and six selectable filters for record kinds and owner approval state.
- Clearly distinguish **accept entire section** from **accept only the visible/filter-matched records**, preventing accidental acceptance of unrelated hidden changes.
- Make source fields such as name, description, attack, penetration, defense, class access and effects readable in the before/after preview.
- Keep default-deny selection, immutable source checks and explicit separate D1/GitHub writes.
- Expanded interactive browser checks for filters, zero-results and safe approval actions.



## 0.307.0 — 2026.11.02.307 · Owner equipment editor and existing-project Cloudflare instructions

- Replace first-install D1 migration/setup instructions with a precise existing-Worker guide for adding a fine-grained GitHub token as Cloudflare Secret. No D1 recreation.
- Add visual owner item editing in encyclopedia: numerical attributes, allowed classes, effect rows and a separately labeled acquisition note. Save only changed fields to independent D1 owner overrides; none overwrite source snapshots during future sync.
- Enable RU item/skill name and description double-click, including race passive titles; synchronize owner changes in hero calculations and encyclopedia.
- Distinguish an administrator-provided acquisition note from actual loot or NPC trade data. Source graphs and exchange recipes are not yet modified by the new editor.
- Prevent password-manager autofill targeting the encyclopedia search using explicit search field identity and ignore hints.
- Add server-side structured payload validation, XSS-safe DOM form, undo compatibility and regression tests.



## 0.306.0 — 2026.11.02.306 · Direct GitHub PR from published catalog; isolated D1 diagnostic

- Authenticated administrator can create a GitHub PR directly from the current published catalog with no browser-held GitHub credentials. Worker accepts one fixed repository and 17 game data paths, creates a separate branch, and never merges automatically.
- GitHub integration requires optional Cloudflare Secret `GITHUB_CATALOG_TOKEN`, with selected-repository Contents/PR permissions. Disabled safely until configured.
- Source baseline and active D1 snapshot are both checked again before PR branch creation. Repeated clicks reuse an existing PR for the same snapshot.
- One-click administrator D1 write/read/delete verification uses a disposable unreferenced catalog entry. It does not modify active data or player accounts.
- New isolated tests cover authorization, D1 reconstruction, scoped PR creation and temporary data writes.
- Real external GitHub mutation and live production D1 admin diagnostic need owner-side credentials; tests simulate those operations without secrets.



## 0.305.0 — 2026.11.02.305 · Reviewed catalog update safety for GitHub

- Rename the downloaded administrator-approved catalog artifact to `pandora-studio-reviewed-catalog.json`; existing export format remains supported for backward compatibility.
- Name the import bridge `apply-reviewed-pandora-catalog.mjs`, retaining the stable `npm run catalog:review` command.
- Before `--write`, detect uncommitted changes under `data/os/` and stop rather than silently overwriting a developer's source edits.
- Prepare all changes to temporary same-directory files, then commit replacements and restore already replaced originals if an ordinary filesystem error occurs. Dry run still never modifies data.
- No Cloudflare database writes or player-account changes.



## 0.304.0 — 2026.11.02.304 · Safe game-catalog review and neutral project copy

- Removed direct source-server branding from maintained documentation and runtime copy. All technical game-data URLs, stable IDs and D1 datasets remain unchanged.
- Simplified admin controls to **Игровой каталог → Проверить обновления игрового каталога → Применить выбранные изменения**.
- Reject mixed remote revisions by rechecking metadata after 17 source downloads. Authorised source proxy is covered by new allowlist/credential tests.
- Administrator 401 cannot sign out an independent player account. Decisions are locked during publishing. A successful D1 publication is never misreported as rolled back if UI reload fails.
- Replaced an obsolete Cloudflare import procedure with the actual interactive selective-review instructions. No production database writes were performed.



## 0.303.0 — 2026.11.02.303 · D1 Legacy translation isolation

- Fixed a hidden cross-data overwrite risk: accepting new current game server items, skills or tables must not regenerate the published D1 `legacyLocale` namespace from the local GitHub archive.
- Read the current D1 locale under the same catalog snapshot lease, reject incomplete/duplicate records and copy exact existing keys, text and provenance into the new snapshot.
- Extend unit and interactive Chromium admin sync checks; no production D1 write, user-build mutation or speculative combat formulas.



## 0.302.0 — 2026.11.02.302 · Pandora Studio modules named and dependency links audited

- Pandora Studio modules named and dependency links audited
- 27 root/Worker runtime source files renamed and all 588 tracked references rewritten across 170 files; complete Node/Chromium regression verified on feature branch.
- Added persistent runtime dependency audit, architecture/operator documentation and explicit metadata approval during selective OS synchronization.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.301.0 — 2026.11.02.301 · current game server admin review and safe source refresh

- Admin can review every detected game-record change, choose individual changes or full sections, search by source ID/name and approve nothing by default. Interdependent formula, trade and instance structures are accepted as atomic groups.
- A dedicated OS workbench module and stylesheet replace the large inline admin editor workflow. Source utilities now have descriptive current game server file names; loader and test references are updated.
- Curated versions recompute source/translation counts and do not inherit misleading official CSV hashes. New D1 publish requests use a server-side atomic expected-active lease to reject stale admin decisions.
- The review can be downloaded as a GitHub-ready JSON snapshot, then applied to checked-in OS source files through a validated, dry-run-first CLI. GitHub and Cloudflare are never silently cross-written.
- Official game formula verification, Worker production deployment and authenticated D1 lifecycle acceptance remain separately tracked. No automatic changes to player builds, 1–55 planning or Encouragement +9.



## 0.300.0 — 2026.11.02.300 · Clean item names, physical attack forge notation and left-aligned eligibility

- Remove synthesized elemental prefixes/suffixes in equipment names. The canonical RU/EN item name retains its +grade; the chosen element appears in its own field.
- For a physically refined weapon, show the OS weaponPlus-derived Attack base+increment, e.g. W 53 at +4 shows 53+12, not 53+4. Magical gems and missing tables do not fabricate a physical attack bonus.
- Race/gender suitability chips now align from the left. Hover and editor share weaponPlus data; tests verify all 10 weapon tiers and both gem types.
- Do not alter Remaked defense rounding, HP/MP, Encouragement at Blessing 90 (+9), saved builds, level-55 planning or D1. Full live OS calculator parity remains unconfirmed.

## 0.299.0 — 2026.11.02.299 · Faithful Remaked buffs, elemental refinement and OS resistance audit

- Restore **Ободрение / Battle Prayer** (OS skill 320012001) to Hero Book priest enhancements. Selectable and tracked as an effect, with the preserved Remaked blessing-based +STR/+AGI/+INT computation, source identity and mastery 61 validation. Existing priest settings (SD 134 / Blessing 90 / Hymns 30) remain editable.
- Equipped gear names now include the selected elemental word and refinement grade like the supplied game screenshots. Physical/magical gem type is selectable only for weapons; armor and shield choose only an element. Old saved armor type values normalize without changing their elemental effect.
- Item hover shows the client-style base+grade notation (e.g. 31+4 for +4 armor); the separate total-defense calculator retains Remaked floor(grade*1.5) contribution until verified against live OS behavior.
- Audit structured elemental and status resistances across the entire checked-in OS item and Soul catalogs at **all 11 refinement grades** and official Forth snapshots. Only effectively socketed and equipped effects participate.
- Add six source-backed, explicitly opt-in resistance skill effects with RU/EN labels (including incoming enemy resistance debuffs and negative values), plus a selected-skill breakdown. Spell effects are never treated as permanent without activation.
- Existing Node.js and Chromium workflows reused. Some conditional skills, server-side damage interactions, and modern OS effects still require verification; no D1 mutation.


## 0.298.0 — 2026.11.02.298 · Style skill buffs and remove abandoned UI code

- Skill-effect rows now have compact, aligned game-styled icon, name and numeric-effect columns matching the Hero Book's dark/gold visual language.
- Remove unused old skill-search CSS, abandoned optional Proelium-section structure, and redundant removed Soul-item card styling. Keep the shared main stylesheet under its size budget.
- Update focused source assertions for the simplified buff section and new skill-effect rows. No new test runner or external dependencies.


## 0.297.0 — 2026.11.02.297 · Skill-effect songs and exact gear armor notation

- Hero Book song effects now appear in the Skill effects chapter rather than the Buffs configuration chapter. The OS class/mastery checks and never-assume-song-activation policy remain unchanged.
- Equipped armor hover shows the requested compact base+refinement format, such as 11+3 and 13+6, matching the calculator's existing per-piece refinement rule.
- Added one focused regression test for the song chapter association and updated item-preview acceptance assertions. This is a source release; live server parity is not implied.


## 0.296.0 — 2026.11.02.296 · Priest defaults, equipped detail and Remaked-style Hero Book

- Fresh heroes now start with an enabled external priest and editable SD 134, Blessing 90, Hymns 30. Saved and shared build values take precedence, including explicit disabled settings; older snapshots inherit missing defaults.
- Current OS items, skills and English names did not confirm the historical Proelium effect. Hide its controls and exclude it from active stat calculations while retaining previous saved keys for compatibility.
- Hovering an equipped item now shows its actual socketed Souls and their descriptions, per-item base armor plus refinement, refinement rank and clearer race/gender restrictions, rather than only the generic item catalog record.
- Hero Book has six Remaked-style chapters: Results, Attack, Defense, Buffs, Skill effects, Potion effects. Remove redundant equipped-item cards and the all-skills inspector; move skill recovery previews and selected active-skill summaries into Skill effects, and potion effectiveness into Potion effects.
- Split tooltip styling into a dedicated stylesheet to retain the main CSS size budget, and add or adjust source and browser regressions without introducing redundant test runners.
- Automated checks do not prove every modern current game server server calculation; level planning remains 1 through 55.


## 0.295.0 — 2026.11.02.295 · Show only effectively available priest buffs

- The Hero Book active-buff counter excludes selected but unavailable priest skills when Blessing rank is below their source requirement (8 for Velox, 12 for Lapis Medio).
- Existing selections remain stored and can become effective again when the required mastery is restored.
- Add a direct, parameterized test of the exact counter expression for enabled/disabled priest, threshold ranks and automatic guild overrides. No extra test runner.


## 0.294.0 — 2026.11.02.294 · Sync guild effects across Origin and Hero Book

- Both Origin and Hero Book show identical level-derived guild HP/MP and regeneration ranks when guild auto-passives are selected; manual Origin selectors are visibly disabled with localized explanation instead of showing misleading stale ranks.
- Manual guild selections are preserved and restored when changing the guild level back to zero; change handlers reject conflicting writes while automatic guild ranks are active.
- Add one in-memory UI regression test for synchronized display, disabled selectors, blocked conflicting changes and restoration of manual values; no extra browser runner.
- Player planner still supports level 1–55. Browser and Worker acceptance require separate CI verification.


## 0.293.0 — 2026.11.02.293 · Source-backed alchemy names and cleaner Hero Book

- Corrected the priest Hymns field and the current OS alchemy skills: Яд/Toxify and Усиление яда/Toxic Aura, preserving matching RU/EN source identities.
- Removed dead pre-Remaked translation aliases and a redundant book locale declaration. Shortened player-facing guild/priest notes without changing the distinction between applied and preview-only bonuses.
- One parameterized regression test covers eight meaningful external-priest combat cases, including below/at mastery thresholds, disabled buffs and malformed values.
- Browser deployment and live Worker readiness require independent checks.


## 0.292.0 — 2026.11.02.292 · Remaked RU/EN buffs and priest mastery safety

- Hero Book uses the Remaked-approved Russian skill identities for attack/defense signs, group protection, Holy Weapon, Dark Aura, enchantment and hymns, with their corresponding English client names.
- External priest's attack speed and defense signs require Blessing mastery 8 and 12, respectively, matching current OS skill records; disabled selections do not affect the calculation.
- Invalid external priest values from older or damaged local saves cannot grant combat bonuses or crash the preview; the enhancement counter excludes mastery input fields and inactive selections.
- Added regression assertions for source-backed prerequisites and official names. Deployed browser/Worker state requires independent verification.


## 0.291.0 — 2026.11.02.291 · Live OS sync, priest and guild inputs, compact profile and resistances

- Fixed OS source verification: public `/gamedata/*.json` works. Compared 17 datasets by source IDs. Reconciled 10 changed monsters and 5 changed drop entries; live OS added `slotAdd:1` to five drop items but probabilities did not change. Updated source meta hashes.
- Logged-in profile loses the unexplained decorative star; neutral sign-out button. Monster resistances fit five columns / two rows on desktop, with responsive mobile wrapping.
- Hero Book adds an external priest profile (SPR/SD, Blessing, Hymn) and optional application of verified Remaked Gratia attack-speed and Lapis Medio defense formulas. Other priest effects are explicitly read-only previews.
- Guild levels 1–12 automatically configure the currently supported HP/MP and regeneration passives from Remaked; level 0 retains manual buff selection. Guild physical/magic damage reductions and experience unlocks display but are not fabricated into an unsupported combat formula; honor titles retain single selection.
- In a safe read-only bridge, D1-backed encyclopedia can adopt only audited changed monster/drop fields from checked-in verified source when its D1 source hashes match the known older version. This is not a D1 write or complete data import.
- Live chest composition remains unchanged in publicly exposed `chests.json`; unavailable location-chest odds are not invented. Planning cap remains 55.


## 0.290.0 — 2026.11.02.290 · Профиль, игровые подсказки, книга героя и перевод заданий

- Компактная авторизованная карточка профиля; смена пароля не показывается до раскрытия соответствующего раздела.
- Предметы, души и сундуки в связях Энциклопедии используют общую игровую подсказку при наведении или фокусе, закрывающуюся при уходе указателя, Escape и нажатии вне элемента.
- Сопротивления монстров постоянно видны в виде компактных тематических карточек без дополнительных раскрытий.
- Шесть архивных сценариев заданий получили перевод на русский с сохранением исходного английского текста. При загрузке из D1 локализация присоединяется только к неизменившемуся оригинальному описанию.
- Книга героя: расчётные показатели сгруппированы с быстрыми переходами между главами, показано количество выбранных настроек усилений, дополнительные параметры скрыты до запроса.
- Проведён read-only аудит: опубликованная D1 meta совпадает по исходным отпечаткам с репозиторием; внешний актуального игрового сервера /gamedata/ отвечает 403; новые шансы дропа и составы неизвестных сундуков не подтверждены и не импортированы.
- Манифест оригинальных игровых иконок: 1173 из 1437 уникальных; 264 отсутствуют или недоступны в прежних попытках. Не выдаём их за полное покрытие.
- Геймплейные формулы, архивные таблицы дропа, права и содержимое D1 не изменялись.


## 0.289.0 — 2026.11.02.289 · Чистые классы, переходы между сундуками, добыча и пароль от 8 символов

- Исправлен переход между уровнями наградных шкатулок: ссылки открывают карточки сундуков с содержимым, а не обычные карточки предметов.
- Поддерживаются 52 подтверждённые записи контейнеров в каталоге предметов, включая сундуки Мальдии, трёх цветов и других местностей; неизвестные шансы не выдумываются.
- Доступные классы всегда показаны единым компактным рядом без раскрывающейся панели.
- NPC-обмен и выпадение вещей с монстров представлены компактными адаптивными карточками, с сохранением источников и точных вероятностей.
- Сценарии заданий в подземельях отличены от обычных локаций, сведения о монстрах дополнены уровнем, ОЗ и числом записей добычи.
- Минимальная длина пароля для регистрации, смены и восстановления снижена до восьми символов в клиенте и Cloudflare Worker; для вступления серверного изменения в силу требуется публикация Worker.
- Добавлены проверки соответствующих маршрутов и данных. Изменений игровых формул или таблиц выпадения нет.


## 0.288.0 — 2026.11.02.288 · Чистая навигация без внутренних дублей; интерактивные требования, источники душ и раскрываемые награды шкатулок, включая 60-й уровень

- Удалены дублирующие вкладки из полноэкранного окна; верхняя навигация видна только в основном редакторе.
- Требования навыков представлены компактными индикаторами веток и вложенных очков.
- Источники душ и предметов, связи NPC и локаций показываются в адаптивных кликабельных плашках.
- Содержимое шкатулок сгруппировано в раскрывающиеся карточки с иконками и точными количествами и шансами.
- Наградные серии по уровням 5–60 получают сведения о направлении класса и уровне, шкатулки 60 уровня доступны без вымышленных таблиц добычи.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.287.0 — 2026.11.02.287 · Энциклопедия: поиск только по именам, список/сетка во всех разделах, классы и расовые комплекты, очистка дублей и описаний

- Энциклопедия: поиск только по именам, список/сетка во всех разделах, классы и расовые комплекты, очистка дублей и описаний.
- Скрыты лишь подтверждённые копии и внутренние варианты навыков, оригинальные каталожные записи сохранены.
- Browser acceptance and deployed Pages state must be verified separately.


## 0.286.0 — 2026.11.02.286 · Компактные подписи «Все классы» и раскрываемые классовые ограничения для предметов и навыков, без дублирования интерфейса

- Компактные подписи «Все классы» и раскрываемые классовые ограничения для предметов и навыков, без дублирования интерфейса
- Browser acceptance and deployed Pages state must be verified separately.


## 0.285.0 — 2026.11.02.285 · Вложенные поиски NPC-обменов и монстров поддерживают слова в любом порядке; проверен поиск по реальному английскому игровому описанию

- Вложенные поиски NPC-обменов и монстров поддерживают слова в любом порядке; проверен поиск по реальному английскому игровому описанию
- Browser acceptance and deployed Pages state must be verified separately.


## 0.284.0 — 2026.11.02.284 · В Энциклопедии заработал поиск по официальным EN-описаниям; имена классов и веток берутся из игровых RU/EN справочников без вывода кодов

- В Энциклопедии заработал поиск по официальным EN-описаниям; имена классов и веток берутся из игровых RU/EN справочников без вывода кодов
- Browser acceptance and deployed Pages state must be verified separately.


## 0.283.0 — 2026.11.02.283 · Объединён вывод источников предметов и душ, разделена пагинация получения и обмена, русские и английские подписи стали согласованными

- Объединён вывод источников предметов и душ, разделена пагинация получения и обмена, русские и английские подписи стали согласованными
- Browser acceptance and deployed Pages state must be verified separately.


## 0.282.0 — 2026.11.02.282 · Фильтры экипировки по совместимости сейчас/до 55 уровня, защищённые глубокие ссылки, кеш названий Энциклопедии

- Фильтры экипировки по совместимости сейчас/до 55 уровня, защищённые глубокие ссылки, кеш названий Энциклопедии
- Browser acceptance and deployed Pages state must be verified separately.


## 0.281.0 — 2026.11.02.281 · Исправлена перерисовка подтверждения нового билда: фоновая синхронизация не стирает выбор и введённое имя черновика

- Исправлена перерисовка подтверждения нового билда: фоновая синхронизация не стирает выбор и введённое имя черновика
- Browser acceptance and deployed Pages state must be verified separately.


## 0.280.0 — 2026.11.02.280 · Глубокие ссылки на материалы и зелья автоматически раскрывают их в каталоге Энциклопедии, даже если включён фильтр экипировки

- Глубокие ссылки на материалы и зелья автоматически раскрывают их в каталоге Энциклопедии, даже если включён фильтр экипировки
- Browser acceptance and deployed Pages state must be verified separately.


## 0.279.0 — 2026.11.02.279 · Убрана избыточная ссылка «Персонаж» из шапки: редактор открыт по умолчанию, возврат из Энциклопедии — через закрытие окна

- Убрана избыточная ссылка «Персонаж» из шапки: редактор открыт по умолчанию, возврат из Энциклопедии — через закрытие окна
- Browser acceptance and deployed Pages state must be verified separately.


## 0.278.0 — 2026.11.02.278 · Карточки предметов и подсказки показывают подтверждённые расовые и половые ограничения, включая исключение для кролля

- Карточки предметов и подсказки показывают подтверждённые расовые и половые ограничения, включая исключение для кролля
- Browser acceptance and deployed Pages state must be verified separately.


## 0.277.0 — 2026.11.02.277 · Удалены неиспользуемые стили старого каталога и его дублирующих карточек, оставлены новые стили Энциклопедии

- Удалены неиспользуемые стили старого каталога и его дублирующих карточек, оставлены новые стили Энциклопедии
- Browser acceptance and deployed Pages state must be verified separately.


## 0.276.0 — 2026.11.02.276 · Удалён дублирующий каталог предметов и устаревшее состояние; старые ссылки на каталог открывают Энциклопедию

- Удалён дублирующий каталог предметов и устаревшее состояние; старые ссылки на каталог открывают Энциклопедию
- Browser acceptance and deployed Pages state must be verified separately.


## 0.275.0 — 2026.11.02.275 · Описания предметов переразмечены по игровым скриншотам: история, параметры, заточка, условия и эффекты; унифицированы названия брони и штанов

- Описания предметов переразмечены по игровым скриншотам: история, параметры, заточка, условия и эффекты; унифицированы названия брони и штанов
- Browser acceptance and deployed Pages state must be verified separately.


## 0.274.0 — 2026.11.02.274 · Расовые комплекты всех шести рас, свобода экипировки кролля, Энциклопедия вместо старого каталога и фильтры экипировки

- Расовые комплекты всех шести рас, свобода экипировки кролля, Энциклопедия вместо старого каталога и фильтры экипировки
- Browser acceptance and deployed Pages state must be verified separately.


## 0.273.0 — 2026.11.01.273 · Английские имена NPC, поселений и сундуков привязаны к официальным локализациям; описания сундуков показываются из игрового каталога, поиск больше не индексирует скрытые ID

- Английские имена NPC, поселений и сундуков привязаны к официальным локализациям; описания сундуков показываются из игрового каталога, поиск больше не индексирует скрытые ID
- Browser acceptance and deployed Pages state must be verified separately.


## 0.272.0 — 2026.11.01.272 · Устранены устаревшие и конфликтующие CSS-определения Энциклопедии, объединены сетка монстров, иконки и переносы описаний

- Устранены устаревшие и конфликтующие CSS-определения Энциклопедии, объединены сетка монстров, иконки и переносы описаний
- Browser acceptance and deployed Pages state must be verified separately.


## 0.271.0 — 2026.11.01.271 · Энциклопедия проверяет целостность ссылок между предметами, монстрами, NPC, локациями, обменами и сундуками до публикации данных

- Энциклопедия проверяет целостность ссылок между предметами, монстрами, NPC, локациями, обменами и сундуками до публикации данных
- Browser acceptance and deployed Pages state must be verified separately.


## 0.270.0 — 2026.11.01.270 · Локализованы параметры монстров, классы и NPC-обмены; убран технический поиск по ID и повторная переменная; выровнена проверка D1

- Локализованы параметры монстров, классы и NPC-обмены; убран технический поиск по ID и повторная переменная; выровнена проверка D1
- Browser acceptance and deployed Pages state must be verified separately.


## 0.269.0 — 2026.11.01.269 · Общие RU/EN названия слотов душ, замена битых картинок Энциклопедии нейтральными значками и аудит английских описаний

- Общие RU/EN названия слотов душ, замена битых картинок Энциклопедии нейтральными значками и аудит английских описаний
- Browser acceptance and deployed Pages state must be verified separately.


## 0.268.0 — 2026.11.01.268 · RU/EN переносы игровых эффектов объединены для Энциклопедии и Книги героя; отсутствующие изображения заменены нейтральными значками разделов

- RU/EN переносы игровых эффектов объединены для Энциклопедии и Книги героя; отсутствующие изображения заменены нейтральными значками разделов
- Browser acceptance and deployed Pages state must be verified separately.


## 0.267.0 — 2026.11.01.267 · Исправлена совместимость полов и рас у всех известных именных комплектов, доработаны переносы описаний и убраны публичные упоминания ID в поиске

- Исправлена совместимость полов и рас у всех известных именных комплектов, доработаны переносы описаний и убраны публичные упоминания ID в поиске
- Browser acceptance and deployed Pages state must be verified separately.


## 0.266.0 — 2026.11.01.266 · Убрана двойная перерисовка Энциклопедии, поиск сбрасывается при смене раздела, ошибка загрузки не зависает

- Убрана двойная перерисовка Энциклопедии, поиск сбрасывается при смене раздела, ошибка загрузки не зависает
- Browser acceptance and deployed Pages state must be verified separately.


## 0.265.0 — 2026.11.01.265 · Исправлено перекрытие глобального каталога классов локальным справочником Энциклопедии, возвращены русские имена доступных классов

- Исправлено перекрытие глобального каталога классов локальным справочником Энциклопедии, возвращены русские имена доступных классов
- Browser acceptance and deployed Pages state must be verified separately.


## 0.264.0 — 2026.11.01.264 · Стабилизирована навигация по Энциклопедии: выбранная запись видна даже за пределами первой страницы, доступность и сохранение прокрутки

- Стабилизирована навигация по Энциклопедии: выбранная запись видна даже за пределами первой страницы, доступность и сохранение прокрутки
- Browser acceptance and deployed Pages state must be verified separately.


## 0.263.0 — 2026.11.01.263 · Унифицированы каталоги всех разделов Энциклопедии и поиск по монстрам и NPC без повторного построения списков и расхождений ID

- Унифицированы каталоги всех разделов Энциклопедии и поиск по монстрам и NPC без повторного построения списков и расхождений ID
- Browser acceptance and deployed Pages state must be verified separately.


## 0.262.0 — 2026.11.01.262 · Расширены игровые карточки Энциклопедии: характеристики предметов и навыков, доступные классы, все NPC-обмены и постраничная загрузка источников

- Расширены игровые карточки Энциклопедии: характеристики предметов и навыков, доступные классы, все NPC-обмены и постраничная загрузка источников
- Browser acceptance and deployed Pages state must be verified separately.


## 0.261.0 — 2026.11.01.261 · Улучшены поиск и связи Энциклопедии: описания, локации, ингредиенты обмена NPC, источники добычи, требования навыков и RU/EN навигация

- Улучшены поиск и связи Энциклопедии: описания, локации, ингредиенты обмена NPC, источники добычи, требования навыков и RU/EN навигация
- Browser acceptance and deployed Pages state must be verified separately.


## 0.260.0 — 2026.11.01.260 · Безопасная проверка уровня навыков

- Уровни и дополнительные требования навыков больше не преобразуют пустые значения, массивы, логические значения и экспоненциальные строки в фиктивные целые уровни.
- Сохранены реальные игровые требования, включая нулевые исходные значения и планирование до 55 уровня; для старых данных оставлена поддержка корректных десятичных строк.
- Дополнены существующие регрессионные тесты без нового тестового файла; исходный каталог, D1, очки и эффекты не изменялись.


## 0.259.0 — 2026.11.01.259 · Общая проверка профессии для каталога и дерева умений

- Убраны несовпадающие условия доступа по профессии в ветках, галерее и зависимостях: используется единая проверка официально разрешённой профессии. Значения `false`, `"false"` и другие некорректные варианты не дают ложную доступность.
- Сохранён исходный каталог, порядок умений, будущие уровни 50–55, билд-сохранения и расчётные формулы. Дополнены существующие тесты без создания отдельного тестового файла.


## 0.258.0 — 2026.11.01.258 · Единые пороги навыков без ложных разблокировок

- «Путь героя» больше не считает умение доступным, если у записи отсутствует разрешённая профессия; вместо выдуманного доступа выводится корректная блокировка.
- Точность проверки требования мастерства согласована с засечками: массивы, объекты, экспоненциальные строки и небезопасные числа не превращаются в игровые пороги. Обычные числовые строки совместимы.
- Недоступные пороги одного и того же навыка больше не появляются повторно при дублированных исходных требованиях. Добавлены регрессионные тесты по игровому каталогу OS.


## 0.257.0 — 2026.11.01.257 · Защита бюджета от некорректных типов в сохранениях

- Вложенные очки и мастерство больше не вычисляются из логических значений, массивов и объектов: `true` и `[5]` не становятся фиктивными `1` и `5` очками.
- Числовые значения и обычные строковые числовые значения старых билдов остаются совместимыми. Для предотвращения переполнений учитываются только безопасные целые числа.
- Добавлены тесты бюджета, мастерства, условий изучения и молитвенного мастерства на повреждённых сохранениях. Игровые таблицы, D1 и авторские сохранения не переписываются.


## 0.256.0 — 2026.11.01.256 · Оптимизированы тесты без потери проверки аккаунтов и билдов

- Chromium больше не запускает все независимые браузерные сценарии последовательно: до трёх изолированных контекстов проверяются параллельно. Аудит 4K/мобильной адаптивности остаётся отдельно во избежание избыточной нагрузки.
- Добавлены ускоренный локальный запуск `npm run test:quick`, короткий браузерный `npm run test:browser:quick` и последовательная отладка `npm run test:browser:serial`. Полные CI-тесты сохранены.
- Добавлены тесты ограничителя конкурентности, строгого порядка при последовательном запуске и безопасного завершения при ошибках. Список игровых формул, облачная база и логика сохранений не менялись.


## 0.255.0 — 2026.11.01.255 · Снимок каталога умений и реальный браузерный тест старых билдов

- Список навыков кэшируется по идентичности каталога и используется «Путём героя» и галереей без повторного построения массива при каждом рендере. Смена языка автоматически создаёт отдельный снимок.
- Добавлен Chromium-сценарий старого сохранения с очками Slash при лимите профессии 0: отображение сохранённых 12/0, частичный возврат до 8/0 и проверка после перезагрузки.
- Добавлены unit-тесты порядка, инвалидирования кэша при смене каталога и отсутствия изменений исходных записей.


## 0.254.0 — 2026.11.01.254 · Холостые изменения ползунка не вызывают повторные сохранения

- При движении ползунка в уже достигнутый лимит класса больше не перезаписывается тот же самый черновик и не перерисовывается виджет бюджета на каждый повторный input.
- Настоящее распределение, возврат очков и смена выбранной ветки продолжают сохраняться сразу. Событие завершения ввода по-прежнему пересобирает интерфейс и возвращает фокус.
- Добавлены тесты реального обработчика приложения на повторные/ограниченные/некорректные значения и фиксацию изменений без потери данных.


## 0.253.0 — 2026.11.01.253 · Индексация навыков по веткам и видимые очки при лимите 0

- «Путь героя» выполняет один проход по каталогу умений на отрисовку вместо повторного поиска навыков каждой открытой ветки. Сохранены порядок, принадлежность профессиям и пороги, включая будущие.
- Если у нового класса лимит ветки 0, сохранённые в ней очки всё равно показываются в заголовке как «12 / 0»; если очков нет, остаётся компактный прочерк. Сохранения не переписываются.
- Новые тесты эквивалентности для всех 28 классов и всех видимых веток, повреждённых данных и отображения старых билдов. Игровые формулы и D1 не менялись.


## 0.252.0 — 2026.11.01.252 · Удалены неиспользуемые стили старого выбора навыков

- Удалены CSS-правила и медиазапросы устаревшей карточной панели порогов навыков, больше не создаваемой ни одним активным модулем сайта.
- Убраны стили несуществующего набора четырёх кнопок редактирования ветки. Сохранены актуальная полоса, засечки, всплывающие подсказки и поля точного ввода.
- Добавлен проверочный тест на связи с активными JS-модулями, интеграционные браузерные сценарии сохранены.
- Билды, D1, формулы и уровни 1–55 не затрагиваются.


## 0.251.0 — 2026.11.01.251 · Один переключатель языка в шапке и устранение дубля вложенных очков ветки

- В «Пути героя» удалена повторная строка «Очки ветки N/предел»: её значение уже показано в заголовке ветки. Шкала, засечки, точные поля «Вложено»/«Мастерство» и итоги группы сохранены.
- RU/EN снова переключается только в шапке сайта. Из рабочего окна удалены лишние кнопки, обработчик, стили и дублированная синхронизация.
- Добавлены unit и браузерные регрессионные проверки на отсутствие дубля и корректный переход RU/EN через закрытие рабочего окна.
- Сохранены уровни 1–55, данные игры, сохранение билдов, D1 и игровые формулы.


## 0.250.0 — 2026.11.01.250 · Корректный язык названий предметов и браузерная проверка каталога RU/EN

- Для предметов с официальными названиями на двух языках выбор имени зависит от языка сайта, без изменения игрового имени и ID. При отсутствии перевода сохраняется оригинальное название.
- В каталог передаётся актуальный RU/EN, не меняя контент пользовательских сохранений.
- Добавлен настоящий Chromium-сценарий каталога экипировки: переключение RU/EN/RU, фильтры, названия, инспектор и ошибки JavaScript.
- Для открытого рабочего окна добавлен переключатель RU/EN; он вызывает существующую логику сайта и не создаёт второе независимое состояние языка.
- Новые тесты на точный приоритет имён, сохранение источника и значения ID; расчётный движок и production D1 не менялись.


## 0.249.0 — 2026.11.01.249 · Двуязычный каталог экипировки и названия категорий предметов

- В каталоге предметов переведены фильтры, типы слотов, переключение сетки/списка, сведения и источники получения, состояния поиска и подсказки в английской версии.
- Названия типа экипировки теперь локализуются через отдельный словарь при сохранении исходных RU-названий по умолчанию. Игровые названия предметов и их ID не подменяются.
- В панели перехода к умениям убрана техническая избыточность и добавлен RU/EN интерфейс.
- Новые тесты на RU/EN, неизменность данных и взаимодействий. Production D1 и расчёты не менялись.


## 0.248.0 — 2026.11.01.248 · Проверка целостности источника умений и приглушённая блокировка шкалы

- Ограничения профессии теперь проверяют не только наличие ID, но и положительное разрешение изучения из исходного каталога умений.
- Повреждённые уровни персонажа, дополнительные уровни требований, тип условий и флаг возможности изучения не превращаются в доступные навыки.
- Красная заблокированная часть шкалы стала менее контрастной, сохранив размеры, позиционирование и взаимодействие ползунка.
- Новые тесты сверяют типы всех 569 исходных навыков и нестандартные входные данные. Билды, D1 и игровые формулы не меняются.


## 0.247.0 — 2026.11.01.247 · Проверка порогов умений в едином формате и удаление неиспользуемых обработчиков

- Отметки прокачки больше не возникают из пустых, нулевых или повреждённых требований; ошибки входных данных не превращаются в доступные умения.
- Недопустимый лимит класса трактуется как 0, сохраняя недоступные будущие пороги в списке.
- Удалены неиспользуемые функции старого дерева навыков; поиск умения для недоступного порога переведён на индекс ID.
- Добавлены тесты входных данных, сохранения дубликатов и отсутствия мёртвых обработчиков. Пользовательские билды, аккаунты, уровень 55 и D1 не менялись.


## 0.246.0 — 2026.11.01.246 · Корректные пороги профессии в доступности навыков и единый индекс проверки засечек

- После смены профессии сохранившиеся сверх нового классового предела очки больше не разблокируют недоступные этому классу умения; сами очки не изменяются.
- Некорректные, пустые и нулевые требования ветки отображаются как неизвестные, а не как выполненные.
- При первоначальной отрисовке засечек используется тот же индекс ID, что и при дальнейших изменениях; удалён неиспользуемый промежуточный подсчёт.
- Добавлены тесты смены класса, цепочки предыдущих навыков, источника OS и сохранения оригинальных данных. Полная браузерная приёмка выполняется независимо.


## 0.245.0 — 2026.11.01.245 · Индекс связей навыков по ID вместо многократных проходов по каталогу

- Поиск предшествующего умения при отрисовке и проверке требований теперь использует общий индекс ID, создаваемый один раз на экран.
- Сохранены правила класса, уровня, порогов мастерства, рекурсивных зависимостей, циклов и дублирующихся ID: как и раньше, выбирается первая запись.
- Добавлены тесты цепочек, отсутствующих зависимостей, циклов, стабильности результата и отсутствия многократного поиска по массиву.
- Данные D1, сохранённые билды, уровни 1–55 и боевые формулы не изменены.


## 0.244.0 — 2026.11.01.244 · Быстрый поиск ближайшей засечки и однократная группировка порогов умений

- Повторная фильтрация всех порогов для каждой засечки заменена однократной группировкой с сохранением списка навыков.
- При движении мыши ближайший порог определяется бинарным поиском, без полного перебора засечек на каждом событии.
- Добавлены регрессии позиций, близких порогов, крайних значений, стабильного выбора и сохранения списка навыков.
- Chromium, публикация Pages и D1 проверяются отдельно от фиксации исходников.


## 0.243.0 — 2026.11.01.243 · Удаление мёртвого автосохранения и ускорение подсказок умений

- Удалён неиспользуемый модуль `saved-build-autosave.js`, оставшийся от прежней схемы автоматической перезаписи именованных билдов. Действующее правило не изменилось: черновик сохраняется локально автоматически; именованный билд сохраняется или перезаписывается **только по явному действию пользователя**.
- Регрессионные тесты прежнего модуля заменены проверками текущего пути сохранения и отсутствия автоматического POST. Не изменялись облачная схема, аккаунты и D1.
- Наведение на засечки навыков в «Пути героя» теперь использует рассчитанные при рендере доли шкалы, не перечитывая DOM-атрибуты при каждом движении указателя. Положение засечек, подсказки, клавиатура и шкала 0–90 сохраняются.
- Добавлены проверки позиций для нескольких размеров экрана. Игровые формулы, библиотека OS, скрытый вход администратора и планирование до 55-го уровня не затронуты.


## 0.242.0 — 2026.11.01.242 · Защита сессий аккаунтов и проверка владельца

- Ответы Cloudflare Worker для входа, регистрации, восстановления и подтверждения существующей сессии теперь проверяются до установки владельца: правильный формат логина, 43-символьного токена и будущего срока действия. Некорректный успешный HTTP-ответ не перезапишет действующую сессию.
- Запрос `/api/account/me` не может незаметно заменить пользователя другим или переключить данные в гостевую библиотеку, продолжая работать с чужим токеном. Ответ старого запроса больше не сбрасывает новую сессию. Временные ошибки сети по-прежнему сохраняют действующую сессию.
- Добавлены проверки в изолированной JS-среде и Chromium, включая чужое имя в HTTP 200 и отсутствие нежелательных облачных записей. Удалена неиспользуемая таблица `branchNames`, дублировавшая игровые источники.
- Сохранения, черновики, ручная перезапись, скрытая админка, игровой каталог, формулы и поддержка уровней 1–55 не менялись.


## 0.241.0 — 2026.11.01.241 · Очистка старой шкалы и стабильность проверки аккаунтов

- Удалены **65 устаревших CSS-правил (~8 КБ)** для неиспользуемых отдельностоящих маркеров, ромбов и трёхрядных значков. В действующей «Путь героя» остались единая шкала, вертикальная золотая засечка текущего значения и отдельные узкие засечки навыков.
- После публикации 0.240.0 один повторный Chromium-прогон встретил гонку тестового сценария двух вкладок. Проверка усилена: перед вводом имени ожидаются правильный аккаунт и полный игровой каталог, а сохранение теперь подтверждается успешным POST с нужным bearer-токеном и названием, не только появлением карточки. Исходный сценарий после повторного запуска проходил; проверки не были отключены.
- Добавлены регрессии на сохранность живых CSS-компонентов и отсутствие старых селекторов. Расчёты, личные библиотеки, имена персонажей, авторизация, Worker и D1 не менялись; уровень планирования по-прежнему до 55.


## 0.240.0 — 2026.11.01.240 · Вертикальная засечка шкалы навыков вместо золотого кольца

- В «Пути героя» круглый золотой ползунок заменён аккуратной вертикальной засечкой (4×26 px) с тёплым металлическим градиентом. Сохранена удобная 18-пиксельная невидимая область перемещения для мыши, клавиатуры и тачскрина.
- Заливка вложенных очков, зелёное мастерство, граница лимита класса и положение золотой засечки используют **единый расчёт геометрии**. Убраны устаревшие CSS-правила круглого бегунка и предотвращено смещение на краях шкалы.
- Добавлены числовые регрессии позиционирования при разных ширинах и значениях, расширен настоящий Chromium-сценарий проверки значения на 0 → 1 → 2 → 0, отсутствия скачков интерфейса, корректного указателя и работы стрелки клавиатуры.
- Все способы ввода, сохранения билдов, скрытая админка, данные OS, D1 и игровой горизонт 1–55 остались прежними. Непроверенные игровые формулы не выдаются за завершённые.


## 0.239.0 — 2026.11.01.239 · RU/EN сопротивления и защитные состояния

- В «Книге героя → Защита» переведены на английский восемь типов магического/стихийного сопротивления и значения от самоцветов, а также эффект защитного пассивного навыка.
- Все 12 отображаемых сопротивлений состояниям теперь имеют самостоятельные RU/EN названия, включая сон, заморозку, падение, отбрасывание, проклятие и пробитие блока. Подписи изменения физического урона и ограничений предпросмотра переведены.
- Формулы, знаки, числовые значения, источники, характеристики персонажа, названия предметов и именованные билды не изменены; статусы не преобразуются в неподтверждённые проценты.
- Добавлены регрессионные проверки всех пар названий и сохранности исходных данных. Уровни 1–55, D1 и авторизация не затронуты.


## 0.238.0 — 2026.11.01.238 · Двуязычные эффекты самоцветов, маны, лечения и зелий

- «Книга героя → Эффекты»: названия стихий, ауры оружия и её итога, магического усиления, сопротивлений брони, шанса состояний и радужных самоцветов теперь соответствуют RU/EN. Сноска о типах эффектов также переведена.
- Полностью переведены подписи вкладов в эффективность лечебных навыков, индекс расхода ОМ и его составляющие, а также эффективность зелий с расовой способностью, титулом, навыком и экипировкой.
- Базовые проценты зелий отличаются от добавочных с помощью структурного признака, а не распознавания русского слова «Выносливость»; отрицательные модификаторы отображаются без ошибочного `+-`.
- Числа, коэффициенты, пользовательские названия, игровой каталог, сохранения и авторизация не менялись. Регрессии проверяют обе локали и отсутствие несанкционированного изменения игровых имён.


## 0.237.0 — 2026.11.01.237 · Английская Книга героя и точные требования умений

- Справочник умений в «Книге героя» теперь действительно использует RU/EN для поиска, требований по уровням и веткам, статуса доступности, ОМ, времени применения, отката, подсказок и количества результатов. Имена и описания остаются взятыми непосредственно из официального каталога OS.
- В настройках усилений англоязычная версия показывает английские названия всех титулов чести и подписи их бонусов. ID и расчёт действия титула не менялись.
- В подписях боевых и поддерживающих умений больше не выводится универсальное сообщение о 26 очках мастерства рубящего оружия для посторонних умений: теперь указаны настоящая ветка, требуемые очки и ограничения выбранной экипировки. Строки эффектов переведены без новых вычислений.
- Добавлены двуязычные тесты и проверки сохранности оригинальных игровых имён. Сохранения, логины, D1, скрытая админка и планирование уровней 1–55 не затрагивались.


## 0.236.0 — 2026.11.01.236 · Проверка периодического восстановления по умениям OS

- Три умения периодического восстановления («Регенерация», «Восстановление» и «Природное восстановление») теперь распознаются только при совпадении реального игрового ID, типа, профессии, исходных эффектов, их направления, всех числовых параметров и интервала действия.
- Учтены реальный потолок мастерства исцеления выбранного класса, вложенное мастерство, минимальный уровень и требования умений. Поддельный эффект или невозможная прокачка не делают умение доступным. Условия восстановления ОМ не зависят от постороннего мастерства исцеления.
- Величины восстановления остаются исходными предпросмотрами Remaked. Умение не считается автоматически активным, не добавляет постоянное ОЗ/ОМ и не заявляет доказанную точность серверных тиков.
- Расширены проверки подмены игровых данных и сохранности итоговых характеристик. Сохранённые билды, аккаунты, D1, админка и уровни 1–55 не изменялись.


## 0.235.0 — 2026.11.01.235 · Три песни по требованиям персонажа и исходным цепочкам OS

- В «Книге героя → Усиления» добавлен небольшой сворачиваемый справочник «Песни для выбранного класса» с RU/EN названиями, описанием действия и требованиями мастерства. Он отражает доступные по веткам профессии песни и показывает, хватает ли вложенного мастерства.
- Три настоящие игровые цепочки из трёх умений каждая сверяются по ID, типу, связанным активациям, требованиям, направлениям и точным структурированным векторам: «Песнь поэта», «Песнь мира» и «Песнь чар». Неизвестные или изменённые данные не выдаются за проверенное действие песни.
- Песни не применяются к билду автоматически; дополнительный урон, защита, точность, откат и пороги урона по ним не прибавляются к постоянным характеристикам без реального применения в игре. Вывод не обещает серверную точность активных усилений.
- Регрессии для классов, лимитов мастерства, вложенных источников, RU/EN и неизменности ОЗ/ОМ/атаки. Сохранения, уровни 1–55, облачная библиотека, аккаунты, D1 и скрытая админка не изменены.


## 0.234.0 — 2026.11.01.234 · Доступность лечащих умений по OS и RU/EN восстановления

- Расчётные величины пяти лечащих умений сохранены по исходным формулам Remaked без автоматического применения. Но доступность теперь подтверждается соответствующим навыком из каталога OS, профессией и её настоящим лимитом ветки, требованием мастерства и уровня, направлением и точными параметрами умения. При отсутствии или подмене источника величина остаётся теоретической, а умение не считается доступным.
- Для Клирика от 50-го уровня сопоставлены три отдельные версии умений; для «Храма» также проверяется целевое вспомогательное умение. Поддельные ID, параметры, классы или требования не активируют навык в предпросмотре.
- В «Книге героя → Восстановление» исправлены русско-английские названия лечащих навыков, подписи доступности, требования, единицы ОЗ/ОМ, периодическое восстановление и подсказки. Английские имена привязаны к источникам OS по ID.
- Не изменены урон/лечение игрового сервера, записанные билды, облако D1, учетные записи, скрытая админка, правила сохранения и планирование 1–55.


## 0.233.0 — 2026.11.01.233 · Проверенные эффекты защиты от типов противников и расширенный RU/EN

- Шесть душ с уменьшением входящего урона от определённого типа противника проверяются не только по коду эффекта, но и по исходному ID, типу ячейки, направлению, значению −3%, заточке +0…+10 и точным оригинальным описаниям RU/EN. Подменённая запись больше не считается подтверждённой механикой OS.
- В «Книге героя → Защита» названия типов врагов и формулировка бонуса локализуются отдельно для RU и EN. Описание последней души на английском говорит Unliving, а на русском — «големами»; неподтверждённое равенство с историческим типом Remaked не заявляется.
- Доработаны английские составные подписи характеристик в разделах атаки, защиты и восстановления. Перевод запускается для знакомых UI-полей с числовыми значениями и не затрагивает произвольные имена и описания предметов.
- Добавлены регрессии на шесть исходных душ в двух языках, поддельные эффекты, неверные заточки, дубли ячеек и безопасную локализацию. Условные бонусы не увеличивают постоянную защиту; аккаунты, D1, ручное сохранение билдов, скрытая админка и уровни 1–55 не менялись.


## 0.232.0 — 2026.11.01.232 · Полноценный RU/EN для комплектов и восстановления в Книге героя

- Переведены заголовки и значения бонусов активных комплектов, подписи заточки/частей и условной защиты от падения. Сами бонусы и их требования не менялись.
- В разделе восстановления переключаются подписи эффективности зелий и лечения, заголовки зелий и списков ОЗ/ОМ, единицы ОЗ/ОМ, названия из официального локализованного каталога, а также список снятия состояний.
- Английские названия семи типов снимаемых состояний привязаны строго к тем же исходным структурированным эффектам OS. Сохранены клики по предметам, списки и расчёты.
- Добавлены тесты. Облачные билды, аккаунты, D1, админка и уровни 1–55 без изменений.

## 0.231.0 — 2026.11.01.231 · Умения, активируемые зельями и бальзамами

- В «Книге героя → Восстановление» появился **свёрнутый по умолчанию** список предметов, которые активируют умения при использовании. Исходный OS-каталог содержит 38 таких зелий и бальзамов и 49 ссылок на эффекты умений. Данные взяты из структурированных кодов `EP_SKILL_EXEC` и `EP_SKILL_EXEC_BALM`, а названия умений — из официального каталога по ID.
- У каждого предмета предусмотрен переход к его странице энциклопедии. Название предмета и связанного умения берутся из текущей версии RU/EN сайта, без технических идентификаторов в интерфейсе.
- Предметы здесь **не считаются автоматически использованными**, не расходуются и не изменяют текущую прокачку или характеристики. Для неподтверждённых длительности, силы эффекта и условий не добавляются выдуманные формулы. Прежние списки зелий восстановления ОЗ/ОМ и снятия состояний сохраняются.
- Добавлены проверки источников, ссылки на существующие умения, подделок ID/типов/направлений и независимости базовых HP/MP; пользователи, облачные билды, аккаунты, D1 и уровни 1–55 не затронуты.

## 0.230.0 — 2026.11.01.230 · Плащи военных карт с точными эффектами OS

- В «Книге героя → Эффекты» добавлена отдельная компактная секция для **девяти плащей** (ID 18022–18030), которые действуют только на военных картах. Доступные бонусы: все характеристики +2/+3/+5, защита +1/+3/+5, ОЗ +300/+1000/+2000; у плаща старшего ранга также +5 сопротивляемости всем видам урона и +10 магии.
- Цифры сверены с исходными игровыми умениями OS (ID 500000044/45/46), кодом активации, содержимым оригинального RU/EN описания и условием исчезновения эффекта при смене карты. Неизвестные/подменённые записи не получают эти бонусы.
- Бонусы намеренно **не добавляются к обычным итогам персонажа**, поскольку условие военной карты не включено в текущем расчёте. В интерфейсе показаны отдельные ситуационные значения без неподтверждённой механики переключения карт.
- Сохранены билды, ручная перезапись, аккаунты, Cloudflare D1, скрытая админка и уровни планирования 1–55.

## 0.229.0 — 2026.11.01.229 · Общие срабатывания без случайных процентов

- Общий предпросмотр условных эффектов больше не показывает числовой шанс только потому, что в описании той же вещи встретился такой же процент. Процент отображается лишь когда конкретное событие сверено по ID, коду и параметрам игрового эффекта, а также точному RU/EN описанию. Остальные срабатывания остаются видимыми без непроверенной цифры.
- Пример: два эффекта «Веера повелителя ветров» остаются в предпросмотре, но не получают автоматически 4% без достоверного сопоставления каждого события с текстом. Конфликт «Души вампира» и ранее обработанные подтверждённые примеры не теряются.
- В Chromium-тесте двух гостевых вкладок добавлено ожидание **ответа сервера** на сохранение конкретного билда с правильным гостевым ключом. Появление локальной карточки до сетевого ответа больше не приводит к преждевременной проверке; если запрос отсутствует или отправлен от имени другого гостя, тест продолжает падать.
- Учтена особенность исходного английского архива: у «Железного посоха» склеены «INT +2» и «4% Chance», что внешне выглядит как «INT +24%». Если конкретное срабатывание подтверждено точной официальной формулировкой и структурированным полем, случайная склейка чисел не отменяет реальный 4%-ный эффект.
- Расширены проверки 10 известных проков на обоих языках и подмены описаний/умений. Сохранение билдов, аккаунты, Cloudflare D1, уровень 1–55 и боевые итоговые формулы не изменялись.

## 0.228.0 — 2026.11.01.228 · Точные игровые источники для эффектов душ и предметов

- Предпросмотр особых эффектов дополнительно сверяет точное описание с **оригинальными RU/EN формулировками**, игровым ID и параметрами эффекта. Просто упоминания такого же процента в другом тексте больше недостаточно: это защищает от неверных заявлений о срабатываниях.
- Для четырёх особых предметов и душ («Душа несчастья», «Вечная душа», «Проклятый посох», «Рассветная вуаль») добавлена проверка конкретного источника и оригинального действия. Поддельный ID, изменённый процент, направление или описание не получают игровое подтверждение.
- **Выявлено противоречие «Вечной души»:** RU описание упоминает активацию при 5% ОЗ, английское — 5%-ный шанс при нуле LP. Теперь в интерфейсе отображается нейтральный условный эффект «Упрямое сердце» без выдуманного порога или шанса. Критический эффект другой души не заявляется для всех видов атак, поскольку EN описание ограничено физическими.
- Тесты на RU/EN описания всех девяти ранее подтверждённых on-hit эффектов и четырёх особых эффектов, подмену условий и изменение игровых источников. Расчёт боевых серверных бросков не придуман; D1, учётные записи и сохранённые билды не изменены.

## 0.227.0 — 2026.11.01.227 · RU/EN не меняет запасной расчёт заточки

- Для предметов с английскими описаниями резервная обработка текстовых бонусов заточки теперь использует сохранённую оригинальную формулировку актуального игрового сервера. Профессионально переведённое имя и описание продолжают показываться игроку; внутренний текст расчёта не выводится в интерфейс.
- Официальные структурированные `itemForth.json` имеют приоритет, как и раньше. Добавлены регрессии на реальном **Гладиусе ID 2** (+0/+1/+5/+7/+10) при RU/EN: при отсутствии таблицы известные текстовые бонусы совпадают, при наличии — применяется исходная таблица без повторного бонуса ОМ или ловкости.
- Стабилизирован сценарий Chromium для переключения гостя, Alice и Bob: тест дожидается фактического переключения принадлежащей аккаунту библиотеки в браузере перед попыткой сохранить билд, а не только первичной отрисовки страницы. Потери чужих данных по-прежнему проверяются.
- Сохранённые билды, аккаунты, D1, скрытая админка, уровни 1–55 и неподтверждённые боевые механики не изменены.

## 0.226.0 — 2026.11.01.226 · Надёжная активация комплектов предметов

- Подтверждённые бонусы комплектов из игрового `unison.json` теперь учитывают только корректные предметные источники, где `item:<ID>` совпадает с идентификатором самой вещи. Некорректная заточка вне целых **+0…+10** не может сделать предмет активной частью комплекта.
- Корневой предмет комплекта больше нельзя посчитать собственным дополнительным элементом, даже если будущие данные случайно включат его ID в перечень сопровождающих вещей. Повторяющиеся ID компаньонов считаются один раз.
- Добавлены регрессионные тесты на **все три исходных игровых комплекта**, а также некорректные корневые вещи, чужие ID, дубли и заточки. Сохранённые черновики и билды не изменяются и не очищаются: меняется лишь разрешение бонусов на этапе расчёта.
- Устранена нестабильность браузерного теста «Пути героя»: перед открытием ветки Chromium дожидается полной загрузки и валидации D1/локального каталога, а не только появления первых элементов интерфейса. Проверка интерактивности ветки и её порогов сохранена.
- Не затронуты учётные записи, Cloudflare D1, классы и уровни 1–55, а также неподтверждённые боевые формулы.

## 0.225.0 — 2026.11.01.225 · Проверка RU/EN вероятностей и допустимой заточки

- Условные срабатывания теперь могут подтверждать проценты по исходным **русским и английским** описаниям предметов/душ (`шанс/вероятность` и `chance/probability`). Если в описании одного источника указано несколько разных процентов без достоверной связи с каждым событием, система не привязывает их наугад.
- Исправлен английский предпросмотр **«Сапог путника» (ID 15082)**: текстовое условие сверяется с официальным EN-описанием так же строго, как с RU. Английское название активируемого умения теперь **Dash**, как в официальном каталоге `strings.en.json` для ID 260003001, вместо прежнего неофициального Gust.
- Предпросмотр условных событий, их подробных описаний и бонуса опыта теперь отклоняет некорректные значения заточки вне целого диапазона **+0…+10**. Добавлены тесты на реальные RU/EN данные, спорную «Душу вампира», много разных процентов и ошибочные значения заточки.
- Не менялись расчёт фактических серверных проков, сохранённые билды, аккаунты, D1, администратор и уровни планирования 1–55.

## 0.224.0 — 2026.11.01.224 · RU/EN для срабатываний и бонусов опыта в книге героя

- Заголовки **«Срабатывания предметов и душ»** и **«Бонус к получаемому опыту»** в английской версии «Книги героя» теперь отображаются на английском. Подписи условий срабатывания, включая получение физического и стихийного урона, тоже переключаются между RU/EN.
- Для общего условного эффекта предусмотрены английские названия «Stun» и «Special effect» вместо русских запасных подписей. Названия известных умений и предметов продолжают приходить из уже используемого официального ID-каталога RU/EN, без самовольного перевода пользовательского текста.
- Числовые значения и подтверждения вероятностей не меняются. Добавлены регрессионные тесты локализации; сохранены логика обнуления полей, книги героя, сохранённые билды, Cloudflare D1, аккаунты и уровни 1–55.

## 0.223.0 — 2026.11.01.223 · Независимые срабатывания предметов не исчезают из книги героя

- Исправлена дедупликация условных эффектов: теперь учитываются **реальный источник, код эффекта, ID умения, процент и направление**, а не отображаемое название предмета. Одноимённые разные вещи больше не должны скрывать срабатывания друг друга.
- Если у одной вещи есть несколько различных событий с одним кодом, подробное подтверждённое описание заменяет только **соответствующее** общее событие. Остальные события остаются видимыми. Для нескольких копий учитывается число повторов, а не глобальное удаление всех совпадений.
- Добавлены Node-тесты одинаковых названий, нескольких проков и повторяющихся источников. Изменение касается только предпросмотра в «Книге героя», не рассчитывает новый боевой урон или серверные броски.
- Не менялись очистка полей до нуля, структура билдов и ручное сохранение, Cloudflare D1, учётные записи, скрытая админка и уровни планирования 1–55.

## 0.222.0 — 2026.11.01.222 · Очистка поля теперь осознанно сбрасывает прокачку ветки

- По уточнению владельца пустое поле **«Вложено»** при завершении ввода (клик вне поля или переход фокуса) снова означает **0 очков** этой конкретной ветки. Очищенная строка немедленно возвращает вложенные очки в свободный бюджет; другие ветки не меняются.
- Аналогично очистка поля **«Мастерство»** в ручном режиме устанавливает **0 зелёных очков**, сохраняя вложенные очки. Сброс синхронизирует шкалу и состояние черновика.
- Отклонение отрицательных и дробных значений остаётся. Изменения фиксируются через существующий локальный механизм; ранее сохранённый именованный/облачный билд не перезаписывается автоматически.
- Добавлены регрессионные проверки обоих полей в Node и реальное изменение фокуса в Chromium. Сохраняются уровень планирования 1–55, D1, авторизация, скрытый вход администратора, игровые данные и расчётные формулы.
- Это **уточнение и исправление поведения 0.220.0**: в том релизе очистка ошибочно трактовалась как недопустимый ввод.

## 0.221.0 — 2026.11.01.221 · Честные проценты условных эффектов без дублирования

- В общем предпросмотре условных эффектов числовой шанс выводится **только если процент присутствует в исходном описании предмета/души и совпадает со структурированным полем**. В остальных случаях событие остаётся в списке, но неподтверждённая величина не публикуется: например, 35% у «Массивной кувалды» и 100% у «Лёгкого клинка» раньше нельзя было подтвердить исходным текстом.
- Для оригинальных **«Сапог путника» (ID 15082)** добавлено детальное описание: **8% вероятность получить «Порыв» при получении физического урона**. Процент подтверждён одновременно описанием и исходным `EP_ONDAMAGE_SKILL_EXEC`. Любое несовпадение ID, кода, умения, шанса, направления, описания или заточки отклоняется.
- В «Книге героя» одинаковый эффект одного и того же предмета/души больше не дублируется между общим списком проков и подробным описанием. Другие уникальные условные эффекты остаются видимыми.
- Добавлены регрессионные тесты на исходных данных OS, конфликт «Души вампира» сохраняет статус спорного. Числовое боевое моделирование, сохранённые билды, облачные аккаунты/D1, скрытая админка и уровни 1–55 не изменены. Полная серверная эквивалентность Remaked не заявляется.

## 0.220.0 — 2026.11.01.220 · Тонкое свечение засечек и безопасный ввод очков

- Радиус мягкого свечения вертикальной засечки при наведении и фокусе уменьшен **с 2 px до 1 px**. Размер самих засечек 3×12 px, цвета, границы, подсказки и управление ползунком не изменены.
- Исправлен риск случайного обнуления вложенных очков: очистка поля «Вложено» и выход из него больше не превращаются в значение 0. Пустое, отрицательное и дробное значение отклоняется, возвращается последнее допустимое число; корректно введённый 0 по-прежнему позволяет осознанно вернуть очки.
- Аналогичная защита применена к ручному полю «Мастерство». Некорректное значение не вызывает обработчик изменения мастерства и не сбрасывает ранее освоенные очки.
- Расширены Node-тесты числовых полей и Chromium-проверки реального CSS-свечения и сохранности вложений при пустом поле. Действующие билды и правила их повторного сохранения, аккаунты, Cloudflare D1, скрытая админка и диапазон уровней 1–55 не изменены.
- Статус публикации Pages и выполнение браузерных проверок требуют отдельного подтверждения в GitHub Actions.

## 0.219.0 — 2026.11.01.219 · Девять точных условных эффектов оружия и душ при атаке

- В книге героя добавлено отображение **9 документированных эффектов срабатывания при атаке** из игрового каталога актуального игрового сервера: 4 предмета и 5 душ. Это оглушение, опрокидывание, ослабление, сон, отравление и замедление с исходными шансами 4%, 5% или 9%.
- Каждый эффект показывается лишь при точном совпадении **ID, типа источника, кода эффекта, ID вызываемого умения, шанса и направления действия**, а также соблюдении требований заточки. Никаких сгенерированных названий и коэффициентов.
- Намеренно исключены неоднозначные записи: например, **«Душа вампира»** описывает шанс 4%, но её структурированный эффект содержит 5%. До выяснения расхождения сайт не утверждает ни один из этих процентов как достоверный.
- Все новые значения — **описания возможных срабатываний**, а не моделирование реального серверного броска шанса, продолжительности статуса или исходящего урона. Числовые характеристики героя не изменяются.
- Добавлены тесты для девяти оригинальных записей, граничной заточки, изменённых ID/коэффициентов, несовпадающих источников и спорных записей. Сохранены исправления стабильности заголовков веток, вертикальные засечки, планирование 1–55, D1 и ручная перезапись билдов.

## 0.218.0 — 2026.11.01.218 · Ветка перестала дёргаться при прокачке с нуля

- Устранена причина вертикальных скачков в «Пути героя»: при увеличении вложенных очков с 0 до 1 и далее заголовок ветки больше не добавляет/убирает отдельную строку «1 мастерство / 2 мастерства». Значение мастерства уже доступно в закреплённом поле «Мастерство» внутри раскрытой ветки.
- Заголовок ветки всегда остаётся однострочным; длинные названия аккуратно сокращаются по ширине с многоточием, счётчик «вложено / предел класса» не переносится. Высота заголовка и положение ползунка не меняются при перетаскивании.
- Подсветка вертикальных засечек при наведении дополнительно ослаблена на 1 px по радиусу мягкого свечения: с 3 px до **2 px**. Форма, ширина, высота засечек и их цвета не изменены.
- Добавлены проверки неизменности структуры заголовка при 0→1→2→0 и реальный Chromium-тест стабильности высоты строки и вертикального положения шкалы.
- Не изменены уровни 1–55, расчётные формулы и игровые данные, D1, аккаунты, скрытая админка и порядок повторного сохранения билдов.

## 0.217.0 — 2026.11.01.217 · Реальный эффект физического уклонения Рассветной вуали

- В книге героя рядом с прочими особенностями экипировки отображается **«Шанс уклониться от физической атаки +3%»** для текущего оригинального предмета **«Рассветная вуаль для мирины»** (ID 11552), если его структурированный эффект `EP_DESTINE_WARDING` точно совпадает с исходным значением и направлением `TARGET`.
- Условный шанс **не прибавляется к обычному уклонению** и не превращается в выдуманный расчёт серверного попадания/срабатывания. Неподтверждённые ID, коэффициенты, направления и недоступные уровни улучшения отклоняются.
- Добавлены проверочные векторы на оригинальной записи каталога и отказ от неверных эффектов; расширено покрытие реально существующих, но пока не моделируемых полностью игровых особенностей.
- Без изменений в 0–90 шкале развития, планировании героя 1–55, билдах и аккаунтах, D1, локализации источника и скрытом входе администратора.

## 0.216.0 — 2026.11.01.216 · Вертикальные засечки и компактные настройки ветки

- По запросу вернули тонкие **вертикальные засечки** (3 × 12 px) вместо ромбовидных маркеров. Достигнутые пороги выделяются зелёным, будущие — золотистым, недоступные по классу — красноватым; наведение лишь слегка подчёркивает засечку, не меняя её ширину и не создавая сильного свечения.
- Сохранены единая шкала, точная геометрия отметок при изменении ширины, управление мышью и клавиатурой, подсказки с иконкой, названием, описанием и порогом открытия умения. При наличии в структурированных данных показывается **«Затрат ОМ»** из исходного поля `mana`, без догадок по описанию.
- Поля ветки сокращены до **«Вложено»** и **«Мастерство»**, находятся в одной компактной строке, оформлены одинаковой высотой с зелёным акцентом у мастерства. На узких экранах группы переносятся без сжатия; для названий предусмотрены короткие стилизованные подсказки с клавиатурным фокусом. RU/EN подписи согласованы.
- Не добавлен новый механизм группировки совпадающих порогов; предыдущая логика порогов и ограничение видимых отметок шкалой 0–90 сохранены. Не изменены игровые формулы, планирование до 55 уровня, D1, учётные записи и правила ручного повторного сохранения билдов.

## 0.215.0 — 2026.11.01.215 · Аккуратные маркеры открытия умений на шкале

- На общей полосе развития ветки заменены плотные длинные вертикальные насечки на небольшие ромбовидные отметки порогов умений. Зелёное освоение, золотые ещё не достигнутые пороги и красные недоступные пороги различаются цветом.
- Маркеры рисуются поверх прогресса, не закрывая всю полосу. Пороги выше максимума 90 больше не отображаются за правой границей; такие умения остаются в раскрываемом списке со своими требованиями. Положение остальных порогов, подсказки, клавиатурный фокус и перетаскивание сохранены.
- Добавлены проверки CSS-маркеров и интерактивного поведения. Не менялись игровые расчёты, навыки по ID, существующие билды, D1, аккаунты, правила админки или максимальный уровень 55.

## 0.214.0 — 2026.11.01.214 · Без битых заглушек умений

- Устранён несуществующий путь `assets/ui/icons/skill-unknown.svg`. Для неизвестных категорий навыков и расовых способностей без оригинальной иконки загрузчик возвращает отсутствие изображения, а интерфейс показывает нейтральный символ.
- Запросы к ресурсам известных игровых веток проверяются по фактически существующим файлам `assets/skills/legacy`. Защита через `Object.hasOwn` исключает наследуемые имена вроде `__proto__` и `constructor` из таблицы игровых категорий.
- Добавлены автоматические тесты полного списка локальных значков и отсутствующего изображения. Не затронуты формулы, уровни 1–55, слоты предметов, сохранение билдов, D1 и авторизация.

## 0.213.0 — 2026.11.01.213 · Исправление восстановления ОЗ по СД вместо уровня

- Исправлены исторические формулы восстановления каждые 2 секунды из `Calc('LPsec')`: «Регенерация» использует `15 + floor(СД/10) + floor(очков милосердия/10)`, а «Восстановление» — `7 + floor(СД/5) + floor(очков милосердия/10)`. Ранее ошибочно использовался уровень персонажа вместо СД.
- Функция получает итоговую СД персонажа (раса, класс, характеристики, предметы и известные бонусы), а уровень использует только для проверки доступности навыка. Это предварительные значения старого Remaked, а не подтверждение итогового эффекта на текущем игровом сервере OS.
- Проверены пороги СД, отсутствие двойного учёта мастерства, независимость чисел от уровня при одинаковой СД, будущие уровни до 55 и отказ от расчёта при отсутствии СД.
- Обновлены автоматические тесты. Не изменены сохранённые билды, D1, учётные записи, условия скрытого входа администратора, предметы или другие игровые формулы.

## 0.212.0 — 2026.11.01.212 · Нет повторных запросов отсутствующих оригинальных иконок

- После проверки опубликованного манифеста сайт отличает имеющиеся собственные иконки от исходных файлов, которые вернули HTTP 404. Для известных отсутствующих оригиналов больше не создаются повторные запросы к внешнему серверу.
- Навыки и предметы без доступного исходного изображения показывают существующие нейтральные обозначения вместо разорванного изображения или неподходящей картинки. Исправлена также карточка расовой пассивки, которая ранее безусловно создавала тег изображения.
- Приоритет сохранён: пользовательские разрешённые изменения оформления, затем оригинальный локальный архив, затем внешний URL только для ещё не классифицированных источников. HTTP 404 не подменяется неподтверждённой иконкой другого умения.
- Добавлены проверки маршрутов для навыков, предметов и душ, отсутствующих и архивированных источников. Никаких изменений в формулах, D1, уровнях 1–55, учётных записях и сохранении билдов.

## 0.211.0 — 2026.11.01.211 · 1 173 оригинальные игровые иконки в собственной библиотеке

- Физически импортированы в репозиторий и проверены 1 173 оригинальные WebP-иконки из текущих игровых данных актуального игрового сервера: 286 навыков, 876 предметов и 11 душ. Сайт использует сохранённые локальные файлы через `assets/os-icon-manifest.json`.
- Исправлен исходный маршрут загрузки душ: их настоящие изображения находятся на OS в общем каталоге `icons/items/`, а не `icons/souls/`. В собственном архиве они сохраняются отдельно в `assets/souls/icons/` и получают приоритет при отображении.
- Учёт 1 437 ожидаемых уникальных путей полностью прозрачен: 264 отсутствующих оригинала (260 навыков, 4 предмета) вернули HTTP 404. Они не заменены чужой или придуманной графикой и не объявлены импортированными.
- Добавлены проверки маршрутов, безопасности имён, фактического существования и корректности каждого импортированного WebP, соответствия манифеста и источников. Временный GitHub Actions workflow импорта удалён после выполнения; обычный сайт не скачивает иконки при сборке.
- Не затронуты D1, аккаунты, сохранённые билды, расчётные формулы и диапазон уровней 1–55. Наличие новых файлов в GitHub не является подтверждением успешного публичного Pages-деплоя.

## 0.210.0 — 2026.11.01.210 · Перевод требований умений и дерева развития

- В английском интерфейсе переведены требования доступности навыков, подсказки о недостающем уровне, классе и мастерстве, заголовки характеристик навыка, статистика бюджета, счётчики и действия.
- Переведены текстовые элементы полосы прогресса, порогов освоения, ограничений профессии и заголовки рабочей области; официальные имена предметов и умений продолжают браться только из ID-связанных данных игры.
- Добавлены Node-регрессии для RU/EN условий навыка и браузерный сценарий переключения языка внутри дерева развития.
- Игровые формулы, максимальный уровень планирования 55, D1, аккаунты и скрытый администраторский вход не менялись. Публикация и живые пользовательские сценарии проверяются отдельно.

## 0.209.0 — 2026.11.01.209 · Защита резервного кода и читаемая шкала навыков

- Резервный код нового аккаунта или восстановления пароля остаётся доступен в текущей вкладке профиля, даже если пользователь случайно закрыл панель. Скрывается после явного «Я сохранил код», выхода или обновления страницы. Код не сохраняется в localStorage.
- Код показывается сразу после успешного ответа сервера, до запуска обновления облачной библиотеки. Поддержаны RU/EN, копирование и выделение при отсутствии clipboard-доступа.
- Под единой интерактивной шкалой мастерства добавлены метки 0, лимита профессии и максимума планирования ветки. Положение навыков и перетаскивание не изменены; анимация учитывает системный reduced-motion.
- Добавлены Node-проверка и Chromium-проверки повторного открытия профиля и подписей шкалы. Реальные аккаунты и игровые формулы не изменены; публикация и браузерные тесты требуют независимой проверки.

## 0.208.0 — 2026.11.01.208 · Гостевой код не выдаётся за код аккаунта

- При входе в зарегистрированный аккаунт раздел переноса по гостевому секретному коду скрывается: случайный ключ текущего браузера не является кодом облачной библиотеки вошедшего пользователя.
- Для зарегистрированного игрока библиотека доступна через логин/пароль, а гостевой режим и старые личные коды продолжают работать после выхода из аккаунта.
- Добавлены Node-проверка и браузерные проверки двух аккаунтов и двух гостей; D1 и данные сохранённых билдов не меняются.

## 0.207.0 — 2026.11.01.207 · Независимые гостевые библиотеки в разных вкладках

- Каждая открытая гостевая вкладка теперь использует свой сохранённый на момент открытия личный код для облачных запросов, публикации ссылок и привязки при регистрации. Подключение другой библиотеки в соседней вкладке не перенаправляет запросы первой.
- При явном подключении новой библиотеки переносится только локальная работа владельца текущей вкладки, а не записи другого игрока из общего браузерного хранилища.
- Добавлены Node-тесты и браузерный сценарий с двумя гостевыми вкладками, у которых разные ключи D1. Пароли, старая D1 и формулы игры не менялись.

## 0.206.0 — 2026.11.01.206 · Безопасная работа двух вкладок с разными аккаунтами

- Исправлено пересечение локальных данных между открытыми вкладками: если во второй вкладке другой пользователь, первая вкладка больше не записывает свои билды, черновик и очередь удалений в его основное браузерное хранилище.
- Каждая вкладка сохраняет данные в отдельную область своего владельца. Смена аккаунта возвращает принадлежащие ему записи, включая прежние гостевые библиотеки.
- Добавлены Node-регрессии и Chromium-тест двух одновременных вкладок с имитацией разных учетных записей Worker. Серверные D1-данные не изменены.

## 0.205.0 — 2026.11.01.205 · Честное подтверждение облачного сохранения

- При ручном перезаписывании сохранённого билда сначала отображается подтверждение локального сохранения и ожидание облака, а не ложный успешный результат D1 до сетевого ответа.
- Статус синхронизации подтверждает облачную запись только после принятого ответа Worker. Ошибки 5xx сохраняют локальный прогресс и отображаются как недоступность облака.
- Добавлены RU/EN текст и Chromium-тест с искусственным ответом 503: билд остаётся в браузере, а конфликтная локальная версия не отправляется в D1 без согласия.

## 0.204.0 — 2026.11.01.204 · Без ложных дубликатов сохранённых билдов

- Сверка локальной и облачной версий теперь сравнивает значения вложенных полей, а не их случайный порядок в JSON. Повторная загрузка или старые импорты не создают ненужные локальные копии одинакового билда.
- Реальные изменения уровня, экипировки, душ и других данных по-прежнему сохраняются отдельными версиями. Облако остаётся основным для прежнего ID, публикация восстановленной копии требует ручного подтверждения.
- Добавлены тесты на переставленные поля уровня 55, различные предметы и перестановки массива.

## 0.203.0 — 2026.11.01.203 · Перевод книги героя RU/EN

- Шесть вкладок книги героя, основные расчётные параметры, заголовки эффектов, настройки гильдии и усилений, кнопки и описания доступности теперь переводятся при переключении языка на английский.
- Текстовые значения игровых предметов, душ и пользовательские имена не переводятся по приблизительному совпадению; применяется только точный словарь интерфейса.
- Добавлены отдельные тесты источника и Chromium-проверка переключения языка прямо в книге героя. Обновление не затрагивает формулы, облачную D1 и сохранённые билды.

## 0.202.0 — 2026.11.01.202 · Защита от запоздалых ответов облака

- Асинхронное сохранение и удаление в D1 теперь учитывают владельца, который начал операцию: завершившийся позже запрос предыдущего аккаунта не меняет статус текущего игрока и не удаляет его ожидающие операции.
- Подключение облачной библиотеки по старому коду отменяется, если во время проверки пользователь вошёл в аккаунт или переключил библиотеку.
- Сообщения о сбое подключения и конфликте не появляются от устаревших запросов, получивших ответ после переключения. Добавлены тесты с управляемой задержкой ответов без реальных запросов к D1.

## 0.201.0 — 2026.11.01.201 · Исправлено сравнение названий экипировки и душ

- Сравнение двух билдов теперь определяет настоящие названия оружия, вещей и душ по идентификаторам текущих записей OS/D1; вместо ложного «пусто → пусто» видны различающиеся предметы.
- Раса, профессия и уровень сравниваются раздельно. Если запись отсутствует в каталоге, вместо «пусто» виден понятный резервный идентификатор, не теряющий информацию.
- Добавлены проверки на реальных OS предметах и душах, совместимость со старыми сохранениями и локализацию RU/EN. Боевая модель и ручное сохранение не изменены.

## 0.200.0 — 2026.11.01.200 · Три особых эффекта экипировки и душ в книге героя

- В разделе «Эффекты» книги героя теперь показываются подтверждённые описания трёх особых свойств из актуального игрового сервера: все входящие атаки критические («Душа несчастья»), возможность срабатывания «Упрямого сердца» при 5% ОЗ («Вечная душа»), постепенное уменьшение ОЗ («Проклятый посох»).
- Эффекты проверяются только для действующей экипировки и с учётом условий заточки/ячеек, отображаются RU/EN. Неподтверждённые вероятности, численный урон и скорость тиков не выдумываются.
- Три EP-кода получают статус описательного preview в аудите покрытия, но не объявляются полностью реализованной формулой. Добавлены тесты на реальные записи OS.

## 0.199.0 — 2026.11.01.199 · Восстановление гостевых библиотек предыдущих версий

- Прежняя резервная копия гостевых билдов `ps-preaccount-library.v1` теперь автоматически распознаётся при переходе на раздельное локальное хранилище аккаунтов и сохраняется **только за гостем**.
- Уже существующая современная гостевая библиотека не перезаписывается устаревшей копией, некорректные данные отклоняются без удаления исходного файла.
- Регрессионные проверки восстановления гостевых билдов при выходе из аккаунта и обратного входа. Никаких изменений Cloudflare D1, уровня 1–55 или игровых формул.

## 0.198.0 — 2026.11.01.198 · Спасение локальных версий после удаления облачного билда

- Если исходный билд удалён в D1 на другом устройстве, его сохранившаяся локальная версия теперь остаётся отдельной неопубликованной копией. Удалённый ID и созданные ранее ссылки **не восстанавливаются**.
- Намеренное удаление пользователем с ожидающей очередью не создаёт бессмысленных копий. Повторная синхронизация не умножает копии, а публикация требует отдельного явного подтверждения.
- Node-регрессии и Chromium-сценарий проверки с имитацией удалённого D1-билда; существующие расчётные формулы и диапазон уровней 1–55 не меняются.

## 0.197.0 — 2026.11.01.197 · Разделение локальных библиотек между игроками

- Локальные черновики, сохранённые билды и очередь удаления разделены между разными игровыми аккаунтами и гостевой библиотекой. Вход другим логином больше не использует предыдущую локальную библиотеку для автоматической отправки в его облако.
- Регистрация нового аккаунта по-прежнему связывает *его же* прежнюю гостевую библиотеку с текущей D1. При выходе восстанавливается гостевой черновик и его локальные билды.
- Добавлен безопасный переход со старых ключей браузерного хранилища; сетевые ответы от предыдущего владельца не должны менять новую библиотеку. Новый набор регрессионных тестов.

## 0.196.0 — 2026.11.01.196 · Контроль работоспособности новых аккаунтов D1

- После подтверждённой миграции 0005 диагностика рабочего сервера теперь требует активного признака `features.accounts=true`. Если таблицы аккаунтов перестанут быть доступны, проверка больше не пропустит ситуацию как обычную заметку.
- Добавлен безопасный анонимный запрос `GET /api/account/me`: ожидается 401 «Sign in required», что проверяет маршрут и защиту без настоящего входа, создания пользователей или записи в D1.
- Добавлен тест на неизменяемость диагностики; реальные административные пароли и пользовательские данные не используются.

## 0.195.0 — 2026.11.01.195 · Засечки умений на общей шкале, скрытая админка, активные аккаунты D1

- Переделаны отметки разблокировки навыков: вместо разнесённых по трём ярусам квадратиков на шкале расположены тонкие засечки в одном ряду внутри полосы. При наведении на нужное место или клавиатурном фокусе показывается подсказка с иконкой, названием и описанием. Ползунок перетаскивается независимо от отметок.
- Удалена открытая кнопка входа администратора из профиля. Скрытый служебный доступ остался по пяти нажатиям на логотип за шесть секунд либо Ctrl+Alt+Shift+P.
- Подтверждено успешное выполнение пользователем миграции D1 0005 по логам Actions 41263185077; действующая D1 и Worker теперь показывают три таблицы пользовательских аккаунтов и сохранённую старую библиотеку. Дополнительная миграция не требуется.
- Усилены Chromium-регрессии: положение всех засечек в полосе, отсутствие наслоения и наличие всплывающих подсказок, отсутствие публичной админки и доступность скрытых способов.

## 0.194.0 — 2026.11.01.194 · Безопасная отдельная миграция новых пользовательских аккаунтов D1

- Подготовлен ручной GitHub Actions workflow для создания трёх таблиц аккаунтов через готовую миграцию `0005` **в исходной D1**, с явным подтверждением, точным UUID, проверкой старых таблиц и точкой восстановления перед операцией.
- Старые таблицы, админская запись, игровые каталоги, билды и ссылки не меняются; команда не запускает повторно остальные миграции.
- Добавлены автоматические проверки ограничений и пошаговая инструкция для владельца. Наличие workflow не равно его запуску: активация аккаунтов игроков подтверждается отдельно через `/api/health`.

## 0.193.0 — 2026.11.01.193 · Метки умений прямо на шкале и отдельный вход administrator

- Исправлено некорректное расположение отметок навыков над полосой: теперь отметки встроены в полоску вложенных очков, показывают достижимость (зелёная, золотая, красная), а при наведении/фокусе открывают подробную подсказку с иконкой и описанием.
- Добавлен доступный вход «Вход администратора» в меню профиля. Он открывает прежнюю отдельную служебную форму и отправляет логин administrator только в `/api/admin/login`, независимо от миграции новых пользовательских аккаунтов.
- Сообщение о недостающей миграции 0005 теперь относится только к профилям игроков. Никаких изменений таблиц D1 или секретов авторизации через этот коммит.
- Новые Node и Chromium регрессии проверяют реальное положение меток внутри шкалы и админский вход при временной недоступности регистрации.

## 0.192.0 — 2026.11.01.192 · Проверка пароля при смене и восстановлении

- Пользователь дважды вводит новый пароль при изменении или восстановлении аккаунта. Несовпадение блокирует запрос к Worker — одноразовый код восстановления не расходуется из-за опечатки до проверки.
- Поля аккаунта получили доступные названия для экранных дикторов и базовую проверку обязательного ввода. Секреты не записываются в исходники.
- Старые сохранения без поля пола персонажа больше не вызывают ложное различие при сравнении с обычным значением по умолчанию. Добавлены Node/Chromium регрессии.

## 0.191.0 — 2026.11.01.191 · Полнее сравнение сохранённых билдов

- При сравнении двух билдов теперь видны изменения самоцветов, усилений гильдии, «Знака жизни», Проэлиума, боевых баффов, эффектов зелий и выбранного титула чести.
- Ненадетые и устаревшие записи самоцветов не засоряют сравнение. Отсутствующие поля старых сохранений считаются выключенными или нулевыми и не приводят к ложным различиям.
- RU/EN названия сравниваемых усилений и титулов; регрессионные тесты на сохранность исходного билда. Формулы урона, уровень 1–55 и D1 не меняются.

## 0.190.0 — 2026.11.01.190 · Сохранение локальных конфликтных копий только по команде игрока

- Исправлена скрытая повторная автозагрузка конфликтной копии в D1 после следующего обновления библиотеки. Копии помечены как локальные и остаются в браузере до явного «Мои билды → открыть копию → Перезаписать → Подтвердить».
- Удаление неопубликованной копии не отправляет запрос на удаление в D1. Создание публичной ссылки для неё до сохранения показывает понятную инструкцию.
- Добавлены регрессионные проверки повторного объединения, офлайн-билдов, запрета автоматической отправки и ручной публикации. Принципы уровня 1–55 и расчётные формулы не изменены.

## 0.189.0 — 2026.11.01.189 · Надёжные сессии и сохранение билдов

- Если проверка аккаунта временно недоступна из-за сети или ошибки Worker, активная локальная сессия не уничтожается. Только подтверждённые 401/403 удаляют её с этого устройства.
- Оформлен встроенный блок подтверждения перезаписи сохранённого билда; нажатие «Перезаписать» лишь раскрывает подтверждение, запись требует второго действия пользователя.
- Добавлены проверки на временную ошибку 503 и последующую настоящую 401 в Chromium, обновлены ключи кеша CSS/JS. Реальная публикация и пользовательская приёмка проверяются отдельно.

## 0.188.0 — 2026.11.01.188 · Локализация профиля и библиотеки, подтверждение перезаписи

- RU/EN: переведены дополнительные элементы главного экрана, управление профилем и аккаунтом, форма восстановления и основные действия в библиотеке билдов. Переводы интерфейса применяются по точным ключам; имена игровых предметов и пользовательские названия не подменяются.
- Вместо системного confirm при перезаписи — встроенное подтверждение в карточке сохранённого билда. Отмена и открытие подтверждения не записывают изменения в D1.
- Добавлены проверки локализации на Node и Chromium-сценарии переключения языка и ручного подтверждения. Успешный прогон npm test / браузерных тестов и фактическая публикация Pages требуют независимой проверки.

## 0.187.0 — 2026.11.01.187 · Ручное сохранение, типы слотов и личные аккаунты

- Дополнена безопасная диагностика Worker/D1: публичный read-only прогон явно показывает статус `features.accounts` и необходимость миграции №0005, не записывая ничего в базу. Новые UI сценарии подтверждены изолированным Chromium.


- **Правки открытого билда больше не уходят автоматически в Cloudflare.** Черновик остаётся в браузере и восстанавливается при обычном перезапуске. Перезапись сохранённого билда осуществляется только из «Мои билды» через кнопку «↻ Перезаписать» с подтверждением. В центре «Сохранить билд» ведёт в управление библиотекой; новая запись создаётся отдельным явным действием.
- Облачные записи сохраняют приоритет по исходным ID. Конфликтующие локальные редакции сохраняются локально как отдельные копии, но никогда не превращаются в новый удалённый билд без решения пользователя.
- Исправлено дублирование названия предмета в заголовке окна: выводится «Слот: Оружие», «Слот: Щит», «Слот: Шлем», «Слот: Броня», «Слот: Штаны», «Слот: Амулет», «Слот: Серьга» и прочие реальные названия; на EN — соответствующие английские типы слотов.
- Значки требований умений расположены на отдельной внутренней полосе над ползунком, тремя рядами, без пересечения названия ветки и ручки ползунка.
- Добавлен компактный личный профиль в правой части шапки сайта: регистрация по уникальному логину, вход, выход, изменение пароля и восстановление по резервному коду без почты и СМС. Логины 3–20 символов (латиница с цифрами и подчёркиванием, первый символ — буква), пароли 15–128 символов с разрешёнными пробелами/Unicode/знаками.
- Для безопасности в D1 предусмотрены salted PBKDF2-хэши, случайные непрозрачные сеансы с хранением только хэшей токенов, лимиты попыток и одноразовая смена кода восстановления. Уже существующая библиотека может быть привязана к новому аккаунту без потери старых ссылок.
- Миграция `worker/migrations/0005_user_accounts.sql` **должна быть применена к настоящей D1 отдельно**, а Worker опубликован для активации регистрации. Успешная публикация Pages без этих действий не активирует аккаунты.
- Добавлены Node-тесты серверной регистрации, входа и восстановления, а также Chromium-проверки профиля и ручной перезаписи сохранённого билда.

## 0.186.0 — 2026.11.01.186 · Восстановление облачных сохранений после сбоя сети

- При возвращении сети или открытии вкладки после перерыва Build Studio повторяет безопасное чтение облачной библиотеки и синхронизирует записи, которые ранее не удалось отправить. Повторные проверки ограничены интервалом 20 секунд; несохранённый черновик никогда не загружается в D1.
- В разделе «Мои билды» яснее обозначена операция восстановления/переноса: персональный секрет нужно сохранить **до** полной очистки браузера. Если код утерян, а авторизации по аккаунту нет, уже существующие записи в D1 нельзя однозначно открыть заново.
- Переключатель RU/EN теперь реагирует даже при ещё не загруженном игровом каталоге, а доступные статические переводы применяются сразу. Полная локализация всех игровых описаний остаётся отдельной задачей.
- Добавлены проверки механизмов восстановления, ограничений доступа и смены языка без данных; автосохранение уже созданных билдов подтверждено в Chromium в 0.185.0.

## 0.185.0 — 2026.11.01.185 · Правильная облачная библиотека и исправления по скриншоту

- **Существующие сохранённые билды** автоматически обновляются в Cloudflare после пользовательских изменений: состояние и прежний ID сохраняются в локальной библиотеке, запись отправляется с задержкой, без нажатия «Сохранить» на каждую правку. Без сети сохранённая редакция остаётся в браузере до последующей синхронизации.
- **Новый несохранённый персонаж никогда не становится облачным билдом автоматически.** Сохранение в библиотеке впервые выполняется только по явному действию пользователя («Сохранить билд» или «Сохранить и создать»).
- D1 является главным источником для существующего ID при синхронизации независимо от локальной временной метки. Отличающаяся локальная редакция ранее сохранённого билда сохраняется отдельной копией без затирки облачного оригинала.
- Исправлен ошибочный заголовок «Слот: weapon» в окне экипировки: используется русское название предмета из каталога, а при отсутствии названия — русское имя слота.
- Переключатель языка оформлен как два отдельных RU и EN с наглядным выбранным состоянием и переводом главных разделов. Это **первый этап** полноценной RU/EN локализации; часть игровых описаний по-прежнему может оставаться на русском.
- Маркеры открытия навыков разнесены по трём вертикальным уровням, чтобы плотная группа маркеров меньше перекрывалась; подсказки с иконками и описаниями сохранены. Короткие подписи «Очки ветки» разгружают правую колонку.
- Добавлены Node-проверки новых правил, отдельный Chromium-сценарий автоматической записи существующего билда и отсутствия записи нового черновика. Планирование 1–55 и прежние сохранения сохранены.

## 0.184.0 — 2026.11.01.184 · Защита от неверных слотов в старых и повреждённых билдах

- Предметы из сохранённых старых/неполных данных учитываются в статах, душах, заточке и комплектах только при существующем слоте с совпадающим `slot` из официального OS-каталога. Несуществующие индексы, предмет в чужом слоте и обычные расходники больше не могут ошибочно увеличивать характеристики.
- Неверные поля не удаляются при восстановлении: остаются доступными для дальнейшей ручной миграции. Книга героя пропускает ошибочно расположенные записи, не показывая их как действующую экипировку.
- Добавлена исполняемая проверка реального `equipmentIssue` с настоящими OS предметами и вариантами некорректных данных.
- Исправлен браузерный тест, ошибочно ожидавший кнопку «Снять предмет» на странице свойств, тогда как она находится во вкладке «Выбор». В сценарии теперь используется настоящий путь пользователя.

## 0.183.0 — 2026.11.01.183 · Планирование экипировки до 55-го уровня заранее

- Список вещей в редакторе больше не скрывает соответствующие профессии и слоту предметы 50–55-го уровня у героев более низкого уровня. Можно заранее сформировать будущую экипировку без необходимости сначала поднимать текущий уровень персонажа.
- Предметы для будущего отмечаются «Будет доступен с N уровня» и подаются после доступных сейчас вещей. После выбора вещь и настройки сохраняются в билде, но расчётное ядро исключает её бонусы до выполнения уровня.
- Диапазон 1–55 строго соблюдается: предметы с минимальным уровнем 56+ не включаются; класс, слот, пол и специальные ограничения происхождения по-прежнему проверяются.
- Регрессии используют настоящий будущий двуручный меч «Рычащий меч» (ID 422, уровень 53), в том числе Chromium-проверку экипировки при уровне 45 с автоматическим включением на уровне 53.

## 0.182.0 — 2026.11.01.182 · Двуручное оружие и щит не дают бонусы одновременно

- При подходящем двуручном оружии щит остаётся в сохранённой экипировке для будущего билда, но временно не прибавляет защиту и эффекты душ/самоцветов/комплектов и не открывает умения, которым нужен активный щит.
- Если двуручное оружие временно недоступно персонажу или герой переключился на одноручное, щит снова учитывается. Появляется понятная пометка «Двуручное оружие занимает обе руки».
- Проверено на исходных OS предметах 401 «Меч двойного удара», 17001 «Легкий щит», 1 «Спата», 422 «Рычащий меч», включая будущий 53-й уровень. Добавлены Node-регрессии и тест браузера с уровнями 40, 3, 55.
- В CI добавлено кеширование закреплённой версии Chromium, чтобы не скачивать браузер при каждом последующем прогоне. Диапазон планирования 1–55 сохранён.

## 0.181.0 — 2026.11.01.181 · Условия снаряжения без удаления вещей и полное мастерство в книге героя

- Персонаж может сохранить надетый предмет для будущего билда, но если выбранные уровень, профессия, слот либо известные правила происхождения не позволяют его носить, предмет временно не даёт бонусов ОЗ/ОМ, атрибутов, атаки, защиты, душ, самоцветов и комплектов.
- Недоступная экипировка остаётся в слотах, но отмечается значком и пояснением «Не действует»; при возвращении на подходящие параметры снова учитывается. Будущий уровень 55 не урезан до серверного 45.
- Книга героя и калькулятор теперь одинаково используют зелёное освоение всех веток и проверяют доступность оружия/щита для выбранных боевых усилений.
- Добавлены тесты по настоящим предметам OS, классовой доступности, требованиям 38/40-го уровней и сценарий Chromium с прибавкой 50 ОЗ от шапки после достижения нужного уровня.

## 0.180.0 — 2026.11.01.180 · Защита от потери разных редакций билда

- Исправлена синхронизация локальных и облачных билдов: если редакции различаются, проигрывающая редакция остаётся отдельной копией с собственным ID. Это действует даже при равных отметках времени и при более новой редакции с другого устройства.
- Выбранный локальный билд не теряется при совпадении ID: приоритетная облачная версия остаётся на исходном ID, а активный локальный черновик привязывается к сохранённой копии. Удалённые билды и ожидающие удаления записи не восстанавливаются.
- Worker получил атомарную проверку равных временных меток: идентичная повторная запись допустима, отличающееся содержимое получает конфликт 409 вместо молчаливой перезаписи. Сохранены правила старых версий и tombstone.
- Добавлены отдельный тестируемый модуль объединения библиотек, Node-регрессии и Chromium-сценарий с двумя конфликтующими сохранениями и F5. Реальный D1 не мутировался.

## 0.179.0 — 2026.11.01.179 · Автоматический каталог расходников ОЗ, ОМ и снятия состояний

- В расчётном ядре устранены жёсткие списки ID расходников: читаются реальные структурированные эффекты EP_HEAL_LIFE, EP_HEAL_MANA, процентные варианты и EP_RECOVERY_*.
- Из текущего OS-снимка найдено 20 предметов восстановления: восемь с ОМ или смешанным лечением и двенадцать только с ОЗ. Книга героя показывает новую компактную раскрываемую секцию ОЗ, а предметы с двумя эффектами не дублируются.
- По данным каталога остаются девять предметов снятия состояний, но новый подход автоматически увидит будущие подходящие предметы. Не приписываются бонусы оружейного самоурона, неизвестные состояния или проценты без источников.
- Добавлены реальные тестовые примеры, будущие предметы и браузерная проверка 12 позиций ОЗ. Диапазон 1–55 и существующие сохранения сохранены.

## 0.178.0 — 2026.11.01.178 · Изолированный сценарий D1 и браузерные проверки лекарств

- Реализован ручной GitHub Actions workflow с явным разрешением записи временного тестового билда в production D1. Сценарий проверяет изоляцию владельцев, снимок публичной ссылки, удаление, отзыв ссылки (410) и запрет восстановления удалённого идентификатора (409).
- Для теста генерируются два независимых случайных ключа и новый идентификатор; существующие пользовательские билды не читаются и не меняются. В аварийной ветке выполняется до трёх попыток удаления. Тест создаёт tombstone в D1 и по умолчанию не запускается.
- Chromium дополнен проверкой девяти лекарств снятия состояний и подписей в книге героя.
- До реального ручного запуска проверка записи и удаления в облачной D1 остаётся неподтверждённой.

## 0.177.0 — 2026.11.01.177 · Расходники для снятия негативных состояний

- В книге героя → «Восстановление» появился компактный раскрывающийся перечень девяти реальных расходуемых предметов из каталога OS. Нажатие открывает предмет в энциклопедии.
- Из структурированных EP_RECOVERY_* извлекаются снятие ожогов, болезней, заморозки, яда, немоты, проклятия и безумия. Эти эффекты не выдаются за восстановление ОЗ/ОМ, иммунитет либо постоянный бонус персонажа.
- Добавлены регрессионные проверки реальных игровых записей и устойчивости к неполным данным.

## 0.176.0 — 2026.11.01.176 · Бонусы дальности атаки и стрельбы OS

- В книге героя → «Атака» отдельно показаны бонусы дальности атаки и стрельбы из реально надетых предметов и соответствующих ограничений заточки.
- Структурированные эффекты EP_RACE_RANGE и EP_BOW_RANGE не удваиваются за счёт парных EP_RACE_CARRY и EP_BOW_CARRY. Базовая дальность оружия и серверные формулы попадания не домысливаются.
- Добавлены тесты по «Прицелу», «Берету охотника», «Охотничьему кольцу» и рассветному шлему цверга, включая снятие предметов и условия заточки.

## 0.175.0 — 2026.11.01.175 · Все ветки освоения и строгая проверка боевых навыков

- Калькулятор получает зелёное мастерство каждой игровой ветки, включая Благословение, Экзорцизм и другие, вместо единственной ветки рубящего оружия. Требования будущих навыков теперь могут проверяться по действительному освоению.
- Выбранные активные боевые усиления не применяются, если источник OS запрещает изучение или содержит неподтверждённую зависимость. Отдельные расчёты боя и выбора навыков принимают только уровни 1–55.
- Добавлены регрессионные сценарии на расхождение синих/зелёных очков, будущие требования навыков, невыполняемые зависимости и некорректный уровень. Формулы урона без источника не добавляются.

## 0.174.0 — 2026.11.01.174 · Предельный уровень 55 и готовность библиотеки D1

- Расчётное ядро принимает уровни 1–55 и отклоняет ошибочные значения 56+, отрицательные и дробные; лимит игрового сервера 45 не ограничивает планирование будущего персонажа.
- Проверка опубликованного Worker теперь дополнительно требует готовности D1-библиотеки сохранённых билдов, отдельно от ссылок и каталога.
- Добавлены регрессионные проверки сохранности верхнего уровня 55 и готовности облачного функционала.



## 0.173.0 — 2026.11.01.173 · Проверка условий активных умений ветра

- «Помощь ветра» и «Благословение ветра» учитывают действительные ограничения класса, уровня и условия изучения, а не только сохранённую галочку.
- Уточнены проверки необходимых очков мастерства и предварительных умений для изменений каталога OS; неверные или чрезмерные значения бонусов блокируются.
- Дополнительные регрессионные тесты сохраняют правильную работу уже существующих умений 28-го уровня.



## 0.172.0 — 2026.11.01.172 · Проверка всего каталога Cloudflare D1 и переводов

- Расширена проверка реальной базы D1: все 19 наборов данных вместо прежних пяти, включая монстров, добычу, карты, подземелья, торговлю NPC, сундуки, подробные игровые таблицы и английские строки.
- Для каждого набора требуется успешный ответ, непустые JSON-данные, источник D1 и корректный CORS с GitHub Pages.
- Используются только чтения, без изменения пользовательских билдов или данных админки.



## 0.171.0 — 2026.11.01.171 · Оглушение Железным посохом

- Добавлен предпросмотр эффекта «Железного посоха» из OS: при физической атаке 4% шанс оглушить цель. Эффект не превращается в несуществующий ID умения и не изменяет постоянную защиту от оглушения.
- Сохранена защита от показа спорного шанса, если он отличается в описании и структурированных данных.
- Исправлена проверка интеграции периодического восстановления после добавления отдельного расчёта зелий ОМ; новые исходные тесты проверяют оружие и корректность условия срабатывания.



## 0.170.0 — 2026.11.01.170 · Точные значения зелий маны по OS

- Книга героя → «Зелья и умения»: добавлена отдельная группа предметов, восстанавливающих ОМ, с переходом в энциклопедию и актуальными именами OS.
- Поддерживаются фиксированные 30/60/90 ОМ, зелье на 15% от максимального ОМ, «Таинственное зелье» (145 ОЗ и 75 ОМ) и «Вкусное шампанское» (5% ОЗ и 10% ОМ), другие подтверждённые источники.
- Максимум ОМ берётся из расчёта билда, включая характеристики, снаряжение и усиления. Известный Remaked множитель зелий применяется только к ОЗ — влияние на ОМ пока не подтверждено.
- Новый набор тестов использует оригинальные OS эффекты из каталога; Chromium проверяет появление значений в книге героя.



## 0.169.0 — 2026.11.01.169 · Ссылка на билд в другом браузере и отзыв доступа

- Автоматизирован полный сценарий получателя: в отдельном браузере уже есть черновик 22-го уровня, отмена открытия ссылки его не меняет, а подтверждённое открытие загружает билд 55-го уровня.
- Проверено сообщение при удалённом исходном билде (HTTP 410): ссылка отзывается, а текущий персонаж остаётся на месте.
- Это браузерные тесты с изолированным API; никаких чужих билдов и записей Cloudflare D1 проверки не затрагивают.



## 0.168.0 — 2026.11.01.168 · Надёжная диагностика опубликованного сайта и Cloudflare

- Проверка публичного Pages/Worker/D1 запускается и при смене версии сайта, не только по событию публикации и ежедневному расписанию.
- Добавлено ограниченное ожидание появления нужной версии на GitHub Pages перед проверкой D1 и CORS, чтобы избежать ложных падений во время развёртывания.
- Диагностика использует только открытые запросы и не меняет базу, билды или административные настройки.



## 0.167.0 — 2026.11.01.167 · Геометрия интерфейса и снимки пяти разрешений

- Добавлена проверка центрирования портрета, корректного курсора, сохранения изображения целиком, взаимного положения панелей и отсутствия горизонтальной прокрутки.
- В Chromium автоматически проверяются разрешения 1366×768, 1920×1080, 2560×1440, 3840×2160 и мобильное 390×844.
- В результатах GitHub Actions сохраняются JPEG-снимки всех пяти размеров и JSON с измерениями, доступные для проверки дизайна. Игровая математика не изменялась.



## 0.166.0 — 2026.11.01.166 · Контроль публикации и браузерная книга героя

- Добавлена отдельная автоматическая диагностика публичных GitHub Pages, Cloudflare Worker, набора данных D1 и CORS: после публикации, ежедневно и по ручному запуску.
- Проверки работают без секретов и без изменения пользовательских данных; подтверждают HTTP-доступность и соответствие опубликованной версии.
- Браузерный тест дополнен раскрытием нового раздела периодического восстановления, проверкой читаемости и корректного отображения игровых умений.



## 0.165.0 — 2026.11.01.165 · Проверка реальной выдачи и копирования ссылки на билд

- Добавлена браузерная проверка полного пользовательского сценария: сохранить персонажа 55-го уровня, создать ссылку, проверить содержимое снимка через API и скопировать ссылку в системный буфер.
- Отдельно проверяется подмена данных по ссылке: вместо ложного уведомления об успехе отображается ошибка, адрес не выдаётся.
- Сетевые ответы Cloudflare имитируются в изолированной проверке Chromium, база игроков не изменяется. Живая доступность Worker/D1 требует отдельной проверки.



## 0.164.0 — 2026.11.01.164 · Периодическое восстановление умений

- Перенесены отдельные формулы восстановления ОЗ и ОМ каждые 2 секунды для «Регенерации», «Восстановления» и «Природного восстановления» из Legacy Remaked.
- Сопоставлены действующие ID умений из OS, класс, уровень и необходимые очки мастерства; недоступные умения не дают автоматических бонусов.
- В «Книге героя → Зелья и умения» появился компактный раскрываемый предпросмотр. Это ориентировочные значения действия умений, не постоянное восстановление персонажа.
- Контрольный реестр: 17 BASE/PREVIEW, 77 PARTIAL, 39 NOT YET PORTED, 10 BUFF PREVIEW; добавлены тесты будущих уровней и некорректных требований.



## 0.163.0 — 2026.11.01.163 · Завершение проверок будущих уровней

- Исправлена опечатка экранирования в новом тесте начального уровня персонажа, игровая логика не изменялась.
- Предыдущий прогон реального Chromium подтвердил как настольную, так и сенсорную мобильную версию; Node и браузерный workflow повторно выполняются на текущем коммите.



## 0.162.0 — 2026.11.01.162 · Будущие предметы до 55 уровня и сенсорная книга героя

- Закреплена проверками сохранность всех 35 предметов из собственного каталога с требованиями уровня 46–55: будущие вещи доступны в планировщике при достижении нужного уровня и профессии, а не обрезаются лимитом сервера 45.
- Добавлены браузерные сенсорные проверки книги героя на узком мобильном экране и горизонтального переполнения интерфейса.
- Расчётные формулы и содержимое игрового каталога не изменялись; новые проверки предотвращают регрессии в будущих обновлениях.



## 0.161.0 — 2026.11.01.161 · Исправление браузерного тестового сервера

- Устранено ошибочное отклонение локальных HTTP-запросов: тестовый сервер теперь корректно обслуживает HTML и JavaScript из корня проекта.
- Добавлен HTTP-интеграционный тест доступности главной страницы и исходников, а также правильного ответа на отсутствующий файл.
- Повторная полноценная браузерная проверка выполняется в Chromium Actions; код игрового сайта и формулы не затронуты.



## 0.160.0 — 2026.11.01.160 · Диагностика загрузки Chromium

- Уточнено условие готовности страницы для браузерного теста: свёрнутые ветки навыков не должны блокировать проверку уже загруженного портрета.
- При проблеме инициализации CI покажет состояние DOM, сообщения браузерных исключений и неудачные локальные загрузки; остальные реальные действия теста сохранены.



## 0.159.0 — 2026.11.01.159 · Браузерные проверки в настоящем Chromium

- Добавлен отдельный workflow Playwright Chromium: реальное открытие и закрытие Книги героя, навигация между разделами, работа клавиатуры, уровня 1–55 и создания нового билда с сохранением несохранённого черновика по выбору.
- Добавлен статический сервер для браузерных проверок без обращения к рабочей базе D1 и без изменения данных игроков.
- Состояние Chromium smoke подтверждается фактическим результатом CI; успешный npm test сам по себе не доказывает E2E.



## 0.158.0 — 2026.11.01.158 · Проверка точного содержимого ссылки на билд

- После создания ссылка выдаётся только при успешном ответе Cloudflare Worker и совпадении всего снимка с исходным билдом: уровень, снаряжение, души и очки развития включены.
- Добавлены исполняемые тесты неверного/устаревшего снимка, отсутствующего ответа и неподходящей схемы, в том числе для 55-го уровня.
- При недоступном системном буфере обмена подсказка о выделении ссылки подходит не только для Ctrl+C, но и для мобильного браузера.



## 0.157.0 — 2026.11.01.157 · Проверки книги героя, сохранений и игрового UI

- Обновлены тесты единственного входа в Книгу героя, объединённой прокачки и работы сохранённых билдов без лишних кнопок и дублирующих разделов.
- Сохранена обратная совместимость с историческим полем руны без показа игроку несуществующего переключателя.
- CI проверяет полный набор регрессий. Подтверждение браузера, D1 и Worker остаётся отдельным от тестов Node.



## 0.156.0 — 2026.11.01.156 · Восстановлены регрессии текущего редактора и формул

- Исправлены исполняемые тесты происхождения, макеты элементов браузера и устаревшие ожидания от полосы навыков, маркеров и книги героя.
- Сохранено правильное округление ОМ по сотым и действующие иммунитеты; прежние проверки не заставляют возвращать технические подписи.
- Полный тестовый прогон выполняется через GitHub Actions. Браузерная и серверная приёмка отдельно не подтверждены.



## 0.155.0 — 2026.11.01.155 · Ремонт повреждённых проверок и корректное округление

- Восстановлен повреждённый исходник тестов характеристик происхождения, устранены несовместимости тестовых заглушек с текущим интерфейсом.
- Починено распознавание всех 143 ключей аудита Remaked: прежняя регулярка неверно воспринимала символы экранирования и захватывала тысячи строк.
- Обновлены числовые ожидания округления магической атаки до десятых и порога ближнего мастерства без изменения формул; исправлена проверка лимита 55 в соответствующем модуле.
- Проверка продолжается полной CI, браузерная/Cloudflare-приёмка отдельно не подтверждена.


## 0.154.0 — 2026.11.01.154 · Автоматические проверки и защита ссылок и уровней

- Подключена GitHub Actions CI: при обновлении исходной ветки и в pull request выполняются полноценный npm test и проверка согласованности версии.
- Добавлены регрессионные проверки: реальный ответ API перед выдачей ссылки, поле ссылки с копированием, новый герой с 1-го уровня, планирование до 55-го уровня независимо от временного лимита сервера.
- Автоматические проверки не заменяют браузерный E2E и реальную проверку Worker/D1; до получения результата CI статус полного тестового прогона не подтверждён.


## 0.153.0 — 2026.10.31.153 · Актуализированы регрессии по EXP, снижению входящего урона и случайным срабатываниям

- Обновлены проверки после добавления отдельного бонуса к опыту — старая структура расчётного результата больше не считается неизменной.
- Исправлена классификация в тестах: снижение входящего физического урона уже рассчитывается, тогда как случайные срабатывания умений остаются условными.
- Введены отдельные проверки обеих механик; полный npm test и браузерный E2E ещё не подтверждены.


## 0.152.0 — 2026.10.31.152 · Исправлена подпись радужных самоцветов и статус загрузки изображений

- Исправлено двойное название радужных самоцветов в книге героя, появившееся после сокращения технических пояснений.
- Уточнён статус изображений при внешнем источнике: он больше не утверждает, что все файлы гарантированно загружены.
- Добавлены регрессионные проверки подписей. Полный npm test и E2E по-прежнему необходимы.


## 0.151.0 — 2026.10.31.151 · Чистые игровые подписи и упрощённые сообщения о загрузке иконок

- Удалены оставшиеся технические пометки прямо в строках результатов: «частичный показатель», пояснения о непроверенном округлении и необходимости проверки самоцветов. Значения и сами условные эффекты сохранены.
- Статус загрузки иконок теперь не показывает обычным игрокам счётчики внутреннего архива и подробности импорта.
- Добавлены проверки отсутствия служебных надписей; полный npm test и браузерная приёмка остаются отдельными задачами.


## 0.150.0 — 2026.10.31.150 · Получаемый опыт от экипировки и перенос ветки EXP Remaked

- В книге героя появились бонусы к получаемому опыту от экипированных вещей. Для реального предмета «Плащ новичка» ID 18073 подтверждено +5% из структурированного эффекта EP_VOLUME_EXP.
- Учтены ограничения заточки, нет дополнительных вымышленных коэффициентов награды. Ветка Remaked EXP переведена в PARTIAL: 41 неперенесённый и 77 частичных ключей.
- Добавлены числовые проверки по текущему каталогу OS. Полная проверка Node и реальный серверный EXP остаются открытыми.


## 0.149.0 — 2026.10.31.149 · Актуализированы старые тесты и сохранена совместимость исторической руны

- Обновлены устаревшие тесты, требовавшие вернуть в интерфейс запрещённые технические надписи и старую структуру итоговых показателей.
- Сверка восстановления ОМ теперь учитывает отдельную компоненту от экипировки.
- Для обратной совместимости исторический флаг руны «Чо Ын» сохраняется при обмене билдами, однако без неподтверждённой активации её бонуса в актуальном OS.
- Продолжается тестирование отдельных модулей; полный npm test пока не подтверждён.


## 0.148.0 — 2026.10.31.148 · Убраны технические пояснения из происхождения и исправлены регрессии тестов

- Убраны ещё два технических пояснения о Remaked/OS из обычных разделов усилений, а также сообщение о неполноте расчёта под ОЗ/ОМ.
- Обновлён старый тест ОЗ/ОМ: проверяет игровые числа и понятную подпись доступности, с корректной подстановкой вызываемого компонента зелий.
- Публикация повреждённого сохранения теперь показывает ошибку внутри карточки; восстановление библиотеки по коду требует хотя бы один действующий билд, а не только историю удалений.
- Добавлены регрессионные проверки. Полный npm test и реальный браузерный E2E пока не заявлены выполненными.


## 0.147.0 — 2026.10.31.147 · Исправлено копирование кода библиотеки и проверка пустого кода

- Исправлена работа кнопки личного кода: первое нажатие показывает и выделяет код, второе копирует его. Исключены повторяющиеся обработчики клика.
- Код, который не связан ни с одной сохранённой записью D1, больше не заменяет действующее подключение. Пользователь видит предложение проверить код.
- Добавлены регрессионные проверки состояния кнопки и ошибочного подключения. Полная браузерная и Cloudflare-приёмка ещё необходимы.


## 0.146.0 — 2026.10.31.146 · Безопасный перенос облачной библиотеки между устройствами

- Появился свёрнутый раздел переноса библиотеки: личный код показывается только по явному нажатию и позволяет подключить сохранения D1 на другом устройстве без JSON-экспорта.
- Перед подключением выполняется проверка кода на сервере, локальные и облачные билды объединяются. Перенос блокируется при наличии неотправленных удалений, чтобы не перенести их в чужую библиотеку.
- Ключ не включается в публичные URL и исходники. Для игрока поясняется, что код является секретом доступа, а не обычной короткой ссылкой.
- Добавлены тесты интерфейса и отказа при очереди удалений; живой браузерный сценарий и ротация ключей остаются открытыми.


## 0.145.0 — 2026.10.31.145 · Проверка классового лимита пассивки и чистый интерфейс книги героя

- Проверка пассивки «Устойчивость» дополнена ограничением ветки для конкретного класса: персонаж с пределом ниже 26 очков не получает бонус даже при некорректном старом сохранении.
- В обычной книге героя больше не выводятся методологические и технические предупреждения о неполноте формул. Служебные пояснения доступны только администратору.
- Из итоговых карточек убраны подписи «Частично», а у чисел ОЗ/ОМ — технический текст доступности.
- Сохранены игровые значения и полезные пояснения; добавлены тестовые проверки. Полный Node test и E2E отдельно не подтверждены.


## 0.144.0 — 2026.10.31.144 · Одиннадцать ветвей сопротивлений и пассивка «Устойчивость» по OS

- Пассивка «Устойчивость» (OS 260007001) учитывает реальное требование зелёного мастерства 26, доступность профессии и три уникальных эффекта TARGET по +15. Дублирующий CASTER-эффект не суммируется.
- Добавлены сопротивления от расовой способности дворфа (+10 к оглушению/падению), титулов огня/льда/грозы (+5 к соответствующему состоянию), вместе с существующими структурированными эффектами экипировки.
- В реестре Remaked 42 отсутствующих и 76 частичных ключей. Недоказанные вероятности накладывания статусов не отображаются как точная модель.
- Дополнены исходные числовые тесты; фактический полный npm test и браузерный E2E пока не подтверждены.


## 0.143.0 — 2026.10.31.143 · Безопасная синхронизация офлайн-правок и защита D1 от запоздалых сохранений

- Исправлена потеря офлайн-правок при восстановлении библиотеки: клиент выбирает более свежую локальную редакцию и повторно отправляет её в облако.
- Защищено одновременное сохранение: D1 отклоняет старые запросы и не восстанавливает удалённый оригинал даже при запоздалом PUT.
- Сохранения снабжены последовательными метками времени по каждому билду; ошибки «более новая редакция» и «оригинал удалён» различаются.
- Дополнены регрессионные тесты; полный npm test и реальный браузерный E2E ещё не выполнены.


## 0.142.0 — 2026.10.31.142 · Поиск по сохранённым билдам без лишних кнопок

- В управлении библиотекой с шестью и более билдами появился компактный поиск по имени, расе, классу и уровню.
- Фильтр работает непосредственно на карточках, не затрагивает сохранения, и показывает понятное сообщение при отсутствии совпадений.
- В маленькой библиотеке дополнительного поля нет; лишних кнопок общего доступа не появилось. Полный npm test и браузерный E2E отдельно не проверены.


## 0.141.0 — 2026.10.31.141 · Сохранение связи с открытым билдом после закрытия браузера

- После закрытия и повторного открытия браузера редактор восстанавливает идентификатор ранее открытого сохранённого билда вместе с черновиком.
- Повторное сохранение обновляет исходную запись вместо случайного дублирования. Новый персонаж и чужая ссылка отвязываются от ранее открытого билда.
- Добавлены проверки сохранения ID и безопасной работы при ограниченном хранилище браузера; браузерный E2E ещё требуется.


## 0.140.0 — 2026.10.31.140 · Исправлены проверки жизненного цикла D1 и отзыва ссылок

- Исправлена эмуляция D1 в тестах: проверка статуса исходного билда больше не выдаёт ложный HTTP 500, а отсутствие таблицы связей не имитируется как её присутствие.
- На SQLite отдельно проверена сортировка одного действующего билда и 300 удалённых записей: действующий билд остаётся первым, ни одна запись не теряется.
- Полный npm test, браузерный E2E и реальная операция Cloudflare D1 не объявлены проверенными.


## 0.139.0 — 2026.10.31.139 · Надёжный список билдов после массовых удалений

- Исправлена выборка Cloudflare D1: 250 последних записей могли состоять из удалённых билдов и скрывать старые действующие сохранения.
- Действующие персонажи сортируются раньше истории удалений; снято ограничение 250 строк, при этом данные об удалении сохраняются для синхронизации.
- Добавлен тестовый сценарий с 275 удалениями и персонажем 55-го уровня. Полный npm test и браузерный E2E остаются к выполнению.


## 0.138.0 — 2026.10.31.138 · Повторный обмен билдом без дублирования коротких ссылок

- Повторное «Поделиться» для неизменного сохранённого билда возвращает прежнюю короткую ссылку, не расходуя лимит создания новых ссылок.
- После изменения параметров персонажа сохраняется старый публичный снимок и создаётся отдельная ссылка новой версии; удаление оригинала отзывает все версии.
- Расширены тесты жизненного цикла в D1-модели. Настоящая браузерная и полная Node-проверка не заявляются выполненными.


## 0.137.0 — 2026.10.31.137 · Срабатывания предметов и душ по реальным OS эффектам

- Добавлены названия и условия срабатывания умений от предметов и душ при ударе и при получении урона, включая ограничения заточки.
- Обнаружено расхождение у «Души вампира»: описание 4%, структурированный шанс 5%. До подтверждения источника процент скрыт, навык «Кража жизни» остаётся видимым.
- Случайные эффекты не прибавляются к гарантированным значениям атаки и защиты. Добавлены проверки по реальному каталогу OS; полный npm test и E2E ещё не пройдены.


## 0.136.0 — 2026.10.31.136 · Шесть душ против типов существ и пять частичных ветвей Remaked

- Перенесены отдельные бонусы защиты против животных, демонов, нежити, ящеров, призраков и големов из шести реально существующих душ OS; книга героя показывает их как условные показатели.
- Пять ветвей Remaked переведены в PARTIAL (53 неперенесённых, 65 частичных); големы не отождествляются с неодушевлёнными без проверки.
- В изолированном JS выполнены числовые проверки шести реальных душ и ограничений заточки. Полный npm test и живой браузерный E2E не подтверждены.


## 0.135.0 — 2026.10.31.135 · Короткие ссылки только из D1 и корректный лимит активных билдов

- Cloudflare Worker создаёт короткую ссылку исключительно из сохранённого оригинала в D1, подтверждая владение и не доверяя произвольным данным в запросе.
- Лимит 200 билдов теперь относится к действующим записям: удалённые билды не занимают доступные места.
- Расширены регрессионные сценарии подмены данных ссылки и синхронизированы версии ассетов. Полная браузерная и Node-проверка отдельно не подтверждена.


## 0.134.0 — 2026.10.31.134 · Корректные регрессионные проверки сохранения и повторного открытия билдов

- Согласованы проверки сохранения и открытия билдов с текущей архитектурой: источник загружается из актуального состояния библиотеки, а не устаревшей карточки.
- Релизные версии и кэш-ключи синхронизированы. Полный npm test и живые проверки браузера не запускались.


## 0.133.0 — 2026.10.31.133 · Защита от устаревшего снимка и контроль отложенного удаления

- Исправлено открытие устаревшего снимка после «Сохранить текущий и открыть», особенно при выборе того же билда.
- Удаление в Cloudflare всё равно выполняется, если браузер не смог записать очередь автономного удаления. Если ни один способ не сработал, пользователь получает явное предупреждение.
- Тесты по смене билдов обновлены; полномасштабный npm test и браузерный E2E отдельно не подтверждены.


## 0.132.0 — 2026.10.31.132 · Защита черновика при открытии другого билда

- При открытии другого сохранённого билда несохранённые изменения больше не пропадают молча.
- Внутри карточки появился компактный выбор «Сохранить текущий и открыть», «Открыть без сохранения» или «Отмена»; системного модального окна нет.
- При отсутствии изменений переход по-прежнему мгновенный.
- Добавлены регрессионные проверки; фактические E2E и полный npm test остаются необходимыми.


## 0.131.0 — 2026.10.31.131 · Очистка отозванных билдов из D1 и устойчивость к ограничениям браузера

- При удалении билда D1 теперь не только закрывает доступ к ранее созданным ссылкам, но и атомарно очищает содержимое всех связанных публичных снимков, оставляя служебную причину для уведомления получателя.
- Если новая таблица связей пока не установлена, обычное удаление локально сохранённых записей всё равно работает.
- Чтение активного билда из sessionStorage защищено от ограничений приватного браузера.
- Добавлена проверка очистки содержимого опубликованных снимков. Полный npm test и настоящий E2E требуют отдельного запуска.


## 0.130.0 — 2026.10.31.130 · Сохранение изменений без дублей, копии билдов и синхронизация библиотеки

- Открытый сохранённый билд теперь перезаписывается по своему ID при повторном сохранении, не создавая дубли.
- Добавлено «Сохранить копию», а также ручное «↻ Обновить библиотеку».
- Импортированный по ссылке герой и новый персонаж не могут случайно переписать чужую сохранённую запись.
- Имя обновляется вместе со снимком героя; при переполненном локальном хранилище операция откатывается.
- Ошибка конфликта с удалённым облачным билдом отличается от обычного отсутствия соединения.
- Публикация GitHub Pages, реальные E2E проверки и полный npm test проверяются отдельно.


## 0.129.0 — 2026.10.31.129 · Отзыв коротких ссылок при удалении билда, всплывающие уведомления и защита D1

- Сохранённые билды теперь являются источниками коротких ссылок в D1. Удаление билда отзывает все его ссылки, получателям возвращается HTTP 410 с понятной причиной. Устаревшие ссылки без информации о владельце требуют повторной публикации.
- Нельзя создать ссылку на несуществующий или чужой билд. Отложенное сохранение не может восстановить удалённый билд под прежним ID.
- Нижнее правое уведомление закрывается через 8,5 секунд или кнопкой ОК; добавлены сообщения об ошибках, офлайн-удалении и успешном отзыве.
- Удаление билда подтверждается прямо внутри его карточки, без системного confirm.
- Обновлены схема D1, клиентский UI и тестовые проверки. Полный npm test и браузерные проверки ещё не подтверждены.


## 0.128.0 — 2026.10.31.128 · Короткие ссылки внутри сохранённых билдов и D1-тесты

- Короткая ссылка и кнопка её копирования теперь располагаются прямо внутри сохранённого билда. Ошибки соединения показываются там же, без модальных окон.
- Добавлен тест полного цикла API Cloudflare D1: запись билда 55 уровня, получение, изоляция другого ключа, удаление и проверка входных данных.
- Серверное опубликование, браузерная проверка и полный npm test не заявляются выполненными.


## 0.127.0 — 2026.10.31.127 · Частичная формула верховой езды из Remaked

- Частично перенесена ветвь Remaked `RelHorse`: профессия, зелёное мастерство, титул чести; результат в книге героя.
- Неподтверждённые бонусы от предметов и серверный боевой урон не додумываются.
- Реестр: 58 отсутствующих, 60 частичных ключей. Добавлены тесты.
- Продакшен Worker, D1, полный npm test и браузерный E2E требуют отдельной проверки.


## 0.126.0 — 2026.10.31.126 · Автоподготовка D1, очередь удалений и быстрое создание нового билда

- В мастерской героя появилась быстрая кнопка нового билда с тем же встроенным выбором сохранения.
- Удаления, совершённые офлайн, ставятся в очередь; запоздалый ответ облака больше не должен восстанавливать изменённый во время запроса черновик.
- Worker при первом использовании может создать недостающие таблицы D1 для библиотеки и коротких ссылок; для этого требуется публикация новой версии Worker.
- Статическая проверка синтаксиса и браузерная регрессия по-прежнему независимы; полный npm test и живой D1 E2E не подтверждены.


## 0.125.0 — 2026.10.31.125 · Новый персонаж 1 уровня, создание билдов и D1-библиотека

- Новый персонаж начинается с уровня 1; планирование 1–55 сохранено.
- Встроенный выбор при новом билде, локальное поле названия и сохранение без браузерного prompt. Поделиться можно только конкретным сохранённым билдом.
- Приватная библиотека D1, миграция 0004, локальный резерв при недоступности облака.
- Добавлены регрессионные тесты; полный npm test, Pages, Worker и браузерный E2E ещё не подтверждены.


## 0.124.0 — 2026.10.31.124 · Бонусы комплектов актуального игрового сервера в итоговых расчётах

- Подключена отдельная игровая таблица `unison.json` (3 набора) в общем атомарном источнике D1 или локального каталога, чтобы данные предметов и комплектов относились к одной опубликованной версии.
- Бонусы наборов активируются только при одновременном наличии базовой вещи, обязательных сопутствующих предметов и нужной заточки базовой вещи; повторные ID не засчитываются как дополнительные предметы.
- Божественный комплект: полное сочетание пяти вещей даёт +200 ОМ, +12 сопротивления прерыванию, −8 к перезарядке; при +5/выше добавляются числовые улучшения от фактической формулы OS. Бонусы действительно попадают в итог ОМ, защиту и другие расчётные показатели.
- Божественные нарукавники + Щит часового: +2 ВЫН и +15% к атаке со спины. Золотой комплект при +7 распознаёт защиту от падения, но не придумывает число для статусного эффекта, который в API задан без величины.
- В книгу героя, раздел «Эффекты», добавлено отображение только активированных комплектов и их действующих бонусов.
- Добавлены тесты реальных трёх комплектов OS, заточки +0/+5/+7, отсутствующего предмета и пересекающихся наборов; в изолированной JS-среде проверены **33 сценария из восьми файлов** на момент релизной проверки.
- **55 уровень и будущие вещи остаются доступными:** временный лимит игрового сервера не ограничивает Build Studio. Серверные проки, эффекты без числовых величин, полная эквивалентность Remaked и реальный E2E пока требуют завершения.

## 0.123.0 — 2026.10.31.123 · Скорость в городе и защитные эффекты с порогами заточки

- Перенесена отдельная величина городской скорости из Remaked `MoveSPD`. У `Плаща новичка` (OS ID 18073) бонус `EP_RESTMAP_MOVESPEED_SCALE +15` добавляется к скорости в городе, **но не** к обычной скорости перемещения. Значение показывается в книге героя.
- Проверены реальные структурированные эффекты OS: `Боевые башмаки` (ID 15077) +1 к сопротивлению пробитию блока и `Душа зеркала` (ID 103001) — отражение +3 до заточки +7, +5 с +8 по +10.
- Обновлены численные тесты дополнительных эффектов экипировки и городской скорости, включая сцену героя 55-го уровня и отсутствие побочного влияния на атаку, ОЗ/ОМ и физическую защиту.
- Реестр Remaked дополнен тремя частично реализованными ветвями: `Gdebuff`, `Blocking`, `Reflection`. **59** ключей остаются неперенесёнными, **59** частично перенесены; остальные — отдельные базовые расчёты или превью.
- Постоянная поддержка билдов 1–55 (текущий лимит сервера 45 — только метаинформация) остаётся обязательным проектным требованием.
- Полный `npm test`, E2E интерфейса и сверка конечных уронов/проков с боевым сервером всё ещё не проведены.

## 0.122.0 — 2026.10.31.122 · Билды будущих уровней 55 + новые расчёты Remaked

- **Постоянная политика:** Build Studio планирует билды с 1 по 55 уровень. Временное ограничение актуального актуального игрового сервера до 45 уровня НЕ должно ограничивать планировщик; 45 оставлен только как реальная метаинформация сервера.
- Отменены ошибочно введённые в 0.120–0.121 изменения: понижение открытых билдов до 45, блокировка расчётов старых распределений и лишние сообщения. Возвращён стартовый уровень 50, максимум ползунка 55, сохранены уровни экипировки и все пользовательские очки.
- Из текущего OS-каталога сохранены предметы будущих уровней: Крепкий шлем (51), Доспех тьмы (48), Штаны тени (48), плюс другие предметы выше 45.
- Перенесены **семь формул элементальных аур** Remaked: сочетание физического самоцвета в оружии, плоского бонуса к ауре от вещей (например, «Серьга жреца», ID 22051, +2) и процентной прибавки с отдельным округлением; итог отображается в книге героя и не добавляется к физической атаке.
- Перенесены **шесть формул бонусов стихийной магии** Remaked: отдельные огонь, лёд, молния, яд, свет и тьма. В том числе учтены +5 соответствующей стихии от одного выбранного титула чести без смешения с общим коэффициентом магической атаки.
- Реестр уточнён: 13 ранее неперенесённых ключей теперь имеют частичный исходно-обоснованный расчёт, но серверная эквивалентность аур/всех возможных усилений ещё не подтверждена.
- Добавлены регрессионные сценарии будущих уровней, предметов и аур; полный `npm test` и игровая проверка ещё требуются.

## 0.121.0 — 2026.10.31.121 · Защита расчётов старых билдов при капе 45

- Обнаружена и устранена ошибка цепочки миграции: после снижения максимального уровня до 45 старый билд уровня 50/55 мог сохранять вложенные очки сверх допустимого бюджета, а книга всё равно показывала его результат как корректный.
- Добавлена проверка стоимости вложенных атрибутов на базе существующего Remaked-калькулятора очков и текущей OS-таблицы уровней, плюс независимая проверка суммарного бюджета веток навыков.
- При перерасходе или повреждённом распределении пользователю отображается короткое понятное сообщение, а недостоверный итог не выдаётся за настоящий билд. Вложенные очки не стираются; библиотека билдов автоматически не переписывается.
- Добавлены четыре регрессионных сценария, включая допустимый билд, превышение бюджета характеристик, превышение очков навыков и предупреждение в интерфейсе. Сценарии запущены в изолированном JS-раннере.
- Полный Node/browser E2E и остаточные механики Remaked из реестра продолжают требовать проверки.

## 0.120.0 — 2026.10.31.120 · Приоритет правил OS и полный контроль расчётной цепочки

- Максимальный уровень персонажа изменён с исторических 55 на **45** по официальному обновлению актуального игрового сервера от 3 октября 2026 года и действующему `data/os/tables.json`. Ползунок, стартовый герой и текущий расчёт соблюдают серверный предел; для старых билдов выше капа отображается предупреждение. Записи в библиотеке автоматически не изменяются.
- «Рывок» (ID 100051001) теперь использует реальные ограничения `weaponUse`, в том числе запрещает бонус с луком/арбалетом. Доступность галочки совпадает с боевым расчётом.
- «Сосредоточенность» (ID 100054001) теперь добавляет +100 к точности по совпадающей формуле Remaked и текущему OS, но только после освоения 26 зелёных очков мастерства рубящего оружия; выбор сохраняется в билде и ссылке.
- Исправлено разделение исходящего и входящего критического урона в книге героя. Атака с уже выбранными активными усилениями более не подписана как значение без усилений.
- Обновлён устаревший тест по составу контекста и расширена регрессия на уровни 45, типы оружия, соответствие книжных галочек расчёту, 25/26 мастерства и отсутствие неподтверждённых эффектов.
- Добавлен [протокол игровых проверок OS](docs/OS_LIVE_PARITY_CHECKS.md) с точными данными, необходимыми для сверки непубликуемых серверных коэффициентов и проков.
- Полная эквивалентность со всеми 143 ветвями Remaked и реальные серверные повреждения/округления пока не подтверждены; успешный Pages-деплой сам по себе не проверяет формулы.

## 0.119.0 — 2026.10.31.119 · Два дополнительных боевых усиления актуального игрового сервера

- «Помощь ветра» (OS ID 260006001) добавлена в книгу героя как активируемое умение для Аскета, Монаха и Экзорциста с уровня 28. Уклонение использует исходные +15 и +15% вместе с проверенным округлением Remaked.
- «Благословение ветра» (OS ID 320004001) доступно с уровня 28 классовой линии Лучника. Реальный эффект +40 влияет на итог скорости передвижения.
- Проверяются требования класса и уровня и наличие точных эффектов EP_AVOIDANCE_CONST, EP_AVOIDANCE_SCALE и EP_MOVESPEED_SCALE в опубликованном каталоге. При отсутствии подтверждения усиления не учитываются.
- Обе галочки доступны из книги героя, используют игровые названия и иконки, сохраняются в билде и не добавляются автоматически только из-за выбранной профессии.
- Добавлены сценарии численных расчётов, границ уровня, неподходящей профессии и повреждённых данных.
- Полный перенос всей математики Remaked и сценарии проверки на живом сервере продолжают оставаться открытыми задачами.

## 0.118.0 — 2026.10.31.118 · Расширенный перенос формул Remaked и проверяемый реестр

- Сформирован полный реестр исходных 178 операторов `case` и 143 уникальных ветвей Remaked с указанием исходных строк, стадий переноса и точных ссылок на проекты. 75 ветвей ещё не перенесены, другие частичные участки требуют завершения.
- Добавлены 11 формул расчёта мощности поддерживающих умений Remaked: «Грация», «Ляпис Медио», групповая защита, святое оружие, мрачный эффект, зачарования, песни и ядовитые умения. Они доступны в раскрывающемся разделе книги героя; просмотр не активирует усиление автоматически.
- Сопротивления от обычных самоцветов брони теперь включаются в итоговую защиту, а не остаются отдельно от суммарного результата; аурные и магические эффекты оружия остаются самостоятельными величинами.
- Добавлены 14 групп прямых эффектов вещей/душ на основе карты эффектов Remaked: изменение получаемого урона, скорость заклинаний, скорость восстановления ОМ, откат, отражение, аура, длительность дебаффов и другие вторичные параметры. Условия заточки учитываются.
- Показанные значения скорости заклинаний и восстановления ОМ теперь включают известные эффекты соответствующего снаряжения. Боевые проки без подтверждённой формулы урона не превращаются в вымышленные числа.
- Добавлены численные тесты одиннадцати навыков, четырнадцати EP-семейств, конечных сопротивлений и машинно проверяемого перечня формул.
- Полное покрытие всей механики Remaked, реальный `npm test` и живой браузерный контроль текущего OS остаются задачами, а не выполненными проверками.

## 0.117.0 — 2026.10.31.117 · Боевые усиления по фактическим умениям OS

- «Боевой клич», «Яростная атака», «Бастион» и «Рывок» рассчитываются из проверенных ID, требований и EP-эффектов актуального игрового каталога, а не только из статичных коэффициентов.
- Сохранённые усиления не учитываются, если не подходят классу, уровню, условиям щита или если текущий источник умений не загружен.
- Книга героя показывает оригинальные иконки навыков, краткие фактические эффекты и причины недоступности; расчёт и пользовательская доступность используют единые данные.
- Подробный бонус скорости «Рывка» теперь выводится из вычисленного значения, а не из постоянной цифры.
- Добавлены регрессионные сценарии для всех четырёх умений, изменённого EP-эффекта, неполных каталогов и интерактивных галочек.
- Полный npm test, браузерный E2E и фактическая публикация обновлённого Worker/D1 пока не подтверждены.

## 0.116.0 — 2026.10.31.116 · Согласованные данные, корректные подземелья и более удобная книга героя

- Вики теперь загружает только согласованный набор данных: вся опубликованная версия Cloudflare D1 либо весь проверенный локальный архив; смешивать часть данных D1 и часть локальной копии больше нельзя. Проверяются типы таблиц, количество записей и заголовок версии опубликованного снимка, если он доступен.
- Cloudflare Worker возвращает список подземелий массивом, как в исходном игровом каталоге, и сообщает идентификатор опубликованного D1-снимка в доступном клиенту заголовке. Клиент также совместим с прежним объектным форматом подземелий до обновления Worker.
- Основная мастерская проверяет целостность шести базовых таблиц и согласованность их D1-версии, прежде чем применять игровые данные.
- Книга героя → Защита: таблица всех доступных элементальных сопротивлений, включая нули и уязвимости. Значения не додумываются.
- Книга героя → Зелья и умения: десять подтверждённых игровых зелий показываются со своими иконками; по нажатию открывается соответствующий предмет в энциклопедии.
- Текущий расчёт OS принудительно исключает историческую руну «Чо Ын» даже при попытке передать её через старые параметры. Архивный расчёт Remaked остаётся отдельно для сравнения исторической формулы.
- Ускорены переходы между монстрами и их локациями: обратные связи предварительно индексируются при загрузке каталога, повторный просмотр не сканирует все локации каждый раз.
- Добавлены регрессионные тесты источников каталога, формата D1, зелий, сопротивлений; обновлены устаревшие проверки старой книги и удалённой руны.
- Непосредственное развёртывание Worker/D1 и полноценное браузерное E2E пока не подтверждены: исходники и тесты не подменяют проверку опубликованного сервиса.

## 0.115.0 — 2026.10.31.115 · Уточнения интерфейса книги героя и параметров монстров

- Книга героя: сокращены длинные технические заголовки атаки, защиты, сопротивлений, самоцветов и лечащих навыков. Числа и условия расчётов оставлены прежними; пояснения доступны отдельно.
- Энциклопедия: поле монстра `warding` больше не выдаётся за неподтверждённое «Уклонение» и выводится нейтрально как «Защитный показатель».
- Сохраняются все улучшения изображений, NPC-обмена, локаций и пути героя из версий 0.113 и 0.114.
- Полноценная проверка работающего сайта и загрузки изображений в браузере остаётся отдельным этапом.

## 0.114.0 — 2026.10.31.114 · Иконки душ во всех разделах

- Исправлено единое определение адресов игровых изображений душ: источник `/icons/items/` актуального игрового сервера используется не только в энциклопедии, но и в экипировке, гнёздах душ и быстрых карточках предметов.
- Сохранена поддержка пользовательских назначений иконок для душ без замены содержимого игрового каталога.
- Добавлена отдельная проверка источника изображений душ для общего кода приложения; предыдущие улучшения энциклопедии и книги героя сохранены.
- Загрузка реальных WebP в работающем браузере зависит от доступности игрового сервера и требует пользовательской проверки.

## 0.113.0 — 2026.10.31.113 · Обновлённые данные и удобство энциклопедии, книги героя и пути умений

- Сундуки: исправлен источник иконки. Изображения берутся из игровых данных предметов актуального игрового сервера для каждого ID сундука.
- Души: иконки теперь извлекаются из исходных предметов OS, а не из отсутствующих изображений отдельного каталога. Подписаны совместимые слоты и показаны известные источники получения.
- NPC-обмен: карточки с результатом, настоящими материалами и их количеством, затратами золота, чести и опыта; поиск по названиям материалов и результатов.
- Монстры: расширен набор статов, включены известные исходные значения характеристик и уровней, количества дропа.
- Локации: встроенный поиск монстров по локации, сортировка по уровням и краткий диапазон уровней.
- Путь героя: интерактивные, доступные с клавиатуры отметки навыков на шкале, показывающие иконки, названия и описание при наведении/фокусе.
- Происхождение: выбор профессии дополнен основными доступными направлениями умений из каталога класса.
- Книга героя: компактные итоги атаки и защиты, отдельные пользовательские эффекты зелий и навыков лечения; диагностическое покрытие предметов скрыто от обычных игроков.
- Несуществующая на актуальном сервере руна Чо Ын убрана из настроек и исключена из реального расчёта текущего билда (в том числе при загрузке старых сохранений).
- Чекбоксы книги, усилений и выбора билдов оформлены в стиле проекта с доступным состоянием фокуса.
- Добавлены регрессионные проверки. Развёрнутый сайт и фактическую загрузку удалённых игровых иконок нужно проверить в браузере отдельно.

## 0.112.0 — 2026-10-31 · Источники душ, настоящие названия добычи и NPC в локациях

- Энциклопедия теперь показывает в карточке души раздел «Где получить душу» со всеми уже доступными источниками из `wikiIndex.sources`: монстры с вероятностями и локациями, сундуки с иконками, NPC-обмен и групповые источники добычи.
- Если ID души присутствует в дропе монстра, но отсутствует среди обычных предметов, её имя теперь разрешается по каталогу `souls.json`, а переход открывает именно карточку души.
- В карточке локации показываются именованные NPC обмена, которые по `trades.npcs[].maps` находятся в ней; это делает ранее пустовавшие локации/поселения полезными.
- Добавлен `tests/wiki-soul-sources.test.mjs`; исходные данные не изменялись. Полный браузерный тест и проверка соответствия работающему серверу актуального игрового сервера продолжаются.



## 0.111.0 — 2026-10-31 · Технические ограничения свёрнуты отдельно от показателей героя

- В книге героя длинные служебные пояснения о недоработанных формулах, проках, версиях OS/Remaked и серверных условиях больше не загромождают основные поля атаки, защиты и восстановления. Если пользователь хочет проверить источники и точность расчётов, они доступны в закрытом по умолчанию разделе «Подробнее о точности расчёта».
- Отдельный список ещё не поддержанных эффектов экипировки остаётся внутри своего раскрывающегося раздела. Значения умений, предметов, сопротивлений, зелий и лечения продолжают отображаться сразу.
- Добавлен `tests/book-calculation-notes.test.mjs`. Доработка касается представления, а не объявления неполных формул подтверждёнными.



## 0.110.0 — 2026-10-31 · Больше локаций, награды по картам и параметры монстров

- К локальному каталогу 14 карт добавлены достоверные имена дополнительных NPC-поселений из `trades.mapNames` (без придумывания монстров/объектов), поиск работает по именам.
- Страницы локаций показывают групповой дроп из `tables.zoneDrops` с иконками каждого предмета и правильной оговоркой о вероятности всей группы, а не отдельного предмета.
- В страницах монстров отображаются имеющиеся в OS уровень, ОЗ, физическая и магическая защита, раскрываемые сопротивления; список монстров на карте включает их уровни при наличии данных.
- NPC-переходы показывают локацию из объединённых названий карт. Для игровых монстров/карт/NPC, у которых в OS нет арт-иконок, используются только подлинные текстовые имена.
- Регрессионный тест `tests/wiki-location-expansion.test.mjs`. Данные не добавлялись в D1 и требуют дальнейшего сравнения опубликованного каталога с локальной копией.



## 0.109.0 — 2026-10-31 · Фикс возврата в вики после смены раздела

- Переработано переиспользование списка энциклопедии: карточка теперь обновляется без пересборки только когда исходный DOM-контейнер ещё находится на странице; возврат из другого раздела полностью восстанавливает вики вместо вызова устаревшего обработчика.
- Исправлена последовательность `hashchange`: сначала определяется, было ли открыто то же представление, затем обновляется `activeTab`. Браузерные назад/вперёд учитывают сохранённый root.
- Добавлен `tests/wiki-navigation-history.test.mjs` для предотвращения повторного появления мерцания или пустых разделов после смены вкладки.



## 0.108.0 — 2026-10-31 · Стабильная энциклопедия, сундуки, NPC и иконки наград

- Устранён основной источник мерцания списка душ и других записей: при переходе внутри одной категории теперь обновляется только карточка справа и выделение строки, а поиск, список, прокрутка и пагинация остаются смонтированными. Прямые wiki-ссылки пишутся в history без повторного `hashchange`-перестроения; `popstate` поддерживает браузерный «Назад».
- Названия сундуков теперь берутся из `data/os/items.json` по ID `chests.boxes[].i`, вместе с их собственными иконками, вместо заглушки «Сундук». Имена NPC берутся из `trades.npcs` вместо «Персонаж».
- У дропа монстров, содержимого сундуков, товаров NPC и материалов обмена показываются реальные иконки предметов при наличии `icon` в текущей OS базе. Источники получения предметов теперь отображают имена сундуков. Если изображение монстра/NPC/локации не существует в источнике, произвольная картинка не подставляется.
- Добавлен тест `tests/wiki-stable-navigation.test.mjs` с проверками схем и источников. Полный браузерный E2E и D1 по-прежнему требуют отдельной проверки.



## 0.107.0 — 2026-10-31 · Единственный вход в книгу, чистый портрет и перенос усилений

- Убраны дополнительные кнопки «Результаты» на портрете и «Результаты»/«Усиления» под ним. Книга открывается только нажатием на изображение героя, включая Enter/Space с клавиатуры. Курсор над изображением остаётся обычной стрелкой, не «рукой».
- Кнопки «назад», «вперёд» и «закрыть» получили совершенно одинаковые размеры, отступы и оформление, с компактным размером на узких экранах.
- Все усиления убраны из **видимой** панели характеристик «Происхождения» и доступны на странице «Усиления» книги. Исходные legacy-поля оставлены в скрытом inert-контейнере только для обратной совместимости старых обработчиков и тестов; вводить настройки через них нельзя.
- Из сводки «Итоги» удалены технические комментарии и диагностическое число структурированных эффектов. Сохраняется подробная диагностика в соответствующем разделе до завершения механик.
- Добавлен регрессионный тест `tests/portrait-single-entry.test.mjs`.



## 0.106.0 — 2026.10.31.106 · Удобное управление книгой с клавиатуры и сохранение фокуса

- Стрелки влево/вправо переключают главы книги прямо в портрете, если пользователь не редактирует поле/селектор. Escape по-прежнему закрывает книгу, не затрагивая билд.
- При смене главы фокус переходит на выбранную вкладку, при изменении усиления сохраняется на том же поле и не сбрасывает прокрутку; состояние разворота доступно через `aria-expanded`.
- Вся книга оформлена как отдельная доступная область с парными `tablist/tab/tabpanel`, `aria-controls` и `aria-labelledby`. Не менялись размеры портрета, позиции слотов или формулы.
- Новая регрессия `tests/portrait-book-keyboard.test.mjs`. Полный браузерный E2E, npm test и продакшен остаются не проверены.



## 0.105.0 — 2026.10.31.105 · Поиск навыков и проверяемые параметры в книге героя

- Добавлен поиск по навыкам выбранной профессии прямо внутри главы «Эффекты» портретной книги, в свёрнутом по умолчанию блоке, чтобы не перегружать интерфейс. Используется актуальный каталог OS/D1 и уже согласованные RU/EN названия.
- Для каждого навыка показываются проверяемые данные: название, русское описание, затраты ОМ, время применения, перезарядка, число структурированных эффектов, базовые требования по уровню и мастерству соответствующих ветвей. Сложные требования оружия/состояния выделены как ещё не полностью проверенные.
- Новая маленькая библиотека `pandora-studio-skill-results.js` отделяет модель просмотра от DOM и **не выдумывает конечный урон** по нерасшифрованным `fv1/fv2`: для уронных навыков показывает только исходный тип воздействия, когда он задан источником.
- Добавлен `tests/skill-results-inspector.test.mjs` с проверками ограничений профессии, уровня, мастерства и читабельности данных. Статический код и изолированные контрольные значения проверены; полный тестовый набор и живой сервер требуют дальнейшей проверки.



## 0.104.0 — 2026.10.31.104 · Аудит полноты бонусов каждого билда и условных проков

- Добавлена честная классификация всех структурированных `EP_*` бонусов выбранной экипировки, душ и Forth: уже рассчитанные, показанные отдельно, условные боевые срабатывания и пока не поддерживаемые. Ограничения `min/max` заточки считаются отдельно, чтобы не выдавать неактивные эффекты за работающие.
- Во вкладке «Эффекты» портретной книги появился сводный счётчик и свёрнутый список конкретных предметов, у которых обнаружены неучтённые условия. Нет технических кодов в пользовательских подписях.
- Сводная страница «Итоги» и «Восстановление» не загромождаются автоматически деталями сопротивлений; предметные бонусы остаются в главах «Атака», «Защита», «Эффекты».
- Добавлен `tests/item-effect-coverage.test.mjs`; числовая классификация, Forth и душевные гейты проверены. Полный npm test, браузер и продакшен D1 ещё требуют проверки.



## 0.103.0 — 2026.10.31.103 · Сопротивления состояниям и критическому урону от вещей/душ

- Из текущих OS предметов, душ и Forth перенесено накопление `EP_IMMUNE_*` для ожогов, оглушения, заморозки, падения, отбрасывания, сна, немоты, проклятий/слабости, болезней и других состояний, а также `EP_BLOCK_BREAK_RESIST`.
- `EP_IMMUNE_VIT_TYPE` и `EP_IMMUNE_SPI_TYPE` теперь складываются с известными Remaked базовыми сопротивлениями телесным и духовным состояниям. `EP_CRITICAL_REGIST` добавляет защиту **от входящего критического шанса**, а не к своему критическому шансу; знак проверен относительно официальной таблицы Remaked enhancement effect map.
- Для эффектов душ и улучшений по-прежнему выполняются ограничения min/max уровня заточки. В портретной книге «Защита» значения подписаны человеческими названиями, без сырых технических кодов. Добавлены численные проверки `tests/status-resistance-os-effects.test.mjs`.
- Это сопротивления **по известным источникам**, без полной проверки PvP-формул и реакций противника.



## 0.102.0 — 2026.10.31.102 · Числовые формулы пяти лечащих навыков Remaked и бонус клирика 50+

- В калькулятор добавлены исполняемые формулы Legacy `js/calc.js Flag[5]` для «Первой помощи», «Лечения», «Массового исцеления», «Храма», периодического «Восстановления». Учтены уровень, интеллект, дух, врождённое+натренированное мастерство исцеления и ранее рассчитанная эффективность лечащих навыков.
- Для клирика с 50 уровня в первых трёх формулах применяются подтверждённые особые коэффициенты Remaked. Периодическое «Восстановление» не умножается на эффективность прямого лечения (так было в оригинале).
- Книга «Восстановление» показывает числа по каждому навыку и доступность по известным базовым ограничениям; если навык не открыт, результат остаётся **теоретическим**, чтобы не выдавать его за доступное умение или за подтверждённую величину живого сервера.
- Добавлены проверки `tests/remaked-healing-spells.test.mjs` с 5 числовыми векторами, клириком 49/50, недоступностью и перезаписью результатов; полный `npm test` и действующий OS клиент не проверены.



## 0.101.0 — 2026.10.31.101 · Расчёт самоцветов и эффектов заточки из Remaked

- В `pandora-os-character-calculator.js` перенесена историческая таблица `Remaked js/equip.js` +1…+10: физические оружейные ауры шести стихий, нелинейный магический бонус +1…+40, эффекты шанса состояний от огня/льда/яда.
- Для шести защитных слотов перенесены бонусы сопротивлений: обычный элемент +N, Свет даёт `floor(N/2)` к трём элементальным сопротивлениям, Тьма — +N к чарам (точное поведение старого `equip.js`). Радужные самоцветы с уникальными исключениями отдельно помечены и не выдумываются.
- Сохранённые выборы типа/стихии из редактора предмета подключены к калькулятору, итог показан в главе «Эффекты» книги. **Исторические** бонусы пока не смешиваются с современными серверными ATK/DEF: для них требуется проверка OS и специальных условий.
- После изменения самоцвета сводка результатов обновляется. Добавлен `tests/remaked-gemstone-parity.test.mjs`; численные векторы из исходника проверены, полный Node/Pages/Worker/E2E ещё нет.



## 0.100.0 — 2026.10.31.100 · Книга результатов расчёта с перелистыванием вместо портрета

- Шесть глав на прежнем месте портрета: «Итоги», «Атака», «Защита», «Восстановление», «Эффекты», «Усиления». Сводная страница собирает ОЗ/ОМ, атаку, защиту с заточкой, магическую атаку, точность, уклонение, крит. шанс, действие зелий и лечащих навыков.
- Открытие нажатием на персонажа, отдельной доступной кнопкой на портрете и кнопкой под ним; работает Enter/Space, закрытие через крестик и Escape. Стрелки, вкладки и анимация перелистывания с `prefers-reduced-motion`. Исходный размер портрета, центрирование и кольца экипировки не меняются.
- Настройки усилений перенесены **также** на собственную страницу книги без повторного хранения. Редакторы гильдии, чести, ОЗ/ОМ, активных навыков, восстановления, зелий и Проэлиума используют существующие методы валидации; навыки, недоступные по профессии/уровню/щиту, отключены. Старые свёрнутые элементы сохранены как совместимый альтернативный способ.
- Сохраняются текущая глава и положение просмотра во время редактирования; численные итоги не рассчитываются заново отдельным UI-движком. Добавлен `tests/portrait-results-book.test.mjs` и отдельные DOM-стаб проверки.
- Полный `npm test`, реальные браузеры, действующий сервер игры и Worker/D1 ещё не проверены.



## 0.99.0 — 2026.10.31.99 · Лечащие навыки, естественное восстановление ОЗ/ОМ и душевные эффекты времени

- Перенесены исполняемые Legacy `LPRec`/`MPRec` для естественного восстановления: `floor(макс.ОЗ/35)+floor(ВЫН/3)` и `floor(макс.ОМ/25)+floor(СД/3)`. Показаны отдельно от ранее реализованных скоростей восстановления, с оговоркой об историческом расчёте и неучтённых условиях сидения/серверного времени.
- Эффективность лечащих навыков `LPSkill`: 100% +10% от выбранной «Золотое сердце» (Honor2) + структурированные `EP_CAST_HEAL_LIFE_SCALE` предметов/душ/Forth, с гейтами заточки. Не смешивается с эффективностью зелий.
- Дополнительные эффекты экипировки `EP_HEAL_TIME_SCALE` (скорость восстановления ОМ) и `EP_SKILL_DELAY_FIN` (финальная скорость применения) учитываются отдельно, не складываются без проверки в индексы кастов.
- Обновлены портретные вкладки «Эффекты» и «Защита»; `tests/remaked-recovery-healing.test.mjs` проверяет формулы, бонусы чести, души и реальный Forth. Исправлен текст предупреждения интерфейса, чтобы сохранять явное упоминание непроверенных серверных условий и стабильность ранее созданного теста окна характеристик. Полный `npm test`, Pages и D1 ещё требуют отдельной проверки.



## 0.98.0 — 2026.10.31.98 · Боевые бонусы предметов и независимость формул от языка

- Исправлена ошибка с языками: особые посохи определяются **только по ID** OS 2802 (Железный посох), 2812 (Посох силы), 2841 (Проклятый посох), а не по русскому названию. Данные STAFF/WAND сохраняют исторические бонусы MATK. Смена RU/EN больше не изменяет эти числа.
- Расчёт защиты расширен для структурированных Forth `EP_ARMORCLASS_SCALE` с отдельным `ceil(базовая DEF × процент/100)` для каждого эффекта. Бонусы заточки брони, прямые надбавки, проценты, честь и выбранный активный бафф отображаются по отдельности.
- Дополнительно учитываются `EP_MOVESPEED_SCALE` (индекс движения), `EP_SKILL_DELAY` (изменение задержки навыков), `EP_ATTACK_BACKATK_RATE` (процент атаки в спину), `EP_CASTINGCANCEL_RESISTANCE_CONST` (прерывание каста) и `EP_ELEMENT_DAMAGE_SCALE` (источник магического урона). Последний **не прибавляется дважды** поверх исторического бонуса WAND/STAFF, поскольку источники могут описывать одну механику.
- Показаны отдельные значения во вкладках «Атака»/«Защита» с корректной оговоркой о частичном расчёте. Добавлен `tests/combat-item-effects-coverage.test.mjs` с реальными OS ID и формулами. Полный `npm test`, текущий сайт в браузере и Worker/D1 остаются неподтверждёнными.



## 0.97.0 — 2026.10.31.97 · Актуальные активные эффекты боевых навыков по OS

- Добавлены опциональные активные умения «Рывок» (+15 к индексу скорости атаки), «Боевой клич» (+10 и +20% физической атаки), «Яростная атака» (+30% атаки, −60% защиты) и «Бастион» (−20% атаки, +40% защиты). Проверяются профессия, необходимый уровень и обязательный щит; неподходящий бафф не влияет на расчёт.
- Важное расхождение: исторический Remaked «Бастион/Defender» использовал −30% атаки и +60% защиты; в актуальном актуального игрового сервера skill ID 100053001 явно указано `EP_DAMAGERATE_SCALE=-20`, `EP_ARMORCLASS_SCALE=40`. Применяется современная ставка, порядок округления сохраняет Remaked и всё ещё требует сверки с живым клиентом.
- Добавлен самостоятельный «Пробуждение гильдии» 0…3 (+2/4/6% физической атаки и +2/4/6 к магическому коэффициенту). Все настройки находятся в свернутой вкладке Origin и проходят проверку при экспорте билдов.
- Добавлены `tests/current-os-active-combat.test.mjs` и `tests/combat-skill-ui.test.mjs`; Source Formula fixtures проверены изолированно. Полный `npm test`, Pages и D1 остаются неподтверждёнными, GitHub Actions не запускались.



## 0.96.0 — 2026.10.31.96 · Сопоставление всех 205 RU-названий Remaked с реальными OS Skill ID

- Построена полная детерминированная матрица `data/localization/remaked-skill-identity.v1.json` для всех 205 записей `game.ru.skill_entry.*` из утверждённого словаря Remaked. Каждая запись содержит исходное имя, ожидаемую Legacy ветку и проверенные современные ID; связаны все 205 имён с несколькими вариантами игровых навыков, когда оригинальный OS содержит несколько ревизий.
- 5 исторически сокращённых названий сопротивлений применяются без догадок только для сопоставленных ID. Переезды исторических навыков между ветками (например, «Захват» и «Медитация») отмечены отдельно.
- Сайт применяет проверенные RU-названия по ID после загрузки словаря; английские локализованные названия, эффекты, цифровые идентификаторы, описание и ветки не меняются. `data/os/skills.json` и D1 не перезаписываются.
- Добавлены `tests/remaked-skill-identity.test.mjs` и проверка идентичности локального approved-словаря оригинальному репозиторию. Динамическое браузерное поведение и полный `npm test` ещё не проверены.



## 0.95.0 — 2026.10.31.95 · Заточка защиты, 162 Forth-группы, пассивки и магическая атака

- Перенесена исполняемая формула заточки Remaked Legacy: +`floor(N × 1,5)` к защите каждого надетого щита, шлема, нагрудника, перчаток, поножей и обуви. Эффект титула и прямые бонусы предметов/душ добавляются отдельно.
- Подключена текущая OS `itemForth.json`: 162 ID с конечными эффектами по ступеням заточки. При наличии конкретного значения используются его структурированные `EP_*`, а не повторно расшифрованный текст описания. Данные влияют на ОЗ/ОМ, атрибуты, атаку, защиту, точность и восстановление зелий.
- Перенесены подтверждённые групповые пассивки ремейкед: физический урон оружия гладиаторов, магическое мастерство волшебников, точность лучников и уклонение агентов с раздельным врождённым/натренированным мастерством. Расширена базовая MATK с порогами ИНТ и жезлами/посохами; добавлены позиционный урон, перезарядка от ИНТ и известные критические множители.
- Новые значения выведены в портретных вкладках «Атака» и «Защита»; отдельный `tests/armor-forth-mastery-parity.test.mjs` проверяет реальные OS Forth и Legacy-поведение. Полный `npm test`, Pages и Worker/D1 не проходили полноценную локальную/браузерную приёмку. GitHub Actions не запускались.



## 0.94.0 — 2026.10.31.94 · Точные русские названия 13 титулов чести

- Сверены по ID все 13 титулов чести с `Pandora-Saga-Simulator-remaked/localization/approved-translations.v1.json`, `game.ru.calculator.honor.0…12`. Исправлены все приблизительные названия, например «Крепкое тело» → «Сила воли», «Путь пламени» → «Том огня», «Секрет мастера меча» → «Мастер боя».
- Сами эффекты, порядковые ID, выбор в интерфейсе, совместимость сохранений и ссылок на билды оставлены неизменными. Для английских имён неподтверждённые варианты не подменялись.
- Добавлен `tests/approved-honor-ru.test.mjs` (13 названий + проверка сохранности ID/эффектов). Все другие неразобранные локализационные термины, навыки и полный расчёт остаются в плане.
- Исправлено соответствие тестового шаблона реальному виду ссылки на диапазон 13 ключей в документации Remaked; версия сайта не меняется, так как это исправление проверки исходников.



## 0.93.0 — 2026.10.31.93 · Скорость атаки/каста и расход ОМ

- Перенесены базовые индексы скорости атаки и произнесения заклинаний из Remaked: пороговые прибавки ЛОВ/СНО. Учитываются подтверждённые `EP_ATTACKINTERVAL_SCALE` предметов и душ с порогом улучшения. Индексы **не** равны ударам в секунду и фактической длительности каста.
- Реализован частичный расчёт расхода ОМ: бонус ИНТ из Remaked `100-floor(INT²/1000)`, выбранная расовая способность эльфа «Гармония» −15% (текущий OS ID 900020001) и структурированные эффекты вещей/душ `EP_RACE_MANA_COSTCUT`. Неинтерпретированные эффекты с динамикой улучшения предметов исключены.
- Информация выведена во вкладки «Атака» и «Эффекты» портрета с пояснением; добавлены 6 регрессионных проверок в `tests/legacy-speed-mana.test.mjs`. Дальнейшие эффекты навыков, защита и сравнение с live-клиентом остаются в плане.



## 0.92.0 — 2026.10.31.92 · Фавикон PS и прямые бонусы атаки/точности снаряжения

- Заменён плохо читаемый favicon на компактную «PS»-монограмму по пользовательскому эталону: золото, синие кристаллы, прозрачный фон. Основной файл `assets/favicon-ps-96.png`, 96×96; подключён через `rel="icon"` и Apple Touch Icon с текущим ключом версии, не изменяя картинку логотипа в шапке и её настройки администратора.
- `combatPreview` начал учитывать структурированные эффекты экипированных предметов/душ `EP_DAMAGERATE_CONST`, `EP_SKILL_EQUIP_DAMAGERATE`, `EP_DAMAGERATE_SCALE` и `EP_TOHIT_SCALE` при соблюдении ограничений по заточке и индивидуальном `ceil(base*percent/100)` из Remaked Legacy. В окне «Атака» показаны отдельно плоские и процентные вклады.
- Прямые эффекты подтверждены из каталога актуального игрового сервера (например, «Туника для цверга», «Сильная душа», «Ожерелье удара», «Берет охотника»). **Это частичный расчёт**: неизвестные условные эффекты, классовые пассивки и другой расчёт на сервере остаются вне суммы.
- Добавлены tests/favicon-studio.test.mjs, отдельные проверки источников расчёта и заточных ограничений. Локально проверено уменьшение и наличие прозрачного канала PNG; полный `npm test`, сайт в браузере и публикация Cloudflare остаются непроверенными. GitHub Actions не запускались.



## 0.91.0 — 2026.10.31.91 · База защиты снаряжения и безопасная неполная загрузка формул

- Добавлен предварительный расчёт защиты от надетых предметов: `AC` каждого предмета, `EP_ARMORCLASS_CONST` надетых вещей/душ с ограничениями по заточке и +5 от титула «Крепкое тело» (Remaked Legacy DEF). Структурированная душа учитывается по эффекту, но **не** как ещё одна физическая броня. В «Защита» выведены отдельные составляющие и ограничения.
- Исправлена устойчивость калькулятора: отсутствие таблицы усиления оружия для нового боевого показателя не должно скрывать корректные ранее вычисленные ОЗ и ОМ. Теперь боевой итог может быть частичным, а отложенная физическая атака показывается прочерком до появления исходных данных.
- Добавлены проверки совместного применения эффекта защиты, порогов души, титула, отсутствующей таблицы оружия и сохранности ОЗ/ОМ. Полный `npm test`, опубликованная Pages и визуальная приёмка пока не подтверждены; GitHub Actions не запускались.



## 0.90.0 — 2026.10.31.90 · Частичные атака, точность, уклонение и критический шанс

- Добавлен расчёт предварительной физической атаки по базовой формуле Remaked: СИЛ, атака надетого оружия, реальная таблица улучшения оружия OS (`weaponPlus`, в том числе отличающиеся +7…+10), пороговый бонус СИЛ и подтверждённый бонус титула «Путь пламени». Неподтверждённые активные умения/души/комплекты не включены; это не итоговая сила атаки сервера.
- Подключены базовые точность по уровню и СНО, уклонение с порогами ЛОВ и критический шанс по СНО, известные плоские бонусы предметов/душ, прямые эффекты чести. Расовые способности мирины: +5 критического шанса по актуальному OS, +10% точности и +5% уклонения показаны отдельно без неподтверждённого пересчёта процентных бонусов.
- Во вкладке «Атака» отображается предварительный расчёт вместо одних исходных характеристик оружия. Исправлены устаревшие тесты окна атрибутов и проверки номера релиза, которые ожидали уже удалённый текст и дату 30.10.2026.
- Добавлены `tests/combat-core-remaked.test.mjs`; исходные числовые примеры проверяются изолированно, но полный `npm test`, реальная публикация и визуальное тестирование требуют отдельного запуска. GitHub Actions не запускались.



## 0.89.0 — 2026.10.31.89 · Учёт врождённого мастерства при пассивных формулах Remaked

- Исправлен подтверждённый источниками недочёт предыдущего переноса: в Remaked зелёное мастерство = **врождённое освоение класса + дополнительно тренированное**, а не только тренированное. Стартовые значения берутся из OS `data/os/tables.json → jobInit[baseClass].branches`, а не из синих очков прокачки.
- Для «Улучшения лечения» воинской линии пять врождённых веток дают суммарно 18 очков, значит с 12 уровня без распределения навыков уже есть +10% к действию зелий. Дальнейший бонус использует обе зелёные части и пороги floor(.../10)×10.
- Исправлено «Вдохновение» жреческой линии: 15 врождённых зелёных молитв входят в расчёт ДУХ вместе с дальнейшим обучением. Старая формула занижала эффект при одинаковой сборке.
- Дополнены регрессии для стартовых mastery и контракта передачи текущей профессии в калькулятор. **Полный `npm test`, живой OS-клиент и визуальная приёмка не подтверждены; GitHub Actions не запускались.**



## 0.88.0 — 2026.10.31.88 · Сопротивления и восстановление гильдии по формулам Remaked

- Реализован частичный расчёт сопротивлений из Remaked `RES*`: базовые физические/ментальные состояния по ВЫН/ДУХ, известные бонусы чести и предметов/душ, пассивные «Приспособляемость», «Стойкость разума», «Каменная кожа» и «Антимагия». Показатели показываются в карточке «Защита» с явным предупреждением о неполных боевых формулах.
- Добавлены три отдельные гильдейские ветки естественного восстановления: физическое (+5/+8), духовное (+5/+8), лечение (+10/+20/+30 сразу к обоим показателям). Базовые индексы — floor(ВЫН/10) и floor(ДУХ/10). Это скорость восстановления из Remaked, НЕ ОЗ/ОМ за тик и НЕ эффект зелий.
- В «Происхождение → Характеристики → Усиления ОЗ и ОМ» размещён дополнительный свёрнутый блок гильдейских настроек; числовые уровни проходят проверку в общих билдах/ссылках. Сброс по умолчанию — все ветки выключены.
- Добавлены точечные тесты `tests/resistances-guild-recovery.test.mjs`. Полный `npm test`, развёртывание Pages/Worker и браузерная проверка не подтверждены; GitHub Actions не запускались.



## 0.87.0 — 2026.10.31.87 · Точные бонусы зелий и официальные названия расовых способностей

- Реализованы оставшиеся прямые бонусы Remaked `Calc('POT')`: расовая способность человека «Знахарство» +15% (OS ID `900010003`) и пассивка воинских классов «Улучшение лечения» +10% за каждые 10 пунктов **освоенного зелёного** мастерства ближнего боя начиная с уровня 12. Пять веток суммируются один раз без дублирования синих очков.
- В обоих местах выбора расового навыка процент действия зелий и открытая карточка «Эффекты» обновляются сразу. Карточка показывает базовую эффективность ВЫН, пассивку, обученное мастерство, титул, руну и надетые вещи/души. Бонусы зелий не подмешиваются к максимальным ОЗ.
- Подключены 18 утверждённых русских названий расовых способностей Remaked с проверенной привязкой к ID в актуального игрового сервера. Сомнительный автоперевод остальных навыков не применяется, английский каталог и исходные данные D1 не изменены; полный аудит названий всё ещё в плане.
- Добавлен файл регрессионных тестов `remaked-potion-masteries.test.mjs`, документы дополнены ссылками на исходные формулы и критериями проверки. **Полный `npm test`, браузерная проверка, реальная публикация Pages и Worker/D1 пока не подтверждены.** GitHub Actions не запускались.


## 0.86.0 — 2026.10.31.86 · Exclusive Honor titles, confirmed potion recovery and opt-in 14-formula Remaked potion previews

- Перенесены 13 взаимоисключающих титулов чести из `Remaked js/ini.js` и прямые эффекты из `js/calc.js`. Вместо независимого флажка чести — один выпадающий список с RU/EN; старые билды со включённым «Стремлением к силе» корректно интерпретируются.
- Титул «Крепкое тело» (+5 к действию зелий), Душа зелий `EP_MASTERY_POTION` (+8) и руна «Чо Ын» (+5) вместе с базовой формулой `100+floor(ВЫН²*2/1000)` участвуют в новом расчёте эффективности зелий. Эффективность зелий не прибавляется к максимальным ОЗ/ОМ.
- В «Происхождение → Характеристики → Усиления» добавлен свёрнутый просмотр действия зелий с отдельной галочкой «Учитывать эффекты зелий», выключенной по умолчанию. Использован Modern Remaked 4.23: 14 исходных вариантов, при этом **только 10 подтверждённых актуальных предметов** показаны игроку; четыре исторические позиции не выдаются за актуальные.
- Для фиксированных зелий расчёт `floor(amount*potionRate/100)`, для процентных `floor(maxHP*ceil(percent*potionRate)/10000)`. Текущая база Подснежника — 20 ОЗ, Таинственного зелья — 145 ОЗ; исторические неточные описания не переносятся.
- Эффекты выбранного титула появились в карточке атрибутов, с понятными названиями вместо внутренних кодов; открытая карточка обновляется при изменении усилений.
- Дополнительные настройки, включая единственный титул, руну и opt-in просмотр зелий, сохраняются локально и в публичной ссылке со строгой валидацией. Старые билды и ссылки совместимы.
- Добавлены тесты `honor-potion-parity.test.mjs` и `potion-preview.test.mjs`, актуализированы регрессии. **41 проверка из 7 связанных наборов прошла** в изолированной JS-среде. Полный `npm test`, Actions, фактическая публикация Pages и браузерная приёмка всё ещё не подтверждены.


## 0.85.0 — 2026.10.31.85 · Port confirmed Remaked guild, honor and Proelium stat bonuses into the character calculator

- Подтверждённый пользователем Simulator Remaked принят за функциональный эталон для поэтапного переноса механик. Использована фактическая вычислительная логика `js/calc.js`, а не восстановленные по памяти бонусы.
- Добавлено гильдейское усиление **всех шести** характеристик (+N), применяемое отдельно от гильдейских процентов ОЗ и ОМ.
- Добавлен бонус чести «Стремление к силе» (+1 ко всем шести в исполняемой формуле Remaked; историческая английская подсказка не полностью совпадает с кодом).
- Добавлен эффект «Проэлиум»: при активации +floor(мощность/10) к СИЛ, ПРВ и ИНТ. Все три группы бонусов применяются до классового расчёта ОЗ/ОМ и отдельно от распределённых игроком очков.
- В «Происхождение → Характеристики → Усиления ОЗ и ОМ» появился дополнительный компактный раскрываемый блок «Бонусы характеристик», изначально закрытый, с явными переключателями.
- Бонусы сохраняются локально и в публичных ссылках; входящие значения гильдии, мощности зелья и активных флагов строго проверяются. Старые сохранённые билды остаются с выключенными дополнительными бонусами.
- Добавлены `tests/remaked-attribute-buffs.test.mjs` и два теста коротких ссылок; 25 целевых проверок связанных модулей пройдены в изолированной JS-среде.
- В `docs/REMAKED_CALCULATOR_PORT.md` зафиксирован поэтапный перенос: остальные навыки, зелья, титулы чести, гильдейские эффекты и боевые параметры **пока открыты**. Полный `npm test`, визуальная приёмка и живая проверка Pages не подтверждены; GitHub Actions не запускались.


## 0.84.0 — 2026.10.31.84 · Complete vitals release and validated build-sharing of optional HP/MP buffs

- Завершён совместный выпуск расчётов ОЗ/ОМ, уровней улучшения предметов, гильдейских усилений, «Знака жизни» и адаптивной компоновки портретов из 0.83.0.
- Найден и исправлен дефект обмена билдами: `sanitizeSharedState` ранее отбрасывал новые `vitalsBuffs`. Теперь допустимые выбранные гильдейские уровни (0–6) и флаг «Знак жизни» сохраняются в публичных ссылках. Неверные входящие уровни и строковые псевдобулевы значения игнорируются, старые билды остаются с выключенными усилениями.
- Добавлены 3 теста обмена билдом. Локальная проверка смежных сценариев расчёта, контроля ввода, отображения портретов и сохранения усилений не выявила сбоев. GitHub Actions не запускались.
- Точный расчёт **всех** потенциальных источников ОЗ/ОМ ещё не подтверждён из-за отсутствующих структурированных данных об отдельных комплектах, условных навыках и временных эффектах; ограничения сохранены в `docs/HP_MP_COVERAGE.md`.
- Развёртывание GitHub Pages и визуальная проверка экранов 390/768/1200/1920px не подтверждены.


## 0.83.0 — 2026.10.31.83 · OS-calculator HP/MP percent and refinement parity, optional guild/Life Sign buffs, compact responsive portrait differentiation

- Базовые ОЗ/ОМ по коэффициентам 28 классов теперь вычисляются в целочисленных сотых с округлением вниз в соответствии с исходником Modern current-vitals.js, вместо старого финального округления half-to-even.
- Учитываются плоские и процентные ОЗ/ОМ предметов и душ: `EP_MAXLIFE_CONST`, `EP_MAXMANA_CONST`, `EP_MAXLIFE_SCALE`, `EP_MAXMANA_SCALE`. Каждый процент применяется отдельно к классовой базе, не к базе с плоскими прибавками.
- Поддерживаются однозначно описанные игровые бонусы заточки за каждые N улучшений и на пороге +N, если текст содержит конкретное ОЗ/ОМ/ВЫН/СД. Применяется проверка на уже существующие структурированные пороговые эффекты для защиты от двойного начисления.
- В «Происхождение → Характеристики» добавлен по умолчанию свёрнутый раздел «Усиления ОЗ и ОМ»: независимый выбор «Сила гильдии» (ОЗ), «Дух гильдии» (ОМ), уровень 0–6, и отдельное активное «Знак жизни» (+250 ОЗ и +15% базового ОЗ). Усиления НЕ включаются автоматически, сохраняются в билде, старые билды по умолчанию без них.
- У портрета героя сокращена высота (предел 565px на широких экранах), изображение остаётся полностью видимым через contain. На планшетных/узких экранах увеличено разделение «Происхождение» и «Образ героя», уменьшена карточка выбора расы и подчеркнуто отличие редактора внешности от экипированного героя.
- Добавлены 8 регрессионных сценариев HP/MP, 4 сценария управления/адаптивности; старые тесты обновлены под новую формулу. В `docs/HP_MP_COVERAGE.md` зафиксированы исходники и **непокрытые** эффекты: комплекты, все условные умения, некоторые заточки, иные временные баффы. **100% совпадение с живым клиентом не заявлено**, полный `npm test` и браузерная приёмка остаются открытыми.


## 0.82.0 — 2026.10.31.82 · Readable HP/MP totals, class-specialization selection breadcrumbs and Origin-to-portrait height alignment

- «Происхождение → Характеристики»: убраны декоративные ♥/✦ и приблизительные знаки `≈` перед ОЗ и ОМ. Расчётные значения отображаются в виде целых чисел, сами карточки заметнее и крупнее.
- Достоверность: код калькулятора округляет доступную формулу HP/MP и применяет известные плоские бонусы; полное совпадение с реальным сервером актуального игрового сервера НЕ подтверждено, так как процентные/условные эффекты, комплекты и некоторые способности ещё не реализованы. Оговорка о покрытии осталась в доступной подписи карточек.
- В выборе профессии при возврате к корневым направлениям и родительским профессиям явно видно, какая конечная специализация выбрана. Подсветка пути дополнена именем выбранного класса; переход «Назад» сам выбор не изменяет.
- Высота «Происхождения» на десктопе автоматически выравнивается по высоте центральной панели портрета через `ResizeObserver` и переменную `--character-stage-height`, без растягивания до высоты длинного «Пути героя»; на мобильном ограничение отключено.
- Исправлена подпись «Раса: Выбери облик» → «Выбери расу».
- Добавлены 5 новых регрессионных сценариев и обновлены старые ожидания HP/MP. 28 проверок из пяти связанных наборов прошли в изолированной JS/DOM среде; полномасштабный `npm test` и реальная визуальная приёмка пока не подтверждены. GitHub Actions не использовались.


## 0.81.0 — 2026.10.31.81 · Remove introductory banner and redundant status while preserving editor access and catalog error visibility

- Удалена целиком верхняя секция `intro` («АРХИВ ГЕРОЕВ», «Создай свою легенду», вводное описание): после главного меню начинается мастерская персонажа.
- Контейнер `authState` сохранён и перенесён в верхнее меню; индикатор «Редактор» появляется только при включённой админке. Существующий `ownerDock`, изменение данных, вход и сохранения не затронуты.
- Удалены неиспользуемые стили вводной секции, в том числе мобильные. Верхний отступ рабочей области уменьшен; визуально скрытый `h1` сохраняет доступный заголовок страницы, но не занимает место.
- Успешное подключение каталога больше не создаёт повторную длинную строку над рабочей областью; сведения остаются в нижнем статусе. Критическая ошибка загрузки каталога выводится наверху и остаётся видимой.
- Добавлены 4 новых регрессионных сценария для удаления вступления, админки, статуса каталога и сохранения основных элементов. Совместно с 19 предыдущими проверками рабочих панелей локальная изолированная JS-проверка прошла 23/23.
- GitHub Actions и полноценный `npm test` не запускались. Публикация Pages и визуальная приёмка должны быть подтверждены пользователем.


## 0.80.0 — 2026.10.31.80 · Hero Path unobstructed slider, balanced equipment icon rails, Origin HP/MP, removal of unused HUD and EXP

- Удалена отдельная шапка персонажа с ненужным названием «Новый герой», уровнем, HP/MP и опытом. Уровень остался в «Происхождение → Характеристики», XP на сайте не показывается.
- Известные расчётные ОЗ/ОМ теперь компактно размещены в «Происхождение → Характеристики» и обновляются при смене уровня, распределении характеристик, экипировке и душах. Убрано дублирование ОЗ/ОМ в старом отдельном редакторе.
- Пороговые метки умений заменены пассивными тонкими делениями на шкале: `pointer-events:none`, никакие кнопки и объединённые числовые бейджи не перехватывают перетаскивание. Каждый известный порог отмечен отдельно.
- Под шкалой располагается **свёрнутый по умолчанию** список навыков с порогами и ограничениями класса; каждое умение выбирается независимо.
- Обе колонки экипировки используют одинаковый размер слотов на desktop, tablet и mobile. Исправлено переопределение устаревшей переменной `--studio-slot` на самих кнопках; иконки чуть увеличены.
- Добавлены регрессионные тесты удалённой шапки, расчётных ОЗ/ОМ, отсутствия препятствий перетаскиванию и симметрии слотов. 19 целевых проверок прошли на актуальном JS в изолированной среде. **Полный npm test, GitHub Actions и браузерная приёмка не запускались.**


## 0.79.0 — 2026.10.31.79 · Clean item tooltips, readable Soul and refinement badges, player-facing ID removal, and read-only D1 diagnostics

- Из описаний предметов и душ для обычных игроков убраны внутренние ID (включая кольцо метели 19022). Числовые ключи остаются для поиска, сохранений и ссылок; подтверждённый администратор может видеть ID.
- Исправлен конфликт нативного браузерного `title` и визуальных подсказок у слотов, расовых навыков и списка умений. Старая карточка удаляется при перестроении слотов; её положение учитывает сторону и доступное место.
- В портрете увеличены изображения экипировки, заточка вынесена в верхний правый угол, счётчик душ — в нижний левый. На несокетных кольцах больше не пишется «души 0/0».
- В энциклопедии и выборе вещей скрыты ID/технические подписи. Вкладка атрибутов не показывает обычному игроку внутренние EP_* коды и жаргон базы данных; вместо этого — краткая оговорка о неполных формулах.
- В Worker `/api/health` добавлен признак публикации собственного D1-каталога; при отсутствующей DB короткие ссылки возвращают безопасный HTTP 503, а не HTTP 500.
- Добавлены `npm run connection:check` и `npm run connection:check:full`: read-only диагностика Pages/Worker/CORS/D1/миграции коротких ссылок, без паролей, Actions и записи в базу.
- Добавлены проверочные сценарии для tooltip/ID/14 слотов и Worker health/CORS; целевые изолированные проверки выполнены. Полный Node suite и live Pages/Worker не подтверждены.


## 0.78.0 — 2026.10.31.78 · Absolute race/class attribute inputs, 99-point allocation ceiling, uncapped known equipment and Soul bonuses

- В «Происхождение → Характеристики» поле показывает абсолютное значение расы/базового класса (у Кролля-следопыта 3/3/7/7/8/6), а не только вложенные очки.
- На изменение поля действует нижняя граница по стартовому значению, верхняя граница по распределённому значению 99 и бюджет очков уровня: 100 → 99 только если хватает очков.
- Итоговая характеристика рядом отдельно учитывает известные бонусы экипировки, душ и подтверждённых расчётных эффектов: вложенное 99 и +11 дают 110. Неподтверждённые игровые эффекты не выдумываются.
- После изменения души или заточки видимые характеристики в «Происхождении» также перерисовываются, не только HUD.
- Вторичный редактор характеристик приведён к той же абсолютной семантике, сохранение старых билдов остаётся в формате вложенных очков без потери данных.
- Новые тесты проверяют реальные базовые таблицы RAPIN+SCOUT, бюджеты, нижний предел, 99, сохранения, итог 110, UI-поля и перерасчёт; `npm test` и браузерная приёмка всё ещё требуют независимого выполнения.


## 0.77.0 — 2026.10.30.77 · Компактный «Путь героя»: пороги и классовые ограничения в группах навыков; локальная проверка версий без GitHub Actions

- Группы «Пути героя» показывают только общую сумму вложений, без повторения длинного списка веток.
- Меню объединённых порогов отображает для каждого навыка свой порог и статус ограничения класса; выбор второго и последующих навыков сохранён.
- Добавлен локальный `scripts/release-version.mjs` для единообразного обновления версий и проверки 20 CSS/JS ссылок. Доступны `npm run release:check` и `npm run release:bump -- <версия> <описание>`.
- Добавлены регрессионные проверки порогов и release CLI через `npm test`. Публичную страницу, полноэкранный UI и полную Node suite ещё нужно проверить.


## 0.76.0 — 2026.10.30.76 · Публикация без закреплённого URL и новая шкала умений

- Обновление: после перехода по cache-busting `?ps-revision=...` адрес автоматически очищается через `history.replaceState`, без повторной загрузки HTML; другие query-параметры и hash сохраняются.
- Обновление: опубликованный `site-version.json` сравнивается численно с текущей версией; устаревший манифест больше не предлагает откат. Сохраняется существующее событие сохранения билда перед переходом.
- «Путь героя»: ромбы заменены небольшими вертикальными метками **внутри** полосы прокачки; высота редактора шкалы сокращена. Близкие пороги группируются, но из списка доступны все навыки.
- Исправлен возможный `ReferenceError: picker is not defined`, блокировавший отрисовку веток с порогами. Для группового выбора добавлены кнопка закрытия, Escape и `aria-expanded`.
- Убрана длинная нативная подсказка у полосы. Компактное превью навыка ограничено видимой частью правой панели и тремя навыками; остальные доступны через выбор маркера. Свернутые недоступные ветки уплотнены.
- Дополнены тесты `hero-path-interactions`, добавлен `release-updates.test.mjs`; в изолированной JS/DOM-модели выполнены 14 целевых проверок. **Полный `npm test`, GitHub Pages deployment и браузерная приёмка не подтверждены**.


## 0.75.0 — 2026.10.30.75 · Исправление вставки меню и границ подсказок

- Устранено двойное добавление меню выбора сгруппированных навыков в редактор; меню теперь следует сразу за шкалой.
- Длинные подсказки получают ограничение по высоте окна и внутреннюю прокрутку, а расположение рассчитывается с учётом размеров видимой области.
- Проверка опубликованной версии Pages через публичный URL не удалась; браузерный E2E и реальный рендер остаются неподтверждёнными.


## 0.74.0 — 2026.10.30.74 · Выбор любого навыка из общего маркера

- При нажатии на объединённый маркер открывается компактный список всех входящих в него навыков с оригинальными иконками, когда они доступны; каждый навык выбирается отдельно.
- Маркер единственного навыка сохраняет прямое открытие; hover/focus-подсказки остаются для просмотра без перехода.
- Требуется браузерная проверка на широком экране, узкой колонке, мобильном и с клавиатуры.


## 0.73.0 — 2026.10.30.73 · Пороговые маркеры на линии прогрессии

- Удалено встроенное JS-позиционирование маркеров по четырём высоким дорожкам: CSS теперь располагает маркеры непосредственно на шкале.
- Близкие пороги объединены в компактный маркер с числом навыков; hover/focus-подсказка включает все навыки группы, клик открывает первый.
- Реальная браузерная проверка позиционирования, подсказок и управления остаётся открытой.


## 0.72.0 — 2026.10.30.72 · Компактный портрет и маркеры на шкале

- CSS: устранены принудительный сдвиг портрета вправо и чрезмерное растягивание центральной сцены на desktop; кнопки размещаются после сцены.
- Пороговые маркеры навыков теперь ромбовидные и расположены у линии прокачки, а не высоко над ней.
- Это изменение исходников в GitHub; реальные размеры, всплывающие подсказки, скролл и публикация Pages ещё требуют проверки в браузере на целевых разрешениях.


Публичные изменения кода в рабочей ветке `bonaqu_projects`. Факт коммита **не означает**, что GitHub Pages/Cloudflare Worker опубликованы или прошли браузерный E2E. Планы и незавершённые проверки: [ROADMAP.md](ROADMAP.md).

## 0.71.0 — 2026.10.30.71 · Корректная регрессионная проверка DOM

- Исправлен ложноположительный тест: `disabled=false` и аналогичные HTML boolean attributes правильно устанавливаются как свойства DOM, но обычный `setAttribute` для `aria-*`, `title` и прочих строковых атрибутов необходим.
- Промежуточная V8-модельная проверка шестью наборами тестов: 50 успешных сценариев и один ложный тест, который исправлен этой версией. Настоящий полный `npm test` и браузерный E2E ещё не подтверждены.
- UI и сохранённые билды не менялись.

## 0.70.0 — 2026.10.30.70 · Регрессионное закрепление новой UX-логики

- Исправлены два старых тестовых ожидания, которые противоречили новому согласованному UX: раскрытие родителя больше не должно восстанавливать ребёнка; «Доступные*» переименовано в «Доступные».
- Сохранены модельные ограничения и исходные поля навыков, при этом `EP_*` не отображаются в быстрой карточке.
- Добавлен тест с настоящими OS-навыками, проверяющий компактные маркеры на порогах (включая закрытый лимитом Клирика «Раскол» 41) и передачу списка навыков в hover preview.
- Добавлен регрессионный контроль отсутствия вложенного скролла справа. Изолированные тесты и полная браузерная приёмка фиксируются отдельно.

## 0.69.0 — 2026.10.30.69 · Полезная площадь вместо технических пояснений

- В происхождении удалены строка «старт + ... = итог» и дополнительная строка разбора каждой характеристики. Точный расчёт, цены и ограничения сохранены; кнопка «+» содержит цену следующего пункта в подсказке.
- Поле точного ввода, кнопки `+` и `−` выровнены по одинаковой высоте и ширине в каждой строке.
- Редактор экипировки: выбор/извлечение души — только во вкладке «Души»; из «Свойств» убран отдельный ярлык-переход. Оставлена полноценная отдельная вкладка «Души» там, где есть реальные гнёзда.
- Удалены «Сбросить тип и стихию», очевидные объяснения мгновенного применения, строка внутренних коэффициентов OS при заточке и инструкция про выбор гнезда.
- В «Пути героя» оставлены компактные названия цветов, без длинных комментариев про расовые пассивки и пояснения к управлению. Убраны служебные коды из подписей полей карточки умения; данные в каталоге сохранены.
- Добавлены регрессионные тесты отсутствия лишних кнопок/строк. Браузерная проверка и `npm test` не заявлены выполненными.

## 0.68.0 — 2026.10.30.68 · Компактное развитие героя

- Повторное открытие группы не раскрывает старую дочернюю ветку; закрытие ветвей сохраняется после F5.
- Вместо крупных налезающих иконок — 12px маркеры порогов по четырём дорожкам, при наведении/фокусе доступна карточка с иконкой, названием и описанием. Клик открывает подробности умения.
- Убрана вложенная прокрутка правой панели и списка развития; галерея умений по 24 с «Показать ещё».
- Компактная единая панель класса и трёх счётчиков вместо двух шапок; описание выбранного умения выводится перед галереей, без заранее выделенного случайного навыка.
- Убрана длинная техническая строка списка, исходные EP-коды остались в энциклопедии.
- Полный browser E2E и тест экранов 1920×1080/мобильного остаются открытыми.

## 0.67.0 — 2026.10.30.67 · Обязательный регрессионный контроль

- Исправлена ошибка нового теста 0.66: ссылку на исходник `pandora-studio-app.js` ошибочно читали как `sources.app`; запуск в изолированной V8-среде действительно выявил проблему.
- Добавлены интерактивные тесты, которые вызывают **реальный обработчик `selectJob`** и проверяют сохранение вложений/мастерства при смене класса, без очистки билда.
- Дополнительная проверка использует **реальный каталог `data/os/skills.json`** и реальный адаптер `milestones`: порог `41` навыка «Раскол» находится на недоступной Клирику части ветки «Рубящий удар» (лимит 15) и отображается с `locked:true`.
- Поведение не объявляется проверенным в настоящем браузере; эти Node/V8 регрессионные тесты отделены от визуальной приёмки.

## 0.66.0 — 2026.10.30.66 · Профессиональная категория открывается первой

- Категория «Пути героя» по умолчанию определяется **самой сильной суммой разрешённых лимитов веток** текущего класса из `classes.json`. Примеры: Клирик → Молитва, Маг → Магия, Воин → Ближний бой, Хищник → Тактика.
- При переключении профессии подсветка и открытая ветка переходят туда же, а прежний билд и очки не стираются.
- Ручной выбор/закрытие группы сохраняется и не переопределяется на асинхронной загрузке или F5.
- Добавлены проверки по реальным данным классов. Вся механика UI и бюджета по-прежнему требует отдельного браузерного E2E.

## 0.65.0 — 2026.10.30.65 · Живые счётчики, переход класса и закрытые пороги

- При движении ползунка суммы ветки и категории, зелёное мастерство и числовое поле обновляются синхронно на событии `input`, не прерывая захват мыши.
- При смене класса редактор выбирает первую реально разрешённую группу/ветку и не оставляет игрока на старой ветке с лимитом 0; вложенные очки и библиотека билдов сохраняются.
- Иконки умений с порогами выше классового лимита остаются в дереве на красной части единой полосы, имеют замок, подсказки и открывают сведения об умении. Не подменяют разрешённый лимит ветки.
- Добавлены проверки новых состояний. Полный браузерный E2E и сравнение с live OS ещё не подтверждены.

## 0.64.0 — 2026.10.30.64 · Действующие UI-тесты вместо проверки текста

- Добавлен `tests/hero-path-interactions.test.mjs`: воспроизводит HTML-семантику логического `disabled`, проверяет доступность полосы при 103 свободных очках, drag `0→10→30→0`, невозможность потратить на запрещённую Клирику ветку, реальное двукратное переключение `onGroup` и работу общего DOM-конструктора.
- Напротив единой полосы добавлена короткая подсказка для мыши и клавиатуры. `input[type=range]` остаётся нативным доступным элементом.
- Тесты доступны через `npm test`, не требуют сети, Worker или D1. Изолированные сценарии проверены отдельно; полный `npm test` и браузерный E2E ещё не подтверждены.

## 0.63.0 — 2026.10.30.63 · P0: исправлена реально заблокированная прокачка

- Установлена корневая причина: общий DOM-конструктор устанавливал логический HTML-атрибут `disabled="false"`. **По стандарту HTML это всё равно disabled**. Поэтому ползунок мог показывать 103 свободных очка и не двигаться. Для `disabled/checked/selected/hidden/required/readOnly/multiple` теперь устанавливаются реальные JS-свойства вместо строковых HTML-атрибутов.
- Аналогично исправлены конструкторы элементов в мастерской, окне снаряжения и атрибутах; затронуты другие кнопки/контролы, ранее всегда заблокированные даже при `false`.
- Отвязано разрешение вкладывать очки от успешной загрузки всех 6 каталогов и Worker. Таблицы очков и лимиты классов можно получить независимо из локальных `data/os/tables.json` и `data/os/classes.json`; не используются выдуманные лимиты 90 во время загрузки.
- Повторное нажатие по заголовку «Ближний бой / Тактика / Молитва / Магия / Особые» **сворачивает** раздел, второе раскрывает; закрытая категория и отсутствие раскрытой ветки корректно переживают F5 и загрузку каталога.
- Добавлены проверочные тесты на настоящее логическое `disabled` и закрытие категорий. Полный браузерный E2E остаётся дополнительным шагом, а не основанием заявлять «пофикшено» до проверки.

## 0.62.0 — 2026.10.30.62 · Без скачков фокуса и сброса поиска в вещах

- При переключении и заполнении гнёзд **поиск душ больше не сбрасывается**. Текст фильтра сохраняется в sessionStorage как часть открытого окна, но сбрасывается при выборе другого слота.
- После заточки +0…+10, щелчка по гнезду, назначения/удаления души и выбора типа/стихии улучшения фокус возвращается к соответствующему контролу. Это делает однокликовую настройку удобнее для клавиатуры.
- Кнопки прямо в «Свойствах» остаются без дополнительного подтверждения. Души появляются только в разрешённых слотах с подтверждённым числом гнёзд.
- Добавлены регрессионные проверки поведения поиска и идентификаторов полей. Полный браузерный E2E пока отдельно не подтверждён.

## 0.61.0 — 2026.10.30.61 · Полная карточка умения внутри «Пути героя»

- В правой странице «Умения» по выбранной иконке доступны описание, ОМ, подготовка, перезарядка, дальность, стихия, профильная характеристика, ID и пороги веток: сколько вложено и сколько реально натренировано. Исходные `EP_*`-эффекты находятся в сворачиваемой секции без выдумывания коэффициентов.
- Добавлена ссылка на существующую статью навыка в собственной энциклопедии; больше не нужно искать нужный ID вручную.
- Нельзя честно считать доступное по известным `skills.json` требованиям умение доказанно изученным в игре — статусы уточнены как «Доступно* / Недоступно*», в интерфейсе есть пояснение о непроверенном обучении.
- Клик по пороговой иконке ветки открывает именно выбранное умение, даже если в галерее ранее стоял чужой поиск или фильтр.
- Реальная проверка на текущем актуального игрового сервера, hover/touch и регрессионный прогон полного npm test ещё нужны.

## 0.60.0 — 2026.10.30.60 · Стабильность редактора, точная геометрия и обратная совместимость

- Переключение группы/ветки и редактирование очков больше не должны терять фокус клавиатуры при полной перерисовке; раскрытая ветка остаётся на месте.
- Выбор иконки умения сохраняет собственную прокрутку галереи, повторный клик не переносит список в начало.
- При загрузке старой схемы очков числовые идентификаторы зелёного мастерства мигрируют вместе с распределением веток (ранее могли остаться в старых ключах и визуально обнулиться).
- Одна шкала: золотой и зелёный слои, красная заблокированная граница и положение ползунка теперь используют точно совпадающую внутреннюю ширину. Сложная CSS-арифметика заменена стандартным `calc(percent +/- pixels)`; иконки центрированы на своих делениях.
- Проверка доступна через source-regression tests; точность в настоящем браузере и на live OS всё ещё требуется подтвердить.

## 0.59.0 — 2026.10.30.59 · Иконки порогов совпадают с делениями шкалы
- Пороговые иконки открытия умений теперь позиционируются по **общему масштабу 0–90** прямо над соответствующими значениями ветки, а не по отдельному классовому пределу. Например, 8 очков остаются восьмым делением независимо от того, лимит профессии 15, 55 или 90.
- Красный заблокированный участок и синий/золотой/зелёный прогресс не сдвигают иконки при переключении классов. Изменение не затрагивает сохранённые билды, формулы или D1.
- Добавлен source regression test; браузерная проверка остаётся открытой.

## 0.58.0 — 2026.10.30.58 · Полоса ветки по игровому принципу

- Убран дубляж кнопок `+/-1, +/-5`: очки вкладываются **одним ползунком прямо внутри шкалы**, точное число доступно рядом.
- Шкала теперь визуально разбита на **зелёное освоенное мастерство**, **золото вложенных, но ещё не освоенных очков**, **синий оставшийся доступный диапазон** и **красный сектор под замком за классовым пределом**. Все четыре состояния показаны в одном треке, без второго прогресс-бара.
- Масштаб до 90 соответствует максимальному классовому лимиту в локальных данных `classes.json` (28 профессий); низкие лимиты 0/5/10/.../90 отмечаются красным ограничением.
- Добавлена кнопка «Сбросить вложенные очки» с подтверждением; она очищает лишь распределение веток и мастерство, **не трогая характеристики, снаряжение, души и сохранённую библиотеку билдов**.
- Добавлен контрактный тест и точные CSS-селекторы. **Live OS механика и реальный браузер не объявляются проверенными**.

## 0.57.0 — 2026.10.30.57 · Единая полоса мастерства и сохранение позиции

- В «Пути героя» единая полоса из синего незаполненного класса, золотых распределённых, но ещё не натренированных очков и зелёного натренированного мастерства. **Зелень рисуется поверх золота на одной и той же линии**, отдельной зелёной полосы нет. Единственный ползунок вкладывает очки уровня, точный ввод зелени остаётся числовым.
- Группа, раскрытая ветка и прокрутка списка навыков сохраняются в `sessionStorage` вместе с выбранной страницей. Обновлятор `pandora-studio-update-manager.js` продолжает синхронно сохранять билд и навигацию до замены страницы.
- При ширине окна до 1200px список в правой панели больше не сжимается в четыре колонки. Подсказки на единой шкале показывают вложено/освоено/предел класса.
- Диагностика: последний найденный успешный `pages build and deployment` на момент проверки — коммит `4d1bbe79`. Последующие серии коммитов неоднократно отменяли запускавшиеся деплои; версия 0.56 ещё была в ожидании. **Новая версия исходников не означает опубликованный сайт**.
- Source/syntax assertions included; реальный браузерный QA и подтверждение нового Pages-деплоя остаются обязательными.

## 0.56.0 — 2026.10.30.56 · Прозрачный расчёт характеристик
- У каждой из шести характеристик теперь непосредственно под полем ввода видны **расовая/классовая база, вручную вложенные очки, вещи/души, мастерство и итог**, а также **цена следующего очка** согласно исторической таблице SPt Remaked.
- Бонусы НЕ отнимают очки уровня. Предположительное влияние зелёного мастерства Молитвы помечено как исторический расчёт, а не подтверждённый игровой эффект текущего OS.
- Подписи и новый регрессионный тест предупреждают путаницу между оплаченной характеристикой и окончательным значением с эффектами. Полная браузерная и игровая проверка остаётся открытой.

## 0.55.0 — 2026.10.30.55 · Устранены дублирующие экраны и ошибка старого редактора
- Удалён устаревший полноценный редактор навыков (11 КБ) из окна «Персонаж»: теперь распределение ведётся **только в «Пути героя»**. В окне персонажа остались «Персонаж» и «Профиль».
- Кнопки из карточки персонажа ведут к единственным действующим интерфейсам: «Путь героя → Умения» и «Происхождение → Характеристики».
- Удалены обращения старого редактора к больше не существующему `branchValue` (ранее потенциальное падение после клика на его ползунок).
- Закреплены проверки запрета дублирующих редакторов в `tests/studio-workbench.test.mjs`. **Полный npm-test/browser E2E пока не подтверждены**.

## 0.54.0 — 2026.10.30.54 · Исправление очков и новый «Путь героя»

- Справа появились **свободные / использованные / всего** очки умений; редактор автоматически открывает подходящую классу ветку, а класс с лимитом 0 не может тратить новые очки.
- Введены независимые значения: **потенциал** (вложенные очки уровня), **зелёное мастерство** (натренированное). Автозаполнение зелени можно отключить, после чего устанавливать значения в пределах вложенных очков по каждой ветке. В рамках одной шкалы разделены синий предел, золотые вложения и зелёная тренировка. Группы показывают потраченные очки и названия веток.
- В правом «Пути героя» появилась вторая страница **«Умения»**: цветные/серые иконки на основании известных условий, подробные подсказки, фильтры и поиск. Неподтверждённые требования не объявляются автоматически выполненными.
- Основная панель больше не дублирует расу и уровень героя и не содержит кнопку «Навыки и прокачка здесь». Редактирование идёт внутри ветки.
- В «Происхождении → Характеристики» разведены **расовая/классовая база + вручную вложено + эффекты вещей/душ + бонус мастерства**. Из бюджета тратится только ручное распределение; итоговые характеристики могут быть выше 99.
- Для Priest/Cleric/Enchanter добавлен предварительный исторический бонус СД `1+floor(зелёная Молитва / 10)` по `Remaked/js/calc.js`. Он показывается как **непроверенный для текущего актуального игрового сервера**. Это не доказательство полного паритета HP/MP или боевых характеристик.
- Сохранения и публичные снимки получили `masteryAuto` и `mastery`; прежние сохранения по умолчанию продолжают работать в режиме полной зелени. Исправлено сохранение больших ID расовых пассивок.
- Старые билды со сверхлимитными значениями могут **пошагово возвращать очки**, даже если остаток всё ещё отрицательный или классовый лимит новой профессии равен 0.
- Чистые регрессионные проверки добавлены; запуск полного `npm test` и браузерный E2E всё ещё не подтверждены.

## 0.53.0 — 2026.10.30.53 · Статус готовности общих ссылок
- Cloudflare Worker: `/api/health` показывает `features.sharing` только по наличию обеих таблиц D1.
- До миграции `0003_shares.sql` операции общего доступа возвращают понятный HTTP 503.
- Живые D1, интернет-ссылки и кросс-браузерная проверка не подтверждены.

## 0.52.0 — 2026.10.30.52 · Бережное восстановление билдов
- Локальная библиотека больше не пропускает свои сохранения через фильтр для внешних ссылок. Сохраняются старые и будущие поля.
- Публичный обмен сохраняет `displacedLegwear` для астирских платьев и уровни предметов; внешние данные остаются валидируемыми.

## 0.51.0 — 2026.10.30.51 · Единая шкала мастерства
- Ползунок ветки, заполнение фактически вложенных очков и пороговые иконки навыков — одна общая интерактивная полоса внутри «Пути героя».
- Ограничение доступного бюджета при перетаскивании; выбор и информация о навыке остаются справа.

## 0.50.0 — 2026.10.30.50 · Единый экран и редактор предметов
- «Путь героя» снова до 430px на больших экранах; дублирующие разделы «Умения» и «Характеристики» из основной навигации убраны.
- Навыки выбираются и развиваются в правой панели, распределение шести исходных характеристик — в «Происхождении».
- «Тип» и «Стихия» улучшения меняются прямо в карточке без «Применить». «Души» показаны только для поддерживаемых предметов с гнёздами, включая пояс и исключая плащ/кольцо/серьги/амулет.
- Русские типы предметов и смысловые переносы описаний в портрете, каталоге и вики.
- Отдельный каталог экипировки — справочник, а надетые предметы редактируются в портрете.
- База UI для локальной библиотеки и публичных коротких ссылок, диалог перед заменой черновика. Рабочий деплой Worker и миграция D1 для ссылок **не подтверждены**.

## 0.48.0 — 2026.10.30.48 · Предыдущая компоновка
- Промежуточное ограничение правого блока до 280px оказалось неудачным. **Исправлено в 0.50.0** с учётом отзыва пользователя.

## 0.47.0 — 2026.10.30.47 · Очки характеристик
- Стартовые характеристики рас и начальных профессий, исторический бюджет уровней и стоимость очков; сохранённые сборки с вложенными ранее сверх лимита значениями можно корректировать без автоматической потери данных.
- Плоские бонусы вещей и душ участвуют в **итоговых** атрибутах, которые могут превышать абсолютный лимит распределения 99; сложные формулы остаются в roadmap.

Для более ранней истории версий, проверок и исходных данных см. [README.md](README.md).

## Обязательные проверки перед статусом «готово»
- [ ] Полный `npm test` в рабочем Node-проекте.
- [ ] Интерактивные проверки и снимки 1920×1080, 2560×1440, 3840×2160, 1366px, 390px.
- [ ] Миграция D1, развёртывание Worker и GET/POST коротких ссылок в двух независимых браузерах.
- [ ] Подтверждение оригинальных 1,437 игровых иконок и их манифеста.
- [ ] Сравнение всех поддерживаемых формул с текущим актуального игрового сервера по воспроизводимым тестовым значениям.
