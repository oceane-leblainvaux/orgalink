document.addEventListener("DOMContentLoaded", () => {
    // Co/Déco
    const authContainer = document.getElementById("authButtons");
    const userId = sessionStorage.getItem("userId");
    const prenom = sessionStorage.getItem("prenom") || "Utilisateur";

    if (authContainer) {
        if (userId) {
            authContainer.innerHTML = `
                <span style="color:white; margin-right:10px;">Bonjour ${prenom}</span>
                <button id="logoutBtn" style="background:none; border:none; cursor:pointer; color:white; font-size:16px;">
                    Se déconnecter
                </button>
            `;
            document.getElementById("logoutBtn").addEventListener("click", () => {
                sessionStorage.removeItem("userId");
                sessionStorage.removeItem("prenom");
                window.location.href = "../php/logout.php";
            });
        } else {
            authContainer.innerHTML = `
                <a href="../html/login.html" id="loginBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 
                        10-4.477 10-10S17.523 2 12 2zm0 2 
                        c1.656 0 3 1.344 3 3s-1.344 3-3 3 
                        -3-1.344-3-3 1.344-3 3-3zm0 
                        16a7.978 7.978 0 0 1-6-2.688 
                        c.03-1.992 4-3.094 6-3.094s5.97 
                        1.102 6 3.094A7.978 7.978 0 0 1 12 20z"/>
                    </svg>
                </a>
            `;
        }
    }

    //Menu déroulant
    const openMenu = document.getElementById("openMenu");
    const menuDialog = document.getElementById("menuDialog");

    if (openMenu && menuDialog) {
        // Toggle menu on click
        openMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            menuDialog.classList.toggle("show");
        });

        // Fermer au clic hors du menu
        document.addEventListener("click", (e) => {
            const clickedOutside = !menuDialog.contains(e.target) && !openMenu.contains(e.target);
            if (menuDialog.classList.contains("show") && clickedOutside) {
                menuDialog.classList.remove("show");
            }
        });

        // Fermer si on clique sur un lien dans le menu
        menuDialog.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                menuDialog.classList.remove("show");
            });
        });
    }
});
