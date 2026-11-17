// One-time, owner-approved D1 correction for the seven catalog item levels.
// Existing authenticated Cloudflare service token only. No in-place mutation of
// the active snapshot, account rows, owner overrides or player data.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const IDS=Object.freeze(['19010','19011','20027','20028','21019','21020','22022']);
export const EXPECTED_COUNT=1140;
export const DATASETS=Object.freeze([
 'meta','classes','skills','items','souls','monsters','drops','maps','instances',
 'racialPassives','itemForth','unison','trades','tradeMeta','legacyLocale',
 'tables','expertise','chests','stringsEn'
]);
const PUBLIC='https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/items.json';
const ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const DATABASE='0f8fbcd8-be06-414c-844b-a2091fdf6784';
const API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+
 '/d1/database/'+DATABASE+'/query';

const canon=value=>Array.isArray(value)?value.map(canon):
 value&&typeof value==='object'?Object.fromEntries(
  Object.keys(value).sort().map(key=>[key,canon(value[key])])):value;
const same=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));
const hasOwn=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const sourceData=()=>JSON.parse(readFileSync(
 new URL('../data/os/items.json',import.meta.url),'utf8'));

export function validateItems(source,current,{count=EXPECTED_COUNT}={}){
 if(!source||!current||Array.isArray(source)||Array.isArray(current)||
  typeof source!=='object'||typeof current!=='object'||
  Object.keys(source).length!==count||Object.keys(current).length!==count)
  throw Error('Item catalog count or shape changed; no publication');
 const set=new Set(IDS);
 let old=0,published=0;
 for(const [id,expected] of Object.entries(source)){
  if(!hasOwn(current,id))throw Error('Missing item '+id);
  const actual=current[id];
  if(!expected||!actual||typeof expected!=='object'||
   typeof actual!=='object'||Array.isArray(expected)||Array.isArray(actual))
   throw Error('Invalid item record '+id);
  if(!set.has(id)){
   if(!same(expected,actual))throw Error('Unreviewed item drift '+id);
   continue;
  }
  if(expected.level!==50)throw Error('Source item '+id+' is not level 50');
  const {level:sourceLevel,...sourceRest}=expected;
  const {level:activeLevel,...activeRest}=actual;
  if(!same(sourceRest,activeRest))
   throw Error('Non-level fields differ for reviewed item '+id);
  if(activeLevel===55)old++;
  else if(activeLevel===50)published++;
  else throw Error('Unexpected active level for item '+id);
 }
 if(old+published!==IDS.length)throw Error('Reviewed IDs are incomplete');
 if(old&&published)throw Error('Partially changed catalog; manual review required');
 return old===IDS.length?'pending':'published';
}
export function validateCounts(rows,expected){
 if(!Array.isArray(rows)||rows.length!==DATASETS.length||
  !expected||typeof expected!=='object')return false;
 const found=new Set();
 for(const row of rows){
  if(!DATASETS.includes(row.dataset)||found.has(row.dataset)||
   !Number.isSafeInteger(Number(row.amount))||Number(row.amount)<1||
   Number(row.amount)!==Number(expected[row.dataset]))return false;
  found.add(row.dataset);
 }
 return found.size===DATASETS.length;
}
export function stageId(snapshot){
 if(!/^[a-z0-9-]{8,64}$/.test(snapshot))throw Error('Invalid active snapshot ID');
 const fingerprint=createHash('sha256').update(snapshot+'\n'+IDS.join(',')+'\n55>50')
  .digest('hex').slice(0,12);
 return 'item-level-50-20261117-'+fingerprint;
}
export function validateDifferenceRows(rows){
 return Array.isArray(rows)&&rows.length===IDS.length&&
  rows.every(r=>r.dataset==='items'&&IDS.includes(String(r.record_key)))&&
  new Set(rows.map(r=>String(r.record_key))).size===IDS.length;
}

async function publicItems(){
 const resp=await fetch(PUBLIC+'?d1-683='+Date.now(),{
  cache:'no-store',signal:AbortSignal.timeout(25000)});
 if(!resp.ok||resp.headers.get('x-ps-catalog')!=='d1')
  throw Error('Public item catalog is not an active D1 response');
 const snapshot=resp.headers.get('x-ps-catalog-snapshot');
 if(!snapshot)throw Error('Missing public D1 snapshot provenance');
 return {snapshot,records:await resp.json()};
}
async function query(sql,params=[]){
 const token=process.env.CLOUDFLARE_API_TOKEN;
 if(typeof token!=='string'||token.length<16)
  throw Error('Authorized Cloudflare secret missing; no write performed');
 const resp=await fetch(API,{method:'POST',
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({sql,params:params.map(String)}),
  signal:AbortSignal.timeout(40000)});
 const body=await resp.json().catch(()=>null);
 if(!resp.ok||body?.success!==true||body?.result?.length!==1||
  body.result[0].success!==true)
  throw Error('Cloudflare D1 request unsuccessful (HTTP '+resp.status+
   ', error code '+String(body?.errors?.[0]?.code??'unknown')+')');
 return body.result[0];
}
const rows=async(sql,params=[])=>(await query(sql,params)).results||[];
const current=async()=>(await rows(
 'SELECT snapshot,published_at,expected_counts FROM catalog_current WHERE id=1'))[0]||null;
const datasetCounts=async snapshot=>rows(
 'SELECT dataset,COUNT(*) AS amount FROM catalog_entries WHERE snapshot=? GROUP BY dataset',
 [snapshot]);
async function d1Items(snapshot){
 const recordRows=await rows(
  "SELECT record_key,payload FROM catalog_entries WHERE snapshot=? AND dataset='items'",
  [snapshot]);
 if(recordRows.length!==EXPECTED_COUNT)throw Error('Unexpected D1 item row count');
 const result={};
 for(const r of recordRows){
  if(!/^\d+$/.test(String(r.record_key))||hasOwn(result,String(r.record_key)))
   throw Error('D1 duplicate or malformed item key');
  result[String(r.record_key)]=JSON.parse(r.payload);
 }
 return result;
}
async function cleanUnactivatedStage(snapshot){
 if((await current())?.snapshot!==snapshot)
  await query('DELETE FROM catalog_entries WHERE snapshot=?',[snapshot]);
}
export async function preflight(){
 const live=await publicItems();
 const status=validateItems(sourceData(),live.records);
 console.log('Read-only issue #683 preflight: '+status+
  ', all '+EXPECTED_COUNT+' item records checked, 7 exact level targets');
 return status;
}
export async function publish(){
 if(process.env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||
  process.env.PS_D1_DATABASE_ID!==DATABASE)
  throw Error('Unreviewed Cloudflare account or D1 target; no write');
 const source=sourceData(),publicBefore=await publicItems();
 const before=validateItems(source,publicBefore.records);
 const active=await current();
 if(!active||active.snapshot!==publicBefore.snapshot)
  throw Error('D1 active snapshot is not the publicly reviewed snapshot');
 const authBefore=await d1Items(active.snapshot);
 if(validateItems(source,authBefore)!==before)
  throw Error('Authenticated D1 records disagree with public D1');
 if(before==='published'){
  console.log('Seven item levels already 50 in active D1; no write');
  return;
 }
 const expectedCounts=JSON.parse(active.expected_counts);
 if(!validateCounts(await datasetCounts(active.snapshot),expectedCounts))
  throw Error('Active snapshot dataset counts fail preflight');
 const target=stageId(active.snapshot);
 const existing=await rows('SELECT COUNT(*) AS n FROM catalog_entries WHERE snapshot=?',[target]);
 if(Number(existing[0]?.n)!==0)
  throw Error('Staging snapshot already exists; no overwrite permitted');
 let stageStarted=false,activated=false;
 try{
  // Preserve every original D1 row and all D1-only markup/metadata. Never
  // replace the active catalog with a stale GitHub JSON archive.
  for(const dataset of DATASETS){
   stageStarted=true;
   await query(
    'INSERT INTO catalog_entries(snapshot,dataset,record_key,name,kind,slot,is_costume_overlay,payload) '+
    'SELECT ?,dataset,record_key,name,kind,slot,is_costume_overlay,payload '+
    'FROM catalog_entries WHERE snapshot=? AND dataset=?',
    [target,active.snapshot,dataset]);
  }
  if(!validateCounts(await datasetCounts(target),expectedCounts))
   throw Error('Staged snapshot dataset counts differ');
  for(const id of IDS){
   const result=await query(
    "UPDATE catalog_entries SET payload=json_set(payload,'$.level',50) "+
    "WHERE snapshot=? AND dataset='items' AND record_key=? "+
    "AND json_type(payload,'$.level')='integer' "+
    "AND json_extract(payload,'$.level')=55",
    [target,id]);
   if(Number(result.meta?.changes)!==1)
    throw Error('Guarded update did not affect exactly one item '+id);
  }
  if(validateItems(source,await d1Items(target))!=='published')
   throw Error('Staged items differ from reviewed catalog');
  // Strict staging diff: only seven payloads in the items dataset may differ;
  // no deletions, additions, other fields or other datasets may differ.
  const difference=await rows(
   'SELECT copy.dataset,copy.record_key FROM catalog_entries AS copy '+
   'JOIN catalog_entries AS original ON original.snapshot=? '+
   'AND copy.dataset=original.dataset AND copy.record_key=original.record_key '+
   'WHERE copy.snapshot=? AND ('+
   'copy.payload<>original.payload OR copy.name<>original.name OR '+
   'copy.kind<>original.kind OR copy.slot<>original.slot OR '+
   'copy.is_costume_overlay<>original.is_costume_overlay)',
   [active.snapshot,target]);
  if(!validateDifferenceRows(difference))
   throw Error('Stage changed data outside the seven reviewed item IDs');
  const missingCopies=await rows(
   'SELECT COUNT(*) AS n FROM catalog_entries AS original '+
   'LEFT JOIN catalog_entries AS copy ON copy.snapshot=? '+
   'AND original.dataset=copy.dataset AND original.record_key=copy.record_key '+
   'WHERE original.snapshot=? AND copy.record_key IS NULL',
   [target,active.snapshot]);
  if(Number(missingCopies[0]?.n)!==0)
   throw Error('Staged snapshot is missing original catalog rows');
  if((await current())?.snapshot!==active.snapshot)
   throw Error('Another publisher changed active D1; CAS required');
  const switched=await query(
   'UPDATE catalog_current SET snapshot=?,published_at=? '+
   'WHERE id=1 AND snapshot=?',
   [target,String(Date.now()),active.snapshot]);
  if(Number(switched.meta?.changes)!==1)
   throw Error('D1 CAS failed, active snapshot not changed');
  activated=true;
  if((await current())?.snapshot!==target||
   validateItems(source,await d1Items(target))!=='published')
   throw Error('Authenticated activation readback failed; inspect D1');
  console.log('SUCCESS: 7/7 levels 55->50, 1140/1140 items preserved, 19 datasets copied with CAS');
  // Cloudflare edge may serve previous snapshot briefly. A matching public
  // provenance and all seven levels are required before claiming live parity.
  let verified=false;
  for(let attempt=0;attempt<8;attempt++){
   const live=await publicItems();
   if(live.snapshot===target&&validateItems(source,live.records)==='published'){
    verified=true;break;
   }
   if(attempt<7)await new Promise(resolve=>setTimeout(resolve,2500));
  }
  if(!verified)throw Error('D1 CAS succeeded, but public snapshot is not yet refreshed');
  console.log('PUBLIC D1 VERIFIED: all 7 levels are 50, 1140 records');
 }catch(error){
  if(stageStarted&&!activated){
   try{await cleanUnactivatedStage(target)}
   catch(cleanupError){console.error('Staging cleanup failed: '+cleanupError.message)}
  }
  throw error;
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 if(process.argv.length===3&&process.argv[2]==='--preflight'){
  preflight().catch(e=>{console.error(e.message);process.exitCode=1});
 }else if(process.argv.length===3&&process.argv[2]==='--verify-published'){
  preflight().then(state=>{if(state!=='published')
   throw Error('Public D1 item levels have not yet been updated')})
   .catch(e=>{console.error(e.message);process.exitCode=1});
 }else if(process.argv.length===3&&process.argv[2]==='--publish-owner-authorized-seven-levels-20261117'){
  publish().catch(e=>{console.error(e.message);process.exitCode=1});
 }else{
  console.error('No production writes without exact owner-approved flag');
  process.exitCode=2;
 }
}
