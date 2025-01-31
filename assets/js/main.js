function toggleNav() {
    const sidenav = document.getElementById("mySidenav");
    if (sidenav.style.width === "250px") {
        sidenav.style.width = "0";
    } else {
        sidenav.style.width = "250px";
    }
}

function clearHighlights() {
    document.querySelectorAll('.highlight').forEach(el => {
        el.outerHTML = el.innerHTML;
    });
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("searchNav").addEventListener("input", function () {
        let filter = this.value.toLowerCase();

        // SideNav keresés
        let links = document.querySelectorAll(".sidenav a");
        links.forEach(link => {
            link.style.display = link.textContent.toLowerCase().includes(filter) ? "" : "none";
        });

        // Teljes oldal keresés
        clearHighlights();
        if (filter.trim() !== "") {
            document.querySelectorAll("main h3, main p").forEach(el => {
                let text = el.textContent.toLowerCase();
                if (text.includes(filter)) {
                    let regex = new RegExp(`(${filter})`, "gi");
                    el.innerHTML = el.textContent.replace(regex, `<span class="highlight">$1</span>`);
                }
            });
        }
    });
});