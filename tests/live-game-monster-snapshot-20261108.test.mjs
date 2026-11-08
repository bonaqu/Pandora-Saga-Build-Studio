import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',
 import.meta.url),'utf8'));
const monsters=read('monsters'),meta=read('meta');

test('monster snapshot matches verified live OS game source on 2026-11-08',()=>{
 // Current public game API: https://pandorasaga-os.com/gamedata/monsters.json
 // Independent D1: https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/monsters.json
 assert.equal(Object.keys(monsters).length,702);
 assert.equal(monsters['43650']?.name,'Восставший король');
 assert.equal(monsters['43650']?.life,1250000);
 assert.equal(monsters['43732']?.name,'Хранитель тлена');
 assert.equal(monsters['43732']?.life,1350000);
 assert.equal(meta.sha?.['monster/monster.csv'],'f637f83a84a49c74');
});
test('monster HP corrections preserve the independently confirmed non-HP fields',()=>{
 const king=monsters['43650'],decay=monsters['43732'];
 assert.deepEqual([king.level,king.vit,king.str,king.resists?.physical],
  [64,76,113,10]);
 assert.deepEqual([decay.level,decay.vit,decay.str,decay.resists?.physical],
  [70,91,136,20]);
 // This is a local source snapshot correction, not a runtime D1 overlay.
 assert.equal(Object.keys(monsters).length,meta.counts.monsters);
});
