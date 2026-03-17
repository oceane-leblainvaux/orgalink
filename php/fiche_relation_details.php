<?php
header('Content-Type: application/json');
require_once('../php/config.php');
session_start();

$id_acteur = isset($_GET['id_acteur']) ? intval($_GET['id_acteur']) : 0;
if ($id_acteur === 0 || !isset($_SESSION['id_utilisateur'])) {
  echo json_encode([]);
  exit;
}

$id_utilisateur = $_SESSION['id_utilisateur'];

$stmt = $pdo->prepare("SELECT id_acteur FROM acteur WHERE id_acteur = ? AND id_utilisateur = ?");
$stmt->execute([$id_acteur, $id_utilisateur]);
if (!$stmt->fetch()) {
  echo json_encode([]);
  exit;
}


$stmt = $pdo->prepare("
  SELECT 
    a.nom AS nom_autre,
    a.prenom AS prenom_autre,
    ri.type_relation,
    ri.nature_relation,
    ri.impact_source_vers_cible,
    ri.impact_cible_vers_source,
    ri.duree_relation,
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

// Reformater pour JS
$relations = array_map(function($r) use ($id_acteur) {
  $estSource = $r['id_acteur_source'] == $id_acteur;

  return [
    'nom_autre' => $r['prenom_autre'] . ' ' . $r['nom_autre'],
    'type_relation' => $r['type_relation'],
    'nature_relation' => $r['nature_relation'],
    'impactA' => $estSource ? $r['impact_source_vers_cible'] : $r['impact_cible_vers_source'],
    'impactB' => $estSource ? $r['impact_cible_vers_source'] : $r['impact_source_vers_cible'],
    'duree_relation' => $r['duree_relation'],
    'direction_relation' => $r['direction_relation'],
    'estSource' => $estSource
  ];
}, $relations);

$stmt = $pdo->prepare("SELECT 
    a2.nom AS nom,
    a2.prenom AS prenom,
    rh.type_relation,
    'Neutre' AS nature_relation,
    'Moyen' AS impactA,
    'Faible' AS impactB,
    NULL AS duree_relation
  FROM relation_hierarchique rh
  JOIN acteur a2 ON a2.id_acteur = rh.id_acteur_superieur
  WHERE rh.id_acteur_source = ?");
$stmt->execute([$id_acteur]);
$hierarchies = $stmt->fetchAll(PDO::FETCH_ASSOC);

$hierarchies = array_map(function($r) {
  return [
    'nom_autre' => $r['prenom'] . ' ' . $r['nom'],
    'type_relation' => $r['type_relation'],
    'nature_relation' => $r['nature_relation'],
    'impactA' => $r['impactA'],
    'impactB' => $r['impactB'],
    'duree_relation' => $r['duree_relation'],
    'direction_relation' => 'Simple',
    'estSource' => true
  ];
}, $hierarchies);

$all_relations = array_merge($relations, $hierarchies);


echo json_encode($all_relations, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
