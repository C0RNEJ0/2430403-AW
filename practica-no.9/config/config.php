<?php
// Configuracion basica del proyecto
// Clinica cornejo

// Evitar que entren directo al archivo
defined('APP_ACCESS') or define('APP_ACCESS', true);

// Rutas donde estan las carpetas

// La direccion web de mi proyecto
// Si lo subes a internet cambia esto
define('URL_BASE', '/practica-no.9');

// La carpeta principal en mi compu
define('RUTA_BASE', __DIR__ . '/..');

// Carpetas importantes
define('URL_ASSETS', URL_BASE . '/assets');
define('RUTA_VISTAS', RUTA_BASE . '/views');
define('RUTA_CONTROLADORES', RUTA_BASE . '/controllers');

// Datos de la app

define('NOMBRE_APP', 'Clínica Cornejo');
define('ZONA_HORARIA', 'America/Mexico_City');

// Poner la hora de mexico
date_default_timezone_set(ZONA_HORARIA);

// Funciones de ayuda para no escribir tanto

// Funcion para crear links completos
function url($ruta = '') {
    // Quitar la barra del principio si tiene
    $ruta = ltrim($ruta, '/');
    // Pegar la url base con la ruta
    return URL_BASE . ($ruta ? '/' . $ruta : '');
}

// Funcion para cargar archivos css js imagenes
function asset($ruta) {
    $ruta = ltrim($ruta, '/');
    return URL_ASSETS . '/' . $ruta;
}

// Funcion para mandar a otra pagina
function redireccionar($ruta) {
    header('Location: ' . url($ruta));
    exit;
}

// Sesion para saber quien entro

// Si no hay sesion iniciada iniciarla
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Errores para ver si me equivoco

// Poner en false cuando ya este terminado
define('MODO_PRUEBA', true);

if (MODO_PRUEBA) {
    // Mostrar todos los errores
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    // No mostrar nada
    error_reporting(0);
    ini_set('display_errors', 0);
}
?>
