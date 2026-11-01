import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=p=>readFileSync(new URL(p,root),'utf8');
test('character portrait, Origin stats, and Hero Path are the core single-screen editor',()=>{
 const html=source('index.html'),app=source('app.js'),css=source('style.css');
 for(const id of ['workspace','originPanelStats','skillBranches','stagePicker','railLeft','railRight','detailPanel','dockClose','dockTabs'])
  assert.match(html,new RegExp('id="'+id+'"'));
 for(const tab of ['builds','wiki'])
  assert.match(html,new RegExp('role="tab" data-tab="'+tab+'"'));
 assert.doesNotMatch(html,/role="tab" data-tab="(?:character|equipment)"/);
 assert.doesNotMatch(html,/<nav id="nav">[^\n]*data-tab="equipment"/);
 assert.doesNotMatch(html,/<nav id="nav">[^\n]*data-tab="character"/);
 assert.doesNotMatch(html,/data-tab="(?:skills|stats)"/);
 assert.doesNotMatch(html,/id="stageQuickbar"/);
 assert.match(app,/function renderBranches\(/);
 assert.match(source('hero-path.js'),/path-skill-card/);
 assert.match(app,/function showWorkbench\(/);
 assert.match(app,/function closeWorkbench\(/);
 assert.match(css,/\.detail\.is-open\s*\{/);
 assert.match(css,/\.workspace>\.left,\.workspace>\.right/);
});
test('release identifiers match every loaded client asset',()=>{
 const html=source('index.html'),v=JSON.parse(source('site-version.json')).release;
 const pkg=JSON.parse(source('package.json'));
 assert.equal(pkg.pandoraRelease,v);
 assert.match(html,new RegExp('ps-studio-release" content="'+v.replaceAll('.','\\.')+'"'));
 const refs=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(refs.length>=10);
 for(const ref of refs)assert.ok(ref.endsWith('?v='+v),ref);
});

test('character workshop no longer exposes duplicate skills/stat point editors',()=>{
 const app=source('app.js'),html=source('index.html');
 assert.match(app,/const selection=\[\["character","Персонаж"\],\["profile","Профиль"\]\]/);
 assert.doesNotMatch(app,/if\(characterPanelTab==="skills"\)renderSkills\(body\)/);
 assert.doesNotMatch(app,/if\(characterPanelTab==="stats"\)renderStats\(body\)/);
 assert.doesNotMatch(app,/\$\("branchValue"\)/);
 assert.match(app,/Путь героя · умения/);
 assert.match(html,/id="pathSkillsPage"/);
});
