<?php
// controlador para obtener logs de usuarios
require_once __DIR__ . '/../config/bd_huevos.php';
header('Content-Type: application/json; charset=utf-8');

// obtener conexion
$conexion = obtener_conexion();
if (!$conexion) {
    echo json_encode(['exito' => false, 'error' => 'No hay conexión a la base de datos']);
    exit;
}

try {
    // verificar si la tabla bitacora existe
    $check_table = "SHOW TABLES LIKE 'bitacora'";
    $stmt_check = $conexion->prepare($check_table);
    $stmt_check->execute();
    $table_exists = $stmt_check->fetch();
    
    if (!$table_exists) {
        // si no existe la tabla, devolver array vacio
        echo json_encode(['exito' => true, 'datos' => [], 'mensaje' => 'Tabla de bitácora no existe aún']);
        exit;
    }
    
    // consulta para obtener logs de bitacora
    $sql = "SELECT 
                b.bitacora_id,
                b.usuario_id,
                u.email as usuario_email,
                u.nombre as usuario_nombre,
                b.accion,
                b.tabla_afectada,
                b.registro_id,
                b.detalles,
                b.ip,
                b.user_agent,
                b.creado_en
            FROM bitacora b
            LEFT JOIN usuarios u ON b.usuario_id = u.usuario_id
            ORDER BY b.creado_en DESC
            LIMIT 200";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['exito' => true, 'datos' => $logs]);
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
