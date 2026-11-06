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
  globalThis.PandoraEnchantModel?.equipmentName?.(baseName,context.slot||record.slot,context.refinement,context.gem,locale)||baseName:
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
  grade:0;
 // The game client item window shows base + visible forge grade. The
 // calculator's separate Remaked defense contribution is intentionally unchanged.
 const armorDisplay=context&&Number.isFinite(baseArmor)&&armorRefine>0?
  baseArmor+'+'+armorRefine:record.AC;
 const gem=kind==='item'&&context?
  globalThis.PandoraEnchantModel?.normalizeForSlot?.(context.slot||record.slot,context.gem):null;
 const gemElement=gem&&globalThis.PandoraEnchantModel?.elements?.find(e=>e.id===gem.element);
 const gemType=gem&&globalThis.PandoraEnchantModel?.types?.find(e=>e.id===gem.type);
 // Physical gemstone weapon damage comes from the current OS weaponPlus table.
 const attackPlus=kind==='item'&&context&&
  (context.slot||record.slot)==='weapon'&&gem?.type==='physical'&&grade>0?
  globalThis.PandoraEnchantModel?.weaponPreview?.(record.W,grade,context.tables?.weaponPlus):null;
 const attackDisplay=attackPlus&&attackPlus.increment>0?
  attackPlus.base+'+'+attackPlus.increment:record.W;
 const rows=kind==='soul'?
 [[tr('Подходящие слоты','Compatible slots'),(record.slots||[])
   .map(slot=>presenter?.slotLabel(slot,locale)||slot).join(', ')]]:
 [[tr('Тип','Type'),presenter?.kind(record,locale)||tr('Предмет','Item')],
 [tr('Уровень','Level'),record.level],[tr('Атака','Attack'),attackDisplay],
 [tr('Защита','Defense'),armorDisplay],[tr('Гнёзда','Sockets'),record.soulslot],
 [tr('Скорость','Speed'),record.atkspeed],[tr('Дальность','Range'),record.range]];
 const wearers=kind==='item'?root.PandoraUIPlanner?.outfitWearers?.(record,locale):null;
 if(gem&&grade>0){
  if((context.slot||record.slot)==='weapon'&&gemType)
   rows.push([tr('Тип самоцвета','Gemstone type'),english?gemType.en:gemType.ru]);
  if(gemElement)rows.push([tr('Стихия улучшения','Refinement element'),
   english?gemElement.en:gemElement.ru]);
 }
 if(context&&Number.isInteger(context.capacity)&&context.capacity>0)
  rows.push([tr('Вставлено душ','Socketed Souls'),
   (context.souls?.length||0)+' / '+context.capacity]);
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
// A short intentional hover prevents rapid pointer movement across trade,
// loot and equipment links from opening a large item tooltip every time.
// All item and Soul previews use this single controller and timing.
const ITEM_PREVIEW_HOVER_DELAY_MS=650;
let livePreview=null,liveTarget=null,pendingPreview=null;
function cancelPendingPreview(){
 if(!pendingPreview)return;
 clearTimeout(pendingPreview.timer);
 pendingPreview=null;
}
function dismissPreview(){
 cancelPendingPreview();
 livePreview?.remove();
 liveTarget?.removeAttribute('aria-describedby');
 livePreview=null;liveTarget=null;
}
function queuePreview(target,show){
 cancelPendingPreview();
 const timer=setTimeout(()=>{
  if(pendingPreview?.target!==target)return;
  pendingPreview=null;
  if(target.isConnected&&target.matches(':hover'))show();
 },ITEM_PREVIEW_HOVER_DELAY_MS);
 pendingPreview={target,timer,show};
}
// An item window must not linger after navigation, scrolling, closing the
// page, clicking elsewhere or leaving the link before its timer completes.
document.addEventListener?.('pointerdown',event=>{
 if((liveTarget&&!liveTarget.contains(event.target))||
  (pendingPreview&&!pendingPreview.target.contains(event.target)))
  dismissPreview();
},true);
document.addEventListener?.('keydown',event=>{
 if(event.key!=='Escape'||!livePreview&&!pendingPreview)return;
 // Escape should close only the visible/pending item tooltip. Without
 // capturing it here, the Wiki's Escape handler closes the whole workbench.
 dismissPreview();
 event.preventDefault();
 event.stopImmediatePropagation();
},true);
document.addEventListener?.('scroll',()=>{
 // Browser auto-scroll-to-hover can finish after pointerenter. Re-arm the
 // delay for a still-hovered link instead of silently losing its preview.
 if(livePreview)dismissPreview();
 else if(pendingPreview){
  const {target,show}=pendingPreview;
  if(target.isConnected&&target.matches(':hover'))queuePreview(target,show);
  else cancelPendingPreview();
 }
},{capture:true,passive:true});
document.addEventListener?.('visibilitychange',()=>{
 if(document.hidden)dismissPreview();
});
root.addEventListener?.('hashchange',dismissPreview);
root.addEventListener?.('popstate',dismissPreview);
root.addEventListener?.('blur',dismissPreview);
function attachPreview(target,record,icon,kind='item',context=null){
 if(!record)return;
 // Never allow the browser's native title bubble to compete with our preview.
 target.removeAttribute('title');
 target.querySelectorAll?.('[title]').forEach(node=>node.removeAttribute('title'));
 const show=()=>{
  if(!target.isConnected||liveTarget===target&&livePreview?.isConnected)return;
  dismissPreview();
  const tip=el('aside',{id:'stage-gear-tooltip',class:'stage-hover-preview stage-item-tooltip',
   role:'tooltip'},[summary(record,icon,kind,context)]);
  livePreview=tip;liveTarget=target;
  document.body.append(tip);
  target.setAttribute('aria-describedby',tip.id);
  const box=target.getBoundingClientRect(),vw=document.documentElement.clientWidth,
   vh=window.innerHeight||innerHeight;
  tip.style.maxWidth=Math.max(180,Math.min(380,vw-16))+'px';
  tip.style.maxHeight=Math.max(110,vh-16)+'px';
  const w=tip.getBoundingClientRect().width,h=tip.getBoundingClientRect().height;
  // Keep the rich tooltip outside the document flow and away from the
  // hovered element so its appearance cannot oscillate the pointer hitbox.
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
 const remove=()=>{
  if(liveTarget===target||pendingPreview?.target===target)dismissPreview();
 };
 target.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  dismissPreview();
  queuePreview(target,show);
 });
 target.addEventListener('pointerleave',remove);
 target.addEventListener('pointerdown',remove);
 target.addEventListener('focus',()=>{
  // Keyboard focus remains immediately accessible, but the browser may
  // scroll the focused link into view after dispatching focus. A scroll
  // dismisses all stale popups, so re-open on the next frame if the same
  // keyboard-focused item is still active. Pointer focus is unaffected.
  if(target.matches(':focus-visible'))show();
  root.requestAnimationFrame?.(()=>{
   if(target.isConnected&&document.activeElement===target&&
    target.matches(':focus-visible')&&!livePreview)show();
  });
 });
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
  body.append(summary(record,icons,'item',{slot,refinement,gem:globalThis.PandoraEnchantModel?.normalizeForSlot?.(slot,gems),tables:gameTables}));
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
