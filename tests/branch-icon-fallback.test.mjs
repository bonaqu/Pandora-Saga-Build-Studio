import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const match=source.match(/const BRANCH_ICON_PATHS=(\{[^\n]+\});/);
assert.ok(match,'Expected explicit branch-icon table');
const paths=JSON.parse(match[1]);
const start=source.indexOf('function branchIcon(');
const end=source.indexOf('\nfunction skillIcon(',start);
assert.ok(start>0&&end>start,'Branch fallback must be independently testable');
const branchIcon=Function('BRANCH_ICON_PATHS',source.slice(start,end)+'\nreturn branchIcon')(paths);
test('every mapped branch sprite is a real checked-in original legacy image',()=>{
 for(const [key,path] of Object.entries(paths)){
  assert.match(key,/^[a-z][a-z0-9]*$/);
  assert.match(path,/^assets\/skills\/legacy\/[0-9]{2}-[0-9]{2}\.png$/);
  assert.equal(existsSync(new URL('../'+path,import.meta.url)),true,path);
  assert.equal(branchIcon(key),path);
 }
});
test('unknown, race and prototype branch keys never resolve to missing placeholders',()=>{
 for(const key of ['race','other',null,undefined,'__proto__','constructor','toString']){
  assert.equal(branchIcon(key),null,String(key));
 }
 assert.equal(source.includes('assets/ui/icons/skill-unknown.svg'),false);
});
