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
  }

  async init() {
    this.sb = getSupabaseClient();
    if (!this.sb) return false;

    // Session ellenőrzés
    const { data: { session } } = await this.sb.auth.getSession();
    if (session) {
      await this.loadUserProfile(session.user);
    }

    // Utolsó nem-admin oldal követése
    this.trackLastNonAdminPage();

    // Realtime subscription beállítása a user_roles táblára
    this.setupRealtimeSubscription();

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

  async loadUserProfile(user) {
    this.currentUser = user;
    
    // console.log('🔄 Loading user profile for:', user.email);
    
    // MÁSODLAGOS fallback: Ellenőrizzük a user metadata-t
    const metadataAdmin = user.user_metadata?.is_admin === true;
    
    // ELSŐDLEGES: Próbáljuk lekérdezni a user_roles táblából - EZ A FŐ FORRÁS!
    let databaseAdmin = false;
    let hadDatabaseEntry = false;
    
    try {
      const { data, error } = await this.sb
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      // console.log('User roles query result:', { data, error });

      if (data && !error) {
        // VAN database bejegyzés - EZ az IGAZ forrás!
        databaseAdmin = data.is_admin === true;
        hadDatabaseEntry = true;
        // console.log('✅ Admin status from DATABASE (autoritatív forrás):', databaseAdmin);
      } else if (!data && !error) {
        // Nincs még database bejegyzés - hozzuk létre
        // console.log('ℹ️ Nincs user_roles bejegyzés, létrehozás...');
        await this.createUserRoleEntry(user.id, metadataAdmin);
        databaseAdmin = metadataAdmin;
        hadDatabaseEntry = true;
      } else if (error) {
        // console.warn('⚠️ User_roles tábla lekérdezési hiba:', error.message);
        hadDatabaseEntry = false;
      }
    } catch (err) {
      // console.warn('⚠️ User_roles tábla nem elérhető:', err.message);
      hadDatabaseEntry = false;
    }
    
    // Admin jog beállítása:
    // Ha van DATABASE bejegyzés -> azt használjuk (autoritás)
    // Ha nincs DATABASE bejegyzés -> metadata (fallback)
    const newAdminStatus = hadDatabaseEntry ? databaseAdmin : metadataAdmin;
    
    // console.log(`👤 User: ${user.email} | Admin: ${newAdminStatus} | Source: ${hadDatabaseEntry ? 'DATABASE' : 'METADATA'} | (DB: ${databaseAdmin}, Meta: ${metadataAdmin})`);
    
    // Állítsuk be az admin státuszt
    this.isAdmin = newAdminStatus;
    
    // CSAK akkor hozzunk létre database bejegyzést ha egyáltalán nincs
    // NE írjuk felül a database-t a metadata alapján!
    if (!hadDatabaseEntry) {
      // console.log('🔄 Nincs database bejegyzés - létrehozás metadata alapján:', metadataAdmin);
      await this.createUserRoleEntry(user.id, metadataAdmin);
    }
    
    // Jelöljük hogy a profil betöltődött
    this.profileLoaded = true;
  }

  setupRealtimeSubscription() {
    if (!this.sb || this.realtimeChannel) return;

    // console.log('🔔 Setting up realtime subscription for user_roles...');

    this.realtimeChannel = this.sb
      .channel('user_roles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        async (payload) => {
          // console.log('🔔 User roles change detected:', payload);
          await this.handleUserRoleChange(payload);
        }
      )
      .subscribe();
  }

  async handleUserRoleChange(payload) {
    const { eventType, new: newData, old: oldData } = payload;

    // console.log('🔔 Realtime event:', { eventType, newData, oldData });

    // Csak akkor foglalkozunk vele, ha a saját user_id-nk érintett
    const currentUserId = this.getUserId();
    if (!currentUserId) return;

    const changedUserId = newData?.user_id || oldData?.user_id;
    
    if (changedUserId !== currentUserId) {
      // Más felhasználó változott - csak frissítjük a nézetet ha admin oldalon vagyunk
      if (window.location.pathname.includes('secret/admin')) {
        // console.log('👥 Más felhasználó admin státusza változott, frissítés...');
        if (window.loadUsers && typeof window.loadUsers === 'function') {
          await window.loadUsers();
        }
      }
      return;
    }

    // Saját admin státuszunk változott
    if (eventType === 'UPDATE') {
      const wasAdmin = oldData?.is_admin === true;
      const isNowAdmin = newData?.is_admin === true;

      // Csak akkor csináljunk valamit ha TÉNYLEG változott
      if (wasAdmin === isNowAdmin) {
        // console.log('✅ Admin státusz nem változott:', { wasAdmin, isNowAdmin });
        return;
      }

      // console.log(`🔔 SAJÁT admin státusz VÁLTOZÁS: ${wasAdmin} -> ${isNowAdmin}`);
      
      // Frissítsük az isAdmin értéket
      this.isAdmin = isNowAdmin;

      // Értesítés megjelenítése
      if (isNowAdmin) {
        this.showAdminGrantedNotification();
      } else {
        this.showAdminRevokedNotification();
      }

      // UI frissítése
      this.refreshUI();

      // Ha elvették az admin jogot és admin oldalon vagyunk, irányítsuk át
      if (!isNowAdmin && this.isOnAdminPage()) {
        setTimeout(() => {
          const baseUrl = window.location.pathname.includes('/agazati/') ? '/agazati/' : '/';
          const lastPath = this.lastKnownPath || baseUrl;
          window.location.href = lastPath.includes('secret/') ? baseUrl : lastPath;
        }, 3000);
      }
    }
    // INSERT eseményt figyelmen kívül hagyunk (regisztráció, első létrehozás)
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
    // Ellenőrizzük van-e már notification container
    let container = document.getElementById('authNotificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'authNotificationContainer';
      container.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${type === 'success' ? '#1a4d2e' : type === 'warning' ? '#4d2a1a' : '#1a2a4d'};
      border-left: 4px solid ${type === 'success' ? '#45f0a0' : type === 'warning' ? '#ff8c42' : '#7f5af0'};
      color: #e4e4ff;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${title}</div>
      <div style="font-size: 14px; color: #b8b8d8;">${message}</div>
    `;

    container.appendChild(notification);

    // Animáció
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    if (!document.getElementById('authNotificationStyles')) {
      style.id = 'authNotificationStyles';
      document.head.appendChild(style);
    }

    // 5 másodperc után eltűnik
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  isOnAdminPage() {
    const path = window.location.pathname;
    return path.includes('secret/');
  }

  refreshUI() {
    // Frissítjük a navigációt
    if (window.rebuildNav && typeof window.rebuildNav === 'function') {
      window.rebuildNav();
    }

    // Frissítjük az oldalt ha nem admin oldalon vagyunk
    if (!this.isOnAdminPage()) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
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
      // 1. Először próbáljuk meg UPDATE-elni
      const { error: updateError, count } = await this.sb
        .from('user_roles')
        .update({
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });

      // Ha nem létezett a sor (count === 0), akkor INSERT-eljük
      if (count === 0 || updateError?.code === 'PGRST116') {
        const { error: insertError } = await this.sb
          .from('user_roles')
          .insert({
            user_id: userId,
            is_admin: isAdmin,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
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

      // console.log(`✅ Admin status updated: ${userId} -> ${isAdmin}`);
      
      // Ha saját magunkat frissítettük, azonnal töltsük újra a profilt
      if (userId === this.getUserId()) {
        await this.loadUserProfile(this.currentUser);
      }
      
      return { success: true };
      
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
    
    // Social registration buttons
    this.googleRegisterBtn = document.getElementById("googleRegisterBtn");
    this.githubRegisterBtn = document.getElementById("githubRegisterBtn");

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
    
    // Social registration (uses same OAuth methods)
    this.googleRegisterBtn?.addEventListener("click", () => this.handleGoogleLogin());
    this.githubRegisterBtn?.addEventListener("click", () => this.handleGithubLogin());

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
