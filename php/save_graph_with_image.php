<?php
include 'config.php';
header('Content-Type: application/json');
session_start();
 
if (!isset($_POST['id_utilisateur']) || !isset($_FILES['image']) || !isset($_POST['type_schema'])) {
    echo json_encode(["success" => false, "message" => "Champs manquants."]);
    exit();
}
 
$graph_json = isset($_POST['graph_json']) ? $_POST['graph_json'] : null;
 
$id_utilisateur = $_POST['id_utilisateur'];
$type_schema = $_POST['type_schema'];
$nom_schema = isset($_POST['nom']) ? $_POST['nom'] : "schema_" . time(); 
$image = $_FILES['image'];
 
$dir = "../schemas/";
$img_dir = $dir . "img/";
 
if (!file_exists($dir)) mkdir($dir, 0777, true);
if (!file_exists($img_dir)) mkdir($img_dir, 0777, true);
 
try {
    $stmt = $pdo->prepare("SELECT nom, prenom FROM utilisateur WHERE id_utilisateur = :id");
    $stmt->execute(['id' => $id_utilisateur]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
 
    if (!$user) {
        echo json_encode(["success" => false, "message" => "Utilisateur introuvable."]);
        exit();
    }
 
    $filename_base = $nom_schema;
    $img_path = $img_dir . $filename_base . ".png";
 
    if (!move_uploaded_file($image['tmp_name'], $img_path)) {
        echo json_encode(["success" => false, "message" => "Erreur lors de l'enregistrement de l'image."]);
        exit();
    }
 
    // Sauvegarde du JSON du graphe si fourni
    if ($graph_json) {
        $json_dir = $dir . "json/";
        if (!file_exists($json_dir)) mkdir($json_dir, 0777, true);
        file_put_contents($json_dir . $filename_base . ".json", $graph_json);
    }
 
    $stmt = $pdo->prepare("INSERT INTO schema_table 
        (id_utilisateur, nom, type_schema, actif, date_time, nom_fichier) 
        VALUES (:id, :nom, :type, 1, NOW(), :fichier)");
 
    $stmt->execute([
        'id' => $id_utilisateur,
        'nom' => $nom_schema,
        'type' => $type_schema,
        'fichier' => $filename_base . ".png"
    ]);
 
    echo json_encode([
        "success" => true,
        "message" => "Schéma enregistré avec succès.",
        "nom_fichier" => $filename_base . ".png"
    ]);
 
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Erreur SQL : " . $e->getMessage()
    ]);
}
?> 