import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/', 'http://localhost');
  const path=decodeURIComponent(url.pathname);
  const filename=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(filename!==root&&!filename.startsWith(root+sep)){
   res.writeHead(403).end();return;
  }
  const entry=await stat(filename);
  if(!entry.isFile()){res.writeHead(404).end();return}
  const ext=filename.slice(filename.lastIndexOf('.')).toLowerCase();
  res.setHeader('Content-Type',types[ext]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  res.end(await readFile(filename));
 }catch(error){
  res.writeHead(error?.code==='ENOENT'?404:400).end('Not found');
 }
}).listen(port,'127.0.0.1',()=>console.log('Studio browser test server :'+port));
