(function(root){
'use strict';
const names={life:'Очки здоровья (ОЗ)',level:'Уровень',vit:'Выносливость',str:'Сила',
agi:'Ловкость',dex:'Точность',spi:'Дух',int:'Интеллект',warding:'Уклонение',
ac:'Защита',magicProtection:'Магическая защита',name:'Название',desc:'Описание',
nameEn:'Название на английском',descEn:'Описание на английском',
classes:'Доступные классы',effects:'Эффекты',slot:'Слот экипировки',W:'Атака',
PEN:'Пробитие',n:'Название',blurbRu:'Описание',blurb:'Английское описание',
quest:'Задание',mobs:'Монстры',p:'Значение шанса в таблице',
slotAdd:'Дополнительные слоты',lo:'Нижняя граница',hi:'Верхняя граница'};
const elements={physical:'физическому урону',fire:'огню',cold:'холоду',
lightning:'молнии',poison:'яду',charm:'очарованию',magic:'магии',holy:'свету',dark:'тьме'};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const value=x=>x===undefined?'отсутствует':x===null?'не указано':
 typeof x==='number'?new Intl.NumberFormat('ru-RU').format(x):
 typeof x==='boolean'?(x?'да':'нет'):
 typeof x==='string'?(x.length>160?x.slice(0,157)+'…':x):
 Array.isArray(x)?x.length+' записей':'изменён состав';
const itemName=(id,ctx)=>{const item=ctx?.upstream?.items?.[id]||ctx?.baseline?.items?.[id];
 const n=item?.name?.ru||item?.name;return typeof n==='string'?n:'Предмет №'+id};
const monsterName=(id,ctx)=>ctx?.upstream?.monsters?.[id]?.name||
 ctx?.baseline?.monsters?.[id]?.name||'Монстр №'+id;
const fieldName=path=>path.startsWith('resists.')?
 'Сопротивление '+(elements[path.slice(8)]||'неизвестному типу'):
 names[path]||null;
function describe(change,ctx={}){
 let title=change.title,summary='',caution='',uncertain=false;
 const rows=[],technical=[];
 const add=(label,a,b)=>{if(same(a,b))return;rows.push({label,before:value(a),after:value(b),
  numeric:typeof a==='number'&&typeof b==='number'});};
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
  summary='Изменились служебные сведения '+changed.length+' файлов, а не боевые характеристики.';
  caution='Служебный раздел: не рекомендуется принимать отдельно от проверенных игровых изменений.';
  uncertain=true;
  technical.push(...changed.map(x=>'Файл '+x+' — изменена контрольная сумма'));
 }else if(kind==='drops'){
  title='Добыча · '+monsterName(change.key,ctx);
  const old=change.before||{},next=change.after||{};
  for(const [group,groupName] of [['d','Обычная добыча'],['s','Дополнительная добыча']]){
   const a=old[group]||[],b=next[group]||[];
   const byItem=list=>{const out=new Map();for(const entry of list){
    const key=String(entry?.i)+' / '+String(entry?.t||'');
    const set=out.get(key)||[];set.push(entry);out.set(key,set);
   }return out};
   const before=byItem(a),after=byItem(b);
   for(const key of new Set([...before.keys(),...after.keys()])){
    const aa=before.get(key)||[],bb=after.get(key)||[];
    for(let i=0;i<Math.max(aa.length,bb.length);i++){
     if(same(aa[i],bb[i]))continue;
     const id=(aa[i]||bb[i])?.i,item=groupName+' · '+itemName(id,ctx);
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
    for(const key of ['name','blurbRu','quest','mobs'])if(!same(old[key],next[key])){
     const render=v=>key==='mobs'?(v||[]).map(x=>monsterName(x,ctx)).join(', '):v;
     add(name+' · '+(names[key]||key),render(old[key]),render(next[key]));
    }
    for(const key of new Set([...Object.keys(old),...Object.keys(next)]))
     if(!['id','name','blurbRu','quest','mobs'].includes(key)&&!same(old[key],next[key]))
      unknown(name+'.'+key);
   }
  }
  summary='Изменились данные подземелий или сюжетных заданий.';
 }else if(change.key==='@dataset'){
  title={trades:'Обмены у NPC',tables:'Игровые формулы',expertise:'Мастерство',
   chests:'Содержимое сундуков'}[kind]||title;
  summary='Изменился состав сложных игровых данных.';
  unknown('Составной игровой раздел');
 }else{
  if(kind==='strings.en')title='Английский перевод: '+change.title;
  walk(change.before,change.after);
  summary={monsters:'Характеристики монстра',items:'Свойства предмета',
   skills:'Параметры умения'}[kind]||'Игровые данные';
 }
 const preview=rows.slice(0,2).map(row=>row.label+': '+row.before+' → '+row.after).join(' · ');
 if(preview&&!['drops','meta'].includes(kind))summary=preview+(rows.length>2?' · ещё '+(rows.length-2):'');
 if(uncertain&&!caution)caution='Часть параметров требует ручной проверки перед публикацией.';
 return {title,summary,rows,technical,uncertain,caution,service:kind==='meta'};
}
root.PandoraCatalogHumanReview=Object.freeze({describe});
})(typeof window==='undefined'?globalThis:window);
