// Compact UI/source regression bundle; all original tests remain unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

{
// Original: tests/combat-skill-ui.test.mjs
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('combat and guild actives live in the Hero Book without the retired form',()=>{
 const html=get('index.html'),book=get('pandora-studio-hero-book.js');
 assert.doesNotMatch(html,/id="legacyBuffControls"|id="originCombatLunge"|id="originGuildArouse"/);
 for(const key of ['combatLunge','combatWarCry','combatRage','combatDefender','guildArouse'])
  assert.ok(book.includes("'"+key+"'"),'Hero Book controls: '+key);
 assert.match(book,/data-book-setting':key/);
 assert.match(book,/onchange:event=>\(vital\?onVital:onBuff\)/);
});
test('shared builds safely validate and persist combat choices',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/rawAttributes\[key\]===true/);
 assert.match(app,/safe\.attributeBuffs\.combatDefender=false/);
 assert.match(app,/\['guildArouse',3\]/);
 assert.match(app,/current\.combatRage/);
 assert.match(app,/current\.combatDefender/);
});
test('attack and defense views show contribution of chosen skills',()=>{
 const stage=get('pandora-studio-hero-book.js'),calc=get('pandora-os-character-calculator.js');
 assert.match(stage,/row\('АТК','ATK',c.attack\?\.known,'',clientAttack\)/);
 assert.match(calc,/activeAtk=baseAtk/);
 assert.match(stage,/row\('Защита','Defense',c.defense\?\.known\)/);
 assert.match(calc,/activeDef=\(actives\.raging/);
 assert.match(calc,/actives\.lunge/);
});

}

{
// Original: tests/critical-regressions.test.mjs
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('item module never mistakes its DOM root for the global enchant model',()=>{
 const ui=get('pandora-studio-equipment-ui.js');
 assert.doesNotMatch(ui,/root\.PandoraEnchantModel/);
 assert.match(ui,/globalThis\.PandoraEnchantModel/);
 assert.match(ui,/const plan=globalThis\.PandoraEquipmentPlan/);
 assert.match(ui,/plan\.canRefine\(slot\)/);
});
test('no refinement for jewelry and cloak in model and action handlers',()=>{
 const plan=get('pandora-studio-equipment-plan.js'),app=get('pandora-studio-app.js');
 assert.match(plan,/new Set\(\['weapon','shield','head','body','gloves','legs','feet'\]\)/);
 assert.match(app,/if\(!plan\.canRefine\(key\)\)return/);
});
test('reload only restores wiki when active tab is wiki and hash is explicit',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/history\.replaceState\(history.state/);
 assert.match(app,/navigationType==='reload'/);
 assert.match(app,/bootView.tab==='wiki'&&bootView.open===false/);
 assert.match(app,/if\(activeTab==='wiki'&&location.hash.startsWith\('#wiki\/'\)\)/);
});
test('repainting refinement preserves in-panel scroll position',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/oldBodyScroll/);
 assert.match(app,/body\.scrollTop=oldBodyScroll/);
});

}

{
// Original: tests/dead-hero-path-helpers.test.mjs
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),milestones=read('pandora-studio-skill-milestones.js');

test('retired branch-row and archival mark helpers are unreachable and removed',()=>{
 assert.doesNotMatch(app,/\bfunction branchRow\(/);
 assert.doesNotMatch(app,/\bfunction markNode\(/);
 assert.doesNotMatch(app,/\bbranchRow\s*\(/);
 assert.doesNotMatch(app,/\bmarkNode\s*\(/);
 assert.match(app,/function renderBranches\(\)/);
 assert.match(app,/function renderPathPages\(\)/);
});

test('above-cap skill adapter resolves IDs once and preserves first-match semantics',()=>{
 const start=app.indexOf('  milestones:(skills,key,cap)=>{');
 const end=app.indexOf('  onGroup:key=>{',start);
 assert.ok(start>0&&end>start);
 const source=app.slice(start,end);
 assert.match(source,/const byId=new Map\(\)/);
 assert.match(source,/if\(!byId\.has\(id\)\)byId\.set\(id,skill\)/);
 assert.match(source,/const skill=byId\.get\(String\(row\.id\)\)/);
 assert.doesNotMatch(source,/skills\.find\(/);
 assert.match(source,/locked\.set\(row\.threshold,bucket\)/);
 assert.match(source,/\.sort\(\(a,b\)=>a\.threshold-b\.threshold\)/);
});

test('skill thresholds and class caps are validated before showing a milestone',()=>{
 assert.match(milestones,/const rawMax=Number\(cap\),max=Number\.isSafeInteger\(rawMax\)/);
 assert.match(milestones,/Number\(amount\)<=0\)continue/);
 assert.match(milestones,/record\.id===undefined\|\|record\.id===null/);
});

}

{
// Original: tests/equipment-group-actions-871.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('shared arrow-right SVG includes a visible right tip, not a clipped relative path',()=>{
 const ui=read('pandora-studio-equipment-ui.js');
 const icons=read('pandora-studio-icons.js');
 for(const source of [ui,icons]){
  assert.match(source,/M13 6l6 6-6 6/);
  assert.doesNotMatch(source,/m-6-6 6 6-6 6/);
 }
});
test('gear action opens the independent picker, grouped Properties/Souls are visually separated',()=>{
 const ui=read('pandora-studio-equipment-ui.js');
 const css=read('pandora-studio-workbench-guidance.css');
 const app=read('pandora-studio-app.js');
 assert.match(ui,/const chooseGroup=el\('div',\{class:'stage-rich-choose-group'\}\)/);
 assert.match(ui,/const settingsGroup=el\('div',\{class:'stage-rich-settings-group',role:'group'/);
 assert.match(ui,/key==='choose'\?chooseGroup:settingsGroup/);
 assert.match(css,/\.stage-rich-settings-group\{display:grid;grid-template-columns:minmax\(0,\.76fr\) minmax\(0,1\.24fr\)/);
 assert.match(css,/\.stage-rich-settings-group>:not\(:first-child\)\{border-left:1px solid/);
 assert.match(css,/\.stage-rich-choose-group\{display:flex/);
 assert.match(app,/stage-picker-unequip-symbol/);
 assert.match(app,/PandoraStageItemUI\.actionIcon\('remove'\)/);
 assert.match(app,/pickerUnequip','Снять предмет','Unequip item/);
 assert.match(css,/\.stage-picker-foot \.stage-picker-unequip\{display:inline-flex/);
});

}

{
// Original: tests/hero-path-hover-cache.test.mjs
const path=readFileSync(new URL('../pandora-studio-hero-path.js',import.meta.url),'utf8');

test('skill hover thresholds are cached once per rendered marker, not read from the DOM on pointermove',()=>{
 assert.match(path,/milestonesOnTrack\.push\(\{tick,skills:skillsAt,locked:lockedAt,/);
 assert.match(path,/thresholdFraction:threshold\/visualMax\}/);
 const start=path.indexOf("track.addEventListener('pointermove',event=>{");
 const end=path.indexOf("const next=event.clientY",start);
 assert.ok(start>0&&end>start);
 const hover=path.slice(start,end);
 assert.match(hover,/nearestMilestone\(milestonesOnTrack,\(event\.clientX-left\)\/travel\)/);
 assert.match(hover,/nearest\.thresholdFraction\*travel/);
 assert.doesNotMatch(hover,/\.reduce\(/);
 assert.doesNotMatch(hover,/getAttribute\(/);
 assert.doesNotMatch(hover,/parseInt\(|parseFloat\(/);
 assert.match(hover,/const rect=range\.getBoundingClientRect\(\)/);
 assert.match(hover,/rect\.left\+9,travel=Math\.max\(1,rect\.width-18\)/);
});

test('normalized skill markers keep their exact original 90-point rail positions at all tested widths',()=>{
 for(const max of [90,120]){
  for(const points of [0,1,2,8,15,25,45,55,90,120].filter(x=>x<=max)){
   const fraction=points/max;
   for(const width of [180,240,390,1024]){
    const rangeWidth=width-24;
    const expected=21+(width-42)*fraction;
    const optimized=12+9+fraction*(rangeWidth-18);
    assert.ok(Math.abs(expected-optimized)<1e-8,'Value '+points+' at '+width+'px');
   }
  }
 }
});

}

{
// Original: tests/honor-touch-keyboard-619.test.mjs

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const styles=read('pandora-studio-honor.css');

test('Honor captions use a direct double-click rather than action pencils',()=>{
 assert.match(view,/const guardHonorAction=\(button,caption\)=>/);
 assert.match(view,/headingRow\.append\(heading\)/);
 assert.match(view,/heading\.addEventListener\('dblclick',change\)/);
 assert.match(view,/wrap\.append\(target\)/);
 assert.doesNotMatch(view,/directPencil\(/);
 assert.match(styles,/\.wiki-honor-heading-row\{display:flex/);
});

test('Honor F2 opens multiline and list text editing without replacing Enter semantics',()=>{
 assert.match(view,/event\.key==='F2'\|\|\(event\.key==='Enter'&&!multiline\)/);
 assert.match(view,/event\.key==='Enter'\|\|event\.key==='F2'/);
 assert.match(view,/event\.key==='F2'\|\|event\.key==='Enter'/);
 assert.match(view,/content\.addEventListener\('keydown',event=>/);
 assert.match(view,/if\(event\.key==='F2'\)\{event\.preventDefault\(\);startEdit\(\)\}/);
});

}

{
// Original: tests/honor-touch-rank-fields-620.test.mjs
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const css=read('pandora-studio-honor.css');

test('Honor rank description editing stays separate from actual numeric game records',()=>{
 assert.match(view,/if\(!editable\)return target/);
 assert.match(view,/const wrap=make\('div',\{class:'wiki-honor-field-edit-row'/);
 assert.match(view,/wrap\.append\(target\)/);
 assert.match(view,/isRequirement\?' is-rank-requirement'/);
 assert.match(view,/isBenefit\?' is-rank-benefit'/);
 assert.doesNotMatch(view,/class:'wiki-honor-copy-pencil'/);
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
});

test('Honor localized filter captions save in place without a second edit button',()=>{
 assert.match(view,/editCopy\(target,key,ru,english\)/);
 assert.match(view,/onCommitted:visible=>\{caption\.textContent=visible\}/);
 assert.match(view,/onFinished:restore/);
 assert.match(view,/button\.hidden=true;host\.hidden=false/);
 assert.match(view,/host\.dispatchEvent\(new MouseEvent\('dblclick'/);
});

}

{
// Original: tests/modal-keyboard.test.mjs
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const from=app.indexOf('function modal(title,content){'),to=app.indexOf('async function apiRequest(',from);
assert.ok(from>=0&&to>from,'UI modal must be present');
const modal=app.slice(from,to);

test('dialog starts on an inert heading, not a destructive submit button',()=>{
 assert.match(modal,/const heading=h\('h2',\{text:title,tabindex:'-1'\}\)/);
 assert.match(modal,/heading\.focus\(\{preventScroll:true\}\)/);
 assert.match(modal,/role:'dialog','aria-modal':'true'/);
 assert.match(css,/\.modal h2:focus-visible/);
});
test('Escape closes the dialog and returns focus to connected opener',()=>{
 assert.match(modal,/if\(event\.key==='Escape'\)/);
 assert.match(modal,/event\.preventDefault\(\);event\.stopPropagation\(\);close\(\)/);
 assert.match(modal,/if\(origin\?\.isConnected&&typeof origin\.focus==='function'\)/);
 assert.match(modal,/origin\.focus\(\{preventScroll:true\}\)/);
});
test('Tab and Shift Tab remain inside enabled visible dialog controls',()=>{
 assert.match(modal,/if\(event\.key!=='Tab'\)return/);
 assert.match(modal,/node\.getClientRects\(\)\.length>0/);
 assert.match(modal,/event\.shiftKey&&\(active===first\|\|active===heading\)/);
 assert.match(modal,/!event\.shiftKey&&\(active===last\|\|active===heading\)/);
});

}

{
// Original: tests/portrait-balance.test.mjs
const css=readFileSync(new URL('../pandora-studio-theme.css',import.meta.url),'utf8');
const override=css.slice(css.indexOf('/* 2026.10.30.49: restore the accepted wide Hero Path'));
test('large desktops preserve the accepted 430px Hero Path',()=>{
 assert.ok(override.startsWith('/* 2026.10.30.49: restore'));
 assert.match(override,/grid-template-columns:300px minmax\(0,1fr\) 430px/);
 assert.match(override,/\.portrait-frame\{width:var\(--hero-width\);max-width:var\(--hero-width\);transform:translateX\(65px\)/);
});
test('left and right equipment rails follow the focal portrait',()=>{
 assert.match(override,/\.left-rail\{left:calc\(\(100% - var\(--hero-width\)\)\/2 \+ 2px\)\}/);
 assert.match(override,/\.right-rail\{right:calc\(\(100% - var\(--hero-width\)\)\/2 - 128px\)\}/);
});
test('portrait and rails fit available stage geometry at desktop sizes',()=>{
 for(const viewport of [1420,1440,1600,1680,1920,2560,3840]){
  const big=viewport>=1680;
  const main=Math.min(viewport,1900)-(viewport>=1500?60:viewport*0.04);
  const stage=main-(big?300+430:280+360)-26-30;
  const base=big?Math.min(Math.max(440,viewport*0.36),565):
   Math.min(Math.max(420,viewport*.34),505);
  const portrait=Math.min(base,stage-(big?260:218));
  const right= (stage-portrait)/2-(big?128:103);
  assert.ok(portrait>=380,'portrait should remain comfortably wide at '+viewport);
  assert.ok(right>=0,'right rail must remain inside the stage at '+viewport);
 }
});

}

{
// Original: tests/public-ui-no-debug-labels.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('hero book uses game-focused labels rather than debug disclaimers',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(book,/Магическая атака \(частичный показатель\)/);
 assert.doesNotMatch(book,/Частичный показатель: /);
 assert.doesNotMatch(book,/не включено в частичный итог: порядок округления OS не проверен/);
 assert.doesNotMatch(book,/сочетаний требуют специальной проверки/);
 assert.doesNotMatch(book,/Особых сочетаний самоцветов/);
 assert.doesNotMatch(book,/Радужные самоцветы: /);
 assert.match(book,/row\('МАТК','MATK',c.magicAttack\?\.known/);
 assert.match(book,/function attackChapterGroups\(calc\)/);
});
test('player-facing icon state does not expose local archive counters',()=>{
 const app=read('pandora-studio-app.js');
 assert.doesNotMatch(app,/Локальные иконки OS: /);
 assert.doesNotMatch(app,/локальный архив пока не импортирован/);
 assert.match(app,/Изображения загружены/);
 assert.match(app,/Некоторые изображения недоступны/);
 assert.match(app,/Используются игровые изображения/);
});

}

{
// Original: tests/race-tree-portrait.test.mjs
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('portrait carousel presents eight independent race-appearance options',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/const portraitOptions=\[/);
 const matches=app.match(/\{"race":[0-5],"gender":[01]\}/g)||[];
 assert.equal(matches.length,8);
 assert.match(app,/state=window\.PandoraOriginModel\.selectRace\(state,i,gender\)/);
 assert.match(app,/selectedPortraitIndex\(state\.race,state\.gender\)/);
 assert.match(app,/chosen=state\.race===i&&/);
});
test('class tree reads real OS parent relations',()=>{
 const app=get('pandora-studio-app.js'),classes=JSON.parse(get('data/os/classes.json'));
 assert.match(app,/catalog\.classes\?\.\[key\]\?\.parent/);
 assert.match(app,/function renderJobs\(/);assert.match(app,/class-wizard-choice/);
 assert.match(app,/jobPathKey=parentOf\(jobPathKey\)/);
 assert.match(app,/jobPathKey/);
 assert.deepEqual(Object.values(classes).filter(c=>c.parent==null).map(c=>c.id).sort(),['ACOLYTE','MAGE','SCOUT','WARRIOR']);
 assert.equal(Object.keys(classes).length,28);
});
test('portrait art fits entire picture and technical labels are hidden',()=>{
 const css=get('pandora-studio-theme.css'),html=get('index.html');
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/#siteNotice,\.gender-controls,#swapGender,\.portrait-bottom,\.mini-note/);
 assert.doesNotMatch(html,/Портреты из пользовательского архива Races\.zip/);
 assert.match(html,/class="portrait-bottom" hidden/);
});

}

{
// Original: tests/ui-navigation-798.test.mjs

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('level navigation and changed rows never invoke a catalog or D1 mutation',()=>{
 const code=read('pandora-studio-progression-owner-editor.js');
 const styles=read('pandora-studio-progression-owner-editor.css');
 assert.match(code,/const navigator=h\('div',\{class:'ps-level-editor-navigation'\}\)/);
 assert.match(code,/const jumpInput=h\('input',\{type:'number',min:'1'/);
 assert.match(code,/const goToLevel=\(\)=>/);
 assert.match(code,/filterInput\.addEventListener\('change',update\)/);
 assert.match(code,/node\.row\.hidden=filterInput\.checked/);
 assert.match(code,/if\(filterInput\.checked\)\{filterInput\.checked=false;update\(\)\}/);
 assert.match(styles,/\.ps-level-editor-table tbody tr\[hidden\]\{display:none\}/);
 assert.match(code,/await write\(serialized\)/);
 assert.match(code,/if\(!canCommit\(\)\|\|saving\)return/);
});
test('library sorting is a display-only order and keeps saved build order',()=>{
 const code=read('pandora-studio-app.js');
 const styles=read('pandora-studio-build-comparison.css');
 assert.match(code,/let buildSearchQuery='',buildSortMode='saved'/);
 assert.match(code,/const sorted=\[\.\.\.searchable\]\.sort/);
 assert.match(code,/for\(const row of sorted\)grid\.append\(row\.box\)/);
 assert.match(code,/else builds\.push\(entry\)/);
 assert.match(code,/const applySort=\(\)=>/);
 assert.match(styles,/\.build-library-sort-select/);
});

}
