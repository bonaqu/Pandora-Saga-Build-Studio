import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),css=read('pandora-studio-owner-dock.css');
const take=(start,end)=>{
 const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Source section missing: '+start);
 return app.slice(a,b);
};

test('six stable owner-only group captions have independently editable RU/EN fallback keys',()=>{
 const source=take('const ownerDockText=Object.freeze({', '// Help is action-specific');
 const defaults=Function(source+'\nreturn ownerDockText;')();
 const expected={
  groupEditingTitle:['Редактирование','Editing'],
  groupEditingHint:['Основные действия и история правок','Editing and change history'],
  groupGameTitle:['Игровые данные','Game data'],
  groupGameHint:['Каталог, очки и переводы','Catalog, points and translations'],
  groupToolsTitle:['Дополнительно','More tools'],
  groupToolsHint:['Проверка D1 и резервная копия','D1 testing and optional backup']
 };
 for(const [key,translated] of Object.entries(expected)){
  assert.deepEqual(defaults[key],translated);
  const slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.match(slug,/^group-(?:editing|game|tools)-(?:title|hint)$/);
  assert.ok(translated.every(x=>x.length<=90));
 }
 assert.equal(new Set(Object.keys(expected)).size,6);
});

test('drawer pencil edits use the standard D1 CAS writer and cannot invoke an action',()=>{
 const block=take(" const group=(id,titleKey,hintKey,keys)=>{",
  " actions.replaceChildren(editGroup,gameGroup,toolsGroup);");
 assert.ok(block.includes("ownerCopyLabel(label,'owner-dock',key,pair[0],pair[1],{"));
 assert.ok(block.includes("onCommitted:visible=>syncPencil(visible)"));
 assert.ok(block.includes("onFinished:()=>syncPencil()"));
 assert.match(block,/typeof committed==='string'&&committed/);
 assert.ok(block.includes("pencil?.setAttribute('aria-label'"));
 assert.match(block,/label\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(block,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.match(block,/editorial\(titleKey,'title'\),editorial\(hintKey,'hint'\)/);
 for(const key of ['groupEditingTitle','groupEditingHint','groupGameTitle',
  'groupGameHint','groupToolsTitle','groupToolsHint'])
  assert.ok(block.includes("'"+key+"'"));
 const common=take('function ownerCopyLabel(', '// Shared, explicit copy binding');
 assert.match(common,/const editLang=lang/);
 assert.match(common,/saveGuidePatch\('book\.'\+ownerCopyKey\(section,key\),\{\[editLang\]:next\}\)/);
 assert.match(common,/event\.key==='F2'\|\|event\.key==='Enter'/);
 const save=take('async function saveGuidePatchNow(', 'async function saveGuideList(');
 assert.match(save,/await apiRequest\('\/api\/admin\/override',\{key:overrideKey,value:serialized\}\)/);
 assert.match(save,/ownerEdits\.push/);
});

test('every live status refresh and Undo preserves editor draft and updates group text in place',()=>{
 const refresh=take('function refreshOwnerUI(){', 'function ');
 // The other inline D1 editors share the same refresh function. Never
 // overwrite a contenteditable group caption while the request is pending.
 assert.match(refresh,/\[data-owner-group-copy\]/);
 assert.match(refresh,/if\(!node\.querySelector\('\.wiki-inline-input'\)\)/);
 assert.match(refresh,/ownerDockPatchText\(node,ownerDockCopy\(node\.dataset\.ownerGroupCopy\)\)/);
 assert.match(refresh,/\[data-owner-group-edit-for\]/);
 const undo=take('function refreshVisibleOwnerCopy(recordKey){','function ');
 assert.match(undo,/if\(key\.startsWith\('owner-dock\.'\)\)\{refreshOwnerUI\(\);return\}/);
 assert.match(css,/#ownerDock \.owner-dock-group-copy-wrap/);
 assert.match(css,/#ownerDock \.owner-dock-actions button\.owner-dock-group-pencil/);
 assert.doesNotMatch(refresh,/ownerEdits\.length\s*=\s*0/);
});

test('group copy remains separate from credentials, visible user UI and save diagnostics',()=>{
 const block=take(" const group=(id,titleKey,hintKey,keys)=>{",
  " actions.replaceChildren(editGroup,gameGroup,toolsGroup);");
 assert.ok(!block.includes("document.body.append"));
 assert.ok(!block.includes("/api/admin/"));
 assert.match(app,/if\(!adminEditing\|\|!adminToken\)return;/);
 assert.match(app,/const saveText=saving\?/);
 assert.doesNotMatch(block,/statusCloud|password|token\s*=/i);
});

test('owner drawer patch helpers do not mutate identical DOM text, ARIA or datasets',()=>{
 const helpers=take('function ownerDockPatchText(node,value){','function refreshOwnerUI(){');
 const {patchText,patchAttr,patchData}=Function(helpers+'\nreturn {patchText:ownerDockPatchText,patchAttr:ownerDockPatchAttr,patchData:ownerDockPatchData};')();
 let textWrites=0,attrWrites=0,dataWrites=0;
 const attrs=new Map([['aria-label','same']]);
 const data=new Proxy({guideHint:'stable'},{set(obj,key,value){dataWrites++;obj[key]=value;return true}});
 const node={_text:'unchanged',dataset:data,
  get textContent(){return this._text},set textContent(value){textWrites++;this._text=value},
  getAttribute:key=>attrs.get(key)??null,
  setAttribute:(key,value)=>{attrWrites++;attrs.set(key,value)}};
 patchText(node,'unchanged');patchAttr(node,'aria-label','same');patchData(node,'guideHint','stable');
 assert.deepEqual([textWrites,attrWrites,dataWrites],[0,0,0]);
 patchText(node,'changed');patchAttr(node,'aria-label','different');patchData(node,'guideHint','new');
 assert.deepEqual([textWrites,attrWrites,dataWrites],[1,1,1]);
 assert.equal(node.textContent,'changed');
 assert.equal(node.getAttribute('aria-label'),'different');
 assert.equal(node.dataset.guideHint,'new');
});

test('drawer save/Undo/Finish share the actual queued-write guard and do not announce premature success',()=>{
 const block=take('function refreshOwnerUI(){','// Update only author-edited interface copy.');
 const notifier=take('let lastOwnerUpdateReason;','function refreshOwnerUI(){');
 const helpers=take('function ownerDockPatchText(node,value){','function refreshOwnerUI(){');
 const patches=Function(helpers+
  '\nreturn {text:ownerDockPatchText,attr:ownerDockPatchAttr,data:ownerDockPatchData};')();
 const node=()=>({
  textContent:'',dataset:{},disabled:false,hidden:false,
  _attrs:new Map(),
  getAttribute(name){return this._attrs.get(name)||null},
  setAttribute(name,value){this._attrs.set(name,value)},
  closest(){return null}
 });
 const draw=(saving,saveState='saved')=>{
  const state=node(),footer=node(),undo=node(),translations=node();
  const root={dataset:{},classList:{toggle(){}},
   getAttribute(){return null},setAttribute(){},
   querySelectorAll(){return []},
   querySelector(selector){return ({
    '[data-owner-save-state]':state,'[data-owner-footer-note]':footer,
    '[data-owner-undo]':undo,'[data-owner-en-sync]':translations
   })[selector]||null}
  };
  const mockWindow={PandoraOwnerBilingual:{pending:()=>[{fields:['nameEn']}]}};
  const main=Function('document','window','ownerSaveInFlight',
   'ownerDockPatchText','ownerDockPatchAttr','ownerDockPatchData',
   'saveState',
   'const adminEditing=true,adminToken="mock-owner",lang="ru";'+
   'const override={},ownerEdits=[{key:"guideedit.book.wiki-ui.test"}];'+
   'const ownerDockCollapsed=true,ownerSaveError="Конфликт D1";'+
   'let ownerSaveState=saveState;'+
   'const ownerDockCopy=key=>key,ownerRuRecordCount=()=> "запись";'+
   notifier+block+'\nreturn refreshOwnerUI;')(
    {getElementById:id=>id==='ownerDock'?root:null},mockWindow,
    ()=>saving,patches.text,patches.attr,patches.data,saveState);
  main();
  return {state,footer,undo,translations,root};
 };
 const queued=draw(true,'saved');
 assert.equal(queued.state.dataset.state,'saving',
  'A queued bilingual guide edit cannot be announced as saved');
 assert.match(queued.state.textContent,/Сохраняю в Cloudflare D1/);
 assert.match(queued.footer.textContent,/Дождись сохранения/);
 assert.equal(queued.undo.disabled,true);
 assert.equal(queued.translations.disabled,true);
 const saved=draw(false,'saved');
 assert.equal(saved.state.dataset.state,'saved');
 assert.match(saved.state.textContent,/Сохранено в Cloudflare D1/);
 assert.equal(saved.undo.disabled,false);
 assert.equal(saved.translations.disabled,false);
 const failed=draw(false,'error');
 assert.equal(failed.state.dataset.state,'error');
 assert.match(failed.footer.textContent,/исправь ошибку/);
 assert.match(app,/class:'owner-dock-finish'[\s\S]*?if\(!ownerMayLeaveEditing\(\)\)return;/,
  'Finish must use the shared guard before closing the drawer');
 assert.match(app,/function ownerMayLeaveEditing\(\)\{[\s\S]*?if\(!ownerCanStartAdminOperation\(\)\)return false/);
 assert.match(app,/function ownerCanStartAdminOperation\(\)\{[\s\S]*?if\(ownerSaveInFlight\(\)\)/,
  'Shared owner operation guard still checks queued writes');
});
