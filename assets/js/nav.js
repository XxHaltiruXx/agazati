// nav.js - mobile-only, instant (no animation) align-on-target
// Replace your existing file with this. Designed to run on small screens only.
// v2.1 - instant restore, no smooth scroll, runs only when window.matchMedia("(max-width:768px)").matches

function toggleNav() {
    const sidenav = document.getElementById("mySidenav");
    sidenav.style.width = sidenav.style.width === "250px" ? "0" : "250px";
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("searchNav").addEventListener("input", function () {
        let filter = this.value.toLowerCase().trim();
        let links = document.querySelectorAll(".sidenav a");

        if (filter === "") {
            links.forEach(link => {
                link.style.display = "";
            });
            return;
        }
        
        links.forEach(link => {
            link.style.display = link.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
    });
});

(function(){
  const CLICK_KEY = '__agazati_nav_target_v2';
  const POS_KEY = '__agazati_nav_pos_v2';
  const RIGHT_PADDING = 0;          // px, ha kell kis margó, ide írd
  const MAX_ATTEMPTS = 40;
  const RETRY_MS = 70;
  const MOBILE_QUERY = '(max-width: 768px)';

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

  function findNav() {
    return document.querySelector('nav.navbar') || document.querySelector('header nav') || document.querySelector('nav') || null;
  }

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

  function computeTarget(nav, el) {
    if(!nav || !el) return 0;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.right - navRect.right);
    const target = Math.round(nav.scrollLeft + delta - RIGHT_PADDING);
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return clamp(target, 0, max);
  }

  function instantScrollNavTo(nav, target) {
    // Ensure NO smooth animation: temporarily force 'scroll-behavior: auto' inline,
    // set scrollLeft directly, then restore previous inline value.
    if (!nav) return;
    const prev = nav.style.scrollBehavior;
    try {
      nav.style.scrollBehavior = 'auto';
      // set directly to reduce flicker
      nav.scrollLeft = target;
    } catch(e) {
      try { nav.scrollLeft = target; } catch(_) {}
    } finally {
      // restore original inline style after a tick (so it won't affect other code)
      requestAnimationFrame(() => {
        // keep whatever inline style was before
        nav.style.scrollBehavior = prev || '';
      });
    }
  }

  // click handler: store absolute href only (no scrolling now)
  document.addEventListener('click', function(ev){
    try {
      const a = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a, nav a');
      if(!a) return;
      if (a.classList && a.classList.contains('sidebargomb')) return;
      const href = a.getAttribute && a.getAttribute('href');
      if(!href) return;
      const abs = absHref(href);
      saveClicked(abs);
      const nav = findNav(); if (nav) saveRawPos(nav);
    } catch(e){}
  }, true);

  function attachSaveDuringScroll(nav) {
    if(!nav) return;
    let raf = null;
    nav.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { saveRawPos(nav); raf = null; });
    }, { passive: true });
    nav.addEventListener('touchend', () => setTimeout(()=> saveRawPos(nav), 20), { passive: true });
    window.addEventListener('beforeunload', () => saveRawPos(nav));
  }

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

  // Restore routine — MOBILE ONLY and INSTANT (no animation)
  function tryRestoreOnLoad() {
    // run only on mobile-sized viewports
    if (!window.matchMedia || !window.matchMedia(MOBILE_QUERY).matches) return;
    const nav = findNav();
    if(!nav) return;
    attachSaveDuringScroll(nav);

    const storedAbs = getClicked();
    if(!storedAbs) {
      // fallback: raw pos restore
      const raw = getRawPos();
      if(raw !== null) {
        let attempts = 0; let stopped = false;
        function attemptRaw() {
          if(stopped) return;
          attempts++;
          const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
          const desired = clamp(Math.round(raw), 0, max);
          // instant scroll (no animation)
          instantScrollNavTo(nav, desired);
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
        // instant set (no smooth)
        instantScrollNavTo(nav, desired);
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
      // clear stored click only on success to avoid repeated attempts indefinitely
      if(success) clearClicked();
      else clearClicked();
    }

    attempt();
  }

  // Hook into load lifecycle — we try to run as early as possible + retries
  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(fn, 8);
    else document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 8));
  }
  onReady(() => {
    tryRestoreOnLoad();
    // extra hooks to increase chance of restoring before visible paint
    window.addEventListener('pageshow', () => tryRestoreOnLoad());
    window.addEventListener('load', () => tryRestoreOnLoad());
  });

  // Expose debug helpers (safe)
  try {
    window.__agazati_nav_debug = {
      saveClicked, getClicked, clearClicked, computeTarget, findNav, getRawPos
    };
  } catch(e){}
})();
