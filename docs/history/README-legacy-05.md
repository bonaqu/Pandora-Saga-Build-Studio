# Исторические заметки README · часть 5 из 6

## Next milestones

- Verify live current game server endpoints, cross-origin access, sprite references and all skill identities; maintain the versioned authoritative snapshot (no invented gameplay rules).
- Connect to original engine or verified server formulas before displaying authoritative HP, damage and skill budgets.
- Add the actual game equipment sprites/icons and compatible item rules, with sources documented. All six race portraits and the original supplied logo are already bundled locally.
- Move all editable catalog fields to backend with version, approval, rollback and audit log. Existing visual editing intentionally supports only approved interface labels, not game balancing yet.
- Add stable cross-browser CI tests that can run locally without exhausting GitHub Actions minutes.

## Data and artwork

Uses original user-provided assets. Unofficial fan project. Pandora Saga name and in-game assets belong to their respective rights holders. The site makes no ownership claim.

## Обновления без Ctrl+F5 (2026-10-30)

Сайт проверяет `site-version.json` примерно раз в минуту и при возвращении на вкладку. При новой версии показывает уведомление. Обновление применяется автоматически **только через 2 минуты бездействия**, если нет открытых форм, ввода и админ-сессии; кнопка «Обновить» позволяет применить его вручную. Перед переходом повторно сохраняются текущий персонаж и библиотека в `localStorage`. Страница получает новую версию HTML, а CSS/JS имеют идентификатор релиза в URL, чтобы старый кеш не мешал. Незавершённые правки в модальном окне не сбрасываются автоматически. После первого развёртывания механизма понадобится один обычный вход или обновление страницы, поскольку старые экземпляры сайта ещё не знают о `pandora-studio-update-manager.js`.

**Обязательное правило для дальнейших фронтенд-релизов:** обновить `site-version.json` и идентификаторы `?v=` для `pandora-studio-app.js`, `pandora-studio-equipment-rules.js`, `pandora-studio-theme.css`, `pandora-studio-update-manager.js`, а также `<meta name="ps-studio-release">` в `index.html`. Сам по себе новый коммит GitHub не обновляет этот JSON. Серверные исправления `worker/` публикуются отдельно через Cloudflare Builds.

## Админка: визуальное редактирование и отмена (2026-10-30)

После входа `administrator` включается маленькая закреплённая панель режима редактора. Нажатие на подсвеченный текст или иконку открывает редактор рядом с элементом, не переключая вкладку и не изменяя билд. Доступны `Сохранить`, `Отмена`, `Вернуть оригинал`. В редакторе изображений можно выбирать уже загруженные файлы. Панель `Все правки` показывает переопределения из Cloudflare D1, поиск и возврат оригинальных значений. `Отменить` откатывает последнюю подтверждённую правку **текущей сессии** (без отдельной миграции D1). Серверная операция `POST /api/admin/reset` доступна только с действующим токеном и удаляет только разрешённый ключ. Серверные изменения развёртываются через Cloudflare Builds; до обновления Worker кнопка сброса может вернуть HTTP 404. Полный постоянный журнал версий пока не реализован.

## Визуальные характеристики (2026-10-30)

Шесть характеристик отображаются в виде игровых карточек с полосой, точной настройкой, кнопками +/− и отображением классового предела из актуального набора актуального игрового сервера (`classes[JOB].statCaps`). При смене класса ранее сохранённые очки не удаляются и превышение отображается как конфликт. Сумма — лишь сумма запланированных очков, **не** подтверждённый игровой бюджет. Без каталога OS значения остаются редактируемым планом с явно неподтверждённым пределом. HP/MP и боевые формулы не выдумываются.

## 2026-10-30 — системы гнёзд душ и планируемой заточки

В оригинальном каталоге OS у предметов встречается 0, 1, 2 или 3 гнезда (поле `soulslot`); конкретное число берётся исключительно из экземпляра выбранного предмета. Каждое гнездо в интерфейсе кликабельно, душа проверяется по опубликованному `souls[].slots`. Старая схема билда с единственным объектом `souls[slot]` читается как один первый сокет; новые билды записывают массив по сокетам. Если после замены вещи стало меньше гнёзд, прежние данные **не стираются** и обозначаются конфликтом. Улучшение предмета сохраняется отдельно по паре `slot:itemId` в `refinements`, чтобы замена вещи не переносила заточку на другую. Диапазон 0–99 — технический лимит ввода, НЕ подтверждённый игровой максимальный уровень, а вероятность, расходники и бонусы **не рассчитываются**. Персонажи и пользовательские сохранения продолжают храниться в localStorage, совместимый JSON импорт поддерживает старые билды.

### 2026-10-30.5 — быстрый обзор на персонаже

На слотах вокруг винтажного портрета добавлены мини-индикаторы заполненных гнёзд, запланированной заточки и возможных конфликтов сокетов. Нажатие на слот ведёт непосредственно к выбору вещи. Индикаторы не являются рассчитанными бонусами предметов.

## 2026-10-30: no game-server runtime API

Live direct `pandorasaga-os.com/gamedata` and Worker passthrough were removed. Client loads our D1 catalogue first; until its first successful manual import it temporarily uses the **repository-owned** `data/os` snapshot. This is a safe transitional fallback, not real-time synchronization. Real outfit overlays have kind `DECO_*` and are filtered out from combat equipment. Compact soul rows show icon, name and description.

### First-time D1 import

Sign in as `administrator`, enable editing, and use **Каталог D1** in the owner dock. The browser reads checked-in `data/os/{meta,classes,skills,items,souls}.json` and uploads bounded batches to an authenticated Worker, which validates per-dataset totals before atomically marking the new snapshot as active. A failed attempt cannot replace the current active D1 catalog. No Cloudflare credentials or admin secrets are written to the repository. **Cloudflare Builds must publish the worker changes before import will work.**

## Full source snapshot: OS + verified Legacy translations (2026-10-30)

The owner-only **Каталог D1** operation now validates all 12 public OS datasets and imports them with original IDs into a versioned D1 snapshot, plus grouped trade metadata and language-namespaced approved Legacy translations in `data/localization/legacy-approved.v1.json`. Server-side publication requires exact row totals for every dataset; only then the active snapshot changes. No background game-server API calls. English source terms are preserved in their own Legacy namespace rather than silently assigned to unrelated current-server IDs. See `data/os/EXTENDED-CATALOG.md` and `data/localization/README.md`.

### 2026-10-30.10 — verified complete import

The checked-in snapshot includes **12 distinct OS datasets** and separately stores approved Legacy RU/EN/JP/TW source terminology. Import normalization was checked against actual source files: **6,418 rows** across 15 D1 namespaces, including **3,275 language records**. Added `tests/catalog-import.test.mjs` for missing data, array-formatted instances and trade metadata, and `pandora-os-catalog-import.js` for source-preserving normalization. Keep Legacy localization keys separate from OS IDs until individually verified. The next site release increments the manifest and cache-busting query strings to deliver this fix.

## Vintage character window and profile (2026-10-30)

Character detail uses authentic-style tabs for **Персонаж / Умения / Профиль / Статы** without duplicating skill or stats engines. Added editable guild, nation, rank and biography, preserved in local builds, JSON export/import and compare. The HUD shows the real selected character name and planned level; HP/OM/EXP explicitly show **unavailable** rather than fabricated calculated values. 3D dressing remains deferred.

## RU/EN official game catalog (2026-10-30)

current game server has a separate public original `strings.en.json`. It is now saved at `data/os/strings.en.json`, with exact stable IDs for item/skill/monster/soul/class names, descriptions, maps and branches. The RU/EN control switches the **game catalog** without inventing translation mappings or changing build IDs. English entries absent upstream retain their Russian source text. The non-game UI shell is still Russian-first; full UI localization remains tracked separately. English strings load from **our own D1** first or our own checked-in archive before first import — never from the game server at runtime. The manual importer also archives `tables`, `expertise`, `chests`, and approved Legacy language data in isolated namespaces.

## 2026-10-30: game-faithful five skill tabs and racial passives

The skill UI now presents only 5 primary sections and 20 player-visible subsections, in their original order. The server metadata includes further technical branches, but these no longer appear as fictitious player skill trees. `race` is a racial passive choice (one of the 3 actual race-specific `racialPassives.json` skill IDs) in the character overview rather than a spendable point branch. It is persisted in JSON builds, migrated safely on race changes and included in comparisons. Unknown game rules remain marked unverified.

## Interactive linked wiki (2026-10-30)

A first wiki tab now navigates item sources, monster drops, maps, NPC exchange recipes, and chest rewards, using our own published Cloudflare D1. An item inspector includes clickable source links and a full wiki article. Crosslinks highlight relevant item entries; probabilities are shown only when an original field explicitly provides them. Group/zone drops are not treated as individual item odds. The encyclopedia is a foundation; images, bilingual completeness, soul provenance and broader UI polish are future work.

## Protected manual source updates (2026-10-30)

**Каталог D1** now offers two read-only comparisons: current актуального игрового сервера via the allowlisted, authenticated Worker proxy, or the checked-in GitHub archive. It compares all 17 source files by stable IDs, previews added/changed/removed keys, validates the full snapshot, then requires an explicit confirmation before a chunked D1 import and atomic pointer switch. A failed compare/import never replaces the previously published catalog. Old snapshot rows are retained, subject to D1 storage limits. The source refresh intentionally does not push upstream changes into GitHub backup files; periodically update the backup separately as part of source provenance maintenance.

## Self-hosting original game icons

The checked-in collection now includes 19 local Legacy skill-branch PNGs used for branch navigation. For current OS skill/item/soul icons, run `node scripts/mirror-os-icons.mjs --dry-run` followed by `node scripts/mirror-os-icons.mjs` in a network-enabled checkout, review `assets/os-icon-manifest.json` and commit the generated assets. This step is **not yet executed**; do not remove fallback icons until the manifest is complete. No Actions, tokens, paid services or runtime third-party API access are needed for the mirror.

### Self-hosted icon manifest and wiki links (2026-10-30)

Once the manual asset mirror has been completed and a manifest with `count.missing===0` has been committed, the site automatically uses the local `assets/*/icons` paths for live OS skill, item and soul icons. Before that, existing live icon URLs are retained so the game-themed UI is not replaced with placeholders. The wiki now includes skills and soul pages and links from their inspectors.

## 2026-10-30.18 UI stabilization

Fixed a leftover 3-column grid in the redesigned skills view, now a flexible 2-column skills/details layout with responsive stacking. Wiki also links confirmed monster appearances to original map and dungeon (`instances`) pages, and skill requirements display official RU branch labels. Deep links support instance IDs.

## 2026-10-30.19 — inventory ergonomics

The gear catalog now has two remembered viewing modes: **▦ icon grid** and **☰ compact list**, with accessible item labels. Hover/focus shows the source-backed item inspector, and right-click or **📌 Закрепить описание** pins a selected item so the detail panel does not jump when the mouse passes over other icons. Pinning is UI-only; it never changes character equipment. Switching slots or inventory/souls/enhancement modes releases the pin. Soul choice remains a compact list with one-click socket placement. Partial local-icon manifest support means verified local icons can be used incrementally.

## 2026-10-30.20 — wiki navigation and performance

Wiki game datasets load through four concurrent fetch workers rather than sequentially; active catalog remains our D1, with repository snapshot fallback per dataset. Item/skill/soul search includes both RU source strings and confirmed English names. Item and monster views show actual icon URLs when an image exists (the self-hosted manifest takes priority). Links now retain an optional highlighted source ID in the URL fragment, so sharing, refreshing or navigating browser history keeps the context. Source item icons are also visible beside monster drops.

## 2026-10-30.21 — catalog change review

The authenticated manual OS refresh now previews examples of **specific before/after field changes**, not just item IDs and total counts. Changed scalar fields (e.g. `mana`, `level`, `name`, `statCaps`) are readable; complex arrays/objects are shown in bounded text previews. The first 30 changed records per dataset can be inspected; totals still include every record. Object-key reordering is normalized to avoid false positive updates. Read-only previews never publish automatically.

## 2026-10-30.22 — skill tree accuracy

The decorative horizontal connection line between skill icons was removed: it wrongly implied prerequisites that are not in the game data. A **clickable milestone rail** now places source-backed skill icons at `reqs[branch].amount / classBranchCap` positions, grouped by equal thresholds. Its golden fill follows the user's allocated branch points. Over-cap requirements remain listed but aren't shown as reachable on the track. This visual shows verified thresholds, **not** a claim that all game skill prerequisites or passive hooks are fully modeled.

