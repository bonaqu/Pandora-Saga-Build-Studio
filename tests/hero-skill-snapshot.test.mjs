import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('app.js');
const begin=app.indexOf('const heroSkillRowsCache=new WeakMap()');
const end=app.indexOf('function heroPathApi()',begin);
assert.ok(begin>0&&end>begin,'Must cache source record array across rerenders');
const rows=Function(app.slice(begin,end)+'\nreturn heroSkillRows;')();
test('same catalog identity returns the same ordered row snapshot across growth/gallery renders',()=>{
 const source={4:{id:4,name:'C'},1:{id:1,name:'A'},2:{id:2,name:'B'}};
 const a=rows(source),b=rows(source);
 assert.equal(a,b);
 assert.deepEqual(a.map(x=>x.id),Object.values(source).map(x=>x.id));
});
test('locale or D1 catalog replacement invalidates old source snapshot and retains original records',()=>{
 const ru={1:{id:1,name:'Меч'},2:{id:2,name:'Сила'}};
 const en={1:{id:1,name:'Sword'},2:{id:2,name:'Strength'}};
 assert.equal(rows(ru)[0].name,'Меч');
 assert.equal(rows(en)[0].name,'Sword');
 assert.notEqual(rows(ru),rows(en));
 assert.equal(rows(ru),rows(ru));
 assert.equal(rows(en),rows(en));
 assert.equal(ru[1].name,'Меч');
 assert.deepEqual(rows(null),[]);
 assert.deepEqual(rows(undefined),[]);
});
test('Growth and Skills share one source record list via the canonical API, no stale duplicated conversion',()=>{
 const start=app.indexOf('function heroPathApi()');
 const end=app.indexOf('function renderBranches()',start);
 const api=app.slice(start,end);
 assert.match(api,/skillCatalog:heroSkillRows\(catalog\.skills\)/);
 assert.doesNotMatch(api,/skillCatalog:Object\.values\(catalog\.skills/);
 assert.match(app,/catalog=\{meta,classes:translate\(catalogSource\.classes/);
});
