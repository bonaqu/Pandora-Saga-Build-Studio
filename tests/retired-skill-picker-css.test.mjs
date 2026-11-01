import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const css=read('style.css'),html=read('index.html');
const abandoned=['path-milestone-picker','path-milestone-choice','path-milestone-dismiss',
 'path-milestone-choice-body','inline-branch-controls'];
test('old grouped skill-picker CSS is unreachable and removed, without deleting current tree UI',()=>{
 const scriptSources=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map(m=>m[1].split('?')[0]).filter(path=>existsSync(new URL('../'+path,import.meta.url)));
 for(const path of scriptSources){
  const source=read(path);
  for(const old of abandoned)assert.ok(!source.includes(old),path+' still creates '+old);
 }
 for(const old of abandoned)assert.ok(!css.includes(old),'Retired CSS selector '+old);
 for(const active of ['path-integrated-track','path-integrated-milestones','path-current-notch',
  'path-unlock-notch','path-unlock-details','path-skill-preview-item','path-point-controls']){
  assert.ok(css.includes(active),'Current UI style '+active+' must remain');
 }
 assert.match(html,/hero-path\.js\?v=2026\.11\.01\.252/);
});
