import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Origin and hero stage do not show Remaked methodology notes to ordinary players',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js');
 assert.doesNotMatch(html,/Числовые показатели скорости из Remaked/);
 assert.doesNotMatch(html,/из актуальной таблицы OS, а не старой версии Remaked/);
 assert.doesNotMatch(app,/Часть эффектов заточки, комплектов и умений пока не проверена/);
 assert.match(app,/info\.hidden=Boolean\(calculated\)/);
});
test('invalid saved character is caught by the per-card share handler',()=>{
 const app=read('pandora-studio-app.js');
 const part=app.slice(app.indexOf('async function createShared('),app.indexOf('function openSharedSnapshot('));
 assert.match(part,/try\{\s*\/\/ Validation is synchronous/);
 assert.match(part,/sanitizeSharedState\(build\.data\)/);
 assert.match(part,/catch\(error\)/);
 assert.match(part,/class:'share-editorial-row build-share-error'/);
 assert.match(part,/class:'share-runtime-detail'/);
 assert.match(part,/if\(host\.isConnected\)\{\s*host\.replaceChildren\(row\);/);
});
