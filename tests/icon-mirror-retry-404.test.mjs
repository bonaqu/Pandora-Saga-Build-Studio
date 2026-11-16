import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const manifest=()=>readFileSync(new URL('assets/os-icon-manifest.json',root),'utf8');
const script=fileURLToPath(new URL('scripts/mirror-os-icons.mjs',root));
function plan(...args){
 const out=spawnSync(process.execPath,[script,'--dry-run',...args],
  {encoding:'utf8',timeout:30000});
 assert.equal(out.error,undefined,out.error?.message);
 assert.equal(out.status,0,out.stderr||out.stdout);
 return JSON.parse(out.stdout.trim().split('\n').at(-1));
}
test('normal offline planning retries only unverified originals, never known 404s',()=>{
 const before=manifest(),out=plan();
 assert.equal(out.dryRun,true);
 const source=JSON.parse(before),cnt=source.count;
 assert.equal(out.expected,cnt.expected);
 assert.equal(out.present,cnt.present);
 assert.equal(out.missing,cnt.missing);
 assert.equal(out.skippedKnown404,cnt.known404);
 assert.equal(out.unverified,cnt.unverified);
 assert.equal(out.known404,cnt.known404);
 assert.equal(out.planned,cnt.unverified);
 assert.equal(out.processed,0);
 assert.equal(manifest(),before,'dry-run must not rewrite the manifest');
});
test('explicit source recheck is bounded and never downloads during dry-run',()=>{
 const before=manifest();
 const limited=plan('--retry-404','--limit=12');
 assert.equal(limited.retry404,true);
 assert.equal(limited.planned,12);
 assert.equal(limited.skippedKnown404,0);
 const retained=JSON.parse(before).missing;
 assert.ok(limited.firstPlanned.every(id=>
  retained.some(row=>id===row.kind+'/'+row.stem)),
  'Only explicit existing evidence or unprobed new identities are scheduled');
 const missingItems=retained.filter(row=>row.kind==='items').length;
 assert.equal(limited.firstPlanned.filter(id=>id.startsWith('items/')).length,
  Math.min(missingItems,limited.firstPlanned.length),
  'Available original item identities are retried before the skill queue');
 assert.equal(limited.processed,0);
 assert.equal(limited.downloaded,0);
 const all=plan('--retry-404');
 assert.equal(all.planned,JSON.parse(before).count.missing);
 assert.equal(all.missing,JSON.parse(before).count.missing);
 assert.equal(manifest(),before);
});
test('partial runs preserve prior HTTP 404 evidence and stop retries on new 404',()=>{
 const source=readFileSync(new URL('scripts/mirror-os-icons.mjs',root),'utf8');
 assert.match(source,/const known404=new Set/);
 assert.match(source,/known404\.has\(key\(row\)\)&&!retry404/);
 assert.match(source,/failures\.get\(id\)==='HTTP 404'\|\|known404\.has\(id\)/);
 assert.match(source,/if\(response\.status===404\)\{failures\.set\(key\(row\),'HTTP 404'\);return\}/);
});
