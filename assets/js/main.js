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
