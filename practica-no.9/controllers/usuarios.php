<?php
/**
 * Controlador de Usuarios
 * Clínica Cornejo
 * Solo accesible para Super Admin
 */

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/config/database.php';
require_once BASE_PATH . '/config/auth.php';
require_once BASE_PATH . '/config/bitacora.php';

// Configurar headers
header('Content-Type: application/json; charset=utf-8');

// Requerir autenticación y rol de super admin
requerirRol('super_admin');

// Obtener acción
$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

try {
    switch ($accion) {
        case 'listar':
            listarUsuarios();
            break;
            
        case 'crear':
            crearUsuario();
            break;
            
        case 'editar':
            editarUsuario();
            break;
            
        case 'eliminar':
            eliminarUsuario();
            break;
            
        case 'cambiar_estado':
            cambiarEstadoUsuario();
            break;
            
        case 'obtener':
            obtenerUsuario();
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
 * Listar todos los usuarios
 */
function listarUsuarios() {
    $conn = getConnection();
    
    $sql = "
        SELECT 
            u.usuario_id,
            u.nombre,
            u.email,
            r.nombre as rol,
            u.activo,
            u.creado_en,
            u.ultimo_acceso,
            m.nombre as medico_nombre,
            CONCAT(p.nombres, ' ', p.apellidos) as paciente_nombre,
            uc.nombre as creado_por_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.rol_id
        LEFT JOIN medicos m ON u.medico_id = m.medico_id
        LEFT JOIN pacientes p ON u.paciente_id = p.paciente_id
        LEFT JOIN usuarios uc ON u.creado_por = uc.usuario_id
        ORDER BY u.creado_en DESC
    ";
    
    $result = $conn->query($sql);
    $usuarios = $result->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'exito' => true,
        'usuarios' => $usuarios
    ]);
}

/**
 * Crear nuevo usuario
 */
function crearUsuario() {
    $conn = getConnection();
    $usuario_actual = obtenerUsuarioActual();
    
    // Validar datos
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $rol = trim($_POST['rol'] ?? '');
    $medico_id = !empty($_POST['medico_id']) ? intval($_POST['medico_id']) : null;
    $paciente_id = !empty($_POST['paciente_id']) ? intval($_POST['paciente_id']) : null;
    
    if (empty($nombre) || empty($email) || empty($password) || empty($rol)) {
        throw new Exception('Todos los campos son requeridos');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email no válido');
    }
    
    // Verificar que el email no exista
    $stmt = $conn->prepare("SELECT usuario_id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $stmt->close();
        throw new Exception('El email ya está registrado');
    }
    $stmt->close();
    
    // Obtener rol_id
    $stmt = $conn->prepare("SELECT rol_id FROM roles WHERE nombre = ?");
    $stmt->bind_param("s", $rol);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        throw new Exception('Rol no válido');
    }
    
    $rol_data = $result->fetch_assoc();
    $rol_id = $rol_data['rol_id'];
    $stmt->close();
    
    // Hash de contraseña
    $pass_hash = hash('sha256', $password);
    
    // Insertar usuario
    $stmt = $conn->prepare("
        INSERT INTO usuarios (nombre, email, pass_hash, rol_id, medico_id, paciente_id, creado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param(
        "sssiiis",
        $nombre,
        $email,
        $pass_hash,
        $rol_id,
        $medico_id,
        $paciente_id,
        $usuario_actual['usuario_id']
    );
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Error al crear usuario');
    }
    
    $nuevo_id = $stmt->insert_id;
    $stmt->close();
    
    // Registrar en bitácora
    registrarAccion(
        $usuario_actual['usuario_id'],
        'crear',
        'usuarios',
        $nuevo_id,
        "Usuario creado: {$nombre} ({$email}) con rol {$rol}",
        null,
        ['nombre' => $nombre, 'email' => $email, 'rol' => $rol]
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Usuario creado exitosamente',
        'usuario_id' => $nuevo_id
    ]);
}

/**
 * Editar usuario existente
 */
function editarUsuario() {
    $conn = getConnection();
    $usuario_actual = obtenerUsuarioActual();
    
    $usuario_id = intval($_POST['usuario_id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $rol = trim($_POST['rol'] ?? '');
    $medico_id = !empty($_POST['medico_id']) ? intval($_POST['medico_id']) : null;
    $paciente_id = !empty($_POST['paciente_id']) ? intval($_POST['paciente_id']) : null;
    
    if ($usuario_id <= 0 || empty($nombre) || empty($email) || empty($rol)) {
        throw new Exception('Datos incompletos');
    }
    
    // Obtener datos anteriores
    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $datos_anteriores = $result->fetch_assoc();
    $stmt->close();
    
    if (!$datos_anteriores) {
        throw new Exception('Usuario no encontrado');
    }
    
    // Obtener rol_id
    $stmt = $conn->prepare("SELECT rol_id FROM roles WHERE nombre = ?");
    $stmt->bind_param("s", $rol);
    $stmt->execute();
    $result = $stmt->get_result();
    $rol_data = $result->fetch_assoc();
    $rol_id = $rol_data['rol_id'];
    $stmt->close();
    
    // Actualizar usuario
    $stmt = $conn->prepare("
        UPDATE usuarios 
        SET nombre = ?, email = ?, rol_id = ?, medico_id = ?, paciente_id = ?
        WHERE usuario_id = ?
    ");
    
    $stmt->bind_param("ssiiii", $nombre, $email, $rol_id, $medico_id, $paciente_id, $usuario_id);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Error al actualizar usuario');
    }
    $stmt->close();
    
    // Registrar en bitácora
    registrarAccion(
        $usuario_actual['usuario_id'],
        'editar',
        'usuarios',
        $usuario_id,
        "Usuario editado: {$nombre}",
        $datos_anteriores,
        ['nombre' => $nombre, 'email' => $email, 'rol' => $rol]
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Usuario actualizado exitosamente'
    ]);
}

/**
 * Eliminar usuario
 */
function eliminarUsuario() {
    $conn = getConnection();
    $usuario_actual = obtenerUsuarioActual();
    
    $usuario_id = intval($_POST['usuario_id'] ?? 0);
    
    if ($usuario_id <= 0) {
        throw new Exception('ID de usuario no válido');
    }
    
    // No permitir eliminar el propio usuario
    if ($usuario_id == $usuario_actual['usuario_id']) {
        throw new Exception('No puedes eliminar tu propio usuario');
    }
    
    // Obtener datos del usuario
    $stmt = $conn->prepare("SELECT nombre, email FROM usuarios WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();
    
    if (!$usuario) {
        throw new Exception('Usuario no encontrado');
    }
    
    // Eliminar usuario
    $stmt = $conn->prepare("DELETE FROM usuarios WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario_id);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Error al eliminar usuario');
    }
    $stmt->close();
    
    // Registrar en bitácora
    registrarAccion(
        $usuario_actual['usuario_id'],
        'eliminar',
        'usuarios',
        $usuario_id,
        "Usuario eliminado: {$usuario['nombre']} ({$usuario['email']})",
        $usuario,
        null
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Usuario eliminado exitosamente'
    ]);
}

/**
 * Cambiar estado activo/inactivo
 */
function cambiarEstadoUsuario() {
    $conn = getConnection();
    $usuario_actual = obtenerUsuarioActual();
    
    $usuario_id = intval($_POST['usuario_id'] ?? 0);
    $activo = intval($_POST['activo'] ?? 1);
    
    if ($usuario_id <= 0) {
        throw new Exception('ID de usuario no válido');
    }
    
    // No permitir desactivar el propio usuario
    if ($usuario_id == $usuario_actual['usuario_id']) {
        throw new Exception('No puedes desactivar tu propio usuario');
    }
    
    $stmt = $conn->prepare("UPDATE usuarios SET activo = ? WHERE usuario_id = ?");
    $stmt->bind_param("ii", $activo, $usuario_id);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Error al cambiar estado');
    }
    $stmt->close();
    
    $estado_texto = $activo ? 'activado' : 'desactivado';
    
    // Registrar en bitácora
    registrarAccion(
        $usuario_actual['usuario_id'],
        'editar',
        'usuarios',
        $usuario_id,
        "Usuario {$estado_texto}",
        null,
        ['activo' => $activo]
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => "Usuario {$estado_texto} exitosamente"
    ]);
}

/**
 * Obtener un usuario específico
 */
function obtenerUsuario() {
    $conn = getConnection();
    
    $usuario_id = intval($_GET['usuario_id'] ?? 0);
    
    if ($usuario_id <= 0) {
        throw new Exception('ID de usuario no válido');
    }
    
    $stmt = $conn->prepare("
        SELECT 
            u.usuario_id,
            u.nombre,
            u.email,
            r.nombre as rol,
            u.medico_id,
            u.paciente_id,
            u.activo,
            u.creado_en,
            u.ultimo_acceso
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.rol_id
        WHERE u.usuario_id = ?
    ");
    
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();
    
    if (!$usuario) {
        throw new Exception('Usuario no encontrado');
    }
    
    echo json_encode([
        'exito' => true,
        'usuario' => $usuario
    ]);
}
