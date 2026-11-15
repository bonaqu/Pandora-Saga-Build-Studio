(function(root){
'use strict';
// A single compact owner-only table; no changes are written until Save.
// The standard admin override endpoint provides atomic CAS for the whole set.
function open({modal,h,lang='ru',readRaw,write,reset,canCommit=()=>true,onApplied}){
 const model=root.PandoraLevelProgression;
 if(!model)throw Error('Модель уровней не подключена');
 const tr=(ru,en)=>lang==='en'?en:ru;
 let before=model.get(),draft=model.get(),saving=false;
 let previousRaw=readRaw();
 const wrap=h('section',{class:'ps-level-editor'});
 const intro=h('p',{class:'ps-level-editor-intro',text:tr(
  'Прокачка персонажа в Build Studio. Изменения сохраняются отдельно от игрового каталога. Обновление текущей игры их не сбрасывает.',
  'Character progression in Build Studio. Changes are saved separately from the game catalog and cannot be replaced by game catalog sync.')});
 const top=h('div',{class:'ps-level-editor-top'});
 const maxLabel=h('label',{class:'ps-level-editor-cap'},[
  h('span',{text:tr('Максимальный уровень','Maximum level')}),
  h('input',{type:'number',min:String(model.MIN_LEVEL),max:String(model.CEILING),step:'1',
    value:String(draft.maxLevel),'aria-label':tr('Максимальный уровень героя','Character maximum level')})
 ]);
 const capInput=maxLabel.querySelector('input');
 const quick=h('button',{type:'button',class:'button-action',text:tr('Повторить прибавку последнего уровня','Copy last level gain')});
 const head=h('p',{class:'ps-level-editor-help',text:tr(
  'Первый уровень — 0 свободных очков. Для новых уровней прибавки равны нулю, пока ты их не заполнишь. Можно выделить конкретное число и изменить его.',
  'Level 1 starts with 0 free points. New levels have zero gains until you enter them. You can edit any individual gain.')});
 top.append(maxLabel,quick);
 const scroller=h('div',{class:'ps-level-editor-scroll'});
 const table=h('table',{class:'ps-level-editor-table'});
 const thead=h('thead',{},[h('tr',{},[
  h('th',{text:tr('Ур.','Lv.')}),
  h('th',{text:tr('+ Характеристики','+ Attributes')}),
  h('th',{text:tr('Всего','Total')}),
  h('th',{text:tr('+ Умения','+ Skills')}),
  h('th',{text:tr('Всего','Total')})
 ])]);
 const body=h('tbody');table.append(thead,body);scroller.append(table);
 const total=h('p',{class:'ps-level-editor-summary'});
 const changes=h('p',{class:'ps-level-editor-changes'});
 const status=h('p',{class:'ps-level-editor-state',role:'status'});
 const controls=h('div',{class:'ps-level-editor-actions'});
 const undo=h('button',{type:'button',class:'button-action',text:tr('Отменить несохранённое','Discard unsaved')});
 const restore=h('button',{type:'button',class:'button-action',text:tr('Вернуть исходные начисления','Restore defaults')});
 const save=h('button',{type:'button',class:'button-action primary',text:tr('Сохранить в D1','Save to D1')});
 controls.append(undo,restore,save);
 wrap.append(intro,top,head,scroller,total,changes,status,controls);
 const dialog=modal(tr('Очки за уровни · 1–120','Level-up points · 1–120'),wrap,{
  canClose:()=>!saving&&(!changed()||confirm(tr(
   'Есть несохранённые изменения. Закрыть без сохранения?',
   'There are unsaved changes. Close without saving?')))
 });
 const isInteger=v=>/^\d{1,3}$/.test(String(v))&&Number.isInteger(Number(v))&&Number(v)<=model.MAX_GRANT;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const changed=()=>!same(draft,before);
 const entries=new Map();
 const drawRows=()=>{
  body.replaceChildren();entries.clear();
  for(let level=1;level<=draft.maxLevel;level++){
   const original=level<=before.maxLevel?before:null;
   const row=h('tr',{'data-level':String(level)});
   const at=h('input',{type:'number',min:'0',max:String(model.MAX_GRANT),step:'1',
    value:String(draft.attributes[level]),disabled:level===1,
    'aria-label':tr('Очки характеристик за уровень ','Attribute points gained at level ')+level});
   const sk=h('input',{type:'number',min:'0',max:String(model.MAX_GRANT),step:'1',
    value:String(draft.skills[level]),disabled:level===1,
    'aria-label':tr('Очки умений за уровень ','Skill points gained at level ')+level});
   const prevAttr=h('small',{class:'ps-level-editor-was'});
   const prevSkill=h('small',{class:'ps-level-editor-was'});
   const ta=h('strong',{class:'ps-level-editor-total'}),ts=h('strong',{class:'ps-level-editor-total'});
   const aCell=h('td',{},[at,prevAttr]),sCell=h('td',{},[sk,prevSkill]);
   row.append(h('th',{scope:'row',text:String(level)}),aCell,h('td',{},[ta]),
    sCell,h('td',{},[ts]));
   body.append(row);
   entries.set(level,{row,at,sk,prevAttr,prevSkill,ta,ts,original});
   for(const [input,field] of [[at,'attributes'],[sk,'skills']]){
    input.addEventListener('input',()=>{
     const raw=input.value.trim();
     draft[field][level]=isInteger(raw)?Number(raw):NaN;
     update();
    });
   }
  }
  update();
 };
 const update=()=>{
  const result=model.validate(draft);
  let a=0,b=0,count=0;
  for(const [level,node] of entries){
   const addA=draft.attributes[level],addB=draft.skills[level];
   if(Number.isFinite(addA))a+=addA;else a=NaN;
   if(Number.isFinite(addB))b+=addB;else b=NaN;
   node.ta.textContent=Number.isFinite(a)?String(a):'—';
   node.ts.textContent=Number.isFinite(b)?String(b):'—';
   const oldA=node.original?.attributes[level],oldB=node.original?.skills[level];
   const changedA=oldA!==addA,changedB=oldB!==addB;
   if(changedA)count++;if(changedB)count++;
   node.at.classList.toggle('ps-level-changed',changedA);
   node.sk.classList.toggle('ps-level-changed',changedB);
   node.prevAttr.textContent=oldA===undefined?tr('Новый уровень','New level'):
    changedA?tr('Было: ','Was: ')+oldA:'';
   node.prevSkill.textContent=oldB===undefined?tr('Новый уровень','New level'):
    changedB?tr('Было: ','Was: ')+oldB:'';
   node.row.classList.toggle('ps-level-edited',changedA||changedB);
  }
  total.textContent=tr('На ','At ')+draft.maxLevel+tr('-м уровне: ',': ')+
   (Number.isFinite(a)?a:'—')+tr(' характеристик · ',' attributes · ')+
   (Number.isFinite(b)?b:'—')+tr(' умений',' skills');
  const hasDiff=changed();
  changes.textContent=hasDiff?
   tr('Изменено прибавок: ','Changed gains: ')+count+
   (draft.maxLevel!==before.maxLevel?tr(' · Максимальный уровень: ',
    ' · Max level: ')+before.maxLevel+' → '+draft.maxLevel:''):
   tr('Нет несохранённых изменений.','No unsaved changes.');
  const valid=Boolean(result.ok);
  status.textContent=!valid?result.error:hasDiff?
   tr('Изменения ещё не опубликованы. Проверь таблицу перед сохранением.',
    'Changes are not published yet. Review the table before saving.'):
   tr('Таблица соответствует сохранённой версии.','The table matches the saved version.');
  status.classList.toggle('ps-level-editor-error',!valid);
  save.disabled=saving||!valid||!hasDiff;
  undo.disabled=saving||!hasDiff;
  restore.disabled=saving||previousRaw===null;
  capInput.disabled=saving;quick.disabled=saving;
  for(const node of entries.values()){node.at.disabled=saving||node.at.closest('tr')?.dataset.level==='1';
   node.sk.disabled=saving||node.sk.closest('tr')?.dataset.level==='1';}
 };
 capInput.addEventListener('change',()=>{
  const n=Number(capInput.value);
  const changedMax=model.resize(draft,n);
  if(!changedMax){
   capInput.value=String(draft.maxLevel);
   status.textContent=tr('Максимум можно выбрать в пределах 55–120.',
    'Maximum level is supported from 55 to 120.');
   return;
  }
  draft=changedMax;drawRows();
 });
 quick.onclick=()=>{
  if(draft.maxLevel<=55)return;
  const lastKnown=Math.min(before.maxLevel,draft.maxLevel);
  const a=draft.attributes[lastKnown],b=draft.skills[lastKnown];
  if(!isInteger(a)||!isInteger(b))return;
  for(let i=lastKnown+1;i<=draft.maxLevel;i++){
   draft.attributes[i]=a;draft.skills[i]=b;
   const node=entries.get(i);
   if(node){node.at.value=String(a);node.sk.value=String(b)}
  }
  update();
  status.textContent=tr('Прибавки скопированы как шаблон. Проверь их соответствие игровому обновлению.',
   'Gains were copied as a template. Verify them against the game update.');
 };
 undo.onclick=()=>{draft=model.validate(before).value;capInput.value=String(draft.maxLevel);drawRows()};
 restore.onclick=async()=>{
  if(!previousRaw)return;
  if(!canCommit())return;
  if(!confirm(tr('Удалить собственную таблицу из D1 и вернуть первоначальные начисления? Эта операция повлияет на все билды.',
   'Remove the custom table from D1 and restore the original gains? This affects all builds.')))return;
  saving=true;update();
  try{
   const result=await reset();
   await onApplied(null);
   previousRaw=null;before=model.get();draft=model.get();
   capInput.value=String(draft.maxLevel);drawRows();
   status.textContent=tr('Исходные начисления восстановлены и проверены в D1.',
    'Default gains restored and verified in D1.');
  }catch(error){status.textContent=tr('Не удалось сбросить таблицу: ',
   'Could not restore defaults: ')+error.message;
   status.classList.add('ps-level-editor-error');}
  finally{saving=false;update()}
 };
 save.onclick=async()=>{
  if(!canCommit()||saving)return;
  const valid=model.validate(draft);if(!valid.ok){update();return}
  if(!confirm(tr(
   'Сохранить новую таблицу для ВСЕХ персонажей? Показанные свободные очки будут пересчитаны. Изменения каталога игры не затронутся.',
   'Publish this progression for ALL characters? Free points will be recalculated. The game catalog is not changed.')))return;
  saving=true;update();
  try{
   const serialized=JSON.stringify(valid.value);
   await write(serialized);
   await onApplied(serialized);
   previousRaw=serialized;before=model.get();draft=model.get();
   capInput.value=String(draft.maxLevel);drawRows();
   status.textContent=tr('Сохранено в D1. Чтение подтверждено, расчёты обновлены.',
    'Saved to D1. Read-back verified and calculations updated.');
  }catch(error){status.textContent=tr('Сохранение не выполнено: ',
   'Save failed: ')+error.message;
   status.classList.add('ps-level-editor-error');}
  finally{saving=false;update()}
 };
 drawRows();return dialog;
}
root.PandoraProgressionOwnerEditor=Object.freeze({open});
})(typeof window==='undefined'?globalThis:window);
