<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
include 'config.php';

if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode(["error" => "Utilisateur non connecté"]);
    exit();
}

$id_utilisateur = $_SESSION['id_utilisateur'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$relations = isset($input['relations']) ? $input['relations'] : [];
$toDelete = isset($input['toDelete']) ? $input['toDelete'] : [];

try {
    $inserted = 0;
    $deleted = 0;

    if (!empty($toDelete)) {
        $stmtDelete = $pdo->prepare("DELETE FROM relation_informelle WHERE id_relation_informelle = ? AND id_utilisateur = ?");
        foreach ($toDelete as $uid) {
            $stmtDelete->execute([$uid, $id_utilisateur]);
            $deleted += $stmtDelete->rowCount();
        }
    }

    $stmtInsert = $pdo->prepare("
        INSERT INTO relation_informelle (
            id_acteur_source, id_acteur_cible, type_relation,
            direction_relation, impact_source_vers_cible,
            impact_cible_vers_source, nature_relation, duree_relation,
            id_utilisateur
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtCheck = $pdo->prepare("
        SELECT COUNT(*) FROM relation_informelle 
        WHERE id_utilisateur = ? AND (
            (id_acteur_source = ? AND id_acteur_cible = ?)
            OR (id_acteur_source = ? AND id_acteur_cible = ?)
        )
    ");

    foreach ($relations as $rel) {
        if (!isset($rel['source'], $rel['target'])) continue;

        // Évite les doublons dans les deux sens
        $stmtCheck->execute([
            $id_utilisateur,
            $rel["source"], $rel["target"],
            $rel["target"], $rel["source"]
        ]);
        if ($stmtCheck->fetchColumn() > 0) continue;

        $stmtInsert->execute([
            $rel["source"],
            $rel["target"],
            $rel["type_relation"],
            $rel["direction"],
            $rel["impact_source_vers_cible"],
            $rel["impact_cible_vers_source"],
            $rel["nature_relation"],
            $rel["duree_relation"],
            $id_utilisateur
        ]);
        $inserted++;
    }

    echo json_encode([
        "success" => true,
        "relations_inserted" => $inserted,
        "relations_deleted" => $deleted
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
