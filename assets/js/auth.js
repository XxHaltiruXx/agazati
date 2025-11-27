// assets/js/auth.js
(function () {
  'use strict';

  function $id(id) { return document.getElementById(id) || null; }

  function clearAuthMessages() {
    const err = $id('authError'); const info = $id('authInfo');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    if (info) { info.style.display = 'none'; info.textContent = ''; }
  }

  function showError(msg) {
    const err = $id('authError');
    if (err) { err.style.display = 'block'; err.textContent = msg; }
    else console.warn('authError elem hiányzik, üzenet:', msg);
  }
  function showInfo(msg) {
    const info = $id('authInfo');
    if (info) { info.style.display = 'block'; info.textContent = msg; }
    else console.info('authInfo elem hiányzik, üzenet:', msg);
  }

  function openAuthModal() {
    const modal = $id('authModal');
    if (!modal) { console.warn('openAuthModal: authModal nincs a DOM-ban.'); return; }
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    try { document.documentElement.style.overflow = 'hidden'; } catch (e) {}
  }
  function closeAuthModal() {
    const modal = $id('authModal');
    if (!modal) { console.warn('closeAuthModal: authModal nincs a DOM-ban.'); return; }
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    clearAuthMessages();
    try { document.documentElement.style.overflow = ''; } catch (e) {}
  }
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;

  // Tab váltás
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

  // Magic link (OTP/email)
  async function switchToMagicLink() {
    const emailEl = $id('email');
    const email = emailEl ? emailEl.value?.trim() : '';
    if (!email) { showError('Adj meg egy emailt a magic linkhez.'); return; }
    if (!window.supabase) { showError('Supabase nincs inicializálva.'); return; }
    clearAuthMessages(); showInfo('Magic link küldése...');

    try {
      const { data, error } = await window.supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href } // vagy a GitHub Pages URL-ed
      });
      if (error) showError(error.message || 'Hiba történt a magic link küldése közben.');
      else showInfo('Megkaptad a magic linket — ellenőrizd az emailt.');
    } catch (err) {
      showError('Hálózati / belső hiba a magic link küldésekor.');
      console.error('switchToMagicLink exception:', err);
    }
  }
  window.switchToMagicLink = switchToMagicLink;

  // Core: regisztráció / bejelentkezés jelszóval
  async function handleAuthAction() {
    const isSignup = $id('tab-signup') && $id('tab-signup').classList.contains('active');
    const emailEl = $id('email'); const passwordEl = $id('password'); const fullnameEl = $id('fullname');
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const fullname = fullnameEl ? fullnameEl.value.trim() : '';

    clearAuthMessages();
    if (!email || (!password && !isSignup)) { showError('Email és jelszó szükséges.'); return; }
    if (password && password.length < 8) { showError('A jelszónak legalább 8 karakter hosszúnak kell lennie.'); return; }
    if (!window.supabase) { showError('Supabase nincs inicializálva.'); return; }

    const authSubmit = $id('authSubmit'); if (authSubmit) authSubmit.disabled = true;

    try {
      if (isSignup) {
        // Regisztráció
        const { data, error } = await window.supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullname || null } }
        });
        if (error) {
          showError(error.message || 'Hiba történt a regisztráció során.');
          console.error('signup error raw:', error);
        } else {
          showInfo('Sikeres regisztráció! Ellenőrizd az emailed (ha van verifikáció).');
        }
      } else {
        // Bejelentkezés jelszóval
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showError(error.message || 'Bejelentkezési hiba.');
          console.error('signin error raw:', error);
        } else {
          showInfo('Sikeres bejelentkezés!');
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

  // Inicializálás és események
  function initAuthUI() {
    const authForm = $id('authForm');
    if (authForm) authForm.addEventListener('submit', (ev) => { ev.preventDefault(); handleAuthAction(); });

    const tabLoginBtn = $id('tab-login'); const tabSignupBtn = $id('tab-signup');
    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchAuthTab('signup'));

    const magicBtn = $id('magicLinkBtn');
    if (magicBtn) magicBtn.addEventListener('click', (ev) => { ev.preventDefault(); switchToMagicLink(); });

    const closeBtn = $id('authCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', (ev) => { ev.preventDefault(); closeAuthModal(); });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        const modal = $id('authModal'); if (modal && modal.style.display !== 'none') closeAuthModal();
      }
    });

    const modal = $id('authModal');
    if (modal) {
      modal.addEventListener('click', (ev) => { if (ev.target === modal) closeAuthModal(); });
    }
  }

  // Ha van supabase, figyeljük az állapotváltozásokat
  async function registerAuthStateListener() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.auth.onAuthStateChange) return;
    try {
      window.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') { try { closeAuthModal(); } catch (e) {} }
        if (event === 'SIGNED_OUT') { /* opcionális UI update */ }
      });
    } catch (e) { console.error('Auth state listener error:', e); }
  }

  // Megnézzük a jelenlegi felhasználót; ha nincs bejelentkezve, megnyitjuk a modal-t automatikusan
  async function openModalIfNotAuthenticatedOnLoad() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.auth.getUser) {
      // nincs supabase -> nyissuk meg a modal (ha szeretnéd)
      openAuthModal();
      return;
    }
    try {
      const { data: { user }, error } = await window.supabase.auth.getUser();
      if (error) {
        console.error('getUser error:', error);
        openAuthModal();
        return;
      }
      if (!user) {
        // nincs bejelentkezve -> nyiss modal-t
        openAuthModal();
      } else {
        // bejelentkezett: opcionálisan frissíthetsz UI-t (pl. sidebar profil)
        console.log('Bejelentkezett:', user.email);
      }
    } catch (e) {
      console.error('openModalIfNotAuthenticatedOnLoad error:', e);
      openAuthModal();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    registerAuthStateListener();
    // ALAP: ha nincs bejelentkezve a user, nyissuk meg a modal-t
    openModalIfNotAuthenticatedOnLoad();
  });

})();
