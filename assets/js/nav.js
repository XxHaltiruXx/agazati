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
  
  let isNavOpen = false;
  let sidenav = null;
  let __navSearchSnapshot = null;

  /* ======= Nav struktúra ======= */
  const navStructure = {
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
          <button class="logout-btn" onclick="logoutFromNav()">Kijelentkezés</button>
        </div>
      `;
    } else {
      loginStatus.innerHTML = `
        <div class="login-info">
          <span class="login-icon">🔒</span>
          <span class="login-text">Nem bejelentkezve</span>
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
      updateLoginStatus();
      
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
      updateLoginStatus();
      
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

  // Globális függvények a HTML-ből való hozzáféréshez
  window.setLoginState = setLoginState;
  window.logoutFromNav = logoutFromNav;
  window.checkLoginState = checkLoginState;

  /* ======= Globális toggleNav ======= */
  window.toggleNav = function () {
    if (!sidenav) sidenav = document.getElementById('mySidenav');
    if (!sidenav) return;
    sidenav.style.transition = 'width 0.3s';
    if (isNavOpen) {
      sidenav.style.width = '0';
      isNavOpen = false;
    } else {
      sidenav.style.width = '250px';
      isNavOpen = true;
    }
    saveNavState();
  };

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
          setTimeout(() => { sidenav.style.transition = ''; }, 100);
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
    const navContainer = document.querySelector('#mySidenav > div') || (sidenav ? sidenav : null);
    if (!navContainer) return;

    if (navContainer.getAttribute('data-nav-built') === '1') return;
    navContainer.setAttribute('data-nav-built', '1');

    navContainer.innerHTML = '';

    // kereső
    const searchBox = document.createElement('div');
    searchBox.className = 'search-container';
    searchBox.innerHTML = `<input type="text" id="searchNav" placeholder="🔍 Keresés..." />`;
    navContainer.appendChild(searchBox);

    // Bejelentkezési állapot megjelenítése
    const loginStatus = document.createElement('div');
    loginStatus.className = 'login-status';
    loginStatus.id = 'navLoginStatus';
    navContainer.appendChild(loginStatus);

    // Frissítsd a bejelentkezési állapotot
    updateLoginStatus();

    // Menük létrehozása
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
            const arrow = button.querySelector('.arrow'); if (arrow) arrow.textContent = '▲';
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
        if (__navSearchSnapshot) {
          const isTemp = button.classList.toggle('search-temp-open');
          const arrow = button.querySelector('.arrow'); if (arrow) arrow.textContent = isTemp ? '▲' : '▼';
          return;
        }

        button.classList.toggle('active');

        const isExpanded = content.style.display !== 'none' && (content.style.maxHeight !== '0px' && content.style.maxHeight !== '' && content.style.maxHeight !== '0');

        if (!isExpanded) {
          content.style.display = 'block';
          content.style.overflow = 'hidden';
          content.style.maxHeight = '0';
          requestAnimationFrame(() => {
            content.style.transition = 'max-height 0.3s ease-out';
            content.style.maxHeight = content.scrollHeight + 'px';
          });
          const arrow = button.querySelector('.arrow'); if (arrow) arrow.textContent = '▲';
          setTimeout(() => { if (content.style.maxHeight && content.style.maxHeight !== '0px') content.style.maxHeight = 'none'; }, 350);
        } else {
          const currentHeight = content.scrollHeight;
          content.style.overflow = 'hidden';
          content.style.maxHeight = currentHeight + 'px';
          content.getBoundingClientRect();
          requestAnimationFrame(() => {
            content.style.transition = 'max-height 0.3s ease-out';
            content.style.maxHeight = '0';
          });
          const arrow = button.querySelector('.arrow'); if (arrow) arrow.textContent = '▼';
          setTimeout(() => {
            if (content.style.maxHeight === '0px' || content.style.maxHeight === '0') content.style.display = 'none';
          }, 320);
        }

        saveNavState();
      });
    });

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
          const arrow = btn.querySelector('.arrow'); if (arrow) arrow.textContent = '▲';
          matched = true;
        } else {
          btn.classList.remove('active');
          btn.classList.remove('search-temp-open');
          content.style.maxHeight = '0';
          content.style.overflow = 'hidden';
          setTimeout(() => { content.style.display = 'none'; }, 320);
          const arrow = btn.querySelector('.arrow'); if (arrow) arrow.textContent = '▼';
        }
      });

      if (matched) {
        saveNavState();
        try { sessionStorage.removeItem(CLICK_CATEGORY_KEY); } catch (e) {}
      }
    } catch (e) { console.error('applyClickedCategoryIfAnyOnce error:', e); }
  }

  /* ======= Betöltési rutinok ======= */
  function initNavAsap() {
    const immediateContainer = document.querySelector('#mySidenav > div');
    if (immediateContainer) {
      sidenav = document.getElementById('mySidenav');
      if (sidenav) {
        sidenav.style.transition = 'none';
        const savedState = sessionStorage.getItem(NAV_STATE_KEY);
        if (savedState === 'true') {
          isNavOpen = true;
          sidenav.style.width = '250px';
        }
        setTimeout(() => { if (sidenav) sidenav.style.transition = ''; }, 100);
      }

      createNavigation();

      setTimeout(() => {
        document.querySelectorAll('.nav-item.search-temp-open').forEach(b => b.classList.remove('search-temp-open'));
        applyClickedCategoryIfAnyOnce();
      }, 120);

      return;
    }

    document.addEventListener('DOMContentLoaded', () => {
      sidenav = document.getElementById('mySidenav');
      if (sidenav) {
        sidenav.style.transition = 'none';
        const savedState = sessionStorage.getItem(NAV_STATE_KEY);
        if (savedState === 'true') {
          isNavOpen = true;
          sidenav.style.width = '250px';
        }
        setTimeout(() => { if (sidenav) sidenav.style.transition = ''; }, 100);
      }

      createNavigation();

      setTimeout(() => {
        document.querySelectorAll('.nav-item.search-temp-open').forEach(b => b.classList.remove('search-temp-open'));
        applyClickedCategoryIfAnyOnce();
      }, 120);
    }, { once: true });
  }

  // Indítás
  initNavAsap();

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