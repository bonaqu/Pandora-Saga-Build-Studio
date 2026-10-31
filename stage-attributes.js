(function(root){
'use strict';
// Partial source-backed combat preview. Do not claim current OS parity for missing buffs or procs.
function make(tag,attrs={},children=[]){
 const n=document.createElement(tag);
 for(const [key,value] of Object.entries(attrs)){
  if(key==='text')n.textContent=value;
  else if(key==='class')n.className=value;
  else if(key.startsWith('on'))n.addEventListener(key.slice(2),value);
  else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(key))
   n[key]=Boolean(value);
  else if(value!==null&&value!==undefined)n.setAttribute(key,String(value));
 }
 for(const child of children)n.append(typeof child==='string'?document.createTextNode(child):child);
 return n;
}
function render(target,{page,items,icon,onPage,onClose,modifiers}){
 target.replaceChildren();
 target.append(make('div',{class:'stage-attribute-head'},[
  make('strong',{text:'Атрибуты персонажа'}),
  make('button',{type:'button',text:'✕',onclick:onClose,'aria-label':'Вернуть портрет'})
 ]));
 const nav=make('nav',{class:'stage-attribute-tabs','aria-label':'Разделы характеристик'});
 for(const [name,label] of [['attack','Атака'],['defense','Защита'],['effects','Эффекты']])
  nav.append(make('button',{type:'button',text:label,class:page===name?'chosen':'',
  'aria-pressed':String(page===name),onclick:()=>onPage(name)}));
 target.append(nav);
 const body=make('div',{class:'stage-attribute-scroll'});
 const intro=page==='attack'?'Параметры оружия':
 page==='defense'?'Защита снаряжения':'Бонусы предметов и душ';
 body.append(make('p',{class:'stage-attribute-note',text:intro}));
 const selected=items.filter(x=>page==='attack'?x.record?.slot==='weapon':
 page==='defense'?x.record&&(x.record.AC!=null||x.record.block!=null):x.record);
 if(!selected.length)body.append(make('p',{class:'muted',text:'Нет записей для этой вкладки'}));
 for(const row of selected){
  const rec=row.record,card=make('section',{class:'stage-attribute-row'});
  const top=make('div',{class:'stage-attribute-identity'});
  const src=icon(rec);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));top.append(img)}
  top.append(make('b',{text:root.PandoraItemPresentation?.displayName(rec,'Предмет без названия')||'Предмет без названия'}));
  card.append(top);
  if(page==='attack'){
   card.append(make('p',{text:'Базовая атака '+(rec.W??'—')+' · Дальность '+(rec.range??'—')+
    ' · Скорость '+(rec.atkspeed??'—')+' · +'+row.refinement}));
  }else if(page==='defense'){
   card.append(make('p',{text:'Базовая защита '+(rec.AC??'—')+' · Блок '+(rec.block??'—')+
    ' · Гнёзда '+(rec.soulslot??'—')+' · +'+row.refinement}));
  }else{
   const effects=Array.isArray(rec.effects)?rec.effects:[];
   if(rec.desc)card.append(make('p',{class:'stage-rich-desc',text:rec.desc}));
   // Raw EP_* codes are database diagnostics, not a useful player-facing description.
   if(effects.length&&root.PandoraStudioAdminActive?.())card.append(make('p',{class:'stage-attribute-note',text:
    'Исходные коды эффектов: '+effects.map(e=>e.func+
     (e.a==null?'':' ('+e.a+(e.b==null?'':', '+e.b)+')')).join('; ')}));
   if(row.souls.length)for(const soul of row.souls){
    card.append(make('p',{class:'stage-attribute-soul',text:'✦ '+(root.PandoraItemPresentation?.displayName(soul,'Душа без названия')||'Душа без названия')+
     ' · '+(soul.desc||'Описание души не найдено')}));
   }
  }body.append(card);
 }
 if(page==='effects'){
  if(modifiers?.combat?.manaCost){
   const mp=modifiers.combat.manaCost,card=make('section',{class:'stage-attribute-row'});
   card.append(make('strong',{text:'Расход ОМ (частичный расчёт)'}),
    make('p',{text:'Индекс остаточного расхода: '+mp.remaining+'%'}),
    make('p',{text:'База от ИНТ: '+mp.base+'%'}),
    make('p',{text:'Расовая способность: −'+mp.racial+'%'}),
    make('p',{text:'Снаряжение и души: −'+mp.equipment+'%'}),
    make('p',{class:'stage-attribute-note',
     text:'Это расчёт без активных эффектов и неструктурированных бонусов заточки; 100% означает исходный расход ОМ.'}));
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
   const percent=new Set(['healingSkills','attackPercent','fireMagic','iceMagic',
    'lightningMagic','burn','freeze','knockdown','castingResist','mountedRelease',
    'incomingCriticalChance','incomingCriticalDamage','potionRecovery',
    'incomingPhysical','rangedDodge','frontAttack']);
   const card=make('section',{class:'stage-attribute-row'});
   card.append(make('strong',{text:'Титул чести: '+honor.ru}));
   for(const [key,value] of Object.entries(honor.effects)){
    if(key==='allAttributes')continue; // already included in visible six stats
    card.append(make('p',{text:(labels[key]||key)+': '+(value>0?'+':'')+value+
     (percent.has(key)?'%':'')}));
   }
   body.prepend(card);
  }
  if(modifiers?.potion){
   const potion=make('section',{class:'stage-attribute-row'});
   potion.append(make('strong',{text:'Действие зелий'}),
    make('p',{text:'Эффективность: '+modifiers.potion.percent+'%'}));
   const parts=[
    ['Выносливость (базовая эффективность)',modifiers.potion.base],
    ['Знахарство (расовая способность человека)',modifiers.potion.racial],
    ['Улучшение лечения (мастерство ближнего боя, воин с 12 уровня)',modifiers.potion.mastery],
    ['Титул чести',modifiers.potion.honor],
    ['Экипировка и души',modifiers.potion.equipment],
    ['Руна Чо Ын',modifiers.potion.rune]
   ];
   for(const [name,value] of parts){
    if(!Number.isFinite(value)||value===0)continue;
    potion.append(make('p',{text:name+': '+(name.startsWith('Выносливость')?'':'+')+value+'%'}));
   }
   body.prepend(potion);
  }
 }
 if(page==='attack'&&modifiers?.combat){
  const cm=modifiers.combat,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Базовые боевые показатели (частичный расчёт)'}));
  card.append(make('p',{text:'Физическая атака оружия: '+
   (cm.attack?.known??'—')+' (без дополнительных боевых усилений)'}),
   make('p',{text:'Точность: '+cm.accuracy.known+' (база '+
    cm.accuracy.base+', бонусы '+(cm.accuracy.known-cm.accuracy.base)+')'}),
   make('p',{text:'Уклонение: '+cm.dodge.known+' (база '+
    cm.dodge.base+', бонусы '+(cm.dodge.known-cm.dodge.base)+')'}),
   make('p',{text:'Критический шанс: '+cm.critical.known+
    ' (без временных усилений)'}));
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
  if(cm.activeSkills?.lunge)card.append(make('p',{text:'Рывок: +15 к индексу скорости атаки'}));
  if(cm.accuracy.percentage?.length){
   const total=cm.accuracy.percentage.reduce((sum,e)=>sum+e.bonus,0);
   card.append(make('p',{text:'Процентная точность вещей: '+
    (total>=0?'+':'')+total+' (поштучное округление вверх)'}));
  }
  if(cm.accuracy.passive)card.append(make('p',{text:'Пассивная меткость лучника: +'+
   cm.accuracy.passive}));
  if(cm.dodge.passive)card.append(make('p',{text:'Пассивное уклонение: +'+
   cm.dodge.passive}));
  if(cm.racialRate.accuracy)card.append(make('p',{text:
   'Подавление гнева: +'+cm.racialRate.accuracy+
   '% к точности (не включено в частичный итог: порядок округления OS не проверен)'}));
  if(cm.racialRate.dodge)card.append(make('p',{text:
   'Интуиция: +'+cm.racialRate.dodge+
   '% к уклонению (не включено в частичный итог: порядок округления OS не проверен)'}));
  if(cm.magicAttack)card.append(make('p',{text:'Магическая атака (частичный показатель): '+
   cm.magicAttack.known+'% (ИНТ '+cm.magicAttack.intelligence+
   ', пассивка '+cm.magicAttack.passive+', оружие '+cm.magicAttack.staff+')'}));
  card.append(make('p',{text:'Физический урон оружия, пассивки и титулы: +'+
   cm.weaponPhysical}),make('p',{text:'АТК сзади: +'+cm.backAttack+
   ', спереди: +'+cm.frontAttack}),make('p',{text:'Откат умений (базовый индекс): '+
   (cm.cooldown??'—')+'%'}));
  if(cm.attackSpeed)card.append(make('p',{text:'Скорость атаки (индекс): '+
   cm.attackSpeed.known+' (база '+cm.attackSpeed.base+
   ', экипировка '+(cm.attackSpeed.equipment>=0?'+':'')+
   cm.attackSpeed.equipment+', навыки +'+cm.attackSpeed.lunge+')'}));
  if(cm.castingSpeed)card.append(make('p',{text:'Скорость заклинаний (базовый индекс): '+
   cm.castingSpeed.base}));
  card.append(make('p',{class:'stage-attribute-note',
   text:'Источник: Remaked Legacy + таблицы OS. Учитываются выбранные подтверждённые активные умения; прочие условные навыки, комплекты и эффекты сервера всё ещё не рассчитаны.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.combat?.defense){
  const df=modifiers.combat.defense,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Защита надетых вещей (частичный расчёт)'}),
   make('p',{text:'Подтверждённая основа: '+df.known}),
   make('p',{text:'Базовая защита снаряжения: '+df.armor}),
   make('p',{text:'Бонус заточки брони и щита: +'+df.refinement}),
   make('p',{text:'Прямые бонусы вещей и душ: '+(df.equipment>=0?'+':'')+df.equipment}),
   make('p',{text:'Титул чести: '+(df.honor>=0?'+':'')+df.honor}),
   make('p',{text:'Эффект выбранной стойки: '+(df.activeBonus>=0?'+':'')+df.activeBonus}),
   make('p',{class:'stage-attribute-note',
    text:'Заточка щита и брони учтена по исходной формуле Remaked: ⌊+N×1,5⌋ за каждый предмет. Остальные условные эффекты и временные навыки ещё не полностью учитываются.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.combat){
  const cm=modifiers.combat,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Дополнительные защитные параметры'}),
   make('p',{text:'Изменение шанса входящего крита: '+cm.criticalIncoming}),
   make('p',{text:'Множитель входящего критического урона: '+
    cm.criticalIncomingDamage+'%'}),
   make('p',{text:'Базовый исходящий критический урон: '+cm.criticalDamage+'%'}),
   make('p',{class:'stage-attribute-note',
    text:'Частичные индексы по Remaked: навыки, душевные эффекты и условия серверного боя пока не все учтены.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.resistances){
  const rs=modifiers.resistances,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Известные сопротивления (частичный расчёт)'}));
  const labels={fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
   charm:'Очарование',light:'Свет',dark:'Тьма',magic:'Магия'};
  for(const [key,value] of Object.entries(rs.elements)){
   if(value===0)continue;
   card.append(make('p',{text:labels[key]+': '+(value>0?'+':'')+value}));
  }
  card.append(make('p',{text:'Физические состояния: '+rs.states.physical}),
   make('p',{text:'Психические состояния: '+rs.states.mental}));
  if(rs.mitigation.physical)card.append(make('p',{text:'Получаемый физический урон: '+
   rs.mitigation.physical+'%'}));
  if(rs.mitigation.magic)card.append(make('p',{text:'Получаемый магический урон: '+
   rs.mitigation.magic+'%'}));
  card.append(make('p',{class:'stage-attribute-note',
   text:'Включены подтверждённые базовые формулы, расовые способности, честь и структурированные эффекты вещей/душ; остальные боевые усиления пока не учтены.'}));
  body.prepend(card);
 }
 if(page==='defense'&&modifiers?.regeneration){
  const regen=modifiers.regeneration,card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Скорость естественного восстановления'}),
   make('p',{text:'ОЗ: '+regen.hp.total+' (база '+regen.hp.base+
    ', гильдия +'+regen.hp.guild+', лечение +'+regen.hp.healing+')'}),
   make('p',{text:'ОМ: '+regen.mp.total+' (база '+regen.mp.base+
    ', гильдия +'+regen.mp.guild+', лечение +'+regen.mp.healing+')'}),
   make('p',{class:'stage-attribute-note',
    text:'Показатели скорости из Remaked, не количество ОЗ/ОМ за тик. Эффекты экипировки и активных навыков пока не включены.'}));
  body.prepend(card);
 }
 const totals=modifiers?.effects?.bonuses||{};
 const names={fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд',
 charm:'Очарование',light:'Свет',dark:'Тьма',magic:'Магия',
 accuracy:'Точность',dodge:'Уклонение',criticalChance:'Критический шанс'};
 const active=Object.entries(totals).filter(([key])=>names[key]&&
  (page==='defense'? !['accuracy','dodge','criticalChance'].includes(key):
   page==='attack'?['accuracy','dodge','criticalChance'].includes(key):true));
 if(active.length){
  const card=make('section',{class:'stage-attribute-row'});
  card.append(make('strong',{text:'Известные бонусы снаряжения и душ'}));
  for(const [key,val] of active)card.append(make('p',{text:names[key]+': '+(val>=0?'+':'')+val}));
  body.prepend(card);
 }
 body.append(make('p',{class:'stage-attribute-warning',
  text:'Некоторые эффекты, комплекты и усиления пока не учитываются в расчётах.'}));
 target.append(body);
}
root.PandoraStageAttributes=Object.freeze({render});
})(typeof window==='undefined'?globalThis:window);
