// Public D1 catalog: immutable snapshot payloads only, never builds or accounts.
// Caller MUST read catalog_current in D1 first (including on cache hits).
const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const SNAPSHOT=/^[a-z0-9-]{8,64}$/;
const DATASET=/^[A-Za-z][A-Za-z0-9]{1,30}$/;
const CACHE_FORMAT='v2';
const CACHE_TTL_SECONDS=86400;
// Deduplicate cold-cache loads inside one Worker isolate and one snapshot.
// Only a small, fixed set of public dataset routes can enter this map.
const inFlight=new Map();
// Outgoing HTTP must be no-store, or Workers Caching may bypass the
// Worker and its mandatory fresh D1 catalog_current read.
function nonCacheableResponse(response){
 if(!(response instanceof Response))return response;
 const outgoing=new Response(response.body,response);
 outgoing.headers.set('cache-control','no-store');
 return outgoing;
}
const validResponse=(response,snapshot)=>response?.status===200&&
 response.headers?.get('x-ps-catalog')==='d1'&&
 response.headers?.get('x-ps-catalog-snapshot')===snapshot;
export async function readPublishedCatalog({snapshot,dataset,cache,load,waitUntil}={}){
 if(typeof load!=='function')throw Error('A D1 catalog loader is required');
 if(!SNAPSHOT.test(snapshot||'')||!DATASET.test(dataset||'')||
  !cache||typeof cache.match!=='function'||typeof cache.put!=='function')
  return nonCacheableResponse(await load());
 // Include wire format version: a future Worker serializer can invalidate
 // all old cached representations without changing or touching D1 data.
 const key=new Request(API+'/__snapshot_catalog_cache/'+CACHE_FORMAT+'/'+snapshot+'/'+dataset);
 const name=key.url;
 const prior=inFlight.get(name);
 if(prior){
  const response=await prior;
  return nonCacheableResponse(response instanceof Response?response.clone():response);
 }
 try{
  const cached=await cache.match(key);
  if(validResponse(cached,snapshot))return nonCacheableResponse(cached);
 }catch{
  // Cache failures never block an authoritative D1 response.
 }
 let flight=inFlight.get(name);
 if(!flight){
  let stored=Promise.resolve();
  // Defer the loader to the next microtask so inFlight is registered
  // before any concurrent request begins fetching identical D1 rows.
  flight=Promise.resolve().then(load).then(async response=>{
   if(validResponse(response,snapshot)){
    try{
     const toCache=response.clone();
     toCache.headers.set('cache-control','public, max-age='+CACHE_TTL_SECONDS);
     stored=Promise.resolve().then(()=>cache.put(key,toCache)).catch(()=>{});
     if(typeof waitUntil==='function'){
      try{waitUntil(stored)}catch{await stored}
     }else await stored;
    }catch{
     // A failed cache operation never turns a valid D1 response into an error.
    }
   }
   return response;
  });
  inFlight.set(name,flight);
  // Keep the reusable response until Cache API storage finishes, even if
  // the first caller has already received its own clone.
  const clear=()=>{if(inFlight.get(name)===flight)inFlight.delete(name)};
  flight.then(()=>{void stored.then(clear,clear)},clear);
 }
 const response=await flight;
 return nonCacheableResponse(response instanceof Response?response.clone():response);
}
