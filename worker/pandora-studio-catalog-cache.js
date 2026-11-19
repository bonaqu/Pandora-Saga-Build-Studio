// Cache only public D1 catalog data. Every client request must first read
// catalog_current from D1, including a cache hit, otherwise variant B would
// unintentionally serve archived data during an outage or snapshot change.
const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const SNAPSHOT=/^[a-z0-9-]{8,64}$/;
const DATASET=/^[A-Za-z][A-Za-z0-9]{1,30}$/;
// Cloudflare can cache a Worker's outgoing HTTP response before executing the
// Worker on a later request. Always return no-store to clients; only the
// internal, synthetic Cache API entry is public/max-age=3600.
function nonCacheableResponse(response){
 if(!(response instanceof Response))return response;
 const outgoing=new Response(response.body,response);
 outgoing.headers.set('cache-control','no-store');
 return outgoing;
}
export async function readPublishedCatalog({snapshot,dataset,cache,load,waitUntil}={}){
 if(typeof load!=='function')throw Error('A D1 catalog loader is required');
 if(!SNAPSHOT.test(snapshot||'')||!DATASET.test(dataset||'')||
  !cache||typeof cache.match!=='function'||typeof cache.put!=='function')
  return nonCacheableResponse(await load());
 const key=new Request(API+'/__snapshot_catalog_cache/'+snapshot+'/'+dataset,{method:'GET'});
 try{
  const cached=await cache.match(key);
  if(cached?.status===200&&cached.headers?.get('x-ps-catalog')==='d1'&&
   cached.headers?.get('x-ps-catalog-snapshot')===snapshot)
   return nonCacheableResponse(cached);
 }catch{
  // Cache is advisory. A failed lookup must never block a healthy D1 read.
 }
 const response=await load();
 if(response?.status===200&&response.headers?.get('x-ps-catalog')==='d1'&&
  response.headers?.get('x-ps-catalog-snapshot')===snapshot){
  try{
   const toCache=response.clone();
   toCache.headers.set('cache-control','public, max-age=3600');
   const write=Promise.resolve().then(()=>cache.put(key,toCache)).catch(()=>{});
   if(typeof waitUntil==='function')waitUntil(write);
   else await write;
  }catch{
   // A cache.put failure must never invalidate a correctly sourced D1 result.
  }
 }
 return nonCacheableResponse(response);
}
