// Temporary read-only GitHub Actions diagnosis. No tokens, cookies or D1 writes.
const origin='https://pandorasaga-os.com';
const endpoints=['/','/news','/news/','/en/news','/ru/news','/api/news','/api/news?limit=10'];
const results=await Promise.all(endpoints.map(async path=>{
 try{
  const res=await fetch(origin+path,{signal:AbortSignal.timeout(12000),
   headers:{'User-Agent':'Mozilla/5.0 PandoraCatalogReview/1.0','Accept':'text/html,application/json'}});
  const body=(await res.text()).slice(0,500000);
  const matches=[...body.matchAll(/(?:href|src)=["']([^"'<>]{1,280})["']/ig)].map(x=>x[1])
   .filter(x=>/news|update|patch|2026|post|blog/i.test(x)).slice(0,20);
  const hints=[...body.matchAll(/.{0,75}(?:Победы в PvP|По следам ветра|50 level|PvP victories|тыквенн|огненн).{0,160}/gi)]
   .slice(0,12).map(x=>x[0].replace(/\s+/g,' '));
  const head=body.slice(0,250).replace(/\s+/g,' ').replace(/<[^>]+>/g,' ');
  return {path,status:res.status,url:res.url,len:body.length,type:res.headers.get('content-type'),head,links:matches,hints};
 }catch(e){return {path,error:String(e.message||e).slice(0,200)}}
}));
for(const r of results)console.log(JSON.stringify(r));
