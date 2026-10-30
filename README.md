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

The admin login is hidden from the public interface. Five clicks on the Pandora Saga logo within six seconds, or Ctrl+Alt+Shift+P, opens the owner login. This is visual concealment only: all privileged operations remain secured server-side. Account name is fixed to `administrator`. Initial password creation is intentionally **blocked** until the owner provisions a server-only `ADMIN_SETUP_TOKEN` secret (>=32 characters), because a publicly accessible first-visit registration could otherwise be claimed by anyone.

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

First successful login: five logo clicks → `administrator` → new password (minimum 12 chars) + one-time setup token. Subsequent logins use only the password. Server stores only a unique-salt PBKDF2 password hash, short-lived hashed bearer sessions and restricted editable text overrides in D1. Session token stays in browser memory (not in public source or localStorage). Editing: toggle edit mode; double-click outlined text; save the change through the authenticated Worker.

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
