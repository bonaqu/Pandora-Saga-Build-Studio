import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const account=read('pandora-studio-account-ui.js');
const css=read('pandora-studio-theme.css');
const segment=(start,end)=>{
 const a=app.indexOf(start),b=app.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Missing source segment '+start);
 return app.slice(a,b);
};
test('all saved-build entry points require account login',()=>{
 for(const [start,end] of [
  ['function renderBuilds(root){','function newId(){'],
  ['function saveBuild(name=','function sanitizeSharedState('],
  ['function openSavedBuild(b){','function unsavedBuild(){'],
  ['async function createShared(build,host){','function openSharedSnapshot(share){'],
  ['function openSharedSnapshot(share){','let studioToastTimer='],
  ['async function restoreSharedHash(){','function modal('],
  ['async function loadCloudBuilds(){','function h(tag,attrs={}'],
  ['async function deleteCloudBuild(id){','async function loadCloudBuilds(){'],
  ['async function putCloudBuild(entry){','async function deleteCloudBuild(id){']
 ]){
  assert.match(segment(start,end),/PandoraAccountUI\?\.isLoggedIn|requireBuildAccount/,
   'Missing login guard on '+start);
 }
 assert.match(app,/function buildSignInCard\(/);
 assert.match(css,/\.build-signin-gate\{/);
});
test('shared links resume only for current account after recovery code acknowledgment',()=>{
 const r=segment('async function restoreSharedHash(){','function modal(');
 assert.match(r,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)/);
 assert.match(r,/const sessionToken=window\.PandoraAccountUI\.token\(\)/);
 assert.match(r,/PandoraAccountUI\?\.token\(\)===sessionToken/);
 assert.match(app,/onRecoveryAcknowledged:finishBuildAccountEntry/);
 assert.match(account,/hasRecoveryPending:\(\)=>Boolean\(pendingRecoveryCode\)/);
 assert.match(account,/options\?\.onRecoveryAcknowledged\?\.\(\)/);
});
