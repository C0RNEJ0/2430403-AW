<?php
// Controlador para gestión de roles
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/bitacoras_helpers.php';

// Configurar headers
header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar autenticación solo super_admin puede gestionar roles
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['exito' => false, 'error' => 'No autenticado']);
    exit;
}

// Obtener conexión
$bd = obtener_conexion();
if (!$bd) {
    echo json_encode(['exito' => false, 'error' => 'Error de conexión a la base de datos']);
    exit;
}

// Obtener acción
$accion = $_REQUEST['accion'] ?? '';

try {
    switch ($accion) {
        case 'listar':
            listarRoles($bd);
            break;
            
        case 'crear':
            crearRol($bd);
            break;
            
        case 'editar':
            editarRol($bd);
            break;
            
        case 'eliminar':
            eliminarRol($bd);
            break;
            
        case 'obtener':
            obtenerRol($bd);
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

// Listar todos los roles con conteo de usuarios
function listarRoles($bd) {
    try {
        $sql = "
            SELECT 
                r.rol_id,
                r.nombre,
                r.descripcion,
                COUNT(u.usuario_id) as total_usuarios
            FROM roles r
            LEFT JOIN usuarios u ON r.rol_id = u.rol_id
            GROUP BY r.rol_id, r.nombre, r.descripcion
            ORDER BY r.rol_id ASC
        ";
        
        $stmt = $bd->query($sql);
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'exito' => true,
            'datos' => $roles
        ]);
    } catch (Exception $e) {
        throw new Exception('Error al listar roles: ' . $e->getMessage());
    }
}

// Crear nuevo rol
function crearRol($bd) {
    $usuario_id = $_SESSION['usuario_id'] ?? null;
    
    // Validar datos
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    
    if (empty($nombre)) {
        throw new Exception('El nombre del rol es requerido');
    }
    
    // Verificar que el nombre no exista
    $stmt = $bd->prepare("SELECT rol_id FROM roles WHERE nombre = ?");
    $stmt->execute([$nombre]);
    
    if ($stmt->fetch()) {
        throw new Exception('Ya existe un rol con ese nombre');
    }
    
    // Insertar rol
    $sql = "INSERT INTO roles (nombre, descripcion) VALUES (?, ?)";
    $stmt = $bd->prepare($sql);
    $stmt->execute([$nombre, $descripcion]);
    
    $nuevo_id = $bd->lastInsertId();
    
    // Registrar en bitácora
    registrar_bitacora_pdo(
        $bd,
        $usuario_id,
        'crear',
        'roles',
        $nuevo_id,
        "Rol creado: {$nombre}"
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Rol creado exitosamente',
        'rol_id' => $nuevo_id
    ]);
}

// Editar rol existente
function editarRol($bd) {
    $usuario_id = $_SESSION['usuario_id'] ?? null;
    
    $rol_id = intval($_POST['rol_id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    
    if ($rol_id <= 0 || empty($nombre)) {
        throw new Exception('Datos incompletos');
    }
    
    // Verificar que el rol existe
    $stmt = $bd->prepare("SELECT nombre FROM roles WHERE rol_id = ?");
    $stmt->execute([$rol_id]);
    $rol_anterior = $stmt->fetch();
    
    if (!$rol_anterior) {
        throw new Exception('Rol no encontrado');
    }
    
    // Verificar que el nombre no esté en uso por otro rol
    $stmt = $bd->prepare("SELECT rol_id FROM roles WHERE nombre = ? AND rol_id != ?");
    $stmt->execute([$nombre, $rol_id]);
    
    if ($stmt->fetch()) {
        throw new Exception('Ya existe otro rol con ese nombre');
    }
    
    // Actualizar rol
    $sql = "UPDATE roles SET nombre = ?, descripcion = ? WHERE rol_id = ?";
    $stmt = $bd->prepare($sql);
    $stmt->execute([$nombre, $descripcion, $rol_id]);
    
    // Registrar en bitacora
    registrar_bitacora_pdo(
        $bd,
        $usuario_id,
        'editar',
        'roles',
        $rol_id,
        "Rol editado: {$rol_anterior['nombre']} -> {$nombre}"
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Rol actualizado exitosamente'
    ]);
}

// Eliminar rol
function eliminarRol($bd) {
    $usuario_id = $_SESSION['usuario_id'] ?? null;
    
    $rol_id = intval($_POST['rol_id'] ?? 0);
    
    if ($rol_id <= 0) {
        throw new Exception('ID de rol no válido');
    }
    
    // Verificar que el rol existe
    $stmt = $bd->prepare("SELECT nombre FROM roles WHERE rol_id = ?");
    $stmt->execute([$rol_id]);
    $rol = $stmt->fetch();
    
    if (!$rol) {
        throw new Exception('Rol no encontrado');
    }
    
    // Verificar que no tenga usuarios asociados
    $stmt = $bd->prepare("SELECT COUNT(*) as total FROM usuarios WHERE rol_id = ?");
    $stmt->execute([$rol_id]);
    $resultado = $stmt->fetch();
    
    if ($resultado['total'] > 0) {
        throw new Exception('No se puede eliminar el rol porque tiene ' . $resultado['total'] . ' usuario(s) asociado(s)');
    }
    
    // Eliminar rol
    $stmt = $bd->prepare("DELETE FROM roles WHERE rol_id = ?");
    $stmt->execute([$rol_id]);
    
    // Registrar en bitácora
    registrar_bitacora_pdo(
        $bd,
        $usuario_id,
        'eliminar',
        'roles',
        $rol_id,
        "Rol eliminado: {$rol['nombre']}"
    );
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Rol eliminado exitosamente'
    ]);
}

// Obtener un rol específico
function obtenerRol($bd) {
    $rol_id = intval($_GET['rol_id'] ?? 0);
    
    if ($rol_id <= 0) {
        throw new Exception('ID de rol no válido');
    }
    
    $stmt = $bd->prepare("
        SELECT 
            r.rol_id,
            r.nombre,
            r.descripcion,
            COUNT(u.usuario_id) as total_usuarios
        FROM roles r
        LEFT JOIN usuarios u ON r.rol_id = u.rol_id
        WHERE r.rol_id = ?
        GROUP BY r.rol_id, r.nombre, r.descripcion
    ");
    
    $stmt->execute([$rol_id]);
    $rol = $stmt->fetch();
    
    if (!$rol) {
        throw new Exception('Rol no encontrado');
    }
    
    echo json_encode([
        'exito' => true,
        'datos' => $rol
    ]);
}
?>
