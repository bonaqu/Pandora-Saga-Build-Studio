import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:50,str:30,agi:50,dex:40,spi:60,int:45};
const row=(effects,grade=0,source='item:test')=>[source,{name:'Test gear',effects},grade];
const known=[
 {func:'EP_ONDAMAGE_FIN_DAMAGE_CONST',a:-3},
 {func:'EP_ONDAMAGE_FIN_DAMAGE_SCALE',a:-5},
 {func:'EP_ONDAMAGE_ELEM_SCALE',a:-7},
 {func:'EP_AURADAMAGE_CONST',a:4},
 {func:'EP_AURADAMAGE_SCALE',a:20},
 {func:'EP_SKILL_BENCH',a:-2},
 {func:'EP_BADEFFECT_TIME_CAST_SCALE',a:10},
 {func:'EP_BADEFFECT_TIME_SCALE',a:15},
 {func:'EP_ONDAMAGE_REFLECTION',a:5},
 {func:'EP_BUFF_TOHIT_SCALE',a:8},
 {func:'EP_SPECIAL_WARDING_TYPE2',a:3},
 {func:'EP_HEAL_TIME_SCALE',a:9},
 {func:'EP_SKILL_DELAY',a:-5},
 {func:'EP_SKILL_DELAY_FIN',a:3}
];
test('Remaked enhancement map preserves 14 secondary EP stat destinations',()=>{
 const x=C.secondaryEffectsPreview({records:[row(known)]});
 assert.deepEqual(Object.fromEntries(Object.entries(x).filter(([k])=>k!=='traces')),{
  incomingPhysicalFlat:-3,incomingPhysicalPercent:-5,incomingMagicPercent:-7,
  auraFlat:4,auraPercent:20,cooldown:-2,outgoingDebuffDuration:10,
  incomingDebuffDurationReduction:-15,physicalReflection:5,
  debuffSuccess:8,damageNegation:3,manaRecoverySpeed:9,
  castSpeedReduction:5,castSpeedFinal:3
 });
 assert.equal(x.traces.length,14);
});
test('Remaked current OS min/max enhancement gates apply to secondary effects once',()=>{
 const effects=[{func:'EP_ONDAMAGE_REFLECTION',a:5,min:5,max:10},
  {func:'EP_HEAL_TIME_SCALE',a:8,min:7,max:10}];
 const low=C.secondaryEffectsPreview({records:[row(effects,4)]});
 const mid=C.secondaryEffectsPreview({records:[row(effects,7)]});
 const over=C.secondaryEffectsPreview({records:[row(effects,11)]});
 assert.equal(low.physicalReflection,0);
 assert.equal(mid.physicalReflection,5);
 assert.equal(mid.manaRecoverySpeed,8);
 assert.equal(over.physicalReflection,0);
});
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const preview=records=>C.base({classData:classes.WARRIOR,raceData:stats,
 jobData:zeros,allocation:zeros,level:45,records,
 combatContext:{jobKey:'WARRIOR',skillCatalog:{}}});
test('real equipment secondary effects propagate to casting, cooldown and defensive totals',()=>{
 const base=preview([]),plus=preview([row(known)]);
 assert.equal(plus.combat.castingSpeed.known-base.combat.castingSpeed.known,8);
 assert.equal(plus.combat.cooldown-base.combat.cooldown,-2);
 assert.equal(plus.regeneration.mp.total-base.regeneration.mp.total,9);
 assert.equal(plus.resistances.mitigation.physical-base.resistances.mitigation.physical,-5);
 assert.equal(plus.resistances.mitigation.magic-base.resistances.mitigation.magic,-7);
 assert.equal(plus.resistances.mitigation.physicalFlat,-3);
 assert.equal(plus.resistances.physicalReflection,5);
 assert.equal(plus.resistances.incomingDebuffDurationReduction,-15);
 assert.equal(plus.combat.secondary.auraFlat,4);
 assert.equal(plus.combat.secondary.auraPercent,20);
 assert.equal(plus.hp,base.hp);
 assert.equal(plus.mp,base.mp);
});
test('book exposes all connected secondary stats without raw EP codes',()=>{
 const source=read('stage-attributes.js');
 for(const label of ['Скорость заклинаний:','Аурный урон от снаряжения',
  'Получаемый физический урон:','Изменение длительности дебаффов:',
  'Отражение ближнего физического урона:','снаряжение '])
  assert.ok(source.includes(label),'missing '+label);
});
