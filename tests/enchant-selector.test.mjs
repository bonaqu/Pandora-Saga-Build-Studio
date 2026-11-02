import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('gemstone type and seven original elements appear in selector',()=>{
 const x=get('pandora-studio-enchantment.js');
 for(const id of ['physical','magical','fire','ice','lightning','poison','light','dark','rainbow'])
  assert.match(x,new RegExp("id:'"+id+"'"));
 assert.match(get('pandora-studio-equipment-ui.js'),/Тип и стихия улучшения/);
 assert.match(get('pandora-studio-equipment-ui.js'),/Стихия/);
});
test('all OS weaponPlus coefficients determine the preview attack bonus',()=>{
 const ctx={};Function('window',get('pandora-studio-enchantment.js'))(ctx);
 const model=ctx.PandoraEnchantModel;
 const plus=JSON.parse(get('data/os/tables.json')).weaponPlus;
 for(let grade=1;grade<=10;grade++){
  const tier=plus[String(grade)],expected=Math.floor(53*tier.ratio/100)+tier.flat;
  const preview=model.weaponPreview(53,grade,plus);
  assert.equal(preview.increment,expected);
  assert.equal(preview.total,53+expected);
  assert.equal(preview.verified,false);
 }
 assert.equal(model.weaponPreview(53,4,plus).increment,12);
 assert.equal(model.weaponPreview(53,4,null),null);
});
test('gem choices are normalized and saved as part of builds',()=>{
 const s=get('pandora-studio-app.js');
 assert.match(s,/PandoraEnchantModel.normalizeForSlot\(key,entry\)/);
 assert.match(s,/PandoraEnchantModel.normalizeForSlot\(item.slot,/);
});
test('weapon bonus preview is explicitly not marked verified',()=>{
 const s=get('pandora-studio-enchantment.js');
 assert.match(s,/Math.floor\(value\*step.ratio\/100\)\+step.flat/);
 assert.match(s,/verified:false/);
 assert.doesNotMatch(get('pandora-studio-equipment-ui.js'),/Таблица OS:/);
});
