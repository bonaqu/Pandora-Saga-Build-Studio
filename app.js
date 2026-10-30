// Pandora Saga Build Studio — client-side character planner.
// No invented combat formulas. Historical catalog is labelled explicitly.
'use strict';
const $=id=>document.getElementById(id);
const SRC='https://raw.githubusercontent.com/bonaqu/Pandora-Saga-Simulator-remaked/bonaqu_projects/';
const OS='https://pandorasaga-os.com';
const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const STATS=['Выносливость','Сила','Ловкость','Сноровка','Дух','Интеллект'];
const races=[['Человек','Human','human_f','human_m'],['Эльф','Elf','elf_f','elf_m'],['Цверг','Dwarf','dwarf','dwarf'],['Мирина','Myrine','myrine','myrine'],['Энкиду','Enkidu','enkidu','enkidu'],['Кролль','Lapin','lapin','lapin']];
let jobs=['Warrior','Gradiator','Juggernaut','Dragoon','Knight','General','Paladin','Scout','Archer','Sniper','Hunter','Provocateur','Assassin','Saboteur','Acolyte','Priest','Cleric','Enchanter','Ascetic','Monk','Exorcist','Mage','Wizard','Warlock','Conjurer','Sorcerer','Corrupter','Shadowblade'];
const branchNames=['Melee','Slash','Thrust','Cleave','Bash','Defend','Technique','Shot','Alchemy','Assassination','Trapping','Dodge','Grace','Banevolence','Blessing','Exorcism','Hymn','Magic','Elemental','Invocation','Darkness','Confusion','Special','Racial','Horsemanship'];
let branches=branchNames.map((name,id)=>({id,name})).filter(x=>![0,6,12,17,22].includes(x.id));
const jobKeys=['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN','SCOUT','ARCHER','SNIPER','PREDATOR','AGENT','ASSASSIN','DISTURBANCE','ACOLYTE','PRIEST','CLERIC','ENCHANTER','ASCETIC','MONK','EXORCIST','MAGE','WIZARD','WARLOCK','CONJURER','DARKROAR','JESTER','CALAMITY'];
const slotKeys=['weapon','shield','head','body','gloves','legs','feet','cloak','ring','ring','neck','belt','ear','ear'];
const slots=[['Оружие','⚔'],['Щит','◈'],['Шлем','♜'],['Нагрудник','♟'],['Перчатки','♧'],['Поножи','♙'],['Обувь','♧'],['Плащ','❧'],['Кольцо I','◉'],['Кольцо II','◉'],['Амулет','✥'],['Пояс','♢'],['Серьга I','✧'],['Серьга II','✧']];
function fresh(){return{race:1,gender:0,job:16,level:50,branch:3,points:Object.fromEntries(branches.map(b=>[b.id,0])),stats:Object.fromEntries(STATS.map(s=>[s,0])),equipment:{},souls:{},name:'Новый герой'}};
let state=fresh(),activeTab='character',catalog={skills:null,equipment:null,souls:null,classes:null,meta:null,live:false},selectedSkill=null,selectedSlot=0,filter='',gearMode='equipment',builds=[],override={},adminToken='',adminEditing=false,lang='ru',compareIds=[],skillSearch='',skillOnlyAvailable=false,gearShown=60;
try{const saved=localStorage.getItem('ps-build-studio.v1');if(saved){const parsed=JSON.parse(saved);state={...fresh(),...parsed,points:{...fresh().points,...parsed.points},stats:{...fresh().stats,...parsed.stats}}} builds=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')}catch(e){console.warn('Saved data skipped',e)}
function persist(){try{localStorage.setItem('ps-build-studio.v1',JSON.stringify(state))}catch{}}
function persistBuilds(){try{localStorage.setItem('ps-build-library.v1',JSON.stringify(builds))}catch{}}
function h(tag,attrs={},children=[]){const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='html')throw Error('HTML injection prohibited');else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(v!==undefined&&v!==null)el.setAttribute(k,String(v))}for(const c of [].concat(children))if(c!==null&&c!==undefined)el.append(typeof c==='string'?document.createTextNode(c):c);return el}
function imageUrl(name){return `assets/${name}.webp`}
function skillIcon(cat,idx,record=null){const custom=override['visual.skill.'+(record?.id??(cat+'.'+idx))];if(custom)return custom;if(catalog.live&&record?.iconId)return `${OS}/icons/skills/skill_${record.iconId}.webp?v=07682901`;return `${SRC}image/icon/${String(cat).padStart(2,'0')}${String(idx).padStart(2,'0')}.png`}
function itemIcon(rec,kind='items'){const custom=override[(kind==='souls'?'visual.soul.':'visual.item.')+rec?.id];if(custom)return custom;return rec?.icon?`${OS}/icons/${kind}/${rec.icon}.webp?v=07682901`:null}
function branchCap(branch){return catalog.live?(window.PandoraStudioRules.branchCap(catalog.classes,jobKeys[state.job],branch)??0):90}
function editableValue(key,defaultValue){return Object.prototype.hasOwnProperty.call(override,key)?override[key]:defaultValue}
function editAttr(el,key){el.dataset.editKey=key;if(adminEditing)el.classList.add('admin-edit');return el}
function raceSource(i,gender){
return override["visual.race."+i+"."+(gender?"m":"f")]||imageUrl(races[i][gender?3:2]);
}
function renderRaces(){const grid=$('raceGrid');grid.replaceChildren();races.forEach((r,i)=>{const button=h('button',{class:'race-choice'+(state.race===i?' active':''),'aria-pressed':state.race===i,onclick:()=>{state.race=i;selectedSkill=null;persist();render()}});button.append(editAttr(h('img',{src:raceSource(i,state.gender),alt:r[0],loading:'lazy'}),'visual.race.'+i+'.'+(state.gender?'m':'f')),editAttr(h('b',{text:editableValue('race.'+i,r[0])}),'race.'+i));grid.append(button)})}
function renderJobs(){const grid=$('classGrid');grid.replaceChildren();jobs.forEach((j,i)=>{const button=h('button',{class:'class-choice'+(state.job===i?' active':''),'aria-pressed':state.job===i,onclick:()=>{state.job=i;persist();render()}});button.append(h('i',{text:['✠','⚔','✦','♜'][Math.floor(i/7)]||'⚔'}),editAttr(h('span',{text:editableValue('job.'+i,j)}),'job.'+i));grid.append(button)})}
function changeTab(tab){activeTab=tab;document.querySelectorAll('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));renderDetails();$('detailPanel').scrollIntoView({behavior:'smooth',block:'start'})}
function equippedRecord(slot){
const value=state.equipment[slot];
if(!value)return null;
return catalog.live?catalog.equipment?.[String(value.id)]||null:null;
}
function slotVisual(slot){
const item=state.equipment[slot],r=item&&equippedRecord(slot),icon=r?itemIcon(r):item?.icon?`${OS}/icons/items/${item.icon}.webp`:null;
if(!icon)return h("span",{text:slots[slot][1],class:"slot-glyph"});
const img=h("img",{class:"equipped-icon",src:icon,alt:""});
img.onerror=()=>{img.onerror=null;img.replaceWith(h("span",{text:slots[slot][1],class:"slot-glyph"}))};
return img;
}
function renderSlotRails(){
for(const[id,indexes]of[["railLeft",[0,2,3,4,5,6]],["railRight",[1,7,8,9,10,11,12,13]]]){
const container=$(id);container.replaceChildren();
for(const i of indexes){
const item=state.equipment[i];
const button=h("button",{class:"equipment-slot"+(item?" equipped":"")+(selectedSlot===i?" selected":""),
"aria-label":slots[i][0]+": "+(item?.name||"пусто"),title:slots[i][0]+" · "+(item?.name||"пусто"),
onclick:()=>{selectedSlot=i;gearMode="equipment";changeTab("equipment");renderSlotRails()}});
button.append(slotVisual(i),h("small",{text:item?.name||slots[i][0]}));container.append(button);
}}
}
function renderBranches(){const c=$('skillBranches');c.replaceChildren();branches.forEach(b=>c.append(branchRow(b,false)))}
function branchRow(b,full){const points=state.points[b.id]||0;const btn=h('button',{class:'branch-row'+(state.branch===b.id?' active':''),onclick:()=>{state.branch=b.id;selectedSkill=null;persist();renderBranches();$('branchValue').textContent=points;changeTab('skills')}});const first=catalog.live?Object.values(catalog.skills||{}).find(x=>x.branch===b.id&&x.classes?.[jobKeys[state.job]]):null;const icon=h('img',{class:'tinyicon',src:skillIcon(b.id,0,first),alt:'',loading:'lazy'});icon.onerror=()=>{icon.onerror=null;icon.style.display='none'};btn.append(icon,h('div',{},[h('strong',{text:editableValue('branch.'+b.id,b.name)}),h('span',{text:catalog.live?('Лимит класса: '+branchCap(b.id)):'Историческая ветка'})]),h('b',{class:'count',text:String(points)}));return btn}
function render(){const logo=document.querySelector('.brand img');if(logo)logo.src=override['visual.logo']||'assets/pandora-logo.png';renderRaces();renderJobs();$('genderF').classList.toggle('chosen',state.gender===0);$('genderM').classList.toggle('chosen',state.gender===1);$('hero').src=raceSource(state.race,state.gender);$('hero').dataset.editKey='visual.race.'+state.race+'.'+(state.gender?'m':'f');$('hero').classList.toggle('admin-edit',adminEditing);$('hero').alt=races[state.race][0];$('raceTitle').textContent=editableValue('race.'+state.race,races[state.race][0]);$('jobTitle').textContent=editableValue('job.'+state.job,jobs[state.job]);$('activeJob').textContent=$('jobTitle').textContent;$('activeRace').textContent=$('raceTitle').textContent+' · '+state.level+' ур.';$('level').value=state.level;$('levelOut').textContent=state.level;$('branchValue').textContent=state.points[state.branch]||0;$('itemValue').textContent=Object.values(state.equipment).filter(Boolean).length;renderSlotRails();renderBranches();$('budgetState').textContent='Лимиты и стоимость очков проверяются только настоящим движком. Пока — планировщик распределения.';renderDetails();const title=document.querySelector('[data-edit-key="site.title"]'),subtitle=document.querySelector('[data-edit-key="site.subtitle"]');if(title)title.textContent=editableValue('site.title','Создай свою легенду');if(subtitle)subtitle.textContent=editableValue('site.subtitle','Выбери расу, профессию, снаряжение и путь развития персонажа.');updateAdminHint()}
function markNode(record){const raw=record?.prerequisite_code||'';const known=(state.branch===3 && record?.legacy_entry_index===0)?'Подтверждённую доступность определяет движок':null;return known||raw||'Условие из архивного каталога'}
function renderDetails(){const titles={character:'Мастерская героя',skills:'Дерево умений',equipment:'Снаряжение и души',stats:'Характеристики',builds:'Библиотека билдов'};$('detailTitle').textContent=titles[activeTab];$('detailContent').replaceChildren();const contents={character:renderCharacter,skills:renderSkills,equipment:renderEquipment,stats:renderStats,builds:renderBuilds};contents[activeTab]($('detailContent'))}
function renderCharacter(root){const intro=h('div',{class:'stat-grid'});intro.append(h('div',{class:'stat-card'},[h('h3',{text:'Раса'}),h('b',{text:races[state.race][0]}),h('span',{text:'Выбор меняет визуальный портрет'})]),h('div',{class:'stat-card'},[h('h3',{text:'Профессия'}),h('b',{text:jobs[state.job]}),h('span',{text:'Историческое название Legacy 2.00'})]),h('div',{class:'stat-card'},[h('h3',{text:'Уровень'}),h('b',{text:String(state.level)}),h('span',{text:'Планируемый уровень персонажа'})]));root.append(intro,h('p',{class:'muted',text:'Выбирай расу по реальным винтажным портретам слева, меняй класс, нажимай слоты вокруг героя и открывай навыки. Никакие боевые значения не выдумываются.'}))}
function renderSkills(root){
const rules=window.PandoraStudioRules;
const layout=h("div",{class:"skill-layout"}),picker=h("div",{class:"skill-picker"}),center=h("div",{class:"skill-center"}),info=h("div",{class:"skill-info"});
branches.forEach(b=>picker.append(branchRow(b,true)));
const branch=state.branch,cap=branchCap(branch),pts=Number(state.points[branch]||0);
center.append(h("h3",{text:editableValue("branch."+branch,catalog.live?(catalog.meta?.branchLabels?.[branch]||branch):branchNames[branch]||branch)}),
 h("p",{class:"muted",text:"Известные требования навыков проверяются по каталогу. Это не подтверждает фактическое изучение; общий бюджет очков пока не рассчитан."}));
const bar=h("div",{class:"skill-bar"}),row=h("div",{class:"skill-stepper"});
const value=h("strong",{class:"allocation-label",text:pts+" / "+cap}),range=h("input",{type:"range",min:"0",max:String(cap),value:String(Math.min(pts,cap)),step:"1","aria-label":"Очки ветки"}),
numeric=h("input",{type:"number",min:"0",max:String(cap),value:String(pts),step:"1",class:"allocation-input","aria-label":"Точное число очков"});
const setPoints=n=>{
const value=Number(n);if(!Number.isInteger(value)||value<0||value>cap)return false;
state.points[branch]=value;persist();renderBranches();$("branchValue").textContent=String(value);
renderDetails();return true;
};
for(const [text,delta]of[["−5",-5],["−1",-1]])row.append(h("button",{class:"allocation-button",text,onclick:()=>setPoints(Math.max(0,Number(state.points[branch]||0)+delta))}));
row.append(range,numeric);
for(const [text,delta]of[["+1",1],["+5",5]])row.append(h("button",{class:"allocation-button",text,onclick:()=>setPoints(Math.min(cap,Number(state.points[branch]||0)+delta))}));
range.addEventListener("input",()=>{state.points[branch]=Number(range.value);persist();numeric.value=range.value;value.textContent=range.value+" / "+cap;$("branchValue").textContent=range.value;for(const b of center.querySelectorAll("[data-record-id]")){const rec=catalog.live?catalog.skills?.[b.dataset.recordId]:null;if(rec){const g=rules.readiness(rec,{job:jobKeys[state.job],level:state.level,points:state.points});b.dataset.gate=g.status;b.querySelector(".gate-caption").textContent=g.status==="eligible"?"✓ Условия выполнены":g.status==="locked"?"🔒 "+g.missing[0]:"? Не все условия известны"}}});
range.addEventListener("change",()=>renderDetails());
numeric.addEventListener("change",()=>{if(!setPoints(numeric.value))numeric.value=String(state.points[branch]||0)});
bar.append(h("div",{class:"allocation-head"},[h("b",{text:"Очки навыков"}),value]),row,h("button",{class:"allocation-button reset-points",text:"Сбросить ветку",onclick:()=>setPoints(0)}));center.append(bar);
if(pts>cap)center.append(h("p",{class:"budget-excess",text:"Значение "+pts+" превышает текущий предел класса "+cap+". Оно сохранено, пока ты не исправишь распределение."}));
const records=catalog.live?Object.values(catalog.skills||{}).filter(s=>s.branch===branch&&s.classes?.[jobKeys[state.job]]).sort((a,b)=>(a.charLevel||0)-(b.charLevel||0)):
(catalog.skills?.records||[]).filter(s=>Number(s.legacy_category_id)===branch);
const filterBar=h("div",{class:"skill-search"});
const search=h("input",{type:"search",placeholder:"Поиск по названию навыка",value:skillSearch,oninput:e=>{
skillSearch=e.target.value;renderDetails();const el=document.querySelector(".skill-search input");el?.focus();el?.setSelectionRange(skillSearch.length,skillSearch.length)
}});
const only=h("button",{class:"allocation-button"+(skillOnlyAvailable?" active":""),text:skillOnlyAvailable?"✓ Доступные":"Все навыки",onclick:()=>{skillOnlyAvailable=!skillOnlyAvailable;renderDetails()}});
filterBar.append(search,only);center.append(filterBar);
const query=skillSearch.toLocaleLowerCase("ru").trim();
const shown=records.filter(s=>(!query||String(catalog.live?s.name:s.name?.en||"").toLocaleLowerCase("ru").includes(query))&&
(!skillOnlyAvailable||catalog.live&&rules.readiness(s,{job:jobKeys[state.job],level:state.level,points:state.points}).status==="eligible"));
center.append(h("p",{class:"muted",text:"Показано "+shown.length+" из "+records.length+" навыков"}));
const nodes=h("div",{class:"nodes"});
if(!shown.length)nodes.append(h("p",{class:"muted",text:"Не найдено навыков для текущего фильтра и класса."}));
for(const s of shown){
const id=String(catalog.live?s.id:s.legacy_entry_index);
const g=catalog.live?rules.readiness(s,{job:jobKeys[state.job],level:state.level,points:state.points}):{status:"unknown",missing:[]};
const button=h("button",{class:"skill-node"+(selectedSkill?.id===s.id?" open":""),"data-gate":g.status,"data-record-id":id,
"aria-pressed":String(selectedSkill?.id===s.id),onclick:()=>{selectedSkill=s;renderDetails()}});
const img=editAttr(h("img",{src:skillIcon(branch,id,s),alt:"",loading:"lazy"}),"visual.skill."+id);img.onerror=()=>{img.onerror=null;img.replaceWith(h("span",{class:"skill-fallback",text:"✦"}))};
const label=g.status==="eligible"?"✓ Условия выполнены":g.status==="locked"?"🔒 "+g.missing[0]:"? Не все условия известны";
button.append(img,editAttr(h("strong",{text:editableValue("skill."+branch+"."+id,catalog.live?s.name:s.name?.en||id)}),"skill."+branch+"."+id),h("small",{class:"gate-caption",text:label}));nodes.append(button);
}
center.append(nodes);
const chosen=selectedSkill&&records.some(s=>s.id===selectedSkill.id)?selectedSkill:shown[0];
if(chosen){
const id=String(catalog.live?chosen.id:chosen.legacy_entry_index),g=catalog.live?rules.readiness(chosen,{job:jobKeys[state.job],level:state.level,points:state.points}):null;
info.append(editAttr(h("img",{class:"bigicon",src:skillIcon(branch,id,chosen),alt:""}),"visual.skill."+id),editAttr(h("h3",{text:editableValue("skill."+branch+"."+id,catalog.live?chosen.name:chosen.name?.en||id)}),"skill."+branch+"."+id));
if(g){
info.append(h("p",{class:"gate-summary","data-state":g.status,text:g.status==="eligible"?"✓ Известные требования выполнены":g.status==="locked"?"🔒 Не выполнены требования":"? Есть непроверенные условия"}));
for(const m of g.missing)info.append(h("p",{class:"gate-missing",text:"✕ "+m}));
for(const m of g.unknown)info.append(h("p",{class:"muted",text:"? "+m}));
for(const gate of g.gates){
info.append(h("button",{class:"gate-link",text:"➜ "+(catalog.meta?.branchLabels?.[gate.branch]||gate.branch)+": "+gate.current+"/"+gate.required+(gate.met?" ✓":""),
onclick:()=>{state.branch=gate.branch;selectedSkill=null;persist();render();changeTab("skills")}}));
}
}
info.append(editAttr(h("p",{text:editableValue("skilldesc."+branch+"."+id,catalog.live?chosen.desc||"Описание отсутствует":chosen.description?.en||"Описание отсутствует")}),"skilldesc."+branch+"."+id),
h("div",{class:"subhead",text:"Сведения из источника"}),
h("p",{text:"Уровень: "+(catalog.live?chosen.charLevel??"—":chosen.prerequisites?.en||"—")+
" · ОМ: "+((catalog.live?chosen.mana:chosen.mp_cost)??"—")+
" · Каст: "+((catalog.live?chosen.cast:chosen.cast_seconds)??"—")+
" · Перезарядка: "+((catalog.live?chosen.cooldown:chosen.cooldown_seconds)??"—")}),
h("p",{class:"source",text:catalog.live?"Источник: Pandora Saga OS skills.json. Визуализация условий не заменяет расчётное ядро.":"Архивные данные Legacy 2.00; текущие условия не подтверждены."}));
}else info.append(h("p",{class:"muted",text:"Выбери иконку навыка."}));
layout.append(picker,center,info);root.append(layout);
}
function itemName(r){return r?.name?.en||r?.names?.en||r?.name||r?.id||'Без названия'}
function renderEquipment(root){
 const layout=h("div",{class:"gear-layout"}),slotsPanel=h("div"),inventory=h("div"),inspector=h("div",{class:"item-info"});
 const switcher=h("div",{class:"toggles"});
 for(const [mode,label] of [["equipment","Снаряжение"],["souls","Души"]]){
  switcher.append(h("button",{class:gearMode===mode?"chosen":"",text:label,
    "aria-pressed":String(gearMode===mode),onclick:()=>{gearMode=mode;filter="";gearShown=60;renderDetails()}}))
 }
 slotsPanel.append(switcher,h("h3",{text:"Слоты персонажа"}));
 const grid=h("div",{class:"gear-slots"});
 slots.forEach((s,i)=>{
   const item=state.equipment[i];
   const button=h("button",{class:"equipment-slot"+(selectedSlot===i?" selected":"")+(item?" equipped":""),
    "aria-label":s[0]+": "+(item?.name||"пусто"),
    onclick:()=>{selectedSlot=i;gearShown=60;filter="";renderDetails();renderSlotRails()}});
   button.append(slotVisual(i),h("small",{text:item?.name||s[0]}));grid.append(button);
 });
 slotsPanel.append(grid,h("p",{class:"muted",text:"Нажимай на слот или на иконку предмета. Все видимые значения — из игрового каталога, а не расчётные догадки."}));
 const records=catalog.live?Object.values((gearMode==="souls"?catalog.souls:catalog.equipment)||{}):
  ((gearMode==="souls"?catalog.souls:catalog.equipment)?.records||[]);
 const slot=slotKeys[selectedSlot],job=jobKeys[state.job];
 const visible=records.filter(rec=>!catalog.live||(gearMode==="souls"?rec.slots?.includes(slot):rec.slot===slot));
 const needle=filter.trim().toLocaleLowerCase("ru");
 const matching=visible.filter(rec=>(itemName(rec)+" "+rec.id).toLocaleLowerCase("ru").includes(needle));
 const filterRow=h("div",{class:"filter-row"});
 const search=h("input",{type:"search","aria-label":"Поиск предметов",placeholder:"Название предмета или ID",value:filter,
  oninput:e=>{filter=e.target.value;gearShown=60;renderDetails();const next=document.querySelector(".filter-row input");if(next){next.focus();next.setSelectionRange(filter.length,filter.length)}}});
 filterRow.append(search);
 inventory.append(h("h3",{text:"Каталог · "+slots[selectedSlot][0]}),filterRow,
    h("p",{class:"muted item-count",text:"Найдено "+matching.length+" · показано "+Math.min(gearShown,matching.length)}));
 const list=h("div",{class:"gear-list"});
 const selected=(gearMode==="souls"?state.souls?.[selectedSlot]:state.equipment[selectedSlot]);
 const selectedRec=visible.find(rec=>String(rec.id)===String(selected?.id));
 function inspect(rec){
   inspector.replaceChildren();
   inspector.append(h("h3",{text:"Информация об игровом предмете"}));
   if(!rec){
     inspector.append(h("p",{class:"muted",text:"Выбери или наведи курсор на предмет. Его описание и значения появятся здесь."}));
     return;
   }
   const card=h("div",{class:"item-preview"});
   const src=itemIcon(rec,gearMode==="souls"?"souls":"items");
   if(src){
    const image=editAttr(h("img",{src,alt:"Иконка "+itemName(rec)}),(gearMode==="souls"?"visual.soul.":"visual.item.")+rec.id);
    image.onerror=()=>{image.onerror=null;image.replaceWith(h("span",{text:"✦"}))};card.append(image);
   }
   card.append(editAttr(h("strong",{text:editableValue((gearMode==="souls"?"soul.":"item.")+rec.id,itemName(rec))}),(gearMode==="souls"?"soul.":"item.")+rec.id));
   inspector.append(card);
   if(catalog.live){
     const info=[["ID",rec.id],["Тип",rec.kind],["Уровень",rec.level],["Оружейная атака",rec.W],["Защита",rec.AC],
       ["Слоты душ",rec.soulslot],["Усиление +",rec.plus],["Дальность",rec.range]];
     const dl=h("dl",{class:"item-fields"});
     for(const [label,val] of info)if(val!==undefined&&val!==null&&val!==""){
       dl.append(h("dt",{text:label}),h("dd",{text:String(val)}))
     }
     inspector.append(dl);
     if(gearMode==="equipment"){
       const validity=window.PandoraStudioRules.equipment(rec,{slot,job,level:state.level});
       if(!validity.allowed)inspector.append(h("p",{class:"item-incompatible",text:"Не подходит: "+validity.missing.join(" · ")}));
     }
   }
   if(rec.desc)inspector.append(h("p",{class:"item-description",text:rec.desc}));
   if(rec.effects?.length)inspector.append(h("p",{class:"muted",text:"Дополнительные эффекты присутствуют в исходных данных. Их боевой расчёт в Build Studio пока не моделируется."}));
   inspector.append(h("p",{class:"source",text:catalog.live?"Источник: Pandora Saga OS /gamedata/. Значения являются полями источника, не результатом вычисления билда.":"Исторический каталог Legacy 2.00."}));
 }
 if(!records.length)list.append(h("p",{class:"muted",text:"Загрузка каталога или источник недоступен."}));
 if(!matching.length&&records.length)list.append(h("p",{class:"muted",text:"Совпадений нет. Измени запрос или другой слот."}));
 for(const rec of matching.slice(0,gearShown)){
   const id=String(rec.id),current=selected&&String(selected.id)===id;
   const eligible=catalog.live&&gearMode==="equipment"?
    window.PandoraStudioRules.equipment(rec,{slot,job,level:state.level}):{allowed:true,missing:[]};
   const button=h("button",{class:"item-card"+(current?" active":"")+(eligible.allowed?"":" incompatible"),
     "aria-disabled":String(!eligible.allowed),
     title:eligible.allowed?"Надеть "+itemName(rec):eligible.missing.join(" · "),
     onmouseenter:()=>inspect(rec),onfocus:()=>inspect(rec),
     onclick:()=>{
       inspect(rec);
       if(!eligible.allowed)return;
       const item={id:rec.id,name:itemName(rec),level:rec.level||null,icon:rec.icon||null};
       if(gearMode==="souls")state.souls[selectedSlot]=item;else state.equipment[selectedSlot]=item;
       persist();render();
     }});
   const icon=itemIcon(rec,gearMode==="souls"?"souls":"items");
   if(icon){const image=editAttr(h("img",{src:icon,alt:"",loading:"lazy"}),(gearMode==="souls"?"visual.soul.":"visual.item.")+id);
     image.onerror=()=>{image.onerror=null;image.replaceWith(h("span",{class:"item-glyph",text:"✦"}))};button.append(image)}
   else button.append(h("span",{class:"item-glyph",text:"✦"}));
   button.append(h("strong",{text:editableValue((gearMode==="souls"?"soul.":"item.")+id,itemName(rec))}),
      h("small",{text:"ID "+id+(rec.level?" · Lv "+rec.level:"")}));
   list.append(button)
 }
 inventory.append(list);
 if(matching.length>gearShown)inventory.append(h("button",{class:"button-action show-more",text:"Показать ещё · осталось "+(matching.length-gearShown),
  onclick:()=>{gearShown+=60;renderDetails()}}));
 inspect(selectedRec);
 if(selected)inspector.append(h("button",{class:"button-action",text:"✕ Снять выбранный предмет",onclick:()=>{
   if(gearMode==="souls")delete state.souls[selectedSlot];else delete state.equipment[selectedSlot];
   persist();render();
 }}));
 layout.append(slotsPanel,inventory,inspector);root.append(layout);
}
function renderStats(root){root.append(h('p',{class:'muted',text:'Здесь записывается только план распределения. Игровые HP, MP, атака, защита и прочие показатели не вычисляются без подтверждённого движка.'}));const grid=h('div',{class:'stat-grid'});STATS.forEach(key=>{const box=h('div',{class:'stat-card'});box.append(h('h3',{text:key}),h('b',{text:String(state.stats[key]||0)}));const slider=h('input',{type:'range',min:'0',max:'100',step:'1',value:state.stats[key]||0,'aria-label':'Распределение '+key,oninput:e=>{state.stats[key]=Number(e.target.value);persist();box.querySelector('b').textContent=e.target.value}});box.append(slider,h('span',{text:'Планируемое распределение — не игровые итоговые характеристики'}));grid.append(box)});root.append(grid)}
function compareSnapshots(a,b){const rows=[];for(const branch of branches){const x=a.points?.[branch.id]||0,y=b.points?.[branch.id]||0;if(x!==y)rows.push(`${branch.name}: ${x} → ${y} (${y>x?'+':''}${y-x})`)}for(const stat of STATS){const x=a.stats?.[stat]||0,y=b.stats?.[stat]||0;if(x!==y)rows.push(`${stat}: ${x} → ${y}`)}return rows}
function renderBuilds(root){const toolbar=h('div');toolbar.append(h('button',{class:'button-action primary',text:'✧ Сохранить текущий билд',onclick:()=>saveBuild()}),h('button',{class:'button-action',text:'⇩ Экспорт JSON',onclick:exportBuild}),h('button',{class:'button-action',text:'⇧ Импорт JSON',onclick:importBuild}));root.append(toolbar,h('p',{class:'muted',text:'Билды хранятся локально в этом браузере. Сравнение показывает изменения выбора, а не вымышленные боевые результаты.'}));const grid=h('div',{class:'build-grid'});builds.forEach(b=>{const box=h('div',{class:'build-card'}),check=h('input',{type:'checkbox','aria-label':'Сравнить '+b.name});check.checked=compareIds.includes(b.id);check.onchange=()=>{if(check.checked)compareIds=[...compareIds,b.id].slice(-2);else compareIds=compareIds.filter(id=>id!==b.id);renderDetails()};box.append(h('h3',{text:b.name}),h('p',{text:`${races[b.data.race]?.[0]||'?'} · ${jobs[b.data.job]||'?'} · Lv ${b.data.level}`}),h('label',{},[check,' Сравнить']),h('button',{class:'button-action',text:'Открыть',onclick:()=>{state=structuredClone(b.data);persist();render();changeTab('character')}}),h('button',{class:'button-action',text:'Удалить',onclick:()=>{builds=builds.filter(x=>x.id!==b.id);compareIds=compareIds.filter(id=>id!==b.id);persistBuilds();renderDetails()}}));grid.append(box)});root.append(grid);if(compareIds.length===2){const [a,b]=compareIds.map(id=>builds.find(x=>x.id===id));if(a&&b){const results=compareSnapshots(a.data,b.data);root.append(h('h3',{text:`Сравнение: ${a.name} / ${b.name}`}),h('p',{class:'muted',text:results.join(' · ')||'Выборы совпадают'}))}}}
function newId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
function saveBuild(){const name=prompt('Название билда',state.name||'Новый герой');if(!name)return;builds.unshift({id:newId(),name:name.slice(0,70),data:structuredClone(state),at:Date.now()});persistBuilds();renderDetails()}
function exportBuild(){const data=JSON.stringify({schema:1,app:'Pandora Saga Build Studio',data:state},null,2);const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob);const a=h('a',{href:url,download:'pandora-build.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function importBuild(){const input=h('input',{type:'file',accept:'.json,application/json',onchange:async()=>{try{const d=JSON.parse(await input.files[0].text());if(d.schema!==1||!d.data||!Number.isInteger(d.data.race)||!Number.isInteger(d.data.job))throw Error('Неверный формат');state={...fresh(),...d.data};persist();render();alert('Билд загружен')}catch(e){alert('Импорт не выполнен: '+e.message)}}});input.click()}
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
function showAdmin(){const body=h('div');body.append(h('p',{class:'muted',text:adminToken?'Режим редактора подтверждён сервером. Изменения сохраняются в Cloudflare D1.':'Вход администратора защищён сервером Cloudflare Worker. Никаких паролей в GitHub Pages нет.'}));if(adminToken){body.append(h('button',{class:'button-action primary',text:adminEditing?'Выключить редактирование':'Включить редактирование',onclick:()=>{adminEditing=!adminEditing;$('modalRoot').hidden=true;render();updateAdminHint()}}),h('button',{class:'button-action',text:'Выйти',onclick:async()=>{try{await apiRequest('/api/admin/logout',{})}catch{}adminToken='';adminEditing=false;ownerEdits.length=0;closeInlineEditor();$('modalRoot').hidden=true;render();updateAdminHint()}}));modal('Управление сайтом',body);return}
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
  const visual=key.startsWith('visual.');
  const original=visual?(el.getAttribute('src')||''):(el.textContent||'');
  const previous=activeOverride(key);
  const root=h('div',{class:'inline-owner-editor',role:'dialog','aria-label':'Изменение '+key});
  const bar=h('div',{class:'inline-owner-head'});
  bar.append(h('strong',{text:visual?'Сменить изображение':'Изменить текст'}),
    h('button',{type:'button',text:'✕','aria-label':'Закрыть редактор',onclick:closeInlineEditor}));
  const input=visual?h('input',{type:'text','aria-label':'Путь к изображению',value:original,placeholder:'assets/image.webp'}):
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
    if(visual?!allowedArtwork(value):(!value||value.length>(key.startsWith('skilldesc.')?2000:240))){
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
async function loadCatalog(){try{const names=['meta','classes','skills','items','souls'];let entries,sourceLabel='снимок 30.10.2026';const obtain=base=>Promise.all(names.map(async n=>{const r=await fetch(`${base}/${n}.json`,{signal:AbortSignal.timeout(2000)});if(!r.ok)throw Error(n+' '+r.status);return [n,await r.json()]}));try{entries=await obtain(`${OS}/gamedata`);sourceLabel='прямой сервер OS'}catch{try{entries=await obtain(`${API}/api/gamedata`);sourceLabel='OS через Worker'}catch{entries=await obtain('./data/os')}}const live=Object.fromEntries(entries);if(!live.meta?.counts?.skills||!live.classes?.CLERIC)throw Error('Invalid current OS snapshot');catalog={meta:live.meta,classes:live.classes,skills:live.skills,equipment:live.items,souls:live.souls,live:true};jobs=jobKeys.map(id=>live.classes[id]?.name||id);branches=live.meta.branchNames.map(id=>({id,name:live.meta.branchLabels[id]||id}));const oldToOS={1:'slash',2:'thrust',3:'brush',4:'blow',5:'defense',7:'archery',8:'alchemy',9:'assassin',10:'trap',11:'warding',13:'benevolence',14:'blessing',15:'exorcism',16:'hymn',18:'element',19:'embody',20:'darkness',21:'charm',23:'race',24:'riding'};state.points=Object.fromEntries(Object.entries(state.points).map(([k,v])=>[oldToOS[k]||k,v]));if(typeof state.branch==='number')state.branch=oldToOS[state.branch]||'brush';$('siteNotice').textContent='Игровые данные и иконки: Pandora Saga OS. На странице отображаются исходные значения сервера; неподтверждённые боевые расчёты не выполняются.';$('catalogStatus').textContent=`Pandora Saga OS · ${live.meta.counts.skills} навыков · ${live.meta.counts.items} предметов · ${live.meta.counts.souls} душ · ${sourceLabel}`;persist();render();return}catch(e){console.warn('OS snapshot unavailable; loading historical data',e)}const names=['skills','equipment','souls'];await Promise.all(names.map(async name=>{try{const r=await fetch(`${SRC}data/generated/${name}.v1.json`,{cache:'force-cache'});if(!r.ok)throw Error('HTTP '+r.status);catalog[name]=await r.json()}catch(e){console.warn(name,e)}}));$('siteNotice').textContent='Официальные данные Pandora Saga OS временно недоступны. Используется историческая база Legacy 2.00.';$('catalogStatus').textContent=`Legacy: ${catalog.skills?.count||0} навыков · ${catalog.equipment?.count||0} вещей · ${catalog.souls?.count||0} душ`;renderDetails()}
async function loadOverrides(){try{const response=await apiRequest('/api/overrides',null,'');override=response.values||{};render();updateAdminHint()}catch{ /* Not deployed or CORS restricted; static site remains usable. */ }}
$('nav').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)changeTab(b.dataset.tab)};$('level').oninput=e=>{state.level=Number(e.target.value);persist();render()};$('genderF').onclick=()=>{state.gender=0;persist();render()};$('genderM').onclick=()=>{state.gender=1;persist();render()};$('swapGender').onclick=()=>{state.gender=1-state.gender;persist();render()};$('genderF').onclick=()=>{state.gender=0;persist();render()};$('genderM').onclick=()=>{state.gender=1;persist();render()};$('jumpEquipment').onclick=()=>changeTab('equipment');$('allSkills').onclick=()=>changeTab('skills');$('snapshot').onclick=()=>{saveBuild();changeTab('builds')};$('locale').onclick=()=>{alert('Полная локализация игрового каталога RU/EN находится в разработке. Оригинальные EN-названия оставлены без вымышленных переводов.')};document.addEventListener('click',event=>{if(!adminEditing||!event.target.closest||event.target.closest('#ownerDock, .inline-owner-editor, #modalRoot'))return;const editable=event.target.closest('[data-edit-key]');if(editable){event.preventDefault();event.stopImmediatePropagation();editor(editable)}},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeInlineEditor()});

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
render();loadCatalog();loadOverrides();