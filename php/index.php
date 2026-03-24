<?php
session_start();

// Si l'utilisateur est co, on redirige vers page d'accueil
if (isset($_SESSION['id_utilisateur'])) {
    header("Location: ../html/index.html");
    exit;
} else {
    // Sinonil va vers la page de login
    header("Location: ../html/login.html");
    exit;
}
?>
