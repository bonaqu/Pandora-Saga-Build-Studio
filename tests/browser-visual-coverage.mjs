import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

// Captures actual rendered screens, not synthetic component mocks. Screens are
// checked at desktop RU and mobile EN, across the character editor, Hero Book,
// account/save dialogs, and each discoverable encyclopedia chapter.
export async function runVisualCoverageSmoke(browser,base){
 const outputs=[],errors=[];
 await mkdir('artifacts/layout', {recursive:true});
 for(const config of [
  {width:1366,height:850,locale:'ru'},
  {width:390,height:844,locale:'en'}
 ]){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},
   deviceScaleFactor:1,isMobile:config.width<500,hasTouch:config.width<500});
  await context.route('**/*',route=>
   route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  let count=0;
  const prefix=config.width+'-'+config.locale;
  const examine=async(label,selectors=[])=>{
   const info=await page.evaluate(targets=>{
    const isVisible=el=>{
     const s=getComputedStyle(el),r=el.getBoundingClientRect();
     return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1 &&
      !el.closest('[hidden],[inert]');
    };
    const screen=document.documentElement.clientWidth;
    const groups={};
    const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
     Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    for(const selector of targets){
     const group=document.querySelector(selector);
     if(!group||!isVisible(group))continue;
     const children=[...group.children].filter(isVisible).map(el=>({
      label:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,60),
      rect:el.getBoundingClientRect(),tag:el.tagName
     }));
     const collisions=[];
     for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
      const a=children[i],b=children[j];
      const area=overlap(a.rect,b.rect);
      // A decorated badge and a control can share pixels intentionally,
      // but two direct interactive siblings should not paint over each other.
      if(area>30&&['BUTTON','INPUT','SELECT'].includes(a.tag)&&
        ['BUTTON','INPUT','SELECT'].includes(b.tag))
       collisions.push([a.label,b.label,Math.round(area)]);
     }
     const box=group.getBoundingClientRect();
     groups[selector]={
      width:Math.round(box.width),
      contentWidth:group.scrollWidth,
      horizontalOverflow:Math.max(0,group.scrollWidth-group.clientWidth),
      collisions,
      buttons:children.filter(c=>c.tag==='BUTTON').length
     };
    }
    const visibleDialog=[...document.querySelectorAll('#modalRoot .modal, #detailPanel.is-open, #accountPanel:not([hidden])')]
     .filter(isVisible).map(el=>{
      const r=el.getBoundingClientRect();
      return{type:el.id||el.className,left:r.left,right:r.right,top:r.top,
       width:r.width,height:r.height,viewport:screen};
     });
    const globalOverflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-screen;
    return{viewport:screen,globalOverflow,groups,visibleDialog,
     bookChevrons:document.querySelectorAll(
      '#stageBookPanel details.stage-result-section>summary .stage-result-chevron').length,
     bookSections:document.querySelectorAll('#stageBookPanel details.stage-result-section').length};
   },selectors);
   assert.ok(info.globalOverflow<=14,
    prefix+' '+label+': page overflow '+JSON.stringify(info));
   for(const [key,g] of Object.entries(info.groups)){
    assert.ok(g.horizontalOverflow<=14,
     prefix+' '+label+': overflowing '+key+' '+JSON.stringify(g));
    assert.deepEqual(g.collisions,[],
     prefix+' '+label+': controls overlap in '+key);
   }
   for(const d of info.visibleDialog){
    assert.ok(d.left>=-8&&d.right<=d.viewport+9,
     prefix+' '+label+': dialog/window exceeds viewport '+JSON.stringify(d));
   }
   if(info.bookSections){
    assert.equal(info.bookChevrons,info.bookSections,
     prefix+' '+label+': duplicate or missing disclosure chevrons');
   }
   count++;
   outputs.push({screen:prefix,step:label,...info});
   const file='artifacts/layout/visual-'+prefix+'-'+
    String(count).padStart(2,'0')+'-'+label.replace(/[^a-z0-9-]/g,'')+'.jpg';
   await page.screenshot({path:file,type:'jpeg',quality:65,animations:'disabled'});
  };
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#catalogStatus')
    ?.textContent?.includes('навыков'),null,{timeout:30000});
   if(config.locale==='en'){
    await page.locator('#locale [data-locale="en"]').click();
    await page.waitForFunction(()=>document.documentElement.lang==='en');
   }
   await examine('origin-race',['#originTabs','.hero-actions','.path-sections']);
   for(const tab of ['class','stats']){
    await page.locator('[data-origin-tab="'+tab+'"]').click();
    await examine('origin-'+tab,['#originTabs','.hero-actions','.path-sections']);
   }
   await page.locator('#pathSkillsTab').click();
   await examine('path-skills',['.path-sections','.path-skills-filter','.hero-actions']);
   await page.locator('#pathGrowthTab').click();
   await examine('path-growth',['.path-sections','.path-mastery-toggle','.hero-actions']);
   await page.locator('#hero').click();
   await page.locator('#stageAttributes').waitFor({state:'visible'});
   await examine('hero-book-results',['#stageAttributes .stage-attribute-tabs']);
   const tabs=page.locator('#stageAttributes .stage-attribute-tabs [role="tab"]');
   const total=await tabs.count();
   assert.ok(total>=5&&total<=8,'Unexpected Hero Book tabs '+total);
   for(let i=1;i<total;i++){
    await tabs.nth(i).click();
    await examine('hero-book-'+i,['#stageAttributes .stage-attribute-tabs']);
   }
   await page.locator('#stageAttributes .stage-book-close').click();
   await page.locator('#nav [data-tab="wiki"]').click();
   await page.locator('[data-wiki-chapter]').first().waitFor({state:'visible'});
   const names=await page.locator('[data-wiki-chapter]').evaluateAll(nodes=>
    [...new Set(nodes.map(n=>n.getAttribute('data-wiki-chapter')).filter(Boolean))]);
   assert.ok(names.length>=6,'Too few encyclopedia chapters discovered '+names.join(','));
   for(const name of names){
    const target=page.locator('[data-wiki-chapter="'+name+'"]').first();
    await target.click();
    await page.locator('#detailPanel.is-open').waitFor({state:'visible'});
    await examine('wiki-'+name,['.wiki-controls','.wiki-skill-toolbar','.wiki-categories',
     '.wiki-effect-toolbar','.wiki-honor-rank-filters','.detail-title']);
   }
   await page.locator('#dockClose').click();
   await page.locator('#nav [data-tab="builds"]').click();
   await examine('build-account-gate',['.build-signin-actions','.detail-title']);
   await page.locator('#dockClose').click();
   // A guest save button can be disabled for an empty hero; a shared-link
   // sign-in dialog has an established real user entry path in both locales.
   await page.evaluate(()=>{location.hash='#b/A1234567890'});
   await page.locator('#modalRoot .modal').waitFor({state:'visible'});
   await examine('guest-share-signin-modal',['#modalRoot .modal-actions','#modalRoot .build-signin-actions']);
   await page.keyboard.press('Escape');
   if(await page.locator('#modalRoot .modal').isVisible().catch(()=>false))
    await page.locator('#modalRoot button').last().click().catch(()=>{});
   await page.locator('#profileTrigger').click();
   await page.locator('#accountPanel').waitFor({state:'visible'});
   await examine('account-panel',['#accountPanel .account-form',
    '#accountPanel .account-actions','#accountPanel .account-tabs']);
   assert.deepEqual(errors,[],prefix+' browser exception');
   console.log('Visual coverage '+prefix+' passed: '+count+
    ' screens, '+names.length+' encyclopedia chapters, '+total+' Hero Book tabs');
  }finally{await context.close()}
 }
 await writeFile('artifacts/layout/visual-coverage.json',
  JSON.stringify(outputs,null,2)+'\n');
}
