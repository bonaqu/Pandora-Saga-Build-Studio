// Adapter for historical integration tests whose mocked D1 drivers only
// understood the pre-CAS INSERT/DELETE SQL. The production app is tested
// independently in owner-client-cas-preconditions.test.mjs, and the real
// compare-and-set SQL semantics in d1-owner-override-cas.test.mjs.
const states=new WeakMap();
function install(db){
 if(!db||typeof db.prepare!=='function')return {current:new Map(),last:new Map()};
 const cached=states.get(db);if(cached)return cached;
 const current=new Map(),last=new Map();
 const underlying=db.prepare.bind(db);
 const state={current,last};
 states.set(db,state);
 db.prepare=function(sql){
  if(sql.includes('ON CONFLICT(key) DO NOTHING')&&sql.startsWith('INSERT INTO overrides')){
   return{bind(key,value,stamp){return{async run(){
    if(current.has(key))return{meta:{changes:0}};
    const result=await underlying('INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?)')
     .bind(key,value,stamp).run();
    if(result.meta?.changes!==0){current.set(key,value);last.set(key,value)}
    return result;
   }}}};
  }
  if(sql.startsWith('UPDATE overrides SET value=')){
   return{bind(value,stamp,key,expected){return{async run(){
    if(!current.has(key)||current.get(key)!==expected)return{meta:{changes:0}};
    const result=await underlying('INSERT INTO overrides(key,value,updated_at) VALUES(?,?,?)')
     .bind(key,value,stamp).run();
    if(result.meta?.changes!==0){current.set(key,value);last.set(key,value)}
    return result;
   }}}};
  }
  if(sql.startsWith('DELETE FROM overrides WHERE key=? AND value=?')){
   return{bind(key,expected){return{async run(){
    if(!current.has(key)||current.get(key)!==expected)return{meta:{changes:0}};
    const result=await underlying('DELETE FROM overrides WHERE key=?').bind(key).run();
    if(result.meta?.changes!==0){current.delete(key);last.set(key,expected)}
    return result;
   }}}};
  }
  return underlying(sql);
 };
 return state;
}
export function withOwnerCasTestClient(productionWorker){
 return{async fetch(request,env){
  const state=install(env?.DB);
  const path=new URL(request.url).pathname;
  if(request.method==='POST'&&
   (path==='/api/admin/override'||path==='/api/admin/reset')){
   const original=await request.clone().json().catch(()=>null);
   if(original&&typeof original==='object'&&
    !Object.hasOwn(original,'expectedValue')&&typeof original.key==='string'){
    const key=original.key;
    const expectedValue=state.current.has(key)?state.current.get(key):
     path==='/api/admin/reset'?(state.last.get(key)||'') :null;
    const headers=new Headers(request.headers);headers.delete('content-length');
    request=new Request(request.url,{method:'POST',headers,
     body:JSON.stringify({...original,expectedValue})});
   }
  }
  return productionWorker.fetch(request,env);
 }};
}
