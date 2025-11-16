<?php
require_once __DIR__ . '/../config/bd_huevos.php';
header('Content-Type: application/json; charset=utf-8');
try{
  $conn = obtenerConexion();
  $desde = isset($_GET['desde']) ? $_GET['desde'] : null;
  $hasta = isset($_GET['hasta']) ? $_GET['hasta'] : null;
  // rango por defecto: hoy
  if(!$desde) $desde = date('Y-m-01');
  if(!$hasta) $hasta = date('Y-m-d');

  // total ingresos
  $stmt = $conn->prepare('SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE fecha BETWEEN ? AND ?');
  $stmt->bind_param('ss', $desde, $hasta);
  $stmt->execute(); $res = $stmt->get_result(); $t = $res->fetch_assoc(); $total = $t['total'] ?? 0; $stmt->close();

  // transacciones en rango
  $stmt = $conn->prepare('SELECT pago_id, fecha, paciente, medico, servicio, monto FROM pagos WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC');
  $stmt->bind_param('ss', $desde, $hasta);
  $stmt->execute(); $res = $stmt->get_result(); $trans = [];
  while($r = $res->fetch_assoc()) $trans[] = $r; $stmt->close();

  // total citas en rango (si existe tabla citas)
  $citas = 0; $pacientes_nuevos = 0;
  if ($conn->query("SHOW TABLES LIKE 'citas'")->num_rows) {
    $stmt = $conn->prepare('SELECT COUNT(*) AS c FROM citas WHERE fecha BETWEEN ? AND ?');
    $stmt->bind_param('ss', $desde, $hasta); $stmt->execute(); $res = $stmt->get_result(); $citas = ($res->fetch_assoc())['c'] ?? 0; $stmt->close();
  }
  if ($conn->query("SHOW TABLES LIKE 'pacientes'")->num_rows) {
    $stmt = $conn->prepare('SELECT COUNT(*) AS c FROM pacientes WHERE fecha_registro BETWEEN ? AND ?');
    $stmt->bind_param('ss', $desde, $hasta); $stmt->execute(); $res = $stmt->get_result(); $pacientes_nuevos = ($res->fetch_assoc())['c'] ?? 0; $stmt->close();
  }

  // agrupar por medico
  $stmt = $conn->prepare('SELECT medico, COALESCE(SUM(monto),0) AS total_medico FROM pagos WHERE fecha BETWEEN ? AND ? GROUP BY medico');
  $stmt->bind_param('ss', $desde, $hasta); $stmt->execute(); $res = $stmt->get_result(); $por_medico = [];
  while($r = $res->fetch_assoc()) $por_medico[] = $r; $stmt->close();

  echo json_encode(['exito'=>true,'datos'=>['total'=>$total,'transacciones'=>$trans,'citas'=>$citas,'pacientes_nuevos'=>$pacientes_nuevos,'por_medico'=>$por_medico]]);
}catch(Exception $e){ echo json_encode(['exito'=>false,'error'=>$e->getMessage()]); }
