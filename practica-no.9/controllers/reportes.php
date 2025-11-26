<?php
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();

// verificamos si la sesion ya esta iniciada antes de llamar session_start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$usuario_rol = $_SESSION['usuario_rol'] ?? null;
$usuario_id = $_SESSION['usuario_id'] ?? null;

// si es medico obtenemos su medico_id
$medico_id = null;
if ($usuario_rol === 'medico' && $usuario_id) {
  $stmt_medico = $bd->prepare('SELECT medico_id FROM usuarios WHERE usuario_id = :uid LIMIT 1');
  $stmt_medico->bindValue(':uid', $usuario_id, PDO::PARAM_INT);
  $stmt_medico->execute();
  $medico_data = $stmt_medico->fetch();
  if ($medico_data) {
    $medico_id = $medico_data['medico_id'];
  }
}

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
        if ($usuario_rol === 'medico' && $medico_id) {
          $sql_pagos = "SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo 
                        FROM vw_pagos_ui 
                        WHERE medico_id = :medico_id 
                        ORDER BY fecha DESC LIMIT 100";
          $stmt_pagos = $bd->prepare($sql_pagos);
          $stmt_pagos->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
          $stmt_pagos->execute();
        } else {
          $sql_pagos = "SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo 
                        FROM vw_pagos_ui ORDER BY fecha DESC LIMIT 100";
          $stmt_pagos = $bd->query($sql_pagos);
        }
        $transacciones = $stmt_pagos->fetchAll(PDO::FETCH_ASSOC);

        // 2. Calcular KPIs
        // Total ingresos
        if ($usuario_rol === 'medico' && $medico_id) {
          $sql_ingresos = "SELECT SUM(p.monto) as total FROM pagos p 
                          JOIN citas c ON p.cita_id = c.cita_id 
                          WHERE p.estatus = 'pagado' AND c.medico_id = :medico_id";
          $stmt_ingresos = $bd->prepare($sql_ingresos);
          $stmt_ingresos->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
          $stmt_ingresos->execute();
        } else {
          $sql_ingresos = "SELECT SUM(monto) as total FROM pagos WHERE estatus = 'pagado'";
          $stmt_ingresos = $bd->query($sql_ingresos);
        }
        $total_ingresos = $stmt_ingresos->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Citas totales (en rango o total historico)
        if ($usuario_rol === 'medico' && $medico_id) {
          $sql_citas = "SELECT COUNT(*) as total FROM citas WHERE medico_id = :medico_id";
          $stmt_citas = $bd->prepare($sql_citas);
          $stmt_citas->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
          $stmt_citas->execute();
        } else {
          $sql_citas = "SELECT COUNT(*) as total FROM citas";
          $stmt_citas = $bd->query($sql_citas);
        }
        $total_citas = $stmt_citas->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Pacientes nuevos (total)
        if ($usuario_rol === 'medico' && $medico_id) {
          $sql_pacientes = "SELECT COUNT(DISTINCT c.paciente_id) as total FROM citas c WHERE c.medico_id = :medico_id";
          $stmt_pacientes = $bd->prepare($sql_pacientes);
          $stmt_pacientes->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
          $stmt_pacientes->execute();
        } else {
          $sql_pacientes = "SELECT COUNT(*) as total FROM pacientes";
          $stmt_pacientes = $bd->query($sql_pacientes);
        }
        $total_pacientes = $stmt_pacientes->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Ingresos por medico
        if ($usuario_rol === 'medico' && $medico_id) {
          $sql_medicos = "SELECT m.nombre as medico, SUM(p.monto) as total_medico
                          FROM pagos p
                          JOIN citas c ON p.cita_id = c.cita_id
                          JOIN medicos m ON c.medico_id = m.medico_id
                          WHERE p.estatus = 'pagado' AND c.medico_id = :medico_id
                          GROUP BY m.medico_id";
          $stmt_medicos = $bd->prepare($sql_medicos);
          $stmt_medicos->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
          $stmt_medicos->execute();
        } else {
          $sql_medicos = "SELECT m.nombre as medico, SUM(p.monto) as total_medico
                          FROM pagos p
                          JOIN citas c ON p.cita_id = c.cita_id
                          JOIN medicos m ON c.medico_id = m.medico_id
                          WHERE p.estatus = 'pagado'
                          GROUP BY m.medico_id";
          $stmt_medicos = $bd->query($sql_medicos);
        }
        // Nota: Si hay pagos sin cita, no saldran aqui, pero es correcto para ingresos por medico
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
        if ($usuario_rol === 'medico' && $medico_id) {
          $sql = "SELECT * FROM vw_pagos_ui WHERE medico_id = :medico_id ORDER BY fecha DESC";
          $stmt = $bd->prepare($sql);
          $stmt->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
          $stmt->execute();
        } else {
          $sql = "SELECT * FROM vw_pagos_ui ORDER BY fecha DESC";
          $stmt = $bd->query($sql);
        }
        $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['exito' => true, 'datos' => $datos]);
    }
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
