// Read-only, deterministic preparation for a FUTURE approved D1 defaults
// migration. Running this program NEVER connects to Cloudflare or writes D1.
// Existing guideedit overrides are not rewritten or deleted.
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const byCodepoint=(a,b)=>a<b?-1:a>b?1:0;
const sha256=text=>createHash('sha256').update(text,'utf8').digest('hex');
const sqlString=value=>"'"+String(value).replaceAll("'","''")+"'";

export function buildEditorialDefaultsManifest(){
 const scope={};
 const context={window:scope};
 for(const path of [
  'pandora-studio-hero-book.js',
  'pandora-studio-ui-locale.js',
  'pandora-studio-honor-guide.js',
  'pandora-studio-wiki-labels.js'
 ])runInNewContext(read(path),context,{filename:path,timeout:5000});
 const ui=scope.PandoraUILocale;
 const book=scope.PandoraStageAttributes;
 const guide=scope.PandoraHonorGuide;
 const wiki=scope.PandoraWikiLabels;
 if(!ui?.fieldKey||!book?.summaryRows||!guide?.validOverride||
  !wiki?.key||!wiki?.validField)
  throw Error('Required audited authorial catalogs did not initialize');

 const packageInfo=JSON.parse(read('package.json'));
 const release=packageInfo.version;
 if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(release))
  throw Error('Invalid pinned source release');
 const records=[],seen=new Set(),cohorts=Object.create(null);
 function append(recordKey,field,value,cohort){
  if(!/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01]))|wiki\.labels)$/.test(recordKey))
   throw Error('Unallowlisted authorial field: '+recordKey);
  if(recordKey==='guideedit.wiki.labels'?!wiki.validField(field):
   !/^(?:ru|en|hintRu|hintEn|[a-z][a-zA-Z]*Ru|[a-z][a-zA-Z]*En)$/.test(field))
   throw Error('Unallowlisted authorial subfield: '+field);
  if(typeof value!=='string'||!value.trim()||value.length>8000||
   /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))
   throw Error('Invalid source text for '+recordKey+'/'+field);
  const identity=recordKey+'\u0000'+field;
  if(seen.has(identity))throw Error('Duplicate D1 default identity: '+identity);
  seen.add(identity);
  records.push({recordKey,field,value});
  cohorts[cohort]=(cohorts[cohort]||0)+1;
 }

 // The exact same stable ids and fallback values that existing owner CAS
 // already uses for headings, status text, and the Hero Book text catalog.
 for(const key of ui.keys()){
  const id=ui.fieldKey(key);
  if(!id)throw Error('Missing existing bilingual owner field key: '+key);
  for(const lang of ['ru','en'])
   append('guideedit.book.'+id,lang,ui.baseText(key,lang),'ui-locale');
 }

 // The owner dock's fixed visible action captions, group headings and
 // instructions are also already editable via ownerCopy('owner-dock').
 // Extract only the audited literal dictionary, never execute the app's
 // startup logic, inspect player state, or guess text keys from a game UI.
 const app=read('pandora-studio-app.js');
 const match=app.match(/const ownerDockText=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!match)throw Error('Missing audited owner dock authorial source registry');
 const dock=runInNewContext('('+match[1]+')',{},{
  filename:'ownerDockText',timeout:5000
 });
 if(!dock||typeof dock!=='object'||Array.isArray(dock))
  throw Error('Invalid owner dock text dictionary');
 for(const [key,pair] of Object.entries(dock)){
  if(!/^[a-z][a-zA-Z0-9]{1,50}$/.test(key)||
   !Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid owner-dock authorial field: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.owner-dock.'+slug,lang,pair[i],'owner-dock');
 }

 // Item encyclopedia field labels and their independent hover explanations
 // share canonical guideedit.book.wiki.item-field.* records. Extract ONLY
 // their audited static RU/EN dictionaries, never source item values.
 const itemPresentation=read('pandora-studio-item-presentation.js');
 const itemDict=name=>{
  const source=itemPresentation.match(new RegExp(
   'const '+name+'=Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);'));
  if(!source)throw Error('Missing reviewed item presentation '+name);
  return runInNewContext('('+source[1]+')',{},{
   filename:name,timeout:5000
  });
 };
 const itemLabels=itemDict('itemFieldLabels');
 const itemHints=itemDict('itemFieldHints');
 const expectedItemFields=['kind','level','W','PEN','AC','atkspeed','range','soulslot'];
 if(Object.keys(itemLabels).sort().join('|')!==[...expectedItemFields].sort().join('|')||
  Object.keys(itemHints).sort().join('|')!==[...expectedItemFields].sort().join('|'))
  throw Error('Source item fields changed: review migration map first');
 for(const key of expectedItemFields){
  const recordKey='guideedit.book.wiki.item-field.'+key.toLowerCase();
  for(const [pair,ruField,enField] of [
   [itemLabels,'ru','en'],[itemHints,'hintRu','hintEn']
  ]){
   if(!Array.isArray(pair[key])||pair[key].length!==2)
    throw Error('Invalid item field authorial copy: '+key);
   append(recordKey,ruField,pair[key][0],'item-field');
   append(recordKey,enField,pair[key][1],'item-field');
  }
 }

 // Three actual equipment settings tabs have existing owner-copy keys.
 // The remaining context-menu actions use different dynamic UI surfaces,
 // so never invent D1 identities for them in this partial inventory.
 const equipmentSrc=read('pandora-studio-equipment-ui.js');
 const equipmentMatch=equipmentSrc.match(
  /const actionLabels=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!equipmentMatch)throw Error('Missing existing equipment action labels');
 const gear=runInNewContext('('+equipmentMatch[1]+')',{},{
  filename:'equipment actionLabels',timeout:5000
 });
 for(const [tab,action] of [
  ['choose','replace'],['details','properties'],['souls','souls']
 ]){
  const pair=gear[action];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Unknown equipment tab authorial label: '+action);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.tab.'+tab,lang,pair[i],'equipment-tabs');
 }

 // The Wiki chapters, all five Honor subchapters and skill filters are
 // one existing D1 JSON record. Preserve their exact field identities;
 // never reconstruct these labels from list position or save them as game IDs.
 for(const [group,registry] of [
  ['chapter',wiki.chapter],['honor',wiki.honor],['skillFilter',wiki.skillFilter]
 ]){
  for(const [id,names] of Object.entries(registry)){
   if(!Array.isArray(names)||names.length!==2)
    throw Error('Invalid bilingual Wiki label default: '+group+'/'+id);
   for(const [index,lang] of ['ru','en'].entries())
    append('guideedit.wiki.labels',wiki.key(group,id,lang),names[index],'wiki-labels');
  }
 }

 // Summary tooltip keys are position-defined in the existing public UI.
 // Only source-authored explanations are materialized, never live stats.
 const summaryRows=book.summaryRows({}).flatMap(group=>group.rows);
 const unmappedHints=[];
 for(const [caption,pair] of Object.entries(guide.hints)){
  const index=summaryRows.findIndex(row=>row.ru===caption);
  if(index<0){unmappedHints.push(caption);continue}
  for(const [offset,field] of ['hintRu','hintEn'].entries())
   if(pair[offset])append('guideedit.book.summary.'+index,field,pair[offset],
    'summary-hints');
 }

 // Semantic Book help fields may exist without a fixed heading literal.
 // These are independent hover explanations, not editable game parameters.
 for(const [key,pair] of Object.entries(guide.help))
  for(const [offset,field] of ['hintRu','hintEn'].entries())
   if(pair[offset])append('guideedit.book.'+key,field,pair[offset],
    'semantic-hints');

 // Honor overview has its own existing D1 data schema. Preserve each
 // authorial field and do not seed live rank thresholds or numeric rewards.
 for(const [field,value] of Object.entries(guide.intro))
  if(typeof value==='string'&&value.trim())
   append('guideedit.honor.overview',field,value,'honor-overview');
 for(const rank of guide.defaultRanks){
  if(!Number.isInteger(rank.id)||rank.id<0||rank.id>11)
   throw Error('Unexpected Honor rank identity');
  for(const field of ['nameRu','nameEn','benefitRu','benefitEn'])
   if(typeof rank[field]==='string'&&rank[field].trim())
    append('guideedit.honor.rank.'+rank.id,field,rank[field],
     'honor-rank-copy');
 }
 records.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 // The read-only Worker reader refuses oversized snapshots. A successful
 // planner must NEVER generate a version that the matching reader rejects.
 if(records.length>3000||
  records.reduce((sum,row)=>sum+row.value.length,0)>450000)
  throw Error('Authored defaults exceed versioned D1 reader limits');
 const payload={schema:1,release,records};
 const digest=sha256(JSON.stringify(payload));
 return Object.freeze({...payload,digest,
  snapshot:release+'-'+digest.slice(0,16),
  stats:Object.freeze({
   entries:records.length,recordKeys:new Set(records.map(r=>r.recordKey)).size,
   cohorts,unmappedHints:unmappedHints.sort(byCodepoint)
  })});
}

// Validate a complete readback from an isolated D1 import, not just the
// number of imported rows. No browser/Worker activity or persistence occurs.
export function verifyEditorialDefaultsReadback(manifest,metadata,readbackRows){
 const fail=reason=>({ok:false,reason});
 if(!metadata||!Array.isArray(readbackRows))return fail('missing-readback');
 if(metadata.snapshot!==manifest.snapshot||
  metadata.source_release!==manifest.release||
  metadata.sha256!==manifest.digest||
  metadata.expected_rows!==manifest.records.length)
  return fail('snapshot-metadata-mismatch');
 if(readbackRows.length!==manifest.records.length)
  return fail('row-count-mismatch');
 const seen=new Set(),rows=[];
 for(const input of readbackRows){
  if(!input||typeof input!=='object')return fail('invalid-record');
  const row={recordKey:input.record_key??input.recordKey,
   field:input.field,value:input.value};
  if(Object.values(row).some(value=>typeof value!=='string'))
   return fail('invalid-record');
  const key=row.recordKey+'\u0000'+row.field;
  if(seen.has(key))return fail('duplicate-record');
  seen.add(key);rows.push(row);
 }
 rows.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 const digest=sha256(JSON.stringify({
  schema:manifest.schema,release:manifest.release,records:rows
 }));
 if(digest!==manifest.digest)return fail('content-digest-mismatch');
 return {ok:true,checkedRows:rows.length,snapshot:manifest.snapshot,digest};
}

export function renderEditorialDefaultsSQL(manifest){
 // Refuse tampered manifests; an immutable snapshot is identified by its
 // source-release + digest, not a mutable 'current' table pointer.
 const payload={schema:manifest.schema,release:manifest.release,
  records:manifest.records};
 const digest=sha256(JSON.stringify(payload));
 if(manifest.schema!==1||manifest.digest!==digest||
  manifest.snapshot!==manifest.release+'-'+digest.slice(0,16))
  throw Error('Manifest content or version does not match its SHA-256');
 const rows=manifest.records;
 if(!Array.isArray(rows)||!rows.length||
  rows.some(r=>typeof r.recordKey!=='string'||
   typeof r.field!=='string'||typeof r.value!=='string'))
  throw Error('Missing or invalid D1 default rows');
 const lines=[
  '-- DRY RUN SQL ONLY. Review and back up D1 before a separate authorized import.',
  '-- No deployment/import happens by running the planning script.',
  '-- Only a complete verified snapshot may be activated by a future reader.',
  'CREATE TABLE IF NOT EXISTS editorial_default_rows ('+
   'snapshot TEXT NOT NULL, record_key TEXT NOT NULL, field TEXT NOT NULL, '+
   'value TEXT NOT NULL, PRIMARY KEY(snapshot,record_key,field));',
  'CREATE TABLE IF NOT EXISTS editorial_default_snapshots ('+
   'snapshot TEXT PRIMARY KEY, source_release TEXT NOT NULL, sha256 TEXT NOT NULL, '+
   'expected_rows INTEGER NOT NULL, installed_at INTEGER NOT NULL);'
 ];
 for(const r of rows)lines.push(
  'INSERT INTO editorial_default_rows(snapshot,record_key,field,value) VALUES ('+
   [manifest.snapshot,r.recordKey,r.field,r.value].map(sqlString).join(',')+
   ') ON CONFLICT(snapshot,record_key,field) DO NOTHING;');
 // Insert the marker last. A partial upload has no completed snapshot entry.
 // A future reader MUST also verify exact count and digest before activation.
 lines.push('INSERT INTO editorial_default_snapshots('+
  'snapshot,source_release,sha256,expected_rows,installed_at) VALUES ('+
  [sqlString(manifest.snapshot),sqlString(manifest.release),
   sqlString(manifest.digest),String(rows.length),
   "unixepoch()"].join(',')+
  ') ON CONFLICT(snapshot) DO NOTHING;');
 lines.push('-- Readback check; mismatch means DO NOT activate:');
 lines.push('SELECT COUNT(*) AS actual_rows FROM editorial_default_rows WHERE snapshot='+
  sqlString(manifest.snapshot)+';');
 lines.push('SELECT snapshot,source_release,sha256,expected_rows '+
  'FROM editorial_default_snapshots WHERE snapshot='+
  sqlString(manifest.snapshot)+';');
 return lines.join('\n')+'\n';
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const manifest=buildEditorialDefaultsManifest();
 const format=process.argv[2]||'--report';
 if(format==='--sql')process.stdout.write(renderEditorialDefaultsSQL(manifest));
 else if(format==='--json')process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
 else if(format==='--verify-readback'){
  const filename=process.argv[3];
  if(!filename){process.stderr.write('Missing staging readback JSON path\n');process.exitCode=2;}
  else {
   try{
    const data=JSON.parse(readFileSync(resolve(filename),'utf8'));
    const verdict=verifyEditorialDefaultsReadback(
     manifest,data?.metadata,data?.rows);
    process.stdout.write(JSON.stringify(verdict,null,2)+'\n');
    if(!verdict.ok)process.exitCode=1;
   }catch(error){
    process.stderr.write('Invalid staging readback file: '+error.message+'\n');
    process.exitCode=2;
   }
  }
 }
 else if(format==='--report')process.stdout.write(JSON.stringify({
  schema:manifest.schema,release:manifest.release,
  snapshot:manifest.snapshot,digest:manifest.digest,
  ...manifest.stats,note:'No D1 writes or network calls performed'
 },null,2)+'\n');
 else{
  process.stderr.write('Usage: node scripts/plan-editorial-d1-defaults.mjs '+
   '[--report|--json|--sql|--verify-readback <staging-readback.json>]\n');
  process.exitCode=2;
 }
}
