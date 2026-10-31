import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const items=JSON.parse(read('data/os/items.json'));
test('real OS beginner cape contributes +5% earned EXP only when equipped',()=>{
 const cape=items[18073];assert.equal(cape.name,'Плащ новичка');
 assert.equal(cape.effects.find(x=>x.func==='EP_VOLUME_EXP').a,5);
 const value=scope.PandoraOSCalculator.experienceBonusPreview({records:[['item:18073',cape,0]]});
 assert.equal(value.entries.length,1);
 assert.equal(value.entries[0].percent,5);
 assert.equal(value.verified,false);
 assert.deepEqual(scope.PandoraOSCalculator.experienceBonusPreview({records:[]}).entries,[]);
});
test('EXP grade gate respects future refinement requirements without inventing amounts',()=>{
 const source={name:'Conditional',effects:[{func:'EP_VOLUME_EXP',a:10,min:6,max:10}]};
 const records=level=>[['item:demo',source,level]];
 assert.equal(scope.PandoraOSCalculator.experienceBonusPreview({records:records(5)}).entries.length,0);
 assert.equal(scope.PandoraOSCalculator.experienceBonusPreview({records:records(6)}).entries[0].percent,10);
 assert.equal(scope.PandoraOSCalculator.experienceBonusPreview({records:records(11)}).entries.length,0);
});
test('experience is shown as a separate Hero Book effect rather than added to damage',()=>{
 const app=read('os-calculator.js'),stage=read('stage-attributes.js');
 assert.match(app,/experienceBonus=experienceBonusPreview\(\{records:combinedRecords,itemForth\}\)/);
 assert.match(app,/procPreview,experienceBonus,regeneration/);
 assert.match(stage,/Бонус к получаемому опыту/);
 assert.match(stage,/modifiers\?\.experienceBonus\?\.entries\?\.length/);
});
