// Consolidated small cloud/account security contracts (0.884).
// Original source filenames are retained above each lexical block so failures
// remain traceable. No assertions were removed: only module import scaffolding
// and separate Node test worker entrypoints were eliminated.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Migrated intact from tests/shared-link-corruption.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
test('invalid public share is a user-facing 410, not an unhandled exception',()=>{
 assert.match(worker,/reason:'invalid'\},410/);
 assert.match(app,/error\.reason==='invalid'/);
 assert.match(app,/Ссылка на билд повреждена/);
 assert.match(ui,/This build link is damaged/);
 assert.doesNotMatch(worker,/return json\(\{schema:1,share:JSON\.parse\(row\.payload\)\}\)/);
});
}

// Migrated intact from tests/cloud-unavailable-records.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
test('cloud loading reports quarantined rows without autosaving their old IDs',()=>{
 assert.match(app,/const \{outgoing,copies,unavailable\}=reconciled/);
 assert.match(app,/if\(unavailable&&libraryChangeId===generation&&latest\(\)\)/);
 assert.match(app,/original records are preserved/);
 assert.match(locale,/Некоторые облачные билды недоступны/);
 assert.match(worker,/unavailable:true/);
});
}

// Migrated intact from tests/cross-tab-guest-policy.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('independent tabs cannot redirect account saves or silently switch guest source keys',()=>{
 assert.match(app,/let tabGuestSecret=cloudToken\(\),tabOwnerScope=null/);
 assert.match(app,/window\.PandoraAccountUI\.token\(\)/);
 assert.match(app,/baseUrl:API,\s*onCopyReady:bindAccountCopyEditors/);
 assert.doesNotMatch(app,/legacyKey:\(\)=>tabGuestSecret/);
 assert.doesNotMatch(app,/PandoraBuildScope\.owner\(null,code\)/);
 assert.match(app,/const expectedOwner=tabOwnerScope/);
 assert.match(app,/tabOwnerScope!==expectedOwner/);
 assert.match(app,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
});
}

// Migrated intact from tests/live-account-readiness.test.mjs
{
const source=readFileSync(new URL('../scripts/check-live-connections.mjs',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/pandora-studio-account-api.js',import.meta.url),'utf8');
test('production readiness requires accounts after verified 0005 and never attempts registration',()=>{
 assert.match(source,/check\(payload\?\.features\?\.accounts===true,'D1 player accounts'/);
 assert.match(source,/\/api\/account\/me/);
 assert.match(source,/response\.status===401/);
 assert.match(source,/Sign in required/);
 assert.doesNotMatch(source,/\/api\/account\/(?:register|login|password|recover)/);
 assert.match(worker,/if\(kind==='me'\)\{[\s\S]*?request\.method!=='GET'[\s\S]*?error\('Sign in required',401\)/);
});
}

// Migrated intact from tests/cross-tab-storage-policy.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('all persisted hero records, saves and deletion queues are owner-scoped in concurrent tabs',()=>{
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),ACTIVE_BUILD_KEY,id\)/);
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),\s*'ps-build-studio\.v1'/);
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),\s*'ps-build-library\.v1'/);
 assert.match(app,/PandoraBuildScope\.getOwned\(localStorage,libraryScopeId\(\),\s*CLOUD_DELETES_KEY\)/);
 assert.match(app,/PandoraBuildScope\.setOwned\(localStorage,libraryScopeId\(\),\s*CLOUD_DELETES_KEY/);
 assert.doesNotMatch(app,/localStorage\.setItem\('ps-build-library\.v1'/);
 assert.doesNotMatch(app,/localStorage\.setItem\('ps-build-studio\.v1'/);
});
}

// Migrated intact from tests/ui-account-isolation.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const account=readFileSync(new URL('../pandora-studio-account-ui.js',import.meta.url),'utf8');
test('guest and account saved builds cannot mix when switching session identities',()=>{
 assert.match(account,/username:\(\)=>activeSession\(\)\?session\.username:null/);
 assert.match(account,/if\(validSession\(session\)\)return true/);
 assert.match(app,/activateLibraryScope\(\);/);
 assert.doesNotMatch(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
 assert.match(app,/onLogout:\(\)=>\{[\s\S]*?activateLibraryScope\(\)/);
 assert.doesNotMatch(app,/localStorage\.setItem\('ps-preaccount-library\.v1'/);
 assert.match(app,/PandoraBuildScope\.migrateLegacyGuest\(localStorage,tabGuestSecret\)/);
 assert.match(app,/if\(libraryChangeId!==generation\|\|!latest\(\)\)return/);
});
}

// Migrated intact from tests/owner-inline.test.mjs
{
const root=new URL('../',import.meta.url),get=f=>readFileSync(new URL(f,root),'utf8');
test('owner edits have server-side authorization, whitelist and socket validation',()=>{
 const worker=get('worker/index.js');
 assert.match(worker,/\/api\/admin\/override/);
 assert.match(worker,/if\(!await auth\(request,env\)\)return no\('Unauthorized',401\)/);
 assert.match(worker,/itemdesc\\\.\[0-9\]/);
 assert.match(worker,/itemslots\\\.\[0-9\]/);
 assert.match(worker,/Invalid socket count \(0-32\)/);
});
test('item fields are editable only through owner modal, not direct DOM write',()=>{
 const ui=get('pandora-studio-equipment-ui.js'),app=get('pandora-studio-app.js');
 assert.match(ui,/'data-edit-key':'item\.'/);
 assert.match(ui,/itemdesc\.'/);
 assert.match(ui,/itemslots\.'/);
 assert.match(app,/document\.addEventListener\('dblclick'/);
 assert.match(app,/if\(!adminEditing\|\|!adminToken\|\|!key\)return/);
 assert.match(app,/itemWithOverrides\(rec\)/);
});
}

// Migrated intact from tests/owner-dual-session-cas-638.test.mjs
{
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('full Chromium acceptance exercises two independent clients with strict CAS and draft preservation',()=>{
 const smoke=get('tests/browser-smoke.mjs');
 const scenario=get('tests/browser-owner-dual-session-cas.mjs');
 assert.match(smoke,/owner-two-session-cas',runOwnerDualSessionCasSmoke/);
 assert.match(scenario,/const tokens=\['a'\.repeat\(43\),'b'\.repeat\(43\)\]/);
 assert.match(scenario,/browser\.newContext\(/);
 assert.match(scenario,/edit\.expectedValue===current\?200:409/);
 assert.match(scenario,/code:'OWNER_EDIT_CONFLICT'/);
 assert.match(scenario,/waitForFunction\(\(\)=>document\.querySelector\(/);
 assert.match(scenario,/dataset\.state==='error'/);
 assert.match(scenario,/The losing edit must keep its unsaved draft/);
 assert.match(scenario,/Rejected CAS must not count as a successful edit/);
 assert.match(scenario,/assert\.deepEqual\(attempts\.map\(row=>row\.status\),\[200,409,200\]\)/);
 assert.match(scenario,/testWriteCalls\.length,0/);
 assert.match(scenario,/await Promise\.all\(contexts\.map\(context=>context\.close\(\)\)\)/);
});
}

// Migrated intact from tests/cloud-library-transfer.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('the account library has no old guest-build import action or code form',()=>{
 const app=read('pandora-studio-app.js'),account=read('pandora-studio-account-ui.js');
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 assert.ok(start>=0&&end>start);
 const panel=app.slice(start,end);
 assert.doesNotMatch(panel,/build-transfer|buildLegacyImport|legacy-preview/);
 assert.doesNotMatch(app,/Перенести старые билды|Import older builds/);
 assert.doesNotMatch(app,/\/api\/library\/legacy-preview/);
 assert.doesNotMatch(account,/legacyKey:options\.legacyKey/);
});
test('account save remains explicit; the old legacy API cannot be invoked from player UI',()=>{
 const app=read('pandora-studio-app.js');
 const guest=app.slice(app.indexOf('function buildSignInCard('),
  app.indexOf('function renderBuilds(root){'));
 assert.match(guest,/Sign in to save builds/);
 assert.match(guest,/notifyGuestDraftUnsaved/);
 assert.match(guest,/switchActiveDraft\(structuredClone\(guest\.snapshot\),null\)/);
 assert.match(guest,/if\(!builds\.length\)notifyGuestDraftUnsaved\(\)/);
 assert.doesNotMatch(guest,/legacy-preview|legacyKey/);
});
}

// Migrated intact from tests/live-build-account-readiness.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('account-only Worker deploy is verified on production without writing D1',()=>{
 const source=read('worker/index.js');
 const deploy=read('.github/workflows/deploy-worker-manual.yml');
 const live=read('.github/workflows/live-readonly.yml');
 const guard=read('scripts/check-build-account-only-live.mjs');
 for(const marker of ['buildLibraryRequiresAccount:true','sharedPreviewRequiresAccount:true',
  'legacyAccountImportPreview:true']){
  assert.match(source,new RegExp(marker));
  assert.ok(deploy.includes(marker),'Deploy must require Worker marker '+marker);
 }
 for(const workflow of [deploy,live])
  assert.match(workflow,/node (?:\.\.\/)?scripts\/check-build-account-only-live\.mjs/);
 assert.match(guard,/\/api\/runtime-capabilities/);
 assert.match(guard,/\/api\/shared\/A1234567890/);
 assert.match(guard,/\/api\/library\/legacy-preview/);
 assert.match(guard,/if\(status!==401\)/);
 assert.match(guard,/check\.path!=='\/api\/library\/legacy-preview'\|\|status!==405/,
  'Release guard retries only the older 405 response while deploying Worker');
 assert.doesNotMatch(guard,/method:\s*'POST'|method:\s*"POST"/);
 assert.doesNotMatch(guard,/DELETE FROM|INSERT INTO|UPDATE private_builds/);
});
}

// Migrated intact from tests/cloud-confirmation-contract.test.mjs
{
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
test('overwrite confirmation reports browser persistence, never unconfirmed cloud success',()=>{
 const start=app.indexOf('const overwriteChoice=');
 const end=app.indexOf('const deleteChoice=',start);
 assert.ok(start>0&&end>start);
 const part=app.slice(start,end);
 assert.match(part,/saveBuild\(activeBuildId===b\.id\?state\.name:b\.name,b\.id\)/);
 assert.match(part,/Сохранено в браузере\. Проверяем запись в облаке/);
 assert.doesNotMatch(part,/Билд перезаписан по вашему запросу/);
 assert.doesNotMatch(part,/'success'/);
 assert.match(locale,/Saved in this browser\. Checking cloud storage/);
});
test('only the cloud request acknowledgement can claim saved in cloud',()=>{
 const start=app.indexOf('async function putCloudBuild(');
 const end=app.indexOf('async function deleteCloudBuild(',start);
 const part=app.slice(start,end);
 assert.match(part,/await cloudLibraryRequest\(\{action:'put',entry\}\)/);
 assert.match(part,/reportCloudStatus\('Сохранено в облаке'\)/);
 assert.match(part,/catch\(error\)/);
});
}

// Migrated intact from tests/build-library-search.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('large libraries can be filtered by character name, profession and level',()=>{
 const src=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(src,/let buildSearchQuery=''/);
 assert.match(src,/builds\.length>5\|\|Boolean\(buildSearchQuery\.trim\(\)\)/,
  'An active query must retain its search control even when a deletion leaves five builds');
 assert.match(src,/searchText:\[b\.name,races\[b\.data\?\.race\]\?\.\[0\],races\[b\.data\?\.race\]\?\.\[1\],jobs\[b\.data\?\.job\]/);
 assert.match(src,/races\[b\.data\?\.race\]\?\.\[lang==='en'\?1:0\]/);
 assert.match(src,/row\.box\.hidden=!searchWords\(row\.searchText,query\)/,
  'Build search must share Unicode and ё/е handling with other pickers');
 assert.match(src,/none\.hidden=!query\|\|visible>0/);
 assert.match(css,/\.build-card\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(src,/Поделиться всей библиотекой/);
 assert.match(src,/function refreshBuildsAfterCloudLoad\(\)/);
 assert.match(src,/const typedName=name\?\.value,scrollTop=content\?\.scrollTop\?\?0/);
 assert.match(src,/target\.focus\(\{preventScroll:true\}\)/);
 assert.match(src,/updated\.scrollTop=scrollTop/);
 assert.match(src,/refreshBuildsAfterCloudLoad\(\);/);

});
}

// Migrated intact from tests/build-library-english-ux.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
test('English build cards use the localized race and keep user-provided names unchanged',()=>{
 assert.match(app,/races\[b\.data\?\.race\]\?\.\[lang==='en'\?1:0\]/);
 assert.match(app,/searchText:\[b\.name,races\[b\.data\?\.race\]\?\.\[0\],races\[b\.data\?\.race\]\?\.\[1\]/);
 assert.match(app,/text:b\.name/);
});
test('dynamic overwrite text has a direct translation and keeps the stored build name',()=>{
 assert.match(app,/Overwrite saved build “'\+b\.name\+'” with your current character/);
 assert.match(app,/Перезаписать сохранённый билд «'\+b\.name\+'» текущим персонажем/);
 const root={};vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
 assert.equal(root.PandoraUILocale.ui('↻ Сохранить в этот билд','en'),'↻ Save to this build');
});
}
