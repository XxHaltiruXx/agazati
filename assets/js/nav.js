/* NAV — JS-only: kattintásra a link jobb széle a navbar jobb széléhez igazodik; mentés+restore
   Hely: ideálisan a </body> elé vagy assets/js/main.js végére. */
(function(){
  const KEY = 'agazati_nav_align_right_v2';
  const rightPadding = 0; // ha szeretnél kis belső margót a jobb oldalra, állítsd pl. 12-re

  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // kis késleltetés hogy minden DOM elem biztosan ott legyen
      setTimeout(fn, 10);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 10));
    }
  }

  onReady(() => {
    const nav = document.querySelector('nav.navbar') || document.querySelector('.navbar');
    if (!nav) {
      console.warn('[nav-align] Navbar nem található.');
      return;
    }

    console.info('[nav-align] Inited — navbar found.');

    // segédfüggvény: mentés
    function savePos(val) {
      try {
        const v = typeof val === 'number' ? Math.round(val) : Math.round(nav.scrollLeft || 0);
        sessionStorage.setItem(KEY, String(v));
        console.debug('[nav-align] Saved pos', v);
      } catch (e) { console.warn('[nav-align] Save failed', e); }
    }

    // segéd: beolvasás
    function getStored() {
      try {
        const v = sessionStorage.getItem(KEY);
        return v === null ? null : Number(v) || 0;
      } catch (e) { return null; }
    }

    // számoljuk ki a targetet úgy, hogy az elem jobb széle a nav jobb szélére kerüljön
    function computeTargetForElement(el) {
      if (!el) return 0;
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      // mennyivel van az elem jobb széle a nav jobb szélétől (pozitív => jobbra van)
      const delta = (elRect.right - navRect.right);
      const target = nav.scrollLeft + delta - rightPadding;
      const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
      const clamped = Math.max(0, Math.min(max, Math.round(target)));
      console.debug('[nav-align] computeTarget', {delta, target, clamped, max});
      return clamped;
    }

    // sima/compat scroll
    function scrollNavTo(target, smooth = true) {
      try {
        if ('scrollTo' in nav) {
          nav.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
        } else {
          nav.scrollLeft = target;
        }
      } catch (e) {
        nav.scrollLeft = target;
      }
    }

    // kattintás: capture fázisban mentsük és görgessük
    document.addEventListener('click', function(ev){
      const a = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a');
      if (!a) return;
      // ha a linknek nincs href vagy csak a hamburger span, kilépünk
      if (!a.href && a.getAttribute('role') !== 'link') return;

      const target = computeTargetForElement(a);
      // vizuális feedback: görgessük oda
      scrollNavTo(target, true);
      // azonnal mentsük (capture=true ensures happens before navigation)
      savePos(target);
      // ne preventDefault: engedjük a navigációt
    }, true);

    // scroll mentés (throttle rAF)
    let raf = null;
    nav.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { savePos(); raf = null; });
    }, { passive: true });

    // touchen végén mentés
    nav.addEventListener('touchend', () => setTimeout(() => savePos(), 20), { passive: true });

    // beforeunload biztosítás
    window.addEventListener('beforeunload', () => savePos());

    // Visszaállító rutin: többször próbálkozik és figyeli a DOM-ot
    function restorePosition() {
      const stored = getStored();
      if (stored === null) {
        console.debug('[nav-align] No stored pos');
        return;
      }
      const maxAttempts = 18;
      const retryDelay = 60;
      let attempts = 0;
      let stopped = false;

      const maxScroll = () => Math.max(0, nav.scrollWidth - nav.clientWidth);

      function attempt() {
        if (stopped) return;
        attempts++;
        const desired = Math.max(0, Math.min(maxScroll(), Math.round(stored)));
        scrollNavTo(desired, false);
        console.debug('[nav-align] restore attempt', attempts, desired, 'current', nav.scrollLeft);
        if (Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= maxAttempts) {
          stop();
          return;
        }
        requestAnimationFrame(() => setTimeout(attempt, retryDelay));
      }

      function stop() {
        stopped = true;
        try { if (observer) observer.disconnect(); } catch(e){}
        console.debug('[nav-align] restore stopped at attempt', attempts, 'current', nav.scrollLeft);
      }

      // figyeljük ha a nav DOM-ja változik (pl. dinamikusan tölt)
      let observer = null;
      try {
        observer = new MutationObserver((mutations) => {
          if (stopped) return;
          attempts = 0; // reseteljük
          requestAnimationFrame(attempt);
        });
        observer.observe(nav, { childList: true, subtree: true, attributes: true });
      } catch (e) {
        observer = null;
      }

      attempt();
      setTimeout(() => { if (!stopped) attempt(); }, 120);
      setTimeout(() => { if (!stopped) attempt(); }, 260);
    }

    // események amire visszaállítunk
    window.addEventListener('pageshow', () => setTimeout(restorePosition, 20));
    window.addEventListener('DOMContentLoaded', () => setTimeout(restorePosition, 30));
    window.addEventListener('load', () => setTimeout(restorePosition, 60));

    // ha nincs még mentett érték, inicializáljuk az aktív linkhez
    (function initFromActive(){
      const active = nav.querySelector('a[aria-current="page"], a.active, a.selected');
      if (active && getStored() === null) {
        const t = computeTargetForElement(active);
        savePos(t);
      }
    })();

    // debug: ha semmi sem történik, nézd meg a konzolt (mobile devtools)
    console.info('[nav-align] Ready. Click a nav link (pl. Python) to align right edge.');
  });
})();