import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));

test('Inspiration: canonical OS 50 means half the normal casting time, not an unknown number',()=>{
 const spell=skills['320006001'];
 assert.equal(spell.name,'Воодушевление');
 assert.deepEqual(spell.funcs.find(f=>f.ep==='EP_SKILL_DELAY_FIN').fv1,[0,0,0,50]);
 assert.deepEqual(C.alliedInspirationPreview({skillCatalog:skills}),{
  id:320006001,castTimePercent:50,castTimeReductionPercent:50,
  speedMultiplier:2,sourceConfirmed:true
 });
 const changed=structuredClone(skills);
 changed['320006001'].funcs[1].fv2[3]=1;
 assert.equal(C.alliedInspirationPreview({skillCatalog:changed}),null);
});

test('Peace Song: only allied Cleric with Healing 61 can provide the source-based magnitude',()=>{
 const spell=skills['340003001'];
 assert.equal(spell.name,'Песнь мира');
 assert.deepEqual(spell.reqs,[
  {branch:'benevolence',amount:61},{branch:'hymn',amount:30}]);
 assert.equal(classes.ENCHANTER.branchCaps.benevolence,55);
 assert.equal(classes.CLERIC.branchCaps.benevolence,90);
 assert.equal(classes.CLERIC.branchCaps.hymn,45);
 const args={spi:134,hymn:30,skills,classes};
 const result=C.alliedPeaceSongPreview(args);
 assert.equal(result?.value,99);
 assert.equal(result?.requiredHealing,61);
 assert.equal(result?.casterClass,'CLERIC');
 assert.equal(C.alliedPeaceSongPreview({...args,spi:135})?.value,100);
 assert.equal(C.alliedPeaceSongPreview({...args,hymn:45})?.value,103);
 assert.equal(C.alliedPeaceSongPreview({...args,hymn:29}),null);
 assert.equal(C.alliedPeaceSongPreview({...args,hymn:46}),null);
 const changed=structuredClone(skills);
 changed['340003003'].funcs.find(f=>f.ep==='EP_DAMAGE_CLEAR').fv1[3]=11;
 assert.equal(C.alliedPeaceSongPreview({...args,skills:changed}),null);
});

test('Book keeps independent ally and priest setters with no redundant exorcism field',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 const fields=book.slice(book.indexOf('const priestFields=make('),
  book.indexOf('priest.append(priestFields);'));
 for(const key of ['priestSpi','priestBlessing','priestHymn'])
  assert.match(fields,new RegExp(key));
 assert.doesNotMatch(fields,/\['priestExorcism'|\['priestBenevolence'/);
 assert.match(book,/const externalPriestSkill=\[320003001,320011001,330051001,/);
 assert.doesNotMatch(book,/340001001,340003001,340004001\]\.includes\(row\.id\)/);
 assert.match(book,/stage-ally-peace-fields/);
 assert.match(book,/selectedPriestIds\.has\(340003001\)/);
 assert.match(app,/exorcism:26/);
 assert.match(app,/allyPeaceHymn/);
});
