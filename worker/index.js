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
function originHeaders(request){const o=request.headers.get('Origin');return o===ORIGIN||o==='http://localhost:8788'?{'Access-Control-Allow-Origin':o,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin'}:{}}
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
  Object.fromEntries(rows.map(r=>[r.record_key,JSON.parse(r.payload)]));
 if(dataset==='trades'){
  const extras=await env.DB.prepare("SELECT payload FROM catalog_entries WHERE snapshot=? AND dataset='tradeMeta' AND record_key='all'").bind(active.snapshot).first();
  const additional=extras?JSON.parse(extras.payload):{npcs:{},mapNames:{},limitMeta:{}};
  obj={trades:rows.map(r=>JSON.parse(r.payload)),...additional};
 }
 return json(obj,200,{'cache-control':'public, max-age=60','x-ps-catalog':'d1'});
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

async function handle(request,env){const url=new URL(request.url),path=url.pathname;const method=request.method;const ip=request.headers.get('CF-Connecting-IP')||'unknown';
// No runtime calls to the third-party game server. All game data is read from our own D1.
if(!env.DB)return no('Database not configured',503);
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

if(path==='/api/health'&&method==='GET'){const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('admins','sessions','overrides','login_attempts')").all();const ready=(tables.results||[]).length===4;return json({status:ready?'ok':'setup_required',storage:'d1',tablesReady:ready},ready?200:503)}
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
 if(typeof key!=='string'||!/^(site\.(title|subtitle)|race\.[0-5]|job\.(?:[0-9]|1[0-9]|2[0-7])|branch\.[a-zA-Z0-9_-]{1,32}|item\.[a-zA-Z0-9_.-]{1,70}|soul\.[a-zA-Z0-9_.-]{1,70}|skill\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|skilldesc\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|visual\.(?:logo|race\.[0-5]\.[fm]|skill\.[A-Za-z0-9_.-]{1,40}|item\.[0-9]{1,15}|soul\.[0-9]{1,15}))$/.test(key)||typeof value!=='string'||!value.trim()||value.length>(key.startsWith('skilldesc.')?2000:240))return no('Unsupported editable field');
 if(key.startsWith('visual.')&&!/^(?:assets\/[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g)|https:\/\/pandorasaga-os\.com\/icons\/(?:items|souls|skills)\/[A-Za-z0-9_-]+\.webp(?:\?v=[0-9]{1,12})?)$/.test(value.trim()))return no('Unapproved image source',400);
 await env.DB.prepare(`INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`).bind(key,value.trim(),Date.now()).run();return json({ok:true,key,value:value.trim()})
}
if(path==='/api/admin/reset'&&method==='POST'){
 if(!await auth(request,env))return no('Unauthorized',401);
 const data=await body(request),key=data?.key;
 if(typeof key!=='string'||!/^(site\.(title|subtitle)|race\.[0-5]|job\.(?:[0-9]|1[0-9]|2[0-7])|branch\.[a-zA-Z0-9_-]{1,32}|item\.[a-zA-Z0-9_.-]{1,70}|soul\.[a-zA-Z0-9_.-]{1,70}|skill\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|skilldesc\.[a-zA-Z0-9_-]{1,32}\.\d{1,12}|visual\.(?:logo|race\.[0-5]\.[fm]|skill\.[A-Za-z0-9_.-]{1,40}|item\.[0-9]{1,15}|soul\.[0-9]{1,15}))$/.test(key))return no('Unsupported editable field');
 const result=await env.DB.prepare('DELETE FROM overrides WHERE key=?').bind(key).run();
 return json({ok:true,key,deleted:(result.meta?.changes||0)>0});
}
return no('Not found',404)
}
export default{async fetch(request,env){const cors=originHeaders(request);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});try{const result=await handle(request,env);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}catch(e){console.error('Request failed',e);const result=no('Server error',500);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}}};
