#!/usr/bin/env node
// Exact source screenshot mirror; no fabricated images or player-facing links.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const output=new URL('../assets/wiki/honor-victories.jpg',import.meta.url);
const original='https://pandorasaga-os.com/uploads/images/f4be126de5ed488981aeeb2298255095.jpg';
const genuineJPEG=data=>data?.length>500&&data.length<=10_000_000&&
 data[0]===0xff&&data[1]===0xd8&&
 data[data.length-2]===0xff&&data[data.length-1]===0xd9;
let recovered=false;
try{recovered=genuineJPEG(await readFile(output))}
catch(error){if(error.code!=='ENOENT')throw error}
if(recovered)console.log('Original PvP screenshot already mirrored');
else try{
 const response=await fetch(original,{redirect:'error',
  signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const image=new Uint8Array(await response.arrayBuffer());
 if(!genuineJPEG(image))throw Error('Source is not a supported JPEG');
 await mkdir(new URL('../assets/wiki/',import.meta.url),{recursive:true});
 await writeFile(output,image);
 console.log('Mirrored the original PvP screenshot: '+image.length+' bytes');
}catch(error){
 console.warn('Exact original PvP screenshot unavailable: '+error.message);
}
