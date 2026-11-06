(function(root){
'use strict';
// Shared autofill guard for the game's numerical controls only.
// Yandex Browser can disregard the standard autocomplete="off" for numeric
// inputs. Yandex's webmaster guidance documents the non-standard "none"
// value as an additional hint, but explicitly does not guarantee enforcement.
// Never use this on login/password inputs: users must retain credential filling.
const prepare=input=>{
 if(!input||String(input.type||input.getAttribute?.('type')||'').toLowerCase()!=='number')
  return input;
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
 // Yandex Browser has its own password/autofill overlay. Keep its inactive
 // number fields read-only until an explicit gesture, then restore read-only
 // when the user leaves. Chromium and other browsers retain normal editable
 // inputs, including programmatic .fill() and accessibility integrations.
 // No website can guarantee suppression of a browser-owned password popup.
 if(/\\bYaBrowser\\/\\d/i.test(String(root.navigator?.userAgent||''))){
  input.readOnly=true;
  const enable=()=>{if(!input.disabled)input.readOnly=false};
  input.addEventListener('pointerdown',enable);
  input.addEventListener('keydown',enable);
  input.addEventListener('blur',()=>{input.readOnly=true});
 }
 return input;
};
root.PandoraNumericField=Object.freeze({prepare});
})(typeof window==='undefined'?globalThis:window);
