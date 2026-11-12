import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const ids=[330004001,410003001,410015001,410025001,430054001,440005501];
const valid=new Set(ids);
const choices=(s=skills)=>C.resistanceSkillChoices(s);
const withEdit=(id,edit)=>{
 const altered=structuredClone(skills),s=altered[String(id)];
 const effect=s.funcs.find(x=>x.ep.endsWith('_RESISTANCE_CONST'));
 assert.ok(effect,'source vector '+id);
 edit(s,effect);return altered;
};
test('six current OS signed TARGET spells match official RU/EN and directions',()=>{
 assert.deepEqual(choices().map(x=>x.id),ids);
 assert.equal(choices().filter(x=>x.incoming).length,5);
 assert.equal(choices().find(x=>x.id===330004001).effects.magic,25);
 for(const entry of choices()){
  const source=skills[String(entry.id)];
  assert.equal(entry.name,source.name);
  assert.equal(typeof english[String(entry.id)]?.n,'string','official English '+entry.id);
  assert.equal(entry.incoming,source.skillType==='ENEMY');
  assert.ok(['ENEMY','PARTY_ALL'].includes(source.skillType));
  const effects=source.funcs.filter(f=>f.ep.endsWith('_RESISTANCE_CONST'));
  assert.equal(Object.keys(entry.effects).length,effects.length);
  for(const effect of effects){
   assert.equal(effect.dir,'TARGET');
   assert.deepEqual(effect.fv1.slice(0,3),[0,0,0]);
   assert.deepEqual(effect.fv2,[0,0,0,0]);
   assert.ok(Object.values(entry.effects).includes(effect.fv1[3]));
  }
 }
});
test('any changed effect invalidates the entire skill rather than dropping a signed penalty',()=>{
 for(const id of ids){
  const expected=choices().find(x=>x.id===id);
  const original=skills[String(id)];
  for(const [label,edit] of [
   ['FV1 secondary',(_s,f)=>f.fv1[1]=1],
   ['FV2 scale',(_s,f)=>f.fv2[3]=1],
   ['FV2 missing',(_s,f)=>delete f.fv2],
   ['wrong direction',(_s,f)=>f.dir='CASTER'],
   ['fractional value',(_s,f)=>f.fv1[3]=1.5],
   ['duplicate modifier',(s,f)=>s.funcs.push(structuredClone(f))]
  ]){
   const changed=withEdit(id,edit);
   assert.equal(choices(changed).find(x=>x.id===id),undefined,id+' '+label);
   assert.equal(choices(changed).length,5,id+' '+label+' does not change others');
   assert.deepEqual(skills[String(id)],original,'mutation must not leak');
  }
  assert.ok(expected);
 }
});
test('all five elemental target spells preserve full positive/negative tradeoffs',()=>{
 const all=choices();
 const expected={
  410003001:{fire:50,ice:-25,lightning:-25},
  410015001:{fire:-25,ice:50,lightning:-25},
  410025001:{fire:-25,ice:-25,lightning:50},
  430054001:{charm:-50,poison:25,dark:25},
  440005501:{charm:50,poison:-25,dark:-25}
 };
 for(const [id,bonuses] of Object.entries(expected)){
  const item=all.find(x=>x.id===Number(id));
  assert.deepEqual(item.effects,bonuses,'all signed modifiers for '+id);
  const out=C.resistanceSkillPreview({skillCatalog:skills,selected:[Number(id)]});
  assert.deepEqual(out.bonuses,bonuses);
  assert.equal(out.rows.length,1);
  assert.equal(out.rows[0].incoming,true);
  assert.equal(out.verified,false,'source magnitudes != final damage mitigation');
 }
});
test('300 synthetic selected spell combinations never double count target modifiers',()=>{
 const original=JSON.stringify(skills);
 for(let i=0;i<300;i++){
  const five=ids.slice(1),chosen=five[i%five.length],
   more=five[(i+2)%five.length],divine=i%3!==0;
  const selected=[chosen,chosen,more,...divine?[330004001,330004001]:[]];
  const out=C.resistanceSkillPreview({skillCatalog:skills,selected});
  const expected={};
  const selectedElement=choices().find(x=>x.incoming&&selected.includes(x.id));
  assert.ok(selectedElement,'the lowest canonical selected OS ID wins in old multi-selection saves');
  for(const skill of [divine?choices()[0]:null,selectedElement].filter(Boolean))
   for(const [key,value] of Object.entries(skill.effects))
    expected[key]=(expected[key]||0)+value;
  assert.deepEqual(out.bonuses,expected,'selection '+i);
  assert.equal(out.rows.length,divine?2:1);
  assert.ok(out.rows.every(x=>valid.has(x.id)));
  const sheet=C.resistancePreview({
   stats:{vit:(i*13)%200,spi:(i*17)%200},bonuses:out.bonuses
  });
  assert.equal(sheet.elements.fire,expected.fire||0);
  assert.equal(sheet.elements.magic,expected.magic||0);
  assert.equal(sheet.status.stun,0,'elemental spell never creates status immunity');
 }
 assert.equal(JSON.stringify(skills),original,'strictly read-only current OS source');
});
test('protection toggles are NOT permanent status resistance, and class cap is enforced',()=>{
 const skill=skills['100057001'];
 assert.equal(skill.name,'Безболезненность');
 assert.equal(skill.skillType,'TOGGLE');
 assert.ok(skill.funcs.some(x=>x.ep==='EP_PROTECTION_NUMB'&&x.fv1[3]===100));
 assert.ok(skill.funcs.some(x=>x.ep==='EP_PROTECTION_TUMBLE'&&x.fv1[3]===100));
 assert.ok(!choices().some(x=>x.id===skill.id));
 assert.ok(Object.values(classes).every(x=>(x.branchCaps?.martial||0)<100));
 const passive=skills['260007001'];
 assert.equal(passive.skillType,'PASSIVE');
 assert.equal(passive.funcs.filter(x=>x.ep==='EP_IMMUNE_NUMB'&&x.dir==='TARGET').length,1);
 assert.equal(passive.funcs.filter(x=>x.ep==='EP_IMMUNE_NUMB'&&x.dir==='CASTER').length,1);
 const known=C.wardingStatusPassive({jobKey:'SNIPER',wardingMastery:26,
  wardingCap:classes.SNIPER.branchCaps.warding,skillCatalog:skills});
 assert.deepEqual(known,{stun:15,numb:15,tumble:15});
});
test('Hero Book explicitly explains target-directed spells without adding UI chrome',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/Эти умения направлены на противника/);
 assert.match(book,/These spells target an enemy/);
 assert.match(book,/toggle\(group,skill\.name,'resistSkill:'\+skill\.id/);
 assert.match(book,/const elementalSkills=resistanceSkillChoices\.filter/);
});
