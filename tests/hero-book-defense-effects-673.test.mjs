import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('pandora-os-character-calculator.js');
const ui=read('pandora-studio-hero-book.js');
const css=read('pandora-studio-hero-book-additions.css');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const window={}; Function('window',src)(window);
const calc=window.PandoraOSCalculator;

test('experience bonuses chapter exists even when the hero has no XP effects',()=>{
 assert.match(ui,/const exp=calc\?\.experienceBonus\?\.entries\|\|\[\];/);
 assert.match(ui,/const expPanel=make\('details',\{class:'stage-attribute-row stage-experience-effects'\}\)/);
 assert.match(ui,/Сейчас нет активных бонусов к опыту/);
 assert.doesNotMatch(ui,/if\(exp\.length\)\{\s*const panel=make\('details',\{class:'stage-attribute-row stage-experience-effects'/);
});

test('offensive row and chapter design uses the actual healing components',()=>{
 assert.match(ui,/class:'stage-attribute-row stage-healing-spells stage-attacking-skills'/);
 assert.match(ui,/class:'stage-heal-row stage-offense-skill-row'/);
 assert.doesNotMatch(css,/#stageAttributes \.stage-offense-skill-row\s*\{/);
 assert.doesNotMatch(css,/#stageAttributes \.stage-attacking-skills\s*\{/);
 assert.match(ui,/\['effects','offense'/);
 assert.match(ui,/\['effects','defense'/);
});

test('the real skill is Безболезненность, and requirements + source values are not guessed',()=>{
 const skill=skills['100057001'];
 assert.equal(skill.name,'Безболезненность');
 const fx=skill.funcs.filter(x=>x.dir==='TARGET');
 assert.deepEqual(fx.find(x=>x.ep==='EP_DAMAGERATE_SCALE').fv1,[0,0,0,-50]);
 for(const ep of ['EP_PROTECTION_NUMB','EP_PROTECTION_TUMBLE','EP_PROTECTION_MOVEBAN'])
  assert.ok(fx.some(x=>x.ep===ep));
 const base={skillCatalog:skills,jobKey:'WARRIOR',level:45,
  branchLabels:{martial:'Боевые искусства'}};
 const off=calc.defensiveSkillPreview({...base,branchMasteries:{martial:99}});
 const row=off.find(x=>x.id===100057001);
 assert.equal(row.available,false);
 assert.match(row.reason,/«Боевые искусства»: 100/);
 assert.equal(row.effects.find(x=>x.ep==='EP_DAMAGERATE_SCALE').amount,-50);
 assert.ok(off.some(x=>x.id===168052001));
 const on=calc.defensiveSkillPreview({...base,branchMasteries:{martial:100,defense:21}});
 assert.equal(on.find(x=>x.id===100057001).available,true);
 assert.equal(on.find(x=>x.id===168052001).available,true);
 assert.equal(calc.defensiveSkillPreview({...base,level:1}).find(x=>x.id===100053001),undefined,
  'Warrior is not eligible for a Knight-only shield buff');
});

test('external priest group barrier and holy weapon use Remaked floors and CURRENT OS coefficients',()=>{
 const z={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
 const core={classData:classes.WARRIOR,
  raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
  jobData:z,allocation:z,level:45};
 const preview=(selected,external={enabled:true,spi:134,blessing:90,hymn:30})=>
  calc.base({...core,
   attributeBuffs:{remakedSkillIds:selected},
   combatContext:{jobKey:'WARRIOR',skillCatalog:skills,
    branchMasteries:{},legacyBuffMasteries:{blessing:0,hymn:0,alchemy:0},
    weapon:{id:1001,kind:'1H_SWORD',W:90},weaponGrade:0,
    externalPriest:external}});
 const without=preview([]);
 const buffed=preview([320003001,330051001]);
 assert.ok(without&&buffed);
 assert.equal(buffed.priestApplied.groupBarrier,-28);
 assert.equal(buffed.priestApplied.holyWeapon,10);
 assert.equal(buffed.resistances.mitigation.physical-without.resistances.mitigation.physical,-28);
 assert.equal(buffed.resistances.mitigation.magic-without.resistances.mitigation.magic,-28);
 assert.equal((buffed.auraDamage?.elements?.light?.known||0)-
  (without.auraDamage?.elements?.light?.known||0),10);
 assert.equal(preview([320003001,330051001],{enabled:false,spi:134,blessing:90,hymn:30}).priestApplied.groupBarrier,0);
 assert.equal(preview([320003001,330051001],{enabled:true,spi:134,blessing:25,hymn:30}).priestApplied.groupBarrier,0);
 assert.match(src,/priestSourceMatches\(320003001,'EP_ONDAMAGE_FIN_DAMAGE_SCALE',\[0,0,-20,-10\]\)/);
 assert.match(src,/priestSourceMatches\(330051001,'EP_AURAHOLY_CONSTANT',\[6,0,0,2\]\)/);
});

test('individual triggered skill names use OS descriptions and site-native tooltip',()=>{
 assert.match(ui,/for\(const \[index,skill\] of entry\.skills\.entries\(\)\)/);
 assert.match(ui,/class:'stage-consumable-skill-name'/);
 assert.match(ui,/root\.PandoraGuideTooltip\?\.attach\(badge/);
 assert.match(ui,/const source=gameTerms\.skills\?\.\[String\(skill\.id\)\]/);
 assert.match(ui,/«инд\.»|«инд\.».+индекс скорости восстановления/);
});
