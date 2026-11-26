(function(root){
'use strict';
// Bilingual, source-labelled Honor article. All data is textContent only, so
// editor-authored D1 prose cannot inject HTML or scripts.
// The 12 source-faithful 23x23 rank emblems are embedded as local SVG assets.
// No procedurally guessed shapes. Their pixels come from the published game
// files; the game's original silhouettes stay intact on any theme.
const honorIconSrc=id=>Number.isInteger(id)&&id>=0&&id<12?
 'assets/wiki/honor-ranks/'+id+'.svg':null;
// Seven exact source-authored owner-form captions; game locations, war names,
// validation outcomes and identifiers are never part of these D1 defaults.
const honorOwnerFormCopyRows=Object.freeze([
 ['zoneChooseOption','Выбери локацию','Choose location'],
 ['zoneNoMatches','Локации не найдены','No locations found'],
 ['zoneSelectRequired','Выбери локацию','Choose a location'],
 ['warNamesRequired','Заполни RU и EN','Enter RU and EN'],
 ['zoneRemovePrefix','Удалить','Remove'],
 ['locationNameHint','Название изменяется в разделе «Локации»',
  'Edit the name in Locations'],
 ['rankFilterAria','Фильтр рангов','Rank filter']
]);
const honorOwnerFormCopy=new Map(honorOwnerFormCopyRows.map(row=>[row[0],row]));
// Accessibility copy is authorial; rank IDs and source names never are.
const honorAccessibilityCopyRows=Object.freeze([
 ['pvpEventImageAlt','Окно постоянного события «Победы в PvP»',
  'Permanent PvP Victories event window'],
 ['rankEmblemLabel','Эмблема ранга','Rank emblem']
]);
const honorAccessibilityCopy=new Map(honorAccessibilityCopyRows.map(row=>[row[0],row]));
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
 mapOptions=[],onOpenLocations=()=>{},searchQuery='',guardAction=()=>{}}={}){
 if(!browse||!detail||!article||typeof make!=='function')return;
 // Re-rendering after admin edits must never accumulate scroll observers.
 stopObserving();
 const en=lang==='en',tr=(ru,english)=>en?english:ru,
  fmt=new Intl.NumberFormat(en?'en-US':'ru-RU');
 // Search the actual RU/EN authored Honor content, not an OS 'honor'
 // catalog category. Use the same Unicode/ё normalization as Wiki.
 const matchesText=root.PandoraSearchField.compile(searchQuery);
 const hasSearch=Boolean(root.PandoraSearchField.normalize(searchQuery));
 const matches=node=>matchesText(typeof node==='string'?node:node?.textContent||'');
 const oldBrowseScroll=browse.scrollTop,oldDetailScroll=detail.scrollTop;
 const oldSection=detail.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection||
  browse.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection||'overview';
 const oldFilter=detail.querySelector('.wiki-honor-filter.chosen')?.dataset.honorFilter||'all';
 browse.replaceChildren();detail.replaceChildren();
 const node=(tag,cls,text)=>make(tag,{class:cls,text});
  // Authorial Honor captions are edited at the visible text without a
  // neighboring pencil; existing CAS/Undo and RU/EN keys remain unchanged.
  const editorial=(tag,cls,key,ru,english)=>{
   const element=node(tag,cls,copy(key,ru,english));
   if(editable)editCopy(element,key,ru,english);
   return element;
  };
  // Direct owner caption; native Enter/Space keep their action, F2 edits.
  const formPair=key=>{
   const row=honorOwnerFormCopy.get(key);
   if(!row)throw Error('Unreviewed Honor form copy key: '+key);
   return [row[1],row[2]];
  };
  const formText=key=>{
   const [ru,english]=formPair(key);
   return copy(key,ru,english);
  };
  const formNote=(holder,key)=>{
   const [ru,english]=formPair(key);
   holder.replaceChildren(editorial('span','wiki-honor-owner-note',key,ru,english));
  };
  // Native options cannot be edited by double-click inside the OS dropdown.
  // Owner Alt+F2 edits the *visible placeholder* on its original selector;
  // ordinary F2 continues editing its independent accessible name.
  const formOption=key=>{
   const [ru,english]=formPair(key);
   const option=make('option',{value:'',text:copy(key,ru,english)});
   if(editable){
    Object.assign(option.dataset,{
     ownerCopySection:'honor-view',ownerCopyId:key,
     ownerCopyRu:ru,ownerCopyEn:english
    });
   }
   return option;
  };
  const bindFormOptions=select=>{
   if(!editable)return;
   select.setAttribute('aria-keyshortcuts',
    ((select.getAttribute('aria-keyshortcuts')||'')+' Alt+F2').trim());
   select.addEventListener('keydown',event=>{
    if(event.target!==select||event.key!=='F2'||!event.altKey||
      event.shiftKey||event.ctrlKey||event.metaKey)return;
    const placeholder=select.querySelector('option[value=""]');
    if(!placeholder||select.parentElement?.querySelector(
       '.wiki-honor-native-copy-editor'))return;
    const key=placeholder.dataset.ownerCopyId;
    if(!honorOwnerFormCopy.has(key))return;
    event.preventDefault();event.stopPropagation();
    const [ru,english]=formPair(key);
    const host=node('span','wiki-honor-native-copy-editor',formText(key));
    select.after(host);
    editCopy(host,key,ru,english,{
     onCommitted:value=>{
      const current=select.querySelector('option[value=""]');
      if(current?.dataset.ownerCopyId===key)current.textContent=value;
     },
     onFinished:()=>{
      host.remove();
      if(select.isConnected)select.focus({preventScroll:true});
     }
    });
    host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   });
  };
  const ownerActionLabel=(button,key,ru,english)=>{
   const caption=node('span','wiki-honor-action-caption',copy(key,ru,english));
   button.replaceChildren(caption);
   if(editable){
    editCopy(caption,key,ru,english);
    button.setAttribute('aria-keyshortcuts','F2');
    button.addEventListener('keydown',event=>{
     if(event.target!==button||event.key!=='F2'||event.altKey||
      event.shiftKey||event.ctrlKey||event.metaKey)return;
     event.preventDefault();event.stopPropagation();
     caption.dispatchEvent(new KeyboardEvent('keydown',{
      key:'F2',bubbles:true,cancelable:true
     }));
    });
    guardAction(button,caption);
   }
   return button;
  };
  // Native controls retain real user input/selection. F2 edits authored
  // placeholders or aria text with the regular CAS editor, no extra pencil.
  const ownerNativeCopy=(field,key,ru,english,attribute,shortcut,mirrorAria=false,suffix='')=>{
   const paint=value=>{
    field.setAttribute(attribute,value+suffix);
    if(mirrorAria)field.setAttribute('aria-label',value+suffix);
   };
   paint(copy(key,ru,english));
   if(!editable)return;
   // Register native attributes in the existing shared in-place copy system.
   // This lets both successful CAS and Undo patch text without recreating
   // the transient form, its typed value, selection, or active input.
   let bindings={};
   try{bindings=JSON.parse(field.dataset.ownerInterfaceBindings||'{}')}catch{}
   const binding={section:'honor-view',key,ru,en:english,prefix:'',suffix};
   bindings[attribute]=binding;
   if(mirrorAria)bindings['aria-label']=binding;
   field.dataset.ownerInterfaceBindings=JSON.stringify(bindings);
   const previous=field.getAttribute('aria-keyshortcuts')||'';
   field.setAttribute('aria-keyshortcuts',(previous+' '+shortcut).trim());
   field.addEventListener('keydown',event=>{
    if(event.target!==field||event.key!=='F2'||
     event.shiftKey!==(shortcut==='Shift+F2')||
     event.altKey||event.ctrlKey||event.metaKey)return;
    event.preventDefault();event.stopPropagation();
    if(field.parentElement?.querySelector('.wiki-honor-native-copy-editor'))return;
    const host=node('span','wiki-honor-native-copy-editor',copy(key,ru,english));
    field.after(host);
    editCopy(host,key,ru,english,{
     onCommitted:paint,
     onFinished:()=>{
      host.remove();
      if(field.isConnected)field.focus({preventScroll:true});
     }
    });
    host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   });
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
    
   }
   detail.append(titleRow);
   // Use existing Honor information instead of inventing war-specific rules.
   detail.append(node('p','wiki-honor-copy wiki-honor-war-copy',
    en?article.overview.gainEn:article.overview.gainRu));
  }else detail.append(editorial('h3','wiki-honor-title','warNotFound',
   'Война не найдена','War not found'));
  if(hasSearch){
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
   // Heading text already owns a dblclick/F2 editor.
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
  // Editing is done on this very text node; game values remain unchanged.
  const kind=target.tagName==='STRONG'?
   tr('название','name'):tr('описание','description');
  const isRequirement=target.classList.contains('wiki-honor-requirement');
  const isBenefit=target.classList.contains('wiki-honor-rank-benefit');
  const wrap=make('div',{class:'wiki-honor-field-edit-row'+
   (isRequirement?' is-rank-requirement':isBenefit?' is-rank-benefit':'')});
  wrap.append(target);
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
  ['victories','Победы в PvP','PvP Victories','✦'],
  ['ranks','Ранги и привилегии','Ranks and privileges','♜'],
  ['monthly','Ежемесячные звания','Monthly titles','✦']
 ];
 // Keep the owner-editable label separate from live chapter count.
 const sectionsLabel=make('p',{class:'muted wiki-honor-sections-label'});
 sectionsLabel.append(editorial('span','','sectionsHeading','Разделы','Sections'),
  node('span','wiki-honor-live-count',' · '+sidebar.length));
 browse.append(sectionsLabel);
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
  const navCaption=node('span','wiki-honor-nav-caption',
   label('honor',id,ru,english));
  jump.append(node('span','wiki-honor-nav-icon',glyph),navCaption);
  if(editable){
   // The sidebar and the article heading share an existing wiki.labels
   // identity; a double click edits this exact caption, never the link ID.
   const initial=label('honor',id,ru,english);
   navCaption.classList.add('wiki-honor-editable');
   navCaption.tabIndex=0;
   navCaption.setAttribute('aria-keyshortcuts','F2');
   const edit=event=>{
    event.preventDefault();event.stopPropagation();
    editLabel(navCaption,'honor',id,initial);
   };
   navCaption.addEventListener('dblclick',edit);
   navCaption.addEventListener('keydown',event=>{
    if(event.key==='F2')edit(event);
   });
   guardAction(jump,navCaption);
  }
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
  // Title text already owns a dblclick/F2 editor.
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
     if(editable){
      name.tabIndex=0;
      const [ru,english]=formPair('locationNameHint');
      ownerNativeCopy(name,'locationNameHint',ru,english,'title','F2');
     }
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
     // Do not navigate on the first half of a caption double-click.
     const edit=event=>{
      event.preventDefault();event.stopPropagation();
      editText(anchor,value,false,next=>saveList(key,
       items.map((row,i)=>i===index?{...row,[field]:next}:row)));
     };
     anchor.classList.add('wiki-honor-editable');
     anchor.addEventListener('dblclick',edit);
     anchor.setAttribute('aria-keyshortcuts','F2');
     anchor.addEventListener('keydown',event=>{if(event.key==='F2')edit(event)});
     guardAction(anchor,anchor);
    }
   }
   row.append(names);
   if(editable){
    if(isZone){
     const select=make('select',{class:'wiki-honor-location-select',
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
     ownerNativeCopy(select,'zoneReplaceAria','Заменить локацию',
      'Replace location','aria-label','F2');
     // Unlinking is not supported by saveList: do not advertise a false
     // "Unlinked" action on an otherwise valid location selector.
     select.append(formOption('zoneChooseOption'));
     bindFormOptions(select);
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
    const remove=make('button',{type:'button',class:'wiki-owner-remove',
     text:'×',onclick:()=>void Promise.resolve(
      saveList(key,items.filter((_,i)=>i!==index)))
      .catch(error=>showError(row,error))});
    const [ru,english]=formPair('zoneRemovePrefix');
    ownerNativeCopy(remove,'zoneRemovePrefix',ru,english,'aria-label',
     'F2',false,' '+(value||item.nameRu));
    row.append(remove);
   }
   content.append(row);
  }
  wrapper.append(content);
  if(editable){
   const add=make('button',{type:'button',class:'wiki-owner-plus wiki-honor-add',
    onclick:()=>{
     if(wrapper.querySelector('.wiki-honor-new'))return;
     const form=make('div',{class:'wiki-honor-new'});
     const note=node('small','wiki-honor-error','');
     const cancel=make('button',{type:'button',class:'wiki-owner-remove',
      onclick:()=>form.remove()});
     ownerActionLabel(cancel,'cancelAction','Отмена','Cancel');
     if(isZone){
      const search=make('input',{type:'search',
       autocomplete:'none','aria-autocomplete':'none',
       'data-lpignore':'true','data-1p-ignore':'true',
       'data-bwignore':'true','data-form-type':'other'});
      ownerNativeCopy(search,'locationSearchPlaceholder','Найти локацию…',
       'Find a location…','placeholder','F2');
      ownerNativeCopy(search,'locationSearchAria','Поиск существующей локации',
       'Search existing locations','aria-label','Shift+F2');
      const select=make('select',{class:'wiki-honor-location-select'});
      ownerNativeCopy(select,'locationPickerAria','Выбери существующую локацию',
       'Choose an existing location','aria-label','F2');
      bindFormOptions(select);
      const fill=()=>{
       const matchesLocation=root.PandoraSearchField.compile(search.value);
       const selected=new Set(items.map(item=>item.mapId));
       const found=mapOptions.filter(option=>
        !selected.has(option.id)&&
        matchesLocation([option.nameRu,option.nameEn].filter(Boolean).join(' ')))
        .slice(0,100);
       select.replaceChildren(formOption(found.length?
        'zoneChooseOption':'zoneNoMatches'));
       for(const entry of found)select.append(make('option',{
        value:entry.id,text:en?entry.nameEn:entry.nameRu}));
       // Keep the no-match placeholder focusable for owner Alt+F2;
       // the submit handler still refuses any missing selection.
       select.disabled=!found.length&&!editable;
      };
      const submit=make('button',{type:'button',class:'wiki-owner-plus',
       onclick:async()=>{
        const selected=mapOptions.find(entry=>entry.id===select.value);
        if(!selected){formNote(note,'zoneSelectRequired');return}
        let id='custom-1',n=1;
        while(items.some(item=>item.id===id))id='custom-'+(++n);
        try{await saveList(key,[...items,{id,mapId:selected.id,
         nameRu:selected.nameRu,nameEn:selected.nameEn}])}
        catch(error){note.textContent=error?.message||String(error)}
       }});
      ownerActionLabel(submit,'submitAction','Добавить','Add');
      const create=make('button',{type:'button',class:'wiki-honor-create-location',
       onclick:()=>onOpenLocations()});
      ownerActionLabel(create,'createLocationAction',
       'Нет в списке? Создать в «Локациях»','Not listed? Create it in Locations');
      form.append(search,select,submit,cancel,create,note);
      search.addEventListener('input',fill);fill();search.focus();
     }else{
      const ru=make('input',{type:'text',maxLength:140});
      const english=make('input',{type:'text',maxLength:140});
      ownerNativeCopy(ru,'warNameRu','Название на русском',
       'Russian name','placeholder','F2',true);
      ownerNativeCopy(english,'warNameEn','Название на английском',
       'English name','placeholder','F2',true);
      const submit=make('button',{type:'button',class:'wiki-owner-plus',
       onclick:async()=>{
        const nameRu=ru.value.trim(),nameEn=english.value.trim();
        if(!nameRu||!nameEn){formNote(note,'warNamesRequired');return}
        let id='custom-1',n=1;
        while(items.some(item=>item.id===id))id='custom-'+(++n);
        try{await saveList(key,[...items,{id,nameRu,nameEn}])}
        catch(error){note.textContent=error?.message||String(error)}
       }});
      ownerActionLabel(submit,'submitAction','Добавить','Add');
      form.append(ru,english,submit,cancel,note);ru.focus();
     }
     wrapper.append(form);
    }});
   if(isZone)ownerActionLabel(add,'linkZoneAction','+ Связать локацию','+ Link location');
   else ownerActionLabel(add,'addWarAction','+ Добавить войну','+ Add war');
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
 const victories=section('victories','Победы в PvP','PvP Victories');
 paragraph(victories,en?o.pvpIntroEn:o.pvpIntroRu,'honor.overview',en?'pvpIntroEn':'pvpIntroRu');
 // Self-hosted illustration only. No external image host is exposed to players.
 const eventImage=make('img',{
  class:'wiki-honor-pvp-illustration',
  src:'assets/wiki/honor-victories.jpg',
  alt:copy(...honorAccessibilityCopy.get('pvpEventImageAlt')),
  loading:'lazy',decoding:'async'});
 if(editable){
  const [key,ru,english]=honorAccessibilityCopy.get('pvpEventImageAlt');
  eventImage.tabIndex=0;
  ownerNativeCopy(eventImage,key,ru,english,'alt','F2');
 }
 // A gameplay illustration is not a navigation action. Never expose the
 // image host, external game server, or provenance in the player-facing Wiki.
 eventImage.addEventListener('error',()=>eventImage.remove());
 victories.append(eventImage);
 const event=article.pvpVictories;
 if(event?.daily&&event?.weekly&&event?.hunts){
  const addTable=(key,captionRu,captionEn,headers,rows)=>{
   const group=make('div',{class:'wiki-honor-pvp-group'});
   group.append(editorial('h5','wiki-honor-pvp-label',
    key+'Heading',captionRu,captionEn));
   const table=make('table',{class:'wiki-honor-pvp-table'});
   const thead=make('thead'),head=make('tr');
   headers.forEach(([ru,english],index)=>{
    const cell=make('th',{});
    cell.append(editorial('span','wiki-honor-table-caption',
     key+'Column'+index,ru,english));
    head.append(cell);
   });
   thead.append(head);table.append(thead);
   const tbody=make('tbody');
   for(const values of rows){
    const row=make('tr');
    for(const value of values)row.append(node('td','',String(value)));
    tbody.append(row);
   }
   table.append(tbody);group.append(table);victories.append(group);
  };
  addTable('pvpDaily','Ежедневные награды','Daily rewards',
   [['Победы за день','Daily victories'],['Награда','Reward']],
   event.daily.map(row=>[row.wins,en?row.rewardEn:row.rewardRu]));
  paragraph(victories,en?o.pvpDailyEn:o.pvpDailyRu,'honor.overview',
   en?'pvpDailyEn':'pvpDailyRu');
  addTable('pvpWeekly','Обмен боевых жетонов','Combat-token exchange',
   [['Награда','Reward'],['Стоимость','Cost'],['Лимит за неделю','Weekly limit']],
   event.weekly.map(row=>[en?row.rewardEn:row.rewardRu,
    en?row.costEn:row.costRu,row.limit]));
  paragraph(victories,en?o.pvpWeeklyEn:o.pvpWeeklyRu,'honor.overview',
   en?'pvpWeeklyEn':'pvpWeeklyRu');
  // The RU/EN heading is authorial text; the source-defined event days
  // must never be part of an editable D1/CAS caption.
  victories.append(make('h5',{
   class:'wiki-honor-pvp-label wiki-honor-double-rewards'
  },[
   editorial('span','wiki-honor-pvp-heading-copy','pvpDoubleHeading',
    'Двойные награды','Double rewards'),
   node('span','wiki-honor-fixed-schedule',
    en?': Tuesday and Thursday':': вторник и четверг')
  ]));
  paragraph(victories,en?o.pvpHuntEn:o.pvpHuntRu,'honor.overview',
   en?'pvpHuntEn':'pvpHuntRu');
  addTable('pvpHunt','Расписание охоты (МСК)','Hunt schedule (Moscow time)',
   [['День','Day'],['Время','Time'],['Карта','Map']],
   event.hunts.map(row=>[en?row.daysEn:row.daysRu,row.hours,
    en?row.mapEn:row.mapRu]));

 }
 const ranks=section('ranks','Ранги и привилегии','Honor ranks and privileges');
 paragraph(ranks,en?o.ranksEn:o.ranksRu,'honor.overview',
  en?'ranksEn':'ranksRu');
 const rankFilters=make('div',{class:'wiki-honor-rank-filters',role:'group'});
 if(editable)rankFilters.tabIndex=0;
 const [rankRu,rankEn]=formPair('rankFilterAria');
 ownerNativeCopy(rankFilters,'rankFilterAria',rankRu,rankEn,'aria-label','F2');
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
    // Caption editing does not change the selected rank filter.
    for(const choice of rankFilters.querySelectorAll('button[data-honor-filter]')){
     const active=choice===button;
     choice.classList.toggle('chosen',active);choice.setAttribute('aria-pressed',String(active));
    }
    for(const card of rankGrid.children)
     card.hidden=(key==='standard'?card.dataset.rankType!=='standard':
      key==='monthly'?card.dataset.rankType!=='monthly':false)||
      (hasSearch>0&&card.dataset.honorSearchMatch==='false');
   }});
  const caption=node('span','wiki-honor-filter-caption',label);
  button.append(caption,node('span','wiki-honor-filter-count',' · '+count));
  wrap.append(button);
  if(editable){
   const host=make('span',{class:'wiki-honor-filter-edit-host',hidden:true,text:label});
   const restore=()=>{
    button.hidden=false;host.hidden=true;
    if(button.isConnected)button.focus({preventScroll:true});
   };
   editCopy(host,copyKey,ru,english,{
    onCommitted:visible=>{caption.textContent=visible},onFinished:restore
   });
   const edit=event=>{
    event.preventDefault();event.stopPropagation();
    if(!host.hidden)return;
    button.hidden=true;host.hidden=false;
    host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   };
   caption.addEventListener('dblclick',edit);
   // Native button owns the F2 action; nested captions have no tab stop.
   button.setAttribute('aria-keyshortcuts','F2');
   button.addEventListener('keydown',event=>{
    if(event.target===button&&event.key==='F2'&&!event.altKey&&
       !event.shiftKey&&!event.ctrlKey&&!event.metaKey)edit(event);
   });
   guardAction(button,caption);
   wrap.append(host);
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
  const [emblemKey,emblemRu,emblemEn]=honorAccessibilityCopy.get('rankEmblemLabel');
  const emblemSuffix=': '+(en?rank.nameEn:rank.nameRu);
  const marker=make('span',{class:'wiki-honor-rank-number wiki-honor-emblem',
   role:'img','aria-label':copy(emblemKey,emblemRu,emblemEn)+emblemSuffix});
  if(editable){
   marker.tabIndex=0;
   ownerNativeCopy(marker,emblemKey,emblemRu,emblemEn,
    'aria-label','F2',false,emblemSuffix);
  }
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
  // Rank thresholds are game records, not authorial prose. Earlier fallback
  // requirements were editable as one string, letting a translation overwrite
  // the displayed Total Honor, gold, or monthly placement threshold. Split
  // only GENERATED fallback copy into D1 captions and immutable numeric nodes.
  // A pre-existing authored requirementRu/En remains on its original record:
  // do not discard a saved Wiki override or silently migrate its D1 key.
  const authoredRequirement=en?rank.requirementEn:rank.requirementRu;
  if(authoredRequirement){
   card.append(editableText(node('p','wiki-honor-requirement',authoredRequirement),
    authoredRequirement,'honor.rank.'+rank.id,
    en?'requirementEn':'requirementRu',true));
  }else{
   const requirement=node('p','wiki-honor-requirement','');
   const phrase=(key,ru,english)=>
    requirement.append(editorial('span','wiki-honor-requirement-copy',key,ru,english));
   const space=()=>requirement.append(document.createTextNode(' '));
   const number=value=>requirement.append(
    node('span','wiki-honor-runtime-value',fmt.format(value)));
   if(rank.top!=null){
    phrase('rankReqTopLead',
     'Для получения ранга необходимо находиться в топ',
     'To earn this rank, finish in your nation’s top');
    requirement.append(document.createTextNode(en?' ':'-'));
    number(rank.top);
    space();
    phrase('rankReqTopEnd','нации за предыдущий месяц.',
     'for the previous month.');
   }else if(rank.points!=null){
    phrase('rankReqPointsLead','Для получения ранга необходимо',
     'To obtain this rank, you need');
    space();number(rank.points);space();
    phrase('rankReqPointsMiddle','оч. ресурса «Вся честь» ·',
     'Total Honor points ·');
    space();number(rank.gold);space();
    phrase('rankReqGoldEnd','золота.','gold.');
   }else if(rank.id===0){
    phrase('rankReqJoinNation',
     'Ранг можно получить при вступлении в любую из существующих наций в игре.',
     'This rank can be earned by joining any of the nations in the game.');
   }else{
    phrase('rankReqGoldLead','Для получения ранга необходимо',
     'To obtain this rank, you need');
    space();number(rank.gold);space();
    phrase('rankReqGoldEnd','золота.','gold.');
   }
   // Match the existing owner-only grid layout without adding a pencil.
   if(editable){
    const row=make('div',{class:'wiki-honor-field-edit-row is-rank-requirement'});
    row.append(requirement);card.append(row);
   }else card.append(requirement);
  }
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
   // Monthly title text already owns a dblclick/F2 editor.
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
 if(hasSearch){
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
