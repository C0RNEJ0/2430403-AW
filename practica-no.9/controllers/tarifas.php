<?php
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();

// Obtenemos la accion
$accion = $_REQUEST['accion'] ?? '';

// Si la accion es listar traemos las tarifas
if ($accion === 'listar') {
    try {
        // Traemos todas las tarifas ordenadas por nombre
        $sql = "SELECT * FROM tarifas ORDER BY nombre_servicio ASC";
        $stmt = $bd->query($sql);
        $tarifas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Devolvemos los datos
        echo json_encode(['exito' => true, 'datos' => $tarifas]);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Si la accion es crear guardamos una nueva tarifa
else if ($accion === 'crear') {
    try {
        // Recogemos los datos
        $nombre = $_POST['nombre_servicio'];
        $costo = $_POST['costo'];
        
        // Insertamos en la base
        $sql = "INSERT INTO tarifas (nombre_servicio, costo) VALUES (?, ?)";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $costo]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa creada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Si la accion es editar actualizamos la tarifa
else if ($accion === 'editar') {
    try {
        $id = $_POST['tarifa_id'];
        $nombre = $_POST['nombre_servicio'];
        $costo = $_POST['costo'];
        
        // Actualizamos los datos
        $sql = "UPDATE tarifas SET nombre_servicio=?, costo=? WHERE tarifa_id=?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $costo, $id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa actualizada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Si la accion es eliminar borramos la tarifa
else if ($accion === 'eliminar') {
    try {
        $id = $_POST['tarifa_id'];
        // Borramos de la base
        $stmt = $bd->prepare("DELETE FROM tarifas WHERE tarifa_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Tarifa eliminada']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
?>
