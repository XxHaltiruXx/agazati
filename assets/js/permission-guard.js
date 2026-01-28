// ====================================
// PERMISSION GUARD - Jogosultság ellenőrzés
// ====================================
// Ez a script ellenőrzi a felhasználó jogosultságait
// és átirányítja, ha nincs hozzáférése

(function() {
  'use strict';

  // Publikus megosztási mód felismerése (?file=... paraméter)
  const isPublicShare = new URLSearchParams(window.location.search).has('file');

  // Publikus letöltésnél nem kell jogosultság ellenőrzés
  if (isPublicShare) {
    console.log('🔓 Permission guard kikapcsolva publikus megosztás miatt');
    return;
  }

  // Egyszeri értesítés
  let alreadyNotified = false;

  // Helper a helyes baseUrl-hez
  function getBaseUrl() {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    if (origin.includes('github.io') || pathname.includes('/agazati/')) {
      return origin.includes('github.io') ? origin + '/agazati/' : '/agazati/';
    }
    return '/';
  }

  // Jogosultság ellenőrzése
  async function checkPermission(requiredPermission) {
    const maxAttempts = 300; // 30 másodperc
    let attempts = 0;
    
    console.log(`🔐 Permission guard: Ellenőrzés - ${requiredPermission}`);

    while (attempts < maxAttempts) {
      const auth = window.getAuth ? window.getAuth() : null;
      
      if (auth && auth.profileLoaded) {
        // Auth betöltődött
        
        if (!auth.isAuthenticated()) {
          // Nincs bejelentkezve
          if (!alreadyNotified) {
            alreadyNotified = true;
            alert('⛔ Jelentkezz be a folytatáshoz!');
          }
          window.location.href = getBaseUrl();
          return false;
        }
        
        // Gyors cache ellenőrzés (ne blokkoljon feleslegesen)
        const cachedPermissions = auth.getPermissionsCached
          ? auth.getPermissionsCached(30000)
          : auth.getUserPermissions?.();
        
        if (cachedPermissions && !cachedPermissions[requiredPermission]) {
          if (!alreadyNotified) {
            alreadyNotified = true;
            alert(`⛔ Nincs jogosultságod ehhez az oldalhoz!\n\nSzükséges jogosultság: ${requiredPermission}`);
          }
          window.location.href = getBaseUrl();
          return false;
        }
        
        // Jogosultság ellenőrzése - frissítés háttérben, ha kell
        const permissions = await auth.refreshPermissions({ force: false, maxAgeMs: 30000, timeoutMs: 4000 });
        
        if (!permissions || !permissions[requiredPermission]) {
          // Nincs jogosultság
          if (!alreadyNotified) {
            alreadyNotified = true;
            alert(`⛔ Nincs jogosultságod ehhez az oldalhoz!\n\nSzükséges jogosultság: ${requiredPermission}`);
          }
          window.location.href = getBaseUrl();
          return false;
        }
        
        // Jogosultság megvan
        console.log(`✅ Permission guard: ${requiredPermission} - ENGEDÉLYEZVE`);
        return true;
      }
      
      // Várunk
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Timeout
    if (!alreadyNotified) {
      alreadyNotified = true;
      alert('⛔ Időtúllépés! Az oldal nem töltődött be megfelelően.');
    }
    window.location.href = getBaseUrl();
    return false;
  }

  // Export
  window.checkPermission = checkPermission;

  // Folyamatos jogosultság ellenőrzés (ha elveszíti a jogot)
  window.addEventListener('loginStateChanged', (event) => {
    const { loggedIn, permissions } = event.detail;
    
    // Határozzuk meg a szükséges jogosultságot az URL alapján
    const path = window.location.pathname;
    let requiredPermission = null;
    
    if (path.includes('/secret/infosharer')) {
      requiredPermission = 'can_view_infosharer';
    } else if (path.includes('/secret/admin')) {
      requiredPermission = 'can_view_admin_panel';
    }
    
    if (requiredPermission) {
      if (!loggedIn || !permissions || !permissions[requiredPermission]) {
        if (!alreadyNotified) {
          alreadyNotified = true;
          alert('⛔ Jogosultságod megváltozott! Átirányítás...');
        }
        window.location.href = getBaseUrl();
      }
    }
  });

  // Rendszeres jogosultság ellenőrzés (5 másodpercenként)
  setInterval(async () => {
    const auth = window.getAuth ? window.getAuth() : null;
    if (!auth || !auth.isAuthenticated()) return;
    
    const path = window.location.pathname;
    let requiredPermission = null;
    
    if (path.includes('/secret/infosharer')) {
      requiredPermission = 'can_view_infosharer';
    } else if (path.includes('/secret/admin')) {
      requiredPermission = 'can_view_admin_panel';
    }
    
    if (requiredPermission) {
      // FRISSÍTÉS az adatbázisból (cache-elt, ha friss)
      const permissions = await auth.refreshPermissions({ force: false, maxAgeMs: 30000, timeoutMs: 4000 });
      if (!permissions || !permissions[requiredPermission]) {
        if (!alreadyNotified) {
          alreadyNotified = true;
          alert('⛔ Jogosultságod megváltozott! Átirányítás...');
        }
        window.location.href = getBaseUrl();
      }
    }
  }, 5000);

})();
