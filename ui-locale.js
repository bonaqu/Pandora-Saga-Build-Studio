(function(root){
'use strict';
// Exact interface-only translations. Never translate player names or game records by resemblance.
const strings={
 character:['✦ Персонаж','✦ Character'],equipment:['◈ Каталог предметов','◈ Items'],
 builds:['▣ Мои билды','▣ My Builds'],wiki:['📜 Вики','📜 Wiki'],
 origin:['Происхождение','Origin'],race:['Раса','Race'],
 profession:['Профессия','Class'],stats:['Характеристики','Stats'],
 appearance:['Образ героя','Hero Appearance'],path:['Путь героя','Hero Path'],
 branchPoints:['Очки ветки','Branch points'],
 exactPoints:['Точно вложено','Allocated'],greenMastery:['Зелёное мастерство','Trained mastery'],
 skillsOnTrack:['Умения на шкале','Skills on track'],
 language:['Язык сайта','Site language'],profileAccess:['Войти или зарегистрироваться','Sign in or register'],
 profilePanel:['Профиль и вход','Profile and sign in'],
 originSettings:['Настройка происхождения','Origin settings'],
 raceSelect:['Выбери расу','Choose a race'],racePassive:['Расовая пассивка','Racial passive'],
 chooseOne:['Выбери одну','Choose one'],classCount:['28 классов','28 classes'],
 heroProgress:['Развитие героя','Hero progression'],levelParameters:['Уровень и параметры','Level and attributes'],
 heroLevel:['Уровень героя','Hero level'],baseStats:['Базовые характеристики','Base attributes'],
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
const english=Object.freeze({
 'Профиль':'Profile','Аккаунт':'Account','Войти или зарегистрироваться':'Sign in or register',
 'Профиль ·':'Profile ·','Профиль и вход':'Profile and sign in',
 'Сохранённые билды доступны после входа на другом устройстве.':'Saved builds are available after signing in on another device.',
 'Логин и пароль — для доступа к сохранённым облачным билдам.':'Your username and password give access to your saved cloud builds.',
 'Текущий пароль':'Current password','Новый пароль · от 15 символов':'New password · at least 15 characters',
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
 'Без электронной почты и СМС. После регистрации сохраните резервный код.':'No email or SMS. Save your recovery code after registering.',
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
 'Перезаписать этот сохранённый билд текущими локальными изменениями?':'Overwrite this saved build with your current local changes?',
 'Подтвердить перезапись':'Confirm overwrite',
 '🔗 Поделиться':'🔗 Share','Удалить':'Delete',
 'Билды по запросу не найдены.':'No builds match this search.',
 'Сохранённых билдов пока нет.':'No saved builds yet.',
 'Локальная копия · чтобы сохранить в облако, откройте её и нажмите «Перезаписать»':'Local copy · open it and select “Overwrite” to save it to cloud',
 'Удалить локальную копию? Она ещё не сохранена в облаке.':'Delete this local copy? It has not been saved to cloud.',
 'Облако подключено · локальные копии ещё не сохранены':'Cloud connected · local copies are not yet saved',
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
 'Сохранено в облаке':'Saved to cloud',
 'Сохранено в браузере · облако недоступно':'Saved in browser · cloud unavailable',
 'Билд перезаписан по вашему запросу.':'Build overwritten at your request.',
 'Проверяем сохранение билда…':'Checking saved build…',
 'Ссылка на билд создана.':'Build link created.',
 'Ссылка на билд уже создана.':'Build link already exists.',
 'Скопировать ссылку':'Copy link','✓ Скопировано':'✓ Copied',
 'Ссылка на билд':'Build link',
 'Ссылка хранит снимок на момент публикации. После удаления оригинального билда она перестанет работать.':'The link preserves a snapshot. Deleting the original build revokes the link.'
});
function text(key,lang='ru'){return strings[key]?.[lang==='en'?1:0]||key}
function ui(value,lang='ru'){return lang==='en'?(english[value]||value):value}
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
 if(!root||lang!=='en')return;
 const doc=root.ownerDocument||document;
 const walker=doc.createTreeWalker(root,4);
 let node;
 while((node=walker.nextNode())){
  const parent=node.parentElement;
  if(!parent||parent.closest('h3, .build-share-slot, .build-name-input'))continue;
  const raw=node.nodeValue,trimmed=raw.trim(),translated=english[trimmed];
  if(translated)node.nodeValue=raw.replace(trimmed,translated);
 }
 for(const field of root.querySelectorAll('input')){
  for(const attr of ['placeholder','aria-label']){
   const original=field.getAttribute(attr);
   if(original&&english[original])field.setAttribute(attr,english[original]);
  }
 }
}
root.PandoraUILocale=Object.freeze({text,ui,apply,localize});
})(typeof window==='undefined'?globalThis:window);
