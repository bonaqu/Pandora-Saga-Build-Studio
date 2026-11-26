import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);

test('current direct-strike previews never turn a TARGET or unsupported EP shape into verified damage',()=>{
 const calculator=host.PandoraOSCalculator;
 let rowsChecked=0;
 for(const [jobKey,entry] of Object.entries(classes)){
  const caps=entry.branchCaps;
  const branchMasteries=Object.fromEntries(Object.entries(caps));
  const rows=calculator.directStrikeCoefficientPreview({
   skillCatalog:skills,jobKey,level:55,branchCaps:caps,
   branchMasteries,weaponKind:'LANCE'
  });
  assert.ok(Array.isArray(rows),'known result shape for '+jobKey);
  for(const row of rows){
   rowsChecked++;
   const skill=skills[String(row.id)];
   assert.ok(skill?.learnable===true);
   const onHit=skill.funcs.filter(f=>f.ep==='EP_ONHIT_DAMAGE_SCALE'&&
    f.dir==='CASTER');
   assert.equal(onHit.length,1,'whitelisted caster source '+row.id);
   assert.equal(onHit[0].fv1[0],0);
   assert.equal(onHit[0].fv1[1],0);
   assert.deepEqual(onHit[0].fv2,[0,0,0,0]);
   assert.ok(skill.funcs.some(f=>
    ['EP_PLAYER_ATTACK','EP_PLAYER_ATTACK2'].includes(f.ep)&&
    f.dir==='TARGET'));
   assert.equal(row.amount,null,'not a final damage number');
   assert.equal(row.uncertain,true);
   assert.ok(row.coefficientModels?.every(model=>
    model.ep==='EP_ONHIT_DAMAGE_SCALE'&&
    model.confidence==='coefficient-model'));
   assert.notEqual(row.id,121703001,'TARGET-only triple strike is not a caster coefficient');
   assert.notEqual(row.id,142005001,'statPart=50 is outside the supported strike model');
  }
 }
 assert.ok(rowsChecked>0,'inspected meaningful real coefficient rows');
});
