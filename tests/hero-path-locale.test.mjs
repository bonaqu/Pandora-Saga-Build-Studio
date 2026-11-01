import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../hero-path.js',import.meta.url),'utf8');
function check(lang){
 const root={PandoraSkillProgression:{potential:()=>0,trained:()=>0}};
 Function('window','document',source)(root,{});
 const api={lang,job:'MAGE',state:{level:1},skillCatalog:[],branchName:id=>id};
 return root.PandoraHeroPath.readiness({
  id:'skill-99',charLevel:20,classes:{CLERIC:true},
  reqs:[{branch:'magic',amount:10}],learnable:false
 },api);
}
test('Hero Path skill availability messages are translated by interface language',()=>{
 const en=check('en');
 assert.equal(en.learned,false);
 for(const label of ['Unavailable to this class','Requires level 20',
   'magic: spent 0/10','magic: mastery 0/10','Special learning method required'])
  assert.ok(en.problems.includes(label),label);
 const ru=check('ru');
 for(const label of ['Не подходит профессии','Требуется уровень 20',
   'magic: вложено 0/10','magic: мастерство 0/10','Особый способ изучения'])
  assert.ok(ru.problems.includes(label),label);
});
test('skill detail fields and workspace labels translate without rewriting game data',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(source.includes("tr(api,'Уровень персонажа','Character level')"));
 assert.ok(source.includes("tr(api,'Требования по веткам','Branch requirements')"));
 assert.ok(source.includes("'Show more ('"));
 assert.ok(app.includes('Hero Workshop'));
 assert.ok(app.includes('Full encyclopedia entry'));
});
