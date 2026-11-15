import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};for(const path of ['pandora-os-character-calculator.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(path),{window:root});
const compat=root.PandoraCatalogSafety.compatibility;
const get=name=>JSON.parse(read('data/os/'+name+'.json'));
const source={items:get('items'),souls:get('souls'),itemForth:get('itemForth'),tables:get('tables')};
const itemChange=(id,fn)=>{
 const next={...source,items:{...source.items}};
 next.items[String(id)]=structuredClone(source.items[String(id)]);
 fn(next.items[String(id)]);
 return next;
};
test('W-only update uses actual grade-0, +5, +10 current-OS weapon model',()=>{
 const old=source.items['1'];
 const next=itemChange(1,item=>{item.W=old.W+7});
 const report=compat(source,next);
 assert.equal(report.totals.verified,1);
 assert.equal(report.totals.needsReview,0);
 const prev=root.PandoraOSCalculator.weaponAttackPreview({str:50,weapon:old,grade:5,weaponPlus:source.tables.weaponPlus});
 const now=root.PandoraOSCalculator.weaponAttackPreview({str:50,weapon:next.items['1'],grade:5,weaponPlus:next.tables.weaponPlus});
 assert.ok(now.known>prev.known);
});
test('AC-only armor update computes actual flat defense and +1.2 refinement',()=>{
 const found=Object.values(source.items).find(item=>item?.slot==='body'&&
  Number.isFinite(item.AC)&&item.name!=='-');
 assert.ok(found,'Pinned item catalog must contain actual body armor');
 const next=itemChange(found.id,item=>{item.AC+=3});
 const report=compat(source,next);
 assert.equal(report.totals.verified,1);
 assert.equal(report.totals.needsReview,0);
 const old=root.PandoraOSCalculator.defensePreview({records:[['item:'+found.id,found,5]],itemForth:source.itemForth});
 const updated=root.PandoraOSCalculator.defensePreview({records:[['item:'+found.id,next.items[String(found.id)],5]],itemForth:next.itemForth});
 assert.equal(updated.known-old.known,3);
});
test('PEN, type, slot or other unmodeled changes cannot masquerade as W-only compatibility',()=>{
 const next=itemChange(1,item=>{item.W+=3;item.PEN+=1});
 assert.equal(compat(source,next).totals.needsReview,1);
 const other=itemChange(1,item=>{item.kind='WAND';item.W+=3});
 assert.equal(compat(source,other).totals.needsReview,1);
});
test('narrative improvement clauses are gameplay source, not harmless editorial copy',()=>{
 const old={id:99772,name:'Test item',slot:'body',kind:'ARMOR',AC:12,
  effects:[],desc:'За каждые 2 единицы улучшения: ОМ +20'};
 const next=structuredClone(old);next.desc='За каждые 2 единицы улучшения: ОМ +30';
 const before={items:{'99772':old},tables:source.tables,itemForth:{}};
 const after={items:{'99772':next},tables:source.tables,itemForth:{}};
 const raw1=root.PandoraOSCalculator.sourceEffects('item:99772',old,7,null);
 const raw2=root.PandoraOSCalculator.sourceEffects('item:99772',next,7,null);
 assert.notDeepEqual(raw1,raw2);
 const report=compat(before,after);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.totals.sourceOnly,0);
});
test('plain editorial item description remains source-only if no effect changes',()=>{
 const next=itemChange(1,item=>{item.desc+=' Новое описание.'});
 const report=compat(source,next);
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(report.totals.needsReview,0);
});
test('new Forth, unison and expertise modifiers are not labeled source-only',()=>{
 for(const name of ['itemForth','unison','expertise']){
  const before={[name]:{a:{value:1}}},after={[name]:{a:{value:2}}};
  const report=compat(before,after);
  assert.equal(report.totals.needsReview,1,name);
  assert.equal(report.totals.sourceOnly,0,name);
 }
});
test('soul numeric effects remain explicitly reviewable unless formula contract is proven',()=>{
 const next={...source,souls:{...source.souls}};
 next.souls['101000']=structuredClone(source.souls['101000']);
 next.souls['101000'].effects[0].a+=1;
 const report=compat(source,next);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.totals.verified,0);
});
test('compatibility tests never mutate existing D1 nor source objects',()=>{
 const next=itemChange(1,item=>{item.W+=4});
 const sourceJSON=JSON.stringify(source),nextJSON=JSON.stringify(next);
 compat(source,next);
 assert.equal(JSON.stringify(source),sourceJSON);
 assert.equal(JSON.stringify(next),nextJSON);
});
