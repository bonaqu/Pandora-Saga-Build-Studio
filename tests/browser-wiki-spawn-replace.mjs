import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Real browser UI path, but with a private in-memory Cloudflare D1 stub.
// No live administrator credentials or production writes are ever sent.
export async function runWikiSpawnReplacementSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const stored=new Map(),writes=[],errors=[];
 const source=JSON.parse(readFileSync(
  new URL('../data/os/maps.json',import.meta.url),'utf8'));
 const before=Object.entries(source)
  .filter(([,row])=>(row.mobs||[]).some(id=>String(id)==='13101'))
  .map(([id])=>id);
 assert.ok(before.includes('2001001'));
 assert.ok(!before.includes('2003301'));
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS',
   'access-control-expose-headers':'X-PS-Catalog-Snapshot',
   'x-ps-catalog-snapshot':'wiki-spawn-snapshot'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const reply=(data,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
   const key=path.split('/').pop().slice(0,-5),
    file=key==='stringsEn'?'strings.en':key;
   if(file==='legacyLocale')return reply({});
   return reply(JSON.parse(readFileSync(new URL(
    '../data/os/'+file+'.json',import.meta.url),'utf8')));
  }
  if(path==='/api/library')return reply({records:[]});
  if(path==='/api/overrides')return reply({values:Object.fromEntries(stored)});
  if(path==='/api/admin/login'&&method==='POST')
   return reply({token:'a'.repeat(43),expires:Date.now()+600000});
  if(path==='/api/admin/override'&&method==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
   const body=req.postDataJSON();
   writes.push(body);stored.set(body.key,body.value);
   return reply({ok:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // On localhost the public site starts with an offline archive; use the
  // real retry action to load the private mocked D1 snapshot above.
  await page.locator('#startupRetry').click();
  await page.waitForFunction(()=>document.querySelector('#startupOverlay')?.hidden===true,
   null,{timeout:20000});
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="monster"]').click();
  const search=page.locator('.wiki-controls input[type="search"]');
  await search.click();await search.fill('Слизень');
  await page.locator('[data-wiki-record="13101"]').waitFor({state:'visible'});
  await page.locator('[data-wiki-record="13101"]').click();
  const relations=page.locator('.wiki-page .wiki-owner-relations')
   .filter({has:page.locator('h4').getByText('Локации',{exact:true})});
  await relations.locator('.wiki-owner-replace').first().waitFor({state:'visible'});
  const original=await relations.locator('.wiki-owner-replace').first()
   .getAttribute('aria-label');
  assert.match(original,/Северная дорога Ветров/);
  await relations.locator('.wiki-owner-replace').first().click();
  const picker=relations.locator('.wiki-owner-relation-picker');
  await picker.waitFor({state:'visible'});
  const lookup=picker.locator('.wiki-owner-search');
  // Reuse the actual pointer unlock for the anti-autofill-protected field.
  await lookup.click();
  await lookup.fill('Туманные холмы');
  await picker.locator('select').selectOption('2003301');
  await page.waitForFunction(()=>document.querySelector('.wiki-page')
   ?.textContent.includes('Туманные холмы'),null,{timeout:20000});
  assert.equal(writes.length,1,'One pencil replacement must publish a single D1 override');
  assert.equal(writes[0].key,'spawnedit.13101');
  const links=JSON.parse(writes[0].value);
  assert.ok(links.some(x=>x.type==='map'&&x.id==='2003301'));
  assert.equal(links.some(x=>x.type==='map'&&x.id==='2001001'),false);
  for(const other of before.filter(id=>id!=='2001001'))
   assert.ok(links.some(x=>x.type==='map'&&x.id===other),
    'An unrelated original spawn was lost: '+other);
  assert.deepEqual(errors,[]);
  console.log('Chromium source-spawn replacement passed: reused pencil picker, one D1 key, original links preserved');
 }finally{await context.close()}
}
