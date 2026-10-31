import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('new characters always begin at level 1, and planning retains level 55',()=>{
  const app=read('app.js'),rules=read('rules.js');
  assert.match(app,/function fresh\(\)\{return\{[^\n]*level:1\b/);
  assert.match(rules,/55/,'studio level cap must not collapse to the current live server cap');
});

test('a published link is verified by the Worker before showing the URL and copy action',()=>{
  const app=read('app.js');
  const start=app.indexOf('async function createShared(');
  const end=app.indexOf('function openSharedSnapshot(',start);
  assert.ok(start>=0&&end>start,'share function must remain inspectable');
  const share=app.slice(start,end);
  const probe=share.indexOf("apiRequest('/api/shared/'+response.id,null,'')");
  const announce=share.indexOf('Ссылка на билд создана.');
  assert.ok(probe>=0&&announce>probe,'cannot claim link exists before successful GET verification');
  assert.match(share,/check\?\.share\?\.type!=='build'/);
  assert.match(share,/aria-label':'Ссылка на билд'/);
  assert.match(share,/navigator\.clipboard\.writeText\(url\)/);
  assert.match(share,/field\.focus\(\);field\.select\(\)/);
});
