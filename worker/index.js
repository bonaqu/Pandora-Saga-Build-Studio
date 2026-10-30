// Cloudflare Worker backend for Pandora Saga Build Studio.
// Passwords and session hashes are NEVER stored in the Pages repository.
const ORIGIN='https://bonaqu.github.io';
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
function random(n=32){return crypto.getRandomValues(new Uint8Array(n))}
async function sha(bytes){return b64(await crypto.subtle.digest('SHA-256',typeof bytes==='string'?enc.encode(bytes):bytes))}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:120000,hash:'SHA-256'},key,256))}
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
async function handle(request,env){const url=new URL(request.url),path=url.pathname;const method=request.method;const ip=request.headers.get('CF-Connecting-IP')||'unknown';
if(!env.DB)return no('Database not configured',503);
if(path==='/api/health'&&method==='GET')return json({status:'ok',storage:'d1'});
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
 if(typeof key!=='string'||!/^(site\.(title|subtitle)|race\.[0-5]|job\.(?:[0-9]|1[0-9]|2[0-7])|branch\.(?:[0-9]|1[0-9]|2[0-4])|item\.[a-zA-Z0-9_.-]{1,70}|soul\.[a-zA-Z0-9_.-]{1,70}|skill\.\d{1,2}\.\d{1,3}|skilldesc\.\d{1,2}\.\d{1,3})$/.test(key)||typeof value!=='string'||!value.trim()||value.length>(key.startsWith('skilldesc.')?2000:240))return no('Unsupported editable field');
 await env.DB.prepare(`INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`).bind(key,value.trim(),Date.now()).run();return json({ok:true,key,value:value.trim()})
}
return no('Not found',404)
}
export default{async fetch(request,env){const cors=originHeaders(request);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});try{const result=await handle(request,env);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}catch(e){console.error('Request failed',e);const result=no('Server error',500);for(const[k,v]of Object.entries(cors))result.headers.set(k,v);return result}}};
