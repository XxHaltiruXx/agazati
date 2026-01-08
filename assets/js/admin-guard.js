// ====================================
// ADMIN OLDAL VÉDELEM
// ====================================
// Ez a script automatikusan védi az admin oldalakat
// Ha valaki nem admin vagy nincs bejelentkezve, átirányítja

(function() {
  'use strict';

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

    while (attempts < maxAttempts) {
      // Várjuk meg a window.getAuth() elérhetőségét ÉS hogy be is töltődjön az auth
      if (window.getAuth && typeof window.getAuth === 'function') {
        const auth = window.getAuth();
        
        // Várjuk meg hogy az auth tényleg inicializálódjon ÉS a profil betöltődjön
        if (auth && auth.sb && auth.currentUser !== undefined && auth.profileLoaded) {
          // console.log('🔐 Admin guard: Auth ÉS profil betöltve, ellenőrzés...', { 
          //   isAuthenticated: auth.isAuthenticated(), 
          //   isAdmin: auth.isAdminUser() 
          // });
          
          // Ellenőrizzük hogy be van-e jelentkezve és admin-e
          const isLoggedIn = auth.isAuthenticated();
          const isAdmin = auth.isAdminUser();
          
          if (!isLoggedIn) {
            // console.warn('⛔ Nem vagy bejelentkezve! Átirányítás a főoldalra...');
            alert('⛔ Ez az oldal csak bejelentkezett felhasználóknak érhető el!');
            window.location.href = getBaseUrl();
            return;
          }
          
          if (!isAdmin) {
            // console.warn('⛔ Nem vagy admin! Átirányítás vissza...');
            alert('⛔ Ez az oldal csak admin felhasználók számára érhető el!');
            
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
      
      // Első 5 másodpercben gyakrabban logoljunk (csak debug módban)
      // if (attempts % 20 === 0 && attempts <= 50) {
      //   console.log(`⏳ Admin guard: Várakozás... ${attempts/10}s (getAuth: ${!!window.getAuth}, auth: ${!!window.getAuth?.()}, profileLoaded: ${window.getAuth?.()?.profileLoaded})`);
      // }
      
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
