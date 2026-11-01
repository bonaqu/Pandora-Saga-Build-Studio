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

test('generic conditional proc previews include accurate English triggers and safe names',()=>{
 for(const [id,code,enLabel] of [
  [422,'EP_ONHIT_SKILL_EXEC','On hit'],
  [2802,'EP_ONHIT_STUN','On physical attack'],
  [15082,'EP_ONDAMAGE_SKILL_EXEC','On taking damage']
 ]){
  const event=preview(items[id],id,'item')[0];
  assert.equal(event.code,code);
  assert.equal(event.triggerEn,enLabel);
 }
 assert.equal(preview(items[2802],2802,'item')[0].skillNameEn,'Stun');
 const unknown=C.conditionalProcPreview({records:[['item:unknown',{
  effects:[{func:'EP_ONHIT_SKILL_EXEC',a:12345,b:3,dir:'TARGET'}]
 },0]]}).entries[0];
 assert.equal(unknown.skillNameEn,'Special effect');
 assert.equal(unknown.chance,null,'an unknown source never gets an invented chance');
});

test('English official OS descriptions retain corroborated chances without changing the underlying effects',()=>{
 const en=JSON.parse(read('data/os/strings.en.json'));
 for(const [kind,id,chance] of [
  ['item',422,9],['item',1041,9],['item',1211,4],
  ['item',15082,8],['soul',101010,4],['soul',101022,5]
 ]){
  const source=(kind==='item'?items:souls)[id];
  const translated=(kind==='item'?en.items:en.souls)[id];
  assert.ok(translated?.d,'Missing verified original English description '+kind+':'+id);
  const row=preview({...source,name:translated.n,desc:translated.d},id,kind)[0];
  assert.equal(row.chance,chance,'English chance '+kind+':'+id);
  assert.equal(row.disputedChance,false);
 }
 const vampire={...souls[101009],desc:en.souls[101009].d};
 assert.equal(preview(vampire,101009)[0].chance,null);
 assert.equal(preview(vampire,101009)[0].disputedChance,true);
});

test('ambiguous multiple distinct percentages never become an asserted event chance',()=>{
 const item={id:333,name:'Combined item',
  desc:'4% chance on attack, 9% chance on taking damage',
  effects:[{func:'EP_ONHIT_SKILL_EXEC',a:500000002,b:4,dir:'TARGET'},
   {func:'EP_ONDAMAGE_SKILL_EXEC',a:260003001,b:9,dir:'TARGET'}]};
 const rows=preview(item,333,'item');
 assert.equal(rows.length,2);
 assert.ok(rows.every(row=>row.chance===null&&!row.disputedChance),
  'Without an unambiguous association to each proc, rates must stay hidden');
});

test('invalid enhancement grades cannot expose conditional events or experience gain',()=>{
 for(const grade of [-1,11,1.5,NaN,undefined]){
  const events=C.conditionalProcPreview({records:[['item:422',items[422],grade]],skills}).entries;
  assert.equal(events.length,0,'invalid grade '+String(grade));
  assert.equal(C.specialEquipmentPreview({records:[['item:422',items[422],grade]]}).entries.length,0);
  assert.equal(C.experienceBonusPreview({records:[['item:18073',items[18073],grade]]}).entries.length,0);
 }
 assert.equal(preview(items[422],422,'item',10).length,1);
 assert.equal(C.experienceBonusPreview({records:[['item:18073',items[18073],10]]}).entries.length,1);
});
