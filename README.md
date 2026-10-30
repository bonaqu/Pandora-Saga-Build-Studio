# Pandora Saga Build Studio

Independent, visual, vintage-inspired Pandora Saga build planner. Static site intended for **GitHub Pages**, secure optional CMS backend on **Cloudflare Workers + D1**.

[**Development roadmap and verification matrix**](ROADMAP.md) · [Full combat parity epic](https://github.com/bonaqu/Pandora-Saga-Build-Studio/issues/5)

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

## 2026-10-30 — выпуск 2026.10.30.42: частичные бонусы сопротивлений и боя

- Панель «Атрибуты» теперь подсчитывает **только подтверждённые плоские прибавки от надетых вещей и подходящих душ**: огонь, лёд, молния, яд, очарование, свет, тьма, магия; отдельно точность, уклонение, крит.
- Механики основаны на названиях `EP_*_RESISTANCE_CONST`, `EP_TOHIT_CONST`, `EP_AVOIDANCE_CONST`, `EP_CRITICALRATE_CONST`, сопоставленных в `Pandora-Saga-Simulator-remaked/modern/enhancement-effects.js`. В модели итогов хранится проверяемый след применённых источников.
- Эти значения **не итоговые**: исходные сопротивления расы/класса, специальные проценты, иммунитеты и баффы не прибавляются без отдельно установленного правила. Не смешиваем их с боевыми параметрами персонажа.
- Обновлена регрессия выбора профессии: проверяется пошаговая навигация, а не удалённое разветвлённое дерево `<details>`.

## 2026-10-30 — выпуск 2026.10.30.41: сверка вычислений ОЗ/ОМ с OS

- Исправлено ошибочное округление `Math.round` на `halfToEven` (банковское). Его порядок подтверждён анализом публичного `BuildCalculator-BiybySwQ.js` от 2026-10-11 в `Pandora-Saga-Simulator-remaked/docs/CALCULATION_PARITY_AUDIT_2026-10-11.md`.
- Для текущего снаряжения и установленных подходящих душ участвуют числовые эффекты `EP_VITARITY_CONST`, `EP_SPIRITUAL_CONST`, `EP_STRENGTH_CONST`, `EP_AGILITY_CONST`, `EP_DEXTERITY_CONST`, `EP_INTELIGENCE_CONST`, `EP_MAXLIFE_CONST`, `EP_MAXMANA_CONST`. На уровне +0 предмет сохраняет обычные эффекты; при установке души соблюдается доступное гнездо и её границы активности.
- Атрибуты основы вычисляются как `max(1, basic+flat+floor(basic*percent/100))`; в текущем этапе `percent=0`, поскольку процентные источники, последовательность стекования и групповое усиление требуют отдельной проверки.
- Поддерживаемые плоские бонусы теперь влияют на предварительные ОЗ/ОМ. Сложные эффекты, прибавки от порогов заточки, комплекты, пассивки, баффы гильдии, чести и группы **не добавляются** автоматически. В интерфейсе результат помечен как приближённый, в расчётном объекте сохраняются неприменённые коды эффектов.
- Это улучшение математической согласованности по **сохранённому** OS-снимку, но не доказательство полного соответствия каждой текущей версии сервера.

## 2026-10-30 — выпуск 2026.10.30.40: устранение неполного списка в энциклопедии

- Энциклопедия больше не делает вид, что в базе есть только первые 100 записей. Показан настоящий размер текущей выборки, а кнопка «Показать ещё» раскрывает следующие 100 элементов без перестройки всего каталога.
- Фильтр поиска проходит **все** записи выбранного раздела; после смены категории/поиска пагинация сбрасывается. Внутренняя прокрутка списка сохраняется при добавлении очередных записей.
- Проверяемые данные из D1 остаются предпочтительным источником; в случае недоступности каждого файла продолжает работать встроенный снимок OS. Нет нового искусственного индекса записей.
- Прямую браузерную проверку отображения вики ещё необходимо провести отдельно.

## 2026-10-30 — выпуск 2026.10.30.39: компактное происхождение и пошаговая профессия

- Левая панель разбита на четыре небольших раздела-переключателя «Раса», «Профессия», «Пассивка», «Уровень» вместо длинной вертикальной формы.
- Профессии выбираются в три шага: стартовая ветка → профессия второго уровня → конечная специализация. Кнопка «Назад» возвращает на предыдущий уровень дерева, текущий выбранный класс сохраняется в билде. Для промежуточного класса доступен отдельный выбор, если игрок ещё не завершил специализацию.
- Расу можно выбрать не только кнопкой, но и нажатием на изображение; кнопка больше не блокируется атрибутом `disabled`. Точный портрет, включая мужские и женские варианты человека и эльфа, сохраняется в билде.
- Расширена правая колонка «Путь героя» за счёт меньшей ширины портрета и увеличенного общего max-width контента на Full HD/2K. Мобильная адаптация не заменена desktop-only раскладкой.
- Выбранный раздел происхождения и шаг выбора профессии остаются при F5.

## 2026-10-30 — выпуск 2026.10.30.38: исправление критических регрессий экипировки и навигации

- Исправлен `root.PandoraEnchantModel` внутри `stage-item-ui.js`: `root` был HTML-элементом, поэтому модульный выбор и свойства предмета падали с TypeError. Теперь используется реальный глобальный модуль, и карточка не должна зависеть от совпадения имён.
- Заточка **только** оружия, щита, шлема, нагрудника, перчаток, поножей и обуви. Плащ, кольца, серьги, амулет и пояс не показывают несуществующие кнопки улучшения. Обработчики повторно проверяют тип слота.
- Перерисовка уровня улучшения сохраняет внутреннюю прокрутку текущей страницы предмета, а переключение вкладок работает отдельно.
- Устранена причина открытия энциклопедии после F5: переход в другой раздел удаляет устаревший `#wiki/...` из URL и повторное восстановление вики проверяет выбранную вкладку.
- Общий цвет и вид скроллбаров согласован в Chromium/Firefox и внутренних панелях. Содержимое D1 и серверные методы не менялись.

## 2026-10-30 — выпуск 2026.10.30.37: проверка фактического переноса игровых иконок

- `npm run assets:audit`: независимая локальная проверка оригинальных WebP из каталога OS, соответствия имени файла, манифеста и счётчиков по трём категориям. Без сетевых запросов и изменения файлов.
- `npm run assets:audit:strict`: ненулевой код завершения, пока не перенесены и не проверены все 1437 оригинальных файлов. Промежуточный прогресс проверяется обычной командой.
- Загрузка остаётся через `npm run assets:mirror -- --limit=200` с пропуском уже валидных файлов. Физически завершить перенос через текущую среду пока нельзя: доступ к источнику иконок отсутствует.
- Никакие оригинальные игровые иконки не подменены другим артом или заглушками.

## 2026-10-30 — выпуск 2026.10.30.36: запоминание раскрытых веток профессий

- Исправлена HTML-ошибка: отсутствие ветки среди раскрытых теперь задаётся `open: null`, а не `open: ''` (пустой HTML-атрибут `open` всё равно открывает `<details>`).
- При нажатии на заголовок профессии новое состояние открытых веток сохраняется в `sessionStorage`. После F5 остаются раскрытыми те же ветки. Выбранная профессия автоматически отображается в дереве после смены класса.
- В историческом справочнике Pandora Saga таблица Астирских комплектов подтверждает: платья доступны человеку/эльфу женского пола, Мирине и Кроллю, но недоступны цвергу и Энкиду. Это исторический источник (2010-е), **не доказательство неизменности текущего сервера**: текущая D1-проверка ограничений должна быть приоритетом перед обновлением правил. Источник: https://wikiwiki.jp/pandoras/課金防具/テーブル.
- Источники и административные системы сохранены без изменений.

## 2026-10-30 — выпуск 2026.10.30.35: расчёт базовых ОЗ/ОМ по OS

- Новый независимый модуль `os-calculator.js` рассчитывает предварительную базу ОЗ/ОМ по коэффициентам `classes.json`, `tables.json → raceInit, jobInit`, уровню и вручную распределённым параметрам. Пример формулы: `round(hp.base + level × hp.lv + (race.vit + job.vit + allocation.vit) × hp.vit)`.
- В компактном HUD и редакторе характеристик теперь показывается **приближённый базовый** результат, когда таблицы доступны. Он обновляется при смене расы, профессии, уровня и распределения параметров.
- **Это не полная итоговая характеристика:** экипировка, души, сетовые эффекты, гильдия, группа, честь, баффы и порядок игрового округления требуют проверки соответствия текущему серверу. Неподтверждённые расчёты не применяются как боевые значения.
- Исправлены тесты на восемь самостоятельных портретов и восстановление выбранного образа после импорта, вместо прежней проверки шести рас.
- D1 и Cloudflare Worker не менялись.

## 2026-10-30 — выпуск 2026.10.30.34: тип самоцвета и стихия

- Тип самоцвета теперь выбирается как «физический» или «магический», стихия — огонь, лёд, молния, яд, свет, тьма или радуга. Источник соответствия — `Pandora-Saga-Simulator-remaked/js/ini.js`, секция `Name['Gem']`. Предыдущий непонятный поиск `RUNEGEM` из инвентаря больше не требуется.
- Пара `type/element` сохраняется отдельно от уровня заточки (+0…+10) и попадает в экспорт билда. Старые записи с ID не отбрасываются при импорте.
- Доступен **предварительный** числовой прирост оружия из локальной OS-таблицы `weaponPlus`, порядок `floor(W × ratio / 100)+flat` взят из исторического расчётного движка; его совпадение с текущим сервером и полные итоговые параметры **не подтверждены**.
- Текущие шансы заточки, эффекты стихий, итоговая защита и взаимодействие групповых баффов не объявлены просчитанными до эталонной сверки.

## 2026-10-30 — выпуск 2026.10.30.33: исправления интерфейса расы, класса и портрета

- Исправлена потеря мужских портретов. Карусель использует восемь отдельных вариантов: мужчина/женщина для человека и эльфа; цверг, мирина, энкиду и кролль по одному. Кнопки выбора пола и смены образа убраны из пользовательской сцены, выбор пола определяется выбранным портретом.
- Исправлена блокировка выбора другой расы. Активный портрет определяется парой раса+вариант, а не только расой; при открытии сохранённого билда карусель возвращается к точному варианту изображения.
- Профессии построены в древовидном иерархическом UI по `classes.json[].parent`: четыре стартовые ветки, промежуточные и конечные классы; свернутое дерево раскрывается для выбранной профессии.
- Портрет больше не использует обрезающий `object-fit:cover`, высота центральной панели не принудительно уменьшает его до 96%; вместо этого изображение целиком вписывается в доступную область.
- С экрана убраны диагностические подписи об источниках данных, Races.zip, ненужная дублирующая плашка профессии поверх портрета и лишние кнопки выбора пола. Технические сведения остаются в документации и внутренних логах, не мешают игроку.
- Каталог D1, права администратора, исходный API и локальные сохранённые билды не менялись.

## 2026-10-30 — выпуск 2026.10.30.32: инлайн-редактор предметов для администратора

- В подтверждённом режиме администратора карточка экипированного предмета поддерживает двойной клик по названию, описанию и числу гнёзд. Открывается существующий защищённый редактор, отправляющий изменения в таблицу `overrides` через авторизованный API.
- Новые ключи `itemdesc.<ID>` и `itemslots.<ID>` добавлены к ограниченному серверному списку. Число гнёзд проверяется на целое значение от 0 до 32 и в браузере, и на сервере. Название сохраняет прежний ключ `item.<ID>`.
- Override не изменяет исходные данные каталога OS и не удаляет уже установленные души при уменьшении вместимости: переполнение продолжает показываться как конфликт.
- Изменения именования и гнёзд отображаются в карточке сразу после загрузки overrides. Публикация изменений Worker в Cloudflare требует отдельного подтверждения; нельзя считать её состоявшейся только из-за GitHub Pages.
- Пароль, сессии, права доступа, миграции D1 и импорт игрового каталога не изменены.

## 2026-10-30 — выпуск 2026.10.30.31: переключаемые атрибуты героя

- В центральном портрете появилась кнопка «≡ Атрибуты», заменяющая изображение героем на внутренние страницы **Атака**, **Защита** и **Эффекты**. Вернуться к портрету можно без прокрутки страницы.
- Вкладки показывают базовые параметры и описания **надетых вещей и душ** из опубликованного каталога: W, AC, блок, дальность, скорость, число гнёзд, заточку и исходные записи эффектов. Данные приводятся по предметам отдельно, а не суммируются по неподтверждённой формуле.
- Текущая страница атрибутов сохраняется в независимом `sessionStorage` и восстанавливается при перезагрузке страницы. Редактор слота временно перекрывает атрибуты, не стирая выбранный режим.
- **Ограничение:** итоговые сопротивления, DPS, точность, скорость каста, баффы группы/гильдии и действительные эффект-проценты пока **не вычисляются**. Данные OS и Legacy Simulator в некоторых коэффициентах отличаются, поэтому «красивую» ложную арифметику не вводим.
- Интерфейс и исходники обновлены без изменения D1, Worker или серверной авторизации.

## 2026-10-30 — выпуск 2026.10.30.30: инвентарь внутри портрета и навыки по бюджету

- Для надетого предмета теперь доступны вкладки «Выбор», «Свойства», «Души», «Самоцветы» непосредственно на месте портрета. Показаны ID, вид, уровень, урон/защита, число гнёзд, сведения и оригинальное описание из каталога OS.
- Планирование уровня заточки унифицировано до **+0…+10**, начальное значение **+0**. Выбираются подтверждённые по `slots` души, возможны установка и снятие. Предотвращена вставка души при неизвестной или нулевой вместимости.
- Выбор самоцвета ограничен настоящими записями `RUNEGEM` игрового каталога. Самоцвет сохраняется с конкретной экипированной вещью в билде и может импортироваться/экспортироваться в JSON. Силу бонусов и шанс заточки модуль **пока не вычисляет** и не подменяет выдумкой.
- При наведении на слот или душу появляется отдельная стилизованная карточка на основе значений из каталога. Аналогичные всплывающие описания добавлены к иконкам пороговых навыков внутри раскрытых веток «Пути героя».
- Общий бюджет распределения навыков вычисляется из таблицы `data/os/tables.json → abilityPoint` по уровню. Показано распределено/свободно; на новые назначения действует общий лимит и предел класса. Старые значения выше нового лимита сохраняются, но не считаются подтверждённо допустимыми.
- Состояние навигации, открытый слот, текущая страница, внешняя и внутренняя прокрутка сохраняются через `sessionStorage` при F5 и перед автоматическим обновлением версии. Это отдельное хранилище от пользовательских билдов.
- Для конкретных Астирских предметов по идентификаторам OS введены половые/расовые ограничения. Кролль может носить женский и мужской комплект. Мирина и Энкиду выводятся с фиксированным полом, Кролль — как бесполый. Для цверга и Энкиду совместимость с платьями не подтверждена и не включена. Платье блокирует отдельные поножи; вытесненные поножи хранятся для восстановления.
- **Не сделано в этом релизе:** точный расчёт всех боевых характеристик и эффектов (Simulator Legacy ≠ подтверждённая игровая формула OS), серверная инлайн-правка числа слотов через админку, полная библиотека оригинальных иконок, полноценный браузерный E2E-прогон. Эти задачи остаются в плане.
- Worker, авторизация и данные Cloudflare D1 не изменялись. Публикация кода не означает обновление базы каталога.

## 2026-10-30 — выпуск 2026.10.30.29: три рабочие области и безопасный импорт иконок

- При ширине экрана от 1201px и высоте от 800px трёхколоночная студия занимает ограниченную часть окна браузера, а «Происхождение» и «Путь героя» прокручиваются **независимо**, не уводя всю страницу вниз. Размер слотов адаптируется к высоте экрана. На небольших экранах сохраняется прежняя последовательная компоновка.
- Проверка исходного WebP теперь требует корректного RIFF/WEBP-заголовка, типа VP8/VP8L/VP8X и согласованного размера данных, а не просто первых 12 байт. Это уменьшает риск принимать повреждённый файл за оригинал.
- Импорт запрещает небезопасные имена из исходного каталога — включая переходы в родительские папки, сегменты пути и расширения. Имена по-прежнему поступают из настоящих ID игрового каталога, не генерируются.
- Добавлены независимые модульные тесты валидатора WebP и имён. Скрипт всё ещё выполняется локально, без GitHub Actions, D1 и платных сервисов.
- **Не заявляется, что 1437 оригиналов уже перенесены.** Их наличие по-прежнему определяется только проверенными локальными файлами и опубликованным манифестом.

## 2026-10-30 — выпуск 2026.10.30.28: устойчивость и сохранение контекста

- После открытия сохранённого или импортированного билда корректно синхронизируются карусель рас, пол портрета, группа веток и активный редактор. Игровые значения не перезаписываются.
- При нажатии на слот фокус переходит в поиск; закрытие, установка и снятие предмета возвращают его на выбранный слот. Добавлены ARIA-состояния.
- Карусель сохраняет клавиатурный фокус на стрелках; переход между вкладками обнуляет только внутреннюю прокрутку рабочего окна.
- Автоматическое обновление не прерывает открытые диалоги, мастерскую и редактор экипировки. При отсутствии манифеста отображается честный статус локальных OS-иконок.
- Самостоятельная библиотека всех 1437 оригинальных WebP ещё не импортирована: реальная численность показывается только по манифесту. D1, Worker и авторизация не изменялись.

## 2026-10-30 — выпуск 2026.10.30.27: навигация внутри мастерской

- В закреплённом рабочем окне добавлена независимая строка вкладок для персонажа, умений, экипировки, характеристик, билдов и вики. Разделы меняются без закрытия окна и без прокрутки внешней страницы.
- Повторное переключение вкладки не перебрасывает фокус на кнопку закрытия; выбранная вкладка синхронизирована с верхним меню.
- При открытии большой мастерской временный селектор слота на портрете корректно закрывается. Escape теперь не закрывает скрытый селектор вместо рабочего окна.
- Каталог, D1 и авторизация не менялись. Для проверки полного поведения необходим браузерный E2E-прогон.

## 2026-10-30 — выпуск 2026.10.30.26: единое рабочее пространство

- Основные разделы открываются в рабочем окне, закреплённом в пределах экрана, без перехода к нижнему блоку страницы. Внутренняя область прокручивается независимо.
- На центральной сцене добавлена строка быстрого доступа: Герой, Умения, Параметры, Инвентарь. Закрытие: Escape, фон, кнопка «Закрыть».
- При открытии клавиатурный фокус переводится в окно; Tab/Shift+Tab циклически перемещается по элементам, а при закрытии восстанавливается прежний элемент, если он ещё существует.
- Глубокие ссылки вики продолжают указывать на оригинальные ID и открывают статью в закреплённой панели.
- Существующая бизнес-логика экипировки, статистик, навыков, вики и библиотеки билдов не дублируется. D1, Worker и авторизация не изменялись.
- Браузерная E2E-проверка адаптивности, фокуса и работы полей остаётся необходимой после публикации.

## 2026-10-30 — выпуск 2026.10.30.25: интерактивность без прокрутки

- Нажатие на слот экипировки вокруг портрета теперь открывает встроенный список совместимых предметов прямо вместо изображения персонажа. Поддерживаются поиск по названию/ID, экипировка, снятие, пагинация и Escape без перехода к нижнему разделу.
- Карусель слева показывает один крупный портрет расы за раз; стрелки переключают шесть образов циклически. Выбранная раса подсвечивается и имеет кнопку «✓ Выбрано». Отдельная подпись поверх оригинального изображения не рисуется.
- Расовая пассивная способность выбирается в «Происхождении», используя официальные ID и сведения из каталога; при смене расы прежний выбор очищается.
- Выбор пола блокируется **только при отсутствии отдельного варианта портрета** в репозитории. Это техническое правило интерфейса, а не утверждение о лоре или физиологии расы.
- В «Пути героя» справа доступны прямое изменение очков ветки и отображение текущего классового лимита; иконки веток убраны, иконки навыков сохранены.
- Добавлены чистые проверки `ui-planner.js` и локальные регрессионные тесты `tests/ui-planner.test.mjs`.
- Публикацию каталога в D1, серверную авторизацию и Worker этот релиз не изменяет. Перенос оставшихся оригинальных игровых иконок и полный визуальный E2E-аудит остаются в плане.

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

## RU/EN official game catalog (2026-10-30)

Pandora Saga OS has a separate public original `strings.en.json`. It is now saved at `data/os/strings.en.json`, with exact stable IDs for item/skill/monster/soul/class names, descriptions, maps and branches. The RU/EN control switches the **game catalog** without inventing translation mappings or changing build IDs. English entries absent upstream retain their Russian source text. The non-game UI shell is still Russian-first; full UI localization remains tracked separately. English strings load from **our own D1** first or our own checked-in archive before first import — never from the game server at runtime. The manual importer also archives `tables`, `expertise`, `chests`, and approved Legacy language data in isolated namespaces.

## 2026-10-30: game-faithful five skill tabs and racial passives

The skill UI now presents only 5 primary sections and 20 player-visible subsections, in their original order. The server metadata includes further technical branches, but these no longer appear as fictitious player skill trees. `race` is a racial passive choice (one of the 3 actual race-specific `racialPassives.json` skill IDs) in the character overview rather than a spendable point branch. It is persisted in JSON builds, migrated safely on race changes and included in comparisons. Unknown game rules remain marked unverified.

## Interactive linked wiki (2026-10-30)

A first wiki tab now navigates item sources, monster drops, maps, NPC exchange recipes, and chest rewards, using our own published Cloudflare D1. An item inspector includes clickable source links and a full wiki article. Crosslinks highlight relevant item entries; probabilities are shown only when an original field explicitly provides them. Group/zone drops are not treated as individual item odds. The encyclopedia is a foundation; images, bilingual completeness, soul provenance and broader UI polish are future work.

## Protected manual source updates (2026-10-30)

**Каталог D1** now offers two read-only comparisons: current Pandora Saga OS via the allowlisted, authenticated Worker proxy, or the checked-in GitHub archive. It compares all 17 source files by stable IDs, previews added/changed/removed keys, validates the full snapshot, then requires an explicit confirmation before a chunked D1 import and atomic pointer switch. A failed compare/import never replaces the previously published catalog. Old snapshot rows are retained, subject to D1 storage limits. The source refresh intentionally does not push upstream changes into GitHub backup files; periodically update the backup separately as part of source provenance maintenance.

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

## 2026-10-30.23 — navigation reliability

All internal encyclopedia crosslinks now use real fragment URLs, so context links work with browser history, copying, keyboard navigation, and Ctrl/Cmd-click to open a new tab. The normal click stays within the all-in-one workspace. Milestone positions use broadly supported CSS `calc()` addition rather than multiplication, improving browser compatibility.

## 2026-10-30.24 — remove broken Legacy icon fallback

A missing current skill sprite now falls back to the **correct branch icon already mirrored into this repository**, not to an invalid dynamically constructed URL in the old simulator. Unknown or removed item IDs use the UI's slot glyph instead of silently fetching a non-authoritative external item icon. When the original OS icon WebPs are mirrored, verified entries in the local manifest replace the remaining OS image fallbacks.
