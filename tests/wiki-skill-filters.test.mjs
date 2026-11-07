import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const racialPassives=JSON.parse(read('data/os/racialPassives.json'));
const manifest=JSON.parse(read('assets/os-icon-manifest.json'));
const context={};
Function('window',read('pandora-studio-wiki-skill-filters.js'))(context);
const classifier=context.PandoraWikiSkillFilters;
const records=Object.values(skills);

test('question-mark filter describes the artwork shown, without implying that a skill is unused',()=>{
 assert.equal(classifier.names.unknown.ru,'Неуточнённые');
 assert.equal(classifier.names.unknown.en,'Unresolved');
 assert.equal(classifier.names.player.ru,'Умения персонажа');
 assert.deepEqual(classifier.names.racial,{ru:'Расовая пассивка',en:'Racial passive'});
 assert.deepEqual(classifier.names.special,{ru:'Особое',en:'Special'});
 assert.deepEqual(classifier.names.variants,{ru:'Дубли навыков',en:'Duplicate skills'});
 const model=classifier.build(skills,null,manifest,{},racialPassives);
 assert.equal(model.counts.unknown,59);
 assert.equal(model.missing('500000001'),true);
 assert.equal(model.matches('500000001','unknown'),true);
});
test('icon filter mirrors the question-mark fallback if the artwork manifest fails to load',()=>{
 const offline=classifier.build(skills,null,null,{},racialPassives);
 assert.equal(offline.counts.unknown,569);
 assert.equal(offline.missing('161202001'),true,
  'A known original is still rendered as question-mark when manifest is absent');
 const owner=classifier.build(skills,null,null,{'visual.skill.500000001':'assets/custom.webp'},racialPassives);
 assert.equal(owner.counts.unknown,568);
 assert.equal(owner.missing('500000001'),false);
});
test('new D1 skill without iconId stays in the question-mark filter despite a namesake donor',()=>{
 const snapshot={
  '1':{id:1,name:'Test skill',iconId:100000501,classes:{WARRIOR:1},learnable:true,branch:'slash'},
  '2':{id:2,name:'Test skill',iconId:null,classes:{},learnable:false,branch:'slash'}
 };
 const artifacts={icons:{skills:{skill_100000501:'assets/skills/icons/skill_100000501.webp'}},
  displayAliases:{skills:{}}};
 const model=classifier.build(snapshot,null,artifacts);
 assert.equal(model.missing('1'),false);
 assert.equal(model.missing('2'),true);
 assert.equal(model.group('2'),'variants');
});
test('regular player skills require both learnability and a real class assignment',()=>{
 const classified=classifier.build(skills,null,manifest,{},racialPassives);
 assert.equal(classified.total,569);
 assert.equal(classified.counts.racial,18);
 assert.equal(classified.counts.player,232);
 assert.equal(classified.group('161202001'),'player'); // Counterattack
 assert.equal(classified.group('161202050'),'variants'); // extra version with same name
 assert.equal(classified.counts.variants>100,true);
 assert.equal(classified.counts.player,232);
 assert.equal(classified.group('260006002'),'variants'); // legacy learnable flag, no assigned class
 assert.equal(classified.group('310023002'),'variants'); // Temple triggered effect
 assert.equal(classified.group('500000001'),'other'); // Sleep status, not player skill
 for(const [race,{skills:ids}] of Object.entries(racialPassives))
  for(const id of ids){
   assert.equal(classified.group(id),'racial',race+':'+id);
   assert.equal(classified.matches(id,'other'),false);
  }
 for(const id of ['500000002','500000025','500000029'])
  assert.equal(classified.group(id),'other','System record '+id);
 assert.equal(classifier.player(skills['260006002']),false);
 assert.equal(classifier.player(skills['260006001']),true);
});
test('guild ranks and siege skills remain usable as distinct encyclopedia records',()=>{
 const model=classifier.build(skills,null,manifest,{},racialPassives);
 for(const id of ['600000001','600000002','600000231','600000232',
  '610000231','610000232','620002011','620002012','620002031','620002032']){
  assert.equal(model.group(id),'guild',id);
 }
 assert.notEqual(model.group('700000022'),'guild',
  'Map system zones are not guild skills');
 assert.equal(model.matches('600000232','guild'),true);
 assert.equal(model.matches('600000232','variants'),false);
});
test('missing artwork filter is independent from gameplay category',()=>{
 const model=classifier.build(skills,null,manifest,{},racialPassives);
 assert.equal(model.missing('500000001'),true); // No original or alias for Sleep
 assert.equal(model.matches('500000001','unknown'),true);
 assert.equal(model.missing('600000232'),false); // Alias to rank I
 assert.equal(model.missing('161202050'),false); // Shared Counterattack
 assert.equal(model.missing('161202001'),false); // Original
 assert.equal(model.matches('161202001','all'),true);
 assert.equal(model.counts.all,model.counts.player+model.counts.racial+model.counts.guild+
  model.counts.special+model.counts.variants+model.counts.other);
});
test('owner image override removes a record from the missing artwork filter',()=>{
 const unknownId='500000001';
 const options={['visual.skill.'+unknownId]:'assets/custom/known.webp'};
 const model=classifier.build(skills,null,manifest,options,racialPassives);
 assert.equal(model.missing(unknownId),false);
});
test('source records remain searchable with variants without rewriting their IDs',()=>{
 // A full index requires source lists; verify the canonical search signature
 // in the current implementation instead of creating synthetic gameplay tables.
 const source=read('pandora-studio-encyclopedia-data.js');
 assert.match(source,/const expanded=type==='skill'&&options\.includeVariants===true/);
 assert.match(source,/expanded\?Object\.entries\(chapters\[type\]\|\|\{\}\):entries\[type\]\|\|\[\]/);
 const app=read('pandora-studio-app.js');
 assert.match(app,/wikiSkillFilter=\['player','racial','guild','special'/);
 assert.match(app,/includes\(bootView\.wikiSkillFilter\)\?bootView\.wikiSkillFilter:'player'/);
 assert.match(app,/wikiIndex\.search\(type,wikiSearch,id=>searchTerms\(type,id\),/);
 assert.match(app,/\{includeVariants:type==='skill'\}/);
 assert.match(app,/filterModel\.matches\(id,wikiSkillFilter\)/);
 assert.match(app,/wikiData\?\.racialPassives/);
 const html=read('index.html');
 assert.match(html,/pandora-studio-wiki-skill-filters\.js\?v=/);
 assert.ok(html.indexOf('pandora-studio-wiki-skill-filters.js')<
  html.indexOf('pandora-studio-app.js'),'Classifier should load before app module');
});
