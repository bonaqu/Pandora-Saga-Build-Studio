import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
 assert.match(guard,/response\.status!==401/);
 assert.doesNotMatch(guard,/method:\s*'POST'|method:\s*"POST"/);
 assert.doesNotMatch(guard,/DELETE FROM|INSERT INTO|UPDATE private_builds/);
});
