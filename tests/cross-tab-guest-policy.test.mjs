import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('a second guest tab cannot redirect cloud requests, link sharing or registration legacy key',()=>{
 assert.match(app,/let tabGuestSecret=cloudToken\(\),tabOwnerScope=null/);
 assert.match(app,/PandoraAccountUI\?\.token\(\)\|\|tabGuestSecret/);
 assert.match(app,/baseUrl:API,legacyKey:\(\)=>tabGuestSecret/);
 assert.match(app,/field\.value=tabGuestSecret/);
 assert.match(app,/carryFrom:window\.PandoraBuildScope\.owner\(null,previousGuest\)/);
 assert.match(app,/tabGuestSecret=trimmed/);
});
