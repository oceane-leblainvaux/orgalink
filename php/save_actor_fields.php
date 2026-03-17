<?php
require_once "config.php"; 

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_acteur'])) {
    echo json_encode(["success" => false, "message" => "ID acteur manquant"]);
    exit;
}

$id = intval($data['id_acteur']);
$role = isset($data['role_entreprise']) ? $data['role_entreprise'] : null;
$age = isset($data['age']) ? intval($data['age']) : null;
$secteur = isset($data['secteur']) ? $data['secteur'] : null;
$extraFields = isset($data['extraFields']) ? json_encode($data['extraFields'], JSON_UNESCAPED_UNICODE) : null;

try {
    $stmt = $pdo->prepare("
        UPDATE acteur 
        SET role_entreprise = :role, age = :age, secteur = :secteur, extra_fields = :extraFields
        WHERE id_acteur = :id
    ");
    $stmt->execute([
        ':role' => $role,
        ':age' => $age,
        ':secteur' => $secteur,
        ':extraFields' => $extraFields,
        ':id' => $id
    ]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
