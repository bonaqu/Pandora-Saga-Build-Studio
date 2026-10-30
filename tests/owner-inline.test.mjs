import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=f=>readFileSync(new URL(f,root),'utf8');
test('owner edits have server-side authorization, whitelist and socket validation',()=>{
 const worker=get('worker/index.js');
 assert.match(worker,/\/api\/admin\/override/);
 assert.match(worker,/if\(!await auth\(request,env\)\)return no\('Unauthorized',401\)/);
 assert.match(worker,/itemdesc\\\.\[0-9\]/);
 assert.match(worker,/itemslots\\\.\[0-9\]/);
 assert.match(worker,/Invalid socket count \(0-32\)/);
});
test('item fields are editable only through owner modal, not direct DOM write',()=>{
 const ui=get('stage-item-ui.js'),app=get('app.js');
 assert.match(ui,/'data-edit-key':'item\.'/);
 assert.match(ui,/itemdesc\.'/);
 assert.match(ui,/itemslots\.'/);
 assert.match(app,/document\.addEventListener\('dblclick'/);
 assert.match(app,/if\(!adminEditing\|\|!adminToken\|\|!key\)return/);
 assert.match(app,/itemWithOverrides\(rec\)/);
});
