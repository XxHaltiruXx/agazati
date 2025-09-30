// NAV: JS-only — amikor kattintasz egy nav-linkre, az elem jobb széle a nav jobb szélére kerül,
// pozíció mentése sessionStorage-ba és visszaállítás oldalbetöltéskor (többször próbálkozva).
(function(){
  const KEY = 'agazati_nav_align_right_v1';
  const nav = document.querySelector('nav.navbar') || document.querySelector('.navbar');
  if(!nav) return;

  // Segéd: clamp
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Save current scrollLeft
  function savePos() {
    try {
      sessionStorage.setItem(KEY, String(Math.round(nav.scrollLeft || 0)));
    } catch(e) { /* ignore */ }
  }

  // Compute target so that elem's right edge aligns with nav's right edge
  function computeTargetForElement(el) {
    if(!el) return 0;
    // offsetLeft is relative to offsetParent; nav may be the offset parent in typical cases
    // to be robust, compute cumulative offset relative to nav
    let left = 0, node = el;
    while(node && node !== nav && node !== document.body) {
      left += node.offsetLeft || 0;
      node = node.offsetParent;
    }
    const elRight = left + (el.offsetWidth || 0);
    const target = elRight - nav.clientWidth;
    // clamp between 0 and maxScroll
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return clamp(Math.round(target), 0, max);
  }

  // Smoothly scroll nav to target (fallback to instant if not supported)
  function scrollNavTo(target, smooth = true) {
    try {
      if ('scrollTo' in nav) {
        nav.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
      } else {
        nav.scrollLeft = target;
      }
    } catch(e) {
      nav.scrollLeft = target;
    }
  }

  // On click inside nav: if click on anchor, align its right edge, save pos (capture phase so we save before navigation)
  document.addEventListener('click', function(ev){
    const a = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a');
    if(!a) return;
    // compute target for the clicked link
    const target = computeTargetForElement(a);
    // set scroll immediately for visual feedback (smooth)
    scrollNavTo(target, true);
    // save for next page load
    try { sessionStorage.setItem(KEY, String(target)); } catch(e){}
    // don't prevent default: allow navigation
  }, true); // use capture so save happens before navigation

  // Also save on touchend / scroll (throttled by rAF)
  let raf = null;
  nav.addEventListener('scroll', () => {
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { savePos(); raf = null; });
  }, { passive: true });

  nav.addEventListener('touchend', () => { setTimeout(savePos, 20); }, { passive: true });

  window.addEventListener('beforeunload', savePos);

  // Restore routine with retries + MutationObserver (in case menu items are injected later)
  function getStored() {
    try { const v = sessionStorage.getItem(KEY); return v === null ? null : Number(v) || 0; }
    catch(e){ return null; }
  }

  function restorePosition() {
    const stored = getStored();
    if(stored === null) return;
    const maxAttempts = 18;
    const retryDelay = 60;
    let attempts = 0;
    let stopped = false;
    const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);

    function attempt() {
      if(stopped) return;
      attempts++;
      // clamp stored to current max (in case layout changed)
      const desired = clamp(Math.round(stored), 0, maxScroll);
      // set it (try smooth = false to avoid interfering with page load animations)
      scrollNavTo(desired, false);

      // if close enough or max attempts reached => stop
      if (Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= maxAttempts) {
        stop();
        return;
      }
      // otherwise schedule another try (rAF + timeout increases chance layout settled)
      requestAnimationFrame(() => setTimeout(attempt, retryDelay));
    }

    function stop() {
      stopped = true;
      if(observer) observer.disconnect();
    }

    // observe DOM changes inside nav and restart attempts when children change
    const observer = new MutationObserver((mutations) => {
      if(stopped) return;
      // reset attempts and try again when things change
      attempts = 0;
      requestAnimationFrame(attempt);
    });

    try { observer.observe(nav, { childList: true, subtree: true, attributes: true }); }
    catch(e){ /* MutationObserver not supported -> proceed without it */ }

    // initial tries
    attempt();
    // a couple of delayed retries to help with slow resources
    setTimeout(() => { if(!stopped) attempt(); }, 120);
    setTimeout(() => { if(!stopped) attempt(); }, 250);
  }

  // Restore on common events
  window.addEventListener('pageshow', () => { setTimeout(restorePosition, 20); });
  window.addEventListener('DOMContentLoaded', () => { setTimeout(restorePosition, 30); });
  window.addEventListener('load', () => { setTimeout(restorePosition, 50); });

  // expose for debugging if needed
  try { window.__agazati_nav_align_right_restore = restorePosition; } catch(e){}

  // If no stored value yet, optionally initialize by aligning current active element (if any)
  (function initFromActive(){
    const active = nav.querySelector('a.active, a[aria-current="page"], a.selected');
    if(active && getStored() === null) {
      const t = computeTargetForElement(active);
      sessionStorage.setItem(KEY, String(t));
      // don't force-scroll right away; let restorePosition handle it on pageshow/load
    }
  })();

})();