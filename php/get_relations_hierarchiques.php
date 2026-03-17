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

try {
    $sql = "SELECT rh.id_acteur_source, rh.id_acteur_superieur, rh.type_relation
            FROM relation_hierarchique rh
            JOIN acteur a ON rh.id_acteur_source = a.id_acteur
            WHERE a.id_utilisateur = :id_utilisateur AND rh.active = 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(["id_utilisateur" => $id_utilisateur]);

    $relations = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (empty($row["id_acteur_superieur"])) {
            continue;
        }

        $relations[] = [
            "from" => "act_" . $row["id_acteur_source"],
            "to" => "act_" . $row["id_acteur_superieur"],
            "type" => $row["type_relation"],
            "color" => "#888"  
        ];
    }

    header('Content-Type: application/json');
    echo json_encode($relations, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["error" => "Erreur SQL : " . $e->getMessage()]);
}
?>
