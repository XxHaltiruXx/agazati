// ====================================
// SUPABASE AUTHENTIKÁCIÓ MODUL
// ====================================
// Teljes auth kezelés Supabase-zel
// Regisztráció, bejelentkezés, admin role kezelés

const SUPABASE_CONFIG = {
  URL: "https://rtguezsjtkxjwhipuaqe.supabase.co",
  ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z3VlenNqdGt4andoaXB1YXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTY5OTgsImV4cCI6MjA4MzMzMjk5OH0.96ZPMeVMKOEt2nOfflI_pm9-ILLKp-S6x20MGu-9pV8",
  REDIRECT_URL: window.location.origin + "/agazati/auth-callback.html"
};

// Supabase client inicializálás
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded!');
      return null;
    }
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
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
  }

  async init() {
    this.sb = getSupabaseClient();
    if (!this.sb) return false;

    // Session ellenőrzés
    const { data: { session } } = await this.sb.auth.getSession();
    if (session) {
      await this.loadUserProfile(session.user);
    }

    // Auth state változás figyelés
    this.sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.isAdmin = false;
      }
    });

    return true;
  }

  async loadUserProfile(user) {
    this.currentUser = user;
    
    // Admin role ellenőrzés a user_metadata-ból vagy külön táblából
    const { data, error } = await this.sb
      .from('user_roles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      this.isAdmin = data.is_admin === true;
    } else {
      // Fallback: ellenőrizzük a user metadata-t
      this.isAdmin = user.user_metadata?.is_admin === true;
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
        emailRedirectTo: SUPABASE_CONFIG.REDIRECT_URL
      }
    });

    if (error) throw error;
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
    const { error } = await this.sb.auth.signOut();
    if (error) throw error;
    
    this.currentUser = null;
    this.isAdmin = false;
  }

  async resetPassword(email) {
    const { data, error } = await this.sb.auth.resetPasswordForEmail(email, {
      redirectTo: SUPABASE_CONFIG.REDIRECT_URL
    });

    if (error) throw error;
    return data;
  }

  // ====================================
  // ADMIN MŰVELETEK
  // ====================================
  
  async setUserAdmin(userId, isAdmin) {
    if (!this.isAdmin) {
      throw new Error('Unauthorized: Only admins can set admin roles');
    }

    const { data, error } = await this.sb
      .from('user_roles')
      .upsert({
        user_id: userId,
        is_admin: isAdmin,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
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

    // Show login from register
    this.showLoginTab?.addEventListener("click", () => this.showTab("login"));

    // Password toggle
    this.toggleLoginPassword?.addEventListener("click", () => {
      this.togglePasswordVisibility(this.loginPassword, this.toggleLoginPassword);
    });
    this.toggleRegisterPassword?.addEventListener("click", () => {
      this.togglePasswordVisibility(this.registerPassword, this.toggleRegisterPassword);
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
      if (this.loginForm) this.loginForm.style.display = "block";
      this.tabButtons.login?.classList.add("active");
      this.clearMessages();
    } else if (tab === "register") {
      if (this.registerForm) this.registerForm.style.display = "block";
      this.tabButtons.register?.classList.add("active");
      this.clearMessages();
    } else if (tab === "forgot") {
      if (this.forgotPasswordForm) this.forgotPasswordForm.style.display = "block";
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

    try {
      this.loginBtn.disabled = true;
      this.loginBtn.textContent = "Bejelentkezés...";

      await this.auth.signInWithEmail(email, password);
      
      this.showSuccess(this.loginSuccess, "Sikeres bejelentkezés! 🎉");
      
      setTimeout(() => {
        this.close();
        if (this.onSuccess) this.onSuccess();
      }, 800);
      
    } catch (error) {
      console.error("Login error:", error);
      this.showError(this.loginError, this.getErrorMessage(error));
    } finally {
      this.loginBtn.disabled = false;
      this.loginBtn.textContent = "Bejelentkezés";
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

      await this.auth.signUpWithEmail(email, password);
      
      this.showSuccess(this.registerSuccess, 
        "Sikeres regisztráció! 🎉 Ellenőrizd az email fiókodat a megerősítéshez.");
      
      setTimeout(() => {
        this.showTab("login");
      }, 3000);
      
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

    try {
      this.forgotBtn.disabled = true;
      this.forgotBtn.textContent = "Küldés...";

      await this.auth.resetPassword(email);
      
      this.showSuccess(this.forgotSuccess, 
        "Jelszó visszaállító email elküldve! Ellenőrizd a postaládádat. 📧");
      
      setTimeout(() => {
        this.showTab("login");
      }, 3000);
      
    } catch (error) {
      console.error("Forgot password error:", error);
      this.showError(this.forgotError, this.getErrorMessage(error));
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
      'Invalid login credentials': 'Helytelen email vagy jelszó!',
      'Email not confirmed': 'Kérlek erősítsd meg az email címedet!',
      'User already registered': 'Ez az email cím már regisztrálva van!',
      'Password should be at least 6 characters': 'A jelszónak legalább 6 karakter hosszúnak kell lennie!'
    };

    return errorMessages[error.message] || error.message || 'Hiba történt. Próbáld újra!';
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
