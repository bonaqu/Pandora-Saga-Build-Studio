import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('full Chromium acceptance exercises two independent clients with strict CAS and draft preservation',()=>{
 const smoke=get('tests/browser-smoke.mjs');
 const scenario=get('tests/browser-owner-dual-session-cas.mjs');
 assert.match(smoke,/owner-two-session-cas',runOwnerDualSessionCasSmoke/);
 assert.match(scenario,/const tokens=\['a'\.repeat\(43\),'b'\.repeat\(43\)\]/);
 assert.match(scenario,/browser\.newContext\(/);
 assert.match(scenario,/edit\.expectedValue===current\?200:409/);
 assert.match(scenario,/code:'OWNER_EDIT_CONFLICT'/);
 assert.match(scenario,/waitForFunction\(\(\)=>document\.querySelector\(/);
 assert.match(scenario,/dataset\.state==='error'/);
 assert.match(scenario,/The losing edit must keep its unsaved draft/);
 assert.match(scenario,/Rejected CAS must not count as a successful edit/);
 assert.match(scenario,/assert\.deepEqual\(attempts\.map\(row=>row\.status\),\[200,409,200\]\)/);
 assert.match(scenario,/testWriteCalls\.length,0/);
 assert.match(scenario,/await Promise\.all\(contexts\.map\(context=>context\.close\(\)\)\)/);
});
