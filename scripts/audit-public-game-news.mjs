// Temporary read-only official patch analysis. No credentials, no D1 writes.
const res=await fetch('https://pandorasaga-os.com/api/news',{
 signal:AbortSignal.timeout(20000),headers:{Accept:'application/json'}});
if(!res.ok)throw Error('Current game news HTTP '+res.status);
const payload=await res.json();
const items=Array.isArray(payload.items)?payload.items:[];
console.log('PATCH_NEWS_HEADLINES '+JSON.stringify(items.slice(0,15).map(x=>({
 id:x.id,title:x.title,date:x.publishedAt||x.createdAt||x.date||null,
 keys:Object.keys(x)
}))));
const article=items[0];
if(!article)throw Error('No current game news');
const html=String(article.content||article.body||'');
const images=[...html.matchAll(/<img\\b[^>]*src=["']([^"']+)["'][^>]*>/gi)]
 .map(m=>m[1]).filter(url=>!url.includes('/icons/')).slice(0,30);
const decode=s=>s.replace(/&nbsp;/g,' ').replace(/&laquo;/g,'«')
 .replace(/&raquo;/g,'»').replace(/&quot;/g,'"').replace(/&amp;/g,'&')
 .replace(/&#(\\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
const plain=decode(html
 .replace(/<\\/\\s*(p|h[1-6]|tr|li|blockquote|div)\\s*>/gi,'\n')
 .replace(/<br\\s*\\/?>/gi,'\n')
 .replace(/<[^>]*>/g,'')
 .replace(/[ \t]+/g,' ')
 .replace(/\n[ \t]*/g,'\n'));
console.log('PATCH_NEWS_META '+JSON.stringify({id:article.id,title:article.title,
 date:article.publishedAt||article.createdAt||article.date||null,
 images,contentLength:html.length}));
for(let i=0;i<plain.length;i+=2500)
 console.log('PATCH_NEWS_TEXT_PART '+(1+Math.floor(i/2500))+' '+JSON.stringify(plain.slice(i,i+2500)));
