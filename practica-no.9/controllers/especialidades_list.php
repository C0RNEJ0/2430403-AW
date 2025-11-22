<?php
require_once __DIR__ . '/../config/bd_huevos.php';

header('Content-Type: application/json; charset=utf-8');

try {
  // Obtener conexión
  $conn = obtenerConexion();
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id>0) {
    // obtener especialidad por id
    $stmt = $conn->prepare('SELECT especialidad_id, nombre, descripcion FROM especialidades WHERE especialidad_id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $filas = [];
    // obtener especialidad por id
    while ($r = $res->fetch_assoc()) { $filas[] = $r; }
    $stmt->close();
  } else {
    // obtener todas las especialidades
    $res = $conn->query('SELECT especialidad_id, nombre, descripcion FROM especialidades ORDER BY nombre');
    $filas = [];
    while ($r = $res->fetch_assoc()) { $filas[] = $r; }
  }
  // devolver resultado
  echo json_encode(['exito' => true, 'datos' => $filas]);
} catch (Exception $e) {
  echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
