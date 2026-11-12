(function(root){
'use strict';
// RU/EN encyclopedia copy is separate from game calculation input.
// Every owner override is an isolated, validated D1 record; never evaluate it.
const hints=Object.freeze({
 'ОЗ':['Очки здоровья персонажа.','Character health points.'],
 'ОМ':['Очки маны персонажа.','Character mana points.'],
 'Леч. зельями':['Эффективность восстановления ОЗ зельями.','HP potion recovery effectiveness.'],
 'Леч. умениями':['Эффективность лечащих умений.','Healing skill effectiveness.'],
 'Расход ОМ':['Расход маны на применение умений, индекс %.','Mana cost of skills, percentage index.'],
 'АТК':['Итоговая сила физической атаки.','Total physical attack power.'],
 'АТК спереди':['Бонус урона при атаке противника спереди.','Bonus damage when attacking from the front.'],
 'АТК сзади':['Бонус урона при атаке противника в спину.','Bonus damage when attacking from behind.'],
 'МАТК':['Индекс магической атаки персонажа.','Character magic attack index.'],
 'Точность':['Вероятность попадания зависит в том числе от точности.','Accuracy contributes to chance to hit.'],
 'Точн. спереди':['Точность при атаке спереди.','Accuracy when attacking from the front.'],
 'Шанс крита':['Вероятность критического удара.','Chance to land a critical hit.'],
 'Крит. урон':['Множитель урона критического удара.','Critical hit damage multiplier.'],
 'Дальн. АТК ближ. боя':['Базовая дальность атаки оружием ближнего боя.','Base melee weapon attack range.'],
 'Дальн. АТК дальн. боя':['Базовая дальность атаки дальнобойным оружием.','Base ranged weapon attack range.'],
 'Скор. атаки':['Индекс скорости обычных атак. Не удары в секунду.','Normal attack speed index, not attacks per second.'],
 'Скор. каста':['Индекс скорости произнесения заклинаний.','Spell casting speed index.'],
 'Сокрщ. времени каста':['Индекс времени применения заклинания.','Spell cast-time index.'],
 'Откат':['Индекс времени перезарядки умений.','Skill cooldown time index.'],
 'Скор. движения':['Индекс скорости передвижения.','Movement speed index.'],
 'Скор. в городе':['Индекс скорости передвижения в городе.','Movement speed index inside towns.'],
 'Защита':['Итоговое значение физической защиты.','Total physical defense.'],
 'Сопр. АТК спереди':['Уменьшение получаемого урона от атак спереди.','Reduces incoming damage from frontal attacks.'],
 'Сопр. АТК сзади':['Уменьшение получаемого урона от атак в спину.','Reduces incoming damage from behind.'],
 'Сопр. физ (ед.)':['Постоянное уменьшение физического урона.','Flat physical damage mitigation.'],
 'Сопр. физ (%)':['Изменение получаемого физического урона.','Change to incoming physical damage.'],
 'Сопр. маг. урону':['Изменение получаемого магического урона.','Change to incoming magical damage.'],
 'Уклонение':['Способность избегать попаданий противника.','Ability to avoid enemy attacks.'],
 'Сопр. криту':['Изменение вероятности получить критический удар.','Change to incoming critical hit chance.'],
 'Получ. крит. урон':['Множитель входящего критического урона.','Incoming critical damage multiplier.'],
 'Укл. ближ. атак':['Уклонение от атак ближнего боя.','Evasion against melee attacks.'],
 'Укл. дальн. атак':['Уклонение от атак дальнего боя.','Evasion against ranged attacks.'],
 'Укл. от магии':['Уклонение от магических атак.','Evasion against magical attacks.'],
 'Сопр. огню':['Сопротивление магии огня.','Fire magic resistance.'],
 'Сопр. льду':['Сопротивление магии льда.','Ice magic resistance.'],
 'Сопр. молниям':['Сопротивление магии молнии.','Lightning magic resistance.'],
 'Сопр. яду':['Сопротивление ядовитым воздействиям.','Poison resistance.'],
 'Сопр. чарам':['Сопротивление магии чар.','Charm magic resistance.'],
 'Сопр. свету':['Сопротивление магии света.','Light magic resistance.'],
 'Сопр. тьме':['Сопротивление магии тьмы.','Dark magic resistance.'],
 // OS fields are current; the 6/5 membership list is historical, not a verified server-roll rule.
 'Сопр. аном. тел.':["Сопротивляемость аномальным состояниям тела.\nПо классификации Pandora Saga: оглушение, падение, отравление, кровотечение, ожог, заморозка.\nРасчёт: +7 за каждые полные 28 ВЫН, плюс известные бонусы персонажа. Отдельные сопротивления — в разделе «Защита».","Physical Status Ailment Resistance.\nClassic Pandora Saga grouping: stun, knockdown, poison, bleeding, burn, freeze.\nCalculation: +7 per full 28 VIT plus known character bonuses. Individual resistances are shown in Defense."],
 'Сопр. аном. дух.':["Сопротивляемость аномальным состояниям духа.\nПо классификации Pandora Saga: сон, безумие, немота, слабость, болезнь.\nРасчёт: +7 за каждые полные 28 СД, плюс известные бонусы персонажа. Отдельные сопротивления — в разделе «Защита».","Mental Status Ailment Resistance.\nClassic Pandora Saga grouping: sleep, madness, silence, weakness, disease.\nCalculation: +7 per full 28 SPI plus known character bonuses. Individual resistances are shown in Defense."],
 'Сопр. магии':['Общее сопротивление магическим воздействиям.','Overall magic resistance.']
});
const help=Object.freeze({
 'attack.mountedToggle':[
  'Отметь, если персонаж сражается верхом. Это меняет отображаемые боевые характеристики. Некоторые значения верхом пока нельзя точно рассчитать.',
  'Select when your hero is fighting while mounted. Combat stats update automatically; some mounted values cannot yet be calculated precisely.'],
 'attack.weaponBase':[
  'Исходная атака экипированного оружия без бонусов героя. Итоговая АТК показана в результатах расчёта.',
  'The equipped weapon’s attack before your hero’s bonuses. Total ATK appears in the results.'],
 'attack.mountedRelease':[
  'Доля характеристик, учитываемая при езде верхом. Зависит от профессии, мастерства верховой езды и титула чести.',
  'The share of attributes applied while mounted. Depends on your class, Riding mastery and Honor title.'],
 'defense.resistStatus:burn':['Ожог — негативное состояние, связанное с огнём. Этот параметр помогает ему противостоять.','Burn is a harmful fire-related condition. This stat helps resist it.'],
 'defense.resistStatus:stun':['Оглушение временно мешает персонажу действовать.','Stun temporarily prevents actions.'],
 'defense.resistStatus:numb':['Заморозка ограничивает действия персонажа.','Freeze restricts the character’s actions.'],
 'defense.resistStatus:tumble':['Падение — состояние, при котором персонаж оказывается на земле.','Knockdown makes the character fall to the ground.'],
 'defense.resistStatus:knockback':['Отбрасывание перемещает персонажа назад.','Knockback pushes the character backward.'],
 'defense.resistStatus:sleep':['Сон временно не позволяет действовать.','Sleep temporarily prevents actions.'],
 'defense.resistStatus:silence':['Немота мешает применять некоторые умения.','Silence prevents the use of certain skills.'],
 'defense.resistStatus:evil':['Сопротивление состоянию «Проклятие».','Resistance to the Curse condition.'],
 'defense.resistStatus:curse':['Сопротивление состоянию «Слабость». Это отдельный эффект, не проклятие.','Resistance to Weakness, separate from Curse.'],
 'defense.resistStatus:disease':['Болезнь — отдельное негативное состояние персонажа.','Disease is a separate harmful condition.'],
 'defense.resistStatus:madness':['Безумие нарушает управление действиями персонажа.','Madness disrupts control over the character’s actions.'],
 'defense.resistStatus:blockBreak':['Защита от эффектов, позволяющих противнику преодолеть блок.','Resistance to effects that overcome a block.'],
 'defense.hpRecoverySpeed':['Индекс скорости восстановления ОЗ. Не ОЗ/сек.','HP recovery speed index, not HP per second.'],
 'defense.mpRecoverySpeed':['Индекс скорости восстановления ОМ. Не ОМ/сек.','MP recovery speed index, not MP per second.'],
 'defense.hpRecoveryAmount':['Расчётное количество ОЗ при пассивном восстановлении.','Estimated HP amount of passive recovery.'],
 'defense.mpRecoveryAmount':['Расчётное количество ОМ при пассивном восстановлении.','Estimated MP amount of passive recovery.'],
 'buffs.honor':['Выбор одного пассивного умения за ранг Министр (Count).','Choose one passive skill granted by the Count (Minister) rank.'],
 'buffs.guild':['Бонусы гильдии зависят от её уровня и выбранных усилений.','Guild bonuses depend on guild level and selected enhancements.']
});
const defaultRanks=Object.freeze([
 {id:0,nameRu:'Оруженосец',nameEn:'Page',points:null,gold:0,
  requirementRu:'При вступлении в любую из существующих наций персонаж получает ранг Оруженосец и 1 000 очков начальной чести.',
  requirementEn:'Joining any nation grants the Squire rank and 1,000 starting Honor.',
  benefitRu:'Начальный ранг, иконка возле имени.',benefitEn:'Starting rank and nameplate icon.'},
 {id:1,nameRu:'Помощник',nameEn:'Esquire',points:null,gold:10000,
  benefitRu:'Возможность создать гильдию.',benefitEn:'Unlocks guild creation.'},
 {id:2,nameRu:'Рыцарь',nameEn:'Knight',points:3000,gold:20000,
  benefitRu:'Скидка 10% в магазинах.',benefitEn:'10% shop discount.'},
 {id:3,nameRu:'Барон',nameEn:'Baron',points:9000,gold:40000,
  benefitRu:'Расширение инвентаря.',benefitEn:'Inventory expansion.'},
 {id:4,nameRu:'Виконт',nameEn:'Viscount',points:17000,gold:80000,
  benefitRu:'Обмен чести на особые предметы.',benefitEn:'Honor exchange for special items.'},
 {id:5,nameRu:'Граф',nameEn:'Earl',points:33000,gold:160000,
  benefitRu:'Расширение инвентаря.',benefitEn:'Inventory expansion.'},
 {id:6,nameRu:'Маркиз',nameEn:'Marquess',points:65000,gold:320000,
  benefitRu:'Обмен чести на более ценные предметы.',benefitEn:'Exchange Honor for higher-tier items.'},
 {id:7,nameRu:'Министр',nameEn:'Count',points:129000,gold:640000,
  benefitRu:'Расширение инвентаря и выбор пассивного умения (Луна).',benefitEn:'Inventory expansion and an Honor passive (Moon).'},
 {id:8,nameRu:'Маркграф',nameEn:'Margrave',points:257000,gold:1280000,
  benefitRu:'Новые предметы в обменнике предметов за честь.',benefitEn:'New items in the Honor exchange shop.'},
 {id:9,nameRu:'Герцог',nameEn:'Duke',points:null,gold:0,top:15,
  benefitRu:'На месяц: плащ победителя своей нации.',benefitEn:'One-month national Victor cloak.'},
 {id:10,nameRu:'Кронпринц',nameEn:'Crown Prince',points:null,gold:0,top:5,
  benefitRu:'На месяц: плащ монарха своей нации.',benefitEn:'One-month national Monarch cloak.'},
 {id:11,nameRu:'Эрцгерцог',nameEn:'Archduke',points:null,gold:0,top:1,
  benefitRu:'На месяц: плащ императора своей нации.',benefitEn:'One-month national Emperor cloak.'}
].map(Object.freeze));
const maps=Object.freeze([
 {id:'muldia',mapId:'2005004',nameRu:'Покинутые земли Мальдии',
  nameEn:'Muldian Uncivilized District'},
 {id:'elbeht',mapId:'el-beht',nameRu:'Эль Ведд',nameEn:'El Beht'},
 {id:'astir',mapId:'astir-underground',nameRu:'Подземные руины Астира',
  nameEn:'Underground of Astir'}
].map(Object.freeze));
const wars=Object.freeze([
 {id:'lidia',nameRu:'Лидия',nameEn:'Lydia'},
 {id:'siegheim',nameRu:'Гихайм',nameEn:'Siegheim'}
].map(Object.freeze));
const intro=Object.freeze({
 overviewRu:'За победы над игроками вражеских наций и участие в войнах персонаж зарабатывает честь. Она используется для обмена предметов, повышения ранга и участия в рейтингах.',
 overviewEn:'Defeat players of enemy nations or take part in wars to earn Honor. Honor is used for item exchanges, rank progression, and leaderboards.',
 honorRu:'Расходуемый PvP-ресурс. Можно тратить в обмене; теряется при смерти.',
 honorEn:'Spendable PvP resource. Used in exchanges; may decrease on death.',
 totalRu:'Заработанная за всё время честь: определяет ранги и рейтинги.',
 totalEn:'Total Honor earned over time: determines ranks and leaderboards.',
 gainRu:'Очки чести получают за победу над игроками вражеских наций в PvP-локациях и за участие в войнах.',
 gainEn:'Earn Honor by defeating players of enemy nations in PvP zones and participating in wars.',
 lossRu:'При гибели персонажа честь может уменьшаться.',
 lossEn:'Honor may decrease when your character dies.',
 currentRu:'С 23 октября 2026 года на OS: «Честь» — расходуемый ресурс; «Вся честь» — общий заработанный запас для рангов и рейтинга. Оба показателя могут уменьшаться после смерти.',
 currentEn:'Since October 23, 2026 on OS: “Honor” is spendable; “Total Honor” tracks lifetime earned Honor for ranks and leaderboards. Both can decrease on death.',
 ranksRu:'12 рангов. Обычные ранги требуют «Вся честь» и игровое золото. Высшие места определяются результатами прошлого месяца и действуют один месяц.',
 ranksEn:'12 ranks. Standard ranks require Total Honor and gold. Monthly titles are awarded from the previous month’s results and last one month.',
 joiningRu:'При вступлении в любую из существующих наций в игре',
 joiningEn:'On joining any of the nations in the game',
 cloaksRu:'Империя — Вечный плащ победителя;\nСоюз — Великолепный плащ победителя;\nКоролевство — Священный плащ победителя.\n\nИмперия — Вечный плащ монарха;\nСоюз — Великолепный плащ монарха;\nКоролевство — Священный плащ монарха.\n\nИмперия — Вечный плащ императора;\nСоюз — Великолепный плащ императора;\nКоролевство — Священный плащ императора.',
 cloaksEn:'Empire — Eternal Victor Cloak;\nUnion — Magnificent Victor Cloak;\nKingdom — Sacred Victor Cloak.\n\nEmpire — Eternal Monarch Cloak;\nUnion — Magnificent Monarch Cloak;\nKingdom — Sacred Monarch Cloak.\n\nEmpire — Eternal Emperor Cloak;\nUnion — Magnificent Emperor Cloak;\nKingdom — Sacred Emperor Cloak.',
 monthlyNoteRu:'Ранги Герцог, Кронпринц и Эрцгерцог в каждой нации определяются 1-го числа по результатам прошлого месяца. Звание действует месяц и не продлевается, если в следующем месяце не выполнены условия для получения соответствующего плаща.',
 monthlyNoteEn:'Duke, Crown Prince and Archduke ranks are awarded separately in each nation on the first day of the month based on the previous month’s results. Each title lasts one month and is renewed only when the requirements for its cloak are met again.'
});
const cleanPatch=(patch,allowed,max=600)=>{
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return null;
 const entries=Object.entries(patch);
 if(!entries.length||entries.some(([k,v])=>!allowed.includes(k)||
  typeof v!=='string'||v.length>max||!v.trim()))return null;
 return Object.fromEntries(entries);
};
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);
const parse=x=>{try{return JSON.parse(x)}catch{return null}};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
// Existing semantic editor keys include camelCase setting identifiers.
const validBookKey=x=>/^book\.[a-z][a-zA-Z0-9._:-]{1,80}$/.test(x);
const validRankKey=x=>/^honor\.rank\.(?:[0-9]|1[01])$/.test(x);
const fields=['ru','en','hintRu','hintEn'];
const rankFields=['nameRu','nameEn','benefitRu','benefitEn','requirementRu','requirementEn'];
const introFields=Object.keys(intro);
const locationFields=['nameRu','nameEn','mapId'];
const listValid=(x,type)=>{
 if(!Array.isArray(x)||x.length>40)return false;
 const keys=new Set();
 return x.every(entry=>{
  if(!plain(entry)||typeof entry.id!=='string'||!(/^[a-z][a-z0-9-]{0,35}$/.test(entry.id))||
   keys.has(entry.id))return false;
  keys.add(entry.id);
  const allowed=type==='zones'?locationFields:['nameRu','nameEn'];
  return Object.keys(entry).every(k=>k==='id'||allowed.includes(k))&&
   ['nameRu','nameEn'].every(k=>typeof entry[k]==='string'&&
    entry[k].trim()&&entry[k].length<=140)&&
   (type!=='zones'||entry.mapId==null||typeof entry.mapId==='string'&&
    (/^[0-9]{1,15}$/.test(entry.mapId)||/^[a-z][a-z0-9-]{1,63}$/.test(entry.mapId)));
 });
};
const validOverride=(key,value)=>{
 if(typeof key!=='string'||typeof value!=='string'||value.length>8000)return false;
 const data=parse(value);
 if(key==='wiki.labels')return plain(data)&&Object.keys(data).length>0&&
  Object.keys(data).length<=50&&Object.entries(data).every(([k,v])=>
   /^(?:chapter_(?:item|utility|monster|map|honor|npc|chest|instance|skill|soul)|honor_(?:overview|gain|ranks|monthly)|skill_filter_(?:player|racial|guild|special|variants|other|unknown|all))_(?:ru|en)$/.test(k)&&
   typeof v==='string'&&v.trim()&&v.length<=90&&
   Array.from(v).every(ch=>ch.charCodeAt(0)>=32));
 if(validBookKey(key))return cleanPatch(data,fields,360)!==null;
 if(validRankKey(key))return cleanPatch(data,rankFields,500)!==null;
 if(key==='honor.overview')return cleanPatch(data,introFields,2200)!==null;
 if(key==='honor.zones'||key==='honor.wars')return listValid(data,key.split('.')[1]);
 return false;
};
function patchFor(overrides,key){
 const full='guideedit.'+key;
 const translated=root.PandoraOwnerBilingual?.value(overrides,full)??overrides?.[full];
 return validOverride(key,translated)?parse(translated):null;
}
function book(overrides,key,defaults){
 const patch=patchFor(overrides,'book.'+key)||{};
 return {...defaults,...patch};
}
function summary(overrides,index,ru,en){
 const hint=hints[ru]||['',''];
 return book(overrides,'summary.'+index,{ru,en,hintRu:hint[0],hintEn:hint[1]});
}
function field(overrides,key,ru,en,hintRu='',hintEn=''){
 const desc=help[key]||[hintRu,hintEn];
 return book(overrides,key,{ru,en,hintRu:desc[0]||'',hintEn:desc[1]||''});
}
function article(overrides){
 const overview={...intro,...(patchFor(overrides,'honor.overview')||{})};
 const ranks=defaultRanks.map(x=>({...x,...patchFor(overrides,'honor.rank.'+x.id)}));
 const zones=patchFor(overrides,'honor.zones')||maps;
 const battles=patchFor(overrides,'honor.wars')||wars;
 return {overview,ranks,zones,battles};
}
root.PandoraHonorGuide=Object.freeze({
 summary,field,article,validOverride,patchFor,hints,help,defaultRanks,maps,wars,intro
});
})(typeof window==='undefined'?globalThis:window);
