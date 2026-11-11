(function(root){
'use strict';
const M=root.PandoraSkillProgression;
const tr=(api,ru,en)=>api.lang==='en'?en:ru;
// Display-only labels for OS element codes. Leave the D1 catalog untouched.
const ELEMENT_LABELS=Object.freeze({
 FIRE:['Огонь','Fire'],HOLY:['Свет','Light'],COLD:['Лёд','Ice'],
 LIGHTNING:['Молния','Lightning'],CHARM:['Чары','Charm'],
 DARK:['Тьма','Dark'],POISON:['Яд','Poison']
});
const elementLabel=(element,api)=>{
 if(typeof element!=='string')return null;
 const code=element.trim().toUpperCase();
 if(!code||code==='NONE')return null;
 const labels=Object.hasOwn(ELEMENT_LABELS,code)?ELEMENT_LABELS[code]:null;
 return labels?labels[api.lang==='en'?1:0]:tr(api,'Неизвестно','Unknown');
};
// Hero skill search follows the same word-order-independent convention as
// equipment and encyclopedia pickers, without changing catalog identities.
const matchesSkillSearch=(label,query)=>{
 const normalize=value=>String(value??'').normalize('NFKC')
  .toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const searchable=normalize(label);
 return normalize(query).split(' ').filter(Boolean)
  .every(term=>searchable.includes(term));
};
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
 if(tag==='input'&&attr.type==='number')root.PandoraNumericField?.prepare(e);
 return e;
}
// A count is runtime data, but its visible noun must agree with the locale.
const skillCountLabel=(count,locale='ru')=>{
 const n=Number.isSafeInteger(count)&&count>=0?count:0;
 if(locale==='en')return n+' '+(n===1?'skill':'skills');
 const category=new Intl.PluralRules('ru').select(n);
 return n+' '+(category==='one'?'умение':category==='few'?'умения':'умений');
};
// Fixed UI help stays separate from skill names, thresholds and player input.
const authored=(api,key,ru,en,tag='p',cls='muted')=>{
 const value=api.copyLabel?.(key,ru,en)||tr(api,ru,en);
 const node=make(tag,{class:cls});
 if(!api.canEdit||typeof api.editLabel!=='function'){
  node.textContent=value;return node;
 }
 node.classList.add('path-owner-edit-row');
 const label=make('span',{class:'path-owner-copy-text',text:value});
 const pencil=make('button',{type:'button',class:'path-owner-pencil',
  text:'✎','aria-label':tr(api,'Изменить надпись: ','Edit caption: ')+value});
 const sync=next=>pencil.setAttribute('aria-label',
  tr(api,'Изменить надпись: ','Edit caption: ')+next);
 api.editLabel(label,key,ru,en,{onCommitted:sync});
 pencil.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  label.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
 });
 pencil.addEventListener('focus',()=>sync(label.textContent));
 node.append(label,pencil);
 return node;
};
// Match the established Origin stat button behavior: one point per click,
// continuous increments after holding 340 ms, repeat every 85 ms.
// During a hold we update state in place; pointerup commits a single rerender.
function bindPathHoldStep(button,step,commit,api){
 let delay=null,interval=null,active=false,skipClick=false,changed=false;
 const cleanup=()=>{
  if(delay!==null){clearTimeout(delay);delay=null}
  if(interval!==null){clearInterval(interval);interval=null}
  active=false;button.classList?.remove?.('is-repeating');
 };
 const finish=()=>{
  const dirty=changed;changed=false;cleanup();
  if(dirty)commit();
 };
 const run=()=>{
  if(button.disabled||!button.isConnected){finish();return}
  if(step())changed=true;
  else if(active)finish();
 };
 button.addEventListener('pointerdown',event=>{
  if(button.disabled||event.button!==0||event.isPrimary===false)return;
  cleanup();active=true;changed=false;skipClick=true;run();
  if(!active)return;
  delay=setTimeout(()=>{
   delay=null;
   if(!active||button.disabled||!button.isConnected){finish();return}
   button.classList?.add?.('is-repeating');
   interval=setInterval(run,85);
  },340);
 });
 button.addEventListener('pointerup',finish);
 button.addEventListener('pointercancel',finish);
 button.addEventListener('pointerleave',finish);
 button.addEventListener('lostpointercapture',finish);
 button.addEventListener('blur',finish);
 button.addEventListener('click',event=>{
  if(event?.detail===0){skipClick=false;run();finish();return}
  if(skipClick){skipClick=false;return}
  run();finish();
 });
 button.addEventListener('keydown',event=>{if(event.key==='Escape')finish()});
 button.setAttribute('aria-description',tr(api,
  'Нажмите, чтобы изменить на 1; удерживайте для повторения.',
  'Click to change by 1; hold to repeat.'));
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
function validSourceLevel(raw){
 // Optional metadata may be absent; if supplied, require a nonnegative
 // integer number/decimal text.  JS coercion of [] and blanks into zero is
 // not evidence of a real game requirement.
 if(typeof raw!=='number'&&typeof raw!=='string')return false;
 if(typeof raw==='string'&&!/^\+?\d+(?:\.0+)?$/.test(raw.trim()))return false;
 return Number.isSafeInteger(Number(raw))&&Number(raw)>=0;
}
function readiness(skill,api,seen=new Set(),skillIndex){
 const byId=skillIndex||indexSkills(api.skillCatalog);
 const problems=[],state=api.state,job=api.job;
 if(seen.has(String(skill.id)))return {learned:false,problems:[tr(api,'Циклическая зависимость навыков','Cyclic skill prerequisite')]};
 const chain=new Set(seen);chain.add(String(skill.id));
 if(!allowedForJob(skill,job))
  problems.push(tr(api,'Не подходит профессии','Unavailable to this class'));
 if(skill.charLevel!==undefined&&!validSourceLevel(skill.charLevel))
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
   if(!Number.isInteger(cap)||cap===0)
    problems.push(name+tr(api,': недоступно для профессии',': unavailable to this class'));
  }
  const points=M.branchPotential(state,req.branch,api.innate,api.branchCaps);
  // Unlocking a skill requires allocated branch points, not green proficiency:
  // otherwise the first skill could never be used to start training green.
  if(points<need)problems.push(name+tr(api,': вложено ',' : allocated ')+points+'/'+need);
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
 if(skill.reqLevel!==undefined&&!validSourceLevel(skill.reqLevel))
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
 const innate=api.innate||{},caps=api.branchCaps||{};
 const skillIndex=indexSkills(skillCatalog),skillsByBranch=indexSkillsByBranch(skillCatalog,job);
 for(const group of groups){
  const branchKeys=group.branches.filter(key=>key!=='race');
  const wrap=make('section',{class:'game-tree-group'});
  const head=make('div',{class:'game-tree-head-row'});
  const groupButton=make('button',{type:'button',class:'game-tree-head'+(selectedGroup===group.id?' active':''),
   'aria-expanded':String(selectedGroup===group.id),'data-path-group':group.id,
   onclick:()=>api.onGroup(group.id)});
  const groupSummary=()=>{
   const spent=branchKeys.reduce((sum,key)=>sum+M.potential(state,key),0);
   const mastered=branchKeys.reduce((sum,key)=>sum+M.branchMastery(state,key,innate,caps),0);
   const learned=branchKeys.reduce((sum,key)=>sum+M.branchPotential(state,key,innate,caps),0);
   // Green trained, total learned branch points and extra spent points differ.
   return tr(api,'освоено ','trained ')+mastered+
    tr(api,' · изучено ',' · learned ')+learned+
    tr(api,' · вложено ',' · invested ')+spent;
  };
  const groupCount=make('small',{text:groupSummary()});
  const captionKey='group.'+group.id;
  const name=api.copyLabel?.(captionKey,group.ru,group.en)||
   (api.lang==='en'?group.en:group.ru);
  const caption=make('strong',{text:name});
  let groupPencil=null;
  const pencilName=()=>tr(api,'Редактировать направление ','Edit path group ')+caption.textContent;
  api.editLabel?.(caption,captionKey,group.ru,group.en,{
   onCommitted:()=>groupPencil?.setAttribute('aria-label',pencilName())
  });
  groupButton.append(caption,groupCount);
  head.append(groupButton);
  if(api.canEdit){
   // Real sibling action: a pencil must not be nested in disclosure controls.
   // Both actions support touch, keyboard and screen-reader navigation.
   const pencil=make('button',{type:'button',class:'path-group-pencil',text:'✎',
    'aria-label':pencilName()});
   groupPencil=pencil;
   pencil.addEventListener('focus',()=>pencil.setAttribute('aria-label',pencilName()));
   pencil.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   });
   head.append(pencil);
  }
  wrap.append(head);
  if(selectedGroup===group.id){
   // The game client also shows the Racial line under Special, greyed out.
   // Race passives are chosen in Origin and do not spend branch skill points.
   if(group.branches.includes('race')){
    const race=make('button',{type:'button',disabled:true,
     class:'branch-row disabled-branch path-racial-unavailable',
     'data-path-branch':'race',
     'aria-label':tr(api,'Расовые навыки: не прокачиваются очками веток','Racial skills: no branch point allocation')});
    const info=make('div');
    const ru='Расовые',en='Racial',key='racialBranch';
    const value=api.copyLabel?.(key,ru,en)||tr(api,ru,en);
    const caption=make('strong',{text:value});
    if(api.canEdit&&typeof api.editLabel==='function'){
     // Content-editable inputs cannot be focused inside a disabled button.
     // Overlay a sibling caption onto the same disabled row instead.
     race.append(info,make('b',{class:'count',text:'—'}));
     const row=make('div',{class:'path-racial-owner-row'},[race]);
     const captionHost=make('div',{class:'path-racial-owner-caption'},[caption]);
     api.editLabel(caption,key,ru,en);
     const pencil=make('button',{type:'button',class:'path-racial-pencil',
      text:'✎','aria-label':tr(api,'Изменить надпись: ','Edit caption: ')+value});
     const sync=()=>pencil.setAttribute('aria-label',
      tr(api,'Изменить надпись: ','Edit caption: ')+caption.textContent);
     pencil.addEventListener('focus',sync);
     pencil.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
     });
     row.append(captionHost,pencil);wrap.append(row);
    }else{
     info.append(caption);race.append(info,make('b',{class:'count',text:'—'}));
     wrap.append(race);
    }
   }
   for(const key of branchKeys){
    const points=M.potential(state,key),base=M.branchBase(innate,key),
     trained=M.branchMastery(state,key,innate,caps),cap=Math.min(90,api.cap(key)),
     level=M.branchPotential(state,key,innate,caps),isOpen=expandedBranch===key;
    const branch=make('button',{type:'button',disabled:cap===0&&points===0,
     class:'branch-row'+(isOpen?' active':'')+(cap===0?' disabled-branch':''),
     'aria-expanded':String(isOpen),'data-path-branch':key,
     onclick:()=>api.onExpand(key,isOpen)});
    const info=make('div');
    // Mastery is already displayed in its compact numeric input below the rail.
    // Duplicating it in the header adds/removes a whole line at zero -> one.

    const branchCount=make('b',{class:'count',
     text:cap>0?level+' / '+cap:points>0?points+' / 0':'—',
     'aria-label':tr(api,'Старт ','Innate ')+base+
      tr(api,', вложено ', ', invested ')+points+
      tr(api,', мастерство ', ', mastery ')+trained});
    info.append(make('strong',{text:api.branchName(key)}));
    branch.append(info,branchCount);wrap.append(branch);
    if(!isOpen)continue;
    const editor=make('div',{class:'inline-branch-editor'});
    const available=budget.total!==null&&api.allocationReady&&(cap>0||points>0);
    const track=make('div',{class:'inline-mastery-track path-integrated-track','aria-label':tr(api,'Единая полоса вложенных очков и освоенного мастерства ','Shared spent-points and trained-mastery bar: ')+api.branchName(key)});
    const visualMax=90; // fixed game-wide scale, never cap + budget
    const bed=make('div',{class:'inline-mastery-bed'}),gold=make('div',{class:'inline-mastery-fill'}),
          green=make('div',{class:'inline-mastery-green'}),
          locked=make('div',{class:'inline-mastery-locked',
           'aria-label':tr(api,'Предел профессии: ','Class branch limit: ')+cap+
            tr(api,' из ',' of ')+visualMax});
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
    const setPotentialEdge=()=>{
     locked.hidden=cap>=visualMax;
     locked.style.left=positionOnRail(Math.max(0,Math.min(1,cap/visualMax)));
     locked.setAttribute('aria-label',tr(api,'Предел профессии: ','Class limit: ')+cap);
    };
    setPotentialEdge();
    const currentNotch=make('span',{class:'path-current-notch','aria-hidden':'true'});
    const milestonesOnTrack=[];
    const paint=()=>{
     const invested=M.potential(state,key),level=M.branchPotential(state,key,innate,caps);
     const mastery=M.branchMastery(state,key,innate,caps);
     const goldFraction=Math.max(0,Math.min(1,level/visualMax));
     const greenFraction=Math.max(0,Math.min(1,mastery/visualMax));
     // Gold marks D + extra allocations, green marks actual learned
     // proficiency from zero. Class limit and scale remain fixed.
     gold.style.width=widthOnRail(goldFraction);
     green.style.width=widthOnRail(greenFraction);
     currentNotch.style.left=positionOnRail(goldFraction);
     setPotentialEdge();
     range.setAttribute('aria-valuetext',level+
      tr(api,' очков ветки, ',' branch points, ')+mastery+
      tr(api,' мастерство, ',' mastery, ')+invested+
      tr(api,' вложено сверх старта, предел ',' extra spent, limit ')+cap);
     for(const entry of milestonesOnTrack)
      entry.tick.classList.toggle('reached',
       !entry.locked&&entry.skills.some(skill=>readiness(skill,api,new Set(),skillIndex).learned));
    };
    track.append(bed,gold,green,locked);
    track.append(currentNotch);
    const range=make('input',{type:'range',min:'0',max:String(visualMax),step:'1',
     value:String(level),disabled:!available,
     'aria-label':tr(api,'Прокачка ветки ','Allocated branch level: ')+api.branchName(key),
     'data-branch-control':key+':potential-range'});
    track.append(range);paint();
    const numeric=make('input',{type:'number',min:'0',
     max:String(Math.max(points,Math.max(0,cap-base))),step:'1',
     value:String(points),class:'path-potential-number',disabled:!available,
     'aria-label':tr(api,'Точное количество вложенных очков ','Exact branch points: ')+api.branchName(key),
     'data-branch-control':key+':potential-number'});
    const restorePotential=()=>{
     const current=String(M.potential(state,key));
     range.value=String(M.branchPotential(state,key,innate,caps));numeric.value=current;
    };
    const update=(requested,final)=>{
     if(!Number.isInteger(requested)||requested<0){restorePotential();return}
     const target=api.onAllocate(key,requested,final);
     if(!Number.isInteger(target)){restorePotential();return}
     range.value=String(M.branchPotential(state,key,innate,caps));numeric.value=String(target);
     branchCount.textContent=cap>0?
      M.branchPotential(state,key,innate,caps)+' / '+cap:
      target>0?target+' / 0':'—';

     groupCount.textContent=groupSummary();
     input.value=String(M.branchMastery(state,key,innate,caps));
     input.max=String(M.branchPotential(state,key,innate,caps));
     const potentialCaption=editor.querySelector('.path-track-limit-value');
     if(potentialCaption)potentialCaption.textContent=tr(api,'Лимит (оч.): ','Limit (pts): ')+cap;
     paint();
     // Committing rebuilds the UI so all branch totals stay synchronized.
    };
    range.addEventListener('input',()=>update(Number(range.value)-base,false));
    range.addEventListener('change',()=>update(Number(range.value)-base,true));
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
      // Milestones require total branch points, whereas "Spent" shows
      // additional points after the class start. Keep their geometry shared.
      const neededInvestment=Math.max(0,threshold-base);
      const investmentHint=tr(api,'Начально (оч.): ','Initially (pts): ')+base+
       tr(api,' · Вложено (оч.): ',' · Invested (pts): ')+neededInvestment;
      const tick=make('span',{class:'path-unlock-notch'+
       (lockedAt?' unreachable':learned?' reached':'')+
       (threshold/visualMax<.26?' edge-left':threshold/visualMax>.74?' edge-right':''),
       'data-milestone-points':String(threshold),
       'data-milestone-invested':String(neededInvestment),tabindex:'0',
       'aria-label':threshold+tr(api,' оч. ветки. ',' branch pts. ')+
        investmentHint+'. '+skillsAt.map(skill=>skill.name).join(', ')});
      tick.style.left=(threshold/visualMax*100).toFixed(4)+'%';
      const preview=make('div',{class:'path-milestone-tooltip',role:'tooltip'});
      preview.append(
       make('strong',{text:threshold+tr(api,' оч. ветки',' branch pts')}),
       make('small',{class:'path-milestone-investment',text:investmentHint})
      );
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
        'aria-label':(skill.name||tr(api,'Умение','Skill'))+', '+mark.threshold+tr(api,' оч.',' pts'),
        onclick:()=>api.onSkill(skill)});
       const icon=api.icon(skill.branch,skill);
       if(icon){
        const img=make('img',{src:icon,alt:''});
        img.onerror=()=>img.remove();
        button.append(img);
       }
       const copy=make('span',{class:'path-unlock-copy'});
       copy.append(make('strong',{text:skill.name||tr(api,'Умение','Skill')}),
        make('small',{text:mark.threshold+tr(api,' оч.',' pts')+
         (mark.locked?tr(api,' · выше лимита',' · above limit'):gate.learned?tr(api,' · доступно',' · available'):'')}));
       button.append(copy);list.append(button);
      }
     }
     unlockDetails.append(list);
    }
    const input=make('input',{type:'number',min:'0',
     max:String(level),step:'1',
     value:String(trained),disabled:auto||!available,
     'aria-label':tr(api,'Мастерство ','Mastery: ')+api.branchName(key),
     'data-branch-control':key+':mastery-number'});
    input.addEventListener('change',()=>{
     const raw=input.value.trim(),requested=raw===''?0:Number(raw);
     if(!Number.isInteger(requested)||requested<0||
      !api.onMastery(key,requested))
      input.value=String(M.branchMastery(state,key,innate,caps));
    });
    const controls=make('div',{class:'path-point-controls'});
    const stepPotential=delta=>{
     const before=M.potential(state,key);
     update(before+delta,false);
     return M.potential(state,key)!==before;
    };
    const stepMastery=delta=>{
     if(state.masteryAuto!==false)return false;
     const before=M.branchMastery(state,key,innate,caps),next=before+delta;
     if(next<0||next>M.branchPotential(state,key,innate,caps)||
      !api.onMastery(key,next,false))return false;
     input.value=String(M.branchMastery(state,key,innate,caps));
     groupCount.textContent=groupSummary();paint();
     return M.branchMastery(state,key,innate,caps)!==before;
    };
    const pointField=(name,help,field,mastery=false)=>{
     const group=make('div',{class:'path-point-group'+(mastery?' path-point-mastery':'')});
     field.id='path-'+key+(mastery?'-mastery':'-invested');
     const title=make('label',{class:'path-point-name',for:field.id,text:name,
      tabindex:'0','data-help':help,'aria-label':name+'. '+help});
     const stepper=make('div',{class:'path-point-stepper'});
     const minus=make('button',{type:'button',class:'path-point-step path-point-decrement',
      text:'−',disabled:field.disabled,
      'aria-label':tr(api,'Уменьшить ','Decrease ')+name+
       tr(api,' на один',' by one')});
     const plus=make('button',{type:'button',class:'path-point-step path-point-increment',
      text:'+',disabled:field.disabled,
      'aria-label':tr(api,'Увеличить ','Increase ')+name+
       tr(api,' на один',' by one')});
     const step=mastery?stepMastery:stepPotential;
     const commit=mastery?
      ()=>api.onMastery(key,M.branchMastery(state,key,innate,caps),true):
      ()=>update(M.potential(state,key),true);
     bindPathHoldStep(minus,()=>step(-1),commit,api);
     bindPathHoldStep(plus,()=>step(1),commit,api);
     stepper.append(minus,field,plus);group.append(title,stepper);
     return group;
    };
    controls.append(
     pointField(root.PandoraUILocale?.text('exactPoints',api.lang)||tr(api,'Вложено','Spent'),
      tr(api,'Очки умений, распределяемые при развитии персонажа.','Skill points allocated as the character develops.'),numeric),
     pointField(root.PandoraUILocale?.text('greenMastery',api.lang)||tr(api,'Мастерство','Mastery'),
      tr(api,'Растёт при использовании умений этой ветки, а также соответствующих типов атак или оружия.','Increases when using this branch’s skills or its corresponding attack or weapon types.'),input,true)
    );
    const legend=make('div',{class:'path-track-legend','aria-hidden':'true'},[
     make('span',{text:'0'}),
     make('span',{class:'path-track-limit'},[
      make('span',{class:'path-track-limit-value',text:api.lang==='en'?
       'Limit (pts): '+cap:'Лимит (оч.): '+cap}),
      ...(base>0?[make('span',{class:'path-innate-baseline',
       text:tr(api,'Начально (оч.): ','Initially (pts): ')+base,
       'aria-label':tr(api,'Начальная прокачка класса: ','Starting branch points: ')+base})]:[])
     ]),
     make('span',{text:String(visualMax)})
    ]);
    editor.append(track,legend);
    if(unlockDetails)editor.append(unlockDetails);
    editor.append(controls);
    if(!available){
     const copy=!api.allocationReady?
      ['pathPointsLoading','Загружаются таблицы очков и лимитов класса.','Loading class point and limit tables…']:
      cap===0?
      ['pathBranchCapZero','Для этой профессии ветка заблокирована (лимит 0).','This class cannot train this branch (limit 0).']:
      ['pathPointsUnavailable','Недостаточно доступных очков.','Not enough available points.'];
     editor.append(authored(api,...copy));
    }
    if(points>0&&cap===0)editor.append(authored(api,'pathPointsPreserved',
     'Ветка недоступна для текущей профессии. Прежние вложения сохранены и могут быть возвращены.',
     'Branch unavailable to this class. Old allocations are preserved and can be refunded.',
     'p','budget-excess'));
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
 if(!api.catalogReady){
  target.append(authored(api,'skillCatalogLoading','Каталог умений загружается.','Loading skill catalog…'));return
 }
 const skillIndex=indexSkills(api.skillCatalog);
 const rows=api.skillCatalog.filter(skill=>allowedForJob(skill,api.job)&&
  matchesSkillSearch(typeof api.skillSearchText==='function'?
   api.skillSearchText(skill):String(skill.name||'')+' '+String(skill.id??''),api.query))
  .map(skill=>({skill,gate:readiness(skill,api,new Set(),skillIndex)})).filter(({gate})=>
   api.filter==='all'||(api.filter==='known'?gate.learned:!gate.learned));
 rows.sort((a,b)=>Number(b.gate.learned)-Number(a.gate.learned)||
  String(a.skill.name||'').localeCompare(String(b.skill.name||''),'ru'));
 target.append(make('p',{class:'path-skill-count',text:skillCountLabel(rows.length,api.lang)}));
 const grid=make('div',{class:'path-skill-grid'});
 for(const {skill,gate}of rows.slice(0,api.shown||24)){
  const item=make('button',{type:'button',class:'path-skill-card'+(gate.learned?' learned':' locked')+
    (String(api.selectedSkill?.id)===String(skill.id)?' active':''),
      'aria-label':(skill.name||tr(api,'Умение без названия','Unnamed skill'))+' · '+(gate.learned?tr(api,'доступно','available'):tr(api,'недоступно','unavailable')),
   'data-skill-id':String(skill.id),onclick:()=>api.onInspect(skill)});
  const src=api.icon(skill.branch,skill);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));item.append(img)}
  else item.append(make('span',{text:'✦'}));
  item.append(make('span',{text:skill.name||tr(api,'Умение без названия','Unnamed skill')}));
  grid.append(item);api.hover(item,skill);
 }
 target.append(grid);grid.scrollTop=previousScroll;
 if(rows.length>(api.shown||24)){
  const ru='Показать ещё',en='Show more',key='skillShowMore';
  const title=api.copyLabel?.(key,ru,en)||tr(api,ru,en);
  const caption=make('span',{class:'path-more-copy',text:title});
  const remain=make('span',{class:'path-more-count',text:' ('+
   (rows.length-(api.shown||24))+')'});
  const showMore=make('button',{type:'button',class:'path-show-more',
   onclick:event=>{
    // Never load more game records when an owner finishes editing a caption.
    if(event?.target?.closest?.('.wiki-inline-input'))return;
    api.onMoreSkills();
   }},[caption,remain]);
  if(api.canEdit&&typeof api.editLabel==='function'){
   const row=make('div',{class:'path-more-owner-row'},[showMore]);
   const pencil=make('button',{type:'button',class:'path-more-pencil',
    text:'✎','aria-label':tr(api,'Изменить надпись: ','Edit caption: ')+title});
   const sync=()=>pencil.setAttribute('aria-label',
    tr(api,'Изменить надпись: ','Edit caption: ')+caption.textContent);
   api.editLabel(caption,key,ru,en,{onCommitted:sync});
   pencil.addEventListener('focus',sync);
   pencil.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   });
   row.append(pencil);target.append(row);
  }else target.append(showMore);
 }
 if(!rows.length)target.append(authored(api,'skillSearchEmpty',
  'По этим параметрам навыки не найдены.','No skills match these filters.'));
 const selected=api.selectedSkill?rows.find(row=>String(row.skill.id)===String(api.selectedSkill.id)):null;
 if(selected){details.hidden=false;
  const skill=selected.skill,gate=selected.gate;
  details.append(make('h3',{text:skill.name||tr(api,'Умение без названия','Unnamed skill')}),
   skill.desc?make('p',{text:skill.desc}):
    authored(api,'skillDescriptionUnavailable','Описание умения отсутствует.',
     'Skill description unavailable.'),
   gate.learned?
    authored(api,'skillReady','✓ Условия выполнены','✓ Requirements met',
     'p','path-skill-yes'):
    make('p',{class:'path-skill-no',text:'🔒 '+gate.problems.join(' · ')}));
  const stats=make('dl',{class:'path-skill-metadata'});
  const field=(key,ru,en,value)=>{
   if(value===null||value===undefined||value==='')return;
   const label=authored(api,key,ru,en,'dt','path-skill-meta-label');
   stats.append(label,make('dd',{text:String(value)}));
  };
  // A verified zero means no character-level threshold, not an unknown one.
  // Branch thresholds remain visible separately below.
  if(skill.charLevel!==0&&skill.charLevel!==undefined&&skill.charLevel!==null)
   field('skillCharacterLevel','Уровень персонажа','Character level',skill.charLevel);
  field('skillMana','Мана / ОМ','Mana / MP',skill.mana);
  field('skillCast','Подготовка','Cast time',skill.cast);
  field('skillCooldown','Перезарядка','Cooldown',skill.cooldown);
  field('skillRange','Дальность','Range',skill.rangeFromWeapon?tr(api,'Зависит от оружия','Depends on weapon'):skill.range);
  field('skillElement','Стихия','Element',elementLabel(skill.element,api));
  if(skill.powerStat!==undefined&&skill.powerStat!==null&&skill.powerStat!=='')
   field('skillAttribute','Характеристика','Attribute',
    typeof api.attributeLabel==='function'?api.attributeLabel(skill.powerStat):
     tr(api,'Неизвестная характеристика','Unknown attribute'));
   details.append(stats);
  const requirements=Array.isArray(skill.reqs)?skill.reqs:[];
  if(requirements.length){
   const reqList=make('div',{class:'path-skill-prereqs'});
   reqList.append(authored(api,'skillRequirementsHeading','Требования по веткам','Branch requirements','strong','path-skill-requirements-title'));
   for(const req of requirements){
    if(!req||!req.branch)continue;
    const base=M.branchBase(api.innate,req.branch);
    const value=M.branchPotential(api.state,req.branch,api.innate,api.branchCaps);
    const green=M.branchMastery(api.state,req.branch,api.innate,api.branchCaps);
    reqList.append(make('p',{text:api.branchName(req.branch)+tr(api,' · порог ',' · threshold ')+req.amount+
     tr(api,' · старт ',' · innate ')+base+
     tr(api,' · доступно ',' · potential ')+value+
     tr(api,' · освоено ',' · trained ')+green}));
   }
   details.append(reqList);
  }
  if(skill.prereq){
   const before=skillIndex.get(String(skill.prereq));
   const title=authored(api,'skillPreviousLabel','Предыдущее умение',
    'Previous skill','span','path-skill-previous-label');
   const current=make('span',{class:'path-skill-previous-value',
    text:before?.name||tr(api,'Умение отсутствует в каталоге','Skill not in catalog')});
   // The editable caption never contains a source skill name or ID.
   const row=make('p',{class:'path-skill-prereqs path-skill-previous-row'});
   row.append(title,make('span',{class:'path-skill-previous-separator',text:': '}),current);
   details.append(row);
  }
  // Raw effect codes remain in the encyclopedia, not the quick skill card.
  if(typeof api.skillWiki==='function')details.append(api.skillWiki(skill));
 }
}
root.PandoraHeroPath=Object.freeze({viewGrowth,viewSkills,readiness,skillCountLabel});
})(typeof window==='undefined'?globalThis:window);
