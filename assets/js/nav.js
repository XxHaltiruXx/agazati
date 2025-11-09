// Azonnal definiáljuk a globális toggleNav függvényt
window.toggleNav = function() {
    if (!sidenav) {
        sidenav = document.getElementById("mySidenav");
    }
    if (!sidenav) return;
    
    // Kapcsoljuk be az animációt
    sidenav.style.transition = 'width 0.3s';
    
    if (isNavOpen) {
        sidenav.style.width = "0";
        isNavOpen = false;
    } else {
        sidenav.style.width = "250px";
        isNavOpen = true;
    }
    saveNavState();
};

// Navigációs adatstruktúra
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

// Állapot kezelése sessionStorage-dzsal
const NAV_STATE_KEY = '__agazati_nav_state';
const SUBMENU_STATE_KEY = '__agazati_submenu_state';

// Globális változók inicializálása
let isNavOpen = false;
let sidenav;

// Oldal betöltésekor inicializáljuk a változókat
document.addEventListener('DOMContentLoaded', () => {
    sidenav = document.getElementById('mySidenav');
    if (sidenav) {
        // Kikapcsoljuk az animációt
        sidenav.style.transition = 'none';
        
        // Betöltjük a mentett állapotot
        const savedState = sessionStorage.getItem(NAV_STATE_KEY);
        if (savedState === 'true') {
            isNavOpen = true;
            sidenav.style.width = "250px";
        }
        
        // Egy kis késleltetéssel visszakapcsoljuk az animációt
        setTimeout(() => {
            sidenav.style.transition = '';
        }, 100);
    }
});

// Állapot betöltése
function loadNavState() {
  try {
    const savedSubmenuState = JSON.parse(sessionStorage.getItem(SUBMENU_STATE_KEY) || '{}');
    
    // NE animáljon betöltéskor
    const noAnimation = true;

    setTimeout(() => {
      Object.entries(savedSubmenuState).forEach(([category, isOpen]) => {
        const navGroup = document.querySelector(`.subnav[data-category="${category}"]`);
        if (navGroup) {
          const button = navGroup.querySelector('.nav-item');
          const content = navGroup.querySelector('.subnav-content');
          if (isOpen && button && content) {
            button.classList.add('active');
            content.style.display = 'block';

            if (noAnimation) {
              // Betöltéskor AZONNAL nyíljon ki animáció nélkül
              content.style.transition = 'none';
              content.style.maxHeight = 'none';
            } else {
              // (ez marad, ha mégis animálni akarod máskor)
              content.style.overflow = 'hidden';
              content.style.maxHeight = '0';
              requestAnimationFrame(() => {
                content.style.transition = 'max-height 0.3s ease-out';
                content.style.maxHeight = content.scrollHeight + 'px';
              });
              setTimeout(() => {
                content.style.maxHeight = 'none';
              }, 350);
            }

            const arrow = button.querySelector('.arrow');
            if (arrow) arrow.textContent = '▲';
          }
        }
      });
    }, 100);
  } catch (e) {
    console.error('Error loading nav state:', e);
  }
}

// Állapot mentése
function saveNavState() {
    try {
        sessionStorage.setItem(NAV_STATE_KEY, String(isNavOpen));
        
        // Almenük állapotának mentése
        const submenuState = {};
        document.querySelectorAll('.subnav').forEach(navGroup => {
            const category = navGroup.getAttribute('data-category');
            const button = navGroup.querySelector('.nav-item');
            if (button) {
                submenuState[category] = button.classList.contains('active');
            }
        });
        sessionStorage.setItem(SUBMENU_STATE_KEY, JSON.stringify(submenuState));
    } catch (e) {
        console.error('Error saving nav state:', e);
    }
}



 // Keresés funkcionalitás
function filterNavItems(searchText) {
    const allItems = document.querySelectorAll('#mySidenav .nav-item, #mySidenav .subnav-content a');
    searchText = searchText.toLowerCase();
    
    allItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const isVisible = text.includes(searchText);
        
        if (item.classList.contains('nav-item')) {
            // Ha főmenü item
            item.style.display = isVisible ? "flex" : "none";
            const content = item.nextElementSibling;
            if (content && content.classList.contains('subnav-content')) {
                content.style.display = isVisible ? "block" : "none";
            }
        } else {
            // Ha almenü item
            item.style.display = isVisible ? "block" : "none";
            // Ha van találat az almenüben, mutassuk a főmenüt is
            const parentButton = item.closest('.subnav').querySelector('.nav-item');
            if (isVisible && parentButton) {
                parentButton.style.display = "flex";
            }
        }
    });
}

// Navigáció létrehozása
function createNavigation() {
    const navContainer = document.querySelector('#mySidenav > div');
    navContainer.innerHTML = ''; // Töröljük a meglévő tartalmat
    
    // Keresőmező létrehozása
    const searchBox = document.createElement('div');
    searchBox.className = 'search-container';
    searchBox.innerHTML = `
        <input type="text" id="searchNav" placeholder="🔍 Keresés..." />
    `;
    navContainer.appendChild(searchBox);
    
    // Menüpontok létrehozása
    Object.entries(navStructure).forEach(([category, data]) => {
        const navGroup = document.createElement('div');
        navGroup.className = 'subnav';
        navGroup.setAttribute('data-category', category);
        
        const button = document.createElement('button');
        button.className = 'nav-item';
        button.innerHTML = `
            <img src="${data.icon}" alt="" class="nav-icon" />
            ${category}
            <span class="arrow">▼</span>
        `;
        
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
            
            // Active link kezelése
            if (window.location.pathname.includes(item.link)) {
                link.classList.add('active');
                button.classList.add('active');
                // <<< MOD: ha az aktuális oldal miatt nyitott alapból, akkor is animálva nyissa meg (hogy később legyen záró animáció)
                content.style.display = 'block';
                content.style.overflow = 'hidden';
                content.style.maxHeight = '0';
                requestAnimationFrame(() => {
                    content.style.maxHeight = content.scrollHeight + 'px';
                });
                // ha akarjuk, utána maxHeight: none-ra állítjuk
                setTimeout(() => {
                    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                        content.style.maxHeight = 'none';
                    }
                }, 350);
                // >>> MOD end
                button.querySelector('.arrow').textContent = '▲';
            }
            
            content.appendChild(link);
        });
        
        navGroup.appendChild(button);
        navGroup.appendChild(content);
        navContainer.appendChild(navGroup);
        
        // Lenyíló menü kezelése
        button.addEventListener('click', (e) => {
            e.preventDefault();
            button.classList.toggle('active');
            // Use maxHeight to detect expanded state more reliably
            const isExpanded = content.style.display !== 'none' && (content.style.maxHeight !== '0px' && content.style.maxHeight !== '' && content.style.maxHeight !== '0');
            
            if (!isExpanded) {
                // open with animation
                content.style.display = 'block';
                // ensure we start from 0
                content.style.overflow = 'hidden';
                content.style.maxHeight = '0';
                requestAnimationFrame(() => {
                    content.style.transition = 'max-height 0.3s ease-out';
                    content.style.maxHeight = content.scrollHeight + "px";
                });
                button.querySelector('.arrow').textContent = '▲';
                // after expand, clear maxHeight to allow content growth
                setTimeout(() => {
                    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                        content.style.maxHeight = 'none';
                    }
                }, 350);
            } else {
                // close with animation
                // to animate from auto/none, we must set to scrollHeight first, force reflow, then set to 0
                const currentHeight = content.scrollHeight;
                content.style.overflow = 'hidden';
                content.style.maxHeight = currentHeight + 'px';
                // force reflow
                content.getBoundingClientRect();
                requestAnimationFrame(() => {
                    content.style.transition = 'max-height 0.3s ease-out';
                    content.style.maxHeight = '0';
                });
                button.querySelector('.arrow').textContent = '▼';
                setTimeout(() => {
                    // only hide if truly closed
                    if (content.style.maxHeight === '0px' || content.style.maxHeight === '0') {
                        content.style.display = 'none';
                    }
                    // optional: clear inline maxHeight so next open will compute correctly
                    // content.style.maxHeight = '';
                }, 310);
            }
            saveNavState();
        });
    });
    
    // Keresés eseménykezelő
    const searchInput = document.getElementById('searchNav');
    searchInput.addEventListener('input', (e) => {
        filterNavItems(e.target.value);
        saveNavState();
    });
    
    // Állapot betöltése a létrehozás után
    loadNavState();
}

// Oldal betöltésekor inicializáljuk a navigációt
document.addEventListener('DOMContentLoaded', createNavigation);

(function(){
  const CLICK_KEY = '__agazati_nav_target_v2';
  const POS_KEY = '__agazati_nav_pos_v2';
  const RIGHT_PADDING = 0;          // px, ha kell kis margó, ide írd
  const MAX_ATTEMPTS = 40;
  const RETRY_MS = 70;
  const MOBILE_QUERY = '(max-width: 768px)';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function absHref(href) {
    try { return new URL(href, location.href).href; } catch(e){ return href || ''; }
  }
  function normPath(href) {
    try { const u = new URL(href, location.href); return u.pathname.replace(/\/+$/, '') || '/'; }
    catch(e){ return (href || '').replace(/\/+$/, '') || '/'; }
  }
  function lastSegmentFromPath(path) {
    const segs = (path||'').replace(/\/+$/,'').split('/').filter(Boolean);
    return segs.length ? segs[segs.length-1] : '';
  }

  function findNav() {
    return document.querySelector('nav.navbar') || document.querySelector('header nav') || document.querySelector('nav') || null;
  }

  function saveClicked(abs) {
    try { sessionStorage.setItem(CLICK_KEY, String(abs)); }
    catch(e){}
  }
  function getClicked() {
    try { return sessionStorage.getItem(CLICK_KEY); } catch(e){ return null; }
  }
  function clearClicked() {
    try { sessionStorage.removeItem(CLICK_KEY); } catch(e){}
  }

  function saveRawPos(nav, v) {
    try {
      const val = typeof v === 'number' ? Math.round(v) : Math.round(nav.scrollLeft || 0);
      sessionStorage.setItem(POS_KEY, String(val));
    } catch(e){}
  }
  function getRawPos() {
    try { const v = sessionStorage.getItem(POS_KEY); return v === null ? null : Number(v) || 0; } catch(e){ return null; }
  }

  function computeTarget(nav, el) {
    if(!nav || !el) return 0;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.right - navRect.right);
    const target = Math.round(nav.scrollLeft + delta - RIGHT_PADDING);
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    return clamp(target, 0, max);
  }

  function instantScrollNavTo(nav, target) {
    // Ensure NO smooth animation: temporarily force 'scroll-behavior: auto' inline,
    // set scrollLeft directly, then restore previous inline value.
    if (!nav) return;
    const prev = nav.style.scrollBehavior;
    try {
      nav.style.scrollBehavior = 'auto';
      // set directly to reduce flicker
      nav.scrollLeft = target;
    } catch(e) {
      try { nav.scrollLeft = target; } catch(_) {}
    } finally {
      // restore original inline style after a tick (so it won't affect other code)
      requestAnimationFrame(() => {
        // keep whatever inline style was before
        nav.style.scrollBehavior = prev || '';
      });
    }
  }

  // click handler: store absolute href only (no scrolling now)
  document.addEventListener('click', function(ev){
    try {
      const a = ev.target.closest && ev.target.closest('nav.navbar a, .navbar a, nav a');
      if(!a) return;
      if (a.classList && a.classList.contains('sidebargomb')) return;
      const href = a.getAttribute && a.getAttribute('href');
      if(!href) return;
      const abs = absHref(href);
      saveClicked(abs);
      const nav = findNav(); if (nav) saveRawPos(nav);
    } catch(e){}
  }, true);

  function attachSaveDuringScroll(nav) {
    if(!nav) return;
    let raf = null;
    nav.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { saveRawPos(nav); raf = null; });
    }, { passive: true });
    nav.addEventListener('touchend', () => setTimeout(()=> saveRawPos(nav), 20), { passive: true });
    window.addEventListener('beforeunload', () => saveRawPos(nav));
  }

  function findBestMatch(nav, storedAbs) {
    if(!nav) return null;
    const anchors = Array.from(nav.querySelectorAll('a')).filter(a => a.getAttribute('href'));
    const storedPath = normPath(storedAbs);
    const storedSeg = lastSegmentFromPath(storedPath);
    const storedAbsNorm = (storedAbs || '').replace(/\/+$/,'');
    // 1) exact absolute href match
    for(const a of anchors){
      try { if (absHref(a.getAttribute('href')).replace(/\/+$/,'') === storedAbsNorm) return a; } catch(e){}
    }
    // 2) pathname equality
    for(const a of anchors){
      try { if (normPath(a.getAttribute('href')) === storedPath) return a; } catch(e){}
    }
    // 3) last segment match
    if(storedSeg){
      for(const a of anchors){
        try { if (lastSegmentFromPath(normPath(a.getAttribute('href'))) === storedSeg) return a; } catch(e){}
      }
    }
    // 4) match by text (loose)
    const storedText = (storedSeg || '').toLowerCase();
    if(storedText){
      for(const a of anchors){
        try { if ((a.textContent||'').toLowerCase().includes(storedText)) return a; } catch(e){}
      }
    }
    // 5) fallback: any anchor with href containing the stored last segment
    if(storedSeg){
      for(const a of anchors){
        try { if ((a.getAttribute('href')||'').indexOf(storedSeg) !== -1) return a; } catch(e){}
      }
    }
    return null;
  }

  // Restore routine — MOBILE ONLY and INSTANT (no animation)
  function tryRestoreOnLoad() {
    // run only on mobile-sized viewports
    if (!window.matchMedia || !window.matchMedia(MOBILE_QUERY).matches) return;
    const nav = findNav();
    if(!nav) return;
    attachSaveDuringScroll(nav);

    const storedAbs = getClicked();
    if(!storedAbs) {
      // fallback: raw pos restore
      const raw = getRawPos();
      if(raw !== null) {
        let attempts = 0; let stopped = false;
        function attemptRaw() {
          if(stopped) return;
          attempts++;
          const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
          const desired = clamp(Math.round(raw), 0, max);
          // instant scroll (no animation)
          instantScrollNavTo(nav, desired);
          if(Math.abs(nav.scrollLeft - desired) <= 2 || attempts >= MAX_ATTEMPTS) stopped = true;
          else requestAnimationFrame(()=> setTimeout(attemptRaw, RETRY_MS));
        }
        attemptRaw();
      }
      return;
    }

    // We have a stored clicked href -> try to find matching anchor in this nav
    let attempts = 0; let stopped = false;
    const match = { el: null };

    const mo = (function(){
      try {
        const observer = new MutationObserver(() => {
          if(stopped) return;
          attempts = 0;
          requestAnimationFrame(attempt);
        });
        observer.observe(nav, { childList: true, subtree: true, attributes: true });
        return observer;
      } catch(e){ return null; }
    })();

    function attempt(){
      if (stopped) return;
      attempts++;
      if (!match.el) match.el = findBestMatch(nav, storedAbs);
      if (match.el) {
        const desired = computeTarget(nav, match.el);
        // instant set (no smooth)
        instantScrollNavTo(nav, desired);
        // success condition
        if (Math.abs(nav.scrollLeft - desired) <= 2) {
          stop(true);
          return;
        }
      }
      if (attempts >= MAX_ATTEMPTS) {
        stop(false);
        return;
      }
      requestAnimationFrame(()=> setTimeout(attempt, RETRY_MS));
    }

    function stop(success){
      stopped = true;
      try { mo && mo.disconnect(); } catch(e){}
      // clear stored click only on success to avoid repeated attempts indefinitely
      if(success) clearClicked();
      else clearClicked();
    }

    attempt();
  }

  // Hook into load lifecycle — we try to run as early as possible + retries
  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(fn, 8);
    else document.addEventListener('DOMContentLoaded', () => setTimeout(fn, 8));
  }
  onReady(() => {
    tryRestoreOnLoad();
    // extra hooks to increase chance of restoring before visible paint
    window.addEventListener('pageshow', () => tryRestoreOnLoad());
    window.addEventListener('load', () => tryRestoreOnLoad());
  });

  // Expose debug helpers (safe)
  try {
    window.__agazati_nav_debug = {
      saveClicked, getClicked, clearClicked, computeTarget, findNav, getRawPos
    };
  } catch(e){}
})();
