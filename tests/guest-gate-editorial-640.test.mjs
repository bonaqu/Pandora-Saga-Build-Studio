import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('guest and incoming share gates have independent, D1-safe RU/EN editorial keys',()=>{
 const locale=read('pandora-studio-ui-locale.js');
 const app=read('pandora-studio-app.js');
 const keys=['libraryGateAria','libraryGuestTitle','librarySharedGateTitle',
  'libraryGuestLead','librarySharedGateLead','libraryGuestStorageWarning'];
 for(const key of keys){
  assert.match(locale,new RegExp('\\b'+key+':\\['));
  assert.ok(app.includes("'"+key+"'"),'Missing rendered key '+key);
 }
 assert.match(locale,/statusLibrarySignIn:\[/);
 const start=app.indexOf('function buildSignInCard(');
 const end=app.indexOf('function openBuildAccount(mode)',start);
 assert.ok(start>0&&end>start);
 const body=app.slice(start,end);
 assert.match(body,/caption\('accountSignIn'\)/);
 assert.match(body,/caption\('accountRegister'\)/);
 assert.match(body,/if\(adminEditing&&adminToken\)bindAccountCopyEditors\(card\)/);
 assert.match(body,/data-owner-copy-key/);
 assert.match(body,/role:'note'/);
 assert.match(body,/onclick:\(\)=>openBuildAccount\('login'\)/);
 assert.match(body,/onclick:\(\)=>openBuildAccount\('register'\)/);
 assert.doesNotMatch(body,/localStorage|saveBuild\(|deleteCloudBuild\(/);
});

test('guest gate edits refresh visible modal and library without remounting the current hero',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/#detailContent \[data-owner-copy-key\],#modalRoot \[data-owner-copy-key\]/);
 assert.match(app,/key\.startsWith\('book\.ui\.label\.'\)/);
 assert.match(app,/if\(activeTab==='builds'\)bindAccountCopyEditors\(document\.getElementById\('detailContent'\)\)/);
 const locale=read('pandora-studio-ui-locale.js');
 assert.match(locale,/libraryGuestLead:\[/);
 assert.match(locale,/statusLibrarySignIn:\[/);
 assert.match(locale,/function fieldKey\(key\)/);
});

test('guest/account draft decision supports D1 captions without editing player identities',()=>{
 const locale=read('pandora-studio-ui-locale.js');
 const app=read('pandora-studio-app.js');
 const keys=['libraryConflictTitle','libraryConflictLead','libraryConflictGuestBadge',
  'libraryConflictAccountBadge','libraryConflictSavedNote','libraryConflictSaveFirstNote',
  'libraryConflictContinueGuest','libraryConflictSaveContinue','libraryConflictKeepAccount'];
 for(const key of keys){
  assert.ok(locale.includes(key+':['),key+' must have bilingual defaults');
  assert.ok(app.includes("'"+key+"'"),key+' must appear in actual dialog');
 }
 const start=app.indexOf("  const content=h('div',{class:'build-draft-conflict'});");
 const end=app.indexOf(' }else if(shared)openIncoming();',start);
 const scope=app.slice(start,end);
 assert.match(scope,/h\('strong',\{text:guestName\}\)/);
 assert.match(scope,/h\('strong',\{text:accountName\}\)/);
 assert.doesNotMatch(scope,/data-owner-copy-key[^\n]*guestName|data-owner-copy-key[^\n]*accountName/);
 assert.match(scope,/if\(!accountWasSaved&&!saveBuild\(/);
 assert.match(scope,/if\(!switchActiveDraft\(structuredClone\(guest\.snapshot\),null\)\)return/);
 assert.match(scope,/if\(adminEditing&&adminToken\)bindAccountCopyEditors\(dialog\)/);
 assert.match(scope,/heading\.dataset\.ownerCopyKey='libraryConflictTitle'/);
});
test('library sort uses one stable index per card, not repeated array searches',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('const applySort=()=>{'),end=app.indexOf('if(sort)sort.querySelector',start);
 const sort=app.slice(start,end);
 assert.match(app,/searchable\.push\(\{box,build:b,check,order:searchable\.length/);
 assert.match(sort,/return result\|\|a\.order-b\.order/);
 assert.doesNotMatch(sort,/searchable\.indexOf\(/);
 assert.match(sort,/const sorted=\[\.\.\.searchable\]\.sort/);
});
