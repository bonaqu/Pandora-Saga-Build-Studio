export function classifyGameSource(status,payload){
 const healthy=status===200&&payload?.status==='ok'&&payload?.source==='game-site';
 const raw=payload?.code;
 const reason=!healthy&&typeof raw==='string'&&/^[a-z0-9-]{1,40}$/.test(raw)?
  raw:'unavailable';
 return Object.freeze({healthy,reason:healthy?'ok':reason});
}
