/* Pandora Saga Build Studio: safe, action-aware update checks.
   Static GitHub Pages: no worker and no GitHub Actions required. */
(function () {
  'use strict';
  const version = document.querySelector('meta[name="ps-studio-release"]')?.content || '';
  if (!version) return;
  const valid = value => typeof value === 'string' && /^[a-zA-Z0-9.-]{1,70}$/.test(value);
  let latest = '', lastActivity = Date.now(), deferred = false, applying = false;
  const onActivity = () => { lastActivity = Date.now(); };
  document.addEventListener('pointerdown', onActivity, { passive: true });
  document.addEventListener('keydown', onActivity, { passive: true });
  document.addEventListener('input', onActivity, { passive: true });
  const busy = () => {
    const el = document.activeElement;
    return document.visibilityState !== 'visible' ||
      !!document.querySelector('#modalRoot:not([hidden])') ||
      !!(el && el.matches && el.matches('input, textarea, select, [contenteditable="true"]')) ||
      !!window.PandoraStudioAdminActive?.();
  };
  function applyUpdate() {
    if (applying || !valid(latest)) return;
    applying = true;
    try { document.dispatchEvent(new Event('pandora:before-update')); } catch (e) { console.warn('Save before update failed', e); applying = false; return; }
    const next = new URL(location.href);
    next.searchParams.set('ps-revision', latest);
    location.replace(next.toString()); // new HTML + versioned CSS/JS without Ctrl+F5
  }
  function showUpdate(release) {
    if (document.getElementById('studio-update-banner')) return;
    latest = release;
    const banner = document.createElement('aside');
    banner.id = 'studio-update-banner';
    banner.className = 'studio-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    const message = document.createElement('span');
    message.textContent = 'Вышло обновление Pandora Saga Build Studio. Текущий билд сохранится.';
    const apply = document.createElement('button');
    apply.textContent = 'Обновить';
    apply.type = 'button';
    apply.addEventListener('click', applyUpdate);
    const later = document.createElement('button');
    later.textContent = 'Позже';
    later.type = 'button';
    later.addEventListener('click', () => { deferred = true; banner.remove(); });
    banner.append(message, apply, later);
    document.body.appendChild(banner);
  }
  async function checkVersion() {
    if (applying || deferred) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      let response;
      try {
        response = await fetch('./site-version.json?check=' + Date.now(), {
          cache: 'no-store', signal: controller.signal
        });
      } finally { clearTimeout(timeout); }
      if (!response.ok) return;
      const manifest = await response.json();
      if (valid(manifest?.release) && manifest.release !== version) {
        latest = manifest.release;
        showUpdate(latest);
      }
    } catch { /* Offline or CDN delay: keep the current working state. */ }
  }
  // Automatic reloading is limited to idle non-admin sessions without open forms.
  setInterval(() => {
    if (latest && !deferred && !applying && Date.now() - lastActivity > 120000 && !busy()) applyUpdate();
  }, 15000);
  setInterval(checkVersion, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkVersion();
  });
  setTimeout(checkVersion, 3000);
})();
