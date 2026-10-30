import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const root=new URL('../',import.meta.url);
const load=p=>readFileSync(new URL(p,root),'utf8');

test('version 0.30 exposes in-portrait item editor with its own bundled script',()=>{
 const html=load('index.html'),js=load('app.js'),ui=load('stage-item-ui.js');
 assert.match(html,/stage-item-ui\.js\?v=/);
 assert.match(html,/id="stagePicker"/);
 assert.match(js,/window\.PandoraStageItemUI\.render\(/);
 assert.match(ui,/\['choose','Выбор'\]/);
 assert.match(ui,/\['details','Свойства'\]/);
 assert.match(ui,/\['souls','Души'\]/);
 assert.match(ui,/\['gems','Самоцветы'\]/);
 assert.match(ui,/for\(let i=0;i<=10;i\+\+\)/);
});
test('Soul socket insertion is protected by real capacity and slot compatibility',()=>{
 const app=load('app.js'),ui=load('stage-item-ui.js');
 assert.match(app,/const capacity=plan\.socketCapacity\(record\)/);
 assert.match(app,/if\(entry&&!plan\.validSoul\(entry,key\)\)return/);
 assert.match(ui,/api\.selectedSocket>=Number\(record\.soulslot\)/);
});
test('OS ability budget is loaded and cannot be exceeded by a manual edit',()=>{
 const app=load('app.js');
 assert.match(app,/\.\/data\/os\/tables\.json/);
 assert.match(app,/function budgetSummary\(/);
 assert.match(app,/function allowedBranch\(/);
 assert.match(app,/value>allowedBranch\(branch\)/);
 assert.match(app,/n>allowedBranch\(id\)/);
});
test('refresh restores studio location and does not change the build format',()=>{
 const app=load('app.js');
 assert.match(app,/sessionStorage\.setItem\(VIEW_KEY/);
 assert.match(app,/window\.addEventListener\('pagehide',saveView\)/);
 assert.match(app,/document\.addEventListener\('pandora:before-update',saveView\)/);
 assert.match(app,/if\(bootView\.slotOpen&&!bootView\.open\)/);
 assert.doesNotMatch(app,/scrollIntoView\(/);
});
test('Astir dress occupies body and legs, with original clothes recoverable',()=>{
 const app=load('app.js'),rules=load('ui-planner.js');
 assert.match(app,/state\.displacedLegwear=state\.equipment\[5\]/);
 assert.match(app,/state\.equipment\[5\]=state\.displacedLegwear/);
 assert.match(rules,/function isAstirDress\(/);
 assert.match(rules,/function raceCompatible\(/);
});
