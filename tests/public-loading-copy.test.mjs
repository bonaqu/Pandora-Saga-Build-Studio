import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),html=read('index.html');
const prefix=app.slice(app.indexOf('const $=id=>'),app.indexOf('const VIEW_KEY='));
function boot(lang){
 const overlay={hidden:true,dataset:{},classList:{remove(){},add(){},contains(){return false}},
  setAttribute(name,value){this[name]=value}};
 const status={textContent:''},document={getElementById:id=>
  id==='startupOverlay'?overlay:id==='startupStatus'?status:null};
 return Function('document','console','lang',prefix+
  'return {startupMessage,startupError,'+
   'overlay:document.getElementById("startupOverlay"),'+
   'status:document.getElementById("startupStatus")};')(
  document,{warn(){}},lang);
}
test('startup error hides raw backend exceptions and offers working UI actions',()=>{
 for(const lang of ['ru','en']){
  const page=boot(lang);
  page.startupMessage('Загрузка игры','Loading game data');
  assert.equal(page.status.textContent,lang==='en'?'Loading game data':'Загрузка игры');
  page.startupError(new Error('internal D1 override ID 12345 secret-token'));
  assert.equal(page.overlay.dataset.state,'error');
  assert.doesNotMatch(page.status.textContent,/D1|12345|secret-token/i);
  assert.match(page.status.textContent,lang==='en'?/Try again or open the saved copy/:/Повтори загрузку или открой сохранённую копию/);
  assert.equal(page.overlay['aria-label'],lang==='en'?'Game data unavailable':'Игровые данные недоступны');
 }
 assert.match(html,/id="startupRetry"/);
 assert.match(html,/id="startupArchive"/);
});
test('archive notices change language without exposing storage internals',()=>{
 const start=app.indexOf('function renderArchiveNotice(){');
 const end=app.indexOf('function applyGameLocale(',start);
 assert.ok(start>=0&&end>start);
 const factory=Function('$','catalogArchived','lang',
  app.slice(start,end)+'return renderArchiveNotice;');
 for(const lang of ['ru','en']){
  const notice={hidden:true,textContent:''};
  factory(()=>notice,true,lang)();
  assert.equal(notice.hidden,false);
  assert.match(notice.textContent,lang==='en'?/Saved game data may be outdated/:/Сохранённая копия игры может устареть/);
  assert.doesNotMatch(notice.textContent,/D1|Worker|HTTP/);
 }
 const empty={hidden:false,textContent:'old'};
 factory(()=>empty,false,'ru')();
 assert.equal(empty.hidden,true);assert.equal(empty.textContent,'');
 assert.match(app,/renderArchiveNotice\(\);\s*renderCatalogStatus\(\);\s*renderOriginCopyLabels\(\)/);
});
test('loading overlay is bilingual even before scripts run and old quick comparison is removed',()=>{
 assert.match(html,/id="startupStatus"[^>]*><span data-boot-ru>/);
 assert.match(html,/<span data-boot-en>Loading game data…<\/span>/);
 assert.doesNotMatch(app,/function compareSnapshots\(/);
 assert.match(app,/PandoraBuildComparison\.compactResults\(/);
 assert.match(app,/Portrait of '\+races\[i\]\[1\]/);
});
