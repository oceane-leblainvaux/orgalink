<?php
include 'config.php';
header('Content-Type: application/json');
session_start();
 
if (!isset($_GET['nom'])) {
    echo json_encode(["success" => false, "message" => "Nom manquant."]);
    exit();
}
 
$nom = basename($_GET['nom']);
$nom = pathinfo($nom, PATHINFO_FILENAME); // enlève .png si le nom contient .png

$json_path = "../schemas/" . $nom . ".json";
 
if (!file_exists($json_path)) {
    echo json_encode(["success" => false, "message" => "Fichier JSON introuvable."]);
    exit();
}
 
$json_data = file_get_contents($json_path);
echo json_encode(["success" => true, "data" => json_decode($json_data)]); 