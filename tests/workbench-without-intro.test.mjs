import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css');
test('no visible introduction and character editor immediately follows site notice',()=>{
 assert.doesNotMatch(html,/<section\s+class="intro"/);
 assert.doesNotMatch(html,/АРХИВ ГЕРОЕВ|Создай свою легенду|Выбери расу, профессию, снаряжение/);
 assert.match(html,/<main><h1 class="visually-hidden">/);
 assert.match(html,/<section class="workspace" id="workspace"/);
 assert.ok(html.indexOf('<section class="workspace"')<html.indexOf('id="originTabs"'));
 assert.doesNotMatch(css,/\.intro(?:\{|\s|>| )/);
 assert.match(css,/main\{padding-top:10px\}/);
});
test('admin status still exists in header and only shows when editor active',()=>{
 const match=app.match(/function updateAdminHint\(\)\{[\s\S]*?\n\}/);
 assert.ok(match,'admin visibility handler not found');
 const indicator={hidden:true,textContent:''};
 const editable=[{classList:{toggle(name,value){this.last={name,value}}}}];
 let refreshed=0;
 const document={querySelectorAll:()=>editable};
 const run=Function('$','document','refreshOwnerUI','adminEditing',
  match[0]+'\nupdateAdminHint();')(
   id=>id==='authState'?indicator:null,document,()=>refreshed++,true);
 assert.equal(indicator.hidden,false);
 assert.equal(indicator.textContent,'✎ Редактор');
 assert.deepEqual(editable[0].classList.last,{name:'admin-edit',value:true});
 assert.equal(refreshed,1);
 const runOff=Function('$','document','refreshOwnerUI','adminEditing',
  match[0]+'\nupdateAdminHint();')(
   id=>id==='authState'?indicator:null,document,()=>refreshed++,false);
 assert.equal(indicator.hidden,true);
 assert.equal(indicator.textContent,'');
 assert.deepEqual(editable[0].classList.last,{name:'admin-edit',value:false});
 assert.equal(refreshed,2);
 assert.match(html,/<div class="header-actions"><span id="authState" class="owner-session-state" role="status" hidden>/);
 assert.match(css,/\.owner-session-state\[hidden\],\.notice\[hidden\]\{display:none!important\}/);
});
test('catalog success is shown in footer, catalog failure remains a visible notice',()=>{
 assert.match(app,/\$\('siteNotice'\)\.textContent='Каталог временно недоступен; сохранённые билды не удалены\.';\s*\$\('siteNotice'\)\.hidden=false/);
 assert.match(app,/\$\('siteNotice'\)\.hidden=true;\s*\$\('siteNotice'\)\.textContent='';/);
 assert.match(app,/\$\('catalogStatus'\)\.textContent=\`\$\{live\.meta\.counts\.skills\}/);
});
test('critical user controls and owner dock survive removal of intro',()=>{
 for(const id of ['nav','locale','siteNotice','workspace','originTabs','stagePicker','stageAttributes',
  'originStats','originHp','originMp','skillBranches','snapshot','modalRoot'])
  assert.match(html,new RegExp('id="'+id+'"'),id+' must exist');
 assert.match(app,/function refreshOwnerUI\(\)/);
 assert.match(app,/id:'ownerDock'/);
 assert.match(app,/function updateAdminHint\(\)/);
 assert.doesNotMatch(app,/document\.querySelector\('\[data-edit-key="site\.(?:title|subtitle)"\]'\)/);
});
