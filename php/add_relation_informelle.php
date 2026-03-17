<?php 
include 'config.php';
$data = json_decode(file_get_contents("php://input"), true);
$source = $data["source"];
$cible = $data["cible"];
$type = $data["type"];
$direction = $data["direction"];

$sql = "INSERT INTO relation_informelle (id_acteur_source, id_acteur_cible, type_relation, Direction_Relation) 
        VALUES ('$source', '$cible', '$type', '$direction')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Erreur insertion"]);
}

$conn->close();
?>
