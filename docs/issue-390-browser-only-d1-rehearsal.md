# #390 · Cloudflare staging D1 через браузер, без Ubuntu и WSL

**Итоговая контрольная точка 25.11.2026 (текущая):** Защищённый полный цикл **0.948.0 / 2 734 строки** в удалённой изолированной D1 завершён успешно: [backup-before](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45559467646) → [import](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45625033258) (вторая попытка SUCCESS, первая остановлена до записи из-за старой SHA) → [полный read-only readback SHA](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45628400442) → [backup-after](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45629121890) → [rollback](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45632270586), **0 оставшихся строк/маркеров для данного снимка**. Снимок `0.948.0-5637e5c111eb4528`, SHA `5637e5c111eb452800609eb44f808f2f9d465277252595ad8e2c125f79cb6c8d`. Владелец отдельно сохранил зашифрованные ZIP и пароли. Production D1/Worker/Pages не изменялись. Новая клиентская автоматическая привязка к пину запускается как GET только при штатном онлайн-старте; включение Worker preview, реальная активация в production, CI нового HEAD и post-release аудит остаются **отдельными обязательными воротами**. Предыдущие примечания ниже описывают неактуальные ошибки и их историю.

**Исторический статус до завершённой независимой проверки:**  Успешный удалённый защищённый бэкап staging D1 в run #45547551653. Попытка импорта run #45552110499 завершилась ошибкой при проверке результата **после успешного завершения Wrangler SQL import**. Нельзя утверждать ни что staging пустая, ни что все записи корректны, без отдельной read-only проверки. PR #809 остаётся Draft; production D1 не была целью операций.

## Успешный бэкап и необходимость независимой проверки импорта (25.11.2026)

- [Run #45547551653](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45547551653) выполнил экспорт из нужной удалённой staging D1, локальное восстановление SQLite, проверку SHA-256, аутентифицированное AES-256-GCM-шифрование и загрузку артефакта #14992097129. Сохранённая ciphertext SHA-256: `9aec9aee91b98f8221e4e09f54e4037e49dae58d8341f4b2046d1a98b075ea11`. Пользователь сообщил, что загрузил ZIP на ПК, отдельно сохранил пароль и установил защищённую переменную для аттестации.
- [Run #45552110499](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45552110499) был отдельно одобрен на импорт в изолированную staging D1. Проверки HEAD, обоих CI, артефакта, UUID, отсутствия данных и независимого предзаписного бэкапа прошли. **После успешного выполнения команды SQL-импорта** Wrangler не принял следующий read-only `--command`: `Unknown argument: STAGING READBACK ONLY`. Следовательно, наличие и целостность внесённых строк пока не подтверждены. Нельзя автоматически повторять импорт или делать откат.
- Причина новой ошибки: `readQuery` удалял стартовые `--`-комментарии для валидации, но затем передавал исходный SQL с комментарием в Wrangler. Исправлено на передачу именно очищенной проверенной строки `SELECT ...;`; добавлен регрессионный тест. Следующий шаг — только отдельно одобренная read-only `ps390-verify` после зелёного CI на новом HEAD.

## Первый реальный запуск и исправление CLI (25.11.2026)

[GitHub Actions run #45545964748](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/45545964748) получил подтверждение владельца, проверил exact HEAD/зелёные Node+Chromium, действующий Cloudflare API Token, staging имя/UUID и пустой список разрешённых пользовательских таблиц. Затем **read-only pre-import backup FAILED** с сообщением `Remote D1 JSON is malformed`: предыдущий runner использовал `wrangler d1 execute --remote --file <read-only SQL> --json`. По исходникам Wrangler `--file` направляет SQL через удалённый механизм импорта, не возвращающий обычный JSON результатов `SELECT`. Исправление: все read-only SQL используют **`--command` строго с одним `SELECT`**, а отдельные mutating `--file` доступны только подтверждённым стадиям import/rollback. Сырой ответ Cloudflare не логируется, поскольку позднее он может содержать авторские тексты. **В run #45545964748 отсутствуют SQL export, encrypted artifact и любые подтверждённые операции записи; ничего скачивать оттуда не нужно.**

Для повторного запуска будет создан **новый** запуск GitHub Actions на исправленном exact HEAD после двух зелёных CI. Тот же пользователь должен ещё раз нажать **Review deployments → Approve and deploy**. До этого исходный PR нельзя сливать/закрывать. Ни импорт, ни rollback без отдельного разрешения не запустятся.

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
