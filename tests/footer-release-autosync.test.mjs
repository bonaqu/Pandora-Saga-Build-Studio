import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html');
const updater=read('pandora-studio-update-manager.js');
const css=read('pandora-studio-theme.css');
const pkg=JSON.parse(read('package.json'));
const manifest=JSON.parse(read('site-version.json'));
const first=updater.indexOf("  const version = document.querySelector(");
const last=updater.indexOf("  const newer =",first);
assert.ok(first>0&&last>first,'Test must exercise the real footer version renderer');
const renderSnippet=updater.slice(first,last);

function renderFooter(meta){
 const node={textContent:'Version: —'};
 const document={
  querySelector:()=>meta==null?null:{content:meta},
  getElementById:key=>key==='siteVersion'?node:null
 };
 Function('document',renderSnippet)(document);
 return node.textContent;
}

test('footer version is always derived from the installed HTML release, never a hard-coded label',()=>{
 assert.equal(manifest.release,pkg.pandoraRelease);
 assert.equal(pkg.version,'0.'+Number(manifest.release.split('.')[3])+'.0');
 assert.match(html,new RegExp('<meta name="ps-studio-release" content="'+manifest.release.replace(/\./g,'\\.')+'">'));
 assert.equal(renderFooter(manifest.release),'Version: '+pkg.version);
 assert.equal(renderFooter('2026.11.12.999'),'Version: 0.999.0');
 assert.equal(renderFooter('2027.1.1.2'),'Version: 0.2.0');
});

test('missing or corrupted release metadata has a safe display fallback',()=>{
 assert.equal(renderFooter(null),'Version: —');
 assert.equal(renderFooter('nonsense'),'Version: —');
});

test('version is separate from the D1 catalog counts and aligns right, including mobile',()=>{
 assert.match(html,/<footer>[^]*id="catalogStatus"[^]*id="siteVersion"[^]*<\/footer>/);
 assert.match(html,/id="siteVersion" class="footer-version">Version: —<\/span>/);
 assert.match(css,/footer \.footer-version\{[^}]*margin-inline-start:auto/);
 assert.match(css,/@media\(max-width:460px\)[^]*footer \.footer-version\{align-self:flex-end/);
 assert.doesNotMatch(updater,/fetch\([^]*?siteVersion\.textContent/);
});
