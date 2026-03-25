let cy;
let selectedTool = null;
let tempFromNode = null;
let selectedColor = null;
let deletedRelationIds = [];

let tempEdgeData = null;
let lastFrom = null;
let lastTo = null;

// Fonction pour l'effet de pulsation sur les éléments sélectionnés
function pulseNodes() {
    // On anime tous les nœuds sélectionnés (acteurs) pour qu'ils clignotent en rouge
    const selectedNodes = cy.nodes(':selected').filter(n => !n.data('isZone'));
    if (selectedNodes.length > 0) {
        selectedNodes.animate({
            style: { 'overlay-padding': 12, 'overlay-opacity': 0.1 }
        }, {
            duration: 800,
            complete: () => {
                selectedNodes.animate({
                    style: { 'overlay-padding': 0, 'overlay-opacity': 0.4 }
                }, {
                    duration: 800,
                    complete: pulseNodes
                });
            }
        });
    } else {
        setTimeout(pulseNodes, 500);
    }
}

function getPopupFormHTML(direction) {
    const isDouble = direction === "Double";
    return `
    <div id="relationForm" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid #0074D9; box-shadow: 0 0 15px rgba(0,0,0,0.3); z-index: 9999;">
      <h4>Détails de la relation</h4>
      <label>Type :</label>
      <input type="text" id="popupType" placeholder="ex: Influence, Amitié..." style="width:100%"><br><br>
      <label>Impact Source → Cible :</label>
      <select id="popupImpactSrcCible" style="width:100%">
        <option value="Faible">Faible</option>
        <option value="Moyen" selected>Neutre</option>
        <option value="Fort">Fort</option>
      </select><br><br>
      ${isDouble ? `
      <label>Impact Cible → Source :</label>
      <select id="popupImpactCibleSrc" style="width:100%">
        <option value="Faible">Faible</option>
        <option value="Moyen" selected>Neutre</option>
        <option value="Fort">Fort</option>
      </select><br><br>` : ''}
      <label>Nature :</label>
      <select id="popupNature" style="width:100%">
        <option value="Positive">Positive</option>
        <option value="Négative">Négative</option>
        <option value="Neutre" selected>Neutre</option>
      </select><br><br>
      <label>Durée :</label>
      <input type="text" id="popupDuree" placeholder="ex: 12 mois ou Relation longue" style="width:100%"><br><br>
      <button onclick="submitRelationDetails()">Valider</button>
      <button onclick="cancelRelation()">Annuler</button>
    </div>`;
}

function createRelationPopup(fromId, toId, direction) {
    if (document.getElementById("relationForm")) return;
    lastFrom = fromId;
    lastTo = toId;
    tempEdgeData = { id: "rel_" + Date.now(), source: fromId, target: toId, direction };
    document.body.insertAdjacentHTML("beforeend", getPopupFormHTML(direction));
}

function cancelRelation() {
    const form = document.getElementById("relationForm");
    if (form) form.remove();
    tempEdgeData = null;
}

function getColorByNature(nature) {
    switch (nature) {
        case 'Positive': return '#2ecc71';
        case 'Négative': return '#e74c3c';
        case 'Neutre': return '#95a5a6';
        default: return '#999';
    }
}

function getLineStyleByImpact(impact) {
    switch (impact) {
        case 'Faible': return { width: 2, style: 'dotted' };
        case 'Moyen': return { width: 5, style: 'solid' };
        case 'Fort': return { width: 8, style: 'solid' };
        default: return { width: 2, style: 'solid' };
    }
}

function submitRelationDetails() {
    const label = document.getElementById("popupType").value.trim();
    const impactSrcCible = document.getElementById("popupImpactSrcCible").value;
    const impactCibleSrc = document.getElementById("popupImpactCibleSrc") ? document.getElementById("popupImpactCibleSrc").value : null;
    const nature = document.getElementById("popupNature").value;
    const duree = document.getElementById("popupDuree").value.trim();
    const color = getColorByNature(nature);
    const styleSrc = getLineStyleByImpact(impactSrcCible);
    const styleCible = getLineStyleByImpact(impactCibleSrc);
    const uid = Date.now();
    const edgeData = { ...tempEdgeData, label: label.length <= 15 ? label : "", type_relation: label, direction: tempEdgeData.direction, impact_source_vers_cible: impactSrcCible, impact_cible_vers_source: impactCibleSrc, nature_relation: nature, duree_relation: duree, uid: uid };
    const edge = cy.add({ group: 'edges', data: edgeData });
    edge.style({ 'line-color': color, 'target-arrow-color': color, 'width': styleSrc.width, 'line-style': styleSrc.style });
    if (tempEdgeData.direction === "Double") {
        const reverseEdge = cy.add({ group: 'edges', data: { ...edgeData, id: edgeData.target + "-" + edgeData.source + "-" + Date.now(), source: edgeData.target, target: edgeData.source, label: "" } });
        reverseEdge.style({ 'line-color': color, 'target-arrow-color': color, 'width': styleCible.width, 'line-style': styleCible.style, 'curve-style': 'bezier' });
    }
    cancelRelation();
}

document.addEventListener("DOMContentLoaded", () => {
    cy = cytoscape({
        container: document.getElementById('cy'),
        boxSelectionEnabled: true,
        autounselectify: false, // Permet la sélection
        selectionType: 'additive', // TRÈS IMPORTANT : permet de cliquer sur plusieurs nœuds sans Ctrl
        elements: [],
        layout: { name: 'breadthfirst', directed: true },
        style: [
            {
                selector: 'node',
                style: {
                    'shape': 'round-rectangle', 'background-color': '#d6d8db', 'label': 'data(label)', 'color': '#222', 'text-valign': 'center', 'text-halign': 'center', 'border-color': '#999', 'border-width': 2, 'font-size': '16px', 'text-wrap': 'wrap', 'text-max-width': '160px', 'width': '160px', 'height': '60px', 'text-outline-color': '#fff', 'text-outline-width': 0.5
                }
            },
            {
                selector: 'edge',
                style: { 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'line-color': '#999', 'target-arrow-color': '#999', 'width': 2, 'label': 'data(label)', 'font-size': '10px' }
            },
            {
                selector: '.hierarchie',
                style: { 'line-color': '#666', 'target-arrow-color': '#666', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'width': 2, 'line-style': 'solid' }
            },
            {
                selector: '.zoneContour',
                style: { 'background-opacity': 0, 'border-width': 3, 'border-style': 'dashed', 'border-color': '#2ecc71', 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'font-size': 14, 'color': '#444' }
            },
            // STYLE DE SÉLECTION FORCÉ EN ROUGE
            {
                selector: 'node:selected',
                style: {
                    'border-color': '#e74c3c !important',
                    'border-width': 6,
                    'border-opacity': 1,
                    'overlay-color': '#e74c3c',
                    'overlay-padding': 0,
                    'overlay-opacity': 0.3
                }
            }
        ]
    });

    cy.ready(() => pulseNodes());

    Promise.all([
        fetch('../php/dashboard.php').then(res => res.json()),
        fetch('../php/get_relations_hierarchiques.php').then(res => res.json()),
        fetch('../php/get_relations_informelles.php').then(res => res.json())
    ])
    .then(([acteurs, relationsHierarchiques, relationsInformelles]) => {
        const hierarchyElements = [];
        acteurs.forEach(a => {
            hierarchyElements.push({
                data: { id: 'act_' + a.id_acteur, label: a.prenom + ' ' + a.nom, role_entreprise: a.role_entreprise || "Non défini", age: a.age || "Non précisé", secteur: a.secteur || "Non précisé", extraFields: a.extra_fields || [] }
            });
        });
        relationsHierarchiques.forEach(r => {
            hierarchyElements.push({
                data: { id: `link_${r.to}_${r.from}_${Date.now()}`, source: r.to, target: r.from, label: r.type || "" },
                classes: 'hierarchie'
            });
        });
        cy.add(hierarchyElements);
        cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.4, roots: cy.nodes().filter(node => cy.edges('[target = "' + node.id() + '"]').length === 0), animate: true, orientation: 'vertical' }).run();

        if (Array.isArray(relationsInformelles)) {
            const informelleElements = [];
            relationsInformelles.forEach(rel => {
                const color = getColorByNature(rel.nature_relation);
                const styleSrc = getLineStyleByImpact(rel.impact_source_vers_cible);
                const styleCible = getLineStyleByImpact(rel.impact_cible_vers_source);
                informelleElements.push({
                    data: { id: "rel_" + rel.uid, uid: rel.uid, source: rel.from, target: rel.to, label: rel.type_relation.length <= 15 ? rel.type_relation : "", type_relation: rel.type_relation, direction: rel.direction, impact_source_vers_cible: rel.impact_source_vers_cible, impact_cible_vers_source: rel.impact_cible_vers_source, nature_relation: rel.nature_relation, duree_relation: rel.duree_relation },
                    style: { 'line-color': color, 'target-arrow-color': color, 'width': styleSrc.width, 'line-style': styleSrc.style }
                });
                if (rel.direction === "Double") {
                    informelleElements.push({
                        data: { id: "rel_" + rel.uid + "_reverse", uid: rel.uid, source: rel.to, target: rel.from, label: " ", direction: rel.direction, impact_source_vers_cible: rel.impact_cible_vers_source, impact_cible_vers_source: rel.impact_source_vers_cible, nature_relation: rel.nature_relation, duree_relation: rel.duree_relation },
                        style: { 'line-color': color, 'target-arrow-color': color, 'width': styleCible.width, 'line-style': styleCible.style }
                    });
                }
            });
            cy.add(informelleElements);
        }
        setupMenu();

        cy.on('mouseover', 'node', (event) => {
            const node = event.target;
            if (node.data('isZone')) return;
            const content = `<strong>${node.data('label') || ''}</strong><br><strong>Rôle:</strong> ${node.data('role_entreprise') || "Non précisé"}<br><strong>Âge:</strong> ${node.data('age') || "Non précisé"}<br><strong>Secteur:</strong> ${node.data('secteur') || "Non précisé"}<br>${Array.isArray(node.data('extraFields')) ? node.data('extraFields').map(f => `<strong>${f.label}:</strong> ${f.value}<br>`).join('') : ''}`;
            const tooltip = document.createElement('div');
            tooltip.id = 'tooltipNode';
            tooltip.innerHTML = content;
            tooltip.style.position = 'fixed'; tooltip.style.top = (event.originalEvent.clientY + 10) + 'px'; tooltip.style.left = (event.originalEvent.clientX + 10) + 'px'; tooltip.style.background = '#fff'; tooltip.style.border = '1px solid #ccc'; tooltip.style.padding = '8px'; tooltip.style.boxShadow = '0px 0px 8px rgba(0,0,0,0.3)'; tooltip.style.zIndex = 10000; tooltip.style.maxWidth = '250px'; tooltip.style.fontSize = '12px';
            document.body.appendChild(tooltip);
        });
        cy.on('mouseout', 'node', () => { const tooltip = document.getElementById('tooltipNode'); if (tooltip) tooltip.remove(); });
    })
    .catch(err => console.error("Erreur de chargement :", err));
});

function setupMenu() {
    document.getElementById("linkSimpleBtn").onclick = () => { 
        selectedTool = "simple"; 
        tempFromNode = null; 
        cy.nodes().unselect(); // Nettoie la sélection quand on change d'outil
    };
    document.getElementById("linkDoubleBtn").onclick = () => { 
        selectedTool = "double"; 
        tempFromNode = null; 
        cy.nodes().unselect();
    };
    document.getElementById("deleteSelectedBtn").onclick = () => {
        if (confirm("Voulez-vous supprimer cette relation ?")) {
            const selected = cy.$(':selected');
            selected.forEach(el => {
                if (el.isEdge() && !el.hasClass("hierarchie")) {
                    const uid = el.data("uid");
                    if (uid && !deletedRelationIds.includes(uid)) {
                        deletedRelationIds.push(uid);
                        if (el.data("direction") === "Double") {
                            cy.edges().filter(e => e.data("uid") === uid && e.id() !== el.id()).remove();
                        }
                    }
                }
            });
            selected.remove();
        }
    };

    // GESTION DU CLIC SUR LES ACTEURS
    cy.on('tap', 'node', (e) => {
        const node = e.target;
        
        // Si on utilise l'outil couleur
        if (selectedColor) { 
            node.style('background-color', selectedColor); 
            selectedColor = null; 
            node.unselect();
            return; 
        }
        
        // Si on crée une relation (Flèche)
        if (selectedTool) {
            if (!tempFromNode) { 
                tempFromNode = node; 
                node.select(); // Marque le premier acteur en rouge
            } else {
                const from = tempFromNode.id(); 
                const to = node.id();
                if (from === to) { 
                    alert("Interdit de relier un acteur à lui-même."); 
                    tempFromNode = null; 
                    node.unselect();
                    return; 
                }
                createRelationPopup(from, to, selectedTool === "double" ? "Double" : "Simple");
                tempFromNode = null; 
                selectedTool = null;
                cy.nodes().unselect();
            }
        }
    });

    document.getElementById("saveGraphBtn").onclick = () => {
        const relationsToSave = [];
        cy.edges().forEach(edge => {
            if (!edge.hasClass("hierarchie")) {
                relationsToSave.push({
                    source: edge.source().id().replace("act_", ""), target: edge.target().id().replace("act_", ""), type_relation: edge.data("label") || "Non précisée", direction: edge.data("direction") || "Simple", impact_source_vers_cible: edge.data("impact_source_vers_cible") || "Moyen", impact_cible_vers_source: edge.data("impact_cible_vers_source") || "Moyen", nature_relation: edge.data("nature_relation") || "Neutre", duree_relation: edge.data("duree_relation") || 0
                });
            }
        });
        fetch("../php/save_relation_informelle.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ relations: relationsToSave, toDelete: deletedRelationIds }) })
        .then(res => res.json()).then(response => {
            alert(response.success ? `${response.relations_inserted} relation(s) enregistrée(s).` : `Erreur : ${response.error || 'inconnue'}`);
            deletedRelationIds = [];
        }).catch(err => { console.error("Erreur serveur :", err); alert("Problème de communication avec le serveur."); });
    };

    setupColorPanel();
}

function setupColorPanel() {
    const colors = ["#bdc3c7", "#58B19F", "#f8c291", "#82ccdd", "#f6b93b", "#F97F51", "#a29bfe", "#ff7675"];
    const panel = document.getElementById("colorPanel");
    if(!panel) return;
    panel.innerHTML = "";
    colors.forEach(color => {
        const btn = document.createElement("button");
        btn.className = "color-choice"; btn.style.backgroundColor = color; btn.title = color;
        btn.onclick = () => { selectedColor = color; };
        panel.appendChild(btn);
    });
}

function creerZoneContour(type = "alliance") {
    const selectedNodes = cy.nodes(":selected").filter(node => !node.data('isZone'));
    
    if (selectedNodes.length < 2) { 
        alert("Cliquez sur au moins deux acteurs (ils doivent être entourés de rouge) avant de cliquer ici."); 
        return; 
    }
    
    const boundingBox = selectedNodes.boundingBox();
    const idZone = "zone_" + Date.now();
    const couleur = type === "tension" ? "#e74c3c" : "#2ecc71";
    const etiquette = type === "tension" ? "TENSION - - -" : "ALLIANCE + + +";
    
    cy.add({ 
        group: 'nodes', 
        data: { id: idZone, label: etiquette, isZone: true }, 
        position: { x: (boundingBox.x1 + boundingBox.x2) / 2, y: (boundingBox.y1 + boundingBox.y2) / 2 } 
    });
    
    cy.$id(idZone).style({ 
        'shape': 'roundrectangle', 'width': boundingBox.w + 80, 'height': boundingBox.h + 80, 'background-opacity': 0, 'border-width': 3, 'border-color': couleur, 'border-style': 'dashed', 'label': etiquette, 'text-valign': 'top', 'text-halign': 'center', 'font-size': 14, 'color': '#444', 'z-compound-depth': 'bottom' 
    });

    // Optionnel : déselectionne tout après avoir créé la zone
    cy.nodes().unselect();
}

function supprimerZoneContour() {
    const zone = cy.nodes(":selected").filter(n => n.data('isZone') === true);
    if (zone.length === 0) { alert("Sélectionne une zone à supprimer (clique sur le bord de la zone)."); return; }
    zone.remove();
}

document.getElementById("submitToProfBtn").onclick = () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) { alert("Vous devez être connecté."); return; }
    const imageData = cy.png({ scale: 2, output: 'blob' });
    const formData = new FormData();
    formData.append("image", imageData, "graph_informel.png");
    formData.append("id_utilisateur", userId);
    formData.append("type_schema", "informelle");
    formData.append("nom", "graphe_informel_" + Date.now());
    fetch("../php/save_graph_with_image.php", { method: "POST", body: formData })
    .then(res => res.json()).then(data => {
        if (data.success) {
            alert("Graphe informel envoyé au professeur !");
            if (sessionStorage.getItem("role") === "prof") window.location.href = "../html/admin_view.html";
        } else { alert("Erreur : " + data.message); }
    }).catch(err => { console.error("Erreur :", err); alert("Erreur lors de l’envoi du graphe."); });
};