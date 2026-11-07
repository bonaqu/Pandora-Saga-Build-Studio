import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('portrait item editor combines instant enchantment with Soul-specific sockets',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js'),ui=read('pandora-studio-equipment-ui.js');
 assert.match(html,/pandora-studio-equipment-ui\.js\?v=/);
 assert.match(html,/id="stagePicker"/);
 assert.match(app,/window\.PandoraStageItemUI\.render\(/);
 assert.match(ui,/\['choose',tr\('Выбор','Choose'\)\]/);
 assert.match(ui,/\['details',tr\('Свойства','Properties'\)\]/);
 assert.match(ui,/\['souls',tr\('Души','Souls'\)\]/);
 assert.doesNotMatch(ui,/\['gems','Самоцветы'\]/);
 assert.match(ui,/for\(let n=0;n<=10;n\+\+\)/);
 assert.match(ui,/api\.assignGem\(/);
});
test('socket insertion is protected by Soul capacity and slot compatibility',()=>{
 const app=read('pandora-studio-app.js'),ui=read('pandora-studio-equipment-ui.js');
 assert.match(app,/const count=plan\.equippedSocketCapacity\(state,selectedSlot,equipped,record\)/);
 assert.match(app,/!plan\.canSocket\(key,record,count\)/);
 assert.match(app,/if\(entry&&!plan\.validSoul\(entry,key\)\)return/);
 assert.match(ui,/plan\.canSocket\(slot,record,cap\)/);
});
test('skill points, origin attributes and lost-state protection remain',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/gameTables=data\.tables/);
 assert.match(app,/function budgetSummary\(/);
 assert.match(app,/function allowedBranch\(/);
 assert.match(app,/Math\.min\(Math\.max\(0,requested\),allowedBranch\(key\)\)/);
 assert.match(app,/sessionStorage\.setItem\(VIEW_KEY/);
 assert.match(app,/window\.addEventListener\('pagehide',saveView\)/);
 assert.match(app,/if\(bootView\.slotOpen&&!bootView\.open\)/);
});
test('Astir dress covers body and legs with recoverable previous legwear',()=>{
 const app=read('pandora-studio-app.js'),rules=read('pandora-studio-ui-planner.js');
 assert.match(app,/state\.displacedLegwear=state\.equipment\[5\]/);
 assert.match(app,/state\.equipment\[5\]=state\.displacedLegwear/);
 assert.match(rules,/function isAstirDress\(/);
 assert.match(rules,/function raceCompatible\(/);
});
