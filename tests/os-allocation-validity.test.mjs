import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('app.js'),tables=JSON.parse(read('data/os/tables.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('attribute-progression.js'))(host);
const start=app.indexOf('function allocationIssue(){');
const end=app.indexOf('function renderAllocationWarning(){',start);
assert.ok(start>=0&&end>start,'allocation validation must be present');
const make=({stats={},budget=0}={})=>
 Function('window','gameTables','catalog','state','STATS','jobKeys','budgetSummary',
  app.slice(start,end)+'return allocationIssue();')(
   host,tables,{classes},{race:0,job:0,level:45,stats},['vit','str','agi','dex','spi','int'],
   ['WARRIOR'],()=>({remaining:budget,total:100,spent:100-budget}));
test('valid level-45 character with no excess stat/skill points is calculable',()=>{
 const ok=make({stats:{},budget:0});
 assert.deepEqual(ok,{invalid:false,statsInvalid:false,skillsInvalid:false});
});
test('former level-55 stat allocation cannot be presented as legal level-45 result',()=>{
 const excessive=make({stats:{vit:60,str:60,agi:60,dex:60,spi:60,int:60}});
 assert.equal(excessive.statsInvalid,true);
 assert.equal(excessive.invalid,true);
});
test('over-budget mastery also blocks final values without erasing points',()=>{
 const excessive=make({stats:{},budget:-3});
 assert.equal(excessive.statsInvalid,false);
 assert.equal(excessive.skillsInvalid,true);
 assert.equal(excessive.invalid,true);
});
test('site exposes clear allocation message and refuses misleading current-server numbers',()=>{
 assert.match(read('index.html'),/id="allocationWarning"/);
 assert.match(app,/function renderAllocationWarning\(\)/);
 assert.match(app,/if\(allocationIssue\(\)\?\.invalid\)return null/);
 assert.match(app,/render\(\)\{syncLevelLimit\(\);renderAllocationWarning\(\)/);
 assert.match(app,/перераспределите очки/i);
});
