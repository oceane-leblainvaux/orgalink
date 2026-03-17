<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

session_start();

if (!isset($_SESSION['id_utilisateur'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Utilisateur non connecté"]);
    exit;
}

require_once 'config.php';
$id_utilisateur = $_SESSION['id_utilisateur'];

try {
    $stmt = $pdo->prepare("
        SELECT 
            a.id_acteur, 
            a.nom, 
            a.prenom, 
            a.age, 
            a.role_entreprise, 
            a.secteur,
            a.extra_fields,  
            r.id_acteur_superieur
        FROM acteur a
        LEFT JOIN relation_hierarchique r ON a.id_acteur = r.id_acteur_source
        WHERE a.id_utilisateur = :id_utilisateur
    ");

    $stmt->execute(['id_utilisateur' => $id_utilisateur]);
    $acteurs = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $acteurs[] = [
            "id_acteur" => isset($row["id_acteur"]) ? $row["id_acteur"] : "",
            "prenom" => isset($row["prenom"]) ? $row["prenom"] : "",
            "nom" => isset($row["nom"]) ? $row["nom"] : "",
            "age" => isset($row["age"]) ? $row["age"] : "",
            "role_entreprise" => isset($row["role_entreprise"]) ? $row["role_entreprise"] : "",
            "secteur" => isset($row["secteur"]) ? $row["secteur"] : "",
            "id_acteur_superieur" => isset($row["id_acteur_superieur"]) ? $row["id_acteur_superieur"] : "",
            "extra_fields" => !empty($row["extra_fields"]) ? json_decode($row["extra_fields"], true) : []
        ];
    }

    echo json_encode($acteurs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
