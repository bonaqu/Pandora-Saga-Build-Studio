import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-update-manager.js');
function boot(local,remote,href='https://bonaqu.github.io/Pandora-Saga-Build-Studio/',locale='ru'){
 let banner=null,check=null,normalized=null,navigated=null,saved=0,languageChanged=null;
 let currentRemote=remote,holdResponses=false,saveAllowed=true,lastEventCancelable=null;
 const heldRequests=[];
 const document={
  documentElement:{lang:locale},
  querySelector:selector=>selector==='meta[name="ps-studio-release"]'?{content:local}:null,
  addEventListener(){},dispatchEvent(event){saved++;lastEventCancelable=event.cancelable;return saveAllowed},getElementById(id){return id==='studio-update-banner'&&!banner?.removed?banner:null},
  createElement:tag=>({
   tag,children:[],listeners:{},setAttribute(){},
   addEventListener(name,fn){this.listeners[name]=fn},
   append(...items){this.children.push(...items)},
   remove(){this.removed=true}
  }),
  body:{appendChild(node){banner=node}},visibilityState:'visible'
 };
 const location={href,replace:url=>{navigated=url}};
 const history={state:null,replaceState:(_state,_title,url)=>{normalized=url}};
 runInNewContext(source,{
  window:{},document,location,history,URL,AbortController,Date,
  Event:class Event{constructor(_type,options){this.cancelable=!!options?.cancelable}},console,
  MutationObserver:class MutationObserver {
   constructor(fn){languageChanged=fn}observe(){}
  },
  fetch:async()=>{
   if(holdResponses)return new Promise(resolve=>heldRequests.push(resolve));
   return {ok:true,json:async()=>({release:currentRemote})};
  },
  setInterval:()=>0,setTimeout:(fn,delay)=>{if(delay===3000)check=fn;return 1},
  clearTimeout:()=>{}
 });
 return{
  check:()=>check(),
  setRemote:release=>{currentRemote=release},
  setSaveAllowed:value=>{saveAllowed=value},
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
test('out-of-order version checks cannot downgrade the current update target',async()=>{
 const page=boot('2026.11.07.440','2026.11.07.441');
 page.holdChecks();
 const older=page.check(),newer=page.check();
 assert.equal(page.heldCount(),2);
 page.resolveCheck(1,'2026.11.07.443');
 await newer;
 assert.ok(page.banner);
 page.resolveCheck(0,'2026.11.07.442');
 await older;
 page.banner.children[1].listeners.click();
 assert.match(page.navigated,/ps-revision=2026[.]11[.]07[.]443/,
  'The most recently published release must remain the update target');
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
