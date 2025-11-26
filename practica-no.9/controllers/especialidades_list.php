<?php
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Verificar autenticación
iniciarSesionSegura();
if (!estaAutenticado()) {
    echo json_encode(['exito' => false, 'error' => 'No autenticado']);
    exit;
}

try {
  // Obtener conexión
  $conn = obtener_conexion_mysqli();
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  
  // Obtener rol e información del usuario
  $usuario = obtenerUsuarioActual();
  $rol = $usuario['rol'] ?? '';
  $medico_id = $usuario['medico_id'] ?? null;
  
  if ($id>0) {
    // obtener especialidad por id
    $stmt = $conn->prepare('SELECT especialidad_id, nombre, descripcion FROM especialidades WHERE especialidad_id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $filas = [];
    while ($r = $res->fetch_assoc()) { $filas[] = $r; }
    $stmt->close();
  } else {
    // Filtrar según el rol
    if ($rol === 'medico' && $medico_id) {
      // Los médicos solo ven su propia especialidad
      $sql = 'SELECT e.especialidad_id, e.nombre, e.descripcion 
              FROM especialidades e
              INNER JOIN medicos m ON m.especialidad_id = e.especialidad_id
              WHERE m.medico_id = ?
              ORDER BY e.nombre';
      $stmt = $conn->prepare($sql);
      $stmt->bind_param('i', $medico_id);
      $stmt->execute();
      $res = $stmt->get_result();
      $filas = [];
      while ($r = $res->fetch_assoc()) { $filas[] = $r; }
      $stmt->close();
    } else {
      // Admin y secretaria ven todas las especialidades
      $res = $conn->query('SELECT especialidad_id, nombre, descripcion FROM especialidades ORDER BY nombre');
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
