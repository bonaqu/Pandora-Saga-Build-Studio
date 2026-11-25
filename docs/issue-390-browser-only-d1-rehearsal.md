# #390 · Cloudflare staging D1 через браузер, без Ubuntu и WSL

**Статус 25.11.2026:** Реальная удалённая репетиция ещё не выполнялась. В Draft PR #809 подготовлен [защищённый workflow](../.github/workflows/editorial-staging-d1-protected-phases.yml). Никакие изменения staging D1, production D1, Worker или Pages не подтверждаются одним лишь добавлением workflow.

## Как устроена защита

GitHub запускает workflow ТОЛЬКО когда к PR #809 добавляется специальная метка. Проверяются точная ветка, 40-символьный HEAD SHA, два успешных полных CI (Node и Chromium на том же SHA), отдельный staging UUID, разрешённые таблицы и явное подтверждение стадии. Для каждой стадии используется защищённое окружение editorial-staging-390 с Required reviewers.

Перед записью полная staging-база выгружается в SQL, проверяется SHA-256 и восстанавливается в памяти SQLite. Для долгосрочного хранения SQL дополнительно шифруется AES-256-GCM с солью, случайным nonce и ключом из scrypt. Полная дешифровка и исходный SHA-256 проверяются перед загрузкой. Публичные GitHub Actions artifacts содержат **только зашифрованный файл .enc и не содержащий секретов receipt.json**, никогда не исходный SQL или пароль. GitHub удалит artifact после **30 дней**, поэтому **до импорта владелец обязан скачать ZIP на свой компьютер и самостоятельно сохранить ключ восстановления вне GitHub**.

GitHub-скрипт может проверить точный SHA зашифрованного файла и наличие GitHub-артефакта. Но GitHub и ассистент **не могут автоматически доказать**, что ты скачал ZIP и сохранил его на своём ПК: этот шаг подтверждается лично владельцем. Без этого заявления импорт не разрешать.

## Что сделать тебе один раз — только в браузере

### 1. Создать защищённое окружение GitHub

Открой https://github.com/bonaqu/Pandora-Saga-Build-Studio/settings/environments → **New environment** → введи имя **editorial-staging-390** → **Configure environment**.

В Deployment protection rules включи **Required reviewers**, укажи свой GitHub-профиль bonaqu и сохрани. **Prevent self-reviews** для единственного владельца НЕ включай. Если GitHub не позволяет выбрать себя — остановись и сообщи мне, не отключай подтверждения в обход.

### 2. Создать временный токен Cloudflare

Открой https://dash.cloudflare.com/profile/api-tokens → **Create Token** → **Custom Token**.

Укажи имя, например «ps390-temporary-staging». Добавь только **Account → D1 → Edit**, ограничь ресурс нужным Cloudflare аккаунтом, установи короткий срок действия. Это разрешение относится к D1 в выбранном аккаунте, а не гарантированно к одной базе, поэтому код дополнительно проверяет конкретные staging имя и UUID. НЕ используй Global API Key, All permissions или All accounts.

Вернись в GitHub → Settings → Environments → editorial-staging-390 → Environment secrets → **Add secret**. Укажи:
- Имя **PS390_CF_TOKEN**
- Значение — только что созданный токен Cloudflare.

**Не присылай значение токена мне в чат, комментарии GitHub или скриншоты.**

### 3. Создать личный пароль бэкапа

В менеджере паролей сгенерируй отдельный случайный пароль длиной 40–64 символа и СОХРАНИ его у себя, например под названием «Pandora staging backup #390». Значение пароля никому не сообщай. Этот пароль позволит расшифровать зашифрованный SQL, если нужно будет восстановить базу после сбоя или окончания срока хранения artifact.

В том же GitHub environment → Environment secrets → **Add secret**:
- Имя **PS390_BACKUP_ENCRYPTION_KEY**
- Значение — этот случайный пароль. GitHub не даст прочитать секрет позже, поэтому копия в твоём менеджере паролей обязательна.

### 4. Добавить метку первого этапа

Открой https://github.com/bonaqu/Pandora-Saga-Build-Studio/labels → **New label**:
- Name: **ps390-backup-before**
- Description: Manual protected staging D1 pre-import encrypted backup
- Color: любой.

Теперь напиши мне **«Окружение editorial-staging-390, Required reviewers, оба секрета и метка ps390-backup-before настроены. Запускай бэкап»**. Не присылай сами секреты. Я проверю GitHub CI и добавлю метку в существующий PR. Если GitHub покажет **Review deployments**, выбери editorial-staging-390 → **Approve and deploy**. Это разрешает исключительно первый read-only backup.

### 5. Получить и сохранить безопасный независимый бэкап

После успешного GitHub Actions run прокрути страницу запуска вниз до **Artifacts**. Скачай ZIP с названием вида **ps390-before-<короткий SHA>-<короткий хеш>** и перемести ZIP из «Загрузки» в надёжное постоянное хранилище своего компьютера (при желании дублируй в собственную резервную копию). Пароль восстановления оставь у себя в менеджере паролей.

В логах шага **Encrypt, authenticate and locally decrypt-test the SQL export** найди 64 символа после **encrypted SHA-256**. Это SHA зашифрованного файла, он не является токеном или паролем.

Открой GitHub → Settings → Environments → editorial-staging-390 → **Environment variables** → Add variable:
- Name: **PS390_RETAINED_BACKUP_SHA256**
- Value: эти 64 символа SHA.

Заполнение переменной означает: **«Я лично скачал защищённый ZIP, сохранил его вне GitHub, а пароль восстановления у меня сохранён отдельно»**. Если это не так, не добавляй переменную.

Пришли мне только **ссылку на успешный GitHub Actions запуск**, SHA encrypted artifact и подтверждение хранения ZIP/пароля. Сами файлы или секреты не передавай.

## Дальнейшие отдельные этапы

После подтверждения первого бэкапа используй этот порядок. Каждая стадия запускается НОВОЙ меткой PR и отдельно подтверждается Required reviewers; новые метки можно создавать по мере необходимости:

| Порядок | Метка GitHub PR | Результат | Предварительное условие |
|---|---|---|---|
| 1 | **ps390-backup-before** | Только чтение D1, полный экспорт SQL, проверка SQLite, encrypted artifact ZIP №1 | Зеленые оба CI, секреты, защищённое окружение |
| 2 | **ps390-import** | Проверка существующего артефакта и SHA, новый pre-write backup, реальный staging import и readback SHA-256 | ZIP №1 и пароль сохранены вне GitHub, переменная PS390_RETAINED_BACKUP_SHA256 заполнена, твой Approve |
| 3 | **ps390-verify** | Отдельная remote read-only проверка всех строк/хеша | Успешный импорт, неизменный HEAD |
| 4 | **ps390-backup-after** | Новый полный экспорт после импорта, encrypted artifact ZIP №2 | Успешный verify, скачай и сохрани ZIP №2 |
| 5 | **ps390-rollback** | Проверка существования ZIP №2 и SHA, свежий backup, отдельно подтверждённое удаление только текущего snapshot, контроль остатка 0 | Обнови PS390_RETAINED_BACKUP_SHA256 хешем ZIP №2, храни оба ZIP, новый Approve |

**Не меняй HEAD PR между этапами**. Если он меняется, прежние SHA/CI/артефакты не дают права импортировать новый исходный snapshot: требуется начать весь backup-цикл заново.

После репетиции останутся финальная RU/EN-приёмка, отдельно одобренный защищённый release и read-only production аудит. PR #809 и issue #390 НЕ сливать/закрывать до этих проверок.

## Если что-то пошло не так

Не запускай import или rollback повторно без анализа. Пришли только ссылку на Actions run и безсекретный текст ошибки. Если импорт оборвался, исходный скачанный ZIP и пароль остаются важнейшей независимой копией. Не удаляй их и не пытайся «починить staging» через production. Сценарий локальной аварийной проверки описан в [premerge-D1 руководстве](issue-390-premerge-d1-staging.md).

Источники: [GitHub Environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments), [GitHub labeled PR event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [GitHub artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data), [Cloudflare D1 SQL exports](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
