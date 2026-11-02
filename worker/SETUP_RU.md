# Pandora Saga Build Studio — действующие настройки Cloudflare и GitHub

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
