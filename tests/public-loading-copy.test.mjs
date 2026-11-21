import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),html=read('index.html');
const prefix=app.slice(app.indexOf('const $=id=>'),app.indexOf('const VIEW_KEY='));
function boot(lang){
 const overlay={hidden:true,dataset:{},classList:{remove(){},add(){},contains(){return false}},
  setAttribute(name,value){this[name]=value},focus(){},contains(){return false}};
 const status={textContent:''},document={body:{children:[]},getElementById:id=>
  id==='startupOverlay'?overlay:id==='startupStatus'?status:null};
 return Function('document','console','lang','scheduleOnlineRetry',prefix+
  'return {startupMessage,startupError,'+
   'overlay:document.getElementById("startupOverlay"),'+
   'status:document.getElementById("startupStatus")};')(
  document,{warn(){}},lang,()=>{});
}
test('startup error hides raw backend exceptions and offers working UI actions',()=>{
 for(const lang of ['ru','en']){
  const page=boot(lang);
  page.startupMessage('Загрузка игры','Loading game data');
  assert.equal(page.status.textContent,lang==='en'?'Loading game data':'Загрузка игры');
  page.startupError(new Error('internal D1 override ID 12345 secret-token'));
  assert.equal(page.overlay.dataset.state,'error');
  assert.doesNotMatch(page.status.textContent,/D1|12345|secret-token/i);
  assert.match(page.status.textContent,lang==='en'?/Could not verify current game data/:/Не удалось проверить актуальные игровые данные/);
  assert.equal(page.overlay['aria-label'],lang==='en'?'Game data unavailable':'Игровые данные недоступны');
 }
 assert.match(html,/id="startupRetry"/);
 assert.doesNotMatch(html,/id="startupArchive"/);
 assert.match(html,/id="startupRetry"/);
});
test('catalog footer remains bilingual, numeric, non-editable to guests and free of D1 diagnostics',()=>{
 const start=app.indexOf('function renderCatalogStatus(){');
 const end=app.indexOf('// Only mounted, meaningful action help',start);
 const match=app.match(/const catalogCountParts=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(start>=0&&end>start&&match,'The real mixed footer renderer must exist');
 const parts=Function('return '+match[1])();
 const source={meta:{counts:{skills:569,items:1116,souls:112}}};
 const expected={
  ru:'В энциклопедии: 569 навыков · 1116 предметов · 112 душ',
  en:'Encyclopedia: 569 skills · 1116 items · 112 souls'
 };
 const root=()=>{
  const node={dataset:{},children:[],
   querySelectorAll(selector){
    if(selector==='[data-catalog-status-copy]')
     return this.children.filter(n=>n.attrs?.['data-catalog-status-copy']);
    if(selector==='[data-catalog-status-value]')
     return this.children.filter(n=>n.attrs?.['data-catalog-status-value']);
    return [];
   },
   querySelector(selector){
    const match=selector.match(/^\[data-catalog-status-(copy|value)="([^"]+)"\]$/);
    if(!match)return null;
    return this.children.find(n=>n.attrs?.['data-catalog-status-'+match[1]]===match[2])||null;
   },
   replaceChildren(...children){this.children=children},
   get textContent(){return this.children.map(child=>child.textContent).join('')}
  };return node;
 };
 const create=(tag,attrs)=>({tag,attrs,dataset:{},textContent:attrs.text||'',
  querySelector:()=>null});
 const renderer=lang=>Function('$','catalogSource','lang','adminEditing','adminToken',
  'ownerCopy','ownerCopyLabel','h','catalogCountParts',
  app.slice(start,end)+'return renderCatalogStatus;')(
  ()=>node,source,lang,false,'',(_section,_key,ru,en)=>lang==='en'?en:ru,
  ()=>{},create,parts);
 const node=root();
 const mountedRu=renderer('ru');
 mountedRu();
 assert.equal(node.textContent,expected.ru);
 assert.equal(node.querySelectorAll('[data-catalog-status-value]').length,3);
 assert.equal(node.querySelectorAll('[data-catalog-status-copy]').length,4);
 const countNode=node.querySelector('[data-catalog-status-value="skills"]');
 source.meta.counts.skills=570;
 mountedRu();
 assert.equal(node.querySelector('[data-catalog-status-value="skills"]'),countNode);
 assert.equal(node.textContent,expected.ru.replace('569','570'));
 renderer('en')();
 assert.equal(node.textContent,expected.en.replace('569','570'));
 assert.equal(node.querySelector('[data-catalog-status-value="skills"]'),countNode);
 assert.doesNotMatch(node.textContent,/Worker|Cloudflare D1|HTTP/);
 assert.doesNotThrow(()=>Function('$','catalogSource','lang','adminEditing','adminToken',
  'ownerCopy','ownerCopyLabel','h','catalogCountParts',
  app.slice(start,end)+'return renderCatalogStatus;')(
  ()=>null,source,'ru',false,'',()=>'',()=>{},create,parts)());
 assert.doesNotMatch(app,/renderArchiveNotice/);
 assert.doesNotMatch(html,/id="siteNotice"/);
});
test('loading overlay is bilingual even before scripts run and old quick comparison is removed',()=>{
 assert.match(html,/id="startupStatus"[^>]*><span data-boot-ru>/);
 assert.match(html,/<span data-boot-en>Loading game data…<\/span>/);
 assert.doesNotMatch(app,/function compareSnapshots\(/);
 assert.match(app,/PandoraBuildComparison\.compactResults\(/);
 assert.match(app,/Portrait of '\+races\[i\]\[1\]/);
});
