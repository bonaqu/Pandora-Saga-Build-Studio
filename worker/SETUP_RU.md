# Cloudflare: настройка Pandora Saga Build Studio без GitHub Actions

Здесь описан процесс для уже созданного Worker **ps-build-studio-cloud** и сайта на **GitHub Pages**. Отдельные платные продукты не нужны, но расходуются бесплатные лимиты Cloudflare.

**ВАЖНО:** никаких паролей, `CLOUDFLARE_API_TOKEN` или `ADMIN_SETUP_TOKEN` в GitHub, Issues, чаты и переменные *Plaintext* публиковать нельзя. Секрет админки создаётся только в Cloudflare как **Secret**. Существующий GitHub repository secret `CLOUDFLARE_API_TOKEN` здесь не используется и не читается.

## Шаг 1. Создать D1

1. Открой [Cloudflare dashboard](https://dash.cloudflare.com/) → **Storage & databases** → **D1 SQL database** (пункт также может называться **D1**).
2. Нажми **Create database**, имя: `ps-build-studio-db`. Регион оставь автоматическим. Подтверди создание.
3. Открой новую базу и **скопируй только Database ID (UUID)**. Это идентификатор, не пароль.
4. Открой вкладку **Console**, вставь SQL из [0001_initial.sql](migrations/0001_initial.sql), выполни кнопкой **Execute**. Схема состоит из таблиц `admins`, `sessions`, `overrides`, `login_attempts` и индекса для сессий. **Если таблицы уже созданы — не удаляй их.**
5. Для проверки через Console выполни:
   ```sql
   SELECT name FROM sqlite_master
   WHERE type = 'table' AND name IN ('admins','sessions','overrides','login_attempts')
   ORDER BY name;
   ```
   Должны вернуться 4 строки.

## Шаг 2. Подключить существующий Worker к GitHub (Cloudflare Workers Builds)

1. Cloudflare → **Workers & Pages** → Worker **ps-build-studio-cloud** → **Settings → Builds** → **Connect**.
2. Выбери **GitHub**, разреши Cloudflare доступ к репозиторию `bonaqu/Pandora-Saga-Build-Studio`. Не требуется GitHub Actions.
3. Укажи следующие параметры (если на первом экране они ещё не доступны, сохрани подключение и открой **Settings → Builds → Build configuration**):

   | Поле | Значение |
   |---|---|
   | Repository | `bonaqu/Pandora-Saga-Build-Studio` |
   | Production branch | `bonaqu_projects` |
   | Root directory | `worker` |
   | Build command | `node scripts/prepare-config.mjs` |
   | Deploy command | `npx --yes wrangler@4 deploy` |
   | Preview Builds | **Off** |
   | Build-time environment variable | `PS_D1_DATABASE_ID` = UUID из шага 1 |

   **PS_D1_DATABASE_ID — не пароль.** Это *build-time* переменная в настройках Builds, а не runtime Worker secret. Скрипт создаёт игнорируемый Git файл `worker/wrangler.toml` непосредственно при сборке. Пример шаблона: [wrangler.toml.example](wrangler.toml.example).

4. В разделе **Build watch paths**, если он доступен, ограничь автоматические сборки путями `worker/**`. Это не даст каждому изменению картинок или страниц запускать сборку Worker.
5. Сохрани и выполни **Retry build / Deploy** по интерфейсу Cloudflare. В логах сборки должны быть сообщения `Wrangler config created` и успешный `wrangler deploy`.

**Если первый автозапуск упал из-за отсутствующего PS_D1_DATABASE_ID — это ожидаемо; добавь UUID и повтори сборку.** Сама структура сайта в GitHub Pages от этого не ломается.

## Шаг 3. Добавить секрет первичной регистрации

1. Cloudflare → **Workers & Pages** → **ps-build-studio-cloud** → **Settings** → **Variables and Secrets** → **Add**.
2. **Type: Secret** (не Text/Plaintext). **Name: `ADMIN_SETUP_TOKEN`**.
3. Сгенерируй **случайный секрет минимум 32 символа** в надёжном менеджере паролей и вставь в **Value**. Сохрани / **Deploy**.
4. Сохрани этот секрет в менеджере паролей. Не отправляй его мне и не храни в исходниках.
5. При первой регистрации на сайте введи фиксированный логин `administrator`, **новый пароль минимум 12 символов** и этот одноразовый секрет. После успешной регистрации все последующие входы используют только логин и пароль.

**Важно:** если нужно, секрет `ADMIN_SETUP_TOKEN` можно удалить после подтверждённой регистрации, потому что повторная регистрация блокируется записью администратора в D1. Не удаляй пароль/хэш в базе ради повторного первого входа.

## Шаг 4. Проверить работу

- [Открыть Worker /api/health](https://ps-build-studio-cloud.bonaqu.workers.dev/api/health). **После миграции и привязки** должен вернуть JSON `{"status":"ok","storage":"d1"}` (могут быть дополнительные поля).
- [Открыть /api/overrides](https://ps-build-studio-cloud.bonaqu.workers.dev/api/overrides). До редактирования допустимо `{"values":{}}`.
- [Открыть GitHub Pages](https://bonaqu.github.io/Pandora-Saga-Build-Studio/). Нажми ⚙, заполни логин `administrator`, новый пароль и секрет первичной установки.
- В админ-режиме дважды нажми на обычный заголовок, измени его и проверь после перезагрузки.
- Открой сайт в другом браузере без входа: у посетителя нет административных прав, но опубликованное оформление должно отображаться.

Если API показывает `503 Database not configured`: проверяй build-time UUID и D1 binding с именем **DB**, затем повтори Worker deploy.
Если health показывает `setup_required`: выполни SQL миграцию в базе, привязанной к этому Worker.
Если `Invalid setup credentials`: секрет Worker отличается от введённого.
Если `Already initialized`: учётная запись уже существует — вводи обычный пароль, поле одноразового секрета оставь пустым.
Если `CORS`: убедись, что отправляешь запрос с подлинного `https://bonaqu.github.io/Pandora-Saga-Build-Studio/`, а не из локального `file://` файла.

## Позже: надёжность и лимиты

- Free Workers Builds имеют самостоятельный месячный лимит (не лимит GitHub Actions).
- Для D1 используй вкладку **Backups / Time Travel** перед ручными изменениями, если она доступна.
- Административные пароли хранятся только как salted PBKDF2-хэши; браузерная сессия находится в памяти вкладки, а сами сеансы — в D1.
- Программное обновление Worker не должно запускать D1 SQL миграции автоматически в каждом build; схемой управляй отдельно и осознанно.

Источники: [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [Cloudflare D1](https://developers.cloudflare.com/d1/get-started/), [Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
