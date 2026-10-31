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
 const src=read('app.js');
 assert.match(src,/function openSharedSnapshot\(/);
 assert.match(src,/Сохранить текущий и открыть/);
 assert.match(src,/Открыть без сохранения/);
 assert.match(src,/Отмена/);
 assert.match(src,/if\(saveBuild\(\)\)apply\(\)/);
 assert.match(src,/function restoreSharedHash\(/);
 assert.match(src,/window\.addEventListener\('hashchange'/);
});
test('share links display alongside saved builds with an inline copy fallback',()=>{
 const src=read('app.js'),css=read('style.css');
 assert.match(src,/class:'build-share-slot'/);
 assert.match(src,/createShared\(b,shareSlot\)/);
 assert.match(src,/if\(host\.isConnected\)host\.replaceChildren\(message\)/);
 assert.match(src,/field\.focus\(\);field\.select\(\)/);
 assert.match(css,/\.build-share-slot/);
});
test('library maintains an offline cache and D1 sync without JSON import/export',()=>{
 const src=read('app.js'),html=read('index.html');
 assert.match(src,/ps-build-library\.v1/);
 assert.match(src,/persistBuilds\(\)/);
 assert.match(src,/function loadCloudBuilds\(/);
 assert.doesNotMatch(src,/text:'⇩ Экспорт JSON'/);
 assert.doesNotMatch(src,/text:'⇧ Импорт JSON'/);
 assert.match(html,/data-tab="builds"/);
});
test('skill and stat editing remain in one screen',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.doesNotMatch(html,/data-tab="(?:skills|stats)"/);
 assert.match(app,/PandoraHeroPath\.viewGrowth/);
 assert.match(html,/data-origin-tab="stats"/);
});

test('opening a local named build keeps all old and future fields; shared Astir builds keep displaced legwear',()=>{
 const app=read('app.js');
 assert.match(app,/const draft=structuredClone\(latest\.data\),base=fresh\(\)/);
 assert.match(app,/state=\{\.\.\.base,\.\.\.draft,/);
 assert.match(app,/const previousLegwear=item\(original\.displacedLegwear\)/);
 assert.match(app,/safe\.displacedLegwear=previousLegwear/);
});

test('health endpoint exposes D1 sharing readiness without claiming feature deployed',()=>{
 const worker=read('worker/index.js');
 assert.match(worker,/features:\{sharing:sharingReady,catalog:catalogPublished,library:found\.has\('private_builds'\)\}/);
 assert.match(worker,/Хранилище коротких ссылок не подготовлено: нужна миграция D1/);
 assert.match(worker,/return no\('Хранилище коротких ссылок не подготовлено: нужна миграция D1',503\)/);
});

test('shared racial passive IDs retain original OS values above one million',()=>{
 const s=read('app.js');
 assert.match(s,/Number\.isSafeInteger\(original\.racialPassiveId\)/);
 assert.match(s,/original\.racialPassiveId<10000000000/);
});

test('public share preserves separate blue Potential and green Adeptness',()=>{
 const s=read('app.js');
 assert.match(s,/safe\.masteryAuto=original\.masteryAuto!==false/);
 assert.match(s,/safe\.mastery\[key\]=Math\.min\(level,window\.PandoraSkillProgression\.potential\(safe,key\)\)/);
 assert.match(s,/Мастерство '\+branch\.name/);
});
