import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html'),app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const loadingCss=read('pandora-studio-loading.css');
test('no visible introduction and character editor immediately follows site notice',()=>{
 assert.doesNotMatch(html,/<section\s+class="intro"/);
 assert.doesNotMatch(html,/АРХИВ ГЕРОЕВ|Создай свою легенду|Выбери расу, профессию, снаряжение/);
 assert.match(html,/<main><h1 class="visually-hidden" data-i18n="editorHeading">/);
 assert.match(html,/<section class="workspace" id="workspace"/);
 assert.ok(html.indexOf('<section class="workspace"')<html.indexOf('id="originTabs"'));
 assert.doesNotMatch(css,/\.intro(?:\{|\s|>| )/);
 assert.match(css,/main\{padding-top:10px\}/);
});
test('owner indicator mounts only with a verified editor session, never for guests',()=>{
 const match=app.match(/function updateAdminHint\(\)\{[\s\S]*?\n\}/);
 assert.ok(match,'owner indicator handler not found');
 let indicator=null,refreshed=0;
 const editable=[{classList:{toggle(name,value){this.last={name,value}}}}];
 const header={prepend(el){indicator=el}};
 const document={querySelectorAll:()=>editable,querySelector:()=>header};
 const h=(tag,attrs)=>({tag,attrs,hidden:true,textContent:'',
  remove(){indicator=null}});
 const get=id=>id==='authState'?indicator:null;
 const call=(editing,token)=>Function('$','document','refreshOwnerUI',
  'adminEditing','adminToken','h',match[0]+'\nupdateAdminHint();')(
   get,document,()=>refreshed++,editing,token,h);
 call(false,'');
 assert.equal(indicator,null,'Guest must have no hidden admin node');
 assert.deepEqual(editable[0].classList.last,{name:'admin-edit',value:false});
 call(true,'');
 assert.equal(indicator,null,'A local editing flag without server token cannot unlock UI');
 call(true,'a'.repeat(43));
 assert.equal(indicator?.attrs?.id,'authState');
 assert.equal(indicator?.hidden,false);
 assert.equal(indicator?.textContent,'✎ Редактор');
 assert.deepEqual(editable[0].classList.last,{name:'admin-edit',value:true});
 call(false,'');
 assert.equal(indicator,null,'Indicator is removed after logout');
 assert.deepEqual(editable[0].classList.last,{name:'admin-edit',value:false});
 assert.equal(refreshed,4);
 assert.doesNotMatch(html,/id="authState"/);
 assert.match(css,/\.owner-session-state\[hidden\],\.notice\[hidden\]\{display:none!important\}/);
});
test('catalog footer is natural-language and retired archive notice stays absent',()=>{
 assert.match(app,/data\.meta\.counts\.skills/);
  assert.match(app,/В энциклопедии: /);
 assert.match(app,/Encyclopedia: /);
 assert.doesNotMatch(app,/Cloudflare D1 · актуальный опубликованный каталог/);
 assert.doesNotMatch(app,/renderArchiveNotice/);
 assert.doesNotMatch(html,/id="siteNotice"/);
 assert.match(app,/const localCatalogHost=\['127\.0\.0\.1','localhost'\]\.includes\(location\.hostname\)/);
 assert.match(app,/void startStudio\(\{archive:localCatalogHost\}\)/);
 assert.match(html,/id="startupOverlay"/);
 assert.match(html,/id="startupRetry"/);
 assert.doesNotMatch(html,/id="startupArchive"/);
 assert.match(loadingCss,/\.ps-boot-overlay\{position:fixed/);
});
test('critical user controls and owner dock survive removal of intro',()=>{
 for(const id of ['nav','locale','workspace','originTabs','stagePicker','stageAttributes',
  'originStats','originHp','originMp','skillBranches','snapshot','modalRoot'])
  assert.match(html,new RegExp('id="'+id+'"'),id+' must exist');
 assert.match(app,/function refreshOwnerUI\(\)/);
 assert.match(app,/id:'ownerDock'/);
 assert.match(app,/function updateAdminHint\(\)/);
 assert.doesNotMatch(app,/document\.querySelector\('\[data-edit-key="site\.(?:title|subtitle)"\]'\)/);
});
