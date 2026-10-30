import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('gemstone type and seven original elements appear in selector',()=>{
 const x=get('enchant-model.js');
 for(const id of ['physical','magical','fire','ice','lightning','poison','light','dark','rainbow'])
  assert.match(x,new RegExp("id:'"+id+"'"));
 assert.match(get('stage-item-ui.js'),/Тип и стихия улучшения/);
 assert.match(get('stage-item-ui.js'),/Стихия/);
});
test('gem choices are normalized and saved as part of builds',()=>{
 const s=get('app.js');
 assert.match(s,/PandoraEnchantModel.normalize\(entry\)/);
 assert.match(s,/PandoraEnchantModel.normalize\(value\)/);
});
test('weapon bonus preview is explicitly not marked verified',()=>{
 const s=get('enchant-model.js');
 assert.match(s,/Math.floor\(value\*step.ratio\/100\)\+step.flat/);
 assert.match(s,/verified:false/);
 assert.doesNotMatch(get('stage-item-ui.js'),/Таблица OS:/);
});
