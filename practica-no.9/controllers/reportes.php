<?php
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();

// Obtenemos el tipo de reporte
$tipo = $_GET['tipo'] ?? '';

try {
    // Si piden reporte de pagos
    if ($tipo === 'pagos') {
        // Traemos pagos con nombres de pacientes
        $sql = "SELECT p.pago_id, CONCAT(pac.nombres, ' ', pac.apellidos) as paciente, 
                       p.monto, p.metodo_pago, p.fecha_pago
                FROM pagos p
                JOIN pacientes pac ON p.paciente_id = pac.paciente_id
                ORDER BY p.fecha_pago DESC";
        $stmt = $bd->query($sql);
        $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['exito' => true, 'datos' => $datos]);
    }
    // Si piden reporte de citas
    else if ($tipo === 'citas') {
        // Traemos citas con nombres de medicos y pacientes
        $sql = "SELECT c.fecha_hora_inicio, CONCAT(p.nombres, ' ', p.apellidos) as paciente,
                       m.nombre as medico, c.estado
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.paciente_id
                JOIN medicos m ON c.medico_id = m.medico_id
                ORDER BY c.fecha_hora_inicio DESC";
        $stmt = $bd->query($sql);
        $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['exito' => true, 'datos' => $datos]);
    }
    // Si no especifican tipo valido
    else {
        echo json_encode(['exito' => false, 'error' => 'Tipo de reporte no valido']);
    }
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
