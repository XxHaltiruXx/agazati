const APP_VERSION = "1.3.3";

// Verziószám frissítése
document.addEventListener('DOMContentLoaded', function() {
    const versionElements = document.querySelectorAll('.version-number');
    versionElements.forEach(element => {
        element.textContent = APP_VERSION;
    });
});

// ==== Konfig ====
const repoName = "agazati"; // ha máshova költözteted, ezt változtasd
const githubRawBase = `https://raw.githubusercontent.com/XxHaltiruXx/${repoName}/main/assets/images/`;

// ==== Segédfüggvények ====
function computeBasePath(repo) {
    const host = location.hostname;
    const path = location.pathname; // pl. "/agazati/page.html" vagy "/index.html"
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
    imgs.forEach(img => {
        const filename = img.getAttribute("data-filename") || img.src.split("/").pop();
        const fallback = githubRawBase + filename;
        img.onerror = function () {
            if (this.src !== fallback) this.src = fallback;
        };
    });
}

// ==== GitHub commit dátum lekérése (cache-elve 24h) ====
async function updateLastPushDate() {
    const timeEl = document.querySelector(".time");
    if (!timeEl) return;

    const cacheKey = "lastPushDate";
    const cacheExpiryKey = "lastPushDateExpiry";
    const now = Date.now();

    const cached = localStorage.getItem(cacheKey);
    const expiry = localStorage.getItem(cacheExpiryKey);

    if (cached && expiry && now < parseInt(expiry)) {
        timeEl.textContent = cached;
        return;
    }

    try {
        const res = await fetch(`https://api.github.com/repos/XxHaltiruXx/${repoName}/commits?per_page=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || !data[0] || !data[0].commit || !data[0].commit.committer) {
            throw new Error("Nincs elérhető commit adat");
        }

        const date = new Date(data[0].commit.committer.date);
        const formattedDate = date.toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        timeEl.textContent = formattedDate;

        localStorage.setItem(cacheKey, formattedDate);
        localStorage.setItem(cacheExpiryKey, (now + 24 * 60 * 60 * 1000).toString());
    } catch (err) {
        console.error("Nem sikerült lekérni a dátumot:", err);
        timeEl.textContent = "N/A";
    }
}

// ==== Footer létrehozása és betöltése ====
(function createFooter() {
    const imagePath = getImagePath();

    const footer = document.createElement("footer");
    footer.innerHTML = `
        <p>&copy; 2025 XxHaltiruXx. Minden jog fenntartva. Nem állunk kapcsolatban valós márkákkal.</p>
        <p>Verzió: <span class="version-number">1.0.0</span></p>
        <p>Utolsó frissítés: <span class="time">—</span></p>
        <hr class="black" />
        <h3>Kapcsolat</h3>
        <div class="contacts">
            <div>
                <a href="https://github.com/XxHaltiruXx/${repoName}" target="_blank" rel="noopener">
                    <img data-filename="github.svg" src="${imagePath}github.svg" alt="Github">
                    <p>Github</p>
                </a>
            </div>
    <div>
             <a href="https://trello.com/b/p69OnOBH/%C3%A1gazati" target="_blank" rel="noopener">
                    <img data-filename="trello.svg" src="${imagePath}trello.svg" alt="Trello">
                    <p>Trello</p>
                </a>
            </div>
    <div>
                <a href="mailto:agazati.info@gmail.com" target="_blank" rel="noopener">
                    <img id="mail" data-filename="mail.png" src="${imagePath}mail.png" alt="Email">
                    <p>Email</p>
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(footer);

    applyImageFallbacks(footer);
})();

// ==== Indítjuk a commit dátum lekérést ====
updateLastPushDate();