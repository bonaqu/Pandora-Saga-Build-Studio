import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),html=read('index.html');
const start=app.indexOf('function renderCatalogStatus(){');
const end=app.indexOf('// Only mounted, meaningful action help',start);
const match=app.match(/const catalogCountParts=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(start>0&&end>start&&match,'The mounted footer source must be present');
const parts=Function('return '+match[1])();
const create=(tag,attrs)=>({tag,attrs,textContent:attrs.text||'',querySelector:()=>null});
function createRoot(){
 return {dataset:{},children:[],
  querySelectorAll(selector){
   if(selector==='[data-catalog-status-copy]')
    return this.children.filter(child=>child.attrs?.['data-catalog-status-copy']);
   if(selector==='[data-catalog-status-value]')
    return this.children.filter(child=>child.attrs?.['data-catalog-status-value']);
   return [];
  },
  querySelector(selector){
   const m=selector.match(/^\[data-catalog-status-(copy|value)="([^"]+)"\]$/);
   if(!m)return null;
   return this.children.find(child=>child.attrs?.['data-catalog-status-'+m[1]]===m[2])||null;
  },
  replaceChildren(...children){this.children=children},
  get textContent(){
   return this.children.length?this.children.map(child=>child.textContent).join(''):'previous'
  }
 };
}
function render(root,lang,data,{editing=false,onBind=()=>{}}={}){
 const factory=Function('$','catalogSource','lang','adminEditing','adminToken',
  'ownerCopy','ownerCopyLabel','h','catalogCountParts',
  app.slice(start,end)+'return renderCatalogStatus;');
 factory(()=>root,data,lang,editing,editing?'a'.repeat(43):'',
  (_section,_key,ru,en)=>lang==='en'?en:ru,onBind,create,parts)();
 return root.textContent;
}

test('footer uses actual game counts and exact independent RU/EN source words',()=>{
 const root=createRoot(),data={meta:{counts:{skills:569,items:20102,souls:304}}};
 assert.equal(render(root,'ru',data),
  'В энциклопедии: 569 навыков · 20102 предметов · 304 душ');
 assert.equal(root.querySelectorAll('[data-catalog-status-copy]').length,4);
 assert.equal(root.querySelectorAll('[data-catalog-status-value]').length,3);
 const numbers=root.querySelectorAll('[data-catalog-status-value]');
 assert.equal(render(root,'en',data),
  'Encyclopedia: 569 skills · 20102 items · 304 souls');
 assert.equal(root.querySelectorAll('[data-catalog-status-value]')[0],numbers[0]);
 data.meta.counts.skills=570;
 assert.equal(render(root,'ru',data),
  'В энциклопедии: 570 навыков · 20102 предметов · 304 душ');
 assert.equal(root.querySelectorAll('[data-catalog-status-value]')[0],numbers[0]);
 assert.doesNotMatch(root.textContent,/D1|Worker|база данных|HTTP/);
});
test('footer owner-only editor receives source text not numeric values',()=>{
 const root=createRoot(),data={meta:{counts:{skills:10,items:20,souls:30}}};
 const names=[];
 render(root,'ru',data,{editing:true,onBind:(_node,section,key,ru,en)=>{
  names.push([section,key,ru,en]);
 }});
 assert.equal(names.length,4);
 assert.ok(names.every(([section])=>section==='catalog-sync'));
 assert.deepEqual(names.map(([,key])=>key),
  ['catalogCountLead','catalogCountSkills','catalogCountItems','catalogCountSouls']);
 assert.ok(names.every(([,key])=>!/\d/.test(key)));
 assert.equal(root.querySelectorAll('[data-catalog-status-value]').length,3);
 // A missing catalog snapshot cannot manufacture a count.
 const missing=createRoot();
 assert.equal(render(missing,'en',null),'previous');
 assert.equal(missing.children.length,0);
});
test('footer is refreshed on locale/cat recheck without restoring retired archive',()=>{
 assert.match(app,/function applyGameLocale\(\{redraw=true,persistReconciled=true\}=\{\}\)\{[\s\S]*?renderCatalogStatus\(\)/);
 assert.match(app,/applyGameLocale\(\{persistReconciled:commit\}\);\s*if\(commit\)persist\(\)/);
 assert.equal((app.match(/\$\('catalogStatus'\)\.textContent=/g)||[]).length,0);
 assert.match(html,/id="catalogStatus">Загружаем данные игры…<\/span>/);
 const footer=html.slice(html.indexOf('<footer>'),html.indexOf('</footer>')+9);
 assert.ok(footer.includes('id="catalogStatus"'));
 assert.ok(footer.indexOf('id="catalogStatus"')<footer.indexOf('id="siteVersion"'));
 assert.doesNotMatch(app,/renderArchiveNotice/);
});
