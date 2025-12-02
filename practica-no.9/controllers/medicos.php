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
        
        // Procesar horario desde hora_inicio y hora_fin
        $hora_inicio = $_POST['hora_inicio'] ?? '';
        $hora_fin = $_POST['hora_fin'] ?? '';
        $horario = '';
        
        if ($hora_inicio && $hora_fin) {
            // Validar rango de horario (7:00 AM - 5:00 PM)
            if ($hora_inicio < '07:00' || $hora_inicio > '17:00') {
                echo json_encode(['exito' => false, 'error' => 'La hora de inicio debe estar entre 7:00 AM y 5:00 PM']);
                exit;
            }
            
            if ($hora_fin < '07:00' || $hora_fin > '17:00') {
                echo json_encode(['exito' => false, 'error' => 'La hora de fin debe estar entre 7:00 AM y 5:00 PM']);
                exit;
            }
            
            // Validar que hora fin sea mayor que hora inicio
            if ($hora_fin <= $hora_inicio) {
                echo json_encode(['exito' => false, 'error' => 'La hora de fin debe ser posterior a la hora de inicio']);
                exit;
            }
            
            $horario = $hora_inicio . '-' . $hora_fin;
        }
        
        $cedula_profesional = $_POST['cedula_profesional'] ?? '';
        
        // Insertar nuevo médico con estado activo
        $sql = "INSERT INTO medicos (nombre, email, telefono, cedula_profesional, especialidad_id, horario, activo) VALUES (?, ?, ?, ?, ?, ?, 1)";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $email, $telefono, $cedula_profesional, $especialidad, $horario]);
        
        echo json_encode(['exito' => true, 'mensaje' => 'Medico creado']);
    } catch (Exception $e) {
        echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
    }
}
// Actualizar datos de médico existente
else if ($accion === 'editar') {
    try {
        $id = $_POST['id'];
        $nombre = $_POST['nombre'];
        $email = $_POST['email'];
        $telefono = $_POST['telefono'] ?? '';
        $especialidad = $_POST['especialidad'] ?? $_POST['especialidad_id'] ?? null;
        
        // Procesar horario desde hora_inicio y hora_fin
        $hora_inicio = $_POST['hora_inicio'] ?? '';
        $hora_fin = $_POST['hora_fin'] ?? '';
        $horario = '';
        
        if ($hora_inicio && $hora_fin) {
            // Validar rango de horario (7:00 AM - 5:00 PM)
            if ($hora_inicio < '07:00' || $hora_inicio > '17:00') {
                echo json_encode(['exito' => false, 'error' => 'La hora de inicio debe estar entre 7:00 AM y 5:00 PM']);
                exit;
            }
            
            if ($hora_fin < '07:00' || $hora_fin > '17:00') {
                echo json_encode(['exito' => false, 'error' => 'La hora de fin debe estar entre 7:00 AM y 5:00 PM']);
                exit;
            }
            
            // Validar que hora fin sea mayor que hora inicio
            if ($hora_fin <= $hora_inicio) {
                echo json_encode(['exito' => false, 'error' => 'La hora de fin debe ser posterior a la hora de inicio']);
                exit;
            }
            
            $horario = $hora_inicio . '-' . $hora_fin;
        }
        
        $cedula_profesional = $_POST['cedula_profesional'] ?? '';
        
        // Ejecutar UPDATE en base de datos
        $sql = "UPDATE medicos SET nombre=?, email=?, telefono=?, cedula_profesional=?, especialidad_id=?, horario=? WHERE medico_id=?";
        $stmt = $bd->prepare($sql);
        $stmt->execute([$nombre, $email, $telefono, $cedula_profesional, $especialidad, $horario, $id]);
        
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
