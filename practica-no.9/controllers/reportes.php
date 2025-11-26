<?php
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();

// Obtenemos el tipo de reporte
$tipo = $_GET['tipo'] ?? '';
$metodo_http = $_SERVER['REQUEST_METHOD'];

try {
    // Si es una peticion POST, es para guardar un pago
    if ($metodo_http === 'POST') {
        // obtener datos del formulario
        $id_pago = (int)($_POST['id'] ?? 0);
        $fecha = $_POST['fecha'] ?? null;
        $paciente_id = isset($_POST['paciente_id']) && $_POST['paciente_id'] !== '' ? (int)$_POST['paciente_id'] : null;
        $monto = floatval($_POST['monto'] ?? 0);
        $cita_id = isset($_POST['cita_id']) && $_POST['cita_id'] !== '' ? (int)$_POST['cita_id'] : null;
        $metodo_pago = trim($_POST['metodo_pago'] ?? 'efectivo');
        $referencia = trim($_POST['referencia'] ?? '');
        $estatus = trim($_POST['estatus'] ?? 'pagado');
        $servicio = trim($_POST['servicio'] ?? '');
        
        // validar datos requeridos
        if (empty($paciente_id) || $monto <= 0) {
            echo json_encode(['exito' => false, 'error' => 'paciente_id y monto son requeridos']);
            exit;
        }
        
        // normalizar fecha
        $fecha_pago = $fecha ? ($fecha . ' 00:00:00') : date('Y-m-d H:i:s');
        
        // insertar pago
        // Nota: Agregamos 'concepto' para guardar el servicio si no hay cita
        $sql = "INSERT INTO pagos (paciente_id, cita_id, monto, moneda, metodo, estatus, referencia, fecha_pago, concepto) 
                VALUES (?, ?, ?, 'MXN', ?, ?, ?, ?, ?)";
        
        // Usamos PDO
        $stmt = $bd->prepare($sql);
        $stmt->execute([$paciente_id, $cita_id, $monto, $metodo_pago, $estatus, $referencia, $fecha_pago, $servicio]);
        
        echo json_encode(['exito' => true, 'id' => $bd->lastInsertId()]);
        exit;
    }

    // Si piden reporte de pagos
    // Si piden reporte general (dashboard)
    if ($tipo === 'dashboard' || $tipo === '') {
        // 1. Obtener transacciones (pagos) usando la vista corregida
        $sql_pagos = "SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo 
                      FROM vw_pagos_ui ORDER BY fecha DESC LIMIT 100";
        $stmt_pagos = $bd->query($sql_pagos);
        $transacciones = $stmt_pagos->fetchAll(PDO::FETCH_ASSOC);

        // 2. Calcular KPIs
        // Total ingresos
        $sql_ingresos = "SELECT SUM(monto) as total FROM pagos WHERE estatus = 'pagado'";
        $stmt_ingresos = $bd->query($sql_ingresos);
        $total_ingresos = $stmt_ingresos->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Citas totales (en rango o total historico)
        $sql_citas = "SELECT COUNT(*) as total FROM citas";
        $stmt_citas = $bd->query($sql_citas);
        $total_citas = $stmt_citas->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Pacientes nuevos (total)
        $sql_pacientes = "SELECT COUNT(*) as total FROM pacientes";
        $stmt_pacientes = $bd->query($sql_pacientes);
        $total_pacientes = $stmt_pacientes->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Ingresos por medico
        $sql_medicos = "SELECT m.nombre as medico, SUM(p.monto) as total_medico
                        FROM pagos p
                        JOIN citas c ON p.cita_id = c.cita_id
                        JOIN medicos m ON c.medico_id = m.medico_id
                        WHERE p.estatus = 'pagado'
                        GROUP BY m.medico_id";
        // Nota: Si hay pagos sin cita, no saldran aqui, pero es correcto para "ingresos por medico"
        $stmt_medicos = $bd->query($sql_medicos);
        $por_medico = $stmt_medicos->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'exito' => true, 
            'datos' => [
                'transacciones' => $transacciones,
                'total' => $total_ingresos,
                'citas' => $total_citas,
                'pacientes_nuevos' => $total_pacientes,
                'por_medico' => $por_medico
            ]
        ]);
    }
    // Si piden reporte de pagos especifico
    else if ($tipo === 'pagos') {
        // Traemos pagos con nombres de pacientes usando la vista
        $sql = "SELECT * FROM vw_pagos_ui ORDER BY fecha DESC";
        $stmt = $bd->query($sql);
        $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['exito' => true, 'datos' => $datos]);
    }
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
