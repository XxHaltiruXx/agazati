

// Footer generálása
const footer = document.createElement('footer');
footer.innerHTML = `
    <p>&copy; 2025 XxHaltiruXx. All Rights Reserved. We do not have affiliation with any real world brands.</p>
    <p>Version: <span class="version-number">1.0.0</span></p>
    <hr class="black" />
    <h3>Contacts</h3>
    <div class="contacts">
        <div>
            <a href="https://github.com/XxHaltiruXx/agazati" target="_blank">
                <img src="../images/github.svg">
                <p>Github</p>
            </a>
        </div>
        <div>
            <a href="mailto:agazati.info@gmail.com" target="_blank">
                <img id="mail" src="../images/mail.png">
                <p>Email</p>
            </a>
        </div>
    </div>
`;

// Footer hozzáadása az oldalhoz
document.body.appendChild(footer);

// Verziószám frissítése (opcionális)
const versionNumber = footer.querySelector('.version-number');
versionNumber.textContent = '1.2.4'; // Dinamikusan módosíthatod