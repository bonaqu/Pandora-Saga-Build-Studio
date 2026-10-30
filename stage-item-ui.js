(function(root){
'use strict';
const el=(tag,attrs={},children=[])=>{
 const n=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs)){
  if(k==='class')n.className=v;else if(k==='text')n.textContent=v;
  else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);
  else if(v!==null&&v!==undefined)n.setAttribute(k,String(v));
 }
 for(const x of children)n.append(typeof x==='string'?document.createTextNode(x):x);
 return n;
};
function summary(record,icon,kind='item'){
 const wrap=el('div',{class:'stage-rich-summary'});
 if(!record)return el('p',{class:'muted',text:'Данные о предмете пока не загружены'});
 const head=el('div',{class:'stage-rich-head'});
 const src=icon(record,kind);
 if(src){const img=el('img',{src,alt:''});img.onerror=()=>img.replaceWith(el('span',{text:'✦'}));head.append(img)}
 head.append(el('strong',{text:record.name||String(record.id)}));wrap.append(head);
 const dl=el('dl',{class:'stage-rich-fields'});
 const rows=kind==='soul'?[['ID',record.id],['Слоты',record.slots?.join(', ')]]:
 [['ID',record.id],['Тип',record.kind],['Уровень',record.level],['Атака',record.W],['Защита',record.AC],['Гнёзда',record.soulslot],['Скорость',record.atkspeed],['Дальность',record.range]];
 for(const [key,value] of rows)if(value!==null&&value!==undefined&&value!=='')dl.append(el('dt',{text:key}),el('dd',{text:String(value)}));
 wrap.append(dl);
 if(record.desc)wrap.append(el('p',{class:'stage-rich-desc',text:record.desc}));
 return wrap;
}
function attachPreview(target,record,icon,kind='item'){
 if(!record)return;
 let tip=null;
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
 const {record,item,slot,slotIndex,mode,icons,refinement,souls,gems,gameTables}=api;
 const head=el('div',{class:'stage-picker-head'},[
  el('strong',{text:record?.name||'Слот: '+slot}),el('button',{type:'button',text:'✕',onclick:api.close})
 ]);
 root.append(head);
 const tabs=el('nav',{class:'stage-rich-tabs',role:'group','aria-label':'Настройка предмета'});
 for(const [key,text] of [['choose','Выбор'],['details','Свойства'],['souls','Души'],['gems','Самоцветы']]){
  const b=el('button',{type:'button',text,class:mode===key?'chosen':'',
   'aria-pressed':String(mode===key),disabled:!record&&key!=='choose',
   onclick:()=>api.changeMode(key)});
  tabs.append(b);
 }
 root.append(tabs);
 if(!record){root.append(el('p',{class:'muted',text:'Сначала выбери предмет.'}));return}
 const body=el('div',{class:'stage-rich-body'});root.append(body);
 if(mode==='details'){
  body.append(summary(record,icons));
  const grade=Number(refinement)||0,level=el('div',{class:'stage-grade'});
  for(let i=0;i<=10;i++)level.append(el('button',{type:'button',text:'+'+i,class:i===grade?'chosen':'',
   'aria-pressed':String(i===grade),onclick:()=>api.updateGrade(i)}));
  body.append(el('h4',{text:'Заточка: +0…+10'}),level);
  const bonus=gameTables?.weaponPlus?.[String(grade)];
  body.append(el('p',{class:'stage-rich-note',text:grade===0?'Без улучшения.':
   slot==='weapon'&&bonus?'Таблица OS: '+bonus.ratio+'% и '+bonus.flat+' ед. (не итоговый урон).':
   'Уровень заточки сохранён; расчёт итоговых характеристик пока не подтверждён.'}));
  const cap=record.soulslot==null?null:Number(record.soulslot);
  body.append(el('h4',{text:'Гнёзда душ: '+(cap===null?'неизвестно':cap)}));
  if(Number.isInteger(cap)&&cap>0&&cap<=32){
   const sockets=el('div',{class:'stage-rich-sockets'});
   for(let i=0;i<cap;i++){
    const val=souls[i],soul=val&&api.catalog.souls?.[String(val.id)];
    const b=el('button',{type:'button','aria-label':'Гнездо '+(i+1)+': '+(soul?.name||'пусто'),
      onclick:()=>api.openSocket(i)});
    const src=soul&&icons(soul,'soul');
    if(src){const img=el('img',{src,alt:''});img.onerror=()=>img.replaceWith(el('span',{text:'✦'}));b.append(img)}
    else b.append(el('span',{text:soul?'✦':'+'}));
    b.append(el('small',{text:soul?.name||String(i+1)}));
    sockets.append(b);attachPreview(b,soul,icons,'soul');
   }body.append(sockets);
  }else if(cap===null)body.append(el('p',{class:'muted',text:'Число гнёзд не подтверждено в каталоге'}));
  body.append(el('button',{type:'button',class:'stage-rich-switch',text:gems?.name?'Самоцвет: '+gems.name:'Выбрать самоцвет',
   onclick:()=>api.changeMode('gems')}));
  body.append(el('p',{class:'stage-rich-note',text:'Самоцвет — план выбора. Шансы и эффекты применяются только после проверки игровых правил.'}));
 }else if(mode==='souls'||mode==='gems'){
  if(mode==='souls'&&(!Number.isInteger(Number(record.soulslot))||Number(record.soulslot)<=0||
    !Number.isInteger(api.selectedSocket)||api.selectedSocket<0||api.selectedSocket>=Number(record.soulslot))){
   body.append(el('p',{class:'muted',text:'Для этого предмета нет подтверждённого свободного гнезда. Открой гнездо со страницы «Свойства». '}));return;
  }
  const soulMode=mode==='souls',query=el('input',{type:'search',placeholder:soulMode?'Поиск души':'Поиск самоцвета','aria-label':soulMode?'Поиск душ':'Поиск самоцветов'});
  const list=el('div',{class:'stage-rich-list'});
  const reset=el('button',{type:'button',text:soulMode?'✕ Извлечь душу':'✕ Без самоцвета',
   onclick:()=>soulMode?api.assignSoul(null):api.assignGem(null)});
  const draw=()=>{
   list.replaceChildren();const needle=query.value.trim().toLocaleLowerCase('ru');
   const entries=Object.values(soulMode?api.catalog.souls||{}:api.catalog.equipment||{})
    .filter(x=>(soulMode?x.slots?.includes(slot):x.kind==='RUNEGEM')&&(String(x.name||'')+' '+x.id).toLocaleLowerCase('ru').includes(needle));
   for(const rec of entries.slice(0,80)){
    const b=el('button',{type:'button',class:'stage-rich-result',onclick:()=>soulMode?api.assignSoul(rec):api.assignGem(rec)});
    const src=icons(rec,soulMode?'soul':'item');
    if(src){const img=el('img',{src,alt:''});img.onerror=()=>img.replaceWith(el('span',{text:'✦'}));b.append(img)}
    b.append(el('span',{text:rec.name||String(rec.id)}));list.append(b);attachPreview(b,rec,icons,soulMode?'soul':'item');
   }
   if(entries.length>80)list.append(el('p',{class:'muted',text:'Показано 80 результатов. Уточни поиск.'}));
   if(!entries.length)list.append(el('p',{class:'muted',text:'Совместимых записей не найдено'}));
  };
  query.addEventListener('input',draw);
  body.append(el('p',{class:'stage-rich-note',text:soulMode?
   'Подходящие души выбираются по типу гнезда из OS.':'Самоцветы RUNEGEM из OS. Совместимость и бонусы пока не подтверждены — только план.'}),
   query,reset,list);draw();
 }
}
root.PandoraStageItemUI=Object.freeze({render,summary,attachPreview});
})(typeof window==='undefined'?globalThis:window);
