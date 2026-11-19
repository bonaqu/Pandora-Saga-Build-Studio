// Public catalog responses can be cached only after a fresh D1 pointer read.
// Never read this cache when D1 is unavailable: online-only must fail closed.
// Keys include the immutable published snapshot, not visitor-supplied input.
const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const SNAPSHOT=/^[a-z0-9-]{8,64}$/;
const DATASET=/^[A-Za-z][A-Za-z0-9]{1,30}$/;
export async function readPublishedCatalog({snapshot,dataset,cache,load,waitUntil}={}){
 if(typeof load!=='function')throw Error('A D1 catalog loader is required');
 if(!SNAPSHOT.test(snapshot||'')||!DATASET.test(dataset||'')||
  !cache||typeof cache.match!=='function'||typeof cache.put!=='function')
  return load();
 const key=new Request(API+'/__snapshot_catalog_cache/'+snapshot+'/'+dataset,{method:'GET'});
 try{
  const cached=await cache.match(key);
  if(cached?.status===200&&cached.headers?.get('x-ps-catalog')==='d1'&&
   cached.headers?.get('x-ps-catalog-snapshot')===snapshot)
   return cached;
 }catch{
  // Cache is advisory. A failed lookup must never block a healthy D1 read.
 }
 const response=await load();
 if(response?.status===200&&response.headers?.get('x-ps-catalog')==='d1'&&
  response.headers?.get('x-ps-catalog-snapshot')===snapshot){
  try{
   const write=Promise.resolve().then(()=>cache.put(key,response.clone())).catch(()=>{});
   if(typeof waitUntil==='function')waitUntil(write);
   else await write;
  }catch{
   // Caching failure is never a reason to fail a valid D1 response.
  }
 }
 return response;
}
