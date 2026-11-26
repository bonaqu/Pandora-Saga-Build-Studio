import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const between=(start,end)=>{
 const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'Expected live editor boundary: '+start);
 return app.slice(i,j);
};
test('#815 Undo failures use accessible bilingual non-blocking warning, retaining CAS and retry',()=>{
 const undo=between('async function undoOwnerEdit(){','function showOverrideManager(){');
 assert.match(undo,/await apiRequest\('\/api\/admin\/reset',\{key:last\.key\}\)/);
 assert.match(undo,/await apiRequest\('\/api\/admin\/override',\{key:last\.key,value:last\.before\}\)/);
 assert.match(undo,/ownerEdits\.pop\(\);closeInlineEditor\(\)/);
 assert.match(undo,/showStudioToast\(\(lang==='en'\?/);
 assert.match(undo,/Не удалось отменить последнюю правку/);
 assert.match(undo,/Could not undo the last edit/);
 assert.match(undo,/,'warning'\)/);
 assert.doesNotMatch(undo,/\balert\s*\(/,'Native alerts must not block the owner workspace');
});
test('#815 history Escape clears search only without writing D1 or closing the modal',()=>{
 const history=between('function showOverrideManager(){','function wikiDataOrCatalogHasRecord(target){');
 assert.match(history,/search\.addEventListener\('keydown',event=>/);
 assert.match(history,/event\.key!=='Escape'\|\|!search\.value/);
 assert.match(history,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.match(history,/search\.value='';globalThis\.PandoraNonCredentialGuard\?\.sync\(search\)/);
 assert.match(history,/draw\(\);search\.focus\(\{preventScroll:true\}\)/);
 assert.match(history,/const clearSearch=h\('button'/);
});
\ntest('#815 equipment chooser offers one-tap and Escape search reset for RU/EN',()=>{
 const css=readFileSync(new URL('../pandora-studio-equipment-tooltip.css',import.meta.url),'utf8');
 assert.match(app,/const clearPickerSearch=h\('button'/);
 assert.match(app,/aria-label':lang==='en'\?'Clear equipment search':'Очистить поиск предметов'/);
 assert.match(app,/root\.append\(searchRow,onlyAvailable\)/);
 assert.match(app,/clearPickerSearch\.addEventListener\('click',clearPickerQuery\)/);
 assert.match(app,/search\.addEventListener\('keydown',event=>\{[\s\S]*?clearPickerQuery\(\)/);
 assert.match(css,/\.stage-picker-search-clear\[hidden\]\{display:none!important\}/);
});\n
test('#815 source outage reveals archive recovery without making data changes',()=>{
 const source=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
 assert.match(source,/if\(unavailable\)\{[\s\S]*?advanced\.open=true;archiveChoice\.open=true/);
 assert.match(source,/archiveChoice\.open=true/);
});
