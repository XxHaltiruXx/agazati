// ====================================
// ADMIN OLDAL VÉDELEM
// ====================================
// Ez a script automatikusan védi az admin oldalakat
// Ha valaki nem admin vagy nincs bejelentkezve, átirányítja

(function() {
  'use strict';

  // Publikus megosztási mód felismerése (?file=... paraméter)
  const isPublicShare = new URLSearchParams(window.location.search).has('file');

  // Publikus letöltésnél nem kell admin/auth ellenőrzés
  if (isPublicShare) {
    // console.log('🔓 Admin guard kikapcsolva publikus megosztás miatt');
    return;
  }

  // Egyszeri értesítés guard – hogy ne jelenjen meg többször az alert
  let alreadyNotified = false;

  // Várjuk meg az auth inicializálását
  async function checkAdminAccess() {
    const maxAttempts = 300; // 30 másodperc (300 x 100ms) - hosszabb timeout
    let attempts = 0;
    
    // Helper a helyes baseUrl-hez
    function getBaseUrl() {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      if (origin.includes('github.io') || pathname.includes('/agazati/')) {
        return origin.includes('github.io') ? origin + '/agazati/' : '/agazati/';
      }
      return '/';
    }

    // console.log('🔐 Admin guard: Várakozás az auth betöltésére...');

    // Előzetes gyors ellenőrzés - ha van cache és az admin, akkor engedélyezzük gyorsan
    let fastCheckPassed = false;
    try {
      const ADMIN_CACHE_KEY = '_agazati_admin_cache';
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) {
        const { isAdmin, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 perc
        
        if (isAdmin && (now - timestamp < CACHE_EXPIRY_MS)) {
          // console.log('⚡ Admin cache találat - gyors engedélyezés');
          fastCheckPassed = true;
          // NEM return-ölünk! Csak felgyorsítjuk az oldal betöltést,
          // de az auth verifikációt továbbra is végigvisszük
        }
      }
    } catch (err) {
      // Ha hiba van a cache olvasásban, folytatjuk normál módon
    }

    while (attempts < maxAttempts) {
      // Várjuk meg a window.getAuth() elérhetőségét ÉS hogy be is töltődjön az auth
      if (window.getAuth && typeof window.getAuth === 'function') {
        const auth = window.getAuth();
        
        // Várjuk meg hogy az auth tényleg inicializálódjon ÉS a session/profil ellenőrzés befejeződjön
        // A profileLoaded flag azt jelzi, hogy a session ellenőrzés és profil betöltés befejeződött
        if (auth && auth.sb && auth.profileLoaded === true) {
          // console.log('🔐 Admin guard: Auth ÉS profil betöltve, ellenőrzés...', { 
            // isAuthenticated: auth.isAuthenticated(), 
            // isAdmin: auth.isAdminUser(),
            // currentUser: !!auth.currentUser
          // });
          
          // Ellenőrizzük hogy be van-e jelentkezve és admin-e
          const isLoggedIn = auth.isAuthenticated();
          const isAdmin = auth.isAdminUser();
          
          if (!isLoggedIn) {
            if (!alreadyNotified) {
              alreadyNotified = true;
              alert('⛔ Ez az oldal csak bejelentkezett felhasználóknak érhető el!');
            }
            window.location.href = getBaseUrl();
            return;
          }
          
          if (!isAdmin) {
            if (!alreadyNotified) {
              alreadyNotified = true;
              alert('⛔ Ez az oldal csak admin felhasználók számára érhető el!');
            }
            
            // Visszaírányítás az előző oldalra vagy főoldalra
            if (document.referrer && !document.referrer.includes('secret/')) {
              window.location.href = document.referrer;
            } else {
              window.location.href = getBaseUrl();
            }
            return;
          }
          
          // console.log('✅ Admin hozzáférés engedélyezve');
          return; // Minden OK
        }
      }
      
      // Debug log minden 1 másodpercben (10 attempt) - csak ha sokáig tart
      if (attempts % 10 === 0 && attempts > 0) {
        // console.log(`⏳ Admin guard: Várakozás... ${attempts/10}s`, {
          // getAuth: !!window.getAuth, 
          // auth: !!window.getAuth?.(), 
          // sb: !!window.getAuth?.()?.sb,
          // profileLoaded: window.getAuth?.()?.profileLoaded
        // });
      }
      
      // Várunk 100ms-ot
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Ha nem sikerült betölteni az auth-ot 30 másodperc alatt
    console.error('❌ Admin guard: Auth nem töltődött be időben!');
    console.error('Részletek:', {
      getAuth: !!window.getAuth,
      auth: !!window.getAuth?.(),
      authReady: !!window._agazati_auth_ready,
      profileLoaded: window.getAuth?.()?.profileLoaded
    });
    alert('⚠️ Hiba történt az authentikáció betöltésekor.\n\nFrissítsd az oldalt (F5) vagy töröld a böngésző cache-t!');
    window.location.href = getBaseUrl();
  }

  // Automatikus ellenőrzés amikor az oldal betöltődik
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminAccess);
  } else {
    checkAdminAccess();
  }
})();
