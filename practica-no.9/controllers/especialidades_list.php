<?php
require_once __DIR__ . '/../config/bd_huevos.php';

header('Content-Type: application/json; charset=utf-8');

try {
  $conn = obtenerConexion();
  $res = $conn->query('SELECT especialidad_id, nombre, descripcion FROM especialidades ORDER BY nombre');
  $filas = [];
  while ($r = $res->fetch_assoc()) {
    $filas[] = $r;
  }
  echo json_encode(['exito' => true, 'datos' => $filas]);
} catch (Exception $e) {
  echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
