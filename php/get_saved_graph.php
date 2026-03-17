<?php
include 'config.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("SELECT 
                                s.id_schema, 
                                s.nom, 
                                s.nom_fichier, 
                                s.date_time, 
                                s.type_schema, 
                                u.nom AS nom_utilisateur, 
                                u.prenom
                           FROM schema_table s
                           JOIN utilisateur u ON s.id_utilisateur = u.id_utilisateur
                           ORDER BY s.date_time DESC");
    $stmt->execute();
    $schemas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "schemas" => $schemas]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Erreur SQL : " . $e->getMessage()]);
}
?>
