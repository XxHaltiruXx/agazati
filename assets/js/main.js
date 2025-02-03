// Keresés a navigációs menüben
function toggleNav() {
    const sidenav = document.getElementById("mySidenav");
    sidenav.style.width = sidenav.style.width === "250px" ? "0" : "250px";
}

// Kiemelések törlése (most nem szükséges)
function clearHighlights() {
    // Nincs szükség rá, mivel nem végzünk kiemelést.
}

// Szövegek kiemelése a teljes dokumentumban (most nem szükséges)
function highlightMatches(element, filter) {
    // Nem szükséges a kiemelés most, tehát nem használjuk
}

// Keresés a navigációs sávon
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("searchNav").addEventListener("input", function () {
        let filter = this.value.toLowerCase().trim();

        // Ha nincs semmi a keresőben, akkor töröljük a kiemeléseket (nem szükséges most)
        if (filter === "") {
            return;  // Nem kell semmit csinálni
        }

        // SideNav keresés (a navbaron történik a keresés)
        let links = document.querySelectorAll(".sidenav a");
        links.forEach(link => {
            // Csak akkor jelenjen meg, ha a szöveg tartalmazza a keresett szót
            link.style.display = link.textContent.toLowerCase().includes(filter) ? "" : "none";
        });
    });
});

// Kvíz kiértékelése
function evaluateQuiz() {
    // Helyes válaszok objektum
    const correctAnswers = {
        q1: "1848",
        q2: "Budapest",
        q3: "Jupiter"
    };

    let totalQuestions = Object.keys(correctAnswers).length;
    let correctCount = 0;
    let wrongAnswers = [];

    // Végigmegyünk a kérdéseken és ellenőrizzük a válaszokat
    for (let question in correctAnswers) {
        let selectedAnswer = document.querySelector(`input[name="${question}"]:checked`);
        
        if (selectedAnswer) {
            if (selectedAnswer.value === correctAnswers[question]) {
                correctCount++; // Helyes válaszok számolása
            } else {
                wrongAnswers.push({
                    question: document.querySelector(`input[name="${question}"]`).parentElement.parentElement.innerText.trim(),
                    userAnswer: selectedAnswer.value,
                    correctAnswer: correctAnswers[question]
                });
            }
        } else {
            wrongAnswers.push({
                question: document.querySelector(`input[name="${question}"]`).parentElement.parentElement.innerText.trim(),
                userAnswer: "Nem válaszolt",
                correctAnswer: correctAnswers[question]
            });
        }
    }

    let percentage = (correctCount / totalQuestions) * 100;
    let resultsDiv = document.getElementById("results");

    // Eredmény kiírása
    resultsDiv.innerHTML = `<p>Összpontszám: ${correctCount}/${totalQuestions} (${percentage.toFixed(2)}%)</p>`;

    if (wrongAnswers.length > 0) {
        resultsDiv.innerHTML += "<h3>Hibás válaszaid:</h3>";
        wrongAnswers.forEach(wrong => {
            resultsDiv.innerHTML += `<p><b>${wrong.question}</b><br> Te válaszod: ${wrong.userAnswer} <br> Helyes válasz: ${wrong.correctAnswer}</p>`;
        });
    } else {
        resultsDiv.innerHTML += "<p>Gratulálok! Minden válaszod helyes!</p>";
    }
}