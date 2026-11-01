(function(root){
'use strict';
const M=root.PandoraSkillProgression;
const tr=(api,ru,en)=>api.lang==='en'?en:ru;
function make(tag,attr={},children=[]){
 const e=document.createElement(tag);
 for(const [key,val]of Object.entries(attr)){
  if(key==='text')e.textContent=val;
  else if(key==='class')e.className=val;
  else if(key.startsWith('on'))e.addEventListener(key.slice(2),val);
  else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(key))
   e[key]=Boolean(val); // HTML boolean attributes: disabled="false" is STILL disabled.
  else if(val!==undefined&&val!==null)e.setAttribute(key,String(val));
 }
 for(const v of children)e.append(typeof v==='string'?document.createTextNode(v):v);
 return e;
}
function readiness(skill,api,seen=new Set()){
 const problems=[],state=api.state,job=api.job;
 if(seen.has(String(skill.id)))return {learned:false,problems:[tr(api,'Циклическая зависимость навыков','Cyclic skill prerequisite')]};
 const chain=new Set(seen);chain.add(String(skill.id));
 if(skill.classes&&!Object.hasOwn(skill.classes,job))problems.push(tr(api,'Не подходит профессии','Unavailable to this class'));
 if(Number(skill.charLevel)>state.level)problems.push(tr(api,'Требуется уровень ','Requires level ')+skill.charLevel);
 const required=Array.isArray(skill.reqs)?skill.reqs:[];
 for(const req of required){
  if(!req||!Number.isInteger(Number(req.amount))){problems.push(tr(api,'Неизвестное условие','Unknown requirement'));continue}
  const need=Number(req.amount),points=M.potential(state,req.branch),green=M.trained(state,req.branch);
  const name=api.branchName(req.branch);
  if(points<need)problems.push(name+tr(api,': вложено ',': spent ')+points+'/'+need);
  if(green<need)problems.push(name+tr(api,': мастерство ',': mastery ')+green+'/'+need);
 }
 if(skill.prereq){
  const previous=api.skillCatalog.find(row=>String(row.id)===String(skill.prereq));
  if(!previous)problems.push(tr(api,'Предыдущее умение не найдено','Required previous skill not found'));
  else{
   const prerequisite=readiness(previous,api,chain);
   if(!prerequisite.learned)problems.push(tr(api,'Требуется предыдущее умение «','Requires previous skill “')+previous.name+tr(api,'»','”'));
  }
 }
 if(skill.learnable===false)problems.push(tr(api,'Особый способ изучения','Special learning method required'));
 if(Number(skill.reqLevel)>0&&!required.length)problems.push(tr(api,'Дополнительное условие ','Unverified additional requirement ')+skill.reqLevel);
 return {learned:!problems.length,problems};
}
function viewGrowth(target,api){
 target.replaceChildren();
 const {state,groups,selectedGroup,expandedBranch,job,skillCatalog,budget}=api,auto=state.masteryAuto!==false;
 for(const group of groups){
  const branchKeys=group.branches.filter(key=>key!=='race');
  const spent=branchKeys.reduce((sum,key)=>sum+M.potential(state,key),0);
  const wrap=make('section',{class:'game-tree-group'});
  const groupButton=make('button',{type:'button',class:'game-tree-head'+(selectedGroup===group.id?' active':''),
   'aria-expanded':String(selectedGroup===group.id),'data-path-group':group.id,
   onclick:()=>api.onGroup(group.id)});
  const groupSummary=()=>{
   const total=branchKeys.reduce((sum,key)=>sum+M.potential(state,key),0);
   return total+tr(api,' вложено',' spent');
  };
  const groupCount=make('small',{text:groupSummary()});
  groupButton.append(make('strong',{text:api.lang==='en'?group.en:group.ru}),groupCount);
  wrap.append(groupButton);
  if(selectedGroup===group.id){
   for(const key of branchKeys){
    const points=M.potential(state,key),trained=M.trained(state,key),cap=api.cap(key),isOpen=expandedBranch===key;
    const branch=make('button',{type:'button',
     class:'branch-row'+(isOpen?' active':'')+(cap===0?' disabled-branch':''),
     'aria-expanded':String(isOpen),'data-path-branch':key,
     onclick:()=>api.onExpand(key,isOpen)});
    const info=make('div');
    const summaryText=(value,mastery)=>cap===0&&value===0?'':mastery>0?mastery+tr(api,' мастерство',' mastery'):'';
     const branchSummary=make('span',{text:summaryText(points,trained)});
    const branchCount=make('b',{class:'count',text:cap?points+' / '+cap:'—'});
    info.append(make('strong',{text:api.branchName(key)}),branchSummary);
    branch.append(info,branchCount);wrap.append(branch);
    if(!isOpen)continue;
    const editor=make('div',{class:'inline-branch-editor'});
    const note=make('div',{class:'inline-branch-value'});
    const label=make('strong',{text:points+' / '+cap});
    note.append(make('span',{text:root.PandoraUILocale?.text('branchPoints',api.lang)||'Очки ветки'}),label);
    const available=budget.total!==null&&api.allocationReady&&(cap>0||points>0);
    const track=make('div',{class:'inline-mastery-track path-integrated-track','aria-label':tr(api,'Единая полоса вложенных очков и освоенного мастерства ','Shared spent-points and trained-mastery bar: ')+api.branchName(key)});
    const visualMax=Math.max(90,cap,points);
    const bed=make('div',{class:'inline-mastery-bed'}),gold=make('div',{class:'inline-mastery-fill'}),
          green=make('div',{class:'inline-mastery-green'}),
          locked=make('div',{class:'inline-mastery-locked',
           'aria-label':tr(api,'Предел класса: ','Class limit: ')+cap+tr(api,' из ',' of ')+visualMax+tr(api,'. Красная часть недоступна.','. Red segment is locked.')});
    if(cap>=visualMax)locked.hidden=true;
    const lockedFraction=Math.max(0,Math.min(1,cap/visualMax));
    const lockedOffset=21-42*lockedFraction;
    // Standard CSS calc, no browser-dependent multiplication.
    locked.style.left='calc('+(lockedFraction*100).toFixed(6)+'% '+
      (lockedOffset<0?'-':'+')+' '+Math.abs(lockedOffset).toFixed(6)+'px)';
    const milestonesOnTrack=[];
    const paint=()=>{
     const invested=M.potential(state,key),mastery=M.trained(state,key);
     const goldFraction=Math.max(0,Math.min(1,invested/visualMax));
     const greenFraction=Math.max(0,Math.min(1,mastery/visualMax));
     gold.style.width='calc('+(goldFraction*100).toFixed(6)+'% - '+(42*goldFraction).toFixed(6)+'px)';
     green.style.width='calc('+(greenFraction*100).toFixed(6)+'% - '+(42*greenFraction).toFixed(6)+'px)';
     range.setAttribute('aria-valuetext', invested+tr(api,' вложено, ',' spent, ')+mastery+tr(api,' освоено, предел ',' trained, class limit ')+cap);
     for(const entry of milestonesOnTrack)
      entry.tick.classList.toggle('reached',
       !entry.locked&&entry.skills.some(skill=>readiness(skill,api).learned));
    };
    track.append(bed,gold,green,locked);
    const range=make('input',{type:'range',min:'0',max:String(visualMax),step:'1',
     value:String(points),disabled:!available,
     'aria-label':tr(api,'Вложенные очки ','Spent branch points: ')+api.branchName(key),
     'data-branch-control':key+':potential-range'});
    track.append(range);paint();
    const numeric=make('input',{type:'number',min:'0',max:String(Math.max(cap,points)),step:'1',
     value:String(points),class:'path-potential-number',disabled:!available,
     'aria-label':tr(api,'Точное количество вложенных очков ','Exact branch points: ')+api.branchName(key),
     'data-branch-control':key+':potential-number'});
    const update=(requested,final)=>{
     if(!Number.isInteger(requested)||requested<0)return;
     const target=api.onAllocate(key,requested,final);
     if(!Number.isInteger(target))return;
     range.value=String(target);numeric.value=String(target);label.textContent=target+' / '+cap;
     branchCount.textContent=cap?target+' / '+cap:'—';
     branchSummary.textContent=summaryText(target,M.trained(state,key));
     groupCount.textContent=groupSummary();
     input.value=String(M.trained(state,key));input.max=String(target);
     paint();
     // Committing rebuilds the UI so all branch totals stay synchronized.
    };
    range.addEventListener('input',()=>update(Number(range.value),false));
    range.addEventListener('change',()=>update(Number(range.value),true));
    numeric.addEventListener('change',()=>update(Number(numeric.value),true));
    const skills=skillCatalog.filter(s=>s.classes?.[job]&&Array.isArray(s.reqs)&&
     s.reqs.some(req=>req.branch===key));
    const marks=api.milestones(skills,key,cap);
    let unlockDetails=null;
    if(marks.length){
     const ticks=make('div',{class:'path-integrated-milestones'});
     const thresholds=[...new Set(marks.map(mark=>mark.threshold))].sort((a,b)=>a-b);
     for(const threshold of thresholds){
      const at=marks.filter(mark=>mark.threshold===threshold);
      const lockedAt=at.every(mark=>mark.locked);
      const skillsAt=at.flatMap(mark=>mark.skills);
      const learned=skillsAt.some(skill=>readiness(skill,api).learned);
      const tick=make('span',{class:'path-unlock-notch'+
       (lockedAt?' unreachable':learned?' reached':'')+
       (threshold/visualMax<.26?' edge-left':threshold/visualMax>.74?' edge-right':''),
       'data-milestone-points':String(threshold),tabindex:'0',
       'aria-label':threshold+tr(api,' очков: ',' points: ')+skillsAt.map(skill=>skill.name).join(', ')});
      tick.style.left=(threshold/visualMax*100).toFixed(4)+'%';
      const preview=make('div',{class:'path-milestone-tooltip',role:'tooltip'});
      preview.append(make('strong',{text:threshold+tr(api,' очков',' points')}));
      for(const skill of skillsAt){
       const row=make('div',{class:'path-milestone-preview'});
       const source=api.icon(skill.branch,skill);
       if(source){
        const img=make('img',{src:source,alt:''});
        img.onerror=()=>img.remove();
        row.append(img);
       }
       row.append(make('div',{},[
        make('b',{text:skill.name||tr(api,'Умение','Skill')}),
        make('small',{text:skill.desc||tr(api,'Описание отсутствует.','No description available.')})
       ]));
       preview.append(row);
      }
      tick.append(preview);ticks.append(tick);
      milestonesOnTrack.push({tick,skills:skillsAt,locked:lockedAt});
     }
     track.append(ticks);
     // Range handles dragging; hover the nearest notch without placing hit targets over the thumb.
     let hovered=null,dragging=false;
     const clearHover=()=>{
      if(hovered)hovered.tick.classList.remove('is-hovered');
      hovered=null;
     };
     track.addEventListener('pointerdown',()=>{dragging=true;clearHover()});
     track.addEventListener('pointerup',()=>{dragging=false});
     track.addEventListener('pointercancel',()=>{dragging=false;clearHover()});
     track.addEventListener('pointerleave',()=>{dragging=false;clearHover()});
     track.addEventListener('pointermove',event=>{
      if(dragging||event.pointerType==='touch')return;
      const rect=range.getBoundingClientRect();
      const left=rect.left+9,travel=Math.max(1,rect.width-18);
      const at=milestonesOnTrack.reduce((nearest,mark)=>{
       const threshold=Number(mark.tick.getAttribute('data-milestone-points'));
       const distance=Math.abs(event.clientX-(left+threshold/visualMax*travel));
       return distance<nearest.distance?{mark,distance}:nearest;
      },{mark:null,distance:Infinity});
      const next=event.clientY>=rect.top&&event.clientY<=rect.bottom&&
       at.distance<=10?at.mark:null;
      if(next===hovered)return;
      clearHover();
      if(next){hovered=next;next.tick.classList.add('is-hovered')}
     });
     // A separate collapsed list provides access to every skill without covering the drag surface.
     unlockDetails=make('details',{class:'path-unlock-details'});
     unlockDetails.append(make('summary',{
      text:(root.PandoraUILocale?.text('skillsOnTrack',api.lang)||'Умения на шкале')+' · '+marks.reduce((total,mark)=>total+mark.skills.length,0)}));
     const list=make('div',{class:'path-unlock-list'});
     for(const mark of [...marks].sort((a,b)=>a.threshold-b.threshold)){
      for(const skill of mark.skills){
       const gate=readiness(skill,api);
       const button=make('button',{type:'button',class:'path-unlock-skill'+
        (mark.locked?' unreachable':gate.learned?' reached':''),
        'aria-label':(skill.name||tr(api,'Умение','Skill'))+', '+mark.threshold+tr(api,' очков',' points'),
        onclick:()=>api.onSkill(skill)});
       const icon=api.icon(skill.branch,skill);
       if(icon){
        const img=make('img',{src:icon,alt:''});
        img.onerror=()=>img.remove();
        button.append(img);
       }
       const copy=make('span',{class:'path-unlock-copy'});
       copy.append(make('strong',{text:skill.name||tr(api,'Умение','Skill')}),
        make('small',{text:mark.threshold+tr(api,' очков',' points')+
         (mark.locked?tr(api,' · выше лимита',' · above limit'):gate.learned?tr(api,' · доступно',' · available'):'')}));
       button.append(copy);list.append(button);
      }
     }
     unlockDetails.append(list);
    }
    const greenRow=make('div',{class:'path-green-controls'});
    const input=make('input',{type:'number',min:'0',max:String(points),step:'1',
     value:String(trained),disabled:auto||!available,
     'aria-label':tr(api,'Зелёное мастерство ','Trained mastery: ')+api.branchName(key),
     'data-branch-control':key+':mastery-number'});
    input.addEventListener('change',()=>{
     if(!api.onMastery(key,Number(input.value)))input.value=String(M.trained(state,key));
    });
    const greenLabel=make('label');greenLabel.append(make('span',{text:root.PandoraUILocale?.text('greenMastery',api.lang)||'Зелёное мастерство'}),input);
    greenRow.append(greenLabel);
    const exact=make('div',{class:'path-allocation-input'});
    exact.append(make('span',{text:root.PandoraUILocale?.text('exactPoints',api.lang)||'Точно вложено'}),numeric);
    const legend=make('div',{class:'path-track-legend','aria-hidden':'true'},[
     make('span',{text:'0'}),
     make('span',{class:'path-track-limit',text:api.lang==='en'?
      'Class limit: '+cap:'Предел класса: '+cap}),
     make('span',{text:String(visualMax)})
    ]);
    editor.append(note,track,legend);
    if(unlockDetails)editor.append(unlockDetails);
    editor.append(exact,greenRow);
    if(!available)editor.append(make('p',{class:'muted',
     text:!api.allocationReady?tr(api,'Загружаются таблицы очков и лимитов класса.','Loading class point and limit tables…'):
      cap===0?tr(api,'Для этой профессии ветка заблокирована (лимит 0).','This class cannot train this branch (limit 0).'):tr(api,'Недостаточно доступных очков.','Not enough available points.')}));
    if(points>cap)editor.append(make('p',{class:'budget-excess',
     text:tr(api,'Сохранено ','Saved ')+points+tr(api,' очков сверх текущего лимита ',' points above the current class limit ')+cap+tr(api,'. Ничего не удалено автоматически.','. No points were removed automatically.')}));
    wrap.append(editor);
   }
   // Race passives belong in Origin and need no extra reminder on this screen.
  }
  target.append(wrap);
 }
}
function viewSkills(target,details,api){
 const previousScroll=target.querySelector?.('.path-skill-grid')?.scrollTop||0;
 target.replaceChildren();details.replaceChildren();details.hidden=true;
 if(!api.catalogReady){target.append(make('p',{class:'muted',text:tr(api,'Каталог умений загружается.','Loading skill catalog…')}));return}
 const needle=String(api.query||'').trim().toLocaleLowerCase('ru');
 const rows=api.skillCatalog.filter(skill=>skill.classes?.[api.job]&&
  (String(skill.name||'')+' '+skill.id).toLocaleLowerCase('ru').includes(needle))
  .map(skill=>({skill,gate:readiness(skill,api)})).filter(({gate})=>
   api.filter==='all'||(api.filter==='known'?gate.learned:!gate.learned));
 rows.sort((a,b)=>Number(b.gate.learned)-Number(a.gate.learned)||
  String(a.skill.name||'').localeCompare(String(b.skill.name||''),'ru'));
 target.append(make('p',{class:'path-skill-count',text:rows.length+tr(api,' умений',' skills')}));
 const grid=make('div',{class:'path-skill-grid'});
 for(const {skill,gate}of rows.slice(0,api.shown||24)){
  const item=make('button',{type:'button',class:'path-skill-card'+(gate.learned?' learned':' locked')+
    (String(api.selectedSkill?.id)===String(skill.id)?' active':''),
      'aria-label':skill.name+' · '+(gate.learned?tr(api,'доступно','available'):tr(api,'недоступно','unavailable')),
   'data-skill-id':String(skill.id),onclick:()=>api.onInspect(skill)});
  const src=api.icon(skill.branch,skill);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));item.append(img)}
  else item.append(make('span',{text:'✦'}));
  item.append(make('span',{text:skill.name||tr(api,'Умение без названия','Unnamed skill')}));
  grid.append(item);api.hover(item,skill);
 }
 target.append(grid);grid.scrollTop=previousScroll;
 if(rows.length>(api.shown||24))
  target.append(make('button',{type:'button',class:'path-show-more',
   text:tr(api,'Показать ещё (','Show more (')+(rows.length-(api.shown||24))+')',onclick:api.onMoreSkills}));
 if(!rows.length)target.append(make('p',{class:'muted',text:tr(api,'По этим параметрам навыки не найдены.','No skills match these filters.')}));
 const selected=api.selectedSkill?rows.find(row=>String(row.skill.id)===String(api.selectedSkill.id)):null;
 if(selected){details.hidden=false;
  const skill=selected.skill,gate=selected.gate;
  details.append(make('h3',{text:skill.name||tr(api,'Умение без названия','Unnamed skill')}),
   make('p',{text:skill.desc||tr(api,'Описание умения отсутствует.','Skill description unavailable.')}),
   make('p',{class:gate.learned?'path-skill-yes':'path-skill-no',
    text:gate.learned?tr(api,'✓ Условия выполнены','✓ Requirements met'):
     '🔒 '+gate.problems.join(' · ')}));
  const stats=make('dl',{class:'path-skill-metadata'});
  const field=(label,value)=>{
   if(value===null||value===undefined||value==='')return;
   stats.append(make('dt',{text:label}),make('dd',{text:String(value)}));
  };
  field(tr(api,'Уровень персонажа','Character level'),skill.charLevel||tr(api,'Нет известного порога','Unknown requirement'));
  field(tr(api,'Мана / ОМ','Mana / MP'),skill.mana);
  field(tr(api,'Подготовка','Cast time'),skill.cast);
  field(tr(api,'Перезарядка','Cooldown'),skill.cooldown);
  field(tr(api,'Дальность','Range'),skill.rangeFromWeapon?tr(api,'Зависит от оружия','Depends on weapon'):skill.range);
  field(tr(api,'Стихия','Element'),skill.element);
  field(tr(api,'Характеристика','Attribute'),skill.powerStat);
  field(tr(api,'ID умения','Skill ID'),skill.id);
  details.append(stats);
  const requirements=Array.isArray(skill.reqs)?skill.reqs:[];
  if(requirements.length){
   const reqList=make('div',{class:'path-skill-prereqs'});
   reqList.append(make('strong',{text:tr(api,'Требования по веткам','Branch requirements')}));
   for(const req of requirements){
    if(!req||!req.branch)continue;
    const value=M.potential(api.state,req.branch),green=M.trained(api.state,req.branch);
    reqList.append(make('p',{text:api.branchName(req.branch)+' · порог '+req.amount+
     ' · вложено '+value+' · освоено '+green}));
   }
   details.append(reqList);
  }
  if(skill.prereq){
   const before=api.skillCatalog.find(s=>String(s.id)===String(skill.prereq));
   details.append(make('p',{class:'path-skill-prereqs',text:tr(api,'Предыдущее умение: ','Previous skill: ')+
     (before?.name||String(skill.prereq))}));
  }
  // Raw effect codes remain in the encyclopedia, not the quick skill card.
  if(typeof api.skillWiki==='function')details.append(api.skillWiki(skill));
 }
}
root.PandoraHeroPath=Object.freeze({viewGrowth,viewSkills,readiness});
})(typeof window==='undefined'?globalThis:window);
