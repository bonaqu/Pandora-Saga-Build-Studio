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
 'Сопр. аном. тел.':['Устойчивость к физическим негативным состояниям.','Resistance to physical status ailments.'],
 'Сопр. аном. дух.':['Устойчивость к психическим негативным состояниям.','Resistance to mental status ailments.'],
 'Сопр. магии':['Общее сопротивление магическим воздействиям.','Overall magic resistance.']
});
const help=Object.freeze({
 'defense.hpRecoverySpeed':['Индекс скорости восстановления ОЗ. Не ОЗ/сек.','HP recovery speed index, not HP per second.'],
 'defense.mpRecoverySpeed':['Индекс скорости восстановления ОМ. Не ОМ/сек.','MP recovery speed index, not MP per second.'],
 'defense.hpRecoveryAmount':['Расчётное количество ОЗ при пассивном восстановлении.','Estimated HP amount of passive recovery.'],
 'defense.mpRecoveryAmount':['Расчётное количество ОМ при пассивном восстановлении.','Estimated MP amount of passive recovery.'],
 'buffs.honor':['Выбор одного пассивного умения за честь. Порог ранга Count — 129 000 «Вся честь» и 640 000 золота.','Simulate one Honor passive. Count threshold: 129,000 Total Honor and 640,000 gold.'],
 'buffs.guild':['Бонусы гильдии зависят от её уровня и выбранных усилений.','Guild bonuses depend on guild level and selected enhancements.']
});
const defaultRanks=Object.freeze([
 {id:0,nameRu:'Оруженосец',nameEn:'Page',points:null,gold:0,
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
  benefitRu:'Новые предметы за честь.',benefitEn:'Additional Honor exchange items.'},
 {id:9,nameRu:'Герцог',nameEn:'Duke',points:null,gold:0,top:15,
  benefitRu:'На месяц: плащ победителя своей нации.',benefitEn:'One-month national Victor cloak.'},
 {id:10,nameRu:'Кронпринц',nameEn:'Prince',points:null,gold:0,top:5,
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
 overviewRu:'Честь — PvP-ресурс. При вступлении в нацию персонаж получает 1 000 очков. За PvP-победы и участие в войнах можно заработать ещё честь.',
 overviewEn:'Honor is a PvP resource. Joining a nation grants 1,000 Honor. PvP victories and wars provide further Honor.',
 gainRu:'Очки чести получают за победу над игроками вражеских наций в PvP-локациях и за участие в войнах.',
 gainEn:'Earn Honor by defeating players of enemy nations in PvP zones and participating in wars.',
 lossRu:'Честь может уменьшаться после гибели от вражеского игрока. По историческим правилам — также при смерти от монстра, если потеря опыта превышает накопленный опыт уровня.',
 lossEn:'Honor can decrease after death to an enemy player. Under historic rules, also on monster death if XP loss exceeds accumulated XP at the current level.',
 currentRu:'С 23 октября 2026 года на OS: «Честь» — расходуемый ресурс; «Вся честь» — общий заработанный запас для рангов и рейтинга. Оба показателя могут уменьшаться после смерти.',
 currentEn:'Since October 23, 2026 on OS: “Honor” is spendable; “Total Honor” tracks lifetime earned Honor for ranks and leaderboards. Both can decrease on death.',
 ranksRu:'12 рангов. Обычные ранги требуют «Вся честь» и игровое золото. Высшие места определяются результатами прошлого месяца и действуют один месяц.',
 ranksEn:'12 ranks. Ordinary ranks require Total Honor and gold. Monthly top rankings use the previous month and last one month.',
 cloaksRu:'Награды по нации: Империя — Вечный плащ; Союз — Великолепный плащ; Королевство — Священный плащ (победителя, монарха или императора).',
 cloaksEn:'Nation rewards: Empire — Eternal, Confederation — Magnificent, Kingdom — Sacred cloaks (Victor, Monarch or Emperor tier).'
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
const validBookKey=x=>/^book\.[a-z][a-z0-9._:-]{1,80}$/.test(x);
const validRankKey=x=>/^honor\.rank\.(?:[0-9]|1[01])$/.test(x);
const fields=['ru','en','hintRu','hintEn'];
const rankFields=['nameRu','nameEn','benefitRu','benefitEn'];
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
    (/^[0-9]{1,15}$/.test(entry.mapId)||['el-beht','astir-underground'].includes(entry.mapId)));
 });
};
const validOverride=(key,value)=>{
 if(typeof key!=='string'||typeof value!=='string'||value.length>8000)return false;
 const data=parse(value);
 if(validBookKey(key))return cleanPatch(data,fields,360)!==null;
 if(validRankKey(key))return cleanPatch(data,rankFields,500)!==null;
 if(key==='honor.overview')return cleanPatch(data,introFields,1800)!==null;
 if(key==='honor.zones'||key==='honor.wars')return listValid(data,key.split('.')[1]);
 return false;
};
function patchFor(overrides,key){
 const full='guideedit.'+key;
 return validOverride(key,overrides?.[full])?parse(overrides[full]):null;
}
function book(overrides,key,defaults){
 const patch=patchFor(overrides,'book.'+key)||{};
 return {...defaults,...patch};
}
function summary(overrides,index,ru,en){
 const hint=hints[ru]||['Параметр персонажа.','Character statistic.'];
 return book(overrides,'summary.'+index,{ru,en,hintRu:hint[0],hintEn:hint[1]});
}
function field(overrides,key,ru,en,hintRu='',hintEn=''){
 const desc=help[key]||[hintRu,hintEn];
 return book(overrides,key,{ru,en,hintRu:desc[0]||'Описание параметра.',hintEn:desc[1]||'Stat description.'});
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
