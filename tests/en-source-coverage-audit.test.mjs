import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/audit-os-localization.mjs',import.meta.url));
const run=(strict=false)=>spawnSync(process.execPath,[script,...(strict?['--strict']:[])],
 {encoding:'utf8',timeout:30000});

test('read-only English source audit separates missing and suspicious existing names',()=>{
 const processResult=run();
 assert.equal(processResult.status,0,processResult.stderr);
 const report=JSON.parse(processResult.stdout);
 assert.equal(report.translationPolicy,'OS/approved Remaked sources only');
 assert.ok(report.kinds.skills&&report.kinds.items&&report.kinds.monsters);
 const en=JSON.parse(readFileSync(new URL('../data/os/strings.en.json',import.meta.url),'utf8'));
 const data=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
 const bad=Object.entries(en.skills).filter(([id,row])=>
  Object.hasOwn(data,id)&&/[А-Яа-яЁё]/u.test(String(row?.n||'')));
 assert.equal(report.kinds.skills.suspiciousCyrillicNames,bad.length);
 assert.deepEqual(report.kinds.skills.suspiciousSamples.map(row=>row.id),
  bad.slice(0,24).map(([id])=>id));
 for(const row of report.kinds.skills.suspiciousSamples){
  assert.equal(row.englishValue,en.skills[row.id].n);
  assert.equal(row.russianSource,data[row.id].name);
 }
 assert.equal(report.suspectEnglishNameTotal,Object.values(report.kinds)
  .reduce((sum,entry)=>sum+entry.suspiciousCyrillicNames,0));
 assert.equal(report.missingTotal,Object.values(report.kinds)
  .reduce((sum,entry)=>sum+entry.missing,0));
});
test('strict source audit fails only when untranslated or suspicious names remain',()=>{
 const inspection=run(),report=JSON.parse(inspection.stdout);
 const checked=run(true);
 assert.equal(checked.status,(report.missingTotal+report.suspectEnglishNameTotal)>0?1:0);
});
