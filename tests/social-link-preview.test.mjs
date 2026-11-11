import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,cpSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const html=read('index.html');
const head=html.split('</head>')[0];
const pkg=JSON.parse(read('package.json'));
const site='https://bonaqu.github.io/Pandora-Saga-Build-Studio/';
const version='0.'+Number(pkg.pandoraRelease.split('.')[3])+'.0';
const imageUrl=site+'assets/social-preview.jpg?v='+pkg.pandoraRelease;
const content=(field,isName=false)=>{
 const re=new RegExp('<meta '+(isName?'name':'property')+'="'+field+'" content="([^"]+)">','g');
 const values=[...head.matchAll(re)].map(m=>m[1]);
 assert.equal(values.length,1,'Exactly one static meta '+field);
 return values[0];
};

function jpegDimensions(bytes){
 assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 for(let i=2;i<bytes.length-9;){
  if(bytes[i++]!==255)continue;
  let mark=bytes[i++];
  while(mark===255)mark=bytes[i++];
  if(mark===216||mark===1)continue;
  if(mark===217||mark===218)break;
  const length=bytes.readUInt16BE(i);
  if([192,193,194,195,198,199,201,202].includes(mark))
   return{width:bytes.readUInt16BE(i+5),height:bytes.readUInt16BE(i+3)};
  i+=length;
 }
 throw Error('No JPEG frame marker');
}
test('static homepage exposes Telegram/Open Graph identity, photo and consistent release',()=>{
 assert.match(head,/<title>Pandora Saga \| Build Studio<\/title>/);
 assert.match(head,/rel="canonical" href="https:\/\/bonaqu\.github\.io\/Pandora-Saga-Build-Studio\/"/);
 assert.equal(content('og:type'),'website');
 assert.equal(content('og:title'),'Pandora Saga | Build Studio');
 assert.equal(content('og:site_name'),'Pandora Saga | Build Studio');
 assert.equal(content('og:url'),site);
 assert.equal(content('og:locale'),'en_US');
 assert.equal(content('og:locale:alternate'),'ru_RU');
 assert.equal(content('og:image'),imageUrl);
 assert.equal(content('og:image:type'),'image/jpeg');
 assert.equal(content('og:image:width'),'1920');
 assert.equal(content('og:image:height'),'1080');
 assert.match(content('og:image:alt'),/character planner/i);
 assert.equal(content('twitter:card',true),'summary_large_image');
 assert.equal(content('twitter:title',true),'Pandora Saga | Build Studio');
 assert.equal(content('twitter:image',true),imageUrl);
 assert.match(content('twitter:image:alt',true),/character planner/i);
 for(const description of [content('og:description'),content('twitter:description',true)]){
  assert.match(description,/Character Planner/);
  assert.match(description,/RU\/EN/);
  assert.ok(description.endsWith('Version: '+version));
  assert.ok(description.length<160);
 }
 assert.ok(head.indexOf('property="og:title"')>0&&
  head.indexOf('<script')===-1&&
  head.indexOf('property="og:title"')<head.indexOf('<link rel="stylesheet"'),
  'The crawler must see static metadata before any script or stylesheet');
});
test('published cover is a genuine self-hosted 1920×1080 JPEG with no external asset hosting',()=>{
 const jpeg=readFileSync(new URL('assets/social-preview.jpg',root));
 assert.ok(jpeg.length>50000&&jpeg.length<600000,'Keep the OG image well below common preview size limits');
 assert.deepEqual(jpegDimensions(jpeg),{width:1920,height:1080});
});
test('a simulated future release automatically refreshes both social descriptions and image cache keys',()=>{
 const folder=mkdtempSync(join(tmpdir(),'pandora-social-release-'));
 const inputs=['index.html','package.json','site-version.json','ROADMAP.md',
  'CHANGELOG.md','pandora-studio-update-manager.js','scripts/release-version.mjs'];
 try{
  for(const file of inputs){
   const to=join(folder,file);mkdirSync(dirname(to),{recursive:true});
   cpSync(new URL(file,root),to);
  }
  const parts=pkg.pandoraRelease.split('.');
  parts[3]=String(Number(parts[3])+1);
  const nextRelease=parts.join('.');
  const nextVersion='0.'+parts[3]+'.0';
  const command=spawnSync(process.execPath,
   [join(folder,'scripts/release-version.mjs'),nextRelease,'Automated social preview regression'],
   {encoding:'utf8',timeout:15000});
  assert.equal(command.status,0,command.stderr||command.stdout);
  const next=readFileSync(join(folder,'index.html'),'utf8');
  for(const field of ['og:description','twitter:description'])
   assert.match(next,new RegExp((field==='og:description'?'property':'name')+'="'+field+'" content="[^"]*Version: '+nextVersion.replaceAll('.','\\.')+'"'));
  assert.equal((next.match(new RegExp('assets/social-preview\\.jpg\\?v='+nextRelease.replaceAll('.','\\.'),'g'))||[]).length,2);
  assert.doesNotMatch(next,/Version: 0\.(?:653|654)\.0(?=")/,
   'A new release cannot preserve an outdated card version');
 }finally{rmSync(folder,{recursive:true,force:true})}
});
