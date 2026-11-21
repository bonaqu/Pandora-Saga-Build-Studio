import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=app.indexOf('function renderCatalogStatus(){');
const end=app.indexOf('function applyGameLocale(',start);
assert.ok(start>0&&end>start);

// Minimal mounted DOM to run the real footer renderer on both languages;
// each fragment is separate, exactly as it is in the browser.
function render(language,data){
 const parts=Function('return '+app.match(
  /const catalogCountParts=Object\.freeze\((\[[\s\S]*?\])\);/)[1])();
 const root={dataset:{},children:[],
  querySelectorAll(selector){
   return selector==='[data-catalog-status-copy]'?
    this.children.filter(node=>node.attrs?.['data-catalog-status-copy']):[];
  },
  querySelector(selector){
   const match=selector.match(/^\[data-catalog-status-(copy|value)="([^"]+)"\]$/);
   if(!match)return null;
   return this.children.find(node=>
    node.attrs?.['data-catalog-status-'+match[1]]===match[2])||null;
  },
  replaceChildren(...children){this.children=children},
  get textContent(){
   return this.children.length?this.children.map(node=>node.textContent).join(''):'previous'
  }
 };
 const h=(tag,attrs)=>({tag,attrs,textContent:attrs.text||'',
  querySelector:()=>null});
 const factory=Function('
test('footer uses real loaded counts in both locales, not database jargon',()=>{
 const data={meta:{counts:{skills:569,items:20102,souls:304}}};
 assert.equal(render('ru',data),'В энциклопедии: 569 навыков · 20102 предметов · 304 душ');
 assert.equal(render('en',data),'Encyclopedia: 569 skills · 20102 items · 304 souls');
 assert.equal(render('en',null),'previous');
 assert.doesNotMatch(render('ru',data),/D1|Worker|база данных|HTTP/);
});
test('the same renderer runs on catalog refresh and locale switching',()=>{
 assert.match(app,/function applyGameLocale\(\{redraw=true,persistReconciled=true\}=\{\}\)\{[\s\S]*?renderCatalogStatus\(\)/);
 assert.match(app,/applyGameLocale\(\{persistReconciled:commit\}\);\s*if\(commit\)persist\(\)/);
 assert.equal((app.match(/\$\('catalogStatus'\)\.textContent=/g)||[]).length,0);
 assert.match(html,/id="catalogStatus">Загружаем данные игры…<\/span>/);
});

test('the catalog count remains a separate left footer field',()=>{
 const footer=html.slice(html.indexOf('<footer>'),html.indexOf('</footer>')+9);
 assert.ok(footer.includes('id="catalogStatus"'));
 assert.ok(footer.includes('id="siteVersion"'));
 assert.ok(footer.indexOf('id="catalogStatus"')<footer.indexOf('id="siteVersion"'));
 assert.equal((html.match(/id="catalogStatus"/g)||[]).length,1);
 assert.equal((html.match(/id="siteVersion"/g)||[]).length,1);
});
,'catalogSource','lang','adminEditing','adminToken',
  'ownerCopy','ownerCopyLabel','h','catalogCountParts',
  app.slice(start,app.indexOf('// Only mounted, meaningful action help',start))+
  'return renderCatalogStatus;');
 factory(()=>root,data,language,false,'',
  (_section,_key,ru,en)=>language==='en'?en:ru,()=>{},h,parts)();
 return root.textContent;
}
test('footer uses real loaded counts in both locales, not database jargon',()=>{
 const data={meta:{counts:{skills:569,items:20102,souls:304}}};
 assert.equal(render('ru',data),'В энциклопедии: 569 навыков · 20102 предметов · 304 душ');
 assert.equal(render('en',data),'Encyclopedia: 569 skills · 20102 items · 304 souls');
 assert.equal(render('en',null),'previous');
 assert.doesNotMatch(render('ru',data),/D1|Worker|база данных|HTTP/);
});
test('the same renderer runs on catalog refresh and locale switching',()=>{
 assert.match(app,/function applyGameLocale\(\{redraw=true,persistReconciled=true\}=\{\}\)\{[\s\S]*?renderCatalogStatus\(\)/);
 assert.match(app,/applyGameLocale\(\{persistReconciled:commit\}\);\s*if\(commit\)persist\(\)/);
 assert.equal((app.match(/\$\('catalogStatus'\)\.textContent=/g)||[]).length,0);
 assert.match(html,/id="catalogStatus">Загружаем данные игры…<\/span>/);
});

test('the catalog count remains a separate left footer field',()=>{
 const footer=html.slice(html.indexOf('<footer>'),html.indexOf('</footer>')+9);
 assert.ok(footer.includes('id="catalogStatus"'));
 assert.ok(footer.includes('id="siteVersion"'));
 assert.ok(footer.indexOf('id="catalogStatus"')<footer.indexOf('id="siteVersion"'));
 assert.equal((html.match(/id="catalogStatus"/g)||[]).length,1);
 assert.equal((html.match(/id="siteVersion"/g)||[]).length,1);
});
