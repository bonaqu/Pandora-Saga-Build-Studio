// Pandora Saga Build Studio — client-side character planner.
// No invented combat formulas. Historical catalog is labelled explicitly.
'use strict';
const $=id=>document.getElementById(id);
const VIEW_KEY='ps-studio-navigation.v2';
function readView(){try{return JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}')||{}}catch{return{}}}
const bootView=readView();
let expandedClassKeys=new Set(Array.isArray(bootView.expandedClasses)?bootView.expandedClasses:[]);
let classTreeTouched=Boolean(bootView.classTreeTouched);
let originActive=window.PandoraOriginModel.tab(bootView.origin);
let jobPathKey=typeof bootView.jobPathKey==='string'?bootView.jobPathKey:null;
function renderOriginTabs(){
 document.querySelectorAll('[data-origin-section]').forEach(section=>{
  section.hidden=section.dataset.originSection!==originActive;
 });
 document.querySelectorAll('[data-origin-tab]').forEach(button=>{
  const selected=button.dataset.originTab===originActive;
  button.classList.toggle('active',selected);
  button.setAttribute('aria-selected',String(selected));
 });
}
function saveView(){try{sessionStorage.setItem(VIEW_KEY,JSON.stringify({
 tab:activeTab,open:!!document.getElementById('detailPanel')?.classList.contains('is-open'),
 page:Math.round(window.scrollY),inner:document.getElementById('detailContent')?.scrollTop||0,
 slot:selectedSlot,slotView:stageSlotView,slotOpen:stageSlotPickerOpen,attributes:stageAttributesPage,
 expandedClasses:[...expandedClassKeys],classTreeTouched,origin:originActive,jobPathKey,pathPage:heroPathPage,
 soulQuery:stageSoulQuery,
 skillGroup:selectedSkillGroup,expandedBranch:inlineBranchId,groupTouched:pathGroupTouched,
 pathScroll:document.getElementById('skillBranches')?.scrollTop||0
 }))}catch{}}

const OS='https://pandorasaga-os.com';
const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const STATS=['Выносливость','Сила','Ловкость','Сноровка','Дух','Интеллект'];
const portraitOptions=[{"race":0,"gender":1},{"race":0,"gender":0},{"race":1,"gender":1},{"race":1,"gender":0},{"race":2,"gender":0},{"race":3,"gender":0},{"race":4,"gender":0},{"race":5,"gender":0}];
function selectedPortraitIndex(race,gender){
 const index=portraitOptions.findIndex(v=>v.race===race&&v.gender===((race===0||race===1)?gender:0));
 return Math.max(0,index);
}
const races=[['Человек','Human','human_f','human_m'],['Эльф','Elf','elf_f','elf_m'],['Цверг','Dwarf','dwarf','dwarf'],['Мирина','Myrine','myrine','myrine'],['Энкиду','Enkidu','enkidu','enkidu'],['Кролль','Lapin','lapin','lapin']];
let jobs=['Warrior','Gradiator','Juggernaut','Dragoon','Knight','General','Paladin','Scout','Archer','Sniper','Hunter','Provocateur','Assassin','Saboteur','Acolyte','Priest','Cleric','Enchanter','Ascetic','Monk','Exorcist','Mage','Wizard','Warlock','Conjurer','Sorcerer','Corrupter','Shadowblade'];
const branchNames=['Melee','Slash','Thrust','Cleave','Bash','Defend','Technique','Shot','Alchemy','Assassination','Trapping','Dodge','Grace','Banevolence','Blessing','Exorcism','Hymn','Magic','Elemental','Invocation','Darkness','Confusion','Special','Racial','Horsemanship'];
let branches=window.PandoraGameNavigation.groups.flatMap(group=>group.branches.map(id=>({id,name:id})));
let selectedSkillGroup=bootView.groupTouched&&bootView.skillGroup===null?null:
 window.PandoraGameNavigation.groups.some(group=>group.id===bootView.skillGroup)?bootView.skillGroup:'melee';
let heroPathPage=bootView.pathPage==='skills'?'skills':'growth',pathSkillQuery='',pathSkillFilter='all',pathGroupTouched=Boolean(bootView.groupTouched);
const jobKeys=['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN','SCOUT','ARCHER','SNIPER','PREDATOR','AGENT','ASSASSIN','DISTURBANCE','ACOLYTE','PRIEST','CLERIC','ENCHANTER','ASCETIC','MONK','EXORCIST','MAGE','WIZARD','WARLOCK','CONJURER','DARKROAR','JESTER','CALAMITY'];
const slotKeys=['weapon','shield','head','body','gloves','legs','feet','cloak','ring','ring','neck','belt','ear','ear'];
const slots=[['Оружие','⚔'],['Щит','◈'],['Шлем','♜'],['Нагрудник','♟'],['Перчатки','♧'],['Поножи','♙'],['Обувь','♧'],['Плащ','❧'],['Кольцо I','◉'],['Кольцо II','◉'],['Амулет','✥'],['Пояс','♢'],['Серьга I','✧'],['Серьга II','✧']];
function fresh(){return{race:1,gender:0,job:16,level:50,branch:3,points:Object.fromEntries(branches.map(b=>[b.id,0])),mastery:{},masteryAuto:true,stats:Object.fromEntries(STATS.map(s=>[s,0])),equipment:{},souls:{},refinements:{},gems:{},name:'Новый герой',profile:{guild:'',nation:'',rank:'',about:''},racialPassiveId:null}};
let state=fresh(),activeTab=['character','equipment','builds','wiki'].includes(bootView.tab)?bootView.tab:'character',catalog={skills:null,equipment:null,souls:null,classes:null,meta:null,racialPassives:null,live:false},selectedSkill=null,selectedSlot=0,filter='',gearMode='equipment',builds=[],override={},adminToken='',adminEditing=false,lang=localStorage.getItem('ps-build-lang')==='en'?'en':'ru',catalogSource=null,officialEnglish=null,compareIds=[],skillSearch='',skillOnlyAvailable=false,wikiShown=100,gearShown=60,selectedSocket=0,gearDisplayMode=localStorage.getItem('ps-gear-view')==='list'?'list':'grid',inspectedGearId=null,inspectorPinned=false,characterPanelTab='character',iconManifest=null,wikiData=null,wikiIndex=null,wikiPending=null,wikiSelection={type:'item',id:null,highlight:null},wikiSearch='';
try{const saved=localStorage.getItem('ps-build-studio.v1');if(saved){const parsed=JSON.parse(saved);state={...fresh(),...parsed,points:{...fresh().points,...parsed.points},stats:{...fresh().stats,...parsed.stats},refinements:{...fresh().refinements,...parsed.refinements},profile:{...fresh().profile,...parsed.profile}}} builds=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')}catch(e){console.warn('Saved data skipped',e)}
let racePreviewIndex=selectedPortraitIndex(state.race,state.gender),stageSlotPickerOpen=false,stageSlotQuery='',stageSlotShown=48,
inlineBranchId=typeof bootView.expandedBranch==='string'&&
 window.PandoraGameNavigation.all.has(bootView.expandedBranch)?bootView.expandedBranch:null,
pathScrollRestored=false,
stageSlotView=['choose','details','souls','gems'].includes(bootView.slotView)?bootView.slotView:'choose',
stageSoulQuery=typeof bootView.soulQuery==='string'?bootView.soulQuery.slice(0,120):'',
stageGemQuery='',gameTables=null,stageAttributesPage=['attack','defense','effects'].includes(bootView.attributes)?bootView.attributes:null;
if(Number.isInteger(bootView.slot)&&bootView.slot>=0&&bootView.slot<slots.length)selectedSlot=bootView.slot;
function persist(){try{localStorage.setItem('ps-build-studio.v1',JSON.stringify(state))}catch{}}
function persistBuilds(){try{localStorage.setItem('ps-build-library.v1',JSON.stringify(builds))}catch{}}
function h(tag,attrs={},children=[]){const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='html')throw Error('HTML injection prohibited');else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(k))el[k]=Boolean(v);else if(v!==undefined&&v!==null)el.setAttribute(k,String(v))}for(const c of [].concat(children))if(c!==null&&c!==undefined)el.append(typeof c==='string'?document.createTextNode(c):c);return el}
function imageUrl(name){return `assets/${name}.webp`}
const BRANCH_ICON_PATHS={"slash":"assets/skills/legacy/01-00.png","thrust":"assets/skills/legacy/02-00.png","brush":"assets/skills/legacy/03-00.png","blow":"assets/skills/legacy/04-00.png","defense":"assets/skills/legacy/05-00.png","archery":"assets/skills/legacy/07-00.png","alchemy":"assets/skills/legacy/08-00.png","assassin":"assets/skills/legacy/09-00.png","trap":"assets/skills/legacy/10-00.png","warding":"assets/skills/legacy/11-00.png","benevolence":"assets/skills/legacy/13-00.png","blessing":"assets/skills/legacy/14-00.png","exorcism":"assets/skills/legacy/15-00.png","hymn":"assets/skills/legacy/16-00.png","element":"assets/skills/legacy/18-00.png","embody":"assets/skills/legacy/19-00.png","darkness":"assets/skills/legacy/20-00.png","charm":"assets/skills/legacy/21-00.png","riding":"assets/skills/legacy/24-00.png"};
function branchIcon(id){return BRANCH_ICON_PATHS[id]||'assets/ui/icons/skill-unknown.svg'}
function skillIcon(cat,idx,record=null){const custom=override['visual.skill.'+(record?.id??(cat+'.'+idx))];if(custom)return custom;if(catalog.live&&record?.iconId){const path=iconManifest?.icons?.skills?.['skill_'+record.iconId];return path||`${OS}/icons/skills/skill_${record.iconId}.webp?v=07682901`}return branchIcon(cat)}
function itemIcon(rec,kind='items'){const custom=override[(kind==='souls'?'visual.soul.':'visual.item.')+rec?.id];if(custom)return custom;return rec?.icon?(iconManifest?.icons?.[kind]?.[rec.icon]||`${OS}/icons/${kind}/${rec.icon}.webp?v=07682901`):null}
function branchCap(branch){
 // No invented cap: when a game class is still loading, disable spending until real caps exist.
 return window.PandoraStudioRules.branchCap(catalog.classes,jobKeys[state.job],branch)??0;
}
function previewBaseStats(){
 const clazz=catalog.classes?.[jobKeys[state.job]],raceKey=window.PandoraGameNavigation.raceKeys[state.race];
 const baseClass=clazz?.baseClass||jobKeys[state.job];
 const allocation=Object.fromEntries(['vit','str','agi','dex','spi','int'].map((key,i)=>[key,Number(state.stats[STATS[i]]||0)]));
 const records=[];
 for(const [slot,selection] of Object.entries(state.equipment||{})){
  const item=selection&&catalog.equipment?.[String(selection.id)];
  if(!item)continue;
  const grade=window.PandoraEquipmentPlan.refinementValue(state.refinements,Number(slot),selection);
  records.push(['item:'+item.id,item,grade]);
  const souls=window.PandoraEquipmentPlan.asSocketArray(state.souls?.[slot]);
  const capacity=window.PandoraEquipmentPlan.socketCapacity(item);
  for(let i=0;i<(window.PandoraEquipmentPlan.supportsSoulSlot(slotKeys[Number(slot)])?(capacity??0):0);i++){
   const soul=souls[i]&&catalog.souls?.[String(souls[i].id)];
   if(soul&&window.PandoraEquipmentPlan.validSoul(soul,slotKeys[Number(slot)]))
    records.push(['soul:'+soul.id,soul,grade]);
  }
 }
 const prayerSpirit=window.PandoraSkillProgression.legacyPrayerSpirit(jobKeys[state.job],state);
 return window.PandoraOSCalculator.base({
  classData:clazz,raceData:gameTables?.raceInit?.[raceKey],jobData:gameTables?.jobInit?.[baseClass],
  allocation,level:state.level,records,
  supplementalFlat:prayerSpirit?{spi:prayerSpirit}:{},
  supplementalSource:prayerSpirit?'Remaked Legacy: Inspiration / prayer Adeptness':null
 });
}
function renderHudEstimates(){
 const estimate=previewBaseStats();
 const hp=$('psHud')?.querySelector('.ps-hud-hp small'),mp=$('psHud')?.querySelector('.ps-hud-mp small');
 if(hp)hp.textContent=estimate?'ОЗ ≈'+estimate.hp:'ОЗ —';
 if(mp)mp.textContent=estimate?'ОМ ≈'+estimate.mp:'ОМ —';
 for(const [selector,name] of [['.ps-hud-hp','ОЗ'],['.ps-hud-mp','ОМ']]){
  const row=$('psHud')?.querySelector(selector);
  if(row)row.setAttribute('aria-label',estimate?
   'Предварительные '+name+' по OS с известными плоскими эффектами вещей и душ, без баффов и сложных механик':
   'Базовые '+name+' ещё не рассчитаны');
 }
}
function budgetSummary(){
 return window.PandoraSkillProgression.spending(gameTables?.abilityPoint,state.level,state.points);
}
function allowedBranch(branch){
 const b=budgetSummary(),cap=branchCap(branch),current=window.PandoraSkillProgression.potential(state,branch);
 return b.total===null||!catalog.classes?.[jobKeys[state.job]]?current:
  Math.max(0,Math.min(cap,b.total-b.spent+current));
}

function editableValue(key,defaultValue){return Object.prototype.hasOwnProperty.call(override,key)?override[key]:defaultValue}
function editAttr(el,key){el.dataset.editKey=key;if(adminEditing)el.classList.add('admin-edit');return el}
function raceSource(i,gender){
return override["visual.race."+i+"."+(gender?"m":"f")]||imageUrl(races[i][gender?3:2]);
}
function renderRaces(){
 const grid=$('raceGrid');grid.replaceChildren();
 const option=portraitOptions[racePreviewIndex]||portraitOptions[0],i=option.race,gender=option.gender;
 const chosen=state.race===i&&window.PandoraUIPlanner.normalizeGender(races,i,state.gender)===gender;
 const frame=h('div',{class:'race-slide-frame'+(chosen?' selected':''),'aria-live':'polite'});
 const img=editAttr(h('img',{src:raceSource(i,gender),alt:races[i][0]+((i===0||i===1)?(gender?' · мужчина':' · женщина'):''),loading:'eager'}),
  'visual.race.'+i+'.'+(gender?'m':'f'));
 img.onerror=()=>{img.onerror=null;img.alt='Изображение '+races[i][0]+' временно недоступно'};
 const arrow=(text,step,alt)=>h('button',{type:'button',class:'race-slide-arrow '+(step<0?'previous':'next'),text,'aria-label':alt,
  onclick:()=>{racePreviewIndex=(racePreviewIndex+step+portraitOptions.length)%portraitOptions.length;renderRaces();
    grid.querySelector('.race-slide-arrow.'+(step<0?'previous':'next'))?.focus({preventScroll:true})}});
 frame.append(img,arrow('❮',-1,'Предыдущий портрет'),arrow('❯',1,'Следующий портрет'));
 const chooseRace=()=>{
  if(chosen)return;
  state=window.PandoraOriginModel.selectRace(state,i,gender);
  selectedSkill=null;stageSlotPickerOpen=false;stageAttributesPage=null;
  persist();render();saveView();
 };
 img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','Выбрать '+img.alt);
 img.addEventListener('click',chooseRace);
 img.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseRace()}});
 const actions=h('div',{class:'race-slide-actions'});
 actions.append(h('span',{class:'race-slide-position',text:(racePreviewIndex+1)+' / '+portraitOptions.length}),
  h('button',{type:'button',class:'race-slide-select'+(chosen?' selected':''),'aria-pressed':String(chosen),
   text:chosen?'✓ Выбрано':'Выбрать этот образ',onclick:chooseRace}));
 grid.append(frame,actions);
}
const CLASS_PARENT_FALLBACK={"WARRIOR":null,"GLADIATOR":"WARRIOR","KNIGHT":"WARRIOR","SCOUT":null,"ARCHER":"SCOUT","AGENT":"SCOUT","ACOLYTE":null,"PRIEST":"ACOLYTE","ASCETIC":"ACOLYTE","MAGE":null,"WIZARD":"MAGE","DARKROAR":"MAGE","JUGGERNAUT":"GLADIATOR","DRAGOON":"GLADIATOR","GENERAL":"KNIGHT","PALADIN":"KNIGHT","SNIPER":"ARCHER","PREDATOR":"ARCHER","ASSASSIN":"AGENT","DISTURBANCE":"AGENT","CLERIC":"PRIEST","ENCHANTER":"PRIEST","MONK":"ASCETIC","EXORCIST":"ASCETIC","WARLOCK":"WIZARD","CONJURER":"WIZARD","JESTER":"DARKROAR","CALAMITY":"DARKROAR"};
// Reorient the navigation when class restrictions change; never discard a saved build.
function selectJob(index){
 if(!Number.isInteger(index)||index<0||index>=jobKeys.length)return;
 if(state.job!==index){
  state.job=index;selectedSkillGroup=null;inlineBranchId=null;
  pathGroupTouched=false;selectedSkill=null;
 }
 persist();render();saveView();
}
function renderJobs(){
 const grid=$('classGrid');grid.replaceChildren();
 const records=jobKeys.map((key,i)=>({key,i,name:editableValue('job.'+i,jobs[i]||key),
  parent:catalog.classes?.[key]?.parent??CLASS_PARENT_FALLBACK[key]??null}));
 const byKey=new Map(records.map(x=>[x.key,x]));
 const parentOf=key=>byKey.get(key)?.parent||null;
 // Invalid stored navigation must recover to root, not create a blank panel.
 if(jobPathKey&&!byKey.has(jobPathKey))jobPathKey=null;
 const current=jobPathKey?byKey.get(jobPathKey):null;
 const path=[];
 for(let k=jobPathKey;k&&byKey.has(k);k=parentOf(k))path.unshift(byKey.get(k));
 const depth=Math.min(path.length,2),activeAncestors=new Set();
 for(let k=jobKeys[state.job];k&&byKey.has(k);k=parentOf(k))activeAncestors.add(k);
 const progress=h('div',{class:'class-wizard-progress','aria-label':'Этап выбора профессии'});
 for(let i=0;i<3;i++){
  progress.append(h('span',{class:'class-wizard-step'+(i===depth?' current':'')+(i<depth?' completed':''),
   text:(i+1)+'. '+['Направление','Профессия','Специализация'][i]}));
 }
 grid.append(progress);
 const top=h('div',{class:'class-wizard-header'});
 if(current){
  top.append(h('button',{type:'button',class:'class-back',text:'← Назад',onclick:()=>{
   jobPathKey=parentOf(jobPathKey);renderJobs();saveView();
  }}));
 }
 top.append(h('strong',{class:'class-wizard-title',text:current?current.name:'Направление профессии'}));
 grid.append(top);
 if(path.length){
  const crumbs=h('div',{class:'class-wizard-breadcrumbs','aria-label':'Вернуться на предыдущий уровень'});
  crumbs.append(h('button',{type:'button',text:'Все направления',onclick:()=>{jobPathKey=null;renderJobs();saveView()}}));
  for(const node of path)crumbs.append(h('button',{type:'button',text:node.name,'aria-current':node.key===jobPathKey?'step':null,
    onclick:()=>{jobPathKey=node.key;renderJobs();saveView()}}));
  grid.append(crumbs);
 }
 if(path.length){
  grid.append(h('p',{class:'class-wizard-path',text:path.map(x=>x.name).join(' › ')}));
  grid.append(h('button',{type:'button',class:'class-current-select',
    text:state.job===current.i?'✓ '+current.name+' · выбрано':'Выбрать '+current.name,
    'aria-pressed':String(state.job===current.i),onclick:()=>{
     selectJob(current.i);
    }}));
 }
 const next=records.filter(x=>x.parent===(jobPathKey||null));
 const choices=h('div',{class:'class-wizard-choices'});
 for(const node of next){
  const hasChildren=records.some(x=>x.parent===node.key);
  choices.append(h('button',{type:'button',class:'class-wizard-choice'+(state.job===node.i?' active':'')+(activeAncestors.has(node.key)?' on-path':''),
    'aria-label':node.name+(hasChildren?' — перейти к специализациям':' — выбрать профессию'),
    'aria-pressed':String(state.job===node.i),
    onclick:()=>{
     if(hasChildren){jobPathKey=node.key;renderJobs();saveView();return}
     jobPathKey=node.key;selectJob(node.i);
    }},[
      h('strong',{text:node.name}),
      h('span',{text:hasChildren?'Специализации ›':state.job===node.i?'✓ Выбрано':'Выбрать'})
    ]));
 }
 grid.append(choices);
 if(!next.length&&current)grid.append(h('p',{class:'class-wizard-hint',text:'Конечная специализация. Можно выбрать её или вернуться назад.'}));
}
let workbenchReturnFocus=null;
function showWorkbench(){
 const panel=$('detailPanel'),backdrop=$('studioBackdrop');
 if(!panel||!backdrop)return;
 const wasOpen=panel.classList.contains('is-open');
 if(!wasOpen)workbenchReturnFocus=document.activeElement;
 if(stageSlotPickerOpen)closeStagePicker(false);
 panel.classList.add('is-open');panel.setAttribute('aria-modal','true');
 backdrop.hidden=false;document.body.classList.add('studio-workbench-open');
 if(!wasOpen)$('dockClose')?.focus({preventScroll:true});
}
function closeWorkbench(){
 const panel=$('detailPanel'),backdrop=$('studioBackdrop');
 if(!panel||!panel.classList.contains('is-open'))return;
 panel.classList.remove('is-open');panel.removeAttribute('aria-modal');
 if(backdrop)backdrop.hidden=true;
 document.body.classList.remove('studio-workbench-open');
 const old=workbenchReturnFocus;workbenchReturnFocus=null;
 if(old?.isConnected&&typeof old.focus==='function')old.focus({preventScroll:true});
 // Closing the encyclopedia must clear its deep link as well, not resurrect the dock on reload.
 if(activeTab==='wiki'&&location.hash.startsWith('#wiki/'))
  history.replaceState(history.state,'',location.pathname+location.search);
 saveView();
}
function changeTab(tab){
 if(tab==='stats'){
  originActive='stats';renderOriginTabs();closeWorkbench();
  $('originPanelStats')?.scrollIntoView({block:'nearest',behavior:'smooth'});saveView();return;
 }
 if(tab==='skills'){
  closeWorkbench();
  const group=window.PandoraGameNavigation.groups.find(g=>g.id===selectedSkillGroup);
  inlineBranchId=group?.branches.find(id=>id!=='race')||'slash';
  state.branch=inlineBranchId;renderBranches();
  $('skillBranches')?.scrollIntoView({block:'nearest',behavior:'smooth'});saveView();return;
 }
 if(!['character','equipment','builds','wiki'].includes(tab))return;
 if(tab==='character'){
  activeTab='character';closeWorkbench();
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab==='character'));
  $('workspace')?.scrollIntoView({block:'start',behavior:'smooth'});saveView();return;
 }
 // A previous #wiki/... bookmark must never override the user's current tab on F5.
 if(tab!=='wiki'&&location.hash.startsWith('#wiki/'))
  history.replaceState(history.state,'',location.pathname+location.search);
 const previous=activeTab;
 activeTab=tab;
 document.querySelectorAll('[data-tab]').forEach(btn=>{
  const active=btn.dataset.tab===tab;
  btn.classList.toggle('active',active);
  if(btn.getAttribute('role')==='tab')btn.setAttribute('aria-selected',String(active));
 });
 renderDetails();
 if(previous!==tab)$('detailContent').scrollTop=0;
 showWorkbench();saveView();
}
function itemWithOverrides(rec){
 if(!rec)return null;
 const val=override['itemslots.'+rec.id];
 const slots=val!==undefined&&/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(String(val))?Number(val):rec.soulslot;
 return {...rec,name:editableValue('item.'+rec.id,rec.name),
  desc:editableValue('itemdesc.'+rec.id,rec.desc),soulslot:slots};
}
function equippedRecord(slot){
const value=state.equipment[slot];
if(!value)return null;
const rec=catalog.live?catalog.equipment?.[String(value.id)]||null:null;return itemWithOverrides(rec);
}
function slotVisual(slot){
const item=state.equipment[slot],r=item&&equippedRecord(slot),icon=r?itemIcon(r):null; // Unknown/stale equipment ID: avoid unverified remote icon
if(!icon)return h("span",{text:slots[slot][1],class:"slot-glyph"});
const img=h("img",{class:"equipped-icon",src:icon,alt:""});
img.onerror=()=>{img.onerror=null;img.replaceWith(h("span",{text:slots[slot][1],class:"slot-glyph"}))};
return img;
}
function renderSlotRails(){
 const plan=window.PandoraEquipmentPlan;
 for(const[id,indexes]of[['railLeft',[0,2,3,4,5,6]],['railRight',[1,7,8,9,10,11,12,13]]]){
  const container=$(id);container.replaceChildren();
  for(const i of indexes){
   const item=state.equipment?.[i],source=item&&equippedRecord(i),cap=plan.socketCapacity(source);
   const report=plan.socketReport(state.souls?.[i],cap);
   const level=plan.canRefine(slotKeys[i])?plan.refinementValue(state.refinements,i,item):0;
   const tooltip=slots[i][0]+' · '+(item?.name||'Пусто')+(item&&cap!==null?' · души '+Math.min(report.count,cap)+'/'+cap:'')+(level?' · план заточки +'+level:'');
   const button=h('button',{class:'equipment-slot'+(item?' equipped':'')+(selectedSlot===i?' selected':'')+(report.excess?' socket-conflict':''),
    'data-slot-index':String(i),'aria-expanded':String(stageSlotPickerOpen&&selectedSlot===i),'aria-controls':'stagePicker',
    'aria-label':tooltip,title:tooltip,onclick:()=>{selectedSlot=i;selectedSocket=0;gearMode='equipment';stageSlotQuery='';stageSoulQuery='';stageSlotShown=48;stageSlotView=state.equipment?.[i]?'details':'choose';stageSlotPickerOpen=true;renderSlotRails();renderStagePicker(true)}});
   button.append(slotVisual(i),h('small',{text:item?.name||slots[i][0]}));
   if(item&&plan.canSocket(slotKeys[i],source))button.append(h('span',{class:'stage-sockets',text:'◈ '+Math.min(report.count,cap)+'/'+cap}));
   if(item&&level>0)button.append(h('span',{class:'stage-enhance',text:'+'+level}));
   if(source)window.PandoraStageItemUI.attachPreview(button,source,(rec,kind)=>itemIcon(rec,kind==='soul'?'souls':'items'));
   if(report.excess>0)button.append(h('span',{class:'stage-conflict',text:'!','aria-label':'Конфликт гнёзд'}));
   container.append(button);
  }
 }
}
function renderStageAttributes(){
 const root=$('stageAttributes');if(!root)return;
 const show=Boolean(stageAttributesPage)&&!stageSlotPickerOpen;
 root.hidden=!show;root.closest('.portrait-frame').classList.toggle('attributes',show);
 $('stageAttributeToggle').setAttribute('aria-pressed',String(Boolean(stageAttributesPage)));
 if(!show)return;
 const plan=window.PandoraEquipmentPlan;
 const items=Object.entries(state.equipment||{}).filter(([,entry])=>entry).map(([slot,entry])=>{
  const rec=itemWithOverrides(catalog.equipment?.[String(entry.id)]);
  return {record:rec,refinement:plan.refinementValue(state.refinements,Number(slot),entry),
    souls:plan.asSocketArray(state.souls?.[slot]).filter(Boolean).map(s=>catalog.souls?.[String(s.id)]||s)};
 });
 window.PandoraStageAttributes.render(root,{
  page:stageAttributesPage,items,modifiers:previewBaseStats(),icon:rec=>itemIcon(rec),onClose:()=>{
    stageAttributesPage=null;renderStageAttributes();saveView();
  },onPage:name=>{stageAttributesPage=name;renderStageAttributes();saveView()}
 });
}
function focusSelectedSlot(){
 document.querySelector('.equipment-rail .equipment-slot[data-slot-index="'+selectedSlot+'"]')?.focus({preventScroll:true});
}
function closeStagePicker(focusSlot=true){
 if(!stageSlotPickerOpen)return;
 stageSlotPickerOpen=false;renderSlotRails();renderStagePicker();
 if(focusSlot)focusSelectedSlot();
}
function renderStagePicker(focusSearch=false){
 const root=$('stagePicker');if(!root)return;
 const previousMode=root.dataset.view||'';
 const oldBodyScroll=root.querySelector('.stage-rich-body')?.scrollTop||0;
 const preserveScroll=stageSlotPickerOpen&&previousMode===stageSlotView;
 root.dataset.view=stageSlotView;
 const frame=root.closest('.portrait-frame');frame.classList.toggle('picking',stageSlotPickerOpen);
 root.hidden=!stageSlotPickerOpen;root.replaceChildren();renderStageAttributes();
 if(!stageSlotPickerOpen)return;
 const key=slotKeys[selectedSlot],equipped=state.equipment?.[selectedSlot];
 const record=equipped&&equippedRecord(selectedSlot);
 if(stageSlotView==='gems'||(stageSlotView==='souls'&&!window.PandoraEquipmentPlan.canSocket(key,record)))stageSlotView='details';
 if(stageSlotView!=='choose'){
  const plan=window.PandoraEquipmentPlan;
  window.PandoraStageItemUI.render(root,{
   record,item:equipped,slot:key,slotIndex:selectedSlot,selectedSocket,mode:stageSlotView,
   icons:(entry,kind)=>itemIcon(entry,kind==='soul'?'souls':'items'),
   refinement:plan.refinementValue(state.refinements,selectedSlot,equipped),
   souls:plan.asSocketArray(state.souls?.[selectedSlot]),
   soulQuery:stageSoulQuery,onSoulQuery:value=>{stageSoulQuery=value;saveView()},
   gems:state.gems?.[plan.refinementKey(selectedSlot,equipped)],
   catalog,gameTables,close:()=>closeStagePicker(),
   changeMode:mode=>{
    if(mode==='gems')mode='details';
    if(mode==='souls'&&!plan.canSocket(key,record))mode='details';
    stageSlotView=mode;saveView();renderStagePicker(mode==='choose')
   },
   updateGrade:n=>{if(!plan.canRefine(key)||!Number.isInteger(n)||n<0||n>10)return;
    state.refinements??={};state.refinements[plan.refinementKey(selectedSlot,equipped)]=n;
    persist();renderSlotRails();renderStagePicker();renderHudEstimates();
    root.querySelector('[data-grade="'+n+'"]')?.focus({preventScroll:true});
   },
   openSocket:i=>{selectedSocket=i;stageSlotView='souls';saveView();renderStagePicker();
    root.querySelector('[data-socket-index="'+i+'"]')?.focus({preventScroll:true});
   },
   assignSoul:entry=>{
    const capacity=plan.socketCapacity(record);
    if(!plan.canSocket(key,record)||capacity===null||selectedSocket<0||selectedSocket>=capacity)return;
    if(entry&&!plan.validSoul(entry,key))return;
    const next=plan.asSocketArray(state.souls?.[selectedSlot]);
    next[selectedSocket]=entry?{id:entry.id,name:entry.name,icon:entry.icon}:null;
    state.souls[selectedSlot]=next;stageSlotView='souls';persist();renderStagePicker();renderSlotRails();renderHudEstimates();
    const restoreFocus=stageSoulQuery?'[data-soul-query]':'[data-socket-index="'+selectedSocket+'"]';
    root.querySelector(restoreFocus)?.focus({preventScroll:true});
   },
   assignGem:entry=>{if(!plan.canRefine(key))return;
    const focusKey=document.activeElement?.getAttribute?.('data-enchant-key');
    const focusValue=document.activeElement?.getAttribute?.('data-enchant-value');
    state.gems??={};
    const id=plan.refinementKey(selectedSlot,equipped);
    const choice=window.PandoraEnchantModel.normalize(entry);
    if(choice)state.gems[id]=choice;else delete state.gems[id];
    stageSlotView='details';persist();renderStagePicker();
    if(focusKey&&focusValue)root.querySelector('[data-enchant-key="'+focusKey+
      '"][data-enchant-value="'+focusValue+'"]')?.focus({preventScroll:true});
   }
  });
  if(preserveScroll){
   const body=root.querySelector('.stage-rich-body');
   if(body)body.scrollTop=oldBodyScroll;
  }
  return;
 }
 const top=h('div',{class:'stage-picker-head'},[
  h('strong',{text:'Выбор: '+slots[selectedSlot][0]}),
  h('button',{type:'button',text:'Свойства →',disabled:!record,onclick:()=>{stageSlotView='details';renderStagePicker()}}),
  h('button',{type:'button',text:'✕','aria-label':'Закрыть выбор',onclick:()=>closeStagePicker()})
 ]);
 const search=h('input',{type:'search',value:stageSlotQuery,placeholder:'Поиск названия или ID','aria-label':'Поиск предмета для '+slots[selectedSlot][0]});
 const count=h('small',{class:'stage-picker-count'});
 const list=h('div',{class:'stage-picker-list',role:'list'});
 const more=h('button',{type:'button',class:'stage-picker-more'});
 const remove=h('button',{type:'button',text:'Снять предмет',disabled:!equipped,onclick:()=>{
  const removed=equippedRecord(selectedSlot);
   delete state.equipment[selectedSlot];
   if(selectedSlot===3&&window.PandoraUIPlanner.isAstirDress(removed)&&state.displacedLegwear){
    state.equipment[5]=state.displacedLegwear;state.displacedLegwear=null;
   }
   stageSlotView='choose';persist();render();
 }});
 const bottom=h('div',{class:'stage-picker-foot'},[remove,more]);
 const records=catalog.live?window.PandoraUIPlanner.equippable(Object.values(catalog.equipment||{}),key,jobKeys[state.job],state.level,window.PandoraStudioRules.equipment)
 .filter(rec=>window.PandoraUIPlanner.raceCompatible(rec,state.race,state.gender)&&
 !(key==='legs'&&window.PandoraUIPlanner.isAstirDress(equippedRecord(3)))):[];
 const draw=()=>{
  list.replaceChildren();
  const query=stageSlotQuery.trim().toLocaleLowerCase('ru');
  const matches=records.filter(rec=>(itemName(rec)+' '+rec.id).toLocaleLowerCase('ru').includes(query));
  count.textContent=matches.length+' подходящих · '+Math.min(matches.length,stageSlotShown)+' показано';
  if(!catalog.live)list.append(h('p',{class:'muted',text:'Каталог ещё не загружен.'}));
  else if(!matches.length)list.append(h('p',{class:'muted',text:'Нет совместимых предметов. Измени поиск или слот.'}));
  for(const rec of matches.slice(0,stageSlotShown)){
   const selected=String(equipped?.id)===String(rec.id);
   const btn=h('button',{type:'button',class:'stage-picker-item'+(selected?' selected':''),
    'aria-label':'Экипировать '+itemName(rec),onclick:()=>{
     if(selectedSlot===3&&!window.PandoraUIPlanner.isAstirDress(rec)&&state.displacedLegwear){
      state.equipment[5]=state.displacedLegwear;state.displacedLegwear=null;
     }
     state.equipment[selectedSlot]={id:rec.id,name:itemName(rec),level:rec.level??null,icon:rec.icon??null};
     if(window.PandoraUIPlanner.isAstirDress(rec)){state.displacedLegwear=state.equipment[5]||null;delete state.equipment[5]}
     stageSlotView='details';persist();render();renderStagePicker();
    }});
   const src=itemIcon(rec);
   if(src){const img=h('img',{src,alt:'',loading:'lazy'});img.onerror=()=>img.replaceWith(h('span',{class:'item-glyph',text:'⚔'}));btn.append(img)}
   else btn.append(h('span',{class:'item-glyph',text:'⚔'}));
   btn.append(h('span',{class:'stage-picker-item-label'},[h('b',{text:itemName(rec)}),h('small',{text:'ID '+rec.id+(rec.level?' · ур. '+rec.level:'')})]));
   if(selected)btn.append(h('span',{class:'stage-picker-check',text:'✓'}));
   list.append(btn);
  }
  more.hidden=matches.length<=stageSlotShown;
  more.textContent='Показать ещё ('+Math.max(0,matches.length-stageSlotShown)+')';
 };
 search.addEventListener('input',()=>{stageSlotQuery=search.value;stageSlotShown=48;draw()});
 more.addEventListener('click',()=>{stageSlotShown+=48;draw()});
 root.append(top,search,count,list,bottom);draw();
 if(focusSearch)search.focus({preventScroll:true});
}
function attributeSnapshot(){
 const klass=catalog.classes?.[jobKeys[state.job]],root=klass?.baseClass||jobKeys[state.job];
 return window.PandoraAttributeProgression.snapshot({
  tables:gameTables,race:window.PandoraGameNavigation.raceKeys[state.race],klass:root,level:state.level,
  added:STATS.map(key=>Number(state.stats[key]||0)),caps:klass?.statCaps
 });
}
function setAttributePoints(index,added){
 if(!window.PandoraAttributeProgression.allowed(attributeSnapshot(),index,added))return false;
 state.stats[STATS[index]]=added;persist();renderHudEstimates();return true;
}
const ORIGIN_STAT_LABELS=[
 {short:'ВЫН',name:'Выносливость',code:'vit'},
 {short:'СИЛ',name:'Сила',code:'str'},
 {short:'ПРВ',name:'Проворность',code:'agi'},
 {short:'ЛВК',name:'Ловкость',code:'dex'},
 {short:'СД',name:'Сила духа',code:'spi'},
 {short:'ИНТ',name:'Интеллект',code:'int'}
];
// Legacy save keys remain unchanged: AGI was stored under «Ловкость», DEX under «Сноровка».
function renderOriginStats(){
 const root=$('originStats'),summary=$('originStatSummary');
 if(!root||!summary)return;
 root.replaceChildren();
 root.append(h('p',{class:'origin-stat-guide',text:'Старт + вложено вручную + бонусы = итог. Бонусы предметов, душ и мастерства не расходуют очки уровня.'}));
 const list=h('div',{class:'origin-stat-list'}),elements=[];
 function refresh(){
  const snap=attributeSnapshot(),estimated=previewBaseStats();
  summary.textContent=snap?'Свободно: '+snap.remaining+' / '+snap.total+' · Потрачено: '+snap.spent:'Характеристики';
  summary.classList.toggle('over-budget',!!snap?.overBudget);
  for(const entry of elements){
   const current=Number(state.stats[STATS[entry.i]]||0),base=snap?.base[entry.i];
   entry.start.textContent=base===undefined?'—':String(base);
   entry.input.value=String(current);entry.input.max=snap?String(Math.max(current,snap.max[entry.i]-snap.base[entry.i])):'99';
   const invested=base===undefined?null:base+current;
   const code=ORIGIN_STAT_LABELS[entry.i].code;
   const gear=Number(estimated?.effects?.flat?.[code]||0);
   const legacy=Number(estimated?.supplementalFlat?.[code]||0);
   const effective=estimated?.stats?.[code];
   entry.end.textContent=invested===null?'—':String(Number.isFinite(effective)?effective:invested);
   entry.end.title='База '+(base??'?')+' + вложено вручную '+current+
      ' + вещи/души '+gear+' + мастерство (исторический Remaked, не проверено с OS) '+legacy+
      '. Бонусы НЕ тратят свободные очки.';
   entry.cap.textContent=snap?'лимит '+snap.max[entry.i]:'';
   const next=window.PandoraAttributeProgression.nextCost(snap,entry.i);
   const extras=(gear>=0?'+':'')+gear+' вещи/души · '+(legacy>=0?'+':'')+legacy+' мастерство';
   entry.breakdown.textContent='Старт '+(base??'—')+' + вручную '+current+
     ' + '+extras+' = '+(Number.isFinite(effective)?effective:(invested??'—'))+
     (next!==null&&next!==undefined?' · цена +1: '+next:' · предел вложений');
   entry.breakdown.title=legacy?
    'Мастерство «Молитвы» рассчитано по архивному Remaked, не подтверждено OS.':
    'Бонусы вещей/душ не расходуют свободные очки.';
   entry.minus.disabled=!snap||current===0;
   entry.plus.disabled=!window.PandoraAttributeProgression.allowed(snap,entry.i,current+1);
   entry.plus.title='Стоимость +1: '+(window.PandoraAttributeProgression.nextCost(snap,entry.i)??'максимум');
  }
 }
 ORIGIN_STAT_LABELS.forEach((info,i)=>{
  const row=h('div',{class:'origin-stat-row'});
  const title=h('div',{class:'origin-stat-title',title:info.name},[
   h('b',{text:info.short}),h('span',{text:info.name})]);
  const start=h('span',{class:'origin-stat-base',text:'—',title:'Стартовое значение'});
  const minus=h('button',{type:'button',text:'−','aria-label':'Уменьшить '+info.name});
  const input=h('input',{type:'number',min:'0',step:'1',class:'origin-stat-input',
   value:String(state.stats[STATS[i]]||0),'aria-label':info.name+' — вложено'});
  const plus=h('button',{type:'button',text:'+','aria-label':'Увеличить '+info.name});
  const result=h('div',{class:'origin-stat-result'}),end=h('strong',{text:'—'}),cap=h('small',{text:''});
  result.append(end,cap);
  const commit=next=>{
   if(!setAttributePoints(i,Number(next))){input.value=String(state.stats[STATS[i]]||0);return}
   refresh();
   if($('detailPanel').classList.contains('is-open')&&activeTab==='stats'){
    const scroll=$('detailContent').scrollTop;renderDetails();$('detailContent').scrollTop=scroll;
   }
  };
  minus.addEventListener('click',()=>commit(Math.max(0,Number(state.stats[STATS[i]]||0)-1)));
  plus.addEventListener('click',()=>commit(Number(state.stats[STATS[i]]||0)+1));
  input.addEventListener('change',()=>commit(input.value));
  const breakdown=h('small',{class:'origin-stat-breakdown',text:'База и бонусы загружаются…'});
  row.append(title,start,minus,input,plus,result,breakdown);
  list.append(row);elements.push({i,start,input,end,cap,minus,plus,breakdown});
 });
 root.append(list);refresh();
}
function renderOriginPassives(){
 const root=$('originPassives');if(!root)return;
 root.replaceChildren();
 const ids=window.PandoraGameNavigation.racePassiveIds(catalog.racialPassives,state.race);
 // A restored local build must not keep a racial passive from a different race.
 const raceKey=window.PandoraGameNavigation.raceKeys[state.race];
 if(catalog.racialPassives?.[raceKey]&&state.racialPassiveId!=null&&
    !window.PandoraGameNavigation.selectionValid(catalog.racialPassives,state.race,state.racialPassiveId)){
  state.racialPassiveId=null;persist();
 }
 const raceName=$('originRaceName');if(raceName)raceName.textContent=races[state.race][0];
 if(!ids.length){root.append(h('p',{class:'muted',text:'Расовые способности появятся после загрузки каталога.'}));return}
 for(const id of ids){
  const skill=catalog.skills?.[String(id)];if(!skill)continue;
  const selected=String(state.racialPassiveId)===String(id);
  const btn=h('button',{type:'button',class:'origin-passive'+(selected?' selected':''),'aria-pressed':String(selected),
   title:skill.desc||skill.name,'aria-label':skill.name+(selected?' — выбрано':' — выбрать'),
   onclick:()=>{state.racialPassiveId=selected?null:id;persist();renderOriginPassives();if(activeTab==='character'&&characterPanelTab==='character')renderDetails()}});
  const src=skillIcon('race',id,skill);
  if(src){const img=h('img',{src,alt:'',loading:'lazy'});img.onerror=()=>img.replaceWith(h('span',{text:'✦'}));btn.append(img)}
  else btn.append(h('span',{text:'✦'}));
  btn.append(h('span',{},[h('b',{text:skill.name}),h('small',{text:selected?'✓ Выбрано':'Выбрать'})]));root.append(btn);
 }
}
function skillHover(button,skill){
 let tip;const clear=()=>{tip?.remove();tip=null};
 button.addEventListener('mouseenter',()=>{
  clear();tip=h('aside',{class:'stage-hover-preview'},[
   h('h3',{text:skill.name||'Навык'}),
   h('p',{class:'stage-rich-note',text:'Уровень '+(skill.charLevel??'—')+' · ОМ '+(skill.mana??'—')}),
   h('p',{class:'stage-rich-desc',text:skill.desc||'Описание отсутствует'})
  ]);
  document.body.append(tip);
  const box=button.getBoundingClientRect(),width=tip.offsetWidth,height=tip.offsetHeight;
  tip.style.left=Math.max(8,Math.min(innerWidth-width-8,box.right+8))+'px';
  tip.style.top=Math.max(8,Math.min(innerHeight-height-8,box.top))+'px';
 });
 button.addEventListener('mouseleave',clear);button.addEventListener('blur',clear);
}
function refreshBudgetLabel(){
 const data=budgetSummary(),root=$('budgetState');if(!root)return;
 root.replaceChildren();
 const stats=h('div',{class:'path-budget-values'});
 if(data.total===null)stats.append(h('p',{text:'Загружаются очки умений…'}));
 else{
  for(const [title,value,css]of[
    ['Свободно',data.remaining,'path-free'],['Вложено',data.spent,''],['Всего',data.total,'']]){
   stats.append(h('div',{},[h('strong',{class:css,text:String(value)}),h('span',{text:title})]));
  }
  if(data.remaining<0)root.append(h('small',{class:'budget-excess',
   text:'Сохранённый билд превышает бюджет. Прежние вложения не удалены.'}));
 }
 root.prepend(stats);
}
function heroPathApi(){
 const groups=window.PandoraGameNavigation.groups,klass=jobKeys[state.job];
 return {
  state,groups,job:klass,lang,selectedGroup:selectedSkillGroup,expandedBranch:inlineBranchId,
  skillCatalog:Object.values(catalog.skills||{}),catalogReady:!!catalog.skills,
  allocationReady:Boolean(gameTables?.abilityPoint&&catalog.classes?.[klass]),
  budget:budgetSummary(),selectedSkill,filter:pathSkillFilter,query:pathSkillQuery,
  cap:branchCap,
  branchName:key=>editableValue('branch.'+key,catalog.meta?.branchLabels?.[key]||key),
  icon:(key,skill)=>skillIcon(key,skill?.id,skill),
  hover:(node,skill)=>skillHover(node,skill),
  skillWiki:skill=>wikiLink('📜 Полная статья в энциклопедии','skill',String(skill.id)),
  milestones:(skills,key,cap)=>{
   const {milestones,above}=window.PandoraSkillMilestones.forBranch(skills,key,cap);
   const locked=new Map();
   for(const row of above){
    const skill=skills.find(s=>String(s.id)===String(row.id));
    if(!skill)continue;
    const bucket=locked.get(row.threshold)||[];
    if(!bucket.some(x=>String(x.id)===String(skill.id)))bucket.push(skill);
    locked.set(row.threshold,bucket);
   }
   return [...milestones.map(m=>({...m,locked:false})),
    ...[...locked].map(([threshold,items])=>({threshold,skills:items,locked:true}))]
    .sort((a,b)=>a.threshold-b.threshold);
  },
  onGroup:key=>{
   const collapse=selectedSkillGroup===key;
   selectedSkillGroup=collapse?null:key;
   pathGroupTouched=true;
   const group=collapse?null:groups.find(x=>x.id===key);
   inlineBranchId=group?(group.branches.find(x=>x!=='race'&&branchCap(x)>0)||
    group.branches.find(x=>x!=='race')||''):null;
   renderBranches();
   document.querySelector('[data-path-group="'+key+'"]')?.focus({preventScroll:true});
   saveView();
  },
  onExpand:(key,open)=>{
   inlineBranchId=open?'':key;state.branch=key;persist();renderBranches();
   document.querySelector('[data-path-branch="'+key+'"]')?.focus({preventScroll:true});
   saveView();
  },
  onAllocate:(key,requested,final)=>{
   const model=window.PandoraSkillProgression,current=model.potential(state,key);
   const target=requested<=current?Math.max(0,requested):Math.min(Math.max(0,requested),allowedBranch(key));
   if(!model.canAllocate(gameTables?.abilityPoint,state.level,state.points,key,branchCap(key),target))
    return current;
   model.setPotential(state,key,target);
   state.branch=key;persist();refreshBudgetLabel();
   if(final){
    const activeControl=document.activeElement?.getAttribute?.('data-branch-control');
    renderBranches();renderOriginStats();renderHudEstimates();
    if(activeControl)document.querySelector('[data-branch-control="'+activeControl+'"]')
     ?.focus({preventScroll:true});
    if(heroPathPage==='skills')renderPathSkills();
    saveView();
   }
   return target;
  },
  onMastery:(key,requested)=>{
   if(state.masteryAuto!==false||
    !window.PandoraSkillProgression.setTrained(state,key,requested))return false;
   const activeControl=document.activeElement?.getAttribute?.('data-branch-control');
   persist();renderBranches();renderOriginStats();renderHudEstimates();
   if(activeControl)document.querySelector('[data-branch-control="'+activeControl+'"]')
    ?.focus({preventScroll:true});
   if(heroPathPage==='skills')renderPathSkills();
   saveView();return true;
  },
  onSkill:skill=>{
   selectedSkill=skill;pathSkillFilter='all';pathSkillQuery='';
   $('pathSkillStatus').value='all';$('pathSkillSearch').value='';
   heroPathPage='skills';renderPathPages();saveView();
   $('pathSkillsTab')?.focus({preventScroll:true});
  },
  onInspect:skill=>{
   selectedSkill=skill;renderPathSkills();
   document.querySelector('[data-skill-id="'+String(skill.id)+'"]')
    ?.focus({preventScroll:true});
  }
 };
}
function renderBranches(){
 const groups=window.PandoraGameNavigation.groups;
 if(!pathGroupTouched&&catalog.classes?.[jobKeys[state.job]]){
  // Choose the profession's strongest skill group, not the FIRST nonzero one.
  // CLERIC should start at Prayer (230 cap sum), MAGE at Magic, WARRIOR at Melee.
  const ranked=groups.map(group=>({
   id:group.id,
   total:group.branches.filter(key=>key!=='race')
    .reduce((sum,key)=>sum+branchCap(key),0)
  })).sort((a,b)=>b.total-a.total);
  if(ranked[0]?.total>0)selectedSkillGroup=ranked[0].id;
 }
 const selected=groups.find(g=>g.id===selectedSkillGroup)||null;
 if(selected&&(inlineBranchId===null||(inlineBranchId&&!selected.branches.includes(inlineBranchId)))){
  inlineBranchId=selected.branches.find(id=>id!=='race'&&branchCap(id)>0)||
   selected.branches.find(id=>id!=='race')||'';
 }
 if($('pathAutoMastery'))$('pathAutoMastery').checked=state.masteryAuto!==false;
 const target=$('skillBranches'),previous=target.scrollTop;
 window.PandoraHeroPath.viewGrowth(target,heroPathApi());
 const restored=pathScrollRestored?previous:Math.max(0,Number(bootView.pathScroll)||0);
 target.scrollTop=restored;
 if(catalog.live)pathScrollRestored=true;
}
function renderPathSkills(){
 window.PandoraHeroPath.viewSkills($('pathSkillGallery'),$('pathSkillDetails'),heroPathApi());
}
function renderPathPages(){
 const grow=heroPathPage==='growth';
 $('pathGrowthPage').hidden=!grow;$('pathSkillsPage').hidden=grow;
 for(const [id,on]of[['pathGrowthTab',grow],['pathSkillsTab',!grow]]){
  $(id).classList.toggle('chosen',on);
  $(id).setAttribute('aria-selected',String(on));
 }
 if(!grow)renderPathSkills();
}
function branchRow(b,full){
 const pts=window.PandoraSkillProgression.potential(state,b.id);
 return h('button',{class:'branch-row',text:pts+' '+b.name+' · мастерство '+
  window.PandoraSkillProgression.trained(state,b.id),
  onclick:()=>{selectedSkillGroup=window.PandoraGameNavigation.branchGroup(b.id)?.id||selectedSkillGroup;
   inlineBranchId=b.id;heroPathPage='growth';renderBranches();renderPathPages()}});
}
function render(){state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);const hudName=document.getElementById('psHudName');if(hudName)hudName.textContent=state.name||'Без имени';const hudLevel=document.getElementById('psHudLevel');if(hudLevel)hudLevel.textContent=String(state.level);const logo=document.querySelector('.brand img');if(logo)logo.src=override['visual.logo']||'assets/pandora-logo.png';renderRaces();renderJobs();renderOriginTabs();$('genderF').classList.toggle('chosen',state.gender===0);
 $('raceSexInfo').textContent=['Пол по выбранному образу','Пол по выбранному образу',
 'Цверг · выбор пола недоступен','Мирина · женский','Энкиду · мужской','Кролль · бесполый'][state.race];$('genderM').classList.toggle('chosen',state.gender===1);const genderAllowed=window.PandoraUIPlanner.raceHasGender(races,state.race);$('genderF').disabled=!genderAllowed;$('genderM').disabled=!genderAllowed;$('swapGender').disabled=!genderAllowed;$('genderF').title=$('genderM').title=genderAllowed?'Выбор варианта портрета':'Для этой расы нет отдельных вариантов портрета';$('hero').src=raceSource(state.race,state.gender);$('hero').dataset.editKey='visual.race.'+state.race+'.'+(state.gender?'m':'f');$('hero').classList.toggle('admin-edit',adminEditing);$('hero').alt=races[state.race][0];$('raceTitle').textContent=editableValue('race.'+state.race,races[state.race][0]);$('jobTitle').textContent=editableValue('job.'+state.job,jobs[state.job]);$('activeJob').textContent=$('jobTitle').textContent;$('level').value=state.level;$('levelOut').textContent=state.level;renderSlotRails();renderStagePicker();renderStageAttributes();renderOriginPassives();renderOriginStats();renderBranches();refreshBudgetLabel();renderPathPages();renderDetails();const title=document.querySelector('[data-edit-key="site.title"]'),subtitle=document.querySelector('[data-edit-key="site.subtitle"]');if(title)title.textContent=editableValue('site.title','Создай свою легенду');if(subtitle)subtitle.textContent=editableValue('site.subtitle','Выбери расу, профессию, снаряжение и путь развития персонажа.');renderHudEstimates();updateAdminHint()}
function markNode(record){const raw=record?.prerequisite_code||'';const known=(state.branch===3 && record?.legacy_entry_index===0)?'Подтверждённую доступность определяет движок':null;return known||raw||'Условие из архивного каталога'}
function renderDetails(){const titles={character:'Мастерская героя',skills:'Дерево умений',equipment:'Снаряжение и души',stats:'Характеристики',builds:'Библиотека билдов',wiki:'Энциклопедия Pandora Saga'};$('detailTitle').textContent=titles[activeTab];$('detailContent').replaceChildren();const contents={character:renderCharacter,skills:renderSkills,equipment:renderEquipment,stats:renderStats,builds:renderBuilds,wiki:renderWiki};contents[activeTab]($('detailContent'))}

async function loadWiki(){
 if(wikiIndex)return wikiIndex;
 if(wikiPending)return wikiPending;
 wikiPending=(async()=>{
  const keys=['meta','items','monsters','maps','instances','drops','trades','tables','chests','skills','souls'];
  const data={};
  let cursor=0;
  async function one(){
   while(cursor<keys.length){
    const key=keys[cursor++];
    let response;
    try{
     response=await fetch(API+'/api/catalog/'+key+'.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});
     if(!response.ok)throw Error('Cloudflare D1 HTTP '+response.status);
    }catch{
     response=await fetch('./data/os/'+key+'.json',{cache:'no-cache'});
    }
    if(!response.ok)throw Error('Недоступны данные энциклопедии: '+key);
    data[key]=await response.json();
   }
  }
  await Promise.all([one(),one(),one(),one()]);
  wikiData=data;wikiIndex=window.PandoraWikiData.build(data);
  return wikiIndex;
 })().finally(()=>wikiPending=null);
 return wikiPending;
}
function openWiki(type,id,highlight=null){
 wikiSelection={type,id:String(id),highlight:highlight==null?null:String(highlight)};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 location.hash='wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+(highlight!=null?'/'+encodeURIComponent(highlight):'');
 renderDetails();$('detailContent').scrollTop=0;showWorkbench();
}
function wikiLink(text,type,id,highlight=null){
 const href='#wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+(highlight==null?'':'/'+encodeURIComponent(highlight));
 return h('a',{class:'wiki-link',href,text,onclick:event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();openWiki(type,id,highlight);
 }});
}
function renderWiki(root){
 const browse=h('div',{class:'wiki-list'}),detail=h('article',{class:'wiki-page'});
 const controls=h('div',{class:'wiki-controls'}),categories=h('div',{class:'wiki-categories'});
 for(const [key,label]of[['item','Предметы'],['monster','Монстры'],['map','Локации'],['npc','NPC-обмен'],['chest','Сундуки'],['instance','Подземелья'],['skill','Навыки'],['soul','Души']]){
  categories.append(h('button',{class:wikiSelection.type===key?'chosen':'',text:label,onclick:()=>{wikiSelection={type:key,id:null,highlight:null};wikiSearch='';wikiShown=100;renderDetails()}}));
 }
 const search=h('input',{type:'search',value:wikiSearch,placeholder:'Поиск по названию или ID','aria-label':'Поиск по вики'});
 controls.append(categories,search);
 const layout=h('div',{class:'wiki-layout'});
 layout.append(browse,detail);root.append(controls,layout);
 const dataName=(type,id)=>{
  const obj=type==='item'?wikiData.items?.[id]:type==='monster'?wikiData.monsters?.[id]:type==='map'?wikiData.maps?.[id]:type==='skill'?wikiData.skills?.[id]:type==='soul'?wikiData.souls?.[id]:type==='instance'?wikiData.instances?.find(x=>String(x.id)===String(id)):null;
  const en=officialEnglish?.[type==='item'?'items':type==='monster'?'monsters':type==='map'?'maps':type==='instance'?'instances':type==='skill'?'skills':type==='soul'?'souls':'']?.[id]?.n;
  return lang==='en'&&en?en:obj?.name||String(id);
 };
 const draw=()=>{
  const previousScroll=browse.scrollTop;
  browse.replaceChildren();detail.replaceChildren();
  const type=wikiSelection.type;
  const catalog=type==='item'?wikiData.items:type==='monster'?wikiData.monsters:type==='map'?wikiData.maps:
    type==='npc'?wikiData.trades?.npcs:type==='skill'?wikiData.skills:type==='soul'?wikiData.souls:type==='instance'?Object.fromEntries((wikiData.instances||[]).map(i=>[i.id,i])):Object.fromEntries((wikiData.chests?.boxes||[]).map(item=>[item.i,item]));
  const q=wikiSearch.toLocaleLowerCase().trim();
  const results=Object.entries(catalog||{}).filter(([id,rec])=>
    !q||id.includes(q)||String(rec.name||'').toLocaleLowerCase().includes(q)||String(dataName(type,id)).toLocaleLowerCase().includes(q)
  );
  const visible=results.slice(0,wikiShown);
  browse.append(h('p',{class:'muted',text:'Показано '+visible.length+' из '+results.length+' записей'}));
  for(const [id,rec]of visible){
   const row=wikiLink(dataName(type,id),type,id);
   if(type==='item'||type==='soul'||type==='skill'){
    const src=type==='skill'?skillIcon(rec.branch,id,rec):itemIcon(rec,type==='soul'?'souls':'items');
    if(src){
     const icon=h('img',{src,alt:'',loading:'lazy',class:'wiki-list-icon'});
     icon.onerror=()=>icon.remove();
     row.prepend(icon);
    }
   }
   if(wikiSelection.id===id)row.classList.add('selected');
   browse.append(row);
  }
  if(results.length>wikiShown){
   browse.append(h('button',{type:'button',class:'wiki-more',text:'Показать ещё '+Math.min(100,results.length-wikiShown)+' / '+(results.length-wikiShown),
    onclick:()=>{wikiShown+=100;draw()}}));
  }
  browse.scrollTop=previousScroll;
  const id=wikiSelection.id,rec=id==null?null:catalog?.[id];
  if(!rec){detail.append(h('p',{class:'muted',text:'Выбери запись для просмотра характеристик и связанных источников.'}));return}
  detail.append(h('small',{class:'eyebrow',text:type+' · '+id}),h('h3',{text:dataName(type,id)}));
  if(type==='item'){
    const src=itemIcon(rec);
    if(src){const img=h('img',{src,alt:'',class:'wiki-record-icon wiki-item-portrait'});img.onerror=()=>img.remove();detail.prepend(img)}
  }
  if(rec.desc){const text=lang==='en'?(officialEnglish?.[type==='item'?'items':type==='monster'?'monsters':type==='skill'?'skills':type==='soul'?'souls':'maps']?.[id]?.d||rec.desc):rec.desc;
    detail.append(h('p',{class:'wiki-description',text:type==='item'?window.PandoraItemPresentation.description(text):text}));}
  if(type==='item'){
    const dl=h('dl',{class:'item-fields'});
    for(const [label,value]of[['Тип',window.PandoraItemPresentation.kind(rec)],['Уровень',rec.level],['Атака',rec.W],['Защита',rec.AC],['Гнёзда',rec.soulslot]])if(value!=null)dl.append(h('dt',{text:label}),h('dd',{text:String(value)}));
    detail.append(dl,h('h4',{text:'Где получить'}));
    const found=wikiIndex.sources(id);
    if(!found.length)detail.append(h('p',{class:'muted',text:'Подтверждённые источники в доступном каталоге не найдены.'}));
    for(const row of found.slice(0,80)){
     const line=h('div',{class:'wiki-entry'+(wikiSelection.highlight===String(row.id)?' highlighted':'')});
     if(row.type==='monster'){
      line.append(wikiLink('Монстр: '+dataName('monster',row.id)+(row.percent!=null?' · '+row.percent+'% по таблице':'')+(row.kind==='conditional'?' · условный дроп':''),'monster',row.id,id));
      for(const loc of wikiIndex.locations(row.id).slice(0,3))if(loc.type==='map')line.append(wikiLink('◈ '+loc.name,'map',loc.id,row.id));
     }else if(row.type==='npc')line.append(wikiLink('Обмен у '+(wikiData.trades.npcs?.[row.id]?.name||'NPC '+row.id),'npc',row.id,id));
     else if(row.type==='chest')line.append(wikiLink('Сундук '+row.id+' · группа '+row.roll+(row.percent==null?'':' · '+row.percent+'% в группе'),'chest',row.id,id));
     else line.append(wikiLink('Групповой дроп, локация '+dataName('map',row.id)+' (точный шанс предмета неизвестен)','map',row.id,id));
     detail.append(line);
    }
  }else if(type==='skill'){
    detail.append(h('p',{class:'muted',text:'Уровень персонажа '+(rec.charLevel??'—')+' · ОМ '+(rec.mana??'—')+' · перезарядка '+(rec.cooldown??'—')+' с'}));
    detail.append(h('h4',{text:'Требования'}));
    if(!rec.reqs?.length)detail.append(h('p',{class:'muted',text:'Ветка требований не указана'}));
    for(const req of rec.reqs||[])detail.append(h('p',{class:'wiki-entry',text:(wikiData.meta?.branchLabels?.[req.branch]||req.branch)+' ≥ '+req.amount}));
    const icon=skillIcon(rec.branch,id,rec);
    if(icon){const image=h('img',{src:icon,alt:'',class:'wiki-record-icon'});image.onerror=()=>image.remove();detail.prepend(image)}
  }else if(type==='soul'){
    detail.append(h('p',{class:'muted',text:'Совместимые слоты: '+(rec.slots||[]).join(', ')}));
    if(rec.price!=null)detail.append(h('p',{class:'muted',text:'Цена по каталогу: '+rec.price}));
    detail.append(h('p',{class:'muted',text:'Данные эффектов сохранены в D1. Точный расчёт боевых бонусов пока не подтверждён.'}));
    const icon=itemIcon(rec,'souls');
    if(icon){const image=h('img',{src:icon,alt:'',class:'wiki-record-icon'});image.onerror=()=>image.remove();detail.prepend(image)}
  }else if(type==='monster'){
    detail.append(h('p',{class:'muted',text:'Уровень '+(rec.level??'—')+' · HP '+(rec.life??'—')}));
    detail.append(h('h4',{text:'Места появления'}));
    for(const loc of wikiIndex.locations(id))detail.append(wikiLink(loc.name,loc.type,loc.id,id));
    detail.append(h('h4',{text:'Выпадающие предметы'}));
    for(const row of wikiIndex.drops(id)){
     const entry=h('div',{class:'wiki-entry'+(wikiSelection.highlight===row.itemId?' highlighted':'')});
     const item=wikiData.items?.[row.itemId];
     const linked=wikiLink(dataName('item',row.itemId)+(row.percent==null?'':' · '+row.percent+'% по таблице')+(row.kind==='conditional'?' · особое условие':''),'item',row.itemId,id);
     if(item?.icon){
      const image=h('img',{src:itemIcon(item),alt:'',loading:'lazy',class:'wiki-list-icon'});
      image.onerror=()=>image.remove();linked.prepend(image);
     }
     entry.append(linked);
     detail.append(entry);
    }
  }else if(type==='npc'){
    detail.append(h('h4',{text:'Обменные предметы'}));
    for(const trade of wikiIndex.trades(id)){
     const entry=h('div',{class:'wiki-entry'+(wikiSelection.highlight===String(trade.i)?' highlighted':'')});
     entry.append(wikiLink(dataName('item',trade.i),'item',trade.i,id));
     if(trade.mats?.length)entry.append(h('small',{text:'Материалы: '+trade.mats.map(m=>dataName('item',m.i)+' ×'+m.n).join(' · ')}));
     detail.append(entry);
    }
  }else if(type==='map'||type==='instance'){
    detail.append(h('h4',{text:'Монстры в локации'}));
    for(const mob of rec.mobs||[]){
     const entry=h('div',{class:'wiki-entry'+(wikiSelection.highlight===String(mob)?' highlighted':'')});
     entry.append(wikiLink(dataName('monster',mob),'monster',mob));detail.append(entry);
    }
  }else{
    detail.append(h('h4',{text:'Содержимое сундука по группам'}));
    for(const [i,group]of(rec.rolls||[]).entries()){
     detail.append(h('p',{class:'muted',text:'Группа '+(i+1)}));
     for(const row of group){
      const entry=h('div',{class:'wiki-entry'+(wikiSelection.highlight===String(row.i)?' highlighted':'')});
      entry.append(wikiLink(dataName('item',row.i)+(row.p==null?'':' · '+row.p+'% внутри группы'),'item',row.i,id));detail.append(entry);
     }
    }
  }
 };
 browse.append(h('p',{class:'muted',text:'Загружаю записи из собственной D1…'}));
 loadWiki().then(()=>{if(root.isConnected&&activeTab==='wiki')draw()}).catch(e=>{if(root.isConnected)detail.append(h('p',{class:'item-incompatible',text:'Данные вики недоступны: '+e.message}))});
 search.addEventListener('input',()=>{wikiSearch=search.value;wikiShown=100;browse.scrollTop=0;if(wikiIndex)draw()});
 if(wikiIndex)draw();
}

function renderProfile(root){
 const profile=state.profile&&typeof state.profile==="object"?state.profile:{};
 const view=h("div",{class:"ps-profile-grid"});
 const left=h("section",{class:"ps-profile-art"});
 left.append(h("img",{src:raceSource(state.race,state.gender),alt:"Облик расы "+races[state.race][0]}),
 h("strong",{text:state.name||"Без имени"}),h("small",{text:races[state.race][0]+" · "+jobs[state.job]+" · "+state.level+" ур."}));
 const right=h("section",{class:"ps-profile-info"});
 const fields=[["name","Имя героя",state.name||"",64],["guild","Гильдия",profile.guild||"",80],
 ["nation","Нация",profile.nation||"",80],["rank","Ранг",profile.rank||"",80]];
 for(const [key,label,value,max]of fields){
   const row=h("label",{class:"ps-profile-row"});
   const input=h("input",{type:"text",maxLength:String(max),value,"aria-label":label,placeholder:label});
   input.addEventListener("input",()=>{
    if(key==="name"){state.name=input.value;const hud=document.getElementById("psHudName");if(hud)hud.textContent=state.name||"Без имени"}
    else{state.profile??={};state.profile[key]=input.value}
    persist();
   });
   row.append(h("span",{text:label}),input);right.append(row);
 }
 const bio=h("label",{class:"ps-profile-row ps-profile-bio"});
 const description=h("textarea",{rows:"5",maxLength:"500",placeholder:"Описание героя — сохраняется в билде","aria-label":"О себе"});
 description.value=typeof profile.about==="string"?profile.about:"";
 description.addEventListener("input",()=>{state.profile??={};state.profile.about=description.value;persist()});
 bio.append(h("span",{text:"О себе"}),description);right.append(bio);
 right.append(h("p",{class:"muted",text:"Поля профиля — пользовательские заметки в билде. Нация, честь и ранг не сверяются с игровым сервером и не участвуют в расчётах."}));
 view.append(left,right);root.append(view);
}
function renderCharacter(root){
 if(characterPanelTab!=='profile')characterPanelTab='character';
 const tabs=h("div",{class:"ps-character-tabs",role:"tablist","aria-label":"Окно персонажа"});
 const selection=[["character","Персонаж"],["profile","Профиль"]];
 for(const[key,label]of selection){
  tabs.append(h("button",{role:"tab","aria-selected":String(characterPanelTab===key),class:characterPanelTab===key?"chosen":"",
   text:label,onclick:()=>{characterPanelTab=key;renderDetails()}}));
 }
 root.append(tabs);
 const body=h("section",{class:"ps-character-body"});
 if(characterPanelTab==="profile")renderProfile(body);
 else{
  const cards=h("div",{class:"ps-overview-grid"});
  cards.append(h("div",{class:"ps-overview-card"},[h("span",{text:"Раса"}),h("strong",{text:races[state.race][0]})]),
   h("div",{class:"ps-overview-card"},[h("span",{text:"Профессия"}),h("strong",{text:jobs[state.job]})]),
   h("div",{class:"ps-overview-card"},[h("span",{text:"Уровень"}),h("strong",{text:String(state.level)})]));
  body.append(cards);
  const racialTitle=h('div',{class:'subhead',text:'✦ '+(lang==='en'?'Racial passive — choose one':'Расовая пассивка — выбери одну из трёх')});
  const passivePicker=h('div',{class:'race-passive-picker'});
  const passives=window.PandoraGameNavigation.racePassiveIds(catalog.racialPassives,state.race);
  if(!passives.length)passivePicker.append(h('p',{class:'muted',text:'Загружаю расовые способности…'}));
  for(const id of passives){
    const skill=catalog.skills?.[id],selected=String(state.racialPassiveId)===String(id);
    if(!skill)continue;
    const button=h('button',{class:'race-passive-choice'+(selected?' selected':''),'aria-pressed':String(selected),
      onclick:()=>{state.racialPassiveId=id;persist();renderDetails()}});
    const src=skillIcon('race',id,skill);
    const image=h('img',{src,alt:'',loading:'lazy'});
    image.onerror=()=>image.replaceWith(h('span',{text:'✦',class:'skill-fallback'}));
    button.append(image,h('strong',{text:skill.name}),h('span',{text:skill.desc||'Описание отсутствует'}),h('small',{text:selected?'✓ Выбрано':'Выбрать'}));
    passivePicker.append(button);
  }
  body.append(racialTitle,passivePicker);
  body.append(h("p",{class:"muted",text:"Умения развиваются в «Пути героя», а очки характеристик распределяются в «Происхождении». Других редакторов этих значений здесь нет."}));
  const jump=h("div",{class:"ps-overview-actions"});
  jump.append(h("button",{class:"button-action",text:"⚔ Путь героя · умения",onclick:()=>{
   closeWorkbench();heroPathPage='skills';renderPathPages();saveView();
   $('pathSkillsTab')?.focus({preventScroll:true});
  }}));
  jump.append(h("button",{class:"button-action",text:"✥ Базовые характеристики",onclick:()=>{
   closeWorkbench();originActive='stats';renderOriginTabs();saveView();
  }}));
  jump.append(h("button",{class:"button-action",text:"✎ Изменить профиль",onclick:()=>{
   characterPanelTab='profile';renderDetails();
  }}));
  body.append(jump);
 }
 root.append(body);
}
// Legacy duplicate skill editor retired; all changes happen in the live Hero Path.
function renderSkills(root){
 root.append(h('p',{class:'muted',text:'Умения доступны в правой панели «Путь героя». Здесь нет отдельного редактора.'}));
 root.append(h('button',{class:'button-action',text:'Перейти к умениям',onclick:()=>{
  closeWorkbench();heroPathPage='skills';renderPathPages();saveView();
 }}));
}
function isCostumeOverlay(item){return Boolean(item&&(item.isCostumeOverlay===true||String(item.kind||'').startsWith('DECO_')))}
function itemName(r){return r?.name?.en||r?.names?.en||r?.name||r?.id||'Без названия'}
let catalogBrowseSlot='all';
function renderEquipment(root){
 const types=[['all','Все типы'],['weapon','Оружие'],['shield','Щиты'],['head','Шлемы'],
 ['body','Нагрудники'],['gloves','Перчатки'],['legs','Поножи'],['feet','Обувь'],
 ['cloak','Плащи'],['ring','Кольца'],['neck','Амулеты'],['belt','Пояса'],['ear','Серьги']];
 const inventory=Object.values(catalog.equipment||{}).filter(rec=>rec&&slotKeys.includes(rec.slot))
  .map(rec=>itemWithOverrides(rec));
 const head=h('div',{class:'equipment-catalog-head'});
 head.append(h('h3',{text:'Коллекция предметов Pandora Saga'}),
  h('p',{class:'muted',text:'Полный справочник экипировки по загруженному каталогу. Надетые вещи изменяются только в портрете персонажа.'}));
 const row=h('div',{class:'equipment-catalog-toolbar'});
 const search=h('input',{type:'search',value:filter,placeholder:'Поиск названия или ID',
  'aria-label':'Поиск предметов',
  oninput:e=>{filter=e.target.value;gearShown=60;renderDetails();
   const input=document.querySelector('.equipment-catalog-toolbar input');
   input?.focus({preventScroll:true});input?.setSelectionRange(filter.length,filter.length)}});
 const select=h('select',{'aria-label':'Тип предмета',onchange:e=>{
  catalogBrowseSlot=e.target.value;gearShown=60;renderDetails();
 }});
 for(const [value,label]of types){
  const option=h('option',{value,text:label});
  if(catalogBrowseSlot===value)option.selected=true;
  select.append(option);
 }
 row.append(search,select);
 const view=h('div',{class:'gear-view-options'});
 for(const [key,label]of [['grid','▦ Сетка'],['list','☰ Список']]){
  view.append(h('button',{type:'button',text:label,class:gearDisplayMode===key?'chosen':'',
   'aria-pressed':String(gearDisplayMode===key),onclick:()=>{
    gearDisplayMode=key;localStorage.setItem('ps-gear-view',key);renderDetails();
   }}));
 }
 row.append(view);head.append(row);root.append(head);
 const q=filter.trim().toLocaleLowerCase('ru');
 const matches=inventory.filter(rec=>(catalogBrowseSlot==='all'||rec.slot===catalogBrowseSlot)&&
  (itemName(rec)+' '+rec.id).toLocaleLowerCase('ru').includes(q));
 root.append(h('p',{class:'muted item-count',
  text:matches.length+' предметов · показано '+Math.min(gearShown,matches.length)}));
 const layout=h('div',{class:'equipment-catalog-layout'});
 const collection=h('div',{class:'gear-list'+(gearDisplayMode==='grid'?' inventory-grid':' inventory-list')});
 const inspector=h('aside',{class:'item-info'});
 function inspect(rec){
  inspector.replaceChildren(h('h3',{text:'Сведения о предмете'}));
  if(!rec){inspector.append(h('p',{class:'muted',text:'Наведи курсор или выбери предмет.'}));return}
  inspector.append(window.PandoraStageItemUI.summary(rec,(r)=>itemIcon(r)));
  if(isCostumeOverlay(rec))inspector.append(h('p',{class:'muted',text:'Декоративный предмет: боевые свойства не применяются.'}));
  inspector.append(wikiLink('📜 Источники и подробности','item',String(rec.id)));
  const sources=h('div',{class:'item-origin'});
  inspector.append(sources);
  loadWiki().then(index=>{
   if(!sources.isConnected)return;
   const rows=index.sources(rec.id);sources.replaceChildren(h('h4',{text:'Где получить'}));
   if(!rows.length){sources.append(h('p',{class:'muted',text:'Подтверждённый источник не указан'}));return}
   for(const entry of rows.slice(0,5)){
    const label=entry.type==='monster'?'Монстр':entry.type==='npc'?'NPC':
     entry.type==='chest'?'Сундук':'Локация';
    const key=entry.type==='drop'?'map':entry.type;
    sources.append(wikiLink(label+' · '+entry.id,key,String(entry.id),String(rec.id)));
   }
  }).catch(()=>{if(sources.isConnected)sources.textContent='Источники пока недоступны'});
 }
 for(const rec of matches.slice(0,gearShown)){
  const card=h('button',{class:'item-card',type:'button',title:itemName(rec),
   'aria-label':'Сведения о '+itemName(rec),
   onmouseenter:()=>inspect(rec),onfocus:()=>inspect(rec),onclick:()=>inspect(rec)});
  const src=itemIcon(rec);
  if(src){const image=h('img',{src,alt:'',loading:'lazy'});
   image.onerror=()=>image.replaceWith(h('span',{class:'item-glyph',text:'✦'}));card.append(image)}
  else card.append(h('span',{class:'item-glyph',text:'✦'}));
  card.append(h('strong',{text:itemName(rec)}),
   h('small',{text:window.PandoraItemPresentation.kind(rec)+' · ID '+rec.id}));
  collection.append(card);
 }
 if(!matches.length)collection.append(h('p',{class:'muted',text:'Ничего не найдено. Попробуй другой фильтр.'}));
 if(matches.length>gearShown)collection.append(h('button',{class:'button-action show-more',
  text:'Показать ещё · '+(matches.length-gearShown),onclick:()=>{gearShown+=60;renderDetails()}}));
 layout.append(collection,inspector);root.append(layout);inspect(null);
}
function renderStats(root){
 const icons=['♥','⚔','➶','✥','✦','❂'];
 const overview=h('div',{class:'stat-editor-overview'}),header=h('h3',{text:'Характеристики'});
 const points=h('div',{class:'stat-total'},[h('strong',{text:'—'}),h('span',{text:'Свободные очки'})]);
 overview.append(header,points);root.append(overview);
 const hpmp=previewBaseStats();
 if(hpmp)root.append(h('p',{class:'stat-brief-vitals',text:'ОЗ ≈'+hpmp.hp+' · ОМ ≈'+hpmp.mp}));
 const grid=h('div',{class:'stat-grid'}),controls=[];
 function refresh(){
  const s=attributeSnapshot();
  points.querySelector('strong').textContent=s?String(s.remaining):'—';
  points.querySelector('span').textContent=s?'Свободно из '+s.total:'Свободные очки';
  overview.classList.toggle('over-budget',!!s?.overBudget);
  for(const v of controls){
   const invested=Number(state.stats[STATS[v.i]]||0),base=s?.base[v.i];
   v.note.textContent=base===undefined?'':'База '+base+' + '+invested;
   v.total.textContent=base===undefined?'—':String(base+invested);
   v.range.value=String(invested);v.exact.value=String(invested);
   v.range.max=String(Math.max(invested,(s?.max[v.i]??99)-(base??0)));
   v.fill.style.width=s&&s.max[v.i]>0?Math.min(100,(base+invested)/s.max[v.i]*100)+'%':'0%';
   v.minus.disabled=!s||invested===0;
   v.plus.disabled=!window.PandoraAttributeProgression.allowed(s,v.i,invested+1);
   v.range.disabled=!s;v.exact.disabled=!s;
   v.plus.title='Стоимость +1: '+(window.PandoraAttributeProgression.nextCost(s,v.i)??'максимум');
  }
 }
 ORIGIN_STAT_LABELS.forEach((info,i)=>{
  const s=attributeSnapshot(),card=h('section',{class:'stat-card stat-visual-editor'});
  const head=h('div',{class:'stat-visual-head'},[
   h('span',{class:'stat-emblem',text:icons[i]}),
   h('h3',{text:info.name}),h('span',{class:'stat-visual-cap',text:s?'Макс. '+s.max[i]:''})
  ]);
  const note=h('span',{class:'stat-base-note',text:''}),total=h('strong',{class:'stat-visual-value',text:'—'});
  const bar=h('div',{class:'stat-visual-progress'}),fill=h('div',{class:'stat-visual-fill'});
  bar.append(fill);
  const range=h('input',{type:'range',min:'0',max:'99',step:'1',value:String(state.stats[STATS[i]]||0),
   'aria-label':info.name+' — вложено'});
  const exact=h('input',{type:'number',min:'0',max:'99',step:'1',value:String(state.stats[STATS[i]]||0),
   'aria-label':'Точное значение '+info.name});
  const change=value=>{
   if(!setAttributePoints(i,Number(value))){refresh();return}
   refresh();renderOriginStats();
   const vitals=root.querySelector('.stat-brief-vitals'),v=previewBaseStats();
   if(vitals&&v)vitals.textContent='ОЗ ≈'+v.hp+' · ОМ ≈'+v.mp;
  };
  const minus=h('button',{type:'button',text:'−',onclick:()=>change(Math.max(0,Number(state.stats[STATS[i]]||0)-1))});
  const plus=h('button',{type:'button',text:'+',onclick:()=>change(Number(state.stats[STATS[i]]||0)+1)});
  range.addEventListener('input',()=>change(range.value));
  exact.addEventListener('change',()=>change(exact.value));
  card.append(head,note,total,bar,h('div',{class:'stat-visual-controls'},[minus,range,plus,exact]));
  controls.push({i,note,total,range,exact,fill,minus,plus});grid.append(card);
 });
 root.append(grid);refresh();
}
function compareSnapshots(a,b){
 const rows=[];const lib=window.PandoraEquipmentPlan;
 if(a.race!==b.race||a.job!==b.job||a.level!==b.level)rows.push('Персонаж: '+(jobs[a.job]||'?')+' → '+(jobs[b.job]||'?')+' · уровень '+a.level+' → '+b.level);
 for(const branch of branches){const p=a.points?.[branch.id]||0,q=b.points?.[branch.id]||0;if(p!==q)rows.push((catalog.meta?.branchLabels?.[branch.id]||branch.name)+': '+p+' → '+q)}
 for(const stat of STATS){const p=a.stats?.[stat]||0,q=b.stats?.[stat]||0;if(p!==q)rows.push((ORIGIN_STAT_LABELS[STATS.indexOf(stat)]?.name||stat)+': '+p+' → '+q)}
 if((a.masteryAuto!==false)!==(b.masteryAuto!==false))rows.push('Автозаполнение мастерства: '+(a.masteryAuto!==false?'вкл':'выкл')+' → '+(b.masteryAuto!==false?'вкл':'выкл'));
 for(const branch of branches){
  const p=window.PandoraSkillProgression.trained(a,branch.id),q=window.PandoraSkillProgression.trained(b,branch.id);
  if(p!==q)rows.push('Мастерство '+branch.name+': '+p+' → '+q);
 }
 for(let i=0;i<slots.length;i++){
  const x=a.equipment?.[i],y=b.equipment?.[i];if(String(x?.id??'')!==String(y?.id??''))rows.push(slots[i][0]+': '+(x?.name||'пусто')+' → '+(y?.name||'пусто'));
  const xp=lib.refinementValue(a.refinements,i,x),yp=lib.refinementValue(b.refinements,i,y);
  if(xp!==yp)rows.push('Заточка '+slots[i][0]+': +'+xp+' → +'+yp);
  const xa=lib.asSocketArray(a.souls?.[i]),ya=lib.asSocketArray(b.souls?.[i]);
  for(let s=0;s<Math.max(xa.length,ya.length);s++)
   if(String(xa[s]?.id??'')!==String(ya[s]?.id??''))rows.push('Душа '+slots[i][0]+' / '+(s+1)+': '+(xa[s]?.name||'пусто')+' → '+(ya[s]?.name||'пусто'));
 }
 for(const field of ['guild','nation','rank','about']){
  const before=String(a.profile?.[field]||''),after=String(b.profile?.[field]||'');
  if(before!==after)rows.push('Профиль · '+field+': '+before.slice(0,50)+' → '+after.slice(0,50));
 }
 if(String(a.racialPassiveId||'')!==String(b.racialPassiveId||''))rows.push('Расовая пассивка: '+(a.racialPassiveId||'—')+' → '+(b.racialPassiveId||'—'));
 return rows;
}
function restoreLoadedBuildUI(){
 state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);
 racePreviewIndex=selectedPortraitIndex(state.race,state.gender);
 selectedSkillGroup=window.PandoraGameNavigation.branchGroup(state.branch)?.id||'melee';
 selectedSkill=null;inlineBranchId=null;selectedSlot=0;selectedSocket=0;
 stageSlotPickerOpen=false;stageSlotQuery='';stageSlotShown=48;
}
function renderBuilds(root){
 const toolbar=h('div',{class:'build-toolbar'});
 toolbar.append(h('button',{class:'button-action primary',text:'✧ Сохранить текущий билд',
  onclick:()=>saveBuild()}),
  h('button',{class:'button-action',text:'🔗 Поделиться текущим',
   onclick:()=>createShared('build',state)}),
  h('button',{class:'button-action',text:'🔗 Поделиться всей библиотекой',
   disabled:!builds.length,onclick:()=>createShared('library',
    builds.map(b=>({name:b.name,data:b.data})))}));
 root.append(toolbar,h('p',{class:'muted',
  text:'Черновик и сохранённые билды хранятся локально в этом браузере. Ссылка на общий билд публикует снимок, но не меняет ваши локальные сохранения.'}));
 const grid=h('div',{class:'build-grid'});
 for(const b of builds){
  const box=h('div',{class:'build-card'});
  const check=h('input',{type:'checkbox','aria-label':'Сравнить '+b.name});
  check.checked=compareIds.includes(b.id);
  check.onchange=()=>{if(check.checked)compareIds=[...compareIds,b.id].slice(-2);else compareIds=compareIds.filter(id=>id!==b.id);renderDetails()};
  box.append(h('h3',{text:b.name}),h('p',{
   text:(races[b.data?.race]?.[0]||'?')+' · '+(jobs[b.data?.job]||'?')+' · ур. '+(b.data?.level||'?')}),
   h('label',{},[check,' Сравнить']),
   h('button',{class:'button-action primary',text:'Открыть',onclick:()=>{
    // Locally saved builds are trusted snapshots: do not discard newer or legacy
    // fields through the stricter validation used for incoming public links.
    const draft=structuredClone(b.data),base=fresh();
    state={...base,...draft,
     points:{...base.points,...draft.points},stats:{...base.stats,...draft.stats},
     equipment:{...base.equipment,...draft.equipment},
     souls:{...base.souls,...draft.souls},
     refinements:{...base.refinements,...draft.refinements},
     gems:{...base.gems,...draft.gems},
     profile:{...base.profile,...draft.profile}};
    restoreLoadedBuildUI();persist();render();changeTab('character');
   }}),
   h('button',{class:'button-action',text:'🔗 Поделиться',onclick:()=>createShared('build',b.data)}),
   h('button',{class:'button-action',text:'Удалить',onclick:()=>{
    if(!confirm('Удалить сохранённый билд «'+b.name+'»?'))return;
    builds=builds.filter(v=>v.id!==b.id);compareIds=compareIds.filter(id=>id!==b.id);persistBuilds();renderDetails();
   }}));
  grid.append(box);
 }
 root.append(grid);
 if(!builds.length)root.append(h('p',{class:'muted',text:'Сохранённых билдов пока нет.'}));
 if(compareIds.length===2){
  const [a,b]=compareIds.map(id=>builds.find(v=>v.id===id));
  if(a&&b)root.append(h('h3',{text:'Сравнение: '+a.name+' / '+b.name}),
   h('p',{class:'muted',text:compareSnapshots(a.data,b.data).join(' · ')||'Выборы совпадают'}));
 }
}
function newId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
function saveBuild(){
 const name=prompt('Название сохраняемого билда',state.name||'Новый герой');
 if(name===null||!name.trim())return false;
 const entry={id:newId(),name:name.trim().slice(0,70),data:structuredClone(state),at:Date.now()};
 builds.unshift(entry);
 try{localStorage.setItem('ps-build-library.v1',JSON.stringify(builds))}
 catch(error){builds.shift();alert('Не удалось сохранить билд: память браузера заполнена или запрещена. '+error.message);return false}
 if(activeTab==='builds')renderDetails();
 return true;
}
function sanitizeSharedState(original){
 if(!original||typeof original!=='object'||Array.isArray(original)||
   !Number.isInteger(original.race)||original.race<0||original.race>=races.length||
   !Number.isInteger(original.job)||original.job<0||original.job>=jobKeys.length||
   !Number.isInteger(original.level)||original.level<1||original.level>55)
  throw Error('Ссылка содержит некорректные параметры персонажа');
 const safe=fresh();
 safe.race=original.race;safe.gender=original.gender===1?1:0;
 safe.job=original.job;safe.level=original.level;
 if(typeof original.name==='string')safe.name=original.name.slice(0,70);
 if(typeof original.branch==='string'&&branches.some(b=>b.id===original.branch))safe.branch=original.branch;
 for(const field of ['points','stats']){
  if(original[field]&&typeof original[field]==='object'&&!Array.isArray(original[field])){
   const allow=new Set(field==='points'?branches.map(b=>b.id):STATS);
   for(const [key,value] of Object.entries(original[field]))
    if(allow.has(key)&&Number.isInteger(value)&&value>=0&&value<=1000)safe[field][key]=value;
  }
 }
 // Green skill mastery is independent of invested level-up points.
 safe.masteryAuto=original.masteryAuto!==false;
 if(original.mastery&&typeof original.mastery==='object'&&!Array.isArray(original.mastery)){
  const valid=new Set(branches.map(b=>String(b.id)));
  for(const [key,level] of Object.entries(original.mastery)){
   if(valid.has(key)&&Number.isInteger(level)&&level>=0&&level<=1000)
    safe.mastery[key]=Math.min(level,window.PandoraSkillProgression.potential(safe,key));
  }
 }
 const item=v=>{
  if(!v||typeof v!=='object'||!['string','number'].includes(typeof v.id)||String(v.id).length>24)return null;
  const safeItem={id:v.id,name:typeof v.name==='string'?v.name.slice(0,120):String(v.id),
   icon:typeof v.icon==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v.icon)?v.icon:null};
  if(Number.isInteger(v.level)&&v.level>=0&&v.level<=1000)safeItem.level=v.level;
  return safeItem;
 };
 const previousLegwear=item(original.displacedLegwear);
 if(previousLegwear)safe.displacedLegwear=previousLegwear;
 for(let slot=0;slot<slots.length;slot++){
  const eq=item(original.equipment?.[slot]);if(eq)safe.equipment[slot]=eq;
  if(original.souls?.[slot]){
   const souls=window.PandoraEquipmentPlan.asSocketArray(original.souls[slot]);
   const copy=souls.slice(0,32).map(item);
   if(copy.some(Boolean))safe.souls[slot]=copy;
  }
 }
 for(const [key,value] of Object.entries(original.refinements||{}))
  if(/^(?:[0-9]|1[0-3]):[0-9]{1,20}$/.test(key)&&Number.isInteger(value)&&value>=0&&value<=10)
   safe.refinements[key]=value;
 for(const [key,value] of Object.entries(original.gems||{}))
  if(/^(?:[0-9]|1[0-3]):[0-9]{1,20}$/.test(key)){
   const gem=window.PandoraEnchantModel.normalize(value);if(gem)safe.gems[key]=gem;
  }
 for(const key of ['guild','nation','rank','about']){
  const v=original.profile?.[key];
  if(typeof v==='string')safe.profile[key]=v.slice(0,key==='about'?500:80);
 }
 if(Number.isSafeInteger(original.racialPassiveId)&&original.racialPassiveId>=0&&original.racialPassiveId<10000000000)
  safe.racialPassiveId=original.racialPassiveId;
 return safe;
}
async function createShared(type,data){
 const content=type==='build'?sanitizeSharedState(data):
  data.map(row=>({name:String(row.name||'Билд').slice(0,70),data:sanitizeSharedState(row.data)}));
 if(type==='library'&&(content.length===0||content.length>30)){
  alert('Для одной ссылки доступно от 1 до 30 билдов. Библиотека не изменена.');return;
 }
 try{
  const response=await apiRequest('/api/shared',{schema:1,type,data:content},'');
  if(!/^[A-Za-z0-9_-]{11}$/.test(response.id||''))throw Error('Неожиданный ответ сервера');
  const url=location.origin+location.pathname+'#b/'+response.id;
  const message=h('div',{class:'share-result'});
  const field=h('input',{readOnly:true,value:url,'aria-label':'Ссылка на билд'});
  const copy=h('button',{type:'button',class:'button-action primary',text:'Скопировать ссылку',
   onclick:async()=>{
    try{await navigator.clipboard.writeText(url);copy.textContent='✓ Скопировано'}
    catch{field.focus();field.select();copy.textContent='Выдели ссылку и скопируй Ctrl+C'}
   }});
  message.append(h('p',{text:type==='library'?'Ссылка на библиотеку создана.':'Ссылка на билд создана.'}),
   field,copy,h('p',{class:'muted',text:'Это публичный неизменяемый снимок. У другого пользователя появится подтверждение перед заменой активного билда.'}));
  modal('Поделиться',message);
 }catch(error){
  alert('Не удалось создать ссылку. Нужны опубликованный Worker, миграция D1 и доступный сервер. '+error.message);
 }
}
function openSharedSnapshot(share){
 if(!share||share.schema!==1||!['build','library'].includes(share.type))throw Error('Неподдерживаемая ссылка');
 const clear=()=>{if(location.hash.startsWith('#b/'))history.replaceState(history.state,'',location.pathname+location.search)};
 if(share.type==='library'){
  if(!Array.isArray(share.data)||!share.data.length||share.data.length>30)throw Error('Неверная библиотека');
  const added=share.data.map(v=>({id:newId(),name:String(v.name||'Билд').slice(0,70),
   data:sanitizeSharedState(v.data),at:Date.now()}));
  const view=h('div');
  view.append(h('p',{text:'По ссылке найдено '+added.length+' сохранённых билдов. Текущие билды и активный черновик останутся без изменений.'}),
   h('button',{class:'button-action primary',text:'Добавить в мою библиотеку',onclick:()=>{
    const next=[...added,...builds];
    try{localStorage.setItem('ps-build-library.v1',JSON.stringify(next))}
    catch(e){alert('Не удалось сохранить библиотеку: '+e.message);return}
    builds=next;$('modalRoot').hidden=true;clear();changeTab('builds');
   }}));
  modal('Импорт общей библиотеки',view);return;
 }
 const incoming=sanitizeSharedState(share.data);
 const view=h('div');
 view.append(h('p',{text:'Открыть чужой билд «'+incoming.name+'»? Несохранённые изменения текущего персонажа будут заменены.'}),
  h('p',{class:'muted',text:'Сохранённые в «Мои билды» записи при этом не удаляются.'}));
 const apply=()=>{
  state=incoming;restoreLoadedBuildUI();persist();
  $('modalRoot').hidden=true;$('modalRoot').replaceChildren();
  clear();render();changeTab('character');
 };
 view.append(h('button',{class:'button-action primary',text:'Сохранить текущий и открыть',
   onclick:()=>{if(saveBuild())apply()}}),
  h('button',{class:'button-action',text:'Открыть без сохранения',onclick:apply}),
  h('button',{class:'button-action',text:'Отмена',onclick:()=>{
   $('modalRoot').hidden=true;clear();
  }}));
 modal('Открыть билд по ссылке?',view);
}
async function restoreSharedHash(){
 const match=location.hash.match(/^#b\/([A-Za-z0-9_-]{11})$/);
 if(!match)return;
 try{
  const incoming=await apiRequest('/api/shared/'+match[1],null,'');
  openSharedSnapshot(incoming.share);
 }catch(error){
  alert('Не удалось открыть общий билд: '+error.message);
 }
}
function modal(title,content){const root=$('modalRoot');root.replaceChildren();root.hidden=false;const box=h('div',{class:'modal',role:'dialog','aria-modal':'true','aria-label':title});box.append(h('button',{class:'button-action close',text:'× Закрыть',onclick:()=>{root.hidden=true;root.replaceChildren()}}),h('h2',{text:title}),content);root.append(box);root.onclick=e=>{if(e.target===root){root.hidden=true;root.replaceChildren()}};return box}
async function apiRequest(path,body,token=adminToken) {
 let response;
 try {
  response=await fetch(API+path,{
   method:body?"POST":"GET",
   headers:{"Content-Type":"application/json",...(token?{"Authorization":"Bearer "+token}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
 } catch {
  throw new Error("Нет соединения с Cloudflare Worker. Проверь Builds и /api/health. Пароль ещё не проверялся сервером.");
 }
 const data=await response.json().catch(()=>({error:"Сервер вернул ответ без JSON"}));
 if(!response.ok)throw new Error(data.error||("Ошибка сервера HTTP "+response.status));
 return data;
}
function showAdmin(){const body=h('div');body.append(h('p',{class:'muted',text:adminToken?'Режим редактора подтверждён сервером. Изменения сохраняются в Cloudflare D1.':'Вход администратора защищён сервером Cloudflare Worker. Никаких паролей в GitHub Pages нет.'}));if(adminToken){body.append(h('button',{class:'button-action',text:'Импорт каталога D1',onclick:showCatalogImport}));body.append(h('button',{class:'button-action primary',text:adminEditing?'Выключить редактирование':'Включить редактирование',onclick:()=>{adminEditing=!adminEditing;$('modalRoot').hidden=true;render();updateAdminHint()}}),h('button',{class:'button-action',text:'Выйти',onclick:async()=>{try{await apiRequest('/api/admin/logout',{})}catch{}adminToken='';adminEditing=false;ownerEdits.length=0;closeInlineEditor();$('modalRoot').hidden=true;render();updateAdminHint()}}));modal('Управление сайтом',body);return}
 const user=h('input',{value:'administrator',readOnly:true}),password=h('input',{type:'password',placeholder:'Пароль администратора',autocomplete:'current-password'}),setup=h('input',{type:'password',placeholder:'Одноразовый секрет первичной настройки (если ещё нет пароля)'}),feedback=h('div',{class:'error'}),go=h('button',{class:'button-action primary',text:'Войти'});go.onclick=async()=>{feedback.textContent='';try{if(!password.value||password.value.length<12)throw Error('Нужен пароль от 12 символов');const data=await apiRequest(setup.value?'/api/admin/setup':'/api/admin/login',setup.value?{username:'administrator',password:password.value,setupToken:setup.value}:{username:'administrator',password:password.value},'');adminToken=data.token;adminEditing=true;$('modalRoot').hidden=true;render();updateAdminHint()}catch(e){feedback.textContent=e.message}};body.append(h('label',{text:'Логин'}),user,h('label',{text:'Пароль'}),password,h('label',{text:'Первичная настройка (заполняется только один раз)'}),setup,go,feedback,h('p',{class:'muted',text:'Первичная настройка требует секрет ADMIN_SETUP_TOKEN, созданный владельцем в настройках Worker. Это защищает имя administrator от захвата посторонними.'}));const checkApi=h('button',{type:'button',class:'button-action',text:'Проверить Cloudflare API',onclick:async()=>{feedback.textContent='Проверяю сервер…';try{const result=await apiRequest('/api/health',null,'');feedback.textContent=result.status==='ok'?'Worker отвечает, D1 подключена.':'Ответ сервера: '+JSON.stringify(result)}catch(e){feedback.textContent=e.message}}});body.append(checkApi);modal('Служебный вход',body)}
function updateAdminHint(){$('authState').textContent=adminEditing?'✎ Режим редактора · выбери подсвеченный элемент':'';document.querySelectorAll('[data-edit-key]').forEach(el=>el.classList.toggle('admin-edit',adminEditing));refreshOwnerUI()}

/* Authenticated on-page editing; all write actions are checked again by the Worker. */
const ownerEdits=[];
let activeInlineEditor=null;
let editIsSaving=false;
function closeInlineEditor(){
  if(activeInlineEditor){activeInlineEditor.remove();activeInlineEditor=null;}
}
function activeOverride(key){return Object.prototype.hasOwnProperty.call(override,key)?override[key]:null}
function refreshOwnerUI(){
  const dock=document.getElementById('ownerDock');
  if(!adminEditing||!adminToken){closeInlineEditor();dock?.remove();return;}
  if(dock){
    dock.querySelector('[data-owner-count]').textContent='Правок: '+Object.keys(override).length;
    dock.querySelector('[data-owner-undo]').disabled=!ownerEdits.length||editIsSaving;
    return;
  }
  const root=h('aside',{id:'ownerDock',class:'owner-dock',role:'toolbar','aria-label':'Управление сайтом'});
  root.append(h('span',{class:'owner-dock-title',text:'✦ Редактор сайта'}),
    h('span',{'data-owner-count':'',class:'owner-dock-count',text:'Правок: '+Object.keys(override).length}),
    h('button',{type:'button',text:'↶ Отменить','data-owner-undo':'',disabled:!ownerEdits.length,onclick:undoOwnerEdit}),
    h('button',{type:'button',text:'Все правки',onclick:showOverrideManager}),
    h('button',{type:'button',text:'Каталог D1',onclick:showCatalogImport}),
    h('button',{type:'button',text:'Завершить',onclick:()=>{adminEditing=false;closeInlineEditor();render();updateAdminHint()}}));
  document.body.append(root);
}
async function undoOwnerEdit(){
  if(!adminToken||!ownerEdits.length||editIsSaving)return;
  const last=ownerEdits[ownerEdits.length-1];
  editIsSaving=true;refreshOwnerUI();
  try{
    if(last.before===null){await apiRequest('/api/admin/reset',{key:last.key});delete override[last.key];}
    else{await apiRequest('/api/admin/override',{key:last.key,value:last.before});override[last.key]=last.before;}
    ownerEdits.pop();closeInlineEditor();render();updateAdminHint();
  }catch(e){alert('Не удалось отменить изменение: '+e.message)}
  finally{editIsSaving=false;refreshOwnerUI()}
}
function showOverrideManager(){
  if(!adminToken)return;
  const body=h('div',{class:'owner-manager'});
  body.append(h('p',{class:'muted',text:'Это сохранённые настройки оформления Cloudflare D1. Сброс отдельной записи возвращает исходный текст или изображение из кода сайта. История отмены действует в этой вкладке.'}));
  const search=h('input',{type:'search',placeholder:'Найти изменённый элемент…',class:'owner-manager-search'});
  const list=h('div',{class:'owner-manager-list'});
  const draw=()=>{
    list.replaceChildren();
    const q=search.value.toLowerCase();
    const entries=Object.entries(override).filter(([key,value])=>key.toLowerCase().includes(q)||String(value).toLowerCase().includes(q)).sort((a,b)=>a[0].localeCompare(b[0]));
    if(!entries.length)list.append(h('p',{class:'muted',text:'Нет сохранённых записей по этому запросу.'}));
    for(const[key,value]of entries){
      const row=h('div',{class:'owner-manager-row'});
      row.append(h('div',{},[h('strong',{text:key}),h('p',{text:String(value).slice(0,150)})]),
        h('button',{type:'button',text:'Вернуть оригинал',onclick:async()=>{
          if(!confirm('Вернуть оригинальное значение для '+key+'?'))return;
          const previous=activeOverride(key);
          try{await apiRequest('/api/admin/reset',{key});ownerEdits.push({key,before:previous,after:null});delete override[key];draw();render();updateAdminHint();}
          catch(e){alert('Сброс не выполнен: '+e.message)}
        }}));
      list.append(row);
    }
  };
  search.addEventListener('input',draw);body.append(search,list);draw();modal('Правки оформления',body);
}

function allowedArtwork(value){
return /^(?:assets\/[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g)|https:\/\/pandorasaga-os\.com\/icons\/(?:items|souls|skills)\/[A-Za-z0-9_-]+\.webp(?:\?v=[0-9]{1,12})?)$/.test(value);
}
function editor(el){
  const key=el?.dataset?.editKey;
  if(!adminEditing||!adminToken||!key)return;
  closeInlineEditor();
  const visual=key.startsWith('visual.'),slotEdit=key.startsWith('itemslots.');
  const original=visual?(el.getAttribute('src')||''):(el.textContent||'');
  const previous=activeOverride(key);
  const root=h('div',{class:'inline-owner-editor',role:'dialog','aria-label':'Изменение '+key});
  const bar=h('div',{class:'inline-owner-head'});
  bar.append(h('strong',{text:visual?'Сменить изображение':'Изменить текст'}),
    h('button',{type:'button',text:'✕','aria-label':'Закрыть редактор',onclick:closeInlineEditor}));
  const input=visual?h('input',{type:'text','aria-label':'Путь к изображению',value:original,placeholder:'assets/image.webp'}):slotEdit?h('input',{type:'number',min:'0',max:'32',step:'1',value:original,'aria-label':'Число гнёзд'}):
    h('textarea',{rows:key.startsWith('skilldesc.')?5:3,'aria-label':'Редактируемый текст'});
  if(!visual)input.value=original;
  const hint=h('p',{class:'inline-owner-key',text:key});
  const feedback=h('p',{class:'inline-owner-error',role:'status'});
  root.append(bar,hint);
  if(visual){
    const preview=h('img',{class:'inline-owner-preview',src:original,alt:'Предпросмотр'});
    input.addEventListener('input',()=>{if(allowedArtwork(input.value.trim()))preview.src=input.value.trim()});
    root.append(preview);
    const gallery=h('div',{class:'inline-owner-gallery'});
    for(const src of [...new Set(['assets/pandora-logo.png',...races.flatMap(r=>[imageUrl(r[2]),imageUrl(r[3])])])]){
      const button=h('button',{type:'button',title:src,'aria-label':'Выбрать '+src,onclick:()=>{input.value=src;preview.src=src}});
      button.append(h('img',{src,alt:''}));gallery.append(button);
    }
    root.append(gallery);
  }
  root.append(input);
  const actions=h('div',{class:'inline-owner-actions'});
  const save=h('button',{type:'button',class:'primary',text:'Сохранить'});
  const reset=h('button',{type:'button',text:'Вернуть оригинал',disabled:previous===null});
  const cancel=h('button',{type:'button',text:'Отмена',onclick:closeInlineEditor});
  save.onclick=async()=>{
    if(editIsSaving)return;
    const value=input.value.trim();
    if(slotEdit?!/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(value):visual?!allowedArtwork(value):(!value||value.length>((key.startsWith('skilldesc.')||key.startsWith('itemdesc.'))?2000:240))){
      feedback.textContent=visual?'Недопустимый путь: разрешены assets/ и иконки Pandora Saga OS.':'Некорректная длина текста.';return;
    }
    if(value===previous){closeInlineEditor();return;}
    editIsSaving=true;save.disabled=true;reset.disabled=true;
    try{
      await apiRequest('/api/admin/override',{key,value});
      ownerEdits.push({key,before:previous,after:value});override[key]=value;
      closeInlineEditor();render();updateAdminHint();
    }catch(e){feedback.textContent=e.message}
    finally{editIsSaving=false;save.disabled=false;reset.disabled=false;refreshOwnerUI()}
  };
  reset.onclick=async()=>{
    if(editIsSaving||previous===null)return;
    editIsSaving=true;reset.disabled=true;save.disabled=true;
    try{
      await apiRequest('/api/admin/reset',{key});
      ownerEdits.push({key,before:previous,after:null});delete override[key];
      closeInlineEditor();render();updateAdminHint();
    }catch(e){feedback.textContent=e.message}
    finally{editIsSaving=false;reset.disabled=false;save.disabled=false;refreshOwnerUI()}
  };
  actions.append(save,reset,cancel);
  root.append(actions,feedback);
  const width=Math.min(390,window.innerWidth-24);
  const rect=el.getBoundingClientRect();
  root.style.width=width+'px';
  root.style.left=Math.min(Math.max(12,rect.left),Math.max(12,window.innerWidth-width-12))+'px';
  root.style.top=Math.min(Math.max(12,rect.bottom+8),Math.max(12,window.innerHeight-350))+'px';
  document.body.append(root);activeInlineEditor=root;
  input.focus();
}
async function showCatalogImport(){
 if(!adminToken)return;
 const view=h('div',{class:'catalog-updater'}),status=h('p',{class:'muted',role:'status',text:'Новая версия не будет опубликована без предварительной сверки и твоего подтверждения.'});
 const progress=h('progress',{max:'100',value:'0',class:'catalog-import-progress'});
 const actions=h('div',{class:'catalog-update-actions'});
 const check=h('button',{class:'button-action primary',text:'Сверить с Pandora Saga OS'});
 const archive=h('button',{class:'button-action',text:'Сверить с архивом GitHub'});
 const apply=h('button',{class:'button-action primary',text:'Опубликовать проверенный снимок D1',disabled:true});
 actions.append(check,archive,apply);
 const report=h('div',{class:'catalog-update-report'});
 view.append(h('p',{class:'muted',text:'Обновления загружаются только по команде администратора. 17 наборов RU/EN будут сравнены по идентификаторам с активной D1. Добавленные, изменённые и удалённые записи проверяются до публикации.'}),actions,progress,status,report);
 let proposed=null,summary=null,provenance=null;
 const setBusy=flag=>{check.disabled=flag;archive.disabled=flag;apply.disabled=flag||!proposed};
 const getFile=async(name,mode)=>{
  if(mode==='server')return apiRequest('/api/admin/catalog/source/'+name+'.json',null,adminToken);
  const r=await fetch('./data/os/'+name+'.json',{cache:'no-cache'});
  if(!r.ok)throw Error('Архив '+name+' HTTP '+r.status);
  return r.json();
 };
 async function preview(mode){
  proposed=null;summary=null;apply.disabled=true;report.replaceChildren();setBusy(true);
  try{
   const api=window.PandoraCatalogImport,diff=window.PandoraCatalogDiff;
   if(!api||!diff)throw Error('Модуль сравнения не подключён');
   const upstream={};
   for(const [i,name]of api.files.entries()){
    status.textContent='Проверяю '+name+' ('+(i+1)+'/'+api.files.length+')';
    upstream[name]=await getFile(name,mode);
    progress.value=String(Math.round((i+1)/api.files.length*50));
   }
   const localeResponse=await fetch('./data/localization/legacy-approved.v1.json',{cache:'no-cache'});
   if(!localeResponse.ok)throw Error('Локальный утверждённый перевод Legacy недоступен');
   const legacy=await localeResponse.json();
   const ready=api.normalize(upstream,legacy);
   const comparisons=[];
   for(const [i,name]of api.files.entries()){
    let active;
    try{
     const currentName=name==='strings.en'?'stringsEn':name;
     const response=await fetch(API+'/api/catalog/'+currentName+'.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)});
     if(!response.ok)throw Error('D1 '+name+': HTTP '+response.status);
     active=await response.json();
    }catch(error){throw Error('Невозможно сверить '+name+' с опубликованной D1: '+error.message)}
    comparisons.push(diff.diff(name,active,upstream[name]));
    progress.value=String(50+Math.round((i+1)/api.files.length*50));
   }
   const total=comparisons.reduce((n,r)=>n+r.total,0);
   report.append(h('h3',{text:total?'Предварительный отчёт: '+total+' изменений':'Изменений не обнаружено'}));
   for(const row of comparisons){
    const line=h('div',{class:'catalog-diff-row'});
    line.append(h('strong',{text:row.dataset}),h('span',{text:'+'+row.added.length+' новых · ~'+row.changed.length+' изменено · −'+row.removed.length+' удалено'}));
    const ids=[...row.added.slice(0,3).map(x=>'+'+x),...row.changed.slice(0,3).map(x=>'~'+x),...row.removed.slice(0,3).map(x=>'−'+x)];
    if(ids.length)line.append(h('small',{text:ids.join(' · ')+(row.total>ids.length?' · ещё '+(row.total-ids.length):'')}));
    if(row.examples?.length){
      const details=h('details',{class:'catalog-diff-details'});
      details.append(h('summary',{text:'Посмотреть конкретные изменения ('+Math.min(row.examples.length,row.total)+' из '+row.total+')'}));
      for(const entry of row.examples){
        const record=h('div',{class:'catalog-diff-record'});
        record.append(h('strong',{text:(entry.kind==='added'?'＋ ':entry.kind==='removed'?'− ':'~ ')+entry.key}));
        for(const field of entry.fields.slice(0,12)){
          const item=h('div',{class:'catalog-diff-field'});
          item.append(h('code',{text:field.field}),h('span',{text:field.before+' → '+field.after}));
          record.append(item);
        }
        details.append(record);
      }
      line.append(details);
    }
    report.append(line);
   }
   proposed=ready;summary=comparisons;provenance=mode;
   apply.disabled=false;
   status.textContent='Проверка завершена ('+ready.datasets.length+' групп D1, '+Object.values(ready.counts).reduce((a,b)=>a+b,0)+' записей). Проверь изменения и подтверди публикацию.';
  }catch(e){status.textContent='Сверка остановлена без изменений в D1: '+e.message;proposed=null;console.error('Catalog preview',e)}
  finally{setBusy(false)}
 }
 check.onclick=()=>preview('server');
 archive.onclick=()=>preview('archive');
 apply.onclick=async()=>{
  if(!proposed||!summary||!provenance)return;
  const added=summary.reduce((n,x)=>n+x.added.length,0),changed=summary.reduce((n,x)=>n+x.changed.length,0),removed=summary.reduce((n,x)=>n+x.removed.length,0);
  if(!confirm('Опубликовать снимок ('+provenance+') в Cloudflare D1?\\nНовых: '+added+'; изменённых: '+changed+'; удалённых: '+removed+'.\\nСуществующая опубликованная версия останется в истории снимков.'))return;
  setBusy(true);apply.disabled=true;
  try{
   await apiRequest('/api/admin/catalog/initialize',{});
   const id='ps-'+crypto.randomUUID().replaceAll('-');
   let done=0;const total=Object.values(proposed.counts).reduce((n,x)=>n+x,0);
   for(const name of proposed.datasets){
    const rows=proposed.entries[name];
    for(let offset=0;offset<rows.length;){
     const batch=[];let size=0;
     while(offset<rows.length&&batch.length<30){
      const row=rows[offset],bytes=JSON.stringify(row).length;
      if(bytes>12000)throw Error('Слишком большая запись '+name+'/'+row.key);
      if(batch.length&&size+bytes>42000)break;
      batch.push(row);size+=bytes;offset++;
     }
     await apiRequest('/api/admin/catalog/batch',{snapshot:id,dataset:name,records:batch});
     done+=batch.length;progress.value=String(Math.round(done/total*100));
     status.textContent='Сохраняю '+name+': '+done+'/'+total;
    }
   }
   const result=await apiRequest('/api/admin/catalog/publish',{snapshot:id,extraCounts:proposed.extraCounts});
   status.textContent='D1 обновлена, активен снимок '+result.active+'. Сохранено '+done+' записей.';
   proposed=null;apply.disabled=true;
   wikiIndex=null;wikiData=null;await loadCatalog();
  }catch(e){status.textContent='Публикация прервана. Предыдущий активный снимок сохранён: '+e.message;console.error('D1 publish',e)}
  finally{setBusy(false)}
 };
 modal('Каталог Pandora Saga · сравнение и обновление D1',view);
}

function applyGameLocale(){
 if(!catalogSource)return;
 const translate=(original,map)=>{
  if(lang!=='en'||!map)return original;
  return Object.fromEntries(Object.entries(original).map(([id,item])=>{
    const t=map[id];return [id,t?{...item,name:t.n||item.name,desc:t.d??item.desc}:item]
  }));
 };
 const en=lang==='en'?officialEnglish:null;
 const meta={...catalogSource.meta};
 if(en?.branches)meta.branchLabels={...meta.branchLabels,...en.branches};
 catalog={meta,classes:translate(catalogSource.classes,en?.classes),skills:translate(catalogSource.skills,en?.skills),
   equipment:translate(catalogSource.items,en?.items),souls:translate(catalogSource.souls,en?.souls),racialPassives:catalogSource.racialPassives,live:true};
 jobs=jobKeys.map(id=>catalog.classes[id]?.name||id);
 branches=window.PandoraGameNavigation.groups.flatMap(g=>g.branches.map(id=>({id,name:meta.branchLabels[id]||id})));
 const label=document.getElementById('locale');
 if(label){label.textContent=lang==='en'?'EN ✓ · RU':'RU ✓ · EN';label.title='Переключить язык игрового каталога';label.setAttribute('aria-label','Язык игрового каталога: '+lang.toUpperCase())}
 render();
}
async function loadCatalog(){
 const names=['meta','classes','skills','items','souls','racialPassives'];
 const obtain=async base=>Object.fromEntries(await Promise.all(names.map(async name=>{
  const r=await fetch(base+'/'+name+'.json',{cache:'no-cache',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error(name+' HTTP '+r.status);
  return [name,await r.json()];
 })));
 let live,sourceLabel;
 try{live=await obtain(API+'/api/catalog');sourceLabel='Cloudflare D1 · наша база'}
 catch(err){
  console.info('D1 is not published; using repository copy',err.message);
  try{live=await obtain('./data/os');sourceLabel='Встроенный архив (до переноса в D1)'}
  catch(error){
   console.error('Catalog unavailable',error);
   $('siteNotice').textContent='Каталог временно недоступен; сохранённые билды не удалены.';
   $('catalogStatus').textContent='Каталог не загружен';return;
  }
 }
 if(!live.meta?.counts?.skills||!live.classes?.CLERIC)throw Error('Invalid game catalog');
 catalogSource=live;
 const oldToOS={1:'slash',2:'thrust',3:'brush',4:'blow',5:'defense',7:'archery',8:'alchemy',9:'assassin',10:'trap',11:'warding',13:'benevolence',14:'blessing',15:'exorcism',16:'hymn',18:'element',19:'embody',20:'darkness',21:'charm',23:'race',24:'riding'};
 state.points=Object.fromEntries(Object.entries(state.points).map(([key,val])=>[oldToOS[key]||key,val]));
 if(state.mastery&&typeof state.mastery==='object'&&!Array.isArray(state.mastery))
  state.mastery=Object.fromEntries(Object.entries(state.mastery)
   .map(([key,val])=>[oldToOS[key]||key,val]));
 if(typeof state.branch==='number')state.branch=oldToOS[state.branch]||'brush';
 if(!window.PandoraGameNavigation.all.has(state.branch)){state.branch='slash'}
 if(!pathGroupTouched)
  selectedSkillGroup=window.PandoraGameNavigation.branchGroup(state.branch)?.id||'melee';
 let enData=null;
 for(const path of [API+'/api/catalog/stringsEn.json','./data/os/strings.en.json']){
  try{
   const response=await fetch(path,{cache:'no-cache',signal:AbortSignal.timeout(10000)});
   if(!response.ok)continue;
   const proposed=await response.json();
   const expected=live.meta?.localeCounts?.en||{};
   if(proposed.locale!=='en')continue;
   if(['items','skills','monsters','souls','classes'].some(group=>Object.keys(proposed[group]||{}).length!==Number(expected[group])))continue;
   enData=proposed;break;
  }catch(error){console.info('English archive unavailable from '+path,error.message)}
 }
 officialEnglish=enData;
 $('siteNotice').textContent='Pandora Saga Build Studio · '+sourceLabel+'. '+(officialEnglish?'RU/EN по официальным ID.':'Английский перевод временно недоступен.')+' Костюмные вещи исключены из боевого каталога.';
 $('catalogStatus').textContent=`${live.meta.counts.skills} навыков · ${live.meta.counts.items} предметов · ${live.meta.counts.souls} душ · ${sourceLabel}`;
 applyGameLocale();persist();
}
async function loadOverrides(){try{const response=await apiRequest('/api/overrides',null,'');override=response.values||{};render();updateAdminHint()}catch{ /* Not deployed or CORS restricted; static site remains usable. */ }}
$('originTabs').onclick=event=>{
 const button=event.target.closest('[data-origin-tab]');
 if(!button)return;
 originActive=button.dataset.originTab;renderOriginTabs();saveView();
};
$('nav').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)changeTab(b.dataset.tab)};$('level').oninput=e=>{state.level=Number(e.target.value);persist();render()};$('genderF').onclick=()=>{if(!window.PandoraUIPlanner.raceHasGender(races,state.race))return;state.gender=0;persist();render()};$('genderM').onclick=()=>{if(!window.PandoraUIPlanner.raceHasGender(races,state.race))return;state.gender=1;persist();render()};$('swapGender').onclick=()=>{if(!window.PandoraUIPlanner.raceHasGender(races,state.race))return;state.gender=1-state.gender;persist();render()};$('jumpEquipment').onclick=()=>{
 selectedSlot=0;stageSlotQuery='';stageSlotView=state.equipment?.[0]?'details':'choose';
 stageSlotPickerOpen=true;renderSlotRails();renderStagePicker(true);
};
$('stageAttributeToggle').onclick=()=>{
 stageAttributesPage=stageAttributesPage?null:'attack';renderStageAttributes();saveView()
};$('snapshot').onclick=()=>{saveBuild();changeTab('builds')};$('locale').onclick=()=>{lang=lang==='ru'?'en':'ru';localStorage.setItem('ps-build-lang',lang);if(lang==='en'&&!officialEnglish)alert('Английский источник недоступен. Неизвестные переводы останутся на русском.');applyGameLocale()};document.addEventListener('click',event=>{if(!adminEditing||!event.target.closest||event.target.closest('#ownerDock, .inline-owner-editor, #modalRoot'))return;const editable=event.target.closest('[data-edit-key]');if(editable){if(/^(?:item|itemdesc|itemslots)\./.test(editable.dataset.editKey))return;event.preventDefault();event.stopImmediatePropagation();editor(editable)}},true);
document.addEventListener('dblclick',event=>{
 if(!adminEditing||!event.target.closest)return;
 const editable=event.target.closest('[data-edit-key]');
 if(!editable||!/^(?:item|itemdesc|itemslots)\./.test(editable.dataset.editKey))return;
 event.preventDefault();event.stopImmediatePropagation();editor(editable);
},true);
$('pathGrowthTab').onclick=()=>{heroPathPage='growth';renderPathPages();saveView()};
 $('pathSkillsTab').onclick=()=>{heroPathPage='skills';renderPathPages();saveView()};
 $('pathResetPoints').onclick=()=>{
  const spent=budgetSummary().spent;
  if(!spent)return;
  if(!confirm('Сбросить все вложенные очки навыков и зелёное мастерство? Остальная сборка и экипировка сохранятся.'))return;
  for(const b of branches)state.points[b.id]=0;
  state.mastery={};
  persist();renderBranches();refreshBudgetLabel();renderOriginStats();renderHudEstimates();
  saveView();
 };
 $('pathAutoMastery').onchange=e=>{
  window.PandoraSkillProgression.setAuto(state,e.target.checked,branches.map(b=>b.id));
  persist();renderBranches();refreshBudgetLabel();renderOriginStats();renderHudEstimates();
 };
 $('pathSkillSearch').oninput=e=>{pathSkillQuery=e.target.value;renderPathSkills()};
 $('pathSkillStatus').onchange=e=>{pathSkillFilter=e.target.value;renderPathSkills()};
 $('dockClose').onclick=closeWorkbench;
$('studioBackdrop').onclick=closeWorkbench;
$('dockTabs').addEventListener('click',event=>{
 const button=event.target.closest('[data-tab]');
 if(button)changeTab(button.dataset.tab);
});
$('stageQuickbar')?.addEventListener('click',event=>{
 const target=event.target.closest('[data-stage-tab]');
 if(target)changeTab(target.dataset.stageTab);
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if(!$('modalRoot').hidden)return;
  if(document.querySelector('.inline-owner-editor')){closeInlineEditor();return}
  if(stageSlotPickerOpen){closeStagePicker();return}
  closeWorkbench();
 }else if(event.key==='Tab'&&$('detailPanel').classList.contains('is-open')&&$('modalRoot').hidden){
  const panel=$('detailPanel');
  const focusable=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')]
   .filter(el=>el.getClientRects().length>0);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){event.preventDefault();first.focus()}
 }
});

/* Owner login: five logo clicks within six seconds, or Ctrl+Alt+Shift+P.
   Hidden UI does not replace server-side authorization. */
let ownerClicks=0,ownerClickStart=0;
document.querySelector('.brand')?.addEventListener('click',event=>{
 const now=Date.now();
 if(now-ownerClickStart>6000){ownerClickStart=now;ownerClicks=0;}
 if(++ownerClicks>=5){event.preventDefault();ownerClicks=0;ownerClickStart=0;showAdmin();}
});
document.addEventListener('keydown',event=>{
 if(event.ctrlKey&&event.altKey&&event.shiftKey&&event.code==='KeyP'){
  event.preventDefault();showAdmin();
 }
});

// Save the exact current user state before any update, and never auto-reload during admin sessions.
window.PandoraStudioAdminActive=()=>Boolean(adminToken);
document.addEventListener('pandora:before-update',()=>{persist();persistBuilds()});
// Restore deep links on refresh without requiring credentials or losing the current build.
function restoreWikiHash(){
 // On F5 respect the last *visible* view; on explicit navigation honor an incoming wiki deep link.
 const navigationType=performance.getEntriesByType?.('navigation')?.[0]?.type;
 if(navigationType==='reload'&&
    (bootView.tab&&bootView.tab!=='wiki'||bootView.tab==='wiki'&&bootView.open===false))return;
 const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15})(?:\/([0-9]{1,15}))?$/);
 if(!match)return;
 wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 renderDetails();showWorkbench();
}
window.addEventListener('hashchange',()=>{
 if(location.hash.startsWith('#b/')){restoreSharedHash();return}
 if(location.hash.startsWith('#wiki/')){
  // A user clicking a wiki link explicitly is a new action, not stale navigation.
  if(activeTab!=='wiki')activeTab='wiki';
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15})(?:\/([0-9]{1,15}))?$/);
  if(match){wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};renderDetails();showWorkbench();saveView()}
 }
});
fetch('./assets/os-icon-manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(data=>{
 const label=$('iconStatus');
 if(data?.icons&&data.count&&Number.isInteger(data.count.present)&&Number.isInteger(data.count.expected)&&data.count.present<=data.count.expected){
  if(data.count.present>0){iconManifest=data;render()}
  if(label)label.textContent='Локальные иконки OS: '+data.count.present+' / '+data.count.expected;
 }else if(label)label.textContent='Иконки OS: используются внешние источники';
}).catch(()=>{const label=$('iconStatus');if(label)label.textContent='Иконки OS: локальный архив пока не импортирован'});

render();loadCatalog();loadOverrides();
// Independence: class caps must be usable even when unrelated wiki/skills/D1 data fails.
fetch('./data/os/classes.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null)
 .then(classes=>{
  if(classes?.[jobKeys[state.job]]&&!catalog.classes){
   catalog.classes=classes;
   renderBranches();refreshBudgetLabel();
  }
 }).catch(error=>console.warn('Local class limits unavailable',error));
fetch('./data/os/tables.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null)
.then(t=>{if(t?.abilityPoint&&t?.weaponPlus&&t?.forge){gameTables=t;render()}}).catch(()=>{});
restoreWikiHash();
restoreSharedHash();
if(bootView.open&&bootView.tab!=='wiki'&&!String(location.hash).startsWith('#wiki/')){
 showWorkbench();$('detailContent').scrollTop=Math.max(0,Number(bootView.inner)||0)
}
if(bootView.slotOpen&&!bootView.open){stageSlotPickerOpen=true;renderSlotRails();renderStagePicker()}
requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,Number(bootView.page)||0),behavior:'instant'}));
window.addEventListener('pagehide',saveView);
document.addEventListener('pandora:before-update',saveView);
document.addEventListener('scroll',saveView,{passive:true});
$('skillBranches').addEventListener('scroll',saveView,{passive:true});
$('detailContent').addEventListener('scroll',saveView,{passive:true});