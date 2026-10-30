import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,base),'utf8');
test('hero path has one interactive mastery bar containing the slider and skills',()=>{
 const app=read('app.js'),css=read('style.css');
 assert.match(app,/const track=h\('div',\{class:'inline-mastery-track'/);
 assert.match(app,/track\.append\(bed,fill\)/);
 assert.match(app,/track\.append\(range\)/);
 assert.match(app,/track\.append\(rail\)/);
 assert.match(app,/editor\.append\(row,track,controls\)/);
 assert.match(css,/\.inline-mastery-track \.inline-branch-milestones\{/);
});
test('mastery fill cannot extend past allocated branch points and requested budget',()=>{
 const app=read('app.js');
 assert.match(app,/Number\(state\.points\[id\]\|\|0\)\/cap\*100/);
 assert.match(app,/const n=Math\.min\(requested,allowedBranch\(id\)\)/);
 assert.match(app,/range\.value=String\(n\);progress\(\)/);
 assert.match(app,/marker\.classList\.toggle\('reached',n>=Number\(marker\.dataset\.threshold\)\)/);
});
test('unlock markers open inline skill details instead of separate Skills tab',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.match(app,/onclick:\(\)=>\{selectedSkill=skill;inlineBranchId=id;renderBranches\(\)\}/);
 assert.doesNotMatch(html,/data-tab="skills"/);
});
