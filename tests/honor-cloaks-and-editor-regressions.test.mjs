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
 assert.match(view,/marker\.append\(honorEmblem\(rank\.id\)\)/);
 assert.match(view,/cloakLink\(parts\[2\],canonical\)/);
 assert.match(app,/cloakLink:\(name,russianName\)=>/);
 assert.match(app,/PandoraStageItemUI\?\.attachPreview\(anchor,translated/);
 assert.match(app,/\['item','monster','map','npc','chest','skill','soul','instance','honor'\]/);
 assert.match(css,/wiki-honor-emblem-svg/);
 assert.match(css,/\.wiki-honor-note\{[^}]*white-space:pre-wrap/s);
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
