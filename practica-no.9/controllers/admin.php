<?php
/**
 * Controlador de Administración de Personal
 * Clínica Cornejo
 * Solo accesible para Super Admin
 */

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/config/auth.php';

// Requerir autenticación y rol de super admin
requerirRol('super_admin');

// Si no hay acción específica, servir la vista
$accion = $_GET['accion'] ?? 'vista';

if ($accion === 'vista') {
    // Servir admin.html
    readfile(__DIR__ . '/../views/admin.html');
    exit;
}

// Para otras acciones (listar, eliminar, etc.), delegar a usuarios.php
// que ya tiene toda la lógica implementada
require_once __DIR__ . '/usuarios.php';
