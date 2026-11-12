import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('pandora-studio-hero-book.js');
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:40,str:40,agi:40,dex:40,spi:40,int:40};
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};

test('selected Blessed Repose source appears only with an active ally buff',()=>{
 const options={classData:classes.WARRIOR,raceData:stats,jobData:zeros,
  allocation:zeros,level:45,combatContext:{jobKey:'WARRIOR',skillCatalog:skills}};
 const off=C.base({...options,attributeBuffs:{remakedSkillIds:[]}});
 const on=C.base({...options,attributeBuffs:{remakedSkillIds:[320002001]}});
 assert.equal(off.regeneration.mp.allyBuff,undefined);
 assert.equal(on.regeneration.mp.allyBuff,90);
 assert.equal(on.regeneration.mp.total-off.regeneration.mp.total,90);
 assert.equal(on.mp,off.mp);
});

test('Lightness comes from the applied hero preview and is a speed index',()=>{
 const base={stats,level:45,jobKey:'SNIPER',skillCatalog:skills};
 const off=C.combatPreview({...base,combatBuffs:{}});
 const on=C.combatPreview({...base,combatBuffs:{remakedSkillIds:[260002001]}});
 assert.equal(on.movementSpeed.lightness,30);
 assert.equal(off.movementSpeed.lightness,0);
 assert.equal(on.movementSpeed.known-off.movementSpeed.known,30);
});

test('fixed active recovery and movement bonuses are NOT Skill Effects rows',()=>{
 const chapter=ui.slice(ui.indexOf('function skillEffectsPage('),
  ui.indexOf('// Remaked uses three DISTINCT source matrices'));
 assert.doesNotMatch(chapter,/stage-supporting-skills|supportRows/);
 assert.doesNotMatch(chapter,/amount:combat\.movementSpeed\?\.lightness/);
 assert.doesNotMatch(chapter,/amount:modifiers\?\.regeneration\?\.mp\?\.allyBuff/);
 assert.match(ui,/mpRecoveryRepose/);
 assert.match(ui,/r\?\.mp\?\.allyBuff,' инд\.'/);
});
