// assets/js/auth.js
(function () {
  'use strict';

  /**
   * Robust profil kezelő - nem dob hibát session hiányában.
   * Ezt a függvényt a nav.js fogja meghívni (ha elérhető).
   */
  window.addUserProfileToSidebar = function addUserProfileToSidebar() {
    const sidenav = document.getElementById('mySidenav');
    if (!sidenav) return;

    // Töröljük ha már van
    const existing = sidenav.querySelector('.sidebar-profile');
    if (existing) existing.remove();

    const profileWrapper = document.createElement('div');
    profileWrapper.className = 'sidebar-profile';
    profileWrapper.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.className = 'sidebar-profile-img';
    img.alt = 'Profil';
    // alap svg
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'sidebar-profile-name';
    nameDiv.textContent = 'Bejelentkezés';

    profileWrapper.appendChild(img);
    profileWrapper.appendChild(nameDiv);
    sidenav.appendChild(profileWrapper);

    // Ha nincs supabase kliens, fallback viselkedés
    if (typeof window.supabase === 'undefined' || !window.supabase) {
      profileWrapper.addEventListener('click', () => {
        alert('A bejelentkezési funkció jelenleg nem elérhető. Supabase nincs konfigurálva.');
      });
      return;
    }

    // Frissíti a profil UI-t — biztonságosan, előbb lekéri a session-t
    async function updateUserProfile() {
      try {
        const { data: sessionData, error: sessionError } = await window.supabase.auth.getSession();
        if (sessionError) {
          console.warn('getSession hiba:', sessionError);
        }
        const session = sessionData && sessionData.session ? sessionData.session : null;
        const user = session ? session.user : null;

        if (user) {
          img.src = user.user_metadata?.avatar_url || img.src;
          nameDiv.textContent = user.email || user.user_metadata?.full_name || 'Felhasználó';
        } else {
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
          nameDiv.textContent = 'Bejelentkezés';
        }
      } catch (err) {
        console.error('Hiba a profil frissítésében:', err);
      }
    }

    // Kattintás: ha van session -> kijelentkezés, különben email bejelentkezés/regisztráció
    profileWrapper.addEventListener('click', async () => {
      try {
        const { data: sessionData } = await window.supabase.auth.getSession();
        const session = sessionData && sessionData.session ? sessionData.session : null;
        const user = session ? session.user : null;

        if (user) {
          if (confirm('Kijelentkezés?')) {
            const { error } = await window.supabase.auth.signOut();
            if (error) {
              alert('Hiba a kijelentkezésnél: ' + (error.message || error));
            } else {
              location.reload();
            }
          }
          return;
        }

        // nincs user -> regisztráció / bejelentkezés email OTP-vel
        const email = prompt('Add meg az emailed a regisztrációhoz / bejelentkezéshez:');
        if (!email) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert('Kérjük, érvényes email címet adj meg!');
          return;
        }

        const { data, error } = await window.supabase.auth.signInWithOtp({
          email,
          options: {
            // redirect a GitHub Pages oldalra — ha kell, cseréld
            emailRedirectTo: 'https://xxhaltiruxx.github.io/agazati/'
          }
        });

        if (error) {
          alert('Hiba történt: ' + (error.message || error));
        } else {
          alert('Elküldtünk egy bejelentkezési linket a megadott email címre! Kérjük, ellenőrizd a postaládádat.');
        }
      } catch (err) {
        console.error('Profil kattintási hiba:', err);
        alert('Váratlan hiba történt: ' + (err.message || err));
      }
    });

    // Auth state change listener — ne dobjon ha nincs session
    try {
      const { data } = window.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          updateUserProfile();
        } else if (event === 'SIGNED_OUT') {
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNEMwQkNFIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VXNlcjwvdGV4dD4KPC9zdmc+';
          nameDiv.textContent = 'Bejelentkezés';
        }
      });
      // opcionális: tárolhatjuk a subscription-t későbbi leiratkozáshoz
      window._supabaseAuthSubscription = data?.subscription ?? null;
    } catch (err) {
      console.error('Auth state change regisztrálási hiba:', err);
    }

    // Kezdeti feltöltés
    updateUserProfile();
  };
})();
