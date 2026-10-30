(function(root){
'use strict';
const M=root.PandoraSkillProgression;
function make(tag,attr={},children=[]){
 const e=document.createElement(tag);
 for(const [key,val]of Object.entries(attr)){
  if(key==='text')e.textContent=val;
  else if(key==='class')e.className=val;
  else if(key.startsWith('on'))e.addEventListener(key.slice(2),val);
  else if(val!==undefined&&val!==null)e.setAttribute(key,String(val));
 }
 for(const v of children)e.append(typeof v==='string'?document.createTextNode(v):v);
 return e;
}
function readiness(skill,api,seen=new Set()){
 const problems=[],state=api.state,job=api.job;
 if(seen.has(String(skill.id)))return {learned:false,problems:['Циклическая зависимость навыков']};
 const chain=new Set(seen);chain.add(String(skill.id));
 if(skill.classes&&!Object.hasOwn(skill.classes,job))problems.push('Не подходит профессии');
 if(Number(skill.charLevel)>state.level)problems.push('Требуется уровень '+skill.charLevel);
 const required=Array.isArray(skill.reqs)?skill.reqs:[];
 for(const req of required){
  if(!req||!Number.isInteger(Number(req.amount))){problems.push('Неизвестное условие');continue}
  const need=Number(req.amount),points=M.potential(state,req.branch),green=M.trained(state,req.branch);
  const name=api.branchName(req.branch);
  if(points<need)problems.push(name+': вложено '+points+'/'+need);
  if(green<need)problems.push(name+': мастерство '+green+'/'+need);
 }
 if(skill.prereq){
  const previous=api.skillCatalog.find(row=>String(row.id)===String(skill.prereq));
  if(!previous)problems.push('Предыдущее умение не найдено');
  else{
   const prerequisite=readiness(previous,api,chain);
   if(!prerequisite.learned)problems.push('Требуется предыдущее умение «'+previous.name+'»');
  }
 }
 if(skill.learnable===false)problems.push('Особый способ изучения');
 if(Number(skill.reqLevel)>0&&!required.length)problems.push('Дополнительное условие '+skill.reqLevel+' не подтверждено');
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
   'aria-expanded':String(selectedGroup===group.id),onclick:()=>api.onGroup(group.id)});
  const detail=branchKeys.filter(key=>M.potential(state,key)>0)
    .map(key=>M.potential(state,key)+' '+api.branchName(key)).join(' · ');
  groupButton.append(make('strong',{text:api.lang==='en'?group.en:group.ru}),
   make('small',{text:spent+' вложено'+(detail?' · '+detail:'')}));
  wrap.append(groupButton);
  if(selectedGroup===group.id){
   for(const key of branchKeys){
    const points=M.potential(state,key),trained=M.trained(state,key),cap=api.cap(key),isOpen=expandedBranch===key;
    const branch=make('button',{type:'button',
     class:'branch-row'+(isOpen?' active':'')+(cap===0?' disabled-branch':''),
     'aria-expanded':String(isOpen),onclick:()=>api.onExpand(key,isOpen)});
    const info=make('div');
    info.append(make('strong',{text:api.branchName(key)}),
     make('span',{text:points+' вложено · '+trained+' мастерство · лимит '+cap}));
    branch.append(info,make('b',{class:'count',text:String(points)}));wrap.append(branch);
    if(!isOpen)continue;
    const editor=make('div',{class:'inline-branch-editor'});
    const note=make('div',{class:'inline-branch-value'});
    const label=make('strong',{text:points+' / '+cap});
    note.append(make('span',{text:'Очки уровня — вложить в ветку'}),label);
    const available=budget.total!==null&&api.catalogReady&&(cap>0||points>0);
    const track=make('div',{class:'inline-mastery-track','aria-label':'Единая полоса вложенных очков и освоенного мастерства '+api.branchName(key)});
    const bed=make('div',{class:'inline-mastery-bed'}),gold=make('div',{class:'inline-mastery-fill'}),
          green=make('div',{class:'inline-mastery-green'});
    const paint=()=>{
     const invested=M.potential(state,key),mastery=M.trained(state,key);
     gold.style.width=(cap?Math.max(0,Math.min(100,invested/cap*100)):0)+'%';
     green.style.width=(cap?Math.max(0,Math.min(100,mastery/cap*100)):0)+'%';
     track.title=api.branchName(key)+': '+invested+' вложено, '+mastery+
       ' освоено, предел класса '+cap+'. Перетяни ползунок для вложения очков.';
    };
    track.append(bed,gold,green);
    const range=make('input',{type:'range',min:'0',max:String(Math.max(cap,points)),step:'1',
     value:String(points),disabled:!available,
     'aria-label':'Вложенные очки '+api.branchName(key)});
    track.append(range);paint();
    const numeric=make('input',{type:'number',min:'0',max:String(Math.max(cap,points)),step:'1',
     value:String(points),class:'path-potential-number',disabled:!available,
     'aria-label':'Точное количество вложенных очков '+api.branchName(key)});
    const update=(requested,final)=>{
     if(!Number.isInteger(requested)||requested<0)return;
     const target=api.onAllocate(key,requested,final);
     if(!Number.isInteger(target))return;
     range.value=String(target);numeric.value=String(target);label.textContent=target+' / '+cap;
     paint();
     // Committing rebuilds the UI so all branch totals stay synchronized.
    };
    range.addEventListener('input',()=>update(Number(range.value),false));
    range.addEventListener('change',()=>update(Number(range.value),true));
    numeric.addEventListener('change',()=>update(Number(numeric.value),true));
    const controls=make('div',{class:'inline-branch-controls'});
    for(const [title,step]of[['−5',-5],['−',-1],['+',1],['+5',5]])
     controls.append(make('button',{type:'button',text:title,disabled:!available,
      onclick:()=>update(Math.max(0,M.potential(state,key)+step),true)}));
    const skills=skillCatalog.filter(s=>s.classes?.[job]&&Array.isArray(s.reqs)&&
     s.reqs.some(req=>req.branch===key));
    const marks=api.milestones(skills,key,cap);
    if(marks.length&&cap>0){
     const rail=make('div',{class:'inline-branch-milestones','aria-label':'Умения на порогах ветки'});
     for(const mark of marks){
      const skill=mark.skills[0],ready=readiness(skill,api).learned;
      const button=make('button',{type:'button',
       class:'inline-milestone'+(ready?' reached':''),
       'aria-label':skill.name+' · '+mark.threshold+' очков',title:skill.name+' · '+mark.threshold,
       onclick:()=>api.onSkill(skill)});
      const src=api.icon(key,skill);
      if(src){const pic=make('img',{src,alt:''});pic.onerror=()=>pic.replaceWith(make('span',{text:'✦'}));button.append(pic)}
      else button.append(make('span',{text:'✦'}));
      button.append(make('small',{text:String(mark.threshold)}));
      button.style.left='clamp(0px, '+mark.percent+'%, calc(100% - 30px))';
      rail.append(button);api.hover(button,skill);
     }
     track.append(rail);
    }
    const greenRow=make('div',{class:'path-green-controls'});
    const input=make('input',{type:'number',min:'0',max:String(points),step:'1',
     value:String(trained),disabled:auto||!available,
     'aria-label':'Зелёное мастерство '+api.branchName(key)});
    input.addEventListener('change',()=>{
     if(!api.onMastery(key,Number(input.value)))input.value=String(M.trained(state,key));
    });
    const greenLabel=make('label');greenLabel.append(make('span',{text:'Зелёное мастерство'}),input);
    greenRow.append(greenLabel,make('small',{text:auto?'Равно вложенным очкам':'Растёт не выше вложенных'}));
    const exact=make('div',{class:'path-allocation-input'});
    exact.append(make('span',{text:'Точно вложено'}),numeric);
    editor.append(note,track,exact,controls,greenRow);
    if(!available)editor.append(make('p',{class:'muted',
     text:cap===0?'Лимит класса равен нулю. Можно вернуть старые очки.':'Загрузка игровой таблицы очков.'}));
    if(points>cap)editor.append(make('p',{class:'budget-excess',
     text:'Сохранено '+points+' очков сверх текущего лимита '+cap+'. Ничего не удалено автоматически.'}));
    wrap.append(editor);
   }
   if(group.branches.includes('race'))wrap.append(make('p',{class:'branch-racial-note',
    text:'Расовая пассивка выбирается в «Происхождении», без расхода очков веток.'}));
  }
  target.append(wrap);
 }
}
function viewSkills(target,details,api){
 target.replaceChildren();details.replaceChildren();
 if(!api.catalogReady){target.append(make('p',{class:'muted',text:'Каталог умений загружается.'}));return}
 const needle=String(api.query||'').trim().toLocaleLowerCase('ru');
 const rows=api.skillCatalog.filter(skill=>skill.classes?.[api.job]&&
  (String(skill.name||'')+' '+skill.id).toLocaleLowerCase('ru').includes(needle))
  .map(skill=>({skill,gate:readiness(skill,api)})).filter(({gate})=>
   api.filter==='all'||(api.filter==='known'?gate.learned:!gate.learned));
 rows.sort((a,b)=>Number(b.gate.learned)-Number(a.gate.learned)||
  String(a.skill.name||'').localeCompare(String(b.skill.name||''),'ru'));
 target.append(make('p',{class:'path-skill-count',
  text:rows.length+' умений · цветные — доступны по известным условиям, серые — недоступны или не подтверждены'}));
 const grid=make('div',{class:'path-skill-grid'});
 for(const {skill,gate}of rows){
  const item=make('button',{type:'button',class:'path-skill-card'+(gate.learned?' learned':' locked')+
    (String(api.selectedSkill?.id)===String(skill.id)?' active':''),
   title:skill.name+'\n'+(skill.desc||'')+'\n'+(gate.problems.join(' · ')||'Известные условия выполнены'),
   'aria-label':skill.name+' · '+(gate.learned?'доступно':'недоступно'),
   onclick:()=>api.onInspect(skill)});
  const src=api.icon(skill.branch,skill);
  if(src){const img=make('img',{src,alt:''});img.onerror=()=>img.replaceWith(make('span',{text:'✦'}));item.append(img)}
  else item.append(make('span',{text:'✦'}));
  item.append(make('span',{text:skill.name||String(skill.id)}));
  grid.append(item);api.hover(item,skill);
 }
 target.append(grid);
 if(!rows.length)target.append(make('p',{class:'muted',text:'По этим параметрам навыки не найдены.'}));
 const selected=rows.find(row=>String(row.skill.id)===String(api.selectedSkill?.id))||rows[0];
 if(selected){
  const skill=selected.skill,gate=selected.gate;
  details.append(make('h3',{text:skill.name||String(skill.id)}),
   make('p',{text:skill.desc||'Описание умения отсутствует.'}),
   make('p',{class:gate.learned?'path-skill-yes':'path-skill-no',
    text:gate.learned?'✓ Изучено по известным требованиям':'🔒 '+gate.problems.join(' · ')}),
   make('small',{text:'Уровень '+(skill.charLevel||'—')+' · Мана '+(skill.mana??'—')+
    ' · Перезарядка '+(skill.cooldown??'—')+' · ID '+skill.id}));
 }
}
root.PandoraHeroPath=Object.freeze({viewGrowth,viewSkills,readiness});
})(typeof window==='undefined'?globalThis:window);
