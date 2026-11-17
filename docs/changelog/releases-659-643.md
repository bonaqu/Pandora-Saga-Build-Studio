# История релизов · 0.659.0—0.643.0

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
