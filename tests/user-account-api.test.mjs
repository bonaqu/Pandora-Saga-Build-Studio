import test from 'node:test';
import assert from 'node:assert/strict';
import {accountApi,principal} from '../worker/account.js';
import {createHash} from 'node:crypto';
const URL='https://ps-build-studio-cloud.bonaqu.workers.dev/api/account/';
const secret='b'.repeat(64),pw='correct horse battery 2026!';
const sha=value=>createHash('sha256').update(value).digest('base64url');
function database(){
 const users=new Map(),byName=new Map(),sessions=new Map(),registration=new Map();
 const db={
  users,byName,sessions,registration,
  prepare(sql){return{bind(...args){return{
   async first(){
    if(sql.startsWith('SELECT a.id,a.username,a.owner_hash FROM user_accounts')){
     const s=sessions.get(args[0]),u=users.get(s?.account_id);
     return s&&s.expires_at>args[1]&&u?{id:u.id,username:u.username,owner_hash:u.owner_hash}:null;
    }
    if(sql.startsWith('SELECT id,username,salt,password_hash,recovery_hash FROM user_accounts'))
     return byName.get(args[0])||null;
    if(sql.startsWith('SELECT salt,password_hash FROM user_accounts'))
     return users.get(args[0])||null;
    throw Error('Unexpected first '+sql);
   },
   async run(){
    if(sql.startsWith('INSERT INTO user_registration_limits')){
     const key=args[0]+':'+args[1],n=registration.get(key)||0;
     if(n>=5)return{meta:{changes:0}};
     registration.set(key,n+1);return{meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO user_accounts')){
     if(byName.has(args[1])||[...users.values()].some(x=>x.owner_hash===args[4]))
      throw Error('UNIQUE constraint failed: user_accounts.username');
     const u={id:args[0],username:args[1],salt:args[2],password_hash:args[3],
      owner_hash:args[4],recovery_hash:args[5]};
     users.set(u.id,u);byName.set(u.username,u);
     return{meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO user_sessions')){
     sessions.set(args[0],{account_id:args[1],expires_at:args[2]});
     return{meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE user_accounts SET salt=')){
     const u=users.get(args[sql.includes('recovery_hash')?3:2]);
     if(!u)throw Error('Unknown account');
     u.salt=args[0];u.password_hash=args[1];
     if(sql.includes('recovery_hash'))u.recovery_hash=args[2];
     return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM user_sessions WHERE account_id=? AND token_hash<>?')){
     for(const [k,v]of sessions)if(v.account_id===args[0]&&k!==args[1])sessions.delete(k);
     return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM user_sessions WHERE account_id=?')){
     for(const [k,v]of sessions)if(v.account_id===args[0])sessions.delete(k);
     return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM user_sessions WHERE token_hash=?')){
     sessions.delete(args[0]);return{meta:{changes:1}};
    }
    throw Error('Unexpected run '+sql);
   }
  }}}},
  async batch(batch){return Promise.all(batch.map(q=>q.run()))}
 };
 return db;
}
function make(kind,data,token){
 return new Request(URL+kind,{method:data===undefined?'GET':'POST',
  headers:{...(token?{Authorization:'Bearer '+token}:{}),Origin:'https://bonaqu.github.io',
   ...(data===undefined?{}:{'content-type':'application/json'})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})});
}
const rate={ip:'203.0.113.88',throttle:async()=>false,
 recordFailed:async()=>{},clearFailed:async()=>{}};
async function call(db,kind,data,token){
 const response=await accountApi(make(kind,data,token),{DB:db},'/api/account/'+kind,rate);
 return {status:response.status,data:await response.json()};
}
test('register binds the legacy saved library; case-insensitive username uniqueness and login',async()=>{
 const db=database();
 const r=await call(db,'register',{username:'Example_User',password:pw,legacyKey:secret});
 assert.equal(r.status,201);assert.equal(r.data.account.username,'example_user');
 assert.match(r.data.token,/^[A-Za-z0-9_-]{43}$/);
 assert.match(r.data.recoveryCode,/^[A-Za-z0-9_-]{43}$/);
 const u=db.byName.get('example_user');
 assert.equal(u.owner_hash,sha(secret),'Existing D1 builds and shares must keep exact same owner hash');
 assert.notEqual(u.password_hash,pw);
 assert.notEqual(u.recovery_hash,r.data.recoveryCode);
 const duplicate=await call(db,'register',{username:'EXAMPLE_user',password:pw});
 assert.equal(duplicate.status,409);
 const invalid=await call(db,'login',{username:'example_user',password:'wrong'});
 assert.equal(invalid.status,401);
 const login=await call(db,'login',{username:'EXAMPLE_user',password:pw});
 assert.equal(login.status,200);
 assert.equal((await principal(make('me',undefined,login.data.token),{DB:db})).owner_hash,sha(secret));
 assert.equal((await call(db,'me',undefined,login.data.token)).data.account.username,'example_user');
});
test('password change invalidates other sessions; recovery code restores access and rotates',async()=>{
 const db=database();
 const registered=(await call(db,'register',{username:'build_tester',password:pw})).data;
 const extra=(await call(db,'login',{username:'build_tester',password:pw})).data;
 const change=await call(db,'password',{currentPassword:pw,password:'Something stronger than my prior password!'},registered.token);
 assert.equal(change.status,200);
 assert.equal((await call(db,'me',undefined,extra.token)).status,401);
 assert.equal((await call(db,'login',{username:'build_tester',password:pw})).status,401);
 const recovered=await call(db,'recover',{username:'build_tester',
  password:'New private recovery password 2026',recoveryCode:registered.recoveryCode});
 assert.equal(recovered.status,200);
 assert.notEqual(recovered.data.recoveryCode,registered.recoveryCode);
 assert.equal((await call(db,'me',undefined,registered.token)).status,401);
 assert.equal((await call(db,'recover',{username:'build_tester',
  password:'Recovery again with old code 2026',recoveryCode:registered.recoveryCode})).status,401);
 assert.equal((await call(db,'logout',{},recovered.data.token)).status,200);
 assert.equal((await call(db,'me',undefined,recovered.data.token)).status,401);
});
test('registration has enforced daily IP cap, and malformed password is rejected early',async()=>{
 const db=database();
 const short=await call(db,'register',{username:'sample_user',password:'short'});
 assert.equal(short.status,400);
 for(let i=0;i<5;i++){
  const r=await call(db,'register',{username:'testplayer'+i,password:pw});
  assert.equal(r.status,201,'registration '+i);
 }
 const sixth=await call(db,'register',{username:'testplayerextra',password:pw});
 assert.equal(sixth.status,429);
});
