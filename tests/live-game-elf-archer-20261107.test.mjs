import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Game client snapshot provided by the player on 2026-11-07.
// A second, dated elf warrior level-1 snapshot was provided on 2026-10-13.
// These observations do not define a general minimum ATK or +1...+10 formula.
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const view={};Function('window','document',read('pandora-studio-hero-book.js'))(
 view,{documentElement:{lang:'ru'}});
const C=host.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const equipment=[[2411,0],[11001,0],[12041,0],[14004,0],
 [13041,3],[15011,0],[18001,0],[22001,0],[22001,0],[21001,0]];
const item=(id,grade=0)=>['item:'+id,items[String(id)],grade];
const records=()=>equipment.map(([id,grade])=>item(id,grade));
function elfArcher({records:given=records(),level=45,techniqueTrained=15}={}){
 return C.base({classData:classes.ARCHER,
  raceData:tables.raceInit.ELF,jobData:tables.jobInit.SCOUT,
  allocation:zero,level,records:given,itemForth:forth,
  combatContext:{weapon:items['2411'],weaponGrade:0,weaponPlus:tables.weaponPlus,
   jobKey:'ARCHER',meleeMastery:4,techniqueTrained,techniqueInnate:0}
 });
}
test('game-client elf archer 45: proven maximum, defense, accuracy, evasion and ice; min remains reference-only',()=>{
 const x=elfArcher();
 assert.deepEqual([x.stats.vit,x.stats.str,x.stats.agi,x.stats.dex,
  x.stats.spi,x.stats.int],[3,5,7,6,6,7]);
 assert.deepEqual([x.combat.defense.armor,x.combat.defense.refinement,
  x.combat.defense.known],[44,3,47]);
 assert.deepEqual([x.combat.attack.minimum,x.combat.attack.known],[null,74]);
 assert.equal(x.combat.attack.minimumVerified,false); // observed 50 is evidence, not a generic formula
 assert.equal(x.combat.accuracy.known,62);
 assert.equal(x.combat.dodge.known,52);
 assert.equal(x.resistances.elements.ice,3);
 const rows=view.PandoraStageAttributes.summaryRows(x).flatMap(group=>group.rows);
 assert.equal(rows.find(row=>row.ru==='АТК')?.display,null);
 assert.equal(rows.find(row=>row.ru==='АТК')?.value,74);
 assert.equal(rows.find(row=>row.ru==='Защита')?.value,47);
});
test('unknown minimum is consistently absent across modified mastery, gear and level',()=>{
 assert.equal(elfArcher({techniqueTrained:20}).combat.attack.minimum,null);
 assert.equal(elfArcher({records:records().filter(row=>row[0]!=='item:21001')})
  .combat.attack.minimum,null);
 assert.equal(elfArcher({level:44}).combat.attack.minimum,null);
});
test('the +1.2 defense rule applies to every eligible armor item, not only leggings',()=>{
 const observed=C.defensePreview({records:[item(13041,3)]});
 assert.deepEqual([observed.armor,observed.refinementRaw,observed.refinement,observed.known],
  [12,3.6,3,15]);
 const old=C.defensePreview({records:[item(11001,3)]});
 assert.deepEqual([old.armor,old.refinementRaw,old.refinement,old.known],[4,3.6,3,7]);
});
test('historical elf warrior level-1 client observed 9–12, but planner shows only proven max',()=>{
 const data=C.base({classData:classes.WARRIOR,
  raceData:tables.raceInit.ELF,jobData:tables.jobInit.WARRIOR,
  allocation:zero,level:1,
  records:[item(21),item(12001),item(13001),item(15061)],
  combatContext:{jobKey:'WARRIOR',weapon:items['21'],weaponGrade:0,
   weaponPlus:tables.weaponPlus}});
 assert.equal(data.combat.attack.minimum,null); // Game-client evidence still records 9, no per-build override
 assert.equal(data.combat.attack.known,12);
 assert.equal(data.combat.defense.known,12);
});
