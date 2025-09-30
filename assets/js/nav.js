/* nav.js — align-on-target-page version
   Behavior:
   - On click: store the absolute href of the clicked nav link in sessionStorage (no immediate scrolling).
   - On page load: if stored href matches a link in the nav, compute & scroll so that link's RIGHT edge aligns with nav RIGHT edge.
   - Robust: retries + MutationObserver to wait for DOM layout.
   Install: include this file on every page (best place: just before </body>).
*/

(function () {
  const CLICK_TARGET_KEY = '__agazati_nav_target_href_v1';
  const POS_KEY = '__agazati_nav_pos_v1'; // optional fallback if you still store scrollLeft
  const RIGHT_PADDING = 0; // px gap you want between link right edge and nav right edge
  const MAX_RETRIES = 20;
  const RETRY_MS = 70;

  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 8);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 8));
    }
  }

  function findNav() {
    // prefer nav.navbar, otherwise first nav in header
    return document.querySelector('nav.navbar') || document.querySelector('header nav') || document.querySelector('nav') || null;
  }

  function saveClickedHref(absHref) {
    try {
      sessionStorage.setItem(CLICK_TARGET_KEY, String(absHref));
    } catch (e) { /* ignore */ }
  }

  function getClickedHref() {
    try {
      return sessionStorage.getItem(CLICK_TARGET_KEY);
    } catch (e) { return null; }
  }

  function clearClickedHref() {
    try { sessionStorage.removeItem(CLICK_TARGET_KEY); } catch (e) {}
  }

  function savePos(nav, value) {
    try {
      const v = typeof value === 'number' ? Math.round(value) : Math.round(nav.scrollLeft || 0);
      sessionStorage.setItem(POS_KEY, String(v));
    } catch (e) {}
  }

  function getPos() {
    try { const v = sessionStorage.getItem(POS_KEY); return v === null ? null : Number(v) || 0; } catch(e){return null;}
  }

  function computeTargetForElement(nav, el) {
    if (!nav || !el) return 0;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.right - navRect.right);
    const target = Math.round(nav.scrollLeft + delta - RIGHT_PADDING);
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return Math.max(0, Math.min(max, target));
  }

  function scrollNavTo(nav, target, smooth = false) {
    try {
      if ('scrollTo' in nav) nav.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
      else nav.scrollLeft = target;
    } catch (e) { try { nav.scrollLeft = target; } catch(_) {} }
  }

  // On click: store the absolute href, but DO NOT scroll immediately (so alignment happens on the *target* page)
  document.addEventListener('click', function (ev) {
    try {
      const clicked = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a, nav a');
      if (!clicked) return;
      // avoid hamburger toggles
      if (clicked.classList && clicked.classList.contains('sidebargomb')) return;

      // only store if href exists and is navigation (not just empty anchor)
      const href = clicked.getAttribute && clicked.getAttribute('href');
      if (!href) {
        // could be button with onclick -> we won't handle programmatic nav here
        return;
      }

      // Resolve absolute URL
      let abs;
      try { abs = new URL(href, location.href).href; } catch (e) { abs = href; }

      // Store the clicked absolute href for the *next* page to read and align against
      saveClickedHref(abs);

      // Also save current scrollLeft as fallback
      const nav = findNav();
      if (nav) savePos(nav);

      // do NOT prevent default — allow navigation to happen naturally
    } catch (e) { /* swallow */ }
  }, true); // capture to store before navigation starts

  // Also save on scroll/touchend/beforeunload in case user moves nav manually
  onReady(() => {
    const nav = findNav();
    if (!nav) return;

    // throttle save via RAF
    let raf = null;
    nav.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { savePos(nav); raf = null; });
    }, { passive: true });

    nav.addEventListener('touchend', () => setTimeout(() => savePos(nav), 20), { passive: true });
    window.addEventListener('beforeunload', () => savePos(nav));
  });

  // On this page load: if a stored clicked href exists and it matches a nav link here, align that link to right edge
  onReady(() => {
    const nav = findNav();
    if (!nav) return;

    const storedHref = getClickedHref();
    if (!storedHref) {
      // no targeted navigation to restore to; optionally restore raw scroll pos fallback
      // const rawPos = getPos(); if (rawPos!==null) scrollNavTo(nav, rawPos, false);
      return;
    }

    // Find best matching anchor inside our nav: match by absolute href equality first,
    // then by pathname equality, then by pathname last segment.
    function resolveAbs(a) {
      try { return new URL(a.getAttribute('href'), location.href).href; } catch(e){ return a.getAttribute('href') || ''; }
    }

    function pathnameOf(href) {
      try { return new URL(href).pathname; } catch(e){ return href; }
    }

    const anchors = Array.from(nav.querySelectorAll('a'));
    let match = null;

    // 1) exact absolute href match
    for (const a of anchors) {
      if (!a.getAttribute('href')) continue;
      if (resolveAbs(a) === storedHref) { match = a; break; }
    }
    // 2) match by pathname
    if (!match) {
      const storedPath = pathnameOf(storedHref);
      for (const a of anchors) {
        if (!a.getAttribute('href')) continue;
        if (pathnameOf(resolveAbs(a)) === storedPath) { match = a; break; }
      }
    }
    // 3) match by last path segment (e.g., "/python/" <-> "/html/python/")
    if (!match) {
      const seg = (s) => (s || '').replace(/\/+$/, '').split('/').filter(Boolean).pop() || '';
      const storedSeg = seg(pathnameOf(storedHref));
      if (storedSeg) {
        for (const a of anchors) {
          const aSeg = seg(pathnameOf(resolveAbs(a)));
          if (aSeg && aSeg === storedSeg) { match = a; break; }
        }
      }
    }

    // If we found match, run restore routine to align it to right
    if (match) {
      // attempt several times (in case nav layout changes)
      let attempts = 0;
      let stopped = false;

      const observer = (function createObserver() {
        try {
          const mo = new MutationObserver(() => {
            if (!stopped) { attempts = 0; requestAnimationFrame(attempt); }
          });
          mo.observe(nav, { childList: true, subtree: true, attributes: true });
          return mo;
        } catch (e) { return null; }
      })();

      function attempt() {
        if (stopped) return;
        attempts++;
        // compute desired scrollLeft
        const desired = computeTargetForElement(nav, match);
        scrollNavTo(nav, desired, false);
        // stop if close enough or out of attempts
        if (Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= MAX_RETRIES) {
          stop();
          return;
        }
        requestAnimationFrame(() => setTimeout(attempt, RETRY_MS));
      }

      function stop() {
        stopped = true;
        try { observer && observer.disconnect(); } catch (e) {}
        // clear the stored click target so it doesn't re-trigger
        clearClickedHref();
      }

      // start attempts
      attempt();
      // extra delayed retries
      setTimeout(() => { if (!stopped) attempt(); }, 120);
      setTimeout(() => { if (!stopped) attempt(); }, 260);
      return;
    }

    // No matching anchor: fallback to restoring raw saved scrollLeft if available
    const rawPos = getPos();
    if (rawPos !== null) {
      let attempts = 0;
      let stopped = false;
      const observer = null;
      function attemptPos() {
        if (stopped) return;
        attempts++;
        const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
        const desired = Math.max(0, Math.min(max, Math.round(rawPos)));
        scrollNavTo(nav, desired, false);
        if (Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= MAX_RETRIES) {
          stopped = true;
          try { clearClickedHref(); } catch (e) {}
          return;
        }
        requestAnimationFrame(() => setTimeout(attemptPos, RETRY_MS));
      }
      attemptPos();
    } else {
      // nothing to do, just clear stored target to avoid re-triggering
      clearClickedHref();
    }
  });

})();