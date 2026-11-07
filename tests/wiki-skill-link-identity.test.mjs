import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=app.indexOf('function wikiLink(');
const end=app.indexOf('function guardEncyclopediaSearch(',begin);
assert.ok(begin>0&&end>begin,'Wiki link helper must be available');
const linkFn=app.slice(begin,end);
function createLink(id,type='skill'){
 const opened=[];
 const canonical=(kind,key)=>kind==='skill'?'161202001':'item-primary';
 const index={canonical};
 const h=(tag,attrs)=>({tag,...attrs});
 const wikilink=Function('wikiIndex','h','openWiki',
  linkFn+';return wikiLink;')(index,h,(...args)=>opened.push(args));
 return {link:wikilink('Open',type,id),opened};
}
test('skill links preserve the exact source record, even when canonical primary differs',()=>{
 const {link,opened}=createLink('161202050');
 assert.equal(link.href,'#wiki/skill/161202050');
 let prevented=false;
 link.onclick({button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,
  preventDefault(){prevented=true}});
 assert.equal(prevented,true);
 assert.deepEqual(opened,[['skill','161202050',null]]);
});
test('other wiki categories still use canonical link destinations',()=>{
 const {link,opened}=createLink('900001','item');
 assert.equal(link.href,'#wiki/item/item-primary');
 link.onclick({button:0,preventDefault(){}});
 assert.deepEqual(opened,[['item','item-primary',null]]);
});
test('prerequisite skill links preserve requested ID when optional variants exist',()=>{
 assert.match(app,/const prereq=String\(rec\.prereq\);/);
 assert.doesNotMatch(app,/wikiIndex\.canonical\('skill',rec\.prereq\)/);
});
