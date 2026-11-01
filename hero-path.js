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
// First matching ID wins, matching the original Array.find semantics.
function indexSkills(skills){
 const byId=new Map();
 for(const skill of skills||[]){
  if(!skill||skill.id===undefined||skill.id===null)continue;
  const id=String(skill.id);
  if(!byId.has(id))byId.set(id,skill);
 }
 return byId;
}
// Group matching skills once per render; keep the source catalog's order and
// include each skill once even if its requirements repeat the same branch.
function indexSkillsByBranch(skills,job){
 const byBranch=new Map();
 for(const skill of skills||[]){
  if(!allowedForJob(skill,job)||!Array.isArray(skill.reqs))continue;
  const seen=new Set();
  for(const req of skill.reqs){
   const branch=req?.branch;
   if(typeof branch!=='string'||seen.has(branch))continue;
   seen.add(branch);
   if(!byBranch.has(branch))byBranch.set(branch,[]);
   byBranch.get(branch).push(skill);
  }
 }
 return byBranch;
}
// One definition of class entitlement for the branch rail, skill gallery
// and prerequisite checking.  Invalid truthy strings such as "false" are
// not authoritative OS permissions and must never leak into unlocked lists.
function allowedForJob(skill,job){
 const classes=skill?.classes;
 return !!classes&&typeof classes==='object'&&!Array.isArray(classes)&&
  Object.hasOwn(classes,job)&&(classes[job]===1||classes[job]===true);
}
function readiness(skill,api,seen=new Set(),skillIndex){
 const byId=skillIndex||indexSkills(api.skillCatalog);
 const problems=[],state=api.state,job=api.job;
 if(seen.has(String(skill.id)))return {learned:false,problems:[tr(api,'Циклическая зависимость навыков','Cyclic skill prerequisite')]};
 const chain=new Set(seen);chain.add(String(skill.id));
 if(!allowedForJob(skill,job))
  problems.push(tr(api,'Не подходит профессии','Unavailable to this class'));
 if(skill.charLevel!==undefined&&
  (skill.charLevel===null||typeof skill.charLevel==='boolean'||
   !Number.isInteger(Number(skill.charLevel))||Number(skill.charLevel)<0))
  problems.push(tr(api,'Неизвестный уровень изучения','Unknown character level requirement'));
 else if(Number(skill.charLevel)>state.level)
  problems.push(tr(api,'Требуется уровень ','Requires level ')+skill.charLevel);
 if(skill.reqs!==undefined&&!Array.isArray(skill.reqs))
  problems.push(tr(api,'Неизвестные требования навыка','Unknown skill requirements'));
 const required=Array.isArray(skill.reqs)?skill.reqs:[];
 for(const req of required){
  const raw=req?.amount,need=Number(raw);
  if(!req||typeof req.branch!=='string'||!req.branch.trim()||
   (typeof raw!=='number'&&typeof raw!=='string')||
   (typeof raw==='string'&&!/^\+?\d+(?:\.0+)?$/.test(raw.trim()))||
   !Number.isSafeInteger(need)||need<=0){
   problems.push(tr(api,'Неизвестное условие','Unknown requirement'));continue;
  }
  const name=api.branchName(req.branch);
  // Saved investments survive profession changes, but they cannot unlock
  // requirements that the new profession has no capacity to train.
  if(typeof api.cap==='function'){
   const cap=api.cap(req.branch);
   if(!Number.isInteger(cap)||cap<need)
    problems.push(name+tr(api,': порог недоступен для профессии (',': class limit cannot meet requirement (')+
     need+' > '+(Number.isInteger(cap)?cap:'?')+')');
  }
  const points=M.potential(state,req.branch),green=M.trained(state,req.branch);
  if(points<need)problems.push(name+tr(api,': вложено ',': spent ')+points+'/'+need);
  if(green<need)problems.push(name+tr(api,': мастерство ',': mastery ')+green+'/'+need);
 }
 if(skill.prereq){
  const previous=byId.get(String(skill.prereq));
  if(!previous)problems.push(tr(api,'Предыдущее умение не найдено','Required previous skill not found'));
  else{
   const prerequisite=readiness(previous,api,chain,byId);
   if(!prerequisite.learned)problems.push(tr(api,'Требуется предыдущее умение «','Requires previous skill “')+previous.name+tr(api,'»','”'));
  }
 }
 if(skill.learnable===false)problems.push(tr(api,'Особый способ изучения','Special learning method required'));
 else if(skill.learnable!==undefined&&skill.learnable!==true)
  problems.push(tr(api,'Неизвестный способ изучения','Unknown learning method'));
 if(skill.reqLevel!==undefined&&
  (skill.reqLevel===null||typeof skill.reqLevel==='boolean'||
   !Number.isInteger(Number(skill.reqLevel))||Number(skill.reqLevel)<0))
  problems.push(tr(api,'Неизвестное дополнительное условие','Unknown additional requirement'));
 else if(Number(skill.reqLevel)>0&&!required.length)
  problems.push(tr(api,'Дополнительное условие ','Unverified additional requirement ')+skill.reqLevel);
 return {learned:!problems.length,problems};
}
// Skill markers are sorted once per render; nearest hover uses binary search.
function nearestMilestone(marks,fraction){
 if(!marks.length||!Number.isFinite(fraction))return null;
 let low=0,high=marks.length;
 while(low<high){
  const middle=Math.floor((low+high)/2);
  if(marks[middle].thresholdFraction<fraction)low=middle+1;
  else high=middle;
 }
 const before=marks[low-1],after=marks[low];
 if(!before)return after||null;
 if(!after)return before;
 // At an exact midpoint choose the earlier threshold, as before.
 return fraction-before.thresholdFraction<=after.thresholdFraction-fraction?before:after;
}
function viewGrowth(target,api){
 target.replaceChildren();
 const {state,groups,selectedGroup,expandedBranch,job,skillCatalog,budget}=api,auto=state.masteryAuto!==false;
 const skillIndex=indexSkills(skillCatalog),skillsByBranch=indexSkillsByBranch(skillCatalog,job);
 for(const group of groups){
  const branchKeys=group.branches.filter(key=>key!=='race');
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
    // Mastery is already displayed in its compact numeric input below the rail.
    // Duplicating it in the header adds/removes a whole line at zero -> one.

    const branchCount=make('b',{class:'count',text:cap>0||points>0?points+' / '+cap:'—'});
    info.append(make('strong',{text:api.branchName(key)}));
    branch.append(info,branchCount);wrap.append(branch);
    if(!isOpen)continue;
    const editor=make('div',{class:'inline-branch-editor'});
    const available=budget.total!==null&&api.allocationReady&&(cap>0||points>0);
    const track=make('div',{class:'inline-mastery-track path-integrated-track','aria-label':tr(api,'Единая полоса вложенных очков и освоенного мастерства ','Shared spent-points and trained-mastery bar: ')+api.branchName(key)});
    const visualMax=Math.max(90,cap,points);
    const bed=make('div',{class:'inline-mastery-bed'}),gold=make('div',{class:'inline-mastery-fill'}),
          green=make('div',{class:'inline-mastery-green'}),
          locked=make('div',{class:'inline-mastery-locked',
           'aria-label':tr(api,'Предел класса: ','Class limit: ')+cap+tr(api,' из ',' of ')+visualMax+tr(api,'. Красная часть недоступна.','. Red segment is locked.')});
    if(cap>=visualMax)locked.hidden=true;
    // The active fill, class limit, value marker and native thumb all share
    // the same 21px rail inset (range inset 12px + 18px thumb / 2).
    const railInset=21;
    const positionOnRail=(fraction)=>{
     const offset=railInset*(1-2*fraction);
     return 'calc('+(fraction*100).toFixed(6)+'% '+
      (offset<0?'-':'+')+' '+Math.abs(offset).toFixed(6)+'px)';
    };
    const widthOnRail=(fraction)=>
     'calc('+(fraction*100).toFixed(6)+'% - '+(2*railInset*fraction).toFixed(6)+'px)';
    const lockedFraction=Math.max(0,Math.min(1,cap/visualMax));
    locked.style.left=positionOnRail(lockedFraction);
    const currentNotch=make('span',{class:'path-current-notch','aria-hidden':'true'});
    const milestonesOnTrack=[];
    const paint=()=>{
     const invested=M.potential(state,key),mastery=M.trained(state,key);
     const goldFraction=Math.max(0,Math.min(1,invested/visualMax));
     const greenFraction=Math.max(0,Math.min(1,mastery/visualMax));
     gold.style.width=widthOnRail(goldFraction);
     green.style.width=widthOnRail(greenFraction);
     currentNotch.style.left=positionOnRail(goldFraction);
     range.setAttribute('aria-valuetext', invested+tr(api,' вложено, ',' spent, ')+mastery+tr(api,' освоено, предел ',' trained, class limit ')+cap);
     for(const entry of milestonesOnTrack)
      entry.tick.classList.toggle('reached',
       !entry.locked&&entry.skills.some(skill=>readiness(skill,api,new Set(),skillIndex).learned));
    };
    track.append(bed,gold,green,locked);
    track.append(currentNotch);
    const range=make('input',{type:'range',min:'0',max:String(visualMax),step:'1',
     value:String(points),disabled:!available,
     'aria-label':tr(api,'Вложенные очки ','Spent branch points: ')+api.branchName(key),
     'data-branch-control':key+':potential-range'});
    track.append(range);paint();
    const numeric=make('input',{type:'number',min:'0',max:String(Math.max(cap,points)),step:'1',
     value:String(points),class:'path-potential-number',disabled:!available,
     'aria-label':tr(api,'Точное количество вложенных очков ','Exact branch points: ')+api.branchName(key),
     'data-branch-control':key+':potential-number'});
    const restorePotential=()=>{
     const current=String(M.potential(state,key));
     range.value=current;numeric.value=current;
    };
    const update=(requested,final)=>{
     if(!Number.isInteger(requested)||requested<0){restorePotential();return}
     const target=api.onAllocate(key,requested,final);
     if(!Number.isInteger(target)){restorePotential();return}
     range.value=String(target);numeric.value=String(target);
     branchCount.textContent=cap>0||target>0?target+' / '+cap:'—';

     groupCount.textContent=groupSummary();
     input.value=String(M.trained(state,key));input.max=String(target);
     paint();
     // Committing rebuilds the UI so all branch totals stay synchronized.
    };
    range.addEventListener('input',()=>update(Number(range.value),false));
    range.addEventListener('change',()=>update(Number(range.value),true));
    numeric.addEventListener('change',()=>{
     const raw=numeric.value.trim();
     update(raw===''?0:Number(raw),true);
    });
    const skills=skillsByBranch.get(key)||[];
    const marks=api.milestones(skills,key,cap);
    let unlockDetails=null;
    if(marks.length){
     const ticks=make('div',{class:'path-integrated-milestones'});
     // A future/unreachable skill can require more than the 90-point track.
     // Keep it in the accessible list below, but never draw its marker off-rail.
     const byThreshold=new Map();
     for(const mark of marks){
      const threshold=mark.threshold;
      if(!Number.isFinite(threshold)||threshold<0||threshold>visualMax)continue;
      if(!byThreshold.has(threshold))byThreshold.set(threshold,[]);
      byThreshold.get(threshold).push(mark);
     }
     const orderedThresholds=[...byThreshold.keys()].sort((a,b)=>a-b);
     for(const threshold of orderedThresholds){
      const at=byThreshold.get(threshold);
      const lockedAt=at.every(mark=>mark.locked);
      const skillsAt=at.flatMap(mark=>mark.skills);
      const learned=skillsAt.some(skill=>readiness(skill,api,new Set(),skillIndex).learned);
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
       const info=make('div',{class:'path-milestone-copy'});
       info.append(make('b',{text:skill.name||tr(api,'Умение','Skill')}),
        make('small',{text:skill.desc||tr(api,'Описание отсутствует.','No description available.')}));
       if(Number.isFinite(skill.mana)&&skill.mana>=0)
        info.append(make('small',{class:'path-milestone-cost',
         text:tr(api,'Затрат ОМ: ','MP cost: ')+skill.mana}));
       row.append(info);
       preview.append(row);
      }
      tick.append(preview);ticks.append(tick);
      milestonesOnTrack.push({tick,skills:skillsAt,locked:lockedAt,
       thresholdFraction:threshold/visualMax});
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
      const nearest=nearestMilestone(milestonesOnTrack,(event.clientX-left)/travel);
      const distance=nearest?Math.abs(event.clientX-(left+nearest.thresholdFraction*travel)):Infinity;
      const next=event.clientY>=rect.top&&event.clientY<=rect.bottom&&
       distance<=10?nearest:null;
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
       const gate=readiness(skill,api,new Set(),skillIndex);
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
    const input=make('input',{type:'number',min:'0',max:String(points),step:'1',
     value:String(trained),disabled:auto||!available,
     'aria-label':tr(api,'Мастерство ','Mastery: ')+api.branchName(key),
     'data-branch-control':key+':mastery-number'});
    input.addEventListener('change',()=>{
     const raw=input.value.trim(),requested=raw===''?0:Number(raw);
     if(!Number.isInteger(requested)||requested<0||
      !api.onMastery(key,requested))input.value=String(M.trained(state,key));
    });
    const controls=make('div',{class:'path-point-controls'});
    const pointField=(name,help,field,mastery=false)=>{
     const group=make('label',{class:'path-point-group'+(mastery?' path-point-mastery':'')});
     const title=make('span',{class:'path-point-name',text:name,tabindex:'0',
      'data-help':help,'aria-label':name+'. '+help});
     group.append(title,field);return group;
    };
    controls.append(
     pointField(root.PandoraUILocale?.text('exactPoints',api.lang)||tr(api,'Вложено','Spent'),
      tr(api,'Очки, распределённые в этой ветке. Меняются ползунком или точным вводом.','Points allocated to this branch. Adjust with the slider or number input.'),numeric),
     pointField(root.PandoraUILocale?.text('greenMastery',api.lang)||tr(api,'Мастерство','Mastery'),
      tr(api,'Фактически освоенные очки ветки. При автоматическом режиме значение рассчитывается само.','Actually trained mastery in this branch. Automatic mode calculates it for you.'),input,true)
    );
    const legend=make('div',{class:'path-track-legend','aria-hidden':'true'},[
     make('span',{text:'0'}),
     make('span',{class:'path-track-limit',text:api.lang==='en'?
      'Class limit: '+cap:'Предел класса: '+cap}),
     make('span',{text:String(visualMax)})
    ]);
    editor.append(track,legend);
    if(unlockDetails)editor.append(unlockDetails);
    editor.append(controls);
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
 const skillIndex=indexSkills(api.skillCatalog);
 const needle=String(api.query||'').trim().toLocaleLowerCase('ru');
 const rows=api.skillCatalog.filter(skill=>allowedForJob(skill,api.job)&&
  (String(skill.name||'')+' '+skill.id).toLocaleLowerCase('ru').includes(needle))
  .map(skill=>({skill,gate:readiness(skill,api,new Set(),skillIndex)})).filter(({gate})=>
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
    reqList.append(make('p',{text:api.branchName(req.branch)+tr(api,' · порог ',' · threshold ')+req.amount+
     tr(api,' · вложено ',' · spent ')+value+tr(api,' · освоено ',' · trained ')+green}));
   }
   details.append(reqList);
  }
  if(skill.prereq){
   const before=skillIndex.get(String(skill.prereq));
   details.append(make('p',{class:'path-skill-prereqs',text:tr(api,'Предыдущее умение: ','Previous skill: ')+
     (before?.name||String(skill.prereq))}));
  }
  // Raw effect codes remain in the encyclopedia, not the quick skill card.
  if(typeof api.skillWiki==='function')details.append(api.skillWiki(skill));
 }
}
root.PandoraHeroPath=Object.freeze({viewGrowth,viewSkills,readiness});
})(typeof window==='undefined'?globalThis:window);
