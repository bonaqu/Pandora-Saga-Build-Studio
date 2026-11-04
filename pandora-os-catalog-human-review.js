(function(root){
'use strict';
const names={life:'Очки здоровья (ОЗ)',level:'Уровень',vit:'Выносливость',str:'Сила',
agi:'ПРВ (проворство)',dex:'ЛВК (ловкость)',spi:'Дух',int:'Интеллект',warding:'Уклонение',
ac:'Защита',magicProtection:'Магическая защита',name:'Название',desc:'Описание',
nameEn:'Название на английском',descEn:'Описание на английском',
d:'Описание на английском',
classes:'Доступные классы',effects:'Эффекты',slot:'Слот экипировки',W:'Атака',
PEN:'Пробитие',n:'Название на английском',blurbRu:'Описание',blurb:'Английское описание',
quest:'Задание',kind:'Тип',mobs:'Монстры',p:'Значение шанса в таблице',
slotAdd:'Дополнительные слоты',lo:'Нижняя граница',hi:'Верхняя граница'};
const elements={physical:'физическому урону',fire:'огню',cold:'холоду',
lightning:'молнии',poison:'яду',charm:'очарованию',magic:'магии',holy:'свету',dark:'тьме'};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const plural=(count,one,few,many)=>{
 const n=Math.abs(count)%100,units=n%10;
 return n>=11&&n<=14?many:units===1?one:units>=2&&units<=4?few:many;
};
const canonical=value=>Array.isArray(value)?value.map(canonical):
 plain(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const same=(a,b)=>root.PandoraOSCatalogReview?.equal
 ?root.PandoraOSCatalogReview.equal(a,b):
 JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const cleanText=text=>text.replace(/<br\s*\/?>/gi,'\n')
 .replace(/\r\n?/g,'\n').replace(/<\/?(?!item\b)[a-z][a-z0-9-]*(?:\s+[^<>]*)?>/gi,'');
const value=x=>x===undefined?'отсутствует':x===null?'не указано':
 typeof x==='number'?new Intl.NumberFormat('ru-RU').format(x):
 typeof x==='boolean'?(x?'да':'нет'):
 typeof x==='string'?(cleanText(x).length>160?cleanText(x).slice(0,157)+'…':cleanText(x)):
 Array.isArray(x)?x.length+' записей':'изменён состав';
const itemName=(id,ctx)=>{const item=ctx?.upstream?.items?.[id]||ctx?.baseline?.items?.[id];
 const n=item?.name?.ru||item?.name;return typeof n==='string'?n:'Предмет без подтверждённого названия'};
const monsterName=(id,ctx)=>ctx?.upstream?.monsters?.[id]?.name||
 ctx?.baseline?.monsters?.[id]?.name||'Монстр без подтверждённого названия';
const fieldName=path=>path.startsWith('resists.')?
 (elements[path.slice(8)]?'Сопротивление '+elements[path.slice(8)]:null):
 names[path]||null;

const sectionNames={
 weaponPlus:'Усиление оружия',magicPlus:'Усиление магии',
 raceInit:'Начальные характеристики рас',jobInit:'Начальные параметры классов',
 abilityPoint:'Очки характеристик',exp:'Опыт персонажа',
 lvModify:'Поправки уровней',dropModify:'Изменения добычи',
 levelCap:'Предел уровня',expCap:'Предел опыта',
 premium:'Премиум-параметры',forge:'Улучшение предметов',afk:'Параметры отсутствия',
 zoneDrops:'Добыча по локациям',limit:'Пределы мастерства',
 expCurve:'Опыт мастерства',get:'Начисление мастерства',branchNames:'Названия веток'
};
function describeCompound(kind,before,after,ctx,add,unknown){
 const old=before||{},next=after||{};
 const enumerate=(rows,key)=>{
   const map=new Map();
   for(const [index,record] of (rows||[]).entries()){
    const id=String(record?.[key]??index);
    if(map.has(id))unknown('Несколько записей с одинаковым ID: '+id);
    map.set(id,record);
   }
   return map;
 };
 const fields=(left,right)=>new Set([...Object.keys(left||{}),...Object.keys(right||{})]);
 let touched=0;
 const safeAdd=(title,a,b)=>{if(touched>=60){unknown('Остались изменения вне первых 60 строк');return}
   add(title,a,b);touched++};
 const shortItem=id=>{
  const result=itemName(id,ctx);
  if(result==='Предмет без подтверждённого названия')
   unknown('Предмет отсутствует в каталоге: '+String(id));
  return result;
 };
 if(kind==='trades'){
  const oldTrades=enumerate(old.trades,'id'),newTrades=enumerate(next.trades,'id');
  let changed=0;
  for(const id of new Set([...oldTrades.keys(),...newTrades.keys()])){
   const a=oldTrades.get(id),b=newTrades.get(id);if(same(a,b))continue;changed++;
   const row=a||b;
   const name='Обмен · '+shortItem(row?.i);
   if(!a||!b){safeAdd(name,a?'предусмотрен':'нет',
     b?'предусмотрен':'удалён');continue}
   if(a.i!==b.i)safeAdd('Обмен · Получаемый предмет',
     shortItem(a.i),shortItem(b.i));
   for(const [code,label] of [['gold','Золото'],['honor','Очки чести'],
     ['exp','Опыт']])if(a[code]!==b[code])safeAdd(name+' · '+label,a[code],b[code]);
   const material=items=>(items||[]).map(i=>shortItem(i.i)+' ×'+String(i.n??1)).join(', ');
   if(!same(a.mats,b.mats))safeAdd(name+' · Нужные предметы',
     material(a.mats),material(b.mats));
   const npcLabel=(ids,source)=>Array.isArray(ids)?ids.map(k=>
    source?.npcs?.[k]?.name||'NPC №'+k).join(', '):'не указаны';
   if(!same(a.npc,b.npc))safeAdd(name+' · NPC обмена',
     npcLabel(a.npc,old),npcLabel(b.npc,next));
   if(!same(a.limit,b.limit)){
    const limit=value=>{
      if(value==null)return 'без указанного ограничения';
      const period={daily:'в день',weekly:'в неделю',monthly:'в месяц'}[value.period];
      if(Number.isSafeInteger(value.n)&&value.n>=0&&period)
        return value.n+' '+plural(value.n,'раз','раза','раз')+' '+period;
      unknown('Обмен: неизвестный формат ограничения');
      return 'изменено неизвестное ограничение';
    };
    safeAdd(name+' · Лимит обменов',limit(a.limit),limit(b.limit));
   }
   for(const key of fields(a,b))
    if(!['id','i','gold','honor','exp','mats','npc','limit'].includes(key)&&
      !same(a[key],b[key]))unknown('Обмен №'+id+': '+key);
  }
  for(const section of ['npcs','mapNames','limitMeta'])
   if(!same(old[section],next[section])){
    safeAdd({npcs:'Персонажи обмена',mapNames:'Места обмена',
      limitMeta:'Ограничения обмена'}[section],
      'прежняя версия','обновлённые сведения');
    unknown('Обмены: '+section);
   }
  unknown('Обмены применяются только целым разделом');
  return 'Изменения в '+changed+' '+plural(changed,'рецепте','рецептах','рецептах')+
    ' обмена. Публикация касается всего раздела, а не отдельного рецепта.';
 }
 if(kind==='chests'){
  let changed=0;
  for(const [section,label] of [['boxes','Открываемый сундук'],['npc','Сундук у NPC']]){
   const left=enumerate(old[section],'i'),right=enumerate(next[section],'i');
   for(const id of new Set([...left.keys(),...right.keys()])){
    const a=left.get(id),b=right.get(id);
    if(same(a,b))continue;changed++;
    const title=label+' · '+shortItem(id);
    if(!a||!b){safeAdd(title,a?'есть':'нет',b?'есть':'удалён');continue}
    if(a.key!==b.key)safeAdd(title+' · Ключ',shortItem(a.key),shortItem(b.key));
    const oa=a.rolls||[],ob=b.rolls||[];
    for(let group=0;group<Math.max(oa.length,ob.length);group++){
     if(same(oa[group],ob[group]))continue;
     const slot=title+' · Набор наград '+(group+1);
     // Reward rows can be items or gold ranges. A gold reward has no item ID;
     // never identify it as an invented item or silently drop it.
     const rewards=rows=>{
      const result=new Map();
      for(const [index,row] of (rows||[]).entries()){
       const key=row?.i!=null?'item:'+String(row.i):
        Array.isArray(row?.gold)?'gold:'+index:'unknown:'+index;
       if(result.has(key))unknown('В сундуке несколько наград с одинаковым ID предмета: '+String(row?.i));
       if(key.startsWith('unknown:'))unknown('Награда без известного типа');
       result.set(key,row);
      }
      return result;
     };
     const beforeItems=rewards(oa[group]),afterItems=rewards(ob[group]);
     for(const itemId of new Set([...beforeItems.keys(),...afterItems.keys()])){
      const x=beforeItems.get(itemId),y=afterItems.get(itemId);
      if(same(x,y))continue;
      const goldReward=itemId.startsWith('gold:');
      const item=slot+' · '+(goldReward?'Золото':shortItem((x||y)?.i));
      if(!x||!y){
       safeAdd(item,x?'есть':'нет',y?'есть':'удалено');
       if(goldReward){
        const reward=x||y;
        if(Array.isArray(reward.gold))safeAdd(item+' · Сумма золота',
         x?'прошлая версия':'не было',
         y?reward.gold.map(value).join('–'):'удалено');
       }
       continue;
      }
      const goldValue=range=>Array.isArray(range)&&range.length===2&&
       range.every(n=>typeof n==='number'&&Number.isFinite(n))
       ?range.map(value).join('–'):'не указано';
      if(!same(x.gold,y.gold))safeAdd(item+' · Сумма золота',
       goldValue(x.gold),goldValue(y.gold));
      for(const [field,caption] of [['p','Шанс внутри набора'],
        ['n','Количество'],['plus','Уровень заточки'],
        ['soul','Душа'],['slotAdd','Дополнительный слот']])
       if(!same(x[field],y[field]))safeAdd(item+' · '+caption,x[field],y[field]);
      for(const field of fields(x,y))
       if(!['i','gold','p','n','plus','soul','slotAdd'].includes(field)&&
         !same(x[field],y[field]))unknown('Награда '+itemId+': '+field);
     }
    }
    for(const field of fields(a,b))
     if(!['i','rolls','key'].includes(field)&&!same(a[field],b[field]))
      unknown('Сундук '+id+': '+field);
   }
  }
  for(const section of ['npcId','masterKey'])
   if(!same(old[section],next[section]))unknown('Дополнительный параметр сундуков: '+section);
  unknown('Сундуки публикуются только полным разделом');
  return 'Изменения в '+changed+' '+plural(changed,'сундуке','сундуках','сундуках')+
    '. Значения шансов относятся к отдельным наборам наград. Порядок наборов тоже может иметь значение.';
 }
 if(kind==='tables'||kind==='expertise'){
  const sections=[];
  for(const name of fields(old,next)){
   if(same(old[name],next[name]))continue;
   sections.push(sectionNames[name]||'Другой раздел');
   // No inferred gameplay arithmetic; display only what is definitely different.
   if(typeof old[name]==='number'||typeof next[name]==='number')
     safeAdd(sectionNames[name]||'Другой раздел',old[name],next[name]);
   else safeAdd(sectionNames[name]||'Другой раздел','прежняя версия','изменены данные');
   if(!sectionNames[name])unknown('Неизвестный раздел: '+name);
  }
  unknown('Игровые формулы и ограничения требуют полной отдельной проверки');
  return 'Изменены разделы: '+sections.join(', ')+
    '. Для проверки формул нужны исходные значения и правила расчёта.';
 }
 unknown('Неизвестный составной раздел');
 return 'Изменён состав данных, правила расчёта пока не подтверждены.';
}

function describe(change,ctx={}){
 let title=typeof (change.after?.name||change.before?.name)==='string'
  ?(change.after?.name||change.before?.name):change.title;
 let summary='',caution='',uncertain=false;
 const rows=[],technical=[];
 const readable=(text,label)=>{
  if(typeof text!=='string')return text;
  const en=/английск/i.test(label),language=en?'en':'ru';
  const lookup=id=>{
   const item=ctx.upstream?.items?.[id]||ctx.baseline?.items?.[id];
   if(!item)return null;
   if(en)return ctx.upstream?.['strings.en']?.items?.[id]?.n||
    ctx.baseline?.['strings.en']?.items?.[id]?.n||item.name;
   return item.name?.ru||item.name;
  };
  if(/описани/i.test(label)){
   if(root.PandoraItemPresentation?.descriptionText)
    return root.PandoraItemPresentation.descriptionText(text,lookup,language);
   return cleanText(text).replace(/<item\s+([0-9]{1,12})\s*\/?>/gi,(_,id)=>
    lookup(id)||(en?'Unknown item':'Неизвестный предмет'));
  }
  return cleanText(text).replace(/<item\s+([0-9]{1,12})\s*\/?>/gi,(_,id)=>
   lookup(id)||(en?'Unknown item':'Неизвестный предмет'));
 };
 const shortened=text=>typeof text==='string'&&text.length>160?text.slice(0,157)+'…':text;
 const add=(label,a,b)=>{if(same(a,b))return;
  const beforeText=typeof a==='string'?readable(a,label):null;
  const afterText=typeof b==='string'?readable(b,label):null;
  const numeric=typeof a==='number'&&Number.isFinite(a)&&typeof b==='number'&&Number.isFinite(b);
  const delta=numeric?b-a:null;
  const isSlots=/Доп\\. слоты$/.test(label);
  const readableSlots=x=>x==null?'не указаны':Number.isFinite(x)?
   value(x)+' '+plural(x,'дополнительный слот','дополнительных слота','дополнительных слотов'):
   value(x);
  const sourceLinks=text=>typeof text==='string'?
   [...text.matchAll(/<item\\s+([0-9]{1,12})\\s*\\/?>/gi)].map(match=>match[1]).join(','):'';
  const beforeLinks=sourceLinks(a),afterLinks=sourceLinks(b);
  const sameVisible=beforeText!==null&&afterText!==null&&beforeText===afterText&&a!==b;
  const linkChanged=beforeLinks!==afterLinks;
  const note=linkChanged?
   (afterLinks&&!beforeLinks?'В исходном тексте появилась игровая ссылка на предмет.':
    beforeLinks&&!afterLinks?'Игровая ссылка на предмет удалена.':
    'Изменилась привязка игровой ссылки к предмету.'):
   sameVisible?'Видимый текст совпадает. Различие осталось только в исходной записи.':'';
  rows.push({label,before:isSlots?readableSlots(a):beforeText===null?value(a):shortened(beforeText),
   after:isSlots?readableSlots(b):afterText===null?value(b):shortened(afterText),
   numeric,delta,note,linkChanged,sameVisible,
   sourceBefore:/описани/i.test(label)&&typeof a==='string'?a:null,
   sourceAfter:/описани/i.test(label)&&typeof b==='string'?b:null,
   beforeFull:beforeText===null?undefined:beforeText,
   afterFull:afterText===null?undefined:afterText,
   difference:delta===null||delta===0?'':(delta>0?'+':'−')+value(Math.abs(delta))});
 };
 const unknown=(path)=>{uncertain=true;technical.push(path)};
 function walk(a,b,prefix='',depth=0){
  if(same(a,b))return;
  if(plain(a)&&plain(b)&&depth<3){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)]))
    walk(a[key],b[key],prefix?prefix+'.'+key:key,depth+1);
   return;
  }
  const label=fieldName(prefix);
  if(!label){unknown(prefix||'неизвестные данные');return}
  if(plain(a)||plain(b)||Array.isArray(a)||Array.isArray(b))uncertain=true;
  add(label,a,b);
 }
 const kind=change.dataset;
 if(kind==='meta'){
  title='Служебные сведения игрового каталога';
  const old=change.before||{},next=change.after||{};
  const sha=new Set([...Object.keys(old.sha||{}),...Object.keys(next.sha||{})]);
  const changed=[...sha].filter(k=>old.sha?.[k]!==next.sha?.[k]);
  if(changed.length)add('Проверочные сведения файлов',changed.length+' изменились',
   changed.length+' файлов требуют проверки');
  for(const key of new Set([...Object.keys(old),...Object.keys(next)])){
   if(key!=='sha'&&!same(old[key],next[key]))walk(old[key],next[key],key);
  }
  summary=changed.length?'Изменились контрольные сведения: '+changed.length+' '+
   plural(changed.length,'файл','файла','файлов')+'. Это не изменение характеристик.':
   'Изменились служебные параметры каталога, не являющиеся игровыми характеристиками.';
  caution='Служебный раздел: не рекомендуется принимать отдельно от проверенных игровых изменений.';
  uncertain=true;
  technical.push(...changed.map(x=>'Файл '+x+' — изменена контрольная сумма'));
 }else if(kind==='drops'){
  title='Добыча · '+monsterName(change.key,ctx);
  const old=change.before||{},next=change.after||{};
  if(title.includes('без подтверждённого названия'))
   unknown('Монстр отсутствует в каталоге: '+change.key);
  for(const [group,groupName] of [['d','Обычная добыча'],['s','Дополнительная добыча']]){
   const a=old[group]||[],b=next[group]||[];
   const byItem=list=>{const out=new Map();for(const entry of list){
    const key=String(entry?.i)+' / '+String(entry?.t||'');
    const set=out.get(key)||[];
    if(set.length)unknown('Несколько одинаковых предметов в добыче: '+key);
    set.push(entry);out.set(key,set);
   }return out};
   const before=byItem(a),after=byItem(b);
   for(const key of new Set([...before.keys(),...after.keys()])){
    const aa=before.get(key)||[],bb=after.get(key)||[];
    for(let i=0;i<Math.max(aa.length,bb.length);i++){
     if(same(aa[i],bb[i]))continue;
     const id=(aa[i]||bb[i])?.i,itemTitle=itemName(id,ctx);
     if(itemTitle==='Предмет без подтверждённого названия')
      unknown('Добыча содержит отсутствующий в каталоге предмет: '+String(id));
     const item=groupName+' · '+itemTitle;
     if(!aa[i]||!bb[i])add(item,aa[i]?'есть':'нет',bb[i]?'есть':'нет');
     else for(const field of new Set([...Object.keys(aa[i]),...Object.keys(bb[i])])){
      if(field==='i'||field==='t'||same(aa[i][field],bb[i][field]))continue;
      const label={p:'Шанс в таблице',n:'Количество',slotAdd:'Доп. слоты',
       lo:'Нижняя граница',hi:'Верхняя граница'}[field];
      if(label)add(item+' · '+label,aa[i][field],bb[i][field]);
      else unknown(group+'.'+field);
     }
    }
   }
  }
  summary='Изменилась таблица добычи монстра. Значение шанса в таблице не гарантирует выпадение.';
  if(!rows.length)unknown('Порядок или неизвестный параметр добычи');
 }else if(kind==='instances'){
  title='Список подземелий и заданий';
  const toMap=rows=>new Map((rows||[]).map(row=>[String(row.id),row]));
  const a=toMap(change.before),b=toMap(change.after);
  for(const id of new Set([...a.keys(),...b.keys()])){
   if(same(a.get(id),b.get(id)))continue;
   const old=a.get(id),next=b.get(id);
   const name=next?.name||old?.name||'Задание №'+id;
   if(!old||!next)add(name,old?'есть':'нет',next?'есть':'нет');
   else{
    for(const key of ['name','blurbRu','blurb','kind','quest','mobs'])if(!same(old[key],next[key])){
     const render=v=>key==='mobs'?(v||[]).map(x=>monsterName(x,ctx)).join(', '):v;
     add(name+' · '+(names[key]||key),render(old[key]),render(next[key]));
    }
    for(const key of new Set([...Object.keys(old),...Object.keys(next)]))
     if(!['id','name','blurbRu','blurb','kind','quest','mobs'].includes(key)&&!same(old[key],next[key]))
      unknown(name+'.'+key);
   }
  }
  summary='Изменились данные подземелий или сюжетных заданий.';
 }else if(change.key==='@dataset'){
  title={trades:'Обмены у NPC',tables:'Игровые формулы',expertise:'Мастерство',
   chests:'Содержимое сундуков'}[kind]||title;
  summary=describeCompound(kind,change.before,change.after,ctx,add,unknown);
  // Atomic datasets cannot be partly published even when many individual differences can be read.
  uncertain=true;
 }else{
  if(kind==='strings.en'){
   const [section,id]=change.key.split('/');
   const record=ctx.upstream?.[section]?.[id]||ctx.baseline?.[section]?.[id];
   const localized=record?.name;
   const instance=(ctx.upstream?.instances||ctx.baseline?.instances||[])
    .find?.(row=>String(row.id)===String(id))?.name;
   const branch=ctx.upstream?.meta?.branchLabels?.[id]||
    ctx.baseline?.meta?.branchLabels?.[id];
   const npc=ctx.upstream?.trades?.npcs?.[id]?.name||
    ctx.baseline?.trades?.npcs?.[id]?.name;
   const npcMap=ctx.upstream?.trades?.mapNames?.[id]?.name||
    ctx.baseline?.trades?.mapNames?.[id]?.name;
   const linked=[localized,instance,branch,npc,npcMap].find(v=>
    typeof v==='string'&&v.trim());
   const captions={items:'Предмет',monsters:'Монстр',skills:'Умение',
    classes:'Класс',maps:'Локация',souls:'Душа',instances:'Подземелье',
    branches:'Ветка мастерства',tradeNpcs:'NPC',tradeMaps:'Место обмена'};
   title=(captions[section]||'Английский перевод')+' · '+
    (linked||'название пока не найдено');
   if(!linked)unknown('Русское название записи не найдено: '+change.key);
   if(typeof change.before==='string'||typeof change.after==='string')
    add('Название на английском',change.before,change.after);
   else walk(change.before||{},change.after||{});
   summary='Изменения английского названия или описания.';
  }else{
   // For a new or removed record, show the known fields instead of a bare ID.
   walk(change.before||{},change.after||{});
   summary={monsters:'Характеристики монстра',items:'Свойства предмета',
    skills:'Параметры умения',classes:'Свойства класса'}[kind]||'Игровые данные';
  }
  if(change.kind==='added')summary='Добавлено: '+title+'. '+summary;
  if(change.kind==='removed')summary='Удалено: '+title+'. '+summary;
 }
 const descriptionRow=rows.some(row=>/описани/i.test(row.label));
 const preview=rows.slice(0,2).map(row=>row.label+': '+
   String(row.before).replace(/\s+/g,' ')+' → '+String(row.after).replace(/\s+/g,' ')).join(' · ');
 if(descriptionRow&&!['meta','instances','trades','chests','tables','expertise'].includes(kind))
  summary='Изменилось описание. Полный текст «было → стало» — в подробностях ниже.';
 else if(preview&&!['drops','meta','instances','trades','chests','tables','expertise'].includes(kind))
  summary=(change.kind==='added'?'Добавлено: '+title+'. ':
    change.kind==='removed'?'Удалено: '+title+'. ':'')+
   preview+(rows.length>2?' · ещё '+(rows.length-2):'');
 if(uncertain&&!caution)caution='Часть параметров требует ручной проверки перед публикацией.';
 return {title,summary,rows,technical,uncertain,caution,service:kind==='meta'};
}
root.PandoraCatalogHumanReview=Object.freeze({describe});
})(typeof window==='undefined'?globalThis:window);
