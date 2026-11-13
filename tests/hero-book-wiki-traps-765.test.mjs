import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(root);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const inspect=(id,s=skills)=>root.PandoraWikiSkillInsights.inspect({
 skillCatalog:s,classes,id,calculator:root.PandoraOSCalculator
});
test('Crawling Trap: validated setup -> projectile -> fire blast in Encyclopedia',()=>{
 const row=inspect(240005001);
 assert.equal(row?.pathKind,'trap');
 assert.deepEqual(row.paths,[[240005001,240005002,240005003]]);
 assert.deepEqual(row.extra.filter(x=>x.type==='trap'),[
  {type:'trap',count:2,itemId:65007}]);
 assert.equal(row.finalAmount,null,'No target damage is assumed');
 assert.equal(skills['240005003'].element,'FIRE');
 assert.equal(skills['240005003'].damage?.kernel,'element');
 assert.equal(skills['240005003'].funcs[0]?.ep,'EP_ELEMENT_DAMAGE');
 assert.deepEqual(skills['240005003'].funcs[0]?.fv1,[680,0,350,155]);
});
test('Other sourced traps keep distinct execution graphs and required materials',()=>{
 for(const [id,path,count] of [
  [240001001,[240001001,240001050],1],
  [240002001,[240002001,240002050],1],
  [240008001,[240008001,240008002],1],
  [240010001,[240010001,240010002,240010003],1]
 ]){
  const row=inspect(id);
  assert.equal(row?.pathKind,'trap',String(id));
  assert.deepEqual(row.paths,[path],String(id));
  assert.ok(row.extra.some(x=>x.type==='trap'&&x.count===count&&
   x.itemId===65007));
  assert.equal(row.finalAmount,null);
 }
});
test('Corrupted trap effect suppresses special trap interpretation, never invents damage',()=>{
 const edited=structuredClone(skills);
 edited['240005003'].funcs[0].fv1[0]=681;
 const row=inspect(240005001,edited);
 assert.ok(!row||row.pathKind!=='trap');
 assert.ok(!row||!row.extra.some(x=>x.type==='trap'));
 const missing=structuredClone(skills);
 delete missing['240005003'];
 const missingRow=inspect(240005001,missing);
 assert.ok(!missingRow||missingRow.pathKind!=='trap');
});
test('Hero Book has zero crafting material views, Wiki keeps both recipes and trap roles',()=>{
 const book=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-hero-book-additions.css');
 assert.doesNotMatch(book,/function materialSkillResults\(|materialSkillResults\(body|stage-material-actions/);
 assert.doesNotMatch(css,/stage-material-actions|stage-material-item-link/);
 const wiki=read('pandora-studio-app.js');
 assert.match(wiki,/extra\.type==='recipe'/);
 assert.match(wiki,/extra\.type==='trap'/);
 assert.match(wiki,/evidence\.pathKind==='trap'/);
 assert.match(wiki,/Огненный взрыв:/);
 assert.match(wiki,/Projectile:/);
 assert.match(wiki,/wiki-skill-source-chain/);
 assert.match(wiki,/wiki-skill-source-material/);
});
