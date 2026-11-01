import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
 const app=src('app.js');
 assert.match(app,/const selfHostedSoul=soul\?iconManifest\?\.icons\?\.souls\?\.\[rec\.icon\]:null/);
 assert.match(app,/return selfHostedSoul\|\|iconManifest/);
});
