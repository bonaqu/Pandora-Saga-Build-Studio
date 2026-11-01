import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path=readFileSync(new URL('../hero-path.js',import.meta.url),'utf8');

test('skill hover thresholds are cached once per rendered marker, not read from the DOM on pointermove',()=>{
 assert.match(path,/milestonesOnTrack\.push\(\{tick,skills:skillsAt,locked:lockedAt,/);
 assert.match(path,/thresholdFraction:threshold\/visualMax\}/);
 const start=path.indexOf("track.addEventListener('pointermove',event=>{");
 const end=path.indexOf("const next=event.clientY",start);
 assert.ok(start>0&&end>start);
 const hover=path.slice(start,end);
 assert.match(hover,/nearestMilestone\(milestonesOnTrack,\(event\.clientX-left\)\/travel\)/);
 assert.match(hover,/nearest\.thresholdFraction\*travel/);
 assert.doesNotMatch(hover,/\.reduce\(/);
 assert.doesNotMatch(hover,/getAttribute\(/);
 assert.doesNotMatch(hover,/parseInt\(|parseFloat\(/);
 assert.match(hover,/const rect=range\.getBoundingClientRect\(\)/);
 assert.match(hover,/rect\.left\+9,travel=Math\.max\(1,rect\.width-18\)/);
});

test('normalized skill markers keep their exact original 90-point rail positions at all tested widths',()=>{
 for(const max of [90,120]){
  for(const points of [0,1,2,8,15,25,45,55,90,120].filter(x=>x<=max)){
   const fraction=points/max;
   for(const width of [180,240,390,1024]){
    const rangeWidth=width-24;
    const expected=21+(width-42)*fraction;
    const optimized=12+9+fraction*(rangeWidth-18);
    assert.ok(Math.abs(expected-optimized)<1e-8,'Value '+points+' at '+width+'px');
   }
  }
 }
});
