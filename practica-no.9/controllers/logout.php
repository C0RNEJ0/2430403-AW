<?php
// Esto inicia la sesion
session_start();

// Esto destruye todas las variables de sesion
session_destroy();

// Esto redirige al login
header('Location: ../index.html');
exit;
?>
