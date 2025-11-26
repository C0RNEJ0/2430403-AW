<?php
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Requerir autenticación
session_start();
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['exito' => false, 'error' => 'No autenticado']);
    exit;
}

try {
  $conn = obtener_conexion_mysqli();
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  
  // Obtener rol e información del usuario
  $usuario_id = $_SESSION['usuario_id'];
  $rol = $_SESSION['rol'] ?? '';
  $medico_id_usuario = $_SESSION['medico_id'] ?? null;
  
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
    // Filtrar según el rol
    if ($rol === 'medico' && $medico_id_usuario) {
      // Los médicos solo se ven a sí mismos
      $sql = "SELECT m.medico_id, m.nombre, m.email, COALESCE(e.nombre,'') AS especialidad, COALESCE(m.horario,'') AS horario 
              FROM medicos m 
              LEFT JOIN especialidades e ON e.especialidad_id = m.especialidad_id 
              WHERE m.activo = 1 AND m.medico_id = ?
              ORDER BY m.nombre";
      $stmt = $conn->prepare($sql);
      $stmt->bind_param('i', $medico_id_usuario);
      $stmt->execute();
      $res = $stmt->get_result();
      $filas = [];
      while ($r = $res->fetch_assoc()) { $filas[] = $r; }
      $stmt->close();
    } elseif ($rol === 'secretaria' && $medico_id_usuario) {
      // Las secretarias solo ven a su médico asociado
      $sql = "SELECT m.medico_id, m.nombre, m.email, COALESCE(e.nombre,'') AS especialidad, COALESCE(m.horario,'') AS horario 
              FROM medicos m 
              LEFT JOIN especialidades e ON e.especialidad_id = m.especialidad_id 
              WHERE m.activo = 1 AND m.medico_id = ?
              ORDER BY m.nombre";
      $stmt = $conn->prepare($sql);
      $stmt->bind_param('i', $medico_id_usuario);
      $stmt->execute();
      $res = $stmt->get_result();
      $filas = [];
      while ($r = $res->fetch_assoc()) { $filas[] = $r; }
      $stmt->close();
    } else {
      // Admin ve todos los médicos
      $sql = "SELECT m.medico_id, m.nombre, m.email, COALESCE(e.nombre,'') AS especialidad, COALESCE(m.horario,'') AS horario FROM medicos m LEFT JOIN especialidades e ON e.especialidad_id = m.especialidad_id WHERE m.activo = 1 ORDER BY m.nombre";
      $res = $conn->query($sql);
      $filas = [];
      while ($r = $res->fetch_assoc()) { $filas[] = $r; }
    }
  }
  // devolver resultado
  echo json_encode(['exito' => true, 'datos' => $filas]);
} catch (Exception $e) {
  echo json_encode(['exito' => false, 'error' => $e->getMessage()]);
}
?>
