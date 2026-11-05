(function(root){
'use strict';
// Bilingual, source-labelled Honor article. All data is textContent only, so
// editor-authored D1 prose cannot inject HTML or scripts.
function render({browse,detail,make,lang='ru',article,editable=false,
 editText=()=>{},saveText=()=>{},saveList=()=>{},link=()=>null,
 mapOptions=[],onOpenLocations=()=>{}}={}){
 if(!browse||!detail||!article||typeof make!=='function')return;
 const en=lang==='en',tr=(ru,english)=>en?english:ru,
  fmt=new Intl.NumberFormat(en?'en-US':'ru-RU');
 const oldBrowseScroll=browse.scrollTop,oldDetailScroll=detail.scrollTop;
 browse.replaceChildren();detail.replaceChildren();
 const node=(tag,cls,text)=>make(tag,{class:cls,text});
 const section=(id,ru,english)=>{
  const element=make('section',{class:'wiki-honor-section',id:'honor-'+id});
  element.append(node('h4','wiki-honor-heading',tr(ru,english)));
  detail.append(element);
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
 browse.append(node('h4','wiki-location-list-heading',tr('Очки чести','Honor points')));
 const nav=[];
 for(const [id,ru,english,glyph]of sidebar){
  const jump=make('button',{type:'button',class:'wiki-link wiki-honor-nav-link',
   'data-honor-section':id,'aria-current':id==='overview'?'location':null});
  jump.append(node('span','wiki-honor-nav-icon',glyph),
   node('span','',tr(ru,english)));
  jump.addEventListener('click',()=>{
   for(const link of nav){
    const active=link===jump;
    link.classList.toggle('selected',active);
    if(active)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
   }
   detail.querySelector('#honor-'+id)?.scrollIntoView({
    block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?
     'instant':'smooth'});
  });
  nav.push(jump);browse.append(jump);
 }
 nav[0]?.classList.add('selected');
 const title=node('h3','wiki-honor-title',tr('Очки чести','Honor points'));
 detail.append(title,node('p','wiki-honor-subtitle',tr(
  'PvP · нации · звания · награды','PvP · nations · titles · rewards')));
 const overview=section('overview','Система чести','Honor system');
 const o=article.overview;
 const change=editable?' ✎':'';
 paragraph(overview,en?o.overviewEn:o.overviewRu,'honor.overview',
  en?'overviewEn':'overviewRu');
 const panels=make('div',{class:'wiki-honor-dual'});
 const resource=(label,copy,field)=>{
  const card=make('article',{class:'wiki-honor-resource'});
  card.append(node('strong','',label),
   editableText(node('p','',copy),copy,'honor.overview',field,true));
  return card;
 };
 panels.append(
  resource(tr('Честь','Honor'),en?o.honorEn:o.honorRu,
   en?'honorEn':'honorRu'),
  resource(tr('Вся честь','Total Honor'),en?o.totalEn:o.totalRu,
   en?'totalEn':'totalRu'));
 overview.append(panels);
 const gain=section('gain','Получение и потеря чести','Earning and losing Honor');
 paragraph(gain,en?o.gainEn:o.gainRu,'honor.overview',en?'gainEn':'gainRu');
 gain.append(make('div',{class:'wiki-honor-joining'},[
  node('strong','',tr('+1 000 чести','+1,000 Honor')),
  node('small','',tr('При вступлении в любую из трёх наций',
   'On joining any of the three nations'))
 ]));
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
   const field=en?'nameEn':'nameRu',value=item[field]||'';
   names.append(editableListText(node('span','',value),value,key,items,index,field));
   row.append(names);
   if(isZone&&item.mapId){
    const anchor=link(item.mapId,'↗');
    if(anchor){
     anchor.classList.add('wiki-honor-open-location');
     anchor.textContent='↗';
     anchor.setAttribute('aria-label',
      tr('Открыть локацию: ','Open location: ')+value);
     anchor.setAttribute('title',tr('Открыть локацию','Open location'));
     row.append(anchor);
    }
   }
   if(editable){
    if(isZone){
     const select=make('select',{class:'wiki-honor-location-select',
      'aria-label':tr('Связь с локацией','Linked location'),
      onchange:event=>{
       const id=event.target.value||null;
       const chosen=mapOptions.find(option=>option.id===id);
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
   wrapper.append(add);
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
  const button=make('button',{type:'button',class:'wiki-honor-filter'+(key==='all'?' chosen':''),
   text:label,'aria-pressed':String(key==='all'),onclick:()=>{
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
  const card=make('div',{class:'wiki-honor-rank'+(rank.id===7?' is-moon':'')+
   (rank.top!=null?' is-monthly':'')});
  card.dataset.rankType=rank.top!=null?'monthly':'standard';
  card.id='honor-rank-'+rank.id;
  const header=make('div',{class:'wiki-honor-rank-head'});
  header.append(node('span','wiki-honor-rank-number',
   rank.id===7?'☾':String(rank.id+1).padStart(2,'0')));
  const rankTitle=make('div',{class:'wiki-honor-rank-name'});
  const name=en?rank.nameEn:rank.nameRu;
  rankTitle.append(editableText(node('strong','',name),name,
   'honor.rank.'+rank.id,en?'nameEn':'nameRu'));
  rankTitle.append(node('small','',en?rank.nameRu:rank.nameEn));
  header.append(rankTitle);card.append(header);
  const requirement=rank.top!=null?
   tr('Топ-'+rank.top+' нации · 1 месяц','Nation top '+rank.top+' · 1 month'):
   rank.points!=null?
   fmt.format(rank.points)+' '+tr('оч. «Вся честь»','Total Honor')+
    ' · '+fmt.format(rank.gold)+' '+tr('золота','gold'):
   rank.id===0?tr('При вступлении в нацию','On joining a nation'):
   fmt.format(rank.gold)+' '+tr('золота','gold');
  card.append(node('small','wiki-honor-requirement',requirement));
  const bonus=en?rank.benefitEn:rank.benefitRu;
  card.append(editableText(node('p','wiki-honor-rank-benefit',bonus),
   bonus,'honor.rank.'+rank.id,en?'benefitEn':'benefitRu',true));
  rankGrid.append(card);
 }
 ranks.append(rankGrid);
 const monthly=section('monthly','Ежемесячные звания','Monthly titles');
 paragraph(monthly,en?o.cloaksEn:o.cloaksRu,'honor.overview',
  en?'cloaksEn':'cloaksRu');
 monthly.append(node('p','wiki-honor-note',tr(
  'Топ-15 / топ-5 / топ-1 каждой нации определяются 1-го числа по прошлому месяцу. Звание действует месяц и не продлевается автоматически.',
  'Each nation’s top 15 / top 5 / top 1 is determined on the first day of the month from prior-month results. Titles last one month and never auto-renew.')));
 detail.append(node('p','wiki-honor-sources',tr(
  'Источники: правила и числа предоставлены игроком, справочники старой Pandora Saga и новость OS от 23.10.2026. Исторические условия могут отличаться от живого сервера.',
  'Sources: player-supplied rules and figures, historical Pandora Saga references, and the OS announcement of Oct 23, 2026. Historical rules may differ from the live server.')));
 browse.scrollTop=oldBrowseScroll;detail.scrollTop=oldDetailScroll;
}
root.PandoraHonorView=Object.freeze({render});
})(typeof window==='undefined'?globalThis:window);
