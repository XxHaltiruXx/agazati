/* nav.js - azonnali inicializáció, hogy ne várjon a pyodide.js-re */
(function () {
  'use strict';

(function injectNavCss() {
  if (document.getElementById('agazati-nav-injected-css')) return;
  const css = `
:root{
  --accent:#7f5af0;
  --accent-light:#a693ff;
  --bg-dark:#0a0a14;
  --bg-mid:#111122;
  --text:#e4e4ff;
  --muted:#888ab8;
  --error:#ff4b5c;
  --success:#45f0a0;
}

/* Strukturális: a footer lefelé ragad, a menük teljes szélességben jelennek meg */
#mySidenav > div.nav-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  gap: 6px;
}
#mySidenav .nav-scrollable {
  flex: 1 1 auto;
  overflow-x: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
#mySidenav .nav-footer {
  flex: 0 0 auto;
  border-top: 1px solid rgba(255,255,255,0.03);
  padding: 10px 8px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* === NAV ITEM (megtartva a "jó" gomb kinézetet) === */
#mySidenav .nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.6rem;
  background: transparent;
  border-radius: 8px;
  color: var(--text);
  border: none;
  cursor: pointer;
  text-align: left;
}
#mySidenav .nav-item .nav-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  object-fit: contain;
}
#mySidenav .nav-item:hover {
  background: rgba(127,90,240,0.04);
}

/* Subnav links: blokk és teljes szélesség, visszaállítva padding / színek */
#mySidenav .subnav-content a {
  display: block;
  padding: 0.45rem 0.6rem;
  width: 100%;
  box-sizing: border-box;
  color: #6a6a8a;
  text-decoration: none;
  border-radius: 6px;
  border-left: 3px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
#mySidenav .subnav-content a:hover {
  color: var(--text);
  background: rgba(127,90,240,0.08);
  border-left-color: #a693ff;
}
#mySidenav .subnav-content a[aria-current="page"] {
  color: var(--text);
  background: rgba(127,90,240,0.15);
  border-left-color: var(--accent);
  font-weight: 600;
}

/* auth gomb (lila) - DEPRECATED, már nem használjuk a sidenavban */

/* Navbar auth gomb jobb oldalon */
.navbar-auth-container {
  position: fixed;
  right: 0;
  top: 0;
  height: var(--nav-height, 90px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 85px; /* Fix szélesség hogy ne ugorjon */
  padding: 0 20px;
  background: linear-gradient(90deg, rgba(76,11,206,0) 0%, rgba(76,11,206,1) 20%, rgba(76,11,206,1) 100%);
  z-index: 4;
  pointer-events: none; /* Ne takarja el a navbar scrolling-ot */
}

.navbar-auth-container > * {
  pointer-events: auto; /* De a gyerek elemek kattinthatók */
}

.navbar-auth-btn {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.45rem 0.65rem;
  border-radius: 50%;
  cursor: pointer;
  font-weight: 600;
  font-size: 18px;
  transition: opacity 0.2s ease;
  box-shadow: 0 4px 12px rgba(127,90,240,0.3);
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Kezdetben rejtve amíg a JS nem inicializálja */
  opacity: 0;
  visibility: hidden;
  position: absolute; /* Abszolút pozíció a container-ben */
}
.navbar-auth-btn.loaded {
  opacity: 1;
  visibility: visible;
}
.navbar-auth-btn:hover { 
  background: var(--accent-light);
  box-shadow: 0 6px 16px rgba(127,90,240,0.4);
}

.navbar-user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: opacity 0.2s ease;
  overflow: hidden;
  /* Teljesen rejtve amíg a JS nem tölti be */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  position: absolute; /* Abszolút pozíció - ugyanott mint a gomb */
}
.navbar-user-avatar.loaded {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
.navbar-user-avatar:hover {
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
}
.navbar-user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.navbar-user-avatar span {
  position: relative;
  z-index: 1;
}

/* User dropdown menu */
.navbar-user-dropdown {
  position: fixed; /* Fixed pozíció hogy mindig jó helyen legyen */
  top: calc(var(--nav-height, 90px) + 5px); /* Navbar alatt */
  right: 20px; /* Jobbra igazítva */
  background: #1a1a2e;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  padding: 8px;
  min-width: 180px;
  display: none;
  z-index: 1000;
  border: 1px solid rgba(127,90,240,0.3);
}
.navbar-user-dropdown.show {
  display: block;
}
.navbar-user-dropdown-item {
  padding: 10px 14px;
  color: #e4e4ff;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.navbar-user-dropdown-item:hover {
  background: rgba(127,90,240,0.15);
}
.navbar-user-dropdown-divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 6px 0;
}
.navbar-user-dropdown-email {
  padding: 10px 14px;
  color: #888ab8;
  font-size: 12px;
  word-break: break-all;
}

/* mobil finomítás */
@media (max-width:700px) {
  #mySidenav .nav-item { padding: 0.6rem; }
  .navbar-auth-container {
    padding: 0 10px;
    gap: 8px;
  }
  .navbar-auth-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  .navbar-user-avatar {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
  .navbar-user-dropdown {
    min-width: 160px;
    right: -10px;
  }
}
`;
  const style = document.createElement('style');
  style.id = 'agazati-nav-injected-css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();





  /* ======= Korai stub / queue mechanizmus a ReferenceError elkerülésére ======= */
  window._agazati_nav_call_queue = window._agazati_nav_call_queue || [];

  function _agazati_flush_queue(name, fn) {
    if (!window._agazati_nav_call_queue || !window._agazati_nav_call_queue.length) return;
    const remaining = [];
    window._agazati_nav_call_queue.forEach(item => {
      if (item && item.name === name) {
        try {
          fn.apply(window, item.args || []);
        } catch (e) {
          console.error('[agazati] queued call failed for', name, e);
        }
      } else {
        remaining.push(item);
      }
    });
    window._agazati_nav_call_queue = remaining;
  }

  // Korai stub: ha a HTML inline meghívja, ne dobjon ReferenceError-t — csak sorba állítjuk a hívást.
  if (typeof window.toggleNav !== 'function') {
    window.toggleNav = function () {
      const args = Array.prototype.slice.call(arguments);
      window._agazati_nav_call_queue.push({ name: 'toggleNav', args });
      // console.warn('[agazati] toggleNav called early; queued until initialization completes.');
    };
  }

  if (typeof window.openLoginModal !== 'function') {
    window.openLoginModal = function () {
      const args = Array.prototype.slice.call(arguments);
      window._agazati_nav_call_queue.push({ name: 'openLoginModal', args });
      // console.warn('[agazati] openLoginModal called early; queued until login modal is ready.');
    };
  }

  /* ======= Top Navbar létrehozása ======= */
  function createTopNavbar() {
    let header = document.querySelector('header');
    if (!header) {
      header = document.createElement('header');
      document.body.insertBefore(header, document.body.firstChild);
    }

    // Ha már van navbar, ne hozzuk létre újra
    if (header.querySelector('nav.navbar')) return;

    header.innerHTML = `
      <nav class="navbar navbar-expand">
        <div class="container-fluid">
          <div class="navbar-collapse">
            <div class="navbar-nav">
              <span onclick="toggleNav()" class="sidebargomb">
                <img src="assets/images/hamburger.webp" alt="Menu">
              </span>
              <a class="nav-link" href="">főoldal</a>
              <a class="nav-link" href="html/alapok">html</a>
              <a class="nav-link" href="css/alapok">css</a>
              <a class="nav-link" href="python/alapok">python</a>
              <a class="nav-link" href="network/alapok">hálózat</a>
              <a class="nav-link" href="math/alapok">matek</a>
            </div>
          </div>
        </div>
        <div class="navbar-auth-container" id="navbarAuthContainer">
          <div class="navbar-user-avatar" id="navbarUserAvatar">
            <span id="navbarUserInitials"></span>
            <div class="navbar-user-dropdown" id="navbarUserDropdown">
              <div class="navbar-user-dropdown-email" id="navbarUserEmail"></div>
              <div class="navbar-user-dropdown-divider"></div>
              <div class="navbar-user-dropdown-item" id="navbarLogoutBtn">
                <span>🚪</span> Kijelentkezés
              </div>
            </div>
          </div>
          <button class="navbar-auth-btn" id="navbarAuthBtn" title="Bejelentkezés">👤</button>
        </div>
      </nav>
    `;
    
    // Dinamikusan beállítjuk az aria-current="page"-et az aktuális oldalon
    try {
      let currentPath = location.pathname.toLowerCase();
      
      // GitHub Pages esetén eltávolítjuk a repository prefix-et (pl. /agazati/)
      // hogy ugyanúgy működjön mint lokálisan
      currentPath = currentPath.replace(/^\/agazati\/?/i, '/');
      
      // Lezáró / eltávolítása, de csak ha nem a főoldal
      currentPath = currentPath.replace(/\/+$/, '') || '/';
      
      const navLinks = header.querySelectorAll('.nav-link');
      
      // Kinyerjük az aktuális oldal kategóriáját (első szegmens az URL-ből)
      // pl. "/html/structure/" -> "html", "/python/run/" -> "python"
      const pathSegments = currentPath.split('/').filter(s => s);
      const currentCategory = pathSegments.length > 0 ? pathSegments[0] : '';
      
      navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === null) return;
        
        const linkPath = linkHref.toLowerCase().trim();
        
        // Főoldal ellenőrzése - ha a link üres vagy csak "/", és az oldal a főoldal
        const isHomepageLink = linkPath === '' || linkPath === '/';
        const isHomepage = currentPath === '/' || currentPath === '/index.html' || currentPath === '/index';
        
        if (isHomepageLink && isHomepage) {
          link.setAttribute('aria-current', 'page');
        }
        // Kategória oldalak ellenőrzése - kivesszük a link első szegmensét
        // pl. "html/alapok" -> "html", "python/alapok" -> "python"
        else if (linkPath && !isHomepageLink) {
          const linkSegments = linkPath.replace(/^\/+|\/+$/g, '').split('/').filter(s => s);
          const linkCategory = linkSegments.length > 0 ? linkSegments[0] : '';
          
          // Ha az aktuális kategória megegyezik a link kategóriájával
          if (linkCategory && currentCategory === linkCategory) {
            link.setAttribute('aria-current', 'page');
          }
        }
      });
    } catch (e) {
      console.error('Error setting aria-current:', e);
    }
  }

  /* ======= Konstansok, állapot ======= */
  const NAV_STATE_KEY = '__agazati_nav_state';
  const SUBMENU_STATE_KEY = '__agazati_submenu_state';
  const CLICK_CATEGORY_KEY = '__agazati_nav_category_v3';
  
  let isNavOpen = false;
  let sidenav = null;
  let __navSearchSnapshot = null;
  let globalAuth = null; // Supabase Auth instance
  let globalAuthModal = null; // Globális auth modal instance

  /* ======= Nav struktúra ======= */
  const getNavStructure = (isLoggedIn = false, isAdmin = false) => {
    const baseStructure = {
      "HTML": {
        icon: "assets/images/sidehtml.webp",
        items: [
          { title: "HTML alapok", link: "html/alapok/" },
          { title: "HTML struktúra", link: "html/structure/" },
          { title: "HTML űrlapok", link: "html/forms/" },
          { title: "HTML táblázatok", link: "html/tables/" },
          { title: "HTML multimédia", link: "html/media/" },
          { title: "HTML Bővítmények", link: "html/extension/" },
          { title: "HTML Futtató", link: "html/run/" }
        ]
      },
      "CSS": {
        icon: "assets/images/sidecss.webp",
        items: [
          { title: "CSS alapok", link: "css/alapok/" },
          { title: "Box modell", link: "css/box/" },
          { title: "Pozicionálás", link: "css/position/" },
          { title: "Flexbox", link: "css/flex/" },
          { title: "CSS Grid", link: "css/grid/" },
          { title: "Reszponzív dizájn", link: "css/responsive/" },
          { title: "CSS animációk", link: "css/animation/" }
        ]
      },
      "Python": {
        icon: "assets/images/sidepy.webp",
        items: [
          { title: "Python alapok", link: "python/alapok/" },
          { title: "Változók és típusok", link: "python/types/" },
          { title: "Vezérlési szerkezetek", link: "python/control/" },
          { title: "Függvények", link: "python/functions/" },
          { title: "Osztályok", link: "python/classes/" },
          { title: "Fájlkezelés", link: "python/files/" },
          { title: "Kivételkezelés", link: "python/exceptions/" },
          { title: "Python Futtató", link: "python/run/" }
        ]
      },
      "Hálózat": {
        icon: "assets/images/sidenetwork.webp",
        items: [
          { title: "Hálózat alapok", link: "network/alapok/" },
          { title: "Számrendszerek", link: "network/szamrendszer/" },
          { title: "IP címzés", link: "network/ip/" },
          { title: "Alhálózatok", link: "network/subnet/" },
          { title: "Cisco parancsok", link: "network/cisco/" },
          { title: "VLAN-ok", link: "network/vlan/" },
          { title: "Routing", link: "network/routing/" },
          { title: "IP / SUBNET számoló", link: "network/calculator/" }
        ]
      },
      "Matematika": {
        icon: "assets/images/sidemath.webp",
        items: [
          { title: "Matematika alapok", link: "math/alapok" },
          { title: "Algebra", link: "math/algebra/" },
          { title: "Függvények", link: "math/functions/" },
          { title: "Geometria", link: "math/geometry/" },
          { title: "Valószínűségszámítás", link: "math/probability/" },
          { title: "Számológép", link: "math/calculator/" }
        ]
      }
    };

    // Ha be van jelentkezve ÉS admin, adjuk hozzá a titkos menüt
    if (isLoggedIn && isAdmin) {
      baseStructure["Titkos"] = {
        icon: "assets/images/sidesecret.svg",
        items: [
          { title: "Infosharer", link: "secret/infosharer/" },
          { title: "Release Manager", link: "secret/releases/" },
          { title: "Admin Panel", link: "secret/admin/" }
        ]
      };
    }

    return baseStructure;
  };

  /* ======= Segédfüggvények ======= */
  function normalizeAbsHref(href) {
    try { return new URL(href, location.href).href.replace(/\/+$/, ''); }
    catch (e) { return (href || '').replace(/\/+$/, ''); }
  }

  function saveNavState() {
    try {
      sessionStorage.setItem(NAV_STATE_KEY, String(isNavOpen));
      const submenuState = {};
      document.querySelectorAll('.subnav').forEach(navGroup => {
        const category = navGroup.getAttribute('data-category');
        const button = navGroup.querySelector('.nav-item');
        submenuState[category] = !!(button && button.classList.contains('active'));
      });
      sessionStorage.setItem(SUBMENU_STATE_KEY, JSON.stringify(submenuState));
    } catch (e) { console.error('Error saving nav state:', e); }
  }

  function loadSavedSubmenuState() {
    try { return JSON.parse(sessionStorage.getItem(SUBMENU_STATE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function loadNavState() {
    try {
      const savedState = sessionStorage.getItem(NAV_STATE_KEY);
      if (savedState === 'true') {
        isNavOpen = true;
        if (sidenav) {
          sidenav.style.width = '250px';
        }
      }
      
      const submenuState = loadSavedSubmenuState();
      document.querySelectorAll('.subnav').forEach(navGroup => {
        const category = navGroup.getAttribute('data-category');
        const button = navGroup.querySelector('.nav-item');
        const content = navGroup.querySelector('.subnav-content');
        
        if (button && content && submenuState[category]) {
          button.classList.add('active');
          content.style.display = 'block';
          content.style.maxHeight = 'none';
          const arrow = button.querySelector('.arrow');
          if (arrow) arrow.textContent = '▲';
        }
      });
    } catch (e) {
      console.error('Error loading nav state:', e);
    }
  }

  /* ======= Bejelentkezési állapot kezelése ======= */
  function updateLoginStatus() {
    const btn = document.getElementById('navbarAuthBtn');
    const avatar = document.getElementById('navbarUserAvatar');
    const initials = document.getElementById('navbarUserInitials');
    const dropdown = document.getElementById('navbarUserDropdown');
    const logoutBtn = document.getElementById('navbarLogoutBtn');
    const emailEl = document.getElementById('navbarUserEmail');
    
    if (!btn) return;
    
    // Ellenőrizzük hogy a Supabase auth betöltött-e
    if (!globalAuth && window.getAuth && typeof window.getAuth === 'function') {
      globalAuth = window.getAuth();
    }
    
    const isLoggedIn = globalAuth && globalAuth.isAuthenticated();
    
    // Távolítsuk el a régi event listener-t
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    if (isLoggedIn) {
      // Gomb elrejtése bejelentkezés után
      newBtn.classList.remove('loaded');
      
      // Profilkép megjelenítése
      if (avatar && initials) {
        const user = globalAuth.getCurrentUser();
        if (user && user.email) {
          // Email első betűje az avatárba
          const firstLetter = user.email.charAt(0).toUpperCase();
          initials.textContent = firstLetter;
          avatar.title = user.email;
          
          // Email megjelenítése a dropdown-ban
          if (emailEl) {
            emailEl.textContent = user.email;
          }
          
          // Most jelenítjük meg az avatart (loaded class)
          avatar.classList.add('loaded');
          // Most jelenítjük meg az avatart (loaded class)
          avatar.classList.add('loaded');
          
          // Avatar kattintás - dropdown toggle (NEM klónozzuk, csak eltávolítjuk az event listener-t)
          // Először távolítsuk el az összes korábbi listener-t
          avatar.replaceWith(avatar.cloneNode(true));
          const freshAvatar = document.getElementById('navbarUserAvatar');
          
          if (freshAvatar) {
            // Megtartjuk a loaded class-t
            freshAvatar.classList.add('loaded');
            
            freshAvatar.addEventListener('click', function(e) {
              e.stopPropagation();
              const dd = document.getElementById('navbarUserDropdown');
              if (dd) {
                dd.classList.toggle('show');
              }
            });
          }
          
          // Kijelentkezés gomb a dropdown-ban
          const freshLogoutBtn = document.getElementById('navbarLogoutBtn');
          if (freshLogoutBtn) {
            freshLogoutBtn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              logoutFromNav();
            });
          }
        }
      }
    } else {
      // Bejelentkezési gomb megjelenítése
      newBtn.classList.add('loaded');
      newBtn.setAttribute('aria-pressed', 'false');
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openLoginModal();
      });
      
      // Profilkép elrejtése
      if (avatar) {
        avatar.classList.remove('loaded');
        // Dropdown bezárása
        if (dropdown) {
          dropdown.classList.remove('show');
        }
      }
    }
    
    // Kattintás bárhova bezárja a dropdown-ot (csak egyszer adjuk hozzá)
    if (!document.__dropdownClickHandlerAdded) {
      document.addEventListener('click', function(e) {
        const dd = document.getElementById('navbarUserDropdown');
        const av = document.getElementById('navbarUserAvatar');
        // Ha nem az avatarra kattintottunk, zárjuk be a dropdown-ot
        if (dd && av && !av.contains(e.target)) {
          dd.classList.remove('show');
        }
      });
      document.__dropdownClickHandlerAdded = true;
    }
  }

  function checkLoginState() {
    if (globalAuth) {
      return {
        isLoggedIn: globalAuth.isAuthenticated(),
        isAdmin: globalAuth.isAdminUser()
      };
    }
    return { isLoggedIn: false, isAdmin: false };
  }

  function setLoginState() {
    // Már nem szükséges, mert a Supabase auth automatikusan kezeli
    rebuildNavigation();
    window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }));
  }

  async function logoutFromNav() {
    try {
      if (globalAuth) {
        await globalAuth.signOut();
      } else {
        // Ha nincs auth, legalább tisztítsuk a local storage-t
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Tisztítsuk meg a globális auth modal-t is
      globalAuthModal = null;
      globalAuth = null;
      
      rebuildNavigation();
      updateLoginStatus();
      
      window.dispatchEvent(new CustomEvent('loginStateChanged', { 
        detail: { loggedIn: false } 
      }));
      
      // Ha secret oldalon vagyunk, menjünk a főoldalra
      const currentPathname = window.location.pathname;
      if (currentPathname.includes('secret/')) {
        window.location.href = '/agazati/';
      } else {
        window.location.reload();
      }
    } catch (e) {
      // Ne dobjunk hibát, csak tisztítsuk meg mindent
      
      // Tisztítsuk meg mindent manuálisan
      globalAuthModal = null;
      globalAuth = null;
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Mindenképp irányítsuk át
      const currentPathname = window.location.pathname;
      if (currentPathname.includes('secret/')) {
        window.location.href = '/agazati/';
      } else {
        window.location.reload();
      }
    }
  }

  /* ======= Modal kezelés (Supabase Auth Modal) ======= */
  
  // Modal megnyitása a Supabase Auth modal használatával
  window.openLoginModal = async function() {
    // Várjuk meg, hogy a globalAuth elérhető legyen
    if (!globalAuth) {
      await loadAndInitAuth();
    }

    if (!globalAuth) {
      console.error('Supabase Auth nem inicializálva');
      alert('Az authentikáció még nem töltődött be. Próbáld újra néhány másodperc múlva.');
      return;
    }

    // Ha még nincs auth modal HTML betöltve, hozzunk létre egy containert és töltsük be
    let authModalContainer = document.getElementById('authModalContainer');
    if (!authModalContainer) {
      authModalContainer = document.createElement('div');
      authModalContainer.id = 'authModalContainer';
      document.body.appendChild(authModalContainer);
    }

    if (!authModalContainer.innerHTML.trim()) {
      try {
        const response = await fetch('assets/components/auth-modal.html');
        const html = await response.text();
        authModalContainer.innerHTML = html;
      } catch (err) {
        console.error('Auth modal betöltési hiba:', err);
        alert('Hiba történt a bejelentkezési ablak betöltésekor.');
        return;
      }
    }

    // Inicializáljuk az auth modal-t, ha még nem történt meg
    if (!globalAuthModal) {
      globalAuthModal = new window.SupabaseAuthModal(globalAuth);
      globalAuthModal.init({
        onSuccess: async () => {
          // Frissítsük a navigációt
          await rebuildNavigation();
          updateLoginStatus();
          
          // Küldjünk eseményt a státusz változásról
          window.dispatchEvent(new CustomEvent('loginStateChanged', { 
            detail: { loggedIn: true } 
          }));
        },
        onCancel: () => {
          // Modal bezárva
        }
      });
    }

    // Nyissuk meg a modal-t
    globalAuthModal.open();
  };

  // Ha korábban sorba álltak openLoginModal hívások, futtassuk őket
  try { _agazati_flush_queue('openLoginModal', window.openLoginModal); } catch(e){}

  // Globális függvények a HTML-ből való hozzáféréshez
  window.setLoginState = setLoginState;
  window.logoutFromNav = logoutFromNav;
  window.checkLoginState = checkLoginState;

 /* ======= Globális toggleNav ======= */
window.toggleNav = function () {
  if (!sidenav) {
    sidenav = document.getElementById('mySidenav');
    if (!sidenav) {
      console.error('Sidenav element not found!');
      return;
    }
  }
  
  sidenav.style.transition = 'width 0.3s';
  if (isNavOpen) {
    sidenav.style.width = '0';
    isNavOpen = false;
  } else {
    sidenav.style.width = '250px';
    isNavOpen = true;
  }
  saveNavState();

  try { _agazati_flush_queue('toggleNav', window.toggleNav); } catch(e){}
};

  /* ======= Navigáció újraépítése ======= */
  function rebuildNavigation() {
    // console.log('🔄 Nav újraépítése...');
    
    // Frissítsük a globalAuth-ot
    if (window.getAuth && typeof window.getAuth === 'function') {
      globalAuth = window.getAuth();
    }
    
    // Ellenőrizzük az auth state-et
    const loginState = checkLoginState();
    // console.log('Login state:', loginState);
    
    const navContainer = document.querySelector('#mySidenav > div');
    if (navContainer) {
      navContainer.removeAttribute('data-nav-built');
      createNavigation();
      // console.log('✅ Nav újraépítve');
    } else {
      console.error('Nav container nem található!');
    }
  }

  /* ======= Keresés ======= (nincs változás) ======= */
  function filterNavItems(searchText) {
    const subnavs = document.querySelectorAll('.subnav');
    searchText = (searchText || '').trim().toLowerCase();

    if (searchText && !__navSearchSnapshot) {
      try {
        __navSearchSnapshot = {
          isNavOpen: Boolean(isNavOpen),
          submenuState: {}
        };
        subnavs.forEach(navGroup => {
          const category = navGroup.getAttribute('data-category');
          const button = navGroup.querySelector('.nav-item');
          __navSearchSnapshot.submenuState[category] = !!(button && button.classList.contains('active'));
        });
      } catch (e) {
        __navSearchSnapshot = null;
      }
    }

    if (!searchText) {
      if (__navSearchSnapshot) {
        isNavOpen = !!__navSearchSnapshot.isNavOpen;
        if (sidenav) {
          sidenav.style.transition = 'none';
          sidenav.style.width = isNavOpen ? "250px" : "0";
          setTimeout(() => { if (sidenav) sidenav.style.transition = ''; }, 100);
        }

        subnavs.forEach(navGroup => {
          const category = navGroup.getAttribute('data-category');
          const button = navGroup.querySelector('.nav-item');
          const content = navGroup.querySelector('.subnav-content');
          const wasActive = !!(__navSearchSnapshot.submenuState && __navSearchSnapshot.submenuState[category]);

          if (button) {
            button.style.display = 'flex';
            if (wasActive) {
              button.classList.add('active');
            } else {
              button.classList.remove('active');
            }
            button.classList.remove('search-temp-open');
          }
          if (content) {
            Array.from(content.querySelectorAll('a')).forEach(a => a.style.display = 'block');

            if (wasActive) {
              content.style.display = 'block';
              content.style.maxHeight = 'none';
              content.style.overflow = '';
              const arrow = button && button.querySelector('.arrow');
              if (arrow) arrow.textContent = '▲';
            } else {
              content.style.display = 'none';
              content.style.maxHeight = '0';
              content.style.overflow = 'hidden';
              const arrow = button && button.querySelector('.arrow');
              if (arrow) arrow.textContent = '▼';
            }
          }
        });

        __navSearchSnapshot = null;
        return;
      } else {
        subnavs.forEach(navGroup => {
          const button = navGroup.querySelector('.nav-item');
          const content = navGroup.querySelector('.subnav-content');
          if (button) button.style.display = 'flex';
          if (content) {
            Array.from(content.querySelectorAll('a')).forEach(a => a.style.display = 'block');
            if (button && button.classList.contains('active')) {
              content.style.display = 'block';
              content.style.maxHeight = 'none';
            } else {
              content.style.display = 'none';
              content.style.maxHeight = '0';
            }
          }
        });
        return;
      }
    }

    subnavs.forEach(navGroup => {
      const button = navGroup.querySelector('.nav-item');
      const content = navGroup.querySelector('.subnav-content');
      if (!button || !content) return;

      const links = Array.from(content.querySelectorAll('a'));
      const matches = links.filter(a => (a.textContent || '').toLowerCase().includes(searchText));

      if (matches.length > 0) {
        button.style.display = 'flex';
        button.classList.add('search-temp-open');

        links.forEach(a => {
          a.style.display = matches.includes(a) ? 'block' : 'none';
        });

        content.style.display = 'block';
        content.style.transition = 'none';
        content.style.maxHeight = 'none';
        content.style.overflow = '';

        const arrow = button.querySelector('.arrow');
        if (arrow) arrow.textContent = '▲';
      } else {
        const parentMatches = (button.textContent || '').toLowerCase().includes(searchText);
        if (parentMatches) {
          button.style.display = 'flex';
          button.classList.remove('search-temp-open');
          links.forEach(a => a.style.display = 'none');
          content.style.display = 'none';
          content.style.maxHeight = '0';
          const arrow = button.querySelector('.arrow');
          if (arrow) arrow.textContent = '▼';
        } else {
          button.style.display = 'none';
          links.forEach(a => a.style.display = 'none');
          content.style.display = 'none';
          content.style.maxHeight = '0';
        }
      }
    });
  }

  function createNavigation() {
    sidenav = document.getElementById('mySidenav');
    if (!sidenav) {
      console.error('Sidenav element not found');
      return;
    }

    // navContainer: ha nincs, hozzuk létre; adjunk neki nav-container osztályt
    let navContainer = sidenav.querySelector('div');
    if (!navContainer) {
      navContainer = document.createElement('div');
      sidenav.appendChild(navContainer);
    }

    if (navContainer.getAttribute('data-nav-built') === '1') return;
    navContainer.setAttribute('data-nav-built', '1');

    // Üresítsük, majd építsünk fel két részt: scrollable + footer
    navContainer.innerHTML = '';
    navContainer.classList.add('nav-container');

    const scrollable = document.createElement('div');
    scrollable.className = 'nav-scrollable';

    const footer = document.createElement('div');
    footer.className = 'nav-footer';

    navContainer.appendChild(scrollable);
    navContainer.appendChild(footer);

    // kereső (a scrollable részbe)
    const searchBox = document.createElement('div');
    searchBox.className = 'search-container';
    searchBox.innerHTML = `<input type="text" id="searchNav" placeholder="🔍 Keresés..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />`;
    scrollable.appendChild(searchBox);

    // Menük létrehozása
    const loginState = checkLoginState();
    const navStructure = getNavStructure(loginState.isLoggedIn, loginState.isAdmin);
    
    Object.entries(navStructure).forEach(([category, data]) => {
      const navGroup = document.createElement('div');
      navGroup.className = 'subnav';
      navGroup.setAttribute('data-category', category);

      const button = document.createElement('button');
      button.className = 'nav-item';
      button.innerHTML = `<img src="${data.icon}" alt="" class="nav-icon" /> ${category} <span class="arrow">▼</span>`;

      const content = document.createElement('div');
      content.className = 'subnav-content';
      content.style.display = 'none';
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';
      content.style.transition = 'max-height 0.3s ease-out';

      data.items.forEach(item => {
        const link = document.createElement('a');
        link.href = item.link;
        link.textContent = item.title;

        // Aktuális oldal jelölése
        try {
          let currentPath = location.pathname.replace(/\/+$/, '').toLowerCase();
          
          // GitHub Pages esetén eltávolítjuk a repository prefix-et (pl. /agazati/)
          currentPath = currentPath.replace(/^\/agazati\/?/i, '/');
          
          const itemLink = item.link.replace(/\/+$/, '').toLowerCase();
          
          // Ellenőrizzük, hogy az aktuális útvonal tartalmazza-e a link útvonalát
          // vagy pontosan egyezik-e (a főoldalaknál, pl. math/)
          const isMatch = currentPath.includes(itemLink) || 
                          currentPath.endsWith('/' + itemLink) ||
                          currentPath === '/' + itemLink ||
                          (itemLink && currentPath.endsWith(itemLink));
          
          if (isMatch && itemLink) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            button.classList.add('active');
            content.style.display = 'block';
            content.style.overflow = 'hidden';
            content.style.maxHeight = '0';
            requestAnimationFrame(() => { content.style.maxHeight = content.scrollHeight + 'px'; });
            setTimeout(() => { if (content.style.maxHeight && content.style.maxHeight !== '0px') content.style.maxHeight = 'none'; }, 350);
            const arrow = button.querySelector('.arrow'); 
            if (arrow) arrow.textContent = '▲';
          }
        } catch (e) {}

        link.addEventListener('click', (ev) => {
          try {
            const cat = navGroup.getAttribute('data-category');
            if (cat) sessionStorage.setItem(CLICK_CATEGORY_KEY, String(cat));
          } catch (e) {}
        });

        content.appendChild(link);
      });

      navGroup.appendChild(button);
      navGroup.appendChild(content);
      scrollable.appendChild(navGroup);

      // Lenyíló menü kezelése
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (__navSearchSnapshot) {
          const isTemp = button.classList.toggle('search-temp-open');
          const arrow = button.querySelector('.arrow'); 
          if (arrow) arrow.textContent = isTemp ? '▲' : '▼';
          return;
        }

        button.classList.toggle('active');

        const isExpanded = content.style.display !== 'none' && 
                          (content.style.maxHeight !== '0px' && 
                           content.style.maxHeight !== '' && 
                           content.style.maxHeight !== '0');

        if (!isExpanded) {
          content.style.display = 'block';
          content.style.overflow = 'hidden';
          content.style.maxHeight = '0';
          requestAnimationFrame(() => {
            content.style.transition = 'max-height 0.3s ease-out';
            content.style.maxHeight = content.scrollHeight + 'px';
          });
          const arrow = button.querySelector('.arrow'); 
          if (arrow) arrow.textContent = '▲';
          setTimeout(() => { 
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
              content.style.maxHeight = 'none'; 
            }
          }, 350);
        } else {
          const currentHeight = content.scrollHeight;
          content.style.overflow = 'hidden';
          content.style.maxHeight = currentHeight + 'px';
          content.getBoundingClientRect();
          requestAnimationFrame(() => {
            content.style.transition = 'max-height 0.3s ease-out';
            content.style.maxHeight = '0';
          });
          const arrow = button.querySelector('.arrow'); 
          if (arrow) arrow.textContent = '▼';
          setTimeout(() => {
            if (content.style.maxHeight === '0px' || content.style.maxHeight === '0') {
              content.style.display = 'none';
            }
          }, 320);
        }

        saveNavState();
      });
    });

    // Bejelentkezési gomb megjelenítése a footer-ben — CSS kezeli a megjelenést
    // --- SKIP SIDEBAR AUTH ON INFOSHARER AND OTHER SECRET PAGES ---
    // Ha az oldal maga tartalmaz már auth gombot (pl. infosharer, releases), akkor ne jelenjen meg a sidebar-ban.
    const hasPageAuth = (function() {
      try {
        if (window.location && typeof window.location.pathname === 'string') {
          const currentPathname = window.location.pathname.replace(/^\/agazati\/?/i, '/');
          if (currentPathname.includes('infosharer')) return true;
          if (currentPathname.includes('releases')) return true;
          if (currentPathname.includes('/secret/')) return true;
        }
        // alternatív: az oldal jelölheti, hogy saját auth buttonja van, pl. <button id="infosharer-auth"> vagy data attribútum
        if (document.getElementById('infosharer-auth')) return true;
        if (document.querySelector('[data-infosharer-auth]')) return true;
        if (document.querySelector('[data-page-auth]')) return true;
      } catch (e) {}
      return false;
    })();

    // Auth gomb mostantól a navbar jobb oldalán van, nem a sidenav footer-ben
    // Üresen hagyjuk a footert vagy más elemeket tehetünk ide később

    // Frissítsd a bejelentkezési állapotot
    updateLoginStatus();

    // Keresés input esemény
    const searchInput = document.getElementById('searchNav');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterNavItems(e.target.value);
      });
    }

    // Állapot betöltése
    loadNavState();
  }

  /* ======= Betöltéskor alkalmazzuk a mentett kategóriát ======= */
  function applyClickedCategoryIfAnyOnce() {
    try {
      const searchInput = document.getElementById('searchNav');
      if (searchInput) {
        if (searchInput.value && searchInput.value.trim() !== '') {
          searchInput.value = '';
          filterNavItems('');
        }
      }

      const storedCat = sessionStorage.getItem(CLICK_CATEGORY_KEY);
      if (!storedCat) return;

      const subnavs = Array.from(document.querySelectorAll('.subnav'));
      if (!subnavs.length) return;

      let matched = false;
      subnavs.forEach(s => {
        const btn = s.querySelector('.nav-item');
        const content = s.querySelector('.subnav-content');
        const cat = s.getAttribute('data-category');
        if (!btn || !content) return;
        if (cat === storedCat) {
          btn.classList.add('active');
          content.style.display = 'block';
          content.style.maxHeight = 'none';
          content.style.overflow = '';
          const arrow = btn.querySelector('.arrow'); 
          if (arrow) arrow.textContent = '▲';
          matched = true;
        } else {
          btn.classList.remove('active');
          btn.classList.remove('search-temp-open');
          content.style.maxHeight = '0';
          content.style.overflow = 'hidden';
          setTimeout(() => { content.style.display = 'none'; }, 320);
          const arrow = btn.querySelector('.arrow'); 
          if (arrow) arrow.textContent = '▼';
        }
      });

      if (matched) {
        saveNavState();
        try { sessionStorage.removeItem(CLICK_CATEGORY_KEY); } catch (e) {}
      }
    } catch (e) { console.error('applyClickedCategoryIfAnyOnce error:', e); }
  }

  /* ======= Supabase Auth betöltés és inicializálás ======= */
  async function loadAndInitAuth() {
    // Ha már betöltött az auth, ne töltsd be újra
    if (window.getAuth && window.getAuth()) {
      globalAuth = window.getAuth();
      // console.log('✅ Auth már inicializálva');
      return globalAuth;
    }

    // console.log('🚀 Auth betöltési folyamat indítása...');

    // Ellenőrizzük, hogy be van-e töltve a Supabase library
    if (typeof supabase === 'undefined') {
      // console.log('📦 Supabase library betöltése...');
      
      // Betöltjük a Supabase library-t
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          // console.log('✅ Supabase library betöltve');
          resolve();
        };
        script.onerror = (err) => {
          console.error('❌ Supabase library betöltési hiba');
          reject(err);
        };
        document.head.appendChild(script);
      });
    }

    // Auth modal CSS betöltése
    if (!document.getElementById('auth-modal-css-injected')) {
      const link = document.createElement('link');
      link.id = 'auth-modal-css-injected';
      link.rel = 'stylesheet';
      link.href = 'assets/css/auth-modal.css';
      document.head.appendChild(link);
    }

    // Betöltjük a Supabase Auth JS-t
    if (!window.initSupabaseAuth) {
      // console.log('📦 Supabase Auth JS betöltése...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/js/supabase-auth.js';
        script.onload = () => {
          // console.log('✅ Supabase Auth JS betöltve');
          resolve();
        };
        script.onerror = (err) => {
          console.error('❌ Supabase Auth JS betöltési hiba');
          reject(err);
        };
        document.head.appendChild(script);
      });
      
      // Várunk egy kicsit, hogy a script inicializálódjon
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Auth inicializálása
    if (window.initSupabaseAuth) {
      // console.log('🔐 Auth inicializálása...');
      try {
        globalAuth = await window.initSupabaseAuth();
        // console.log('✅ Auth sikeresen inicializálva');
        
        // Exportáljuk globálisan hogy más scriptek is elérhessék
        window._agazati_auth_ready = true;
        
        return globalAuth;
      } catch (error) {
        console.error('❌ Auth inicializálási hiba:', error);
        return null;
      }
    }

    console.error('❌ initSupabaseAuth függvény nem található!');
    return null;
  }

  /* ======= Betöltési rutinok ======= */
  async function initNav() {
    // Először hozzuk létre a navbar-t
    createTopNavbar();

    // Inicializáljuk a sidenav-et
    sidenav = document.getElementById('mySidenav');
    if (sidenav) {
      // Állítsuk be az alapértelmezett stílust
      sidenav.style.width = '0';
      sidenav.style.transition = 'width 0.3s';
      
      // Betöltjük a mentett állapotot
      const savedState = sessionStorage.getItem(NAV_STATE_KEY);
      if (savedState === 'true') {
        isNavOpen = true;
        sidenav.style.width = '250px';
      }
    }

    // Betöltjük és inicializáljuk az auth-ot
    await loadAndInitAuth();

    // Létrehozzuk a navigációt (most már az auth be van töltve)
    createNavigation();

    // Alkalmazzuk a mentett kategóriákat
    setTimeout(() => {
      document.querySelectorAll('.nav-item.search-temp-open').forEach(b => b.classList.remove('search-temp-open'));
      applyClickedCategoryIfAnyOnce();
    }, 100);

    // flush queued early calls (ha voltak)
    try { _agazati_flush_queue('toggleNav', window.toggleNav); } catch(e){}
    try { _agazati_flush_queue('openLoginModal', window.openLoginModal); } catch(e){}
    
    // Auth state change listener
    if (window.addEventListener) {
      window.addEventListener('loginStateChanged', function() {
        updateLoginStatus();
        rebuildNavigation(); // Frissítsük a nav-ot amikor változik a login state
      });
    }
  }

  // Várakozás a DOM betöltődésére
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }

  /* ======= Header/site-wide click handling ======= */
  function findMatchingSidebarAnchor(clickedHref) {
    try {
      const navAnchors = Array.from(document.querySelectorAll('#mySidenav a')).filter(a => a.getAttribute('href'));
      if (!navAnchors.length) return null;
      const normClicked = normalizeAbsHref(clickedHref);

      for (const a of navAnchors) {
        if (normalizeAbsHref(a.href) === normClicked) return a;
      }

      try {
        const clickedPath = new URL(normClicked).pathname.replace(/\/+$/, '');
        for (const a of navAnchors) {
          try {
            const p = new URL(normalizeAbsHref(a.href)).pathname.replace(/\/+$/, '');
            if (p === clickedPath) return a;
            if (p.endsWith(clickedPath) || clickedPath.endsWith(p)) return a;
          } catch (e) {}
        }
      } catch (e) {}

      const lastSeg = (normClicked.split('/').filter(Boolean).pop() || '').toLowerCase();
      if (lastSeg) {
        for (const a of navAnchors) {
          const seg = (a.getAttribute('href') || '').split('/').filter(Boolean).pop() || '';
          if (seg.toLowerCase() === lastSeg) return a;
          if ((a.textContent || '').toLowerCase().includes(lastSeg)) return a;
        }
      }

      return null;
    } catch (e) { return null; }
  }

  document.addEventListener('click', function (ev) {
    try {
      const a = ev.target.closest && ev.target.closest('a');
      if (!a) return;
      if (!a.getAttribute('href')) return;

      const abs = normalizeAbsHref(a.href);
      const match = findMatchingSidebarAnchor(abs);
      if (match) {
        const navGroup = match.closest && match.closest('.subnav');
        const cat = navGroup && navGroup.getAttribute && navGroup.getAttribute('data-category');
        if (cat) {
          try { sessionStorage.setItem(CLICK_CATEGORY_KEY, String(cat)); } catch (e) {}
          return;
        }
      }
    } catch (e) { /* noop */ }
  }, true);

  // ====================================
  // REBUILD NAV - Admin jogosultság változás után
  // ====================================
  window.rebuildNav = function() {
    // console.log('🔄 Nav újraépítése...');
    
    // Keressük meg a scrollable container-t
    const scrollable = document.querySelector('#mySidenav .nav-scrollable');
    if (!scrollable) {
      console.error('Nav scrollable container nem található!');
      return;
    }
    
    // Távolítsuk el a régi menüket (de hagyjuk a search-t)
    const searchBox = scrollable.querySelector('.search-container');
    scrollable.innerHTML = '';
    if (searchBox) {
      scrollable.appendChild(searchBox);
    }
    
    // Építsük újra a menüket
    const loginState = checkLoginState();
    // console.log('Login state:', loginState);
    const navStructure = getNavStructure(loginState.isLoggedIn, loginState.isAdmin);
    
    Object.entries(navStructure).forEach(([category, data]) => {
      const navGroup = document.createElement('div');
      navGroup.className = 'subnav';
      navGroup.setAttribute('data-category', category);

      const button = document.createElement('button');
      button.className = 'nav-item';
      button.innerHTML = `<img src="${data.icon}" alt="" class="nav-icon" /> ${category} <span class="arrow">▼</span>`;

      const content = document.createElement('div');
      content.className = 'subnav-content';
      content.style.display = 'none';
      content.style.maxHeight = '0';

      data.items.forEach(item => {
        const link = document.createElement('a');
        link.href = item.link;
        link.textContent = item.title;
        
        const absHref = normalizeAbsHref(link.href);
        const curHref = normalizeAbsHref(window.location.href);
        if (absHref === curHref) {
          link.setAttribute('aria-current', 'page');
        }
        
        content.appendChild(link);
      });

      navGroup.appendChild(button);
      navGroup.appendChild(content);
      scrollable.appendChild(navGroup);

      // Event listener a toggle-hez
      button.addEventListener('click', () => {
        const isOpen = button.classList.contains('active');
        if (!isOpen) {
          button.classList.add('active');
          content.style.display = 'block';
          setTimeout(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
          }, 10);
        } else {
          button.classList.remove('active');
          content.style.maxHeight = '0';
          setTimeout(() => {
            content.style.display = 'none';
          }, 320);
        }
      });
    });
    
    // Nyissuk meg a Titkos menüt ha látszik
    const secretNav = scrollable.querySelector('.subnav[data-category="Titkos"]');
    if (secretNav) {
      const secretBtn = secretNav.querySelector('.nav-item');
      const secretContent = secretNav.querySelector('.subnav-content');
      if (secretBtn && secretContent) {
        secretBtn.classList.add('active');
        secretContent.style.display = 'block';
        setTimeout(() => {
          secretContent.style.maxHeight = secretContent.scrollHeight + 'px';
        }, 10);
      }
    }
    
    // console.log('✅ Nav újraépítve!');
  };

})();