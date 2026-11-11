import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('share links use random short immutable IDs and public endpoints',()=>{
 const worker=read('worker/index.js'),migration=read('worker/migrations/0003_shares.sql');
 assert.match(worker,/\/api\/shared/);
 assert.match(worker,/const id=b64\(random\(8\)\)/);
 assert.match(worker,/if\(existing\?\.id\)return json\(\{ok:true,id:existing\.id,reused:true\}\)/);
 assert.match(worker,/shared_build_limits/);
 assert.match(worker,/JSON\.stringify\(\{schema:1,type:'build',data:stored\.data\}\)/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS shared_build_sources/);
 assert.match(worker,/FOREIGN KEY\(share_id\)/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS shared_builds/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS shared_build_limits/);
});
test('sharing never replaces an existing build without explicit choice',()=>{
 const src=read('pandora-studio-app.js');
 assert.match(src,/function openSharedSnapshot\(/);
 assert.match(src,/Сохранить текущий и открыть/);
 assert.match(src,/Открыть без сохранения/);
 assert.match(src,/Отмена/);
 assert.match(src,/if\(saveBuild\(\)\)apply\(\)/);
 assert.match(src,/function restoreSharedHash\(/);
 assert.match(src,/window\.addEventListener\('hashchange'/);
 assert.equal((src.match(/window\.addEventListener\('hashchange'/g)||[]).length,1,
  'shared-build and wiki navigation must share one hashchange listener');
 assert.match(src,/const currentRequest=\+\+sharedHashRequestId/);
 assert.match(src,/currentRequest===sharedHashRequestId&&\s*window\.PandoraAccountUI\?\.token\(\)===sessionToken&&location\.hash/);
 assert.match(src,/currentRequest!==sharedHashRequestId\|\|\s*window\.PandoraAccountUI\?\.token\(\)!==sessionToken\|\|\s*location\.hash/);
});
test('share links display alongside saved builds with an inline copy fallback',()=>{
 const src=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(src,/class:'build-share-slot'/);
 assert.match(src,/createShared\(b,shareSlot\)/);
 assert.match(src,/if\(host\.isConnected\)\{\s*host\.replaceChildren\(message\);/);
 assert.match(src,/if\(adminEditing&&adminToken\)bindAccountCopyEditors\(message\)/,
  'Only an active administrator may bind share-result editorial controls');
 assert.match(src,/field\.focus\(\);field\.select\(\)/);
 assert.match(src,/isVerifiedSharedBuild\(check\?\.share,build\.data\)/);
 assert.match(css,/\.build-share-slot/);
});
test('library maintains an offline cache and D1 sync without JSON import/export',()=>{
 const src=read('pandora-studio-app.js'),html=read('index.html');
 assert.match(src,/ps-build-library\.v1/);
 assert.match(src,/persistBuilds\(\)/);
 assert.match(src,/function loadCloudBuilds\(/);
 assert.doesNotMatch(src,/text:'⇩ Экспорт JSON'/);
 assert.doesNotMatch(src,/text:'⇧ Импорт JSON'/);
 assert.match(html,/data-tab="builds"/);
});
test('skill and stat editing remain in one screen',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 assert.doesNotMatch(html,/data-tab="(?:skills|stats)"/);
 assert.match(app,/PandoraHeroPath\.viewGrowth/);
 assert.match(html,/data-origin-tab="stats"/);
});

test('opening a local named build keeps all old and future fields; shared Astir builds keep displaced legwear',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function prepareSavedBuildSnapshot\(raw\)/);
 assert.match(app,/const draft=structuredClone\(raw\),base=fresh\(\)/);
 assert.match(app,/next=prepareSavedBuildSnapshot\(latest\.data\)/);
 assert.match(app,/if\(!switchActiveDraft\(next,latest\.id\)\)return false/);
 assert.match(app,/state=snapshot;/);
 assert.match(app,/const previousLegwear=item\(original\.displacedLegwear\)/);
 assert.match(app,/safe\.displacedLegwear=previousLegwear/);
});

test('health endpoint exposes D1 sharing readiness without claiming feature deployed',()=>{
 const worker=read('worker/index.js');
 assert.match(worker,/features:\{sharing:sharingReady,catalog:catalogPublished,library:found\.has\('private_builds'\),/);
 assert.match(worker,/accounts:\['user_accounts','user_sessions','user_registration_limits'\]/);
 assert.match(worker,/Хранилище коротких ссылок не подготовлено: нужна миграция D1/);
 assert.match(worker,/return no\('Хранилище коротких ссылок не подготовлено: нужна миграция D1',503\)/);
});

test('shared racial passive IDs retain original OS values above one million',()=>{
 const s=read('pandora-studio-app.js');
 assert.match(s,/Number\.isSafeInteger\(original\.racialPassiveId\)/);
 assert.match(s,/original\.racialPassiveId<10000000000/);
});

test('public share preserves separate blue Potential and green Adeptness',()=>{
 const s=read('pandora-studio-app.js');
 assert.match(s,/safe\.masteryAuto=original\.masteryAuto!==false/);
 assert.match(s,/safe\.mastery\[key\]=Math\.min\(level,90\)/);
 assert.match(s,/safe\.masteryFormat=original\.masteryFormat===2\?2:1/);
 // The actual preview calculator still receives trained combat mastery,
 // which is reflected in the compared outcomes without adding a skill row.
 assert.match(s,/PandoraSkillProgression\.combatMasteries\(snap,initialBranches,caps\)/);
 assert.match(s,/PandoraBuildComparison\.compactResults\(/);
});
