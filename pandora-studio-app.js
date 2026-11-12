// Pandora Saga Build Studio — client-side character planner.
// No invented combat formulas. Historical catalog is labelled explicitly.
'use strict';
const $=id=>document.getElementById(id);
// One matching rule for the equipment picker and owner encyclopedia pickers.
// Terms may be reordered or separated by extra whitespace; ё/е match, too.
const searchWords=(text,query)=>{
 const normalize=value=>String(value??'').normalize('NFKC')
  .toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const searchable=normalize(text);
 return normalize(query).split(' ').filter(Boolean)
  .every(term=>searchable.includes(term));
};
const startupOverlay=$('startupOverlay');
let startupFinishId=0;
function startupMessage(ru,en,locale=lang){
 startupOverlay.hidden=false;
 startupOverlay.classList.remove('is-finished');
 startupOverlay.dataset.state='loading';
 startupOverlay.dataset.language=locale;
 startupOverlay.setAttribute('aria-label',locale==='en'?'Loading game data':'Загрузка игровых данных');
 $('startupStatus').textContent=locale==='en'?en:ru;
}
function startupDone(){
 const token=++startupFinishId;
 startupOverlay.classList.add('is-finished');
 setTimeout(()=>{
  if(token===startupFinishId&&startupOverlay.classList.contains('is-finished'))
   startupOverlay.hidden=true;
 },420);
}
function startupError(error){
 console.warn('Build Studio startup failed',error);
 startupOverlay.hidden=false;startupOverlay.classList.remove('is-finished');
 startupOverlay.dataset.state='error';
 startupOverlay.setAttribute('aria-label',lang==='en'?'Game data unavailable':'Игровые данные недоступны');
 $('startupStatus').textContent=lang==='en'?
  'Could not load game data. Try again or open the saved copy.':
  'Не удалось загрузить игровые данные. Повтори загрузку или открой сохранённую копию.';
}
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
 soulQuery:stageSoulQuery,wikiLayout:wikiItemLayout,wikiSkillFilter,
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
const englishGearSlots=['Weapon','Shield','Helmet','Armor','Gloves','Pants','Boots','Cloak',
 'Ring I','Ring II','Amulet','Belt','Earring I','Earring II'];
const gearSlotName=index=>lang==='en'?englishGearSlots[index]:slots[index][0];
// Game rule codes remain unchanged; localize their public explanation only.
function gearIssueLabel(message){
 if(lang!=='en')return message;
 const en={
  'Выберите расу и профессию':'Choose a race and class',
  'Предмет отсутствует в каталоге':'Item is missing from the catalog',
  'Предмет не подходит этому слоту':'Item cannot be equipped in this slot',
  'Броня занимает также слот штанов':'Armor also occupies the pants slot',
  'Не подходит происхождению героя':'Race requirement is not met',
  'Это декоративный предмет':'Cosmetic equipment',
  'Двуручное оружие занимает обе руки':'Two-handed weapon occupies both hands',
  'Нет данных':'Item data unavailable','Другой слот':'Different equipment slot',
  'Не подходит классу':'Class requirement is not met'
 };
 const value=String(message||'');
 return en[value]||value.replace(/^Требуется уровень (\d+)$/,'Requires level $1');
}
function fresh(){return{race:null,gender:0,job:null,level:1,branch:3,points:Object.fromEntries(branches.map(b=>[b.id,0])),mastery:{},masteryFormat:2,masteryAuto:true,stats:Object.fromEntries(STATS.map(s=>[s,0])),equipment:{},souls:{},soulOwners:{},socketCapacities:{},refinements:{},gems:{},vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},attributeBuffs:{guildAll:0,honorCuriosity:false,mounted:false,proelium:false,proeliumPotency:0,potionEffectsEnabled:false,guildLifeRecovery:0,guildManaRecovery:0,guildHealing:0,guildLevel:0,priestEnabled:true,priestSpi:134,priestBlessing:90,priestHymn:30,priestBenevolence:61,priestExorcism:26,priestGratia:false,priestLapisMedio:false,priestEncouragement:false,resistanceSkillIds:[],remakedSkillIds:[]},name:'Новый герой',profile:{guild:'',nation:'',rank:'',about:''},racialPassiveId:null}};
let state=fresh(),activeTab=bootView.tab==='equipment'?'wiki':(['character','builds','wiki'].includes(bootView.tab)?bootView.tab:'character'),catalog={skills:null,equipment:null,souls:null,classes:null,meta:null,racialPassives:null,live:false},selectedSkill=null,selectedSlot=0,gearMode='equipment',builds=[],override={},adminToken='',adminEditing=false,lang=localStorage.getItem('ps-build-lang')==='en'?'en':'ru',catalogSource=null,officialEnglish=null,approvedSkillIdNames=null,compareIds=[],skillSearch='',skillOnlyAvailable=false,wikiShown=100,selectedSocket=0,characterPanelTab='character',iconManifest=null,wikiData=null,wikiIndex=null,wikiPending=null,wikiSelection={type:'item',id:null,highlight:null},wikiSearch='',wikiItemType='equipment',wikiElementFilter='all',wikiEffectFilter='all',wikiSkillFilter=['player','racial','guild','special','variants','other','unknown','all'].includes(bootView.wikiSkillFilter)?bootView.wikiSkillFilter:'player',wikiItemLayout=bootView.wikiLayout==='grid'?'grid':'list',wikiItemEligibility='all';
// A damaged browser draft must not prevent the independent saved-build library
// from loading. Keep the original storage untouched for manual recovery.
function safeStoredBuildRows(value){
 return Array.isArray(value)?window.PandoraBuildLibraryMerge.orderByCreation(
  value.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)&&
   typeof row.id==='string'&&row.id.length>0&&
   row.data&&typeof row.data==='object'&&!Array.isArray(row.data))):[];
}
try{
 const saved=localStorage.getItem('ps-build-studio.v1');
 if(saved){
  const parsed=JSON.parse(saved);
  if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
   const base=fresh(),record=value=>value&&typeof value==='object'&&
    !Array.isArray(value)?value:{};
   state={...base,...parsed,
    points:{...base.points,...record(parsed.points)},
    mastery:{...base.mastery,...record(parsed.mastery)},
    stats:{...base.stats,...record(parsed.stats)},
    equipment:{...base.equipment,...record(parsed.equipment)},
    souls:{...base.souls,...record(parsed.souls)},
    soulOwners:{...base.soulOwners,...record(parsed.soulOwners)},
    socketCapacities:{...base.socketCapacities,...record(parsed.socketCapacities)},
    refinements:{...base.refinements,...record(parsed.refinements)},
    gems:{...base.gems,...record(parsed.gems)},
    vitalsBuffs:{...base.vitalsBuffs,...record(parsed.vitalsBuffs)},
    attributeBuffs:{...base.attributeBuffs,...record(parsed.attributeBuffs)},
    profile:{...base.profile,...record(parsed.profile)}};
  }
 }
}catch(error){console.warn('Character draft could not be restored',error)}
try{
 builds=safeStoredBuildRows(JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]'));
}catch(error){builds=[];console.warn('Saved build list could not be parsed',error)}
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
stageSoulScrollTop=0,stageGemQuery='',gameTables=null,gameItemForth=null,
stageAttributesPage=['summary','attack','defense','buffs','effects','recovery'].includes(bootView.attributes)?bootView.attributes:null;
if(Number.isInteger(bootView.slot)&&bootView.slot>=0&&bootView.slot<slots.length)selectedSlot=bootView.slot;
// A failed draft write must be visible, even when the user is not in My Builds.
// Show just one persistent status, not a toast for every slider movement.
function draftStorageStatus(failed){
 const id='draftStorageWarning';
 let element=document.getElementById(id);
 if(!failed){element?.remove();return}
 if(!element){
  element=document.createElement('div');
  element.id=id;
  element.className='draft-storage-warning';
  element.setAttribute('role','alert');
  element.append(document.createElement('strong'),document.createElement('span'));
  document.body.append(element);
 }
 if(element.dataset.lang===lang)return;
 element.dataset.lang=lang;
 element.querySelector('strong').textContent=lang==='en'?
  'Character changes not saved':'Изменения героя не сохранены';
 element.querySelector('span').textContent=lang==='en'?
  'They may be lost after reloading. Free up browser storage or allow this site to save data.':
  'После перезагрузки изменения могут пропасть. Освободи место в браузере или разреши сайту сохранять данные.';
}
// Current character changes remain a local draft until explicit user save.
function persist(){
 try{
  const committed=window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
   'ps-build-studio.v1',JSON.stringify(state));
  draftStorageStatus(committed!==true);
  return committed;
 }catch(error){
  console.warn('Draft could not be stored locally',error);
  draftStorageStatus(true);return false;
 }
}
function persistBuilds(){
 try{return window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
  'ps-build-library.v1',JSON.stringify(builds))}
 catch(error){console.warn('Build library could not be stored locally',error);return false}
}
const CLOUD_TOKEN_KEY='ps-build-library-secret.v1';
const CLOUD_DELETES_KEY='ps-build-library-pending-deletes.v1';
let libraryChangeId=0,cloudLoadRequestId=0;
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
 // Another tab can switch the shared primary keys between transition()
 // and restoration. Read the requested owner's independent recovery cache
 // whenever those keys currently belong to a different account.
 const readOwned=key=>window.PandoraBuildScope.getOwned(
  localStorage,libraryScopeId(),key);
 try{
  const raw=JSON.parse(readOwned('ps-build-studio.v1')||'null');
  const base=fresh(),record=value=>value&&typeof value==='object'&&
   !Array.isArray(value)?value:{};
  state=raw&&typeof raw==='object'&&!Array.isArray(raw)?
   {...base,...raw,points:{...base.points,...record(raw.points)},
    mastery:{...base.mastery,...record(raw.mastery)},
    masteryFormat:raw.masteryFormat===2?2:1,
    stats:{...base.stats,...record(raw.stats)},
    equipment:{...base.equipment,...record(raw.equipment)},
    souls:{...base.souls,...record(raw.souls)},
    soulOwners:{...base.soulOwners,...record(raw.soulOwners)},
    socketCapacities:{...base.socketCapacities,...record(raw.socketCapacities)},
    refinements:{...base.refinements,...record(raw.refinements)},
    gems:{...base.gems,...record(raw.gems)},
    vitalsBuffs:{...base.vitalsBuffs,...record(raw.vitalsBuffs)},
    attributeBuffs:{...base.attributeBuffs,...record(raw.attributeBuffs)},
    profile:{...base.profile,...record(raw.profile)}}:base;
 }catch{state=fresh()}
 try{
  const rows=JSON.parse(readOwned('ps-build-library.v1')||'[]');
  builds=safeStoredBuildRows(rows);
 }catch{builds=[]}
 const ownedActive=readOwned(ACTIVE_BUILD_KEY);
 activeBuildId=/^[a-f0-9]{32}$/.test(ownedActive||'')&&
  builds.some(row=>row.id===ownedActive)?ownedActive:null;
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
async function cloudLibraryRequest(payload){
 if(!window.PandoraAccountUI?.isLoggedIn()){
  const error=new Error('Войдите в аккаунт, чтобы работать с билдами');
  error.reason='sign_in_required';throw error;
 }
 // A switching owner or revoked session must never redirect a request into
 // another account or to an obsolete guest-key library.
 const expectedOwner=tabOwnerScope;
 const credential=window.PandoraAccountUI?.token()||null;
 if(!expectedOwner||!expectedOwner.startsWith('account:')||
  tabOwnerScope!==expectedOwner||libraryScopeId()!==expectedOwner||!credential){
  const error=new Error('Владелец библиотеки изменился: облачный запрос не отправлен');
  error.reason='owner_changed';throw error;
 }
 const bearer=credential;
 // An unreachable Worker must not leave "Checking cloud" spinning forever.
 const signal=typeof AbortSignal!=='undefined'&&
  typeof AbortSignal.timeout==='function'?AbortSignal.timeout(payload?25000:20000):null;
 const response=await fetch(API+'/api/library',{method:payload?'POST':'GET',
  headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},
  ...(signal?{signal}:{}),
  ...(payload?{body:JSON.stringify(payload)}:{})});
 let data;try{data=await response.json()}catch{throw Error('Нет ответа облачного сервера')}
 if(!response.ok){
  const error=new Error(data?.error||'Облачный сервер недоступен');
  error.httpStatus=response.status;error.reason=data?.reason||null;throw error;
 }
 return data;
}
function cloudStatusText(message){
 // A cloud-connected guest is not signed in to an account library.
 const label=!window.PandoraAccountUI?.isLoggedIn()&&
  message==='Облачная библиотека подключена'?
  'Гостевая облачная библиотека подключена':message;
 return window.PandoraUILocale?.ui(label,lang)||label;
}
function reportCloudStatus(message){
 cloudLibraryStatus=message;
 const node=document.querySelector('.cloud-library-status');
 if(node)node.textContent=cloudStatusText(message);
}
async function putCloudBuild(entry){
 if(!window.PandoraAccountUI?.isLoggedIn())return false;
 // This guard also protects accidental call sites added in future changes.
 if(entry?.localOnly===true)return false;
 const owner=libraryScopeId(),generation=libraryChangeId;
 try{
  await cloudLibraryRequest({action:'put',entry});
  if(libraryScopeId()===owner&&libraryChangeId===generation)
   reportCloudStatus('Сохранено в облаке');
  return true;
 }catch(error){
  console.warn('Build cloud save failed',error);
  if(libraryScopeId()===owner&&libraryChangeId===generation)reportCloudStatus(
   error.reason==='stale'||error.reason==='conflict'?
    'В облаке другая редакция · обновите библиотеку для сохранения обеих версий':
    error.reason==='unavailable'?
     'Сохранено в браузере · исходная облачная запись недоступна':
    error.reason==='deleted'?
     'Сохранено в браузере · исходный билд в облаке уже удалён':
    error.reason==='owner_changed'?
     'Аккаунт изменился · синхронизация остановлена':
     'Сохранено только в этом браузере · облако недоступно. Обнови библиотеку после восстановления соединения.');
  return false;
 }
}
// A batch must report the result of ALL records. An earlier failed PUT
// cannot be hidden by a later successful response from the same import.
async function uploadSharedBuildBatch(entries,owner,generation){
 let confirmed=0;
 for(const entry of entries){
  if(libraryScopeId()!==owner||libraryChangeId!==generation)return;
  if(await putCloudBuild(entry))confirmed++;
 }
 if(libraryScopeId()!==owner||libraryChangeId!==generation)return;
 reportCloudStatus(confirmed===entries.length?
  (lang==='en'?'All imported builds saved to cloud':'Все добавленные билды сохранены в облаке'):
  (lang==='en'?
   'Saved to cloud: '+confirmed+' of '+entries.length+
    '. Other builds remain in this browser. Refresh your library to retry.':
   'Сохранено в облаке: '+confirmed+' из '+entries.length+
    '. Остальные пока только в браузере. Обнови библиотеку для повторной попытки.'));
}
async function deleteCloudBuild(id){
 if(!window.PandoraAccountUI?.isLoggedIn())return false;
 const owner=libraryScopeId();
 let queued=false;
 try{queueDelete(id);queued=true}
 catch(error){console.warn('Cannot persist pending deletion',error)}
 libraryChangeId++;
 const generation=libraryChangeId;
 try{
  await cloudLibraryRequest({action:'delete',id});
  // Only the owner who initiated deletion can clear its local pending tombstone.
  if(libraryScopeId()!==owner)return;
  if(queued)acknowledgeDelete(id);
  // Always clear the old tombstone, but only the latest user action owns
  // the visible cloud status and notification.
  if(libraryChangeId!==generation)return;
  reportCloudStatus('Билд удалён · все его ссылки отозваны');
  showStudioToast('Билд удалён. Все его ссылки больше не работают.','success');
 }catch(error){
  console.warn('Build cloud delete pending',error);
  if(libraryScopeId()!==owner||libraryChangeId!==generation)return;
  reportCloudStatus(queued?'Удалено в браузере · синхронизируем позже':
   'Не удалось записать удаление для повторной отправки');
  showStudioToast(queued?
   'Билд удалён локально. Ссылки перестанут работать после синхронизации с облаком.':
   'Облако недоступно. Повторное удаление не удалось поставить в очередь — пока ссылка может работать.','warning');
 }
}
async function loadCloudBuilds(){
 if(!window.PandoraAccountUI?.isLoggedIn())return;
 const generation=libraryChangeId,requestId=++cloudLoadRequestId;
 const latest=()=>requestId===cloudLoadRequestId;
 let pendingDeleteFailures=0;
 try{
  for(const id of queuedDeletes()){
   if(libraryChangeId!==generation||!latest())return;
   try{
    await cloudLibraryRequest({action:'delete',id});
    if(libraryChangeId!==generation||!latest())return;
    acknowledgeDelete(id);
   }catch(error){
    if(libraryChangeId!==generation||!latest())return;
    // A failed revocation must remain queued, but must not hide every
    // other healthy cloud build. The pending ID is filtered by reconcile().
    pendingDeleteFailures++;
    console.warn('Pending cloud deletion will be retried',error);
   }
  }
  const response=await cloudLibraryRequest();
  // A manual refresh can overtake an older request for the same owner:
  // only the newest GET is allowed to reconcile the visible library.
  if(!latest())return;
  if(!Array.isArray(response.records))throw Error('Некорректная библиотека');
  // A click while GET was in flight must not bring back a deleted or old character.
  if(libraryChangeId!==generation){void loadCloudBuilds();return}
  const reconciled=window.PandoraBuildLibraryMerge.reconcile({
   local:builds,remote:response.records,pendingDeletes:queuedDeletes(),
   activeId:activeBuildId,newId,lang
  });
  const {outgoing,copies,unavailable}=reconciled;
  const beforeMerge=builds;
  builds=reconciled.merged;
  if(!persistBuilds()){
   // Never announce recovered copies as durable or upload local revisions
   // if the browser cannot commit the full reconciliation.
   builds=beforeMerge;
   reportCloudStatus('Не удалось сохранить облачные билды в браузере');
   showStudioToast('Недостаточно места для сохранения библиотеки. Освободи место в браузере.','error');
   return;
  }
  if(reconciled.activeId!==activeBuildId)selectActiveBuild(reconciled.activeId);
  refreshBuildsAfterCloudLoad();
  reportCloudStatus(outgoing.length?'Синхронизируем локальные изменения…':
   builds.some(entry=>entry.localOnly===true)?
    'Облако подключено · локальные копии ещё не сохранены':
    'Облачная библиотека подключена');
  for(const entry of outgoing){
   if(libraryChangeId!==generation)break;
   if(!latest())break;
   const current=builds.find(x=>x.id===entry.id);
   if(!current||current.at!==entry.at||queuedDeletes().includes(entry.id))continue;
   await putCloudBuild(entry);
  }
  if(copies&&libraryChangeId===generation&&latest()){
   reportCloudStatus('Облачная версия основная · локальные отличия сохранены отдельной копией');
   showStudioToast('Обнаружены разные версии билда. Обе сохранены отдельно в библиотеке.','warning');
  }
  if(unavailable&&libraryChangeId===generation&&latest())
   reportCloudStatus((lang==='en'?
    'Some cloud builds are unavailable · original records are preserved':
    'Некоторые облачные билды недоступны · исходные записи сохранены')+
    ' ('+unavailable+')');
  if(pendingDeleteFailures&&libraryChangeId===generation&&latest())
   reportCloudStatus('Библиотека загружена · удаление некоторых ссылок ещё не подтверждено');
 }catch(error){
  console.warn('Cloud library unavailable',error);
  if(libraryChangeId===generation&&latest())
   reportCloudStatus('Не удалось загрузить облачные билды. Локальные копии не удалены. Проверь соединение и нажми «Обновить библиотеку».');
 }
}

function h(tag,attrs={},children=[]){const el=document.createElement(tag);
 if(tag==='input'||tag==='textarea'){
  const hint=String(attrs.autocomplete||'').toLowerCase();
  // A search for a user/login is still SEARCH, not an authentication form.
  // Password managers must only detect credential inputs explicitly marked
  // as such; arbitrary Russian/English placeholder text is never proof.
  const isLogin=String(attrs.type||'').toLowerCase()==='password'||
   ['username','current-password','new-password'].includes(hint)||
   attrs['data-auth-field']==='true';
  if(!isLogin){
   // Yandex's own webmaster guidance recommends the invalid token "none"
   // for ordinary site fields. "off" may still trigger stored logins.
   // This is best-effort; never relabel genuine account credentials.
   attrs={...attrs,autocomplete:'none','data-lpignore':'true','data-1p-ignore':'true',
    'data-bwignore':'true','data-form-type':'other',
    autocapitalize:'off',spellcheck:'false'};
   if(['text','search','email','url','tel'].includes(String(attrs.type||'text').toLowerCase()))
    attrs['aria-autocomplete']='none';
  }
 }
for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='html')throw Error('HTML injection prohibited');else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(['disabled','checked','selected','hidden','required','readOnly','multiple'].includes(k))el[k]=Boolean(v);else if(v!==undefined&&v!==null)el.setAttribute(k,String(v))}for(const c of [].concat(children))if(c!==null&&c!==undefined)el.append(typeof c==='string'?document.createTextNode(c):c);
 if(tag==='input'&&String(attrs.type||'').toLowerCase()==='number')window.PandoraNumericField?.prepare(el);
 return el}
function imageUrl(name){return `assets/${name}.webp`}
const BRANCH_ICON_PATHS={"slash":"assets/skills/legacy/01-00.png","thrust":"assets/skills/legacy/02-00.png","brush":"assets/skills/legacy/03-00.png","blow":"assets/skills/legacy/04-00.png","defense":"assets/skills/legacy/05-00.png","archery":"assets/skills/legacy/07-00.png","alchemy":"assets/skills/legacy/08-00.png","assassin":"assets/skills/legacy/09-00.png","trap":"assets/skills/legacy/10-00.png","warding":"assets/skills/legacy/11-00.png","benevolence":"assets/skills/legacy/13-00.png","blessing":"assets/skills/legacy/14-00.png","exorcism":"assets/skills/legacy/15-00.png","hymn":"assets/skills/legacy/16-00.png","element":"assets/skills/legacy/18-00.png","embody":"assets/skills/legacy/19-00.png","darkness":"assets/skills/legacy/20-00.png","charm":"assets/skills/legacy/21-00.png","riding":"assets/skills/legacy/24-00.png"};
let unavailableIconIds=new Set();
function branchIcon(id){return typeof id==='string'&&Object.hasOwn(BRANCH_ICON_PATHS,id)?BRANCH_ICON_PATHS[id]:null}
// Verified via user-provided client locale manifests and four PNGs:
 // the two original race-skill drawings are intentionally swapped in RU/EN.
 // Both drawings already exist locally, so no new game art is distributed.
function localizedRaceSkillStem(stem,language){
 if(language!=='ru')return stem;
 if(stem==='skill_900050003')return 'skill_900060003';
 if(stem==='skill_900060003')return 'skill_900050003';
 return stem;
}
function skillIcon(cat,idx,record=null){
 const custom=override['visual.skill.'+(record?.id??(cat+'.'+idx))];
 if(custom)return custom;
 if(record?.iconId){
  const stem='skill_'+record.iconId,originals=iconManifest?.icons?.skills||{};
  // The client uses the opposite existing sprite for these two race
  // passives in Russian. Owner-assigned visual.skill.* still wins above.
  const localeStem=localizedRaceSkillStem(stem,lang);
  if(localeStem!==stem&&originals[stem]&&originals[localeStem])
   return originals[localeStem];
  // Exact original always beats a display-only reuse.
  if(originals[stem])return originals[stem];
  const source=iconManifest?.displayAliases?.skills?.[stem];
  if(source&&originals[source])return originals[source];
  // For newer D1-only skill records absent from the checked-in snapshot,
  // reuse art only when the displayed names match exactly. Memoize by source
  // references so large encyclopedia lists do not rescan on every card.
  const previous=skillIcon.nameIndex;
  if(!previous||previous.catalog!==catalog.skills||
     previous.wiki!==wikiData?.skills||previous.manifest!==iconManifest){
   const byName=new Map();
   for(const sourceSkills of [catalog.skills,wikiData?.skills]){
    for(const candidate of Object.values(sourceSkills||{})){
     const path=originals['skill_'+candidate?.iconId];
     const key=String(candidate?.name||'').normalize('NFKC')
      .trim().toLocaleLowerCase('ru').replace(/\s+/g,' ');
     if(path&&key&&!byName.has(key))byName.set(key,path);
    }
   }
   skillIcon.nameIndex={catalog:catalog.skills,wiki:wikiData?.skills,
    manifest:iconManifest,byName};
  }
  const key=String(record.name||'').normalize('NFKC')
   .trim().toLocaleLowerCase('ru').replace(/\s+/g,' ');
  const match=skillIcon.nameIndex.byName.get(key);
  if(match)return match;
 }
 // An iconless skill uses the transparent, original-client question mark.
 // This is a presentation fallback, NOT an original for its missing OS ID.
 if(record)return 'assets/skills/icons/skill_unknown.webp';
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
 // Missing/unknown originals are never probed on every encyclopedia hover.
 // The local verified artwork manifest is the only image authority.
 return null;
}
function branchCap(branch){
 // No invented cap: when a game class is still loading, disable spending until real caps exist.
 return window.PandoraStudioRules.branchCap(catalog.classes,jobKeys[state.job],branch)??0;
}
function equipmentIssue(item,slot,snap=state){
 if(!Number.isInteger(snap.race)||!Number.isInteger(snap.job))
  return ['Выберите расу и профессию'];
 if(!item)return ['Предмет отсутствует в каталоге'];
 if(!window.PandoraEquipmentPlan.matchesEquipmentSlot(slot,item,slotKeys))
  return ['Предмет не подходит этому слоту'];
 const rules=window.PandoraStudioRules.equipment(item,{
  slot:slotKeys[slot],job:jobKeys[snap.job],level:snap.level
 });
 const missing=[...rules.missing];
 // One-piece armor must never award a second pair of trouser stats,
 // including if an old saved build has conflicting physical slots.
 if(slot===5&&snap.equipment?.[3]){
  const body=catalog.equipment?.[String(snap.equipment[3].id)];
  if(window.PandoraUIPlanner.occupiesBodyAndLegs(body))
   missing.push('Броня занимает также слот штанов');
 }
 if(!window.PandoraUIPlanner.raceCompatible(item,snap.race,snap.gender))
  missing.push('Не подходит происхождению героя');
 if(item.isCostumeOverlay===true||String(item.kind||'').startsWith('DECO_'))
  missing.push('Это декоративный предмет');
 if(slot===1&&item.slot==='shield'){
  const source=snap.equipment?.[0];
  const weapon=source&&catalog.equipment?.[String(source.id)];
  const usable=weapon&&window.PandoraStudioRules.equipment(weapon,{
   slot:'weapon',job:jobKeys[snap.job],level:snap.level
  }).allowed&&window.PandoraUIPlanner.raceCompatible(weapon,snap.race,snap.gender)&&
   weapon.isCostumeOverlay!==true&&!String(weapon.kind||'').startsWith('DECO_');
  if(window.PandoraEquipmentPlan.occupiesOffhand(weapon,Boolean(usable)))
   missing.push('Двуручное оружие занимает обе руки');
 }
 return missing;
}
function branchCapacities(snap=state){
 const klass=catalog.classes?.[jobKeys[snap.job]];
 return klass?.branchCaps||{};
}
function trainedBranchMasteries(innate={},snap=state){
 const caps=branchCapacities(snap);
 return Object.fromEntries(branches.map(({id})=>[
  id,window.PandoraSkillProgression.branchMastery(snap,id,innate,caps)
 ]));
}
function previewBaseStats(snap=state){
 // A new build has no game identity until both choices are explicit.
 if(!Number.isInteger(snap.race)||!Number.isInteger(snap.job)||
  snap.race<0||snap.race>=races.length||snap.job<0||snap.job>=jobKeys.length)return null;
 const clazz=catalog.classes?.[jobKeys[snap.job]],raceKey=window.PandoraGameNavigation.raceKeys[snap.race];
 const baseClass=clazz?.baseClass||jobKeys[snap.job];
 const allocation=Object.fromEntries(['vit','str','agi','dex','spi','int'].map((key,i)=>[key,Number(snap.stats?.[STATS[i]]||0)]));
 const records=[],gemSelections=[];
 for(const [slot,selection] of Object.entries(snap.equipment||{})){
  const item=selection&&catalog.equipment?.[String(selection.id)];
  if(!item||equipmentIssue(item,Number(slot),snap).length)continue;
  const grade=window.PandoraEquipmentPlan.refinementValue(snap.refinements,Number(slot),selection);
  records.push(['item:'+item.id,item,grade]);
  const gem=window.PandoraEnchantModel.normalizeForSlot(item.slot,
   snap.gems?.[window.PandoraEquipmentPlan.refinementKey(Number(slot),selection)]);
  if(gem)gemSelections.push({slot:item.slot,itemId:item.id,grade,gem});
  const souls=window.PandoraEquipmentPlan.asSocketArray(snap.souls?.[slot]);
  const capacity=window.PandoraEquipmentPlan.equippedSocketCapacity(snap,Number(slot),selection,item);
  for(let i=0;i<(window.PandoraEquipmentPlan.supportsSoulSlot(slotKeys[Number(slot)])?(capacity??0):0);i++){
   const soul=souls[i]&&catalog.souls?.[String(souls[i].id)];
   if(soul&&window.PandoraEquipmentPlan.validSoul(soul,slotKeys[Number(slot)]))
    records.push(['soul:'+soul.id,soul,grade]);
  }
 }
 const initialBranches=innateBranches(snap);
 const weaponSelection=snap.equipment?.[0];
 const selectedWeapon=weaponSelection&&catalog.equipment?.[String(weaponSelection.id)]||null;
 const weapon=selectedWeapon&&!equipmentIssue(selectedWeapon,0,snap).length?selectedWeapon:null;
 const weaponGrade=weaponSelection&&weapon?
  window.PandoraEquipmentPlan.refinementValue(snap.refinements,0,weaponSelection):0;
 const caps=branchCapacities(snap);
 const prayerSpirit=window.PandoraSkillProgression.legacyPrayerSpirit(
  jobKeys[snap.job],snap,initialBranches,caps);
 // A branch's initial allocated points are not trained green.
 // Only actual green mastery, manual or the optional auto preview, can
 // contribute to passive modifiers and learned-skill requirements.
 const masteries=window.PandoraSkillProgression.combatMasteries(snap,initialBranches,caps);
 // Pass every trained branch to the OS skill gates; future catalog skills
 // may require more than the original Slash mastery.
 const branchMasteries=trainedBranchMasteries(initialBranches,snap);
 const ridingMastery=window.PandoraSkillProgression.groupAdeptness(snap,['riding'],initialBranches,caps);
 const wardingMastery=window.PandoraSkillProgression.groupAdeptness(snap,['warding'],initialBranches,caps);
 const meleeMastery=masteries.melee;
 const benevolenceMastery=window.PandoraSkillProgression.groupAdeptness(
  snap,['benevolence'],initialBranches,caps);
 const legacyBuffMasteries=Object.fromEntries(['blessing','hymn','alchemy']
  .map(branch=>[branch,window.PandoraSkillProgression.groupAdeptness(
   snap,[branch],initialBranches,caps)]));
 const guildLevel=Number(snap.attributeBuffs?.guildLevel)||0;
 const unlocked=window.PandoraOSCalculator.guildPassiveAtLevel(guildLevel);
 const effectiveGuildBuffs={
  vitals:guildLevel>0&&unlocked?
   {...snap.vitalsBuffs,guildHp:unlocked.guildHp,guildMp:unlocked.guildMp}:
   snap.vitalsBuffs||{},
  attributes:guildLevel>0&&unlocked?
   {...snap.attributeBuffs,guildLifeRecovery:unlocked.guildLifeRecovery,
    guildManaRecovery:unlocked.guildManaRecovery}:snap.attributeBuffs||{}
 };
 return window.PandoraOSCalculator.base({
  classData:clazz,raceData:gameTables?.raceInit?.[raceKey],jobData:gameTables?.jobInit?.[baseClass],
  allocation,level:snap.level,records,itemForth:gameItemForth,gemSelections,
  unisonCatalog:catalogSource?.unison||null,
  consumableItems:catalogSource?.items||null,
  supplementalFlat:prayerSpirit?{spi:prayerSpirit}:{},
  supplementalSource:prayerSpirit?'Remaked Legacy: Inspiration / prayer Adeptness':null,
  enhancements:effectiveGuildBuffs.vitals,attributeBuffs:effectiveGuildBuffs.attributes,
  // A restored/shared build must never apply a passive from another race.
  // Normalize numeric-string legacy IDs through the same canonical owner list
  // used by the racial selection UI before *any* calculation runs.
  potionContext:{racialPassiveId:window.PandoraGameNavigation.canonicalRacialPassiveId(
   catalog.racialPassives,snap.race,snap.racialPassiveId),
   jobKey:jobKeys[snap.job],meleeMastery},
  combatContext:{weapon,weaponGrade,weaponPlus:gameTables?.weaponPlus,
   magicPlus:gameTables?.magicPlus,
   jobKey:jobKeys[snap.job],benevolenceMastery,legacyBuffMasteries,ridingMastery,wardingMastery,
   skillCatalog:catalog.skills||{},branchMasteries,
   externalPriest:{enabled:snap.attributeBuffs?.priestEnabled===true,
    spi:snap.attributeBuffs?.priestSpi||0,
    blessing:snap.attributeBuffs?.priestBlessing||0,
    hymn:snap.attributeBuffs?.priestHymn||0,
    benevolence:snap.attributeBuffs?.priestBenevolence||0,
    exorcism:snap.attributeBuffs?.priestExorcism??26},...masteries}
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
function renderOriginVitals(calculated=undefined){
 // The supported calculator returns rounded numeric totals. Parity with all server
 // buffs, sets and conditional effects is still unverified; don't imply otherwise.
 if(calculated===undefined)calculated=previewBaseStats();
 const hp=$('originHp'),mp=$('originMp');
 const hpReady=calculated&&Number.isFinite(calculated.hp);
 const mpReady=calculated&&Number.isFinite(calculated.mp);
 if(hp)hp.textContent=hpReady?String(calculated.hp):'—';
 if(mp)mp.textContent=mpReady?String(calculated.mp):'—';
 renderPotionPreview(calculated);
 const holder=$('originVitals');
 if(holder){
  const notice=hpReady&&mpReady?
   (lang==='en'?'HP '+calculated.hp+', MP '+calculated.mp:
    'ОЗ '+calculated.hp+', ОМ '+calculated.mp):
   (lang==='en'?'HP and MP will appear when game data have loaded.':
    'ОЗ и ОМ появятся после загрузки игровых данных.');
  holder.setAttribute('aria-label',notice);
  holder.title=''; // Never show a second browser tooltip above game UI.
 }
 // The Book shares this exact derived snapshot with the vitals panel.
 // Recalculating here would add a full combat pass to every input change.
 refreshOpenHeroBook(calculated);
}

function renderVitalsEnhancements(calculated=undefined){
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
 if(calculated===undefined)calculated=previewBaseStats();
 const potion=$('originPotionRecovery');
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
 state.vitalsBuffs=current;persist();
 const calculated=previewBaseStats();
 renderOriginVitals(calculated);renderVitalsEnhancements(calculated);
 
}
function setAttributeBuff(key,value){
 const current={guildAll:0,honorCuriosity:false,honorTitle:null,proelium:false,proeliumPotency:0,potionEffectsEnabled:false,guildLifeRecovery:0,guildManaRecovery:0,guildHealing:0,
  ...(state.attributeBuffs||{})};
 if(key.startsWith('legacySkill:')){
  const id=Number(key.slice('legacySkill:'.length));
  const definition=window.PandoraRemakedBuffs?.definitions
   .find(item=>item.id===id&&!item.existing);
  if(!definition||!Number.isSafeInteger(id))return;
  const selected=new Set(window.PandoraRemakedBuffs.selectedIds(current.remakedSkillIds));
  if(value===true)selected.add(id);else selected.delete(id);
  current.remakedSkillIds=[...selected].sort((a,b)=>a-b);
  // Old saves may keep Divine Blessing in elemental resistance selections.
  // Its Ally Buff switch now owns this effect; clear the old alias on change.
  if(id===330004001&&Array.isArray(current.resistanceSkillIds))
   current.resistanceSkillIds=current.resistanceSkillIds.filter(x=>x!==330004001);
 }else if(key.startsWith('resistSkill:')){
  const id=Number(key.slice('resistSkill:'.length));
  if(!Number.isSafeInteger(id)||!window.PandoraOSCalculator
   .resistanceSkillChoices(catalog.skills||{}).some(row=>row.id===id))return;
  // Elemental skills are exclusive, but a legacy save may contain the
  // independent Divine Blessing alias. Keep that unrelated buff intact.
  if(id===330004001)return;
  const oldDivine=Array.isArray(current.resistanceSkillIds)&&
   current.resistanceSkillIds.includes(330004001);
  current.resistanceSkillIds=[
   ...(oldDivine?[330004001]:[]),
   ...(value===true?[id]:[])
  ];
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
  'combatConcentration','priestEnabled','priestGratia','priestLapisMedio','priestEncouragement',
  'mounted'].includes(key)){
  current[key]=value===true;
  if(current.combatRage&&key==='combatRage')current.combatDefender=false;
  if(current.combatDefender&&key==='combatDefender')current.combatRage=false;
 }else if(key==='guildLevel'){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>12)return;
  current.guildLevel=n;
 }else if(['priestSpi','priestBlessing','priestHymn','priestBenevolence','priestExorcism'].includes(key)){
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
 }else if(['guildLifeRecovery','guildManaRecovery','guildHealing',
  'guildPhysicalReduction','guildMagicReduction','guildExperience'].includes(key)){
  if(key!=='guildHealing'&&Number(current.guildLevel)>0)return;
  const n=Number(value),limit=key==='guildHealing'?3:
   key==='guildExperience'?8:
   ['guildPhysicalReduction','guildMagicReduction'].includes(key)?3:2;
  if(!Number.isInteger(n)||n<0||n>limit)return;
  current[key]=n;
 }else return;
 state.attributeBuffs=current;
 persist();
 const calculated=previewBaseStats();
 renderOriginStats(calculated);renderOriginVitals(calculated);
 renderVitalsEnhancements(calculated);
 
}
function budgetSummary(){
 return window.PandoraSkillProgression.spending(gameTables?.abilityPoint,state.level,state.points);
}
function innateBranches(snap=state){
 const jobKey=jobKeys[snap.job],baseClass=catalog.classes?.[jobKey]?.baseClass||jobKey;
 // The starting branch allocation belongs to the chosen root class and
 // exists before any level-up spending; it does NOT imply trained green.
 return baseClass&&gameTables?.jobInit?.[baseClass]?.branches||{};
}
function allowedBranch(branch){
 const b=budgetSummary(),cap=branchCap(branch),model=window.PandoraSkillProgression;
 const current=model.potential(state,branch),base=model.branchBase(innateBranches(),branch);
 // Every branch has an absolute class limit in 0..90. Starting branch
 // points are already allocated, so free points can fill only cap-base.
 if(b.total===null||!catalog.classes?.[jobKeys[state.job]]||cap===0)return current;
 return Math.max(current,Math.min(Math.max(0,cap-base),Math.max(0,b.total-b.spent+current)));
}

function editableValue(key,defaultValue){
 if(!Object.hasOwn(override,key))return defaultValue;
 // A legacy owner race override can equal the original Russian name
 // exactly. That is not a request to replace its English translation.
 if(lang==='en'&&/^race\.[0-5]$/.test(key)){
  const id=Number(key.slice(5));
  if(override[key]===races[id]?.[0])return defaultValue;
 }
 return override[key];
}
// Reuse the existing authenticated, bilingual D1 guide store. The established
// book.origin.* namespace is Worker-compatible; no separate write API needed.
function originGuideKey(key){return key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase())}
function originCopy(key,ru,en){
 const entry=window.PandoraHonorGuide?.field(override,'origin.'+originGuideKey(key),ru,en);
 return lang==='en'?(entry?.en||en):(entry?.ru||ru);
}

// Editable, bilingual equipment captions share the existing D1 guide namespace.
// These are display labels only; edit actions never touch item stats or saved builds.
function ownerCopyKey(section,key){
 return section+'.'+String(key).replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
}
function ownerCopy(section,key,ru,en){
 const entry=window.PandoraHonorGuide?.field(override,ownerCopyKey(section,key),ru,en);
 return lang==='en'?(entry?.en||en):(entry?.ru||ru);
}
function ownerCopyLabel(node,section,key,ru,en,{onCommitted,onFinished}={}){
 if(!node||!adminEditing||!adminToken)return;
 node.dataset.ownerCopySection=section;
 node.dataset.ownerCopyId=key;
 node.dataset.ownerCopyRu=ru;
 node.dataset.ownerCopyEn=en;
 node.classList.add('origin-copy-editable');
 // Captions inside real buttons already have their own pencil and handler.
 // Plain labels also need keyboard access without inserting extra controls.
 if(!node.matches?.('button,[role="button"]')&&
    !node.closest?.('button,[role="button"]')){
  node.tabIndex=0;
  node.setAttribute?.('aria-keyshortcuts','F2 Enter');
 }
 const edit=event=>{
  if(!adminEditing||!adminToken||node.querySelector?.('.wiki-inline-input'))return;
  event.preventDefault();event.stopPropagation();
  const editLang=lang; // Never write an open RU editor to the EN D1 field.
  editWikiValue(node,ownerCopy(section,key,ru,en),{
   type:'text',
   onCommit:next=>saveGuidePatch('book.'+ownerCopyKey(section,key),{[editLang]:next}),
   onCommitted:next=>{
    const visible=lang===editLang?next:ownerCopy(section,key,ru,en);
    node.textContent=visible;
    onCommitted?.(visible);
   },
   onFinished
  });
 };
 node.addEventListener('dblclick',edit);
 node.addEventListener('keydown',event=>{
  if(event.target===node&&(event.key==='F2'||event.key==='Enter'))edit(event);
 });
}
// Shared, explicit copy binding for labels, buttons and search attributes.
// Each field has a static RU/EN source and a stable D1 key. Variable game
// data (item names, active slot, levels, search queries) are never edited.
function bindOwnerInterfaceText(node,section,key,ru,en,attribute='text',suffix=''){
 if(!node)return node;
 // A search field has independently editable placeholder AND aria-label.
 // Store one descriptor per attribute: binding the second must not erase
 // the first. Never serialize its live value or user-entered search query.
 let bindings={};
 try{bindings=JSON.parse(node.dataset.ownerInterfaceBindings||'{}')}catch{}
 bindings[attribute]={section,key,ru,en,suffix};
 node.dataset.ownerInterfaceBindings=JSON.stringify(bindings);
 node.dataset.ownerInterfaceSection=section;
 node.dataset.ownerInterfaceKey=key;
 node.dataset.ownerInterfaceRu=ru;
 node.dataset.ownerInterfaceEn=en;
 node.dataset.ownerInterfaceAttribute=attribute;
 node.dataset.ownerInterfaceSuffix=suffix;
 const value=ownerCopy(section,key,ru,en)+suffix;
 if(attribute==='text')node.textContent=value;
 else node.setAttribute(attribute,value);
 return node;
}
// Commit-time update uses the exact successful inline edit value; this
// cannot accidentally revive an older default before the owner copy cache
// refreshes. Undo independently derives the restored value from D1.
function applyOwnerInterfaceEditedValue(section,key,visible){
 for(const node of document.querySelectorAll('[data-owner-interface-bindings]')){
  if(node.querySelector?.('.wiki-inline-input'))continue;
  let bindings={};
  try{bindings=JSON.parse(node.dataset.ownerInterfaceBindings||'{}')}catch{}
  for(const [attr,field] of Object.entries(bindings)){
   if(field.section!==section||field.key!==key)continue;
   const value=visible+(field.suffix||'');
   if(attr==='text')node.textContent=value;
   else if(['placeholder','aria-label','title'].includes(attr))
    node.setAttribute(attr,value);
  }
 }
}
// Compact non-modal owner-only copy editor reused by Equipment, Wiki, Skills.
// It is absent for players and never wraps a real interactive action button.
function ownerInterfaceEditor(section,rows,headingRu='Подписи интерфейса',headingEn='Interface labels'){
 if(!adminEditing||!adminToken)return null;
 const box=h('details',{class:'studio-owner-interface-editor'});
 box.append(h('summary',{text:lang==='en'?headingEn:headingRu}));
 const items=h('div',{class:'studio-owner-interface-fields'});
 for(const [key,ru,en,shortRu,shortEn] of rows){
  const label=h('span',{class:'studio-owner-interface-value',
   text:ownerCopy(section,key,ru,en)});
  ownerCopyLabel(label,section,key,ru,en,{
   onCommitted:visible=>applyOwnerInterfaceEditedValue(section,key,visible)
  });
  const pencil=h('button',{type:'button',class:'ui-content-pencil studio-owner-interface-pencil',
   text:'✎',
   'aria-label':(lang==='en'?'Edit caption: ':'Изменить надпись: ')+ownerCopy(section,key,ru,en),
   onclick:event=>{
    event.preventDefault();event.stopPropagation();
    label.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   }});
  items.append(h('div',{class:'studio-owner-interface-row'},[
   h('span',{class:'studio-owner-interface-name',
    text:lang==='en'?(shortEn||en):(shortRu||ru)}),label,pencil]));
 }
 box.append(items);
 return box;
}
const equipmentCopy=(key,ru,en)=>ownerCopy('equipment',key,ru,en);
const equipmentCopyLabel=(node,key,ru,en,options)=>
 ownerCopyLabel(node,'equipment',key,ru,en,options);
const originFixedLabels=[
 ['.workspace>.left>.panel-heading h2','heading','Происхождение','Origin'],
 ['#originTabs [data-origin-tab="race"]','tabRace','Раса','Race'],
 ['#originTabs [data-origin-tab="class"]','tabProfession','Профессия','Class'],
 ['#originTabs [data-origin-tab="stats"]','tabStats','Характеристики','Stats'],
 ['#originPanelRace [data-origin-copy-static="race"]','raceHeading','Раса','Race'],
 ['#originPanelClass [data-origin-copy-static="profession"]','professionHeading','Профессия','Profession'],
 ['#originPanelRace [data-i18n="raceSelect"]','racePrompt','Выбери расу','Choose a race'],
 ['#originPanelRace [data-i18n="racePassive"]','passiveHeading','Расовая пассивка','Racial passive'],
 ['#originPanelClass #classCount','classCount','28 классов','28 classes'],
 ['#originPanelStats [data-i18n="heroProgress"]','progressHeading','Развитие героя','Hero progression'],
 ['#originPanelStats [data-i18n="levelParameters"]','levelParameters','Уровень и параметры','Level and attributes'],
 ['#originPanelStats [data-i18n="heroLevel"]','levelHeading','Уровень героя','Hero level'],
 ['#originPanelStats [data-i18n="baseStats"]','baseHeading','Базовые характеристики','Base attributes'],
 ['#originPanelStats [data-i18n="distributePoints"]','distributeHeading','Распредели очки','Distribute points']
];
function originCopyLabel(node,key,ru,en,{pencilHost=null}={}){
 if(!node)return node;
 if(!node.querySelector?.('.wiki-inline-input,[data-owner-editor]'))
  node.textContent=originCopy(key,ru,en);
 if(!node.dataset)node.dataset={}; // lightweight browser-free test elements
 node.dataset.originCopyKey=key;
 node.dataset.originCopyRu=ru;node.dataset.originCopyEn=en;
 const editing=Boolean(adminEditing&&adminToken);
 node.classList?.toggle?.('origin-copy-editable',editing);
 if(!node.dataset.originCopyBound){
  node.dataset.originCopyBound='1';
  node.addEventListener?.('dblclick',event=>{
   if(!adminEditing||!adminToken)return;
   event.preventDefault();event.stopImmediatePropagation();
   editOriginCopyLabel(node,key,ru,en);
  },true);
 }
 if(pencilHost){
  const existing=[...pencilHost.querySelectorAll('[data-origin-edit-for]')]
   .find(x=>x.dataset.originEditFor===key);
  if(existing&&!editing)existing.remove();
  else if(existing&&editing){
   existing.setAttribute('aria-label',(lang==='en'?'Edit caption: ':'Изменить надпись: ')+originCopy(key,ru,en));
  }else if(!existing&&editing){
   pencilHost.append(h('button',{type:'button',class:'origin-copy-pencil',
    'data-origin-edit-for':key,
    'aria-label':(lang==='en'?'Edit caption: ':'Изменить надпись: ')+originCopy(key,ru,en),
    title:lang==='en'?'Edit this caption':'Изменить эту надпись',
    text:'✎',onclick:event=>{event.preventDefault();event.stopPropagation();
     editOriginCopyLabel(node,key,ru,en)}}));
  }
 }
 return node;
}
function editOriginCopyLabel(node,key,ru,en){
 if(!adminEditing||!adminToken||node.dataset.originEditing==='1')return;
 const value=originCopy(key,ru,en),isButton=node.tagName==='BUTTON';
 const mount=isButton?h('span',{class:'origin-copy-input-slot'}):node;
 if(isButton){node.after(mount);node.hidden=true}
 node.dataset.originEditing='1';
 const editLang=lang; // Capture locale before the user can switch language.
 editWikiValue(mount,value,{type:'text',
  onCommit:next=>saveGuidePatch('book.origin.'+originGuideKey(key),{[editLang]:next}),
  onCommitted:next=>{
   const visible=lang===editLang?next:originCopy(key,ru,en);
   node.textContent=visible;
   for(const pencil of document.querySelectorAll('[data-origin-edit-for]'))
    if(pencil.dataset.originEditFor===key)pencil.setAttribute('aria-label',
     (lang==='en'?'Edit caption: ':'Изменить надпись: ')+visible);
  },
  onFinished:()=>{
   node.dataset.originEditing='0';
   if(isButton){node.hidden=false;mount.remove()}
  }});
}
function renderOriginCopyLabels(){
 for(const [selector,key,ru,en] of originFixedLabels){
  const node=document.querySelector(selector);
  // Plain Origin titles and subheads need a real touch-accessible pencil.
  // Navigation tabs already own their click actions: keep those untouched.
  const pencilHost=node?.matches?.('h2')||node?.closest?.('.subhead')?
   node.parentElement:null;
  originCopyLabel(node,key,ru,en,{pencilHost});
 }
}
function editAttr(el,key){el.dataset.editKey=key;if(adminEditing)el.classList.add('admin-edit');return el}
function raceSource(i,gender){
if(!Number.isInteger(i)||i<0||i>=races.length)return 'assets/pandora-logo.png';
return override["visual.race."+i+"."+(gender?"m":"f")]||imageUrl(races[i][gender?3:2]);
}
function renderRaces(){
 const grid=$('raceGrid');grid.replaceChildren();
 const option=portraitOptions[racePreviewIndex]||portraitOptions[0],i=option.race,gender=option.gender;
 const chosen=state.race===i&&window.PandoraUIPlanner.normalizeGender(races,i,state.gender)===gender;
 const frame=h('div',{class:'race-slide-frame'+(chosen?' selected':''),'aria-live':'polite'});
 const raceName=races[i][lang==='en'?1:0];
 const sexSuffix=(i===0||i===1)?
  (gender?(lang==='en'?' · male':' · мужчина'):
   (lang==='en'?' · female':' · женщина')):'';
 const img=editAttr(h('img',{src:raceSource(i,gender),alt:raceName+sexSuffix,loading:'eager'}),
  'visual.race.'+i+'.'+(gender?'m':'f'));
 img.onerror=()=>{img.onerror=null;img.alt=lang==='en'?
   'Portrait of '+races[i][1]+' is currently unavailable':
   'Изображение '+races[i][0]+' временно недоступно'};
 const arrow=(text,step,alt)=>h('button',{type:'button',class:'race-slide-arrow '+(step<0?'previous':'next'),text,'aria-label':alt,
  onclick:()=>{racePreviewIndex=(racePreviewIndex+step+portraitOptions.length)%portraitOptions.length;renderRaces();
    grid.querySelector('.race-slide-arrow.'+(step<0?'previous':'next'))?.focus({preventScroll:true})}});
 frame.append(img,arrow('❮',-1,lang==='en'?'Previous portrait':'Предыдущий портрет'),
  arrow('❯',1,lang==='en'?'Next portrait':'Следующий портрет'));
 const chooseRace=()=>{
  if(chosen)return;
  state=window.PandoraOriginModel.selectRace(state,i,gender);
  selectedSkill=null;stageSlotPickerOpen=false;stageAttributesPage=null;
  persist();render();saveView();
 };
 img.tabIndex=0;img.setAttribute('role','button');
 img.setAttribute('aria-label',(lang==='en'?'Choose ':'Выбрать ')+img.alt);
 img.addEventListener('click',chooseRace);
 img.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseRace()}});
 const actions=h('div',{class:'race-slide-actions'});
 const select=h('button',{type:'button',class:'race-slide-select'+(chosen?' selected':''),
  'aria-pressed':String(chosen),onclick:chooseRace});
 actions.append(h('span',{class:'race-slide-position',text:(racePreviewIndex+1)+' / '+portraitOptions.length}),select);
 originCopyLabel(select,chosen?'raceChosen':'raceChoose',
  chosen?'✓ Выбрано':'Выбрать эту расу',chosen?'✓ Selected':'Choose this race',
  {pencilHost:actions});
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
 const tr=(ru,en)=>lang==='en'?en:ru;
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
 const selectedCurrent=Boolean(current&&state.job===current.i);
 for(let k=jobKeys[state.job];k&&byKey.has(k);k=parentOf(k))activeAncestors.add(k);
 const progress=h('div',{class:'class-wizard-progress','aria-label':tr('Этап выбора профессии','Class selection stages')});
 const stepNames=[['stepDirection','Направление','Direction'],
  ['stepProfession','Профессия','Profession'],
  ['stepSpecialization','Специализация','Specialization']];
 for(let i=0;i<3;i++){
  const [key,ru,en]=stepNames[i];
  const step=h('span',{class:'class-wizard-step'+(i===depth?' current':'')+(i<depth?' completed':'')+
   (i===depth&&selectedCurrent?' selected':'')});
  step.append(h('span',{text:(i+1)+'. '}),originCopyLabel(h('span'),key,ru,en));
  progress.append(step);
 }
 grid.append(progress);
 const top=h('div',{class:'class-wizard-header'});
 if(current){
  top.append(h('button',{type:'button',class:'class-back',text:tr('← Назад','← Back'),onclick:()=>{
   jobPathKey=parentOf(jobPathKey);renderJobs();saveView();
  }}));
 }
 const classTitle=h('strong',{class:'class-wizard-title',text:current?current.name:
  originCopy('classPrompt','Выберите направление','Choose a direction')});
 if(!current)originCopyLabel(classTitle,'classPrompt','Выберите направление','Choose a direction');
 top.append(classTitle);
 if(selectedProfession)top.append(h('span',{class:'class-wizard-selected',role:'status',
  text:originCopy('classSelectedPrefix','✓ Выбрано: ','✓ Selected: ')+selectedProfession.name}));
 grid.append(top);
 if(path.length){
  const crumbs=h('div',{class:'class-wizard-breadcrumbs','aria-label':tr('Вернуться на предыдущий уровень','Return to a previous class selection stage')});
  crumbs.append(h('button',{type:'button',text:tr('Все направления','All directions'),onclick:()=>{jobPathKey=null;renderJobs();saveView()}}));
  for(const node of path)crumbs.append(h('button',{type:'button',text:node.name,
   class:selectedProfession?.key===node.key?'selected':'','aria-current':node.key===jobPathKey?'step':null,
    onclick:()=>{jobPathKey=node.key;renderJobs();saveView()}}));
  grid.append(crumbs);
 }
 if(path.length){
  grid.append(h('p',{class:'class-wizard-path',text:path.map(x=>x.name).join(' › ')}));
  grid.append(h('button',{type:'button',class:'class-current-select'+(selectedCurrent?' selected':''),
    text:selectedCurrent?'✓ '+current.name+' · '+tr('выбрано','selected'):tr('Выбрать ','Choose ')+current.name,
    'aria-pressed':String(state.job===current.i),onclick:()=>{
     selectJob(current.i);
    }}));
 }
 const next=records.filter(x=>x.parent===(jobPathKey||null));
 const choices=h('div',{class:'class-wizard-choices'});
 for(const node of next){
  const hasChildren=records.some(x=>x.parent===node.key);
  const selectedOnPath=Boolean(hasChildren&&activeAncestors.has(node.key)&&selectedProfession);
  const status=state.job===node.i?originCopy('classChosen','✓ Выбрано','✓ Selected'):
   selectedOnPath?'✓ '+selectedProfession.name:
   hasChildren?originCopy('classSpecializations','Специализации ›','Specializations ›'):
   originCopy('classChoose','Выбрать','Select');
  const choiceExplanation=selectedOnPath?
   tr(' — выбранная специализация ',' — selected specialization ')+selectedProfession.name:
   state.job===node.i?tr(' — выбрано',' — selected'):
   hasChildren?tr(' — перейти к специализациям',' — view specializations'):
   tr(' — выбрать профессию',' — select class');
  const specialties=Object.entries(catalog.classes?.[node.key]?.branchCaps||{})
   .filter(([,cap])=>Number(cap)>0).sort((a,b)=>Number(b[1])-Number(a[1]))
   .slice(0,2).map(([key])=>catalog.meta?.branchLabels?.[key]||key);
  choices.append(h('button',{type:'button',class:'class-wizard-choice'+(state.job===node.i?' active':'')+
    (activeAncestors.has(node.key)?' on-path':''),
    'aria-label':node.name+choiceExplanation,
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
 if(!next.length&&current)grid.append(h('p',{class:'class-wizard-hint',text:selectedCurrent?
 tr('Специализация выбрана. Можно вернуться и изменить направление.','Specialization selected. Go back to change direction.'):
 tr('Выберите специализацию или вернитесь назад.','Choose the specialization or go back.')}));
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
 // A floating owner drawer keeps the explicit user's open/collapsed state
 // when switching between the hero, saved builds and encyclopedia.
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
function slotVisual(slot,item=state.equipment?.[slot],sourceSlot=slot){
const r=item&&equippedRecord(sourceSlot),icon=r?itemIcon(r):null; // Unknown/stale equipment ID: avoid unverified remote icon
if(!icon)return h("span",{text:slots[slot][1],class:"slot-glyph"});
const img=h("img",{class:"equipped-icon",src:icon,alt:""});
img.onerror=()=>{img.onerror=null;img.replaceWith(h("span",{text:slots[slot][1],class:"slot-glyph"}))};
return img;
}
// Warning details live outside the clipped equipment button and can be read
// beside either equipment rail without intersecting the character portrait.
let stageRailWarningPopover=null;
function hideStageRailWarning(){
 stageRailWarningPopover?.remove();
 stageRailWarningPopover=null;
}
function showStageRailWarning(badge,message){
 hideStageRailWarning();
 if(!badge?.isConnected||!message)return;
 const node=h('div',{class:'stage-rail-warning-popover',role:'tooltip',text:message});
 document.body.append(node);
 const marker=badge.getBoundingClientRect(),w=node.getBoundingClientRect().width;
 const rightSide=Boolean(badge.closest('#railRight'));
 const desiredLeft=rightSide?marker.left-w-8:marker.right+8;
 const left=Math.max(8,Math.min(desiredLeft,window.innerWidth-w-8));
 const top=Math.max(8,Math.min(marker.top,window.innerHeight-node.getBoundingClientRect().height-8));
 node.style.left=left+'px';node.style.top=top+'px';
 stageRailWarningPopover=node;
}
// One context menu for all 14 rail slots, mounted outside clipped portrait
// artwork. A right click never mutates equipment until an action is chosen.
let stageGearMenu=null,stageGearMenuAnchor=null;
function closeStageGearMenu(restoreFocus=false){
 const anchor=stageGearMenuAnchor;
 stageGearMenu?.remove();stageGearMenu=null;stageGearMenuAnchor=null;
 if(restoreFocus&&anchor?.isConnected)anchor.focus({preventScroll:true});
}
function openStageEquipmentSlot(index,view='auto'){
 closeStageGearMenu();
 // A slot picker is a NEW portrait-screen flow, never a child of the Book.
 // Closing the picker must return to the hero portrait, not reopen the Book.
 if(stageAttributesPage){
  stageAttributesPage=null;
  window.PandoraStageAttributes?.resetDisclosureState?.();
 }
 const visual=window.PandoraUIPlanner.visualEquipment(state.equipment,index,catalog.equipment);
 const shared=Boolean(visual.shared);
 selectedSlot=shared&&(view==='properties'||view==='souls')?visual.sourceSlot:index;
 selectedSocket=0;gearMode='equipment';
 stageSlotQuery='';stageSoulQuery='';stageSoulScrollTop=0;stageSlotShown=48;
 stageSlotView=view==='auto'?
  (shared||!state.equipment?.[index]?'choose':'details'):view;
 stageSlotPickerOpen=true;renderSlotRails();renderStagePicker(view==='choose');
}
function unequipStageEquipmentSlot(index){
 const equipped=state.equipment?.[index],removed=equippedRecord(index);
 if(!equipped)return;
 const ui=window.PandoraUIPlanner,previousEquipment={...state.equipment};
 if(index===5&&ui.occupiesBodyAndLegs(equippedRecord(3))){
  delete state.equipment[3];delete state.equipment[5];
  if(state.displacedLegwear)state.equipment[5]=state.displacedLegwear;
  state.displacedLegwear=null;
 }else{
  delete state.equipment[index];
  if(index===3&&ui.occupiesBodyAndLegs(removed)){
   if(state.displacedLegwear)state.equipment[5]=state.displacedLegwear;
   state.displacedLegwear=null;
  }
 }
 window.PandoraEquipmentPlan.clearChangedEquipmentSouls(state,previousEquipment);
 stageSlotView='choose';persist();render();
}
function openStageGearMenu(index,sourceSlot,event,anchor){
 // Empty slots have one safe action: Choose item. No hidden equip mutation.
 const hasItem=Boolean(state.equipment?.[sourceSlot]);
 closeStageGearMenu();hideStageRailWarning();
 window.PandoraStageItemUI.dismissPreview();
 const equipped=state.equipment[sourceSlot],record=equippedRecord(sourceSlot);
 const cap=window.PandoraEquipmentPlan.equippedSocketCapacity(
  state,sourceSlot,equipped,record);
 const canManageSouls=Boolean(record&&window.PandoraEquipmentPlan.canSocket(
  slotKeys[sourceSlot],record,cap));
 const tr=(ru,en)=>lang==='en'?en:ru;
 const menu=h('div',{class:'stage-gear-context-menu',role:'menu',
  'aria-label':hasItem?tr('Действия с надетой вещью','Equipped item actions'):
   tr('Действия с пустым слотом','Empty equipment slot actions'),
  'data-gear-context-slot':String(index)});
 const title=h('div',{class:'stage-gear-context-heading'},[
  h('small',{text:gearSlotName(index)}),
  h('strong',{text:hasItem?itemName(equipped):tr('Пустой слот','Empty slot')})
 ]);
 menu.append(title);
 const actions=hasItem?[
  ['properties','◇','Свойства','Properties',false],
  ['souls','◈','Управление душами','Manage Souls',!canManageSouls],
  ['replace','⇄','Выбрать другую вещь','Choose another item',false],
  ['remove','×','Снять вещь','Unequip item',false]
 ]:[['choose','+','Выбрать вещь','Choose item',false]];
 for(const [id,glyph,ru,en,disabled] of actions){
  const label=h('span',{class:'stage-gear-context-caption',
   text:equipmentCopy('context.'+id,ru,en)});
  const button=h('button',{type:'button',role:'menuitem',
   class:'stage-gear-context-action'+(id==='remove'?' is-remove':''),
   'data-gear-context-action':id,'tabindex':'-1',
   disabled,
   ...(disabled?{title:tr('У предмета нет доступных слотов душ. Добавить их можно в свойствах.',
    'No available Soul slots. Configure them in Properties.')}:{ }),
   onclick:e=>{
    if(e.target.closest?.('[data-owner-text-field]'))return;
    closeStageGearMenu();
    if(id==='remove'){
     selectedSlot=sourceSlot;stageSlotPickerOpen=false;
     unequipStageEquipmentSlot(sourceSlot);
     focusSelectedSlot();return;
    }
    openStageEquipmentSlot(id==='replace'||id==='choose'?index:sourceSlot,
     id==='replace'||id==='choose'?'choose':id==='souls'?'souls':'details');
   }
  },[h('span',{class:'stage-gear-context-icon','aria-hidden':'true',text:glyph}),label]);
  const wrap=h('div',{class:'stage-gear-context-row'},[button]);
  if(adminEditing&&adminToken){
   equipmentCopyLabel(label,'context.'+id,ru,en);
   const pencil=h('button',{type:'button',class:'stage-gear-context-pencil',text:'✎',
    'aria-label':tr('Редактировать название: ','Edit caption: ')+equipmentCopy('context.'+id,ru,en),
    onclick:e=>{
     e.preventDefault();e.stopPropagation();
     label.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
    }});
   wrap.append(pencil);
  }
  menu.append(wrap);
 }
 document.body.append(menu);stageGearMenu=menu;stageGearMenuAnchor=anchor;
 const rect=menu.getBoundingClientRect(),box=anchor.getBoundingClientRect();
 const x=Number.isFinite(event?.clientX)&&event.clientX>0?event.clientX:box.right;
 const y=Number.isFinite(event?.clientY)&&event.clientY>0?event.clientY:box.bottom;
 menu.style.left=Math.max(8,Math.min(x,window.innerWidth-rect.width-8))+'px';
 menu.style.top=Math.max(8,Math.min(y,window.innerHeight-rect.height-8))+'px';
 menu.querySelector('[role="menuitem"]:not(:disabled)')?.focus({preventScroll:true});
}
document.addEventListener('pointerdown',event=>{
 if(stageGearMenu&&!stageGearMenu.contains(event.target))closeStageGearMenu();
},true);
document.addEventListener('contextmenu',event=>{
 if(stageGearMenu&&!event.target.closest?.('.equipment-slot.equipped')&&
  !stageGearMenu.contains(event.target))closeStageGearMenu();
},true);
document.addEventListener('scroll',()=>closeStageGearMenu(),true);
window.addEventListener('resize',()=>closeStageGearMenu());
window.addEventListener('blur',()=>closeStageGearMenu());
document.addEventListener('keydown',event=>{
 if(!stageGearMenu||!stageGearMenu.contains(event.target))return;
 if(event.target.closest?.('[data-owner-text-field]'))return;
 if(event.key==='Escape'){
  event.preventDefault();event.stopImmediatePropagation();
  closeStageGearMenu(true);return;
 }
 if(event.key==='Tab'){closeStageGearMenu();return}
 if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
 const choices=[...stageGearMenu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
 if(!choices.length)return;
 event.preventDefault();event.stopPropagation();
 const at=choices.indexOf(document.activeElement);
 const next=event.key==='Home'?0:event.key==='End'?choices.length-1:
  (at+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
 choices[next].focus({preventScroll:true});
},true);
function renderSlotRails(){
 closeStageGearMenu();hideStageRailWarning();
 window.PandoraStageItemUI.dismissPreview();
 const plan=window.PandoraEquipmentPlan,ui=window.PandoraUIPlanner;
 for(const[id,indexes]of[['railLeft',[0,2,3,4,5,6]],['railRight',[1,7,8,9,10,11,12,13]]]){
  const container=$(id);container.replaceChildren();
  for(const i of indexes){
   const visual=ui.visualEquipment(state.equipment,i,catalog.equipment),
    item=visual.item,source=item&&equippedRecord(visual.sourceSlot),shared=visual.shared;
   const sourceSlot=visual.sourceSlot,key=slotKeys[sourceSlot],
    cap=shared?0:plan.equippedSocketCapacity(state,sourceSlot,item,source);
   const report=shared?{count:0,excess:0}:plan.socketReport(state.souls?.[i],cap);
   const level=plan.canRefine(key)?plan.refinementValue(state.refinements,sourceSlot,item):0;
   const issue=source?equipmentIssue(source,sourceSlot):[];
   const tooltip=gearSlotName(i)+' · '+
    (item?itemName(item):(lang==='en'?'Empty':'Пусто'))+
    (shared?(lang==='en'?' · Occupied by armor (one piece uses two slots)':
     ' · Занято бронёй (одна вещь на два слота)'):'')+
    (!shared&&item&&plan.canSocket(slotKeys[i],source,cap)?
     (lang==='en'?' · Souls ':' · души ')+Math.min(report.count,cap)+'/'+cap:'')+
    (!shared&&level?(lang==='en'?' · planned refinement +':' · план заточки +')+level:'')+
    (issue.length?(lang==='en'?' · Inactive: ':' · Не действует: ')+
     issue.map(gearIssueLabel).join(', '):'');
   const button=h('button',{class:'equipment-slot'+(item?' equipped':'')+(shared?' shared-outfit':'')+
    (selectedSlot===i?' selected':'')+(report.excess?' socket-conflict':'')+(issue.length?' unavailable':''),
    'data-slot-index':String(i),'aria-expanded':String(stageSlotPickerOpen&&selectedSlot===i),'aria-controls':'stagePicker',
    'aria-label':tooltip,
    'aria-haspopup':'menu','aria-keyshortcuts':'Shift+F10',
    onclick:()=>openStageEquipmentSlot(i),
    oncontextmenu:event=>{
     event.preventDefault();
     openStageGearMenu(i,sourceSlot,event,button);
    },
    onkeydown:event=>{
     if(!(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'))return;
     event.preventDefault();event.stopPropagation();
     openStageGearMenu(i,sourceSlot,event,button);
    }});
   button.append(slotVisual(i,item,sourceSlot),h('small',{text:item?itemName(item):gearSlotName(i)}));
   if(shared)button.append(h('span',{class:'stage-shared-mark',text:'🔒',
    'aria-hidden':'true',title:'',
    'data-shared-slots':'armor+pants'}));
   if(!shared&&item&&plan.canSocket(slotKeys[i],source,cap))
    button.append(h('span',{class:'stage-sockets',text:'◈ '+Math.min(report.count,cap)+'/'+cap}));
   if(!shared&&item&&level>0)button.append(h('span',{class:'stage-enhance',text:'+'+level}));
   if(source){
    const equippedGem=window.PandoraEnchantModel.normalizeForSlot(key,
     state.gems?.[plan.refinementKey(sourceSlot,item)]);
    const socketed=plan.asSocketArray(state.souls?.[sourceSlot]).slice(0,cap??0)
     .filter(Boolean).map(s=>catalog.souls?.[String(s.id)]||(s.name?s:null)).filter(Boolean);
    window.PandoraStageItemUI.attachPreview(button,source,
     (rec,kind)=>itemIcon(rec,kind==='soul'?'souls':'items'),
     'item',{slot:key,refinement:level,gem:equippedGem,souls:socketed,
      capacity:cap,tables:gameTables});
    const activeFire=window.PandoraConditionalItemBonuses?.activeFor?.({
     record:source,refinement:level,gem:equippedGem,issue});
    if(!shared&&activeFire?.phoenix)button.append(h('span',{
     class:'stage-elemental-proc',text:'✦',
     'aria-label':(lang==='en'?'Phoenix Flame: +':'Пламя феникса: +')+
      activeFire.phoenix.chance+'%'}));
   }
   if(!shared&&(report.excess>0||issue.length)){
    const reasons=[];
    if(issue.length)reasons.push((lang==='en'?'Item inactive: ':'Предмет не действует: ')+
     issue.map(gearIssueLabel).join('; ')+'.');
    if(report.excess>0)reasons.push(lang==='en'?
     'Not enough Soul slots: '+report.count+' saved, '+
      (cap===null?'unknown':cap)+' available. Extra Souls are kept but inactive.':
     'Слотов душ недостаточно: сохранено '+report.count+
      ', доступно '+(cap===null?'неизвестно':cap)+
      '. Лишние души сохранены, но не действуют.');
    const message=reasons.join(' ');
    const badge=h('span',{class:'stage-conflict',text:'!','aria-label':message,
     'data-issue-tooltip':message,role:'img',
     onpointerenter:event=>{event?.stopPropagation?.();
      window.PandoraStageItemUI.dismissPreview();showStageRailWarning(badge,message)},
     onpointerleave:hideStageRailWarning});
    button.append(badge);
   }
   container.append(button);
  }
 }
}
function renderStageAttributes(calculated=undefined){
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
    souls:plan.asSocketArray(state.souls?.[slot])
     .slice(0,plan.equippedSocketCapacity(state,Number(slot),entry,rec)??0)
     .filter(Boolean).map(s=>catalog.souls?.[String(s.id)]||s)};
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
 const remakedBuffRows=window.PandoraRemakedBuffs?.choices({
  skills:skillMap,englishSkills:officialEnglish?.skills||{},
  jobKey:cls,level:state.level,weapon:equippedWeapon,branchMasteries,
  branchCaps:catalog.classes?.[cls]?.branchCaps||{},
  branchLabels:catalog.meta?.branchLabels||{},
  englishBranches:officialEnglish?.branches||{},
  selected:state.attributeBuffs?.remakedSkillIds||[]})||[];
 const bookEn=lang==='en';
 const levelReason=n=>bookEn?'Available at level '+n:'Откроется на '+n+' уровне';
 const missingCombatMastery=ability=>{
  const req=ability?.reqs?.find(req=>(branchMasteries[req.branch]??0)<req.amount);
  if(!req)return null;
  const branchName=(bookEn?officialEnglish?.branches?.[req.branch]:
   catalog.meta?.branchLabels?.[req.branch])||
   catalog.meta?.branchLabels?.[req.branch]||req.branch;
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
   id,name:ability.name,
   nameEn:officialEnglish?.skills?.[String(id)]?.n||ability.name,
   desc:ability.desc,
   descEn:officialEnglish?.skills?.[String(id)]?.d||ability.desc,
   level:ability.charLevel,summary,reason,
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
  // Party buffs are externally cast; never show the caster's class or
  // level requirements as a restriction on this receiving hero.
  const reason=availability[setting]?null:
   (bookEn?'This skill is unavailable':'Умение недоступно');
  combatSkillCards[setting]=ability?{
   id:combatSkillCatalog.supportSkillIds[kind],name:ability.name,
   nameEn:officialEnglish?.skills?.[String(combatSkillCatalog.supportSkillIds[kind])]?.n||ability.name,
   desc:ability.desc,
   descEn:officialEnglish?.skills?.[String(combatSkillCatalog.supportSkillIds[kind])]?.d||ability.desc,
   level:ability.charLevel,summary,reason,
   icon:skillIcon(ability.branch,0,ability)
  }:null;
 }
 window.PandoraStageAttributes.render(root,{
  page:stageAttributesPage,items,
  skillIconForId:id=>{
   const record=skillMap[String(id)];
   return record?skillIcon(record.branch,id,record):null;
  },
  modifiers:calculated===undefined?previewBaseStats():calculated,
  icon:rec=>itemIcon(rec),
  buffs:state.attributeBuffs||{},vitalsBuffs:state.vitalsBuffs||{},
  availability,combatSkillCards,remakedBuffRows,
  heroJobKey:cls,heroLevel:state.level,heroMasteries:branchMasteries,
  heroBranchCaps:catalog.classes?.[cls]?.branchCaps||{},
  heroWeaponKind:equippedWeapon?.kind||'BARE_HAND',
  heroHasShield:Boolean(equippedShield),
  honorTitles:window.PandoraOSCalculator.honorTitles,
  gameTerms:{skills:skillMap,englishSkills:officialEnglish?.skills||{},
   items:catalogSource?.items||{},englishItems:officialEnglish?.items||{},
   branchLabels:catalog.meta?.branchLabels||{},
   englishBranches:officialEnglish?.branches||{},
   classes:catalog.classes||{},englishClasses:officialEnglish?.classes||{}},
  resistanceSkillChoices:window.PandoraOSCalculator.resistanceSkillChoices(skillMap)
   .map(row=>({...row,nameEn:officialEnglish?.skills?.[String(row.id)]?.n||row.name})),
  itemById:id=>catalogSource?.items?.[String(id)]||null,
  onItem:id=>openWiki('item',String(id)),
  copy:override,canEdit:Boolean(adminEditing&&adminToken),
  onTextEdit:(node,key,field,initial)=>editWikiValue(node,initial,{
   type:field==='hintRu'||field==='hintEn'?'textarea':'text',
   onCommit:value=>saveGuidePatch('book.'+key,{[field]:value}),
   // The editor must finish and restore its original label before the Book
   // is refreshed; never unmount an input during its D1 save request.
   onCommitted:()=>{if(stageAttributesPage&&!stageSlotPickerOpen)renderStageAttributes()}
  }),
  onHonor:()=>openWiki('honor','overview'),
  onBuff:(key,value)=>setAttributeBuff(key,value),
  onVital:(key,value)=>setVitalsEnhancement(key,value),
  onClose:()=>{
   stageAttributesPage=null;
   window.PandoraStageAttributes?.resetDisclosureState?.();
   renderStageAttributes();saveView();
   $('portraitBookOpen')?.focus({preventScroll:true});
  },
  onPage:name=>{
   if(!window.PandoraStageAttributes.bookPages.some(([id])=>id===name))return;
   stageAttributesPage=name;renderStageAttributes();saveView();
  }
 });
 // The Hero Book has the same single inline D1 editor as other authored
 // UI copy. Bind after rendering, without remounting a character or book tab.
 if(adminEditing&&adminToken)bindAccountCopyEditors(root);
 if(priorPage===stageAttributesPage){
  const scroll=root.querySelector('.stage-book-page');
  if(scroll)scroll.scrollTop=priorScroll;
  if(activeControl)root.querySelector('[data-book-setting="'+activeControl+'"]')
   ?.focus({preventScroll:true});
 }else{
  root.querySelector('[role="tab"][aria-selected="true"]')?.focus({preventScroll:true});
 }
}
// The Hero Book is a live calculation, not a snapshot captured on open.
// Re-render preserves the active chapter, scroll position and setting focus.
function refreshOpenHeroBook(calculated=undefined){
 if(stageAttributesPage&&!stageSlotPickerOpen)renderStageAttributes(calculated);
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
 const previousSoulList=root.querySelector('.stage-rich-list');
 if(previousMode==='souls'&&previousSoulList)stageSoulScrollTop=previousSoulList.scrollTop;
 const preserveScroll=stageSlotPickerOpen&&previousMode===stageSlotView;
 root.dataset.view=stageSlotView;
 const frame=root.closest('.portrait-frame');frame.classList.toggle('picking',stageSlotPickerOpen);
 root.hidden=!stageSlotPickerOpen;root.replaceChildren();renderStageAttributes();
 if(!stageSlotPickerOpen)return;
 const key=slotKeys[selectedSlot],equipped=state.equipment?.[selectedSlot];
 const record=equipped&&equippedRecord(selectedSlot);
 const capacity=window.PandoraEquipmentPlan.equippedSocketCapacity(
  state,selectedSlot,equipped,record);
 if(stageSlotView==='gems'||(stageSlotView==='souls'&&
  !window.PandoraEquipmentPlan.canSocket(key,record,capacity)))stageSlotView='details';
 if(stageSlotView!=='choose'){
  const plan=window.PandoraEquipmentPlan;
  window.PandoraStageItemUI.render(root,{
   copyLabel:equipmentCopy,editLabel:equipmentCopyLabel,
   bindInterfaceText:(node,key,ru,en,attribute='text',suffix='')=>
    bindOwnerInterfaceText(node,'equipment',key,ru,en,attribute,suffix),
   canEdit:Boolean(adminEditing&&adminToken),
   record,item:equipped,slot:key,capacity,
   slotLabel:(lang==='en'?'Slot: ':'Слот: ')+gearSlotName(selectedSlot),
   slotIndex:selectedSlot,selectedSocket,mode:stageSlotView,
   icons:(entry,kind)=>itemIcon(entry,kind==='soul'?'souls':'items'),
   refinement:plan.refinementValue(state.refinements,selectedSlot,equipped),
   souls:plan.asSocketArray(state.souls?.[selectedSlot]),
   soulQuery:stageSoulQuery,onSoulQuery:value=>{stageSoulQuery=value;stageSoulScrollTop=0;saveView()},
   gems:window.PandoraEnchantModel.normalizeForSlot(key,state.gems?.[plan.refinementKey(selectedSlot,equipped)]),
   catalog,gameTables,close:()=>closeStagePicker(),
   changeMode:mode=>{
    if(mode==='gems')mode='details';
    if(mode==='souls'&&!plan.canSocket(key,record,capacity))mode='details';
    stageSlotView=mode;saveView();renderStagePicker(mode==='choose')
   },
   updateGrade:n=>{if(!plan.canRefine(key)||!Number.isInteger(n)||n<0||n>10)return;
    state.refinements??={};state.refinements[plan.refinementKey(selectedSlot,equipped)]=n;
    persist();renderSlotRails();renderStagePicker();renderOriginStats();renderOriginVitals();
    root.querySelector('[data-grade="'+n+'"]')?.focus({preventScroll:true});
   },
   updateSocketCapacity:n=>{
    if(!record||!equipped||!plan.supportsSoulSlot(key)||
     !Number.isInteger(n)||n<0||n>3)return;
    // Never silently destroy already inserted Souls when reducing sockets.
    const positions=plan.asSocketArray(state.souls?.[selectedSlot]);
    if(positions.slice(n).some(Boolean))return;
    const id=plan.refinementKey(selectedSlot,equipped);
    state.socketCapacities??={};
    if(n===plan.socketCapacity(record))delete state.socketCapacities[id];
    else state.socketCapacities[id]=n;
    selectedSocket=Math.min(selectedSocket,Math.max(0,n-1));
    if(n===0&&stageSlotView==='souls')stageSlotView='details';
    persist();renderSlotRails();renderStagePicker();renderOriginStats();renderOriginVitals();
    root.querySelector('[data-socket-capacity="'+n+'"]')?.focus({preventScroll:true});
   },
   openSocket:i=>{selectedSocket=i;stageSlotView='souls';saveView();renderStagePicker();
    root.querySelector('[data-socket-index="'+i+'"]')?.focus({preventScroll:true});
   },
   assignSoul:entry=>{
    const count=plan.equippedSocketCapacity(state,selectedSlot,equipped,record);
    if(!plan.canSocket(key,record,count)||count===null||
     selectedSocket<0||selectedSocket>=count)return;
    if(entry&&!plan.validSoul(entry,key))return;
    const next=plan.asSocketArray(state.souls?.[selectedSlot]);
    next[selectedSocket]=entry?{id:entry.id,name:entry.name,icon:entry.icon}:null;
    state.souls[selectedSlot]=next;
    state.soulOwners??={};
    if(next.some(Boolean))state.soulOwners[selectedSlot]=String(equipped.id);
    else {delete state.souls[selectedSlot];delete state.soulOwners[selectedSlot]}
    stageSlotView='souls';persist();renderStagePicker();renderSlotRails();renderOriginStats();renderOriginVitals();
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
    renderOriginVitals();
    if(focusKey&&focusValue)root.querySelector('[data-enchant-key="'+focusKey+
      '"][data-enchant-value="'+focusValue+'"]')?.focus({preventScroll:true});
   }
  });
  if(adminEditing&&adminToken){
   const panel=ownerInterfaceEditor('equipment',[
    ['pickerItemClose','Закрыть настройку','Close item settings','Закрытие настроек','Close settings'],
    ['pickerItemSettings','Настройка предмета','Item settings','Название вкладок','Tabs accessible name'],
    ['pickerSoulSearchAria','Поиск души','Find Soul','Поиск душ','Soul search'],
    ['pickerSoulSlotAria','Слот души','Soul slot','Название слота','Soul slot name'],
    ['pickerSoulSlotCaption','Слот','Slot','Подпись слота','Slot caption'],
    ['pickerEmptySoul','пусто','empty','Пустой слот','Empty slot']
   ],'Подписи свойств и душ','Item and Soul labels');
   if(panel)root.insertBefore(panel,root.querySelector('.stage-rich-body')||null);
  }
  if(preserveScroll){
   const body=root.querySelector('.stage-rich-body');
   if(body)body.scrollTop=oldBodyScroll;
  }
  if(stageSlotView==='souls'){
   const soulList=root.querySelector('.stage-rich-list');
   if(soulList){
    soulList.scrollTop=stageSoulScrollTop;
    soulList.addEventListener('scroll',()=>{stageSoulScrollTop=soulList.scrollTop},{passive:true});
   }
  }
  return;
 }
 const top=h('div',{class:'stage-picker-head'},[
  bindOwnerInterfaceText(h('strong',{}),'equipment','pickerChoosePrefix',
   'Выбор:','Choose:','text',' '+gearSlotName(selectedSlot)),
  bindOwnerInterfaceText(h('button',{type:'button',
   disabled:!record,onclick:()=>{stageSlotView='details';renderStagePicker()}}),
   'equipment','pickerDetails','Свойства →','Details →'),
  bindOwnerInterfaceText(h('button',{type:'button',text:'✕',
   onclick:()=>closeStagePicker()}),'equipment','pickerClose',
   'Закрыть выбор','Close item picker','aria-label')
 ]);
 const search=h('input',{type:'search',value:stageSlotQuery});
 bindOwnerInterfaceText(search,'equipment','pickerSearchPlaceholder',
  'Поиск по названию','Search by name','placeholder');
 bindOwnerInterfaceText(search,'equipment','pickerSearchAria',
  'Поиск предмета для','Search equipment for','aria-label',' '+gearSlotName(selectedSlot));
 const count=h('small',{class:'stage-picker-count'});
 const list=h('div',{class:'stage-picker-list',role:'list'});
 const more=h('button',{type:'button',class:'stage-picker-more'});
 const remove=bindOwnerInterfaceText(h('button',{type:'button',
  disabled:!equipped&&!(selectedSlot===5&&window.PandoraUIPlanner.occupiesBodyAndLegs(equippedRecord(3))),
  onclick:()=>{
   // Use the exact same removal semantics as the rail context menu.
   if(!equipped&&selectedSlot===5&&window.PandoraUIPlanner.occupiesBodyAndLegs(equippedRecord(3)))
    unequipStageEquipmentSlot(3);
   else unequipStageEquipmentSlot(selectedSlot);
  }}),'equipment','pickerUnequip','Снять предмет','Unequip item');
 const bottom=h('div',{class:'stage-picker-foot'},[remove,more]);
 const isSharedPants=selectedSlot===5&&window.PandoraUIPlanner.occupiesBodyAndLegs(equippedRecord(3));
 const outfitNote=isSharedPants?bindOwnerInterfaceText(h('small',{class:'stage-outfit-note'}),
  'equipment','pickerOutfitNote',
  'Платье занимает броню и штаны. Выбор штанов снимет его.',
  'Armor and pants are occupied by one outfit. Choosing pants removes it.'):null;
 const records=catalog.live&&Number.isInteger(state.race)&&Number.isInteger(state.job)?window.PandoraUIPlanner.planningEquippable(
  Object.values(catalog.equipment||{}),key,jobKeys[state.job],state.level,
  window.PandoraStudioRules.equipment)
 .filter(rec=>window.PandoraUIPlanner.raceCompatible(rec,state.race,state.gender))
 .sort((a,b)=>{
  const futureA=Number(a.level||1)>state.level?1:0;
  const futureB=Number(b.level||1)>state.level?1:0;
  return futureA-futureB||Number(a.level||1)-Number(b.level||1)||
   itemName(a).localeCompare(itemName(b),lang==='en'?'en':'ru');
 }):[];
 const draw=()=>{
  list.replaceChildren();
  const matches=records.filter(rec=>searchWords([itemName(rec),
   catalogSource?.items?.[String(rec.id)]?.name,
   officialEnglish?.items?.[String(rec.id)]?.n].filter(Boolean).join(' '),stageSlotQuery));
  count.textContent=lang==='en'?
   matches.length+' matching · '+Math.min(matches.length,stageSlotShown)+' shown':
   matches.length+' подходящих · '+Math.min(matches.length,stageSlotShown)+' показано';
  if(!catalog.live)list.append(bindOwnerInterfaceText(h('p',{class:'muted'}),
   'equipment','pickerLoading','Каталог ещё не загружен.','The catalog is still loading.'));
  else if(!Number.isInteger(state.race)||!Number.isInteger(state.job))
   list.append(bindOwnerInterfaceText(h('p',{class:'muted'}),
    'equipment','pickerOriginFirst','Сначала выберите расу и профессию.',
    'Choose a race and class first.'));
  else if(!matches.length)list.append(bindOwnerInterfaceText(h('p',{class:'muted'}),
   'equipment','pickerNoMatches','Нет совместимых предметов. Измени поиск или слот.',
   'No compatible items. Try another search or slot.'));
  for(const rec of matches.slice(0,stageSlotShown)){
   const selected=!isSharedPants&&String(equipped?.id)===String(rec.id);
   const future=Number(rec.level)>state.level;
   const btn=h('button',{type:'button','data-stage-choice':String(rec.id),
    class:'stage-picker-item'+(selected?' selected':'')+(future?' future':''),
    'aria-label':(future?
     (lang==='en'?'Available from level '+rec.level+'. Plan: ':
      'Будет доступен с '+rec.level+' уровня. Запланировать: '):
     (lang==='en'?'Equip ':'Экипировать '))+itemName(rec),onclick:()=>{
     const ui=window.PandoraUIPlanner,oldDress=ui.occupiesBodyAndLegs(equippedRecord(3));
     const previousEquipment={...state.equipment};
     if(selectedSlot===5&&oldDress){
      // Selecting new pants replaces the whole one-piece armor.
      delete state.equipment[3];state.displacedLegwear=null;
     }else if(selectedSlot===3&&oldDress&&!ui.occupiesBodyAndLegs(rec)){
      if(state.displacedLegwear)state.equipment[5]=state.displacedLegwear;
      state.displacedLegwear=null;
     }
     if(selectedSlot===3&&ui.occupiesBodyAndLegs(rec)){
      // Swapping dresses retains the old stored trousers for later removal.
      if(!oldDress)state.displacedLegwear=state.equipment[5]||null;
      delete state.equipment[5];
     }
     state.equipment[selectedSlot]={id:rec.id,name:itemName(rec),level:rec.level??null,icon:rec.icon??null};
     window.PandoraEquipmentPlan.clearChangedEquipmentSouls(state,previousEquipment);
     stageSlotView='details';persist();render();renderStagePicker();
    }});
   const src=itemIcon(rec);
   if(src){const img=h('img',{src,alt:'',loading:'lazy'});img.onerror=()=>img.replaceWith(h('span',{class:'item-glyph',text:'⚔'}));btn.append(img)}
   else btn.append(h('span',{class:'item-glyph',text:'⚔'}));
   const itemLevel=Number(rec.level);
   const levelText=(lang==='en'?'Level ':'Уровень ')+
    (Number.isFinite(itemLevel)&&itemLevel>=1?itemLevel:'—');
   const socketCount=window.PandoraEquipmentPlan.supportsSoulSlot(key)?
    window.PandoraEquipmentPlan.socketCapacity(rec):null;
   const meta=window.PandoraEquipmentPlan.supportsSoulSlot(key)?
    levelText+(lang==='en'?' · Slots: ':' · Слоты: ')+
     (socketCount===null?'—':String(socketCount)):levelText;
   btn.append(h('span',{class:'stage-picker-item-label'},[h('b',{text:itemName(rec)}),
    h('small',{text:meta})]));
   if(future)btn.append(h('span',{class:'stage-picker-future',
    text:lang==='en'?'From '+rec.level+' Lv.':'С '+rec.level+' ур.'}));
   if(selected)btn.append(h('span',{class:'stage-picker-check',text:'✓'}));
   list.append(btn);
   window.PandoraStageItemUI.attachPreview(btn,rec,
    (item,kind)=>itemIcon(item,kind==='soul'?'souls':'items'),
    'item',{slot:key,refinement:selected?window.PandoraEquipmentPlan.refinementValue(
     state.refinements,selectedSlot,equipped):0,tables:gameTables});
  }
  more.hidden=matches.length<=stageSlotShown;
  more.textContent=(lang==='en'?'Show more (':'Показать ещё (')+
   Math.max(0,matches.length-stageSlotShown)+')';
 };
 search.addEventListener('input',()=>{stageSlotQuery=search.value;stageSlotShown=48;draw()});
 more.addEventListener('click',()=>{stageSlotShown+=48;draw()});
 root.append(top);
 if(outfitNote)root.append(outfitNote);
 root.append(search);
 if(adminEditing&&adminToken)root.append(ownerInterfaceEditor('equipment',[
  ['pickerChoosePrefix','Выбор:','Choose:','Заголовок слота','Slot heading'],
  ['pickerDetails','Свойства →','Details →','Переход к свойствам','Open properties'],
  ['pickerClose','Закрыть выбор','Close item picker','Закрытие','Close picker'],
  ['pickerSearchPlaceholder','Поиск по названию','Search by name','Поле поиска','Search placeholder'],
  ['pickerSearchAria','Поиск предмета для','Search equipment for','Название поиска','Search accessible name'],
  ['pickerUnequip','Снять предмет','Unequip item','Снять предмет','Unequip action'],
  ['pickerOutfitNote','Платье занимает броню и штаны. Выбор штанов снимет его.',
   'Armor and pants are occupied by one outfit. Choosing pants removes it.',
   'Подсказка костюма','Outfit note'],
  ['pickerLoading','Каталог ещё не загружен.','The catalog is still loading.','Загрузка','Loading'],
  ['pickerOriginFirst','Сначала выберите расу и профессию.',
   'Choose a race and class first.','Выбор расы','Choose race first'],
  ['pickerNoMatches','Нет совместимых предметов. Измени поиск или слот.',
   'No compatible items. Try another search or slot.','Нет предметов','No matching items']
 ],'Подписи выбора экипировки','Equipment picker labels'));
 root.append(count,list,bottom);draw();
 if(focusSearch)search.focus({preventScroll:true});
}
function attributeSnapshot(){
 if(!Number.isInteger(state.race)||!Number.isInteger(state.job))return null;
 const klass=catalog.classes?.[jobKeys[state.job]],root=klass?.baseClass||jobKeys[state.job];
 return window.PandoraAttributeProgression.snapshot({
  tables:gameTables,race:window.PandoraGameNavigation.raceKeys[state.race],klass:root,level:state.level,
  added:STATS.map(key=>Number(state.stats[key]||0)),caps:klass?.statCaps
 });
}
// Shared input contract for both stat editors: one increment per tap/click,
// then repeated increments only while the primary pointer is held.
// No global listeners: removed panels cannot leave orphaned timers behind.
function bindHoldStep(button,step){
 let delay=null,interval=null,pressed=false,skipClick=false;
 const stop=()=>{
  pressed=false;
  if(delay!==null){clearTimeout(delay);delay=null}
  if(interval!==null){clearInterval(interval);interval=null}
  button.classList.remove('is-repeating');
 };
 const run=()=>{
  if(button.disabled||!button.isConnected){stop();return}
  step();
  if(button.disabled)stop();
 };
 button.addEventListener('pointerdown',event=>{
  if(button.disabled||event.button!==0||event.isPrimary===false)return;
  stop();pressed=true;skipClick=true;run();
  if(!pressed)return;
  delay=setTimeout(()=>{
   delay=null;
   if(!pressed||!button.isConnected||button.disabled){stop();return}
   button.classList.add('is-repeating');
   interval=setInterval(run,85);
  },340);
 });
 button.addEventListener('click',event=>{
  // Keyboard/assistive clicks have detail=0; never consume them merely because
  // a previous pointer gesture was cancelled or its click was suppressed.
  if(event?.detail===0){skipClick=false;run();return}
  if(skipClick){skipClick=false;return}
  run();
 });
 button.addEventListener('pointerup',stop);
 button.addEventListener('pointerleave',()=>{stop();skipClick=false});
 button.addEventListener('pointercancel',()=>{stop();skipClick=false});
 button.addEventListener('lostpointercapture',stop);
 button.addEventListener('blur',stop);
 button.addEventListener('keydown',event=>{if(event.key==='Escape')stop()});
 button.setAttribute('aria-description',lang==='en'?
  'Press once to adjust by one; hold to repeat.':'Нажмите для изменения на один; удерживайте для повторения.');
}
function setAttributePoints(index,added){
 if(!window.PandoraAttributeProgression.allowed(attributeSnapshot(),index,added))return false;
 state.stats[STATS[index]]=added;persist();renderOriginVitals();return true;
}
const ORIGIN_STAT_LABELS=[
 {short:'ВЫН',name:'Выносливость',nameEn:'Vitality',code:'vit'},
 {short:'СИЛ',name:'Сила',nameEn:'Strength',code:'str'},
 {short:'ПРВ',name:'Проворность',nameEn:'Agility',code:'agi'},
 {short:'ЛВК',name:'Ловкость',nameEn:'Dexterity',code:'dex'},
 {short:'СД',name:'Сила духа',nameEn:'Spirit',code:'spi'},
 {short:'ИНТ',name:'Интеллект',nameEn:'Intelligence',code:'int'}
];
// Legacy save keys remain unchanged: AGI was stored under «Ловкость», DEX under «Сноровка».
function renderOriginStats(calculated=undefined){
 const root=$('originStats'),summary=$('originStatSummary');
 if(!root||!summary)return;
 root.replaceChildren();
 const list=h('div',{class:'origin-stat-list'}),entries=[];
 const tr=(ru,en)=>lang==='en'?en:ru;
 // Keep the legacy standalone computation fixture executable without its
 // workbench context; the real app injects the shared D1 copy binder.
 const statCaption=(key,ru,en)=> {
  const node=h('span',{text:tr(ru,en)+' '});
  return typeof bindOwnerInterfaceText==='function'?
   bindOwnerInterfaceText(node,'stats-ui',key,ru,en,'text',' '):node;
 };
 // Saved stats remain invested-only. The input is the absolute race/class baseline + investment.
 function refresh(known=undefined){
  // Interactive handlers call refresh() without a snapshot so edits always
  // recompute; only a caller-owned, same-state initial render may reuse one.
  const snap=attributeSnapshot(),estimate=known===undefined?previewBaseStats():known;
  if(snap){
   summary.replaceChildren(
    statCaption('remainingPrefix','Свободно:','Available:'),
    h('span',{text:String(snap.remaining)+' / '+String(snap.total)}),
    h('span',{text:' · '}),
    statCaption('spentPrefix','Потрачено:','Spent:'),
    h('span',{text:String(snap.spent)})
   );
  }else summary.textContent=
   tr('Выберите расу и профессию · ','Choose a race and class · ')+
   tr('Бюджет уровня: ','Level budget: ')+
   (window.PandoraAttributeProgression.budget(state.level)??'—');
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
   row.caption.textContent=delta?(delta>0?'+':'')+delta+tr(' бонус',' bonus'):
    tr('Итог','Total');
   row.result.setAttribute('aria-label',tr('База ','Base ')+(base??'—')+
    tr(' + очки ',' + allocated points ')+spent+
    tr(' + известные бонусы ',' + known bonuses ')+delta+' = '+row.result.textContent);
   row.minus.disabled=!snap||spent<=0;
   row.plus.disabled=!window.PandoraAttributeProgression.allowed(snap,row.i,spent+1);
   row.plus.setAttribute('aria-label',tr('Увеличить ','Increase ')+row.name+
    tr('. Стоимость: ','. Cost: ')+(window.PandoraAttributeProgression.nextCost(snap,row.i)??tr('максимум','maximum')));
  }
 }
 ORIGIN_STAT_LABELS.forEach((info,i)=>{
  const name=tr(info.name,info.nameEn),short=lang==='en'?info.code.toUpperCase():info.short;
  const wrap=h('div',{class:'origin-stat-row'});
  const title=h('div',{class:'origin-stat-title'},[
   h('b',{text:short}),h('span',{text:name})]);
  const minus=h('button',{type:'button',class:'stat-step-decrement',text:'−',
   'aria-label':tr('Уменьшить ','Decrease ')+name});
  const input=h('input',{type:'number',min:'0',max:'99',step:'1',class:'origin-stat-input',
   'aria-label':name+tr(' — без бонусов снаряжения и умений',
    ' — excluding equipment and skill bonuses')});
  const plus=h('button',{type:'button',class:'stat-step-increment',text:'+',
   'aria-label':tr('Увеличить ','Increase ')+name});
  const box=h('div',{class:'origin-stat-result'}),result=h('strong',{text:'—'}),
   caption=h('small',{text:tr('Итог','Total')});
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
  bindHoldStep(minus,()=>commit((attributeSnapshot()?.values[i]??0)-1));
  bindHoldStep(plus,()=>commit((attributeSnapshot()?.values[i]??0)+1));
  input.addEventListener('change',()=>commit(input.value));
  wrap.append(title,minus,input,plus,box);
  list.append(wrap);entries.push({i,input,result,caption,minus,plus,name});
 });
 root.append(list);
 if(typeof adminEditing!=='undefined'&&adminEditing&&adminToken)
  root.append(ownerInterfaceEditor('stats-ui',[
  ['remainingPrefix','Свободно:','Available:','Свободные очки','Available points'],
  ['spentPrefix','Потрачено:','Spent:','Вложенные очки','Spent points']
 ],'Подписи очков героя','Hero point labels'));
 refresh(calculated);
}
function renderOriginPassives(){
 const root=$('originPassives');if(!root)return;
 dismissSkillPreview();
 root.replaceChildren();
 const raceName=$('originRaceName');
 if(!Number.isInteger(state.race)||state.race<0||state.race>=races.length){
  if(raceName)raceName.textContent=lang==='en'?'Race not selected':'Раса не выбрана';
  root.append(h('p',{class:'muted',text:lang==='en'?'Choose a race to see its passives.':'Выберите расу, чтобы увидеть её пассивные способности.'}));
  return;
 }
 const ids=window.PandoraGameNavigation.racePassiveIds(catalog.racialPassives,state.race);
 // A restored local build must not keep a racial passive from a different race.
 const raceKey=window.PandoraGameNavigation.raceKeys[state.race];
 if(catalog.racialPassives?.[raceKey]&&state.racialPassiveId!=null&&
    !window.PandoraGameNavigation.selectionValid(catalog.racialPassives,state.race,state.racialPassiveId)){
  state.racialPassiveId=null;persist();
 }
 if(raceName)raceName.textContent=races[state.race][lang==='en'?1:0];
 if(!ids.length){root.append(h('p',{class:'muted',text:lang==='en'?
  'Racial passives will appear when the game catalog loads.':
  'Расовые способности появятся после загрузки каталога.'}));return}
 for(const id of ids){
  const skill=catalog.skills?.[String(id)];if(!skill)continue;
  const selected=String(state.racialPassiveId)===String(id);
  const btn=h('button',{type:'button',class:'origin-passive'+(selected?' selected':''),'aria-pressed':String(selected),
   'aria-label':skill.name+(selected?
    (lang==='en'?' — selected':' — выбрано'):
    (lang==='en'?' — select':' — выбрать')),
   onclick:()=>{state.racialPassiveId=selected?null:id;persist();renderOriginPassives();
    renderOriginVitals();renderOriginStats();
    if(activeTab==='character'&&characterPanelTab==='character')renderDetails()}});
  const src=skillIcon('race',id,skill);
  if(src){const img=h('img',{src,alt:'',loading:'lazy'});img.onerror=()=>img.replaceWith(h('span',{text:'✦'}));btn.append(img)}
  else btn.append(h('span',{text:'✦'}));
  const label=h('b',{text:skill.name,
    ...(adminEditing&&lang==='ru'?{'data-edit-key':'skill.race.'+id}:{})});
  btn.append(h('span',{},[label,
    h('small',{text:selected?(lang==='en'?'✓ Selected':'✓ Выбрано'):
      (lang==='en'?'Select':'Выбрать')})]));
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
// One controller for all rich skill previews (Origin and Hero Path).
// The item preview has its own game-item renderer; reuse its 650ms policy.
const SKILL_PREVIEW_HOVER_DELAY_MS=650;
let activeSkillPreview=null,activeSkillPreviewOwner=null,pendingSkillPreview=null,
 activeSkillRemovalObserver=null;
function cancelPendingSkillPreview(){
 if(pendingSkillPreview){clearTimeout(pendingSkillPreview.timer);pendingSkillPreview=null}
}
function dismissSkillPreview(){
 cancelPendingSkillPreview();
 activeSkillRemovalObserver?.disconnect();
 activeSkillRemovalObserver=null;
 activeSkillPreview?.remove();
 window.PandoraGuideTooltip.unlinkDescription(activeSkillPreviewOwner,activeSkillPreview?.id);
 activeSkillPreview=null;activeSkillPreviewOwner=null;
}
function positionSkillPreview(button,tip){
 if(!button?.isConnected||!tip?.isConnected)return;
 const box=button.getBoundingClientRect(),panel=button.closest('.right')?.getBoundingClientRect();
 const vw=document.documentElement.clientWidth,vh=innerHeight;
 const desired=Math.min(300,vw-16,panel?.width?panel.width-18:300);
 tip.style.width=Math.max(160,desired)+'px';
 tip.style.maxHeight=Math.max(100,Math.min(270,vh-16))+'px';
 const width=tip.getBoundingClientRect().width,height=tip.getBoundingClientRect().height;
 const minLeft=Math.max(8,(panel?.left??0)+8);
 const maxLeft=Math.min(vw-width-8,(panel?.right??vw)-width-8);
 tip.style.left=(maxLeft>=minLeft?Math.max(minLeft,Math.min(maxLeft,
  box.left+box.width/2-width/2)):Math.max(8,vw-width-8))+'px';
 tip.style.top=Math.max(8,Math.min(vh-height-8,
  box.top-height-8>=8?box.top-height-8:box.bottom+8))+'px';
}
function queueSkillPreview(button,show){
 dismissSkillPreview();
 const timer=setTimeout(()=>{
  if(pendingSkillPreview?.button!==button)return;
  pendingSkillPreview=null;
  if(button.isConnected&&button.matches(':hover'))show();
 },SKILL_PREVIEW_HOVER_DELAY_MS);
 pendingSkillPreview={button,timer,show};
}
function skillHover(button,skill){
 button.removeAttribute('title');
 const skills=Array.isArray(skill)?skill:[skill];
 const show=()=>{
  if(!button.isConnected)return;
  if(activeSkillPreviewOwner===button&&activeSkillPreview?.isConnected)return;
  dismissSkillPreview();
  const tip=h('aside',{id:'path-skill-hover-tooltip',
   class:'stage-hover-preview path-skill-preview',role:'tooltip'});
  for(const entry of skills.slice(0,3)){
   const row=h('div',{class:'path-skill-preview-item'}),src=skillIcon(entry.branch,entry.id,entry);
   if(src){const img=h('img',{src,alt:''});img.onerror=()=>img.replaceWith(h('span',{text:'✦'}));row.append(img)}
   const copy=h('div');copy.append(h('strong',{text:entry.name||(lang==='en'?'Skill':'Умение')}));
   if(entry.charLevel)copy.append(h('small',{text:(lang==='en'?'Level ':'Уровень ')+entry.charLevel}));
   if(Array.isArray(entry.reqs))for(const req of entry.reqs){
    if(!req||typeof req.branch!=='string'||!Number.isSafeInteger(req.amount)||req.amount<=0)continue;
    const branch=lang==='en'?
     (officialEnglish?.branches?.[req.branch]||catalog.meta?.branchLabels?.[req.branch]||req.branch):
     (catalog.meta?.branchLabels?.[req.branch]||req.branch);
    copy.append(h('small',{text:(lang==='en'?'Requires ':'Требуется мастерство «')+
     branch+(lang==='en'?' mastery: ':'»: ')+req.amount}));
   }
   if(entry.desc)copy.append(h('p',{text:entry.desc}));
   row.append(copy);tip.append(row);
  }
  if(skills.length>3)tip.append(h('small',{class:'path-preview-more',text:lang==='en'?
   (skills.length-3)+' more skills — select the marker to view them':
   'Ещё '+(skills.length-3)+' навыков — нажмите на отметку'}));
  document.body.append(tip);
  activeSkillPreview=tip;activeSkillPreviewOwner=button;
  window.PandoraGuideTooltip.linkDescription(button,tip.id);
  positionSkillPreview(button,tip);
  if(typeof MutationObserver==='function'&&document.body){
   activeSkillRemovalObserver=new MutationObserver(()=>{
    if(activeSkillPreviewOwner===button&&!button.isConnected)dismissSkillPreview();
   });
   activeSkillRemovalObserver.observe(document.body,{childList:true,subtree:true});
  }
 };
 const clear=()=>{
  if(pendingSkillPreview?.button===button||activeSkillPreviewOwner===button)
   dismissSkillPreview();
 };
 button.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  queueSkillPreview(button,show);
 });
 // A Hero Book section can be rebuilt underneath a stationary pointer.
 // Pointer movement recovers the preview even when the native enter event
 // was lost during that redraw; never reset an existing hover timer.
 button.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||activeSkillPreviewOwner===button||
   pendingSkillPreview?.button===button)return;
  queueSkillPreview(button,show);
 });
 button.addEventListener('pointerleave',clear);
 button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))show()});
 button.addEventListener('blur',clear);
 button.addEventListener('pointerdown',clear);
 button.addEventListener('click',clear);
 button.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||pendingSkillPreview?.button!==button&&activeSkillPreviewOwner!==button)return;
  event.preventDefault();event.stopPropagation();clear();
 });
}
// Share the exact rich Path/Origin tooltip with skill references throughout
// the site. One controller owns lifecycle, hover delay, sprite and requirements.
window.PandoraSkillPreview=Object.freeze({
 attach(node,id){
  const key=String(id??''),skill=catalog.skills?.[key];
  if(!node||!Number.isSafeInteger(Number(key))||Number(key)<=0||
   skill?.id!==Number(key))return false;
  if(node.dataset.pandoraRichSkillPreview==='1')return true;
  const translation=officialEnglish?.skills?.[key];
  const localized=lang==='en'?{
   ...skill,name:translation?.n||skill.name,
   desc:translation?.d||skill.desc
  }:skill;
  if(!node.matches('button,a,input,[tabindex]'))node.setAttribute('tabindex','0');
  node.dataset.pandoraRichSkillPreview='1';
  node.dataset.sourceSkillId=key;
  skillHover(node,localized);
  return true;
 },
 dismiss:dismissSkillPreview
});
// One global listener, not one scroll listener for every skill button.
document.addEventListener('scroll',()=>{
 if(pendingSkillPreview){
  const {button,show}=pendingSkillPreview;
  cancelPendingSkillPreview();
  if(button.isConnected&&button.matches(':hover'))queueSkillPreview(button,show);
 }
 if(activeSkillPreviewOwner?.isConnected){
  if(!activeSkillPreviewOwner.matches(':hover')&&
   !activeSkillPreviewOwner.matches(':focus-visible'))dismissSkillPreview();
  else positionSkillPreview(activeSkillPreviewOwner,activeSkillPreview);
 }else if(activeSkillPreviewOwner)dismissSkillPreview();
},{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)dismissSkillPreview();
});
for(const event of ['blur','popstate','hashchange'])
 window.addEventListener(event,dismissSkillPreview);
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
  innate:innateBranches(),branchCaps:branchCapacities(),
  skillCatalog:heroSkillRows(catalog.skills),catalogReady:!!catalog.skills,
  // Search both the displayed locale and source-backed alternate language.
  // These aliases never affect class gates, skill IDs or calculated effects.
  skillSearchText:skill=>[skill.name,catalogSource?.skills?.[String(skill.id)]?.name,
   officialEnglish?.skills?.[String(skill.id)]?.n,String(skill.id)]
   .filter(Boolean).join(' '),
  allocationReady:Boolean(gameTables?.abilityPoint&&catalog.classes?.[klass]),
  budget:budgetSummary(),selectedSkill,filter:pathSkillFilter,query:pathSkillQuery,
  // Only established in-game attribute labels, never raw STR/AGI/etc codes.
  attributeLabel:raw=>{
   const source=ORIGIN_STAT_LABELS.find(row=>row.code===String(raw).toLowerCase());
   return source?(lang==='en'?source.nameEn:source.name):
    (lang==='en'?'Unknown attribute':'Неизвестная характеристика');
  },
  shown:pathSkillShown,onMoreSkills:()=>{pathSkillShown+=24;renderPathSkills()},
  cap:branchCap,
  canEdit:Boolean(adminEditing&&adminToken),
  copyLabel:(key,ru,en)=>ownerCopy('path',key,ru,en),
  editLabel:(node,key,ru,en,callbacks)=>ownerCopyLabel(node,'path',key,ru,en,callbacks),
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
   const available=branchCap(key)>0;
   const allocationCap=available?Number.MAX_SAFE_INTEGER:0;
   if(!model.canAllocate(gameTables?.abilityPoint,state.level,state.points,key,allocationCap,target))
    return current;
   const allocationChanged=target!==current,branchChanged=state.branch!==key;
   if(allocationChanged&&!model.setPotential(state,key,target,innateBranches(),branchCapacities()))
    return current;
   state.branch=key;
   // A capped slider may emit many input events that cannot change the build.
   // Do not rewrite the draft or rebuild the budget for those no-op inputs.
   if(allocationChanged||branchChanged){persist();refreshBudgetLabel()}
   // Show automatic-mastery impact during a drag without remounting its slider.
   if(allocationChanged&&!final)refreshOpenHeroBook();
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
  onMastery:(key,requested,final=true)=>{
   if(state.masteryAuto!==false||!Number.isInteger(requested)||requested<0||
    !window.PandoraSkillProgression.setTrained(state,key,requested,
     innateBranches(),branchCapacities()))return false;
   const activeControl=document.activeElement?.getAttribute?.('data-branch-control');
   persist();
   // Hold-to-repeat updates the existing rail without removing the pressed
   // button. The final pointerup/keyboard commit refreshes all derived stats.
   if(!final)refreshOpenHeroBook();
   if(final){
    renderBranches();renderOriginStats();renderOriginVitals();
    if(activeControl)document.querySelector('[data-branch-control="'+activeControl+'"]')
     ?.focus({preventScroll:true});
    if(heroPathPage==='skills')renderPathSkills();
    saveView();
   }
   return true;
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
 // Any change to a build invalidates a previously displayed reset question.
 closePathResetConfirm();
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
function renderPathCopyControls(){
 const editing=Boolean(adminEditing&&adminToken);
 const copy=(key,ru,en)=>ownerCopy('path',key,ru,en);
 const labels=[
  ['#pathGrowthPage .path-mastery-toggle span','autoMastery','Автоматически заполнять зелёное мастерство','Automatically fill green mastery'],
  ['#pathGrowthPage .path-legend .potential','available','Свободно','Available'],
  ['#pathGrowthPage .path-legend .invested','invested','Вложено','Invested'],
  ['#pathGrowthPage .path-legend .trained','trained','Освоено','Trained']
 ];
 for(const [selector,key,ru,en] of labels){
  const node=document.querySelector(selector);if(!node)continue;
  node.dataset.ownerCopySection='path';node.dataset.ownerCopyId=key;
  node.dataset.ownerCopyRu=ru;node.dataset.ownerCopyEn=en;
  if(!node.querySelector('.wiki-inline-input'))node.textContent=copy(key,ru,en);
  node.classList.toggle('origin-copy-editable',editing);
  const edit=event=>{
   if(!adminEditing||!adminToken)return;
   event.preventDefault();event.stopPropagation();
   if(node.querySelector('.wiki-inline-input'))return;
   const editLang=lang;
   editWikiValue(node,copy(key,ru,en),{type:'text',
    onCommit:next=>saveGuidePatch('book.'+ownerCopyKey('path',key),{[editLang]:next}),
    onCommitted:next=>{
     const visible=lang===editLang?next:copy(key,ru,en);
     node.textContent=visible;
     const pencil=node.nextElementSibling;
     if(pencil?.dataset?.pathCopyFor===key)pencil.setAttribute('aria-label',
      (lang==='en'?'Rename: ':'Переименовать: ')+visible);
    }});
  };
  // Origin/path labels should be discoverable on touch and keyboard, without
  // replacing user-facing labels or the mastery checkbox's click behavior.
  if(!node.dataset.pathCopyBound){
   node.dataset.pathCopyBound='1';
   node.addEventListener('dblclick',edit);
  }
  const existing=node.nextElementSibling?.dataset?.pathCopyFor===key?
   node.nextElementSibling:null;
  if(!editing){existing?.remove();continue}
  if(existing)continue;
  node.after(h('button',{type:'button',class:'path-inline-copy-pencil',
   'data-path-copy-for':key,text:'✎',
   title:lang==='en'?'Rename caption':'Переименовать подпись',
   'aria-label':(lang==='en'?'Rename: ':'Переименовать: ')+copy(key,ru,en),
   onclick:edit}));
 }
 for(const [id,key,ru,en,symbol] of [
  ['pathGrowthTab','tabGrowth','Развитие','Growth','◈'],
  ['pathSkillsTab','tabSkills','Умения','Skills','✦']
 ]){
  const button=$(id);if(!button)continue;
  const label=copy(key,ru,en);
  let wrapper=button.parentElement?.classList.contains('path-tab-owner-wrap')?
   button.parentElement:null;
  if(!editing){
   if(wrapper){wrapper.before(button);wrapper.remove()}
   button.textContent=symbol+' '+label;continue;
  }
  // An in-progress editor must not be remounted by an unrelated path render.
  if(button.querySelector('.wiki-inline-input'))continue;
  const caption=h('span',{class:'path-tab-copy',text:label});
  caption.dataset.ownerCopySection='path';caption.dataset.ownerCopyId=key;
  caption.dataset.ownerCopyRu=ru;caption.dataset.ownerCopyEn=en;
  const pencil=h('button',{type:'button',class:'path-tab-pencil',text:'✎',
   'aria-label':lang==='en'?'Edit '+label:'Редактировать '+label});
  const edit=event=>{
   if(!adminEditing||!adminToken)return;
   event.preventDefault();event.stopPropagation();
   if(caption.querySelector('.wiki-inline-input'))return;
   const editLang=lang;
   editWikiValue(caption,copy(key,ru,en),{type:'text',
    onCommit:next=>saveGuidePatch('book.'+ownerCopyKey('path',key),{[editLang]:next}),
    onCommitted:next=>{
     const visible=lang===editLang?next:copy(key,ru,en);
     caption.textContent=visible;
     pencil.setAttribute('aria-label',(lang==='en'?'Edit ':'Редактировать ')+visible);
    }});
  };
  caption.addEventListener('dblclick',edit);
  pencil.addEventListener('click',edit);
  button.replaceChildren(h('span',{text:symbol}),caption);
  if(!wrapper){
   wrapper=h('span',{class:'path-tab-owner-wrap',role:'presentation'});
   button.before(wrapper);wrapper.append(button);
  }
  wrapper.querySelector('.path-tab-pencil')?.remove();
  wrapper.append(pencil);
 }
 // These are the real user-visible Hero Path skills controls. The legacy
 // workbench "skills" tab is not present in the site's navigation.
 const search=$('pathSkillSearch'),filter=$('pathSkillStatus');
 if(search)bindOwnerInterfaceText(search,'skill-ui','searchPlaceholder',
  'Найти умение','Find skill','placeholder');
 if(filter)bindOwnerInterfaceText(filter,'skill-ui','filterAria',
  'Фильтр навыков','Skill filter','aria-label');
 $('ownerSkillSearchCopy')?.remove();
 if(editing&&!$('pathSkillsPage')?.hidden){
  const owner=ownerInterfaceEditor('skill-ui',[
   ['searchPlaceholder','Найти умение','Find skill','Поле поиска','Search placeholder'],
   ['filterAria','Фильтр навыков','Skill filter','Фильтр умений','Skill filter']
  ],'Подписи умений','Skill labels');
  if(owner){
   owner.id='ownerSkillSearchCopy';
   document.querySelector('#pathSkillsPage .path-skills-filter')?.after(owner);
  }
 }
}
function renderPathPages(){
 const grow=heroPathPage==='growth';
 if(!grow)closePathResetConfirm();
 $('pathGrowthPage').hidden=!grow;$('pathSkillsPage').hidden=grow;
 for(const [id,on]of[['pathGrowthTab',grow],['pathSkillsTab',!grow]]){
  $(id).classList.toggle('chosen',on);
  $(id).setAttribute('aria-selected',String(on));
 }
 renderPathCopyControls();
 if(!grow)renderPathSkills();
}
function render(){state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);const hasRace=Number.isInteger(state.race)&&state.race>=0&&state.race<races.length;
 const hasJob=Number.isInteger(state.job)&&state.job>=0&&state.job<jobKeys.length;
 const logo=document.querySelector('.brand img');if(logo)logo.src=override['visual.logo']||'assets/pandora-logo.png';renderRaces();renderJobs();renderOriginTabs();$('genderF').classList.toggle('chosen',state.gender===0);
 const genderNotes=lang==='en'?
  ['Gender follows the selected appearance','Gender follows the selected appearance',
   'Dwarf · gender selection unavailable','Myrine · female','Enkidu · male','Lapin · genderless']:
  ['Пол по выбранному образу','Пол по выбранному образу',
   'Цверг · выбор пола недоступен','Мирина · женский','Энкиду · мужской','Кролль · бесполый'];
 $('raceSexInfo').textContent=genderNotes[state.race]||(lang==='en'?'Choose a race first':'Сначала выберите расу');
 $('genderM').classList.toggle('chosen',state.gender===1);
 const genderAllowed=window.PandoraUIPlanner.raceHasGender(races,state.race);
 $('genderF').disabled=!genderAllowed;$('genderM').disabled=!genderAllowed;
 $('swapGender').disabled=!genderAllowed;
 $('genderF').title=$('genderM').title=genderAllowed?
  (lang==='en'?'Choose a portrait variant':'Выбор варианта портрета'):
  (lang==='en'?'No alternate portraits for this race':'Для этой расы нет отдельных вариантов портрета');
 $('hero').src=raceSource(state.race,state.gender);
// The central hero portrait is the Book entry, never an image-edit target.
// Race portrait artwork remains editable in Origin > Race carousel.
$('hero').removeAttribute('data-edit-key');$('hero').classList.remove('admin-edit');
$('hero').alt=hasRace?races[state.race][lang==='en'?1:0]:(lang==='en'?'Race not selected':'Раса не выбрана');
$('raceTitle').textContent=hasRace?editableValue('race.'+state.race,races[state.race][lang==='en'?1:0]):(lang==='en'?'Choose a race':'Выберите расу');
$('jobTitle').textContent=hasJob?editableValue('job.'+state.job,jobs[state.job]):(lang==='en'?'Choose a class':'Выберите профессию');$('activeJob').textContent=$('jobTitle').textContent;$('level').value=state.level;$('levelOut').textContent=state.level;renderSlotRails();renderStagePicker();renderOriginPassives();
 const calculated=previewBaseStats();
 renderOriginStats(calculated);renderBranches();refreshBudgetLabel();
 renderPathPages();renderDetails();renderOriginVitals(calculated);
 renderVitalsEnhancements(calculated);renderOriginCopyLabels();updateAdminHint()}
// Cloud reconciliation replaces saved-build cards, but it must not erase a
// title being typed or move the reader away from the filtered results.
function refreshBuildsAfterCloudLoad(){
 if(activeTab!=='builds')return;
 const content=$('detailContent'),name=content?.querySelector('.build-name-input');
 const search=content?.querySelector('.build-library-search');
 const draft=content?.querySelector('.new-build-choice input');
 const active=document.activeElement;
 const focusKey=active===name?'name':active===search?'search':active===draft?'draft':null;
 const selection=focusKey&&typeof active.selectionStart==='number'?
  [active.selectionStart,active.selectionEnd]:null;
 const typedName=name?.value,scrollTop=content?.scrollTop??0;
 renderDetails();
 const updated=$('detailContent');
 if(typedName!==undefined){
  const replacement=updated.querySelector('.build-name-input');
  if(replacement)replacement.value=typedName;
 }
 const target=focusKey==='name'?updated.querySelector('.build-name-input'):
  focusKey==='search'?updated.querySelector('.build-library-search'):
  focusKey==='draft'?updated.querySelector('.new-build-choice input'):null;
 if(target){
  target.focus({preventScroll:true});
  if(selection&&typeof target.setSelectionRange==='function')
   target.setSelectionRange(...selection);
 }
 updated.scrollTop=scrollTop;
}
let wikiOutsideCleanup=null;
function renderDetails(){wikiOutsideCleanup?.();wikiOutsideCleanup=null;const titles=lang==='en'?{character:'Hero Workshop',skills:'Skill Tree',stats:'Attributes',builds:'Build Library',wiki:'Pandora Saga Encyclopedia'}:{character:'Мастерская героя',skills:'Дерево умений',stats:'Характеристики',builds:'Библиотека билдов',wiki:'Энциклопедия Pandora Saga'};$('detailTitle').textContent=titles[activeTab];$('detailContent').replaceChildren();const contents={character:renderCharacter,skills:renderSkills,stats:renderStats,builds:renderBuilds,wiki:renderWiki};contents[activeTab]($('detailContent'))}

let catalogArchived=false;
let wikiRenderSelected=null,wikiRenderedRoot=null,wikiBaseData=null;
let wikiLoadGeneration=0;
function invalidateWikiCatalog({dropSnapshot=false}={}){
 wikiLoadGeneration++;
 wikiIndex=null;wikiData=null;wikiPending=null;
 if(dropSnapshot)wikiBaseData=null;
}
async function loadWiki(){
 if(wikiIndex)return wikiIndex;
 if(wikiPending)return wikiPending;
 const generation=wikiLoadGeneration;
 const pending=(async()=>{
  // Owner edits rebuild from the already validated snapshot: no redundant
  // round-trip of all 11 D1 datasets for each double-click edit.
  if(!wikiBaseData){
   let loaded;
   // Never show an archive as a current Wiki snapshot. Archive mode is
  // available only after an explicit user choice on the startup screen.
   try{loaded=await window.PandoraWikiCatalog.load({
    api:API,fetcher:fetch,strict:!catalogArchived,preferLocal:catalogArchived})}
   catch(error){if(generation!==wikiLoadGeneration)return loadWiki();throw error}
   if(generation!==wikiLoadGeneration)return loadWiki();
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
  if(generation!==wikiLoadGeneration)return loadWiki();
  wikiData=resolved;
  wikiIndex=index;
  // Skills offer an explicit "All / Variants" source-record view: retain
  // the exact requested ID, including after F5 and direct wiki hyperlinks.
  // Other encyclopedia chapters still use their canonical entries.
  if(wikiSelection.id!=null&&!['honor','skill'].includes(wikiSelection.type))
   wikiSelection.id=index.canonical(wikiSelection.type,wikiSelection.id);
  return index;
 })();
 wikiPending=pending;
 try{return await pending}
 finally{if(wikiPending===pending)wikiPending=null}
}
// Every navigation entry owns its own source position. Honor, linked items,
// maps, NPCs and PvP wars all restore through the SAME history mechanism.
function wikiPosition(){
 if(activeTab!=='wiki')return null;
 return{
  chapter:wikiSelection.type,id:wikiSelection.id,
  inner:$('detailContent')?.scrollTop||0,
  browse:$('detailContent')?.querySelector('.wiki-list')?.scrollTop||0,
  search:wikiSearch,shown:wikiShown,itemType:wikiItemType,skillFilter:wikiSkillFilter
 };
}
function restoreWikiFilters(state,type,id){
 const position=state?.psWikiPosition;
 if(!position||position.chapter!==type||String(position.id??'')!==String(id??''))return;
 if(typeof position.search==='string')wikiSearch=position.search;
 if(Number.isInteger(position.shown)&&position.shown>=100)wikiShown=position.shown;
 if(type==='item'&&typeof position.itemType==='string')
  wikiItemType=position.itemType;
 if(type==='skill'&&Object.hasOwn(window.PandoraWikiSkillFilters.names,
  position.skillFilter||''))wikiSkillFilter=position.skillFilter;
}
function restoreWikiPosition(state){
 const position=state?.psWikiPosition;
 if(!position||position.chapter!==wikiSelection.type||
  String(position.id??'')!==String(wikiSelection.id??''))return;
 const {type,id}=wikiSelection;
 // React to completed DOM reconstruction, never restore the outgoing article.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(activeTab!=='wiki'||wikiSelection.type!==type||wikiSelection.id!==id)return;
  const scroller=$('detailContent');
  if(scroller&&Number.isFinite(position.inner))
   scroller.scrollTo({top:Math.max(0,position.inner),behavior:'instant'});
  const browse=scroller?.querySelector('.wiki-list');
  if(browse&&Number.isFinite(position.browse))
   browse.scrollTop=Math.max(0,position.browse);
 }));
}
function openWiki(type,id,highlight=null){
 const fromPosition=wikiPosition();
 const fromView={tab:activeTab,
  open:Boolean($('detailPanel')?.classList.contains('is-open')),
  selection:activeTab==='wiki'?{...wikiSelection}:null,
  search:activeTab==='wiki'?wikiSearch:'',
  shown:activeTab==='wiki'?wikiShown:100,
  skillFilter:wikiSkillFilter};
 const sameCategory=activeTab==='wiki'&&wikiSelection.type===type&&
  typeof wikiRenderSelected==='function'&&wikiRenderedRoot?.isConnected&&wikiIndex;
 if(activeTab!=='wiki'||wikiSelection.type!==type){wikiSearch='';wikiShown=100}
 wikiSelection={type,id:String(id),highlight:highlight==null?null:String(highlight)};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 // Capture the view before the first deep-link navigation. Browser Back
 // must return to the actual list or previous chapter, not a stale wiki page.
 const destination='#wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+
  (highlight!=null?'/'+encodeURIComponent(highlight):'');
 if(location.hash!==destination){
  const oldState=history.state&&typeof history.state==='object'?history.state:{};
  history.replaceState({...oldState,psWikiPosition:fromPosition,
   ...(!location.hash.startsWith('#wiki/')?{psWikiReturn:fromView}:{})},'',
   location.href);
  // pushState doesn't emit popstate/hashchange. The destination gets its
  // own empty position, filled only when the reader navigates elsewhere.
  history.pushState({...history.state,psWikiEntry:true,psWikiPosition:null},
   '',destination);
 }
 if(sameCategory)wikiRenderSelected();
 else renderDetails();
 $('detailContent').scrollTo({top:0,behavior:'instant'});
 if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
 saveView();
}
function openWikiChapterList(){
 const chapter=wikiSelection.type;
 if(!['item','monster','map','npc','chest','skill','soul','instance','honor'].includes(chapter))return;
 const listView={type:chapter,itemType:wikiItemType,search:wikiSearch,
  skillFilter:wikiSkillFilter,shown:wikiShown};
 const previous=history.state&&typeof history.state==='object'?history.state:{};
 // Back reopens the current record; Forward returns to this chapter list.
 history.pushState({...previous,psWikiEntry:false,psWikiList:listView},'',
  location.pathname+location.search);
 wikiSelection={type:chapter,id:null,highlight:null};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))
  btn.classList.toggle('active',btn.dataset.tab==='wiki');
 renderDetails();
 if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
 saveView();
}
// One Back action and one neutral label everywhere. The destination depends
// on the actual history entry, never on the currently displayed record type.
function wikiBackButton(){
 const label=lang==='en'?'← Back':'← Назад';
 return h('button',{type:'button',class:'wiki-return-button',
  text:label,'aria-label':label,onclick:()=>{
   if(location.hash.startsWith('#wiki/')&&history.state?.psWikiEntry===true)
    history.back();
   else openWikiChapterList();
  }});
}
function wikiLink(text,type,id,highlight=null){
 // A skill ID identifies a specific version with potentially different
 // MP costs and effects. Preserve it in Wiki links, even if the canonical
 // primary skill has the same name. Other chapters keep deduplication.
 const displayId=type==='skill'?String(id):
  wikiIndex?.canonical?.(type,id)||String(id);
 const href='#wiki/'+encodeURIComponent(type)+'/'+encodeURIComponent(displayId)+(highlight==null?'':'/'+encodeURIComponent(highlight));
 const link=h('a',{class:'wiki-link',href,text,onclick:event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();openWiki(type,displayId,highlight);
 }});
 // References inside item, Soul, NPC, monster and recipe articles use the
 // same rich skill preview as Hero Path, rather than plain text or titles.
 if(type==='skill'&&typeof window!=='undefined')
  window.PandoraSkillPreview?.attach(link,displayId);
 return link;
}
function guardEncyclopediaSearch(input){
 // Some password managers ignore autocomplete="off". Prevent automatic
 // credential injection until an actual user pointer or keyboard gesture.
 input.readOnly=true;
 input.setAttribute('autocomplete','off');
 input.setAttribute('data-lpignore','true');
 input.setAttribute('data-1p-ignore','true');
 input.setAttribute('data-bwignore','true');
 input.setAttribute('data-form-type','other');
 input.setAttribute('aria-autocomplete','none');
 input.setAttribute('spellcheck','false');
 input.addEventListener('focus',()=>{input.readOnly=false});
 input.addEventListener('pointerdown',()=>{input.readOnly=false});
 input.addEventListener('keydown',()=>{input.readOnly=false});
 input.addEventListener('blur',()=>{input.readOnly=true});
 return input;
}
function renderWiki(root){
 // Unsubscribe previous Honor scroll tracking when a chapter is replaced.
 // Owner inline re-renders separately restart their own listener.
 window.PandoraHonorView?.stopObserving?.();
 wikiRenderedRoot=root;
 const browse=h('div',{class:'wiki-list'}),detail=h('article',{class:'wiki-page'});
 // The list remains visible next to an article; a scroll control is more
 // useful than a redundant button that clears the current selection.
 const listPanel=h('div',{class:'wiki-list-panel'});
 const listTop=h('button',{type:'button',class:'wiki-list-top',
  text:lang==='en'?'↑ Back to top':'↑ В начало списка',hidden:true,
  'aria-label':lang==='en'?'Scroll the encyclopedia list to the beginning':
   'Прокрутить список энциклопедии к началу'});
 const updateListTop=()=>{
  const far=browse.scrollTop>Math.max(360,browse.clientHeight*.85);
  listTop.hidden=!far||browse.scrollHeight<=browse.clientHeight+40;
 };
 listTop.addEventListener('click',()=>{
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  browse.scrollTo({top:0,behavior:reduced?'instant':'smooth'});
  if(reduced)updateListTop();
 });
 browse.addEventListener('scroll',updateListTop,{passive:true});
 bindOwnerInterfaceText(listTop,'wiki-ui','backTop',
  '↑ В начало списка','↑ Back to top');
 bindOwnerInterfaceText(listTop,'wiki-ui','backTopAria',
  'Прокрутить список энциклопедии к началу',
  'Scroll the encyclopedia list to the beginning','aria-label');
 listPanel.append(browse,listTop);
 const controls=h('div',{class:'wiki-controls'}),categories=h('div',{class:'wiki-categories'});
 const wt=(ru,en)=>lang==='en'?en:ru;
 const wikiTitle=(group,key,ru,en)=>
  window.PandoraWikiLabels?.value(override,group,key,lang)||wt(ru,en);
 const outsidePickers=new Set();
 const cleanupOutsidePickers=()=>{
  for(const onOutside of outsidePickers)
   document.removeEventListener('pointerdown',onOutside,true);
  outsidePickers.clear();
 };
 const registerOutsidePicker=(panel,trigger=null)=>{
  const onOutside=event=>{
   if(!panel.isConnected||(!panel.contains(event.target)&&event.target!==trigger)){
    document.removeEventListener('pointerdown',onOutside,true);
    outsidePickers.delete(onOutside);
    panel.remove();
   }
  };
  outsidePickers.add(onOutside);
  document.addEventListener('pointerdown',onOutside,true);
 };
 let wikiSearchTimer=null;
 wikiOutsideCleanup=()=>{
  cleanupOutsidePickers();
  if(wikiSearchTimer!==null)clearTimeout(wikiSearchTimer);
  wikiSearchTimer=null;
 };
 let wikiResultsCache=null,wikiSkillModelCache=null;
 const skillModel=()=>{
  if(!wikiIndex)return null;
  if(wikiSkillModelCache?.index!==wikiIndex||
   wikiSkillModelCache?.manifest!==iconManifest||
   wikiSkillModelCache?.overrides!==override||
   wikiSkillModelCache?.racialPassives!==wikiData?.racialPassives){
   wikiSkillModelCache={index:wikiIndex,manifest:iconManifest,overrides:override,
    racialPassives:wikiData?.racialPassives,
    value:window.PandoraWikiSkillFilters.build(
     wikiIndex.records('skill'),wikiIndex,iconManifest,override,
     wikiData?.racialPassives)};
  }
  return wikiSkillModelCache.value;
 };
 // A racial skill's owner comes from the same published catalog registry as
 // the Origin tab, never from the broad technical branch or its name.
 const wikiRaceOwner=id=>{
  const target=String(id);
  for(const [index,key] of window.PandoraGameNavigation.raceKeys.entries()){
   const known=wikiData?.racialPassives?.[key]?.skills||[];
   if(known.some(skill=>String(skill)===target))
    return {index,name:races[index]?.[lang==='en'?1:0]||key};
  }
  return null;
 };
 let wikiSourceShown=80,wikiUsageShown=80,wikiSourceRecord='';
 for(const [key,ru,en]of[['item','Экипировка','Equipment'],
  ['utility','Предметы эффектов','Effect items'],
  ['monster','Монстры','Monsters'],['map','Локации','Locations'],
  ['honor','Честь','Honor'],['npc','NPC-обмен','NPC trades'],
  ['chest','Сундуки','Chests'],['instance','Подземелья','Dungeons'],
  ['skill','Навыки','Skills'],['soul','Души','Souls']]){
  const current=wikiTitle('chapter',key,ru,en);
  const chapter=h('button',{
   class:(key==='utility'?wikiSelection.type==='item'&&wikiItemType==='utility':
    key==='item'?wikiSelection.type==='item'&&wikiItemType!=='utility':
    wikiSelection.type===key)?'chosen':'',
   'data-wiki-chapter':key,
   onclick:()=>{
    if(key==='item'||key==='utility'){
     wikiSelection={type:'item',id:null,highlight:null};
     wikiItemType=key==='utility'?'utility':'equipment';
    }else wikiSelection={type:key,id:null,highlight:null};
    wikiSearch='';wikiShown=100;
    if(location.hash.startsWith('#wiki/'))openWikiChapterList();
    else renderDetails();
   }},[h('span',{class:'wiki-category-text',text:current})]);
  const line=h('div',{class:'wiki-category-line'},[chapter]);
  if(adminEditing&&adminToken){
   const edit=h('button',{type:'button',class:'wiki-category-edit',
    title:wt('Переименовать вкладку','Rename chapter'),
    'aria-label':wt('Переименовать вкладку: ','Rename chapter: ')+current,
    text:'✎'});
   edit.onclick=()=>{
    if(line.querySelector('[data-owner-text-field]'))return;
    const label=chapter.querySelector('.wiki-category-text');
    const field=window.PandoraWikiLabels.key('chapter',key,lang);
    const host=h('span',{class:'wiki-category-edit-host',text:label.textContent});
    chapter.hidden=true;edit.hidden=true;line.append(host);
    editWikiValue(host,label.textContent,{type:'text',
     onCommit:value=>saveGuidePatch('wiki.labels',{[field]:value}),
     onCommitted:value=>{if(label.isConnected)label.textContent=value},
     onFinished:()=>{chapter.hidden=false;edit.hidden=false;host.remove()}});
   };
   line.append(edit);
  }
  categories.append(line);
 }
 const search=h('input',{type:'search',value:wikiSearch,placeholder:lang==='en'?'Search by name':'Поиск по названию','aria-label':lang==='en'?'Search encyclopedia':'Поиск по энциклопедии',name:'pandora-studio-encyclopedia-filter',autocomplete:'off','data-lpignore':'true','data-1p-ignore':'true','data-bwignore':'true',spellcheck:'false'});
 guardEncyclopediaSearch(search);
 bindOwnerInterfaceText(search,'wiki-ui','searchPlaceholder',
  'Поиск по названию','Search by name','placeholder');
 bindOwnerInterfaceText(search,'wiki-ui','searchAria',
  'Поиск по энциклопедии','Search encyclopedia','aria-label');
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
   'aria-label':wt('Название монстра RU','Monster name RU'),
   placeholder:wt('Название · RU','Name · RU')});
  const en=ownerPlainTextField({class:'wiki-inline-input',
   'aria-label':wt('Название монстра EN','Monster name EN'),
   placeholder:wt('Название · EN','Name · EN')});
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
    if(!monsterId){error.textContent=wt('Не удалось создать монстра. Повтори попытку.','Could not create monster. Try again.');return}
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
    placeholder:wt('Название · RU','Name · RU'),
    'aria-label':wt('Название локации на русском','Location name in Russian')});
   const en=ownerPlainTextField({class:'wiki-inline-input',
    placeholder:wt('Название · EN','Name · EN'),
    'aria-label':wt('Название локации на английском','Location name in English')});
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
 if(wikiSelection.type==='skill'){
  const model=skillModel(),filterNames=window.PandoraWikiSkillFilters.names;
  const localizedFilterLabel=(id,labels)=>wikiTitle('skillFilter',id,labels.ru,labels.en);
  const optionFor=new Map();
  let skillLabelList=null,skillLabelToggle=null;
  const filter=h('select',{class:'wiki-effect-type wiki-skill-type',
   'aria-label':wt('Категория навыков','Skill category'),
   onchange:event=>{
    wikiSkillFilter=event.target.value;wikiShown=100;
    wikiSelection={...wikiSelection,id:null,highlight:null};
    if(skillLabelList){skillLabelList.hidden=true;
     skillLabelToggle?.setAttribute('aria-expanded','false')}
    wikiResultsCache=null;draw();saveView();
   }});
  for(const [id,labels] of Object.entries(filterNames)){
   const count=model?.counts?.[id];
   const name=localizedFilterLabel(id,labels);
   const option=h('option',{value:id,text:name+(count==null?'':' · '+count),
    'data-label-count':count==null?'':String(count)});
   if(wikiSkillFilter===id)option.selected=true;
   optionFor.set(id,option);filter.append(option);
  }
  // Reuse the native Encyclopedia filter and its established chapter-label
  // editor pattern. The edit rows expand IN the page (not a new floating menu).
  const toolbar=h('div',{class:'wiki-effect-toolbar wiki-skill-toolbar'},[filter]);
  if(adminEditing&&adminToken){
   const list=h('div',{class:'wiki-categories wiki-skill-edit-list',
    id:'wikiSkillLabelList',hidden:true,
    'aria-label':wt('Названия категорий навыков','Skill category labels')});
   const toggle=h('button',{type:'button',
    class:'wiki-category-edit wiki-skill-edit-toggle',text:'✎',
    'aria-controls':'wikiSkillLabelList','aria-expanded':'false',
    'aria-label':wt('Редактировать названия категорий',
     'Edit category names')});
   skillLabelList=list;skillLabelToggle=toggle;
   toggle.onclick=()=>{
    list.hidden=!list.hidden;
    toggle.setAttribute('aria-expanded',String(!list.hidden));
   };
   for(const [id,labels] of Object.entries(filterNames)){
    const row=h('div',{class:'wiki-category-line wiki-skill-edit-row',
     'data-skill-filter-label':id});
    const caption=h('span',{class:'wiki-category-text wiki-skill-label-caption',
     text:localizedFilterLabel(id,labels)});
    const edit=h('button',{type:'button',class:'wiki-category-edit wiki-skill-label-edit',
     text:'✎','aria-label':wt('Изменить: ','Edit: ')+caption.textContent});
    const startEdit=()=>{
     if(row.querySelector('[data-owner-text-field]')||!adminEditing||!adminToken)return;
     const name=caption.textContent,host=h('span',{
      class:'wiki-category-edit-host wiki-skill-edit-host',text:name});
     caption.hidden=true;edit.hidden=true;row.append(host);
     editWikiValue(host,name,{type:'text',
      onCommit:value=>saveGuidePatch('wiki.labels',{
       [window.PandoraWikiLabels.key('skillFilter',id,lang)]:value
      }),
      onCommitted:value=>{
       caption.textContent=value;
       edit.setAttribute('aria-label',wt('Изменить: ','Edit: ')+value);
       const count=model?.counts?.[id],option=optionFor.get(id);
       if(option)option.textContent=value+(count==null?'':' · '+count);
      },
      onFinished:()=>{caption.hidden=false;edit.hidden=false;host.remove()}
     });
    };
    edit.onclick=startEdit;
    caption.addEventListener('dblclick',event=>{event.preventDefault();startEdit()});
    row.append(caption,edit);list.append(row);
   }
   toolbar.append(toggle);
   controls.append(toolbar,list);
  }else controls.append(toolbar);
 }
 if(wikiSelection.type==='item'&&wikiItemType==='utility'){
  const hasReviewItems=Object.values(wikiIndex?.records('item')||{}).some(item=>
   window.PandoraWikiData.utilityCategories(item,wikiData?.skills).includes('review'));
  if(wikiEffectFilter==='review'&&!hasReviewItems)wikiEffectFilter='all';
  const filter=h('select',{class:'wiki-effect-type',
   'aria-label':wt('Тип предметов эффектов','Effect item category'),
   onchange:event=>{wikiEffectFilter=event.target.value;
    wikiSelection={...wikiSelection,id:null,highlight:null};wikiShown=100;draw()}});
  for(const [id,ru,en] of [
   ['all','Все предметы эффектов','All effect items'],
   ['buff','Дают положительные эффекты','Apply positive effects'],
   ['recovery','Восстанавливают ОЗ/ОМ','Restore HP/MP'],
   ['cure','Снимают негативные эффекты','Remove negative effects'],
   ['harmful','Дают отрицательные эффекты','Apply negative effects'],
   ['other','Прочие активируемые предметы','Other usable items'],
   ['review','Прочие эффекты','Other effects']]){
   if(id==='review'&&!hasReviewItems)continue;
   const option=h('option',{value:id,text:wt(ru,en)});
   if(wikiEffectFilter===id)option.selected=true;
   filter.append(option);
  }
  controls.append(h('div',{class:'wiki-effect-toolbar'},[filter]));
 }
 const view=h('div',{class:'wiki-equipment-view',role:'group',
  'aria-label':wt('Вид Энциклопедии','Encyclopedia view')});
 bindOwnerInterfaceText(view,'wiki-ui','viewAria',
  'Вид Энциклопедии','Encyclopedia view','aria-label');
 for(const [id,ru,en]of[['list','☰ Список','☰ List'],['grid','▦ Сетка','▦ Grid']]){
  const button=h('button',{type:'button',text:wt(ru,en),
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
   }});
  bindOwnerInterfaceText(button,'wiki-ui',id==='list'?'viewList':'viewGrid',ru,en);
  view.append(button);
 }
 controls.append(view);
 if(adminEditing&&adminToken)controls.append(ownerInterfaceEditor('wiki-ui',[
  ['searchPlaceholder','Поиск по названию','Search by name','Подсказка поиска','Search placeholder'],
  ['searchAria','Поиск по энциклопедии','Search encyclopedia','Название поиска','Search accessible name'],
  ['backTop','↑ В начало списка','↑ Back to top','В начало','Back to top'],
  ['backTopAria','Прокрутить список энциклопедии к началу',
   'Scroll the encyclopedia list to the beginning','Описание перехода','Top-button description'],
  ['viewAria','Вид Энциклопедии','Encyclopedia view','Переключатель вида','View selector'],
  ['viewList','☰ Список','☰ List','Режим списка','List mode'],
  ['viewGrid','▦ Сетка','▦ Grid','Режим сетки','Grid mode']
 ],'Подписи энциклопедии','Encyclopedia labels'));
 const layout=h('div',{class:'wiki-layout'});
 layout.append(listPanel,detail);root.append(controls,layout);
 if(wikiSelection.type==='honor'){
  // Honor navigation sticks inside the encyclopedia's actual scroll viewport.
  layout.classList.add('wiki-layout-honor');
  view.hidden=true;
  const renderHonor=()=>{
   if(!root.isConnected)return;
   window.PandoraHonorView?.render({
    browse,detail,make:h,lang,article:window.PandoraHonorGuide?.article(override),
    searchQuery:wikiSearch,
    editable:adminEditing&&Boolean(adminToken),
    label:(group,id,ru,en)=>wikiTitle(group,id,ru,en),
    copy:(key,ru,en)=>ownerCopy('honor-view',key,ru,en),
    editCopy:(node,key,ru,en,callbacks)=>ownerCopyLabel(node,'honor-view',key,ru,en,callbacks),
    editLabel:(node,group,id,initial)=>editWikiValue(node,initial,{type:'text',
     onCommit:value=>saveGuidePatch('wiki.labels',{
      [window.PandoraWikiLabels.key(group,id,lang)]:value
     })}),
    editText:(node,initial,multiline,onCommit)=>editWikiValue(node,initial,{
     type:multiline?'textarea':'text',onCommit}),
    saveText:saveGuidePatch,saveList:saveGuideList,
    warId:/^war-[a-z][a-z0-9-]{0,35}$/.test(wikiSelection.id||'')?
     wikiSelection.id.slice(4):null,
    warLink:(warId,name)=>{
     const anchor=wikiLink(name,'honor','war-'+warId);
     anchor.addEventListener('click',event=>{
      if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey)
       $('detailContent').scrollTop=0;
     });
     return anchor;
    },
    backButton:wikiBackButton,
    mapOptions:Object.entries(wikiIndex?.records('map')||{})
     .map(([id,rec])=>{
      const approved=window.PandoraHonorGuide?.maps?.find(row=>String(row.mapId)===id);
      return{id,nameRu:rec.name||approved?.nameRu||String(id),
       nameEn:rec.nameEn||officialEnglish?.maps?.[id]?.n||
        approved?.nameEn||rec.name||String(id)};
     })
     .sort((a,b)=>(lang==='en'?a.nameEn:a.nameRu)
      .localeCompare(lang==='en'?b.nameEn:b.nameRu,lang==='en'?'en':'ru')),
    link:(mapId,name)=>wikiIndex?.records('map')?.[String(mapId)]?
     wikiLink(name,'map',mapId):null,
    cloakLink:(name,russianName)=>{
     // Existing catalog records are the single source of truth for reward links.
     const normalize=value=>wikiIndex?.normalize(String(value||''))||'';
     const candidates=new Set([name,russianName].map(normalize).filter(Boolean));
     const found=Object.entries(wikiIndex?.records('item')||{}).find(([id,row])=>{
      const source=wikiData?.items?.[id]||row;
      return [row.name,row.nameEn,source.name,source.nameEn,
       officialEnglish?.items?.[id]?.n].some(value=>
        value&&candidates.has(normalize(value)));
     });
     if(!found)return null;
     const [id,row]=found,source=wikiData?.items?.[id]||row;
     const translated=lang==='en'?{...source,
      name:source.nameEn||officialEnglish?.items?.[id]?.n||source.name,
      desc:source.descEn??officialEnglish?.items?.[id]?.d??source.desc}:source;
     const anchor=wikiLink(name,'item',id);
     anchor.classList.add('wiki-honor-cloak-link');
     window.PandoraStageItemUI?.attachPreview(anchor,translated,item=>itemIcon(item),'item');
     return anchor;
    },
    onOpenLocations:()=>{
     wikiSelection={type:'map',id:null,highlight:null};
     wikiSearch='';wikiShown=100;renderDetails();saveView();
    }
   });
  };
  wikiRenderSelected=renderHonor;
  // Honor does not use the OS record index. Its search must be connected
  // before the early return which bypasses the usual Wiki draw() listener.
  search.addEventListener('input',()=>{
   wikiSearch=search.value;wikiShown=100;
   if(wikiSearchTimer!==null)clearTimeout(wikiSearchTimer);
   wikiSearchTimer=setTimeout(()=>{
    wikiSearchTimer=null;
    if(!root.isConnected||activeTab!=='wiki'||wikiSelection.type!=='honor')return;
    renderHonor();
    browse.scrollTop=0;detail.scrollTop=0;
   },100);
  });
  renderHonor();
  // Honor's reward cloaks and PvP map links use the same indexed catalog as
  // the rest of Wiki. Opening Honor before its first async load used to leave
  // those names permanently unlinked until the whole chapter was reopened.
  if(!wikiIndex){
   void loadWiki().then(()=>{
    if(root.isConnected&&activeTab==='wiki'&&wikiSelection.type==='honor')
     renderHonor();
   }).catch(()=>{
    // Keep the readable Honor article visible if the catalog is unavailable.
   });
  }
  return;
 }

 const nameCache=new Map();
 // The Wiki search index caches translated terms by resolver identity.
 // Keep one resolver while the data/locale is unchanged, but replace it
 // whenever any of these sources change so stale EN/RU results cannot survive.
 let lastWikiIndex=null,lastWikiEnglish=null,lastWikiLanguage=null;
 let searchResolver=null;
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
  const en=(obj?.nameEn&&['item','chest','map','npc','monster','skill','soul','instance'].includes(type)?obj.nameEn:null)||
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
  // The displayed record is localized in EN mode. Keep the original
  // source-owned Russian name searchable, not just the translated name.
  const original=type==='item'||type==='chest'?catalogSource?.items?.[id]:
   type==='monster'?catalogSource?.monsters?.[id]:
   type==='map'?catalogSource?.maps?.[id]:
   type==='npc'?catalogSource?.trades?.npcs?.[id]:
   type==='skill'?catalogSource?.skills?.[id]:
   type==='soul'?catalogSource?.souls?.[id]:
   type==='instance'?catalogSource?.instances?.find(row=>String(row.id)===String(id)):null;
  const originalName=typeof original?.name==='string'?original.name:null;
  const territoryAlias=type==='map'?
   window.PandoraAstirLocations?.searchAliases(id):null;
  const npc=type==='npc'?wikiIndex.records('npc')?.[id]:null;
  const verifiedNpcAlias=npc?[npc.en,npc.nameEn,npc.name].filter(Boolean).join(' '):null;
  const value=[dataName(type,id),originalName,translated?.n,verifiedNpcAlias,territoryAlias,
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
   const resolved=lang==='en'?{...record,name:record.nameEn||en?.n||record.name,
    desc:record.descEn??en?.d??record.desc}:record;
   window.PandoraStageItemUI?.attachPreview(anchor,resolved,
    row=>wikiIcon(dest,id,row),hasSoul?'soul':'item');
  }
  return anchor;
 };
 const matchesWords=searchWords;

 const wikiItemChoice=(container,selectItem)=>{
  const previous=container.querySelector('.wiki-owner-item-choice');
  if(previous){previous.remove();return}
  const form=h('div',{class:'wiki-owner-source-picker wiki-owner-item-choice'});
  const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
   placeholder:wt('Название предмета…','Item name…'),autocomplete:'off','aria-label':wt('Найти предмет','Find item')});
  const target=h('select',{class:'wiki-inline-select','aria-label':wt('Выбери предмет','Choose item')});
  const feedback=h('small',{class:'inline-owner-error',role:'status'});
  form.append(search,target,feedback);container.append(form);
  const items=Object.entries(wikiData.items||{});
  const fill=()=>{
   const q=wikiIndex.normalize(search.value);
   const matches=items.filter(([id])=>!q||searchWords(searchTerms('item',id),q)).slice(0,80);
   target.replaceChildren(h('option',{value:'',
    text:matches.length?wt('Выбери предмет','Choose item'):wt('Предметы не найдены','No items found')}));
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
  registerOutsidePicker(form);
  fill();search.focus();
 };
 function wikiOwnerEntityList({label,existing,kind,onChange,limit=1000,replaceable=true,replaceCandidate=null}){
 const container=h('div',{class:'wiki-owner-relations'});
 if(label)container.append(h('h4',{text:label}));
 const ids=[...new Set((existing||[]).map(String))];
 const candidates=kind==='monster'?wikiData.monsters:
  kind==='npc'?wikiIndex.records('npc'):
  kind==='map'?wikiIndex.records('map'):
  kind==='item'?wikiData.items:wikiIndex.records('instance');
 const idValue=value=>/^[1-9][0-9]{0,14}$/.test(String(value))?Number(value):String(value);
 const wt=(ru,en)=>lang==='en'?en:ru;
 const holder=h('div',{class:'wiki-entity-flow'});
 const openPicker=(button,replaceId=null)=>{
  const previous=container.querySelector('.wiki-owner-relation-picker');
  if(previous){previous.remove();if(previous.dataset.ownerSource===replaceId)return}
  const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-relation-picker'});
  panel.dataset.ownerSource=replaceId||'';
  const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
   placeholder:wt('Поиск по названию…','Search by name…'),
   'aria-label':wt('Поиск связи','Search relations'),autocomplete:'off'});
  const select=h('select',{class:'wiki-inline-select',
   'aria-label':replaceId?wt('Заменить на','Replace with'):
    wt('Выбери запись','Choose entry')});
  const feedback=h('small',{class:'inline-owner-error',role:'status'});
  const fill=()=>{
   const q=wikiIndex.normalize(search.value);
   const choices=Object.entries(candidates||{}).filter(([key])=>
    !ids.includes(key)&&(!replaceId||!replaceCandidate||replaceCandidate(key))&&
    (!q||searchWords(searchTerms(kind,key),q))
   ).slice(0,90);
   select.replaceChildren(h('option',{value:'',text:choices.length?
    wt('Выбери запись','Choose entry'):wt('Ничего не найдено','No matches')}));
   for(const [key] of choices)select.append(h('option',{
    value:key,text:dataName(kind,key)}));
   select.disabled=!choices.length;
  };
  select.onchange=async()=>{
   const chosen=String(select.value||'');
   if(!chosen||!Object.hasOwn(candidates||{},chosen)||ids.includes(chosen))return;
   const next=replaceId?ids.map(id=>id===replaceId?chosen:id):[...ids,chosen];
   if(new Set(next).size!==next.length)return;
   select.disabled=true;feedback.textContent='';
   try{await Promise.resolve(onChange(next.map(idValue)))}
   catch(error){feedback.textContent=error?.message||String(error);select.disabled=false}
  };
  panel.append(search,select,feedback,h('button',{type:'button',
   class:'wiki-owner-remove',text:wt('Отмена','Cancel'),
   onclick:()=>panel.remove()}));
  button.after(panel);
  search.oninput=fill;registerOutsidePicker(panel,button);
  fill();search.focus();
 };
 for(const key of ids){
  const chip=h('span',{class:'wiki-owner-mat'});
  chip.append(kind==='item'?itemLink(key,dataName(kind,key)):
   wikiLink(dataName(kind,key),kind,key));
  if(adminEditing&&adminToken){
   if(replaceable)chip.append(h('button',{type:'button',
    class:'wiki-owner-replace',text:'✎',
    'aria-label':wt('Заменить связь: ','Replace relation: ')+dataName(kind,key),
    title:wt('Заменить на другую запись из каталога','Replace with an existing record'),
    onclick:event=>{event.stopPropagation();openPicker(chip,key)}}));
   chip.append(h('button',{type:'button',class:'wiki-owner-remove',text:'×',
    'aria-label':wt('Удалить связь: ','Remove relation: ')+dataName(kind,key),
    onclick:()=>void Promise.resolve(onChange(ids.filter(id=>id!==key).map(idValue)))
     .catch(err=>showStudioToast(err.message,'warning'))}));
  }
  holder.append(chip);
 }
 if(adminEditing&&adminToken&&ids.length<limit){
  const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
   text:wt('+ Добавить','+ Add'),
   title:wt('Выбрать запись по имени','Choose an existing record by name'),
   onclick:()=>openPicker(add)});
  holder.append(add);
 }
 container.append(holder);
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
  }else if(row.type==='owner-monster'){
   line.append(link('♞ '+dataName('monster',row.id),'monster',row.id,'wiki-source-primary'));
   line.append(h('small',{class:'wiki-source-meta',text:wt(
    'Указано редактором · шанс не задан','Curated entry · chance unspecified')}));
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
  {warrior:'Warrior',scout:'Scout',acolyte:'Acolyte',mage:'Mage'}:
  {warrior:'Воин',scout:'Следопыт',acolyte:'Адепт',mage:'Маг'};
 const appendRewardChestInfo=(itemId)=>{
  const reward=wikiIndex.rewardChest(itemId);
  if(!reward)return false;
  const className=rewardLabels[reward.family];
  detail.append(h('div',{class:'wiki-level-reward'},[
   h('span',{class:'wiki-level-reward-mark','aria-hidden':'true',text:'✦'}),
   h('div',{class:'wiki-level-reward-details'},[
    h('small',{text:wt('Награда за достижение уровня','Reward for reaching level')}),
    h('strong',{text:wt('Уровень ','Level ')+reward.level}),
    ...(className?[h('span',{class:'wiki-level-reward-class',text:wt('Класс: ','Class: ')+className})]:[])
   ])
  ]));
  return true;
 };

 const appendAcquisitionEditor=(id)=>{
  if(!adminEditing||!adminToken)return;
  const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
   text:wt('+ Добавить источник','+ Add source'),
   title:wt('Связать предмет с игровым источником','Link an item to a source')});
  add.onclick=()=>{
   const previous=detail.querySelector('.wiki-owner-acquisition-picker');
   if(previous){previous.remove();return}
   const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-acquisition-picker'});
   const kind=h('select',{class:'wiki-inline-select',
    'aria-label':wt('Тип получения','Source type')},[
    h('option',{value:'',text:wt('Выбери тип получения','Select source type')}),
    h('option',{value:'drop',text:wt('Добыча монстра','Monster loot')}),
    h('option',{value:'monster',text:wt('Справочная связь с монстром','Monster reference')}),
    h('option',{value:'npc',text:wt('Справочная связь с NPC','NPC reference')})
   ]);
   const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
    'aria-label':wt('Найти монстра или NPC','Find a monster or NPC'),
    placeholder:wt('Поиск по названию…','Search by name…'),autocomplete:'off'});
   const target=h('select',{class:'wiki-inline-select',
    'aria-label':wt('У кого получить','Source to obtain from'),disabled:true});
   const feedback=h('small',{class:'inline-owner-error',role:'status'});
   const hint=h('small',{class:'wiki-source-meta',text:''});
   const label=(text,control)=>h('label',{class:'wiki-owner-source-field'},[
    h('span',{text}),control]);
   panel.append(label(wt('Тип получения','Source type'),kind),
    label(wt('Найди по имени','Search by name'),search),
    label(wt('Выбери источник','Choose source'),target),hint,feedback,
    h('button',{type:'button',class:'wiki-owner-cancel',
     text:wt('Отмена','Cancel'),onclick:()=>panel.remove()}));
   add.after(panel);
   const refresh=()=>{
    const isMonster=kind.value==='drop'||kind.value==='monster';
    const entries=isMonster?Object.entries(wikiData.monsters||{}):
     kind.value==='npc'?Object.entries(wikiData.trades?.npcs||{}):[];
    const q=wikiIndex.normalize(search.value);
    const filtered=entries.filter(([key])=>
     (kind.value!=='drop'||/^[1-9][0-9]{0,14}$/.test(String(key)))&&
     (!q||searchWords(searchTerms(isMonster?'monster':'npc',key),q))
    ).slice(0,90);
    target.replaceChildren(h('option',{value:'',
     text:filtered.length?wt('Выбери запись','Choose entry'):
      wt('Ничего не найдено','No matches')}));
    for(const [key,obj] of filtered){
     const suffix=isMonster&&Number.isFinite(obj.level)?
      wt(' · ур. ',' · lvl ')+obj.level:'';
     target.append(h('option',{value:key,
      text:dataName(isMonster?'monster':'npc',key)+suffix}));
    }
    target.disabled=!kind.value||!filtered.length;
    hint.textContent=kind.value==='drop'?
     wt('Добавит предмет в обычную добычу монстра. Шанс останется не указан.',
      'Adds the item to normal monster loot. Drop chance remains unspecified.'):
     kind.value?
     wt('Справочная связь не изменяет таблицы добычи и обменов.',
      'Reference only; does not modify loot or trade tables.'):'';
   };
   kind.onchange=()=>{search.value='';feedback.textContent='';refresh();search.focus()};
   search.oninput=refresh;
   target.onchange=async()=>{
    if(!target.value||!kind.value)return;
    feedback.textContent='';
    const targetId=String(target.value);
    if(kind.value==='drop'){
     if(!/^[1-9][0-9]{0,14}$/.test(targetId)||
      !wikiData.monsters?.[targetId]||!wikiData.items?.[id]){
      feedback.textContent=wt('Монстр или предмет не найден','Monster or item not found');
      return;
     }
     const current=wikiData.drops?.[targetId]||{d:[],s:[]};
     const d=(current.d||[]).map(row=>({...row}));
     const special=(current.s||[]).map(row=>({...row}));
     if([...d,...special].some(row=>String(row.i)===String(id))){
      feedback.textContent=wt('Предмет уже есть в добыче этого монстра.',
       'This item is already in this monster’s loot.');return;
     }
     if(d.length>=200){
      feedback.textContent=wt('Список обычной добычи заполнен.',
       'The normal loot list is full.');return;
     }
     target.disabled=true;
     try{
      await saveWikiRelationRows('drop',targetId,{
       d:[...d,{i:Number(id),n:1,p:null}],s:special});
     }catch(error){target.disabled=false;feedback.textContent=error.message}
     return;
    }
    const selected={type:kind.value,id:targetId};
    if(wikiIndex.sources(id).some(row=>row.type===selected.type&&
     String(row.id)===selected.id)){
     feedback.textContent=wt('Этот источник уже указан.','Source already listed.');return;
    }
    const earlier=wikiData.ownerAcquisitions?.[id]||[];
    if(earlier.length>=24){
     feedback.textContent=wt('Достигнут предел: 24 связи.',
      'Limit reached: 24 references.');return;
    }
    target.disabled=true;
    try{await saveWikiAcquisitions(id,[...earlier,selected])}
    catch(error){target.disabled=false;feedback.textContent=error.message}
   };
   registerOutsidePicker(panel,add);
   refresh();kind.focus();
  };
  detail.append(add);
 };
 const draw=(detailOnly=false)=>{
   if(lastWikiIndex!==wikiIndex||lastWikiEnglish!==officialEnglish||
    lastWikiLanguage!==lang){
    nameCache.clear();searchCache.clear();wikiResultsCache=null;
    lastWikiIndex=wikiIndex;lastWikiEnglish=officialEnglish;
    lastWikiLanguage=lang;
    // A new callback on EVERY keystroke defeats WikiData's WeakMap cache.
    // This identity now persists until the catalog or language changes.
    searchResolver=id=>searchTerms(wikiSelection.type,id);
   }
   const previousScroll=browse.scrollTop,previousDetailScroll=detail.scrollTop;
  window.PandoraStageItemUI?.dismissPreview();
  const sourceKey=wikiSelection.type+':'+String(wikiSelection.id??'');
  if(wikiSourceRecord!==sourceKey){
   wikiSourceShown=80;wikiUsageShown=80;wikiSourceRecord=sourceKey;
  }
  if(!detailOnly)browse.replaceChildren();
  cleanupOutsidePickers();
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
  const utilityCategories=item=>window.PandoraWikiData.utilityCategories(item,wikiData?.skills);
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
  const filterModel=type==='skill'?skillModel():null;
  if(type==='skill'&&wikiSelection.id!=null&&records?.[wikiSelection.id]&&
   !filterModel.matches(wikiSelection.id,wikiSkillFilter)){
   wikiSkillFilter=filterModel.group(wikiSelection.id);
   const picker=controls.querySelector('.wiki-skill-type');
   if(picker)picker.value=wikiSkillFilter;
  }
  const resultKey=JSON.stringify([type,wikiSearch,wikiItemType,wikiEffectFilter,
   wikiSkillFilter,wikiElementFilter,wikiItemEligibility,state.level,state.job,state.race,
   state.gender,lang]);
  let results=wikiResultsCache?.index===wikiIndex&&
   wikiResultsCache.equipment===catalog.equipment&&
   wikiResultsCache.english===officialEnglish&&
   (type!=='skill'||wikiResultsCache.filterModel===filterModel)&&
   wikiResultsCache.key===resultKey?wikiResultsCache.rows:null;
  if(!results){
   results=wikiIndex.search(type,wikiSearch,searchResolver,
    {includeVariants:type==='skill'})
    .filter(([id,rec])=>{
     if(type==='skill')return filterModel.matches(id,wikiSkillFilter);
     if(type!=='item')return true;
     if(!isVisibleItem(rec,wikiItemType))return false;
     return ['all','elemental','utility'].includes(wikiItemType)||wikiItemEligibility==='all'||
      heroCompatible(rec,state.level);
    });
   if(type==='skill'&&wikiSkillFilter==='racial'&&!wikiSearch)
    results.sort((a,b)=>(wikiRaceOwner(a[0])?.index??99)-
     (wikiRaceOwner(b[0])?.index??99));
   if(type==='map'&&!wikiSearch){
    const geo=window.PandoraAstirLocations;
    const rank=new Map([...(geo?.districtIds||[]),...(geo?.countryIds||[])]
     .map((id,index)=>[id,index]));
    results.sort((a,b)=>(rank.get(String(a[0]))??100)-
     (rank.get(String(b[0]))??100));
   }
   wikiResultsCache={index:wikiIndex,equipment:catalog.equipment,
    english:officialEnglish,filterModel,key:resultKey,rows:results};
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
   const batch=document.createDocumentFragment();
   batch.append(h('p',{class:'muted',text:lang==='en'?'Showing '+visible.length+' of '+results.length+' entries':'Показано '+visible.length+' из '+results.length+' записей'}));
   let lastPlaceGroup=null,lastRacialGroup=null;
   for(const [id,rec]of visible){
    if(type==='skill'&&wikiSkillFilter==='racial'&&!wikiSearch){
     const owner=wikiRaceOwner(id);
     if(owner&&owner.name!==lastRacialGroup){
      batch.append(h('h4',{class:'wiki-location-list-heading',text:owner.name}));
      lastRacialGroup=owner.name;
     }
    }
    if(type==='map'&&!wikiSearch){
     const geo=window.PandoraAstirLocations;
     const group=geo?.district(id)?'city':geo?.country(id)?'nation':'other';
     if(group!==lastPlaceGroup){
      batch.append(h('h4',{class:'wiki-location-list-heading',text:{
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
    batch.append(row);
   }
   if(results.length>wikiShown){
    batch.append(h('button',{type:'button',class:'wiki-more',text:(lang==='en'?'Show more ':'Показать ещё ')+Math.min(100,results.length-wikiShown)+' / '+(results.length-wikiShown),
     onclick:()=>{wikiShown+=100;draw()}}));
   }
   browse.append(batch);
   browse.scrollTop=selectedIndex>=wikiShown?0:previousScroll;
   updateListTop();
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
  // The destination is the real origin, which may belong to another chapter.
  // A neutral label avoids falsely promising a category-specific destination.
  detail.append(wikiBackButton());
   if(['monster','map','npc','instance'].includes(type))detail.append(h('span',{class:'wiki-category-symbol','aria-hidden':'true',text:wikiGlyphs[type]}));
   const nameKey=type==='skill'?'skill.'+(rec.branch||'race')+'.'+id:
    ['item','chest'].includes(type)?'item.'+id:null;
   const heading=h('h3',{text:dataName(type,id),
    ...(adminEditing&&lang==='ru'&&nameKey?{'data-edit-key':nameKey}:{}),
    ...(adminEditing&&lang==='en'&&['item','chest'].includes(type)?
     {'data-owner-record':'item:'+id,'data-owner-field':'nameEn'}:{}),
    ...(adminEditing&&(lang==='ru'||['npc','map','monster','soul','instance'].includes(type))&&
     ['monster','map','npc','instance','soul'].includes(type)||
     adminEditing&&lang==='en'&&type==='skill'?
      {'data-owner-record':type+':'+id,
       'data-owner-field':lang==='en'?'nameEn':'name'}:{})});
   detail.append(heading);
   if(adminEditing&&adminToken){
    detail.append(h('p',{class:'wiki-owner-instruction',
     text:wt('✎ Подчёркнутые значения: двойной клик или F2 — изменить. При выходе из поля — автосохранение в Cloudflare D1.',
      '✎ Highlighted values: double-click or F2 to edit. Leaving the field saves automatically to Cloudflare D1.')}));
    if(['item','chest','map','monster','npc','skill','soul','instance'].includes(type))
     heading.tabIndex=0;
    if(['map','monster'].includes(type)&&
     (type==='map'&&window.PandoraWikiOwnerData.customMapId(id)||
      type==='monster'&&window.PandoraWikiOwnerData.ownerMonsterId(id))){
     const owned=Boolean(rec.ownerCreated);
     if(owned){
      const button=h('button',{type:'button',
       class:'wiki-owner-remove wiki-owner-delete-record',
       text:type==='map'?wt('Удалить созданную локацию','Delete created location'):
        wt('Удалить созданного монстра','Delete created monster')});
      const remove=async()=>{
       const maps=wikiIndex.records('map')||{};
       const instances=wikiIndex.records('instance')||{};
       const usedInCustom=Object.values(maps).some(loc=>
        (loc.extraSections||[]).some(group=>
         group.kind===type&&group.entries?.some(x=>String(x)===String(id))));
       const linked=type==='map'?
        (rec.mobs||[]).length||(rec.npcs||[]).length||
         (rec.loot||[]).length||wikiIndex.residents(id).length||
         (window.PandoraHonorGuide?.article?.(override)?.zones||[])
          .some(row=>String(row.mapId)===String(id)):
        wikiIndex.locations(id).length||
         Object.values(instances).some(d=>(d.mobs||[]).some(x=>String(x)===String(id)));
       if(linked||usedInCustom){
        showStudioToast(wt(
         'Сначала убери связанные монстров, NPC, добычу, разделы и ссылки на эту запись. Удаление с зависимостями заблокировано.',
         'Remove linked monsters, NPCs, loot, sections and references before deleting this record.'),
         'warning');return;
       }
       if(!confirm(type==='map'?
        wt('Удалить созданную вручную локацию из D1? Это нельзя отменить после завершения сеанса.',
         'Delete this owner-created location from D1? This cannot be undone after the session.'):
        wt('Удалить созданную вручную карточку монстра из D1?',
         'Delete this owner-created monster card from D1?')))return;
       const key='wikiedit.'+type+'.'+id,before=activeOverride(key);
       if(before===null)return;
       button.disabled=true;
       try{
        await apiRequest('/api/admin/reset',{key});
        delete override[key];ownerEdits.push({key,before,after:null});
        wikiSelection={type,id:null,highlight:null};wikiSearch='';
        await refreshOwnerCatalog();refreshOwnerUI();
       }catch(error){button.disabled=false;showStudioToast(
        'Удаление не выполнено: '+error.message,'warning')}
      };
      button.onclick=()=>void remove();
      detail.append(button);
     }
    }
   }
   if(type==='npc'&&rec.ownerCreated&&window.PandoraWikiOwnerData.ownerNpcId(id)&&
     adminEditing&&adminToken){
    const button=h('button',{type:'button',class:'wiki-owner-remove wiki-owner-delete-record',
     text:wt('Удалить созданного NPC','Delete created NPC')});
    button.onclick=async()=>{
     const linked=Object.values(wikiIndex.records('map')||{}).some(loc=>
      (loc.npcs||[]).some(x=>String(x)===String(id))||
      (loc.extraSections||[]).some(group=>
       group.kind==='npc'&&(group.entries||[]).some(x=>String(x)===String(id))));
     if(linked){
      showStudioToast(wt('Сначала убери ссылки на NPC из локаций и разделов.',
       'Remove NPC references from maps and custom sections before deletion.'),'warning');
      return;
     }
     if(!confirm(wt('Удалить созданного вручную NPC из Cloudflare D1?',
      'Delete this owner-created NPC from Cloudflare D1?')))return;
     const key='wikiedit.npc.'+id,before=activeOverride(key);
     if(before===null)return;
     button.disabled=true;
     try{
      await apiRequest('/api/admin/reset',{key});
      delete override[key];ownerEdits.push({key,before,after:null});
      wikiSelection={type:'npc',id:null,highlight:null};wikiSearch='';
      await refreshOwnerCatalog();refreshOwnerUI();
     }catch(error){button.disabled=false;showStudioToast(
      'Удаление не выполнено: '+error.message,'warning')}
    };
    detail.append(button);
   }
   const namesakes=wikiIndex.sameName(type,id);
   if(namesakes.length)detail.append(h('small',{class:'wiki-variant-note',
    text:wt('Есть другие варианты с таким названием','Other entries share this name')}));

  if(type==='item'||type==='chest'||type==='soul'){
    const img=wikiImage(wikiIcon(type,id,rec),'wiki-record-icon wiki-item-portrait',type);
    if(img){
     const back=detail.querySelector('.wiki-return-button');
     if(back)back.after(img);else detail.prepend(img);
    }
  }
  const described=type==='chest'?wikiData.items?.[id]:rec;
  const englishDescription=lang==='en'?(described?.descEn||rec?.descEn||officialEnglish?.[
   type==='item'||type==='chest'?'items':type==='soul'?'souls':
   type==='monster'?'monsters':type==='skill'?'skills':'maps']?.[id]?.d):null;
  const rawDescription=englishDescription||described?.desc||'';
  const missingDescription=!rawDescription.trim()||
   /^Недоступно\s*\(не загружено\)$/i.test(rawDescription.trim());
  if(!missingDescription||
   (adminEditing&&adminToken&&(lang==='ru'||['item','chest','npc','map','monster','soul','skill'].includes(type))&&type!=='instance')){
   const text=rawDescription;
   const missing=missingDescription;
   const descKey=type==='skill'?'skilldesc.'+(rec.branch||'race')+'.'+id:
    ['item','chest'].includes(type)?'itemdesc.'+id:null;
   const description=h('p',{class:'wiki-description'+(missing?' wiki-description-placeholder':''),text:
    missing?wt('Двойной клик — добавить описание','Double-click to add description'):'',
    ...(adminEditing&&lang==='ru'&&descKey?{'data-edit-key':descKey}:{}),
    ...(adminEditing&&lang==='en'&&['item','chest'].includes(type)?
     {'data-owner-record':'item:'+id,'data-owner-field':'descEn',
      ...(missing?{'data-owner-empty':'true'}:{})}:{}),
    ...(adminEditing&&(lang==='ru'||['npc','map','monster','soul','instance'].includes(type))&&
     ['monster','map','npc','instance','soul'].includes(type)||
     adminEditing&&lang==='en'&&type==='skill'?
      {'data-owner-record':type+':'+id,
       'data-owner-field':lang==='en'?'descEn':type==='instance'?'blurbRu':'desc',
       ...(missing?{'data-owner-empty':'true'}:{})}:{})});
   if(!missing){
    // Treat the game description as plain text plus verified item references.
    // Never inject game-provided markup into innerHTML.
    description._sourceDescription=text;
    const lookup=key=>wikiData.items?.[key]?dataName('item',key):null;
    for(const segment of window.PandoraItemPresentation.descriptionSegments(text,lookup,lang)){
     if(segment.type==='item'&&segment.exists)
      description.append(wikiLink(segment.text,'item',segment.id));
     else description.append(document.createTextNode(segment.text));
    }
   }
   detail.append(description);
  }
  if(type==='item'){
   const kinds=utilityCategories(rec),effects=Array.isArray(rec.effects)?rec.effects:[];
   const activated=[...new Set(effects.filter(effect=>
    effect?.dir==='TARGET'&&/^EP_SKILL_EXEC(?:_|$)/.test(effect.func||'')&&
    wikiData.skills?.[String(effect.a)]).map(effect=>String(effect.a)))];
   if(activated.length){
    const used=h('div',{class:'wiki-effect-usage'});
    used.append(h('small',{text:wt('При использовании:',
     'On use:')}));
    for(const skillId of activated)used.append(wikiLink(
     dataName('skill',skillId),'skill',skillId));
    detail.append(used);
   }
   if(kinds.includes('cure')&&activated.some(skillId=>
    wikiData.skills?.[skillId]?.funcs?.some(effect=>
     effect.ep==='EP_REMOVE_BAD_EFFECT'&&effect.dir==='TARGET')))
    detail.append(h('p',{class:'wiki-description wiki-effect-cure-note',
     text:wt('Снимает один отрицательный эффект с цели.',
      'Removes one negative effect from the target.')}));
   if(kinds.includes('harmful')){
    const eatenPoison=effects.some(effect=>effect.func==='EP_DESTINED_POISON'&&
     effect.dir==='TARGET');
    detail.append(h('p',{class:'wiki-description wiki-harmful-consumable-note',
     text:eatenPoison?
      wt('При употреблении вызывает отравление («Яд»).',
       'Consuming this item causes Poison.'):
      wt('Вызывает отравление («Яд»).','Causes Poison.')}));
    const poisonHit=wikiData.skills?.['430052001'];
    if(poisonHit?.learnable&&
     poisonHit.funcs?.some(effect=>effect.ep==='EP_CAUSE_POISON')){
     const related=h('div',{class:'wiki-effect-usage'});
     related.append(h('small',{text:wt('Похожее умение:','Related skill:')}),
      wikiLink(dataName('skill','430052001'),'skill','430052001'));
     detail.append(related);
    }
    const antidotes=Object.entries(wikiData.items||{}).filter(([,item])=>
     item?.effects?.some(effect=>effect.func==='EP_RECOVERY_POISON'&&
      effect.dir==='TARGET')).slice(0,8);
    if(antidotes.length){
     const clean=h('div',{class:'wiki-effect-usage'});
     clean.append(h('small',{text:wt('Средство против яда:','Poison remedy:')}));
     for(const [cureId]of antidotes)
      clean.append(wikiLink(dataName('item',cureId),'item',cureId));
     detail.append(clean);
    }
   }
   if(kinds.includes('review')){
    detail.append(h('p',{class:'wiki-description wiki-effect-review-note',
     text:wt('Действие предмета пока не описано.',
      'The effect of this item is not yet described.')}));
   }
   const relations=window.PandoraWikiData.itemSkillRelations(id,wikiData.skills);
   if(relations.length){
    const usage=h('div',{class:'wiki-effect-usage'});
    for(const relation of relations){
     const created=relation.produces.includes(Number(id));
     const line=h('div',{class:'wiki-effect-usage-row'});
     line.append(h('small',{text:created?wt('Создаётся умением:','Crafted with:'):
      wt('Расходуется умением:','Consumed by skill:')}),
      wikiLink(dataName('skill',relation.id),'skill',relation.id));
     if(created&&relation.consumes.length){
      line.append(h('small',{text:wt('Материалы:','Ingredients:')}));
      for(const itemId of relation.consumes)
       if(wikiData.items?.[String(itemId)]){
        line.append(wikiLink(dataName('item',String(itemId)),'item',String(itemId)));
        const qty=relation.consumedQuantities?.[itemId];
        if(Number.isSafeInteger(qty)&&qty>0)line.append(h('small',{
         class:'wiki-effect-quantity',text:'×'+qty}));
       }
     }
     if(!created&&relation.produces.length){
      line.append(h('small',{text:wt('Результат:','Produces:')}));
      for(const itemId of relation.produces)
       if(wikiData.items?.[String(itemId)]){
        line.append(wikiLink(dataName('item',String(itemId)),'item',String(itemId)));
        const qty=relation.producedQuantities?.[itemId];
        if(Number.isSafeInteger(qty)&&qty>0)line.append(h('small',{
         class:'wiki-effect-quantity',text:'×'+qty}));
       }
     }
     if(!created&&relation.consumes.length>1){
      line.append(h('small',{text:wt('Другие материалы:','Other ingredients:')}));
      for(const itemId of relation.consumes)
       if(itemId!==Number(id)&&wikiData.items?.[String(itemId)]){
        line.append(wikiLink(dataName('item',String(itemId)),'item',String(itemId)));
        const qty=relation.consumedQuantities?.[itemId];
        if(Number.isSafeInteger(qty)&&qty>0)line.append(h('small',{
         class:'wiki-effect-quantity',text:'×'+qty}));
       }
     }
     usage.append(line);
    }
    detail.append(usage);
   }
  }
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
     text:'×','aria-label':wt('Убрать класс ','Remove class ')+name,
     onclick:()=>void saveClasses(Object.fromEntries(keys.filter(x=>x!==key).map(x=>[x,1])))
     .catch(error=>showStudioToast(error.message,'warning'))}));
    tags.append(chip);
   }
   if(manage&&keys.length<jobKeys.length){
    const plus=h('button',{type:'button',class:'wiki-owner-plus',text:'+',
     'aria-label':wt('Добавить доступный класс','Add eligible class')});
    plus.onclick=()=>{
     const select=h('select',{class:'wiki-inline-select','aria-label':wt('Выбери класс','Choose class')});
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
    if(adminEditing&&adminToken&&lang==='ru'){
     const sourceNote=String(rec.sourceNote||'');
     const note=h('p',{class:sourceNote?'':'wiki-description-placeholder',
      text:sourceNote||wt('Двойной клик — добавить комментарий','Double-click to add a note'),
      ...(adminEditing&&adminToken&&lang==='ru'?{
       'data-owner-record':'item:'+id,'data-owner-field':'sourceNote',
       ...(!sourceNote?{'data-owner-empty':'true'}:{})}:{})});
     detail.append(h('section',{class:'wiki-owner-note'},[
      h('strong',{text:wt('Комментарий об источнике','Source note')}),note]));
    }
    const dl=h('dl',{class:'item-fields'});
    const itemFields=[
     [wt('Тип','Type'),window.PandoraItemPresentation.kind(rec,lang),'kind'],
     [wt('Уровень','Level'),rec.level,'level'],
     [wt('Атака','Attack'),rec.W,'W'],
     [wt('Пробитие','Penetration'),rec.PEN,'PEN'],
     [wt('Защита','Defense'),rec.AC,'AC'],
     [wt('Скорость атаки','Attack speed'),rec.atkspeed,'atkspeed'],
     [wt('Дальность','Range'),rec.range,'range'],
     // Cloaks, earrings, rings and amulets do not possess Soul sockets.
     // Reuse the exact same eligibility rule as equipment selection/tooltips.
     ...(window.PandoraEquipmentPlan.supportsSoulSlot(rec.slot)?
      [[wt('Слоты душ','Soul slots'),rec.soulslot,'soulslot']]:[])
    ];
    for(const [label,value,key]of itemFields)if(value!=null){
     const presentation=window.PandoraItemPresentation;
     let fieldName=presentation.fieldLabel(key,lang,override)||label;
     let hint=presentation.fieldHint(key,lang,override)||fieldName;
     const caption=h('span',{text:fieldName,title:hint,class:'wiki-help-word'});
     const dt=h('dt',{class:'wiki-help-label','data-item-field':key},[caption]);
     if(adminEditing&&adminToken&&presentation.fieldHintKey(key)){
      const recordKey='book.'+presentation.fieldHintKey(key);
      const editLabel=event=>{
       event.preventDefault();event.stopPropagation();
       if(dl.querySelector('.wiki-item-field-inline-editor'))return;
       // Put the input in its own row across both dl columns. The numeric
       // value stays aligned with the label while the owner types.
       const editorHost=h('div',{class:'wiki-item-field-inline-editor wiki-label-inline-edit',
        'data-editor-field':key,text:fieldName});
       const buttons=[...dt.querySelectorAll('.wiki-label-pencil,.wiki-hint-pencil')];
       dd.after(editorHost);for(const button of buttons)button.hidden=true;
       editWikiValue(editorHost,fieldName,{
        type:'text',
        onCommit:async next=>{
         if(next.length>90)throw Error(wt('Название слишком длинное','Label is too long'));
         await saveGuidePatch(recordKey,{[lang==='en'?'en':'ru']:next});
        },
        onCommitted:next=>{
         fieldName=next;caption.textContent=next;
         const pencil=dt.querySelector('.wiki-label-pencil');
         if(pencil)pencil.setAttribute('aria-label',
          wt('Переименовать: ','Rename: ')+next);
        },
        onFinished:()=>{editorHost.remove();for(const button of buttons)button.hidden=false}
       });
      };
      const editHint=event=>{
       event.preventDefault();event.stopPropagation();
       if(dl.querySelector('.wiki-item-field-inline-editor'))return;
       const editorHost=h('div',{class:'wiki-item-field-inline-editor wiki-hint-inline-edit',
        'data-editor-field':key,text:hint});
       const buttons=[...dt.querySelectorAll('.wiki-label-pencil,.wiki-hint-pencil')];
       dd.after(editorHost);for(const button of buttons)button.hidden=true;
       editWikiValue(editorHost,hint,{
        type:'text',
        onCommit:async next=>{
         if(next.length>220)throw Error(wt('Подсказка слишком длинная','Hint is too long'));
         const field=lang==='en'?'hintEn':'hintRu';
         await saveGuidePatch(recordKey,{[field]:next});
        },
        onCommitted:next=>{hint=next;caption.title=next},
        onFinished:()=>{editorHost.remove();for(const button of buttons)button.hidden=false}
       });
      };
      caption.classList.add('wiki-label-editable');
      caption.tabIndex=0;
      caption.setAttribute('aria-keyshortcuts','F2');
      caption.addEventListener('dblclick',editLabel);
      caption.addEventListener('keydown',event=>{
       if(event.key==='F2'){editLabel(event)}
      });
      dt.append(h('button',{type:'button',class:'wiki-label-pencil',
       text:'✎',title:wt('Переименовать поле','Rename field label'),
       'aria-label':wt('Переименовать: ','Rename: ')+fieldName,
       onclick:editLabel}));
      dt.append(h('button',{type:'button',class:'wiki-hint-pencil',
       text:'?',title:wt('Изменить подсказку','Edit hint'),
       'aria-label':wt('Изменить подсказку: ','Edit hint: ')+fieldName,
       onclick:editHint}));
     }
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
    if(adminEditing&&adminToken){
     const missing=itemFields.filter(([,value,key])=>value==null&&key!=='kind');
     if(missing.length){
      const add=h('button',{type:'button',class:'wiki-owner-plus wiki-item-add-field',
       text:wt('+ Параметр предмета','+ Item field')});
      add.onclick=()=>{
       const select=h('select',{class:'wiki-inline-select',
        'aria-label':wt('Добавить параметр предмета','Add item field')});
       select.append(h('option',{value:'',text:wt('Выбери параметр','Select field')}));
       for(const [label,,key] of missing)
        select.append(h('option',{value:key,text:label}));
       add.replaceWith(select);
       select.onchange=()=>{if(select.value)void saveWikiItemField(id,
        select.value,0).catch(e=>showStudioToast(e.message,'warning'))};
       select.onblur=()=>{if(select.isConnected)select.replaceWith(add)};
       select.focus();
      };
      detail.append(add);
     }
    }
    if((rec.effects?.length||0)>0||(adminEditing&&adminToken)){
     const effectRows=rec.effects||[];
     const itemEditor=window.PandoraStudioItemOwnerEditor;
     const effectOptions=adminEditing&&adminToken?
      itemEditor.effectOptions(wikiData.items,rec,lang):[];
     const labelFor=code=>itemEditor.effectDisplayLabel(code,lang);
     const update=(index,patch)=>saveWikiItemField(id,'effects',
      effectRows.map((effect,i)=>i===index?{...effect,...patch}:effect));
     const list=h('div',{class:'wiki-owner-effects'});
     list.append(h('h4',{text:rec.slot==null?
      wt('Действие предмета','Item effects'):
      wt('Бонусы предмета','Item bonuses')}));
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
        if(key==='a'&&!(adminEditing&&adminToken)&&
         !itemEditor.effectHasDisplayAmount(effect.func))continue;
        const initial=effect[key];
        if(key==='b'&&!adminEditing)continue;
        if(initial==null&&!adminEditing)continue;
        const value=h('span',{class:'wiki-owner-effect-value'});
        if(adminEditing&&adminToken&&(key==='b'||
         (key==='a'&&effect.func==='EP_DESTINED_POISON')))
         value.append(h('small',{text:key==='a'?
          wt('Неизвестный параметр','Unknown effect parameter'):label}));
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
      if(!(adminEditing&&adminToken)&&rec.slot!=null&&
       itemEditor.effectUsesSkillId(effect.func)&&
       wikiData.skills?.[String(effect.a)]){
       const procSkillId=String(effect.a);
       row.append(h('span',{class:'wiki-owner-effect-value wiki-effect-linked-skill'},[
        wikiLink(dataName('skill',procSkillId),'skill',procSkillId)]));
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
      const plus=h('button',{type:'button',class:'wiki-owner-plus',text:wt('+ Добавить эффект','+ Add effect')});
      plus.onclick=()=>{
       if(list.querySelector('.wiki-owner-effect-picker'))return;
       const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-effect-picker'});
       const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
        'aria-label':wt('Поиск эффекта','Search effects'),placeholder:'Найти игровой эффект…'});
       
       const chooser=h('select',{class:'wiki-inline-select','aria-label':wt('Выбери эффект','Choose effect')});
       const error=h('small',{class:'inline-owner-error',role:'status'});
       const fill=()=>{
        const q=wikiIndex.normalize(search.value);
        const matches=effectOptions.filter(row=>!q||
         searchWords(row.label+' '+row.value,q));
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
       registerOutsidePicker(panel,plus);
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
     wt('Источники получения не указаны.','No acquisition sources listed.')}));
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
      text:wt('+ Обмен NPC с этим материалом','+ NPC trade using this item')});
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
     // Reciprocal workflow: create a real NPC recipe from the reward item,
     // rather than a reference-only acquisition link.
     const rewardTrade=h('button',{type:'button',
      class:'wiki-owner-plus wiki-add-source wiki-owner-reward-trade-button',
      text:wt('+ Получить через обмен NPC','+ Obtain via NPC trade')});
     rewardTrade.onclick=()=>{
      if(detail.querySelector('.wiki-owner-reward-trade'))return;
      const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-reward-trade'});
      const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
       placeholder:wt('Найти NPC…','Find an NPC…'),autocomplete:'off',
       'aria-label':wt('Поиск NPC для обмена','Find NPC for trade')});
      const npc=h('select',{class:'wiki-inline-select',
       'aria-label':wt('Выбери NPC','Choose NPC')});
      const feedback=h('small',{class:'inline-owner-error',role:'status'});
      const filter=()=>{
       const q=wikiIndex.normalize(search.value);
       const matches=Object.entries(wikiData.trades?.npcs||{})
        .filter(([npcId])=>!q||searchWords(searchTerms('npc',npcId),q))
        .slice(0,90);
       npc.replaceChildren(h('option',{value:'',text:matches.length?
        wt('Выбери NPC','Choose NPC'):wt('NPC не найден','NPC not found')}));
       for(const [npcId] of matches)npc.append(h('option',{value:npcId,
        text:dataName('npc',npcId)}));
       npc.disabled=!matches.length;
      };
      panel.append(h('small',{text:wt(
       'Выбери NPC, затем предмет, необходимый для обмена.',
       'Choose an NPC, then an item required for the trade.')}),
       search,npc,feedback,
       h('button',{type:'button',class:'wiki-owner-cancel',
        text:wt('Отмена','Cancel'),onclick:()=>panel.remove()}));
      rewardTrade.after(panel);search.oninput=filter;
      npc.onchange=()=>{
       if(!npc.value)return;
       const npcId=Number(npc.value);
       wikiItemChoice(panel,async materialId=>{
        if(!wikiData.items?.[materialId]||!wikiData.trades?.npcs?.[npcId])
         throw Error(wt('Предмет или NPC не найден','Item or NPC not found'));
        // Never create the same free one-material recipe twice.
        const duplicate=(wikiData.trades.trades||[]).some(trade=>
         String(trade.i)===String(id)&&
         (trade.npc||[]).some(n=>String(n)===String(npcId))&&
         (trade.mats||[]).length===1&&
         String(trade.mats[0].i)===String(materialId)&&
         Number(trade.mats[0].n)===1&&
         Number(trade.gold||0)===0&&Number(trade.honor||0)===0&&
         Number(trade.exp||0)===0);
        if(duplicate)throw Error(wt(
         'Такой обмен уже указан.','This trade is already listed.'));
        let unique=null;
        for(let n=0;n<30;n++){
         const candidate=900000000+crypto.getRandomValues(new Uint32Array(1))[0];
         if(!(wikiData.trades.trades||[]).some(row=>row.id===candidate)&&
          !Object.hasOwn(override,'tradeedit.'+candidate)){
          unique=candidate;break;
         }
        }
        if(unique===null)throw Error(wt('Не удалось создать обмен','Could not create trade'));
        await saveWikiTradeRecipe({id:unique,i:Number(id),npc:[npcId],
         mats:[{i:materialId,n:1}],gold:0,honor:0,exp:0});
       });
      };
      registerOutsidePicker(panel,rewardTrade);
      filter();search.focus();
     };
     detail.append(rewardTrade);
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
    const racialOwner=wikiRaceOwner(id);
    if(racialOwner)dl.append(h('dt',{text:wt('Раса','Race')}),
     h('dd',{text:racialOwner.name}));
    for(const [label,value,key] of skillFields)if(value!=null)
     dl.append(h('dt',{text:label}),wikiOwnerNumeric(h('dd',{text:String(value)}),
      value,'skill',id,key,{integer:key==='charLevel'}));
    detail.append(dl);
    if(adminEditing&&adminToken){
     const missing=skillFields.filter(([,value])=>value==null);
     if(missing.length){
      const add=h('button',{type:'button',class:'wiki-owner-plus wiki-skill-add-field',
       text:wt('+ Параметр навыка','+ Skill field')});
      add.onclick=()=>{
       const select=h('select',{class:'wiki-inline-select',
        'aria-label':wt('Добавить параметр навыка','Add skill field')});
       select.append(h('option',{value:'',text:wt('Выбери параметр','Select field')}));
       for(const [label,,key] of missing)
        select.append(h('option',{value:key,text:label}));
       add.replaceWith(select);
       select.onchange=()=>{if(select.value)void saveWikiRecordField('skill',id,
        select.value,0).catch(e=>showStudioToast(e.message,'warning'))};
       select.onblur=()=>{if(select.isConnected)select.replaceWith(add)};
       select.focus();
      };
      detail.append(add);
     }
    }
    detail.append(h('h4',{text:wt('Требования','Requirements')}));
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
       'aria-label':wt('Удалить требование ','Remove requirement ')+branchLabel(req.branch),
       onclick:()=>void saveWikiRecordField('skill',id,'reqs',
        rec.reqs.filter((_,i)=>i!==index)).catch(e=>showStudioToast(e.message,'warning'))}));
     }
     reqs.append(chip);
    }
    if(adminEditing&&adminToken&&(rec.reqs||[]).length<20){
     const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-source',
      text:wt('+ Требование ветки','+ Branch requirement'),onclick:()=>{
       if(reqs.querySelector('.wiki-inline-select'))return;
       const select=h('select',{class:'wiki-inline-select','aria-label':wt('Выбери ветку','Choose branch')});
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
     const prereq=String(rec.prereq);
     const link=wikiLink(dataName('skill',prereq),'skill',prereq);
     prereqPane.append(withIcon(link,wikiIcon('skill',prereq,wikiData.skills[prereq]),'skill'));
    }
    if(adminEditing&&adminToken){
     const add=h('button',{type:'button',class:'wiki-owner-plus',
      text:rec.prereq==null?wt('+ Выбрать умение','+ Choose skill'):wt('✎ Изменить','✎ Edit'),
      onclick:()=>{
       const prior=prereqPane.querySelector('.wiki-owner-source-picker');
       if(prior){prior.remove();return}
       const panel=h('div',{class:'wiki-owner-source-picker'});
       const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
        placeholder:wt('Поиск предыдущего умения…','Search prerequisite skill…'),'aria-label':wt('Найти умение','Find skill')});
       
       const select=h('select',{class:'wiki-inline-select','aria-label':wt('Выбери предыдущее умение','Choose prerequisite skill')});
       const fill=()=>{
        const q=wikiIndex.normalize(search.value);
        const matches=Object.entries(wikiData.skills||{}).filter(([skillId])=>
         String(skillId)!==String(id)&&(!q||
          searchWords(searchTerms('skill',skillId),q))).slice(0,90);
        select.replaceChildren(h('option',{value:'',text:wt('Выбери умение','Choose skill')}));
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
    if(icon){
     const image=wikiImage(icon,'wiki-record-icon',type);
     const back=detail.querySelector('.wiki-return-button');
     if(back)back.after(image);else detail.prepend(image);
    }
  }else if(type==='soul'){
    const slotLabel=slot=>window.PandoraItemPresentation.slotLabel(slot,lang);
    const traits=h('section',{class:'wiki-soul-properties','aria-label':wt('Свойства души','Soul properties')});
    const slotPane=h('div',{class:'wiki-soul-properties-half'});
    slotPane.append(h('h4',{text:wt('Куда вставляется','Compatible equipment')}));
    const slots=h('div',{class:'wiki-soul-slot-list'});
    for(const slot of rec.slots||[]){
     const chip=h('span',{class:'wiki-owner-mat',text:slotLabel(slot)});
     if(adminEditing&&adminToken)chip.append(h('button',{type:'button',
      class:'wiki-owner-remove',text:'×','aria-label':wt('Убрать слот ','Remove slot ')+slotLabel(slot),
      onclick:()=>void saveWikiRecordField('soul',id,'slots',rec.slots.filter(x=>x!==slot))
       .catch(error=>showStudioToast(error.message,'warning'))}));
     slots.append(chip);
    }
    if(adminEditing&&adminToken){
     const add=h('button',{type:'button',class:'wiki-owner-plus',text:wt('+ Слот','+ Slot')});
     add.onclick=()=>{
      const choices=['weapon','shield','head','body','gloves','legs','feet',
       'cloak','ring','neck','belt','ear','accessory'].filter(x=>!(rec.slots||[]).includes(x));
      const select=h('select',{class:'wiki-inline-select','aria-label':wt('Выбери слот','Choose slot')});
      select.append(h('option',{value:'',text:wt('Выбери слот','Choose slot')}));
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
    else if(adminEditing&&adminToken){
     const missing=h('span',{class:'wiki-edit-value',
      text:wt('Добавить стоимость','Add price'),
      title:wt('Двойной клик — добавить стоимость души',
       'Double-click to add Soul price')});
     missing.addEventListener('dblclick',e=>{e.preventDefault();
      editWikiValue(missing,0,{type:'number',integer:true,min:0,max:1000000000,
       onCommit:value=>saveWikiRecordField('soul',id,'price',value)})});
     pricePane.append(missing);
    }else pricePane.append(h('span',{class:'muted',text:wt('Не указана','Not provided')}));
    traits.append(pricePane);
    detail.append(traits);
    detail.append(h('h4',{text:wt('Где получить душу','How to obtain this Soul')}));
    const found=wikiIndex.sources(id);
    if(!found.length)detail.append(h('p',{class:'muted',text:
     wt('Где получить эту душу, пока неизвестно.','Where to obtain this Soul is not yet known.')}));
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
    if(adminEditing&&adminToken){
     const absent=monsterStats.filter(([,value])=>!Number.isFinite(value));
     if(absent.length){
      const add=h('button',{type:'button',class:'wiki-owner-plus',
       text:wt('+ Характеристика','+ Add stat')});
      add.onclick=()=>{
       const select=h('select',{class:'wiki-inline-select',
        'aria-label':wt('Добавить характеристику монстра','Add monster stat')});
       select.append(h('option',{value:'',text:wt('Выбери характеристику','Choose a stat')}));
       for(const [label,,key]of absent)select.append(h('option',{value:key,text:label}));
       add.replaceWith(select);
       select.onchange=()=>{if(select.value)void saveWikiRecordField('monster',id,select.value,0)
        .catch(error=>showStudioToast(error.message,'warning'))};
       select.onblur=()=>{if(select.isConnected)select.replaceWith(add)};
       select.focus();
      };
      detail.append(add);
     }
    }
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
    if(adminEditing&&adminToken){
     const resistKeys=[
      ['physical',wt('Физическое','Physical')],['fire',wt('Огонь','Fire')],
      ['cold',wt('Лёд','Ice')],['lightning',wt('Молния','Lightning')],
      ['poison',wt('Яд','Poison')],['charm',wt('Чары','Charm')],
      ['magic',wt('Магия','Magic')],['holy',wt('Свет','Holy')],
      ['dark',wt('Тьма','Dark')]];
     const missing=resistKeys.filter(([key])=>!Object.hasOwn(rec.resists||{},key));
     if(missing.length){
      const add=h('button',{type:'button',class:'wiki-owner-plus wiki-add-resistance',
       text:wt('+ Сопротивление','+ Resistance')});
      add.onclick=()=>{
       const select=h('select',{class:'wiki-inline-select',
        'aria-label':wt('Добавить сопротивление','Add resistance')});
       select.append(h('option',{value:'',text:wt('Выбери тип','Choose type')}));
       for(const [key,label] of missing)select.append(h('option',{value:key,text:label}));
       add.replaceWith(select);
       select.onchange=()=>{if(select.value)void saveWikiRecordField('monster',id,
        'resists.'+select.value,0).catch(e=>showStudioToast(e.message,'warning'))};
       select.onblur=()=>{if(select.isConnected)select.replaceWith(add)};
       select.focus();
      };
      detail.append(add);
     }
    }
    detail.append(h('h4',{text:wt('Места появления','Spawn locations')}));
    const places=wikiIndex.locations(id);
    if(adminEditing&&adminToken){
     for(const kind of ['map','instance']){
      const chosen=places.filter(x=>x.type===kind).map(x=>String(x.id));
      detail.append(wikiOwnerEntityList({label:kind==='map'?
       wt('Локации','Locations'):wt('Подземелья','Dungeons'),
       kind,existing:chosen,
       // Source monsters on canonical game maps can replace one relation with
       // a single spawnedit write. Virtual/custom maps still use add/remove.
       replaceable:!rec.ownerCreated&&chosen.every(placeId=>
        kind==='map'?Object.hasOwn(wikiData.maps||{},placeId):
        (wikiData.instances||[]).some(x=>String(x.id)===placeId)),
       replaceCandidate:placeId=>kind!=='map'||
        Object.hasOwn(wikiData.maps||{},placeId),
       onChange:async next=>{
        const updated=next.map(String);
        const added=updated.find(x=>!chosen.includes(x));
        const removed=chosen.find(x=>!updated.includes(x));
        const locationId=added||removed;
        if(!locationId)return;
        const loc=wikiIndex.records(kind)?.[locationId];
        if(!loc)throw Error(wt('Локация не найдена','Location not found'));
        const ownerLocation=kind==='map'&&(
         !Object.hasOwn(wikiData.maps||{},locationId)||loc.virtual);
        if(added&&removed){
         if(rec.ownerCreated||ownerLocation)
          throw Error(wt('Эту связь можно изменить по одной',
           'Change this link one at a time'));
         await saveWikiSpawns(id,kind,added,true,removed);
         return;
        }
        if(rec.ownerCreated||ownerLocation){
         const current=(loc.mobs||[]).map(String);
         const desired=added?[...new Set([...current,String(id)])]:
          current.filter(x=>x!==String(id));
         // A reported spawn row linked to this card must be unlinked as well.
         const reports=kind==='map'?mapRoster(loc):[];
         const patch={mobs:desired.map(x=>/^[1-9][0-9]{0,14}$/.test(x)?Number(x):x)};
         if(reports.length&&removed)patch.roster=reports.map(row=>
          String(row.monsterId)===String(id)?{...row,monsterId:null}:row);
         await saveWikiRecordPatch(kind,locationId,patch);
        }else if(added)await saveWikiSpawns(id,kind,added,true);
        else await saveWikiSpawns(id,kind,removed,false);
       }}));
     }
    }else if(places.length)detail.append(linkFlow(places.map(loc=>
     wikiLink('◈ '+dataName(loc.type,loc.id),loc.type,loc.id,id))));
    else detail.append(h('p',{class:'wiki-empty-value',text:'—'}));
    if(rec.ownerCreated){
     const entries=(rec.loot||[]).filter(x=>wikiData.items?.[String(x)]);
     detail.append(h('h4',{text:wt('Выпадающие предметы','Dropped items')+
      (entries.length?' · '+entries.length:'')}));
     if(adminEditing&&adminToken)
      detail.append(wikiOwnerEntityList({kind:'item',existing:entries,limit:120,
       onChange:next=>saveWikiRecordField('monster',id,'loot',next.map(Number))}));
     else if(entries.length)detail.append(linkFlow(entries.map(itemId=>
      itemLink(itemId,dataName('item',itemId),id))));
     else detail.append(h('p',{class:'wiki-empty-value',text:'—'}));
     detail.append(h('small',{class:'wiki-source-meta',text:wt(
      'Связи с добычей добавлены редактором; шанс выпадения не указан.',
      'Loot is curated by the owner; drop rates are not specified.')}));
    }else{
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
       text:wt('Слоты +','Slots +')+row.slotAdd}));
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
    }
   }else if(type==='npc'){
    const locations=rec.maps||[];
    {
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
     if(rec.virtual&&adminEditing&&adminToken){
      const geo=window.PandoraAstirLocations;
      const selector=h('select',{class:'wiki-inline-select wiki-town-npc-location',
       'aria-label':wt('Расположение NPC','NPC location')});
      const locationsList=rec.ownerCreated?
       Object.keys(wikiIndex.records('map')||{}).filter(x=>
        window.PandoraWikiOwnerData.virtualMapId(x)):
       geo.districtIds;
      for(const mapId of locationsList){
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
       text:wt('+ Материал','+ Material'),onclick:()=>wikiItemChoice(mats,i=>{
        if((trade.mats||[]).length>=20)
         throw Error(wt('Можно добавить не более 20 материалов','Maximum 20 materials'));
        if((trade.mats||[]).some(row=>String(row.i)===String(i)))
         throw Error(wt('Этот материал уже есть в обмене','Material already listed'));
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
      const plus=h('button',{type:'button',class:'wiki-owner-plus',
       text:wt('+ NPC','+ NPC')});
      plus.onclick=()=>{
       const previous=owner.querySelector('.wiki-owner-trade-npc-picker');
       if(previous){previous.remove();return}
       const panel=h('div',{class:'wiki-owner-source-picker wiki-owner-trade-npc-picker'});
       const search=ownerPlainTextField({class:'wiki-inline-input wiki-owner-search',
        placeholder:wt('Найти NPC по имени…','Find NPC by name…'),
        autocomplete:'off','aria-label':wt('Поиск NPC для обмена','Search NPC for trade')});
       const pick=h('select',{class:'wiki-inline-select',
        'aria-label':wt('Добавить NPC','Add NPC')});
       const feedback=h('small',{class:'inline-owner-error',role:'status'});
       const fill=()=>{
        const q=wikiIndex.normalize(search.value);
        const candidates=Object.entries(wikiData.trades?.npcs||{})
         .filter(([key])=>!(trade.npc||[]).map(String).includes(key)&&
          (!q||searchWords(searchTerms('npc',key),q))).slice(0,80);
        pick.replaceChildren(h('option',{value:'',
         text:candidates.length?wt('Выбери NPC','Choose NPC'):
          wt('NPC не найден','No NPC found')}));
        for(const [key] of candidates)pick.append(h('option',
         {value:key,text:dataName('npc',key)}));
        pick.disabled=!candidates.length;
       };
       pick.onchange=async()=>{
        if(!pick.value)return;
        if((trade.npc||[]).some(id=>String(id)===pick.value)||
         !wikiData.trades?.npcs?.[pick.value]){
         feedback.textContent=wt('NPC уже указан или отсутствует','NPC already present or missing');
         return;
        }
        pick.disabled=true;
        try{await amend({npc:[...trade.npc,Number(pick.value)]})}
        catch(e){feedback.textContent=e.message;pick.disabled=false}
       };
       panel.append(search,pick,feedback,h('button',{type:'button',
        class:'wiki-owner-cancel',text:wt('Отмена','Cancel'),
        onclick:()=>panel.remove()}));
       plus.after(panel);search.oninput=fill;registerOutsidePicker(panel,plus);
       fill();search.focus();
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
    if(description||(type==='instance'&&adminEditing&&adminToken)){
     const editable=type==='instance'&&adminEditing&&adminToken;
     detail.append(h('p',{
      class:'wiki-description'+(!description?' wiki-description-placeholder':''),
      text:description||'Двойной клик — добавить описание',
      ...(editable?{'data-owner-record':'instance:'+id,
       'data-owner-field':lang==='en'?'blurb':'blurbRu',
       ...(!description?{'data-owner-empty':'true'}:{})}:{})
     }));
    }
    const mobs=rec.mobs||[];
     if(type==='map'&&adminEditing&&adminToken&&!rec.virtual&&
      !Object.hasOwn(wikiData.maps||{},id))
      detail.append(h('p',{class:'wiki-owner-map-note',text:
       wt('Здесь пока нельзя добавить монстров.','Monster editing is not available for this location.')}));
     if(showMapSection('monsters')&&adminEditing&&adminToken&&(type==='instance'||ownerMap)){
      detail.append(wikiOwnerEntityList({label:'Монстры в '+(type==='instance'?'подземелье':'локации'),
      kind:'monster',existing:mobs,replaceable:false,onChange:async next=>{
       const before=mobs.map(String),after=next.map(String);
       const hasOwner=next.some(x=>window.PandoraWikiOwnerData.ownerMonsterId(x))||
        before.some(x=>window.PandoraWikiOwnerData.ownerMonsterId(x));
       if(type==='map'&&(rec.virtual||!Object.hasOwn(wikiData.maps||{},id)||hasOwner)){
        const patch={mobs:next.map(x=>typeof x==='string'?x:Number(x))};
        const reports=mapRoster(rec);
        if(reports.length)patch.roster=reports.map(row=>row.monsterId!=null&&
         !after.includes(String(row.monsterId))?{...row,monsterId:null}:row);
        await saveWikiRecordPatch('map',id,patch);return;
       }
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
        onChange:next=>saveWikiRecordField('map',id,'npcs',
         next.map(x=>/^\d+$/.test(String(x))?Number(x):String(x)))}));
      }else if(adminEditing&&adminToken&&!rec.virtual){
       detail.append(wikiOwnerEntityList({label:wt('NPC в локации','NPCs in this location'),
        kind:'npc',existing:residents.map(([npcId])=>String(npcId)),replaceable:false,onChange:async next=>{
         const before=residents.map(([npcId])=>String(npcId)),after=next.map(String);
         const added=after.find(n=>!before.includes(n));
         const removed=before.find(n=>!after.includes(n));
         const npcId=added||removed;
         if(!npcId)return;
         const current=wikiData.trades?.npcs?.[npcId];
         if(!current)throw Error(wt('NPC не найден в каталоге','NPC not found in catalog'));
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
      }
      // Existing curated and newly created NPCs are visible without inventing
      // trade-NPC identities or forcing them into the source game data.
      if(ownerMap&&rec.virtual&&rec.placeType!=='astir-district'){
       const unmanaged=residents.filter(([npcId])=>
        !(rec.npcs||[]).map(String).includes(String(npcId)));
       if(unmanaged.length){
        const linked=h('section',{class:'wiki-owner-location-residents'});
        linked.append(h('small',{text:wt('NPC, привязанные через их карточки',
         'NPCs linked from their own cards')}));
        linked.append(linkFlow(unmanaged.map(([npcId])=>
         wikiLink('♙ '+dataName('npc',npcId),'npc',npcId))));
        detail.append(linked);
       }
       const create=h('button',{type:'button',class:'wiki-owner-plus wiki-map-create-npc',
        text:wt('+ Создать NPC в локации','+ Create NPC in location')});
       create.onclick=()=>{
        if(detail.querySelector('.wiki-map-create-npc-form'))return;
        const form=h('div',{class:'wiki-owner-source-picker wiki-map-create-npc-form'});
        const ru=ownerPlainTextField({class:'wiki-inline-input',
         placeholder:wt('Название NPC · RU','NPC name · RU'),
         'aria-label':wt('Название нового NPC RU','New NPC name RU')});
        const en=ownerPlainTextField({class:'wiki-inline-input',
         placeholder:wt('Название NPC · EN','NPC name · EN'),
         'aria-label':wt('Название нового NPC EN','New NPC name EN')});
        const role=ownerPlainTextField({class:'wiki-inline-input',
         placeholder:wt('Назначение (необязательно)','Service (optional)'),
         'aria-label':wt('Назначение нового NPC','New NPC service')});
        const err=h('small',{class:'inline-owner-error',role:'status'});
        const submit=h('button',{type:'button',class:'wiki-owner-plus',
         text:wt('Сохранить NPC','Save NPC')});
        submit.onclick=async()=>{
         const name=ru.value.trim(),nameEn=en.value.trim(),service=role.value.trim();
         if(!name||!nameEn||name.length>240||nameEn.length>240||service.length>240){
          err.textContent=wt('Укажи оба названия (RU/EN) до 240 символов',
           'Provide both RU and EN names up to 240 characters');return;
         }
         const npcId='owner-npc-'+[...crypto.getRandomValues(new Uint8Array(8))]
          .map(x=>x.toString(16).padStart(2,'0')).join('');
         if(wikiIndex.records('npc')?.[npcId]){
          err.textContent=wt('Не удалось создать NPC. Повтори попытку.','Could not create NPC. Try again.');return}
         submit.disabled=true;
         try{
          await saveWikiRecordPatch('npc',npcId,{name,nameEn,service,maps:[String(id)]});
          openWiki('map',id);
         }catch(e){err.textContent=String(e.message||e);submit.disabled=false}
        };
        const cancel=h('button',{type:'button',class:'wiki-owner-remove',
         text:wt('Отмена','Cancel'),onclick:()=>form.remove()});
        form.append(ru,en,role,submit,cancel,err);create.after(form);ru.focus();
       };
       detail.append(create);
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
        const ru=field(wt('Имя NPC · RU','NPC name · RU')),
         en=field(wt('Имя NPC · EN','NPC name · EN')),
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
         custom.map((entry,i)=>i===index?{...entry,entries:next.map(x=>
          /^\d+$/.test(String(x))?Number(x):String(x))}:entry))
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
        placeholder:wt('Название раздела · RU','Section title · RU'),
         'aria-label':wt('Название раздела RU','Section title RU')});
       const en=ownerPlainTextField({class:'wiki-inline-input',
        placeholder:wt('Название раздела · EN','Section title · EN'),
         'aria-label':wt('Название раздела EN','Section title EN')});
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
      h('strong',{text:wt('Категория наград: ','Reward category: ')+category}),
      h('p',{text:wt('Сведения о содержимом отсутствуют.',
       'Contents are not listed.')})
     ]));
     else detail.append(h('p',{class:'muted',text:wt(
      'Содержимое сундука не указано.',
      'Chest contents are not listed.'
     )}));
    }
    const chestIds=new Set(Object.keys(wikiIndex.records('chest')||{}));
    const chestView=window.PandoraStudioChestPresentation.analyze(groups,chestIds);
    const gallery=h('div',{class:'wiki-chest-groups wiki-chest-board'});
    const certainBoard=h('section',{class:'wiki-chest-collection wiki-chest-listed-100'});
    certainBoard.append(h('div',{class:'wiki-chest-collection-head'},[
     h('strong',{text:wt('Награды с шансом 100%','Rewards listed at 100%')}),
     h('small',{text:wt('Наград: ','Rewards: ')+chestView.listed100.length})
    ]));
    const certainItems=h('div',{class:'wiki-chest-assured-grid'});
    certainBoard.append(certainItems);
    for(const [i,group]of groups.entries()){
     const listedSingle=group.length===1&&group[0]?.p===100;
     const heading=h('summary',{class:'wiki-chest-group-summary'},[
      ...(adminEditing&&adminToken?[h('span',{class:'wiki-chest-group-mark',
       'aria-hidden':'true',text:String(i+1)})]:[]),
      h('span',{class:'wiki-chest-group-name',
       text:adminEditing&&adminToken?
        (group.length>1?wt('Варианты · группа ','Options · group ')+(i+1):
         wt('Розыгрыш ','Roll ')+(i+1)):
        (group.length>1?wt('Возможные награды','Possible rewards'):
         wt('Награда','Reward'))}),
      h('small',{text:group.length===1?(listedSingle?
       '100%':group[0]?.gold?wt('1 награда','1 reward'):
        wt('1 предмет','1 item')):
       wt('Вариантов: ','Options: ')+group.length}),
      h('span',{class:'wiki-chest-chevron','aria-hidden':'true',text:'⌄'})
     ]);
     const options=h('div',{class:'wiki-chest-options'});
     for(const [rowIndex,row] of group.entries()){
      const nextChest=chestIds.has(String(row.i))&&String(row.i)!==String(id);
      const option=h('div',{class:'wiki-chest-reward'+
       (nextChest?' wiki-chest-reward-nested':'')+
       (wikiSelection.highlight===String(row.i)?' highlighted':''),
       'data-roll-group':String(i+1)});
      const goldReward=Array.isArray(row.gold);
      const rewardMain=h('div',{class:'wiki-chest-reward-main'},[
       row.i!=null?itemLink(row.i,dataName('item',row.i),id):
        h('span',{class:goldReward?'wiki-chest-gold-reward':'wiki-chest-unlisted-reward',
         text:goldReward?
          (window.PandoraStudioChestPresentation.goldLabel(row,lang)||
           wt('Золото · сумма не указана','Gold · amount not listed')):
          wt('Награда не указана','Reward not listed')})
      ]);
      if(nextChest)rewardMain.append(h('small',{class:'wiki-chest-nested-note',
       text:wt('↳ Следующая шкатулка','↳ Next chest')}));
      option.append(rewardMain);
      const rewardMeta=h('div',{class:'wiki-chest-reward-meta'});
      if(adminEditing&&adminToken&&row.i!=null){
       const quantity=h('span',{class:'wiki-reward-quantity wiki-edit-value',
        text:'×'+(row.n??1),
        'aria-label':wt('Количество. Двойной клик — изменить',
         'Quantity. Double-click to edit')});
       window.PandoraGuideTooltip?.attach(quantity,
        wt('Двойной клик — изменить количество','Double-click to edit quantity'),
        {hoverDelay:1000});
       quantity.ondblclick=e=>{e.preventDefault();
        editWikiValue(quantity,row.n??1,{type:'number',min:1,max:999999,integer:true,
         onCommit:n=>changeChest(groups.map((g,gi)=>gi!==i?g:
          g.map((r,ri)=>ri===rowIndex?{...r,n}:r)))});
       };
       rewardMeta.append(quantity);
      }else if(row.n!=null&&row.n!==1)rewardMeta.append(h('span',{class:'wiki-reward-quantity',
       text:'×'+row.n}));
      if(row.plus!=null&&row.plus>0)rewardMeta.append(h('small',{class:'wiki-reward-enhance',
       text:'+'+row.plus}));
      if(row.soul!=null&&row.soul>0)rewardMeta.append(h('small',{class:'wiki-reward-enhance',
       text:wt('Душ: ','Souls: ')+row.soul}));
      if(adminEditing&&adminToken){
       const chance=h('small',{class:'wiki-reward-percent wiki-edit-value',
        text:window.PandoraStudioChestPresentation.chance(row.p,lang),
        'aria-label':wt('Шанс внутри группы. Двойной клик — изменить',
         'Chance within this roll. Double-click to edit')});
       window.PandoraGuideTooltip?.attach(chance,
        wt('Двойной клик — изменить шанс внутри группы',
         'Double-click to edit the chance within this group'),{hoverDelay:1000});
       chance.ondblclick=e=>{e.preventDefault();
        editWikiValue(chance,row.p,{type:'number',min:0,max:100,
         onCommit:n=>changeChest(groups.map((g,gi)=>gi!==i?g:
          g.map((r,ri)=>ri===rowIndex?{...r,p:n}:r)))});
       };
       rewardMeta.append(chance);
       rewardMeta.append(h('button',{type:'button',class:'wiki-owner-remove',
        text:'×','aria-label':wt('Удалить награду из сундука',
         'Remove chest reward'),
        onclick:()=>void changeChest(groups.map((g,gi)=>gi!==i?g:
         g.filter((_,ri)=>ri!==rowIndex)))
         .catch(e=>showStudioToast(e.message,'warning'))}));
      }else rewardMeta.append(h('small',{class:'wiki-reward-percent'+
       (row.p===100?' certain':'')+(row.p==null?' unknown':''),
       'aria-label':wt('Шанс внутри группы: ','Chance within group: ')+
        window.PandoraStudioChestPresentation.chance(row.p,lang),
       text:window.PandoraStudioChestPresentation.chance(row.p,lang)}));
      option.append(rewardMeta);
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
     const section=h('details',{class:'wiki-chest-group'+
      (group.length>1?' wiki-chest-alternatives':'')},[heading,options]);
     section.open=true;
     if(!adminEditing&&!adminToken&&listedSingle)certainItems.append(options.firstElementChild);
     else gallery.append(section);
    }
    if(!adminEditing&&!adminToken&&chestView.listed100.length)gallery.prepend(certainBoard);
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
  if(wikiSearchTimer!==null){
   clearTimeout(wikiSearchTimer);wikiSearchTimer=null;
   draw(false);return;
  }
  const present=[...browse.querySelectorAll('[data-wiki-record]')].some(
   row=>row.getAttribute('data-wiki-record')===wikiSelection.id);
  draw(present);
 };
 // Optional real UI timings in the administrator's OWN browser:
 // no local checkout, Node.js, saved-build changes or D1 writes required.
 if(adminEditing&&adminToken&&['item','monster','soul'].includes(wikiSelection.type)){
  const speed=h('button',{type:'button',class:'wiki-speed-check',
   text:wt('Проверить скорость этого списка','Measure list speed on this device')});
  const measured=h('output',{class:'wiki-speed-result',role:'status'});
  speed.onclick=async()=>{
   if(!root.isConnected||!wikiIndex||!browse.isConnected)return;
   if(wikiSearch.trim()||wikiSelection.id!==null){
    measured.textContent=wt('Сначала открой список без поиска и выбранной карточки.',
      'Open the list without searching or a selected record first.');
    return;
   }
   const oldShown=wikiShown,oldScroll=browse.scrollTop,oldValue=search.value;
   const expand=[],queries=[],scroll=[];
   speed.disabled=true;
   measured.textContent=wt('Измеряю на этом устройстве…','Measuring on this device…');
   const median=values=>{
    if(!values.length)return null;
    const sorted=values.slice().sort((a,b)=>a-b);
    return sorted[Math.floor(sorted.length/2)];
   };
   const measureSearch=term=>new Promise((resolve,reject)=>{
    let complete=false;
    const started=performance.now();
    const finish=error=>{
     if(complete)return;complete=true;clearTimeout(timer);observer.disconnect();
     if(error)reject(error);else resolve(performance.now()-started);
    };
    const observer=new MutationObserver(()=>{
     const count=browse.querySelectorAll('[data-wiki-record]').length;
     if(term?count===0:count>0)finish();
    });
    observer.observe(browse,{subtree:true,childList:true});
    const timer=setTimeout(()=>finish(Error('Search did not finish')),3000);
    search.value=term;search.dispatchEvent(new Event('input',{bubbles:true}));
   });
   try{
    wikiShown=100;draw();
    let count=browse.querySelectorAll('[data-wiki-record]').length;
    for(let i=0;i<5;i++){
     const more=browse.querySelector('.wiki-more');if(!more)break;
     const start=performance.now();more.click();
     expand.push(performance.now()-start);
     count=Math.max(count,browse.querySelectorAll('[data-wiki-record]').length);
    }
    if(browse.scrollHeight>browse.clientHeight){
     const start=performance.now();
     browse.scrollTop=browse.scrollHeight;
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     scroll.push(performance.now()-start);
    }
    for(let i=0;i<2;i++){
     await measureSearch('unlikely-benchmark-result-'+i);
     queries.push(await measureSearch(''));
    }
    const ms=value=>value===null?'—':value.toFixed(1)+' мс';
    measured.textContent=wt('Проверено ','Measured ')+count+
     wt(' записей · развёртывание ',' records · expansion ')+ms(median(expand))+
     wt(' · поиск ',' · search ')+ms(median(queries))+
     wt(' · прокрутка ',' · scroll ')+ms(median(scroll))+
     wt('. Поиск включает задержку ввода 100 мс; это замер браузера на твоём устройстве.',
       '. Search includes a 100 ms input debounce; timed in your own browser.');
   }catch(error){
    measured.textContent=wt('Замер не завершился: ','Benchmark could not finish: ')+error.message;
   }finally{
    if(wikiSearchTimer!==null)clearTimeout(wikiSearchTimer);
    wikiSearchTimer=null;
    search.value=oldValue;wikiSearch=oldValue;wikiShown=oldShown;
    if(root.isConnected&&wikiIndex)draw();
    browse.scrollTop=oldScroll;
    speed.disabled=false;
   }
  };
  controls.append(h('div',{class:'wiki-speed-tools'},[speed,measured]));
 }
 search.addEventListener('input',()=>{
  wikiSearch=search.value;wikiShown=100;
  wikiSelection={...wikiSelection,id:null,highlight:null};
  browse.scrollTop=0;
  if(wikiSearchTimer!==null)clearTimeout(wikiSearchTimer);
  wikiSearchTimer=setTimeout(()=>{
   wikiSearchTimer=null;
   if(root.isConnected&&activeTab==='wiki'&&wikiIndex)draw();
  },100);
 });
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

// Stable author-copy keys are separate from player-authored profile values.
// Only labels and help text are editable; typed names/bios and saved build
// properties never enter the D1 editorial namespace.
function profileCopyLabel(key,ru,en,{as='span',forId=null}={}){
 const label=ownerCopy('profile',key,ru,en);
 const node=h(as,{text:label,class:'ps-profile-copy',
  'data-profile-copy-key':key,'data-profile-copy-ru':ru,
  'data-profile-copy-en':en,...(forId?{for:forId}:{})});
 if(!adminEditing||!adminToken)return node;
 node.classList.add('origin-copy-editable');
 const edit=event=>{
  event.preventDefault();event.stopPropagation();
  if(node.querySelector('.wiki-inline-input'))return;
  // Keep the language of the draft, not the language at asynchronous blur.
  // Only authored profile labels live in D1; user-written fields are untouched.
  const editLang=lang;
  editWikiValue(node,ownerCopy('profile',key,ru,en),{
   type:'text',
   onCommit:next=>saveGuidePatch('book.'+ownerCopyKey('profile',key),{[editLang]:next}),
   // The shared refresh also handles Esc, newer locale, input aria/placeholder,
   // and the pencil; no profile redraw or player field remount is required.
   onFinished:()=>refreshVisibleProfileCopy()
  });
 };
 node.addEventListener('dblclick',edit);
 node.tabIndex=0;
 node.setAttribute('aria-keyshortcuts','F2');
 node.addEventListener('keydown',event=>{if(event.key==='F2')edit(event)});
 const pencil=h('button',{type:'button',class:'ps-profile-copy-pencil',
  'data-profile-copy-pencil':key,text:'✎',
  'aria-label':(lang==='en'?'Rename: ':'Переименовать: ')+label,onclick:edit});
 const host=h('span',{class:'ps-profile-copy-host'},[node,pencil]);
 return host;
}
function profileCopyNote(key,ru,en){
 const note=h('p',{class:'muted'});
 note.append(profileCopyLabel(key,ru,en));return note;
}
function renderProfile(root){
 const tr=(ru,en)=>lang==='en'?en:ru;
 const raceName=races[state.race]?.[lang==='en'?1:0]||races[state.race]?.[0]||'';
 const profile=state.profile&&typeof state.profile==="object"?state.profile:{};
 const view=h("div",{class:"ps-profile-grid"});
 const left=h("section",{class:"ps-profile-art"});
 left.append(h("img",{src:raceSource(state.race,state.gender),alt:tr("Облик расы ","Race appearance: ")+raceName}),
 h("strong",{text:state.name||tr("Без имени","Unnamed hero")}),h("small",{text:(raceName||tr('Раса не выбрана','Race not selected'))+" · "+(jobs[state.job]||tr('Профессия не выбрана','Class not selected'))+" · "+state.level+tr(" ур."," lvl.")}));
 const right=h("section",{class:"ps-profile-info"});
 const fields=[["name","Имя героя","Hero name",state.name||"",64],
 ["guild","Гильдия","Guild",profile.guild||"",80],
 ["nation","Нация","Nation",profile.nation||"",80],
 ["rank","Ранг","Rank",profile.rank||"",80]];
 for(const [key,ru,en,value,max]of fields){
   const label=ownerCopy('profile','field-'+key,ru,en);
   const inputId='ps-profile-field-'+key;
   const row=h('div',{class:'ps-profile-row'});
   const input=h("input",{id:inputId,type:"text",maxLength:String(max),value,
    "aria-label":label,placeholder:label});
   input.addEventListener("input",()=>{
    if(key==="name"){state.name=input.value}
    else{state.profile??={};state.profile[key]=input.value}
    persist();
   });
   row.append(profileCopyLabel('field-'+key,ru,en,{as:'label',forId:inputId}),input);
   right.append(row);
 }
 const bio=h("div",{class:"ps-profile-row ps-profile-bio"});
 const descriptionId='ps-profile-description';
 const description=h("textarea",{id:descriptionId,rows:"5",maxLength:"500",
  placeholder:ownerCopy('profile','bio-placeholder',
   "Описание героя — сохраняется в билде","Hero bio — saved with the build"),
  "aria-label":ownerCopy('profile','bio-label',"О себе","About")});
 description.value=typeof profile.about==="string"?profile.about:"";
 description.addEventListener("input",()=>{state.profile??={};state.profile.about=description.value;persist()});
 bio.append(profileCopyLabel('bio-label','О себе','About',
  {as:'label',forId:descriptionId}),description);right.append(bio);
 // The placeholder is an accessible input attribute, never a text node.
 if(adminEditing&&adminToken){
  const placeholder=profileCopyLabel('bio-placeholder',
   'Описание героя — сохраняется в билде','Hero bio — saved with the build');
  const help=h('div',{class:'ps-profile-placeholder-editor'},[placeholder]);
  right.append(help);
 }
 right.append(profileCopyNote('profile-notes',
  'Поля профиля — пользовательские заметки в билде. Нация, честь и ранг не сверяются с игровым сервером и не участвуют в расчётах.',
  'Profile fields are notes saved with the build. Nation, honor and rank are not verified against the game server and do not affect calculations.'));
 view.append(left,right);root.append(view);
}
function renderCharacter(root){
 const tr=(ru,en)=>lang==='en'?en:ru;
 if(characterPanelTab!=='profile')characterPanelTab='character';
 const tabs=h("div",{class:"ps-character-tabs",role:"tablist","aria-label":tr("Окно персонажа","Character panel")});
 const selection=[["character",tr("Персонаж","Character")],["profile",tr("Профиль","Profile")]];
 for(const[key,label]of selection){
  tabs.append(h("button",{role:"tab","aria-selected":String(characterPanelTab===key),class:characterPanelTab===key?"chosen":"",
   text:label,onclick:()=>{characterPanelTab=key;renderDetails()}}));
 }
 root.append(tabs);
 const body=h("section",{class:"ps-character-body"});
 if(characterPanelTab==="profile")renderProfile(body);
 else{
  const cards=h("div",{class:"ps-overview-grid"});
  cards.append(
   h('div',{class:'ps-overview-card'},[
    profileCopyLabel('overview-race','Раса','Race'),
    h('strong',{text:races[state.race]?.[lang==='en'?1:0]||tr('Не выбрана','Not selected')})]),
   h('div',{class:'ps-overview-card'},[
    profileCopyLabel('overview-class','Профессия','Class'),
    h('strong',{text:jobs[state.job]||tr('Не выбрана','Not selected')})]),
   h('div',{class:'ps-overview-card'},[
    profileCopyLabel('overview-level','Уровень','Level'),
    h('strong',{text:String(state.level)})]));
  body.append(cards);
  const racialTitle=h('div',{class:'subhead'});
  racialTitle.append(h('span',{text:'✦'}),profileCopyLabel('racial-heading',
   'Расовая пассивка — выбери одну из трёх','Racial passive — choose one'));
  const passivePicker=h('div',{class:'race-passive-picker'});
  const passives=window.PandoraGameNavigation.racePassiveIds(catalog.racialPassives,state.race);
  if(!passives.length)passivePicker.append(h('p',{class:'muted',text:Number.isInteger(state.race)?tr('Загружаю расовые способности…','Loading racial abilities…'):tr('Выберите расу','Choose a race')}));
  for(const id of passives){
    const skill=catalog.skills?.[id],selected=String(state.racialPassiveId)===String(id);
    if(!skill)continue;
    const button=h('button',{class:'race-passive-choice'+(selected?' selected':''),'aria-pressed':String(selected),
      onclick:()=>{state.racialPassiveId=id;persist();renderOriginPassives();
       renderOriginVitals();renderDetails()}});
    const src=skillIcon('race',id,skill);
    const image=src?h('img',{src,alt:'',loading:'lazy'}):
     h('span',{text:'✦',class:'skill-fallback'});
    if(src)image.onerror=()=>image.replaceWith(h('span',{text:'✦',class:'skill-fallback'}));
    button.append(image,h('strong',{text:skill.name}),h('span',{text:skill.desc||tr('Описание отсутствует','No description')}),h('small',{text:selected?tr('✓ Выбрано','✓ Selected'):tr('Выбрать','Select')}));
    passivePicker.append(button);
  }
  body.append(racialTitle,passivePicker);
  body.append(profileCopyNote('overview-help',
   'Умения развиваются в «Пути героя», а очки характеристик распределяются в «Происхождении». Других редакторов этих значений здесь нет.',
   'Train skills in Hero Path and allocate attributes in Origin; these values have no duplicate editor here.'));
  const jump=h("div",{class:"ps-overview-actions"});
  jump.append(h("button",{class:"button-action",text:tr("⚔ Путь героя · умения","⚔ Hero Path · skills"),onclick:()=>{
   closeWorkbench();heroPathPage='skills';renderPathPages();saveView();
   $('pathSkillsTab')?.focus({preventScroll:true});
  }}));
  jump.append(h("button",{class:"button-action",text:tr("✥ Базовые характеристики","✥ Base attributes"),onclick:()=>{
   closeWorkbench();originActive='stats';renderOriginTabs();saveView();
  }}));
  jump.append(h("button",{class:"button-action",text:tr("✎ Изменить профиль","✎ Edit profile"),onclick:()=>{
   characterPanelTab='profile';renderDetails();
  }}));
  body.append(jump);
 }
 root.append(body);
}
// Legacy duplicate skill editor retired; all changes happen in the live Hero Path.
function renderSkills(root){
 root.append(h('p',{class:'muted',text:lang==='en'?
  'View skills and their requirements in Hero Path.':
  'Просматривайте умения и требования в «Пути героя».'}));
 root.append(h('button',{class:'button-action',
  text:lang==='en'?'Open skills':'Открыть умения',onclick:()=>{
   closeWorkbench();heroPathPage='skills';renderPathPages();saveView();
 }}));
}
function itemName(r){return window.PandoraItemPresentation.displayName(
 r,lang==='en'?'Unnamed item':'Предмет без названия',lang)}
function renderStats(root){
 const tr=(ru,en)=>lang==='en'?en:ru;
 const statName=i=>lang==='en'?ORIGIN_STAT_LABELS[i].nameEn:ORIGIN_STAT_LABELS[i].name;
 const icons=['♥','⚔','➶','✥','✦','❂'];
 const overview=h('div',{class:'stat-editor-overview'}),
  header=h('h3',{text:tr('Характеристики','Attributes')});
 const points=h('div',{class:'stat-total'},[
  h('strong',{text:'—'}),h('span',{text:tr('Свободные очки','Available points')})
 ]);
 overview.append(header,points);root.append(overview);
 const grid=h('div',{class:'stat-grid'}),controls=[];
 function refresh(){
  const s=attributeSnapshot();
  points.querySelector('strong').textContent=s?String(s.remaining):'—';
  points.querySelector('span').textContent=s?tr('Свободно из ','Available out of ')+s.total:
   tr('Свободные очки','Available points');
  overview.classList.toggle('over-budget',!!s?.overBudget);
  const estimate=previewBaseStats();
  for(const v of controls){
   const invested=Number(state.stats[STATS[v.i]]||0),base=s?.base[v.i];
   v.note.textContent=base===undefined?'':tr('База ','Base ')+base+' + '+invested;
   const code=ORIGIN_STAT_LABELS[v.i].code;
   v.total.textContent=base===undefined?'—':String(estimate?.stats?.[code]??(base+invested));
   v.range.value=String((base??0)+invested);v.exact.value=String((base??0)+invested);
   v.range.min=String(base??0);v.exact.min=String(base??0);
   v.range.max=String(s?.max[v.i]??99);v.exact.max=String(s?.max[v.i]??99);
   v.fill.style.width=s&&s.max[v.i]>0?Math.min(100,(base+invested)/s.max[v.i]*100)+'%':'0%';
   v.minus.disabled=!s||invested===0;
   v.plus.disabled=!window.PandoraAttributeProgression.allowed(s,v.i,invested+1);
   v.range.disabled=!s;v.exact.disabled=!s;
   v.plus.setAttribute('aria-label',tr('Увеличить ','Increase ')+statName(v.i)+tr('. Стоимость: ','. Cost: ')+(window.PandoraAttributeProgression.nextCost(s,v.i)??tr('максимум','maximum')));
  }
 }
 ORIGIN_STAT_LABELS.forEach((info,i)=>{
  const s=attributeSnapshot(),card=h('section',{class:'stat-card stat-visual-editor'});
  const head=h('div',{class:'stat-visual-head'},[
   h('span',{class:'stat-emblem',text:icons[i]}),
   h('h3',{text:statName(i)}),h('span',{class:'stat-visual-cap',text:s?tr('Макс. ','Max ')+s.max[i]:''})
  ]);
  const note=h('span',{class:'stat-base-note',text:''}),total=h('strong',{class:'stat-visual-value',text:'—'});
  const bar=h('div',{class:'stat-visual-progress'}),fill=h('div',{class:'stat-visual-fill'});
  bar.append(fill);
  const range=h('input',{type:'range',min:'0',max:'99',step:'1',value:'0',
   'aria-label':statName(i)+tr(' — вложено',' — invested')});
  const exact=h('input',{type:'number',min:'0',max:'99',step:'1',value:'0',
   'aria-label':tr('Точное значение ','Exact value ')+statName(i)});
  const change=value=>{
   const snap=attributeSnapshot(),absolute=window.PandoraAttributeProgression.resolveAbsolute(snap,i,value);
   if(absolute===null||!setAttributePoints(i,absolute-snap.base[i])){refresh();return}
   refresh();renderOriginStats();
  };
  const minus=h('button',{type:'button',class:'stat-step-decrement',text:'−'});
  const plus=h('button',{type:'button',class:'stat-step-increment',text:'+'});
  bindHoldStep(minus,()=>change((attributeSnapshot()?.values[i]??0)-1));
  bindHoldStep(plus,()=>change((attributeSnapshot()?.values[i]??0)+1));
  range.addEventListener('input',()=>change(range.value));
  exact.addEventListener('change',()=>change(exact.value));
  card.append(head,note,total,bar,h('div',{class:'stat-visual-controls'},[minus,range,plus,exact]));
  controls.push({i,note,total,range,exact,fill,minus,plus});grid.append(card);
 });
 root.append(grid);refresh();
}
let comparisonOpen=false;
function renderBuildComparison(host,onSelection=()=>{}){
 host.replaceChildren();
 host.className='build-compare-panel';
 host.setAttribute('data-build-compare','');
 const translate=(ru,en)=>lang==='en'?en:ru;
 const header=h('div',{class:'build-compare-header'});
 const title=h('h3',{class:'build-compare-title',
  text:translate('Сравнение билдов','Build comparison')});
 const content=h('div',{class:'build-compare-content',hidden:!comparisonOpen});
 const collapse=h('button',{type:'button',class:'build-compare-expand',
  'aria-expanded':String(comparisonOpen),
  text:comparisonOpen?translate('Скрыть сравнение','Collapse'):
   translate('Развернуть сравнение','Expand'),
  onclick:()=>{
   comparisonOpen=!comparisonOpen;
   content.hidden=!comparisonOpen;
   collapse.setAttribute('aria-expanded',String(comparisonOpen));
   collapse.textContent=comparisonOpen?translate('Скрыть сравнение','Collapse'):
    translate('Развернуть сравнение','Expand');
  }});
 header.append(title,collapse);
 const controls=h('div',{class:'build-compare-controls'});
 const pick=(letter,index)=>{
  const select=h('select',{class:'build-compare-select',
   'aria-label':translate('Билд ','Build ')+letter,
   'data-compare-select':letter});
  const field=h('label',{class:'build-compare-select-label'},[
   h('span',{text:translate('Билд ','Build ')+letter}),select]);
  const options=()=>{
   select.replaceChildren(h('option',{value:'',text:translate(
    'Выбери сохранённый билд','Choose a saved build')}));
   for(const build of builds)
    select.append(h('option',{value:build.id,text:build.name}));
   select.value=compareIds[index]||'';
  };
  select.onchange=()=>{
   const other=index===0?1:0,id=select.value;
   const next=[compareIds[0]||'',compareIds[1]||''];
   // A and B must represent two distinct saved builds.
   if(id&&next[other]===id)next[other]=next[index];
   next[index]=id;
   if(next[0]&&next[0]===next[1])next[other]='';
   compareIds=next;
   onSelection();update();
  };
  return {field,options};
 };
 const A=pick('A',0),B=pick('B',1);
 const swap=h('button',{type:'button',class:'build-compare-swap',
  text:'⇄','aria-label':translate('Поменять билды A и B местами','Swap builds A and B'),
  title:translate('Поменять A и B местами','Swap A and B'),
  onclick:()=>{compareIds=[compareIds[1]||'',compareIds[0]||''];
   onSelection();update()}});
 controls.append(A.field,swap,B.field);
 const summary=h('p',{class:'build-compare-summary',role:'status','aria-live':'polite'});
 const wrap=h('div',{class:'build-compare-table-wrap'});
 const table=h('table',{class:'build-compare-table','aria-label':translate(
  'Различающиеся итоговые характеристики билдов','Different calculated stats of saved builds')});
 const head=h('thead');
 // Two stat/A/B groups use the available drawer width without a delta column.
 head.append(h('tr',{},[
  h('th',{scope:'col',text:translate('Характеристика','Stat')}),
  h('th',{scope:'col',text:'A'}),
  h('th',{scope:'col',text:'B'}),
  h('th',{scope:'col',text:translate('Характеристика','Stat')}),
  h('th',{scope:'col',text:'A'}),
  h('th',{scope:'col',text:'B'})
 ]));
 const tbody=h('tbody');table.append(head,tbody);wrap.append(table);
 content.append(controls,summary,wrap);
 host.append(header,content);
 function update(){
  A.options();B.options();tbody.replaceChildren();
  const [a,b]=compareIds.map(id=>builds.find(x=>x.id===id));
  if(!a||!b||a.id===b.id){
   summary.textContent=builds.length<2?
    translate('Сохрани хотя бы два билда для сравнения.',
     'Save at least two builds to compare them.'):
    translate('Выбери два разных сохранённых билда.',
     'Select two different saved builds.');
   wrap.hidden=true;
   return;
  }
  // Loading the validated D1 snapshot is not a broken saved build.
  if(!catalog.live||!gameTables){
   summary.textContent=translate(
    'Итоговые характеристики появятся после загрузки игровых данных.',
    'Calculated stats will appear once game data have loaded.');
   wrap.hidden=true;
   return;
  }
  const [calcA,calcB]=window.PandoraBuildComparison.calculatePair(
   a.data,b.data,snap=>previewBaseStats(prepareSavedBuildSnapshot(snap)));
  if(!calcA||!calcB){
   summary.textContent=translate(
    'Не удалось рассчитать один из билдов. Сохранения не изменены.',
    'One of the builds could not be calculated. Saved builds were not changed.');
   wrap.hidden=true;
   return;
  }
  // Same calculated Hero Book values as Remaked, not a second simulation.
  const rows=window.PandoraBuildComparison.compactResults(
   window.PandoraStageAttributes.summaryRows(calcA),
   window.PandoraStageAttributes.summaryRows(calcB),{lang});
  summary.textContent=rows.length?
   translate('Отличий: ','Differences: ')+rows.length:
   translate('Среди рассчитанных характеристик отличий нет.',
    'No differences in the calculated stats.');
  wrap.hidden=!rows.length;
  // Every metric has exactly one A/B pair, even when an odd number of
  // differences leaves the last cell group empty. Only favorable values
  // get emphasis; the two input builds and their saves stay untouched.
  const metricCells=item=>!item?[
   h('th',{scope:'row',text:''}),h('td',{}),h('td',{})
  ]:[
   h('th',{scope:'row','data-compare-row':item.key,text:item.label}),
   h('td',{'data-compare-a':item.key,text:item.a,
    ...(item.advantage==='a'?{'data-compare-advantage':''}:{})}),
   h('td',{'data-compare-b':item.key,text:item.b,
    ...(item.advantage==='b'?{'data-compare-advantage':''}:{})})
  ];
  const half=Math.ceil(rows.length/2);
  for(let i=0;i<half;i++){
   tbody.append(h('tr',{},[
    ...metricCells(rows[i]),...metricCells(rows[i+half])
   ]));
  }
 }
 update();
 return {update};
}

function restoreLoadedBuildUI(){
 state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);
 racePreviewIndex=selectedPortraitIndex(state.race,state.gender);
 selectedSkillGroup=window.PandoraGameNavigation.branchGroup(state.branch)?.id||'melee';
 selectedSkill=null;inlineBranchId=null;selectedSlot=0;selectedSocket=0;
 stageSlotPickerOpen=false;stageSlotQuery='';stageSlotShown=48;
}
// One read-only materialization contract for BOTH opening a legacy save and
// previewing it in A/B. Missing nested objects inherit the same defaults.
// Neither operation mutates the persisted record; opening still saves only
// after the player explicitly chooses a build to open.
function prepareSavedBuildSnapshot(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  throw TypeError('Invalid saved build');
 const draft=structuredClone(raw),base=fresh();
 const record=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {...base,...draft,
  points:{...base.points,...record(draft.points)},
  mastery:{...base.mastery,...record(draft.mastery)},
  stats:{...base.stats,...record(draft.stats)},
  equipment:{...base.equipment,...record(draft.equipment)},
  souls:{...base.souls,...record(draft.souls)},
  soulOwners:{...base.soulOwners,...record(draft.soulOwners)},
  socketCapacities:{...base.socketCapacities,...record(draft.socketCapacities)},
  refinements:{...base.refinements,...record(draft.refinements)},
  gems:{...base.gems,...record(draft.gems)},
  vitalsBuffs:{...base.vitalsBuffs,...record(draft.vitalsBuffs)},
  attributeBuffs:{...base.attributeBuffs,...record(draft.attributeBuffs)},
  profile:{...base.profile,...record(draft.profile)}
 };
}
// A storage-quota failure must never replace a usable local draft or
// change its active saved-build identity. Commit the draft before UI changes.
function switchActiveDraft(snapshot,id){
 const previous=state;
 state=snapshot;
 // Preserve the same gender normalization as opening a save, without
 // altering the cached historical record.
 state.gender=window.PandoraUIPlanner.normalizeGender(races,state.race,state.gender);
 if(!persist()){
  state=previous;
  showStudioToast(lang==='en'?
   'Could not open the build: this browser could not save the new draft. Free up storage and try again.':
   'Не удалось открыть билд: браузер не сохранил новый черновик. Освободи место и повтори.','error');
  return false;
 }
 selectActiveBuild(id);
 restoreLoadedBuildUI();
 return true;
}
function openSavedBuild(b){
 if(!requireBuildAccount())return false;
 // Resolve the latest snapshot, but never change the active character until
 // that saved record has been cloned and structurally prepared successfully.
 if(!b||typeof b!=='object')return false;
 const latest=builds.find(record=>record.id===b.id)||b;
 if(!latest.data||typeof latest.data!=='object'||Array.isArray(latest.data)){
  showStudioToast(lang==='en'?'This saved build cannot be opened. Its data is incomplete.':
   'Не удалось открыть билд: его сохранённые данные повреждены.','warning');
  return false;
 }
 let next;
 try{
  next=prepareSavedBuildSnapshot(latest.data);
 }catch(error){
  showStudioToast(lang==='en'?'This saved build could not be restored.':
   'Не удалось восстановить сохранённый билд.','warning');
  return false;
 }
 if(!switchActiveDraft(next,latest.id))return false;
 render();changeTab('character');
 return true;
}
function unsavedBuild(){
 const s=JSON.stringify(state);
 return s!==JSON.stringify(fresh())&&!builds.some(b=>JSON.stringify(b.data)===s);
}
function newBlankBuild(){
 if(!switchActiveDraft(fresh(),null))return false;
 originActive='race';jobPathKey=null;classTreeTouched=false;
 newBuildPromptOpen=false;newBuildDraftName=null;
 expandedClassKeys=new Set();render();renderOriginTabs();
 changeTab('character');saveView();
 return true;
}
let buildSearchQuery='',newBuildPromptOpen=false,newBuildDraftName=null;
let buildHintEditorExpanded=false;
// Retired legacy-import UI: old guest builds stay in their original local
// backup and cannot be migrated into an account through the player interface.
// Only the character being actively edited can continue as an unsaved draft.
// One account entry point for saved builds and incoming build links.
let returnToBuildsAfterAuth=false,pendingGuestDraft=null;
function buildSignInCard({shared=false,inDialog=false}={}){
 const locale=window.PandoraUILocale;
 const caption=key=>locale.text(key,lang);
 const leadKey=shared?'librarySharedGateLead':'libraryGuestLead';
 const titleKey=shared?'librarySharedGateTitle':'libraryGuestTitle';
 const card=h('section',{
  class:inDialog?'build-signin-gate build-signin-gate-dialog':'build-signin-gate',
  role:'note','aria-label':caption('libraryGateAria')
 });
 card.append(h('span',{class:'build-signin-emblem','aria-hidden':'true',text:'◈'}),
  h('div',{class:'build-signin-copy'},[
   ...(inDialog?[]:[h('h3',{'data-owner-copy-key':titleKey,
    text:caption(titleKey)})]),
   h('p',{'data-owner-copy-key':leadKey,text:caption(leadKey)}),
   h('p',{class:'build-guest-storage-note',
    'data-owner-copy-key':'libraryGuestStorageWarning',
    text:caption('libraryGuestStorageWarning')})
  ]),h('div',{class:'build-signin-actions'},[
   h('button',{type:'button',class:'button-action primary',
    text:caption('accountSignIn'),onclick:()=>openBuildAccount('login')}),
   h('button',{type:'button',class:'button-action',
    text:caption('accountRegister'),onclick:()=>openBuildAccount('register')})
  ]));
 // Guest player data and account actions are never stored in editorial D1 keys.
 if(adminEditing&&adminToken)bindAccountCopyEditors(card);
 return card;
}
function openBuildAccount(mode){
 returnToBuildsAfterAuth=true;
 // Existing-account sign-in must not erase an unfinished guest draft.
 if(!window.PandoraAccountUI?.isLoggedIn()&&unsavedBuild())
  pendingGuestDraft={snapshot:structuredClone(state),owner:libraryScopeId()};
 const dialog=$('modalRoot');
 if(dialog&&!dialog.hidden){dialog.hidden=true;dialog.replaceChildren()}
 closeWorkbench();
 if(!window.PandoraAccountUI?.open?.(mode))$('profileTrigger')?.click();
}
function requireBuildAccount({shared=false}={}){
 if(window.PandoraAccountUI?.isLoggedIn())return true;
 modal(shared?(lang==='en'?'Sign in to open this build':'Вход для открытия билда'):
  (lang==='en'?'Sign in to save builds':'Вход для сохранения билдов'),
  buildSignInCard({shared,inDialog:true}));
 return false;
}
function notifyGuestDraftUnsaved(){
 showStudioToast(lang==='en'?
  'Guest hero is ready, but is not saved to your account yet. Open My Builds and select “Save new build”.':
  'Гостевой герой открыт, но ещё не сохранён в аккаунте. Открой «Мои билды» и нажми «Сохранить новый билд».','warning');
}
function finishBuildAccountEntry(){
 if(!window.PandoraAccountUI?.isLoggedIn()||
  window.PandoraAccountUI?.hasRecoveryPending?.())return;
 const shared=/^#b\/[A-Za-z0-9_-]{11}$/.test(location.hash);
 if(!returnToBuildsAfterAuth&&!shared&&!pendingGuestDraft)return;
 const returnToBuilds=returnToBuildsAfterAuth;
 returnToBuildsAfterAuth=false;
 const guest=pendingGuestDraft;
 pendingGuestDraft=null;
 const openIncoming=()=>{
  window.PandoraAccountUI?.dismiss?.();
  void restoreSharedHash();
 };
 if(guest&&guest.owner.startsWith('guest:')&&
  JSON.stringify(guest.snapshot)!==JSON.stringify(state)){
  // Resume the guest's current UNSAVED hero before opening the friend's link.
  // A separate nonempty account draft must NEVER be replaced silently.
  if(JSON.stringify(state)===JSON.stringify(fresh())){
   if(!switchActiveDraft(structuredClone(guest.snapshot),null))return;
   render();
   if(!builds.length)notifyGuestDraftUnsaved();
   if(shared)openIncoming();
   else{
    changeTab(returnToBuilds?'builds':'character');
    if(returnToBuilds)window.PandoraAccountUI?.dismiss?.();
   }
   return;
  }
  window.PandoraAccountUI?.dismiss?.();
  const tr=(ru,en)=>lang==='en'?en:ru;
  const accountWasSaved=!unsavedBuild();
  const content=h('div',{class:'build-draft-conflict'});
  content.append(h('p',{text:tr(
   'В аккаунте и на этом устройстве есть два разных героя. Выбери, с кем продолжить.',
   'You have two different characters: one in your account and one from this browser. Choose which to continue.')}));
  const guestName=String(guest.snapshot.name||tr('Гостевой герой','Guest character')).slice(0,70);
  const accountName=String(state.name||tr('Герой аккаунта','Account character')).slice(0,70);
  content.append(h('div',{class:'build-draft-choices'},[
   h('div',{class:'build-draft-choice'},[
    h('span',{text:tr('До входа · только на этом устройстве','Before sign-in · on this device only')}),
    h('strong',{text:guestName})]),
   h('div',{class:'build-draft-choice'},[
    h('span',{text:tr('Текущий черновик аккаунта','Current account draft')}),
    h('strong',{text:accountName})])
  ]));
  content.append(h('p',{class:'muted',text:accountWasSaved?tr(
   'Герой аккаунта уже сохранён. Гостевого можно продолжить без удаления сохранённого билда.',
   'Your account character is already saved. Continue the guest without deleting the saved build.'):
   tr('Если продолжишь гостевого героя, сначала сохраним героя аккаунта в «Мои билды». Облачная запись проверяется отдельно.',
      'To continue the guest, your account draft will first be saved in My Builds. Cloud saving is checked separately.')}));
  const close=()=>{$('modalRoot').hidden=true;$('modalRoot').replaceChildren()};
  const continueGuest=()=>{
   // Explicit choice is an explicit library save; never replace the
   // unsaved account draft before its browser copy has been committed.
   if(!accountWasSaved&&!saveBuild(state.name||tr('Новый герой','New hero')))return;
   if(!switchActiveDraft(structuredClone(guest.snapshot),null))return;
   // Account already had a different hero: don't prompt a second save.
   close();render();
   if(shared)openIncoming();else changeTab('character');
  };
  content.append(h('div',{class:'build-signin-actions'},[
   h('button',{type:'button',class:'button-action primary',
    text:accountWasSaved?tr('Продолжить гостевого героя','Continue guest character'):
     tr('Сохранить героя аккаунта и продолжить гостевого','Save account character and continue guest'),
    onclick:continueGuest}),
   h('button',{type:'button',class:'button-action',
    text:tr('Оставить героя аккаунта','Keep account character'),
    onclick:()=>{close();if(shared)openIncoming();else if(returnToBuilds)changeTab('builds')}})
  ]));
  modal(lang==='en'?'Continue your character?':'Продолжить персонажа?',content);
 }else if(shared)openIncoming();
 else if(returnToBuilds){
  window.PandoraAccountUI?.dismiss?.();
  changeTab('builds');
 }
}

function renderBuilds(root){
 if(!window.PandoraAccountUI?.isLoggedIn()){
  root.append(buildSignInCard());return;
 }
 // This renderer is independent from the Origin and Hero Path local helpers.
 const tr=(ru,en)=>lang==='en'?en:ru;
 const libraryText=key=>window.PandoraUILocale.text(key,lang);
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
 root.append(toolbar,choice,h('p',{class:'cloud-library-status',role:'status',
  text:cloudStatusText(cloudLibraryStatus)}));
 // Owner-only inline editing of these five authored explanations. Keep the
 // four player action buttons intact; do not nest pencils in real actions.
 if(adminEditing&&adminToken){
  const editor=h('details',{class:'build-hint-owner-panel'});
  editor.open=buildHintEditorExpanded;
  editor.addEventListener('toggle',()=>{
   if(editor.isConnected)buildHintEditorExpanded=editor.open;
  });
  editor.append(h('summary',{text:tr('Кнопки и подсказки','Buttons and hints')}));
  const rows=h('div',{class:'build-hint-owner-list'});
  rows.append(h('h4',{class:'build-hint-owner-section',
   text:tr('Надписи действий','Action labels')}));
  for(const [key,ru,en] of [
   ['libraryCardOpen','Открыть','Open'],
   ['libraryCardOverwrite','Перезаписать','Overwrite'],
   ['libraryCardShare','Поделиться','Share'],
   ['libraryCardDelete','Удалить','Delete']
  ]){
   rows.append(h('div',{class:'build-hint-owner-row'},[
    h('span',{class:'build-hint-owner-action',text:tr(ru,en)}),
    h('span',{class:'build-hint-owner-value',
     'data-owner-copy-key':key,text:libraryText(key)})
   ]));
  }
  rows.append(h('h4',{class:'build-hint-owner-section',
   text:tr('Подсказки при наведении','Hover descriptions')}));
  for(const [key,ru,en] of [
   ['libraryHintOpen','Открыть','Open'],
   ['libraryHintOverwrite','Перезаписать','Overwrite'],
   ['libraryHintShare','Поделиться','Share'],
   ['libraryHintDelete','Удалить','Delete'],
   ['libraryHintDeleteLocal','Локальная копия','Local copy']
  ]){
   rows.append(h('div',{class:'build-hint-owner-row'},[
    h('span',{class:'build-hint-owner-action',text:tr(ru,en)}),
    h('span',{class:'build-hint-owner-value',
     'data-owner-copy-key':key,text:libraryText(key)})
   ]));
  }
  rows.append(h('h4',{class:'build-hint-owner-section',
   text:tr('Поиск и сообщения','Search and messages')}));
  for(const [key,ru,en] of [
   ['librarySearchInputLabel','Имя поля','Search field label'],
   ['librarySearchPlaceholder','Подсказка поиска','Search placeholder'],
   ['librarySearchEmpty','Ничего не найдено','No matches'],
   ['libraryEmpty','Нет сохранений','No saved builds']
  ]){
   rows.append(h('div',{class:'build-hint-owner-row'},[
    h('span',{class:'build-hint-owner-action',text:tr(ru,en)}),
    h('span',{class:'build-hint-owner-value',
     'data-owner-copy-key':key,text:libraryText(key)})
   ]));
  }
  editor.append(rows);root.append(editor);
 }
 const comparisonSlot=h('section',{'data-build-compare-slot':''});
 root.append(comparisonSlot);
 let comparison=null;
 const grid=h('div',{class:'build-grid'}),searchable=[];
 // Four fixed-size slots per row. Only visible cards consume scroll width.
 const setGridColumns=count=>grid.style.setProperty('--build-visible-columns',
  String(Math.max(1,Math.min(4,count))));
 const syncCompareCheckboxes=()=>{
  for(const row of searchable)row.check.checked=compareIds.includes(row.build.id);
 };
 const search=(builds.length>5||Boolean(buildSearchQuery.trim()))?h('input',{
  type:'search',class:'build-library-search','data-build-library-search':'',
  'aria-label':libraryText('librarySearchInputLabel'),
  placeholder:libraryText('librarySearchPlaceholder'),value:buildSearchQuery}):null;
 if(search)root.append(search);
 // One game-style hint popup is shared across all buttons and the Hero Book.
 // Only authored RU/EN copy is passed to the read-only tooltip; never a
 // saved build name, link/token, account or live server response.
 const cardAction=(icon,labelKey,hintKey,onclick,kind='')=>{
  const button=h('button',{
   type:'button',class:'button-action'+kind,'data-build-action-hint':hintKey,
   onclick
  },[
   h('span',{class:'build-card-action-icon','aria-hidden':'true',text:icon}),
   h('span',{class:'build-card-action-label','data-build-action-label':labelKey,
    text:libraryText(labelKey)})
  ]);
  window.PandoraGuideTooltip?.attach(button,libraryText(hintKey),{hoverDelay:350});
  return button;
 };
 for(const b of builds){
  const box=h('div',{class:'build-card'});
  const shareSlot=h('div',{class:'build-share-slot',role:'status'});
  const openChoice=h('div',{class:'build-open-choice',hidden:true});
  const check=h('input',{type:'checkbox','aria-label':(lang==='en'?'Compare ':'Сравнить ')+b.name});
  openChoice.append(h('p',{text:tr('Есть несохранённые изменения. Открыть другой билд?',
    'You have unsaved changes. Open another build?')}),
   h('button',{type:'button',class:'button-action primary',text:tr('Сохранить текущий и открыть','Save current and open'),
    onclick:()=>{if(saveBuild())openSavedBuild(b)}}),
   h('button',{type:'button',class:'button-action',text:tr('Открыть без сохранения','Open without saving'),
    onclick:()=>openSavedBuild(b)}),
   h('button',{type:'button',class:'button-action',text:tr('Отмена','Cancel'),
    onclick:()=>{openChoice.hidden=true}}));
  const overwriteChoice=h('div',{class:'build-overwrite-choice',hidden:true});
   overwriteChoice.append(h('p',{text:lang==='en'?
    'Overwrite saved build “'+b.name+'” with your current character? The previous version of this build cannot be restored.':
    'Перезаписать сохранённый билд «'+b.name+'» текущим персонажем? Предыдущую версию этого билда восстановить будет нельзя.'}),
   h('button',{type:'button',class:'button-action primary',text:tr('Подтвердить перезапись','Confirm overwrite'),onclick:()=>{
    if(saveBuild(activeBuildId===b.id?state.name:b.name,b.id))showStudioToast(tr('Сохранено в браузере. Проверяем запись в облаке…',
     'Saved in browser. Checking cloud storage…'),'warning');
   }}),
   h('button',{type:'button',class:'button-action',text:tr('Отмена','Cancel'),onclick:()=>{overwriteChoice.hidden=true}}));
  const deleteChoice=h('div',{class:'build-delete-choice',hidden:true});
  deleteChoice.append(h('p',{text:b.localOnly===true?
   tr('Удалить локальную копию? Она ещё не сохранена в облаке.',
    'Delete local copy? It has not been saved to the cloud yet.'):
   tr('Удалить билд и отозвать все созданные ссылки?',
    'Delete this build and revoke all shared links?')}),
   h('button',{class:'button-action danger',type:'button',text:tr('Удалить билд','Delete build'),onclick:()=>{
    const beforeDelete=builds;
    builds=builds.filter(v=>v.id!==b.id);
    if(!persistBuilds()){
     builds=beforeDelete;
     showStudioToast(tr('Не удалось удалить билд: браузер не сохранил изменения.',
      'Could not delete the build: the browser failed to save the change.'),'error');
     return;
    }
    compareIds=compareIds.filter(id=>id!==b.id);
    if(activeBuildId===b.id)selectActiveBuild(null);
    if(b.localOnly===true){
     libraryChangeId++;
     reportCloudStatus('Локальная копия удалена');
    }else void deleteCloudBuild(b.id);
    renderDetails();
   }}),
   h('button',{class:'button-action',type:'button',text:tr('Отмена','Cancel'),onclick:()=>{deleteChoice.hidden=true}}));
  check.checked=compareIds.includes(b.id);
  check.onchange=()=>{
   const chosen=compareIds.filter(Boolean);
   compareIds=check.checked?[...chosen.filter(id=>id!==b.id),b.id].slice(-2):
    chosen.filter(id=>id!==b.id);
   comparisonOpen=true;
   if(comparison)comparison.update();
   syncCompareCheckboxes();
   comparisonSlot.querySelector('.build-compare-content')?.removeAttribute('hidden');
   const expand=comparisonSlot.querySelector('.build-compare-expand');
   if(expand){expand.setAttribute('aria-expanded','true');
    expand.textContent=lang==='en'?'Collapse':'Скрыть сравнение'}
  };
  // Keep the compare selector separate from the four one-row actions.
  // Build names remain user-owned; only static labels use D1 editorial copy.
  const cardHead=h('div',{class:'build-card-head'},[
   h('h3',{class:'build-card-title',text:b.name}),
   h('label',{class:'build-card-compare'},[
    check,h('span',{text:tr('Сравнить','Compare')})
   ])
  ]);
  // A second confirmation replaces the first instead of stacking panels.
  const toggleCardChoice=target=>{
   const opening=target.hidden;
   for(const choice of [openChoice,overwriteChoice,deleteChoice])choice.hidden=true;
   target.hidden=!opening;
   if(opening)target.querySelector('button')?.focus({preventScroll:true});
  };
  const cardActions=h('div',{class:'build-card-actions'},[
   cardAction('📂','libraryCardOpen','libraryHintOpen',()=>{
    if(!unsavedBuild()){openSavedBuild(b);return}
    toggleCardChoice(openChoice);
   },' primary'),
   cardAction('↻','libraryCardOverwrite','libraryHintOverwrite',()=>toggleCardChoice(overwriteChoice)),
   cardAction('🔗','libraryCardShare','libraryHintShare',()=>createShared(b,shareSlot)),
   cardAction('🗑','libraryCardDelete',b.localOnly===true?
    'libraryHintDeleteLocal':'libraryHintDelete',()=>toggleCardChoice(deleteChoice),' build-card-delete')
  ]);
  box.append(cardHead,
   ...(b.localOnly===true?[h('p',{class:'build-local-only-note',
    text:tr('Локальная копия · чтобы сохранить в облако, откройте её и нажмите «Перезаписать»',
     'Local copy · to save it to the cloud, open it and select Overwrite')})]:[]),
   h('p',{class:'build-card-meta',
    text:(races[b.data?.race]?.[lang==='en'?1:0]||'?')+' · '+
     (jobs[b.data?.job]||'?')+' · '+(lang==='en'?'Lv. ':'ур. ')+(b.data?.level||'?')}),
   cardActions);
  box.append(openChoice);
  box.append(deleteChoice);
  box.append(overwriteChoice);
  box.append(shareSlot);
  grid.append(box);
  searchable.push({box,build:b,check,searchText:[b.name,races[b.data?.race]?.[0],races[b.data?.race]?.[1],jobs[b.data?.job],
   (lang==='en'?'Lv. ':'ур. ')+(b.data?.level??'')].filter(Boolean).join(' ').toLocaleLowerCase()});
 }
 setGridColumns(searchable.length);
 root.append(grid);
 comparison=renderBuildComparison(comparisonSlot,syncCompareCheckboxes);
 if(search){
  const none=h('p',{class:'muted','data-build-library-state-copy':'librarySearchEmpty',
   text:libraryText('librarySearchEmpty'),hidden:true});
  root.append(none);
  const apply=()=>{
   let visible=0;
   // Use the SAME RU/EN, ё/е, Unicode and unordered-word search behavior
   // as equipment and encyclopedia pickers, including player build names.
   const query=buildSearchQuery.trim();
   for(const row of searchable){
    row.box.hidden=!searchWords(row.searchText,query);
    if(!row.box.hidden)visible++;
   }
   setGridColumns(visible);
   none.hidden=!query||visible>0;
  };
  search.addEventListener('input',()=>{buildSearchQuery=search.value;apply()});
  apply();
 }
 if(!builds.length)root.append(h('p',{class:'muted',
  'data-build-library-state-copy':'libraryEmpty',text:libraryText('libraryEmpty')}));
 window.PandoraUILocale.localize(root,lang);
 // Saved-build controls are mounted dynamically; bind the same D1 editor
 // used for authored account copy after every library render.
 bindAccountCopyEditors(root);
}
function newId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')}
function saveBuild(name=state.name||'Новый герой',overwriteId=null){
 if(!requireBuildAccount())return false;
 if(typeof name!=='string'||!name.trim())return false;
 const cleanName=name.trim().slice(0,70),previousName=state.name;
 const previousBuilds=builds.slice(),previousActive=activeBuildId;
 const existingIndex=overwriteId?builds.findIndex(b=>b.id===overwriteId):-1;
 const existing=existingIndex>=0?builds[existingIndex]:null;
 const id=existing?existing.id:newId();
 const creationStamp=window.PandoraBuildLibraryMerge.creationStamp;
 const createdAt=existing?creationStamp(existing):
  Math.max(Date.now(),0,...builds.map(row=>creationStamp(row)+1));
 state.name=cleanName;
 const entry={id,name:cleanName,data:structuredClone(state),createdAt,
  at:Math.max(Date.now(),(existing?Number(existing.at)||0:0)+1)};
 // A new save goes last; overwriting keeps the existing card in its place.
 if(existing)builds.splice(existingIndex,1,entry);
 else builds.push(entry);
 try{window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
  'ps-build-library.v1',JSON.stringify(builds))}
 catch(error){
  builds=previousBuilds;state.name=previousName;selectActiveBuild(previousActive);
  showStudioToast('Билд не сохранён: браузер не смог записать его. Текущий герой остался открытым. Освободи место в браузере и повтори.','error');
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
 safe.masteryFormat=original.masteryFormat===2?2:1;
 if(original.mastery&&typeof original.mastery==='object'&&!Array.isArray(original.mastery)){
  const valid=new Set(branches.map(b=>String(b.id)));
  for(const [key,level] of Object.entries(original.mastery)){
   if(valid.has(key)&&Number.isInteger(level)&&level>=0&&level<=1000)
    safe.mastery[key]=Math.min(level,90);
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
 for(const [key,value] of Object.entries(original.socketCapacities||{}).slice(0,100))
  if(/^(?:[0-9]|1[0-3]):[0-9]{1,20}$/.test(key)&&
   Number.isInteger(value)&&value>=0&&value<=3)
   safe.socketCapacities[key]=value;
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
  for(const [key,limit] of [['guildLevel',12],['priestSpi',500],['priestBlessing',500],['priestHymn',500],['priestBenevolence',500],['priestExorcism',500],
   ['guildLifeRecovery',2],['guildManaRecovery',2],['guildHealing',3],['guildArouse',3],
   ['guildPhysicalReduction',3],['guildMagicReduction',3],['guildExperience',8]]){
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
  safe.attributeBuffs.remakedSkillIds=window.PandoraRemakedBuffs?.selectedIds(
   rawAttributes.remakedSkillIds)||[];
  for(const key of ['combatWarCry','combatRage','combatDefender','combatLunge',
   'combatWindAssist','combatWindBlessing','combatConcentration'])
   if(rawAttributes[key]===true)safe.attributeBuffs[key]=true;
  if(safe.attributeBuffs.combatRage===true)safe.attributeBuffs.combatDefender=false;
 }
 if(Number.isSafeInteger(original.racialPassiveId)&&original.racialPassiveId>=0&&original.racialPassiveId<10000000000)
  safe.racialPassiveId=original.racialPassiveId;
 return safe;
}
// Shared-link dialogs sit outside the saved-build panel's locale walker.
// Translate fixed UI copy, never the user's custom build name.
const sharedText=(ru,en)=>lang==='en'?en:ru;
function isVerifiedSharedBuild(share,expectedData){
 if(!share||share.schema!==1||share.type!=='build'||
  !share.data||typeof share.data!=='object'||Array.isArray(share.data))return false;
 try{return JSON.stringify(share.data)===JSON.stringify(expectedData)}
 catch{return false}
}
async function createShared(build,host){
 if(!requireBuildAccount())return;
 if(!build||!host)return;
 // Render detached authored text before insertion. The generic library
 // translator only annotates standalone, literal copy; neither URLs nor
 // generated player data may become editorial targets.
 const showShareCopy=(literal,kind='muted')=>{
  const row=h('div',{class:'share-editorial-row'},
   h('p',{class:kind,text:literal}));
  window.PandoraUILocale?.localize(row,lang);
  if(host.isConnected){
   host.replaceChildren(row);
   if(adminEditing&&adminToken)bindAccountCopyEditors(row);
  }
 };
 if(build.localOnly===true){
  showShareCopy('Сначала откройте эту локальную копию и явно сохраните её через «Перезаписать».',
   'build-share-error');
  return;
 }
 try{
  // Validation is synchronous, so avoid an imperceptible duplicate
  // "Checking…" loading step before starting the real network request.
  sanitizeSharedState(build.data);
  showShareCopy('Создаём ссылку из последней сохранённой облачной версии…');
  const response=await apiRequest('/api/shared',{schema:1,type:'build',buildId:build.id},
   window.PandoraAccountUI.token());
  if(!/^[A-Za-z0-9_-]{11}$/.test(response.id||''))throw Error('Некорректная ссылка');
  // Confirm that the new public link is immediately readable before showing it.
  const check=await apiRequest('/api/shared/'+response.id,null,window.PandoraAccountUI.token());
  if(!isVerifiedSharedBuild(check?.share,build.data))
   throw Error('Ссылка не подтвердила выбранный билд. Попробуйте ещё раз.');
  const url=location.origin+location.pathname+'#b/'+response.id;
  const message=h('div',{class:'share-result'});
  const field=h('input',{type:'text',readOnly:true,value:url,'aria-label':'Ссылка на билд'});
  const copy=h('button',{type:'button',class:'button-action primary',text:'Скопировать ссылку',
   onclick:async()=>{
    try{await navigator.clipboard.writeText(url);
     copy.textContent=window.PandoraUILocale?.ui('✓ Скопировано',lang)||'✓ Скопировано';
    }catch{field.focus();field.select();
     copy.textContent=window.PandoraUILocale?.ui(
      'Ссылка выделена — скопируй через меню или Ctrl+C',lang)||
      'Ссылка выделена — скопируй через меню или Ctrl+C';}
   }});
  // Put static editorial copy in its own non-action row. This allows
  // owner-only inline editing without re-running clipboard or share actions.
  const titleCopy=h('div',{class:'share-result-copy-row'},
   h('p',{text:response.reused?'Ссылка на билд уже создана.':'Ссылка на билд создана.'}));
  const explanation=h('div',{class:'share-result-copy-row'},
   h('p',{class:'muted',text:'Ссылка хранит снимок на момент публикации. После удаления оригинального билда она перестанет работать.'}));
  message.append(titleCopy,field,copy,explanation);
  window.PandoraUILocale.localize(message,lang);
  if(host.isConnected){
   host.replaceChildren(message);
   if(adminEditing&&adminToken)bindAccountCopyEditors(message);
  }
 }catch(error){
  // The server response is runtime data: keep it in its own non-editable
  // span, not inside the D1-controlled introductory explanation.
  const prefix=h('span',{class:'share-error-intro',text:'Не удалось создать ссылку:'});
  window.PandoraUILocale?.localize(prefix,lang);
  const detail=h('span',{class:'share-runtime-detail',
   text:' '+(window.PandoraUILocale?.ui(error.message,lang)||error.message)});
  const row=h('div',{class:'share-editorial-row build-share-error'},[prefix,detail]);
  if(host.isConnected){
   host.replaceChildren(row);
   if(adminEditing&&adminToken)bindAccountCopyEditors(row);
  }
 }
}
function openSharedSnapshot(share){
 if(!requireBuildAccount({shared:true}))return;
 if(!share||share.schema!==1||!['build','library'].includes(share.type))throw Error('Неподдерживаемая ссылка');
 const clear=()=>{if(location.hash.startsWith('#b/'))history.replaceState(history.state,'',location.pathname+location.search)};
 // Bind the confirmation to the original signed-in owner.
 const viewerToken=window.PandoraAccountUI.token(),viewerOwner=libraryScopeId();
 const sameViewer=()=>window.PandoraAccountUI?.token()===viewerToken&&
  libraryScopeId()===viewerOwner;
 const verifyViewer=()=>{
  if(sameViewer())return true;
  showStudioToast(sharedText(
   'Аккаунт изменился. Открой ссылку снова, чтобы выбрать нужный аккаунт.',
   'Your account changed. Open the link again to select the correct account.'),'warning');
  return false;
 };
 if(share.type==='library'){
  if(!Array.isArray(share.data)||!share.data.length||share.data.length>30)throw Error('Неверная библиотека');
  const added=share.data.map(v=>({id:newId(),name:String(v.name||'Билд').slice(0,70),
   data:sanitizeSharedState(v.data),at:Date.now()}));
  const view=h('div',{class:'shared-receiver-dialog'});
  const importCountLabel=h('span',{class:'shared-import-count-label',
   text:'Билдов по ссылке:'});
  window.PandoraUILocale?.localize(importCountLabel,lang);
  // The counter stays live and entirely outside owner-editable content.
  const importCount=h('p',{class:'shared-import-count'},[
   importCountLabel,
   h('span',{class:'shared-import-count-value',text:' '+added.length+'.'})
  ]);
  const importNote=h('p',{class:'muted shared-receiver-note',
   text:'Текущий герой и сохранённые билды не изменятся. Новые копии добавятся в «Мои билды».'});
  window.PandoraUILocale?.localize(importNote,lang);
  // The count is always live data and must never be part of editable copy.
  view.append(importCount,h('div',{class:'shared-receiver-copy-row'},importNote),
   h('div',{class:'build-signin-actions'},[
    h('button',{type:'button',class:'button-action primary',
     text:sharedText('Добавить в мои билды','Add to My Builds'),onclick:()=>{
      if(!verifyViewer())return;
      if(builds.length+added.length>200){
       showStudioToast(sharedText(
        'В библиотеке может быть до 200 билдов. Удали ненужные и повтори.',
        'Your library holds up to 200 builds. Delete unused builds and try again.'),'warning');
       return;
      }
      const next=[...added,...builds];
      try{
       window.PandoraBuildScope.setOwned(localStorage,libraryScopeId(),
        'ps-build-library.v1',JSON.stringify(next));
      }catch{
       showStudioToast(sharedText(
        'Не удалось добавить билды: браузер не сохранил их. Освободи место и повтори.',
        'Could not add builds: the browser could not save them. Free up space and retry.'),'error');
       return;
      }
      builds=next;libraryChangeId++;
      const batchOwner=libraryScopeId(),batchGeneration=libraryChangeId;
      $('modalRoot').hidden=true;clear();changeTab('builds');
      reportCloudStatus(sharedText(
       'Новые билды сохранены в браузере · проверяем облако…',
       'New builds saved in this browser · checking cloud…'));
      void uploadSharedBuildBatch(added,batchOwner,batchGeneration);
     }}),
    h('button',{type:'button',class:'button-action',
     text:sharedText('Отмена','Cancel'),onclick:()=>{
      $('modalRoot').hidden=true;clear();
     }})
   ]));
  modal(sharedText('Добавить билды по ссылке?','Add builds from link?'),view);
  if(adminEditing&&adminToken)bindAccountCopyEditors(view);
  return;
 }
 const incoming=sanitizeSharedState(share.data);
 const view=h('div',{class:'shared-receiver-dialog'});
 const openNote=h('p',{class:'muted shared-receiver-note',
  text:'Сохранённые в «Мои билды» записи при этом не удаляются.'});
 const unsavedWarning=h('p',{class:'muted shared-receiver-note',
  text:'Несохранённые изменения текущего персонажа будут заменены.'});
 window.PandoraUILocale?.localize(openNote,lang);
 window.PandoraUILocale?.localize(unsavedWarning,lang);
 // Split the incoming player's name from the authored warning. No portion
 // of the name becomes a D1 editable label, even when the name matches copy.
 view.append(
  h('p',{class:'shared-personal-name',
   text:sharedText('Открыть билд «','Open build “')+
    incoming.name+sharedText('»?','”?')}),
  h('div',{class:'shared-receiver-copy-row shared-unsaved-warning-row'},unsavedWarning),
  h('div',{class:'shared-receiver-copy-row'},openNote)
 );
 const apply=()=>{
  // Do not dismiss the preview or discard the previous hero when the new
  // draft cannot be saved (for example, browser storage quota exhaustion).
  if(!verifyViewer()||!requireBuildAccount({shared:true})||
   !switchActiveDraft(incoming,null))return false;
  $('modalRoot').hidden=true;$('modalRoot').replaceChildren();
  clear();render();changeTab('character');
  return true;
 };
 view.append(h('button',{class:'button-action primary',
  text:sharedText('Сохранить текущий и открыть','Save current and open'),
   onclick:()=>{if(saveBuild())apply()}}),
  h('button',{class:'button-action',
   text:sharedText('Открыть без сохранения','Open without saving'),onclick:apply}),
  h('button',{class:'button-action',text:sharedText('Отмена','Cancel'),onclick:()=>{
   $('modalRoot').hidden=true;clear();
  }}));
 modal(sharedText('Открыть билд по ссылке?','Open build from link?'),view);
 if(adminEditing&&adminToken)bindAccountCopyEditors(view);
}
let studioToastTimer=null;
// Ignore obsolete replies when the same shared URL is reopened before an older GET resolves.
let sharedHashRequestId=0;
function showStudioToast(message,tone='warning'){
 const statusKey=window.PandoraUILocale?.literalKey?.(message);
 const authoredKey=statusKey?.startsWith('status')?statusKey:null;
 let root=document.getElementById('studioToast');
 if(!root){root=h('div',{id:'studioToast',class:'studio-toast','aria-live':'polite',role:'status'});document.body.append(root)}
 clearTimeout(studioToastTimer);
 root.className='studio-toast '+tone;
 root.replaceChildren(h('div',{class:'studio-toast-content'},[
  h('strong',{text:window.PandoraUILocale?.ui(
   tone==='success'?'Готово':tone==='error'?'Ошибка':'Уведомление',lang)}),
  h('p',{text:window.PandoraUILocale?.ui(message,lang)||message,
   ...(authoredKey?{'data-owner-copy-key':authoredKey}:{})})
 ]));
 const close=()=>{root.hidden=true;root.replaceChildren()};
 root.append(h('button',{type:'button',class:'studio-toast-ok',text:'ОК',onclick:close}));
 root.hidden=false;
 if(authoredKey&&adminEditing&&adminToken){
  // No auto-dismiss while the owner is editing a short authored notice.
  // Runtime/server diagnostics remain non-editable and time out normally.
  bindAccountCopyEditors(root);
 }else studioToastTimer=setTimeout(close,8500);
}
// Only user-facing, whitelisted D1-owned toast copy can be retranslated.
// Raw server errors and values containing build names must remain untouched.
function refreshOpenAuthoredToast(){
 const root=document.getElementById('studioToast');
 if(!root||root.hidden)return;
 const textNode=root.querySelector('.studio-toast-content [data-owner-copy-key]');
 if(!textNode)return;
 const locale=window.PandoraUILocale,key=textNode.dataset.ownerCopyKey;
 if(!locale?.fieldKey?.(key))return;
 // Switching language while typing must not destroy the input or send its
 // original RU text into the EN field. The edit captures its starting locale.
 if(textNode.nextElementSibling?.classList?.contains('ui-content-edit-host'))return;
 textNode.textContent=locale.text(key,lang);
 const heading=root.querySelector('.studio-toast-content>strong');
 if(heading)heading.textContent=locale.ui(root.classList.contains('success')?'Готово':
  root.classList.contains('error')?'Ошибка':'Уведомление',lang);
 const pencil=textNode.nextElementSibling;
 if(pencil?.dataset?.ownerCopyPencil===key){
  pencil.title=lang==='en'?'Edit caption':'Изменить надпись';
  pencil.setAttribute('aria-label',
   (lang==='en'?'Edit caption: ':'Изменить надпись: ')+textNode.textContent);
 }
}
async function restoreSharedHash(){
 const match=location.hash.match(/^#b\/([A-Za-z0-9_-]{11})$/);
 if(!match)return;
 const currentRequest=++sharedHashRequestId;
 if(!window.PandoraAccountUI?.isLoggedIn()){
  requireBuildAccount({shared:true});return;
 }
 const sessionToken=window.PandoraAccountUI.token();
 try{
  const incoming=await apiRequest('/api/shared/'+match[1],null,sessionToken);
  if(currentRequest===sharedHashRequestId&&
   window.PandoraAccountUI?.token()===sessionToken&&location.hash==='#b/'+match[1])
   openSharedSnapshot(incoming.share);
 }catch(error){
  // Neither a departed URL nor an older attempt for the same URL may show an error.
  if(currentRequest!==sharedHashRequestId||
   window.PandoraAccountUI?.token()!==sessionToken||
   location.hash!=='#b/'+match[1])return;
  const removed=error.httpStatus===404||error.httpStatus===410;
  const message=error.httpStatus===410&&error.reason==='deleted'?
   'Владелец удалил этот билд. Ссылка больше не существует.':
   error.httpStatus===410&&error.reason==='legacy'?
   'Ссылка устарела. Попросите владельца поделиться билдом заново.':
   error.httpStatus===410&&error.reason==='invalid'?
   'Ссылка на билд повреждена. Попросите владельца создать новую.':
   error.httpStatus===404?
   'Билд по ссылке не найден. Возможно, адрес неверный.':
   'Не получилось загрузить билд. Проверь соединение и попробуй снова.';
  showStudioToast(message,removed?'warning':'error');
  if(removed&&location.hash==='#b/'+match[1])
   history.replaceState(history.state,'',location.pathname+location.search);
 }
}
function modal(title,content){
 const root=$('modalRoot'),origin=document.activeElement;
 root.replaceChildren();root.hidden=false;
 const box=h('div',{class:'modal',role:'dialog','aria-modal':'true','aria-label':title});
 const close=()=>{
  root.hidden=true;root.replaceChildren();
  if(origin?.isConnected&&typeof origin.focus==='function')
   origin.focus({preventScroll:true});
 };
 const heading=h('h2',{text:title,tabindex:'-1'});
 box.append(h('button',{type:'button',class:'button-action close',
  text:sharedText('× Закрыть','× Close'),onclick:close}),heading,content);
 root.append(box);
 root.onclick=e=>{if(e.target===root)close()};
 box.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();event.stopPropagation();close();return;
  }
  if(event.key!=='Tab')return;
  const controls=[...box.querySelectorAll(
   'button:not(:disabled),input:not(:disabled),select:not(:disabled),'+
   'textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])'
  )].filter(node=>!node.hidden&&node.getClientRects().length>0);
  if(!controls.length){event.preventDefault();heading.focus();return}
  const first=controls[0],last=controls[controls.length-1],active=document.activeElement;
  if(event.shiftKey&&(active===first||active===heading)){
   event.preventDefault();last.focus({preventScroll:true});
  }else if(!event.shiftKey&&(active===last||active===heading)){
   event.preventDefault();first.focus({preventScroll:true});
  }
 });
 // Focus a non-action heading, not a destructive confirmation button.
 heading.focus({preventScroll:true});
 return box;
}
async function apiRequest(path,body,token=adminToken) {
 const editingWrite=Boolean(body)&&/^\/api\/admin\/(?:override|reset)$/.test(path);
 // The last D1 snapshot read by this editor is the precondition for every
 // owner write, including inline edits, list edits, deletion and Undo.
 // Never derive it from the new patch; remote changes must cause HTTP 409.
 const requestBody=editingWrite&&typeof body.key==='string'?
  {...body,expectedValue:activeOverride(body.key)}:body;
 const finishOwnerWrite=(message='')=>{
  if(!editingWrite)return;
  ownerWritePendingCount=Math.max(0,ownerWritePendingCount-1);
  if(message)ownerSaveError=message;
  // Never let a late successful write hide another failed field.
  ownerSaveState=ownerWritePendingCount>0?'saving':
   ownerSaveError?'error':'saved';
  refreshOwnerUI();
 };
 if(editingWrite){
  if(ownerWritePendingCount===0)ownerSaveError='';
  ownerWritePendingCount++;
  ownerSaveState='saving';refreshOwnerUI();
 }
 let response;
 try {
  response=await fetch(API+path,{
   method:body?"POST":"GET",
   headers:{"Content-Type":"application/json",...(token?{"Authorization":"Bearer "+token}:{})},
   ...(requestBody?{body:JSON.stringify(requestBody)}:{})
  });
 } catch {
  finishOwnerWrite('Cloudflare Worker недоступен')
  throw new Error("Нет соединения с Cloudflare Worker. Проверь Builds и /api/health. Пароль ещё не проверялся сервером.");
 }
 const data=await response.json().catch(()=>({error:"Сервер вернул ответ без JSON"}));
 if(!response.ok){
  const conflict=response.status===409&&data.code==='OWNER_EDIT_CONFLICT';
  const outdated=response.status===428&&data.code==='OWNER_CLIENT_UPDATE_REQUIRED';
  const message=conflict?(lang==='en'?
   'This entry was changed in another window. Refresh the page before trying again.':
   'Эту запись уже изменили в другом окне. Обнови страницу и повтори правку.'):
   outdated?(lang==='en'?'This editor is out of date. Refresh the page before saving.':
    'Редактор устарел. Обнови страницу перед сохранением.'):
   (data.error||("Ошибка сервера HTTP "+response.status));
  const error=new Error(message);
  error.httpStatus=response.status;error.reason=data.reason||data.code||null;
  error.sourceDataset=data.sourceDataset||null;
  finishOwnerWrite(error.message)
  if(response.status===401&&token&&token===adminToken&&path.startsWith('/api/admin/')){
   // The editor session is invalid. A player account uses a different token
   // and must never be signed out by this administrator-only failure.
   adminToken='';adminEditing=false;ownerEdits.length=0;
   closeInlineEditor();updateAdminHint();
  }
  throw error;
 }
 finishOwnerWrite()
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
 if(typeof bindStaticUICopyEditors==='function')bindStaticUICopyEditors();
 if(typeof bindAccountCopyEditors==='function'){
  bindAccountCopyEditors(document.getElementById('accountPanel'));
  if(activeTab==='builds')bindAccountCopyEditors(document.getElementById('detailContent'));
 }
 refreshOwnerUI();
}

// Stable UI labels are edited where they appear, never in an admin dialog.
// Existing specialized origin/path editors retain priority over generic labels.
function bindStaticUICopyEditors(){
 const locale=window.PandoraUILocale,canEdit=Boolean(adminEditing&&adminToken);
 const syncPencil=(pencil,key,hint=false)=>{
  if(pencil?.dataset?.uiContentFor!==key)return;
  const english=lang==='en',value=locale.text(key,lang);
  pencil.title=hint?(english?'Edit hint':'Изменить подсказку'):
   (english?'Edit label':'Изменить надпись');
  pencil.setAttribute('aria-label',(hint?
   (english?'Edit hint: ':'Изменить подсказку: '):
   (english?'Edit label: ':'Изменить надпись: '))+value);
 };
 for(const node of document.querySelectorAll('[data-i18n]')){
  const key=node.dataset.i18n,id=locale.fieldKey(key);
  if(!id||node.matches('option')||node.id==='originRaceName'||
   node.id==='pathGrowthTab'||node.id==='pathSkillsTab'||
   node.dataset.originCopyBound==='1'||node.dataset.pathCopyBound==='1')continue;
  const button=node.closest('button,[role="button"]');
  const target=button||node;
  if(target.nextElementSibling?.classList?.contains('ui-content-edit-host')){
   // Locale may change while the active editor host sits between the game
   // button and its pencil. Refresh the live pencil without remounting input.
   syncPencil(target.nextElementSibling.nextElementSibling,key);continue;
  }
  const oldPencil=target.nextElementSibling;
  if(!canEdit){
   node.classList.remove('ui-content-editable');
   if(oldPencil?.dataset?.uiContentFor===key)oldPencil.remove();
   continue;
  }
  node.classList.add('ui-content-editable');
  syncPencil(oldPencil,key);
  const edit=event=>{
   if(!adminEditing||!adminToken)return;
   event.preventDefault();event.stopPropagation();
   if(target.nextElementSibling?.classList?.contains('ui-content-edit-host'))return;
   const editLang=lang,current=locale.text(key,editLang);
   const host=h('span',{class:'ui-content-edit-host',text:current});
   target.after(host);target.hidden=true;
   const pencil=host.nextElementSibling?.dataset?.uiContentFor===key?
    host.nextElementSibling:null;
   if(pencil)pencil.hidden=true;
   editWikiValue(host,current,{
    type:'text',
    onCommit:async next=>{
     if(next.length>90)throw Error((editLang==='en'?'Label is too long':'Надпись слишком длинная'));
     await saveGuidePatch('book.'+id,{[editLang]:next});
    },
    onCommitted:()=>{node.textContent=locale.text(key,lang)},
    onFinished:()=>{
     target.hidden=false;host.remove();
     node.textContent=locale.text(key,lang);
     const mounted=target.nextElementSibling;
     if(pencil)pencil.hidden=false;
     syncPencil(mounted?.dataset?.uiContentFor===key?mounted:pencil,key)
    }
   });
  };
  if(!node.dataset.uiContentBound){
   node.dataset.uiContentBound='1';
   if(!button)node.addEventListener('dblclick',edit);
  }
  // Headings were technically editable by a hidden double-click, but had
  // no discoverable touch control. Buttons keep their existing pencil.
  if((button||node.matches('h2,h3'))&&!oldPencil?.dataset?.uiContentFor){
   const pencil=h('button',{type:'button',
    class:'ui-content-pencil','data-ui-content-for':key,
    text:'✎',title:(lang==='en'?'Edit label':'Изменить надпись'),
    'aria-label':(lang==='en'?'Edit label: ':'Изменить надпись: ')+locale.text(key,lang),
    onclick:edit});
   target.after(pencil);
  }
 }
 // Placeholder, title and aria-label tooltips on actual controls use the same
 // locale key and D1 save path. Do not add decoration to layout containers.
 for(const node of document.querySelectorAll(
  '[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria-label]')){
  if(node.hasAttribute('data-i18n')||
   !node.matches('button,input,select,[role="button"]'))continue;
  const key=node.dataset.i18nTitle||node.dataset.i18nPlaceholder||
   node.dataset.i18nAriaLabel,id=locale.fieldKey(key);
  if(!id)continue;
  const pencil=node.nextElementSibling;
  if(!canEdit){
   if(pencil?.dataset?.uiContentFor===key)pencil.remove();
   continue;
  }
  if(pencil?.dataset?.uiContentFor===key){
   syncPencil(pencil,key,true);continue;
  }
  if(pencil?.classList?.contains('ui-content-edit-host')){
   syncPencil(pencil.nextElementSibling,key,true);continue;
  }
  const edit=event=>{
   event.preventDefault();event.stopPropagation();
   if(node.nextElementSibling?.classList?.contains('ui-content-edit-host'))return;
   const editLang=lang,current=locale.text(key,editLang);
   const host=h('span',{class:'ui-content-edit-host',text:current});
   node.after(host);node.hidden=true;
   const editButton=host.nextElementSibling?.dataset?.uiContentFor===key?
    host.nextElementSibling:null;
   if(editButton)editButton.hidden=true;
   editWikiValue(host,current,{
    type:'text',
    onCommit:async next=>{
     if(next.length>90)throw Error((editLang==='en'?'Label is too long':'Надпись слишком длинная'));
     await saveGuidePatch('book.'+id,{[editLang]:next});
    },
    onFinished:()=>{
     node.hidden=false;host.remove();
     // Update only this control: applying the entire locale would overwrite
     // another still-open inline editor when two captions are edited in turn.
     for(const [attribute,datasetKey] of [
      ['placeholder','i18nPlaceholder'],['title','i18nTitle'],
      ['aria-label','i18nAriaLabel']]){
      if(node.dataset[datasetKey])
       node.setAttribute(attribute,locale.text(node.dataset[datasetKey],lang));
     }
     const mounted=node.nextElementSibling;
     if(editButton)editButton.hidden=false;
     syncPencil(mounted?.dataset?.uiContentFor===key?mounted:editButton,key,true)
    }
   });
  };
  node.after(h('button',{type:'button',class:'ui-content-pencil',
   'data-ui-content-for':key,text:'✎',onclick:edit,
   title:(lang==='en'?'Edit hint':'Изменить подсказку'),
   'aria-label':(lang==='en'?'Edit hint: ':'Изменить подсказку: ')+locale.text(key,lang)}));
 }
}

// Edit only semantically keyed authored labels inside the existing account
// panel or saved-build library. Never edit usernames, saved build names,
// credentials, diagnostic responses or live cloud status.
function bindAccountCopyEditors(panel){
 if(!panel||!window.PandoraUILocale)return;
 const locale=window.PandoraUILocale,enabled=Boolean(adminEditing&&adminToken);
 for(const node of panel.querySelectorAll('[data-owner-copy-key]')){
  const key=node.getAttribute('data-owner-copy-key'),id=locale.fieldKey(key);
  if(!id)continue;
  const isAction=node.matches('button,summary,[role="button"]');
  const isLibrary=panel.id!=='accountPanel';
  node.classList.toggle('ui-content-editable',enabled&&!isAction);
  if(!isAction&&enabled)node.tabIndex=0;
  else if(!isAction&&node.tabIndex===0)node.removeAttribute('tabindex');
  if(!enabled){
   if(node.nextElementSibling?.dataset?.ownerCopyPencil===key)
    node.nextElementSibling.remove();
   continue;
  }
  if(node.nextElementSibling?.classList?.contains('ui-content-edit-host'))continue;
  const edit=event=>{
   if(!adminEditing||!adminToken)return;
   event.preventDefault();event.stopPropagation();
   if(node.nextElementSibling?.classList?.contains('ui-content-edit-host'))return;
   // Snapshot the language at editor open, not at blur time. A language
   // toggle cannot silently write Russian copy into its English D1 field.
   const editLang=lang,before=locale.text(key,editLang);
   const host=h('span',{class:'ui-content-edit-host account-copy-edit-host',text:before});
   node.after(host);node.hidden=true;
   const pencil=host.nextElementSibling?.dataset?.ownerCopyPencil===key?
    host.nextElementSibling:null;
   if(pencil)pencil.hidden=true;
   editWikiValue(host,before,{
    type:'text',
    onCommit:next=>{
     if(next.length>locale.copyLimit(key))
      throw Error(lang==='en'?'Text is too long':'Слишком длинный текст');
     return saveGuidePatch('book.'+id,{[editLang]:next});
    },
    onCommitted:next=>{
     node.textContent=editLang===lang?next:locale.text(key,lang);
     if(panel.id==='studioToast')refreshOpenAuthoredToast();
    },
    onFinished:()=>{node.hidden=false;host.remove();if(pencil)pencil.hidden=false}
   });
  };
  if(!node.dataset.ownerCopyBound){
   node.dataset.ownerCopyBound='1';
   if(!isAction){
    node.addEventListener('dblclick',edit);
    node.addEventListener('keydown',event=>{
     if(event.key==='Enter'||event.key===' '){event.preventDefault();edit(event)}
    });
   }
  }
  // A small pencil keeps descriptions accessible to touch and keyboard;
  // existing account paragraphs remain compact with double-click editing.
  if((isAction||isLibrary)&&!node.nextElementSibling?.dataset?.ownerCopyPencil){
   node.after(h('button',{type:'button',class:'ui-content-pencil account-copy-pencil',
    'data-owner-copy-pencil':key,text:'✎',
    title:lang==='en'?'Edit caption':'Изменить надпись',
    'aria-label':(lang==='en'?'Edit caption: ':'Изменить надпись: ')+locale.text(key,lang),
    onclick:edit}));
  }
 }
}

/* Authenticated on-page editing; all write actions are checked again by the Worker. */
const ownerEdits=[];
let ownerSaveState='ready',ownerSaveError='',ownerWritePendingCount=0,
 ownerDockCollapsed=true;
let activeInlineEditor=null;
let editIsSaving=false;
let wikiLabelPendingWrites=0;
// Serialize writes to the same Wiki or item record before constructing its D1 patch.
// Different records remain independent; failed writes never poison the queue.
const wikiRecordWriteQueue=new Map();
function closeInlineEditor(){
  if(activeInlineEditor){activeInlineEditor.remove();activeInlineEditor=null;}
}
function activeOverride(key){return Object.prototype.hasOwnProperty.call(override,key)?override[key]:null}
// Saving, undoing and importing Wiki labels must update the current controls
// without remounting the Encyclopedia and losing its selection or scroll.
function refreshVisibleWikiLabels(){
 const labels=window.PandoraWikiLabels,filters=window.PandoraWikiSkillFilters?.names;
 if(!labels)return;
 for(const node of document.querySelectorAll('.wiki-category-line [data-wiki-chapter]')){
  const id=node.dataset.wikiChapter,caption=node.querySelector('.wiki-category-text');
  if(caption)caption.textContent=labels.value(override,'chapter',id,lang);
 }
 for(const option of document.querySelectorAll('.wiki-skill-type option')){
  const id=option.value;
  if(!filters||!Object.hasOwn(filters,id))continue;
  const name=labels.value(override,'skillFilter',id,lang);
  const count=option.dataset.labelCount;
  option.textContent=name+(count?' · '+count:'');
 }
 for(const row of document.querySelectorAll('.wiki-skill-edit-list [data-skill-filter-label]')){
  if(row.querySelector('.wiki-skill-edit-host'))continue;
  const id=row.dataset.skillFilterLabel;
  if(!filters||!Object.hasOwn(filters,id))continue;
  const name=labels.value(override,'skillFilter',id,lang);
  const caption=row.querySelector('.wiki-skill-label-caption');
  const edit=row.querySelector('.wiki-skill-label-edit');
  if(caption)caption.textContent=name;
  if(edit)edit.setAttribute('aria-label',(lang==='en'?'Edit: ':'Изменить: ')+name);
 }
}
// Admin toolbar captions use the same bilingual, CAS-protected guideedit.book
// D1 store as other authored labels. Never store diagnostics or credentials.
const ownerDockText=Object.freeze({
 title:['✎ Редактор сайта','✎ Site editor'],
 online:['Редактирование включено','Editing enabled'],
 openWiki:['Открыть энциклопедию','Open encyclopedia'],
 undo:['↶ Отменить','↶ Undo'],
 history:['Все правки','All edits'],
 catalog:['Игровой каталог','Game catalog'],
 translations:['EN-переводы','EN translations'],
 testD1:['Проверить сохранение','Test saving'],
 githubExport:['Копия в GitHub','GitHub copy'],
 finish:['Завершить','Finish'],
 extra:['Дополнительно','Additional tools'],
 guide:['Как редактировать и когда нажимать кнопки','How editing works'],
 step1:['В энциклопедии дважды нажми на подсвеченное значение или используй кнопку + для добавления.',
  'In the encyclopedia, double-click a highlighted value or use + to add a new entry.'],
 step2:['Измени текст или связь. Нажми Enter либо уйди с поля: запись автоматически сохраняется в Cloudflare D1.',
  'Edit the text or link, then press Enter or leave the field: Cloudflare D1 saves it automatically.'],
 step3:['Убедись, что показано «Сохранено в Cloudflare D1», затем нажми «Завершить». Отдельной кнопки сохранения нет.',
  'Wait for “Saved to Cloudflare D1”, then select Finish. There is no separate Save button.'],
 historyHelp:[' — посмотреть сохранённые изменения и вернуть исходное.',
  ' — review saved changes or restore the original.'],
 catalogHelp:[' — отдельная сверка новых данных с сервером игры; для ручных правок не нужен.',
  ' — compare the game server catalog; not needed for manual text edits.'],
 githubHelp:[' — необязательная публичная копия. Редактор уже сохраняет изменения в D1; для работы сайта экспорт не нужен.',
  ' — optional public copy. Edits already save to D1; GitHub export is not needed for the live site.'],
 d1Help:[' — безопасная запись и удаление случайных временных тестовых записей; пользовательские данные не затрагиваются.',
  ' — safely create and delete temporary test records without changing user data.'],
 finishHelp:[' — только скрыть инструменты редактирования, не удалить изменения.',
  ' — hide editing controls without removing saved changes.'],
 collapse:['◀ Скрыть','◀ Hide'],
 expand:['✎ Редактор','✎ Editor']
});
function ownerDockCopy(key){
 const pair=ownerDockText[key];
 return pair?ownerCopy('owner-dock',key,pair[0],pair[1]):key;
}
function decorateOwnerDockActions(actions){
 const refs=[
  ['.owner-dock-primary','openWiki'],
  ['[data-owner-undo]','undo'],
  ['.owner-dock-history','history'],
  ['.owner-dock-catalog','catalog'],
  ['.owner-en-sync','translations'],
  ['.owner-dock-d1-check','testD1'],
  ['.owner-dock-export','githubExport'],
  ['.owner-dock-finish','finish']
 ];
 for(const [selector,key] of refs){
  const button=actions.querySelector(selector);
  if(!button)continue;
  const slot=h('span',{class:'owner-dock-action-slot','data-owner-dock-key':key});
  const pencil=h('button',{type:'button',class:'owner-dock-action-pencil',
   text:'✎','aria-label':(lang==='en'?'Edit label: ':'Изменить надпись: ')+ownerDockCopy(key)});
  const host=h('span',{class:'owner-dock-action-edit-host',hidden:true});
  button.before(slot);slot.append(button,pencil,host);
  pencil.onclick=event=>{
   event.preventDefault();event.stopPropagation();
   if(!adminEditing||!adminToken||!host.hidden)return;
   if(editIsSaving||wikiLabelPendingWrites>0||ownerSaveState==='saving'){
    showStudioToast(lang==='en'?'Finish the current save first.':
     'Сначала заверши текущее сохранение.','warning');return;
   }
   const editLang=lang,before=ownerDockCopy(key);
   button.hidden=true;pencil.hidden=true;host.hidden=false;
   window.PandoraGuideTooltip?.dismiss();
   editWikiValue(host,before,{
    type:'text',
    onCommit:next=>{
     if(next.length>90)throw Error(editLang==='en'?'Label is too long':'Надпись слишком длинная');
     return saveGuidePatch('book.'+ownerCopyKey('owner-dock',key),{[editLang]:next});
    },
    onCommitted:()=>{button.textContent=ownerDockCopy(key)},
    onFinished:()=>{
     host.hidden=true;host.replaceChildren();
     button.hidden=false;pencil.hidden=false;
     button.textContent=key==='translations'?
      ownerDockCopy(key)+' · '+(window.PandoraOwnerBilingual?.pending(override)||[])
       .reduce((sum,item)=>sum+item.fields.length,0):ownerDockCopy(key);
    }
   });
  };
 }
}
function refreshOwnerUI(){
 const dock=document.getElementById('ownerDock');
 if(!adminEditing||!adminToken){closeInlineEditor();dock?.remove();return}
 const count=Object.keys(override).length;
 const saveText=(ownerSaveState==='saving'||wikiLabelPendingWrites>0||wikiRecordWriteQueue.size>0)?
  (lang==='en'?'Saving to Cloudflare D1…':'Сохраняю в Cloudflare D1…'):
  ownerSaveState==='error'?(lang==='en'?'Not saved: ':'Не сохранено: ')+
   (ownerSaveError||(lang==='en'?'server error':'ошибка сервера')):
  ownerSaveState==='saved'?(lang==='en'?'✓ Saved to Cloudflare D1':'✓ Сохранено в Cloudflare D1'):
  (lang==='en'?'✓ Cloudflare D1 connected · changes save automatically':
   '✓ Подключено к Cloudflare D1 · сохранение автоматическое');
 const update=root=>{
  const counter=root.querySelector('[data-owner-count]');
  if(counter)counter.textContent=lang==='en'?count+' D1 edits':
   count+' '+(count===1?'запись':'записей')+' в D1';
  const recent=root.querySelector('[data-owner-recent]');
  if(recent)recent.textContent=(lang==='en'?'This session: ':'За этот сеанс: ')+ownerEdits.length;
  const translations=root.querySelector('[data-owner-en-sync]');
  if(translations){
   const changes=window.PandoraOwnerBilingual?.pending(override)||[];
   const count=changes.reduce((sum,item)=>sum+item.fields.length,0);
   translations.hidden=count===0;
   translations.disabled=!count||editIsSaving||wikiLabelPendingWrites>0||ownerSaveState==='saving';
   translations.textContent=ownerDockCopy('translations')+' · '+count;
  }
  for(const slot of root.querySelectorAll('.owner-dock-action-slot[data-owner-dock-key]')){
   const key=slot.dataset.ownerDockKey,button=slot.querySelector('button:not(.owner-dock-action-pencil)');
   if(button&&key!=='translations')button.textContent=ownerDockCopy(key);
   const pencil=slot.querySelector('.owner-dock-action-pencil');
   if(pencil)pencil.setAttribute('aria-label',
    (lang==='en'?'Edit label: ':'Изменить надпись: ')+ownerDockCopy(key));
  }
  const catalogSlot=root.querySelector('.owner-dock-catalog')?.closest('.owner-dock-action-slot');
  if(catalogSlot)catalogSlot.classList.toggle('owner-dock-action-wide',Boolean(translations?.hidden));
  const title=root.querySelector('.owner-dock-title');
  if(title&&!title.querySelector('.wiki-inline-input'))title.textContent=ownerDockCopy('title');
  const online=root.querySelector('.owner-dock-online');
  if(online)online.textContent=ownerDockCopy('online');
  const extra=root.querySelector('.owner-dock-secondary-label');
  if(extra)extra.textContent=ownerDockCopy('extra');
  for(const node of root.querySelectorAll('[data-owner-dock-static]')){
   if(!node.querySelector('.wiki-inline-input'))
    node.textContent=ownerDockCopy(node.dataset.ownerDockStatic);
  }
  const guide=root.querySelector('.owner-workflow-guide>summary');
  if(guide)guide.textContent=ownerDockCopy('guide');
  const state=root.querySelector('[data-owner-save-state]');
  if(state){state.textContent=saveText;state.dataset.state=ownerSaveState}
  root.querySelector('[data-owner-undo]').disabled=!ownerEdits.length||editIsSaving||
   wikiLabelPendingWrites>0||ownerSaveState==='saving';
  root.classList.toggle('owner-dock-collapsed',ownerDockCollapsed);
  root.dataset.saveState=ownerSaveState;
  const panel=root.querySelector('.owner-dock-panel');
  if(panel){
   panel.inert=ownerDockCollapsed;
   panel.setAttribute('aria-hidden',String(ownerDockCollapsed));
  }
  const toggle=root.querySelector('[data-owner-collapse]');
  if(toggle){
   toggle.textContent=ownerDockCopy(ownerDockCollapsed?'expand':'collapse');
   toggle.setAttribute('aria-label',ownerDockCollapsed?
    (lang==='en'?'Open site editor drawer':'Открыть боковую панель редактора сайта'):
    (lang==='en'?'Hide site editor drawer':'Скрыть боковую панель редактора сайта'));
   toggle.setAttribute('aria-expanded',String(!ownerDockCollapsed));
  }
 };
 if(dock){update(dock);return}
 const root=h('aside',{id:'ownerDock',class:'owner-dock',role:'region',
  'aria-label':'Редактор сайта · изменения сохраняются автоматически'});
 const head=h('div',{class:'owner-dock-head'},[
  h('strong',{class:'owner-dock-title',text:'✎ Редактор сайта'}),
  h('small',{class:'owner-dock-online',text:'Редактирование включено'})
 ]);
 const status=h('div',{class:'owner-dock-save-state','data-owner-save-state':'',
  role:'status','aria-live':'polite'});
 const counters=h('div',{class:'owner-dock-counters'},[
  h('span',{'data-owner-count':'',class:'owner-dock-count'}),
  h('span',{'data-owner-recent':'',class:'owner-dock-count'})
 ]);
 const guide=h('details',{class:'owner-workflow-guide'},[
  h('summary',{text:'Как редактировать и когда нажимать кнопки'}),
  h('ol',{class:'owner-workflow-steps'},[
   h('li',{},[h('span',{'data-owner-dock-static':'step1',text:'В энциклопедии дважды нажми на подсвеченное значение или используй кнопку + для добавления.'})]),
   h('li',{},[h('span',{'data-owner-dock-static':'step2',text:'Измени текст или связь. Нажми Enter либо уйди с поля: запись автоматически сохраняется в Cloudflare D1.'})]),
   h('li',{},[h('span',{'data-owner-dock-static':'step3',text:'Убедись, что показано «Сохранено в Cloudflare D1», затем нажми «Завершить». Отдельной кнопки сохранения нет.'})])
  ]),
  h('div',{class:'owner-workflow-glossary'},[
   h('p',{},[h('strong',{'data-owner-dock-static':'history',text:'Все правки'}),h('span',{'data-owner-dock-static':'historyHelp',text:' — посмотреть сохранённые изменения и вернуть исходное.'})]),
   h('p',{},[h('strong',{'data-owner-dock-static':'catalog',text:'Игровой каталог'}),h('span',{'data-owner-dock-static':'catalogHelp',text:' — отдельная сверка новых данных с сервером игры; для ручных правок не нужен.'})]),
   h('p',{},[h('strong',{'data-owner-dock-static':'githubExport',text:'Экспорт в GitHub'}),h('span',{'data-owner-dock-static':'githubHelp',text:' — необязательный экспорт изменений в GitHub для проверки и объединения. Данные в D1 уже сохранены.'})]),
   h('p',{},[h('strong',{'data-owner-dock-static':'testD1',text:'Проверить сохранение'}),h('span',{'data-owner-dock-static':'d1Help',text:' — безопасная запись и удаление случайных временных тестовых записей; пользовательские данные не затрагиваются.'})]),
   h('p',{},[h('strong',{'data-owner-dock-static':'finish',text:'Завершить'}),h('span',{'data-owner-dock-static':'finishHelp',text:' — только скрыть инструменты редактирования, не удалить изменения.'})])
  ])
 ]);
 const actions=h('div',{class:'owner-dock-actions'},[
  h('button',{type:'button',class:'owner-dock-primary',
   text:'Открыть энциклопедию',onclick:()=>changeTab('wiki')}),
  h('button',{type:'button',text:'↶ Отменить','data-owner-undo':'',onclick:undoOwnerEdit,
   title:'Отменить последнее действие в этом сеансе в Cloudflare D1'}),
  h('button',{type:'button',class:'owner-dock-history',text:'Все правки',onclick:showOverrideManager,
   title:'Просмотр всех сохранённых переопределений в D1'}),
  h('button',{type:'button',class:'owner-dock-catalog',text:'Игровой каталог',onclick:showCatalogImport,
   title:'Отдельное обновление снимка игрового каталога'}),
  h('button',{type:'button',class:'owner-en-sync','data-owner-en-sync':'',
   text:'EN-переводы',onclick:showOwnerEnglishReview,
   title:'Проверить и записать готовые английские переводы русских правок'}),
  h('span',{class:'owner-dock-secondary-label',text:'Дополнительно'}),
  h('button',{type:'button',class:'owner-dock-d1-check',
   text:'Проверить сохранение',
   title:'Безопасно записать, прочитать и удалить временные тестовые записи в D1',
   onclick:async function(){
    if(editIsSaving||wikiLabelPendingWrites>0||ownerSaveState==='saving')return;
    this.disabled=true;
    try{
     const result=await apiRequest('/api/admin/catalog/test-write',{});
     if(!result?.ok||!result.readback||!result.cleaned||
      !result.overrideReadback||!result.overrideCleaned||
      !result.activeCatalogUnchanged)
      throw Error('Проверка не подтвердила чтение, удаление или сохранность каталога');
     showStudioToast('D1: временная запись и чтение проверены, тестовые данные удалены.','success');
    }catch(error){
     showStudioToast('Не удалось проверить запись в D1: '+error.message,'warning');
    }finally{if(this.isConnected)this.disabled=false}
   }}),
  h('button',{type:'button',class:'owner-dock-export',text:'Экспорт в GitHub',onclick:showOwnerGitHubExport,
   title:'Необязательный экспорт уже сохранённых изменений в GitHub'}),
  h('button',{type:'button',class:'owner-dock-finish',text:'Завершить',
   onclick:()=>{
    if(ownerSaveState==='saving'||editIsSaving||wikiLabelPendingWrites>0){
     showStudioToast('Дождись окончания сохранения в Cloudflare D1','warning');return}
    if(ownerSaveState==='error'){
     showStudioToast('Есть ошибка сохранения. Проверь поле и повтори изменение.','warning');return}
    adminEditing=false;closeInlineEditor();render();updateAdminHint()
   }})
 ]);
 decorateOwnerDockActions(actions);
 // Help copy can also be edited where it appears. The pencil is a
 // separate control, so clicking help never changes any D1 data implicitly.
 for(const node of guide.querySelectorAll('[data-owner-dock-static]')){
  const key=node.dataset.ownerDockStatic;
  if(!['step1','step2','step3','historyHelp','catalogHelp','githubHelp',
   'd1Help','finishHelp'].includes(key))continue;
  const pair=ownerDockText[key];
  ownerCopyLabel(node,'owner-dock',key,pair[0],pair[1]);
  node.after(h('button',{type:'button',class:'owner-workflow-copy-pencil',
   text:'✎','aria-label':(lang==='en'?'Edit help: ':'Изменить пояснение: ')+ownerDockCopy(key),
   onclick:event=>{
    event.preventDefault();event.stopPropagation();
    node.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   }}));
 }
 const body=h('div',{class:'owner-dock-body'},[status,counters,guide,actions]);
 const panel=h('div',{id:'ownerDockPanel',class:'owner-dock-panel'},[head,body]);
 const toggle=h('button',{type:'button',class:'owner-dock-handle','data-owner-collapse':'',
  'aria-controls':'ownerDockPanel','aria-expanded':'false',
  'aria-label':'Открыть боковую панель редактора сайта',
  onclick:()=>{
   ownerDockCollapsed=!ownerDockCollapsed;
   window.PandoraGuideTooltip?.dismiss();
   refreshOwnerUI();
  }});
 root.append(panel,toggle);
 // An edge drawer must not alter the left character column or page height.
 document.body.append(root);
 const hints=[
  ['.owner-dock-primary','Открыть энциклопедию для редактирования данных прямо в карточках.'],
  ['[data-owner-undo]','Отменяет последнюю ручную правку этого сеанса в Cloudflare D1.'],
  ['.owner-dock-history','Посмотреть сохранённые ручные правки и вернуть исходные значения.'],
  ['.owner-dock-catalog','Сравнить опубликованный каталог с игровым источником; ничего не применяется автоматически.'],
  ['.owner-dock-d1-check','Проверить запись, чтение и удаление временных данных. Билды и игровой каталог не изменятся.'],
  ['.owner-dock-export','Предложить уже сохранённые правки для проверки в GitHub.'],
  ['[data-owner-en-sync]','Предварительно просмотреть английские переводы только уже существующих русских правок. Ничего не записывается до подтверждения.'],
  ['.owner-dock-finish','Выключить режим редактирования. Уже сохранённые данные D1 останутся на месте.']
 ];
 for(const [selector,message] of hints){
  const button=panel.querySelector(selector);
  if(!button)continue;
  button.removeAttribute('title');
  window.PandoraGuideTooltip?.attach(button,message,{hoverDelay:1000});
 }
 root.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||ownerDockCollapsed)return;
  ownerDockCollapsed=true;
  window.PandoraGuideTooltip?.dismiss();
  refreshOwnerUI();
  toggle.focus({preventScroll:true});
  event.stopPropagation();
 });
 update(root);
}
// Update only author-edited interface copy. Redrawing the whole game
// catalog on Undo would discard active build names and confirmation states.
function refreshVisibleUICopy(recordKey){
 const locale=window.PandoraUILocale;
 locale.setOverrides(override);
 locale.apply(lang);
 const isLibrary=recordKey.startsWith('guideedit.book.ui.label.library-');
 const isStatus=recordKey.startsWith('guideedit.book.ui.label.status-');
 const isBook=recordKey.startsWith('guideedit.book.ui.label.book-');
 if(!isLibrary&&!isStatus&&!isBook)return;
 const id=recordKey.slice('guideedit.book.'.length);
 const selector=isLibrary?
  '#detailContent [data-owner-copy-key],#modalRoot [data-owner-copy-key]':
  isBook?'#stageAttributes [data-owner-copy-key]':
  '#studioToast [data-owner-copy-key]';
 for(const node of document.querySelectorAll(selector)){
  const key=node.dataset.ownerCopyKey;
  if(locale.fieldKey(key)!==id||node.hidden||
   node.nextElementSibling?.classList?.contains('ui-content-edit-host'))continue;
  const value=locale.text(key,lang);
  node.textContent=value;
  const pencil=node.nextElementSibling;
  if(pencil?.dataset?.ownerCopyPencil===key)
   pencil.setAttribute('aria-label',(lang==='en'?'Edit caption: ':'Изменить надпись: ')+value);
 }
 // The same routine handles save, Undo and owner reset. Do not replace
 // the card: update the live guide dataset from the committed RU/EN value.
 if(isLibrary){
  for(const button of document.querySelectorAll('#detailContent [data-build-action-hint]')){
   if(locale.fieldKey(button.dataset.buildActionHint)===id)
    button.dataset.guideHint=locale.text(button.dataset.buildActionHint,lang);
  }
  // Editable labels are sibling spans, never an owner pencil nested inside a
  // real button. Preserve each button and the current hero/draft on CAS/Undo.
  for(const caption of document.querySelectorAll('#detailContent [data-build-action-label]')){
   const key=caption.dataset.buildActionLabel;
   if(locale.fieldKey(key)===id)caption.textContent=locale.text(key,lang);
  }
  // Owner copy changes must not replace the live search input: preserve
  // its query, focus, filtering, viewport scroll and the active character.
  const search=document.querySelector('#detailContent [data-build-library-search]');
  if(search){
   if(id===locale.fieldKey('librarySearchInputLabel'))
    search.setAttribute('aria-label',locale.text('librarySearchInputLabel',lang));
   if(id===locale.fieldKey('librarySearchPlaceholder'))
    search.placeholder=locale.text('librarySearchPlaceholder',lang);
  }
  for(const state of document.querySelectorAll('#detailContent [data-build-library-state-copy]')){
   const key=state.dataset.buildLibraryStateCopy;
   if(locale.fieldKey(key)===id)state.textContent=locale.text(key,lang);
  }
 }
}
// An Origin copy Undo refreshes visible captions without remounting the build.
function refreshVisibleOriginCopy(recordKey){
 const wanted=String(recordKey).replace(/^guideedit\.book\.origin\./,'');
 for(const node of document.querySelectorAll('[data-origin-copy-key]')){
  const key=node.dataset.originCopyKey;
  if(originGuideKey(key)!==wanted||node.dataset.originEditing==='1'||
   node.querySelector?.('.wiki-inline-input,[data-owner-editor]'))continue;
  node.textContent=originCopy(key,node.dataset.originCopyRu,node.dataset.originCopyEn);
 }
 for(const pencil of document.querySelectorAll('[data-origin-edit-for]')){
  const key=pencil.dataset.originEditFor;
  if(originGuideKey(key)!==wanted)continue;
  const caption=[...document.querySelectorAll('[data-origin-copy-key]')]
   .find(node=>node.dataset.originCopyKey===key);
  if(caption)pencil.setAttribute('aria-label',
   (lang==='en'?'Edit caption: ':'Изменить надпись: ')+caption.textContent);
 }
}
// Copy-only Undo/saves must not unmount the Soul search or Path card.
function refreshVisibleOwnerCopy(recordKey){
 const key=String(recordKey).replace(/^guideedit\.book\./,'');
 if(key.startsWith('owner-dock.')){refreshOwnerUI();return}
  if(!/^(equipment|path|catalog-sync|honor-view|owner-history|owner-dialog|wiki-ui|skill-ui|stats-ui)\./.test(key))return;
 for(const node of document.querySelectorAll('[data-owner-copy-section][data-owner-copy-id]')){
  const {ownerCopySection:section,ownerCopyId:id,ownerCopyRu:ru,ownerCopyEn:en}=node.dataset;
  if(ownerCopyKey(section,id)!==key||node.querySelector('.wiki-inline-input'))continue;
  const value=ownerCopy(section,id,ru,en);
  node.textContent=value;
  // Reset/Undo of an editorial hover hint must update the already-mounted
  // tooltip target rather than leaving the previous text in its dataset.
  if(section==='path'){
   // Path captions are plain D1 copy: Undo updates the current field in place.
   const tabPencil=node.closest('.path-tab-owner-wrap')?.querySelector('.path-tab-pencil');
   const inlinePencil=node.nextElementSibling?.dataset?.pathCopyFor===id?
    node.nextElementSibling:null;
   const helpPencil=node.parentElement?.classList?.contains('path-owner-edit-row')?
    node.parentElement.querySelector('.path-owner-pencil'):null;
   (tabPencil||inlinePencil||helpPencil)?.setAttribute('aria-label',
    (lang==='en'?'Edit caption: ':'Изменить надпись: ')+value);
  }
  if(section==='owner-dialog'){
   const action=node.closest('.owner-dialog-action-editor')?.querySelector('.owner-dialog-action');
   if(action)action.textContent=value;
  }
  if(section==='honor-view'){
   const filterCaption=node.parentElement?.querySelector('.wiki-honor-filter-caption');
   if(filterCaption)filterCaption.textContent=value;
   const pencil=node.parentElement?.querySelector('.wiki-honor-copy-pencil');
   pencil?.setAttribute('aria-label',(lang==='en'?'Edit caption: ':'Изменить подпись: ')+value);
  }
  if(section==='catalog-sync'&&id.startsWith('hint'))
   for(const target of document.querySelectorAll('[data-guide-owner-key]'))
    if(target.dataset.guideOwnerKey===id)target.dataset.guideHint=value;
 }
 // Attribute/text copy changes patch the existing mounted control only:
 // never replace an active search field, picker, selection or character.
 for(const node of document.querySelectorAll('[data-owner-interface-bindings]')){
  if(node.querySelector?.('.wiki-inline-input'))continue;
  let bindings={};
  try{bindings=JSON.parse(node.dataset.ownerInterfaceBindings||'{}')}catch{}
  for(const [attr,field] of Object.entries(bindings)){
   const {section,id,ru,en,suffix}={
    section:field.section,id:field.key,ru:field.ru,en:field.en,suffix:field.suffix};
   if(ownerCopyKey(section,id)!==key)continue;
   const value=ownerCopy(section,id,ru,en)+(suffix||'');
   if(attr==='text')node.textContent=value;
   else if(['placeholder','aria-label','title'].includes(attr))
    node.setAttribute(attr,value);
  }
 }
 // The editable word "empty" is separate from dynamic Soul slot IDs.
 // Reconstruct only that aria suffix after a successful owner CAS or Undo.
 if(key==='equipment.picker-empty-soul'){
  for(const button of document.querySelectorAll('#stagePicker [data-soul-empty-slot]')){
   const number=button.dataset.soulEmptySlot;
   const suffix=' '+number+': '+ownerCopy('equipment','pickerEmptySoul','пусто','empty');
   button.dataset.ownerInterfaceSuffix=suffix;
   let bindings={};
   try{bindings=JSON.parse(button.dataset.ownerInterfaceBindings||'{}')}catch{}
   if(bindings['aria-label']){
    bindings['aria-label'].suffix=suffix;
    button.dataset.ownerInterfaceBindings=JSON.stringify(bindings);
   }
   button.setAttribute('aria-label',
    ownerCopy('equipment','pickerSoulSlotAria','Слот души','Soul slot')+suffix);
  }
 }
 if(key==='equipment.soul-search'){
  // A D1 save or Undo must update the live placeholder, not reset the query.
  const placeholder=ownerCopy('equipment','soulSearch',
   'Поиск совместимой души','Find a compatible Soul');
  for(const input of document.querySelectorAll(
   '#stagePicker [data-equipment-copy-placeholder="soulSearch"]'))
   input.placeholder=placeholder;
 }
 if(key==='equipment.socket-overflow-hint'){
  const hint=ownerCopy('equipment','socketOverflowHint',
   'Сначала извлеките души из лишних слотов',
   'Remove Souls from extra sockets first');
  for(const button of document.querySelectorAll('#stagePicker [data-socket-capacity]'))
   if(button.disabled)button.title=hint;
 }
}
function refreshVisibleProfileCopy(){
 for(const node of document.querySelectorAll('#detailContent [data-profile-copy-key]')){
  if(node.querySelector('.wiki-inline-input'))continue;
  const key=node.dataset.profileCopyKey;
  const value=ownerCopy('profile',key,node.dataset.profileCopyRu,node.dataset.profileCopyEn);
  node.textContent=value;
  const pencil=node.nextElementSibling;
  if(pencil?.dataset.profileCopyPencil===key)
   pencil.setAttribute('aria-label',(lang==='en'?'Rename: ':'Переименовать: ')+value);
  const id=key.startsWith('field-')?'ps-profile-field-'+key.slice(6):
   key==='bio-label'||key==='bio-placeholder'?'ps-profile-description':null;
  const input=id?document.getElementById(id):null;
  if(input){
   if(key==='bio-placeholder')input.placeholder=value;
   else{input.setAttribute('aria-label',value);
    if(key.startsWith('field-'))input.placeholder=value;}
  }
 }
}
async function undoOwnerEdit(){
  if(!adminToken||!ownerEdits.length||editIsSaving||wikiLabelPendingWrites>0||wikiRecordWriteQueue.size>0)return;
  const last=ownerEdits[ownerEdits.length-1];
  editIsSaving=true;refreshOwnerUI();
  try{
    if(last.before===null){await apiRequest('/api/admin/reset',{key:last.key});delete override[last.key];}
    else{await apiRequest('/api/admin/override',{key:last.key,value:last.before});override[last.key]=last.before;}
    ownerEdits.pop();closeInlineEditor();
    if(last.key==='guideedit.wiki.labels')refreshVisibleWikiLabels();
    if(last.key.startsWith('guideedit.book.origin.')){
      refreshVisibleOriginCopy(last.key);saveView();
     }else if(last.key.startsWith('guideedit.book.profile.')){
     refreshVisibleProfileCopy();
     saveView();
    }else if(last.key.startsWith('guideedit.book.ui.label.')){
     refreshVisibleUICopy(last.key);
     if(last.key.startsWith('guideedit.book.ui.label.account-'))
      window.PandoraAccountUI?.refresh?.();
     // UI copy does not affect catalogs or builds; preserve active inputs.
     saveView();
    }else if(/^guideedit\.book\.(equipment|path|catalog-sync|honor-view|owner-dock|owner-history|owner-dialog|wiki-ui|skill-ui|stats-ui)\./.test(last.key)){
     refreshVisibleOwnerCopy(last.key);saveView();
    }else await refreshOwnerCatalog();
  }catch(e){alert('Не удалось отменить изменение: '+e.message)}
  finally{editIsSaving=false;refreshOwnerUI()}
}
function showOverrideManager(){
 if(!adminToken)return;
 const tr=(ru,en)=>lang==='en'?en:ru;
 const body=h('div',{class:'owner-manager'});
 // Editorial help belongs to the admin, never to a game record or a player.
 // Reuse the same CAS-backed inline text field as the other site sections.
 const authoredHistory=(key,ru,en)=>{
  const node=h('p',{class:'muted owner-history-caption',
   text:ownerCopy('owner-history',key,ru,en)});
  ownerCopyLabel(node,'owner-history',key,ru,en);
  if(!adminEditing||!adminToken)return node;
  const pencil=h('button',{type:'button',class:'owner-history-pencil',
   text:'✎',title:tr('Изменить пояснение','Edit explanation'),
   'aria-label':tr('Изменить пояснение','Edit explanation')+': '+node.textContent,
   onclick:event=>{
    event.preventDefault();event.stopPropagation();
    node.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
   }});
  return h('div',{class:'owner-history-edit-row'},[node,pencil]);
 };
 body.append(authoredHistory('intro',
  'Ручные изменения, сохранённые в Cloudflare D1. Для каждой записи показаны раздел, поле, исходное значение игрового каталога и текущая правка. Неизвестные исходные значения отмечены отдельно.',
  'Manual changes saved in Cloudflare D1. Every entry shows its section, field, original game-catalog value, and your edit. Unknown original values are marked.'));
 const search=ownerPlainTextField({placeholder:tr('Найти предмет, NPC или изменённое поле…','Find an item, NPC or edited field…'),
  class:'owner-manager-search wiki-owner-search','aria-label':tr('Поиск среди ручных изменений','Search manual edits')});
 const count=h('p',{class:'owner-manager-summary',role:'status'});
 const list=h('div',{class:'owner-manager-list'});
 const draw=()=>{
  list.replaceChildren();
  const q=String(search.value||'').trim().toLocaleLowerCase('ru');
  const entries=Object.entries(override).map(([key,value])=>
   window.PandoraOwnerChangeReview.inspect(key,value,{
    base:wikiBaseData,items:wikiBaseData?.items||catalogSource?.items,
    classes:catalog?.classes,lang,englishBranches:officialEnglish?.branches||{}}))
   .filter(record=>!q||searchWords([record.key,record.title,...record.changes.flatMap(x=>
    [x.field,x.before,x.after])].join(' '),q))
   .sort((a,b)=>a.section.localeCompare(b.section,lang)||a.title.localeCompare(b.title,lang));
  count.textContent=tr('Найдено ','Found ')+entries.length+tr(' из ',' of ')+Object.keys(override).length+tr(' ручных изменений',' manual edits');
  if(!entries.length)list.append(authoredHistory('empty',
   'Не найдено правок по выбранному запросу.','No edits match your search.'));
  for(const record of entries){
   const row=h('section',{class:'owner-manager-row owner-review-row'});
   const head=h('div',{class:'owner-review-heading'},[
    h('strong',{text:record.title}),
    h('small',{text:tr('Изменено полей: ','Changed fields: ')+record.changes.length})
   ]);
   const edits=h('div',{class:'owner-review-changes'});
   for(const entry of record.changes){
    const change=h('div',{class:'owner-review-change'});
    change.append(h('strong',{class:'owner-review-field',text:entry.field}),
     h('div',{class:'owner-review-comparison'},[
      h('div',{class:'owner-review-before'},[
       h('small',{text:tr('Было','Before')}),h('p',{text:entry.before})]),
      h('div',{class:'owner-review-after'},[
       h('small',{text:tr('Стало','After')}),h('p',{text:entry.after})])
     ]));
    edits.append(change);
   }
   const actions=h('div',{class:'owner-review-actions'});
   if(record.target&&record.target.id&&wikiDataOrCatalogHasRecord(record.target)){
    actions.append(h('button',{type:'button',text:tr('Открыть в энциклопедии','Open in Encyclopedia'),
     onclick:()=>{
      $('modalRoot').hidden=true;$('modalRoot').replaceChildren();
      openWiki(record.target.type,record.target.id);
      showWorkbench();
     }}));
   }
   actions.append(h('button',{type:'button',class:'owner-review-reset',
    text:tr('Вернуть оригинал','Restore original'),onclick:async()=>{
     if(!confirm(tr('Вернуть исходные данные для «','Restore original data for “')+record.title+tr('»?','”?')))return;
     const previous=activeOverride(record.key);
     try{
      await apiRequest('/api/admin/reset',{key:record.key});
      ownerEdits.push({key:record.key,before:previous,after:null});
      delete override[record.key];draw();
       if(record.key.startsWith('guideedit.book.origin.')){
        refreshVisibleOriginCopy(record.key);saveView();
       }else if(record.key.startsWith('guideedit.book.profile.')){
        refreshVisibleProfileCopy();saveView();
       }else if(record.key.startsWith('guideedit.book.ui.label.')){
        refreshVisibleUICopy(record.key);
        if(record.key.startsWith('guideedit.book.ui.label.account-'))
         window.PandoraAccountUI?.refresh?.();
        saveView();
       }else if(record.key.startsWith('guideedit.book.owner-dock.')||
        record.key.startsWith('guideedit.book.owner-history.')||
        record.key.startsWith('guideedit.book.owner-dialog.')||
        /^guideedit\.book\.(equipment|path|catalog-sync|honor-view)\./.test(record.key)){
        // Reset author copy only. Preserve the live picker and build draft.
        refreshVisibleOwnerCopy(record.key);saveView();
       }else void refreshOwnerCatalog();
       refreshOwnerUI();
     }catch(error){showStudioToast('Не удалось отменить правку: '+error.message,'warning')}
    }}));
   row.append(head,edits,actions);list.append(row);
  }
 };
 function wikiDataOrCatalogHasRecord(target){
  if(target.type==='item'||target.type==='chest')
   return Boolean(wikiBaseData?.items?.[target.id]||catalogSource?.items?.[target.id]);
  if(target.type==='monster')return Boolean(wikiIndex?.records('monster')?.[target.id]||
   wikiBaseData?.monsters?.[target.id]);
  if(target.type==='skill')return Boolean(wikiBaseData?.skills?.[target.id]);
  if(target.type==='npc')return Boolean(wikiBaseData?.trades?.npcs?.[target.id]||
   window.PandoraAstirLocations?.npcRecords?.()[target.id]||
   wikiData?.townNpcs?.[target.id]||wikiIndex?.records('npc')?.[target.id]);
  if(target.type==='soul')return Boolean(wikiBaseData?.souls?.[target.id]);
  if(target.type==='map')return Boolean(wikiIndex?.records('map')?.[target.id]||
   wikiBaseData?.maps?.[target.id]||
   wikiBaseData?.trades?.mapNames?.[target.id]||
   window.PandoraAstirLocations?.district(target.id));
  if(target.type==='instance')return (wikiBaseData?.instances||[]).some(x=>
   String(x.id)===String(target.id));
  return false;
 }
 search.addEventListener('input',draw);
 body.append(search,count,list);
 draw();
 modal(tr('Все ручные правки','All manual edits'),body);
 if(!wikiBaseData)void loadWiki().then(()=>{if(body.isConnected)draw()})
  .catch(()=>{if(body.isConnected)showStudioToast(tr('Исходный каталог временно недоступен','Game catalog temporarily unavailable'),'warning')});
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
   slotEdit?h('input',{type:'number',min:'0',max:'32',step:'1',value:original,'aria-label':'Число слотов душ'}):
    ownerPlainTextField({multiline:true,rows:key.startsWith('skilldesc.')?5:3,
   class:'owner-plain-multiline','aria-label':'Редактируемый текст'});
  if(!visual)input.value=original;
  const feedback=h('div',{class:'owner-github-feedback',role:'status','aria-live':'polite'});
  root.append(bar);
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
function editWikiValue(node,initial,{type='text',options=[],min=0,max=100000,integer=false,onCommit,onCommitted,onFinished}={}){
 if(!adminEditing||!adminToken||
  node.querySelector('input,select,textarea,[data-owner-text-field]'))return;
 const before=String(initial??''),visibleNodes=[...node.childNodes];
 const ownerSay=(ru,en)=>lang==='en'?en:ru;
 let finished=false,saving=false;
 const inlineError=message=>{
  let feedback=node.querySelector('.ui-content-inline-error');
  if(!feedback){
   feedback=h('small',{class:'ui-content-inline-error',role:'alert'});
   node.append(feedback);
  }
  feedback.textContent=message;
 };
 const control=type==='select'?h('select',{class:'wiki-inline-select','aria-label':ownerSay('Выбери значение','Choose a value')}):
  type==='textarea'||type==='text'?ownerPlainTextField({
   multiline:type==='textarea',rows:6,
   class:'wiki-inline-input wiki-owner-plaintext owner-editor-unified',
   'aria-label':type==='textarea'?ownerSay('Изменить описание','Edit description'):
    ownerSay('Изменить значение','Edit value')}):
  h('input',{type:'number',class:'wiki-inline-input',
   'aria-label':ownerSay('Изменить значение','Edit value'),min:String(min),max:String(max),
   step:integer?'1':'any'});
 if(type==='select'){
  for(const option of options){
   const el=h('option',{value:option.value,text:option.label});
   el.selected=option.value===before;control.append(el);
  }
 }else control.value=before;
 if(type==='number')guardOwnerInput(control);
 const restore=()=>{if(node.isConnected){node.replaceChildren(...visibleNodes);
  node.classList.remove('wiki-inline-saving');node.removeAttribute('aria-busy')}
  onFinished?.()};
 const save=async()=>{
  if(finished||saving)return;
  const raw=control.value;
  const value=type==='number'?(raw.trim()===''?null:Number(raw)):raw.trim();
  if(type==='number'&&value===null&&before===''){finished=true;restore();return}
   if(type==='number'&&(value===null||!Number.isFinite(value)||value<min||value>max||
   (integer&&!Number.isInteger(value)))){
   control.setCustomValidity(ownerSay('Введите корректное значение',
    'Enter a valid value'));control.reportValidity();control.focus();return;
  }
  if(type!=='number'&&type!=='select'&&(value.length>2000||(!value&&type==='text'))){
   const message=ownerSay('Некорректная длина текста',
    'Invalid text length');
   if(control.setCustomValidity){control.setCustomValidity(message);control.reportValidity()}
   else inlineError(message);
   control.focus();return;
  }
  if(String(value)===before){finished=true;restore();return}
  // contenteditable spans ignore the disabled property. Freeze the exact
  // submitted draft until D1 confirms it; never discard edits typed mid-save.
  saving=true;node.classList.add('wiki-inline-saving');
  node.setAttribute('aria-busy','true');
  if(control.matches('[data-owner-text-field]')){
   control.setAttribute('contenteditable','false');
   control.setAttribute('aria-disabled','true');
  }else control.disabled=true;
  try{await onCommit(value);finished=true;restore();onCommitted?.(value)}
  catch(error){saving=false;node.classList.remove('wiki-inline-saving');
   node.removeAttribute('aria-busy');
   if(control.matches('[data-owner-text-field]')){
    control.setAttribute('contenteditable','plaintext-only');
    control.removeAttribute('aria-disabled');
   }else control.disabled=false;
   const message=ownerSay('Не сохранено: ','Not saved: ')+
    String(error.message||ownerSay('Ошибка','Error'));
   if(control.setCustomValidity){
    control.setCustomValidity(message);control.reportValidity();
   }else inlineError(message);
   control.focus()}
 };
 control.oninput=()=>{
  if(control.setCustomValidity)control.setCustomValidity('');
  node.querySelector('.ui-content-inline-error')?.remove();
 };
 control.onblur=()=>{if(type==='select'){if(!saving){finished=true;restore()}}else void save()};
 control.onchange=()=>{if(type==='select')void save()};
 control.onkeydown=e=>{
  if(saving){e.preventDefault();e.stopPropagation();return}
  if(e.key==='Escape'){
   // Editing Escape must not also dismiss the equipped-item picker, Book,
   // or any other parent panel listening for document-level shortcuts.
   e.preventDefault();e.stopPropagation();finished=true;restore();
  }else if(e.key==='Enter'&&(type!=='textarea'||e.ctrlKey)){
   e.preventDefault();e.stopPropagation();void save();
  }
 };
 node.replaceChildren(control);control.focus();
 if(type==='number')control.select();
 else if(type==='text')window.getSelection()?.selectAllChildren(control);
}
// Repeated blur saves of different labels must not race and overwrite each
// other: construct each merged D1 patch only after the previous write finishes.
let wikiLabelWriteQueue=Promise.resolve();
async function saveGuidePatch(key,fields){
 if(key==='wiki.labels'){
  // Pending edits include jobs waiting in the queue, not just the current
  // fetch. Undo/Finish/EN review must never run between two queued writes.
  wikiLabelPendingWrites++;
  refreshOwnerUI();
  const write=wikiLabelWriteQueue.then(()=>saveGuidePatchNow(key,fields));
  wikiLabelWriteQueue=write.catch(()=>{});
  return write.finally(()=>{
   wikiLabelPendingWrites=Math.max(0,wikiLabelPendingWrites-1);
   refreshOwnerUI();
  });
 }
 return saveGuidePatchNow(key,fields);
}
async function saveGuidePatchNow(key,fields){
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
  if(key==='wiki.labels')refreshVisibleWikiLabels();
  if(key.startsWith('book.ui.label.'))
   refreshVisibleUICopy('guideedit.'+key);
  if(key.startsWith('book.equipment.')||key.startsWith('book.path.')||
     key.startsWith('book.catalog-sync.')||key.startsWith('book.honor-view.')||
     key.startsWith('book.owner-dock.')||key.startsWith('book.owner-history.')||
     key.startsWith('book.owner-dialog.')||key.startsWith('book.wiki-ui.')||
     key.startsWith('book.skill-ui.')||key.startsWith('book.stats-ui.'))
   refreshVisibleOwnerCopy('guideedit.'+key);
  if(activeTab==='wiki'&&wikiSelection.type==='honor'&&
     !key.startsWith('book.catalog-sync.')){
   const pane=$('detailContent'),position=pane?.scrollTop||0;
   wikiRenderSelected?.();
   if(pane)pane.scrollTop=position;
   saveView();
  }else if(key==='wiki.labels')saveView();
  else if(key.startsWith('book.origin.')||
   key.startsWith('book.ui.label.account-')||
   key.startsWith('book.ui.label.library-')||
   key.startsWith('book.ui.label.status-')||
   key.startsWith('book.ui.label.book-')||
   key.startsWith('book.profile.'))saveView(); // leave inline editor mounted
  else if(key.startsWith('book.'))saveView(); // refresh Book only after the input is restored
  else renderStageAttributes();
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveGuideList(key,rows){
 if(!['honor.zones','honor.wars'].includes(key)||!Array.isArray(rows))
  throw Error(wt('Неизвестный список','Unknown list'));
 const overrideKey='guideedit.'+key,before=activeOverride(overrideKey),value=JSON.stringify(rows);
 if(!window.PandoraHonorGuide?.validOverride(key,value))
  throw Error(wt('Проверь названия и связи списка','Check list names and links'));
 if(value===before)return;
 editIsSaving=true;
 try{
  await apiRequest('/api/admin/override',{key:overrideKey,value});
  override[overrideKey]=value;ownerEdits.push({key:overrideKey,before,after:value});
  if(activeTab==='wiki'&&wikiSelection.type==='honor'){
   const pane=$('detailContent'),position=pane?.scrollTop||0;
   wikiRenderSelected?.();
   if(pane)pane.scrollTop=position;
   saveView();
  }
 }finally{editIsSaving=false;refreshOwnerUI()}
}
async function saveWikiRecordPatch(type,id,updates){
 if(!adminToken||!adminEditing)throw Error('Недостаточно прав');
 const key='wikiedit.'+type+'.'+id;
 const previous=wikiRecordWriteQueue.get(key);
 // Build the patch only AFTER the previous write and its catalog reindex.
 // Otherwise two quick edits to one record race, and the last one silently
 // overwrites unrelated fields already saved by the first.
 const writing=(previous?previous.catch(()=>{}):Promise.resolve()).then(async()=>{
  let current={};
  try{current=JSON.parse(override[key]||'{}')}catch{}
  const changes=typeof updates==='function'?updates(current):updates;
  const patch={...current,...changes};
  if(!/^[0-9]+$/.test(String(id))){
   if(!window.PandoraWikiOwnerData.validTownPatch(type,id,patch))
    throw Error('Некорректное значение специального справочника');
  }else if(!window.PandoraWikiOwnerData.validPatch(type,patch))
   throw Error('Некорректное значение поля');
  const before=activeOverride(key),after=JSON.stringify(patch);
  if(before===after)return;
  await apiRequest('/api/admin/override',{key,value:after});
  ownerEdits.push({key,before,after});override[key]=after;
  await refreshOwnerCatalog();
 });
 wikiRecordWriteQueue.set(key,writing);
 editIsSaving=true;
 try{
  return await writing;
 }finally{
  // Only the latest queued operation may release the record's busy state.
  if(wikiRecordWriteQueue.get(key)===writing)wikiRecordWriteQueue.delete(key);
  if(!wikiRecordWriteQueue.size)editIsSaving=false;
  refreshOwnerUI();
 }
}
async function saveWikiRecordField(type,id,field,value){
 if(field.startsWith('resists.'))
  return saveWikiRecordPatch(type,id,current=>({
   resists:{...(wikiData?.monsters?.[id]?.resists||{}),
    ...(current.resists||{}),[field.slice(8)]:value}
  }));
 return saveWikiRecordPatch(type,id,{[field]:value});
}
async function saveWikiSpawns(monsterId,type,placeId,include,replacesId=null){
 if(!adminToken||!adminEditing)throw Error('Недостаточно прав');
 const recordKey='spawnedit.'+monsterId;
 const previous=wikiRecordWriteQueue.get(recordKey);
 // One monster owns one authoritative spawn override. Each operation must
 // read the refreshed relation index AFTER the earlier save has finished.
 const writing=(previous?previous.catch(()=>{}):Promise.resolve()).then(async()=>{
  if(type==='map'&&!Object.hasOwn(wikiData?.maps||{},String(placeId)))
   throw Error('Нельзя разместить монстра: карта отсутствует в игровом каталоге.');
  if(type==='instance'&&!(wikiData?.instances||[]).some(x=>String(x.id)===String(placeId)))
   throw Error('Подземелье отсутствует в игровом каталоге.');
  if(!wikiData?.monsters?.[monsterId])throw Error('Монстр не найден в каталоге.');
  const current=wikiIndex.locations(monsterId).map(x=>({type:x.type,id:String(x.id)}));
  const wanted=new Map(current.map(x=>[x.type+':'+x.id,x]));
  const key=type+':'+placeId;
  if(replacesId!=null){
   const oldKey=type+':'+replacesId;
   if(!include||!wanted.has(oldKey))
    throw Error('Исходное место появления больше не найдено. Обнови список.');
   if(oldKey===key)return;
   // Remove and add in memory, then publish ONE checked D1 override.
   wanted.delete(oldKey);
  }
  if(include)wanted.set(key,{type,id:String(placeId)});else wanted.delete(key);
  const rows=[...wanted.values()];
  if(!window.PandoraWikiOwnerData.validSpawns(rows))
   throw Error('Некорректные места появления');
  const before=activeOverride(recordKey),after=JSON.stringify(rows);
  if(before===after)return;
  await apiRequest('/api/admin/override',{key:recordKey,value:after});
  override[recordKey]=after;ownerEdits.push({key:recordKey,before,after});
  await refreshOwnerCatalog();
 });
 wikiRecordWriteQueue.set(recordKey,writing);
 editIsSaving=true;
 try{
  return await writing;
 }finally{
  if(wikiRecordWriteQueue.get(recordKey)===writing)wikiRecordWriteQueue.delete(recordKey);
  if(!wikiRecordWriteQueue.size)editIsSaving=false;
  refreshOwnerUI();
 }
}
// Whole-list editor payloads are snapshots, not independent field patches.
// Never let a stale edit overwrite a newer result for the same D1 key.
function enqueueWikiOwnerListWrite(key,expectedBefore,apply){
 const earlier=wikiRecordWriteQueue.get(key);
 const writing=(earlier?earlier.catch(()=>{}):Promise.resolve()).then(async()=>{
  if(activeOverride(key)!==expectedBefore)
   throw Error(wt('Список уже изменён. Открой запись заново и повтори правку.',
    'This list has changed. Reopen the entry and try again.'));
  return apply();
 });
 wikiRecordWriteQueue.set(key,writing);
 editIsSaving=true;
 return writing.finally(()=>{
  if(wikiRecordWriteQueue.get(key)===writing)wikiRecordWriteQueue.delete(key);
  if(!wikiRecordWriteQueue.size)editIsSaving=false;
  refreshOwnerUI();
 });
}
async function saveWikiRelationRows(kind,id,rows){
 if(!adminToken||!adminEditing)throw Error('Недостаточно прав');
 if(kind!=='drop'&&kind!=='chest')throw Error('Неизвестный тип связи');
 if(!(kind==='drop'?window.PandoraWikiOwnerData.validDrops(rows):
   window.PandoraWikiOwnerData.validChest(rows)))throw Error('Проверь список и числа');
 const key=kind+'edit.'+id,expectedBefore=activeOverride(key);
 const value=JSON.stringify(rows);
 return enqueueWikiOwnerListWrite(key,expectedBefore,async()=>{
  const saved=JSON.parse(value);
  const valid=kind==='drop'?
   window.PandoraWikiOwnerData.validDrops(saved):
   window.PandoraWikiOwnerData.validChest(saved);
  if(!valid)throw Error('Проверь список и числа');
  // Reject orphaned refs instead of claiming a successful ignored overlay.
  if(kind==='drop'&&(!Object.hasOwn(wikiData?.monsters||{},String(id))||
   !['d','s'].every(group=>saved[group].every(row=>
    Object.hasOwn(wikiData?.items||{},String(row.i))))))
   throw Error('Монстр или один из предметов отсутствует в каталоге');
  if(kind==='chest'&&(!Object.hasOwn(wikiData?.items||{},String(id))||
   !saved.every(group=>group.every(row=>
    !Object.hasOwn(row,'i')||
    Object.hasOwn(wikiData?.items||{},String(row.i))))))
   throw Error('Сундук или одна из наград отсутствует в каталоге');
  const before=activeOverride(key);
  if(before===value)return;
  await apiRequest('/api/admin/override',{key,value});
  ownerEdits.push({key,before,after:value});override[key]=value;
  await refreshOwnerCatalog();
 });
}
function wikiOwnerNumeric(node,value,type,id,field,{integer=false,min=0,max=1000000000}={}){
 if(!adminToken||!adminEditing)return node;
 node.classList.add('wiki-edit-value');
 node.title='Двойной клик или F2 — изменить';
 node.tabIndex=0;
 const start=e=>{
  e.preventDefault();e.stopPropagation();
  editWikiValue(node,Number(value),{type:'number',min,max,integer,
   onCommit:next=>saveWikiRecordField(type,id,field,next)});
 };
 node.ondblclick=start;
 node.onkeydown=e=>{if(e.key==='Enter'||e.key==='F2')start(e)};
 return node;
}
function dataNameForEditor(id){
 const record=wikiData?.items?.[id];
 if(!record)return null;
 const name=lang==='en'?
  (record.nameEn||officialEnglish?.items?.[id]?.n||record.name):record.name;
 return typeof name==='string'&&name.trim()?name.trim():null;
}
function wikiOwnerText(node,type,id,field,{multiline=false}={}){
 if(!adminToken||!adminEditing||(lang!=='ru'&&!['item','chest','npc','map','monster','skill','soul','instance'].includes(type)))return node;
 node.classList.add('wiki-edit-value');
 // The delegated dblclick is the user's actual first gesture. Starting an
 // ondblclick listener here would silently require a SECOND double-click.
 const source=node._sourceDescription;
 const initial=node.dataset.ownerEmpty==='true'?'':String(node.textContent||'');
 editWikiValue(node,initial,{
  type:multiline?'textarea':'text',
  onCommit:next=>{
   const raw=source&&/^(?:desc|descEn|blurbRu)$/.test(field)?
    window.PandoraItemPresentation.restoreReferences(next,source,
     key=>wikiData?.items?.[key]?dataNameForEditor(key):null,lang):next;
   return type==='item'||type==='chest'?
    saveWikiItemField(id,field,raw):saveWikiRecordField(type,id,field,raw);
  }});
 return node;
}
async function saveWikiItemField(id,field,value){
 if(!adminEditing||!adminToken||!catalogSource?.items?.[id])throw Error('Редактирование недоступно');
 const base=catalogSource.items[id],key='itemedit.'+id;
 const baseValue=field==='nameEn'?(base.nameEn||officialEnglish?.items?.[id]?.n||base.name):
  field==='descEn'?(base.descEn??officialEnglish?.items?.[id]?.d??base.desc):base[field];
 const previous=wikiRecordWriteQueue.get(key);
 // Match the Wiki record editor: prepare the next patch after the previous
 // write and catalog refresh so a second fast field edit cannot erase the first.
 const writing=(previous?previous.catch(()=>{}):Promise.resolve()).then(async()=>{
  const before=activeOverride(key);
  const current=window.PandoraStudioItemOwnerEditor.ownPatch(override,id);
  const patch={...current};
  if(value===baseValue||(value===null&&baseValue==null))delete patch[field];
  else patch[field]=value;
  if(field==='kind'&&/^[12]H_/.test(value))patch.twoHanded=value.startsWith('2H_');
  const serialized=JSON.stringify(patch);
  if(serialized===JSON.stringify(current))return;
  if(!Object.keys(patch).length){
   if(before===null)return;
   await apiRequest('/api/admin/reset',{key});delete override[key];
   ownerEdits.push({key,before,after:null});
  }else{
   await apiRequest('/api/admin/override',{key,value:serialized});
   override[key]=serialized;ownerEdits.push({key,before,after:serialized});
  }
  await refreshOwnerCatalog();
 });
 wikiRecordWriteQueue.set(key,writing);
 editIsSaving=true;
 try{
  return await writing;
 }finally{
  if(wikiRecordWriteQueue.get(key)===writing)wikiRecordWriteQueue.delete(key);
  if(!wikiRecordWriteQueue.size)editIsSaving=false;
  refreshOwnerUI();
 }
}
async function saveWikiTradeRecipe(recipe,changes=null){
 if(!adminToken||!adminEditing||!wikiData?.trades)
  throw Error('Редактор обменов недоступен');
 const normalized={id:Number(recipe.id),i:Number(recipe.i),
  npc:(recipe.npc||[]).map(Number),
  mats:(recipe.mats||[]).map(row=>({i:Number(row.i),n:Number(row.n)})),
  gold:Number(recipe.gold||0),honor:Number(recipe.honor||0),exp:Number(recipe.exp||0)};
 const key='tradeedit.'+normalized.id,expectedBefore=activeOverride(key);
 const value=JSON.stringify(changes||{recipe:normalized});
 return enqueueWikiOwnerListWrite(key,expectedBefore,async()=>{
  if(changes===null&&!window.PandoraStudioTradeOwnerData.recipeValid(
   normalized,wikiData.items,wikiData.trades.npcs))
   throw Error('Проверь выбранные предметы, NPC и стоимость обмена');
  const before=activeOverride(key);
  if(before===value)return;
  await apiRequest('/api/admin/override',{key,value});
  override[key]=value;ownerEdits.push({key,before,after:value});
  await refreshOwnerCatalog();
 });
}
async function saveWikiAcquisitions(itemId,rows){
 if(!adminToken||!adminEditing||!wikiData?.items?.[itemId])
  throw Error('Редактирование источников недоступно');
 if(!Array.isArray(rows)||rows.length>24||rows.some(row=>
  !row||typeof row!=='object'))throw Error('Некорректная ссылка на NPC или монстра');
 // Preserve the exact requested list while waiting for any earlier same-key save.
 const normalized=[...new Map((rows||[]).map(row=>[row.type+':'+row.id,
  {type:row.type,id:String(row.id),
   ...(row.type==='monster'&&Number.isFinite(row.p)?{p:row.p}:{})}
 ])).values()];
 const key='acquireedit.'+itemId,expectedBefore=activeOverride(key);
 const value=JSON.stringify(normalized);
 return enqueueWikiOwnerListWrite(key,expectedBefore,async()=>{
  if(!Array.isArray(rows)||rows.length>24||rows.some(row=>
   !['npc','monster'].includes(row.type)||!/^[1-9][0-9]{0,14}$/.test(String(row.id))||
   (row.p!=null&&(!Number.isFinite(row.p)||row.p<0||row.p>100||row.type!=='monster'))||
   !(row.type==='npc'?wikiData.trades?.npcs?.[row.id]:wikiData.monsters?.[row.id])))
   throw Error('Некорректная ссылка на NPC или монстра');
  const before=activeOverride(key);
  if(value===JSON.stringify(wikiData.ownerAcquisitions?.[itemId]||[]))return;
  if(!normalized.length){
   if(before===null)return;
   await apiRequest('/api/admin/reset',{key});delete override[key];
   ownerEdits.push({key,before,after:null});
  }else{
   await apiRequest('/api/admin/override',{key,value});
   override[key]=value;ownerEdits.push({key,before,after:value});
  }
  await refreshOwnerCatalog();
 });
}
function inlineWikiText(el){
 const key=el?.dataset?.editKey;
 if(!adminEditing||!adminToken||!key)return;
 const matched=/^(item|itemdesc)\.([0-9]{1,15})$/.exec(key);
 const source=matched?wikiData?.items?.[matched[2]]:null;
 const desc=key.startsWith('itemdesc.')||key.startsWith('skilldesc.');
 const raw=source?String(source[desc?'desc':'name']??''):el.textContent;
 const lookup=key=>dataNameForEditor(key);
 const value=desc?window.PandoraItemPresentation.descriptionText(raw,lookup,lang):raw;
 editWikiValue(el,value,{type:desc?'textarea':'text',onCommit:async next=>{
  if(matched)return saveWikiItemField(matched[2],desc?'desc':'name',
   desc?window.PandoraItemPresentation.restoreReferences(next,raw,lookup,lang):next);
  if(!next||next.length>(desc?2000:240))throw Error('Некорректная длина текста');
  const previous=activeOverride(key);
  await apiRequest('/api/admin/override',{key,value:next});
  override[key]=next;ownerEdits.push({key,before:previous,after:next});refreshOwnerCatalog();
 }});
}

/* Editorial copy for administrative dialogs uses the same authenticated
   inline D1 CAS path as the Book. No JSON values, counts, tokens or callbacks
   are ever passed to this generic text editor. */
function ownerDialogHelp(key,ru,en){
 const caption=h('p',{class:'muted owner-dialog-help',
  id:'owner-dialog-copy-'+key,text:ownerCopy('owner-dialog',key,ru,en)});
 if(!adminEditing||!adminToken)return caption;
 ownerCopyLabel(caption,'owner-dialog',key,ru,en);
 const pencil=h('button',{type:'button',class:'owner-dialog-pencil',
  text:'✎',title:lang==='en'?'Edit explanation':'Изменить пояснение',
  'aria-label':lang==='en'?'Edit explanation':'Изменить пояснение',
  'aria-describedby':caption.id,
  onclick:event=>{
   event.preventDefault();event.stopPropagation();
   caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
  }});
 return h('div',{class:'owner-dialog-editor'},[caption,pencil]);
}
function ownerDialogAction(button,key,ru,en){
 button.textContent=ownerCopy('owner-dialog',key,ru,en);
 button.classList.add('owner-dialog-action');
 if(!adminEditing||!adminToken)return button;
 const wrapper=h('span',{class:'owner-dialog-action-editor'});
 const host=h('span',{class:'owner-dialog-action-host',hidden:true});
 const pencil=h('button',{type:'button',class:'owner-dialog-pencil',
  text:'✎',title:lang==='en'?'Edit action caption':'Изменить подпись действия',
  'aria-label':lang==='en'?'Edit action caption':'Изменить подпись действия',
  onclick:event=>{
   event.preventDefault();event.stopPropagation();
   if(!button.isConnected)return;
   button.hidden=true;pencil.hidden=true;host.hidden=false;
   host.textContent=ownerCopy('owner-dialog',key,ru,en);
   host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
  }});
 ownerCopyLabel(host,'owner-dialog',key,ru,en,{
  onCommitted:next=>{button.textContent=next},
  onFinished:()=>{button.hidden=false;pencil.hidden=false;host.hidden=true}
 });
 wrapper.append(button,pencil,host);
 return wrapper;
}
function showOwnerEnglishReview(){
 if(!adminEditing||!adminToken)return;
 const tr=(ru,en)=>lang==='en'?en:ru;
 if(editIsSaving||wikiLabelPendingWrites>0||ownerSaveState==='saving'){
  showStudioToast('Сначала заверши текущее сохранение.','warning');return;
 }
 const helper=window.PandoraOwnerBilingual;
 const planned=helper?.pending(override)||[];
 if(!planned.length){
  showStudioToast('Все подготовленные английские переводы уже сохранены.','success');return;
 }
 const fields=planned.reduce((sum,entry)=>sum+entry.fields.length,0);
 const body=h('div',{class:'owner-manager'});
 body.append(ownerDialogHelp('translationsIntro',
  'Готовые переводы русских правок. Здесь только записи с подтверждённым исходным текстом. Уже сохранённые EN-названия не заменяются.',
  'Suggested English translations of Russian edits. Only verified source texts are included. Existing English names are not replaced.'));
 const list=h('div',{class:'owner-manager-list'});
 for(const row of planned){
  const group=h('div',{class:'owner-manager-row'});
  group.append(h('strong',{text:row.title}));
  for(const field of row.fields)group.append(h('p',{text:field.ru+' → '+field.en}));
  list.append(group);
 }
 const status=h('p',{role:'status',class:'muted'});
 const save=h('button',{type:'button',class:'button-action primary'});
 save.onclick=async()=>{
  save.disabled=true;editIsSaving=true;refreshOwnerUI();
  let saved=0;
  try{
   // Re-read D1 before saving: never clobber edits from another session.
   const remote=(await apiRequest('/api/overrides',null,'')).values||{};
   const current=helper.pending(remote);
   if(current.length!==planned.length||
    current.some((entry,i)=>entry.key!==planned[i].key||
     entry.before!==planned[i].before||entry.value!==planned[i].value))
    throw Error(tr('Содержимое D1 изменилось. Закрой окно и проверь переводы заново.',
     'D1 content changed. Close the dialog and review translations again.'));
   for(const change of current){
    await apiRequest('/api/admin/override',{key:change.key,value:change.value});
    const before=Object.hasOwn(override,change.key)?override[change.key]:null;
    override[change.key]=change.value;
    ownerEdits.push({key:change.key,before,after:change.value});
    saved++;
   }
   refreshVisibleWikiLabels();
   status.textContent=tr('Готово: ','Done: ')+fields+
    tr(' переводов сохранены в D1.',' translations saved in D1.');
   await refreshOwnerCatalog();
   save.hidden=true;
  }catch(error){
   status.textContent=tr('Сохранено ','Saved ')+saved+
    tr(' из ',' of ')+planned.length+
    tr(' записей. ',' entries. ')+error.message;
   if(!saved)save.disabled=false;
  }finally{editIsSaving=false;refreshOwnerUI()}
 };
 const toolbar=h('div',{class:'owner-dialog-save-row'},[
  ownerDialogAction(save,'translationsSaveButton',
   'Сохранить EN-переводы','Save English translations'),
  h('small',{class:'owner-dialog-live-count',
   text:tr('К сохранению: ','To save: ')+fields})
 ]);
 body.append(list,toolbar,status);
 modal(tr('Английские переводы','English translations'),body);
}
async function showOwnerGitHubExport(){
 if(!adminToken)return;
 const tr=(ru,en)=>lang==='en'?en:ru;
 if(editIsSaving||wikiLabelPendingWrites>0||ownerSaveState==='saving'){
  showStudioToast('Дождись завершения сохранения в Cloudflare D1 перед созданием PR.','warning');
  return;
 }
 if(ownerSaveState==='error'){
  showStudioToast('Сначала исправь ошибку сохранения. PR пока недоступен.','warning');
  return;
 }
 try{
  const info=await apiRequest('/api/admin/catalog/owner-review');
  if(!info.configured){showStudioToast('GitHub-токен пока недоступен Worker.','warning');return}
  const panel=h('div',{class:'owner-github-review'});
  panel.append(
   ownerDialogHelp('githubPrompt',
    'Необязательная копия правок энциклопедии в GitHub',
    'Optional copy of encyclopedia edits in GitHub'),
   h('p',{class:'owner-dialog-live-count',
    text:tr('Записей для копии: ','Records in copy: ')+info.count}),
   ownerDialogHelp('githubExplanation',
    'Изменения через ✎ уже сохраняются в D1 и работают на сайте. Копия в GitHub НЕ обязательна. Эта кнопка создаст публичный PR — предложение добавить текстовую копию в репозиторий. Зелёные проверки означают, что тесты прошли, но не объединяют PR. Если нужна копия, проверь её содержимое и нажми Merge pull request в GitHub.',
    'Edits made with ✎ already save to D1 and work on the site. GitHub export is OPTIONAL. This creates a public PR to add a text copy to the repository. Green checks mean tests passed, not that the PR was merged. To keep the copy, review its contents and select Merge pull request in GitHub.'));
  const feedback=h('p',{class:'inline-owner-error',role:'status'});
  const go=h('button',{type:'button',class:'button-action primary',disabled:!info.count});
  go.onclick=async()=>{
   go.disabled=true;
   try{
    const result=await apiRequest('/api/admin/catalog/owner-pr',{
     expectedFingerprint:info.fingerprint});
    if(result.url&&/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(result.url)){
     feedback.replaceChildren(
      h('span',{text:tr('Копия предложена, но ещё НЕ добавлена в GitHub. Проверки PR не объединяют его автоматически. ',
       'The copy has been proposed, but is NOT yet merged into GitHub. PR checks do not merge it automatically. ')}),
      h('a',{href:result.url,target:'_blank',rel:'noopener noreferrer',
       text:tr('Открыть PR и проверить содержимое','Open PR and review the contents')}),
      h('span',{text:tr(' Если копия нужна, после успешных проверок нажми Merge pull request. Для обычной правки энциклопедии это необязательно.',
       ' If you want the copy, select Merge pull request after successful checks. This is optional for editing the live encyclopedia.')})
     );
    }else feedback.textContent=result.unchanged?
     tr('Изменений относительно GitHub нет.','No changes compared with GitHub.'):
     tr('PR создан, но адрес не указан.','PR created, but no URL was returned.');
   }catch(error){feedback.textContent=error.message;go.disabled=false}
  };
  panel.append(ownerDialogAction(go,'githubCreateButton',
   'Подготовить PR для копии','Prepare copy PR'),feedback);
  modal(tr('Необязательная копия энциклопедии в GitHub','Optional GitHub encyclopedia copy'),panel);
 }catch(error){showStudioToast('Не удалось подготовить экспорт: '+error.message,'warning')}
}
async function showCatalogImport(){
 if(!adminToken)return;
 const workbench=window.PandoraOSCatalogWorkbench;
 if(!workbench)throw Error('Модуль сверки актуального игрового сервера не подключён');
 return workbench.open({
  request:(path,body)=>apiRequest(path,body,adminToken),
  apiBase:API,modal,h,lang,
  canEdit:Boolean(adminEditing&&adminToken),
  copyLabel:(key,ru,en)=>ownerCopy('catalog-sync',key,ru,en),
  editLabel:(node,key,ru,en,callbacks)=>ownerCopyLabel(
   node,'catalog-sync',key,ru,en,callbacks),
  afterPublish:async()=>{invalidateWikiCatalog({dropSnapshot:true});await loadCatalog()}
 });
}

function syncLocaleControls(){
 for(const button of document.querySelectorAll('#locale [data-locale]')){
  const active=button.dataset.locale===lang;
  button.classList.toggle('chosen',active);
  button.setAttribute('aria-pressed',String(active));
 }
}
function renderArchiveNotice(){
 const notice=$('siteNotice');
 if(!notice)return;
 notice.hidden=!catalogArchived;
 notice.textContent=!catalogArchived?'':lang==='en'?
  'Saved game data may be outdated. Reload the page to try the current game catalog again.':
  'Сохранённая копия игры может устареть. Обнови страницу, чтобы снова попробовать загрузить актуальные данные.';
}
function renderCatalogStatus(){
 const target=$('catalogStatus'),data=catalogSource;
 if(!target||!data?.meta?.counts)return;
 // Counts come from the current selected catalog snapshot, never a hard-coded
 // number. Re-evaluate the user-facing text after every locale change.
 target.textContent=(lang==='en'?'Encyclopedia: ':'В энциклопедии: ')+
  data.meta.counts.skills+(lang==='en'?' skills · ':' навыков · ')+
  data.meta.counts.items+(lang==='en'?' items · ':' предметов · ')+
  data.meta.counts.souls+(lang==='en'?' souls':' душ');
}
function applyGameLocale({redraw=true}={}){
 window.PandoraUILocale.setOverrides(override);
 window.PandoraUILocale.apply(lang);
 refreshOpenAuthoredToast();
 renderArchiveNotice();
 renderCatalogStatus();
 renderOriginCopyLabels();
 bindStaticUICopyEditors();
 window.PandoraAccountUI?.refresh?.();
 syncLocaleControls();
 if(!catalogSource)return;
 const translate=(original,map,keepSourceDesc=false)=>{
  if(lang!=='en'||!map)return original;
  return Object.fromEntries(Object.entries(original).map(([id,item])=>{
    const t=map[id];
    if(!t&&!item.nameEn&&!item.descEn)return [id,item];
    return [id,{...item,name:item.nameEn||t?.n||item.name,
     desc:item.descEn??t?.d??item.desc,
     ...(keepSourceDesc?{sourceDesc:item.desc}:{})}]
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
 // Remove stale Soul arrays left by older builds that reused equipment slots.
 if(window.PandoraEquipmentPlan.reconcileSoulOwnership(state,catalog.equipment,catalog.souls))persist();
 jobs=jobKeys.map(id=>catalog.classes[id]?.name||id);
 branches=window.PandoraGameNavigation.groups.flatMap(g=>g.branches.map(id=>({id,name:meta.branchLabels[id]||id})));
 if(redraw)render();
}
// The active D1 snapshot is authoritative. Never silently show a GitHub
// archive as current game data; only the user's explicit offline choice may
// install the bundled copy. RU and EN use the same verified snapshot.
let activeCatalogSnapshot=null,catalogLoadVersion=0;
let englishCatalogPending=null,officialEnglishSnapshot=null;
async function ensureEnglishCatalog(){
 if(!catalogSource)throw Error('Сначала требуется каталог игры');
 if(officialEnglish&&officialEnglishSnapshot===activeCatalogSnapshot)return officialEnglish;
 if(englishCatalogPending)return englishCatalogPending;
 const snapshot=activeCatalogSnapshot;
 const source=catalogArchived?'./data/os/strings.en.json':API+'/api/catalog/stringsEn.json';
 englishCatalogPending=(async()=>{
  const response=await fetch(source,{cache:'no-cache',signal:AbortSignal.timeout(16000)});
  if(!response.ok)throw Error('Английский каталог: HTTP '+response.status);
  if(!catalogArchived&&response.headers.get('x-ps-catalog')!=='d1')
   throw Error('Английский каталог: источник D1 не подтверждён');
  if(!catalogArchived&&response.headers.get('x-ps-catalog-snapshot')!==snapshot)
   throw Error('Версия английского перевода не совпадает с текущей D1');
  const data=await response.json(),expected=catalogSource?.meta?.localeCounts?.en||{};
  if(data.locale!=='en'||['items','skills','monsters','souls','classes'].some(
     key=>Object.keys(data[key]||{}).length!==Number(expected[key])))
   throw Error('Английский каталог неполон или не совпадает с версией игры');
  if(snapshot!==activeCatalogSnapshot)return null;
  officialEnglish=data;officialEnglishSnapshot=snapshot;
  if(lang==='en')applyGameLocale();
  return data;
 })().finally(()=>{englishCatalogPending=null});
 return englishCatalogPending;
}
async function loadCatalog({archive=false}={}){
 const version=++catalogLoadVersion;
 const names=['meta','classes','skills','items','souls','racialPassives',
  'unison','tables','itemForth'];
 const base=archive?'./data/os':API+'/api/catalog';
 const snapshots=new Set(),unknown=[];
 const entries=await Promise.all(names.map(async name=>{
  const response=await fetch(base+'/'+name+'.json',{
   cache:archive?'default':'no-cache',signal:AbortSignal.timeout(14000)});
  if(!response.ok)throw Error(name+' HTTP '+response.status);
  if(!archive){
   // Confirm both the published snapshot and its D1 origin for every
   // character-calculation dataset, not just Wiki and admin review.
   if(response.headers.get('x-ps-catalog')!=='d1')
    throw Error('Игровой каталог '+name+': источник D1 не подтверждён');
   const snapshot=response.headers.get('x-ps-catalog-snapshot');
   if(snapshot)snapshots.add(snapshot);else unknown.push(name);
  }
  return [name,await response.json()];
 }));
 if(version!==catalogLoadVersion)return;
 if(!archive&&(snapshots.size!==1||unknown.length))
  throw Error('В ходе загрузки изменилась версия каталога Cloudflare D1');
 const data=Object.fromEntries(entries);
 for(const name of names.filter(name=>!['meta','tables','itemForth'].includes(name))){
  const expected=Number(data.meta?.counts?.[name]);
  const actual=Object.keys(data[name]||{}).length;
  if(!Number.isSafeInteger(expected)||expected<1||actual<expected)
   throw Error('Неполный каталог '+name+': '+actual+' / '+expected);
 }
 // Apply the SAME skills, equipment, Soul and race integrity gate as
 // the Encyclopedia before any D1 record can reach the Hero Book or builder.
 window.PandoraWikiCatalog.validateCharacterCatalog(data);
 window.PandoraWikiCatalog.validateCharacterExtras(data);
 window.PandoraWikiCatalog.validateCharacterTables(data.tables);
 if(!data.meta?.counts?.skills||!data.classes?.CLERIC||
    !data.tables?.abilityPoint||!data.tables?.weaponPlus||!data.tables?.forge||
    !data.itemForth||typeof data.itemForth!=='object'||Array.isArray(data.itemForth))
  throw Error('Отсутствуют основные таблицы персонажа и экипировки');
 catalogArchived=archive;activeCatalogSnapshot=archive?null:[...snapshots][0];
 catalogSource=data;gameTables=data.tables;gameItemForth=data.itemForth;
 window.PandoraItemPresentation.setReferenceResolver?.(id=>{
  const item=catalogSource?.items?.[id];
  if(!item)return null;
  const label=lang==='en'?
    (item.nameEn||officialEnglish?.items?.[id]?.n||item.name):item.name;
  return typeof label==='string'&&label.trim()?label.trim():null;
 },()=>lang);
 officialEnglish=null;officialEnglishSnapshot=null;
  const oldToOS={1:'slash',2:'thrust',3:'brush',4:'blow',5:'defense',7:'archery',8:'alchemy',9:'assassin',10:'trap',11:'warding',13:'benevolence',14:'blessing',15:'exorcism',16:'hymn',18:'element',19:'embody',20:'darkness',21:'charm',23:'race',24:'riding'};
  state.points=Object.fromEntries(Object.entries(state.points).map(([key,val])=>[oldToOS[key]||key,val]));
  if(state.mastery&&typeof state.mastery==='object'&&!Array.isArray(state.mastery))
   state.mastery=Object.fromEntries(Object.entries(state.mastery)
    .map(([key,val])=>[oldToOS[key]||key,val]));
  if(typeof state.branch==='number')state.branch=oldToOS[state.branch]||'brush';
  if(!window.PandoraGameNavigation.all.has(state.branch)){state.branch='slash'}
  if(!pathGroupTouched)
   selectedSkillGroup=window.PandoraGameNavigation.branchGroup(state.branch)?.id||'melee';

 if(typeof state.branch==='number')state.branch='slash';
 if(!window.PandoraGameNavigation.all.has(state.branch))state.branch='slash';
 if(!pathGroupTouched)
  selectedSkillGroup=window.PandoraGameNavigation.branchGroup(state.branch)?.id||'melee';
 if(lang==='en')await ensureEnglishCatalog();
 if(version!==catalogLoadVersion)return;
 renderArchiveNotice();
 invalidateWikiCatalog({dropSnapshot:true});
 applyGameLocale();persist();
 return data;
}
let ownerWikiRefreshId=0;
async function refreshOwnerCatalog(){
 const generation=++ownerWikiRefreshId;
 invalidateWikiCatalog();
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
async function loadOverrides({strict=false}={}){try{
 const response=await apiRequest('/api/overrides',null,'');
 override=response.values||{};
 window.PandoraUILocale.setOverrides(override);
 window.PandoraUILocale.apply(lang);
 refreshVisibleWikiLabels();
 await refreshOwnerCatalog();
}catch(error){
 if(strict)throw Error('Правки каталога D1 недоступны: '+error.message);
 console.warn('Owner overrides unavailable in explicitly selected archive mode',error);
}}
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
 if(stageSlotPickerOpen)return;
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
 if((event.key==='Enter'||event.key===' ')&&!stageSlotPickerOpen){
  event.preventDefault();openHeroBook();
 }
});$('newBuildQuick').onclick=()=>{changeTab('builds');$('newBuildButton')?.click()};$('snapshot').onclick=()=>{changeTab('builds')};let switchingLocale=false;
$('locale').onclick=async event=>{
 const button=event.target.closest('[data-locale]');
 if(!button||button.dataset.locale===lang||switchingLocale)return;
 const requested=button.dataset.locale;
 switchingLocale=true;
 if(requested==='en'&&!officialEnglish)
  startupMessage('Подготавливаем английские описания…',
   'Loading English names and descriptions…','en');
 try{
  if(requested==='en'&&!officialEnglish){
   const english=await ensureEnglishCatalog();
   if(!english)throw Error('Английский перевод не загружен');
  }
  lang=requested;
  localStorage.setItem('ps-build-lang',lang);
  applyGameLocale();
 }catch(error){
  console.warn('Requested language is unavailable',error);
  showStudioToast('Не удалось загрузить английские описания: '+error.message,'warning');
 }finally{
  switchingLocale=false;
  if(!startupOverlay.hidden)startupDone();
 }
};document.addEventListener('click',event=>{if(!adminEditing||!event.target.closest||event.target.closest('#ownerDock, .inline-owner-editor, #modalRoot, #hero'))return;const editable=event.target.closest('[data-edit-key]');if(editable){if(/^(?:item|itemdesc|itemslots|skill|skilldesc)\./.test(editable.dataset.editKey))return;event.preventDefault();event.stopImmediatePropagation();editor(editable)}},true);
document.addEventListener('keydown',event=>{
 if(!adminEditing||!adminToken||!['F2','Enter'].includes(event.key)||
  event.target.closest?.('[data-owner-text-field],input,textarea,select,button,a'))return;
 const owner=event.target.closest?.('[data-owner-record][data-owner-field]');
 if(owner&&owner===event.target){
  const [type,id]=owner.dataset.ownerRecord.split(':');
  event.preventDefault();event.stopPropagation();
  wikiOwnerText(owner,type,id,owner.dataset.ownerField,
   {multiline:!['name','nameEn'].includes(owner.dataset.ownerField)});
  return;
 }
 const editable=event.target.closest?.('[data-edit-key]');
 if(editable&&editable===event.target&&
  /^(?:item|itemdesc|itemslots|skill|skilldesc)\./.test(editable.dataset.editKey)){
  event.preventDefault();event.stopPropagation();
  inlineWikiText(editable);
 }
},true);
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
$('pathGrowthTab').onclick=event=>{if(event.target?.closest?.('.path-tab-pencil,.wiki-inline-input'))return;heroPathPage='growth';renderPathPages();saveView()};
 $('pathSkillsTab').onclick=event=>{if(event.target?.closest?.('.path-tab-pencil,.wiki-inline-input'))return;heroPathPage='skills';renderPathPages();saveView()};
 // The one-step browser confirm interrupts the game and is RU-only.
 // Keep this warning in the Path itself, with separate cancel/confirm actions.
 function closePathResetConfirm(restoreFocus=false){
  $('pathResetConfirm')?.remove();
  const trigger=$('pathResetPoints');
  if(trigger)trigger.hidden=false;
  if(restoreFocus&&trigger&&!trigger.closest('[hidden]'))
   trigger.focus({preventScroll:true});
 }
 $('pathResetPoints').onclick=()=>{
  if(!budgetSummary().spent||$('pathResetConfirm'))return;
  const ru='Сбросить вложенные очки навыков и зелёное мастерство? Экипировка и другие настройки героя сохранятся.';
  const en='Reset allocated skill points and trained mastery? Equipment and other character settings will be kept.';
  const note=h('p',{class:'path-reset-confirm-note',
   text:ownerCopy('path','resetConfirmHelp',ru,en)});
  ownerCopyLabel(note,'path','resetConfirmHelp',ru,en);
  const copyRow=h('div',{class:'path-reset-confirm-copy'});
  copyRow.append(note);
  if(adminEditing&&adminToken){
   const pencil=h('button',{type:'button',class:'path-reset-confirm-pencil',
    text:'✎','aria-label':(lang==='en'?'Edit warning: ':'Изменить предупреждение: ')+note.textContent,
    onclick:event=>{
     event.preventDefault();event.stopPropagation();
     note.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
    }});
   copyRow.append(pencil);
  }
  const panel=h('div',{id:'pathResetConfirm',class:'path-reset-confirm',
   role:'group','aria-label':lang==='en'?'Confirm skill reset':'Подтверждение сброса навыков'});
  const controls=h('div',{class:'path-reset-confirm-actions'});
  const reset=h('button',{type:'button',class:'path-reset-accept',
   text:lang==='en'?'Yes, reset skill points':'Да, сбросить очки',
   onclick:()=>{
    // Allocation can change before confirmation; re-check the live budget.
    if(!budgetSummary().spent){closePathResetConfirm(true);return}
    closePathResetConfirm();
    for(const b of branches)state.points[b.id]=0;
    state.mastery={};
    persist();renderBranches();refreshBudgetLabel();renderOriginStats();renderOriginVitals();
    saveView();
   }});
  const cancel=h('button',{type:'button',class:'path-reset-cancel',
   text:lang==='en'?'Cancel':'Отмена',onclick:()=>closePathResetConfirm(true)});
  controls.append(reset,cancel);panel.append(copyRow,controls);
  panel.addEventListener('keydown',event=>{
   if(event.key==='Escape'){
    event.preventDefault();event.stopPropagation();closePathResetConfirm(true);
   }
  });
  $('pathResetPoints').after(panel);
  $('pathResetPoints').hidden=true;
  cancel.focus({preventScroll:true});
 };
 $('pathAutoMastery').onchange=e=>{
  window.PandoraSkillProgression.setAuto(state,e.target.checked,branches.map(b=>b.id),
   innateBranches(),branchCapacities());
  persist();renderBranches();refreshBudgetLabel();renderOriginStats();renderOriginVitals();
 };
 guardEncyclopediaSearch($('pathSkillSearch')); // non-credential search, not account login
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
function saveBeforeUpdate(event){
 const draftSaved=persist(),librarySaved=persistBuilds();
 if(draftSaved&&librarySaved)return;
 event.preventDefault();
 showStudioToast(lang==='en'?
  'Update cancelled: could not save your draft or build library. Free some browser storage and try again.':
  'Обновление отменено: не удалось сохранить черновик или библиотеку билдов. Освободите место в браузере и повторите попытку.',
  'error');
}
document.addEventListener('pandora:before-update',saveBeforeUpdate);
// Restore deep links on refresh without requiring credentials or losing the current build.
function restoreWikiHash(){
 // On F5 respect the last *visible* view; on explicit navigation honor an incoming wiki deep link.
 const navigationType=performance.getEntriesByType?.('navigation')?.[0]?.type;
 if(navigationType==='reload'&&
    (bootView.tab&&bootView.tab!=='wiki'||bootView.tab==='wiki'&&bootView.open===false))return;
 const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance|honor)\/([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}|war-[a-z][a-z0-9-]{0,35})(?:\/([0-9]{1,15}))?$/);
 if(!match)return;
 wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
 activeTab='wiki';
 for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab==='wiki');
 renderDetails();showWorkbench();
}
window.addEventListener('hashchange',()=>{
 if(/^#b\/[A-Za-z0-9_-]{11}$/.test(location.hash)){void restoreSharedHash();return}
 if(location.hash.startsWith('#wiki/')){
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance|honor)\/([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}|war-[a-z][a-z0-9-]{0,35})(?:\/([0-9]{1,15}))?$/);
  if(match){
   // popstate already restored this record when browser Back/Forward fired.
   if(activeTab==='wiki'&&wikiSelection.type===match[1]&&
      wikiSelection.id===match[2]&&
      (wikiSelection.highlight||null)===(match[3]||null)&&
      $('detailPanel')?.classList.contains('is-open'))return;
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
render();
const skillLabelsReady=fetch('./data/localization/remaked-skill-identity.v1.json',{
 cache:'default',signal:AbortSignal.timeout(14000)})
 .then(response=>{
  if(!response.ok)throw Error('Перевод умений: HTTP '+response.status);
  return response.json();
 }).then(mapping=>{
  if(mapping?.originalEntries!==205||!mapping.skillLabelsById)
   throw Error('Не удалось проверить русский перевод умений');
  approvedSkillIdNames=mapping.skillLabelsById;
 });
let startupAttempt=0;
async function startStudio({archive=false}={}){
 const attempt=++startupAttempt;
 startupMessage(
  archive?'Открываем сохранённую копию игры…':'Загружаем игровые данные…',
  archive?'Opening saved game data…':'Loading game data…');
 try{
  const loaded=await loadCatalog({archive});
  if(attempt!==startupAttempt||!loaded)return;
  startupMessage('Проверяем игровые данные и переводы…','Validating game data and translations…');
  await skillLabelsReady;
  if(!archive)await loadOverrides({strict:true});
  if(attempt!==startupAttempt)return;
  if(activeTab==='wiki')await loadWiki();
  if(attempt!==startupAttempt)return;
  applyGameLocale();
  startupDone();
  // Locale prefetch is intentionally nonblocking for RU. A future EN switch
  // waits for this exact D1-snapshot translation before exposing EN UI.
  if(lang==='ru'&&!archive){
   const warm=()=>{if(lang==='ru'&&!catalogArchived)
    void ensureEnglishCatalog().catch(e=>console.info('EN prefetch deferred',e.message))};
   if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:5000});
   else setTimeout(warm,350);
  }
 }catch(error){
  if(attempt===startupAttempt)startupError(error);
 }
}
$('startupRetry').onclick=()=>void startStudio();
$('startupArchive').onclick=()=>void startStudio({archive:true});
// Local development serves its bundled snapshot; the published GitHub Pages
// site always requires D1 unless the visitor explicitly opts into archive mode.
void startStudio({archive:['127.0.0.1','localhost'].includes(location.hostname)});
void window.PandoraAccountUI.init({
 baseUrl:API,
 onCopyReady:bindAccountCopyEditors,
 onLogin:({register})=>{
  // Header login, like the build-gate login, must preserve an unsaved guest
  // hero before the account owner switch replaces the visible draft.
  if(tabOwnerScope?.startsWith('guest:')&&unsavedBuild())
   pendingGuestDraft={snapshot:structuredClone(state),owner:tabOwnerScope};
  // Registration and existing login never import old guest saved builds.
  // Preserve the working character *separately* via pendingGuestDraft.
  activateLibraryScope();
  libraryChangeId++;
  reportCloudStatus('Подключаем облачную библиотеку…');
  void loadCloudBuilds();
  if(activeTab==='builds')renderDetails();
  finishBuildAccountEntry();
 },
 onRecoveryAcknowledged:finishBuildAccountEntry,
 onLogout:()=>{
  sharedHashRequestId++;
  returnToBuildsAfterAuth=false;pendingGuestDraft=null;
  // Restore the previous guest's own saves and draft, not a different account's.
  activateLibraryScope();
  libraryChangeId++;
  reportCloudStatus('Войдите, чтобы открыть библиотеку билдов');
  if(activeTab==='builds')renderDetails();
 },
 onGuest:()=>{reportCloudStatus('Войдите, чтобы открыть библиотеку билдов');
  if(activeTab==='builds')renderDetails()}
}).catch(error=>{console.warn('Account UI unavailable',error)});
// Return to a saved library after network loss; an unsaved draft is never uploaded.
let lastCloudReconnect=0;
function resumeCloudLibrary(){
 // An account's builds may exist exclusively in D1 even when the local cache is empty.
 if(!window.PandoraAccountUI?.isLoggedIn())return;
 if(Date.now()-lastCloudReconnect<20000)return;
 lastCloudReconnect=Date.now();
 void loadCloudBuilds();
}
window.addEventListener('online',resumeCloudLibrary);
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible'&&navigator.onLine)resumeCloudLibrary();
});
requestAnimationFrame(syncOriginPanelHeight);
// Main attributes, item effects and formula tables come from the SAME
// published D1 snapshot as equipment. No local table can overwrite it later.
restoreWikiHash();
restoreSharedHash();
if(bootView.open&&bootView.tab!=='wiki'&&!String(location.hash).startsWith('#wiki/')){
 showWorkbench();$('detailContent').scrollTop=Math.max(0,Number(bootView.inner)||0)
}
if(bootView.slotOpen&&!bootView.open){stageSlotPickerOpen=true;renderSlotRails();renderStagePicker()}
requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,Number(bootView.page)||0),behavior:'instant'}));
// Same-document shared-build links are handled by the unified hashchange
// listener above, alongside wiki links. Do not add a second fetch listener.
window.addEventListener('pagehide',saveView);
document.addEventListener('pandora:before-update',saveView);
document.addEventListener('scroll',saveView,{passive:true});
$('skillBranches').addEventListener('scroll',saveView,{passive:true});
$('detailContent').addEventListener('scroll',saveView,{passive:true});
window.addEventListener('popstate',event=>{
 if(location.hash.startsWith('#wiki/')){
  const match=location.hash.match(/^#wiki\/(item|monster|map|npc|chest|skill|soul|instance|honor)\/([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}|war-[a-z][a-z0-9-]{0,35})(?:\/([0-9]{1,15}))?$/);
  if(!match)return;
  const already=activeTab==='wiki'&&wikiSelection.type===match[1]&&
   wikiSelection.id===match[2]&&(wikiSelection.highlight||null)===(match[3]||null)&&
   $('detailPanel')?.classList.contains('is-open');
  if(already)return;
  const same=activeTab==='wiki'&&wikiSelection.type===match[1]&&
   typeof wikiRenderSelected==='function'&&wikiRenderedRoot?.isConnected&&wikiIndex;
  restoreWikiFilters(event.state,match[1],match[2]);
  wikiSelection={type:match[1],id:match[2],highlight:match[3]||null};
  activeTab='wiki';
  for(const btn of document.querySelectorAll('[data-tab]'))
   btn.classList.toggle('active',btn.dataset.tab==='wiki');
  if(same)wikiRenderSelected();else renderDetails();
  if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
  restoreWikiPosition(event.state);
  saveView();
 }else if(event.state?.psWikiList&&!location.hash){
  const chapter=event.state.psWikiList;
  if(!['item','monster','map','npc','chest','skill','soul','instance','honor'].includes(chapter.type))return;
  activeTab='wiki';wikiSelection={type:chapter.type,id:null,highlight:null};
  wikiSearch=typeof chapter.search==='string'?chapter.search:'';
  wikiShown=Number.isInteger(chapter.shown)&&chapter.shown>=100?chapter.shown:100;
  if(chapter.type==='item'&&typeof chapter.itemType==='string')
   wikiItemType=chapter.itemType;
  if(chapter.type==='skill'&&Object.hasOwn(window.PandoraWikiSkillFilters.names,
   chapter.skillFilter||''))wikiSkillFilter=chapter.skillFilter;
  for(const btn of document.querySelectorAll('[data-tab]'))
   btn.classList.toggle('active',btn.dataset.tab==='wiki');
  renderDetails();
  if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
  restoreWikiPosition(event.state);
  saveView();
 }else if(activeTab==='wiki'&&!location.hash.startsWith('#b/')){
  // The previous history entry has no wiki hash. Restore its original view.
  const previous=event.state?.psWikiReturn;
  if(previous?.open&&['wiki','builds','character'].includes(previous.tab)){
   activeTab=previous.tab;
   if(previous.tab==='wiki'){
    if(previous.selection)wikiSelection={...previous.selection};
    wikiSearch=typeof previous.search==='string'?previous.search:'';
    wikiShown=Number.isInteger(previous.shown)&&previous.shown>=100?previous.shown:100;
    if(previous.selection?.type==='item'&&
     typeof event.state?.psWikiPosition?.itemType==='string')
     wikiItemType=event.state.psWikiPosition.itemType;
    if(previous.selection?.type==='skill'&&
     Object.hasOwn(window.PandoraWikiSkillFilters.names,
      previous.skillFilter||''))wikiSkillFilter=previous.skillFilter;
   }
   for(const btn of document.querySelectorAll('[data-tab]'))
    btn.classList.toggle('active',btn.dataset.tab===activeTab);
   renderDetails();
   if(!$('detailPanel')?.classList.contains('is-open'))showWorkbench();
   restoreWikiPosition(event.state);
   saveView();
  }else closeWorkbench();
 }
});
