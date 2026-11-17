# Исторические заметки README · часть 1 из 6

# Pandora Saga Build Studio

**Для разработчиков и ИИ-агентов:** [правила GitHub, обязательные проверки и быстрый безопасный процесс](../../docs/REPOSITORY_OPERATIONS_AND_FAST_DELIVERY.md) · [AGENTS.md](../../AGENTS.md). Актуальные настройки/PR проверяйте в GitHub перед работой.

**Текущую версию** см. в [site-version.json](../../site-version.json) и [CHANGELOG.md](../../CHANGELOG.md). [Read-only сверка D1 и Pages](../../docs/D1_LIVE_CATALOG_PARITY_2026-11-08.md) (`npm run catalog:parity:live`, по текущим рабочим правилам — после релиза или вручную; ежедневные запуски отключены). Список активных проблем и проверенных веток — [Issue triage](../../docs/ISSUE_TRIAGE_2026-11-08.md) и [Branch audit](../../docs/LEGACY_BRANCH_RETIREMENT_2026-11-08.md). Ниже сохранены исторические заметки прошлых релизов.

**0.375.0:** редактор сохраняет раскрытое состояние между главной, библиотекой билдов и энциклопедией; свёрнутый переключатель остаётся слева без мигания. Вкладки энциклопедии и подразделы «Чести» теперь переименовываются с RU/EN по отдельности, не меняя внутренних ключей. Единый поиск и замена связей по игровому названию вместо ручных ID. «Честь» без дублирования стартовых очков, с иконками рангов и наградами. Согласованные паттерны: [docs/APPROVED_UI_UX_GUIDELINES.md](../../docs/APPROVED_UI_UX_GUIDELINES.md).

**0.374.0:** исправлена недоступность кнопки «Скрыть» в раскрытом редакторе при наложении липкой шапки. Кнопка имеет больший порядок наложения, сохраняет кликабельность после перехода в Энциклопедию. Проверка Chromium контролирует реальную область нажатия.

**0.373.0:** кнопка редактора всегда закреплена у левой границы окна (включая энциклопедию), без вылезающей старой полосы. Раздел «Честь»: RU/EN названия раздельно, без новости и технических источников; все основные пояснения, условия рангов и награды ежемесячных титулов редактируются по двойному клику с сохранением позиции статьи. PvP-локации выбираются по имени из существующих; новые создаются отдельно в «Локациях». Worker обновлён для дополнительных D1-полей справочника; выпуск Worker выполняется отдельным GitHub Actions deploy при изменении `worker/index.js`.

**0.372.0:** переработана компактная панель редактора без вертикального выступа и лишнего наружного скролла; основной портрет всегда открывает Книгу героя (в том числе в режиме редактора), а смена его изображения остаётся в «Происхождение → Раса». Существующие обмены NPC получили поиск NPC по имени и защиту от повторного материала. Добавлена кнопка ручной безопасной проверки временной записи production D1 и `npm run assets:missing` для поиска 264 отсутствующих оригинальных иконок, без подмены изображений. Подробная матрица возможностей редактора — `docs/ENCYCLOPEDIA_EDITOR_AUDIT_2026-11-05.md`.

**Обновление 0.371.0:** компактная карточка награды за уровень с отдельной меткой класса, удобнее сетка сундука. Администратор может прямо из предмета добавить его в настоящую добычу монстра или создать обмен NPC; справочные связи отделены от игровых таблиц. Для отсутствующих шансов сохраняется «не указан», а перед записью проверяются все ссылки. Доступны read-only проверки `npm run assets:audit` и `npm run locales:audit`. Исходные OS данные, расчётные формулы, билды и production D1 не перезаписываются.

**Обновление 0.370.0:** в энциклопедии награды за уровень показывают понятное «Класс: Маг/Воин/Следопыт/Адепт» (и единственное число в EN). Исходные данные сундуков и D1 не меняются.

## Обновление игровых данных · управление через админку

Администратор открывает **Игровой каталог** → **Проверить обновления игрового каталога**. Проверяются 17 игровых JSON, целостность источника и версия опубликованной D1. Экран показывает число добавленных, изменённых, удалённых и выбранных записей, а фильтры позволяют видеть только нужные изменения. Можно принять весь раздел или только найденные записи. По умолчанию **ни одна запись не принята**: можно выбрать отдельные изменения, раздел или все изменения, отклонить выбор, искать по названию и ID. Обмены NPC, инстансы, игровые формулы, мастерство и сундуки принимаются целиком, чтобы сохранить внутренние связи. Перед публикацией снимок снова проверяется, а Worker атомарно предотвращает перезапись более новой D1.

**Уже опубликованные Legacy-переводы D1 сохраняются без изменений** при обновлении предметов, навыков и других игровых данных. Принятие игровых изменений не означает принятие нового файла переводов из GitHub.

**Прямое создание GitHub PR** доступно из админки после однократной настройки Cloudflare Secret `GITHUB_CATALOG_TOKEN`. Оно переносит только 17 проверенных игровых JSON из опубликованного снимка D1 в отдельную ветку и открывает PR без автоматического слияния. [Инструкция по подключению](../../worker/SETUP_RU.md#github-pr-прямо-из-админки-без-токена-в-браузере).

**Проверка записи в D1** доступна отдельно: временная вставка, чтение и удаление без смены активного каталога. Это не эквивалент полноценной игровой публикации.

**D1 не обновляет файлы GitHub автоматически без подключения интеграции.** Кнопка «Скачать выбранное для GitHub» создаёт проверяемый JSON-экспорт. Обновить архив в собственном checkout можно только отдельно:

```bash
npm run catalog:review -- ./pandora-studio-reviewed-catalog.json
npm run catalog:review -- ./pandora-studio-reviewed-catalog.json --write
npm test
npm run test:browser
```

Первый вызов — dry run без записи файлов. После `--write` изучи Git diff и тесты, затем создай обычный GitHub-коммит. Браузер не содержит GitHub PAT. Включение новой логики D1 требует отдельного успешного деплоя Worker; сам GitHub Pages deploy этого не делает.


Independent, visual, vintage-inspired Pandora Saga build planner. Static site intended for **GitHub Pages**, secure optional CMS backend on **Cloudflare Workers + D1**.

[**Архитектура и связи модулей**](../../docs/STUDIO_ARCHITECTURE.md) · [**Полный журнал релизов**](../../CHANGELOG.md) · [Полный аудит формул Remaked](../../docs/REMAKED_FORMULA_INVENTORY.md) · [Игровые проверки актуального игрового сервера](../../docs/OS_LIVE_PARITY_CHECKS.md) · [**Development roadmap and verification matrix**](../../ROADMAP.md) · [Full combat parity epic](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5)

## Status

**Interactive foundation, not a finished game calculator.** **Permanent planning range 1–55 (new heroes start at level 1), including future patch items.** Three current OS item-set/unison combinations now contribute known effects to final hero stats when their companion gear and root refinements match, with active bonuses visible in the book. The OS server's currently published cap of 45 is informational only and never limits saved builds, gear, attributes, skill progression, or calculator previews. Eight portraits for six races (from user-provided Races.zip), **1,173 original self-hosted WebP images (286 skill, 876 item, 11 Soul; 264 remaining original icon URLs returned HTTP 404)**, 28 legacy jobs, 20 skills branches, playable visual UI, 14 equipment slots, local build library and short-link sharing interface (requires Worker/D1 deployment), and static client logic. Current official current game server game tables are shipped under `data/os/` (snapshot of 2026-10-30: 28 classes, 569 skills, 1,116 items, 112 Souls). The public workbench first requests a consistent published Cloudflare Worker/D1 catalog and otherwise loads the complete bundled data/os snapshot. Wiki uses the same atomic-source rule. The authenticated admin workflow can compare upstream game data without automatically overwriting published D1. Correctness for current current game server is **not established**. The frontend does not make up combat formulas. The historical dataset is not a substitute for direct API sync.

## Publish on GitHub Pages (no user-defined GitHub Actions)

1. Repository: `bonaqu/Pandora-Saga-Build-Studio`. The root of the `bonaqu_projects` branch contains `index.html`, `pandora-studio-theme.css`, `pandora-studio-app.js`, `assets`, and `.nojekyll`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: bonaqu_projects → /(root) → Save**.
3. Open `https://bonaqu.github.io/Pandora-Saga-Build-Studio/` after GitHub reports Pages publication.

Even branch-based publication internally uses GitHub Pages' infrastructure; no custom Actions workflow is required. The Cloudflare API token in the repository secrets is neither required nor read by the static site.

## Simple Cloudflare setup without local CLI

**[Пошаговая инструкция Cloudflare (RU)](../../worker/SETUP_RU.md)** — настроить D1, связать существующий Worker с GitHub через бесплатные Workers Builds, задать `PS_D1_DATABASE_ID` и серверный Secret `ADMIN_SETUP_TOKEN`, проверить API. No GitHub Actions needed. The new script `worker/scripts/prepare-config.mjs` generates an ignored Wrangler configuration using the non-secret D1 UUID at build time.

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

## 2026-10-31 — выпуск 2026.10.31.86

- В системе чести теперь один выбранный титул из 13, а не независимый флажок. Эффекты титула показываются в атрибутах, устаревшие билды со «Стремлением к силе» сохраняют бонус. RU/EN подписи поддержаны.
- Добавлена эффективность зелий от ВЫН с бонусом «Крепкое тело», «Душа зелий» и руной «Чо Ын»; это отдельный показатель восстановления, не максимальные ОЗ/ОМ.
- В «Усилениях» — свёрнутый просмотр 10 проверенных актуальных предметов с формулами 14 исходных вариантов Remaked Modern 4.23. Без включения галочки показывается исходное восстановление. Просмотр не изменяет билд и не активирует эффекты сам.
- Новые настройки проходят безопасную проверку при обмене билдом. Не все профессии/условные эффекты/боевые формулы завершены: перечень открыт в `docs/REMAKED_CALCULATOR_PORT.md`.

## 2026-10-31 — выпуск 2026.10.31.85

- Расширена функциональная совместимость с проверенным владельцем движком Simulator Remaked: гильдейская прибавка ко всем характеристикам, бонус чести «Стремление к силе», активируемый «Проэлиум».
- СД/ВЫН и остальные затронутые статы теперь передаются в расчёт производных ОЗ/ОМ с правильным порядком применения. Настройки расположены во втором свёрнутом уровне вкладки усилений, сохраняются в сборке и при обмене ссылкой.
- Исполненные правила и перечень ещё открытых механик задокументированы в `docs/REMAKED_CALCULATOR_PORT.md`. Не считать всю механику зелий, чести, гильдий или навыков законченной на этом этапе.
- Целевые регрессионные проверки источников, совместного эффекта и ссылок пройдены; полноценный `npm test` и приёмка в живом браузере ещё необходимы.

## 2026-10-31 — выпуск 2026.10.31.84

- Объединённый выпуск 0.83 и финальной интеграционной правки: источники ОЗ/ОМ, выбор усилений и адаптация портретов работают вместе с сохранением выбора в публичных ссылках.
- Новые настройки гильдии и «Знака жизни» не подменяются и не обнуляются при получении корректной публичной ссылки; некорректные значения безопасно игнорируются.
- Оставшиеся непроверенные игровые эффекты документированы, полной точности всех серверных механик пока не заявляем. Полная браузерная приёмка и независимое развёртывание ещё открыты.

## 2026-10-31 — выпуск 2026.10.31.83

- ОЗ/ОМ рассчитываются с учётом подтверждённых процентов предметов и душ, части явных условий заточки, гильдейских усилений и «Знака жизни». Источники и пределы точности указаны в `docs/HP_MP_COVERAGE.md`.
- Выбор усилений расположен в свёрнутом разделе характеристик и по умолчанию выключен. Билды сохраняют выбор; старые сборки не получают неактивные эффекты автоматически.
- Портрет экипированного героя стал ниже, но без обрезания. Выбор расового образа и портрет героя больше визуально разграничены на узких экранах.
- **Не все эффекты пока реализованы.** Для окончательной точности нужны полные данные комплектов, особых усилений, умений и проверка по живому игровому клиенту. Сквозная визуальная проверка выполняется владельцем.

## 2026-10-31 — выпуск 2026.10.31.82

- В «Происхождение → Характеристики» ОЗ и ОМ показываются более крупными числами без лишних символов и `≈`. Это результат доступного калькулятора; полное совпадение с игровым сервером пока не подтверждено.
- При возврате из специализации к профессии и её направлению теперь отображается название уже выбранного конечного класса. Вернуться назад — не значит отменить выбор.
- Панель «Происхождение» на desktop достигает высоты центральной панели портрета; высота пересчитывается при изменении окна, мобильный интерфейс остаётся свободным по высоте.
- Подпись выбора расы исправлена. Регрессионные проверки: 28/28 в изолированной модели, визуальные проверки остаются открыты.

