import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');

test('character portrait can toggle source-backed stats without page scroll',()=>{
 const app=get('app.js'),html=get('index.html'),attrs=get('stage-attributes.js');
 assert.match(html,/id="stageAttributes"/);
 assert.match(html,/id="stageAttributeToggle"/);
 assert.match(html,/stage-attributes\.js\?v=/);
 assert.match(app,/function renderStageAttributes\(/);
 assert.match(app,/window\.PandoraStageAttributes\.render/);
 assert.match(attrs,/\['attack','Атака'\]/);
 assert.match(attrs,/\['defense','Защита'\]/);
 assert.match(attrs,/\['effects','Эффекты'\]/);
 assert.match(app,/function renderStageAttributes\(/);
});
test('partial combat preview does not imply fully verified combat stats',()=>{
 const attrs=get('stage-attributes.js');
 assert.match(attrs,/частичный расчёт/);
 assert.match(attrs,/Известные бонусы снаряжения и душ/);
 assert.match(attrs,/серверных условий/);
 assert.match(attrs,/rec\.effects/);
});
test('reloading preserves portrait attribute page independently of build',()=>{
 const app=get('app.js');
 assert.match(app,/attributes:stageAttributesPage/);
 assert.match(app,/stageAttributesPage=\['summary','attack','defense','recovery','effects','buffs'\]/);
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
