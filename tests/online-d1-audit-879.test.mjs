import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-app.js');
const portion=(begin,end)=>{
 const start=source.indexOf(begin),stop=source.indexOf(end,start+begin.length);
 assert.ok(start>=0&&stop>start,'expected code section '+begin);
 return source.slice(start,stop);
};

test('a tentative D1 boot never commits migrated character data before source verification',()=>{
 const loader=portion('async function loadCatalog(', 'let ownerWikiRefreshId=');
 assert.match(loader,/async function loadCatalog\(\{archive=false,commit=true\}=\{\}\)/);
 assert.match(loader,/applyGameLocale\(\{persistReconciled:commit\}\)/);
 assert.match(loader,/if\(commit\)persist\(\)/);
 assert.match(loader,/ensureEnglishCatalog\(\{persistReconciled:commit\}\)/);
 const english=portion('async function ensureEnglishCatalog(', 'async function loadCatalog(');
 assert.match(english,/applyGameLocale\(\{persistReconciled\}\)/);
 const overrides=portion('async function loadOverrides(', "$('originTabs').onclick");
 assert.match(overrides,/await refreshOwnerCatalog\(\{persistReconciled:commit\}\)/);
 const boot=portion('async function startStudio(', "$('startupRetry').onclick");
 assert.match(boot,/structuredClone\(state\)/);
 assert.match(boot,/loadCatalog\(\{archive,commit:false\}\)/);
 assert.match(boot,/loadOverrides\(\{strict:true,commit:false\}\)/);
 assert.match(boot,/if\(confirmed.status!=='ready'\)throw Error/);
 assert.match(boot,/if\(libraryScopeId\(\)===draftOwner\)state=originalDraft/);
 assert.ok(boot.indexOf('if(confirmed.status')<boot.indexOf('const draftSaved=persist()'),
  'The final catalog and authorial copy must be verified before local state is committed');
});

test('public keyboard, blur and form events are blocked behind an unverified gate',()=>{
 const guard=portion('function blockUnverifiedInput(event)', "window.addEventListener('offline'");
 for(const kind of ['keydown','click','input','change','submit','blur','focusout'])
  assert.ok(guard.includes("'"+kind+"'"),'must gate '+kind);
 assert.match(guard,/if\(startupOverlay.hidden\|\|startupOverlay.contains\(event.target\)\)return/);
 assert.doesNotMatch(guard,/startupOverlay.classList.contains\('is-finished'\)/,
  'The fade remains modal until the overlay is truly hidden');
 assert.doesNotMatch(guard,/studioLiveReady&&!liveGateReason/,
  'The EN loading overlay is modal even for a D1-verified page');
 assert.match(guard,/startupOverlay.contains\(event.target\)\)return/);
 assert.match(guard,/event.stopImmediatePropagation\(\)/);
 assert.match(source,/setInterval\(\(\)=>\{[\s\S]*?checkLiveConnection\(\);\s*\},45000\)/);
 assert.match(source,/window.addEventListener\('focus'/);
});

test('a remote catalog update is monotonic and preserves unsent owner inline copy',()=>{
 const gate=portion('function pendingOwnerInlineText()', 'function leaveLiveGate()');
 assert.match(gate,/if\(!adminToken\|\|!adminEditing\)return ''/);
 assert.match(gate,/node.isConnected/);
 assert.match(gate,/field.readOnly=true/);
 assert.match(gate,/field.value=text/);
 assert.match(gate,/if\(liveGateReason==='changed'&&kind!=='changed'\)return/);
 const reload=portion('function reloadVerifiedCatalog()', 'function blockUnverifiedInput(event)');
 assert.match(reload,/if\(pendingCopy&&!inlineDraftCopyReady\)/);
 assert.match(reload,/pendingCopy.select\(\)/);
 assert.match(reload,/Я скопировал — перезагрузить/);
 assert.ok(reload.indexOf('if(pendingCopy&&!inlineDraftCopyReady)')<
  reload.indexOf('pandora:before-update'),
  'Owner must acknowledge pending text before any reload/save hook');
});

test('a quota cooldown never postpones the first lock of an active online-only editor',()=>{
 const section=portion('async function checkLiveConnection(', 'function reloadVerifiedCatalog()');
 assert.match(section,/!force&&liveGateReason==='offline'&&quotaCooldown\(\)>0/);
 assert.match(section,/showLiveGate\('offline'\)/);
});

test('account library never reconnects before a verified D1 checkpoint',()=>{
 const login=portion('onLogin:({register})=>{', 'onRecoveryAcknowledged:');
 assert.match(login,/if\(localCatalogHost\|\|studioLiveReady&&!liveGateReason\)void loadCloudBuilds\(\)/);
 const resume=portion('function resumeCloudLibrary(', 'requestAnimationFrame(syncOriginPanelHeight)');
 assert.match(resume,/if\(!localCatalogHost&&\(!studioLiveReady\|\|liveGateReason\)\)return/);
 const reconnect=portion('function leaveLiveGate()', 'async function checkLiveConnection(');
 assert.match(reconnect,/resumeCloudLibrary\(\{force:true\}\)/);
});

test('English locale completion cannot override a later D1 offline/changed gate',()=>{
 const handler=portion("$('locale').onclick=async event=>{",
  "document.addEventListener('click',event=>{if(!adminEditing");
 assert.match(handler,/if\(!localCatalogHost&&\(!studioLiveReady\|\|liveGateReason\)\)return/);
 assert.match(handler,/await checkLiveConnection\(\)/);
 assert.match(handler,/if\(liveGateReason\)return/);
 assert.match(handler,/startupOverlay.dataset.state==='loading'&&!liveGateReason/);
 assert.doesNotMatch(handler,/error\.message,'warning'/,
  'Do not expose a raw Worker or D1 error to ordinary visitors');
});

test('legacy numeric mastery and skill points survive canonical default zeros',()=>{
 const start=source.indexOf('const migrateLegacyBranches=record=>{');
 const end=source.indexOf('state.points=migrateLegacyBranches',start);
 assert.ok(start>0&&end>start);
 const migrate=Function('oldToOS',source.slice(start,end)+
  '\nreturn migrateLegacyBranches;')({'1':'slash','2':'thrust'});
 assert.deepEqual(migrate({'1':5,slash:0}),{slash:5},
  'Nonzero legacy slash investment is retained over an inserted default');
 assert.deepEqual(migrate({'1':5,slash:8}),{slash:8},
  'A meaningful modern value always wins');
 assert.deepEqual(migrate({'2':3,thrust:0,'1':7,slash:0}),
  {thrust:3,slash:7},'Multiple original branches migrate without loss');
 assert.deepEqual(migrate({'1':0,slash:0}),{slash:0});
});

test('owner one-click catalog publication cannot silently replace live hero calculations',()=>{
 const publish=portion('async function showCatalogImport(){','function syncLocaleControls(){');
 assert.match(publish,/afterPublish:async\(\)=>\{/);
 assert.match(publish,/if\(!localCatalogHost&&studioLiveReady\)\{\s*showLiveGate\('changed'\);\s*return;/);
 const pos=publish.indexOf("showLiveGate('changed')");
 const direct=publish.indexOf('await loadCatalog()');
 assert.ok(pos>=0&&direct>pos,'only the localhost fixture may refresh without safe reload');
});

test('D1 retry requested during initial startup is queued once and never races installed data',()=>{
 const boot=portion('let startupAttempt=0,startupRunning=false', 'void window.PandoraAccountUI.init');
 assert.match(boot,/let startupAttempt=0,startupRunning=false,startupQueuedLive=false/);
 assert.match(boot,/if\(startupRunning\)return/);
 assert.match(boot,/finally\{\s*startupRunning=false/);
 assert.match(boot,/if\(startupQueuedLive\)\{\s*startupQueuedLive=false;\s*void startStudio\(\)/);
 assert.match(boot,/if\(startupRunning\)\{startupQueuedLive=true;return\}/);
});

test('published site keeps a single D1-only catalog boundary and no retired archive notice',()=>{
 const load=portion('async function loadCatalog(', 'let ownerWikiRefreshId=');
 assert.match(load,/if\(archive&&typeof location!=='undefined'&&\s*!\['localhost','127\.0\.0\.1'\]\.includes\(location\.hostname\)\)/);
 const wiki=read('pandora-studio-encyclopedia-catalog.js');
 assert.match(wiki,/const localFixtureHost=/);
 assert.match(wiki,/if\(preferLocal&&!localFixtureHost\(\)\)/);
 assert.match(wiki,/if\(strict\|\|!localFixtureHost\(\)\)throw remoteError/);
 assert.doesNotMatch(source,/renderArchiveNotice/);
 assert.doesNotMatch(read('index.html'),/id="siteNotice"/);
 const migration=portion('const migrateLegacyBranches=record=>{','if(lang===\'en\')await ensureEnglishCatalog');
 assert.equal((migration.match(/selectedSkillGroup=window\.PandoraGameNavigation\.branchGroup/g)||[]).length,1,
  'Legacy branch normalization should be a single preserving pass');
});

test('character startup cancels sibling D1 reads on failure and rejects mixed snapshots before commit',()=>{
 const loader=portion('async function loadCatalog(', 'let ownerWikiRefreshId=');
 assert.match(loader,/mapLimit\(names,3,async \(name,_index,batchSignal\)=>/);
 assert.match(loader,/AbortSignal\.any\(\[batchSignal,AbortSignal\.timeout\(30000\)\]\)/);
 assert.match(loader,/if\(!snapshot\)throw Error/);
 assert.match(loader,/snapshots\.add\(snapshot\);\s*if\(snapshots\.size!==1\)\s*throw Error/);
 assert.ok(loader.indexOf('if(snapshots.size!==1)')<loader.indexOf('const payload=await response.json()'),
  'Mixed snapshots must stop before parsing all remaining catalog datasets');
 assert.match(loader,/if\(signal\.aborted\)throw signal\.reason/);
 assert.ok(loader.indexOf('if(!archive&&snapshots.size!==1)')<
   loader.indexOf('catalogSource=data'),
  'Never commit an unverified catalog');
});

test('Wiki and character loaders both reject split D1 snapshots before all JSON parses',()=>{
 const wiki=read('pandora-studio-encyclopedia-catalog.js');
 assert.match(wiki,/batcher\(keys,3,async \(key,_index,batchSignal\)=>/);
 assert.match(wiki,/AbortSignal\.any\(\[groupSignal,deadline\]\)/);
 assert.match(wiki,/typeof batchSignal\.aborted==='boolean'/);
 assert.match(wiki,/typeof batchSignal\.addEventListener==='function'/);
 assert.match(wiki,/if\(!snapshot\)throw Error/);
 assert.match(wiki,/snapshots\.add\(snapshot\);\s*if\(snapshots\.size!==1\)\s*throw Error/);
 assert.ok(wiki.indexOf('if(snapshots.size!==1)')<
  wiki.indexOf('const payload=await response.json()'),
  'Wiki must halt incompatible D1 sources before downloading more content');
 assert.match(wiki,/if\(signal\?\.aborted\)throw signal\.reason/);
});

test('stale Wiki generations and inactive D1 heartbeats cancel pending GETs',async()=>{
 const wiki=portion('let wikiLoadGeneration=0', '// Every navigation entry owns');
 assert.match(wiki,/wikiLoadController\?\.abort/);
 assert.match(wiki,/signal:controller\.signal/);
 assert.match(wiki,/if\(wikiLoadController===controller\)wikiLoadController=null/);
 const heartbeat=portion('function cancelLiveCheckpoint()', 'function reloadVerifiedCatalog()');
 assert.match(heartbeat,/liveCheckpointController\?\.abort/);
 assert.match(heartbeat,/AbortSignal\.any\(\[controller\.signal,AbortSignal\.timeout\(22000\)\]\)/);
 const events=portion("window.addEventListener('offline'", 'let startupAttempt=');
 assert.match(events,/cancelLiveCheckpoint\(\)/);
 assert.match(events,/document\.visibilityState==='hidden'/);
 const calls=[],gates=[];
 // Execute the real production checkpoint function, not a reimplementation.
 // The mock ignores AbortSignal to reproduce the dangerous late response.
 const runtime=Function('window','AbortController','AbortSignal',String.raw`
 let studioLiveReady=true,liveGateReason=null,liveCheckpointId=0,
     liveCheckpointPromise=null,liveCheckpointController=null,liveRetryTimer=null;
 const localCatalogHost=false,adminToken='',API='https://worker.invalid';
 const ownerSaveInFlight=()=>false,quotaCooldown=()=>0,override={},
       activeCatalogSnapshot='snapshot-1',catalogSource={meta:{counts:{items:1}}};
 const showLiveGate=value=>window.__gates.push(value),leaveLiveGate=()=>window.__gates.push('ready');
 const clearTimeout=()=>{};
 `+heartbeat+String.raw`
 return {checkLiveConnection,cancelLiveCheckpoint};
 `)({
  __gates:gates,PandoraStudioOnlineGate:{
   digest:()=>'',inspect:({signal})=>new Promise(resolve=>calls.push({signal,resolve}))
  },PandoraStudioLiveRead:{get:()=>{},resetQuotaCooldown:()=>{}}
 },AbortController,AbortSignal);
 const first=runtime.checkLiveConnection();
 assert.equal(calls.length,1);
 runtime.cancelLiveCheckpoint();
 assert.equal(calls[0].signal.aborted,true,'Old D1 reads must receive abort');
 const second=runtime.checkLiveConnection();
 assert.equal(calls.length,2,'New check must not wait for obsolete request');
 calls[0].resolve({status:'changed'});
 await first;
 assert.deepEqual(gates,[],'Late old response must not block a new checkpoint');
 calls[1].resolve({status:'ready'});
 await second;
 assert.deepEqual(gates,[]);
});
