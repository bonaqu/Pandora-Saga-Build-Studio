import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('new heroes are level 1 and sharing is exclusively per saved build',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.match(app,/function fresh\(\)\{return\{race:1,gender:0,job:16,level:1,/);
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
 const mock={prepare:()=>({all:async()=>({results:[]})})};
 const request=new Request(endpoint,{headers:{Origin:origin}});
 assert.equal((await worker.fetch(request,{DB:mock})).status,503);
 const other={prepare:()=>({all:async()=>({results:[{name:'private_builds'}]})})};
 assert.equal((await worker.fetch(request,{DB:other})).status,401);
 assert.match(read('worker/migrations/0004_private_builds.sql'),/CREATE TABLE IF NOT EXISTS private_builds/);
 assert.match(read('worker/index.js'),/CREATE TABLE IF NOT EXISTS shared_builds/);
 assert.match(read('worker/index.js'),/CREATE TABLE IF NOT EXISTS private_builds/);
 assert.match(read('app.js'),/function queuedDeletes\(/);
 assert.match(read('index.html'),/id="newBuildQuick"/);
});
