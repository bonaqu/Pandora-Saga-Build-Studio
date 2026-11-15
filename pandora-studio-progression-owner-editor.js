(function(root){
'use strict';
// A single compact owner-only table; no changes are written until Save.
// The standard admin override endpoint provides atomic CAS for the whole set.
function open({modal,h,lang='ru',readRaw,write,reset,canCommit=()=>true,onApplied}){
 const model=root.PandoraLevelProgression;
 if(!model)throw Error('Модель уровней не подключена');
 const tr=(ru,en)=>lang==='en'?en:ru;
 const tip=(node,ru,en)=>{
  const message=tr(ru,en);
  if(root.PandoraGuideTooltip?.attach)
   root.PandoraGuideTooltip.attach(node,message,{hoverDelay:350});
  else node.title=message;
  return node;
 };
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
 const capInput=tip(maxLabel.querySelector('input'),
  'Измени максимум от 55 до 120. Добавленные уровни сначала имеют прибавку 0/0; это ещё не запись в D1.',
  'Set a maximum from 55 to 120. Newly added levels start at 0/0; this does not write to D1.');
 const quick=tip(h('button',{type:'button',class:'button-action ps-level-editor-fill',
  text:tr('Заполнить пустые новые уровни','Fill empty new levels')}),
  'Пример: при максимуме 60 перенесёт прибавки с уровня 55 на пустые уровни 56–60. Заполненные вручную строки не затронет. Нужна отдельная кнопка сохранения.',
  'Example: at level 60 copies level-55 gains into empty levels 56–60. Manually edited rows are not changed. Saving is separate.');
 const quickHint=h('small',{class:'ps-level-editor-fill-hint'});
 const head=h('p',{class:'ps-level-editor-help',text:tr(
  '«+» — новые очки за конкретный уровень, «Всего» — накопленные очки к нему. Первый уровень по умолчанию даёт 0/0, но его тоже можно изменить.',
  '“+” is the gain at one level, while “Total” is the accumulated points through it. Level 1 defaults to 0/0 but is editable.')});
 top.append(maxLabel,h('div',{class:'ps-level-editor-fill-tools'},[quick,quickHint]));
 // Quick navigation stays read-only until the administrator changes a grant.
 const navigator=h('div',{class:'ps-level-editor-navigation'});
 const jumpInput=h('input',{type:'number',min:'1',max:String(draft.maxLevel),step:'1',
  placeholder:tr('Ур.','Lv.'),'aria-label':tr('Номер уровня для перехода','Level number to jump to')});
 const jumpButton=tip(h('button',{type:'button',class:'button-action',
  text:tr('Перейти','Go to level')}),
  'Прокручивает таблицу к указанному уровню, не изменяя его очки.',
  'Scrolls to the selected level without changing its grants.');
 const filterInput=h('input',{type:'checkbox',
  'aria-label':tr('Только изменённые уровни','Changed levels only')});
 const filterLabel=tip(h('label',{class:'ps-level-editor-filter'},[
  filterInput,h('span',{text:tr('Только изменённые','Changed only')})]),
  'Показывает строки с отличиями от сохранённой таблицы, включая новые уровни. Не сохраняет правки.',
  'Show rows different from the saved table, including newly added levels. No save.');
 const navStatus=h('small',{class:'ps-level-editor-nav-status',role:'status'});
 navigator.append(h('div',{class:'ps-level-editor-jump'},[jumpInput,jumpButton]),
  filterLabel,navStatus);
 const scroller=h('div',{class:'ps-level-editor-scroll'});
 const table=h('table',{class:'ps-level-editor-table'});
 const headings=[
  ['Ур.','Lv.','Уровень героя','Character level'],
  ['+ Характеристики','+ Attributes','Свободные очки характеристик, начисленные на этом уровне','Attribute points gained at this level'],
  ['Всего','Total','Всего очков характеристик, начисленных к этому уровню','Total attribute points earned so far'],
  ['+ Умения','+ Skills','Свободные очки умений, начисленные на этом уровне','Skill points gained at this level'],
  ['Всего','Total','Всего очков умений, начисленных к этому уровню','Total skill points earned so far']
 ];
 const thead=h('thead',{},[h('tr',{},headings.map(row=>
  h('th',{scope:'col',text:tr(row[0],row[1]),title:tr(row[2],row[3])})))]);

 const body=h('tbody');table.append(thead,body);scroller.append(table);
 const total=h('p',{class:'ps-level-editor-summary'});
 const changes=h('p',{class:'ps-level-editor-changes'});
 const status=h('p',{class:'ps-level-editor-state',role:'status'});
 const controls=h('div',{class:'ps-level-editor-actions'});
 const undo=tip(h('button',{type:'button',class:'button-action',
  text:tr('Отменить несохранённое','Discard unsaved edits')}),
  'Сбрасывает только черновик этого окна. Ранее сохранённая в D1 таблица не изменится.',
  'Discard changes in this window only. The table already saved in D1 stays unchanged.');
 const restore=tip(h('button',{type:'button',class:'button-action ps-level-editor-restore',
  text:tr('Вернуть исходную прокачку','Restore original progression')}),
  'После подтверждения удаляет личную таблицу из D1 и возвращает исходные начисления 1–55. Затронет расчёты всех билдов.',
  'After confirmation removes the custom D1 table and restores original 1–55 grants for all builds.');
 const save=tip(h('button',{type:'button',class:'button-action primary',
  text:tr('Сохранить в D1','Save to D1')}),
  'Публикует таблицу целиком после подтверждения. Все билды будут использовать новые значения начислений.',
  'Publish this entire table after confirmation. All builds will use the updated gains.');
 controls.append(undo,restore,save);
 wrap.append(intro,top,head,navigator,scroller,total,changes,status,controls);
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
    value:String(draft.attributes[level]),
    'aria-label':tr('Очки характеристик за уровень ','Attribute points gained at level ')+level});
   const sk=h('input',{type:'number',min:'0',max:String(model.MAX_GRANT),step:'1',
    value:String(draft.skills[level]),
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
  let a=0,b=0,count=0,changedRows=0;
  jumpInput.max=String(draft.maxLevel);
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
   const rowChanged=changedA||changedB;
   node.row.classList.toggle('ps-level-edited',rowChanged);
   if(rowChanged)changedRows++;
   // Do not hide an input while the owner is still editing it.
   node.row.hidden=filterInput.checked&&!rowChanged&&
    !(typeof document!=='undefined'&&node.row.contains(document.activeElement));
  }
  navStatus.textContent=filterInput.checked?
   (changedRows?tr('Показано уровней: ','Levels shown: ')+changedRows:
    tr('Изменённых уровней нет.','No changed levels.')):'';
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
  const added=Math.max(0,draft.maxLevel-before.maxLevel);
  const sourceLevel=Math.min(before.maxLevel,draft.maxLevel);
  const toFill=Array.from({length:added},(_,i)=>before.maxLevel+i+1)
   .filter(level=>draft.attributes[level]===0&&draft.skills[level]===0);
  const sourceA=draft.attributes[sourceLevel],sourceS=draft.skills[sourceLevel];
  quick.disabled=saving||!valid||!toFill.length||
   !Number.isInteger(sourceA)||!Number.isInteger(sourceS);
  quickHint.textContent=added===0?
   tr('Сначала увеличь максимальный уровень, например до 60.',
    'First raise the maximum level, for example to 60.'):
   toFill.length?
    tr('С уровня ','From level ')+sourceLevel+': +'+sourceA+
     tr(' характеристик / +',' attributes / +')+sourceS+
     tr(' умений → на ',' skills → levels ')+toFill[0]+
     (toFill.length>1?'–'+toFill.at(-1):'')+
     tr('. Только пустые строки, без сохранения.','. Blank rows only; no save.'):
    tr('Новые уровни уже заполнены. Ручные значения не заменяются.',
      'New levels are already filled. Manual entries are preserved.');
  quick.dataset.guideHint=quickHint.textContent+
   tr(' Нажми «Сохранить в D1» для применения.',
    ' Choose “Save to D1” to publish.');
  capInput.disabled=saving;
  jumpInput.disabled=saving; jumpButton.disabled=saving; filterInput.disabled=saving;
  for(const node of entries.values()){node.at.disabled=saving;
   node.sk.disabled=saving;}
 };
 const goToLevel=()=>{
  const raw=jumpInput.value.trim(),level=Number(raw);
  if(!/^\d{1,3}$/.test(raw)||!Number.isInteger(level)||level<1||level>draft.maxLevel){
   navStatus.textContent=tr('Укажи уровень от 1 до ','Choose a level from 1 to ')+draft.maxLevel+'.';
   jumpInput.focus();return;
  }
  // A requested level must always be reachable, even with the filter on.
  if(filterInput.checked){filterInput.checked=false;update()}
  const node=entries.get(level);if(!node)return;
  const header=table.tHead?.getBoundingClientRect().height||0;
  scroller.scrollTop+=node.row.getBoundingClientRect().top-
   scroller.getBoundingClientRect().top-header;
  node.at.focus({preventScroll:true});
  navStatus.textContent=tr('Уровень ','Level ')+level+tr(' открыт.',' selected.');
 };
 jumpButton.addEventListener('click',goToLevel);
 jumpInput.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();goToLevel()}
 });
 filterInput.addEventListener('change',update);
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
  if(n>before.maxLevel)scroller.scrollTop=scroller.scrollHeight;
 });
 quick.onclick=()=>{
  if(draft.maxLevel<=before.maxLevel)return;
  const lastKnown=Math.min(before.maxLevel,draft.maxLevel);
  const a=draft.attributes[lastKnown],b=draft.skills[lastKnown];
  if(!isInteger(a)||!isInteger(b))return;
  let filled=0;
  for(let i=before.maxLevel+1;i<=draft.maxLevel;i++){
   // Existing manual entries are authoritative. Never silently overwrite.
   if(draft.attributes[i]!==0||draft.skills[i]!==0)continue;
   draft.attributes[i]=a;draft.skills[i]=b;filled++;
   const node=entries.get(i);
   if(node){node.at.value=String(a);node.sk.value=String(b)}
  }
  update();
  status.textContent=tr('Пустых новых уровней заполнено: ','Empty new levels filled: ')+filled+
   tr('. Это черновик. Проверь прибавки, затем нажми «Сохранить в D1».',
    '. This is a draft. Verify the gains, then choose “Save to D1”.');
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
  finally{const message=status.textContent,failed=status.classList.contains('ps-level-editor-error');saving=false;update();status.textContent=message;status.classList.toggle('ps-level-editor-error',failed)}
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
  finally{const message=status.textContent,failed=status.classList.contains('ps-level-editor-error');saving=false;update();status.textContent=message;status.classList.toggle('ps-level-editor-error',failed)}
 };
 drawRows();return dialog;
}
root.PandoraProgressionOwnerEditor=Object.freeze({open});
})(typeof window==='undefined'?globalThis:window);
