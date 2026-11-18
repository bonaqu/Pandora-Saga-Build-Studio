(function(root){
'use strict';
// Shared autofill guard for the game's numerical controls only.
// Yandex Browser can disregard the standard autocomplete="off" for numeric
// inputs. Yandex's webmaster guidance documents the non-standard "none"
// value as an additional hint, but explicitly does not guarantee enforcement.
// Never use this on login/password inputs: users must retain credential filling.
const installed=new WeakSet();
const prepare=input=>{
 if(!input||String(input.type||input.getAttribute?.('type')||'').toLowerCase()!=='number')
  return input;
 if(installed.has(input))return input;
 installed.add(input);
 input.setAttribute('autocomplete','none');
 input.setAttribute('aria-autocomplete','none');
 input.setAttribute('autocorrect','off');
 input.setAttribute('autocapitalize','off');
 input.setAttribute('spellcheck','false');
 input.setAttribute('data-lpignore','true');
 input.setAttribute('data-1p-ignore','true');
 input.setAttribute('data-bwignore','true');
 input.setAttribute('data-form-type','other');
 input.setAttribute('data-game-numeric','true');
 // Reuse the trusted gesture gate from Search. Idle synthetic autofill is
 // stopped before gameplay listeners persist an unexpected stat or level.
 if(root.PandoraNonCredentialGuard?.protect)
  root.PandoraNonCredentialGuard.protect(input);
 else if(String(root.navigator?.userAgent||'').includes('YaBrowser/'))
  input.readOnly=true;
 return input;
};
root.PandoraNumericField=Object.freeze({prepare});
})(typeof window==='undefined'?globalThis:window);
