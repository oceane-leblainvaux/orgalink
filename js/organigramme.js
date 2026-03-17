var $ = go.GraphObject.make;
var myDiagram;

fetch('../php/get_user.php')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("role", data.role);
    } else {
      alert("Vous devez être connecté !");
      window.location.href = "../html/login.html";
    }
  });

function initDiagram(data) {
  myDiagram = $(go.Diagram, "diagramDiv", {
    layout: $(go.TreeLayout, {
      angle: 90,
      layerSpacing: 80,
      nodeSpacing: 30
    }),
    "undoManager.isEnabled": true,
    allowZoom: true,
    allowMove: true
  });

  //  Zoom  molette 
  myDiagram.toolManager.mouseWheelBehavior = "zoom";

  //  Nœud stylisé
  myDiagram.nodeTemplate =
  $(go.Node, "Auto",
    {
      click: (e, obj) => showModal(obj.part.data),
      cursor: "pointer"
    },
    $(go.Shape, "RoundedRectangle",
      {
        strokeWidth: 1,
        stroke: "#888",
        fill: "white"
      },
      new go.Binding("fill", "sector", getColorBySector)
    ),
    $(go.Panel, "Vertical",
      { margin: 8 },
      $(go.TextBlock,
        {
          font: "bold 14px 'Poppins', sans-serif",
          stroke: "#333"
        },
        new go.Binding("text", "text")),
      $(go.TextBlock,
        {
          font: "12px 'Poppins', sans-serif",
          stroke: "#555",
          margin: new go.Margin(2, 0, 0, 0),
          visible: false
        },
        new go.Binding("text", "role"),
        new go.Binding("visible", "role", function(role) {
          return role && role !== "Non défini";
        })
      )
    )
  );


  myDiagram.linkTemplate =
    $(go.Link,
      { routing: go.Link.Orthogonal, corner: 10 },
      $(go.Shape, { stroke: "#bbb", strokeWidth: 2 }),
      $(go.Shape, { toArrow: "Standard", fill: "#bbb", stroke: "#999" })
    );

  myDiagram.model = new go.TreeModel(data);
}

function getColorBySector(sector) {
  const colors = {
    informatique: "#82ccdd",
    vente: "#f8c291",
    finance: "#f6b93b",
    rh: "#d1ccc0",
    marketing: "#f5cd79"
  };
  return colors[sector?.toLowerCase()] || "#dcdde1";
}

function showModal(data) {
  const modal = document.getElementById("modal");
  document.getElementById("modal-title").innerText = data.text || "";
  document.getElementById("modal-role").value = data.role || "";
  document.getElementById("modal-age").value = data.age || "";
  document.getElementById("modal-sector").value = data.sector || "";

  const customZone = document.getElementById("modal-custom");
  customZone.innerHTML = "";
  (data.extraFields || []).forEach(({ label, value }) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${label}</label>
      <input type="text" data-label="${label}" value="${value}">
    `;
    customZone.appendChild(div);
  });

  document.getElementById("save-btn").onclick = () => {
    data.role = document.getElementById("modal-role").value;
    data.age = document.getElementById("modal-age").value;
    data.sector = document.getElementById("modal-sector").value;

    const extraInputs = modal.querySelectorAll("#modal-custom input");
    data.extraFields = Array.from(extraInputs).map(input => ({
      label: input.dataset.label,
      value: input.value
    }));

    myDiagram.model.updateTargetBindings(data);

    console.log("Données envoyées vers serveur :", {
      id_acteur: data.key,
      role_entreprise: data.role,
      age: data.age,
      secteur: data.sector,
      extraFields: data.extraFields
    });


    // Envoi vers la BDD
    fetch("../php/save_actor_fields.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_acteur: data.key, //  key dans l'organigramme
        role_entreprise: data.role,
        age: data.age,
        secteur: data.sector,
        extraFields: data.extraFields
      })
    })
    .then(res => res.json())
    .then(result => {
      if (!result.success) {
        alert("Erreur lors de la sauvegarde : " + result.message);
      }
    })
    .catch(err => {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur serveur.");
    });

    closeModal();
};


  document.getElementById("add-field-btn").onclick = () => {
    const label = prompt("Nom du champ :");
    if (label) {
      const div = document.createElement("div");
      div.innerHTML = `
        <label>${label}</label>
        <input type="text" data-label="${label}">
      `;
      customZone.appendChild(div);
    }
  };

  modal.style.display = "block";

  // Fermer au clic extérieur
  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function saveGraph() {
  console.log(" saveGraph() appelée !");
  const userId = sessionStorage.getItem("userId");
  if (!userId) {
    alert("Non connecté !");
    return;
  }

  const imageDataURL = myDiagram.makeImageData({ scale: 1, background: "white" });

  const blob = dataURLToBlob(imageDataURL); // Convertit la Data URL en Blob

  const formData = new FormData();
  formData.append("image", blob, "organigramme.png");
  formData.append("id_utilisateur", userId);
  formData.append("type_schema", "hierarchique");
  formData.append("nom", "organigramme_" + Date.now());

  fetch("../php/save_graph_with_image.php", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Organigramme enregistré avec succès !");
        const role = sessionStorage.getItem("role");
        if (role === "prof") {
          window.location.href = "../html/admin_view.html";
        }
      } else {
        alert("Erreur : " + data.message);
      }
    })
    .catch(err => {
      console.error("Erreur :", err);
      alert("Échec de l'enregistrement.");
    });
}

function dataURLToBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

function graph_informel() {
  window.location.href = "../html/test_graph.html";
}

fetch('../php/dashboard.php')
  .then(response => response.json())
  .then(data => {
    const formatted = data.map(p => ({
      key: String(p.id_acteur),
      text: `${p.prenom} ${p.nom}`,
      role: p.role_entreprise || "Non défini",
      age: p.age || "Non précisé",
      sector: p.secteur || "Non précisé",
      parent: p.id_acteur_superieur ? String(p.id_acteur_superieur) : undefined,
      extraFields: p.extra_fields || []
    }));
    initDiagram(formatted);
  })
  .catch(err => console.error("Erreur chargement données:", err));

function zoomIn() {
if (myDiagram) {
    myDiagram.commandHandler.increaseZoom();
}
}

function zoomOut() {
if (myDiagram) {
    myDiagram.commandHandler.decreaseZoom();
}
}

document.addEventListener("DOMContentLoaded", () => {
  console.log(" JS charg");

  const saveBtn = document.getElementById("saveGraphBtn");
  if (saveBtn) {
    console.log(" Bouton trouvé, ajout de l'action");
    saveBtn.onclick = saveGraph;
  } else {
    console.log(" Bouton NON trouvé !");
  }
});


