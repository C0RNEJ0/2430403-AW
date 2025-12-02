<?php
// Incluir módulo de conexión a base de datos
require_once __DIR__ . '/../config/bd_huevos.php';

// Establecer cabeceras de respuesta JSON
header('Content-Type: application/json; charset=utf-8');

// Inicializar conexión PDO a la base de datos
$bd = obtener_conexion();

// Obtener acción desde parámetros de solicitud
$accion = $_REQUEST['accion'] ?? '';

// Listar todas las tarifas si no se especifica acción (PÚBLICO - para PDF)
if ($accion === 'listar' || $accion === '') {
    try {
        // Obtener tarifas ordenadas alfabéticamente
        $sql = "SELECT tarifa_id, nombre_servicio as especialidad, servicio, precio FROM tarifas ORDER BY nombre_servicio ASC";
        $stmt = $bd->query($sql);
        $tarifas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Enviar respuesta JSON con datos de tarifas
        echo json_encode(['exito' => true, 'datos' => $tarifas]);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Para todas las demás acciones, validar autenticación y permisos de super admin
require_once __DIR__ . '/../config/auth.php';
requerirRol('super_admin');

// Obtener una tarifa específica por id (cuando viene id por GET sin acción)
if (isset($_GET['id'])) {
    try {
        $id = $_GET['id'];
        $sql = "SELECT tarifa_id, nombre_servicio as especialidad, servicio, precio FROM tarifas WHERE tarifa_id = ?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$id]);
        $tarifa = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['exito' => true, 'datos' => $tarifa]);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Crear una nueva tarifa
if ($accion === 'crear' || (!isset($_POST['id']) && !empty($_POST['especialidad']))) {
    try {
        // Extraer datos del formulario POST
        $especialidad = $_POST['especialidad'] ?? '';
        $servicio = $_POST['servicio'] ?? '';
        $precio = $_POST['precio'] ?? 0;
        
        // Insertar nueva tarifa en la base de datos
        $sql = "INSERT INTO tarifas (nombre_servicio, servicio, precio) VALUES (?, ?, ?)";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$especialidad, $servicio, $precio]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa creada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
// Actualizar tarifa existente
else if ($accion === 'editar' && isset($_POST['id'])) {
    try {
        $id = $_POST['id'] ?? 0;
        $especialidad = $_POST['especialidad'] ?? '';
        $servicio = $_POST['servicio'] ?? '';
        $precio = $_POST['precio'] ?? 0;
        
        // Ejecutar UPDATE en base de datos
        $sql = "UPDATE tarifas SET nombre_servicio=?, servicio=?, precio=? WHERE tarifa_id=?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$especialidad, $servicio, $precio, $id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa actualizada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
// Eliminar tarifa permanentemente
else if ($accion === 'eliminar') {
    try {
        $id = $_POST['id'] ?? 0;
        // Eliminar registro de la base de datos
        $stmt = $bd->prepare("DELETE FROM tarifas WHERE tarifa_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa eliminada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
?>
