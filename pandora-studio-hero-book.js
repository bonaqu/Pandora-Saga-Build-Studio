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

function summaryPage(body,calc,onPage){
 if(!calc){body.append(make('p',{class:'stage-attribute-note',
  text:document.documentElement?.lang==='en'?'Stats appear after game data loads.':'Параметры появятся после загрузки игровых данных.'}));return}
 const english=document.documentElement?.lang==='en';
 body.append(make('div',{class:'stage-result-intro'},[
  make('strong',{text:english?'Calculated results':'Результаты расчёта'})
 ]));
 const numberFormat=new Intl.NumberFormat(english?'en-US':'ru-RU',{maximumFractionDigits:2});
 for(const group of summaryRows(calc)){
  const section=make('section',{class:'stage-result-section'});
  const title=english?group.en:group.ru;
  const heading=make('button',{type:'button',class:'stage-result-section-head',
   'aria-label':english?'Open '+title:'Открыть: '+title,
   onclick:()=>onPage(group.page)},[
   make('span',{class:'stage-result-symbol','aria-hidden':'true',text:group.symbol}),
   make('strong',{text:title}),
   make('span',{class:'stage-result-open','aria-hidden':'true',text:'›'})
  ]);
  const grid=make('div',{class:'stage-result-grid'});
  for(const result of group.rows){
   const value=Number.isFinite(result.value)?
    numberFormat.format(result.value)+result.unit:'—';
   grid.append(make('div',{class:'stage-result-tile'},[
    make('span',{text:english?result.en:result.ru}),
    make('strong',{text:value})
   ]));
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
 toggle(regen,'Показывать действие зелий','potionEffectsEnabled');
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

 if(modifiers)body.append(make('p',{class:'stage-attribute-note',text:
  'Сейчас: '+modifiers.hp+' ОЗ, '+modifiers.mp+' ОМ. Усиления сохраняются в билде.'}));
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
function skillEffectsPage(body,{buffs={},availability={},combatSkillCards={},resistanceSkillChoices=[],modifiers=null}={}){
 const en=document.documentElement?.lang==='en';
 const card=make('section',{class:'stage-attribute-row stage-skill-effects'});
 card.append(make('strong',{text:en?'Applied skill effects':'Применённые эффекты умений'}));
 for(const key of ['combatLunge','combatWarCry','combatRage','combatDefender',
  'combatWindAssist','combatWindBlessing','combatConcentration']){
  if(buffs[key]!==true||availability[key]!==true)continue;
  const skill=combatSkillCards[key];if(!skill)continue;
  const row=make('div',{class:'stage-skill-effect-row'});
  if(skill.icon){const img=make('img',{src:skill.icon,alt:'',loading:'lazy'});
   img.onerror=()=>img.remove();row.append(img)}
  row.append(make('span',{text:skill.name}),
   make('strong',{text:skill.summary||(en?'Active':'Активно')}));
  card.append(row);
 }
 if(buffs.priestEnabled===true)for(const [key,mastery,name,enName,amount] of [
  ['priestGratia',8,'Знак атаки','Velox',modifiers?.combat?.attackSpeed?.priestBonus],
  ['priestLapisMedio',12,'Знак защиты','Lapis Medio',modifiers?.combat?.defense?.priestBonus]
 ]){
  if(buffs[key]!==true||Number(buffs.priestBlessing)<mastery||
   !Number.isFinite(amount)||amount<=0)continue;
  card.append(make('div',{class:'stage-skill-effect-row'},[
   make('span',{text:en?enName:name}),make('strong',{text:'+'+amount})
  ]));
 }
 if(card.children.length===1)card.append(make('p',{class:'stage-attribute-note',text:en?
  'Select active buffs in the Buffs tab.':'Выбери активные усиления на вкладке «Усиления».'}));
 if(buffs.priestEnabled===true&&buffs.priestEncouragement===true&&
  Number(buffs.priestBlessing)>=61){
  const value=modifiers?.attributeBuffs?.trace?.find(x=>
   x.source==='Ободрение / Remaked Skill[0][14][9]')?.amount;
  if(Number.isFinite(value)&&value>0)card.append(make('div',{class:'stage-skill-effect-row'},[
   make('span',{text:en?'Battle Prayer':'Ободрение'}),
   make('strong',{text:'+'+value+' '+(en?'STR / AGI / INT':'СИЛ / ПРВ / ИНТ')})
  ]));
 }
 for(const skill of modifiers?.resistanceSkills?.rows||[]){
  const source=resistanceSkillChoices.find(entry=>entry.id===skill.id);
  const selectedName=en?(source?.nameEn||skill.name):skill.name;
  const summary=Object.entries(skill.effects).map(([key,value])=>
   key+' '+(value>0?'+':'')+value).join(' · ');
  card.append(make('div',{class:'stage-skill-effect-row'},[
   make('span',{text:selectedName}),make('strong',{text:summary})
  ]));
 }
 body.prepend(card);
 renderSongSkills(body,modifiers);
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
 if(chosen==='summary')summaryPage(body,modifiers,onPage);
 if(chosen==='effects')skillEffectsPage(body,{buffs,availability,combatSkillCards,resistanceSkillChoices,modifiers});
 if(chosen==='buffs')buffsPage(body,{buffs,vitalsBuffs,onBuff,onVital,honorTitles,availability,combatSkillCards,resistanceSkillChoices,modifiers});
 if(['attack','defense'].includes(chosen)){
  const intro=chosen==='attack'?'Параметры оружия':'Защита снаряжения';
  body.append(make('p',{class:'stage-attribute-note',text:intro}));
 }
 const selected=['attack','defense'].includes(chosen)?
  items.filter(x=>chosen==='attack'?x.record?.slot==='weapon':
   x.record&&(x.record.AC!=null||x.record.block!=null)):[];
 if(!selected.length&&['attack','defense'].includes(chosen))
  body.append(make('p',{class:'muted',text:'Нет записей для этой вкладки'}));
 for(const row of selected){
  const rec=row.record,card=make('section',{class:'stage-attribute-row'});
  const top=make('div',{class:'stage-attribute-identity'});
  const src=icon(rec);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));top.append(img)}
  top.append(make('b',{text:root.PandoraItemPresentation?.displayName(rec,'Предмет без названия')||'Предмет без названия'}));
  card.append(top);
  if(row.issue?.length)card.append(make('p',{class:'stage-item-unavailable',
   text:'Не действует: '+row.issue.join(' · ')}));
  if(page==='attack'){
   card.append(make('p',{text:'Базовая атака '+(rec.W??'—')+' · Дальность '+(rec.range??'—')+
    ' · Скорость '+(rec.atkspeed??'—')+' · +'+row.refinement}));
  }else if(page==='defense'){
   card.append(make('p',{text:'Базовая защита '+(rec.AC??'—')+' · Блок '+(rec.block??'—')+
    ' · Гнёзда '+(rec.soulslot??'—')+' · +'+row.refinement}));
  }body.append(card);
 }
 if(page==='effects'&&modifiers?.racialEffects?.survival){
  const survival=modifiers.racialEffects.survival;
  const english=document.documentElement?.lang==='en';
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:english?'Dwarven racial survival':'Расовая стойкость дворфа'}),
   make('p',{text:(english?'Stronghearted: ':'Упрямое сердце: ')+
    survival.chance+(english?'% chance in the source skill':'% шанс по данным навыка')}),
   make('p',{class:'stage-attribute-note',text:english?
    'A conditional effect, not permanent HP, armor or guaranteed survival. The live combat trigger has not been independently verified.':
    'Это условный эффект, не постоянные ОЗ, броня или гарантированное спасение. Точный триггер в игровом бою отдельно не подтверждён.'}));
  body.prepend(card);
 }
 if(page==='effects'){
  const english=document.documentElement?.lang==='en';
  if(modifiers?.battleMapCloaks?.entries?.length){
   const section=make('section',{class:'stage-attribute-row'});
   section.append(make('strong',{text:english?
    'Battle-map-only cloak bonuses':'Бонусы плаща на военных картах'}));
   for(const row of modifiers.battleMapCloaks.entries){
    const parts=english?[
     'All attributes +'+row.all,'Defense +'+row.armor,'HP +'+row.hp
    ]:[
     'Все характеристики +'+row.all,'Защита +'+row.armor,'ОЗ +'+row.hp
    ];
    if(row.resistance){
     parts.push(english?'All damage-type resistance +'+row.resistance:
      'Сопротивление всем видам урона +'+row.resistance);
     parts.push(english?'Magic resistance +'+row.magic:
      'Сопротивление магии +'+row.magic);
    }
    section.append(make('p',{text:row.source+' · '+parts.join(' · ')}));
   }
   body.prepend(section);
  }
  if(modifiers?.specialEquipment?.entries?.length){
   const section=make('section',{class:'stage-attribute-row'});
   section.append(make('strong',{text:english?'Special item and Soul effects':
    'Особые эффекты предметов и душ'}));
   for(const effect of modifiers.specialEquipment.entries)
    section.append(make('p',{text:effect.source+' · '+(english?effect.en:effect.ru)}));
   body.prepend(section);
  }
  if(modifiers?.experienceBonus?.entries?.length){
   const section=make('section',{class:'stage-attribute-row'});
   section.append(make('strong',{text:english?'Experience gain bonus':'Бонус к получаемому опыту'}));
   for(const effect of modifiers.experienceBonus.entries)
    section.append(make('p',{text:effect.source+' · '+
     (effect.percent>=0?'+':'')+effect.percent+
     (english?'% experience':'% опыта')}));
   body.prepend(section);
  }
  if(modifiers?.procPreview?.entries?.length){
   const section=make('section',{class:'stage-attribute-row'});
   section.append(make('strong',{text:english?'Item and Soul triggers':'Срабатывания предметов и душ'}));
   for(const proc of modifiers.procPreview.entries)
    section.append(make('p',{text:(english?(proc.triggerEn||proc.trigger):proc.trigger)+
     ': '+(english?(proc.skillNameEn||proc.skillName):proc.skillName)+
     (proc.chance===null?'':' · '+proc.chance+'%')+' · '+proc.source}));
   body.prepend(section);
  }
  if(modifiers?.unison?.active?.length){
   const labels=english?{
    EP_MAXMANA_CONST:'Max MP',EP_MAXLIFE_CONST:'Max HP',
    EP_ARMORCLASS_CONST:'Defense',
    EP_CASTINGCANCEL_RESISTANCE_CONST:'Cast interruption resistance',
    EP_SKILL_BENCH:'Skill cooldown',
    EP_VITARITY_CONST:'Vitality',
    EP_ATTACK_BACKATK_RATE:'Back attack'
   }:{
    EP_MAXMANA_CONST:'Максимум ОМ',EP_MAXLIFE_CONST:'Максимум ОЗ',
    EP_ARMORCLASS_CONST:'Защита',
    EP_CASTINGCANCEL_RESISTANCE_CONST:'Сопротивление прерыванию',
    EP_SKILL_BENCH:'Перезарядка умений',
    EP_VITARITY_CONST:'Выносливость',
    EP_ATTACK_BACKATK_RATE:'Атака со спины'
   };
   const percentages=new Set(['EP_CASTINGCANCEL_RESISTANCE_CONST',
    'EP_SKILL_BENCH','EP_ATTACK_BACKATK_RATE']);
   const section=make('section',{class:'stage-attribute-row'});
   section.append(make('strong',{text:english?'Active equipment sets':'Активные комплекты'}));
   for(const set of modifiers.unison.active){
    section.append(make('p',{text:set.name+' · '+set.companionCount+
     '/'+set.required+(english?' pieces · enhancement +':' частей · заточка +')+set.grade}));
    for(const effect of set.effects)
     section.append(make('p',{text:(labels[effect.func]||(english?'Set bonus':'Эффект комплекта'))+
      ': '+(effect.a>=0?'+':'')+effect.a+
      (percentages.has(effect.func)?'%':'')}));
    for(const condition of set.conditions)section.append(make('p',{text:
     english&&condition.func==='EP_PROTECTION_TUMBLE'?'Fall protection':condition.label}));
   }
   body.prepend(section);
  }
  if(modifiers?.coverage?.total&&root.PandoraStudioAdminActive?.()){
   const coverage=modifiers.coverage,card=make('section',{class:'stage-attribute-row stage-coverage'});
   const k=coverage.counts;
   card.append(make('strong',{text:'Проверка учёта бонусов предметов'}),
    make('p',{text:'Рассчитано: '+k.calculated+' · Отдельно показано: '+
     k.preview+' · Условные проки: '+k.conditional+
     ' · Ещё не поддержано: '+k.missing}),
    make('p',{text:'Неактивны из-за заточки: '+k.inactive}));
   const open=k.conditional+k.missing;
   if(open){
    const details=make('details',{class:'stage-coverage-list'},[
     make('summary',{text:'Что осталось вне итоговых чисел ('+open+')'})
    ]);
    for(const item of coverage.pending.slice(0,12))
     details.append(make('p',{text:'✦ '+item.item+' — '+item.reason}));
    if(coverage.pending.length>12)
     details.append(make('p',{text:'Другие записи: '+(coverage.pending.length-12)}));
    card.append(details);
   }
   card.append(make('p',{class:'stage-attribute-note',text:
    'Условные проки не имеют фиксированной прибавки к атаке или защите. Таблица показывает реальное покрытие структурированных эффектов текущего билда.'}));
   body.prepend(card);
  }
  if(modifiers?.gemstones&&(modifiers.gemstones.items.length||modifiers.gemstones.uncertain.length)){
   const gem=modifiers.gemstones,card=make('section',{class:'stage-attribute-row'});
   card.append(make('strong',{text:'Самоцветы'}));
   const labels=english?
    {fire:'Fire',ice:'Ice',lightning:'Lightning',poison:'Poison',
     light:'Light',dark:'Dark',charm:'Arcane'}:
    {fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
     light:'Свет',dark:'Тьма',charm:'Чары'};
   const show=(title,values,suffix='')=>{
    for(const [key,value] of Object.entries(values||{}))
     card.append(make('p',{text:title+' · '+(labels[key]||key)+': +'+value+suffix}));
   };
   show(english?'Weapon aura base':'Основа ауры оружия',gem.auras);
   const totalAura=modifiers?.auraDamage?.elements||{};
   for(const [element,amount] of Object.entries(totalAura))
    card.append(make('p',{text:(english?'Total aura':'Итог ауры')+' · '+
     (labels[element]||element)+': '+(amount.known>0?'+':'')+amount.known}));
   show(english?'Weapon magic enhancement':'Магическое усиление оружия',gem.magic);
   show(english?'Armor resistance':'Сопротивление от брони',gem.resistance);
   show(english?'Status effect chance':'Шанс наложения состояния',gem.status,'%');
   if(gem.uncertain.length)card.append(make('p',{text:
    (english?'Rainbow gems: ':'Радужные самоцветы: ')+gem.uncertain.length}));
   card.append(make('p',{class:'stage-attribute-note',text:english?
    'Gem resistances are included in defense. Auras include equipment bonuses and remain separate from physical attack.':
    'Сопротивления от самоцветов включены в защиту. Аура учитывает бонусы снаряжения и остаётся отдельной от физической атаки.'}));
   body.prepend(card);
  }
  if(modifiers?.healingSkill){
   const heal=modifiers.healingSkill,card=make('section',{class:'stage-attribute-row'});
   card.append(make('strong',{text:english?
    'Healing-skill effectiveness':'Эффективность лечащих навыков'}),
    make('p',{text:(english?'Effectiveness: ':'Эффективность: ')+heal.percent+
     (english?'% (base 100%, honor +':'% (основа 100%, честь +')+heal.honor+
     (english?'%, equipment/Souls +':'%, предметы/души +')+heal.equipment+'%)'}),
    make('p',{class:'stage-attribute-note',text:english?
     'Healing-skill effectiveness is separate from potions. Not all active skill conditions are included.':
     'Это действие лечащих умений, а не эффективность зелий; не учтены все активные особенности навыков.'}));
   body.prepend(card);
  }
  if(modifiers?.combat?.manaCost){
   const mp=modifiers.combat.manaCost,card=make('section',{class:'stage-attribute-row'});
   card.append(make('strong',{text:english?'MP cost':'Расход ОМ'}),
    make('p',{text:(english?'Remaining cost index: ':'Индекс остаточного расхода: ')+
     mp.remaining+'%'}),
    make('p',{text:(english?'INT base: ':'База от ИНТ: ')+mp.base+'%'}),
    make('p',{text:(english?'Racial passive: −':'Расовая способность: −')+mp.racial+'%'}),
    make('p',{text:(english?'Equipment and Souls: −':'Снаряжение и души: −')+
     mp.equipment+'%'}),
    make('p',{class:'stage-attribute-note',text:english?
     'This preview excludes active effects and unstructured refinement bonuses; 100% means the original MP cost.':
     'Это расчёт без активных эффектов и неструктурированных бонусов заточки; 100% означает исходный расход ОМ.'}));
   body.prepend(card);
  }
  const honor=modifiers?.honor;
  if(honor?.id){
   const labels={
    allAttributes:'Все характеристики',healingSkills:'Лечащие навыки',
    attackPercent:'Сила атаки',fireMagic:'Магия огня',iceMagic:'Магия льда',
    lightningMagic:'Магия молнии',fire:'Огонь',ice:'Лёд',lightning:'Молния',
    burn:'Ожог',freeze:'Обморожение',knockdown:'Сбивание с ног',
    castingResist:'Устойчивость к сбою',accuracy:'Точность',
    weaponPhysical:'Физический урон оружия',mountedRelease:'Эффект верхом',
    incomingCriticalChance:'Получаемый критический шанс',
    incomingCriticalDamage:'Получаемый критический урон',
    light:'Свет',dark:'Тьма',charm:'Очарование',
    mentalState:'Психические состояния',magic:'Магия',
    physicalState:'Физические состояния',potionRecovery:'Лечение зельями',
    defense:'Защита',incomingPhysical:'Получаемый физический урон',
    dodge:'Уклонение',rangedDodge:'Уклонение от дальнего боя',
    frontAttack:'Фронтальная атака'
   };
   const honorEnglishLabels={
    allAttributes:'All attributes',healingSkills:'Healing skills',
    attackPercent:'Attack power',fireMagic:'Fire magic',iceMagic:'Ice magic',
    lightningMagic:'Lightning magic',fire:'Fire',ice:'Ice',lightning:'Lightning',
    burn:'Burn',freeze:'Freeze',knockdown:'Knockdown',
    castingResist:'Casting interruption resistance',accuracy:'Accuracy',
    weaponPhysical:'Physical weapon damage',mountedRelease:'Mounted release',
    incomingCriticalChance:'Incoming critical chance',
    incomingCriticalDamage:'Incoming critical damage',
    light:'Light',dark:'Dark',charm:'Charm',
    mentalState:'Mental conditions',magic:'Magic',
    physicalState:'Physical conditions',potionRecovery:'Potion healing',
    defense:'Defense',incomingPhysical:'Incoming physical damage',
    dodge:'Evasion',rangedDodge:'Ranged evasion',frontAttack:'Front attack'
   };
   const percent=new Set(['healingSkills','attackPercent','fireMagic','iceMagic',
    'lightningMagic','burn','freeze','knockdown','castingResist','mountedRelease',
    'incomingCriticalChance','incomingCriticalDamage','potionRecovery',
    'incomingPhysical','rangedDodge','frontAttack']);
   const card=make('section',{class:'stage-attribute-row'});
   card.append(make('strong',{text:document.documentElement?.lang==='en'?
    'Honor title: '+honor.en:'Титул чести: '+honor.ru}));
   for(const [key,value] of Object.entries(honor.effects)){
    if(key==='allAttributes')continue; // already included in visible six stats
    card.append(make('p',{text:(document.documentElement?.lang==='en'?
     honorEnglishLabels[key]:labels[key]||key)+': '+(value>0?'+':'')+value+
     (percent.has(key)?'%':'')}));
   }
   body.prepend(card);
  }

 }
 if(chosen==='recovery'&&modifiers?.potion){
  const english=document.documentElement?.lang==='en';
   const potion=make('section',{class:'stage-attribute-row'});
   potion.append(make('strong',{text:english?'Potion effects':'Действие зелий'}),
    make('p',{text:(english?'Effectiveness: ':'Эффективность: ')+
     modifiers.potion.percent+'%'}));
   const parts=[
    [english?'Stamina (base effectiveness)':'Выносливость (базовая эффективность)',
     modifiers.potion.base,true],
    [english?'Herbalist (human racial passive)':'Знахарство (расовая способность человека)',
     modifiers.potion.racial,false],
    [english?'Improved healing (melee mastery, Warrior level 12+)':
     'Улучшение лечения (мастерство ближнего боя, воин с 12 уровня)',
     modifiers.potion.mastery,false],
    [english?'Honor title':'Титул чести',modifiers.potion.honor,false],
    [english?'Equipment and Souls':'Экипировка и души',modifiers.potion.equipment,false]
   ];
   for(const [name,value,isBase] of parts){
    if(!Number.isFinite(value)||value===0)continue;
    potion.append(make('p',{text:name+': '+(isBase?'':value>0?'+':'')+value+'%'}));
   }
   body.prepend(potion);
  }
 if(page==='attack'&&modifiers?.mountedRelease){
  const riding=modifiers.mountedRelease;
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Верховая езда'}),
   make('p',{text:'Раскрытие характеристик верхом: '+riding.known+'%'}),
   make('p',{text:'Профессия '+riding.jobBase+'% · мастерство +'+riding.mastery+
    '% · титул +'+riding.honor+'%'}));
  body.prepend(card);
 }
 if(page==='attack'&&modifiers?.attackRange?.baseOnly){
  const range=modifiers.attackRange,english=document.documentElement?.lang==='en';
  const base=range.baseRanged??range.baseMelee;
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:english?'Base weapon range':'Базовая дальность оружия'}),
   make('p',{text:(english?'Raw game units: ':'Исходные игровые единицы: ')+base}),
   make('p',{class:'stage-attribute-note',text:english?
    'The game publishes this base distance. Equipment bonuses and mounted/skill modifiers have not been added.':
    'Это базовая дистанция из игрового каталога. Бонусы вещей, верховой езды и навыков не суммировались.'}));
  body.prepend(card);
 }
 if(page==='attack'&&modifiers?.attackRange?.racialGeneral){
  const range=modifiers.attackRange,english=document.documentElement?.lang==='en';
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:english?'Elven racial range bonus':'Расовая дальность эльфа'}),
   make('p',{text:(english?'Sharpsight: +':'Зоркость: +')+range.racialGeneral+
    (english?' range units':' единиц дальности')}),
   make('p',{class:'stage-attribute-note',text:english?
    'Skill 900020002 publishes matching RANGE and CARRY values; this is one passive bonus, not their sum. The server\'s final weapon-range stacking is not yet verified.':
    'Навык 900020002 содержит одинаковые RANGE и CARRY: это один расовый бонус, а не их сумма. Итоговый порядок расчёта дальности оружия сервером ещё не подтверждён.'}));
  body.prepend(card);
 }
 if(page==='attack'&&modifiers?.attackRange?.entries?.length){
  const range=modifiers.attackRange,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Бонусы дальности от снаряжения'}));
  if(range.general)card.append(make('p',{text:'Дальность атаки: '+
   (range.general>0?'+':'')+range.general}));
  if(range.bow)card.append(make('p',{text:'Дальность стрельбы: '+
   (range.bow>0?'+':'')+range.bow}));
  body.prepend(card);
 }
 if(page==='attack'&&modifiers?.elementalRefinement?.entries?.length){
  const english=document.documentElement?.lang==='en';
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:english?
   'Elemental weapon refinement':'Стихийное усиление оружия'}));
  for(const effect of modifiers.elementalRefinement.entries){
   card.append(make('p',{text:(english?'Fire Dagger of Scorching Heat':'Огненный кинжал зноя')+
    ' +'+effect.grade+': '+(english?'fire magic +':'магическая атака огнём +')+
    effect.rate+'%'}));
  }
  card.append(make('p',{class:'stage-attribute-note',text:english?
   'Source-confirmed fire-refinement effect with a matching fire gem. Its final server stacking and Phoenix proc are unverified; this value is not added to general MATK or Honor.':
   'Показан эффект закалки из игрового каталога при выбранном самоцвете огня. Серверное суммирование и срабатывание Пламени феникса не подтверждены; значение не прибавлено к общей МАТК и титулу чести.'}));
  body.prepend(card);
 }
 if(page==='attack'&&modifiers?.elementalMagic){
  const labels={fire:'Огонь',ice:'Лёд',lightning:'Молния',
   poison:'Яд',light:'Свет',dark:'Тьма'};
  const values=Object.entries(modifiers.elementalMagic)
   .filter(([,amount])=>Number.isFinite(amount)&&amount!==0);
  if(values.length){
   const magic=make('section',{class:'stage-attribute-row'});
   magic.append(make('strong',{text:'Усиление стихийной магии'}));
   for(const [element,amount] of values)
    magic.append(make('p',{text:labels[element]+': '+(amount>0?'+':'')+amount}));
   body.prepend(magic);
  }
 }
 if(page==='attack'&&modifiers?.combat){
  const cm=modifiers.combat,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Боевые параметры'}));
  card.append(make('p',{text:'Физическая атака оружия: '+
   (cm.attack?.known??'—')+' · с выбранными усилениями'}),
   make('p',{text:'Точность: '+cm.accuracy.known+' (база '+
    cm.accuracy.base+', бонусы '+(cm.accuracy.known-cm.accuracy.base)+')'}),
   make('p',{text:'Уклонение: '+cm.dodge.known+' (база '+
    cm.dodge.base+', бонусы '+(cm.dodge.known-cm.dodge.base)+')'}),
   make('p',{text:'Критический шанс: '+cm.critical.known}),
   make('p',{text:'Исходящий критический урон: '+cm.criticalDamage+'%'}));
  if(cm.racialWeapon){
   const racial=cm.racialWeapon,english=document.documentElement?.lang==='en';
   const amounts=(racial.flat?('+'+racial.flat+(english?' flat and ':' ед. и ')):'')+
    '+'+racial.percent+'%';
   const category=english?
    {oneHanded:'one-handed weapons',axeBlunt:'axes and blunt weapons',
     twoHanded:'two-handed weapons'}:
    {oneHanded:'одноручное оружие',axeBlunt:'топоры и булавы',
     twoHanded:'двуручное оружие'};
   const eligibility=racial.matchesCategory===null?
    (english?'No weapon equipped for category comparison.':'Нет оружия для проверки категории.'):
    racial.matchesCategory?
     (english?'Equipped weapon matches the stated category.':
      'Надетое оружие соответствует указанной категории.'):
     (english?'Equipped weapon does not match the stated category.':
      'Надетое оружие не соответствует указанной категории.');
   card.append(make('p',{text:(english?racial.en:racial.ru)+': '+amounts+
    ' ('+category[racial.kind]+')'}),
    make('p',{text:eligibility}),
    make('p',{class:'stage-attribute-note',text:english?
     'Source skill values only: not added to final ATK. Actual combat stacking, rounding, mounted and special weapon restrictions are not verified.':
     'Это исходные числа навыка, не прибавленные к итоговой АТК. Порядок суммирования в бою, округление и особые ограничения оружия ещё не подтверждены.'}));
  }
  if(cm.attack?.flatEquipment||cm.attack?.percentEquipment?.length){
   const flat=cm.attack.flatEquipment,percent=cm.attack.percentEquipment.reduce((sum,e)=>sum+e.bonus,0);
   card.append(make('p',{text:'Прямые бонусы атаки от вещей и душ: '+
    (flat>=0?'+':'')+flat+'; процентные: '+(percent>=0?'+':'')+percent}));
  }
  if(cm.attack?.activeBonus||cm.attack?.guildBonus){
   const buff=cm.attack.activeBonus||0,guild=cm.attack.guildBonus||0;
   card.append(make('p',{text:'Выбранные навыки: '+(buff>=0?'+':'')+buff+
    ' · гильдия: '+(guild>=0?'+':'')+guild+' к атаке'}));
  }
  if(cm.activeSkills?.lunge)card.append(make('p',{text:'Рывок: '+
   (cm.attackSpeed.lunge>0?'+':'')+cm.attackSpeed.lunge+' к скорости атаки'}));
  if(cm.accuracy.percentage?.length){
   const total=cm.accuracy.percentage.reduce((sum,e)=>sum+e.bonus,0);
   card.append(make('p',{text:'Процентная точность вещей: '+
    (total>=0?'+':'')+total+' (поштучное округление вверх)'}));
  }
  if(cm.accuracy.passive)card.append(make('p',{text:'Пассивная меткость лучника: +'+
   cm.accuracy.passive}));
  if(cm.accuracy.activeBonus)card.append(make('p',{text:
   'Сосредоточенность: +'+cm.accuracy.activeBonus+' к точности'}));
  if(cm.dodge.passive)card.append(make('p',{text:'Пассивное уклонение: +'+
   cm.dodge.passive}));
  if(cm.dodge.windAssist)card.append(make('p',{text:'Помощь ветра: +'+
   cm.dodge.windAssist+' к уклонению'}));
  if(cm.racialRate.accuracy)card.append(make('p',{text:
   'Подавление гнева: +'+cm.racialRate.accuracy+
   '% к точности · отдельный эффект'}));
  if(cm.racialRate.dodge)card.append(make('p',{text:
   'Интуиция: +'+cm.racialRate.dodge+
   '% к уклонению · отдельный эффект'}));
  if(cm.magicAttack)card.append(make('p',{text:'Магическая атака: '+
   cm.magicAttack.known+'% (ИНТ '+cm.magicAttack.intelligence+
   ', пассивка '+cm.magicAttack.passive+', оружие '+cm.magicAttack.staff+')'}));
  if(cm.secondary){
   const names={
    auraFlat:'Аурный урон от снаряжения',
    auraPercent:'Усиление аурного урона',
    outgoingDebuffDuration:'Продолжительность дебаффов',
    debuffSuccess:'Шанс наложения дебаффов',
    cooldown:'Изменение отката от предметов'
   };
   for(const [key,label] of Object.entries(names)){
    const value=cm.secondary[key];
    if(value)card.append(make('p',{text:label+': '+
     (value>0?'+':'')+value+(key==='auraPercent'?'%':'')}));
   }
  }
  card.append(make('p',{text:'Физический урон оружия, пассивки и титулы: +'+
   cm.weaponPhysical}),make('p',{text:'АТК сзади: +'+cm.backAttack+
   ', спереди: +'+cm.frontAttack}),make('p',{text:'Откат умений (базовый индекс): '+
   (cm.cooldown??'—')+'%'}));
  if(cm.spellDamageEquipmentRate)card.append(make('p',{text:
   'Структурированный бонус магического урона снаряжения: '+
   (cm.spellDamageEquipmentRate>0?'+':'')+cm.spellDamageEquipmentRate+
   '% (не суммирован повторно с бонусом жезла/посоха)'}));
  if(cm.backAttackEquipmentRate)card.append(make('p',{text:
   'Урон атаки в спину от предметов: +'+cm.backAttackEquipmentRate+
   '% (отдельно от базового позиционного бонуса)'}));
  if(cm.skillDelayFinalEquipment)card.append(make('p',{text:
   'Финальная модификация скорости применения умений от души: '+
   (cm.skillDelayFinalEquipment>0?'+':'')+cm.skillDelayFinalEquipment+
   '% (не объединена с задержкой отдельных навыков)'}));
  if(cm.skillDelayEquipment)card.append(make('p',{text:
   'Изменение задержки применения навыков от вещей: '+
   cm.skillDelayEquipment+'% (отдельно от показателя каста)'}));
  card.append(make('p',{text:'Скорость передвижения: '+
   cm.movementSpeed.known+' (снаряжение '+
   (cm.movementSpeed.equipment>=0?'+':'')+cm.movementSpeed.equipment+
   ', умения '+(cm.movementSpeed.active>=0?'+':'')+
   cm.movementSpeed.active+')'}));
  if(cm.movementSpeed.townEquipment)
   card.append(make('p',{text:'Скорость в городе: '+
    cm.movementSpeed.town+' (от снаряжения '+
    (cm.movementSpeed.townEquipment>0?'+':'')+
    cm.movementSpeed.townEquipment+')'}));
  if(cm.attackSpeed)card.append(make('p',{text:'Скорость атаки (индекс): '+
   cm.attackSpeed.known+' (база '+cm.attackSpeed.base+
   ', экипировка '+(cm.attackSpeed.equipment>=0?'+':'')+
   cm.attackSpeed.equipment+', навыки +'+cm.attackSpeed.lunge+')'}));
  if(cm.castingSpeed)card.append(make('p',{text:'Скорость заклинаний: '+
   cm.castingSpeed.known+' (база '+cm.castingSpeed.base+
   ', снаряжение '+(cm.castingSpeed.equipment>=0?'+':'')+
   cm.castingSpeed.equipment+')'}));
  card.append(make('p',{class:'stage-attribute-note',
   text:'Источник: Remaked Legacy + таблицы OS. Учитываются выбранные подтверждённые активные умения; другие условные навыки, комплекты и часть серверных условий всё ещё не рассчитаны.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.combat?.defense){
  const df=modifiers.combat.defense,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Защита снаряжения'}),
   make('p',{text:'Подтверждённая основа: '+df.known}),
   make('p',{text:'Базовая защита снаряжения: '+df.armor}),
   make('p',{text:'Бонус заточки брони и щита: +'+df.refinement}),
   make('p',{text:'Прямые бонусы вещей и душ: '+(df.equipment>=0?'+':'')+df.equipment}),
   make('p',{text:'Процентные бонусы защиты: '+(df.percentBonus>=0?'+':'')+df.percentBonus}),
   make('p',{text:'Титул чести: '+(df.honor>=0?'+':'')+df.honor}),
   make('p',{text:'Эффект выбранной стойки: '+(df.activeBonus>=0?'+':'')+df.activeBonus}),
   make('p',{class:'stage-attribute-note',
    text:'Заточка щита и брони учтена по исходной формуле Remaked: ⌊+N×1,5⌋ за каждый предмет. Остальные условные эффекты и временные навыки ещё не полностью учитываются.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.combat){
  const cm=modifiers.combat,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Дополнительные защитные параметры'}),
   make('p',{text:'Сопротивление прерыванию каста: '+
    (cm.castInterruption>=0?'+':'')+cm.castInterruption}),
   make('p',{text:'Изменение шанса входящего крита: '+cm.criticalIncoming}),
   make('p',{text:'Множитель входящего критического урона: '+
    cm.criticalIncomingDamage+'%'}),

   make('p',{class:'stage-attribute-note',
    text:'Частичные индексы по Remaked: навыки, душевные эффекты и условия серверного боя пока не все учтены.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.targetResistance?.entries?.length){
  const english=document.documentElement?.lang==='en';
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:english?'Defense by enemy type':
   'Защита от отдельных типов противников'}));
  for(const effect of modifiers.targetResistance.entries)
   card.append(make('p',{text:(english?'Damage from ':'Урон от ')+
    (english?effect.nameEn:effect.name)+': '+
    (effect.change>0?'+':'')+effect.change+'% · '+effect.source}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.resistances){
  const rs=modifiers.resistances,card=make('section',{class:'stage-attribute-row'});
  const english=document.documentElement?.lang==='en';
  card.append(make('strong',{text:'Сопротивления'}));
  const labels=english?
   {fire:'Fire',ice:'Ice',lightning:'Lightning',poison:'Poison',
    charm:'Charm',light:'Light',dark:'Dark',magic:'Magic'}:
   {fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
    charm:'Очарование',light:'Свет',dark:'Тьма',magic:'Магия'};
  const elements=make('div',{class:'stage-resistance-grid'});
  for(const [key,value] of Object.entries(rs.elements||{})){
   if(!Number.isFinite(value))continue;
   elements.append(make('div',{class:'stage-resistance-tile'+(value<0?' negative':'')},[
    make('span',{text:labels[key]||key}),
    make('strong',{text:(value>0?'+':'')+value})
   ]));
  }
  card.append(elements);
  if(rs.gemstones&&Object.keys(rs.gemstones).length){
   const added=Object.entries(rs.gemstones).map(([key,value])=>
    (labels[key]||key)+' '+(value>0?'+':'')+value).join(' · ');
   card.append(make('p',{class:'stage-resistance-gem-summary',text:
    (english?'From gems: ':'От самоцветов: ')+added}));
  }
  if(rs.wardingPassive)
   card.append(make('p',{text:english?
    'Resilience: +15 against stun, freeze and knockdown':
    'Устойчивость: +15 к оглушению, заморозке и падению'}));
  card.append(make('p',{text:'Физические состояния: '+rs.states.physical}),
   make('p',{text:'Психические состояния: '+rs.states.mental}));
  const statusNames=english?
   {burn:'Burn',stun:'Stun',numb:'Freeze',tumble:'Knockdown',
    knockback:'Knockback',sleep:'Sleep',silence:'Silence',
    evil:'Evil',curse:'Weakness / Curse',disease:'Disease',
    madness:'Madness',blockBreak:'Block break'}:
   {burn:'Ожоги',stun:'Оглушение',numb:'Заморозка',
    tumble:'Падение',knockback:'Отбрасывание',sleep:'Сон',
    silence:'Немота',evil:'Зло',curse:'Слабость/проклятие',
    disease:'Болезнь',madness:'Помешательство',blockBreak:'Пробитие блока'};
  const resist=Object.entries(rs.status||{}).filter(([,v])=>v!==0);
  if(resist.length){
   card.append(make('strong',{text:'Сопротивления состояниям'}));
   for(const [key,value] of resist)
    card.append(make('p',{text:(statusNames[key]||key)+': '+
     (value>0?'+':'')+value}));
  }
  if(rs.mitigation.physical)card.append(make('p',{text:'Получаемый физический урон: '+
   rs.mitigation.physical+'%'}));
  if(rs.mitigation.physicalFlat)card.append(make('p',{text:
   (english?'Physical damage change: ':'Изменение физического урона: ')+
   (rs.mitigation.physicalFlat>0?'+':'')+rs.mitigation.physicalFlat}));
  if(rs.mitigation.magic)card.append(make('p',{text:'Получаемый магический урон: '+
   rs.mitigation.magic+'%'}));
  if(rs.physicalReflection)card.append(make('p',{text:'Отражение ближнего физического урона: '+
   (rs.physicalReflection>0?'+':'')+rs.physicalReflection+'%'}));
  if(rs.incomingDebuffDurationReduction)card.append(make('p',{text:'Изменение длительности дебаффов: '+
   (rs.incomingDebuffDurationReduction>0?'+':'')+
   rs.incomingDebuffDurationReduction+'%'}));
  if(rs.damageNegation)card.append(make('p',{text:'Уклонение от физического урона: '+
   (rs.damageNegation>0?'+':'')+rs.damageNegation}));
  card.append(make('p',{class:'stage-attribute-note',text:english?
   'Includes base formulas, racial passives, honor and structured equipment/Soul resistance, including enhancement requirements. Other skills and server immunities are not fully included.':
   'Включены базовые формулы, расовые способности, честь и структурированные сопротивления от вещей/душ, включая требования заточки; другие навыки и серверные иммунитеты ещё не полностью учтены.'}));
  body.prepend(card);
 }
 if(page==='summary'&&modifiers?.regeneration){
  const regen=modifiers.regeneration,english=document.documentElement?.lang==='en';
  const card=make('section',{class:'stage-attribute-row'});
  const bonus=(value,label)=>value?(', '+label+(value>0?'+':'')+value):'';
  card.append(make('strong',{text:english?'Natural recovery speed':'Скорость естественного восстановления'}),
   make('p',{text:(english?'HP: ':'ОЗ: ')+regen.hp.total+
    (english?' (base ':' (база ')+regen.hp.base+
    (english?', guild +':', гильдия +')+regen.hp.guild+
    (english?', healing +':', лечение +')+regen.hp.healing+')'}),
   make('p',{text:(english?'MP: ':'ОМ: ')+regen.mp.total+
    (english?' (base ':' (база ')+regen.mp.base+
    (english?', guild +':', гильдия +')+regen.mp.guild+
    (english?', healing +':', лечение +')+regen.mp.healing+
    bonus(regen.mp.equipment,english?'equipment ':'снаряжение ')+
    bonus(regen.mp.racial,english?'racial passive ':'расовая способность ')+')'}),
   make('p',{class:'stage-attribute-note',
    text:english?
     'Remaked-based speed indices, not HP/MP per tick. Supported equipment and racial effects are included; unverified active effects are excluded.':
     'Показатели скорости из Remaked, не количество ОЗ/ОМ за тик. Подтверждённые бонусы экипировки и расовые способности учтены; непроверенные активные эффекты не включены.'}));
  body.prepend(card);
 }
 if(page==='summary'&&modifiers?.recoveryAmount){
  const natural=modifiers.recoveryAmount,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Естественное восстановление (расчётная величина)'}),
   make('p',{text:'ОЗ: '+natural.hp.known+' (максимум ОЗ '+natural.hp.maxContribution+
    ' + ВЫН '+natural.hp.attributeContribution+')'}),
   make('p',{text:'ОМ: '+natural.mp.known+' (максимум ОМ '+natural.mp.maxContribution+
    ' + СД '+natural.mp.attributeContribution+')'}));
  const rate=modifiers?.combat?.mpRecoveryEquipmentRate||0;
  if(rate)card.append(make('p',{text:'Отдельный бонус скорости восстановления ОМ: '+
   (rate>0?'+':'')+rate+'%'}));
  card.append(make('p',{class:'stage-attribute-note',
   text:'Исторические формулы Remaked LPRec/MPRec: без сидения и условных активных эффектов. Не следует считать полученный показатель гарантированным восстановлением в секунду.'}));
  body.prepend(card);
 }
 const totals=modifiers?.effects?.bonuses||{};
 const names={fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
 charm:'Очарование',light:'Свет',dark:'Тьма',magic:'Магия',
 accuracy:'Точность',dodge:'Уклонение',criticalChance:'Критический шанс'};
 const active=Object.entries(totals).filter(([key])=>names[key]&&
  ['attack','defense','effects'].includes(chosen)&&
  (page==='defense'? !['accuracy','dodge','criticalChance'].includes(key):
   page==='attack'?['accuracy','dodge','criticalChance'].includes(key):true));
 if(active.length){
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Известные бонусы снаряжения и душ'}));
  for(const [key,val] of active)card.append(make('p',{text:names[key]+': '+(val>=0?'+':'')+val}));
  body.prepend(card);
 }
 if(chosen==='recovery'){
  const english=document.documentElement?.lang==='en';
  const percent=modifiers?.potion?.percent;
  const quick=make('div',{class:'stage-result-grid'});
  for(const [title,value,note] of [
   [english?'Potion effectiveness':'Эффективность зелий',Number.isFinite(percent)?percent+'%':'—',english?'HP recovery':'Восстановление ОЗ'],

  ])quick.append(make('div',{class:'stage-result-tile'},[
   make('span',{text:title}),make('strong',{text:value}),make('small',{text:note})]));
  body.prepend(quick);
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
 if(chosen==='effects'){
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
 if(chosen==='effects'&&modifiers?.healingSkill){
  const english=document.documentElement?.lang==='en';
  const spells=modifiers.healingSpells,heal=modifiers.healingSkill;
  const card=make('section',{class:'stage-attribute-row stage-healing-spells'});
  card.append(make('strong',{text:english?'Healing skills':'Лечащие умения'}),
   make('p',{text:(english?'Healing effectiveness: ':'Эффективность лечения: ')+heal.percent+'%'}));
  if(spells){
   for(const row of spells.rows){
    const label=make('div',{class:'stage-heal-row'},[
     make('span',{text:english?(row.nameEn||row.name):row.name}),
     make('strong',{text:String(row.amount)+(row.scaledBySkill?
      (english?' HP':' ОЗ'):(english?' / period':' / период'))}),
     make('small',{text:row.available?
      (english?'Available by skill requirements':'Доступен по проверенным базовым условиям'):
      (english?'Preview · '+(row.requiresEn||row.requires):
       'Теоретический · '+row.requires)})
    ]);
    card.append(label);
   }
   card.append(make('p',{class:'stage-attribute-note',text:
    'Формулы старого Remaked. Доступность требует полного учёта требований и текущей версии OS; значения не гарантируют серверное лечение.'}));
  }
  body.prepend(card);
 }
 if(chosen==='effects'&&modifiers?.periodicRecovery?.rows?.length){
  const english=document.documentElement?.lang==='en';
  const skillNamesEn={310002001:'Regenerate',310022001:'Restoration',330005001:'Mana Restore'};
  const details=make('details',{class:'stage-attribute-row stage-periodic-recovery'});
  details.append(make('summary',{text:english?'Recovery every 2 seconds':
   'Восстановление каждые 2 секунды'}));
  for(const entry of modifiers.periodicRecovery.rows){
   details.append(make('div',{class:'stage-periodic-row'},[
    make('span',{text:english?(skillNamesEn[entry.id]||entry.name):entry.name}),
    make('strong',{text:'≈ '+entry.amount+' '+(entry.kind==='hp'?
     (english?'HP':'ОЗ'):(english?'MP':'ОМ'))}),
    make('small',{text:entry.available?
     (english?'Available when using the skill':'Доступно при использовании умения'):
     entry.required>0?(english?'Requires healing mastery '+entry.required:
      'Для изучения нужно мастерство '+entry.required):
     (english?'Not yet available':'Пока недоступно')})
   ]));
  }
  details.append(make('p',{class:'stage-periodic-hint',
   text:english?
    'Estimated skill effect. Not included in the hero’s permanent recovery.':
    'Ориентировочное действие умения. Не входит в постоянное восстановление персонажа.'}));
  body.append(details);
 }
 // Conditional effects are displayed only for a usable equipped weapon
 // with +7 or higher fire-gem refinement. They are not added to damage totals
 // without verified server proc mechanics.
 if(['summary','attack','effects'].includes(chosen)){
  const active=items.map(row=>({row,
   bonus:root.PandoraConditionalItemBonuses?.activeFor?.(row)}))
   .filter(x=>x.bonus&&(x.bonus.phoenix||x.bonus.rows.length));
  if(active.length){
   const en=document.documentElement?.lang==='en';
   const panel=make('section',{class:'stage-attribute-row stage-active-elemental'});
   panel.append(make('strong',{text:en?
    'Active conditional weapon effects':'Условные эффекты экипированного оружия'}));
   for(const {row,bonus} of active){
    const record=row.record||{},name=record.name||'Оружие';
    panel.append(make('p',{text:name+' · '+(en?'Fire +':'Огонь +')+
     row.refinement}));
    if(bonus.phoenix){
     const p=bonus.phoenix;
     const result=root.PandoraConditionalItemBonuses.phoenixDamage(
      p,row.refinement,modifiers?.stats);
     const number=value=>Number(value).toLocaleString(en?'en-US':'ru-RU',
      {maximumFractionDigits:2});
     panel.append(make('div',{class:'stage-skill-effect-row'},[
      make('span',{text:en?'Phoenix Flame · calculated damage':'Пламя феникса · расчётный урон'}),
      make('strong',{text:result?number(result.damage):'—'})
     ]));
     if(result){
      panel.append(make('p',{class:'stage-elemental-explanation',text:
       number(result.flat)+' + '+number(result.scale)+'% × '+
       result.stat+' ('+number(result.attribute)+') = '+
       number(result.damage)}));
      panel.append(make('p',{class:'stage-elemental-explanation',text:en?
       'Trigger chance: '+number(result.chance)+'% · Cooldown: '+number(result.cooldown)+' s':
       'Шанс срабатывания: '+number(result.chance)+'% · Откат: '+number(result.cooldown)+' сек.'}));
      panel.append(make('small',{class:'stage-attribute-note',text:en?
       'Calculated effect before target resistances; actual server rounding and mitigation may differ.':
       'Урон до сопротивлений цели. Серверное округление и снижение урона не учтены.'}));
     }
    }
    if(chosen==='effects'){
     for(const entry of bonus.rows)
      panel.append(make('p',{text:entry.name+' +'+entry.value+
       (entry.unit==='%'?'%':'')}));
     if(bonus.phoenix)panel.append(make('p',{class:'stage-elemental-explanation',
      text:root.PandoraConditionalItemBonuses.phoenixExplanation(bonus.phoenix)}));
    }
   }
   body.prepend(panel);
  }
 }
 if(['attack','defense'].includes(chosen)&&modifiers?.combat){
  const battle=modifiers.combat;
  const numbers=chosen==='attack'?
   [['Физическая атака',battle.attack?.known],
    ['Магическая атака',battle.magicAttack?.known==null?null:battle.magicAttack.known+'%'],
    ['Точность',battle.accuracy?.known],['Критический шанс',battle.critical?.known]]:
   [['Защита',battle.defense?.known],['Уклонение',battle.dodge?.known],
    ['Входящий крит. урон',battle.criticalIncomingDamage==null?null:battle.criticalIncomingDamage+'%'],
    ['Устойчивость к сбою',battle.castInterruption]];
  const grid=make('div',{class:'stage-result-grid stage-combat-quick'});
  for(const [label,value]of numbers)grid.append(make('div',{class:'stage-result-tile'},[
   make('span',{text:label}),make('strong',{text:value??'—'})]));
  body.prepend(grid);
 }
 // Preserve formula caveats without placing developer diagnostics between
 // player-facing statistics. They remain inspectable by choice.
 if(typeof body.querySelectorAll==='function'){
  const details=make('details',{class:'stage-methodology'});
  const summary=make('summary',{text:'Подробнее о точности расчёта'});
  details.append(summary);
  const candidate=body.querySelectorAll('.stage-attribute-note,.stage-attribute-warning');
  const isAdmin=root.PandoraStudioAdminActive?.()===true;
  for(const node of candidate){
   const txt=String(node.textContent||'');
   if(/(?:Remaked|\bOS\b|сервер|не учтен|не учтён|не включ|не провер|формул|временны|прок|пока |историч|не моделир)/i.test(txt)&&
    !node.closest('details')){
    if(isAdmin)details.append(node);
    else node.remove();
   }
  }
  if(isAdmin&&details.children.length>1)body.append(details);
 }
 target.append(body);
}
root.PandoraStageAttributes=Object.freeze({render,bookPages,bookText,summaryRows});
})(typeof window==='undefined'?globalThis:window);
