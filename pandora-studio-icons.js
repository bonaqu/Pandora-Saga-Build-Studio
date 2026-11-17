(function(root){
'use strict';
// Shared vector language for site controls; original game artwork is untouched.
const NS='http://www.w3.org/2000/svg';
const PATHS=Object.freeze({
 close:['M18 6 6 18','M6 6l12 12'],
 edit:['M12 20h9','M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z'],
 'chevron-down':['m6 9 6 6 6-6'],
 'chevron-left':['m15 18-6-6 6-6'],
 'chevron-right':['m9 18 6-6-6-6'],
 'arrow-left':['M19 12H5','m12 19-7-7 7-7'],
 'arrow-right':['M5 12h14','m-6-6 6 6-6 6'],
 check:['M20 6 9 17l-5-5'],
 search:['m21 21-4.35-4.35','M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
 plus:['M12 5v14','M5 12h14'],
 minus:['M5 12h14'],
 lock:['M5 11h14v10H5z','M8 11V7a4 4 0 0 1 8 0v4'],
 book:['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z']
});
function create(name,{paths=null,cssClass='ps-ui-icon',marker='data-ui-icon'}={}){
 if(!Object.hasOwn(PATHS,name)&&!Array.isArray(paths))return null;
 const shapes=Array.isArray(paths)?paths:PATHS[name];
 const svg=document.createElementNS(NS,'svg');
 for(const [key,value] of Object.entries({
   class:cssClass,viewBox:'0 0 24 24',fill:'none',
  stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round',
  'stroke-linejoin':'round','aria-hidden':'true',focusable:'false',[marker]:name
 }))svg.setAttribute(key,value);
 for(const d of shapes){
  const path=document.createElementNS(NS,'path');
  path.setAttribute('d',d);svg.append(path);
 }
 return svg;
}
root.PandoraStudioIcons=Object.freeze({create});
})(window);
