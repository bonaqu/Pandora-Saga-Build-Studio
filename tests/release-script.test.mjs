import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('repository release guard passes without GitHub Actions or network',()=>{
 const script=fileURLToPath(new URL('../scripts/release-version.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[script,'--check'],{encoding:'utf8',timeout:10000});
 assert.equal(result.error,undefined,result.error?.message);
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.match(result.stdout,/Release \d{4}\.\d{1,2}\.\d{1,2}\.\d+ is consistent/);
});
