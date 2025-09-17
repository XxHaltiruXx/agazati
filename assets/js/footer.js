async function updateLastPushDate() {
    try {
        const res = await fetch("https://api.github.com/repos/XxHaltiruXx/agazati/commits?per_page=1");
        const data = await res.json();
        const date = new Date(data[0].commit.committer.date);

        const formattedDate = date.toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        document.querySelector(".time").textContent = formattedDate;
    } catch (err) {
        console.error("Nem sikerült lekérni a dátumot:", err);
        document.querySelector(".time").textContent = "N/A";
    }
}

updateLastPushDate();

// --- Képek elérési útjának meghatározása meta alapján ---
const metaDescription = document.querySelector('meta[name="description"]');
const isMainPage = metaDescription && metaDescription.content === "Agazati - Főoldal";

// Ha főoldal, akkor "assets/images/", ha aloldal, akkor "../assets/images/"
const imagePath = isMainPage ? "assets/images/" : "../assets/images/";

// Footer elem létrehozása
const footer = document.createElement('footer');
footer.innerHTML = `
    <p>&copy; 2025 XxHaltiruXx. Minden jog fenntartva. Nem állunk kapcsolatban valós márkákkal.</p>
    <p>Verzió: <span class="version-number"></span></p>
    <p>Utolsó frissítés: <span class="time"></span></p>
    <hr class="black" />
    <h3>Kapcsolat</h3>
    <div class="contacts">
        <div>
            <a href="https://github.com/XxHaltiruXx/agazati" target="_blank">
                <img src="${imagePath}github.svg" alt="Github">
                <p>Github</p>
            </a>
        </div>
        <div>
            <a href="mailto:agazati.info@gmail.com" target="_blank">
                <img id="mail" src="${imagePath}mail.png" alt="Email">
                <p>Email</p>
            </a>
        </div>
    </div>
`;

document.body.appendChild(footer);
