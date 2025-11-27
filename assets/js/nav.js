/* nav.js - azonnali inicializáció, hogy ne várjon a pyodide.js-re */
(function () {
  'use strict';

  /* ======= Konstansok, állapot ======= */
  const NAV_STATE_KEY = '__agazati_nav_state';
  const SUBMENU_STATE_KEY = '__agazati_submenu_state';
  const CLICK_CATEGORY_KEY = '__agazati_nav_category_v3';
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

  /* ======= Profil blokk - TELJESEN ÁTÍRT ======= */
  function addUserProfileToSidebar() {
    if (!sidenav) return;

    // Ellenőrizzük, hogy már létezik-e profil elem
    const existingProfile = sidenav.querySelector('.sidebar-profile');
    if (existingProfile) {
      existingProfile.remove();
    }

    const profileWrapper = document.createElement('div');
    profileWrapper.className = 'sidebar-profile';
    profileWrapper.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
    img.className = 'sidebar-profile-img';
    img.alt = 'Profil';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'sidebar-profile-name';
    nameDiv.textContent = 'Bejelentkezés';

    profileWrapper.appendChild(img);
    profileWrapper.appendChild(nameDiv);
    sidenav.appendChild(profileWrapper);

    // Supabase elérhetőség ellenőrzése
    // Supabase elérhetőség ellenőrzése
    if (typeof window.supabase === 'undefined' || !window.supabase) {
      console.warn('Supabase nincs inicializálva - alap profil használata');

      // Ha nincs supabase, a profil kattintás mindig megnyitja az auth modal-t (ha elérhető)
      profileWrapper.addEventListener('click', () => {
        if (typeof window.openAuthModal === 'function') {
          window.openAuthModal();
        } else {
          alert('A bejelentkezési funkció jelenleg nem elérhető.');
        }
      });
      return;
    }

    // Session ellenőrzése és felhasználói adatok frissítése
    const updateUserProfile = async () => {
      try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) {
          console.error('Hiba a felhasználó lekérésében:', error);
          return;
        }
        
        if (user) {
          img.src = user.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
          nameDiv.textContent = user.email || 'Felhasználó';
        } else {
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
          nameDiv.textContent = 'Bejelentkezés';
        }
      } catch (error) {
        console.error('Hiba a profil frissítésében:', error);
      }
    };
      window.addUserProfileToSidebar = addUserProfileToSidebar;

    // Profil kattintás esemény
    profileWrapper.addEventListener('click', async () => {
      try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) {
          console.error('Hiba a felhasználó lekérésében:', error);
          alert('Hiba a bejelentkezési állapot ellenőrzésében: ' + error.message);
          return;
        }
        
        if (user) {
          // Ha már be van jelentkezve, kijelentkezés
          if (confirm('Kijelentkezés?')) {
            const { error } = await window.supabase.auth.signOut();
            if (error) {
              alert('Hiba a kijelentkezésnél: ' + error.message);
            } else {
              location.reload();
            }
          }
        } else {
          // REGISZTRÁCIÓ és BEJELENTKEZÉS - JAVÍTOTT VERZIÓ
          const email = prompt('Add meg az emailed a regisztrációhoz / bejelentkezéshez:');
          if (!email) return;
          
          // Email validáció
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            alert('Kérjük, érvényes email címet adj meg!');
            return;
          }
          
          const { error } = await window.supabase.auth.signInWithOtp({
            email: email,
            options: {
              // MÓDOSÍTOTT: Pontos redirect URL a GitHub Pages-hez
              emailRedirectTo: 'https://xxhaltiruxx.github.io/agazati/'
            }
          });
          
          if (error) {
            alert('Hiba történt: ' + error.message);
          } else {
            alert('Elküldtünk egy bejelentkezési linket a megadott email címre! Kérjük, ellenőrizd a postaládádat és kattints a linkre a bejelentkezéshez.');
          }
        }
      } catch (error) {
        console.error('Profil kattintási hiba:', error);
        alert('Váratlan hiba történt: ' + error.message);
      }
    });

    // Auth state change listener - JAVÍTOTT
    try {
      if (window.supabase && window.supabase.auth) {
        const { data: { subscription } } = window.supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              await updateUserProfile();
            } else if (event === 'SIGNED_OUT') {
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbnU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
              nameDiv.textContent = 'Bejelentkezés';
            }
          }
        );

        // Kezdeti felhasználói adatok betöltése
        updateUserProfile();
      }
    } catch (error) {
      console.error('Auth state change regisztrálási hiba:', error);
    }
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


        // PROFIL HOZZÁADÁSA — hívjuk, ha van implementáció (most az auth.js kezeli)
    setTimeout(() => {
      if (typeof window.addUserProfileToSidebar === 'function') {
        try {
          window.addUserProfileToSidebar();
        } catch (e) {
          console.error('addUserProfileToSidebar hívási hiba:', e);
        }
      } else {
        // fallback: ne csináljunk semmit — ez megelőzi a hibát, ha supabase nincs
        console.warn('addUserProfileToSidebar nincs betöltve, kihagyva.');
      }
    }, 100);


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