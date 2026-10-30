import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('portrait item editor combines instant enchantment with Soul-specific sockets',()=>{
 const html=read('index.html'),app=read('app.js'),ui=read('stage-item-ui.js');
 assert.match(html,/stage-item-ui\.js\?v=/);
 assert.match(html,/id="stagePicker"/);
 assert.match(app,/window\.PandoraStageItemUI\.render\(/);
 assert.match(ui,/\['choose','Выбор'\]/);
 assert.match(ui,/\['details','Свойства'\]/);
 assert.match(ui,/\['souls','Души'\]/);
 assert.doesNotMatch(ui,/\['gems','Самоцветы'\]/);
 assert.match(ui,/for\(let n=0;n<=10;n\+\+\)/);
 assert.match(ui,/onclick:\(\)=>api\.assignGem\(/);
});
test('socket insertion is protected by Soul capacity and slot compatibility',()=>{
 const app=read('app.js'),ui=read('stage-item-ui.js');
 assert.match(app,/const capacity=plan\.socketCapacity\(record\)/);
 assert.match(app,/!plan\.canSocket\(key,record\)/);
 assert.match(app,/if\(entry&&!plan\.validSoul\(entry,key\)\)return/);
 assert.match(ui,/plan\.canSocket\(slot,record\)/);
});
test('skill points, origin attributes and lost-state protection remain',()=>{
 const app=read('app.js');
 assert.match(app,/\.\/data\/os\/tables\.json/);
 assert.match(app,/function budgetSummary\(/);
 assert.match(app,/function allowedBranch\(/);
 assert.match(app,/n>allowedBranch\(id\)/);
 assert.match(app,/sessionStorage\.setItem\(VIEW_KEY/);
 assert.match(app,/window\.addEventListener\('pagehide',saveView\)/);
 assert.match(app,/if\(bootView\.slotOpen&&!bootView\.open\)/);
});
test('Astir dress covers body and legs with recoverable previous legwear',()=>{
 const app=read('app.js'),rules=read('ui-planner.js');
 assert.match(app,/state\.displacedLegwear=state\.equipment\[5\]/);
 assert.match(app,/state\.equipment\[5\]=state\.displacedLegwear/);
 assert.match(rules,/function isAstirDress\(/);
 assert.match(rules,/function raceCompatible\(/);
});
