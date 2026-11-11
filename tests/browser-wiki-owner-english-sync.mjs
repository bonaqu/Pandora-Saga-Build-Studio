import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const helperHost={};
Function('window',readFileSync(new URL('../pandora-studio-owner-bilingual.js',import.meta.url),'utf8'))(helperHost);
const rows=helperHost.PandoraOwnerBilingual.curated;
const sourceKeys=[
 'guideedit.wiki.labels',
 'guideedit.book.origin.heading',
 'guideedit.honor.rank.1'
];
const ruOnly=Object.fromEntries(sourceKeys.map(key=>[
 key,JSON.stringify(Object.fromEntries(Object.entries(rows[key].fields)
  .map(([field,data])=>[field,data.ru])))
]));

export async function runWikiOwnerEnglishSyncSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const values={...ruOnly},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1200,height:860}});
 await context.route('**/*',route=>{
  const url=route.request().url(),method=route.request().method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const json=data=>route.fulfill({status:200,headers,
   contentType:'application/json',body:JSON.stringify(data)});
  // The real app loads D1 catalog snapshots before applying owner overrides.
  // Without this stub it deliberately starts in archive mode, and a successful
  // default label would mask the missing D1 overlay under test.
  const path=new URL(url).pathname;
  if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
   const key=path.split('/').pop().slice(0,-5);
   const name=key==='stringsEn'?'strings.en':key;
   if(key==='legacyLocale')return json({});
   const content=JSON.parse(readFileSync(
    new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
   return route.fulfill({status:200,headers:{
    ...headers,'access-control-expose-headers':'X-PS-Catalog-Snapshot, X-PS-Catalog',
    'x-ps-catalog-snapshot':'ps-browser-snapshot',
    'x-ps-catalog':'d1'},
    contentType:'application/json',body:JSON.stringify(content)});
  }
  if(path==='/api/library')return json({records:[]});
  if(path==='/api/overrides')return json({values});
  if(url.endsWith('/api/admin/login'))
   return json({token:'a'.repeat(43),expires:Date.now()+600000});
  if(url.endsWith('/api/admin/override')){
   assert.equal(route.request().headers().authorization,'Bearer '+'a'.repeat(43));
   const data=route.request().postDataJSON();
   writes.push(data);
   values[data.key]=data.value;
   return json({ok:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Localhost correctly defaults to offline-archive mode. Switch this
  // isolated test to the real application's live-D1 retry path, where every
  // remote response is intercepted above. This is not a production backdoor.
  await page.evaluate(()=>document.querySelector('#startupRetry')?.click());
  await page.waitForFunction(()=>
   document.querySelector('.workspace>.left>.panel-heading h2')?.textContent
    ==='Происхождение героя' &&
   document.querySelector('#startupOverlay')?.hidden===true,
   null,{timeout:20000});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  const filter=page.locator('.wiki-skill-type');
  await filter.waitFor({state:'visible',timeout:20000});
  assert.ok((await filter.locator('option[value="unknown"]').innerText())
   .startsWith('Неуточнённые'));
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await filter.waitFor({state:'visible'});
  assert.ok((await filter.locator('option[value="unknown"]').innerText())
   .startsWith('Unresolved'),
   'EN category should reflect the exact RU-only override before any D1 write');
  assert.equal(Object.keys(JSON.parse(values['guideedit.wiki.labels'])).length,2,
   'Display translations must never silently modify D1');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Test fixture password');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  await page.locator('#ownerDock [data-owner-collapse]').click();
  const button=page.locator('#ownerDock [data-owner-en-sync]');
  await button.waitFor({state:'visible'});
  assert.match(await button.innerText(),/EN translations · 4/);
  await button.click();
  const modal=page.getByRole('dialog',{name:'English translations'});
  await modal.waitFor({state:'visible'});
  assert.match(await modal.innerText(),/Hero origin/);
  assert.match(await modal.innerText(),/Unresolved/);
  assert.equal(writes.length,0,
   'Opening the English review must not mutate production data');
  assert.match(await modal.locator('.owner-dialog-live-count').innerText(),/4/);
  await modal.getByRole('button',{name:'Save English translations'}).click();
  await page.waitForFunction(()=>document.querySelector('.owner-manager [role="status"]')
   ?.textContent.includes('Done:'),null,{timeout:15000});
  assert.equal(writes.length,sourceKeys.length);
  assert.equal(JSON.parse(values['guideedit.wiki.labels']).skill_filter_unknown_en,'Unresolved');
  assert.equal(JSON.parse(values['guideedit.wiki.labels']).honor_monthly_en,'Monthly ranks');
  assert.equal(JSON.parse(values['guideedit.book.origin.heading']).en,'Hero origin');
  assert.equal(JSON.parse(values['guideedit.honor.rank.1']).benefitEn,
   'Rank privileges: Ability to create a guild.');
  assert.deepEqual(errors,[]);
  console.log('Chromium owner EN sync: read-only fallback, explicit review, D1 writes only on click, 4 translated fields');
 }finally{await context.close()}
}
