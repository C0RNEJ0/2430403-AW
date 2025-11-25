<?php

/**
 * Verifica si el usuario tiene acceso a la página actual
 * @param array $rolesPermitidos - Array de roles que pueden acceder
 * @return void - Redirige si no tiene permiso
 */
function verificarAcceso($rolesPermitidos = []) {
    // Iniciar sesión si no está iniciada
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Verificar si está autenticado
    if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['rol'])) {
        // No autenticado - redirigir al login
        header('Location: ../login/login.html');
        exit;
    }
    
    // Si no se especifican roles, solo verificar autenticación
    if (empty($rolesPermitidos)) {
        return;
    }
    
    // Verificar si el rol del usuario está en los roles permitidos
    $rolUsuario = $_SESSION['rol'];
    
    if (!in_array($rolUsuario, $rolesPermitidos)) {
        // No tiene permiso - mostrar error 403
        http_response_code(403);
        echo '<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Acceso Denegado</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="container">
                <div class="row justify-content-center align-items-center" style="min-height: 100vh;">
                    <div class="col-md-6">
                        <div class="card shadow">
                            <div class="card-body text-center p-5">
                                <i class="bi bi-shield-x text-danger" style="font-size: 4rem;"></i>
                                <h1 class="mt-3">Acceso Denegado</h1>
                                <p class="text-muted">No tienes permisos para acceder a esta página.</p>
                                <p class="text-muted">Tu rol actual: <strong>' . htmlspecialchars($rolUsuario) . '</strong></p>
                                <a href="../dashboard.html" class="btn btn-primary mt-3">
                                    <i class="bi bi-house"></i> Ir al Dashboard
                                </a>
                                <a href="../controllers/logout.php" class="btn btn-outline-secondary mt-3">
                                    <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>';
        exit;
    }
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param string $rol - Rol a verificar
 * @return bool
 */
function tieneRol($rol) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    return isset($_SESSION['rol']) && $_SESSION['rol'] === $rol;
}

/**
 * Verifica si el usuario es administrador
 * @return bool
 */
function esAdmin() {
    return tieneRol('super_admin');
}

/**
 * Verifica si el usuario es médico
 * @return bool
 */
function esMedico() {
    return tieneRol('medico');
}

/**
 * Verifica si el usuario es secretaria
 * @return bool
 */
function esSecretaria() {
    return tieneRol('secretaria');
}

/**
 * Obtiene el rol del usuario actual
 * @return string|null
 */
function obtenerRolActual() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    return $_SESSION['rol'] ?? null;
}
?>
