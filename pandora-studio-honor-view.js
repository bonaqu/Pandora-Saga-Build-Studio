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
  copy=(key,ru,en)=>lang==='en'?en:ru,editCopy=()=>{},
 mapOptions=[],onOpenLocations=()=>{},searchQuery=''}={}){
 if(!browse||!detail||!article||typeof make!=='function')return;
 // Re-rendering after admin edits must never accumulate scroll observers.
 stopObserving();
 const en=lang==='en',tr=(ru,english)=>en?english:ru,
  fmt=new Intl.NumberFormat(en?'en-US':'ru-RU');
 // Search the actual RU/EN authored Honor content, not an OS 'honor'
 // catalog category. Use the same Unicode/ё normalization as Wiki.
 const terms=String(searchQuery||'').normalize('NFKC').toLocaleLowerCase()
  .replace(/ё/g,'е').trim().split(/\s+/u).filter(Boolean);
 const matches=node=>{
  const text=String(typeof node==='string'?node:node?.textContent||'')
   .normalize('NFKC').toLocaleLowerCase().replace(/ё/g,'е');
  return terms.every(term=>text.includes(term));
 };
 const oldBrowseScroll=browse.scrollTop,oldDetailScroll=detail.scrollTop;
 const oldSection=detail.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection||
  browse.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection||'overview';
 const oldFilter=detail.querySelector('.wiki-honor-filter.chosen')?.dataset.honorFilter||'all';
 browse.replaceChildren();detail.replaceChildren();
 const node=(tag,cls,text)=>make(tag,{class:cls,text});
  // Honor's interface captions are authored UI, not game data or rank rules.
  // Only the owner sees an inline editor with a neighboring touch-friendly pencil.
  const editorial=(tag,cls,key,ru,english)=>{
   const value=copy(key,ru,english);
   const element=node(tag,cls,value);
   if(!editable)return element;
   const target=node('span','wiki-honor-copy-owner-label',value);
   const pencil=make('button',{type:'button',class:'wiki-honor-copy-pencil',
    text:'✎','aria-label':tr('Изменить подпись: ','Edit caption: ')+value});
   element.replaceChildren(target,pencil);
   pencil.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    // This follows the exact editor, blur-save, Escape, CAS and Undo path as F2.
    target.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   });
   editCopy(target,key,ru,english,{
    onCommitted:next=>pencil.setAttribute('aria-label',
     tr('Изменить подпись: ','Edit caption: ')+next)
   });
   return element;
  };
 // One independent owner control for native headings and rich Honor text.
 // It is never nested in navigation buttons, links or disclosure controls.
 const directPencil=(action,caption)=>{
  const pencil=make('button',{type:'button',
   class:'wiki-honor-copy-pencil wiki-honor-direct-pencil',
   text:'✎','aria-label':tr('Изменить: ','Edit: ')+caption});
  pencil.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();action();
  });
  return pencil;
 };
 // Wars are Honor records, not OS map IDs. Give every existing and
 // owner-created entry its own page without inventing location records.
 if(warId!=null){
  const entry=article.battles.find(war=>war.id===warId);
  browse.append(editorial('p','muted','warsHeading','PvP-войны','PvP wars'));
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
   detail.append(editorial('p','wiki-honor-war-eyebrow','warEyebrow','PvP-война','PvP war'));
   const name=en?entry.nameEn:entry.nameRu;
   const title=node('h3','wiki-honor-title wiki-honor-war-title',name);
   const titleRow=make('div',{class:'wiki-honor-heading-row wiki-honor-title-row'});
   titleRow.append(title);
   if(editable){
    title.classList.add('wiki-honor-editable');title.tabIndex=0;
    const edit=()=>editText(title,name,false,next=>saveList('honor.wars',
     article.battles.map(war=>war.id===entry.id?{
      ...war,[en?'nameEn':'nameRu']:next}:war)));
    title.addEventListener('dblclick',edit);
    title.addEventListener('keydown',event=>{
     if(event.key==='F2'){event.preventDefault();edit()}
    });
    titleRow.append(directPencil(edit,name));
   }
   detail.append(titleRow);
   // Use existing Honor information instead of inventing war-specific rules.
   detail.append(node('p','wiki-honor-copy wiki-honor-war-copy',
    en?article.overview.gainEn:article.overview.gainRu));
  }else detail.append(editorial('h3','wiki-honor-title','warNotFound',
   'Война не найдена','War not found'));
  if(terms.length){
   let visible=0;
   for(const entry of browse.querySelectorAll('.wiki-honor-war-link')){
    entry.hidden=!matches(entry);
    if(!entry.hidden)visible++;
   }
   if(!visible)browse.append(editorial('p','wiki-honor-search-empty',
    'searchEmpty','По запросу ничего не найдено.','No Honor matches found.'));
  }
  // Mark the applied query only after all rows have been filtered.
  // Also allows accessibility tests to wait for the debounced render.
  detail.dataset.honorSearchQuery=String(searchQuery||'');
  browse.scrollTop=0;detail.scrollTop=0;
  return;
 }
 const section=(id,ru,english)=>{
  const element=make('section',{class:'wiki-honor-section',id:'honor-'+id});
  const name=label('honor',id,ru,english);
  const heading=node('h4','wiki-honor-heading',name);
  const headingRow=make('div',{class:'wiki-honor-heading-row'});
  headingRow.append(heading);
  if(editable){
   heading.classList.add('wiki-honor-editable');heading.tabIndex=0;
   heading.title=tr('Двойной клик — изменить заголовок','Double-click to edit heading');
   const change=()=>editLabel(heading,'honor',id,name);
   heading.addEventListener('dblclick',change);
   heading.addEventListener('keydown',event=>{
    if(event.key==='F2'||event.key==='Enter'){event.preventDefault();change()}
   });
   headingRow.append(directPencil(change,name));
  }
  element.append(headingRow);detail.append(element);
  return element;
 };
 const editableText=(target,value,key,field,multiline=false)=>{
  if(!editable)return target;
  target.classList.add('wiki-honor-editable');
  target.setAttribute('tabindex','0');
  target.setAttribute('title',tr('Двойной клик или F2 — изменить','Double-click or F2 to edit'));
  const start=()=>editText(target,value,multiline,
   next=>saveText(key,{[field]:next}));
  target.addEventListener('dblclick',start);
  target.addEventListener('keydown',event=>{
   if(event.key==='F2'||(event.key==='Enter'&&!multiline)){
    event.preventDefault();start();
   }
  });
  // Only owner mode adds a touch action; player-facing rank cards keep
  // their original markup and their source-verified game values.
  const kind=target.tagName==='STRONG'?
   tr('название','name'):tr('описание','description');
  const isRequirement=target.classList.contains('wiki-honor-requirement');
  const isBenefit=target.classList.contains('wiki-honor-rank-benefit');
  const wrap=make('div',{class:'wiki-honor-field-edit-row'+
   (isRequirement?' is-rank-requirement':isBenefit?' is-rank-benefit':'')});
  wrap.append(target,directPencil(start,kind));
  return wrap;
 };
 const editableListText=(target,value,key,items,index,field)=>{
  if(!editable)return target;
  target.classList.add('wiki-honor-editable');target.setAttribute('tabindex','0');
  const start=()=>editText(target,value,false,next=>saveList(key,
   items.map((entry,i)=>i===index?{...entry,[field]:next}:entry)));
  target.addEventListener('dblclick',start);
  target.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key==='F2'){event.preventDefault();start()}
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
 const titleRow=make('div',{class:'wiki-honor-heading-row wiki-honor-title-row'});
 titleRow.append(title);
 if(editable){
  title.classList.add('wiki-honor-editable');title.tabIndex=0;
  title.title=tr('Двойной клик — изменить название','Double-click to edit title');
  const change=()=>editLabel(title,'chapter','honor',honorTitle);
  title.addEventListener('dblclick',change);
  title.addEventListener('keydown',event=>{
   if(event.key==='F2'||event.key==='Enter'){event.preventDefault();change()}
  });
  titleRow.append(directPencil(change,honorTitle));
 }
 detail.append(titleRow,editorial('p','wiki-honor-subtitle','subtitle',
  'PvP · нации · звания · награды','PvP · nations · titles · rewards'));
 const overview=section('overview','Система чести','Honor system');
 const o=article.overview;
 paragraph(overview,en?o.overviewEn:o.overviewRu,'honor.overview',
  en?'overviewEn':'overviewRu');
 const gain=section('gain','Получение и потеря чести','Earning and losing Honor');
 paragraph(gain,en?o.gainEn:o.gainRu,'honor.overview',en?'gainEn':'gainRu');
 function listField(items,kind,captionRu,captionEn){
  const isZone=kind==='zones',key='honor.'+kind;
  const wrapper=make('section',{class:'wiki-honor-list-section'});
  wrapper.append(editorial('h5','',isZone?'zonesHeading':'warsHeading',captionRu,captionEn));
  // Reuse the same compact relation chips as monster spawn locations and
  // NPC/map links. The owner controls stay adjacent to the proper record.
  const content=make('div',{class:'wiki-honor-list wiki-entity-flow'});
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
     anchor.classList.add('wiki-honor-location-link','wiki-entity-reference');
     anchor.prepend(make('span',{class:'wiki-entity-reference-icon',
      'aria-hidden':'true',text:'◈'}));
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
     anchor.classList.add('wiki-honor-war-link','wiki-entity-reference');
     anchor.prepend(make('span',{class:'wiki-entity-reference-icon',
      'aria-hidden':'true',text:'⚔'}));
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
     text:'×','aria-label':tr('Удалить','Remove')+' '+(value||item.nameRu),
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
       placeholder:tr('Найти локацию…','Find a location…'),
       autocomplete:'none','aria-autocomplete':'none',
       'data-lpignore':'true','data-1p-ignore':'true',
       'data-bwignore':'true','data-form-type':'other'});
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
       placeholder:tr('Название на русском','Russian name'),
       'aria-label':tr('Название на русском','Russian name')});
      const english=make('input',{type:'text',maxLength:140,
       placeholder:tr('Название на английском','English name'),
       'aria-label':tr('Название на английском','English name')});
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
 // Counts come from actual rank records; only captions are authored D1 copy.
 const filters=[
  ['all','filterAll','Все','All',article.ranks.length],
  ['standard','filterStandard','Обычные','Standard',
   article.ranks.filter(rank=>rank.top==null).length],
  ['monthly','filterMonthly','Месячные','Monthly',
   article.ranks.filter(rank=>rank.top!=null).length]
 ];
 for(const [key,copyKey,ru,english,count]of filters){
  const label=copy(copyKey,ru,english);
  const wrap=make('span',{class:'wiki-honor-filter-wrap'});
  const button=make('button',{type:'button',
   class:'wiki-honor-filter'+(key===oldFilter?' chosen':''),
   'data-honor-filter':key,
   'aria-pressed':String(key===oldFilter),onclick:()=>{
    // Editing pencils are buttons too, but never a filter action.
    for(const choice of rankFilters.querySelectorAll('button[data-honor-filter]')){
     const active=choice===button;
     choice.classList.toggle('chosen',active);choice.setAttribute('aria-pressed',String(active));
    }
    for(const card of rankGrid.children)
     card.hidden=(key==='standard'?card.dataset.rankType!=='standard':
      key==='monthly'?card.dataset.rankType!=='monthly':false)||
      (terms.length>0&&card.dataset.honorSearchMatch==='false');
   }});
  const caption=node('span','wiki-honor-filter-caption',label);
  button.append(caption,node('span','wiki-honor-filter-count',' · '+count));
  wrap.append(button);
  if(editable){
   // Do not nest a pencil inside a filter button. Triggering an editor
   // must never change active filter or the rank cards' visibility.
   const pencil=make('button',{type:'button',
    class:'wiki-honor-copy-pencil wiki-honor-filter-pencil',text:'✎',
    'aria-label':tr('Изменить подпись: ','Edit caption: ')+label});
   const host=make('span',{class:'wiki-honor-filter-edit-host',hidden:true,text:label});
   const restore=()=>{button.hidden=false;pencil.hidden=false;host.hidden=true};
   editCopy(host,copyKey,ru,english,{
    onCommitted:visible=>{
     caption.textContent=visible;
     pencil.setAttribute('aria-label',tr('Изменить подпись: ','Edit caption: ')+visible);
    },
    onFinished:restore
   });
   pencil.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    button.hidden=true;pencil.hidden=true;host.hidden=false;
    host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   });
   wrap.append(pencil,host);
  }
  rankFilters.append(wrap);
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
   editorial('small','','rewardsHeading','Награды','Rewards'));
  row.append(head);
  const entry=monthlyRows[index]||'';
  const content=node('p','wiki-honor-copy wiki-honor-cloak-list','');
  const contentRow=make('div',{class:'wiki-honor-cloak-edit-row'});
  contentRow.append(content);
  const ruRows=String(o.cloaksRu||'').split(/\n\s*\n|\n(?=Топ-|Top )/);
  const parseLine=line=>/^(.*?[—–]\s*)(.+?)([;,.]?\s*)$/.exec(line);
  for(const [lineIndex,line]of entry.split('\n').entries()){
   const parts=parseLine(line);
   const reward=make('span',{class:'wiki-honor-cloak-row'});
   if(!parts){
    reward.append(node('span','wiki-honor-cloak-unlinked',line));
    content.append(reward);
    continue;
   }
   // Nation and reward become two scannable columns. Preserve the editable
   // original text verbatim in D1; this is presentation only.
   reward.append(node('span','wiki-honor-cloak-nation',
    parts[1].replace(/[—–]\s*$/,'').trim()));
   const canonical=parseLine(ruRows[index]?.split('\n')[lineIndex]||'')?.[2]||null;
   const anchor=cloakLink(parts[2],canonical);
   if(anchor)anchor.addEventListener('dblclick',event=>event.stopPropagation());
   const value=make('span',{class:'wiki-honor-cloak-reward'});
   value.append(anchor||document.createTextNode(parts[2]));
   reward.append(value);
   content.append(reward);
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
   contentRow.append(directPencil(startEdit,name));
  }
  row.append(contentRow);
  monthlyGrid.append(row);
 }
 monthly.append(monthlyGrid);
 const note=en?o.monthlyNoteEn:o.monthlyNoteRu;
 monthly.append(editableText(node('p','wiki-honor-note',note),
  note,'honor.overview',en?'monthlyNoteEn':'monthlyNoteRu',true));
 // Search in Honor has no wikiIndex.search('honor') records. Filter the actual
 // four article sections, link rows, rank cards and monthly rewards instead.
 // The existing rank type filter is retained; searching never changes it.
 if(terms.length){
  const sections=[...detail.querySelectorAll('.wiki-honor-section')];
  for(const block of sections){
   const head=block.querySelector('.wiki-honor-heading-row');
   const headerMatch=matches(head);
   const rankCards=[...block.querySelectorAll('.wiki-honor-rank')];
   const monthlyCards=[...block.querySelectorAll('.wiki-honor-monthly-card')];
   const listRows=[...block.querySelectorAll('.wiki-honor-list-row')];
   for(const card of rankCards){
    card.dataset.honorSearchMatch=String(matches(card));
    card.hidden=!headerMatch&&card.dataset.honorSearchMatch!=='true'||
     (oldFilter==='standard'&&card.dataset.rankType!=='standard')||
     (oldFilter==='monthly'&&card.dataset.rankType!=='monthly');
   }
   for(const card of monthlyCards)card.hidden=!headerMatch&&!matches(card);
   for(const card of listRows)card.hidden=!headerMatch&&!matches(card);
   const other=[...block.children].filter(el=>
    !el.classList.contains('wiki-honor-rank-list')&&
    !el.classList.contains('wiki-honor-monthly-list')&&
    !el.classList.contains('wiki-honor-list-section'));
   const generalMatch=other.some(matches);
   const matchedChildren=[...rankCards,...monthlyCards,...listRows]
    .some(card=>!card.hidden);
   block.hidden=!(headerMatch||generalMatch||matchedChildren);
  }
  for(const entry of nav){
   const target=detail.querySelector('#honor-'+entry.dataset.honorSection);
   entry.hidden=target?.hidden===true;
  }
  if(!sections.some(section=>!section.hidden))
   detail.append(editorial('p','wiki-honor-search-empty',
    'searchEmpty','По запросу ничего не найдено.','No Honor matches found.'));
 }
 // Expose the last *applied* search query for asynchronous screen state.
 // A typed input is not proof that the debounced Honor list has refreshed.
 detail.dataset.honorSearchQuery=String(searchQuery||'');
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
  const visibleSections=sidebar.map(([id])=>id).filter(id=>
   detail.querySelector('#honor-'+id)?.hidden===false);
  let current=visibleSections[0]||'overview';
  for(const [id]of sidebar){
   const part=detail.querySelector('#honor-'+id);
   if(part&&!part.hidden&&part.getBoundingClientRect().top<=readingLine)
    current=id;
  }
  const remaining=scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop;
  const monthlyTop=detail.querySelector('#honor-monthly')?.getBoundingClientRect().top;
  const monthlyVisible=Number.isFinite(monthlyTop)&&
   monthlyTop<=paneTop+Math.min(280,scroller.clientHeight*.43);
  if(scroller.scrollTop<=3)current=visibleSections[0]||'overview';
  else if(visibleSections.includes('monthly')&&(remaining<=36||monthlyVisible))
   current='monthly';
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
