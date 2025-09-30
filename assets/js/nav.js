/* NAV POSITION PERSIST — ment minden clicknél és visszaállít betöltés után */
(function(){
  const nav = document.querySelector('nav.navbar');
  if (!nav) return;
  const KEY = 'agazati_nav_scroll_v3';

  // -- Restore próbálkozások: többször is beállítjuk, amíg a layout nem stabilizálódik
  function restorePosition() {
    const stored = sessionStorage.getItem(KEY);
    if (stored === null) return;
    const target = Number(stored) || 0;
    let attempts = 0;
    function attempt() {
      attempts++;
      // állítjuk, majd ellenőrizzük, ha szükséges újrapróbáljuk
      nav.scrollLeft = target;
      // ha még nincs elérve a kívánt pozíció, ismételjük (max 10 próbálkozás)
      if (attempts < 10 && Math.abs(nav.scrollLeft - target) > 2) {
        requestAnimationFrame(attempt);
        setTimeout(attempt, 60);
      }
    }
    requestAnimationFrame(attempt);
  }

  // Restore több eseményre: pageshow (history vissza), DOMContentLoaded és load
  window.addEventListener('pageshow', restorePosition);
  window.addEventListener('DOMContentLoaded', () => setTimeout(restorePosition, 40));
  window.addEventListener('load', () => setTimeout(restorePosition, 80));

  // Mentés: scroll (throttle-olt), kattintás (linkre kattintáskor azonnal)
  let raf = null;
  nav.addEventListener('scroll', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      sessionStorage.setItem(KEY, nav.scrollLeft);
    });
  });

  // Mentsünk pozíciót MINDEN nav link megnyomásnál — így navigáláskor a céloldal tudja restore-olni
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    // ha az anchor target="_blank" vagy hasonló, akkor is eltároljuk
    sessionStorage.setItem(KEY, nav.scrollLeft);
    // ne preventDefault — hagyjuk a normál navigációt
  }, {passive: true});

  // extra biztonság: unload előtt is mentsünk
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem(KEY, nav.scrollLeft);
  });
})();