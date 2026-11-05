import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('rich item and soul previews have one deliberate mouse hover delay',()=>{
 const ui=read('pandora-studio-equipment-ui.js');
 const match=ui.match(/const ITEM_PREVIEW_HOVER_DELAY_MS=(\d+);/);
 assert.ok(match,'Hover delay is a shared named policy');
 const delay=Number(match[1]);
 assert.ok(delay>=450&&delay<=900,'Hover should prevent accidental flashes but stay responsive');
 assert.match(ui,/target\.addEventListener\('pointerenter',event=>\{/);
 assert.match(ui,/if\(event\.pointerType==='touch'\)return/);
 assert.match(ui,/const timer=setTimeout\(\(\)=>\{/);
 assert.match(ui,/\},ITEM_PREVIEW_HOVER_DELAY_MS\)/);
 assert.match(ui,/target\.isConnected&&target\.matches\(':hover'\)/);
 assert.doesNotMatch(ui,/addEventListener\('mouseenter',show\)/,
  'Immediate mouseenter previews must never be reintroduced');
});

test('hover lifecycle cancels stale previews and retains instant keyboard accessibility',()=>{
 const ui=read('pandora-studio-equipment-ui.js');
 for(const event of ['pointerleave','pointerdown','blur','click'])
  assert.ok(ui.includes("target.addEventListener('"+event+"',remove)"),event);
 for(const event of ['hashchange','popstate','blur'])
  assert.ok(ui.includes("root.addEventListener?.('"+event+"',dismissPreview)"),event);
 assert.match(ui,/document\.addEventListener\?\.\('scroll',\(\)=>\{/);
 assert.match(ui,/if\(target\.isConnected&&target\.matches\(':hover'\)\)queuePreview\(target,show\)/);
 assert.match(ui,/document\.addEventListener\?\.\('visibilitychange'/);
 assert.match(ui,/clearTimeout\(pendingPreview\.timer\)/);
 assert.match(ui,/if\(target\.matches\(':focus-visible'\)\)show\(\)/);
 assert.match(ui,/target\.setAttribute\('aria-describedby',tip\.id\)/);
 assert.match(ui,/liveTarget\?\.removeAttribute\('aria-describedby'\)/);
 assert.match(ui,/if\(event\.key==='Escape'\)dismissPreview\(\)/);
});

test('trade, loot, Honor cloak and equipped slot share the exact same preview controller',()=>{
 const app=read('pandora-studio-app.js');
 const honor=app.match(/cloakLink:\(name,russianName\)=>[\s\S]*?attachPreview\(anchor,translated/);
 assert.ok(honor,'Honor cloak links use the common item tooltip');
 const itemLink=app.match(/const itemLink=\(id,label,highlight=null\)=>[\s\S]*?attachPreview\(anchor,resolved/);
 assert.ok(itemLink,'All Wiki item links use the shared tooltip');
 assert.match(app,/const product=itemLink\(trade\.i,dataName\('item',trade\.i\),id\)/);
 assert.match(app,/entry\.append\(itemLink\(row\.itemId/);
 assert.match(app,/PandoraStageItemUI\.attachPreview\(button,source/);
 const ui=read('pandora-studio-equipment-ui.js');
 assert.match(ui,/attachPreview\(button,soul,icons,'soul'\)/);
 assert.match(ui,/attachPreview\(button,rec,icons,'soul'\)/);
 const css=read('pandora-studio-theme.css');
 assert.match(css,/\.stage-hover-preview\{position:fixed;[^}]*pointer-events:none/);
});
