// Bounded read-only retry for transient published D1 catalog GET failures.
// Does not retry authorization, missing records, malformed JSON or bad source
// headers. Those are contract errors, not network availability problems.
const TRANSIENT_STATUS=new Set([408,429,500,502,503,504]);
const defaultPause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function readPublishedCatalog(url,{
 fetchImpl=globalThis.fetch,pause=defaultPause,origin='https://bonaqu.github.io',
 maxAttempts=3,timeoutMs=12000
}={}){
 if(typeof url!=='string'||!url.startsWith('https://')||
  !Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>3||
  !Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000||
  typeof fetchImpl!=='function'||typeof pause!=='function')
  throw Error('Invalid read-only catalog retry options');
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  try{
   const response=await fetchImpl(url,{
    method:'GET',headers:{Origin:origin},cache:'no-store',
    signal:AbortSignal.timeout(timeoutMs)
   });
   // Only transient HTTP statuses are retried; 401, 403 and 404 are
   // returned immediately and remain blocking failures in the caller.
   if(response.ok||!TRANSIENT_STATUS.has(response.status)||attempt===maxAttempts){
    const payload=await response.json().catch(()=>null);
    return {response,payload,attempts:attempt};
   }
  }catch(error){
   if(attempt===maxAttempts)throw error;
  }
  await pause(attempt*350);
 }
 throw Error('Unexpected catalog retry state');
}
