(function(root){
'use strict';
// Stage-only, no network activity or automatic activation. A future release
// may fetch an explicitly pinned staging snapshot and call installVerified.
// Existing owner overrides remain the authoritative editable layer.
const SNAPSHOT=/^([0-9]+\.[0-9]+\.[0-9]+)-([a-f0-9]{16})$/;
const RECORD=/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01]))|wiki\.labels)$/;
const BOOK_FIELD=/^(?:ru|en|hintRu|hintEn)$/;
const WIKI_FIELD=/^(?:chapter_(?:item|utility|monster|map|honor|npc|chest|instance|skill|soul)|honor_(?:overview|gain|victories|ranks|monthly)|skill_filter_(?:player|racial|guild|special|variants|other|unknown|all))_(?:ru|en)$/;
const RANK_FIELD=/^(?:nameRu|nameEn|benefitRu|benefitEn)$/;
const OVERVIEW_FIELD=/^(?:pvp(?:Intro|Daily|Weekly|Hunt)(?:Ru|En)|overview(?:Ru|En)|honor(?:Ru|En)|total(?:Ru|En)|gain(?:Ru|En)|loss(?:Ru|En)|current(?:Ru|En)|ranks(?:Ru|En)|joining(?:Ru|En)|cloaks(?:Ru|En)|monthlyNote(?:Ru|En))$/;
const byCodepoint=(a,b)=>a<b?-1:a>b?1:0;
let active=null,loadGeneration=0;
function allowed(record){
 const {recordKey,field,value}=record||{};
 if(typeof recordKey!=='string'||!RECORD.test(recordKey)||
  typeof field!=='string'||typeof value!=='string'||
  !value.trim()||value.length>8000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))
  return false;
 if(recordKey==='guideedit.wiki.labels')return WIKI_FIELD.test(field)&&value.length<=90;
 if(recordKey==='guideedit.honor.overview')return OVERVIEW_FIELD.test(field)&&value.length<=2200;
 if(recordKey.startsWith('guideedit.honor.rank.'))
  return RANK_FIELD.test(field)&&value.length<=500;
 return BOOK_FIELD.test(field)&&value.length<=360;
}
async function verifySnapshot(payload,expectedSnapshot,subtle){
 const matched=SNAPSHOT.exec(String(expectedSnapshot||''));
 if(!matched||!subtle||typeof subtle.digest!=='function'||!payload||
  typeof payload!=='object'||Array.isArray(payload)||
  payload.schema!==1||payload.snapshot!==expectedSnapshot||
  payload.release!==matched[1]||
  typeof payload.sha256!=='string'||!(/^[a-f0-9]{64}$/.test(payload.sha256))||
  payload.sha256.slice(0,16)!==matched[2]||
  !Array.isArray(payload.records)||payload.records.length<1||payload.records.length>3000)
  return null;
 const seen=new Set(),records=[],mapped=new Map();
 let characters=0;
 for(const raw of payload.records){
  if(!allowed(raw))return null;
  const {recordKey,field,value}=raw,identity=recordKey+'\u0000'+field;
  if(seen.has(identity))return null;
  seen.add(identity);
  characters+=value.length;
  if(characters>450000)return null;
  records.push({recordKey,field,value});
  if(!mapped.has(recordKey))mapped.set(recordKey,new Map());
  mapped.get(recordKey).set(field,value);
 }
 records.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 const canonical=JSON.stringify({schema:1,release:payload.release,records});
 try{
  const bytes=await subtle.digest('SHA-256',new TextEncoder().encode(canonical));
  const digest=[...new Uint8Array(bytes)]
   .map(n=>n.toString(16).padStart(2,'0')).join('');
  return digest===payload.sha256?mapped:null;
 }catch{return null}
}
async function installVerified(payload,expectedSnapshot,
 subtle=root.crypto?.subtle){
 const generation=++loadGeneration;
 const mapped=await verifySnapshot(payload,expectedSnapshot,subtle);
 if(generation!==loadGeneration)return false; // A later reset/load wins.
 if(!mapped)return false;
 active={snapshot:expectedSnapshot,values:mapped};
 return true;
}
function reset(){
 ++loadGeneration;
 active=null;
}
function value(recordKey,field){
 return active?.values.get(recordKey)?.get(field)??null;
}
function resolve(recordKey,field,fallback){
 const saved=value(recordKey,field);
 return typeof saved==='string'?saved:fallback;
}
function status(){
 return active?Object.freeze({active:true,snapshot:active.snapshot}):
  Object.freeze({active:false,snapshot:null});
}
root.PandoraEditorialDefaults=Object.freeze({
 installVerified,verifySnapshot,reset,value,resolve,status
});
})(typeof window==='undefined'?globalThis:window);
