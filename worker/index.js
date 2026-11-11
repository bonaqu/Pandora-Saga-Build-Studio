import {accountApi,principal as accountPrincipal} from './pandora-studio-account-api.js';
import {createCatalogPullRequest,githubCatalogEnabled,previewOwnerOverrides,createOwnerOverridesPullRequest} from './pandora-studio-github-catalog-pr.js';
// Cloudflare Worker backend for Pandora Saga Build Studio.
// Passwords and session hashes are NEVER stored in the Pages repository.
// Native PBKDF2 in Cloudflare Workers supports at most 100,000 iterations.
// Both initial setup and subsequent login must use the same iteration count.
// Source: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
const ORIGIN='https://bonaqu.github.io';
// One allowlist for both Save and Undo/Reset. Keep this list symmetric.
const OWNER_EDITABLE_KEY_PATTERN=/^(site\.(title|subtitle)|race\.[0-5]|job\.(?:[0-9]|1[0-9]|2[0-7])|branch\.[a-zA-Z0-9_-]{1,32}|item\.[a-zA-Z0-9_.-]{1,70}|itemdesc\.[0-9]{1,15}|itemslots\.[0-9]{1,15}|itemedit\.[0-9]{1,15}|acquireedit\.[0-9]{1,15}|tradeedit\.[0-9]{1,15}|wikiedit\.(?:monster|map|npc|instance|skill|soul)\.[0-9]{1,15}|wikiedit\.(?:map\.(?:astir-(?:union|empire|kingdom)|el-beht|astir-underground|custom-[a-z0-9-]{6,42})|npc\.(?:astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}|owner-npc-[a-f0-9]{16})|monster\.owner-monster-[a-z0-9]{12,24})|guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01])|zones|wars)|wiki\.labels)|dropedit\.[0-9]{1,15}|chestedit\.[0-9]{1,15}|spawnedit\.[0-9]{1,15}|soul\.[a-zA-Z0-9_.-]{1,70}|skill\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|skilldesc\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|visual\.(?:logo|race\.[0-5]\.[fm]|skill\.[A-Za-z0-9_.-]{1,40}|item\.[0-9]{1,15}|soul\.[0-9]{1,15}))$/;
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
function random(n=32){return crypto.getRandomValues(new Uint8Array(n))}
async function sha(bytes){return b64(await crypto.subtle.digest('SHA-256',typeof bytes==='string'?enc.encode(bytes):bytes))}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
function same(a,b){a=String(a||'');b=String(b||'');let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0}
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}})}
function originHeaders(request){const o=request.headers.get('Origin');return o===ORIGIN||o==='http://localhost:8788'?{'Access-Control-Allow-Origin':o,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Expose-Headers':'X-PS-Catalog-Snapshot, X-PS-Catalog','Vary':'Origin'}:{}}
function no(message,status=400){return json({error:message},status)}
// Bound untrusted JSON by actual UTF-8 bytes, even when a caller omits or
// understates Content-Length. The old request.json()/request.text() paths
// could buffer unbounded input before checking its size.
async function boundedTextBody(request,maxBytes,maxChars=maxBytes){
 const declared=request.headers.get('content-length');
 if(declared!==null&&!/^[0-9]+$/.test(declared))return {invalid:true};
 if(declared!==null&&Number(declared)>maxBytes)return {tooLarge:true};
 const reader=request.body?.getReader?.();
 if(!reader)return {invalid:true};
 const chunks=[];
 let total=0;
 try{
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   if(!(value instanceof Uint8Array))return {invalid:true};
   total+=value.byteLength;
   if(total>maxBytes){
    await reader.cancel().catch(()=>{});
    return {tooLarge:true};
   }
   chunks.push(value);
  }
  const bytes=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  return raw.length>maxChars?{tooLarge:true}:{raw};
 }catch{return {invalid:true}}
 finally{reader.releaseLock()}
}
async function boundedJsonBody(request,maxBytes,maxChars=maxBytes){
 const result=await boundedTextBody(request,maxBytes,maxChars);
 if(typeof result.raw!=='string')return null;
 try{return JSON.parse(result.raw)}
 catch{return null}
}
async function body(request,limit=8192){return boundedJsonBody(request,limit)}
const OWNER_EDIT_BODY_LIMIT=384*1024;
async function ownerEditBody(request){
 return boundedJsonBody(request,OWNER_EDIT_BODY_LIMIT);
}
async function auth(request,env){const header=request.headers.get('authorization')||'';if(!header.startsWith('Bearer '))return false;const token=header.slice(7);if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return false;const hash=await sha(token),now=Date.now();const row=await env.DB.prepare('SELECT id FROM sessions WHERE token_hash=? AND expires>?').bind(hash,now).first();return !!row}
async function throttle(env,ip){const key=await sha(ip);const now=Date.now();const result=await env.DB.prepare('SELECT attempts,reset_at FROM login_attempts WHERE ip_hash=?').bind(key).first();return result&&result.reset_at>now&&result.attempts>=5}
async function recordFailed(env,ip){const key=await sha(ip),now=Date.now();await env.DB.prepare(`INSERT INTO login_attempts (ip_hash,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET attempts=CASE WHEN reset_at<? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END`).bind(key,now+900000,now,now).run()}
async function clearFailed(env,ip){await env.DB.prepare('DELETE FROM login_attempts WHERE ip_hash=?').bind(await sha(ip)).run()}
async function session(env){const token=b64(random(32)),hash=await sha(token),expires=Date.now()+4*3600000;await env.DB.prepare('INSERT INTO sessions(token_hash,expires) VALUES(?,?)').bind(hash,expires).run();return{token,expires}}

const DATASETS=["meta","classes","skills","items","souls","monsters","drops","maps","instances","racialPassives","itemForth","unison","trades","tradeMeta","legacyLocale","tables","expertise","chests","stringsEn"];
const EXTRA_COUNTS=['tradeMeta','legacyLocale','tables','expertise','chests','stringsEn'];
const SERIALIZED_DATASETS=['tables','expertise','chests','stringsEn'];
const SEED_SCHEMA=[
 'CREATE TABLE IF NOT EXISTS catalog_entries(snapshot TEXT NOT NULL,dataset TEXT NOT NULL,record_key TEXT NOT NULL,name TEXT,kind TEXT,slot TEXT,is_costume_overlay INTEGER NOT NULL DEFAULT 0,payload TEXT NOT NULL,PRIMARY KEY(snapshot,dataset,record_key))',
 'CREATE INDEX IF NOT EXISTS idx_catalog_slot ON catalog_entries(snapshot,dataset,slot,is_costume_overlay)',
 'CREATE INDEX IF NOT EXISTS idx_catalog_kind ON catalog_entries(snapshot,dataset,kind)',
 'CREATE TABLE IF NOT EXISTS catalog_current(id INTEGER PRIMARY KEY CHECK(id=1),snapshot TEXT NOT NULL,published_at INTEGER NOT NULL,expected_counts TEXT NOT NULL)'
];
async function catalogBody(request){
 // Keep the historical 65,000-character import limit, plus a hard 256 KiB
 // UTF-8 transport ceiling (Cyrillic JSON may need multiple bytes per char).
 return boundedJsonBody(request,256*1024,65000);
}
function isCostumeKind(kind){return typeof kind==='string'&&kind.startsWith('DECO_')}
async function activeCatalog(env){
 try{return await env.DB.prepare('SELECT snapshot,published_at,expected_counts FROM catalog_current WHERE id=1').first()}
 catch{return null}
}
async function serveCatalog(env,dataset){
 const active=await activeCatalog(env);
 if(!active)return no('Catalog not published in D1 yet',503);
 const q=await env.DB.prepare('SELECT record_key,payload FROM catalog_entries WHERE snapshot=? AND dataset=? ORDER BY record_key').bind(active.snapshot,dataset).all();
 const rows=q.results||[];
 if(!rows.length)return no('Dataset missing from published catalog',503);
 let obj=dataset==='meta'?JSON.parse(rows[0].payload):
  SERIALIZED_DATASETS.includes(dataset)?JSON.parse(rows.map(r=>JSON.parse(r.payload).data).join('')):
  dataset==='instances'?rows.map(r=>JSON.parse(r.payload)):
  Object.fromEntries(rows.map(r=>[r.record_key,JSON.parse(r.payload)]));
 if(dataset==='trades'){
  const extras=await env.DB.prepare("SELECT payload FROM catalog_entries WHERE snapshot=? AND dataset='tradeMeta' AND record_key='all'").bind(active.snapshot).first();
  const additional=extras?JSON.parse(extras.payload):{npcs:{},mapNames:{},limitMeta:{}};
  obj={trades:rows.map(r=>JSON.parse(r.payload)),...additional};
 }
 return json(obj,200,{'cache-control':'public, max-age=60','x-ps-catalog':'d1','x-ps-catalog-snapshot':active.snapshot});
}
async function adminCatalog(request,env,path){
 if(!await auth(request,env))return no('Unauthorized',401);
 if(path==='/api/admin/catalog/initialize'){
  for(const sql of SEED_SCHEMA)await env.DB.prepare(sql).run();
  return json({ok:true,created:true});
 }
 if(path==='/api/admin/catalog/test-write'){
  // Verify BOTH D1 tables used by catalog publishing and inline admin edits.
  // Reserved random identifiers do not overlap real catalog or owner records.
  const before=await activeCatalog(env);
  const unique=crypto.randomUUID().replaceAll('-','');
  const snapshot='qa-'+unique,overrideKey='__qa.'+unique;
  const catalogValue=JSON.stringify({temporary:true,snapshot,created:Date.now()});
  const overrideValue=JSON.stringify({temporary:true,overrideKey,created:Date.now()});
  let catalogWritten=false,overrideWritten=false;
  let readback=false,cleaned=false,overrideReadback=false,overrideCleaned=false;
  try{
   await env.DB.prepare(
    'INSERT INTO catalog_entries(snapshot,dataset,record_key,name,kind,slot,is_costume_overlay,payload) VALUES(?,?,?,?,?,?,?,?)'
   ).bind(snapshot,'meta','health','Temporary D1 check','','',0,catalogValue).run();
   catalogWritten=true;
   const saved=await env.DB.prepare(
    'SELECT payload FROM catalog_entries WHERE snapshot=? AND dataset=? AND record_key=?'
   ).bind(snapshot,'meta','health').first();
   readback=saved?.payload===catalogValue;
   await env.DB.prepare('INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?)')
    .bind(overrideKey,overrideValue,Date.now()).run();
   overrideWritten=true;
   const edit=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(overrideKey).first();
   overrideReadback=edit?.value===overrideValue;
  }finally{
   try{
    if(overrideWritten){
     const removed=await env.DB.prepare('DELETE FROM overrides WHERE key=?')
      .bind(overrideKey).run();
     overrideCleaned=Number(removed.meta?.changes)===1;
    }
   }finally{
    if(catalogWritten){
     const removed=await env.DB.prepare(
      'DELETE FROM catalog_entries WHERE snapshot=? AND dataset=? AND record_key=?'
     ).bind(snapshot,'meta','health').run();
     cleaned=Number(removed.meta?.changes)===1;
    }
   }
  }
  const after=await activeCatalog(env);
  const activeCatalogUnchanged=JSON.stringify(before||null)===JSON.stringify(after||null);
  if(!readback||!cleaned||!overrideReadback||!overrideCleaned||!activeCatalogUnchanged)
   return no('D1 isolated catalog/override write, read or cleanup check failed',502);
  return json({ok:true,readback,cleaned,overrideReadback,overrideCleaned,
   activeCatalogUnchanged});
 }
 if(path==='/api/admin/catalog/test-owner-cas'){
  // Called only after owner confirms a manual QA action in the editor.
  // Reserved random keys never overlap real editable fields or game records.
  const before=await activeCatalog(env),nonce=crypto.randomUUID().replaceAll('-','');
  const primary='__qa.cas.'+nonce,other='__qa.peer.'+nonce,
   initial='qa-first-'+nonce,updated='qa-second-'+nonce,peer='qa-peer-'+nonce;
  const isOne=r=>Number(r?.meta?.changes)===1;
  const isZero=r=>Number(r?.meta?.changes)===0;
  let pass=false,cleaned=false,catalogUnchanged=false;
  try{
   const inserted=await env.DB.prepare(
    'INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO NOTHING'
   ).bind(primary,initial,Date.now()).run();
   const neighbor=await env.DB.prepare(
    'INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO NOTHING'
   ).bind(other,peer,Date.now()).run();
   if(!isOne(inserted)||!isOne(neighbor))throw Error('QA creation failed');
   const staleEdit=await env.DB.prepare(
    'UPDATE overrides SET value=?,updated_at=? WHERE key=? AND value=?'
   ).bind('qa-stale-'+nonce,Date.now(),primary,'not-expected-'+nonce).run();
   const goodEdit=await env.DB.prepare(
    'UPDATE overrides SET value=?,updated_at=? WHERE key=? AND value=?'
   ).bind(updated,Date.now(),primary,initial).run();
   const staleReset=await env.DB.prepare(
    'DELETE FROM overrides WHERE key=? AND value=?'
   ).bind(primary,initial).run();
   const afterEdit=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(primary).first();
   const neighborBefore=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(other).first();
   if(!isZero(staleEdit)||!isOne(goodEdit)||!isZero(staleReset)||
    afterEdit?.value!==updated||neighborBefore?.value!==peer)
    throw Error('QA update conflict failed');
   const reset=await env.DB.prepare('DELETE FROM overrides WHERE key=? AND value=?')
    .bind(primary,updated).run();
   const repeated=await env.DB.prepare('DELETE FROM overrides WHERE key=? AND value=?')
    .bind(primary,updated).run();
   const afterReset=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(primary).first();
   const neighborAfter=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(other).first();
   pass=isOne(reset)&&isZero(repeated)&&!afterReset&&neighborAfter?.value===peer;
  }catch{
   pass=false;
  }finally{
   // Unconditionally clean only our own freshly randomized QA namespace.
   // Clean even after a database driver throws *after* an applied insert.
   await env.DB.prepare('DELETE FROM overrides WHERE key=?').bind(primary).run();
   await env.DB.prepare('DELETE FROM overrides WHERE key=?').bind(other).run();
   const leftoverPrimary=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(primary).first();
   const leftoverOther=await env.DB.prepare('SELECT value FROM overrides WHERE key=?')
    .bind(other).first();
   cleaned=!leftoverPrimary&&!leftoverOther;
   const after=await activeCatalog(env);
   catalogUnchanged=JSON.stringify(before||null)===JSON.stringify(after||null);
  }
  if(!pass||!cleaned||!catalogUnchanged)
   return no('Isolated D1 CAS QA failed; verify temporary cleanup and catalog state',502);
  return json({ok:true,casVerified:true,qaCleaned:true,activeCatalogUnchanged:true});
 }
 if(path==='/api/admin/catalog/status'){
  const current=await activeCatalog(env);
  return json({active:current?.snapshot||null,counts:current?JSON.parse(current.expected_counts):null});
 }
 const data=await catalogBody(request);
 if(!data||typeof data!=='object')return no('Invalid catalog import batch',400);
 if(!/^[a-z0-9-]{8,64}$/.test(data.snapshot||''))return no('Invalid snapshot identifier',400);
 if(path==='/api/admin/catalog/batch'){
  if(!DATASETS.includes(data.dataset)||!Array.isArray(data.records)||data.records.length>35||!data.records.length)return no('Invalid dataset/batch',400);
  const commands=[];
  for(const entry of data.records){
   const key=String(entry?.key??''),value=entry?.value;
   if(!/^[A-Za-z0-9_-]{1,72}$/.test(key)||!value||typeof value!=='object'||Array.isArray(value))return no('Invalid record',400);
   const payload=JSON.stringify(value);
   if(payload.length>12000)return no('Record too large',400);
   const kind=data.dataset==='items'?String(value.kind||''):'';
   const costume=data.dataset==='items'&&isCostumeKind(kind)?1:0;
   commands.push(env.DB.prepare('INSERT INTO catalog_entries(snapshot,dataset,record_key,name,kind,slot,is_costume_overlay,payload) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(snapshot,dataset,record_key) DO UPDATE SET name=excluded.name,kind=excluded.kind,slot=excluded.slot,is_costume_overlay=excluded.is_costume_overlay,payload=excluded.payload').bind(
    data.snapshot,data.dataset,key,String(value.name||'').slice(0,240),kind.slice(0,60),String(value.slot||'').slice(0,40),costume,payload));
  }
  await env.DB.batch(commands);
  return json({ok:true,received:data.records.length,dataset:data.dataset});
 }
 if(path==='/api/admin/catalog/publish'){
  // A stale or older client cannot bypass the catalog's atomic pointer lease.
  // Check the expectation BEFORE any D1 catalog rows are read or published.
  if(!Object.hasOwn(data,'expectedActive'))
   return no('Expected active catalog snapshot required',428);
  if(data.expectedActive!==null&&
   (typeof data.expectedActive!=='string'||
    !/^[a-z0-9-]{8,64}$/.test(data.expectedActive)))
   return no('Invalid expected snapshot',400);
  const result=await env.DB.prepare("SELECT payload FROM catalog_entries WHERE snapshot=? AND dataset='meta' AND record_key='all'").bind(data.snapshot).first();
  if(!result)return no('Meta snapshot missing',409);
  if(!Number.isInteger(Number(data?.extraCounts?.legacyLocale))||Number(data.extraCounts.legacyLocale)<1000||Number(data.extraCounts.legacyLocale)>10000)return no('Expected localization count required',400);
  const meta=JSON.parse(result.payload),counts={};
  for(const dataset of DATASETS){
    const row=await env.DB.prepare('SELECT COUNT(*) AS c FROM catalog_entries WHERE snapshot=? AND dataset=?').bind(data.snapshot,dataset).first();
    const observed=Number(row?.c||0),expected=dataset==='meta'||dataset==='tradeMeta'?1:
     EXTRA_COUNTS.includes(dataset)?Number(data?.extraCounts?.[dataset]):Number(meta?.counts?.[dataset]);
    if(!Number.isInteger(expected)||expected<=0||observed!==expected)return no('Incomplete '+dataset+': '+observed+' of '+expected,409);
    counts[dataset]=observed;
  }
  for(const name of SERIALIZED_DATASETS){
    const fragments=await env.DB.prepare('SELECT payload FROM catalog_entries WHERE snapshot=? AND dataset=? ORDER BY record_key').bind(data.snapshot,name).all();
    try{
      const object=JSON.parse((fragments.results||[]).map(x=>JSON.parse(x.payload).data).join(''));
      if(!object||typeof object!=='object')return no('Invalid assembled '+name,409);
      if(name==='stringsEn'){
        if(object.locale!=='en')return no('Invalid English locale source',409);
        for(const group of ['items','skills','monsters','souls','classes']){
          if(Object.keys(object[group]||{}).length!==Number(meta?.localeCounts?.en?.[group]))return no('Incomplete English strings: '+group,409);
        }
      }
    }catch(error){return no('Broken serialized dataset '+name,409)}
  }
  const costumes=await env.DB.prepare("SELECT COUNT(*) AS c FROM catalog_entries WHERE snapshot=? AND dataset='items' AND is_costume_overlay=1").bind(data.snapshot).first();
  // Prevent stale admin reviews from overwriting a newer D1 snapshot.
  // The guarded pointer switch is a single atomic D1 statement.
  const previous=data.expectedActive;
  const statement=previous===null?
   env.DB.prepare('INSERT OR IGNORE INTO catalog_current(id,snapshot,published_at,expected_counts) VALUES(1,?,?,?)').bind(data.snapshot,Date.now(),JSON.stringify(counts)):
   env.DB.prepare('UPDATE catalog_current SET snapshot=?,published_at=?,expected_counts=? WHERE id=1 AND snapshot=?').bind(data.snapshot,Date.now(),JSON.stringify(counts),previous);
  const published=await statement.run();
  if(Number(published.meta?.changes)!==1)return no('Published catalog changed during review',409);
  return json({ok:true,active:data.snapshot,counts,costumeItems:costumes.c});
 }
 return no('Unknown catalog operation',404);
}


/* Public short links are bound to an existing private build and revoked on deletion. */
async function shareApi(request,env,path,ip){
 // Every public build preview and link creation requires a valid player session.
 const principal=await accountPrincipal(request,env);
 if(!principal)return no('Sign in to work with builds',401);
 const names=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('shared_builds','shared_build_limits','shared_build_sources')").all();
 const present=new Set((names.results||[]).map(row=>row.name));
 if(!['shared_builds','shared_build_limits','shared_build_sources'].every(name=>present.has(name))){
  try{
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS shared_builds (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at INTEGER NOT NULL)').run();
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS shared_build_limits (ip_hash TEXT NOT NULL, day INTEGER NOT NULL, created INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(ip_hash,day))').run();
   await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_shared_builds_created ON shared_builds(created_at)').run();
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS shared_build_sources (share_id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, build_id TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY(share_id) REFERENCES shared_builds(id))').run();
   await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_shared_build_sources_owner ON shared_build_sources(owner_hash,build_id)').run();
  }catch{return no('Хранилище коротких ссылок не подготовлено: нужна миграция D1',503)}
 }
 if(request.method==='GET'){
  const match=path.match(/^\/api\/shared\/([A-Za-z0-9_-]{11})$/);
  if(!match)return no('Not found',404);
  const row=await env.DB.prepare('SELECT payload FROM shared_builds WHERE id=?').bind(match[1]).first();
  if(!row)return json({error:'Билд по этой ссылке не найден.',reason:'not_found'},404);
  const source=await env.DB.prepare('SELECT owner_hash,build_id FROM shared_build_sources WHERE share_id=?').bind(match[1]).first();
  if(!source)return json({error:'Эта старая ссылка больше не поддерживается. Попросите владельца создать новую.',reason:'legacy'},410);
  const original=await env.DB.prepare('SELECT deleted_at FROM private_builds WHERE owner_hash=? AND build_id=?').bind(source.owner_hash,source.build_id).first();
  if(!original||original.deleted_at!==null)return json({error:'Владелец удалил исходный билд. Ссылка больше недействительна.',reason:'deleted'},410);
  // A damaged public snapshot must not turn one link into HTTP 500.
  // Do not expose corrupted D1 JSON or rewrite the stored snapshot.
  let share;
  try{share=JSON.parse(row.payload)}catch{}
  const data=share?.data;
  if(share?.schema!==1||share?.type!=='build'||!data||
   typeof data!=='object'||Array.isArray(data)||
   !Number.isInteger(data.race)||data.race<0||data.race>5||
   !Number.isInteger(data.job)||data.job<0||data.job>=28||
   !Number.isInteger(data.level)||data.level<1||data.level>55)
   return json({error:'Ссылка на билд повреждена.',reason:'invalid'},410);
  return json({schema:1,share});
 }
 if(request.method!=='POST'||path!=='/api/shared')return no('Not found',404);
 // Account identity was checked before reading or writing shared snapshots.
 const input=await boundedTextBody(request,256*1024,48000);
 if(input.tooLarge)return no('Payload too large',413);
 if(typeof input.raw!=='string')return no('Invalid share payload',400);
 let payload;
 try{payload=JSON.parse(input.raw)}catch{return no('Invalid share payload',400)}
 if(!payload||payload.schema!==1||payload.type!=='build'||!/^[a-f0-9]{32}$/.test(payload.buildId||''))
  return no('Можно поделиться только сохранённым билдом',400);
 const validate=entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&
  Number.isInteger(entry.race)&&entry.race>=0&&entry.race<=5&&
  Number.isInteger(entry.job)&&entry.job>=0&&entry.job<28&&
  Number.isInteger(entry.level)&&entry.level>=1&&entry.level<=55;
 const owner=principal.owner_hash;
 const saved=await env.DB.prepare('SELECT payload,deleted_at FROM private_builds WHERE owner_hash=? AND build_id=?').bind(owner,payload.buildId).first();
 if(!saved||saved.deleted_at!==null)return no('Сохранённый билд не найден или уже удалён',409);
 // Only the owned D1 record is authoritative. Never trust arbitrary character data from the share POST.
 let stored;try{stored=JSON.parse(saved.payload)}catch{return no('Повреждена сохранённая запись',409)}
 if(stored?.id!==payload.buildId||!validate(stored?.data))return no('Некорректная сохранённая запись',409);
 const canonical=JSON.stringify({schema:1,type:'build',data:stored.data});
 if(canonical.length>47000)return no('Share exceeds storage limit',413);
 // Sharing an unchanged saved snapshot should return its existing short URL.
 const existing=await env.DB.prepare('SELECT s.id FROM shared_build_sources AS m JOIN shared_builds AS s ON s.id=m.share_id WHERE m.owner_hash=? AND m.build_id=? AND s.payload=? ORDER BY s.created_at DESC LIMIT 1')
  .bind(owner,payload.buildId,canonical).first();
 if(existing?.id)return json({ok:true,id:existing.id,reused:true});
 const ipHash=await sha(ip),day=Math.floor(Date.now()/86400000);
 const limit=await env.DB.prepare('INSERT INTO shared_build_limits(ip_hash,day,created) VALUES(?,?,1) ON CONFLICT(ip_hash,day) DO UPDATE SET created=created+1 WHERE created<30').bind(ipHash,day).run();
 if(!limit.meta?.changes)return no('Share limit reached for today',429);
 for(let attempt=0;attempt<3;attempt++){
  const id=b64(random(8)),now=Date.now();
  try{
   // D1 batch runs atomically: never publish a public snapshot without its ownership record.
   await env.DB.batch([
    env.DB.prepare('INSERT INTO shared_builds(id,payload,created_at) VALUES(?,?,?)').bind(id,canonical,now),
    env.DB.prepare('INSERT INTO shared_build_sources(share_id,owner_hash,build_id,created_at) VALUES(?,?,?,?)').bind(id,owner,payload.buildId,now)
   ]);
   return json({ok:true,id},201);
  }catch(error){
   if(!String(error).includes('UNIQUE'))throw error;
  }
 }
 return no('Unable to allocate share ID',503);
}

/* Private, account-free D1 library using a browser-held random secret. */
function validPrivateBuildEntry(entry,id){
 return entry&&typeof entry==='object'&&!Array.isArray(entry)&&
  entry.id===id&&typeof entry.name==='string'&&entry.name.trim()&&
  entry.name.length<=70&&Number.isSafeInteger(entry.at)&&entry.at>=0&&
  entry.data&&typeof entry.data==='object'&&!Array.isArray(entry.data)&&
  Number.isInteger(entry.data.race)&&entry.data.race>=0&&entry.data.race<=5&&
  Number.isInteger(entry.data.job)&&entry.data.job>=0&&entry.data.job<28&&
  Number.isInteger(entry.data.level)&&entry.data.level>=1&&entry.data.level<=55;
}
function mapPrivateBuildRow(row){
 if(row.deleted_at!==null)return {id:row.build_id,deleted:true,entry:null};
 let entry;
 try{entry=JSON.parse(row.payload)}catch{}
 return validPrivateBuildEntry(entry,row.build_id)?
  {id:row.build_id,deleted:false,entry}:
  {id:row.build_id,deleted:false,entry:null,unavailable:true};
}
// One-way, explicit recovery of older guest libraries. The caller must first
// authenticate as an account owner AND prove possession of the old browser key.
// Read-only preview: no old or new owner data are modified here.
async function legacyBuildPreview(request,env){
 // Require a player account before reporting unsupported methods.
 const principal=await accountPrincipal(request,env);
 if(!principal)return no('Sign in to import older builds',401);
 if(request.method!=='POST')return no('Method not allowed',405);
 const body=await boundedJsonBody(request,4096,1024);
 if(!body||!/^[a-f0-9]{64}$/.test(body.legacyKey||''))
  return no('Invalid previous library code',400);
 const previousOwner=await sha(body.legacyKey);
 if(previousOwner===principal.owner_hash)return json({records:[],alreadyConnected:true});
 const names=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='private_builds'").all();
 if(!(names.results||[]).length)return no('Build storage unavailable',503);
 const rows=await env.DB.prepare('SELECT build_id,payload,deleted_at FROM private_builds WHERE owner_hash=? ORDER BY (deleted_at IS NOT NULL), updated_at DESC')
  .bind(previousOwner).all();
 // Existing capacity is 200 live entries. Never expose raw malformed data.
 const records=(rows.results||[]).slice(0,250).map(mapPrivateBuildRow);
 return json({records,limit:200});
}
async function libraryApi(request,env){
 const principal=await accountPrincipal(request,env);
 if(!principal)return no('Sign in to work with builds',401);
 const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='private_builds'").all();
 if(!(exists.results||[]).length){
  try{
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS private_builds (owner_hash TEXT NOT NULL, build_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER, PRIMARY KEY(owner_hash,build_id))').run();
   await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_private_builds_owner_time ON private_builds(owner_hash,updated_at DESC)').run();
  }catch{return no('Хранилище билдов не подготовлено',503)}
 }
 const owner=principal.owner_hash;
 if(request.method==='GET'){
  const rows=await env.DB.prepare('SELECT build_id,payload,deleted_at FROM private_builds WHERE owner_hash=? ORDER BY (deleted_at IS NOT NULL), updated_at DESC').bind(owner).all();
  // Isolate a malformed saved row instead of failing the entire library.
  // Never expose its raw payload or silently treat the row as absent:
  // that could cause the browser to reupload a stale snapshot under this ID.
  const records=(rows.results||[]).map(mapPrivateBuildRow);
  return json({records});
 }
 if(request.method!=='POST')return no('Method not allowed',405);
 const raw=await boundedTextBody(request,256*1024,45000);
 if(raw.tooLarge)return no('Library entry too large',413);
 if(typeof raw.raw!=='string')return no('Invalid JSON',400);
 let data;try{data=JSON.parse(raw.raw)}catch{return no('Invalid JSON',400)}
 const id=data?.action==='put'?data?.entry?.id:data?.id;
 if(!/^[a-f0-9]{32}$/.test(id||''))return no('Invalid build ID',400);
 const now=Date.now();
 if(data.action==='delete'){
  const tombstone=env.DB.prepare("INSERT INTO private_builds(owner_hash,build_id,payload,updated_at,deleted_at) VALUES(?,?,'{}',?,?) ON CONFLICT(owner_hash,build_id) DO UPDATE SET payload='{}',updated_at=excluded.updated_at,deleted_at=excluded.deleted_at").bind(owner,id,now,now);
  // Scrub all linked public snapshots while retaining source IDs for HTTP 410 explanations.
  // Older databases may not have this new table until the Worker has initialized sharing.
  const mapped=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='shared_build_sources'").all();
  if((mapped.results||[]).length){
   const scrub=env.DB.prepare("UPDATE shared_builds SET payload='{}' WHERE id IN (SELECT share_id FROM shared_build_sources WHERE owner_hash=? AND build_id=?)").bind(owner,id);
   await env.DB.batch([tombstone,scrub]);
  }else await tombstone.run();
  return json({ok:true,sharesRevoked:true});
 }
 if(data.action!=='put')return no('Invalid operation',400);
 const item=data.entry;
 if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>70||
  !Number.isSafeInteger(item.at)||item.at<0||
  !item.data||typeof item.data!=='object'||Array.isArray(item.data)||
  !Number.isInteger(item.data.race)||item.data.race<0||item.data.race>5||
  !Number.isInteger(item.data.job)||item.data.job<0||item.data.job>=28||
  !Number.isInteger(item.data.level)||item.data.level<1||item.data.level>55)
  return no('Invalid character',400);
 const payload=JSON.stringify({id,name:item.name,at:item.at,data:item.data});
 if(payload.length>42000)return no('Build too large',413);
 const old=await env.DB.prepare('SELECT build_id,deleted_at FROM private_builds WHERE owner_hash=? AND build_id=?').bind(owner,id).first();
 if(old?.deleted_at!=null)return json({error:'Удалённый билд нельзя восстановить под прежним идентификатором',reason:'deleted'},409);
 if(!old){
  const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM private_builds WHERE owner_hash=? AND deleted_at IS NULL').bind(owner).first();
  if((count?.total||0)>=200)return no('Library limit reached',413);
 }
 // Atomic revision/tombstone condition: a delayed request cannot replace a newer
 // character or restore an original deleted after the preliminary SELECT.
 // A stored malformed JSON row must remain quarantined. Guard every
 // json_extract/json_type with CASE so SQLite never evaluates invalid JSON,
 // and keep the character schema identical to GET's validation boundary.
 const result=await env.DB.prepare(`INSERT INTO private_builds
 (owner_hash,build_id,payload,updated_at,deleted_at) VALUES(?,?,?,?,NULL)
 ON CONFLICT(owner_hash,build_id) DO UPDATE SET
  payload=excluded.payload,updated_at=excluded.updated_at
 WHERE private_builds.deleted_at IS NULL AND
  CASE WHEN json_valid(private_builds.payload) THEN (
   json_extract(private_builds.payload,'$.id')=private_builds.build_id
   AND json_type(private_builds.payload,'$.name')='text'
   AND length(trim(json_extract(private_builds.payload,'$.name'))) BETWEEN 1 AND 70
   AND json_type(private_builds.payload,'$.at')='integer'
   AND json_extract(private_builds.payload,'$.at')>=0
   AND json_type(private_builds.payload,'$.data')='object'
   AND json_type(private_builds.payload,'$.data.race')='integer'
   AND json_extract(private_builds.payload,'$.data.race') BETWEEN 0 AND 5
   AND json_type(private_builds.payload,'$.data.job')='integer'
   AND json_extract(private_builds.payload,'$.data.job') BETWEEN 0 AND 27
   AND json_type(private_builds.payload,'$.data.level')='integer'
   AND json_extract(private_builds.payload,'$.data.level') BETWEEN 1 AND 55
   AND (CAST(json_extract(private_builds.payload,'$.at') AS INTEGER)<excluded.updated_at
    OR (CAST(json_extract(private_builds.payload,'$.at') AS INTEGER)=excluded.updated_at
      AND private_builds.payload=excluded.payload))
  ) ELSE 0 END`)
  .bind(owner,id,payload,item.at).run();
 if(!result.meta?.changes){
  const row=await env.DB.prepare('SELECT payload,deleted_at FROM private_builds WHERE owner_hash=? AND build_id=?').bind(owner,id).first();
  let sameRevision=false,unavailable=false;
  try{
   const stored=JSON.parse(row?.payload||'{}');
   unavailable=!validPrivateBuildEntry(stored,id);
   sameRevision=!unavailable&&stored.at===item.at;
  }catch{unavailable=true}
  return json(row?.deleted_at!=null?
   {error:'Билд уже удалён',reason:'deleted'}:
   unavailable?
   {error:'Исходная облачная запись повреждена. Сохраните отдельную копию.',reason:'unavailable'}:
   sameRevision?
   {error:'В облаке другая редакция с таким же временем сохранения',reason:'conflict'}:
   {error:'В облаке сохранена более новая версия',reason:'stale'},409);
 }
 return json({ok:true,revision:item.at});
}
// Read only allowlisted public game JSON; no admin credentials or arbitrary URLs.
const GAME_DATA_HOSTS=Object.freeze(['https://pandorasaga-os.com','https://www.pandorasaga-os.com']);
async function readCurrentGameFile(file){
 const attempts=[];
 for(const host of GAME_DATA_HOSTS){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  let stage='fetch';
  try{
   const response=await fetch(host+'/gamedata/'+file,{
    signal:controller.signal,headers:{accept:'application/json'},redirect:'manual'
   });
   if(!response.ok){
    attempts.push({host:new URL(host).hostname,code:'http-'+response.status});
    continue;
   }
   stage='response-body';
   // Do not buffer an untrusted upstream response before enforcing its
   // limit. 3 UTF-8 bytes per UTF-16 code unit cover the original 1.25M
   // character ceiling, including Cyrillic and astral characters.
   const upstream=await boundedTextBody(response,3750000,1250000);
   if(upstream.tooLarge){
    attempts.push({host:new URL(host).hostname,code:'too-large'});
    continue;
   }
   if(typeof upstream.raw!=='string'){
    attempts.push({host:new URL(host).hostname,
     code:controller.signal.aborted?'timeout':'invalid-body'});
    continue;
   }
   const raw=upstream.raw;
   let data;
   try{data=JSON.parse(raw)}
   catch{attempts.push({host:new URL(host).hostname,code:'invalid-json'});continue}
   // All datasets except instances.json are JSON records. Instances is
   // deliberately a JSON array of dungeon objects in the official source.
   const array=Array.isArray(data);
   const valid=data&&typeof data==='object'&&
    (file==='instances.json'
      ?array&&data.every(row=>row&&typeof row==='object'&&!Array.isArray(row))
      :!array);
   if(!valid){
    attempts.push({host:new URL(host).hostname,code:'invalid-format'});
    continue;
   }
   return{ok:true,value:data,host:new URL(host).hostname};
  }catch(error){
   // No request headers, tokens, cookies, URLs from the caller or D1 values
   // are copied into the read-only diagnostic. Only safe error information.
   const clean=v=>String(v||'').replace(/[\r\n<>]/g,' ').slice(0,160);
   attempts.push({host:new URL(host).hostname,
    code:controller.signal.aborted?'timeout':'network',
    stage,name:clean(error?.name),message:clean(error?.message),
    cause:clean(error?.cause?.message)});
  }finally{clearTimeout(timer)}
 }
 return{ok:false,code:attempts.at(-1)?.code||'network',attempts};
}
// Public diagnostics return statuses only. The fixed full check runs at most
// once per five minutes per isolate, with only three upstream requests in flight.
const GAME_DATA_SETS=Object.freeze(['meta','classes','skills','items','souls','monsters',
 'drops','maps','instances','racialPassives','itemForth','unison','trades',
 'tables','expertise','chests','strings.en']);
let deepSourceCache=null,deepSourceUntil=0;
async function probeAllGameData(){
 const failures=[];
 let next=0,checked=0;
 await Promise.all(Array.from({length:3},async()=>{
  while(next<GAME_DATA_SETS.length){
   const name=GAME_DATA_SETS[next++];
   const result=await readCurrentGameFile(name+'.json');
   checked++;
   if(!result.ok)failures.push({name,code:result.code});
  }
 }));
 return{status:failures.length?'unavailable':'ok',
  checked,failures,source:'game-site',checkedAt:Date.now()};
}
// One fixed public probe, cached per isolate, to diagnose Worker egress.
let sourceProbeCache=null,sourceProbeUntil=0;
async function handle(request,env){const url=new URL(request.url),path=url.pathname;const method=request.method;const ip=request.headers.get('CF-Connecting-IP')||'unknown';
// Regular player views read D1 or bundled data. Only an authenticated admin may explicitly check the allowlisted external game-data source.
 if(!env.DB)return no('Database not configured',503);
 if(path.startsWith('/api/account/')){
  const rows=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_accounts','user_sessions','user_registration_limits')").all();
  if((rows.results||[]).length!==3)return no('Аккаунты ещё не активированы в D1: требуется миграция 0005',503);
  return accountApi(request,env,path,{ip,throttle,recordFailed,clearFailed});
 }
 if(path==='/api/library/legacy-preview')return legacyBuildPreview(request,env);
 if(path==='/api/library')return libraryApi(request,env);
 if(path==='/api/shared'||/^\/api\/shared\/[A-Za-z0-9_-]{11}$/.test(path))return shareApi(request,env,path,ip);
if(method==='GET'&&/^\/api\/catalog\/(meta|classes|skills|items|souls|monsters|drops|maps|instances|racialPassives|itemForth|unison|trades|tradeMeta|legacyLocale|tables|expertise|chests|stringsEn)\.json$/.test(path))return serveCatalog(env,path.split('/').pop().replace('.json',''));
// Restricted authenticated data refresh endpoint: fixed source host and 17 known names.
// A preview does NOT change D1. The owner must explicitly confirm version publication.
if(path==='/api/admin/catalog/github-status'&&method==='GET'){
 if(!await auth(request,env))return no('Unauthorized',401);
 return json({configured:githubCatalogEnabled(env)});
}
if(path==='/api/admin/catalog/github-pr'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 if(!githubCatalogEnabled(env))return no('GitHub integration not configured',503);
 const data=await body(request);
 if(!data||typeof data.expectedActive!=='string'||
    !/^[a-z0-9-]{8,64}$/.test(data.expectedActive))
  return no('Expected published snapshot required',400);
 const active=await activeCatalog(env);
 if(!active||active.snapshot!==data.expectedActive)
  return no('Published snapshot changed. Reload catalog.',409);
 try{
  const result=await createCatalogPullRequest(env,active,
   async()=> (await activeCatalog(env))?.snapshot||null);
  return json(result);
 }catch(error){
  // Never log GitHub secrets or expose arbitrary remote response payloads.
  return no(String(error.message||'Cannot create GitHub PR').slice(0,210),
   [409,502,503].includes(error.status)?error.status:502);
 }
}
if(path==='/api/admin/catalog/owner-review'&&method==='GET'){
 if(!await auth(request,env))return no('Unauthorized',401);
 try{return json(await previewOwnerOverrides(env))}
 catch(error){return no(String(error.message||'Cannot review owner edits').slice(0,190),
  error.status===409?409:502)}
}
if(path==='/api/admin/catalog/owner-pr'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 const data=await body(request);
 if(!data||typeof data.expectedFingerprint!=='string'||
  !/^[a-f0-9]{16}$/.test(data.expectedFingerprint))
  return no('Reviewed fingerprint required',400);
 try{return json(await createOwnerOverridesPullRequest(env,data.expectedFingerprint))}
 catch(error){return no(String(error.message||'Cannot export owner edits').slice(0,190),
  [409,502,503].includes(error.status)?error.status:502)}
}
// This fixed metadata probe runs from the production Worker, unlike
// GitHub Actions or a browser. It never reads or changes D1 records.
if(path==='/api/source-health'&&method==='GET'){
 const now=Date.now();
 if(url.searchParams.get('scope')==='all'){
  if(!deepSourceCache||now>=deepSourceUntil){
   deepSourceCache=await probeAllGameData();
   deepSourceUntil=Date.now()+300000;
  }
  return json(deepSourceCache,deepSourceCache.status==='ok'?200:503,
   {'cache-control':'public, max-age=240'});
 }
 if(!sourceProbeCache||now>=sourceProbeUntil){
  const probe=await readCurrentGameFile('meta.json');
  sourceProbeCache=probe.ok
   ?{status:'ok',source:'game-site',checkedAt:now}
   :{status:'unavailable',code:probe.code,attempts:probe.attempts,checkedAt:now};
  sourceProbeUntil=now+120000;
 }
 return json(sourceProbeCache,sourceProbeCache.status==='ok'?200:503,
  {'cache-control':'public, max-age=90'});
}
// Only allowlisted game-data paths can reach the external source.
if(method==='GET'&&path.startsWith('/api/admin/catalog/source/')){
 if(!await auth(request,env))return no('Unauthorized',401);
 const file=path.slice('/api/admin/catalog/source/'.length);
 const names=new Set(['meta','classes','skills','items','souls','monsters','drops','maps','instances',
 'racialPassives','itemForth','unison','trades','tables','expertise','chests','strings.en']);
 if(!/^[A-Za-z.]+\.json$/.test(file)||!names.has(file.slice(0,-5)))return no('Unknown source dataset',404);
 const result=await readCurrentGameFile(file);
 if(result.ok)return json(result.value,200,{'cache-control':'no-store'});
 return json({error:'Game data source temporarily unavailable',
  code:result.code,sourceDataset:file,attempts:result.attempts},502);
}
if(method==='POST'&&path.startsWith('/api/admin/catalog/'))return adminCatalog(request,env,path);

if(path==='/api/runtime-capabilities'&&method==='GET')
 return json({codeRelease:'0.361.0',ownerEditors:[
  'itemedit','tradeedit','acquireedit','wikiedit','dropedit','chestedit','spawnedit',
   'virtual-town-wiki','bilingual-item-text','historical-map-wiki','owner-map-create','owner-map-sections','owner-monster-create','future-map-roster','owner-npc-create','admin-save-feedback','owner-record-delete','bilingual-wiki','guideedit','honor-lists','honor-extended-edit','wiki-label-edit'],
  githubOwnerExport:true,honorExtendedEditing:true,wikiLabelEditing:true,ownerOverrideCAS:true,ownerOverrideCASRequired:true,catalogPublishCASRequired:true,catalogProvenanceCors:true,adminD1WriteCheck:'catalog-and-overrides',catalogSourceFailover:true,sourceEgressProbe:true,sourceProbeDetail:true,sourceInstancesArray:true,sourceFullProbe:true,
  buildLibraryRequiresAccount:true,sharedPreviewRequiresAccount:true,
  legacyAccountImportPreview:true});
if(path==='/api/health'&&method==='GET'){
 const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('admins','sessions','overrides','login_attempts','shared_builds','shared_build_limits','shared_build_sources','private_builds','user_accounts','user_sessions','user_registration_limits')").all();
 const found=new Set((tables.results||[]).map(row=>row.name));
 const ready=['admins','sessions','overrides','login_attempts'].every(name=>found.has(name));
 const sharingReady=['shared_builds','shared_build_limits','shared_build_sources'].every(name=>found.has(name));
 const catalogPublished=Boolean(await activeCatalog(env));
 return json({status:ready?'ok':'setup_required',storage:'d1',tablesReady:ready,
  features:{sharing:sharingReady,catalog:catalogPublished,library:found.has('private_builds'),
   accounts:['user_accounts','user_sessions','user_registration_limits'].every(n=>found.has(n))}},ready?200:503);
}
if(path==='/api/overrides'&&method==='GET'){const records=await env.DB.prepare('SELECT key,value FROM overrides ORDER BY key').all();return json({values:Object.fromEntries((records.results||[]).filter(r=>!String(r.key).startsWith('__qa.')).map(r=>[r.key,r.value]))})}
if(path==='/api/admin/setup'&&method==='POST'){
 if(!env.ADMIN_SETUP_TOKEN||env.ADMIN_SETUP_TOKEN.length<32)return no('Secure setup not configured',503);
 const current=await env.DB.prepare('SELECT id FROM admins WHERE id=1').first();if(current)return no('Already initialized',409);
 const data=await body(request);if(!data||data.username!=='administrator'||typeof data.password!=='string'||data.password.length<12||data.password.length>256)return no('Invalid administrator credentials');
 if(!same(data.setupToken,env.ADMIN_SETUP_TOKEN))return no('Invalid setup credentials',403);
 const salt=b64(random(24)),hash=await passwordHash(data.password,salt);
 const created=await env.DB.prepare('INSERT OR IGNORE INTO admins(id,username,salt,password_hash) VALUES(1,?,?,?)').bind('administrator',salt,hash).run();
 if(created.meta?.changes!==1)return no('Already initialized',409);return json(await session(env),201)
}
if(path==='/api/admin/login'&&method==='POST'){
 if(await throttle(env,ip))return no('Too many attempts. Try again later.',429);
 const data=await body(request);const dummySalt='invalid-user-padding';const row=await env.DB.prepare('SELECT salt,password_hash FROM admins WHERE id=1 AND username=?').bind('administrator').first();const p=typeof data?.password==='string'?data.password:'';
 if(p.length>256)return no('Invalid credentials',401);
 const candidate=await passwordHash(p,row?.salt||dummySalt);
 if(data?.username!=='administrator'||!row||!same(candidate,row.password_hash)){await recordFailed(env,ip);return no('Invalid credentials',401)}
 await clearFailed(env,ip);return json(await session(env))
}
if(path==='/api/admin/logout'&&method==='POST'){const token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(token)).run();return json({ok:true})}
// Persistent owner overrides remain separate from the synchronized game catalog.
// Only listed item fields can be changed; no arbitrary serialized objects.
function validItemOwnerPatch(text){
 if(typeof text!=='string'||text.length>12000)return false;
 let obj;
 try{obj=JSON.parse(text)}catch{return false}
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return false;
 const allowed=new Set(['level','W','PEN','AC','atkspeed','range','soulslot',
  'name','nameEn','desc','descEn','kind','twoHanded','classes','effects','sourceNote']);
 const numbers=new Set(['level','W','PEN','AC','atkspeed','range','soulslot']);
 const plain=x=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
 const keys=Object.keys(obj);
 if(!keys.length||keys.some(k=>!allowed.has(k)))return false;
 for(const [key,value] of Object.entries(obj)){
  if(numbers.has(key)){
   if(value!==null&&(!Number.isFinite(value)||value<0||value>(key==='soulslot'?3:100000)||
     (key==='soulslot'&&!Number.isInteger(value))))return false;
  }else if(key==='name'||key==='nameEn'){
   if(typeof value!=='string'||!value.trim()||value.length>240)return false;
  }else if(key==='desc'||key==='descEn'){
   if(typeof value!=='string'||value.length>2000)return false;
  }else if(key==='kind'){
   const kinds=new Set('1H_SWORD 2H_SWORD 1H_AXE 2H_AXE 1H_BLUNT_WEAPON 2H_BLUNT_WEAPON POLE_ARM LANCE 1H_TRUMP_WEAPON 2H_TRUMP_WEAPON BOW CROSSBOW WAND STAFF HELMET TORSO CUISSES GLOVES BOOTS FOOT_SHIELD HORSE_SHIELD MANTLE RING AMULET BELT EARRING BRIDLE SADDLE STALL POTION TOY ETC RUNEGEM ARROW BOLT EGGMAKE_KIT MASTER_TALKEGG TALKEGG RECIPE BALM SOUL DECO_HELMET DECO_TORSO DECO_CUISSES DECO_GLOVES DECO_BOOTS DECO_MANTLE'.split(' '));
   if(!kinds.has(value))return false;
  }else if(key==='twoHanded'){
   if(typeof value!=='boolean')return false;
  }else if(key==='classes'){
   if(!plain(value)||Object.keys(value).length>28)return false;
   if(Object.entries(value).some(([k,v])=>!/^[A-Z_]{2,25}$/.test(k)||v!==1))return false;
  }else if(key==='sourceNote'){
   if(typeof value!=='string'||value.length>500)return false;
  }else if(key==='effects'){
   if(!Array.isArray(value)||value.length>32)return false;
   for(const effect of value){
    if(!plain(effect)||Object.keys(effect).some(k=>!['func','dir','exclusive','a','b'].includes(k))||
      !/^EP_[A-Z0-9_]{2,65}$/.test(effect.func)||
      !['TARGET','CASTER'].includes(effect.dir)||
      effect.exclusive!==null||
      !(effect.a===null||(Number.isFinite(effect.a)&&Math.abs(effect.a)<=100000))||
      !(effect.b===null||(Number.isFinite(effect.b)&&Math.abs(effect.b)<=100000)))return false;
   }
  }
 }
 return true;
}
function validTradeOwnerPatch(text,tradeId){
 if(typeof text!=='string'||text.length>6000)return false;
 let patch;try{patch=JSON.parse(text)}catch{return false}
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return false;
 if(Object.keys(patch).length===1&&patch.deleted===true)return true;
 if(Object.keys(patch).length!==1||!patch.recipe||typeof patch.recipe!=='object'||
  Array.isArray(patch.recipe))return false;
 const rec=patch.recipe;
 if(Object.keys(rec).some(k=>!['id','i','npc','mats','gold','honor','exp'].includes(k)))return false;
 const positive=n=>Number.isSafeInteger(n)&&n>0;
 const capped=(n,max=999999999)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 if(!positive(rec.id)||String(rec.id)!==tradeId||!positive(rec.i))return false;
 if(!Array.isArray(rec.npc)||!rec.npc.length||rec.npc.length>24||
  rec.npc.some(n=>!positive(n))||new Set(rec.npc).size!==rec.npc.length)return false;
 if(!Array.isArray(rec.mats)||rec.mats.length>20||
  new Set(rec.mats.map(row=>row?.i)).size!==rec.mats.length||
  rec.mats.some(row=>!row||typeof row!=='object'||Array.isArray(row)||
   Object.keys(row).some(k=>!['i','n'].includes(k))||
   !positive(row.i)||!capped(row.n,999999)||row.n===0))return false;
 return ['gold','honor','exp'].every(key=>capped(rec[key]));
}
// Server-side mirror of encyclopedia-only map sections. Never trust the browser.
const mapExtraNames=['npcs','loot','tags','sections','extraSections','roster'];
const ownerMonsterId=x=>/^owner-monster-[a-z0-9]{12,24}$/.test(String(x));
const ownerNpcId=x=>/^owner-npc-[a-f0-9]{16}$/.test(String(x));
const virtualNpcRef=x=>/^astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}$/.test(String(x))||ownerNpcId(x);
const monsterRef=x=>(Number.isSafeInteger(Number(x))&&Number(x)>0&&
 /^[1-9][0-9]{0,14}$/.test(String(x)))||ownerMonsterId(x);
const validMonsterRefs=(rows,max=120)=>Array.isArray(rows)&&rows.length<=max&&
 new Set(rows.map(String)).size===rows.length&&rows.every(monsterRef);
const validMapRoster=rows=>Array.isArray(rows)&&rows.length<=120&&
 new Set(rows.map(x=>x?.id)).size===rows.length&&rows.every(x=>
  x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>
   ['id','name','nameEn','level','monsterId','spawn'].includes(k))&&
  /^spawn-[a-z0-9-]{1,34}$/.test(x.id)&&
  typeof x.name==='string'&&x.name.trim()&&x.name.length<=120&&
  (x.nameEn==null||typeof x.nameEn==='string'&&x.nameEn.length<=120)&&
  Number.isInteger(x.level)&&x.level>=1&&x.level<=255&&
  (x.monsterId==null||monsterRef(x.monsterId))&&
  (x.spawn==null||['anywhere','boss-guard'].includes(x.spawn)));

function validMapExtra(key,value){
 const validIds=x=>Array.isArray(x)&&x.length<=120&&new Set(x.map(String)).size===x.length&&
  x.every(id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&/^[1-9][0-9]{0,14}$/.test(String(id)));
 const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const word=(x,max)=>typeof x==='string'&&x.trim()&&x.length<=max;
 if(key==='npcs')return Array.isArray(value)&&value.length<=120&&
  new Set(value.map(String)).size===value.length&&value.every(x=>
   /^[1-9][0-9]{0,14}$/.test(String(x))||virtualNpcRef(x));
 if(key==='loot')return validIds(value);
 if(key==='roster')return validMapRoster(value);
 if(key==='tags')return Array.isArray(value)&&value.length<=16&&value.every(x=>
  plain(x)&&Object.keys(x).length===2&&word(x.ru,70)&&word(x.en,70));
 if(key==='sections')return Array.isArray(value)&&value.length<=6&&new Set(value).size===value.length&&
  value.every(x=>['monsters','npcs','loot','tags','notes','custom'].includes(x));
 if(key==='extraSections')return Array.isArray(value)&&value.length<=12&&
  new Set(value.map(x=>x?.id)).size===value.length&&value.every(row=>
   plain(row)&&Object.keys(row).every(x=>
    ['id','titleRu','titleEn','kind','entries','textRu','textEn'].includes(x))&&
   /^section-[a-z0-9-]{1,34}$/.test(row.id)&&word(row.titleRu,100)&&word(row.titleEn,100)&&
   ['item','monster','npc','text'].includes(row.kind)&&
   (row.kind==='monster'?validMonsterRefs(row.entries||[],60):
    row.kind==='npc'?Array.isArray(row.entries)&&row.entries.length<=60&&
     new Set(row.entries.map(String)).size===row.entries.length&&row.entries.every(x=>
      /^[1-9][0-9]{0,14}$/.test(String(x))||virtualNpcRef(x)):
     validIds(row.entries||[]))&&
   (row.textRu==null||typeof row.textRu==='string'&&row.textRu.length<=1200)&&
   (row.textEn==null||typeof row.textEn==='string'&&row.textEn.length<=1200));
 return false;
}
function validWikiOwnerPatch(text,type){
 if(typeof text!=='string'||text.length>8000)return false;
 let data;try{data=JSON.parse(text)}catch{return false}
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 const fields={
  monster:['name','nameEn','desc','descEn','loot','level','life','ac','magicProtection','warding','str','vit','agi','dex','spi','int','resists'],
  map:['name','nameEn','desc','descEn','notesRu','notesEn','mobs',...mapExtraNames],
  npc:['name','nameEn','desc','descEn','maps','service','serviceEn','grid'],
  instance:['name','nameEn','blurb','blurbRu','mobs'],
  skill:['name','nameEn','desc','descEn','charLevel','mana','cast','cooldown','range','reqs','prereq','classes'],
  soul:['name','nameEn','desc','descEn','price','slots']
 };
 const keys=Object.keys(data),allowed=fields[type]||[];
 if(!keys.length||keys.some(k=>!allowed.includes(k)))return false;
 const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0&&
  /^[1-9][0-9]{0,14}$/.test(String(value));
 const checkIds=value=>Array.isArray(value)&&value.length<=1000&&
  new Set(value.map(String)).size===value.length&&value.every(validId);
 return keys.every(key=>{
  const v=data[key];
  if(['name','nameEn','desc','descEn','blurb','blurbRu','service','serviceEn','grid','notesRu','notesEn'].includes(key))
   return typeof v==='string'&&v.length<=2000&&
    (!['name','nameEn'].includes(key)||!!v.trim());
  if(key==='resists')return v&&typeof v==='object'&&!Array.isArray(v)&&
   Object.entries(v).every(([name,n])=>['physical','fire','cold','lightning','poison',
    'charm','magic','holy','dark'].includes(name)&&Number.isFinite(n)&&Math.abs(n)<=100);
  if(key==='reqs')return Array.isArray(v)&&v.length<=20&&
   new Set(v.map(x=>x?.branch)).size===v.length&&v.every(x=>
    x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===2&&
    /^[a-z][a-z0-9_-]{0,31}$/.test(x.branch)&&
    Number.isInteger(x.amount)&&x.amount>=0&&x.amount<=1000);
  if(key==='prereq')return v===null||validId(v);
  if(key==='classes')return v&&typeof v==='object'&&!Array.isArray(v)&&
   Object.keys(v).length<=28&&Object.entries(v).every(([k,n])=>
    /^[A-Z_]{2,25}$/.test(k)&&n===1);
  if(key==='mobs')return ['map','instance'].includes(type)?validMonsterRefs(v,1000):checkIds(v);
  if(key==='maps')return type==='npc'?Array.isArray(v)&&v.length<=1000&&
   new Set(v.map(String)).size===v.length&&v.every(x=>
    validId(x)||townMapKey.test(String(x))||String(x)==='1001004'):checkIds(v);
  if(type==='monster'&&key==='loot')return Array.isArray(v)&&v.length<=120&&checkIds(v);
  if(type==='map'&&mapExtraNames.includes(key))return validMapExtra(key,v);
  if(key==='slots')return Array.isArray(v)&&v.length<=12&&new Set(v).size===v.length&&
   v.every(x=>['weapon','shield','head','body','gloves','legs','feet','cloak',
    'ring','neck','belt','ear','accessory'].includes(x));
  return Number.isFinite(v)&&v>=0&&v<=1000000000;
 });
}
// Only administrator-owned Astir encyclopedia records use string IDs.
// These are D1 overrides, not fake numeric IDs in the synchronized OS catalog.
const townMapKey=/^(?:astir-(?:union|empire|kingdom)|el-beht|astir-underground|custom-[a-z0-9-]{6,42})$/;
const townNpcKey=/^(?:astir-npc-(?:union|empire|kingdom)-[a-z0-9-]{1,32}|owner-npc-[a-f0-9]{16})$/;
function validTownWikiPatch(text,type,id){
 if(typeof text!=='string'||text.length>8000||
  !(type==='map'?townMapKey.test(id):type==='npc'?townNpcKey.test(id):
   type==='monster'&&ownerMonsterId(id)))return false;
 let patch;try{patch=JSON.parse(text)}catch{return false}
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return false;
 const ownerMap=['el-beht','astir-underground'].includes(id)||id.startsWith('custom-');
 const allowed=type==='map'?['name','nameEn','desc','descEn','notesRu','notesEn',...mapExtraNames,'mobs']:
  type==='monster'?['name','nameEn','desc','descEn','loot','level','life','ac',
   'magicProtection','warding','str','vit','agi','dex','spi','int','resists']:
  ['name','nameEn','desc','descEn','service','serviceEn','grid','maps'];
 if(type==='monster'){
  if(typeof patch.name!=='string'||typeof patch.nameEn!=='string'||
   !patch.name.trim()||!patch.nameEn.trim()||
   patch.name.length>240||patch.nameEn.length>240)return false;
  return validWikiOwnerPatch(text,'monster')&&
   (patch.level==null||Number.isInteger(patch.level)&&patch.level>=1&&patch.level<=255);
 }
 const keys=Object.keys(patch);
 if(!keys.length||keys.some(k=>!allowed.includes(k)))return false;
 if(type==='npc'&&ownerNpcId(id)&&
  (typeof patch.name!=='string'||typeof patch.nameEn!=='string'||
   !patch.name.trim()||!patch.nameEn.trim()||
   !Array.isArray(patch.maps)||patch.maps.length!==1))return false;
 if(type==='map'&&id.startsWith('custom-')&&
  (typeof patch.name!=='string'||typeof patch.nameEn!=='string'||
   !patch.name.trim()||!patch.nameEn.trim()))return false;
 return keys.every(k=>mapExtraNames.includes(k)?validMapExtra(k,patch[k]):k==='maps'?
   Array.isArray(patch.maps)&&patch.maps.length===1&&
    (townMapKey.test(patch.maps[0])||patch.maps[0]==='1001004'):
   k==='mobs'?validMonsterRefs(patch.mobs):
   typeof patch[k]==='string'&&patch[k].length<=(k.startsWith('desc')||k.startsWith('notes')?2000:240)&&
    (!['name','nameEn'].includes(k)||!!patch[k].trim()));
}
// Server gate for admin-owned Hero Book / Honor prose and repeatable lists.
function validGuideEdit(text,key){
 if(typeof text!=='string'||text.length>8000)return false;
 let data;try{data=JSON.parse(text)}catch{return false}
 const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
 if(key==='honor.zones'||key==='honor.wars'){
  if(!Array.isArray(data)||data.length>40)return false;
  const seen=new Set();
  return data.every(row=>{
   if(!plain(row)||typeof row.id!=='string'||!/^[a-z][a-z0-9-]{0,35}$/.test(row.id)||
    seen.has(row.id))return false;
   seen.add(row.id);
   const allowed=key==='honor.zones'?['id','nameRu','nameEn','mapId']:['id','nameRu','nameEn'];
   return Object.keys(row).every(x=>allowed.includes(x))&&
    ['nameRu','nameEn'].every(x=>typeof row[x]==='string'&&
     row[x].trim()&&row[x].length<=140)&&
    (key==='honor.wars'||row.mapId==null||typeof row.mapId==='string'&&
     (/^[0-9]{1,15}$/.test(row.mapId)||/^[a-z][a-z0-9-]{1,63}$/.test(row.mapId)));
  });
 }
 if(!plain(data))return false;
 if(key==='wiki.labels')return Object.keys(data).length>0&&
  Object.keys(data).length<=50&&Object.entries(data).every(([k,v])=>
   /^(?:chapter_(?:item|utility|monster|map|honor|npc|chest|instance|skill|soul)|honor_(?:overview|gain|ranks|monthly)|skill_filter_(?:player|racial|guild|special|variants|other|unknown|all))_(?:ru|en)$/.test(k)&&
   typeof v==='string'&&v.trim()&&v.length<=90&&
   Array.from(v).every(ch=>ch.charCodeAt(0)>=32));
 const allowed=key.startsWith('book.')?['ru','en','hintRu','hintEn']:
  key.startsWith('honor.rank.')?['nameRu','nameEn','benefitRu','benefitEn',
   'requirementRu','requirementEn']:
  ['overviewRu','overviewEn','gainRu','gainEn','lossRu','lossEn','currentRu',
   'currentEn','ranksRu','ranksEn','cloaksRu','cloaksEn',
   'honorRu','honorEn','totalRu','totalEn','joiningRu','joiningEn',
   'monthlyNoteRu','monthlyNoteEn'];
 const max=key==='honor.overview'?2200:key.startsWith('honor.rank.')?500:360;
 const entries=Object.entries(data);
 return entries.length>0&&entries.every(([field,value])=>allowed.includes(field)&&
  typeof value==='string'&&value.trim()&&value.length<=max);
}
function validWikiDropEdit(text){
 if(typeof text!=='string'||text.length>24000)return false;
 let data;try{data=JSON.parse(text)}catch{return false}
 if(!data||typeof data!=='object'||Array.isArray(data)||
  Object.keys(data).some(k=>!['d','s'].includes(k)))return false;
 return ['d','s'].every(k=>Array.isArray(data[k])&&data[k].length<=200&&
  data[k].every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&
   Number.isSafeInteger(r.i)&&r.i>0&&
   Object.keys(r).every(p=>['i','p','n','slotAdd','t','lo','hi','souls'].includes(p))&&
   (r.p==null||Number.isFinite(r.p)&&r.p>=0&&r.p<=100)&&
   (r.n==null||Number.isInteger(r.n)&&r.n>=1&&r.n<=999999)&&
   (r.slotAdd==null||Number.isInteger(r.slotAdd)&&r.slotAdd>=0&&r.slotAdd<=3)&&
   (r.t==null||typeof r.t==='string'&&r.t.length<=240)&&
  (r.lo==null||Number.isInteger(r.lo)&&r.lo>=0&&r.lo<=1000)&&
  (r.hi==null||Number.isInteger(r.hi)&&r.hi>=0&&r.hi<=1000)&&
  (r.souls==null||Array.isArray(r.souls)&&r.souls.length<=20&&
   r.souls.every(pair=>Array.isArray(pair)&&pair.length===2&&
    Number.isSafeInteger(pair[0])&&pair[0]>0&&
    Number.isFinite(pair[1])&&pair[1]>=0&&pair[1]<=100))));
}
function validWikiSpawns(text){
 if(typeof text!=='string'||text.length>6000)return false;
 let rows;try{rows=JSON.parse(text)}catch{return false}
 if(!Array.isArray(rows)||rows.length>120)return false;
 const ids=new Set();
 return rows.every(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row)||
   Object.keys(row).length!==2||!['map','instance'].includes(row.type)||
   typeof row.id!=='string'||!/^[1-9][0-9]{0,14}$/.test(row.id))return false;
  const k=row.type+':'+row.id;if(ids.has(k))return false;ids.add(k);return true;
 });
}
function validWikiChestEdit(text){
 if(typeof text!=='string'||text.length>24000)return false;
 let data;try{data=JSON.parse(text)}catch{return false}
 return Array.isArray(data)&&data.length<=50&&data.every(group=>
  Array.isArray(group)&&group.length<=100&&group.every(r=>
   r&&typeof r==='object'&&!Array.isArray(r)&&Number.isSafeInteger(r.i)&&r.i>0&&
   Object.keys(r).every(k=>['i','n','p','plus','soul'].includes(k))&&
   (r.n==null||Number.isInteger(r.n)&&r.n>=1&&r.n<=999999)&&
   (r.p==null||Number.isFinite(r.p)&&r.p>=0&&r.p<=100)&&
   (r.plus==null||Number.isInteger(r.plus)&&r.plus>=0&&r.plus<=20)&&
   (r.soul==null||Number.isInteger(r.soul)&&r.soul>=0&&r.soul<=3)));
}
function validAcquisitionOverride(text){
 if(typeof text!=='string'||text.length>1800)return false;
 let rows;try{rows=JSON.parse(text)}catch{return false}
 if(!Array.isArray(rows)||rows.length>24)return false;
 const seen=new Set();
 return rows.every(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row)||
   Object.keys(row).some(k=>!['type','id','p'].includes(k))||
   !['type','id'].every(k=>Object.hasOwn(row,k))||
   (row.p!=null&&(!Number.isFinite(row.p)||row.p<0||row.p>100||row.type!=='monster'))||
   !['monster','npc'].includes(row.type)||
   typeof row.id!=='string'||!/^[1-9][0-9]{0,14}$/.test(row.id))return false;
  const key=row.type+':'+row.id;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
if(path==='/api/admin/override'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 const data=await ownerEditBody(request);const key=data?.key,value=data?.value;
 if(typeof key!=='string'||!OWNER_EDITABLE_KEY_PATTERN.test(key)||typeof value!=='string'||!value.trim()||value.length>(key.startsWith('itemedit.')?12000:key.startsWith('acquireedit.')?1800:key.startsWith('tradeedit.')?6000:(key.startsWith('wikiedit.')||key.startsWith('guideedit.'))?8000:key.startsWith('spawnedit.')?6000:(key.startsWith('dropedit.')||key.startsWith('chestedit.'))?24000:(key.startsWith('skilldesc.')||key.startsWith('itemdesc.'))?2000:240))return no('Unsupported editable field');
 if(key.startsWith('itemedit.')&&!validItemOwnerPatch(value))return no('Invalid structured item edit',400);
 if(key.startsWith('acquireedit.')&&!validAcquisitionOverride(value))return no('Invalid acquisition relations',400);
 if(key.startsWith('tradeedit.')&&!validTradeOwnerPatch(value,key.slice(10)))return no('Invalid NPC trade relations',400);
 if(key.startsWith('guideedit.')&&!validGuideEdit(value,key.slice(10)))return no('Invalid guide edit',400);
 if(key.startsWith('wikiedit.')){
  const parts=key.split('.');
  const virtual=parts.length===3&&!/^[0-9]+$/.test(parts[2]);
  if(virtual?!validTownWikiPatch(value,parts[1],parts[2]):
   !validWikiOwnerPatch(value,parts[1]))
   return no('Invalid encyclopedia record edit',400);
 }
 if(key.startsWith('dropedit.')&&!validWikiDropEdit(value))return no('Invalid monster drop rows',400);
 if(key.startsWith('chestedit.')&&!validWikiChestEdit(value))return no('Invalid chest contents',400);
 if(key.startsWith('spawnedit.')&&!validWikiSpawns(value))return no('Invalid monster spawn assignments',400);
 if(key.startsWith('visual.')&&!/^(?:assets\/[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g)|https:\/\/pandorasaga-os\.com\/icons\/(?:items|souls|skills)\/[A-Za-z0-9_-]+\.webp(?:\?v=[0-9]{1,12})?)$/.test(value.trim()))return no('Unapproved image source',400);
 if(key.startsWith('itemslots.')&&!/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(value.trim()))return no('Invalid socket count (0-32)',400);
 // Refuse old cached admin clients: their unguarded writes can silently
 // overwrite another browser's edit. Refresh is necessary before retrying.
 if(!Object.hasOwn(data,'expectedValue'))
  return json({error:'Редактор устарел. Обновите страницу перед сохранением.',
   code:'OWNER_CLIENT_UPDATE_REQUIRED'},428);
 {
  const expected=data.expectedValue;
  if(expected!==null&&(typeof expected!=='string'||expected.length>24000))
   return no('Invalid edit precondition',400);
  const normalized=value.trim(),now=Date.now();
  const statement=expected===null?
   env.DB.prepare('INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO NOTHING')
    .bind(key,normalized,now):
   env.DB.prepare('UPDATE overrides SET value=?,updated_at=? WHERE key=? AND value=?')
    .bind(normalized,now,key,expected);
  const result=await statement.run();
  if(result.meta?.changes!==1)
   return json({error:'Edit changed in another session. Reload this entry and try again.',
    code:'OWNER_EDIT_CONFLICT'},409);
  return json({ok:true,key,value:normalized,conditional:true});
 }
}
if(path==='/api/admin/reset'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 const data=await ownerEditBody(request),key=data?.key;
 if(typeof key!=='string'||!OWNER_EDITABLE_KEY_PATTERN.test(key))return no('Unsupported editable field');
 if(!Object.hasOwn(data,'expectedValue'))
  return json({error:'Редактор устарел. Обновите страницу перед сохранением.',
   code:'OWNER_CLIENT_UPDATE_REQUIRED'},428);
 {
  const expected=data.expectedValue;
  if(typeof expected!=='string'||expected.length>24000)
   return no('Invalid reset precondition',400);
  const result=await env.DB.prepare('DELETE FROM overrides WHERE key=? AND value=?')
   .bind(key,expected).run();
  if(result.meta?.changes!==1)
   return json({error:'Edit changed in another session. Reload this entry and try again.',
    code:'OWNER_EDIT_CONFLICT'},409);
  return json({ok:true,key,deleted:true,conditional:true});
 }
}
return no('Not found',404)
}
export default{async fetch(request,env){const cors=originHeaders(request);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});try{const result=await handle(request,env);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}catch(e){console.error('Request failed',e);const result=no('Server error',500);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}}};
