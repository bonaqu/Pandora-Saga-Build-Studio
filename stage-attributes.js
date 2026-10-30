(function(root){
'use strict';
// Read-only provenance view: the source records are not a combat calculation.
function make(tag,attrs={},children=[]){
 const n=document.createElement(tag);
 for(const [key,value] of Object.entries(attrs)){
  if(key==='text')n.textContent=value;
  else if(key==='class')n.className=value;
  else if(key.startsWith('on'))n.addEventListener(key.slice(2),value);
  else if(value!==null&&value!==undefined)n.setAttribute(key,String(value));
 }
 for(const child of children)n.append(typeof child==='string'?document.createTextNode(child):child);
 return n;
}
function render(target,{page,items,icon,onPage,onClose}){
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
  top.append(make('b',{text:rec.name||String(rec.id)}));
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
   if(effects.length)card.append(make('p',{class:'stage-attribute-note',text:
    'Исходные коды эффектов: '+effects.map(e=>e.func+
     (e.a==null?'':' ('+e.a+(e.b==null?'':', '+e.b)+')')).join('; ')}));
   if(row.souls.length)for(const soul of row.souls){
    card.append(make('p',{class:'stage-attribute-soul',text:'✦ '+(soul.name||soul.id)+
     ' · '+(soul.desc||'Описание души не найдено')}));
   }
  }body.append(card);
 }
 body.append(make('p',{class:'stage-attribute-warning',text:
  'Итоговые HP/MP, сопротивления, криты, баффы и скорость применения умений не вычислены. '+
  'Достоверность полного расчёта по текущему серверу ещё не подтверждена.'}));
 target.append(body);
}
root.PandoraStageAttributes=Object.freeze({render});
})(typeof window==='undefined'?globalThis:window);
