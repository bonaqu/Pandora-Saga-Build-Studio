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
 assert.match(block,/ownerCopyLabel\(label,'owner-dock',key,pair\[0\],pair\[1\]\)/);
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
 assert.match(refresh,/node\.textContent=ownerDockCopy\(node\.dataset\.ownerGroupCopy\)/);
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
 assert.match(app,/const saveText=\(ownerSaveState===/);
 assert.doesNotMatch(block,/statusCloud|password|token\s*=/i);
});
