import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,base),'utf8');
const origin={};Function('window',read('origin-model.js'))(origin);
test('old saved tab selections migrate without losing character data',()=>{
 const {tab,tabs}=origin.PandoraOriginModel;
 assert.deepEqual(tabs,['race','class','stats']);
 assert.equal(tab('passive'),'race');
 assert.equal(tab('level'),'stats');
 assert.equal(tab('stats'),'stats');
 assert.equal(tab('class'),'class');
});
test('only race change resets the selected racial passive',()=>{
 const {selectRace}=origin.PandoraOriginModel;
 const old={race:0,gender:0,racialPassiveId:900010002,points:{slash:20},stats:{Выносливость:10}};
 const gender=selectRace(old,0,1);
 assert.equal(gender.racialPassiveId,900010002);
 const race=selectRace(gender,5,0);
 assert.equal(race.racialPassiveId,null);
 assert.equal(race.points,old.points);
 assert.equal(race.stats,old.stats);
 assert.equal(old.race,0);
});
test('stat values obey current class cap and reject invalid values',()=>{
 const {statLimit,allowedStat}=origin.PandoraOriginModel;
 const classes={WARRIOR:{statCaps:{vit:99,agi:52,dex:0}}};
 assert.equal(statLimit(classes,'WARRIOR','agi'),52);
 assert.equal(statLimit(classes,'WARRIOR','dex'),0);
 assert.equal(allowedStat(53,52),false);
 assert.equal(allowedStat(0,0),true);
 assert.equal(allowedStat(-1,99),false);
 assert.equal(allowedStat(5.5,99),false);
});
test('compact labels map to original saved keys, preserving legacy builds',()=>{
 const code=read('app.js'),html=read('index.html');
 for(const short of ['ВЫН','СИЛ','ПРВ','ЛВК','СД','ИНТ'])
  assert.match(code,new RegExp("short:'"+short+"'"));
 assert.match(code,/ORIGIN_STAT_LABELS\.forEach\(\(info,i\)=>/);
 assert.match(code,/function renderOriginStats\(/);
 assert.match(code,/renderOriginPassives\(\);renderOriginStats\(\)/);
 for(const key of ['race','class','stats'])
  assert.match(html,new RegExp('data-origin-tab="'+key+'"'));
 assert.doesNotMatch(html,/data-origin-tab="passive"/);
});
