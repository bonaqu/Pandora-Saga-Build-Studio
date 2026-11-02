(function(root){
'use strict';
const el=(tag,attrs={},children=[])=>{
 const e=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs)){
  if(k==='class')e.className=v;else if(k==='text')e.textContent=v;
  else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
  else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(k))
   e[k]=Boolean(v);
  else if(v!==null&&v!==undefined)e.setAttribute(k,String(v));
 }
 for(const child of children)e.append(typeof child==='string'?document.createTextNode(child):child);
 return e;
};
function summary(record,icon,kind='item',context=null){
 if(!record)return el('p',{class:'muted',text:'Данные о предмете пока не загружены'});
 const presenter=root.PandoraItemPresentation,english=document.documentElement?.lang==='en';
 const locale=english?'en':'ru',tr=(ru,en)=>english?en:ru;
 const wrap=el('div',{class:'stage-rich-summary'}),head=el('div',{class:'stage-rich-head'});
 const src=icon(record,kind);
 if(src){const img=el('img',{src,alt:''});img.onerror=()=>img.replaceWith(el('span',{text:'✦'}));head.append(img)}
 const baseName=presenter?.displayName(record,tr('Без названия','Unnamed item'),locale)||tr('Без названия','Unnamed item');
 const shownName=kind==='item'&&context?
  root.PandoraEnchantModel?.equipmentName?.(baseName,context.slot||record.slot,context.refinement,context.gem,locale)||baseName:
  baseName;
 head.append(el('strong',{text:shownName,
  ...(kind==='item'?{'data-edit-key':'item.'+record.id}:{})}));
 const grade=Number(context?.refinement)||0;

 wrap.append(head);
 // IDs are internal database keys, never player-facing data.
 const baseArmor=Number(record.AC);
 const armorRefine=kind==='item'&&context&&
  ['shield','head','body','gloves','legs','feet'].includes(record.slot)&&
  Number.isInteger(grade)&&grade>=0&&grade<=10&&record.name!=='-'?
  Math.floor(grade*1.5):0;
 const armorDisplay=context&&Number.isFinite(baseArmor)&&armorRefine>0?
  baseArmor+'+'+armorRefine:record.AC;
 const rows=kind==='soul'?
 [[tr('Подходящие слоты','Compatible slots'),(record.slots||[])
   .map(slot=>presenter?.slotLabel(slot,locale)||slot).join(', ')]]:
 [[tr('Тип','Type'),presenter?.kind(record,locale)||tr('Предмет','Item')],
 [tr('Уровень','Level'),record.level],[tr('Атака','Attack'),record.W],
 [tr('Защита','Defense'),armorDisplay],[tr('Гнёзда','Sockets'),record.soulslot],
 [tr('Скорость','Speed'),record.atkspeed],[tr('Дальность','Range'),record.range]];
 const wearers=kind==='item'?root.PandoraUIPlanner?.outfitWearers?.(record,locale):null;
 if(context&&Number.isInteger(context.capacity)&&context.capacity>0)
  rows.push([tr('Вставлено душ','Socketed Souls'),
   (context.souls?.length||0)+' / '+context.capacity]);
 if(root.PandoraStudioAdminActive?.())rows.push(['ID',record.id]);
 const dl=el('dl',{class:'stage-rich-fields'});
 for(const [key,value] of rows)if(value!==null&&value!==undefined&&value!==''){
  const dd=el('dd',{text:String(value)});
  if(kind==='item'&&key===tr('Гнёзда','Sockets'))dd.dataset.editKey='itemslots.'+record.id;
  dl.append(el('dt',{text:key}),dd);
 }
 if(dl.children.length)wrap.append(dl);
 if(wearers?.length){
  const fit=el('div',{class:'stage-gear-wearers'},[
   el('span',{class:'stage-gear-wearers-label',text:tr('Подходит','Wearable by')})
  ]);
  const chips=el('div',{class:'stage-gear-wearer-chips'});
  for(const wearer of wearers)chips.append(el('span',{class:'stage-gear-wearer',text:wearer}));
  fit.append(chips);wrap.append(fit);
 }
 if(record.desc){const desc=el('p',{class:'stage-rich-desc',
  text:presenter?.description(record.desc)||record.desc});
  if(kind==='item')desc.dataset.editKey='itemdesc.'+record.id;
  wrap.append(desc);
 }
 if(kind==='item'&&Array.isArray(context?.souls)&&context.souls.length){
  const group=el('div',{class:'stage-gear-souls'});
  group.append(el('strong',{text:tr('Вставленные души','Socketed Souls')}));
  for(const soul of context.souls){
   const row=el('div',{class:'stage-gear-soul'});
   const src=icon(soul,'soul');
   if(src){const img=el('img',{src,alt:''});img.onerror=()=>img.remove();row.append(img)}
   const info=el('div',{class:'stage-gear-soul-info'});
   info.append(el('b',{text:presenter?.displayName(soul,tr('Душа','Soul'),locale)||tr('Душа','Soul')}));
   if(soul.desc)info.append(el('small',{text:presenter?.description(soul.desc)||soul.desc}));
   row.append(info);group.append(row);
  }
  wrap.append(group);
 }
 return wrap;
}
let livePreview=null,liveTarget=null;
function dismissPreview(){
 livePreview?.remove();
 liveTarget?.removeAttribute('aria-describedby');
 livePreview=null;liveTarget=null;
}
// Outside clicks, Escape and page navigation dismiss any item preview.
document.addEventListener?.('pointerdown',event=>{
 if(liveTarget&&!liveTarget.contains(event.target))dismissPreview();
},true);
document.addEventListener?.('keydown',event=>{
 if(event.key==='Escape')dismissPreview();
});
root.addEventListener?.('hashchange',dismissPreview);
function attachPreview(target,record,icon,kind='item',context=null){
 if(!record)return;
 // A custom preview must never coexist with the browser's native title popup.
 target.removeAttribute('title');
 target.querySelectorAll?.('[title]').forEach(node=>node.removeAttribute('title'));
 let tip=null;
 const remove=()=>{
  if(livePreview===tip)dismissPreview();
  else tip?.remove();
  tip=null;target.removeAttribute('aria-describedby');
 };
 const show=()=>{
  if(tip?.isConnected)return;
  dismissPreview();remove();
  tip=el('aside',{id:'stage-gear-tooltip',class:'stage-hover-preview stage-item-tooltip',
   role:'tooltip'},[summary(record,icon,kind,context)]);
  livePreview=tip;liveTarget=target;
  document.body.append(tip);
  target.setAttribute('aria-describedby',tip.id);
  const box=target.getBoundingClientRect(),vw=document.documentElement.clientWidth,
   vh=window.innerHeight||innerHeight;
  tip.style.maxWidth=Math.max(180,Math.min(380,vw-16))+'px';
  tip.style.maxHeight=Math.max(110,vh-16)+'px';
  const w=tip.getBoundingClientRect().width,h=tip.getBoundingClientRect().height;
  // Prefer the side of the slot with enough space. Avoid covering the hovered icon.
  const right=box.right+10,left=box.left-w-10;
  const preferredLeft=Boolean(target.closest?.('.right-rail'));
  const preferredRight=Boolean(target.closest?.('.left-rail'));
  const rightFits=right+w<=vw-8,leftFits=left>=8;
  const x=preferredLeft&&leftFits?left:preferredRight&&rightFits?right:
   rightFits?right:leftFits?left:
   Math.max(8,Math.min(vw-w-8,box.left+box.width/2-w/2));
  const y=Math.max(8,Math.min(vh-h-8,box.top));
  tip.style.left=x+'px';tip.style.top=y+'px';
 };
 target.addEventListener('mouseenter',show);
 target.addEventListener('focus',show);
 target.addEventListener('mouseleave',remove);
 target.addEventListener('blur',remove);
 target.addEventListener('click',remove);
}
function render(root,api){
 const {record,slot,mode,icons,refinement,souls,gems,gameTables}=api;
 const plan=globalThis.PandoraEquipmentPlan;
 const refinable=plan.canRefine(slot),hasSouls=plan.canSocket(slot,record);
 const cap=hasSouls?plan.socketCapacity(record):0;
 if(mode==='gems'||mode==='souls'&&!hasSouls){api.changeMode('details');return}
 const head=el('div',{class:'stage-picker-head'},[
  el('strong',{text:api.slotLabel||'Слот: '+slot}),
  el('button',{type:'button',text:'✕',onclick:api.close,'aria-label':'Закрыть настройку'})
 ]);root.append(head);
 const tabs=el('nav',{class:'stage-rich-tabs',role:'group','aria-label':'Настройка предмета'});
 const sections=[['choose','Выбор'],['details','Свойства']];
 if(hasSouls)sections.push(['souls','Души']);
 for(const [key,title]of sections)tabs.append(el('button',{type:'button',text:title,
  class:mode===key?'chosen':'','aria-pressed':String(mode===key),
  disabled:!record&&key!=='choose',onclick:()=>api.changeMode(key)}));
 root.append(tabs);
 if(!record){root.append(el('p',{class:'muted',text:'Сначала выбери предмет.'}));return}
 const body=el('div',{class:'stage-rich-body'});root.append(body);
 if(mode==='details'){
  body.append(summary(record,icons,'item',{slot,refinement,gem:globalThis.PandoraEnchantModel?.normalizeForSlot?.(slot,gems)}));
  if(refinable){
   const grade=Number(refinement)||0,buttons=el('div',{class:'stage-grade'});
   for(let n=0;n<=10;n++)buttons.append(el('button',{type:'button',text:'+'+n,
    class:n===grade?'chosen':'','aria-pressed':String(n===grade),'data-grade':String(n),onclick:()=>api.updateGrade(n)}));
   body.append(el('h4',{text:'Заточка: +0…+10'}),buttons);
   // Item properties expose actual grade; inferred weapon math stays out of the editor.
   const model=globalThis.PandoraEnchantModel,choice=model.normalize(gems);
   const group=(label,entries,key)=>{
    const box=el('fieldset',{class:'stage-enchant-fieldset stage-enchant-inline'}),line=el('div',{class:'stage-enchant-options'});
    box.append(el('legend',{text:label}));
    for(const option of entries)line.append(el('button',{type:'button',text:option.ru,
     class:choice?.[key]===option.id?'chosen':'','aria-pressed':String(choice?.[key]===option.id),
     'data-enchant-key':key,'data-enchant-value':option.id,
     onclick:()=>api.assignGem({type:key==='type'?option.id:(choice?.type||'physical'),
      element:key==='element'?option.id:(choice?.element||'fire')})}));
    box.append(line);return box;
   };
   body.append(el('h4',{text:slot==='weapon'?'Тип и стихия улучшения':'Стихия улучшения'}));
   if(slot==='weapon')body.append(group('Тип',model.types,'type'));
   body.append(group('Стихия',model.elements,'element'));
  }
  // Souls are managed exclusively in the existing dedicated "Души" tab.
 }else if(mode==='souls'){
  const row=el('div',{class:'stage-rich-sockets'});
  for(let i=0;i<cap;i++){
   const value=souls[i],soul=value&&api.catalog.souls?.[String(value.id)],selected=i===api.selectedSocket;
   const button=el('button',{type:'button',class:selected?'selected':'','aria-pressed':String(selected),
    'aria-label':'Гнездо '+(i+1)+': '+(soul?.name||'пусто'),
    'data-socket-index':String(i),onclick:()=>api.openSocket(i)});
   const src=soul&&icons(soul,'soul');
   if(src){const image=el('img',{src,alt:''});image.onerror=()=>image.replaceWith(el('span',{text:'✦'}));button.append(image)}
   else button.append(el('span',{text:soul?'✦':'+'}));
   button.append(el('small',{text:String(i+1)}));row.append(button);attachPreview(button,soul,icons,'soul');
  }
  body.append(el('h4',{text:'Гнёзда душ'}),row);
  const query=el('input',{type:'search',placeholder:'Поиск совместимой души','aria-label':'Поиск души',
   'data-soul-query':'1',value:api.soulQuery||''});
  const list=el('div',{class:'stage-rich-list'});
  const draw=()=>{
   list.replaceChildren();const needle=String(query.value||'').trim().toLocaleLowerCase('ru');
   const results=Object.values(api.catalog.souls||{}).filter(rec=>plan.validSoul(rec,slot)&&
    String(rec.name||'').toLocaleLowerCase('ru').includes(needle));
   for(const rec of results.slice(0,80)){
    const button=el('button',{type:'button',class:'stage-rich-result',onclick:()=>api.assignSoul(rec)});
    const src=icons(rec,'soul');
    if(src){const image=el('img',{src,alt:''});image.onerror=()=>image.replaceWith(el('span',{text:'✦'}));button.append(image)}
    button.append(el('span',{text:globalThis.PandoraItemPresentation?.displayName(rec,'Душа без названия')||'Душа без названия'}));list.append(button);attachPreview(button,rec,icons,'soul');
   }
   if(results.length>80)list.append(el('p',{class:'muted',text:'Показано 80 душ. Уточни поиск.'}));
   if(!results.length)list.append(el('p',{class:'muted',text:'Совместимых душ не найдено'}));
  };
  query.addEventListener('input',()=>{api.onSoulQuery?.(query.value);draw()});
  body.append(query,el('button',{type:'button',class:'stage-enchant-reset',
    text:'✕ Извлечь душу из выбранного гнезда',onclick:()=>api.assignSoul(null)}),list);
  draw();
 }
}
root.PandoraStageItemUI=Object.freeze({render,summary,attachPreview,dismissPreview});
})(typeof window==='undefined'?globalThis:window);
