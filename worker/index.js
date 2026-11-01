import {accountApi,principal as accountPrincipal} from './account.js';
// Cloudflare Worker backend for Pandora Saga Build Studio.
// Passwords and session hashes are NEVER stored in the Pages repository.
// Native PBKDF2 in Cloudflare Workers supports at most 100,000 iterations.
// Both initial setup and subsequent login must use the same iteration count.
// Source: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
const ORIGIN='https://bonaqu.github.io';
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
function random(n=32){return crypto.getRandomValues(new Uint8Array(n))}
async function sha(bytes){return b64(await crypto.subtle.digest('SHA-256',typeof bytes==='string'?enc.encode(bytes):bytes))}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
function same(a,b){a=String(a||'');b=String(b||'');let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0}
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}})}
function originHeaders(request){const o=request.headers.get('Origin');return o===ORIGIN||o==='http://localhost:8788'?{'Access-Control-Allow-Origin':o,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Expose-Headers':'X-PS-Catalog-Snapshot','Vary':'Origin'}:{}}
function no(message,status=400){return json({error:message},status)}
async function body(request){try{if(Number(request.headers.get('content-length')||0)>8192)throw Error('Request too large');return await request.json()}catch{return null}}
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
 const length=Number(request.headers.get('content-length')||0);
 if(length>65000)return null;
 try{const raw=await request.text();if(raw.length>65000)return null;return JSON.parse(raw)}catch{return null}
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
  await env.DB.prepare('INSERT INTO catalog_current(id,snapshot,published_at,expected_counts) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot,published_at=excluded.published_at,expected_counts=excluded.expected_counts').bind(data.snapshot,Date.now(),JSON.stringify(counts)).run();
  return json({ok:true,active:data.snapshot,counts,costumeItems:costumes.c});
 }
 return no('Unknown catalog operation',404);
}


/* Public short links are bound to an existing private build and revoked on deletion. */
async function shareApi(request,env,path,ip){
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
  return json({schema:1,share:JSON.parse(row.payload)});
 }
 if(request.method!=='POST'||path!=='/api/shared')return no('Not found',404);
 const bearer=request.headers.get('authorization')||'';
 if(!/^Bearer (?:[a-f0-9]{64}|[A-Za-z0-9_-]{43})$/.test(bearer))
  return no('Доступ к созданию ссылки требует владельца билда',401);
 if(Number(request.headers.get('content-length')||0)>48000)return no('Payload too large',413);
 const input=await request.text();
 if(input.length>48000)return no('Payload too large',413);
 let payload;
 try{payload=JSON.parse(input)}catch{return no('Invalid share payload',400)}
 if(!payload||payload.schema!==1||payload.type!=='build'||!/^[a-f0-9]{32}$/.test(payload.buildId||''))
  return no('Можно поделиться только сохранённым билдом',400);
 const validate=entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&
  Number.isInteger(entry.race)&&entry.race>=0&&entry.race<=5&&
  Number.isInteger(entry.job)&&entry.job>=0&&entry.job<28&&
  Number.isInteger(entry.level)&&entry.level>=1&&entry.level<=55;
 const owner=/^Bearer [a-f0-9]{64}$/.test(bearer)?
  await sha(bearer.slice(7)):(await accountPrincipal(request,env))?.owner_hash;
 if(!owner)return no('Требуется вход в профиль',401);
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
async function libraryApi(request,env){
 const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='private_builds'").all();
 if(!(exists.results||[]).length){
  try{
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS private_builds (owner_hash TEXT NOT NULL, build_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER, PRIMARY KEY(owner_hash,build_id))').run();
   await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_private_builds_owner_time ON private_builds(owner_hash,updated_at DESC)').run();
  }catch{return no('Хранилище билдов не подготовлено',503)}
 }
 const bearer=request.headers.get('authorization')||'';
 const owner=/^Bearer [a-f0-9]{64}$/.test(bearer)?
  await sha(bearer.slice(7)):(await accountPrincipal(request,env))?.owner_hash;
 if(!owner)return no('Library key or account session required',401);
 if(request.method==='GET'){
  const rows=await env.DB.prepare('SELECT build_id,payload,deleted_at FROM private_builds WHERE owner_hash=? ORDER BY (deleted_at IS NOT NULL), updated_at DESC').bind(owner).all();
  return json({records:(rows.results||[]).map(r=>({id:r.build_id,deleted:r.deleted_at!==null,
   entry:r.deleted_at===null?JSON.parse(r.payload):null}))});
 }
 if(request.method!=='POST')return no('Method not allowed',405);
 if(Number(request.headers.get('content-length')||0)>45000)return no('Library entry too large',413);
 const raw=await request.text();if(raw.length>45000)return no('Library entry too large',413);
 let data;try{data=JSON.parse(raw)}catch{return no('Invalid JSON',400)}
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
 const result=await env.DB.prepare("INSERT INTO private_builds(owner_hash,build_id,payload,updated_at,deleted_at) VALUES(?,?,?,?,NULL) ON CONFLICT(owner_hash,build_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at WHERE private_builds.deleted_at IS NULL AND (CAST(json_extract(private_builds.payload,'$.at') AS INTEGER)<excluded.updated_at OR (CAST(json_extract(private_builds.payload,'$.at') AS INTEGER)=excluded.updated_at AND private_builds.payload=excluded.payload))")
  .bind(owner,id,payload,item.at).run();
 if(!result.meta?.changes){
  const row=await env.DB.prepare('SELECT payload,deleted_at FROM private_builds WHERE owner_hash=? AND build_id=?').bind(owner,id).first();
  let sameRevision=false;
  try{sameRevision=JSON.parse(row?.payload||'{}').at===item.at}catch{}
  return json(row?.deleted_at!=null?
   {error:'Билд уже удалён',reason:'deleted'}:
   sameRevision?
   {error:'В облаке другая редакция с таким же временем сохранения',reason:'conflict'}:
   {error:'В облаке сохранена более новая версия',reason:'stale'},409);
 }
 return json({ok:true,revision:item.at});
}
async function handle(request,env){const url=new URL(request.url),path=url.pathname;const method=request.method;const ip=request.headers.get('CF-Connecting-IP')||'unknown';
// No runtime calls to the third-party game server. All game data is read from our own D1.
 if(!env.DB)return no('Database not configured',503);
 if(path.startsWith('/api/account/')){
  const rows=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_accounts','user_sessions','user_registration_limits')").all();
  if((rows.results||[]).length!==3)return no('Аккаунты ещё не активированы в D1: требуется миграция 0005',503);
  return accountApi(request,env,path,{ip,throttle,recordFailed,clearFailed});
 }
 if(path==='/api/library')return libraryApi(request,env);
 if(path==='/api/shared'||/^\/api\/shared\/[A-Za-z0-9_-]{11}$/.test(path))return shareApi(request,env,path,ip);
if(method==='GET'&&/^\/api\/catalog\/(meta|classes|skills|items|souls|monsters|drops|maps|instances|racialPassives|itemForth|unison|trades|tradeMeta|legacyLocale|tables|expertise|chests|stringsEn)\.json$/.test(path))return serveCatalog(env,path.split('/').pop().replace('.json',''));
// Restricted authenticated data refresh endpoint: fixed source host and 17 known names.
// A preview does NOT change D1. The owner must explicitly confirm version publication.
if(method==='GET'&&path.startsWith('/api/admin/catalog/source/')){
 if(!await auth(request,env))return no('Unauthorized',401);
 const file=path.slice('/api/admin/catalog/source/'.length);
 const names=new Set(['meta','classes','skills','items','souls','monsters','drops','maps','instances',
 'racialPassives','itemForth','unison','trades','tables','expertise','chests','strings.en']);
 if(!/^[A-Za-z.]+\.json$/.test(file)||!names.has(file.slice(0,-5)))return no('Unknown source dataset',404);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch('https://pandorasaga-os.com/gamedata/'+file,{signal:controller.signal,headers:{accept:'application/json'},redirect:'error'});
  if(!response.ok)return no('Source unavailable: '+response.status,502);
  const raw=await response.text();
  if(raw.length>1250000)return no('Source exceeds safety size limit',502);
  const value=JSON.parse(raw);
  if(!value||typeof value!=='object')return no('Invalid source data',502);
  return json(value,200,{'cache-control':'no-store'});
 }catch(error){return no('Game data source temporarily unavailable',502)}
 finally{clearTimeout(timeout)}
}
if(method==='POST'&&path.startsWith('/api/admin/catalog/'))return adminCatalog(request,env,path);

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
if(path==='/api/overrides'&&method==='GET'){const records=await env.DB.prepare('SELECT key,value FROM overrides ORDER BY key').all();return json({values:Object.fromEntries((records.results||[]).map(r=>[r.key,r.value]))})}
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
if(path==='/api/admin/override'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 const data=await body(request);const key=data?.key,value=data?.value;
 if(typeof key!=='string'||!/^(site\.(title|subtitle)|race\.[0-5]|job\.(?:[0-9]|1[0-9]|2[0-7])|branch\.[a-zA-Z0-9_-]{1,32}|item\.[a-zA-Z0-9_.-]{1,70}|itemdesc\.[0-9]{1,15}|itemslots\.[0-9]{1,15}|soul\.[a-zA-Z0-9_.-]{1,70}|skill\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|skilldesc\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|visual\.(?:logo|race\.[0-5]\.[fm]|skill\.[A-Za-z0-9_.-]{1,40}|item\.[0-9]{1,15}|soul\.[0-9]{1,15}))$/.test(key)||typeof value!=='string'||!value.trim()||value.length>((key.startsWith('skilldesc.')||key.startsWith('itemdesc.'))?2000:240))return no('Unsupported editable field');
 if(key.startsWith('visual.')&&!/^(?:assets\/[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g)|https:\/\/pandorasaga-os\.com\/icons\/(?:items|souls|skills)\/[A-Za-z0-9_-]+\.webp(?:\?v=[0-9]{1,12})?)$/.test(value.trim()))return no('Unapproved image source',400);
 if(key.startsWith('itemslots.')&&!/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(value.trim()))return no('Invalid socket count (0-32)',400);
 await env.DB.prepare(`INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`).bind(key,value.trim(),Date.now()).run();return json({ok:true,key,value:value.trim()})
}
if(path==='/api/admin/reset'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 const data=await body(request),key=data?.key;
 if(typeof key!=='string'||!/^(site\.(title|subtitle)|race\.[0-5]|job\.(?:[0-9]|1[0-9]|2[0-7])|branch\.[a-zA-Z0-9_-]{1,32}|item\.[a-zA-Z0-9_.-]{1,70}|itemdesc\.[0-9]{1,15}|itemslots\.[0-9]{1,15}|soul\.[a-zA-Z0-9_.-]{1,70}|skill\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|skilldesc\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|visual\.(?:logo|race\.[0-5]\.[fm]|skill\.[A-Za-z0-9_.-]{1,40}|item\.[0-9]{1,15}|soul\.[0-9]{1,15}))$/.test(key))return no('Unsupported editable field');
 const result=await env.DB.prepare('DELETE FROM overrides WHERE key=?').bind(key).run();
 return json({ok:true,key,deleted:(result.meta?.changes||0)>0});
}
return no('Not found',404)
}
export default{async fetch(request,env){const cors=originHeaders(request);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});try{const result=await handle(request,env);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}catch(e){console.error('Request failed',e);const result=no('Server error',500);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}}};
