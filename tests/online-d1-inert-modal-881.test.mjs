import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),html=read('index.html');
const section=(start,end)=>{
 const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Expected section '+start);
 return app.slice(a,b);
};

test('D1 dialog has native focus target and isolates the interactive application',()=>{
 assert.match(html,/<div id="startupOverlay"[^>]*role="dialog" aria-modal="true" tabindex="-1"/);
 const lock=section('const startupInertBefore=new Map()', 'let startupFinishId=0');
 assert.match(lock,/new MutationObserver/);
 assert.match(lock,/startupInertObserver.observe\(document.body,\{childList:true\}\)/);
 assert.match(lock,/if\(child===startupOverlay\|\|child.tagName==='SCRIPT'\)continue/);
 assert.match(lock,/startupInertBefore.set\(child,child.inert\)/);
 assert.match(lock,/child.inert=true/);
 assert.match(lock,/if\(child.isConnected\)child.inert=wasInert/);
 assert.match(lock,/focused\.focus\?\.\(\{preventScroll:true\}\)/);
 assert.match(lock,/\$\('startupRetry'\)\?\.focus/);
});

test('startup, outage and EN loading retain inert through actual overlay dismissal',()=>{
 const loading=section('function startupMessage(', 'function startupDone()');
 assert.match(loading,/syncStartupBackgroundInert\(\)/);
 assert.match(loading,/startupOverlay.focus\(\{preventScroll:true\}\)/);
 const finished=section('function startupDone()', 'function startupError(');
 assert.ok(finished.indexOf('startupOverlay.hidden=true')<
  finished.indexOf('syncStartupBackgroundInert()'));
 const failure=section('function startupError(', 'const VIEW_KEY');
 assert.match(failure,/focusStartupRetry\(\)/);
 const recovery=section('function showLiveGate(', 'function leaveLiveGate()');
 assert.match(recovery,/focusStartupRetry\(\)/);
 const keyboard=section('function blockUnverifiedInput(event)', "window.addEventListener('offline'");
 assert.match(keyboard,/if\(startupOverlay.hidden\|\|startupOverlay.contains\(event.target\)\)return/);
 assert.doesNotMatch(keyboard,/studioLiveReady&&!liveGateReason/);
 assert.doesNotMatch(keyboard,/startupOverlay.classList.contains\('is-finished'\)/);
});
