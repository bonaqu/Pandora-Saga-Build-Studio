import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const ctx={skillCatalog:skills,jobKey:'KNIGHT',level:45,
 branchMasteries:{},weaponKind:'1H_SWORD'};

test('Bastion is unavailable without a shield even at correct job and level',()=>{
 const off=C.defensiveSkillPreview({...ctx,hasShield:false});
 const skill=off.find(row=>row.id===100053001);
 assert.ok(skill,'Knight must see the actual Bastion skill');
 assert.equal(skill.available,false);
 assert.match(skill.reason,/щит/);
 assert.match(skill.reasonEn,/shield/);
 assert.equal(skill.effects.find(f=>f.ep==='EP_ARMORCLASS_SCALE').amount,40);
 const on=C.defensiveSkillPreview({...ctx,hasShield:true}).find(row=>row.id===100053001);
 assert.equal(on.available,true);
 assert.equal(on.reason,'');
});

test('shield does not bypass profession or level restrictions',()=>{
 assert.equal(C.defensiveSkillPreview({...ctx,hasShield:true,level:34})
  .find(row=>row.id===100053001).available,false);
 assert.equal(C.defensiveSkillPreview({...ctx,jobKey:'WARRIOR',hasShield:true})
  .some(row=>row.id===100053001),false);
});

test('Hero Book receives the real equipment gates from its render caller',()=>{
 const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
 assert.match(app,/heroWeaponKind:equippedWeapon\?\.kind\|\|'BARE_HAND'/);
 assert.match(app,/heroHasShield:Boolean\(equippedShield\)/);
 assert.match(app,/heroBranchCaps:catalog\.classes\?\.\[cls\]\?\.branchCaps\|\|\{\}/);
 assert.match(book,/heroBranchCaps,heroWeaponKind,heroHasShield,onItem\}\);/);
 assert.match(book,/weaponKind:heroWeaponKind,hasShield:heroHasShield/);
 assert.match(book,/heroHasShield=false/);
});
