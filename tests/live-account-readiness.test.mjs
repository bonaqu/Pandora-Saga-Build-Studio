import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/check-live-connections.mjs',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/account.js',import.meta.url),'utf8');
test('production readiness requires accounts after verified 0005 and never attempts registration',()=>{
 assert.match(source,/check\(payload\?\.features\?\.accounts===true,'D1 player accounts'/);
 assert.match(source,/\/api\/account\/me/);
 assert.match(source,/response\.status===401/);
 assert.match(source,/Sign in required/);
 assert.doesNotMatch(source,/\/api\/account\/(?:register|login|password|recover)/);
 assert.match(worker,/if\(kind==='me'\)\{[\s\S]*?request\.method!=='GET'[\s\S]*?error\('Sign in required',401\)/);
});
