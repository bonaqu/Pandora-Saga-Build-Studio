import{test}from'node:test';
import assert from'node:assert/strict';
import vm from'node:vm';
import fs from'node:fs';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../catalog-diff.js',import.meta.url),'utf8'),context);
const {diff,changedFields}=context.window.PandoraCatalogDiff;
test('field-level preview shows confirmed old and new game values',()=>{
 const r=diff('skills',{1001:{name:'Test',mana:20}},{1001:{name:'Test',mana:30}});
 assert.equal(r.changed.length,1);assert.equal(r.examples[0].fields.find(x=>x.field==='mana').before,'20');
 assert.equal(r.examples[0].fields.find(x=>x.field==='mana').after,'30');
});
test('reordering source JSON keys does not count as a game update',()=>{
 assert.equal(diff('items',{1:{a:1,b:{x:1,y:2}}},{1:{b:{y:2,x:1},a:1}}).total,0);
});
test('new and removed ID counts are preserved',()=>{
 const r=diff('items',{1:{a:1},2:{a:2}},{1:{a:1},3:{a:3}});
 assert.equal(r.added.length,1);assert.equal(r.removed.length,1);
});
test('table display previews are bounded',()=>{
 const changes=changedFields({desc:'A'.repeat(500)},{desc:'B'.repeat(500)});
 assert.ok(changes[0].after.length<170);
});
