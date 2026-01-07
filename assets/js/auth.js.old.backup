// ====================================
// KÖZPONTI AUTHENTIKÁCIÓS MODUL
// ====================================
// Ez a fájl kezeli a site-wide bejelentkezést
// minden admin oldalon (footer, infosharer, releases)

const AUTH_CONFIG = {
  PASSWORD_HASH: "248e464b6e49676c615430dbfb831787d3d7c78e52bd2cb2461608991f7204f6",
  SITEWIDE_LOGIN_KEY: "__agazati_login_state",
  SITEWIDE_LOGIN_EXPIRY: "__agazati_login_expiry",
  REMEMBER_ME_KEY: "releases_remember_token",
  SITEWIDE_LOGIN_DURATION: 24 * 60 * 60 * 1000, // 24 óra
  REMEMBER_DURATION: 365 * 24 * 60 * 60 * 1000, // 365 nap
};

// ====================================
// SHA-256 HASH
// ====================================
async function sha256hex(str) {
  const enc = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ====================================
// SITE-WIDE LOGIN STATE
// ====================================
function setSitewideLoginState() {
  const now = Date.now();
  const expiry = now + AUTH_CONFIG.SITEWIDE_LOGIN_DURATION;
  localStorage.setItem(AUTH_CONFIG.SITEWIDE_LOGIN_KEY, "true");
  localStorage.setItem(AUTH_CONFIG.SITEWIDE_LOGIN_EXPIRY, expiry.toString());
}

function clearSitewideLoginState() {
  localStorage.removeItem(AUTH_CONFIG.SITEWIDE_LOGIN_KEY);
  localStorage.removeItem(AUTH_CONFIG.SITEWIDE_LOGIN_EXPIRY);
}

function checkSitewideLoginState() {
  const state = localStorage.getItem(AUTH_CONFIG.SITEWIDE_LOGIN_KEY);
  const expiry = localStorage.getItem(AUTH_CONFIG.SITEWIDE_LOGIN_EXPIRY);
  
  if (state === "true" && expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() < expiryTime) {
      return true;
    } else {
      clearSitewideLoginState();
    }
  }
  return false;
}

// ====================================
// REMEMBER ME TOKEN
// ====================================
function setRememberToken() {
  const token = {
    value: AUTH_CONFIG.PASSWORD_HASH,
    expires: Date.now() + AUTH_CONFIG.REMEMBER_DURATION,
  };
  localStorage.setItem(AUTH_CONFIG.REMEMBER_ME_KEY, JSON.stringify(token));
}

function clearRememberToken() {
  localStorage.removeItem(AUTH_CONFIG.REMEMBER_ME_KEY);
}

function checkRememberToken() {
  try {
    const tokenStr = localStorage.getItem(AUTH_CONFIG.REMEMBER_ME_KEY);
    if (!tokenStr) return false;
    
    const token = JSON.parse(tokenStr);
    if (token.value === AUTH_CONFIG.PASSWORD_HASH && token.expires > Date.now()) {
      return true;
    } else {
      clearRememberToken();
    }
  } catch (e) {
    clearRememberToken();
  }
  return false;
}

// ====================================
// AUTH MODAL KEZELÉS
// ====================================
class AuthModal {
  constructor() {
    this.modal = null;
    this.modalBox = null;
    this.input = null;
    this.okBtn = null;
    this.cancelBtn = null;
    this.errorMsg = null;
    this.successMsg = null;
    this.rememberCheckbox = null;
    this.togglePasswordBtn = null;
    this.onSuccess = null;
    this.onCancel = null;
  }

  // Modal inicializálása
  init(options = {}) {
    this.modal = document.getElementById("pwModal");
    this.modalBox = document.getElementById("pwBox");
    this.input = document.getElementById("pwInput");
    this.okBtn = document.getElementById("pwOk");
    this.cancelBtn = document.getElementById("pwCancel");
    this.errorMsg = document.getElementById("pwNote");
    this.successMsg = document.getElementById("pwInfo");
    this.rememberCheckbox = document.getElementById("rememberMe");
    this.togglePasswordBtn = document.getElementById("togglePassword");

    if (!this.modal || !this.input) {
      console.error("Auth modal elements not found!");
      return false;
    }
    
    // Beállítjuk a default szem ikont (view.webp)
    if (this.togglePasswordBtn) {
      this.togglePasswordBtn.style.backgroundImage = "url('assets/images/view.webp')";
    }

    // Callbacks
    this.onSuccess = options.onSuccess || (() => {});
    this.onCancel = options.onCancel || (() => {});

    // Event listeners
    this.okBtn?.addEventListener("click", () => this.authenticate());
    this.cancelBtn?.addEventListener("click", () => this.close());
    
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.authenticate();
    });

    // Toggle password visibility
    if (this.togglePasswordBtn) {
      this.togglePasswordBtn.addEventListener("click", () => {
        const type = this.input.type === "password" ? "text" : "password";
        this.input.type = type;
        
        const newImage = type === "password" 
          ? "url('assets/images/view.webp')" 
          : "url('assets/images/hide.webp')";
        
        this.togglePasswordBtn.style.backgroundImage = newImage;
      });
    }

    // Modal click outside to close
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    return true;
  }

  // Modal megnyitása
  open() {
    if (!this.modal) return;
    
    // Input type és szem ikon alapállapot
    if (this.input) this.input.type = "password";
    if (this.togglePasswordBtn) {
      this.togglePasswordBtn.style.backgroundImage = "url('assets/images/view.webp')";
    }
    
    // Csak class-t használunk, nem inline style-t
    this.modal.classList.add("show");
    
    setTimeout(() => {
      if (this.input) {
        this.input.value = "";
        this.input.focus();
      }
      if (this.errorMsg) this.errorMsg.style.display = "none";
      if (this.successMsg) this.successMsg.style.display = "none";
    }, 50);
  }

  // Modal bezárása
  close() {
    if (!this.modal) return;
    this.modal.classList.remove("show");
    if (this.input) this.input.value = "";
    if (this.onCancel) this.onCancel();
  }

  // Authentikáció
  async authenticate() {
    const password = this.input.value.trim();
    if (!password) return;

    const hash = await sha256hex(password);
    
    if (hash === AUTH_CONFIG.PASSWORD_HASH) {
      // Sikeres bejelentkezés
      if (this.errorMsg) this.errorMsg.style.display = "none";
      if (this.successMsg) this.successMsg.style.display = "block";
      
      // Site-wide login beállítása
      setSitewideLoginState();
      
      // Remember me token
      if (this.rememberCheckbox?.checked) {
        setRememberToken();
      } else {
        clearRememberToken();
      }
      
      // Callback
      setTimeout(() => {
        this.close();
        if (this.onSuccess) this.onSuccess();
      }, 800);
    } else {
      // Hibás jelszó
      if (this.successMsg) this.successMsg.style.display = "none";
      if (this.errorMsg) this.errorMsg.style.display = "block";
      if (this.input) {
        this.input.value = "";
        this.input.focus();
      }
    }
  }

  // Auto-login ellenőrzés
  checkAutoLogin() {
    return checkSitewideLoginState() || checkRememberToken();
  }
}

// ====================================
// LOGOUT FUNKCIÓ
// ====================================
function logout() {
  clearSitewideLoginState();
  clearRememberToken();
  // Oldal újratöltése hogy visszaálljon a login view
  window.location.reload();
}

// ====================================
// EXPORT
// ====================================
// Globális hozzáférés
window.AuthModal = AuthModal;
window.authLogout = logout;
window.authCheckLogin = checkSitewideLoginState;
window.authCheckRemember = checkRememberToken;
