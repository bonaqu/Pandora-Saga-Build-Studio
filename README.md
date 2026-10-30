# Pandora Saga Build Studio

Independent, visual, vintage-inspired Pandora Saga build planner. Static site intended for **GitHub Pages**, secure optional CMS backend on **Cloudflare Workers + D1**.

## Status

**Interactive foundation, not a finished game calculator.** Six race portraits (from user-provided Races.zip), 28 legacy jobs, 20 skills branches, playable visual UI, 14 equipment slots, local builds, JSON import/export, and static client logic. Current official Pandora Saga OS game tables are shipped under `data/os/` (snapshot of 2026-10-30: 28 classes, 569 skills, 1,116 items, 112 Souls). The frontend first tries the live official `/gamedata` feed, then the optional Cloudflare Worker proxy, then the bundled snapshot. Only if all these fail does it use historic Legacy JSON. Correctness for current Pandora Saga OS is **not established**. The frontend does not make up combat formulas. The historical dataset is not a substitute for direct API sync.

## Publish on GitHub Pages (no user-defined GitHub Actions)

1. Repository: `bonaqu/Pandora-Saga-Build-Studio`. The root of the `bonaqu_projects` branch contains `index.html`, `style.css`, `app.js`, `assets`, and `.nojekyll`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: bonaqu_projects → /(root) → Save**.
3. Open `https://bonaqu.github.io/Pandora-Saga-Build-Studio/` after GitHub reports Pages publication.

Even branch-based publication internally uses GitHub Pages' infrastructure; no custom Actions workflow is required. The Cloudflare API token in the repository secrets is neither required nor read by the static site.

## Simple Cloudflare setup without local CLI

**[Пошаговая инструкция Cloudflare (RU)](worker/SETUP_RU.md)** — настроить D1, связать существующий Worker с GitHub через бесплатные Workers Builds, задать `PS_D1_DATABASE_ID` и серверный Secret `ADMIN_SETUP_TOKEN`, проверить API. No GitHub Actions needed. The new script `worker/scripts/prepare-config.mjs` generates an ignored Wrangler configuration using the non-secret D1 UUID at build time.

## Secure administrator mode

The administrator login is hidden from the public interface; this is a visual preference only. All privileged operations remain secured server-side. Account name is fixed to `administrator`. Initial password creation is intentionally **blocked** until the owner provisions a server-only `ADMIN_SETUP_TOKEN` secret (>=32 characters), because a publicly accessible first-visit registration could otherwise be claimed by anyone.

Backend in `worker/`. Requires a Cloudflare account and Cloudflare D1 database; both have free plan allowances and limits. Deploy separately, only when ready:

```sh
npm i -g wrangler
wrangler login
wrangler d1 create ps-build-studio-db
# Copy worker/wrangler.toml.example to worker/wrangler.toml and fill database_id
cd worker
wrangler d1 migrations apply ps-build-studio-db --remote
wrangler secret put ADMIN_SETUP_TOKEN
wrangler deploy
```

First successful login: owner-only entry → `administrator` → new password (minimum 12 chars) + one-time setup token. Subsequent logins use only the password. Server stores only a unique-salt PBKDF2 password hash, short-lived hashed bearer sessions and restricted editable text overrides in D1. Session token stays in browser memory (not in public source or localStorage). Editing: toggle edit mode; double-click outlined text; save the change through the authenticated Worker.

**Do not** put your Worker admin password, token, or Cloudflare API token into any public repository file. `worker/wrangler.toml` is ignored.

## 2026-10-30 — интерактивность и достоверность

- Иконки выбранных предметов теперь отображаются прямо в слотах героя.
- Требования изучения из OS `skills.json` показываются как выполненные, невыполненные или непроверенные; интерфейс не утверждает, что навык уже изучен.
- Из карточки навыка можно перейти к недостающей ветке. Добавлены быстрые кнопки изменения очков, точный ввод, поиск и фильтр доступных навыков.
- Проверка совместимости предметов с классом, уровнем и слотом перенесена в независимый `rules.js` (без расчёта игрового урона).
- Изменения внесены только в статические файлы; секреты и серверные учетные записи не затронуты.

## Inline artwork editor (server deployment required)

An authenticated administrator can double-click the logo, race portraits, skill icons and item cards to select a different image. The picker shows existing bundled assets and accepts allowlisted source URLs. Changes are written as text overrides to D1, not to Git; uploading a new file to the repo remains a separate operation. The Worker source is updated here but **not automatically deployed**. Without a deployed Worker, the feature is intentionally unavailable.

## Item inspector and catalog navigation

Visual item cards now support hover and keyboard focus preview of directly sourced game fields. Class/level/slot mismatches are inspectable but cannot be equipped. The catalog is paginated in groups of 60 rather than silently truncating results; search by original name or ID is retained. The item inspector deliberately avoids calculating unknown combat bonuses.

## Next milestones

- Verify live Pandora Saga OS endpoints, cross-origin access, sprite references and all skill identities; maintain the versioned authoritative snapshot (no invented gameplay rules).
- Connect to original engine or verified server formulas before displaying authoritative HP, damage and skill budgets.
- Add the actual game equipment sprites/icons and compatible item rules, with sources documented. All six race portraits and the original supplied logo are already bundled locally.
- Move all editable catalog fields to backend with version, approval, rollback and audit log. Existing visual editing intentionally supports only approved interface labels, not game balancing yet.
- Add stable cross-browser CI tests that can run locally without exhausting GitHub Actions minutes.

## Data and artwork

Uses original user-provided assets. Unofficial fan project. Pandora Saga name and in-game assets belong to their respective rights holders. The site makes no ownership claim.

## Обновления без Ctrl+F5 (2026-10-30)

Сайт проверяет `site-version.json` примерно раз в минуту и при возвращении на вкладку. При новой версии показывает уведомление. Обновление применяется автоматически **только через 2 минуты бездействия**, если нет открытых форм, ввода и админ-сессии; кнопка «Обновить» позволяет применить его вручную. Перед переходом повторно сохраняются текущий персонаж и библиотека в `localStorage`. Страница получает новую версию HTML, а CSS/JS имеют идентификатор релиза в URL, чтобы старый кеш не мешал. Незавершённые правки в модальном окне не сбрасываются автоматически. После первого развёртывания механизма понадобится один обычный вход или обновление страницы, поскольку старые экземпляры сайта ещё не знают о `updates.js`.

**Обязательное правило для дальнейших фронтенд-релизов:** обновить `site-version.json` и идентификаторы `?v=` для `app.js`, `rules.js`, `style.css`, `updates.js`, а также `<meta name="ps-studio-release">` в `index.html`. Сам по себе новый коммит GitHub не обновляет этот JSON. Серверные исправления `worker/` публикуются отдельно через Cloudflare Builds.

## Админка: визуальное редактирование и отмена (2026-10-30)

После входа `administrator` включается маленькая закреплённая панель режима редактора. Нажатие на подсвеченный текст или иконку открывает редактор рядом с элементом, не переключая вкладку и не изменяя билд. Доступны `Сохранить`, `Отмена`, `Вернуть оригинал`. В редакторе изображений можно выбирать уже загруженные файлы. Панель `Все правки` показывает переопределения из Cloudflare D1, поиск и возврат оригинальных значений. `Отменить` откатывает последнюю подтверждённую правку **текущей сессии** (без отдельной миграции D1). Серверная операция `POST /api/admin/reset` доступна только с действующим токеном и удаляет только разрешённый ключ. Серверные изменения развёртываются через Cloudflare Builds; до обновления Worker кнопка сброса может вернуть HTTP 404. Полный постоянный журнал версий пока не реализован.

## Визуальные характеристики (2026-10-30)

Шесть характеристик отображаются в виде игровых карточек с полосой, точной настройкой, кнопками +/− и отображением классового предела из актуального набора Pandora Saga OS (`classes[JOB].statCaps`). При смене класса ранее сохранённые очки не удаляются и превышение отображается как конфликт. Сумма — лишь сумма запланированных очков, **не** подтверждённый игровой бюджет. Без каталога OS значения остаются редактируемым планом с явно неподтверждённым пределом. HP/MP и боевые формулы не выдумываются.

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

The checked-in snapshot includes **12 distinct OS datasets** and separately stores approved Legacy RU/EN/JP/TW source terminology. Import normalization was checked against actual source files: **6,418 rows** across 15 D1 namespaces, including **3,275 language records**. Added `tests/catalog-import.test.mjs` for missing data, array-formatted instances and trade metadata, and `catalog-import.js` for source-preserving normalization. Keep Legacy localization keys separate from OS IDs until individually verified. The next site release increments the manifest and cache-busting query strings to deliver this fix.

## Vintage character window and profile (2026-10-30)

Character detail uses authentic-style tabs for **Персонаж / Умения / Профиль / Статы** without duplicating skill or stats engines. Added editable guild, nation, rank and biography, preserved in local builds, JSON export/import and compare. The HUD shows the real selected character name and planned level; HP/OM/EXP explicitly show **unavailable** rather than fabricated calculated values. 3D dressing remains deferred.
