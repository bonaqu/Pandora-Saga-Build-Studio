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
 'Все настройки применяются к текущему билду сразу. Числа обновляются в остальных главах книги.': "All settings immediately affect this build. Numbers update in other chapters.",
 'Недоступно для героя': "Unavailable to this hero",
 'Выключено': "Off",
 'ОЗ и ОМ': "HP & MP",
 'Гильдейское ОЗ': "Guild HP",
 'Гильдейское ОМ': "Guild MP",
 'Знак жизни': "Sign of Life",
 'Гильдия и честь': "Guild & honor",
 'Все характеристики': "All attributes",
 'Пробуждение': "Awakening",
 'Титул чести': "Honor title",
 'Боевые умения': "Combat skills",
 'Рывок': "Lunge",
 'Боевой клич': "War Cry",
 'Яростная атака': "Rage Attack",
 'Бастион (нужен щит)': "Bastion (shield required)",
 'Помощь ветра': "Wind Assist",
 'Благословение ветра': "Wind Blessing",
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
 'Священное оружие': 'Holy Weapon',
 'Темная аура': 'Dark Aura',
 'Чары усиления (магическая атака)': 'Enchant Enhancement (magic attack)',
 'Чары усиления (аура)': 'Enchant Enhancement (aura)',
 'Песнь поэта': "Minstrel's Song",
 'Песнь чар': "Sage's Song",
 'Скорость атаки': "Attack speed",
 'Получаемый физический урон': "Incoming physical damage",
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
 'Скорость естественного восстановления': 'Natural recovery speed',
 'Естественное восстановление (расчётная величина)': 'Estimated natural recovery',
 'Известные бонусы снаряжения и душ': 'Known equipment and Soul bonuses',
 'Сопротивления состояниям': 'Status resistances',
 'Восстановление каждые 2 секунды': 'Recovery every 2 seconds',
 'Лечащие умения': 'Healing skills',
 'Действие зелий': 'Potion effects',
 'Эффективность лечения': 'Healing effectiveness',
 'Пока недоступно': 'Not yet available',
 'Доступно при использовании умения': 'Available when using the skill'
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
 'Пассивное уклонение: ':'Passive evasion: ','Помощь ветра: ':'Wind Assist: ',
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
 ' · Блок ':' · Block ',' · Гнёзда ':' · Soul sockets ',
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
function bookText(value){
 if(typeof value!=='string'||document.documentElement?.lang!=='en')return value;
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
 for(const [key,value] of Object.entries(attrs)){
  if(key==='text')n.textContent=bookText(value);
  else if(key==='class')n.className=value;
  else if(key.startsWith('on'))n.addEventListener(key.slice(2),value);
  else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(key))
   n[key]=Boolean(value);
  else if(value!==null&&value!==undefined)n.setAttribute(key,bookText(String(value)));

 }
 for(const child of children)n.append(typeof child==='string'?document.createTextNode(bookText(child)):child);
 return n;
}

// One visual metadata owner per chapter field. D1 changes affect copy only,
// never IDs, numerical formulas, current equipment, or stored build settings.
function guideLabel(node,key,ru,en,options={},fallbackRu='',fallbackEn=''){
 if(!node)return node;
 const guide=root.PandoraHonorGuide;
 const info=key.startsWith('summary.')?
  guide?.summary(options.overrides||{},Number(key.slice(8)),ru,en):
  guide?.field(options.overrides||{},key,ru,en,fallbackRu,fallbackEn);
 const english=document.documentElement?.lang==='en';
 const label=english?(info?.en||en):(info?.ru||ru);
 const hint=english?info?.hintEn:info?.hintRu;
 node.textContent=label;
 if(hint)root.PandoraGuideTooltip?.attach(node,hint);
 node.setAttribute('data-guide-key',key);
 if(options.editable&&typeof options.onTextEdit==='function'){
  node.classList.add('stage-guide-editable');
  node.addEventListener('dblclick',event=>{
   event.stopPropagation();event.preventDefault();
   root.PandoraGuideTooltip?.dismiss();
   options.onTextEdit(node,key,english?'en':'ru',label);
  });
  const pencil=make('button',{type:'button',class:'stage-guide-edit-hint',
   text:'✎',title:english?'Edit tooltip':'Изменить подсказку',
   'aria-label':english?'Edit tooltip for '+label:'Изменить подсказку: '+label,
   onclick:event=>{
    event.stopPropagation();root.PandoraGuideTooltip?.dismiss();
    options.onTextEdit(node,key,english?'hintEn':'hintRu',hint||'');
   }});
  // Pencil is a separate control so editing a hint never changes a stat label.
  node.after(pencil);
 }
 return node;
}
const bookPages=Object.freeze([
 ['summary','Результаты расчёта'],['attack','Атака'],['defense','Защита'],
 ['buffs','Усиления'],['effects','Эффекты умений'],['recovery','Эффекты зелий']
]);
// Keep the source-backed Hero Book results in one ordered matrix.
// A missing calculator branch stays unknown (—), never a fabricated zero.
function summaryRows(calc){
 const c=calc?.combat||{},r=calc?.resistances||{},elements=r.elements||{};
 const num=value=>Number.isFinite(value)?value:null;
 const sum=(left,right)=>Number.isFinite(left)&&Number.isFinite(right)?
  left+right:null;
 const row=(ru,en,value,unit='')=>({ru,en,value:num(value),unit});
 return [
  {ru:'Жизнь и восстановление',en:'Vitals and recovery',page:'buffs',symbol:'✧',rows:[
   row('ОЗ','HP',calc?.hp),row('ОМ','MP',calc?.mp),
   row('Леч. зельями','Potion healing',calc?.potion?.percent,'%'),
   row('Леч. умениями','Skill healing',calc?.healingSkill?.percent,'%'),
   row('Расход ОМ','MP cost',c.manaCost?.remaining,'%')]},
  {ru:'Атака',en:'Attack',page:'attack',symbol:'⚔',rows:[
   row('АТК','ATK',c.attack?.known),
   row('АТК спереди','Front ATK',c.frontAttack,'%'),
   row('АТК сзади','Back ATK',sum(c.backAttack,c.backAttackEquipmentRate),'%'),
   row('МАТК','MATK',c.magicAttack?.known,'%'),
   row('Точность','Accuracy',c.accuracy?.known),
   row('Точн. спереди','Front accuracy',c.frontAccuracy?.known),
   row('Шанс крита','Critical chance',c.critical?.known,'%'),
   row('Крит. урон','Critical damage',c.criticalDamage,'%'),
   row('Дальн. АТК ближ. боя','Melee range (base)',calc?.attackRange?.baseMelee),
   row('Дальн. АТК дальн. боя','Ranged range (base)',calc?.attackRange?.baseRanged),
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
 body.append(make('div',{class:'stage-result-intro'},[
  make('strong',{text:en?'Calculated results':'Результаты расчёта'})
 ]));
 const format=new Intl.NumberFormat(en?'en-US':'ru-RU',{maximumFractionDigits:2});
 let summaryIndex=0;
 for(const group of summaryRows(calc)){
  const section=make('section',{class:'stage-result-section',
   'data-result-group':group.page});
  // Modern Set.Status has its own matrix; this is not a shortcut to
  // Attack/Defense, which display different Set.ATK/Set.RES fields.
  const heading=make('div',{class:'stage-result-section-head'},[
   make('span',{class:'stage-result-symbol','aria-hidden':'true',text:group.symbol}),
   make('strong',{text:en?group.en:group.ru})
  ]);
  guideLabel(heading.lastChild,'summary.group.'+group.page,group.ru,group.en,options);
  const grid=make('div',{class:'stage-result-grid'});
  for(const result of group.rows){
   const text=Number.isFinite(result.value)?format.format(result.value)+result.unit:'—';
   const tile=make('div',{class:'stage-result-tile'},[
    make('span',{text:en?result.en:result.ru}),
    make('strong',{text})
   ]);
   guideLabel(tile.firstChild,'summary.'+summaryIndex++,result.ru,result.en,options);
   grid.append(tile);
  }
  section.append(heading,grid);
  body.append(section);
 }
}
function buffsPage(body,options){
 const {buffs={},vitalsBuffs={},onBuff=()=>{},onVital=()=>{},honorTitles=[],
  availability={},combatSkillCards={},resistanceSkillChoices=[],modifiers}=options;
 const english=document.documentElement?.lang==='en';
 body.append(make('p',{class:'stage-attribute-note',text:
  'Все настройки применяются к текущему билду сразу. Числа обновляются в остальных главах книги.'}));
 // Count selected effects, never mastery input numbers or a disabled priest.
 const guildSelected=Number(buffs.guildLevel)>0;
 const selected=value=>value===true||
  (typeof value==='number'&&value>0)||
  (typeof value==='string'&&value!==''&&value!=='0');
 const selectedResistanceSkills=Array.isArray(buffs.resistanceSkillIds)?
  buffs.resistanceSkillIds.filter(id=>resistanceSkillChoices.some(s=>s.id===id)).length:0;
 const configured=Object.entries(buffs).filter(([key,value])=>{
  if(key==='proelium'||key==='resistanceSkillIds')return false;
  if(['priestSpi','priestBlessing','priestHymn','priestEnabled',
   'honorCuriosity','proeliumPotency'].includes(key))return false;
  if(key.startsWith('priest')&&buffs.priestEnabled!==true)return false;
  if(key==='priestGratia'&&!(Number(buffs.priestBlessing)>=8))return false;
  if(key==='priestLapisMedio'&&!(Number(buffs.priestBlessing)>=12))return false;
  if(key==='priestEncouragement'&&!(Number(buffs.priestBlessing)>=61))return false;
  if(guildSelected&&['guildLifeRecovery','guildManaRecovery'].includes(key))
   return false;
  return selected(value);
 }).length+Object.entries(vitalsBuffs).filter(([key,value])=>
  !(guildSelected&&['guildHp','guildMp'].includes(key))&&selected(value)).length+selectedResistanceSkills;
 const status=make('div',{class:'stage-buff-overview'},[
  make('span',{text:english?'Configured enhancements':'Выбранные усиления'}),
  make('strong',{text:String(configured)}),
  make('small',{text:english?'Saved with this character':'Сохраняются с этим героем'})
 ]);
 body.append(status);
 const section=(name)=>{
  const node=make('section',{class:'stage-book-buff-group'},[make('strong',{text:name})]);
  body.append(node);
  return node;
 };
 const select=(parent,name,key,levels,vital=false)=>{
  const field=make('label',{class:'stage-book-field'},[make('span',{text:name})]);
  const entry=make('select',{'aria-label':name,'data-book-setting':key,
   onchange:event=>(vital?onVital:onBuff)(key,event.target.value)});
  const selected=(vital?vitalsBuffs:buffs)[key]??0;
  for(const [value,label] of levels)entry.append(make('option',{value,selected:String(selected)===String(value),text:label}));
  entry.value=String(selected);field.append(entry);parent.append(field);
 };
 const toggle=(parent,name,key,vital=false,allowed=true,skill=null)=>{
  const selected=(vital?vitalsBuffs:buffs)[key]===true;
  const node=make('label',{class:'stage-book-check'+(skill?' stage-combat-buff':''),
   ...(skill?.desc?{title:skill.desc}:{})});
  const checkbox=make('input',{type:'checkbox','data-book-setting':key,
   checked:selected&&allowed,disabled:!allowed,
   onchange:event=>(vital?onVital:onBuff)(key,event.target.checked)});
  node.append(checkbox);
  if(skill?.icon){
   const img=make('img',{src:skill.icon,alt:'',loading:'lazy'});
   img.onerror=()=>img.remove();
   node.append(img);
  }
  const info=make('span',{class:'stage-combat-buff-copy',text:name});
  if(skill&&!allowed)
   info.append(make('small',{text:skill.reason||'Недоступно для героя'}));
  else if(skill?.summary)info.append(make('small',{text:skill.summary}));
  node.append(info);parent.append(node);
 };
 const opts=(units)=>units.map((n,i)=>[i,i===0?bookText('Выключено'):
  (document.documentElement?.lang==='en'?'Level ':'Уровень ')+i+' · +'+n]);
 const guildLevel=Number(buffs.guildLevel)||0;
 const guildPreview=root.PandoraOSCalculator?.guildPassiveAtLevel(guildLevel);
 const vitals=section('ОЗ и ОМ');
 if(!guildLevel){
  select(vitals,'Гильдейское ОЗ','guildHp',opts([0,'2%','4%','6%','9%','12%','15%']),true);
  select(vitals,'Гильдейское ОМ','guildMp',opts([0,'2%','4%','6%','9%','12%','15%']),true);
 }else vitals.append(make('p',{class:'stage-attribute-note',text:english?
  'HP and MP guild passives follow the selected guild level.':'Бонусы ОЗ и ОМ автоматически определяются уровнем гильдии.'}));
 toggle(vitals,'Знак жизни','lifeSign',true);
 const guild=section('Гильдия и честь');
 select(guild,english?'Guild level':'Уровень гильдии','guildLevel',
  Array.from({length:13},(_,i)=>[i,i===0?
   (english?'Manual guild buffs':'Ручной выбор усилений'):
   (english?'Guild level ':'Гильдия · уровень ')+i]));
 if(guildLevel&&guildPreview){
  const rate=[0,2,4,6,9,12,15][guildPreview.guildHp]||0;
  const lines=[
   (english?'HP and MP ':'ОЗ и ОМ ')+rate+'%',
   (english?'HP/MP recovery ':'Восстановление ОЗ/ОМ ')+
    ([0,5,8][guildPreview.guildLifeRecovery]||0)+'%',
   (english?'Incoming physical/magical damage −':'Получаемый физический/магический урон −')+
    guildPreview.physicalReduction+'%',
   (english?'Monster experience +':'Опыт с монстров +')+guildPreview.experience+'%'
  ];
  const preview=make('div',{class:'stage-guild-level-effects'});
  for(const line of lines)preview.append(make('span',{text:line}));
  guild.append(preview,make('p',{class:'stage-attribute-note',text:english?
   'HP, MP and recovery bonuses are applied. Other values are shown for reference.':
   'Учитываются бонусы ОЗ, ОМ и восстановления. Остальные значения — справочные.'}));
 }
 select(guild,'Все характеристики','guildAll',opts([0,1,2,3,4,5,6]));
 select(guild,'Пробуждение','guildArouse',opts([0,'2%','4%','6%']));
 select(guild,'Титул чести','honorTitle',honorTitles.map(x=>[x.id,english?x.en:x.ru]));
 const priest=section(english?'Priest buffs':'Усиления жреца');
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
 toggle(priest,english?'Velox · attack speed · Blessing 8':'Знак атаки · скорость атаки · Благословение 8','priestGratia',
  false,buffs.priestEnabled===true&&Number(buffs.priestBlessing)>=8);
 toggle(priest,english?'Lapis Medio · defense · Blessing 12':'Знак защиты · защита · Благословение 12','priestLapisMedio',
  false,buffs.priestEnabled===true&&Number(buffs.priestBlessing)>=12);
 toggle(priest,english?'Battle Prayer · STR, AGI, INT · Blessing 61':
  'Ободрение · СИЛ, ПРВ, ИНТ · Благословение 61','priestEncouragement',
  false,buffs.priestEnabled===true&&Number(buffs.priestBlessing)>=61);
 priest.append(make('p',{class:'stage-attribute-note',text:english?
  'Selected attack and defense signs and Battle Prayer affect the build; other values are previews.':
  'На билд влияют выбранные знаки атаки и защиты, а также Ободрение. Остальное — предварительный просмотр.'}));
 const skills=section('Боевые умения');
 for(const [key,label] of [['combatLunge','Рывок'],['combatWarCry','Боевой клич'],
  ['combatRage','Яростная атака'],['combatDefender','Бастион (нужен щит)'],
  ['combatWindAssist','Помощь ветра'],['combatWindBlessing','Благословение ветра'],
  ['combatConcentration','Сосредоточенность']])
  toggle(skills,label,key,false,availability[key]===true,combatSkillCards[key]);
 if(resistanceSkillChoices.length){
  const group=make('details',{class:'stage-legacy-buff-previews stage-resistance-skill-controls'});
  group.append(make('summary',{text:english?
   'Elemental resistance skills':'Усиления сопротивлений стихиям'}));
  group.append(make('p',{class:'stage-attribute-note',text:english?
   'Select only effects currently affecting this hero, including incoming enemy spells.':
   'Отмечай только эффекты, которые реально действуют на героя, включая наложенные вражеские умения.'}));
  const ru={fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
   charm:'Чары',light:'Свет',dark:'Тьма',magic:'Магия'};
  const en={fire:'Fire',ice:'Ice',lightning:'Lightning',poison:'Poison',
   charm:'Charm',light:'Light',dark:'Dark',magic:'Magic'};
  for(const skill of resistanceSkillChoices){
   const selected=Array.isArray(buffs.resistanceSkillIds)&&buffs.resistanceSkillIds.includes(skill.id);
   const effect=Object.entries(skill.effects).map(([type,value])=>
    (english?(en[type]||type):(ru[type]||type))+' '+(value>0?'+':'')+value).join(' · ');
   const row=make('label',{class:'stage-book-check stage-resistance-skill-row'});
   row.append(make('input',{type:'checkbox','data-book-setting':'resistSkill:'+skill.id,
    checked:selected,onchange:event=>onBuff('resistSkill:'+skill.id,event.target.checked)}));
   row.append(make('span',{class:'stage-combat-buff-copy'},[
    make('strong',{text:english?skill.nameEn:skill.name}),
    make('small',{text:(skill.incoming?(english?'Incoming skill · ':'Вражеский навык · '):
     (english?'Support skill · ':'Поддерживающий навык · '))+effect})
   ]));
   group.append(row);
  }
  skills.append(group);
 }
 const regen=section('Восстановление');
 if(!guildLevel){
  select(regen,'Гильдия: скорость ОЗ','guildLifeRecovery',opts([0,5,8]));
  select(regen,'Гильдия: скорость ОМ','guildManaRecovery',opts([0,5,8]));
 }
 select(regen,'Гильдейское лечение','guildHealing',opts([0,10,20,30]));
 if(modifiers?.legacyBuffs&&buffs.priestEnabled===true){
  const details=make('details',{class:'stage-legacy-buff-previews'});
  details.append(make('summary',{text:'Мощность поддерживающих навыков'}));
  const entries=[
   ['gratia','Знак атаки','Скорость атаки','+'],
   ['lapisMedio','Знак защиты','Защита','+'],
   ['encouragement','Ободрение','СИЛ, ПРВ, ИНТ','+','Battle Prayer'],
   ['groupBarrier','Божественная защита','Получаемый физический урон',''],
   ['holyWeapon','Священное оружие','Усиление','+'],
   ['gloomyEffect','Темная аура','Усиление','+'],
   ['enchantEnhance','Чары усиления (магическая атака)','Усиление','+'],
   ['enchantMagic','Чары усиления (аура)','Усиление','+'],
   ['minstrelSong','Песнь поэта','Точность и уклонение','+'],
   ['sageSong','Песнь чар','Усиление магии','+'],
   ['toxify','Яд','Сила эффекта','+','Toxify'],
   ['toxicAura','Усиление яда','Сила эффекта','+','Toxic Aura']
  ];
  const rows=make('div',{class:'stage-legacy-buff-grid'});
  for(const [id,label,kind,prefix,labelEn] of entries){
   const effect=modifiers.legacyBuffs[id];
   if(!effect||!Number.isFinite(effect.value))continue;
   const row=make('div',{class:'stage-legacy-buff-row'});
   row.append(make('span',{text:english&&labelEn?labelEn:label}),make('strong',{text:
    prefix+effect.value}));
   row.setAttribute('title',kind);
   rows.append(row);
  }
  details.append(rows);
  details.append(make('p',{class:'stage-legacy-buff-intro',text:
   'Мощность при применении навыка. Просмотр не включает усиление на персонаже.'}));
  priest.append(details);
 }

}

function renderSongSkills(body,modifiers){
 const english=document.documentElement?.lang==='en';
 const songRows=modifiers?.songSkills?.rows||[];
 if(songRows.length){
  const branchLabels=english?
   {benevolence:'Healing',hymn:'Hymns',blessing:'Blessing'}:
   {benevolence:'Исцеление',hymn:'Гимны',blessing:'Благословение'};
  const details=make('details',{class:'stage-legacy-buff-previews stage-song-skills'});
  details.append(make('summary',{text:english?'Songs available to this class':
   'Песни для выбранного класса'}));
  const rows=make('div',{class:'stage-song-skill-list'});
  for(const entry of songRows){
   const requirements=entry.requirements.map(req=>
    (branchLabels[req.branch]||req.branch)+' '+req.amount).join(' · ');
   const card=make('div',{class:'stage-song-skill-row'});
   card.append(make('strong',{text:english?entry.nameEn:entry.name}),
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
function skillEffectsPage(body,{modifiers=null}={}){
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
    make('span',{text:en?(row.nameEn||row.name):row.name}),
    make('strong',{text:amount}),
    make('small',{text:available?(en?'Available':'Доступно'):
     (en?'Preview · '+(row.requiresEn||row.requires||'Requirements not met'):
      'Предпросмотр · '+(row.requires||'Требования не выполнены'))})
   ]));
  }
  group.append(make('p',{class:'stage-attribute-note',text:en?
   'Skill previews based on Remaked; live OS requirements and damage packets can differ.':
   'Просмотр отдельных умений по Remaked; игровые условия OS и расчёт урона могут отличаться.'}));
  body.append(group);
 }
 const periodic=modifiers?.periodicRecovery?.rows||[];
 if(periodic.length){
  const skillNamesEn={310002001:'Regenerate',310022001:'Restoration',330005001:'Mana Restore'};
  const details=make('details',{class:'stage-attribute-row stage-periodic-recovery'});
  details.append(make('summary',{text:en?'Recovery every 2 seconds':
   'Восстановление каждые 2 секунды'}));
  for(const entry of periodic){
   if(!Number.isFinite(entry?.amount))continue;
   details.append(make('div',{class:'stage-periodic-row'},[
    make('span',{text:en?(skillNamesEn[entry.id]||entry.name):entry.name}),
    make('strong',{text:'≈ '+entry.amount+' '+(entry.kind==='hp'?
     (en?'HP':'ОЗ'):(en?'MP':'ОМ'))}),
    make('small',{text:entry.available?(en?'Available when using the skill':
     'Доступно при использовании умения'):
     entry.required>0?(en?'Requires healing mastery '+entry.required:
      'Для изучения нужно мастерство '+entry.required):
      (en?'Not yet available':'Пока недоступно')})
   ]));
  }
  details.append(make('p',{class:'stage-periodic-hint',text:en?
   'Estimated action of the skill, not permanent natural recovery.':
   'Ориентировочное действие навыка, не постоянное восстановление героя.'}));
  body.append(details);
 }
 renderSongSkills(body,modifiers);
 if(!spells.length&&!periodic.length&&!(modifiers?.songSkills?.rows||[]).length)
  body.append(make('p',{class:'stage-attribute-note',text:en?
   'Calculated skill effects appear here when game records and requirements are available.':
   'Здесь появятся эффекты навыков, для которых доступны игровые данные и расчёт.'}));
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
 // Legacy ATK Status_21 (weapon physical bonus), NOT Status_18 (total ATK).
 put(0,'weaponPhysical','Физический урон оружия','Physical weapon damage',
  combat.weaponPhysical,'',true);
 const racial=combat.racialWeapon;
 if(racial?.matchesCategory===true&&
  typeof racial.ru==='string'&&typeof racial.en==='string'&&
  Number.isSafeInteger(racial.id)){
  put(0,'racialWeaponFlat:'+racial.id,racial.ru+' · урон (ед.)',
   racial.en+' · damage (flat)',racial.flat);
  put(0,'racialWeaponRate:'+racial.id,racial.ru+' · урон (%)',
   racial.en+' · damage (%)',racial.percent,'%');
 }
 if(Number.isFinite(range.racialGeneral)&&range.racialGeneral===range.racialCarry)
  put(0,'racialRange','Зоркость · дальность','Sharpsight · range',
   range.racialGeneral);
 if(Array.isArray(range.entries))range.entries.forEach((entry,i)=>{
  if(!entry||!['general','bow'].includes(entry.kind)||
   typeof entry.source!=='string'||!entry.source.trim())return;
  put(0,'gearRange:'+i,
   (entry.kind==='bow'?'Дальность стрельбы':'Дальность атаки')+' · '+entry.source,
   (entry.kind==='bow'?'Bow range':'Attack range')+' · '+entry.source,entry.amount);
 });
 put(0,'mountedRelease','Раскрытие характеристик верхом','Mounted attribute release',
  calc.mountedRelease?.known,'%');
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
  {key:'recovery',ru:'Естественное восстановление',
   en:'Natural recovery',rows:[]},
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
  'HP recovery speed',r?.hp?.total,'',true);
 put(0,'mpRecoverySpeed','Скорость восстановления ОМ',
  'MP recovery speed',r?.mp?.total,'',true);
 const statuses={
  burn:['Ожоги','Burn'],stun:['Оглушение','Stun'],
  numb:['Заморозка','Freeze'],tumble:['Падение','Knockdown'],
  knockback:['Отбрасывание','Knockback'],sleep:['Сон','Sleep'],
  silence:['Немота','Silence'],evil:['Зло','Evil'],
  curse:['Проклятие','Curse'],disease:['Болезнь','Disease'],
  madness:['Помешательство','Madness'],blockBreak:['Пробитие блока','Block break']
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
function appendChapterGroups(body,groups,english,emptyRu,emptyEn,options={}){
 if(!groups.length){body.append(make('p',{class:'stage-attribute-note',
  text:english?emptyEn:emptyRu}));return;}
 const number=new Intl.NumberFormat(english?'en-US':'ru-RU',
  {maximumFractionDigits:2});
 for(const group of groups){
  const section=make('section',{class:'stage-attribute-row stage-chapter-group',
   'data-chapter-group':group.key});
  const title=make('strong',{text:english?group.en:group.ru});
  section.append(title);
  guideLabel(title,(options.page||'attack')+'.group.'+group.key,group.ru,group.en,options);
  const grid=make('div',{class:'stage-chapter-grid'});
  for(const row of group.rows){
   const entry=make('div',{class:'stage-chapter-entry','data-chapter-stat':row.key},[
    make('span',{text:english?row.en:row.ru}),
    make('strong',{text:number.format(row.value)+row.unit})
   ]);
   guideLabel(entry.firstChild,(options.page||'attack')+'.'+row.key,
    row.ru,row.en,options);
   grid.append(entry);
  }
  section.append(grid);body.append(section);
 }
}
function appendItemEvents(body,calc,english,kind){
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
  rows.push({source:entry.source,
   ru:(entry.trigger||'Срабатывание')+' · '+entry.skillName+tail,
   en:(entry.triggerEn||entry.trigger||'Trigger')+' · '+
    (entry.skillNameEn||entry.skillName)+tail});
 }
 if(!rows.length)return;
 const panel=make('details',{class:'stage-attribute-row stage-source-events'});
 panel.append(make('summary',{text:(english?'Item and Soul triggers':
  'Срабатывания предметов и душ')+' · '+rows.length}));
 for(const row of rows)panel.append(make('p',{text:
  row.source+' · '+(english?row.en:row.ru)}));
 body.append(panel);
}
function appendWeaponConditions(body,calc,items,english){
 const active=items.map(row=>({row,
  bonus:root.PandoraConditionalItemBonuses?.activeFor?.(row)}))
  .filter(x=>x.bonus&&(x.bonus.phoenix||x.bonus.rows.length));
 if(!active.length)return;
 const panel=make('details',{class:'stage-attribute-row stage-active-elemental'});
 panel.append(make('summary',{text:(english?'Conditional elemental weapons':
  'Условные эффекты стихийного оружия')+' · '+active.length}));
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
function attackPage(body,calc,items,english,options={}){
 appendChapterGroups(body,attackChapterGroups(calc),english,
  'Нет подтверждённых дополнительных атакующих параметров.',
  'No supported additional attack metrics.',{...options,page:'attack'});
 appendWeaponConditions(body,calc,items,english);
 appendItemEvents(body,calc,english,'attack');
}
function defensePage(body,calc,english,options={}){
 appendChapterGroups(body,defenseChapterGroups(calc),english,
  'Нет подтверждённых дополнительных защитных параметров.',
  'No supported additional defense metrics.',{...options,page:'defense'});
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
    'Расовая стойкость дворфа'}),
   make('p',{text:(english?'Stronghearted: ':'Упрямое сердце: ')+
    survival.chance+(english?'% skill-source chance':'% шанс по данным навыка')})
  ]));
 }
 const exp=calc?.experienceBonus?.entries||[];
 if(exp.length){
  const panel=make('details',{class:'stage-attribute-row stage-experience-effects'});
  panel.append(make('summary',{text:(english?'Experience gain bonuses':
   'Бонусы к опыту')+' · '+exp.length}));
  for(const e of exp)panel.append(make('p',{text:e.source+': '+
   (e.percent>0?'+':'')+e.percent+'%'}));
  body.append(panel);
 }
 appendItemEvents(body,calc,english,'defense');
}
function render(target,{page,items=[],icon=()=>null,onPage=()=>{},onClose=()=>{},modifiers=null,
 buffs={},vitalsBuffs={},onBuff=()=>{},onVital=()=>{},honorTitles=[],availability={},
 combatSkillCards={},resistanceSkillChoices=[],itemById=()=>null,onItem=()=>{}}={}){
 target.replaceChildren();
 const index=Math.max(0,bookPages.findIndex(([name])=>name===page));
 const chosen=bookPages[index][0],prior=bookPages[(index+bookPages.length-1)%bookPages.length][0],
  next=bookPages[(index+1)%bookPages.length][0];
 target.setAttribute('role','region');
 target.setAttribute('aria-label',document.documentElement?.lang==='en'?
  'Hero Book. '+bookText(bookPages[index][1])+'. Chapter '+(index+1)+' of 6':
  'Книга героя. '+bookPages[index][1]+'. Страница '+(index+1)+' из 6');
 target.append(make('div',{class:'stage-attribute-head'},[
  make('button',{type:'button',class:'stage-book-arrow',text:'‹',
   onclick:()=>onPage(prior),'aria-label':'Предыдущая страница'}),
  make('div',{class:'stage-book-heading'},[
   make('span',{text:(document.documentElement?.lang==='en'?'HERO BOOK':'КНИГА ГЕРОЯ')+' · '+(index+1)+' / 6'}),
   make('strong',{text:bookPages[index][1]})]),
  make('button',{type:'button',class:'stage-book-arrow',text:'›',
   onclick:()=>onPage(next),'aria-label':'Следующая страница'}),
  make('button',{type:'button',text:'✕',class:'stage-book-close',onclick:onClose,
   'aria-label':'Вернуть портрет'})
 ]));
 const nav=make('nav',{class:'stage-attribute-tabs',role:'tablist','aria-label':'Разделы книги героя'});
 for(const [name,label] of bookPages)nav.append(make('button',{
  type:'button',role:'tab',text:label,id:'stageBookTab_'+name,
  'aria-controls':'stageBookPanel','aria-selected':String(chosen===name),
  'aria-pressed':String(chosen===name),'data-book-page':name,
  class:chosen===name?'chosen':'',onclick:()=>onPage(name)
 }));
 target.append(nav);
 const body=make('div',{class:'stage-attribute-scroll stage-book-page',
  id:'stageBookPanel',role:'tabpanel','aria-labelledby':'stageBookTab_'+chosen,
  'data-book-visible':chosen});
 if(chosen==='summary')summaryPage(body,modifiers);
 if(chosen==='attack')attackPage(body,modifiers,items,document.documentElement?.lang==='en');
 if(chosen==='defense')defensePage(body,modifiers,document.documentElement?.lang==='en');
 if(chosen==='buffs')buffsPage(body,{buffs,vitalsBuffs,onBuff,onVital,
  honorTitles,availability,combatSkillCards,resistanceSkillChoices,modifiers});
 if(chosen==='effects')skillEffectsPage(body,{modifiers});
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
   health.append(make('summary',{text:(english?'HP recovery items':'Предметы восстановления ОЗ')+' · '+lifeItems.length}));
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
   panel.append(make('summary',{text:(english?'Remove status effects':'Снятие состояний')+' · '+cures.length+(english?' items':' предметов')}));
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
    'Items that activate skills':'Предметы, активирующие умения')+
    ' · '+consumableSkills.length}));
   for(const entry of consumableSkills){
    const item=itemById(entry.id);
    const displayName=item?.name||entry.name;
    const row=make(item?'button':'div',{class:'stage-potion-item',
     ...(item?{type:'button','aria-label':(english?'Open item: ':
      'Открыть предмет: ')+displayName,onclick:()=>onItem(entry.id)}:{})});
    if(item){
     const src=icon(item);
     if(src){const picture=make('img',{src,alt:'',loading:'lazy'});
      picture.onerror=()=>picture.remove();row.append(picture);}
    }
    row.append(make('span',{class:'stage-potion-name',text:displayName}),
     make('strong',{text:entry.skills.map(skill=>skill.name).join(' · ')}));
    section.append(row);
   }
   body.append(section);
  }
 }
 target.append(body);
}
root.PandoraStageAttributes=Object.freeze({render,bookPages,bookText,summaryRows,attackChapterGroups,defenseChapterGroups});
})(typeof window==='undefined'?globalThis:window);
