<?php
session_start();
include 'config.php';

if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode(["success" => false, "message" => "Non connecté"]);
    exit();
}

$id = $_SESSION['id_utilisateur'];

$stmt = $pdo->prepare("SELECT id_utilisateur, nom, prenom, role FROM utilisateur WHERE id_utilisateur = ?");
$stmt->execute([$id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode([
        "success" => true,
        "userId" => $user['id_utilisateur'],
        "prenom" => $user['prenom'],
        "nom" => $user['nom'],
        "role" => $user['role'] 
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Utilisateur introuvable"]);
}
