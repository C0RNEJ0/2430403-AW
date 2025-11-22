<?php
// Controlador de Citas - CRUD completo
require_once __DIR__ . '/../config/bd_huevos.php';
header('Content-Type: application/json; charset=utf-8');

$bd = obtener_conexion();
if (!$bd) {
    echo json_encode(['exito' => false, 'error' => 'Sin conexión a BD']);
    exit;
}

$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

try {
    switch ($accion) {
        case 'listar':
            // Listar todas las citas con información de paciente y médico
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
            // Eliminar cita
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
            // Obtener una cita específica
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
