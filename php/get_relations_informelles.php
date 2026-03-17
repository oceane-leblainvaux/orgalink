<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");

session_start();
require_once 'config.php';

if (!isset($_SESSION['id_utilisateur'])) { // verif util bien co à mettre partout
    echo json_encode([]);
    exit();
}

$id_utilisateur = $_SESSION['id_utilisateur'];

try {
    $stmt = $pdo->prepare("SELECT * FROM relation_informelle WHERE id_utilisateur = ?");
    $stmt->execute([$id_utilisateur]);

    $relations = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $relations[] = [
            "uid" => $row["id_relation_informelle"],
            "from" => "act_" . $row["id_acteur_source"],
            "to" => "act_" . $row["id_acteur_cible"],
            "type_relation" => $row["type_relation"],
            "direction" => $row["direction_relation"],
            "impact_source_vers_cible" => $row["impact_source_vers_cible"],
            "impact_cible_vers_source" => $row["impact_cible_vers_source"],
            "nature_relation" => $row["nature_relation"],
            "duree_relation" => $row["duree_relation"]
        ];
    }

    echo json_encode($relations, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["error" => "Erreur SQL : " . $e->getMessage()]);
}
?>
