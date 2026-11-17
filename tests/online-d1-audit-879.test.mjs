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
 assert.ok(boot.indexOf('if(confirmed.status')<boot.indexOf('  persist();'),
  'The final catalog and authorial copy must be verified before local state is committed');
});

test('public keyboard, blur and form events are blocked behind an unverified gate',()=>{
 const guard=portion('function blockUnverifiedInput(event)', "window.addEventListener('offline'");
 for(const kind of ['keydown','click','input','change','submit','blur','focusout'])
  assert.ok(guard.includes("'"+kind+"'"),'must gate '+kind);
 assert.match(guard,/if\(localCatalogHost\|\|startupOverlay.hidden/);
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

test('account library never reconnects before a verified D1 checkpoint',()=>{
 const login=portion('onLogin:({register})=>{', 'onRecoveryAcknowledged:');
 assert.match(login,/if\(localCatalogHost\|\|studioLiveReady&&!liveGateReason\)void loadCloudBuilds\(\)/);
 const resume=portion('function resumeCloudLibrary(', 'requestAnimationFrame(syncOriginPanelHeight)');
 assert.match(resume,/if\(!localCatalogHost&&\(!studioLiveReady\|\|liveGateReason\)\)return/);
 const reconnect=portion('function leaveLiveGate()', 'async function checkLiveConnection()');
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
