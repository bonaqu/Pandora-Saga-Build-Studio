import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=app.indexOf('function localizedRaceSkillStem('),end=app.indexOf('function branchCap(',begin);
assert.ok(begin>=0&&end>begin,'icon resolver source must exist');
const source=app.slice(begin,end);
const unknown='assets/skills/icons/skill_unknown.webp';

function resolver(override={},live=true){
 const archived={icons:{
  skills:{
   skill_100000501:'assets/skills/icons/skill_100000501.webp',
   skill_620002031:'assets/skills/icons/skill_620002031.webp'
  },
  items:{I_000001_00:'assets/items/icons/I_000001_00.webp'},
  souls:{I_101000_00:'assets/souls/icons/I_101000_00.webp'}},
  displayAliases:{skills:{skill_620002032:'skill_620002031'}}};
 const catalog={live,skills:{
  '620002031':{id:620002031,iconId:620002031,name:'Катапульта'},
  '100000501':{id:100000501,iconId:100000501,name:'Способность'},
  '900010':{id:900010,iconId:620002031,name:'Барьер'}
 }};
 const wikiData={skills:{
  '620002041':{id:620002041,iconId:620002041,name:'Катапульта'}
 }};
 const missing=new Set(['skills/skill_620002032','items/I_900001_00']);
 return Function('override','catalog','iconManifest','unavailableIconIds','OS','branchIcon','wikiData','lang',
  source+';return {skillIcon,itemIcon};')(override,catalog,archived,missing,
  'https://pandorasaga-os.com',id=>'branch:'+id,wikiData,'ru');
}
test('verified exact artwork and original Soul icon take priority',()=>{
 const {skillIcon,itemIcon}=resolver();
 assert.equal(skillIcon('slash',0,{id:100000501,iconId:100000501,name:'Способность'}),
  'assets/skills/icons/skill_100000501.webp');
 assert.equal(itemIcon({id:1,icon:'I_000001_00'}),'assets/items/icons/I_000001_00.webp');
 assert.equal(itemIcon({id:101028,kind:'SOUL',icon:'I_101000_00'},'souls'),
  'assets/souls/icons/I_101000_00.webp');
});
test('missing icon uses owner-approved display alias, then a game-client unknown icon',()=>{
 const {skillIcon,itemIcon}=resolver();
 assert.equal(skillIcon('special',0,{id:620002032,iconId:620002032,name:'Катапульта'}),
  'assets/skills/icons/skill_620002031.webp');
 assert.equal(skillIcon('special',0,{id:500000001,iconId:500000001,name:'Сон'}),unknown);
 assert.equal(skillIcon('special',0,{id:999999,iconId:999999,name:'Unknown'}),unknown);
 assert.equal(itemIcon({id:900001,icon:'I_900001_00'}),null);
 assert.equal(skillIcon('slash',0,null),'branch:slash');
 assert.equal(itemIcon({id:123,icon:'I_unknown_01'}),null);
});
test('archive and live catalogs share identical local source icons and unknown fallback',()=>{
 const {skillIcon}=resolver({},false);
 assert.equal(skillIcon('special',0,{id:620002032,iconId:620002032,name:'Катапульта'}),
  'assets/skills/icons/skill_620002031.webp');
 assert.equal(skillIcon('slash',0,{id:500000001,iconId:500000001,name:'Сон'}),
  unknown);
 assert.equal(skillIcon('slash',0,null),'branch:slash');
});
test('runtime exact-name matching covers later D1-only records without extra HTTP',()=>{
 const {skillIcon}=resolver();
 assert.equal(skillIcon('special',0,{id:620002041,iconId:620002041,name:'Катапульта'}),
  'assets/skills/icons/skill_620002031.webp');
 assert.equal(skillIcon('special',0,{id:900011,iconId:900011,name:'Барьер'}),
  'assets/skills/icons/skill_620002031.webp');
 assert.equal(skillIcon('special',0,{id:900012,iconId:900012,name:'Барьер другого уровня'}),unknown);
});
test('an individual owner artwork override supersedes shared/reused art',()=>{
 const {skillIcon}=resolver({'visual.skill.620002032':'assets/custom/icon.webp'});
 assert.equal(skillIcon('special',0,{id:620002032,iconId:620002032,name:'Катапульта'}),
  'assets/custom/icon.webp');
});
test('404 list is read only from verified manifest and invisible passives retain a glyph',()=>{
 assert.match(app,/unavailableIconIds=new Set\(\(Array\.isArray\(data\.missing\)/);
 assert.match(app,/entry\.error==='HTTP 404'/);
 assert.match(app,/const image=src\?h\('img',\{src,alt:'',loading:'lazy'\}\):/);
 assert.match(app,/h\('span',\{text:'✦',class:'skill-fallback'\}\)/);
 assert.doesNotMatch(source,/\/icons\/skills\//);
});
