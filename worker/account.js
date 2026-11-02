// Account access for private D1 libraries; no paid email/SMS dependency.
// Username and password validation stay on the server; the UI mirrors them only for feedback.
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const random=(n=32)=>crypto.getRandomValues(new Uint8Array(n));
const sha=async value=>b64(await crypto.subtle.digest('SHA-256',enc.encode(value)));
const same=(a,b)=>{
 const x=enc.encode(String(a||'')),y=enc.encode(String(b||''));
 let mismatch=x.length^y.length;
 for(let i=0;i<Math.max(x.length,y.length);i++)mismatch|=(x[i]||0)^(y[i]||0);
 return mismatch===0;
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff'}
});
const error=(message,status=400)=>json({error:message},status);
export function normalizeUsername(value){
 if(typeof value!=='string')return null;
 const username=value.toLowerCase();
 return /^[a-z][a-z0-9_]{2,19}$/.test(username)&&
  !['admin','administrator','support','system','root','moderator'].includes(username)?
  username:null;
}
export function validPassword(value,username=''){
 if(typeof value!=='string')return false;
 const count=[...value].length;
 if(count<8||count>128||enc.encode(value).length>512)return false;
 // Keep trivial repetitions and obvious keyboard/number sequences blocked even
 // after reducing the minimum length from fifteen characters to eight.
 if(/^(.)\\1{7,}$/u.test(value)||/(?:12345678|87654321|qwertyui|asdfghjk)/i.test(value))return false;
 const weak=['password123456789','123456789012345','qwertyuiopasdfg',
  'pandorasaga12345','letmein123456789'];
 return !weak.includes(value.toLowerCase())&&value.toLowerCase()!==username.toLowerCase();
}
async function hashPassword(value,salt){
 const key=await crypto.subtle.importKey('raw',enc.encode(value),'PBKDF2',false,['deriveBits']);
 return b64(await crypto.subtle.deriveBits({
  name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'
 },key,256));
}
const SESSION=/^[A-Za-z0-9_-]{43}$/;
const RECOVERY=/^[A-Za-z0-9_-]{43}$/;
export async function principal(request,env){
 const token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!SESSION.test(token))return null;
 const row=await env.DB.prepare(
  'SELECT a.id,a.username,a.owner_hash FROM user_accounts AS a JOIN user_sessions AS s ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?'
 ).bind(await sha(token),Date.now()).first();
 return row||null;
}
async function newSession(db,id){
 const token=b64(random()),expires=Date.now()+7*86400000;
 await db.prepare('INSERT INTO user_sessions(token_hash,account_id,expires_at) VALUES(?,?,?)')
  .bind(await sha(token),id,expires).run();
 return {token,expires};
}
const KINDS=new Set(['register','login','me','logout','password','recover']);
export async function accountApi(request,env,path,{ip='unknown',throttle,recordFailed,clearFailed}={}){
 const kind=path.slice('/api/account/'.length);
 if(!KINDS.has(kind))return error('Not found',404);
 const db=env.DB;
 let data=null;
 if(request.method==='POST'){
  const bytes=Number(request.headers.get('content-length')||0);
  if(bytes>4096)return error('Request too large',413);
  try{const raw=await request.text();if(raw.length>4096)return error('Request too large',413);
   data=JSON.parse(raw);
  }catch{return error('Invalid request')}
  if(!data||typeof data!=='object'||Array.isArray(data))return error('Invalid request');
 }
 if(kind==='me'){
  if(request.method!=='GET')return error('Method not allowed',405);
  const user=await principal(request,env);
  return user?json({account:{username:user.username}}):error('Sign in required',401);
 }
 if(request.method!=='POST')return error('Method not allowed',405);
 if(kind==='logout'){
  const raw=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
  if(SESSION.test(raw))
   await db.prepare('DELETE FROM user_sessions WHERE token_hash=?').bind(await sha(raw)).run();
  return json({ok:true});
 }
 if(kind==='password'){
  const user=await principal(request,env);
  if(!user)return error('Sign in required',401);
  const row=await db.prepare('SELECT salt,password_hash FROM user_accounts WHERE id=?')
   .bind(user.id).first();
  if(!row||typeof data.currentPassword!=='string'||!validPassword(data.password,user.username))
   return error('Invalid password',400);
  const original=await hashPassword(data.currentPassword,row.salt);
  if(!same(original,row.password_hash))return error('Current password is incorrect',401);
  const salt=b64(random(24)),digest=await hashPassword(data.password,salt);
  await db.prepare('UPDATE user_accounts SET salt=?,password_hash=? WHERE id=?')
   .bind(salt,digest,user.id).run();
  const currentToken=(request.headers.get('authorization')||'').slice(7);
  await db.prepare('DELETE FROM user_sessions WHERE account_id=? AND token_hash<>?')
   .bind(user.id,await sha(currentToken)).run();
  return json({ok:true});
 }
 if(kind==='register'){
  if(await throttle(env,ip))return error('Too many requests. Try later.',429);
  const username=normalizeUsername(data.username);
  if(!username||!validPassword(data.password,username))
   return error('Use a 3–20 character Latin username and a password of 8–128 characters',400);
  const limit=await db.prepare(
   'INSERT INTO user_registration_limits(ip_hash,day,created) VALUES(?,?,1) ON CONFLICT(ip_hash,day) DO UPDATE SET created=created+1 WHERE created<5'
  ).bind(await sha(ip),Math.floor(Date.now()/86400000)).run();
  if(!limit.meta?.changes)return error('Registration limit reached',429);
  const id=b64(random(18));
  const legacyKey=/^[a-f0-9]{64}$/.test(data.legacyKey||'')?data.legacyKey:null;
  const owner=await sha(legacyKey||'account:'+b64(random()));
  const salt=b64(random(24)),digest=await hashPassword(data.password,salt);
  const recovery=b64(random()),recoveryHash=await sha(recovery);
  try{
   await db.prepare('INSERT INTO user_accounts(id,username,salt,password_hash,owner_hash,recovery_hash,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(id,username,salt,digest,owner,recoveryHash,Date.now()).run();
  }catch(e){
   if(String(e).includes('UNIQUE'))return error('This username or library is already registered',409);
   throw e;
  }
  return json({account:{username},...(await newSession(db,id)),recoveryCode:recovery},201);
 }
 if(await throttle(env,ip))return error('Too many requests. Try later.',429);
 const username=normalizeUsername(data.username);
 const row=username?await db.prepare(
  'SELECT id,username,salt,password_hash,recovery_hash FROM user_accounts WHERE username=?'
 ).bind(username).first():null;
 if(kind==='login'){
  const password=typeof data.password==='string'?data.password:'';
  if(password.length>128)return error('Invalid username or password',401);
  const digest=await hashPassword(password,row?.salt||'dummy-salt-do-not-match');
  if(!row||!same(digest,row.password_hash)){
   await recordFailed(env,ip);return error('Invalid username or password',401);
  }
  await clearFailed(env,ip);
  return json({account:{username:row.username},...(await newSession(db,row.id))});
 }
 if(kind==='recover'){
  const valid=typeof data.recoveryCode==='string'&&RECOVERY.test(data.recoveryCode);
  const passwordValid=validPassword(data.password,username||'');
  const candidate=valid?await sha(data.recoveryCode):'invalid-recovery';
  if(!row||!valid||!passwordValid||!same(candidate,row.recovery_hash)){
   await recordFailed(env,ip);
   return error('Invalid username, recovery code or password',401);
  }
  const salt=b64(random(24)),digest=await hashPassword(data.password,salt),
   recovery=b64(random());
  await db.batch([
   db.prepare('UPDATE user_accounts SET salt=?,password_hash=?,recovery_hash=? WHERE id=?')
    .bind(salt,digest,await sha(recovery),row.id),
   db.prepare('DELETE FROM user_sessions WHERE account_id=?').bind(row.id)
  ]);
  await clearFailed(env,ip);
  return json({account:{username:row.username},...(await newSession(db,row.id)),
   recoveryCode:recovery});
 }
 return error('Not found',404);
}
