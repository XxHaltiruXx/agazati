// assets/js/auth.js
(function () {
  'use strict';

  // ========= segédfüggvények =========
  function $id(id) {
    return document.getElementById(id) || null;
  }

  function safeText(el, txt) {
    if (!el) return;
    el.textContent = txt;
  }

  // ========= üzenetek kezelése =========
  function clearAuthMessages() {
    const err = $id('authError');
    const info = $id('authInfo');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    if (info) { info.style.display = 'none'; info.textContent = ''; }
  }

  function showError(msg) {
    const err = $id('authError');
    if (err) {
      err.style.display = 'block';
      err.textContent = msg;
    } else {
      console.warn('authError elem hiányzik, üzenet:', msg);
    }
  }

  function showInfo(msg) {
    const info = $id('authInfo');
    if (info) {
      info.style.display = 'block';
      info.textContent = msg;
    } else {
      console.info('authInfo elem hiányzik, üzenet:', msg);
    }
  }

  // ========= modal helper =========
  function openAuthModal() {
    const modal = $id('authModal');
    if (!modal) {
      console.warn('openAuthModal: authModal nincs a DOM-ban.');
      return;
    }
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    // lehet akadályozni a háttér görgetést
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

  // exportáljuk, hogy más scriptek (pl. nav.js) hívhassák
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;

  // ========= tab váltás (login / signup) =========
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

  // ========= magic link (email) =========
  async function switchToMagicLink() {
    const emailEl = $id('email');
    const email = emailEl ? emailEl.value?.trim() : '';
    if (!email) { showError('Adj meg egy emailt a magic linkhez.'); return; }

    if (!window.supabase) { showError('Supabase nincs inicializálva.'); return; }
    clearAuthMessages();
    showInfo('Magic link küldése...');

    try {
      const { data, error } = await window.supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href }
      });
      if (error) {
        showError(error.message || 'Hiba történt a magic link küldése közben.');
      } else {
        showInfo('Megkaptad a magic linket — ellenőrizd az emailt.');
      }
    } catch (err) {
      showError('Hálózati / belső hiba a magic link küldésekor.');
      console.error('switchToMagicLink exception:', err);
    }
  }
  window.switchToMagicLink = switchToMagicLink;

  // ========= core auth (signup / signin) =========
  async function handleAuthAction() {
    const isSignup = $id('tab-signup') && $id('tab-signup').classList.contains('active');
    const emailEl = $id('email');
    const passwordEl = $id('password');
    const fullnameEl = $id('fullname');

    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const fullname = fullnameEl ? fullnameEl.value.trim() : '';

    clearAuthMessages();
    if (!email || !password) { showError('Email és jelszó szükséges.'); return; }
    if (password.length < 8) { showError('A jelszónak legalább 8 karakter hosszúnak kell lennie.'); return; }

    if (!window.supabase) { showError('Supabase nincs inicializálva.'); return; }

    const authSubmit = $id('authSubmit');
    if (authSubmit) authSubmit.disabled = true;

    try {
      if (isSignup) {
        // REGISZTRÁCIÓ jelszóval
        const { data, error } = await window.supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullname || null } }
        });

        if (error) {
          showError(error.message || 'Hiba történt a regisztráció során.');
          console.error('signup error raw:', error);
        } else {
          showInfo('Sikeres regisztráció! Ellenőrizd az emailed (ha email-verifikációt használsz).');
          // opcionálisan: bezárhatjuk a modalt, ha akarjuk
        }
      } else {
        // BEJELENTKEZÉS
        const { data, error } = await window.supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          showError(error.message || 'Bejelentkezési hiba.');
          console.error('signin error raw:', error);
        } else {
          showInfo('Sikeres bejelentkezés!');
          // pl. frissítsük az oldalt, hogy a felhasználói státusz látszódjon
          setTimeout(() => { window.location.reload(); }, 600);
        }
      }
    } catch (err) {
      showError('Ismeretlen hiba történt. Ellenőrizd a konzolt.');
      console.error('auth exception:', err);
    } finally {
      if (authSubmit) authSubmit.disabled = false;
    }
  }
  window.handleAuthAction = handleAuthAction;

  // ========= inicializálás / eseményregisztrációk =========
  function initAuthUI() {
    // Form submit
    const authForm = $id('authForm');
    if (authForm) {
      authForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        handleAuthAction();
      });
    }

    // Tab gombok
    const tabLoginBtn = $id('tab-login');
    const tabSignupBtn = $id('tab-signup');
    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchAuthTab('signup'));

    // magic link gomb
    const magicBtn = $id('magicLinkBtn');
    if (magicBtn) magicBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      switchToMagicLink();
    });

    // modal close gomb
    const closeBtn = $id('authCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      closeAuthModal();
    });

    // escape lekapcsolás
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        const modal = $id('authModal');
        if (modal && modal.style.display !== 'none') closeAuthModal();
      }
    });

    // kattintás kívülre bezárás
    const modal = $id('authModal');
    if (modal) {
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeAuthModal();
      });
    }
  }

  // Ha van supabase, figyeljük az állapotváltozásokat (pl. magic-link után)
  async function registerAuthStateListener() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.auth.onAuthStateChange) return;
    try {
      // onAuthStateChange visszaad egy subscription objektum; itt csak az eseményeket használjuk
      const { data: sub } = window.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') {
          // Bejelentkezésnél zárjuk a modalt (ha nyitva van)
          try { closeAuthModal(); } catch (e) {}
        }
      });
      // nem szükséges unsub eseménykezelés itt (page lifecycle kezelheti)
    } catch (e) {
      console.error('Auth state listener error:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Csak akkor indítjuk a tab-váltást, ha van az auth UI
    if ($id('tab-login') || $id('tab-signup') || $id('authForm')) {
      // alap tab: login
      switchAuthTab('login');
    } else {
      console.info('Auth UI nincs jelen a DOM-ban; alap beállítás kihagyva.');
    }

    initAuthUI();
    registerAuthStateListener();
  });

})();
