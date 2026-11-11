(function(root){
'use strict';
// Read-only descriptions of owner overrides; never change the stored D1 values.
const labels={
 name:'Название',nameEn:'Название EN',desc:'Описание',descEn:'Описание EN',
 ru:'Текст RU',en:'Текст EN',hintRu:'Подсказка RU',hintEn:'Подсказка EN',
 service:'Назначение',serviceEn:'Назначение EN',grid:'Координаты',
 blurb:'Описание',blurbRu:'Описание',
 level:'Уровень',W:'Атака',PEN:'Пробитие',AC:'Защита',
 atkspeed:'Скорость атаки',range:'Дальность',soulslot:'Гнёзда душ',
 twoHanded:'Двуручное',kind:'Тип предмета',classes:'Доступные классы',
 effects:'Бонусы предмета',sourceNote:'Примечание к источнику',
 price:'Стоимость по справочнику',slots:'Совместимые слоты',
 npcs:'NPC локации',loot:'Добыча',tags:'Теги локации',
 sections:'Разделы локации',extraSections:'Дополнительные разделы',
 roster:'Расположение монстров',notesRu:'Заметки RU',notesEn:'Заметки EN',
 cast:'Подготовка',cooldown:'Перезарядка',magicProtection:'Магическая защита',
 warding:'Защитный показатель',
 mobs:'Монстры',maps:'Локации',reqs:'Требования веток',
 prereq:'Предыдущее умение',resists:'Сопротивления',
 life:'ОЗ',mana:'ОМ',gold:'Золото',honor:'Честь',
 exp:'Опыт',npc:'NPC',i:'Предмет награды',mats:'Материалы',
 d:'Обычная добыча',s:'Особая добыча',rolls:'Содержимое сундука',
 percent:'Шанс',p:'Шанс',str:'СИЛ',vit:'ВЫН',agi:'ПРВ',dex:'ЛВК',
 spi:'СД',int:'ИНТ',
 acquisitions:'Источники получения',spawn:'Места появления',deleted:'Удалено',value:'Значение'
};
const labelsEn={
 name:'Name',nameEn:'English name',desc:'Description',descEn:'English description',
 ru:'Russian text',en:'English text',hintRu:'Russian hint',hintEn:'English hint',
 service:'Service',serviceEn:'English service',grid:'Coordinates',
 blurb:'Description',blurbRu:'Russian description',
 level:'Level',W:'Attack',PEN:'Penetration',AC:'Defense',
 atkspeed:'Attack speed',range:'Range',soulslot:'Soul sockets',
 twoHanded:'Two-handed',kind:'Item type',classes:'Eligible classes',
 effects:'Item bonuses',sourceNote:'Source note',price:'Catalog price',
 slots:'Compatible slots',npcs:'Location NPCs',loot:'Loot',tags:'Location tags',
 sections:'Location sections',extraSections:'Additional sections',
 roster:'Monster positions',notesRu:'Russian notes',notesEn:'English notes',
 cast:'Cast time',cooldown:'Cooldown',magicProtection:'Magic defense',
 warding:'Warding',mobs:'Monsters',maps:'Locations',
 reqs:'Branch requirements',prereq:'Prerequisite skill',resists:'Resistances',
 life:'HP',mana:'MP',gold:'Gold',honor:'Honor',exp:'Experience',
 npc:'NPC',i:'Reward item',mats:'Materials',d:'Normal drops',
 s:'Special drops',rolls:'Chest contents',percent:'Chance',p:'Chance',
 str:'STR',vit:'VIT',agi:'AGI',dex:'DEX',spi:'SPI',int:'INT',
 acquisitions:'Item sources',spawn:'Spawn locations',deleted:'Deleted',value:'Value'
};
const sectionEn={
 'Интерфейс':'Interface','Предмет':'Item','Монстр':'Monster','Локация':'Location',
 'NPC':'NPC','Подземелье':'Dungeon','Навык':'Skill','Душа':'Soul',
 'Энциклопедия':'Encyclopedia','Добыча монстра':'Monster drops',
 'Сундук':'Chest','Обмен NPC':'NPC exchange',
 'Источники получения':'Item sources','Появление монстра':'Monster locations',
 'Изображение сайта':'Site artwork','Оформление сайта':'Site appearance',
 'Другие настройки':'Other settings'
};
const friendly=(key,lang='ru')=>(lang==='en'?labelsEn:labels)[key]||
 key.replaceAll('_',' ');
const toObject=value=>{try{return JSON.parse(value)}catch{return null}};
const preview=(value,max=650)=>{
 const str=typeof value==='string'?value:JSON.stringify(value);
 return !str?'—':str.length>max?str.slice(0,max)+'…':str;
};
function inspect(key,stored,{base=null,items=null,classes=null,lang='ru',englishBranches={}}={}){
 const english=lang==='en',tr=(ru,en)=>english?en:ru;
 const raw=base||{},gameItems=items||raw.items||{},classNames=classes||{};
 const lookup=(kind,id)=>{
  const found=kind==='item'?gameItems?.[id]:
   kind==='monster'?raw.monsters?.[id]:
   kind==='npc'?(raw.trades?.npcs?.[id]||raw.townNpcs?.[id]||
    root.PandoraAstirLocations?.npcRecords?.()?.[id]):
   kind==='soul'?raw.souls?.[id]:
   kind==='skill'?raw.skills?.[id]:
   kind==='map'?(raw.maps?.[id]||raw.townMaps?.[id]||
    raw.trades?.mapNames?.[id]||root.PandoraAstirLocations?.district?.(id)):
   kind==='instance'?(raw.instances||[]).find(x=>String(x.id)===String(id)):
   kind==='chest'?[...(raw.chests?.boxes||[]),...(raw.chests?.npc||[])]
    .find(x=>String(x.i)===String(id)):
   null;
  const name=typeof found==='string'?found:(english?(found?.nameEn||found?.name?.en):null)||found?.name?.ru||found?.name;
  return typeof name==='string'&&name.trim()?name.trim():String(id);
 };
 const itemName=id=>lookup('item',id);
 const resistLabels=english?
  {physical:'Physical',fire:'Fire',cold:'Ice',lightning:'Lightning',
   poison:'Poison',charm:'Charm',magic:'Magic',holy:'Holy',dark:'Dark'}:
  {physical:'Физическое',fire:'Огонь',cold:'Лёд',lightning:'Молния',
   poison:'Яд',charm:'Чары',magic:'Магия',holy:'Свет',dark:'Тьма'};
 const sectionLabels=english?
  {monsters:'Monsters',npcs:'NPCs',loot:'Loot',tags:'Tags',
   notes:'Notes',custom:'Additional sections'}:
  {monsters:'Монстры',npcs:'NPC',loot:'Добыча',
   tags:'Теги',notes:'Заметки',custom:'Дополнительные разделы'};
 const extraKinds=english?
  {item:'Items',monster:'Monsters',npc:'NPCs',text:'Text'}:
  {item:'Предметы',monster:'Монстры',npc:'NPC',text:'Текст'};
 // Use official localized class labels where supplied. Fall back to source
 // names if the live catalog has not translated a particular profession.
 const classLabel=id=>{
  const record=classNames?.[id];
  if(!record||typeof record!=='object')return String(id);
  const preferred=english?
   [record.nameEn,record.names?.en,record.name?.en]:
   [record.nameRu,record.names?.ru,record.name?.ru];
  const fallback=[typeof record.name==='string'?record.name:null,
   record.name?.ru,record.name?.en];
  return [...preferred,...fallback].find(v=>typeof v==='string'&&v.trim())||String(id);
 };
 const fmt=(value,field)=>{
  if(value===undefined)return tr('Не указано','Not specified');
  if(value===null)return tr('Нет','None');
  if(typeof value==='boolean')return value?tr('Да','Yes'):tr('Нет','No');
  if(typeof value==='number'||typeof value==='string')return preview(String(value));
  if(Array.isArray(value)){
   if(field==='effects')return value.map(v=>{
    const title=root.PandoraStudioItemOwnerEditor?.effectDisplayLabel?.(v.func,lang)||v.func;
    return title+' '+(Number(v.a)>0?'+':'')+(v.a??'—');
   }).join(' · ')||tr('Нет','None');
   if(field==='mats')return value.map(v=>itemName(v.i)+' ×'+v.n).join(', ')||tr('Нет','None');
   if(field==='loot')return value.map(v=>itemName(v)).join(', ')||tr('Нет','None');
   if(field==='npcs')return value.map(v=>lookup('npc',v)).join(', ')||tr('Нет','None');
   if(field==='tags')return value.map(v=>english?(v.en||v.ru||'Tag'):(v.ru||v.en||'Тег')).join(', ')||tr('Нет','None');
   if(field==='sections')return value.map(v=>sectionLabels[v]||v).join(', ')||tr('Нет','None');
   if(field==='extraSections')return value.map(v=>
    (english?v.titleEn||v.titleRu:v.titleRu||v.titleEn||'Раздел')+' · '+(extraKinds[v.kind]||tr('Данные','Data'))
   ).join(', ')||tr('Нет','None');
   if(field==='roster')return value.map(v=>
    (english?v.nameEn||v.name:v.name||v.nameEn||lookup('monster',v.monsterId))+
    (Number.isInteger(v.level)?tr(' · ур. ',' · lvl. ')+v.level:'')
   ).join(', ')||tr('Нет','None');
   if(field==='reqs')return value.map(v=>
    ((english?englishBranches?.[v.branch]:null)||raw.meta?.branchLabels?.[v.branch]||v.branch)+' ≥'+v.amount
   ).join(', ')||tr('Нет','None');
   if(field==='rolls')return value.map((group,i)=>tr('Розыгрыш ','Draw ')+(i+1)+': '+group.map(v=>
    (v.gold?tr('Золото','Gold'):itemName(v.i))+
    (v.n&&v.n!==1?' ×'+v.n:'')+(v.p!=null?' · '+v.p+'%':'')).join(', ')).join('\n')||tr('Нет','None');
   if(field==='npc')return value.map(v=>lookup('npc',v)).join(', ')||tr('Нет','None');
   if(field==='slots')return value.map(v=>root.PandoraItemPresentation?.slotLabel?.(v,lang)||v).join(', ')||tr('Нет','None');
   if(field==='maps')return value.map(v=>lookup('map',v)).join(', ')||tr('Нет','None');
   if(field==='mobs')return value.map(v=>lookup('monster',v)).join(', ')||tr('Нет','None');
   if(field==='d'||field==='s')return value.map(v=>itemName(v.i)+(v.n?' ×'+v.n:'')+(v.p!=null?' · '+v.p+'%':'')).join(', ')||tr('Нет','None');
   if(field==='acquisitions')return value.map(v=>lookup(v.type,v.id)+(v.p!=null?' · '+v.p+'%':'')).join(', ')||tr('Нет','None');
   if(field==='spawn')return value.map(v=>lookup(v.type,v.id)).join(', ')||tr('Нет','None');
   return value.map(x=>typeof x==='object'?preview(x,80):String(x)).join(', ')||tr('Нет','None');
  }
  if(typeof value==='object'){
   if(field==='classes')return Object.keys(value).filter(k=>value[k]).map(classLabel).join(', ')||tr('Нет','None');
   if(field==='resists')return Object.entries(value).map(([k,v])=>
    (resistLabels[k]||k)+': '+(v>0?'+':'')+v
   ).join(', ')||tr('Нет','None');
   return Object.entries(value).map(([k,v])=>friendly(k,lang)+': '+fmt(v,k)).join('; ')||tr('Нет','None');
  }
  return preview(value);
 };
 const parts=String(key||'').split('.');
 const type=parts[0],id=parts.at(-1);
 let target=null,name=null,source=null,patch=null,section='';
 if(type==='itemedit'||type==='item'||type==='itemdesc'||type==='itemslots'){
  target={type:'item',id};source=gameItems?.[id];name=lookup('item',id);
  section='Предмет';patch=type==='itemedit'?toObject(stored):
   {[type==='itemdesc'?'desc':type==='itemslots'?'soulslot':'name']:stored};
 }else if(type==='wikiedit'){
  const sub=parts[1];target={type:sub,id};
  source=sub==='npc'?(raw.trades?.npcs?.[id]||raw.townNpcs?.[id]||
    root.PandoraAstirLocations?.npcRecords?.()[id]):
   sub==='instance'?(raw.instances||[]).find(x=>String(x.id)===id):
   sub==='map'?(raw.maps?.[id]||raw.townMaps?.[id]||
    raw.trades?.mapNames?.[id]||root.PandoraAstirLocations?.district(id)):
   raw[({soul:'souls',skill:'skills',monster:'monsters'})[sub]]?.[id];
  name=lookup(sub,id);
  section=({soul:'Душа',skill:'Навык',npc:'NPC',monster:'Монстр',
   map:'Локация',instance:'Подземелье'})[sub]||'Энциклопедия';
  patch=toObject(stored);
  if(!source&&typeof patch?.name==='string'&&patch.name.trim())
   name=patch.name;
 }else if(type==='dropedit'){
  target={type:'monster',id};name=lookup('monster',id);
  source=raw.drops?.[id]||{d:[],s:[]};section='Добыча монстра';patch=toObject(stored);
 }else if(type==='chestedit'){
  target={type:'chest',id};name=lookup('item',id);
  source=[...(raw.chests?.boxes||[]),...(raw.chests?.npc||[])].find(x=>String(x.i)===id);
  section='Сундук';patch={rolls:toObject(stored)};
 }else if(type==='tradeedit'){
  source=(raw.trades?.trades||[]).find(x=>String(x.id)===id);
  const value=toObject(stored);
  patch=value?.deleted?{deleted:true}:value?.recipe;
  target={type:'item',id:String(patch?.i||source?.i||'')};
  name=itemName(target.id);section='Обмен NPC';
 }else if(type==='acquireedit'){
  target={type:'item',id};source={acquisitions:[]};
  name=itemName(id);section='Источники получения';
  patch={acquisitions:toObject(stored)};
 }else if(type==='guideedit'&&parts[1]==='book'&&parts[2]==='wiki'&&
  parts[3]==='item-field'){
  section='Интерфейс';
  // D1 keys are lowercase, while only W/PEN/AC are uppercase in the
  // item presentation model. Preserve the original spelling for all other
  // fields so labels and source hints resolve without leaking schema names.
  const rawField=parts[4]||'';
  const fieldId=['w','pen','ac'].includes(rawField.toLowerCase())?
   rawField.toUpperCase():rawField;
  name=tr('Подсказка предмета: ','Item hint: ')+
   ((english?labelsEn:labels)[fieldId]||fieldId);
  patch=toObject(stored);
  const baseHint=root.PandoraItemPresentation?.fieldHint?.(fieldId,'ru',{});
  const baseEn=root.PandoraItemPresentation?.fieldHint?.(fieldId,'en',{});
  source={hintRu:baseHint,hintEn:baseEn};
 }else if(type==='guideedit'&&parts[1]==='book'&&parts[2]==='ui'&&
  parts[3]==='label'){
  section='Интерфейс';
  const key=root.PandoraUILocale?.keys?.().find(value=>
   root.PandoraUILocale.fieldKey(value)===parts.slice(2).join('.'));
  name=tr('Надпись: ','Caption: ')+
   (key?root.PandoraUILocale.baseText(key,lang):tr('Интерфейс','Interface'));
  patch=toObject(stored);
  source=key?{ru:root.PandoraUILocale.baseText(key,'ru'),
   en:root.PandoraUILocale.baseText(key,'en')}:{};
 }else if(type==='spawnedit'){
  target={type:'monster',id};name=lookup('monster',id);section='Появление монстра';
  const spawn=[];
  for(const [mapId,map]of Object.entries(raw.maps||{}))
   if((map.mobs||[]).some(m=>String(m)===id))spawn.push({type:'map',id:mapId});
  for(const d of raw.instances||[])
   if((d.mobs||[]).some(m=>String(m)===id))spawn.push({type:'instance',id:String(d.id)});
  source={spawn};patch={spawn:toObject(stored)};
 }else if(type==='skill'||type==='skilldesc'){
  target={type:'skill',id};name=lookup('skill',id);
  source=raw.skills?.[id];section='Навык';
  patch={[type==='skill'?'name':'desc']:stored};
 }else{
  section=type==='visual'?'Изображение сайта':type==='site'?'Оформление сайта':'Другие настройки';
  name=parts.slice(1).join(' · ')||key;
  patch={value:stored};
 }
 const changes=Object.entries(patch&&typeof patch==='object'&&!Array.isArray(patch)?patch:{value:stored})
  .map(([field,after])=>{
   const before=source?.[field];
   const oldText=before===undefined?tr('Исходное значение неизвестно','Original value unknown'):fmt(before,field);
   const newText=fmt(after,field);
   return{field:friendly(field,lang),before:oldText,after:newText,changed:before===undefined||oldText!==newText};
  }).filter(row=>row.changed);
 const translatedSection=english?sectionEn[section]||section:section;
 return{key,title:translatedSection+' · '+(name||key),section:translatedSection,target,
  changes:changes.length?changes:[{field:tr('Сохранённое значение','Saved value'),
   before:tr('Исходное значение неизвестно','Original value unknown'),
   after:preview(stored),changed:true}]};
}
root.PandoraOwnerChangeReview=Object.freeze({inspect});
})(typeof window==='undefined'?globalThis:window);
