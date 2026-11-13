(function(root){
'use strict';
// Partial source-backed combat preview. Do not claim current OS parity for missing buffs or procs.
// Exact, player-interface labels only; source names and item descriptions stay untouched.
const bookEnglish=Object.freeze({
 'Итоги': "Summary",
 'Атака': "Attack",
 'Защита': "Defense",
 'Зелья и умения': "Potions & skills",
 'Эффекты': "Effects",
 'Усиления': "Buffs",
 'Эффекты умений': 'Skill effects',
 'Эффекты зелий': 'Potion effects',
 'Эти умения направлены на противника. Здесь можно увидеть, как они изменят сопротивления вашего героя, если он окажется целью. Одновременно действует только одно умение, выбор нового заменяет предыдущие.': 'These spells target an enemy. Here you preview their signed effects on your hero as the target. Only one spell can be active at a time. Selecting another replaces the previous one.',
 'Параметры появятся после загрузки игровых данных.': "Stats appear when game data has loaded.",
 'Результаты расчёта': "Calculated results",
 'Выберите раздел, чтобы посмотреть подробности.': "Select a chapter for details.",
 'ОЗ': "HP",
 'Здоровье': "Health",
 'ОМ': "MP",
 'Мана': "Mana",
 'Физическая': "Physical",
 'С заточкой': "With refinement",
 'Маг. атака': "Magic attack",
 'Коэффициент': "Multiplier",
 'Точность': "Accuracy",
 'Попадание': "Hit rate",
 'Уклонение': "Evasion",
 'Крит. шанс': "Crit chance",
 'Вероятность': "Chance",
 'Зелья': "Potions",
 'Эффект': "Effect",
 'Лечение': "Healing",
 'Эффект навыков': "Skill effect",
 'Все настройки применяются к текущему билду сразу. Числа обновляются в остальных главах книги.': "Settings apply to this build immediately. Values update in the other Hero Book chapters.",
 'Недоступно для героя': "Unavailable to this hero",
 'Выключено': "Off",
 'ОЗ и ОМ': "HP & MP",
 'Гильдейское ОЗ': "Guild HP",
 'Гильдейское ОМ': "Guild MP",
 'Знак жизни': "Divine Aid",
 'Гильдия и честь': "Guild & honor",
 'Все характеристики': "All attributes",
 'Пробуждение': "Vivify",
 'Титул чести': "Honor title",
 'Боевые умения': "Combat skills",
 'Рывок': "Lunge",
 'Боевой клич': "War Cry",
 'Яростная атака': "Raging Soul",
 'Бастион (нужен щит)': "Bastion (shield required)",
 'Помощь ветра': "Speedy Gale",
 'Благословение ветра': "Accelerate",
 'Сосредоточенность': "Concentration",
 'Восстановление': "Recovery",
 'Гильдия: скорость ОЗ': "Guild: HP recovery",
 'Гильдия: скорость ОМ': "Guild: MP recovery",
 'Гильдейское лечение': "Guild healing",
 'Показывать действие зелий': "Show potion effects",
 'Мощность поддерживающих навыков': "Support skill potency",
 'Знак атаки': 'Velox',
 'Знак защиты': 'Lapis Medio',
 'Ободрение': 'Battle Prayer',
 'Божественная защита': 'Group Barrier',
 'Священное оружие': 'Bless Weapon',
 'Темная аура': 'Gloom',
 'Чары усиления (магическая атака)': 'Enchant Enhancement (magic attack)',
 'Чары усиления (аура)': 'Enchant Enhancement (aura)',
 'Песнь поэта': "Minstrel's Song",
 'Песнь чар': "Sage's Song",
 'Скорость атаки': "Attack speed",
 'Получаемый физический урон': "Incoming physical damage",
 'Получаемый физ./маг. урон': 'Incoming physical/magic damage',
 'Святая аура оружия': 'Holy weapon aura',
 'Урон тьмой': 'Dark damage',
 'Магическая атака': 'Magic attack',
 'Аура оружия': 'Weapon aura',
 'Стихийный урон': 'Elemental damage',
 'Усиление': "Enhancement",
 'Точность и уклонение': "Accuracy & Evasion",
 'Усиление магии': "Magic Enhancement",
 'Сила эффекта': "Effect power",
 'Мощность при применении навыка. Просмотр не включает усиление на персонаже.': "Potency when casting a skill. This preview does not apply the buff to the hero.",
 'Поиск навыка по названию': "Find skill by name",
 'Найти навык…': "Search skills…",
 'По базовым условиям доступен': "Available by basic requirements",
 'Требования не выполнены': "Requirements not met",
 'Доступен': "Available",
 'Не изучен': "Not learned",
 'Для текущего поиска навыки не найдены.': "No skills match this search.",
 'Предыдущая страница': "Previous chapter",
 'Следующая страница': "Next chapter",
 'Вернуть портрет': "Return to portrait",
 'Разделы книги героя': "Hero Book chapters",
 'Параметры оружия': "Weapon properties",
 'Защита снаряжения': "Equipment defense",
 'Бонусы предметов и душ': "Item & Soul bonuses",
 'Нет записей для этой вкладки': "No entries for this chapter",
 'Предмет без названия': "Unnamed item",
 'Душа без названия': "Unnamed Soul",
 'Описание души не найдено': "Soul description unavailable",
 'Особые эффекты предметов и душ': "Special item and Soul effects",
 'Бонус к получаемому опыту': "Experience bonus",
 'Срабатывания предметов и душ': "Item & Soul triggers",
 'Максимум ОМ': "Max MP",
 'Максимум ОЗ': "Max HP",
 'Сопротивление прерыванию': "Interruption resistance",
 'Перезарядка умений': "Skill cooldown",
 'Выносливость': "Stamina",
 'Атака со спины': "Back attack",
 'Активные комплекты': "Active equipment sets",
 'Эффект комплекта': "Set bonus",
 'Самоцветы': "Gems",
 'Огонь': "Fire",
 'Лёд': "Ice",
 'Молния': "Lightning",
 'Яд': "Poison",
 'Свет': "Light",
 'Тьма': "Dark",
 'Чары': "Arcane",
 'Лечащие навыки': "Healing skills",
 'Расход ОМ': "MP cost",
 'Лечение зельями': "Potion healing",
 'Магия огня': "Fire magic",
 'Магия льда': "Ice magic",
 'Магия молнии': "Lightning magic",
 'Защита от отдельных типов противников': "Defense by enemy type",
 'Сопротивления': "Resistances",
 'Ожоги': "Burn",
 'Оглушение': "Stun",
 'Заморозка': "Freeze",
 'Падение': "Knockdown",
 'Отбрасывание': "Knockback",
 'Сон': "Sleep",
 'Немота': "Silence",
 'Подробнее о точности расчёта': "Calculation details",
 'Критический шанс': "Critical chance",
 'Физическая атака': "Physical attack",
 'Магическая атака': "Magic attack",
 'Входящий крит. урон': "Incoming critical damage",
 'Устойчивость к сбою': "Cast interruption resistance",
 'Боевые параметры': "Combat stats",
 'Магическое усиление оружия': "Weapon magic enhancement",
 'Сопротивление от брони': "Armor resistance",
 'Шанс наложения состояния': "Status effect chance",
 'Эффективность лечащих навыков': "Healing-skill effectiveness",
 'Физическая атака оружия': "Physical weapon attack",
 'Сила атаки': "Attack power",
 'Верховая езда': "Riding",
 'Верхом': 'Mounted',
 'Верхом: предварительный расчёт по Remaked. Защита и скорость обычной атаки верхом не отображаются.': 'Mounted: preliminary Remaked estimate. Defense and normal attack speed are unavailable while riding.',
 'Характеристики верхом': 'Mounted attributes',
 'Бонусы дальности от снаряжения': "Equipment range bonuses",
 'Усиление стихийной магии': "Elemental magic bonus",
 'Аурный урон от снаряжения': "Equipment aura damage",
 'Продолжительность дебаффов': "Debuff duration",
 'Шанс наложения дебаффов': "Debuff chance",
 'Изменение отката от предметов': "Equipment cooldown changes",
 'Дополнительные защитные параметры': "Additional defensive stats",
 'Физические состояния': "Physical conditions",
 'Психические состояния': "Mental conditions",
 'Профессия': "Class",
 'Известные бонусы снаряжения и душ': 'Known equipment and Soul bonuses',
 'Сопротивления состояниям': 'Status resistances',
 // Legacy input aliases remain translatable, but player-facing names use Passive recovery.
 'Скорость естественного восстановления': 'Passive recovery speed',
 'Естественное восстановление (расчётная величина)': 'Estimated passive recovery',
 'Восстановление каждые 2 секунды': 'Recovery every 2 seconds',
 'Лечащие умения': 'Healing skills',
 'Действие зелий': 'Potion effects',
 'Эффективность лечения': 'Healing effectiveness',
 'Пока недоступно': 'Not yet available',
 'Доступно при использовании умения': 'Available when using the skill',
 // Source-authored Book captions with existing RU/EN literals; never formulas or item names.
 'Выбранные усиления': "Configured enhancements",
 'Сохраняются с этим героем': "Saved with this character",
 'Гильдия': "Guild",
 'Уровень гильдии': "Guild level",
 'Ручной выбор усилений': "Manual guild buffs",
 'Бонусы ОЗ и ОМ зависят от уровня гильдии.': "HP and MP passives depend on guild level.",
 'Учитываются бонусы ОЗ, ОМ и восстановления. Остальные значения — справочные.': "HP, MP and recovery bonuses are applied. Other values are shown for reference.",
 'Пассивное умение за честь': "Honor passive skill",
 'Усиления жреца': "Priest buffs",
 'Учитывать усиления другого жреца': "Use external priest",
 'На билд влияют выбранные знаки атаки и защиты, а также Ободрение. Остальное — предварительный просмотр.': "Selected attack and defense signs and Battle Prayer affect the build; other values are previews.",
 'Усиления сопротивлений стихиям': "Elemental resistance skills",
 'Отмечай только эффекты, которые реально действуют на героя, включая наложенные вражеские умения.': "Select only effects currently affecting this hero, including incoming enemy spells.",
 'Песни для выбранного класса': "Songs available to this class",
 'Требования выполнены': "Requirements met",
 'Требуется мастерство': "Requires mastery",
 'Эффекты песен действуют после применения в игре. Бонусы не прибавляются к билду автоматически.': "Song effects apply only when activated in the game. No bonus is added to this build automatically.",
 'Ориентировочное действие навыка, не постоянное восстановление героя.': "Estimated action of the skill, not permanent natural recovery.",
 'Пассивка усиливает урон при попадании оружием ближнего боя, но не показатель АТК. Точный урон удара без подтверждённой серверной формулы не рассчитывается.': "Melee weapon hit-damage passive. It does not increase the ATK stat. The exact damage per hit is not calculated without a verified server formula.",
 'Здесь появятся эффекты навыков, для которых доступны игровые данные и расчёт.': "Calculated skill effects appear here when game records and requirements are available.",
 'Условные эффекты стихийного оружия': "Conditional elemental weapons",
 'Пламя феникса · расчётный урон': "Phoenix Flame · estimated damage",
 'Эффекты плащей на военных картах': "Battle-map cloak effects",
 'Расовая стойкость цверга': "Dwarven racial survival",
 'Бонусы к опыту': "Experience gain bonuses",
 'Показывать восстановление от зелий': "Show potion recovery",
 'Для текущих зелий ещё нет доступных значений.': "No potion values are available yet.",
 'Предметы восстановления ОМ': "MP recovery items",
 'Эффект при использовании. Бонус эффективности зелий к ОМ не применён.': "Effect on use. Potion effectiveness is not applied to MP.",
 'Предметы восстановления ОЗ': "HP recovery items",
 'Снятие состояний': "Remove status effects",
 'Предметы, активирующие умения': "Items that activate skills",
 'Честь': "Honor",
 'пассивное умение': "passive skill",
 'Получаемый физический/магический урон −': "Incoming physical/magical damage −",
 'Опыт с монстров +': "Monster experience +"
});
// Translate only whitelisted composed UI lines, not OS item descriptions or user names.
const bookLineHeads=Object.freeze({
 'Базовая атака ':'Base attack ','Базовая защита ':'Base defense ',
 'Не действует: ':'Inactive: ','Сейчас: ':'Current: ',
 'Навыки героя · ':'Hero skills · ','Найдено ':'Found ',
 'ОМ ':'MP ','ОЗ: ':'HP: ','ОМ: ':'MP: ',
 'Раскрытие характеристик верхом: ':'Mounted attribute release: ',
 'Профессия ':'Class ',
 'Дальность атаки: ':'Attack range: ','Дальность стрельбы: ':'Bow range: ',
 'Физическая атака оружия: ':'Physical weapon attack: ',
 'Точность: ':'Accuracy: ','Уклонение: ':'Evasion: ',
 'Критический шанс: ':'Critical chance: ',
 'Исходящий критический урон: ':'Outgoing critical damage: ',
 'Прямые бонусы атаки от вещей и душ: ':'Flat attack from equipment and Souls: ',
 'Выбранные навыки: ':'Selected skills: ','Рывок: ':'Lunge: ',
 'Процентная точность вещей: ':'Equipment accuracy rate: ',
 'Пассивная меткость лучника: ':'Archer passive accuracy: ',
 'Сосредоточенность: ':'Concentration: ',
 'Пассивное уклонение: ':'Passive evasion: ','Помощь ветра: ':'Speedy Gale: ',
 'Подавление гнева: ':'Rage Suppression: ','Интуиция: ':'Intuition: ',
 'Магическая атака: ':'Magic attack: ',
 'Физический урон оружия, пассивки и титулы: ':'Weapon, passive and title damage: ',
 'АТК сзади: ':'Attack from behind: ',
 'Откат умений (базовый индекс): ':'Skill cooldown (base index): ',
 'Скорость передвижения: ':'Movement speed: ',
 'Скорость в городе: ':'Town movement speed: ',
 'Скорость атаки (индекс): ':'Attack speed (index): ',
 'Скорость заклинаний: ':'Casting speed: ',
 'Подтверждённая основа: ':'Known value: ',
 'Базовая защита снаряжения: ':'Equipment base defense: ',
 'Бонус заточки брони и щита: ':'Armor/shield refinement: ',
 'Прямые бонусы вещей и душ: ':'Flat gear/Soul bonuses: ',
 'Процентные бонусы защиты: ':'Defense percentage: ',
 'Титул чести: ':'Honor title: ',
 'Эффект выбранной стойки: ':'Selected stance effect: ',
 'Сопротивление прерыванию каста: ':'Cast interruption resistance: ',
 'Изменение шанса входящего крита: ':'Incoming critical chance change: ',
 'Множитель входящего критического урона: ':'Incoming critical damage multiplier: ',
 'Физические состояния: ':'Physical conditions: ',
 'Психические состояния: ':'Mental conditions: ',
 'От самоцветов: ':'From gems: ',
 'Получаемый физический урон: ':'Incoming physical damage: ',
 'Получаемый магический урон: ':'Incoming magical damage: ',
 'Отражение ближнего физического урона: ':'Melee physical reflection: ',
 'Изменение длительности дебаффов: ':'Debuff duration change: ',
 'Уклонение от физического урона: ':'Physical damage evasion: ',
 'Эффективность лечения: ':'Healing effectiveness: '
});
const bookLineFragments=Object.freeze({
 ' · Дальность ':' · Range ',' · Скорость ':' · Speed ',
 ' · Блок ':' · Block ',' · Слоты ':' · Soul slots ',
 ' (база ':' (base ', ', бонусы ':', bonuses ',
 ', гильдия +':', guild +', ', снаряжение ':', equipment ',
 ', лечение +':', healing +', ', навыки +':', skills +',
 ', пассивка ':', passive ', ', оружие ':', weapon ',
 ' · мастерство +':' · mastery +',' · титул +':' · title +',
 ' · гильдия: ':' · guild: ',
 ' (поштучное округление вверх)':' (rounded up per item)',
 ' (отдельно от базового позиционного бонуса)':' (separate from base position bonus)',
 ' ОЗ, ':' HP, ',' ОМ. Усиления сохраняются в билде.':' MP. Buffs are saved with the build.'
});
// Immutable translation maps are read for every generated book node.
// Build their ordered key/value pairs once, not on every element/attribute.
const bookLineHeadEntries=Object.entries(bookLineHeads);
const bookLineFragmentEntries=Object.entries(bookLineFragments);
// Stable, human-readable English slug plus a short hash of the original RU
// caption. This does not depend on array positions or future dictionary edits.
function bookEditorialKey(ru){
 if(!Object.hasOwn(bookEnglish,ru))return null;
 // The short exclusive-resistance copy retains its previous D1 editorial
 // identity so existing RU/EN owner edits are neither lost nor orphaned.
 const resistanceNote=ru==='Эти умения направлены на противника. Здесь можно увидеть, как они изменят сопротивления вашего героя, если он окажется целью. Одновременно действует только одно умение, выбор нового заменяет предыдущие.';
 const slugSource=resistanceNote?'Only one resistance spell can be active. Selecting a new one replaces the previous one. These spells may target allies or enemies.':bookEnglish[ru];
 const slug=slugSource.toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,43)||'caption';
 // Preserve the existing D1 owner key across the corrected Cverg label.
 // A canonical game-term fix must never orphan an administrator's edits.
 const stableSource=ru==='Расовая стойкость цверга'?'Расовая стойкость дворфа':ru;
 const hashSource=resistanceNote?'Одновременно действует только одно умение. Выбор нового заменяет предыдущее. Умения можно применять к союзникам и врагам.':stableSource;
 let hash=2166136261;
 for(const letter of hashSource){hash=Math.imul(hash^letter.codePointAt(0),16777619)>>>0}
 return 'book-'+slug+'-'+hash.toString(16).padStart(8,'0');
}
function bookText(value){
 if(typeof value!=='string')return value;
 // Only exact, authored Book defaults are D1-editable: numbers, item names,
 // saved character names and generated combat messages are not templates.
 const key=root.PandoraUILocale?.bookFieldKey?.(value);
 if(key)return root.PandoraUILocale.text(key,document.documentElement?.lang);
 if(document.documentElement?.lang!=='en')return value;
 if(Object.hasOwn(bookEnglish,value))return bookEnglish[value];
 const match=bookLineHeadEntries.find(([ru])=>value.startsWith(ru));
 if(!match)return value;
 let tail=value.slice(match[0].length);
 // Stat captions have numeric values; do not translate a player's or item's
 // name that merely happens to begin with the same ordinary Russian words.
 if(match[0]!=='Не действует: '&&!/^[+\-−]?[\d≈—]/.test(tail))return value;
 for(const [ru,en] of bookLineFragmentEntries)tail=tail.replaceAll(ru,en);
 return match[1]+tail;
}
function make(tag,attrs={},children=[]){
 const n=document.createElement(tag);
 // These plain Book captions can be edited inline. Interactive controls,
 // calculated metric cells and specialized guide fields are excluded below.
 const key=['p','strong','small','span','summary','h3'].includes(tag)&&
  typeof attrs.text==='string'?root.PandoraUILocale?.bookFieldKey?.(attrs.text):null;
 if(key)n.dataset.bookEditorialKey=key;
 for(const [key,value] of Object.entries(attrs)){
  if(key==='text')n.textContent=bookText(value);
  else if(key==='class')n.className=value;
  else if(key.startsWith('on'))n.addEventListener(key.slice(2),value);
  else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(key))
   n[key]=Boolean(value);
  else if(value!==null&&value!==undefined)n.setAttribute(key,bookText(String(value)));

 }
 for(const child of children)n.append(typeof child==='string'?document.createTextNode(bookText(child)):child);
 if(tag==='input'&&attrs.type==='number')root.PandoraNumericField?.prepare(n);
 return n;
}

// One visual metadata owner per chapter field. D1 changes affect copy only,
// never IDs, numerical formulas, current equipment, or stored build settings.
// A gameplay explanation deserves a hint; bare headings and editor placeholders do not.
// Existing D1 overrides may still contain old boilerplate; ignore it in the public view.
function meaningfulGuideHint(value){
 if(typeof value!=='string'||!value.trim())return false;
 return !/^(?:Описание параметра\.?|Параметр персонажа\.?|Название раздела Книги героя\.?|Описание раздела «[^»]+»\.?|Stat description\.?|Character statistic\.?|Hero Book chapter title\.?|Description of .+\.?)$/i.test(value.trim());
}
// Some older D1 copies contain a literal backslash+n instead of a newline.
function guideDisplayText(value){
 return typeof value==='string'?value.replace(/\\n/g,'\n'):value;
}
function guideLabel(node,key,ru,en,options={},fallbackRu='',fallbackEn=''){
 if(!node)return node;
 const guide=root.PandoraHonorGuide;
 const info=/^summary\.\d+$/.test(key)?
  guide?.summary(options.overrides||{},Number(key.slice(8)),ru,en):
  guide?.field(options.overrides||{},key,ru,en,fallbackRu,fallbackEn);
 const english=document.documentElement?.lang==='en';
 const label=english?(info?.en||en):(info?.ru||ru);
 const originalHint=guideDisplayText(english?info?.hintEn:info?.hintRu);
 // A recovery-speed index is not a number of seconds. Preserve the D1
 // description, adding the missing unit explanation once, in both locales.
 const recoveryIndex=/^(defense)\.(hpRecoverySpeed|mpRecoverySpeed)$/.test(key);
 const indexHelp=english?
  'idx is a recovery-speed index, not seconds. A higher value means faster passive recovery; it depends on attributes and guild bonuses.':
  '«инд.» — индекс скорости восстановления, а не секунды. Чем он выше, тем быстрее пассивное восстановление; на индекс влияют характеристики и усиления гильдии.';
 const hint=recoveryIndex?
  [meaningfulGuideHint(originalHint)?originalHint:'',
   !String(originalHint||'').includes(english?'idx is a recovery-speed index':'«инд.» — индекс скорости')?indexHelp:''
  ].filter(Boolean).join('\n\n'):originalHint;
 node.textContent=label;
 if(meaningfulGuideHint(hint))root.PandoraGuideTooltip?.attach(node,hint,{hoverDelay:650});
 node.setAttribute('data-guide-key',key);
 if(options.editable&&typeof options.onTextEdit==='function'){
  node.classList.add('stage-guide-editable');
  const editName=event=>{
   event.stopPropagation();event.preventDefault();
   root.PandoraGuideTooltip?.dismiss();
   options.onTextEdit(node,key,english?'en':'ru',label);
  };
  node.addEventListener('dblclick',editName);
  node.setAttribute('aria-keyshortcuts','F2');
  node.addEventListener('keydown',event=>{if(event.key==='F2')editName(event)});
  const hintPencil=make('button',{type:'button',class:'stage-guide-edit-hint',
   text:'?',title:english?'Edit explanation':'Изменить пояснение',
   'aria-label':english?'Edit explanation for '+label:'Изменить пояснение: '+label,
   onclick:event=>{
    event.preventDefault();event.stopPropagation();
    root.PandoraGuideTooltip?.dismiss();
    options.onTextEdit(node,key,english?'hintEn':'hintRu',hint||'');
   }});
  const namePencil=make('button',{type:'button',class:'stage-guide-edit-name',
   text:'✎',title:english?'Rename label':'Переименовать подпись',
   'aria-label':english?'Rename '+label:'Переименовать '+label,
   onclick:editName});
  // Keep the two actions in one stable toolbar instead of two free
  // siblings: title, controls and disclosure arrow have separate tracks.
  // The D1 record still stores independent ru/en/hintRu/hintEn values.
  const actions=make('span',{class:'stage-guide-actions',
   role:'group','aria-label':english?'Edit field label':'Редактирование надписи'});
  actions.append(namePencil,hintPencil);
  node.after(actions);
 }
 return node;
}
const bookPages=Object.freeze([
 ['summary','Результаты расчёта'],['attack','Атака'],['defense','Защита'],
 ['buffs','Усиления'],['effects','Эффекты умений'],['recovery','Эффекты зелий']
]);
// Default visibility is chapter-specific. User changes stay in memory while
// reading this Book, but a fresh Book session starts from these defaults.
const collapsedSummaryGroups=new Set();
const collapsedBookGroups=new Set();
const expandedBookGroups=new Set();
const expandedBookDetails=new Set();
function bookSectionStartsOpen(page,node){
 // Preserve the original Attack chapter behavior for nested native details:
 // only generated section groups start expanded.
 if(page==='attack')return node?.tagName!=='DETAILS'||node.open===true;
 if(page==='defense')return node?.dataset?.chapterGroup==='recovery';
 if(page==='buffs')return node?.dataset?.bookSection==='priest';
 if(page==='effects')return node?.classList?.contains('stage-healing-spells')&&
  !node.classList.contains('stage-attacking-skills')&&
  !node.classList.contains('stage-defensive-skills');
 // Potion Effects, guild, honor, elemental resistances and all others closed.
 return false;
}
function resetDisclosureState(){
 collapsedSummaryGroups.clear();collapsedBookGroups.clear();
 expandedBookGroups.clear();expandedBookDetails.clear();
}
// Keep the source-backed Hero Book results in one ordered matrix.
// A missing calculator branch stays unknown (—), never a fabricated zero.
function summaryRows(calc){
 const c=calc?.combat||{},r=calc?.resistances||{},elements=r.elements||{};
 const num=value=>Number.isFinite(value)?value:null;
 const sum=(left,right)=>Number.isFinite(left)&&Number.isFinite(right)?
  left+right:null;
 const row=(ru,en,value,unit='',display=null)=>({ru,en,value:num(value),unit,display});
 const clientAttack=c.attack?.minimumVerified===true&&
  Number.isFinite(c.attack?.minimum)&&Number.isFinite(c.attack?.known)&&
  c.attack.minimum<=c.attack.known?
  c.attack.minimum+'–'+c.attack.known:null;
 return [
  {ru:'Жизнь и восстановление',en:'Vitals and recovery',page:'buffs',symbol:'✧',rows:[
   row('ОЗ','HP',calc?.hp),row('ОМ','MP',calc?.mp),
   row('Леч. зельями','Potion healing',calc?.potion?.percent,'%'),
   row('Леч. умениями','Skill healing',calc?.healingSkill?.percent,'%'),
   row('Расход ОМ','MP cost',c.manaCost?.remaining,'%')]},
  {ru:'Атака',en:'Attack',page:'attack',symbol:'⚔',rows:[
   row('АТК','ATK',c.attack?.known,'',clientAttack),
   row('АТК спереди','Front ATK',c.frontAttack,'%'),
   row('АТК сзади','Back ATK',sum(c.backAttack,c.backAttackEquipmentRate),'%'),
   row('МАТК','MATK',c.magicAttack?.known,'%'),
   row('Точность','Accuracy',c.accuracy?.known),
   row('Точн. спереди','Front accuracy',c.frontAccuracy?.known),
   row('Шанс крита','Critical chance',c.critical?.known,'%'),
   row('Крит. урон','Critical damage',c.criticalDamage,'%'),
   row('Дальн. АТК ближ. боя','Melee attack range',
    calc?.attackRange?.totalMelee??calc?.attackRange?.baseMelee),
   row('Дальн. АТК дальн. боя','Ranged attack range',
    calc?.attackRange?.totalRanged??calc?.attackRange?.baseRanged),
   row('Скор. атаки','Attack speed',c.attackSpeed?.known,'%'),
   row('Скор. каста','Casting speed',c.castingSpeed?.known,'%'),
   row('Сокрщ. времени каста','Cast time',c.castTime?.known,'%'),
   row('Откат','Cooldown',c.cooldown,'%'),
   row('Скор. движения','Movement speed',c.movementSpeed?.known,'%'),
   row('Скор. в городе','Town movement speed',c.movementSpeed?.town,'%')]},
  {ru:'Защита',en:'Defense',page:'defense',symbol:'◇',rows:[
   row('Защита','Defense',c.defense?.known),
   row('Сопр. АТК спереди','Front ATK resistance',null,'%'),
   row('Сопр. АТК сзади','Back ATK resistance',null,'%'),
   row('Сопр. физ (ед.)','Physical mitigation (flat)',r.mitigation?.physicalFlat),
   row('Сопр. физ (%)','Physical damage change',r.mitigation?.physical,'%'),
   row('Сопр. маг. урону','Magic damage change',r.mitigation?.magic,'%'),
   row('Уклонение','Evasion',c.dodge?.known),
   row('Сопр. криту','Critical resistance',
    c.criticalIncoming,'%'),
   row('Получ. крит. урон','Incoming critical damage',c.criticalIncomingDamage,'%'),
   row('Укл. ближ. атак','Melee evasion',null,'%'),
   row('Укл. дальн. атак','Ranged evasion',c.rangedEvasion?.known,'%'),
   row('Укл. от магии','Magic evasion',null,'%')]},
  {ru:'Сопротивления',en:'Resistances',page:'defense',symbol:'✦',rows:[
   row('Сопр. огню','Fire',elements.fire,'%'),
   row('Сопр. льду','Ice',elements.ice,'%'),
   row('Сопр. молниям','Lightning',elements.lightning,'%'),
   row('Сопр. яду','Poison',elements.poison,'%'),
   row('Сопр. чарам','Charm',elements.charm,'%'),
   row('Сопр. свету','Light',elements.light,'%'),
   row('Сопр. тьме','Dark',elements.dark,'%'),
   row('Сопр. аном. тел.','Physical conditions',r.states?.physical,'%'),
   row('Сопр. аном. дух.','Mental conditions',r.states?.mental,'%'),
   row('Сопр. магии','Magic',elements.magic,'%')]}
 ];
}

function summaryPage(body,calc,options={}){
 if(!calc){body.append(make('p',{class:'stage-attribute-note',
  text:document.documentElement?.lang==='en'?
   'Stats appear after game data loads.':
   'Параметры появятся после загрузки игровых данных.'}));return}
 const en=document.documentElement?.lang==='en';
 const format=new Intl.NumberFormat(en?'en-US':'ru-RU',{maximumFractionDigits:2});
 let summaryIndex=0,summaryGroupIndex=0;
 for(const group of summaryRows(calc)){
  const groupIndex=summaryGroupIndex++;
  const section=make('details',{class:'stage-result-section',
   'data-result-group':group.page,'data-result-index':groupIndex});
  section.open=!collapsedSummaryGroups.has(groupIndex);
  section.addEventListener('toggle',()=>{
   if(section.open)collapsedSummaryGroups.delete(groupIndex);
   else collapsedSummaryGroups.add(groupIndex);
  });
  // Built-in details/summary provides accessible, keyboard-operable
  // disclosure and keeps every verified combat calculation unchanged.
  const heading=make('summary',{class:'stage-result-section-head'},[
   make('span',{class:'stage-result-symbol','aria-hidden':'true',text:group.symbol}),
   make('strong',{text:en?group.en:group.ru})
  ]);
  guideLabel(heading.lastChild,'summary.group.'+groupIndex,
   group.ru,group.en,options);
  heading.append(make('span',{class:'stage-result-chevron','aria-hidden':'true',text:'⌄'}));
  // Update immediately on mouse or keyboard disclosure, before a live
  // calculator rerender can replace the native details node.
  heading.addEventListener('click',event=>{
   if(event.defaultPrevented)return;
   if(section.open)collapsedSummaryGroups.add(groupIndex);
   else collapsedSummaryGroups.delete(groupIndex);
  });
  const grid=make('div',{class:'stage-result-grid'});
  for(const result of group.rows){
   const text=result.display??(Number.isFinite(result.value)?
    format.format(result.value)+result.unit:'—');
   const tile=make('div',{class:'stage-result-tile'},[
    make('span',{text:en?result.en:result.ru}),
    make('strong',{text})
   ]);
   guideLabel(tile.firstChild,'summary.'+summaryIndex++,result.ru,result.en,options);
   grid.append(tile);
   grid.append(tile);
  }
  section.append(heading,grid);
  body.append(section);
 }
}
// Verified game terminology comes from the same OS catalog/Remaked-approved
// names displayed in Path and Wiki. Never derive skill names from translated
// English keywords, branch abbreviations or a guessed profession.
function gameSkillName(id,ru,en,terms={},english=false){
 const source=terms.skills?.[String(id)];
 // For an OS-known skill, an absent EN entry is *not* permission to
 // invent an English name. Keep the official RU identity instead.
 // This matters for the 16 current OS IDs with no EN skill string.
 if(english){
  const official=terms.englishSkills?.[String(id)]?.n;
  if(typeof official==='string'&&official.trim())return official;
  if(typeof source?.name==='string'&&source.name.trim())return source.name;
  return ru||en;
 }
 return source?.name||ru;
}
function gameBranchName(branch,terms={},english=false){
 return (english?terms.englishBranches?.[branch]:terms.branchLabels?.[branch])||
  (english?({benevolence:'Grace',hymn:'Hymn',blessing:'Blessing'})[branch]:
    ({benevolence:'Исцеление',hymn:'Песнопения',blessing:'Благословение'})[branch])||
   branch;
}
function gameClassName(id,ru,en,terms={},english=false){
 return (english?terms.englishClasses?.[id]?.n:terms.classes?.[id]?.name)||
  (english?en:ru);
}
function buffsPage(body,options){
 const {buffs={},vitalsBuffs={},onBuff=()=>{},onVital=()=>{},honorTitles=[],
  availability={},combatSkillCards={},resistanceSkillChoices=[],modifiers,gameTerms={},
  remakedBuffRows=[],skillIconForId=()=>null}=options;
 const english=document.documentElement?.lang==='en';
 // Count selected effects, never mastery input numbers or a disabled priest.
 const guildSelected=Number(buffs.guildLevel)>0;
 const guildLevelCount=Number(buffs.guildLevel)||0;
 const guildPassiveCount=guildSelected?1+(guildLevelCount>=2?2:0)+
  (guildLevelCount>=4?2:0)+(guildLevelCount>=6?2:0):0;
 const selected=value=>value===true||
  (typeof value==='number'&&value>0)||
  (typeof value==='string'&&value!==''&&value!=='0');
 // Old imported saves may have multiple choices: preview only one.
 const selectedResistanceSkill=Array.isArray(buffs.resistanceSkillIds)?
  resistanceSkillChoices.find(s=>s.id!==330004001&&
   buffs.resistanceSkillIds.includes(s.id))?.id:null;
 const selectedResistanceSkills=selectedResistanceSkill==null?0:1;
 const configured=Object.entries(buffs).filter(([key,value])=>{
  if(key==='proelium'||key==='resistanceSkillIds'||key==='guildLevel')return false;
  if(['priestSpi','priestBlessing','priestHymn','priestBenevolence','priestExorcism','priestEnabled',
   'honorCuriosity','proeliumPotency'].includes(key))return false;
  if(key.startsWith('priest')&&buffs.priestEnabled!==true)return false;
  if(key==='priestGratia'&&!(Number(buffs.priestBlessing)>=8))return false;
  if(key==='priestLapisMedio'&&!(Number(buffs.priestBlessing)>=12))return false;
  if(key==='priestEncouragement'&&!(Number(buffs.priestBlessing)>=61))return false;
  if(guildSelected&&['guildLifeRecovery','guildManaRecovery',
    'guildPhysicalReduction','guildMagicReduction','guildExperience'].includes(key))
   return false;
  return selected(value);
 }).length+guildPassiveCount+Object.entries(vitalsBuffs).filter(([key,value])=>
  !(guildSelected&&['guildHp','guildMp'].includes(key))&&selected(value)).length+
  selectedResistanceSkills+remakedBuffRows.filter(row=>!row.existing&&
   (row.selected||(row.id===330004001&&
    buffs.resistanceSkillIds?.includes(330004001)))&&row.available&&
   (![320011001,330051001,340001001,340004001].includes(row.id)||
    buffs.priestEnabled===true)).length;
 const status=make('div',{class:'stage-buff-overview'},[
  make('span',{text:english?'Configured enhancements':'Выбранные усиления'}),
  make('strong',{text:String(configured)}),
  make('small',{text:english?'Saved with this character':'Сохраняются с этим героем'})
 ]);
 body.append(status);
 let sectionIndex=0;
 const section=(ru,en,stableId=null)=>{
  const node=make('section',{class:'stage-book-buff-group'},[make('strong',{text:english?en:ru})]);
  guideLabel(node.firstChild,stableId==='guild'?'buffs.guild':
   'buffs.section.'+(stableId||sectionIndex++),ru,en,options);
  body.append(node);
  return node;
 };
 const select=(parent,ru,en,key,levels,vital=false,compact=false)=>{
  const name=english?en:ru;
  const guildIcons={guildHp:600000001,guildMp:600000011,
   guildLifeRecovery:600000021,guildManaRecovery:600000031,
   guildPhysicalReduction:600000071,guildMagicReduction:600000081,
   guildExperience:600000061,
   guildHealing:600000211,guildAll:600000221,guildArouse:600000231};
  const guildIcon=guildIcons[key]?skillIconForId(guildIcons[key]):null;
  const field=make(compact?'div':'label',{class:'stage-book-field'+
   (compact?' stage-book-choice-only':'')+
   (guildIcon?' stage-guild-skill-field':'')},
   compact?[]:[make('span',{text:name})]);
  if(!compact)guideLabel(field.firstChild,'buffs.setting.'+key,
   ru,en,options);
  if(guildIcon)field.insertBefore(make('img',{src:guildIcon,alt:'',
   width:30,height:30,loading:'lazy',class:'stage-guild-skill-icon',
   style:'display:block;width:30px;height:30px;min-width:30px;max-width:30px;'+
    'min-height:30px;max-height:30px;object-fit:contain;align-self:center'}),field.firstChild);
  const entry=make('select',{'aria-label':name,'data-book-setting':key,
   onchange:event=>(vital?onVital:onBuff)(key,event.target.value)});
  const selected=(vital?vitalsBuffs:buffs)[key]??0;
  for(const [value,label] of levels)entry.append(make('option',{value,selected:String(selected)===String(value),text:label}));
  entry.value=String(selected);field.append(entry);parent.append(field);
 };
 const toggle=(parent,name,key,vital=false,allowed=true,skill=null)=>{
  const selected=key.startsWith('resistSkill:')?
   selectedResistanceSkill===Number(key.slice('resistSkill:'.length)):
   key.startsWith('legacySkill:')?
    (Array.isArray(buffs.remakedSkillIds)&&buffs.remakedSkillIds.includes(Number(key.slice(12)))||
     (key==='legacySkill:330004001'&&buffs.resistanceSkillIds?.includes(330004001))):
    (vital?vitalsBuffs:buffs)[key]===true;
  const node=make('label',{class:'stage-book-check'+(skill?' stage-combat-buff':'')});
  const checkbox=make('input',{type:'checkbox','data-book-setting':key,
   checked:selected&&allowed,disabled:!allowed,
   onchange:event=>(vital?onVital:onBuff)(key,event.target.checked)});
  node.append(checkbox);
  if(skill?.icon){
   const img=make('img',{src:skill.icon,alt:'',loading:'lazy'});
   img.onerror=()=>img.remove();
   node.append(img);
  }
  // A real source-backed skill always wins over a hand-written toggle label.
  const displayName=skill?(english?(skill.nameEn||skill.name||bookText(name)):
    (skill.name||name)):bookText(name);
  const info=make('span',{class:'stage-combat-buff-copy',text:displayName});
  const description=english?skill?.descEn||skill?.desc:skill?.desc;
  const rich=skill?.id!=null&&root.PandoraSkillPreview?.attach(info,skill.id);
  if(!rich&&typeof description==='string'&&description.trim())
   root.PandoraGuideTooltip?.attach(info,description,{hoverDelay:650});
  // An external-priest checkbox is grey while not enabled, but its benefit
  // stays readable. It is NOT a profession restriction of the recipient.
  if(skill&&!allowed&&!skill.externalPriest)
   info.append(make('small',{text:(english?skill.reasonEn:skill.reason)||
    (english?'Unavailable to this hero':'Недоступно для героя')}));
  if(skill?.summary)
   info.append(make('small',{text:skill.summary}));
  node.append(info);
  parent.append(node);
 };
 const opts=(units)=>units.map((n,i)=>[i,i===0?bookText('Выключено'):
  (document.documentElement?.lang==='en'?'Level ':'Уровень ')+i+' · +'+n]);
 const guildLevel=Number(buffs.guildLevel)||0;
 const guildPreview=root.PandoraOSCalculator?.guildPassiveAtLevel(guildLevel);
 const guildSource=root.PandoraGuildSkillSource||[];
 const sourceSkill=(i,rank)=>guildSource[i]?.levels?.[Math.max(0,rank-1)]||{};
 const guildRate=[0,2,4,6,9,12,15];
 const guildRatesBySkill={
  guildHp:[0,2,4,6,9,12,15],guildMp:[0,2,4,6,9,12,15],
  guildLifeRecovery:[0,5,8],guildManaRecovery:[0,5,8],
  guildPhysicalReduction:[0,3,6,10],guildMagicReduction:[0,3,6,10],
  guildExperience:[0,2,3,4,5,6,7,8,10],
  guildHealing:[0,10,20,30],guildAll:[0,1,2,3],guildArouse:[0,2,4,6]
 };
 const guildChoice=(parent,key,sourceIndex,firstSkillId,vital=false)=>{
  const source=guildSource[sourceIndex]||{},rates=guildRatesBySkill[key];
  const roman=['','I','II','III','IV','V','VI','VII','VIII'];
  const levels=rates.map((rate,rank)=>{
   if(!rank)return [0,bookText('Выключено')];
   const item=gameTerms.skills?.[String(firstSkillId+rank-1)];
   const official=english?gameTerms.englishSkills?.[String(item?.id)]?.n:item?.name;
   const title=official||((english?source.sourceNameEn:source.nameRu)||key)+' '+roman[rank];
   const meaning=key==='guildHp'?(english?'maximum HP':'максимум ОЗ'):
    key==='guildMp'?(english?'maximum MP':'максимум ОМ'):
    key==='guildLifeRecovery'||key==='guildManaRecovery'?
     (english?'recovery speed':'скорость восстановления'):
    key==='guildPhysicalReduction'?(english?'physical damage taken':'получаемый физический урон'):
    key==='guildMagicReduction'?(english?'magical damage taken':'получаемый магический урон'):
    key==='guildExperience'?(english?'monster EXP':'опыт за монстров'):
    key==='guildHealing'?(english?'HP/MP recovery speed':'скорость восстановления ОЗ/ОМ'):
    key==='guildAll'?(english?'all attributes':'все характеристики'):
     (english?'physical/magical attack':'физ./маг. атака');
   // The full official title/meaning is in the visible sibling label and
   // hover help; keep the selected option brief enough for a single row.
   return [rank,roman[rank]+' · '+
    (key.includes('Reduction')?'−':'+')+rate+
    (key==='guildAll'?'':'%')];
  });
  select(parent,source.nameRu||key,source.sourceNameEn||key,key,levels,vital);
  const input=parent.querySelector?.('[data-book-setting="'+key+'"]');
  if(!input)return;
  const rank=Number((vital?vitalsBuffs:buffs)[key]||0);
  const hint=sourceSkill(sourceIndex,Math.max(rank,1));
  const caption=parent.querySelector?.('[data-guide-key="buffs.setting.'+key+'"]');
  if(rank>0&&(english?hint.en:hint.ru))
   root.PandoraGuideTooltip?.attach(caption||input,english?hint.en:hint.ru,{hoverDelay:500});
  for(let n=1;n<input.options.length;n++){
   const desc=sourceSkill(sourceIndex,n);
   input.options[n].title=(english?desc.en:desc.ru)||'';
  }
 };

 const guild=section('Гильдия','Guild','guild');
 if(guild.dataset)guild.dataset.bookSection='guild';
 else guild.setAttribute?.('data-book-section','guild');
 select(guild,'Уровень гильдии','Guild level','guildLevel',
  Array.from({length:13},(_,i)=>[i,i===0?
   (english?'Manual guild buffs':'Ручной выбор усилений'):
   (english?'Guild Lv. ':'Гильдия Ур. ')+i]));
 const guildLevelInput=guild.querySelector?.('[data-book-setting="guildLevel"]');
 if(guildLevelInput){
  for(let i=1;i<=12;i++){
   const opt=guildLevelInput.options[i],hint=sourceSkill(0,i);
   if(opt)opt.title=english?hint.en||'':hint.ru||'';
  }
  if(guildLevel){
   const description=sourceSkill(0,guildLevel);
   root.PandoraGuideTooltip?.attach(guildLevelInput,
    (english?description.en:description.ru)||'',{hoverDelay:450});
  }
 }
 const passiveGroup=make('div',{class:'stage-guild-subsection stage-guild-passives'});
 const passiveTitle=make('strong',{text:english?'Passive guild enhancements':'Пассивные усиления гильдии'});
 passiveGroup.append(passiveTitle);
 guideLabel(passiveTitle,'buffs.guild.passiveHeading',
  'Пассивные усиления гильдии','Passive guild enhancements',options,
  'Усиливаются автоматически с повышением уровня гильдии.',
  'Automatically grow with the guild level.');
 guild.append(passiveGroup);
 const passiveSpecs=[
  {key:'guildHp',i:1,id:600000001,rank:guildPreview?.guildHp||0,rate:guildRate[guildPreview?.guildHp]||0},
  {key:'guildMp',i:2,id:600000011,rank:guildPreview?.guildMp||0,rate:guildRate[guildPreview?.guildMp]||0},
  {key:'guildLifeRecovery',i:3,id:600000021,rank:guildPreview?.guildLifeRecovery||0,rate:[0,5,8][guildPreview?.guildLifeRecovery]||0},
  {key:'guildManaRecovery',i:4,id:600000031,rank:guildPreview?.guildManaRecovery||0,rate:[0,5,8][guildPreview?.guildManaRecovery]||0},
  {key:'physicalReduction',i:5,id:600000071,
   rank:[0,3,6,10].indexOf(guildPreview?.physicalReduction||0),rate:guildPreview?.physicalReduction||0},
  {key:'magicReduction',i:6,id:600000081,
   rank:[0,3,6,10].indexOf(guildPreview?.magicReduction||0),rate:guildPreview?.magicReduction||0},
  {key:'experience',i:7,id:600000061,rank:Math.max(0,(guildPreview?.experience||0)-1),rate:guildPreview?.experience||0}
 ];
 if(!guildLevel){
  for(const [key,idx,id,vital] of [
   ['guildHp',1,600000001,true],['guildMp',2,600000011,true],
   ['guildLifeRecovery',3,600000021,false],
   ['guildManaRecovery',4,600000031,false],
   ['guildPhysicalReduction',5,600000071,false],
   ['guildMagicReduction',6,600000081,false],
   ['guildExperience',7,600000061,false]])
   guildChoice(passiveGroup,key,idx,id,vital);
 }else for(const spec of passiveSpecs){
  if(!spec.rank)continue;
  const source=guildSource[spec.i]||{},description=sourceSkill(spec.i,spec.rank);
  const line=make('div',{class:'stage-guild-passive-row',
   'data-guild-passive':spec.key});
  const id=spec.id+spec.rank-1;
  const sprite=skillIconForId(id)||skillIconForId(spec.id);
  if(sprite)line.append(make('img',{src:sprite,alt:'',width:30,height:30,
   loading:'lazy',class:'stage-guild-skill-icon',
   style:'display:block;width:30px;height:30px;min-width:30px;'+
    'max-width:30px;min-height:30px;max-height:30px;object-fit:contain'}));
  const record=gameTerms.skills?.[String(id)];
  const recordEn=gameTerms.englishSkills?.[String(id)]?.n;
  const suffix=['','I','II','III','IV','V','VI','VII','VIII'][spec.rank]||spec.rank;
  const title=(english?recordEn:record?.name)||
   ((english?source.sourceNameEn:source.nameRu)||spec.key)+' '+suffix;
  const name=make('span',{class:'stage-guild-passive-name',text:title});
  line.append(name,make('strong',{text:
   (spec.key==='physicalReduction'||spec.key==='magicReduction'?'−':'+')+
   spec.rate+'%'}));
  guideLabel(name,'buffs.guild.passive.'+spec.key+'.'+spec.rank,
   record?.name||source.nameRu+' '+suffix,recordEn||source.sourceNameEn+' '+suffix,options,
   description.ru||'',description.en||'');
  passiveGroup.append(line);
 }

 const activeGroup=make('div',{class:'stage-guild-subsection stage-guild-actives'});
 const activeTitle=make('strong',{text:english?'Active guild enhancements':'Активные усиления гильдии'});
 activeGroup.append(activeTitle);
 guideLabel(activeTitle,'buffs.guild.activeHeading',
  'Активные усиления гильдии','Active guild enhancements',options,
  'Умения главы гильдии действуют на находящихся рядом союзников.',
  'The guild leader activates these skills for nearby allies.');
 guild.append(activeGroup);
 for(const [key,idx,id] of [
  ['guildHealing',8,600000211],['guildAll',9,600000221],
  ['guildArouse',10,600000231]])
  guildChoice(activeGroup,key,idx,id);

 const honor=section('Честь','Honor','honor');
 const honorTerm=make('span',{class:'stage-honor-term',text:english?'passive skill':'пассивное умение'});
 const honorHeading=honor.firstChild||honor.children?.[0];
 if(honorHeading)honorHeading.append(make('span',{text:' · '}),honorTerm);
 guideLabel(honorTerm,'buffs.honor',english?'passive skill':'пассивное умение',
  'passive skill',options);
 select(honor,'Пассивное умение за честь','Honor passive skill',
  'honorTitle',honorTitles.map(x=>[x.id,english?x.en:x.ru]),false,true);
 const honorEffectLabels={
  allAttributes:['Все характеристики','All attributes'],
  healingSkills:['Эффективность лечащих умений','Healing skill potency'],
  attackPercent:['Физическая атака','Physical attack'],
  fireMagic:['Магический урон огнём','Fire magic damage'],
  fire:['Сопротивление огню','Fire resistance'],
  ice:['Сопротивление льду','Ice resistance'],
  burn:['Сопротивление ожогу','Burn resistance'],
  iceMagic:['Магический урон льдом','Ice magic damage'],
  castingResist:['Сопротивление прерыванию заклинаний','Cast interruption resistance'],
  freeze:['Сопротивление заморозке','Freeze resistance'],
  accuracy:['Точность','Accuracy'],lightningMagic:['Магия молний','Lightning magic'],
  lightning:['Сопротивление молниям','Lightning resistance'],
  knockdown:['Сопротивление падению','Knockdown resistance'],
  weaponPhysical:['Физический урон оружия','Physical weapon damage'],
  mountedRelease:['Характеристики верхом','Mounted attribute share'],
  incomingCriticalChance:['Шанс входящего критического удара','Incoming critical chance'],
  incomingCriticalDamage:['Критический урон по персонажу','Incoming critical damage'],
  light:['Сопротивление свету','Light resistance'],
  dark:['Сопротивление тьме','Dark resistance'],
  charm:['Сопротивление чарам','Charm resistance'],
  mentalState:['Сопротивление аномалиям духа','Mental status resistance'],
  magic:['Сопротивление магии','Magic resistance'],
  physicalState:['Сопротивление аномалиям тела','Physical status resistance'],
  potionRecovery:['Эффективность зелий','Potion efficiency'],
  defense:['Защита','Defense'],
  incomingPhysical:['Получаемый физический урон','Incoming physical damage'],
  dodge:['Уклонение','Evasion'],
  rangedDodge:['Уклонение от стрел','Ranged evasion'],
  frontAttack:['Урон при атаке спереди','Front attack damage']
 };
 const honorDescription=(item)=>{
  if(!item)return '';
  if(!item.id)return english?'No Honor bonus selected.':'Титул не выбран.';
  return Object.entries(item.effects||{}).map(([key,value])=>{
   const label=honorEffectLabels[key]?.[english?1:0]||key;
   return label+' '+(value>0?'+':'')+value+
    (['allAttributes','defense','accuracy','dodge'].includes(key)?'':'%');
  }).join(' · ');
 };
 const honorSelect=honor.querySelector?.('[data-book-setting="honorTitle"]');
 if(honorSelect){
  for(const entry of honorTitles){
   if(honorSelect.options?.[entry.id])
    honorSelect.options[entry.id].title=honorDescription(entry);
  }
  const current=honorTitles.find(item=>item.id===Number(buffs.honorTitle||0));
  const description=honorDescription(current);
  if(description){
   root.PandoraGuideTooltip?.attach(honorSelect,description,{hoverDelay:400});
   const hint=make('span',{class:'stage-honor-selected-hint',tabindex:0,
    'aria-label':description,text:'ⓘ'});
   root.PandoraGuideTooltip?.attach(hint,description,{hoverDelay:400});
   honorSelect.parentNode?.append(hint);
  }
 }
 // Source-gated informational magnitudes. These never activate a buff.
 const priestValues=modifiers?.priestCast||{};
 const osVector=(id,ep,vector,secondary=[0,0,0,0])=>{
  const record=gameTerms.skills?.[String(id)];
  const effects=(record?.funcs||[]).filter(f=>f?.ep===ep&&f.dir==='TARGET');
  return record?.id===id&&effects.length===1&&
   Array.isArray(effects[0].fv1)&&effects[0].fv1.length===4&&
   effects[0].fv1.every((n,i)=>n===vector[i])&&
   Array.isArray(effects[0].fv2)&&effects[0].fv2.length===4&&
   effects[0].fv2.every((n,i)=>n===secondary[i]);
 };
 const inspirationKnown=osVector(320006001,'EP_SKILL_DELAY_FIN',[0,0,0,50]);
 const naturalKnown=osVector(330005001,'EP_HEAL_MANA_REGENERATOR',[0,10,0,0],[0,0,0,2]);
 const restKnown=osVector(320002001,'EP_HEAL_TIME_SCALE',[0,0,0,90]);
 const despairKnown=osVector(100058001,'EP_DAMAGERATE_SCALE',[0,0,35,40])&&
  osVector(100058001,'EP_ONDAMAGE_FIN_DAMAGE_SCALE',[0,0,0,100]);
 const priest=section('Усиления жреца','Priest buffs');
 if(priest.dataset)priest.dataset.bookSection='priest';
 else priest.setAttribute?.('data-book-section','priest');
 toggle(priest,english?'Use external priest':'Учитывать усиления другого жреца','priestEnabled');
 const priestFields=make('div',{class:'stage-priest-fields'});
 for(const [key,ru,en] of [
  ['priestSpi','СД жреца','Priest SPR'],
  ['priestBlessing','Благословение','Blessing mastery'],
  ['priestHymn','Песнопения','Hymn mastery']
 ]){
  const label=make('label',{class:'stage-book-field'},[
   make('span',{text:english?en:ru})]);
  const input=make('input',{type:'number',min:0,max:500,step:1,
   value:String(buffs[key]||0),'data-book-setting':key,
   'aria-label':english?en:ru,
   disabled:buffs.priestEnabled!==true,
   onchange:event=>onBuff(key,event.target.value)});
  label.append(input);priestFields.append(label);
 }
 priest.append(priestFields);
 const skills=section('Личные умения','Self buffs','self');
 for(const [key,label] of [['combatLunge','Рывок'],
  ['combatRage','Яростная атака'],['combatDefender','Бастион (нужен щит)'],
  ['combatConcentration','Сосредоточенность']])
  toggle(skills,label,key,false,availability[key]===true,combatSkillCards[key]);
 const party=section('Усиления от союзников','Ally buffs','party');
 const lifeSign=remakedBuffRows.find(row=>row.id===320005001);
 toggle(party,'Знак жизни','lifeSign',true,true,lifeSign?{
  id:320005001,name:lifeSign.name,nameEn:lifeSign.nameEn,
  desc:lifeSign.description,
  descEn:gameTerms.englishSkills?.['320005001']?.d||lifeSign.description,
  icon:skillIconForId(320005001),
  summary:english?'Maximum HP +250 and +15%':'Максимум ОЗ +250 и +15%'
 }:null);
 for(const [id,key,required] of [
  [320012001,'priestEncouragement',61],
  [320007001,'priestGratia',8],
  [320008001,'priestLapisMedio',12]]){
  const row=remakedBuffRows.find(item=>item.id===id);
  const canonical=gameTerms.skills?.[String(id)],
   officialName=row?.name||canonical?.name||key,
   officialEnglish=row?.nameEn||
    gameTerms.englishSkills?.[String(id)]?.n||officialName;
  const benefit=id===320007001?'gratia':id===320008001?'lapisMedio':'encouragement';
  const amount=priestValues?.[benefit];
  const summary=Number.isFinite(amount)?(
   id===320012001?
    (english?'STR +':'СИЛ +')+amount+' · '+
    (english?'AGI +':'ПРВ +')+amount+' · '+
    (english?'INT +':'ИНТ +')+amount:
   (id===320007001?(english?'Attack speed +':'Скорость атаки +'):
    (english?'Defense +':'Защита +'))+amount
  ):null;
  toggle(priest,english?officialEnglish:officialName,key,false,
   buffs.priestEnabled===true&&Number(buffs.priestBlessing)>=required,
   {id,name:officialName,nameEn:officialEnglish,
    icon:skillIconForId(id),desc:row?.description,
    descEn:gameTerms.englishSkills?.[String(id)]?.d||row?.description,
    externalPriest:true,
    summary});
 }
 for(const [key,label] of [['combatWarCry','Боевой клич'],
  ['combatWindAssist','Помощь ветра'],['combatWindBlessing','Благословение ветра']])
  toggle(party,label,key,false,availability[key]===true,combatSkillCards[key]);
 // One source-controlled setting per Remaked enhancement. The entries
 // already represented by Life Sign, priest and elemental resistance tools
 // deliberately stay in their original sections, without duplicate inputs.
 const readableBuffEffects={
  100058001:['Атака усиливается в зависимости от мастерства. При этом персонаж получает на 100% больше урона.',
    'Attack increases with mastery. Incoming damage also increases by 100%.'],
  213702001:['Ускоряет стрельбу из арбалета на 30%.','Crossbow attack speed +30%.'],
  213605001:['Повышает атаку, точность и дальность стрельбы. Во время действия нельзя двигаться.',
    'Increases attack, accuracy and firing range; movement is disabled.'],
  260002001:['Скорость передвижения +30%.','Movement speed +30%.'],
  220001001:['Добавляет яд к атакам оружием. Сила эффекта зависит от мастерства.',
    'Adds poison aura damage to weapon attacks, scaling with mastery.'],
  430051001:['Добавляет урон тьмой к оружию, но наносит урон владельцу при атаках.',
    'Adds dark aura damage to attacks but also damages the wielder.'],
  168052001:['Уклонение −50%. Улучшает защиту от критических ударов.',
    'Evasion −50%; provides protection against critical hits.'],
  320002001:['Скорость восстановления ОМ союзников +90 инд.',
    'Allies’ MP recovery speed +90 idx.'],
  320006001:['Время каста: 50% от обычного (−50%).',
    'Casting time: 50% of normal (−50%).'],
  330005001:['+5 ОМ каждые 2 секунды при применении.',
    '+5 MP every 2 seconds when applied.'],
  340003001:['Защищает союзников от небольших попаданий. Сила защиты зависит от жреца.',
    'Negates small incoming hits to allies; potency depends on the priest.'],
  320003001:['Уменьшает получаемый группой урон. Сила зависит от Благословения жреца.',
    'Reduces damage taken by the party, scaling with priest Blessing.'],
  330051001:['Добавляет святую ауру оружию союзника. Сила зависит от СД жреца.',
    'Adds holy damage aura to an ally’s weapon, scaling with priest SPR.'],
  320011001:['Усиливает ауру оружия и магический урон союзника. Эффект зависит от жреца.',
    'Boosts an ally’s weapon aura and magical damage, scaling with the priest.'],
  340001001:['Повышает точность и уклонение ближайших союзников.',
    'Raises accuracy and evasion for nearby allies.'],
  340004001:['Повышает магическую атаку союзников и сокращает перезарядку умений.',
    'Increases allies’ magical damage and reduces skill cooldown.'],
  142051001:['Шанс критического удара +10%.','Critical hit chance +10%.'],
  260005001:['Уклонение +10.','Evasion +10.'],
  260008001:['Уклонение +100 до двух полученных ударов.',
    'Evasion +100 until hit twice.'],
  100055001:['Точность +20 и дополнительно +15%.',
    'Accuracy +20 plus +15%.']
 };
 // One shared source model for Buffs and Skill Effects avoids misleading
 // old fixed "+10" text on skills that now scale with trained mastery/AGI.
 const selfModelRows=(()=>{
  const rows=root.PandoraOSCalculator?.scalingSkillPreview?.({
   skillCatalog:gameTerms.skills,jobKey:options.heroJobKey,
   level:options.heroLevel,branchMasteries:options.heroMasteries,
   branchCaps:options.heroBranchCaps,weaponKind:options.heroWeaponKind,
   hasShield:options.heroHasShield,stats:modifiers?.stats,
   combat:modifiers?.combat});
  return [...(rows?.offense||[]),...(rows?.defense||[])];
 })();
 const buffEffectText=id=>{
  if(id===142051001||id===260005001){
   const skill=selfModelRows.find(row=>row.id===id&&row.available);
   const model=skill?.coefficientModels?.[0];
   if(model&&Number.isSafeInteger(model.amount))
    return (id===142051001?(english?'Critical chance +':'Шанс крита +'):(english?'Evasion +':'Уклонение +'))+model.amount;
   return english?'Only a matching class, weapon and source model can provide a value.':
    'Для расчёта нужны подходящие класс, оружие и данные навыка.';
  }
  if(id===320006001&&!inspirationKnown)return english?
   'Exact casting time is not known yet.':
   'Точное время применения пока неизвестно.';
  if(id===330005001&&!naturalKnown)return english?
   'Exact MP recovery is not known yet.':
   'Точное восстановление ОМ пока неизвестно.';
  if(id===100058001&&!despairKnown)return english?
   'Exact attack bonus is not known yet.':
   'Точная прибавка к атаке пока неизвестна.';
  return readableBuffEffects[id]?.[english?1:0]||'';
 };
 // A direct Hero Book render may not receive the higher-level Remaked
 // choices array (e.g. previews, editor tests). Recover the six external
 // priest skills by their official OS IDs instead of silently omitting them.
 const ownIds=new Set(remakedBuffRows.map(row=>row.id));
 const additionalPriestRows=[
  320003001,320011001,330051001,340001001,340003001,340004001
 ].filter(id=>!ownIds.has(id)).map(id=>{
  const source=gameTerms.skills?.[String(id)];
  if(!source||source.id!==id||source.learnable!==true)return null;
  return {id,name:source.name,
   nameEn:gameTerms.englishSkills?.[String(id)]?.n||source.name,
   description:source.desc||'',available:true,existing:false,counted:false,
   scope:'party',reason:'',reasonEn:''};
 }).filter(Boolean);
 for(const row of [...remakedBuffRows,...additionalPriestRows]){
  if(row.existing||!row.name)continue;
  // Blessing- and Hymn-dependent spells are received from another priest.
  // A fixed party effect without caster-attribute scaling remains with allies.
  const externalPriestSkill=[320003001,320011001,330051001,
   340001001,340003001,340004001].includes(row.id);
  const target=externalPriestSkill?priest:row.scope==='party'?party:skills;
  const description=english?gameTerms.englishSkills?.[String(row.id)]?.d:row.description;
  const priestReady=!externalPriestSkill||(
   buffs.priestEnabled===true&&
   (row.id!==320003001||Number(buffs.priestBlessing)>=26)&&
   (row.id!==330051001||Number(buffs.priestExorcism)>=26)&&
   (row.id!==340001001||Number(buffs.priestHymn)>=8)&&
   (row.id!==340003001||(Number(buffs.priestHymn)>=30&&
    Number(buffs.priestBenevolence)>=61))&&
   (row.id!==340004001||(Number(buffs.priestHymn)>=30&&
    Number(buffs.priestBlessing)>=71)));
  toggle(target,english?row.nameEn:row.name,'legacySkill:'+row.id,false,
   row.available&&priestReady,{
    name:row.id===330004001?'Божественное благословение':row.name,
    id:row.id,nameEn:row.nameEn,icon:skillIconForId(row.id),
    desc:row.description,descEn:description||row.description,
    reason:row.reason,reasonEn:row.reasonEn,
    externalPriest:externalPriestSkill,
    pending:!row.counted,
    summary:row.counted?({
     100055001:english?'Accuracy +20 and +15%':'Точность +20 и +15%',
     320002001:restKnown?(english?'MP recovery speed +90 idx':'Скорость восстановления ОМ +90 инд.'):null,
     330004001:english?'Magic resistance +25':'Сопротивление магии +25',
     142051001:buffEffectText(142051001),
     260005001:buffEffectText(260005001),
     260008001:english?'Evasion +100':'Уклонение +100'
    }[row.id]):
     // Game-client description is useful even where current OS stacking is
     // not confirmed. Never present historical previews as final damage.
     (()=>{
      const basic=buffEffectText(row.id)||description||row.description||
       (english?'Exact effect not yet confirmed':'Точный эффект пока не подтверждён');
      const value=row.id===340001001?priestValues.minstrel:
       row.id===340004001?priestValues.sage:
       row.id===320003001?priestValues.groupBarrier:
       row.id===330051001?priestValues.holyWeapon:
       row.id===340003001?priestValues.peaceful:null;
      if(Number.isFinite(value)){
       if(row.id===340001001)return (english?'Accuracy +':'Точность +')+value+
        (english?' · Evasion +':' · Уклонение +')+value;
       if(row.id===340004001)return (english?'Elemental damage +':'Стихийный урон +')+value+'%';
       if(row.id===320003001)return (english?'Incoming physical/magic damage ':'Получаемый физ./маг. урон ')+value+'%';
       if(row.id===330051001){
        const stacked=buffs.remakedSkillIds?.includes(320011001)&&
         Number.isFinite(priestValues.holyEnhanced);
        return stacked?(english?'Holy weapon aura +':'Святая аура оружия +')+
         priestValues.holyEnhanced+(english?' (with Enhance Enchantment)':
          ' (с Чарами усиления)'):
         (english?'Holy weapon aura +':'Святая аура оружия +')+value;
       }
       if(row.id===340003001)return (english?'Protected-hit threshold: ':
        'Порог защищённого удара: ')+value;
      }
      if(row.id===340003001)return english?
       'Protection threshold depends on priest SPR and Hymn.':
       'Порог защиты зависит от СД и Песнопения жреца.';
      if(row.id===320011001&&Number.isFinite(priestValues.enchantAuraRate)&&
       Number.isFinite(priestValues.enchantAuraFlat)){
       const holy=Number.isFinite(priestValues.holyEnhanced)?
        (english?' · Holy aura with both buffs +':' · Святая аура с обоими усилениями +')+
        priestValues.holyEnhanced:'';
       return (english?'Aura +':'Аура +')+priestValues.enchantAuraFlat+
        ' · '+(english?'Aura scaling +':'Усиление ауры +')+
        priestValues.enchantAuraRate+'% · '+
        (english?'Elemental spell bonus +':'Бонус стихийной магии +')+
        priestValues.enchantElementRate+'%'+holy+
        '';
      }
      if(row.id===320011001)return english?
       'Depends on priest SPR and Blessing.':
       'Зависит от СД и Благословения жреца.';
      return basic;
     })()});
 }
 // A sibling of Ally Buffs using the exact same section and toggle
 // components; no nested accordion or separate resistance-only style.
 const elementalSkills=resistanceSkillChoices.filter(s=>s.id!==330004001);
 if(elementalSkills.length){
  const group=section('Усиления сопротивлений стихиям',
   'Elemental resistance buffs','elemental');
  group.append(make('p',{class:'stage-attribute-note',text:english?
   'These spells target an enemy. Here you preview their signed effects on your hero as the target. Only one spell can be active at a time. Selecting another replaces the previous one.':
   'Эти умения направлены на противника. Здесь можно увидеть, как они изменят сопротивления вашего героя, если он окажется целью. Одновременно действует только одно умение, выбор нового заменяет предыдущие.'}));
  const ru={fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
   charm:'Чары',light:'Свет',dark:'Тьма',magic:'Магия'};
  const en={fire:'Fire',ice:'Ice',lightning:'Lightning',poison:'Poison',
   charm:'Charm',light:'Light',dark:'Dark',magic:'Magic'};
  for(const skill of elementalSkills){
   const effect=Object.entries(skill.effects).map(([type,value])=>
    (english?(en[type]||type):(ru[type]||type))+' '+(value>0?'+':'')+value).join(' · ');
   const game=gameTerms.skills?.[String(skill.id)];
   const translated=gameTerms.englishSkills?.[String(skill.id)];
   toggle(group,skill.name,'resistSkill:'+skill.id,false,true,{
    id:skill.id,name:skill.name,
    nameEn:translated?.n||skill.nameEn||skill.name,
    icon:skillIconForId(skill.id),desc:game?.desc,
    descEn:translated?.d||game?.desc,summary:effect
   });
  }
 }


}

// Use the same exact OS icon resolution as Path, Wiki and combat Buffs.
// Never infer artwork from a translated display label.
function gameSkillBadge(id,ru,en,terms,english,skillIconForId){
 const label=make('span',{class:'stage-effect-skill-label'});
 const source=skillIconForId?.(id);
 if(source){
  // Hard-limit intrinsic OS sprites even if an optional CSS file fails to load.
  const picture=make('img',{src:source,alt:'',loading:'lazy',
   width:26,height:26,class:'stage-effect-skill-icon',
   style:'display:block;width:26px;height:26px;min-width:26px;max-width:26px;'+
    'min-height:26px;max-height:26px;flex:0 0 26px;object-fit:contain'});
  picture.onerror=()=>{
   // When an original sprite fails, use only the known original-client
   // question mark, not unrelated artwork from another skill.
   if(picture.dataset.fallback==='1'){picture.remove();return}
   picture.dataset.fallback='1';picture.src='assets/skills/icons/skill_unknown.webp';
  };
  label.append(picture);
 }
 label.append(make('span',{text:gameSkillName(id,ru,en,terms,english)}));
 root.PandoraSkillPreview?.attach(label,id);
 return label;
}
function renderSongSkills(body,modifiers,gameTerms={},skillIconForId=()=>null){
 const english=document.documentElement?.lang==='en';
 const songRows=modifiers?.songSkills?.rows||[];
 if(songRows.length){
  const details=make('details',{class:'stage-legacy-buff-previews stage-song-skills'});
  details.append(make('summary',{text:english?'Songs available to this class':
   'Песни для выбранного класса'}));
  const rows=make('div',{class:'stage-song-skill-list'});
  for(const entry of songRows){
   const requirements=entry.requirements.map(req=>
    gameBranchName(req.branch,gameTerms,english)+' '+req.amount).join(' · ');
   const card=make('div',{class:'stage-song-skill-row'});
   card.append(make('strong',{class:'stage-effect-skill-heading'},[
    gameSkillBadge(entry.id,entry.name,entry.nameEn,gameTerms,english,skillIconForId)]),
    make('small',{text:english?entry.descriptionEn:entry.description}),
    make('span',{class:entry.available?'stage-song-skill-ready':'stage-song-skill-locked',
     text:(entry.available?
      (english?'Requirements met':'Требования выполнены'):
      (english?'Requires mastery':'Требуется мастерство'))+' · '+requirements}));
   rows.append(card);
  }
  details.append(rows,make('p',{class:'stage-legacy-buff-intro',
   text:english?
    'Song effects apply only when activated in the game. No bonus is added to this build automatically.':
    'Эффекты песен действуют после применения в игре. Бонусы не прибавляются к билду автоматически.'}));
  body.append(details);
 }
}
// Mirrors Remaked SkillView: individual skill outcomes, never the selected
// buff toggles or the 43 main result values.
function skillEffectsPage(body,{modifiers=null,gameTerms={},skillIconForId=()=>null,
 remakedBuffRows=[],availability={},combatSkillCards={},
 heroJobKey=null,heroLevel=1,heroMasteries={},heroBranchCaps={},
 heroWeaponKind='BARE_HAND',heroHasShield=false}={}){
 const en=document.documentElement?.lang==='en';
 const spells=modifiers?.healingSpells?.rows||[];
 if(spells.length){
  const group=make('section',{class:'stage-attribute-row stage-healing-spells'});
  group.append(make('strong',{text:en?'Healing skills':'Лечащие умения'}));
  for(const row of spells){
   if(!row||!Number.isFinite(row.amount))continue;
   const amount=String(row.amount)+(row.scaledBySkill?
    (en?' HP':' ОЗ'):(en?' / period':' / период'));
   const available=row.available===true;
   group.append(make('div',{class:'stage-heal-row'+
    (available?'':' stage-book-unavailable')},[
    // Source IDs are stable for all five Remaked healing previews, including
    // locked skills which deliberately have a null available skillId.
    gameSkillBadge(row.skillId||
     ({firstAid:310001001,heal:310004001,healingAura:310021001,
       sanctuary:310023001,restoration:310022001})[row.id],
     row.name,row.nameEn,gameTerms,en,skillIconForId),
    make('strong',{text:amount}),
    make('small',{text:available?(en?'Available':'Доступно'):
     (en?'Preview · '+(row.requiresEn||row.requires||'Requirements not met'):
      'Предпросмотр · '+(row.id==='heal'?
       // The OS class ACOLYTE is «Адепт», not an automatic «Аколит».
       gameClassName('ACOLYTE','Адепт','Acolyte',gameTerms,false)+', уровень 18':
       row.id==='sanctuary'?
       gameClassName('CLERIC','Клирик','Cleric',gameTerms,false)+', уровень 45':
       row.requires||'Требования не выполнены'))})
   ]));
  }
  body.append(group);
 }
 const periodic=modifiers?.periodicRecovery?.rows||[];
 if(periodic.length){
  // The OS English source supplies localized names by numeric skill ID.
  // Do not translate Russian game names heuristically.
  const details=make('details',{class:'stage-attribute-row stage-periodic-recovery'});
  details.append(make('summary',{text:en?'Recovery every 2 seconds':
   'Восстановление каждые 2 секунды'}));
  for(const entry of periodic){
   if(!Number.isFinite(entry?.amount))continue;
   details.append(make('div',{class:'stage-periodic-row'},[
    gameSkillBadge(entry.id,entry.name,null,gameTerms,en,skillIconForId),
    make('strong',{text:String(entry.amount)+' '+(entry.kind==='hp'?
     (en?'HP':'ОЗ'):(en?'MP':'ОМ'))}),
    make('small',{text:entry.available?(en?'Available when using the skill':
     'Доступно при использовании умения'):
     entry.required>0?(en?'Requires '+gameBranchName('benevolence',gameTerms,true)+
      ' mastery '+entry.required:
      'Требуется мастерство «'+gameBranchName('benevolence',gameTerms,false)+
      '»: '+entry.required):
      (en?'Not yet available':'Пока недоступно')})
   ]));
  }
  details.append(make('p',{class:'stage-periodic-hint',text:en?
   'Skill recovery is distinct from passive hero recovery.':
   'Действие навыка не относится к пассивному восстановлению героя.'}));
  body.append(details);
 }
 // Skill Effects shows the theoretical effect of a CAST, independently
 // of whether the player enabled that skill in the Buffs chapter.
 // Fixed legacy buffs remain in Buffs; audited OS movement parameters are shown separately.
 const rows=root.PandoraOSCalculator?.scalingSkillPreview?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchMasteries:heroMasteries,branchCaps:heroBranchCaps,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches,
  weaponKind:heroWeaponKind,hasShield:heroHasShield,
  stats:modifiers?.stats,combat:modifiers?.combat
 })||{offense:[],defense:[]};
 for(const [groupName,captionRu,captionEn,sectionClass,rowClass] of [
  ['offense','Атакующие умения','Offensive skills',
   'stage-attacking-skills','stage-offense-skill-row'],
  ['defense','Защитные умения','Defensive skills',
   'stage-defensive-skills','stage-defense-skill-row'],
  ['movement','Скорость передвижения · параметры умений',
   'Movement speed · skill parameters',
   'stage-movement-skills','stage-defense-skill-row'],
  ['utility','Контроль и ресурсы · параметры умений',
   'Control & resources · skill parameters',
   'stage-utility-skills','stage-defense-skill-row']
 ]){
  const skills=rows[groupName]||[];
  if(!skills.length)continue;
  const section=make('section',{class:'stage-attribute-row stage-healing-spells '+sectionClass});
  section.append(make('strong',{text:en?captionEn:captionRu}));
  for(const skill of skills){
   const source=gameTerms.englishSkills?.[String(skill.id)];
   const amount=Number.isFinite(skill.amount)?
    (skill.amount>0?'+':'')+String(skill.amount)+
     (en?skill.unit.replace(' защиты',' DEF').replace(' уклонения',' evasion')
      .replace(' АТК',' ATK').replace(' точности и уклонения',' accuracy & evasion')
      .replace(' урона светом',' holy damage').replace(' урона тьмой',' dark damage')
      .replace(' к СИЛ, ПРВ и ИНТ',' STR, AGI and INT')
      .replace(' инд.',' idx').replace(' сопротивления',' resistance')
      .replace(' урона',' damage'):skill.unit):
    '—';
   const ready=skill.hostile?(en?'Source parameters on an enemy target':
    'Исходные параметры на противнике'):
    skill.recipient?(en?
    'Effect on this hero when cast by an ally':
    'Эффект при применении союзником к этому герою'):
    skill.available?(en?'Preview when cast':'Значение при применении'):
    (en?'Requirements not met':'Требования ещё не выполнены')+
     ((en?skill.reasonEn:skill.reason)?' · '+(en?skill.reasonEn:skill.reason):'');
   const detail=[ready,en?
    (skill.detailEn||source?.d||skill.description):
    (skill.detailRu||skill.description)].filter(Boolean).join(' · ');
   const modelParts=[...(skill.coefficientModels||[]),
    ...(skill.sourceParameters||[])].filter(part=>
    Number.isSafeInteger(part?.amount)&&
    ['coefficient-model','source-parameter'].includes(part.confidence));
   const preview=make('div',{class:'stage-heal-row '+rowClass+
    (!skill.available?' stage-book-unavailable':'')},[
    gameSkillBadge(skill.id,skill.name,source?.n||skill.name,
     gameTerms,en,skillIconForId),
    make('strong',{text:amount}),
    make('small',{text:detail})
   ]);
   if(modelParts.length&&!Number.isFinite(skill.amount)){
    const parts=modelParts.map(part=>
     (en?part.labelEn:part.labelRu)+' '+
     (part.amount>0?'+':'')+part.amount+part.unit).join(' · ');
    preview.append(make('small',{class:'stage-skill-os-coefficient-model',
     text:(en?'Skill parameters: ':'Параметры умения: ')+
      parts}));
    for(const part of modelParts){
     const p=part.roundingParts;
     if(p?.method!=='floor-components')continue;
     preview.append(make('small',{class:'stage-skill-os-coefficient-model',text:en?
      'Hypothetical basis (round down each part): '+p.base+' + INT '+p.int+
       ' + mastery '+p.mastery+' = '+part.amount:
      'Предполагаемая основа (каждая часть округляется вниз): '+
       p.base+' + ИНТ '+p.int+' + мастерство '+p.mastery+' = '+part.amount}));
    }
   }
   section.append(preview);
  }
  body.append(section);
 }
  // Structural links from the official OS IDs, not extra stats.
 const chains=root.PandoraOSCalculator?.skillExecutionChains?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchMasteries:heroMasteries,branchCaps:heroBranchCaps,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches,
  weaponKind:heroWeaponKind
 });
 if(chains?.rows?.length){
  const group=make('details',{class:'stage-attribute-row stage-skill-chain-effects'});
  group.append(make('summary',{text:en?'Linked skill effects':'Связанные эффекты умений'}));
  group.append(make('p',{class:'stage-periodic-hint',text:en?
   'Some skills launch other actions. The links do not guarantee extra damage, hits or duration.':
   'Некоторые умения запускают дополнительные действия. Это не гарантированный урон, число попаданий или длительность.'}));
  const canonical=id=>{
   const ru=gameTerms.skills?.[String(id)]?.name||'';
   return en?(gameTerms.englishSkills?.[String(id)]?.n||ru):ru;
  };
  for(const chain of chains.rows){
   const source=gameTerms.englishSkills?.[String(chain.id)];
   const paths=chain.paths.map(path=>path.slice(1).map(canonical).join(' → '));
   const status=chain.requirementsMet?
    (en?'Level and mastery requirements met':'Требования уровня и мастерства выполнены'):
    (en?chain.reasonEn:chain.reasonRu);
   group.append(make('div',{class:'stage-heal-row stage-skill-chain-row'+
    (chain.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(chain.id,chain.name,source?.n||chain.name,gameTerms,en,skillIconForId),
    make('small',{text:(en?'Linked actions: ':'Связанные действия: ')+paths.join(' / ')}),
    make('small',{text:status})
   ]));
  }
  body.append(group);
 }
 // Conditional hits are not the same as always-on skill cast links.
 const conditional=root.PandoraOSCalculator?.skillExecutionChains?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchMasteries:heroMasteries,branchCaps:heroBranchCaps,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches,
  weaponKind:heroWeaponKind,onHit:true
 });
 if(conditional?.rows?.length){
  const section=make('details',{class:'stage-attribute-row stage-skill-onhit-effects'});
  section.append(make('summary',{text:en?'Effects on hit':'Эффекты при попадании'}));
  section.append(make('p',{class:'stage-periodic-hint',text:en?
   'These effects may follow a hit. Their activation chance and duration are not confirmed.':
   'Эти эффекты могут запускаться при попадании. Их шанс срабатывания и длительность пока не подтверждены.'}));
  for(const entry of conditional.rows){
   const source=gameTerms.englishSkills?.[String(entry.id)];
   // The internal OS child typically repeats the parent skill's name.
   // Prefer the actual official game description over a confusing duplicate.
   const description=(en?source?.d:null)||
    gameTerms.skills?.[String(entry.id)]?.desc||'';
   const requirements=entry.requirementsMet?
    (en?'Level and mastery requirements met':'Требования уровня и мастерства выполнены'):
    (en?entry.reasonEn:entry.reasonRu);
   section.append(make('div',{class:'stage-heal-row stage-skill-onhit-row'+
    (entry.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(entry.id,entry.name,source?.n||entry.name,gameTerms,en,skillIconForId),
    make('small',{text:description}),
    make('small',{text:requirements})
   ]));
  }
  body.append(section);
 }
 // Exact game recipes, separate from combat effects and buffs.
 const crafted=root.PandoraOSCalculator?.craftingSkillPreview?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchCaps:heroBranchCaps,branchMasteries:heroMasteries,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches
 });
 const sourceItemName=id=>{
  const ru=gameTerms.items?.[String(id)]?.name;
  return ru?(en?(gameTerms.englishItems?.[String(id)]?.n||ru):ru):null;
 };
 const recipes=(crafted?.rows||[]).filter(r=>
  [...r.uses,r.produces].every(item=>sourceItemName(item.id)));
 if(recipes.length){
  const section=make('details',{class:'stage-attribute-row stage-skill-crafting-effects'});
  section.append(make('summary',{text:en?'Making items with skills':'Создание предметов умениями'}));
  section.append(make('p',{class:'stage-periodic-hint',text:en?
   'Source recipes. Ingredients are required; your inventory is not checked here.':
   'Рецепты из игровых данных. Нужны указанные ингредиенты; наличие в сумке здесь не проверяется.'}));
  for(const recipe of recipes){
   const english=gameTerms.englishSkills?.[String(recipe.id)];
   const part=item=>String(item.quantity)+' × '+sourceItemName(item.id);
   const recipeLine=recipe.uses.map(part).join(' + ')+' → '+part(recipe.produces);
   const requirements=recipe.requirementsMet?
    (en?'Mastery requirement met':'Мастерства достаточно'):
    (en?recipe.reasonEn:recipe.reasonRu);
   section.append(make('div',{class:'stage-heal-row stage-skill-crafting-row'+
    (recipe.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(recipe.id,recipe.name,english?.n||recipe.name,
     gameTerms,en,skillIconForId),
    make('small',{text:recipeLine}),
    make('small',{text:requirements})
   ]));
  }
  body.append(section);
 }
 // Exact trap-item cost from the game, never guessed combat damage.
 const trapCost=root.PandoraOSCalculator?.trapSkillCostPreview?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchCaps:heroBranchCaps,branchMasteries:heroMasteries,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches
 });
 const trapItem=sourceItemName(65007);
 if(trapItem&&trapCost?.rows?.length){
  const section=make('details',{class:'stage-attribute-row stage-skill-trap-costs'});
  section.append(make('summary',{text:en?'Traps and ingredients':'Ловушки и расход материалов'}));
  section.append(make('p',{class:'stage-periodic-hint',text:en?
   'The number of traps needed is from game data. Trigger chance, final damage and inventory are not calculated here.':
   'Количество ловушек взято из игровых данных. Шанс срабатывания, итоговый урон и наличие в сумке здесь не рассчитываются.'}));
  for(const row of trapCost.rows){
   const official=gameTerms.englishSkills?.[String(row.id)];
   const status=row.requirementsMet?
    (en?'Mastery requirement met':'Мастерства достаточно'):
    (en?row.reasonEn:row.reasonRu);
   section.append(make('div',{class:'stage-heal-row stage-skill-trap-cost-row'+
    (row.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(row.id,row.name,official?.n||row.name,gameTerms,en,skillIconForId),
    make('small',{text:(en?'Required: ':'Для применения нужно: ')+row.count+' × '+trapItem}),
    make('small',{text:(en?'Effect in game data: ':'Эффект в игровых данных: ')+
     (en?row.sourceEffectEn:row.sourceEffectRu)}),
    ...(row.statusResistanceKey?[make('small',{text:en?
     'Knockback resistance is shown in Defense; its server check is not confirmed.':
     'Сопротивление отбрасыванию показано в «Защите»; правило проверки на сервере не подтверждено.'})]:[]),
    make('small',{text:status}),
    ...(row.level50Variant?[make('small',{text:en?
     'Saboteur: from level 50, game data contains a version with a stronger elemental attack and the same knockback. It is not yet known when the game switches to that version.':
     'Загонщик: с 50-го уровня в игровых данных есть вариант с более сильным стихийным ударом и прежним отталкиванием. Когда игра переключает ловушку на этот вариант, пока неизвестно.'})]:[])
   ]));
  }
  body.append(section);
 }
 // Exact source descriptions for spells with unsupported damage kernels
 // and cures. Never turn FV1 coefficients into unverified final numbers.
 const sourceMechanics=root.PandoraOSCalculator?.complexSkillSourcePreview?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchCaps:heroBranchCaps,branchMasteries:heroMasteries,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches
 });
 if(sourceMechanics?.rows?.length){
  const group=make('details',{class:'stage-attribute-row stage-skill-complex-effects'});
  group.append(make('summary',{text:en?'More skill effects':'Другие эффекты умений'}));
  group.append(make('p',{class:'stage-periodic-hint',text:en?
   'Official game descriptions, not unverified final damage calculations.':
   'Описания взяты из игровых данных. Неподтверждённые значения урона здесь не выдумываются.'}));
  for(const entry of sourceMechanics.rows){
   const official=gameTerms.englishSkills?.[String(entry.id)];
   const description=(en?official?.d:null)||entry.description||'';
   const caution=entry.kind==='elemental'?
    (entry.hasSecondaryEffect?
     (en?'Final damage and secondary status behaviour are not yet confirmed.':
      'Точный урон и действие дополнительного состояния пока не подтверждены.'):
     (en?'Final damage against a target is not yet confirmed.':
      'Точный урон по цели пока не подтверждён.')):
    (en?'Only the game description is confirmed; the result depends on the target’s conditions.':
     'Подтверждено описание навыка. Результат зависит от состояний цели.');
   const availability=entry.requirementsMet?
    (en?'Level and mastery requirements met':'Требования уровня и мастерства выполнены'):
    (en?entry.reasonEn:entry.reasonRu);
   group.append(make('div',{class:'stage-heal-row stage-skill-complex-row'+
    (entry.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(entry.id,entry.name,official?.n||entry.name,gameTerms,en,skillIconForId),
    make('small',{text:description}),
    make('small',{text:caution}),
    ...(entry.linkedStatus?[make('small',{text:(en?
     'Additional state: ':'Дополнительное состояние: ')+
     (en?entry.linkedStatus.en:entry.linkedStatus.ru)+
     (en?'. Resistance appears separately in Defense; actual application chance is unverified.':
      '. Сопротивление указано отдельно в «Защите»; шанс наложения не подтверждён.')})]:[]),
    make('small',{text:availability})
   ]));
  }
  body.append(group);
 }
 // Current OS effects are TARGET actions, not permanent hero resistances.
 const statusesFromSkills=root.PandoraOSCalculator?.statusApplicationPreview?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchCaps:heroBranchCaps,branchMasteries:heroMasteries,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches
 });
 if(statusesFromSkills?.rows?.length){
  const section=make('details',{class:'stage-attribute-row stage-skill-complex-effects stage-skill-status-effects'});
  section.append(make('summary',{text:en?'Status effects from skills':'Состояния от умений'}));
  section.append(make('p',{class:'stage-periodic-hint',text:en?
   'Game data identifies the state; its chance, duration and resistance rules are not confirmed.':
   'Игровые данные указывают состояние, но точный шанс, длительность и действие сопротивления не установлены.'}));
  for(const entry of statusesFromSkills.rows){
   const official=gameTerms.englishSkills?.[String(entry.id)];
   const state=en?entry.linkedStatus.en:entry.linkedStatus.ru;
   const resistance=entry.linkedStatus.key?(en?
    'Its resistance is in Defense; protection is not a proven guaranteed block.':
    'Сопротивление этому состоянию указано в «Защите», но его действие не подтверждено.'):(en?
    'Poison status is not identical to elemental poison resistance.':
    'Отравление и сопротивление стихии яда — разные показатели.');
   const access=entry.requirementsMet?(en?'Level and mastery requirements met':
    'Требования уровня и мастерства выполнены'):(en?entry.reasonEn:entry.reasonRu);
   section.append(make('div',{class:'stage-heal-row stage-skill-complex-row'+
    (entry.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(entry.id,entry.name,official?.n||entry.name,gameTerms,en,skillIconForId),
    make('small',{text:(en?official?.d:null)||entry.description||''}),
    make('small',{text:(en?'Possible state: ':'Возможное состояние: ')+state}),
    make('small',{text:resistance}),
    ...(entry.requiresBlocking?[make('small',{text:en?
     'Only usable while blocking.':'Применяется только во время блокирования.'})]:[]),
    make('small',{text:access})
   ]));
  }
  body.append(section);
 }
 // These skills reduce enemy attributes or MP; their source coefficients
 // are not the character's own stats or verified target-side totals.
 const enemyDebuffs=root.PandoraOSCalculator?.enemyDebuffPreview?.({
  skillCatalog:gameTerms.skills,jobKey:heroJobKey,level:heroLevel,
  branchCaps:heroBranchCaps,branchMasteries:heroMasteries,
  branchLabels:gameTerms.branchLabels,englishBranches:gameTerms.englishBranches
 });
 if(enemyDebuffs?.rows?.length){
  const section=make('details',{class:'stage-attribute-row stage-skill-enemy-debuffs'});
  section.append(make('summary',{text:en?'Weakening enemies':'Ослабление противника'}));
  section.append(make('p',{class:'stage-periodic-hint',text:en?
   'These effects apply to the enemy, not to your hero. Final reduction, duration and resistance checks are not confirmed.':
   'Эти умения действуют на противника, а не на вашего героя. Точное ослабление, длительность и влияние сопротивлений пока неизвестны.'}));
  for(const row of enemyDebuffs.rows){
   const official=gameTerms.englishSkills?.[String(row.id)];
   const access=row.requirementsMet?(en?'Mastery requirement met':'Мастерства достаточно'):
    (en?row.reasonEn:row.reasonRu);
   section.append(make('div',{class:'stage-heal-row stage-skill-enemy-debuff-row'+
    (row.requirementsMet?'':' stage-book-unavailable')},[
    gameSkillBadge(row.id,row.name,official?.n||row.name,
     gameTerms,en,skillIconForId),
    make('small',{text:en?row.summaryEn:row.summaryRu}),
    make('small',{text:en?row.noteEn:row.noteRu}),
    make('small',{text:access})
   ]));
  }
  body.append(section);
 }
if(!spells.length&&!periodic.length&&!rows.offense?.length&&!rows.defense?.length&&!rows.movement?.length&&!rows.utility?.length&&!chains?.rows?.length&&!conditional?.rows?.length&&!recipes?.length&&!trapCost?.rows?.length&&!sourceMechanics?.rows?.length&&!statusesFromSkills?.rows?.length&&!enemyDebuffs?.rows?.length)
  body.append(make('p',{class:'stage-attribute-note',text:en?
   'Only skills with build-dependent effect values appear here. Fixed buffs belong in Buffs.':
   'Здесь показаны только умения, сила которых зависит от билда. Постоянные усиления — во вкладке «Усиления».'}));

}
// Remaked uses three DISTINCT source matrices: Set.Status (43 totals),
// Set.ATK (extra offense) and Set.RES (recovery and specific defenses).
// Never copy a Set.Status number into Set.ATK/Set.RES display just to fill space.
function chapterNumber(key,ru,en,value,unit='',allowZero=false){
 if(!Number.isFinite(value)||(!allowZero&&value===0))return null;
 return {key,ru,en,value,unit};
}
const elementTerms=Object.freeze({
 fire:['Огонь','Fire'],ice:['Лёд','Ice'],lightning:['Молния','Lightning'],
 poison:['Яд','Poison'],charm:['Чары','Charm'],light:['Свет','Light'],
 dark:['Тьма','Dark'],magic:['Магия','Magic']
});
function attackChapterGroups(calc){
 if(!calc)return[];
 const groups=[
  {key:'weapon',ru:'Урон оружия и дальность',en:'Weapon damage and range',rows:[]},
  {key:'aura',ru:'Аура оружия',en:'Weapon aura damage',rows:[]},
  {key:'magic',ru:'Стихийная магия',en:'Elemental magic',rows:[]},
  {key:'conditions',ru:'Наложение состояний',en:'Inflicting status effects',rows:[]}
 ];
 const put=(g,key,ru,en,value,unit='',zero=false)=>{
  const row=chapterNumber(key,ru,en,value,unit,zero);
  if(row)groups[g].rows.push(row);
 };
 const combat=calc.combat||{},range=calc.attackRange||{};
 // Original equipped weapon W is not the separate mastery/title damage bonus.
 // Show the real base physical weapon attack, not misleading '1' for a sword.
 if(combat.attack?.unarmed===false)
  put(0,'weaponBase','Базовая физическая атака оружия',
   'Base physical weapon attack',combat.attack.weaponDamage,'',true);
 const racial=combat.racialWeapon;
 if(racial?.matchesCategory===true&&
  typeof racial.ru==='string'&&typeof racial.en==='string'&&
  Number.isSafeInteger(racial.id)){
  put(0,'racialWeaponFlat:'+racial.id,racial.ru+' · урон (ед.)',
   racial.en+' · damage (flat)',racial.flat);
  const numericRate=Number.isFinite(combat.attack?.racialBonus)?
   combat.attack.racialBonus-racial.flat:null;
  put(0,'racialWeaponRate:'+racial.id,
   racial.ru+' · прибавка от '+racial.percent+'%',
   racial.en+' · bonus from '+racial.percent+'%',
   numericRate,'',true);
 }
 // Weapon base and its bonuses must be distinct lines.
 put(0,'equippedWeaponRange','Дальность атаки надетого оружия',
  'Equipped weapon attack range',range.baseRanged??range.baseMelee);
 put(0,'racialRange','Зоркость · дальность стрельбы',
  'Eagle Eye · shooting range',range.racialRanged);
 if(Array.isArray(range.entries))range.entries.forEach((entry,i)=>{
  if(!entry||!['general','bow'].includes(entry.kind)||
   typeof entry.source!=='string'||!entry.source.trim())return;
  put(0,'gearRange:'+i,
   (entry.kind==='bow'?'Дальность стрельбы':'Дальность атаки')+' · '+entry.source,
   (entry.kind==='bow'?'Bow range':'Attack range')+' · '+entry.source,entry.amount);
 });
 put(0,'totalMeleeRange','Дальность атаки ближнего боя · всего',
  'Melee attack range · total',range.totalMelee);
 put(0,'totalRangedRange','Дальность атаки дальнего боя · всего',
  'Ranged attack range · total',range.totalRanged);
 const song=calc.combat?.priestSong;
 if(Number(song?.sageElementDamage)>0)
  put(2,'priestSageElement','Песнь чар · стихийный урон',
   'Sage Song · elemental damage',song.sageElementDamage,'%');
 const aura=calc.auraDamage?.elements||{};
 for(const [key,entry]of Object.entries(aura)){
  const term=elementTerms[key];if(!term)continue;
  put(1,'aura:'+key,'Урон ауры · '+term[0],'Aura damage · '+term[1],
   entry?.known);
 }
 // The gem, title, and source-verified fire refinement are DIFFERENT
 // components. Their server stacking is not established: never sum them.
 for(const [key,amount]of Object.entries(calc.elementalMagic||{})){
  const term=elementTerms[key];if(!term)continue;
  put(2,'magicHonor:'+key,'Магия '+term[0].toLowerCase()+' · титул',
   term[1]+' magic · title',amount,'%');
 }
 for(const [key,amount]of Object.entries(calc.gemstones?.magic||{})){
  const term=elementTerms[key];if(!term)continue;
  put(2,'magicGem:'+key,'Магия '+term[0].toLowerCase()+' · самоцвет',
   term[1]+' magic · gem',amount,'%');
 }
 for(const entry of calc.elementalRefinement?.entries||[]){
  if(entry?.itemId!==1862||entry.element!=='fire')continue;
  put(2,'magicRefinement:1862:'+entry.grade,
   'Кинжал огня зноя +'+entry.grade+' · магия огня',
   'Dagger of Scorching Heat +'+entry.grade+' · fire magic',entry.rate,'%');
 }
 for(const [key,amount]of Object.entries(calc.gemstones?.status||{})){
  const term=elementTerms[key];if(!term)continue;
  put(3,'statusChance:'+key,'Наложение · '+term[0],
   'Infliction · '+term[1],amount,'%');
 }
 put(3,'debuffDuration','Длительность накладываемых ослаблений',
  'Outgoing debuff duration',combat.secondary?.outgoingDebuffDuration,'%');
 put(3,'debuffSuccess','Шанс наложить ослабление',
  'Debuff application chance',combat.secondary?.debuffSuccess,'%');
 put(3,'racialAccuracy','Подавление гнева · эффект точности',
  'Anger Suppression · accuracy effect',combat.racialRate?.accuracy,'%');

 return groups.filter(g=>g.rows.length);
}
function defenseChapterGroups(calc){
 if(!calc)return[];
 const groups=[
  {key:'recovery',ru:'Пассивное восстановление',
   en:'Passive recovery',rows:[]},
  {key:'status',ru:'Сопротивления отдельным состояниям',
   en:'Individual status resistances',rows:[]},
  {key:'special',ru:'Дополнительная защита',
   en:'Additional defensive effects',rows:[]}
 ];
 const put=(g,key,ru,en,value,unit='',zero=false)=>{
  const row=chapterNumber(key,ru,en,value,unit,zero);
  if(row)groups[g].rows.push(row);
 };
 const a=calc.recoveryAmount,r=calc.regeneration;
 put(0,'hpRecoveryAmount','Восстановление ОЗ','HP recovery amount',a?.hp?.known,'',true);
 put(0,'mpRecoveryAmount','Восстановление ОМ','MP recovery amount',a?.mp?.known,'',true);
 put(0,'hpRecoverySpeed','Скорость восстановления ОЗ',
  'HP recovery speed',r?.hp?.total,' инд.',true);
 put(0,'mpRecoverySpeed','Скорость восстановления ОМ',
  'MP recovery speed',r?.mp?.total,' инд.',true);
 // Expose the independent ally component without counting it twice:
 // mpRecoverySpeed already includes this index once in the total.
 put(0,'mpRecoveryRepose','Благословенный покой · прибавка к скорости ОМ',
  'Blessed Repose · MP speed bonus',r?.mp?.allyBuff,' инд.');
 const statuses={
  burn:['Ожоги','Burn'],stun:['Оглушение','Stun'],
  numb:['Заморозка','Freeze'],tumble:['Падение','Knockdown'],
  knockback:['Отбрасывание','Knockback'],sleep:['Сон','Sleep'],
  silence:['Немота','Silence'],evil:['Проклятие','Curse'],
  curse:['Слабость','Weakness'],disease:['Болезнь','Disease'],
  madness:['Безумие','Madness'],blockBreak:['Пробитие блока','Block break']
 };
 for(const [key,value]of Object.entries(calc.resistances?.status||{})){
  if(!statuses[key])continue;
  put(1,'resistStatus:'+key,statuses[key][0],statuses[key][1],value,'%',true);
 }
 const res=calc.resistances||{};
 put(2,'racialDodge','Интуиция · эффект уклонения',
  'Intuition · evasion effect',calc.combat?.racialRate?.dodge,'%');
 put(2,'reflection','Отражение физического урона',
  'Physical damage reflection',res.physicalReflection,'%');
 put(2,'incomingDebuffDuration','Изменение длительности входящих ослаблений',
  'Incoming debuff duration change',res.incomingDebuffDurationReduction,'%');
 put(2,'damageNegation','Уклонение от физического урона',
  'Physical damage negation',res.damageNegation);
 for(const [i,e]of (calc.targetResistance?.entries||[]).entries()){
  if(!e||!Number.isFinite(e.change))continue;
  put(2,'targetResistance:'+i,'Урон от '+e.name+' · '+e.source,
   'Damage from '+e.nameEn+' · '+e.source,e.change,'%');
 }
 return groups.filter(g=>g.rows.length);
}
// Source breakdown of the existing 12 status totals. Equipment and Souls
// are only ONE component of those totals; this does not model server rolls.
function individualStatusSourceRows(traces,terms={},english=false,statusRows=[]){
 if(!Array.isArray(traces)||!terms||typeof terms!=='object')return [];
 const byEffect={
  EP_IMMUNE_BURN:'burn',EP_IMMUNE_STUN:'stun',
  EP_IMMUNE_NUMB:'numb',EP_IMMUNE_TUMBLE:'tumble',
  EP_IMMUNE_KNOCKBACK:'knockback',EP_IMMUNE_SLEEP:'sleep',
  EP_IMMUNE_SILENCE:'silence',EP_IMMUNE_EVIL:'evil',
  EP_IMMUNE_CURSE:'curse',EP_IMMUNE_DISEASE:'disease',
  EP_IMMUNE_RAVING:'madness',EP_BLOCK_BREAK_RESIST:'blockBreak'
 };
 const known=new Map(statusRows.filter(x=>
  typeof x?.key==='string'&&x.key.startsWith('resistStatus:'))
  .map(x=>[x.key.slice('resistStatus:'.length),english?x.en:x.ru]));
 const sums=new Map();
 for(const trace of traces){
  const status=byEffect[trace?.func],match=String(trace?.source||'')
   .match(/^(item|soul):([1-9][0-9]*)$/);
  const amount=trace?.value;
  if(!status||!known.has(status)||!match||
   !Number.isFinite(amount)||amount===0)continue;
  const id=Number(match[2]);
  if(!Number.isSafeInteger(id))continue;
  const rec=match[1]==='item'?terms.items?.[match[2]]:
   terms.souls?.[match[2]];
  if(rec?.id!==id||typeof rec.name!=='string'||!rec.name.trim())continue;
  const en=match[1]==='item'?terms.englishItems?.[match[2]]?.n:
   terms.englishSouls?.[match[2]]?.n;
  const name=english&&typeof en==='string'&&en.trim()?en:rec.name;
  const key=status+'|'+match[1]+':'+match[2];
  const old=sums.get(key);
  sums.set(key,{status,name,amount:(old?.amount||0)+amount});
 }
 return [...sums.values()].filter(x=>x.amount!==0).map(x=>({
  status:x.status,name:x.name,amount:x.amount,label:known.get(x.status)
 }));
}
function appendChapterGroups(body,groups,english,emptyRu,emptyEn,options={}){
 if(!groups.length){body.append(make('p',{class:'stage-attribute-note',
  text:english?emptyEn:emptyRu}));return;}
 const number=new Intl.NumberFormat(english?'en-US':'ru-RU',
  {maximumFractionDigits:2});
 for(const group of groups){
  const section=make('section',{class:'stage-attribute-row stage-chapter-group',
   'data-chapter-group':group.key});
  const heading=make('div',{class:'stage-chapter-heading'});
  const title=make('strong',{text:english?group.en:group.ru});
  heading.append(title);section.append(heading);
  guideLabel(title,(options.page||'attack')+'.group.'+group.key,group.ru,group.en,options);
  if(group.key==='status'&&options.page==='defense'){
   // Share the summary tooltip's existing D1 key, not another stale copy.
   const familyRows=summaryRows({}).flatMap(entry=>entry.rows);
   const family=[['Сопр. аном. тел.','Physical conditions'],
    ['Сопр. аном. дух.','Mental conditions']];
   const help=make('details',{class:'stage-status-family-guide'});
   const caption=make('span',{text:english?
    'What are body and mind ailments?':
    'Какие состояния относятся к телу и духу?'});
   help.append(make('summary',{},[caption]));
   guideLabel(caption,'defense.statusFamilyCaption',
    'Какие состояния относятся к телу и духу?',
    'What are body and mind ailments?',options);
   for(const [ru,en] of family){
    const index=familyRows.findIndex(row=>row.ru===ru);
    if(index<0)continue;
    const record=root.PandoraHonorGuide?.summary(options.overrides||{},index,ru,en);
    const description=guideDisplayText(english?record?.hintEn:record?.hintRu);
    if(!description)continue;
    const copy=make('span',{class:'stage-status-family-copy',text:description});
    const paragraph=make('p',{class:'stage-status-family-paragraph'},[copy]);
    if(options.editable&&typeof options.onTextEdit==='function'){
     const field=english?'hintEn':'hintRu',key='summary.'+index;
     const edit=event=>{
      event.preventDefault();event.stopPropagation();
      root.PandoraGuideTooltip?.dismiss();
      options.onTextEdit(copy,key,field,description);
     };
     copy.addEventListener('dblclick',edit);
     copy.setAttribute('aria-keyshortcuts','F2');
     copy.addEventListener('keydown',event=>{if(event.key==='F2')edit(event)});
     copy.tabIndex=0;
     paragraph.append(make('button',{type:'button',class:'stage-guide-edit-name',
      text:'✎',title:english?'Edit status explanation':'Изменить пояснение',
      'aria-label':english?'Edit status explanation':'Изменить пояснение',
      onclick:edit}));
    }
    help.append(paragraph);
   }
   section.append(help);
  }
  const grid=make('div',{class:'stage-chapter-grid'});
  for(const row of group.rows){
   const labelSlot=make('div',{class:'stage-chapter-label'},[
    make('span',{text:english?row.en:row.ru})
   ]);
   const entry=make('div',{class:'stage-chapter-entry','data-chapter-stat':row.key},[
    labelSlot,
    make('strong',{text:number.format(row.value)+
     (row.unit===' инд.'?(english?' idx':' инд.'):row.unit)})
   ]);
   guideLabel(labelSlot.firstChild,(options.page||'attack')+'.'+row.key,
    row.ru,row.en,options);
   grid.append(entry);
  }
  section.append(grid);
  if(group.key==='weapon'&&options.page==='attack'){
   const ru='Дальность оружия и действующие бонусы складываются. Временные умения без надёжного расчёта пока не включены.';
   const en='Weapon range and active bonuses are added. Temporary skills without a reliable calculation are not included yet.';
   const hint=make('p',{class:'stage-attribute-note',text:english?en:ru});
   guideLabel(hint,'attack.rangeExplanation',ru,en,options);
   section.append(hint);
  }
   if(group.key==='status'&&options.page==='defense'){
    const sources=individualStatusSourceRows(options.statusSourceTraces,
     options.gameTerms,english,group.rows);
    if(sources.length){
     const breakdown=make('details',{class:'stage-status-source-breakdown'});
     breakdown.append(make('summary',{text:english?
      'Bonuses from equipment and Souls':'Вклад предметов и душ'}));
     breakdown.append(make('p',{class:'stage-attribute-note',text:english?
      'Direct item and Soul bonuses only. Titles, passives, sets and other effects may also change the totals above.':
      'Здесь только прямые бонусы вещей и душ. Титулы, пассивные умения, комплекты и другие эффекты тоже могут влиять на итоговые значения выше.'}));
     for(const source of sources){
      const display=(source.amount>0?'+':'')+number.format(source.amount)+'%';
      breakdown.append(make('div',{class:'stage-status-source-row',
       text:source.label+': '+display+' · '+source.name}));
     }
     section.append(breakdown);
    }
   }
   body.append(section);
 }
}
function appendItemEvents(body,calc,english,kind,gameTerms={}){
 const rows=[];
 const belongs=code=>kind==='attack'?/^EP_ONHIT_/.test(code):
  /^EP_ONDAMAGE_|^EP_ALL_CRITICAL$|^EP_RACE_TOUGH_HEART$|^EP_HEAL_LIFE_REGENERATOR$|^EP_DESTINE_WARDING$/.test(code);
 for(const entry of calc?.specialEquipment?.entries||[]){
  if(!belongs(entry.code))continue;
  rows.push({source:entry.source,ru:entry.ru,en:entry.en});
 }
 for(const entry of calc?.procPreview?.entries||[]){
  if(!belongs(entry.code))continue;
  const tail=entry.chance==null?'':' · '+entry.chance+'%';
  rows.push({source:entry.source,skillId:entry.skillId,
   triggerRu:entry.trigger||'Срабатывание',
   triggerEn:entry.triggerEn||entry.trigger||'Trigger',
   skillName:entry.skillName,skillNameEn:entry.skillNameEn,
   tail,
   ru:(entry.trigger||'Срабатывание')+' · '+entry.skillName+tail,
   en:(entry.triggerEn||entry.trigger||'Trigger')+' · '+
    (entry.skillNameEn||entry.skillName)+tail});
 }
 if(!rows.length)return;
 const panel=make('details',{class:'stage-attribute-row stage-source-events'});
 panel.append(make('summary',{text:(english?'Item and Soul triggers':
  'Срабатывания предметов и душ')+' · '+rows.length}));
 for(const row of rows){
  const skill=gameTerms.skills?.[String(row.skillId)];
  const valid=Number.isSafeInteger(row.skillId)&&row.skillId>0&&
   skill?.id===row.skillId;
  if(!valid){
   panel.append(make('p',{text:row.source+' · '+(english?row.en:row.ru)}));
   continue;
  }
  const line=make('p',{class:'stage-source-proc-skill'});
  line.append(document.createTextNode(row.source+' · '+
   (english?row.triggerEn:row.triggerRu)+' · '));
  const translated=gameTerms.englishSkills?.[String(row.skillId)];
  const name=english?(translated?.n||row.skillNameEn||skill.name):
   (skill.name||row.skillName);
  const skillLink=make('span',{class:'stage-consumable-skill-name',text:name});
  // Identical icon, level, mastery and description to Path; no new style.
  root.PandoraSkillPreview?.attach(skillLink,row.skillId);
  line.append(skillLink);
  if(row.tail)line.append(document.createTextNode(row.tail));
  panel.append(line);
 }
 body.append(panel);
}
function appendWeaponConditions(body,calc,items,english){
 const active=items.map(row=>({row,
  bonus:root.PandoraConditionalItemBonuses?.activeFor?.(row)}))
  .filter(x=>x.bonus&&(x.bonus.phoenix||x.bonus.rows.length));
 const panel=make('details',{class:'stage-attribute-row stage-active-elemental'});
 panel.open=true;
 panel.append(make('summary',{text:(english?'Elemental weapon effects':
  'Эффекты стихийных оружий')}));
 if(!active.length)panel.append(make('p',{class:'stage-attribute-note',
  text:english?'No supported elemental weapon effect is active on the equipped weapon.':
   'На экипированном оружии нет активных подтверждённых стихийных эффектов.'}));
 for(const {row,bonus}of active){
  const rec=row.record||{},name=rec.name||'Оружие';
  panel.append(make('strong',{text:name+' · '+(english?'Fire +':'Огонь +')+
   row.refinement}));
  // An itemForth fire-magic entry is already listed in Attack/Elemental Magic.
  const alreadyShown=(calc?.elementalRefinement?.entries||[])
   .some(e=>e.itemId===rec.id&&e.grade===row.refinement);
  for(const effect of bonus.rows){
   if(alreadyShown&&effect.name==='Магическая атака огнём')continue;
   panel.append(make('p',{text:effect.name+': +'+effect.value+
    (effect.unit==='%'?'%':'')}));
  }
  if(bonus.phoenix){
   const outcome=root.PandoraConditionalItemBonuses.phoenixDamage(
    bonus.phoenix,row.refinement,calc?.stats);
   const format=v=>Number(v).toLocaleString(english?'en-US':'ru-RU',
    {maximumFractionDigits:2});
   panel.append(make('div',{class:'stage-skill-effect-row'},[
    make('span',{text:english?'Phoenix Flame · estimated damage':
     'Пламя феникса · расчётный урон'}),
    make('strong',{text:outcome?format(outcome.damage):'—'})
   ]));
   if(outcome)panel.append(make('small',{text:english?
    'Trigger chance '+format(outcome.chance)+'% · Cooldown '+
     format(outcome.cooldown)+' s':
    'Шанс срабатывания '+format(outcome.chance)+'% · Откат '+
     format(outcome.cooldown)+' с'}));
  }
 }
 body.append(panel);
}
// Distinguish reach from equipment and reach of an activated skill.
function appendSkillAttackRange(body,calc,english,options={}){
 const rows=calc?.skillAttackRange?.rows||[];
 if(!rows.length)return;
 const section=make('details',{class:'stage-attribute-row stage-skill-attack-range',
  'data-book-section':'skillRange'});
 const titleRu='Дальность при использовании умений';
 const titleEn='Range while using skills';
 const title=make('span',{text:english?titleEn:titleRu});
 section.append(make('summary',{},[title]));
 guideLabel(title,'attack.caption.skillRange',titleRu,titleEn,options);
 const helpRu='Здесь показаны расчётные прибавки отдельных умений, а не постоянная дальность атаки. Точная дальность при действии умения пока неизвестна.';
 const helpEn='These are estimated skill bonuses, not your permanent attack range. Actual range while the skill is active is not confirmed.';
 const help=make('p',{class:'stage-attribute-note',text:english?helpEn:helpRu});
 section.append(help);
 guideLabel(help,'attack.skillRangeHelp',helpRu,helpEn,options);
 const terms=options.gameTerms||{};
 for(const row of rows){
  const skill=terms.skills?.[String(row.id)],official=terms.englishSkills?.[String(row.id)];
  if(skill?.id!==row.id)continue;
  const label=gameSkillBadge(row.id,row.name,official?.n,terms,english,
   options.skillIconForId||(()=>null));
  const prefix=english?'Estimated range bonus: ':'Расчётная прибавка к дальности: ';
  const size=Number.isSafeInteger(row.sourceBonus)?
   '+'+row.sourceBonus:'—';
  const timing=english?(row.mode==='toggle'?'Only while toggled on':'Only when using this skill'):
   (row.mode==='toggle'?'Только при включённом умении':'Только при применении умения');
  const state=row.available?(english?'Requirements met':'Требования выполнены'):
   (english?row.reasonEn:row.reasonRu);
  section.append(make('div',{class:'stage-heal-row stage-skill-attack-range-row'+
   (row.available?'':' stage-book-unavailable'),'data-range-skill':String(row.id)},[
   make('strong',{},[label]),
   make('small',{text:prefix+size}),
   ...(Number.isSafeInteger(row.sourceConstant)&&
    Number.isSafeInteger(row.sourceMasteryPart)?[
    make('small',{text:english?
     'From skill: +'+row.sourceConstant+' · from '+
       gameBranchName('archery',terms,true)+' mastery: +'+row.sourceMasteryPart:
     'От умения: +'+row.sourceConstant+' · от мастерства «'+
       gameBranchName('archery',terms,false)+'»: +'+row.sourceMasteryPart})
   ]:[]),
   make('small',{text:timing+' · '+state})
  ]));
 }
 body.append(section);
}
function attackPage(body,calc,items,english,options={}){
 // A saved character setting. The help belongs to the actual word
 // “Верхом” instead of a paragraph permanently occupying Attack's height.
 const toggle=make('div',{class:'stage-book-check stage-mounted-toggle'},[
  make('input',{id:'stageBookMountedToggle',type:'checkbox',
   'data-book-setting':'mounted',checked:options.buffs?.mounted===true,
   onchange:event=>options.onBuff?.('mounted',event.target.checked)}),
  make('label',{for:'stageBookMountedToggle',class:'stage-mounted-label',
   tabindex:0,text:english?'Mounted':'Верхом'})
 ]);
 guideLabel(toggle.querySelector('.stage-mounted-label'),'attack.mountedToggle',
  'Верхом','Mounted',options);
 // Show the riding percentage with the on/off control in ONE compact row.
 // Reuse the original editable label/hint key rather than orphan D1 edits.
 const mountedStat=make('span',{class:'stage-mounted-stat','data-chapter-stat':'mountedRelease'});
 const mountedName=make('span',{class:'stage-mounted-stat-name',
  text:english?'Mounted attributes':'Характеристики верхом'});
 mountedStat.append(mountedName);
 guideLabel(mountedName,'attack.mountedRelease',
  'Характеристики верхом','Mounted attributes',options);
 const riding=calc?.mountedRelease?.known;
 const percent=Number.isFinite(riding)?
  new Intl.NumberFormat(english?'en-US':'ru-RU',{maximumFractionDigits:1}).format(riding)+'%':'—';
 mountedStat.append(make('strong',{class:'stage-mounted-percent',text:percent}));
 toggle.append(mountedStat);
 body.append(toggle);
 appendChapterGroups(body,attackChapterGroups(calc),english,
  'Нет подтверждённых дополнительных атакующих параметров.',
  'No supported additional attack metrics.',{...options,page:'attack'});
 appendSkillAttackRange(body,calc,english,options);
 appendWeaponConditions(body,calc,items,english);
 appendItemEvents(body,calc,english,'attack',options.gameTerms);
}
function defensePage(body,calc,english,options={}){
 appendChapterGroups(body,defenseChapterGroups(calc),english,
  'Нет подтверждённых дополнительных защитных параметров.',
  'No supported additional defense metrics.',{...options,page:'defense',
   statusSourceTraces:calc?.effects?.trace||[]});
 const conditional=calc?.battleMapCloaks?.entries||[];
 if(conditional.length){
  const panel=make('details',{class:'stage-attribute-row stage-battle-map-cloaks'});
  panel.append(make('summary',{text:(english?'Battle-map cloak effects':
   'Эффекты плащей на военных картах')+' · '+conditional.length}));
  for(const entry of conditional){
   const line=english?['All attributes +'+entry.all,'DEF +'+entry.armor,
    'HP +'+entry.hp]:['Все характеристики +'+entry.all,
     'Защита +'+entry.armor,'ОЗ +'+entry.hp];
   if(entry.resistance)line.push(english?
    'Damage-type resistance +'+entry.resistance:
    'Сопротивление типам урона +'+entry.resistance);
   if(entry.magic)line.push(english?
    'Magic resistance +'+entry.magic:
    'Сопротивление магии +'+entry.magic);
   panel.append(make('p',{text:entry.source+' · '+line.join(' · ')}));
  }
  body.append(panel);
 }
 if(calc?.racialEffects?.survival){
  const survival=calc.racialEffects.survival;
  body.append(make('section',{class:'stage-attribute-row stage-racial-survival'},[
   make('strong',{text:english?'Dwarven racial survival':
    'Расовая стойкость цверга'}),
   make('p',{text:(english?'Stronghearted: ':'Упрямое сердце: ')+
    survival.chance+(english?'% skill-source chance':'% шанс по данным навыка')})
  ]));
 }
 const exp=calc?.experienceBonus?.entries||[];
 // The chapter exists even without an equipped experience bonus. Otherwise
 // a new hero appears to have "lost" it until a qualifying item is equipped.
 const expPanel=make('details',{class:'stage-attribute-row stage-experience-effects'});
 expPanel.append(make('summary',{text:english?'Experience gain bonuses':
  'Бонусы к опыту'}));
 if(exp.length){
  for(const e of exp)expPanel.append(make('p',{text:e.source+': '+
   (e.percent>0?'+':'')+e.percent+'%'}));
 }else expPanel.append(make('p',{class:'stage-attribute-note',
  text:english?'No experience bonuses are currently active.':
   'Сейчас нет активных бонусов к опыту.'}));
 body.append(expPanel);
 appendItemEvents(body,calc,english,'defense',options.gameTerms);
}
// All chapters share the Summary disclosure affordance and remember user state.
function collapseBookSections(body,page){
 if(page==='summary'||typeof body.querySelectorAll!=='function')return;
 let index=0;
 for(const section of [...body.children].filter(node=>node.tagName==='SECTION')){
  const heading=section.querySelector(':scope > strong, :scope > .stage-chapter-heading');
  if(!heading)continue;
  const key=page+':'+(section.dataset.chapterGroup||section.dataset.bookSection||index++);
  const disclosure=make('details',{class:section.className+' stage-book-disclosure',
   'data-book-collapse':key});
  for(const attr of section.attributes)if(attr.name!=='class')
   disclosure.setAttribute(attr.name,attr.value);
  disclosure.open=expandedBookGroups.has(key)||
   (!collapsedBookGroups.has(key)&&bookSectionStartsOpen(page,section));
  const title=make('summary',{class:'stage-result-section-head'});
  title.append(make('span',{class:'stage-result-symbol',
   'aria-hidden':'true',text:'✦'}));
  if(heading.classList.contains('stage-chapter-heading')){
   while(heading.firstChild)title.append(heading.firstChild);
   heading.remove();
  }else title.append(heading);
  for(const actions of [...section.querySelectorAll(':scope > .stage-guide-actions')])
   title.append(actions);
  title.append(make('span',{class:'stage-result-chevron',
   'aria-hidden':'true',text:'⌄'}));
  while(section.firstChild)disclosure.append(section.firstChild);
  section.replaceWith(disclosure);
  disclosure.prepend(title);
  disclosure.addEventListener('toggle',()=>{
   if(disclosure.open){expandedBookGroups.add(key);collapsedBookGroups.delete(key)}
   else {expandedBookGroups.delete(key);collapsedBookGroups.add(key)}
  });
 }
 // Pre-existing <details> chapters must have the exact same heading as
 // sections above: left glyph, editable title, and chevron on the right.
 // Keep them as details (no nested disclosure, no duplicate headers).
 for(const detail of [...body.children].filter(node=>node.tagName==='DETAILS'&&
  !node.hasAttribute('data-book-collapse'))){
  const header=detail.querySelector(':scope > summary');
  if(!header)continue;
  const identifier=[...detail.classList].find(x=>x.startsWith('stage-')&&
   x!=='stage-attribute-row'&&x!=='stage-book-disclosure')||'section';
  const key=page+':detail:'+identifier;
  detail.classList.add('stage-book-disclosure');
  detail.dataset.bookCollapse=key;
  detail.dataset.bookDetail='true';
  detail.open=expandedBookDetails.has(key)||
   (!collapsedBookGroups.has(key)&&bookSectionStartsOpen(page,detail));
  const text=make('strong',{class:'stage-book-detail-title'});
  while(header.firstChild)text.append(header.firstChild);
  header.className='stage-result-section-head';
  header.append(make('span',{class:'stage-result-symbol',
   'aria-hidden':'true',text:'✦'}),text,make('span',{
    class:'stage-result-chevron','aria-hidden':'true',text:'⌄'}));
  detail.addEventListener('toggle',()=>{
   if(detail.open){expandedBookDetails.add(key);collapsedBookGroups.delete(key)}
   else {expandedBookDetails.delete(key);collapsedBookGroups.add(key)}
  });
 }

}
// Stable text identities: editing a caption never mutates the game skill or
// item catalog. Details retain their live record counts after localization.
const chapterCaptionSpecs=Object.freeze([
 ['effects','healing','.stage-healing-spells > strong','Лечащие умения','Healing skills'],
 ['effects','offense','.stage-attacking-skills > strong','Атакующие умения','Offensive skills'],
 ['effects','defense','.stage-defensive-skills > strong','Защитные умения','Defensive skills'],
 ['effects','periodic','.stage-periodic-recovery > summary','Восстановление каждые 2 секунды','Recovery every 2 seconds'],
 ['effects','songs','.stage-song-skills > summary','Песни для выбранного класса','Songs available to this class'],
 ['recovery','potions','.stage-potion-book > strong','Эффекты зелий','Potion effects'],
 ['recovery','enabled','.stage-potion-book .stage-book-check > span','Показывать восстановление от зелий','Show potion recovery'],
 ['recovery','mana','.stage-mana-consumables > strong','Предметы восстановления ОМ','MP recovery items'],
 ['recovery','health','.stage-health-consumables > summary','Предметы восстановления ОЗ','HP recovery items'],
 ['defense','experience','.stage-experience-effects > summary','Бонусы к опыту','Experience gain bonuses'],
 ['attack','elemental','.stage-active-elemental > summary','Эффекты стихийных оружий','Elemental weapon effects'],
 ['recovery','cures','.stage-status-cures > summary','Снятие состояний','Remove status effects'],
 ['recovery','skillItems','.stage-consumable-skills > summary','Предметы, активирующие умения','Items that activate skills']
]);
function decorateChapterCaptions(body,page,options){
 for(const [section,key,selector,ru,en] of chapterCaptionSpecs){
  if(page!==section)continue;
  const node=body.querySelector?.(selector);
  if(!node)continue;
  let label=node;
  if(node.tagName?.toLowerCase()==='summary'){
   const text=String(node.textContent||'');
   // Chapter headers never display record counts: quantities belong inside.
   // The original text is replaced with a D1-editable caption below.
   node.replaceChildren();
   label=make('span',{text:ru});
   node.append(label);

  }
  guideLabel(label,section+'.caption.'+key,ru,en,options);
 }
}
function render(target,{page,items=[],icon=()=>null,skillIconForId=()=>null,onPage=()=>{},onClose=()=>{},modifiers=null,
 buffs={},vitalsBuffs={},onBuff=()=>{},onVital=()=>{},honorTitles=[],availability={},
 combatSkillCards={},resistanceSkillChoices=[],remakedBuffRows=[],
 heroJobKey=null,heroLevel=1,heroMasteries={},heroBranchCaps={},
 heroWeaponKind='BARE_HAND',heroHasShield=false,
 itemById=()=>null,onItem=()=>{},gameTerms={},
 copy={},onTextEdit=null,canEdit=false,onHonor=()=>{}}={}){
 root.PandoraGuideTooltip?.dismiss();
 // Keep the same scrolling pane mounted on ordinary value changes: re-attaching
 // a newly animated pane used to reset scroll/focus and visibly flash the Book.
 const stablePanel=target.querySelector?.('.stage-book-page');
 const reusePanel=stablePanel?.dataset.bookVisible===page;
 if(reusePanel&&page==='summary')
  for(const node of stablePanel.querySelectorAll?.('details.stage-result-section')||[]){
   const index=Number(node.dataset.resultIndex);
   if(!Number.isInteger(index)||index<0||index>3)continue;
   if(node.open)collapsedSummaryGroups.delete(index);
   else collapsedSummaryGroups.add(index);
  }
 if(reusePanel&&page!=='summary')
  for(const group of stablePanel.querySelectorAll?.('details[data-book-collapse]')||[]){
   const key=group.dataset.bookCollapse;
   if(!key)continue;
   if(group.open){collapsedBookGroups.delete(key);
    if(group.dataset.bookDetail==='true')expandedBookDetails.add(key);
    else expandedBookGroups.add(key);
   }else {collapsedBookGroups.add(key);
    if(group.dataset.bookDetail==='true')expandedBookDetails.delete(key);
    else expandedBookGroups.delete(key);
   }
  }
 const storedScroll=reusePanel?stablePanel.scrollTop:0;
 if(reusePanel){
  for(const child of [...target.children])if(child!==stablePanel)child.remove();
 }else target.replaceChildren();
 const copyOptions={overrides:copy,editable:canEdit,onTextEdit,onHonor};
 const chapterTitle=(key,ru)=>{
  const en=bookEnglish[ru]||ru;
  const localized=root.PandoraHonorGuide?.field(copy,'chapter.'+key,ru,en);
  return document.documentElement?.lang==='en'?(localized?.en||en):(localized?.ru||ru);
 };
 const index=Math.max(0,bookPages.findIndex(([name])=>name===page));
 const chosen=bookPages[index][0],prior=bookPages[(index+bookPages.length-1)%bookPages.length][0],
  next=bookPages[(index+1)%bookPages.length][0];
 target.setAttribute('role','region');
 target.setAttribute('aria-label',document.documentElement?.lang==='en'?
  'Hero Book. '+chapterTitle(chosen,bookPages[index][1])+'. Chapter '+(index+1)+' of 6':
  'Книга героя. '+chapterTitle(chosen,bookPages[index][1])+'. Страница '+(index+1)+' из 6');
 const bookHeader=make('div',{class:'stage-attribute-head'},[
  make('button',{type:'button',class:'stage-book-arrow',text:'‹',
   onclick:()=>onPage(prior),'aria-label':document.documentElement?.lang==='en'?'Previous page':'Предыдущая страница'}),
  make('div',{class:'stage-book-heading'},[
   make('span',{text:(document.documentElement?.lang==='en'?'HERO BOOK':'КНИГА ГЕРОЯ')+' · '+(index+1)+' / 6'}),
   make('strong',{text:chapterTitle(chosen,bookPages[index][1])})]),
  make('button',{type:'button',class:'stage-book-arrow',text:'›',
   onclick:()=>onPage(next),'aria-label':document.documentElement?.lang==='en'?'Next page':'Следующая страница'}),
  make('button',{type:'button',text:'✕',class:'stage-book-close',onclick:onClose,
   'aria-label':document.documentElement?.lang==='en'?'Return to portrait':'Вернуть портрет'})
 ]);
 if(reusePanel)target.insertBefore(bookHeader,stablePanel);
 else target.append(bookHeader);
 const headingTitle=target.querySelector?.('.stage-book-heading strong');
 if(headingTitle)guideLabel(headingTitle,'chapter.'+chosen,
  bookPages[index][1],bookEnglish[bookPages[index][1]]||bookPages[index][1],
  copyOptions);
 const nav=make('nav',{class:'stage-attribute-tabs',role:'tablist','aria-label':document.documentElement?.lang==='en'?'Hero Book chapters':'Разделы книги героя'});
 for(const [name,label] of bookPages){
  const button=make('button',{
   type:'button',role:'tab',text:chapterTitle(name,label),id:'stageBookTab_'+name,
   'aria-controls':'stageBookPanel','aria-selected':String(chosen===name),
   'aria-pressed':String(chosen===name),'data-book-page':name,
   class:chosen===name?'chosen':'',
   onclick:event=>{
    if(event.target?.closest?.('.stage-book-tab-pencil,.wiki-inline-input'))return;
    onPage(name);
   }
  });
  if(canEdit&&typeof onTextEdit==='function'){
   const display=chapterTitle(name,label);
   const caption=make('span',{class:'stage-book-tab-copy',text:display});
   const pencil=make('button',{type:'button',class:'stage-book-tab-pencil',
    text:'✎','aria-label':document.documentElement?.lang==='en'?
     'Edit tab '+display:'Редактировать вкладку '+display});
   const edit=event=>{
    event.preventDefault();event.stopPropagation();
    onTextEdit(caption,'chapter.'+name,
     document.documentElement?.lang==='en'?'en':'ru',display);
   };
   caption.addEventListener('dblclick',edit);
   pencil.addEventListener('click',edit);
   // The tab remains the real game navigation action; editing is its sibling.
   // Role=presentation keeps the wrapper out of the tablist's logical tabs.
   button.replaceChildren(caption);
   const wrapper=make('span',{class:'stage-book-tab-owner',role:'presentation'});
   wrapper.append(button,pencil);
   nav.append(wrapper);
  }else nav.append(button);
 }
 if(reusePanel)target.insertBefore(nav,stablePanel);
 else target.append(nav);
 const body=make('div',{class:'stage-attribute-scroll stage-book-page',
  id:'stageBookPanel',role:'tabpanel','aria-labelledby':'stageBookTab_'+chosen,
  'data-book-visible':chosen});
 if(chosen==='summary')summaryPage(body,modifiers,copyOptions);
 if(chosen==='attack')attackPage(body,modifiers,items,document.documentElement?.lang==='en',
  {...copyOptions,buffs,onBuff,gameTerms,skillIconForId});
 if(chosen==='defense')defensePage(body,modifiers,document.documentElement?.lang==='en',
  {...copyOptions,buffs,gameTerms});
 if(chosen==='buffs')buffsPage(body,{buffs,vitalsBuffs,onBuff,onVital,
  honorTitles,availability,combatSkillCards,resistanceSkillChoices,modifiers,
  gameTerms,remakedBuffRows,skillIconForId,...copyOptions});
 if(chosen==='effects')skillEffectsPage(body,{modifiers,gameTerms,skillIconForId,
  remakedBuffRows,availability,combatSkillCards,heroJobKey,heroLevel,heroMasteries,
   heroBranchCaps,heroWeaponKind,heroHasShield});
 if(chosen==='recovery'){
  const english=document.documentElement?.lang==='en';
  const percent=modifiers?.potion?.percent;
  const potions=make('section',{class:'stage-attribute-row stage-potion-book'});
  potions.append(make('strong',{text:english?'Potion effects':'Эффекты зелий'}));
  potions.append(make('label',{class:'stage-book-check'},[
   make('input',{type:'checkbox','data-book-setting':'potionEffectsEnabled',
    checked:buffs.potionEffectsEnabled===true,
    onchange:event=>onBuff('potionEffectsEnabled',event.target.checked)}),
   make('span',{text:english?'Show potion recovery':'Показывать восстановление от зелий'})]));
  const known=root.PandoraOSCalculator?.potionPreview?.({
   enabled:buffs.potionEffectsEnabled===true,
   potionRate:percent??null,maxHp:modifiers?.hp??null
  })||[];
  const shown=known.filter(x=>x.current);
  for(const entry of shown){
   const item=entry.id==null?null:itemById(entry.id);
   const row=make(item?'button':'div',{class:'stage-potion-item',
    ...(item?{type:'button','aria-label':(english?'Open in encyclopedia: ':'Открыть в энциклопедии: ')+(item.name||entry.ru),
     onclick:()=>onItem(entry.id)}:{})});
   const label=make('span',{class:'stage-potion-name',text:item?.name||(english?(entry.en||entry.ru):(entry.ru||entry.en))||(english?'Potion':'Зелье')});
   if(item){
    const source=icon(item);
    if(source){
     const picture=make('img',{src:source,alt:'',loading:'lazy'});
     picture.onerror=()=>picture.remove();
     row.append(picture);
    }
   }
   row.append(label,make('strong',{text:entry.value==null?'—':
    String(entry.value)+(entry.enabled?(english?' HP':' ОЗ'):'')}));
   potions.append(row);
  }
  if(!shown.length)potions.append(make('p',{class:'muted',
   text:english?'No potion values are available yet.':'Для текущих зелий ещё нет доступных значений.'}));
  body.append(potions);
  const manaItems=modifiers?.consumableRecovery?.rows||[];
  if(manaItems.length){
   const mana=make('section',{class:'stage-attribute-row stage-mana-consumables'});
   mana.append(make('strong',{text:english?'MP recovery items':'Предметы восстановления ОМ'}));
   for(const entry of manaItems){
    const item=itemById(entry.id);
    const row=make(item?'button':'div',{class:'stage-potion-item',
     ...(item?{type:'button','aria-label':(english?'Open in encyclopedia: ':'Открыть в энциклопедии: ')+(item?.name||entry.name),
      onclick:()=>onItem(entry.id)}:{})});
    if(item){
     const src=icon(item);
     if(src){const picture=make('img',{src,alt:'',loading:'lazy'});
      picture.onerror=()=>picture.remove();row.append(picture);}
    }
    row.append(make('span',{class:'stage-potion-name',text:item?.name||entry.name}),
     make('strong',{text:(entry.hp>0?entry.hp+(english?' HP + ':' ОЗ + '):'')+entry.mp+(english?' MP':' ОМ')}));
    mana.append(row);
   }
   mana.append(make('p',{class:'stage-periodic-hint',
    text:english?'Effect on use. Potion effectiveness is not applied to MP.':'Эффект при использовании. Бонус эффективности зелий к ОМ не применён.'}));
   body.append(mana);
  }
  const lifeItems=modifiers?.consumableRecovery?.healthRows||[];
  if(lifeItems.length){
   const health=make('details',{class:'stage-attribute-row stage-health-consumables'});
   health.append(make('summary',{text:(english?'HP recovery items':'Предметы восстановления ОЗ')}));
   for(const entry of lifeItems){
    const item=itemById(entry.id);
    const row=make(item?'button':'div',{class:'stage-potion-item',
     ...(item?{type:'button','aria-label':(english?'Open in encyclopedia: ':'Открыть в энциклопедии: ')+(item?.name||entry.name),
      onclick:()=>onItem(entry.id)}:{})});
    if(item){
     const src=icon(item);
     if(src){const picture=make('img',{src,alt:'',loading:'lazy'});
      picture.onerror=()=>picture.remove();row.append(picture)}
    }
    row.append(make('span',{class:'stage-potion-name',text:item?.name||entry.name}),
     make('strong',{text:entry.hp+(english?' HP':' ОЗ')}));
    health.append(row);
   }
   body.append(health);
  }
 }
 if(chosen==='recovery'){
  const english=document.documentElement?.lang==='en';
  const cures=modifiers?.statusCures?.rows||[];
  if(cures.length){
   const panel=make('details',{class:'stage-attribute-row stage-status-cures'});
   panel.append(make('summary',{text:(english?'Remove status effects':'Снятие состояний')}));
   for(const entry of cures){
    const item=itemById(entry.id);
    const row=make(item?'button':'div',{class:'stage-potion-item',
     ...(item?{type:'button','aria-label':(english?'Open in encyclopedia: ':'Открыть в энциклопедии: ')+(item?.name||entry.name),
      onclick:()=>onItem(entry.id)}:{})});
    if(item){
     const source=icon(item);
     if(source){const picture=make('img',{src:source,alt:'',loading:'lazy'});
      picture.onerror=()=>picture.remove();row.append(picture);}
    }
    row.append(make('span',{class:'stage-potion-name',text:item?.name||entry.name}),
     make('strong',{text:(english?entry.conditionsEn:entry.conditions).join(', ')}));
    panel.append(row);
   }
   body.append(panel);
  }
  const consumableSkills=modifiers?.consumableSkills?.rows||[];
  if(consumableSkills.length){
   const section=make('details',{class:'stage-attribute-row stage-consumable-skills'});
   section.append(make('summary',{text:(english?
    'Items that activate skills':'Предметы, активирующие умения')}));
   for(const entry of consumableSkills){
    const item=itemById(entry.id);
    const displayName=item?.name||entry.name;
    // Navigation and skill previews must be independent keyboard targets.
    const row=make('div',{class:'stage-potion-item'});
    const itemLink=make(item?'button':'span',{
     class:'stage-potion-source',
     ...(item?{type:'button','aria-label':(english?'Open item: ':
      'Открыть предмет: ')+displayName,onclick:()=>onItem(entry.id)}:{})
    });
    if(item){
     const src=icon(item);
     if(src){const picture=make('img',{src,alt:'',loading:'lazy'});
      picture.onerror=()=>picture.remove();itemLink.append(picture);}
    }
    itemLink.append(make('span',{class:'stage-potion-name',text:displayName}));
    // Each activated skill has its own OS source tooltip. A single
    // concatenated string cannot reveal individual descriptions on hover.
    const skillNames=make('strong',{class:'stage-consumable-skill-names'});
    for(const [index,skill] of entry.skills.entries()){
     if(index)skillNames.append(make('span',{class:'stage-skill-separator',text:' · '}));
     const source=gameTerms.skills?.[String(skill.id)];
     const translated=gameTerms.englishSkills?.[String(skill.id)];
     const name=english?(translated?.n||source?.name||skill.name):
      (source?.name||skill.name);
     const badge=make('span',{class:'stage-consumable-skill-name',
      tabindex:0,'data-triggered-skill-id':skill.id,text:name});
     const description=english?(translated?.d||source?.desc):(source?.desc);
     if(!root.PandoraSkillPreview?.attach(badge,skill.id))
      root.PandoraGuideTooltip?.attach(badge,
       description|| (english?'No description in the game catalog.':
        'Описание умения пока отсутствует в игровом каталоге.'),
       {hoverDelay:450});
     skillNames.append(badge);
    }
    row.append(itemLink,skillNames);
    section.append(row);
   }
   body.append(section);
  }
 }
 decorateChapterCaptions(body,chosen,copyOptions);
 collapseBookSections(body,chosen);
 // Existing chapter tabs and guide labels already own a dedicated editor.
 // Suppress generic pencils there and on actionable game/item controls.
 for(const node of body.querySelectorAll?.('[data-book-editorial-key]')||[]){
  if(node.closest('[data-guide-key],.stage-guide-actions,.stage-book-tab-owner,button,[role="button"],.stage-potion-item,.stage-item-row,.stage-skill-card')||
   node.querySelector('button,input,select,[role="button"]')){
   node.removeAttribute('data-book-editorial-key');continue;
  }
  node.setAttribute('data-owner-copy-key',node.dataset.bookEditorialKey);
 }
 if(reusePanel){
  stablePanel.replaceChildren(...body.childNodes);
  stablePanel.scrollTop=storedScroll;
 }else target.append(body);
}
root.PandoraStageAttributes=Object.freeze({render,bookPages,bookText,bookEditorialKey,
 bookEditorialDefaults:bookEnglish,resetDisclosureState,
 summaryRows,attackChapterGroups,defenseChapterGroups,
 gameSkillName,gameBranchName,gameClassName});
})(typeof window==='undefined'?globalThis:window);
