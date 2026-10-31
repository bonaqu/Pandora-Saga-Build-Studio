import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const target={};Function('window',read('skill-results.js'))(target);
const create=target.PandoraSkillResults.create;
const cls={WARRIOR:1};
const mock={
 '1001':{id:1001,name:'Удар',learnable:true,classes:cls,
  charLevel:10,mana:15,cast:1.5,cooldown:7,damage:{kernel:'physical',slotIndex:1},
  funcs:[{ep:'EP_ONHIT_DAMAGE_SCALE'}],desc:'Наносит удар',reqs:[]},
 '1002':{id:1002,name:'Двойной удар',learnable:true,classes:cls,charLevel:0,
  reqs:[{branch:'slash',amount:8}],funcs:[{ep:'EP_PLAYER_ATTACK'}]},
 '1003':{id:1003,name:'Магия',learnable:true,classes:{MAGE:1}},
 '1004':{id:1004,name:'Админ',learnable:false,classes:cls}
};
test('the selected class catalog only includes learnable matching skill variants',()=>{
 const r=create({catalog:mock,jobKey:'WARRIOR',level:15,innate:{slash:2},trained:{slash:6}});
 assert.equal(r.total,2);assert.equal(r.available,2);
 assert.deepEqual(r.records.map(x=>x.name),['Двойной удар','Удар']);
});
test('known skill source values are not converted into fabricated final damage',()=>{
 const r=create({catalog:mock,jobKey:'WARRIOR',level:15,innate:{slash:0},trained:{slash:0}});
 const skill=r.records.find(x=>x.name==='Удар');
 assert.deepEqual([skill.mana,skill.cast,skill.cooldown],[15,1.5,7]);
 assert.equal(skill.damageKernel,'physical');
 assert.equal(skill.confirmedDamage,false);
 assert.equal(r.available,1);
});
test('mastery requirement and character level are checked separately',()=>{
 const a=create({catalog:mock,jobKey:'WARRIOR',level:5,innate:{slash:2},trained:{slash:5}});
 assert.equal(a.available,0);
 assert.match(a.records.find(x=>x.id==='1001').requirement,/Уровень 10/);
 assert.match(a.records.find(x=>x.id==='1002').requirement,/Ветка slash 7\/8/);
});
test('the book uses a collapsed search view without relocating the right workbench',()=>{
 const app=read('app.js'),view=read('stage-attributes.js'),html=read('index.html');
 assert.match(html,/skill-results\.js\?v=/);
 assert.match(view,/renderSkillInspector\(body,skillModel\)/);
 assert.match(view,/stage-skill-inspector/);
 assert.match(view,/Поиск навыка по названию/);
 assert.match(app,/PandoraSkillResults\.create/);
});
