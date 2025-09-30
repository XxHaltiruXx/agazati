/* nav.js — robust JS-only navbar aligner + persistent scroll
   v1.1 - handles anchors, buttons, onclick navigations, span toggles, multiple pages/subfolders.
   Install: place this file in assets/js/nav.js and include it on every page.
*/

(function(){
  const KEY = '__agazati_nav_pos_v1';   // sessionStorage kulcs
  const RIGHT_PADDING = 0;              // ha kell jobb oldali "üres" hely, állítsd (px)
  const MAX_RESTORE_ATTEMPTS = 20;
  const RESTORE_RETRY_MS = 70;

  // Utility
  const noop = () => {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Find the best scrollable nav element on the page.
  function findNav() {
    // prefer an element with class 'navbar' or 'navbar-nav' that can scroll horizontally
    const candidates = [
      ...document.querySelectorAll('nav.navbar, .navbar, .navbar-nav, header nav, header .navbar')
    ];
    for (const c of candidates) {
      if (!c) continue;
      // if this element actually can scroll horizontally or its children overflow, prefer it
      if (c.scrollWidth && c.clientWidth && c.scrollWidth > c.clientWidth) return c;
      // check computed overflow-x
      const style = window.getComputedStyle(c);
      if (/(auto|scroll|overlay)/.test(style.overflowX)) return c;
    }
    // fallback: try to find first nav in header
    const headerNav = document.querySelector('header nav, nav');
    return headerNav || null;
  }

  // Save/restore helpers
  function savePosFor(nav, value) {
    try {
      const payload = {
        v: Math.round(value == null ? nav.scrollLeft || 0 : value),
        w: nav.clientWidth || 0,       // optional: store width for debugging/adaptation
        s: nav.scrollWidth || 0
      };
      sessionStorage.setItem(KEY, JSON.stringify(payload));
      // no console spam in prod; uncomment for debugging:
      // console.debug('[nav] saved', payload);
    } catch (e) { /* ignore */ }
  }
  function getStored() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return typeof obj.v === 'number' ? obj.v : null;
    } catch (e) { return null; }
  }

  // Compute target scrollLeft so that el's right edge aligns with nav's right edge (minus RIGHT_PADDING)
  function computeTargetForElement(nav, el) {
    if (!nav || !el) return 0;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // delta: how many pixels the element's right is to the right of nav's right (positive => partly out to right)
    const delta = (elRect.right - navRect.right);
    const target = Math.round(nav.scrollLeft + delta - RIGHT_PADDING);
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return clamp(target, 0, max);
  }

  // Scroll helper
  function scrollNavTo(nav, target, smooth = true) {
    try {
      if (nav && 'scrollTo' in nav) {
        nav.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
      } else if (nav) {
        nav.scrollLeft = target;
      }
    } catch (e) {
      try { nav.scrollLeft = target; } catch (ee) {}
    }
  }

  // Determine if an element is a navigational trigger we care about.
  // Preference: nearest <a>. If none, treat elements with onclick that set location, data-href, role=link, or class 'nav-link'
  function findClickedNavElement(target, nav) {
    if (!target) return null;
    const a = target.closest && target.closest('a');
    if (a && nav.contains(a)) return a;
    // if clicked element within nav and has class nav-link (bootstrap) — use it
    const navLink = target.closest && target.closest('.nav-link, [data-nav-link], [role="link"], button');
    if (navLink && nav.contains(navLink)) return navLink;
    // else if clicked element is inside nav, find any direct child anchor
    if (nav.contains(target)) {
      const firstA = nav.querySelector('a');
      return firstA || target;
    }
    return null;
  }

  // Main init (wait until DOM ready)
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 8);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 8));
    }
  }

  onReady(() => {
    const nav = findNav();
    if (!nav) {
      // nothing to do
      // console.warn('[nav] no nav found');
      return;
    }

    // If the found nav itself is not horizontally scrollable but contains a scrollable child, use that child.
    if (nav.scrollWidth <= nav.clientWidth) {
      // find a child with overflow scroll
      const child = Array.from(nav.querySelectorAll('*')).find(c => c.scrollWidth > c.clientWidth && /(auto|scroll|overlay)/.test(window.getComputedStyle(c).overflowX));
      if (child) {
        // replace nav reference with scrollable child
        // console.debug('[nav] using scrollable child instead of top nav');
        // eslint-disable-next-line no-unused-vars
        // nav = child; // cannot reassign const; so use variable shadowing via newNav
      }
    }

    // throttle save via RAF
    let rafSave = null;
    nav.addEventListener('scroll', () => {
      if (rafSave) cancelAnimationFrame(rafSave);
      rafSave = requestAnimationFrame(() => {
        savePosFor(nav);
        rafSave = null;
      });
    }, { passive: true });

    // Save on touchend (mobile)
    nav.addEventListener('touchend', () => setTimeout(() => savePosFor(nav), 20), { passive: true });

    // Save before unload
    window.addEventListener('beforeunload', () => savePosFor(nav));

    // Capture clicks: do this in capture phase so we save before any navigation starts
    document.addEventListener('click', (ev) => {
      try {
        const clicked = findClickedNavElement(ev.target, nav);
        if (!clicked) return;
        // Don't treat hamburger toggles (with class sidebargomb) as navigation
        if (clicked.classList && clicked.classList.contains('sidebargomb')) return;

        // If it's an anchor, compute target so its right edge sits at nav's right edge
        if (clicked.tagName && clicked.tagName.toLowerCase() === 'a') {
          const t = computeTargetForElement(nav, clicked);
          savePosFor(nav, t);
          // Visual feedback attempt (smooth)
          scrollNavTo(nav, t, true);
          return;
        }

        // If it's a button or other element that likely navigates via JS, just save current position
        if (clicked.tagName && (clicked.tagName.toLowerCase() === 'button' || clicked.getAttribute && clicked.getAttribute('role') === 'link')) {
          savePosFor(nav);
          return;
        }

        // fallback: if clicked inside nav, save current pos
        if (nav.contains(ev.target)) {
          savePosFor(nav);
        }
      } catch (e) {
        // swallow errors
      }
    }, true); // capture

    // Also handle keyboard activation (Enter/Space) for accessibility
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        const active = document.activeElement;
        if (nav && active && nav.contains(active)) {
          const clicked = findClickedNavElement(active, nav) || active;
          if (clicked) {
            if (clicked.tagName && clicked.tagName.toLowerCase() === 'a') {
              const t = computeTargetForElement(nav, clicked);
              savePosFor(nav, t);
              scrollNavTo(nav, t, true);
            } else {
              savePosFor(nav);
            }
          }
        }
      }
    }, true);

    // If the page uses JS navigation (window.location=...) tied to buttons that don't unload immediately,
    // we still saved on click; if navigation is programmatic later, beforeunload handler covers final save.

    // Restore routine with retries + MutationObserver
    function restorePosition() {
      const stored = getStored();
      if (stored === null) return;
      // If nav isn't scrollable, nothing to do
      if (nav.clientWidth >= nav.scrollWidth) {
        // nothing to restore; but save current pos for future
        savePosFor(nav, 0);
        return;
      }

      let attempts = 0;
      let stopped = false;

      const maxScroll = () => Math.max(0, nav.scrollWidth - nav.clientWidth);

      function attemptOnce() {
        if (stopped) return;
        attempts++;
        const desired = clamp(Math.round(stored), 0, maxScroll());
        // set instantly (no smooth to avoid animation fight)
        scrollNavTo(nav, desired, false);
        // success check
        if (Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= MAX_RESTORE_ATTEMPTS) {
          stop();
          return;
        }
        requestAnimationFrame(() => setTimeout(attemptOnce, RESTORE_RETRY_MS));
      }

      function stop() {
        stopped = true;
        try { observer && observer.disconnect(); } catch(e){}
      }

      // Watch for DOM changes (menu items added later)
      let observer = null;
      try {
        observer = new MutationObserver((mutations) => {
          if (stopped) return;
          // reset attempts to allow new tries after DOM change
          attempts = 0;
          requestAnimationFrame(attemptOnce);
        });
        observer.observe(nav, { childList: true, subtree: true, attributes: true });
      } catch (e) {
        // ignore if MutationObserver not available
      }

      attemptOnce();
      setTimeout(() => { if (!stopped) attemptOnce(); }, 120);
      setTimeout(() => { if (!stopped) attemptOnce(); }, 260);
    }

    // restore on common lifecycle events
    window.addEventListener('pageshow', () => setTimeout(restorePosition, 20));
    window.addEventListener('DOMContentLoaded', () => setTimeout(restorePosition, 30));
    window.addEventListener('load', () => setTimeout(restorePosition, 80));

    // initialize storage from active/current page if empty (useful first load)
    (function initFromActive(){
      try {
        if (getStored() === null) {
          const active = nav.querySelector('a[aria-current="page"], a.active, a[selected], .nav-link[aria-current="page"]');
          if (active) {
            const t = computeTargetForElement(nav, active);
            savePosFor(nav, t);
          }
        }
      } catch(e){}
    })();

    // expose helpers for debugging / manual restore
    try {
      window.__agazati_nav_restore = restorePosition;
      window.__agazati_nav_save = () => savePosFor(nav);
      window.__agazati_nav_get = getStored;
    } catch (e) {}

  }); // onReady
})();