import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const context={};
context.window=context;
runInNewContext(read('pandora-studio-ui-locale.js'),context);
runInNewContext(read('pandora-studio-honor-guide.js'),context);
const locale=context.PandoraUILocale,guide=context.PandoraHonorGuide;

test('all authored cloud-library lifecycle notices have bilingual CAS-safe D1 keys',()=>{
 const keys=locale.keys().filter(key=>key.startsWith('statusCloud'));
 assert.equal(keys.length,21,'keep the complete cloud lifecycle message family');
 for(const key of keys){
  const ru=locale.baseText(key,'ru'),en=locale.baseText(key,'en');
  assert.ok(ru.length&&en.length,key);
  assert.notEqual(ru,en,key+' needs an English fallback');
  assert.equal(locale.literalKey(ru),key,'literal RU lookup: '+key);
  assert.equal(locale.literalKey(en),key,'literal EN lookup: '+key);
  const id=locale.fieldKey(key);
  assert.match(id,/^ui\.label\.status-cloud-[a-z0-9-]+$/);
  const override={ru:'Проверено '+key,en:'Edited '+key};
  assert.equal(guide.validOverride('book.'+id,JSON.stringify(override)),true);
  locale.setOverrides({'guideedit.book.'+id:JSON.stringify(override)});
  assert.equal(locale.text(key,'ru'),override.ru);
  assert.equal(locale.text(key,'en'),override.en);
 }
 locale.setOverrides({});
 assert.equal(locale.literalKey('Сохранено в облаке: 2 из 4. Остальные пока только в браузере.'),null);
 assert.equal(locale.literalKey('ERROR: Worker D1 query failed'),null);
 assert.equal(locale.literalKey('Мой секретный билд'),null);
});

test('cloud status editor is owner-only and safely follows live state changes',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/function cloudStatusCopyKey\(message\)/);
 assert.match(source,/key===\x27statusLibrarySignIn\x27\|\|key\?\.startsWith\(\x27statusCloud\x27\)/);
 assert.match(source,/if\(adminEditing&&adminToken&&key\)node\.dataset\.ownerCopyKey=key/);
 assert.match(source,/if\(adminEditing&&adminToken&&key&&node\.parentElement\)/);
 assert.match(source,/const key=node\.dataset\.ownerCopyKey,id=locale\.fieldKey\(key\)/);
 assert.match(source,/if\(!node\.nextElementSibling\?\.classList\?\.contains\(\x27ui-content-edit-host\x27\)\)/);
 assert.match(source,/syncCloudStatusNode\(node,cloudLibraryStatus\)/);
});
