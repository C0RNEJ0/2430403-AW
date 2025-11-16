<?php
require_once __DIR__ . '/../config/bd_huevos.php';
header('Content-Type: application/json; charset=utf-8');
try{
  $conn = obtenerConexion();
  $metodo = $_SERVER['REQUEST_METHOD'];
  if ($metodo === 'GET'){
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id>0){
      $stmt = $conn->prepare('SELECT tarifa_id, especialidad, servicio, precio FROM tarifas WHERE tarifa_id = ? LIMIT 1');
      $stmt->bind_param('i',$id); $stmt->execute(); $res = $stmt->get_result(); $fila = $res->fetch_assoc(); echo json_encode(['exito'=>true,'datos'=>[$fila]]); exit;
    }
    $res = $conn->query('SELECT tarifa_id, especialidad, servicio, precio FROM tarifas ORDER BY especialidad, servicio'); $filas=[]; while($r=$res->fetch_assoc()) $filas[]=$r; echo json_encode(['exito'=>true,'datos'=>$filas]); exit;
  }
  if ($metodo === 'POST'){
    $accion = $_POST['accion'] ?? 'crear';
    if ($accion === 'eliminar'){
      $id = (int)($_POST['id']??0); $stmt = $conn->prepare('DELETE FROM tarifas WHERE tarifa_id = ? LIMIT 1'); $stmt->bind_param('i',$id); $stmt->execute(); echo json_encode(['exito'=>true]); exit;
    }
    $id = (int)($_POST['id']??0); $esp = trim($_POST['especialidad'] ?? ''); $serv = trim($_POST['servicio'] ?? ''); $precio = floatval($_POST['precio']??0);
    if (!$esp || !$serv) { echo json_encode(['exito'=>false,'error'=>'Especialidad y servicio requeridos']); exit; }
    if ($id>0){ $stmt = $conn->prepare('UPDATE tarifas SET especialidad=?, servicio=?, precio=? WHERE tarifa_id = ?'); $stmt->bind_param('ssdi',$esp,$serv,$precio,$id); $stmt->execute(); echo json_encode(['exito'=>true]); exit; }
    $stmt = $conn->prepare('INSERT INTO tarifas (especialidad, servicio, precio) VALUES (?,?,?)'); $stmt->bind_param('ssd',$esp,$serv,$precio); $stmt->execute(); echo json_encode(['exito'=>true,'id'=>$conn->insert_id]); exit;
  }
  echo json_encode(['exito'=>false]);
}catch(Exception $e){ echo json_encode(['exito'=>false,'error'=>$e->getMessage()]); }
