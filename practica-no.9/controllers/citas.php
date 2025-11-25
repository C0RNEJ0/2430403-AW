<?php
// controlador de citas 
require_once __DIR__ . '/../config/bd_huevos.php';
header('Content-Type: application/json; charset=utf-8');

$bd = obtener_conexion();
if (!$bd) {
    echo json_encode(['exito' => false, 'error' => 'Sin conexión a BD']);
    exit;
}

$accion = $_POST['accion'] ?? $_GET['accion'] ?? 'listar';

try {
    switch ($accion) {
        case 'listar':
            // listar todas las citas con info de paciente y medico
            $sql = "SELECT 
                        c.cita_id,
                        c.paciente_id,
                        c.medico_id,
                        c.motivo,
                        c.notas,
                        c.fecha_hora_inicio,
                        c.fecha_hora_fin,
                        c.estado,
                        CONCAT(p.nombres, ' ', p.apellidos) as paciente_nombre,
                        m.nombre as medico_nombre
                    FROM citas c
                    LEFT JOIN pacientes p ON c.paciente_id = p.paciente_id
                    LEFT JOIN medicos m ON c.medico_id = m.medico_id
                    ORDER BY c.fecha_hora_inicio DESC";
            
            $stmt = $bd->prepare($sql);
            $stmt->execute();
            $citas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['exito' => true, 'datos' => $citas]);
            break;

        case 'crear':
            // crear nueva cita
            $paciente_id = $_POST['paciente_id'] ?? null;
            $medico_id = $_POST['medico_id'] ?? null;
            $fecha = $_POST['fecha'] ?? null;
            $hora = $_POST['hora'] ?? null;
            $motivo = $_POST['motivo'] ?? '';
            $notas = $_POST['notas'] ?? '';
            $estado = $_POST['estado'] ?? 'programada';
            
            if (!$paciente_id || !$medico_id || !$fecha || !$hora) {
                echo json_encode(['exito' => false, 'error' => 'Faltan campos requeridos']);
                exit;
            }
            
            $fecha_hora_inicio = $fecha . ' ' . $hora;
            $fecha_hora_fin = date('Y-m-d H:i:s', strtotime($fecha_hora_inicio . ' +30 minutes'));
            
            $sql = "INSERT INTO citas (paciente_id, medico_id, motivo, notas, fecha_hora_inicio, fecha_hora_fin, estado)
                    VALUES (:paciente_id, :medico_id, :motivo, :notas, :fecha_hora_inicio, :fecha_hora_fin, :estado)";
            
            $stmt = $bd->prepare($sql);
            $stmt->execute([
                ':paciente_id' => $paciente_id,
                ':medico_id' => $medico_id,
                ':motivo' => $motivo,
                ':notas' => $notas,
                ':fecha_hora_inicio' => $fecha_hora_inicio,
                ':fecha_hora_fin' => $fecha_hora_fin,
                ':estado' => $estado
            ]);
            
            echo json_encode(['exito' => true, 'mensaje' => 'Cita creada exitosamente', 'id' => $bd->lastInsertId()]);
            break;

        case 'editar':
            // editar cita existente
            $cita_id = $_POST['cita_id'] ?? null;
            $paciente_id = $_POST['paciente_id'] ?? null;
            $medico_id = $_POST['medico_id'] ?? null;
            $fecha = $_POST['fecha'] ?? null;
            $hora = $_POST['hora'] ?? null;
            $motivo = $_POST['motivo'] ?? '';
            $notas = $_POST['notas'] ?? '';
            $estado = $_POST['estado'] ?? 'programada';
            
            if (!$cita_id || !$paciente_id || !$medico_id || !$fecha || !$hora) {
                echo json_encode(['exito' => false, 'error' => 'Faltan campos requeridos']);
                exit;
            }
            
            $fecha_hora_inicio = $fecha . ' ' . $hora;
            $fecha_hora_fin = date('Y-m-d H:i:s', strtotime($fecha_hora_inicio . ' +30 minutes'));
            
            $sql = "UPDATE citas SET 
                    paciente_id = :paciente_id,
                    medico_id = :medico_id,
                    motivo = :motivo,
                    notas = :notas,
                    fecha_hora_inicio = :fecha_hora_inicio,
                    fecha_hora_fin = :fecha_hora_fin,
                    estado = :estado
                    WHERE cita_id = :cita_id";
            
            $stmt = $bd->prepare($sql);
            $stmt->execute([
                ':cita_id' => $cita_id,
                ':paciente_id' => $paciente_id,
                ':medico_id' => $medico_id,
                ':motivo' => $motivo,
                ':notas' => $notas,
                ':fecha_hora_inicio' => $fecha_hora_inicio,
                ':fecha_hora_fin' => $fecha_hora_fin,
                ':estado' => $estado
            ]);
            
            echo json_encode(['exito' => true, 'mensaje' => 'Cita actualizada exitosamente']);
            break;

        case 'eliminar':
            // eliminar cita
            $cita_id = $_POST['cita_id'] ?? null;
            
            if (!$cita_id) {
                echo json_encode(['exito' => false, 'error' => 'ID de cita requerido']);
                exit;
            }
            
            $sql = "DELETE FROM citas WHERE cita_id = :cita_id";
            $stmt = $bd->prepare($sql);
            $stmt->execute([':cita_id' => $cita_id]);
            
            echo json_encode(['exito' => true, 'mensaje' => 'Cita eliminada exitosamente']);
            break;

        case 'obtener':
            // obtener una cita especifica
            $cita_id = $_GET['cita_id'] ?? null;
            
            if (!$cita_id) {
                echo json_encode(['exito' => false, 'error' => 'ID de cita requerido']);
                exit;
            }
            
            $sql = "SELECT * FROM citas WHERE cita_id = :cita_id";
            $stmt = $bd->prepare($sql);
            $stmt->execute([':cita_id' => $cita_id]);
            $cita = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($cita) {
                echo json_encode(['exito' => true, 'datos' => $cita]);
            } else {
                echo json_encode(['exito' => false, 'error' => 'Cita no encontrada']);
            }
            break;

        default:
            echo json_encode(['exito' => false, 'error' => 'Acción no válida']);
            break;
    }
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
