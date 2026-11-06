import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const path=read('pandora-studio-hero-path.js'),app=read('pandora-studio-app.js'),
 equipment=read('pandora-studio-equipment-ui.js'),css=read('pandora-studio-theme.css'),
 html=read('index.html');

test('skill group displays independently calculated mastered, learned and manually invested totals',()=>{
 assert.match(path,/const mastered=branchKeys\.reduce\(\(sum,key\)=>sum\+M\.branchMastery\(state,key,innate,caps\),0\)/);
 assert.match(path,/const learned=branchKeys\.reduce\(\(sum,key\)=>sum\+M\.branchPotential\(state,key,innate,caps\),0\)/);
 assert.match(path,/tr\(api,'освоено ','trained '\)\+mastered/);
 assert.match(path,/tr\(api,' · изучено ',' · learned '\)\+learned/);
 assert.match(path,/tr\(api,' · вложено ',' · invested '\)\+spent/);
});
test('milestone labels consistently distinguish initial, invested, class cap and absolute threshold',()=>{
 for(const fragment of [
  "'Начально (оч.): '","' · Вложено (оч.): '",
  "' оч. ветки'","' оч.'","'Лимит (оч.): '"
 ])assert.ok(path.includes(fragment),fragment);
 assert.ok(!path.includes("'Старт: '"),'Outdated start legend must not remain');
 assert.ok(!path.includes("'Предел: '"),'Outdated potential legend must not remain');
 assert.ok(!path.includes("' очков ветки'"),'Wrong long-form threshold must not remain');
 assert.match(path,/const neededInvestment=Math\.max\(0,threshold-base\)/);
 assert.match(path,/Очки умений, распределяемые при развитии персонажа/);
 assert.match(path,/Растёт при использовании умений этой ветки, а также соответствующих типов атак или оружия/);
});
test('outfit mirrored pants has a lock but stays an interactive, nonduplicated slot',()=>{
 assert.match(app,/class:'equipment-slot'\+\(item\?' equipped'/);
 assert.match(app,/class:'stage-shared-mark',text:'🔒'/);
 assert.match(app,/stageSlotView=shared\?'choose':state\.equipment\?\.\[i\]\?'details':'choose'/);
 assert.match(app,/if\(selectedSlot===5&&oldDress\)/);
 assert.match(css,/\.equipment-slot\.shared-outfit\{/);
 assert.match(css,/\.shared-outfit .equipped-icon/);
 assert.doesNotMatch(app,/disabled:shared/);
});
test('only compatible equipment rows show source-backed Soul slot counts',()=>{
 assert.match(app,/const socketCount=window\.PandoraEquipmentPlan\.supportsSoulSlot\(key\)\?/);
 assert.match(app,/const meta=window\.PandoraEquipmentPlan\.supportsSoulSlot\(key\)\?/);
 assert.match(app,/ · Слоты: /);
 assert.match(app,/ · Slots: /);
 assert.match(app,/class:'stage-picker-item-label'/);
});
test('refinement wraps without clipping and seven canonical game elements fill rows',()=>{
 const host={};Function('window',read('pandora-studio-enchantment.js'))(host);
 assert.deepEqual(host.PandoraEnchantModel.elements.map(e=>e.id),
 ['fire','ice','lightning','poison','light','dark','rainbow']);
 assert.match(equipment,/for\(let n=0;n<=10;n\+\+\)/);
 assert.match(css,/\.stage-rich-body \.stage-grade\{\s*display:flex;flex-wrap:wrap/);
 assert.match(css,/\.stage-rich-body \.stage-enchant-options\.is-element-options\{\s*display:flex;flex-wrap:wrap/);
 assert.match(css,/\.stage-rich-body \.stage-enchant-options\.is-element-options button\{\s*flex:1 1/);
 assert.match(equipment,/elementIcons=\{fire:'🔥',ice:'❄️',lightning:'⚡',poison:'☠️'/);
 assert.match(equipment,/light:'☀️',dark:'🌑',rainbow:'🌈'/);
 assert.match(equipment,/onclick:\(\)=>api\.assignGem\(\{type:key==='type'/);
 assert.match(equipment,/aria-pressed/);
});
test('site shell has clean title/footer; counts remain grounded in loaded catalog and archive alert stays',()=>{
 assert.match(html,/BUILD STUDIO<small>CHARACTER PLANNER<\/small>/);
 assert.ok(!html.includes('VINTAGE · CHARACTER PLANNER'));
 assert.match(html,/<span id="iconStatus" hidden aria-hidden="true"><\/span>/);
 assert.match(app,/Наша база данных состоит из: /);
 assert.match(app,/data\.meta\.counts\.skills/);
 assert.match(app,/data\.meta\.counts\.items/);
 assert.match(app,/data\.meta\.counts\.souls/);
 assert.ok(!app.includes("'Cloudflare D1 · актуальный опубликованный каталог'"));
 assert.match(app,/\$\('siteNotice'\)\.textContent=archive\?/);
 assert.match(html,/2026\.11\.06\.393/);
});
