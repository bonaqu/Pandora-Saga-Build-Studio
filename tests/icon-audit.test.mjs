import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base=new URL('../',import.meta.url),src=p=>readFileSync(new URL(p,base),'utf8');
test('icon audit works offline and verifies real WebP',()=>{
 const s=src('scripts/audit-os-icons.mjs');
 assert.match(s,/isWebP\(bytes\)/);assert.match(s,/paths.has\(path\)/);
 assert.doesNotMatch(s,/fetch\(/);
});
test('strict icon audit reports incomplete archive',()=>{
 assert.match(src('scripts/audit-os-icons.mjs'),/process.argv.includes\('--strict'\)/);
 assert.match(src('package.json'),/assets:audit:strict/);
});

test('Soul icon renderer uses physically archived original Soul WebP first',()=>{
 const app=src('pandora-studio-app.js');
 assert.match(app,/const selfHostedSoul=soul\?iconManifest\?\.icons\?\.souls\?\.\[rec\.icon\]:null/);
 assert.match(app,/const archived=selfHostedSoul\|\|iconManifest/);
});


test('icon audit reconciles complete source, verified WebP, and recorded source 404s',()=>{
 const script=fileURLToPath(new URL('../scripts/audit-os-icons.mjs',import.meta.url));
 const run=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:30000});
 assert.equal(run.error,undefined,run.error?.message);
 assert.equal(run.status,0,run.stderr||run.stdout.slice(-1800));
 const data=JSON.parse(run.stdout);
 assert.deepEqual(data.issues,[]);
 assert.equal(data.expected,1437);
 assert.equal(data.present,1173);
 assert.equal(data.missing,264);
 assert.equal(data.corrupt,0);
 assert.equal(data.manifest,true);
});

test('the offline audit rejects stale 404 masks and orphaned local icons before publishing',()=>{
 const script=src('scripts/audit-os-icons.mjs');
 for(const pattern of [
  /presentPaths=new Set\(\)/,
  /missingPaths=new Set\(\)/,
  /recordedPresent\.has\(path\)/,
  /recordedMissing\.has\(path\)/,
  /Stale missing entry/,
  /Missing original has no manifest record/,
  /Manifest expected count differs from source catalog/,
  /Manifest path sets do not match current disk state/
 ])assert.match(script,pattern);
 assert.doesNotMatch(script,/fetch\(/);
});
