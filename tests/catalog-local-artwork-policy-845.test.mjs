import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const start=app.indexOf('function localArtwork(value){');
const end=app.indexOf('function skillIcon(',start);
assert.ok(start>0&&end>start);
const local=vm.runInNewContext(app.slice(start,end)+'\nlocalArtwork',{});
test('user-visible images permit only bounded self-hosted assets',()=>{
 for(const path of ['assets/items/icons/I_018017_00.webp',
  'assets/items/icons/I_051036_00.webp','assets/wiki/honor-victories.jpg',
  'assets/skills/icons/skill_unknown.webp','assets/favicon-ps-96.png'])
  assert.equal(local(path),true,path);
 for(const path of [
  'https://pandorasaga-os.com/icons/items/I_018017_00.webp',
  'https://other-host.com/test.png','//other-host.com/test.webp',
  'data:image/png;base64,AAAA','javascript:alert(1)',
  'assets/../config.png','assets//missing.webp',
  'assets/evil.svg',null,undefined,1,'x'.repeat(300)
 ])assert.equal(local(path),false,String(path));
});
test('owner D1 override is validated at render time and editor time',()=>{
 assert.equal((app.match(/if\(localArtwork\(custom\)\)return custom;/g)||[]).length,2);
 assert.match(app,/function allowedArtwork\(value\)\{return localArtwork\(value\); \}/);
 assert.doesNotMatch(app,/pandorasaga-os\.com/);
});
test('public icon manifest contains no external source attribution',()=>{
 const m=JSON.parse(read('assets/os-icon-manifest.json'));
 assert.equal(Object.hasOwn(m,'source'),false);
 assert.equal(m.count.present+m.count.missing,m.count.expected);
});
test('automatic source refresh has bounded new-only and complete confirmed-404 modes',()=>{
 const yml=read('.github/workflows/catalog-icon-reconcile.yml');
 assert.match(yml,/node scripts\/mirror-os-icons\.mjs --limit=90/);
 assert.match(yml,/node scripts\/mirror-os-icons\.mjs --retry-404/);
 assert.match(yml,/Verified catalog fallback auto-merge/);
 assert.doesNotMatch(yml,/schedule:|cron:|wrangler d1/);
 const script=read('scripts/mirror-os-icons.mjs');
 assert.match(script,/Number\(known404\.has\(key\(a\)\)\)/);
 assert.match(script,/some\(x=>x!=='HTTP 404'\)/);
 const ci=read('scripts/catalog-icon-reconcile-ci.mjs');
 assert.match(ci,/for\(let page=1;page<=6;page\+\+\)/);
 assert.match(ci,/pr\.changed_files!==\(files\|\|\[\]\)\.length/);
});
