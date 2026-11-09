import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
const workflowDir=new URL('../.github/workflows/',import.meta.url);
const files=readdirSync(workflowDir).filter(name=>/\.ya?ml$/i.test(name));
const read=name=>readFileSync(new URL(name,workflowDir),'utf8');

test('no unattended daily or weekly GitHub Actions cron checks consume runner capacity',()=>{
 assert.ok(files.length>=7,'Review newly added workflows alongside existing actions');
 for(const filename of files){
  const source=read(filename);
  assert.doesNotMatch(source,/^\s*schedule:\s*$/m,filename+' has an unattended schedule');
  assert.doesNotMatch(source,/^\s*-\s*cron\s*:/m,filename+' has a recurring cron');
 }
});
test('publication checks are retained and can be requested manually, with no redundant Pages event',()=>{
 const yaml=read('live-readonly.yml');
 assert.match(yaml,/^  push:\s*\n    branches: \[bonaqu_projects\]/m);
 assert.match(yaml,/^  workflow_dispatch:\s*$/m);
 assert.doesNotMatch(yaml,/^  workflow_run:\s*$/m);
 assert.match(yaml,/run: npm run catalog:parity:live/);
 assert.match(yaml,/run: npm run connection:check:full/);
 assert.match(yaml,/run: node scripts\/wait-live-release\.mjs/);
});
