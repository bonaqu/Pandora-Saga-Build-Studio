// Optional, read-only staging endpoint support for future #390 defaults.
// It NEVER selects an active snapshot or mutates overrides, builds or catalog.
// A frontend reader must pin an exact release+digest before using this data.
const SNAPSHOT=/^([0-9]+\.[0-9]+\.[0-9]+)-([a-f0-9]{16})$/;
const KEY=/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01])))$/;
const FIELD=/^(?:ru|en|hintRu|hintEn|[a-z][a-zA-Z]*Ru|[a-z][a-zA-Z]*En)$/;
const LIMIT=3000;
const fail=(status,code)=>({status,payload:{error:'Authorial defaults unavailable',code}});
const byCodepoint=(a,b)=>a<b?-1:a>b?1:0;

function validRecord(record){
 return record&&typeof record==='object'&&!Array.isArray(record)&&
  typeof record.recordKey==='string'&&KEY.test(record.recordKey)&&
  typeof record.field==='string'&&FIELD.test(record.field)&&
  typeof record.value==='string'&&record.value.trim()&&
  record.value.length<=8000&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(record.value);
}

// All DB access is SELECT only. A missing migration is a normal 404.
// An incomplete/stale manifest fails closed, never falling back to unrelated
// catalog data or selecting the 'latest' database version.
export async function readVerifiedEditorialSnapshot(db,snapshot,{subtle=globalThis.crypto?.subtle}={}){
 const selected=SNAPSHOT.exec(String(snapshot||''));
 if(!selected)return fail(400,'EDITORIAL_DEFAULTS_BAD_SNAPSHOT');
 if(!db?.prepare||!subtle?.digest)
  return fail(503,'EDITORIAL_DEFAULTS_UNAVAILABLE');
 const tables=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('editorial_default_rows','editorial_default_snapshots')").all();
 const found=new Set((tables?.results||[]).map(row=>row.name));
 if(!found.has('editorial_default_rows')||!found.has('editorial_default_snapshots'))
  return fail(404,'EDITORIAL_DEFAULTS_NOT_INSTALLED');
 const metadata=await db.prepare(
  'SELECT snapshot,source_release,sha256,expected_rows FROM editorial_default_snapshots WHERE snapshot=?'
 ).bind(snapshot).first();
 if(!metadata)return fail(404,'EDITORIAL_DEFAULTS_SNAPSHOT_NOT_FOUND');
 if(metadata.snapshot!==snapshot||metadata.source_release!==selected[1]||
  !/^[a-f0-9]{64}$/.test(metadata.sha256||'')||
  metadata.sha256.slice(0,16)!==selected[2]||
  !Number.isSafeInteger(metadata.expected_rows)||
  metadata.expected_rows<1||metadata.expected_rows>LIMIT)
  return fail(503,'EDITORIAL_DEFAULTS_CORRUPT_MARKER');
 const result=await db.prepare(
  'SELECT record_key,field,value FROM editorial_default_rows WHERE snapshot=? ORDER BY record_key,field LIMIT 3001'
 ).bind(snapshot).all();
 const raw=result?.results||[];
 if(!Array.isArray(raw)||raw.length!==metadata.expected_rows)
  return fail(503,'EDITORIAL_DEFAULTS_INCOMPLETE');
 const seen=new Set(),records=[];
 let chars=0;
 for(const row of raw){
  const record={recordKey:row?.record_key,field:row?.field,value:row?.value};
  if(!validRecord(record))return fail(503,'EDITORIAL_DEFAULTS_INVALID_ROW');
  const identity=record.recordKey+'\u0000'+record.field;
  if(seen.has(identity))return fail(503,'EDITORIAL_DEFAULTS_DUPLICATE');
  seen.add(identity);
  chars+=record.value.length;
  if(chars>450000)return fail(503,'EDITORIAL_DEFAULTS_TOO_LARGE');
  records.push(record);
 }
 records.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 const canonical=JSON.stringify({schema:1,release:metadata.source_release,records});
 const bytes=await subtle.digest('SHA-256',new TextEncoder().encode(canonical));
 const digest=[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(digest!==metadata.sha256)
  return fail(503,'EDITORIAL_DEFAULTS_DIGEST_MISMATCH');
 return {status:200,payload:{schema:1,release:metadata.source_release,
  snapshot,sha256:digest,records}};
}
