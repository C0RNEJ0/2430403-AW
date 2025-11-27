<?php
// Incluir módulo de conexión a base de datos
require_once __DIR__ . '/../config/bd_huevos.php';

// Establecer cabeceras de respuesta JSON
header('Content-Type: application/json; charset=utf-8');

// Inicializar conexión PDO a la base de datos
$bd = obtener_conexion();

// Iniciar sesión si no ha sido iniciada previamente
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$usuario_rol = $_SESSION['rol'] ?? null;
$medico_id = $_SESSION['medico_id'] ?? null;

// Obtener ID de médico para filtrado basado en rol
// Roles: admin (sin filtro), secretaria (médico asociado), médico (datos propios)
$filtrar_por_medico = false;

if (($usuario_rol === 'medico' || $usuario_rol === 'secretaria') && $medico_id) {
  $filtrar_por_medico = true;
}

try {
    // Obtener métricas y datos del dashboard
    
    // 1. Transacciones de pago recientes
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

    // Construir respuesta JSON con todas las métricas
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
