<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode(["success" => false, "message" => "Utilisateur non connecté"]);
    exit;
}

$id_utilisateur = $_SESSION['id_utilisateur'];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nom = !empty($_POST["nom"]) ? trim($_POST["nom"]) : null;
    $prenom = !empty($_POST["prenom"]) ? trim($_POST["prenom"]) : null;
    $age = isset($_POST["age"]) && $_POST["age"] !== '' ? intval($_POST["age"]) : null;
    $role_entreprise = isset($_POST["role_entreprise"]) ? trim($_POST["role_entreprise"]) : null;
    $secteur = isset($_POST["secteur"]) ? trim($_POST["secteur"]) : null;
    $id_superieur = isset($_POST["id_superieur"]) && $_POST["id_superieur"] !== '' ? intval($_POST["id_superieur"]) : null;

    // Seuls nom et prenom sont obligatoires
    if (!$nom || !$prenom) {
        echo json_encode(["success" => false, "message" => "Champs obligatoires manquants (nom et prénom)"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO acteur (nom, prenom, age, role_entreprise, secteur, id_utilisateur)
                               VALUES (:nom, :prenom, :age, :role_entreprise, :secteur, :id_utilisateur)");
        $stmt->execute([
            'nom' => $nom,
            'prenom' => $prenom,
            'age' => $age,
            'role_entreprise' => $role_entreprise ?: null,
            'secteur' => $secteur ?: null,
            'id_utilisateur' => $id_utilisateur
        ]);

        $id_acteur = $pdo->lastInsertId();

        if ($id_superieur !== null) {
            $stmtRel = $pdo->prepare("INSERT INTO relation_hierarchique (id_acteur_source, id_acteur_superieur)
                                      VALUES (:id_acteur_source, :id_acteur_superieur)");
            $stmtRel->execute([
                'id_acteur_source' => $id_acteur,
                'id_acteur_superieur' => $id_superieur
            ]);
        }

        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Acteur ajouté avec succès"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Erreur : " . $e->getMessage()]);
    }
}
?>
