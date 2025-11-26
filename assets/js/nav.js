/* nav.js - azonnali inicializáció, hogy ne várjon a pyodide.js-re */
(function () {
  'use strict';

  /* ======= Konstansok, állapot ======= */
  const NAV_STATE_KEY = '__agazati_nav_state';
  const SUBMENU_STATE_KEY = '__agazati_submenu_state';
  const CLICK_CATEGORY_KEY = '__agazati_nav_category_v3'; // mentett kategória
  let isNavOpen = false;
  let sidenav = null;
  let __navSearchSnapshot = null;

  /* ======= Nav struktúra (eredeti adataid) ======= */
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
      
      // Almenük állapotának betöltése
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

  /* ======= Globális toggleNav (azonnal definiálva) ======= */
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

  /* ======= Keresés (snapshot logika) ======= */
  function filterNavItems(searchText) {
    const subnavs = document.querySelectorAll('.subnav');
    searchText = (searchText || '').trim().toLowerCase();

    // Ha a kereső MOST vált nem üresre és még nincs snapshot, készítünk egy pillanatképet
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

    // Üres keresés -> visszaállítjuk PONTOSAN a keresés előtti állapotot, ha van snapshot
    if (!searchText) {
      if (__navSearchSnapshot) {
        // visszaállítjuk a nav open/close állapotot (vizuálisan, anélkül, hogy elmentenénk)
        isNavOpen = !!__navSearchSnapshot.isNavOpen;
        if (sidenav) {
          // ha zárt, width=0; ha nyitott, 250px (illeszthető)
          sidenav.style.transition = 'none';
          sidenav.style.width = isNavOpen ? "250px" : "0";
          // kis késleltetéssel visszaállítjuk az átmenetet (ahogy eredetileg csinálod)
          setTimeout(() => { sidenav.style.transition = ''; }, 100);
        }

        // visszaállítjuk minden almenü aktív/inaktív állapotát és megmutatjuk az összes linket
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
            // eltávolítjuk az ideiglenes keresési jelzést
            button.classList.remove('search-temp-open');
          }
          if (content) {
            // mutatjuk az összes linket
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

        // töröljük a snapshot-ot — innentől a normal működés folytatódik
        __navSearchSnapshot = null;

        return;
      } else {
        // nincs snapshot (pl. nem volt előtte keresés) -> hagyjuk az alaplogikát: mutassuk a mentett állapotot
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

    // Keresés nem üres: ne írjuk felül a mentett állapotot, csak szűrjünk (és nyissuk ki azokat a menüket,
    // ahol találtunk, de csak a találó linkek látszódjanak)
    subnavs.forEach(navGroup => {
      const button = navGroup.querySelector('.nav-item');
      const content = navGroup.querySelector('.subnav-content');
      if (!button || !content) return;

      const links = Array.from(content.querySelectorAll('a'));
      const matches = links.filter(a => (a.textContent || '').toLowerCase().includes(searchText));

      if (matches.length > 0) {
        // mutassuk a főgombot és csak a találó linkeket; jelöljük TEMP-nyitott állapotnak (nem mentett)
        button.style.display = 'flex';
        // ne állítsunk 'active'-t: használjunk egy ideiglenes osztályt
        button.classList.add('search-temp-open');

        links.forEach(a => {
          a.style.display = matches.includes(a) ? 'block' : 'none';
        });

        // nyitás gyorsan (animáció nélkül), hogy ne legyen fura mozgás
        content.style.display = 'block';
        content.style.transition = 'none';
        content.style.maxHeight = 'none';
        content.style.overflow = '';

        const arrow = button.querySelector('.arrow');
        if (arrow) arrow.textContent = '▲';
      } else {
        // semmi találat az almenüben
        const parentMatches = (button.textContent || '').toLowerCase().includes(searchText);
        if (parentMatches) {
          // ha a főgomb egyezik, mutassuk csak a gombot (de tartsuk zárva az almenüt)
          button.style.display = 'flex';
          button.classList.remove('search-temp-open');
          links.forEach(a => a.style.display = 'none');
          content.style.display = 'none';
          content.style.maxHeight = '0';
          const arrow = button.querySelector('.arrow');
          if (arrow) arrow.textContent = '▼';
        } else {
          // nincs semmi közük -> rejtsük el az egész blokkot
          button.style.display = 'none';
          links.forEach(a => a.style.display = 'none');
          content.style.display = 'none';
          content.style.maxHeight = '0';
        }
      }
    });
  }

  /* ======= Profil blokk hozzáadása a sidebar aljára ======= */
  function addUserProfileToSidebar() {
    if (!sidenav) return;
    
    // Supabase elérhetőség ellenőrzése - BIZTONSÁGI MÓD
    if (typeof window.supabase === 'undefined' || !window.supabase) {
      console.warn('Supabase nincs inicializálva, profil funkciók letiltva');
      
      // Hozz létre egy alap profilt Supabase nélkül
      const profileWrapper = document.createElement('div');
      profileWrapper.className = 'sidebar-profile';
      profileWrapper.style.cursor = 'pointer';
      profileWrapper.innerHTML = `
        <img src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" class="sidebar-profile-img" alt="Profil" />
        <div class="sidebar-profile-name">Bejelentkezés</div>
      `;
      
      profileWrapper.addEventListener('click', () => {
        alert('A bejelentkezési rendszer jelenleg nem elérhető. Supabase nincs konfigurálva.');
      });
      
      sidenav.appendChild(profileWrapper);
      return;
    }

    // Ellenőrizzük, hogy már létezik-e profil elem
    const existingProfile = sidenav.querySelector('.sidebar-profile');
    if (existingProfile) {
      existingProfile.remove();
    }

    const profileWrapper = document.createElement('div');
    profileWrapper.className = 'sidebar-profile';
    profileWrapper.style.cursor = 'pointer';

    const img = document.createElement('img');
    // Teszteléshez használj egy garantáltan működő képet
    img.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    img.className = 'sidebar-profile-img';
    img.alt = 'Profil';
    img.onerror = function() {
      // Ha a kép nem töltődik be, használj placeholder-t
      this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
    };

    const nameDiv = document.createElement('div');
    nameDiv.className = 'sidebar-profile-name';
    nameDiv.textContent = 'Bejelentkezés';

    profileWrapper.appendChild(img);
    profileWrapper.appendChild(nameDiv);
    sidenav.appendChild(profileWrapper);

    // Supabase Auth interakció
    profileWrapper.addEventListener('click', async () => {
      try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          return;
        }
        
        if (user) {
          // Ha már be van jelentkezve, kijelentkezés
          if (confirm('Kijelentkezés?')) {
            await window.supabase.auth.signOut();
            location.reload();
          }
        } else {
          // Bejelentkezés / regisztráció
          const email = prompt('Add meg az emailed a bejelentkezéshez / regisztrációhoz:');
          if (!email) return;
          
          const { error } = await window.supabase.auth.signInWithOtp({ 
            email: email,
            options: {
              emailRedirectTo: window.location.origin
            }
          });
          
          if (error) {
            alert('Hiba a bejelentkezésnél: ' + error.message);
          } else {
            alert('Küldve lett a belépési link az emailedre!');
          }
        }
      } catch (error) {
        console.error('Profile click error:', error);
        alert('Hiba történt: ' + error.message);
      }
    });

    // Dinamikus frissítés, ha már bejelentkezett a felhasználó
    window.supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        img.src = session.user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
        nameDiv.textContent = session.user.email || 'Felhasználó';
      } else {
        img.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
        nameDiv.textContent = 'Bejelentkezés';
      }
    });
  }

  function createNavigation() {
    sidenav = document.getElementById('mySidenav');
    const navContainer = document.querySelector('#mySidenav > div') || (sidenav ? sidenav : null);
    if (!navContainer) return;

    // Ha már építettük a navot korábban (pl. kétszeri hívás miatt), ne építsük újra.
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

    // PROFIL HOZZÁADÁSA - ez legyen a createNavigation UTÁN
    setTimeout(() => {
      addUserProfileToSidebar();
    }, 100);

    // Állapot betöltése a létrehozás után
    loadNavState();
  }

  /* ======= Betöltéskor alkalmazzuk a mentett kategóriát (ha van) ======= */
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

  /* ======= Betöltési rutinok (AZONNALI INICIALIZÁCIÓ ha lehetséges) ======= */

  // Az inicializációs függvény: ha a szükséges DOM elem már elérhető, építsük fel azonnal.
  function initNavAsap() {
    // ha a sidebar konténer már a DOM-ban van, építsük fel azonnal
    const immediateContainer = document.querySelector('#mySidenav > div');
    if (immediateContainer) {
      // beállítások (sidenav referencia)
      sidenav = document.getElementById('mySidenav');
      if (sidenav) {
        sidenav.style.transition = 'none';
        const savedState = sessionStorage.getItem(NAV_STATE_KEY);
        if (savedState === 'true') {
          isNavOpen = true;
          sidenav.style.width = '250px';
        }
        // kis késleltetés után visszaállítjuk az átmenetet
        setTimeout(() => { if (sidenav) sidenav.style.transition = ''; }, 100);
      }

      createNavigation();

      // Alkalmazzuk a mentett kattintást (ha van) — előbb töröljük a keresőt, hogy az ne nyisson meg többet
      setTimeout(() => {
        document.querySelectorAll('.nav-item.search-temp-open').forEach(b => b.classList.remove('search-temp-open'));
        applyClickedCategoryIfAnyOnce();
      }, 120);

      return;
    }

    // különben csatlakozó a DOMContentLoaded-re (várunk a parse végére)
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

  /* ======= Header/site-wide click handling - ha a header link megfelel a sidebarnak, mentsük a kategóriát ======= */
  function findMatchingSidebarAnchor(clickedHref) {
    try {
      const navAnchors = Array.from(document.querySelectorAll('#mySidenav a')).filter(a => a.getAttribute('href'));
      if (!navAnchors.length) return null;
      const normClicked = normalizeAbsHref(clickedHref);

      // 1) pontos abszolút egyezés
      for (const a of navAnchors) {
        if (normalizeAbsHref(a.href) === normClicked) return a;
      }

      // 2) pathname egyezés / részleges egyezés
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

      // 3) last segment vagy szöveg alapján
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

  // debug helper
  try {
    window.__agazati_nav_helpers = {
      normalizeAbsHref,
      CLICK_CATEGORY_KEY
    };
  } catch (e) {}
})(); 