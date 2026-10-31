import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('transfer key is revealed on demand, not embedded directly in public library HTML',()=>{
 const src=read('app.js'),html=read('index.html');
 assert.match(src,/function buildLibraryTransfer\(\)/);
 assert.match(src,/value:'',class:'build-transfer-key'/);
 assert.match(src,/field\.value=cloudToken\(\)/);
 assert.match(src,/navigator\.clipboard\.writeText\(cloudToken\(\)\)/);
 assert.match(src,/Перенести библиотеку на другое устройство/);
 assert.doesNotMatch(html,/ps-build-library-secret\.v1/);
});
test('switch validates remote owner, refuses pending deletions and preserves local data',()=>{
 const app=read('app.js');
 assert.match(app,/if\(queuedDeletes\(\)\.length\)/);
 assert.match(app,/await cloudLibraryRequest\(null,trimmed\)/);
 assert.match(app,/if\(!response\.records\.length&&builds\.length\)/);
 assert.match(app,/localStorage\.setItem\(CLOUD_TOKEN_KEY,trimmed\)/);
 assert.match(app,/selectActiveBuild\(null\);libraryChangeId\+\+/);
 assert.match(app,/void loadCloudBuilds\(\)/);
 assert.match(app,/Подключить и объединить/);
});
