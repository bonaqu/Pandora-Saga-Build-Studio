import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=app.indexOf('function renderCatalogStatus(){');
const end=app.indexOf('function applyGameLocale(',start);
assert.ok(start>0&&end>start);

function render(language,data){
 const node={textContent:'previous'};
 const factory=Function('$','catalogSource','lang',
  app.slice(start,end)+'return renderCatalogStatus;');
 factory(()=>node,data,language)();
 return node.textContent;
}
test('footer uses real loaded counts in both locales, not database jargon',()=>{
 const data={meta:{counts:{skills:569,items:20102,souls:304}}};
 assert.equal(render('ru',data),'В энциклопедии: 569 навыков · 20102 предметов · 304 душ');
 assert.equal(render('en',data),'Encyclopedia: 569 skills · 20102 items · 304 souls');
 assert.equal(render('en',null),'previous');
 assert.doesNotMatch(render('ru',data),/D1|Worker|база данных|HTTP/);
});
test('the same renderer runs on catalog refresh and locale switching',()=>{
 assert.match(app,/function applyGameLocale\(\{redraw=true\}=\{\}\)\{[\s\S]*?renderCatalogStatus\(\)/);
 assert.match(app,/applyGameLocale\(\);persist\(\)/);
 assert.equal((app.match(/\$\('catalogStatus'\)\.textContent=/g)||[]).length,0);
 assert.match(html,/id="catalogStatus">Загружаем данные игры…<\/span>/);
});

test('the catalog count remains a separate left footer field',()=>{
 assert.match(html,/<footer>[\\s\\S]*id="catalogStatus"[\\s\\S]*id="siteVersion"[\\s\\S]*<\\/footer>/);
 assert.equal((html.match(/id="catalogStatus"/g)||[]).length,1);
 assert.equal((html.match(/id="siteVersion"/g)||[]).length,1);
});
