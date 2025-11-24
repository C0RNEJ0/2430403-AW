<?php
require_once __DIR__ . '/../config/bd_huevos.php';

header('Content-Type: application/json; charset=utf-8');

try {
  $conn = obtener_conexion_mysqli();
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id>0) {
    // obtener médico por id
    $stmt = $conn->prepare('SELECT m.medico_id, m.nombre, m.email, m.telefono, m.cedula_profesional, m.especialidad_id, COALESCE(e.nombre,"") AS especialidad, COALESCE(m.horario,"") AS horario, m.activo FROM medicos m LEFT JOIN especialidades e ON e.especialidad_id = m.especialidad_id WHERE m.medico_id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $filas = []; // array de resultados
    while ($r = $res->fetch_assoc()) { $filas[] = $r; }
    $stmt->close();
  } else {
    $sql = "SELECT m.medico_id, m.nombre, m.email, COALESCE(e.nombre,'') AS especialidad, COALESCE(m.horario,'') AS horario FROM medicos m LEFT JOIN especialidades e ON e.especialidad_id = m.especialidad_id WHERE m.activo = 1 ORDER BY m.nombre";
    $res = $conn->query($sql);
    $filas = [];
    while ($r = $res->fetch_assoc()) { $filas[] = $r; }
  }
  // devolver resultado
  echo json_encode(['exito' => true, 'datos' => $filas]);
} catch (Exception $e) {
  echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
