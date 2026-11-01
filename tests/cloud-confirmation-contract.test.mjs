import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const locale=readFileSync(new URL('../ui-locale.js',import.meta.url),'utf8');
test('overwrite confirmation reports browser persistence, never unconfirmed cloud success',()=>{
 const start=app.indexOf('const overwriteChoice=');
 const end=app.indexOf('const deleteChoice=',start);
 assert.ok(start>0&&end>start);
 const part=app.slice(start,end);
 assert.match(part,/saveBuild\(state\.name,b\.id\)/);
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
