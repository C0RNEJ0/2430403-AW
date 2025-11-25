<?php


require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/../controllers/bitacoras_helpers.php';

header('Content-Type: application/json; charset=utf-8');

session_start();

// Verificar autenticación
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['exito' => false, 'error' => 'No autenticado']);
    exit;
}

$bd = obtener_conexion();
if (!$bd) {
    echo json_encode(['exito' => false, 'error' => 'Error de conexión a BD']);
    exit;
}

$accion = $_POST['accion'] ?? '';

try {
    switch ($accion) {
        case 'crear_medico':
            crearMedico($bd);
            break;
            
        case 'crear_secretaria':
            crearSecretaria($bd);
            break;
            
        default:
            echo json_encode(['exito' => false, 'error' => 'Acción no válida']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}

/**
 * Crear médico con usuario
 */
function crearMedico($bd) {
    $usuario_id = $_SESSION['usuario_id'] ?? null;
    
    // Validar datos requeridos
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $especialidad_id = intval($_POST['especialidad_id'] ?? 0);
    $telefono = trim($_POST['telefono'] ?? '');
    $horario = trim($_POST['horario'] ?? '');
    $cedula = trim($_POST['cedula_profesional'] ?? '');
    
    if (empty($nombre) || empty($email) || empty($password)) {
        echo json_encode(['exito' => false, 'error' => 'Nombre, email y contraseña son requeridos']);
        return;
    }
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['exito' => false, 'error' => 'Email no válido']);
        return;
    }
    
    // Verificar que el email no exista
    $stmt = $bd->prepare("SELECT usuario_id FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(['exito' => false, 'error' => 'El email ya está registrado']);
        return;
    }
    
    // Obtener rol_id de 'medico'
    $stmt = $bd->prepare("SELECT rol_id FROM roles WHERE nombre = 'medico'");
    $stmt->execute();
    $rol = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$rol) {
        echo json_encode(['exito' => false, 'error' => 'Rol de médico no encontrado']);
        return;
    }
    $rol_id = $rol['rol_id'];
    
    // Iniciar transacción
    $bd->beginTransaction();
    
    try {
        // 1. Crear registro en medicos
        $sql = "INSERT INTO medicos (nombre, email, telefono, cedula_profesional, especialidad_id, horario, activo) 
                VALUES (:nombre, :email, :telefono, :cedula, :especialidad_id, :horario, 1)";
        
        $stmt = $bd->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':email' => $email,
            ':telefono' => $telefono,
            ':cedula' => $cedula,
            ':especialidad_id' => $especialidad_id > 0 ? $especialidad_id : null,
            ':horario' => $horario
        ]);
        
        $medico_id = $bd->lastInsertId();
        
        // 2. Crear usuario vinculado
        $pass_hash = hash('sha256', $password);
        
        $sql = "INSERT INTO usuarios (nombre, email, pass_hash, rol_id, medico_id, activo, creado_por) 
                VALUES (:nombre, :email, :pass_hash, :rol_id, :medico_id, 1, :creado_por)";
        
        $stmt = $bd->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':email' => $email,
            ':pass_hash' => $pass_hash,
            ':rol_id' => $rol_id,
            ':medico_id' => $medico_id,
            ':creado_por' => $usuario_id
        ]);
        
        $nuevo_usuario_id = $bd->lastInsertId();
        
        // Registrar en bitácora
        registrar_bitacora_pdo(
            $bd,
            $usuario_id,
            'INSERT',
            'usuarios',
            $nuevo_usuario_id,
            "Creado médico: $nombre ($email)"
        );
        
        // Confirmar transacción
        $bd->commit();
        
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Médico creado exitosamente',
            'usuario_id' => $nuevo_usuario_id,
            'medico_id' => $medico_id
        ]);
        
    } catch (Exception $e) {
        $bd->rollBack();
        throw $e;
    }
}

/**
 * Crear secretaria con usuario
 */
function crearSecretaria($bd) {
    $usuario_id = $_SESSION['usuario_id'] ?? null;
    
    // Validar datos requeridos
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $telefono = trim($_POST['telefono'] ?? '');
    $medico_asociado_id = intval($_POST['medico_id'] ?? 0);
    
    if (empty($nombre) || empty($email) || empty($password)) {
        echo json_encode(['exito' => false, 'error' => 'Nombre, email y contraseña son requeridos']);
        return;
    }
    
    // Validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['exito' => false, 'error' => 'Email no válido']);
        return;
    }
    
    // Verificar que el email no exista
    $stmt = $bd->prepare("SELECT usuario_id FROM usuarios WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(['exito' => false, 'error' => 'El email ya está registrado']);
        return;
    }
    
    // Obtener rol_id de 'secretaria'
    $stmt = $bd->prepare("SELECT rol_id FROM roles WHERE nombre = 'secretaria'");
    $stmt->execute();
    $rol = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$rol) {
        echo json_encode(['exito' => false, 'error' => 'Rol de secretaria no encontrado']);
        return;
    }
    $rol_id = $rol['rol_id'];
    
    // Hash de contraseña
    $pass_hash = hash('sha256', $password);
    
    // Crear usuario (secretarias no necesitan registro en tabla medicos)
    $sql = "INSERT INTO usuarios (nombre, email, pass_hash, rol_id, medico_id, activo, creado_por) 
            VALUES (:nombre, :email, :pass_hash, :rol_id, :medico_id, 1, :creado_por)";
    
    $stmt = $bd->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':email' => $email,
        ':pass_hash' => $pass_hash,
        ':rol_id' => $rol_id,
        ':medico_id' => $medico_asociado_id > 0 ? $medico_asociado_id : null,
        ':creado_por' => $usuario_id
    ]);
    
    $nuevo_usuario_id = $bd->lastInsertId();
    
    // Registrar en bitácora
    $detalles = "Creada secretaria: $nombre ($email)";
    if ($medico_asociado_id > 0) {
        $detalles .= " - Asociada a médico ID: $medico_asociado_id";
    }
    
    registrar_bitacora_pdo(
        $bd,
        $usuario_id,
        'INSERT',
        'usuarios',
        $nuevo_usuario_id,
        $detalles
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Secretaria creada exitosamente',
        'usuario_id' => $nuevo_usuario_id
    ]);
}
?>
