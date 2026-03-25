<?php
include 'config.php';
header('Content-Type: application/json');
session_start();
 
if (!isset($_GET['nom'])) {
    echo json_encode(["success" => false, "message" => "Nom manquant."]);
    exit();
}
 
$nom = basename($_GET['nom']); // sécurité
$json_path = "../schemas/json/" . $nom . ".json";
 
if (!file_exists($json_path)) {
    echo json_encode(["success" => false, "message" => "Fichier JSON introuvable."]);
    exit();
}
 
$json_data = file_get_contents($json_path);
echo json_encode(["success" => true, "data" => json_decode($json_data)]);