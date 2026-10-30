(function(root){
'use strict';
// Read-only provenance view: the source records are not a combat calculation.
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
 const intro=page==='attack'?'Базовые параметры оружия из OS':
 page==='defense'?'Базовая защита отдельных предметов из OS':'Эффекты предметов и душ из OS';
 body.append(make('p',{class:'stage-attribute-note',text:intro+'. Это не рассчитанные характеристики персонажа.'}));
 const selected=items.filter(x=>page==='attack'?x.record?.slot==='weapon':
 page==='defense'?x.record&&(x.record.AC!=null||x.record.block!=null):x.record);
 if(!selected.length)body.append(make('p',{class:'muted',text:'Нет записей для этой вкладки'}));
 for(const row of selected){
  const rec=row.record,card=make('section',{class:'stage-attribute-row'});
  const top=make('div',{class:'stage-attribute-identity'});
  const src=icon(rec);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));top.append(img)}
  top.append(make('b',{text:rec.name||'Предмет без названия'}));
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
    card.append(make('p',{class:'stage-attribute-soul',text:'✦ '+(soul.name||'Душа без названия')+
     ' · '+(soul.desc||'Описание души не найдено')}));
   }
  }body.append(card);
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
  card.append(make('strong',{text:'Подтверждённые бонусы снаряжения и душ — не итоговые статы'}));
  for(const [key,val] of active)card.append(make('p',{text:names[key]+': '+(val>=0?'+':'')+val}));
  body.prepend(card);
 }
 body.append(make('p',{class:'stage-attribute-warning',text:
  'Это частичные бонусы известных EP_* кодов из OS, а не итоговые сопротивления, атака или крит. '+
  'Базовые значения, процентные эффекты, комплекты, усиления и баффы не включены в эти числа.'}));
 target.append(body);
}
root.PandoraStageAttributes=Object.freeze({render});
})(typeof window==='undefined'?globalThis:window);
