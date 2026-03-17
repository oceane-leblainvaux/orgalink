<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'config.php'; 

if (!isset($_GET["id_acteur"])) {
    echo json_encode(["error" => "ID acteur manquant"]);
    exit();
}

$id_acteur = $_GET["id_acteur"]; 

try {
    $sql = "SELECT a.*, r.id_acteur_superieur 
            FROM acteur a
            LEFT JOIN relation_hierarchique r ON a.id_acteur = r.id_acteur_source
            WHERE a.id_acteur = :id_acteur";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(["id_acteur" => $id_acteur]);
    $acteur = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$acteur) {
        echo json_encode(["error" => "Aucun acteur trouvé"]);
        exit();
    }

    $acteur["id_acteur_superieur"] = isset($acteur["id_acteur_superieur"]) ? $acteur["id_acteur_superieur"] : "";

    header('Content-Type: application/json');
    echo json_encode($acteur, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["error" => "Erreur SQL : " . $e->getMessage()]);
}
?>
