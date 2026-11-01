// Dedicated orchestration for Playwright scenarios with independent BrowserContexts.
// Keep deterministic task membership/order. Each test owns its context and network
// mocks; only separate contexts can run concurrently.
export async function runIndependentSmokes(cases,browser,base,{concurrency=3}={}){
 if(!Number.isInteger(concurrency)||concurrency<1)throw Error('Invalid smoke concurrency');
 const results=new Array(cases.length),failures=[];
 let next=0,failed=false;
 async function worker(){
  while(!failed){
   const index=next++;
   if(index>=cases.length)return;
   const [name,run]=cases[index],started=Date.now();
   try{
    await run(browser,base);
    results[index]={name,ms:Date.now()-started};
   }catch(error){
    failures.push(new Error('Browser scenario '+name+' failed: '+error.message,{cause:error}));
    failed=true;
   }
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,cases.length)},worker));
 if(failures.length)throw new AggregateError(failures,failures.length+' browser scenario(s) failed');
 return results;
}
