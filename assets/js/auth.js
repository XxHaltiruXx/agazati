// assets/js/auth.js
// Client-side auth helper for custom server-backed auth (signup/login/refresh/logout/me).
(function () {
  'use strict';

  /* ----------------------
     Konfiguráció / helperek
     ---------------------- */
  function $id(id) { return document.getElementById(id) || null; }

  function safeText(el, txt) {
    if (!el) return;
    el.textContent = txt;
  }

  function showError(msg) {
    const err = $id('authError');
    if (err) { err.style.display = 'block'; err.textContent = msg; }
    else console.warn('authError missing:', msg);
  }

  function showInfo(msg) {
    const info = $id('authInfo');
    if (info) { info.style.display = 'block'; info.textContent = msg; }
    else console.info('authInfo:', msg);
  }

  function clearAuthMessages() {
    const err = $id('authError'); const info = $id('authInfo');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    if (info) { info.style.display = 'none'; info.textContent = ''; }
  }

  async function safeJson(res) {
    const text = await res.text();
    try { return JSON.parse(text || '{}'); } catch (e) { return { raw: text }; }
  }

  /* ----------------------
     Modal / UI kezelők
     ---------------------- */
  function openAuthModal() {
    const modal = $id('authModal');
    if (!modal) {
      console.warn('openAuthModal: authModal nincs a DOM-ban.');
      return;
    }
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    try { document.documentElement.style.overflow = 'hidden'; } catch (e) {}
  }

  function closeAuthModal() {
    const modal = $id('authModal');
    if (!modal) {
      console.warn('closeAuthModal: authModal nincs a DOM-ban.');
      return;
    }
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    clearAuthMessages();
    try { document.documentElement.style.overflow = ''; } catch (e) {}
  }

  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;

  function switchAuthTab(tab) {
    const isSignup = tab === 'signup';
    const tabLogin = $id('tab-login');
    const tabSignup = $id('tab-signup');
    const fieldFullname = $id('field-fullname');
    const authSubmit = $id('authSubmit');

    if (tabLogin) tabLogin.classList.toggle('active', !isSignup);
    if (tabSignup) tabSignup.classList.toggle('active', isSignup);
    if (fieldFullname) fieldFullname.style.display = isSignup ? 'block' : 'none';
    if (authSubmit) authSubmit.textContent = isSignup ? 'Regisztráció' : 'Bejelentkezés';

    clearAuthMessages();
  }
  window.switchAuthTab = switchAuthTab;

  /* ----------------------
     Backend hívások (feltételezések)
     - /api/signup  POST {email,password,fullname}  -> 201/200 + cookies (refresh_token)
     - /api/login   POST {email,password}          -> 200 + cookies
     - /api/refresh POST (cookies included)        -> 200 + rotated cookies
     - /api/logout  POST (cookies included)        -> 200 + cookie expire
     - /api/me      GET  (cookies included)        -> 200 { user: {...} } vagy 401
     ---------------------- */

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include' // fontos: cookie-k küldése/elfogadása
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  }

  async function getJson(url) {
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  }

  /* ----------------------
     Core auth handlers
     ---------------------- */

  // Bejelentkezés / regisztráció gomb eseménykezelő
  async function handleAuthAction() {
    clearAuthMessages();
    const isSignup = $id('tab-signup') && $id('tab-signup').classList.contains('active');

    const emailEl = $id('email');
    const passwordEl = $id('password');
    const fullnameEl = $id('fullname');

    const email = emailEl ? (emailEl.value || '').trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const fullname = fullnameEl ? (fullnameEl.value || '').trim() : '';

    if (!email || (!password && !isSignup)) {
      showError('Adj meg emailt és jelszót.');
      return;
    }
    if (password && password.length < 8) {
      showError('A jelszó legyen legalább 8 karakter.');
      return;
    }

    const endpoint = isSignup ? '/api/signup' : '/api/login';
    const body = isSignup ? { email, password, full_name: fullname } : { email, password };

    const btn = $id('authSubmit');
    if (btn) btn.disabled = true;
    showInfo(isSignup ? 'Regisztrálás...' : 'Bejelentkezés...');

    try {
      const { ok, status, data } = await postJson(endpoint, body);
      if (!ok) {
        // backend küldhet részletes hibát data.error vagy data.message mezőben
        const msg = data?.error || data?.message || `Hiba: ${status}`;
        showError(msg);
        return;
      }

      // siker: backendnek cookie-kat kellett beállítania (HttpOnly refresh_token +/- access_token)
      showInfo(isSignup ? 'Sikeres regisztráció. Ha email verifikáció kell, ellenőrizd a postaládát.' : 'Sikeres bejelentkezés.');
      // opcionálisan zárjuk a modalt pár száz ms múlva
      setTimeout(() => {
        try { closeAuthModal(); } catch (e) {}
        // frissítjük a sidebar profil megjelenését
        quietUserRefresh();
      }, 600);
    } catch (err) {
      console.error('handleAuthAction error', err);
      showError('Hálózati hiba történt.');
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  window.handleAuthAction = handleAuthAction;

  // Refresh: explicit hívás (pl. a kliens úgy dönt, hívja, amikor kell)
  // Visszatér { ok: boolean, data } szerkezetben.
  async function refreshSession() {
    try {
      const { ok, status, data } = await postJson('/api/refresh', {});
      if (!ok) {
        console.warn('refreshSession failed', status, data);
        return { ok: false, status, data };
      }
      // siker: cookie-k frissítve -> frissítsük UI-t
      await quietUserRefresh();
      return { ok: true, data };
    } catch (err) {
      console.error('refreshSession error', err);
      return { ok: false, error: err };
    }
  }
  window.refreshSession = refreshSession;

  // Logout: hívja a /api/logout és eltávolítja a helyi UI-t
  async function customLogout() {
    try {
      const { ok, status, data } = await postJson('/api/logout', {});
      if (!ok) {
        console.warn('Logout failed', status, data);
        // még akkor is tisztítunk UI-t
      }
    } catch (err) {
      console.error('customLogout error', err);
    } finally {
      // UI update: sidebar -> visszaállítjuk a "Bejelentkezés" szöveget
      const p = document.querySelector('#mySidenav .sidebar-profile');
      if (p) {
        const nameDiv = p.querySelector('.sidebar-profile-name');
        const img = p.querySelector('img.sidebar-profile-img');
        if (nameDiv) nameDiv.textContent = 'Bejelentkezés';
        if (img) img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+PHRleHQgeD0iMjAiIHk9IjIwIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+VXNlcjwvdGV4dD48L3N2Zz4=';
      }
      try { closeAuthModal(); } catch (e) {}
      // option: reload page if needed
      // location.reload();
    }
  }
  window.customLogout = customLogout;

  // Lekéri a bejelentkezett user adatait a /api/me végponton (vagy visszatér null-lal)
  async function fetchCurrentUser() {
    try {
      const { ok, status, data } = await getJson('/api/me');
      if (!ok) return null;
      return data && data.user ? data.user : null;
    } catch (err) {
      console.error('fetchCurrentUser error', err);
      return null;
    }
  }

  // Csendes felhasználó-frissítés: nem nyit modal-t, csak frissíti a sidebar UI-t ha van user
  async function quietUserRefresh() {
    try {
      const user = await fetchCurrentUser();
      if (!user) return; // nincs bejelentkezett user
      const p = document.querySelector('#mySidenav .sidebar-profile');
      if (p) {
        const nameDiv = p.querySelector('.sidebar-profile-name');
        const img = p.querySelector('img.sidebar-profile-img');
        if (nameDiv) nameDiv.textContent = user.email || user.full_name || 'Felhasználó';
        if (img && user.avatar_url) img.src = user.avatar_url;
      }
    } catch (e) {
      console.error('quietUserRefresh error', e);
      // nem dobunk tovább, csendben kezeljük
    }
  }
  window.quietUserRefresh = quietUserRefresh;

  /* ----------------------
     Inicializálás / eseményregisztrációk
     ---------------------- */
  function initAuthUI() {
    // Form
    const authForm = $id('authForm');
    if (authForm) {
      authForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        handleAuthAction();
      });
    }

    // Tabok
    const tabLoginBtn = $id('tab-login');
    const tabSignupBtn = $id('tab-signup');
    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchAuthTab('signup'));

    // Magic link button (if present) - this implementation assumes server handles it if used
    const magicBtn = $id('magicLinkBtn');
    if (magicBtn) magicBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      showInfo('Magic link funkció a backendtől függ. Használd a /api/auth/magic végpontot ha implementálva van.');
    });

    // Close modal button
    const closeBtn = $id('authCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', (ev) => { ev.preventDefault(); closeAuthModal(); });

    // ESC bezárás
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        const modal = $id('authModal');
        if (modal && modal.style.display !== 'none') closeAuthModal();
      }
    });

    // click outside modal to close
    const modal = $id('authModal');
    if (modal) {
      modal.addEventListener('click', (ev) => { if (ev.target === modal) closeAuthModal(); });
    }

    // Sidebar profile click hookup (if sidebar profile exists)
    const p = document.querySelector('#mySidenav .sidebar-profile');
    if (p && !p._authHooked) {
      p._authHooked = true;
      p.addEventListener('click', async () => {
        // ha van bejelentkezett user, ajánljuk a kijelentkezést
        const user = await fetchCurrentUser();
        if (user) {
          if (confirm('Kijelentkezel?')) await customLogout();
        } else {
          openAuthModal();
        }
      });
    }
  }

  // inicializáljuk csak akkor, ha van auth UI a DOM-ban (vagy ha a sidebar-profil van)
  document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    // csendes frissítés: ha van user, a sidebar neve frissül
    quietUserRefresh();
  });

})();
