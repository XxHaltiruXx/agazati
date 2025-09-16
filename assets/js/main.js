const APP_VERSION = "1.3.1";

// Verziószám frissítése
document.addEventListener('DOMContentLoaded', function() {
    const versionElements = document.querySelectorAll('.version-number');
    versionElements.forEach(element => {
        element.textContent = APP_VERSION;
    });
});

// Keresés a navigációs menüben
function toggleNav() {
    const sidenav = document.getElementById("mySidenav");
    sidenav.style.width = sidenav.style.width === "250px" ? "0" : "250px";
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("searchNav").addEventListener("input", function () {
        let filter = this.value.toLowerCase().trim();
        let links = document.querySelectorAll(".sidenav a");

        if (filter === "") {
            // Ha a keresőmező üres, minden linket visszaállítunk láthatóra
            links.forEach(link => {
                link.style.display = "";
            });
            return;
        }

        // Szűrés a megadott keresési feltétel alapján
        links.forEach(link => {
            link.style.display = link.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
    });
});

function evaluateQuiz() {
    // Helyes válaszok objektum
    const correctAnswers = {
        q1: "Weboldal szerkezet",
        q2: "Stílus fájlok",
        q3: "Térközt ad a tartalom köré",
        q4: "Rugalmas elrendezés",
        q5: "Weboldal struktúra"
    };

    let totalQuestions = Object.keys(correctAnswers).length;
    let correctCount = 0;
    let wrongAnswers = [];

    // Végigmegyünk a kérdéseken és ellenőrizzük a válaszokat
    Object.keys(correctAnswers).forEach((question, index) => {
        let selectedAnswer = document.querySelector(`input[name="${question}"]:checked`);
        let questionNumber = index + 1; // A kérdés száma

        if (selectedAnswer) {
            if (selectedAnswer.value === correctAnswers[question]) {
                correctCount++; // Helyes válaszok számolása
            } else {
                wrongAnswers.push({
                    questionNumber: questionNumber,
                    userAnswer: selectedAnswer.value,
                    correctAnswer: correctAnswers[question]
                });
            }
        } else {
            wrongAnswers.push({
                questionNumber: questionNumber,
                userAnswer: "Nem válaszolt",
                correctAnswer: correctAnswers[question]
            });
        }
    });

    let percentage = (correctCount / totalQuestions) * 100;
    let resultsDiv = document.getElementById("results");

    // Hibás válaszok kiírása
    if (wrongAnswers.length > 0) {
        resultsDiv.innerHTML = "<h3>Hibás válaszaid:</h3>";
        wrongAnswers.forEach(wrong => {
            resultsDiv.innerHTML += `<p><b>${wrong.questionNumber}. kérdés</b><br> Te válaszod: ${wrong.userAnswer} <br> Helyes válasz: ${wrong.correctAnswer}</p>`;
        });
    } else {
        resultsDiv.innerHTML = "<p>Gratulálok! Minden válaszod helyes!</p>";
    }

    // Összegzés hozzáadása a végén
    resultsDiv.innerHTML += `<p style="text-align: right;">Összpontszám: ${correctCount}/${totalQuestions} (${percentage.toFixed(2)}%)</p>`;

    resultsDiv.style.display = "block";
}


// Beállítások modális megnyitása
function openSettingsModal() {
    let modal = document.getElementById("settingsModal");
    // let overlay = document.getElementById("overlay");

    modal.style.display = "flex";
    // overlay.style.display = "block";

    // ESC gombbal bezárás
    document.addEventListener("keydown", closeOnEscape);
}

// Modális ablak bezárása
function closeSettingsModal() {
    let modal = document.getElementById("settingsModal");
    // let overlay = document.getElementById("overlay");

    modal.style.display = "none";
    // overlay.style.display = "none";

    // Eltávolítjuk az eseményfigyelőt az ESC gombra
    document.removeEventListener("keydown", closeOnEscape);
}

// ESC gombbal való bezárás
function closeOnEscape(event) {
    if (event.key === "Escape") {
        closeSettingsModal();
    }
}

// Színválasztók megnyitása
function toggleColorPicker(id) {
    let input = document.getElementById(id);
    input.click();
}

// COOKIE HELPER FUNCTIONS (frissített változat)
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};${expires};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const cookieArr = document.cookie.split(';');
    for(let i = 0; i < cookieArr.length; i++) {
        const cookiePair = cookieArr[i].split('=');
        if(name === cookiePair[0].trim()) {
            return JSON.parse(decodeURIComponent(cookiePair[1]));
        }
    }
    return null;
}

// SETTINGS LOGIC (javított verzió)
const defaultSettings = {
    gradientStart: '#3e4551',
    gradientEnd: '#000000',
    textColor: 'aliceblue',
    titleColor: 'aliceblue'
};

function loadSettings() {
    try {
        const saved = getCookie('userSettings') || defaultSettings;
        
        document.documentElement.style.setProperty('--gradient-start', saved.gradientStart);
        document.documentElement.style.setProperty('--gradient-end', saved.gradientEnd);
        document.documentElement.style.setProperty('--text-color', saved.textColor);
        document.documentElement.style.setProperty('--title-color', saved.titleColor);
        
        document.getElementById('gradientStart').value = saved.gradientStart;
        document.getElementById('gradientEnd').value = saved.gradientEnd;
        document.getElementById('textColor').value = saved.textColor;
        document.getElementById('titleColor').value = saved.titleColor;
        
        // Force background update
        document.body.style.background = `linear-gradient(-60deg, 
            ${saved.gradientStart} 24%, 
            ${saved.gradientEnd} 100%
        )`;
    } catch(e) {
        console.error('Hiba a beállítások betöltésekor:', e);
        resetSettings();
    }
}

function saveSettings() {
    const settings = {
        gradientStart: document.getElementById('gradientStart').value,
        gradientEnd: document.getElementById('gradientEnd').value,
        textColor: document.getElementById('textColor').value,
        titleColor: document.getElementById('titleColor').value
    };
    
    setCookie('userSettings', settings);
    loadSettings(); // Azonnali frissítés
}

function resetSettings() {
    setCookie('userSettings', defaultSettings);
    loadSettings();
}

// INICIALIZÁLÁS (fontos!)
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Automatikus mentés színváltozáskor
    document.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('change', saveSettings);
    });
});

// Presetek kezelése
window.applyPreset = function(preset) {
    const presets = {
        red: {
            gradientStart: '#000000',
            gradientEnd: '#ff0000',
            textColor: '#ffffff',
            titleColor: '#ffffff'
        },
        blue: {
            gradientStart: '#000000',
            gradientEnd: '#0000ff',
            textColor: '#ffffff',
            titleColor: '#ffffff'
        },
        dark: {
            gradientStart: '#000000',
            gradientEnd: '#333333',
            textColor: '#ffffff',
            titleColor: '#cccccc'
        },
        matrix: {
            gradientStart: '#000000',
            gradientEnd: '#00ff00',
            textColor: '#ffffff',
            titleColor: '#ffffff'
        }
    };
    
    
    if(presets[preset]) {
        setCookie('userSettings', presets[preset]);
        loadSettings();
    }
};

window.onload = function() {
    document.body.style.opacity = '1';
    loadSettings();
}

function copyText(button) {
    const codeBlock = button.parentElement.querySelector('code');
    const textArea = document.createElement('textarea');
    textArea.value = codeBlock.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    showCopyNotification('Kód másolva!');
}

function showCopyNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2000);
}