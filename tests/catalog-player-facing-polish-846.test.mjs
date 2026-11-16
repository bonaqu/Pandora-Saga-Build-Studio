import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css'),
 honor=read('pandora-studio-honor-view.js');
const items=JSON.parse(read('data/os/items.json'));
const manifest=JSON.parse(read('assets/os-icon-manifest.json'));
test('PvP Honor has only an illustration, no external link or editorial attribution',()=>{
 assert.match(honor,/victories\.append\(eventImage\)/);
 assert.doesNotMatch(honor,/wiki-honor-pvp-screenshot-link|Открыть оригинальный скриншот|Источник: официальное обновление/);
 assert.doesNotMatch(honor,/href:officialScreenshot|Source: official game update/);
});
test('slot navigation comes before Close and uses matching, keyboard-friendly sizes',()=>{
 assert.match(app,/head\.insertBefore\(nav,head\.lastElementChild\)/);
 assert.doesNotMatch(app,/head\.append\(nav\)/);
 assert.match(css,/\.stage-picker-head \.stage-picker-slot-nav,\s*\.stage-picker-head>button:last-child/);
 assert.match(css,/height:32px/);
 assert.match(app,/data-stage-slot-nav/);
});
test('Eagle Mantle and Ancient King Box have exact game icon IDs and safe non-mirrored fallback',()=>{
 const named=Object.values(items);
 for(const [name,stem] of [
  ['Орлиная мантия','I_018017_00'],
  ['Шкатулка древнего короля','I_051036_00']
 ]){
  const item=named.find(row=>row.name===name);
  assert.ok(item);
  assert.equal(item.icon,stem);
  assert.equal(manifest.icons.items[stem],undefined);
  assert.ok(manifest.missing.some(x=>x.kind==='items'&&x.stem===stem&&
   x.error==='Not attempted'));
 }
 assert.match(app,/function unmirroredArtwork\(kind,stem\)/);
 assert.match(app,/missing\?\.error==='HTTP 404'/);
 assert.match(app,/unmirroredArtwork\(soul\?'souls':pathKind,rec.icon\)/);
 assert.match(app,/if\(archived\)return archived;/);
 assert.match(app,/\^\[A-Za-z0-9_-\]\{1,120\}\$/);
});
