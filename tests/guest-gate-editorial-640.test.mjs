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
