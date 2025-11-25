<?php

// Definir ruta base
define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/config/database.php';
require_once BASE_PATH . '/config/auth.php';
require_once BASE_PATH . '/config/bitacora.php';

// Configurar headers para JSON
header('Content-Type: application/json; charset=utf-8');

// Obtener acción
$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

try {
    switch ($accion) {
        case 'login':
            login();
            break;
            
        case 'logout':
            logout();
            break;
            
        case 'verificar_sesion':
            verificarSesion();
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'exito' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Procesar login
 */
function login() {
    // Validar datos
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        throw new Exception('Email y contraseña son requeridos');
    }
    
    // Validar formato de email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email no válido');
    }
    
    // Validar credenciales
    $usuario = validarCredenciales($email, $password);
    
    if (!$usuario) {
        // Registrar intento fallido
        $conn = getConnection();
        $stmt = $conn->prepare("SELECT usuario_id FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            registrarAcceso($row['usuario_id'], 'intento_fallido', 'Contraseña incorrecta');
        }
        $stmt->close();
        
        throw new Exception('Credenciales incorrectas');
    }
    
    // Iniciar sesión
    iniciarSesionUsuario($usuario);
    
    // Registrar acceso exitoso
    registrarAcceso($usuario['usuario_id'], 'login');
    
    // Crear sesión en BD
    crearSesionBD($usuario['usuario_id']);
    
    // Registrar log de login
    require_once __DIR__ . '/../config/bitacoras_helpers.php';
    registrar_log('login', 'usuarios', $usuario['usuario_id'], 'Inicio de sesión exitoso');
    
    // Retornar datos del usuario
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Inicio de sesión exitoso',
        'usuario' => [
            'usuario_id' => $usuario['usuario_id'],
            'nombre' => $usuario['nombre'],
            'email' => $usuario['email'],
            'rol' => $usuario['rol']
        ],
        'redirect' => obtenerRedireccionPorRol($usuario['rol'])
    ]);
}

/**
 * Procesar logout
 */
function logout() {
    iniciarSesionSegura();
    
    if (!estaAutenticado()) {
        throw new Exception('No hay sesión activa');
    }
    
    $usuario_id = $_SESSION['usuario_id'];
    
    // Registrar logout
    registrarAcceso($usuario_id, 'logout');
    
    // Cerrar sesión
    cerrarSesion();
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Sesión cerrada correctamente',
        'redirect' => '../login/login.html'
    ]);
}

/**
 * Verificar si hay sesión activa
 */
function verificarSesion() {
    iniciarSesionSegura();
    
    if (!estaAutenticado()) {
        echo json_encode([
            'exito' => false,
            'autenticado' => false
        ]);
        return;
    }
    
    $usuario = obtenerUsuarioActual();
    
    echo json_encode([
        'exito' => true,
        'autenticado' => true,
        'usuario' => $usuario
    ]);
}

/**
 * Crear sesión en base de datos
 */
function crearSesionBD($usuario_id) {
    $conn = getConnection();
    
    $sesion_id = session_id();
    $expiracion = date('Y-m-d H:i:s', time() + 7200); // 2 horas
    
    // Desactivar sesiones anteriores del usuario
    $stmt = $conn->prepare("UPDATE sesiones SET activa = 0 WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $stmt->close();
    
    // Crear nueva sesión
    $stmt = $conn->prepare("
        INSERT INTO sesiones (sesion_id, usuario_id, fecha_expiracion)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            fecha_expiracion = VALUES(fecha_expiracion),
            activa = 1
    ");
    
    $stmt->bind_param("sis", $sesion_id, $usuario_id, $expiracion);
    $stmt->execute();
    $stmt->close();
}

/**
 * Obtener URL de redirección según rol
 */
function obtenerRedireccionPorRol($rol) {
    switch ($rol) {
        case 'super_admin':
            return '../dashboard.html';
        case 'medico':
            return '../dashboard.html';
        case 'secretaria':
            return '../agenda.html';
        case 'paciente':
            return '../mi-expediente.html';
        default:
            return '../dashboard.html';
    }
}
