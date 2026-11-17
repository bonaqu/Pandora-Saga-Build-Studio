# История релизов · 0.673.0—0.660.0

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
