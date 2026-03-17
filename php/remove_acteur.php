<?php
if (isset($_GET["id_acteur"])) {
    include 'config.php';
    $id_acteur = $_GET["id_acteur"];

    try {
        $pdo->beginTransaction();

        $pdo->prepare("DELETE FROM relation_hierarchique WHERE id_acteur_source = :id_acteur OR id_acteur_superieur = :id_acteur")
            ->execute(['id_acteur' => $id_acteur]);

        $pdo->prepare("DELETE FROM acteur WHERE id_acteur = :id_acteur")
            ->execute(['id_acteur' => $id_acteur]);

        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Acteur supprimé avec succès"]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Erreur lors de la suppression : " . $e->getMessage()]);
    }
}
?>
