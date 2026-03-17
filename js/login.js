document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        fetch("../php/login.php", {
            method: "POST",
            body: formData,
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            const data = JSON.parse(text);
            if (data.success) {
                // Stocker l'utilisateur co
                sessionStorage.setItem("userId", data.userId);
                sessionStorage.setItem("prenom", data.prenom); 
                // Renvoi vers l'accueil
                window.location.href = "../html/index.html";
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Erreur AJAX :", error);
            alert("Une erreur est survenue.");
        });
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const dialog = document.getElementById("menuDialog");
    if (dialog && dialog.open) {
        dialog.close();
    }

    const openButton = document.querySelector("#openMenu");
    if (openButton && dialog) {
        openButton.addEventListener("click", () => {
            if (!dialog.open) {
                dialog.showModal();
            } else {
                dialog.close();
            }
        });

        dialog.addEventListener("click", ({ target }) => {
            if (target.nodeName === "DIALOG") {
                dialog.close("dismiss");
            }
        });
    }
});
