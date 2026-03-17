document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("table-acteurs");
    if (table) {
        loadActeurs();
    }

    const form = document.getElementById("create-acteur-form");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const formData = new FormData(this);

            fetch("../php/create_acteur.php", {
                method: "POST",
                body: formData,
                credentials: "include"
            })
            .then(response => response.text()) 
            .then(text => {
                console.log("Réponse brute du serveur :", text); //  Affiche PHP reel
            
               
                const data = JSON.parse(text);
                alert(data.message);
                if (data.success) {
                    window.location.href = "../html/dashboard.html";
                }
            })
            .catch(error => console.error("Erreur AJAX :", error));
            
        });
    }
});

function loadActeurs() {
    fetch("../php/dashboard.php", {
        credentials: "include" 
    })
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector("#table-acteurs tbody");
            if (!tbody) return;

            tbody.innerHTML = "";
            data.forEach(acteur => {
                tbody.innerHTML += `
                    <tr>
                        <td>${acteur.id_acteur}</td>
                        <td>${acteur.nom || ""}</td>
                        <td>${acteur.prenom || ""}</td>
                        <td>${(acteur.age && acteur.age !== "null") ? acteur.age : ""}</td>
                        <td>${(acteur.role_entreprise && acteur.role_entreprise !== "null") ? acteur.role_entreprise : ""}</td>
                        <td>${(acteur.secteur && acteur.secteur !== "null") ? acteur.secteur : ""}</td>
                        <td>${acteur.id_acteur_superieur || "CEO"}</td>
                        <td>
                            <a class='btn btn-primary btn-sm' href='edit_acteur.html?id=${acteur.id_acteur}'>Modifier</a>
                            <button class='btn btn-danger btn-sm' onclick='removeActeur(${acteur.id_acteur})'>Supprimer</button>
                        </td>
                    </tr>
                `;

            });
        })
        .catch(error => console.error("Erreur lors du chargement :", error));
}

function removeActeur(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet acteur ?")) {
        fetch(`../php/remove_acteur.php?id_acteur=${id}`, {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.success) loadActeurs();
            })
            .catch(error => console.error("Erreur lors de la suppression :", error));
    }
}
