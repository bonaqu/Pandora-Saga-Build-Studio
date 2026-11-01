import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const begin=app.indexOf('function skillIcon('),end=app.indexOf('function branchCap(',begin);
assert.ok(begin>=0&&end>begin,'icon resolver source must exist');
const source=app.slice(begin,end);

function resolver(){
 const archived={icons:{skills:{skill_100000501:'assets/skills/icons/skill_100000501.webp'},
  items:{I_000001_00:'assets/items/icons/I_000001_00.webp'},
  souls:{I_101000_00:'assets/souls/icons/I_101000_00.webp'}}};
 const missing=new Set(['skills/skill_100055002','items/I_900001_00']);
 return Function('override','catalog','iconManifest','unavailableIconIds','OS','branchIcon',
  source+';return {skillIcon,itemIcon};')({},
   {live:true},archived,missing,'https://pandorasaga-os.com',id=>'branch:'+id);
}
test('all archived source images resolve locally and Soul-specific copy wins',()=>{
 const {skillIcon,itemIcon}=resolver();
 assert.equal(skillIcon('slash',0,{id:100000501,iconId:100000501}),
  'assets/skills/icons/skill_100000501.webp');
 assert.equal(itemIcon({id:1,icon:'I_000001_00'}),'assets/items/icons/I_000001_00.webp');
 assert.equal(itemIcon({id:101028,kind:'SOUL',icon:'I_101000_00'},'souls'),
  'assets/souls/icons/I_101000_00.webp');
});
test('known missing originals return null instead of repeating HTTP 404 requests',()=>{
 const {skillIcon,itemIcon}=resolver();
 assert.equal(skillIcon('slash',0,{id:100055002,iconId:100055002}),null);
 assert.equal(itemIcon({id:900001,icon:'I_900001_00'}),null);
 assert.match(skillIcon('slash',0,{id:999999,iconId:999999}),/^https:\/\//);
 assert.equal(skillIcon('slash',0,null),'branch:slash');
 assert.match(itemIcon({id:123,icon:'I_unknown_01'}),/^https:\/\//);
});
test('404 list is read only from verified manifest and invisible passives retain a glyph',()=>{
 assert.match(app,/unavailableIconIds=new Set\(\(Array\.isArray\(data\.missing\)/);
 assert.match(app,/entry\.error==='HTTP 404'/);
 assert.match(app,/const image=src\?h\('img',\{src,alt:'',loading:'lazy'\}\):/);
 assert.match(app,/h\('span',\{text:'✦',class:'skill-fallback'\}\)/);
});
