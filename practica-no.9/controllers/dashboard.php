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

// si es medico o secretaria obtenemos su medico_id para filtrar
// admin ve todos los datos
// secretaria ve solo del medico asociado
// medico ve solo sus propios datos
$medico_id = null;
$filtrar_por_medico = false;

if (($usuario_rol === 'medico' || $usuario_rol === 'secretaria') && $usuario_id) {
  $stmt_medico = $bd->prepare('SELECT medico_id FROM usuarios WHERE usuario_id = :uid LIMIT 1');
  $stmt_medico->bindValue(':uid', $usuario_id, PDO::PARAM_INT);
  $stmt_medico->execute();
  $medico_data = $stmt_medico->fetch();
  if ($medico_data && $medico_data['medico_id']) {
    $medico_id = $medico_data['medico_id'];
    $filtrar_por_medico = true;
  }
}

try {
    // aqui obtenemos los datos del dashboard
    
    // 1. Obtener transacciones recientes
    if ($filtrar_por_medico) {
      $sql_pagos = "SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo 
                    FROM vw_pagos_ui 
                    WHERE medico_id = :medico_id 
                    ORDER BY fecha DESC LIMIT 10";
      $stmt_pagos = $bd->prepare($sql_pagos);
      $stmt_pagos->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
      $stmt_pagos->execute();
    } else {
      $sql_pagos = "SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo 
                    FROM vw_pagos_ui ORDER BY fecha DESC LIMIT 10";
      $stmt_pagos = $bd->query($sql_pagos);
    }
    $transacciones = $stmt_pagos->fetchAll(PDO::FETCH_ASSOC);

    // 2. Total de ingresos
    if ($filtrar_por_medico) {
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

    // 3. Total de citas
    if ($filtrar_por_medico) {
      $sql_citas = "SELECT COUNT(*) as total FROM citas WHERE medico_id = :medico_id";
      $stmt_citas = $bd->prepare($sql_citas);
      $stmt_citas->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
      $stmt_citas->execute();
    } else {
      $sql_citas = "SELECT COUNT(*) as total FROM citas";
      $stmt_citas = $bd->query($sql_citas);
    }
    $total_citas = $stmt_citas->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 4. Total de pacientes
    if ($filtrar_por_medico) {
      $sql_pacientes = "SELECT COUNT(DISTINCT c.paciente_id) as total FROM citas c WHERE c.medico_id = :medico_id";
      $stmt_pacientes = $bd->prepare($sql_pacientes);
      $stmt_pacientes->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
      $stmt_pacientes->execute();
    } else {
      $sql_pacientes = "SELECT COUNT(*) as total FROM pacientes";
      $stmt_pacientes = $bd->query($sql_pacientes);
    }
    $total_pacientes = $stmt_pacientes->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 5. Ingresos por medico
    if ($filtrar_por_medico) {
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
    $por_medico = $stmt_medicos->fetchAll(PDO::FETCH_ASSOC);

    // aqui devolvemos todos los datos
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
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
