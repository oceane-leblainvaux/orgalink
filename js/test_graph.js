let cy;
let selectedTool = null;

function removeContextMenu() {
    const existing = document.getElementById('nodeContextMenu');
    if (existing) existing.remove();
}
let tempFromNode = null;
let selectedColor = null;
let deletedRelationIds = [];
 
let tempEdgeData = null;
let lastFrom = null;
let lastTo = null;
 
// Fonction pour l'effet de pulsation sur les éléments sélectionnés
function pulseNodes() {
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

// =====================================================================
// SOULIGNEMENT : génère une ligne SVG en background-image du nœud
// Cytoscape.js ne supporte pas text-decoration nativement.
// =====================================================================
function applyUnderline(node, thickness) {
    const label = node.data('label') || '';
    const fontWeight = node.data('fontBoldValue') || 400;
    const nodeW = parseFloat(node.style('width')) || 160;
    const nodeH = parseFloat(node.style('height')) || 60;

    if (thickness === 0) {
        node.removeStyle('background-image background-width background-height background-fit background-clip background-position-x background-position-y');
        return;
    }

    const charWidth = fontWeight >= 600 ? 9 : 8;
    const textWidth = Math.min(label.length * charWidth, nodeW - 20);
    const textX = nodeW / 2;
    const textY = nodeH / 2 + 14;

    // Cytoscape retourne la couleur en "rgb(r, g, b)" — on convertit en hex
    function cyColorToHex(cyColor) {
        if (!cyColor) return '#222222';
        if (cyColor.startsWith('#')) return cyColor;
        const match = cyColor.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (match) {
            return '#' + [match[1], match[2], match[3]]
                .map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        }
        return '#222222';
    }

    const lineColor = cyColorToHex(node.style('color'));

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${nodeW}' height='${nodeH}'>`
        + `<line x1='${textX - textWidth / 2}' y1='${textY}' x2='${textX + textWidth / 2}' y2='${textY}' `
        + `stroke='${lineColor}' stroke-width='${thickness}' stroke-linecap='round'/>`
        + `</svg>`;

    const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    node.style({
        'background-image': encoded,
        'background-width': nodeW + 'px',
        'background-height': nodeH + 'px',
        'background-fit': 'none',
        'background-clip': 'none',
        'background-position-x': '0px',
        'background-position-y': '0px'
    });
}
// =====================================================================

// =====================================================================
// ADAPTATION DE LA TAILLE DU NŒUD AU LABEL
// =====================================================================
function fitNodeToLabel(node, shape) {
    const label    = node.data('label') || '';
    const weight   = node.data('fontBoldValue') || 400;
    const fontSize = 16;

    const charW = weight >= 700 ? fontSize * 0.65
                : weight >= 500 ? fontSize * 0.58
                :                 fontSize * 0.52;

    const rawTextW = label.length * charW;
    const paddingH = 32;
    const minW     = 80;
    const maxW     = 280;
    const textW    = Math.max(minW, Math.min(rawTextW + paddingH, maxW));

    const baseH  = 60;
    const lines  = Math.ceil(rawTextW / (maxW - paddingH));
    const lineH  = fontSize * 1.4;
    const totalH = Math.max(baseH, lines * lineH + 20);

    const s = shape || node.style('shape') || 'round-rectangle';

    if (s === 'triangle' || s === 'pentagon') {
        const side = Math.max(textW, totalH, 80);
        node.style({ width: side + 'px', height: side + 'px' });
    } else if (s === 'diamond') {
        node.style({ width: Math.max(textW * 1.3, 100) + 'px', height: Math.max(totalH * 1.4, 80) + 'px' });
    } else if (s === 'ellipse') {
        node.style({ width: Math.max(textW * 1.1, 100) + 'px', height: Math.max(totalH, 50) + 'px' });
    } else {
        node.style({ width: textW + 'px', height: totalH + 'px' });
    }

    const undVal = node.data('fontUnderlineWidth') || 0;
    if (undVal > 0) applyUnderline(node, undVal);
}
// =====================================================================
 
function getPopupFormHTML(direction) {
    const isDouble = direction === "Double";
    return `
    <div id="relationForm" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15,18,35,0.98); padding: 24px; border: 1px solid rgba(211,143,79,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.7); z-index: 9999; border-radius: 12px; width: 340px; font-family: Montserrat, sans-serif; color: white;">
      <h4 style="margin:0 0 18px; color:#d38f4f; font-family:Rajdhani,sans-serif; text-transform:uppercase; letter-spacing:0.06em; font-size:16px;">Détails de la relation</h4>
      <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Type :</label>
      <input type="text" id="popupType" placeholder="ex: Influence, Amitié..." style="width:100%; padding:8px 10px; margin:5px 0 14px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:white; font-family:Montserrat,sans-serif; font-size:13px; box-sizing:border-box;"><br>
      <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Impact Source → Cible :</label>
      <select id="popupImpactSrcCible" style="width:100%; padding:8px 10px; margin:5px 0 14px; background:rgba(30,33,50,0.98); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:white; font-family:Montserrat,sans-serif; font-size:13px; box-sizing:border-box;">
        <option value="Faible">Faible</option>
        <option value="Moyen" selected>Neutre</option>
        <option value="Fort">Fort</option>
      </select><br>
      ${isDouble ? `
      <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Impact Cible → Source :</label>
      <select id="popupImpactCibleSrc" style="width:100%; padding:8px 10px; margin:5px 0 14px; background:rgba(30,33,50,0.98); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:white; font-family:Montserrat,sans-serif; font-size:13px; box-sizing:border-box;">
        <option value="Faible">Faible</option>
        <option value="Moyen" selected>Neutre</option>
        <option value="Fort">Fort</option>
      </select><br>` : ''}
      <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Nature :</label>
      <select id="popupNature" style="width:100%; padding:8px 10px; margin:5px 0 14px; background:rgba(30,33,50,0.98); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:white; font-family:Montserrat,sans-serif; font-size:13px; box-sizing:border-box;">
        <option value="Positive">Positive</option>
        <option value="Négative">Négative</option>
        <option value="Neutre" selected>Neutre</option>
      </select><br>
      <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Description :</label>
      <textarea id="popupDescription" placeholder="Décrivez la nature de cette relation..." style="width:100%; padding:8px 10px; margin:5px 0 18px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:white; font-family:Montserrat,sans-serif; font-size:13px; box-sizing:border-box; resize:vertical; min-height:80px;"></textarea><br>
      <div style="display:flex; gap:10px;">
        <button onclick="submitRelationDetails()" style="flex:1; padding:10px; background:linear-gradient(135deg,#d38f4f,#b8762f); color:white; border:none; border-radius:7px; cursor:pointer; font-family:Montserrat,sans-serif; font-weight:700; font-size:13px;">Valider</button>
        <button onclick="cancelRelation()" style="flex:1; padding:10px; background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.12); border-radius:7px; cursor:pointer; font-family:Montserrat,sans-serif; font-weight:600; font-size:13px;">Annuler</button>
      </div>
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
    const description = document.getElementById("popupDescription") ? document.getElementById("popupDescription").value.trim() : "";
    const color = getColorByNature(nature);
    const styleSrc = getLineStyleByImpact(impactSrcCible);
    const styleCible = getLineStyleByImpact(impactCibleSrc);
    const uid = Date.now();
    
    const edgeData = { ...tempEdgeData, label: "", type_relation: label, direction: tempEdgeData.direction, impact_source_vers_cible: impactSrcCible, impact_cible_vers_source: impactCibleSrc, nature_relation: nature, description_relation: description, uid: uid };
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
        autounselectify: false,
        selectionType: 'additive',
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
                style: { 
                    'curve-style': 'bezier', 
                    'target-arrow-shape': 'triangle', 
                    'line-color': '#999', 
                    'target-arrow-color': '#999', 
                    'width': 2, 
                    'label': '',
                    'font-size': '0px'
                }
            },
            {
                selector: '.hierarchie',
                style: { 'line-color': '#666', 'target-arrow-color': '#666', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'width': 2, 'line-style': 'solid' }
            },
            {
                selector: '.zoneContour',
                style: { 'background-opacity': 0, 'border-width': 3, 'border-style': 'dashed', 'border-color': '#2ecc71', 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'font-size': 14, 'color': '#444' }
            },
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
                    data: { id: "rel_" + rel.uid, uid: rel.uid, source: rel.from, target: rel.to, label: rel.type_relation.length <= 15 ? rel.type_relation : "", type_relation: rel.type_relation, direction: rel.direction, impact_source_vers_cible: rel.impact_source_vers_cible, impact_cible_vers_source: rel.impact_cible_vers_source, nature_relation: rel.nature_relation, description_relation: rel.description_relation, duree_relation: rel.duree_relation },
                    style: { 'line-color': color, 'target-arrow-color': color, 'width': styleSrc.width, 'line-style': styleSrc.style }
                });
                if (rel.direction === "Double") {
                    informelleElements.push({
                        data: { id: "rel_" + rel.uid + "_reverse", uid: rel.uid, source: rel.to, target: rel.from, label: " ", direction: rel.direction, impact_source_vers_cible: rel.impact_cible_vers_source, impact_cible_vers_source: rel.impact_source_vers_cible, nature_relation: rel.nature_relation, description_relation: rel.description_relation, duree_relation: rel.duree_relation },
                        style: { 'line-color': color, 'target-arrow-color': color, 'width': styleCible.width, 'line-style': styleCible.style }
                    });
                }
            });
            cy.add(informelleElements);
        }

        // Adapter la taille des nœuds acteurs à leur label + restaurer le soulignement
        cy.nodes().forEach(node => {
            if (node.data('isZone')) return;
            fitNodeToLabel(node);
            const undVal = node.data('fontUnderlineWidth');
            if (undVal && undVal > 0) applyUnderline(node, undVal);
        });

        setupMenu();
 
        // TOOLTIP NODES
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

        // TOOLTIP FLÈCHES (EDGES)
        cy.on('mouseover', 'edge', (event) => {
            const edge = event.target;
            if (edge.hasClass('hierarchie')) return;

            const desc = edge.data('description_relation') || "Pas de description renseignée.";
            const type = edge.data('type_relation') || "Relation";
            const nature = edge.data('nature_relation') || "Neutre";

            const tooltip = document.createElement('div');
            tooltip.id = 'tooltipEdge';
            tooltip.innerHTML = `
                <div style="border-bottom: 1px solid #d38f4f; margin-bottom: 5px; padding-bottom: 3px; font-weight: bold; color: #d38f4f;">
                    ${type.toUpperCase()} (${nature})
                </div>
                <div style="font-style: italic;">${desc}</div>
            `;
            
            Object.assign(tooltip.style, {
                position: 'fixed',
                top: (event.originalEvent.clientY + 15) + 'px',
                left: (event.originalEvent.clientX + 15) + 'px',
                background: 'rgba(15, 18, 35, 0.95)',
                color: '#fff',
                border: '1px solid #d38f4f',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0px 4px 15px rgba(0,0,0,0.6)',
                zIndex: '10001',
                maxWidth: '280px',
                fontSize: '12px',
                fontFamily: 'Montserrat, sans-serif'
            });

            document.body.appendChild(tooltip);
            edge.style('line-color', '#fff');
        });

        cy.on('mouseout', 'edge', (event) => {
            const edge = event.target;
            const tooltip = document.getElementById('tooltipEdge');
            if (tooltip) tooltip.remove();
            const color = getColorByNature(edge.data('nature_relation'));
            edge.style('line-color', color);
        });

    })
    .catch(err => console.error("Erreur de chargement :", err));

    // ===== MENU CONTEXTUEL CLIC DROIT SUR ACTEUR =====
    cy.on('cxttap', 'node', function(e) {
        const node = e.target;
        if (node.data('isZone')) return;

        removeContextMenu();

        const renderedPos = e.renderedPosition;
        const cyContainer = document.getElementById('cy');
        const rect = cyContainer.getBoundingClientRect();
        const x = rect.left + renderedPos.x;
        const y = rect.top + renderedPos.y;

        const menu = document.createElement('div');
        menu.id = 'nodeContextMenu';
        menu.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            background: rgba(12, 14, 28, 0.98);
            border: 1px solid rgba(211,143,79,0.4);
            border-radius: 10px;
            box-shadow: 0 16px 50px rgba(0,0,0,0.75);
            z-index: 99999;
            padding: 10px;
            width: 220px;
            font-family: Montserrat, sans-serif;
        `;

        const currentShape    = node.style('shape') || 'round-rectangle';
        const currentBoldVal  = node.data('fontBoldValue')  ?? 400;
        const currentUndVal   = node.data('fontUnderlineWidth') ?? 0;

        const sliderStyle = `
            width:100%; height:4px; border-radius:2px; outline:none; cursor:pointer;
            -webkit-appearance:none; appearance:none;
            background: linear-gradient(to right, rgba(211,143,79,0.9) 0%, rgba(211,143,79,0.9) var(--pct), rgba(255,255,255,0.12) var(--pct), rgba(255,255,255,0.12) 100%);
        `;

        const boldPct   = Math.round(((currentBoldVal - 100) / 800) * 100);
        const undPct    = Math.round((currentUndVal / 4) * 100);

        menu.innerHTML = `
            <style>
                #nodeContextMenu input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance:none; appearance:none;
                    width:14px; height:14px; border-radius:50%;
                    background:#d38f4f; cursor:pointer;
                    box-shadow:0 0 4px rgba(0,0,0,0.5);
                }
                #nodeContextMenu input[type=range]::-moz-range-thumb {
                    width:14px; height:14px; border-radius:50%;
                    background:#d38f4f; cursor:pointer; border:none;
                    box-shadow:0 0 4px rgba(0,0,0,0.5);
                }
            </style>

            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:rgba(211,143,79,0.8); font-weight:700; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.08);">
                ${node.data('nodeType') === 'object' ? 'Personnaliser l\'objet' : 'Personnaliser l\'acteur'}
            </div>

            <!-- FORMES -->
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.4); margin-bottom:6px; margin-top:2px;">Forme</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                ${[
                    { key: 'round-rectangle', label: '▭', title: 'Rectangle arrondi' },
                    { key: 'ellipse',         label: '⬭', title: 'Ovale' },
                    { key: 'rectangle',       label: '▬', title: 'Rectangle' },
                    { key: 'pentagon',        label: '⬠', title: 'Pentagone' },
                    { key: 'diamond',         label: '◆', title: 'Losange' },
                ].map(s => `
                    <button data-shape="${s.key}" title="${s.title}" style="
                        flex:1; min-width:28px; padding:6px 4px;
                        background: ${currentShape === s.key ? 'rgba(211,143,79,0.25)' : 'rgba(255,255,255,0.06)'};
                        border: 1px solid ${currentShape === s.key ? 'rgba(211,143,79,0.7)' : 'rgba(255,255,255,0.1)'};
                        border-radius:5px; color:white; cursor:pointer; font-size:14px;
                        transition:all 0.15s ease;
                    ">${s.label}</button>
                `).join('')}
            </div>

            <!-- GRAS -->
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.4); margin-bottom:6px;">Graisse du texte</div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:11px; color:rgba(255,255,255,0.35); font-weight:300; min-width:18px;">A</span>
                <input id="ctx-bold-slider" type="range" min="100" max="900" step="100" value="${currentBoldVal}"
                    style="${sliderStyle} --pct:${boldPct}%;"
                >
                <span style="font-size:13px; color:rgba(255,255,255,0.35); font-weight:900; min-width:18px; text-align:right;">A</span>
            </div>
            <div style="text-align:center; font-size:11px; color:rgba(211,143,79,0.7); margin-bottom:12px;">
                <span id="ctx-bold-label" style="font-weight:${currentBoldVal};">${currentBoldVal}</span>
            </div>

            <!-- SOULIGNEMENT -->
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.4); margin-bottom:6px;">Soulignement</div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:11px; color:rgba(255,255,255,0.35); min-width:18px;">—</span>
                <input id="ctx-und-slider" type="range" min="0" max="4" step="1" value="${currentUndVal}"
                    style="${sliderStyle} --pct:${undPct}%;"
                >
                <span style="font-size:13px; color:rgba(255,255,255,0.35); font-weight:900; min-width:18px; text-align:right; text-decoration:underline; text-decoration-thickness:4px;">—</span>
            </div>
            <div style="text-align:center; font-size:11px; color:rgba(211,143,79,0.7); margin-bottom:12px;">
                <span id="ctx-und-label">${currentUndVal === 0 ? 'Désactivé' : currentUndVal + 'px'}</span>
            </div>

            <!-- FERMER -->
            <button id="ctx-close" style="
                width:100%; padding:7px;
                background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:6px; color:rgba(255,255,255,0.4);
                cursor:pointer; font-size:11px; font-family:Montserrat,sans-serif;
                transition:all 0.15s ease;
            ">Fermer</button>
        `;

        document.body.appendChild(menu);

        // Réajuster si hors écran
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth)  menu.style.left = (x - menuRect.width) + 'px';
        if (menuRect.bottom > window.innerHeight) menu.style.top  = (y - menuRect.height) + 'px';

        // --- Boutons formes ---
        menu.querySelectorAll('[data-shape]').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (node.style('shape') !== btn.dataset.shape) {
                    btn.style.background = 'rgba(211,143,79,0.15)';
                    btn.style.borderColor = 'rgba(211,143,79,0.4)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (node.style('shape') !== btn.dataset.shape) {
                    btn.style.background = 'rgba(255,255,255,0.06)';
                    btn.style.borderColor = 'rgba(255,255,255,0.1)';
                }
            });
            btn.addEventListener('click', () => {
                const shape = btn.dataset.shape;
                node.style('shape', shape);
                // Adapter la taille au label pour la nouvelle forme
                fitNodeToLabel(node, shape);

                menu.querySelectorAll('[data-shape]').forEach(b => {
                    const active = b.dataset.shape === shape;
                    b.style.background  = active ? 'rgba(211,143,79,0.25)' : 'rgba(255,255,255,0.06)';
                    b.style.borderColor = active ? 'rgba(211,143,79,0.7)'  : 'rgba(255,255,255,0.1)';
                });
            });
        });

        // Helper : met à jour la progression visuelle du slider
        function updateSliderTrack(slider, min, max) {
            const pct = Math.round(((slider.value - min) / (max - min)) * 100);
            slider.style.setProperty('--pct', pct + '%');
        }

        // --- Slider GRAS ---
        const boldSlider = document.getElementById('ctx-bold-slider');
        const boldLabel  = document.getElementById('ctx-bold-label');

        boldSlider.addEventListener('input', () => {
            const val = parseInt(boldSlider.value);
            node.data('fontBoldValue', val);
            node.style('font-weight', val);
            boldLabel.textContent  = val;
            boldLabel.style.fontWeight = val;
            updateSliderTrack(boldSlider, 100, 900);
            // Recalculer la taille du nœud car la graisse influe sur la largeur estimée
            fitNodeToLabel(node);
        });

        // --- Slider SOULIGNEMENT ---
        const undSlider = document.getElementById('ctx-und-slider');
        const undLabel  = document.getElementById('ctx-und-label');

        undSlider.addEventListener('input', () => {
            const val = parseInt(undSlider.value);
            node.data('fontUnderlineWidth', val);
            applyUnderline(node, val);
            undLabel.textContent = val === 0 ? 'Désactivé' : val + 'px';
            updateSliderTrack(undSlider, 0, 4);
        });

        document.getElementById('ctx-close').addEventListener('click', removeContextMenu);
    });

    // Fermer le menu si clic ailleurs
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('nodeContextMenu');
        if (menu && !menu.contains(e.target)) removeContextMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') removeContextMenu();
    });
    cy.on('tap', () => removeContextMenu());
    // ===== FIN MENU CONTEXTUEL =====

    // ===== FICHE ACTEUR (DOUBLE-CLIC) =====
    cy.on('dbltap', 'node', function(e) {
        const node = e.target;
        if (node.data('isZone')) return;
        removeContextMenu();
        openFicheActeur(node);
    });
    // ===== FIN FICHE ACTEUR =====
});
 
function setupMenu() {
    document.getElementById("linkSimpleBtn").onclick = () => { 
        selectedTool = "simple"; 
        tempFromNode = null; 
        cy.nodes().unselect(); 
    };
    document.getElementById("linkDoubleBtn").onclick = () => { 
        selectedTool = "double"; 
        tempFromNode = null; 
        cy.nodes().unselect();
    };
    document.getElementById("addObjectBtn").onclick = () => { ajouterObjet(); };
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
 
    cy.on('grab', 'node', (e) => {
        const node = e.target;
        if (node.data('isZone')) return;
        node._dragStartPos = { x: node.position('x'), y: node.position('y') };
    });

    cy.on('drag', 'node', (e) => {
        const node = e.target;
        if (node.data('isZone')) return;
        const nodeId = node.id();
        const startPos = node._dragStartPos;
        if (!startPos) return;

        const dx = node.position('x') - startPos.x;
        const dy = node.position('y') - startPos.y;

        cy.nodes().filter(n => n.data('isZone') && n.data('_attachedTo') === nodeId).forEach(zone => {
            zone.position({
                x: zone.data('_baseX') + dx,
                y: zone.data('_baseY') + dy
            });
        });
    });

    cy.on('free', 'node', (e) => {
        const node = e.target;
        if (node.data('isZone')) return;
        cy.nodes().filter(n => n.data('isZone') && n.data('_attachedTo') === node.id()).forEach(zone => {
            zone.data('_baseX', zone.position('x'));
            zone.data('_baseY', zone.position('y'));
        });
        node._dragStartPos = null;
    });

    cy.on('tap', 'node', (e) => {
        const node = e.target;
        if (selectedColor) { 
            node.style('background-color', selectedColor); 
            selectedColor = null; 
            node.unselect();
            return; 
        }
        if (selectedTool) {
            if (!tempFromNode) { 
                tempFromNode = node; 
                node.select(); 
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
                    source: edge.source().id().replace("act_", ""), target: edge.target().id().replace("act_", ""), type_relation: edge.data("type_relation") || edge.data("label"), direction: edge.data("direction") || "Simple", impact_source_vers_cible: edge.data("impact_source_vers_cible") || "Moyen", impact_cible_vers_source: edge.data("impact_cible_vers_source") || "Moyen", nature_relation: edge.data("nature_relation") || "Neutre", description_relation: edge.data("description_relation") || "", duree_relation: edge.data("duree_relation") || 0
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
 
    const loadNom = sessionStorage.getItem('loadGraphNom');
    if (loadNom) {
        sessionStorage.removeItem('loadGraphNom');
        fetch('../php/get_graph_json.php?nom=' + encodeURIComponent(loadNom))
            .then(res => res.json())
            .then(data => {
                if (!data.success) { alert("Impossible de charger le graphique : " + data.message); return; }
                cy.elements().remove();
                cy.add(data.data);
                cy.layout({ name: 'preset' }).run();
                // Adapter la taille + restaurer le soulignement après chargement d'un graphe sauvegardé
                cy.nodes().forEach(node => {
                    if (node.data('isZone')) return;
                    fitNodeToLabel(node);
                    const undVal = node.data('fontUnderlineWidth');
                    if (undVal && undVal > 0) applyUnderline(node, undVal);
                });
            })
            .catch(err => { console.error(err); alert("Erreur lors du chargement."); });
    }
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
        alert("Cliquez sur au moins deux acteurs avant de cliquer ici."); 
        return; 
    }

    const defaultCouleur = type === "tension" ? "#e74c3c" : "#2ecc71";
    const etiquette = type === "tension" ? "TENSION - - -" : "ALLIANCE + + +";

    if (document.getElementById("zoneColorPopup")) return;

    const popup = document.createElement("div");
    popup.id = "zoneColorPopup";
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(15,18,35,0.98); padding: 28px 24px; border: 1px solid rgba(211,143,79,0.4);
        box-shadow: 0 20px 60px rgba(0,0,0,0.7); z-index: 9999; border-radius: 12px;
        width: 300px; font-family: Montserrat, sans-serif; color: white; text-align: center;
    `;

    const presets = ["#2ecc71","#3498db","#9b59b6","#f39c12","#e74c3c","#1abc9c","#e67e22","#e91e63","#ffffff","#00bcd4"];

    popup.innerHTML = `
        <h4 style="margin:0 0 16px; color:#d38f4f; font-family:Rajdhani,sans-serif; text-transform:uppercase; letter-spacing:0.06em; font-size:15px;">
            Couleur de la zone<br><span style="font-size:12px; color:rgba(255,255,255,0.5)">${etiquette}</span>
        </h4>
        <div id="zonePresetColors" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:16px;">
            ${presets.map(c => `
                <div data-color="${c}" style="
                    width:32px; height:32px; border-radius:50%; background:${c};
                    cursor:pointer; border:3px solid transparent; transition:border 0.2s;
                    box-shadow:0 2px 6px rgba(0,0,0,0.4);
                "></div>
            `).join("")}
        </div>
        <div style="margin-bottom:18px;">
            <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700; display:block; margin-bottom:6px;">Ou choisir une couleur libre :</label>
            <input type="color" id="zoneColorPicker" value="${defaultCouleur}" style="width:60px; height:36px; border:none; border-radius:6px; cursor:pointer; background:none;">
        </div>
        <div style="display:flex; gap:10px;">
            <button id="zoneColorConfirm" style="flex:1; padding:10px; background:linear-gradient(135deg,#d38f4f,#b8762f); color:white; border:none; border-radius:7px; cursor:pointer; font-family:Montserrat,sans-serif; font-weight:700; font-size:13px;">Créer</button>
            <button id="zoneColorCancel" style="flex:1; padding:10px; background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.12); border-radius:7px; cursor:pointer; font-family:Montserrat,sans-serif; font-weight:600; font-size:13px;">Annuler</button>
        </div>
    `;

    document.body.appendChild(popup);

    let couleurChoisie = defaultCouleur;

    popup.querySelectorAll("#zonePresetColors div").forEach(btn => {
        btn.addEventListener("mouseover", () => { if (btn.dataset.selected !== "1") btn.style.border = "3px solid rgba(255,255,255,0.5)"; });
        btn.addEventListener("mouseout",  () => { if (btn.dataset.selected !== "1") btn.style.border = "3px solid transparent"; });
        btn.addEventListener("click", () => {
            popup.querySelectorAll("#zonePresetColors div").forEach(b => { b.style.border = "3px solid transparent"; b.dataset.selected = "0"; });
            btn.style.border = "3px solid white";
            btn.dataset.selected = "1";
            couleurChoisie = btn.dataset.color;
            document.getElementById("zoneColorPicker").value = couleurChoisie;
        });
    });

    document.getElementById("zoneColorPicker").addEventListener("input", (e) => {
        couleurChoisie = e.target.value;
        popup.querySelectorAll("#zonePresetColors div").forEach(b => { b.style.border = "3px solid transparent"; b.dataset.selected = "0"; });
    });

    document.getElementById("zoneColorCancel").addEventListener("click", () => {
        popup.remove();
        cy.nodes().unselect();
    });

    document.getElementById("zoneColorConfirm").addEventListener("click", () => {
        popup.remove();
        const groupId = "group_" + Date.now();
        selectedNodes.forEach((node, i) => {
            const pos = node.position();
            const w = node.width();
            const h = node.height();
            const idZone = groupId + "_" + i;

            const existingZones = cy.nodes().filter(n => n.data('isZone') && n.data('_attachedTo') === node.id());
            const offsetStep = 14;
            const offset = (existingZones.length + 1) * offsetStep;

            cy.add({ 
                group: 'nodes', 
                data: { id: idZone, label: i === 0 ? etiquette : "", isZone: true, groupId: groupId, _attachedTo: node.id(), _baseX: pos.x, _baseY: pos.y, _offset: offset }, 
                position: { x: pos.x, y: pos.y } 
            });
            cy.$id(idZone).style({ 
                'shape': 'roundrectangle', 
                'width': w + offset * 2, 
                'height': h + offset * 2, 
                'background-opacity': 0, 
                'border-width': 2, 
                'border-color': couleurChoisie, 
                'border-style': 'dashed', 
                'label': i === 0 ? etiquette : "",
                'text-valign': 'top', 
                'text-halign': 'center', 
                'font-size': 11, 
                'color': couleurChoisie, 
                'z-index': -1,
                'events': 'no'
            });
        });
        cy.nodes().unselect();
    });
}
 
function supprimerZoneContour() {
    if (document.getElementById("zoneDeletePopup")) return;

    const selectedActeurs = cy.nodes(":selected").filter(n => !n.data('isZone'));
    if (selectedActeurs.length === 0) { alert("Sélectionne au moins un acteur pour supprimer ses zones."); return; }

    let allZones = [];
    selectedActeurs.forEach(acteur => {
        cy.nodes().filter(n => n.data('isZone') && n.data('_attachedTo') === acteur.id()).forEach(zone => {
            const labelNode = cy.nodes().filter(n => n.data('groupId') === zone.data('groupId')).filter((n, i) => i === 0);
            allZones.push({
                groupId: zone.data('groupId'),
                label: labelNode.data('label') || zone.data('label') || "Zone",
                color: zone.style('border-color')
            });
        });
    });

    const seen = new Set();
    allZones = allZones.filter(z => { if (seen.has(z.groupId)) return false; seen.add(z.groupId); return true; });

    if (allZones.length === 0) { alert("Aucune zone trouvée sur les acteurs sélectionnés."); return; }

    if (allZones.length === 1) {
        cy.nodes().filter(n => n.data('groupId') === allZones[0].groupId).remove();
        return;
    }

    const popup = document.createElement("div");
    popup.id = "zoneDeletePopup";
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(15,18,35,0.98); padding: 24px; border: 1px solid rgba(211,143,79,0.4);
        box-shadow: 0 20px 60px rgba(0,0,0,0.7); z-index: 9999; border-radius: 12px;
        width: 280px; font-family: Montserrat, sans-serif; color: white; text-align: center;
    `;
    popup.innerHTML = `
        <h4 style="margin:0 0 16px; color:#d38f4f; font-family:Rajdhani,sans-serif; text-transform:uppercase; font-size:14px;">Supprimer quelle zone ?</h4>
        <div id="zoneDeleteList" style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;"></div>
        <button id="zoneDeleteAll" style="width:100%; padding:9px; background:#e74c3c; color:white; border:none; border-radius:7px; cursor:pointer; font-weight:700; font-size:13px; margin-bottom:8px;">Supprimer toutes</button>
        <button id="zoneDeleteCancel" style="width:100%; padding:9px; background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.12); border-radius:7px; cursor:pointer; font-size:13px;">Annuler</button>
    `;
    document.body.appendChild(popup);

    const list = document.getElementById("zoneDeleteList");
    allZones.forEach(z => {
        const btn = document.createElement("button");
        btn.style.cssText = `padding:9px 12px; background:rgba(255,255,255,0.05); color:white; border:2px solid ${z.color}; border-radius:7px; cursor:pointer; font-size:13px; text-align:left; display:flex; align-items:center; gap:8px;`;
        btn.innerHTML = `<span style="width:12px;height:12px;border-radius:50%;background:${z.color};display:inline-block;flex-shrink:0;"></span>${z.label}`;
        btn.addEventListener("click", () => {
            cy.nodes().filter(n => n.data('groupId') === z.groupId).remove();
            popup.remove();
        });
        list.appendChild(btn);
    });

    document.getElementById("zoneDeleteAll").addEventListener("click", () => {
        allZones.forEach(z => cy.nodes().filter(n => n.data('groupId') === z.groupId).remove());
        popup.remove();
    });
    document.getElementById("zoneDeleteCancel").addEventListener("click", () => popup.remove());
}
 
// =====================================================================
// AJOUTER UN OBJET / ENTITÉ AU GRAPHE
// =====================================================================
function ajouterObjet() {
    if (document.getElementById("addObjectPopup")) return;

    const popup = document.createElement("div");
    popup.id = "addObjectPopup";
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(15,18,35,0.98); padding: 28px 24px;
        border: 1px solid rgba(211,143,79,0.4);
        box-shadow: 0 20px 60px rgba(0,0,0,0.7); z-index: 9999;
        border-radius: 12px; width: 320px;
        font-family: Montserrat, sans-serif; color: white;
    `;

    const shapes = [
        { key: 'round-rectangle', label: '▭', title: 'Rectangle arrondi' },
        { key: 'ellipse',         label: '⬭', title: 'Ovale' },
        { key: 'rectangle',       label: '▬', title: 'Rectangle' },
        { key: 'pentagon',        label: '⬠', title: 'Pentagone' },
        { key: 'diamond',         label: '◆', title: 'Losange' },
    ];

    const presetColors = ["#bdc3c7","#58B19F","#f8c291","#82ccdd","#f6b93b","#F97F51","#a29bfe","#ff7675"];

    popup.innerHTML = `
        <h4 style="margin:0 0 18px; color:#d38f4f; font-family:Rajdhani,sans-serif; text-transform:uppercase; letter-spacing:0.06em; font-size:16px;">
            ＋ Ajouter un objet / entité
        </h4>

        <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Nom :</label>
        <input type="text" id="objName" placeholder="ex: Budget, Projet Alpha, Contrat…"
            style="width:100%; padding:8px 10px; margin:5px 0 14px;
            background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
            border-radius:6px; color:white; font-family:Montserrat,sans-serif;
            font-size:13px; box-sizing:border-box;">

        <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Type d'objet :</label>
        <input type="text" id="objType" placeholder="ex: Ressource, Processus, Concept…"
            style="width:100%; padding:8px 10px; margin:5px 0 14px;
            background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
            border-radius:6px; color:white; font-family:Montserrat,sans-serif;
            font-size:13px; box-sizing:border-box;">

        <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Forme :</label>
        <div id="objShapeRow" style="display:flex; gap:7px; margin:6px 0 14px; flex-wrap:wrap;">
            ${shapes.map((s, i) => `
                <button data-shape="${s.key}" title="${s.title}" style="
                    flex:1; min-width:28px; padding:7px 4px;
                    background: ${i === 0 ? 'rgba(211,143,79,0.25)' : 'rgba(255,255,255,0.06)'};
                    border: 1px solid ${i === 0 ? 'rgba(211,143,79,0.7)' : 'rgba(255,255,255,0.1)'};
                    border-radius:5px; color:white; cursor:pointer; font-size:15px;
                    transition:all 0.15s ease;
                ">${s.label}</button>
            `).join('')}
        </div>

        <label style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:rgba(211,143,79,0.8); font-weight:700;">Couleur :</label>
        <div style="display:flex; flex-wrap:wrap; gap:7px; margin:6px 0 18px; align-items:center;">
            ${presetColors.map((c, i) => `
                <div data-objcolor="${c}" style="
                    width:26px; height:26px; border-radius:50%; background:${c};
                    cursor:pointer;
                    border: 3px solid ${i === 0 ? 'white' : 'transparent'};
                    transition:border 0.15s;
                    box-shadow:0 2px 5px rgba(0,0,0,0.35);
                " ${i === 0 ? 'data-selected="1"' : ''}></div>
            `).join('')}
            <input type="color" id="objColorPicker" value="${presetColors[0]}"
                style="width:34px; height:28px; border:none; border-radius:6px; cursor:pointer; background:none; margin-left:4px;">
        </div>

        <div style="display:flex; gap:10px;">
            <button id="objConfirm" style="flex:1; padding:10px; background:linear-gradient(135deg,#d38f4f,#b8762f); color:white; border:none; border-radius:7px; cursor:pointer; font-family:Montserrat,sans-serif; font-weight:700; font-size:13px;">Ajouter</button>
            <button id="objCancel"  style="flex:1; padding:10px; background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.12); border-radius:7px; cursor:pointer; font-family:Montserrat,sans-serif; font-weight:600; font-size:13px;">Annuler</button>
        </div>
    `;

    document.body.appendChild(popup);
    document.getElementById("objName").focus();

    let selectedObjShape = 'round-rectangle';
    let selectedObjColor = presetColors[0];

    // Shape selection
    popup.querySelectorAll("[data-shape]").forEach(btn => {
        btn.addEventListener("click", () => {
            selectedObjShape = btn.dataset.shape;
            popup.querySelectorAll("[data-shape]").forEach(b => {
                const active = b.dataset.shape === selectedObjShape;
                b.style.background  = active ? 'rgba(211,143,79,0.25)' : 'rgba(255,255,255,0.06)';
                b.style.borderColor = active ? 'rgba(211,143,79,0.7)'  : 'rgba(255,255,255,0.1)';
            });
        });
    });

    // Color presets
    popup.querySelectorAll("[data-objcolor]").forEach(dot => {
        dot.addEventListener("click", () => {
            selectedObjColor = dot.dataset.objcolor;
            document.getElementById("objColorPicker").value = selectedObjColor;
            popup.querySelectorAll("[data-objcolor]").forEach(d => {
                d.style.border = "3px solid transparent";
                d.dataset.selected = "0";
            });
            dot.style.border = "3px solid white";
            dot.dataset.selected = "1";
        });
    });

    document.getElementById("objColorPicker").addEventListener("input", e => {
        selectedObjColor = e.target.value;
        popup.querySelectorAll("[data-objcolor]").forEach(d => {
            d.style.border = "3px solid transparent";
            d.dataset.selected = "0";
        });
    });

    document.getElementById("objCancel").addEventListener("click", () => popup.remove());

    document.getElementById("objConfirm").addEventListener("click", () => {
        const name = document.getElementById("objName").value.trim();
        const type = document.getElementById("objType").value.trim();
        if (!name) {
            document.getElementById("objName").style.borderColor = "#e74c3c";
            return;
        }

        const id = "obj_" + Date.now();
        // Place the new node near the center of the viewport
        const pan  = cy.pan();
        const zoom = cy.zoom();
        const cx = (cy.container().offsetWidth  / 2 - pan.x) / zoom;
        const cy2 = (cy.container().offsetHeight / 2 - pan.y) / zoom;

        const node = cy.add({
            group: 'nodes',
            data: {
                id: id,
                label: name,
                nodeType: 'object',
                objectCategory: type || 'Objet',
                role_entreprise: type || '',
                age: '',
                secteur: '',
                extraFields: []
            },
            position: {
                x: cx + (Math.random() - 0.5) * 120,
                y: cy2 + (Math.random() - 0.5) * 120
            }
        });

        node.style({
            'shape': selectedObjShape,
            'background-color': selectedObjColor,
            'border-color': 'rgba(0,0,0,0.3)',
            'border-width': 2,
            'color': '#222'
        });

        fitNodeToLabel(node, selectedObjShape);
        popup.remove();
    });
}
// =====================================================================

document.getElementById("submitToProfBtn").onclick = () => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) { alert("Vous devez être connecté."); return; }
    const imageData = cy.png({ scale: 2, output: 'blob' });
    const formData = new FormData();
    const graphNom = "graphe_informel_" + Date.now();
    const graphElements = cy.json().elements;
    formData.append("image", imageData, "graph_informel.png");
    formData.append("id_utilisateur", userId);
    formData.append("type_schema", "informelle");
    formData.append("nom", graphNom);
    formData.append("graph_json", JSON.stringify(graphElements));
    fetch("../php/save_graph_with_image.php", { method: "POST", body: formData })
    .then(res => res.json()).then(data => {
        if (data.success) {
            alert("Graphe informel envoyé au professeur !");
            if (sessionStorage.getItem("role") === "prof") window.location.href = "../html/admin_view.html";
        } else { alert("Erreur : " + data.message); }
    }).catch(err => { console.error("Erreur :", err); alert("Erreur lors de l'envoi du graphe."); });
};

// =====================================================================
// FICHE ACTEUR — double-clic sur un nœud
// =====================================================================
function openFicheActeur(node) {
    const existing = document.getElementById('ficheActeurOverlay');
    if (existing) existing.remove();

    const label       = node.data('label')          || '';
    const role        = node.data('role_entreprise') || '';
    const age         = node.data('age')             || '';
    const secteur     = node.data('secteur')         || '';
    const extraFields = node.data('extraFields')     || [];

    const isObject = node.data('nodeType') === 'object';
    const avatarIcon = isObject ? '📦' : '👤';
    const typeLabel  = isObject ? ('Objet · ' + (node.data('objectCategory') || 'Entité')) : 'Acteur';

    // Bulle initiale (informations fixes)
    const fixedBubbles = isObject ? [
        { icon: '📦', key: 'label',           label: 'Nom',      value: label,  editable: false },
        { icon: '🏷️', key: 'objectCategory',  label: 'Type',     value: node.data('objectCategory') || '', editable: true },
        { icon: '📝', key: 'role_entreprise',  label: 'Rôle',     value: role,   editable: true  },
        { icon: '🏢', key: 'secteur',          label: 'Secteur',  value: secteur, editable: true  },
    ] : [
        { icon: '👤', key: 'label',            label: 'Nom',     value: label,   editable: false },
        { icon: '💼', key: 'role_entreprise',  label: 'Rôle',    value: role,    editable: true  },
        { icon: '🎂', key: 'age',              label: 'Âge',     value: age,     editable: true  },
        { icon: '🏢', key: 'secteur',          label: 'Secteur', value: secteur, editable: true  },
    ];

    // Couleur accent par secteur (reprend la palette du panneau)
    const sectorColors = ['#bdc3c7','#58B19F','#f8c291','#82ccdd','#f6b93b','#F97F51','#a29bfe','#ff7675'];
    const nodeColor = node.style('background-color') || '#d6d8db';

    const overlay = document.createElement('div');
    overlay.id = 'ficheActeurOverlay';
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 100000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(3px);
        animation: ficheOverlayIn 0.18s ease;
    `;

    overlay.innerHTML = `
    <style>
        @keyframes ficheOverlayIn { from { opacity:0 } to { opacity:1 } }
        @keyframes ficheCardIn    { from { opacity:0; transform:scale(0.92) translateY(18px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes bubbleIn       { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }

        #ficheCard {
            background: rgba(12,14,28,0.98);
            border: 1px solid rgba(211,143,79,0.35);
            border-radius: 18px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.8);
            width: 520px; max-width: 95vw;
            max-height: 90vh; overflow-y: auto;
            padding: 28px 28px 22px;
            font-family: Montserrat, sans-serif;
            color: white;
            animation: ficheCardIn 0.22s cubic-bezier(.34,1.56,.64,1);
            position: relative;
        }
        #ficheCard::-webkit-scrollbar { width: 4px; }
        #ficheCard::-webkit-scrollbar-track { background: transparent; }
        #ficheCard::-webkit-scrollbar-thumb { background: rgba(211,143,79,0.3); border-radius: 4px; }

        .fiche-avatar {
            width: 56px; height: 56px; border-radius: 50%;
            background: ${nodeColor};
            border: 3px solid rgba(211,143,79,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; flex-shrink: 0;
        }
        .fiche-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .fiche-name   { font-family: Rajdhani, sans-serif; font-size: 22px; font-weight: 700; color: #d38f4f; letter-spacing: 0.04em; }
        .fiche-id     { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

        .fiche-section-title {
            font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
            color: rgba(211,143,79,0.7); font-weight: 700;
            margin: 18px 0 10px; padding-bottom: 5px;
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .bubbles-grid {
            display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 4px;
        }

        .bubble {
            display: flex; flex-direction: column;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 14px;
            padding: 10px 14px;
            min-width: 110px; flex: 1;
            cursor: default;
            transition: border-color 0.15s, background 0.15s;
            animation: bubbleIn 0.25s cubic-bezier(.34,1.56,.64,1) both;
        }
        .bubble.editable { cursor: pointer; }
        .bubble.editable:hover {
            background: rgba(211,143,79,0.08);
            border-color: rgba(211,143,79,0.4);
        }
        .bubble-icon  { font-size: 16px; margin-bottom: 4px; }
        .bubble-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); margin-bottom: 3px; }
        .bubble-value { font-size: 13px; font-weight: 600; color: #fff; word-break: break-word; }
        .bubble-value.empty { color: rgba(255,255,255,0.25); font-style: italic; font-weight: 400; }
        .bubble-edit-hint { font-size: 9px; color: rgba(211,143,79,0.5); margin-top: 4px; }

        .bubble-input-wrap {
            display: flex; flex-direction: column;
            background: rgba(211,143,79,0.08);
            border: 1px solid rgba(211,143,79,0.5);
            border-radius: 14px;
            padding: 10px 14px;
            min-width: 110px; flex: 1;
            animation: bubbleIn 0.18s ease both;
        }
        .bubble-input-wrap input, .bubble-input-wrap textarea {
            background: transparent; border: none; outline: none;
            color: white; font-family: Montserrat, sans-serif;
            font-size: 13px; font-weight: 600;
            width: 100%; resize: none;
            padding: 0; margin-top: 3px;
        }
        .bubble-input-wrap textarea { min-height: 52px; }

        .extra-bubble-add {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            background: rgba(255,255,255,0.03);
            border: 1px dashed rgba(255,255,255,0.18);
            border-radius: 14px; padding: 10px 14px;
            min-width: 110px; flex: 1;
            cursor: pointer; color: rgba(255,255,255,0.35);
            font-size: 12px;
            transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .extra-bubble-add:hover {
            border-color: rgba(211,143,79,0.5);
            color: rgba(211,143,79,0.8);
            background: rgba(211,143,79,0.06);
        }

        .fiche-actions { display: flex; gap: 10px; margin-top: 20px; }
        .fiche-btn-save {
            flex: 1; padding: 10px;
            background: linear-gradient(135deg,#d38f4f,#b8762f);
            color: white; border: none; border-radius: 9px;
            cursor: pointer; font-family: Montserrat, sans-serif;
            font-weight: 700; font-size: 13px;
            transition: opacity 0.15s;
        }
        .fiche-btn-save:hover { opacity: 0.88; }
        .fiche-btn-cancel {
            flex: 1; padding: 10px;
            background: rgba(255,255,255,0.05);
            color: rgba(255,255,255,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 9px; cursor: pointer;
            font-family: Montserrat, sans-serif; font-size: 13px;
            transition: background 0.15s;
        }
        .fiche-btn-cancel:hover { background: rgba(255,255,255,0.09); }
        .fiche-btn-close {
            position: absolute; top: 14px; right: 14px;
            background: rgba(255,255,255,0.06); border: none;
            color: rgba(255,255,255,0.4); width: 28px; height: 28px;
            border-radius: 50%; cursor: pointer; font-size: 14px;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s;
        }
        .fiche-btn-close:hover { background: rgba(211,143,79,0.2); color: #d38f4f; }
    </style>

    <div id="ficheCard">
        <button class="fiche-btn-close" id="ficheClose">✕</button>

        <div class="fiche-header">
            <div class="fiche-avatar">${avatarIcon}</div>
            <div>
                <div class="fiche-name">${label}</div>
                <div class="fiche-id">${typeLabel} · ${node.id()}</div>
            </div>
        </div>

        <!-- INFOS FIXES -->
        <div class="fiche-section-title">Informations</div>
        <div class="bubbles-grid" id="fiche-fixed-bubbles"></div>

        <!-- INFOS SUPPLÉMENTAIRES -->
        <div class="fiche-section-title">Champs supplémentaires</div>
        <div class="bubbles-grid" id="fiche-extra-bubbles"></div>

        <div class="fiche-actions">
            <button class="fiche-btn-save"   id="ficheSave">✓ Enregistrer</button>
            <button class="fiche-btn-cancel" id="ficheCancel">Annuler</button>
        </div>
    </div>
    `;

    document.body.appendChild(overlay);

    // --- Rendu des bulles fixes ---
    const fixedGrid = document.getElementById('fiche-fixed-bubbles');

    fixedBubbles.forEach((b, i) => {
        if (b.key === 'label') return; // nom déjà dans le header
        const wrap = document.createElement('div');
        wrap.className = 'bubble editable';
        wrap.style.animationDelay = (i * 0.04) + 's';
        wrap.dataset.key = b.key;
        wrap.dataset.value = b.value;
        wrap.innerHTML = `
            <div class="bubble-icon">${b.icon}</div>
            <div class="bubble-label">${b.label}</div>
            <div class="bubble-value ${b.value ? '' : 'empty'}">${b.value || 'Non renseigné'}</div>
            <div class="bubble-edit-hint">✎ Cliquer pour modifier</div>
        `;
        wrap.addEventListener('click', () => inlineEditBubble(wrap, b.label, b.key, false));
        fixedGrid.appendChild(wrap);
    });

    // --- Rendu des bulles extra ---
    const extraGrid = document.getElementById('fiche-extra-bubbles');

    function renderExtraBubbles() {
        extraGrid.innerHTML = '';
        const currentExtras = node.data('extraFields') || [];
        currentExtras.forEach((f, i) => {
            const wrap = document.createElement('div');
            wrap.className = 'bubble editable';
            wrap.style.animationDelay = (i * 0.04) + 's';
            wrap.dataset.extraIndex = i;
            wrap.innerHTML = `
                <div class="bubble-icon">📝</div>
                <div class="bubble-label">${f.label}</div>
                <div class="bubble-value ${f.value ? '' : 'empty'}">${f.value || 'Vide'}</div>
                <div class="bubble-edit-hint">✎ Modifier · 🗑 <span class="del-extra" style="cursor:pointer;color:rgba(231,76,60,0.6);">Supprimer</span></div>
            `;
            wrap.querySelector('.del-extra').addEventListener('click', (ev) => {
                ev.stopPropagation();
                const extras = [...(node.data('extraFields') || [])];
                extras.splice(i, 1);
                node.data('extraFields', extras);
                renderExtraBubbles();
            });
            wrap.addEventListener('click', (ev) => {
                if (ev.target.classList.contains('del-extra')) return;
                inlineEditBubble(wrap, f.label, null, true, i);
            });
            extraGrid.appendChild(wrap);
        });

        // Bouton "Ajouter"
        const addBtn = document.createElement('div');
        addBtn.className = 'extra-bubble-add';
        addBtn.innerHTML = '＋ Ajouter un champ';
        addBtn.addEventListener('click', () => addNewExtraField());
        extraGrid.appendChild(addBtn);
    }

    renderExtraBubbles();

    // --- Édition inline d'une bulle ---
    function inlineEditBubble(wrap, fieldLabel, dataKey, isExtra, extraIndex) {
        const isTextarea = dataKey === null || fieldLabel === 'Notes';
        wrap.className = 'bubble-input-wrap';
        wrap.innerHTML = `
            <div class="bubble-label">${fieldLabel}</div>
            ${isTextarea
                ? `<textarea id="bubbleInput" rows="3">${isExtra ? (node.data('extraFields')[extraIndex]?.value || '') : (node.data(dataKey) || '')}</textarea>`
                : `<input id="bubbleInput" type="text" value="${isExtra ? (node.data('extraFields')[extraIndex]?.value || '') : (node.data(dataKey) || '')}">`
            }
            <div style="display:flex;gap:6px;margin-top:6px;">
                <button id="bubbleConfirm" style="flex:1;padding:4px 8px;background:rgba(211,143,79,0.7);border:none;border-radius:6px;color:white;cursor:pointer;font-size:11px;font-family:Montserrat,sans-serif;">✓</button>
                <button id="bubbleCancel"  style="flex:1;padding:4px 8px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.5);cursor:pointer;font-size:11px;font-family:Montserrat,sans-serif;">✕</button>
            </div>
        `;
        const input = wrap.querySelector('#bubbleInput');
        input.focus();

        wrap.querySelector('#bubbleConfirm').addEventListener('click', () => {
            const val = input.value.trim();
            if (isExtra) {
                const extras = [...(node.data('extraFields') || [])];
                extras[extraIndex].value = val;
                node.data('extraFields', extras);
                renderExtraBubbles();
            } else {
                node.data(dataKey, val);
                wrap.className = 'bubble editable';
                wrap.dataset.value = val;
                wrap.innerHTML = `
                    <div class="bubble-icon">${fixedBubbles.find(b=>b.key===dataKey)?.icon || '📌'}</div>
                    <div class="bubble-label">${fieldLabel}</div>
                    <div class="bubble-value ${val ? '' : 'empty'}">${val || 'Non renseigné'}</div>
                    <div class="bubble-edit-hint">✎ Cliquer pour modifier</div>
                `;
                wrap.addEventListener('click', () => inlineEditBubble(wrap, fieldLabel, dataKey, false));
            }
        });

        wrap.querySelector('#bubbleCancel').addEventListener('click', () => {
            if (isExtra) { renderExtraBubbles(); return; }
            const val = node.data(dataKey) || '';
            wrap.className = 'bubble editable';
            wrap.innerHTML = `
                <div class="bubble-icon">${fixedBubbles.find(b=>b.key===dataKey)?.icon || '📌'}</div>
                <div class="bubble-label">${fieldLabel}</div>
                <div class="bubble-value ${val ? '' : 'empty'}">${val || 'Non renseigné'}</div>
                <div class="bubble-edit-hint">✎ Cliquer pour modifier</div>
            `;
            wrap.addEventListener('click', () => inlineEditBubble(wrap, fieldLabel, dataKey, false));
        });
    }

    // --- Ajout d'un nouveau champ extra ---
    function addNewExtraField() {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
            background:rgba(12,14,28,0.99);border:1px solid rgba(211,143,79,0.4);
            border-radius:12px;padding:20px;z-index:200001;width:280px;
            font-family:Montserrat,sans-serif;color:white;
            box-shadow:0 16px 50px rgba(0,0,0,0.8);
        `;
        popup.innerHTML = `
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(211,143,79,0.8);font-weight:700;margin-bottom:12px;">Nouveau champ</div>
            <input id="newFieldLabel" type="text" placeholder="Nom du champ (ex: LinkedIn, Objectif…)"
                style="width:100%;padding:8px 10px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:7px;color:white;font-family:Montserrat,sans-serif;font-size:13px;box-sizing:border-box;margin-bottom:10px;">
            <input id="newFieldValue" type="text" placeholder="Valeur (optionnel)"
                style="width:100%;padding:8px 10px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:7px;color:white;font-family:Montserrat,sans-serif;font-size:13px;box-sizing:border-box;margin-bottom:14px;">
            <div style="display:flex;gap:8px;">
                <button id="newFieldOk" style="flex:1;padding:9px;background:linear-gradient(135deg,#d38f4f,#b8762f);color:white;border:none;border-radius:7px;cursor:pointer;font-weight:700;font-size:13px;font-family:Montserrat,sans-serif;">Ajouter</button>
                <button id="newFieldCancel" style="flex:1;padding:9px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:7px;cursor:pointer;font-size:13px;font-family:Montserrat,sans-serif;">Annuler</button>
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('newFieldLabel').focus();

        document.getElementById('newFieldOk').addEventListener('click', () => {
            const lbl = document.getElementById('newFieldLabel').value.trim();
            const val = document.getElementById('newFieldValue').value.trim();
            if (!lbl) { document.getElementById('newFieldLabel').style.borderColor = '#e74c3c'; return; }
            const extras = [...(node.data('extraFields') || [])];
            extras.push({ label: lbl, value: val });
            node.data('extraFields', extras);
            popup.remove();
            renderExtraBubbles();
        });
        document.getElementById('newFieldCancel').addEventListener('click', () => popup.remove());
    }

    // --- Boutons principaux ---
    document.getElementById('ficheClose').addEventListener('click', () => overlay.remove());
    document.getElementById('ficheCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function escFiche(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escFiche); }
    });

    document.getElementById('ficheSave').addEventListener('click', () => {
        // Persist dans node.data — les données sont déjà mises à jour en temps réel
        // On peut ici envoyer au serveur si nécessaire
        const userId = sessionStorage.getItem('userId');
        if (userId) {
            const payload = {
                id_acteur: node.id().replace('act_', ''),
                role_entreprise: node.data('role_entreprise'),
                age: node.data('age'),
                secteur: node.data('secteur'),
                extra_fields: node.data('extraFields') || []
            };
            fetch('../php/update_acteur.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {}); // silencieux si l'endpoint n'existe pas encore
        }

        // Feedback visuel
        const btn = document.getElementById('ficheSave');
        btn.textContent = '✓ Sauvegardé !';
        btn.style.background = 'linear-gradient(135deg,#2ecc71,#27ae60)';
        setTimeout(() => overlay.remove(), 800);
    });
}