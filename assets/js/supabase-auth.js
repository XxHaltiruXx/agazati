// ====================================
// SUPABASE AUTHENTIKÁCIÓ MODUL
// ====================================
// Teljes auth kezelés Supabase-zel
// Regisztráció, bejelentkezés, admin role kezelés

const SUPABASE_CONFIG = {
  URL: "https://ccpuoqrbmldunshaxpes.supabase.co",
  ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHVvcXJibWxkdW5zaGF4cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE2MDUsImV4cCI6MjA3ODA4NzYwNX0.QpVCmzF96Fp5hdgFyR0VkT9RV6qKiLkA8Yv_LArSk5I",
  // Automatikusan felismeri a környezetet (local/production)
  REDIRECT_URL: (() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    // Ha a pathname tartalmazza az '/agazati/' mappát, akkor használjuk azt
    if (pathname.includes('/agazati/')) {
      return origin + "/agazati/auth-callback.html";
    }
    // Különben csak az origin-t használjuk
    return origin + "/auth-callback.html";
  })()
};

// Supabase client inicializálás
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded!');
      return null;
    }
    // Session persistence beállítása - localStorage-ban tárolja a session-t
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
      auth: {
        persistSession: true, // Session megőrzése localStorage-ban
        autoRefreshToken: true, // Token automatikus frissítése
        detectSessionInUrl: true, // Session felismerése URL-ben (OAuth redirect)
        storage: window.localStorage // Explicit localStorage használata
      }
    });
    // console.log('✅ Supabase client inicializálva session persistence-szel');
  }
  return supabaseClient;
}

// ====================================
// USER STATE KEZELÉS
// ====================================
class SupabaseAuth {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
    this.sb = null;
    this.realtimeChannel = null;
    this.lastKnownPath = '/';
    this.profileLoaded = false; // Flag hogy a profil betöltődött-e
    this.realtimeEnabled = false; // Flag hogy a realtime működik-e
    this.pollingInterval = null; // Polling fallback
    
    // localStorage cache kulcsok
    this.ADMIN_CACHE_KEY = '_agazati_admin_cache';
    this.CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 perc
  }

  async init() {
    console.log('🔍 [Auth Init] 1. Kezdés');
    this.sb = getSupabaseClient();
    if (!this.sb) {
      console.error('❌ [Auth Init] Supabase client nem érhető el!');
      return false;
    }

    // GYORS CACHE ELLENŐRZÉS - azonnal beállítjuk admin jogot ha cache-ben van
    const cached = this.getCachedAdminStatus();
    if (cached) {
      this.isAdmin = cached.isAdmin;
      console.log('⚡ [Auth Init] 2. Admin státusz cache-ből betöltve:', this.isAdmin);
    } else {
      console.log('🔍 [Auth Init] 2. Nincs cache, session ellenőrzés szükséges');
    }

    // Session ellenőrzés
    console.log('🔍 [Auth Init] 3. Session lekérése...');
    const { data: { session } } = await this.sb.auth.getSession();
    
    if (session) {
      console.log('🔍 [Auth Init] 4. Session találva, profil betöltése...', {
        userId: session.user.id,
        email: session.user.email
      });
      await this.loadUserProfile(session.user);
      console.log('✅ [Auth Init] 5. Profil betöltve!', {
        isAdmin: this.isAdmin,
        profileLoaded: this.profileLoaded
      });
    } else {
      console.log('ℹ️ [Auth Init] 4. Nincs session (nincs bejelentkezve)');
      // Ha nincs session, jelöljük hogy a "profil betöltve" (üres profil)
      this.profileLoaded = true;
      this.clearAdminCache(); // Töröljük a cache-t ha nincs session
    }

    // Utolsó nem-admin oldal követése
    this.trackLastNonAdminPage();

    // POLLING-ONLY MODE
    // Realtime "mismatch" hiba miatt kikapcsolva
    // Polling 10 másodpercenként ellenőrzi az admin státuszt - tökéletesen működik!
    // Ha szeretnéd újra próbálni a realtime-ot: uncommenteld az alábbi sort
    // this.setupRealtimeSubscription();
    
    // Polling indítása azonnal
    const currentUserId = this.getUserId();
    if (currentUserId) {
      this.startPolling();
    }

    // Auth state változás figyelés
    this.sb.auth.onAuthStateChange(async (event, session) => {
      // console.log('🔄 Auth state change:', event);
      if (event === 'SIGNED_IN' && session) {
        await this.loadUserProfile(session.user);
        
        // Várunk egy kicsit hogy a profil betöltődjön
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Frissítsük a navigációt amikor bejelentkezünk
        if (window.rebuildNav && typeof window.rebuildNav === 'function') {
          window.rebuildNav();
        }
        // Küldjünk eseményt a login state változásról
        window.dispatchEvent(new CustomEvent('loginStateChanged', { 
          detail: { loggedIn: true, isAdmin: this.isAdmin } 
        }));
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.isAdmin = false;
        this.profileLoaded = false;
        this.clearAdminCache(); // Töröljük a cache-t kijelentkezéskor
        // Frissítsük a navigációt amikor kijelentkezünk
        if (window.rebuildNav && typeof window.rebuildNav === 'function') {
          window.rebuildNav();
        }
        // Küldjünk eseményt a logout-ról
        window.dispatchEvent(new CustomEvent('loginStateChanged', { 
          detail: { loggedIn: false, isAdmin: false } 
        }));
      } else if (event === 'TOKEN_REFRESHED') {
        // console.log('🔄 Token frissítve');
      } else if (event === 'USER_UPDATED' && session) {
        await this.loadUserProfile(session.user);
      } else if (event === 'INITIAL_SESSION' && session) {
        // Kezdeti session betöltése - már megtörtént az init()-ben
        // console.log('✅ Kezdeti session betöltve');
        
        // Frissítsük a navigációt a kezdeti session után is
        await new Promise(resolve => setTimeout(resolve, 200));
        if (window.rebuildNav && typeof window.rebuildNav === 'function') {
          window.rebuildNav();
        }
      }
    });

    return true;
  }

  // ===== ADMIN CACHE KEZELÉS =====
  
  // Admin státusz gyors ellenőrzése cache-ből (sync, azonnal elérhető)
  getCachedAdminStatus() {
    try {
      const cached = localStorage.getItem(this.ADMIN_CACHE_KEY);
      if (!cached) {
        console.log('🔍 [Cache] Nincs cache');
        return null;
      }
      
      const { isAdmin, userId, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const age = now - timestamp;
      
      console.log('🔍 [Cache] Cache találva:', {
        isAdmin,
        userId,
        ageMs: age,
        expiryMs: this.CACHE_EXPIRY_MS,
        expired: age > this.CACHE_EXPIRY_MS
      });
      
      // Ellenőrizzük hogy nem járt-e le
      if (age > this.CACHE_EXPIRY_MS) {
        console.log('⚠️ [Cache] Cache lejárt, törlés');
        localStorage.removeItem(this.ADMIN_CACHE_KEY);
        return null;
      }
      
      // Ellenőrizzük hogy ugyanaz a felhasználó-e
      const currentUserId = this.getUserId();
      if (currentUserId && currentUserId !== userId) {
        console.log('⚠️ [Cache] Másik felhasználó cache-je, törlés');
        localStorage.removeItem(this.ADMIN_CACHE_KEY);
        return null;
      }
      
      console.log('✅ [Cache] Cache érvényes, visszaadás');
      return { isAdmin, userId };
    } catch (err) {
      console.warn('⚠️ [Cache] Admin cache olvasási hiba:', err);
      return null;
    }
  }
  
  // Admin státusz mentése cache-be
  setCachedAdminStatus(isAdmin, userId) {
    try {
      const data = {
        isAdmin: isAdmin === true,
        userId: userId,
        timestamp: Date.now()
      };
      localStorage.setItem(this.ADMIN_CACHE_KEY, JSON.stringify(data));
      console.log('💾 [Cache] Admin cache írva:', data);
    } catch (err) {
      console.warn('⚠️ [Cache] Admin cache írási hiba:', err);
    }
  }
  
  // Cache törlése (pl. kijelentkezéskor)
  clearAdminCache() {
    try {
      localStorage.removeItem(this.ADMIN_CACHE_KEY);
      console.log('🗑️ [Cache] Admin cache törölve');
    } catch (err) {
      console.warn('⚠️ [Cache] Admin cache törlési hiba:', err);
    }
  }

  async loadUserProfile(user) {
    this.currentUser = user;
    
    console.log('� [LoadProfile] 1. Profil betöltése kezdődik:', user.email);
    
    // MÁSODLAGOS fallback: Ellenőrizzük a user metadata-t
    const metadataAdmin = user.user_metadata?.is_admin === true;
    console.log('🔍 [LoadProfile] 2. Metadata admin státusz:', metadataAdmin);
    
    // ELSŐDLEGES: Próbáljuk lekérdezni a user_roles táblából - EZ A FŐ FORRÁS!
    let databaseAdmin = false;
    let hadDatabaseEntry = false;
    
    try {
      console.log('🔍 [LoadProfile] 3. Database lekérdezés user_roles...');
      const { data, error } = await this.sb
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 [LoadProfile] 4. User roles query result:', { data, error });

      if (data && !error) {
        // VAN database bejegyzés - EZ az IGAZ forrás!
        databaseAdmin = data.is_admin === true;
        hadDatabaseEntry = true;
        console.log('✅ [LoadProfile] 5. Admin status from DATABASE:', databaseAdmin);
      } else if (!data && !error) {
        // Nincs még database bejegyzés - hozzuk létre
        console.log('ℹ️ [LoadProfile] 5. Nincs user_roles bejegyzés, létrehozás...');
        await this.createUserRoleEntry(user.id, metadataAdmin);
        databaseAdmin = metadataAdmin;
        hadDatabaseEntry = true;
      } else if (error) {
        console.warn('⚠️ [LoadProfile] 5. User_roles tábla lekérdezési hiba:', error.message);
        hadDatabaseEntry = false;
      }
    } catch (err) {
      console.warn('⚠️ [LoadProfile] 5. User_roles tábla nem elérhető:', err.message);
      hadDatabaseEntry = false;
    }
    
    // Admin jog beállítása:
    // Ha van DATABASE bejegyzés -> azt használjuk (autoritás)
    // Ha nincs DATABASE bejegyzés -> metadata (fallback)
    const newAdminStatus = hadDatabaseEntry ? databaseAdmin : metadataAdmin;
    
    console.log('� [LoadProfile] 6. Admin státusz meghatározása:', {
      user: user.email,
      newAdminStatus: newAdminStatus,
      source: hadDatabaseEntry ? 'DATABASE' : 'METADATA',
      databaseAdmin: databaseAdmin,
      metadataAdmin: metadataAdmin
    });
    
    // Állítsuk be az admin státuszt
    this.isAdmin = newAdminStatus;
    
    // CACHE FRISSÍTÉS - mentjük a lokális cache-be
    this.setCachedAdminStatus(newAdminStatus, user.id);
    console.log('💾 [LoadProfile] 7. Cache frissítve:', { isAdmin: newAdminStatus, userId: user.id });
    
    // CSAK akkor hozzunk létre database bejegyzést ha egyáltalán nincs
    // NE írjuk felül a database-t a metadata alapján!
    if (!hadDatabaseEntry) {
      console.log('🔄 [LoadProfile] 8. Database bejegyzés létrehozása...');
      await this.createUserRoleEntry(user.id, metadataAdmin);
    }
    
    // Jelöljük hogy a profil betöltődött
    this.profileLoaded = true;
    console.log('✅ [LoadProfile] 9. Profil betöltés KÉSZ!', {
      isAdmin: this.isAdmin,
      profileLoaded: this.profileLoaded
    });
  }

  setupRealtimeSubscription() {
    if (!this.sb || this.realtimeChannel) return;
    
    // Csak akkor indítsuk el ha be vagyunk jelentkezve
    const currentUserId = this.getUserId();
    if (!currentUserId) {
      console.log('⏭️ Realtime subscription kihagyva - nincs bejelentkezett felhasználó');
      return;
    }

    console.log('🔔 Realtime subscription beállítása user_id:', currentUserId);

    // Realtime channel létrehozása
    // FILTER ELTÁVOLÍTVA - binding mismatch miatt
    // A handleUserRoleChange majd szűr client-oldalon
    this.realtimeChannel = this.sb
      .channel('user_roles_changes_v4')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles'
          // filter eltávolítva - minden UPDATE event érkezik
        },
        async (payload) => {
          console.log('🔔 Realtime UPDATE event:', payload);
          this.realtimeEnabled = true;
          
          // Client-side szűrés: csak saját user_id változásokat dolgozzuk fel
          if (payload.new && payload.new.user_id === currentUserId) {
            await this.handleUserRoleChange(payload);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription aktív!');
          this.realtimeEnabled = true;
          // Töröljük a polling-ot ha működik a realtime
          if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('🔄 Polling leállítva - Realtime aktív');
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription hiba:', err);
          console.error('💡 Ellenőrizd: REALTIME-FIX-COMPLETE.sql lefutott-e a Supabase Dashboard-on?');
          this.realtimeEnabled = false;
          // Fallback: Polling indítása
          this.startPolling();
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Realtime subscription timeout');
          this.realtimeEnabled = false;
          // Fallback: Polling indítása
          this.startPolling();
        } else {
          console.log('🔔 Realtime status:', status);
        }
      });
      
    // Várunk 5 másodpercet, ha nem aktiválódik a realtime, indítunk polling-ot
    setTimeout(() => {
      if (!this.realtimeEnabled) {
        console.warn('⚠️ Realtime nem aktiválódott 5 másodperc alatt, polling indítása...');
        this.startPolling();
      }
    }, 5000);
  }
  
  startPolling() {
    if (this.pollingInterval) return; // Már fut
    
    console.log('🔄 Polling indítása - admin státusz ellenőrzése 3 másodpercenként');
    
    let lastAdminStatus = this.isAdmin;
    
    this.pollingInterval = setInterval(async () => {
      const currentUserId = this.getUserId();
      if (!currentUserId) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
        return;
      }
      
      try {
        // Lekérdezzük az aktuális admin státuszt
        const { data, error } = await this.sb
          .from('user_roles')
          .select('is_admin')
          .eq('user_id', currentUserId)
          .single();
        
        if (data && !error) {
          const currentAdminStatus = data.is_admin === true;
          
          // Ha változott
          if (lastAdminStatus !== currentAdminStatus) {
            console.log(`🔄 Admin státusz változás polling-ból: ${lastAdminStatus} -> ${currentAdminStatus}`);
            
            // Frissítjük
            this.isAdmin = currentAdminStatus;
            lastAdminStatus = currentAdminStatus;
            
            // CACHE FRISSÍTÉS
            this.setCachedAdminStatus(currentAdminStatus, currentUserId);
            
            // Értesítés
            if (currentAdminStatus) {
              this.showAdminGrantedNotification();
            } else {
              this.showAdminRevokedNotification();
            }
            
            // UI frissítés
            window.dispatchEvent(new CustomEvent('loginStateChanged', { 
              detail: { loggedIn: true, isAdmin: this.isAdmin } 
            }));
            
            if (window.rebuildNav && typeof window.rebuildNav === 'function') {
              window.rebuildNav();
            }
            
            // Átirányítás ha kell
            if (!currentAdminStatus && this.isOnAdminPage()) {
              setTimeout(() => {
                const baseUrl = this.getBaseUrl();
                window.location.href = baseUrl;
              }, 2000);
            }
          }
        }
      } catch (err) {
        console.error('❌ Polling hiba:', err);
      }
    }, 3000); // 3 másodpercenként - szinte real-time
  }

  async handleUserRoleChange(payload) {
    const { eventType, new: newData } = payload;

    console.log('🔔 handleUserRoleChange:', { eventType, newData });

    // Csak akkor foglalkozunk vele, ha a saját user_id-nk érintett
    const currentUserId = this.getUserId();
    if (!currentUserId) return;

    const changedUserId = newData?.user_id;
    
    if (changedUserId !== currentUserId) {
      // Más felhasználó változott - csak frissítjük a nézetet ha admin oldalon vagyunk
      if (window.location.pathname.includes('secret/admin')) {
        console.log('👥 Más felhasználó admin státusza változott, frissítés...');
        if (window.loadUsers && typeof window.loadUsers === 'function') {
          await window.loadUsers();
        }
      }
      
      // NEM TÉRUNK VISSZA - küldjünk értesítést ha mi vagyunk az admin
      if (this.isAdmin) {
        const isNowAdmin = newData?.is_admin === true;
        if (isNowAdmin) {
          this.showNotification(
            '🎉 Admin jog hozzárendelve',
            'Sikeresen admin jogot adtál egy felhasználónak.',
            'success'
          );
        } else {
          this.showNotification(
            '⚠️ Admin jog elvonva',
            'Sikeresen elvettted az admin jogot egy felhasználótól.',
            'warning'
          );
        }
      }
      return;
    }

    // SAJÁT admin státuszunk változott!
    console.log('🔥 SAJÁT admin státusz változás detektálva!');
    
    // Lekérdezzük a korábbi állapotot és az újat
    const wasAdmin = this.isAdmin; // Jelenlegi állapot (régi)
    const isNowAdmin = newData?.is_admin === true; // Új állapot
    
    console.log(`🔄 Státusz változás: ${wasAdmin} -> ${isNowAdmin}`);

    // Csak akkor csináljunk valamit ha TÉNYLEG változott
    if (wasAdmin === isNowAdmin) {
      console.log('✅ Nincs változás, kihagyva');
      return;
    }

    // Frissítsük az isAdmin értéket
    this.isAdmin = isNowAdmin;
    console.log(`✅ Új admin státusz beállítva: ${this.isAdmin}`);

    // Értesítés megjelenítése
    if (isNowAdmin) {
      this.showAdminGrantedNotification();
    } else {
      this.showAdminRevokedNotification();
    }

    // UI frissítése - küldjünk CustomEvent-et
    console.log('📡 loginStateChanged event kibocsajtása...');
    window.dispatchEvent(new CustomEvent('loginStateChanged', { 
      detail: { loggedIn: true, isAdmin: this.isAdmin } 
    }));
    
    // Navbar frissítése
    if (window.rebuildNav && typeof window.rebuildNav === 'function') {
      window.rebuildNav();
    }

    // Ha elvették az admin jogot és admin oldalon vagyunk, AZONNAL irányítsuk át
    if (!isNowAdmin && this.isOnAdminPage()) {
      console.warn('⚠️ Admin jog elvesztve admin oldalon - átirányítás...');
      // Rövid késleltetés csak a notification megjelenítéséhez
      setTimeout(() => {
        const baseUrl = this.getBaseUrl();
        const lastPath = this.lastKnownPath || baseUrl;
        window.location.href = lastPath.includes('secret/') ? baseUrl : lastPath;
      }, 2000);
    } else if (isNowAdmin) {
      // Ha admin jogot kaptunk, frissítsük az oldalt 3 másodperc múlva
      console.log('🎉 Admin jog megkapva - oldal frissítése 3 mp múlva');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  showAdminGrantedNotification() {
    this.showNotification(
      '🎉 Admin Jogosultság Megkapva!',
      'Mostantól hozzáférsz az admin funkciókhoz. Az oldal hamarosan frissül.',
      'success'
    );
  }

  showAdminRevokedNotification() {
    this.showNotification(
      '⚠️ Admin Jogosultság Elvéve!',
      'Az admin jogosultságod el lett véve. Az admin oldalak nem lesznek elérhetőek.',
      'warning'
    );
  }

  showNotification(title, message, type = 'info') {
    // Távolítsuk el az összes korábbi notification-t
    const oldContainer = document.getElementById('authNotificationContainer');
    if (oldContainer) {
      oldContainer.remove();
    }
    
    // Új container létrehozása
    const container = document.createElement('div');
    container.id = 'authNotificationContainer';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 100000;
      max-width: 420px;
    `;
    document.body.appendChild(container);

    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#1a5c36' : type === 'warning' ? '#5c3a1a' : '#1a3a5c';
    const borderColor = type === 'success' ? '#2ecc71' : type === 'warning' ? '#e74c3c' : '#3498db';
    
    notification.style.cssText = `
      background: ${bgColor};
      border: 2px solid ${borderColor};
      color: #ffffff;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      animation: slideInBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 700; font-size: 18px; margin-bottom: 10px; color: ${borderColor};">${title}</div>
      <div style="font-size: 15px; line-height: 1.5; color: #e8e8e8;">${message}</div>
    `;

    container.appendChild(notification);

    // Animáció CSS hozzáadása (csak egyszer)
    if (!document.getElementById('authNotificationStyles')) {
      const style = document.createElement('style');
      style.id = 'authNotificationStyles';
      style.textContent = `
        @keyframes slideInBounce {
          from { transform: translateX(500px) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes fadeOutSlide {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(500px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // 7 másodperc után eltűnik
    setTimeout(() => {
      notification.style.animation = 'fadeOutSlide 0.4s ease-out';
      setTimeout(() => {
        container.remove();
      }, 400);
    }, 7000);
  }

  isOnAdminPage() {
    const path = window.location.pathname;
    return path.includes('secret/');
  }
  
  getBaseUrl() {
    // Ellenőrizzük az origin-t és a pathname-t is
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // Ha GitHub Pages vagy a pathname tartalmazza az agazati-t
    if (origin.includes('github.io') || pathname.includes('/agazati/')) {
      return origin.includes('github.io') ? origin + '/agazati/' : '/agazati/';
    }
    
    // Local vagy más host - csak a root
    return '/';
  }

  refreshUI() {
    // Frissítjük a navigációt
    if (window.rebuildNav && typeof window.rebuildNav === 'function') {
      window.rebuildNav();
    }
    
    // Event dispatch a státusz változásról
    window.dispatchEvent(new CustomEvent('loginStateChanged', { 
      detail: { loggedIn: this.isAuthenticated(), isAdmin: this.isAdmin } 
    }));
  }

  trackLastNonAdminPage() {
    const path = window.location.pathname;
    if (!path.includes('secret/')) {
      this.lastKnownPath = path;
    }
  }

  async createUserRoleEntry(userId, isAdmin = false) {
    try {
      // console.log('📝 User role bejegyzés létrehozása/frissítése...');
      const { error } = await this.sb
        .from('user_roles')
        .upsert({
          user_id: userId,
          is_admin: isAdmin,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id', // Ha már létezik, frissítse
          ignoreDuplicates: false
        });
      
      if (error) {
        // console.warn('⚠️ User_roles bejegyzés létrehozása sikertelen:', error.message);
      } else {
        // console.log('✅ User role bejegyzés létrehozva/frissítve: is_admin=' + isAdmin);
      }
    } catch (err) {
      // console.warn('⚠️ Exception creating user_roles entry:', err.message);
    }
  }

  // ====================================
  // AUTH MŰVELETEK
  // ====================================
  
  async signUpWithEmail(email, password, metadata = {}) {
    const { data, error } = await this.sb.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: SUPABASE_CONFIG.REDIRECT_URL,
        // Email confirmation beállítások
        shouldCreateUser: true
      }
    });

    if (error) throw error;
    
    // Ha sikeres a regisztráció és van user ID, hozzuk létre az alap user_role bejegyzést
    if (data.user && data.user.id) {
      // Alapértelmezett is_admin = false
      await this.createUserRoleEntry(data.user.id, false);
      // console.log('✅ User role bejegyzés létrehozva: is_admin=false');
    }
    
    // Log: segít debuggolni az email küldést
    // console.log('Sign up response:', {
      // user: data.user?.email,
      // session: data.session ? 'Session created' : 'No session (email confirmation required)',
      // confirmationSentAt: data.user?.confirmation_sent_at
    // });
    
    return data;
  }

  async signInWithEmail(email, password) {
    const { data, error } = await this.sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    await this.loadUserProfile(data.user);
    return data;
  }

  async signInWithGoogle() {
    const { data, error } = await this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: SUPABASE_CONFIG.REDIRECT_URL
      }
    });

    if (error) throw error;
    return data;
  }

  async signInWithGithub() {
    const { data, error } = await this.sb.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: SUPABASE_CONFIG.REDIRECT_URL
      }
    });

    if (error) throw error;
    return data;
  }

  async signInWithDiscord() {
    const { data, error } = await this.sb.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: SUPABASE_CONFIG.REDIRECT_URL
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    try {
      // Próbáljuk meg a normál kijelentkezést
      const { error } = await this.sb.auth.signOut();
      
      // Ha a session már lejárt vagy nincs meg, az nem baj
      if (error && error.message !== 'Auth session missing!') {
        // console.warn('⚠️ Kijelentkezési figyelmeztetés:', error.message);
      }
    } catch (err) {
      // Ha bármi hiba történik, egyszerűen tisztítsuk meg a local storage-t
      // console.warn('⚠️ Kijelentkezési hiba - local storage tisztítása:', err.message);
    }
    
    // Mindenképp törljük a local state-et
    this.currentUser = null;
    this.isAdmin = false;
    this.profileLoaded = false;
    
    // Állítsuk le a polling-ot és realtime-ot
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🔄 Polling leállítva - kijelentkezés');
    }
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
      console.log('🔔 Realtime leállítva - kijelentkezés');
    }
    this.realtimeEnabled = false;
    
    // Tisztítsuk meg a local storage-t manuálisan is
    try {
      localStorage.removeItem('supabase.auth.token');
      // A Supabase storage kulcsok
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      // console.log('✅ Local storage megtisztítva');
    } catch (e) {
      // console.warn('⚠️ Local storage tisztítási hiba:', e);
    }
    
    return true;
  }

  async resetPassword(email) {
    try {
      // console.log('🔄 Jelszó visszaállítás indítása:', email);
      // console.log('📧 Redirect URL:', SUPABASE_CONFIG.REDIRECT_URL);
      
      const { data, error } = await this.sb.auth.resetPasswordForEmail(email, {
        redirectTo: SUPABASE_CONFIG.REDIRECT_URL
      });

      if (error) {
        console.error('❌ Jelszó visszaállítási hiba:', error);
        throw error;
      }
      
      // console.log('✅ Jelszó visszaállító email elküldve:', email);
      // console.log('📋 Response data:', data);
      
      return data;
    } catch (error) {
      console.error('❌ resetPassword error:', error);
      throw error;
    }
  }

  // ====================================
  // ADMIN MŰVELETEK
  // ====================================
  
  async setUserAdmin(userId, isAdmin) {
    if (!this.isAdmin) {
      throw new Error('Unauthorized: Only admins can set admin roles');
    }

    try {
      console.log(`🔄 Admin jog változtatás: ${userId} -> ${isAdmin}`);
      
      // 1. Először próbáljuk meg UPDATE-elni
      const { data: updateData, error: updateError } = await this.sb
        .from('user_roles')
        .update({
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('*');

      // Ha nem létezett a sor, akkor INSERT-eljük
      if (!updateData || updateData.length === 0 || updateError?.code === 'PGRST116') {
        console.log('💾 Új user_roles sor létrehozása...');
        const { data: insertData, error: insertError } = await this.sb
          .from('user_roles')
          .insert({
            user_id: userId,
            is_admin: isAdmin,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*');
        
        if (insertError) throw insertError;
        if (!insertData || insertData.length === 0) {
          throw new Error('Insert sikertelen - nincs visszaadott adat');
        }
      } else if (updateError) {
        throw updateError;
      }

      // 2. FONTOS: Frissítjük a user metadata-ját is!
      // Ez egy Supabase Edge Function vagy RPC hívás kéne legyen
      // De mivel kliens oldalon vagyunk, nem férünk hozzá az admin API-hoz
      // Ehelyett egy Database Function-t fogunk használni
      
      const { error: funcError } = await this.sb.rpc('set_user_admin_metadata', {
        target_user_id: userId,
        admin_status: isAdmin
      });

      if (funcError) {
        // console.warn('⚠️ Nem sikerült frissíteni a metadata-t:', funcError.message);
        // console.warn('💡 A user_roles tábla frissült, de a metadata nem. Futtasd le a set-admin-metadata-function.sql scriptet!');
      }

      console.log(`✅ Database frissítve: ${userId} -> ${isAdmin}`);
      
      // Várunk egy kicsit hogy a database propagálja a változást
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // EXPLICIT ELLENŐRZÉS: Lekérdezzük újra hogy tényleg frissült-e
      const { data: verifyData, error: verifyError } = await this.sb
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();
      
      if (verifyError || !verifyData) {
        console.error('❌ Verifikáció sikertelen:', verifyError);
        throw new Error('A változtatás nem ment át - próbáld újra!');
      }
      
      if (verifyData.is_admin !== isAdmin) {
        console.error('❌ Verifikáció: az érték nem egyezik!', verifyData.is_admin, '!==', isAdmin);
        throw new Error('A változtatás nem ment át - próbáld újra!');
      }
      
      console.log('✅ Verifikáció sikeres: az admin jog tényleg megváltozott!');
      
      // Ha saját magunkat frissítettük, azonnal töltsük újra a profilt
      if (userId === this.getUserId()) {
        await this.loadUserProfile(this.currentUser);
        console.log('✅ Saját profil frissítve');
      }
      
      return { success: true, verified: true };
      
    } catch (error) {
      console.error('❌ setUserAdmin error:', error);
      throw error;
    }
  }

  async getAllUsers() {
    if (!this.isAdmin) {
      throw new Error('Unauthorized: Only admins can view all users');
    }

    const { data, error } = await this.sb
      .from('user_roles')
      .select('*');

    if (error) throw error;
    return data;
  }

  // ====================================
  // GETTER FUNKCIÓK
  // ====================================
  
  isAuthenticated() {
    return this.currentUser !== null;
  }

  isAdminUser() {
    return this.isAuthenticated() && this.isAdmin;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getUserEmail() {
    return this.currentUser?.email || null;
  }

  getUserId() {
    return this.currentUser?.id || null;
  }
}

// ====================================
// AUTH MODAL UI KEZELÉS
// ====================================
class SupabaseAuthModal {
  constructor(authInstance) {
    this.auth = authInstance;
    this.modal = null;
    this.modalBox = null;
    this.onSuccess = null;
    this.onCancel = null;
    
    // UI elements
    this.tabButtons = null;
    this.loginForm = null;
    this.registerForm = null;
    this.forgotPasswordForm = null;
    
    // Login form
    this.loginEmail = null;
    this.loginPassword = null;
    this.loginBtn = null;
    this.loginError = null;
    this.loginSuccess = null;
    
    // Register form
    this.registerEmail = null;
    this.registerPassword = null;
    this.registerPasswordConfirm = null;
    this.registerBtn = null;
    this.registerError = null;
    this.registerSuccess = null;
    
    // Forgot password form
    this.forgotEmail = null;
    this.forgotBtn = null;
    this.forgotError = null;
    this.forgotSuccess = null;
    
    this.cancelBtn = null;
    this.showLoginTab = null;
    this.showRegisterTab = null;
    this.showForgotTab = null;
  }

  init(options = {}) {
    this.modal = document.getElementById("authModal");
    this.modalBox = document.getElementById("authBox");
    
    if (!this.modal) {
      console.error("Auth modal not found!");
      return false;
    }

    // Callbacks
    this.onSuccess = options.onSuccess || (() => {});
    this.onCancel = options.onCancel || (() => {});

    // Tab buttons
    this.tabButtons = {
      login: document.getElementById("loginTab"),
      register: document.getElementById("registerTab")
    };

    // Forms
    this.loginForm = document.getElementById("loginForm");
    this.registerForm = document.getElementById("registerForm");
    this.forgotPasswordForm = document.getElementById("forgotPasswordForm");

    // Login form elements
    this.loginEmail = document.getElementById("loginEmail");
    this.loginPassword = document.getElementById("loginPassword");
    this.loginBtn = document.getElementById("loginBtn");
    this.loginError = document.getElementById("loginError");
    this.loginSuccess = document.getElementById("loginSuccess");
    this.toggleLoginPassword = document.getElementById("toggleLoginPassword");
    this.showForgotTab = document.getElementById("showForgotPassword");

    // Register form elements
    this.registerEmail = document.getElementById("registerEmail");
    this.registerPassword = document.getElementById("registerPassword");
    this.registerPasswordConfirm = document.getElementById("registerPasswordConfirm");
    this.registerBtn = document.getElementById("registerBtn");
    this.registerError = document.getElementById("registerError");
    this.registerSuccess = document.getElementById("registerSuccess");
    this.toggleRegisterPassword = document.getElementById("toggleRegisterPassword");
    this.toggleRegisterPasswordConfirm = document.getElementById("toggleRegisterPasswordConfirm");
    this.showLoginTab = document.getElementById("showLoginFromRegister");

    // Forgot password form elements
    this.forgotEmail = document.getElementById("forgotEmail");
    this.forgotBtn = document.getElementById("forgotBtn");
    this.forgotError = document.getElementById("forgotError");
    this.forgotSuccess = document.getElementById("forgotSuccess");
    this.backToLoginBtn = document.getElementById("backToLogin");

    this.cancelBtn = document.getElementById("authCancel");

    // Social login buttons
    this.googleBtn = document.getElementById("googleBtn");
    this.githubBtn = document.getElementById("githubBtn");
    this.discordBtn = document.getElementById("discordBtn");
    
    // Social registration buttons
    this.googleRegisterBtn = document.getElementById("googleRegisterBtn");
    this.githubRegisterBtn = document.getElementById("githubRegisterBtn");
    this.discordRegisterBtn = document.getElementById("discordRegisterBtn");

    // Event listeners
    this.setupEventListeners();

    return true;
  }

  setupEventListeners() {
    // Tab switching
    this.tabButtons.login?.addEventListener("click", () => this.showTab("login"));
    this.tabButtons.register?.addEventListener("click", () => this.showTab("register"));
    
    // Login form
    this.loginBtn?.addEventListener("click", () => this.handleLogin());
    this.loginEmail?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleLogin();
    });
    this.loginPassword?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleLogin();
    });

    // Register form
    this.registerBtn?.addEventListener("click", () => this.handleRegister());
    this.registerPasswordConfirm?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleRegister();
    });

    // Forgot password
    this.showForgotTab?.addEventListener("click", () => this.showTab("forgot"));
    this.backToLoginBtn?.addEventListener("click", () => this.showTab("login"));
    this.forgotBtn?.addEventListener("click", () => this.handleForgotPassword());
    this.forgotEmail?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleForgotPassword();
    });

    // Social logins
    this.googleBtn?.addEventListener("click", () => this.handleGoogleLogin());
    this.githubBtn?.addEventListener("click", () => this.handleGithubLogin());
    this.discordBtn?.addEventListener("click", () => this.handleDiscordLogin());
    
    // Social registration (uses same OAuth methods)
    this.googleRegisterBtn?.addEventListener("click", () => this.handleGoogleLogin());
    this.githubRegisterBtn?.addEventListener("click", () => this.handleGithubLogin());
    this.discordRegisterBtn?.addEventListener("click", () => this.handleDiscordLogin());

    // Show login from register
    this.showLoginTab?.addEventListener("click", () => this.showTab("login"));

    // Password toggle
    this.toggleLoginPassword?.addEventListener("click", () => {
      this.togglePasswordVisibility(this.loginPassword, this.toggleLoginPassword);
    });
    this.toggleRegisterPassword?.addEventListener("click", () => {
      this.togglePasswordVisibility(this.registerPassword, this.toggleRegisterPassword);
    });
    this.toggleRegisterPasswordConfirm?.addEventListener("click", () => {
      this.togglePasswordVisibility(this.registerPasswordConfirm, this.toggleRegisterPasswordConfirm);
    });

    // Cancel button
    this.cancelBtn?.addEventListener("click", () => this.close());

    // Click outside to close
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  showTab(tab) {
    // console.log('🔄 Switching to tab:', tab);
    // console.log('Forms found:', {
      // loginForm: !!this.loginForm,
      // registerForm: !!this.registerForm,
      // forgotPasswordForm: !!this.forgotPasswordForm
    // });
    
    // Hide all forms
    if (this.loginForm) this.loginForm.style.display = "none";
    if (this.registerForm) this.registerForm.style.display = "none";
    if (this.forgotPasswordForm) this.forgotPasswordForm.style.display = "none";

    // Reset all tab buttons
    Object.values(this.tabButtons).forEach(btn => {
      btn?.classList.remove("active");
    });

    // Show selected form
    if (tab === "login") {
      if (this.loginForm) {
        this.loginForm.style.display = "block";
        // console.log('✅ Login form shown');
      }
      this.tabButtons.login?.classList.add("active");
      this.clearMessages();
    } else if (tab === "register") {
      if (this.registerForm) {
        this.registerForm.style.display = "block";
        // console.log('✅ Register form shown');
      }
      this.tabButtons.register?.classList.add("active");
      this.clearMessages();
    } else if (tab === "forgot") {
      if (this.forgotPasswordForm) {
        this.forgotPasswordForm.style.display = "block";
        // console.log('✅ Forgot password form shown');
        // console.log('Form element:', this.forgotPasswordForm);
        // console.log('Form innerHTML length:', this.forgotPasswordForm.innerHTML?.length);
      } else {
        console.error('❌ Forgot password form NOT FOUND!');
      }
      this.clearMessages();
    }
  }

  open() {
    if (!this.modal) return;
    
    this.modal.classList.add("show");
    this.showTab("login");
    this.clearMessages();
    this.clearInputs();
    
    setTimeout(() => {
      this.loginEmail?.focus();
    }, 100);
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove("show");
    this.clearMessages();
    this.clearInputs();
    if (this.onCancel) this.onCancel();
  }

  clearMessages() {
    const messages = [
      this.loginError, this.loginSuccess,
      this.registerError, this.registerSuccess,
      this.forgotError, this.forgotSuccess
    ];
    messages.forEach(msg => {
      if (msg) msg.style.display = "none";
    });
  }

  clearInputs() {
    const inputs = [
      this.loginEmail, this.loginPassword,
      this.registerEmail, this.registerPassword, this.registerPasswordConfirm,
      this.forgotEmail
    ];
    inputs.forEach(input => {
      if (input) input.value = "";
    });
  }

  showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  showSuccess(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  togglePasswordVisibility(input, button) {
    if (!input || !button) return;
    
    const type = input.type === "password" ? "text" : "password";
    input.type = type;
    
    const newImage = type === "password" 
      ? "url('assets/images/view.webp')" 
      : "url('assets/images/hide.webp')";
    
    button.style.backgroundImage = newImage;
  }

  // ====================================
  // AUTH MŰVELETEK
  // ====================================

  async handleLogin() {
    this.clearMessages();
    
    const email = this.loginEmail?.value.trim();
    const password = this.loginPassword?.value;

    if (!email || !password) {
      this.showError(this.loginError, "Kérlek töltsd ki az összes mezőt!");
      return;
    }

    // Email validáció
    if (!this.isValidEmail(email)) {
      this.showError(this.loginError, "Érvénytelen email cím!");
      return;
    }

    // Extra védelem a stuck loading state ellen
    if (!this.loginBtn) {
      console.error("Login button not found!");
      this.showError(this.loginError, "Hiba történt. Próbáld újra!");
      return;
    }

    try {
      this.loginBtn.disabled = true;
      this.loginBtn.textContent = "Bejelentkezés...";

      // Timeout védelem: ha 30 másodperc alatt nem válaszol a Supabase
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Időtúllépés! Túl sokáig tart a bejelentkezés.')), 30000)
      );

      await Promise.race([
        this.auth.signInWithEmail(email, password),
        timeoutPromise
      ]);
      
      this.showSuccess(this.loginSuccess, "Sikeres bejelentkezés! 🎉");
      
      setTimeout(() => {
        this.close();
        if (this.onSuccess) this.onSuccess();
      }, 800);
      
    } catch (error) {
      console.error("Login error:", error);
      this.showError(this.loginError, this.getErrorMessage(error));
    } finally {
      // Mindenképpen visszaállítjuk a gombot
      if (this.loginBtn) {
        this.loginBtn.disabled = false;
        this.loginBtn.textContent = "Bejelentkezés";
      }
    }
  }

  async handleRegister() {
    this.clearMessages();
    
    const email = this.registerEmail?.value.trim();
    const password = this.registerPassword?.value;
    const passwordConfirm = this.registerPasswordConfirm?.value;

    if (!email || !password || !passwordConfirm) {
      this.showError(this.registerError, "Kérlek töltsd ki az összes mezőt!");
      return;
    }

    // Email validáció
    if (!this.isValidEmail(email)) {
      this.showError(this.registerError, "Érvénytelen email cím!");
      return;
    }

    // Jelszó hossz ellenőrzés
    if (password.length < 6) {
      this.showError(this.registerError, "A jelszónak legalább 6 karakter hosszúnak kell lennie!");
      return;
    }

    // Jelszó egyezés ellenőrzés
    if (password !== passwordConfirm) {
      this.showError(this.registerError, "A jelszavak nem egyeznek!");
      return;
    }

    try {
      this.registerBtn.disabled = true;
      this.registerBtn.textContent = "Regisztráció...";

      const result = await this.auth.signUpWithEmail(email, password);
      
      // Ellenőrizzük hogy kell-e email confirmation
      if (result.user && !result.session) {
        // Email confirmation szükséges
        this.showSuccess(this.registerSuccess, 
          "✅ Sikeres regisztráció! 📧 Ellenőrizd az email fiókodat (és a SPAM mappát is) a megerősítő linkért.");
      } else if (result.session) {
        // Auto-confirm engedélyezve, azonnal be van jelentkezve
        this.showSuccess(this.registerSuccess, 
          "✅ Sikeres regisztráció! 🎉 Azonnal be tudsz jelentkezni.");
      } else {
        // Egyéb eset
        this.showSuccess(this.registerSuccess, 
          "✅ Sikeres regisztráció! Ellenőrizd az email fiókodat.");
      }
      
      setTimeout(() => {
        this.showTab("login");
      }, 4000);
      
    } catch (error) {
      console.error("Register error:", error);
      this.showError(this.registerError, this.getErrorMessage(error));
    } finally {
      this.registerBtn.disabled = false;
      this.registerBtn.textContent = "Regisztráció";
    }
  }

  async handleForgotPassword() {
    this.clearMessages();
    
    const email = this.forgotEmail?.value.trim();

    if (!email) {
      this.showError(this.forgotError, "Kérlek add meg az email címedet!");
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError(this.forgotError, "Érvénytelen email cím!");
      return;
    }

    // console.log('🔑 Jelszó visszaállítás kérése:', email);

    try {
      this.forgotBtn.disabled = true;
      this.forgotBtn.textContent = "Küldés...";

      const result = await this.auth.resetPassword(email);
      
      // console.log('✅ Jelszó visszaállító email kérés sikeres:', result);
      
      this.showSuccess(this.forgotSuccess, 
        "✅ Jelszó visszaállító email elküldve!\n\n📧 Ellenőrizd az email fiókodat (és a SPAM mappát is).\n\n💡 Ha nem érkezik meg 5 percen belül, próbáld újra vagy ellenőrizd hogy a megadott email cím létezik-e.");
      
      setTimeout(() => {
        this.showTab("login");
      }, 5000);
      
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error
      });
      
      let errorMsg = this.getErrorMessage(error);
      
      // Speciális esetek
      if (error.message && error.message.includes('rate limit')) {
        errorMsg = '⏰ Túl sok jelszó visszaállítási kérés! Várj 1 órát és próbáld újra.';
      } else if (error.message && error.message.includes('not found')) {
        errorMsg = '❌ Ez az email cím nem található a rendszerben. Biztos jól írtad be?';
      } else if (!error.message) {
        errorMsg = '⚠️ Ismeretlen hiba történt. Ellenőrizd az internet kapcsolatot!';
      }
      
      this.showError(this.forgotError, errorMsg);
    } finally {
      this.forgotBtn.disabled = false;
      this.forgotBtn.textContent = "Jelszó visszaállítása";
    }
  }

  async handleGoogleLogin() {
    try {
      await this.auth.signInWithGoogle();
      // A redirect automatikusan megtörténik
    } catch (error) {
      console.error("Google login error:", error);
      this.showError(this.loginError, this.getErrorMessage(error));
    }
  }

  async handleGithubLogin() {
    try {
      await this.auth.signInWithGithub();
      // A redirect automatikusan megtörténik
    } catch (error) {
      console.error("GitHub login error:", error);
      this.showError(this.loginError, this.getErrorMessage(error));
    }
  }

  async handleDiscordLogin() {
    try {
      await this.auth.signInWithDiscord();
      // A redirect automatikusan megtörténik
    } catch (error) {
      console.error("Discord login error:", error);
      this.showError(this.loginError, this.getErrorMessage(error));
    }
  }

  // ====================================
  // SEGÉDFÜGGVÉNYEK
  // ====================================

  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': '❌ Helytelen email vagy jelszó!',
      'Email not confirmed': '⚠️ Kérlek erősítsd meg az email címedet! Ellenőrizd a postaládádat (és a SPAM mappát).',
      'User already registered': '⚠️ Ez az email cím már regisztrálva van! Próbálj bejelentkezni helyette.',
      'Password should be at least 6 characters': '⚠️ A jelszónak legalább 6 karakter hosszúnak kell lennie!',
      'Email rate limit exceeded': '⏰ Túl sok email küldési kérés! Várj 1 órát és próbáld újra.',
      'Invalid email': '❌ Érvénytelen email cím formátum!',
      'Weak password': '⚠️ A jelszó túl gyenge! Használj számokat és betűket is.',
      'User not found': '❌ Nem található felhasználó ezzel az email címmel!',
      'Duplicate email': '⚠️ Ez az email cím már használatban van!'
    };

    // Ha van custom hibaüzenet, használjuk azt
    if (errorMessages[error.message]) {
      return errorMessages[error.message];
    }
    
    // Egyébként az eredeti üzenetet
    return error.message || '❌ Hiba történt. Próbáld újra!';
  }
}

// ====================================
// GLOBÁLIS AUTH INSTANCE
// ====================================
let globalAuth = null;
let globalAuthModal = null;

async function initSupabaseAuth() {
  globalAuth = new SupabaseAuth();
  await globalAuth.init();
  return globalAuth;
}

function getAuth() {
  return globalAuth;
}

// ====================================
// EXPORT
// ====================================
window.SupabaseAuth = SupabaseAuth;
window.SupabaseAuthModal = SupabaseAuthModal;
window.initSupabaseAuth = initSupabaseAuth;
window.getAuth = getAuth;
