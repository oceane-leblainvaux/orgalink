fetch('../php/get_saved_graph.php')
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert("Erreur de chargement des schémas.");
      return;
    }
 
    const tbody = document.getElementById("schemaList");
    tbody.innerHTML = ""; // Nettoie le tableau avant remplissage
 
    data.schemas.forEach(schema => {
      const tr = document.createElement("tr");
 
      // Préparation de l'aperçu image
      const imagePreview = schema.nom_fichier
        ? `<img src="../schemas/img/${schema.nom_fichier}" style="max-width: 100px; display:block; margin: 0 auto 5px; border-radius:4px;" />`
        : "—";
 
      const downloadLink = schema.nom_fichier
        ? `<a href="../schemas/img/${schema.nom_fichier}" download style="color:#d38f4f; font-weight:bold;">Télécharger</a>`
        : "—";
 
      // VOIR : lien JSON pour les formels, trait pour les informels
      const actionVoir = schema.type_schema !== "informelle"
        ? `<a href="../schemas/${schema.nom}.json" target="_blank" style="color:#d38f4f;">Voir JSON</a>`
        : `—`;
 
      // REMODIFIER : bouton pour les informels, trait pour les autres
      let actionRemodifier;
      if (schema.type_schema === "informelle") {
        const nomPropre = schema.nom.replace(/\.png$/i, "");
        actionRemodifier = `<button class="btn-reload" onclick="reloadGraph('${nomPropre}')">✏️ Remodifier</button>`;
      } else {
        actionRemodifier = `—`;
      }
 
      // 8 colonnes : NOM | PRÉNOM | TYPE | DATE | TÉLÉCHARGER | VOIR | REMODIFIER | SUPPRIMER
      tr.innerHTML = `
        <td>${schema.nom_utilisateur || '—'}</td>
        <td>${schema.prenom || '—'}</td>
        <td>${schema.type_schema}</td>
        <td>${schema.date_time}</td>
        <td>
          ${imagePreview}
          ${downloadLink}
        </td>
        <td>${actionVoir}</td>
        <td>${actionRemodifier}</td>
        <td>
          <button onclick="deleteSchema(${schema.id_schema})" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">
            Supprimer
          </button>
        </td>
      `;
 
      tbody.appendChild(tr);
    });
  })
  .catch(err => console.error("Erreur fetch liste:", err));
 
function deleteSchema(id) {
  if (!confirm("Confirmer la suppression du schéma ?")) return;
 
  fetch('../php/delete_schema_prof.php', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id_schema: id })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Schéma supprimé !");
        location.reload();
      } else {
        alert("Erreur : " + data.message);
      }
    })
    .catch(err => {
      console.error("Erreur suppression:", err);
      alert("Erreur réseau.");
    });
}
 
function reloadGraph(nom) {
  // Nettoyage du nom au cas où il contiendrait encore une extension
  const nomPropre = nom.replace(/\.png$/i, "");
 
  // On stocke le nom nettoyé
  sessionStorage.setItem('loadGraphNom', nomPropre);
 
  // Vérification de l'existence du JSON avant redirection
  fetch('../php/get_graph_json.php?nom=' + encodeURIComponent(nomPropre))
    .then(res => {
      if (!res.ok) throw new Error("Réponse HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        window.location.href = '../html/test_graph.html';
      } else {
        sessionStorage.removeItem('loadGraphNom');
        alert("Erreur : " + (data.message || "Fichier JSON introuvable."));
      }
    })
    .catch(err => {
      sessionStorage.removeItem('loadGraphNom');
      console.error(err);
      alert("Erreur lors de la récupération du graphique.");
    });
} 