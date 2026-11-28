import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 auditOfficialOsSnapshot,officialSourceSummaryMarkdown
} from '../scripts/audit-official-os-source.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const calc=host.PandoraOSCalculator;

test('all 28 jobs x levels 1–55 keep existing Legacy ACC/Dodge numeric basis but admit uncertainty',()=>{
 assert.equal(Object.keys(classes).length,28);
 let count=0;
 for(const jobKey of Object.keys(classes))for(let level=1;level<=55;level++){
  const result=calc.combatPreview({
   jobKey,level,stats:{str:10,dex:10,agi:7,vit:5,spi:6,int:7},
   skillCatalog:skills
  });
  assert.ok(result,'valid Legacy planning preview for '+jobKey+' level '+level);
  assert.equal(result.accuracy.base,level+10);
  assert.equal(result.dodge.base,level+7);
  for(const metric of [result.accuracy,result.dodge]){
   assert.equal(metric.confidence,'legacy-model');
   assert.equal(metric.verified,false);
   assert.match(metric.source,/Remaked Calc/);
   assert.ok(Number.isFinite(metric.known));
  }
  count++;
 }
 assert.equal(count,1540);
});

test('historic lv4 Scout vector stays an unresolved parity discrepancy, not an arbitrary offset',()=>{
 const scout=calc.combatPreview({jobKey:'SCOUT',level:4,
  stats:{vit:3,str:10,agi:7,dex:10,spi:6,int:7},skillCatalog:skills});
 assert.ok(scout);
 assert.deepEqual([scout.accuracy.base,scout.dodge.base],[14,11]);
 assert.equal(scout.accuracy.verified,false);
 assert.equal(scout.dodge.verified,false);
 const elf=calc.combatPreview({jobKey:'WARRIOR',level:1,
  stats:{vit:5,str:6,agi:5,dex:5,spi:6,int:7},skillCatalog:skills});
 assert.deepEqual([elf.accuracy.known,elf.dodge.known],[6,6],
  'published first-level in-client fixture remains unchanged');
});

test('RU/EN Hero Book labels expose Legacy status without editing D1 source captions',()=>{
 const book=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-theme.css');
 assert.match(book,/row\('Точность','Accuracy',c\.accuracy\?\.known,'',null,/);
 assert.match(book,/row\('Уклонение','Evasion',c\.dodge\?\.known,'',null,/);
 assert.match(book,/result\.confidence==='legacy-model'/);
 assert.match(book,/setAttribute\('data-source-confidence','legacy-model'\)/);
 assert.match(book,/Предварительная модель расчёта/);
 assert.match(book,/Planning model\. Final in-game accuracy/);
 assert.match(css,/data-source-confidence="legacy-model"/);
 assert.match(css,/content:" · модель"/);
 assert.match(css,/content:" · model"/);
 assert.match(book,/guideLabel\(tile\.firstChild,'summary\.'\+summaryIndex\+\+,result\.ru,result\.en,options\)/);
});

test('current server level cap is 50; separate planning to 55 stays documented',()=>{
 const docs=read('docs/OS_LIVE_PARITY_CHECKS.md');
 assert.equal(tables.levelCap,50);
 assert.match(docs,/tables\.levelCap:50/);
 assert.match(docs,/планировать 1–55/);
 assert.doesNotMatch(docs,/сохранённый .+tables\.json. содержит .levelCap:45/);
});

test('official game-source release summary distinguishes unavailable vs real drift; no D1 writes',async()=>{
 const data={1:{id:1,name:'Original'}};
 const report=await auditOfficialOsSnapshot({
  names:['skills','items','souls'],
  readLocal:async name=>name==='items'?{1:{id:1,name:'Changed'}}:data,
  fetchSource:async name=>name==='souls'?Promise.reject(
   Object.assign(new Error('source down'),{reasons:[{}]})):
   {data,url:'https://pandorasaga-os.com/gamedata/'+name+'.json',sha256:'f'.repeat(64)}
 });
 assert.deepEqual(report.summary,{requested:3,matched:1,different:1,unavailable:1});
 const summary=officialSourceSummaryMarkdown(report);
 assert.match(summary,/\| skills \| MATCH \|/);
 assert.match(summary,/\| items \| DRIFT \|/);
 assert.match(summary,/\| souls \| UNAVAILABLE \|/);
 assert.match(read('.github/workflows/live-readonly.yml'),/audit-official-os-source\.mjs --observe/);
 assert.match(read('.github/workflows/live-readonly.yml'),/continue-on-error: true/);
});
