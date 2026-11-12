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
const imageUrl=site+'assets/social-preview.png?v='+pkg.pandoraRelease;
const content=(field,isName=false)=>{
 const re=new RegExp('<meta '+(isName?'name':'property')+'="'+field+'" content="([^"]+)">','g');
 const values=[...head.matchAll(re)].map(m=>m[1]);
 assert.equal(values.length,1,'Exactly one static meta '+field);
 return values[0];
};

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
 assert.equal(content('og:image:type'),'image/png');
 assert.equal(content('og:image:width'),'1280');
 assert.equal(content('og:image:height'),'640');
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
test('published preview is the same 1280×640 self-hosted PNG used on GitHub',()=>{
 const png=readFileSync(new URL('assets/social-preview.png',root));
 assert.ok(png.length>50000&&png.length<600000,'Keep the OG image well below common preview size limits');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1280);
 assert.equal(png.readUInt32BE(20),640);
});
test('a simulated future release automatically refreshes both social descriptions and image cache keys',()=>{
 const folder=mkdtempSync(join(tmpdir(),'pandora-social-release-'));
 const inputs=['index.html','package.json','site-version.json','ROADMAP.md',
  'CHANGELOG.md','pandora-studio-update-manager.js','scripts/release-version.mjs','assets/social-preview.png'];
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
  assert.equal((next.match(new RegExp('assets/social-preview\\.png\\?v='+nextRelease.replaceAll('.','\\.'),'g'))||[]).length,2);
  assert.ok(!next.includes('Version: '+version+'"'),
   'A new release cannot preserve the previous share-card version');
 }finally{rmSync(folder,{recursive:true,force:true})}
});
