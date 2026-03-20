<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
if (file_exists(__DIR__ . '/db_config.php')) {
    require_once __DIR__ . '/db_config.php';
} else {
    $host = "localhost"; 
    $dbname = "projet_m1"; 
    $username = "root"; 
    $password = ""; 
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        die("Erreur de connexion : " . $e->getMessage());
    }
}
?>