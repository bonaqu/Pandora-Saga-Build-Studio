import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
Function('window',read('pandora-studio-remaked-buffs.js'))(env);
const C=env.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const attrs={vit:17,str:13,agi:14,dex:15,spi:16,int:12};
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const input=(classData,level)=>({classData,level,
 raceData:attrs,jobData:zeros,allocation:zeros});

test('all 28 classes × 55 levels survive null optional context containers unchanged',()=>{
 let compared=0;
 for(const [job,cls] of Object.entries(classes))
  for(let level=1;level<=55;level++){
   const data=input(cls,level),expected=C.base(data);
   const actual=C.base({...data,attributeBuffs:null,combatContext:null,
    supplementalFlat:null,gemSelections:null});
   assert.ok(expected&&actual&&Number.isFinite(actual.hp)&&Number.isFinite(actual.mp),
    job+' level '+level);
   assert.deepEqual(actual,expected,job+' level '+level);
   compared++;
  }
 assert.equal(compared,1540);
});

test('malformed outer optional group shapes equal omitted settings',()=>{
 const data=input(classes.CLERIC,45);
 const expected=C.base(data);
 const variants=[
  {attributeBuffs:false,combatContext:0,supplementalFlat:'broken',gemSelections:{}},
  {attributeBuffs:[],combatContext:[],supplementalFlat:[],gemSelections:{length:2}},
  {attributeBuffs:'broken',combatContext:'broken',supplementalFlat:1,gemSelections:42},
  {attributeBuffs:null,combatContext:null,supplementalFlat:null,gemSelections:new Set()}
 ];
 for(const values of variants)
  assert.deepEqual(C.base({...data,...values}),expected);
});

test('invalid saved skill-ID types cannot grant allied Natural Recovery',()=>{
 const data={...input(classes.CLERIC,45),combatContext:{skillCatalog:skills}};
 const baseline=C.base(data);
 assert.ok(baseline);
 assert.equal(baseline.allyNaturalRecovery,null);
 for(const malformed of ['330005001',1,{},false]){
  const result=C.base({...data,attributeBuffs:{remakedSkillIds:malformed}});
  assert.ok(result);
  assert.equal(result.allyNaturalRecovery,null,'malformed '+String(malformed));
 }
 const selected=C.base({...data,attributeBuffs:{remakedSkillIds:[330005001]}});
 assert.equal(selected?.allyNaturalRecovery?.id,330005001);
 assert.equal(selected.allyNaturalRecovery.mpPerPulse,4);
});

test('bad resistance selections cannot invoke array filter or a false spell',()=>{
 const data=input(classes.CLERIC,45),expected=C.base(data);
 for(const malformed of ['330004001',330004001,{},true]){
  const result=C.base({...data,attributeBuffs:{resistanceSkillIds:malformed}});
  assert.deepEqual(result,expected,'malformed '+String(malformed));
 }
 const valid=C.base({...data,attributeBuffs:{resistanceSkillIds:[330004001]},
  combatContext:{skillCatalog:skills}});
 assert.ok(valid,'normal numeric selections still calculate');
});

test('false Inspiration selectors never change modeled casting time',()=>{
 const common={stats:{vit:40,str:50,agi:70,dex:35,spi:30,int:50},
  jobKey:'CLERIC',level:45,skillCatalog:skills};
 const preview=selected=>C.combatPreview({...common,
  combatBuffs:{remakedSkillIds:selected}});
 for(const malformed of ['320006001',320006001,{},false,null]){
  const r=preview(malformed);
  assert.equal(r?.castTime?.known,100,'invalid '+String(malformed));
  assert.equal(r.castTime.allyReduction,0);
 }
 const real=preview([320006001]);
 assert.equal(real?.castTime?.known,50);
 assert.equal(real.castTime.allyReduction,50);
});

test('valid flat bonuses and selected Honor remain applied exactly once',()=>{
 const source={...input(classes.WARRIOR,45),supplementalFlat:{str:5},
  attributeBuffs:{honorTitle:1},combatContext:{skillCatalog:skills},
  gemSelections:[]};
 const result=C.base(source);
 assert.ok(result);
 assert.equal(result.stats.str,19);
 assert.equal(source.supplementalFlat.str,5,'caller record is unchanged');
 assert.equal(source.attributeBuffs.honorTitle,1);
});
