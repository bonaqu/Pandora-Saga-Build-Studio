import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('share links use random short immutable IDs and public endpoints',()=>{
 const worker=read('worker/index.js'),migration=read('worker/migrations/0003_shares.sql');
 assert.match(worker,/\/api\/shared/);
 assert.match(worker,/const id=b64\(random\(8\)\)/);
 assert.match(worker,/shared_build_limits/);
 assert.match(worker,/JSON\.stringify\(\{schema:1,type:payload\.type,data:payload\.data\}\)/);
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
test('library is local and import/export JSON buttons are absent',()=>{
 const src=read('app.js'),html=read('index.html');
 assert.match(src,/ps-build-library\.v1/);
 assert.match(src,/persistBuilds\(\)/);
 assert.doesNotMatch(src,/text:'⇩ Экспорт JSON'/);
 assert.doesNotMatch(src,/text:'⇧ Импорт JSON'/);
 assert.match(html,/data-tab="builds"/);
});
test('skill and stat editing remain in one screen',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.doesNotMatch(html,/data-tab="(?:skills|stats)"/);
 assert.match(app,/class:'inline-skill-list'/);
 assert.match(html,/data-origin-tab="stats"/);
});
