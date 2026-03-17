<?php
include 'config.php';

if (isset($_POST['submit'])) {
    $firstname = $_POST['firstname'];
    $lastname = $_POST['lastname'];  
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $role = $_POST['role']; 

    

    // Vérifier si l'email existe déjà
    $checkEmail = $pdo->prepare("SELECT COUNT(*) FROM utilisateur WHERE email = :email");
    $checkEmail->execute(['email' => $email]);
    $emailExists = $checkEmail->fetchColumn();

    if ($emailExists > 0) {
        echo "Erreur : cet email est déjà utilisé.";
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $request = $pdo->prepare("INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, role) 
                                  VALUES (:email, :mot_de_passe, :nom, :prenom, :role)");
        $request->execute([
            'email' => $email,
            'mot_de_passe' => $hashed_password, 
            'nom' => $lastname,
            'prenom' => $firstname,
            'role' => $role
        ]);

        header('Location: ../html/login.html'); 
        exit();
    }
}
?>