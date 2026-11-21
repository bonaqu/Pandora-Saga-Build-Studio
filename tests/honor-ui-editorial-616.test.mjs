import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-honor.css');
const scope={};scope.window=scope;
runInNewContext(read('pandora-studio-honor-guide.js'),scope);

test('Honor UI captions have five stable, independent D1 RU/EN keys',()=>{
 const keys=['warsHeading','warEyebrow','subtitle','zonesHeading','rewardsHeading'];
 for(const key of keys){
  const normalized=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(scope.PandoraHonorGuide.validOverride('book.honor-view.'+normalized,
   JSON.stringify({ru:'Проверенная подпись',en:'Verified caption'})),true,key);
  assert.ok(view.includes("'"+key+"'"),key);
 }
 assert.match(app,/copy:\(key,ru,en\)=>ownerCopy\('honor-view',key,ru,en\)/);
 assert.match(app,/editCopy:\(node,key,ru,en,callbacks\)=>ownerCopyLabel\(node,'honor-view',key,ru,en,callbacks\)/);
 assert.match(app,/\^\(origin\|equipment\|path\|catalog-sync\|honor-view\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\)/);
 assert.match(app,/key\.startsWith\('book\.honor-view\.'\)/);
 assert.match(app,/guideedit\\\.book\\\.\(equipment\|path\|catalog-sync\|honor-view\|owner-dock\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\)/);
 assert.match(view,/editorial\('p','wiki-honor-subtitle','subtitle'/);
 assert.match(view,/editorial\('h5','',isZone\?'zonesHeading':'warsHeading'/);
 assert.match(view,/editorial\('small','','rewardsHeading'/);
});

test('Honor captions edit at their text, never via neighboring pencil',()=>{
 assert.match(view,/if\(editable\)editCopy\(element,key,ru,english\)/);
 assert.match(view,/target\.addEventListener\('dblclick',start\)/);
 assert.match(view,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(view,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.doesNotMatch(view,/directPencil|wiki-honor-copy-pencil/);
 assert.doesNotMatch(css,/wiki-honor-(?:copy-owner-label|copy-pencil|direct-pencil)/);
});

test('issue 390: PvP rewards and schedules expose D1 headings but not reward or count data',()=>{
 const fields=['sectionsHeading','pvpDailyHeading','pvpDailyColumn0',
  'pvpDailyColumn1','pvpWeeklyHeading','pvpWeeklyColumn0',
  'pvpWeeklyColumn1','pvpWeeklyColumn2','pvpDoubleRewards',
  'pvpHuntHeading','pvpHuntColumn0','pvpHuntColumn1','pvpHuntColumn2'];
 for(const field of fields){
  const key='book.honor-view.'+field.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.equal(scope.PandoraHonorGuide.validOverride(key,
   JSON.stringify({ru:'Подпись',en:'Caption'})),true,key);
 }
 assert.match(view,/editorial\('span','','sectionsHeading','Разделы','Sections'\)/);
 assert.match(view,/wiki-honor-live-count',' · '\+sidebar\.length/);
 assert.match(view,/group\.append\(editorial\('h5','wiki-honor-pvp-label'/);
 assert.match(view,/cell\.append\(editorial\('span','wiki-honor-table-caption'/);
 assert.match(view,/key\+'Column'\+index/);
 assert.match(view,/key\+'Heading'/);
 assert.match(view,/node\('td','',String\(value\)\)/);
 assert.doesNotMatch(view,/wiki-honor-pvp-pencil|sections-pencil/);
});

test('issue #390: Honor sidebar headings directly edit their shared Wiki labels',()=>{
 assert.match(view,/const navCaption=node\('span','wiki-honor-nav-caption'/);
 assert.match(view,/editLabel\(navCaption,'honor',id,initial\)/);
 assert.match(view,/navCaption\.addEventListener\('dblclick',edit\)/);
 assert.match(view,/guardCaptionAction\(jump,navCaption\)/);
 assert.match(view,/if\(event\.key==='F2'\)edit\(event\)/);
 // No sidebar editor may have independent keys that drift from article titles.
 assert.doesNotMatch(view,/ownerCopy\('honor-view','sidebar/);
});


test('issue #390: generated rank thresholds remain immutable while their RU/EN prose uses D1 captions',()=>{
 const fields=['rankReqTopLead','rankReqTopEnd','rankReqPointsLead',
  'rankReqPointsMiddle','rankReqGoldEnd','rankReqJoinNation',
  'rankReqGoldLead'];
 for(const field of fields){
  const key='book.honor-view.'+field.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(scope.PandoraHonorGuide.validOverride(key,
   JSON.stringify({ru:'Подпись',en:'Caption'})),true,key);
 }
 assert.match(view,/const authoredRequirement=en\?rank\.requirementEn:rank\.requirementRu/);
 assert.match(view,/if\(authoredRequirement\)/);
 assert.match(view,/requirement\.append\(editorial\('span','wiki-honor-requirement-copy'/);
 assert.match(view,/node\('span','wiki-honor-runtime-value',fmt\.format\(value\)\)/);
 assert.match(view,/number\(rank\.top\)/);
 assert.match(view,/number\(rank\.points\)/);
 assert.match(view,/number\(rank\.gold\)/);
 assert.doesNotMatch(view,/const defaultRequirement=rank\.top/);
 assert.doesNotMatch(view,/wiki-honor-requirement-pencil/);
});

test('legacy authored rank requirements retain the original fields without altering source numbers',()=>{
 const old={
  'guideedit.honor.rank.2':JSON.stringify({
   requirementRu:'Архивное описание ранга',
   requirementEn:'Legacy authored rank requirement'
  })
 };
 const rank=scope.PandoraHonorGuide.article(old).ranks.find(entry=>entry.id===2);
 assert.equal(rank.requirementRu,'Архивное описание ранга');
 assert.equal(rank.requirementEn,'Legacy authored rank requirement');
 assert.equal(rank.points,3000);
 assert.equal(rank.gold,20000);
 assert.match(view,/if\(authoredRequirement\)/);
});
