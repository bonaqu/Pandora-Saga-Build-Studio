(function(root){
'use strict';
const el=(tag,attrs={},children=[])=>{
 const e=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs)){
  if(k==='class')e.className=v;else if(k==='text')e.textContent=v;
  else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
  else if(v!==null&&v!==undefined)e.setAttribute(k,String(v));
 }
 for(const child of children)e.append(typeof child==='string'?document.createTextNode(child):child);
 return e;
};
function summary(record,icon,kind='item'){
 if(!record)return el('p',{class:'muted',text:'Данные о предмете пока не загружены'});
 const presenter=globalThis.PandoraItemPresentation;
 const wrap=el('div',{class:'stage-rich-summary'}),head=el('div',{class:'stage-rich-head'});
 const src=icon(record,kind);
 if(src){const img=el('img',{src,alt:''});img.onerror=()=>img.replaceWith(el('span',{text:'✦'}));head.append(img)}
 head.append(el('strong',{text:record.name||String(record.id),
  ...(kind==='item'?{'data-edit-key':'item.'+record.id}:{})}));wrap.append(head);
 const rows=kind==='soul'?[['ID',record.id],['Подходящие слоты',(record.slots||[]).join(', ')]]:
 [['ID',record.id],['Тип',presenter?.kind(record)||'Предмет'],['Уровень',record.level],
 ['Атака',record.W],['Защита',record.AC],['Гнёзда',record.soulslot],
 ['Скорость',record.atkspeed],['Дальность',record.range]];
 const dl=el('dl',{class:'stage-rich-fields'});
 for(const [key,value] of rows)if(value!==null&&value!==undefined&&value!==''){
  const dd=el('dd',{text:String(value)});
  if(kind==='item'&&key==='Гнёзда')dd.dataset.editKey='itemslots.'+record.id;
  dl.append(el('dt',{text:key}),dd);
 }
 wrap.append(dl);
 if(record.desc){const desc=el('p',{class:'stage-rich-desc',
  text:presenter?.description(record.desc)||record.desc});
  if(kind==='item')desc.dataset.editKey='itemdesc.'+record.id;
  wrap.append(desc);
 }
 return wrap;
}
function attachPreview(target,record,icon,kind='item'){
 if(!record)return;let tip=null;
 const remove=()=>{tip?.remove();tip=null};
 target.addEventListener('mouseenter',()=>{
  remove();tip=el('aside',{class:'stage-hover-preview'},[summary(record,icon,kind)]);
  document.body.append(tip);
  const rect=target.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
  tip.style.left=Math.max(8,Math.min(innerWidth-w-8,rect.right+10))+'px';
  tip.style.top=Math.max(8,Math.min(innerHeight-h-8,rect.top))+'px';
 });
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
  el('strong',{text:record?.name||'Слот: '+slot}),
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
  body.append(summary(record,icons));
  if(refinable){
   const grade=Number(refinement)||0,buttons=el('div',{class:'stage-grade'});
   for(let n=0;n<=10;n++)buttons.append(el('button',{type:'button',text:'+'+n,
    class:n===grade?'chosen':'','aria-pressed':String(n===grade),'data-grade':String(n),onclick:()=>api.updateGrade(n)}));
   body.append(el('h4',{text:'Заточка: +0…+10'}),buttons);
   const bonus=gameTables?.weaponPlus?.[String(grade)];
   if(slot==='weapon'&&grade>0&&bonus)body.append(el('p',{class:'stage-rich-note',
    text:'Таблица OS: '+bonus.ratio+'% и '+bonus.flat+' ед. (не итоговый урон).'}));
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
   body.append(el('h4',{text:'Тип и стихия улучшения'}),
    el('p',{class:'stage-rich-note',text:'Выбирай здесь — применяется сразу, без подтверждения.'}),
    group('Тип',model.types,'type'),group('Стихия',model.elements,'element'));
   if(choice)body.append(el('button',{type:'button',class:'stage-enchant-reset',
    text:'Сбросить тип и стихию',onclick:()=>api.assignGem(null)}));
  }
  if(hasSouls)body.append(el('button',{type:'button',class:'stage-rich-switch',
   text:'✦ Души: '+souls.slice(0,cap).filter(Boolean).length+' / '+cap,
   onclick:()=>api.changeMode('souls')}));
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
    (String(rec.name||'')+' '+rec.id).toLocaleLowerCase('ru').includes(needle));
   for(const rec of results.slice(0,80)){
    const button=el('button',{type:'button',class:'stage-rich-result',onclick:()=>api.assignSoul(rec)});
    const src=icons(rec,'soul');
    if(src){const image=el('img',{src,alt:''});image.onerror=()=>image.replaceWith(el('span',{text:'✦'}));button.append(image)}
    button.append(el('span',{text:rec.name||String(rec.id)}));list.append(button);attachPreview(button,rec,icons,'soul');
   }
   if(results.length>80)list.append(el('p',{class:'muted',text:'Показано 80 душ. Уточни поиск.'}));
   if(!results.length)list.append(el('p',{class:'muted',text:'Совместимых душ не найдено'}));
  };
  query.addEventListener('input',()=>{api.onSoulQuery?.(query.value);draw()});
  body.append(el('p',{class:'stage-rich-note',text:'Выбери гнездо, затем душу. Сохраняется сразу.'}),
   query,el('button',{type:'button',class:'stage-enchant-reset',
    text:'✕ Извлечь душу из выбранного гнезда',onclick:()=>api.assignSoul(null)}),list);
  draw();
 }
}
root.PandoraStageItemUI=Object.freeze({render,summary,attachPreview});
})(typeof window==='undefined'?globalThis:window);
