import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const C=scope.PandoraOSCalculator,items=JSON.parse(read('data/os/items.json')),
 skills=JSON.parse(read('data/os/skills.json')),
 english=JSON.parse(read('data/os/strings.en.json')),
 classes=JSON.parse(read('data/os/classes.json'));
const expected=[[18022,2,1,300,0,0],[18023,3,3,1000,0,0],
 [18024,5,5,2000,5,10],[18025,2,1,300,0,0],
 [18026,3,3,1000,0,0],[18027,5,5,2000,5,10],
 [18028,2,1,300,0,0],[18029,3,3,1000,0,0],
 [18030,5,5,2000,5,10]];
const preview=(record,id,skillCatalog=skills,grade=0)=>C.battleMapCloakPreview({
 records:[['item:'+id,record,grade]],skills:skillCatalog}).entries;
test('nine official war-map cloaks show only exact original battle-map buffs in RU and EN',()=>{
 for(const [id,all,armor,hp,resistance,magic] of expected){
  const source=items[id],translated=english.items[id];
  assert.ok(source&&translated,'missing OS item '+id);
  const skillId=source.effects.find(x=>x.func==='EP_SKILL_EXEC_MAPIN')?.a;
  assert.ok(skills[skillId],'missing OS battle-map skill '+skillId);
  for(const record of [source,{...source,name:translated.n,desc:translated.d}]){
   const rows=preview(record,id);
   assert.equal(rows.length,1,'source '+id);
   assert.deepEqual([rows[0].all,rows[0].armor,rows[0].hp,
    rows[0].resistance,rows[0].magic],[all,armor,hp,resistance,magic]);
   assert.equal(rows[0].verified,false);
  }
 }
});
test('no normal permanent HP or attributes are granted from a battle-map-only skill',()=>{
 const base={classData:classes.WARRIOR,
  raceData:{vit:40,str:50,agi:70,dex:35,spi:30,int:50},
  jobData:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
  allocation:{},level:55,combatContext:{jobKey:'WARRIOR',skillCatalog:skills}};
 for(const id of [18022,18024,18030]){
  const withCloak=C.base({...base,records:[['item:'+id,items[id],0]]});
  const noCloak=C.base({...base,records:[]});
  assert.equal(withCloak.hp,noCloak.hp,id+' must not silently grant HP');
  assert.deepEqual(withCloak.stats,noCloak.stats,id+' must not silently grant attributes');
  assert.equal(withCloak.battleMapCloaks.entries.length,1);
  assert.equal(noCloak.battleMapCloaks.entries.length,0);
 }
});
test('wrong cloak ID, source key, skill, value, description, slot or grade fails closed',()=>{
 const base=items[18024],baseSkill=skills[500000046];
 for(const [source,record,grade] of [
  ['item:18025',base,0],['soul:18024',base,0],
  ['item:18024',{...base,id:18025},0],
  ['item:18024',{...base,slot:'weapon'},0],
  ['item:18024',{...base,desc:'All attributes +5 Defense +5'},0],
  ['item:18024',{...base,effects:base.effects.map(e=>e.func==='EP_SKILL_EXEC_MAPIN'?
   {...e,b:9}:e)},0],
  ...[-1,11,1.5,null].map(grade=>['item:18024',base,grade])
 ])assert.equal(C.battleMapCloakPreview({records:[[source,record,grade]],skills}).entries.length,0,
  'reject source '+source+' grade '+grade);
 const tamperedSkill={...baseSkill,funcs:baseSkill.funcs.map(row=>
  row.ep==='EP_MAXLIFE_CONST'?{...row,fv1:[0,0,0,2500]}:row)};
 assert.deepEqual(preview(base,18024,{...skills,500000046:tamperedSkill}),[]);
 assert.deepEqual(preview(base,18024,{...skills,500000046:undefined}),[]);
 const noMapChange={...baseSkill,funcs:baseSkill.funcs.filter(row=>row.ep!=='EP_LOST_MAPCHANGE')};
 assert.deepEqual(preview(base,18024,{...skills,500000046:noMapChange}),[]);
});
test('hero book displays player-friendly bilingual map-limited section, not EP codes',()=>{
 const view=read('stage-attributes.js'),calc=read('os-calculator.js');
 assert.match(view,/Бонусы плаща на военных картах/);
 assert.match(view,/Battle-map-only cloak bonuses/);
 assert.match(view,/modifiers\?\.battleMapCloaks\?\.entries/);
 assert.match(calc,/const battleMapCloaks=battleMapCloakPreview/);
 assert.match(calc,/experienceBonus,battleMapCloaks,specialEquipment/);
});
