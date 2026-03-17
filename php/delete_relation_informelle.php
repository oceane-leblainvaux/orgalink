<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
include 'config.php';

// Vérif que l'utilisateur est connecté
if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode(["error" => "Utilisateur non connecté"]);
    exit();
}

$id_utilisateur = $_SESSION['id_utilisateur'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit();
}

// Récupère les données JSON envoyées
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_relation_informelle'])) {
    echo json_encode(["error" => "ID de la relation manquant"]);
    exit();
}

$id_relation = $data['id_relation_informelle'];

try {
    $sql = "DELETE FROM relation_informelle 
            WHERE id_relation_informelle = ? AND id_utilisateur = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_relation, $id_utilisateur]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Relation non trouvée ou non autorisée"]);
    }

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>