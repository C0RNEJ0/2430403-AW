<?php


require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/../config/auth.php';
header('Content-Type: application/json; charset=utf-8');

// Requerir autenticación
requerirAutenticacion();

// obtener la accion que se quiere realizar
$accion = $_GET['accion'] ?? $_POST['accion'] ?? 'listar';
$metodo_http = $_SERVER['REQUEST_METHOD'];

// obtener conexion a la base de datos
$conexion = obtener_conexion_mysqli();

if (!$conexion) {
    echo json_encode(['exito' => false, 'error' => 'Error de conexion a la base de datos']);
    exit;
}

// manejar las diferentes acciones
switch ($accion) {
    case 'listar':
        listar_pagos($conexion);
        break;
    
    case 'consultar_por_fecha':
        consultar_por_fecha($conexion);
        break;
    
    case 'corte_caja':
        generar_corte_caja($conexion);
        break;
    
    case 'eliminar':
        eliminar_pago($conexion);
        break;
    
    default:
        // si no hay accion especifica, manejar GET y POST normales
        if ($metodo_http === 'GET') {
            obtener_pago_por_id($conexion);
        } elseif ($metodo_http === 'POST') {
            guardar_pago($conexion);
        } else {
            echo json_encode(['exito' => false, 'error' => 'Metodo no permitido']);
        }
}

// funcion para listar todos los pagos
function listar_pagos($conexion) {
    try {
        $id_pago = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($id_pago > 0) {
            // obtener un pago especifico
            $consulta = 'SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo FROM vw_pagos_ui WHERE pago_id = ? LIMIT 1';
            $stmt = $conexion->prepare($consulta);
            $stmt->bind_param('i', $id_pago);
            $stmt->execute();
            $resultado = $stmt->get_result();
            $fila = $resultado->fetch_assoc();
            echo json_encode(['exito' => true, 'datos' => [$fila]]);
            exit;
        }
        
        // obtener todos los pagos
        $consulta = 'SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo FROM vw_pagos_ui ORDER BY fecha DESC';
        $resultado = $conexion->query($consulta);
        $lista_pagos = [];
        
        while ($fila = $resultado->fetch_assoc()) {
            $lista_pagos[] = $fila;
        }
        
        echo json_encode(['exito' => true, 'datos' => $lista_pagos]);
    } catch (Exception $error) {
        echo json_encode(['exito' => false, 'error' => $error->getMessage()]);
    }
}

// funcion para obtener un pago por su ID
function obtener_pago_por_id($conexion) {
    try {
        $id_pago = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($id_pago > 0) {
            $consulta = 'SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo FROM vw_pagos_ui WHERE pago_id = ? LIMIT 1';
            $stmt = $conexion->prepare($consulta);
            $stmt->bind_param('i', $id_pago);
            $stmt->execute();
            $resultado = $stmt->get_result();
            $fila = $resultado->fetch_assoc();
            echo json_encode(['exito' => true, 'datos' => [$fila]]);
        } else {
            // si no hay ID, listar todos
            listar_pagos($conexion);
        }
    } catch (Exception $error) {
        echo json_encode(['exito' => false, 'error' => $error->getMessage()]);
    }
}

// funcion para consultar pagos por rango de fechas
function consultar_por_fecha($conexion) {
    try {
        // obtener parametros de fecha
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $metodo_filtro = $_GET['metodo'] ?? '';
        
        // construir consulta base
        $consulta = "SELECT pago_id, fecha, paciente, medico, servicio, monto, metodo_pago as metodo 
                     FROM vw_pagos_ui 
                     WHERE fecha BETWEEN ? AND ?";
        
        // agregar filtro de metodo si existe
        if ($metodo_filtro) {
            $consulta .= " AND metodo_pago = ?";
        }
        
        $consulta .= " ORDER BY fecha DESC";
        
        // preparar y ejecutar consulta
        $stmt = $conexion->prepare($consulta);
        
        if ($metodo_filtro) {
            $stmt->bind_param('sss', $fecha_inicio, $fecha_fin, $metodo_filtro);
        } else {
            $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        }
        
        $stmt->execute();
        $resultado = $stmt->get_result();
        $lista_pagos = [];
        
        while ($fila = $resultado->fetch_assoc()) {
            $lista_pagos[] = $fila;
        }
        
        echo json_encode(['exito' => true, 'datos' => $lista_pagos]);
    } catch (Exception $error) {
        echo json_encode(['exito' => false, 'error' => $error->getMessage()]);
    }
}

// funcion para generar corte de caja
function generar_corte_caja($conexion) {
    try {
        // obtener parametros de fecha
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        
        // consulta para obtener desglose de pagos
        $consulta = "SELECT pago_id, fecha, paciente as paciente_paga, 
                     medico as medico_recibe, servicio, metodo_pago as metodo, monto
                     FROM vw_pagos_ui 
                     WHERE fecha BETWEEN ? AND ?
                     ORDER BY fecha DESC";
        
        $stmt = $conexion->prepare($consulta);
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        // calcular totales por metodo de pago
        $total_efectivo = 0;
        $total_tarjeta = 0;
        $total_transferencia = 0;
        $desglose_pagos = [];
        
        while ($fila = $resultado->fetch_assoc()) {
            $desglose_pagos[] = $fila;
            
            // sumar segun el metodo de pago
            $monto = floatval($fila['monto']);
            $metodo = $fila['metodo'];
            
            if ($metodo === 'efectivo') {
                $total_efectivo += $monto;
            } elseif ($metodo === 'tarjeta') {
                $total_tarjeta += $monto;
            } elseif ($metodo === 'transferencia') {
                $total_transferencia += $monto;
            }
        }
        
        // calcular total general
        $total_general = $total_efectivo + $total_tarjeta + $total_transferencia;
        
        // devolver datos del corte
        echo json_encode([
            'exito' => true,
            'datos' => [
                'total_efectivo' => $total_efectivo,
                'total_tarjeta' => $total_tarjeta,
                'total_transferencia' => $total_transferencia,
                'total_general' => $total_general,
                'desglose' => $desglose_pagos,
                'fecha_inicio' => $fecha_inicio,
                'fecha_fin' => $fecha_fin
            ]
        ]);
    } catch (Exception $error) {
        echo json_encode(['exito' => false, 'error' => $error->getMessage()]);
    }
}

// funcion para eliminar un pago
function eliminar_pago($conexion) {
    try {
        $id_pago = (int)($_POST['id'] ?? 0);
        
        if ($id_pago <= 0) {
            echo json_encode(['exito' => false, 'error' => 'ID de pago invalido']);
            return;
        }
        
        $consulta = 'DELETE FROM pagos WHERE pago_id = ? LIMIT 1';
        $stmt = $conexion->prepare($consulta);
        $stmt->bind_param('i', $id_pago);
        $stmt->execute();
        
        echo json_encode(['exito' => true]);
    } catch (Exception $error) {
        echo json_encode(['exito' => false, 'error' => $error->getMessage()]);
    }
}

// funcion para guardar pago (nuevo o editar)
function guardar_pago($conexion) {
    try {
        // obtener datos del formulario
        $id_pago = (int)($_POST['id'] ?? 0);
        $fecha = $_POST['fecha'] ?? null;
        $paciente_id = isset($_POST['paciente_id']) && $_POST['paciente_id'] !== '' ? (int)$_POST['paciente_id'] : null;
        $monto = floatval($_POST['monto'] ?? 0);
        $cita_id = isset($_POST['cita_id']) && $_POST['cita_id'] !== '' ? (int)$_POST['cita_id'] : null;
        $metodo_pago = trim($_POST['metodo_pago'] ?? 'efectivo');
        $referencia = trim($_POST['referencia'] ?? '');
        $estatus = trim($_POST['estatus'] ?? 'pagado');
        
        // si no se envia cita_id, intentar obtener la ultima cita del paciente
        if (empty($cita_id) && $paciente_id) {
            $consulta_cita = 'SELECT cita_id FROM citas WHERE paciente_id = ? ORDER BY fecha_hora_inicio DESC LIMIT 1';
            $stmt_cita = $conexion->prepare($consulta_cita);
            $stmt_cita->bind_param('i', $paciente_id);
            $stmt_cita->execute();
            $resultado_cita = $stmt_cita->get_result();
            $fila_cita = $resultado_cita->fetch_assoc();
            
            if ($fila_cita && isset($fila_cita['cita_id'])) {
                $cita_id = (int)$fila_cita['cita_id'];
            }
        }
        
        // validar datos requeridos
        if (empty($paciente_id) || $monto <= 0) {
            echo json_encode(['exito' => false, 'error' => 'paciente_id y monto son requeridos']);
            return;
        }
        
        // normalizar fecha a formato DATETIME
        $fecha_pago = null;
        if ($fecha) {
            // si viene solo YYYY-MM-DD, agregar hora 00:00:00
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                $fecha_pago = $fecha . ' 00:00:00';
            } else {
                $fecha_pago = $fecha;
            }
        } else {
            $fecha_pago = date('Y-m-d H:i:s');
        }
        
        // validar metodo de pago
        $metodos_validos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!in_array($metodo_pago, $metodos_validos)) {
            $metodo_pago = 'efectivo';
        }
        
        if ($id_pago > 0) {
            // actualizar pago existente
            $consulta = 'UPDATE pagos SET paciente_id = ?, cita_id = ?, monto = ?, moneda = ?, metodo = ?, estatus = ?, referencia = ?, fecha_pago = ? WHERE pago_id = ?';
            $moneda = 'MXN';
            $stmt = $conexion->prepare($consulta);
            $stmt->bind_param('iidsssssi', $paciente_id, $cita_id, $monto, $moneda, $metodo_pago, $estatus, $referencia, $fecha_pago, $id_pago);
            $stmt->execute();
            echo json_encode(['exito' => true]);
        } else {
            // crear nuevo pago
            $consulta = 'INSERT INTO pagos (paciente_id, cita_id, monto, moneda, metodo, estatus, referencia, fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            $moneda = 'MXN';
            $stmt = $conexion->prepare($consulta);
            $stmt->bind_param('iidsssss', $paciente_id, $cita_id, $monto, $moneda, $metodo_pago, $estatus, $referencia, $fecha_pago);
            $stmt->execute();
            echo json_encode(['exito' => true, 'id' => $conexion->insert_id]);
        }
    } catch (Exception $error) {
        echo json_encode(['exito' => false, 'error' => $error->getMessage()]);
    }
}
?>
