<?php
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();

// Obtenemos la accion
$accion = $_REQUEST['accion'] ?? '';

// aqui si no hay accion o es listar traemos las tarifas
if ($accion === 'listar' || $accion === '') {
    try {
        // Traemos todas las tarifas ordenadas por nombre
        $sql = "SELECT tarifa_id, nombre_servicio as especialidad, servicio, precio FROM tarifas ORDER BY nombre_servicio ASC";
        $stmt = $bd->query($sql);
        $tarifas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Devolvemos los datos
        echo json_encode(['exito' => true, 'datos' => $tarifas]);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
// Si la accion es crear guardamos una nueva tarifa
else if ($accion === 'crear' || (!isset($_POST['id']) && !empty($_POST['especialidad']))) {
    try {
        // aqui recogemos los datos que envia el JavaScript
        $especialidad = $_POST['especialidad'] ?? '';
        $servicio = $_POST['servicio'] ?? '';
        $precio = $_POST['precio'] ?? 0;
        
        // Insertamos en la base
        $sql = "INSERT INTO tarifas (nombre_servicio, servicio, precio) VALUES (?, ?, ?)";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$especialidad, $servicio, $precio]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa creada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
// Si la accion es editar actualizamos la tarifa
else if ($accion === 'editar' || isset($_POST['id'])) {
    try {
        $id = $_POST['id'] ?? 0;
        $especialidad = $_POST['especialidad'] ?? '';
        $servicio = $_POST['servicio'] ?? '';
        $precio = $_POST['precio'] ?? 0;
        
        // Actualizamos los datos
        $sql = "UPDATE tarifas SET nombre_servicio=?, servicio=?, precio=? WHERE tarifa_id=?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$especialidad, $servicio, $precio, $id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa actualizada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
// Si la accion es eliminar borramos la tarifa
else if ($accion === 'eliminar') {
    try {
        $id = $_POST['id'] ?? 0;
        // Borramos de la base
        $stmt = $bd->prepare("DELETE FROM tarifas WHERE tarifa_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa eliminada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
?>
