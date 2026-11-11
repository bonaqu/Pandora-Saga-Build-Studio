/* Pandora Saga Build Studio: safe, action-aware update checks.
   Static GitHub Pages: no worker and no GitHub Actions required. */
(function () {
  'use strict';
  // First load the cache-busted HTML, then show its clean canonical URL.
  // history.replaceState does NOT request the potentially stale unversioned HTML.
  const current = new URL(location.href);
  if (current.searchParams.has('ps-revision')) {
    current.searchParams.delete('ps-revision');
    history.replaceState(history.state, '', current.pathname + current.search + current.hash);
  }
  const version = document.querySelector('meta[name="ps-studio-release"]')?.content || '';
  const valid = value => typeof value === 'string' && /^\d{4}\.\d{1,2}\.\d{1,2}\.\d+$/.test(value);
  // Show the release of the HTML actually running, not a newer release that
  // may be offered by site-version.json. The release script updates this meta.
  const versionLabel = document.getElementById('siteVersion');
  if (versionLabel) versionLabel.textContent = 'Version: ' +
    (valid(version) ? '0.' + Number(version.split('.')[3]) + '.0' : '—');
  if (!version) return;
  const newer = (remote, local) => {
    if (!valid(remote) || !valid(local)) return false;
    const a = remote.split('.').map(Number), b = local.split('.').map(Number);
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] > b[i];
    }
    return false;
  };
  let latest = '', lastActivity = Date.now(), dismissedRelease = '', applying = false, blockedAutoUpdate = false, blockedReason = null;
  const onActivity = () => { lastActivity = Date.now(); blockedAutoUpdate = false; };
  document.addEventListener('pointerdown', onActivity, { passive: true });
  document.addEventListener('keydown', onActivity, { passive: true });
  document.addEventListener('input', onActivity, { passive: true });
  const busy = () => {
    const el = document.activeElement;
    return document.visibilityState !== 'visible' ||
      !!document.querySelector('#modalRoot:not([hidden]), #detailPanel.is-open, #stagePicker:not([hidden]), #stageAttributes:not([hidden]), .inline-owner-editor, #accountPanel:not([hidden])') ||
      !!window.PandoraAccountUI?.updateGuard?.() ||
      !!(el && el.matches && el.matches('input, textarea, select, [contenteditable="true"]')) ||
      !!window.PandoraStudioAdminActive?.();
  };
  function applyUpdate() {
    if (applying || !valid(latest)) return;
    // The recovery code is shown only once. Do not destroy it through an
    // idle refresh or an explicit update, even if the profile is collapsed.
    // Likewise protect an in-flight password change or a filled sign-in form.
    const accountReason = window.PandoraAccountUI?.updateGuard?.();
    if (accountReason) {
      blockedReason = accountReason;
      blockedAutoUpdate = true;
      refreshUpdateLocale();
      return;
    }
    blockedReason = null;
    applying = true;
    try {
      // A browser quota failure must veto navigation, not silently discard the
      // latest draft or cloud-library conflict copies during an update.
      const safe = document.dispatchEvent(new Event('pandora:before-update', { cancelable: true }));
      if (!safe) { applying = false; blockedAutoUpdate = true; return; }
    } catch (e) { console.warn('Save before update failed', e); applying = false; blockedAutoUpdate = true; return; }
    const next = new URL(location.href);
    next.searchParams.set('ps-revision', latest);
    location.replace(next.toString()); // new HTML + versioned CSS/JS without Ctrl+F5
  }
  const updateCopy = () => document.documentElement.lang === 'en' ? {
    notice: 'A new version is available. Your current build and page position will be saved before updating.',
    recovery: 'Save and acknowledge your one-time account recovery code before updating.',
    request: 'Finish the account request before updating.',
    draft: 'Finish or clear the account password form before updating.',
    apply: 'Update', later: 'Later'
  } : {
    notice: 'Новая версия опубликована. Текущий билд и положение на странице будут сохранены перед обновлением.',
    recovery: 'Перед обновлением сохрани и подтверди резервный код аккаунта — повторно его не покажут.',
    request: 'Сначала дождись завершения запроса аккаунта.',
    draft: 'Сначала заверши или очисти поля пароля в форме аккаунта.',
    apply: 'Обновить', later: 'Позже'
  };
  function refreshUpdateLocale() {
    const banner = document.getElementById('studio-update-banner');
    if (!banner) return;
    const strings = updateCopy();
    const [message, apply, later] = banner.children;
    message.textContent = strings[blockedReason] || strings.notice;
    apply.textContent = strings.apply;
    later.textContent = strings.later;
  }
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(refreshUpdateLocale);
    observer.observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  }
  function showUpdate(release) {
    latest = release;
    if (document.getElementById('studio-update-banner')) {refreshUpdateLocale();return}
    const banner = document.createElement('aside');
    banner.id = 'studio-update-banner';
    banner.className = 'studio-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    const message = document.createElement('span');
    message.textContent = updateCopy()[blockedReason] || updateCopy().notice;
    const apply = document.createElement('button');
    apply.textContent = updateCopy().apply;
    apply.type = 'button';
    apply.addEventListener('click', applyUpdate);
    const later = document.createElement('button');
    later.textContent = updateCopy().later;
    later.type = 'button';
    later.addEventListener('click', () => {
      // The banner may have been created for an older published release.
      // Always dismiss the newest version actually offered to the user.
      dismissedRelease = latest;
      blockedReason = null;
      banner.remove();
    });
    banner.append(message, apply, later);
    document.body.appendChild(banner);
  }
  async function checkVersion() {
    if (applying) return;
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
      // Visibility and periodic checks may overlap and finish out of order.
      // Never downgrade the offered release to an older cached response.
      if (newer(manifest?.release, version) &&
          (!latest || !newer(latest, manifest.release)) &&
          manifest.release !== dismissedRelease) {
        latest = manifest.release;
        showUpdate(latest);
      }
    } catch { /* Offline or CDN delay: keep the current working state. */ }
  }
  // Automatic reloading is limited to idle non-admin sessions without open forms.
  setInterval(() => {
    if (latest && latest !== dismissedRelease && !applying && !blockedAutoUpdate &&
      Date.now() - lastActivity > 120000 && !busy()) applyUpdate();
  }, 15000);
  setInterval(checkVersion, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkVersion();
  });
  setTimeout(checkVersion, 3000);
})();
