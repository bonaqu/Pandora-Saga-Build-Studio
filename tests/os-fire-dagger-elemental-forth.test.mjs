import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const dagger=items['1862'],zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const gem=(grade,element='fire',type='magical')=>
 [{slot:'weapon',itemId:1862,grade,gem:{type,element}}];
const records=grade=>[['item:1862',dagger,grade]];
const preview=(grade,element='fire',type='magical')=>
 C.elementalRefinementPreview({records:records(grade),itemForth,
  gemSelections:gem(grade,element,type)});
const character=(grade,element='fire',honorTitle=0)=>
 C.base({classData:classes.AGENT,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.SCOUT,allocation:zero,level:55,
  records:records(grade),itemForth,gemSelections:gem(grade,element),
  attributeBuffs:{honorTitle},combatContext:{weapon:dagger,weaponGrade:grade,
   weaponPlus:tables.weaponPlus,jobKey:'AGENT'}});

test('real OS item 1862 has +1…+4% fire magic Forth snapshots at +7…+10',()=>{
 assert.equal(dagger.id,1862);
 assert.equal(dagger.slot,'weapon');
 assert.match(dagger.desc,/самоцветом огня/);
 assert.match(dagger.desc,/Магическая атака огнем \+1%/);
 for(let grade=7;grade<=10;grade++){
  const expected=grade-6;
  assert.deepEqual(itemForth['1862'][grade],
   [{func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:expected,b:0}]);
  const val=preview(grade);
  assert.equal(val.entries.length,1);
  assert.deepEqual([val.entries[0].itemId,val.entries[0].grade,
   val.entries[0].element,val.entries[0].rate],[1862,grade,'fire',expected]);
  assert.equal(val.entries[0].verified,false);
 }
});

test('source value requires the right item, correct grade and explicitly fire-selected weapon gem',()=>{
 for(const grade of [0,1,6])
  assert.deepEqual(preview(grade).entries,[]);
 for(const element of ['ice','lightning','poison','dark','light','rainbow'])
  assert.deepEqual(preview(9,element).entries,[],element);
 const options={records:records(9),itemForth};
 assert.deepEqual(C.elementalRefinementPreview(options).entries,[]);
 assert.deepEqual(C.elementalRefinementPreview({...options,gemSelections:gem(8)}).entries,[]);
 assert.deepEqual(C.elementalRefinementPreview({...options,gemSelections:[{...gem(9)[0],itemId:1863}]}).entries,[]);
 assert.equal(preview(9,'fire','physical').entries[0].rate,3,
  'gameplay type restriction not established: display source rate, not final MATK');
});

test('mismatched IDs, absent Forth, source data changes and duplicate records fail closed',()=>{
 const valid=gem(7);
 const forged=[['item:1863',dagger,7]],changed={...dagger,id:1863};
 assert.deepEqual(C.elementalRefinementPreview({records:forged,itemForth,
  gemSelections:valid}).entries,[]);
 assert.deepEqual(C.elementalRefinementPreview({records:[['item:1862',changed,7]],
  itemForth,gemSelections:valid}).entries,[]);
 assert.deepEqual(C.elementalRefinementPreview({records:records(7),
  gemSelections:valid}).entries,[]);
 const broken=structuredClone(itemForth);
 broken['1862']['7'][0].a=NaN;
 assert.deepEqual(C.elementalRefinementPreview({records:records(7),
  itemForth:broken,gemSelections:valid}).entries,[]);
 const doubled=structuredClone(itemForth);
 doubled['1862']['7'].push({...doubled['1862']['7'][0]});
 assert.deepEqual(C.elementalRefinementPreview({records:records(7),
  itemForth:doubled,gemSelections:valid}).entries,[]);
 const twice=C.elementalRefinementPreview({records:[...records(7),...records(7)],
  itemForth,gemSelections:valid});
 assert.equal(twice.entries.length,1,'same equipped item cannot double credit');
});

test('full Hero Book pipeline keeps fire magic refinement separate from generic MATK and Honor',()=>{
 const plain=character(6,'fire'),fired=character(7,'fire'),
  iced=character(7,'ice'),honor=character(7,'fire',3);
 assert.equal(plain.elementalRefinement.entries.length,0);
 assert.equal(fired.elementalRefinement.entries.length,1);
 assert.equal(iced.elementalRefinement.entries.length,0);
 assert.equal(honor.elementalRefinement.entries[0].rate,1);
 assert.equal(honor.elementalMagic.fire,5);
 assert.equal(fired.elementalMagic.fire,0);
 assert.equal(fired.combat.magicAttack.known,iced.combat.magicAttack.known);
 assert.equal(honor.combat.magicAttack.known,fired.combat.magicAttack.known,
  'honor element-specific bonus is already separate from total generic MATK');
 assert.equal(fired.auraDamage.elements.fire,undefined,
  'no unverified physical aura or Phoenix damage added to the aura');
 const coverage=C.effectCoverage({records:records(7),itemForth});
 assert.ok(coverage.counts.preview>=1);
 assert.equal(coverage.counts.missing,0,
  'source-only fire effect must not appear as unmapped when it has a preview');
});

test('book labels selected fire effect as a conditional source preview, never a fabricated completed ATK',()=>{
 const source=read('pandora-studio-hero-book.js');
 assert.match(source,/calc\.elementalRefinement\?\.entries/);
 assert.match(source,/Кинжал огня зноя/);
 assert.match(source,/const alreadyShown=/);
 assert.match(source,/never sum them/);
});
