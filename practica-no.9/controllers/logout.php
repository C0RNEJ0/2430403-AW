<?php
// Iniciar sesión para acceder a variables de sesión
session_start();

// Destruir todas las variables de sesión del usuario
session_destroy();

// Redirigir al formulario de inicio de sesión
header('Location: ../index.html');
exit;
?>
