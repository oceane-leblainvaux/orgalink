<?php
include 'config.php';

header("Content-Type: application/json; charset=UTF-8");

if (!isset($_POST['id'])) {
    echo json_encode(["success" => false, "message" => "ID manquant"]);
    exit;
}

$id = intval($_POST['id']);

try {
    $stmt = $pdo->prepare("DELETE FROM acteur WHERE id_acteur = :id");
    $stmt->execute(['id' => $id]);

    // Supprimer aussi les relations hiérarchiques où il est source
    $pdo->prepare("DELETE FROM relation_hierarchique WHERE id_acteur_source = :id")->execute(['id' => $id]);
    $pdo->prepare("DELETE FROM relation_hierarchique WHERE id_acteur_superieur = :id")->execute(['id' => $id]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
