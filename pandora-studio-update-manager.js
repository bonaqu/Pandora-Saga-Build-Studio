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
  // Share one ordered reason across manual and idle updates. A retained owner
  // token is not the same as active editing or a pending D1 write.
  const blockingReason = () => {
    const accountReason = window.PandoraAccountUI?.updateGuard?.();
    if (accountReason) return accountReason;
    if (document.body.classList.contains('studio-live-blocked') ||
        document.querySelector('#startupOverlay:not([hidden])')) return 'connection';
    // Being authenticated is not editing. A queued D1 save must not be
    // mislabeled as owner mode when the editor has already been closed.
    const owner = window.PandoraStudioOwnerUpdateState?.();
    if (owner) {
      if (owner.editing) return 'editor';
      if (owner.saving) return 'saving';
    } else if (window.PandoraStudioAdminActive?.()) return 'editor';
    const el = document.activeElement;
    // An open overlay or a focused plaintext-only editor must veto navigation.
    if (document.visibilityState !== 'visible' ||
        document.querySelector('#modalRoot:not([hidden]), #detailPanel.is-open, #stagePicker:not([hidden]), #stageAttributes:not([hidden]), .inline-owner-editor, #accountPanel:not([hidden])') ||
        el?.closest?.('input, textarea, select, [contenteditable]')) return 'finish';
    return null;
  };
  const busy = () => Boolean(blockingReason());
  function applyUpdate() {
    if (applying || !valid(latest)) return;
    // The recovery code is shown only once. Do not destroy it through an
    // idle refresh or an explicit update, even if the profile is collapsed.
    // Likewise protect an in-flight password change or a filled sign-in form.
    // An explicit click never bypasses the same gate used for idle updates.
    const reason = blockingReason();
    if (reason) {
      blockedReason = reason;
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
  const updateFallback = () => document.documentElement.lang === 'en' ? {
    notice: 'A new version is available. Your current build and page position will be saved before updating.',
    recovery: 'Save and acknowledge your one-time account recovery code before updating.',
    request: 'Finish the account request before updating.',
    draft: 'Finish or clear the account password form before updating.',
    connection: 'Reconnect to the game data before updating. Your build will stay here.',
    editor: 'Finish your edits and leave owner mode before updating.',
    saving: 'Wait for the current D1 change to finish saving before updating.',
    finish: 'Finish the current action and close open panels before updating.',
    apply: 'Update', later: 'Later'
  } : {
    notice: 'Новая версия опубликована. Текущий билд и положение на странице будут сохранены перед обновлением.',
    recovery: 'Перед обновлением сохрани и подтверди резервный код аккаунта — повторно его не покажут.',
    request: 'Сначала дождись завершения запроса аккаунта.',
    draft: 'Сначала заверши или очисти поля пароля в форме аккаунта.',
    connection: 'Сначала восстанови игровые данные. Текущий билд останется здесь.',
    editor: 'Заверши правки и выйди из режима владельца перед обновлением.',
    saving: 'Дождись завершения сохранения правок перед обновлением.',
    finish: 'Сначала заверши текущее действие и закрой открытые окна.',
    apply: 'Обновить', later: 'Позже'
  };
  // Safe editorial strings use the shared RU/EN D1 overrides; security
  // guidance about recovery codes and account requests remains uneditable.
  const editable = Object.freeze({
    notice: 'siteUpdateNotice', connection: 'siteUpdateConnection',
    editor: 'siteUpdateEditor', saving: 'siteUpdateSaving',
    finish: 'siteUpdateFinish',
    apply: 'siteUpdateApply', later: 'siteUpdateLater'
  });
  const updateCopy = () => {
    const defaults = updateFallback();
    const locale = window.PandoraUILocale;
    const language = document.documentElement.lang === 'en' ? 'en' : 'ru';
    return Object.fromEntries(Object.entries(defaults).map(([name, fallback]) =>
      [name, editable[name] && locale?.fieldKey?.(editable[name]) ?
        locale.text(editable[name], language) : fallback]));
  };
  // Keep direct references: owner pencils and editing hosts may become
  // additional children between the message and the two real buttons.
  let updateBannerNodes = null;
  function refreshUpdateLocale() {
    const banner = document.getElementById('studio-update-banner');
    if (!banner || !updateBannerNodes) return;
    const strings = updateCopy();
    const [message, apply, later] = updateBannerNodes;
    // A completed owner edit must not leave an obsolete warning displayed.
    if (blockedReason) blockedReason = blockingReason();
    const state = blockedReason || 'notice';
    for (const [node, name, value] of [
      [message, state, strings[state] || strings.notice],
      [apply, 'apply', strings.apply],
      [later, 'later', strings.later]
    ]) {
      if (node.nextElementSibling?.classList?.contains('ui-content-edit-host'))
        continue; // Do not destroy an unsaved owner edit on locale change.
      const key = editable[name] || '';
      const previous = node.getAttribute?.('data-owner-copy-key') || '';
      if (previous !== key) {
        if (key) node.setAttribute('data-owner-copy-key', key);
        else node.removeAttribute?.('data-owner-copy-key');
      }
      if (node.textContent !== value) node.textContent = value;
    }
    window.PandoraStudioBindUpdateCopyEditors?.();
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
    message.setAttribute('data-update-role', 'message');
    message.textContent = updateCopy()[blockedReason] || updateCopy().notice;
    const apply = document.createElement('button');
    apply.setAttribute('data-update-role', 'apply');
    apply.textContent = updateCopy().apply;
    apply.type = 'button';
    // If an inline edit is focused, a click must not blur and commit it
    // before the update guard gets a chance to reject navigation.
    apply.addEventListener('pointerdown', event => {
      if (busy()) event.preventDefault();
    });
    apply.addEventListener('click', applyUpdate);
    const later = document.createElement('button');
    later.setAttribute('data-update-role', 'later');
    later.textContent = updateCopy().later;
    later.type = 'button';
    later.addEventListener('click', () => {
      // The banner may have been created for an older published release.
      // Always dismiss the newest version actually offered to the user.
      dismissedRelease = latest;
      blockedReason = null;
      banner.remove();
      updateBannerNodes = null;
    });
    banner.append(message, apply, later);
    updateBannerNodes = [message, apply, later];
    document.body.appendChild(banner);
    refreshUpdateLocale();
  }
  // Canceling fetch is advisory: a browser adapter, service worker or a
  // stalled response.json() may ignore the signal. Settle OUR own checkpoint
  // on abort so future polls do not stay blocked by versionCheckInFlight.
  // Late success is ignored, and only the original request is aborted.
  const untilAbort = (operation, signal) => new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason || Error('Version check aborted')); return; }
    let done = false;
    const finish = (callback, value) => {
      if (done) return;
      done = true;
      signal.removeEventListener('abort', onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, signal.reason || Error('Version check aborted'));
    signal.addEventListener('abort', onAbort, {once:true});
    try {
      Promise.resolve(operation()).then(
        value => finish(resolve, value), error => finish(reject, error)
      );
    } catch (error) { finish(reject, error); }
  });
  let versionCheckInFlight = false, versionController = null, retryOnVisible = false;
  async function checkVersion() {
    // The visible-tab event already triggers a fresh read. Avoid pointless
    // manifest traffic and stale banners from background/suspended tabs.
    if (applying || versionCheckInFlight || document.visibilityState === 'hidden') return;
    versionCheckInFlight = true;
    const controller = new AbortController();
    versionController = controller;
    try {
      const timeout = setTimeout(() => controller.abort(), 6000);
      let manifest;
      try {
        const response = await untilAbort(
          () => fetch('./site-version.json?check=' + Date.now(), {
            cache: 'no-store', signal: controller.signal
          }), controller.signal
        );
        if (!response.ok) return;
        // The same deadline governs body decoding. A stalled adapter must
        // not pin the version poll even after its AbortSignal was ignored.
        manifest = await untilAbort(() => response.json(), controller.signal);
      } finally { clearTimeout(timeout); }
      // Visibility and periodic checks may overlap. Do not start a second
      // request while the first one is reading its response, or offer a
      // version older than one that has already been seen or dismissed.
      if (controller.signal.aborted || document.visibilityState === 'hidden') return;
      if (newer(manifest?.release, version) &&
          (!latest || !newer(latest, manifest.release)) &&
          manifest.release !== dismissedRelease) {
        latest = manifest.release;
        showUpdate(latest);
      }
    } catch { /* Offline or CDN delay: keep the current working state. */ }
    finally {
      if (versionController === controller) versionController = null;
      versionCheckInFlight = false;
      // Switching hidden->visible while the prior abort is still settling
      // must not miss the only immediate reconnect check. Coalesce repeated
      // visibility events into one follow-up, without starting parallel polls.
      const retry = retryOnVisible && document.visibilityState === 'visible';
      retryOnVisible = false;
      if (retry && !applying) void checkVersion();
      // A version poll refreshes an existing blocker without remounting it.
      // Owner state transitions also trigger this immediately.
      if (document.getElementById('studio-update-banner')) refreshUpdateLocale();
    }
  }
  // Automatic reloading is limited to idle non-admin sessions without open forms.
  setInterval(() => {
    if (latest && latest !== dismissedRelease && !applying && !blockedAutoUpdate &&
      Date.now() - lastActivity > 120000 && !busy()) applyUpdate();
  }, 15000);
  setInterval(checkVersion, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      retryOnVisible = false;
      versionController?.abort();
    } else if (document.visibilityState === 'visible') {
      if (versionCheckInFlight) retryOnVisible = true;
      else void checkVersion();
    }
  });
  setTimeout(checkVersion, 3000);
  // Only a view refresh, never a privileged operation or a reload.
  window.PandoraStudioUpdateBanner = Object.freeze({ refresh: refreshUpdateLocale });
})();
