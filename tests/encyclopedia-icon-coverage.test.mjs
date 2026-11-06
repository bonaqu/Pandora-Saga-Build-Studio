import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all packaged item icons have local verified paths or an explicit original-404 record',()=>{
 const items=Object.values(JSON.parse(read('data/os/items.json')));
 const manifest=JSON.parse(read('assets/os-icon-manifest.json'));
 const missing=new Set(manifest.missing.filter(x=>x.kind==='items'&&x.error==='HTTP 404')
  .map(x=>x.stem));
 for(const item of items){
  if(!item.icon)continue;
  const local=manifest.icons.items[item.icon];
  assert.ok(local||missing.has(item.icon),
   'Unverified item icon identity '+item.icon+' (item '+item.id+')');
  if(local){
   assert.match(local,/^assets\/items\/icons\/[A-Za-z0-9_-]+\.webp$/);
   assert.ok(existsSync(new URL('../'+local,import.meta.url)),local);
  }
 }
});
test('verified offline art is used instead of repeatedly fetching known-404 OS icons',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function itemIcon(');
 const end=app.indexOf('\nfunction branchCap(',start);
 assert.ok(start>0&&end>start);
 const resolver=app.slice(start,end);
 assert.match(resolver,/iconManifest\?\.icons\?\./);
 assert.match(resolver,/return null/);
 assert.doesNotMatch(resolver,/return \`\$\{OS\}\/icons\//,
  'Do not request known-404 item URLs from the legacy OS endpoint');
});
test('owner RU/EN labels are valid D1 book guides for all expanded UI regions',()=>{
 const ctx={};
 Function('window',read('pandora-studio-honor-guide.js'))(ctx);
 const valid=ctx.PandoraHonorGuide.validOverride;
 for(const key of ['book.chapter.summary','book.equipment.tab.souls',
  'book.equipment.gem.element.fire','book.equipment.field.slots',
  'book.path.group.combat','book.path.tabGrowth']){
  assert.equal(valid(key,JSON.stringify({ru:'Демо',en:'Demo'})),true,key);
 }
});
