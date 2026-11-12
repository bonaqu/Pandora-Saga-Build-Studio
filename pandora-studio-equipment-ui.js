(function(root){
'use strict';
const el=(tag,attrs={},children=[])=>{
 const e=document.createElement(tag);
 if((tag==='input'||tag==='textarea')&&
  String(attrs.type||'').toLowerCase()!=='password'){
  // Gameplay fields are not credentials; Yandex Browser ignores many "off"
  // hints and recommends "none" for suppressing autofill (best effort).
  attrs={...attrs,autocomplete:'none','aria-autocomplete':'none',
   'data-lpignore':'true','data-1p-ignore':'true',
   'data-bwignore':'true','data-form-type':'other'};
 }
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
 if(!record)return el('p',{class:'muted',text:document.documentElement?.lang==='en'?
  'Item information is not loaded yet':'Данные о предмете пока не загружены'});
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
 // The visible item's Armor "12+X" uses the WHOLE bonus from +1.2 DEF
 // per refinement grade. This is distinct from the "+N" in the item name.
 // Character DEF still accumulates fractional tenths from all armor pieces.
 const armorBonus=kind==='item'&&context&&record.name!=='-'?
  globalThis.PandoraEnchantModel?.armorPreview?.(record.AC,grade,context.slot||record.slot):null;
 const armorDisplay=armorBonus&&armorBonus.increment>0?
  armorBonus.base+'+'+armorBonus.increment:record.AC;
 const gem=kind==='item'&&context?
  globalThis.PandoraEnchantModel?.normalizeForSlot?.(context.slot||record.slot,context.gem):null;
 const gemElement=gem&&globalThis.PandoraEnchantModel?.elements?.find(e=>e.id===gem.element);
 const gemType=gem&&globalThis.PandoraEnchantModel?.types?.find(e=>e.id===gem.type);
 // Physical weaponPlus is also the calculation's backward-compatible
 // default when an older saved build has a grade but no gemstone selected.
 // A magical gemstone instead selects only the magicPlus table.
 const attackPlus=kind==='item'&&context&&
  (context.slot||record.slot)==='weapon'&&gem?.type!=='magical'&&grade>0?
  globalThis.PandoraEnchantModel?.weaponPreview?.(record.W,grade,context.tables?.weaponPlus):null;
 const attackDisplay=attackPlus&&attackPlus.increment>0?
  attackPlus.base+'+'+attackPlus.increment:record.W;
 const magicPlus=kind==='item'&&context&&
  (context.slot||record.slot)==='weapon'&&gem?.type==='magical'&&grade>0?
  globalThis.PandoraEnchantModel?.magicPreview?.(grade,context.tables?.magicPlus):null;
 const showSoulSlots=kind==='item'&&Boolean(
  root.PandoraEquipmentPlan?.supportsSoulSlot?.(context?.slot||record.slot));
 // Equipped copies have a known capacity: one readable "used/available" row.
 // Unselected previews retain the catalog's plain total, and zero stays "0".
 const socketCapacity=context?.capacity??record.soulslot;
 const socketedCount=context?.socketedCount??(Array.isArray(context?.souls)?
  context.souls.slice(0,Math.max(0,Number(socketCapacity)||0)).filter(Boolean).length:0);
 const activeSockets=Number.isInteger(context?.capacity)?
  Math.min(Math.max(0,Number(socketedCount)||0),Math.max(0,context.capacity)):0;
 const displayedSlots=Number.isInteger(context?.capacity)&&context.capacity>0?
  activeSockets+'/'+context.capacity:socketCapacity;
 const rows=kind==='soul'?
 [[tr('Подходящие слоты','Compatible slots'),(record.slots||[])
   .map(slot=>presenter?.slotLabel(slot,locale)||slot).join(', ')]]:
 [[tr('Тип','Type'),presenter?.kind(record,locale)||tr('Предмет','Item')],
 [tr('Уровень','Level'),record.level],[tr('Атака','Attack'),attackDisplay],
 ...(magicPlus?[[tr('Магическая атака','Magic attack'),'+'+magicPlus.rate+'%']]:[]),
 [tr('Защита','Defense'),armorDisplay],
 ...(showSoulSlots?[[tr('Слоты душ','Soul slots'),displayedSlots]]:[]),
 [tr('Скорость','Speed'),record.atkspeed],[tr('Дальность','Range'),record.range]];
 const wearers=kind==='item'?root.PandoraUIPlanner?.outfitWearers?.(record,locale):null;
 if(gem&&grade>0){
  if((context.slot||record.slot)==='weapon'&&gemType)
   rows.push([tr('Тип самоцвета','Gemstone type'),english?gemType.en:gemType.ru]);
  if(gemElement)rows.push([tr('Стихия улучшения','Refinement element'),
   english?gemElement.en:gemElement.ru]);
 }
 // Keep per-row translation/editor keys aligned with dynamically inserted
 // magical refinements and hidden Soul slots. Index drift formerly assigned
 // Defense the "Slots" editor key on magically enhanced weapons.
 const fieldNames=kind==='soul'?
  [['soulCompatible','Подходящие слоты','Compatible slots']]:
  [['type','Тип','Type'],['level','Уровень','Level'],
   ['attack','Атака','Attack'],
   ...(magicPlus?[['magicAttack','Магическая атака','Magic attack']]:[]),
   ['defense','Защита','Defense'],
   ...(showSoulSlots?[['slots','Слоты душ','Soul slots']]:[]),
   ['speed','Скорость','Speed'],['range','Дальность','Range']];
 if(gem&&grade>0){
  if((context.slot||record.slot)==='weapon'&&gemType)
   fieldNames.push(['gemType','Тип самоцвета','Gemstone type']);
  if(gemElement)fieldNames.push(['element','Стихия улучшения','Refinement element']);
 }
 const dl=el('dl',{class:'stage-rich-fields'});
 rows.forEach(([key,value],index)=>{
  if(value===null||value===undefined||value==='')return;
  const dd=el('dd',{text:String(value)}),field=fieldNames[index];
  const dt=el('dt',{text:field?context?.copyLabel?.('field.'+field[0],field[1],field[2])||key:key});
  if(field)context?.editLabel?.(dt,'field.'+field[0],field[1],field[2]);
  if(kind==='item'&&field?.[0]==='slots'){
   dd.dataset.editKey='itemslots.'+record.id;
   if(Number.isInteger(context?.capacity)&&context.capacity>0){
    // Quiet, accessible status: muted amber for some Souls, green only when full.
    // Empty is neutral; zero-capacity items remain plain "0".
    dd.className='stage-soul-slot-count';
    dd.dataset.soulFill=activeSockets===0?'empty':
     activeSockets===context.capacity?'full':'partial';
    dd.replaceChildren(
     el('span',{class:'stage-soul-count-used',text:String(activeSockets)}),
     document.createTextNode('/'+context.capacity));
    dd.setAttribute('aria-label',tr(
     activeSockets+' из '+context.capacity+' слотов душ занято',
     activeSockets+' of '+context.capacity+' Soul slots occupied'));
   }
  }
  dl.append(dt,dd);
 });
 // Variant 02 — wearable races belong to the ordinary item stat rows.
 // Keep the exact catalog order and RU/EN names, without a separate card,
 // extra border, clickable chips, or gameplay data changes.
 if(wearers?.length){
  const labelRu='Подходит',labelEn='Wearable by';
  const labelNode=el('dt',{class:'stage-gear-wearers-label',
   text:context?.copyLabel?.('wearableBy',labelRu,labelEn)||tr(labelRu,labelEn)});
  context?.editLabel?.(labelNode,'wearableBy',labelRu,labelEn);
  const value=el('dd',{class:'stage-gear-wearers-value'});
  wearers.forEach((wearer,index)=>{
   if(index)value.append(document.createTextNode(' · '));
   value.append(el('span',{class:'stage-gear-wearer-name',text:wearer}));
  });
  dl.append(labelNode,value);
 }
 if(dl.children.length)wrap.append(dl);
 if(kind==='item'&&root.PandoraUIPlanner?.occupiesBodyAndLegs?.(record))
  {const ru='Броня + штаны · одна вещь',en='Armor + pants · one item';
   const note=el('small',{class:'stage-outfit-note',
    text:context?.copyLabel?.('outfitNote',ru,en)||tr(ru,en)});
   context?.editLabel?.(note,'outfitNote',ru,en);
   wrap.append(note);}
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
let livePreview=null,liveTarget=null,pendingPreview=null,liveRemovalObserver=null;
function cancelPendingPreview(){
 if(!pendingPreview)return;
 clearTimeout(pendingPreview.timer);
 pendingPreview=null;
}
let focusPreviewToken=0;
function dismissPreview(){
 cancelPendingPreview();
 // As with short Hero Book tooltips, observe only while rich preview exists.
 liveRemovalObserver?.disconnect();
 liveRemovalObserver=null;
 livePreview?.remove();
 root.PandoraGuideTooltip.unlinkDescription(liveTarget,livePreview?.id);
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
 // Escape must cancel an already scheduled post-focus preview as well.
 // Otherwise the next animation frame can reopen the tooltip immediately.
 focusPreviewToken++;
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
  if(!target.isConnected||target.querySelector?.('[data-issue-tooltip]:hover')||
   liveTarget===target&&livePreview?.isConnected)return;
  dismissPreview();
  const tip=el('aside',{id:'stage-gear-tooltip',class:'stage-hover-preview stage-item-tooltip',
   role:'tooltip'},[summary(record,icon,kind,context)]);
  livePreview=tip;liveTarget=target;
  document.body.append(tip);
  root.PandoraGuideTooltip.linkDescription(target,tip.id);
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
  if(typeof MutationObserver==='function'&&document.body){
   liveRemovalObserver=new MutationObserver(()=>{
    if(liveTarget===target&&!target.isConnected)dismissPreview();
   });
   liveRemovalObserver.observe(document.body,{childList:true,subtree:true});
  }
 };
 const remove=()=>{
  if(liveTarget===target||pendingPreview?.target===target)dismissPreview();
 };
 target.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  if(target.querySelector?.('[data-issue-tooltip]:hover'))return;
  dismissPreview();
  queuePreview(target,show);
 });
 target.addEventListener('pointerover',event=>{
  if(event.target?.closest?.('[data-issue-tooltip]')){dismissPreview();return}
  if(event.relatedTarget?.closest?.('[data-issue-tooltip]')&&target.matches(':hover'))
   queuePreview(target,show);
 });
 target.addEventListener('pointerleave',remove);
 target.addEventListener('pointerdown',remove);
 target.addEventListener('focus',()=>{
  const token=++focusPreviewToken;
  // Keyboard focus remains immediately accessible, but the browser may
  // scroll the focused link into view after dispatching focus. A scroll
  // dismisses all stale popups, so re-open on the next frame if the same
  // keyboard-focused item is still active. Pointer focus is unaffected.
  if(target.matches(':focus-visible'))show();
  root.requestAnimationFrame?.(()=>{
   if(token===focusPreviewToken&&target.isConnected&&document.activeElement===target&&
    target.matches(':focus-visible')&&!livePreview)show();
  });
 });
 target.addEventListener('blur',()=>{focusPreviewToken++;remove()});
 target.addEventListener('click',remove);
}
function render(root,api){
 const {record,slot,mode,icons,refinement,souls,gems,gameTables}=api;
 const plan=globalThis.PandoraEquipmentPlan;
 const refinable=plan.canRefine(slot);
 const cap=Number.isInteger(api.capacity)?api.capacity:plan.socketCapacity(record);
 const hasSouls=plan.canSocket(slot,record,cap);
 if(mode==='gems'||mode==='souls'&&!hasSouls){api.changeMode('details');return}
 const english=document.documentElement?.lang==='en',tr=(ru,en)=>english?en:ru;
 const copy=(key,ru,en)=>api.copyLabel?.(key,ru,en)||tr(ru,en);
 // Bind only immutable user-facing prefixes; numeric slots, Soul names and
 // selected state stay outside the D1 editorial value.
 const bind=(node,key,ru,en,attribute='text',suffix='')=>{
  if(api.bindInterfaceText)return api.bindInterfaceText(node,key,ru,en,attribute,suffix);
  const value=copy(key,ru,en)+suffix;
  if(attribute==='text')node.textContent=value;
  else node.setAttribute(attribute,value);
  return node;
 };
 const head=el('div',{class:'stage-picker-head'},[
  el('strong',{text:api.slotLabel||tr('Слот: ','Slot: ')+slot}),
  bind(el('button',{type:'button',text:'✕',onclick:api.close}),
   'pickerItemClose','Закрыть настройку','Close item settings','aria-label')
 ]);root.append(head);
 const editable=(node,key,ru,en,options)=>{api.editLabel?.(node,key,ru,en,options);return node};
 const labeledAction=(button,key,ru,en,prefix='')=>{
  if(!api.canEdit)return button;
  const caption=editable(el('span',{class:'stage-copy-caption',text:copy(key,ru,en)}),key,ru,en);
  const pencil=el('button',{type:'button',class:'stage-control-pencil',
   text:'✎','aria-label':tr('Изменить надпись: ','Edit caption: ')+copy(key,ru,en)});
  const start=event=>{
   event.preventDefault();event.stopPropagation();
   // Sibling button: editing must never activate the underlying tab/refinement.
   caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
  };
  const syncName=()=>pencil.setAttribute('aria-label',
   tr('Изменить надпись: ','Edit caption: ')+caption.textContent);
  pencil.addEventListener('click',start);
  pencil.addEventListener('focus',syncName);
  pencil.addEventListener('pointerenter',syncName);
  button.replaceChildren(...(prefix?[el('span',{class:'stage-action-glyph',text:prefix})]:[]),
   caption);
  const wrapper=el('span',{class:'stage-action-edit-wrap'});
  wrapper.append(button,pencil);
  return wrapper;
 };
 const tabs=bind(el('nav',{class:'stage-rich-tabs'+(hasSouls?' has-souls':' no-souls'),
  role:'group'}),'pickerItemSettings','Настройка предмета','Item settings','aria-label');
 const sections=[
  ['choose',tr('Выбор','Choose')],
  ['details',tr('Свойства','Properties')]
 ];
 if(hasSouls)sections.push(['souls',tr('Души','Souls')]);
 for(const [key,title]of sections){
  const names={choose:['Выбор','Choose'],details:['Свойства','Properties'],
   souls:['Души','Souls']};
  const [ru,en]=names[key],text=copy('tab.'+key,ru,en);
  const button=el('button',{type:'button',text,
   class:mode===key?'chosen':'','aria-pressed':String(mode===key),
   'data-stage-tab':key,disabled:!record&&key!=='choose',
   onclick:event=>{
    if(event?.target?.closest?.('.stage-control-pencil,.wiki-inline-input'))return;
    api.changeMode(key);
   }});
  tabs.append(labeledAction(button,'tab.'+key,ru,en));
 }
 root.append(tabs);
 if(!record){
  const ru='Сначала выбери предмет.',en='Choose an item first.';
  root.append(editable(el('p',{class:'muted',text:copy('chooseItemEmpty',ru,en)}),
   'chooseItemEmpty',ru,en));return
 }
 const body=el('div',{class:'stage-rich-body'+(mode==='details'?' stage-rich-details':'')});root.append(body);
 if(mode==='details'){
  body.append(summary(record,icons,'item',{slot,refinement,
   gem:globalThis.PandoraEnchantModel?.normalizeForSlot?.(slot,gems),
   capacity:cap,socketedCount:plan.asSocketArray(souls).slice(0,Math.max(0,cap??0))
    .filter(Boolean).length,tables:gameTables,copyLabel:copy,editLabel:editable}));
  if(plan.supportsSoulSlot(slot)&&typeof api.updateSocketCapacity==='function'){
   const frame=el('fieldset',{class:'stage-enchant-fieldset stage-soul-capacity-fieldset'});
   frame.append(editable(el('legend',{text:copy('socketCapacityHeading',
    'Слоты душ','Soul slots')}),
    'socketCapacityHeading','Слоты душ','Soul slots'));
   const choices=el('div',{class:'stage-enchant-options is-element-options'});
   for(let n=0;n<=3;n++){
    const occupiedBeyond=plan.asSocketArray(souls).slice(n).some(Boolean);
    const btn=el('button',{type:'button',text:String(n),
     class:n===cap?'chosen':'','aria-pressed':String(n===cap),
     'aria-label':tr('Слоты душ: ','Soul slots: ')+n,
     'data-socket-capacity':String(n),
     title:occupiedBeyond?copy('socketOverflowHint',
      'Сначала извлеките души из лишних слотов',
      'Remove Souls from extra sockets first'):'',
     disabled:occupiedBeyond,
     onclick:()=>api.updateSocketCapacity(n)});
    choices.append(btn);
   }
   frame.append(choices);
   if(plan.asSocketArray(souls).slice(1).some(Boolean)){
    const ru='Сначала извлеките души из лишних слотов';
    const en='Remove Souls from extra sockets first';
    frame.append(editable(el('small',{class:'stage-socket-capacity-hint',
     text:copy('socketOverflowHint',ru,en)}),'socketOverflowHint',ru,en));
   }
   body.append(frame);
  }
  if(refinable){
   const grade=Number(refinement)||0,buttons=el('div',{class:'stage-grade'});
   for(let n=0;n<=10;n++)buttons.append(el('button',{type:'button',text:'+'+n,
    class:n===grade?'chosen':'','aria-pressed':String(n===grade),'data-grade':String(n),onclick:()=>api.updateGrade(n)}));
   const forgeFrame=el('fieldset',{class:'stage-enchant-fieldset stage-refine-fieldset'});
   forgeFrame.append(editable(el('legend',{
    text:copy('refinementHeading','Заточка: +0…+10','Refinement: +0…+10')}),
    'refinementHeading','Заточка: +0…+10','Refinement: +0…+10'),buttons);
   body.append(forgeFrame);
   // Item properties expose actual grade; inferred weapon math stays out of the editor.
   const model=globalThis.PandoraEnchantModel,choice=model.normalize(gems);
   const elementIcons={fire:'🔥',ice:'❄️',lightning:'⚡',poison:'☠️',
    light:'☀️',dark:'🌑',rainbow:'🌈'};
   const group=(label,entries,key)=>{
    const box=el('fieldset',{class:'stage-enchant-fieldset stage-enchant-inline stage-enchant-'+key});
    const line=el('div',{class:'stage-enchant-options '+(key==='element'?'is-element-options':'is-type-options')});
    const editKey=key==='type'?'gemTypeLabel':'gemElementLabel';
    const baseRu=key==='type'?'Тип':'Стихия',baseEn=key==='type'?'Type':'Element';
    box.append(editable(el('legend',{text:copy(editKey,baseRu,baseEn)}),
     editKey,baseRu,baseEn));
    for(const option of entries){
     const name=english?option.en:option.ru;
     const iconText=key==='element'?(elementIcons[option.id]||'✦')+' ':'';
     const captionKey='gem.'+key+'.'+option.id;
     const button=el('button',{type:'button',
      text:iconText+copy(captionKey,option.ru,option.en),
      class:choice?.[key]===option.id?'chosen':'',
      'aria-label':label+': '+name,'aria-pressed':String(choice?.[key]===option.id),
      'data-enchant-key':key,'data-enchant-value':option.id,
      onclick:event=>{
       if(event?.target?.closest?.('.stage-control-pencil,.wiki-inline-input'))return;
       api.assignGem({type:key==='type'?option.id:(choice?.type||'physical'),
        element:key==='element'?option.id:(choice?.element||'fire')});
      }});
     line.append(labeledAction(button,captionKey,option.ru,option.en,iconText));
    }
    box.append(line);return box;
   };

   if(slot==='weapon')body.append(group(tr('Тип','Type'),model.types,'type'));
   body.append(group(tr('Стихия','Element'),model.elements,'element'));
  }
  // Souls are managed exclusively in the existing dedicated "Души" tab.
 }else if(mode==='souls'){
  const row=el('div',{class:'stage-rich-sockets'});
  for(let i=0;i<cap;i++){
   const value=souls[i],soul=value&&api.catalog.souls?.[String(value.id)],selected=i===api.selectedSocket;
   const button=el('button',{type:'button',class:selected?'selected':'','aria-pressed':String(selected),
    'data-socket-index':String(i),onclick:()=>api.openSocket(i)});
   bind(button,'pickerSoulSlotAria','Слот души ','Soul slot ','aria-label',
    (i+1)+': '+(soul?.name||copy('pickerEmptySoul','пусто','empty')));
   const src=soul&&icons(soul,'soul');
   if(src){const image=el('img',{src,alt:''});image.onerror=()=>image.replaceWith(el('span',{text:'✦'}));button.append(image)}
   else button.append(el('span',{class:'stage-soul-slot-empty',text:soul?'✦':'+'}));
   button.append(bind(el('small',{}),'pickerSoulSlotCaption',
    'Слот ','Slot ','text',String(i+1)));
   row.append(button);attachPreview(button,soul,icons,'soul');
  }
  body.append(editable(el('h4',{
   text:copy('soulSlotsHeading','Слоты душ','Soul slots')}),
   'soulSlotsHeading','Слоты душ','Soul slots'),row);
  const searchRu='Поиск совместимой души',searchEn='Find a compatible Soul';
  const query=el('input',{type:'search',placeholder:copy('soulSearch',searchRu,searchEn),
   'data-soul-query':'1','data-equipment-copy-placeholder':'soulSearch',
    value:api.soulQuery||''});
  bind(query,'pickerSoulSearchAria','Поиск души','Find Soul','aria-label');
  const list=el('div',{class:'stage-rich-list'});
  const draw=()=>{
   list.replaceChildren();const needle=String(query.value||'').trim().toLocaleLowerCase('ru');
   const results=Object.values(api.catalog.souls||{}).filter(rec=>plan.validSoul(rec,slot)&&
    String(rec.name||'').toLocaleLowerCase('ru').includes(needle));
   for(const rec of results.slice(0,80)){
    const button=el('button',{type:'button',class:'stage-rich-result',
     onclick:event=>{
      if(event?.target?.closest?.('.stage-control-pencil,.wiki-inline-input'))return;
      api.assignSoul(rec);
     }});
    const src=icons(rec,'soul');
    if(src){const image=el('img',{src,alt:''});image.onerror=()=>image.replaceWith(el('span',{text:'✦'}));button.append(image)}
    const name=globalThis.PandoraItemPresentation?.displayName(rec,
     tr('Душа без названия','Unnamed Soul'),english?'en':'ru')||
     tr('Душа без названия','Unnamed Soul');
    const caption=el('span',{text:name,class:'stage-soul-result-caption'});
    if(api.canEdit){
     caption.setAttribute('data-owner-record','soul:'+rec.id);
     caption.setAttribute('data-owner-field',english?'nameEn':'name');
     const pencil=el('button',{type:'button',class:'stage-control-pencil',
      text:'✎','aria-label':tr('Изменить душу: ','Edit Soul: ')+name});
     const edit=event=>{
      event.preventDefault();event.stopPropagation();
      caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
     };
     pencil.addEventListener('click',edit);
     pencil.addEventListener('focus',()=>pencil.setAttribute('aria-label',
      tr('Изменить душу: ','Edit Soul: ')+caption.textContent));
     button.append(caption);
     const wrapper=el('div',{class:'stage-rich-result-edit-wrap'});
     wrapper.append(button,pencil);
     list.append(wrapper);
    }else{button.append(caption);list.append(button)}
    attachPreview(button,rec,icons,'soul');
   }
   if(results.length>80){
    const ru='Показано 80 душ. Уточни поиск.',en='Showing 80 Souls. Narrow your search.';
    list.append(editable(el('p',{class:'muted',text:copy('soulSearchLimit',ru,en)}),
     'soulSearchLimit',ru,en));
   }
   if(!results.length){
    const ru='Совместимых душ не найдено',en='No compatible Souls found';
    list.append(editable(el('p',{class:'muted',text:copy('soulSearchEmpty',ru,en)}),
     'soulSearchEmpty',ru,en));
   }
  };
  query.addEventListener('input',()=>{api.onSoulQuery?.(query.value);draw()});
  if(api.canEdit)body.append(editable(el('label',{
   class:'stage-soul-search-caption',text:copy('soulSearch',searchRu,searchEn)}),
   'soulSearch',searchRu,searchEn,{onCommitted:visible=>{query.placeholder=visible;}}));
  const removeRu='Извлечь душу из выбранного слота';
  const removeEn='Remove Soul from selected slot';
  const remove=el('button',{type:'button',class:'stage-enchant-reset',
   text:'✕ '+copy('soulRemove',removeRu,removeEn),
   onclick:event=>{
    if(event?.target?.closest?.('.stage-control-pencil,.wiki-inline-input'))return;
    api.assignSoul(null);
   }});
  body.append(query,labeledAction(remove,'soulRemove',removeRu,removeEn,'✕'),list);
  draw();
 }
}
root.PandoraStageItemUI=Object.freeze({render,summary,attachPreview,dismissPreview});
})(typeof window==='undefined'?globalThis:window);
