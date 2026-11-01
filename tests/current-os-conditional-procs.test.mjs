import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const C=scope.PandoraOSCalculator,items=JSON.parse(read('data/os/items.json')),
 souls=JSON.parse(read('data/os/souls.json')),skills=JSON.parse(read('data/os/skills.json'));
const preview=(record,id,kind='soul',grade=0)=>C.conditionalProcPreview({
 records:[[kind+':'+id,record,grade]],skills}).entries;
test('real source-defined trigger skills and percentages are displayed by category',()=>{
 for(const [id,kind,skill,trigger,chance] of [
  [101010,'soul','Оглушение','При ударе',4],
  [101022,'soul','Понижение скорости движения','При ударе',5],
  [422,'item','Падение','При ударе',9],
  [15082,'item','Порыв','При получении урона',8]
 ]){
  const row=preview((kind==='soul'?souls:items)[id],id,kind)[0];
  assert.equal(row.skillName,skill);
  assert.equal(row.trigger,trigger);
  assert.equal(row.chance,chance);
 }
});
test('Vampire Soul description and numeric chance disagree; avoid claiming either number',()=>{
 const source=souls[101009];
 assert.equal(source.effects[0].b,5);
 assert.match(source.desc,/4%/);
 const entry=preview(source,101009)[0];
 assert.equal(entry.skillName,'Кража жизни');
 assert.equal(entry.disputedChance,true);
 assert.equal(entry.chance,null);
});
test('Soul grade gates and unknown skill names are safe',()=>{
 assert.equal(preview(souls[101010],101010,'soul',11).length,0);
 assert.equal(preview(souls[101010],101010,'soul',10).length,1);
 const unknown=C.conditionalProcPreview({records:[['item:custom',{effects:[
  {func:'EP_ONHIT_SKILL_EXEC',a:123,b:10}]},0]]});
 assert.equal(unknown.entries[0].skillName,'Особый эффект');
 assert.equal(unknown.verified,false);
});
test('Proc preview is not applied as deterministic attack bonus',()=>{
 const src=read('os-calculator.js'),book=read('stage-attributes.js');
 assert.match(src,/const rawProcPreview=conditionalProcPreview\(/);
 assert.match(src,/const procPreview=deduplicateProcDescriptions\(rawProcPreview,specialEquipment\)/);
 assert.match(src,/resistances,targetResistance,procPreview,experienceBonus,specialEquipment,regeneration/);
 assert.match(book,/Срабатывания предметов и душ/);
});

test('only a chance corroborated by original description is shown to players',()=>{
 for(const [id,expected] of [[1241,'Массивная кувалда'],[1851,'Легкий клинок'],
  [12123,'Мантия равновесия']]){
  const result=preview(items[id],id,'item');
  assert.equal(result.length,1,'source must still be visible: '+id);
  assert.equal(result[0].source,expected);
  assert.equal(result[0].chance,null,'unsupported percent is hidden: '+id);
  assert.equal(result[0].disputedChance,false,'unmentioned is not contradictory: '+id);
 }
 const boots=preview(items[15082],15082,'item')[0];
 assert.equal(boots.chance,8,'catalog description and effect code agree');
 assert.equal(boots.disputedChance,false);
});

test('hero book does not duplicate events already explained in the detailed equipment preview',()=>{
 for(const [source,record] of [['item:422',items[422]],
  ['soul:101010',souls[101010]],['item:15082',items[15082]]]){
  const records=[[source,record,0]];
  const raw=C.conditionalProcPreview({records,skills});
  const exact=C.specialEquipmentPreview({records});
  assert.equal(raw.entries.length,1,source);
  assert.equal(exact.entries.length,1,source);
  const filtered=C.deduplicateProcDescriptions(raw,exact);
  assert.deepEqual(filtered.entries,[],'same source + proc code appears once');
  assert.equal(raw.entries.length,1,'standalone generic scan is not mutated');
 }
 const unknown=[['item:1241',items[1241],0]];
 const scan=C.conditionalProcPreview({records:unknown,skills});
 const narrow=C.specialEquipmentPreview({records:unknown});
 assert.equal(narrow.entries.length,0);
 assert.equal(C.deduplicateProcDescriptions(scan,narrow).entries.length,1,
  'unverified-probability proc still appears without an invented percent');
});

test('same visible item name does not erase a different source proc',()=>{
 const known=items[422];
 const original=known.effects.find(effect=>effect.func==='EP_ONHIT_SKILL_EXEC');
 assert.ok(original,'source has an on-hit proc');
 const alternate={...known,id:777777,
  effects:[{...original,b:8}]};
 const records=[['item:422',known,0],['item:777777',alternate,0]];
 const raw=C.conditionalProcPreview({records,skills});
 const exact=C.specialEquipmentPreview({records});
 assert.equal(raw.entries.length,2);
 assert.equal(exact.entries.length,1,'only the original item is precisely corroborated');
 assert.equal(raw.entries[0].source,raw.entries[1].source,
  'duplicate display name must not be used as an effect identity');
 const filtered=C.deduplicateProcDescriptions(raw,exact);
 assert.equal(filtered.entries.length,1,'the unrelated proc remains visible');
 assert.equal(filtered.entries[0].procIdentity,raw.entries[1].procIdentity);
 assert.equal(filtered.entries[0].chance,null,'unverified number stays hidden');
});

test('only the exact corroborated event is suppressed on a multi-proc item',()=>{
 const known=items[422],proc=known.effects.find(effect=>effect.func==='EP_ONHIT_SKILL_EXEC');
 assert.ok(proc);
 const other={...proc,a:500000002,b:4};
 const compound={...known,effects:[...known.effects,other]};
 const records=[['item:422',compound,0]];
 const generic=C.conditionalProcPreview({records,skills});
 const detailed=C.specialEquipmentPreview({records});
 assert.equal(generic.entries.length,2);
 assert.equal(detailed.entries.length,1);
 const filtered=C.deduplicateProcDescriptions(generic,detailed);
 assert.equal(filtered.entries.length,1,'second event on same source must not disappear');
 assert.equal(filtered.entries[0].skillId,500000002);
 assert.equal(filtered.entries[0].chance,null,'unverified probability is not asserted');
});

test('identical repeated sources deduplicate by occurrence, not a global name set',()=>{
 const records=[['item:422',items[422],0],['item:422',items[422],0]];
 const generic=C.conditionalProcPreview({records,skills});
 const detailed=C.specialEquipmentPreview({records});
 assert.equal(generic.entries.length,2);
 assert.equal(detailed.entries.length,2);
 assert.equal(C.deduplicateProcDescriptions(generic,detailed).entries.length,0);
 const partial=C.deduplicateProcDescriptions(generic,{entries:detailed.entries.slice(0,1)});
 assert.equal(partial.entries.length,1,'only one matching occurrence is suppressed');
});
