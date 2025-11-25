<?php
require_once __DIR__ . '/bd_huevos.php';

/**
 * Registra una acción en la bitácora del sistema
 * 
 * @param string $accion Tipo de acción (login, logout, crear, editar, eliminar, consultar)
 * @param string $tabla Tabla afectada (opcional)
 * @param int $registro_id ID del registro afectado (opcional)
 * @param string $detalles Detalles adicionales (opcional)
 * @return bool True si se registró correctamente, False si hubo error
 */
function registrar_log($accion, $tabla = null, $registro_id = null, $detalles = null) {
    try {
        $bd = obtener_conexion();
        if (!$bd) return false;

        // Obtener ID de usuario de la sesión si existe
        $usuario_id = $_SESSION['usuario_id'] ?? null;
        
        // Obtener User Agent
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

        $sql = "INSERT INTO bitacora (usuario_id, accion, tabla_afectada, registro_id, detalles, user_agent) 
                VALUES (:usuario_id, :accion, :tabla, :registro_id, :detalles, :user_agent)";
        
        $stmt = $bd->prepare($sql);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':accion' => $accion,
            ':tabla' => $tabla,
            ':registro_id' => $registro_id,
            ':detalles' => $detalles,
            ':user_agent' => $user_agent
        ]);

        return true;
    } catch (Exception $e) {
        // esto hace que no interrumpa el flujo principal
        error_log("Error al registrar log: " . $e->getMessage());
        return false;
    }
}
?>
