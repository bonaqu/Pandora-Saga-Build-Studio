import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-update-manager.js');
const localeSource=read('pandora-studio-ui-locale.js');
function boot(local,remote,href='https://bonaqu.github.io/Pandora-Saga-Build-Studio/',locale='ru',ownerGuard=null){
 let banner=null,check=null,normalized=null,navigated=null,saved=0,languageChanged=null;
 let currentRemote=remote,holdResponses=false,saveAllowed=true,lastEventCancelable=null;
 let guard=null,accountPanelOpen=false,heroBookOpen=false,onlineRecoveryOpen=false,
  ownerMode=false,inlineEditing=false,overlayVisible=false,activeEditable=null,now=Date.now();
 const intervals=[];
 const localeContext={};localeContext.window=localeContext;
 runInNewContext(localeSource,localeContext);
 const uiLocale=localeContext.PandoraUILocale;
 class Clock extends Date{static now(){return now}}
 const heldRequests=[],heldBodies=[];
 let holdBodies=false,requestCount=0;
 const document={
  documentElement:{lang:locale},
  get activeElement(){return activeEditable},
  querySelector:selector=>selector==='meta[name="ps-studio-release"]'?{content:local}:
   (selector.includes('#accountPanel:not([hidden])')&&accountPanelOpen||
   selector.includes('#stageAttributes:not([hidden])')&&heroBookOpen||
   selector.includes('#startupOverlay:not([hidden])')&&overlayVisible||
   selector.includes('.inline-owner-editor')&&inlineEditing)?{}:null,
  addEventListener(){},dispatchEvent(event){saved++;lastEventCancelable=event.cancelable;return saveAllowed},getElementById(id){return id==='studio-update-banner'&&!banner?.removed?banner:null},
  createElement:tag=>({
   tag,children:[],listeners:{},attrs:{},
   setAttribute(key,value){this.attrs[key]=String(value)},
   getAttribute(key){return this.attrs[key]??null},
   removeAttribute(key){delete this.attrs[key]},
   addEventListener(name,fn){this.listeners[name]=fn},
   append(...items){this.children.push(...items)},
   remove(){this.removed=true}
  }),
  body:{classList:{contains:name=>name==='studio-live-blocked'&&onlineRecoveryOpen},
   appendChild(node){banner=node}},visibilityState:'visible'
 };
 const location={href,replace:url=>{navigated=url}};
 const history={state:null,replaceState:(_state,_title,url)=>{normalized=url}};
 const appWindow={PandoraAccountUI:{updateGuard:()=>guard},
  PandoraStudioAdminActive:ownerGuard||(()=>ownerMode),PandoraUILocale:uiLocale};
 runInNewContext(source,{
  window:appWindow,document,location,history,URL,AbortController,Date:Clock,
  Event:class Event{constructor(_type,options){this.cancelable=!!options?.cancelable}},console,
  MutationObserver:class MutationObserver {
   constructor(fn){languageChanged=fn}observe(){}
  },
  fetch:async()=>{
   requestCount++;
   if(holdResponses)return new Promise(resolve=>heldRequests.push(resolve));
   return {ok:true,json:()=>holdBodies?
    new Promise(resolve=>heldBodies.push(resolve)):Promise.resolve({release:currentRemote})};
  },
  setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length},
  setTimeout:(fn,delay)=>{if(delay===3000)check=fn;return 1},
  clearTimeout:()=>{}
 });
 return{
  check:()=>check(),
  refreshBanner:()=>appWindow.PandoraStudioUpdateBanner?.refresh?.(),
  setRemote:release=>{currentRemote=release},
  setOverrides:values=>uiLocale.setOverrides(values),
  setSaveAllowed:value=>{saveAllowed=value},
  setAccountGuard:value=>{guard=value},
  setAccountPanelOpen:value=>{accountPanelOpen=value},
  setHeroBookOpen:value=>{heroBookOpen=value},
  setOnlineRecovery:value=>{onlineRecoveryOpen=value},
  setOverlayVisible:value=>{overlayVisible=value},
  setOwnerMode:value=>{ownerMode=value},
  setInlineEditing:value=>{inlineEditing=value},
  setActiveEditable:selector=>{activeEditable=selector?{
   closest:query=>query.includes('[contenteditable]')?selector:null
  }:null},
  holdBodyReads:()=>{holdBodies=true},
  heldBodyCount:()=>heldBodies.length,
  resolveBody:(index,release)=>heldBodies[index]({release}),
  get requestCount(){return requestCount},
  advance:ms=>{now+=ms},
  checkAuto:()=>intervals.find(x=>x.ms===15000)?.fn(),
  holdChecks:()=>{holdResponses=true},
  heldCount:()=>heldRequests.length,
  resolveCheck:(index,release)=>heldRequests[index]({
   ok:true,json:async()=>({release})
  }),
  setLocale:language=>{document.documentElement.lang=language;languageChanged?.()},
  get banner(){return banner},get normalized(){return normalized},
  get navigated(){return navigated},get saved(){return saved},
  get lastEventCancelable(){return lastEventCancelable}
 };
}
test('cache-busted navigation restores canonical URL without a second fetch',()=>{
 const page=boot('2026.10.30.76','2026.10.30.76',
  'https://bonaqu.github.io/Pandora-Saga-Build-Studio/?ps-revision=2026.10.30.76&foo=1#hero');
 assert.equal(page.normalized,'/Pandora-Saga-Build-Studio/?foo=1#hero');
 assert.equal(page.navigated,null);
});
test('stale and equal manifests cannot offer a downgrade',async()=>{
 for(const remote of ['2026.10.30.71','2026.10.30.75','2026.10.30.76']){
  const page=boot('2026.10.30.76',remote);
  await page.check();assert.equal(page.banner,null,remote);
 }
});
test('newer manifest prompts for refresh and preserves cache bypass on request',async()=>{
 const page=boot('2026.10.30.75','2026.10.30.76');
 await page.check();
 assert.ok(page.banner,'update prompt must exist');
 page.banner.children[1].listeners.click();
 assert.match(page.navigated,/ps-revision=2026\.10\.30\.76/);
 assert.equal(page.saved,1,'existing build-save event is retained');
});
test('release manifest and rendered HTML have the same version',()=>{
 const manifest=JSON.parse(read('site-version.json'));
 const html=read('index.html');
 const metadata=JSON.parse(read('package.json'));
 assert.equal(html.match(/name="ps-studio-release" content="([^"]+)"/)?.[1],manifest.release);
 assert.equal(metadata.pandoraRelease,manifest.release);
 assert.equal(html.match(/pandora-studio-theme\.css\?v=([^"]+)"/)?.[1],manifest.release);
});

test('site update notice uses separate RU/EN D1 copy and security guards stay fixed',async()=>{
 const page=boot('2026.11.18.889','2026.11.18.890');
 page.setOverrides({
  'guideedit.book.ui.label.site-update-notice':JSON.stringify({
   ru:'Новое обновление из D1 без потери билда',
   en:'Cloud-authored update without losing your build'
  }),
  'guideedit.book.ui.label.site-update-apply':JSON.stringify({
   ru:'Обновить сейчас',en:'Apply update'
  })
 });
 await page.check();
 const [message,apply,later]=page.banner.children;
 assert.equal(message.textContent,'Новое обновление из D1 без потери билда');
 assert.equal(message.getAttribute('data-owner-copy-key'),'siteUpdateNotice');
 assert.equal(apply.textContent,'Обновить сейчас');
 assert.equal(apply.getAttribute('data-owner-copy-key'),'siteUpdateApply');
 assert.equal(later.getAttribute('data-owner-copy-key'),'siteUpdateLater');
 page.setLocale('en');
 assert.equal(message.textContent,'Cloud-authored update without losing your build');
 assert.equal(apply.textContent,'Apply update');
 assert.equal(later.textContent,'Later');
 page.setAccountGuard('recovery');
 apply.listeners.click();
 assert.equal(page.navigated,null);
 assert.match(message.textContent,/recovery code/);
 assert.equal(message.getAttribute('data-owner-copy-key'),null,
  'A security-sensitive recovery warning is never an editorial D1 caption');
});

test('owner pencils inserted beside captions cannot reorder real update actions',async()=>{
 const page=boot('2026.11.18.889','2026.11.18.890');
 await page.check();
 const banner=page.banner,[message,apply,later]=banner.children;
 // Real owner mode inserts independent buttons between these three nodes.
 banner.children.splice(1,0,{textContent:'✎'},apply,{textContent:'✎'});
 // The original apply and later buttons must still be refreshed by reference.
 page.setLocale('en');
 assert.equal(message.textContent,'A new version is available. Your current build and page position will be saved before updating.');
 assert.equal(apply.textContent,'Update');
 assert.equal(later.textContent,'Later');
 apply.listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]18[.]890/);
});

test('Later dismisses the current release but not a newer publication',async()=>{
 const page=boot('2026.11.07.436','2026.11.07.437');
 await page.check();
 assert.ok(page.banner);
 const dismissed=page.banner;
 dismissed.children[2].listeners.click();
 assert.equal(dismissed.removed,true);
 await page.check();
 assert.equal(page.banner,dismissed,'Do not nag for the same dismissed version');
 page.setRemote('2026.11.07.438');
 await page.check();
 assert.notEqual(page.banner,dismissed,'A later release must become visible');
 assert.equal(page.banner.children[1].textContent,'Обновить');
 page.banner.children[1].listeners.click();
 assert.match(page.navigated,/ps-revision=2026\.11\.07\.438/);
 assert.equal(page.saved,1);
});
test('the update prompt respects EN and live language changes without a page reload',async()=>{
 const page=boot('2026.11.07.436','2026.11.07.437',undefined,'en');
 await page.check();
 assert.equal(page.banner.children[1].textContent,'Update');
 assert.equal(page.banner.children[2].textContent,'Later');
 assert.match(page.banner.children[0].textContent,/new version/);
 page.setLocale('ru');
 assert.equal(page.banner.children[1].textContent,'Обновить');
 assert.equal(page.banner.children[2].textContent,'Позже');
 page.setLocale('en');
 assert.equal(page.banner.children[1].textContent,'Update');
});

test('Later dismisses the newest release even when the original banner is older',async()=>{
 const page=boot('2026.11.07.440','2026.11.07.441');
 await page.check();
 const original=page.banner;
 page.setRemote('2026.11.07.442');
 await page.check();
 assert.equal(page.banner,original,'Keep the existing banner rather than duplicate it');
 original.children[2].listeners.click();
 assert.equal(original.removed,true);
 await page.check();
 assert.equal(page.banner,original,'Do not immediately re-prompt the dismissed latest');
 page.setRemote('2026.11.07.443');
 await page.check();
 assert.notEqual(page.banner,original,'A third publication still offers an update');
});
test('single-flight version checks and later stale manifests cannot downgrade the update target',async()=>{
 const page=boot('2026.11.07.440','2026.11.07.441');
 page.holdChecks();
 const first=page.check(),overlap=page.check();
 assert.equal(page.heldCount(),1,'Overlapping polls must share one network request');
 page.resolveCheck(0,'2026.11.07.443');
 await Promise.all([first,overlap]);
 assert.ok(page.banner);
 const stale=page.check();
 assert.equal(page.heldCount(),2,'Future checks resume after the pending response');
 page.resolveCheck(1,'2026.11.07.442');
 await stale;
 page.banner.children[1].listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]07[.]443/,
  'A later, stale response cannot downgrade the offered release');
 assert.equal(page.saved,1);
});

test('parallel version polls coalesce while the manifest body remains pending',async()=>{
 const page=boot('2026.11.18.884','2026.11.18.885');
 page.holdBodyReads();
 const first=page.check();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(page.heldBodyCount(),1,'The first response started reading JSON');
 await page.check();
 assert.equal(page.requestCount,1,'Body read remains part of the active request');
 assert.equal(page.banner,null,'No update before complete JSON');
 page.resolveBody(0,'2026.11.18.885');
 await first;
 assert.ok(page.banner,'A complete manifest offers the update');
 const later=page.check();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(page.requestCount,2,'A future poll is allowed after completion');
 page.resolveBody(1,'2026.11.18.885');
 await later;
});

test('manual update respects D1 overlay, active owner edits and UI panels',async()=>{
 const page=boot('2026.11.18.884','2026.11.18.885');
 await page.check();
 const click=()=>page.banner.children[1].listeners.click();
 const pointer=()=>{let prevented=false;
  page.banner.children[1].listeners.pointerdown({preventDefault(){prevented=true}});
  return prevented;
 };
 page.setOverlayVisible(true);
 assert.equal(pointer(),true,'Do not blur the last unsent owner edit behind overlay');
 click();
 assert.equal(page.navigated,null);
 assert.equal(page.saved,0);
 assert.match(page.banner.children[0].textContent,/восстанови игровые данные/i);
 page.setOverlayVisible(false);
 page.setOwnerMode(true);
 assert.equal(pointer(),true);
 click();
 assert.equal(page.navigated,null);
 assert.match(page.banner.children[0].textContent,/выйди из режима владельца/i);
 page.setOwnerMode(false);
 page.setInlineEditing(true);
 assert.equal(pointer(),true);
 click();
 assert.equal(page.navigated,null);
 assert.match(page.banner.children[0].textContent,/закрой открытые окна/i);
 page.setInlineEditing(false);
 assert.equal(pointer(),false);
 click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]18[.]885/);
 assert.equal(page.saved,1);
});

test('a failed local save cancels the update without hiding the retry action',async()=>{
 const page=boot('2026.11.07.452','2026.11.07.453');
 await page.check();
 page.setSaveAllowed(false);
 page.banner.children[1].listeners.click();
 assert.equal(page.navigated,null,'Do not navigate when the save hook vetoes');
 assert.equal(page.lastEventCancelable,true,'The save hook must be cancelable');
 assert.equal(page.saved,1);
 assert.equal(page.banner.removed,undefined,'Keep the banner for an explicit retry');
 page.setSaveAllowed(true);
 page.banner.children[1].listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]07[.]453/);
 assert.equal(page.saved,2,'A user may retry the update after restoring storage');
});

test('a one-time recovery code blocks manual and idle updates until acknowledged',async()=>{
 const page=boot('2026.11.08.488','2026.11.08.489');
 await page.check();
 page.setAccountGuard('recovery');
 page.banner.children[1].listeners.click();
 assert.equal(page.navigated,null,'Recovery code must survive an explicit update');
 assert.equal(page.saved,0,'No draft save should be initiated while a secret is at risk');
 assert.match(page.banner.children[0].textContent,/резервный код/);
 page.setLocale('en');
 assert.match(page.banner.children[0].textContent,/recovery code/);
 page.advance(121000);
 page.checkAuto();
 assert.equal(page.navigated,null,'Idle reload must not consume an unacknowledged code');
 page.setAccountGuard(null);
 page.banner.children[1].listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]08[.]489/);
 assert.equal(page.saved,1);
});
test('account requests, password drafts, and open account panels block idle upgrade',async()=>{
 const page=boot('2026.11.08.488','2026.11.08.489');
 await page.check();
 page.advance(121000);
 for(const guard of ['request','draft']){
  page.setAccountGuard(guard);
  page.checkAuto();
  assert.equal(page.navigated,null);
 }
 page.setAccountGuard(null);
 page.setAccountPanelOpen(true);
 page.checkAuto();
 assert.equal(page.navigated,null,'Open account profile must block silent reload');
 page.setAccountPanelOpen(false);
 page.checkAuto();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]08[.]489/);
});

test('idle update waits until an open Hero Book is closed',async()=>{
 const page=boot('2026.11.09.580','2026.11.09.581');
 await page.check();
 assert.ok(page.banner,'New release remains available to apply manually');
 page.advance(121000);
 page.setHeroBookOpen(true);
 page.checkAuto();
 assert.equal(page.navigated,null,'Reading Hero Book must not trigger silent reload');
 assert.equal(page.saved,0,'Reading does not perform an unnecessary draft save');
 page.setHeroBookOpen(false);
 page.checkAuto();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]09[.]581/);
 assert.equal(page.saved,1,'Existing before-update save still runs after closing');
});

test('an active D1 recovery overlay blocks automatic site upgrades until reconnect',async()=>{
 const page=boot('2026.11.17.877','2026.11.18.878');
 await page.check();
 assert.ok(page.banner);
 page.advance(121000);
 page.setOnlineRecovery(true);
 page.checkAuto();
 assert.equal(page.navigated,null,'Never reload away from the last in-memory hero while D1 recovery is open');
 assert.equal(page.saved,0,'No automatic save or navigation during a D1 outage');
 page.setOnlineRecovery(false);
 page.checkAuto();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]18[.]878/);
 assert.equal(page.saved,1,'After reconnect the existing safe-save hook remains required');
});

test('manual and idle updates protect focused plaintext-only contenteditable drafts',async()=>{
 const page=boot('2026.11.18.891','2026.11.18.892');
 await page.check();
 const apply=page.banner.children[1];
 page.setActiveEditable({contentEditable:'plaintext-only'});
 let blocked=false;
 apply.listeners.pointerdown({preventDefault(){blocked=true}});
 assert.equal(blocked,true,'Pointerdown cannot blur and auto-save a plaintext-only draft');
 apply.listeners.click();
 assert.equal(page.navigated,null,'Manual update must not discard the draft');
 assert.equal(page.saved,0,'No before-update save may run while editing');
 page.advance(121000);
 page.checkAuto();
 assert.equal(page.navigated,null,'Idle update must also respect focused contenteditable');
 page.setActiveEditable(null);
 apply.listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]18[.]892/);
 assert.equal(page.saved,1);
});

function productionOwnerSession(){
 // Execute the actual owner status function and its real pending-write
 // dependency, rather than reproducing the faulty behavior in a mock.
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function ownerSaveInFlight(){');
 const end=app.indexOf('function ownerCanStartAdminOperation(){',start);
 const declaration=app.split('\n').find(line=>line.startsWith('window.PandoraStudioAdminActive='));
 assert.ok(start>=0&&end>start&&declaration,'Owner update contract missing');
 const state={window:{},adminToken:'a'.repeat(43),adminEditing:false,
  editIsSaving:false,ownerWritePendingCount:0,wikiLabelPendingWrites:0,
  ownerGuidePendingWrites:0,wikiRecordWriteQueue:new Map(),ownerSaveState:'ready'};
 runInNewContext(app.slice(start,end)+declaration,state);
 return state;
}
test('owner Finish releases update with a retained token while real D1 CAS writes block it',async()=>{
 const owner=productionOwnerSession();
 const page=boot('2026.11.18.897','2026.11.18.898',undefined,'ru',
  ()=>owner.window.PandoraStudioAdminActive());
 await page.check();
 const [message,apply]=page.banner.children;
 owner.adminEditing=true;
 apply.listeners.click();
 assert.equal(page.navigated,null,'Active owner mode must block navigation');
 assert.match(message.textContent,/выйди из режима владельца/i);
 owner.adminEditing=false; // Finish keeps owner credentials for re-entry.
 assert.ok(owner.adminToken);
 owner.ownerWritePendingCount=1;
 page.refreshBanner();
 assert.match(message.textContent,/выйди из режима владельца/i,
  'D1 writes still prohibit a refresh after editing ends');
 apply.listeners.click();
 assert.equal(page.navigated,null);
 owner.ownerWritePendingCount=0;
 page.refreshBanner();
 assert.match(message.textContent,/Новая версия опубликована/);
 apply.listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]18[.]898/);
 assert.equal(page.saved,1,'The current build/library save hook still runs');
});
test('idle update works after Finish but waits for queued owner records',async()=>{
 const owner=productionOwnerSession();
 const page=boot('2026.11.18.897','2026.11.18.898',undefined,'ru',
  ()=>owner.window.PandoraStudioAdminActive());
 await page.check();
 page.advance(121000);
 owner.wikiRecordWriteQueue.set('npc:4',Promise.resolve());
 page.checkAuto();
 assert.equal(page.navigated,null,'Queued D1 record writes veto idle navigation');
 owner.wikiRecordWriteQueue.clear();
 page.checkAuto();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]18[.]898/);
 assert.equal(page.saved,1);
});
