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
let branches=window.PandoraGameNavigation.groups.flatMap(group=>group.branches.map(id=>({id,name:id})));
let selectedSkillGroup='melee';
const jobKeys=['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN','SCOUT','ARCHER','SNIPER','PREDATOR','AGENT','ASSASSIN','DISTURBANCE','ACOLYTE','PRIEST','CLERIC','ENCHANTER','ASCETIC','MONK','EXORCIST','MAGE','WIZARD','WARLOCK','CONJURER','DARKROAR','JESTER','CALAMITY'];
const slotKeys=['weapon','shield','head','body','gloves','legs','feet','cloak','ring','ring','neck','belt','ear','ear'];
const slots=[['Оружие','⚔'],['Щит','◈'],['Шлем','♜'],['Нагрудник','♟'],['Перчатки','♧'],['Поножи','♙'],['Обувь','♧'],['Плащ','❧'],['Кольцо I','◉'],['Кольцо II','◉'],['Амулет','✥'],['Пояс','♢'],['Серьга I','✧'],['Серьга II','✧']];
function fresh(){return{race:1,gender:0,job:16,level:50,branch:3,points:Object.fromEntries(branches.map(b=>[b.id,0])),stats:Object.fromEntries(STATS.map(s=>[s,0])),equipment:{},souls:{},refinements:{},name:'Новый герой',profile:{guild:'',nation:'',rank:'',about:''},racialPassiveId:null}};
let state=fresh(),activeTab='character',catalog={skills:null,equipment:null,souls:null,classes:null,meta:null,racialPassives:null,live:false},selectedSkill=null,selectedSlot=0,filter='',gearMode='equipment',builds=[],override={},adminToken='',adminEditing=false,lang=localStorage.getItem('ps-build-lang')==='en'?'en':'ru',catalogSource=null,officialEnglish=null,compareIds=[],skillSearch='',skillOnlyAvailable=false,gearShown=60,selectedSocket=0,gearDisplayMode=localStorage.getItem('ps-gear-view')==='list'?'list':'grid',inspectedGearId=null,inspectorPinned=false,characterPanelTab='character',iconManifest=null,wikiData=null,wikiIndex=null,wikiPending=null,wikiSelection={type:'item',id:null,highlight:null},wikiSearch='';
try{const saved=localStorage.getItem('ps-build-studio.v1');if(saved){const parsed=JSON.parse(saved);state={...fresh(),...parsed,points:{...fresh().points,...parsed.points},stats:{...fresh().stats,...parsed.stats},refinements:{...fresh().refinements,...parsed.refinements},profile:{...fresh().profile,...parsed.profile}}} builds=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')}catch(e){console.warn('Saved data skipped',e)}
function persist(){try{localStorage.setItem('ps-build-studio.v1',JSON.stringify(state))}catch{}}
function persistBuilds(){try{localStorage.setItem('ps-build-library.v1',JSON.stringify(builds))}catch{}}
function h(tag,attrs={},children=[]){const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='html')throw Error('HTML injection prohibited');else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(v!==undefined&&v!==null)el.setAttribute(k,String(v))}for(const c of [].concat(children))if(c!==null&&c!==undefined)el.append(typeof c==='string'?document.createTextNode(c):c);return el}
function imageUrl(name){return `assets/${name}.webp`}
const BRANCH_ICON_PATHS={"slash":"assets/skills/legacy/01-00.png","thrust":"assets/skills/legacy/02-00.png","brush":"assets/skills/legacy/03-00.png","blow":"assets/skills/legacy/04-00.png","defense":"assets/skills/legacy/05-00.png","archery":"assets/skills/legacy/07-00.png","alchemy":"assets/skills/legacy/08-00.png","assassin":"assets/skills/legacy/09-00.png","trap":"assets/skills/legacy/10-00.png","warding":"assets/skills/legacy/11-00.png","benevolence":"assets/skills/legacy/13-00.png","blessing":"assets/skills/legacy/14-00.png","exorcism":"assets/skills/legacy/15-00.png","hymn":"assets/skills/legacy/16-00.png","element":"assets/skills/legacy/18-00.png","embody":"assets/skills/legacy/19-00.png","darkness":"assets/skills/legacy/20-00.png","charm":"assets/skills/legacy/21-00.png","riding":"assets/skills/legacy/24-00.png"};
function branchIcon(id){return BRANCH_ICON_PATHS[id]||'assets/ui/icons/skill-unknown.svg'}
function skillIcon(cat,idx,record=null){const custom=override['visual.skill.'+(record?.id??(cat+'.'+idx))];if(custom)return custom;if(catalog.live&&record?.iconId){const path=iconManifest?.icons?.skills?.['skill_'+record.iconId];return path||`${OS}/icons/skills/skill_${record.iconId}.webp?v=07682901`}return `${SRC}image/icon/${String(cat).padStart(2,'0')}${String(idx).padStart(2,'0')}.png`}
function itemIcon(rec,kind='items'){const custom=override[(kind==='souls'?'visual.soul.':'visual.item.')+rec?.id];if(custom)return custom;return rec?.icon?(iconManifest?.icons?.[kind]?.[rec.icon]||`${OS}/icons/${kind}/${rec.icon}.webp?v=07682901`):null}
function branchCap(branch){return catalog.live?(window.PandoraStudioRules.branchCap(catalog.classes,jobKeys[state.job],branch)??0):90}
function editableValue(key,defaultValue){return Object.prototype.hasOwnProperty.call(override,key)?override[key]:defaultValue}
function editAttr(el,key){el.dataset.editKey=key;if(adminEditing)el.classList.add('admin-edit');return el}
function raceSource(i,gender){
return override["visual.race."+i+"."+(gender?"m":"f")]||imageUrl(races[i][gender?3:2]);
}
function renderRaces(){const grid=$('raceGrid');grid.replaceChildren();races.forEach((r,i)=>{const button=h('button',{class:'race-choice'+(state.race===i?' active':''),'aria-pressed':state.race===i,onclick:()=>{state.race=i;state.racialPassiveId=null;selectedSkill=null;persist();render()}});button.append(editAttr(h('img',{src:raceSource(i,state.gender),alt:r[0],loading:'lazy'}),'visual.race.'+i+'.'+(state.gender?'m':'f')),editAttr(h('b',{text:editableValue('race.'+i,r[0])}),'race.'+i));grid.append(button)})}
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
 const plan=window.PandoraEquipmentPlan;
 for(const[id,indexes]of[['railLeft',[0,2,3,4,5,6]],['railRight',[1,7,8,9,10,11,12,13]]]){
  const container=$(id);container.replaceChildren();
  for(const i of indexes){
   const item=state.equipment?.[i],source=item&&equippedRecord(i),cap=plan.socketCapacity(source);
   const report=plan.socketReport(state.souls?.[i],cap);
   const level=plan.refinementValue(state.refinements,i,item);
   const tooltip=slots[i][0]+' · '+(item?.name||'Пусто')+(item&&cap!==null?' · души '+Math.min(report.count,cap)+'/'+cap:'')+(level?' · план заточки +'+level:'');
   const button=h('button',{class:'equipment-slot'+(item?' equipped':'')+(selectedSlot===i?' selected':'')+(report.excess?' socket-conflict':''),
    'aria-label':tooltip,title:tooltip,onclick:()=>{selectedSlot=i;selectedSocket=0;gearMode='equipment';changeTab('equipment');renderSlotRails()}});
   button.append(slotVisual(i),h('small',{text:item?.name||slots[i][0]}));
   if(item&&cap!==null&&cap>0)button.append(h('span',{class:'stage-sockets',text:'◈ '+Math.min(report.count,cap)+'/'+cap}));
   if(item&&level>0)button.append(h('span',{class:'stage-enhance',text:'+'+level}));
   if(report.excess>0)button.append(h('span',{class:'stage-conflict',text:'!','aria-label':'Конфликт гнёзд'}));
   container.append(button);
  }
 }
}
function renderBranches(){
 const c=$('skillBranches');c.replaceChildren();
 for(const group of window.PandoraGameNavigation.groups){
  const total=group.branches.reduce((sum,id)=>sum+Number(state.points[id]||0),0);
  const wrap=h('section',{class:'game-tree-group'});
  const head=h('button',{class:'game-tree-head'+(selectedSkillGroup===group.id?' active':''),
    onclick:()=>{selectedSkillGroup=group.id;if(!group.branches.includes(state.branch))state.branch=group.branches.find(id=>id!=='race')||'riding';persist();renderBranches();changeTab('skills')}});
  head.append(h('strong',{text:lang==='en'?group.en:group.ru}),h('small',{text:total?String(total)+' очк.':String(group.branches.length)+' веток'}));wrap.append(head);
  if(selectedSkillGroup===group.id){
   for(const id of group.branches){
    const b=branches.find(item=>item.id===id);if(!b)continue;
    wrap.append(id==='race'?h('button',{class:'branch-row game-passive-link',text:'✦ Расовые пассивные умения',onclick:()=>{changeTab('character');characterPanelTab='character';renderDetails()}}):branchRow(b,false));
   }
  }
  c.append(wrap);
 }
}
function branchRow(b,full){const points=state.points[b.id]||0;const btn=h('button',{class:'branch-row'+(state.branch===b.id?' active':''),onclick:()=>{state.branch=b.id;selectedSkill=null;persist();renderBranches();$('branchValue').textContent=points;changeTab('skills')}});const first=catalog.live?Object.values(catalog.skills||{}).find(x=>x.branch===b.id&&x.classes?.[jobKeys[state.job]]):null;const icon=h('img',{class:'tinyicon',src:branchIcon(b.id),alt:'',loading:'lazy'});icon.onerror=()=>{icon.onerror=null;icon.style.display='none'};btn.append(icon,h('div',{},[h('strong',{text:editableValue('branch.'+b.id,b.name)}),h('span',{text:catalog.live?('Лимит класса: '+branchCap(b.id)):'Историческая ветка'})]),h('b',{class:'count',text:String(points)}));return btn}
function render(){const hudName=document.getElementById('psHudName');if(hudName)hudName.textContent=state.name||'Без имени';const hudLevel=document.getElementById('psHudLevel');if(hudLevel)hudLevel.textContent=String(state.level);const logo=document.querySelector('.brand img');if(logo)logo.src=override['visual.logo']||'assets/pandora-logo.png';renderRaces();renderJobs();$('genderF').classList.toggle('chosen',state.gender===0);$('genderM').classList.toggle('chosen',state.gender===1);$('hero').src=raceSource(state.race,state.gender);$('hero').dataset.editKey='visual.race.'+state.race+'.'+(state.gender?'m':'f');$('hero').classList.toggle('admin-edit',adminEditing);$('hero').alt=races[state.race][0];$('raceTitle').textContent=editableValue('race.'+state.race,races[state.race][0]);$('jobTitle').textContent=editableValue('job.'+state.job,jobs[state.job]);$('activeJob').textContent=$('jobTitle').textContent;$('activeRace').textContent=$('raceTitle').textContent+' · '+state.level+' ур.';$('level').value=state.level;$('levelOut').textContent=state.level;$('branchValue').textContent=state.points[state.branch]||0;$('itemValue').textContent=Object.values(state.equipment).filter(Boolean).length;renderSlotRails();renderBranches();$('budgetState').textContent='Лимиты и стоимость очков проверяются только настоящим движком. Пока — планировщик распределения.';renderDetails();const title=document.querySelector('[data-edit-key="site.title"]'),subtitle=document.querySelector('[data-edit-key="site.subtitle"]');if(title)title.textContent=editableValue('site.title','Создай свою легенду');if(subtitle)subtitle.textContent=editableValue('site.subtitle','Выбери расу, профессию, снаряжение и путь развития персонажа.');updateAdminHint()}
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
 renderDetails();$('detailPanel').scrollIntoView({behavior:'smooth',block:'start'});
}
function wikiLink(text,type,id,highlight=null){
 return h('button',{class:'wiki-link',type:'button',text,onclick:()=>openWiki(type,id,highlight)});
}
function renderWiki(root){
 const browse=h('div',{class:'wiki-list'}),detail=h('article',{class:'wiki-page'});
 const controls=h('div',{class:'wiki-controls'}),categories=h('div',{class:'wiki-categories'});
 for(const [key,label]of[['item','Предметы'],['monster','Монстры'],['map','Локации'],['npc','NPC-обмен'],['chest','Сундуки'],['instance','Подземелья'],['skill','Навыки'],['soul','Души']]){
  categories.append(h('button',{class:wikiSelection.type===key?'chosen':'',text:label,onclick:()=>{wikiSelection={type:key,id:null,highlight:null};wikiSearch='';renderDetails()}}));
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
  browse.replaceChildren();detail.replaceChildren();
  const type=wikiSelection.type;
  const catalog=type==='item'?wikiData.items:type==='monster'?wikiData.monsters:type==='map'?wikiData.maps:
    type==='npc'?wikiData.trades?.npcs:type==='skill'?wikiData.skills:type==='soul'?wikiData.souls:type==='instance'?Object.fromEntries((wikiData.instances||[]).map(i=>[i.id,i])):Object.fromEntries((wikiData.chests?.boxes||[]).map(item=>[item.i,item]));
  const q=wikiSearch.toLocaleLowerCase().trim();
  const visible=Object.entries(catalog||{}).filter(([id,rec])=>
    !q||id.includes(q)||String(rec.name||'').toLocaleLowerCase().includes(q)||String(dataName(type,id)).toLocaleLowerCase().includes(q)
  ).slice(0,100);
  browse.append(h('p',{class:'muted',text:'Показано '+visible.length+' записей (первые 100)'}));
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
  const id=wikiSelection.id,rec=id==null?null:catalog?.[id];
  if(!rec){detail.append(h('p',{class:'muted',text:'Выбери запись для просмотра характеристик и связанных источников.'}));return}
  detail.append(h('small',{class:'eyebrow',text:type+' · '+id}),h('h3',{text:dataName(type,id)}));
  if(type==='item'){
    const src=itemIcon(rec);
    if(src){const img=h('img',{src,alt:'',class:'wiki-record-icon wiki-item-portrait'});img.onerror=()=>img.remove();detail.prepend(img)}
  }
  if(rec.desc)detail.append(h('p',{class:'wiki-description',text:lang==='en'?(officialEnglish?.[type==='item'?'items':type==='monster'?'monsters':type==='skill'?'skills':type==='soul'?'souls':'maps']?.[id]?.d||rec.desc):rec.desc}));
  if(type==='item'){
    const dl=h('dl',{class:'item-fields'});
    for(const [label,value]of[['Тип',rec.kind],['Уровень',rec.level],['Атака',rec.W],['Защита',rec.AC],['Гнёзда',rec.soulslot]])if(value!=null)dl.append(h('dt',{text:label}),h('dd',{text:String(value)}));
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
 search.addEventListener('input',()=>{wikiSearch=search.value;if(wikiIndex)draw()});
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
 const tabs=h("div",{class:"ps-character-tabs",role:"tablist","aria-label":"Окно персонажа"});
 const selection=[["character","Персонаж"],["skills","Умения"],["profile","Профиль"],["stats","Статы"]];
 for(const[key,label]of selection){
  tabs.append(h("button",{role:"tab","aria-selected":String(characterPanelTab===key),class:characterPanelTab===key?"chosen":"",
   text:label,onclick:()=>{characterPanelTab=key;renderDetails()}}));
 }
 root.append(tabs);
 const body=h("section",{class:"ps-character-body"});
 if(characterPanelTab==="skills")renderSkills(body);
 else if(characterPanelTab==="stats")renderStats(body);
 else if(characterPanelTab==="profile")renderProfile(body);
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
  body.append(h("p",{class:"muted",text:"Выбери вкладку для детальной настройки. Внутри работает тот же редактор навыков и характеристик, что и в основной мастерской — данные не дублируются."}));
  const jump=h("div",{class:"ps-overview-actions"});
  for(const[key,label]of[["skills","⚔ Открыть умения"],["stats","✥ Характеристики"],["profile","✎ Изменить профиль"]]){
   jump.append(h("button",{class:"button-action",text:label,onclick:()=>{characterPanelTab=key;renderDetails()}}));
  }
  body.append(jump);
 }
 root.append(body);
}
function renderSkills(root){
const rules=window.PandoraStudioRules;
const layout=h("div",{class:"skill-layout"}),picker=h("div",{class:"skill-picker"}),center=h("div",{class:"skill-center"}),info=h("div",{class:"skill-info"});
const tabs=h("div",{class:"game-skill-categories",role:"tablist","aria-label":"Категории умений"});
for(const group of window.PandoraGameNavigation.groups){
 const tab=h("button",{role:"tab","aria-selected":String(selectedSkillGroup===group.id),class:selectedSkillGroup===group.id?"chosen":"",text:lang==='en'?group.en:group.ru,
 onclick:()=>{selectedSkillGroup=group.id;if(!group.branches.includes(state.branch))state.branch=group.branches.find(id=>id!=='race');selectedSkill=null;persist();renderBranches();renderDetails()}});
 tabs.append(tab)
}
const selectedGroup=window.PandoraGameNavigation.groups.find(g=>g.id===selectedSkillGroup)||window.PandoraGameNavigation.groups[0];
const activeBranches=h("div",{class:"game-skill-subbranches"});
for(const id of selectedGroup.branches){
 if(id==='race'){
 activeBranches.append(h("button",{class:"game-racial-nav",text:"✦ "+(lang==='en'?'Racial passive choice':'Расовая пассивка (выбор при создании)'),onclick:()=>{characterPanelTab='character';changeTab('character')}}));
 continue;
 }
 const b=branches.find(x=>x.id===id);
 if(b)activeBranches.append(branchRow(b,true))
}
picker.append(tabs,activeBranches);
const group=window.PandoraGameNavigation.branchGroup(state.branch);
if(!group||group.id!==selectedSkillGroup||state.branch==='race')state.branch=window.PandoraGameNavigation.groups.find(g=>g.id===selectedSkillGroup)?.branches.find(id=>id!=='race')||'slash';
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
info.append(wikiLink('📜 Статья навыка','skill',id));
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
root.append(picker);layout.append(center,info);root.append(layout);
}
function isCostumeOverlay(item){return Boolean(item&&(item.isCostumeOverlay===true||String(item.kind||'').startsWith('DECO_')))}
function itemName(r){return r?.name?.en||r?.names?.en||r?.name||r?.id||'Без названия'}
function renderEquipment(root){
 const lib=window.PandoraEquipmentPlan;
 const layout=h('div',{class:'gear-layout'+(gearMode==='enhancement'?' refinement-layout':'')});
 const slotColumn=h('div',{class:'gear-slot-column'}),main=h('div',{class:'gear-inventory-column'}),side=h('div',{class:'item-info'});
 const nav=h('div',{class:'toggles'});
 for(const[mode,label]of[['equipment','⚔ Экипировка'],['souls','✦ Души'],['enhancement','✧ Заточка']]){
  nav.append(h('button',{class:gearMode===mode?'chosen':'',text:label,'aria-pressed':String(gearMode===mode),onclick:()=>{
   gearMode=mode;filter='';gearShown=60;selectedSocket=0;inspectedGearId=null;inspectorPinned=false;renderDetails()
  }}));
 }
 slotColumn.append(nav,h('h3',{text:'Слоты персонажа'}));
 const slotButtons=h('div',{class:'gear-slots'});
 slots.forEach((slot,i)=>{
  const item=state.equipment?.[i],record=item&&equippedRecord(i),capacity=lib.socketCapacity(record);
  const report=lib.socketReport(state.souls?.[i],capacity);
  const button=h('button',{class:'equipment-slot'+(i===selectedSlot?' selected':'')+(item?' equipped':'')+(report.excess?' socket-conflict':''),
    title:slot[0]+': '+(item?.name||'пусто'), 'aria-label':slot[0]+': '+(item?.name||'пусто'),
    onclick:()=>{selectedSlot=i;selectedSocket=0;filter='';gearShown=60;inspectedGearId=null;inspectorPinned=false;renderDetails();renderSlotRails()}});
  button.append(slotVisual(i),h('small',{text:item?.name||slot[0]}));
  if(item&&capacity!==null)button.append(h('b',{class:'slot-socket-count',text:capacity?'◈ '+report.count+'/'+capacity:'◈ 0'}));
  slotButtons.append(button);
 });
 slotColumn.append(slotButtons);
 const chosen=state.equipment?.[selectedSlot],itemRec=chosen&&equippedRecord(selectedSlot),slot=slotKeys[selectedSlot];
 const socketLimit=lib.socketCapacity(itemRec);
 const socketItems=lib.asSocketArray(state.souls?.[selectedSlot]);
 const report=lib.socketReport(socketItems,socketLimit);
 const refinement=lib.refinementValue(state.refinements,selectedSlot,chosen);
 const sourceTag='Pandora Saga OS · архивная копия, без онлайн-синхронизации';
 const sourceRecord=(mode)=>catalog.live?Object.values(mode==='souls'?(catalog.souls||{}):(catalog.equipment||{})):
  ((mode==='souls'?catalog.souls:catalog.equipment)?.records||[]);
 const picture=(record,mode,size)=>{const src=itemIcon(record,mode==='souls'?'souls':'items');
  if(!src)return h('span',{class:'item-glyph',text:mode==='souls'?'✦':'⚔'});
  const image=editAttr(h('img',{src,alt:'',loading:'lazy',class:size||''}),(mode==='souls'?'visual.soul.':'visual.item.')+record.id);
  image.onerror=()=>{image.onerror=null;image.replaceWith(h('span',{class:'item-glyph',text:'✦'}))};return image};
 function socketChip(value,i,valid=true){
  const rec=value&&catalog.live?catalog.souls?.[String(value.id)]:null;
  const chip=h('button',{type:'button',class:'socket-chip'+(selectedSocket===i?' selected':'')+(valid?'':' invalid'),
    title:value?(value.name||rec?.name||'Душа'):'Свободное гнездо',onclick:()=>{selectedSocket=i;renderDetails()}});
  if(rec)chip.append(picture(rec,'souls',''));
  else chip.append(h('span',{class:'socket-empty',text:value?'✦':'+'}));
  chip.append(h('small',{text:String(i+1)}));return chip;
 }
 const socketPanel=h('div',{class:'socket-board'});
 socketPanel.append(h('h3',{text:'Гнёзда душ'}));
 if(!chosen)socketPanel.append(h('p',{class:'muted',text:'Сначала выбери предмет для этого слота.'}));
 else if(socketLimit===null)socketPanel.append(h('p',{class:'muted',text:'В текущем каталоге нет подтверждённого числа гнёзд для этой вещи.'}));
 else if(!socketLimit)socketPanel.append(h('p',{class:'muted',text:'У предмета 0 гнёзд согласно опубликованному каталогу.'}));
 if(socketLimit!==null&&socketLimit>0){
  const sockets=h('div',{class:'socket-grid'});
  for(let i=0;i<socketLimit;i++){
   const current=socketItems[i],record=current&&catalog.live?catalog.souls?.[String(current.id)]:null;
   sockets.append(socketChip(current,i,!current||(record&&lib.validSoul(record,slot))));
  }
  socketPanel.append(sockets);
 }
 if(report.excess){
  socketPanel.append(h('p',{class:'refine-warning',text:'⚠ Из предыдущей экипировки сохранено '+report.excess+' душ вне доступных гнёзд. Они не считаются установленными. Их можно удалить при выборе новой экипировки с достаточным числом гнёзд.'}));
 }
 if(socketLimit!==null&&socketLimit>0&&socketItems[selectedSocket]){
  socketPanel.append(h('button',{class:'button-action',text:'✕ Освободить гнездо '+(selectedSocket+1),onclick:()=>{
   const next=lib.asSocketArray(state.souls?.[selectedSlot]);next[selectedSocket]=null;
   state.souls[selectedSlot]=next;persist();render();
  }}));
 }
 slotColumn.append(socketPanel);
 const upgrade=h('div',{class:'refine-station'});
 upgrade.append(h('div',{class:'refine-emblem',text:'✧'}),h('div',{class:'refine-heading'},[
  h('div',{},[h('span',{class:'eyebrow',text:'Кузница героя'}),h('h3',{text:chosen?.name||'Предмет не выбран'})]),
  h('strong',{class:'refine-mark',text:'+'+refinement})
 ]));
 upgrade.append(h('p',{class:'muted',text:'План уровня заточки. Допустимый игровой предел, вероятность успеха, стоимость и характеристики после заточки пока не подтверждены.'}));
 if(itemRec?.plus!=null)upgrade.append(h('p',{class:'source',text:'Поле plus из каталога предмета: '+itemRec.plus+'. Не используется как формула заточки.'}));
 const controls=h('div',{class:'refine-controls'});
 const updateRefine=(n)=>{
  const v=Number(n);
  if(!chosen||!Number.isInteger(v)||v<0||v>99)return false;
  const key=lib.refinementKey(selectedSlot,chosen);
  state.refinements??={};
  state.refinements[key]=v;persist();renderDetails();
  return true;
 };
 const minus=h('button',{text:'−',type:'button','aria-label':'Убрать запланированное усиление',disabled:!chosen||refinement===0,onclick:()=>updateRefine(Math.max(0,refinement-1))});
 const number=h('input',{type:'number',min:'0',max:'99',value:String(refinement),'aria-label':'Планируемый уровень заточки',disabled:!chosen});
 number.addEventListener('change',()=>{if(!updateRefine(number.value))number.value=String(refinement)});
 const plus=h('button',{text:'+',type:'button','aria-label':'Добавить запланированное усиление',disabled:!chosen||refinement>=99,onclick:()=>updateRefine(Math.min(99,refinement+1))});
 controls.append(minus,number,plus);upgrade.append(controls,h('p',{class:'refine-note',text:'Диапазон редактора 0–99 — техническое ограничение поля ввода, а не игровая механика.'}));
 if(gearMode==='enhancement'){
  main.append(upgrade,h('div',{class:'refine-display'},[
   h('span',{text:'✦'}),h('strong',{text:'+'+refinement}),h('p',{text:'Визуальный план без расчёта шанса, атаки или защиты'})
  ]));
 }else {
  const isSoul=gearMode==='souls';
  const candidates=sourceRecord(gearMode);
  const valid=candidates.filter(rec=>!catalog.live||(isSoul?rec.slots?.includes(slot):(rec.slot===slot&&!isCostumeOverlay(rec))));
  const needle=filter.trim().toLocaleLowerCase('ru');
  const matches=valid.filter(rec=>(itemName(rec)+' '+rec.id).toLocaleLowerCase('ru').includes(needle));
  const searchRow=h('div',{class:'filter-row'});
  const search=h('input',{type:'search','aria-label':'Поиск в каталоге',placeholder:isSoul?'Название души или ID':'Название предмета или ID',value:filter,
   oninput:e=>{filter=e.target.value;gearShown=60;renderDetails();const newer=document.querySelector('.filter-row input');if(newer){newer.focus();newer.setSelectionRange(filter.length,filter.length)}}});
  searchRow.append(search);
  if(!isSoul){
   const modeSwitch=h('div',{class:'gear-view-options',role:'group','aria-label':'Режим отображения инвентаря'});
   for(const [view,label] of [['grid','▦ Сетка'],['list','☰ Список']]){
    modeSwitch.append(h('button',{type:'button',text:label,'aria-pressed':String(gearDisplayMode===view),class:gearDisplayMode===view?'chosen':'',
      onclick:()=>{gearDisplayMode=view;localStorage.setItem('ps-gear-view',view);renderDetails()}}))
   }
   searchRow.append(modeSwitch);
  }
  main.append(h('h3',{text:isSoul?'Души для '+slots[selectedSlot][0]:'Экипировка: '+slots[selectedSlot][0]}),searchRow,
   h('p',{class:'muted item-count',text:'Найдено '+matches.length+' · показано '+Math.min(gearShown,matches.length)}));
  if(isSoul){
   main.append(h('p',{class:'souls-target',text:socketLimit!==null&&socketLimit>0?'Целевое гнездо: '+(selectedSocket+1)+' из '+socketLimit:socketLimit===0?'У текущего предмета нет гнёзд. Выбор души отключён.':'Установи предмет с подтверждёнными гнёздами, чтобы выбрать душу.'}));
  }
  const list=h('div',{class:'gear-list'+(isSoul?' soul-catalog':gearDisplayMode==='grid'?' inventory-grid':' inventory-list')});
  const selectedValue=isSoul?socketItems[selectedSocket]:chosen;
  function inspect(rec){
   side.replaceChildren();
   side.append(h('h3',{text:'Карточка предмета'}));
   if(!rec){side.append(h('p',{class:'muted',text:'Наведи курсор на предмет или выбери карточку, чтобы посмотреть его свойства.'}));return}
   const preview=h('div',{class:'item-preview'});
   preview.append(picture(rec,gearMode,''),editAttr(h('strong',{text:editableValue((isSoul?'soul.':'item.')+rec.id,itemName(rec))}),(isSoul?'soul.':'item.')+rec.id));
   side.append(preview);
   const pin=h('button',{type:'button',class:'item-inspector-pin','aria-pressed':String(inspectorPinned&&String(inspectedGearId)===String(rec.id)),
     text:inspectorPinned&&String(inspectedGearId)===String(rec.id)?'📌 Открепить описание':'📌 Закрепить описание',
     onclick:()=>{
       if(inspectorPinned&&String(inspectedGearId)===String(rec.id)){inspectorPinned=false;inspectedGearId=null}
       else{inspectorPinned=true;inspectedGearId=rec.id}
       inspect(rec);
     }});
   side.append(pin);
   if(catalog.live){
    const rows=isSoul?[['ID',rec.id],['Подходящие слоты',(rec.slots||[]).join(', ')]]:
     [['ID',rec.id],['Тип',rec.kind],['Уровень',rec.level],['Атака',rec.W],['Защита',rec.AC],['Гнёзда душ',rec.soulslot],['Поле plus',rec.plus]];
    const dl=h('dl',{class:'item-fields'});
    for(const[label,val]of rows)if(val!==undefined&&val!==null&&val!=='')dl.append(h('dt',{text:label}),h('dd',{text:String(val)}));
    side.append(dl);
    if(!isSoul){
     const v=window.PandoraStudioRules.equipment(rec,{slot,job:jobKeys[state.job],level:state.level});
     if(!v.allowed)side.append(h('p',{class:'item-incompatible',text:'Не подходит: '+v.missing.join(' · ')}));
    }
   }
   if(rec.desc)side.append(h('p',{class:'item-description',text:rec.desc}));
   side.append(wikiLink(isSoul?'📜 Статья души':'📜 Статья предмета',isSoul?'soul':'item',rec.id));
   if(!isSoul){
    const area=h('div',{class:'item-origin'});
    area.append(h('h4',{text:'Где получить'}),h('p',{class:'muted',text:'Проверяю источники…'}));side.append(area);
    loadWiki().then(index=>{
     if(!area.isConnected)return;
     area.replaceChildren(h('h4',{text:'Где получить'}));
     const matches=index.sources(rec.id);
     for(const row of matches.slice(0,3)){
      let label='',target=row.type;
      if(row.type==='monster')label='Монстр '+(wikiData.monsters[row.id]?.name||row.id)+(row.percent==null?'':' · '+row.percent+'%');
      else if(row.type==='npc')label=wikiData.trades.npcs?.[row.id]?.name||'NPC '+row.id;
      else if(row.type==='chest')label='Сундук '+row.id;
      else{label='Дроп в локации '+(wikiData.maps[row.id]?.name||row.id);target='map'}
      area.append(wikiLink('➜ '+label,target,row.id,String(rec.id)));
     }
     if(!matches.length)area.append(h('p',{class:'muted',text:'Подтверждённый источник не указан'}));
     area.append(wikiLink('Открыть полную статью →','item',rec.id));
    }).catch(()=>{if(area.isConnected)area.replaceChildren(h('p',{class:'muted',text:'Источники недоступны'}))});
   }
   if(rec.effects?.length)side.append(h('p',{class:'muted',text:'Эффекты представлены в исходных данных; игровое вычисление не подключено.'}));
   side.append(h('p',{class:'source',text:sourceTag}));
  }
  if(!matches.length)list.append(h('p',{class:'muted',text:'Нет подходящих записей. Измени слот или запрос.'}));
  for(const rec of matches.slice(0,gearShown)){
   const selected=selectedValue&&String(selectedValue.id)===String(rec.id);
   const v=!isSoul&&catalog.live?window.PandoraStudioRules.equipment(rec,{slot,job:jobKeys[state.job],level:state.level}):{allowed:true,missing:[]};
   const canInsert=isSoul?Boolean(chosen&&itemRec&&!isCostumeOverlay(itemRec)&&socketLimit!==null&&selectedSocket<socketLimit&&lib.validSoul(rec,slot)):(v.allowed&&!isCostumeOverlay(rec));
   const button=h('button',{class:'item-card'+(isSoul?' soul-card':'')+(selected?' active':'')+(canInsert?'':' incompatible'),
    'aria-disabled':String(!canInsert),title:(canInsert?'Выбрать '+itemName(rec):isSoul?'Нет свободного подтверждённого целевого гнезда':v.missing.join(' · '))+' · ПКМ: закрепить описание', 'aria-label':itemName(rec),
    onmouseenter:()=>{if(!inspectorPinned)inspect(rec)},onfocus:()=>{if(!inspectorPinned)inspect(rec)},
    oncontextmenu:e=>{e.preventDefault();inspectorPinned=true;inspectedGearId=rec.id;inspect(rec)},
    onclick:()=>{
     inspect(rec);if(!canInsert)return;
     const item={id:rec.id,name:itemName(rec),level:rec.level??null,icon:rec.icon??null};
     if(isSoul){
      const next=lib.asSocketArray(state.souls?.[selectedSlot]);next[selectedSocket]=item;state.souls[selectedSlot]=next;
     }else{
      state.equipment[selectedSlot]=item;selectedSocket=0;
     }
     persist();render();
    }});
   button.append(picture(rec,gearMode,''),h('strong',{text:editableValue((isSoul?'soul.':'item.')+rec.id,itemName(rec))}),
    h('small',{text:isSoul?(rec.desc||'Иконка души'):'ID '+rec.id+(rec.level?' · Lv '+rec.level:'')}));
   list.append(button);
  }
  main.append(list);
  if(matches.length>gearShown)main.append(h('button',{class:'button-action show-more',text:'Показать ещё · осталось '+(matches.length-gearShown),
   onclick:()=>{gearShown+=60;renderDetails()}}));
  const focus=(inspectorPinned?valid.find(rec=>String(rec.id)===String(inspectedGearId)):null)||
     valid.find(rec=>String(rec.id)===String(selectedValue?.id));
  inspect(focus);
 }
 if(chosen){
  side.append(h('div',{class:'equipment-summary'},[
   h('h3',{text:'Экипировано'}),h('strong',{text:chosen.name||String(chosen.id)}),
   h('span',{text:'Гнёзда: '+(socketLimit===null?'?':socketLimit)+' · План заточки: +'+refinement})
  ]));
  side.append(h('button',{class:'button-action',text:'✕ Снять предмет',onclick:()=>{
   delete state.equipment[selectedSlot];persist();render();
  }}));
 }
 if(gearMode==='enhancement'&&socketLimit!==null)side.append(h('div',{class:'forge-summary'},[
  h('h3',{text:'Инкрустация'}),h('p',{text:'Гнёзда: '+socketLimit+' · Заполнено: '+Math.min(socketLimit,socketItems.slice(0,socketLimit).filter(Boolean).length)}),
  h('button',{class:'button-action',text:'Перейти к душам',onclick:()=>{gearMode='souls';renderDetails()}})
 ]));
 layout.append(slotColumn,main,side);root.append(layout);
}
function renderStats(root){
 const codes=['vit','str','agi','dex','spi','int'],symbols=['♥','⚔','➶','✥','✦','❂'];
 const total=STATS.reduce((sum,key)=>sum+Number(state.stats[key]||0),0);
 root.append(h('div',{class:'stat-editor-overview'},[
  h('div',{},[h('h3',{text:'Книга характеристик'}),h('p',{class:'muted',text:'Распределяй очки визуально. Пределы характеристик берутся из опубликованных данных класса Pandora Saga OS.'})]),
  h('div',{class:'stat-total'},[h('strong',{text:String(total)}),h('span',{text:'Запланировано очков'})])
 ]));
 root.append(h('p',{class:'muted',text:'Итоговые значения HP, урона и стоимость повышения характеристик не рассчитываются без проверенного игрового движка. Ни одно изменение не стирается при смене класса.'}));
 const grid=h('div',{class:'stat-grid'});
 STATS.forEach((key,i)=>{
  const code=codes[i];
  const raw=catalog.live?catalog.classes?.[jobKeys[state.job]]?.statCaps?.[code]:null;
  const cap=Number.isFinite(Number(raw))&&raw!==null&&raw!==undefined?Math.max(0,Math.trunc(Number(raw))):null;
  const value=Number(state.stats[key]||0);
  const ceiling=cap===null?Math.max(200,value):Math.max(cap,value);
  const box=h('section',{class:'stat-card stat-visual-editor'});
  const head=h('div',{class:'stat-visual-head'});
  head.append(h('span',{class:'stat-emblem',text:symbols[i]}),h('h3',{text:key}),
   h('span',{class:'stat-visual-cap',text:cap===null?'Предел не подтверждён':'Макс. '+cap}));
  const count=h('strong',{class:'stat-visual-value',text:String(value)});
  const bar=h('div',{class:'stat-visual-progress'}),fill=h('div',{class:'stat-visual-fill'});
  fill.style.width=(cap&&cap>0?Math.min(100,value/cap*100):0)+'%';
  bar.append(fill);
  const warning=h('p',{class:'stat-visual-warning',text:cap!==null&&value>cap?'Выше предела текущего класса: '+value+' / '+cap:''});
  const range=h('input',{type:'range',min:'0',max:String(ceiling),step:'1',value:String(Math.min(ceiling,value)),'aria-label':key+' — распределение'});
  const exact=h('input',{type:'number',min:'0',max:String(cap??999),step:'1',value:String(value),'aria-label':'Точное значение '+key});
  const change=n=>{
   const next=Number(n);
   if(!Number.isInteger(next)||next<0||next>(cap??999))return false;
   state.stats[key]=next;persist();
   count.textContent=String(next);exact.value=String(next);range.value=String(next);
   fill.style.width=(cap&&cap>0?Math.min(100,next/cap*100):0)+'%';
   warning.textContent=cap!==null&&next>cap?'Выше предела текущего класса: '+next+' / '+cap:'';
   const all=STATS.reduce((sum,s)=>sum+Number(state.stats[s]||0),0);
   root.querySelector('.stat-total strong').textContent=String(all);
   return true;
  };
  const adjust=delta=>{
   const current=Number(state.stats[key]||0);
   if(delta>0&&cap!==null&&current>=cap)return;
   change(Math.max(0,Math.min(cap??999,current+delta)));
  };
  const actions=h('div',{class:'stat-visual-controls'});
  const minus=h('button',{type:'button',text:'−',title:'Убрать одно очко',onclick:()=>adjust(-1)});
  const plus=h('button',{type:'button',text:'+',title:'Добавить одно очко',onclick:()=>adjust(1)});
  range.addEventListener('input',()=>{if(!change(range.value))range.value=String(state.stats[key]||0)});
  exact.addEventListener('change',()=>{if(!change(exact.value))exact.value=String(state.stats[key]||0)});
  actions.append(minus,range,plus,exact);
  box.append(head,count,bar,warning,actions);
  if(cap===null)box.append(h('p',{class:'stat-visual-hint',text:'Предел пока неизвестен. Используется редактор плана, не игровой расчёт.'}));
  else if(cap===0)box.append(h('p',{class:'stat-visual-hint',text:'Текущий класс не может вкладывать очки в эту характеристику по данным сервера.'}));
  grid.append(box);
 });
 root.append(grid);
}
function compareSnapshots(a,b){
 const rows=[];const lib=window.PandoraEquipmentPlan;
 if(a.race!==b.race||a.job!==b.job||a.level!==b.level)rows.push('Персонаж: '+(jobs[a.job]||'?')+' → '+(jobs[b.job]||'?')+' · уровень '+a.level+' → '+b.level);
 for(const branch of branches){const p=a.points?.[branch.id]||0,q=b.points?.[branch.id]||0;if(p!==q)rows.push((catalog.meta?.branchLabels?.[branch.id]||branch.name)+': '+p+' → '+q)}
 for(const stat of STATS){const p=a.stats?.[stat]||0,q=b.stats?.[stat]||0;if(p!==q)rows.push(stat+': '+p+' → '+q)}
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
function renderBuilds(root){const toolbar=h('div');toolbar.append(h('button',{class:'button-action primary',text:'✧ Сохранить текущий билд',onclick:()=>saveBuild()}),h('button',{class:'button-action',text:'⇩ Экспорт JSON',onclick:exportBuild}),h('button',{class:'button-action',text:'⇧ Импорт JSON',onclick:importBuild}));root.append(toolbar,h('p',{class:'muted',text:'Билды хранятся локально в этом браузере. Сравнение показывает изменения выбора, а не вымышленные боевые результаты.'}));const grid=h('div',{class:'build-grid'});builds.forEach(b=>{const box=h('div',{class:'build-card'}),check=h('input',{type:'checkbox','aria-label':'Сравнить '+b.name});check.checked=compareIds.includes(b.id);check.onchange=()=>{if(check.checked)compareIds=[...compareIds,b.id].slice(-2);else compareIds=compareIds.filter(id=>id!==b.id);renderDetails()};box.append(h('h3',{text:b.name}),h('p',{text:`${races[b.data.race]?.[0]||'?'} · ${jobs[b.data.job]||'?'} · Lv ${b.data.level}`}),h('label',{},[check,' Сравнить']),h('button',{class:'button-action',text:'Открыть',onclick:()=>{state=structuredClone(b.data);persist();render();changeTab('character')}}),h('button',{class:'button-action',text:'Удалить',onclick:()=>{builds=builds.filter(x=>x.id!==b.id);compareIds=compareIds.filter(id=>id!==b.id);persistBuilds();renderDetails()}}));grid.append(box)});root.append(grid);if(compareIds.length===2){const [a,b]=compareIds.map(id=>builds.find(x=>x.id===id));if(a&&b){const results=compareSnapshots(a.data,b.data);root.append(h('h3',{text:`Сравнение: ${a.name} / ${b.name}`}),h('p',{class:'muted',text:results.join(' · ')||'Выборы совпадают'}))}}}
function newId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
function saveBuild(){const name=prompt('Название билда',state.name||'Новый герой');if(!name)return;builds.unshift({id:newId(),name:name.slice(0,70),data:structuredClone(state),at:Date.now()});persistBuilds();renderDetails()}
function exportBuild(){const data=JSON.stringify({schema:1,app:'Pandora Saga Build Studio',data:state},null,2);const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob);const a=h('a',{href:url,download:'pandora-build.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function importBuild(){
 const input=h('input',{type:'file',accept:'.json,application/json',onchange:async()=>{
 try{
  const file=input.files?.[0];if(!file||file.size>1024*1024)throw Error('Файл не выбран или превышает 1 МБ');
  const raw=JSON.parse(await file.text()),original=raw?.data;
  if(raw?.schema!==1||!original||!Number.isInteger(original.race)||original.race<0||original.race>=races.length||
     !Number.isInteger(original.job)||original.job<0||original.job>=jobKeys.length||
     !Number.isInteger(original.level)||original.level<1||original.level>55)throw Error('Неверные основные параметры билда');
  const result=fresh();result.race=original.race;result.job=original.job;result.level=original.level;result.gender=original.gender===1?1:0;
  if(typeof original.name==='string')result.name=original.name.slice(0,70);
  const validBranches=new Set(branches.map(x=>String(x.id)));
  if(original.branch!=null&&validBranches.has(String(original.branch)))result.branch=original.branch;
  if(original.points&&typeof original.points==='object'&&!Array.isArray(original.points))
   for(const[k,v]of Object.entries(original.points))if(validBranches.has(k)&&Number.isInteger(v)&&v>=0&&v<=1000)result.points[k]=v;
  if(original.stats&&typeof original.stats==='object'&&!Array.isArray(original.stats))
   for(const s of STATS)if(Number.isInteger(original.stats[s])&&original.stats[s]>=0&&original.stats[s]<=1000)result.stats[s]=original.stats[s];
  const safeItem=v=>v&&(['string','number'].includes(typeof v.id))&&String(v.id).length<=24?
   {id:v.id,name:typeof v.name==='string'?v.name.slice(0,120):String(v.id),icon:typeof v.icon==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v.icon)?v.icon:null}:null;
  for(const type of ['equipment','souls']){
   if(!original[type]||typeof original[type]!=='object'||Array.isArray(original[type]))continue;
   for(let i=0;i<slots.length;i++){
    const value=original[type][i];
    if(type==='equipment'){const rec=safeItem(value);if(rec)result.equipment[i]=rec}
    else{
     const entries=window.PandoraEquipmentPlan.asSocketArray(value).slice(0,32).map(safeItem);
     if(entries.some(Boolean))result.souls[i]=entries;
    }
   }
  }
  if(original.refinements&&typeof original.refinements==='object'&&!Array.isArray(original.refinements)){
   for(const[k,v]of Object.entries(original.refinements))
    if(/^(?:[0-9]|1[0-3]):[0-9]{1,20}$/.test(k)&&Number.isInteger(v)&&v>=0&&v<=99)result.refinements[k]=v;
  }
  if(original.profile&&typeof original.profile==='object'&&!Array.isArray(original.profile)){
   for(const field of ['guild','nation','rank','about']){
    const raw=original.profile[field];
    if(typeof raw==='string')result.profile[field]=raw.slice(0,field==='about'?500:80);
   }
  }
  if(window.PandoraGameNavigation.selectionValid(catalog.racialPassives,result.race,original.racialPassiveId))result.racialPassiveId=Number(original.racialPassiveId);
  state=result;persist();render();alert('Билд импортирован. Неизвестные ограничения требуют проверки игровым движком.');
 }catch(e){alert('Импорт не выполнен: '+e.message)}
 }});input.click();
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
 if(typeof state.branch==='number')state.branch=oldToOS[state.branch]||'brush';
 if(!window.PandoraGameNavigation.all.has(state.branch)){state.branch='slash'}
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
$('nav').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)changeTab(b.dataset.tab)};$('level').oninput=e=>{state.level=Number(e.target.value);persist();render()};$('genderF').onclick=()=>{state.gender=0;persist();render()};$('genderM').onclick=()=>{state.gender=1;persist();render()};$('swapGender').onclick=()=>{state.gender=1-state.gender;persist();render()};$('genderF').onclick=()=>{state.gender=0;persist();render()};$('genderM').onclick=()=>{state.gender=1;persist();render()};$('jumpEquipment').onclick=()=>changeTab('equipment');$('allSkills').onclick=()=>changeTab('skills');$('snapshot').onclick=()=>{saveBuild();changeTab('builds')};$('locale').onclick=()=>{lang=lang==='ru'?'en':'ru';localStorage.setItem('ps-build-lang',lang);if(lang==='en'&&!officialEnglish)alert('Английский источник недоступен. Неизвестные переводы останутся на русском.');applyGameLocale()};document.addEventListener('click',event=>{if(!adminEditing||!event.target.closest||event.target.closest('#ownerDock, .inline-owner-editor, #modalRoot'))return;const editable=event.target.closest('[data-edit-key]');if(editable){event.preventDefault();event.stopImmediatePropagation();editor(editable)}},true);
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
// Restore deep links on refresh without requiring credentials or losing the current build.
function restoreWikiHash(){
 const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15})(?:\/([0-9]{1,15}))?$/);
 if(!match)return;
 wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 renderDetails();
}
window.addEventListener('hashchange',restoreWikiHash);
fetch('./assets/os-icon-manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.icons&&Number(data.count?.present)>0){iconManifest=data;render()}}).catch(()=>{});
render();loadCatalog();loadOverrides();restoreWikiHash();