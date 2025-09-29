// ==== Konfig ====
const repoName = "agazati"; // ha máshova költözteted, ezt változtasd
const githubRawBase = `https://raw.githubusercontent.com/XxHaltiruXx/${repoName}/main/assets/images/`;

// ==== Segédfüggvények ====
function computeBasePath(repo) {
    const host = location.hostname;
    const path = location.pathname; // pl. "/agazati/page.html" vagy "/index.html"
    let base = "";

    // GitHub Pages: username.github.io/repo/ => parts[1] === repo
    if (host.includes("github.io")) {
        const parts = path.split("/");
        if (parts[1] === repo) base = `/${repo}`;
        // ha user site (username.github.io) akkor base lesz ""
    } else {
        // Egyéb host: ha az URL-ben szerepel a repoName, vegyük mint base (pl fejlesztésnél)
        const m = path.match(new RegExp(`(/${repo})(/|$)`));
        if (m) base = m[1];
    }

    // Normalizálás: ne legyen végén dupla /
    if (base.endsWith("/")) base = base.slice(0, -1);
    return base;
}

function getImagePath() {
    const base = computeBasePath(repoName);
    // ha base üres => gyökérrel dolgozunk ("/assets/images/...")
    return `${base}/assets/images/`;
}

// beállítja az onerror fallbacket minden kép elemre ami a footerben van
function applyImageFallbacks(container) {
    const imgs = container.querySelectorAll("img");
    imgs.forEach(img => {
        // ha a src nem létezik vagy hibára fut, cseréljük a raw.githubusercontent URL-re
        const filename = img.getAttribute("data-filename") || img.src.split("/").pop();
        const fallback = githubRawBase + filename;
        img.onerror = function () {
            if (this.src !== fallback) this.src = fallback;
        };
    });
}

// ==== GitHub commit dátum lekérése ====
async function updateLastPushDate() {
    try {
        const res = await fetch("https://api.github.com/repos/XxHaltiruXx/agazati/commits?per_page=1");
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

        const timeEl = document.querySelector(".time");
        if (timeEl) timeEl.textContent = formattedDate;
    } catch (err) {
        console.error("Nem sikerült lekérni a dátumot:", err);
        const timeEl = document.querySelector(".time");
        if (timeEl) timeEl.textContent = "N/A";
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
                <a href="mailto:agazati.info@gmail.com" target="_blank" rel="noopener">
                    <img id="mail" data-filename="mail.png" src="${imagePath}mail.png" alt="Email">
                    <p>Email</p>
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(footer);

    // alkalmazzuk a fallback logikát: ha a relatív kép nem elérhető -> raw.githubusercontent
    applyImageFallbacks(footer);
})();

// ==== Indítjuk a commit dátum lekérést ====
updateLastPushDate();