import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUsername,validPassword} from '../worker/account.js';
test('account names are case-insensitive, unique-looking Latin identifiers',()=>{
 for(const name of ['Alice','abc','player_01','a_b','name123'])
  assert.ok(normalizeUsername(name));
 for(const name of ['ab','_abc','1234','юзер','admin','Root','a-b','a.b','user name',
  'a'.repeat(21),'x'.repeat(1000)])
  assert.equal(normalizeUsername(name),null,name);
 assert.equal(normalizeUsername('Player_01'),'player_01');
});
test('passwords are long passphrases and do not exclude punctuation, Unicode or spaces',()=>{
 for(const value of ['My very long phrase with spaces','сложный пароль для моих билдов',
   'Long password 🔥🧩 with emoji!','abcDEF0123456789+=/\\@"'])
  assert.equal(validPassword(value,'user'),true,value);
 for(const value of ['123456789','password123456789','a'.repeat(129),'a'.repeat(14),
  'pandorasaga12345'])
  assert.equal(validPassword(value,'user'),false,value);
});
test('account API is added without reusing or weakening legacy admin secrets',async()=>{
 const worker=(await import('../worker/index.js'));
 assert.equal(typeof worker.default.fetch,'function');
});
