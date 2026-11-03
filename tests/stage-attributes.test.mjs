import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');

test('character portrait can toggle source-backed stats without page scroll',()=>{
 const app=get('pandora-studio-app.js'),html=get('index.html'),attrs=get('pandora-studio-hero-book.js');
 assert.match(html,/id="stageAttributes"/);
 assert.doesNotMatch(html,/id="stageAttributeToggle"/);
 assert.match(html,/id="hero"[^>]*role="button"/);
 assert.match(html,/pandora-studio-hero-book\.js\?v=/);
 assert.match(app,/function renderStageAttributes\(/);
 assert.match(app,/window\.PandoraStageAttributes\.render/);
 assert.match(attrs,/\['attack','Атака'\]/);
 assert.match(attrs,/\['defense','Защита'\]/);
 assert.match(attrs,/\['effects','Эффекты умений'\]/);
 assert.match(app,/function renderStageAttributes\(/);
});
test('Hero Book summary groups source-backed results and navigates to relevant chapters',()=>{
 const attrs=get('pandora-studio-hero-book.js'),css=get('pandora-studio-theme.css');
 assert.match(attrs,/function summaryPage\(body,calc,options=\{\}\)/);
 assert.match(attrs,/class:'stage-result-section'/);
 assert.match(attrs,/class:'stage-result-section-head'/);
 assert.doesNotMatch(attrs,/onclick:\(\)=>onPage\(group\.page\)/);
 assert.match(attrs,/summaryPage\(body,modifiers,copyOptions\)/);
 assert.match(css,/\.stage-result-section-head/);
 assert.match(attrs,/class:'stage-buff-overview'/);
 assert.doesNotMatch(attrs,/stage-book-buff-optional/);
 assert.doesNotMatch(css,/\.stage-book-buff-optional/);
 assert.match(css,/\.stage-skill-effect-row/);
});
test('partial combat preview does not imply fully verified combat stats',()=>{
 const attrs=get('pandora-studio-hero-book.js');
 assert.match(attrs,/Подробнее о точности расчёта/);
 assert.match(attrs,/Известные бонусы снаряжения и душ/);
 assert.match(attrs,/chosen==='effects'/);
 assert.doesNotMatch(attrs,/appendCombatFormulas|appendVitalFormulas/);
 assert.doesNotMatch(attrs,/const effects=Array\.isArray\(rec\.effects\)/);
});
test('reloading preserves portrait attribute page independently of build',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/attributes:stageAttributesPage/);
 assert.match(app,/stageAttributesPage=\['summary','attack','defense','buffs','effects','recovery'\]/);
 assert.match(app,/window\.addEventListener\('pagehide',saveView\)/);
 assert.match(app,/sessionStorage\.setItem\(VIEW_KEY/);
});
test('version metadata and cached script references agree',()=>{
 const html=get('index.html'),v=JSON.parse(get('site-version.json')).release;
 const pkg=JSON.parse(get('package.json'));
 assert.match(v,/^\d{4}\.\d{1,2}\.\d{1,2}\.\d+$/);
 assert.equal(v,pkg.pandoraRelease);
 const resources=[...html.matchAll(/(?:src|href)="[^"]+\.(?:css|js)\?v=([^"]+)"/g)];
 assert.ok(resources.length>=10);
 assert.ok(resources.every(x=>x[1]===v));
});
