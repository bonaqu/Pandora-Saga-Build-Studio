// Compact source-contract regression bundle; original cases and assertions are retained.
// Keep each original module in its own block to preserve fixture isolation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

{
// Original: tests/account-guest-transfer.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),account=read('pandora-studio-account-ui.js');

test('guest saved-build library is gated and legacy import UI is retired',()=>{
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 assert.ok(start>=0&&end>start);
 const panel=app.slice(start,end);
 assert.match(panel,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
 assert.match(panel,/root\.append\(buildSignInCard\(\)\);return/);
 assert.doesNotMatch(app,/function buildLegacyImport\(/);
 assert.doesNotMatch(panel,/buildLegacyImport\(/);
 assert.match(app,/text:caption\('accountRegister'\)/);
 assert.match(app,/text:caption\('accountSignIn'\)/);
});
test('both registration and login preserve only working guest draft, not saved builds',()=>{
 assert.match(app,/if\(tabOwnerScope\?\.startsWith\('guest:'\)&&unsavedBuild\(\)\)/);
 assert.match(app,/pendingGuestDraft=\{snapshot:structuredClone\(state\),owner:tabOwnerScope\}/);
 assert.match(app,/activateLibraryScope\(\);/);
 assert.doesNotMatch(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
 assert.doesNotMatch(account,/legacyKey:options\.legacyKey/);
 assert.match(app,/guest\.owner\.startsWith\('guest:'\)/);
 assert.match(app,/if\(!builds\.length\)notifyGuestDraftUnsaved\(\)/);
 assert.match(app,/Оставить героя аккаунта/);
});

}

{
// Original: tests/account-profile-locale-completeness.test.mjs

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-account-ui.js');
const root={};
vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
const translate=(value,lang='en')=>root.PandoraUILocale.ui(value,lang);

test('all visible account identity and sign-out labels have RU/EN translations',()=>{
 for(const [ru,en] of [
  ['УЧЁТНАЯ ЗАПИСЬ','ACCOUNT'],
  ['Облачные билды привязаны к вашему профилю','Cloud builds belong to your account'],
  ['Выйти из аккаунта','Sign out of account'],
  ['Войти или зарегистрироваться','Sign in or register'],
  ['Изменить пароль','Change password'],
  ['Новый пароль · от 8 символов','New password · at least 8 characters']
 ]){
  assert.ok(source.includes(ru),'Account must actually use: '+ru);
  assert.equal(translate(ru),en,'EN label for '+ru);
  assert.equal(translate(ru,'ru'),ru,'RU label for '+ru);
 }
});

test('authentication diagnostics have human-readable EN equivalents',()=>{
 for(const [ru,en] of [
  ['Некорректный ответ авторизации','Invalid sign-in response'],
  ['Некорректный владелец аккаунта','Account identity mismatch'],
  ['Ошибка сервера','Server error']
 ])assert.equal(translate(ru),en);
});

}

{
// Original: tests/guest-library-transfer-bilingual.test.mjs
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');

test('the guest library gate explains login and registration in both languages',()=>{
 const gate=app.slice(app.indexOf('function buildSignInCard('),
  app.indexOf('function openBuildAccount('));
 assert.match(gate,/caption\(titleKey\)/);
 assert.match(gate,/caption\(leadKey\)/);
 assert.match(gate,/caption\('libraryGuestStorageWarning'\)/);
 assert.match(gate,/caption\('accountSignIn'\)/);
 assert.match(gate,/caption\('accountRegister'\)/);
 assert.match(locale,/libraryGuestTitle:\['Мои билды — в аккаунте','Your builds belong to your account'\]/);
 assert.match(locale,/libraryGuestStorageWarning:\['Без аккаунта текущий герой хранится только в этом браузере/);
});
test('no RU/EN legacy import panel, manual key form or automatic guest library transfer',()=>{
 assert.doesNotMatch(app,/Перенести старые билды|Import older builds/);
 assert.doesNotMatch(app,/Код старой библиотеки|Previous library code/);
 assert.doesNotMatch(app,/Найти на этом устройстве|Find on this device/);
 assert.doesNotMatch(app,/buildLegacyImport\(/);
 assert.doesNotMatch(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
});

}

{
// Original: tests/library-copy-undo.test.mjs

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('UI-copy undo updates the visible label without remounting builds',()=>{
 const helper=app.slice(app.indexOf('function refreshVisibleUICopy('),
  app.indexOf('async function undoOwnerEdit(){'));
 assert.match(helper,/locale\.setOverrides\(override\)/);
 assert.match(helper,/locale\.apply\(lang\)/);
 assert.match(helper,/const selector=isLibrary\?[\s\S]*'#detailContent \[data-owner-copy-key\],#modalRoot \[data-owner-copy-key\]'/);
 assert.match(helper,/document\.querySelectorAll\(selector\)/);
 assert.match(helper,/locale\.fieldKey\(key\)!==id/);
 assert.match(helper,/ownerDockPatchText\(node,value\)/);
 assert.doesNotMatch(helper,/renderDetails\(|render\(|refreshOwnerCatalog\(/);

 const undo=app.slice(app.indexOf('async function undoOwnerEdit(){'),
  app.indexOf('function showOverrideManager(){'));
 assert.match(undo,/last\.key\.startsWith\('guideedit\.book\.ui\.label\.'\)/);
 assert.match(undo,/refreshVisibleUICopy\(last\.key\)/);
 assert.match(undo,/else await refreshOwnerCatalog\(\)/);
 assert.match(undo,/PandoraAccountUI\?\.refresh\?\.\(\)/);
});

test('saving and undoing UI labels use one update path, not catalog rerenders',()=>{
 const save=app.slice(app.indexOf('async function saveGuidePatchNow('),
  app.indexOf('async function saveGuideList('));
 assert.match(save,/refreshVisibleUICopy\('guideedit\.'\+key\)/);
 assert.match(save,/key\.startsWith\('book\.ui\.label\.library-'\)/);
 assert.match(save,/saveView\(\); \/\/ leave inline editor mounted/);
});

}

{
// Original: tests/dock-locale-single-source.test.mjs
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html'),js=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const hero=read('pandora-studio-hero-path.js');

test('only the site header owns language selection; modal duplicates are gone',()=>{
 assert.match(html,/id="locale" class="locale-switch"/);
 assert.match(html,/data-locale="ru"/);
 assert.match(html,/data-locale="en"/);
 for(const source of [html,js,css])assert.doesNotMatch(source,/dockLocale|dock-locale|data-dock-locale/);
 assert.match(js,/function syncLocaleControls\(\)/);
 assert.match(js,/document\.querySelectorAll\('#locale \[data-locale\]'\)/);
 assert.match(js,/button\.dataset\.locale===lang/);
 assert.match(js,/syncLocaleControls\(\);\s*if\(!catalogSource\)return/);
 assert.ok(js.includes("$('locale').onclick=async event=>"));
 assert.match(html,/data-i18n-aria-label="language"/);
});

test('one invested/max value remains in the branch header; exact inputs survive',()=>{
 assert.match(hero,/const branchCount=make\('b',\{class:'count',[\s\S]*?level\+' \/ '\+cap/);
 assert.match(hero,/branchCount\.textContent=cap>0\?[\s\S]*?branchPotential\(state,key,innate,caps\)\+' \/ '\+cap/);
 assert.doesNotMatch(hero,/inline-branch-value|branchPoints|label\.textContent=target\+' \/ '/);
 assert.ok(hero.includes('editor.append(track,legend);'));
 assert.ok(hero.includes("key+':potential-number'"));
 assert.ok(hero.includes("key+':mastery-number'"));
 assert.doesNotMatch(css,/inline-branch-value/);
});

}

{
// Original: tests/d1-manual-migration.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('production D1 account migration can run only after owner confirms specific existing database',()=>{
 const workflow=read('.github/workflows/manual-d1-accounts-0005.yml');
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\n  push:/);
 assert.match(workflow,/APPLY-0005-TO-ps-build-studio-db/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/bonaqu_projects'/);
 assert.match(workflow,/CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
 assert.match(workflow,/PS_D1_DATABASE_ID: 0f8fbcd8-be06-414c-844b-a2091fdf6784/);
 assert.match(workflow,/d1 time-travel info ps-build-studio-db/);
 assert.match(workflow,/d1 execute ps-build-studio-db --remote --yes/);
 assert.match(workflow,/--file migrations\/0005_user_accounts\.sql/);
 assert.doesNotMatch(workflow,/wrangler.*d1 migrations apply.*--remote/);
});
test('0005 cannot modify the existing administrator or saved-build tables',()=>{
 const sql=read('worker/migrations/0005_user_accounts.sql');
 const statements=sql.replace(/--[^\n]*/g,'').split(';').map(x=>x.trim()).filter(Boolean);
 assert.equal(statements.length,4);
 assert.ok(statements.every(x=>/^CREATE (?:TABLE|INDEX) IF NOT EXISTS /i.test(x)));
 assert.ok(!/^\s*(?:DROP|DELETE|UPDATE|ALTER)\b/im.test(statements.join('\n')),
  'Foreign-key ON DELETE CASCADE is allowed inside additive table definitions');
 const validator=read('worker/scripts/assert-d1-tables.mjs');
 assert.match(validator,/Production D1 does not contain required table/);
});

}
