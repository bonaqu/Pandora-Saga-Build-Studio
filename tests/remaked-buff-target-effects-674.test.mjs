import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const B=host.PandoraRemakedBuffs,C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:50,str:60,agi:40,dex:40,spi:40,int:35};
const basis={skills,level:45,branchMasteries:{}};

test('Remaked 11_0 / OS Lightness uses source-validated +30 movement once',()=>{
 const ctx={...basis,jobKey:'SNIPER',selected:[260002001]};
 assert.deepEqual(B.applied(ctx).lightness,{movement:30});
 const combat={stats,level:45,jobKey:'SNIPER',skillCatalog:skills,branchMasteries:{}};
 const off=C.combatPreview({...combat,combatBuffs:{}});
 const on=C.combatPreview({...combat,combatBuffs:{remakedSkillIds:[260002001]}});
 assert.equal(on.movementSpeed.known-off.movementSpeed.known,30);
 assert.equal(on.movementSpeed.town-off.movementSpeed.town,30);
 assert.equal(on.movementSpeed.lightness,30);
 assert.equal(B.applied({...ctx,jobKey:'WARRIOR'}).lightness,undefined);
 assert.equal(B.applied({...ctx,level:1}).lightness,undefined);
});

test('Swift Arrow applies +30 crossbow attack-speed index, never with an invalid weapon',()=>{
 const ctx={...basis,jobKey:'SNIPER',weapon:{kind:'CROSSBOW',W:90},
  selected:[213702001]};
 assert.deepEqual(B.applied(ctx).swiftArrow,{attackSpeed:30});
 const combat={stats,level:45,jobKey:'SNIPER',weapon:ctx.weapon,
  skillCatalog:skills,branchMasteries:{}};
 const off=C.combatPreview({...combat,combatBuffs:{}});
 const on=C.combatPreview({...combat,combatBuffs:{remakedSkillIds:[213702001]}});
 assert.equal(on.attackSpeed.known-off.attackSpeed.known,30);
 assert.equal(on.attackSpeed.swiftArrow,30);
 assert.equal(B.applied({...ctx,weapon:{kind:'BOW',W:90}}).swiftArrow,undefined);
 assert.equal(B.applied({...ctx,level:34}).swiftArrow,undefined);
});

test('Blessed Repose is an opt-in ally MP recovery-speed index, not +90 MP',()=>{
 const opts={classData:classes.WARRIOR,
  raceData:stats,jobData:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
  allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},level:45,
  combatContext:{jobKey:'WARRIOR',skillCatalog:skills,branchMasteries:{}}};
 const off=C.base({...opts,attributeBuffs:{remakedSkillIds:[]}});
 const on=C.base({...opts,attributeBuffs:{remakedSkillIds:[320002001]}});
 assert.equal(on.regeneration.mp.total-off.regeneration.mp.total,90);
 assert.equal(on.regeneration.mp.allyBuff,90);
 assert.equal(on.mp,off.mp);
 assert.deepEqual(B.applied({...basis,jobKey:'WARRIOR',
  selected:[320002001]}).blessedRepose,{manaRecoverySpeed:90});
});

test('all three effects fail closed on forged current OS values and absent selection',()=>{
 const target=[260002001,213702001,320002001];
 const enabled={...basis,jobKey:'SNIPER',
  weapon:{kind:'CROSSBOW',W:90},selected:target};
 assert.deepEqual(B.applied({...enabled,selected:[]}),{});
 for(const id of target){
  const forged=structuredClone(skills);
  forged[String(id)].funcs.find(row=>row.dir==='TARGET'&&
   ['EP_MOVESPEED_SCALE','EP_ATTACKINTERVAL_SCALE','EP_HEAL_TIME_SCALE']
    .includes(row.ep)).fv1[0]=1;
  const key=id===260002001?'lightness':id===213702001?'swiftArrow':'blessedRepose';
  assert.equal(B.applied({...enabled,skills:forged})[key],undefined,String(id));
 }
});
