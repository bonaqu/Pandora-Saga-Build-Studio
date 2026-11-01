import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('hero-path.js'),css=read('style.css');
const start=js.indexOf('    const railInset=21;');
const end=js.indexOf('    const lockedFraction=',start);
assert.ok(start>=0&&end>start,'Shared rail coordinate helpers must exist');
const {positionOnRail,widthOnRail}=new Function(js.slice(start,end)+
 '\nreturn {positionOnRail,widthOnRail};')();
const px=(expr,container)=>{
 const m=/^calc\((\d+(?:\.\d+)?)% ([+-]) (\d+(?:\.\d+)?)px\)$/.exec(expr);
 assert.ok(m,'unexpected CSS calc: '+expr);
 return container*Number(m[1])/100+(m[2]==='-'?-1:1)*Number(m[3]);
};
const widthPx=(expr,container)=>{
 const m=/^calc\((\d+(?:\.\d+)?)% - (\d+(?:\.\d+)?)px\)$/.exec(expr);
 assert.ok(m,'unexpected fill CSS calc: '+expr);
 return container*Number(m[1])/100-Number(m[2]);
};

test('one shared coordinate maps native 18px thumb, gold/green fill and red cap on all widths',()=>{
 const widths=[240,360,768,1365,1920];
 for(const width of widths){
  for(const value of [0,1,2,8,21,45,55,89,90]){
   const fraction=value/90;
   const track=width-42,expectedCenter=21+track*fraction;
   const nativeThumb=12+9+(width-24-18)*fraction;
   const actualCenter=px(positionOnRail(fraction),width);
   const actualFill=widthPx(widthOnRail(fraction),width);
   assert.ok(Math.abs(actualCenter-expectedCenter)<=.00002,
    'position must align at '+value+' / width '+width);
   assert.ok(Math.abs(actualCenter-nativeThumb)<=.00002,
    'visible notch must align with native range handle');
   assert.ok(Math.abs(actualFill-track*fraction)<=.00002,
    'fill must terminate directly below notch');
  }
 }
});

test('current value indicator remains one compact noninteractive vertical tick',()=>{
 assert.match(js,/class:'path-current-notch','aria-hidden':'true'/);
 assert.match(js,/track\.append\(currentNotch\)/);
 assert.match(js,/currentNotch\.style\.left=positionOnRail\(goldFraction\)/);
 assert.match(js,/track\.append\(range\);paint\(\)/);
 assert.match(js,/range\.addEventListener\('input',\(\)=>update\(Number\(range.value\),false\)\)/);
 assert.match(js,/range\.addEventListener\('change',\(\)=>update\(Number\(range.value\),true\)\)/);
 assert.match(css,/\.inline-mastery-track\.path-integrated-track \.path-current-notch\{/);
 const startRule=css.indexOf('.inline-mastery-track.path-integrated-track .path-current-notch{');
 const rule=css.slice(startRule,css.indexOf('}',startRule));
 for(const expected of [
  'top:9px','width:4px','height:26px','transform:translateX(-50%)',
  'pointer-events:none','z-index:13','border-radius:2px'
 ])assert.ok(rule.includes(expected),expected);
 assert.doesNotMatch(rule,/border-radius:50%/);
});

test('obsolete circular slider thumb CSS is removed, invisible native 18px hit area remains',()=>{
 assert.doesNotMatch(css,/input\[type=range\]::-webkit-slider-thumb\{[^}]*border-radius:50%/);
 assert.doesNotMatch(css,/input\[type=range\]::-moz-range-thumb\{[^}]*border-radius:50%/);
 for(const pseudo of ['::-webkit-slider-thumb','::-moz-range-thumb']){
  const ruleStart='.inline-mastery-track.path-integrated-track input[type=range]'+pseudo+'{';
  const start=css.indexOf(ruleStart);
  assert.ok(start>=0,'missing cross-browser native thumb '+pseudo);
  const rule=css.slice(start,css.indexOf('}',start));
  assert.match(rule,/width:18px;height:18px/);
  assert.match(rule,/border:0;border-radius:0;background:transparent;box-shadow:none/);
  assert.match(rule,/opacity:0/);
 }
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/\.path-current-notch\{[\s\S]*?background:Highlight/);
});

test('allocation semantics remain untouched across numeric clearing, hover and source-backed milestone geometry',()=>{
 for(const statement of [
  "const raw=numeric.value.trim();",
  "update(raw===''?0:Number(raw),true);",
  "const raw=input.value.trim(),requested=raw===''?0:Number(raw);",
  "const visualMax=Math.max(90,cap,points);",
  "tick.style.left=(threshold/visualMax*100).toFixed(4)+'%';",
  "range.setAttribute('aria-valuetext'",
  "const lockedFraction=Math.max(0,Math.min(1,cap/visualMax));",
  "locked.style.left=positionOnRail(lockedFraction);"
 ])assert.ok(js.includes(statement),statement);
});
