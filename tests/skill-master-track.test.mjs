import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,base),'utf8');
test('mastery, potential and skill icon milestones share a single visual track',()=>{
 const ui=read('hero-path.js'),css=read('style.css');
 assert.match(ui,/class:'inline-mastery-track'/);
 assert.match(ui,/class:'inline-mastery-fill'/);
 assert.match(ui,/class:'inline-mastery-green'/);
 assert.match(ui,/track\.append\(bed,gold,green\)/);
 assert.match(ui,/track\.append\(rail\)/);
 assert.match(css,/\.inline-mastery-track \.inline-mastery-green/);
});
test('right side exposes free/spent/total budget and immediate branch allocation',()=>{
 const html=read('index.html'),app=read('app.js'),ui=read('hero-path.js');
 assert.match(html,/id="budgetState"/);
 for(const text of ['Свободно','Вложено','Всего'])assert.ok(app.includes(text));
 assert.match(ui,/onAllocate\(key,requested,final\)/);
 assert.match(app,/model\.canAllocate\(gameTables\?\.abilityPoint/);
 assert.match(ui,/onMastery\(key,Number\(input\.value\)\)/);
});
test('path has gallery with available/grey skill cards and both pages',()=>{
 const html=read('index.html'),ui=read('hero-path.js');
 assert.match(html,/id="pathSkillsPage"/);
 assert.match(html,/id="pathAutoMastery"/);
 assert.match(html,/id="pathSkillGallery"/);
 assert.doesNotMatch(html,/id="allSkills"/);
 assert.match(ui,/path-skill-card/);
 assert.match(ui,/readiness\(previous,api,chain\)/);
});
