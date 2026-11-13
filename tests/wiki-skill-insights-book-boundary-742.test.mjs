import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const inspect=(id,catalog=skills)=>host.PandoraWikiSkillInsights.inspect({
 skillCatalog:catalog,classes,id,calculator:host.PandoraOSCalculator});
test('source-verified OS combat skills are explained in Wiki without invented damage',()=>{
 for(const id of [100056001,100057001,100101001,111201001]){
  const data=inspect(id);
  assert.ok(data,'missing source-backed Wiki note '+id);
  assert.ok(data.notes.some(n=>n.ru.length>24&&n.en.length>24),id);
  assert.equal(data.finalAmount,null);
  assert.equal(data.sourceOnly,true);
 }
});
test('linked multi-stage magic and recipes are available in the reference chapter',()=>{
 const dark=inspect(440003001);
 assert.ok(dark);
 assert.deepEqual(dark.paths,[[440003001,440003002],[440003001,440003003]]);
 assert.ok(dark.paths.every(path=>path.every(id=>skills[id])));
 const craft=inspect(220002001);
 assert.ok(craft);
 const recipe=craft.extra.find(x=>x.type==='recipe');
 assert.ok(recipe);
 assert.deepEqual(recipe.uses,[{id:50022,quantity:1},{id:65011,quantity:1}]);
 assert.deepEqual(recipe.produces,{id:50056,quantity:1});
});
test('a tampered root cannot reuse a static Book paragraph as official Wiki evidence',()=>{
 const altered=structuredClone(skills);
 altered[111201001].funcs[0].fv2[0]++;
 const result=inspect(111201001,altered);
 assert.equal(result,null);
});
test('Book displays current hero calculations, not the general OS catalog',()=>{
 const book=read('pandora-studio-hero-book.js');
 const block=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf('\nfunction chapterNumber('));
 assert.match(block,/row\?\.available===true/);
 assert.match(block,/skill\.available===true&&!skill\.hostile&&!skill\.recipient/);
 assert.match(block,/No calculated skill effects for this build/);
 for(const obsolete of ['stage-skill-crafting-effects','stage-skill-chain-effects',
  'stage-skill-combat-technique','stage-skill-specialized-row',
  'stage-skill-situational-row','stage-skill-support-row','stage-skill-ranged-ammo',
  'stage-skill-tactical-effects','stage-skill-enemy-debuffs'])
  assert.equal(block.includes(obsolete),false,obsolete+' must live in Wiki');
});
test('Wiki reference requirements do not borrow unrelated hero investment',()=>{
 const app=read('pandora-studio-app.js'),index=read('index.html');
 assert.match(index,/pandora-studio-wiki-skill-insights\.js/);
 assert.match(app,/PandoraWikiSkillInsights\?\.inspect/);
 const req=app.slice(app.indexOf("for(const [index,req] of (rec.reqs||[]).entries())"),
  app.indexOf("if(adminEditing&&adminToken&&(rec.reqs||[]).length<20)"));
 assert.match(req,/rec\.branchRaw==='MELEE'/);
 assert.match(req,/Суммарное освоенное мастерство/);
 assert.doesNotMatch(req,/state\.points/);
 assert.doesNotMatch(req,/wiki-requirement-progress/);
});
