<?php
header('Content-Type: application/json');
require_once('../php/config.php');
session_start();

$id_acteur = isset($_GET['id_acteur']) ? intval($_GET['id_acteur']) : 0;
if ($id_acteur === 0) {
  echo json_encode(["error" => "Aucun acteur valide."]);
  exit;
}

if (!isset($_SESSION['id_utilisateur'])) {
  echo json_encode(["error" => "Utilisateur non connecté"]);
  exit;
}

$id_utilisateur = $_SESSION['id_utilisateur'];

$stmt = $pdo->prepare("SELECT nom, prenom FROM acteur WHERE id_acteur = ? AND id_utilisateur = ?");
$stmt->execute([$id_acteur, $id_utilisateur]);
$acteur_info = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$acteur_info) {
  echo json_encode(["error" => "Acteur non autorisé ou inexistant"]);
  exit;
}

$nom_acteur = $acteur_info['prenom'] . ' ' . $acteur_info['nom'];

$stmt = $pdo->prepare("
  SELECT 
    a.nom AS nom_autre,
    a.prenom AS prenom_autre,
    ri.nature_relation,
    ri.impact_source_vers_cible,
    ri.impact_cible_vers_source,
    ri.id_acteur_source,
    ri.id_acteur_cible,
    ri.direction_relation
  FROM relation_informelle ri
  JOIN acteur a ON (
    (ri.id_acteur_source = :id AND a.id_acteur = ri.id_acteur_cible)
    OR
    (ri.id_acteur_cible = :id AND a.id_acteur = ri.id_acteur_source)
  )
");
$stmt->execute(['id' => $id_acteur]);
$relations = $stmt->fetchAll(PDO::FETCH_ASSOC);

$radar_labels = [];
$radar_data = [];
$radar_colors = [];

foreach ($relations as $rel) {
  $estSource = $rel['id_acteur_source'] == $id_acteur;
  $nom_autre = $rel['prenom_autre'] . ' ' . $rel['nom_autre'];

  $impact = $estSource ? $rel['impact_source_vers_cible'] : $rel['impact_cible_vers_source'];

  if (in_array($nom_autre, $radar_labels)) continue;

  $radar_labels[] = $nom_autre;

  switch ($impact) {
    case "Faible": $val = 1; break;
    case "Moyen":  $val = 2; break;
    case "Fort":   $val = 3; break;
    default:       $val = 0;
  }
  $radar_data[] = $val;

  switch ($rel['nature_relation']) {
    case "Positive": $radar_colors[] = 'rgba(0, 192, 83, 0.6)'; break;
    case "Négative": $radar_colors[] = 'rgba(254, 6, 60, 0.6)'; break;
    case "Neutre":   $radar_colors[] = 'rgba(202, 253, 15, 0.6)'; break;
    default:         $radar_colors[] = 'rgba(150, 150, 150, 0.4)';
  }
}

echo json_encode([
  "nom" => $nom_acteur,
  "radar" => [
    "labels" => $radar_labels,
    "data" => $radar_data,
    "colors" => $radar_colors
  ]
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
