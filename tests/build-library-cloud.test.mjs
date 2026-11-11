import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('new heroes are level 1 and sharing is exclusively per saved build',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 assert.match(app,/function fresh\(\)\{return\{race:null,gender:0,job:null,level:1,/);
 assert.match(html,/id="level"[^>]*max="55"[^>]*value="1"/);
 assert.match(app,/Сохранить и создать/);
 assert.match(app,/Создать без сохранения/);
 assert.match(app,/void putCloudBuild\(entry\)/);
 assert.doesNotMatch(app,/Поделиться текущим/);
 assert.doesNotMatch(app,/Поделиться всей библиотекой/);
});
test('private library refuses access without migration and bearer key',async()=>{
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/library';
 const origin='https://bonaqu.github.io';
 const mock={prepare:sql=>sql.startsWith('SELECT a.id,a.username,a.owner_hash')?
  {bind:()=>({first:async()=>({owner_hash:'account-test'})})}:
  {all:async()=>({results:[]})}};
 const anonymous=new Request(endpoint,{headers:{Origin:origin}});
 assert.equal((await worker.fetch(anonymous,{DB:mock})).status,401);
 const authenticated=new Request(endpoint,{headers:{Origin:origin,
  Authorization:'Bearer '+'t'.repeat(43)}});
 assert.equal((await worker.fetch(authenticated,{DB:mock})).status,503,
  'An authenticated library still requires the D1 schema');
 assert.match(read('worker/migrations/0004_private_builds.sql'),/CREATE TABLE IF NOT EXISTS private_builds/);
 assert.match(read('worker/index.js'),/CREATE TABLE IF NOT EXISTS shared_builds/);
 assert.match(read('worker/index.js'),/CREATE TABLE IF NOT EXISTS private_builds/);
 assert.match(read('pandora-studio-app.js'),/function queuedDeletes\(/);
 assert.match(read('index.html'),/id="newBuildQuick"/);
});

test('only signed-in cloud libraries retry after network recovery',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/window\.addEventListener\('online',resumeCloudLibrary\)/);
 assert.match(app,/document\.addEventListener\('visibilitychange'/);
 assert.match(app,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)return/);
 assert.match(app,/lastCloudReconnect<20000/);
 assert.doesNotMatch(app,/function buildLegacyImport\(\)/);
 assert.doesNotMatch(app,/Перенести старые билды/);
});

test('account bearer joins private library and sharing without guest-key fallback',()=>{
 const app=read('pandora-studio-app.js'),worker=read('worker/index.js'),html=read('index.html');
 assert.match(app,/window\.PandoraAccountUI\.token\(\)/);
 assert.match(app,/window\.PandoraAccountUI\.init\(/);
 assert.match(worker,/accountPrincipal\(request,env\)/);
 assert.match(app,/const bearer=credential/);
 assert.doesNotMatch(app,/bearer=credential\|\|tabGuestSecret/);
 assert.match(worker,/path\.startsWith\('\/api\/account\/'\)/);
 assert.match(html,/id="profileTrigger"/);
 assert.match(html,/id="accountPanel"/);
});
