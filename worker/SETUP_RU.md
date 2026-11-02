# Pandora Saga Build Studio — действующие настройки Cloudflare и GitHub


## Состояние проекта после 0.311.0 (2 ноября 2026)

- Основная ветка — `bonaqu_projects`. Версия сайта проверяется по `https://bonaqu.github.io/Pandora-Saga-Build-Studio/site-version.json`.
- Токен **Pandora Studio Catalog PR** уже создан владельцем, не имеет даты истечения и сохранён как **Secret** `GITHUB_CATALOG_TOKEN` в существующем Worker. **Не нужно создавать его повторно**. Ключ не копировать в Pages, D1, GitHub Issues или чат.
- Установка секрета не доказывает, что сам Worker обновлён до нового исходного кода. GitHub Pages и Cloudflare Worker публикуются независимо.
- Прямая проверка выполняется по адресу `https://ps-build-studio-cloud.bonaqu.workers.dev/api/runtime-capabilities`. **HTTP 200** с `codeRelease: "0.311.0"`, `githubOwnerExport: true` и `ownerEditors` означает, что в Production запущен Worker с этим API. **404** или иной ответ — обновление Worker ещё не подтверждено.
- Ответ `/api/health` подтверждает готовность D1 и основных таблиц, **но не заменяет** проверку версии Worker или разрешений GitHub-токена.

### Как обновить существующий Cloudflare Worker, если /api/runtime-capabilities ещё отсутствует

1. Открой Cloudflare Dashboard → **Workers & Pages** → существующий **`ps-build-studio-cloud`** → **Deployments** и **Settings → Builds**. Проверь, подключена ли сборка к GitHub-репозиторию `bonaqu/Pandora-Saga-Build-Studio`.
2. Если GitHub уже подключён: проверь **production branch = `bonaqu_projects`**, рабочую директорию Worker (`worker/`) и команды сборки/деплоя. В **Build history** выбери последнюю публикацию этой ветки; необходимо, чтобы она содержала изменения как минимум релиза `0.311.0`. Успешный Pages deployment этому **не эквивалентен**.
3. Если Worker **не подключён**: Cloudflare официально поддерживает привязку **существующего** Worker через **Settings → Builds → Connect**. Перед сохранением проверь, что ожидаемое имя Worker `ps-build-studio-cloud`, правильная ветка, директория, модуль `worker/index.js`, существующее D1 binding `DB`, а секрет `GITHUB_CATALOG_TOKEN` остаётся привязанным. Файл `worker/wrangler.toml.example` содержит заглушку для database ID — **не загружай этот шаблон как есть**, не создавай второй Worker или D1 и не запускай миграции повторно. Если система предложит создать новые ресурсы, отменяй действие и уточняй настройку.
4. После успешной публикации открой `/api/runtime-capabilities` и убедись в `0.311.0`. Затем проверь `/api/health` и на сайте административное редактирование и чтение существующих билдов/аккаунтов.

Официальные инструкции: [Cloudflare — подключение существующего Worker к GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/) и [Versions & Deployments](https://developers.cloudflare.com/workers/versions-and-deployments/).

### Выгрузка ручных изменений энциклопедии в GitHub

1. После подтверждения версии Worker войди в **скрытую админку** сайта и включи редактирование.
2. В панели администратора открой **PR правок** (или «Синхронизировать ручные правки с GitHub»).
3. Проверь число записей; нажатие «Создать PR в GitHub» попросит Worker перепроверить снимок изменений перед отправкой.
4. Перейди по ссылке на PR. В нём должен быть **только** `data/admin/encyclopedia-overrides.json`, не файлы логинов и не игровые исходные `data/os/*.json`. **Проверь содержимое перед merge**: репозиторий публичный, поэтому опубликованные описания и администраторские примечания тоже будут публичны.
5. Объединяй только проверенный PR с прошедшими тестами. В настройках репозитория включено `delete_branch_on_merge`, поэтому временная ветка удаляется GitHub после объединения.

Ручные правки **продолжают применяться из D1**. Сам PR — история/экспорт, а **не импорт из GitHub в D1**. Новые данные со стороны сервера не должны автоматически затирать подтверждённые административные изменения. Отсутствие `GITHUB_CATALOG_TOKEN` или нехватка прав даст 503/ошибку GitHub, не повод пересоздавать базу. Для записи PR токену требуются **Contents: Read and write** и **Pull requests: Read and write** для указанного репозитория.


> **Для существующего проекта.** База `ps-build-studio-db`, Worker `ps-build-studio-cloud`, GitHub Pages и миграции уже созданы. **Не создавай новую D1, не выполняй исходные миграции заново, не сбрасывай таблицы и не проходи первичную регистрацию администратора.** Ниже приведены действия только для новых функций и диагностики.

## Подключить создание GitHub PR из админки

1. Войди в GitHub под владельцем репозитория `bonaqu/Pandora-Saga-Build-Studio`. Открой [настройку нового ограниченного токена](https://github.com/settings/personal-access-tokens/new) (Settings → Developer settings → Personal access tokens → Fine-grained tokens).
2. Заполни: **Token name** — `Pandora Studio Catalog PR`; **Resource owner** — `bonaqu`; **Repository access** — **Only select repositories** → `Pandora-Saga-Build-Studio`. Поставь срок действия, например 90 дней (по истечении токен придётся обновить).
3. В **Repository permissions** предоставь только **Contents: Read and write** и **Pull requests: Read and write**. Создай токен кнопкой **Generate token**. Скопируй его в менеджер паролей; не присылай в чат и не вставляй в репозиторий.
4. Открой [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **существующий Worker `ps-build-studio-cloud`** → **Settings** → **Variables and Secrets** → **Add**.
5. Выбери **Type: Secret**, **Variable name: `GITHUB_CATALOG_TOKEN`**, **Value:** созданный токен. Нажми **Deploy**. Не используй Plaintext и не изменяй существующее подключение `DB`.
6. Убедись, что на Worker развернут код текущей ветки `bonaqu_projects`. Если новый маршрут отсутствует, проверь **Deployments / Builds** существующего Worker и повтори деплой из подключённого GitHub. **GitHub Pages deploy не заменяет Worker deploy.**
7. Зайди на [сайт](https://bonaqu.github.io/Pandora-Saga-Build-Studio/) → скрытый режим администратора → **Игровой каталог**. Кнопка **Создать PR в GitHub** станет активна, когда Worker сообщает о подключённой интеграции и D1 содержит опубликованный каталог. Создание PR не вносит изменений в основную ветку само по себе: проверь diff, тесты и объедини PR отдельно.

Если кнопка осталась неактивной, сначала проверь, что Secret сохранён в **правильном Worker**, а не в Pages или другом Worker. Не создавай новую D1 и не пытайся исправить это изменением пароля игрока. Если токен истёк, создай новый и **замени только значение** Secret.

## Быстрая настройка после создания токена

Если GitHub-токен **Pandora Studio Catalog PR** уже создан, начинай сразу с пункта 4 выше: **Cloudflare → существующий Worker → Settings → Variables and Secrets → Add → Secret**. Название строго `GITHUB_CATALOG_TOKEN`, значение — скопированный токен. Нажми **Deploy**. **Ни D1, ни Worker повторно создавать не нужно.** Раздел Deployments подтверждает выпуск кода, но не означает, что секрет уже добавлен.

## Проверка записи в существующую D1

В админке → **Игровой каталог** → **Проверить запись в D1**. Worker создаёт временную запись, читает её и удаляет, не переключая активный каталог, не удаляя персонажей и не меняя аккаунты. Положительный результат доказывает только этот цикл, **не полную публикацию нового набора данных**.

## Вход и безопасность

- Админский аккаунт и игровые аккаунты используют разные сессии. Для новых функций не нужна новая регистрация пользователя.
- Не меняй существующий `ADMIN_SETUP_TOKEN`, если первичная настройка уже завершена.
- Cloudflare Secret `GITHUB_CATALOG_TOKEN` используется **только серверным Worker**. Вводить GitHub-токен в поле логина сайта не нужно.
- Рекомендуется регулярно пересматривать права и срок действия токена.

## Если требуется восстановление существующей инфраструктуры

Это **не шаги по подключению PR**. Текущая схема D1 лежит в `worker/migrations/`, шаблон Worker — `worker/wrangler.toml.example`. Миграции применяются только при конкретной необходимости и после проверки существующей базы, без повторного создания или удаления таблиц.

Официальные инструкции: [GitHub Fine-grained PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) · [Cloudflare Worker Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
