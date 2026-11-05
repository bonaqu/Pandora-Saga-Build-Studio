(function(root){
'use strict';
// Bilingual, source-labelled Honor article. All data is textContent only, so
// editor-authored D1 prose cannot inject HTML or scripts.
// The 12 source-faithful 23x23 rank emblems are embedded as local SVG assets.
// No procedurally guessed shapes. Their pixels come from the published game
// files; the game's original silhouettes stay intact on any theme.
const honorIconSrc=id=>Number.isInteger(id)&&id>=0&&id<12?
 'assets/wiki/honor-ranks/'+id+'.svg':null;
let removeHonorScrollListener=()=>{};
function stopObserving(){
 removeHonorScrollListener();
 removeHonorScrollListener=()=>{};
}
function render({browse,detail,make,lang='ru',article,editable=false,
 editText=()=>{},saveText=()=>{},saveList=()=>{},link=()=>null,cloakLink=()=>null,
 warId=null,warLink=()=>null,backButton=()=>null,
 label=(group,id,ru,en)=>lang==='en'?en:ru,editLabel=()=>{},
 mapOptions=[],onOpenLocations=()=>{}}={}){
 if(!browse||!detail||!article||typeof make!=='function')return;
 // Re-rendering after admin edits must never accumulate scroll observers.
 stopObserving();
 const en=lang==='en',tr=(ru,english)=>en?english:ru,
  fmt=new Intl.NumberFormat(en?'en-US':'ru-RU');
 const oldBrowseScroll=browse.scrollTop,oldDetailScroll=detail.scrollTop;
 const oldSection=detail.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection||
  browse.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection||'overview';
 const oldFilter=detail.querySelector('.wiki-honor-filter.chosen')?.dataset.honorFilter||'all';
 browse.replaceChildren();detail.replaceChildren();
 const node=(tag,cls,text)=>make(tag,{class:cls,text});
 // Wars are Honor records, not OS map IDs. Give every existing and
 // owner-created entry its own page without inventing location records.
 if(warId!=null){
  const entry=article.battles.find(war=>war.id===warId);
  browse.append(node('p','muted',tr('PvP-войны','PvP wars')));
  browse.append(node('h4','wiki-location-list-heading',
   label('chapter','honor','Честь','Honor')));
  for(const war of article.battles){
   const name=en?war.nameEn:war.nameRu;
   const anchor=warLink(war.id,name);
   if(anchor){
    anchor.classList.add('wiki-honor-war-link');
    if(war.id===warId){
     anchor.classList.add('selected');anchor.setAttribute('aria-current','page');
    }
    browse.append(anchor);
   }else browse.append(node('p','wiki-honor-copy',name));
  }
  // Honor wars follow the same browser history contract as maps and items.
  const back=backButton();
  if(back)detail.append(back);
  if(entry){
   detail.append(node('p','wiki-honor-war-eyebrow',tr('PvP-война','PvP war')));
   const name=en?entry.nameEn:entry.nameRu;
   const title=node('h3','wiki-honor-title wiki-honor-war-title',name);
   if(editable){
    title.classList.add('wiki-honor-editable');title.tabIndex=0;
    const edit=()=>editText(title,name,false,next=>saveList('honor.wars',
     article.battles.map(war=>war.id===entry.id?{
      ...war,[en?'nameEn':'nameRu']:next}:war)));
    title.addEventListener('dblclick',edit);
    title.addEventListener('keydown',event=>{
     if(event.key==='F2'){event.preventDefault();edit()}
    });
   }
   detail.append(title);
   // Use existing Honor information instead of inventing war-specific rules.
   detail.append(node('p','wiki-honor-copy wiki-honor-war-copy',
    en?article.overview.gainEn:article.overview.gainRu));
  }else detail.append(node('h3','wiki-honor-title',tr(
   'Война не найдена','War not found')));
  browse.scrollTop=0;detail.scrollTop=0;
  return;
 }
 const section=(id,ru,english)=>{
  const element=make('section',{class:'wiki-honor-section',id:'honor-'+id});
  const name=label('honor',id,ru,english);
  const heading=node('h4','wiki-honor-heading',name);
  if(editable){
   heading.classList.add('wiki-honor-editable');heading.tabIndex=0;
   heading.title=tr('Двойной клик — изменить заголовок','Double-click to edit heading');
   const change=()=>editLabel(heading,'honor',id,name);
   heading.addEventListener('dblclick',change);
   heading.addEventListener('keydown',event=>{
    if(event.key==='F2'){event.preventDefault();change()}
   });
  }
  element.append(heading);detail.append(element);
  return element;
 };
 const editableText=(target,value,key,field,multiline=false)=>{
  if(!editable)return target;
  target.classList.add('wiki-honor-editable');
  target.setAttribute('tabindex','0');
  target.setAttribute('title',tr('Двойной клик — изменить','Double-click to edit'));
  const start=()=>editText(target,value,multiline,
   next=>saveText(key,{[field]:next}));
  target.addEventListener('dblclick',start);
  target.addEventListener('keydown',event=>{
   if(event.key==='Enter'&&!multiline){event.preventDefault();start()}
  });
  return target;
 };
 const editableListText=(target,value,key,items,index,field)=>{
  if(!editable)return target;
  target.classList.add('wiki-honor-editable');target.setAttribute('tabindex','0');
  const start=()=>editText(target,value,false,next=>saveList(key,
   items.map((entry,i)=>i===index?{...entry,[field]:next}:entry)));
  target.addEventListener('dblclick',start);
  target.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();start()}
  });
  return target;
 };
 const paragraph=(sectionNode,value,key,field)=>
  sectionNode.append(editableText(node('p','wiki-honor-copy',value),
   value,key,field,true));
 // Same left-side row system as every other encyclopedia chapter.
 const sidebar=[
  ['overview','Система чести','Honor system','◈'],
  ['gain','Получение и потеря','Earning and losing','⚔'],
  ['ranks','Ранги и привилегии','Ranks and privileges','♜'],
  ['monthly','Ежемесячные звания','Monthly titles','✦']
 ];
 browse.append(node('p','muted',tr('Разделы · 4','Sections · 4')));
 browse.append(node('h4','wiki-location-list-heading',
  label('chapter','honor','Честь','Honor')));
 const nav=[];
 const selectSection=id=>{
  for(const jump of nav){
   const active=jump.dataset.honorSection===id;
   jump.classList.toggle('selected',active);
   if(active)jump.setAttribute('aria-current','location');
   else jump.removeAttribute('aria-current');
  }
 };
 for(const [id,ru,english,glyph]of sidebar){
  const jump=make('button',{type:'button',class:'wiki-link wiki-honor-nav-link',
   'data-honor-section':id,'aria-current':id===oldSection?'location':null});
  jump.append(node('span','wiki-honor-nav-icon',glyph),
   node('span','',label('honor',id,ru,english)));
  jump.addEventListener('click',()=>{
   selectSection(id);
   const selected=detail.querySelector('#honor-'+id);
   const pane=detail.closest('#detailContent')||detail;
   if(selected&&pane){
    const delta=selected.getBoundingClientRect().top-
     pane.getBoundingClientRect().top;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    pane.scrollTo({top:pane.scrollTop+delta-12,
     behavior:reduced?'instant':'smooth'});
   }
  });
  if(id===oldSection)jump.classList.add('selected');
  nav.push(jump);browse.append(jump);
 }
 const honorTitle=label('chapter','honor','Честь','Honor');
 const title=node('h3','wiki-honor-title',honorTitle);
 if(editable){
  title.classList.add('wiki-honor-editable');title.tabIndex=0;
  title.title=tr('Двойной клик — изменить название','Double-click to edit title');
  const change=()=>editLabel(title,'chapter','honor',honorTitle);
  title.addEventListener('dblclick',change);
  title.addEventListener('keydown',event=>{
   if(event.key==='F2'){event.preventDefault();change()}
  });
 }
 detail.append(title,node('p','wiki-honor-subtitle',tr(
  'PvP · нации · звания · награды','PvP · nations · titles · rewards')));
 const overview=section('overview','Система чести','Honor system');
 const o=article.overview;
 paragraph(overview,en?o.overviewEn:o.overviewRu,'honor.overview',
  en?'overviewEn':'overviewRu');
 const gain=section('gain','Получение и потеря чести','Earning and losing Honor');
 paragraph(gain,en?o.gainEn:o.gainRu,'honor.overview',en?'gainEn':'gainRu');
 function listField(items,kind,captionRu,captionEn){
  const isZone=kind==='zones',key='honor.'+kind;
  const wrapper=make('section',{class:'wiki-honor-list-section'});
  wrapper.append(node('h5','',tr(captionRu,captionEn)));
  const content=make('div',{class:'wiki-honor-list'});
  for(const [index,item]of items.entries()){
   const row=make('div',{class:'wiki-honor-list-row'});
   const names=make('div',{class:'wiki-honor-list-names'});
   // Show only the selected language. The opposite locale is edited after
   // switching RU/EN in the global header, never concatenated on a row.
   const field=en?'nameEn':'nameRu';
   const linked=isZone?mapOptions.find(option=>option.id===item.mapId):null;
   const value=(linked?(en?linked.nameEn:linked.nameRu):item[field])||'';
   const name=node('span','',value);
   if(isZone){
    // Reuse the existing Wiki map link and history; editing the canonical
    // location name still belongs to the Locations chapter, not here.
    const anchor=item.mapId&&linked?link(item.mapId,value):null;
    if(anchor){
     anchor.classList.add('wiki-honor-location-link');
     names.append(anchor);
    }else{
     if(editable)name.setAttribute('title',tr(
      'Название изменяется в разделе «Локации»',
      'Edit the name in Locations'));
     names.append(name);
    }
   }else{
    const anchor=warLink(item.id,value);
    if(anchor){
     anchor.classList.add('wiki-honor-war-link');
     names.append(anchor);
    }else names.append(editableListText(name,value,key,items,index,field));
    if(editable&&anchor){
     // Clicking a war name navigates; editing remains a separate owner action.
     const edit=make('button',{type:'button',class:'wiki-honor-war-rename',
      text:'✎','aria-label':tr('Изменить название войны','Edit war name')+': '+value,
      onclick:()=>editText(edit,value,false,next=>saveList(key,
       items.map((row,i)=>i===index?{...row,[field]:next}:row)))});
     names.append(edit);
    }
   }
   row.append(names);
   if(editable){
    if(isZone){
     const select=make('select',{class:'wiki-honor-location-select',
      'aria-label':tr('Заменить локацию','Replace location'),
      onchange:event=>{
       const id=event.target.value||null;
       const chosen=mapOptions.find(option=>option.id===id);
       if(!chosen||items.some((row,i)=>i!==index&&row.mapId===id)){
        event.target.value=item.mapId||'';
        showError(row,new Error(tr('Выбери другую существующую локацию',
         'Choose another existing location')));return;
       }
       const updated=items.map((entry,n)=>n===index?{
        ...entry,mapId:id,
        ...(chosen?{nameRu:chosen.nameRu,nameEn:chosen.nameEn}:{})
       }:entry);
       void Promise.resolve(saveList(key,updated)).catch(error=>showError(row,error));
      }});
     select.append(make('option',{value:'',text:tr('Без привязки','Unlinked')}));
     for(const candidate of mapOptions){
      const opt=make('option',{value:candidate.id,
       text:en?candidate.nameEn:candidate.nameRu});
      if(candidate.id===item.mapId)opt.selected=true;
      else if(items.some((row,i)=>i!==index&&row.mapId===candidate.id))
       opt.disabled=true;
      select.append(opt);
     }
     row.append(select);
    }
    row.append(make('button',{type:'button',class:'wiki-owner-remove',
     text:'×','aria-label':tr('Удалить','Remove')+' '+item.nameRu,
     onclick:()=>void Promise.resolve(saveList(key,items.filter((_,i)=>i!==index)))
      .catch(error=>showError(row,error))}));
   }
   content.append(row);
  }
  wrapper.append(content);
  if(editable){
   const add=make('button',{type:'button',class:'wiki-owner-plus wiki-honor-add',
    text:isZone?tr('+ Связать локацию','+ Link location'):
     tr('+ Добавить войну','+ Add war'),
    onclick:()=>{
     if(wrapper.querySelector('.wiki-honor-new'))return;
     const form=make('div',{class:'wiki-honor-new'});
     const note=node('small','wiki-honor-error','');
     const cancel=make('button',{type:'button',class:'wiki-owner-remove',
      text:tr('Отмена','Cancel'),onclick:()=>form.remove()});
     if(isZone){
      const search=make('input',{type:'search',
       'aria-label':tr('Поиск существующей локации','Search existing locations'),
       placeholder:tr('Найти локацию…','Find a location…'),autocomplete:'off'});
      const select=make('select',{class:'wiki-honor-location-select',
       'aria-label':tr('Выбери существующую локацию','Choose an existing location')});
      const fill=()=>{
       const q=search.value.trim().toLocaleLowerCase();
       const found=mapOptions.filter(option=>
        !items.some(item=>item.mapId===option.id)&&
        (!q||[option.nameRu,option.nameEn].some(name=>
         name.toLocaleLowerCase().includes(q)))).slice(0,100);
       select.replaceChildren(make('option',{value:'',text:found.length?
        tr('Выбери локацию','Choose location'):
        tr('Локации не найдены','No locations found')}));
       for(const entry of found)select.append(make('option',{
        value:entry.id,text:en?entry.nameEn:entry.nameRu}));
       select.disabled=!found.length;
      };
      const submit=make('button',{type:'button',class:'wiki-owner-plus',
       text:tr('Добавить','Add'),onclick:async()=>{
        const selected=mapOptions.find(entry=>entry.id===select.value);
        if(!selected){note.textContent=tr('Выбери локацию','Choose a location');return}
        let id='custom-1',n=1;
        while(items.some(item=>item.id===id))id='custom-'+(++n);
        try{await saveList(key,[...items,{id,mapId:selected.id,
         nameRu:selected.nameRu,nameEn:selected.nameEn}])}
        catch(error){note.textContent=error?.message||String(error)}
       }});
      const create=make('button',{type:'button',class:'wiki-honor-create-location',
       text:tr('Нет в списке? Создать в «Локациях»',
        'Not listed? Create it in Locations'),
       onclick:()=>onOpenLocations()});
      form.append(search,select,submit,cancel,create,note);
      search.addEventListener('input',fill);fill();search.focus();
     }else{
      const ru=make('input',{type:'text',maxLength:140,
       placeholder:'Русское название','aria-label':'Русское название'});
      const english=make('input',{type:'text',maxLength:140,
       placeholder:'English name','aria-label':'English name'});
      const submit=make('button',{type:'button',class:'wiki-owner-plus',
       text:tr('Добавить','Add'),onclick:async()=>{
        const nameRu=ru.value.trim(),nameEn=english.value.trim();
        if(!nameRu||!nameEn){note.textContent=tr('Заполни RU и EN','Enter RU and EN');return}
        let id='custom-1',n=1;
        while(items.some(item=>item.id===id))id='custom-'+(++n);
        try{await saveList(key,[...items,{id,nameRu,nameEn}])}
        catch(error){note.textContent=error?.message||String(error)}
       }});
      form.append(ru,english,submit,cancel,note);ru.focus();
     }
     wrapper.append(form);
    }});
   // Keep Add immediately beside the final row's remove action.
   const destination=content.lastElementChild||content;
   destination.append(add);
  }
  return wrapper;
 }
 function showError(row,error){
  const label=node('small','wiki-honor-error',error?.message||String(error));
  row.append(label);
 }
 gain.append(listField(article.zones,'zones','PvP-локации','PvP locations'));
 gain.append(listField(article.battles,'wars','PvP-войны','PvP wars'));
 paragraph(gain,en?o.lossEn:o.lossRu,'honor.overview',en?'lossEn':'lossRu');
 const ranks=section('ranks','Ранги и привилегии','Honor ranks and privileges');
 paragraph(ranks,en?o.ranksEn:o.ranksRu,'honor.overview',
  en?'ranksEn':'ranksRu');
 const rankFilters=make('div',{class:'wiki-honor-rank-filters',role:'group',
  'aria-label':tr('Фильтр рангов','Rank filter')});
 const rankGrid=make('div',{class:'wiki-honor-rank-list'});
 const filters=[
  ['all',tr('Все · 12','All · 12')],
  ['standard',tr('Обычные · 9','Standard · 9')],
  ['monthly',tr('Месячные · 3','Monthly · 3')]
 ];
 for(const [key,label]of filters){
  const button=make('button',{type:'button',class:'wiki-honor-filter'+(key===oldFilter?' chosen':''),
   text:label,'data-honor-filter':key,
   'aria-pressed':String(key===oldFilter),onclick:()=>{
    for(const choice of rankFilters.querySelectorAll('button')){
     const active=choice===button;
     choice.classList.toggle('chosen',active);choice.setAttribute('aria-pressed',String(active));
    }
    for(const card of rankGrid.children)
     card.hidden=key==='standard'?card.dataset.rankType!=='standard':
      key==='monthly'?card.dataset.rankType!=='monthly':false;
   }});
  rankFilters.append(button);
 }
 ranks.append(rankFilters);
 for(const rank of article.ranks){
  const card=make('div',{class:'wiki-honor-rank'+
   (rank.top!=null?' is-monthly':'')});
  card.dataset.rankType=rank.top!=null?'monthly':'standard';
  card.id='honor-rank-'+rank.id;
  const header=make('div',{class:'wiki-honor-rank-head'});
  const marker=make('span',{class:'wiki-honor-rank-number wiki-honor-emblem',
   role:'img','aria-label':tr('Эмблема ранга ','Rank emblem: ')+(en?rank.nameEn:rank.nameRu)});
  const src=honorIconSrc(rank.id);
  if(src)marker.append(make('img',{
   class:'wiki-honor-emblem-source',src,alt:'','aria-hidden':'true',
   width:'27',height:'27',decoding:'async'}));
  header.append(marker);
  const rankTitle=make('div',{class:'wiki-honor-rank-name'});
  const name=en?rank.nameEn:rank.nameRu;
  rankTitle.append(editableText(node('strong','',name),name,
   'honor.rank.'+rank.id,en?'nameEn':'nameRu'));
  // Display only the active locale, including in owner edit mode.
  header.append(rankTitle);card.append(header);
  const defaultRequirement=rank.top!=null?
   tr('Для получения ранга необходимо находиться в топ-'+rank.top+
    ' нации за предыдущий месяц.',
    'To earn this rank, finish in your nation’s top '+rank.top+
    ' for the previous month.'):
   rank.points!=null?
    tr('Для получения ранга необходимо ','To obtain this rank, you need ')+
    fmt.format(rank.points)+
    tr(' оч. ресурса «Вся честь» · ',' Total Honor points · ')+
    fmt.format(rank.gold)+tr(' золота.',' gold.'):
   rank.id===0?
    tr('Ранг можно получить при вступлении в любую из существующих наций в игре.',
     'This rank can be earned by joining any of the nations in the game.'):
    tr('Для получения ранга необходимо ','To obtain this rank, you need ')+
     fmt.format(rank.gold)+tr(' золота.',' gold.');
  const required=en?rank.requirementEn||defaultRequirement:
   rank.requirementRu||defaultRequirement;
  card.append(editableText(node('p','wiki-honor-requirement',required),
   required,'honor.rank.'+rank.id,
   en?'requirementEn':'requirementRu',true));
  const bonus=en?rank.benefitEn:rank.benefitRu;
  card.append(editableText(node('p','wiki-honor-rank-benefit',bonus),
   bonus,'honor.rank.'+rank.id,en?'benefitEn':'benefitRu',true));
  card.hidden=oldFilter==='standard'?card.dataset.rankType!=='standard':
   oldFilter==='monthly'?card.dataset.rankType!=='monthly':false;
  rankGrid.append(card);
 }
 ranks.append(rankGrid);
 const monthly=section('monthly','Ежемесячные звания','Monthly titles');
 const rawCloaks=en?o.cloaksEn:o.cloaksRu,field=en?'cloaksEn':'cloaksRu';
 // The three author-editable cloak groups are kept in the same validated
 // D1 text field. Existing saved text without blank lines is supported.
 const monthlyRows=rawCloaks.split(/\n\s*\n|\n(?=Топ-|Top )/).filter(Boolean);
 const monthlyGrid=make('div',{class:'wiki-honor-monthly-list'});
 const titles=article.ranks.filter(rank=>rank.top!=null);
 for(const [index,rank] of titles.entries()){
  const row=make('article',{class:'wiki-honor-monthly-card'});
  const name=en?rank.nameEn:rank.nameRu;
  const head=make('div',{class:'wiki-honor-monthly-head'});
  head.append(editableText(node('strong','',name),name,
   'honor.rank.'+rank.id,en?'nameEn':'nameRu'),
   node('small','',tr('Награды','Rewards')));
  row.append(head);
  const entry=monthlyRows[index]||'';
  const content=node('p','wiki-honor-copy wiki-honor-cloak-list','');
  const ruRows=String(o.cloaksRu||'').split(/\n\s*\n|\n(?=Топ-|Top )/);
  const parseLine=line=>/^(.*?[—–]\s*)(.+?)([;,.]?\s*)$/.exec(line);
  for(const [lineIndex,line]of entry.split('\n').entries()){
   if(lineIndex)content.append(document.createTextNode('\n'));
   const parts=parseLine(line);
   if(!parts){content.append(document.createTextNode(line));continue}
   const canonical=parseLine(ruRows[index]?.split('\n')[lineIndex]||'')?.[2]||null;
   const anchor=cloakLink(parts[2],canonical);
   if(anchor)anchor.addEventListener('dblclick',event=>event.stopPropagation());
   content.append(document.createTextNode(parts[1]),anchor||
    document.createTextNode(parts[2]),document.createTextNode(parts[3]));
  }
  if(editable){
   // One editable nation group; merge with two unchanged groups on save.
   const startEdit=()=>editText(content,entry,true,next=>{
    const nextRows=[...monthlyRows];nextRows[index]=next;
    return saveText('honor.overview',{[field]:nextRows.join('\n\n')});
   });
   content.classList.add('wiki-honor-editable');
   content.setAttribute('tabindex','0');
   content.setAttribute('title',tr('Двойной клик — изменить','Double-click to edit'));
   content.addEventListener('dblclick',event=>{
    if(event.target.closest?.('a'))return;
    startEdit();
   });
   content.addEventListener('keydown',event=>{
    if(event.key==='F2'){event.preventDefault();startEdit()}
   });
  }
  row.append(content);
  monthlyGrid.append(row);
 }
 monthly.append(monthlyGrid);
 const note=en?o.monthlyNoteEn:o.monthlyNoteRu;
 monthly.append(editableText(node('p','wiki-honor-note',note),
  note,'honor.overview',en?'monthlyNoteEn':'monthlyNoteRu',true));
 browse.scrollTop=oldBrowseScroll;detail.scrollTop=oldDetailScroll;
 // #detailContent is the real scroll plane, not the browser document.
 // Use the last section crossing the reading line for wheel/keyboard/drag.
 const scroller=detail.closest('#detailContent')||detail;
 let frame=0;
 const syncSection=()=>{
  frame=0;
  if(!detail.isConnected)return;
  // Keep the established top reading line for normal sections. The final
  // section needs a separate rule because the scroll stops at the page end
  // before the last heading can rise to that line.
  const paneTop=scroller.getBoundingClientRect().top;
  const readingLine=paneTop+Math.min(100,scroller.clientHeight*.22);
  let current=sidebar[0][0];
  for(const [id]of sidebar){
   if(detail.querySelector('#honor-'+id)?.getBoundingClientRect().top<=readingLine)
    current=id;
  }
  const remaining=scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop;
  const monthlyTop=detail.querySelector('#honor-monthly')?.getBoundingClientRect().top;
  const monthlyVisible=Number.isFinite(monthlyTop)&&
   monthlyTop<=paneTop+Math.min(280,scroller.clientHeight*.43);
  if(scroller.scrollTop<=3)current='overview';
  else if(remaining<=36||monthlyVisible)current='monthly';
  selectSection(current);
 };
 const onScroll=()=>{
  if(!frame)frame=root.requestAnimationFrame(syncSection);
 };
 scroller.addEventListener('scroll',onScroll,{passive:true});
 removeHonorScrollListener=()=>{
  scroller.removeEventListener('scroll',onScroll);
  if(frame)root.cancelAnimationFrame(frame);
 };
 syncSection();
}
root.PandoraHonorView=Object.freeze({render,stopObserving});
})(typeof window==='undefined'?globalThis:window);
