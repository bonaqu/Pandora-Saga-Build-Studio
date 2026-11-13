import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-book-skill-thresholds.js'))(root);
Function('window',read('pandora-studio-encyclopedia-data.js'))(root);
const calc=root.PandoraOSCalculator;
const book=root.PandoraBookSkillThresholds;
const wiki=root.PandoraWikiData;
const skills=JSON.parse(read('data/os/skills.json'));
const items=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const opts=(job,masteries)=>({skillCatalog:skills,jobKey:job,
 level:45,branchMasteries:masteries,
 branchCaps:classes[job].branchCaps});
const action=(kind,row,options,records=skills,catalog=items)=>
 book.materialAction({kind,row,skillCatalog:records,items:catalog,
  jobKey:options.jobKey,level:options.level,
  branchMasteries:options.branchMasteries,
  branchCaps:options.branchCaps});
test('Current Enchanter craft projects exact Holy Water and ingredient quantities',()=>{
 const player=opts('ENCHANTER',{blessing:78});
 const rows=calc.craftingSkillPreview(player).rows;
 const skill=rows.find(r=>r.id===320010001);
 assert.equal(skill?.requirementsMet,true);
 const a=action('craft',skill,player);
 assert.deepEqual(a?.materials,[{id:65011,quantity:1}]);
 assert.deepEqual(a?.produces,{id:50059,quantity:1});
 assert.equal(a?.mana,4);
 assert.equal(a?.cast,1);
 assert.deepEqual(book.materialUseBudget({action:a,maxMana:450}),{
  casts:112,remainder:2,maxMana:450,
  materials:[{id:65011,quantity:112}],baseOnly:true
 });
 // The manufacturing output is per application; a mana-only count is
 // deliberately NOT a promise of crafted inventory or successful rolls.
 assert.equal(book.materialUseBudget({action:a,maxMana:null}),null);
 assert.equal(book.materialUseBudget({action:a,maxMana:450.5}),null);
 assert.equal(book.materialUseBudget({action:{...a,mana:0},maxMana:450}),null);
});
test('Traps use one or two exact items; source action respects current trained mastery',()=>{
 const player=opts('PREDATOR',{trap:41});
 const rows=calc.trapSkillCostPreview(player).rows;
 const trap=rows.find(r=>r.id===240005001);
 assert.equal(trap?.requirementsMet,true);
 const a=action('trap',trap,player);
 assert.equal(a?.produces,null);
 assert.equal(a?.mana,33);
 assert.deepEqual(a?.materials,[{id:65007,quantity:2}]);
 assert.deepEqual(book.materialUseBudget({action:a,maxMana:450}),{
  casts:13,remainder:21,maxMana:450,
  materials:[{id:65007,quantity:26}],baseOnly:true
 });
 const locked=calc.trapSkillCostPreview(opts('PREDATOR',{trap:15}))
  .rows.find(r=>r.id===240005001);
 assert.equal(locked?.requirementsMet,false);
 assert.equal(action('trap',locked,opts('PREDATOR',{trap:15})),null);
});
test('All four recipes and five trap actions are sourced; impossible entries stay out',()=>{
 const creator=opts('PREDATOR',{alchemy:90,trap:70});
 const recipeRows=calc.craftingSkillPreview(creator).rows;
 const trapRows=calc.trapSkillCostPreview(creator).rows;
 assert.deepEqual(recipeRows.map(r=>r.id),[220002001,220003001,220004001]);
 assert.deepEqual(trapRows.map(r=>r.id),
  [240001001,240002001,240005001,240008001,240010001]);
 for(const row of recipeRows)assert.ok(action('craft',row,creator));
 for(const row of trapRows)assert.ok(action('trap',row,creator));
 const blessed=opts('ENCHANTER',{blessing:41});
 assert.equal(calc.craftingSkillPreview(blessed).rows.some(r=>r.id===320010001),true);
 const p=calc.craftingSkillPreview(blessed).rows.find(r=>r.id===320010001);
 assert.equal(action('craft',p,{...blessed,jobKey:'WARRIOR'}),null);
 assert.equal(action('craft',{...p,requirementsMet:false},blessed),null);
 assert.equal(action('craft',{...p,uses:[{id:65011,quantity:2}]},blessed),null);
 const mutated={...skills,'320010001':{
  ...skills['320010001'],
  funcs:skills['320010001'].funcs.map((f,i)=>i===0?
   {...f,fv2:[0,0,0,2]}:f)
 }};
 assert.equal(action('craft',p,blessed,mutated),null);
 const missing={...items};delete missing['65011'];
 assert.equal(action('craft',p,blessed,skills,missing),null);
});
test('Encyclopedia links crafted reagents to actual learnable consumer skills',()=>{
 const consumers=output=>wiki.itemSkillRelations(output,skills)
  .filter(r=>r.consumes.includes(output)&&skills[r.id]?.learnable===true)
  .map(r=>Number(r.id));
 assert.deepEqual(consumers(50056),[220001001,220001003,220006001]);
 assert.deepEqual(consumers(50059),[310003001]);
 const app=read('pandora-studio-app.js');
 assert.match(app,/wiki-skill-recipe-followups/);
 assert.match(app,/itemSkillRelations\(outputId,wikiData\.skills\)/);
 const bookSource=read('pandora-studio-hero-book.js');
 assert.match(bookSource,/materialSkillResults\(body,/);
 assert.match(bookSource,/stage-material-actions/);
 assert.match(bookSource,/onItem\?\.\(id\)/);
 assert.doesNotMatch(bookSource,/wiki-skill-source-recipe/);
});
