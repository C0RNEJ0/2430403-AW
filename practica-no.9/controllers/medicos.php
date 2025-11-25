<?php
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();

// Requerir autenticación y rol de super admin
require_once __DIR__ . '/../config/auth.php';
requerirRol('super_admin');

// Obtenemos la accion
$accion = $_REQUEST['accion'] ?? '';

// Si la accion es listar json traemos los medicos
if ($accion === 'listar_json') {
    try {
        // Preparamos la consulta con especialidades
        $sql = "SELECT m.*, e.nombre as especialidad_nombre 
                FROM medicos m 
                LEFT JOIN especialidades e ON m.especialidad_id = e.especialidad_id 
                WHERE m.activo = 1 
                ORDER BY m.nombre ASC";
        $stmt = $bd->query($sql);
        $medicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Devolvemos los datos
        echo json_encode(['exito' => true, 'datos' => $medicos]);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Si la accion es crear guardamos un nuevo medico
else if ($accion === 'crear') {
    try {
        // Recogemos los datos
        $nombre = $_POST['nombre'];
        $email = $_POST['email'];
        $telefono = $_POST['telefono'] ?? '';
        // El formulario envía 'especialidad', pero también  'especialidad_id' ya asi pude arreglar el pinche error
        $especialidad = $_POST['especialidad'] ?? $_POST['especialidad_id'] ?? null;
        $horario = $_POST['horario'] ?? '';
        
        // Insertamos en la base
        $sql = "INSERT INTO medicos (nombre, email, telefono, especialidad_id, horario, activo) VALUES (?, ?, ?, ?, ?, 1)";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $email, $telefono, $especialidad, $horario]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico creado']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Si la accion es editar actualizamos el medico
else if ($accion === 'editar') {
    try {
        $id = $_POST['medico_id'];
        $nombre = $_POST['nombre'];
        $email = $_POST['email'];
        $telefono = $_POST['telefono'] ?? '';
        $especialidad = $_POST['especialidad'] ?? $_POST['especialidad_id'] ?? null;
        $horario = $_POST['horario'] ?? '';
        
        // Actualizamos los datos
        $sql = "UPDATE medicos SET nombre=?, email=?, telefono=?, especialidad_id=?, horario=? WHERE medico_id=?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $email, $telefono, $especialidad, $horario, $id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico actualizado']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Si la accion es eliminar borramos el medico
else if ($accion === 'eliminar') {
    try {
        $id = $_POST['id'];
        // Intentamos eliminar físicamente 
        $stmt = $bd->prepare("DELETE FROM medicos WHERE medico_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico eliminado permanentemente']);
    } catch (PDOException $e) {
        // Verificar si es error de constraint (citas asociadas)
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
