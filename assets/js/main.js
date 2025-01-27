function toggleNav() {
            const sidenav = document.getElementById("mySidenav");
            if (sidenav.style.width === "250px") {
                sidenav.style.width = "0";
            } else {
                sidenav.style.width = "250px";
            }
        }