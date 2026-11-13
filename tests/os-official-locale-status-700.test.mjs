import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const meta=JSON.parse(read('data/os/meta.json')),en=JSON.parse(read('data/os/strings.en.json'));
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json'));
const calcSrc=read('pandora-os-character-calculator.js');
const bookSrc=read('pandora-studio-hero-book.js');
const guideSrc=read('pandora-studio-honor-guide.js');
const appSrc=read('pandora-studio-app.js');
const host={};Function('window',calcSrc)(host);
const C=host.PandoraOSCalculator;
test('official OS branch labels are not replaced by autotranslated Russian',()=>{
 for(const [key,ru,english]of [
  ['exorcism','Экзорцизм','Exorcism'],['alchemy','Ремесло','Alchemy'],
  ['brush','Рубящий удар','Cleave'],['darkness','Магия тьмы','Darkness']
 ]){
  assert.equal(meta.branchLabels[key],ru);
  assert.equal(en.branches[key],english);
 }
 assert.equal(skills['330002001'].name,'Поглощение стихий');
 assert.equal(en.skills['330002001'].n,'Elemental Absorption');
 assert.doesNotMatch(calcSrc,/exorcism:\s*['"]Изгнание/);
 assert.match(bookSrc,/branchLabels:gameTerms\.branchLabels,englishBranches:gameTerms\.englishBranches/);
 assert.match(appSrc,/branchLabels:catalog\.meta\?\.branchLabels/);
});
test('skill requirements use correct OS RU and EN branch vocabulary',()=>{
 const r=C.scalingSkillPreview({skillCatalog:skills,jobKey:'EXORCIST',level:50,
  branchMasteries:{exorcism:0},branchCaps:classes.EXORCIST.branchCaps,
  branchLabels:meta.branchLabels,englishBranches:en.branches,
  stats:{vit:60,str:50,agi:40,dex:50,spi:80,int:40},
  combat:{attack:{walkingBase:160},defense:{directRaw:100},accuracy:{base:100},dodge:{base:110}}});
 const row=r.defense.find(x=>x.id===330002001);
 assert.ok(row);assert.equal(row.available,false);
 assert.match(row.reason,/Экзорцизм/);assert.match(row.reasonEn,/Exorcism/);
 assert.doesNotMatch(row.reason,/Изгнание/);
 assert.doesNotMatch(bookSrc,/const heroGate=id=>/,
  'Character skill prerequisites remain in Path; Book contains numerical effects');
});
test('the two status categories expose bilingual D1-ready hover descriptions without redundant badge',()=>{
 const root={};Function('window',guideSrc)(root);
 const hints=root.PandoraHonorGuide.hints;
 for(const [key,wordsRu,wordsEn] of [
  ['Сопр. аном. тел.',['оглушение','падение','отравление','кровотечение','ожог','заморозка'],
   ['stun','knockdown','poison','bleeding','burn','freeze']],
  ['Сопр. аном. дух.',['сон','безумие','немота','слабость','болезнь'],
   ['sleep','madness','silence','weakness','disease']]
 ]){
  const hint=hints[key];assert.ok(hint,key);
  for(const word of wordsRu)assert.ok(hint[0].includes(word));
  for(const word of wordsEn)assert.ok(hint[1].includes(word));
 }
 assert.doesNotMatch(bookSrc,/stage-status-family-info/);
 assert.match(bookSrc,/guideDisplayText/);
 assert.match(bookSrc,/stage-status-family-guide/);
});
test('250 VIT and SPI test vectors calculate group resistance without copying individual statuses',()=>{
 let checked=0;
 for(let vit=0;vit<50;vit++)for(const spi of [0,27,28,55,84]){
  const rs=C.resistancePreview({stats:{vit,spi},
   bonuses:{physicalStatus:17,mentalStatus:9}});
  assert.equal(rs.states.physical,Math.floor(vit/28)*7+17);
  assert.equal(rs.states.mental,Math.floor(spi/28)*7+9);
  assert.equal(rs.status.stun,0);assert.equal(rs.status.sleep,0);
  checked++;
 }
 assert.equal(checked,250);
});
