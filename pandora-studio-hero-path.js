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
const matchesSkillSearch=(label,query)=>
 root.PandoraSearchField.matches(label,query);
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
 // Hero Path uses the same compact SVG edit and paging affordances.
 const controlIcon=tag==='button'&&!children.length?
  ({'✎':'edit','←':'arrow-left','→':'arrow-right'}[attr.text]):null;
 if(controlIcon){
  const icon=root.PandoraStudioIcons?.create(controlIcon);
  if(icon)e.replaceChildren(icon);
 }
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
 const node=make(tag,{class:cls,text:value});
 if(api.canEdit&&typeof api.editLabel==='function')
  api.editLabel(node,key,ru,en);
 return node;
};
// For disclosure/navigation buttons in owner mode, distinguish a real double
// click on the caption from a single click that opens the section.
const guardCaptionAction=(button,caption)=>{
 if(!button||!caption)return;
 let pending=null;
 button.addEventListener('click',event=>{
  if(!event.detail||!caption.contains(event.target)||
     event.target.closest?.('input,textarea,select'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(pending){clearTimeout(pending);pending=null;return}
  pending=setTimeout(()=>{pending=null;if(button.isConnected&&!button.disabled)
   button.click()},500);
 },true);
};
// Bind only author-written copy. Game levels and skill names are immutable
// suffixes, never sent to the owner D1 string editor.
const bindPathCopy=(api,node,key,ru,en,attribute='text',suffix='',prefix='')=>{
 if(typeof api.bindCopy==='function')
  api.bindCopy(node,key,ru,en,attribute,suffix,prefix);
 else{
  const value=prefix+(api.copyLabel?.(key,ru,en)||tr(api,ru,en))+suffix;
  if(attribute==='text')node.textContent=value;
  else node.setAttribute(attribute,value);
 }
 return node;
};
function requirementRow(api,name,metrics){
 const row=make('p',{class:'path-skill-requirement-row'});
 row.append(make('span',{class:'path-requirement-name',text:name}));
 for(const [key,ru,en,value] of metrics){
  const caption=make('span',{class:'path-requirement-caption'});
  bindPathCopy(api,caption,key,ru,en,'text',' ',' · ');
  row.append(caption,make('span',{class:'path-requirement-value',text:String(value)}));
 }
 return row;
}
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
 bindPathCopy(api,button,'pathHoldRepeatAria',
  'Нажмите, чтобы изменить на 1; удерживайте для повторения.',
  'Click to change by 1; hold to repeat.','aria-description');
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
  // The MELEE parent uses trained proficiency across five child branches,
  // rather than allocated points in the non-allocatable martial branch.
  if(req.branch==='martial'&&skill.branchRaw==='MELEE'){
   const name=api.branchName('melee'),cap=M.meleeGroupCap(api.branchCaps);
   const trained=M.meleeGroupTrained(state,api.innate,api.branchCaps);
   if(cap<need)problems.push(name+tr(api,
    ': предел профессии ',': class maximum ')+cap+'/'+need);
   if(trained<need)problems.push(name+tr(api,
    ': освоено ',': trained ')+trained+'/'+need);
   continue;
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
// A linked 50-level version is the same skill family in the character
// planner, never a second simultaneous skill effect. A level threshold alone
// is insufficient: check class, learned branch and complete source lineage.
function effectiveSkillCatalog(skills,api){
 const source=Array.isArray(skills)?skills:[];
 const index=indexSkills(source),hidden=new Set(),aliases=new Map(),upgrades=new Map();
 for(const advanced of source){
  if(!advanced||advanced.prereq==null||advanced.learnable!==true||
     Number(advanced.charLevel)!==50)continue;
  const base=index.get(String(advanced.prereq));
  if(!base||Number(base.charLevel)>=50||base.branch!==advanced.branch||
     typeof base.name!=='string'||base.name!==advanced.name||
     !allowedForJob(base,api.job))continue;
  if(!allowedForJob(advanced,api.job)){
   hidden.add(String(advanced.id));continue;
  }
  upgrades.set(String(base.id),advanced);
  if(readiness(advanced,api,new Set(),index).learned){
   hidden.add(String(base.id));aliases.set(String(base.id),String(advanced.id));
  }else{
   hidden.add(String(advanced.id));aliases.set(String(advanced.id),String(base.id));
  }
 }
 return {skills:source.filter(skill=>!hidden.has(String(skill?.id))),
  aliases,upgrades};
}

// A skill belongs in the Hero Path gallery only when this class could
// eventually learn it. Current shortages (level/allocated points) do not
// hide it; permanent blockers do. The Encyclopedia remains comprehensive.
// Validate the full predecessor chain without relying on current allocation.
function futureSkillReachable(skill,api,skillIndex=indexSkills(api.skillCatalog)){
 const caps=api.branchCaps||{},innate=api.innate||{};
 const needs=new Map(),chain=new Set();
 let meleeNeed=0;
 const maxLevel=Number.isInteger(api.maxLevel)?api.maxLevel:55;
 const capFor=branch=>{
  const explicit=M.classLimit(branch,caps);
  const other=typeof api.cap==='function'?api.cap(branch):null;
  return explicit===null&&Number.isInteger(other)?Math.min(90,other):explicit;
 };
 const visit=current=>{
  if(!current||current.id==null||!allowedForJob(current,api.job)||
     current.learnable!==true)return false;
  const id=String(current.id);
  if(chain.has(id))return false;
  chain.add(id);
  if(current.charLevel!==undefined&&(!validSourceLevel(current.charLevel)||
     Number(current.charLevel)>maxLevel))return false;
  if(current.reqLevel!==undefined&&!validSourceLevel(current.reqLevel))return false;
  if(current.reqs!==undefined&&!Array.isArray(current.reqs))return false;
  const reqs=Array.isArray(current.reqs)?current.reqs:[];
  if(Number(current.reqLevel)>0&&!reqs.length)return false;
  for(const req of reqs){
   if(!req||typeof req.branch!=='string'||!req.branch.trim()||
      !validSourceLevel(req.amount)||Number(req.amount)<1)return false;
   const threshold=Number(req.amount);
   if(req.branch==='martial'&&current.branchRaw==='MELEE'){
    if(M.meleeGroupCap(caps)<threshold)return false;
    meleeNeed=Math.max(meleeNeed,threshold);
    continue;
   }
   const cap=capFor(req.branch);
   if(!Number.isInteger(cap)||cap<threshold)return false;
   needs.set(req.branch,Math.max(needs.get(req.branch)||0,threshold));
  }
  if(current.prereq!=null&&String(current.prereq).trim()){
   const prior=skillIndex.get(String(current.prereq));
   if(!prior||!visit(prior))return false;
  }
  return true;
 };
 if(!visit(skill))return false;
 const budget=api.maxSkillPoints;
 if(Number.isInteger(budget)&&budget>=0){
  let minimum=0,meleeCommitted=0,meleeInitial=0;
  for(const [branch,need] of needs){
   const innatePoints=M.branchBase(innate,branch);
   const additional=Math.max(0,need-innatePoints);
   minimum+=additional;
   if(M.MELEE.includes(branch))meleeCommitted+=need;
  }
  if(meleeNeed){
   meleeInitial=M.MELEE.reduce((sum,key)=>sum+
    Math.min(capFor(key)||0,M.branchBase(innate,key)),0);
   // Training green cannot exceed allocated potential. Account for branch
   // requirements already spending part of the group capacity.
   minimum+=Math.max(0,meleeNeed-Math.max(meleeCommitted,meleeInitial));
  }
  if(minimum>budget)return false;
 }
 return true;
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
 const skillIndex=indexSkills(skillCatalog),skillsByBranch=indexSkillsByBranch(effectiveSkillCatalog(skillCatalog,api).skills,job);
 for(const group of groups){
  const branchKeys=group.branches.filter(key=>key!=='race');
  const wrap=make('section',{class:'game-tree-group'});
  const head=make('div',{class:'game-tree-head-row'});
  const groupButton=make('button',{type:'button',class:'game-tree-head'+(selectedGroup===group.id?' active':''),
   'aria-expanded':String(selectedGroup===group.id),'data-path-group':group.id,
   onclick:()=>api.onGroup(group.id)});
  // Game totals are immutable spans; never overwrite live D1 captions when
  // a slider or mastery control changes only its numerical values.
  const groupCount=make('small',{class:'path-group-summary'}),groupValues=[];
  for(const [copyKey,ru,en] of [
   ['pathGroupTrained','освоено','trained'],
   ['pathGroupLearned','изучено','learned'],
   ['pathGroupInvested','вложено','invested']
  ]){
   const caption=make('span',{class:'path-group-summary-copy'});
   bindPathCopy(api,caption,copyKey,ru,en,'text',' ',
    groupValues.length?' · ':'');
   const value=make('span',{class:'path-group-summary-value'});
   groupCount.append(caption,value);groupValues.push(value);
  }
  const refreshGroupSummary=()=>{
   groupValues[0].textContent=String(branchKeys.reduce((total,key)=>total+M.branchMastery(state,key,innate,caps),0));
   groupValues[1].textContent=String(branchKeys.reduce((total,key)=>total+M.branchPotential(state,key,innate,caps),0));
   groupValues[2].textContent=String(branchKeys.reduce((total,key)=>total+M.potential(state,key),0));
  };
  refreshGroupSummary();
  const captionKey='group.'+group.id;
  const name=api.copyLabel?.(captionKey,group.ru,group.en)||
   (api.lang==='en'?group.en:group.ru);
  const caption=make('strong',{text:name});
  api.editLabel?.(caption,captionKey,group.ru,group.en);
  if(api.canEdit)guardCaptionAction(groupButton,caption);
  groupButton.append(caption,groupCount);
  head.append(groupButton);
  wrap.append(head);
  if(selectedGroup===group.id){
   // The game client also shows the Racial line under Special, greyed out.
   // Race passives are chosen in Origin and do not spend branch skill points.
   if(group.branches.includes('race')){
    const race=make('button',{type:'button',disabled:true,
     class:'branch-row disabled-branch path-racial-unavailable',
     'data-path-branch':'race',
     'aria-label':tr(api,'Расовые навыки: не прокачиваются очками веток','Racial skills: no branch point allocation')});
     bindPathCopy(api,race,'racialUnavailableAria',
      'Расовые навыки: не прокачиваются очками веток',
      'Racial skills: no branch point allocation','aria-label');
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
     row.append(captionHost);wrap.append(row);
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
    bindPathCopy(api,track,'branchTrackAria',
     'Единая полоса вложенных очков и освоенного мастерства',
     'Shared spent-points and trained-mastery bar:','aria-label',' '+api.branchName(key));
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
    bindPathCopy(api,range,'pathRangeAria','Прокачка ветки',
     'Allocated branch level:','aria-label',' '+api.branchName(key));
    track.append(range);paint();
    const numeric=make('input',{type:'number',min:'0',
     max:String(Math.max(points,Math.max(0,cap-base))),step:'1',
     value:String(points),class:'path-potential-number',disabled:!available,
     'aria-label':tr(api,'Точное количество вложенных очков ','Exact branch points: ')+api.branchName(key),
     'data-branch-control':key+':potential-number'});
    bindPathCopy(api,numeric,'pathExactAria','Точное количество вложенных очков',
     'Exact branch points:','aria-label',' '+api.branchName(key));
    const restorePotential=()=>{
     const current=String(M.potential(state,key));
     range.value=String(M.branchPotential(state,key,innate,caps));numeric.value=current;
     root.PandoraNonCredentialGuard?.sync(numeric);
    };
    const update=(requested,final)=>{
     if(!Number.isInteger(requested)||requested<0){restorePotential();return}
     const target=api.onAllocate(key,requested,final);
     if(!Number.isInteger(target)){restorePotential();return}
     range.value=String(M.branchPotential(state,key,innate,caps));numeric.value=String(target);
     root.PandoraNonCredentialGuard?.sync(numeric);
     branchCount.textContent=cap>0?
      M.branchPotential(state,key,innate,caps)+' / '+cap:
      target>0?target+' / 0':'—';

     refreshGroupSummary();
     input.value=String(M.branchMastery(state,key,innate,caps));
     root.PandoraNonCredentialGuard?.sync(input);
     input.max=String(M.branchPotential(state,key,innate,caps));
     // The class limit is constant while dragging; preserve its D1 caption.
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
       info.append(make('b',{text:skill.name||tr(api,'Умение','Skill')}));
       if(skill.desc)info.append(make('small',{text:skill.desc}));
       else{
        const absent=make('small');
        bindPathCopy(api,absent,'pathMilestoneNoDesc','Описание отсутствует.','No description available.');
        info.append(absent);
       }
       if(Number.isFinite(skill.mana)&&skill.mana>=0){
        const cost=make('small',{class:'path-milestone-cost'}),label=make('span');
        bindPathCopy(api,label,'pathMilestoneMana','Затрат ОМ:','MP cost:','text',' ');
        cost.append(label,make('span',{text:String(skill.mana)}));
        info.append(cost);
       }
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
        onclick:()=>api.onSkill(skill)});
       bindPathCopy(api,button,'pathUnlockPoints','оч.','pts','aria-label','',
        (skill.name||tr(api,'Умение','Skill'))+', '+mark.threshold+' ');
       const icon=api.icon(skill.branch,skill);
       if(icon){
        const img=make('img',{src:icon,alt:''});
        img.onerror=()=>img.remove();
        button.append(img);
       }
       const copy=make('span',{class:'path-unlock-copy'});
       const status=make('small',{class:'path-unlock-status'});
       status.append(make('span',{text:String(mark.threshold)}));
       const unit=make('span');
       bindPathCopy(api,unit,'pathUnlockPoints','оч.','pts','text','',' ');
       status.append(unit);
       if(mark.locked||gate.learned){
        const word=make('span');
        bindPathCopy(api,word,mark.locked?'pathUnlockOverCap':'pathUnlockReady',
         mark.locked?'выше лимита':'доступно',
         mark.locked?'above limit':'available','text','',' · ');
        status.append(word);
       }
       copy.append(make('strong',{text:skill.name||tr(api,'Умение','Skill')}),status);
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
    bindPathCopy(api,input,'pathMasteryAria','Мастерство',
     'Mastery:','aria-label',' '+api.branchName(key));
    input.addEventListener('change',()=>{
     const raw=input.value.trim(),requested=raw===''?0:Number(raw);
     if(!Number.isInteger(requested)||requested<0||
      !api.onMastery(key,requested))
      input.value=String(M.branchMastery(state,key,innate,caps));
      root.PandoraNonCredentialGuard?.sync(input);
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
     root.PandoraNonCredentialGuard?.sync(input);
     refreshGroupSummary();paint();
     return M.branchMastery(state,key,innate,caps)!==before;
    };
    const pointField=(name,helpKey,ruHelp,enHelp,field,mastery=false)=>{
     const group=make('div',{class:'path-point-group'+(mastery?' path-point-mastery':'')});
     field.id='path-'+key+(mastery?'-mastery':'-invested');
     const help=api.copyLabel?.(helpKey,ruHelp,enHelp)||tr(api,ruHelp,enHelp);
     const title=make('label',{class:'path-point-name',for:field.id,text:name,
      tabindex:'0','data-help':help,'aria-label':name+'. '+help});
     bindPathCopy(api,title,helpKey,ruHelp,enHelp,'data-help');
     bindPathCopy(api,title,helpKey,ruHelp,enHelp,'aria-label','',name+'. ');
     const stepper=make('div',{class:'path-point-stepper'});
     const minus=make('button',{type:'button',class:'path-point-step path-point-decrement',
      text:'−',disabled:field.disabled,
      'aria-label':tr(api,'Уменьшить ','Decrease ')+name+
       tr(api,' на один',' by one')});
     const plus=make('button',{type:'button',class:'path-point-step path-point-increment',
      text:'+',disabled:field.disabled,
      'aria-label':tr(api,'Увеличить ','Increase ')+name+
       tr(api,' на один',' by one')});
     // Only authorial action copy is D1-editable; preserve live field labels.
    bindPathCopy(api,minus,'pathDecreaseAria','Уменьшить ','Decrease ',
     'aria-label',name+tr(api,' на один',' by one'));
    bindPathCopy(api,plus,'pathIncreaseAria','Увеличить ','Increase ',
     'aria-label',name+tr(api,' на один',' by one'));
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
      'branchPointHelp','Очки умений, распределяемые при развитии персонажа.',
      'Skill points allocated as the character develops.',numeric),
     pointField(root.PandoraUILocale?.text('greenMastery',api.lang)||tr(api,'Мастерство','Mastery'),
      'greenMasteryHelp','Растёт при использовании умений этой ветки, а также соответствующих типов атак или оружия.',
      'Increases when using this branch’s skills or its corresponding attack or weapon types.',input,true)
    );
    // The owner edits captions, not the source-backed branch limit or
    // starting points. Reuse existing bilingual D1 keys when available.
    const baseline=base>0?make('span',{class:'path-innate-baseline'},[
     authored(api,'innateBaselineLabel','Начально (оч.):',
      'Initially (pts):','span','path-innate-copy'),
     make('span',{class:'path-innate-value',text:' '+String(base)})]):null;
    if(baseline)bindPathCopy(api,baseline,'innateBaselineAria',
     'Начальная прокачка класса:','Starting branch points:','aria-label',' '+String(base));
    const limitCaption=make('span',{class:'path-track-limit-value'},[
     authored(api,'pathLimitPoints','Лимит (оч.):',
      'Limit (pts):','span','path-limit-copy'),
     make('span',{class:'path-limit-number',text:' '+String(cap)})
    ]);
    // Focusable owner captions must not live inside an aria-hidden subtree.
    const legend=make('div',{class:'path-track-legend',
     'aria-hidden':api.canEdit?null:'true'},[
     make('span',{text:'0'}),
     make('span',{class:'path-track-limit'},[limitCaption,...(baseline?[baseline]:[])]),
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
 const effective=effectiveSkillCatalog(api.skillCatalog,api);
 const ordered=effective.skills.filter(skill=>futureSkillReachable(skill,api,skillIndex)&&
  matchesSkillSearch(typeof api.skillSearchText==='function'?
   api.skillSearchText(skill):String(skill.name||'')+' '+String(skill.id??''),api.query))
  .map(skill=>({skill,gate:readiness(skill,api,new Set(),skillIndex)})).filter(({gate})=>
   api.filter==='all'||(api.filter==='known'?gate.learned:!gate.learned));
 // Stable order for browsing matches. Pinning the inspected skill changes
 // card placement only, never what "previous/next in results" means.
 ordered.sort((a,b)=>Number(b.gate.learned)-Number(a.gate.learned)||
  String(a.skill.name||'').localeCompare(String(b.skill.name||''),'ru'));
 const rawSelectedId=api.selectedSkill?.id==null?'':String(api.selectedSkill.id);
 const selectedId=effective.aliases.get(rawSelectedId)||rawSelectedId;
 const rows=[...ordered];
 rows.sort((a,b)=>Number(String(b.skill.id)===selectedId)-
  Number(String(a.skill.id)===selectedId));
 // Runtime count is never submitted to owner D1 copy.
  const countForm=api.lang==='en'?(rows.length===1?'one':'many'):
   new Intl.PluralRules('ru').select(rows.length);
  const countCopy=countForm==='one'?['skillCountOne','умение','skill']:
   countForm==='few'?['skillCountFew','умения','skills']:
   ['skillCountMany','умений','skills'];
  target.append(make('p',{class:'path-skill-count'},[
   make('span',{class:'path-skill-count-value',text:String(rows.length)+' '}),
   authored(api,...countCopy,'span','path-skill-count-caption')
  ]));
 const grid=make('div',{class:'path-skill-grid'});
 for(const {skill,gate}of rows.slice(0,api.shown||24)){
  const item=make('button',{type:'button',class:'path-skill-card'+(gate.learned?' learned':' locked')+
    (selectedId===String(skill.id)?' active':''),
      'aria-label':(skill.name||tr(api,'Умение без названия','Unnamed skill'))+' · '+(gate.learned?tr(api,'доступно','available'):tr(api,'недоступно','unavailable')),
   'data-skill-id':String(skill.id),
   'aria-current':String(skill.id)===selectedId?'true':'false',
   onclick:()=>api.onInspect(skill)});
  const src=api.icon(skill.branch,skill);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));item.append(img)}
  else item.append(make('span',{text:'✦'}));
  item.append(make('span',{text:skill.name||tr(api,'Умение без названия','Unnamed skill')}));
  grid.append(item);api.hover(item,skill);
 }
 target.append(grid);
 // Preserve scroll while editing the same skill, but reveal a newly
 // selected skill at the top instead of leaving it outside the scroller.
 const changedSelection=target.dataset.selectedSkillId!==selectedId;
 if(changedSelection)grid.scrollTop=0;
 else grid.scrollTop=previousScroll;
 target.dataset.selectedSkillId=selectedId;
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
   api.editLabel(caption,key,ru,en);
   guardCaptionAction(showMore,caption);
   target.append(showMore);
  }else target.append(showMore);
 }
 if(!rows.length)target.append(authored(api,'skillSearchEmpty',
  'По этим параметрам навыки не найдены.','No skills match these filters.'));
 const selected=api.selectedSkill?rows.find(row=>String(row.skill.id)===selectedId):null;
 if(selected){details.hidden=false;
  const skill=selected.skill,gate=selected.gate;
  details.append(make('h3',{text:skill.name||tr(api,'Умение без названия','Unnamed skill')}));
  const listIndex=ordered.findIndex(row=>String(row.skill.id)===selectedId);
  if(listIndex>=0&&ordered.length>1&&typeof api.onInspect==='function'){
   const listNav=make('nav',{class:'path-skill-list-nav',
    'aria-label':tr(api,'Навигация по найденным умениям','Browse matching skills')});
   bindPathCopy(api,listNav,'skillBrowseAria','Навигация по найденным умениям',
    'Browse matching skills','aria-label');
   const move=(delta,icon,ru,en)=>{
    const next=ordered[listIndex+delta]?.skill;
    const label=tr(api,ru,en)+(next?' '+next.name:'');
    const button=make('button',{type:'button',class:'path-skill-list-step',
      'data-skill-list-direction':delta<0?'previous':'next',
      'aria-label':label,title:next?.name||null,
      disabled:!next,text:icon,
      onclick:()=>{if(next)api.onInspect(next,{pagerDirection:delta<0?'previous':'next'})}});
     // Skill names are current catalog data, not owner-edited descriptions.
     return bindPathCopy(api,button,delta<0?'skillListPreviousAria':'skillListNextAria',
      ru,en,'aria-label',next?' '+next.name:'');
   };
   listNav.append(move(-1,'←','Предыдущее в списке:','Previous in list:'),
    make('span',{class:'path-skill-list-position',text:
     tr(api,(listIndex+1)+' из '+ordered.length,(listIndex+1)+' / '+ordered.length)}),
    move(1,'→','Следующее в списке:','Next in list:'));
   details.append(listNav);
  }
  details.append(skill.desc?make('p',{text:skill.desc}):
    authored(api,'skillDescriptionUnavailable','Описание умения отсутствует.',
     'Skill description unavailable.'),
   gate.learned?
    authored(api,'skillReady','✓ Условия выполнены','✓ Requirements met',
     'p','path-skill-yes'):
    make('p',{class:'path-skill-no',text:'🔒 '+gate.problems.join(' · ')}));
  const stats=make('dl',{class:'path-skill-metadata'});
  const field=(key,ru,en,value,valueCopy=null)=>{
   if(value===null||value===undefined||value==='')return;
   const label=authored(api,key,ru,en,'dt','path-skill-meta-label');
   const dd=make('dd',{text:String(value)});
   if(valueCopy)bindPathCopy(api,dd,...valueCopy);
   stats.append(label,dd);
  };
  // A verified zero means no character-level threshold, not an unknown one.
  // Branch thresholds remain visible separately below.
  if(skill.charLevel!==0&&skill.charLevel!==undefined&&skill.charLevel!==null)
   field('skillCharacterLevel','Уровень персонажа','Character level',skill.charLevel);
  field('skillMana','Мана / ОМ','Mana / MP',skill.mana);
  field('skillCast','Подготовка','Cast time',skill.cast);
  field('skillCooldown','Перезарядка','Cooldown',skill.cooldown);
  field('skillRange','Дальность','Range',
   skill.rangeFromWeapon?tr(api,'Зависит от оружия','Depends on weapon'):skill.range,
   skill.rangeFromWeapon?['skillWeaponRange','Зависит от оружия','Depends on weapon']:null);
  field('skillElement','Стихия','Element',elementLabel(skill.element,api));
  if(skill.powerStat!==undefined&&skill.powerStat!==null&&skill.powerStat!=='')
   field('skillAttribute','Характеристика','Attribute',
    typeof api.attributeLabel==='function'?api.attributeLabel(skill.powerStat):
     tr(api,'Неизвестная характеристика','Unknown attribute'));
   details.append(stats);
  const nextVersion=effective.upgrades.get(String(skill.id));
  const previousVersion=skill.prereq==null?null:
   skillIndex.get(String(skill.prereq));
  const isUpgrade=Number(skill.charLevel)===50&&
   previousVersion?.name===skill.name&&
   previousVersion?.branch===skill.branch;
  if(nextVersion||isUpgrade){
   const oldSkill=isUpgrade?previousVersion:skill;
   const newSkill=isUpgrade?skill:nextVersion;
   const oldCast=Number(oldSkill?.cast),newCast=Number(newSkill?.cast);
   const hasTiming=Number.isFinite(oldCast)&&Number.isFinite(newCast)&&
    oldCast!==newCast;
   // Verified levels and cast values are separate immutable nodes.
    const before=isUpgrade?
     ['skillUpgradeCurrentBefore','Улучшенная версия с ','Improved version from level ']:
     ['skillUpgradeFutureBefore','С ','An improved version becomes available from level '];
    const after=isUpgrade?
     ['skillUpgradeCurrentAfter','-го уровня для подходящей профессии.',' for an eligible class.']:
     ['skillUpgradeFutureAfter','-го уровня для подходящей профессии доступна улучшенная версия.',' for an eligible class.'];
    const note=make('p',{class:'path-skill-version-note'},[
     authored(api,...before,'span','path-version-copy'),
     make('span',{class:'path-version-level',text:'50'}),
     authored(api,...after,'span','path-version-copy')
    ]);
    if(hasTiming)note.append(
     authored(api,'skillUpgradeCastBefore',' Подготовка: ',' Cast time: ','span','path-version-copy'),
     make('span',{class:'path-version-timing',text:String(oldCast)+' → '+String(newCast)}),
     authored(api,'skillUpgradeCastAfter',' с.',' s.','span','path-version-copy')
    );
    details.append(note);
  }
  const requirements=Array.isArray(skill.reqs)?skill.reqs:[];
  if(requirements.length){
   const reqList=make('div',{class:'path-skill-prereqs'});
   reqList.append(authored(api,'skillRequirementsHeading','Требования по веткам','Branch requirements','strong','path-skill-requirements-title'));
   for(const req of requirements){
    if(!req||!req.branch)continue;
    if(req.branch==='martial'&&skill.branchRaw==='MELEE'){
     const cap=M.meleeGroupCap(api.branchCaps);
     const available=M.MELEE.reduce((sum,key)=>sum+
      M.branchPotential(api.state,key,api.innate,api.branchCaps),0);
     const mastered=M.meleeGroupTrained(api.state,api.innate,api.branchCaps);
     reqList.append(requirementRow(api,api.branchName('melee'),[
      ['pathReqThreshold','порог','threshold',req.amount],
      ['pathReqClassCap','предел','class cap',cap],
      ['pathReqAllocated','изучено','allocated',available],
      ['pathReqTrained','освоено','trained',mastered]
     ]));
     continue;
    }
    const base=M.branchBase(api.innate,req.branch);
    const value=M.branchPotential(api.state,req.branch,api.innate,api.branchCaps);
    const green=M.branchMastery(api.state,req.branch,api.innate,api.branchCaps);
    reqList.append(requirementRow(api,api.branchName(req.branch),[
      ['pathReqThreshold','порог','threshold',req.amount],
      ['pathReqInnate','старт','innate',base],
      ['pathReqPotential','доступно','potential',value],
      ['pathReqTrained','освоено','trained',green]
     ]));
   }
   details.append(reqList);
  }
  // Preserve the existing separately editable RU/EN previous-skill
  // caption and source name. Make the existing value keyboard-navigable,
  // instead of adding a second previous-skill card or duplicate label.
  const classCanOpen=allowedForJob;
  const navigate=related=>{
   if(typeof api.onNavigateSkill==='function')api.onNavigateSkill(related);
   else if(typeof api.onInspect==='function')api.onInspect(related);
  };
  if(skill.prereq){
   const before=skillIndex.get(String(skill.prereq));
   const title=authored(api,'skillPreviousLabel','Предыдущее умение',
    'Previous skill','span','path-skill-previous-label');
   const canNavigate=before?.name&&classCanOpen(before,api.job);
   const current=before?.name?
    make(canNavigate?'button':'span',{class:'path-skill-previous-value',text:before.name,
     ...(canNavigate?{'type':'button',
      'data-related-skill-id':String(before.id),
      'aria-label':tr(api,'Предыдущее умение: ','Previous skill: ')+before.name,
      onclick:()=>navigate(before)}:{})}):
    authored(api,'skillPrerequisiteMissing','Умение отсутствует в каталоге',
     'Skill not in catalog','span','path-skill-previous-value');
    if(canNavigate)bindPathCopy(api,current,'skillPreviousAria','Предыдущее умение:',
     'Previous skill:','aria-label',' '+before.name);
   const row=make('p',{class:'path-skill-prereqs path-skill-previous-row'});
   row.append(title,make('span',{class:'path-skill-previous-separator',text:': '}),current);
   details.append(row);
  }
  const successors=api.skillCatalog.filter(row=>
   row?.prereq!=null&&String(row.prereq)===String(skill.id)&&
   classCanOpen(row,api.job));
  if(successors.length){
   const lineage=make('nav',{class:'path-skill-lineage',
    'aria-label':tr(api,'Продолжение умения','Skill upgrades')});
   bindPathCopy(api,lineage,'skillLineageAria','Продолжение умения',
    'Skill upgrades','aria-label');
   for(const related of successors){
    const label=related.name||tr(api,'Умение без названия','Unnamed skill');
    const button=make('button',{type:'button',
     class:'path-skill-lineage-link',
     'data-related-skill-id':String(related.id),
     'aria-label':tr(api,'Следующее умение: ','Next skill: ')+label,
     text:tr(api,'Следующее → ','Next → ')+label,
     onclick:()=>navigate(related)});
    bindPathCopy(api,button,'skillNextAria','Следующее умение:',
     'Next skill:','aria-label',' '+label);
    bindPathCopy(api,button,'skillNextLink','Следующее →',
     'Next →','text',' '+label);
    lineage.append(button);
   }
   details.append(lineage);
  }
  // Raw effect codes remain in the encyclopedia, not the quick skill card.
  if(typeof api.skillWiki==='function')details.append(api.skillWiki(skill));
 }
}
root.PandoraHeroPath=Object.freeze({viewGrowth,viewSkills,readiness,skillCountLabel,effectiveSkillCatalog,futureSkillReachable});
})(typeof window==='undefined'?globalThis:window);
