(function(root){
'use strict';
// Read-only descriptions of owner overrides; never change the stored D1 values.
const labels={
 name:'Название',nameEn:'Название EN',desc:'Описание',descEn:'Описание EN',
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
 spi:'СД',int:'ИНТ'
};
const friendly=(key)=>labels[key]||key.replaceAll('_',' ');
const toObject=value=>{try{return JSON.parse(value)}catch{return null}};
const preview=(value,max=650)=>{
 const str=typeof value==='string'?value:JSON.stringify(value);
 return !str?'—':str.length>max?str.slice(0,max)+'…':str;
};
function inspect(key,stored,{base=null,items=null,classes=null}={}){
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
  const name=typeof found==='string'?found:found?.name?.ru||found?.name;
  return typeof name==='string'&&name.trim()?name.trim():String(id);
 };
 const itemName=id=>lookup('item',id);
 const resistLabels={physical:'Физическое',fire:'Огонь',cold:'Лёд',
  lightning:'Молния',poison:'Яд',charm:'Чары',magic:'Магия',
  holy:'Свет',dark:'Тьма'};
 const sectionLabels={monsters:'Монстры',npcs:'NPC',loot:'Добыча',
  tags:'Теги',notes:'Заметки',custom:'Дополнительные разделы'};
 const extraKinds={item:'Предметы',monster:'Монстры',npc:'NPC',text:'Текст'};
 const fmt=(value,field)=>{
  if(value===undefined)return 'Не указано';
  if(value===null)return 'Нет';
  if(typeof value==='boolean')return value?'Да':'Нет';
  if(typeof value==='number'||typeof value==='string')return preview(String(value));
  if(Array.isArray(value)){
   if(field==='effects')return value.map(v=>{
    const title=root.PandoraStudioItemOwnerEditor?.effectDisplayLabel?.(v.func)||v.func;
    return title+' '+(Number(v.a)>0?'+':'')+(v.a??'—');
   }).join(' · ')||'Нет';
   if(field==='mats')return value.map(v=>itemName(v.i)+' ×'+v.n).join(', ')||'Нет';
   if(field==='loot')return value.map(v=>itemName(v)).join(', ')||'Нет';
   if(field==='npcs')return value.map(v=>lookup('npc',v)).join(', ')||'Нет';
   if(field==='tags')return value.map(v=>v.ru||v.en||'Тег').join(', ')||'Нет';
   if(field==='sections')return value.map(v=>sectionLabels[v]||v).join(', ')||'Нет';
   if(field==='extraSections')return value.map(v=>
    (v.titleRu||v.titleEn||'Раздел')+' · '+(extraKinds[v.kind]||'Данные')
   ).join(', ')||'Нет';
   if(field==='roster')return value.map(v=>
    (v.name||lookup('monster',v.monsterId))+
    (Number.isInteger(v.level)?' · ур. '+v.level:'')
   ).join(', ')||'Нет';
   if(field==='reqs')return value.map(v=>
    (raw.meta?.branchLabels?.[v.branch]||v.branch)+' ≥'+v.amount
   ).join(', ')||'Нет';
   if(field==='rolls')return value.map((group,i)=>'Розыгрыш '+(i+1)+': '+group.map(v=>
    (v.gold?'Золото':itemName(v.i))+
    (v.n&&v.n!==1?' ×'+v.n:'')+(v.p!=null?' · '+v.p+'%':'')).join(', ')).join('\n')||'Нет';
   if(field==='npc')return value.map(v=>lookup('npc',v)).join(', ')||'Нет';
   if(field==='slots')return value.map(v=>root.PandoraItemPresentation?.slotLabel?.(v,'ru')||v).join(', ')||'Нет';
   if(field==='maps')return value.map(v=>lookup('map',v)).join(', ')||'Нет';
   if(field==='mobs')return value.map(v=>lookup('monster',v)).join(', ')||'Нет';
   if(field==='d'||field==='s')return value.map(v=>itemName(v.i)+(v.n?' ×'+v.n:'')+(v.p!=null?' · '+v.p+'%':'')).join(', ')||'Нет';
   if(field==='acquisitions')return value.map(v=>lookup(v.type,v.id)+(v.p!=null?' · '+v.p+'%':'')).join(', ')||'Нет';
   if(field==='spawn')return value.map(v=>lookup(v.type,v.id)).join(', ')||'Нет';
   return value.map(x=>typeof x==='object'?preview(x,80):String(x)).join(', ')||'Нет';
  }
  if(typeof value==='object'){
   if(field==='classes')return Object.keys(value).filter(k=>value[k]).map(k=>classNames?.[k]?.name||k).join(', ')||'Нет';
   if(field==='resists')return Object.entries(value).map(([k,v])=>
    (resistLabels[k]||k)+': '+(v>0?'+':'')+v
   ).join(', ')||'Нет';
   return Object.entries(value).map(([k,v])=>friendly(k)+': '+fmt(v,k)).join('; ')||'Нет';
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
  name=source?.name||lookup(sub,id);
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
   const oldText=before===undefined?'Исходное значение неизвестно':fmt(before,field);
   const newText=fmt(after,field);
   return{field:friendly(field),before:oldText,after:newText,changed:before===undefined||oldText!==newText};
  }).filter(row=>row.changed);
 return{key,title:section+' · '+(name||key),section,target,
  changes:changes.length?changes:[{field:'Сохранённое значение',before:'Исходное значение неизвестно',
   after:preview(stored),changed:true}]};
}
root.PandoraOwnerChangeReview=Object.freeze({inspect});
})(typeof window==='undefined'?globalThis:window);
