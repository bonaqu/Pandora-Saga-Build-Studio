import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

export async function runLayoutAudit(browser,base){
 const sizes=[[1366,768],[1920,1080],[2560,1440],[3840,2160],[390,844]];
 const rows=[];
 await mkdir('artifacts/layout',{recursive:true});
 for(const [width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},
   deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
  await context.route('**/*',route=>
   route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage();
  const runtime=[];
  page.on('pageerror',error=>runtime.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
    null,{timeout:20000});
   const geometry=await page.evaluate(()=>{
    const rect=selector=>{
     const element=document.querySelector(selector);
     if(!element)return null;
     const r=element.getBoundingClientRect();
     return{x:r.x,y:r.y,width:r.width,height:r.height,
      right:r.right,bottom:r.bottom};
    };
    return{
     viewport:document.documentElement.clientWidth,
     fullWidth:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),
     workspace:rect('#workspace'),stage:rect('.workspace>.stage'),
     portrait:rect('.workspace>.stage .portrait-frame'),
     left:rect('.workspace>.left'),right:rect('.workspace>.right'),
     heroCursor:getComputedStyle(document.querySelector('#hero')).cursor,
     heroImage:getComputedStyle(document.querySelector('#hero')).objectFit
    };
   });
   const {stage,portrait,left,right}=geometry;
   assert.ok(stage&&portrait&&left&&right,'Missing a primary editor column');
   assert.ok(geometry.fullWidth-geometry.viewport<=12,
    width+'px: unexpected horizontal page overflow '+(geometry.fullWidth-geometry.viewport));
   assert.ok(portrait.width>=100&&portrait.height>=160,
    width+'px: unusably small portrait');
   assert.ok(portrait.x>=stage.x-5&&portrait.right<=stage.right+5,
    width+'px: portrait overflows the stage');
   assert.ok(Math.abs((portrait.x+portrait.width/2)-(stage.x+stage.width/2))<=
    Math.max(12,stage.width*.16),
    width+'px: portrait is no longer approximately centered in its main stage');
   assert.equal(geometry.heroCursor,'default',
    width+'px: pointer hand must not replace the portrait cursor');
   assert.equal(geometry.heroImage,'contain',
    width+'px: full race portrait should stay visible');
   if(width>=1250){
    assert.ok(left.right<=stage.x+5&&stage.right<=right.x+5,
     width+'px: main panels overlap');
   }
   assert.deepEqual(runtime,[],width+'px: browser exception');
   rows.push({screen:width+'x'+height,...geometry});
   await page.screenshot({path:'artifacts/layout/'+width+'x'+height+'.jpg',
    type:'jpeg',quality:75,fullPage:true,animations:'disabled'});
   console.log('Layout audit passed '+width+'x'+height+
    ', hero '+Math.round(portrait.width)+'x'+Math.round(portrait.height));
  }finally{await context.close()}
 }
 await writeFile('artifacts/layout/geometry.json',JSON.stringify(rows,null,2)+'\n');
}
