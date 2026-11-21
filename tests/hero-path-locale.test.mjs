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
 assert.ok(source.includes("const dd=make('dd',{text:String(value)})"));
  assert.ok(source.includes('stats.append(label,dd)'));
  assert.ok(source.includes('if(valueCopy)bindPathCopy(api,dd,...valueCopy)'));
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

test('issue 390: milestone and successor labels are edited directly without renaming game skills',()=>{
 assert.match(source,/authored\(api,'pathUnlockPoints','оч\.','pts'/);
 assert.match(source,/class:'path-unlock-unit'/);
 assert.match(source,/class:'path-unlock-state'/);
 assert.match(source,/guardCaptionAction\(button,unit\)/);
 assert.match(source,/class:'path-skill-lineage-caption'/);
 assert.match(source,/class:'path-skill-lineage-name',text:' '\+label/);
 assert.match(source,/guardCaptionAction\(button,nextCaption\)/);
 assert.doesNotMatch(source,/bindPathCopy\(api,button,'skillNextLink'/);
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.match(app,/applyOwnerInterfaceEditedValue\('path',key,visible\)/);
});

test('issue 390: Path group and requirement captions are direct-edit and keep numbers separate',()=>{
 assert.match(source,/authored\(api,key,ru,en,'span','path-requirement-caption'\)/);
 assert.match(source,/class:'path-requirement-value',text:String\(value\)/);
 assert.match(source,/authored\(api,copyKey,ru,en,'span','path-group-summary-copy'\)/);
 assert.match(source,/class:'path-group-summary-value'/);
 assert.match(source,/guardCaptionAction\(groupButton,caption\)/);
 assert.doesNotMatch(source,/bindPathCopy\(api,caption,key,ru,en,'text',' ',' · '\)/);
});

test('issue 390: skill rail summary edits only author copy and not the live count',()=>{
 assert.match(source,/authored\(api,'skillsOnTrackCaption',fallbackRu,/);
 assert.match(source,/PandoraUILocale\?\.text\('skillsOnTrack','ru'\)/);
 assert.match(source,/PandoraUILocale\?\.text\('skillsOnTrack','en'\)/);
 assert.match(source,/class:'path-unlock-count'/);
 assert.match(source,/marks\.reduce\(\(total,mark\)=>total\+mark\.skills\.length,0\)/);
 assert.match(source,/guardCaptionAction\(unlockSummary,unlockCaption\)/);
 assert.doesNotMatch(source,/text:\(root\.PandoraUILocale\?\.text\('skillsOnTrack'/);
});

test('issue 390: Path baseline/limit captions are editable separately from values',()=>{
 const src=readFileSync(new URL('../pandora-studio-hero-path.js',import.meta.url),'utf8');
 assert.match(src,/authored\(api,'innateBaselineLabel','Начально \(оч\.\):'/);
 assert.match(src,/authored\(api,'pathLimitPoints','Лимит \(оч\.\):'/);
 assert.match(src,/class:'path-innate-value',text:' '\+String\(base\)/);
 assert.match(src,/class:'path-limit-number',text:' '\+String\(cap\)/);
 assert.match(src,/bindPathCopy\(api,baseline,'innateBaselineAria'/);
 assert.match(src,/'aria-hidden':api\.canEdit\?null:'true'/);
});
