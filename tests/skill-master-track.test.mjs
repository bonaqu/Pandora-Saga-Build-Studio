import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,base),'utf8');
test('mastery, potential and skill icon milestones share a single visual track',()=>{
 const ui=read('hero-path.js'),css=read('style.css');
 assert.match(ui,/class:'inline-mastery-track path-integrated-track'/);
 assert.match(ui,/class:'inline-mastery-fill'/);
 assert.match(ui,/class:'inline-mastery-green'/);
 assert.match(ui,/track\.append\(bed,gold,green,locked\)/);
 assert.match(ui,/track\.append\(range\);paint\(\)/);
 assert.match(css,/\.inline-mastery-track \.inline-mastery-green/);
});
test('right side exposes free/spent/total budget and immediate branch allocation',()=>{
 const html=read('index.html'),app=read('app.js'),ui=read('hero-path.js');
 assert.match(html,/id="budgetState"/);
 for(const text of ['Свободно','Вложено','Всего'])assert.ok(app.includes(text));
 assert.match(ui,/onAllocate\(key,requested,final\)/);
 assert.match(app,/model\.canAllocate\(gameTables\?\.abilityPoint/);
 assert.match(ui,/onMastery\(key,Number\(input\.value\)\)/);
});
test('path has gallery with available/grey skill cards and both pages',()=>{
 const html=read('index.html'),ui=read('hero-path.js');
 assert.match(html,/id="pathSkillsPage"/);
 assert.match(html,/id="pathAutoMastery"/);
 assert.match(html,/id="pathSkillGallery"/);
 assert.doesNotMatch(html,/id="allSkills"/);
 assert.match(ui,/path-skill-card/);
 assert.match(ui,/readiness\(previous,api,chain\)/);
});

test('blue, amber, green are the SAME track rather than a second green bar',()=>{
 const css=read('style.css'),ui=read('hero-path.js');
 assert.match(css,/\.inline-mastery-track \.inline-mastery-green\{[^}]*top:76px;height:6px/);
 assert.match(css,/\.inline-mastery-fill\{[^}]*top:76px;height:6px/);
 assert.doesNotMatch(css,/\.inline-mastery-track \.inline-mastery-green\{[^}]*top:88px/);
 assert.match(ui,/track\.append\(bed,gold,green,locked\)/);
 assert.match(ui,/const invested=M\.potential\(state,key\),mastery=M\.trained\(state,key\)/);
});

test('one class-capped 90-point skill bar shows an unavailable red segment',()=>{
 const ui=read('hero-path.js'),css=read('style.css'),html=read('index.html'),app=read('app.js');
 assert.match(ui,/const visualMax=Math\.max\(90,cap,points\)/);
 assert.match(ui,/class:'inline-mastery-locked'/);
 assert.match(ui,/track\.append\(bed,gold,green,locked\)/);
 assert.match(css,/\.inline-mastery-track \.inline-mastery-locked/);
 assert.match(html,/id="pathResetPoints"/);
 assert.match(app,/\$\('pathResetPoints'\)\.onclick/);
 assert.doesNotMatch(ui,/for\(const \[title,step\]of\[\['−5'/);
});

test('skill-unlock icons use the full 90-point track scale even for low class caps',()=>{
 const ui=read('hero-path.js');
 assert.match(ui,/threshold\/visualMax\*100/);
 assert.doesNotMatch(ui,/button\.style\.left='clamp\(0px, '\+mark\.percent/);
});

test('one bar uses standard CSS calc and correctly centered milestone markers',()=>{
 const ui=read('hero-path.js'),css=read('style.css');
 assert.match(ui,/const lockedOffset=21-42\*lockedFraction/);
 assert.doesNotMatch(ui,/calc\(12px \+ \(100% - 24px\) \*/);
 assert.match(ui,/gold\.style\.width='calc\('/);
 assert.match(ui,/green\.style\.width='calc\('/);
 assert.match(ui,/tick\.style\.left=\(threshold\/visualMax\*100\)\.toFixed\(4\)/);
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{[\s\S]*?transform:translateX\(-50%\)/);
});
test('skill editor preserves keyboard focus across state re-render',()=>{
 const app=read('app.js'),ui=read('hero-path.js');
 for(const key of ['potential-range','potential-number','mastery-number'])
  assert.ok(ui.includes(':'+key),key);
 assert.match(app,/document\.activeElement\?\.getAttribute\?\.\('data-branch-control'\)/);
 assert.match(app,/focus\(\{preventScroll:true\}\)/);
});

test('skill details include source-backed mana, cast, cooldown and exact branch requirements',()=>{
 const ui=read('hero-path.js'),app=read('app.js');
 for(const field of ['skill.mana','skill.cast','skill.cooldown','skill.range',
  'skill.element','skill.powerStat'])
  assert.ok(ui.includes(field),field);
 assert.match(ui,/Требования по веткам/);
 assert.match(ui,/tr\(api,' · вложено ',' · spent '\)\+value/);
 assert.match(ui,/tr\(api,' · освоено ',' · trained '\)\+green/);
 assert.match(app,/skillWiki:skill=>wikiLink/);
 assert.match(ui,/api\.skillWiki\(skill\)/);
});

test('bug regression: range must not receive disabled="false" as a HTML boolean attribute',()=>{
 const hero=read('hero-path.js'),app=read('app.js');
 assert.match(hero,/e\[key\]=Boolean\(val\)/);
 // Non-boolean attributes must still be set normally.
 assert.match(hero,/else if\(val!==undefined&&val!==null\)e\.setAttribute\(key,String\(val\)\)/);
 assert.match(app,/el\[k\]=Boolean\(v\)/);
 assert.match(hero,/budget\.total!==null&&api\.allocationReady/);
 assert.match(app,/allocationReady:Boolean\(gameTables\?\.abilityPoint&&catalog\.classes\?\.\[klass\]\)/);
});
test('group headers are toggleable and can be completely collapsed',()=>{
 const app=read('app.js');
 assert.match(app,/const collapse=selectedSkillGroup===key/);
 assert.match(app,/selectedSkillGroup=collapse\?null:key/);
 assert.match(app,/const selected=groups\.find\(g=>g\.id===selectedSkillGroup\)\|\|null/);
 assert.match(app,/if\(selected&&\(inlineBranchId===null/);
 assert.match(app,/bootView\.groupTouched&&bootView\.skillGroup===null\?null/);
});

test('new job selects a usable group without deleting previous invested points',()=>{
 const app=read('app.js');
 assert.match(app,/function selectJob\(index\)/);
 assert.match(app,/selectedSkillGroup=null;inlineBranchId=null/);
 assert.match(app,/pathGroupTouched=false;selectedSkill=null/);
 assert.match(app,/selectJob\(current\.i\)/);
 assert.match(app,/selectJob\(node\.i\)/);
 assert.match(app,/!pathGroupTouched&&catalog\.classes\?\.\[jobKeys\[state\.job\]\]/);
 assert.match(app,/\.sort\(\(a,b\)=>b\.total-a\.total\)/);
});
test('red locked region shows OS skills beyond the class skill cap',()=>{
 const app=read('app.js'),ui=read('hero-path.js'),css=read('style.css');
 assert.match(app,/const \{milestones,above\}=window\.PandoraSkillMilestones\.forBranch/);
 assert.match(app,/locked:true/);
 assert.match(ui,/mark\.locked\?' unreachable'/);
 assert.match(ui,/if\(marks\.length\)\{/);
 assert.match(css,/inline-milestone\.unreachable/);
});
test('branch summary, green mastery and group totals update on input, not only change',()=>{
 const ui=read('hero-path.js');
 for(const part of ['groupCount.textContent=groupSummary()',
  "branchCount.textContent=cap?target+' / '+cap:'—'",
  'branchSummary.textContent=summaryText(target,M.trained(state,key))',
  'input.value=String(M.trained(state,key))'])
  assert.ok(ui.includes(part),part);
});

test('milestones are thin notches in one shared bar with skill descriptions on hover',()=>{
 const ui=read('hero-path.js'),app=read('app.js'),css=read('style.css');
 assert.match(ui,/path-unlock-notch/);
 assert.match(ui,/const thresholds=\[\.\.\.new Set\(marks\.map\(mark=>mark\.threshold\)\)\]/);
 assert.match(ui,/const preview=make\('div',\{class:'path-milestone-tooltip',role:'tooltip'\}\)/);
 assert.match(app,/path-skill-preview-item/);
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{/);
 assert.match(ui,/track\.addEventListener\('pointermove'/);
});

test('right Hero Path and skill list use one page scroll, no nested locked panels',()=>{
 const css=read('style.css');
 assert.match(css,/\.workspace>\.right\{max-height:none!important;height:auto;overflow:visible!important\}/);
 assert.match(css,/\.right \.branch-list\{max-height:none!important;height:auto;overflow:visible!important/);
 assert.match(css,/\.right \.path-skill-grid\{max-height:none;overflow:visible\}/);
});
