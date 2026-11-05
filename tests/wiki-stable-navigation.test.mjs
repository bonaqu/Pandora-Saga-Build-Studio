import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('wiki selects records without recreating list and triggering two hash rerenders',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/wikiRenderSelected=\(\)=>\{/);
 assert.match(app,/draw\(present\)/);
 assert.match(app,/history\.pushState\(\{\.\.\.history\.state,psWikiEntry:true,psWikiPosition:null\}/);
 assert.match(app,/if\(sameCategory\)wikiRenderSelected\(\)/);
 assert.match(app,/const draw=\(detailOnly=false\)=>/);
 assert.match(app,/if\(!detailOnly\)browse\.replaceChildren\(\)/);
 assert.match(app,/browse\.querySelectorAll\('\[data-wiki-record\]'\)/);
 assert.match(app,/window\.addEventListener\('popstate'/);
});
test('chests resolve names and icons from OS item catalog, NPC from real NPC names',()=>{
 const app=read('pandora-studio-app.js'),data=JSON.parse(read('data/os/items.json'));
 const chests=JSON.parse(read('data/os/chests.json'));
 const names=JSON.parse(read('data/os/trades.json')).npcs;
 assert.ok(chests.boxes.some(c=>data[c.i]?.icon&&data[c.i]?.name));
 assert.ok(Object.values(names).some(n=>n.name));
 assert.match(app,/type==='chest'\?wikiData\.items\?\.\[id\]/);
 assert.match(app,/wikiIndex\.records\(type\)\?\.\[id\]/);
 assert.match(app,/wikiIcon\('chest',row\.id\)/);
});
test('drops and NPC exchange rewards include actual item icon and linked ingredient rows',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/const itemLink=\(id,label,highlight=null\)=>/);
 assert.match(app,/itemLink\(trade\.i/);
 assert.match(app,/row\.append\(itemLink\(material\.i/);
 assert.match(app,/itemLink\(row\.i,dataName\('item',row\.i\),id\)/);
});


test('return navigation captures the previous view and respects direct links',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-wiki-history.css');
 assert.match(app,/const fromView=\{tab:activeTab/);
 assert.match(app,/history\.replaceState\(\{\.\.\.oldState,psWikiPosition:fromPosition/);
 assert.match(app,/if\(location\.hash!==destination\)/);
 assert.match(app,/psWikiEntry===true/);
 assert.match(app,/if\(location\.hash\.startsWith\('#wiki\/'\)&&history\.state\?\.psWikiEntry===true\)\s*history\.back\(\)/);
 assert.match(app,/else if\(activeTab==='wiki'&&!location\.hash\.startsWith\('#b\/'\)\)/);
 assert.match(app,/const previous=event\.state\?\.psWikiReturn/);
 assert.match(app,/wikiSelection=\{\.\.\.previous\.selection\}/);
 assert.match(app,/wikiSearch=typeof previous\.search/);
 assert.match(app,/if\(!\$\('detailPanel'\)\?\.classList\.contains\('is-open'\)\)showWorkbench\(\)/);
 assert.match(css,/\.wiki-page>\.wiki-return-button/);
});


test('wiki keeps history and shows a contextual scroll-to-top in its persistent left list',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-wiki-polish.css');
 assert.match(app,/function openWikiChapterList\(\)/);
 assert.match(app,/psWikiList:listView/);
 assert.match(app,/else if\(event\.state\?\.psWikiList&&!location\.hash\)/);
 assert.match(app,/detail\.append\(wikiBackButton\(\)\)/);
 assert.doesNotMatch(app,/class:'wiki-page-nav'/);
 assert.doesNotMatch(app,/class:'wiki-nav-button wiki-chapter-list'/);
 assert.match(app,/class:'wiki-list-top'/);
 assert.match(app,/listTop\.hidden=!far/);
 assert.match(app,/listPanel\.append\(browse,listTop\)/);
 assert.match(app,/if\(location\.hash\.startsWith\('#wiki\/'\)\)openWikiChapterList\(\)/);
 assert.doesNotMatch(css,/wiki-page-nav|wiki-nav-button/);
 assert.match(css,/\.wiki-chest-assured-grid/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('all Wiki records reuse the Honor Back button and one source of CSS styles',()=>{
 const app=read('pandora-studio-app.js');
 const honor=read('pandora-studio-honor-view.js');
 const css=read('pandora-studio-wiki-history.css');
 const polish=read('pandora-studio-wiki-polish.css');
 const honorCss=read('pandora-studio-honor.css');
 assert.match(app,/function wikiBackButton\(\)/);
 assert.match(app,/const label=lang==='en'\?'← Back':'← Назад'/);
 assert.doesNotMatch(app,/backChapters|Назад к|Back to '\+chapter/);
 assert.match(app,/class:'wiki-return-button'/);
 assert.match(app,/detail\.append\(wikiBackButton\(\)\)/);
 assert.match(app,/backButton:wikiBackButton/);
 assert.match(app,/const icon=skillIcon\(rec\.branch,id,rec\);[\s\S]*?const back=detail\.querySelector\('\.wiki-return-button'\);/);
 assert.match(honor,/backButton\(\)/);
 assert.match(app,/if\(location\.hash\.startsWith\('#wiki\/'\)&&history\.state\?\.psWikiEntry===true\)/);
 assert.match(app,/else openWikiChapterList\(\)/);
 for(const kind of ['item','monster','map','npc','chest','skill','soul','instance'])
  assert.match(app,new RegExp('(?:^|[\\s,{])'+kind+':','m'),kind);
 assert.match(css,/\.wiki-page>\.wiki-return-button\{/);
 assert.match(css,/margin:0 0 15px/);
 assert.doesNotMatch(honor,/wiki-honor-war-return/);
 assert.doesNotMatch(honorCss,/wiki-honor-war-return/);
 assert.doesNotMatch(polish,/wiki-page-nav|wiki-nav-button/);
 assert.doesNotMatch(app,/class:'wiki-page-nav'/);
});

test('Honor resolves item and location links after a late catalog fetch',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/if\(!wikiIndex\)\{\s*void loadWiki\(\)\.then\(\(\)=>\{/);
 assert.match(app,/if\(root\.isConnected&&activeTab==='wiki'&&wikiSelection\.type==='honor'\)\s*renderHonor\(\)/);
});

test('history captures and restores every wiki chapter, record, search and both scroll containers',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function wikiPosition\(\)/);
 assert.match(app,/chapter:wikiSelection\.type,id:wikiSelection\.id/);
 assert.match(app,/inner:\$\('detailContent'\)\?\.scrollTop/);
 assert.match(app,/browse:\$\('detailContent'\)\?\.querySelector\('\.wiki-list'\)\?\.scrollTop/);
 assert.match(app,/function restoreWikiFilters\(state,type,id\)/);
 assert.match(app,/function restoreWikiPosition\(state\)/);
 assert.match(app,/scroller\.scrollTo\(\{top:Math\.max\(0,position\.inner\),behavior:'instant'\}\)/);
 assert.match(app,/browse\.scrollTop=Math\.max\(0,position\.browse\)/);
 assert.match(app,/restoreWikiPosition\(event\.state\)/);
 assert.doesNotMatch(app,/psWikiHonorScroll|psWikiHonorOrigin/);
});
