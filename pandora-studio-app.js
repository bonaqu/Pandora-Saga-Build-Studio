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
 soulQuery:stageSoulQuery,wikiLayout:wikiItemLayout,
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
let branches=window.PandoraGameNavigation.groups.flatMap(group=>group.branches.map(id=>({id,name:id})));
let selectedSkillGroup=bootView.groupTouched&&bootView.skillGroup===null?null:
 window.PandoraGameNavigation.groups.some(group=>group.id===bootView.skillGroup)?bootView.skillGroup:'melee';
let heroPathPage=bootView.pathPage==='skills'?'skills':'growth',pathSkillQuery='',pathSkillFilter='all',
 pathSkillShown=24,pathGroupTouched=Boolean(bootView.groupTouched);
const jobKeys=['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN','SCOUT','ARCHER','SNIPER','PREDATOR','AGENT','ASSASSIN','DISTURBANCE','ACOLYTE','PRIEST','CLERIC','ENCHANTER','ASCETIC','MONK','EXORCIST','MAGE','WIZARD','WARLOCK','CONJURER','DARKROAR','JESTER','CALAMITY'];
const slotKeys=['weapon','shield','head','body','gloves','legs','feet','cloak','ring','ring','neck','belt','ear','ear'];
const slots=[['Оружие','⚔'],['Щит','◈'],['Шлем','♜'],['Броня','♟'],['Перчатки','♧'],['Штаны','♙'],['Обувь','♧'],['Плащ','❧'],['Кольцо I','◉'],['Кольцо II','◉'],['Амулет','✥'],['Пояс','♢'],['Серьга I','✧'],['Серьга II','✧']];
function fresh(){return{race:1,gender:0,job:16,level:1,branch:3,points:Object.fromEntries(branches.map(b=>[b.id,0])),mastery:{},masteryAuto:true,stats:Object.fromEntries(STATS.map(s=>[s,0])),equipment:{},souls:{},refinements:{},gems:{},vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},attributeBuffs:{guildAll:0,honorCuriosity:false,proelium:false,proeliumPotency:0,potionEffectsEnabled:false,guildLifeRecovery:0,guildManaRecovery:0,guildHealing:0,guildLevel:0,priestEnabled:true,priestSpi:134,priestBlessing:90,priestHymn:30,priestGratia:false,priestLapisMedio:false,priestEncouragement:false,resistanceSkillIds:[]},name:'Новый герой',profile:{guild:'',nation:'',rank:'',about:''},racialPassiveId:null}};
let state=fresh(),activeTab=bootView.tab==='equipment'?'wiki':(['character','builds','wiki'].includes(bootView.tab)?bootView.tab:'character'),catalog={skills:null,equipment:null,souls:null,classes:null,meta:null,racialPassives:null,live:false},selectedSkill=null,selectedSlot=0,gearMode='equipment',builds=[],override={},adminToken='',adminEditing=false,lang=localStorage.getItem('ps-build-lang')==='en'?'en':'ru',catalogSource=null,officialEnglish=null,approvedSkillIdNames=null,compareIds=[],skillSearch='',skillOnlyAvailable=false,wikiShown=100,selectedSocket=0,characterPanelTab='character',iconManifest=null,wikiData=null,wikiIndex=null,wikiPending=null,wikiSelection={type:'item',id:null,highlight:null},wikiSearch='',wikiItemType='equipment',wikiElementFilter='all',wikiEffectFilter='all',wikiItemLayout=bootView.wikiLayout==='grid'?'grid':'list',wikiItemEligibility='all';
try{const saved=localStorage.getItem('ps-build-studio.v1');if(saved){const parsed=JSON.parse(saved);state={...fresh(),...parsed,points:{...fresh().points,...parsed.points},stats:{...fresh().stats,...parsed.stats},refinements:{...fresh().refinements,...parsed.refinements},attributeBuffs:{...fresh().attributeBuffs,...parsed.attributeBuffs},profile:{...fresh().profile,...parsed.profile}}} builds=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')}catch(e){console.warn('Saved data skipped',e)}
const ACTIVE_BUILD_KEY='ps-active-build-id.v1';
function restoreActiveBuildId(){
 let id=null;
 try{id=sessionStorage.getItem(ACTIVE_BUILD_KEY)}catch{}
 if(!/^[a-f0-9]{32}$/.test(id||'')){
  try{id=localStorage.getItem(ACTIVE_BUILD_KEY)}catch{}
 }
 return /^[a-f0-9]{32}$/.test(id||'')&&builds.some(b=>b.id===id)?id:null;
}
let activeBuildId=restoreActiveBuildId();
function selectActiveBuild(id){
 activeBuildId=id;
 try{if(id)sessionStorage.setItem(ACTIVE_BUILD_KEY,id);else sessionStorage.removeItem(ACTIVE_BUILD_KEY)}catch{}
 try{window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),ACTIVE_BUILD_KEY,id)}catch{}
}
let racePreviewIndex=selectedPortraitIndex(state.race,state.gender),stageSlotPickerOpen=false,stageSlotQuery='',stageSlotShown=48,
inlineBranchId=bootView.groupTouched&&bootView.expandedBranch===''?'':(
 typeof bootView.expandedBranch==='string'&&window.PandoraGameNavigation.all.has(bootView.expandedBranch)?
 bootView.expandedBranch:null),
pathScrollRestored=false,
stageSlotView=['choose','details','souls','gems'].includes(bootView.slotView)?bootView.slotView:'choose',
stageSoulQuery=typeof bootView.soulQuery==='string'?bootView.soulQuery.slice(0,120):'',
stageGemQuery='',gameTables=null,gameItemForth=null,
stageAttributesPage=['summary','attack','defense','buffs','effects','recovery'].includes(bootView.attributes)?bootView.attributes:null;
if(Number.isInteger(bootView.slot)&&bootView.slot>=0&&bootView.slot<slots.length)selectedSlot=bootView.slot;
// Current character changes remain a local draft until explicit user save.
function persist(){try{window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
 'ps-build-studio.v1',JSON.stringify(state))}catch{}}
function persistBuilds(){try{window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
 'ps-build-library.v1',JSON.stringify(builds))}catch{}}
const CLOUD_TOKEN_KEY='ps-build-library-secret.v1';
const CLOUD_DELETES_KEY='ps-build-library-pending-deletes.v1';
let libraryChangeId=0;
function queuedDeletes(){
 try{return JSON.parse(window.PandoraBuildScope.getOwned(localStorage,libraryScopeId(),
  CLOUD_DELETES_KEY)).filter(v=>/^[a-f0-9]{32}$/.test(v))}
 catch{return []}
}
function queueDelete(id){const ids=new Set(queuedDeletes());ids.add(id);
 window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
  CLOUD_DELETES_KEY,JSON.stringify([...ids]))}
function acknowledgeDelete(id){window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
 CLOUD_DELETES_KEY,JSON.stringify(queuedDeletes().filter(v=>v!==id)))}
let cloudLibraryStatus='Подключаем облачную библиотеку…';
function cloudToken(){
 let token=localStorage.getItem(CLOUD_TOKEN_KEY);
 if(!/^[a-f0-9]{64}$/.test(token||'')){
  token=newId()+newId();localStorage.setItem(CLOUD_TOKEN_KEY,token);
 }
 return token;
}
// This tab owns its guest secret for its lifetime. Another browser tab may
// connect a different guest library using the same origin-localStorage.
let tabGuestSecret=cloudToken(),tabOwnerScope=null;
function libraryScopeId(){
 return window.PandoraBuildScope.owner(window.PandoraAccountUI?.username(),tabGuestSecret);
}
function restoreScopedDraft({initial=false}={}){
 try{
  const raw=JSON.parse(localStorage.getItem('ps-build-studio.v1')||'null');
  const base=fresh();state=raw&&typeof raw==='object'&&!Array.isArray(raw)?
   {...base,...raw,points:{...base.points,...raw.points},
    stats:{...base.stats,...raw.stats},equipment:{...base.equipment,...raw.equipment},
    souls:{...base.souls,...raw.souls},refinements:{...base.refinements,...raw.refinements},
    gems:{...base.gems,...raw.gems},attributeBuffs:{...base.attributeBuffs,...raw.attributeBuffs},profile:{...base.profile,...raw.profile}}:base;
 }catch{state=fresh()}
 try{
  const rows=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]');
  builds=Array.isArray(rows)?rows:[];
 }catch{builds=[]}
 activeBuildId=restoreActiveBuildId();
 compareIds=[];
 if(!initial)buildSearchQuery='';
}
function activateLibraryScope({carry=false,carryFrom=null,initial=false}={}){
 const next=libraryScopeId();
 let legacyOwner=null;
 try{
  const old=JSON.parse(localStorage.getItem('ps-account-session.v1')||'null')?.username;
  if(typeof old==='string')legacyOwner='account:'+old.toLowerCase();
 }catch{}
 const changedInStorage=window.PandoraBuildScope.transition(localStorage,next,{
  carry,carryFrom:carryFrom||window.PandoraBuildScope.owner(null,tabGuestSecret),
  legacyOwner
 }).changed;
 const changed=changedInStorage||(tabOwnerScope!==null&&tabOwnerScope!==next);
 tabOwnerScope=next;
 if(changed){
  libraryChangeId++;
  restoreScopedDraft({initial});
  if(!initial){restoreLoadedBuildUI();render()}
 }
 return changed;
}
// Preserve pre-0.197 guest backups when upgrading a browser already signed in.
window.PandoraBuildScope.migrateLegacyGuest(localStorage,tabGuestSecret);
// Claim existing pre-upgrade local records for their former owner without losing them.
activateLibraryScope({initial:true});
async function cloudLibraryRequest(payload,secret=null){
 const bearer=secret||window.PandoraAccountUI?.token()||tabGuestSecret;
 const response=await fetch(API+'/api/library',{method:payload?'POST':'GET',
  headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},
  ...(payload?{body:JSON.stringify(payload)}:{})});
 let data;try{data=await response.json()}catch{throw Error('Нет ответа облачного сервера')}
 if(!response.ok){
  const error=new Error(data?.error||'Облачный сервер недоступен');
  error.httpStatus=response.status;error.reason=data?.reason||null;throw error;
 }
 return data;
}
function reportCloudStatus(message){
 cloudLibraryStatus=message;
 const node=document.querySelector('.cloud-library-status');if(node)node.textContent=message;
}
async function putCloudBuild(entry){
 // This guard also protects accidental call sites added in future changes.
 if(entry?.localOnly===true)return false;
 const owner=libraryScopeId();
 try{
  await cloudLibraryRequest({action:'put',entry});
  if(libraryScopeId()===owner)reportCloudStatus('Сохранено в облаке');
  return true;
 }catch(error){
  console.warn('Build cloud save failed',error);
  if(libraryScopeId()===owner)reportCloudStatus(
   error.reason==='stale'||error.reason==='conflict'?
    'В облаке другая редакция · обновите библиотеку для сохранения обеих версий':
    error.reason==='deleted'?
     'Сохранено в браузере · исходный билд в облаке уже удалён':
     'Сохранено в браузере · облако недоступно');
  return false;
 }
}
async function deleteCloudBuild(id){
 const owner=libraryScopeId();
 let queued=false;
 try{queueDelete(id);queued=true}
 catch(error){console.warn('Cannot persist pending deletion',error)}
 libraryChangeId++;
 try{
  await cloudLibraryRequest({action:'delete',id});
  // Only the owner who initiated deletion can clear its local pending tombstone.
  if(libraryScopeId()!==owner)return;
  if(queued)acknowledgeDelete(id);
  reportCloudStatus('Билд удалён · все его ссылки отозваны');
  showStudioToast('Билд удалён. Все его ссылки больше не работают.','success');
 }catch(error){
  console.warn('Build cloud delete pending',error);
  if(libraryScopeId()!==owner)return;
  reportCloudStatus(queued?'Удалено в браузере · синхронизируем позже':
   'Не удалось записать удаление для повторной отправки');
  showStudioToast(queued?
   'Билд удалён локально. Ссылки перестанут работать после синхронизации с облаком.':
   'Облако недоступно. Повторное удаление не удалось поставить в очередь — пока ссылка может работать.','warning');
 }
}
async function loadCloudBuilds(){
 const generation=libraryChangeId;
 try{
  for(const id of queuedDeletes()){
   if(libraryChangeId!==generation)return;
   await cloudLibraryRequest({action:'delete',id});
   if(libraryChangeId!==generation)return;
   acknowledgeDelete(id);
  }
  const response=await cloudLibraryRequest();
  if(!Array.isArray(response.records))throw Error('Некорректная библиотека');
  // A click while GET was in flight must not bring back a deleted or old character.
  if(libraryChangeId!==generation){void loadCloudBuilds();return}
  const reconciled=window.PandoraBuildLibraryMerge.reconcile({
   local:builds,remote:response.records,pendingDeletes:queuedDeletes(),
   activeId:activeBuildId,newId
  });
  const {outgoing,copies}=reconciled;
  builds=reconciled.merged;persistBuilds();
  if(reconciled.activeId!==activeBuildId)selectActiveBuild(reconciled.activeId);
  if(activeTab==='builds')renderDetails();
  reportCloudStatus(outgoing.length?'Синхронизируем локальные изменения…':
   builds.some(entry=>entry.localOnly===true)?
    'Облако подключено · локальные копии ещё не сохранены':
    'Облачная библиотека подключена');
  for(const entry of outgoing){
   if(libraryChangeId!==generation)break;
   const current=builds.find(x=>x.id===entry.id);
   if(!current||current.at!==entry.at||queuedDeletes().includes(entry.id))continue;
   await putCloudBuild(entry);
  }
  if(copies&&libraryChangeId===generation){
   reportCloudStatus('Облачная версия основная · локальные отличия сохранены отдельной копией');
   showStudioToast('Обнаружены разные версии билда. Обе сохранены отдельно в библиотеке.','warning');
  }
 }catch(error){
  console.warn('Cloud library unavailable',error);
  if(libraryChangeId===generation)
   reportCloudStatus('Локальные билды доступны · облако пока недоступно');
 }
}

function h(tag,attrs={},children=[]){const el=document.createElement(tag);
 if(tag==='input'||tag==='textarea'){
  const credential=[attrs.name,attrs.id,attrs.placeholder,attrs['aria-label'],attrs.autocomplete]
   .filter(x=>typeof x==='string').join(' ').toLowerCase();
  const isLogin=String(attrs.type||'').toLowerCase()==='password'||
   /логин|username|login|sign.in|вход в аккаунт/.test(credential);
  if(!isLogin){
   attrs={autocomplete:'off','data-lpignore':'true','data-1p-ignore':'true',
    'data-bwignore':'true',autocapitalize:'off',spellcheck:'false',...attrs};
  }
 }
for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='html')throw Error('HTML injection prohibited');else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(k))el[k]=Boolean(v);else if(v!==undefined&&v!==null)el.setAttribute(k,String(v))}for(const c of [].concat(children))if(c!==null&&c!==undefined)el.append(typeof c==='string'?document.createTextNode(c):c);return el}
function imageUrl(name){return `assets/${name}.webp`}
const BRANCH_ICON_PATHS={"slash":"assets/skills/legacy/01-00.png","thrust":"assets/skills/legacy/02-00.png","brush":"assets/skills/legacy/03-00.png","blow":"assets/skills/legacy/04-00.png","defense":"assets/skills/legacy/05-00.png","archery":"assets/skills/legacy/07-00.png","alchemy":"assets/skills/legacy/08-00.png","assassin":"assets/skills/legacy/09-00.png","trap":"assets/skills/legacy/10-00.png","warding":"assets/skills/legacy/11-00.png","benevolence":"assets/skills/legacy/13-00.png","blessing":"assets/skills/legacy/14-00.png","exorcism":"assets/skills/legacy/15-00.png","hymn":"assets/skills/legacy/16-00.png","element":"assets/skills/legacy/18-00.png","embody":"assets/skills/legacy/19-00.png","darkness":"assets/skills/legacy/20-00.png","charm":"assets/skills/legacy/21-00.png","riding":"assets/skills/legacy/24-00.png"};
let unavailableIconIds=new Set();
function branchIcon(id){return typeof id==='string'&&Object.hasOwn(BRANCH_ICON_PATHS,id)?BRANCH_ICON_PATHS[id]:null}
function skillIcon(cat,idx,record=null){
 const custom=override['visual.skill.'+(record?.id??(cat+'.'+idx))];
 if(custom)return custom;
 if(catalog.live&&record?.iconId){
  const stem='skill_'+record.iconId,path=iconManifest?.icons?.skills?.[stem];
  if(path)return path;
  if(unavailableIconIds.has('skills/'+stem))return null;
  return `${OS}/icons/skills/skill_${record.iconId}.webp?v=07682901`;
 }
 return branchIcon(cat);
}
function itemIcon(rec,kind='items'){
 const soul=kind==='souls'||rec?.kind==='SOUL';
 const custom=override[(soul?'visual.soul.':'visual.item.')+rec?.id];
 if(custom)return custom;
 if(!rec?.icon)return null;
 const pathKind=soul?'items':kind;
 const selfHostedSoul=soul?iconManifest?.icons?.souls?.[rec.icon]:null;
 const archived=selfHostedSoul||iconManifest?.icons?.[pathKind]?.[rec.icon];
 if(archived)return archived;
 if(unavailableIconIds.has(pathKind+'/'+rec.icon))return null;
 return `${OS}/icons/${pathKind}/${rec.icon}.webp?v=07682901`;
}
function branchCap(branch){
 // No invented cap: when a game class is still loading, disable spending until real caps exist.
 return window.PandoraStudioRules.branchCap(catalog.classes,jobKeys[state.job],branch)??0;
}
function equipmentIssue(item,slot){
 if(!item)return ['Предмет отсутствует в каталоге'];
 if(!window.PandoraEquipmentPlan.matchesEquipmentSlot(slot,item,slotKeys))
  return ['Предмет не подходит этому слоту'];
 const rules=window.PandoraStudioRules.equipment(item,{
  slot:slotKeys[slot],job:jobKeys[state.job],level:state.level
 });
 const missing=[...rules.missing];
 if(!window.PandoraUIPlanner.raceCompatible(item,state.race,state.gender))
  missing.push('Не подходит происхождению героя');
 if(item.isCostumeOverlay===true||String(item.kind||'').startsWith('DECO_'))
  missing.push('Это декоративный предмет');
 if(slot===1&&item.slot==='shield'){
  const source=state.equipment?.[0];
  const weapon=source&&catalog.equipment?.[String(source.id)];
  const usable=weapon&&window.PandoraStudioRules.equipment(weapon,{
   slot:'weapon',job:jobKeys[state.job],level:state.level
  }).allowed&&window.PandoraUIPlanner.raceCompatible(weapon,state.race,state.gender)&&
   weapon.isCostumeOverlay!==true&&!String(weapon.kind||'').startsWith('DECO_');
  if(window.PandoraEquipmentPlan.occupiesOffhand(weapon,Boolean(usable)))
   missing.push('Двуручное оружие занимает обе руки');
 }
 return missing;
}
function trainedBranchMasteries(innate={}){
 return Object.fromEntries(branches.map(({id})=>[
  id,window.PandoraSkillProgression.groupAdeptness(state,[id],innate)
 ]));
}
function previewBaseStats(){
 const clazz=catalog.classes?.[jobKeys[state.job]],raceKey=window.PandoraGameNavigation.raceKeys[state.race];
 const baseClass=clazz?.baseClass||jobKeys[state.job];
 const allocation=Object.fromEntries(['vit','str','agi','dex','spi','int'].map((key,i)=>[key,Number(state.stats[STATS[i]]||0)]));
 const records=[],gemSelections=[];
 for(const [slot,selection] of Object.entries(state.equipment||{})){
  const item=selection&&catalog.equipment?.[String(selection.id)];
  if(!item||equipmentIssue(item,Number(slot)).length)continue;
  const grade=window.PandoraEquipmentPlan.refinementValue(state.refinements,Number(slot),selection);
  records.push(['item:'+item.id,item,grade]);
  const gem=window.PandoraEnchantModel.normalizeForSlot(item.slot,
   state.gems?.[window.PandoraEquipmentPlan.refinementKey(Number(slot),selection)]);
  if(gem)gemSelections.push({slot:item.slot,itemId:item.id,grade,gem});
  const souls=window.PandoraEquipmentPlan.asSocketArray(state.souls?.[slot]);
  const capacity=window.PandoraEquipmentPlan.socketCapacity(item);
  for(let i=0;i<(window.PandoraEquipmentPlan.supportsSoulSlot(slotKeys[Number(slot)])?(capacity??0):0);i++){
   const soul=souls[i]&&catalog.souls?.[String(souls[i].id)];
   if(soul&&window.PandoraEquipmentPlan.validSoul(soul,slotKeys[Number(slot)]))
    records.push(['soul:'+soul.id,soul,grade]);
  }
 }
 const initialBranches=gameTables?.jobInit?.[baseClass]?.branches||{};
 const weaponSelection=state.equipment?.[0];
 const selectedWeapon=weaponSelection&&catalog.equipment?.[String(weaponSelection.id)]||null;
 const weapon=selectedWeapon&&!equipmentIssue(selectedWeapon,0).length?selectedWeapon:null;
 const weaponGrade=weaponSelection&&weapon?
  window.PandoraEquipmentPlan.refinementValue(state.refinements,0,weaponSelection):0;
 const prayerSpirit=window.PandoraSkillProgression.legacyPrayerSpirit(
  jobKeys[state.job],state,initialBranches);
 // Remaked Status.Skill[0][0] + [1]: innate branch green mastery
 // PLUS additionally trained green; exclude blue Potential from this sum.
 const masteries=window.PandoraSkillProgression.combatMasteries(state,initialBranches);
 // Pass every trained branch to the OS skill gates; future catalog skills
 // may require more than the original Slash mastery.
 const branchMasteries=trainedBranchMasteries(initialBranches);
 const ridingMastery=window.PandoraSkillProgression.groupAdeptness(state,['riding'],initialBranches);
 const wardingMastery=window.PandoraSkillProgression.groupAdeptness(state,['warding'],initialBranches);
 const meleeMastery=masteries.melee;
 const benevolenceMastery=window.PandoraSkillProgression.groupAdeptness(
  state,['benevolence'],initialBranches);
 const legacyBuffMasteries=Object.fromEntries(['blessing','hymn','alchemy']
  .map(branch=>[branch,window.PandoraSkillProgression.groupAdeptness(
   state,[branch],initialBranches)]));
 const guildLevel=Number(state.attributeBuffs?.guildLevel)||0;
 const unlocked=window.PandoraOSCalculator.guildPassiveAtLevel(guildLevel);
 const effectiveGuildBuffs={
  vitals:guildLevel>0&&unlocked?
   {...state.vitalsBuffs,guildHp:unlocked.guildHp,guildMp:unlocked.guildMp}:
   state.vitalsBuffs||{},
  attributes:guildLevel>0&&unlocked?
   {...state.attributeBuffs,guildLifeRecovery:unlocked.guildLifeRecovery,
    guildManaRecovery:unlocked.guildManaRecovery}:state.attributeBuffs||{}
 };
 return window.PandoraOSCalculator.base({
  classData:clazz,raceData:gameTables?.raceInit?.[raceKey],jobData:gameTables?.jobInit?.[baseClass],
  allocation,level:state.level,records,itemForth:gameItemForth,gemSelections,
  unisonCatalog:catalogSource?.unison||null,
  consumableItems:catalogSource?.items||null,
  supplementalFlat:prayerSpirit?{spi:prayerSpirit}:{},
  supplementalSource:prayerSpirit?'Remaked Legacy: Inspiration / prayer Adeptness':null,
  enhancements:effectiveGuildBuffs.vitals,attributeBuffs:effectiveGuildBuffs.attributes,
  // A restored/shared build must never apply a passive from another race.
  // Normalize numeric-string legacy IDs through the same canonical owner list
  // used by the racial selection UI before *any* calculation runs.
  potionContext:{racialPassiveId:window.PandoraGameNavigation.canonicalRacialPassiveId(
   catalog.racialPassives,state.race,state.racialPassiveId),
   jobKey:jobKeys[state.job],meleeMastery},
  combatContext:{weapon,weaponGrade,weaponPlus:gameTables?.weaponPlus,
   jobKey:jobKeys[state.job],benevolenceMastery,legacyBuffMasteries,ridingMastery,wardingMastery,
   skillCatalog:catalog.skills||{},branchMasteries,
   externalPriest:{enabled:state.attributeBuffs?.priestEnabled===true,
    spi:state.attributeBuffs?.priestSpi||0,
    blessing:state.attributeBuffs?.priestBlessing||0,
    hymn:state.attributeBuffs?.priestHymn||0},...masteries}
 });
}
function renderPotionPreview(calculated){
 const root=$('originPotionResults');if(!root)return;
 const rows=window.PandoraOSCalculator.potionPreview({
  enabled:state.attributeBuffs?.potionEffectsEnabled===true,
  potionRate:calculated?.potion?.percent??null,
  maxHp:calculated?.hp??null
 });
 root.replaceChildren();
 for(const row of rows){
  if(!row.current)continue; // Never label unverified historical slots as current items.
  root.append(h('div',{class:'origin-potion-row'},[
   h('span',{text:lang==='en'?row.en:row.ru}),
   h('strong',{text:row.value??'—'})
  ]));
 }
}
function renderOriginVitals(){
 // The supported calculator returns rounded numeric totals. Parity with all server
 // buffs, sets and conditional effects is still unverified; don't imply otherwise.
 const calculated=previewBaseStats(),hp=$('originHp'),mp=$('originMp');
 const hpReady=calculated&&Number.isFinite(calculated.hp);
 const mpReady=calculated&&Number.isFinite(calculated.mp);
 if(hp)hp.textContent=hpReady?String(calculated.hp):'—';
 if(mp)mp.textContent=mpReady?String(calculated.mp):'—';
 renderPotionPreview(calculated);
 const holder=$('originVitals');
 if(holder){
  const notice=hpReady&&mpReady?
   'ОЗ '+calculated.hp+', ОМ '+calculated.mp:
   'ОЗ и ОМ появятся после загрузки игровых данных.';
  holder.setAttribute('aria-label',notice);
  holder.title=''; // Never show a second browser tooltip above game UI.
 }
}

function renderVitalsEnhancements(){
 const guildLevel=Number(state.attributeBuffs?.guildLevel)||0;
 const guildAuto=guildLevel>0?
  window.PandoraOSCalculator?.guildPassiveAtLevel?.(guildLevel):null;
 const guildNotice=guildAuto?(lang==='en'?
  'Controlled by guild level in the Hero Book':
  'Управляется уровнем гильдии в Книге героя'):'';
 for(const [id,key] of [['originGuildHp','guildHp'],['originGuildMp','guildMp']]){
  const select=$(id);
  if(select){
   select.value=String(guildAuto?.[key]??state.vitalsBuffs?.[key]??0);
   select.disabled=Boolean(guildAuto);
   select.title=guildNotice;
  }
 }
 const sign=$('originLifeSign');
 if(sign)sign.checked=state.vitalsBuffs?.lifeSign===true;
 for(const [id,key] of [['originGuildAll','guildAll'],['originGuildArouse','guildArouse'],
  ['originGuildLifeRecovery','guildLifeRecovery'],['originGuildManaRecovery','guildManaRecovery'],
  ['originGuildHealing','guildHealing']]){
  const control=$(id);
  if(control){
   const autoRecovery=Boolean(guildAuto)&&
    (key==='guildLifeRecovery'||key==='guildManaRecovery');
   control.value=String(autoRecovery?guildAuto[key]:state.attributeBuffs?.[key]??0);
   if(autoRecovery||key==='guildLifeRecovery'||key==='guildManaRecovery'){
    control.disabled=autoRecovery;
    control.title=autoRecovery?guildNotice:'';
   }
  }
 }
 for(const [id,key] of [['originUsePotionEffects','potionEffectsEnabled'],
  ['originCombatLunge','combatLunge'],['originCombatWarCry','combatWarCry'],
  ['originCombatRage','combatRage'],['originCombatDefender','combatDefender']]){
  const control=$(id);
  if(control)control.checked=state.attributeBuffs?.[key]===true;
 }
 const honor=$('originHonorTitle'),honorOptions=window.PandoraOSCalculator.honorTitles;
 if(honor){
  if(honor.options.length!==honorOptions.length){
   honor.replaceChildren();
   for(const title of honorOptions){
    const option=document.createElement('option');
    option.value=String(title.id);
    honor.append(option);
   }
  }
  for(const title of honorOptions){
   const option=honor.options[title.id];
   if(option)option.textContent=lang==='en'?title.en:title.ru;
  }
  const preferred=state.attributeBuffs?.honorTitle;
  honor.value=String(Number.isInteger(preferred)?preferred:
   state.attributeBuffs?.honorCuriosity===true?1:0);
 }
 const calculated=previewBaseStats(),potion=$('originPotionRecovery');
 renderPotionPreview(calculated);
 if(potion)potion.textContent=calculated?.potion?.percent==null?'—':
  String(calculated.potion.percent)+'%';
 for(const [id,key] of [['originRegenHp','hp'],['originRegenMp','mp']]){
  const node=$(id);if(node)node.textContent=calculated?.regeneration?.[key]?.total==null?
   '—':String(calculated.regeneration[key].total);
 }
 const info=$('originVitalsCoverage');
 if(info){
  info.textContent=calculated?'':'ОЗ и ОМ появятся после загрузки игровых данных.';
  info.hidden=Boolean(calculated);
 }
}
function setVitalsEnhancement(key,value){
 if(!['guildHp','guildMp','lifeSign'].includes(key))return;
 if(key!=='lifeSign'&&Number(state.attributeBuffs?.guildLevel)>0)return;
 const current={guildHp:0,guildMp:0,lifeSign:false,...state.vitalsBuffs};
 if(key==='lifeSign')current[key]=value===true;
 else{
  const n=Number(value);
  if(!Number.isInteger(n)||n<0||n>6)return;
  current[key]=n;
 }
 state.vitalsBuffs=current;persist();renderOriginVitals();renderVitalsEnhancements();
 if(stageAttributesPage)renderStageAttributes();
}
function setAttributeBuff(key,value){
 const current={guildAll:0,honorCuriosity:false,honorTitle:null,proelium:false,proeliumPotency:0,potionEffectsEnabled:false,guildLifeRecovery:0,guildManaRecovery:0,guildHealing:0,
  ...(state.attributeBuffs||{})};
 if(key.startsWith('resistSkill:')){
  const id=Number(key.slice('resistSkill:'.length));
  if(!Number.isSafeInteger(id)||!window.PandoraOSCalculator
   .resistanceSkillChoices(catalog.skills||{}).some(row=>row.id===id))return;
  const legal=new Set(window.PandoraOSCalculator
   .resistanceSkillChoices(catalog.skills||{}).map(row=>row.id));
  const selected=new Set(Array.isArray(current.resistanceSkillIds)?
   current.resistanceSkillIds.filter(id=>legal.has(id)):[]);
  if(value===true)selected.add(id);else selected.delete(id);
  current.resistanceSkillIds=[...selected].sort((a,b)=>a-b);
 }else if(key==='honorTitle'){
  const id=Number(value);
  if(!Number.isInteger(id)||id<0||id>=window.PandoraOSCalculator.honorTitles.length)return;
  current.honorTitle=id;
  current.honorCuriosity=id===1;
 }else if(key==='honorCuriosity'){
  current.honorCuriosity=value===true;
  current.honorTitle=current.honorCuriosity?1:0;
 }else if(['proelium','potionEffectsEnabled','combatLunge','combatWarCry',
  'combatRage','combatDefender','combatWindAssist','combatWindBlessing',
  'combatConcentration','priestEnabled','priestGratia','priestLapisMedio','priestEncouragement'].includes(key)){
  current[key]=value===true;
  if(current.combatRage&&key==='combatRage')current.combatDefender=false;
  if(current.combatDefender&&key==='combatDefender')current.combatRage=false;
 }else if(key==='guildLevel'){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>12)return;
  current.guildLevel=n;
 }else if(['priestSpi','priestBlessing','priestHymn'].includes(key)){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>500)return;
  current[key]=n;
 }else if(key==='guildArouse'){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>3)return;
  current.guildArouse=n;
 }else if(key==='guildAll'){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>6)return;
  current.guildAll=n;
 }else if(key==='proeliumPotency'){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>100)return;
  current.proeliumPotency=n;
 }else if(['guildLifeRecovery','guildManaRecovery','guildHealing'].includes(key)){
  if(key!=='guildHealing'&&Number(current.guildLevel)>0)return;
  const n=Number(value),limit=key==='guildHealing'?3:2;
  if(!Number.isInteger(n)||n<0||n>limit)return;
  current[key]=n;
 }else return;
 state.attributeBuffs=current;
 persist();renderOriginStats();renderOriginVitals();renderVitalsEnhancements();
 if(stageAttributesPage)renderStageAttributes();
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
 const selectedProfession=byKey.get(jobKeys[state.job])||null;
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
 if(selectedProfession)top.append(h('span',{class:'class-wizard-selected',role:'status',
  text:'✓ Выбрано: '+selectedProfession.name}));
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
  const selectedOnPath=Boolean(hasChildren&&activeAncestors.has(node.key)&&selectedProfession);
  const status=state.job===node.i?'✓ Выбрано':
   selectedOnPath?'✓ '+selectedProfession.name:
   hasChildren?'Специализации ›':'Выбрать';
  const specialties=Object.entries(catalog.classes?.[node.key]?.branchCaps||{})
   .filter(([,cap])=>Number(cap)>0).sort((a,b)=>Number(b[1])-Number(a[1]))
   .slice(0,2).map(([key])=>catalog.meta?.branchLabels?.[key]||key);
  choices.append(h('button',{type:'button',class:'class-wizard-choice'+(state.job===node.i?' active':'')+
    (activeAncestors.has(node.key)?' on-path':''),
    'aria-label':node.name+(selectedOnPath?' — выбранная специализация '+selectedProfession.name:
     state.job===node.i?' — выбрано':hasChildren?' — перейти к специализациям':' — выбрать профессию'),
    'aria-pressed':String(state.job===node.i),
    onclick:()=>{
     if(hasChildren){jobPathKey=node.key;renderJobs();saveView();return}
     jobPathKey=node.key;selectJob(node.i);
    }},[
      h('strong',{text:node.name}),
      h('span',{class:selectedOnPath?'class-wizard-choice-current':'class-wizard-choice-caption',text:status}),
      ...(specialties.length?[h('small',{class:'class-wizard-specialties',text:specialties.join(' · ')})]:[])
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
 newBuildPromptOpen=false;newBuildDraftName=null;
 if(old?.isConnected&&typeof old.focus==='function')old.focus({preventScroll:true});
 // The main character editor has no navigation tab; closing a dock leaves none selected.
 $('nav')?.querySelectorAll('[data-tab]').forEach(button=>button.classList.remove('active'));
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
 if(tab==='equipment')tab='wiki';
 if(!['character','builds','wiki'].includes(tab))return;
 if(tab==='character'){
  activeTab='character';closeWorkbench();
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab==='character'));
  $('workspace')?.scrollIntoView({block:'start',behavior:'smooth'});saveView();return;
 }
 // A previous #wiki/... bookmark must never override the user's current tab on F5.
 if(tab!=='wiki'&&location.hash.startsWith('#wiki/'))
  history.replaceState(history.state,'',location.pathname+location.search);
 const previous=activeTab;
 if(previous==='builds'&&tab!=='builds'){
  newBuildPromptOpen=false;newBuildDraftName=null;
 }
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
 window.PandoraStageItemUI.dismissPreview();
 const plan=window.PandoraEquipmentPlan;
 for(const[id,indexes]of[['railLeft',[0,2,3,4,5,6]],['railRight',[1,7,8,9,10,11,12,13]]]){
  const container=$(id);container.replaceChildren();
  for(const i of indexes){
   const item=state.equipment?.[i],source=item&&equippedRecord(i),cap=plan.socketCapacity(source);
   const report=plan.socketReport(state.souls?.[i],cap);
   const level=plan.canRefine(slotKeys[i])?plan.refinementValue(state.refinements,i,item):0;
   const issue=source?equipmentIssue(source,i):[];
   const tooltip=slots[i][0]+' · '+(item?itemName(item):'Пусто')+(item&&plan.canSocket(slotKeys[i],source)?' · души '+Math.min(report.count,cap)+'/'+cap:'')+(level?' · план заточки +'+level:'')+(issue.length?' · Не действует: '+issue.join(', '):'');
   const button=h('button',{class:'equipment-slot'+(item?' equipped':'')+(selectedSlot===i?' selected':'')+(report.excess?' socket-conflict':'')+(issue.length?' unavailable':''),
    'data-slot-index':String(i),'aria-expanded':String(stageSlotPickerOpen&&selectedSlot===i),'aria-controls':'stagePicker',
    'aria-label':tooltip,onclick:()=>{selectedSlot=i;selectedSocket=0;gearMode='equipment';stageSlotQuery='';stageSoulQuery='';stageSlotShown=48;stageSlotView=state.equipment?.[i]?'details':'choose';stageSlotPickerOpen=true;renderSlotRails();renderStagePicker(true)}});
   button.append(slotVisual(i),h('small',{text:item?itemName(item):slots[i][0]}));
   if(item&&plan.canSocket(slotKeys[i],source))button.append(h('span',{class:'stage-sockets',text:'◈ '+Math.min(report.count,cap)+'/'+cap}));
   if(item&&level>0)button.append(h('span',{class:'stage-enhance',text:'+'+level}));
   if(source){
    const equippedGem=window.PandoraEnchantModel.normalizeForSlot(slotKeys[i],state.gems?.[plan.refinementKey(i,item)]);
    const socketed=plan.asSocketArray(state.souls?.[i]).slice(0,cap??0)
     .filter(Boolean).map(s=>catalog.souls?.[String(s.id)]||(s.name?s:null)).filter(Boolean);
    window.PandoraStageItemUI.attachPreview(button,source,
     (rec,kind)=>itemIcon(rec,kind==='soul'?'souls':'items'),
     'item',{slot:slotKeys[i],refinement:level,gem:equippedGem,souls:socketed,capacity:cap,tables:gameTables});
    const activeFire=window.PandoraConditionalItemBonuses?.activeFor?.({
     record:source,refinement:level,gem:equippedGem,issue});
    if(activeFire?.phoenix)button.append(h('span',{
     class:'stage-elemental-proc',text:'✦',
     'aria-label':'Пламя феникса: +'+activeFire.phoenix.chance+'%'}));
   }
   if(report.excess>0||issue.length)button.append(h('span',{class:'stage-conflict',text:'!',
    'aria-label':issue.length?'Предмет временно недоступен':'Конфликт гнёзд'}));
   container.append(button);
  }
 }
}
function renderStageAttributes(){
 const root=$('stageAttributes');if(!root)return;
 const show=Boolean(stageAttributesPage)&&!stageSlotPickerOpen;
 const priorPage=root.querySelector('.stage-book-page')?.dataset.bookVisible||null;
 const priorScroll=root.querySelector('.stage-book-page')?.scrollTop||0;
 const activeControl=root.contains(document.activeElement)?
  document.activeElement?.getAttribute?.('data-book-setting'):null;
 root.hidden=!show;root.closest('.portrait-frame').classList.toggle('attributes',show);
 $('stageAttributeToggle')?.setAttribute('aria-pressed',String(Boolean(stageAttributesPage)));
 $('stageAttributeToggle')?.setAttribute('aria-expanded',String(show));
 if($('stageAttributeToggle'))$('stageAttributeToggle').textContent=stageAttributesPage?'↩ Образ героя':'📖 Результаты';
 $('stageBuffToggle')?.setAttribute('aria-pressed',String(stageAttributesPage==='buffs'));
 $('stageBuffToggle')?.setAttribute('aria-expanded',String(stageAttributesPage==='buffs'&&show));
 $('hero')?.setAttribute('aria-expanded',String(show));
 const opener=$('portraitBookOpen');
 if(opener){opener.hidden=show||stageSlotPickerOpen;opener.setAttribute('aria-expanded',String(show))}
 if(!show)return;
 const plan=window.PandoraEquipmentPlan;
 const items=Object.entries(state.equipment||{}).filter(([slot,entry])=>
  entry&&window.PandoraEquipmentPlan.matchesEquipmentSlot(Number(slot),
   catalog.equipment?.[String(entry.id)],slotKeys)).map(([slot,entry])=>{
  const rec=itemWithOverrides(catalog.equipment?.[String(entry.id)]);
  return {record:rec,issue:equipmentIssue(rec,Number(slot)),
   refinement:plan.refinementValue(state.refinements,Number(slot),entry),
    gem:window.PandoraEnchantModel.normalizeForSlot(rec.slot,
     state.gems?.[plan.refinementKey(Number(slot),entry)]),
    souls:plan.asSocketArray(state.souls?.[slot]).filter(Boolean).map(s=>catalog.souls?.[String(s.id)]||s)};
 });
 const cls=jobKeys[state.job],skillMap=catalog.skills||{};
 const jobBase=catalog.classes?.[cls]?.baseClass||cls;
 const innate=gameTables?.jobInit?.[jobBase]?.branches||{};
 const shieldCandidate=state.equipment?.[1]&&
  catalog.equipment?.[String(state.equipment[1].id)];
 const equippedShield=shieldCandidate&&!equipmentIssue(shieldCandidate,1).length?
  shieldCandidate:null;
 const weaponCandidate=state.equipment?.[0]&&
  catalog.equipment?.[String(state.equipment[0].id)];
 const equippedWeapon=weaponCandidate&&!equipmentIssue(weaponCandidate,0).length?
  weaponCandidate:null;
 const keys={combatLunge:'lunge',combatWarCry:'warCry',
  combatRage:'raging',combatDefender:'defender',
  combatConcentration:'concentration'};
 const combatSkillCatalog=window.PandoraOSCalculator;
 const selectedCombat=Object.fromEntries(Object.keys(keys).map(k=>[k,true]));
 const branchMasteries=trainedBranchMasteries(innate);
 const bookEn=lang==='en';
 const levelReason=n=>bookEn?'Available at level '+n:'Откроется на '+n+' уровне';
 const missingCombatMastery=ability=>{
  const req=ability?.reqs?.find(req=>(branchMasteries[req.branch]??0)<req.amount);
  if(!req)return null;
  const branchName=catalog.meta?.branchLabels?.[req.branch]||req.branch;
  return bookEn?'Requires '+req.amount+' '+branchName+' mastery':
   'Требуется мастерство «'+branchName+'»: '+req.amount;
 };
 const unavailableReason=(ability,hasMastery=true)=>{
  if(!ability)return bookEn?'Skill missing from catalog':'Умение отсутствует в каталоге';
  if(!ability.classes?.[cls])return bookEn?'Unavailable to this class':'Недоступно для этой профессии';
  if(state.level<Number(ability.charLevel||0))return levelReason(ability.charLevel);
  return hasMastery?missingCombatMastery(ability):null;
 };
 const availableSkills=combatSkillCatalog.activeCombatSkills({
  selected:selectedCombat,jobKey:cls,level:state.level,weapon:equippedWeapon,branchMasteries,
  hasShield:equippedShield?.slot==='shield',skillCatalog:skillMap
 });
 const availability={},combatSkillCards={};
 for(const [setting,name] of Object.entries(keys)){
  const id=combatSkillCatalog.combatSkillIds[name];
  const ability=skillMap[String(id)];
  availability[setting]=availableSkills[name]===true;
  const eff=combatSkillCatalog.combatSkillSource(skillMap,name)?.effects||{};
  const number=n=>n>0?'+'+n:String(n);
  const summary=name==='concentration'?number(eff.EP_TOHIT_CONST??0)+
    (bookEn?' accuracy':' к точности'):
   name==='lunge'?number(eff.EP_ATTACKINTERVAL_SCALE??0)+
    (bookEn?' attack speed':' к скорости атаки'):
   name==='warCry'?number(eff.EP_DAMAGERATE_CONST??0)+
    (bookEn?' attack · ':' атаки · ')+
    number(eff.EP_DAMAGERATE_SCALE??0)+'% '+(bookEn?'attack':'атаки'):
   number(eff.EP_DAMAGERATE_SCALE??0)+'% '+(bookEn?'attack':'атаки')+' · '+
    number(eff.EP_ARMORCLASS_SCALE??0)+'% '+(bookEn?'defense':'защиты');
  const reason=unavailableReason(ability)||
   (name==='defender'&&equippedShield?.slot!=='shield'?
    (bookEn?'Equip a shield':'Необходимо экипировать щит'):
   name==='lunge'&&Array.isArray(ability?.weaponUse)&&ability.weaponUse.length&&
    !ability.weaponUse.includes(equippedWeapon?.kind??'BARE_HAND')?
    (bookEn?'Unavailable with current weapon':'Недоступно с выбранным оружием'):null);
  combatSkillCards[setting]=ability?{
   name:ability.name,desc:ability.desc,level:ability.charLevel,summary,reason,
   icon:skillIcon(ability.branch,0,ability)
  }:null;
 }
 const supportKeys={combatWindAssist:'windAssist',combatWindBlessing:'windBlessing'};
 const supportAvailable=combatSkillCatalog.supportSkillAvailability({
  selected:Object.fromEntries(Object.keys(supportKeys).map(k=>[k,true])),
  skillCatalog:skillMap,jobKey:cls,level:state.level,branchMasteries
 });
 for(const [setting,kind] of Object.entries(supportKeys)){
  const ability=skillMap[String(combatSkillCatalog.supportSkillIds[kind])];
  const source=combatSkillCatalog.supportSkillSource(skillMap,kind);
  const effects=source?.values||{};
  availability[setting]=supportAvailable[kind]===true;
  const summary=kind==='windAssist'?
   '+'+(effects.EP_AVOIDANCE_CONST??0)+(bookEn?' evasion and ':' уклонения и ')+
    '+'+(effects.EP_AVOIDANCE_SCALE??0)+'% '+(bookEn?'of base evasion':'от базы'):
   '+'+(effects.EP_MOVESPEED_SCALE??0)+
    (bookEn?' movement speed':' к скорости передвижения');
  const reason=unavailableReason(ability,false);
  combatSkillCards[setting]=ability?{
   name:ability.name,desc:ability.desc,level:ability.charLevel,summary,reason,
   icon:skillIcon(ability.branch,0,ability)
  }:null;
 }
 window.PandoraStageAttributes.render(root,{
  page:stageAttributesPage,items,modifiers:previewBaseStats(),icon:rec=>itemIcon(rec),
  buffs:state.attributeBuffs||{},vitalsBuffs:state.vitalsBuffs||{},
  availability,combatSkillCards,honorTitles:window.PandoraOSCalculator.honorTitles,
  resistanceSkillChoices:window.PandoraOSCalculator.resistanceSkillChoices(skillMap)
   .map(row=>({...row,nameEn:officialEnglish?.skills?.[String(row.id)]?.n||row.name})),
  itemById:id=>catalogSource?.items?.[String(id)]||null,
  onItem:id=>openWiki('item',String(id)),
  copy:override,canEdit:Boolean(adminEditing&&adminToken),
  onTextEdit:(node,key,field,initial)=>editWikiValue(node,initial,{
   type:'text',onCommit:value=>saveGuidePatch('book.'+key,{[field]:value})}),
  onHonor:()=>openWiki('honor','overview'),
  onBuff:(key,value)=>setAttributeBuff(key,value),
  onVital:(key,value)=>setVitalsEnhancement(key,value),
  onClose:()=>{
   stageAttributesPage=null;renderStageAttributes();saveView();
   $('portraitBookOpen')?.focus({preventScroll:true});
  },
  onPage:name=>{
   if(!window.PandoraStageAttributes.bookPages.some(([id])=>id===name))return;
   stageAttributesPage=name;renderStageAttributes();saveView();
  }
 });
 if(priorPage===stageAttributesPage){
  const scroll=root.querySelector('.stage-book-page');
  if(scroll)scroll.scrollTop=priorScroll;
  if(activeControl)root.querySelector('[data-book-setting="'+activeControl+'"]')
   ?.focus({preventScroll:true});
 }else{
  root.querySelector('[role="tab"][aria-selected="true"]')?.focus({preventScroll:true});
 }
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
   record,item:equipped,slot:key,
   slotLabel:(lang==='en'?'Slot: ':'Слот: ')+
    (lang==='en'?['Weapon','Shield','Helmet','Armor','Gloves','Pants',
     'Boots','Cloak','Ring','Ring','Amulet','Belt','Earring','Earring'][selectedSlot]:
     ['Оружие','Щит','Шлем','Броня','Перчатки','Штаны','Обувь','Плащ',
      'Кольцо','Кольцо','Амулет','Пояс','Серьга','Серьга'][selectedSlot]),
   slotIndex:selectedSlot,selectedSocket,mode:stageSlotView,
   icons:(entry,kind)=>itemIcon(entry,kind==='soul'?'souls':'items'),
   refinement:plan.refinementValue(state.refinements,selectedSlot,equipped),
   souls:plan.asSocketArray(state.souls?.[selectedSlot]),
   soulQuery:stageSoulQuery,onSoulQuery:value=>{stageSoulQuery=value;saveView()},
   gems:window.PandoraEnchantModel.normalizeForSlot(key,state.gems?.[plan.refinementKey(selectedSlot,equipped)]),
   catalog,gameTables,close:()=>closeStagePicker(),
   changeMode:mode=>{
    if(mode==='gems')mode='details';
    if(mode==='souls'&&!plan.canSocket(key,record))mode='details';
    stageSlotView=mode;saveView();renderStagePicker(mode==='choose')
   },
   updateGrade:n=>{if(!plan.canRefine(key)||!Number.isInteger(n)||n<0||n>10)return;
    state.refinements??={};state.refinements[plan.refinementKey(selectedSlot,equipped)]=n;
    persist();renderSlotRails();renderStagePicker();renderOriginStats();renderOriginVitals();
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
    state.souls[selectedSlot]=next;stageSlotView='souls';persist();renderStagePicker();renderSlotRails();renderOriginStats();renderOriginVitals();
    const restoreFocus=stageSoulQuery?'[data-soul-query]':'[data-socket-index="'+selectedSocket+'"]';
    root.querySelector(restoreFocus)?.focus({preventScroll:true});
   },
   assignGem:entry=>{if(!plan.canRefine(key))return;
    const focusKey=document.activeElement?.getAttribute?.('data-enchant-key');
    const focusValue=document.activeElement?.getAttribute?.('data-enchant-value');
    state.gems??={};
    const id=plan.refinementKey(selectedSlot,equipped);
    const choice=window.PandoraEnchantModel.normalizeForSlot(key,entry);
    if(choice)state.gems[id]=choice;else delete state.gems[id];
    stageSlotView='details';persist();renderStagePicker();
    renderOriginVitals();if(stageAttributesPage)renderStageAttributes();
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
 const search=h('input',{type:'search',value:stageSlotQuery,placeholder:'Поиск по названию','aria-label':'Поиск предмета для '+slots[selectedSlot][0]});
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
 const records=catalog.live?window.PandoraUIPlanner.planningEquippable(
  Object.values(catalog.equipment||{}),key,jobKeys[state.job],state.level,
  window.PandoraStudioRules.equipment)
 .filter(rec=>window.PandoraUIPlanner.raceCompatible(rec,state.race,state.gender)&&
 !(key==='legs'&&window.PandoraUIPlanner.isAstirDress(equippedRecord(3))))
 .sort((a,b)=>{
  const futureA=Number(a.level||1)>state.level?1:0;
  const futureB=Number(b.level||1)>state.level?1:0;
  return futureA-futureB||Number(a.level||1)-Number(b.level||1)||
   itemName(a).localeCompare(itemName(b),'ru');
 }):[];
 const draw=()=>{
  list.replaceChildren();
  const query=stageSlotQuery.trim().toLocaleLowerCase('ru');
  const matches=records.filter(rec=>itemName(rec).toLocaleLowerCase('ru').includes(query));
  count.textContent=matches.length+' подходящих · '+Math.min(matches.length,stageSlotShown)+' показано';
  if(!catalog.live)list.append(h('p',{class:'muted',text:'Каталог ещё не загружен.'}));
  else if(!matches.length)list.append(h('p',{class:'muted',text:'Нет совместимых предметов. Измени поиск или слот.'}));
  for(const rec of matches.slice(0,stageSlotShown)){
   const selected=String(equipped?.id)===String(rec.id);
   const future=Number(rec.level)>state.level;
   const btn=h('button',{type:'button',
    class:'stage-picker-item'+(selected?' selected':'')+(future?' future':''),
    'aria-label':(future?'Запланировать: ':'Экипировать ')+itemName(rec)+
     (future?' · с '+rec.level+' уровня':''),onclick:()=>{
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
   btn.append(h('span',{class:'stage-picker-item-label'},[h('b',{text:itemName(rec)}),
    h('small',{text:future?'Будет доступен с '+rec.level+' уровня':
     rec.level?'Уровень '+rec.level:''})]));
   if(future)btn.append(h('span',{class:'stage-picker-future',text:'◷ '+rec.level+' ур.'}));
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
 state.stats[STATS[index]]=added;persist();renderOriginVitals();return true;
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
 const list=h('div',{class:'origin-stat-list'}),entries=[];
 // Saved stats remain invested-only. The input is the absolute race/class baseline + investment.
 function refresh(){
  const snap=attributeSnapshot(),estimate=previewBaseStats();
  summary.textContent=snap?'Свободно: '+snap.remaining+' / '+snap.total+' · Потрачено: '+snap.spent:'Характеристики';
  summary.classList.toggle('over-budget',!!snap?.overBudget);
  for(const row of entries){
   const base=snap?.base[row.i],spent=Number(state.stats[STATS[row.i]]||0);
   const allocated=base===undefined?null:base+spent;
   row.input.value=allocated===null?'':String(allocated);
   row.input.min=String(base??0);
   row.input.max=String(snap?.max[row.i]??99);
   row.input.disabled=!snap;
   const key=ORIGIN_STAT_LABELS[row.i].code,effective=estimate?.stats?.[key];
   const shown=Number.isFinite(effective)?effective:allocated;
   row.result.textContent=shown===null?'—':String(shown);
   const delta=shown===null||allocated===null?0:shown-allocated;
   row.caption.textContent=delta?(delta>0?'+':'')+delta+' бонус':'Итог';
   row.result.setAttribute('aria-label','База '+(base??'—')+' + очки '+spent+
    ' + известные бонусы '+delta+' = '+row.result.textContent);
   row.minus.disabled=!snap||spent<=0;
   row.plus.disabled=!window.PandoraAttributeProgression.allowed(snap,row.i,spent+1);
   row.plus.setAttribute('aria-label','Увеличить '+ORIGIN_STAT_LABELS[row.i].name+'. Стоимость: '+(window.PandoraAttributeProgression.nextCost(snap,row.i)??'максимум'));
  }
 }
 ORIGIN_STAT_LABELS.forEach((info,i)=>{
  const wrap=h('div',{class:'origin-stat-row'});
  const title=h('div',{class:'origin-stat-title'},[
   h('b',{text:info.short}),h('span',{text:info.name})]);
  const minus=h('button',{type:'button',text:'−','aria-label':'Уменьшить '+info.name});
  const input=h('input',{type:'number',min:'0',max:'99',step:'1',class:'origin-stat-input',
   'aria-label':info.name+' — без бонусов снаряжения и умений'});
  const plus=h('button',{type:'button',text:'+','aria-label':'Увеличить '+info.name});
  const box=h('div',{class:'origin-stat-result'}),result=h('strong',{text:'—'}),
   caption=h('small',{text:'Итог'});
  box.append(result,caption);
  const commit=absolute=>{
   const snap=attributeSnapshot();
   const normalized=window.PandoraAttributeProgression.resolveAbsolute(snap,i,absolute);
   if(normalized===null||!setAttributePoints(i,normalized-snap.base[i])){refresh();return}
   refresh();
   if($('detailPanel').classList.contains('is-open')&&activeTab==='stats'){
    const scroll=$('detailContent').scrollTop;renderDetails();$('detailContent').scrollTop=scroll;
   }
  };
  minus.addEventListener('click',()=>commit((attributeSnapshot()?.values[i]??0)-1));
  plus.addEventListener('click',()=>commit((attributeSnapshot()?.values[i]??0)+1));
  input.addEventListener('change',()=>commit(input.value));
  wrap.append(title,minus,input,plus,box);
  list.append(wrap);entries.push({i,input,result,caption,minus,plus});
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
   'aria-label':skill.name+(selected?' — выбрано':' — выбрать'),
   onclick:()=>{state.racialPassiveId=selected?null:id;persist();renderOriginPassives();
    renderOriginVitals();if(stageAttributesPage)renderStageAttributes();
    if(activeTab==='character'&&characterPanelTab==='character')renderDetails()}});
  const src=skillIcon('race',id,skill);
  if(src){const img=h('img',{src,alt:'',loading:'lazy'});img.onerror=()=>img.replaceWith(h('span',{text:'✦'}));btn.append(img)}
  else btn.append(h('span',{text:'✦'}));
  const label=h('b',{text:skill.name,
    ...(adminEditing&&lang==='ru'?{'data-edit-key':'skill.race.'+id}:{})});
  btn.append(h('span',{},[label,
    h('small',{text:selected?'✓ Выбрано':'Выбрать'})]));
  if(adminEditing&&lang==='ru'){
    const edit=h('button',{type:'button',class:'owner-race-passive-edit',
      title:'Редактировать название пассивной способности',
      'aria-label':'Изменить название '+skill.name,text:'✎',
      onclick:()=>editor(label)});
    root.append(h('div',{class:'owner-race-passive-row'},[btn,edit]));
  }else root.append(btn);
  skillHover(btn,skill);
 }
}
let activeSkillPreview=null;
function skillHover(button,skill){
 button.removeAttribute('title');
 const skills=Array.isArray(skill)?skill:[skill];let tip;
 const clear=()=>{
  if(activeSkillPreview===tip)activeSkillPreview=null;
  tip?.remove();tip=null;button.removeAttribute('aria-describedby');
 };
 const show=()=>{
  if(tip?.isConnected)return;
  activeSkillPreview?.remove();
  tip=h('aside',{id:'path-skill-hover-tooltip',class:'stage-hover-preview path-skill-preview',role:'tooltip'});
  activeSkillPreview=tip;
  for(const entry of skills.slice(0,3)){
   const row=h('div',{class:'path-skill-preview-item'}),src=skillIcon(entry.branch,entry.id,entry);
   if(src){const img=h('img',{src,alt:''});img.onerror=()=>img.replaceWith(h('span',{text:'✦'}));row.append(img)}
   const copy=h('div');copy.append(h('strong',{text:entry.name||'Умение'}));
   if(entry.charLevel)copy.append(h('small',{text:'Уровень '+entry.charLevel}));
   if(entry.desc)copy.append(h('p',{text:entry.desc}));
   row.append(copy);tip.append(row);
  }
  if(skills.length>3)tip.append(h('small',{class:'path-preview-more',text:'Ещё '+(skills.length-3)+' навыков — нажмите на отметку'}));
  document.body.append(tip);
  button.setAttribute('aria-describedby',tip.id);
  const box=button.getBoundingClientRect(),panel=button.closest('.right')?.getBoundingClientRect();
  const vw=document.documentElement.clientWidth,vh=innerHeight;
  const desired=Math.min(300,vw-16,panel?.width?panel.width-18:300);
  tip.style.width=Math.max(160,desired)+'px';
  tip.style.maxHeight=Math.max(100,Math.min(270,vh-16))+'px';
  const width=tip.getBoundingClientRect().width,height=tip.getBoundingClientRect().height;
  const minLeft=Math.max(8,(panel?.left??0)+8);
  const maxLeft=Math.min(vw-width-8,(panel?.right??vw)-width-8);
  tip.style.left=(maxLeft>=minLeft?Math.max(minLeft,Math.min(maxLeft,box.left+box.width/2-width/2)):Math.max(8,vw-width-8))+'px';
  tip.style.top=Math.max(8,Math.min(vh-height-8,
   box.top-height-8>=8?box.top-height-8:box.bottom+8))+'px';
 };
 button.addEventListener('mouseenter',show);button.addEventListener('focus',show);
 button.addEventListener('mouseleave',clear);button.addEventListener('blur',clear);button.addEventListener('click',clear);
}
function refreshBudgetLabel(){
 const data=budgetSummary(),root=$('budgetState');if(!root)return;
 const heading=root.querySelector('.path-overview-head');
 root.replaceChildren();if(heading)root.append(heading);
 const stats=h('div',{class:'path-budget-values'});
 if(data.total===null)stats.append(h('p',{text:lang==='en'?'Loading skill points…':'Загружаются очки умений…'}));
 else{
  for(const [title,value,css]of[
    [(lang==='en'?'Available':'Свободно'),data.remaining,'path-free'],[(lang==='en'?'Spent':'Вложено'),data.spent,''],[(lang==='en'?'Total':'Всего'),data.total,'']]){
   stats.append(h('div',{},[h('strong',{class:css,text:String(value)}),h('span',{text:title})]));
  }
  if(data.remaining<0)root.append(h('small',{class:'budget-excess',
   text:lang==='en'?'Saved build exceeds the point budget. Existing points were preserved.':'Сохранённый билд превышает бюджет. Прежние вложения не удалены.'}));
 }
 root.append(stats);
}
// Reusing a stable source snapshot avoids rematerializing 569 skill records
// for each growth redraw or skill gallery query. Locale changes replace the
// catalog object, so the WeakMap automatically selects a new translated list.
const heroSkillRowsCache=new WeakMap();
function heroSkillRows(source){
 if(!source||typeof source!=='object')return [];
 const cached=heroSkillRowsCache.get(source);
 if(cached)return cached;
 const rows=Object.values(source);
 heroSkillRowsCache.set(source,rows);
 return rows;
}
function heroPathApi(){
 const groups=window.PandoraGameNavigation.groups,klass=jobKeys[state.job];
 return {
  state,groups,job:klass,lang,selectedGroup:selectedSkillGroup,expandedBranch:inlineBranchId,
  skillCatalog:heroSkillRows(catalog.skills),catalogReady:!!catalog.skills,
  allocationReady:Boolean(gameTables?.abilityPoint&&catalog.classes?.[klass]),
  budget:budgetSummary(),selectedSkill,filter:pathSkillFilter,query:pathSkillQuery,
  shown:pathSkillShown,onMoreSkills:()=>{pathSkillShown+=24;renderPathSkills()},
  cap:branchCap,
  branchName:key=>editableValue('branch.'+key,catalog.meta?.branchLabels?.[key]||key),
  icon:(key,skill)=>skillIcon(key,skill?.id,skill),
  hover:(node,skill)=>skillHover(node,skill),
  skillWiki:skill=>wikiLink(lang==='en'?'📜 Full encyclopedia entry':'📜 Полная статья в энциклопедии','skill',String(skill.id)),
  milestones:(skills,key,cap)=>{
   const {milestones,above}=window.PandoraSkillMilestones.forBranch(skills,key,cap);
   // Keep the first occurrence, as in the old Array.find adapter.
   const byId=new Map();
   for(const skill of skills){
    const id=String(skill.id);
    if(!byId.has(id))byId.set(id,skill);
   }
   const locked=new Map();
   for(const row of above){
    const skill=byId.get(String(row.id));
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
   // Reopening a category never reopens the previous child branch.
   inlineBranchId='';
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
   if(!Number.isInteger(requested)||requested<0)return current;
   const target=requested<=current?Math.max(0,requested):Math.min(Math.max(0,requested),allowedBranch(key));
   if(!model.canAllocate(gameTables?.abilityPoint,state.level,state.points,key,branchCap(key),target))
    return current;
   const allocationChanged=target!==current,branchChanged=state.branch!==key;
   if(allocationChanged)model.setPotential(state,key,target);
   state.branch=key;
   // A capped slider may emit many input events that cannot change the build.
   // Do not rewrite the draft or rebuild the budget for those no-op inputs.
   if(allocationChanged||branchChanged){persist();refreshBudgetLabel()}
   if(final){
    const activeControl=document.activeElement?.getAttribute?.('data-branch-control');
    renderBranches();renderOriginStats();renderOriginVitals();
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
   persist();renderBranches();renderOriginStats();renderOriginVitals();
   if(activeControl)document.querySelector('[data-branch-control="'+activeControl+'"]')
    ?.focus({preventScroll:true});
   if(heroPathPage==='skills')renderPathSkills();
   saveView();return true;
  },
  onSkill:skill=>{
   selectedSkill=skill;pathSkillFilter='all';pathSkillQuery='';pathSkillShown=24;
   $('pathSkillStatus').value='all';$('pathSkillSearch').value='';
   heroPathPage='skills';renderPathPages();saveView();
   $('pathSkillsTab')?.focus({preventScroll:true});
  },
  onInspect:skill=>{
   selectedSkill=skill;renderPathSkills();
   document.querySelector('[data-skill-id="'+String(skill.id)+'"]')
    ?.focus({preventScroll:true});
   $('pathSkillDetails')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
 };
}
function renderBranches(){
 activeSkillPreview?.remove();activeSkillPreview=null;
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
function render(){state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);const logo=document.querySelector('.brand img');if(logo)logo.src=override['visual.logo']||'assets/pandora-logo.png';renderRaces();renderJobs();renderOriginTabs();$('genderF').classList.toggle('chosen',state.gender===0);
 $('raceSexInfo').textContent=['Пол по выбранному образу','Пол по выбранному образу',
 'Цверг · выбор пола недоступен','Мирина · женский','Энкиду · мужской','Кролль · бесполый'][state.race];$('genderM').classList.toggle('chosen',state.gender===1);const genderAllowed=window.PandoraUIPlanner.raceHasGender(races,state.race);$('genderF').disabled=!genderAllowed;$('genderM').disabled=!genderAllowed;$('swapGender').disabled=!genderAllowed;$('genderF').title=$('genderM').title=genderAllowed?'Выбор варианта портрета':'Для этой расы нет отдельных вариантов портрета';$('hero').src=raceSource(state.race,state.gender);$('hero').dataset.editKey='visual.race.'+state.race+'.'+(state.gender?'m':'f');$('hero').classList.toggle('admin-edit',adminEditing);$('hero').alt=races[state.race][0];$('raceTitle').textContent=editableValue('race.'+state.race,races[state.race][0]);$('jobTitle').textContent=editableValue('job.'+state.job,jobs[state.job]);$('activeJob').textContent=$('jobTitle').textContent;$('level').value=state.level;$('levelOut').textContent=state.level;renderSlotRails();renderStagePicker();renderStageAttributes();renderOriginPassives();renderOriginStats();renderBranches();refreshBudgetLabel();renderPathPages();renderDetails();renderOriginVitals();renderVitalsEnhancements();updateAdminHint()}
function renderDetails(){const titles=lang==='en'?{character:'Hero Workshop',skills:'Skill Tree',stats:'Attributes',builds:'Build Library',wiki:'Pandora Saga Encyclopedia'}:{character:'Мастерская героя',skills:'Дерево умений',stats:'Характеристики',builds:'Библиотека билдов',wiki:'Энциклопедия Pandora Saga'};$('detailTitle').textContent=titles[activeTab];$('detailContent').replaceChildren();const contents={character:renderCharacter,skills:renderSkills,stats:renderStats,builds:renderBuilds,wiki:renderWiki};contents[activeTab]($('detailContent'))}

let wikiRenderSelected=null,wikiRenderedRoot=null,wikiBaseData=null;
async function loadWiki(){
 if(wikiIndex)return wikiIndex;
 if(wikiPending)return wikiPending;
 wikiPending=(async()=>{
  // Owner edits rebuild from the already validated snapshot: no redundant
  // round-trip of all 11 D1 datasets for each double-click edit.
  if(!wikiBaseData){
   const loaded=await window.PandoraWikiCatalog.load({api:API,fetcher:fetch});
   wikiBaseData=loaded.data;
  }
  const loaded={data:wikiBaseData};
  const skills={...loaded.data.skills};
  for(const [key,value] of Object.entries(override)){
   const parsed=/^(skill|skilldesc)\.([a-zA-Z0-9_-]{1,32})\.([0-9]{1,12})$/.exec(key);
   if(parsed&&skills[parsed[3]]&&typeof value==='string'&&value.trim())
    skills[parsed[3]]={...skills[parsed[3]], [parsed[1]==='skill'?'name':'desc']:value};
  }
  const ownerAcquisitions={};
  for(const [key,value] of Object.entries(override)){
   const match=/^acquireedit\.([0-9]{1,15})$/.exec(key);
   if(!match||!loaded.data.items?.[match[1]]||typeof value!=='string')continue;
   try{
    const rows=JSON.parse(value);
    if(Array.isArray(rows))ownerAcquisitions[match[1]]=rows.filter(row=>
     row&&['npc','monster'].includes(row.type)&&
      typeof row.id==='string'&&/^[1-9][0-9]{0,14}$/.test(row.id)&&
      (row.p==null||row.type==='monster'&&Number.isFinite(row.p)&&row.p>=0&&row.p<=100)).slice(0,24);
   }catch{/* Damaged overrides must not break the original encyclopedia. */}
  }
  const source={...loaded.data,skills,ownerAcquisitions,
   maps:{...loaded.data.maps,...(window.PandoraHistoricalMaps?.records()||{})},
   trades:window.PandoraStudioTradeOwnerData.apply(
    loaded.data.trades,loaded.data.items,override),
   items:window.PandoraStudioItemOwnerEditor.applyItems(loaded.data.items,override)};
  const resolved=window.PandoraWikiOwnerData.apply(source,override);
  const index=window.PandoraWikiData.build(resolved);
  wikiData=resolved;
  wikiIndex=index;
  if(wikiSelection.id!=null)wikiSelection.id=index.canonical(wikiSelection.type,wikiSelection.id);
  return index;
 })().finally(()=>wikiPending=null);
 return wikiPending;
}
function openWiki(type,id,highlight=null){
 const sameCategory=activeTab==='wiki'&&wikiSelection.type===type&&
  typeof wikiRenderSelected==='function'&&wikiRenderedRoot?.isConnected&&wikiIndex;
 if(activeTab!=='wiki'||wikiSelection.type!==type){wikiSearch='';wikiShown=100}
 wikiSelection={type,id:String(id),highlight:highlight==null?null:String(highlight)};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 // A real navigation entry without an extra hashchange-driven full rerender.
 history.pushState(history.state,'','#wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+
  (highlight!=null?'/'+encodeURIComponent(highlight):''));
 if(sameCategory)wikiRenderSelected();
 else{renderDetails();$('detailContent').scrollTop=0}
 if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
 saveView();
}
function wikiLink(text,type,id,highlight=null){
 const displayId=wikiIndex?.canonical?.(type,id)||String(id);
 const href='#wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(displayId)+(highlight==null?'':'/'+encodeURIComponent(highlight));
 return h('a',{class:'wiki-link',href,text,onclick:event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();openWiki(type,displayId,highlight);
 }});
}
function guardEncyclopediaSearch(input){
 // Some password managers ignore autocomplete="off". Prevent automatic
 // credential injection until an actual user pointer or keyboard gesture.
 input.readOnly=true;
 input.setAttribute('autocomplete','off');
 input.setAttribute('data-lpignore','true');
 input.setAttribute('data-1p-ignore','true');
 input.setAttribute('data-bwignore','true');
 input.addEventListener('focus',()=>{input.readOnly=false});
 input.addEventListener('pointerdown',()=>{input.readOnly=false});
 input.addEventListener('keydown',()=>{input.readOnly=false});
 input.addEventListener('blur',()=>{input.readOnly=true});
 return input;
}
function renderWiki(root){
 wikiRenderedRoot=root;
 const browse=h('div',{class:'wiki-list'}),detail=h('article',{class:'wiki-page'});
 const controls=h('div',{class:'wiki-controls'}),categories=h('div',{class:'wiki-categories'});
 const wt=(ru,en)=>lang==='en'?en:ru;
 let wikiSourceShown=80,wikiUsageShown=80,wikiSourceRecord='';
 for(const [key,ru,en]of[['item','Экипировка','Equipment'],['utility','Предметы эффектов','Effect items'],['monster','Монстры','Monsters'],['map','Локации','Locations'],['honor','Очки чести','Honor points'],['npc','NPC-обмен','NPC trades'],['chest','Сундуки','Chests'],['instance','Подземелья','Dungeons'],['skill','Навыки','Skills'],['soul','Души','Souls']]){
  categories.append(h('button',{
   class:(key==='utility'?wikiSelection.type==='item'&&wikiItemType==='utility':
    key==='item'?wikiSelection.type==='item'&&wikiItemType!=='utility':
    wikiSelection.type===key)?'chosen':'',
   text:lang==='en'?en:ru,'data-wiki-chapter':key,
   onclick:()=>{
    if(key==='item'||key==='utility'){
     wikiSelection={type:'item',id:null,highlight:null};
     wikiItemType=key==='utility'?'utility':'equipment';
    }else wikiSelection={type:key,id:null,highlight:null};
    wikiSearch='';wikiShown=100;renderDetails();
   }}));
 }
 const search=h('input',{type:'search',value:wikiSearch,placeholder:lang==='en'?'Search by name':'Поиск по названию','aria-label':lang==='en'?'Search encyclopedia':'Поиск по энциклопедии',name:'pandora-studio-encyclopedia-filter',autocomplete:'off','data-lpignore':'true','data-1p-ignore':'true','data-bwignore':'true',spellcheck:'false'});
 guardEncyclopediaSearch(search);
 controls.append(categories,search);
 // Add owner-authored monster cards without asserting a nonexistent OS numeric ID.
 // Future-map reports can be linked to existing OR newly created encyclopedia cards.
 const ownerMonsterIds=()=>new Set(Object.keys(wikiIndex?.records('monster')||{}));
 const mapRoster=rec=>rec.roster||rec.reportedSpawns||[];
 const persistRosterLink=async(mapId,entryId,monsterId)=>{
  const rec=wikiIndex.records('map')?.[String(mapId)];
  if(!rec)throw Error(wt('Локация не найдена','Location not found'));
  const previous=mapRoster(rec);
  if(!previous.some(row=>row.id===entryId))
   throw Error(wt('Строка монстра не найдена','Monster entry not found'));
  if(monsterId!=null&&!wikiIndex.records('monster')?.[String(monsterId)])
   throw Error(wt('Карточка монстра отсутствует','Monster card not found'));
  const next=previous.map(row=>row.id===entryId?{...row,monsterId}:row);
  const referencedBefore=new Set(previous.map(row=>String(row.monsterId)).filter(x=>x!=='null'));
  const extra=(rec.mobs||[]).filter(x=>!referencedBefore.has(String(x)));
  const mobs=[...new Map([...extra,...next.map(row=>row.monsterId).filter(x=>x!=null)]
   .map(x=>[String(x),x])).values()];
  await saveWikiRecordPatch('map',mapId,{roster:next,mobs});
 };
 const createOwnerMonster=(button,{mapId=null,spawnId=null,name='',level=1}={})=>{
  if(!adminEditing||!adminToken)return;
  const parent=button.parentElement;
  if(parent?.querySelector('.wiki-owner-monster-form'))return;
  const form=h('div',{class:'wiki-owner-source-picker wiki-owner-monster-form'});
  const ru=ownerPlainTextField({class:'wiki-inline-input',value:name,
   'aria-label':wt('Название монстра RU','Monster name RU'),placeholder:'Название RU'});
  const en=ownerPlainTextField({class:'wiki-inline-input',
   'aria-label':wt('Название монстра EN','Monster name EN'),placeholder:'Name EN'});
  const lvl=h('input',{type:'number',min:'1',max:'255',step:'1',
   value:String(level),'aria-label':wt('Уровень монстра','Monster level'),
   class:'wiki-inline-input wiki-owner-monster-level'});
  const error=h('small',{class:'inline-owner-error',role:'status'});
  const submit=h('button',{type:'button',class:'wiki-owner-plus',
   text:wt('Сохранить монстра','Save monster'),onclick:async()=>{
    const label=ru.value.trim(),english=en.value.trim(),num=Number(lvl.value);
    if(!label||!english||label.length>240||english.length>240||
      !Number.isInteger(num)||num<1||num>255){
     error.textContent=wt('Нужны названия RU/EN и уровень 1–255',
      'Both names and a level 1–255 are required');return;
    }
    let monsterId=null;
    for(let attempt=0;attempt<8;attempt++){
     const candidate='owner-monster-'+[...crypto.getRandomValues(new Uint8Array(8))]
      .map(x=>x.toString(16).padStart(2,'0')).join('');
     if(!ownerMonsterIds().has(candidate)&&
       !Object.hasOwn(override,'wikiedit.monster.'+candidate)){
      monsterId=candidate;break;
     }
    }
    if(!monsterId){error.textContent=wt('Не удалось создать уникальный ID','No unique ID available');return}
    submit.disabled=true;
    try{
     await saveWikiRecordPatch('monster',monsterId,{
      name:label,nameEn:english,desc:'',descEn:'',level:num});
     if(mapId&&spawnId)await persistRosterLink(mapId,spawnId,monsterId);
     openWiki(mapId?'map':'monster',mapId||monsterId);
    }catch(e){error.textContent=String(e.message||e);submit.disabled=false}
   }});
  const cancel=h('button',{type:'button',class:'wiki-owner-remove',
   text:wt('Отмена','Cancel'),onclick:()=>form.remove()});
  form.append(ru,en,lvl,submit,cancel,error);button.after(form);ru.focus();
 };
 if(adminEditing&&adminToken&&wikiSelection.type==='monster'){
  const newMonster=h('button',{type:'button',class:'wiki-owner-plus wiki-monster-create',
   text:wt('+ Создать монстра','+ Create monster')});
  newMonster.onclick=()=>createOwnerMonster(newMonster);
  controls.append(newMonster);
 }
 if(adminEditing&&adminToken&&wikiSelection.type==='map'){
  const create=h('button',{type:'button',class:'wiki-owner-plus wiki-map-create',
   text:wt('+ Создать локацию','+ Create location')});
  create.onclick=()=>{
   if(controls.querySelector('.wiki-map-create-form'))return;
   const form=h('div',{class:'wiki-map-create-form wiki-owner-source-picker'});
   const ru=ownerPlainTextField({class:'wiki-inline-input',
    placeholder:'Название · RU','aria-label':'Название локации на русском'});
   const en=ownerPlainTextField({class:'wiki-inline-input',
    placeholder:'Name · EN','aria-label':'Location name in English'});
   const error=h('small',{class:'inline-owner-error',role:'status'});
   const submit=h('button',{type:'button',class:'wiki-owner-plus',
    text:wt('Создать','Create'),onclick:async()=>{
     const name=ru.value.trim(),nameEn=en.value.trim();
     if(!name||!nameEn||name.length>240||nameEn.length>240){
      error.textContent=wt('Укажи названия RU и EN','Enter both RU and EN names');return;
     }
     const random=[...crypto.getRandomValues(new Uint8Array(8))]
      .map(x=>x.toString(16).padStart(2,'0')).join('');
     const id='custom-'+random;
     submit.disabled=true;
     try{
      await saveWikiRecordPatch('map',id,{name,nameEn,desc:'',descEn:'',
       mobs:[],npcs:[],loot:[],tags:[],
       sections:['monsters','npcs','loot','tags','custom'],extraSections:[]});
      openWiki('map',id);
     }catch(err){error.textContent=String(err.message||err);submit.disabled=false}
    }});
   const cancel=h('button',{type:'button',class:'wiki-owner-remove',
    text:wt('Отмена','Cancel'),onclick:()=>form.remove()});
   form.append(ru,en,submit,cancel,error);create.after(form);ru.focus();
  };
  controls.append(create);
 }
 if(wikiSelection.type==='item'&&!['utility','all'].includes(wikiItemType)){
  const equipmentTypes=[['equipment',wt('Экипировка','Equipment')],
    ['elemental',wt('Стихийное оружие','Elemental weapons')],
   ...[['weapon','Оружие','Weapons'],['shield','Щиты','Shields'],
    ['head','Шлемы','Helmets'],['body','Броня','Armor'],
    ['gloves','Перчатки','Gloves'],['legs','Поножи','Leg armor'],
    ['feet','Обувь','Boots'],['cloak','Плащи','Cloaks'],
    ['ring','Кольца','Rings'],['neck','Амулеты','Amulets'],
    ['belt','Пояса','Belts'],['ear','Серьги','Earrings']]
    .map(([id,ru,en])=>[id,wt(ru,en)])];
  const typeSelect=h('select',{class:'wiki-equipment-type',
   'aria-label':wt('Вид предметов','Item type'),onchange:event=>{
    wikiItemType=event.target.value;wikiShown=100;wikiSelection={...wikiSelection,id:null,highlight:null};
    if(wikiItemType==='elemental'||wikiItemType==='utility')renderDetails();
    else if(wikiIndex){for(const button of categories.querySelectorAll('[data-wiki-chapter]'))
     button.classList.toggle('chosen',button.dataset.wikiChapter==='item');draw()}
   }});
  for(const [id,label]of equipmentTypes){
   const option=h('option',{value:id,text:label});
   if(id===wikiItemType)option.selected=true;
   typeSelect.append(option);
  }
  const compatibility=h('select',{class:'wiki-eligibility-filter',
   'aria-label':wt('Совместимость с героем','Hero compatibility'),
   onchange:event=>{
    wikiItemEligibility=event.target.value;wikiSelection={...wikiSelection,id:null,highlight:null};
    wikiShown=100;if(wikiIndex)draw()
   }});
  for(const [id,ru,en]of [
   ['all','Все вещи','All gear'],
   ['now','Можно надеть сейчас','Equippable now']]){
   const option=h('option',{value:id,text:wt(ru,en)});
   if(id===wikiItemEligibility)option.selected=true;
   compatibility.append(option);
  }
  const toolbar=h('div',{class:'wiki-equipment-toolbar'},[typeSelect,compatibility]);
  if(wikiItemType==='elemental'){
   const picker=h('select',{class:'wiki-elemental-type',
    'aria-label':wt('Стихия оружия','Weapon element'),
    onchange:event=>{wikiElementFilter=event.target.value;wikiShown=100;
     wikiSelection={...wikiSelection,id:null,highlight:null};draw()}});
   for(const [id,ru,en] of [
    ['all','Все стихии','All elements'],['fire','Огонь','Fire'],
    ['ice','Лёд','Ice'],['dark','Тьма','Darkness'],
    ['light','Свет','Light'],['lightning','Молния','Lightning'],
    ['poison','Яд','Poison']]){
    const opt=h('option',{value:id,text:wt(ru,en)});
    if(id===wikiElementFilter)opt.selected=true;
    picker.append(opt);
   }
   toolbar.append(picker);
  }
  controls.append(toolbar);
 }
 if(wikiSelection.type==='item'&&wikiItemType==='utility'){
  const filter=h('select',{class:'wiki-effect-type',
   'aria-label':wt('Тип предметов эффектов','Effect item category'),
   onchange:event=>{wikiEffectFilter=event.target.value;
    wikiSelection={...wikiSelection,id:null,highlight:null};wikiShown=100;draw()}});
  for(const [id,ru,en] of [
   ['all','Все предметы эффектов','All effect items'],
   ['buff','Дают положительные эффекты','Apply positive effects'],
   ['cure','Снимают негативные эффекты','Remove negative effects'],
   ['harmful','Дают отрицательные эффекты','Apply negative effects']]){
   const option=h('option',{value:id,text:wt(ru,en)});
   if(wikiEffectFilter===id)option.selected=true;
   filter.append(option);
  }
  controls.append(h('div',{class:'wiki-effect-toolbar'},[filter]));
 }
 const view=h('div',{class:'wiki-equipment-view',role:'group',
  'aria-label':wt('Вид Энциклопедии','Encyclopedia view')});
 for(const [id,ru,en]of[['list','☰ Список','☰ List'],['grid','▦ Сетка','▦ Grid']])
  view.append(h('button',{type:'button',text:wt(ru,en),
   'data-layout':id,'aria-pressed':String(wikiItemLayout===id),
   class:wikiItemLayout===id?'chosen':'',
   onclick:()=>{
    wikiItemLayout=id;
    for(const button of view.querySelectorAll('[data-layout]')){
     const selected=button.getAttribute('data-layout')===id;
     button.classList.toggle('chosen',selected);
     button.setAttribute('aria-pressed',String(selected));
    }
    browse.classList.toggle('wiki-gear-grid',id==='grid');
    saveView();
   }}));
 controls.append(view);
 const layout=h('div',{class:'wiki-layout'});
 layout.append(browse,detail);root.append(controls,layout);
 if(wikiSelection.type==='honor'){
  view.hidden=true;
  const renderHonor=()=>{
   if(!root.isConnected)return;
   window.PandoraHonorView?.render({
    browse,detail,make:h,lang,article:window.PandoraHonorGuide?.article(override),
    editable:adminEditing&&Boolean(adminToken),
    editText:(node,initial,multiline,onCommit)=>editWikiValue(node,initial,{
     type:multiline?'textarea':'text',onCommit}),
    saveText:saveGuidePatch,saveList:saveGuideList,
    link:(mapId,name)=>window.PandoraHistoricalMaps?.records()?.[mapId]||
     mapId==='2005004'?wikiLink('◈ '+name,'map',mapId):null
   });
  };
  wikiRenderSelected=renderHonor;
  renderHonor();
  return;
 }

 const nameCache=new Map();
  let lastWikiIndex=null;
 const dataName=(type,id)=>{
  if(type==='map'){
   const geo=window.PandoraAstirLocations;
   const place=geo?.district(id)||geo?.country(id);
   if(place){
    const edited=wikiIndex.records('map')?.[id];
    const localized=lang==='en'?(edited?.nameEn||place.en):
     (edited?.name||place.ru);
    return localized+(geo.district(id)?
     (lang==='en'?' · Astir':' · Астир'):'');
   }
  }
  const key=type+':'+String(id);
  if(nameCache.has(key))return nameCache.get(key);
  const obj=type==='item'?(wikiData.items?.[id]||wikiData.souls?.[id]):
   type==='chest'?wikiData.items?.[id]:wikiIndex.records(type)?.[id];
  const en=(obj?.nameEn&&['map','npc','monster','skill','soul','instance'].includes(type)?obj.nameEn:null)||
   (type==='npc'&&obj?.virtual?obj.en:null)||
   (type==='map'?(officialEnglish?.maps?.[id]?.n||
   officialEnglish?.tradeMaps?.[id]?.n):officialEnglish?.[
   type==='item'||type==='chest'?'items':type==='npc'?'tradeNpcs':
   type==='monster'?'monsters':type==='instance'?'instances':
   type==='skill'?'skills':type==='soul'?'souls':'']?.[id]?.n);
  const fallback=lang==='en'?
    {item:'Unnamed item',monster:'Unnamed monster',map:'Location',npc:'NPC',
     chest:'Chest',skill:'Unnamed skill',soul:'Unnamed soul',instance:'Dungeon'}:
    {item:'Предмет без названия',monster:'Монстр без названия',
     map:'Локация',npc:'Персонаж',chest:'Сундук',skill:'Умение без названия',
     soul:'Душа без названия',instance:'Подземелье'};
   const value=lang==='en'&&en?en:obj?.name||fallback[type]||'Без названия';
   nameCache.set(key,value);
   return value;
 };
 // Search authoritative RU and official EN names only.
 const searchCache=new Map();
 const searchTerms=(type,id)=>{
  const key=type+':'+String(id);
  if(searchCache.has(key))return searchCache.get(key);
  const chapter=type==='item'||type==='chest'?'items':
   type==='npc'?'tradeNpcs':type==='map'?'maps':
   type==='monster'?'monsters':type==='instance'?'instances':
   type==='skill'?'skills':type==='soul'?'souls':null;
  const translated=chapter?officialEnglish?.[chapter]?.[id]:null;
  const territoryAlias=type==='map'?
   window.PandoraAstirLocations?.searchAliases(id):null;
  const npc=type==='npc'?wikiIndex.records('npc')?.[id]:null;
  const verifiedNpcAlias=npc?[npc.en,npc.nameEn,npc.name].filter(Boolean).join(' '):null;
  const value=[dataName(type,id),translated?.n,verifiedNpcAlias,territoryAlias,
   type==='monster'?wikiIndex.records('monster')?.[id]?.nameEn:null,
   type==='map'?officialEnglish?.tradeMaps?.[id]?.n:null]
   .filter(Boolean).join(' ');
  searchCache.set(key,value);
  return value;
 };
 const classLabel=id=>(lang==='en'?officialEnglish?.classes?.[id]?.n:null)||
  catalog.classes?.[id]?.name||null;
 const branchLabel=id=>(lang==='en'?officialEnglish?.branches?.[id]:null)||
  wikiData.meta?.branchLabels?.[id]||wt('Ветка умений','Skill branch');
 const wikiIcon=(type,id,record=null)=>{
  const row=type==='chest'?wikiData.items?.[id]:record||
   (type==='item'?wikiData.items?.[id]:
   type==='soul'?wikiData.souls?.[id]:type==='skill'?wikiData.skills?.[id]:null);
  if(!row)return null;
  if(type==='item'||type==='chest')return itemIcon(row);
  if(type==='soul')return itemIcon(wikiData.items?.[id]||row,'items');
  if(type==='skill')return skillIcon(row.branch,id,row);
  // No imaginary sprites for monsters/locations/NPCs whose OS catalog has none.
  return null;
 };
 const wikiImage=(src,cls,type='item')=>{
  if(!src)return null;
  const img=h('img',{src,alt:'',loading:'lazy',class:cls});
  const fallback=src.includes('/icons/items/')?src.replace('/icons/items/','/icons/souls/'):
   src.includes('/icons/souls/')?src.replace('/icons/souls/','/icons/items/'):null;
  img.onerror=()=>{if(fallback&&!img.dataset.fallbackTried){
   img.dataset.fallbackTried='1';img.src=fallback;
  }else img.replaceWith(h('span',{class:cls.includes('wiki-list-icon')?
   'wiki-list-glyph':'wiki-record-glyph','aria-hidden':'true',text:wikiGlyphs[type]||'✦'}))};
  return img;
 };
 const wikiGlyphs={item:'✦',monster:'♞',map:'◈',npc:'♙',chest:'▣',
  instance:'⌂',skill:'✶',soul:'✧'};
 const withIcon=(link,src,type='item')=>{
  const img=wikiImage(src,'wiki-list-icon',type);
  if(img)link.prepend(img);
  else link.prepend(h('span',{class:'wiki-list-glyph','aria-hidden':'true',
   text:wikiGlyphs[type]||'✦'}));
  return link;
 };
 const itemLink=(id,label,highlight=null)=>{
  const hasChest=Boolean(wikiIndex?.records('chest')?.[id]);
  const hasSoul=Boolean(wikiData.souls?.[id]);
  const dest=hasChest?'chest':hasSoul?'soul':'item';
  const record=hasSoul?wikiData.souls?.[id]:wikiData.items?.[id];
  const anchor=withIcon(wikiLink(label,dest,id,highlight),
   wikiIcon(dest,id,record),dest);
  if(record){
   const en=officialEnglish?.[hasSoul?'souls':'items']?.[id];
   const resolved=lang==='en'?{...record,name:en?.n||record.name,
    desc:en?.d||record.desc}:record;
   window.PandoraStageItemUI?.attachPreview(anchor,resolved,
    row=>wikiIcon(dest,id,row),hasSoul?'soul':'item');
  }
  return anchor;
 };
 const matchesWords=(text,query)=>wikiIndex.normalize(query).split(' ')
  .filter(Boolean).every(term=>text.includes(term));

 const wikiItemChoice=(container,selectItem)=>{
  const previous=container.querySelector('.wiki-owner-item-choice');
  if(previous){previous.remove();return}
  const form=h('div',{class:'wiki-owner-source-picker wiki-owner-item-choice'});
  const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
   placeholder:'Название предмета…',autocomplete:'off','aria-label':'Найти предмет'});
  const target=h('select',{class:'wiki-inline-select','aria-label':'Выбери предмет'});
  const feedback=h('small',{class:'inline-owner-error',role:'status'});
  form.append(search,target,feedback);container.append(form);
  const items=Object.entries(wikiData.items||{});
  const fill=()=>{
   const q=wikiIndex.normalize(search.value);
   const matches=items.filter(([id])=>!q||wikiIndex.normalize(dataName('item',id)).includes(q)).slice(0,80);
   target.replaceChildren(h('option',{value:'',
    text:matches.length?'Выбери предмет':'Предметы не найдены'}));
   for(const [id]of matches)target.append(h('option',{value:id,text:dataName('item',id)}));
   target.disabled=!matches.length;
  };
  search.oninput=fill;
  target.onchange=async()=>{
   if(!target.value)return;
   target.disabled=true;
   try{await selectItem(Number(target.value))}
   catch(error){feedback.textContent=error.message;target.disabled=false}
  };
  const outside=e=>{
   if(!form.isConnected||!form.contains(e.target)){
    document.removeEventListener('pointerdown',outside,true);form.remove();
   }
  };
  document.addEventListener('pointerdown',outside,true);
  fill();search.focus();
 };
 function wikiOwnerEntityList({label,items,existing,kind,onChange,limit=1000}){
 const container=h('div',{class:'wiki-owner-relations'});
 if(label)container.append(h('h4',{text:label}));
 const ids=[...new Set((existing||[]).map(String))];
 const candidates=kind==='monster'?wikiData.monsters:
  kind==='npc'?wikiData.trades?.npcs:
  kind==='map'?wikiIndex.records('map'):
  kind==='item'?wikiData.items:wikiIndex.records('instance');
 const idValue=value=>/^[1-9][0-9]{0,14}$/.test(String(value))?Number(value):String(value);
 const holder=h('div',{class:'wiki-entity-flow'});
 for(const key of ids){
  const chip=h('span',{class:'wiki-owner-mat'});
  chip.append(kind==='item'?itemLink(key,dataName(kind,key)):
   wikiLink(dataName(kind,key),kind,key));
  if(adminEditing&&adminToken)chip.append(h('button',{type:'button',
   class:'wiki-owner-remove',text:'×','aria-label':'Удалить связь '+dataName(kind,key),
   onclick:()=>void onChange(ids.filter(x=>x!==key).map(idValue))
    .catch(err=>showStudioToast(err.message,'warning'))}));
  holder.append(chip);
 }
 container.append(holder);
 if(adminEditing&&adminToken&&ids.length<limit){
  const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
   text:'+ Добавить',title:'Добавить связь'});
  add.onclick=()=>{
   if(container.querySelector('.wiki-owner-relation-picker'))return;
   const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-relation-picker'});
   const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
    placeholder:'Поиск по названию…','aria-label':'Поиск для добавления'});
   
   const select=h('select',{class:'wiki-inline-select','aria-label':'Выбери запись'});
   const feedback=h('small',{class:'inline-owner-error',role:'status'});
   const fill=()=>{
    const q=wikiIndex.normalize(search.value);
    const choices=Object.entries(candidates||{}).filter(([key])=>!ids.includes(key)&&
     (!q||wikiIndex.normalize(dataName(kind,key)).includes(q))).slice(0,90);
    select.replaceChildren(h('option',{value:'',text:choices.length?'Выбери запись':'Не найдено'}));
    for(const [key]of choices)select.append(h('option',{value:key,text:dataName(kind,key)}));
   };
   panel.append(search,select,feedback);add.after(panel);
   search.oninput=fill;
   select.onchange=async()=>{
    if(!select.value)return;
    select.disabled=true;
    try{await onChange([...ids,select.value].map(idValue))}
    catch(e){feedback.textContent=e.message;select.disabled=false}
   };
   const outside=e=>{
    if(!panel.isConnected||(!panel.contains(e.target)&&e.target!==add)){
     document.removeEventListener('pointerdown',outside,true);panel.remove()
    }
   };
   document.addEventListener('pointerdown',outside,true);
   fill();search.focus();
  };
  container.append(add);
 }
 return container;
}

 const sourceEntry=(row,itemId)=>{
  const line=h('div',{class:'wiki-source-token'+
   (wikiSelection.highlight===String(row.id)?' highlighted':'')});
  const glyph={monster:'♞',npc:'♙',chest:'▣',zone:'◈'};
  const link=(name,type,id,cls='')=>{
   const anchor=wikiLink(name,type,id,itemId);
   if(cls)anchor.classList.add(cls);
   return anchor;
  };
  if(row.type==='monster'){
   line.append(link((glyph.monster+' '+dataName('monster',row.id)),'monster',row.id,'wiki-source-primary'));
   if(row.percent!=null&&!(row.manual&&adminEditing&&adminToken))line.append(h('small',{class:'wiki-source-chance',
    text:row.percent+'%'}));
   if(row.kind==='conditional')line.append(h('small',{class:'wiki-source-meta',
    text:wt('Особый дроп','Conditional')}));
   const locations=wikiIndex.locations(row.id).filter(loc=>loc.type==='map').slice(0,2);
   if(locations.length){
    const area=h('span',{class:'wiki-source-locations'});
    for(const loc of locations)area.append(link('◈ '+dataName('map',loc.id),'map',loc.id,'wiki-source-location'));
    line.append(area);
   }
  }else if(row.type==='npc'){
   line.append(link('♙ '+dataName('npc',row.id),'npc',row.id,'wiki-source-primary'));
  }else if(row.type==='chest'){
   const chest=link(dataName('chest',row.id),'chest',row.id,'wiki-source-primary');
   line.append(withIcon(chest,wikiIcon('chest',row.id),'chest'));
  }else if(row.type==='zone'){
   line.append(link('◈ '+dataName('map',row.id),'map',row.id,'wiki-source-primary'));
  }else if(row.type==='owner-map'){
   line.append(link('◈ '+dataName('map',row.id),'map',row.id,'wiki-source-primary'));
   line.append(h('small',{class:'wiki-source-meta',text:wt(
    'Связь с добычей добавлена редактором','Curated loot reference')}));
  }
  if(row.manual&&adminEditing&&adminToken){
   if(row.type==='monster'){
    const chance=h('small',{class:'wiki-source-chance wiki-edit-value',
     text:row.percent==null?'Шанс не указан':row.percent+'%',
     title:'Двойной клик — изменить шанс выпадения'});
    chance.ondblclick=e=>{
     e.preventDefault();e.stopPropagation();
     editWikiValue(chance,row.percent??0,{type:'number',min:0,max:100,
      onCommit:p=>saveWikiAcquisitions(itemId,
       (wikiData.ownerAcquisitions?.[itemId]||[]).map(source=>
        source.type===row.type&&String(source.id)===String(row.id)?
         {...source,p}:source))});
    };
    line.append(chance);
   }
   const remove=h('button',{type:'button',class:'wiki-owner-remove',
    text:'×','aria-label':'Удалить источник '+dataName(row.type,row.id),
    title:'Убрать источник получения'});
   remove.onclick=()=>void saveWikiAcquisitions(itemId,
    (wikiData.ownerAcquisitions?.[itemId]||[]).filter(x=>
     !(x.type===row.type&&String(x.id)===String(row.id))))
    .catch(error=>showStudioToast(error.message,'warning'));
   line.append(remove);
  }
  return line;
 };
 const appendSourceFlow=(found,itemId)=>{
  const flow=h('div',{class:'wiki-source-flow'});
  // The source index is kept complete; exact repeats need not occupy the UI.
  const seen=new Set();
  const ordered=adminEditing&&adminToken?[...found].sort((a,b)=>Number(Boolean(b.manual))-Number(Boolean(a.manual))):found;
  for(const row of ordered.slice(0,wikiSourceShown)){
   const key=[row.type,row.id,row.kind,row.percent,row.condition,row.roll].join(':');
   if(seen.has(key))continue;
   seen.add(key);
   flow.append(sourceEntry(row,itemId));
  }
  detail.append(flow);
 };
 const linkFlow=(links)=>{
  const flow=h('div',{class:'wiki-entity-flow'});
  for(const link of links)flow.append(link);
  return flow;
 };
 const rewardLabels=lang==='en'?
  {warrior:'Warriors',scout:'Scouts',acolyte:'Acolytes',mage:'Mages'}:
  {warrior:'Воины',scout:'Следопыты',acolyte:'Адепты',mage:'Маги'};
 const appendRewardChestInfo=(itemId)=>{
  const reward=wikiIndex.rewardChest(itemId);
  if(!reward)return false;
  detail.append(h('div',{class:'wiki-level-reward'},[
   h('span',{class:'wiki-level-reward-mark','aria-hidden':'true',text:'✦'}),
   h('div',{class:'wiki-level-reward-details'},[
    h('small',{text:wt('Награда за достижение уровня','Reward for reaching level')}),
    h('strong',{text:wt('Уровень ','Level ')+reward.level}),
    h('span',{text:wt('Для направления: ','Class family: ')+(rewardLabels[reward.family]||reward.family)})
   ])
  ]));
  return true;
 };

 const appendAcquisitionEditor=(id)=>{
    if(adminEditing&&adminToken){
     const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
      text:'+ Добавить источник',title:'Связать предмет с NPC или монстром'});
     add.onclick=()=>{
      const previous=detail.querySelector('.wiki-owner-acquisition-picker');
       if(previous){previous.remove();return}
       const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-acquisition-picker'});
      const kind=h('select',{class:'wiki-inline-select','aria-label':'Тип получения'},[
       h('option',{value:'',text:'Выбери тип получения'}),
       h('option',{value:'monster',text:'Монстр'}),
       h('option',{value:'npc',text:'NPC'})]);
      const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
       'aria-label':'Найти NPC или монстра',placeholder:'Поиск по названию…',autocomplete:'off'});
      const target=h('select',{class:'wiki-inline-select',
       'aria-label':'У кого получить',disabled:true});
      const feedback=h('small',{class:'inline-owner-error',role:'status'});
      const label=(text,control)=>h('label',{class:'wiki-owner-source-field'},[
       h('span',{text}),control]);
      panel.append(label('Тип получения',kind),label('Найди по имени',search),
        label('У кого получить',target),feedback,
        h('button',{type:'button',class:'wiki-owner-cancel',text:'Отмена',onclick:()=>panel.remove()}));
      add.after(panel);
      const refresh=()=>{
       const entries=kind.value==='monster'?Object.entries(wikiData.monsters||{}):
        kind.value==='npc'?Object.entries(wikiData.trades?.npcs||{}):[];
       const q=wikiIndex.normalize(search.value);
       const filtered=entries.filter(([key])=>!q||
        wikiIndex.normalize(dataName(kind.value,key)).includes(q)).slice(0,90);
       target.replaceChildren(h('option',{value:'',
        text:filtered.length?(kind.value==='monster'?'Выбери монстра':'Выбери персонажа'):'Ничего не найдено'}));
       for(const [key,obj] of filtered){
        const suffix=kind.value==='monster'&&Number.isFinite(obj.level)?
         ' · ур. '+obj.level:'';
        target.append(h('option',{value:key,text:dataName(kind.value,key)+suffix}));
       }
       target.disabled=!kind.value||!filtered.length;
      };
      kind.onchange=()=>{search.value='';feedback.textContent='';refresh();search.focus()};
      search.oninput=refresh;
      target.onchange=async()=>{
       if(!target.value||!kind.value)return;
       const selected={type:kind.value,id:String(target.value)};
       const existing=wikiIndex.sources(id).some(row=>row.type===selected.type&&
        String(row.id)===selected.id);
       if(existing){feedback.textContent='Этот источник уже указан.';return}
       const earlier=wikiData.ownerAcquisitions?.[id]||[];
       if(earlier.length>=24){feedback.textContent='Достигнут предел: 24 источника.';return}
       target.disabled=true;
       try{await saveWikiAcquisitions(id,[...earlier,selected])}
       catch(error){target.disabled=false;feedback.textContent=error.message}
      };
      const outside=event=>{
       if(!panel.isConnected||(!panel.contains(event.target)&&event.target!==add)){
        document.removeEventListener('pointerdown',outside,true);panel.remove();
       }
      };
      document.addEventListener('pointerdown',outside,true);
      refresh();kind.focus();
     };
     detail.append(add);
    }
 };

 const draw=(detailOnly=false)=>{
   if(lastWikiIndex!==wikiIndex){
    nameCache.clear();searchCache.clear();lastWikiIndex=wikiIndex;
   }
   const previousScroll=browse.scrollTop,previousDetailScroll=detail.scrollTop;
  window.PandoraStageItemUI?.dismissPreview();
  const sourceKey=wikiSelection.type+':'+String(wikiSelection.id??'');
  if(wikiSourceRecord!==sourceKey){
   wikiSourceShown=80;wikiUsageShown=80;wikiSourceRecord=sourceKey;
  }
  if(!detailOnly)browse.replaceChildren();
  detail.replaceChildren();
  const type=wikiSelection.type;
  const knownMaps=wikiIndex.records('map');
  const records=wikiIndex.records(type);
  const heroCompatible=(rec,level)=>Boolean(catalog.equipment?.[String(rec.id)])&&
   slotKeys.includes(rec.slot)&&rec.isCostumeOverlay!==true&&
   !String(rec.kind||'').startsWith('DECO_')&&
   window.PandoraStudioRules.equipment(rec,{
    job:jobKeys[state.job],slot:rec.slot,level
   }).allowed&&window.PandoraUIPlanner.raceCompatible(rec,state.race,state.gender);
  const utilityCategories=item=>window.PandoraWikiData.utilityCategories(item);
  const isUtilityItem=item=>utilityCategories(item).length>0;
  const isVisibleItem=(item,kind)=>kind==='all'?true:
   kind==='equipment'?slotKeys.includes(item.slot):
   kind==='elemental'?item.slot==='weapon'&&
    Boolean(window.PandoraConditionalItemBonuses?.elementOf?.(item))&&
    (wikiElementFilter==='all'||
     window.PandoraConditionalItemBonuses.elementOf(item)===wikiElementFilter):
   kind==='utility'?isUtilityItem(item)&&
    (wikiEffectFilter==='all'||utilityCategories(item).includes(wikiEffectFilter)):
    item.slot===kind;
  // Links from monsters, trades and chests must reveal non-equipment rewards too.
  if(type==='item'&&wikiSelection.id!=null&&records?.[wikiSelection.id]){
   const selected=records[wikiSelection.id];
   const permitted=isVisibleItem(selected,wikiItemType)&&
    !(wikiItemType==='all'&&slotKeys.includes(selected.slot));
   if(!permitted){
    const was=wikiItemType;
    wikiItemType=isUtilityItem(selected)?'utility':
     slotKeys.includes(selected.slot)?'equipment':'all';
    if(wikiItemType==='utility')wikiEffectFilter='all';
    if(was!==wikiItemType){renderDetails();return}
    const picker=controls.querySelector('.wiki-equipment-type');
    if(picker)picker.value=wikiItemType;
   }
   if(wikiItemEligibility!=='all'&&
    !heroCompatible(selected,state.level)){
    wikiItemEligibility='all';
    const picker=controls.querySelector('.wiki-eligibility-filter');
    if(picker)picker.value='all';
   }
  }
  const results=wikiIndex.search(type,wikiSearch,id=>searchTerms(type,id))
   .filter(([,rec])=>{
    if(type!=='item')return true;
    if(!isVisibleItem(rec,wikiItemType))return false;
    return ['all','elemental','utility'].includes(wikiItemType)||wikiItemEligibility==='all'||
     heroCompatible(rec,state.level);
   });
  if(type==='map'&&!wikiSearch){
   const geo=window.PandoraAstirLocations;
   const rank=new Map([...(geo?.districtIds||[]),...(geo?.countryIds||[])]
    .map((id,index)=>[id,index]));
   results.sort((a,b)=>(rank.get(String(a[0]))??100)-
    (rank.get(String(b[0]))??100));
  }
  // A source link outside the current search must clear that search, otherwise
  // the linked record opens in details but never appears in the browse list.
  if(wikiSearch&&wikiSelection.id!=null&&records?.[wikiSelection.id]&&
   !results.some(([id])=>id===wikiSelection.id)){
   wikiSearch='';search.value='';draw(false);return;
  }
  browse.classList.toggle('wiki-gear-grid',wikiItemLayout==='grid');
  const selectedIndex=wikiSelection.id==null?-1:results.findIndex(([id])=>id===wikiSelection.id);
  const visible=selectedIndex>=wikiShown?
   [results[selectedIndex],...results.slice(0,wikiShown)]:results.slice(0,wikiShown);
  if(!detailOnly){
   browse.append(h('p',{class:'muted',text:lang==='en'?'Showing '+visible.length+' of '+results.length+' entries':'Показано '+visible.length+' из '+results.length+' записей'}));
   let lastPlaceGroup=null;
   for(const [id,rec]of visible){
    if(type==='map'&&!wikiSearch){
     const geo=window.PandoraAstirLocations;
     const group=geo?.district(id)?'city':geo?.country(id)?'nation':'other';
     if(group!==lastPlaceGroup){
      browse.append(h('h4',{class:'wiki-location-list-heading',text:{
       city:wt('Город Астир · районы','Astir city · districts'),
       nation:wt('Государства','Nations'),
       other:wt('Другие локации','Other locations')
      }[group]}));
      lastPlaceGroup=group;
     }
    }
    const row=withIcon(wikiLink(dataName(type,id),type,id),wikiIcon(type,id,rec),type);
    row.setAttribute('data-wiki-record',String(id));
    if(wikiSelection.id===id){
     row.classList.add('selected');
     row.setAttribute('aria-current','page');
    }
    browse.append(row);
   }
   if(results.length>wikiShown){
    browse.append(h('button',{type:'button',class:'wiki-more',text:(lang==='en'?'Show more ':'Показать ещё ')+Math.min(100,results.length-wikiShown)+' / '+(results.length-wikiShown),
     onclick:()=>{wikiShown+=100;draw()}}));
   }
   browse.scrollTop=selectedIndex>=wikiShown?0:previousScroll;
  }else{
   browse.querySelectorAll('[data-wiki-record]').forEach(row=>{
    const selected=row.getAttribute('data-wiki-record')===wikiSelection.id;
    row.classList.toggle('selected',selected);
    if(selected)row.setAttribute('aria-current','page');
    else row.removeAttribute('aria-current');
   });
  }
  const id=wikiSelection.id,rec=id==null?null:records?.[id];
  if(!rec){detail.append(h('p',{class:'muted',text:!results.length?(lang==='en'?'No matching entries.':'Ничего не найдено.'):(lang==='en'?'Select an entry to view its details and sources.':'Выбери запись для просмотра характеристик и связанных источников.')}));return}
  const typeLabel=lang==='en'?{item:'Item',monster:'Monster',map:'Location',npc:'NPC',
    skill:'Skill',soul:'Soul',instance:'Dungeon',chest:'Chest'}:
   {item:'Предмет',monster:'Монстр',map:'Локация',npc:'Персонаж',
    skill:'Умение',soul:'Душа',instance:'Подземелье',chest:'Сундук'};
   if(['monster','map','npc','instance'].includes(type))detail.append(h('span',{class:'wiki-category-symbol','aria-hidden':'true',text:wikiGlyphs[type]}));
   const nameKey=type==='skill'?'skill.'+(rec.branch||'race')+'.'+id:
    ['item','chest'].includes(type)?'item.'+id:null;
   const heading=h('h3',{text:dataName(type,id),
    ...(adminEditing&&lang==='ru'&&nameKey?{'data-edit-key':nameKey}:{}),
    ...(adminEditing&&(lang==='ru'||['npc','map','monster'].includes(type))&&
     ['monster','map','npc','instance','soul'].includes(type)?
      {'data-owner-record':type+':'+id,
       'data-owner-field':lang==='en'?'nameEn':'name'}:{})});
   detail.append(h('small',{class:'eyebrow',text:typeLabel[type]||'Сведения'}));
   detail.append(heading);
   const namesakes=wikiIndex.sameName(type,id);
   if(namesakes.length)detail.append(h('small',{class:'wiki-variant-note',
    text:wt('Есть другие варианты с таким названием','Other entries share this name')}));

  if(type==='item'||type==='chest'||type==='soul'){
    const img=wikiImage(wikiIcon(type,id,rec),'wiki-record-icon wiki-item-portrait',type);
    if(img)detail.prepend(img);
  }
  const described=type==='chest'?wikiData.items?.[id]:rec;
  const englishDescription=lang==='en'?(rec?.descEn||officialEnglish?.[
   type==='item'||type==='chest'?'items':type==='soul'?'souls':
   type==='monster'?'monsters':type==='skill'?'skills':'maps']?.[id]?.d):null;
  if(described?.desc||(lang==='en'&&described?.descEn)||
   (adminEditing&&adminToken&&(lang==='ru'||['npc','map','monster'].includes(type))&&type!=='instance')){
   const text=englishDescription||described?.desc||'';
   const missing=!text.trim();
   const descKey=type==='skill'?'skilldesc.'+(rec.branch||'race')+'.'+id:
    ['item','chest'].includes(type)?'itemdesc.'+id:null;
   const description=h('p',{class:'wiki-description'+(missing?' wiki-description-placeholder':''),text:
    missing?wt('Двойной клик — добавить описание','Double-click to add description'):
    ['item','chest','soul'].includes(type)?window.PandoraItemPresentation.description(text):text,
    ...(adminEditing&&lang==='ru'&&descKey?{'data-edit-key':descKey}:{}),
    ...(adminEditing&&(lang==='ru'||['npc','map','monster'].includes(type))&&
     ['monster','map','npc','instance','soul'].includes(type)?
      {'data-owner-record':type+':'+id,
       'data-owner-field':lang==='en'?'descEn':type==='instance'?'blurbRu':'desc',
       ...(missing?{'data-owner-empty':'true'}:{})}:{})});
   detail.append(description);
  }
  if(type==='item'&&utilityCategories(rec).includes('harmful'))
   detail.append(h('p',{class:'wiki-description wiki-harmful-consumable-note',
    text:wt('При использовании отравляет персонажа, употребившего предмет: временный эффект отравления периодически наносит ему урон ядом. Урон за тик, интервал, длительность и шанс из данных OS не установлены.',
     'Using this item poisons the character who consumed it: the temporary poison effect deals periodic poison damage to that character. Tick damage, interval, duration and chance are not established by the OS data.')}));
  if(type==='map'){
   const geo=window.PandoraAstirLocations;
   const district=geo?.district(id),nation=geo?.country(id);
   if(district){
    const city=h('div',{class:'wiki-astir-neighborhoods'});
    city.append(h('small',{text:wt('Районы города Астир','Astir city districts')}));
    for(const placeId of geo.districtIds)
     city.append(wikiLink(dataName('map',placeId),'map',placeId));
    detail.append(city);
   }else if(nation)detail.append(h('span',{class:'wiki-map-kind',
    text:wt('Государство','Nation')}));
  }
  if(type==='item'||type==='chest')appendRewardChestInfo(id);
  const renderClassEligibility=(keys,isItem=false)=>{
   const manage=adminEditing&&adminToken&&(isItem||type==='skill');
   const saveClasses=next=>isItem?saveWikiItemField(id,'classes',next):
    saveWikiRecordField('skill',id,'classes',next);
   if(!keys.length&&!manage)return;
   const all=jobKeys.every(id=>keys.includes(id));
   if(all&&!manage){
    detail.append(h('p',{class:'wiki-class-all',text:'✦ '+wt('Все классы','All classes')}));
    return;
   }
   const tags=h('div',{class:'wiki-class-tags',role:'list'});
   for(const key of keys){
    const name=classLabel(key);
    if(!name)continue;
    const chip=h('span',{class:'wiki-class-tag'+(key===jobKeys[state.job]?' is-hero-class':''),
     role:'listitem',title:name},[
      h('span',{class:'wiki-class-sigil','aria-hidden':'true',text:'✦'}),
      h('span',{text:name})
    ]);
    if(manage)chip.append(h('button',{type:'button',class:'wiki-owner-remove',
     text:'×','aria-label':'Убрать класс '+name,
     onclick:()=>void saveClasses(Object.fromEntries(keys.filter(x=>x!==key).map(x=>[x,1])))
     .catch(error=>showStudioToast(error.message,'warning'))}));
    tags.append(chip);
   }
   if(manage&&keys.length<jobKeys.length){
    const plus=h('button',{type:'button',class:'wiki-owner-plus',text:'+',
     'aria-label':'Добавить доступный класс'});
    plus.onclick=()=>{
     const select=h('select',{class:'wiki-inline-select','aria-label':'Выбери класс'});
     select.append(h('option',{value:'',text:'Выбери класс'}));
     for(const key of jobKeys.filter(x=>!keys.includes(x)))
      select.append(h('option',{value:key,text:classLabel(key)||key}));
     plus.replaceWith(select);
     select.onchange=()=>{if(select.value)void saveClasses(
      Object.fromEntries([...keys,select.value].map(x=>[x,1])))
      .catch(error=>showStudioToast(error.message,'warning'))};
     select.onblur=()=>{if(select.isConnected)select.replaceWith(plus)};
     select.focus();
    };
    tags.append(plus);
   }
   detail.append(h('div',{class:'wiki-allowed-classes'},[
    h('h4',{text:wt('Доступные классы','Eligible classes')}),tags
   ]));
  };
  const moreSources=(rows,group='sources')=>{
   const shown=group==='usage'?wikiUsageShown:wikiSourceShown;
   if(rows.length<=shown)return;
   detail.append(h('button',{type:'button',class:'wiki-more',text:wt('Показать ещё ','Show more ')+
    Math.min(80,rows.length-shown)+' / '+(rows.length-shown),
    onclick:()=>{
     if(group==='usage')wikiUsageShown+=80;
     else wikiSourceShown+=80;
     draw(true);
    }}));
  };
  if(type==='item'){
    if(adminEditing&&adminToken)detail.append(h('small',{class:'wiki-owner-instruction',text:'Двойной клик по значению — изменить; выход из поля — сохранить.'}));
    if(rec.sourceNote)detail.append(h('section',{class:'wiki-owner-note'},[
      h('strong',{text:'Комментарий администратора об источнике'}),
      h('p',{text:rec.sourceNote})
    ]));
    const dl=h('dl',{class:'item-fields'});
    const itemFields=[
     [wt('Тип','Type'),window.PandoraItemPresentation.kind(rec,lang),'kind'],
     [wt('Уровень','Level'),rec.level,'level'],
     [wt('Атака','Attack'),rec.W,'W'],
     [wt('Пробитие','Penetration'),rec.PEN,'PEN'],
     [wt('Защита','Defense'),rec.AC,'AC'],
     [wt('Скорость атаки','Attack speed'),rec.atkspeed,'atkspeed'],
     [wt('Дальность','Range'),rec.range,'range'],
     [wt('Гнёзда душ','Soul sockets'),rec.soulslot,'soulslot']
    ];
    const hints={kind:'Игровая категория предмета',level:'Уровень предмета',W:'Показатель атаки оружия',PEN:'Показатель пробития оружия',AC:'Защита предмета',atkspeed:'Скорость атаки',range:'Дальность действия',soulslot:'Гнёзда душ: от 0 до 3'};
    for(const [label,value,key]of itemFields)if(value!=null){
     const dt=h('dt',{class:'wiki-help-label'},[
      h('span',{text:label,title:hints[key]||label,class:'wiki-help-word'})]);
     const dd=h('dd',{text:String(value),class:adminEditing&&adminToken?'wiki-edit-value':''});
     if(adminEditing&&adminToken){
      dd.title=wt('Двойной клик для изменения','Double-click to edit');
      dd.ondblclick=e=>{
       e.preventDefault();e.stopPropagation();
       if(key==='kind'){
        const options=window.PandoraItemPresentation.kindOptions(lang);
        const present=new Set(Object.values(wikiData.items||{}).filter(x=>x?.slot===rec.slot).map(x=>x.kind));
        if(rec.slot==='weapon')
         for(const value of ['1H_SWORD','2H_SWORD','1H_AXE','2H_AXE','1H_BLUNT_WEAPON','2H_BLUNT_WEAPON','POLE_ARM','LANCE','BOW','CROSSBOW','WAND','STAFF'])present.add(value);
        present.add(rec.kind);
        editWikiValue(dd,rec.kind,{type:'select',options:options.filter(x=>present.has(x.value)),
         onCommit:next=>saveWikiItemField(id,'kind',next)});
       }else editWikiValue(dd,value,{type:'number',max:key==='soulslot'?3:100000,
        integer:key==='soulslot',onCommit:next=>saveWikiItemField(id,key,next)});
      };
     }
     dl.append(dt,dd);
    }
    if(rec.twoHanded===true)dl.append(h('dt',{text:wt('Хват','Grip')}),
     h('dd',{text:wt('Двуручное','Two-handed')}));
    detail.append(dl);
    if((rec.effects?.length||0)>0||(adminEditing&&adminToken)){
     const effectRows=rec.effects||[];
     const effectOptions=window.PandoraStudioItemOwnerEditor.effectOptions(wikiData.items,rec);
      const allEffectOptions=window.PandoraStudioItemOwnerEditor.effectOptions(wikiData.items);
      const labelFor=code=>code==='EP_DESTINED_POISON'&&lang==='en'?
      'Applies poison':lang==='ru'?
       window.PandoraStudioItemOwnerEditor.effectDisplayLabel(code,lang):
       allEffectOptions.find(row=>row.value===code)?.label||code;
     const update=(index,patch)=>saveWikiItemField(id,'effects',
      effectRows.map((effect,i)=>i===index?{...effect,...patch}:effect));
     const list=h('div',{class:'wiki-owner-effects'});
     list.append(h('h4',{text:utilityCategories(rec).includes('harmful')?
      wt('Эффекты предмета','Item effects'):wt('Бонусы предмета','Item bonuses')}));
     for(const [index,effect] of effectRows.entries()){
      const row=h('div',{class:'wiki-owner-effect'});
      const effectName=h('span',{class:'wiki-owner-effect-name',text:labelFor(effect.func),
       title:adminEditing&&adminToken?'Двойной клик — выбрать другой эффект':''});
      if(adminEditing&&adminToken){
       effectName.classList.add('wiki-edit-value');
       effectName.ondblclick=e=>{
        e.preventDefault();e.stopPropagation();
        editWikiValue(effectName,effect.func,{
         type:'select',options:effectOptions.some(row=>row.value===effect.func)?
           effectOptions:[...effectOptions,{value:effect.func,label:labelFor(effect.func)}],
         onCommit:next=>update(index,{func:next})});
       };
      }
      row.append(effectName);
      for(const [key,label] of [['a','Бонус'],['b','Доп. параметр']]){
        if(effect.func==='EP_DESTINED_POISON'&&key==='a'&&!(adminEditing&&adminToken))continue;
        const initial=effect[key];
        if(key==='b'&&!adminEditing)continue;
        if(initial==null&&!adminEditing)continue;
        const value=h('span',{class:'wiki-owner-effect-value'});
        if(adminEditing&&adminToken&&(key==='b'||
         (key==='a'&&effect.func==='EP_DESTINED_POISON')))
         value.append(h('small',{text:key==='a'?
          wt('Параметр OS (значение неизвестно)','OS parameter (meaning unknown)'):label}));
        const signed=/^EP_(?:MAXLIFE|MAXMANA|STRENGTH|VITARITY|AGILITY|DEXTERITY|SPIRITUAL|INTELIGENCE|ARMORCLASS|TOHIT|CRITICALRATE|DAMAGERATE|FIRE_RESISTANCE|COLD_RESISTANCE|MAGIC_RESISTANCE|ATTACKINTERVAL|DARK_RESISTANCE|HOLY_RESISTANCE|POISON_RESISTANCE|MOVESPEED|AVOIDANCE|DESTINE_WARDING|ELEMENT_DAMAGE|VOLUME_EXP|IMMUNE_BURN|IMMUNE_VIT_TYPE|SKILL_BENCH)/.test(effect.func);
        const percentage=key==='a'&&(/_SCALE$/.test(effect.func)||
         ['EP_IMMUNE_BURN','EP_IMMUNE_VIT_TYPE','EP_SKILL_BENCH','EP_SKILL_DELAY'].includes(effect.func));
        const formatted=initial==null?'—':
         (signed&&Number(initial)>0?'+'+initial:String(initial))+(percentage?'%':'');
        const number=h('strong',{text:formatted});
       if(adminEditing&&adminToken){
        number.classList.add('wiki-edit-value');
        number.title='Двойной клик — изменить число';
        number.ondblclick=e=>{
         e.preventDefault();e.stopPropagation();
         editWikiValue(number,initial??0,{type:'number',min:-100000,max:100000,
          onCommit:n=>update(index,{[key]:n})});
        };
       }
       value.append(number);row.append(value);
      }
      if(adminEditing&&adminToken){
       const dir=h('span',{class:'wiki-owner-effect-value'});
       dir.append(h('small',{text:'Применение'}));
       const indicator=h('strong',{class:'wiki-edit-value',
        text:effect.dir==='CASTER'?'К применяющему':'К цели',
        title:'Двойной клик — выбрать применение'});
       indicator.ondblclick=e=>{
        e.preventDefault();e.stopPropagation();
        editWikiValue(indicator,effect.dir,{type:'select',options:[
         {value:'TARGET',label:'К цели'},
         {value:'CASTER',label:'К применяющему'}],
         onCommit:next=>update(index,{dir:next})});
       };
       dir.append(indicator);row.append(dir);
       row.append(h('button',{type:'button',class:'wiki-owner-remove',
        text:'×','aria-label':'Удалить эффект '+labelFor(effect.func),
        onclick:()=>void saveWikiItemField(id,'effects',
         effectRows.filter((_,i)=>i!==index)).catch(e=>showStudioToast(e.message,'warning'))}));
      }
      list.append(row);
     }
     if(adminEditing&&adminToken){
      const plus=h('button',{type:'button',class:'wiki-owner-plus',text:'+ Добавить эффект'});
      plus.onclick=()=>{
       if(list.querySelector('.wiki-owner-effect-picker'))return;
       const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-effect-picker'});
       const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
        'aria-label':'Поиск эффекта',placeholder:'Найти игровой эффект…'});
       
       const chooser=h('select',{class:'wiki-inline-select','aria-label':'Выбери эффект'});
       const error=h('small',{class:'inline-owner-error',role:'status'});
       const fill=()=>{
        const q=wikiIndex.normalize(search.value);
        const matches=effectOptions.filter(row=>!q||
         wikiIndex.normalize(row.label+' '+row.value).includes(q));
        chooser.replaceChildren(h('option',{value:'',text:matches.length?'Выбери эффект':'Эффекты не найдены'}));
        for(const row of matches)chooser.append(h('option',{value:row.value,text:row.label}));
       };
       search.oninput=fill;
       chooser.onchange=async()=>{
        if(!chooser.value)return;
        if(effectRows.length>=32){error.textContent='Можно добавить не более 32 эффектов';return}
        chooser.disabled=true;
        try{await saveWikiItemField(id,'effects',[
         ...effectRows,{func:chooser.value,dir:'TARGET',exclusive:null,a:0,b:null}])}
        catch(e){error.textContent=e.message;chooser.disabled=false}
       };
       panel.append(search,chooser,error);plus.after(panel);
       const outside=e=>{
        if(!panel.isConnected||(!panel.contains(e.target)&&e.target!==plus)){
         document.removeEventListener('pointerdown',outside,true);panel.remove();
        }
       };
       document.addEventListener('pointerdown',outside,true);
       fill();search.focus();
      };
      list.append(plus);
     }
     const conditional=window.PandoraConditionalItemBonuses?.parse?.(rec);
     if(conditional&&(conditional.rows.length||conditional.phoenix)){
      const section=h('section',{class:'wiki-conditional-bonuses'});
      section.append(h('h4',{text:wt('Бонусы заточки','Enhancement bonuses')}),
       h('p',{class:'wiki-conditional-condition',text:
        wt(conditional.condition,'Fire-gem enhancement from +7, per enhancement level')}));
      for(const bonus of conditional.rows){
       const line=h('div',{class:'wiki-owner-effect wiki-conditional-row'});
       line.append(h('span',{class:'wiki-owner-effect-name',text:bonus.name}),
        h('span',{class:'wiki-owner-effect-value'},[
         h('strong',{text:'+'+bonus.value+(bonus.unit==='%'?'%':'')})
        ]));
       section.append(line);
      }
      if(conditional.phoenix){
       const flame=conditional.phoenix;
       const line=h('div',{class:'wiki-owner-effect wiki-conditional-row'});
       const explanation=window.PandoraConditionalItemBonuses.phoenixExplanation(flame);
       const title=h('span',{class:'wiki-owner-effect-name'});
       const term=h('span',{class:'wiki-conditional-term',tabindex:'0',
        'aria-label':'Пламя феникса. '+explanation,
        text:wt('Пламя феникса','Phoenix Flame')});
       title.append(h('span',{text:wt('Шанс призвать ','Chance to summon ')}),term);
       line.append(title,h('span',{class:'wiki-owner-effect-value'},[
        h('strong',{text:'+'+flame.chance+'%'})]));
       const tip=h('div',{class:'wiki-phoenix-explanation',role:'note',
        text:explanation});section.append(line,tip);
      }
      list.append(section);
     }
     detail.append(list);
    }
    if(!wikiIndex.rewardChest(id))renderClassEligibility(Object.keys(rec.classes||{}).filter(key=>rec.classes[key]),true);
    const wearers=window.PandoraUIPlanner.outfitWearers(rec,lang);
    if(wearers?.length)detail.append(h('div',{class:'wiki-item-wearers'},[
     h('small',{text:wt('Для персонажей','Wearable by')}),
     h('div',{class:'wiki-wearer-tags'},wearers.map(name=>
      h('span',{class:'wiki-wearer-tag',text:'✧ '+name})))
    ]));
    detail.append(h('h4',{text:wt('Где получить','How to obtain')}));
    const found=wikiIndex.sources(id);
    if(!found.length)detail.append(h('p',{class:'muted',text:wikiIndex.rewardChest(id)?
     wt('Награда за достижение уровня указана выше.','The level reward is shown above.'):
     wt('Подтверждённые источники в доступном каталоге не найдены.','No confirmed sources in the current catalog.')}));
    if(found.length)appendSourceFlow(found,id);
    moreSources(found);
    appendAcquisitionEditor(id);
    const usedIn=wikiIndex.materialUses(id);
    if(usedIn.length){
     detail.append(h('h4',{text:(lang==='en'?'Used in NPC trades · ':'Используется в обмене NPC · ')+usedIn.length}));
     const recipes=h('div',{class:'wiki-recipe-uses'});
     for(const trade of usedIn.slice(0,wikiUsageShown)){
      const entry=h('div',{class:'wiki-recipe-use'+
       (wikiSelection.highlight===String(trade.i)?' highlighted':'')});
      const product=itemLink(trade.i,dataName('item',trade.i),id);
      product.classList.add('wiki-recipe-result');
      entry.append(product);
      if(adminEditing&&adminToken){
       const materialIndex=(trade.mats||[]).findIndex(row=>String(row.i)===String(id));
       if(materialIndex>=0){
        const current=trade.mats[materialIndex];
        const quantity=h('span',{class:'wiki-edit-value',text:' ×'+(current.n??1),
         title:'Двойной клик — изменить количество материала'});
        quantity.ondblclick=e=>{e.preventDefault();editWikiValue(quantity,current.n??1,
         {type:'number',min:1,max:999999,integer:true,onCommit:n=>
          saveWikiTradeRecipe({...trade,mats:trade.mats.map((x,i)=>
           i===materialIndex?{...x,n}:x)})})};
        entry.append(quantity,h('button',{type:'button',class:'wiki-owner-remove',
         text:'×','aria-label':'Исключить материал из обмена NPC',
         onclick:()=>void saveWikiTradeRecipe({...trade,
          mats:trade.mats.filter((_,i)=>i!==materialIndex)})
          .catch(err=>showStudioToast(err.message,'warning'))}));
       }
      }
      const npcs=[...new Set((trade.npc||[]).map(String))].slice(0,5);
      if(npcs.length){
       const places=h('div',{class:'wiki-recipe-npcs'});
       for(const npcId of npcs)places.append(wikiLink('♙ '+dataName('npc',npcId),'npc',npcId,trade.i));
       entry.append(places);
      }
      recipes.append(entry);
     }
     detail.append(recipes);
     moreSources(usedIn,'usage');
    }
    if(adminEditing&&adminToken){
     const plus=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
      text:'+ Обмен NPC с этим материалом'});
     plus.onclick=()=>{
      if(detail.querySelector('.wiki-owner-trade-npc'))return;
      const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-trade-npc'});
      const pick=h('select',{class:'wiki-inline-select','aria-label':'Выбери NPC для обмена'});
      pick.append(h('option',{value:'',text:'Выбери NPC'}));
      for(const [npcId] of Object.entries(wikiData.trades.npcs||{}))
       pick.append(h('option',{value:npcId,text:dataName('npc',npcId)}));
      panel.append(pick,h('button',{type:'button',class:'wiki-owner-cancel',
        text:'Отмена',onclick:()=>panel.remove()}));plus.after(panel);
      pick.onchange=()=>{
       if(!pick.value)return;
       const npcId=Number(pick.value);
       wikiItemChoice(panel,async rewardId=>{
        let unique=null;
        for(let n=0;n<30;n++){
         const candidate=900000000+crypto.getRandomValues(new Uint32Array(1))[0];
         if(!(wikiData.trades.trades||[]).some(x=>x.id===candidate)&&
          !Object.hasOwn(override,'tradeedit.'+candidate)){unique=candidate;break}
        }
        if(unique===null)throw Error('Не удалось назначить уникальный номер');
        await saveWikiTradeRecipe({id:unique,i:rewardId,npc:[npcId],
         mats:[{i:Number(id),n:1}],gold:0,honor:0,exp:0});
       });
      };
      pick.focus();
     };
     detail.append(plus);
    }
  }else if(type==='skill'){
    const skillFields=[
     [wt('Уровень героя','Hero level'),rec.charLevel,'charLevel'],
     [wt('Затраты ОМ','MP cost'),rec.mana,'mana'],
     [wt('Подготовка, с','Cast, sec'),rec.cast,'cast'],
     [wt('Перезарядка, с','Cooldown, sec'),rec.cooldown,'cooldown'],
     [wt('Дальность','Range'),rec.range,'range']
    ];
    const dl=h('dl',{class:'item-fields'});
    for(const [label,value,key] of skillFields)if(value!=null)
     dl.append(h('dt',{text:label}),wikiOwnerNumeric(h('dd',{text:String(value)}),
      value,'skill',id,key,{integer:key==='charLevel'}));
    detail.append(dl,h('h4',{text:wt('Требования','Requirements')}));
    if(!rec.reqs?.length&&rec.prereq==null)detail.append(h('p',{class:'muted',
     text:wt('Требования веток не указаны.','No branch requirements listed.')}));
    const reqs=h('div',{class:'wiki-requirements',role:'list'});
    for(const [index,req] of (rec.reqs||[]).entries()){
     if(!req||!Number.isFinite(Number(req.amount)))continue;
     const current=Math.max(0,Number(state.points?.[req.branch])||0);
     const required=Math.max(0,Number(req.amount)),ready=current>=required;
     const chip=h('div',{class:'wiki-requirement-chip'+(ready?' fulfilled':''),
      role:'listitem','aria-label':branchLabel(req.branch)+': '+current+'/'+required});
     const target=h('small',{text:wt('Вложено ','Invested ')+current+' / '+required});
     chip.append(h('span',{class:'wiki-requirement-symbol','aria-hidden':'true',text:ready?'✦':'◇'}),
      h('div',{class:'wiki-requirement-copy'},[
       h('strong',{text:branchLabel(req.branch)}),target,
       h('span',{class:'wiki-requirement-track','aria-hidden':'true'},[
        h('span',{class:'wiki-requirement-progress',
         style:'width:'+Math.min(100,required>0?current/required*100:100)+'%'})
       ])
      ]));
     if(adminEditing&&adminToken){
      target.classList.add('wiki-edit-value');
      target.title='Двойной клик — изменить требование ветки';
      target.ondblclick=e=>{
       e.preventDefault();e.stopPropagation();
       editWikiValue(target,required,{type:'number',min:0,max:1000,integer:true,
        onCommit:amount=>saveWikiRecordField('skill',id,'reqs',
         rec.reqs.map((x,i)=>i===index?{...x,amount}:x))});
      };
      chip.append(h('button',{type:'button',class:'wiki-owner-remove',text:'×',
       'aria-label':'Удалить требование '+branchLabel(req.branch),
       onclick:()=>void saveWikiRecordField('skill',id,'reqs',
        rec.reqs.filter((_,i)=>i!==index)).catch(e=>showStudioToast(e.message,'warning'))}));
     }
     reqs.append(chip);
    }
    if(adminEditing&&adminToken&&(rec.reqs||[]).length<20){
     const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
      text:'+ Требование ветки',onclick:()=>{
       if(reqs.querySelector('.wiki-inline-select'))return;
       const select=h('select',{class:'wiki-inline-select','aria-label':'Выбери ветку'});
       select.append(h('option',{value:'',text:'Выбери ветку'}));
       for(const branch of branches.filter(x=>!(rec.reqs||[]).some(req=>req.branch===x.id)))
        select.append(h('option',{value:branch.id,text:branchLabel(branch.id)}));
       add.replaceWith(select);
       select.onchange=()=>{if(select.value)void saveWikiRecordField('skill',id,'reqs',
        [...(rec.reqs||[]),{branch:select.value,amount:1}])
        .catch(e=>showStudioToast(e.message,'warning'))};
       select.onblur=()=>{if(select.isConnected)select.replaceWith(add)};
       select.focus();
      }});
     reqs.append(add);
    }
    if(reqs.childElementCount)detail.append(reqs);
    const prereqPane=h('div',{class:'wiki-prerequisite'});
    prereqPane.append(h('small',{text:wt('Предыдущее умение','Prerequisite skill')}));
    if(rec.prereq!=null&&wikiData.skills?.[rec.prereq]){
     const prereq=wikiIndex.canonical('skill',rec.prereq);
     const link=wikiLink(dataName('skill',prereq),'skill',prereq);
     prereqPane.append(withIcon(link,wikiIcon('skill',prereq,wikiData.skills[prereq]),'skill'));
    }
    if(adminEditing&&adminToken){
     const add=h('button',{type:'button',class:'wiki-owner-plus',
      text:rec.prereq==null?'+ Выбрать умение':'✎ Изменить',
      onclick:()=>{
       const prior=prereqPane.querySelector('.wiki-owner-source-picker');
       if(prior){prior.remove();return}
       const panel=h('div',{class:'wiki-owner-source-picker'});
       const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
        placeholder:'Поиск предыдущего умения…','aria-label':'Найти умение'});
       
       const select=h('select',{class:'wiki-inline-select','aria-label':'Выбери предыдущее умение'});
       const fill=()=>{
        const q=wikiIndex.normalize(search.value);
        const matches=Object.entries(wikiData.skills||{}).filter(([skillId])=>
         String(skillId)!==String(id)&&(!q||
          wikiIndex.normalize(dataName('skill',skillId)).includes(q))).slice(0,90);
        select.replaceChildren(h('option',{value:'',text:'Выбери умение'}));
        for(const [skillId] of matches)
         select.append(h('option',{value:skillId,text:dataName('skill',skillId)}));
       };
       search.oninput=fill;
       select.onchange=()=>{if(select.value)void saveWikiRecordField('skill',id,'prereq',
        Number(select.value)).catch(error=>showStudioToast(error.message,'warning'))};
       panel.append(search,select,
        h('button',{type:'button',class:'wiki-owner-cancel',text:'Отмена',onclick:()=>panel.remove()}));
       add.after(panel);fill();search.focus();
      }});
     prereqPane.append(add);
     if(rec.prereq!=null)prereqPane.append(h('button',{type:'button',class:'wiki-owner-remove',
      text:'×','aria-label':'Убрать предыдущее умение',
      onclick:()=>void saveWikiRecordField('skill',id,'prereq',null)
       .catch(error=>showStudioToast(error.message,'warning'))}));
    }
    if(prereqPane.childElementCount>1)detail.append(prereqPane);
    renderClassEligibility(Object.keys(rec.classes||{}).filter(key=>rec.classes[key]),false);
    const icon=skillIcon(rec.branch,id,rec);
    if(icon){const image=wikiImage(icon,'wiki-record-icon',type);detail.prepend(image)}
  }else if(type==='soul'){
    const slotLabel=slot=>window.PandoraItemPresentation.slotLabel(slot,lang);
    const traits=h('section',{class:'wiki-soul-properties','aria-label':wt('Свойства души','Soul properties')});
    const slotPane=h('div',{class:'wiki-soul-properties-half'});
    slotPane.append(h('h4',{text:wt('Куда вставляется','Compatible equipment')}));
    const slots=h('div',{class:'wiki-soul-slot-list'});
    for(const slot of rec.slots||[]){
     const chip=h('span',{class:'wiki-owner-mat',text:slotLabel(slot)});
     if(adminEditing&&adminToken)chip.append(h('button',{type:'button',
      class:'wiki-owner-remove',text:'×','aria-label':'Убрать слот '+slotLabel(slot),
      onclick:()=>void saveWikiRecordField('soul',id,'slots',rec.slots.filter(x=>x!==slot))
       .catch(error=>showStudioToast(error.message,'warning'))}));
     slots.append(chip);
    }
    if(adminEditing&&adminToken){
     const add=h('button',{type:'button',class:'wiki-owner-plus',text:'+ Слот'});
     add.onclick=()=>{
      const choices=['weapon','shield','head','body','gloves','legs','feet',
       'cloak','ring','neck','belt','ear','accessory'].filter(x=>!(rec.slots||[]).includes(x));
      const select=h('select',{class:'wiki-inline-select','aria-label':'Выбери слот'});
      select.append(h('option',{value:'',text:'Выбери слот'}));
      for(const slot of choices)select.append(h('option',{value:slot,text:slotLabel(slot)}));
      add.replaceWith(select);
      select.onchange=()=>{if(select.value)void saveWikiRecordField('soul',id,'slots',
       [...(rec.slots||[]),select.value]).catch(error=>showStudioToast(error.message,'warning'))};
      select.onblur=()=>{if(select.isConnected)select.replaceWith(add)};
      select.focus();
     };
     slots.append(add);
    }
    if(!slots.childElementCount)slots.append(h('span',{class:'muted',text:'—'}));
    slotPane.append(slots);traits.append(slotPane);
    const pricePane=h('div',{class:'wiki-soul-properties-half wiki-soul-price-pane'});
    const help=wt(
     'Фиксированное значение из игрового справочника. Это не рыночная цена между игроками. По имеющимся данным нельзя подтвердить, что именно столько даст торговец при продаже души в лавку.',
     'Fixed value from the game catalog, not the market price between players. The currently available data does not verify the amount a shopkeeper pays for selling this Soul.');
    const heading=h('h4',{class:'wiki-soul-price-heading'});
    heading.append(h('span',{text:wt('Стоимость','Price'),
     class:'wiki-soul-price-label',title:help,tabindex:'0','aria-label':help}));
    heading.append(h('span',{class:'wiki-soul-price-help',text:'ⓘ',
     title:help,tabindex:'0','aria-label':help}));
    pricePane.append(heading);
    if(rec.price!=null)pricePane.append(wikiOwnerNumeric(
     h('strong',{class:'wiki-soul-price-value',
      text:Number(rec.price).toLocaleString('ru-RU')}),
     rec.price,'soul',id,'price',{integer:true}));
    else pricePane.append(h('span',{class:'muted',text:wt('Не указана','Not provided')}));
    traits.append(pricePane);
    detail.append(traits);
    detail.append(h('h4',{text:wt('Где получить душу','How to obtain this Soul')}));
    const found=wikiIndex.sources(id);
    if(!found.length)detail.append(h('p',{class:'muted',text:
     wt('Источник получения в доступном каталоге не указан.','No source listed in the current catalog.')}));
    if(found.length)appendSourceFlow(found,id);
    moreSources(found);
    appendAcquisitionEditor(id);
  }else if(type==='monster'){
    const monsterStats=[[wt('Уровень','Level'),rec.level,'level'],[wt('ОЗ','HP'),rec.life,'life'],
     [wt('Защита','Defense'),rec.ac,'ac'],[wt('Маг. защита','Magic defense'),rec.magicProtection,'magicProtection'],
     [wt('Защитный показатель','Warding'),rec.warding,'warding'],[wt('Сила','Strength'),rec.str,'str'],
     [wt('Выносливость','Vitality'),rec.vit,'vit'],[wt('Ловкость','Agility'),rec.agi,'agi'],
     [wt('Проворство','Dexterity'),rec.dex,'dex'],[wt('Дух','Spirit'),rec.spi,'spi'],
     [wt('Интеллект','Intelligence'),rec.int,'int']];
    detail.append(h('div',{class:'wiki-monster-stats'},
     monsterStats.filter(([,value])=>Number.isFinite(value)).map(([label,value,key])=>
      h('div',{class:'wiki-monster-stat'},[
       h('small',{text:label}),wikiOwnerNumeric(
        h('strong',{text:Number(value).toLocaleString('ru-RU')}),
        value,'monster',id,key,{integer:true})]))));
    if(rec.resists&&Object.keys(rec.resists).length){
     const names=lang==='en'?{physical:'Physical',fire:'Fire',cold:'Ice',
      lightning:'Lightning',poison:'Poison',charm:'Charm',magic:'Magic',
      holy:'Holy',dark:'Dark'}:
      {physical:'Физическое',fire:'Огонь',cold:'Лёд',
       lightning:'Молния',poison:'Яд',charm:'Чары',
       magic:'Магия',holy:'Свет',dark:'Тьма'};
     const symbols={physical:'⚔',fire:'♨',cold:'❄',lightning:'ϟ',poison:'☣',
      charm:'✧',magic:'✦',holy:'☼',dark:'☾'};
     const entries=Object.entries(rec.resists).filter(([,value])=>
      Number.isFinite(Number(value)));
     if(entries.length){
      detail.append(h('h4',{text:wt('Сопротивления','Resistances')}));
      const grid=h('div',{class:'wiki-monster-resists',role:'list'});
      for(const [key,value]of entries){
       const numeric=Number(value);
       grid.append(h('div',{class:'wiki-monster-resist'+(numeric<0?' negative':''),
        role:'listitem'},[
        h('span',{class:'wiki-resist-glyph','aria-hidden':'true',text:symbols[key]||'✧'}),
        h('span',{class:'wiki-resist-name',text:names[key]||key}),
        wikiOwnerNumeric(h('strong',{text:String(numeric)}),numeric,
         'monster',id,'resists.'+key,{min:-100,max:100})
       ]));
      }
      detail.append(grid);
     }
    }
    detail.append(h('h4',{text:wt('Места появления','Spawn locations')}));
    const places=wikiIndex.locations(id);
    if(adminEditing&&adminToken){
     for(const kind of ['map','instance']){
      const chosen=places.filter(x=>x.type===kind).map(x=>String(x.id));
      detail.append(wikiOwnerEntityList({label:kind==='map'?'Локации':'Подземелья',
       kind,existing:chosen,onChange:async next=>{
        const updated=next.map(String);
        const added=updated.find(x=>!chosen.includes(x));
        const removed=chosen.find(x=>!updated.includes(x));
        if(added)await saveWikiSpawns(id,kind,added,true);
        else if(removed)await saveWikiSpawns(id,kind,removed,false);
       }}));
     }
    }else if(places.length)detail.append(linkFlow(places.map(loc=>
     wikiLink('◈ '+dataName(loc.type,loc.id),loc.type,loc.id,id))));
    else detail.append(h('p',{class:'wiki-empty-value',text:'—'}));
    const ownDrop=wikiData.drops?.[id]||{d:[],s:[]};
    const dropRows=()=>({
     d:(ownDrop.d||[]).map(x=>({...x})),
     s:(ownDrop.s||[]).map(x=>({...x}))
    });
    const loot=adminEditing&&adminToken?[
     ...dropRows().d.map((x,ix)=>({
      itemId:String(x.i),quantity:x.n??1,percent:x.p??null,kind:'normal',
      slotAdd:x.slotAdd||0,group:'d',sourceIndex:ix})),
     ...dropRows().s.map((x,ix)=>({
      itemId:String(x.i),quantity:x.n??1,percent:x.p??null,kind:'conditional',
      slotAdd:x.slotAdd||0,group:'s',sourceIndex:ix}))
    ]:wikiIndex.drops(id);
    detail.append(h('h4',{text:wt('Выпадающие предметы','Dropped items')+
     (loot.length?' · '+loot.length:'')}));
    if(loot.length){
     const flow=h('div',{class:'wiki-loot-flow'});
     for(const row of loot){
      const update=(field,value)=>{
       const all=dropRows(),current=all[row.group]?.[row.sourceIndex];
       if(!current)throw Error('Запись добычи не найдена');
       all[row.group][row.sourceIndex]={...current,[field]:value};
       return saveWikiRelationRows('drop',id,all);
      };
      const entry=h('div',{class:'wiki-loot-chip'+
       (wikiSelection.highlight===row.itemId?' highlighted':'')});
      entry.append(itemLink(row.itemId,dataName('item',row.itemId),id));
      if(adminEditing&&adminToken){
       const quantity=h('small',{class:'wiki-loot-quantity wiki-edit-value',
        text:'×'+row.quantity,title:'Двойной клик — изменить количество'});
       quantity.ondblclick=e=>{e.preventDefault();editWikiValue(quantity,row.quantity,
        {type:'number',integer:true,min:1,max:999999,
         onCommit:n=>update('n',n)})};
       entry.append(quantity);
      }else if(row.quantity>1)entry.append(h('small',{class:'wiki-loot-quantity',text:'×'+row.quantity}));
      if(adminEditing&&adminToken){
       const chance=h('small',{class:'wiki-loot-chance wiki-edit-value',
        text:row.percent==null?'Шанс не указан':row.percent+'%',
        title:'Двойной клик — указать шанс выпадения'});
       chance.ondblclick=e=>{e.preventDefault();editWikiValue(chance,row.percent??0,
        {type:'number',min:0,max:100,
         onCommit:n=>update('p',n)})};
       entry.append(chance);
       entry.append(h('button',{type:'button',class:'wiki-owner-remove',
        text:'×','aria-label':'Удалить добычу '+dataName('item',row.itemId),
        onclick:()=>void saveWikiRelationRows('drop',id,{
         ...dropRows(),[row.group]:dropRows()[row.group].filter((_,ix)=>ix!==row.sourceIndex)})
         .catch(e=>showStudioToast(e.message,'warning'))}));
      }else if(row.percent!=null)entry.append(h('small',{class:'wiki-loot-chance',text:row.percent+'%'}));
      if(row.kind==='conditional')entry.append(h('small',{class:'wiki-loot-conditional',
       text:wt('Особый','Conditional')}));
      if(row.slotAdd>0)entry.append(h('small',{class:'wiki-loot-sockets',
       text:wt('Гнёзда +','Sockets +')+row.slotAdd}));
      flow.append(entry);
     }
     detail.append(flow);
    }else detail.append(h('p',{class:'wiki-empty-value',text:'—'}));
    if(adminEditing&&adminToken){
      const actions=h('div',{class:'wiki-owner-drop-actions'});
      for(const [group,label] of [['d','+ Обычная добыча'],['s','+ Особая добыча']]){
       actions.append(h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
        text:label,onclick:()=>wikiItemChoice(actions,i=>{
         const next=dropRows();
         if(next[group].length>=200)throw Error('Превышен лимит записей добычи');
         next[group].push({i,n:1,p:null});
         return saveWikiRelationRows('drop',id,next);
        })}));
      }
      detail.append(actions);
     }
   }else if(type==='npc'){
    const locations=rec.maps||[];
    if(rec.virtual){
     const fields=h('dl',{class:'item-fields'});
     const makeField=(label,field,value)=>{
      const dd=h('dd',{text:value||wt('Двойной клик — добавить','Double-click to add'),
       ...(adminEditing&&adminToken?{'data-owner-record':'npc:'+id,
        'data-owner-field':field,
        ...(!value?{'data-owner-empty':'true'}:{})}:{})});
      fields.append(h('dt',{text:label}),dd);
     };
     makeField(wt('Назначение','Service'),lang==='en'?'serviceEn':'service',
      (lang==='en'?rec.serviceEn||rec.service:rec.service)||'');
     if(rec.grid||adminEditing&&adminToken)
      makeField(wt('Координаты','Coordinates'),'grid',rec.grid||'');
     detail.append(fields);
     if(adminEditing&&adminToken){
      const geo=window.PandoraAstirLocations;
      const selector=h('select',{class:'wiki-inline-select wiki-town-npc-location',
       'aria-label':wt('Расположение NPC','NPC location')});
      for(const mapId of geo.districtIds){
       const option=h('option',{value:mapId,text:dataName('map',mapId)});
       option.selected=locations.includes(mapId);selector.append(option);
      }
      selector.onchange=()=>void saveWikiRecordField('npc',id,'maps',[selector.value]);
      detail.append(h('div',{class:'wiki-owner-town-location'},[
       h('small',{text:wt('Изменить местонахождение','Change location')}),selector]));
     }
    }
    if(adminEditing&&adminToken&&!rec.virtual)detail.append(wikiOwnerEntityList({
     label:wt('Где находится','Where to find'),kind:'map',existing:locations,
     onChange:next=>saveWikiRecordField('npc',id,'maps',next)}));
    else detail.append(linkFlow(locations.filter(mapId=>knownMaps[mapId]).map(mapId=>
     wikiLink('◈ '+dataName('map',mapId),'map',mapId,rec.virtual?null:id))));
    if(!rec.virtual){
    const ownerStock=wikiIndex.ownerNpcItems(id);
    if(ownerStock.length){
     detail.append(h('h4',{text:wt('Можно получить','Items available')}));
     detail.append(linkFlow(ownerStock.map(row=>
      itemLink(row.itemId,dataName('item',row.itemId),id))));
    }
    const recipes=wikiIndex.trades(id);
    detail.append(h('h4',{text:wt('Обмен · ','Trades · ')+recipes.length}));
    const recipeSearch=ownerPlainTextField({class:'wiki-inline-search wiki-owner-search',
     placeholder:wt('Найти предмет или материал…','Find an item or material…'),
     'aria-label':wt('Поиск среди обменов NPC','Search NPC trades')});
    const counter=h('small',{class:'wiki-result-counter'});
    const recipesBox=h('div',{class:'wiki-trade-list'}),cards=[];
    for(const trade of recipes){
     const entry=h('section',{class:'wiki-trade-card'+
      (wikiSelection.highlight===String(trade.i)?' highlighted':'')});
     const editing=adminEditing&&Boolean(adminToken);
     const amend=patch=>saveWikiTradeRecipe({...trade,...patch});
     const output=h('div',{class:'wiki-trade-output'});
      output.append(h('small',{text:wt('Получить','Receive')}));
      const product=h('span',{class:'wiki-trade-product-inline'});
      product.append(itemLink(trade.i,dataName('item',trade.i),id));
      if(editing)product.append(h('button',{type:'button',class:'wiki-owner-plus',
       text:'✎','aria-label':'Изменить предмет обмена',
       onclick:()=>wikiItemChoice(output,i=>amend({i}))}));
      output.append(product);
     entry.append(output);
     if(trade.mats?.length||editing){
      const mats=h('div',{class:'wiki-recipe-mats'});
      mats.append(h('small',{text:wt('Необходимые материалы','Required materials')}));
      for(const [index,material] of (trade.mats||[]).entries()){
       const row=h('span',{class:'wiki-owner-mat'});
       row.append(itemLink(material.i,dataName('item',material.i),trade.i));
       const quantity=h('span',{class:editing?'wiki-edit-value':'',
        text:' ×'+(material.n??1),title:editing?'Двойной клик — изменить количество':''});
       if(editing)quantity.ondblclick=e=>{
        e.preventDefault();
        editWikiValue(quantity,material.n,{type:'number',max:999999,integer:true,
         onCommit:n=>{
          if(n<1)throw Error('Количество должно быть больше нуля');
          return amend({mats:trade.mats.map((m,j)=>j===index?{...m,n}:m)});
         }});
       };
       row.append(quantity);
       if(editing)row.append(h('button',{type:'button',class:'wiki-owner-remove',
        text:'×','aria-label':'Убрать материал '+dataName('item',material.i),
        onclick:()=>void amend({mats:trade.mats.filter((_,j)=>j!==index)})
         .catch(e=>showStudioToast(e.message,'warning'))}));
       mats.append(row);
      }
      if(editing)mats.append(h('button',{type:'button',class:'wiki-owner-plus',
       text:'+ Материал',onclick:()=>wikiItemChoice(mats,i=>{
        if((trade.mats||[]).length>=20)throw Error('Можно добавить не более 20 материалов');
        return amend({mats:[...(trade.mats||[]),{i,n:1}]});
       })}));
      entry.append(mats);
     }
     const currencies=[[wt('Золото','Gold'),trade.gold,'gold'],
      [wt('Честь','Honor'),trade.honor,'honor'],[wt('Опыт','Experience'),trade.exp,'exp']]
      .filter(([,value])=>editing||Number(value)>0);
     if(currencies.length){
      const costs=h('div',{class:'wiki-trade-cost'});
      for(const [name,value,key] of currencies){
       const chip=h('span',{class:'wiki-trade-currency'});
       chip.append(h('span',{text:name+': '}));
       const figure=h('strong',{text:Number(value||0).toLocaleString('ru-RU'),
        class:editing?'wiki-edit-value':''});
       if(editing){
        figure.title='Двойной клик — изменить стоимость';
        figure.ondblclick=e=>{
         e.preventDefault();
         editWikiValue(figure,Number(value||0),{type:'number',integer:true,max:999999999,
          onCommit:n=>amend({[key]:n})});
        };
       }
       chip.append(figure);costs.append(chip);
      }
      entry.append(costs);
     }
     if(editing){
      const owner=h('div',{class:'wiki-trade-sellers'});
      owner.append(h('small',{text:'NPC обмена'}));
      for(const npcId of trade.npc||[]){
       const chip=h('span',{class:'wiki-owner-mat'},[
        wikiLink(dataName('npc',npcId),'npc',npcId,trade.i)]);
       if(trade.npc.length>1)chip.append(h('button',{type:'button',
        class:'wiki-owner-remove',text:'×',
        'aria-label':'Убрать NPC '+dataName('npc',npcId),
        onclick:()=>void amend({npc:trade.npc.filter(n=>n!==npcId)})
         .catch(e=>showStudioToast(e.message,'warning'))}));
       owner.append(chip);
      }
      const plus=h('button',{type:'button',class:'wiki-owner-plus',text:'+ NPC'});
      plus.onclick=()=>{
       if(owner.querySelector('select'))return;
       const pick=h('select',{class:'wiki-inline-select','aria-label':'Добавить NPC'});
       pick.append(h('option',{value:'',text:'Выбери NPC'}));
       for(const [key] of Object.entries(wikiData.trades.npcs||{}))
        if(!(trade.npc||[]).map(String).includes(key))
         pick.append(h('option',{value:key,text:dataName('npc',key)}));
       plus.replaceWith(pick);
       pick.onchange=()=>{if(pick.value)void amend({npc:[...trade.npc,Number(pick.value)]})
        .catch(e=>showStudioToast(e.message,'warning'))};
       pick.onblur=()=>{if(pick.isConnected)pick.replaceWith(plus)};
       pick.focus();
      };
      if(trade.npc.length<24)owner.append(plus);
      const remove=h('button',{type:'button',class:'wiki-trade-delete',
       text:'Удалить обмен','aria-label':'Удалить обмен NPC'});
      remove.onclick=()=>{
       if(remove.dataset.confirm!=='1'){
        remove.dataset.confirm='1';remove.textContent='Повторить, чтобы удалить';return;
       }
       void saveWikiTradeRecipe(trade,{deleted:true})
        .catch(e=>showStudioToast(e.message,'warning'));
      };
      owner.append(remove);entry.append(owner);
     }
     const searchText=wikiIndex.normalize([dataName('item',trade.i),
      ...(trade.mats||[]).map(m=>dataName('item',m.i))].join(' '));
     recipesBox.append(entry);cards.push({entry,searchText});
    }
    const filterRecipes=()=>{
     let visible=0;
     for(const card of cards){
      card.entry.hidden=!matchesWords(card.searchText,recipeSearch.value);
      if(!card.entry.hidden)visible++;
     }
     counter.textContent=lang==='en'?visible+' of '+cards.length:visible+' из '+cards.length;
    };
    guardEncyclopediaSearch(recipeSearch);
    recipeSearch.addEventListener('input',filterRecipes);
    detail.append(recipeSearch,counter,recipesBox);filterRecipes();
    if(adminEditing&&adminToken){
     const newTrade=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
      text:'+ Добавить обмен',title:'Создать новый обмен у этого NPC'});
     newTrade.onclick=()=>wikiItemChoice(detail,i=>{
      let next=null;
      for(let attempt=0;attempt<30;attempt++){
       const number=900000000+crypto.getRandomValues(new Uint32Array(1))[0];
       if(!(wikiData.trades.trades||[]).some(x=>x.id===number)&&
        !Object.hasOwn(override,'tradeedit.'+number)){next=number;break}
      }
      if(next===null)throw Error('Не удалось создать уникальный номер обмена');
      return saveWikiTradeRecipe({id:next,i,npc:[Number(id)],mats:[],
       gold:0,honor:0,exp:0});
     });
     detail.append(newTrade);
    }
    } // Non-server NPCs do not have trade recipes or editable server IDs.
  }else if(type==='map'||type==='instance'){
    const mapSections=type==='map'&&Array.isArray(rec.sections)?rec.sections:null;
    const showMapSection=key=>type!=='map'||!mapSections||mapSections.includes(key);
    const ownerMap=type==='map'&&adminEditing&&Boolean(adminToken)&&
     Boolean(wikiIndex.records('map')?.[String(id)]);
    if(type==='map'){
     const tags=Array.isArray(rec.tags)?rec.tags:[];
     if(showMapSection('tags')&&(tags.length||ownerMap)){
      const tagSection=h('section',{class:'wiki-map-section wiki-map-tag-section'});
      tagSection.append(h('h4',{text:wt('Теги локации','Location tags')}));
      const chips=h('div',{class:'wiki-map-tags'});
      for(const [i,tag]of tags.entries()){
       const chip=h('span',{class:'wiki-map-kind wiki-map-tag'});
       const label=h('span',{class:'wiki-map-tag-label',text:lang==='en'?tag.en:tag.ru});
       if(ownerMap){
        label.classList.add('wiki-honor-editable');label.tabIndex=0;
        const field=lang==='en'?'en':'ru';
        const start=()=>editWikiValue(label,tag[field],{type:'text',onCommit:value=>
         saveWikiRecordField('map',id,'tags',tags.map((x,n)=>n===i?{...x,[field]:value}:x))});
        label.addEventListener('dblclick',start);
        label.addEventListener('keydown',e=>{if(e.key==='F2'){e.preventDefault();start()}});
       }
       chip.append(label);
       if(ownerMap)chip.append(h('button',{type:'button',class:'wiki-owner-remove',
        text:'×','aria-label':wt('Удалить тег','Remove tag')+' '+tag.ru,
        onclick:()=>void saveWikiRecordField('map',id,'tags',tags.filter((_,n)=>n!==i))
         .catch(e=>showStudioToast(e.message,'warning'))}));
       chips.append(chip);
      }
      tagSection.append(chips);
      if(ownerMap){
       const add=h('button',{type:'button',class:'wiki-owner-plus',
        text:wt('+ Тег','+ Tag')});
       add.onclick=()=>{
        if(tagSection.querySelector('.wiki-map-tag-form'))return;
        const form=h('div',{class:'wiki-map-tag-form wiki-owner-source-picker'});
        const ru=ownerPlainTextField({class:'wiki-inline-input',
         placeholder:'Тег · RU','aria-label':'Тег на русском'});
        const en=ownerPlainTextField({class:'wiki-inline-input',
         placeholder:'Tag · EN','aria-label':'Tag in English'});
        const message=h('small',{class:'inline-owner-error'});
        const submit=h('button',{type:'button',class:'wiki-owner-plus',
         text:wt('Добавить','Add'),onclick:async()=>{
          const tag={ru:ru.value.trim(),en:en.value.trim()};
          if(!tag.ru||!tag.en||tag.ru.length>70||tag.en.length>70){
           message.textContent=wt('Введи RU и EN','Enter RU and EN');return}
          try{await saveWikiRecordField('map',id,'tags',[...tags,tag])}
          catch(e){message.textContent=e.message}
         }});
        form.append(ru,en,submit,h('button',{type:'button',class:'wiki-owner-remove',
         text:wt('Отмена','Cancel'),onclick:()=>form.remove()}),message);
        add.after(form);ru.focus();
       };
       tagSection.append(add);
      }
      detail.append(tagSection);
     }
     if(ownerMap){
      const sectionDefs=[
       ['monsters',wt('Монстры','Monsters')],['npcs','NPC'],
       ['loot',wt('Добыча','Loot')],['tags',wt('Теги','Tags')],
       ['notes',wt('Заметки','Notes')],['custom',wt('Свои разделы','Custom sections')]];
      const enabled=Array.isArray(rec.sections)?rec.sections:sectionDefs.map(x=>x[0]);
      const manage=h('div',{class:'wiki-map-section-controls'});
      manage.append(h('small',{text:wt('Разделы локации','Location sections')}));
      const buttons=h('div',{class:'wiki-map-section-switches'});
      for(const [key,label]of sectionDefs){
       const on=enabled.includes(key);
       buttons.append(h('button',{type:'button',class:on?'chosen':'',
        'aria-pressed':String(on),text:(on?'✓ ':'+ ')+label,
        onclick:()=>void saveWikiRecordField('map',id,'sections',
         on?enabled.filter(x=>x!==key):[...enabled,key])
         .catch(e=>showStudioToast(e.message,'warning'))}));
      }
      manage.append(buttons);detail.append(manage);
     }
    }
    if(type==='map'&&showMapSection('notes')){
     const key=lang==='en'?'notesEn':'notesRu';
     const copy=String(rec[key]||'');
     if(copy||ownerMap){
      const section=h('section',{class:'wiki-map-section wiki-map-notes'});
      section.append(h('h4',{text:wt('Заметки о локации','Location notes')}));
      const text=h('p',{class:'wiki-description'+(!copy?' wiki-description-placeholder':''),
       text:copy||wt('Двойной клик — добавить заметку','Double-click to add a note')});
      if(ownerMap){
       text.classList.add('wiki-honor-editable');text.tabIndex=0;
       const open=()=>editWikiValue(text,copy,{type:'textarea',
        onCommit:value=>saveWikiRecordField('map',id,key,value)});
       text.addEventListener('dblclick',open);
       text.addEventListener('keydown',event=>{
        if(event.key==='F2'){event.preventDefault();open()}
       });
      }
      section.append(text);detail.append(section);
     }
    }
    if(type==='instance'&&rec.kind==='quest')detail.append(h('span',{
     class:'wiki-instance-kind',text:wt('Сценарий задания','Quest scenario')
    }));
    const description=type==='instance'&&lang!=='en'?
     (rec.blurbRu||null):rec.blurb;
    if(description||(type==='instance'&&adminEditing&&adminToken&&lang==='ru')){
     const editable=type==='instance'&&adminEditing&&adminToken&&lang==='ru';
     detail.append(h('p',{
      class:'wiki-description'+(!description?' wiki-description-placeholder':''),
      text:description||'Двойной клик — добавить описание',
      ...(editable?{'data-owner-record':'instance:'+id,
       'data-owner-field':'blurbRu',
       ...(!description?{'data-owner-empty':'true'}:{})}:{})
     }));
    }
    const mobs=rec.mobs||[];
     if(type==='map'&&adminEditing&&adminToken&&!rec.virtual&&
      !Object.hasOwn(wikiData.maps||{},id))
      detail.append(h('p',{class:'wiki-owner-map-note',text:
       'Место известно по расположению NPC, но отсутствует в каталоге карт с монстрами. Добавление здесь недоступно.'}));
     if(showMapSection('monsters')&&adminEditing&&adminToken&&(type==='instance'||ownerMap)){
      detail.append(wikiOwnerEntityList({label:'Монстры в '+(type==='instance'?'подземелье':'локации'),
      kind:'monster',existing:mobs,onChange:async next=>{
       if(type==='map'&&(rec.virtual||!Object.hasOwn(wikiData.maps||{},id))){
        await saveWikiRecordField('map',id,'mobs',next.map(Number));return;
       }
       const before=mobs.map(String),after=next.map(String);
       const added=after.find(x=>!before.includes(x));
       const removed=before.find(x=>!after.includes(x));
       if(added)await saveWikiSpawns(added,type,id,true);
       else if(removed)await saveWikiSpawns(removed,type,id,false);
      }}));
    }
    // Planned maps share the identical searchable monster grid. Owner reports
    // preserve names/levels even when no server-catalog cross-reference exists.
    if(showMapSection('monsters')){
     const reports=type==='map'&&Array.isArray(rec.roster||rec.reportedSpawns)?mapRoster(rec):null;
     const roster=reports?[
      ...reports.map(x=>({id:x.monsterId,
       mon:x.monsterId==null?null:wikiData.monsters?.[String(x.monsterId)],reported:x})),
      ...mobs.filter(mob=>!reports.some(x=>String(x.monsterId)===String(mob)))
       .map(mob=>({id:mob,mon:wikiData.monsters?.[String(mob)]}))
     ]:mobs.map(mob=>({id:mob,mon:wikiData.monsters?.[mob]}));
     if(roster.length){
      const levels=roster.map(row=>row.reported?.level??row.mon?.level).filter(Number.isFinite);
      const levelRange=levels.length?' · '+wt('ур. ','Lv. ')+Math.min(...levels)+
       (Math.max(...levels)!==Math.min(...levels)?'–'+Math.max(...levels):''):'';
      detail.append(h('h4',{text:wt('Монстры · ','Monsters · ')+roster.length+levelRange}));
       const search=ownerPlainTextField({class:'wiki-inline-search wiki-owner-search',
       placeholder:wt('Поиск монстра…','Search monsters…'),
       'aria-label':wt('Поиск монстра в локации','Search monsters in location'),
       name:'monster-roster-filter',autocomplete:'off','data-lpignore':'true',
       'data-1p-ignore':'true'});
      guardEncyclopediaSearch(search);
      const list=h('div',{class:'wiki-map-monsters'}),rows=[];
      for(const {id:mob,mon,reported} of roster.sort((a,b)=>
       (a.reported?.level??a.mon?.level??999)-(b.reported?.level??b.mon?.level??999))){
       const name=lang==='en'&&reported?.nameEn?reported.nameEn:
        reported?.name||(mob!=null?dataName('monster',mob):'');
       const entry=h('div',{class:'wiki-entry wiki-mob-row'+
        (wikiSelection.highlight===String(mob)?' highlighted':'')});
       const label=mob!=null&&mon?wikiLink(name,'monster',mob):
        h('span',{class:'wiki-map-monster-name',text:name});
       entry.append(label);
       if(reported&&adminEditing&&adminToken){
        const updateRow=(field,value)=>saveWikiRecordField('map',id,'roster',
         reports.map(row=>row.id===reported.id?{...row,[field]:value}:row));
        const editableName=h('span',{class:'wiki-map-reported-name wiki-edit-value',
         text:wt('✎ Название','✎ Name'),title:wt('Двойной клик — исправить название монстра',
          'Double-click to correct monster name')});
        editableName.ondblclick=event=>{event.preventDefault();event.stopPropagation();
         const field=lang==='en'?'nameEn':'name';
         editWikiValue(editableName,reported[field]||reported.name,
          {type:'text',onCommit:value=>updateRow(field,value)})};
        entry.append(editableName);
       }
       const extra=[];
       if(reported?.level!=null||mon?.level!=null)
        extra.push(wt('Ур. ','Lv. ')+(reported?.level??mon.level));
       if(Number.isFinite(mon?.life))extra.push(wt('ОЗ ','HP ')+
        Number(mon.life).toLocaleString(lang==='en'?'en-US':'ru-RU'));
       if(mob!=null&&mon){
        const drops=wikiIndex.drops(mob);
        if(drops.length)extra.push(wt('Добыча: ','Loot: ')+drops.length);
       }
       if(extra.length){
        const meta=h('small',{class:'wiki-map-mob-meta',text:extra.join(' · ')});
        if(reported&&adminEditing&&adminToken){
         meta.classList.add('wiki-edit-value');
         meta.title=wt('Двойной клик — изменить уровень','Double-click to edit level');
         meta.ondblclick=event=>{event.preventDefault();event.stopPropagation();
          editWikiValue(meta,reported.level,{type:'number',integer:true,min:1,max:255,
           onCommit:value=>saveWikiRecordField('map',id,'roster',
            reports.map(row=>row.id===reported.id?{...row,level:value}:row))})};
        }
        entry.append(meta);
       }
       if(reported?.spawn==='anywhere')entry.append(h('small',{
        text:wt('Может появиться в любой точке','May spawn anywhere')}));
       else if(reported?.spawn==='boss-guard')entry.append(h('small',{
        text:wt('Страж вожака · при особых условиях','Boss guard · conditional spawn')}));
       if(reported&&adminEditing&&adminToken){
        const actions=h('div',{class:'wiki-map-roster-actions'});
        const choose=h('button',{type:'button',class:'wiki-owner-plus',
         text:mob==null?wt('Связать с карточкой','Link monster card'):
          wt('Изменить карточку','Change linked card')});
        choose.onclick=()=>{
         if(actions.querySelector('.wiki-owner-relation-picker'))return;
         const picker=h('div',{class:'wiki-owner-source-picker wiki-owner-relation-picker'});
         const input=ownerPlainTextField({class:'wiki-inline-input',
          placeholder:wt('Поиск монстра…','Search monsters…'),
          'aria-label':wt('Поиск карточки монстра','Find monster card')});
         const selector=h('select',{class:'wiki-inline-select',
          'aria-label':wt('Выбрать монстра','Choose monster')});
         const message=h('small',{class:'inline-owner-error',role:'status'});
         const fill=()=>{
          const query=wikiIndex.normalize(input.value);
          const choices=Object.entries(wikiIndex.records('monster')||{})
           .filter(([key,record])=>(!query||
            wikiIndex.normalize([record.name,record.nameEn].filter(Boolean).join(' '))
             .includes(query))).slice(0,100);
          selector.replaceChildren(h('option',{value:'',
           text:wt('Выбери монстра','Select monster')}));
          for(const [key]of choices)
           selector.append(h('option',{value:key,text:dataName('monster',key)}));
         };
         input.oninput=fill;
         selector.onchange=async()=>{
          if(!selector.value)return;
          selector.disabled=true;
          try{await persistRosterLink(id,reported.id,
           /^[1-9][0-9]{0,14}$/.test(selector.value)?Number(selector.value):selector.value)}
          catch(error){message.textContent=error.message;selector.disabled=false}
         };
         picker.append(input,selector,message,h('button',{type:'button',
          class:'wiki-owner-remove',text:wt('Отмена','Cancel'),
          onclick:()=>picker.remove()}));
         choose.after(picker);fill();input.focus();
        };
        actions.append(choose);
        if(mob!=null)actions.append(h('button',{type:'button',
         class:'wiki-owner-remove',text:wt('Отвязать','Unlink'),
         onclick:()=>void persistRosterLink(id,reported.id,null)
          .catch(error=>showStudioToast(error.message,'warning'))}));
        const create=h('button',{type:'button',class:'wiki-owner-plus',
         text:wt('+ Создать карточку','+ Create card')});
        create.onclick=()=>createOwnerMonster(create,{mapId:id,spawnId:reported.id,
         name:reported.name,level:reported.level});
        actions.append(create);entry.append(actions);
       }
       list.append(entry);rows.push({entry,name:wikiIndex.normalize(name)});
      }
      search.addEventListener('input',()=>{
       for(const row of rows)row.entry.hidden=!matchesWords(row.name,search.value);
      });
      detail.append(search,list);
     }
    }
    if(type==='map'&&showMapSection('npcs')){
      const residents=wikiIndex.residents(id);
      if(ownerMap&&rec.virtual&&rec.placeType!=='astir-district'){
       detail.append(wikiOwnerEntityList({label:wt('NPC в локации','NPCs in this location'),
        kind:'npc',existing:rec.npcs||[],limit:120,
        onChange:next=>saveWikiRecordField('map',id,'npcs',next.map(Number))}));
      }else if(adminEditing&&adminToken&&!rec.virtual){
       detail.append(wikiOwnerEntityList({label:wt('NPC в локации','NPCs in this location'),
        kind:'npc',existing:residents.map(([npcId])=>String(npcId)),onChange:async next=>{
         const before=residents.map(([npcId])=>String(npcId)),after=next.map(String);
         const added=after.find(n=>!before.includes(n));
         const removed=before.find(n=>!after.includes(n));
         const npcId=added||removed;
         if(!npcId)return;
         const current=wikiData.trades?.npcs?.[npcId];
         if(!current)throw Error('NPC не найден в каталоге');
         const maps=(current.maps||[]).map(String);
         const updated=added?[...new Set([...maps,String(id)])]:maps.filter(x=>x!==String(id));
         await saveWikiRecordField('npc',npcId,'maps',updated.map(Number));
        }}));
      }else if(residents.length){
       detail.append(h('h4',{text:wt('NPC в локации','NPCs in this location')+' · '+residents.length}));
       const list=h('div',{class:'wiki-map-npcs'});
       for(const [npcId,npc] of residents){
        const entry=h('div',{class:'wiki-map-npc'});
        entry.append(wikiLink('♙ '+dataName('npc',npcId),'npc',npcId));
        const meta=[npc.grid,npc.service].filter(Boolean);
        if(meta.length)entry.append(h('small',{text:meta.join(' · ')}));
        list.append(entry);
       }
       detail.append(list);
      }else if(rec.virtual){
       detail.append(h('p',{class:'muted',
        text:wt('Подтверждённых сведений о NPC пока нет.',
         'No verified NPC data available yet.')}));
      }
      if(rec.placeType==='astir-district'&&rec.virtual&&adminEditing&&adminToken){
       const add=h('button',{type:'button',class:'wiki-owner-plus',
        text:wt('+ Добавить NPC','+ Add NPC')});
       add.onclick=()=>{
        const controls=h('div',{class:'wiki-town-npc-create'});
        const field=(label,max=240)=>{
         const input=ownerPlainTextField({class:'wiki-inline-input',
          'aria-label':label,placeholder:label});
         input.setAttribute('data-max',String(max));
         const row=h('label',{},[h('small',{text:label}),input]);controls.append(row);return input;
        };
        const ru=field('Имя NPC · RU'),en=field('NPC name · EN'),
         role=field(wt('Назначение','Service'));
        const error=h('small',{class:'inline-owner-error',role:'status'});
        const save=h('button',{type:'button',class:'wiki-owner-plus',
         text:wt('Сохранить NPC','Save NPC')});
        save.onclick=async()=>{
         const name=ru.value.trim(),english=en.value.trim(),service=role.value.trim();
         if(!name||name.length>240||english.length>240||service.length>240){
          error.textContent='Укажи корректное имя NPC';return;
         }
         const city=String(id).slice(6);
         let index=1,identifier;
         do{
          identifier='astir-npc-'+city+'-custom-'+index++;
         }while(wikiIndex.records('npc')[identifier]||
          Object.hasOwn(override,'wikiedit.npc.'+identifier));
         const patch={name,maps:[String(id)]};
         if(english)patch.nameEn=english;
         if(service)patch.service=service;
         save.disabled=true;
         try{await saveWikiRecordPatch('npc',identifier,patch)}
         catch(e){error.textContent=String(e.message||e);save.disabled=false}
        };
        controls.append(error,save);
        add.replaceWith(controls);
       };
       detail.append(add);
      }
    }
    if(type==='map'&&showMapSection('loot')){
     const loot=Array.isArray(rec.loot)?rec.loot:[];
     if(ownerMap){
      detail.append(wikiOwnerEntityList({label:wt('Добыча в локации','Location loot'),
       kind:'item',existing:loot,limit:120,
       onChange:next=>saveWikiRecordField('map',id,'loot',next.map(Number))}));
     }else if(loot.length){
      detail.append(h('h4',{text:wt('Добыча в локации','Location loot')}));
      detail.append(linkFlow(loot.filter(x=>wikiData.items?.[String(x)]).map(x=>
       itemLink(x,dataName('item',x),id))));
     }
     const dropZones=wikiIndex.zones(id);
     if(dropZones.length){
      if(!ownerMap&&!loot.length)
       detail.append(h('h4',{text:wt('Добыча в локации','Location loot')}));
      for(const zone of dropZones)for(const group of zone.rows||[]){
       const block=h('section',{class:'wiki-zone-group'});
       if(group.mob!=null&&wikiData.monsters?.[group.mob])
        block.append(wikiLink(dataName('monster',group.mob),'monster',group.mob));
       if(group.base!=null)block.append(h('small',{text:
        'Шанс группы добычи: '+group.base+'%. Шанс отдельной вещи не указан.'}));
       for(const reward of group.items||[])
        if(reward.i!=null)block.append(itemLink(reward.i,
         dataName('item',reward.i)+(reward.n&&reward.n!==1?' ×'+reward.n:''),id));
       detail.append(block);
      }
     }
    }
    if(type==='map'&&showMapSection('custom')){
     const custom=Array.isArray(rec.extraSections)?rec.extraSections:[];
     for(const [index,group] of custom.entries()){
      const panel=h('section',{class:'wiki-map-section wiki-map-extra-section'});
      const head=h('h4',{text:lang==='en'?group.titleEn:group.titleRu});
      if(ownerMap){
       head.classList.add('wiki-honor-editable');head.tabIndex=0;
       const key=lang==='en'?'titleEn':'titleRu';
       const start=()=>editWikiValue(head,group[key],{type:'text',onCommit:value=>
        saveWikiRecordField('map',id,'extraSections',custom.map((entry,i)=>
         i===index?{...entry,[key]:value}:entry))});
       head.addEventListener('dblclick',start);
       head.addEventListener('keydown',e=>{if(e.key==='F2'){e.preventDefault();start()}});
      }
      panel.append(head);
      if(ownerMap)panel.append(h('button',{type:'button',class:'wiki-owner-remove wiki-map-section-delete',
       text:wt('Удалить раздел','Remove section'),
       onclick:()=>void saveWikiRecordField('map',id,'extraSections',
        custom.filter((_,i)=>i!==index)).catch(e=>showStudioToast(e.message,'warning'))}));
      if(group.kind==='text'){
       const key=lang==='en'?'textEn':'textRu';
       const note=group[key]||'';
       const text=h('p',{class:'wiki-description'+(!note?' wiki-description-placeholder':''),
        text:note||wt('Двойной клик — добавить текст','Double-click to add text')});
       if(ownerMap){
        text.classList.add('wiki-honor-editable');text.tabIndex=0;
        const start=()=>editWikiValue(text,note,{type:'textarea',onCommit:value=>
         saveWikiRecordField('map',id,'extraSections',custom.map((entry,i)=>
          i===index?{...entry,[key]:value}:entry))});
        text.addEventListener('dblclick',start);
        text.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();start()}});
       }
       panel.append(text);
      }else{
       const kind=group.kind==='item'?'item':group.kind;
       if(ownerMap)panel.append(wikiOwnerEntityList({
        label:'',kind,existing:group.entries||[],limit:60,
        onChange:next=>saveWikiRecordField('map',id,'extraSections',
         custom.map((entry,i)=>i===index?{...entry,entries:next.map(Number)}:entry))
       }));
       else panel.append(linkFlow((group.entries||[])
        .filter(item=>kind==='item'?wikiData.items?.[String(item)]:
         kind==='monster'?wikiData.monsters?.[String(item)]:wikiData.trades?.npcs?.[String(item)])
        .map(item=>kind==='item'?itemLink(item,dataName('item',item),id):
         wikiLink(dataName(kind,item),kind,item))));
      }
      detail.append(panel);
     }
     if(ownerMap&&custom.length<12){
      const add=h('button',{type:'button',class:'wiki-owner-plus wiki-map-add-section',
       text:wt('+ Добавить раздел','+ Add section')});
      add.onclick=()=>{
       if(detail.querySelector('.wiki-map-custom-form'))return;
       const form=h('div',{class:'wiki-map-custom-form wiki-owner-source-picker'});
       const ru=ownerPlainTextField({class:'wiki-inline-input',
        placeholder:'Название раздела · RU','aria-label':'Название раздела RU'});
       const en=ownerPlainTextField({class:'wiki-inline-input',
        placeholder:'Section title · EN','aria-label':'Section title EN'});
       const kind=h('select',{class:'wiki-inline-select','aria-label':wt('Содержимое раздела','Section content')});
       for(const [value,label]of [
        ['text',wt('Описание','Text')],
        ['monster',wt('Монстры','Monsters')],
        ['npc','NPC'],['item',wt('Предметы / добыча','Items / loot')]
       ])kind.append(h('option',{value,text:label}));
       const error=h('small',{class:'inline-owner-error',role:'status'});
       const submit=h('button',{type:'button',class:'wiki-owner-plus',
        text:wt('Добавить','Add'),onclick:async()=>{
         const titleRu=ru.value.trim(),titleEn=en.value.trim();
         if(!titleRu||!titleEn||titleRu.length>100||titleEn.length>100){
          error.textContent=wt('Укажи названия RU и EN','Enter RU and EN titles');return}
         const nextId='section-'+[...crypto.getRandomValues(new Uint8Array(6))]
          .map(x=>x.toString(16).padStart(2,'0')).join('');
         const row={id:nextId,titleRu,titleEn,kind:kind.value,entries:[]};
         submit.disabled=true;
         try{await saveWikiRecordField('map',id,'extraSections',[...custom,row])}
         catch(e){error.textContent=e.message;submit.disabled=false}
        }});
       const cancel=h('button',{type:'button',class:'wiki-owner-remove',
        text:wt('Отмена','Cancel'),onclick:()=>form.remove()});
       form.append(ru,en,kind,submit,cancel,error);add.after(form);ru.focus();
      };
      detail.append(add);
     }
    }
  }else{
    const namedPlaces=wikiIndex.chestPlaces(id);
    if(namedPlaces.length)detail.append(h('div',{class:'wiki-chest-location'},[
     h('small',{text:wt('Связанная местность по названию сундука','Place named in the chest title')}),
     linkFlow(namedPlaces.map(mapId=>wikiLink('◈ '+dataName('map',mapId),'map',mapId,id)))
    ]));
    const groups=rec.rolls||[];
    const mapChest=rec.key!=null;
    if(mapChest){
     const notice=h('section',{class:'wiki-chest-opening',role:'note'});
     notice.append(h('strong',{text:wt('Как открыть сундук','How to open this chest')}));
     const info=h('div',{class:'wiki-chest-opening-fields'});
     const required=h('div',{class:'wiki-chest-opening-field'},[
      h('small',{text:wt('Необходимый ключ','Required key')})
     ]);
     if(wikiData.items?.[rec.key])required.append(itemLink(rec.key,dataName('item',rec.key),id));
     else required.append(h('span',{text:wt('Не указан','Not listed')}));
     const master=h('div',{class:'wiki-chest-opening-field'},[
      h('small',{text:wt('Мастер сундуков','Chest master')})
     ]);
     const masterNpcId='astir-npc-kingdom-claris';
     const line=h('div',{class:'wiki-chest-master-row'});
     line.append(wikiLink(dataName('npc',masterNpcId),'npc',masterNpcId),
      wikiLink(dataName('map','astir-kingdom'),'map','astir-kingdom'));
     master.append(line);
     info.append(required,master);notice.append(info);
     detail.append(notice);
    }
    const changeChest=next=>saveWikiRelationRows('chest',id,next);
    detail.append(h('h4',{text:wt('Содержимое сундука','Chest contents')}));
    if(!groups.length){
     const colored={
      '51038':wt('Оружие и доспехи','Weapons and armor'),
      '51040':wt('Аксессуары','Accessories'),
      '51042':wt('Души','Souls')
     };
     const category=colored[String(id)];
     if(category)detail.append(h('div',{class:'wiki-chest-unverified'},[
      h('strong',{text:wt('Указанная категория наград: ','Listed reward category: ')+category}),
      h('p',{text:wt('Точный список предметов и шансы открытия пока не опубликованы в доступной таблице игрового сервера. Это не означает, что сундук пустой.',
       'The accessible server data does not publish the exact items or opening probabilities. This does not mean the chest is empty.')})
     ]));
     else detail.append(h('p',{class:'muted',text:wt(
      'Состав наград пока не указан в игровом каталоге.',
      'Reward contents are not yet specified in the game catalog.'
     )}));
    }
    const gallery=h('div',{class:'wiki-chest-groups wiki-chest-flat'});
    for(const [i,group]of groups.entries()){
     const heading=h('summary',{class:'wiki-chest-group-summary'},[
      h('span',{class:'wiki-chest-group-mark','aria-hidden':'true',text:String(i+1)}),
      h('span',{class:'wiki-chest-group-name',text:wt('Группа ','Group ')+(i+1)}),
      h('small',{text:group.length===1?wt('1 предмет','1 item'):
       group.length+' '+wt('вариантов','options')}),
      h('span',{class:'wiki-chest-chevron','aria-hidden':'true',text:'⌄'})
     ]);
     const options=h('div',{class:'wiki-chest-options'});
     for(const [rowIndex,row] of group.entries()){
      const option=h('div',{class:'wiki-chest-reward'+
       (wikiSelection.highlight===String(row.i)?' highlighted':'')});
      option.append(itemLink(row.i,dataName('item',row.i),id));
      if(adminEditing&&adminToken){
       const quantity=h('span',{class:'wiki-reward-quantity wiki-edit-value',
        text:'×'+(row.n??1),title:'Двойной клик — изменить количество'});
       quantity.ondblclick=e=>{e.preventDefault();
        editWikiValue(quantity,row.n??1,{type:'number',min:1,max:999999,integer:true,
         onCommit:n=>changeChest(groups.map((g,gi)=>gi!==i?g:
          g.map((r,ri)=>ri===rowIndex?{...r,n}:r)))});
       };
       option.append(quantity);
      }else if(row.n!=null&&row.n!==1)option.append(h('span',{class:'wiki-reward-quantity',
       text:'×'+row.n}));
      if(row.plus!=null&&row.plus>0)option.append(h('small',{class:'wiki-reward-enhance',
       text:'+'+row.plus}));
      if(row.soul!=null&&row.soul>0)option.append(h('small',{class:'wiki-reward-enhance',
       text:wt('Душ: ','Souls: ')+row.soul}));
      if(adminEditing&&adminToken){
       const chance=h('small',{class:'wiki-reward-percent wiki-edit-value',
        title:'Двойной клик — изменить вероятность внутри группы',
        text:row.p==null?'Шанс не указан':row.p+'%'});
       chance.ondblclick=e=>{e.preventDefault();
        editWikiValue(chance,row.p??0,{type:'number',min:0,max:100,
         onCommit:n=>changeChest(groups.map((g,gi)=>gi!==i?g:
          g.map((r,ri)=>ri===rowIndex?{...r,p:n}:r)))});
       };
       option.append(chance);
       option.append(h('button',{type:'button',class:'wiki-owner-remove',
        text:'×','aria-label':'Удалить предмет из сундука',
        onclick:()=>void changeChest(groups.map((g,gi)=>gi!==i?g:
         g.filter((_,ri)=>ri!==rowIndex)))
         .catch(e=>showStudioToast(e.message,'warning'))}));
      }else if(row.p!=null)option.append(h('small',{class:'wiki-reward-percent'+
       (row.p===100?' certain':''),title:wt('Вероятность внутри группы','Probability within group'),
       text:row.p+'%'}));
      options.append(option);
     }
     if(adminEditing&&adminToken){
      options.append(h('button',{type:'button',class:'wiki-owner-plus',
       text:'+ Предмет',onclick:()=>wikiItemChoice(options,itemId=>
        changeChest(groups.map((g,gi)=>gi!==i?g:[...g,{i:itemId,n:1,p:null}])))}));
      options.append(h('button',{type:'button',class:'wiki-trade-delete',
       text:'Удалить группу',onclick:()=>void changeChest(groups.filter((_,gi)=>gi!==i))
        .catch(e=>showStudioToast(e.message,'warning'))}));
     }
     const section=h('details',{class:'wiki-chest-group'},[heading,options]);
     section.open=true;
     gallery.append(section);
    }
    detail.append(gallery);
    if(adminEditing&&adminToken)detail.append(h('button',{type:'button',
     class:'wiki-owner-plus wiki-add-source',text:'+ Предмет',
     onclick:()=>wikiItemChoice(detail,itemId=>{
      const row={i:itemId,n:1,p:null};
       if(!groups.length)return changeChest([[row]]);
       if(groups[0].length>=100)throw Error('Первый розыгрыш заполнен');
       return changeChest(groups.map((group,index)=>index===0?[...group,row]:group));
     })}));
  }
  if(detailOnly)detail.scrollTop=previousDetailScroll;
 };
 wikiRenderSelected=()=>{
  if(!root.isConnected||!wikiIndex)return;
  const present=[...browse.querySelectorAll('[data-wiki-record]')].some(
   row=>row.getAttribute('data-wiki-record')===wikiSelection.id);
  draw(present);
 };
 search.addEventListener('input',()=>{wikiSearch=search.value;wikiShown=100;wikiSelection={...wikiSelection,id:null,highlight:null};browse.scrollTop=0;if(wikiIndex)draw()});
 if(wikiIndex)draw();
 else{
  browse.append(h('p',{class:'muted',text:wt('Загружаю записи…','Loading entries…')}));
  loadWiki().then(()=>{if(root.isConnected&&activeTab==='wiki')draw()}).catch(e=>{
   if(!root.isConnected)return;
   browse.replaceChildren();
   detail.replaceChildren(h('p',{class:'item-incompatible',text:wt('Данные вики недоступны: ','Encyclopedia unavailable: ')+e.message}));
  });
 }
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
    if(key==="name"){state.name=input.value}
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
      onclick:()=>{state.racialPassiveId=id;persist();renderOriginPassives();
       renderOriginVitals();if(stageAttributesPage)renderStageAttributes();renderDetails()}});
    const src=skillIcon('race',id,skill);
    const image=src?h('img',{src,alt:'',loading:'lazy'}):
     h('span',{text:'✦',class:'skill-fallback'});
    if(src)image.onerror=()=>image.replaceWith(h('span',{text:'✦',class:'skill-fallback'}));
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
 root.append(h('p',{class:'muted',text:lang==='en'?
  'View skills and their requirements in Hero Path.':'Просматривайте умения и требования в «Пути героя».'}));
 root.append(h('button',{class:'button-action',text:lang==='en'?'Open skills':'Открыть умения',onclick:()=>{
  closeWorkbench();heroPathPage='skills';renderPathPages();saveView();
 }}));
}
function itemName(r){return window.PandoraItemPresentation.displayName(
 r,lang==='en'?'Unnamed item':'Предмет без названия',lang)}
function renderStats(root){
 const icons=['♥','⚔','➶','✥','✦','❂'];
 const overview=h('div',{class:'stat-editor-overview'}),header=h('h3',{text:'Характеристики'});
 const points=h('div',{class:'stat-total'},[h('strong',{text:'—'}),h('span',{text:'Свободные очки'})]);
 overview.append(header,points);root.append(overview);
 const grid=h('div',{class:'stat-grid'}),controls=[];
 function refresh(){
  const s=attributeSnapshot();
  points.querySelector('strong').textContent=s?String(s.remaining):'—';
  points.querySelector('span').textContent=s?'Свободно из '+s.total:'Свободные очки';
  overview.classList.toggle('over-budget',!!s?.overBudget);
  for(const v of controls){
   const invested=Number(state.stats[STATS[v.i]]||0),base=s?.base[v.i];
   v.note.textContent=base===undefined?'':'База '+base+' + '+invested;
   const estimate=previewBaseStats(),code=ORIGIN_STAT_LABELS[v.i].code;
   v.total.textContent=base===undefined?'—':String(estimate?.stats?.[code]??(base+invested));
   v.range.value=String((base??0)+invested);v.exact.value=String((base??0)+invested);
   v.range.min=String(base??0);v.exact.min=String(base??0);
   v.range.max=String(s?.max[v.i]??99);v.exact.max=String(s?.max[v.i]??99);
   v.fill.style.width=s&&s.max[v.i]>0?Math.min(100,(base+invested)/s.max[v.i]*100)+'%':'0%';
   v.minus.disabled=!s||invested===0;
   v.plus.disabled=!window.PandoraAttributeProgression.allowed(s,v.i,invested+1);
   v.range.disabled=!s;v.exact.disabled=!s;
   v.plus.setAttribute('aria-label','Увеличить '+ORIGIN_STAT_LABELS[v.i].name+'. Стоимость: '+(window.PandoraAttributeProgression.nextCost(s,v.i)??'максимум'));
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
  const range=h('input',{type:'range',min:'0',max:'99',step:'1',value:'0',
   'aria-label':info.name+' — вложено'});
  const exact=h('input',{type:'number',min:'0',max:'99',step:'1',value:'0',
   'aria-label':'Точное значение '+info.name});
  const change=value=>{
   const snap=attributeSnapshot(),absolute=window.PandoraAttributeProgression.resolveAbsolute(snap,i,value);
   if(absolute===null||!setAttributePoints(i,absolute-snap.base[i])){refresh();return}
   refresh();renderOriginStats();
  };
  const minus=h('button',{type:'button',text:'−',onclick:()=>change((attributeSnapshot()?.values[i]??0)-1)});
  const plus=h('button',{type:'button',text:'+',onclick:()=>change((attributeSnapshot()?.values[i]??0)+1)});
  range.addEventListener('input',()=>change(range.value));
  exact.addEventListener('change',()=>change(exact.value));
  card.append(head,note,total,bar,h('div',{class:'stat-visual-controls'},[minus,range,plus,exact]));
  controls.push({i,note,total,range,exact,fill,minus,plus});grid.append(card);
 });
 root.append(grid);refresh();
}
function compareSnapshots(a,b){
 const rows=[];const lib=window.PandoraEquipmentPlan;
 const label=(ru,en)=>lang==='en'?en:ru;
 const name=(selected,kind)=>window.PandoraBuildComparison.savedItemName(selected,
  kind==='soul'?catalog.souls:catalog.equipment,{lang,kind});
 if(a.race!==b.race)
  rows.push(label('Раса','Race')+': '+(races[a.race]?.[lang==='en'?1:0]||'?')+
   ' → '+(races[b.race]?.[lang==='en'?1:0]||'?'));
 if(a.job!==b.job)
  rows.push(label('Профессия','Class')+': '+(jobs[a.job]||'?')+' → '+(jobs[b.job]||'?'));
 if(a.level!==b.level)
  rows.push(label('Уровень','Level')+': '+(a.level??'?')+' → '+(b.level??'?'));
 for(const branch of branches){const p=a.points?.[branch.id]||0,q=b.points?.[branch.id]||0;if(p!==q)rows.push((catalog.meta?.branchLabels?.[branch.id]||branch.name)+': '+p+' → '+q)}
 for(const stat of STATS){const p=a.stats?.[stat]||0,q=b.stats?.[stat]||0;if(p!==q)rows.push((ORIGIN_STAT_LABELS[STATS.indexOf(stat)]?.name||stat)+': '+p+' → '+q)}
 if((a.masteryAuto!==false)!==(b.masteryAuto!==false))rows.push('Автозаполнение мастерства: '+(a.masteryAuto!==false?'вкл':'выкл')+' → '+(b.masteryAuto!==false?'вкл':'выкл'));
 for(const branch of branches){
  const p=window.PandoraSkillProgression.trained(a,branch.id),q=window.PandoraSkillProgression.trained(b,branch.id);
  if(p!==q)rows.push('Мастерство '+branch.name+': '+p+' → '+q);
 }
 for(let i=0;i<slots.length;i++){
  const x=a.equipment?.[i],y=b.equipment?.[i];
  if(String(x?.id??'')!==String(y?.id??''))
   rows.push((lang==='en'?['Weapon','Shield','Helmet','Armor','Gloves','Pants','Boots',
    'Cloak','Ring I','Ring II','Amulet','Belt','Earring I','Earring II'][i]:slots[i][0])+
    ': '+name(x,'item')+' → '+name(y,'item'));
  const xp=lib.refinementValue(a.refinements,i,x),yp=lib.refinementValue(b.refinements,i,y);
  if(xp!==yp)rows.push('Заточка '+slots[i][0]+': +'+xp+' → +'+yp);
  const xa=lib.asSocketArray(a.souls?.[i]),ya=lib.asSocketArray(b.souls?.[i]);
  for(let s=0;s<Math.max(xa.length,ya.length);s++)
   if(String(xa[s]?.id??'')!==String(ya[s]?.id??''))
    rows.push(label('Душа ','Soul ')+slots[i][0]+' / '+(s+1)+
     ': '+name(xa[s],'soul')+' → '+name(ya[s],'soul'));
 }
 for(const field of ['guild','nation','rank','about']){
  const before=String(a.profile?.[field]||''),after=String(b.profile?.[field]||'');
  if(before!==after)rows.push('Профиль · '+field+': '+before.slice(0,50)+' → '+after.slice(0,50));
 }
 if(String(a.racialPassiveId||'')!==String(b.racialPassiveId||''))rows.push('Расовая пассивка: '+(a.racialPassiveId||'—')+' → '+(b.racialPassiveId||'—'));
 rows.push(...window.PandoraBuildComparison.describe(a,b,{
  lang,slotLabels:slots.map(x=>x[0]),enchant:window.PandoraEnchantModel,
  honorTitles:window.PandoraOSCalculator.honorTitles
 }));
 return rows;
}
function restoreLoadedBuildUI(){
 state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);
 racePreviewIndex=selectedPortraitIndex(state.race,state.gender);
 selectedSkillGroup=window.PandoraGameNavigation.branchGroup(state.branch)?.id||'melee';
 selectedSkill=null;inlineBranchId=null;selectedSlot=0;selectedSocket=0;
 stageSlotPickerOpen=false;stageSlotQuery='';stageSlotShown=48;
}
function openSavedBuild(b){
 // Resolve the newest stored snapshot after save-and-open; rendered cards may be stale.
 const latest=builds.find(record=>record.id===b.id)||b;
 selectActiveBuild(latest.id);
 const draft=structuredClone(latest.data),base=fresh();
    state={...base,...draft,
     points:{...base.points,...draft.points},stats:{...base.stats,...draft.stats},
     equipment:{...base.equipment,...draft.equipment},
     souls:{...base.souls,...draft.souls},
     refinements:{...base.refinements,...draft.refinements},
     gems:{...base.gems,...draft.gems},
     attributeBuffs:{...base.attributeBuffs,...draft.attributeBuffs},
     profile:{...base.profile,...draft.profile}};
    restoreLoadedBuildUI();persist();render();changeTab('character');

}
function unsavedBuild(){
 const s=JSON.stringify(state);
 return s!==JSON.stringify(fresh())&&!builds.some(b=>JSON.stringify(b.data)===s);
}
function newBlankBuild(){
 selectActiveBuild(null);state=fresh();originActive='race';jobPathKey=null;classTreeTouched=false;
 newBuildPromptOpen=false;newBuildDraftName=null;
 expandedClassKeys=new Set();restoreLoadedBuildUI();persist();render();renderOriginTabs();
 changeTab('character');saveView();
}
let buildSearchQuery='',newBuildPromptOpen=false,newBuildDraftName=null;
// The browser secret is effectively a password for this account-free D1 library.
// Reveal or switch it only after a deliberate user interaction.
async function connectCloudLibrary(secret,feedback){
 const trimmed=String(secret||'').trim().toLowerCase();
 if(window.PandoraAccountUI?.isLoggedIn()){
  feedback.textContent='Выйдите из аккаунта, чтобы переключить библиотеку по старому коду.';
  return false;
 }
 if(!/^[a-f0-9]{64}$/.test(trimmed)){
  feedback.textContent='Код должен содержать 64 символа. Скопируйте его с другого устройства.';
  return false;
 }
 if(queuedDeletes().length){
  feedback.textContent='Сначала синхронизируйте удаления с прежней библиотекой, чтобы старые ссылки перестали работать.';
  return false;
 }
 const previousOwner=libraryScopeId();
 try{
  const response=await cloudLibraryRequest(null,trimmed);
  if(libraryScopeId()!==previousOwner||window.PandoraAccountUI?.isLoggedIn()){
   feedback.textContent='Контекст библиотеки изменился. Проверьте текущий профиль.';
   return false;
  }
  if(!Array.isArray(response.records))throw Error('Не удалось прочитать библиотеку');
  if(!response.records.some(record=>!record.deleted&&record.entry)){
   feedback.textContent='По этому коду сохранённые билды не найдены. Проверьте, что код скопирован полностью.';
   return false;
  }
  if(trimmed===tabGuestSecret){
   feedback.textContent='Эта библиотека уже подключена.';
   return true;
  }
  const previousGuest=tabGuestSecret;
  localStorage.setItem(CLOUD_TOKEN_KEY,trimmed);
  tabGuestSecret=trimmed;
  activateLibraryScope({carry:true,
   carryFrom:window.PandoraBuildScope.owner(null,previousGuest)});
  selectActiveBuild(null);libraryChangeId++;
  feedback.textContent='Подключено. Объединяем сохранения…';
  void loadCloudBuilds();
  return true;
 }catch(error){
  feedback.textContent='Не удалось подключить библиотеку: '+error.message;
  return false;
 }
}
function buildLibraryTransfer(){
 const panel=h('details',{class:'build-transfer'});
 const content=h('div',{class:'build-transfer-content'});
 const field=h('input',{type:'text',readOnly:true,value:'',class:'build-transfer-key',
  'aria-label':'Личный код библиотеки',placeholder:'Код скрыт'});
 let codeVisible=false;
 const copy=h('button',{type:'button',class:'button-action',text:'Показать мой код',onclick:async()=>{
  if(!codeVisible){
   field.value=tabGuestSecret;
   codeVisible=true;field.focus();field.select();
   copy.textContent='Скопировать мой код';
   return;
  }
  try{await navigator.clipboard.writeText(field.value);copy.textContent='✓ Код скопирован'}
  catch{field.focus();field.select();copy.textContent='Скопируйте выделенный код'}
 }});
 const input=h('input',{type:'password',class:'build-transfer-key',maxLength:'64',
  autocomplete:'off',placeholder:'Вставить код с другого устройства',
  'aria-label':'Подключить библиотеку по коду'});
 const feedback=h('p',{class:'build-transfer-feedback',role:'status'});
 const join=h('button',{type:'button',class:'button-action primary',
  text:'Подключить и объединить',onclick:async()=>{
   join.disabled=true;
   try{await connectCloudLibrary(input.value,feedback)}
   finally{join.disabled=false}
  }});
 content.append(h('p',{class:'library-key-warning',
  text:'Сохраните личный код библиотеки до очистки данных браузера: без него восстановить ваши облачные билды не получится. Никому не передавайте этот код.'}),
  h('div',{class:'build-transfer-row'},[field,copy]),
  h('p',{text:'На другом устройстве вставьте ранее сохранённый код. Билды загрузятся из облака.'}),
  h('div',{class:'build-transfer-row'},[input,join]),feedback);
 panel.append(h('summary',{text:'Перенести или восстановить облачные билды'}),content);
 return panel;
}
function renderBuilds(root){
 const toolbar=h('div',{class:'build-toolbar'});
 const name=h('input',{type:'text',class:'build-name-input',maxLength:'70',value:state.name||'Новый герой','aria-label':'Название билда'});
 const choice=h('div',{class:'new-build-choice',hidden:!newBuildPromptOpen});
 const draft=h('input',{type:'text',maxLength:'70',value:newBuildDraftName??(state.name||'Новый герой'),
  'aria-label':'Название сохраняемого черновика'});
 draft.addEventListener('input',()=>{newBuildDraftName=draft.value});
 choice.append(h('span',{text:'Текущий персонаж ещё не сохранён.'}),
  h('div',{class:'new-build-choice-actions'},[
   draft,
   h('button',{type:'button',class:'button-action primary',text:'Сохранить и создать',onclick:()=>{if(saveBuild(draft.value))newBlankBuild()}}),
   h('button',{type:'button',class:'button-action',text:'Создать без сохранения',onclick:newBlankBuild}),
   h('button',{type:'button',class:'button-action',text:'Отмена',onclick:()=>{
     newBuildPromptOpen=false;newBuildDraftName=null;choice.hidden=true;
    }})
  ]));
 toolbar.append(name,
  h('button',{type:'button',class:'button-action primary',
   text:'✧ Сохранить новый билд',
   onclick:()=>saveBuild(name.value)}),
  ...(activeBuildId&&builds.some(b=>b.id===activeBuildId)?[
   h('button',{type:'button',class:'button-action',text:'Сохранить копию',onclick:()=>{
    const previous=activeBuildId;selectActiveBuild(null);
    if(!saveBuild(name.value))selectActiveBuild(previous);
   }})
  ]:[]),
  h('button',{type:'button',id:'newBuildButton',class:'button-action',text:'＋ Новый билд',onclick:()=>{
   if(!unsavedBuild()){newBuildPromptOpen=false;newBlankBuild();return}
   newBuildPromptOpen=!newBuildPromptOpen;
   choice.hidden=!newBuildPromptOpen;
   if(newBuildPromptOpen){
    newBuildDraftName=name.value||state.name||'Новый герой';
    draft.value=newBuildDraftName;draft.focus();
   }
  }}),
  h('button',{type:'button',class:'button-action',text:'↻ Обновить библиотеку',
   onclick:()=>{reportCloudStatus('Проверяем облако…');void loadCloudBuilds()}}));
 root.append(toolbar,choice,h('p',{class:'cloud-library-status',role:'status',text:cloudLibraryStatus}),
  ...(window.PandoraAccountUI?.isLoggedIn()?[]:[buildLibraryTransfer()]));
 const grid=h('div',{class:'build-grid'}),searchable=[];
 const search=builds.length>5?h('input',{type:'search',class:'build-library-search',
  'aria-label':'Найти сохранённый билд',placeholder:'Поиск по названию, классу, уровню…',
  value:buildSearchQuery}):null;
 if(search)root.append(search);
 for(const b of builds){
  const box=h('div',{class:'build-card'});
  const shareSlot=h('div',{class:'build-share-slot',role:'status'});
  const openChoice=h('div',{class:'build-open-choice',hidden:true});
  const check=h('input',{type:'checkbox','aria-label':(lang==='en'?'Compare ':'Сравнить ')+b.name});
  openChoice.append(h('p',{text:'Есть несохранённые изменения. Открыть другой билд?'}),
   h('button',{type:'button',class:'button-action primary',text:'Сохранить текущий и открыть',
    onclick:()=>{if(saveBuild())openSavedBuild(b)}}),
   h('button',{type:'button',class:'button-action',text:'Открыть без сохранения',
    onclick:()=>openSavedBuild(b)}),
   h('button',{type:'button',class:'button-action',text:'Отмена',
    onclick:()=>{openChoice.hidden=true}}));
  const overwriteChoice=h('div',{class:'build-overwrite-choice',hidden:true});
   overwriteChoice.append(h('p',{text:'Перезаписать сохранённый билд «'+b.name+'» текущим персонажем? Предыдущую версию этого билда восстановить будет нельзя.'}),
   h('button',{type:'button',class:'button-action primary',text:'Подтвердить перезапись',onclick:()=>{
    if(saveBuild(activeBuildId===b.id?state.name:b.name,b.id))showStudioToast(window.PandoraUILocale.ui(
     'Сохранено в браузере. Проверяем запись в облаке…',lang),'warning');
   }}),
   h('button',{type:'button',class:'button-action',text:'Отмена',onclick:()=>{overwriteChoice.hidden=true}}));
  const deleteChoice=h('div',{class:'build-delete-choice',hidden:true});
  deleteChoice.append(h('p',{text:b.localOnly===true?
   'Удалить локальную копию? Она ещё не сохранена в облаке.':
   'Удалить билд и отозвать все созданные ссылки?'}),
   h('button',{class:'button-action danger',type:'button',text:'Удалить билд',onclick:()=>{
    builds=builds.filter(v=>v.id!==b.id);compareIds=compareIds.filter(id=>id!==b.id);
    if(activeBuildId===b.id)selectActiveBuild(null);
    persistBuilds();
    if(b.localOnly===true){
     libraryChangeId++;
     reportCloudStatus('Локальная копия удалена');
    }else void deleteCloudBuild(b.id);
    renderDetails();
   }}),
   h('button',{class:'button-action',type:'button',text:'Отмена',onclick:()=>{deleteChoice.hidden=true}}));
  check.checked=compareIds.includes(b.id);
  check.onchange=()=>{if(check.checked)compareIds=[...compareIds,b.id].slice(-2);else compareIds=compareIds.filter(id=>id!==b.id);renderDetails()};
  box.append(h('h3',{text:b.name}),
   ...(b.localOnly===true?[h('p',{class:'build-local-only-note',
    text:'Локальная копия · чтобы сохранить в облако, откройте её и нажмите «Перезаписать»'})]:[]),
   h('p',{
   text:(races[b.data?.race]?.[0]||'?')+' · '+(jobs[b.data?.job]||'?')+' · '+(lang==='en'?'Lv. ':'ур. ')+(b.data?.level||'?')}),
   h('label',{},[check,' Сравнить']),
   h('button',{class:'button-action primary',text:'Открыть',onclick:()=>{
    if(!unsavedBuild()){openSavedBuild(b);return}
    openChoice.hidden=!openChoice.hidden;
   }}),
   ...[h('button',{class:'button-action primary',
     text:activeBuildId===b.id?'↻ Перезаписать':'↻ Сохранить в этот билд',onclick:()=>{
     overwriteChoice.hidden=!overwriteChoice.hidden;
     if(!overwriteChoice.hidden)overwriteChoice.querySelector('button')?.focus({preventScroll:true});
    }})],
    h('button',{class:'button-action',text:'🔗 Поделиться',onclick:()=>createShared(b,shareSlot)}),
   h('button',{class:'button-action',text:'Удалить',onclick:()=>{deleteChoice.hidden=!deleteChoice.hidden}}));
  box.append(openChoice);
  box.append(deleteChoice);
  box.append(overwriteChoice);
  box.append(shareSlot);
  grid.append(box);
  searchable.push({box,searchText:[b.name,races[b.data?.race]?.[0],jobs[b.data?.job],
   (lang==='en'?'Lv. ':'ур. ')+(b.data?.level??'')].filter(Boolean).join(' ').toLocaleLowerCase()});
 }
 root.append(grid);
 if(search){
  const none=h('p',{class:'muted',text:'Билды по запросу не найдены.',hidden:true});
  root.append(none);
  const apply=()=>{
   let visible=0;
   const query=buildSearchQuery.trim().toLocaleLowerCase();
   for(const row of searchable){
    row.box.hidden=!row.searchText.includes(query);
    if(!row.box.hidden)visible++;
   }
   none.hidden=!query||visible>0;
  };
  search.addEventListener('input',()=>{buildSearchQuery=search.value;apply()});
  apply();
 }
 if(!builds.length)root.append(h('p',{class:'muted',text:'Сохранённых билдов пока нет.'}));
 if(compareIds.length===2){
  const [a,b]=compareIds.map(id=>builds.find(v=>v.id===id));
  if(a&&b)root.append(h('h3',{text:(lang==='en'?'Comparison: ':'Сравнение: ')+a.name+' / '+b.name}),
   h('p',{class:'muted',text:compareSnapshots(a.data,b.data).join(' · ')||'Выборы совпадают'}));
 }
 window.PandoraUILocale.localize(root,lang);
}
function newId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
function saveBuild(name=state.name||'Новый герой',overwriteId=null){
 if(typeof name!=='string'||!name.trim())return false;
 const cleanName=name.trim().slice(0,70),previousName=state.name;
 const previousBuilds=builds.slice(),previousActive=activeBuildId;
 const existingIndex=overwriteId?builds.findIndex(b=>b.id===overwriteId):-1;
 const id=existingIndex>=0?builds[existingIndex].id:newId();
 state.name=cleanName;
 const entry={id,name:cleanName,data:structuredClone(state),
  at:Math.max(Date.now(),(existingIndex>=0?Number(builds[existingIndex].at)||0:0)+1)};
 if(existingIndex>=0)builds.splice(existingIndex,1);
 builds.unshift(entry);
 try{window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
  'ps-build-library.v1',JSON.stringify(builds))}
 catch(error){
  builds=previousBuilds;state.name=previousName;selectActiveBuild(previousActive);
  showStudioToast('Не удалось сохранить билд. Проверь свободное место в браузере.','error');
  return false;
 }
 libraryChangeId++;selectActiveBuild(id);persist();
 void putCloudBuild(entry);
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
 // Preserve optional, explicit HP/MP buffs on shared links without trusting arbitrary values.
 const sharedBuffs=original.vitalsBuffs;
 if(sharedBuffs&&typeof sharedBuffs==='object'&&!Array.isArray(sharedBuffs)){
  for(const key of ['guildHp','guildMp']){
   const level=sharedBuffs[key];
   if(Number.isInteger(level)&&level>=0&&level<=6)safe.vitalsBuffs[key]=level;
  }
  safe.vitalsBuffs.lifeSign=sharedBuffs.lifeSign===true;
 }
 const rawAttributes=original.attributeBuffs;
 if(rawAttributes&&typeof rawAttributes==='object'&&!Array.isArray(rawAttributes)){
  const guild=rawAttributes.guildAll,potency=rawAttributes.proeliumPotency;
  if(Number.isInteger(guild)&&guild>=0&&guild<=6)safe.attributeBuffs.guildAll=guild;
  if(Number.isInteger(potency)&&potency>=0&&potency<=100)safe.attributeBuffs.proeliumPotency=potency;
  for(const [key,limit] of [['guildLevel',12],['priestSpi',500],['priestBlessing',500],['priestHymn',500],
   ['guildLifeRecovery',2],['guildManaRecovery',2],['guildHealing',3],['guildArouse',3]]){
   const level=rawAttributes[key];
   if(Number.isInteger(level)&&level>=0&&level<=limit)safe.attributeBuffs[key]=level;
  }
  if(Number.isInteger(rawAttributes.honorTitle)&&rawAttributes.honorTitle>=0&&
    rawAttributes.honorTitle<window.PandoraOSCalculator.honorTitles.length){
   safe.attributeBuffs.honorTitle=rawAttributes.honorTitle;
   safe.attributeBuffs.honorCuriosity=rawAttributes.honorTitle===1;
  }else{
   // Pre-0.86 shared builds had only a boolean Honor switch.
   safe.attributeBuffs.honorCuriosity=rawAttributes.honorCuriosity===true;
  }
  if(typeof rawAttributes.priestEnabled==='boolean')safe.attributeBuffs.priestEnabled=rawAttributes.priestEnabled;
  if(rawAttributes.priestGratia===true)safe.attributeBuffs.priestGratia=true;
  if(rawAttributes.priestLapisMedio===true)safe.attributeBuffs.priestLapisMedio=true;
  safe.attributeBuffs.proelium=rawAttributes.proelium===true;
  safe.attributeBuffs.potionEffectsEnabled=rawAttributes.potionEffectsEnabled===true;
  // Preserve the historical Jo-Eun rune boolean for old snapshot compatibility.
  // The current OS calculator does not activate this unverified legacy effect.
  safe.attributeBuffs.runeJoEun=rawAttributes.runeJoEun===true;
  for(const key of ['combatWarCry','combatRage','combatDefender','combatLunge',
   'combatWindAssist','combatWindBlessing','combatConcentration'])
   if(rawAttributes[key]===true)safe.attributeBuffs[key]=true;
  if(safe.attributeBuffs.combatRage===true)safe.attributeBuffs.combatDefender=false;
 }
 if(Number.isSafeInteger(original.racialPassiveId)&&original.racialPassiveId>=0&&original.racialPassiveId<10000000000)
  safe.racialPassiveId=original.racialPassiveId;
 return safe;
}
function isVerifiedSharedBuild(share,expectedData){
 if(!share||share.schema!==1||share.type!=='build'||
  !share.data||typeof share.data!=='object'||Array.isArray(share.data))return false;
 try{return JSON.stringify(share.data)===JSON.stringify(expectedData)}
 catch{return false}
}
async function createShared(build,host){
 if(!build||!host)return;
 if(build.localOnly===true){
  host.replaceChildren(h('p',{class:'build-share-error',
   text:'Сначала откройте эту локальную копию и явно сохраните её через «Перезаписать».'}));
  return;
 }
 const pending=h('p',{class:'muted',text:'Проверяем сохранение билда…'});
 host.replaceChildren(pending);
 try{
  // Invalid saved state must show a card error instead of escaping the click handler.
  sanitizeSharedState(build.data);
  pending.textContent='Создаём ссылку из последней сохранённой облачной версии…';
  const response=await apiRequest('/api/shared',{schema:1,type:'build',buildId:build.id},
   window.PandoraAccountUI?.token()||tabGuestSecret);
  if(!/^[A-Za-z0-9_-]{11}$/.test(response.id||''))throw Error('Некорректная ссылка');
  // Confirm that the new public link is immediately readable before showing it.
  const check=await apiRequest('/api/shared/'+response.id,null,'');
  if(!isVerifiedSharedBuild(check?.share,build.data))
   throw Error('Ссылка не подтвердила выбранный билд. Попробуйте ещё раз.');
  const url=location.origin+location.pathname+'#b/'+response.id;
  const message=h('div',{class:'share-result'});
  const field=h('input',{type:'text',readOnly:true,value:url,'aria-label':'Ссылка на билд'});
  const copy=h('button',{type:'button',class:'button-action primary',text:'Скопировать ссылку',
   onclick:async()=>{
    try{await navigator.clipboard.writeText(url);copy.textContent='✓ Скопировано'}
    catch{field.focus();field.select();copy.textContent='Ссылка выделена — скопируй через меню или Ctrl+C'}
   }});
  message.append(h('p',{text:response.reused?'Ссылка на билд уже создана.':'Ссылка на билд создана.'}),
   field,copy,h('p',{class:'muted',text:'Ссылка хранит снимок на момент публикации. После удаления оригинального билда она перестанет работать.'}));
  window.PandoraUILocale.localize(message,lang);
  if(host.isConnected)host.replaceChildren(message);
 }catch(error){
  if(host.isConnected)host.replaceChildren(h('p',{class:'build-share-error',
   text:'Не удалось создать ссылку: '+error.message}));
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
    try{window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
     'ps-build-library.v1',JSON.stringify(next))}
    catch(e){alert('Не удалось сохранить библиотеку: '+e.message);return}
    builds=next;for(const entry of added)void putCloudBuild(entry);$('modalRoot').hidden=true;clear();changeTab('builds');
   }}));
  modal('Импорт общей библиотеки',view);return;
 }
 const incoming=sanitizeSharedState(share.data);
 const view=h('div');
 view.append(h('p',{text:'Открыть чужой билд «'+incoming.name+'»? Несохранённые изменения текущего персонажа будут заменены.'}),
  h('p',{class:'muted',text:'Сохранённые в «Мои билды» записи при этом не удаляются.'}));
 const apply=()=>{
  selectActiveBuild(null);state=incoming;restoreLoadedBuildUI();persist();
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
let studioToastTimer=null;
function showStudioToast(message,tone='warning'){
 let root=document.getElementById('studioToast');
 if(!root){root=h('div',{id:'studioToast',class:'studio-toast','aria-live':'polite',role:'status'});document.body.append(root)}
 clearTimeout(studioToastTimer);
 root.className='studio-toast '+tone;
 root.replaceChildren(h('div',{class:'studio-toast-content'},[
  h('strong',{text:tone==='success'?'Готово':tone==='error'?'Ссылка недоступна':'Уведомление'}),
  h('p',{text:message})
 ]));
 const close=()=>{root.hidden=true;root.replaceChildren()};
 root.append(h('button',{type:'button',class:'studio-toast-ok',text:'ОК',onclick:close}));
 root.hidden=false;
 studioToastTimer=setTimeout(close,8500);
}
async function restoreSharedHash(){
 const match=location.hash.match(/^#b\/([A-Za-z0-9_-]{11})$/);
 if(!match)return;
 try{
  const incoming=await apiRequest('/api/shared/'+match[1],null,'');
  if(location.hash==='#b/'+match[1])openSharedSnapshot(incoming.share);
 }catch(error){
  const removed=error.httpStatus===404||error.httpStatus===410;
  const message=error.httpStatus===410&&error.reason==='deleted'?
   'Владелец удалил этот билд. Ссылка больше не существует.':
   error.httpStatus===410&&error.reason==='legacy'?
   'Ссылка устарела. Попросите владельца поделиться билдом заново.':
   error.httpStatus===404?
   'Билд по ссылке не найден. Возможно, адрес неверный.':
   'Не получилось загрузить билд. Проверь соединение и попробуй снова.';
  showStudioToast(message,removed?'warning':'error');
  if(removed&&location.hash==='#b/'+match[1])
   history.replaceState(history.state,'',location.pathname+location.search);
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
 if(!response.ok){
  const error=new Error(data.error||("Ошибка сервера HTTP "+response.status));
  error.httpStatus=response.status;error.reason=data.reason||null;
  if(response.status===401&&token&&token===adminToken&&path.startsWith('/api/admin/')){
   // The editor session is invalid. A player account uses a different token
   // and must never be signed out by this administrator-only failure.
   adminToken='';adminEditing=false;ownerEdits.length=0;
   closeInlineEditor();updateAdminHint();
  }
  throw error;
 }
 return data;
}
function showAdmin(){const body=h('div');body.append(h('p',{class:'muted',text:adminToken?'Режим редактора подтверждён сервером. Изменения сохраняются в Cloudflare D1.':'Вход администратора защищён сервером Cloudflare Worker. Никаких паролей в GitHub Pages нет.'}));if(adminToken){body.append(h('button',{class:'button-action',text:'Игровой каталог',onclick:showCatalogImport}));body.append(h('button',{class:'button-action',text:'Синхронизировать ручные правки с GitHub',onclick:showOwnerGitHubExport}));body.append(h('button',{class:'button-action primary',text:adminEditing?'Выключить редактирование':'Включить редактирование',onclick:()=>{adminEditing=!adminEditing;$('modalRoot').hidden=true;render();updateAdminHint()}}),h('button',{class:'button-action',text:'Выйти',onclick:async()=>{try{await apiRequest('/api/admin/logout',{})}catch{}adminToken='';adminEditing=false;ownerEdits.length=0;closeInlineEditor();$('modalRoot').hidden=true;render();updateAdminHint()}}));modal('Управление сайтом',body);return}
 const user=h('input',{value:'administrator',readOnly:true}),password=h('input',{type:'password',placeholder:'Пароль администратора',autocomplete:'current-password'}),setup=h('input',{type:'password',placeholder:'Одноразовый секрет первичной настройки (если ещё нет пароля)'}),feedback=h('div',{class:'error'}),go=h('button',{class:'button-action primary',text:'Войти'});go.onclick=async()=>{feedback.textContent='';try{if(!password.value||password.value.length<12)throw Error('Нужен пароль от 12 символов');const data=await apiRequest(setup.value?'/api/admin/setup':'/api/admin/login',setup.value?{username:'administrator',password:password.value,setupToken:setup.value}:{username:'administrator',password:password.value},'');adminToken=data.token;adminEditing=true;$('modalRoot').hidden=true;render();updateAdminHint()}catch(e){feedback.textContent=e.message}};body.append(h('label',{text:'Логин'}),user,h('label',{text:'Пароль'}),password,h('label',{text:'Первичная настройка (заполняется только один раз)'}),setup,go,feedback,h('p',{class:'muted',text:'Первичная настройка требует секрет ADMIN_SETUP_TOKEN, созданный владельцем в настройках Worker. Это защищает имя administrator от захвата посторонними.'}));const checkApi=h('button',{type:'button',class:'button-action',text:'Проверить Cloudflare API',onclick:async()=>{feedback.textContent='Проверяю сервер…';try{const result=await apiRequest('/api/health',null,'');feedback.textContent=result.status==='ok'?'Worker отвечает, D1 подключена.':'Ответ сервера: '+JSON.stringify(result)}catch(e){feedback.textContent=e.message}}});body.append(checkApi);modal('Служебный вход',body)}
function updateAdminHint(){
 const indicator=$('authState');
 if(indicator){
  indicator.hidden=!adminEditing;
  indicator.textContent=adminEditing?'✎ Редактор':'';
 }
 document.querySelectorAll('[data-edit-key]').forEach(el=>el.classList.toggle('admin-edit',adminEditing));
 refreshOwnerUI();
}

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
    h('button',{type:'button',text:'Игровой каталог',onclick:showCatalogImport}),
    h('button',{type:'button',text:'PR правок',onclick:showOwnerGitHubExport}),
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
    ownerEdits.pop();closeInlineEditor();refreshOwnerCatalog();
  }catch(e){alert('Не удалось отменить изменение: '+e.message)}
  finally{editIsSaving=false;refreshOwnerUI()}
}
function showOverrideManager(){
 if(!adminToken)return;
 const body=h('div',{class:'owner-manager'});
 body.append(h('p',{class:'muted',text:
  'Ручные изменения, сохранённые в Cloudflare D1. Для каждой записи показаны раздел, поле, исходное значение игрового каталога и текущая правка. Неизвестные исходные значения отмечены отдельно.'}));
 const search=ownerPlainTextField({placeholder:'Найти предмет, NPC или изменённое поле…',
  class:'owner-manager-search wiki-owner-search','aria-label':'Поиск среди ручных изменений'});
 const count=h('p',{class:'owner-manager-summary',role:'status'});
 const list=h('div',{class:'owner-manager-list'});
 const draw=()=>{
  list.replaceChildren();
  const q=String(search.value||'').trim().toLocaleLowerCase('ru');
  const entries=Object.entries(override).map(([key,value])=>
   window.PandoraOwnerChangeReview.inspect(key,value,{
    base:wikiBaseData,items:wikiBaseData?.items||catalogSource?.items,
    classes:catalog?.classes}))
   .filter(record=>!q||[record.key,record.title,...record.changes.flatMap(x=>
    [x.field,x.before,x.after])].join(' ').toLocaleLowerCase('ru').includes(q))
   .sort((a,b)=>a.section.localeCompare(b.section,'ru')||a.title.localeCompare(b.title,'ru'));
  count.textContent='Найдено '+entries.length+' из '+Object.keys(override).length+' ручных изменений';
  if(!entries.length)list.append(h('p',{class:'muted',
   text:'Не найдено правок по выбранному запросу.'}));
  for(const record of entries){
   const row=h('section',{class:'owner-manager-row owner-review-row'});
   const head=h('div',{class:'owner-review-heading'},[
    h('strong',{text:record.title}),
    h('small',{text:'Изменено полей: '+record.changes.length})
   ]);
   const edits=h('div',{class:'owner-review-changes'});
   for(const entry of record.changes){
    const change=h('div',{class:'owner-review-change'});
    change.append(h('strong',{class:'owner-review-field',text:entry.field}),
     h('div',{class:'owner-review-comparison'},[
      h('div',{class:'owner-review-before'},[
       h('small',{text:'Было'}),h('p',{text:entry.before})]),
      h('div',{class:'owner-review-after'},[
       h('small',{text:'Стало'}),h('p',{text:entry.after})])
     ]));
    edits.append(change);
   }
   const actions=h('div',{class:'owner-review-actions'});
   if(record.target&&record.target.id&&wikiDataOrCatalogHasRecord(record.target)){
    actions.append(h('button',{type:'button',text:'Открыть в энциклопедии',
     onclick:()=>{
      $('modalRoot').hidden=true;$('modalRoot').replaceChildren();
      openWiki(record.target.type,record.target.id);
      showWorkbench();
     }}));
   }
   actions.append(h('button',{type:'button',class:'owner-review-reset',
    text:'Вернуть оригинал',onclick:async()=>{
     if(!confirm('Вернуть исходные данные для «'+record.title+'»?'))return;
     const previous=activeOverride(record.key);
     try{
      await apiRequest('/api/admin/reset',{key:record.key});
      ownerEdits.push({key:record.key,before:previous,after:null});
      delete override[record.key];draw();void refreshOwnerCatalog();refreshOwnerUI();
     }catch(error){showStudioToast('Не удалось отменить правку: '+error.message,'warning')}
    }}));
   row.append(head,edits,actions);list.append(row);
  }
 };
 function wikiDataOrCatalogHasRecord(target){
  if(target.type==='item'||target.type==='chest')
   return Boolean(wikiBaseData?.items?.[target.id]||catalogSource?.items?.[target.id]);
  if(target.type==='monster')return Boolean(wikiBaseData?.monsters?.[target.id]);
  if(target.type==='skill')return Boolean(wikiBaseData?.skills?.[target.id]);
  if(target.type==='npc')return Boolean(wikiBaseData?.trades?.npcs?.[target.id]||
   window.PandoraAstirLocations?.npcRecords?.()[target.id]||
   wikiData?.townNpcs?.[target.id]);
  if(target.type==='soul')return Boolean(wikiBaseData?.souls?.[target.id]);
  if(target.type==='map')return Boolean(wikiBaseData?.maps?.[target.id]||
   wikiBaseData?.trades?.mapNames?.[target.id]||
   window.PandoraAstirLocations?.district(target.id));
  if(target.type==='instance')return (wikiBaseData?.instances||[]).some(x=>
   String(x.id)===String(target.id));
  return false;
 }
 search.addEventListener('input',draw);
 body.append(search,count,list);
 draw();
 modal('Все ручные правки',body);
 if(!wikiBaseData)void loadWiki().then(()=>{if(body.isConnected)draw()})
  .catch(()=>{if(body.isConnected)showStudioToast('Исходный каталог временно недоступен','warning')});
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
  const input=visual?ownerPlainTextField({class:'owner-plain-path',
   'aria-label':'Путь к изображению',value:original,placeholder:'assets/image.webp'}):
   slotEdit?h('input',{type:'number',min:'0',max:'32',step:'1',value:original,'aria-label':'Число гнёзд'}):
    ownerPlainTextField({multiline:true,rows:key.startsWith('skilldesc.')?5:3,
   class:'owner-plain-multiline','aria-label':'Редактируемый текст'});
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
      feedback.textContent=visual?'Недопустимый путь: разрешены assets/ и иконки актуального игрового сервера.':'Некорректная длина текста.';return;
    }
    if(value===previous){closeInlineEditor();return;}
    editIsSaving=true;save.disabled=true;reset.disabled=true;
    try{
      await apiRequest('/api/admin/override',{key,value});
      ownerEdits.push({key,before:previous,after:value});override[key]=value;
      closeInlineEditor();refreshOwnerCatalog();
    }catch(e){feedback.textContent=e.message}
    finally{editIsSaving=false;save.disabled=false;reset.disabled=false;refreshOwnerUI()}
  };
  reset.onclick=async()=>{
    if(editIsSaving||previous===null)return;
    editIsSaving=true;reset.disabled=true;save.disabled=true;
    try{
      await apiRequest('/api/admin/reset',{key});
      ownerEdits.push({key,before:previous,after:null});delete override[key];
      closeInlineEditor();refreshOwnerCatalog();
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

// Password managers can ignore autocomplete=off on ordinary inputs.
 // Plain-text editor fields intentionally do not resemble username/password
 // controls; use a text node, not a form-associated input.
 function ownerPlainTextField(attrs={}){
  const {multiline=false,rows,value='',...rest}=attrs;
  const el=h(multiline?'div':'span',{
   ...rest,role:'textbox',contenteditable:'plaintext-only',
   'aria-multiline':multiline?'true':'false',
   'data-owner-text-field':'true',spellcheck:'false',
   autocapitalize:'off',tabindex:'0'});
  if(rest.placeholder)el.dataset.placeholder=String(rest.placeholder);
  if(multiline&&rows)el.style.minHeight=Math.max(72,Number(rows)*24)+'px';
  Object.defineProperty(el,'value',{
   configurable:false,get(){return el.textContent||''},
   set(v){el.textContent=String(v??'')}
  });
  el.value=value;
  if(!multiline)el.addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();el.blur()}
  });
  return el;
 }
function guardOwnerInput(input){
 input.setAttribute('autocomplete','off');
 input.setAttribute('autocorrect','off');
 input.setAttribute('autocapitalize','off');
 input.setAttribute('spellcheck','false');
 input.setAttribute('data-lpignore','true');
 input.setAttribute('data-1p-ignore','true');
 input.setAttribute('data-bwignore','true');
 input.setAttribute('data-form-type','other');
 input.setAttribute('data-owner-editor','true');
 input.readOnly=true;
 input.addEventListener('pointerdown',()=>{input.readOnly=false},{once:true});
 input.addEventListener('keydown',()=>{input.readOnly=false},{once:true});
 input.addEventListener('focus',()=>{input.readOnly=false},{once:true});
 return input;
}
function editWikiValue(node,initial,{type='text',options=[],min=0,max=100000,integer=false,onCommit}={}){
 if(!adminEditing||!adminToken||node.querySelector('input,select,textarea'))return;
 const before=String(initial??''),visibleBefore=node.textContent;
 let finished=false,saving=false;
 const control=type==='select'?h('select',{class:'wiki-inline-select','aria-label':'Выбери значение'}):
  type==='textarea'||type==='text'?ownerPlainTextField({
   multiline:type==='textarea',rows:6,class:'wiki-inline-input wiki-owner-plaintext',
   'aria-label':type==='textarea'?'Изменить описание':'Изменить значение'}):
  h('input',{type:'number',class:'wiki-inline-input',
   'aria-label':'Изменить значение',min:String(min),max:String(max),
   step:integer?'1':'any'});
 if(type==='select'){
  for(const option of options){
   const el=h('option',{value:option.value,text:option.label});
   el.selected=option.value===before;control.append(el);
  }
 }else control.value=before;
 if(type==='number')guardOwnerInput(control);
 const restore=()=>{if(node.isConnected){node.replaceChildren(document.createTextNode(visibleBefore));node.classList.remove('wiki-inline-saving')}};
 const save=async()=>{
  if(finished||saving)return;
  const raw=control.value;
  const value=type==='number'?(raw.trim()===''?null:Number(raw)):raw.trim();
  if(type==='number'&&(value===null||!Number.isFinite(value)||value<min||value>max||
   (integer&&!Number.isInteger(value)))){
   control.setCustomValidity('Введите корректное значение');control.reportValidity();control.focus();return;
  }
  if(type!=='number'&&type!=='select'&&(value.length>2000||(!value&&type==='text'))){
   if(control.setCustomValidity){control.setCustomValidity('Некорректная длина текста');control.reportValidity()}
   else showStudioToast('Некорректная длина текста','warning');
   control.focus();return;
  }
  if(String(value)===before){finished=true;restore();return}
  saving=true;control.disabled=true;node.classList.add('wiki-inline-saving');
  try{await onCommit(value);finished=true;restore()}
  catch(error){saving=false;control.disabled=false;node.classList.remove('wiki-inline-saving');
   if(control.setCustomValidity){
    control.setCustomValidity('Не сохранено: '+String(error.message||'Ошибка'));control.reportValidity()
   }else showStudioToast('Не сохранено: '+String(error.message||'Ошибка'),'warning');
   control.focus()}
 };
 control.oninput=()=>{if(control.setCustomValidity)control.setCustomValidity('')};
 control.onblur=()=>{if(type==='select'){if(!saving){finished=true;restore()}}else void save()};
 control.onchange=()=>{if(type==='select')void save()};
 control.onkeydown=e=>{
  if(e.key==='Escape'){e.preventDefault();finished=true;restore()}
  else if(e.key==='Enter'&&(type!=='textarea'||e.ctrlKey)){e.preventDefault();void save()}
 };
 node.replaceChildren(control);control.focus();
 if(type==='number')control.select();
 else if(type==='text')window.getSelection()?.selectAllChildren(control);
}
async function saveGuidePatch(key,fields){
 if(!adminEditing||!adminToken||!window.PandoraHonorGuide)
  throw Error('Редактор справочника недоступен');
 const overrideKey='guideedit.'+key,before=activeOverride(overrideKey);
 let old={};try{old=JSON.parse(before||'{}')}catch{}
 const patch={...(old&&typeof old==='object'&&!Array.isArray(old)?old:{}),...fields};
 const serialized=JSON.stringify(patch);
 if(!window.PandoraHonorGuide.validOverride(key,serialized))
  throw Error('Некорректный текст справочника');
 if(serialized===before)return;
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key:overrideKey,value:serialized});
  override[overrideKey]=serialized;ownerEdits.push({key:overrideKey,before,after:serialized});
  if(activeTab==='wiki'&&wikiSelection.type==='honor')renderDetails();
  else renderStageAttributes();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveGuideList(key,rows){
 if(!['honor.zones','honor.wars'].includes(key)||!Array.isArray(rows))
  throw Error('Неизвестный список');
 const overrideKey='guideedit.'+key,before=activeOverride(overrideKey),value=JSON.stringify(rows);
 if(!window.PandoraHonorGuide?.validOverride(key,value))
  throw Error('Проверь названия, ID и связи списка');
 if(value===before)return;
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key:overrideKey,value});
  override[overrideKey]=value;ownerEdits.push({key:overrideKey,before,after:value});
  if(activeTab==='wiki'&&wikiSelection.type==='honor')renderDetails();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveWikiRecordPatch(type,id,updates){
 if(!adminToken||!adminEditing)throw Error('Недостаточно прав');
 const key='wikiedit.'+type+'.'+id;
 let current={};
 try{current=JSON.parse(override[key]||'{}')}catch{}
 const patch={...current,...updates};
 if(!/^[0-9]+$/.test(String(id))){
  if(!window.PandoraWikiOwnerData.validTownPatch(type,id,patch))
   throw Error('Некорректное значение специального справочника');
 }else if(!window.PandoraWikiOwnerData.validPatch(type,patch))
  throw Error('Некорректное значение поля');
 const before=activeOverride(key),after=JSON.stringify(patch);
 if(before===after)return;
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key,value:after});
  ownerEdits.push({key,before,after});override[key]=after;
  await refreshOwnerCatalog();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveWikiRecordField(type,id,field,value){
 const patch=field.startsWith('resists.')?
  {resists:{...(wikiData?.monsters?.[id]?.resists||{}),
   ...JSON.parse(override['wikiedit.'+type+'.'+id]||'{}').resists,
   [field.slice(8)]:value}}:{[field]:value};
 return saveWikiRecordPatch(type,id,patch);
}
async function saveWikiSpawns(monsterId,type,placeId,include){
 if(type==='map'&&!Object.hasOwn(wikiData?.maps||{},String(placeId)))
  throw Error('Нельзя разместить монстра: карта отсутствует в игровом каталоге.');
 if(type==='instance'&&!(wikiData?.instances||[]).some(x=>String(x.id)===String(placeId)))
  throw Error('Подземелье отсутствует в игровом каталоге.');
 if(!wikiData?.monsters?.[monsterId])throw Error('Монстр не найден в каталоге.');
 const current=wikiIndex.locations(monsterId).map(x=>({type:x.type,id:String(x.id)}));
 const wanted=new Map(current.map(x=>[x.type+':'+x.id,x]));
 const key=type+':'+placeId;
 if(include)wanted.set(key,{type,id:String(placeId)});else wanted.delete(key);
 const rows=[...wanted.values()];
 if(!window.PandoraWikiOwnerData.validSpawns(rows))throw Error('Некорректные места появления');
 const recordKey='spawnedit.'+monsterId,before=activeOverride(recordKey),after=JSON.stringify(rows);
 if(before===after)return;
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key:recordKey,value:after});
  override[recordKey]=after;ownerEdits.push({key:recordKey,before,after});
  refreshOwnerCatalog();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveWikiRelationRows(kind,id,rows){
 if(!adminToken||!adminEditing)throw Error('Недостаточно прав');
 const key=kind+'edit.'+id,valid=kind==='drop'?
  window.PandoraWikiOwnerData.validDrops(rows):
  window.PandoraWikiOwnerData.validChest(rows);
 if(!valid)throw Error('Проверь список и числа');
 const before=activeOverride(key),after=JSON.stringify(rows);
 if(before===after)return;
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key,value:after});
  ownerEdits.push({key,before,after});override[key]=after;refreshOwnerCatalog();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
function wikiOwnerNumeric(node,value,type,id,field,{integer=false,min=0,max=1000000000}={}){
 if(!adminToken||!adminEditing)return node;
 node.classList.add('wiki-edit-value');
 node.title='Двойной клик — изменить';
 node.ondblclick=e=>{
  e.preventDefault();e.stopPropagation();
  editWikiValue(node,Number(value),{type:'number',min,max,integer,
   onCommit:next=>saveWikiRecordField(type,id,field,next)});
 };
 return node;
}
function wikiOwnerText(node,type,id,field,{multiline=false}={}){
 if(!adminToken||!adminEditing||(lang!=='ru'&&!['npc','map','monster'].includes(type)))return node;
 node.classList.add('wiki-edit-value');
 // The delegated dblclick is the user's actual first gesture. Starting an
 // ondblclick listener here would silently require a SECOND double-click.
 editWikiValue(node,node.dataset.ownerEmpty==='true'?'':String(node.textContent||''),{
  type:multiline?'textarea':'text',
  onCommit:next=>type==='item'||type==='chest'?
   saveWikiItemField(id,field,next):saveWikiRecordField(type,id,field,next)});
 return node;
}
async function saveWikiItemField(id,field,value){
 if(!adminEditing||!adminToken||!catalogSource?.items?.[id])throw Error('Редактирование недоступно');
 const base=catalogSource.items[id],key='itemedit.'+id,previous=activeOverride(key);
 const patch={...window.PandoraStudioItemOwnerEditor.ownPatch(override,id)};
 if(value===base[field]||(value===null&&base[field]==null))delete patch[field];
 else patch[field]=value;
 if(field==='kind'&&/^[12]H_/.test(value))patch.twoHanded=value.startsWith('2H_');
 const serialized=JSON.stringify(patch);
 if(serialized===JSON.stringify(window.PandoraStudioItemOwnerEditor.ownPatch(override,id)))return;
 editIsSaving=true;
 try{
  if(!Object.keys(patch).length){
   if(previous===null)return;
   await apiRequest('/api/admin/reset',{key});delete override[key];
   ownerEdits.push({key,before:previous,after:null});
  }else{
   await apiRequest('/api/admin/override',{key,value:serialized});
   override[key]=serialized;ownerEdits.push({key,before:previous,after:serialized});
  }
  refreshOwnerCatalog();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveWikiTradeRecipe(recipe,changes=null){
 if(!adminToken||!adminEditing||!wikiData?.trades)throw Error('Редактор обменов недоступен');
 const normalized={id:Number(recipe.id),i:Number(recipe.i),
  npc:(recipe.npc||[]).map(Number),mats:(recipe.mats||[]).map(row=>({i:Number(row.i),n:Number(row.n)})),
  gold:Number(recipe.gold||0),honor:Number(recipe.honor||0),exp:Number(recipe.exp||0)};
 const key='tradeedit.'+normalized.id,previous=activeOverride(key);
 const patch=changes||{recipe:normalized};
 if(changes===null&&!window.PandoraStudioTradeOwnerData.recipeValid(
  normalized,wikiData.items,wikiData.trades.npcs))
  throw Error('Проверь выбранные предметы, NPC и стоимость обмена');
 const value=JSON.stringify(patch);
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key,value});
  override[key]=value;ownerEdits.push({key,before:previous,after:value});
  refreshOwnerCatalog();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveWikiAcquisitions(itemId,rows){
 if(!adminToken||!adminEditing||!wikiData?.items?.[itemId])
  throw Error('Редактирование источников недоступно');
 if(!Array.isArray(rows)||rows.length>24||rows.some(row=>
  !['npc','monster'].includes(row.type)||!/^[1-9][0-9]{0,14}$/.test(String(row.id))||
  (row.p!=null&&(!Number.isFinite(row.p)||row.p<0||row.p>100||row.type!=='monster'))||
  !(row.type==='npc'?wikiData.trades?.npcs?.[row.id]:wikiData.monsters?.[row.id])))
  throw Error('Некорректная ссылка на NPC или монстра');
 const normalized=[...new Map(rows.map(row=>[row.type+':'+row.id,
   {type:row.type,id:String(row.id),
    ...(row.type==='monster'&&Number.isFinite(row.p)?{p:row.p}:{})}])).values()];
 const key='acquireedit.'+itemId,previous=activeOverride(key);
 if(JSON.stringify(normalized)===JSON.stringify(wikiData.ownerAcquisitions?.[itemId]||[]))return;
 editIsSaving=true;
 try{
  if(!normalized.length){
   if(previous===null)return;
   await apiRequest('/api/admin/reset',{key});delete override[key];
   ownerEdits.push({key,before:previous,after:null});
  }else{
   const value=JSON.stringify(normalized);
   await apiRequest('/api/admin/override',{key,value});
   override[key]=value;ownerEdits.push({key,before:previous,after:value});
  }
  refreshOwnerCatalog();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
function inlineWikiText(el){
 const key=el?.dataset?.editKey;
 if(!adminEditing||!adminToken||!key)return;
 const matched=/^(item|itemdesc)\.([0-9]{1,15})$/.exec(key);
 const source=matched?wikiData?.items?.[matched[2]]:null;
 const desc=key.startsWith('itemdesc.')||key.startsWith('skilldesc.');
 const raw=source?String(source[desc?'desc':'name']??''):el.textContent;
 const value=desc?window.PandoraItemPresentation.description(raw):raw;
 editWikiValue(el,value,{type:desc?'textarea':'text',onCommit:async next=>{
  if(matched)return saveWikiItemField(matched[2],desc?'desc':'name',next);
  if(!next||next.length>(desc?2000:240))throw Error('Некорректная длина текста');
  const previous=activeOverride(key);
  await apiRequest('/api/admin/override',{key,value:next});
  override[key]=next;ownerEdits.push({key,before:previous,after:next});refreshOwnerCatalog();
 }});
}

async function showOwnerGitHubExport(){
 if(!adminToken)return;
 try{
  const info=await apiRequest('/api/admin/catalog/owner-review');
  if(!info.configured){showStudioToast('GitHub-токен пока недоступен Worker.','warning');return}
  const panel=h('div',{class:'owner-github-review'});
  panel.append(h('p',{text:'Подготовить PR ручных изменений энциклопедии: '+info.count+' записей?'}),
   h('p',{class:'muted',text:'Это экспорт в публичный GitHub. Проверь названия, описания и примечания перед объединением. Пароли и аккаунты не экспортируются. Исходный игровой каталог не изменяется.'}));
  const feedback=h('p',{class:'inline-owner-error',role:'status'});
  const go=h('button',{type:'button',class:'button-action primary',text:'Создать PR в GitHub',disabled:!info.count});
  go.onclick=async()=>{
   go.disabled=true;
   try{
    const result=await apiRequest('/api/admin/catalog/owner-pr',{
     expectedFingerprint:info.fingerprint});
    if(result.url&&/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(result.url)){
     feedback.replaceChildren(h('a',{href:result.url,target:'_blank',rel:'noopener noreferrer',
      text:'Открыть PR для проверки'}));
    }else feedback.textContent=result.unchanged?
     'Изменений относительно GitHub нет.':'PR создан, но адрес не указан.';
   }catch(error){feedback.textContent=error.message;go.disabled=false}
  };
  panel.append(go,feedback);modal('Синхронизация энциклопедии с GitHub',panel);
 }catch(error){showStudioToast('Не удалось подготовить экспорт: '+error.message,'warning')}
}
async function showCatalogImport(){
 if(!adminToken)return;
 const workbench=window.PandoraOSCatalogWorkbench;
 if(!workbench)throw Error('Модуль сверки актуального игрового сервера не подключён');
 return workbench.open({
  request:(path,body)=>apiRequest(path,body,adminToken),
  apiBase:API,modal,h,
  afterPublish:async()=>{wikiBaseData=null;wikiIndex=null;wikiData=null;await loadCatalog()}
 });
}

function syncLocaleControls(){
 for(const button of document.querySelectorAll('#locale [data-locale]')){
  const active=button.dataset.locale===lang;
  button.classList.toggle('chosen',active);
  button.setAttribute('aria-pressed',String(active));
 }
}
function applyGameLocale({redraw=true}={}){
 window.PandoraUILocale.apply(lang);
 window.PandoraAccountUI?.refresh?.();
 syncLocaleControls();
 if(!catalogSource)return;
 const translate=(original,map,keepSourceDesc=false)=>{
  if(lang!=='en'||!map)return original;
  return Object.fromEntries(Object.entries(original).map(([id,item])=>{
    const t=map[id];return [id,t?{...item,name:t.n||item.name,
     desc:t.d??item.desc,...(keepSourceDesc?{sourceDesc:item.desc}:{})}:item]
  }));
 };
 const en=lang==='en'?officialEnglish:null;
 const itemRecords=window.PandoraStudioItemOwnerEditor.applyItems(catalogSource.items,override);
 const meta={...catalogSource.meta};
 if(en?.branches)meta.branchLabels={...meta.branchLabels,...en.branches};
 // Verified ID-based Remaked names only; never fuzzy-translate at runtime.
 const ownerGameData=window.PandoraWikiOwnerData.apply({skills:catalogSource.skills,souls:catalogSource.souls},override);
 const localizedSkills=translate(ownerGameData.skills,en?.skills);
 if(lang==='ru'){
  for(const [id,name] of Object.entries(approvedSkillIdNames||{})){
   if(localizedSkills[id])localizedSkills[id]={...localizedSkills[id],name};
  }
  for(const [id,name] of Object.entries(window.PandoraGameNavigation.approvedRacialSkillNames)){
   if(localizedSkills[id])localizedSkills[id]={...localizedSkills[id],name};
  }
 }
 for(const [key,value] of Object.entries(override)){
  const match=/^(skill|skilldesc)\.([a-zA-Z0-9_-]{1,32})\.([0-9]{1,12})$/.exec(key);
  if(match&&localizedSkills[match[3]]&&lang==='ru'&&value?.trim())
   localizedSkills[match[3]]={...localizedSkills[match[3]],
    [match[1]==='skill'?'name':'desc']:value};
 }
 catalog={meta,classes:translate(catalogSource.classes,en?.classes),skills:localizedSkills,
   equipment:translate(itemRecords,en?.items,true),souls:translate(ownerGameData.souls,en?.souls),racialPassives:catalogSource.racialPassives,live:true};
 jobs=jobKeys.map(id=>catalog.classes[id]?.name||id);
 branches=window.PandoraGameNavigation.groups.flatMap(g=>g.branches.map(id=>({id,name:meta.branchLabels[id]||id})));
 if(redraw)render();
}
async function loadCatalog(){
 const names=['meta','classes','skills','items','souls','racialPassives','unison'];
 const obtain=async base=>{
  const fromD1=base===API+'/api/catalog',snapshots=new Set(),unknown=[];
  const entries=await Promise.all(names.map(async name=>{
   const response=await fetch(base+'/'+name+'.json',
    {cache:'no-cache',signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error(name+' HTTP '+response.status);
   if(fromD1){
    const snapshot=response.headers.get('x-ps-catalog-snapshot');
    if(snapshot)snapshots.add(snapshot);else unknown.push(name);
   }
   return [name,await response.json()];
  }));
  if(fromD1&&(snapshots.size!==1||unknown.length))
   throw Error('Несогласованные версии каталога D1');
  const data=Object.fromEntries(entries);
  for(const name of names.filter(x=>x!=='meta')){
   const expected=Number(data.meta?.counts?.[name]);
   const actual=Object.keys(data[name]||{}).length;
   if(!Number.isSafeInteger(expected)||expected<1||actual<expected)
    throw Error('Неполный каталог '+name+': '+actual+' / '+expected);
  }
  return data;
 };
 let live,sourceLabel;
 try{live=await obtain(API+'/api/catalog');sourceLabel='Cloudflare D1 · наша база'}
 catch(err){
  console.info('D1 catalog unavailable or incomplete; using repository copy',err.message);
  try{live=await obtain('./data/os');sourceLabel='Встроенный архив (до переноса в D1)'}
  catch(error){
   console.error('Catalog unavailable',error);
   $('siteNotice').textContent='Каталог временно недоступен; сохранённые билды не удалены.';
   $('siteNotice').hidden=false;
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
 // Keep routine catalog success details in the footer; reserve the top notice for failures.
 $('siteNotice').hidden=true;
 $('siteNotice').textContent='';
 $('catalogStatus').textContent=`${live.meta.counts.skills} навыков · ${live.meta.counts.items} предметов · ${live.meta.counts.souls} душ · ${sourceLabel}`;
 applyGameLocale();persist();
}
let ownerWikiRefreshId=0;
async function refreshOwnerCatalog(){
 const generation=++ownerWikiRefreshId;
 wikiIndex=null;wikiData=null;wikiPending=null;
 if(catalogSource)applyGameLocale({redraw:false});
 if(activeTab==='wiki'&&wikiRenderedRoot?.isConnected){
  try{
   await loadWiki();
   if(generation===ownerWikiRefreshId&&activeTab==='wiki'&&wikiRenderedRoot?.isConnected)
    wikiRenderSelected?.();
  }catch(error){
   if(generation===ownerWikiRefreshId)
    showStudioToast('Не удалось обновить запись: '+error.message,'warning');
  }
 }else render();
 updateAdminHint();
}
async function loadOverrides(){try{
 const response=await apiRequest('/api/overrides',null,'');
 override=response.values||{};
 refreshOwnerCatalog();
}catch{ /* Not deployed or CORS restricted; static site remains usable. */ }}
$('originTabs').onclick=event=>{
 const button=event.target.closest('[data-origin-tab]');
 if(!button)return;
 originActive=button.dataset.originTab;renderOriginTabs();saveView();
};
$('nav').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)changeTab(b.dataset.tab)};$('level').oninput=e=>{state.level=Math.max(1,Math.min(55,Number(e.target.value)||1));persist();render()};$('genderF').onclick=()=>{if(!window.PandoraUIPlanner.raceHasGender(races,state.race))return;state.gender=0;persist();render()};$('genderM').onclick=()=>{if(!window.PandoraUIPlanner.raceHasGender(races,state.race))return;state.gender=1;persist();render()};$('swapGender').onclick=()=>{if(!window.PandoraUIPlanner.raceHasGender(races,state.race))return;state.gender=1-state.gender;persist();render()};$('jumpEquipment').onclick=()=>{
 selectedSlot=0;stageSlotQuery='';stageSlotView=state.equipment?.[0]?'details':'choose';
 stageSlotPickerOpen=true;renderSlotRails();renderStagePicker(true);
};
if($('stageAttributeToggle'))$('stageAttributeToggle').onclick=()=>{
 stageAttributesPage=stageAttributesPage?null:'summary';renderStageAttributes();saveView()
};
if($('stageBuffToggle'))$('stageBuffToggle').onclick=()=>{
 stageAttributesPage=stageAttributesPage==='buffs'?null:'buffs';
 renderStageAttributes();saveView();
};
const openHeroBook=()=>{
 if(stageSlotPickerOpen||adminEditing)return;
 stageAttributesPage='summary';renderStageAttributes();saveView();
};
if($('portraitBookOpen'))$('portraitBookOpen').onclick=openHeroBook;
$('stageAttributes')?.addEventListener('keydown',event=>{
 if(!stageAttributesPage||stageSlotPickerOpen||
  event.target.closest?.('input,select,textarea'))return;
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
 const pages=window.PandoraStageAttributes.bookPages.map(([id])=>id);
 const position=pages.indexOf(stageAttributesPage);
 if(position<0)return;
 event.preventDefault();
 stageAttributesPage=pages[(position+(event.key==='ArrowRight'?1:-1)+pages.length)%pages.length];
 renderStageAttributes();saveView();
});
$('hero').addEventListener('click',openHeroBook);
$('hero').addEventListener('keydown',event=>{
 if((event.key==='Enter'||event.key===' ')&&!stageSlotPickerOpen&&!adminEditing){
  event.preventDefault();openHeroBook();
 }
});$('newBuildQuick').onclick=()=>{changeTab('builds');$('newBuildButton')?.click()};$('snapshot').onclick=()=>{changeTab('builds')};$('locale').onclick=event=>{
 const button=event.target.closest('[data-locale]');
 if(!button||button.dataset.locale===lang)return;
 lang=button.dataset.locale;
 localStorage.setItem('ps-build-lang',lang);
 if(lang==='en'&&!officialEnglish)
  showStudioToast('Не все игровые описания доступны на английском.','warning');
 applyGameLocale();
};document.addEventListener('click',event=>{if(!adminEditing||!event.target.closest||event.target.closest('#ownerDock, .inline-owner-editor, #modalRoot'))return;const editable=event.target.closest('[data-edit-key]');if(editable){if(/^(?:item|itemdesc|itemslots|skill|skilldesc)\./.test(editable.dataset.editKey))return;event.preventDefault();event.stopImmediatePropagation();editor(editable)}},true);
document.addEventListener('dblclick',event=>{
 if(!adminEditing||!event.target.closest)return;
 const owner=event.target.closest('[data-owner-record]');
 if(owner&&owner.dataset.ownerField){
  const [type,id]=owner.dataset.ownerRecord.split(':');
  event.preventDefault();event.stopImmediatePropagation();
  wikiOwnerText(owner,type,id,owner.dataset.ownerField,
   {multiline:!['name','nameEn'].includes(owner.dataset.ownerField)});
  return;
 }
 const editable=event.target.closest('[data-edit-key]');
 if(!editable||!/^(?:item|itemdesc|itemslots|skill|skilldesc)\./.test(editable.dataset.editKey))return;
 event.preventDefault();event.stopImmediatePropagation();inlineWikiText(editable);
},true);
$('pathGrowthTab').onclick=()=>{heroPathPage='growth';renderPathPages();saveView()};
 $('pathSkillsTab').onclick=()=>{heroPathPage='skills';renderPathPages();saveView()};
 $('pathResetPoints').onclick=()=>{
  const spent=budgetSummary().spent;
  if(!spent)return;
  if(!confirm('Сбросить все вложенные очки навыков и зелёное мастерство? Остальная сборка и экипировка сохранятся.'))return;
  for(const b of branches)state.points[b.id]=0;
  state.mastery={};
  persist();renderBranches();refreshBudgetLabel();renderOriginStats();renderOriginVitals();
  saveView();
 };
 $('pathAutoMastery').onchange=e=>{
  window.PandoraSkillProgression.setAuto(state,e.target.checked,branches.map(b=>b.id));
  persist();renderBranches();refreshBudgetLabel();renderOriginStats();renderOriginVitals();
 };
 $('pathSkillSearch').oninput=e=>{pathSkillQuery=e.target.value;pathSkillShown=24;renderPathSkills()};
 $('pathSkillStatus').onchange=e=>{pathSkillFilter=e.target.value;pathSkillShown=24;renderPathSkills()};
 $('dockClose').onclick=closeWorkbench;
$('studioBackdrop').onclick=closeWorkbench;
$('stageQuickbar')?.addEventListener('click',event=>{
 const target=event.target.closest('[data-stage-tab]');
 if(target)changeTab(target.dataset.stageTab);
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if(!$('modalRoot').hidden)return;
  if(document.querySelector('.inline-owner-editor')){closeInlineEditor();return}
  if(stageSlotPickerOpen){closeStagePicker();return}
  if(stageAttributesPage){
   stageAttributesPage=null;renderStageAttributes();saveView();
   $('portraitBookOpen')?.focus({preventScroll:true});return;
  }
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
 const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32})(?:\/([0-9]{1,15}))?$/);
 if(!match)return;
 wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 renderDetails();showWorkbench();
}
window.addEventListener('hashchange',()=>{
 if(location.hash.startsWith('#b/')){restoreSharedHash();return}
 if(location.hash.startsWith('#wiki/')){
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32})(?:\/([0-9]{1,15}))?$/);
  if(match){
   const same=activeTab==='wiki'&&wikiSelection.type===match[1]&&
    typeof wikiRenderSelected==='function'&&wikiRenderedRoot?.isConnected&&wikiIndex;
   wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
   activeTab='wiki';
   if(same)wikiRenderSelected();else renderDetails();
   if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
   saveView();
  }
 }
});
fetch('./assets/os-icon-manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(data=>{
 const label=$('iconStatus');
 if(data?.icons&&data.count&&Number.isInteger(data.count.present)&&Number.isInteger(data.count.expected)&&data.count.present<=data.count.expected){
  if(data.count.present>0){
   iconManifest=data;
   unavailableIconIds=new Set((Array.isArray(data.missing)?data.missing:[])
    .filter(entry=>entry&&entry.error==='HTTP 404'&&
     ['skills','items','souls'].includes(entry.kind)&&
     /^[a-zA-Z0-9_-]{1,120}$/.test(String(entry.stem||'')))
    .map(entry=>entry.kind+'/'+entry.stem));
   render();
  }
  if(label)label.textContent=data.count.present>0?'Изображения загружены':'Изображения загружаются';
 }else if(label)label.textContent='Используются игровые изображения';
}).catch(()=>{const label=$('iconStatus');if(label)label.textContent='Некоторые изображения недоступны'});

// Keep Origin at least as tall as the portrait panel, without stretching it to the taller Hero Path.
function syncOriginPanelHeight(){
 const origin=document.querySelector('.workspace>.left');
 const stage=document.querySelector('.workspace>.stage');
 if(!origin||!stage)return;
 if(window.innerWidth<1201){
  origin.style.removeProperty('--character-stage-height');
  return;
 }
 const height=Math.ceil(stage.getBoundingClientRect().height);
 if(height>0)origin.style.setProperty('--character-stage-height',height+'px');
}
window.addEventListener('resize',syncOriginPanelHeight,{passive:true});
if(typeof ResizeObserver!=='undefined'){
 const portraitStage=document.querySelector('.workspace>.stage');
 if(portraitStage)new ResizeObserver(syncOriginPanelHeight).observe(portraitStage);
}
for(const [id,key] of [['originGuildHp','guildHp'],['originGuildMp','guildMp']]){
 const select=$(id);
 if(select)select.addEventListener('change',()=>setVitalsEnhancement(key,select.value));
}
$('originLifeSign')?.addEventListener('change',event=>
 setVitalsEnhancement('lifeSign',event.target.checked));
$('originHonorTitle')?.addEventListener('change',event=>setAttributeBuff('honorTitle',event.target.value));
for(const [id,key] of [['originGuildAll','guildAll'],['originGuildArouse','guildArouse'],
 ['originProeliumPotency','proeliumPotency'],
 ['originGuildLifeRecovery','guildLifeRecovery'],['originGuildManaRecovery','guildManaRecovery'],
 ['originGuildHealing','guildHealing']]){
 $(id)?.addEventListener('change',event=>setAttributeBuff(key,event.target.value));
}
for(const [id,key] of [['originUsePotionEffects','potionEffectsEnabled'],
 ['originCombatLunge','combatLunge'],['originCombatWarCry','combatWarCry'],
 ['originCombatRage','combatRage'],['originCombatDefender','combatDefender']]){
 $(id)?.addEventListener('change',event=>setAttributeBuff(key,event.target.checked));
}
render();loadCatalog();loadOverrides();
void window.PandoraAccountUI.init({
 baseUrl:API,legacyKey:()=>tabGuestSecret,
 onLogin:({register})=>{
  // New registration adopts the guest library because its existing D1 owner hash
  // is intentionally bound to that browser key. Logging into a different existing
  // account never transfers another owner's cached saves.
  activateLibraryScope({carry:Boolean(register)});
  libraryChangeId++;
  void loadCloudBuilds();
  if(activeTab==='builds')renderDetails();
 },
 onLogout:()=>{
  // Restore the previous guest's own saves and draft, not a different account's.
  activateLibraryScope();
  libraryChangeId++;
  void loadCloudBuilds();
  if(activeTab==='builds')renderDetails();
 },
 onGuest:()=>{void loadCloudBuilds()}
}).catch(error=>{console.warn('Account UI unavailable',error);void loadCloudBuilds()});
// Return to a saved library after network loss; an unsaved draft is never uploaded.
let lastCloudReconnect=0;
function resumeCloudLibrary(){
 if(!builds.length&&!queuedDeletes().length)return;
 if(Date.now()-lastCloudReconnect<20000)return;
 lastCloudReconnect=Date.now();
 void loadCloudBuilds();
}
window.addEventListener('online',resumeCloudLibrary);
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible'&&navigator.onLine)resumeCloudLibrary();
});
requestAnimationFrame(syncOriginPanelHeight);
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
fetch('./data/localization/remaked-skill-identity.v1.json',{cache:'no-cache'})
 .then(r=>r.ok?r.json():null)
 .then(mapping=>{
  if(mapping?.originalEntries===205&&mapping?.skillLabelsById){
   approvedSkillIdNames=mapping.skillLabelsById;
   if(catalogSource)applyGameLocale();
  }
 }).catch(()=>{});
fetch('./data/os/itemForth.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null)
.then(t=>{if(t&&typeof t==='object'){gameItemForth=t;renderOriginVitals();
 if(stageAttributesPage)renderStageAttributes();}}).catch(()=>{});
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
window.addEventListener('popstate',()=>{
 if(location.hash.startsWith('#wiki/')){
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32})(?:\/([0-9]{1,15}))?$/);
  if(!match)return;
  const same=activeTab==='wiki'&&wikiSelection.type===match[1]&&
   typeof wikiRenderSelected==='function'&&wikiRenderedRoot?.isConnected&&wikiIndex;
  wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
  activeTab='wiki';
  if(same)wikiRenderSelected();else renderDetails();
 }
});
