import assert from 'node:assert/strict';

export async function runAdminEntrySmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const calls=[],context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const json=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)});
  if(path==='/api/library')return json({records:[]});
  if(path==='/api/overrides')return json({values:{}});
  if(path.startsWith('/api/account/')){
   calls.push(path);
   return json({error:'Аккаунты ещё не активированы в D1: требуется миграция 0005'},503);
  }
  if(path==='/api/admin/login'&&method==='POST'){
   const body=route.request().postDataJSON();
   calls.push(path);
   assert.equal(body.username,'administrator');
   assert.equal(body.password,'Correct admin password!');
   return json({token:'a'.repeat(43),expires:Date.now()+600000});
  }
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'Вход администратора'}).count(),0);
  assert.equal(await page.locator('.account-admin-entry').count(),0);
  // Admin UI remains reachable only via documented hidden gestures.
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  assert.equal(calls.filter(p=>p==='/api/account/login').length,0);
  await page.locator('input[placeholder="Пароль администратора"]').fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  assert.deepEqual(calls.filter(p=>p==='/api/admin/login'),['/api/admin/login']);
  assert.deepEqual(errors,[]);
  const other=await context.newPage();
  await other.goto(base+'/',{waitUntil:'domcontentloaded'});
  for(let i=0;i<5;i++)await other.locator('.brand').click();
  await other.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await other.close();
  console.log('Chromium hidden admin entry passed: no public button, keyboard and five-logo gestures, independent authentication');
 }finally{await context.close()}
}

export async function runInlineMilestonesSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  // The initial race UI renders before the D1/local catalog has finished
  // loading. Opening the branch during catalog replacement is a timing race.
  // Require the real fully validated catalog before exercising the tree.
  await page.waitForFunction(()=>/\d+ навыков · \d+ предметов · \d+ душ/.test(
   document.querySelector('#catalogStatus')?.textContent||''),null,{timeout:20000});
  // A brand-new level-1 hero has no allocatable mastery points. Set the
  // planning level to 45 before exercising a real 0 -> 1 -> 2 allocation.
  await page.locator('#level').evaluate(input=>{
   input.value='45';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent?.trim()==='45');
  const group=page.locator('[data-path-group="prayer"]');
  if(await group.getAttribute('aria-expanded')!=='true')await group.click();
  const branch=page.locator('[data-path-branch="benevolence"]');
  if(await branch.getAttribute('aria-expanded')!=='true')await branch.click();
  const mark=page.locator('.path-unlock-notch').first();
  await mark.waitFor({state:'visible',timeout:20000});
  const result=await page.evaluate(()=>{
   const marks=[...document.querySelectorAll('.path-integrated-track .path-unlock-notch')];
   const mark=marks[0],bar=mark.closest('.path-integrated-track');
   const bed=bar.querySelector('.inline-mastery-bed');
   const range=bar.querySelector('input[type=range]');
   const barRect=bed.getBoundingClientRect();
   const geom=marks.map(x=>({
    x:x.getBoundingClientRect().x,top:x.getBoundingClientRect().top,
    bottom:x.getBoundingClientRect().bottom,height:x.getBoundingClientRect().height,
    width:x.getBoundingClientRect().width,
    pointer:getComputedStyle(x).pointerEvents
   }));
   return {geom,barLeft:barRect.left,barRight:barRect.right,barTop:barRect.top,barBottom:barRect.bottom,
    rangeZ:Number(getComputedStyle(range).zIndex),
    markerZ:Number(getComputedStyle(mark).zIndex),
    thumbCenterStart:range.getBoundingClientRect().left+9};
  });
  const legend=page.locator('.path-track-legend').first();
  assert.ok(await legend.isVisible(),'Skill scale labels must be visible below the drag track');
  assert.ok((await legend.innerText()).includes('Предел класса: '));
  assert.ok((await legend.innerText()).includes('90'));
  assert.ok(result.geom.length>=3,'Expected several source-backed unlock thresholds');
  assert.ok(result.geom.every(x=>x.top>=result.barTop-1&&x.bottom<=result.barBottom+1),
   'Every skill threshold belongs inside the SAME horizontal bar: '+JSON.stringify(result));
  assert.ok(result.geom.every(x=>x.x+x.width/2>=result.barLeft-1&&
   x.x+x.width/2<=result.barRight+1),'Unlock thresholds must stay within 0–90 rail');
  assert.ok(result.geom.every(x=>x.width===3&&x.height===12&&x.pointer==='none'),
   'Vertical skill ticks must remain compact and never steal slider events');
  assert.ok(result.geom.every((x,i,a)=>i===0||x.x>a[i-1].x),
   'Thresholds must be ordered left to right, not staggered over rows');
  assert.ok(result.geom.every(x=>Math.abs(x.top-result.geom[0].top)<=1));
  assert.ok(result.rangeZ>result.markerZ,'The slider must own pointer events');
  // User regression: 0 -> 1 inserts a green mastery count into the branch header
  // and previously made the branch editor jump vertically while dragging.
  const measureBranch=()=>page.evaluate(()=>{
   const row=document.querySelector('[data-path-branch="benevolence"]');
   const editor=row.nextElementSibling;
   return {height:row.getBoundingClientRect().height,
    editorTop:editor.getBoundingClientRect().top,
    extraMasteryLine:row.querySelector('span')?.textContent||'',
    points:row.querySelector('.count')?.textContent||''};
  });
  const drag=async value=>{
   await page.locator('[data-branch-control="benevolence:potential-range"]').evaluate((input,n)=>{
    input.value=String(n);input.dispatchEvent(new Event('input',{bubbles:true}));
   },value);
   await page.evaluate(()=>new Promise(requestAnimationFrame));
   return measureBranch();
  };
  const stable=[await measureBranch(),await drag(1),await drag(2),await drag(0)];
  assert.ok(stable[0].points.includes('0 /'),'Test starts with an empty branch');
  assert.ok(stable[1].points.includes('1 /')&&stable[2].points.includes('2 /'),
   'Dragging must update actual invested branch points');
  assert.ok(stable.every(x=>Math.abs(x.height-stable[0].height)<=1),
   'Mastery changes must NOT increase the branch row height: '+JSON.stringify(stable));
  assert.ok(stable.every(x=>Math.abs(x.editorTop-stable[0].editorTop)<=1),
   'The expanded mastery track must NOT jump vertically: '+JSON.stringify(stable));
  assert.ok(stable.every(x=>x.extraMasteryLine===''),
   'Mastery lives in the green numeric field, not an inserted header row');
  const exact=page.locator('[data-branch-control="benevolence:potential-number"]');
  await drag(2);
  await exact.fill('');
  await exact.press('Tab');
  assert.equal(await exact.inputValue(),'0','Clearing and blurring precise field must refund points');
  assert.equal(await page.locator('[data-branch-control="benevolence:potential-range"]').inputValue(),'0');
  await drag(5);
  await page.locator('#pathAutoMastery').uncheck();
  const mastery=page.locator('[data-branch-control="benevolence:mastery-number"]');
  assert.equal(await mastery.isEnabled(),true,'manual mastery control must be editable');
  await mastery.fill('3');await mastery.press('Tab');
  assert.equal(await mastery.inputValue(),'3');
  await mastery.fill('');await mastery.press('Tab');
  assert.equal(await mastery.inputValue(),'0','Clearing and blurring manual mastery must reset green to zero');
  assert.equal(await page.locator('[data-branch-control="benevolence:potential-range"]').inputValue(),'5',
   'Clearing manual green must not refund invested blue points');
  await drag(0);
  await page.locator('#pathAutoMastery').check();
  const points=Number(await mark.getAttribute('data-milestone-points'));
  const range=page.locator('.path-integrated-track input[type=range]').first();
  const rect=await range.boundingBox();
  const travel=rect.width-18;
  await page.mouse.move(rect.x+9+points/90*travel,rect.y+rect.height/2);
  await mark.locator('.path-milestone-tooltip').waitFor({state:'visible',timeout:4000});
  assert.ok((await mark.locator('.path-milestone-preview').count())>=1);
  assert.ok((await mark.locator('.path-milestone-cost').count())>=1,
   'Skill hover must expose current source-backed MP cost');
  assert.match(await mark.locator('.path-milestone-cost').first().innerText(),/Затрат ОМ: [0-9]+/);
  const fields=page.locator('.path-point-controls').first();
  await fields.waitFor({state:'visible'});
  assert.deepEqual(await fields.locator('label.path-point-group .path-point-name').allTextContents(),
   ['Вложено','Мастерство']);
  const inputHeights=await fields.locator('input[type=number]').evaluateAll(inputs=>
   inputs.map(input=>Math.round(input.getBoundingClientRect().height)));
  assert.deepEqual(inputHeights,[28,28],'Both compact fields have equal height');
  const controlsPosition=await fields.locator('label.path-point-group').evaluateAll(labels=>
   labels.map(label=>({top:Math.round(label.getBoundingClientRect().top),
    bottom:Math.round(label.getBoundingClientRect().bottom)})));
  assert.ok(controlsPosition.every(item=>item.top===controlsPosition[0].top),
   'At desktop viewport, invested points and mastery share one horizontal row');
  // Exercise a genuinely narrow branch editor without changing the viewport
  // or forcing the whole site into an unrelated mobile layout.
  await fields.evaluate(element=>{element.style.width='175px'});
  const narrow=await fields.locator('label.path-point-group').evaluateAll(labels=>
   labels.map(label=>({top:Math.round(label.getBoundingClientRect().top),
    right:label.getBoundingClientRect().right})));
  assert.ok(narrow[1].top>narrow[0].top,
   'At constrained widths, both compact controls must wrap cleanly');
  await fields.evaluate(element=>{element.style.removeProperty('width')});
  await mark.focus();
  await mark.locator('.path-milestone-tooltip').waitFor({state:'visible'});
  const glow=await mark.evaluate(element=>getComputedStyle(element).boxShadow);
  assert.match(glow,/0px 0px 1px 0px/,'Focused skill tick glow radius must be 1px');
  await page.locator('#locale [data-locale="en"]').click();
  assert.ok((await page.locator('.path-track-legend').first().innerText()).includes('Class limit:'));
  await page.locator('#pathSkillsTab').click();
  await page.locator('.path-skill-count').waitFor({state:'visible'});
  assert.match(await page.locator('.path-skill-count').innerText(),/skills/);
  await page.locator('.path-skill-card').first().click();
  await page.locator('#pathSkillDetails').waitFor({state:'visible'});
  assert.match(await page.locator('#pathSkillDetails').innerText(),/Character level/);
  assert.deepEqual(errors,[]);
  console.log('Chromium skill track passed: thin notches share one bar, slider takes input, pointer and keyboard tooltips work');
 }finally{await context.close()}
}
