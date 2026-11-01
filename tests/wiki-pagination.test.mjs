import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('encyclopedia provides true counts and can progressively load all matches',()=>{
 const code=get('app.js');
 assert.match(code,/const results=wikiIndex\.search\(type,wikiSearch,id=>searchTerms\(type,id\)\)/);
 assert.match(code,/const visible=selectedIndex>=wikiShown/);
 assert.match(code,/results\.slice\(0,wikiShown\)/);
 assert.match(code,/Показано '\+visible.length\+' из '\+results.length/);
 assert.match(code,/wikiShown\+=100;draw\(\)/);
 assert.match(code,/browse\.scrollTop=selectedIndex>=wikiShown\?0:previousScroll/);
});
test('search and category changes reset pagination without dropping entries',()=>{
 const code=get('app.js');
 assert.match(code,/wikiSearch=search.value;wikiShown=100/);
 assert.match(code,/wikiSearch='';wikiShown=100;renderDetails\(\)/);
});
