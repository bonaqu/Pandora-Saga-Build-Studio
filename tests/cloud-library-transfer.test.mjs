import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('legacy import is opt-in and only visible behind a signed-in build library',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 assert.match(app,/function buildLegacyImport\(\)/);
 assert.match(app,/text:tr\('Перенести старые билды','Import older builds'\)/);
 assert.match(app,/text:tr\('Проверить код','Check code'\)/);
 assert.match(app,/text:tr\('Найти на этом устройстве','Find on this device'\)/);
 assert.match(app,/text:tr\('Добавить билды в мой аккаунт','Add builds to my account'\)/);
 assert.match(app,/if\(!window\.PandoraAccountUI\?\.isLoggedIn\(\)\)return/);
 assert.doesNotMatch(html,/ps-build-library-secret\.v1/);
});
test('legacy import never replaces source keys or original D1 records',()=>{
 const app=read('pandora-studio-app.js'),worker=read('worker/index.js');
 const start=app.indexOf('function buildLegacyImport(){'),end=app.indexOf('function renderBuilds(root){',start);
 const importer=app.slice(start,end);
 assert.match(importer,/apiRequest\('\/api\/library\/legacy-preview'/);
 assert.match(importer,/if\(!persistBuilds\(\)\)/);
 assert.match(importer,/builds=previous/);
 assert.match(importer,/window\.PandoraBuildLibraryMerge\.same/);
 assert.match(importer,/structuredClone\(source\.data\)/);
 assert.match(importer,/await putCloudBuild\(row\)/);
 assert.doesNotMatch(importer,/localStorage\.setItem\(CLOUD_TOKEN_KEY/);
 assert.match(worker,/async function legacyBuildPreview\(/);
 assert.match(worker,/const principal=await accountPrincipal\(request,env\)/);
 assert.match(worker,/if\(!principal\)return no\('Sign in to import older builds',401\)/);
});
