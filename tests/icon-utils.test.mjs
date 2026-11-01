import test from 'node:test';
import assert from 'node:assert/strict';
import {safeIconStem,isWebP,originalIconUrl} from '../scripts/icon-utils.mjs';
const valid=(payload=new Uint8Array([1,2,3,4]))=>{
 const result=new Uint8Array(20+payload.length);
 result.set([82,73,70,70],0);result.set([87,69,66,80],8);result.set([86,80,56,32],12);
 const size=result.length-8;
 result[4]=size&255;result[5]=(size>>>8)&255;result[6]=(size>>>16)&255;result[7]=(size>>>24)&255;
 result.set(payload,20);return result;
};
test('WebP verifier requires RIFF, WEBP, VP8 family and plausible length',()=>{
 assert.equal(isWebP(valid()),true);
 const broken=valid();broken[8]=0;assert.equal(isWebP(broken),false);
 const badChunk=valid();badChunk[12]=0;assert.equal(isWebP(badChunk),false);
 const short=valid();short[4]=255;assert.equal(isWebP(short),false);
 assert.equal(isWebP(new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80])),false);
 assert.equal(isWebP(null),false);
});
test('asset mirror denies unsafe icon stems and accepts OS identifiers',()=>{
 assert.equal(safeIconStem('skill_100000501'),'skill_100000501');
 assert.equal(safeIconStem('icon-0123'),'icon-0123');
 for(const name of ['../escape','foo.webp','foo/bar','x\\y','', 'space file', '%2e%2e']){
  assert.throws(()=>safeIconStem(name),/Unsafe icon filename/);
 }
});

test('Soul icons resolve to official item artwork, never a nonexistent Soul URL',()=>{
 assert.equal(originalIconUrl('souls','I_103000_00'),
  'https://pandorasaga-os.com/icons/items/I_103000_00.webp');
 assert.equal(originalIconUrl('items','I_000001_00'),
  'https://pandorasaga-os.com/icons/items/I_000001_00.webp');
 assert.equal(originalIconUrl('skills','skill_100000501'),
  'https://pandorasaga-os.com/icons/skills/skill_100000501.webp');
 for(const type of ['item','invalid','../skills'])assert.throws(
  ()=>originalIconUrl(type,'I_000001_00'),/Unknown icon category/);
 assert.throws(()=>originalIconUrl('souls','../secret'),/Unsafe icon filename/);
});
