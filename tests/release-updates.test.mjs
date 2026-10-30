import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('updates.js');
function boot(local,remote,href='https://bonaqu.github.io/Pandora-Saga-Build-Studio/'){
 let banner=null,check=null,normalized=null,navigated=null,saved=0;
 const document={
  querySelector:selector=>selector==='meta[name="ps-studio-release"]'?{content:local}:null,
  addEventListener(){},dispatchEvent(){saved++;return true},getElementById(){return null},
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
  Event:class Event{},console,
  fetch:async()=>({ok:true,json:async()=>({release:remote})}),
  setInterval:()=>0,setTimeout:(fn,delay)=>{if(delay===3000)check=fn;return 1},
  clearTimeout:()=>{}
 });
 return{
  check:()=>check(),
  get banner(){return banner},get normalized(){return normalized},
  get navigated(){return navigated},get saved(){return saved}
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
 assert.equal(html.match(/style\.css\?v=([^"]+)"/)?.[1],manifest.release);
});
