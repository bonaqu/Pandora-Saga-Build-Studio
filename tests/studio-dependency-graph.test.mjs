import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('Pandora Studio HTML assets and runtime dependencies stay connected',()=>{
 const script=fileURLToPath(new URL('../scripts/audit-studio-dependencies.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:30000});
 assert.equal(result.error,undefined,result.error?.message);
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.match(result.stdout,/Studio graph check passed/);
});
