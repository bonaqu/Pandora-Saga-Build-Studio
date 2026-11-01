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
let branches=window.PandoraGameNavigation.groups.flatMap(group=>group.branches.map(id=>({id,name:id})));
let selectedSkillGroup=bootView.groupTouched&&bootView.skillGroup===null?null:
 window.PandoraGameNavigation.groups.some(group=>group.id===bootView.skillGroup)?bootView.skillGroup:'melee';
let heroPathPage=bootView.pathPage==='skills'?'skills':'growth',pathSkillQuery='',pathSkillFilter='all',
 pathSkillShown=24,pathGroupTouched=Boolean(bootView.groupTouched);
const jobKeys=['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN','SCOUT','ARCHER','SNIPER','PREDATOR','AGENT','ASSASSIN','DISTURBANCE','ACOLYTE','PRIEST','CLERIC','ENCHANTER','ASCETIC','MONK','EXORCIST','MAGE','WIZARD','WARLOCK','CONJURER','DARKROAR','JESTER','CALAMITY'];
const slotKeys=['weapon','shield','head','body','gloves','legs','feet','cloak','ring','ring','neck','belt','ear','ear'];
const slots=[['Оружие','⚔'],['Щит','◈'],['Шлем','♜'],['Броня','♟'],['Перчатки','♧'],['Штаны','♙'],['Обувь','♧'],['Плащ','❧'],['Кольцо I','◉'],['Кольцо II','◉'],['Амулет','✥'],['Пояс','♢'],['Серьга I','✧'],['Серьга II','✧']];
function fresh(){return{race:1,gender:0,job:16,level:1,branch:3,points:Object.fromEntries(branches.map(b=>[b.id,0])),mastery:{},masteryAuto:true,stats:Object.fromEntries(STATS.map(s=>[s,0])),equipment:{},souls:{},refinements:{},gems:{},vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},attributeBuffs:{guildAll:0,honorCuriosity:false,proelium:false,proeliumPotency:0,potionEffectsEnabled:false,guildLifeRecovery:0,guildManaRecovery:0,guildHealing:0},name:'Новый герой',profile:{guild:'',nation:'',rank:'',about:''},racialPassiveId:null}};
let state=fresh(),activeTab=bootView.tab==='equipment'?'wiki':(['character','builds','wiki'].includes(bootView.tab)?bootView.tab:'character'),catalog={skills:null,equipment:null,souls:null,classes:null,meta:null,racialPassives:null,live:false},selectedSkill=null,selectedSlot=0,gearMode='equipment',builds=[],override={},adminToken='',adminEditing=false,lang=localStorage.getItem('ps-build-lang')==='en'?'en':'ru',catalogSource=null,officialEnglish=null,approvedSkillIdNames=null,compareIds=[],skillSearch='',skillOnlyAvailable=false,wikiShown=100,selectedSocket=0,characterPanelTab='character',iconManifest=null,wikiData=null,wikiIndex=null,wikiPending=null,wikiSelection={type:'item',id:null,highlight:null},wikiSearch='',wikiItemType='equipment',wikiItemLayout='list';
try{const saved=localStorage.getItem('ps-build-studio.v1');if(saved){const parsed=JSON.parse(saved);state={...fresh(),...parsed,points:{...fresh().points,...parsed.points},stats:{...fresh().stats,...parsed.stats},refinements:{...fresh().refinements,...parsed.refinements},profile:{...fresh().profile,...parsed.profile}}} builds=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')}catch(e){console.warn('Saved data skipped',e)}
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
stageAttributesPage=['summary','attack','defense','recovery','effects','buffs'].includes(bootView.attributes)?bootView.attributes:null;
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
    gems:{...base.gems,...raw.gems},profile:{...base.profile,...raw.profile}}:base;
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

function h(tag,attrs={},children=[]){const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='html')throw Error('HTML injection prohibited');else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(k))el[k]=Boolean(v);else if(v!==undefined&&v!==null)el.setAttribute(k,String(v))}for(const c of [].concat(children))if(c!==null&&c!==undefined)el.append(typeof c==='string'?document.createTextNode(c):c);return el}
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
  const gem=window.PandoraEnchantModel.normalize(
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
 return window.PandoraOSCalculator.base({
  classData:clazz,raceData:gameTables?.raceInit?.[raceKey],jobData:gameTables?.jobInit?.[baseClass],
  allocation,level:state.level,records,itemForth:gameItemForth,gemSelections,
  unisonCatalog:catalogSource?.unison||null,
  consumableItems:catalogSource?.items||null,
  supplementalFlat:prayerSpirit?{spi:prayerSpirit}:{},
  supplementalSource:prayerSpirit?'Remaked Legacy: Inspiration / prayer Adeptness':null,
  enhancements:state.vitalsBuffs||{},attributeBuffs:state.attributeBuffs||{},
  potionContext:{racialPassiveId:state.racialPassiveId,jobKey:jobKeys[state.job],meleeMastery},
  combatContext:{weapon,weaponGrade,weaponPlus:gameTables?.weaponPlus,
   jobKey:jobKeys[state.job],benevolenceMastery,legacyBuffMasteries,ridingMastery,wardingMastery,
   skillCatalog:catalog.skills||{},branchMasteries,...masteries}
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
 for(const [id,key] of [['originGuildHp','guildHp'],['originGuildMp','guildMp']]){
  const select=$(id);
  if(select)select.value=String(state.vitalsBuffs?.[key]||0);
 }
 const sign=$('originLifeSign');
 if(sign)sign.checked=state.vitalsBuffs?.lifeSign===true;
 for(const [id,key] of [['originGuildAll','guildAll'],['originGuildArouse','guildArouse'],
  ['originProeliumPotency','proeliumPotency'],
  ['originGuildLifeRecovery','guildLifeRecovery'],['originGuildManaRecovery','guildManaRecovery'],
  ['originGuildHealing','guildHealing']]){
  const control=$(id);
  if(control)control.value=String(state.attributeBuffs?.[key]||0);
 }
 for(const [id,key] of [['originProelium','proelium'],['originUsePotionEffects','potionEffectsEnabled'],
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
 if(key==='honorTitle'){
  const id=Number(value);
  if(!Number.isInteger(id)||id<0||id>=window.PandoraOSCalculator.honorTitles.length)return;
  current.honorTitle=id;
  current.honorCuriosity=id===1;
 }else if(key==='honorCuriosity'){
  current.honorCuriosity=value===true;
  current.honorTitle=current.honorCuriosity?1:0;
 }else if(['proelium','potionEffectsEnabled','combatLunge','combatWarCry',
  'combatRage','combatDefender','combatWindAssist','combatWindBlessing',
  'combatConcentration'].includes(key)){
  current[key]=value===true;
  if(current.combatRage&&key==='combatRage')current.combatDefender=false;
  if(current.combatDefender&&key==='combatDefender')current.combatRage=false;
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
   if(source)window.PandoraStageItemUI.attachPreview(button,source,(rec,kind)=>itemIcon(rec,kind==='soul'?'souls':'items'));
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
    souls:plan.asSocketArray(state.souls?.[slot]).filter(Boolean).map(s=>catalog.souls?.[String(s.id)]||s)};
 });
 const cls=jobKeys[state.job],skillMap=catalog.skills||{};
 const jobBase=catalog.classes?.[cls]?.baseClass||cls;
 const innate=gameTables?.jobInit?.[jobBase]?.branches||{};
 const skillModel=window.PandoraSkillResults.create({
  catalog:skillMap,jobKey:cls,level:state.level,innate,lang,
  branchLabels:catalog.meta?.branchLabels||{},
  trained:Object.fromEntries(branches.map(b=>[
   b.id,window.PandoraSkillProgression.trained(state,b.id)]))
 });
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
  availability,combatSkillCards,skillModel,honorTitles:window.PandoraOSCalculator.honorTitles,
  itemById:id=>catalogSource?.items?.[String(id)]||null,
  onItem:id=>openWiki('item',String(id)),
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
   gems:state.gems?.[plan.refinementKey(selectedSlot,equipped)],
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
    const choice=window.PandoraEnchantModel.normalize(entry);
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
  btn.append(h('span',{},[h('b',{text:skill.name}),h('small',{text:selected?'✓ Выбрано':'Выбрать'})]));root.append(btn);skillHover(btn,skill);
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

let wikiRenderSelected=null,wikiRenderedRoot=null;
async function loadWiki(){
 if(wikiIndex)return wikiIndex;
 if(wikiPending)return wikiPending;
 wikiPending=(async()=>{
  const loaded=await window.PandoraWikiCatalog.load({api:API,fetcher:fetch});
  const index=window.PandoraWikiData.build(loaded.data);
  wikiData=loaded.data;
  wikiIndex=index;
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
 const href='#wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+(highlight==null?'':'/'+encodeURIComponent(highlight));
 return h('a',{class:'wiki-link',href,text,onclick:event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();openWiki(type,id,highlight);
 }});
}
function renderWiki(root){
 wikiRenderedRoot=root;
 const browse=h('div',{class:'wiki-list'}),detail=h('article',{class:'wiki-page'});
 const controls=h('div',{class:'wiki-controls'}),categories=h('div',{class:'wiki-categories'});
 const wt=(ru,en)=>lang==='en'?en:ru;
 let wikiSourceShown=80,wikiSourceRecord='';
 for(const [key,ru,en]of[['item','Экипировка','Equipment'],['monster','Монстры','Monsters'],['map','Локации','Locations'],['npc','NPC-обмен','NPC trades'],['chest','Сундуки','Chests'],['instance','Подземелья','Dungeons'],['skill','Навыки','Skills'],['soul','Души','Souls']]){
  categories.append(h('button',{class:wikiSelection.type===key?'chosen':'',text:lang==='en'?en:ru,onclick:()=>{wikiSelection={type:key,id:null,highlight:null};wikiSearch='';wikiShown=100;renderDetails()}}));
 }
 const search=h('input',{type:'search',value:wikiSearch,placeholder:lang==='en'?'Search by name or description':'Поиск по названию или описанию','aria-label':lang==='en'?'Search encyclopedia':'Поиск по энциклопедии'});
 controls.append(categories,search);
 if(wikiSelection.type==='item'){
  const equipmentTypes=[['equipment',wt('Экипировка','Equipment')],['all',wt('Все предметы','All items')],
   ...[['weapon','Оружие','Weapons'],['shield','Щиты','Shields'],
    ['head','Шлемы','Helmets'],['body','Броня','Armor'],
    ['gloves','Перчатки','Gloves'],['legs','Поножи','Leg armor'],
    ['feet','Обувь','Boots'],['cloak','Плащи','Cloaks'],
    ['ring','Кольца','Rings'],['neck','Амулеты','Amulets'],
    ['belt','Пояса','Belts'],['ear','Серьги','Earrings']]
    .map(([id,ru,en])=>[id,wt(ru,en)])];
  const typeSelect=h('select',{class:'wiki-equipment-type',
   'aria-label':wt('Вид предметов','Item type'),onchange:event=>{
    wikiItemType=event.target.value;wikiShown=100;wikiSelection={...wikiSelection,id:null,highlight:null};if(wikiIndex)draw()
   }});
  for(const [id,label]of equipmentTypes){
   const option=h('option',{value:id,text:label});
   if(id===wikiItemType)option.selected=true;
   typeSelect.append(option);
  }
  const view=h('div',{class:'wiki-equipment-view',role:'group',
   'aria-label':wt('Вид каталога','Catalog view')});
  for(const [id,ru,en]of[['list','☰ Список','☰ List'],['grid','▦ Сетка','▦ Grid']])
   view.append(h('button',{type:'button',text:wt(ru,en),
    'aria-pressed':String(wikiItemLayout===id),class:wikiItemLayout===id?'chosen':'',
    onclick:()=>{wikiItemLayout=id;renderDetails()}}));
  controls.append(h('div',{class:'wiki-equipment-toolbar'},[typeSelect,view]));
 }
 const layout=h('div',{class:'wiki-layout'});
 layout.append(browse,detail);root.append(controls,layout);
 const dataName=(type,id)=>{
  const obj=type==='item'?(wikiData.items?.[id]||wikiData.souls?.[id]):
   type==='chest'?wikiData.items?.[id]:wikiIndex.records(type)?.[id];
  const en=type==='map'?(officialEnglish?.maps?.[id]?.n||
   officialEnglish?.tradeMaps?.[id]?.n):officialEnglish?.[
   type==='item'||type==='chest'?'items':type==='npc'?'tradeNpcs':
   type==='monster'?'monsters':type==='instance'?'instances':
   type==='skill'?'skills':type==='soul'?'souls':'']?.[id]?.n;
  const fallback=lang==='en'?
    {item:'Unnamed item',monster:'Unnamed monster',map:'Location',npc:'NPC',
     chest:'Chest',skill:'Unnamed skill',soul:'Unnamed soul',instance:'Dungeon'}:
    {item:'Предмет без названия',monster:'Монстр без названия',
     map:'Локация',npc:'Персонаж',chest:'Сундук',skill:'Умение без названия',
     soul:'Душа без названия',instance:'Подземелье'};
   return lang==='en'&&en?en:obj?.name||fallback[type]||'Без названия';
 };
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
  const hasSoul=Boolean(wikiData.souls?.[id]),kind=hasSoul?'soul':'item';
  const record=hasSoul?wikiData.souls?.[id]:wikiData.items?.[id];
  const dest=record?kind:'item';
  return withIcon(wikiLink(label,dest,id,highlight),record?wikiIcon(kind,id,record):null,dest);
 };
 const draw=(detailOnly=false)=>{
  const previousScroll=browse.scrollTop,previousDetailScroll=detail.scrollTop;
  const sourceKey=wikiSelection.type+':'+String(wikiSelection.id??'');
  if(wikiSourceRecord!==sourceKey){wikiSourceShown=80;wikiSourceRecord=sourceKey}
  if(!detailOnly)browse.replaceChildren();
  detail.replaceChildren();
  const type=wikiSelection.type;
  const knownMaps=wikiIndex.records('map');
  const records=wikiIndex.records(type);
  const results=wikiIndex.search(type,wikiSearch,id=>dataName(type,id))
   .filter(([,rec])=>type!=='item'||wikiItemType==='all'||
    (wikiItemType==='equipment'?slotKeys.includes(rec.slot):rec.slot===wikiItemType));
  browse.classList.toggle('wiki-gear-grid',type==='item'&&wikiItemLayout==='grid');
  const selectedIndex=wikiSelection.id==null?-1:results.findIndex(([id])=>id===wikiSelection.id);
  const visible=selectedIndex>=wikiShown?
   [results[selectedIndex],...results.slice(0,wikiShown)]:results.slice(0,wikiShown);
  if(!detailOnly){
   browse.append(h('p',{class:'muted',text:lang==='en'?'Showing '+visible.length+' of '+results.length+' entries':'Показано '+visible.length+' из '+results.length+' записей'}));
   for(const [id,rec]of visible){
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
   detail.append(h('small',{class:'eyebrow',text:typeLabel[type]||'Сведения'}),
    h('h3',{text:dataName(type,id)}));
  if(type==='item'||type==='chest'||type==='soul'){
    const img=wikiImage(wikiIcon(type,id,rec),'wiki-record-icon wiki-item-portrait',type);
    if(img)detail.prepend(img);
  }
  const described=type==='chest'?wikiData.items?.[id]:rec;
  const englishDescription=lang==='en'?(officialEnglish?.[
   type==='item'||type==='chest'?'items':type==='soul'?'souls':
   type==='monster'?'monsters':type==='skill'?'skills':'maps']?.[id]?.d):null;
  if(described?.desc){
   const text=englishDescription||described.desc;
   detail.append(h('p',{class:'wiki-description',text:
    ['item','chest','soul'].includes(type)?window.PandoraItemPresentation.description(text):text}));
  }
  const moreSources=rows=>{
   if(rows.length<=wikiSourceShown)return;
   detail.append(h('button',{type:'button',class:'wiki-more',text:wt('Показать ещё ','Show more ')+
    Math.min(80,rows.length-wikiSourceShown)+' / '+(rows.length-wikiSourceShown),
    onclick:()=>{wikiSourceShown+=80;draw(true)}}));
  };
  if(type==='item'){
    const dl=h('dl',{class:'item-fields'});
    const itemFields=[
     [wt('Тип','Type'),window.PandoraItemPresentation.kind(rec,lang)],
     [wt('Уровень','Level'),rec.level],
     [wt('Атака','Attack'),rec.W],
     [wt('Пробитие','Penetration'),rec.PEN],
     [wt('Защита','Defense'),rec.AC],
     [wt('Скорость атаки','Attack speed'),rec.atkspeed],
     [wt('Дальность','Range'),rec.range],
     [wt('Гнёзда душ','Soul sockets'),rec.soulslot]
    ];
    for(const [label,value]of itemFields)if(value!=null)
     dl.append(h('dt',{text:label}),h('dd',{text:String(value)}));
    if(rec.twoHanded===true)dl.append(h('dt',{text:wt('Хват','Grip')}),
     h('dd',{text:wt('Двуручное','Two-handed')}));
    detail.append(dl);
    if(rec.classes&&Object.keys(rec.classes).length){
     const classes=Object.keys(rec.classes).filter(id=>rec.classes[id]);
     if(classes.length)detail.append(h('div',{class:'wiki-allowed-classes'},[
      h('h4',{text:wt('Доступные классы','Eligible classes')}),
      h('p',{text:classes.map(id=>catalog.classes?.[id]?.name||id).join(' · ')})
     ]));
    }
    const wearers=window.PandoraUIPlanner.outfitWearers(rec,lang);
    if(wearers?.length)detail.append(h('p',{class:'wiki-item-wearers',
     text:wt('Для: ','Wearable by: ')+wearers.join(' · ')}));
    detail.append(h('h4',{text:wt('Где получить','How to obtain')}));
    const found=wikiIndex.sources(id);
    if(!found.length)detail.append(h('p',{class:'muted',text:'Подтверждённые источники в доступном каталоге не найдены.'}));
    for(const row of found.slice(0,wikiSourceShown)){
     const line=h('div',{class:'wiki-entry'+(wikiSelection.highlight===String(row.id)?' highlighted':'')});
     if(row.type==='monster'){
      line.append(wikiLink('Монстр: '+dataName('monster',row.id)+(row.percent!=null?' · '+row.percent+'% по таблице':'')+(row.kind==='conditional'?' · условный дроп':''),'monster',row.id,id));
      for(const loc of wikiIndex.locations(row.id).slice(0,3))if(loc.type==='map')line.append(wikiLink('◈ '+loc.name,'map',loc.id,row.id));
     }else if(row.type==='npc')line.append(wikiLink('Обмен у '+dataName('npc',row.id),'npc',row.id,id));
     else if(row.type==='chest')line.append(withIcon(wikiLink(dataName('chest',row.id)+' · группа '+row.roll+
      (row.percent==null?'':' · '+row.percent+'% в группе'),'chest',row.id,id),wikiIcon('chest',row.id)));
     else line.append(wikiLink('Групповой дроп, локация '+dataName('map',row.id)+' (точный шанс предмета неизвестен)','map',row.id,id));
     detail.append(line);
    }
    moreSources(found);
    const usedIn=wikiIndex.materialUses(id);
    if(usedIn.length){
     detail.append(h('h4',{text:(lang==='en'?'Used in NPC trades · ':'Используется в обмене NPC · ')+usedIn.length}));
     for(const trade of usedIn.slice(0,wikiSourceShown)){
      const entry=h('div',{class:'wiki-entry'});
      entry.append(itemLink(trade.i,dataName('item',trade.i),id));
      for(const npcId of (trade.npc||[]).slice(0,5))
       entry.append(wikiLink(dataName('npc',npcId),'npc',npcId,trade.i));
      detail.append(entry);
     }
     moreSources(usedIn);
    }
  }else if(type==='skill'){
    const skillFields=[
     [wt('Уровень героя','Hero level'),rec.charLevel],
     [wt('Затраты ОМ','MP cost'),rec.mana],
     [wt('Подготовка, с','Cast, sec'),rec.cast],
     [wt('Перезарядка, с','Cooldown, sec'),rec.cooldown],
     [wt('Дальность','Range'),rec.range]
    ];
    const dl=h('dl',{class:'item-fields'});
    for(const [label,value] of skillFields)if(value!=null)
     dl.append(h('dt',{text:label}),h('dd',{text:String(value)}));
    detail.append(dl,h('h4',{text:wt('Требования','Requirements')}));
    if(!rec.reqs?.length)detail.append(h('p',{class:'muted',text:wt('Ветка требований не указана','No branch requirement listed')}));
    for(const req of rec.reqs||[])detail.append(h('p',{class:'wiki-entry',text:(wikiData.meta?.branchLabels?.[req.branch]||req.branch)+' ≥ '+req.amount}));
    if(rec.prereq!=null&&wikiData.skills?.[rec.prereq])detail.append(wikiLink((lang==='en'?'Prerequisite: ':'Предыдущее умение: ')+dataName('skill',rec.prereq),'skill',rec.prereq));
    if(rec.classes&&Object.keys(rec.classes).length){
     const names=Object.keys(rec.classes).filter(name=>rec.classes[name]);
     if(names.length)detail.append(h('p',{class:'muted',text:(lang==='en'?'Classes: ':'Классы: ')+names.map(id=>catalog.classes?.[id]?.name||id).join(', ')}));
    }
    const icon=skillIcon(rec.branch,id,rec);
    if(icon){const image=wikiImage(icon,'wiki-record-icon',type);detail.prepend(image)}
  }else if(type==='soul'){
    const slotLabel=slot=>window.PandoraItemPresentation.slotLabel(slot,lang);
    const traits=h('div',{class:'wiki-soul-traits'});
    for(const slot of rec.slots||[])traits.append(h('span',{text:slotLabel(slot)}));
    if(rec.price!=null)traits.append(h('span',{text:wt('Стоимость: ','Cost: ')+Number(rec.price).toLocaleString(lang==='en'?'en-US':'ru-RU')}));
    if(traits.childElementCount)detail.append(traits);
    detail.append(h('h4',{text:wt('Где получить душу','How to obtain this Soul')}));
    const found=wikiIndex.sources(id);
    if(!found.length)detail.append(h('p',{class:'muted',text:
     'Источник получения в доступном каталоге не указан.'}));
    for(const row of found.slice(0,wikiSourceShown)){
     const line=h('div',{class:'wiki-entry wiki-soul-source'});
     if(row.type==='monster'){
      line.append(wikiLink('Монстр: '+dataName('monster',row.id)+
       (row.percent==null?'':' · '+row.percent+'% по таблице')+
       (row.kind==='conditional'?' · особое условие':''),'monster',row.id,id));
      for(const loc of wikiIndex.locations(row.id).slice(0,3))
       if(loc.type==='map')line.append(wikiLink('◈ '+loc.name,'map',loc.id,row.id));
     }else if(row.type==='npc')line.append(wikiLink('Обмен у '+dataName('npc',row.id),
      'npc',row.id,id));
     else if(row.type==='chest')line.append(withIcon(wikiLink(dataName('chest',row.id)+
      ' · группа '+row.roll+(row.percent==null?'':' · '+row.percent+'% в группе'),
      'chest',row.id,id),wikiIcon('chest',row.id)));
     else if(row.type==='zone')line.append(wikiLink('Дроп локации: '+dataName('map',row.id)+
      ' · точный шанс души не указан','map',row.id,id));
     detail.append(line);
    }
    moreSources(found);
  }else if(type==='monster'){
    const monsterStats=[[wt('Уровень','Level'),rec.level],[wt('ОЗ','HP'),rec.life],
     [wt('Защита','Defense'),rec.ac],[wt('Маг. защита','Magic defense'),rec.magicProtection],
     [wt('Защитный показатель','Warding'),rec.warding],[wt('Сила','Strength'),rec.str],
     [wt('Выносливость','Vitality'),rec.vit],[wt('Ловкость','Agility'),rec.agi],
     [wt('Проворство','Dexterity'),rec.dex],[wt('Дух','Spirit'),rec.spi],
     [wt('Интеллект','Intelligence'),rec.int]];
    detail.append(h('div',{class:'wiki-monster-stats'},
     monsterStats.filter(([,value])=>Number.isFinite(value)).map(([label,value])=>
      h('div',{class:'wiki-monster-stat'},[
       h('small',{text:label}),h('strong',{text:Number(value).toLocaleString('ru-RU')})]))));
    if(rec.resists&&Object.keys(rec.resists).length){
     const names=lang==='en'?{physical:'Physical',fire:'Fire',cold:'Ice',
      lightning:'Lightning',poison:'Poison',charm:'Charm',magic:'Magic',
      holy:'Holy',dark:'Dark'}:
      {physical:'Физическая',fire:'Огонь',cold:'Лёд',
       lightning:'Молния',poison:'Яд',charm:'Чары',
       magic:'Магия',holy:'Свет',dark:'Тьма'};
     const box=h('details',{class:'wiki-monster-resists'},[
      h('summary',{text:wt('Сопротивления монстра','Monster resistances')})
     ]);
     for(const [key,value] of Object.entries(rec.resists))
      box.append(h('span',{text:(names[key]||key)+': '+value}));
     detail.append(box);
    }
    detail.append(h('h4',{text:wt('Места появления','Spawn locations')}));
    for(const loc of wikiIndex.locations(id))detail.append(wikiLink(loc.name,loc.type,loc.id,id));
    detail.append(h('h4',{text:wt('Выпадающие предметы','Dropped items')}));
    for(const row of wikiIndex.drops(id)){
     const entry=h('div',{class:'wiki-entry'+(wikiSelection.highlight===row.itemId?' highlighted':'')});
     const linked=itemLink(row.itemId,dataName('item',row.itemId)+
      (row.quantity>1?' ×'+row.quantity:'')+
      (row.percent==null?'':' · '+row.percent+'%')+
      (row.kind==='conditional'?' · особый дроп':''),id);
     entry.append(linked);
     detail.append(entry);
    }
  }else if(type==='npc'){
    const locations=rec.maps||[];
    for(const mapId of locations){
     if(knownMaps[mapId])detail.append(wikiLink('◈ '+dataName('map',mapId),'map',mapId,id));
    }
    const recipes=wikiIndex.trades(id);
    detail.append(h('h4',{text:wt('Обмен · ','Trades · ')+recipes.length}));
    const recipeSearch=h('input',{type:'search',class:'wiki-inline-search',
     placeholder:wt('Найти предмет или материал…','Find an item or material…'),
     'aria-label':wt('Поиск среди обменов NPC','Search NPC trades')});
    const counter=h('small',{class:'wiki-result-counter'});
    const recipesBox=h('div',{class:'wiki-trade-list'}),cards=[];
    for(const trade of recipes){
     const entry=h('section',{class:'wiki-trade-card'+
      (wikiSelection.highlight===String(trade.i)?' highlighted':'')});
     const output=h('div',{class:'wiki-trade-output'});
     output.append(h('small',{text:wt('Получить','Receive')}),
      itemLink(trade.i,dataName('item',trade.i),id));
     entry.append(output);
     if(trade.mats?.length){
      const mats=h('div',{class:'wiki-recipe-mats'});
      mats.append(h('small',{text:wt('Необходимые материалы','Required materials')}));
      for(const material of trade.mats)
       mats.append(itemLink(material.i,dataName('item',material.i)+' ×'+(material.n??1),trade.i));
      entry.append(mats);
     }
     const currencies=[[wt('Золото','Gold'),trade.gold],[wt('Честь','Honor'),trade.honor],[wt('Опыт','Experience'),trade.exp]]
      .filter(([,value])=>Number(value)>0);
     if(currencies.length)entry.append(h('div',{class:'wiki-trade-cost',text:
      currencies.map(([name,value])=>name+': '+Number(value).toLocaleString('ru-RU')).join(' · ')}));
     const searchText=wikiIndex.normalize([dataName('item',trade.i),
      ...(trade.mats||[]).map(m=>dataName('item',m.i))].join(' '));
     recipesBox.append(entry);cards.push({entry,searchText});
    }
    const filterRecipes=()=>{
     const query=wikiIndex.normalize(recipeSearch.value);
     let visible=0;
     for(const card of cards){
      card.entry.hidden=!!query&&!card.searchText.includes(query);
      if(!card.entry.hidden)visible++;
     }
     counter.textContent=lang==='en'?visible+' of '+cards.length:visible+' из '+cards.length;
    };
    recipeSearch.addEventListener('input',filterRecipes);
    detail.append(recipeSearch,counter,recipesBox);filterRecipes();
  }else if(type==='map'||type==='instance'){
    if(rec.blurb)detail.append(h('p',{class:'wiki-description',text:rec.blurb}));
    const mobs=rec.mobs||[];
    if(mobs.length){
     const roster=mobs.map(mob=>({id:mob,mon:wikiData.monsters?.[mob]}));
     const levels=roster.map(row=>row.mon?.level).filter(Number.isFinite);
     const levelRange=levels.length?' · ур. '+Math.min(...levels)+
      (Math.max(...levels)!==Math.min(...levels)?'–'+Math.max(...levels):''):'';
     detail.append(h('h4',{text:'Монстры · '+mobs.length+levelRange}));
     const search=h('input',{type:'search',class:'wiki-inline-search',
      placeholder:wt('Поиск монстра…','Search monsters…'),
      'aria-label':wt('Поиск монстра в локации','Search monsters in this location')});
     const list=h('div',{class:'wiki-map-monsters'}),rows=[];
     for(const {id:mob,mon} of roster.sort((a,b)=>(a.mon?.level??999)-
      (b.mon?.level??999)||dataName('monster',a.id).localeCompare(dataName('monster',b.id),'ru'))){
      const entry=h('div',{class:'wiki-entry wiki-mob-row'+
       (wikiSelection.highlight===String(mob)?' highlighted':'')});
      entry.append(wikiLink(dataName('monster',mob)+
       (mon?.level!=null?' · ур. '+mon.level:''),'monster',mob));
      list.append(entry);rows.push({entry,name:wikiIndex.normalize(dataName('monster',mob))});
     }
     search.addEventListener('input',()=>{
      const q=wikiIndex.normalize(search.value);
      for(const row of rows)row.entry.hidden=!!q&&!row.name.includes(q);
     });
     detail.append(search,list);
    }
    if(type==='map'){
     const residents=wikiIndex.residents(id);
     if(residents.length){
      detail.append(h('h4',{text:wt('NPC в локации','NPCs in this location')}));
      for(const [npcId] of residents)
       detail.append(wikiLink(dataName('npc',npcId),'npc',npcId));
     }
     const dropZones=wikiIndex.zones(id);
     if(dropZones.length){
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
  }else{
    detail.append(h('h4',{text:wt('Содержимое сундука по группам','Chest contents by groups')}));
    for(const [i,group]of(rec.rolls||[]).entries()){
     detail.append(h('p',{class:'muted',text:wt('Группа ','Group ')+(i+1)}));
     for(const row of group){
      const entry=h('div',{class:'wiki-entry'+(wikiSelection.highlight===String(row.i)?' highlighted':'')});
      entry.append(itemLink(row.i,dataName('item',row.i)+
       (row.n&&row.n!==1?' ×'+row.n:'')+
       (row.p==null?'':' · '+row.p+'% внутри группы'),id));detail.append(entry);
     }
    }
  }
  if(detailOnly)detail.scrollTop=previousDetailScroll;
 };
 wikiRenderSelected=()=>{
  if(!root.isConnected||!wikiIndex)return;
  const present=[...browse.querySelectorAll('[data-wiki-record]')].some(
   row=>row.getAttribute('data-wiki-record')===wikiSelection.id);
  draw(present);
 };
 search.addEventListener('input',()=>{wikiSearch=search.value;wikiShown=100;browse.scrollTop=0;if(wikiIndex)draw()});
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
     profile:{...base.profile,...draft.profile}};
    restoreLoadedBuildUI();persist();render();changeTab('character');

}
function unsavedBuild(){
 const s=JSON.stringify(state);
 return s!==JSON.stringify(fresh())&&!builds.some(b=>JSON.stringify(b.data)===s);
}
function newBlankBuild(){
 selectActiveBuild(null);state=fresh();originActive='race';jobPathKey=null;classTreeTouched=false;
 expandedClassKeys=new Set();restoreLoadedBuildUI();persist();render();renderOriginTabs();
 changeTab('character');saveView();
}
let buildSearchQuery='';
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
 const choice=h('div',{class:'new-build-choice',hidden:true});
 const draft=h('input',{type:'text',maxLength:'70',value:state.name||'Новый герой','aria-label':'Название сохраняемого черновика'});
 choice.append(h('span',{text:'Текущий персонаж ещё не сохранён.'}),
  h('div',{class:'new-build-choice-actions'},[
   draft,
   h('button',{type:'button',class:'button-action primary',text:'Сохранить и создать',onclick:()=>{if(saveBuild(draft.value))newBlankBuild()}}),
   h('button',{type:'button',class:'button-action',text:'Создать без сохранения',onclick:newBlankBuild}),
   h('button',{type:'button',class:'button-action',text:'Отмена',onclick:()=>{choice.hidden=true}})
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
   if(!unsavedBuild()){newBlankBuild();return}
   choice.hidden=!choice.hidden;
   if(!choice.hidden){draft.value=name.value||state.name||'Новый герой';draft.focus()}
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
  overwriteChoice.append(h('p',{text:'Перезаписать этот сохранённый билд текущими локальными изменениями?'}),
   h('button',{type:'button',class:'button-action primary',text:'Подтвердить перезапись',onclick:()=>{
    if(saveBuild(state.name,b.id))showStudioToast(window.PandoraUILocale.ui(
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
   ...(activeBuildId===b.id?[h('button',{class:'button-action primary',
    text:'↻ Перезаписать',onclick:()=>{
     overwriteChoice.hidden=!overwriteChoice.hidden;
     if(!overwriteChoice.hidden)overwriteChoice.querySelector('button')?.focus({preventScroll:true});
    }})]:[]),
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
 const existingIndex=overwriteId&&overwriteId===activeBuildId?
  builds.findIndex(b=>b.id===overwriteId):-1;
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
  for(const [key,limit] of [['guildLifeRecovery',2],['guildManaRecovery',2],['guildHealing',3],['guildArouse',3]]){
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
  error.httpStatus=response.status;error.reason=data.reason||null;throw error;
 }
 return data;
}
function showAdmin(){const body=h('div');body.append(h('p',{class:'muted',text:adminToken?'Режим редактора подтверждён сервером. Изменения сохраняются в Cloudflare D1.':'Вход администратора защищён сервером Cloudflare Worker. Никаких паролей в GitHub Pages нет.'}));if(adminToken){body.append(h('button',{class:'button-action',text:'Импорт каталога D1',onclick:showCatalogImport}));body.append(h('button',{class:'button-action primary',text:adminEditing?'Выключить редактирование':'Включить редактирование',onclick:()=>{adminEditing=!adminEditing;$('modalRoot').hidden=true;render();updateAdminHint()}}),h('button',{class:'button-action',text:'Выйти',onclick:async()=>{try{await apiRequest('/api/admin/logout',{})}catch{}adminToken='';adminEditing=false;ownerEdits.length=0;closeInlineEditor();$('modalRoot').hidden=true;render();updateAdminHint()}}));modal('Управление сайтом',body);return}
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

function syncLocaleControls(){
 for(const button of document.querySelectorAll('#locale [data-locale]')){
  const active=button.dataset.locale===lang;
  button.classList.toggle('chosen',active);
  button.setAttribute('aria-pressed',String(active));
 }
}
function applyGameLocale(){
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
 const meta={...catalogSource.meta};
 if(en?.branches)meta.branchLabels={...meta.branchLabels,...en.branches};
 // Verified ID-based Remaked names only; never fuzzy-translate at runtime.
 const localizedSkills=translate(catalogSource.skills,en?.skills);
 if(lang==='ru'){
  for(const [id,name] of Object.entries(approvedSkillIdNames||{})){
   if(localizedSkills[id])localizedSkills[id]={...localizedSkills[id],name};
  }
  for(const [id,name] of Object.entries(window.PandoraGameNavigation.approvedRacialSkillNames)){
   if(localizedSkills[id])localizedSkills[id]={...localizedSkills[id],name};
  }
 }
 catalog={meta,classes:translate(catalogSource.classes,en?.classes),skills:localizedSkills,
   equipment:translate(catalogSource.items,en?.items,true),souls:translate(catalogSource.souls,en?.souls),racialPassives:catalogSource.racialPassives,live:true};
 jobs=jobKeys.map(id=>catalog.classes[id]?.name||id);
 branches=window.PandoraGameNavigation.groups.flatMap(g=>g.branches.map(id=>({id,name:meta.branchLabels[id]||id})));
 render();
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
async function loadOverrides(){try{const response=await apiRequest('/api/overrides',null,'');override=response.values||{};render();updateAdminHint()}catch{ /* Not deployed or CORS restricted; static site remains usable. */ }}
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
};document.addEventListener('click',event=>{if(!adminEditing||!event.target.closest||event.target.closest('#ownerDock, .inline-owner-editor, #modalRoot'))return;const editable=event.target.closest('[data-edit-key]');if(editable){if(/^(?:item|itemdesc|itemslots)\./.test(editable.dataset.editKey))return;event.preventDefault();event.stopImmediatePropagation();editor(editable)}},true);
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
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15})(?:\/([0-9]{1,15}))?$/);
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
for(const [id,key] of [['originProelium','proelium'],['originUsePotionEffects','potionEffectsEnabled'],
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
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance)\/([0-9]{1,15})(?:\/([0-9]{1,15}))?$/);
  if(!match)return;
  const same=activeTab==='wiki'&&wikiSelection.type===match[1]&&
   typeof wikiRenderSelected==='function'&&wikiRenderedRoot?.isConnected&&wikiIndex;
  wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
  activeTab='wiki';
  if(same)wikiRenderSelected();else renderDetails();
 }
});
