<?php
// Sistema de autenticacion y autorizacion
// Clinica cornejo

// Prevenir acceso directo
if (!defined('BASE_PATH')) {
    define('BASE_PATH', dirname(__DIR__));
}

require_once BASE_PATH . '/config/config.php';

// Iniciar sesion 
function iniciarSesionSegura() {
    // Solo iniciamos sesion si no esta iniciada
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Verificar si el usuario esta autenticado
function estaAutenticado() {
    iniciarSesionSegura();
    return isset($_SESSION['usuario_id']) && isset($_SESSION['rol']);
}

// Obtener usuario actual
function obtenerUsuarioActual() {
    if (!estaAutenticado()) {
        return null;
    }
    
    return [
        'usuario_id' => $_SESSION['usuario_id'],
        'nombre' => $_SESSION['nombre'] ?? '',
        'email' => $_SESSION['email'] ?? '',
        'rol' => $_SESSION['rol'] ?? '',
        'medico_id' => $_SESSION['medico_id'] ?? null,
        'paciente_id' => $_SESSION['paciente_id'] ?? null
    ];
}

// Verificar si el usuario tiene un rol especifico
function tieneRol($rol) {
    if (!estaAutenticado()) {
        return false;
    }
    
    if (is_array($rol)) {
        return in_array($_SESSION['rol'], $rol);
    }
    
    return $_SESSION['rol'] === $rol;
}

// Requerir autenticacion redirige si no esta autenticado
function requerirAutenticacion() {
    if (!estaAutenticado()) {
        header('Location: ' . url('views/login/login.html'));
        exit;
    }
}

// Requerir rol especifico redirige si no tiene el rol
function requerirRol($rol) {
    requerirAutenticacion();
    
    if (!tieneRol($rol)) {
        http_response_code(403);
        die(json_encode([
            'exito' => false,
            'error' => 'No tienes permisos para acceder a esta funcion'
        ]));
    }
}

// Verificar permisos segun rol
function tienePermiso($accion, $modulo = null) {
    if (!estaAutenticado()) {
        return false;
    }
    
    $rol = $_SESSION['rol'];
    
    // Super admin tiene todos los permisos
    if ($rol === 'super_admin') {
        return true;
    }
    
    // Definir permisos por rol
    $permisos = [
        'medico' => [
            'pacientes' => ['crear', 'editar', 'ver', 'eliminar'],
            'expedientes' => ['crear', 'editar', 'ver'],
            'consultas' => ['crear', 'editar', 'ver'],
            'citas' => ['ver', 'editar'],
            'reportes' => ['ver'],
            'bitacoras' => ['ver_propias']
        ],
        'secretaria' => [
            'pacientes' => ['crear', 'editar', 'ver'],
            'citas' => ['crear', 'editar', 'ver', 'eliminar'],
            'pagos' => ['crear', 'ver'],
            'consultas' => ['ver', 'agregar_info'],
            'reportes' => ['ver']
        ],
        'paciente' => [
            'expedientes' => ['ver_propio'],
            'consultas' => ['ver_propias'],
            'citas' => ['ver_propias']
        ]
    ];
    
    if (!isset($permisos[$rol])) {
        return false;
    }
    
    if ($modulo === null) {
        return true; // Si no se especifica modulo solo verifica que este autenticado
    }
    
    if (!isset($permisos[$rol][$modulo])) {
        return false;
    }
    
    return in_array($accion, $permisos[$rol][$modulo]);
}

// Iniciar sesion de usuario
function iniciarSesionUsuario($usuario) {
    iniciarSesionSegura();
    
    $_SESSION['usuario_id'] = $usuario['usuario_id'];
    $_SESSION['nombre'] = $usuario['nombre'];
    $_SESSION['email'] = $usuario['email'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['medico_id'] = $usuario['medico_id'] ?? null;
    $_SESSION['paciente_id'] = $usuario['paciente_id'] ?? null;
    $_SESSION['ultima_actividad'] = time();
    
    // Actualizar ultimo acceso en bd
    require_once BASE_PATH . '/config/database.php';
    $conn = getConnection();
    
    $stmt = $conn->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario['usuario_id']);
    $stmt->execute();
    $stmt->close();
}

// Cerrar sesion
function cerrarSesion() {
    iniciarSesionSegura();
    
    // Registrar logout en bitacora
    if (isset($_SESSION['usuario_id'])) {
        require_once BASE_PATH . '/config/bitacora.php';
        registrarAcceso($_SESSION['usuario_id'], 'logout');
    }
    
    // Destruir sesion
    $_SESSION = [];
    
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    session_destroy();
}

// Validar credenciales de usuario
function validarCredenciales($email, $password) {
    require_once BASE_PATH . '/config/database.php';
    $conn = getConnection();
    
    $stmt = $conn->prepare("
        SELECT u.usuario_id, u.nombre, u.email, u.pass_hash, r.nombre as rol, 
               u.medico_id, u.paciente_id, u.activo
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.rol_id
        WHERE u.email = ?
    ");
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        return false;
    }
    
    $usuario = $result->fetch_assoc();
    $stmt->close();
    
    // Verificar si el usuario esta activo
    if (!$usuario['activo']) {
        return false;
    }
    
    // Verificar contraseña sha2-256
    $hash_ingresado = hash('sha256', $password);
    
    if ($hash_ingresado !== $usuario['pass_hash']) {
        return false;
    }
    
    return $usuario;
}

// Generar token csrf
function generarTokenCSRF() {
    iniciarSesionSegura();
    
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

// Verificar token csrf
function verificarTokenCSRF($token) {
    iniciarSesionSegura();
    
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}
?>


