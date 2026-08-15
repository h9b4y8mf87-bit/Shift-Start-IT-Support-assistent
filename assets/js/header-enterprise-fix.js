(() => {
  'use strict';

  function syncThemeBranding(theme) {
    const favicon = document.getElementById('shiftstart-favicon');
    if (!favicon) return;
    const nextHref = theme === 'dark' ? favicon.dataset.darkHref : favicon.dataset.lightHref;
    if (nextHref) favicon.href = nextHref;
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncThemeBranding(document.documentElement.dataset.theme || 'light');
    const theme = document.querySelector('[data-theme-toggle]');
    const key = document.querySelector('[data-header-command-key]');

    if (key && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
      key.textContent = '⌘ K';
    }

    if (theme) {
      theme.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        syncThemeBranding(next);
        try { localStorage.setItem('shiftstart-theme', next); } catch (_) {}

        const region = document.querySelector('[data-ss-toast-region]');
        if (region) {
          const toast = document.createElement('div');
          toast.className = 'ss-toast ss-toast-info';
          toast.textContent = `${next === 'dark' ? 'Dark' : 'Light'} mode enabled.`;
          region.appendChild(toast);
          window.setTimeout(() => toast.remove(), 2400);
        }
      });
    }
  });
})();
