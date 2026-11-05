import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const guide={};
Function('window',read('pandora-studio-honor-guide.js'))(guide);

test('all 9 monthly cloak rewards have one real item in the published source catalog',()=>{
 const items=JSON.parse(read('data/os/items.json'));
 const rewardNames=guide.PandoraHonorGuide.article({}).overview.cloaksRu
  .split(/\n/).map(line=>line.match(/[—–]\s*([^;]+);?$/)?.[1])
  .filter(Boolean).map(x=>x.replace(/[;,.]+$/,'').trim());
 assert.equal(rewardNames.length,9);
 const byName=Object.values(items);
 for(const name of rewardNames){
  const matches=byName.filter(item=>item.name===name);
  assert.equal(matches.length,1,name);
  assert.equal(matches[0].slot,'cloak',name);
 }
});

test('honor cards are not duplicated; vector icons and item hover/navigation are wired',()=>{
 const app=read('pandora-studio-app.js'),view=read('pandora-studio-honor-view.js');
 const css=read('pandora-studio-honor.css');
 assert.doesNotMatch(view,/wiki-honor-dual|wiki-honor-resource/);
 assert.doesNotMatch(view,/function honorEmblem\(/);
 assert.match(view,/honorIconSrc\(rank\.id\)/);
 assert.match(view,/wiki-honor-emblem-source/);
 assert.match(view,/cloakLink\(parts\[2\],canonical\)/);
 assert.match(app,/cloakLink:\(name,russianName\)=>/);
 assert.match(app,/PandoraStageItemUI\?\.attachPreview\(anchor,translated/);
 assert.match(app,/\['item','monster','map','npc','chest','skill','soul','instance','honor'\]/);
 assert.match(css,/wiki-honor-emblem-source/);
 assert.match(css,/\.wiki-layout-honor>\.wiki-list-panel\{/);
 assert.match(css,/position:sticky;top:12px/);
 assert.match(css,/\.wiki-honor-note\{[^}]*white-space:pre-wrap/s);
});

test('Honor section selection follows scroll without observer leaks',()=>{
 const app=read('pandora-studio-app.js'),view=read('pandora-studio-honor-view.js');
 assert.match(view,/scroller\.addEventListener\('scroll',onScroll,\{passive:true\}\)/);
 assert.match(view,/const readingLine=scroller\.getBoundingClientRect\(\)\.top/);
 assert.match(view,/selectSection\(current\)/);
 assert.match(view,/const stopObserving|function stopObserving/);
 assert.match(view,/scroller\.removeEventListener\('scroll',onScroll\)/);
 assert.match(app,/PandoraHonorView\?\.stopObserving\?\.\(\)/);
});

test('PvP map names are ordinary reversible wiki links; ranks share compact styling',()=>{
 const view=read('pandora-studio-honor-view.js'),css=read('pandora-studio-honor.css');
 assert.match(view,/link\(item\.mapId,value\)/);
 assert.match(view,/anchor\.classList\.add\('wiki-honor-location-link'\)/);
 assert.doesNotMatch(view,/wiki-honor-open-location|link\(item\.mapId,'↗'\)/);
 assert.match(css,/\.wiki-honor-list-row \.wiki-honor-location-link\.wiki-link/);
 assert.match(css,/\.wiki-honor-rank-head\{display:contents\}/);
 assert.match(css,/grid-template-columns:34px minmax\(0,1fr\)/);
 assert.match(css,/filter:grayscale\(1\) sepia\(1\)/);
 assert.doesNotMatch(view,/is-moon/);
 assert.doesNotMatch(css,/\.wiki-honor-rank\.is-moon/);
});

test('text editing preserves saved line breaks; anchors keep stable hit boxes',()=>{
 const css=read('pandora-studio-wiki-polish.css');
 const dock=read('pandora-studio-owner-dock.css');
 assert.match(css,/\[data-owner-field="desc"\]/);
 assert.match(css,/white-space:pre-wrap/);
 assert.match(css,/\.wiki-page \.wiki-description a\.wiki-link/);
 assert.match(css,/display:inline;width:auto;min-height:0/);
 assert.match(dock,/owner-dock-collapsed \.owner-dock-handle:hover/);
 assert.match(dock,/opacity:1!important;visibility:visible!important/);
});

test('Phoenix Flame hint stays outside document flow when hovered or focused',()=>{
 const css=read('pandora-studio-item-owner-editor.css');
 const term=css.match(/\.wiki-phoenix-explanation\{([^}]+)\}/)?.[1]||'';
 assert.match(term,/position:absolute/);
 assert.match(term,/pointer-events:none/);
 assert.match(term,/visibility:hidden/);
 assert.doesNotMatch(term,/display:none/);
 assert.match(css,/wiki-conditional-term:hover/);
 assert.match(css,/wiki-conditional-term:focus-visible/);
 const game=JSON.parse(read('data/os/items.json'));
 assert.match(game['252'].desc,/Пламя феникса/);
});

test('all source-sprite wrappers preserve actual 23×23 PNG pixel data',()=>{
 for(let index=0;index<12;index++){
  const path='assets/wiki/honor-ranks/'+index+'.svg';
  const sprite=read(path);
  assert.match(sprite,/viewBox="0 0 23 23"/,path);
  const source='https://pandorasaga-os.com/img/rank/2/'+index+'.png';
  assert.ok(sprite.includes(source),path+' provenance');
  const embedded=sprite.match(/<image[^>]+href="data:image\/png;base64,([^"]+)"/)?.[1];
  assert.ok(embedded,path+' must carry exact PNG data');
  const bytes=Buffer.from(embedded,'base64');
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',path);
  assert.equal(bytes.readUInt32BE(16),23,path+' PNG width');
  assert.equal(bytes.readUInt32BE(20),23,path+' PNG height');
  assert.ok(bytes.includes(Buffer.from('IDAT')),path+' image data');
 }
});

test('monthly navigation is readable at end-of-article and not pinned to 100px',()=>{
 const view=read('pandora-studio-honor-view.js');
 assert.match(view,/Math\.min\(380,scroller\.clientHeight\*\.46\)/);
 assert.match(view,/else if\(remaining<=36\)current='monthly'/);
 assert.match(view,/selectSection\(current\)/);
});

test('every D1 PvP war, including future owner-added records, has a stable internal page',()=>{
 const view=read('pandora-studio-honor-view.js'),app=read('pandora-studio-app.js');
 const next=[...guide.PandoraHonorGuide.wars,{
  id:'custom-1',nameRu:'Новая война',nameEn:'New war'
 }];
 const overrides={'guideedit.honor.wars':JSON.stringify(next)};
 assert.equal(guide.PandoraHonorGuide.validOverride('honor.wars',overrides['guideedit.honor.wars']),true);
 const wars=guide.PandoraHonorGuide.article(overrides).battles;
 assert.equal(wars.at(-1).id,'custom-1');
 assert.match(view,/const anchor=warLink\(item\.id,value\)/);
 assert.match(view,/article\.battles\.find\(war=>war\.id===warId\)/);
 assert.match(view,/warLink\(war\.id,name\)/);
 assert.match(view,/wiki-honor-war-return/);
 assert.match(app,/wikiLink\(name,'honor','war-'\+warId\)/);
 assert.match(app,/warId:\/\^war-\[a-z\]/);
 assert.match(app,/psWikiHonorScroll/);
 assert.match(app,/psWikiHonorOrigin/);
 const match=/\(item\|monster\|map\|npc\|chest\|skill\|soul\|instance\|honor\)/g;
 assert.equal([...app.matchAll(match)].length,3,
  'restore, hashchange and popstate accept Honor war deep links');
});
