/* nav.js - azonnali inicializáció, hogy ne várjon a pyodide.js-re */
(function () {
  'use strict';

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
        icon: "assets/images/sidesecret.webp",
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
    const loginStatus = document.getElementById('navLoginStatus');
    if (!loginStatus) return;

    const isLoggedIn = checkLoginState();
    
    if (isLoggedIn) {
      loginStatus.innerHTML = `
        <div class="login-info">
          <span class="login-icon">✓</span>
          <span class="login-text">Bejelentkezve</span>
          <button class="logout-btn-nav" onclick="logoutFromNav()">Kijelentkezés</button>
        </div>
      `;
    } else {
      loginStatus.innerHTML = `
        <div class="login-info">
          <span class="login-icon">🔒</span>
          <span class="login-text">Bejelentkezés</span>
          <button class="login-btn-nav" onclick="openLoginModal()">Bejelentkezés</button>
        </div>
      `;
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
      if (window.location.pathname.includes('infosharer')) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Kijelentkezés sikertelen:', e);
    }
  }

  /* ======= Modal kezelés ======= */
  async function sha256hex(str){
    const enc = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function createLoginModal() {
    // Ellenőrizzük, hogy már létezik-e a modal
    if (document.getElementById('globalLoginModal')) return;

    const modalHTML = `
      <div id="globalLoginModal" style="display:none" aria-hidden="true" role="dialog" tabindex="-1">
        <div id="globalPwBox" role="document" tabindex="0">
          <h2 style="margin:0 0 8px">Bejelentkezés</h2>
          <div style="font-size:0.95rem;color:var(--muted);margin-bottom:10px">Írd be a jelszót a bejelentkezéshez.</div>
          <div class="password-container">
            <div class="password-inner">
              <input id="globalPwInput" type="password" autocomplete="off" placeholder="Jelszó" />
              <span class="toggle-password" id="globalTogglePassword" role="button" tabindex="0"></span>
            </div>
          </div>
          <div class="remember-container">
            <input type="checkbox" id="globalRememberMe">
            <label for="globalRememberMe">Emlékezz rám</label>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
            <button id="globalPwCancel" class="ghost">Mégse</button>
            <button id="globalPwOk">Bejelentkezés</button>
          </div>
          <div class="error" id="globalPwNote">Helytelen jelszó</div>
          <div class="info" id="globalPwInfo">Sikeres bejelentkezés</div>
          <small class="hint">Szóköz a bevitelnél: a jelszó trim-elve lesz (véletlen szóközök eltávolítása).</small>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupModalEvents();
  }

  function setupModalEvents() {
    const modal = document.getElementById('globalLoginModal');
    const pwInput = document.getElementById('globalPwInput');
    const pwOk = document.getElementById('globalPwOk');
    const pwCancel = document.getElementById('globalPwCancel');
    const pwNote = document.getElementById('globalPwNote');
    const pwInfo = document.getElementById('globalPwInfo');
    const togglePassword = document.getElementById('globalTogglePassword');
    const rememberMe = document.getElementById('globalRememberMe');

    if (!modal) return;

    // Jelszó láthatóság váltása
    if (togglePassword) {
      togglePassword.style.backgroundImage = 'url("assets/images/view.png")';
      togglePassword.addEventListener('click', function() {
        const isPassword = pwInput.type === 'password';
        pwInput.type = isPassword ? 'text' : 'password';
        this.style.backgroundImage = isPassword ? 'url("assets/images/hide.png")' : 'url("assets/images/view.png")';
      });
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
      if (togglePassword) {
        togglePassword.style.backgroundImage = 'url("assets/images/view.png")';
      }
    };

    // Modal bezárása
    const closeModal = () => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      if (pwInput) {
        pwInput.value = '';
        pwNote.style.display = 'none';
        pwInput.type = 'password';
      }
      if (togglePassword) {
        togglePassword.style.backgroundImage = 'url("assets/images/view.png")';
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
                setTimeout(() => pwInfo.style.display = 'none', 1200);
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
  window.openLoginModal = openLoginModal;

 /* ======= Globális toggleNav ======= */
window.toggleNav = function () {
  console.log('toggleNav called'); // Debug
  if (!sidenav) {
    sidenav = document.getElementById('mySidenav');
    console.log('sidenav element:', sidenav); // Debug
    if (!sidenav) {
      console.error('Sidenav element not found!');
      return;
    }
  }
  
  sidenav.style.transition = 'width 0.3s';
  if (isNavOpen) {
    sidenav.style.width = '0';
    isNavOpen = false;
    console.log('Closing sidebar'); // Debug
  } else {
    sidenav.style.width = '250px';
    isNavOpen = true;
    console.log('Opening sidebar'); // Debug
  }
  saveNavState();
};

  /* ======= Navigáció újraépítése ======= */
  function rebuildNavigation() {
    const navContainer = document.querySelector('#mySidenav > div');
    if (navContainer) {
      navContainer.removeAttribute('data-nav-built');
      createNavigation();
    }
  }

  /* ======= Keresés ======= */
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

    let navContainer = sidenav.querySelector('div');
    if (!navContainer) {
      navContainer = document.createElement('div');
      sidenav.appendChild(navContainer);
    }

    if (navContainer.getAttribute('data-nav-built') === '1') return;
    navContainer.setAttribute('data-nav-built', '1');

    navContainer.innerHTML = '';

    // kereső
    const searchBox = document.createElement('div');
    searchBox.className = 'search-container';
    searchBox.innerHTML = `<input type="text" id="searchNav" placeholder="🔍 Keresés..." />`;
    navContainer.appendChild(searchBox);

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
          if (location.pathname.replace(/\/+$/, '').includes(item.link.replace(/\/+$/, ''))) {
            link.classList.add('active');
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
      navContainer.appendChild(navGroup);

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

    // Bejelentkezési állapot megjelenítése (alul)
    const loginStatus = document.createElement('div');
    loginStatus.className = 'login-status';
    loginStatus.id = 'navLoginStatus';
    navContainer.appendChild(loginStatus);

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
    // Először hozzuk létre a modalt
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