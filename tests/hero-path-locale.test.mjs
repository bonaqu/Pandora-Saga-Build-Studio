import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-hero-path.js',import.meta.url),'utf8');
function check(lang){
 const root={};Function('window',readFileSync(new URL('../pandora-studio-skill-progression.js',import.meta.url),'utf8'))(root);
 Function('window','document',source)(root,{});
 const api={lang,job:'MAGE',state:{level:1},skillCatalog:[],branchName:id=>id};
 return root.PandoraHeroPath.readiness({
  id:'skill-99',charLevel:20,classes:{CLERIC:true},
  reqs:[{branch:'magic',amount:10}],learnable:false
 },api);
}
test('Hero Path skill availability messages are translated by interface language',()=>{
 const en=check('en');
 assert.equal(en.learned,false);
 for(const label of ['Unavailable to this class','Requires level 20',
   'magic : allocated 0/10','Special learning method required'])
  assert.ok(en.problems.includes(label),label);
 const ru=check('ru');
 for(const label of ['Не подходит профессии','Требуется уровень 20',
   'magic: вложено 0/10','Особый способ изучения'])
  assert.ok(ru.problems.includes(label),label);
});
test('skill detail fields and workspace labels translate without rewriting game data',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.ok(source.includes("field('skillCharacterLevel','Уровень персонажа','Character level',skill.charLevel)"));
 assert.ok(source.includes("authored(api,'skillRequirementsHeading','Требования по веткам','Branch requirements'"));
 assert.ok(source.includes("stats.append(label,make('dd',{text:String(value)}))"));
 assert.ok(source.includes("api.copyLabel?.(key,ru,en)||tr(api,ru,en)"));
 assert.ok(source.includes("const ru='Показать ещё',en='Show more',key='skillShowMore'"));
 assert.ok(source.includes("class:'path-more-count'"));
 assert.ok(app.includes('Hero Workshop'));
 assert.ok(app.includes('Full encyclopedia entry'));
});


test('Hero Path uses Origin-approved attribute translations, not bare powerStat codes',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const pairs=[
  ["code:'vit'","nameEn:'Vitality'"],["code:'str'","nameEn:'Strength'"],
  ["code:'agi'","nameEn:'Agility'"],["code:'dex'","nameEn:'Dexterity'"],
  ["code:'spi'","nameEn:'Spirit'"],["code:'int'","nameEn:'Intelligence'"]
 ];
 for(const [code,name]of pairs)assert.ok(app.includes(code)&&app.includes(name),
  'Canonical attribute name missing: '+code);
 assert.match(app,/attributeLabel:raw=>\{/);
 assert.match(app,/ORIGIN_STAT_LABELS\.find\(row=>row\.code===String\(raw\)\.toLowerCase\(\)\)/);
 assert.match(source,/api\.attributeLabel\(skill\.powerStat\)/);
 assert.doesNotMatch(source,/field\(tr\(api,'Характеристика','Attribute'\),skill\.powerStat\)/);
});
