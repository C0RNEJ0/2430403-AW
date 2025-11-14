<?php
require_once __DIR__ . '/../config/bd_huevos.php';

header('Content-Type: application/json; charset=utf-8');

try {
  $conn = obtenerConexion();
  $sql = "SELECT m.medico_id, m.nombre, m.email, COALESCE(e.nombre,'') AS especialidad, COALESCE(m.horario,'') AS horario FROM medicos m LEFT JOIN especialidades e ON e.especialidad_id = m.especialidad_id WHERE m.activo = 1 ORDER BY m.nombre";
  $res = $conn->query($sql);
  $filas = [];
  while ($r = $res->fetch_assoc()) {
    $filas[] = $r;
  }
  echo json_encode(['exito' => true, 'datos' => $filas]);
} catch (Exception $e) {
  echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
