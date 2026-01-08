// ====================================
// RELEASE MANAGER - GITHUB API & UI
// ====================================
// Ez a fájl kezeli a GitHub releases API hívásokat
// és a verziókezelő UI funkciókat

class ReleaseManager {
  constructor(repoOwner, repoName) {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.latestReleaseData = null;
    this.currentVersion = "1.0.0"; // Default

    // DOM elemek
    this.loginView = null;
    this.mainView = null;
    this.loginBtn = null;
    this.logoutBtn = null;
    
    this.currentVersionEl = null;
    this.latestReleaseEl = null;
    this.releaseDateEl = null;
    this.versionStatusEl = null;
    this.statusMessageEl = null;
    this.viewReleaseBtn = null;
    this.refreshBtn = null;

    this.patchBtn = null;
    this.minorBtn = null;
    this.majorBtn = null;
    this.patchExample = null;
    this.minorExample = null;
    this.majorExample = null;

    this.customVersion = null;
    this.customBtn = null;

    this.selectedVersionCard = null;
    this.selectedVersionEl = null;
    this.copyVersionBtn = null;
    this.openGithubBtn = null;
    this.tagExample = null;
    this.titleExample = null;

    this.cachedVersionEl = null;
    this.cachedCheckTimeEl = null;
    this.cachedCommitDateEl = null;
    this.viewCacheBtn = null;
    this.clearCacheBtn = null;
  }

  // ===================================
  // INICIALIZÁLÁS
  // ===================================
  init() {
    // DOM elemek lekérése
    this.loginView = document.getElementById("loginView");
    this.mainView = document.getElementById("mainView");
    this.loginBtn = document.getElementById("loginBtn");
    this.logoutBtn = document.getElementById("logoutBtn");

    this.currentVersionEl = document.getElementById("currentVersion");
    this.latestReleaseEl = document.getElementById("latestRelease");
    this.releaseDateEl = document.getElementById("releaseDate");
    this.versionStatusEl = document.getElementById("versionStatus");
    this.statusMessageEl = document.getElementById("statusMessage");
    this.viewReleaseBtn = document.getElementById("viewReleaseBtn");
    this.refreshBtn = document.getElementById("refreshBtn");

    this.patchBtn = document.getElementById("patchBtn");
    this.minorBtn = document.getElementById("minorBtn");
    this.majorBtn = document.getElementById("majorBtn");
    this.patchExample = document.getElementById("patchExample");
    this.minorExample = document.getElementById("minorExample");
    this.majorExample = document.getElementById("majorExample");

    this.customVersion = document.getElementById("customVersion");
    this.customBtn = document.getElementById("customBtn");

    this.selectedVersionCard = document.getElementById("selectedVersionCard");
    this.selectedVersionEl = document.getElementById("selectedVersion");
    this.copyVersionBtn = document.getElementById("copyVersionBtn");
    this.openGithubBtn = document.getElementById("openGithubBtn");
    this.tagExample = document.getElementById("tagExample");
    this.titleExample = document.getElementById("titleExample");

    this.cachedVersionEl = document.getElementById("cachedVersion");
    this.cachedCheckTimeEl = document.getElementById("cachedCheckTime");
    this.cachedCommitDateEl = document.getElementById("cachedCommitDate");
    this.viewCacheBtn = document.getElementById("viewCacheBtn");
    this.clearCacheBtn = document.getElementById("clearCacheBtn");

    // Event listeners setup
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Frissítés gomb - cache nélküli lekérdezés
    this.refreshBtn?.addEventListener("click", async () => {
      console.log("[Release Manager] Manuális frissítés - cache bypass");
      // Force refresh: cache bypass
      this.latestReleaseData = await this.fetchLatestRelease(false);
      await this.loadVersionInfo(false); // Ne fetcheljen újra
    });

    this.patchBtn?.addEventListener("click", () => {
      const next = this.calculateNextVersion("patch");
      this.selectVersion(next);
    });

    this.minorBtn?.addEventListener("click", () => {
      const next = this.calculateNextVersion("minor");
      this.selectVersion(next);
    });

    this.majorBtn?.addEventListener("click", () => {
      const next = this.calculateNextVersion("major");
      this.selectVersion(next);
    });

    this.customBtn?.addEventListener("click", () => {
      const custom = this.customVersion?.value.trim();
      if (custom && /^\d+\.\d+\.\d+$/.test(custom)) {
        this.selectVersion(custom);
      } else {
        alert("Hibás verzióformátum! Használj MAJOR.MINOR.PATCH formátumot (pl. 1.2.3)");
      }
    });

    this.copyVersionBtn?.addEventListener("click", () => this.copySelectedVersion());
    this.openGithubBtn?.addEventListener("click", () => this.openGithubRelease());
    this.viewReleaseBtn?.addEventListener("click", () => this.viewLatestRelease());
    this.viewCacheBtn?.addEventListener("click", () => this.viewCache());
    this.clearCacheBtn?.addEventListener("click", () => this.clearVersionCache());

    this.logoutBtn?.addEventListener("click", () => {
      window.authLogout();
    });
  }

  // ===================================
  // VIEW KEZELÉS
  // ===================================
  showLoginView() {
    if (this.loginView) this.loginView.style.display = "flex";
    if (this.mainView) this.mainView.style.display = "none";
  }

  showMainView() {
    if (this.loginView) this.loginView.style.display = "none";
    if (this.mainView) this.mainView.style.display = "block";
    this.loadVersionInfo();
    this.updateVersionButtons();
    this.updateCacheDisplay();
  }

  // ===================================
  // GITHUB API
  // ===================================
  async fetchLatestRelease(useCache = true) {
    const CACHE_KEY = "latest_release_cache";
    const CACHE_DURATION = 10 * 60 * 1000; // 10 perc cache
    
    // Cache ellenőrzés
    if (useCache) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const age = Date.now() - data.timestamp;
          
          if (age < CACHE_DURATION) {
            console.log(`[Release Manager] Cache használata (${Math.round(age / 1000)}s régi)`);
            return data.release;
          } else {
            console.log(`[Release Manager] Cache lejárt (${Math.round(age / 1000)}s régi)`);
          }
        } catch (e) {
          console.warn("[Release Manager] Cache parse hiba:", e);
        }
      }
    }
    
    // GitHub API lekérdezés
    try {
      console.log("[Release Manager] GitHub API lekérdezés...");
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`,
        { cache: "no-store" }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API hiba: ${response.status}`);
      }
      
      const release = await response.json();
      
      // Cache mentése
      const cacheData = {
        release: release,
        version: release.tag_name,
        published_at: release.published_at,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`[Release Manager] Cache frissítve: ${release.tag_name}`);
      
      return release;
    } catch (error) {
      console.error("Hiba a legfrissebb release lekérésekor:", error);
      
      // Próbáljuk meg a régi cache-ből betölteni hiba esetén
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          console.warn("[Release Manager] Hiba történt, régi cache használata");
          return data.release;
        } catch (e) {
          // Nem sikerült a cache-ből sem
        }
      }
      
      return null;
    }
  }

  async loadVersionInfo(fetchNew = true) {
    // Ha fetchNew false és már van adat, használjuk azt
    if (!fetchNew && this.latestReleaseData) {
      console.log("[Release Manager] Meglévő adat használata");
    } else {
      this.latestReleaseData = await this.fetchLatestRelease();
    }

    if (this.latestReleaseData) {
      const latestVersion = this.latestReleaseData.tag_name.replace(/^v/, "");
      this.currentVersion = latestVersion;

      if (this.currentVersionEl) this.currentVersionEl.textContent = this.currentVersion;
      if (this.latestReleaseEl) this.latestReleaseEl.textContent = latestVersion;
      
      const releaseDate = new Date(this.latestReleaseData.published_at);
      if (this.releaseDateEl) this.releaseDateEl.textContent = releaseDate.toLocaleString("hu-HU");

      if (this.versionStatusEl) this.versionStatusEl.textContent = "Naprakész";
      if (this.statusMessageEl) this.statusMessageEl.textContent = "Ez a legfrissebb verzió";
      
      // Engedélyezzük a GitHub gomb-ot
      if (this.viewReleaseBtn) this.viewReleaseBtn.disabled = false;
      
      this.updateVersionButtons();
      this.updateCacheDisplay();
    } else {
      if (this.versionStatusEl) this.versionStatusEl.textContent = "Ismeretlen";
      if (this.statusMessageEl) this.statusMessageEl.textContent = "Nem sikerült lekérni a verzióinformációkat";
    }
  }

  // ===================================
  // VERZIÓ SZÁMÍTÁS
  // ===================================
  calculateNextVersion(type) {
    const parts = this.currentVersion.split(".").map(Number);
    let [major, minor, patch] = parts;

    if (type === "patch") {
      patch++;
    } else if (type === "minor") {
      minor++;
      patch = 0;
    } else if (type === "major") {
      major++;
      minor = 0;
      patch = 0;
    }

    return `${major}.${minor}.${patch}`;
  }

  updateVersionButtons() {
    const nextPatch = this.calculateNextVersion("patch");
    const nextMinor = this.calculateNextVersion("minor");
    const nextMajor = this.calculateNextVersion("major");

    if (this.patchExample) this.patchExample.textContent = nextPatch;
    if (this.minorExample) this.minorExample.textContent = nextMinor;
    if (this.majorExample) this.majorExample.textContent = nextMajor;
  }

  // ===================================
  // VERZIÓ KIVÁLASZTÁS
  // ===================================
  selectVersion(version) {
    if (this.selectedVersionCard) this.selectedVersionCard.style.display = "block";
    if (this.selectedVersionEl) this.selectedVersionEl.textContent = version;
    if (this.tagExample) this.tagExample.textContent = `v${version}`;
    if (this.titleExample) this.titleExample.textContent = `Release v${version}`;

    this.selectedVersionCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  copySelectedVersion() {
    const version = this.selectedVersionEl?.textContent;
    if (version) {
      navigator.clipboard.writeText(version);
      alert(`Verzió másolva: ${version}`);
    }
  }

  openGithubRelease() {
    const url = `https://github.com/${this.repoOwner}/${this.repoName}/releases/new`;
    window.open(url, "_blank");
  }

  viewLatestRelease() {
    if (this.latestReleaseData) {
      window.open(this.latestReleaseData.html_url, "_blank");
    }
  }

  // ===================================
  // CACHE KEZELÉS
  // ===================================
  updateCacheDisplay() {
    const cacheKey = "latest_release_cache";
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const version = parsed.version.replace(/^v/, "");
        const checkTime = new Date(parsed.timestamp).toLocaleString("hu-HU");
        const commitDate = new Date(parsed.published_at).toLocaleString("hu-HU");

        if (this.cachedVersionEl) this.cachedVersionEl.textContent = version;
        if (this.cachedCheckTimeEl) this.cachedCheckTimeEl.textContent = checkTime;
        if (this.cachedCommitDateEl) this.cachedCommitDateEl.textContent = commitDate;
      } catch (e) {
        if (this.cachedVersionEl) this.cachedVersionEl.textContent = "Nincs";
      }
    } else {
      if (this.cachedVersionEl) this.cachedVersionEl.textContent = "Nincs";
      if (this.cachedCheckTimeEl) this.cachedCheckTimeEl.textContent = "-";
      if (this.cachedCommitDateEl) this.cachedCommitDateEl.textContent = "-";
    }
  }

  viewCache() {
    const cacheKey = "latest_release_cache";
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        alert(JSON.stringify(parsed, null, 2));
      } catch (e) {
        alert("Hiba a cache megjelenítésekor");
      }
    } else {
      alert("Nincs mentett cache");
    }
  }

  clearVersionCache() {
    const cacheKey = "latest_release_cache";
    localStorage.removeItem(cacheKey);
    this.updateCacheDisplay();
    alert("Cache törölve!");
  }
}

// Globális hozzáférés
window.ReleaseManager = ReleaseManager;
