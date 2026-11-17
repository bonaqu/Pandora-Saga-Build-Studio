import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const section=(from,to)=>{
 const a=app.indexOf(from),b=app.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'Missing startup contract: '+from);
 return app.slice(a,b);
};

test('verified D1 startup cannot claim ready until both local writes have succeeded',()=>{
 const boot=section('async function startStudio(', "$('startupRetry').onclick");
 const checkpoint=boot.indexOf("if(confirmed.status!=='ready')");
 const durable=boot.indexOf('const draftSaved=persist(),librarySaved=persistBuilds()');
 const gate=boot.indexOf("showLiveGate('storage',{saved:false})");
 const finish=boot.indexOf('}else startupDone()');
 assert.ok(checkpoint>=0&&durable>checkpoint&&gate>durable&&finish>gate);
 assert.match(boot,/if\(studioLiveReady&&\(!draftSaved\|\|!librarySaved\)\)/);
 assert.match(boot,/if\(studioLiveReady&&!liveGateReason\)resumeCloudLibrary\(\{force:true\}\)/);
 assert.doesNotMatch(boot,/if\(studioLiveReady\)resumeCloudLibrary\(\{force:true\}\)/);
});

test('initial local storage failure is not retried invisibly or labeled as a saved draft',()=>{
 const gate=section('function showLiveGate(', 'function leaveLiveGate()');
 assert.match(gate,/if\(saved===null\)liveLocalSaved=saveLiveDraft\(\)/);
 assert.match(gate,/else liveLocalSaved=saved/);
 assert.match(gate,/Не удалось сохранить черновик или библиотеку билдов/);
 const retry=section("$('startupRetry').onclick=", '// Local fixture mode');
 assert.match(retry,/if\(liveGateReason==='storage'\)\{leaveLiveGate\(\);return\}/);
 const resume=section('function leaveLiveGate()', 'async function checkLiveConnection()');
 assert.match(resume,/liveLocalSaved=saveLiveDraft\(\)/);
 assert.match(resume,/if\(!liveLocalSaved\)\{showLiveGate\('storage'\);return\}/);
 assert.match(resume,/resumeCloudLibrary\(\{force:true\}\)/);
});
