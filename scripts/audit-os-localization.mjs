#!/usr/bin/env node
// Read-only coverage audit. Never invent English labels for source records.
import {readFile} from 'node:fs/promises';

const read=async name=>JSON.parse(await readFile(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const english=await read('strings.en');
const kinds=['items','skills','monsters','souls','classes','maps','instances'];
const report={source:'data/os/strings.en.json',translationPolicy:'OS/approved Remaked sources only',kinds:{},missingTotal:0,suspectEnglishNameTotal:0};
for(const kind of kinds){
 const data=await read(kind);
 const records=Array.isArray(data)?Object.fromEntries(data.map(row=>[row.id,row])):data;
 const translated=english[kind]||{};
 const missing=Object.keys(records).filter(id=>!String(translated[id]?.n||'').trim());
 const extra=Object.keys(translated).filter(id=>!Object.hasOwn(records,id));
 // Names with Cyrillic in an EN field may be placeholders or misplaced
 // source text. Do not silently mistranslate them; flag for manual checking.
 const suspicious=Object.entries(translated).filter(([id,row])=>
  Object.hasOwn(records,id)&&/[А-Яа-яЁё]/u.test(String(row?.n||'')))
  .map(([id,row])=>({id,englishValue:row.n,russianSource:records[id]?.name||null}));
 report.kinds[kind]={
  records:Object.keys(records).length,englishNames:Object.keys(records).length-missing.length,
  missing:missing.length,missingIds:missing.slice(0,24),unusedEnglishRecords:extra.length,
  suspiciousCyrillicNames:suspicious.length,suspiciousSamples:suspicious.slice(0,24)
 };
 report.missingTotal+=missing.length;
 report.suspectEnglishNameTotal+=suspicious.length;
}
console.log(JSON.stringify(report,null,2));
// CI records gaps without fabricating names. --strict is opt-in when an
// authoritative English source has been supplied for every record.
if(process.argv.includes('--strict')&&(report.missingTotal||report.suspectEnglishNameTotal))process.exitCode=1;
