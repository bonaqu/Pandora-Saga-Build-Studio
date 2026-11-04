// Local-PC benchmark. All game data stays on this machine.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {runEncyclopediaPerformanceSmoke} from '../tests/browser-encyclopedia-performance.mjs';

const port=4189,base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['scripts/dev-server.mjs'],{
 cwd:fileURLToPath(new URL('../',import.meta.url)),
 env:{...process.env,PORT:String(port)},stdio:'ignore'
});
let browser;
try{
 let ready=false;
 for(let attempt=0;attempt<45;attempt++){
  if(server.exitCode!==null)throw Error('Local server exited unexpectedly');
  try{const response=await fetch(base+'/');if(response.ok){ready=true;break}}catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 if(!ready)throw Error('Local site server did not start on port '+port);
 browser=await chromium.launch({headless:true});
 await runEncyclopediaPerformanceSmoke(browser,base,{environment:'this computer (local browser)'});
}finally{
 if(browser)await browser.close();
 server.kill();
}
