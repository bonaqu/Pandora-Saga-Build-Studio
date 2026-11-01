import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root={};
Function('window',readFileSync(new URL('../build-comparison.js',import.meta.url),'utf8'))(root);
Function('window',readFileSync(new URL('../enchant-model.js',import.meta.url),'utf8'))(root);
const compare=(a,b,lang='ru')=>root.PandoraBuildComparison.describe(a,b,{
 lang,slotLabels:['Оружие','Щит'],enchant:root.PandoraEnchantModel,
 honorTitles:[{ru:'Нет титула',en:'None'},{ru:'Сила познания',en:'Curiosity'}]
});
const original={gender:0,equipment:{0:{id:10}},gems:{'0:10':{type:'physical',element:'ice'}},
 vitalsBuffs:{guildHp:0,lifeSign:false},
 attributeBuffs:{guildAll:0,combatLunge:false,honorTitle:0,proelium:false}};
test('comparison reveals attached gemstone and changed buffs without altering source',()=>{
 const revised=structuredClone(original);
 revised.gems['0:10']={type:'magical',element:'fire'};
 revised.vitalsBuffs.guildHp=3;
 revised.vitalsBuffs.lifeSign=true;
 revised.attributeBuffs.guildAll=2;
 revised.attributeBuffs.combatLunge=true;
 revised.attributeBuffs.honorTitle=1;
 const difference=compare(original,revised);
 assert.ok(difference.some(x=>/Самоцвет: Оружие.*Лёд.*Огонь/.test(x)));
 assert.ok(difference.some(x=>/Гильдия: ОЗ: 0 → 3/.test(x)));
 assert.ok(difference.some(x=>/Знак жизни: выкл → вкл/.test(x)));
 assert.ok(difference.some(x=>/Гильдия: характеристики: 0 → 2/.test(x)));
 assert.ok(difference.some(x=>/Рывок: выкл → вкл/.test(x)));
 assert.ok(difference.some(x=>/Титул чести: Нет титула → Сила познания/.test(x)));
 assert.equal(original.vitalsBuffs.guildHp,0);
 assert.equal(original.attributeBuffs.combatLunge,false);
});
test('unrelated and obsolete gemstone keys are not compared as equipped',()=>{
 const a={...original,gems:{...original.gems,'1:777':{type:'magical',element:'ice'}}};
 assert.deepEqual(compare(a,original),[]);
});
test('legacy missing buff fields compare the same as default OFF and zero',()=>{
 assert.deepEqual(compare({gender:0},{gender:0}),[]);
 assert.deepEqual(compare({}, {gender:0}),[],'legacy unspecified gender means default female');
 assert.deepEqual(compare(original,structuredClone(original)),[]);
});
test('English comparison has player-friendly labels and translated honor titles',()=>{
 const next=structuredClone(original);next.gender=1;
 next.attributeBuffs.honorTitle=1;next.vitalsBuffs.lifeSign=true;
 next.gems['0:10']={type:'magical',element:'fire'};
 const output=compare(original,next,'en');
 assert.ok(output.some(x=>x.includes('Gem: Weapon: Physical · Ice → Magical · Fire')));
 assert.ok(output.some(x=>x.includes('Honor title: None → Curiosity')));
 assert.ok(output.some(x=>x.includes('Sign of Life: off → on')));
 assert.ok(output.some(x=>x.includes('Character gender: female → male')));
});
test('the comparison helper is loaded before the main app and included in saved build comparison',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(html.indexOf('build-comparison.js?v=')<html.indexOf('src="app.js?v='));
 assert.match(app,/PandoraBuildComparison\.describe\(a,b/);
});

test('saved gear and Soul identities use OS names instead of falsely saying empty',()=>{
 const name=root.PandoraBuildComparison.savedItemName;
 const equipment=JSON.parse(readFileSync(new URL('../data/os/items.json',import.meta.url),'utf8'));
 const souls=JSON.parse(readFileSync(new URL('../data/os/souls.json',import.meta.url),'utf8'));
 assert.equal(name({id:1},equipment),equipment['1'].name);
 assert.equal(name({id:103013},souls,{kind:'soul'}),souls['103013'].name);
 assert.equal(name({id:987654},equipment),'Предмет №987654');
 assert.equal(name(null,equipment),'пусто');
 assert.equal(name({id:987654},equipment,{lang:'en'}),'Item #987654');
 assert.equal(name({id:1,name:'Obsolete copied name'},equipment),equipment['1'].name);
 assert.equal(name({id:'not-an-id',name:'Old custom gear'},equipment),'Old custom gear');
});
test('main build diff now compares race and resolves equipment/Soul names from the source catalogs',()=>{
 const code=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const from=code.indexOf('function compareSnapshots(a,b){');
 const to=code.indexOf('function restoreLoadedBuildUI(){',from);
 assert.ok(from>0&&to>from);
 const part=code.slice(from,to);
 assert.match(part,/races\[a\.race\]/);
 assert.match(part,/PandoraBuildComparison\.savedItemName/);
 assert.match(part,/kind==='soul'\?catalog\.souls:catalog\.equipment/);
 assert.doesNotMatch(part,/x\?\.name\|\|'пусто'/);
 assert.doesNotMatch(part,/xa\[s\]\?\.name\|\|'пусто'/);
});
