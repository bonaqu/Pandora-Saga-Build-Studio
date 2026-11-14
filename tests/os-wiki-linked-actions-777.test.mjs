import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
const model=host.PandoraWikiSkillInsights;
const inspect=(id,catalog=game)=>model.inspect({
 skillCatalog:catalog,classes,id,calculator:{}
});
const ids=[213608001,330061001,410026001];
test('Source-linked encyclopedic actions are readable and never pretend to be final hero damage',()=>{
 for(const id of ids){
  const insight=inspect(id);
  assert.ok(insight,'known skill '+id);
  assert.equal(insight.sourceOnly,true);
  assert.equal(insight.finalAmount,null);
  assert.equal(insight.pathKind,'damage');
  assert.equal(insight.extra.length,0);
  assert.equal(insight.paths[0][0],id);
  assert.ok(insight.notes[0].ru&&insight.notes[0].en);
  assert.ok(game[id].name&&en.skills[String(id)].n);
 }
 assert.deepEqual(inspect(213608001).paths,[[213608001,213608002]]);
 assert.deepEqual(inspect(330061001).paths,[[330061001,330061002]]);
 assert.deepEqual(inspect(410026001).paths,
  [[410026001,410026002,410026004],
   [410026001,410026002,410026003]]);
 assert.match(inspect(213608001).notes[0].ru,/один боеприпас/);
 assert.match(inspect(330061001).notes[0].ru,/три отдельных световых удара/);
});
test('Pinned 2-node source mechanics refuse drift at any stage or effect',()=>{
 for(const id of [213608001,330061001,410026001]){
  const source=inspect(id);
  const involved=new Set(source.paths.flat());
  for(const nodeId of involved){
   const changed=structuredClone(game);
   changed[String(nodeId)].funcs[0].fv1[3]+=1;
   assert.equal(inspect(id,changed),null,id+' changed stage '+nodeId);
  }
 }
 const missing=structuredClone(game);
 delete missing['410026003'];
 assert.equal(inspect(410026001,missing),null);
 const changedReq=structuredClone(game);
 changedReq['330061001'].reqs[0].amount+=1;
 assert.equal(inspect(330061001,changedReq),null);
 const wrongAmmo=structuredClone(game);
 wrongAmmo['213608001'].funcs[1].fv2[3]+=1;
 assert.equal(inspect(213608001,wrongAmmo),null);
});
test('Other source-verified linked attacks retain their encyclopedia paths',()=>{
 for(const spec of host.PandoraOSTargetDamage.linkedSpells){
  const record=game[String(spec.id)];
  const preview=inspect(spec.id);
  assert.ok(record?.name&&preview?.paths?.length,record?.name||spec.id);
  assert.ok(preview.paths.some(path=>
   path.join(':')===spec.path.map(row=>row.id).join(':')));
  assert.equal(preview.finalAmount,null);
 }
});
test('The Hero Book never adds item crafting or undecided multi-hit totals',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 const path=read('pandora-studio-hero-path.js');
 assert.match(app,/PandoraOSTargetDamage\?\.supportedSkillHits/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
 assert.match(app,/evidence\.pathKind==='damage'/);
 assert.match(path,/make\(canNavigate\?'button':'span'/);
});
