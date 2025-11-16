<?php
require_once __DIR__ . '/../config/bd_huevos.php';
header('Content-Type: application/json; charset=utf-8');

$resp = ['exito' => false];
try {
  $conn = obtenerConexion();
  $metodo = $_SERVER['REQUEST_METHOD'];
  if ($metodo === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id>0) {
      // usamos la vista vw_pagos_ui para devolver los campos amigables (fecha, paciente, medico, servicio, monto)
      $stmt = $conn->prepare('SELECT pago_id, fecha, paciente, medico, servicio, monto FROM vw_pagos_ui WHERE pago_id = ? LIMIT 1');
      $stmt->bind_param('i', $id);
      $stmt->execute();
      $res = $stmt->get_result();
      $fila = $res->fetch_assoc();
      echo json_encode(['exito'=>true,'datos'=>[$fila]]);
      exit;
    }
    $res = $conn->query('SELECT pago_id, fecha, paciente, medico, servicio, monto FROM vw_pagos_ui ORDER BY fecha DESC');
    $filas = [];
    while ($r = $res->fetch_assoc()) $filas[] = $r;
    echo json_encode(['exito'=>true,'datos'=>$filas]);
    exit;
  }
  if ($metodo === 'POST') {
    $accion = $_POST['accion'] ?? 'crear';
    if ($accion === 'eliminar') {
      $id = (int)($_POST['id'] ?? 0);
      $stmt = $conn->prepare('DELETE FROM pagos WHERE pago_id = ? LIMIT 1');
      $stmt->bind_param('i', $id);
      $stmt->execute();
      echo json_encode(['exito'=>true]);
      exit;
    }
  $id = (int)($_POST['id'] ?? 0);
  $fecha = $_POST['fecha'] ?? null; // puede ser fecha o datetime
  $paciente_id = isset($_POST['paciente_id']) && $_POST['paciente_id'] !== '' ? (int)$_POST['paciente_id'] : null;
  $monto = floatval($_POST['monto'] ?? 0);
  $cita_id = isset($_POST['cita_id']) && $_POST['cita_id'] !== '' ? (int)$_POST['cita_id'] : null;
  $metodo_pago = trim($_POST['metodo_pago'] ?? 'efectivo');
  $referencia = trim($_POST['referencia'] ?? '');
  $estatus = trim($_POST['estatus'] ?? 'pagado');

    // Si no se envía cita_id, intentar resolver por paciente_id (última cita)
    if (empty($cita_id) && $paciente_id) {
      $s2 = $conn->prepare('SELECT cita_id FROM citas WHERE paciente_id = ? ORDER BY fecha_hora_inicio DESC LIMIT 1');
      $s2->bind_param('i', $paciente_id);
      $s2->execute();
      $r2 = $s2->get_result();
      $f2 = $r2->fetch_assoc();
      if ($f2 && isset($f2['cita_id'])) $cita_id = (int)$f2['cita_id'];
    }

    if (empty($cita_id) || $monto <= 0) {
      echo json_encode(['exito'=>false,'error'=>'cita_id y monto requeridos (si no envia cita_id, enviar paciente_id con cita previa).']); exit;
    }

    // Normalizar fecha a DATETIME para fecha_pago
    $fecha_pago = null;
    if ($fecha) {
      // si viene solo YYYY-MM-DD, añadimos tiempo 00:00:00
      if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) $fecha_pago = $fecha . ' 00:00:00';
      else $fecha_pago = $fecha;
    } else {
      $fecha_pago = date('Y-m-d H:i:s');
    }

    // validar método
    $metodos_validos = ['efectivo','tarjeta','transferencia'];
    if (!in_array($metodo_pago, $metodos_validos)) $metodo_pago = 'efectivo';

    if ($id>0) {
      $stmt = $conn->prepare('UPDATE pagos SET cita_id = ?, monto = ?, moneda = ?, metodo = ?, estatus = ?, referencia = ?, fecha_pago = ? WHERE pago_id = ?');
      $moneda = 'MXN';
      $stmt->bind_param('idsssssi', $cita_id, $monto, $moneda, $metodo_pago, $estatus, $referencia, $fecha_pago, $id);
      $stmt->execute();
      echo json_encode(['exito'=>true]); exit;
    } else {
      $stmt = $conn->prepare('INSERT INTO pagos (cita_id, monto, moneda, metodo, estatus, referencia, fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?)');
      $moneda = 'MXN';
      $stmt->bind_param('idsssss', $cita_id, $monto, $moneda, $metodo_pago, $estatus, $referencia, $fecha_pago);
      $stmt->execute();
      echo json_encode(['exito'=>true,'id'=>$conn->insert_id]); exit;
    }
  }
  echo json_encode($resp);
} catch (Exception $e) {
  echo json_encode(['exito'=>false,'error'=>$e->getMessage()]);
}

