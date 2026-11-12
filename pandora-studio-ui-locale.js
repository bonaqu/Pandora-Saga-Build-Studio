(function(root){
'use strict';
// Exact interface-only translations. Never translate player names or game records by resemblance.
const strings={
 builds:['▣ Мои билды','▣ My Builds'],wiki:['📜 Энциклопедия','📜 Encyclopedia'],
 origin:['Происхождение','Origin'],race:['Раса','Race'],
 profession:['Профессия','Class'],stats:['Характеристики','Stats'],
 appearance:['Образ героя','Hero Appearance'],path:['Путь героя','Hero Path'],
 branchPoints:['Очки ветки','Branch points'],
 exactPoints:['Вложено','Spent'],greenMastery:['Мастерство','Mastery'],
 skillsOnTrack:['Умения на шкале','Skills on track'],
 language:['Язык сайта','Site language'],profileAccess:['Войти или зарегистрироваться','Sign in or register'],
 profilePanel:['Профиль и вход','Profile and sign in'],
 editorHeading:['Pandora Saga Build Studio — редактор персонажа','Pandora Saga Build Studio — character planner'],
 workshopArea:['Мастерская персонажа','Character planner workspace'],
 workshopLabel:['Мастерская персонажа','Character workshop'],
 raceCarousel:['Карусель портретов рас','Race portrait carousel'],
 racePassivesArea:['Пассивные способности выбранной расы','Selected race passives'],
 calculatedVitals:['Расчётные очки здоровья и маны','Calculated HP and MP'],
 baseStatPoints:['Очки базовых характеристик','Base attribute points'],
 heroPathPages:['Страницы Пути героя','Hero Path pages'],
 searchSkills:['Поиск умений','Search skills'],
 skillFilter:['Фильтр навыков','Skill filter'],
 closeWorkbench:['Закрыть рабочее окно','Close workbench'],
 originSettings:['Настройка происхождения','Origin settings'],
 raceSelect:['Выбери расу','Choose a race'],racePassive:['Расовая пассивка','Racial passive'],
 chooseOne:['Выбери одну','Choose one'],classCount:['28 классов','28 classes'],
 heroProgress:['Развитие героя','Hero progression'],levelParameters:['Уровень и параметры','Level and attributes'],
 heroLevel:['Уровень героя','Hero level'],hpShort:['ОЗ','HP'],mpShort:['ОМ','MP'],
 baseStats:['Базовые характеристики','Base attributes'],
 distributePoints:['Распредели очки','Allocate points'],heroGear:['Экипировка персонажа','Hero equipment'],
 changeItem:['◈ Изменить предмет','◈ Change item'],newBuild:['＋ Новый билд','＋ New build'],
 saveBuild:['✧ Сохранить билд','✧ Save build'],
 growth:['◈ Развитие','◈ Progression'],skills:['✦ Умения','✦ Skills'],
 masteryAuto:['Автоматически заполнять зелёное мастерство','Automatically fill trained mastery'],
 available:['Свободно','Available'],invested:['Вложено','Spent'],trained:['Освоено','Trained'],
 resetPoints:['↺ Сбросить вложенные очки','↺ Reset allocated points'],
 findSkill:['Найти умение','Find a skill'],all:['Все','All'],
 known:['Доступные','Available'],locked:['Недоступные','Unavailable'],
 closeDock:['✕ Закрыть','✕ Close'],heroBook:['Открыть книгу результатов героя','Open hero results book']
};
// Owner-editable account copy: stable semantic keys, not user-input or server errors.
// Runtime username, password, recovery code and security checks remain untouched.
const accountCopy=Object.freeze({
 accountGuestTitle:['Аккаунт','Account'],
 accountProfileTitle:['Профиль','Profile'],
 accountPending:['Проверяем учётную запись…','Checking your account…'],
 accountGuestLead:['Логин и пароль — для доступа к сохранённым облачным билдам.','Your username and password give access to your saved cloud builds.'],
 accountProfileLead:['Сохранённые билды доступны после входа на другом устройстве.','Saved builds are available after signing in on another device.'],
 accountStorageWarning:['Браузер не сохранил вход. После обновления страницы потребуется войти снова. Сохраните резервный код, если он показан.','The browser could not save this sign-in. You will need to sign in again after refreshing. Save the recovery code if it is shown.'],
 accountIdentity:['УЧЁТНАЯ ЗАПИСЬ','ACCOUNT'],
 accountCloudNote:['Облачные билды привязаны к вашему профилю','Cloud builds belong to your account'],
 accountRecoveryHeading:['Сохраните резервный код вне браузера','Save the recovery code outside this browser'],
 accountRecoveryWarning:['Без пароля или этого кода вернуть доступ к аккаунту нельзя.','Without your password or this code you cannot recover account access.'],
 accountRecoveryExpiry:['Код доступен до обновления страницы или подтверждения сохранения.','The code remains visible until you refresh the page or confirm you saved it.'],
 accountCopyCode:['Скопировать код','Copy code'],
 accountSavedCode:['Я сохранил код','I have saved the code'],
 accountPasswordHeading:['Изменить пароль','Change password'],
 accountSignOut:['Выйти из аккаунта','Sign out of account'],
 accountSignIn:['Войти','Sign in'],
 accountRegister:['Регистрация','Register'],
 accountRecover:['Восстановить','Recover'],
 accountCreate:['Создать аккаунт','Create account'],
 accountResetPassword:['Восстановить пароль','Reset password'],
 accountFootnote:['Без электронной почты и СМС. После регистрации сохраните резервный код.','No email or SMS. Save your recovery code after registering.']
});
// Fixed build-library copy is editorial content. Never bind build names, levels,
// cloud responses, user-entered values, or the variable overwrite confirmation.
const libraryCopy=Object.freeze({
 // Guest/linked-build entry copy is editorial: keep the player's draft,
 // account state and incoming share URL outside of these D1 overrides.
 libraryGateAria:['Вход для работы с билдами','Sign in to use builds'],
 libraryGuestTitle:['Мои билды — в аккаунте','Your builds belong to your account'],
 librarySharedGateTitle:['Билд доступен после входа','Sign in to open this build'],
 libraryGuestLead:['Чтобы сохранять, открывать и сравнивать билды, нужен аккаунт. Персонажа можно создавать без входа.','Sign in to save, open or compare builds. You can still plan a character without an account.'],
 librarySharedGateLead:['Войди или зарегистрируйся, чтобы открыть билд по ссылке. Ссылка сохранится.','Sign in or register to open this build. Your link will stay here.'],
 libraryGuestStorageWarning:['Без аккаунта текущий герой хранится только в этом браузере. Очистка его данных удалит черновик.','Without an account, your current hero stays only in this browser. Clearing its data erases the draft.'],
 libraryDraftUnsaved:['Текущий персонаж ещё не сохранён.','This character has not been saved yet.'],
 librarySaveAndCreate:['Сохранить и создать','Save and create'],
 libraryCreateWithoutSave:['Создать без сохранения','Create without saving'],
 libraryCancel:['Отмена','Cancel'],
 librarySaveNew:['✧ Сохранить новый билд','✧ Save new build'],
 librarySaveCopy:['Сохранить копию','Save a copy'],
 libraryNewBuild:['＋ Новый билд','＋ New build'],
 libraryRefresh:['↻ Обновить библиотеку','↻ Refresh library'],
 libraryUnsavedOpen:['Есть несохранённые изменения. Открыть другой билд?','You have unsaved edits. Open another build?'],
 librarySaveCurrentOpen:['Сохранить текущий и открыть','Save current and open'],
 libraryOpenWithoutSave:['Открыть без сохранения','Open without saving'],
 libraryDeleteAsk:['Удалить билд и отозвать все созданные ссылки?','Delete this build and revoke all its links?'],
 libraryDeleteLocalAsk:['Удалить локальную копию? Она ещё не сохранена в облаке.','Delete this local copy? It has not been saved to cloud.'],
 libraryDeleteBuild:['Удалить билд','Delete build'],
 libraryOpen:['Открыть','Open'],
 libraryOverwrite:['↻ Перезаписать','↻ Overwrite'],
 librarySaveInto:['↻ Сохранить в этот билд','↻ Save to this build'],
 libraryConfirmOverwrite:['Подтвердить перезапись','Confirm overwrite'],
 libraryShare:['🔗 Поделиться','🔗 Share'],
 libraryDelete:['Удалить','Delete'],
 libraryCompare:['Сравнить','Compare'],
 // Short, safe authored explanations for the four saved-build actions.
 // They are rendered as plain text by PandoraGuideTooltip, never HTML.
 libraryHintOpen:['Загрузить этого героя в редактор.','Load this character in the editor.'],
 libraryHintOverwrite:['Заменить этот билд текущим героем.','Replace this build with your current character.'],
 libraryHintShare:['Создать ссылку для отправки билда.','Create a link to share this build.'],
 libraryHintDelete:['Удалить билд и отозвать его ссылки.','Delete this build and revoke its links.'],
 libraryHintDeleteLocal:['Удалить локальную копию билда.','Delete this local build copy.'],
 // Search is an editor control, but its placeholder and label are fixed copy.
 librarySearchInputLabel:['Найти сохранённый билд','Find a saved build'],
 librarySearchPlaceholder:['Поиск по названию, классу, уровню…','Search by name, class or level…'],
 librarySearchEmpty:['Билды по запросу не найдены.','No builds match this search.'],
 libraryEmpty:['Сохранённых билдов пока нет.','No saved builds yet.'],
 libraryLocalCopyNote:['Локальная копия · чтобы сохранить в облако, откройте её и нажмите «Перезаписать»','Local copy · open it and select “Overwrite” to save it to cloud'],
 // Static shared-link confirmation copy is editorial. Never expose a URL,
 // share token, build name, server response or active clipboard operation.
 libraryShareCreated:['Ссылка на билд создана.','Build link created.'],
 libraryShareAlreadyCreated:['Ссылка на билд уже создана.','Build link already exists.'],
 libraryShareSnapshotNote:['Ссылка хранит снимок на момент публикации. После удаления оригинального билда она перестанет работать.','The link preserves a snapshot. Deleting the original build revokes the link.'],
 // Only static explanatory notes are owner-editable. Counts, shared names,
 // network responses and actions are not editorial copy.
 librarySharedImportNote:['Текущий герой и сохранённые билды не изменятся. Новые копии добавятся в «Мои билды».','Your current character and saved builds will not change. New copies will be added to My Builds.'],
 librarySharedOpenNote:['Сохранённые в «Мои билды» записи при этом не удаляются.','Existing saved builds will not be deleted.'],
 // Editable authored help in the share generator. The network error body,
 // private build identity and generated URL are never owner-editable.
 libraryShareLocalOnlyHelp:['Сначала откройте эту локальную копию и явно сохраните её через «Перезаписать».','Open this local copy and explicitly save it with “Overwrite” first.'],
 libraryShareCreating:['Создаём ссылку из последней сохранённой облачной версии…','Creating a link from the latest saved cloud build…'],
 libraryShareErrorIntro:['Не удалось создать ссылку:','Could not create link:'],
 // Editorial labels in received shared-build dialogs. The incoming record
 // count and another player's build name are generated, never D1 strings.
 librarySharedImportCountLabel:['Билдов по ссылке:','Builds in link:'],
 librarySharedUnsavedWarning:['Несохранённые изменения текущего персонажа будут заменены.','The current character’s unsaved changes will be replaced.']
});
// Fixed toast notifications are safe authored copy. Exclude runtime details,
 // player build names, network errors and security diagnostics.
const statusCopy=Object.freeze({
 statusLibrarySignIn:['Войдите, чтобы открыть библиотеку билдов','Sign in to open your build library'],
 statusBuildDeleted:['Билд удалён. Все его ссылки больше не работают.','Build deleted. Its links are no longer valid.'],
 statusConflictingBuilds:['Обнаружены разные версии билда. Обе сохранены отдельно в библиотеке.','Different build versions found. Both were preserved separately.'],
 statusLibraryFull:['Недостаточно места для сохранения библиотеки. Освободи место в браузере.','Not enough browser storage for the build library. Free up space.'],
 statusDeleteFailed:['Не удалось удалить билд: браузер не сохранил изменения.','Could not delete the build: the browser did not save the change.'],
 statusLocalDelete:['Билд удалён локально. Ссылки перестанут работать после синхронизации с облаком.','Build deleted locally. Links will stop working after cloud sync.'],
 statusDeleteRetryFailed:['Облако недоступно. Повторное удаление не удалось поставить в очередь — пока ссылка может работать.','Cloud unavailable. Could not queue another deletion attempt; the link may still work.'],
 statusSaveFailed:['Билд не сохранён: браузер не смог записать его. Текущий герой остался открытым. Освободи место в браузере и повтори.','Build not saved: the browser could not store it. Your current character remains open. Free up browser space and try again.'],
 statusImportsQueued:['Новые билды сохранены в браузере · проверяем облако…','New builds saved in this browser · checking cloud…'],
 statusGuestHero:['Гостевой герой открыт, но ещё не сохранён в аккаунте. Открой «Мои билды» и нажми «Сохранить новый билд».','Guest hero is ready, but is not saved to your account yet. Open My Builds and select “Save new build”.'],
 statusBuildOpenStorage:['Не удалось открыть билд: браузер не сохранил новый черновик. Освободи место и повтори.','Could not open the build: this browser could not save the new draft. Free up storage and try again.'],
 statusBuildCorrupted:['Не удалось открыть билд: его сохранённые данные повреждены.','This saved build cannot be opened. Its data is incomplete.'],
 statusBuildRestore:['Не удалось восстановить сохранённый билд.','This saved build could not be restored.'],
 statusSharedAccountChanged:['Аккаунт изменился. Открой ссылку снова, чтобы выбрать нужный аккаунт.','Your account changed. Open the link again to select the correct account.'],
 statusSharedLimit:['В библиотеке может быть до 200 билдов. Удали ненужные и повтори.','Your library holds up to 200 builds. Delete unused builds and try again.'],
 statusSharedImportStorage:['Не удалось добавить билды: браузер не сохранил их. Освободи место и повтори.','Could not add builds: the browser could not save them. Free up space and retry.'],
 statusSharedDeleted:['Владелец удалил этот билд. Ссылка больше не существует.','The owner deleted this build. The link is no longer available.'],
 statusSharedLegacy:['Ссылка устарела. Попросите владельца поделиться билдом заново.','This link has expired. Ask the owner to share the build again.'],
 statusSharedInvalid:['Ссылка на билд повреждена. Попросите владельца создать новую.','This build link is invalid. Ask the owner for a new link.'],
 statusSharedNotFound:['Билд по ссылке не найден. Возможно, адрес неверный.','No build found for this link. Check the address.'],
 statusSharedNetwork:['Не получилось загрузить билд. Проверь соединение и попробуй снова.','Could not load the shared build. Check your connection and try again.'],
 statusItemDeleteLinked:['Сначала убери связанные монстров, NPC, добычу, разделы и ссылки на эту запись. Удаление с зависимостями заблокировано.','Remove linked monsters, NPCs, loot, sections and references before deleting this record.'],
 statusNpcDeleteLinked:['Сначала убери ссылки на NPC из локаций и разделов.','Remove NPC references from maps and custom sections before deletion.'],
 statusOwnerD1Check:['D1: временная запись и чтение проверены, тестовые данные удалены.','D1: test write and read succeeded; temporary data was removed.'],
 statusOwnerSaveInProgress:['Дождись окончания сохранения в Cloudflare D1','Finish saving to Cloudflare D1 before continuing.'],
 statusOwnerSaveError:['Есть ошибка сохранения. Проверь поле и повтори изменение.','A change could not be saved. Review the field and try again.'],
 statusOwnerFinishPending:['Сначала заверши текущее сохранение.','Finish saving the current change first.'],
 statusOwnerTranslationsSaved:['Все подготовленные английские переводы уже сохранены.','All prepared English translations have already been saved.'],
 statusOwnerPullRequestWaiting:['Дождись завершения сохранения в Cloudflare D1 перед созданием PR.','Finish the Cloudflare D1 save before creating a pull request.'],
 statusOwnerPullRequestBlocked:['Сначала исправь ошибку сохранения. PR пока недоступен.','Resolve the save error before creating a pull request.'],
 statusLibraryCloudPending:['Сохранено в браузере. Проверяем запись в облаке…','Saved in this browser. Checking the cloud copy…']
});
const literalKeys=Object.freeze(Object.fromEntries(
 [...Object.entries(accountCopy),...Object.entries(libraryCopy),...Object.entries(statusCopy)]
  .map(([key,pair])=>[pair[0],key])));
// Some static notifications are authored in the selected EN language before
// being passed to the toast. Match their exact English defaults too; never
// fall back to a fuzzy match against runtime server messages.
const statusEnglishKeys=Object.freeze(Object.fromEntries(
 Object.entries(statusCopy).map(([key,pair])=>[pair[1],key])));
function literalKey(value){
 if(typeof value!=='string')return null;
 return Object.hasOwn(literalKeys,value)?literalKeys[value]:
  (Object.hasOwn(statusEnglishKeys,value)?statusEnglishKeys[value]:null);
}
const english=Object.freeze({
 'Профиль':'Profile','Аккаунт':'Account','Войти или зарегистрироваться':'Sign in or register',
 'Проверяем учётную запись…':'Checking your account…',
 'Профиль ·':'Profile ·','Профиль и вход':'Profile and sign in',
 'УЧЁТНАЯ ЗАПИСЬ':'ACCOUNT',
 'Облачные билды привязаны к вашему профилю':'Cloud builds belong to your account',
 'Выйти из аккаунта':'Sign out of account',
 'Некорректный ответ авторизации':'Invalid sign-in response',
 'Некорректный владелец аккаунта':'Account identity mismatch',
 'Ошибка сервера':'Server error',
 'Сохранённые билды доступны после входа на другом устройстве.':'Saved builds are available after signing in on another device.',
 'Логин и пароль — для доступа к сохранённым облачным билдам.':'Your username and password give access to your saved cloud builds.',
 'Текущий пароль':'Current password','Новый пароль · от 15 символов':'New password · at least 15 characters',
 'Повторите новый пароль':'Repeat new password',
 'Изменить пароль':'Change password','Изменяем пароль…':'Updating password…',
 'Пароль обновлён. Другие сеансы завершены.':'Password updated. Other sessions have been signed out.',
 'Выйти':'Sign out','Войти':'Sign in','Регистрация':'Register','Восстановить':'Recover',
 'Логин (3–20, a-z, 0-9, _)':'Username (3–20, a-z, 0-9, _)',
 'Пароль · минимум 15 символов':'Password · at least 15 characters',
 'Повторите пароль':'Repeat password','Резервный код восстановления':'Recovery code',
 'Создать аккаунт':'Create account','Восстановить пароль':'Reset password',
 'Пароли не совпадают.':'Passwords do not match.','Проверяем…':'Checking…',
 'Сохраните резервный код вне браузера':'Save the recovery code outside this browser',
 'Без пароля или этого кода вернуть доступ к аккаунту нельзя.':'Without your password or this code you cannot recover account access.',
 'Скопировать код':'Copy code','Код скопирован':'Code copied',
 'Скопируйте выделенный код':'Copy the selected code',
 'Код показан только сейчас. Сохраните его перед закрытием профиля.':'This is your only chance to save the code. Store it before closing the profile.',
  'Код доступен до обновления страницы или подтверждения сохранения.':'The code remains visible until you refresh the page or confirm you saved it.',
  'Я сохранил код':'I have saved the code','Резервный код скрыт.':'Recovery code hidden.',
  'Сохраните код: после обновления страницы его нельзя будет повторно показать.':'Save the code: it cannot be shown again after refreshing the page.',
 'Без электронной почты и СМС. После регистрации сохраните резервный код.':'No email or SMS. Save your recovery code after registering.',
 'Браузер не сохранил вход. После обновления страницы потребуется войти снова. Сохраните резервный код, если он показан.':'The browser could not save this sign-in. You will need to sign in again after refreshing. Save the recovery code if it is shown.',
 'Название билда':'Build name','Название сохраняемого черновика':'Draft build name',
 'Текущий персонаж ещё не сохранён.':'This character has not been saved yet.',
 'Сохранить и создать':'Save and create','Создать без сохранения':'Create without saving',
 'Отмена':'Cancel','✧ Сохранить новый билд':'✧ Save new build',
 'Сохранить копию':'Save a copy','＋ Новый билд':'＋ New build',
 '↻ Обновить библиотеку':'↻ Refresh library','Проверяем облако…':'Checking cloud…',
 'Найти сохранённый билд':'Find a saved build',
 'Поиск по названию, классу, уровню…':'Search by name, class or level…',
 'Сравнить':'Compare','Есть несохранённые изменения. Открыть другой билд?':'You have unsaved edits. Open another build?',
 'Сохранить текущий и открыть':'Save current and open','Открыть без сохранения':'Open without saving',
 'Удалить билд и отозвать все созданные ссылки?':'Delete this build and revoke all its links?',
 'Удалить билд':'Delete build','Открыть':'Open','↻ Перезаписать':'↻ Overwrite',
 '↻ Сохранить в этот билд':'↻ Save to this build',
 'Перезаписать этот сохранённый билд текущими локальными изменениями?':'Overwrite this saved build with your current local changes?',
 'Подтвердить перезапись':'Confirm overwrite',
 '🔗 Поделиться':'🔗 Share','Удалить':'Delete',
 'Билды по запросу не найдены.':'No builds match this search.',
 'Сохранённых билдов пока нет.':'No saved builds yet.',
 'Локальная копия · чтобы сохранить в облако, откройте её и нажмите «Перезаписать»':'Local copy · open it and select “Overwrite” to save it to cloud',
 'Удалить локальную копию? Она ещё не сохранена в облаке.':'Delete this local copy? It has not been saved to cloud.',
 'Облако подключено · локальные копии ещё не сохранены':'Cloud connected · local copies are not yet saved',
 'Сохранено в браузере · исходная облачная запись недоступна':'Saved in browser · original cloud record is unavailable',
 'Библиотека загружена · удаление некоторых ссылок ещё не подтверждено':'Builds loaded · some shared links are still awaiting revocation',
 'Локальная копия удалена':'Local copy deleted',
 'Сначала откройте эту локальную копию и явно сохраните её через «Перезаписать».':'Open this local copy and explicitly save it with “Overwrite” first.',
 'Выборы совпадают':'Build choices match',
 'Сохраните личный код библиотеки до очистки данных браузера: без него восстановить ваши облачные билды не получится. Никому не передавайте этот код.':'Save your private library key before clearing browser data. Without it, you cannot restore account-free cloud builds. Never share it.',
 'Личный код библиотеки':'Private library key','Код скрыт':'Key hidden',
 'Показать мой код':'Show my key','Скопировать мой код':'Copy my key',
 '✓ Код скопирован':'✓ Key copied',
 'На другом устройстве вставьте ранее сохранённый код. Билды загрузятся из облака.':'On another device, enter your saved key to load cloud builds.',
 'Вставить код с другого устройства':'Enter key from another device',
 'Подключить библиотеку по коду':'Connect a library with a key',
 'Подключить и объединить':'Connect and merge',
 'Перенести или восстановить облачные билды':'Transfer or restore cloud builds',
 'Подключаем облачную библиотеку…':'Connecting to cloud library…',
 'Синхронизируем локальные изменения…':'Syncing local changes…',
 'Облачная библиотека подключена':'Cloud library connected',
 'Гостевая облачная библиотека подключена':'Guest cloud library connected',
 'Некоторые облачные билды недоступны · исходные записи сохранены':'Some cloud builds are unavailable · original records are preserved',
 'Облачная версия основная · локальные отличия сохранены отдельной копией':'Cloud version kept · local differences saved as a separate copy',
 'Локальные билды доступны · облако пока недоступно':'Local builds available · cloud is currently unavailable',
 'В облаке другая редакция · обновите библиотеку для сохранения обеих версий':'A different cloud revision exists · refresh your library to keep both versions',
 'Сохранено в браузере · исходный билд в облаке уже удалён':'Saved in browser · the original cloud build was deleted',
 'Билд удалён · все его ссылки отозваны':'Build deleted · all its links revoked',
 'Удалено в браузере · синхронизируем позже':'Deleted in browser · will sync later',
 'Не удалось записать удаление для повторной отправки':'Could not queue deletion for retry',
 'Обнаружены разные версии билда. Обе сохранены отдельно в библиотеке.':'Different build versions found. Both were preserved separately.',
 'Билд удалён. Все его ссылки больше не работают.':'Build deleted. Its links are no longer valid.',
 'Билд удалён локально. Ссылки перестанут работать после синхронизации с облаком.':'Build deleted locally. Links will stop working after cloud sync.',
 'Облако недоступно. Повторное удаление не удалось поставить в очередь — пока ссылка может работать.':'Cloud unavailable. Could not queue another deletion attempt; the link may still work.',
 'Готово':'Done',
 'Ссылка недоступна':'Link unavailable','Ошибка':'Error',
 'Не удалось сохранить облачные билды в браузере':'Could not save cloud builds in this browser',
 'Недостаточно места для сохранения библиотеки. Освободи место в браузере.':'Not enough browser storage for the build library. Free up space.',
 'Не удалось удалить билд: браузер не сохранил изменения.':'Could not delete the build: the browser did not save the change.',
 'Уведомление':'Notice',
 'Новый пароль · от 8 символов':'New password · at least 8 characters',
 'Пароль · минимум 8 символов':'Password · at least 8 characters',
 'Сохранено в облаке':'Saved to cloud',
 'Сохранено в браузере · облако недоступно':'Saved in browser · cloud unavailable',
 'Аккаунт изменился · синхронизация остановлена':'Account changed · sync stopped',
 'Вход выполнен, но билды не открылись. Проверь свободное место в браузере и обнови страницу.':'Signed in, but your builds could not be opened. Free up browser storage and reload the page.',
 'Билд перезаписан по вашему запросу.':'Build overwritten at your request.',
 'Сохранено в браузере. Проверяем запись в облаке…':'Saved in this browser. Checking cloud storage…',
 'Проверяем сохранение билда…':'Checking saved build…',
 'Ссылка на билд создана.':'Build link created.',
 'Ссылка на билд уже создана.':'Build link already exists.',
 'Скопировать ссылку':'Copy link','✓ Скопировано':'✓ Copied',
 'Ссылка на билд':'Build link',
 'Не удалось сохранить билд. Проверь свободное место в браузере.':'Could not save the build. Check available browser storage.',
 'Ссылка содержит некорректные параметры персонажа':'The link contains invalid character data',
 'Некорректная ссылка':'Invalid link',
 'Ссылка не подтвердила выбранный билд. Попробуйте ещё раз.':'The link did not confirm the selected build. Try again.',
 'Ссылка выделена — скопируй через меню или Ctrl+C':'Link selected — copy it using the menu or Ctrl+C',
 'Владелец удалил этот билд. Ссылка больше не существует.':'The owner deleted this build. The link is no longer available.',
 'Ссылка устарела. Попросите владельца поделиться билдом заново.':'The link is outdated. Ask the owner to share it again.',
 'Билд по ссылке не найден. Возможно, адрес неверный.':'Shared build not found. Check the link.',
 'Не получилось загрузить билд. Проверь соединение и попробуй снова.':'Could not load the build. Check your connection and try again.',
 'Ссылка на билд повреждена. Попросите владельца создать новую.':'This build link is damaged. Ask the owner to create a new one.',
 'Ссылка хранит снимок на момент публикации. После удаления оригинального билда она перестанет работать.':'The link preserves a snapshot. Deleting the original build revokes the link.',
 'Не удалось загрузить облачные билды. Локальные копии не удалены. Проверь соединение и нажми «Обновить библиотеку».':'Could not load cloud builds. Local copies were not deleted. Check your connection and choose “Refresh library”.',
 'Сохранено только в этом браузере · облако недоступно. Обнови библиотеку после восстановления соединения.':'Saved only in this browser · cloud unavailable. Refresh your library when back online.',
 'Билд не сохранён: браузер не смог записать его. Текущий герой остался открытым. Освободи место в браузере и повтори.':'Build not saved: the browser could not store it. Your current character remains open. Free up browser space and try again.',
 'Новые билды сохранены в браузере · проверяем облако…':'New builds saved in this browser · checking cloud…'
});
// Exact keys keep UI labels editable in the existing D1 overrides store.
// Do not rewrite arbitrary game data, player names, error diagnostics or IDs.
// The Hero Book is loaded before this locale module. Its 156 explicitly
// authored RU/EN fallback pairs are registered as stable editable UI copy,
// without treating player names, D1 catalog records or generated stats as copy.
const bookCopy=Object.freeze(Object.fromEntries(Object.entries(
 root.PandoraStageAttributes?.bookEditorialDefaults||{}).map(([ru,en])=>
 [root.PandoraStageAttributes.bookEditorialKey(ru),[ru,en]])));
const bookDefaults=new Map();
for(const [key,[ru,en]] of Object.entries(bookCopy)){
 if(!bookDefaults.has(ru))bookDefaults.set(ru,key);
 if(!bookDefaults.has(en))bookDefaults.set(en,key);
}
function bookFieldKey(value){return typeof value==='string'?
 bookDefaults.get(value)||null:null}
let contentOverrides={};
function fieldKey(key){
 if(!Object.hasOwn(strings,key)&&!Object.hasOwn(accountCopy,key)&&
  !Object.hasOwn(libraryCopy,key)&&!Object.hasOwn(statusCopy,key)&&
  !Object.hasOwn(bookCopy,key))return null;
 const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
 return /^[a-z][a-z0-9-]{0,75}$/.test(slug)?'ui.label.'+slug:null;
}
function setOverrides(overrides){
 contentOverrides=overrides&&typeof overrides==='object'&&!Array.isArray(overrides)?
  overrides:{};
}
function baseText(key,lang='ru'){
 const defaults=strings[key]||accountCopy[key]||libraryCopy[key]||
  statusCopy[key]||bookCopy[key];
 return defaults?defaults[lang==='en'?1:0]:key;
}
// Compact actions and headings stay short; only the storage warning may
// need a longer paragraph. The Worker still enforces the global 360 limit.
function copyLimit(key){return key==='accountStorageWarning'||Object.hasOwn(statusCopy,key)?350:
 Object.hasOwn(libraryCopy,key)&&libraryCopy[key][0].length>90?250:
 Object.hasOwn(bookCopy,key)&&bookCopy[key][0].length>90?350:90}
function text(key,lang='ru'){
 const defaults=strings[key]||accountCopy[key]||libraryCopy[key]||
  statusCopy[key]||bookCopy[key],id=fieldKey(key);
 if(!defaults||!id)return key;
 let edit=null;
 try{
  const value=contentOverrides['guideedit.book.'+id];
  edit=typeof value==='string'?JSON.parse(value):null;
 }catch{}
 const field=lang==='en'?'en':'ru',saved=edit?.[field];
 const max=copyLimit(key);
 return typeof saved==='string'&&saved.trim()&&saved.length<=max?saved:defaults[lang==='en'?1:0];
}
function keys(){return [...Object.keys(strings),...Object.keys(accountCopy),
 ...Object.keys(libraryCopy),...Object.keys(statusCopy),...Object.keys(bookCopy)]}
function ui(value,lang='ru'){
 const id=literalKey(value);
 return id?text(id,lang):lang==='en'?(english[value]||value):value;
}
function apply(lang='ru',doc=typeof document==='undefined'?null:document){
 if(!doc)return;
 const locale=lang==='en'?'en':'ru';
 doc.documentElement.lang=locale;
 for(const node of doc.querySelectorAll('[data-i18n]'))node.textContent=text(node.dataset.i18n,locale);
 for(const [attribute,dataKey] of [['placeholder','i18nPlaceholder'],['aria-label','i18nAriaLabel'],['title','i18nTitle']])
  for(const node of doc.querySelectorAll('[data-'+dataKey.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())+']'))
   {if(typeof node.setAttribute==='function'&&node.dataset?.[dataKey])node.setAttribute(attribute,text(node.dataset[dataKey],locale));}
}
// Only called for newly rendered saved-build controls; not used on the game catalog.
function localize(root,lang='ru'){
 if(!root)return;
 const doc=root.ownerDocument||document;
 const walker=doc.createTreeWalker(root,4);
 let node;
 while((node=walker.nextNode())){
  const parent=node.parentElement;
  if(!parent||parent.closest('h3, .build-share-slot, .build-name-input'))continue;
  const raw=node.nodeValue,trimmed=raw.trim(),key=literalKey(trimmed);
  // Only a standalone, literal label can be edited. Never mark a build name
  // or a mixed element containing a checkbox, icon, link, or runtime value.
  if(key&&Object.hasOwn(libraryCopy,key)&&parent.childNodes.length===1){
   parent.setAttribute('data-owner-copy-key',key);
   node.nodeValue=raw.replace(trimmed,text(key,lang));
  }else if(lang==='en'&&english[trimmed]){
   node.nodeValue=raw.replace(trimmed,english[trimmed]);
  }
 }
 if(lang==='en')for(const field of root.querySelectorAll('input')){
  for(const attr of ['placeholder','aria-label']){
   const original=field.getAttribute(attr);
   if(original&&english[original])field.setAttribute(attr,english[original]);
  }
 }
}
root.PandoraUILocale=Object.freeze({text,baseText,copyLimit,fieldKey,bookFieldKey,
 keys,literalKey,setOverrides,ui,apply,localize});
})(typeof window==='undefined'?globalThis:window);
