<?php
// Incluir módulo de conexión a base de datos
require_once __DIR__ . '/../config/bd_huevos.php';

// Establecer cabeceras de respuesta JSON
header('Content-Type: application/json; charset=utf-8');

// Inicializar conexión PDO a la base de datos
$bd = obtener_conexion();

// Validar autenticación y permisos de super admin
require_once __DIR__ . '/../config/auth.php';
requerirRol('super_admin');

// Obtener acción desde parámetros de solicitud
$accion = $_REQUEST['accion'] ?? '';

// Listar médicos activos con sus especialidades
if ($accion === 'listar_json') {
    try {
        // Consulta con JOIN para obtener nombre de especialidad
        $sql = "SELECT m.*, e.nombre as especialidad_nombre 
                FROM medicos m 
                LEFT JOIN especialidades e ON m.especialidad_id = e.especialidad_id 
                WHERE m.activo = 1 
                ORDER BY m.nombre ASC";
        $stmt = $bd->query($sql);
        $medicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Devolver datos en formato JSON
        echo json_encode(['exito' => true, 'datos' => $medicos]);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Crear registro de nuevo médico
else if ($accion === 'crear') {
    try {
        // Extraer campos del formulario POST
        $nombre = $_POST['nombre'];
        $email = $_POST['email'];
        $telefono = $_POST['telefono'] ?? '';
        // Compatibilidad con múltiples nombres de campo para especialidad
        $especialidad = $_POST['especialidad'] ?? $_POST['especialidad_id'] ?? null;
        $horario = $_POST['horario'] ?? '';
        
        // Insertar nuevo médico con estado activo
        $sql = "INSERT INTO medicos (nombre, email, telefono, especialidad_id, horario, activo) VALUES (?, ?, ?, ?, ?, 1)";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $email, $telefono, $especialidad, $horario]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico creado']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Actualizar datos de médico existente
else if ($accion === 'editar') {
    try {
        $id = $_POST['medico_id'];
        $nombre = $_POST['nombre'];
        $email = $_POST['email'];
        $telefono = $_POST['telefono'] ?? '';
        $especialidad = $_POST['especialidad'] ?? $_POST['especialidad_id'] ?? null;
        $horario = $_POST['horario'] ?? '';
        
        // Ejecutar UPDATE en base de datos
        $sql = "UPDATE medicos SET nombre=?, email=?, telefono=?, especialidad_id=?, horario=? WHERE medico_id=?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $email, $telefono, $especialidad, $horario, $id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico actualizado']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Eliminar médico de la base de datos
else if ($accion === 'eliminar') {
    try {
        $id = $_POST['id'];
        // Eliminación física del registro 
        $stmt = $bd->prepare("DELETE FROM medicos WHERE medico_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico eliminado permanentemente']);
    } catch (PDOException $e) {
        // Manejo de error por restricción de llave foránea (citas asociadas)
        if ($e->getCode() == '23000') {
            echo json_encode(['exito' => false, 'error' => 'No se puede eliminar el médico porque tiene citas o registros asociados.']);
        } else {
            echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
        }
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
?>
