# Pandora Saga Build Studio — карта модулей и зависимостей

## Граница данных и кода

**Игровые идентификаторы, баланс и исходные JSON актуального игрового сервера сохраняют постоянные пути** `data/os/*.json`, независимо от названий модулей интерфейса. Нельзя переименовывать ID классов, умений, предметов или пространств D1 ради «красоты» репозитория: они используются в билдах, ссылках, сохранениях и игровой энциклопедии.

| Область | Файлы | Ответственность |
|---|---|---|
| Запуск сайта | `index.html`, `pandora-studio-app.js` | Единая точка загрузки модулей и состояние редактора |
| Общая тема | `pandora-studio-theme.css`, `pandora-studio-equipment-tooltip.css` | Внешний вид игрового UI без расчётов и доступа к D1 |
| Персонаж | `pandora-studio-origin-model.js`, `pandora-studio-attribute-progression.js`, `pandora-studio-hero-book.js` | Раса, класс, характеристики, книга героя |
| Боевые расчёты | `pandora-os-character-calculator.js`, `pandora-studio-enchantment.js` | Только подтверждённые коэффициенты и отдельные предварительные значения |
| Умения | `pandora-studio-hero-path.js`, `pandora-studio-skill-progression.js`, `pandora-studio-skill-milestones.js`, `pandora-studio-skill-results.js` | Навигация, очки освоения и требования |
| Экипировка | `pandora-studio-equipment-ui.js`, `pandora-studio-equipment-plan.js`, `pandora-studio-equipment-rules.js`, `pandora-studio-item-presentation.js` | Совместимость, слот, свойства, заточка, души |
| Энциклопедия | `pandora-studio-encyclopedia-data.js`, `pandora-studio-encyclopedia-catalog.js` | Поиск по сохранённому или опубликованному снимку |
| Библиотека | `pandora-studio-build-scope.js`, `pandora-studio-build-comparison.js`, `pandora-studio-build-library-merge.js` | Изоляция, сравнение и разрешение конфликтов билдов |
| Аккаунты | `pandora-studio-account-ui.js`, `worker/pandora-studio-account-api.js` | UI логина и серверная авторизация, без секретов в браузере |
| Локализация | `pandora-studio-ui-locale.js`, `data/localization/`, `data/os/strings.en.json` | Только RU/EN UI и подтверждённые названия OS; Legacy отдельно |
| Обновления | `pandora-studio-update-manager.js`, `site-version.json` | Обнаружение релиза и обновление кеша без потери черновика |
| Синхронизация каталога | `pandora-os-catalog-import.js`, `pandora-os-catalog-diff.js`, `pandora-os-catalog-review.js`, `pandora-os-catalog-workbench.js` | Валидация, различия, решения администратора; запись только через Worker |

Cloudflare Worker остаётся в `worker/index.js` по требованиям точки входа Wrangler. `package.json`, `index.html` и `site-version.json` — инфраструктурные имена и не переименовываются. Дублирующих compatibility-алиасов для старых JS/CSS путей нет.

## Жизненный цикл обновления игрового каталога

1. Администратор нажимает **Проверить обновления игрового каталога**. Только авторизованный Worker запрашивает 17 разрешённых JSON с оригинального сервера. Клиент не загружает чужой серверный API во время обычной игры.
2. Проверяются `meta.counts` и полнота локализации. 19 пространств D1 имеют стабильные имена. Старый активный снимок не меняется.
3. Данные D1 считываются с одним `X-PS-Catalog-Snapshot`; другие версии в одном сравнении запрещены.
4. Администратор видит все отличия, включая **метаданные сервера**, и выбирает что принять. Новые изменения по умолчанию не выбраны.
5. `compose()` создаёт новый снимок без изменения исходных объектов, пересчитывает `counts` и `localeCounts`. Если результат не соответствует оригинальному полному снимку OS, его официальный `sha` удаляется и добавляется `curated`.
6. `normalize()` проверяет состав всего набора; `worker/index.js` загружает новые записи в отдельный `snapshot`, проверяет количество и переключает активный указатель только по `expectedActive`. При конфликте возвращает 409.
7. При публикации нового снимка **Legacy-переводы из текущей D1 сохраняются дословно с их оригинальными ключами и метаданными источника**. Игровая сверка не изменяет переводы из локального архива без отдельного подтверждения.
8. Обновление **файлов GitHub — отдельное действие**: выгрузить `pandora-studio-reviewed-catalog.json`, проверить `npm run catalog:review -- FILE`, затем `--write`, Git diff, тесты и PR. Не хранить GitHub PAT на сайте. Старые клиентские билды не переписываются.

## Проверки перед любым рефакторингом или обновлением OS

```bash
node scripts/audit-studio-dependencies.mjs
npm test
npm run release:check
npm run test:browser
```

Аудитор проверяет реальные HTML-файлы, наличие скриптов/стилей, отсутствие старых названий и порядок критичных модулей; Node проверяет расчёты, права, модель D1, сохранение, выборочную синхронизацию; Chromium проверяет игровой интерфейс и админский сценарий.

**Граница достоверности:** даже все зелёные тесты не доказывают точное совпадение HP/MP, итоговой защиты, магического усиления и игрового клиента OS. Серверные исходные JSON подтверждают данные, но не весь порядок внутренних расчётов; это отдельный реестр в `docs/OS_LIVE_PARITY_CHECKS.md`.
