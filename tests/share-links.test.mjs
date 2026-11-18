import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('share links use random short immutable IDs and public endpoints',()=>{
 const worker=read('worker/index.js'),migration=read('worker/migrations/0003_shares.sql');
 assert.match(worker,/\/api\/shared/);
 assert.match(worker,/const id=b64\(random\(8\)\)/);
 assert.match(worker,/if\(existing\?\.id\)return json\(\{ok:true,id:existing\.id,reused:true\}\)/);
 assert.match(worker,/shared_build_limits/);
 assert.match(worker,/JSON\.stringify\(\{schema:1,type:'build',data:stored\.data\}\)/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS shared_build_sources/);
 assert.match(worker,/FOREIGN KEY\(share_id\)/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS shared_builds/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS shared_build_limits/);
});
test('sharing never replaces an existing build without explicit choice',()=>{
 const src=read('pandora-studio-app.js');
 assert.match(src,/function openSharedSnapshot\(/);
 assert.match(src,/Сохранить текущий и открыть/);
 assert.match(src,/Открыть без сохранения/);
 assert.match(src,/Отмена/);
 assert.match(src,/saveBuild\(state\.name\|\|currentName,savedCurrent\?\.id\|\|null\)/);
 assert.match(src,/function restoreSharedHash\(/);
 assert.match(src,/window\.addEventListener\('hashchange'/);
 assert.equal((src.match(/window\.addEventListener\('hashchange'/g)||[]).length,1,
  'shared-build and wiki navigation must share one hashchange listener');
 assert.match(src,/const currentRequest=\+\+sharedHashRequestId/);
 assert.match(src,/currentRequest===sharedHashRequestId&&\s*window\.PandoraAccountUI\?\.token\(\)===sessionToken&&location\.hash/);
 assert.match(src,/currentRequest!==sharedHashRequestId\|\|\s*window\.PandoraAccountUI\?\.token\(\)!==sessionToken\|\|\s*location\.hash/);
});
test('share links display alongside saved builds with an inline copy fallback',()=>{
 const src=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(src,/class:'build-share-slot'/);
 assert.match(src,/createShared\(b,shareSlot\)/);
 assert.match(src,/const target=currentHost\(\);\s*if\(target\)\{\s*target\.replaceChildren\(message\);/);
 assert.match(src,/if\(adminEditing&&adminToken\)bindAccountCopyEditors\(message\)/,
  'Only an active administrator may bind share-result editorial controls');
 assert.match(src,/field\.focus\(\);field\.select\(\)/);
 assert.match(src,/isVerifiedSharedBuild\(check\?\.share,expectedData\)/);
 assert.match(src,/const pendingShareRequests=new Map\(\)/);
 assert.match(src,/previous\.revision===build\.at/);
 assert.match(src,/previous\.host=host/);
 assert.match(src,/previous\.reconnect\?\.\(\)/);
 assert.match(src,/if\(!currentRequest\(\)\)return/);
 assert.match(src,/if\(pendingShareRequests\.get\(requestKey\)===operation\)/);
 assert.match(css,/\.build-share-slot/);
});
test('library maintains an offline cache and D1 sync without JSON import/export',()=>{
 const src=read('pandora-studio-app.js'),html=read('index.html');
 assert.match(src,/ps-build-library\.v1/);
 assert.match(src,/persistBuilds\(\)/);
 assert.match(src,/function loadCloudBuilds\(/);
 assert.doesNotMatch(src,/text:'⇩ Экспорт JSON'/);
 assert.doesNotMatch(src,/text:'⇧ Импорт JSON'/);
 assert.match(html,/data-tab="builds"/);
});
test('skill and stat editing remain in one screen',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 assert.doesNotMatch(html,/data-tab="(?:skills|stats)"/);
 assert.match(app,/PandoraHeroPath\.viewGrowth/);
 assert.match(html,/data-origin-tab="stats"/);
});

test('opening a local named build keeps all old and future fields; shared Astir builds keep displaced legwear',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function prepareSavedBuildSnapshot\(raw\)/);
 assert.match(app,/const draft=structuredClone\(raw\),base=fresh\(\)/);
 assert.match(app,/next=prepareSavedBuildSnapshot\(latest\.data\)/);
 assert.match(app,/if\(!switchActiveDraft\(next,latest\.id\)\)return false/);
 assert.match(app,/state=snapshot;/);
 assert.match(app,/const previousLegwear=item\(original\.displacedLegwear\)/);
 assert.match(app,/safe\.displacedLegwear=previousLegwear/);
});

test('health endpoint exposes D1 sharing readiness without claiming feature deployed',()=>{
 const worker=read('worker/index.js');
 assert.match(worker,/features:\{sharing:sharingReady,catalog:catalogPublished,library:found\.has\('private_builds'\),/);
 assert.match(worker,/accounts:\['user_accounts','user_sessions','user_registration_limits'\]/);
 assert.match(worker,/Хранилище коротких ссылок не подготовлено: нужна миграция D1/);
 assert.match(worker,/return no\('Хранилище коротких ссылок не подготовлено: нужна миграция D1',503\)/);
});

test('shared racial passive IDs retain original OS values above one million',()=>{
 const s=read('pandora-studio-app.js');
 assert.match(s,/Number\.isSafeInteger\(original\.racialPassiveId\)/);
 assert.match(s,/original\.racialPassiveId<10000000000/);
});

test('public share preserves separate blue Potential and green Adeptness',()=>{
 const s=read('pandora-studio-app.js');
 assert.match(s,/safe\.masteryAuto=original\.masteryAuto!==false/);
 assert.match(s,/safe\.mastery\[key\]=Math\.min\(level,90\)/);
 assert.match(s,/safe\.masteryFormat=original\.masteryFormat===2\?2:1/);
 // The actual preview calculator still receives trained combat mastery,
 // which is reflected in the compared outcomes without adding a skill row.
 assert.match(s,/PandoraSkillProgression\.combatMasteries\(snap,initialBranches,caps\)/);
 assert.match(s,/PandoraBuildComparison\.compactResults\(/);
});


function shareHarness(){
 // Execute the real production share function with a deterministic in-memory
 // DOM, mock account identity and delayed POST/GET. Never access production D1.
 const source=read('pandora-studio-app.js');
 const begin=source.indexOf('function isVerifiedSharedBuild(');
 const end=source.indexOf('function openSharedSnapshot(share){',begin);
 assert.ok(begin>0&&end>begin,'Production sharing function not found');
 let token='t'.repeat(43),owner='account:alice_01';
 const calls=[],clipboard=[],postQueue=[],getQueue=[];
 const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{
  resolve=yes;reject=no;});return {promise,resolve,reject};};
 const h=(tag,attrs={},children=[])=>({
  tag,attrs,textContent:attrs.text||'',children:Array.isArray(children)?children:[children],
  append(...nodes){this.children.push(...nodes)},
  replaceChildren(...nodes){this.children=nodes},
  focus(){},select(){}
 });
 const window={PandoraAccountUI:{token:()=>token},PandoraUILocale:{
  localize(){},ui(value){return value}
 }};
 const makeHost=()=>({isConnected:true,renders:[],replaceChildren(...nodes){
  this.current=nodes[0];this.renders.push(this.current);
 }});
 const host=makeHost();
 const apiRequest=(path,body,auth)=>{
  calls.push({path,body,auth});
  const waiting=deferred();
  (path==='/api/shared'?postQueue:getQueue).push(waiting);
  return waiting.promise;
 };
 const build={id:'a'.repeat(32),name:'Snapshot',at:1,
  data:{race:0,job:0,level:45}};
 const createShared=Function('window','libraryScopeId','requireBuildAccount',
  'h','adminEditing','adminToken','bindAccountCopyEditors','sanitizeSharedState',
  'apiRequest','location','navigator','lang',
  source.slice(begin,end)+'\nreturn createShared;')(
   window,()=>owner,()=>true,h,false,'',()=>{},data=>data,apiRequest,
   {origin:'https://example.com',pathname:'/studio/'},
   {clipboard:{writeText:async text=>{clipboard.push(text)}}},'ru');
 return {createShared,host,makeHost,build,calls,clipboard,postQueue,getQueue,
  setToken:value=>{token=value},setOwner:value=>{owner=value}};
}
const shareReadback=level=>({share:{schema:1,type:'build',
 data:{race:0,job:0,level}}});
const tick=async()=>{await Promise.resolve();await Promise.resolve()};

test('one Share click per host publishes once and confirms the captured build snapshot',async()=>{
 const s=shareHarness();
 const first=s.createShared(s.build,s.host);
 const repeated=s.createShared(s.build,s.host);
 assert.equal(s.calls.length,1,'Fast repeated clicks must not create duplicate POSTs');
 assert.equal(s.postQueue.length,1);
 s.build.data.level=56; // Editor changed while cloud publication is pending.
 s.postQueue[0].resolve({id:'A1234567890'});
 await tick();
 assert.equal(s.getQueue.length,1);
 assert.equal(s.calls[1].auth,'t'.repeat(43),'The readback uses the captured token');
 s.getQueue[0].resolve(shareReadback(45));
 await Promise.all([first,repeated]);
 assert.equal(s.host.current.attrs.class,'share-result',
  'A valid server snapshot is compared against the original saved record');
 assert.equal(s.calls.length,2);
 assert.equal(s.host.current.children[1].attrs.value,
  'https://example.com/studio/#b/A1234567890');
 s.setToken('u'.repeat(43));
 await s.host.current.children[2].attrs.onclick();
 assert.equal(s.clipboard.length,0,'A stale owner cannot copy another account share');
});

test('account switching before the POST resolves cancels GET and stale UI mutations',async()=>{
 const s=shareHarness(),pending=s.createShared(s.build,s.host);
 const original=s.host.current;
 s.setToken('u'.repeat(43));s.setOwner('account:bob_02');
 s.postQueue[0].resolve({id:'A1234567890'});
 await pending;
 assert.equal(s.calls.length,1,'No verification read is sent under the new account');
 assert.equal(s.host.current,original,'An old owner reply cannot paint the new account UI');
});

test('late GET failure after logout is ignored and a detached card stays unchanged',async()=>{
 const s=shareHarness(),pending=s.createShared(s.build,s.host);
 s.postQueue[0].resolve({id:'A1234567890'});
 await tick();
 assert.equal(s.getQueue.length,1);
 const prior=s.host.renders.length;
 s.host.isConnected=false;
 s.setToken(null);
 s.getQueue[0].reject(Error('Revoked old session'));
 await pending;
 assert.equal(s.host.renders.length,prior,
  'A deleted card cannot show a stale link or stale error');
});

test('failed link verification is retryable, without duplicate pending network writes',async()=>{
 const s=shareHarness();
 const one=s.createShared(s.build,s.host);
 s.createShared(s.build,s.host);
 s.postQueue[0].resolve({id:'A1234567890'});
 await tick();
 s.getQueue[0].resolve(shareReadback(1));
 await one;
 assert.equal(s.host.current.attrs.class,'share-editorial-row build-share-error');
 assert.equal(s.calls.length,2);
 const retry=s.createShared(s.build,s.host);
 assert.equal(s.postQueue.length,2,'Finished failure clears the per-card lock');
 s.postQueue[1].resolve({id:'A1234567890',reused:true});
 await tick();
 s.getQueue[1].resolve(shareReadback(45));
 await retry;
 assert.equal(s.host.current.attrs.class,'share-result');
});

test('share proof follows the latest DOM card without another POST or GET',async()=>{
 const s=shareHarness(),first=s.createShared(s.build,s.host);
 s.postQueue[0].resolve({id:'A1234567890'});
 await tick();
 assert.equal(s.getQueue.length,1);
 // Locale switches and library refreshes unmount the original saved card.
 s.host.isConnected=false;
 const latest=s.makeHost();
 await s.createShared({...s.build},latest);
 assert.equal(s.calls.length,2,'Rerender must not republish the same revision');
 assert.match(latest.current.children[0].textContent,/^Создаём ссылку/);
 s.getQueue[0].resolve(shareReadback(45));
 await first;
 assert.equal(latest.current.attrs.class,'share-result',
  'Only the newly mounted card receives the already verified link');
 assert.equal(s.host.renders.length,1,
  'Detached cards cannot be updated by an older async request');
});

test('newly overwritten saved revision supersedes old proof without stale unlock',async()=>{
 const s=shareHarness(),older=s.createShared(s.build,s.host);
 s.postQueue[0].resolve({id:'A1234567890'});
 await tick();
 s.build.at=2;s.build.data.level=46;
 const newerHost=s.makeHost(),newer=s.createShared(s.build,newerHost);
 assert.equal(s.postQueue.length,2,'New saved revision can publish new snapshot');
 s.getQueue[0].resolve(shareReadback(45));
 await older;
 // The old finally cannot delete the newer revision's in-flight map entry.
 await s.createShared(s.build,newerHost);
 assert.equal(s.postQueue.length,2,'Retired request cannot release newer lock');
 s.postQueue[1].resolve({id:'B1234567890'});
 await tick();
 s.getQueue[1].resolve(shareReadback(46));
 await newer;
 assert.equal(newerHost.current.attrs.class,'share-result');
 assert.equal(newerHost.current.children[1].attrs.value,
  'https://example.com/studio/#b/B1234567890');
 assert.notEqual(s.host.current.attrs.class,'share-result',
  'Old card must not gain an obsolete URL after a newer revision wins');
});

test('new account session does not inherit a pending share from an expired token',async()=>{
 const s=shareHarness(),older=s.createShared(s.build,s.host);
 s.setToken('u'.repeat(43));
 const newerHost=s.makeHost(),newer=s.createShared(s.build,newerHost);
 assert.equal(s.postQueue.length,2,'Fresh session may share its own revision');
 s.postQueue[0].resolve({id:'A1234567890'});
 await older;
 assert.equal(s.getQueue.length,0,'Old token must not verify under the new one');
 s.postQueue[1].resolve({id:'C1234567890'});
 await tick();
 assert.equal(s.calls.at(-1).auth,'u'.repeat(43));
 s.getQueue[0].resolve(shareReadback(45));
 await newer;
 assert.equal(newerHost.current.attrs.class,'share-result');
});
