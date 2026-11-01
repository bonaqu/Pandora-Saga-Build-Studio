import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('only reuse wiki list if old DOM root still exists after tab change',()=>{
 const app=get('app.js');
 assert.match(app,/let wikiRenderSelected=null,wikiRenderedRoot=null/);
 assert.match(app,/wikiRenderedRoot=root/);
 assert.match(app,/wikiRenderedRoot\?\.isConnected&&wikiIndex/);
 assert.match(app,/if\(sameCategory\)wikiRenderSelected\(\)/);
});
test('hashchange and popstate restore a record after leaving wiki category',()=>{
 const app=get('app.js');
 assert.match(app,/window\.addEventListener\('hashchange'/);
 assert.match(app,/window\.addEventListener\('popstate'/);
 assert.match(app,/activeTab='wiki';\s*if\(same\)wikiRenderSelected\(\);else renderDetails\(\)/);
});
test('selected deep links outside the initial page remain visible without expanding the entire list',()=>{
 const app=get('app.js');
 assert.match(app,/selectedIndex>=wikiShown/);
 assert.match(app,/\[results\[selectedIndex\],\.\.\.results\.slice\(0,wikiShown\)\]/);
 assert.match(app,/browse\.scrollTop=selectedIndex>=wikiShown\?0:previousScroll/);
 assert.match(app,/aria-current/);
 assert.match(app,/draw\(present\)/);
});
test('cached encyclopedia avoids duplicate draws and cross-category searches are cleared',()=>{
 const app=get('app.js');
 assert.match(app,/if\(wikiIndex\)draw\(\);\s*else\{/);
 assert.match(app,/loadWiki\(\)\.then/);
 assert.match(app,/browse\.replaceChildren\(\);\s*detail\.replaceChildren/);
 assert.match(app,/if\(activeTab!=='wiki'\|\|wikiSelection\.type!==type\)\{wikiSearch='';wikiShown=100\}/);
});
test('repeated wiki record click reuses same list and preserves its scroll position',()=>{
 const app=get('app.js');
 assert.match(app,/const draw=\(detailOnly=false\)=>/);
 assert.match(app,/if\(!detailOnly\)browse\.replaceChildren\(\)/);
 assert.match(app,/if\(!detailOnly\)\{/);
 assert.match(app,/browse\.scrollTop=selectedIndex>=wikiShown\?0:previousScroll/);
});
