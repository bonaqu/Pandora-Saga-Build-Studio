(function(root){
'use strict';
// A tiny account surface. Passwords and recovery codes are never written to storage.
const KEY='ps-account-session.v1';
let session=null,options=null,trigger=null,panel=null,mode='login',errorLine=null;
let bootstrapPhase='guest';
let sessionRevision=0,passwordRequest=null,guestAuthRequest=null;
let sessionStorageFailed=false;
const setBootstrapPhase=value=>{
 bootstrapPhase=value;
 trigger?.setAttribute('data-account-bootstrap',value);
};
let pendingRecoveryCode=null;
// Feedback survives same-account form remounts (bootstrap/locale) without
// persisting passwords or messages in localStorage. It must never leak into
// another account, another form mode, or a guest session.
let feedbackSource=null,feedbackToken=null,feedbackMode=null;
const resetFeedback=()=>{feedbackSource=null;feedbackToken=null;feedbackMode=null};
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const USERNAME=/^[a-z][a-z0-9_]{2,19}$/;
const validName=value=>typeof value==='string'&&USERNAME.test(value.toLowerCase())?
 value.toLowerCase():null;
const validSession=value=>value&&typeof value==='object'&&!Array.isArray(value)&&
 TOKEN.test(value.token||'')&&validName(value.username)&&
 Number.isSafeInteger(value.expires)&&value.expires>Date.now();
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(validSession(raw))session={token:raw.token,expires:raw.expires,
  username:validName(raw.username)};
}catch{}
bootstrapPhase=session?'pending':'guest';
// A tab may stay open beyond the server-issued expiry. Stop using the old
// owner identity before any cloud request or account-dependent UI lookup.
function activeSession(){
 if(!session)return false;
 if(validSession(session))return true;
 clearSession();
 options?.onLogout?.({expired:true});
 return false;
}
function token(){return activeSession()?session.token:null}
const tr=value=>root.PandoraUILocale?.ui(value,document.documentElement.lang)||value;
function node(tag,cls='',text=''){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text)el.textContent=tr(text);
 return el;
}
function button(text,action,cls=''){
 const b=node('button','account-action '+cls,text);b.type='button';
 b.addEventListener('click',action);return b;
}
function field(placeholder,type='text',auto='off',max=128){
 const input=node('input','account-input');
 input.type=type;input.placeholder=tr(placeholder);input.maxLength=max;
 input.setAttribute('aria-label',tr(placeholder));
 input.autocomplete=auto;return input;
}
function info(message){
 feedbackSource=String(message);
 feedbackToken=session?.token||null;
 feedbackMode=mode;
 if(errorLine){
  errorLine.textContent=tr(feedbackSource);
  errorLine.dataset.sourceMessage=feedbackSource;
 }
}
async function request(kind,data=null,auth=token()){
 // Bound account checks: a temporary network timeout is not revocation.
 const signal=typeof AbortSignal!=='undefined'&&
  typeof AbortSignal.timeout==='function'?
  AbortSignal.timeout(kind==='me'?12000:20000):null;
 const response=await fetch(options.baseUrl+'/api/account/'+kind,{
  ...(signal?{signal}:{}),
  method:data===null?'GET':'POST',
  headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},
  ...(data===null?{}:{body:JSON.stringify(data)})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(result.error||'Ошибка сервера');error.httpStatus=response.status;throw error;}
 return result;
}
function setSession(result){
 const next={token:result?.token,expires:result?.expires,
  username:validName(result?.account?.username)};
 if(!validSession(next))throw Error('Некорректный ответ авторизации');
 // A rejected/malformed successful response must not overwrite the current
 // session, active owner scope or recovery code.
 const recovery=typeof result.recoveryCode==='string'&&TOKEN.test(result.recoveryCode)?
  result.recoveryCode:null;
 // A full/locked storage area must not swallow a one-time recovery code
 // returned by successful registration. Keep this tab's session in memory
 // and tell the owner that a refresh will require signing in again.
 try{localStorage.setItem(KEY,JSON.stringify(next));sessionStorageFailed=false}
 catch{sessionStorageFailed=true}
 session=next;
 sessionRevision++;
 setBootstrapPhase('verified');
 pendingRecoveryCode=recovery;
 resetFeedback();
}
function clearSession({revokeMatchingOwner=false}={}){
 const previousToken=session?.token||null,
  previousName=session?.username||null,previousExpires=session?.expires??null;
 session=null;pendingRecoveryCode=null;sessionStorageFailed=false;
 sessionRevision++;
 setBootstrapPhase('guest');
 resetFeedback();
 // Another tab may have signed in as a different account since this tab
 // started. Never erase that other account's active persisted session.
 if(previousToken){
  try{
   const saved=JSON.parse(localStorage.getItem(KEY)||'null');
   // A newer login on another tab may reuse the bearer string. Never
   // erase a different owner or a newer expiry just because it matches.
   // A revoked bearer must sign out every tab of the same owner, even if
   // another tab refreshed its expiry. Passive expiration instead protects
   // any newer saved login with a different expiry.
   if(saved?.token===previousToken&&validName(saved?.username)===previousName&&
    (revokeMatchingOwner||saved?.expires===previousExpires))localStorage.removeItem(KEY);
  }catch{}
 }
}
function render(){
 if(!panel||!trigger)return;
 activeSession();
 panel.replaceChildren();
 trigger.classList.toggle('active',Boolean(session));
 trigger.setAttribute('data-account-bootstrap',bootstrapPhase);
 // The saved owner may edit the profile while its /me check is in flight.
 // Only its verification hint is transient; never discard same-owner inputs.
 if(bootstrapPhase==='pending'&&session)
  panel.append(node('p','account-lead account-bootstrap-pending',
   'Проверяем учётную запись…'));
 trigger.title=session?tr('Профиль')+' · '+session.username:tr('Войти или зарегистрироваться');
 trigger.setAttribute('aria-label',trigger.title);
 const title=node('h3','account-title',session?'Профиль':'Аккаунт');
 panel.append(title);
 const sub=node('p','account-lead',session?'Сохранённые билды доступны после входа на другом устройстве.':
  'Логин и пароль — для доступа к сохранённым облачным билдам.');
 panel.append(sub);
 if(session&&sessionStorageFailed){
  const warning=node('p','account-lead account-storage-warning',
   'Браузер не сохранил вход. После обновления страницы потребуется войти снова. Сохраните резервный код, если он показан.');
  warning.setAttribute('role','status');
  panel.append(warning);
 }
 errorLine=node('p','account-feedback');errorLine.setAttribute('role','status');
 if(feedbackSource!==null&&feedbackToken===(session?.token||null)&&
  feedbackMode===mode){
  errorLine.textContent=tr(feedbackSource);
  errorLine.dataset.sourceMessage=feedbackSource;
 }else resetFeedback();
 if(session){
  const identity=node('div','account-identity');
  const avatar=node('span','account-avatar');avatar.setAttribute('aria-hidden','true');
  const account=node('div','account-identity-meta');
  account.append(node('small','','УЧЁТНАЯ ЗАПИСЬ'),
   node('p','account-user','@'+session.username));
  identity.append(avatar,account);
  panel.append(identity);
  const benefits=node('div','account-session-note');
  benefits.append(node('span','','✓'),node('span','','Облачные билды привязаны к вашему профилю'));
  panel.append(benefits);
  if(pendingRecoveryCode){
   const code=pendingRecoveryCode;
   const card=node('div','account-recovery');
   card.append(node('b','','Сохраните резервный код вне браузера'),
    node('p','','Без пароля или этого кода вернуть доступ к аккаунту нельзя.'),
    node('p','','Код доступен до обновления страницы или подтверждения сохранения.'));
   const input=field('','text','off',43);
   input.value=code;input.readOnly=true;
   card.append(input,button('Скопировать код',async()=>{
    try{await navigator.clipboard.writeText(code);info('Код скопирован')}
    catch{input.focus();input.select();info('Скопируйте выделенный код')}
   }));
   card.append(button('Я сохранил код',()=>{
    pendingRecoveryCode=null;card.remove();info('Резервный код скрыт.');
   }));
   panel.append(card);
  }
  const details=node('details','account-password-details');
  const summary=node('summary','account-password-toggle','Изменить пароль');
  details.append(summary);
   const old=field('Текущий пароль','password','current-password'),
    fresh=field('Новый пароль · от 8 символов','password','new-password'),
    confirmFresh=field('Повторите новый пароль','password','new-password');
  old.required=true;fresh.required=true;confirmFresh.required=true;
  fresh.minLength=8;confirmFresh.minLength=8;
  const form=node('form','account-form');
   form.append(old,fresh,confirmFresh);
  const update=button('Изменить пароль',async()=>{
   // A locale remount creates a new button; only one in-flight password
   // change is allowed for this local account session.
   if(passwordRequest?.revision===sessionRevision)return;
   if(fresh.value!==confirmFresh.value){info('Пароли не совпадают.');return}
   // Unlike Enter/form submission, this type=button action must explicitly
   // validate required and minLength controls before contacting the Worker.
   if(!form.reportValidity())return;
   const owner=session?.token,revision=sessionRevision;
   if(!owner)return;
   const sameSession=()=>session?.token===owner&&sessionRevision===revision;
   passwordRequest={token:owner,revision};
   update.disabled=true;info('Изменяем пароль…');
   try{await request('password',{currentPassword:old.value,password:fresh.value},owner);
    // A delayed reply from a signed-out session is stale even if another
    // login happens to receive exactly the same bearer value.
    if(!sameSession())return;
    old.value='';fresh.value='';confirmFresh.value='';
    const currentDetails=panel?.querySelector?.('.account-password-details');
    for(const input of currentDetails?.querySelectorAll?.('input')||[])input.value='';
    if(currentDetails)currentDetails.open=false;
    info('Пароль обновлён. Другие сеансы завершены.');
   }catch(e){if(sameSession())info(e.message)}
   finally{
    if(passwordRequest?.revision===revision&&passwordRequest?.token===owner)
     passwordRequest=null;
    update.disabled=false;
    if(sameSession()){
     const currentButton=panel?.querySelector?.(
      '.account-password-details button.account-action.primary');
     if(currentButton)currentButton.disabled=false;
    }
   }
  },'primary');
  update.disabled=passwordRequest?.revision===sessionRevision;
   form.append(update);
   form.addEventListener('submit',e=>{e.preventDefault();update.click()});
   details.append(form);
  panel.append(details);
  const footer=node('div','account-profile-footer');
  footer.append(button('Выйти из аккаунта',async()=>{
   const owner=session?.token,revision=sessionRevision;
   if(!owner)return;
   try{await request('logout',{},owner)}catch{}
   // A delayed logout belongs to one local session, not merely to a bearer
   // string that a later (mocked or real) login could have reused.
   if(session?.token!==owner||sessionRevision!==revision)return;
   clearSession({revokeMatchingOwner:true});options.onLogout?.();render();
  },'account-signout'));
  panel.append(footer,errorLine);return;
 }
 const tabs=node('div','account-tabs');
 // Registration can issue a one-time recovery code. Do not abandon its reply
 // or start a second login/recovery simply because RU/EN recreated the form.
 const guestPending=guestAuthRequest?.revision===sessionRevision;
 const switchMode=next=>{if(guestPending)return;resetFeedback();mode=next;render()};
 const tabButtons=[
  button('Войти',()=>switchMode('login'),mode==='login'?'selected':''),
  button('Регистрация',()=>switchMode('register'),mode==='register'?'selected':''),
  button('Восстановить',()=>switchMode('recover'),mode==='recover'?'selected':'')
 ];
 for(const tab of tabButtons)tab.disabled=guestPending;
 tabs.append(...tabButtons);
 panel.append(tabs);
 const form=node('form','account-form'),username=field('Логин (3–20, a-z, 0-9, _)','text','username',20);
 username.minLength=3;username.required=true;username.spellcheck=false;
 const pass=field(mode==='recover'?'Новый пароль · от 8 символов':
  'Пароль · минимум 8 символов','password',mode==='login'?'current-password':'new-password',128);
 pass.minLength=mode==='login'?1:8;pass.required=true;
 form.append(username,pass);
 let confirm=null,recovery=null;
 if(mode==='register'||mode==='recover'){
  confirm=field('Повторите пароль','password','new-password',128);
  confirm.required=true;confirm.minLength=8;form.append(confirm);
 }
 if(mode==='recover'){
  recovery=field('Резервный код восстановления','text','off',43);
  recovery.required=true;form.append(recovery);
 }
 const submit=node('button','account-action primary',mode==='register'?'Создать аккаунт':
  mode==='recover'?'Восстановить пароль':'Войти');
 submit.type='submit';
 submit.disabled=guestPending;
 form.append(submit);
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  // A detached form can still have a pending event while a locale refresh
  // rendered another instance. Exactly one guest authentication per session.
  if(guestAuthRequest?.revision===sessionRevision)return;
  const current=mode;
  if((current==='register'||current==='recover')&&pass.value!==confirm.value){
   info('Пароли не совпадают.');return;
  }
  if(!form.reportValidity())return;
  const revision=sessionRevision,ticket={revision,mode:current};
  guestAuthRequest=ticket;
  const sameRequest=()=>guestAuthRequest===ticket&&
   sessionRevision===revision&&!session;
  for(const tab of tabButtons)tab.disabled=true;
  submit.disabled=true;info('Проверяем…');
  try{
   const result=await request(current,current==='register'?
    {username:username.value,password:pass.value,legacyKey:options.legacyKey?.()}:
    current==='recover'?{username:username.value,password:pass.value,
     recoveryCode:recovery.value.trim()}:
    {username:username.value,password:pass.value},null);
   // A late reply must not switch a newer authenticated owner or reuse an
   // obsolete form. This also protects the one-time registration code.
   if(!sameRequest())return;
   setSession(result);
   render();
   if(pendingRecoveryCode)info('Сохраните код: после обновления страницы его нельзя будет повторно показать.');
   await options.onLogin?.({register:current==='register',bootstrap:false});
  }catch(ex){if(sameRequest())info(ex.message)}
  finally{
   if(guestAuthRequest===ticket)guestAuthRequest=null;
   submit.disabled=false;
   if(sessionRevision===revision&&!session){
    panel?.querySelector?.('.account-form button[type=submit]')?.removeAttribute?.('disabled');
    for(const tab of panel?.querySelectorAll?.('.account-tabs button')||[])tab.disabled=false;
   }
  }
 });
 panel.append(form,errorLine);
 panel.append(node('p','account-small','Без электронной почты и СМС. После регистрации сохраните резервный код.'));

}
async function init(config){
 // This classic script can run long before the deferred main app initializes.
 // A different tab may sign in during that gap. Do not freeze an earlier guest
 // observation: claim a newly persisted *valid* session before owner bootstrap.
 // Never replace an already-active in-memory account with another tab's owner.
 if(!session)try{
  const latest=JSON.parse(localStorage.getItem(KEY)||'null');
  if(validSession(latest)){
   session={token:latest.token,expires:latest.expires,
    username:validName(latest.username)};
   sessionRevision++;
  }
 }catch{}
 options=config;
 trigger=document.getElementById('profileTrigger');
 panel=document.getElementById('accountPanel');
 if(!trigger||!panel)throw Error('Missing account UI elements');
 setBootstrapPhase(session?'pending':'guest');
 render();
 // A logout in another tab revokes this tab too when both use the SAME
 // token. Switching to a DIFFERENT account in another tab must never
 // silently switch or sign out the current tab's independent owner.
 root.addEventListener('storage',event=>{
  if(event.key!==KEY||event.newValue!==null||!session)return;
  let previous;
  try{previous=JSON.parse(event.oldValue||'null')}catch{return}
  // The storage event may belong to another owner that happened to reuse
  // the same token value; independent tabs must not sign out each other.
  if(previous?.token!==session.token||
   validName(previous?.username)!==session.username)return;
  clearSession();
  options?.onLogout?.({otherTab:true});
  render();
 });
 trigger.addEventListener('click',()=>{
  const previous=session?.token||null;
  activeSession();
  panel.hidden=!panel.hidden;
  // Closing/reopening the popover does not mean the owner wanted to discard
  // password edits. Refresh only when its identity changed or no UI exists.
  if(!panel.hidden&&((session?.token||null)!==previous||!panel.hasChildNodes?.()))
   render();
 });
 document.addEventListener('pointerdown',event=>{
  if(!panel.hidden&&!panel.contains(event.target)&&!trigger.contains(event.target))
   panel.hidden=true;
 });
 // An open password/account form must survive a late /me response.
 // Invalid/revoked identities still require an immediate forced rerender.
 let forceBootstrapRender=false;
 const finishBootstrap=()=>{
  // A verified /me reply does not change the account. Do not discard edits
  // merely because the popover was temporarily hidden while it was pending.
  // Revoked/mismatched sessions still force a fresh guest panel.
  // Remove the temporary hint without replacing live password inputs.
  panel.querySelector?.('.account-bootstrap-pending')?.remove();
  if(forceBootstrapRender||!panel.hasChildNodes?.())render();
 };
 if(session){
  const bootstrapToken=session.token,expectedName=session.username,
   bootstrapRevision=sessionRevision;
  try{
   const data=await request('me',null,bootstrapToken);
   // A login or logout may complete while a previous /me is in flight.
   // Never allow its late answer to switch or clear the new account.
   if(session?.token!==bootstrapToken||sessionRevision!==bootstrapRevision){finishBootstrap();return}
   const verified=validName(data?.account?.username);
   // An incomplete HTTP 200 response does not prove credentials were
   // revoked. Preserve the account as temporarily unverified, just like
   // a transient network failure. A *different valid owner* is unsafe.
   if(!verified)throw Error('Неполный ответ проверки аккаунта');
   if(verified!==expectedName){
    const invalid=new Error('Некорректный владелец аккаунта');
    invalid.httpStatus=403;throw invalid;
   }
   session.username=verified;
   setBootstrapPhase('verified');
   options.onLogin?.({register:false,bootstrap:true});
  }catch(error){
   if(session?.token!==bootstrapToken||sessionRevision!==bootstrapRevision){finishBootstrap();return}
   if(error?.httpStatus===401||error?.httpStatus===403){
    clearSession({revokeMatchingOwner:true});
    forceBootstrapRender=true;
    options.onLogout?.({bootstrap:true});
   }else{
    setBootstrapPhase('offline');
    // Keep an unexpired account session on temporary network / Worker outages.
    // A failed availability check is not evidence of revoked credentials.
    options.onLogin?.({register:false,bootstrap:true});
   }
  }
 }else options.onGuest?.();
 finishBootstrap();
}
// A header RU/EN switch re-renders the profile even if its popover was
// closed by the outside-click handler. Keep edits in the current form and its
// validation message in memory, but never carry them across account changes.
function refresh(){
 const identity=session?.token||null,formMode=mode;
 const inputs=Array.from(panel?.querySelectorAll?.('.account-form input')||[]);
 const values=inputs.map(input=>input.value);
 const expanded=panel?.querySelector?.('.account-password-details')?.open;
 const message=errorLine?.dataset?.sourceMessage??null;
 render();
 if((session?.token||null)!==identity||mode!==formMode||!panel)return;
 const restored=Array.from(panel.querySelectorAll?.('.account-form input')||[]);
 if(restored.length!==values.length)return;
 for(let i=0;i<restored.length;i++)restored[i].value=values[i];
 const details=panel.querySelector?.('.account-password-details');
 if(details&&expanded!==undefined)details.open=expanded;
 if(message!==null)info(message);
}
// The release manager must never discard the only recovery code or an
// unfinished account request. Expose state, never the token or secret itself.
// Unsaved password input remains private even when its popover is hidden.
function updateGuard(){
 if(pendingRecoveryCode)return 'recovery';
 if(guestAuthRequest||passwordRequest)return 'request';
 if(Array.from(panel?.querySelectorAll?.('input[type="password"]')||[])
  .some(input=>Boolean(input.value)))return 'draft';
 return null;
}
root.PandoraAccountUI=Object.freeze({init,token,updateGuard,
 username:()=>activeSession()?session.username:null,
 refresh,isLoggedIn:()=>activeSession()});
})(typeof window==='undefined'?globalThis:window);
