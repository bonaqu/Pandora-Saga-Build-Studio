import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('shared SVG icons are semantic, deterministic, and size-neutral',()=>{
 const window={},document={createElementNS(_ns,tag){
  return{tag,attributes:{},children:[],setAttribute(k,v){this.attributes[k]=v},
   append(child){this.children.push(child)}}}};
 vm.runInNewContext(read('pandora-studio-icons.js'),{window,document});
 for(const name of ['close','edit','chevron-down','chevron-left','chevron-right',
  'arrow-left','arrow-right','check','search','plus','minus','lock','book']){
  const a=window.PandoraStudioIcons.create(name),b=window.PandoraStudioIcons.create(name);
  assert.equal(a.tag,'svg');
  assert.equal(a.attributes['data-ui-icon'],name);
  assert.equal(a.attributes['aria-hidden'],'true');
  assert.equal(a.attributes.viewBox,'0 0 24 24');
  assert.ok(a.children.length);
  assert.equal(a.children[0].attributes.d,b.children[0].attributes.d);
 }
 assert.equal(window.PandoraStudioIcons.create('invalid'),null);
 const css=read('pandora-studio-theme.css');
 assert.ok(css.includes('.ps-ui-icon{display:inline-block;flex:0 0 auto;width:1em;height:1em'));
 assert.ok(!css.includes('.stage-result-chevron::before'));
 assert.ok(!css.includes('.wiki-chest-chevron::before'));
});
test('site UI factories reuse central icon source without rewriting accessible copy',()=>{
 const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js'),
  eq=read('pandora-studio-equipment-ui.js'),html=read('index.html');
 assert.ok(html.indexOf('pandora-studio-icons.js?')<html.indexOf('pandora-studio-equipment-ui.js?'));
 assert.ok(app.includes('Object.hasOwn(controlGlyphIcon,attrs.text)'));
 assert.ok(app.includes("PandoraStudioIcons?.create('chevron-down')"));
 assert.ok(eq.includes("PandoraStudioIcons?.create(attrs.text==='✎'"));
 assert.ok(book.includes('PandoraStudioIcons?.create(symbol)'));
 assert.ok(eq.includes('function actionIcon(action,{forward=false}={})'));
 assert.ok(app.includes('PandoraStageItemUI.actionIcon(id)'));
});
