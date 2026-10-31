import {readFileSync} from 'node:fs';
const expected=JSON.parse(readFileSync(new URL('../site-version.json',import.meta.url),'utf8')).release;
const site='https://bonaqu.github.io/Pandora-Saga-Build-Studio/site-version.json';
const max=24;
for(let i=1;i<=max;i++){
 let current='unavailable';
 try{
  const response=await fetch(site+'?diagnostic='+Date.now(),{
   cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(response.ok){
   const content=await response.json();
   current=content?.release||'missing-release';
   if(current===expected){
    console.log('Published Pages release verified: '+expected);
    process.exit(0);
   }
  }else current='HTTP '+response.status;
 }catch(error){current=error.message}
 if(i===max){
  console.error('Public Pages did not reach release '+expected+
   '; observed '+current+' after '+max+' attempts');
  process.exitCode=1;break;
 }
 console.log('Awaiting Pages '+expected+'; currently '+current+
  ' (check '+i+'/'+max+')');
 await new Promise(resolve=>setTimeout(resolve,5000));
}
