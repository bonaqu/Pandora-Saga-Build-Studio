import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const source=JSON.parse(read('data/os/skills.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');

const series=[
 {start:600000001,values:[2,4,6,9,12,15],effect:'EP_MAXLIFE_SCALE',field:'fv1'},
 {start:600000011,values:[2,4,6,9,12,15],effect:'EP_MAXMANA_SCALE',field:'fv1'},
 {start:600000021,values:[5,8,11,15],effect:'EP_HEAL_TIME_SCALE',field:'fv2'},
 {start:600000031,values:[5,8,11,15],effect:'EP_HEAL_TIME_SCALE',field:'fv1'},
 {start:610000211,values:[10,20,30,40,50],effect:'EP_HEAL_TIME_SCALE',field:'fv1'},
 {start:610000221,values:[1,2,3,4,5],effect:'EP_ABILITY_ALL_CONST',field:'fv1'},
 {start:610000231,values:[2,4,6,8,10],effect:'EP_DAMAGERATE_SCALE',field:'fv1'}
];

test('every projected guild rank is present in the current official skill records',()=>{
 let compared=0;
 for(const {start,values,effect,field} of series)
  for(const [index,expected] of values.entries()){
   const id=start+index,skill=source[String(id)];
   assert.equal(skill?.id,id,'Missing published skill '+id);
   assert.equal(skill.learnable,false,'Guild-only passive or leader skill '+id);
   assert.equal(skill.funcs.find(f=>f.ep===effect)?.dir,'TARGET');
   assert.equal(skill.funcs.find(f=>f.ep===effect)?.[field]?.[3],expected,
    'Inconsistent guild source coefficient '+id);
   assert.ok(typeof skill.desc==='string'&&skill.desc.length>0);
   assert.ok(typeof english[String(id)]?.d==='string',
    'Published bilingual description expected for '+id);
   compared++;
  }
 assert.equal(compared,35);
});

test('guild regeneration 0–2 and healing 0–3 retain all preexisting preview rates',()=>{
 for(let hp=0;hp<=2;hp++)
  for(let mp=0;mp<=2;mp++)
   for(let heal=0;heal<=3;heal++){
    const r=C.regenerationPreview({stats:{vit:50,spi:80},
     guild:{guildLifeRecovery:hp,guildManaRecovery:mp,guildHealing:heal}});
    assert.equal(r.hp.base,5);
    assert.equal(r.mp.base,8);
    assert.equal(r.hp.guild,[0,5,8][hp]);
    assert.equal(r.mp.guild,[0,5,8][mp]);
    assert.equal(r.hp.healing,[0,10,20,30][heal]);
    assert.equal(r.mp.healing,[0,10,20,30][heal]);
    assert.equal(r.verified,false,'Final server recovery tick remains unverified');
   }
});

test('verified recovery III/IV and leader Healing IV/V use original numeric rates',()=>{
 const r=C.regenerationPreview({stats:{vit:50,spi:80},
  guild:{guildLifeRecovery:3,guildManaRecovery:4,guildHealing:5}});
 assert.equal(r.hp.guild,11);
 assert.equal(r.mp.guild,15);
 assert.equal(r.hp.healing,50);
 assert.equal(r.mp.healing,50);
 assert.deepEqual({hp:r.hp.total,mp:r.mp.total},{hp:66,mp:73});
 for(const [hp,mp,heal] of [[5,0,0],[0,5,0],[0,0,6],[-1,0,0],['3',0,0]]){
  assert.equal(C.regenerationPreview({stats:{vit:50,spi:80},
   guild:{guildLifeRecovery:hp,guildManaRecovery:mp,guildHealing:heal}}),null);
 }
});

test('published leader attribute ranks IV/V apply +4/+5, never invent rank VI',()=>{
 for(let rank=0;rank<=5;rank++){
  const result=C.attributeBuffBonus({guildAll:rank});
  assert.ok(result);
  for(const value of Object.values(result.flat))assert.equal(value,rank);
 }
 assert.equal(C.attributeBuffBonus({guildAll:6}),null);
 assert.equal(C.attributeBuffBonus({guildAll:'5'}).flat.vit,5,
  'legacy numeric text preserves a verified source rank');
});

test('leader attack rank IV/V uses +8/+10 both in physical and magic previews',()=>{
 const before=[];
 for(let rank=0;rank<=5;rank++){
  const magic=C.magicAttackPreview({int:100,jobKey:'WARRIOR',guildArouse:rank});
  assert.equal(magic?.guild,[0,2,4,6,8,10][rank]);
  assert.equal(magic.verified,false);
  before.push(magic.known);
 }
 assert.ok(before.every((value,i)=>i===0||value>before[i-1]));
 assert.equal(C.magicAttackPreview({int:100,guildArouse:6}),null);
 assert.equal(C.magicAttackPreview({int:100,guildArouse:'5'}),null);
});

test('Hero Book and shared-build acceptance expose verified ranks without fake unlocks',()=>{
 for(const item of [
  'guildLifeRecovery:[0,5,8,11,15]',
  'guildManaRecovery:[0,5,8,11,15]',
  'guildHealing:[0,10,20,30,40,50]',
  'guildAll:[0,1,2,3,4,5]',
  'guildArouse:[0,2,4,6,8,10]'
 ])assert.ok(book.includes(item),'Missing guild options '+item);
 assert.match(book,/const starts=\{1:600000001,2:600000011,3:600000021,4:600000031,/);
 assert.match(book,/5:600000071,6:600000081,7:600000061,8:610000211,9:610000221,10:610000231\}/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(id\)\]\?\.d/);
 assert.ok(app.includes("['guildLifeRecovery',4],['guildManaRecovery',4],['guildHealing',5],['guildArouse',5]"));
 assert.match(app,/key==='guildHealing'\?5:/);
 assert.match(app,/current\.guildArouse=n/);
 assert.match(app,/guild<=5/);
});
