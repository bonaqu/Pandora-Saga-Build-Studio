import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js'),
 calcSource=read('pandora-os-character-calculator.js');
const host={};Function('window',calcSource)(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const elemental=[410003001,410015001,410025001,430054001,440005501];

test('five elemental casts remain a separate standard group with mutual exclusivity',()=>{
 assert.match(book,/const group=section\('Усиления сопротивлений стихиям'/);
 assert.match(book,/const elementalSkills=resistanceSkillChoices\.filter\(s=>s\.id!==330004001\)/);
 assert.match(book,/toggle\(group,skill\.name,'resistSkill:'\+skill\.id/);
 assert.doesNotMatch(book,/stage-resistance-skill-controls/);
 assert.doesNotMatch(book,/Вражеский навык|Incoming skill/);
 assert.match(app,/current\.resistanceSkillIds=value===true\?\[id\]:\[\]/);
 assert.doesNotMatch(app,/if\(value===true\)selected\.add\(id\);else selected\.delete\(id\)/);
 const css=read('pandora-studio-hero-book-additions.css');
 assert.doesNotMatch(css,/#stageAttributes \.stage-resistance-skill-controls>/);
});

test('current OS elemental IDs allow one signed effect only, independently of Divine Blessing',()=>{
 const options=C.resistanceSkillChoices(skills).filter(s=>s.id!==330004001);
 assert.deepEqual(options.map(s=>s.id),elemental);
 for(const option of options){
  const single=C.resistanceSkillPreview({skillCatalog:skills,selected:[option.id]});
  assert.deepEqual(single.bonuses,option.effects);
  assert.equal(single.rows.length,1);
 }
 const old=C.resistanceSkillPreview({skillCatalog:skills,
  selected:[410003001,410015001,410025001]});
 assert.deepEqual(old.bonuses,options[0].effects);
 assert.equal(old.rows.length,1);
 const divine=C.resistanceSkillPreview({skillCatalog:skills,
  selected:[330004001,410003001,410015001]});
 assert.equal(divine.bonuses.magic,25);
 assert.equal(divine.bonuses.fire,50);
 assert.equal(divine.bonuses.ice,-25);
 assert.equal(divine.rows.length,2);
});
