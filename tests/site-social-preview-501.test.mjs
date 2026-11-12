import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
const pkg=JSON.parse(readFileSync(new URL('package.json',root),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('site-version.json',root),'utf8'));
const image=readFileSync(new URL('assets/social-preview.png',root));
const url='https://bonaqu.github.io/Pandora-Saga-Build-Studio/assets/social-preview.png?v='+manifest.release;

test('the site uses exactly the GitHub Social preview artwork',()=>{
 assert.equal(image.length,219991);
 assert.equal(createHash('sha256').update(image).digest('hex'),
  '65803dbe8d028422e601804c4a5f8cc383e7b1d0de6b7bfd92671aac7f99f37d');
 assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(image.readUInt32BE(16),1280);
 assert.equal(image.readUInt32BE(20),640);
});

test('the Open Graph and X/Twitter card share one live versioned PNG URL',()=>{
 const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 assert.equal(pkg.pandoraRelease,manifest.release);
 assert.match(html,new RegExp('<meta property="og:image" content="'+escapeRegExp(url)+'">'));
 assert.match(html,new RegExp('<meta name="twitter:image" content="'+escapeRegExp(url)+'">'));
 assert.match(html,/<meta property="og:image:type" content="image\/png">/);
 assert.match(html,/<meta property="og:image:width" content="1280">/);
 assert.match(html,/<meta property="og:image:height" content="640">/);
 assert.match(html,/<meta name="twitter:card" content="summary_large_image">/);
 assert.match(html,/<meta property="og:title" content="Pandora Saga \| Build Studio">/);
 assert.match(html,/<meta property="og:image:alt" content="[^"]+">/);
 assert.match(html,/<meta name="twitter:image:alt" content="[^"]+">/);
 assert.match(html,new RegExp('Version: '+pkg.version));
 assert.doesNotMatch(html,/social-preview\.jpg/);
});

test('release consistency checks the new PNG instead of hard-coding JPEG',()=>{
 const release=readFileSync(new URL('scripts/release-version.mjs',root),'utf8');
 assert.match(release,/social-preview\.png/);
 assert.match(release,/previewPng\.readUInt32BE\(16\)!==1280/);
 assert.doesNotMatch(release,/social-preview\.jpg/);
});

test('live Pages readiness validates the actual shared PNG and no longer expects JPEG',()=>{
 const check=readFileSync(new URL('scripts/check-live-connections.mjs',root),'utf8');
 assert.match(check,/assets\/social-preview\.png/);
 assert.match(check,/image\/png/);
 assert.match(check,/og:image:width/);
 assert.match(check,/imageBytes\.readUInt32BE\(16\)===1280/);
 assert.match(check,/createHash\('sha256'\)/);
 assert.match(check,/65803dbe8d028422e601804c4a5f8cc383e7b1d0de6b7bfd92671aac7f99f37d/);
 assert.doesNotMatch(check,/social-preview\.jpg|image\/jpeg/);
});
