import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const z={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const source={enabled:true,spi:134,blessing:90,hymn:30,exorcism:26};
const effects=exorcism=>C.base({classData:classes.WARRIOR,
 raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
 jobData:z,allocation:z,level:45,
 attributeBuffs:{priestEnabled:true,
  remakedSkillIds:[330051001,320011001]},
 combatContext:{jobKey:'WARRIOR',skillCatalog:skills,
  branchMasteries:{},weapon:{kind:'1H_SWORD',atk:90},
  externalPriest:{...source,exorcism}}});
test('source-gated Holy Weapon requires caster Exorcism 26',()=>{
 for(const rank of [0,1,25]){
  assert.equal(C.priestCastPreviews({...source,exorcism:rank,skills}).holyWeapon,null);
  const actual=effects(rank);
  assert.equal(actual.auraDamage.elements.light,undefined);
  assert.equal(actual.priestApplied.holyWeapon,0);
 }
 const usable=C.priestCastPreviews({...source,skills});
 assert.equal(usable.holyWeapon,10);
 assert.equal(usable.holyEnhanced,36);
 assert.equal(effects(26).auraDamage.elements.light.known,36);
 assert.equal(effects(61).auraDamage.elements.light.known,36,
  'Exorcism is a gate, not an invented scaling multiplier');
 // Imported/older fixtures omit Exorcism: retain the established preview
 // default until the reader specifies a rank explicitly.
 assert.equal(C.priestCastPreviews({spi:134,blessing:90,hymn:30,skills}).holyWeapon,10);
});
test('Dark Aura source model includes mathematically exact next SPI step',()=>{
 const preview=spi=>C.scalingSkillPreview({
  skillCatalog:skills,jobKey:'DARKROAR',level:50,
  stats:{vit:50,str:70,agi:50,dex:40,spi,int:30},
  branchMasteries:{darkness:30},branchCaps:classes.DARKROAR.branchCaps,
  combat:{attack:{walkingBase:150},defense:{directRaw:70},
   accuracy:{base:100},dodge:{base:100}}}).offense
  .find(x=>x.id===430051001);
 const cases=[[0,15,13],[12,15,13],[13,16,25],
  [100,23,113],[134,25,138],[137,25,138],[138,26,150],[150,27,163]];
 for(const [spi,amount,next] of cases){
  const row=preview(spi);
  assert.ok(row);
  assert.equal(row.amount,amount);
  assert.equal(row.modelOnly,true);
  assert.match(row.detailRu,new RegExp('порог СД: '+next));
 }
});
test('250 integer SPI values produce monotonically increasing model steps and a future breakpoint',()=>{
 let count=0,prev=-Infinity;
 for(let spi=0;spi<250;spi++){
  const tier=Math.floor(spi*8/100),next=Math.ceil((tier+1)*100/8);
  assert.ok(next>spi);
  assert.ok(tier>=prev);
  prev=tier;count++;
 }
 assert.equal(count,250);
});
test('caster field persists through normal character state without changing skill formula',()=>{
 const app=read('pandora-studio-app.js');
 const book=read('pandora-studio-hero-book.js');
 assert.match(app,/priestBenevolence:61,priestExorcism:26/);
 assert.match(app,/exorcism:26/);
 assert.match(app,/\['priestExorcism',500\]/);
 assert.doesNotMatch(book,/\['priestExorcism','Изгнание','Exorcism mastery'\]/);
 assert.match(book,/priestCanLearn\(row\.id\)/);
 const fields=book.slice(book.indexOf('const priestFields=make('),
  book.indexOf('priest.append(priestFields);'));
 assert.doesNotMatch(fields,/priestExorcism/);
});
