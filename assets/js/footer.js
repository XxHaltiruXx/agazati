const APP_VERSION = "1.4.3";

// Verziószám frissítése
document.addEventListener("DOMContentLoaded", function () {
  const versionElements = document.querySelectorAll(".version-number");
  versionElements.forEach((element) => {
    element.textContent = APP_VERSION;
  });
});

const repoOwner = "XxHaltiruXx";
const repoName = "agazati";
const githubApiBase = "https://api.github.com";
const githubRawBase = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/assets/images/`;


const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const LS_PREFIX = "agazati_";
const KEY_LAST_COMMIT_ISO = LS_PREFIX + "lastCommitISO";
const KEY_LAST_COMMIT_FMT = LS_PREFIX + "lastCommitFormatted";
const KEY_LAST_CHECK_TS = LS_PREFIX + "lastCheckTs";
const KEY_SKIP_UNTIL_TS = LS_PREFIX + "skipUntilTs";


function computeBasePath(repo) {
  const host = location.hostname;
  const path = location.pathname
  let base = "";

  if (host.includes("github.io")) {
    const parts = path.split("/");
    if (parts[1] === repo) base = `/${repo}`;
  } else {
    const m = path.match(new RegExp(`(/${repo})(/|$)`));
    if (m) base = m[1];
  }

  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

function getImagePath() {
  const base = computeBasePath(repoName);
  return `${base}/assets/images/`;
}

function applyImageFallbacks(container) {
  const imgs = container.querySelectorAll("img");
  imgs.forEach((img) => {
    const filename =
      img.getAttribute("data-filename") || (img.src || "").split("/").pop();
    if (!filename) return;
    const fallback = githubRawBase + filename;
    img.addEventListener("error", function onErr() {
      if (this.src !== fallback) this.src = fallback;
      this.removeEventListener("error", onErr);
    });
  });
}

function formatDateHU(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d)) return "N/A";
    return d.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "N/A";
  }
}

function isoDatePartLocal(isoString) {
  const d = new Date(isoString);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowTs() {
  return Date.now();
}

async function fetchLatestCommitISO(owner, repo) {
  const url = `${githubApiBase}/repos/${owner}/${repo}/commits?per_page=1`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data[0] || !data[0].commit || !data[0].commit.committer) {
    throw new Error("No commit data");
  }
  return data[0].commit.committer.date;
}


function setFooterDate(formatted) {
  const timeEl = document.querySelector(".time");
  if (timeEl) timeEl.textContent = formatted;
}

async function performCommitCheck() {
  const now = nowTs();
  const skipUntil = parseInt(localStorage.getItem(KEY_SKIP_UNTIL_TS) || "0", 10);
  
  if (skipUntil && now < skipUntil) {
    const cachedFmt = localStorage.getItem(KEY_LAST_COMMIT_FMT);
    if (cachedFmt) {
      console.log(`[agazati] Skipping check until next day (${new Date(skipUntil).toISOString()}). Using cached date: ${cachedFmt}`);
      setFooterDate(cachedFmt);
      return;
    }
  }
  
  const lastCheck = parseInt(localStorage.getItem(KEY_LAST_CHECK_TS) || "0", 10);
  if (lastCheck && now - lastCheck < CHECK_INTERVAL_MS) {
    const cachedFmt = localStorage.getItem(KEY_LAST_COMMIT_FMT);
    if (cachedFmt) {
      console.log(`[agazati] Last check <4h ago. Using cached date: ${cachedFmt}`);
      setFooterDate(cachedFmt);
      return;
    }
  }
  
  try {
    const latestIso = await fetchLatestCommitISO(repoOwner, repoName);
    const latestDay = isoDatePartLocal(latestIso);

    const storedIso = localStorage.getItem(KEY_LAST_COMMIT_ISO);
    const storedDay = storedIso ? isoDatePartLocal(storedIso) : null;
    
    if (!storedIso) {
      const fmt = formatDateHU(latestIso);
      localStorage.setItem(KEY_LAST_COMMIT_ISO, latestIso);
      localStorage.setItem(KEY_LAST_COMMIT_FMT, fmt);
      localStorage.setItem(KEY_LAST_CHECK_TS, now.toString());
      console.log(`[agazati] First commit fetch. Date: ${latestIso}`);
      setFooterDate(fmt);
      return;
    }
    
    if (storedDay === latestDay) {
      localStorage.setItem(KEY_LAST_CHECK_TS, now.toString());
      const fmt = formatDateHU(storedIso);
      localStorage.setItem(KEY_LAST_COMMIT_FMT, fmt);
      console.log(`[agazati] No new commit today. Stored date remains: ${storedIso}`);
      setFooterDate(fmt);
      return;
    }
    
    const newFmt = formatDateHU(latestIso);
    localStorage.setItem(KEY_LAST_COMMIT_ISO, latestIso);
    localStorage.setItem(KEY_LAST_COMMIT_FMT, newFmt);
    localStorage.setItem(KEY_LAST_CHECK_TS, now.toString());
    setFooterDate(newFmt);
    console.log(`[agazati] New commit detected: ${latestIso}`);
    
    const today = new Date();
    const todayPart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (latestDay === todayPart) {
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
      localStorage.setItem(KEY_SKIP_UNTIL_TS, tomorrow.getTime().toString());
      console.log(`[agazati] New commit is today — skipping further checks until: ${tomorrow.toISOString()}`);
    } else {
      localStorage.removeItem(KEY_SKIP_UNTIL_TS);
    }
    return;
  } catch (err) {
    console.error("[agazati] Commit check failed:", err);
    const cachedFmt = localStorage.getItem(KEY_LAST_COMMIT_FMT);
    if (cachedFmt) {
      console.log(`[agazati] Using cached date due to failure: ${cachedFmt}`);
      setFooterDate(cachedFmt);
    } else {
      setFooterDate("N/A");
    }
   
    localStorage.setItem(KEY_LAST_CHECK_TS, now.toString());
  }
}
(function createFooterIfMissing() {
  let footer = document.querySelector("footer");
  if (!footer) {
    const imagePath = getImagePath();
    footer = document.createElement("footer");
    footer.innerHTML = `
        <p>&copy; 2025 XxHaltiruXx. Minden jog fenntartva. Nem állunk kapcsolatban valós márkákkal.</p>
        <p>Verzió: <span class="version-number">1.0.0</span></p>
        <p>Utolsó frissítés: <span class="time">—</span></p>
        <hr class="black" />
        <h3>Kapcsolat</h3>
        <div class="contacts">
            <div>
                <a href="https://github.com/${repoOwner}/${repoName}" target="_blank" rel="noopener">
                    <img data-filename="github.svg" src="${imagePath}github.svg" alt="Github">
                </a>
            </div>
            <div>
             <a href="https://trello.com/b/p69OnOBH/%C3%A1gazati" target="_blank" rel="noopener">
                    <img data-filename="trello.svg" src="${imagePath}trello.svg" alt="Trello">
                </a>
            </div>
            <div>
                <a href="mailto:agazati.info@gmail.com" target="_blank" rel="noopener">
                    <img id="mail" data-filename="mail.png" src="${imagePath}mail.png" alt="Email">
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(footer);
  } else {
    if (!footer.querySelector(".time")) {
      const p = document.createElement("p");
      p.innerHTML = `Utolsó frissítés: <span class="time">—</span>`;
      footer.appendChild(p);
    }
  }
  
  applyImageFallbacks(footer);
})();

(async function init() {
  try {
    const lastCheck = parseInt(localStorage.getItem(KEY_LAST_CHECK_TS) || "0", 10);
    const now = nowTs();
    const cachedFmt = localStorage.getItem(KEY_LAST_COMMIT_FMT);
    const skipUntil = parseInt(localStorage.getItem(KEY_SKIP_UNTIL_TS) || "0", 10);

    if (skipUntil && now < skipUntil) {
      if (cachedFmt) {
        console.log(`[agazati] init: skipUntil active until ${new Date(skipUntil).toISOString()}, using cached date.`);
        setFooterDate(cachedFmt);
      } else {
        console.log("[agazati] init: skipUntil active but no cached date available.");
        setFooterDate("N/A");
      }
    } else if (lastCheck && now - lastCheck < CHECK_INTERVAL_MS && cachedFmt) {
      console.log("[agazati] init: last check within 4 hours, using cached date.");
      setFooterDate(cachedFmt);
      performCommitCheck().catch((e) => console.debug("[agazati] background check error", e));
    } else {
      await performCommitCheck();
    }
  } catch (e) {
    console.error("[agazati] init error:", e);
  } finally {
    setInterval(performCommitCheck, CHECK_INTERVAL_MS);
  }
})();