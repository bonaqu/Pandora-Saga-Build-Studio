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
 assert.doesNotMatch(app,/scrollIntoView\(/);
});
test('source preview must not claim calculated combat stats',()=>{
 const attrs=get('stage-attributes.js');
 assert.match(attrs,/Это не рассчитанные характеристики персонажа/);
 assert.match(attrs,/Итоговые HP\/MP/);
 assert.match(attrs,/Итоговые HP\/MP, сопротивления, криты/);
 assert.match(attrs,/rec\.effects/);
});
test('reloading preserves portrait attribute page independently of build',()=>{
 const app=get('app.js');
 assert.match(app,/attributes:stageAttributesPage/);
 assert.match(app,/stageAttributesPage=\['attack','defense','effects'\]/);
 assert.match(app,/window\.addEventListener\('pagehide',saveView\)/);
 assert.match(app,/sessionStorage\.setItem\(VIEW_KEY/);
});
test('version metadata and cached script references agree',()=>{
 const html=get('index.html'),v=JSON.parse(get('site-version.json')).release;
 const pkg=JSON.parse(get('package.json'));
 assert.match(v,/^2026\.10\.30\.\d+$/);
 assert.equal(v,pkg.pandoraRelease);
 const resources=[...html.matchAll(/(?:src|href)="[^"]+\.(?:css|js)\?v=([^"]+)"/g)];
 assert.ok(resources.length>=10);
 assert.ok(resources.every(x=>x[1]===v));
});
