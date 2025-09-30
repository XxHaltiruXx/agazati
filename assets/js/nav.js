

// NAV SCROLL STATE — menti a navbar vízszintes pozícióját és visszaállítja
(function(){
  const nav = document.querySelector('nav.navbar');
  if (!nav) return;

  const KEY = 'agazati_nav_scroll_v2';

  // visszaállítás amikor az oldal betöltődik vagy historyból visszajön (pageshow lefut)
  window.addEventListener('pageshow', () => {
    const v = sessionStorage.getItem(KEY);
    if (v !== null) {
      // biztosítjuk, hogy a render megtörténjen előbb
      requestAnimationFrame(() => { nav.scrollLeft = Number(v); });
    }
  });

  // mentés throttle-olt módon (requestAnimationFrame)
  let rafId = null;
  nav.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      sessionStorage.setItem(KEY, nav.scrollLeft);
    });
  });

  // ha valami fókusz miatt nyomná a scroll-t (pl. link focus),
  // rögtön visszaállítjuk a mentett pozíciót
  nav.addEventListener('focusin', () => {
    const v = sessionStorage.getItem(KEY);
    if (v !== null) requestAnimationFrame(() => { nav.scrollLeft = Number(v); });
  });
})();