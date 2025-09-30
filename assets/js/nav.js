/* NAV - JS-ONLY scroll position persist (place at the end of assets/js/main.js) */
(function () {
  const KEY = 'agazati_nav_scroll_js_only_v1';
  const MAX_RESTORE_ATTEMPTS = 20;   // hány próbálkozásig ismételjen
  const RESTORE_RETRY_MS = 60;       // timeout köztük
  const nav = document.querySelector('nav.navbar') || document.querySelector('.navbar');

  if (!nav) {
    // nincs navbar: semmi dolga
    return;
  }

  // --------------------------
  // Mentés funkció
  // --------------------------
  function savePosition() {
    try {
      // Math.round csökkenti a felesleges értékváltozásokat
      sessionStorage.setItem(KEY, String(Math.round(nav.scrollLeft || 0)));
    } catch (e) {
      // sessionStorage hibától független marad az oldal
      console.warn('Nav position save failed', e);
    }
  }

  // Throttle mentés scroll közben (raf alapú)
  let rafId = null;
  nav.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      savePosition();
      rafId = null;
    });
  }, { passive: true });

  // Mentsünk kattintásnál (capture-ban, hogy navigáció előtt elmentsen)
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a');
    if (a) savePosition();
  }, true);

  // Ments touch végekor is (mobil)
  nav.addEventListener('touchend', () => {
    // kis késleltetés, hogy a scrollLeft befejeződjön
    setTimeout(savePosition, 20);
  }, { passive: true });

  // Biztonsági mentés unload előtt
  window.addEventListener('beforeunload', savePosition);

  // Ha az oldal hash-változást produkál (pl. anchor link), akkor mentünk és később restore-olunk
  window.addEventListener('hashchange', () => {
    savePosition();
    // kis delay után visszaállítunk, mert a hash gyakran okoz native jumpot
    setTimeout(restorePosition, 40);
  });

  // --------------------------
  // Visszaállítás funkció
  // --------------------------
  function getStored() {
    try {
      const v = sessionStorage.getItem(KEY);
      return v === null ? null : Number(v) || 0;
    } catch (e) {
      return null;
    }
  }

  function restorePosition() {
    const stored = getStored();
    if (stored === null) return;

    // Ha a nav elemei még nem töltődtek be, vagy a scrollWidth később nő,
    // próbáljuk többször beállítani, és figyeljük a DOM változásait.
    let attempts = 0;
    let cancelled = false;

    // Ha a nav jelenleg kisebb, mint stored, akkor várjunk, mert nem fér el
    function attemptOnce() {
      if (cancelled) return;
      attempts++;
      // beállítjuk
      nav.scrollLeft = stored;

      // ha elég közel vagyunk, vége
      if (Math.abs(nav.scrollLeft - stored) <= 2) {
        stop();
        return;
      }

      if (attempts >= MAX_RESTORE_ATTEMPTS) {
        stop();
        return;
      }

      // újrapróbálkozás: rAF + timeout kettőse jobb esély a stabil layoutra
      requestAnimationFrame(() => {
        setTimeout(attemptOnce, RESTORE_RETRY_MS);
      });
    }

    function stop() {
      cancelled = true;
      if (observer) observer.disconnect();
    }

    // Ha a DOM később változik (pl. menü JS generálja a linkeket), akkor újraindítjuk a próbálkozást
    const observer = new MutationObserver((mutations) => {
      // ha van változás a children-ben vagy attribútumban, próbálkozzunk újra
      if (mutations && mutations.length) {
        if (!cancelled) {
          attempts = 0; // reset próbálatok, mert most frissült a DOM
          attemptOnce();
        }
      }
    });

    // figyeljük a navbar változásait (children, subtree) és attribútumokat
    try {
      observer.observe(nav, { childList: true, subtree: true, attributes: true });
    } catch (e) {
      // ha az observe nem támogatott vagy hiba van, folytatjuk observer nélkül
    }

    // Első próbálkozások: azonnal + kis késleltések
    attemptOnce();
  }

  // Restore különböző eseményekre: history (pageshow), DOMContentLoaded, load,
  // és egy kis késleltetésre is, hogy képek/egyéb erőforrások betöltése után sikeres legyen.
  window.addEventListener('pageshow', () => {
    // pageshow lefut, ha historyból visszajön a felhasználó
    setTimeout(restorePosition, 20);
    setTimeout(restorePosition, 120);
  });

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(restorePosition, 20);
    setTimeout(restorePosition, 120);
  });

  window.addEventListener('load', () => {
    setTimeout(restorePosition, 40);
    setTimeout(restorePosition, 200);
  });

  // Ha fókusz kerül linkre (pl. tab vagy JS focus), akkor is próbáljuk helyre tenni a scrollt
  nav.addEventListener('focusin', () => {
    setTimeout(restorePosition, 10);
  });

  // Ha a user kinyitja a menüt (ha van custom toggle), akkor érdemes lehet manuálisan hívni restorePosition()
  // Exportáljuk ide az ablakra, hogy dev-kód tudja hívni ha kell:
  try {
    window.__agazati_nav_restore = restorePosition;
    window.__agazati_nav_save = savePosition;
  } catch (e) {/* ignore */ }

  // első mentés, ha nincs még semmi
  if (getStored() === null) savePosition();
})();