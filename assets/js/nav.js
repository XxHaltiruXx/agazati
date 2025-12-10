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

/* auth gomb (lila) */
#navAuthBtn {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.56rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
  max-width: none;
  transition: transform 0.14s ease, box-shadow 0.14s ease, background 0.14s ease;
  box-shadow: 0 6px 18px rgba(127,90,240,0.12);
}
#navAuthBtn:hover { transform: translateY(-2px); background: var(--accent-light); }

/* Modal overlay + box + animáció */
#pwModal {
  position: fixed;
  inset: 0;
  background: rgba(8,8,20,0.85);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
#pwModal[aria-hidden="false"] { display:flex; }
#pwBox {
  background: var(--bg-mid);
  color: var(--text);
  padding: 1.2rem 1.4rem;
  border-radius: 12px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 10px 30px rgba(11,9,26,0.6), 0 0 20px rgba(127,90,240,0.18);
  transform: scale(.98);
  opacity: 0;
  transition: transform 180ms cubic-bezier(.2,.9,.3,1), opacity 180ms ease;
}
#pwModal[aria-hidden="false"] #pwBox { transform: scale(1); opacity: 1; }

/* INPUT: elég jobb padding, hogy az ikon soha ne takarja a szöveget */
#pwInput {
  width: 100%;
  padding: 0.55rem 52px 0.55rem 0.55rem;
  background: #16162a;
  color: var(--text);
  border: 1px solid var(--accent);
  border-radius: 6px;
  box-sizing: border-box;
  height: 40px;
  font-size: 1rem;
}
#pwInput:focus { outline:none; border-color:var(--accent-light); box-shadow:0 0 6px var(--accent-light); }

/* wrapper az abszolút ikonhoz (relatív pozíció garantálva) */
.password-container { width: 100%; }
.password-inner {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

/* modal gombok: pwOk (accent) és pwCancel (ghost) */
#pwOk, #pwCancel { min-width: 110px; padding:0.5rem 0.9rem; border-radius:8px; cursor:pointer; font-weight:600; }
#pwOk { background: var(--accent); color:#fff; border:none; }
#pwOk:hover { background: var(--accent-light); transform: translateY(-2px); }
#pwCancel { background: transparent; color:var(--muted); border:1px solid rgba(136,138,184,0.12); }
#pwCancel:hover { background: rgba(127,90,240,0.04); color:var(--text); border-color: rgba(127,90,240,0.14); }

/* error/info */
.error{ color:var(--error); display:none; margin-top:8px; font-size:0.95rem; }
.info { color:var(--success); display:none; margin-top:8px; font-size:0.95rem; }
.hint { color:var(--muted); display:block; margin-top:8px; font-size:0.83rem; }

/* remember-container: balra igazítás */
.remember-container { display:flex; align-items:center; gap:8px; margin:12px 0 8px; justify-content:flex-start; }

/* TOGGLE-PASSWORD: mindig látható, pontosan a mező jobb szélén */
/* kombináljuk a "soft" megjelenést a biztos pozícionálással */
.toggle-password, #togglePwBtn {
  display: block;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.85;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 20px;
  filter: brightness(0) invert(1);
  z-index: 3;
  padding: 4px;
  box-sizing: border-box;
  border-radius: 6px;
}
.toggle-password:hover {
  opacity: 1;
  background-color: rgba(127,90,240,0.06);
}
/* képek a megadott asset útvonalról (user kérésére) - csak sidebar modal */
#pwBox .toggle-password.show,
#pwModal .toggle-password.show {
  background-image: url("assets/images/hide.png") !important;
}
#pwBox .toggle-password:not(.show),
#pwModal .toggle-password:not(.show) {
  background-image: url("assets/images/view.png") !important;
}

/* mobil finomítás */
@media (max-width:700px) {
  #pwBox { width:92%; max-width:420px; }
  #mySidenav .nav-item { padding: 0.6rem; }
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
      console.warn('[agazati] toggleNav called early; queued until initialization completes.');
    };
  }

  if (typeof window.openLoginModal !== 'function') {
    window.openLoginModal = function () {
      const args = Array.prototype.slice.call(arguments);
      window._agazati_nav_call_queue.push({ name: 'openLoginModal', args });
      console.warn('[agazati] openLoginModal called early; queued until login modal is ready.');
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
              <span style="font-size: 30px; cursor: pointer" onclick="toggleNav()" class="sidebargomb">&#9776;</span>
              <a class="nav-link" href="">főoldal</a>
              <a class="nav-link" href="html/alapok">html</a>
              <a class="nav-link" href="css/alapok">css</a>
              <a class="nav-link" href="python/alapok">python</a>
              <a class="nav-link" href="network/alapok">hálózat</a>
              <a class="nav-link" href="math/">matek</a>
            </div>
          </div>
        </div>
      </nav>
    `;
    
    // Dinamikusan beállítjuk az aria-current="page"-et az aktuális oldalon
    try {
      let currentPath = location.pathname.toLowerCase().replace(/\/+$/, '');
      
      // GitHub Pages esetén eltávolítjuk a repository prefix-et (pl. /agazati/)
      // hogy ugyanúgy működjön mint lokálisan
      currentPath = currentPath.replace(/^\/agazati\/?/i, '/');
      
      const navLinks = header.querySelectorAll('.nav-link');
      
      // Kinyerjük az aktuális oldal kategóriáját (első szegmens az URL-ből)
      // pl. "/html/structure/" -> "html", "/python/run/" -> "python"
      const pathSegments = currentPath.split('/').filter(s => s);
      const currentCategory = pathSegments.length > 0 ? pathSegments[0] : '';
      
      navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;
        
        const linkPath = linkHref.toLowerCase().replace(/\/+$/, '');
        
        // Főoldal ellenőrzése (pontos egyezés)
        if (linkPath === '' && (currentPath === '' || currentPath === '/' || currentPath === '/index.html')) {
          link.setAttribute('aria-current', 'page');
        }
        // Kategória oldalak ellenőrzése - kivesszük a link első szegmensét
        // pl. "html/alapok" -> "html", "python/alapok" -> "python"
        else if (linkPath) {
          const linkSegments = linkPath.split('/').filter(s => s);
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
  const LOGIN_STATE_KEY = '__agazati_login_state';
  const LOGIN_EXPIRY_KEY = '__agazati_login_expiry';
  const LOGIN_DURATION = 24 * 60 * 60 * 1000; // 24 óra
  const PASSWORD_HASH = '248e464b6e49676c615430dbfb831787d3d7c78e52bd2cb2461608991f7204f6';
  
  let isNavOpen = false;
  let sidenav = null;
  let __navSearchSnapshot = null;

  /* ======= Nav struktúra ======= */
  const getNavStructure = (isLoggedIn = false) => {
    const baseStructure = {
      "HTML": {
        icon: "assets/images/sidehtml.webp",
        items: [
          { title: "HTML alapok", link: "html/alapok/" },
          { title: "HTML struktúra", link: "html/structure/" },
          { title: "HTML űrlapok", link: "html/forms/" },
          { title: "HTML táblázatok", link: "html/tables/" },
          { title: "HTML multimédia", link: "html/media/" },
          { title: "HTML Futtató", link: "html/run/" },
          { title: "HTML Bővítmények", link: "html/extension/" }
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
          { title: "Routing", link: "network/routing/" }
        ]
      },
      "Matematika": {
        icon: "assets/images/sidemath.webp",
        items: [
          { title: "Matematika alapok", link: "math/" },
          { title: "Algebra", link: "math/algebra/" },
          { title: "Függvények", link: "math/functions/" },
          { title: "Geometria", link: "math/geometry/" },
          { title: "Valószínűségszámítás", link: "math/probability/" }
        ]
      }
    };

    // Ha be van jelentkezve, adjuk hozzá a titkos menüt
    if (isLoggedIn) {
      baseStructure["Titkos"] = {
        icon: "assets/images/sidesecret.svg",
        items: [
          { title: "Szózat", link: "secret/szozat/" },
          { title: "Infosharer", link: "secret/infosharer/" }
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
    const btn = document.getElementById('navAuthBtn');
    if (!btn) return;
    const isLoggedIn = checkLoginState();
    if (isLoggedIn) {
      btn.textContent = 'Kijelentkezés';
      btn.setAttribute('aria-pressed', 'true');
      btn.onclick = function () { logoutFromNav(); };
    } else {
      btn.textContent = 'Bejelentkezés';
      btn.setAttribute('aria-pressed', 'false');
      btn.onclick = function () { openLoginModal(); };
    }
  }

  function checkLoginState() {
    try {
      const loginState = localStorage.getItem(LOGIN_STATE_KEY);
      const loginExpiry = localStorage.getItem(LOGIN_EXPIRY_KEY);
      
      if (!loginState || !loginExpiry) return false;
      
      const now = Date.now();
      if (now > parseInt(loginExpiry)) {
        // Lejárt a bejelentkezés
        localStorage.removeItem(LOGIN_STATE_KEY);
        localStorage.removeItem(LOGIN_EXPIRY_KEY);
        return false;
      }
      
      return loginState === 'logged_in';
    } catch (e) {
      console.error('Bejelentkezési állapot ellenőrzése sikertelen:', e);
      return false;
    }
  }

  function setLoginState() {
    try {
      const expiry = Date.now() + LOGIN_DURATION;
      localStorage.setItem(LOGIN_STATE_KEY, 'logged_in');
      localStorage.setItem(LOGIN_EXPIRY_KEY, expiry.toString());
      rebuildNavigation();
      
      // Értesítsd az oldalt a változásról
      window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: true } }));
    } catch (e) {
      console.error('Bejelentkezési állapot mentése sikertelen:', e);
    }
  }

  function logoutFromNav() {
    try {
      localStorage.removeItem(LOGIN_STATE_KEY);
      localStorage.removeItem(LOGIN_EXPIRY_KEY);
      rebuildNavigation();
      
      // Értesítsd az oldalt a változásról
      window.dispatchEvent(new CustomEvent('loginStateChanged', { detail: { loggedIn: false } }));
      
      // Ha infosharer oldalon vagyunk, frissítsük azt is
      const currentPathname = window.location.pathname.replace(/^\/agazati\/?/i, '/');
      if (currentPathname.includes('infosharer')) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Kijelentkezés sikertelen:', e);
    }
  }

  /* ======= Modal kezelés (most a CSS-ed ID-jeivel) ======= */
  async function sha256hex(str){
    const enc = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function createLoginModal() {
    // Ellenőrizzük, hogy már létezik-e a modal
    if (document.getElementById('pwModal')) return;

    const modalHTML = `
      <div id="pwModal" style="display:none" aria-hidden="true" role="dialog" tabindex="-1">
        <div id="pwBox" role="document" tabindex="0">
          <h2 style="margin:0 0 8px">Bejelentkezés</h2>
          <div style="font-size:0.95rem;color:var(--muted);margin-bottom:10px">Írd be a jelszót a bejelentkezéshez.</div>
          <div class="password-container">
            <div class="password-inner">
              <input id="pwInput" type="password" autocomplete="off" placeholder="Jelszó" />
              <button type="button" id="togglePwBtn" class="toggle-password" aria-label="Jelszó mutatása/elrejtése"></button>
            </div>
          </div>
          <div class="remember-container">
            <input type="checkbox" id="pwRemember">
            <label for="pwRemember">Emlékezz rám</label>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
            <button id="pwCancel" class="ghost">Mégse</button>
            <button id="pwOk">Bejelentkezés</button>
          </div>
          <div class="error" id="pwNote">Helytelen jelszó</div>
          <div class="info" id="pwInfo">Sikeres bejelentkezés</div>
          <small class="hint">Szóköz a bevitelnél: a jelszó trim-elve lesz (véletlen szóközök eltávolítása).</small>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupModalEvents();
  }

  function setupModalEvents() {
    const modal = document.getElementById('pwModal');
    const pwInput = document.getElementById('pwInput');
    const pwOk = document.getElementById('pwOk');
    const pwCancel = document.getElementById('pwCancel');
    const pwNote = document.getElementById('pwNote');
    const pwInfo = document.getElementById('pwInfo');
    const togglePwBtn = document.getElementById('togglePwBtn');
    const rememberMe = document.getElementById('pwRemember');

    if (!modal) return;

    // Jelszó láthatóság váltása — kezeljük a .show class-t is, mindig láthatóvá tesszük az ikont
    if (togglePwBtn) {
      // biztosítsuk, hogy a wrapper pozícionálva legyen
      const parent = togglePwBtn.closest('.password-inner');
      if (parent) parent.style.position = parent.style.position || 'relative';

      // override input padding (biztosítjuk, hogy az ikon ne takarja a szöveget)
      if (pwInput) {
        try { pwInput.style.paddingRight = '52px'; } catch (e) {}
      }

      // mindig jelenjen meg az ikon
      try {
        togglePwBtn.style.display = 'block';
        togglePwBtn.style.opacity = '1';
        togglePwBtn.style.right = '8px';
      } catch(e){}

      // inicializáljuk a class-t az alapértelmezett input típus alapján (password => not .show)
      if (pwInput && pwInput.type === 'password') {
        togglePwBtn.classList.remove('show');
        togglePwBtn.setAttribute('aria-pressed', 'false');
      } else {
        togglePwBtn.classList.add('show');
        togglePwBtn.setAttribute('aria-pressed', 'true');
      }

      // kattintás váltás
      togglePwBtn.addEventListener('click', function() {
        if (!pwInput) return;
        const isPassword = pwInput.type === 'password';
        try { pwInput.type = isPassword ? 'text' : 'password'; } catch(e){}

        if (isPassword) {
          togglePwBtn.classList.add('show');
          togglePwBtn.setAttribute('aria-pressed', 'true');
        } else {
          togglePwBtn.classList.remove('show');
          togglePwBtn.setAttribute('aria-pressed', 'false');
        }

        // fókusz vissza az inputra
        try { pwInput.focus(); } catch(e){}
      });

      // biztosítjuk, hogy input esemény esetén se tűnjön el (ha valami külső kód elrejtené)
      if (pwInput) {
        pwInput.addEventListener('input', () => {
          try {
            togglePwBtn.style.display = 'block';
            togglePwBtn.style.opacity = '1';
          } catch(e){}
        });
      }

      // amikor a modal megnyílik, erőltetjük az ikon megjelenését is — ha openLoginModal belül van, az meghívja ezt
    }



    // Modal megnyitása
    window.openLoginModal = function() {
      if (pwNote) pwNote.style.display = 'none';
      if (pwInfo) pwInfo.style.display = 'none';
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      if (pwInput) {
        pwInput.value = '';
        pwInput.type = 'password';
        setTimeout(() => pwInput.focus(), 50);
      }
    };

    // Ha korábban sorba álltak openLoginModal hívások, futtassuk őket
    try { _agazati_flush_queue('openLoginModal', window.openLoginModal); } catch(e){}

    // Modal bezárása
    const closeModal = () => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      if (pwInput) {
        pwInput.value = '';
        if (pwNote) pwNote.style.display = 'none';
        pwInput.type = 'password';
      }
      if (rememberMe) rememberMe.checked = false;
    };

    if (pwCancel) {
      pwCancel.addEventListener('click', closeModal);
    }

    // ESC billentyű
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    });

    // Kattintás a háttérre
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal && e.button === 0) {
        e.preventDefault();
        closeModal();
      }
    });

    // Enter a jelszó mezőben
    if (pwInput) {
      pwInput.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') { 
          e.preventDefault(); 
          if (pwOk) pwOk.click(); 
        } 
      });
    }

    // Bejelentkezés gomb
    if (pwOk) {
      pwOk.addEventListener('click', async () => {
        const raw = pwInput.value || '';
        const attempt = raw.trim();
        if (pwNote) pwNote.style.display = 'none';
        
        try {
          const h = await sha256hex(attempt);
          if (h === PASSWORD_HASH.toLowerCase()) {
            // Sikeres bejelentkezés
            setLoginState();
            if (rememberMe && rememberMe.checked) {
              const token = {
                value: PASSWORD_HASH,
                expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
              };
              localStorage.setItem('infosharer_remember_token', JSON.stringify(token));
            }
            if (pwInfo) {
              pwInfo.style.display = 'block';
              setTimeout(() => {
                closeModal();
                setTimeout(() => { if (pwInfo) pwInfo.style.display = 'none'; }, 1200);
              }, 500);
            } else {
              closeModal();
            }
          } else {
            if (pwNote) {
              pwNote.textContent = 'Helytelen jelszó';
              pwNote.style.display = 'block';
            }
          }
        } catch(err) {
          if (pwNote) {
            pwNote.textContent = 'Hiba a jelszóellenőrzésnél';
            pwNote.style.display = 'block';
          }
        }
      });
    }
  }

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
    const navContainer = document.querySelector('#mySidenav > div');
    if (navContainer) {
      navContainer.removeAttribute('data-nav-built');
      createNavigation();
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
    searchBox.innerHTML = `<input type="text" id="searchNav" placeholder="🔍 Keresés..." />`;
    scrollable.appendChild(searchBox);

    // Menük létrehozása
    const isLoggedIn = checkLoginState();
    const navStructure = getNavStructure(isLoggedIn);
    
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
    // --- SKIP SIDEBAR AUTH ON INFOSHARER PAGES ---
    // Ha az oldal maga tartalmaz már auth gombot (pl. infosharer), akkor ne jelenjen meg a sidebar-ban.
    const hasPageAuth = (function() {
      try {
        if (window.location && typeof window.location.pathname === 'string') {
          const currentPathname = window.location.pathname.replace(/^\/agazati\/?/i, '/');
          if (currentPathname.includes('infosharer')) return true;
        }
        // alternatív: az oldal jelölheti, hogy saját auth buttonja van, pl. <button id="infosharer-auth"> vagy data attribútum
        if (document.getElementById('infosharer-auth')) return true;
        if (document.querySelector('[data-infosharer-auth]')) return true;
      } catch (e) {}
      return false;
    })();

    if (!hasPageAuth) {
      const authWrap = document.createElement('div');
      authWrap.style.width = '100%';
      authWrap.style.display = 'flex';
      authWrap.style.justifyContent = 'center';
      authWrap.style.alignItems = 'center';

      const authBtn = document.createElement('button');
      authBtn.id = 'navAuthBtn';
      authBtn.className = 'nav-auth-btn';
      // NE állítsunk inline width-et itt — a CSS fent garantálja, hogy teljes szélességet kapjon
      authBtn.textContent = 'Bejelentkezés';

      authWrap.appendChild(authBtn);
      footer.appendChild(authWrap);
    } else {
      // Ha kihagytuk az auth gombot, hagyjuk üresen a footert (vagy oda tehetünk más elemeket később)
    }

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

  /* ======= Betöltési rutinok ======= */
  function initNav() {
    // Először hozzuk létre a navbar-t
    createTopNavbar();
    
    // Aztán a modalt
    createLoginModal();

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

    // Létrehozzuk a navigációt
    createNavigation();

    // Alkalmazzuk a mentett kategóriákat
    setTimeout(() => {
      document.querySelectorAll('.nav-item.search-temp-open').forEach(b => b.classList.remove('search-temp-open'));
      applyClickedCategoryIfAnyOnce();
    }, 100);

    // flush queued early calls (ha voltak)
    try { _agazati_flush_queue('toggleNav', window.toggleNav); } catch(e){}
    try { _agazati_flush_queue('openLoginModal', window.openLoginModal); } catch(e){}
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
})();