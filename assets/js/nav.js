// nav.js - align-on-target (debugged, robust)
// v2 - use this file, place it just before </body> on every page.
(function(){
  const CLICK_KEY = '__agazati_nav_target_v2';
  const POS_KEY = '__agazati_nav_pos_v2';
  const RIGHT_PADDING = 0;          // px, ha akarsz kis margót a jobb oldalra
  const MAX_ATTEMPTS = 40;
  const RETRY_MS = 80;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function absHref(href) {
    try { return new URL(href, location.href).href; } catch(e){ return href || ''; }
  }
  function normPath(href) {
    try { const u = new URL(href, location.href); return u.pathname.replace(/\/+$/, '') || '/'; }
    catch(e){ return (href || '').replace(/\/+$/, '') || '/'; }
  }
  function lastSegmentFromPath(path) {
    const segs = (path||'').replace(/\/+$/,'').split('/').filter(Boolean);
    return segs.length ? segs[segs.length-1] : '';
  }

  // Find navbar: prefer nav.navbar, else header nav, else first nav
  function findNav() {
    return document.querySelector('nav.navbar') || document.querySelector('header nav') || document.querySelector('nav') || null;
  }

  // Save clicked target (absolute href)
  function saveClicked(abs) {
    try { sessionStorage.setItem(CLICK_KEY, String(abs)); }
    catch(e){}
  }
  function getClicked() {
    try { return sessionStorage.getItem(CLICK_KEY); } catch(e){ return null; }
  }
  function clearClicked() {
    try { sessionStorage.removeItem(CLICK_KEY); } catch(e){}
  }

  function saveRawPos(nav, v) {
    try {
      const val = typeof v === 'number' ? Math.round(v) : Math.round(nav.scrollLeft || 0);
      sessionStorage.setItem(POS_KEY, String(val));
    } catch(e){}
  }
  function getRawPos() {
    try { const v = sessionStorage.getItem(POS_KEY); return v === null ? null : Number(v) || 0; } catch(e){ return null; }
  }

  // compute target scrollLeft so el's right edge aligns with nav right edge (minus RIGHT_PADDING)
  function computeTarget(nav, el) {
    if(!nav || !el) return 0;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.right - navRect.right);
    const target = Math.round(nav.scrollLeft + delta - RIGHT_PADDING);
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return clamp(target, 0, max);
  }

  function scrollNavTo(nav, target, smooth=false) {
    try {
      if('scrollTo' in nav) nav.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
      else nav.scrollLeft = target;
    } catch(e){ try { nav.scrollLeft = target; } catch(_){} }
  }

  // On click: store abs href, but DO NOT scroll now
  document.addEventListener('click', function(ev){
    try {
      const a = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a, nav a');
      if(!a) return;
      if (a.classList && a.classList.contains('sidebargomb')) return; // skip hamburger
      const href = a.getAttribute && a.getAttribute('href');
      if(!href) return;
      const abs = absHref(href);
      saveClicked(abs);
      // also save raw pos as fallback
      const nav = findNav(); if (nav) saveRawPos(nav);
      // do not prevent default navigation
    } catch(e){}
  }, true);

  // make sure we also save position during manual scrolls
  function attachSaveDuringScroll(nav) {
    if(!nav) return;
    let raf = null;
    nav.addEventListener('scroll', () => {
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { saveRawPos(nav); raf = null; });
    }, { passive: true });
    nav.addEventListener('touchend', () => setTimeout(()=> saveRawPos(nav), 20), { passive: true });
    window.addEventListener('beforeunload', () => saveRawPos(nav));
  }

  // attempt to find best matching anchor inside nav for stored target href
  function findBestMatch(nav, storedAbs) {
    if(!nav) return null;
    const anchors = Array.from(nav.querySelectorAll('a')).filter(a => a.getAttribute('href'));
    const storedPath = normPath(storedAbs);
    const storedSeg = lastSegmentFromPath(storedPath);
    const storedAbsNorm = (storedAbs || '').replace(/\/+$/,'');
    // 1) exact absolute href match
    for(const a of anchors){
      try { if (absHref(a.getAttribute('href')).replace(/\/+$/,'') === storedAbsNorm) return a; } catch(e){}
    }
    // 2) pathname equality
    for(const a of anchors){
      try { if (normPath(a.getAttribute('href')) === storedPath) return a; } catch(e){}
    }
    // 3) last segment match
    if(storedSeg){
      for(const a of anchors){
        try { if (lastSegmentFromPath(normPath(a.getAttribute('href'))) === storedSeg) return a; } catch(e){}
      }
    }
    // 4) match by text (loose)
    const storedText = (storedSeg || '').toLowerCase();
    if(storedText){
      for(const a of anchors){
        try { if ((a.textContent||'').toLowerCase().includes(storedText)) return a; } catch(e){}
      }
    }
    // 5) fallback: any anchor with href containing the stored last segment
    if(storedSeg){
      for(const a of anchors){
        try { if ((a.getAttribute('href')||'').indexOf(storedSeg) !== -1) return a; } catch(e){}
      }
    }
    return null;
  }

  // highlight element briefly so you see what's matched
  function flashElement(el) {
    if(!el || !el.style) return;
    const origOutline = el.style.outline || '';
    el.style.outline = '3px solid rgba(255,200,0,0.95)';
    el.style.transition = 'outline 0.25s ease';
    setTimeout(()=> { el.style.outline = origOutline; }, 900);
  }

  // Main restore routine on page load
  function tryRestoreOnLoad() {
    const nav = findNav();
    if(!nav) return;
    attachSaveDuringScroll(nav);

    const storedAbs = getClicked();
    if(!storedAbs) {
      // no specific click target -> optional raw pos restore
      const raw = getRawPos();
      if(raw !== null) {
        // try to restore raw pos quickly
        let attempts = 0; let stopped = false;
        function attemptRaw() {
          if(stopped) return;
          attempts++;
          const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
          const desired = clamp(Math.round(raw), 0, max);
          scrollNavTo(nav, desired, false);
          if(Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= MAX_ATTEMPTS) stopped = true;
          else requestAnimationFrame(()=> setTimeout(attemptRaw, RETRY_MS));
        }
        attemptRaw();
      }
      return;
    }

    // We have a stored clicked href -> try to find matching anchor in this nav
    let attempts = 0; let stopped = false;
    const match = { el: null };

    const mo = (function(){
      try {
        const observer = new MutationObserver(() => {
          if(stopped) return;
          attempts = 0;
          requestAnimationFrame(attempt);
        });
        observer.observe(nav, { childList: true, subtree: true, attributes: true });
        return observer;
      } catch(e){ return null; }
    })();

    function attempt(){
      if (stopped) return;
      attempts++;
      if (!match.el) match.el = findBestMatch(nav, storedAbs);
      if (match.el) {
        const desired = computeTarget(nav, match.el);
        scrollNavTo(nav, desired, false);
        flashElement(match.el);
        // success condition
        if (Math.abs(nav.scrollLeft - desired) <= 2) {
          stop(true);
          return;
        }
      }
      if (attempts >= MAX_ATTEMPTS) {
        stop(false);
        return;
      }
      requestAnimationFrame(()=> setTimeout(attempt, RETRY_MS));
    }

    function stop(success){
      stopped = true;
      try { mo && mo.disconnect(); } catch(e){}
      // if success clear the stored clicked href so it won't trigger again
      if(success) clearClicked();
      else {
        // no match found: clear to avoid trying forever
        clearClicked();
      }
    }

    attempt();
  }

  // Run restore after DOM ready + load events (multiple hooks)
  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(fn, 8);
    else document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 8));
  }
  onReady(() => {
    // try also on load and pageshow to be extra robust
    tryRestoreOnLoad();
    window.addEventListener('load', () => setTimeout(tryRestoreOnLoad, 30));
    window.addEventListener('pageshow', () => setTimeout(tryRestoreOnLoad, 20));
  });

  // small helper for debugging: expose methods on window
  try {
    window.__agazati_nav_debug = {
      saveClicked, getClicked, clearClicked, computeTarget, findNav, getRawPos
    };
  } catch(e){}
})();