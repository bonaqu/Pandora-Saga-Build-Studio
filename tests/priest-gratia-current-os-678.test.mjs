import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const book=read('pandora-studio-hero-book.js');
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const ctx={classData:classes.WARRIOR,
 raceData:{vit:45,str:50,agi:50,dex:40,spi:70,int:25},
 jobData:zeros,allocation:zeros,level:45};
const priest={enabled:true,spi:134,blessing:90,hymn:30};
const preview=({buff=true,external=priest,source=skills}={})=>
 C.base({...ctx,attributeBuffs:{priestGratia:buff},
  combatContext:{jobKey:'WARRIOR',skillCatalog:source,
   branchMasteries:{},externalPriest:external}});

test('current OS Gratia is 5 + floor(SPI*10%) + floor(Blessing*5%)',()=>{
 const skill=skills['320007001'];
 const effect=skill.funcs.find(x=>x.ep==='EP_ATTACKINTERVAL_SCALE');
 assert.deepEqual(effect.fv1,[10,0,5,5]);
 const off=preview({buff:false}),on=preview();
 assert.equal(on.priestApplied.gratiaPreview,22);
 assert.equal(on.combat.attackSpeed.priestBonus,22);
 assert.equal(on.combat.attackSpeed.known-off.combat.attackSpeed.known,22);
 assert.equal(on.stats.agi,off.stats.agi);
 assert.equal(on.combat.attack.known,off.combat.attack.known);
});

test('legacy reference remains an archive, not the active current OS amount',()=>{
 const legacy=C.legacyBuffPreview({spi:134,blessing:90,hymn:30});
 assert.equal(legacy.gratia.value,20);
 assert.equal(preview().priestApplied.gratiaPreview,22);
 assert.match(book,/id===320007001\?modifiers\?\.priestApplied\?\.gratiaPreview/);
});

test('invalid source and disabled or undertrained priest cannot add attack speed',()=>{
 const forged=structuredClone(skills);
 forged['320007001'].funcs.find(x=>x.ep==='EP_ATTACKINTERVAL_SCALE').fv1[0]=99;
 assert.equal(preview({source:forged}).priestApplied.gratiaPreview,null);
 assert.equal(preview({source:forged}).combat.attackSpeed.priestBonus,0);
 assert.equal(preview({external:{...priest,enabled:false}}).combat.attackSpeed.priestBonus,0);
 assert.equal(preview({external:{...priest,blessing:7}}).combat.attackSpeed.priestBonus,0);
});
