<?php
session_start();
include 'config.php';

if (!isset($_SESSION["id_utilisateur"])) {
    echo json_encode([]);
    exit();
}

$id_utilisateur = $_SESSION["id_utilisateur"];

try {
    // On récup tous les acteurs créés par l'utilisateur
    $sql = "SELECT id_acteur, nom, prenom FROM acteur WHERE id_utilisateur = :id_utilisateur";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(["id_utilisateur" => $id_utilisateur]);
    $acteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    echo json_encode($acteurs);
} catch (Exception $e) {
    echo json_encode([]);
}
?>
