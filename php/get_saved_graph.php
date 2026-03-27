<?php
session_start();
include 'config.php';
header('Content-Type: application/json');

// Cas 1 : non connecté → aucun graphique
if (!isset($_SESSION['id_utilisateur'])) {
    echo json_encode(["success" => true, "schemas" => []]);
    exit();
}

$id_utilisateur = $_SESSION['id_utilisateur'];
$role = $_SESSION['role'] ?? 'eleve';

try {
    // Cas 3 : prof → tous les graphiques
    if ($role === 'prof') {
        $stmt = $pdo->prepare("
            SELECT 
                s.id_schema, 
                s.nom, 
                s.nom_fichier, 
                s.date_time, 
                s.type_schema, 
                u.nom AS nom_utilisateur, 
                u.prenom
            FROM schema_table s
            JOIN utilisateur u ON s.id_utilisateur = u.id_utilisateur
            ORDER BY s.date_time DESC
        ");
        $stmt->execute();

    // Cas 2 : élève → uniquement ses propres graphiques
    } else {
        $stmt = $pdo->prepare("
            SELECT 
                s.id_schema, 
                s.nom, 
                s.nom_fichier, 
                s.date_time, 
                s.type_schema, 
                u.nom AS nom_utilisateur, 
                u.prenom
            FROM schema_table s
            JOIN utilisateur u ON s.id_utilisateur = u.id_utilisateur
            WHERE s.id_utilisateur = ?
            ORDER BY s.date_time DESC
        ");
        $stmt->execute([$id_utilisateur]);
    }

    $schemas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "schemas" => $schemas]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erreur SQL : " . $e->getMessage()]);
}
?>