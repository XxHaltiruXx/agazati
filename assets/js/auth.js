// assets/js/auth.js
(function () {
  'use strict';

  // ------- modal helper -------
  window.openAuthModal = function () {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('authModal').setAttribute('aria-hidden', 'false');
  };
  window.closeAuthModal = function () {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authModal').setAttribute('aria-hidden', 'true');
    clearAuthMessages();
  };

  window.switchAuthTab = function (tab) {
    const isSignup = tab === 'signup';
    document.getElementById('tab-login').classList.toggle('active', !isSignup);
    document.getElementById('tab-signup').classList.toggle('active', isSignup);
    document.getElementById('field-fullname').style.display = isSignup ? 'block' : 'none';
    document.getElementById('authSubmit').textContent = isSignup ? 'Regisztráció' : 'Bejelentkezés';
    clearAuthMessages();
  };

  function clearAuthMessages() {
    const err = document.getElementById('authError');
    const info = document.getElementById('authInfo');
    err.style.display = 'none'; err.textContent = '';
    info.style.display = 'none'; info.textContent = '';
  }

  window.switchToMagicLink = function () {
    const emailEl = document.getElementById('email');
    const email = emailEl.value?.trim();
    if (!email) { showError('Adj meg egy emailt a magic linkhez.'); return; }

    if (!window.supabase) { showError('Supabase nincs inicializálva.'); return; }
    clearAuthMessages();
    document.getElementById('authInfo').style.display = 'block';
    document.getElementById('authInfo').textContent = 'Magic link küldése...';

    (async () => {
      const { data, error } = await window.supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
      if (error) {
        showError(error.message || 'Hiba történt a magic link küldése közben.');
      } else {
        document.getElementById('authInfo').textContent = 'Megkaptad a magic linket — ellenőrizd az emailt.';
      }
    })();
  };

  function showError(msg) {
    const err = document.getElementById('authError');
    err.style.display = 'block';
    err.textContent = msg;
  }
  function showInfo(msg) {
    const info = document.getElementById('authInfo');
    info.style.display = 'block';
    info.textContent = msg;
  }

  // ------- core auth -------
  window.handleAuthAction = async function () {
    const isSignup = document.getElementById('tab-signup').classList.contains('active');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const fullname = document.getElementById('fullname').value.trim();

    clearAuthMessages();
    if (!email || !password) { showError('Email és jelszó szükséges.'); return; }
    if (password.length < 8) { showError('A jelszónak legalább 8 karakter hosszúnak kell lennie.'); return; }

    if (!window.supabase) { showError('Supabase nincs inicializálva.'); return; }

    document.getElementById('authSubmit').disabled = true;
    try {
      if (isSignup) {
        // REGISZTRÁCIÓ jelszóval
        const { data, error } = await window.supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullname || null } }
        });

        if (error) {
          // Tipikus hibaüzenetek: már létezik, vagy szerver oldali trigger dobott 500-at
          showError(error.message || 'Hiba történt a regisztráció során.');
          console.error('signup error raw:', error);
        } else {
          showInfo('Sikeres regisztráció! Ellenőrizd az emailed (ha email-verifikációt használsz).');
          // opcionálisan: closeAuthModal();
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
          // pl. location.reload(); vagy redirect
          setTimeout(() => { window.location.reload(); }, 600);
        }
      }
    } catch (err) {
      showError('Ismeretlen hiba történt. Ellenőrizd a konzolt.');
      console.error('auth exception:', err);
    } finally {
      document.getElementById('authSubmit').disabled = false;
    }
  };

  // Inicializáló — alapértelmezett tab
  document.addEventListener('DOMContentLoaded', () => {
    window.switchAuthTab('login');
    // opcionálisan: global gomb a navhoz
    // const profileBtn = document.querySelector('.sidebar-profile');
    // if (profileBtn) profileBtn.addEventListener('click', openAuthModal);
  });
})();
