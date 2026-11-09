// One-time, owner-authorized, copy-on-write publication of six existing RU
// quest-instance blurbs. NEVER edit rows of the active D1 snapshot in place.
// No account or owner credentials are read; the GitHub runner uses its
// existing Cloudflare API token with D1 Write (if that permission is granted).
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const IDS=Object.freeze([20030040,20030070,20030080,20030090,20030100,20030110]);
export const EXPECTED_ACTIVE='ps-448434407e394325a432b8345206b922';
export const DATASETS=Object.freeze([
 'meta','classes','skills','items','souls','monsters','drops','maps','instances',
 'racialPassives','itemForth','unison','trades','tradeMeta','legacyLocale',
 'tables','expertise','chests','stringsEn'
]);
const PUBLIC='https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/instances.json';
const ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const DATABASE='0f8fbcd8-be06-414c-844b-a2091fdf6784';

const normalize=value=>Array.isArray(value)?value.map(normalize):
 value&&typeof value==='object'?Object.fromEntries(
  Object.keys(value).sort().map(key=>[key,normalize(value[key])])):value;
const same=(a,b)=>JSON.stringify(normalize(a))===JSON.stringify(normalize(b));
export function validateInstances(source,remote,{acceptPublished=true}={}){
 if(!Array.isArray(source)||!Array.isArray(remote)||source.length!==IDS.length||
  remote.length!==IDS.length)throw Error('Unexpected instance catalog length');
 const expected=new Map(source.map(row=>[row.id,row]));
 const actual=new Map(remote.map(row=>[row.id,row]));
 if(expected.size!==IDS.length||actual.size!==IDS.length||
  IDS.some(id=>!expected.has(id)||!actual.has(id)))
  throw Error('Missing, duplicate or extra instance identifiers');
 let missing=0,present=0;
 for(const id of IDS){
  const original=expected.get(id),current=actual.get(id);
  if(typeof original.blurb!=='string'||!original.blurb.trim()||
   typeof original.blurbRu!=='string'||!original.blurbRu.trim())
   throw Error('Source lacks a verified bilingual description');
  if(same(original,current)){present++;continue}
  const {blurbRu:translation,...untranslated}=original;
  if(!Object.hasOwn(current,'blurbRu')&&
   original.blurb===current.blurb&&same(untranslated,current)){missing++;continue}
  throw Error('Published instance differs from the verified source');
 }
 if(missing&&present)throw Error('Partially translated snapshot: manual review required');
 if(missing!==IDS.length&&present!==IDS.length)
  throw Error('Unexpected missing translation count');
 if(present&&!acceptPublished)throw Error('Translations already published');
 return present?'published':'missing';
}
export function stageId(active,source){
 if(!/^[a-z0-9-]{8,64}$/.test(active))throw Error('Invalid active snapshot');
 const fingerprint=createHash('sha256').update(active+'\n'+
  JSON.stringify(IDS.map(id=>source.find(x=>x.id===id)?.blurbRu))).digest('hex');
 return 'ru-instances-20261109-'+fingerprint.slice(0,12);
}
export function validateCounts(rows,expected){
 const seen=new Set();
 if(!Array.isArray(rows)||rows.length!==DATASETS.length)return false;
 for(const row of rows){
  if(!DATASETS.includes(row.dataset)||seen.has(row.dataset)||
    !Number.isSafeInteger(Number(row.amount))||Number(row.amount)<1||
    Number(expected?.[row.dataset])!==Number(row.amount))return false;
  seen.add(row.dataset);
 }
 return seen.size===DATASETS.length;
}
const readSource=()=>JSON.parse(readFileSync(
 new URL('../data/os/instances.json',import.meta.url),'utf8'));
const apiUrl='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+
 '/d1/database/'+DATABASE+'/query';
async function query(sql,params=[]){
 const token=process.env.CLOUDFLARE_API_TOKEN;
 if(typeof token!=='string'||token.length<16)
  throw Error('Missing configured Cloudflare API token; no D1 write');
 const response=await fetch(apiUrl,{method:'POST',
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({sql,params:params.map(String)}),
  signal:AbortSignal.timeout(30000)});
 const body=await response.json().catch(()=>null);
 if(!response.ok||body?.success!==true||body?.result?.length!==1||
  body.result[0].success!==true)
  throw Error('Cloudflare D1 query failed (HTTP '+response.status+
   ', error '+String(body?.errors?.[0]?.code??'unknown')+')');
 return body.result[0];
}
const rows=async(sql,params=[])=> (await query(sql,params)).results||[];
const active=async()=> (await rows(
 'SELECT snapshot,published_at,expected_counts FROM catalog_current WHERE id=1'))[0]||null;
const perDataset=async snapshot=>rows(
 'SELECT dataset,COUNT(*) AS amount FROM catalog_entries WHERE snapshot=? GROUP BY dataset',
 [snapshot]);
const fromD1=async snapshot=>(await rows(
 "SELECT payload FROM catalog_entries WHERE snapshot=? AND dataset='instances' ORDER BY record_key",
 [snapshot])).map(x=>JSON.parse(x.payload));
async function fromPublic(){
 const response=await fetch(PUBLIC+'?ru-publish-check='+Date.now(),
  {cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok||response.headers.get('x-ps-catalog')!=='d1')
  throw Error('Public endpoint is not the active D1 catalog');
 const snapshot=response.headers.get('x-ps-catalog-snapshot');
 if(!snapshot)throw Error('Public D1 snapshot provenance missing');
 return {snapshot,records:await response.json()};
}
async function cleanupStage(stage){
 const current=await active();
 if(current?.snapshot===stage)return;
 await query('DELETE FROM catalog_entries WHERE snapshot=?',[stage]);
}

export async function publish(){
 const source=readSource(),publicBefore=await fromPublic();
 const initial=validateInstances(source,publicBefore.records);
 const current=await active();
 if(!current||current.snapshot!==publicBefore.snapshot)
  throw Error('D1 snapshot changed between public and authenticated reads');
 const original=await fromD1(current.snapshot);
 if(validateInstances(source,original)!==initial)
  throw Error('D1 API and public instance descriptions disagree');
 if(initial==='published'){
  console.log('Six RU instance descriptions already published; no writes');
  return;
 }
 // Never silently migrate a different game catalog or update an active row.
 if(current.snapshot!==EXPECTED_ACTIVE)
  throw Error('Active D1 catalog changed since review; refuse to publish');
 const counts=JSON.parse(current.expected_counts);
 const before=await perDataset(current.snapshot);
 if(!validateCounts(before,counts))throw Error('Active dataset counts incomplete');
 const target=stageId(current.snapshot,source);
 if((await rows('SELECT COUNT(*) AS n FROM catalog_entries WHERE snapshot=?',
  [target]))[0]?.n!==0)
  throw Error('Staging snapshot already exists; refusing overwrite');
 let stageCreated=false,activated=false;
 try{
  // Copy complete existing D1 records, including richer <br>/<item> markup,
  // D1-only catalogue provenance, all player-independent datasets and metadata.
  for(const dataset of DATASETS){
   stageCreated=true;
   await query(
    'INSERT INTO catalog_entries(snapshot,dataset,record_key,name,kind,slot,is_costume_overlay,payload) '+
    'SELECT ?,dataset,record_key,name,kind,slot,is_costume_overlay,payload '+
    'FROM catalog_entries WHERE snapshot=? AND dataset=?',
    [target,current.snapshot,dataset]);
  }
  if(!validateCounts(await perDataset(target),counts))
   throw Error('Staged snapshot differs in total dataset counts');
  // Six guarded, narrowly scoped JSON field additions on STAGED rows only.
  for(const id of IDS){
   const sourceRow=source.find(x=>x.id===id);
   await query(
    "UPDATE catalog_entries SET payload=json_set(payload,'$.blurbRu',?) "+
    "WHERE snapshot=? AND dataset='instances' AND record_key=? "+
    "AND json_extract(payload,'$.blurb')=? AND json_type(payload,'$.blurbRu') IS NULL",
    [sourceRow.blurbRu,target,String(id),sourceRow.blurb]);
  }
  if(validateInstances(source,await fromD1(target))!=='published')
   throw Error('Staged instance descriptions failed exact readback');
  // Exact copy minus those six JSON records: 0 other data fields touched.
  const differences=await rows(
   'SELECT COUNT(*) AS n FROM catalog_entries AS copy '+
   'JOIN catalog_entries AS original ON original.snapshot=? '+
   'AND copy.dataset=original.dataset AND copy.record_key=original.record_key '+
   'WHERE copy.snapshot=? AND ('+
   'copy.payload<>original.payload OR copy.name<>original.name OR '+
   'copy.kind<>original.kind OR copy.slot<>original.slot OR '+
   'copy.is_costume_overlay<>original.is_costume_overlay)',
   [current.snapshot,target]);
  if(Number(differences[0]?.n)!==IDS.length)
   throw Error('Staged snapshot unexpectedly changed additional records');
  if((await active())?.snapshot!==current.snapshot)
   throw Error('Active snapshot changed during stage; refuse activation');
  const switched=await query(
   'UPDATE catalog_current SET snapshot=?,published_at=? '+
   'WHERE id=1 AND snapshot=?',
   [target,String(Date.now()),current.snapshot]);
  if(Number(switched.meta?.changes)!==1)
   throw Error('Snapshot activation CAS failed (no other data overwritten)');
  activated=true;
  if((await active())?.snapshot!==target||
   validateInstances(source,await fromD1(target))!=='published')
   throw Error('Activation readback failed; inspect production D1');
  console.log('Activated safe D1 snapshot '+target+
   '; 6/6 RU blurbs published; 19/19 datasets unchanged in counts');
  // CDN may cache the old version; provenance ensures no false success.
  const live=await fromPublic();
  if(live.snapshot===target&&validateInstances(source,live.records)==='published')
   console.log('Public D1 instances verified 6/6');
  else console.warn('CDN still serves previous snapshot; authenticated D1 readback passed');
 }catch(error){
  if(stageCreated&&!activated){
   try{await cleanupStage(target)}catch(cleanupError){
    console.error('Temporary staging cleanup failed: '+cleanupError.message);
   }
  }
  throw error;
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 if(process.argv[2]!=='--publish-owner-authorized-six-ru'){
  console.error('Refusing production D1 write without exact owner-approved flag');
  process.exitCode=2;
 }else publish().catch(error=>{console.error(error.message);process.exitCode=1});
}
