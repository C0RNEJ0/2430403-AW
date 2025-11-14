<?php

// Configuración de la base de datos

define('BD_HOST', '127.0.0.1');
define('BD_USUARIO', 'admin');
define('BD_CONTRASENA', 'e8d0055b61beef5a1681ee280703da98497636b40340afca');
define('BD_NOMBRE', 'clinica_cornejo');

function obtenerConexion() {
    $conexion = new mysqli(BD_HOST, BD_USUARIO, BD_CONTRASENA, BD_NOMBRE);

    if ($conexion->connect_error) {
        die("Error de conexión: " . $conexion->connect_error);
    }

    $conexion->set_charset("utf8");
    return $conexion;
}

function getConnection() {
    return obtenerConexion();
}
?>

